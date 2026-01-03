import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Zap, Plus, Trash2, Clock, Package } from 'lucide-react';
import { format, addHours, addDays } from 'date-fns';

const FlashSaleManagement = () => {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState('');
  const [discountPercent, setDiscountPercent] = useState('20');
  const [duration, setDuration] = useState('24');
  const [flashTitle, setFlashTitle] = useState('');

  const { data: flashSales, isLoading } = useQuery({
    queryKey: ['flash-sales'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('promotions')
        .select('*')
        .eq('is_flash_sale', true)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: products } = useQuery({
    queryKey: ['products-for-flash'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('id, name, price')
        .order('name');
      if (error) throw error;
      return data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (values: {
      product_id: string;
      discount_percent: number;
      end_date: string;
      flash_title: string;
    }) => {
      const { error } = await supabase.from('promotions').insert({
        product_id: values.product_id,
        discount_percent: values.discount_percent,
        end_date: values.end_date,
        is_active: true,
        is_flash_sale: true,
        flash_title: values.flash_title || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['flash-sales'] });
      queryClient.invalidateQueries({ queryKey: ['promotions'] });
      toast.success('Flash-розпродаж створено!');
      setIsDialogOpen(false);
      resetForm();
    },
    onError: () => {
      toast.error('Помилка при створенні');
    },
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase
        .from('promotions')
        .update({ is_active })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['flash-sales'] });
      queryClient.invalidateQueries({ queryKey: ['promotions'] });
      toast.success('Статус оновлено');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('promotions').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['flash-sales'] });
      queryClient.invalidateQueries({ queryKey: ['promotions'] });
      toast.success('Видалено');
    },
  });

  const resetForm = () => {
    setSelectedProduct('');
    setDiscountPercent('20');
    setDuration('24');
    setFlashTitle('');
  };

  const handleCreate = () => {
    if (!selectedProduct) {
      toast.error('Оберіть товар');
      return;
    }
    
    const endDate = addHours(new Date(), parseInt(duration));
    
    createMutation.mutate({
      product_id: selectedProduct,
      discount_percent: parseInt(discountPercent),
      end_date: endDate.toISOString(),
      flash_title: flashTitle,
    });
  };

  const getProductName = (productId: string) => {
    return products?.find(p => p.id === productId)?.name || productId;
  };

  const isExpired = (endDate: string | null) => {
    if (!endDate) return false;
    return new Date(endDate) < new Date();
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-orange-500" />
              Flash-розпродажі
            </CardTitle>
            <CardDescription>
              Створюйте обмежені за часом акції з таймером
            </CardDescription>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Новий Flash Sale
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Створити Flash-розпродаж</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Товар</Label>
                  <Select value={selectedProduct} onValueChange={setSelectedProduct}>
                    <SelectTrigger>
                      <SelectValue placeholder="Оберіть товар" />
                    </SelectTrigger>
                    <SelectContent>
                      {products?.map((product) => (
                        <SelectItem key={product.id} value={product.id}>
                          <div className="flex items-center gap-2">
                            <Package className="h-4 w-4" />
                            {product.name} - {product.price}₴
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label>Знижка (%)</Label>
                  <Select value={discountPercent} onValueChange={setDiscountPercent}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[10, 15, 20, 25, 30, 40, 50, 60, 70].map((percent) => (
                        <SelectItem key={percent} value={percent.toString()}>
                          {percent}%
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Тривалість</Label>
                  <Select value={duration} onValueChange={setDuration}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 година</SelectItem>
                      <SelectItem value="2">2 години</SelectItem>
                      <SelectItem value="4">4 години</SelectItem>
                      <SelectItem value="6">6 годин</SelectItem>
                      <SelectItem value="12">12 годин</SelectItem>
                      <SelectItem value="24">24 години</SelectItem>
                      <SelectItem value="48">48 годин</SelectItem>
                      <SelectItem value="72">72 години</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Назва акції (опціонально)</Label>
                  <Input
                    value={flashTitle}
                    onChange={(e) => setFlashTitle(e.target.value)}
                    placeholder="MEGA SALE!"
                  />
                </div>

                <Button 
                  onClick={handleCreate} 
                  className="w-full"
                  disabled={createMutation.isPending}
                >
                  {createMutation.isPending ? 'Створення...' : 'Створити Flash Sale'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-center text-muted-foreground py-8">Завантаження...</p>
        ) : !flashSales?.length ? (
          <p className="text-center text-muted-foreground py-8">
            Немає активних flash-розпродажів
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Товар</TableHead>
                <TableHead>Знижка</TableHead>
                <TableHead>Закінчується</TableHead>
                <TableHead>Статус</TableHead>
                <TableHead>Активний</TableHead>
                <TableHead className="w-[100px]">Дії</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {flashSales.map((sale) => (
                <TableRow key={sale.id}>
                  <TableCell className="font-medium">
                    <div>
                      {getProductName(sale.product_id)}
                      {sale.flash_title && (
                        <div className="text-xs text-orange-500">{sale.flash_title}</div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="destructive">-{sale.discount_percent}%</Badge>
                  </TableCell>
                  <TableCell>
                    {sale.end_date ? (
                      <div className="flex items-center gap-1 text-sm">
                        <Clock className="h-3 w-3" />
                        {format(new Date(sale.end_date), 'dd.MM.yy HH:mm')}
                      </div>
                    ) : (
                      'Безстроково'
                    )}
                  </TableCell>
                  <TableCell>
                    {isExpired(sale.end_date) ? (
                      <Badge variant="secondary">Завершено</Badge>
                    ) : sale.is_active ? (
                      <Badge className="bg-green-500">Активний</Badge>
                    ) : (
                      <Badge variant="outline">Неактивний</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <Switch
                      checked={sale.is_active}
                      onCheckedChange={(checked) =>
                        toggleMutation.mutate({ id: sale.id, is_active: checked })
                      }
                    />
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteMutation.mutate(sale.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
};

export default FlashSaleManagement;
