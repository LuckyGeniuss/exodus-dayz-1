import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface Promotion {
  id: string;
  product_id: string;
  discount_percent: number;
  start_date: string;
  end_date: string | null;
  is_active: boolean;
  is_flash_sale?: boolean;
  flash_title?: string | null;
}

export const usePromotions = () => {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPromotions();
  }, []);

  const fetchPromotions = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('promotions')
        .select('*')
        .eq('is_active', true);

      if (error) throw error;
      setPromotions(data || []);
    } catch (err) {
      console.error('Error fetching promotions:', err);
    } finally {
      setLoading(false);
    }
  };

  const getProductPromotion = (productId: string) => {
    return promotions.find(p => p.product_id === productId);
  };

  const getFlashSales = () => {
    return promotions.filter(p => p.is_flash_sale && p.end_date && new Date(p.end_date) > new Date());
  };

  return { promotions, loading, getProductPromotion, getFlashSales };
};
