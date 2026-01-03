import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, PieChart as PieChartIcon, ShoppingCart, Tag, Users, TrendingUp, Activity } from 'lucide-react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Legend } from 'recharts';
import { format, subDays, startOfDay } from 'date-fns';
import { uk } from 'date-fns/locale';

const COLORS = ['hsl(var(--primary))', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FFC658'];

const AnalyticsDashboard = () => {
  const { data: analytics, isLoading } = useQuery({
    queryKey: ['admin-analytics'],
    queryFn: async () => {
      const now = new Date();
      const thirtyDaysAgo = startOfDay(subDays(now, 30)).toISOString();

      // Fetch all data in parallel
      const [
        ordersRes,
        orderItemsRes,
        cartItemsRes,
        promoUsesRes,
        profilesRes,
        productsRes
      ] = await Promise.all([
        supabase.from('orders').select('*').gte('created_at', thirtyDaysAgo),
        supabase.from('order_items').select('product_id, product_name, product_price, quantity'),
        supabase.from('cart_items').select('id, user_id'),
        supabase.from('promo_code_uses').select('*, promo_codes(code, discount_percent)').gte('used_at', thirtyDaysAgo),
        supabase.from('profiles').select('id, created_at, total_spent').gte('created_at', thirtyDaysAgo),
        supabase.from('products').select('id, name, category')
      ]);

      const orders = ordersRes.data || [];
      const orderItems = orderItemsRes.data || [];
      const cartItems = cartItemsRes.data || [];
      const promoUses = promoUsesRes.data || [];
      const newUsers = profilesRes.data || [];
      const products = productsRes.data || [];

      // Category sales breakdown
      const categoryMap = new Map(products.map(p => [p.id, p.category]));
      const categorySales: Record<string, number> = {};
      orderItems.forEach(item => {
        const category = categoryMap.get(item.product_id) || 'Інше';
        categorySales[category] = (categorySales[category] || 0) + (Number(item.product_price) * item.quantity);
      });
      const categoryData = Object.entries(categorySales)
        .map(([name, value]) => ({ name: getCategoryLabel(name), value: Math.round(value) }))
        .sort((a, b) => b.value - a.value);

      // Cart conversion rate
      const uniqueCartUsers = new Set(cartItems.map(c => c.user_id)).size;
      const completedOrders = orders.filter(o => o.payment_status === 'completed').length;
      const conversionRate = uniqueCartUsers > 0 ? (completedOrders / uniqueCartUsers) * 100 : 0;

      // Promo code stats
      const promoStats: Record<string, { uses: number; savings: number }> = {};
      promoUses.forEach(use => {
        const code = (use.promo_codes as any)?.code || 'Unknown';
        if (!promoStats[code]) promoStats[code] = { uses: 0, savings: 0 };
        promoStats[code].uses++;
      });
      const promoData = Object.entries(promoStats)
        .map(([code, stats]) => ({ code, uses: stats.uses }))
        .sort((a, b) => b.uses - a.uses)
        .slice(0, 5);

      // User activity over time (last 14 days)
      const activityByDay: Array<{ date: string; orders: number; newUsers: number; revenue: number }> = [];
      for (let i = 13; i >= 0; i--) {
        const date = subDays(now, i);
        const dateStr = format(date, 'yyyy-MM-dd');
        const dayOrders = orders.filter(o => format(new Date(o.created_at), 'yyyy-MM-dd') === dateStr);
        const dayUsers = newUsers.filter(u => format(new Date(u.created_at), 'yyyy-MM-dd') === dateStr);
        
        activityByDay.push({
          date: format(date, 'dd.MM', { locale: uk }),
          orders: dayOrders.length,
          newUsers: dayUsers.length,
          revenue: dayOrders.reduce((sum, o) => sum + Number(o.final_amount), 0)
        });
      }

      // Top selling products
      const productSales: Record<string, { name: string; quantity: number; revenue: number }> = {};
      orderItems.forEach(item => {
        if (!productSales[item.product_id]) {
          productSales[item.product_id] = { name: item.product_name, quantity: 0, revenue: 0 };
        }
        productSales[item.product_id].quantity += item.quantity;
        productSales[item.product_id].revenue += Number(item.product_price) * item.quantity;
      });
      const topProducts = Object.values(productSales)
        .sort((a, b) => b.quantity - a.quantity)
        .slice(0, 5);

      // Summary stats
      const totalRevenue = orders.filter(o => o.payment_status === 'completed')
        .reduce((sum, o) => sum + Number(o.final_amount), 0);
      const avgOrderValue = completedOrders > 0 ? totalRevenue / completedOrders : 0;

      return {
        categoryData,
        conversionRate,
        promoData,
        activityByDay,
        topProducts,
        summary: {
          totalRevenue,
          completedOrders,
          avgOrderValue,
          newUsers: newUsers.length,
          promoUsed: promoUses.length
        }
      };
    },
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Дохід (30 днів)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics?.summary.totalRevenue.toFixed(2)} ₴</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <ShoppingCart className="h-4 w-4" />
              Замовлень
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics?.summary.completedOrders}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Середній чек
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics?.summary.avgOrderValue.toFixed(2)} ₴</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="h-4 w-4" />
              Нових користувачів
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics?.summary.newUsers}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <ShoppingCart className="h-4 w-4" />
              Конверсія кошика
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics?.conversionRate.toFixed(1)}%</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Activity Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Активність за 14 днів</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={analytics?.activityByDay}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="date" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Legend />
                  <Line type="monotone" dataKey="orders" name="Замовлення" stroke="hsl(var(--primary))" strokeWidth={2} />
                  <Line type="monotone" dataKey="newUsers" name="Нові користувачі" stroke="#00C49F" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Category Sales Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChartIcon className="h-5 w-5" />
              Продажі по категоріях
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={analytics?.categoryData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {analytics?.categoryData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number) => `${value} ₴`}
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Promo Code Usage */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Tag className="h-5 w-5" />
              Використання промокодів
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              {analytics?.promoData && analytics.promoData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analytics.promoData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis type="number" />
                    <YAxis dataKey="code" type="category" width={80} className="text-xs" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                    />
                    <Bar dataKey="uses" name="Використань" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-muted-foreground">
                  Промокоди не використовувались
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Top Products */}
        <Card>
          <CardHeader>
            <CardTitle>Топ-5 товарів</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analytics?.topProducts.map((product, index) => (
                <div key={index} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-3">
                    <span className="text-lg font-bold text-muted-foreground">#{index + 1}</span>
                    <div>
                      <p className="font-medium truncate max-w-[200px]">{product.name}</p>
                      <p className="text-sm text-muted-foreground">{product.quantity} продано</p>
                    </div>
                  </div>
                  <span className="font-bold">{product.revenue.toFixed(2)} ₴</span>
                </div>
              ))}
              {(!analytics?.topProducts || analytics.topProducts.length === 0) && (
                <p className="text-center text-muted-foreground py-4">Немає даних</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

function getCategoryLabel(category: string): string {
  const labels: Record<string, string> = {
    vip: 'VIP',
    vehicle: 'Транспорт',
    kit: 'Набори',
    build: 'Будматеріали',
    container: 'Контейнери',
    parts: 'Запчастини',
    cosmetic: 'Косметика',
    clothing: 'Одяг',
    cassette: 'Касети',
    workshop: 'Воркшоп',
    custom: 'Кастомні',
  };
  return labels[category] || category;
}

export default AnalyticsDashboard;
