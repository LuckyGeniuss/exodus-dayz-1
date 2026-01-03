import { useState, useEffect, useRef } from 'react';
import { Disc3, Gift, Clock, Sparkles } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/AuthProvider';
import { toast } from 'sonner';
import Confetti from '@/components/Confetti';
import { cn } from '@/lib/utils';

interface FortuneWheelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const PRIZES = [
  { label: '100₴', color: '#FFD700', textColor: '#000' },
  { label: '10%', color: '#FF6B6B', textColor: '#fff' },
  { label: '5₴', color: '#4ECDC4', textColor: '#000' },
  { label: '50₴', color: '#95E1D3', textColor: '#000' },
  { label: 'Пусто', color: '#6C757D', textColor: '#fff' },
  { label: '25₴', color: '#F38181', textColor: '#000' },
  { label: '20%', color: '#AA96DA', textColor: '#fff' },
  { label: '10₴', color: '#FCBAD3', textColor: '#000' },
];

const FortuneWheel = ({ open, onOpenChange }: FortuneWheelProps) => {
  const { user } = useAuth();
  const [canSpin, setCanSpin] = useState(false);
  const [daysUntilNext, setDaysUntilNext] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);
  const [result, setResult] = useState<{ type: string; value: number } | null>(null);
  const wheelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user && open) {
      checkCanSpin();
    }
  }, [user, open]);

  const checkCanSpin = async () => {
    const { data, error } = await supabase.rpc('can_spin_fortune_wheel');
    if (!error && data) {
      const result = data as { can_spin: boolean; days_until_next: number };
      setCanSpin(result.can_spin);
      setDaysUntilNext(result.days_until_next || 0);
    }
  };

  const handleSpin = async () => {
    if (!user || spinning || !canSpin) return;

    setSpinning(true);
    setResult(null);

    // Generate random rotation (5-8 full rotations + random offset)
    const spins = 5 + Math.random() * 3;
    const randomAngle = Math.random() * 360;
    const totalRotation = rotation + (spins * 360) + randomAngle;
    
    setRotation(totalRotation);

    // Wait for animation to complete
    setTimeout(async () => {
      const { data, error } = await supabase.rpc('spin_fortune_wheel');
      
      if (error) {
        toast.error('Помилка: ' + error.message);
        setSpinning(false);
        return;
      }

      const spinResult = data as { success: boolean; prize_type: string; prize_value: number; error?: string };
      
      if (spinResult.success) {
        setResult({ type: spinResult.prize_type, value: spinResult.prize_value });
        if (spinResult.prize_type !== 'nothing') {
          setShowConfetti(true);
          setTimeout(() => setShowConfetti(false), 3000);
        }
        setCanSpin(false);
        setDaysUntilNext(7);
      } else {
        toast.error(spinResult.error || 'Помилка обертання');
      }
      
      setSpinning(false);
    }, 4000);
  };

  const getPrizeMessage = () => {
    if (!result) return null;
    
    switch (result.type) {
      case 'balance':
        return `🎉 Ви виграли ${result.value}₴!`;
      case 'discount':
        return `🎉 Ви виграли знижку ${result.value}%!`;
      case 'nothing':
        return '😔 На жаль, цього разу без призу. Спробуйте наступного тижня!';
      default:
        return null;
    }
  };

  return (
    <>
      {showConfetti && <Confetti />}
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-lg overflow-visible">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-2xl">
              <Disc3 className="h-7 w-7 text-primary animate-spin" style={{ animationDuration: '3s' }} />
              Колесо Фортуни
            </DialogTitle>
          </DialogHeader>

          <div className="flex flex-col items-center py-6 space-y-6">
            {/* Wheel Container */}
            <div className="relative">
              {/* Pointer */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-2 z-10">
                <div className="w-0 h-0 border-l-[15px] border-l-transparent border-r-[15px] border-r-transparent border-t-[25px] border-t-primary drop-shadow-lg" />
              </div>

              {/* Wheel */}
              <div
                ref={wheelRef}
                className="w-64 h-64 rounded-full relative overflow-hidden shadow-2xl border-4 border-primary"
                style={{
                  transform: `rotate(${rotation}deg)`,
                  transition: spinning ? 'transform 4s cubic-bezier(0.17, 0.67, 0.12, 0.99)' : 'none',
                }}
              >
                {PRIZES.map((prize, index) => {
                  const angle = (360 / PRIZES.length) * index;
                  const skewAngle = 90 - (360 / PRIZES.length);
                  
                  return (
                    <div
                      key={index}
                      className="absolute w-1/2 h-1/2 origin-bottom-right"
                      style={{
                        transform: `rotate(${angle}deg) skewY(${skewAngle}deg)`,
                        backgroundColor: prize.color,
                      }}
                    >
                      <span
                        className="absolute text-xs font-bold whitespace-nowrap"
                        style={{
                          color: prize.textColor,
                          transform: `skewY(-${skewAngle}deg) rotate(${360 / PRIZES.length / 2}deg)`,
                          left: '50%',
                          top: '30%',
                        }}
                      >
                        {prize.label}
                      </span>
                    </div>
                  );
                })}
                
                {/* Center circle */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-background border-4 border-primary flex items-center justify-center z-10">
                  <Sparkles className="h-5 w-5 text-primary" />
                </div>
              </div>
            </div>

            {/* Result Message */}
            {result && (
              <div className={cn(
                "text-center p-4 rounded-lg animate-fade-in",
                result.type === 'nothing' ? 'bg-muted' : 'bg-primary/20'
              )}>
                <p className="text-lg font-bold">{getPrizeMessage()}</p>
              </div>
            )}

            {/* Spin Button or Timer */}
            {canSpin ? (
              <Button
                size="lg"
                className="w-full text-lg py-6 gap-2"
                onClick={handleSpin}
                disabled={spinning}
              >
                {spinning ? (
                  <>
                    <Disc3 className="h-5 w-5 animate-spin" />
                    Обертається...
                  </>
                ) : (
                  <>
                    <Gift className="h-5 w-5" />
                    Крутити колесо!
                  </>
                )}
              </Button>
            ) : (
              <div className="text-center py-4">
                <div className="flex items-center justify-center gap-2 text-muted-foreground mb-2">
                  <Clock className="h-5 w-5" />
                  <span>Наступне обертання через</span>
                </div>
                <div className="text-3xl font-bold text-primary">
                  {daysUntilNext} {daysUntilNext === 1 ? 'день' : daysUntilNext < 5 ? 'дні' : 'днів'}
                </div>
              </div>
            )}

            {/* Info */}
            <p className="text-xs text-center text-muted-foreground">
              Крутіть колесо раз на тиждень та вигравайте бонуси!
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default FortuneWheel;
