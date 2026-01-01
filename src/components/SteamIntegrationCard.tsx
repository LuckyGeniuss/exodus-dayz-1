import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ExternalLink, Loader2 } from 'lucide-react';
import SteamAuthButton from '@/components/auth/SteamAuthButton';
import { useSteamProfile } from '@/hooks/useSteamProfile';

interface SteamIntegrationCardProps {
  profile: {
    steam_id?: string | null;
  } | null;
  userId?: string;
  onSuccess: () => void;
}

const STEAM_STATUS: Record<number, string> = {
  0: 'Офлайн',
  1: 'Онлайн',
  2: 'Зайнятий',
  3: 'Не турбувати',
  4: 'Спить',
  5: 'Готовий обмінюватись',
  6: 'Грає',
};

const SteamIntegrationCard = ({ profile, userId, onSuccess }: SteamIntegrationCardProps) => {
  const { data: steamProfile, isLoading: isSteamLoading } = useSteamProfile(profile?.steam_id || null);

  return (
    <Card className="md:col-span-2">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <svg className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2a10 10 0 0 0-10 10 10 10 0 0 0 10 10 10 10 0 0 0 10-10A10 10 0 0 0 12 2zm0 18a8 8 0 0 1-8-8 8 8 0 0 1 8-8 8 8 0 0 1 8 8 8 8 0 0 1-8 8z"/>
            <path d="M15.5 8.5a2.5 2.5 0 0 0-2.5 2.5 2.5 2.5 0 0 0 2.5 2.5 2.5 2.5 0 0 0 2.5-2.5 2.5 2.5 0 0 0-2.5-2.5zm-7-1a4 4 0 0 0-4 4 4 4 0 0 0 4 4l2-2a2 2 0 0 1-2-2 2 2 0 0 1 2-2z"/>
          </svg>
          Steam інтеграція
        </CardTitle>
        <CardDescription>
          Підключіть Steam ID для автоматичної доставки товарів
        </CardDescription>
      </CardHeader>
      <CardContent>
        {profile?.steam_id ? (
          <div className="space-y-4">
            {isSteamLoading ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                <span className="ml-2 text-muted-foreground">Завантаження профілю Steam...</span>
              </div>
            ) : steamProfile ? (
              <div className="flex items-start gap-4 p-4 rounded-lg bg-muted">
                <Avatar className="h-16 w-16 rounded-lg">
                  <AvatarImage src={steamProfile.avatarfull || steamProfile.avatarmedium || undefined} />
                  <AvatarFallback className="rounded-lg">
                    {steamProfile.personaname?.charAt(0).toUpperCase() || 'S'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">{steamProfile.personaname}</h3>
                    <Badge variant="default" className="bg-green-600">Підключено</Badge>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline">
                      {STEAM_STATUS[steamProfile.personastate] || 'Невідомо'}
                    </Badge>
                    {steamProfile.loccountrycode && (
                      <Badge variant="outline">
                        🌍 {steamProfile.loccountrycode}
                      </Badge>
                    )}
                  </div>
                  <div className="text-sm text-muted-foreground font-mono">
                    Steam ID: {profile.steam_id}
                  </div>
                  {steamProfile.profileurl && (
                    <Button
                      variant="outline"
                      size="sm"
                      asChild
                      className="mt-2"
                    >
                      <a href={steamProfile.profileurl} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Профіль Steam
                      </a>
                    </Button>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between p-4 rounded-lg bg-muted">
                <div>
                  <Label>Steam ID</Label>
                  <div className="text-lg font-mono">{profile.steam_id}</div>
                </div>
                <Badge variant="default" className="bg-green-600">Підключено</Badge>
              </div>
            )}
            <p className="text-sm text-muted-foreground">
              ✓ Ваш Steam акаунт успішно підключено. Всі товари будуть автоматично доставлятися на сервер.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-muted-foreground">
              Steam ID не підключено. Підключіть свій акаунт для автоматичної доставки товарів на ігровий сервер.
            </p>
            <SteamAuthButton userId={userId} onSuccess={onSuccess} />
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SteamIntegrationCard;
