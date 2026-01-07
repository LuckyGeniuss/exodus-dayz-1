import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/AuthProvider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ShoppingCart, Package, Calendar, TrendingUp } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

const UserStatsCard = () => {
  const { user } = useAuth();

  const { data: stats, isLoading } = useQuery({
    queryKey: ['user-stats', user?.id],
    queryFn: async () => {
      if (!user) return null;

      // Get orders count and total spent
      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select('id, final_amount, created_at')
        .eq('user_id', user.id)
        .eq('payment_status', 'completed');

      if (ordersError) throw ordersError;

      // Get unique products purchased
      const orderIds = orders?.map(o => o.id) || [];
      let uniqueProducts = 0;
      
      if (orderIds.length > 0) {
        const { data: orderItems } = await supabase
          .from('order_items')
          .select('product_id')
          .in('order_id', orderIds);
        uniqueProducts = new Set(orderItems?.map(i => i.product_id) || []).size;
      }

      // Calculate stats
      const totalOrders = orders?.length || 0;
      const totalSpent = orders?.reduce((sum, o) => sum + Number(o.final_amount), 0) || 0;
      const avgOrderValue = totalOrders > 0 ? totalSpent / totalOrders : 0;

      // Get first order date
      const firstOrderDate = orders?.length 
        ? new Date(Math.min(...orders.map(o => new Date(o.created_at).getTime())))
        : null;

      return {
        totalOrders,
        totalSpent,
        avgOrderValue,
        uniqueProducts,
        memberSince: firstOrderDate,
      };
    },
    enabled: !!user,
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-40" />
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            {[1, 2, 3, 4].map(i => (
              <Skeleton key={i} className="h-16" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!stats) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          Моя статистика
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
              <ShoppingCart className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.totalOrders}</p>
              <p className="text-xs text-muted-foreground">Замовлень</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
            <div className="h-10 w-10 rounded-full bg-green-500/10 flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-green-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.totalSpent.toLocaleString()}₴</p>
              <p className="text-xs text-muted-foreground">Витрачено</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
            <div className="h-10 w-10 rounded-full bg-blue-500/10 flex items-center justify-center">
              <Package className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.uniqueProducts}</p>
              <p className="text-xs text-muted-foreground">Товарів куплено</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
            <div className="h-10 w-10 rounded-full bg-amber-500/10 flex items-center justify-center">
              <Calendar className="h-5 w-5 text-amber-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{Math.round(stats.avgOrderValue)}₴</p>
              <p className="text-xs text-muted-foreground">Сер. чек</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default UserStatsCard;
