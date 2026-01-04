import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { BarChart3, Eye, ShoppingCart, TrendingUp, MousePointer } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useProducts } from '@/hooks/useProducts';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

const ProductAnalytics = () => {
  const { products } = useProducts();

  // Fetch product views
  const { data: viewsData = [], isLoading: viewsLoading } = useQuery({
    queryKey: ['product-views-analytics'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('product_views')
        .select('product_id, viewed_at')
        .gte('viewed_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());
      if (error) throw error;
      return data;
    }
  });

  // Fetch product clicks
  const { data: clicksData = [], isLoading: clicksLoading } = useQuery({
    queryKey: ['product-clicks-analytics'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('product_clicks')
        .select('product_id, action, created_at')
        .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());
      if (error) throw error;
      return data;
    }
  });

  // Fetch order items for purchase data
  const { data: orderItemsData = [], isLoading: ordersLoading } = useQuery({
    queryKey: ['order-items-analytics'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('order_items')
        .select('product_id, quantity, product_price, created_at')
        .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());
      if (error) throw error;
      return data;
    }
  });

  const isLoading = viewsLoading || clicksLoading || ordersLoading;

  // Calculate product stats
  const productStats = products.map(product => {
    const views = viewsData.filter(v => v.product_id === product.id).length;
    const addToCartClicks = clicksData.filter(c => c.product_id === product.id && c.action === 'add_to_cart').length;
    const purchases = orderItemsData.filter(o => o.product_id === product.id).reduce((sum, o) => sum + o.quantity, 0);
    const revenue = orderItemsData
      .filter(o => o.product_id === product.id)
      .reduce((sum, o) => sum + (o.product_price * o.quantity), 0);
    const conversionRate = views > 0 ? ((purchases / views) * 100).toFixed(1) : '0';

    return {
      id: product.id,
      name: product.name,
      image: product.image,
      category: product.category,
      views,
      addToCartClicks,
      purchases,
      revenue,
      conversionRate: parseFloat(conversionRate)
    };
  }).sort((a, b) => b.views - a.views);

  // Top 10 for chart
  const chartData = productStats.slice(0, 10).map(p => ({
    name: p.name.length > 15 ? p.name.substring(0, 15) + '...' : p.name,
    views: p.views,
    purchases: p.purchases
  }));

  // Summary stats
  const totalViews = productStats.reduce((sum, p) => sum + p.views, 0);
  const totalPurchases = productStats.reduce((sum, p) => sum + p.purchases, 0);
  const totalRevenue = productStats.reduce((sum, p) => sum + p.revenue, 0);
  const avgConversion = totalViews > 0 ? ((totalPurchases / totalViews) * 100).toFixed(1) : '0';

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-8 w-48" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Перегляди (30 днів)</p>
                <p className="text-2xl font-bold">{totalViews}</p>
              </div>
              <Eye className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Покупок</p>
                <p className="text-2xl font-bold">{totalPurchases}</p>
              </div>
              <ShoppingCart className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Дохід</p>
                <p className="text-2xl font-bold">{totalRevenue.toFixed(0)} ₴</p>
              </div>
              <TrendingUp className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Конверсія</p>
                <p className="text-2xl font-bold">{avgConversion}%</p>
              </div>
              <MousePointer className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Топ-10 товарів за переглядами
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis 
                  dataKey="name" 
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={11}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                />
                <Bar dataKey="views" fill="hsl(var(--primary))" name="Перегляди" radius={[4, 4, 0, 0]} />
                <Bar dataKey="purchases" fill="hsl(var(--chart-2))" name="Покупки" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Table */}
      <Card>
        <CardHeader>
          <CardTitle>Детальна аналітика товарів</CardTitle>
          <CardDescription>Дані за останні 30 днів</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Товар</TableHead>
                <TableHead className="text-center">Перегляди</TableHead>
                <TableHead className="text-center">В кошик</TableHead>
                <TableHead className="text-center">Покупки</TableHead>
                <TableHead className="text-center">Дохід</TableHead>
                <TableHead className="text-center">Конверсія</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {productStats.slice(0, 20).map((product) => (
                <TableRow key={product.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <img 
                        src={product.image} 
                        alt={product.name} 
                        className="h-8 w-8 rounded object-cover"
                      />
                      <div>
                        <span className="font-medium line-clamp-1">{product.name}</span>
                        <span className="text-xs text-muted-foreground">{product.category}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">{product.views}</TableCell>
                  <TableCell className="text-center">{product.addToCartClicks}</TableCell>
                  <TableCell className="text-center">{product.purchases}</TableCell>
                  <TableCell className="text-center font-medium">{product.revenue.toFixed(0)} ₴</TableCell>
                  <TableCell className="text-center">
                    <Badge 
                      variant={product.conversionRate >= 5 ? 'default' : product.conversionRate >= 2 ? 'secondary' : 'outline'}
                    >
                      {product.conversionRate}%
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProductAnalytics;
