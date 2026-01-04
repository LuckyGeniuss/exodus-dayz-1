import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { Package, Plus, Trash2, Loader2, Gift, Sparkles } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface Bundle {
  id: string;
  name: string;
  description: string | null;
  image: string | null;
  bundle_price: number;
  is_active: boolean;
  start_date: string;
  end_date: string | null;
}

interface BundleItem {
  id: string;
  bundle_id: string;
  product_id: string;
  quantity: number;
}

const BundleManagement = () => {
  const queryClient = useQueryClient();
  const [showDialog, setShowDialog] = useState(false);
  const [selectedBundle, setSelectedBundle] = useState<Bundle | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    image: '',
    bundle_price: '',
    is_active: true
  });
  const [bundleItems, setBundleItems] = useState<{ product_id: string; quantity: number }[]>([]);

  // Fetch bundles
  const { data: bundles = [], isLoading } = useQuery({
    queryKey: ['admin-bundles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('product_bundles')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as Bundle[];
    }
  });

  // Fetch products for select
  const { data: products = [] } = useQuery({
    queryKey: ['products-for-bundles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('id, name, price')
        .order('name');
      if (error) throw error;
      return data;
    }
  });

  // Fetch bundle items
  const { data: allBundleItems = [] } = useQuery({
    queryKey: ['all-bundle-items'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('bundle_items')
        .select('*');
      if (error) throw error;
      return data as BundleItem[];
    }
  });

  // Create/Update mutation
  const saveMutation = useMutation({
    mutationFn: async (isEdit: boolean) => {
      const bundleData = {
        name: formData.name,
        description: formData.description || null,
        image: formData.image || null,
        bundle_price: parseFloat(formData.bundle_price),
        is_active: formData.is_active
      };

      let bundleId: string;

      if (isEdit && selectedBundle) {
        const { error } = await supabase
          .from('product_bundles')
          .update(bundleData)
          .eq('id', selectedBundle.id);
        if (error) throw error;
        bundleId = selectedBundle.id;

        // Delete old items
        await supabase
          .from('bundle_items')
          .delete()
          .eq('bundle_id', bundleId);
      } else {
        const { data, error } = await supabase
          .from('product_bundles')
          .insert(bundleData)
          .select()
          .single();
        if (error) throw error;
        bundleId = data.id;
      }

      // Add new items
      if (bundleItems.length > 0) {
        const { error: itemsError } = await supabase
          .from('bundle_items')
          .insert(bundleItems.map(item => ({
            bundle_id: bundleId,
            product_id: item.product_id,
            quantity: item.quantity
          })));
        if (itemsError) throw itemsError;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-bundles'] });
      queryClient.invalidateQueries({ queryKey: ['all-bundle-items'] });
      toast.success(selectedBundle ? 'Набір оновлено' : 'Набір створено');
      resetForm();
    },
    onError: () => {
      toast.error('Помилка збереження набору');
    }
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('product_bundles')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-bundles'] });
      toast.success('Набір видалено');
    }
  });

  const resetForm = () => {
    setFormData({ name: '', description: '', image: '', bundle_price: '', is_active: true });
    setBundleItems([]);
    setSelectedBundle(null);
    setShowDialog(false);
  };

  const openEditDialog = (bundle: Bundle) => {
    setSelectedBundle(bundle);
    setFormData({
      name: bundle.name,
      description: bundle.description || '',
      image: bundle.image || '',
      bundle_price: bundle.bundle_price.toString(),
      is_active: bundle.is_active
    });
    setBundleItems(
      allBundleItems
        .filter(i => i.bundle_id === bundle.id)
        .map(i => ({ product_id: i.product_id, quantity: i.quantity }))
    );
    setShowDialog(true);
  };

  const addProductToBundle = () => {
    setBundleItems([...bundleItems, { product_id: '', quantity: 1 }]);
  };

  const removeProductFromBundle = (index: number) => {
    setBundleItems(bundleItems.filter((_, i) => i !== index));
  };

  const updateBundleItem = (index: number, field: 'product_id' | 'quantity', value: string | number) => {
    setBundleItems(bundleItems.map((item, i) => 
      i === index ? { ...item, [field]: value } : item
    ));
  };

  const calculateTotalValue = () => {
    return bundleItems.reduce((sum, item) => {
      const product = products.find(p => p.id === item.product_id);
      return sum + (product?.price || 0) * item.quantity;
    }, 0);
  };

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
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Gift className="h-6 w-6" />
              Управління наборами
            </CardTitle>
            <CardDescription>
              Створюйте вигідні комплекти товарів зі знижкою
            </CardDescription>
          </div>
          <Dialog open={showDialog} onOpenChange={(open) => { if (!open) resetForm(); else setShowDialog(true); }}>
            <DialogTrigger asChild>
              <Button onClick={() => setShowDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Новий набір
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {selectedBundle ? 'Редагувати набір' : 'Створити набір'}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Назва набору</Label>
                    <Input
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="VIP Стартовий набір"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Ціна набору (₴)</Label>
                    <Input
                      type="number"
                      value={formData.bundle_price}
                      onChange={(e) => setFormData({ ...formData, bundle_price: e.target.value })}
                      placeholder="999"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Опис</Label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Опис набору..."
                  />
                </div>

                <div className="space-y-2">
                  <Label>URL зображення</Label>
                  <Input
                    value={formData.image}
                    onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                    placeholder="https://..."
                  />
                </div>

                <div className="flex items-center gap-2">
                  <Switch
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                  />
                  <Label>Активний</Label>
                </div>

                <div className="space-y-3 border-t pt-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-base">Товари в наборі</Label>
                    <Button type="button" variant="outline" size="sm" onClick={addProductToBundle}>
                      <Plus className="h-4 w-4 mr-1" />
                      Додати товар
                    </Button>
                  </div>

                  {bundleItems.map((item, index) => (
                    <div key={index} className="flex gap-2 items-center">
                      <Select
                        value={item.product_id}
                        onValueChange={(value) => updateBundleItem(index, 'product_id', value)}
                      >
                        <SelectTrigger className="flex-1">
                          <SelectValue placeholder="Оберіть товар" />
                        </SelectTrigger>
                        <SelectContent>
                          {products.map((product) => (
                            <SelectItem key={product.id} value={product.id}>
                              {product.name} ({product.price} ₴)
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Input
                        type="number"
                        min={1}
                        value={item.quantity}
                        onChange={(e) => updateBundleItem(index, 'quantity', parseInt(e.target.value) || 1)}
                        className="w-20"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeProductFromBundle(index)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  ))}

                  {bundleItems.length > 0 && (
                    <div className="p-3 bg-muted rounded-lg">
                      <div className="flex justify-between text-sm">
                        <span>Загальна вартість товарів:</span>
                        <span className="font-medium">{calculateTotalValue().toFixed(0)} ₴</span>
                      </div>
                      {formData.bundle_price && (
                        <div className="flex justify-between text-sm text-green-600 mt-1">
                          <span className="flex items-center gap-1">
                            <Sparkles className="h-3 w-3" />
                            Економія:
                          </span>
                          <span className="font-medium">
                            {(calculateTotalValue() - parseFloat(formData.bundle_price)).toFixed(0)} ₴
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <Button
                  onClick={() => saveMutation.mutate(!!selectedBundle)}
                  disabled={saveMutation.isPending || !formData.name || !formData.bundle_price}
                  className="w-full"
                >
                  {saveMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  {selectedBundle ? 'Зберегти зміни' : 'Створити набір'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>

      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Назва</TableHead>
              <TableHead>Товарів</TableHead>
              <TableHead>Ціна</TableHead>
              <TableHead>Статус</TableHead>
              <TableHead className="text-right">Дії</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {bundles.map((bundle) => {
              const itemCount = allBundleItems.filter(i => i.bundle_id === bundle.id).length;
              return (
                <TableRow key={bundle.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Package className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{bundle.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{itemCount} шт</Badge>
                  </TableCell>
                  <TableCell className="font-medium">{bundle.bundle_price} ₴</TableCell>
                  <TableCell>
                    <Badge variant={bundle.is_active ? 'default' : 'secondary'}>
                      {bundle.is_active ? 'Активний' : 'Неактивний'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEditDialog(bundle)}
                      >
                        Редагувати
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteMutation.mutate(bundle.id)}
                        disabled={deleteMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
            {bundles.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                  Наборів поки немає. Створіть перший!
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default BundleManagement;
