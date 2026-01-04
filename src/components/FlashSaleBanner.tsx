import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { usePromotions } from '@/hooks/usePromotions';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Zap, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

const FlashSaleBanner = () => {
  const { getFlashSales } = usePromotions();
  const flashSales = getFlashSales();
  const [timeLeft, setTimeLeft] = useState<{ hours: number; minutes: number; seconds: number } | null>(null);

  const activeFlashSale = flashSales[0];

  useEffect(() => {
    if (!activeFlashSale?.end_date) return;

    const calculateTimeLeft = () => {
      const endDate = new Date(activeFlashSale.end_date!);
      const now = new Date();
      const diff = endDate.getTime() - now.getTime();

      if (diff <= 0) {
        setTimeLeft(null);
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeLeft({ hours, minutes, seconds });
    };

    calculateTimeLeft();
    const interval = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(interval);
  }, [activeFlashSale]);

  if (!activeFlashSale || !timeLeft) return null;

  return (
    <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 py-3 px-4">
      <div className="container mx-auto flex flex-wrap items-center justify-center gap-4 text-white">
        <div className="flex items-center gap-2">
          <Zap className="h-5 w-5 animate-pulse" />
          <span className="font-bold text-lg">
            {activeFlashSale.flash_title || 'FLASH SALE'}
          </span>
          <Badge variant="secondary" className="bg-white/20 text-white border-0">
            -{activeFlashSale.discount_percent}%
          </Badge>
        </div>

        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4" />
          <div className="flex gap-1 font-mono">
            <TimeUnit value={timeLeft.hours} label="год" />
            <span className="text-xl font-bold">:</span>
            <TimeUnit value={timeLeft.minutes} label="хв" />
            <span className="text-xl font-bold">:</span>
            <TimeUnit value={timeLeft.seconds} label="сек" />
          </div>
        </div>

        <Button
          asChild
          variant="secondary"
          size="sm"
          className="bg-white text-orange-600 hover:bg-white/90"
        >
          <Link to="/#shop">
            Перейти до товарів
          </Link>
        </Button>
      </div>
    </div>
  );
};

const TimeUnit = ({ value, label }: { value: number; label: string }) => (
  <div className="flex flex-col items-center">
    <span className={cn(
      "text-xl font-bold bg-white/20 px-2 py-0.5 rounded",
      value < 10 && "text-yellow-200"
    )}>
      {value.toString().padStart(2, '0')}
    </span>
    <span className="text-[10px] uppercase opacity-80">{label}</span>
  </div>
);

export default FlashSaleBanner;
