import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';
import { Package, Eye, RefreshCcw, ChevronLeft, ChevronRight, CheckCircle2, Clock, XCircle, Loader2 } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import OrderExport from '@/components/OrderExport';
import { format } from 'date-fns';
import { uk } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';

interface OrderItem {
  id: string;
  product_id: string;
  product_name: string;
  product_price: number;
  quantity: number;
}

interface Order {
  id: string;
  user_id: string;
  total_amount: number;
  discount_amount: number;
  final_amount: number;
  payment_method: string;
  payment_status: string;
  steam_id?: string;
  created_at: string;
  order_items: OrderItem[];
}

const ITEMS_PER_PAGE = 5;

const Orders = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [isReordering, setIsReordering] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user) {
      fetchOrders();
    }
  }, [user]);

  const fetchOrders = async () => {
    if (!user) return;
    setIsLoading(true);

    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        order_items (*)
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (data && !error) {
      setOrders(data as Order[]);
    }
    setIsLoading(false);
  };

  const filteredOrders = useMemo(() => {
    if (statusFilter === 'all') return orders;
    return orders.filter(o => o.payment_status === statusFilter);
  }, [orders, statusFilter]);

  const totalPages = Math.ceil(filteredOrders.length / ITEMS_PER_PAGE);
  const paginatedOrders = filteredOrders.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handleReorder = async (order: Order) => {
    if (!user) return;
    setIsReordering(true);

    try {
      // Add items to cart
      for (const item of order.order_items) {
        // Check if item already in cart
        const { data: existing } = await supabase
          .from('cart_items')
          .select('id, quantity')
          .eq('user_id', user.id)
          .eq('product_id', item.product_id)
          .maybeSingle();

        if (existing) {
          await supabase
            .from('cart_items')
            .update({ quantity: existing.quantity + item.quantity })
            .eq('id', existing.id);
        } else {
          await supabase
            .from('cart_items')
            .insert({
              user_id: user.id,
              product_id: item.product_id,
              product_name: item.product_name,
              product_price: item.product_price,
              quantity: item.quantity
            });
        }
      }

      toast({ title: 'Товари додано до кошика' });
      navigate('/');
    } catch (error) {
      toast({ title: 'Помилка додавання до кошика', variant: 'destructive' });
    } finally {
      setIsReordering(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      pending: 'secondary',
      completed: 'default',
      failed: 'destructive',
      refunded: 'outline',
    };
    
    const labels: Record<string, string> = {
      pending: 'В обробці',
      completed: 'Завершено',
      failed: 'Помилка',
      refunded: 'Повернуто',
    };

    return <Badge variant={variants[status] || 'secondary'}>{labels[status] || status}</Badge>;
  };

  const getStatusProgress = (status: string) => {
    switch (status) {
      case 'pending': return 33;
      case 'completed': return 100;
      case 'failed': return 100;
      case 'refunded': return 100;
      default: return 0;
    }
  };

  const getPaymentMethodLabel = (method: string) => {
    switch (method) {
      case 'wayforpay': return 'WayForPay';
      case 'nowpayments': return 'Криптовалюта';
      case 'balance': return 'Баланс';
      default: return method;
    }
  };

  if (loading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8 max-w-4xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <h1 className="text-4xl font-military flex items-center gap-2">
            <Package className="h-8 w-8" />
            Мої замовлення
          </h1>
          <div className="flex gap-2">
            <OrderExport orders={orders} />
            <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setCurrentPage(1); }}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Фільтр" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Всі замовлення</SelectItem>
                <SelectItem value="pending">В обробці</SelectItem>
                <SelectItem value="completed">Завершені</SelectItem>
                <SelectItem value="failed">Помилка</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {filteredOrders.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Package className="h-16 w-16 mx-auto mb-4 opacity-20" />
              <p className="text-muted-foreground">
                {statusFilter === 'all' ? 'У вас поки немає замовлень' : 'Замовлень з таким статусом не знайдено'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="space-y-4">
              {paginatedOrders.map((order, index) => (
                <Card 
                  key={order.id}
                  className="animate-fade-in overflow-hidden"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">
                          Замовлення #{order.id.slice(0, 8)}
                        </CardTitle>
                        <CardDescription>
                          {format(new Date(order.created_at), 'dd MMMM yyyy, HH:mm', { locale: uk })}
                        </CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusBadge(order.payment_status)}
                      </div>
                    </div>
                  </CardHeader>
                  
                  {/* Status Progress */}
                  <div className="px-6 pb-4">
                    <div className="flex items-center gap-4 mb-2">
                      <div className={`flex items-center gap-1 text-xs ${order.payment_status !== 'pending' ? 'text-primary' : 'text-muted-foreground'}`}>
                        <Clock className="h-3 w-3" />
                        Створено
                      </div>
                      <div className="flex-1 h-1 bg-muted rounded-full overflow-hidden">
                        <div 
                          className={`h-full transition-all ${
                            order.payment_status === 'failed' ? 'bg-destructive' : 'bg-primary'
                          }`}
                          style={{ width: `${getStatusProgress(order.payment_status)}%` }}
                        />
                      </div>
                      <div className={`flex items-center gap-1 text-xs ${
                        order.payment_status === 'completed' ? 'text-primary' : 
                        order.payment_status === 'failed' ? 'text-destructive' : 'text-muted-foreground'
                      }`}>
                        {order.payment_status === 'failed' ? (
                          <><XCircle className="h-3 w-3" /> Помилка</>
                        ) : (
                          <><CheckCircle2 className="h-3 w-3" /> Завершено</>
                        )}
                      </div>
                    </div>
                  </div>

                  <CardContent className="pt-0">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">
                          {order.order_items?.length || 0} товар(ів) · {getPaymentMethodLabel(order.payment_method)}
                        </p>
                        <p className="text-xl font-bold">{order.final_amount.toFixed(2)} ₴</p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => { setSelectedOrder(order); setShowDetails(true); }}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          Деталі
                        </Button>
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => handleReorder(order)}
                          disabled={isReordering}
                        >
                          {isReordering ? (
                            <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                          ) : (
                            <RefreshCcw className="h-4 w-4 mr-1" />
                          )}
                          Повторити
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-4 mt-6">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm">
                  {currentPage} / {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </>
        )}
      </main>
      <Footer />

      {/* Order Details Modal */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Деталі замовлення</DialogTitle>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">ID замовлення</p>
                  <p className="font-mono">{selectedOrder.id.slice(0, 8)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Дата</p>
                  <p>{format(new Date(selectedOrder.created_at), 'dd.MM.yyyy HH:mm')}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Спосіб оплати</p>
                  <p>{getPaymentMethodLabel(selectedOrder.payment_method)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Статус</p>
                  {getStatusBadge(selectedOrder.payment_status)}
                </div>
                {selectedOrder.steam_id && (
                  <div className="col-span-2">
                    <p className="text-muted-foreground">Steam ID</p>
                    <p className="font-mono">{selectedOrder.steam_id}</p>
                  </div>
                )}
              </div>

              <Separator />

              <div>
                <p className="font-medium mb-2">Товари</p>
                <div className="space-y-2">
                  {selectedOrder.order_items?.map((item) => (
                    <div key={item.id} className="flex justify-between text-sm py-2 border-b last:border-0">
                      <div>
                        <p className="font-medium">{item.product_name}</p>
                        <p className="text-xs text-muted-foreground">x{item.quantity}</p>
                      </div>
                      <span className="font-semibold">{(item.product_price * item.quantity).toFixed(2)} ₴</span>
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Сума:</span>
                  <span>{selectedOrder.total_amount.toFixed(2)} ₴</span>
                </div>
                {selectedOrder.discount_amount > 0 && (
                  <div className="flex justify-between text-sm text-green-500">
                    <span>Знижка:</span>
                    <span>-{selectedOrder.discount_amount.toFixed(2)} ₴</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-lg">
                  <span>До сплати:</span>
                  <span className="text-primary">{selectedOrder.final_amount.toFixed(2)} ₴</span>
                </div>
              </div>

              <Button 
                className="w-full" 
                onClick={() => { setShowDetails(false); handleReorder(selectedOrder); }}
                disabled={isReordering}
              >
                {isReordering ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <RefreshCcw className="h-4 w-4 mr-2" />
                )}
                Повторити замовлення
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Orders;
