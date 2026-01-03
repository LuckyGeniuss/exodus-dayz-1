import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/AuthProvider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Loader2, TrendingUp, Gift, Percent } from 'lucide-react';

interface LoyaltyLevel {
  id: string;
  name: string;
  min_spent: number;
  discount_percent: number;
  cashback_percent: number;
  icon: string;
  color: string;
}

const LoyaltyCard = () => {
  const { user } = useAuth();

  const { data: profile } = useQuery({
    queryKey: ['profile-loyalty', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from('profiles')
        .select('total_spent')
        .eq('id', user.id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const { data: levels, isLoading } = useQuery({
    queryKey: ['loyalty-levels'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('loyalty_levels')
        .select('*')
        .order('min_spent', { ascending: true });
      if (error) throw error;
      return data as LoyaltyLevel[];
    },
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

  const totalSpent = profile?.total_spent || 0;
  
  // Find current and next level
  const sortedLevels = levels?.sort((a, b) => a.min_spent - b.min_spent) || [];
  const currentLevel = sortedLevels.filter(l => totalSpent >= l.min_spent).pop();
  const nextLevel = sortedLevels.find(l => totalSpent < l.min_spent);
  
  // Calculate progress to next level
  const progressToNext = nextLevel
    ? ((totalSpent - (currentLevel?.min_spent || 0)) / (nextLevel.min_spent - (currentLevel?.min_spent || 0))) * 100
    : 100;

  const amountToNext = nextLevel ? nextLevel.min_spent - totalSpent : 0;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Програма лояльності
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current Level */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-3xl">{currentLevel?.icon || '🥉'}</span>
            <div>
              <p className="font-bold text-lg" style={{ color: currentLevel?.color }}>
                {currentLevel?.name || 'Новачок'}
              </p>
              <p className="text-sm text-muted-foreground">
                Витрачено: {totalSpent.toFixed(2)} ₴
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            {currentLevel && currentLevel.discount_percent > 0 && (
              <Badge variant="secondary" className="flex items-center gap-1">
                <Percent className="h-3 w-3" />
                -{currentLevel.discount_percent}%
              </Badge>
            )}
            {currentLevel && currentLevel.cashback_percent > 0 && (
              <Badge variant="secondary" className="flex items-center gap-1">
                <Gift className="h-3 w-3" />
                {currentLevel.cashback_percent}% кешбек
              </Badge>
            )}
          </div>
        </div>

        {/* Progress to next level */}
        {nextLevel && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">До рівня "{nextLevel.name}"</span>
              <span className="font-medium">{amountToNext.toFixed(2)} ₴</span>
            </div>
            <Progress value={progressToNext} className="h-2" />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{currentLevel?.min_spent || 0} ₴</span>
              <span>{nextLevel.min_spent} ₴</span>
            </div>
          </div>
        )}

        {!nextLevel && (
          <p className="text-center text-sm text-muted-foreground py-2">
            🎉 Ви досягли максимального рівня!
          </p>
        )}

        {/* All levels preview */}
        <div className="pt-2 border-t">
          <p className="text-sm font-medium mb-2">Рівні програми:</p>
          <div className="flex flex-wrap gap-2">
            {sortedLevels.map((level) => (
              <Badge
                key={level.id}
                variant={totalSpent >= level.min_spent ? 'default' : 'outline'}
                className="text-xs"
                style={totalSpent >= level.min_spent ? { backgroundColor: level.color } : {}}
              >
                {level.icon} {level.name}
              </Badge>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default LoyaltyCard;
