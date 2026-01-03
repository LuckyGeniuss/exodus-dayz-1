import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/AuthProvider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Loader2, Star, ShoppingBag, MessageSquare, Trophy, Zap } from 'lucide-react';

interface LevelInfo {
  level: number;
  name: string;
  minXP: number;
  maxXP: number;
  icon: string;
  color: string;
  privileges: string[];
}

const LEVELS: LevelInfo[] = [
  { level: 1, name: 'Новобранець', minXP: 0, maxXP: 100, icon: '🎮', color: '#9CA3AF', privileges: ['Базовий доступ'] },
  { level: 2, name: 'Виживач', minXP: 100, maxXP: 300, icon: '🛡️', color: '#CD7F32', privileges: ['1% кешбек'] },
  { level: 3, name: 'Мародер', minXP: 300, maxXP: 600, icon: '⚔️', color: '#C0C0C0', privileges: ['2% кешбек', 'Ранній доступ до акцій'] },
  { level: 4, name: 'Воїн', minXP: 600, maxXP: 1000, icon: '🗡️', color: '#FFD700', privileges: ['3% кешбек', 'Ексклюзивні знижки'] },
  { level: 5, name: 'Ветеран', minXP: 1000, maxXP: 1500, icon: '🎖️', color: '#E5E4E2', privileges: ['5% кешбек', 'Пріоритетна підтримка'] },
  { level: 6, name: 'Легенда', minXP: 1500, maxXP: 2500, icon: '👑', color: '#B9F2FF', privileges: ['7% кешбек', 'VIP бейдж', 'Спеціальні місії'] },
  { level: 7, name: 'Бог Exodus', minXP: 2500, maxXP: 999999, icon: '⭐', color: '#FFD700', privileges: ['10% кешбек', 'Всі привілеї', 'Ексклюзивний контент'] },
];

// XP rewards
const XP_REWARDS = {
  purchase: 10, // per 100₴ spent
  review: 25,
  daily_login: 5,
  referral: 50,
  achievement: 30,
  first_purchase: 100,
};

const XPProgressCard = () => {
  const { user } = useAuth();

  const { data: stats, isLoading } = useQuery({
    queryKey: ['user-xp-stats', user?.id],
    queryFn: async () => {
      if (!user) return null;

      // Get profile data
      const { data: profile } = await supabase
        .from('profiles')
        .select('total_spent')
        .eq('id', user.id)
        .single();

      // Get completed orders count
      const { count: ordersCount } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('payment_status', 'completed');

      // Get reviews count
      const { count: reviewsCount } = await supabase
        .from('reviews')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      // Get achievements count
      const { count: achievementsCount } = await supabase
        .from('user_achievements')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      // Get daily rewards
      const { data: dailyRewards } = await supabase
        .from('daily_rewards')
        .select('streak, total_claimed')
        .eq('user_id', user.id)
        .single();

      // Get referrals count
      const { count: referralsCount } = await supabase
        .from('referrals')
        .select('*', { count: 'exact', head: true })
        .eq('referrer_id', user.id)
        .eq('bonus_given', true);

      // Calculate total XP
      const totalSpent = profile?.total_spent || 0;
      const purchaseXP = Math.floor(totalSpent / 100) * XP_REWARDS.purchase;
      const reviewXP = (reviewsCount || 0) * XP_REWARDS.review;
      const dailyXP = (dailyRewards?.streak || 0) * XP_REWARDS.daily_login;
      const referralXP = (referralsCount || 0) * XP_REWARDS.referral;
      const achievementXP = (achievementsCount || 0) * XP_REWARDS.achievement;
      const firstPurchaseXP = (ordersCount || 0) > 0 ? XP_REWARDS.first_purchase : 0;

      const totalXP = purchaseXP + reviewXP + dailyXP + referralXP + achievementXP + firstPurchaseXP;

      return {
        totalXP,
        breakdown: {
          purchases: purchaseXP,
          reviews: reviewXP,
          daily: dailyXP,
          referrals: referralXP,
          achievements: achievementXP,
          firstPurchase: firstPurchaseXP,
        },
        stats: {
          ordersCount: ordersCount || 0,
          reviewsCount: reviewsCount || 0,
          referralsCount: referralsCount || 0,
          streak: dailyRewards?.streak || 0,
        }
      };
    },
    enabled: !!user,
  });

  if (!user) return null;

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8 flex justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  const totalXP = stats?.totalXP || 0;
  
  // Find current level
  const currentLevel = LEVELS.reduce((prev, curr) => 
    totalXP >= curr.minXP ? curr : prev
  , LEVELS[0]);
  
  const nextLevel = LEVELS.find(l => l.level === currentLevel.level + 1);
  
  // Calculate progress to next level
  const progressXP = totalXP - currentLevel.minXP;
  const levelXPRange = (nextLevel?.minXP || currentLevel.maxXP) - currentLevel.minXP;
  const progressPercent = nextLevel ? Math.min((progressXP / levelXPRange) * 100, 100) : 100;
  const xpToNext = nextLevel ? nextLevel.minXP - totalXP : 0;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <Zap className="h-5 w-5 text-yellow-500" />
          Система рівнів
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current Level Display */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-4xl">{currentLevel.icon}</span>
            <div>
              <p className="font-bold text-lg" style={{ color: currentLevel.color }}>
                Рівень {currentLevel.level}: {currentLevel.name}
              </p>
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <Star className="h-4 w-4 text-yellow-500" />
                {totalXP} XP
              </p>
            </div>
          </div>
          <Badge 
            variant="secondary" 
            className="text-sm"
            style={{ backgroundColor: currentLevel.color, color: '#000' }}
          >
            LVL {currentLevel.level}
          </Badge>
        </div>

        {/* Progress to next level */}
        {nextLevel && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">До рівня "{nextLevel.name}"</span>
              <span className="font-medium">{xpToNext} XP</span>
            </div>
            <Progress value={progressPercent} className="h-3" />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{currentLevel.minXP} XP</span>
              <span>{nextLevel.minXP} XP</span>
            </div>
          </div>
        )}

        {!nextLevel && (
          <p className="text-center text-sm text-muted-foreground py-2">
            🎉 Ви досягли максимального рівня!
          </p>
        )}

        {/* Privileges */}
        <div className="border-t pt-3">
          <p className="text-sm font-medium mb-2">Ваші привілеї:</p>
          <div className="flex flex-wrap gap-2">
            {currentLevel.privileges.map((privilege, i) => (
              <Badge key={i} variant="outline" className="text-xs">
                ✓ {privilege}
              </Badge>
            ))}
          </div>
        </div>

        {/* XP Breakdown */}
        <div className="border-t pt-3">
          <p className="text-sm font-medium mb-2">Як заробити XP:</p>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="flex items-center gap-2 text-muted-foreground">
              <ShoppingBag className="h-3 w-3" />
              <span>Покупки: +{XP_REWARDS.purchase} XP / 100₴</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <MessageSquare className="h-3 w-3" />
              <span>Відгук: +{XP_REWARDS.review} XP</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Trophy className="h-3 w-3" />
              <span>Досягнення: +{XP_REWARDS.achievement} XP</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Star className="h-3 w-3" />
              <span>Щоденний вхід: +{XP_REWARDS.daily_login} XP</span>
            </div>
          </div>
        </div>

        {/* All levels preview */}
        <div className="border-t pt-3">
          <p className="text-sm font-medium mb-2">Всі рівні:</p>
          <div className="flex flex-wrap gap-1">
            {LEVELS.map((level) => (
              <Badge
                key={level.level}
                variant={totalXP >= level.minXP ? 'default' : 'outline'}
                className="text-xs"
                style={totalXP >= level.minXP ? { backgroundColor: level.color, color: '#000' } : {}}
              >
                {level.icon} {level.level}
              </Badge>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default XPProgressCard;
