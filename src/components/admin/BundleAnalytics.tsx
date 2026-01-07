import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  Gift, TrendingUp, ShoppingCart, DollarSign, 
  Eye, BarChart3, Package 
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  LineChart,
  Line,
} from 'recharts';
import { format, subDays } from 'date-fns';
import { uk } from 'date-fns/locale';

const COLORS = ['#22c55e', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

const BundleAnalytics = () => {
  // Fetch bundles
  const { data: bundles = [], isLoading: bundlesLoading } = useQuery({
    queryKey: ['analytics-bundles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('product_bundles')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    }
  });

  // Fetch bundle items
  const { data: bundleItems = [] } = useQuery({
    queryKey: ['analytics-bundle-items'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('bundle_items')
        .select('*');
      if (error) throw error;
      return data;
    }
  });

  // Fetch order items to see bundle product purchases
  const { data: orderItems = [] } = useQuery({
    queryKey: ['analytics-order-items-bundles'],
    queryFn: async () => {
      const thirtyDaysAgo = subDays(new Date(), 30).toISOString();
      const { data, error } = await supabase
        .from('order_items')
        .select('product_id, product_name, product_price, quantity, created_at')
        .gte('created_at', thirtyDaysAgo);
      if (error) throw error;
      return data;
    }
  });

  // Fetch products to match with bundle items
  const { data: products = [] } = useQuery({
    queryKey: ['analytics-products'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('id, name, price');
      if (error) throw error;
      return data;
    }
  });

  // Calculate bundle analytics
  const bundleStats = bundles.map(bundle => {
    const items = bundleItems.filter(i => i.bundle_id === bundle.id);
    const productIds = items.map(i => i.product_id);
    
    // Calculate total value of items
    const totalValue = items.reduce((sum, item) => {
      const product = products.find(p => p.id === item.product_id);
      return sum + (product?.price || 0) * item.quantity;
    }, 0);

    // Find orders containing bundle products (simplified - counts any bundle product purchase)
    const bundleOrderItems = orderItems.filter(oi => productIds.includes(oi.product_id));
    const estimatedPurchases = Math.floor(bundleOrderItems.length / Math.max(productIds.length, 1));
    const revenue = estimatedPurchases * bundle.bundle_price;

    return {
      id: bundle.id,
      name: bundle.name,
      price: bundle.bundle_price,
      itemCount: items.length,
      totalValue,
      savings: totalValue - bundle.bundle_price,
      savingsPercent: totalValue > 0 ? ((totalValue - bundle.bundle_price) / totalValue * 100).toFixed(0) : 0,
      estimatedPurchases,
      revenue,
      isActive: bundle.is_active,
    };
  });

  // Summary stats
  const totalBundles = bundles.length;
  const activeBundles = bundles.filter(b => b.is_active).length;
  const totalRevenue = bundleStats.reduce((sum, b) => sum + b.revenue, 0);
  const totalPurchases = bundleStats.reduce((sum, b) => sum + b.estimatedPurchases, 0);

  // Chart data
  const popularityData = bundleStats
    .sort((a, b) => b.estimatedPurchases - a.estimatedPurchases)
    .slice(0, 6)
    .map(b => ({
      name: b.name.length > 15 ? b.name.slice(0, 15) + '...' : b.name,
      purchases: b.estimatedPurchases,
      revenue: b.revenue,
    }));

  const revenueData = bundleStats.map(b => ({
    name: b.name.length > 12 ? b.name.slice(0, 12) + '...' : b.name,
    value: b.revenue,
  }));

  const savingsData = bundleStats.map(b => ({
    name: b.name.length > 12 ? b.name.slice(0, 12) + '...' : b.name,
    savings: Number(b.savingsPercent),
    price: b.price,
  }));

  if (bundlesLoading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
        <Skeleton className="h-[400px]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Всього наборів</p>
                <p className="text-2xl font-bold">{totalBundles}</p>
                <p className="text-xs text-muted-foreground">{activeBundles} активних</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Gift className="h-6 w-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Орієнтовний дохід</p>
                <p className="text-2xl font-bold">{totalRevenue.toLocaleString()} ₴</p>
                <p className="text-xs text-muted-foreground">за 30 днів</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-green-500/10 flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-green-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Орієнтовні покупки</p>
                <p className="text-2xl font-bold">{totalPurchases}</p>
                <p className="text-xs text-muted-foreground">за 30 днів</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-blue-500/10 flex items-center justify-center">
                <ShoppingCart className="h-6 w-6 text-blue-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Сер. економія</p>
                <p className="text-2xl font-bold">
                  {bundleStats.length > 0 
                    ? Math.round(bundleStats.reduce((s, b) => s + Number(b.savingsPercent), 0) / bundleStats.length) 
                    : 0}%
                </p>
                <p className="text-xs text-muted-foreground">для клієнтів</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-amber-500/10 flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-amber-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Popularity Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Популярність наборів
            </CardTitle>
            <CardDescription>Орієнтовна кількість покупок за 30 днів</CardDescription>
          </CardHeader>
          <CardContent>
            {popularityData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={popularityData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 12 }} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))' 
                    }}
                    formatter={(value: number) => [value, 'Покупок']}
                  />
                  <Bar dataKey="purchases" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                Немає даних про покупки
              </div>
            )}
          </CardContent>
        </Card>

        {/* Revenue Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Розподіл доходу
            </CardTitle>
            <CardDescription>Дохід від кожного набору</CardDescription>
          </CardHeader>
          <CardContent>
            {revenueData.some(d => d.value > 0) ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={revenueData.filter(d => d.value > 0)}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="value"
                    label={({ name, value }) => `${value.toLocaleString()}₴`}
                  >
                    {revenueData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Legend />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))' 
                    }}
                    formatter={(value: number) => [`${value.toLocaleString()} ₴`, 'Дохід']}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                Немає даних про дохід
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Savings Comparison */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Економія для клієнтів
          </CardTitle>
          <CardDescription>Порівняння цін наборів та економії</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={savingsData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis yAxisId="left" orientation="left" />
              <YAxis yAxisId="right" orientation="right" unit="%" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--card))', 
                  border: '1px solid hsl(var(--border))' 
                }}
              />
              <Legend />
              <Bar yAxisId="left" dataKey="price" fill="#3b82f6" name="Ціна набору (₴)" radius={[4, 4, 0, 0]} />
              <Bar yAxisId="right" dataKey="savings" fill="#22c55e" name="Економія (%)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Detailed Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Детальна статистика
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Набір</TableHead>
                <TableHead className="text-center">Товарів</TableHead>
                <TableHead className="text-right">Ціна</TableHead>
                <TableHead className="text-right">Вартість товарів</TableHead>
                <TableHead className="text-right">Економія</TableHead>
                <TableHead className="text-center">Покупки (30д)</TableHead>
                <TableHead className="text-right">Дохід</TableHead>
                <TableHead className="text-center">Статус</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {bundleStats.map((bundle) => (
                <TableRow key={bundle.id}>
                  <TableCell className="font-medium">{bundle.name}</TableCell>
                  <TableCell className="text-center">{bundle.itemCount}</TableCell>
                  <TableCell className="text-right">{bundle.price.toLocaleString()} ₴</TableCell>
                  <TableCell className="text-right text-muted-foreground">
                    {bundle.totalValue.toLocaleString()} ₴
                  </TableCell>
                  <TableCell className="text-right">
                    <Badge variant="secondary" className="text-green-600">
                      -{bundle.savingsPercent}%
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">{bundle.estimatedPurchases}</TableCell>
                  <TableCell className="text-right font-medium">
                    {bundle.revenue.toLocaleString()} ₴
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant={bundle.isActive ? 'default' : 'secondary'}>
                      {bundle.isActive ? 'Активний' : 'Неактивний'}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
              {bundleStats.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                    Наборів поки немає
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default BundleAnalytics;
