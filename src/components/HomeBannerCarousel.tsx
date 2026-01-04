import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, ChevronRight, ShoppingCart } from 'lucide-react';
import { cn } from '@/lib/utils';
import BannerCountdownTimer from './BannerCountdownTimer';

interface Banner {
  id: string;
  title: string;
  subtitle: string | null;
  image_url: string | null;
  link_url: string | null;
  link_text: string | null;
  badge_text: string | null;
  badge_color: string | null;
  background_gradient: string | null;
  display_order: number;
  end_date: string | null;
}

const HomeBannerCarousel = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [direction, setDirection] = useState<'left' | 'right'>('right');

  const { data: banners = [] } = useQuery({
    queryKey: ['homepage-banners'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('homepage_banners')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      if (error) throw error;
      return data as Banner[];
    },
    staleTime: 60000,
  });

  useEffect(() => {
    if (!isAutoPlaying || banners.length <= 1) return;

    const interval = setInterval(() => {
      setDirection('right');
      setCurrentIndex((prev) => (prev + 1) % banners.length);
    }, 6000);

    return () => clearInterval(interval);
  }, [banners.length, isAutoPlaying]);

  const goToSlide = (index: number) => {
    setDirection(index > currentIndex ? 'right' : 'left');
    setCurrentIndex(index);
    setIsAutoPlaying(false);
    setTimeout(() => setIsAutoPlaying(true), 12000);
  };

  const goToPrevious = () => {
    setDirection('left');
    setCurrentIndex((prev) => (prev - 1 + banners.length) % banners.length);
    setIsAutoPlaying(false);
    setTimeout(() => setIsAutoPlaying(true), 12000);
  };

  const goToNext = () => {
    setDirection('right');
    setCurrentIndex((prev) => (prev + 1) % banners.length);
    setIsAutoPlaying(false);
    setTimeout(() => setIsAutoPlaying(true), 12000);
  };

  if (banners.length === 0) return null;

  const getBadgeVariant = (color: string | null): "default" | "secondary" | "destructive" | "outline" => {
    switch (color) {
      case 'destructive': return 'destructive';
      case 'secondary': return 'secondary';
      case 'outline': return 'outline';
      default: return 'default';
    }
  };

  return (
    <section className="relative overflow-hidden bg-zinc-950">
      {/* Scanlines overlay for DayZ effect */}
      <div className="absolute inset-0 z-10 pointer-events-none opacity-20"
        style={{
          backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.3) 2px, rgba(0,0,0,0.3) 4px)',
        }}
      />
      
      {/* Vignette effect */}
      <div className="absolute inset-0 z-10 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at center, transparent 0%, rgba(0,0,0,0.4) 100%)',
        }}
      />

      <div className="relative h-[320px] md:h-[420px] lg:h-[480px]">
        {banners.map((banner, index) => (
          <div
            key={banner.id}
            className={cn(
              'absolute inset-0 transition-all duration-1000 ease-in-out',
              index === currentIndex
                ? 'opacity-100 scale-100 z-[5]'
                : 'opacity-0 scale-105 z-0'
            )}
          >
            {/* Background image with parallax effect */}
            <div
              className="absolute inset-0 bg-cover bg-center transition-transform duration-[8000ms] ease-linear"
              style={{
                backgroundImage: banner.image_url 
                  ? `url(${banner.image_url})`
                  : undefined,
                transform: index === currentIndex ? 'scale(1.1)' : 'scale(1)',
              }}
            />
            
            {/* Dark overlay with gradient */}
            <div 
              className={cn(
                "absolute inset-0 bg-gradient-to-r opacity-90",
                banner.background_gradient || 'from-zinc-900/95 via-zinc-900/80 to-zinc-900/95'
              )}
            />
            
            {/* Additional cinematic gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/40" />

            {/* Content */}
            <div className="relative z-20 h-full flex items-center">
              <div className="container mx-auto px-4 md:px-8">
                <div className="max-w-2xl">
                  {/* Badge and Timer Row */}
                  <div className="flex flex-wrap items-center gap-3 mb-4">
                    {banner.badge_text && (
                      <Badge
                        variant={getBadgeVariant(banner.badge_color)}
                        className={cn(
                          "text-lg px-4 py-1.5 font-bold animate-pulse",
                          "shadow-lg",
                          banner.badge_color === 'destructive' && "bg-red-600 hover:bg-red-700"
                        )}
                      >
                        {banner.badge_text}
                      </Badge>
                    )}
                    {banner.end_date && (
                      <BannerCountdownTimer endDate={banner.end_date} />
                    )}
                  </div>
                  
                  {/* Title with military font styling */}
                  <h2 className="text-3xl md:text-5xl lg:text-6xl font-bold mb-4 text-white drop-shadow-[0_4px_8px_rgba(0,0,0,0.8)] tracking-wide">
                    {banner.title}
                  </h2>
                  
                  {/* Subtitle */}
                  {banner.subtitle && (
                    <p className="text-lg md:text-xl lg:text-2xl mb-8 text-zinc-300 drop-shadow-lg max-w-xl leading-relaxed">
                      {banner.subtitle}
                    </p>
                  )}
                  
                  {/* CTA Button */}
                  {banner.link_url && (
                    <Button
                      asChild
                      size="lg"
                      className={cn(
                        "text-lg px-8 py-6 font-semibold",
                        "bg-gradient-to-r from-primary to-primary/80",
                        "hover:from-primary/90 hover:to-primary",
                        "shadow-[0_0_30px_rgba(var(--primary),0.3)]",
                        "hover:shadow-[0_0_40px_rgba(var(--primary),0.5)]",
                        "transition-all duration-300 hover:scale-105",
                        "border border-primary/30"
                      )}
                    >
                      <Link to={banner.link_url} className="flex items-center gap-2">
                        <ShoppingCart className="h-5 w-5" />
                        {banner.link_text || 'Детальніше'}
                      </Link>
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}

        {/* Navigation Arrows - Military style */}
        {banners.length > 1 && (
          <>
            <button
              onClick={goToPrevious}
              className={cn(
                "absolute left-4 md:left-8 top-1/2 -translate-y-1/2 z-30",
                "w-12 h-12 md:w-14 md:h-14 rounded-full",
                "bg-black/50 backdrop-blur-sm border border-white/20",
                "text-white/80 hover:text-white hover:bg-black/70",
                "transition-all duration-300 hover:scale-110",
                "flex items-center justify-center",
                "shadow-lg"
              )}
              aria-label="Попередній слайд"
            >
              <ChevronLeft className="h-6 w-6 md:h-7 md:w-7" />
            </button>
            <button
              onClick={goToNext}
              className={cn(
                "absolute right-4 md:right-8 top-1/2 -translate-y-1/2 z-30",
                "w-12 h-12 md:w-14 md:h-14 rounded-full",
                "bg-black/50 backdrop-blur-sm border border-white/20",
                "text-white/80 hover:text-white hover:bg-black/70",
                "transition-all duration-300 hover:scale-110",
                "flex items-center justify-center",
                "shadow-lg"
              )}
              aria-label="Наступний слайд"
            >
              <ChevronRight className="h-6 w-6 md:h-7 md:w-7" />
            </button>
          </>
        )}

        {/* Dots Navigation - DayZ style */}
        {banners.length > 1 && (
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 flex gap-3">
            {banners.map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className={cn(
                  'h-2 rounded-full transition-all duration-500',
                  'border border-white/30',
                  index === currentIndex
                    ? 'bg-primary w-10 shadow-[0_0_10px_rgba(var(--primary),0.5)]'
                    : 'bg-white/30 w-2 hover:bg-white/50'
                )}
                aria-label={`Перейти до слайду ${index + 1}`}
              />
            ))}
          </div>
        )}

        {/* Progress bar */}
        {banners.length > 1 && isAutoPlaying && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/50 z-30">
            <div 
              className="h-full bg-primary transition-all ease-linear"
              style={{
                animation: 'progress 6s linear infinite',
                width: '100%',
              }}
            />
            <style>{`
              @keyframes progress {
                from { transform: scaleX(0); transform-origin: left; }
                to { transform: scaleX(1); transform-origin: left; }
              }
            `}</style>
          </div>
        )}
      </div>
    </section>
  );
};

export default HomeBannerCarousel;
