import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Zap, Clock } from 'lucide-react';

interface FlashSaleBadgeProps {
  endDate: string;
  discountPercent: number;
  title?: string;
  variant?: 'badge' | 'timer' | 'full';
}

const FlashSaleBadge = ({ endDate, discountPercent, title, variant = 'badge' }: FlashSaleBadgeProps) => {
  const [timeLeft, setTimeLeft] = useState({
    hours: 0,
    minutes: 0,
    seconds: 0,
    expired: false,
  });

  useEffect(() => {
    const calculateTimeLeft = () => {
      const difference = new Date(endDate).getTime() - new Date().getTime();
      
      if (difference <= 0) {
        return { hours: 0, minutes: 0, seconds: 0, expired: true };
      }

      return {
        hours: Math.floor(difference / (1000 * 60 * 60)),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60),
        expired: false,
      };
    };

    setTimeLeft(calculateTimeLeft());
    
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, [endDate]);

  if (timeLeft.expired) return null;

  const formatNumber = (n: number) => n.toString().padStart(2, '0');

  if (variant === 'badge') {
    return (
      <Badge className="bg-gradient-to-r from-red-500 to-orange-500 text-white animate-pulse flex items-center gap-1">
        <Zap className="h-3 w-3" />
        -{discountPercent}%
      </Badge>
    );
  }

  if (variant === 'timer') {
    return (
      <div className="flex items-center gap-1 text-sm font-mono">
        <Clock className="h-3 w-3 text-orange-500" />
        <span className="text-orange-500 font-bold">
          {formatNumber(timeLeft.hours)}:{formatNumber(timeLeft.minutes)}:{formatNumber(timeLeft.seconds)}
        </span>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-r from-red-600 to-orange-500 rounded-lg p-3 text-white">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Zap className="h-5 w-5 animate-pulse" />
          <span className="font-bold text-lg">{title || 'FLASH SALE!'}</span>
          <Badge variant="secondary" className="bg-white/20 text-white">
            -{discountPercent}%
          </Badge>
        </div>
        <div className="flex items-center gap-2 bg-black/20 rounded px-3 py-1">
          <Clock className="h-4 w-4" />
          <div className="flex gap-1 font-mono font-bold text-lg">
            <span className="bg-black/30 px-1 rounded">{formatNumber(timeLeft.hours)}</span>
            <span>:</span>
            <span className="bg-black/30 px-1 rounded">{formatNumber(timeLeft.minutes)}</span>
            <span>:</span>
            <span className="bg-black/30 px-1 rounded">{formatNumber(timeLeft.seconds)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FlashSaleBadge;
