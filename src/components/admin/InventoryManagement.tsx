import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { Package, AlertTriangle, Check, Loader2, RefreshCcw } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useProducts } from '@/hooks/useProducts';

interface InventoryItem {
  id: string;
  product_id: string;
  stock_quantity: number;
  low_stock_threshold: number;
  is_unlimited: boolean;
}

const InventoryManagement = () => {
  const queryClient = useQueryClient();
  const { products } = useProducts();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<Partial<InventoryItem>>({});

  // Fetch inventory
  const { data: inventory = [], isLoading } = useQuery({
    queryKey: ['inventory'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('product_inventory')
        .select('*');
      if (error) throw error;
      return data as InventoryItem[];
    }
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async ({ productId, updates }: { productId: string; updates: Partial<InventoryItem> }) => {
      const existing = inventory.find(i => i.product_id === productId);
      
      if (existing) {
        const { error } = await supabase
          .from('product_inventory')
          .update(updates)
          .eq('product_id', productId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('product_inventory')
          .insert({ product_id: productId, ...updates });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      toast.success('Інвентар оновлено');
      setEditingId(null);
    },
    onError: () => {
      toast.error('Помилка оновлення');
    }
  });

  // Initialize all products mutation
  const initMutation = useMutation({
    mutationFn: async () => {
      const existingIds = inventory.map(i => i.product_id);
      const newProducts = products.filter(p => !existingIds.includes(p.id));
      
      if (newProducts.length > 0) {
        const { error } = await supabase
          .from('product_inventory')
          .insert(newProducts.map(p => ({
            product_id: p.id,
            stock_quantity: 0,
            is_unlimited: true
          })));
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      toast.success('Інвентар ініціалізовано для всіх товарів');
    }
  });

  const startEditing = (item: InventoryItem) => {
    setEditingId(item.product_id);
    setEditValues({
      stock_quantity: item.stock_quantity,
      low_stock_threshold: item.low_stock_threshold,
      is_unlimited: item.is_unlimited
    });
  };

  const saveEdit = (productId: string) => {
    updateMutation.mutate({ productId, updates: editValues });
  };

  const getInventoryForProduct = (productId: string) => {
    return inventory.find(i => i.product_id === productId);
  };

  // Stats
  const lowStockCount = inventory.filter(i => 
    !i.is_unlimited && i.stock_quantity <= i.low_stock_threshold
  ).length;

  const outOfStockCount = inventory.filter(i => 
    !i.is_unlimited && i.stock_quantity === 0
  ).length;

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
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Всього товарів</p>
                <p className="text-2xl font-bold">{products.length}</p>
              </div>
              <Package className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card className={lowStockCount > 0 ? 'border-yellow-500/50' : ''}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Низький запас</p>
                <p className="text-2xl font-bold text-yellow-500">{lowStockCount}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card className={outOfStockCount > 0 ? 'border-red-500/50' : ''}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Немає в наявності</p>
                <p className="text-2xl font-bold text-red-500">{outOfStockCount}</p>
              </div>
              <Package className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-6 w-6" />
                Управління складом
              </CardTitle>
              <CardDescription>
                Контролюйте кількість товарів на складі
              </CardDescription>
            </div>
            <Button
              variant="outline"
              onClick={() => initMutation.mutate()}
              disabled={initMutation.isPending}
            >
              {initMutation.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <RefreshCcw className="h-4 w-4 mr-2" />
              )}
              Ініціалізувати всі
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Товар</TableHead>
                <TableHead>Кількість</TableHead>
                <TableHead>Поріг</TableHead>
                <TableHead>Безлімітний</TableHead>
                <TableHead>Статус</TableHead>
                <TableHead className="text-right">Дії</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((product) => {
                const inv = getInventoryForProduct(product.id);
                const isEditing = editingId === product.id;
                const isLowStock = inv && !inv.is_unlimited && inv.stock_quantity <= inv.low_stock_threshold;
                const isOutOfStock = inv && !inv.is_unlimited && inv.stock_quantity === 0;

                return (
                  <TableRow key={product.id} className={isOutOfStock ? 'bg-red-500/5' : isLowStock ? 'bg-yellow-500/5' : ''}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <img 
                          src={product.image} 
                          alt={product.name} 
                          className="h-8 w-8 rounded object-cover"
                        />
                        <span className="font-medium">{product.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {isEditing ? (
                        <Input
                          type="number"
                          min={0}
                          value={editValues.stock_quantity ?? 0}
                          onChange={(e) => setEditValues({ ...editValues, stock_quantity: parseInt(e.target.value) || 0 })}
                          className="w-24"
                        />
                      ) : (
                        <span>{inv?.is_unlimited ? '∞' : (inv?.stock_quantity ?? '-')}</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {isEditing ? (
                        <Input
                          type="number"
                          min={0}
                          value={editValues.low_stock_threshold ?? 5}
                          onChange={(e) => setEditValues({ ...editValues, low_stock_threshold: parseInt(e.target.value) || 5 })}
                          className="w-20"
                        />
                      ) : (
                        <span>{inv?.low_stock_threshold ?? '-'}</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {isEditing ? (
                        <Switch
                          checked={editValues.is_unlimited ?? true}
                          onCheckedChange={(checked) => setEditValues({ ...editValues, is_unlimited: checked })}
                        />
                      ) : (
                        <span>{inv?.is_unlimited ? 'Так' : 'Ні'}</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {!inv || inv.is_unlimited ? (
                        <Badge variant="secondary">∞ Безлімітний</Badge>
                      ) : isOutOfStock ? (
                        <Badge variant="destructive">Немає в наявності</Badge>
                      ) : isLowStock ? (
                        <Badge className="bg-yellow-500/20 text-yellow-500 border-yellow-500/30">
                          Низький запас
                        </Badge>
                      ) : (
                        <Badge variant="default">
                          <Check className="h-3 w-3 mr-1" />
                          В наявності
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {isEditing ? (
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            onClick={() => saveEdit(product.id)}
                            disabled={updateMutation.isPending}
                          >
                            {updateMutation.isPending && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
                            Зберегти
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setEditingId(null)}
                          >
                            Скасувати
                          </Button>
                        </div>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            if (inv) {
                              startEditing(inv);
                            } else {
                              setEditingId(product.id);
                              setEditValues({
                                stock_quantity: 0,
                                low_stock_threshold: 5,
                                is_unlimited: true
                              });
                            }
                          }}
                        >
                          Редагувати
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default InventoryManagement;
