import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, Save, Eye, EyeOff, Key, RefreshCw, ShieldAlert, Lock } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/components/auth/AuthProvider';

interface AdminSetting {
  id: string;
  key: string;
  value: string | null;
  description: string | null;
  is_encrypted: boolean;
  updated_at: string;
}

const API_KEYS = [
  { key: 'WAYFORPAY_MERCHANT_ACCOUNT', label: 'WayForPay Merchant Account', icon: '💳', link: 'https://wayforpay.com' },
  { key: 'WAYFORPAY_SECRET_KEY', label: 'WayForPay Secret Key', icon: '🔐', link: 'https://wayforpay.com' },
  { key: 'NOWPAYMENTS_API_KEY', label: 'NOWPayments API Key', icon: '₿', link: 'https://nowpayments.io' },
  { key: 'NOWPAYMENTS_IPN_SECRET', label: 'NOWPayments IPN Secret', icon: '🔗', link: 'https://nowpayments.io' },
  { key: 'STEAM_API_KEY', label: 'Steam Web API Key', icon: '🎮', link: 'https://steamcommunity.com/dev/apikey' },
  { key: 'RESEND_API_KEY', label: 'Resend Email API Key', icon: '📧', link: 'https://resend.com' },
  { key: 'DISCORD_WEBHOOK_URL', label: 'Discord Webhook URL', icon: '💬', link: null },
  { key: 'TELEGRAM_BOT_TOKEN', label: 'Telegram Bot Token', icon: '🤖', link: 'https://t.me/BotFather' },
  { key: 'TELEGRAM_CHAT_ID', label: 'Telegram Chat ID', icon: '📱', link: null },
];

const SuperAdminSettings = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [visibleKeys, setVisibleKeys] = useState<Set<string>>(new Set());
  const [editedValues, setEditedValues] = useState<Record<string, string>>({});

  const { data: settings, isLoading, refetch } = useQuery({
    queryKey: ['super-admin-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('admin_settings')
        .select('*')
        .order('key');

      if (error) throw error;
      return data as AdminSetting[];
    },
  });

  const { data: userRoles } = useQuery({
    queryKey: ['user-roles', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id);
      
      if (error) throw error;
      return data?.map(r => r.role) || [];
    },
    enabled: !!user?.id,
  });

  const updateMutation = useMutation({
    mutationFn: async ({ key, value }: { key: string; value: string }) => {
      // Log the action
      await supabase.from('admin_audit_logs').insert({
        admin_id: user?.id,
        action: 'update_setting',
        target_type: 'admin_settings',
        target_id: key,
        new_value: { key, updated: true },
      });

      const { error } = await supabase
        .from('admin_settings')
        .update({ value, updated_at: new Date().toISOString() })
        .eq('key', key);
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['super-admin-settings'] });
      toast.success(`${variables.key} успішно оновлено`);
      setEditedValues(prev => {
        const updated = { ...prev };
        delete updated[variables.key];
        return updated;
      });
    },
    onError: (error) => {
      toast.error('Помилка збереження: ' + error.message);
    },
  });

  const toggleVisibility = (key: string) => {
    setVisibleKeys(prev => {
      const newSet = new Set(prev);
      if (newSet.has(key)) {
        newSet.delete(key);
      } else {
        newSet.add(key);
      }
      return newSet;
    });
  };

  const handleValueChange = (key: string, value: string) => {
    setEditedValues(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = (key: string) => {
    const value = editedValues[key];
    if (value !== undefined) {
      updateMutation.mutate({ key, value });
    }
  };

  const hasChanges = (key: string) => editedValues[key] !== undefined;

  const getSettingValue = (key: string) => {
    const setting = settings?.find(s => s.key === key);
    return editedValues[key] ?? setting?.value ?? '';
  };

  const isAdmin = userRoles?.includes('admin');

  if (!isAdmin) {
    return (
      <Card className="border-destructive/50">
        <CardContent className="pt-6">
          <Alert variant="destructive">
            <ShieldAlert className="h-4 w-4" />
            <AlertTitle>Доступ заборонено</AlertTitle>
            <AlertDescription>
              Тільки адміністратори можуть переглядати та редагувати API ключі.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Card className="border-amber-500/30">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-amber-500">
              <Lock className="h-5 w-5" />
              API Ключі (Super Admin)
            </CardTitle>
            <CardDescription>
              Критичні налаштування платіжних систем та сервісів
            </CardDescription>
          </div>
          <Button variant="outline" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Оновити
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <Alert className="border-amber-500/50 bg-amber-500/10">
          <ShieldAlert className="h-4 w-4 text-amber-500" />
          <AlertTitle className="text-amber-500">Увага!</AlertTitle>
          <AlertDescription>
            Ці ключі використовуються для обробки платежів. Зберігайте їх у таємниці та не передавайте третім особам.
          </AlertDescription>
        </Alert>

        <div className="grid gap-4">
          {API_KEYS.map(({ key, label, icon, link }) => {
            const isVisible = visibleKeys.has(key);
            const currentValue = getSettingValue(key);
            const setting = settings?.find(s => s.key === key);

            return (
              <div key={key} className="space-y-2 p-4 rounded-lg border bg-card">
                <div className="flex items-center justify-between">
                  <Label htmlFor={key} className="text-base font-medium flex items-center gap-2">
                    <span>{icon}</span>
                    {label}
                  </Label>
                  {setting?.updated_at && (
                    <span className="text-xs text-muted-foreground">
                      Оновлено: {new Date(setting.updated_at).toLocaleDateString('uk-UA')}
                    </span>
                  )}
                </div>

                {setting?.description && (
                  <p className="text-sm text-muted-foreground">{setting.description}</p>
                )}

                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Input
                      id={key}
                      type={isVisible ? 'text' : 'password'}
                      value={currentValue}
                      onChange={(e) => handleValueChange(key, e.target.value)}
                      placeholder={`Введіть ${label}...`}
                      className="pr-10 font-mono"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full"
                      onClick={() => toggleVisibility(key)}
                    >
                      {isVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                  <Button
                    onClick={() => handleSave(key)}
                    disabled={!hasChanges(key) || updateMutation.isPending}
                  >
                    {updateMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4" />
                    )}
                  </Button>
                </div>

                {link && (
                  <a
                    href={link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-primary hover:underline"
                  >
                    Отримати ключ →
                  </a>
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-6 p-4 rounded-lg bg-muted/50 border">
          <h4 className="font-medium mb-2 flex items-center gap-2">
            <Key className="h-4 w-4" />
            Інструкції з налаштування
          </h4>
          <ul className="text-sm text-muted-foreground space-y-2">
            <li>
              <strong>WayForPay:</strong> Отримайте Merchant Account та Secret Key у{' '}
              <a href="https://wayforpay.com" target="_blank" rel="noopener" className="text-primary underline">
                особистому кабінеті WayForPay
              </a>
            </li>
            <li>
              <strong>NOWPayments:</strong> Зареєструйтесь на{' '}
              <a href="https://nowpayments.io" target="_blank" rel="noopener" className="text-primary underline">
                NOWPayments
              </a>{' '}
              та отримайте API Key в Settings → API
            </li>
            <li>
              <strong>Steam:</strong> Отримайте ключ на{' '}
              <a href="https://steamcommunity.com/dev/apikey" target="_blank" rel="noopener" className="text-primary underline">
                Steam Dev Portal
              </a>
            </li>
            <li>
              <strong>Telegram:</strong> Створіть бота через{' '}
              <a href="https://t.me/BotFather" target="_blank" rel="noopener" className="text-primary underline">
                @BotFather
              </a>{' '}
              та отримайте Chat ID через @userinfobot
            </li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default SuperAdminSettings;
