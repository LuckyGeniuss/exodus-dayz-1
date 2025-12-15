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

    // Handle Steam callback (for both registration and linking)
    if (path.includes('/callback')) {
      const claimedId = url.searchParams.get('openid.claimed_id');
      const identity = url.searchParams.get('openid.identity');
      const mode = url.searchParams.get('mode'); // 'register' or 'link'
      
      if (!claimedId || !identity) {
        return new Response(
          `<!DOCTYPE html><html><body><h2>Помилка: Невірна відповідь Steam</h2></body></html>`,
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'text/html' } }
        );
      }

      // Extract Steam ID from claimed_id
      const steamIdMatch = claimedId.match(/\/id\/(\d+)$/);
      if (!steamIdMatch) {
        return new Response(
          `<!DOCTYPE html><html><body><h2>Помилка: Не вдалося отримати Steam ID</h2></body></html>`,
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'text/html' } }
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
          `<!DOCTYPE html><html><body><h2>Помилка: Верифікація Steam не вдалася</h2></body></html>`,
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'text/html' } }
        );
      }

      console.log('Steam verification successful');

      // Get Steam user info for registration
      let steamUser: SteamUser | null = null;
      const steamApiKey = Deno.env.get('STEAM_API_KEY');
      if (steamApiKey) {
        try {
          const steamUserResponse = await fetch(
            `https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/?key=${steamApiKey}&steamids=${steamId}`
          );
          const steamUserData = await steamUserResponse.json();
          if (steamUserData.response?.players?.[0]) {
            steamUser = steamUserData.response.players[0];
          }
        } catch (e) {
          console.error('Failed to get Steam user info:', e);
        }
      }

      // Check if this is a link request (user already authenticated)
      const authHeader = req.headers.get('Authorization');
      const stateParam = url.searchParams.get('state');
      
      // For linking: user passes JWT in state parameter
      if (stateParam) {
        try {
          const { data: { user }, error: userError } = await supabase.auth.getUser(stateParam);

          if (!userError && user) {
            // Check if Steam ID is already linked to another account
            const { data: existingProfile } = await supabase
              .from('profiles')
              .select('id')
              .eq('steam_id', steamId)
              .neq('id', user.id)
              .single();

            if (existingProfile) {
              return new Response(
                `<!DOCTYPE html><html><body>
                  <script>
                    if (window.opener) {
                      window.opener.postMessage({ type: 'STEAM_AUTH_ERROR', error: 'Цей Steam акаунт вже прив\\'язаний до іншого користувача' }, '*');
                      window.close();
                    }
                  </script>
                  <h2>Цей Steam акаунт вже прив'язаний до іншого користувача</h2>
                </body></html>`,
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'text/html' } }
              );
            }

            // Update user profile with Steam ID
            const { error: updateError } = await supabase
              .from('profiles')
              .update({ 
                steam_id: steamId,
                avatar_url: steamUser?.avatarfull || undefined
              })
              .eq('id', user.id);

            if (updateError) {
              console.error('Error updating profile:', updateError);
              return new Response(
                `<!DOCTYPE html><html><body><h2>Помилка оновлення профілю</h2></body></html>`,
                { status: 500, headers: { ...corsHeaders, 'Content-Type': 'text/html' } }
              );
            }

            console.log('Profile updated successfully for user:', user.id);

            return new Response(
              `<!DOCTYPE html><html><body>
                <script>
                  if (window.opener) {
                    window.opener.postMessage({ type: 'STEAM_AUTH_SUCCESS', steamId: '${steamId}' }, '*');
                    window.close();
                  }
                </script>
                <h2>Steam підключено успішно! Можете закрити це вікно.</h2>
              </body></html>`,
              { status: 200, headers: { ...corsHeaders, 'Content-Type': 'text/html' } }
            );
          }
        } catch (e) {
          console.error('Error verifying state token:', e);
        }
      }

      // For registration: check if Steam ID is already registered
      const { data: existingUser } = await supabase
        .from('profiles')
        .select('id')
        .eq('steam_id', steamId)
        .single();

      if (existingUser) {
        // User already exists - try to log them in
        // Since we can't sign in without password, redirect to login page
        return new Response(
          `<!DOCTYPE html><html><body>
            <script>
              if (window.opener) {
                window.opener.postMessage({ 
                  type: 'STEAM_AUTH_EXISTS', 
                  steamId: '${steamId}',
                  message: 'Акаунт з цим Steam ID вже існує. Увійдіть через email або прив\\'яжіть Steam у профілі.'
                }, '*');
                window.close();
              } else {
                window.location.href = '/auth?steam_exists=true';
              }
            </script>
            <h2>Акаунт з цим Steam ID вже існує</h2>
            <p>Увійдіть через email та прив'яжіть Steam у профілі.</p>
          </body></html>`,
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'text/html' } }
        );
      }

      // Create new user account with Steam ID
      const tempEmail = `steam_${steamId}@exodus.dayz.temp`;
      const tempPassword = crypto.randomUUID();
      
      const { data: signUpData, error: signUpError } = await supabase.auth.admin.createUser({
        email: tempEmail,
        password: tempPassword,
        email_confirm: true,
        user_metadata: {
          username: steamUser?.personaname || `Player_${steamId.slice(-6)}`,
          avatar_url: steamUser?.avatarfull,
          steam_id: steamId,
        }
      });

      if (signUpError) {
        console.error('Error creating user:', signUpError);
        return new Response(
          `<!DOCTYPE html><html><body><h2>Помилка створення акаунту: ${signUpError.message}</h2></body></html>`,
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'text/html' } }
        );
      }

      // Update profile with Steam ID
      if (signUpData.user) {
        await supabase
          .from('profiles')
          .update({ 
            steam_id: steamId,
            username: steamUser?.personaname || `Player_${steamId.slice(-6)}`,
            avatar_url: steamUser?.avatarfull
          })
          .eq('id', signUpData.user.id);
      }

      // Generate magic link for the new user to log in
      const { data: magicLinkData, error: magicLinkError } = await supabase.auth.admin.generateLink({
        type: 'magiclink',
        email: tempEmail,
        options: {
          redirectTo: `${url.origin.replace('/functions/v1/steam-auth', '')}/`
        }
      });

      let loginUrl = '/auth?steam_registered=true';
      if (magicLinkData?.properties?.action_link) {
        loginUrl = magicLinkData.properties.action_link;
      }

      console.log('New user created with Steam:', steamId);

      return new Response(
        `<!DOCTYPE html><html><body>
          <script>
            if (window.opener) {
              window.opener.postMessage({ 
                type: 'STEAM_REGISTER_SUCCESS', 
                steamId: '${steamId}',
                loginUrl: '${loginUrl}'
              }, '*');
              window.close();
            } else {
              window.location.href = '${loginUrl}';
            }
          </script>
          <h2>Реєстрація через Steam успішна!</h2>
          <p>Перенаправлення...</p>
        </body></html>`,
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'text/html' } }
      );
    }

    // Handle initial Steam login/register request
    const { mode } = await req.json().catch(() => ({ mode: 'link' }));
    
    let token = '';
    const authHeader = req.headers.get('Authorization');
    if (authHeader && mode === 'link') {
      token = authHeader.replace('Bearer ', '');
      const { data: { user }, error: userError } = await supabase.auth.getUser(token);

      if (userError || !user) {
        return new Response(
          JSON.stringify({ error: 'Not authenticated' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Generate Steam OpenID URL
    const functionUrl = `${supabaseUrl}/functions/v1/steam-auth/callback`;
    const returnTo = token ? `${functionUrl}?state=${token}&mode=${mode}` : `${functionUrl}?mode=${mode}`;
    
    const params = new URLSearchParams({
      'openid.ns': 'http://specs.openid.net/auth/2.0',
      'openid.mode': 'checkid_setup',
      'openid.return_to': returnTo,
      'openid.realm': supabaseUrl,
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
