import { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BannerCountdownTimerProps {
  endDate: string;
  className?: string;
}

const BannerCountdownTimer = ({ endDate, className }: BannerCountdownTimerProps) => {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    expired: false,
  });

  useEffect(() => {
    const calculateTimeLeft = () => {
      const difference = new Date(endDate).getTime() - new Date().getTime();
      
      if (difference <= 0) {
        return { days: 0, hours: 0, minutes: 0, seconds: 0, expired: true };
      }

      return {
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
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

  return (
    <div className={cn(
      "inline-flex items-center gap-2 bg-black/60 backdrop-blur-sm rounded-lg px-4 py-2 border border-red-500/30",
      className
    )}>
      <Clock className="h-4 w-4 text-red-500 animate-pulse" />
      <span className="text-red-400 text-sm font-medium mr-1">До кінця:</span>
      <div className="flex items-center gap-1 font-mono font-bold text-white">
        {timeLeft.days > 0 && (
          <>
            <TimeBlock value={formatNumber(timeLeft.days)} label="д" />
            <span className="text-red-500 animate-pulse">:</span>
          </>
        )}
        <TimeBlock value={formatNumber(timeLeft.hours)} label="г" />
        <span className="text-red-500 animate-pulse">:</span>
        <TimeBlock value={formatNumber(timeLeft.minutes)} label="хв" />
        <span className="text-red-500 animate-pulse">:</span>
        <TimeBlock value={formatNumber(timeLeft.seconds)} label="с" />
      </div>
    </div>
  );
};

const TimeBlock = ({ value, label }: { value: string; label: string }) => (
  <div className="flex flex-col items-center">
    <span className="bg-red-600/20 px-2 py-0.5 rounded text-lg leading-tight">{value}</span>
    <span className="text-[10px] text-red-400/70 uppercase">{label}</span>
  </div>
);

export default BannerCountdownTimer;
