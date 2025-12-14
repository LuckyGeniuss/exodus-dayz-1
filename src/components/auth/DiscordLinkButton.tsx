import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

interface DiscordLinkButtonProps {
  userId: string | undefined;
  currentDiscordId?: string | null;
  onSuccess?: () => void;
}

const DiscordLinkButton = ({ userId, currentDiscordId, onSuccess }: DiscordLinkButtonProps) => {
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [discordId, setDiscordId] = useState(currentDiscordId || '');

  const handleSaveDiscordId = async () => {
    if (!userId) {
      toast.error('Спочатку увійдіть в акаунт');
      return;
    }

    if (!discordId.trim()) {
      toast.error('Введіть Discord ID');
      return;
    }

    // Validate Discord ID format (snowflake: 17-19 digits)
    const discordIdRegex = /^\d{17,19}$/;
    if (!discordIdRegex.test(discordId.trim())) {
      toast.error('Невірний формат Discord ID. Введіть числовий ID (17-19 цифр)');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ discord_id: discordId.trim() })
        .eq('id', userId);

      if (error) throw error;

      toast.success('Discord ID успішно збережено');
      setIsEditing(false);
      if (onSuccess) onSuccess();
    } catch (error: any) {
      console.error('Discord link error:', error);
      toast.error(error.message || 'Помилка при збереженні Discord ID');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveDiscordId = async () => {
    if (!userId) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ discord_id: null })
        .eq('id', userId);

      if (error) throw error;

      toast.success('Discord ID видалено');
      setDiscordId('');
      if (onSuccess) onSuccess();
    } catch (error: any) {
      console.error('Discord unlink error:', error);
      toast.error(error.message || 'Помилка при видаленні Discord ID');
    } finally {
      setLoading(false);
    }
  };

  if (currentDiscordId && !isEditing) {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between p-4 rounded-lg bg-muted">
          <div>
            <Label>Discord ID</Label>
            <div className="text-lg font-mono">{currentDiscordId}</div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
              Змінити
            </Button>
            <Button 
              variant="destructive" 
              size="sm" 
              onClick={handleRemoveDiscordId}
              disabled={loading}
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Видалити
            </Button>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">
          ✓ Discord акаунт прив'язано для отримання сповіщень
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="discord_id">Discord ID</Label>
        <Input
          id="discord_id"
          value={discordId}
          onChange={(e) => setDiscordId(e.target.value)}
          placeholder="Введіть ваш Discord ID (наприклад: 123456789012345678)"
          disabled={loading}
        />
        <p className="text-xs text-muted-foreground">
          Щоб знайти свій Discord ID: Налаштування → Розширені → Режим розробника → ПКМ на своєму імені → Копіювати ID
        </p>
      </div>
      <div className="flex gap-2">
        <Button
          onClick={handleSaveDiscordId}
          disabled={loading || !userId || !discordId.trim()}
          className="flex-1"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Збереження...
            </>
          ) : (
            <>
              <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
              </svg>
              Зберегти Discord ID
            </>
          )}
        </Button>
        {isEditing && (
          <Button variant="outline" onClick={() => {
            setIsEditing(false);
            setDiscordId(currentDiscordId || '');
          }}>
            Скасувати
          </Button>
        )}
      </div>
    </div>
  );
};

export default DiscordLinkButton;
