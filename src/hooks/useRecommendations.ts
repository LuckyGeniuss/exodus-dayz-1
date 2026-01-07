import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/AuthProvider';

interface Product {
  id: string;
  name: string;
  price: number;
  image: string | null;
  category: string;
  description: string | null;
}

export const useRecommendations = (limit = 6) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['recommendations', user?.id, limit],
    queryFn: async (): Promise<Product[]> => {
      // Get user's purchase history
      let purchasedCategories: string[] = [];
      let purchasedProductIds: string[] = [];

      if (user) {
        // Get user's orders
        const { data: orders } = await supabase
          .from('orders')
          .select('id')
          .eq('user_id', user.id)
          .eq('payment_status', 'completed');

        if (orders && orders.length > 0) {
          // Get purchased products
          const { data: orderItems } = await supabase
            .from('order_items')
            .select('product_id')
            .in('order_id', orders.map(o => o.id));

          if (orderItems) {
            purchasedProductIds = orderItems.map(i => i.product_id);
          }
        }

        // Get viewed products
        const { data: viewedProducts } = await supabase
          .from('viewed_products')
          .select('product_id')
          .eq('user_id', user.id)
          .order('viewed_at', { ascending: false })
          .limit(20);

        if (viewedProducts) {
          purchasedProductIds = [...new Set([...purchasedProductIds, ...viewedProducts.map(v => v.product_id)])];
        }

        // Get wishlist items
        const { data: wishlistItems } = await supabase
          .from('wishlist')
          .select('product_id')
          .eq('user_id', user.id);

        if (wishlistItems) {
          purchasedProductIds = [...new Set([...purchasedProductIds, ...wishlistItems.map(w => w.product_id)])];
        }
      }

      // Get categories from purchased/viewed products
      if (purchasedProductIds.length > 0) {
        const { data: purchasedProducts } = await supabase
          .from('products')
          .select('category')
          .in('id', purchasedProductIds.slice(0, 10));

        if (purchasedProducts) {
          purchasedCategories = [...new Set(purchasedProducts.map(p => p.category))];
        }
      }

      // Strategy: Recommend products from same categories that user hasn't purchased
      let recommendations: Product[] = [];

      if (purchasedCategories.length > 0) {
        // Get products from same categories, excluding already purchased
        const { data: categoryProducts } = await supabase
          .from('products')
          .select('*')
          .in('category', purchasedCategories)
          .not('id', 'in', `(${purchasedProductIds.slice(0, 50).join(',')})`)
          .limit(limit);

        if (categoryProducts && categoryProducts.length > 0) {
          recommendations = categoryProducts;
        }
      }

      // If not enough recommendations, get popular products
      if (recommendations.length < limit) {
        const excludeIds = [...purchasedProductIds, ...recommendations.map(r => r.id)];
        
        // Get products with most views/orders
        const { data: popularProducts } = await supabase
          .from('products')
          .select('*')
          .not('id', 'in', `(${excludeIds.slice(0, 50).join(',') || 'null'})`)
          .limit(limit - recommendations.length);

        if (popularProducts) {
          recommendations = [...recommendations, ...popularProducts];
        }
      }

      // Shuffle for variety
      return recommendations.sort(() => Math.random() - 0.5).slice(0, limit);
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};
