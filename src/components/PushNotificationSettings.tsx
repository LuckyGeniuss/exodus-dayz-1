import { useState } from 'react';
import { usePWA } from '@/hooks/usePWA';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Bell, BellOff, Send, Smartphone, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

const PushNotificationSettings = () => {
  const { isPushEnabled, requestPushPermission, sendTestNotification, isInstalled, installApp, isInstallable } = usePWA();
  const [isLoading, setIsLoading] = useState(false);

  const handleEnableNotifications = async () => {
    setIsLoading(true);
    try {
      await requestPushPermission();
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestNotification = async () => {
    try {
      await sendTestNotification();
      toast.success('Тестове сповіщення надіслано!');
    } catch {
      toast.error('Не вдалося надіслати сповіщення');
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5 text-primary" />
          Push-сповіщення
        </CardTitle>
        <CardDescription>
          Отримуйте сповіщення про знижки, акції та статус замовлень
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Installation status */}
        <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
          <div className="flex items-center gap-3">
            <Smartphone className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="font-medium">PWA додаток</p>
              <p className="text-sm text-muted-foreground">
                {isInstalled ? 'Встановлено' : 'Не встановлено'}
              </p>
            </div>
          </div>
          {isInstalled ? (
            <CheckCircle className="h-5 w-5 text-green-500" />
          ) : isInstallable ? (
            <Button variant="outline" size="sm" onClick={installApp}>
              Встановити
            </Button>
          ) : (
            <span className="text-xs text-muted-foreground">Недоступно</span>
          )}
        </div>

        {/* Notification toggle */}
        <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
          <div className="flex items-center gap-3">
            {isPushEnabled ? (
              <Bell className="h-5 w-5 text-primary" />
            ) : (
              <BellOff className="h-5 w-5 text-muted-foreground" />
            )}
            <div>
              <Label htmlFor="push-toggle" className="font-medium cursor-pointer">
                Push-сповіщення
              </Label>
              <p className="text-sm text-muted-foreground">
                {isPushEnabled ? 'Увімкнено' : 'Вимкнено'}
              </p>
            </div>
          </div>
          <Switch
            id="push-toggle"
            checked={isPushEnabled}
            onCheckedChange={() => !isPushEnabled && handleEnableNotifications()}
            disabled={isLoading || isPushEnabled}
          />
        </div>

        {/* Notification types info */}
        {isPushEnabled && (
          <div className="space-y-3">
            <p className="text-sm font-medium">Ви отримуватимете сповіщення про:</p>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                Зміну статусу замовлень
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                Відповіді на тікети підтримки
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                Акції та знижки
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                Щоденні бонуси
              </li>
            </ul>
          </div>
        )}

        {/* Test notification button */}
        {isPushEnabled && (
          <Button
            variant="outline"
            className="w-full"
            onClick={handleTestNotification}
          >
            <Send className="h-4 w-4 mr-2" />
            Надіслати тестове сповіщення
          </Button>
        )}

        {/* Enable button if not enabled */}
        {!isPushEnabled && (
          <Button
            className="w-full"
            onClick={handleEnableNotifications}
            disabled={isLoading}
          >
            <Bell className="h-4 w-4 mr-2" />
            {isLoading ? 'Увімкнення...' : 'Увімкнути сповіщення'}
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

export default PushNotificationSettings;
