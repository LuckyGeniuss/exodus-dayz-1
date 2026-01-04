import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/AuthProvider';
import { toast } from 'sonner';
import { Mail, Bell, Newspaper, ShoppingCart, Loader2 } from 'lucide-react';

const EmailNotificationSettings = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({
    email_promotions_enabled: true,
    email_order_updates_enabled: true,
    email_news_enabled: true,
  });

  useEffect(() => {
    if (user) {
      fetchSettings();
    }
  }, [user]);

  const fetchSettings = async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from('profiles')
      .select('email_promotions_enabled, email_order_updates_enabled, email_news_enabled')
      .eq('id', user.id)
      .single();

    if (data && !error) {
      setSettings({
        email_promotions_enabled: data.email_promotions_enabled ?? true,
        email_order_updates_enabled: data.email_order_updates_enabled ?? true,
        email_news_enabled: data.email_news_enabled ?? true,
      });
    }
    setLoading(false);
  };

  const updateSetting = async (key: keyof typeof settings, value: boolean) => {
    if (!user) return;
    
    setSaving(true);
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);

    const { error } = await supabase
      .from('profiles')
      .update({ [key]: value })
      .eq('id', user.id);

    if (error) {
      toast.error('Помилка збереження налаштувань');
      setSettings(settings); // Revert on error
    } else {
      toast.success('Налаштування збережено');
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Email сповіщення
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="h-5 w-5" />
          Email сповіщення
        </CardTitle>
        <CardDescription>
          Налаштуйте, які сповіщення ви хочете отримувати на email
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-orange-500/10">
              <Bell className="h-4 w-4 text-orange-500" />
            </div>
            <div>
              <Label htmlFor="promotions" className="text-base font-medium">
                Акції та знижки
              </Label>
              <p className="text-sm text-muted-foreground">
                Сповіщення про flash sale, закінчення акцій та спеціальні пропозиції
              </p>
            </div>
          </div>
          <Switch
            id="promotions"
            checked={settings.email_promotions_enabled}
            onCheckedChange={(checked) => updateSetting('email_promotions_enabled', checked)}
            disabled={saving}
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-green-500/10">
              <ShoppingCart className="h-4 w-4 text-green-500" />
            </div>
            <div>
              <Label htmlFor="orders" className="text-base font-medium">
                Статус замовлень
              </Label>
              <p className="text-sm text-muted-foreground">
                Оновлення про статус ваших замовлень та оплат
              </p>
            </div>
          </div>
          <Switch
            id="orders"
            checked={settings.email_order_updates_enabled}
            onCheckedChange={(checked) => updateSetting('email_order_updates_enabled', checked)}
            disabled={saving}
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-blue-500/10">
              <Newspaper className="h-4 w-4 text-blue-500" />
            </div>
            <div>
              <Label htmlFor="news" className="text-base font-medium">
                Новини та оновлення
              </Label>
              <p className="text-sm text-muted-foreground">
                Інформація про нові товари, оновлення сервера та події
              </p>
            </div>
          </div>
          <Switch
            id="news"
            checked={settings.email_news_enabled}
            onCheckedChange={(checked) => updateSetting('email_news_enabled', checked)}
            disabled={saving}
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default EmailNotificationSettings;
