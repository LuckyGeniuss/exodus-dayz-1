import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  ShoppingCart, 
  Users, 
  Package,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { format, subDays, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';

interface StatsData {
  revenue: number;
  orders: number;
  users: number;
  products: number;
  previousRevenue: number;
  previousOrders: number;
  previousUsers: number;
}

const DashboardStatsEnhanced = () => {
  const { data: todayStats } = useQuery({
    queryKey: ['admin-stats-today'],
    queryFn: async () => {
      const today = new Date();
      const yesterday = subDays(today, 1);

      // Today's data
      const { data: todayOrders } = await supabase
        .from('orders')
        .select('final_amount')
        .gte('created_at', startOfDay(today).toISOString())
        .lte('created_at', endOfDay(today).toISOString())
        .eq('payment_status', 'completed');

      // Yesterday's data for comparison
      const { data: yesterdayOrders } = await supabase
        .from('orders')
        .select('final_amount')
        .gte('created_at', startOfDay(yesterday).toISOString())
        .lte('created_at', endOfDay(yesterday).toISOString())
        .eq('payment_status', 'completed');

      const todayRevenue = todayOrders?.reduce((sum, o) => sum + Number(o.final_amount), 0) || 0;
      const yesterdayRevenue = yesterdayOrders?.reduce((sum, o) => sum + Number(o.final_amount), 0) || 0;

      return {
        revenue: todayRevenue,
        orders: todayOrders?.length || 0,
        previousRevenue: yesterdayRevenue,
        previousOrders: yesterdayOrders?.length || 0,
      };
    }
  });

  const { data: weekStats } = useQuery({
    queryKey: ['admin-stats-week'],
    queryFn: async () => {
      const today = new Date();
      const weekStart = startOfWeek(today, { weekStartsOn: 1 });
      const weekEnd = endOfWeek(today, { weekStartsOn: 1 });
      const prevWeekStart = subDays(weekStart, 7);
      const prevWeekEnd = subDays(weekEnd, 7);

      const { data: thisWeekOrders } = await supabase
        .from('orders')
        .select('final_amount')
        .gte('created_at', weekStart.toISOString())
        .lte('created_at', weekEnd.toISOString())
        .eq('payment_status', 'completed');

      const { data: prevWeekOrders } = await supabase
        .from('orders')
        .select('final_amount')
        .gte('created_at', prevWeekStart.toISOString())
        .lte('created_at', prevWeekEnd.toISOString())
        .eq('payment_status', 'completed');

      const thisWeekRevenue = thisWeekOrders?.reduce((sum, o) => sum + Number(o.final_amount), 0) || 0;
      const prevWeekRevenue = prevWeekOrders?.reduce((sum, o) => sum + Number(o.final_amount), 0) || 0;

      return {
        revenue: thisWeekRevenue,
        orders: thisWeekOrders?.length || 0,
        previousRevenue: prevWeekRevenue,
        previousOrders: prevWeekOrders?.length || 0,
      };
    }
  });

  const { data: monthStats } = useQuery({
    queryKey: ['admin-stats-month'],
    queryFn: async () => {
      const today = new Date();
      const monthStart = startOfMonth(today);
      const monthEnd = endOfMonth(today);
      const prevMonthStart = startOfMonth(subDays(monthStart, 1));
      const prevMonthEnd = endOfMonth(subDays(monthStart, 1));

      const { data: thisMonthOrders } = await supabase
        .from('orders')
        .select('final_amount')
        .gte('created_at', monthStart.toISOString())
        .lte('created_at', monthEnd.toISOString())
        .eq('payment_status', 'completed');

      const { data: prevMonthOrders } = await supabase
        .from('orders')
        .select('final_amount')
        .gte('created_at', prevMonthStart.toISOString())
        .lte('created_at', prevMonthEnd.toISOString())
        .eq('payment_status', 'completed');

      // New users this month
      const { count: newUsers } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', monthStart.toISOString());

      const { count: prevMonthUsers } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', prevMonthStart.toISOString())
        .lte('created_at', prevMonthEnd.toISOString());

      const thisMonthRevenue = thisMonthOrders?.reduce((sum, o) => sum + Number(o.final_amount), 0) || 0;
      const prevMonthRevenue = prevMonthOrders?.reduce((sum, o) => sum + Number(o.final_amount), 0) || 0;

      return {
        revenue: thisMonthRevenue,
        orders: thisMonthOrders?.length || 0,
        users: newUsers || 0,
        previousRevenue: prevMonthRevenue,
        previousOrders: prevMonthOrders?.length || 0,
        previousUsers: prevMonthUsers || 0,
      };
    }
  });

  const { data: totalStats } = useQuery({
    queryKey: ['admin-stats-total'],
    queryFn: async () => {
      const { count: totalUsers } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      const { count: totalProducts } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true });

      const { data: allOrders } = await supabase
        .from('orders')
        .select('final_amount')
        .eq('payment_status', 'completed');

      const totalRevenue = allOrders?.reduce((sum, o) => sum + Number(o.final_amount), 0) || 0;

      return {
        users: totalUsers || 0,
        products: totalProducts || 0,
        orders: allOrders?.length || 0,
        revenue: totalRevenue,
      };
    }
  });

  const calculateChange = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  };

  const StatCard = ({ 
    title, 
    value, 
    previousValue, 
    icon: Icon, 
    prefix = '', 
    suffix = '' 
  }: { 
    title: string; 
    value: number; 
    previousValue?: number; 
    icon: any; 
    prefix?: string; 
    suffix?: string;
  }) => {
    const change = previousValue !== undefined ? calculateChange(value, previousValue) : null;
    const isPositive = change !== null && change >= 0;

    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">{title}</p>
              <p className="text-2xl font-bold mt-1">
                {prefix}{value.toLocaleString()}{suffix}
              </p>
              {change !== null && (
                <div className={`flex items-center gap-1 mt-2 text-sm ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
                  {isPositive ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
                  <span>{Math.abs(change).toFixed(1)}%</span>
                </div>
              )}
            </div>
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Icon className="h-6 w-6 text-primary" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="today" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="today">Сьогодні</TabsTrigger>
          <TabsTrigger value="week">Тиждень</TabsTrigger>
          <TabsTrigger value="month">Місяць</TabsTrigger>
          <TabsTrigger value="total">Всього</TabsTrigger>
        </TabsList>

        <TabsContent value="today" className="mt-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <StatCard
              title="Дохід сьогодні"
              value={todayStats?.revenue || 0}
              previousValue={todayStats?.previousRevenue}
              icon={DollarSign}
              suffix="₴"
            />
            <StatCard
              title="Замовлень сьогодні"
              value={todayStats?.orders || 0}
              previousValue={todayStats?.previousOrders}
              icon={ShoppingCart}
            />
            <StatCard
              title="Всього користувачів"
              value={totalStats?.users || 0}
              icon={Users}
            />
            <StatCard
              title="Всього товарів"
              value={totalStats?.products || 0}
              icon={Package}
            />
          </div>
        </TabsContent>

        <TabsContent value="week" className="mt-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <StatCard
              title="Дохід за тиждень"
              value={weekStats?.revenue || 0}
              previousValue={weekStats?.previousRevenue}
              icon={DollarSign}
              suffix="₴"
            />
            <StatCard
              title="Замовлень за тиждень"
              value={weekStats?.orders || 0}
              previousValue={weekStats?.previousOrders}
              icon={ShoppingCart}
            />
            <StatCard
              title="Всього користувачів"
              value={totalStats?.users || 0}
              icon={Users}
            />
            <StatCard
              title="Всього товарів"
              value={totalStats?.products || 0}
              icon={Package}
            />
          </div>
        </TabsContent>

        <TabsContent value="month" className="mt-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <StatCard
              title="Дохід за місяць"
              value={monthStats?.revenue || 0}
              previousValue={monthStats?.previousRevenue}
              icon={DollarSign}
              suffix="₴"
            />
            <StatCard
              title="Замовлень за місяць"
              value={monthStats?.orders || 0}
              previousValue={monthStats?.previousOrders}
              icon={ShoppingCart}
            />
            <StatCard
              title="Нових користувачів"
              value={monthStats?.users || 0}
              previousValue={monthStats?.previousUsers}
              icon={Users}
            />
            <StatCard
              title="Всього товарів"
              value={totalStats?.products || 0}
              icon={Package}
            />
          </div>
        </TabsContent>

        <TabsContent value="total" className="mt-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <StatCard
              title="Загальний дохід"
              value={totalStats?.revenue || 0}
              icon={DollarSign}
              suffix="₴"
            />
            <StatCard
              title="Всього замовлень"
              value={totalStats?.orders || 0}
              icon={ShoppingCart}
            />
            <StatCard
              title="Всього користувачів"
              value={totalStats?.users || 0}
              icon={Users}
            />
            <StatCard
              title="Всього товарів"
              value={totalStats?.products || 0}
              icon={Package}
            />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default DashboardStatsEnhanced;
