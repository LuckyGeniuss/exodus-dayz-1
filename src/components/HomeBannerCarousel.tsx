import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

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
}

const HomeBannerCarousel = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

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
      setCurrentIndex((prev) => (prev + 1) % banners.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [banners.length, isAutoPlaying]);

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
    setIsAutoPlaying(false);
    setTimeout(() => setIsAutoPlaying(true), 10000);
  };

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + banners.length) % banners.length);
    setIsAutoPlaying(false);
    setTimeout(() => setIsAutoPlaying(true), 10000);
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % banners.length);
    setIsAutoPlaying(false);
    setTimeout(() => setIsAutoPlaying(true), 10000);
  };

  if (banners.length === 0) return null;

  const currentBanner = banners[currentIndex];

  const getBadgeVariant = (color: string | null): "default" | "secondary" | "destructive" | "outline" => {
    switch (color) {
      case 'destructive': return 'destructive';
      case 'secondary': return 'secondary';
      case 'outline': return 'outline';
      default: return 'default';
    }
  };

  return (
    <section className="relative overflow-hidden">
      <div className="relative h-[280px] md:h-[360px] lg:h-[400px]">
        {banners.map((banner, index) => (
          <div
            key={banner.id}
            className={cn(
              'absolute inset-0 transition-all duration-700 ease-in-out',
              index === currentIndex
                ? 'opacity-100 translate-x-0'
                : index < currentIndex
                ? 'opacity-0 -translate-x-full'
                : 'opacity-0 translate-x-full'
            )}
          >
            <div
              className={cn(
                'h-full w-full bg-gradient-to-r flex items-center justify-center',
                banner.background_gradient || 'from-primary/20 via-primary/10 to-background'
              )}
              style={
                banner.image_url
                  ? {
                      backgroundImage: `linear-gradient(to right, rgba(0,0,0,0.7), rgba(0,0,0,0.5)), url(${banner.image_url})`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                    }
                  : undefined
              }
            >
              <div className="container mx-auto px-4 text-center text-white">
                {banner.badge_text && (
                  <Badge
                    variant={getBadgeVariant(banner.badge_color)}
                    className="mb-4 text-lg px-4 py-1"
                  >
                    {banner.badge_text}
                  </Badge>
                )}
                <h2 className="text-3xl md:text-5xl lg:text-6xl font-bold mb-4 drop-shadow-lg">
                  {banner.title}
                </h2>
                {banner.subtitle && (
                  <p className="text-lg md:text-xl lg:text-2xl mb-6 text-white/90 drop-shadow">
                    {banner.subtitle}
                  </p>
                )}
                {banner.link_url && (
                  <Button
                    asChild
                    size="lg"
                    className="text-lg px-8 shadow-lg hover:scale-105 transition-transform"
                  >
                    <Link to={banner.link_url}>
                      {banner.link_text || 'Детальніше'}
                    </Link>
                  </Button>
                )}
              </div>
            </div>
          </div>
        ))}

        {/* Navigation Arrows */}
        {banners.length > 1 && (
          <>
            <button
              onClick={goToPrevious}
              className="absolute left-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/30 text-white hover:bg-black/50 transition-colors"
              aria-label="Попередній слайд"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
            <button
              onClick={goToNext}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/30 text-white hover:bg-black/50 transition-colors"
              aria-label="Наступний слайд"
            >
              <ChevronRight className="h-6 w-6" />
            </button>
          </>
        )}

        {/* Dots Navigation */}
        {banners.length > 1 && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
            {banners.map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className={cn(
                  'w-3 h-3 rounded-full transition-all',
                  index === currentIndex
                    ? 'bg-white w-8'
                    : 'bg-white/50 hover:bg-white/70'
                )}
                aria-label={`Перейти до слайду ${index + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default HomeBannerCarousel;
