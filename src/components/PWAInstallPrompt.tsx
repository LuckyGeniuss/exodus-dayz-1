import { useState } from 'react';
import { usePWA } from '@/hooks/usePWA';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Download, Bell, BellOff, X, Smartphone } from 'lucide-react';

const PWAInstallPrompt = () => {
  const { isInstallable, isInstalled, isPushEnabled, installApp, requestPushPermission } = usePWA();
  const [isDismissed, setIsDismissed] = useState(false);

  if (isDismissed || (!isInstallable && isInstalled && isPushEnabled)) {
    return null;
  }

  return (
    <Card className="fixed bottom-20 right-4 z-50 w-80 shadow-lg border-primary/20 animate-in slide-in-from-bottom-5">
      <CardHeader className="pb-2 relative">
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-2 top-2 h-6 w-6"
          onClick={() => setIsDismissed(true)}
        >
          <X className="h-4 w-4" />
        </Button>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Smartphone className="h-5 w-5 text-primary" />
          Встановіть додаток
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">
          Отримуйте миттєві сповіщення про знижки та акції!
        </p>
        
        <div className="flex flex-col gap-2">
          {isInstallable && (
            <Button 
              onClick={installApp} 
              className="w-full"
              size="sm"
            >
              <Download className="h-4 w-4 mr-2" />
              Встановити
            </Button>
          )}
          
          {!isPushEnabled && (
            <Button
              variant="outline"
              onClick={requestPushPermission}
              className="w-full"
              size="sm"
            >
              {isPushEnabled ? (
                <>
                  <Bell className="h-4 w-4 mr-2" />
                  Сповіщення увімкнено
                </>
              ) : (
                <>
                  <BellOff className="h-4 w-4 mr-2" />
                  Увімкнути сповіщення
                </>
              )}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default PWAInstallPrompt;
