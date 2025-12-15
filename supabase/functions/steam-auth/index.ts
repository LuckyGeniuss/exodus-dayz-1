import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.58.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SteamUser {
  steamid: string;
  personaname: string;
  avatarfull: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const url = new URL(req.url);
    const path = url.pathname;

    // Handle Steam callback
    if (path.includes('/callback')) {
      const claimedId = url.searchParams.get('openid.claimed_id');
      const identity = url.searchParams.get('openid.identity');
      
      if (!claimedId || !identity) {
        return new Response(
          JSON.stringify({ error: 'Invalid Steam response' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Extract Steam ID from claimed_id
      const steamIdMatch = claimedId.match(/\/id\/(\d+)$/);
      if (!steamIdMatch) {
        return new Response(
          JSON.stringify({ error: 'Could not extract Steam ID' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const steamId = steamIdMatch[1];
      console.log('Steam ID extracted:', steamId);

      // Verify with Steam API
      const verifyParams = new URLSearchParams({
        'openid.assoc_handle': url.searchParams.get('openid.assoc_handle') || '',
        'openid.signed': url.searchParams.get('openid.signed') || '',
        'openid.sig': url.searchParams.get('openid.sig') || '',
        'openid.ns': 'http://specs.openid.net/auth/2.0',
        'openid.mode': 'check_authentication',
        'openid.op_endpoint': 'https://steamcommunity.com/openid/login',
        'openid.claimed_id': claimedId,
        'openid.identity': identity,
        'openid.return_to': url.searchParams.get('openid.return_to') || '',
        'openid.response_nonce': url.searchParams.get('openid.response_nonce') || '',
      });

      const verifyResponse = await fetch('https://steamcommunity.com/openid/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: verifyParams.toString(),
      });

      const verifyText = await verifyResponse.text();
      if (!verifyText.includes('is_valid:true')) {
        console.error('Steam verification failed:', verifyText);
        return new Response(
          JSON.stringify({ error: 'Steam verification failed' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log('Steam verification successful');

      // Get user info from session (user must be logged in)
      const authHeader = req.headers.get('Authorization');
      if (!authHeader) {
        return new Response(
          JSON.stringify({ error: 'Not authenticated' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const token = authHeader.replace('Bearer ', '');
      const { data: { user }, error: userError } = await supabase.auth.getUser(token);

      if (userError || !user) {
        console.error('User auth error:', userError);
        return new Response(
          JSON.stringify({ error: 'Invalid authentication' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Update user profile with Steam ID
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ steam_id: steamId })
        .eq('id', user.id);

      if (updateError) {
        console.error('Error updating profile:', updateError);
        return new Response(
          JSON.stringify({ error: 'Failed to update profile' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log('Profile updated successfully for user:', user.id);

      // Return HTML page that closes popup and refreshes parent
      const successHtml = `
        <!DOCTYPE html>
        <html>
          <head><title>Steam Connected</title></head>
          <body>
            <script>
              if (window.opener) {
                window.opener.postMessage({ type: 'STEAM_AUTH_SUCCESS', steamId: '${steamId}' }, '*');
                window.close();
              } else {
                document.body.innerHTML = '<h2>Steam підключено успішно! Можете закрити це вікно.</h2>';
              }
            </script>
            <h2>Steam підключено успішно!</h2>
          </body>
        </html>
      `;

      return new Response(successHtml, { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'text/html' } 
      });
    }

    // Handle initial Steam login request
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Not authenticated' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid authentication' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Generate Steam OpenID URL
    const functionUrl = `${supabaseUrl}/functions/v1/steam-auth/callback`;
    const params = new URLSearchParams({
      'openid.ns': 'http://specs.openid.net/auth/2.0',
      'openid.mode': 'checkid_setup',
      'openid.return_to': functionUrl,
      'openid.realm': functionUrl.split('/functions')[0],
      'openid.identity': 'http://specs.openid.net/auth/2.0/identifier_select',
      'openid.claimed_id': 'http://specs.openid.net/auth/2.0/identifier_select',
    });

    const steamLoginUrl = `https://steamcommunity.com/openid/login?${params.toString()}`;

    return new Response(
      JSON.stringify({ url: steamLoginUrl }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Steam auth error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
