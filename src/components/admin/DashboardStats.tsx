import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, DollarSign, ShoppingCart, Users, TrendingUp, Package } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';
import { uk } from 'date-fns/locale';

interface DashboardData {
  totalRevenue: number;
  ordersToday: number;
  ordersWeek: number;
  ordersMonth: number;
  newUsersToday: number;
  topProducts: Array<{ name: string; count: number; revenue: number }>;
  recentOrders: Array<{ id: string; total: number; status: string; created_at: string; username: string }>;
  salesByDay: Array<{ date: string; revenue: number; orders: number }>;
}

const DashboardStats = () => {
  const { data, isLoading } = useQuery({
    queryKey: ['admin-dashboard'],
    queryFn: async (): Promise<DashboardData> => {
      const now = new Date();
      const todayStart = startOfDay(now).toISOString();
      const todayEnd = endOfDay(now).toISOString();
      const weekStart = startOfDay(subDays(now, 7)).toISOString();
      const monthStart = startOfDay(subDays(now, 30)).toISOString();

      // Fetch all orders
      const { data: allOrders } = await supabase
        .from('orders')
        .select('*')
        .eq('payment_status', 'completed');

      // Fetch orders today
      const { data: ordersToday } = await supabase
        .from('orders')
        .select('*')
        .gte('created_at', todayStart)
        .lte('created_at', todayEnd);

      // Fetch orders this week
      const { data: ordersWeek } = await supabase
        .from('orders')
        .select('*')
        .gte('created_at', weekStart);

      // Fetch orders this month
      const { data: ordersMonth } = await supabase
        .from('orders')
        .select('*')
        .gte('created_at', monthStart);

      // Fetch new users today
      const { data: newUsers } = await supabase
        .from('profiles')
        .select('id')
        .gte('created_at', todayStart)
        .lte('created_at', todayEnd);

      // Fetch order items for top products
      const { data: orderItems } = await supabase
        .from('order_items')
        .select('product_id, product_name, product_price, quantity');

      // Fetch recent orders with profiles
      const { data: recentOrders } = await supabase
        .from('orders')
        .select('id, final_amount, payment_status, created_at, user_id')
        .order('created_at', { ascending: false })
        .limit(5);

      // Fetch profiles for recent orders
      const userIds = recentOrders?.map(o => o.user_id) || [];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, username')
        .in('id', userIds);

      const profileMap = new Map(profiles?.map(p => [p.id, p.username]) || []);

      // Calculate total revenue
      const totalRevenue = allOrders?.reduce((sum, o) => sum + Number(o.final_amount), 0) || 0;

      // Calculate top products
      const productStats = new Map<string, { name: string; count: number; revenue: number }>();
      orderItems?.forEach(item => {
        const existing = productStats.get(item.product_id) || { name: item.product_name, count: 0, revenue: 0 };
        existing.count += item.quantity;
        existing.revenue += Number(item.product_price) * item.quantity;
        productStats.set(item.product_id, existing);
      });

      const topProducts = Array.from(productStats.values())
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5);

      // Calculate sales by day (last 7 days)
      const salesByDay: Array<{ date: string; revenue: number; orders: number }> = [];
      for (let i = 6; i >= 0; i--) {
        const date = subDays(now, i);
        const dateStr = format(date, 'yyyy-MM-dd');
        const dayOrders = allOrders?.filter(o => 
          format(new Date(o.created_at), 'yyyy-MM-dd') === dateStr
        ) || [];
        salesByDay.push({
          date: format(date, 'dd.MM', { locale: uk }),
          revenue: dayOrders.reduce((sum, o) => sum + Number(o.final_amount), 0),
          orders: dayOrders.length
        });
      }

      return {
        totalRevenue,
        ordersToday: ordersToday?.length || 0,
        ordersWeek: ordersWeek?.length || 0,
        ordersMonth: ordersMonth?.length || 0,
        newUsersToday: newUsers?.length || 0,
        topProducts,
        recentOrders: recentOrders?.map(o => ({
          id: o.id,
          total: Number(o.final_amount),
          status: o.payment_status || 'pending',
          created_at: o.created_at,
          username: profileMap.get(o.user_id) || 'Невідомий'
        })) || [],
        salesByDay
      };
    }
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Загальний дохід</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data?.totalRevenue.toFixed(2)} ₴</div>
            <p className="text-xs text-muted-foreground">За весь час</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Замовлень сьогодні</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data?.ordersToday}</div>
            <p className="text-xs text-muted-foreground">
              Тиждень: {data?.ordersWeek} | Місяць: {data?.ordersMonth}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Нових користувачів</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data?.newUsersToday}</div>
            <p className="text-xs text-muted-foreground">Сьогодні</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Середній чек</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data?.ordersMonth && data.ordersMonth > 0 
                ? (data.totalRevenue / data.ordersMonth).toFixed(2) 
                : '0'} ₴
            </div>
            <p className="text-xs text-muted-foreground">За місяць</p>
          </CardContent>
        </Card>
      </div>

      {/* Sales Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Продажі за тиждень</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data?.salesByDay}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="date" className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                  formatter={(value: number, name: string) => [
                    name === 'revenue' ? `${value.toFixed(2)} ₴` : value,
                    name === 'revenue' ? 'Дохід' : 'Замовлень'
                  ]}
                />
                <Line 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={2}
                  dot={{ fill: 'hsl(var(--primary))' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Products */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Топ-5 товарів
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data?.topProducts.map((product, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-lg font-bold text-muted-foreground">#{index + 1}</span>
                    <div>
                      <p className="font-medium truncate max-w-[200px]">{product.name}</p>
                      <p className="text-sm text-muted-foreground">{product.count} продано</p>
                    </div>
                  </div>
                  <span className="font-bold">{product.revenue.toFixed(2)} ₴</span>
                </div>
              ))}
              {(!data?.topProducts || data.topProducts.length === 0) && (
                <p className="text-muted-foreground text-center py-4">Немає даних</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recent Orders */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" />
              Останні замовлення
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data?.recentOrders.map((order) => (
                <div key={order.id} className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{order.username}</p>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(order.created_at), 'dd.MM.yyyy HH:mm', { locale: uk })}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">{order.total.toFixed(2)} ₴</p>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      order.status === 'completed' 
                        ? 'bg-green-500/20 text-green-500' 
                        : order.status === 'failed'
                        ? 'bg-red-500/20 text-red-500'
                        : 'bg-yellow-500/20 text-yellow-500'
                    }`}>
                      {order.status === 'completed' ? 'Оплачено' : order.status === 'failed' ? 'Помилка' : 'Очікує'}
                    </span>
                  </div>
                </div>
              ))}
              {(!data?.recentOrders || data.recentOrders.length === 0) && (
                <p className="text-muted-foreground text-center py-4">Немає замовлень</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DashboardStats;
