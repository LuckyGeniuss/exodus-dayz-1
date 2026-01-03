import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.58.0';
import { Resend } from 'https://esm.sh/resend@2.0.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { broadcastId } = await req.json();

    // Get broadcast details
    const { data: broadcast, error: broadcastError } = await supabase
      .from('broadcast_messages')
      .select('*')
      .eq('id', broadcastId)
      .single();

    if (broadcastError || !broadcast) {
      throw new Error('Broadcast not found');
    }

    // Update status to sending
    await supabase
      .from('broadcast_messages')
      .update({ status: 'sending' })
      .eq('id', broadcastId);

    // Get target users
    let usersQuery = supabase
      .from('profiles')
      .select('id, username');

    if (broadcast.target_audience === 'veterans') {
      usersQuery = usersQuery.eq('is_veteran', true);
    } else if (broadcast.target_audience === 'active_users') {
      // Get users who made at least one order
      const { data: activeUserIds } = await supabase
        .from('orders')
        .select('user_id')
        .eq('payment_status', 'completed');
      
      const uniqueIds = [...new Set(activeUserIds?.map(o => o.user_id))];
      if (uniqueIds.length > 0) {
        usersQuery = usersQuery.in('id', uniqueIds);
      }
    } else if (broadcast.target_audience === 'admins') {
      const { data: adminRoles } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'admin');
      
      const adminIds = adminRoles?.map(r => r.user_id) || [];
      if (adminIds.length > 0) {
        usersQuery = usersQuery.in('id', adminIds);
      }
    }

    const { data: users } = await usersQuery;

    if (!users || users.length === 0) {
      await supabase
        .from('broadcast_messages')
        .update({ status: 'failed', failed_count: 0 })
        .eq('id', broadcastId);
      
      return new Response(
        JSON.stringify({ error: 'No users found for target audience' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let sentCount = 0;
    let failedCount = 0;

    // Get Resend API key for email
    const { data: settings } = await supabase
      .from('admin_settings')
      .select('key, value')
      .in('key', ['RESEND_API_KEY']);

    const resendApiKey = settings?.find(s => s.key === 'RESEND_API_KEY')?.value;

    // Send notifications
    for (const user of users) {
      try {
        // Create in-app notification
        await supabase.from('notifications').insert({
          user_id: user.id,
          type: 'broadcast',
          title: broadcast.title,
          message: broadcast.message,
          data: { broadcast_id: broadcastId },
        });

        // Send push notification if enabled
        if (broadcast.type === 'push' || broadcast.type === 'both') {
          const { data: pushSubs } = await supabase
            .from('push_subscriptions')
            .select('*')
            .eq('user_id', user.id);

          if (pushSubs && pushSubs.length > 0) {
            // Push notifications would be sent here
            console.log('Push notification would be sent to user:', user.id);
          }
        }

        // Send email if enabled and Resend is configured
        if ((broadcast.type === 'email' || broadcast.type === 'both') && resendApiKey) {
          try {
            // Get user email from auth
            const { data: { user: authUser } } = await supabase.auth.admin.getUserById(user.id);
            
            if (authUser?.email) {
              const resend = new Resend(resendApiKey);
              
              await resend.emails.send({
                from: 'Exodus Shop <noreply@resend.dev>',
                to: [authUser.email],
                subject: broadcast.title,
                html: `
                  <h1>${broadcast.title}</h1>
                  <p>${broadcast.message.replace(/\n/g, '<br>')}</p>
                  <hr>
                  <p style="color: #666; font-size: 12px;">Exodus DayZ Shop</p>
                `,
              });
            }
          } catch (emailError) {
            console.error('Email error for user:', user.id, emailError);
          }
        }

        sentCount++;
      } catch (error) {
        console.error('Error sending to user:', user.id, error);
        failedCount++;
      }
    }

    // Update broadcast status
    await supabase
      .from('broadcast_messages')
      .update({
        status: failedCount === users.length ? 'failed' : 'sent',
        sent_count: sentCount,
        failed_count: failedCount,
        sent_at: new Date().toISOString(),
      })
      .eq('id', broadcastId);

    console.log(`Broadcast ${broadcastId} completed: ${sentCount} sent, ${failedCount} failed`);

    return new Response(
      JSON.stringify({ success: true, sent: sentCount, failed: failedCount }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Broadcast error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
