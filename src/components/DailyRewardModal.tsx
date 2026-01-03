import { useState, useEffect } from 'react';
import { Gift, Flame, Clock, Check } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/AuthProvider';
import { toast } from 'sonner';
import Confetti from '@/components/Confetti';
import { cn } from '@/lib/utils';

interface DailyRewardModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface DailyRewardData {
  streak: number;
  lastClaim: Date | null;
  canClaim: boolean;
  hoursUntilNext: number;
}

const STREAK_BONUSES = [
  { day: 1, bonus: 5 },
  { day: 2, bonus: 7 },
  { day: 3, bonus: 10 },
  { day: 4, bonus: 15 },
  { day: 5, bonus: 20 },
  { day: 6, bonus: 30 },
  { day: 7, bonus: 50 },
];

const DailyRewardModal = ({ open, onOpenChange }: DailyRewardModalProps) => {
  const { user } = useAuth();
  const [rewardData, setRewardData] = useState<DailyRewardData>({
    streak: 0,
    lastClaim: null,
    canClaim: true,
    hoursUntilNext: 0,
  });
  const [claiming, setClaiming] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [claimedBonus, setClaimedBonus] = useState<number | null>(null);

  useEffect(() => {
    if (user && open) {
      fetchDailyRewardData();
    }
  }, [user, open]);

  const fetchDailyRewardData = async () => {
    if (!user) return;

    const { data } = await supabase
      .from('daily_rewards')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (data) {
      const lastClaim = new Date(data.last_claim);
      const hoursSinceClaim = (Date.now() - lastClaim.getTime()) / (1000 * 60 * 60);
      const canClaim = hoursSinceClaim >= 20;
      
      setRewardData({
        streak: data.streak,
        lastClaim,
        canClaim,
        hoursUntilNext: canClaim ? 0 : Math.ceil(20 - hoursSinceClaim),
      });
    } else {
      setRewardData({
        streak: 0,
        lastClaim: null,
        canClaim: true,
        hoursUntilNext: 0,
      });
    }
  };

  const handleClaim = async () => {
    if (!user || claiming) return;

    setClaiming(true);
    try {
      const { data, error } = await supabase.rpc('claim_daily_bonus');
      
      if (error) throw error;

      const result = data as { success: boolean; bonus?: number; streak?: number; error?: string };
      
      if (result.success) {
        setShowConfetti(true);
        setClaimedBonus(result.bonus || 0);
        toast.success(`Ви отримали ${result.bonus}₴!`);
        
        setTimeout(() => {
          setShowConfetti(false);
          setClaimedBonus(null);
          onOpenChange(false);
        }, 3000);
        
        await fetchDailyRewardData();
      } else {
        toast.error(result.error || 'Помилка отримання бонусу');
      }
    } catch (error: any) {
      toast.error('Помилка: ' + error.message);
    } finally {
      setClaiming(false);
    }
  };

  const nextStreak = rewardData.canClaim 
    ? Math.min(rewardData.streak + 1, 7)
    : rewardData.streak;

  return (
    <>
      {showConfetti && <Confetti />}
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-2xl">
              <Gift className="h-7 w-7 text-primary" />
              Щоденний бонус
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6 pt-4">
            {/* Streak Display */}
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Flame className="h-6 w-6 text-orange-500" />
                <span className="text-3xl font-bold">{rewardData.streak}</span>
                <span className="text-muted-foreground">днів поспіль</span>
              </div>
              <Progress 
                value={(rewardData.streak / 7) * 100} 
                className="h-2"
              />
            </div>

            {/* Bonus Grid */}
            <div className="grid grid-cols-7 gap-1">
              {STREAK_BONUSES.map((item, index) => {
                const isPast = index < rewardData.streak;
                const isCurrent = index === nextStreak - 1 && rewardData.canClaim;
                const isFuture = index >= nextStreak;
                
                return (
                  <div
                    key={item.day}
                    className={cn(
                      "flex flex-col items-center p-2 rounded-lg border transition-all",
                      isPast && "bg-primary/20 border-primary",
                      isCurrent && "bg-primary border-primary scale-110 shadow-lg",
                      isFuture && "bg-muted/50 border-border opacity-50"
                    )}
                  >
                    <span className="text-xs text-muted-foreground">День</span>
                    <span className="font-bold">{item.day}</span>
                    <span className={cn(
                      "text-xs font-medium",
                      isCurrent ? "text-primary-foreground" : "text-primary"
                    )}>
                      {item.bonus}₴
                    </span>
                    {isPast && <Check className="h-3 w-3 text-primary mt-1" />}
                  </div>
                );
              })}
            </div>

            {/* Claim Button or Timer */}
            {claimedBonus !== null ? (
              <div className="text-center py-4">
                <div className="text-4xl font-bold text-primary animate-bounce">
                  +{claimedBonus}₴
                </div>
                <p className="text-muted-foreground mt-2">Бонус зараховано!</p>
              </div>
            ) : rewardData.canClaim ? (
              <Button
                className="w-full text-lg py-6"
                onClick={handleClaim}
                disabled={claiming}
              >
                {claiming ? (
                  'Отримання...'
                ) : (
                  <>
                    <Gift className="h-5 w-5 mr-2" />
                    Забрати {STREAK_BONUSES[Math.min(nextStreak - 1, 6)].bonus}₴
                  </>
                )}
              </Button>
            ) : (
              <div className="text-center py-4">
                <div className="flex items-center justify-center gap-2 text-muted-foreground">
                  <Clock className="h-5 w-5" />
                  <span>Наступний бонус через</span>
                </div>
                <div className="text-2xl font-bold text-primary mt-2">
                  {rewardData.hoursUntilNext} год
                </div>
              </div>
            )}

            {/* Info */}
            <p className="text-xs text-center text-muted-foreground">
              Заходьте кожен день, щоб збільшити бонус! 
              Серія обнуляється після 48 годин без входу.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default DailyRewardModal;
