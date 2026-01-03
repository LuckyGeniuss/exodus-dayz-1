import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Save, Eye, EyeOff, Key, RefreshCw, Store, Megaphone } from 'lucide-react';
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
  'TELEGRAM_BOT_TOKEN': '🤖',
  'TELEGRAM_CHAT_ID': '📱',
};

const SHOP_SETTINGS = [
  { key: 'veteran_discount_percent', label: 'Знижка для ветеранів (%)', type: 'number' },
  { key: 'cashback_percent', label: 'Відсоток кешбеку', type: 'number' },
  { key: 'min_order_amount', label: 'Мінімальна сума замовлення (₴)', type: 'number' },
  { key: 'max_order_amount', label: 'Максимальна сума замовлення (₴)', type: 'number' },
];

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

  const getSettingValue = (key: string) => {
    const setting = settings?.find(s => s.key === key);
    return editedValues[key] ?? setting?.value ?? '';
  };

  const isApiSetting = (key: string) => {
    return !SHOP_SETTINGS.some(s => s.key === key) && !key.startsWith('shop_banner');
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const apiSettings = settings?.filter(s => isApiSetting(s.key)) || [];

  return (
    <Tabs defaultValue="shop" className="space-y-6">
      <TabsList>
        <TabsTrigger value="shop" className="flex items-center gap-2">
          <Store className="h-4 w-4" />
          Магазин
        </TabsTrigger>
        <TabsTrigger value="banners" className="flex items-center gap-2">
          <Megaphone className="h-4 w-4" />
          Банери
        </TabsTrigger>
        <TabsTrigger value="api" className="flex items-center gap-2">
          <Key className="h-4 w-4" />
          API ключі
        </TabsTrigger>
      </TabsList>

      {/* Shop Settings */}
      <TabsContent value="shop">
        <Card>
          <CardHeader>
            <CardTitle>Налаштування магазину</CardTitle>
            <CardDescription>Знижки, кешбек та ліміти замовлень</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {SHOP_SETTINGS.map(({ key, label, type }) => {
                const currentValue = getSettingValue(key);
                return (
                  <div key={key} className="space-y-2">
                    <Label htmlFor={key}>{label}</Label>
                    <div className="flex gap-2">
                      <Input
                        id={key}
                        type={type}
                        value={currentValue}
                        onChange={(e) => handleValueChange(key, e.target.value)}
                        min={0}
                      />
                      <Button
                        onClick={() => handleSave(key)}
                        disabled={!hasChanges(key) || updateMutation.isPending}
                        size="icon"
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
            </div>

            <div className="p-4 rounded-lg bg-muted/50 border">
              <h4 className="font-medium mb-2">ℹ️ Пояснення</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• <strong>Знижка для ветеранів</strong> - автоматична знижка для користувачів зі статусом ветерана</li>
                <li>• <strong>Кешбек</strong> - відсоток від суми замовлення, який повертається на баланс</li>
                <li>• <strong>Мінімальна сума</strong> - мінімальна сума для оформлення замовлення</li>
                <li>• <strong>Максимальна сума</strong> - максимальна сума одного замовлення</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      {/* Banner Settings */}
      <TabsContent value="banners">
        <Card>
          <CardHeader>
            <CardTitle>Банери для покупців</CardTitle>
            <CardDescription>Налаштуйте повідомлення, яке бачитимуть покупці</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between p-4 rounded-lg border">
              <div>
                <Label>Показувати банер</Label>
                <p className="text-sm text-muted-foreground">Увімкніть для показу банера на головній сторінці</p>
              </div>
              <Switch
                checked={getSettingValue('shop_banner_enabled') === 'true'}
                onCheckedChange={(checked) => {
                  handleValueChange('shop_banner_enabled', checked ? 'true' : 'false');
                  updateMutation.mutate({ key: 'shop_banner_enabled', value: checked ? 'true' : 'false' });
                }}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="banner_text">Текст банера</Label>
              <Textarea
                id="banner_text"
                value={getSettingValue('shop_banner_text')}
                onChange={(e) => handleValueChange('shop_banner_text', e.target.value)}
                placeholder="Наприклад: 🎉 Знижка 20% на всі товари до кінця тижня!"
                rows={3}
              />
              <Button
                onClick={() => handleSave('shop_banner_text')}
                disabled={!hasChanges('shop_banner_text') || updateMutation.isPending}
              >
                {updateMutation.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Зберегти банер
              </Button>
            </div>

            {getSettingValue('shop_banner_enabled') === 'true' && getSettingValue('shop_banner_text') && (
              <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
                <p className="text-sm font-medium">Попередній перегляд:</p>
                <p className="mt-2">{getSettingValue('shop_banner_text')}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      {/* API Settings */}
      <TabsContent value="api">
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
            {apiSettings.map((setting) => {
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
                <li>• <strong>Telegram Bot Token</strong> - отримайте через <a href="https://t.me/BotFather" target="_blank" rel="noopener" className="text-primary underline">@BotFather</a></li>
                <li>• <strong>Telegram Chat ID</strong> - ID чату/групи для сповіщень (отримайте через @userinfobot)</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
};

export default SettingsManagement;
