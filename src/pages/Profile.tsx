import { useState, useEffect } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { User, Mail, Calendar, Shield, Wallet, Trophy } from 'lucide-react';
import { toast } from 'sonner';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Badge } from '@/components/ui/badge';
import SteamAuthButton from '@/components/auth/SteamAuthButton';
import AchievementsModal from '@/components/AchievementsModal';
import BalanceHistory from '@/components/BalanceHistory';
import ReferralCard from '@/components/ReferralCard';

const Profile = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [username, setUsername] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [showAchievements, setShowAchievements] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (data && !error) {
      setProfile(data);
      setUsername(data.username || '');
    }
  };

  const handleUpdateProfile = async () => {
    if (!user || !username.trim()) {
      toast.error('Введіть ім\'я користувача');
      return;
    }

    setUpdating(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ username: username.trim() })
        .eq('id', user.id);

      if (error) throw error;

      toast.success('Профіль оновлено');
      setIsEditing(false);
      fetchProfile();
    } catch (error) {
      console.error('Profile update error:', error);
      toast.error('Помилка оновлення профілю');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Завантаження...</div>;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8 max-w-4xl">
        <h1 className="text-4xl font-military mb-8">Мій профіль</h1>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Profile Info Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-6 w-6" />
                Основна інформація
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">Ім'я користувача</Label>
                {isEditing ? (
                  <Input
                    id="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Введіть ім'я"
                  />
                ) : (
                  <div className="text-lg font-medium">{profile?.username || 'Не вказано'}</div>
                )}
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Email
                </Label>
                <div className="text-lg font-medium">{user?.email}</div>
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Дата реєстрації
                </Label>
                <div className="text-sm text-muted-foreground">
                  {profile?.created_at && new Date(profile.created_at).toLocaleDateString('uk-UA', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </div>
              </div>

              {isEditing ? (
                <div className="flex gap-2 pt-4">
                  <Button onClick={handleUpdateProfile} disabled={updating} className="flex-1">
                    {updating ? 'Збереження...' : 'Зберегти'}
                  </Button>
                  <Button variant="outline" onClick={() => {
                    setIsEditing(false);
                    setUsername(profile?.username || '');
                  }}>
                    Скасувати
                  </Button>
                </div>
              ) : (
                <Button onClick={() => setIsEditing(true)} className="w-full mt-4">
                  Редагувати профіль
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Balance & Status Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wallet className="h-6 w-6" />
                Баланс та статус
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Поточний баланс</Label>
                <div className="text-3xl font-bold text-primary">
                  {profile?.balance?.toFixed(2) || '0.00'} ₴
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => navigate('/balance')}
                  className="w-full mt-2"
                >
                  Поповнити баланс
                </Button>
              </div>

              <div className="space-y-2 pt-4 border-t">
                <Label className="flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  Статус
                </Label>
                {profile?.is_veteran ? (
                  <div className="space-y-2">
                    <Badge variant="default" className="text-sm">
                      Ветеран АТО/ООС
                    </Badge>
                    <p className="text-sm text-muted-foreground">
                      У вас активна знижка 10% на всі товари
                    </p>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Звичайний користувач
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Steam Card */}
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
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-4 rounded-lg bg-muted">
                    <div>
                      <Label>Steam ID</Label>
                      <div className="text-lg font-mono">{profile.steam_id}</div>
                    </div>
                    <Badge variant="default" className="bg-green-600">Підключено</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    ✓ Ваш Steam акаунт успішно підключено. Всі товари будуть автоматично доставлятися на сервер.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-muted-foreground">
                    Steam ID не підключено. Підключіть свій акаунт для автоматичної доставки товарів на ігровий сервер.
                  </p>
                  <SteamAuthButton userId={user?.id} onSuccess={fetchProfile} />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Achievements Card */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-6 w-6 text-primary" />
                Досягнення
              </CardTitle>
              <CardDescription>
                Відкривайте досягнення та отримуйте винагороди
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={() => setShowAchievements(true)} 
                variant="outline" 
                className="w-full"
              >
                Переглянути досягнення
              </Button>
            </CardContent>
          </Card>

          {/* Referral Card */}
          <ReferralCard />

          {/* Balance History */}
          <BalanceHistory />
        </div>
      </main>
      <Footer />

      <AchievementsModal 
        open={showAchievements} 
        onOpenChange={setShowAchievements} 
      />
    </div>
  );
};

export default Profile;
