import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ChevronLeft, ChevronRight, ZoomIn } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

interface ProductImage {
  id: string;
  product_id: string;
  image_url: string;
  display_order: number;
  is_primary: boolean;
}

interface ProductGalleryProps {
  productId: string;
  mainImage: string;
  productName: string;
}

const ProductGallery = ({ productId, mainImage, productName }: ProductGalleryProps) => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isZoomed, setIsZoomed] = useState(false);

  const { data: additionalImages } = useQuery({
    queryKey: ['product-images', productId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('product_images')
        .select('*')
        .eq('product_id', productId)
        .order('display_order');

      if (error) throw error;
      return data as ProductImage[];
    },
  });

  // Combine main image with additional images
  const allImages = [
    { id: 'main', image_url: mainImage, is_primary: true },
    ...(additionalImages || []),
  ];

  const currentImage = allImages[selectedIndex]?.image_url || mainImage;

  const goToPrevious = () => {
    setSelectedIndex((prev) => (prev === 0 ? allImages.length - 1 : prev - 1));
  };

  const goToNext = () => {
    setSelectedIndex((prev) => (prev === allImages.length - 1 ? 0 : prev + 1));
  };

  return (
    <div className="space-y-4">
      {/* Main Image */}
      <div className="relative aspect-square rounded-lg overflow-hidden bg-muted border border-border group">
        <img
          src={currentImage}
          alt={`${productName} - ${selectedIndex + 1}`}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />

        {/* Zoom Button */}
        <Dialog open={isZoomed} onOpenChange={setIsZoomed}>
          <DialogTrigger asChild>
            <Button
              variant="secondary"
              size="icon"
              className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <ZoomIn className="h-4 w-4" />
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl p-0">
            <img
              src={currentImage}
              alt={productName}
              className="w-full h-auto max-h-[80vh] object-contain"
            />
          </DialogContent>
        </Dialog>

        {/* Navigation Arrows */}
        {allImages.length > 1 && (
          <>
            <Button
              variant="secondary"
              size="icon"
              className="absolute left-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={goToPrevious}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="secondary"
              size="icon"
              className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={goToNext}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </>
        )}

        {/* Image Counter */}
        {allImages.length > 1 && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-background/80 backdrop-blur-sm px-3 py-1 rounded-full text-sm">
            {selectedIndex + 1} / {allImages.length}
          </div>
        )}
      </div>

      {/* Thumbnails */}
      {allImages.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-2">
          {allImages.map((image, index) => (
            <button
              key={image.id}
              onClick={() => setSelectedIndex(index)}
              className={cn(
                "flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all",
                selectedIndex === index
                  ? "border-primary ring-2 ring-primary/20"
                  : "border-border hover:border-primary/50"
              )}
            >
              <img
                src={image.image_url}
                alt={`${productName} thumbnail ${index + 1}`}
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProductGallery;
