import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

async function getAdminSetting(supabase: any, key: string): Promise<string | null> {
  const { data, error } = await supabase
    .from('admin_settings')
    .select('value')
    .eq('key', key)
    .maybeSingle();
  
  if (error || !data) return null;
  return data.value;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { steam_id } = await req.json();

    if (!steam_id) {
      return new Response(
        JSON.stringify({ error: 'Steam ID is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get Steam API key from admin settings
    const steamApiKey = await getAdminSetting(supabase, 'STEAM_API_KEY');

    if (!steamApiKey) {
      console.log('Steam API key not configured, returning basic data');
      return new Response(
        JSON.stringify({ 
          steam_id,
          personaname: `Steam User ${steam_id}`,
          avatarfull: null,
          message: 'Steam API key not configured'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch Steam user data
    const steamApiUrl = `https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/?key=${steamApiKey}&steamids=${steam_id}`;
    
    console.log('Fetching Steam profile for:', steam_id);
    
    const steamResponse = await fetch(steamApiUrl);
    const steamData = await steamResponse.json();

    if (!steamData.response?.players?.[0]) {
      return new Response(
        JSON.stringify({ 
          error: 'Steam user not found',
          steam_id 
        }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const player = steamData.response.players[0];
    
    console.log('Steam profile fetched:', player.personaname);

    return new Response(
      JSON.stringify({
        steam_id: player.steamid,
        personaname: player.personaname,
        avatarfull: player.avatarfull,
        avatarmedium: player.avatarmedium,
        avatar: player.avatar,
        profileurl: player.profileurl,
        personastate: player.personastate,
        loccountrycode: player.loccountrycode,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error fetching Steam profile:', errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
