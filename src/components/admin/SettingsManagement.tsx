import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Save, Eye, EyeOff, Key, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

interface AdminSetting {
  id: string;
  key: string;
  value: string | null;
  description: string | null;
  is_encrypted: boolean;
  updated_at: string;
}

const SETTING_ICONS: Record<string, string> = {
  'STEAM_API_KEY': '🎮',
  'WAYFORPAY_MERCHANT_ACCOUNT': '💳',
  'WAYFORPAY_SECRET_KEY': '🔐',
  'NOWPAYMENTS_API_KEY': '₿',
  'NOWPAYMENTS_IPN_SECRET': '🔗',
  'RESEND_API_KEY': '📧',
  'DISCORD_WEBHOOK_URL': '💬',
};

const SettingsManagement = () => {
  const queryClient = useQueryClient();
  const [visibleKeys, setVisibleKeys] = useState<Set<string>>(new Set());
  const [editedValues, setEditedValues] = useState<Record<string, string>>({});

  const { data: settings, isLoading, refetch } = useQuery({
    queryKey: ['admin-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('admin_settings')
        .select('*')
        .order('key');

      if (error) throw error;
      return data as AdminSetting[];
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ key, value }: { key: string; value: string }) => {
      const { error } = await supabase
        .from('admin_settings')
        .update({ value, updated_at: new Date().toISOString() })
        .eq('key', key);
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin-settings'] });
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

  const hasChanges = (key: string) => {
    return editedValues[key] !== undefined;
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Key className="h-5 w-5" />
              Налаштування API
            </CardTitle>
            <CardDescription>
              Керуйте API ключами та налаштуваннями сервісів
            </CardDescription>
          </div>
          <Button variant="outline" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Оновити
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {settings?.map((setting) => {
          const isVisible = visibleKeys.has(setting.key);
          const currentValue = editedValues[setting.key] ?? setting.value ?? '';
          const icon = SETTING_ICONS[setting.key] || '🔑';

          return (
            <div key={setting.id} className="space-y-2 p-4 rounded-lg border bg-muted/30">
              <div className="flex items-center justify-between">
                <Label htmlFor={setting.key} className="text-base font-medium flex items-center gap-2">
                  <span>{icon}</span>
                  {setting.key}
                </Label>
                <span className="text-xs text-muted-foreground">
                  Оновлено: {new Date(setting.updated_at).toLocaleDateString('uk-UA')}
                </span>
              </div>
              
              {setting.description && (
                <p className="text-sm text-muted-foreground">{setting.description}</p>
              )}
              
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Input
                    id={setting.key}
                    type={isVisible ? 'text' : 'password'}
                    value={currentValue}
                    onChange={(e) => handleValueChange(setting.key, e.target.value)}
                    placeholder={`Введіть ${setting.key}...`}
                    className="pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full"
                    onClick={() => toggleVisibility(setting.key)}
                  >
                    {isVisible ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <Button
                  onClick={() => handleSave(setting.key)}
                  disabled={!hasChanges(setting.key) || updateMutation.isPending}
                >
                  {updateMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          );
        })}

        <div className="mt-6 p-4 rounded-lg bg-primary/10 border border-primary/20">
          <h4 className="font-medium mb-2">ℹ️ Інформація</h4>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• <strong>Steam API Key</strong> - отримайте на <a href="https://steamcommunity.com/dev/apikey" target="_blank" rel="noopener" className="text-primary underline">Steam Dev Portal</a></li>
            <li>• <strong>Wayforpay</strong> - дані з особистого кабінету Wayforpay</li>
            <li>• <strong>NOWPayments</strong> - отримайте на <a href="https://nowpayments.io" target="_blank" rel="noopener" className="text-primary underline">NOWPayments Dashboard</a></li>
            <li>• <strong>Resend</strong> - отримайте на <a href="https://resend.com" target="_blank" rel="noopener" className="text-primary underline">Resend Dashboard</a></li>
            <li>• <strong>Discord Webhook</strong> - створіть у налаштуваннях Discord каналу</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default SettingsManagement;
