import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { uk } from 'date-fns/locale';
import { Download, Package, RefreshCw, Volume2, VolumeX, Check } from 'lucide-react';

interface Order {
  id: string;
  user_id: string;
  total_amount: number;
  discount_amount: number | null;
  final_amount: number;
  payment_method: string;
  payment_status: string | null;
  created_at: string;
  steam_id: string | null;
}

interface OrderWithProfile extends Order {
  username: string | null;
}

const OrderManagementEnhanced = () => {
  const queryClient = useQueryClient();
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
  const [bulkStatus, setBulkStatus] = useState<string>('');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [lastOrderCount, setLastOrderCount] = useState<number | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const { data: orders, isLoading, refetch } = useQuery({
    queryKey: ['admin-orders-enhanced'],
    queryFn: async () => {
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (ordersError) throw ordersError;

      const userIds = [...new Set((ordersData || []).map(o => o.user_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, username')
        .in('id', userIds);

      const profileMap = new Map(profiles?.map(p => [p.id, p.username]) || []);

      return (ordersData || []).map(order => ({
        ...order,
        username: profileMap.get(order.user_id) || null
      })) as OrderWithProfile[];
    },
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  // Check for new orders and play sound
  useEffect(() => {
    if (orders && lastOrderCount !== null && orders.length > lastOrderCount && soundEnabled) {
      playNotificationSound();
      toast.success('🔔 Нове замовлення!', {
        description: `Отримано нове замовлення від ${orders[0].username || 'користувача'}`
      });
    }
    if (orders) {
      setLastOrderCount(orders.length);
    }
  }, [orders, lastOrderCount, soundEnabled]);

  const playNotificationSound = () => {
    if (audioRef.current) {
      audioRef.current.play().catch(() => {});
    }
  };

  const updateStatusMutation = useMutation({
    mutationFn: async ({ orderId, status, userId }: { orderId: string; status: string; userId?: string }) => {
      const { error } = await supabase
        .from('orders')
        .update({ payment_status: status })
        .eq('id', orderId);
      if (error) throw error;

      // Send Telegram notification to user
      if (userId && (status === 'completed' || status === 'failed')) {
        const action = status === 'completed' ? 'order_completed' : 'order_failed';
        await supabase.functions.invoke('telegram-notify', {
          body: { action, userId, orderId }
        });

        // Send push notification
        await supabase.functions.invoke('send-push-notification', {
          body: {
            user_id: userId,
            payload: {
              title: status === 'completed' ? '✅ Замовлення оплачено!' : '❌ Помилка оплати',
              body: status === 'completed' 
                ? 'Дякуємо за покупку! Товари будуть видані найближчим часом.'
                : 'Спробуйте оплатити знову або зверніться до підтримки.',
              url: '/orders'
            }
          }
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-orders-enhanced'] });
      toast.success('Статус оновлено');
    },
    onError: (error: any) => {
      toast.error('Помилка: ' + error.message);
    }
  });

  const bulkUpdateMutation = useMutation({
    mutationFn: async ({ orderIds, status }: { orderIds: string[]; status: string }) => {
      const { error } = await supabase
        .from('orders')
        .update({ payment_status: status })
        .in('id', orderIds);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-orders-enhanced'] });
      setSelectedOrders([]);
      setBulkStatus('');
      toast.success(`Оновлено ${selectedOrders.length} замовлень`);
    },
    onError: (error: any) => {
      toast.error('Помилка: ' + error.message);
    }
  });

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedOrders(orders?.map(o => o.id) || []);
    } else {
      setSelectedOrders([]);
    }
  };

  const handleSelectOrder = (orderId: string, checked: boolean) => {
    if (checked) {
      setSelectedOrders(prev => [...prev, orderId]);
    } else {
      setSelectedOrders(prev => prev.filter(id => id !== orderId));
    }
  };

  const handleBulkUpdate = () => {
    if (!bulkStatus || selectedOrders.length === 0) return;
    bulkUpdateMutation.mutate({ orderIds: selectedOrders, status: bulkStatus });
  };

  const exportToCSV = () => {
    if (!orders || orders.length === 0) {
      toast.error('Немає даних для експорту');
      return;
    }

    const headers = ['ID', 'Дата', 'Користувач', 'Сума', 'Знижка', 'До сплати', 'Спосіб оплати', 'Статус', 'Steam ID'];
    const rows = orders.map(order => [
      order.id,
      format(new Date(order.created_at), 'dd.MM.yyyy HH:mm'),
      order.username || 'Невідомий',
      order.total_amount,
      order.discount_amount || 0,
      order.final_amount,
      order.payment_method,
      order.payment_status || 'pending',
      order.steam_id || ''
    ]);

    const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `orders_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.click();
    toast.success('CSV файл завантажено');
  };

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-500">Виконано</Badge>;
      case 'pending':
        return <Badge variant="secondary">Очікує</Badge>;
      case 'failed':
        return <Badge variant="destructive">Помилка</Badge>;
      case 'processing':
        return <Badge className="bg-yellow-500">Обробка</Badge>;
      default:
        return <Badge variant="outline">{status || 'Невідомо'}</Badge>;
    }
  };

  const getPaymentMethodLabel = (method: string) => {
    switch (method) {
      case 'wayforpay': return 'WayForPay';
      case 'crypto': return 'Криптовалюта';
      case 'balance': return 'Баланс';
      default: return method;
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      {/* Hidden audio for notification */}
      <audio ref={audioRef} src="data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2teleD0HU" />
      
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="flex items-center gap-2">
          <Package className="h-5 w-5" />
          Управління замовленнями
        </CardTitle>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSoundEnabled(!soundEnabled)}
            title={soundEnabled ? 'Вимкнути звук' : 'Увімкнути звук'}
          >
            {soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
          </Button>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Оновити
          </Button>
          <Button variant="outline" size="sm" onClick={exportToCSV}>
            <Download className="h-4 w-4 mr-2" />
            Експорт CSV
          </Button>
        </div>
      </CardHeader>

      {/* Bulk Actions */}
      {selectedOrders.length > 0 && (
        <div className="px-6 pb-4 flex items-center gap-4 bg-muted/50 py-3 mx-6 rounded-lg">
          <span className="text-sm font-medium">
            Обрано: {selectedOrders.length}
          </span>
          <Select value={bulkStatus} onValueChange={setBulkStatus}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Статус" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pending">Очікує</SelectItem>
              <SelectItem value="processing">Обробка</SelectItem>
              <SelectItem value="completed">Виконано</SelectItem>
              <SelectItem value="failed">Помилка</SelectItem>
            </SelectContent>
          </Select>
          <Button
            size="sm"
            onClick={handleBulkUpdate}
            disabled={!bulkStatus}
          >
            <Check className="h-4 w-4 mr-2" />
            Застосувати
          </Button>
        </div>
      )}

      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10">
                <Checkbox
                  checked={orders?.length === selectedOrders.length && orders?.length > 0}
                  onCheckedChange={handleSelectAll}
                />
              </TableHead>
              <TableHead>Дата</TableHead>
              <TableHead>Користувач</TableHead>
              <TableHead>Сума</TableHead>
              <TableHead>Оплата</TableHead>
              <TableHead>Статус</TableHead>
              <TableHead>Дії</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders?.map((order) => (
              <TableRow key={order.id}>
                <TableCell>
                  <Checkbox
                    checked={selectedOrders.includes(order.id)}
                    onCheckedChange={(checked) => handleSelectOrder(order.id, !!checked)}
                  />
                </TableCell>
                <TableCell>
                  {format(new Date(order.created_at), 'dd MMM yyyy, HH:mm', { locale: uk })}
                </TableCell>
                <TableCell>
                  <div>
                    <p className="font-medium">{order.username || 'Невідомий'}</p>
                    {order.steam_id && (
                      <p className="text-xs text-muted-foreground">Steam: {order.steam_id}</p>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div>
                    <p className="font-bold text-primary">{order.final_amount}₴</p>
                    {order.discount_amount && order.discount_amount > 0 && (
                      <p className="text-xs text-muted-foreground">
                        Знижка: -{order.discount_amount}₴
                      </p>
                    )}
                  </div>
                </TableCell>
                <TableCell>{getPaymentMethodLabel(order.payment_method)}</TableCell>
                <TableCell>{getStatusBadge(order.payment_status)}</TableCell>
                <TableCell>
                  <Select
                    value={order.payment_status || 'pending'}
                    onValueChange={(status) => updateStatusMutation.mutate({ orderId: order.id, status, userId: order.user_id })}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Очікує</SelectItem>
                      <SelectItem value="processing">Обробка</SelectItem>
                      <SelectItem value="completed">Виконано</SelectItem>
                      <SelectItem value="failed">Помилка</SelectItem>
                    </SelectContent>
                  </Select>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {(!orders || orders.length === 0) && (
          <div className="text-center py-8 text-muted-foreground">
            Замовлень поки немає
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default OrderManagementEnhanced;
