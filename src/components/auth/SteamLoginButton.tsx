import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

interface SteamLoginButtonProps {
  onSuccess?: () => void;
  variant?: 'login' | 'register';
}

const SteamLoginButton = ({ onSuccess, variant = 'register' }: SteamLoginButtonProps) => {
  const [loading, setLoading] = useState(false);

  const handleSteamLogin = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('steam-auth', {
        body: { mode: 'register' },
      });

      if (error) throw error;

      if (data?.url) {
        const width = 800;
        const height = 600;
        const left = (window.screen.width - width) / 2;
        const top = (window.screen.height - height) / 2;
        
        const steamWindow = window.open(
          data.url,
          'SteamLogin',
          `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes`
        );

        const handleMessage = (event: MessageEvent) => {
          if (event.data?.type === 'STEAM_REGISTER_SUCCESS') {
            setLoading(false);
            toast.success('Реєстрація через Steam успішна!');
            window.removeEventListener('message', handleMessage);
            
            // Redirect to the magic link
            if (event.data.loginUrl) {
              window.location.href = event.data.loginUrl;
            } else if (onSuccess) {
              onSuccess();
            }
          } else if (event.data?.type === 'STEAM_AUTH_EXISTS') {
            setLoading(false);
            toast.info(event.data.message || 'Акаунт з цим Steam ID вже існує');
            window.removeEventListener('message', handleMessage);
          } else if (event.data?.type === 'STEAM_AUTH_ERROR') {
            setLoading(false);
            toast.error(event.data.error || 'Помилка авторизації');
            window.removeEventListener('message', handleMessage);
          }
        };
        
        window.addEventListener('message', handleMessage);

        const checkInterval = setInterval(() => {
          if (steamWindow?.closed) {
            clearInterval(checkInterval);
            setLoading(false);
            window.removeEventListener('message', handleMessage);
          }
        }, 500);

        setTimeout(() => {
          clearInterval(checkInterval);
          window.removeEventListener('message', handleMessage);
          setLoading(false);
        }, 300000);
      }
    } catch (error: any) {
      console.error('Steam login error:', error);
      toast.error(error.message || 'Помилка при авторизації через Steam');
      setLoading(false);
    }
  };

  return (
    <Button
      type="button"
      variant="outline"
      className="w-full bg-[#171a21] hover:bg-[#2a475e] text-white border-[#2a475e]"
      onClick={handleSteamLogin}
      disabled={loading}
    >
      {loading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Підключення...
        </>
      ) : (
        <>
          <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 0C5.373 0 0 5.373 0 12c0 5.303 3.438 9.8 8.207 11.387l.001-.001 3.023-4.394c-.265-.033-.533-.066-.8-.132-2.56-.645-4.147-3.26-3.502-5.82.645-2.561 3.26-4.147 5.82-3.502 2.56.645 4.147 3.26 3.502 5.82-.266 1.054-.84 1.934-1.612 2.6l2.198 3.2C20.49 18.58 24 15.678 24 12c0-6.627-5.373-12-12-12z"/>
          </svg>
          {variant === 'register' ? 'Реєстрація через Steam' : 'Увійти через Steam'}
        </>
      )}
    </Button>
  );
};

export default SteamLoginButton;
