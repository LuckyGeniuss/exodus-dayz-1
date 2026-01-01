import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface SteamProfile {
  steam_id: string;
  personaname: string;
  avatarfull: string | null;
  avatarmedium: string | null;
  avatar: string | null;
  profileurl: string | null;
  personastate: number;
  loccountrycode: string | null;
}

export const useSteamProfile = (steamId: string | null) => {
  return useQuery({
    queryKey: ['steam-profile', steamId],
    queryFn: async (): Promise<SteamProfile | null> => {
      if (!steamId) return null;

      const { data, error } = await supabase.functions.invoke('steam-profile', {
        body: { steam_id: steamId },
      });

      if (error) {
        console.error('Error fetching Steam profile:', error);
        throw error;
      }

      return data as SteamProfile;
    },
    enabled: !!steamId,
    staleTime: 1000 * 60 * 10, // Cache for 10 minutes
    retry: 1,
  });
};
