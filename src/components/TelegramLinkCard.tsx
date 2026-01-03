import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2, Check, ExternalLink, RefreshCw } from 'lucide-react';

interface TelegramLinkCardProps {
  userId?: string;
  onSuccess?: () => void;
}

const TelegramLinkCard = ({ userId, onSuccess }: TelegramLinkCardProps) => {
  const [loading, setLoading] = useState(false);
  const [telegramLink, setTelegramLink] = useState<any>(null);
  const [verificationCode, setVerificationCode] = useState<string | null>(null);
  const [botUsername, setBotUsername] = useState<string>('ExodusDayZBot');

  useEffect(() => {
    if (userId) {
      fetchTelegramLink();
      fetchBotUsername();
    }
  }, [userId]);

  const fetchTelegramLink = async () => {
    if (!userId) return;

    const { data, error } = await supabase
      .from('telegram_users')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (data) {
      setTelegramLink(data);
      if (!data.is_verified && data.verification_code) {
        setVerificationCode(data.verification_code);
      }
    }
  };

  const fetchBotUsername = async () => {
    const { data } = await supabase
      .from('admin_settings')
      .select('value')
      .eq('key', 'TELEGRAM_BOT_USERNAME')
      .maybeSingle();
    
    if (data?.value) {
      setBotUsername(data.value);
    }
  };

  const generateVerificationCode = () => {
    return Math.random().toString(36).substring(2, 10).toUpperCase();
  };

  const handleLinkTelegram = async () => {
    if (!userId) return;
    
    setLoading(true);
    try {
      const code = generateVerificationCode();
      
      // Check if record exists
      const { data: existing } = await supabase
        .from('telegram_users')
        .select('id')
        .eq('user_id', userId)
        .maybeSingle();

      let error;
      if (existing) {
        const result = await supabase
          .from('telegram_users')
          .update({
            verification_code: code,
            is_verified: false,
          })
          .eq('user_id', userId);
        error = result.error;
      } else {
        const result = await supabase
          .from('telegram_users')
          .insert({
            user_id: userId,
            telegram_id: 0,
            verification_code: code,
            is_verified: false,
          });
        error = result.error;
      }

      if (error) throw error;

      setVerificationCode(code);
      toast.success('Код верифікації створено');
      fetchTelegramLink();
    } catch (error) {
      console.error('Error generating verification code:', error);
      toast.error('Помилка генерації коду');
    } finally {
      setLoading(false);
    }
  };

  const handleUnlink = async () => {
    if (!userId) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('telegram_users')
        .delete()
        .eq('user_id', userId);

      if (error) throw error;

      setTelegramLink(null);
      setVerificationCode(null);
      toast.success('Telegram відключено');
      onSuccess?.();
    } catch (error) {
      console.error('Error unlinking Telegram:', error);
      toast.error('Помилка відключення');
    } finally {
      setLoading(false);
    }
  };

  const openTelegramBot = () => {
    const startParam = verificationCode ? `?start=${verificationCode}` : '';
    window.open(`https://t.me/${botUsername}${startParam}`, '_blank');
  };

  const isVerified = telegramLink?.is_verified;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <svg className="h-6 w-6 text-[#0088cc]" viewBox="0 0 24 24" fill="currentColor">
            <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
          </svg>
          Telegram інтеграція
        </CardTitle>
        <CardDescription>
          Отримуйте сповіщення про замовлення та підтримку в Telegram
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isVerified ? (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Badge variant="default" className="bg-green-600">
                <Check className="h-3 w-3 mr-1" />
                Підключено
              </Badge>
              {telegramLink.telegram_username && (
                <span className="text-sm text-muted-foreground">
                  @{telegramLink.telegram_username}
                </span>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              Ви будете отримувати сповіщення про статус замовлень та відповіді підтримки.
            </p>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={openTelegramBot}
                className="flex-1"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Відкрити бот
              </Button>
              <Button 
                variant="destructive" 
                onClick={handleUnlink}
                disabled={loading}
              >
                {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Відключити
              </Button>
            </div>
          </div>
        ) : verificationCode ? (
          <div className="space-y-4">
            <div className="p-4 bg-muted rounded-lg text-center">
              <p className="text-sm text-muted-foreground mb-2">Ваш код верифікації:</p>
              <code className="text-2xl font-bold tracking-wider">{verificationCode}</code>
            </div>
            <p className="text-sm text-muted-foreground text-center">
              Натисніть кнопку нижче, щоб перейти в бот. Код підставиться автоматично.
            </p>
            <Button 
              onClick={openTelegramBot}
              className="w-full bg-[#0088cc] hover:bg-[#0077b5]"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Перейти в Telegram бот
            </Button>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={handleLinkTelegram}
                disabled={loading}
                className="flex-1"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Новий код
              </Button>
              <Button 
                variant="ghost" 
                onClick={fetchTelegramLink}
                disabled={loading}
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Оновити'}
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Прив'яжіть Telegram для отримання сповіщень про замовлення, 
              відповіді служби підтримки та швидкого доступу до балансу.
            </p>
            <Button 
              onClick={handleLinkTelegram}
              disabled={loading}
              className="w-full bg-[#0088cc] hover:bg-[#0077b5]"
            >
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Прив'язати Telegram
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TelegramLinkCard;
