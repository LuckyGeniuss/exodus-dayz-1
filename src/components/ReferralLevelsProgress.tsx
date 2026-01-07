import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Trophy, Star, Crown, Sparkles, Gift, Users, TrendingUp, Zap } from 'lucide-react';

interface ReferralLevel {
  level: number;
  name: string;
  minReferrals: number;
  bonus: number;
  icon: React.ElementType;
  color: string;
  bgColor: string;
}

const REFERRAL_ACHIEVEMENT_LEVELS: ReferralLevel[] = [
  { level: 1, name: 'Новачок', minReferrals: 1, bonus: 50, icon: Star, color: 'text-gray-400', bgColor: 'bg-gray-500/20' },
  { level: 2, name: 'Активіст', minReferrals: 5, bonus: 100, icon: Zap, color: 'text-blue-400', bgColor: 'bg-blue-500/20' },
  { level: 3, name: 'Амбасадор', minReferrals: 10, bonus: 200, icon: Trophy, color: 'text-green-400', bgColor: 'bg-green-500/20' },
  { level: 4, name: 'Лідер', minReferrals: 25, bonus: 500, icon: Sparkles, color: 'text-purple-400', bgColor: 'bg-purple-500/20' },
  { level: 5, name: 'Легенда', minReferrals: 50, bonus: 1000, icon: Crown, color: 'text-yellow-400', bgColor: 'bg-yellow-500/20' },
];

interface ReferralLevelsProgressProps {
  totalReferrals: number;
  totalEarned: number;
}

const ReferralLevelsProgress = ({ totalReferrals, totalEarned }: ReferralLevelsProgressProps) => {
  // Find current level
  const currentLevel = REFERRAL_ACHIEVEMENT_LEVELS.reduce((acc, level) => {
    if (totalReferrals >= level.minReferrals) return level;
    return acc;
  }, REFERRAL_ACHIEVEMENT_LEVELS[0]);

  // Find next level
  const nextLevelIndex = REFERRAL_ACHIEVEMENT_LEVELS.findIndex(l => l.level === currentLevel.level) + 1;
  const nextLevel = REFERRAL_ACHIEVEMENT_LEVELS[nextLevelIndex] || null;

  // Calculate progress to next level
  const progressToNext = nextLevel 
    ? ((totalReferrals - currentLevel.minReferrals) / (nextLevel.minReferrals - currentLevel.minReferrals)) * 100
    : 100;

  const referralsToNextLevel = nextLevel ? nextLevel.minReferrals - totalReferrals : 0;

  const CurrentIcon = currentLevel.icon;

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          Рівні рефералів
        </CardTitle>
        <CardDescription>
          Прогресивні бонуси за кількість запрошених друзів
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Current Level Badge */}
        <div className={`p-4 rounded-xl ${currentLevel.bgColor} border border-${currentLevel.color.replace('text-', '')}/30`}>
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-full ${currentLevel.bgColor} ${currentLevel.color}`}>
              <CurrentIcon className="h-8 w-8" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className={`text-xl font-bold ${currentLevel.color}`}>{currentLevel.name}</span>
                <Badge variant="outline" className={currentLevel.color}>
                  Рівень {currentLevel.level}
                </Badge>
              </div>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Users className="h-4 w-4" /> {totalReferrals} рефералів
                </span>
                <span className="flex items-center gap-1">
                  <Gift className="h-4 w-4" /> {totalEarned.toFixed(0)} ₴ зароблено
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Progress to Next Level */}
        {nextLevel && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Прогрес до {nextLevel.name}</span>
              <span className="font-medium">{totalReferrals} / {nextLevel.minReferrals}</span>
            </div>
            <Progress value={progressToNext} className="h-3" />
            <p className="text-xs text-muted-foreground text-center">
              Ще {referralsToNextLevel} реферал(ів) до наступного рівня та бонусу +{nextLevel.bonus} ₴
            </p>
          </div>
        )}

        {!nextLevel && (
          <div className="text-center p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
            <Crown className="h-8 w-8 text-yellow-400 mx-auto mb-2" />
            <p className="text-yellow-400 font-semibold">Ви досягли максимального рівня!</p>
            <p className="text-sm text-muted-foreground">Вітаємо з легендарним статусом!</p>
          </div>
        )}

        {/* All Levels */}
        <div className="space-y-2">
          <h4 className="font-semibold text-sm text-muted-foreground mb-3">Усі рівні</h4>
          {REFERRAL_ACHIEVEMENT_LEVELS.map((level) => {
            const LevelIcon = level.icon;
            const isAchieved = totalReferrals >= level.minReferrals;
            const isCurrent = level.level === currentLevel.level;
            
            return (
              <div 
                key={level.level}
                className={`flex items-center gap-3 p-3 rounded-lg transition-all ${
                  isCurrent 
                    ? `${level.bgColor} border-2 border-${level.color.replace('text-', '')}`
                    : isAchieved 
                      ? 'bg-muted/50 opacity-80' 
                      : 'bg-muted/20 opacity-50'
                }`}
              >
                <div className={`p-2 rounded-full ${isAchieved ? level.bgColor : 'bg-muted'}`}>
                  <LevelIcon className={`h-5 w-5 ${isAchieved ? level.color : 'text-muted-foreground'}`} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className={`font-medium ${isAchieved ? level.color : 'text-muted-foreground'}`}>
                      {level.name}
                    </span>
                    {isAchieved && !isCurrent && (
                      <Badge variant="outline" className="text-xs">✓</Badge>
                    )}
                    {isCurrent && (
                      <Badge className="text-xs">Поточний</Badge>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground">
                    від {level.minReferrals} рефералів
                  </span>
                </div>
                <div className="text-right">
                  <span className={`font-bold ${isAchieved ? 'text-primary' : 'text-muted-foreground'}`}>
                    +{level.bonus} ₴
                  </span>
                  <p className="text-xs text-muted-foreground">бонус</p>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default ReferralLevelsProgress;
