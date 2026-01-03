import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.58.0';
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const orderRequestSchema = z.object({
  items: z.array(z.object({
    product: z.object({
      id: z.string().min(1).max(50),
    }),
    quantity: z.number().int().positive().min(1).max(100),
  })).min(1, "Order must contain at least one item").max(50, "Order cannot contain more than 50 items"),
  paymentMethod: z.enum(['balance', 'card', 'usdt'], {
    errorMap: () => ({ message: "Invalid payment method. Must be 'balance', 'card', or 'usdt'" })
  }),
});

Deno.serve(async (req) => {
  const startTime = Date.now();
  const ipAddress = req.headers.get('x-forwarded-for') || 'unknown';
  const userAgent = req.headers.get('user-agent') || 'unknown';
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const {
      data: { user },
    } = await supabaseClient.auth.getUser();

    if (!user) {
      console.error('Unauthorized: No user found');
      await supabaseClient.from('edge_function_logs').insert({
        function_name: 'create-order',
        operation: 'order_creation',
        status: 'error',
        error_message: 'Unauthorized',
        ip_address: ipAddress,
        user_agent: userAgent,
        duration_ms: Date.now() - startTime,
      });
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 401,
        }
      );
    }

    // Check rate limit: 20 orders per 5 minutes
    const serviceClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );
    
    const { data: rateLimitOk } = await serviceClient.rpc('check_rate_limit', {
      _user_id: user.id,
      _ip_address: ipAddress,
      _endpoint: 'create-order',
      _max_requests: 20,
      _window_minutes: 5,
    });

    if (!rateLimitOk) {
      console.warn('Rate limit exceeded for user:', user.id);
      await supabaseClient.from('edge_function_logs').insert({
        user_id: user.id,
        function_name: 'create-order',
        operation: 'order_creation',
        status: 'error',
        error_message: 'Rate limit exceeded',
        ip_address: ipAddress,
        user_agent: userAgent,
        duration_ms: Date.now() - startTime,
      });
      return new Response(
        JSON.stringify({ error: 'Too many orders. Please try again later.' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 429,
        }
      );
    }

    const requestBody = await req.json();
    
    // Validate request with Zod
    const validationResult = orderRequestSchema.safeParse(requestBody);
    
    if (!validationResult.success) {
      const firstError = validationResult.error.errors[0];
      console.error('Invalid order request:', firstError);
      await supabaseClient.from('edge_function_logs').insert({
        user_id: user.id,
        function_name: 'create-order',
        operation: 'order_creation',
        status: 'error',
        error_message: `Validation error: ${firstError.message}`,
        ip_address: ipAddress,
        user_agent: userAgent,
        duration_ms: Date.now() - startTime,
      });
      return new Response(
        JSON.stringify({ 
          error: 'Invalid order data',
          details: firstError.message 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      );
    }

    const { items, paymentMethod } = validationResult.data;
    
    console.log('Creating order:', { 
      userId: user.id, 
      itemsCount: items.length,
      paymentMethod
    });

    // Fetch products from database for server-side price validation
    const productIds = items.map((item: any) => item.product.id);
    const { data: products, error: productsError } = await supabaseClient
      .from('products')
      .select('*')
      .in('id', productIds);

    if (productsError || !products) {
      console.error('Error fetching products:', productsError);
      return new Response(
        JSON.stringify({ error: 'Failed to validate products' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      );
    }

    // Fetch user profile for veteran status
    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('is_veteran, balance')
      .eq('id', user.id)
      .single();

    if (profileError) {
      console.error('Error fetching profile:', profileError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch user profile' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      );
    }

    // Calculate total amount server-side
    let totalAmount = 0;
    const validatedItems = [];

    for (const item of items) {
      const product = products.find(p => p.id === item.product.id);
      if (!product) {
        console.error('Product not found:', item.product.id);
        return new Response(
          JSON.stringify({ error: `Product not found: ${item.product.id}` }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
          }
        );
      }

      // Quantity is already validated as integer by Zod, no need to parseInt
      const quantity = item.quantity;

      totalAmount += parseFloat(product.price) * quantity;
      validatedItems.push({
        product_id: product.id,
        product_name: product.name,
        product_price: product.price,
        quantity: quantity
      });
    }

    // Apply veteran discount (10%)
    const isVeteran = profile?.is_veteran || false;
    const discountAmount = isVeteran ? totalAmount * 0.1 : 0;
    const finalAmount = totalAmount - discountAmount;

    console.log('Server-calculated prices:', {
      totalAmount,
      discountAmount,
      finalAmount,
      isVeteran
    });

    // If payment method is balance, verify sufficient balance
    if (paymentMethod === 'balance') {
      if (!profile || parseFloat(profile.balance) < finalAmount) {
        console.error('Insufficient balance:', {
          required: finalAmount,
          available: profile?.balance || 0
        });
        return new Response(
          JSON.stringify({ error: 'Insufficient balance' }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
          }
        );
      }
    }

    // Create order
    const { data: order, error: orderError } = await supabaseClient
      .from('orders')
      .insert({
        user_id: user.id,
        total_amount: totalAmount,
        discount_amount: discountAmount,
        final_amount: finalAmount,
        payment_method: paymentMethod,
        payment_status: paymentMethod === 'balance' ? 'completed' : 'pending',
      })
      .select()
      .single();

    if (orderError) {
      console.error('Error creating order:', orderError);
      return new Response(
        JSON.stringify({ error: 'Failed to create order' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      );
    }

    console.log('Order created:', order.id);

    // Insert order items using validated data
    const orderItemsData = validatedItems.map((item) => ({
      order_id: order.id,
      ...item
    }));

    const { error: itemsError } = await supabaseClient
      .from('order_items')
      .insert(orderItemsData);

    if (itemsError) {
      console.error('Error creating order items:', itemsError);
      return new Response(
        JSON.stringify({ error: 'Failed to create order items' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      );
    }

    console.log('Order items created');

    // If payment method is balance, safely deduct from user's balance
    if (paymentMethod === 'balance') {
      const { data: deductSuccess, error: deductError } = await supabaseClient.rpc('safe_deduct_balance', {
        user_id: user.id,
        amount: finalAmount,
      });

      if (deductError || !deductSuccess) {
        console.error('Error deducting balance:', deductError);
        return new Response(
          JSON.stringify({ error: 'Failed to deduct balance. Insufficient funds or transaction error.' }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
          }
        );
      }

      console.log('Balance deducted successfully');

      // Create transaction record
      const { error: transactionError } = await supabaseClient
        .from('balance_transactions')
        .insert({
          user_id: user.id,
          amount: -finalAmount,
          type: 'purchase',
          status: 'completed',
          description: `Order #${order.id.slice(0, 8)}`,
          payment_method: 'balance',
        });

      if (transactionError) {
        console.error('Transaction creation error:', transactionError);
      }

      console.log('Transaction record created');
    }

    // Send Discord notification (fire and forget)
    try {
      const discordUrl = Deno.env.get('SUPABASE_URL') ?? '';
      await fetch(`${discordUrl}/functions/v1/discord-notify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`,
        },
        body: JSON.stringify({
          order_id: order.id,
          user_email: user.email,
          total_amount: finalAmount,
          payment_method: paymentMethod,
          items: validatedItems,
        }),
      });
      console.log('Discord notification sent');
    } catch (discordError) {
      console.error('Failed to send Discord notification:', discordError);
      // Don't fail the order if Discord notification fails
    }

    // Send Telegram notification (fire and forget)
    try {
      const telegramUrl = Deno.env.get('SUPABASE_URL') ?? '';
      await fetch(`${telegramUrl}/functions/v1/telegram-notify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`,
        },
        body: JSON.stringify({
          type: 'new_order',
          data: {
            order_id: order.id,
            user_email: user.email,
            total_amount: finalAmount,
            payment_method: paymentMethod,
            items: validatedItems,
          },
        }),
      });
      console.log('Telegram notification sent');
    } catch (telegramError) {
      console.error('Failed to send Telegram notification:', telegramError);
      // Don't fail the order if Telegram notification fails
    }

    await supabaseClient.from('edge_function_logs').insert({
      user_id: user.id,
      function_name: 'create-order',
      operation: 'order_creation',
      status: 'success',
      request_data: { itemsCount: items?.length, paymentMethod, finalAmount },
      response_data: { order_id: order.id, payment_status: order.payment_status },
      ip_address: ipAddress,
      user_agent: userAgent,
      duration_ms: Date.now() - startTime,
    });

    return new Response(
      JSON.stringify({ 
        success: true, 
        order_id: order.id,
        payment_status: order.payment_status,
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error creating order:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    // Try to log error if we have supabase client
    try {
      const supabaseClient = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_ANON_KEY') ?? '',
        {
          global: {
            headers: { Authorization: req.headers.get('Authorization')! },
          },
        }
      );
      
      await supabaseClient.from('edge_function_logs').insert({
        function_name: 'create-order',
        operation: 'order_creation',
        status: 'error',
        error_message: errorMessage,
        ip_address: ipAddress,
        user_agent: userAgent,
        duration_ms: Date.now() - startTime,
      });
    } catch (logError) {
      console.error('Failed to log error:', logError);
    }
    
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
