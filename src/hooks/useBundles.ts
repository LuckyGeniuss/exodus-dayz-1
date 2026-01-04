import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface BundleItem {
  id: string;
  bundle_id: string;
  product_id: string;
  quantity: number;
}

interface Bundle {
  id: string;
  name: string;
  description: string | null;
  image: string | null;
  bundle_price: number;
  is_active: boolean;
  start_date: string;
  end_date: string | null;
  created_at: string;
  items?: BundleItem[];
  totalValue?: number;
  savings?: number;
}

export const useBundles = () => {
  const { data: bundles = [], isLoading } = useQuery({
    queryKey: ['bundles'],
    queryFn: async () => {
      const { data: bundlesData, error: bundlesError } = await supabase
        .from('product_bundles')
        .select('*')
        .eq('is_active', true)
        .lte('start_date', new Date().toISOString())
        .or('end_date.is.null,end_date.gt.' + new Date().toISOString());

      if (bundlesError) throw bundlesError;
      if (!bundlesData || bundlesData.length === 0) return [];

      // Get all bundle items
      const { data: itemsData, error: itemsError } = await supabase
        .from('bundle_items')
        .select('*')
        .in('bundle_id', bundlesData.map(b => b.id));

      if (itemsError) throw itemsError;

      // Get products for calculating total value
      const productIds = [...new Set(itemsData?.map(i => i.product_id) || [])];
      const { data: productsData } = await supabase
        .from('products')
        .select('id, price')
        .in('id', productIds);

      const productPrices = new Map(productsData?.map(p => [p.id, p.price]) || []);

      // Combine bundles with items and calculate savings
      return bundlesData.map(bundle => {
        const items = itemsData?.filter(i => i.bundle_id === bundle.id) || [];
        const totalValue = items.reduce((sum, item) => {
          const price = productPrices.get(item.product_id) || 0;
          return sum + (price * item.quantity);
        }, 0);
        const savings = totalValue - bundle.bundle_price;

        return {
          ...bundle,
          items,
          totalValue,
          savings
        } as Bundle;
      });
    }
  });

  return { bundles, isLoading };
};
