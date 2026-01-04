import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Cookie, X } from 'lucide-react';
import { cn } from '@/lib/utils';

const COOKIE_CONSENT_KEY = 'exodus_cookie_consent';

const CookieConsent = () => {
  const [show, setShow] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (!consent) {
      // Delay showing the banner for better UX
      const timer = setTimeout(() => setShow(true), 2000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem(COOKIE_CONSENT_KEY, 'accepted');
    closeBanner();
  };

  const handleDecline = () => {
    localStorage.setItem(COOKIE_CONSENT_KEY, 'declined');
    closeBanner();
  };

  const closeBanner = () => {
    setIsClosing(true);
    setTimeout(() => setShow(false), 300);
  };

  if (!show) return null;

  return (
    <div 
      className={cn(
        "fixed bottom-4 left-4 right-4 z-50 md:left-auto md:right-4 md:max-w-md transition-all duration-300",
        isClosing ? "opacity-0 translate-y-4" : "opacity-100 translate-y-0"
      )}
    >
      <Card className="border-primary/20 shadow-lg">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Cookie className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold mb-1">🍪 Ми використовуємо cookies</h3>
              <p className="text-sm text-muted-foreground mb-3">
                Для покращення роботи сайту ми використовуємо файли cookie. 
                Продовжуючи користуватися сайтом, ви погоджуєтесь з нашою{' '}
                <a href="/about" className="text-primary hover:underline">
                  політикою конфіденційності
                </a>.
              </p>
              <div className="flex gap-2">
                <Button size="sm" onClick={handleAccept}>
                  Прийняти
                </Button>
                <Button size="sm" variant="outline" onClick={handleDecline}>
                  Відхилити
                </Button>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 -mt-1 -mr-1"
              onClick={handleDecline}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CookieConsent;
