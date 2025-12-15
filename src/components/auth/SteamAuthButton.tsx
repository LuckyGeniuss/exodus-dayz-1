import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

interface SteamAuthButtonProps {
  userId: string | undefined;
  onSuccess?: () => void;
}

const SteamAuthButton = ({ userId, onSuccess }: SteamAuthButtonProps) => {
  const [loading, setLoading] = useState(false);

  const handleSteamAuth = async () => {
    if (!userId) {
      toast.error('Спочатку увійдіть в акаунт');
      return;
    }

    setLoading(true);
    try {
      const { data: session } = await supabase.auth.getSession();
      
      if (!session.session) {
        toast.error('Не вдалося отримати сесію');
        setLoading(false);
        return;
      }

      const { data, error } = await supabase.functions.invoke('steam-auth', {
        headers: {
          Authorization: `Bearer ${session.session.access_token}`,
        },
      });

      if (error) throw error;

      if (data?.url) {
        // Open Steam login in new window
        const width = 800;
        const height = 600;
        const left = (window.screen.width - width) / 2;
        const top = (window.screen.height - height) / 2;
        
        const steamWindow = window.open(
          data.url,
          'SteamLogin',
          `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes`
        );

        // Listen for success message from popup
        const handleMessage = (event: MessageEvent) => {
          if (event.data?.type === 'STEAM_AUTH_SUCCESS') {
            setLoading(false);
            if (onSuccess) onSuccess();
            window.removeEventListener('message', handleMessage);
          }
        };
        window.addEventListener('message', handleMessage);

        // Fallback: poll for window close
        const checkInterval = setInterval(() => {
          if (steamWindow?.closed) {
            clearInterval(checkInterval);
            setLoading(false);
            window.removeEventListener('message', handleMessage);
            if (onSuccess) onSuccess();
          }
        }, 500);

        setTimeout(() => {
          clearInterval(checkInterval);
          window.removeEventListener('message', handleMessage);
          setLoading(false);
        }, 300000);
      }
    } catch (error: any) {
      console.error('Steam auth error:', error);
      toast.error(error.message || 'Помилка при підключенні Steam');
      setLoading(false);
    }
  };

  return (
    <Button
      variant="outline"
      className="w-full"
      onClick={handleSteamAuth}
      disabled={loading || !userId}
    >
      {loading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Підключення...
        </>
      ) : (
        <>
          <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2a10 10 0 0 0-10 10 10 10 0 0 0 10 10 10 10 0 0 0 10-10A10 10 0 0 0 12 2zm0 18a8 8 0 0 1-8-8 8 8 0 0 1 8-8 8 8 0 0 1 8 8 8 8 0 0 1-8 8z"/>
            <path d="M15.5 8.5a2.5 2.5 0 0 0-2.5 2.5 2.5 2.5 0 0 0 2.5 2.5 2.5 2.5 0 0 0 2.5-2.5 2.5 2.5 0 0 0-2.5-2.5zm-7-1a4 4 0 0 0-4 4 4 4 0 0 0 4 4l2-2a2 2 0 0 1-2-2 2 2 0 0 1 2-2z"/>
          </svg>
          Підключити Steam
        </>
      )}
    </Button>
  );
};

export default SteamAuthButton;
