import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/AuthProvider';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Bell, BellOff, TrendingDown, Trash2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface PriceAlertCardProps {
  productId: string;
  productName: string;
  currentPrice: number;
}

const PriceAlertCard = ({ productId, productName, currentPrice }: PriceAlertCardProps) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [targetPrice, setTargetPrice] = useState('');
  const [showForm, setShowForm] = useState(false);

  // Fetch existing alert for this product
  const { data: existingAlert, isLoading } = useQuery({
    queryKey: ['price-alert', productId, user?.id],
    queryFn: async () => {
      if (!user) return null;
      
      const { data, error } = await supabase
        .from('price_alerts')
        .select('*')
        .eq('user_id', user.id)
        .eq('product_id', productId)
        .eq('is_active', true)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const createAlertMutation = useMutation({
    mutationFn: async (price: number) => {
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('price_alerts')
        .insert({
          user_id: user.id,
          product_id: productId,
          target_price: price,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['price-alert', productId] });
      queryClient.invalidateQueries({ queryKey: ['user-price-alerts'] });
      toast.success('Сповіщення створено');
      setShowForm(false);
      setTargetPrice('');
    },
    onError: () => {
      toast.error('Помилка створення сповіщення');
    },
  });

  const deleteAlertMutation = useMutation({
    mutationFn: async () => {
      if (!user || !existingAlert) return;

      const { error } = await supabase
        .from('price_alerts')
        .delete()
        .eq('id', existingAlert.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['price-alert', productId] });
      queryClient.invalidateQueries({ queryKey: ['user-price-alerts'] });
      toast.success('Сповіщення видалено');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const price = parseFloat(targetPrice);
    if (isNaN(price) || price <= 0) {
      toast.error('Введіть коректну ціну');
      return;
    }
    if (price >= currentPrice) {
      toast.error('Ціна має бути нижчою за поточну');
      return;
    }
    createAlertMutation.mutate(price);
  };

  if (!user) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <BellOff className="h-4 w-4" />
        <span>Увійдіть для налаштування сповіщень</span>
      </div>
    );
  }

  if (isLoading) {
    return <Loader2 className="h-4 w-4 animate-spin" />;
  }

  if (existingAlert) {
    return (
      <div className="flex items-center justify-between p-3 bg-primary/10 rounded-lg">
        <div className="flex items-center gap-2">
          <Bell className="h-4 w-4 text-primary" />
          <span className="text-sm">
            Сповіщення при ціні <strong>{existingAlert.target_price}₴</strong>
          </span>
        </div>
        <Button 
          variant="ghost" 
          size="icon"
          onClick={() => deleteAlertMutation.mutate()}
          disabled={deleteAlertMutation.isPending}
        >
          <Trash2 className="h-4 w-4 text-destructive" />
        </Button>
      </div>
    );
  }

  if (showForm) {
    return (
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="flex items-center gap-2">
          <TrendingDown className="h-4 w-4 text-green-500" />
          <span className="text-sm font-medium">Сповістити при зниженні ціни</span>
        </div>
        <div className="flex gap-2">
          <Input
            type="number"
            placeholder={`Менше ${currentPrice}₴`}
            value={targetPrice}
            onChange={(e) => setTargetPrice(e.target.value)}
            max={currentPrice - 1}
            className="flex-1"
          />
          <Button type="submit" size="sm" disabled={createAlertMutation.isPending}>
            {createAlertMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              'Створити'
            )}
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={() => setShowForm(false)}>
            Скасувати
          </Button>
        </div>
      </form>
    );
  }

  return (
    <Button 
      variant="outline" 
      size="sm" 
      onClick={() => setShowForm(true)}
      className="gap-2"
    >
      <Bell className="h-4 w-4" />
      Сповістити про зниження ціни
    </Button>
  );
};

export default PriceAlertCard;
