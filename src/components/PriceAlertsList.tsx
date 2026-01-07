import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/AuthProvider';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Bell, TrendingDown, Package, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { uk } from 'date-fns/locale';

const PriceAlertsList = () => {
  const { user } = useAuth();

  const { data: alerts = [], isLoading } = useQuery({
    queryKey: ['user-price-alerts', user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from('price_alerts')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Fetch products for the alerts
  const { data: products = [] } = useQuery({
    queryKey: ['products-for-alerts', alerts.map(a => a.product_id)],
    queryFn: async () => {
      if (alerts.length === 0) return [];

      const { data, error } = await supabase
        .from('products')
        .select('id, name, price, image')
        .in('id', alerts.map(a => a.product_id));

      if (error) throw error;
      return data;
    },
    enabled: alerts.length > 0,
  });

  const productsMap = new Map(products.map(p => [p.id, p]));

  if (!user) {
    return null;
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-24" />
        </CardContent>
      </Card>
    );
  }

  if (alerts.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5 text-primary" />
          Сповіщення про ціни
        </CardTitle>
        <CardDescription>
          Ви отримаєте сповіщення коли ціна знизиться
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {alerts.map(alert => {
          const product = productsMap.get(alert.product_id);
          const isPriceReached = product && product.price <= alert.target_price;
          
          return (
            <div 
              key={alert.id}
              className={`flex items-center gap-3 p-3 rounded-lg border ${
                isPriceReached ? 'bg-green-500/10 border-green-500/30' : 'bg-muted/30'
              }`}
            >
              {product?.image ? (
                <img 
                  src={product.image} 
                  alt={product?.name || 'Product'} 
                  className="w-12 h-12 rounded object-cover"
                />
              ) : (
                <div className="w-12 h-12 rounded bg-muted flex items-center justify-center">
                  <Package className="h-6 w-6 text-muted-foreground" />
                </div>
              )}
              
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">
                  {product?.name || 'Невідомий товар'}
                </p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <TrendingDown className="h-3 w-3" />
                  <span>Очікувана ціна: {alert.target_price}₴</span>
                  {product && (
                    <Badge variant={isPriceReached ? 'default' : 'secondary'} className="text-xs">
                      Зараз: {product.price}₴
                    </Badge>
                  )}
                </div>
              </div>

              {isPriceReached ? (
                <Badge className="bg-green-500">Ціна знижена!</Badge>
              ) : (
                <Link to={`/product/${alert.product_id}`}>
                  <Button variant="ghost" size="icon">
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
};

export default PriceAlertsList;
