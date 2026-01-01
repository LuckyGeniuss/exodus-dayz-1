import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface AdminSetting {
  id: string;
  key: string;
  value: string | null;
  description: string | null;
  is_encrypted: boolean;
}

export const useAdminSettings = () => {
  const { data: settings, isLoading, error } = useQuery({
    queryKey: ['admin-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('admin_settings')
        .select('*');

      if (error) throw error;
      return data as AdminSetting[];
    },
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  });

  const getSetting = (key: string): string | null => {
    const setting = settings?.find(s => s.key === key);
    return setting?.value || null;
  };

  return {
    settings,
    isLoading,
    error,
    getSetting,
  };
};
