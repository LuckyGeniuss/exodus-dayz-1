import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { X } from 'lucide-react';
import { useState, useEffect } from 'react';

const ShopBanner = () => {
  const [isDismissed, setIsDismissed] = useState(false);

  const { data: settings } = useQuery({
    queryKey: ['shop-banner-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('admin_settings')
        .select('key, value')
        .in('key', ['shop_banner_enabled', 'shop_banner_text']);

      if (error) throw error;
      
      const settingsMap: Record<string, string> = {};
      data?.forEach(s => {
        if (s.value) settingsMap[s.key] = s.value;
      });
      return settingsMap;
    },
    staleTime: 60000, // Cache for 1 minute
  });

  // Check if dismissed in this session
  useEffect(() => {
    const dismissed = sessionStorage.getItem('shop_banner_dismissed');
    if (dismissed === 'true') {
      setIsDismissed(true);
    }
  }, []);

  const handleDismiss = () => {
    setIsDismissed(true);
    sessionStorage.setItem('shop_banner_dismissed', 'true');
  };

  const isEnabled = settings?.shop_banner_enabled === 'true';
  const bannerText = settings?.shop_banner_text;

  if (!isEnabled || !bannerText || isDismissed) {
    return null;
  }

  return (
    <div className="bg-primary text-primary-foreground py-2 px-4 relative">
      <div className="container mx-auto text-center text-sm font-medium pr-8">
        {bannerText}
      </div>
      <button
        onClick={handleDismiss}
        className="absolute right-4 top-1/2 -translate-y-1/2 p-1 hover:bg-primary-foreground/10 rounded"
        aria-label="Закрити банер"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
};

export default ShopBanner;
