import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.58.0';
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const paymentRequestSchema = z.object({
  amount: z.number().positive("Amount must be positive").min(1, "Amount must be at least 1").max(1000000, "Amount cannot exceed 1,000,000"),
});

interface PaymentRequest {
  amount: number;
  userId: string;
}

interface WayforpayCallback {
  merchantAccount: string;
  orderReference: string;
  amount: number;
  currency: string;
  authCode: string;
  cardPan: string;
  transactionStatus: string;
  reasonCode: string;
  merchantSignature: string;
  [key: string]: any;
}

async function generateSignature(params: string[], secretKey: string): Promise<string> {
  const signString = params.join(';');
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secretKey);
  const messageData = encoder.encode(signString);
  
  const key = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  
  const signature = await crypto.subtle.sign('HMAC', key, messageData);
  const hashArray = Array.from(new Uint8Array(signature));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

Deno.serve(async (req) => {
  const startTime = Date.now();
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Try to get settings from admin_settings first, fallback to env vars
    const { data: settings } = await supabase
      .from('admin_settings')
      .select('key, value')
      .in('key', ['WAYFORPAY_MERCHANT_ACCOUNT', 'WAYFORPAY_SECRET_KEY']);

    const settingsMap = new Map(settings?.map(s => [s.key, s.value]) || []);
    
    const merchantAccount = settingsMap.get('WAYFORPAY_MERCHANT_ACCOUNT') || Deno.env.get('WAYFORPAY_MERCHANT_ACCOUNT');
    const secretKey = settingsMap.get('WAYFORPAY_SECRET_KEY') || Deno.env.get('WAYFORPAY_SECRET_KEY');

    if (!merchantAccount || !secretKey) {
      console.error('WayForPay credentials not configured');
      return new Response(
        JSON.stringify({ error: 'Payment system not configured. Please contact administrator.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const url = new URL(req.url);
    const path = url.pathname;
    const ipAddress = req.headers.get('x-forwarded-for') || 'unknown';
    const userAgent = req.headers.get('user-agent') || 'unknown';

    // Handle payment callback from Wayforpay
    if (path.includes('/callback') && req.method === 'POST') {
      const callback: WayforpayCallback = await req.json();
      
      console.log('Wayforpay callback received:', callback);

      // Verify signature
      const signatureParams = [
        callback.merchantAccount,
        callback.orderReference,
        callback.amount.toString(),
        callback.currency,
        callback.authCode,
        callback.cardPan,
        callback.transactionStatus,
        callback.reasonCode,
      ];
      
      const expectedSignature = await generateSignature(signatureParams, secretKey);
      
      if (callback.merchantSignature !== expectedSignature) {
        console.error('Invalid signature');
        return new Response(
          JSON.stringify({ error: 'Invalid signature' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Extract user_id from orderReference (format: "deposit_userId_timestamp")
      const orderParts = callback.orderReference.split('_');
      if (orderParts.length !== 3 || orderParts[0] !== 'deposit') {
        console.error('Invalid order reference format');
        return new Response(
          JSON.stringify({ error: 'Invalid order reference' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const userId = orderParts[1];
      const amount = callback.amount;

      // Check transaction status
      if (callback.transactionStatus === 'Approved') {
        // Get current balance
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('balance')
          .eq('id', userId)
          .single();

        if (profileError) {
          console.error('Error fetching profile:', profileError);
          return new Response(
            JSON.stringify({ error: 'Failed to fetch profile' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const currentBalance = Number(profile.balance) || 0;
        const newBalance = currentBalance + amount;

        // Update user balance
        const { error: balanceError } = await supabase
          .from('profiles')
          .update({ balance: newBalance })
          .eq('id', userId);

        if (balanceError) {
          console.error('Error updating balance:', balanceError);
          return new Response(
            JSON.stringify({ error: 'Failed to update balance' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Create transaction record
        const { error: transactionError } = await supabase
          .from('balance_transactions')
          .insert({
            user_id: userId,
            amount: amount,
            type: 'deposit',
            status: 'completed',
            payment_method: 'card',
            description: `Поповнення через картку (${callback.cardPan})`,
          });

        if (transactionError) {
          console.error('Error creating transaction:', transactionError);
        }

        console.log('Payment processed successfully for user:', userId);
        
        // Return success response to Wayforpay
        return new Response(
          JSON.stringify({ 
            orderReference: callback.orderReference,
            status: 'accept',
            time: Date.now(),
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      } else {
        console.log('Transaction not approved:', callback.transactionStatus);
        
        // Create failed transaction record
        await supabase
          .from('balance_transactions')
          .insert({
            user_id: userId,
            amount: amount,
            type: 'deposit',
            status: 'failed',
            payment_method: 'card',
            description: `Невдала спроба поповнення: ${callback.reasonCode}`,
          });

        return new Response(
          JSON.stringify({ 
            orderReference: callback.orderReference,
            status: 'decline',
            time: Date.now(),
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Handle payment initiation
    if (req.method === 'POST') {
      const authHeader = req.headers.get('Authorization');
      if (!authHeader) {
        await supabase.from('edge_function_logs').insert({
          function_name: 'wayforpay-payment',
          operation: 'payment_init',
          status: 'error',
          error_message: 'Not authenticated',
          ip_address: ipAddress,
          user_agent: userAgent,
          duration_ms: Date.now() - startTime,
        });
        return new Response(
          JSON.stringify({ error: 'Not authenticated' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const token = authHeader.replace('Bearer ', '');
      const { data: { user }, error: userError } = await supabase.auth.getUser(token);

      if (userError || !user) {
        await supabase.from('edge_function_logs').insert({
          function_name: 'wayforpay-payment',
          operation: 'payment_init',
          status: 'error',
          error_message: 'Invalid authentication',
          ip_address: ipAddress,
          user_agent: userAgent,
          duration_ms: Date.now() - startTime,
        });
        return new Response(
          JSON.stringify({ error: 'Invalid authentication' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Check rate limit: 5 payment attempts per minute
      const { data: rateLimitOk } = await supabase.rpc('check_rate_limit', {
        _user_id: user.id,
        _ip_address: ipAddress,
        _endpoint: 'wayforpay-payment',
        _max_requests: 5,
        _window_minutes: 1,
      });

      if (!rateLimitOk) {
        console.warn('Rate limit exceeded for user:', user.id);
        await supabase.from('edge_function_logs').insert({
          user_id: user.id,
          function_name: 'wayforpay-payment',
          operation: 'payment_init',
          status: 'error',
          error_message: 'Rate limit exceeded',
          ip_address: ipAddress,
          user_agent: userAgent,
          duration_ms: Date.now() - startTime,
        });
        return new Response(
          JSON.stringify({ error: 'Too many requests. Please try again later.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const requestBody = await req.json();
      
      // Validate request with Zod
      const validationResult = paymentRequestSchema.safeParse(requestBody);
      
      if (!validationResult.success) {
        const firstError = validationResult.error.errors[0];
        console.error('Invalid payment request:', firstError);
        await supabase.from('edge_function_logs').insert({
          user_id: user.id,
          function_name: 'wayforpay-payment',
          operation: 'payment_init',
          status: 'error',
          error_message: `Validation error: ${firstError.message}`,
          ip_address: ipAddress,
          user_agent: userAgent,
          duration_ms: Date.now() - startTime,
        });
        return new Response(
          JSON.stringify({ 
            error: 'Invalid payment data',
            details: firstError.message 
          }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      const { amount } = validationResult.data;

      // Get user profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('username')
        .eq('id', user.id)
        .single();

      if (profileError) {
        console.error('Error fetching profile:', profileError);
        return new Response(
          JSON.stringify({ error: 'Failed to fetch profile' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Generate order reference
      const orderReference = `deposit_${user.id}_${Date.now()}`;
      const orderDate = Math.floor(Date.now() / 1000);
      
      // Prepare Wayforpay request
      const productName = ['Поповнення балансу'];
      const productPrice = [amount];
      const productCount = [1];
      
      const signatureParams = [
        merchantAccount,
        supabaseUrl.replace('https://', ''),
        orderReference,
        orderDate.toString(),
        amount.toString(),
        'UAH',
        ...productName,
        ...productCount.map(String),
        ...productPrice.map(String),
      ];
      
      const merchantSignature = await generateSignature(signatureParams, secretKey);
      
      const returnUrl = `${supabaseUrl.replace('https://', 'https://app.')}/balance`;
      const callbackUrl = `${supabaseUrl}/functions/v1/wayforpay-payment/callback`;

      const paymentData = {
        merchantAccount,
        merchantDomainName: supabaseUrl.replace('https://', ''),
        orderReference,
        orderDate,
        amount,
        currency: 'UAH',
        productName,
        productCount,
        productPrice,
        clientEmail: user.email,
        clientFirstName: profile?.username || 'User',
        clientLastName: '',
        merchantSignature,
        returnUrl,
        serviceUrl: callbackUrl,
        language: 'UA',
      };

      console.log('Creating payment for user:', user.id, 'amount:', amount);

      // Send request to Wayforpay
      const wayforpayResponse = await fetch('https://api.wayforpay.com/api', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(paymentData),
      });

      const wayforpayResult = await wayforpayResponse.json();
      
      console.log('Wayforpay response:', wayforpayResult);

      if (wayforpayResult.reason === 'Ok' && wayforpayResult.invoiceUrl) {
        // Create pending transaction
        await supabase
          .from('balance_transactions')
          .insert({
            user_id: user.id,
            amount: amount,
            type: 'deposit',
            status: 'pending',
            payment_method: 'card',
            description: `Очікування оплати через картку`,
          });

        await supabase.from('edge_function_logs').insert({
          user_id: user.id,
          function_name: 'wayforpay-payment',
          operation: 'payment_init',
          status: 'success',
          request_data: { amount, orderReference },
          response_data: { url: wayforpayResult.invoiceUrl },
          ip_address: ipAddress,
          user_agent: userAgent,
          duration_ms: Date.now() - startTime,
        });

        return new Response(
          JSON.stringify({ 
            url: wayforpayResult.invoiceUrl,
            orderReference,
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      } else {
        console.error('Wayforpay error:', wayforpayResult);
        await supabase.from('edge_function_logs').insert({
          user_id: user.id,
          function_name: 'wayforpay-payment',
          operation: 'payment_init',
          status: 'error',
          error_message: wayforpayResult.reasonCode || 'Payment creation failed',
          request_data: { amount },
          response_data: wayforpayResult,
          ip_address: ipAddress,
          user_agent: userAgent,
          duration_ms: Date.now() - startTime,
        });
        return new Response(
          JSON.stringify({ error: wayforpayResult.reasonCode || 'Payment creation failed' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Wayforpay payment error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
