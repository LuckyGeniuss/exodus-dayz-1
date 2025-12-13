import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface ProductRating {
  productId: string;
  averageRating: number;
  reviewCount: number;
}

export const useProductsRatings = () => {
  return useQuery({
    queryKey: ['products-ratings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('reviews')
        .select('product_id, rating');

      if (error) throw error;

      // Group by product_id and calculate averages
      const ratingsMap = new Map<string, { total: number; count: number }>();
      
      data?.forEach((review) => {
        const existing = ratingsMap.get(review.product_id) || { total: 0, count: 0 };
        ratingsMap.set(review.product_id, {
          total: existing.total + review.rating,
          count: existing.count + 1,
        });
      });

      const ratings: ProductRating[] = [];
      ratingsMap.forEach((value, productId) => {
        ratings.push({
          productId,
          averageRating: value.total / value.count,
          reviewCount: value.count,
        });
      });

      return ratings;
    },
  });
};
