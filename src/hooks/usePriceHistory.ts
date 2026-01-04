import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/auth/AuthProvider";
import { toast } from "sonner";

interface PriceHistoryEntry {
  id: string;
  product_id: string;
  old_price: number;
  new_price: number;
  changed_at: string;
}

interface PriceAlert {
  id: string;
  user_id: string;
  product_id: string;
  target_price: number;
  is_active: boolean;
  notified_at: string | null;
  created_at: string;
}

export const usePriceHistory = (productId?: string) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: priceHistory = [], isLoading: historyLoading } = useQuery({
    queryKey: ['price-history', productId],
    queryFn: async () => {
      if (!productId) return [];
      
      const { data, error } = await supabase
        .from('price_history')
        .select('*')
        .eq('product_id', productId)
        .order('changed_at', { ascending: true })
        .limit(30);

      if (error) throw error;
      return data as PriceHistoryEntry[];
    },
    enabled: !!productId
  });

  const { data: priceAlert } = useQuery({
    queryKey: ['price-alert', productId, user?.id],
    queryFn: async () => {
      if (!productId || !user) return null;
      
      const { data, error } = await supabase
        .from('price_alerts')
        .select('*')
        .eq('product_id', productId)
        .eq('user_id', user.id)
        .eq('is_active', true)
        .maybeSingle();

      if (error) throw error;
      return data as PriceAlert | null;
    },
    enabled: !!productId && !!user
  });

  const createAlertMutation = useMutation({
    mutationFn: async ({ targetPrice }: { targetPrice: number }) => {
      if (!user || !productId) throw new Error('Missing data');

      const { error } = await supabase
        .from('price_alerts')
        .upsert({
          user_id: user.id,
          product_id: productId,
          target_price: targetPrice,
          is_active: true
        }, { onConflict: 'user_id,product_id' });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['price-alert', productId] });
      toast.success('Підписку на зниження ціни створено!');
    },
    onError: () => {
      toast.error('Не вдалось створити підписку');
    }
  });

  const removeAlertMutation = useMutation({
    mutationFn: async () => {
      if (!user || !productId) throw new Error('Missing data');

      const { error } = await supabase
        .from('price_alerts')
        .delete()
        .eq('user_id', user.id)
        .eq('product_id', productId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['price-alert', productId] });
      toast.success('Підписку видалено');
    }
  });

  // Calculate price trend
  const priceTrend = priceHistory.length >= 2 
    ? priceHistory[priceHistory.length - 1].new_price - priceHistory[priceHistory.length - 2].new_price
    : 0;

  const lowestPrice = priceHistory.length > 0
    ? Math.min(...priceHistory.map(p => p.new_price))
    : null;

  const highestPrice = priceHistory.length > 0
    ? Math.max(...priceHistory.map(p => p.new_price))
    : null;

  return {
    priceHistory,
    historyLoading,
    priceAlert,
    priceTrend,
    lowestPrice,
    highestPrice,
    createAlert: (targetPrice: number) => createAlertMutation.mutateAsync({ targetPrice }),
    removeAlert: () => removeAlertMutation.mutateAsync(),
    isCreatingAlert: createAlertMutation.isPending
  };
};
