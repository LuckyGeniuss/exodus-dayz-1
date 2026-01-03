import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Loader2, Plus, Pencil, Trash2, Search, Filter, Copy, ChevronLeft, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import ProductImageManager from './ProductImageManager';

interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  category: string;
  image: string | null;
}

const CATEGORIES = [
  { value: 'all', label: 'Всі категорії' },
  { value: 'vip', label: 'VIP' },
  { value: 'cosmetic', label: 'Косметика' },
  { value: 'vehicle', label: 'Транспорт' },
  { value: 'clothing', label: 'Одяг' },
  { value: 'cassette', label: 'Касети' },
  { value: 'workshop', label: 'Воркшоп' },
  { value: 'custom', label: 'Кастомні предмети' },
];

const ITEMS_PER_PAGE = 15;

const ProductManagement = () => {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set());
  const [editingPriceId, setEditingPriceId] = useState<string | null>(null);
  const [editingPriceValue, setEditingPriceValue] = useState('');
  const [formData, setFormData] = useState({
    id: '',
    name: '',
    description: '',
    price: '',
    category: '',
    image: '',
  });

  const { data: products, isLoading } = useQuery({
    queryKey: ['admin-products'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Product[];
    },
  });

  const filteredProducts = useMemo(() => {
    if (!products) return [];
    
    return products.filter((product) => {
      const matchesSearch = searchQuery === '' || 
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.id.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesCategory = categoryFilter === 'all' || product.category === categoryFilter;
      
      return matchesSearch && matchesCategory;
    });
  }, [products, searchQuery, categoryFilter]);

  const totalPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE);
  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const createMutation = useMutation({
    mutationFn: async (product: Omit<Product, 'created_at'>) => {
      const { error } = await supabase.from('products').insert(product);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Продукт створено');
      handleCloseDialog();
    },
    onError: (error) => {
      toast.error('Помилка створення продукту: ' + error.message);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (product: Product) => {
      const { error } = await supabase
        .from('products')
        .update(product)
        .eq('id', product.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Продукт оновлено');
      handleCloseDialog();
      setEditingPriceId(null);
    },
    onError: (error) => {
      toast.error('Помилка оновлення продукту: ' + error.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('products').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Продукт видалено');
    },
    onError: (error) => {
      toast.error('Помилка видалення продукту: ' + error.message);
    },
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      const { error } = await supabase.from('products').delete().in('id', ids);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success(`Видалено ${selectedProducts.size} продуктів`);
      setSelectedProducts(new Set());
    },
    onError: (error) => {
      toast.error('Помилка видалення: ' + error.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const productData = {
      id: formData.id,
      name: formData.name,
      description: formData.description || null,
      price: parseFloat(formData.price),
      category: formData.category,
      image: formData.image || null,
    };

    if (editingProduct) {
      updateMutation.mutate(productData as Product);
    } else {
      createMutation.mutate(productData);
    }
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      id: product.id,
      name: product.name,
      description: product.description || '',
      price: product.price.toString(),
      category: product.category,
      image: product.image || '',
    });
    setIsDialogOpen(true);
  };

  const handleDuplicate = (product: Product) => {
    setEditingProduct(null);
    setFormData({
      id: product.id + '-copy',
      name: product.name + ' (копія)',
      description: product.description || '',
      price: product.price.toString(),
      category: product.category,
      image: product.image || '',
    });
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingProduct(null);
    setFormData({
      id: '',
      name: '',
      description: '',
      price: '',
      category: '',
      image: '',
    });
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedProducts(new Set(paginatedProducts.map(p => p.id)));
    } else {
      setSelectedProducts(new Set());
    }
  };

  const handleSelectProduct = (id: string, checked: boolean) => {
    const newSelected = new Set(selectedProducts);
    if (checked) {
      newSelected.add(id);
    } else {
      newSelected.delete(id);
    }
    setSelectedProducts(newSelected);
  };

  const handleBulkDelete = () => {
    if (selectedProducts.size === 0) return;
    if (confirm(`Видалити ${selectedProducts.size} обраних продуктів?`)) {
      bulkDeleteMutation.mutate(Array.from(selectedProducts));
    }
  };

  const handleQuickPriceEdit = (product: Product) => {
    setEditingPriceId(product.id);
    setEditingPriceValue(product.price.toString());
  };

  const handleQuickPriceSave = (product: Product) => {
    const newPrice = parseFloat(editingPriceValue);
    if (isNaN(newPrice) || newPrice < 0) {
      toast.error('Невірна ціна');
      return;
    }
    updateMutation.mutate({ ...product, price: newPrice });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-4">
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Управління Продуктами</CardTitle>
              <CardDescription>
                Додавайте, редагуйте та видаляйте продукти ({filteredProducts.length} з {products?.length || 0})
              </CardDescription>
            </div>
            <div className="flex gap-2">
              {selectedProducts.size > 0 && (
                <Button 
                  variant="destructive" 
                  onClick={handleBulkDelete}
                  disabled={bulkDeleteMutation.isPending}
                >
                  {bulkDeleteMutation.isPending ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4 mr-2" />
                  )}
                  Видалити ({selectedProducts.size})
                </Button>
              )}
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={() => handleCloseDialog()}>
                    <Plus className="h-4 w-4 mr-2" />
                    Додати продукт
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <form onSubmit={handleSubmit}>
                    <DialogHeader>
                      <DialogTitle>
                        {editingProduct ? 'Редагувати продукт' : 'Новий продукт'}
                      </DialogTitle>
                      <DialogDescription>
                        Заповніть інформацію про продукт
                      </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-4 py-4">
                      <div className="grid gap-2">
                        <Label htmlFor="id">ID (унікальний)</Label>
                        <Input
                          id="id"
                          value={formData.id}
                          onChange={(e) => setFormData({ ...formData, id: e.target.value })}
                          required
                          disabled={!!editingProduct}
                        />
                      </div>

                      <div className="grid gap-2">
                        <Label htmlFor="name">Назва</Label>
                        <Input
                          id="name"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          required
                        />
                      </div>

                      <div className="grid gap-2">
                        <Label htmlFor="description">Опис</Label>
                        <Textarea
                          id="description"
                          value={formData.description}
                          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                          rows={3}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                          <Label htmlFor="price">Ціна (₴)</Label>
                          <Input
                            id="price"
                            type="number"
                            step="0.01"
                            min="0"
                            value={formData.price}
                            onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                            required
                          />
                        </div>

                        <div className="grid gap-2">
                          <Label htmlFor="category">Категорія</Label>
                          <Select
                            value={formData.category}
                            onValueChange={(value) => setFormData({ ...formData, category: value })}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Оберіть категорію" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="vip">VIP</SelectItem>
                              <SelectItem value="cosmetic">Косметика</SelectItem>
                              <SelectItem value="vehicle">Транспорт</SelectItem>
                              <SelectItem value="clothing">Одяг</SelectItem>
                              <SelectItem value="cassette">Касети</SelectItem>
                              <SelectItem value="workshop">Воркшоп</SelectItem>
                              <SelectItem value="custom">Кастомні предмети</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="grid gap-2">
                        <Label htmlFor="image">URL зображення</Label>
                        <Input
                          id="image"
                          value={formData.image}
                          onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                          placeholder="https://..."
                        />
                      </div>
                    </div>

                    <DialogFooter>
                      <Button type="button" variant="outline" onClick={handleCloseDialog}>
                        Скасувати
                      </Button>
                      <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                        {(createMutation.isPending || updateMutation.isPending) && (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        )}
                        {editingProduct ? 'Зберегти' : 'Створити'}
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </div>
          
          {/* Search and Filter */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Пошук за назвою або ID..."
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                className="pl-9"
              />
            </div>
            <Select value={categoryFilter} onValueChange={(v) => { setCategoryFilter(v); setCurrentPage(1); }}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Категорія" />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]">
                <Checkbox 
                  checked={paginatedProducts.length > 0 && paginatedProducts.every(p => selectedProducts.has(p.id))}
                  onCheckedChange={handleSelectAll}
                />
              </TableHead>
              <TableHead>ID</TableHead>
              <TableHead>Назва</TableHead>
              <TableHead>Категорія</TableHead>
              <TableHead>Ціна</TableHead>
              <TableHead className="text-right">Дії</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedProducts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  {searchQuery || categoryFilter !== 'all' 
                    ? 'Товарів за цими критеріями не знайдено' 
                    : 'Немає товарів'}
                </TableCell>
              </TableRow>
            ) : (
              paginatedProducts.map((product) => (
                <TableRow key={product.id}>
                  <TableCell>
                    <Checkbox 
                      checked={selectedProducts.has(product.id)}
                      onCheckedChange={(checked) => handleSelectProduct(product.id, !!checked)}
                    />
                  </TableCell>
                  <TableCell className="font-mono text-sm">{product.id}</TableCell>
                  <TableCell>{product.name}</TableCell>
                  <TableCell className="capitalize">{product.category}</TableCell>
                  <TableCell>
                    {editingPriceId === product.id ? (
                      <div className="flex items-center gap-1">
                        <Input
                          type="number"
                          step="0.01"
                          value={editingPriceValue}
                          onChange={(e) => setEditingPriceValue(e.target.value)}
                          className="w-24 h-8"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleQuickPriceSave(product);
                            if (e.key === 'Escape') setEditingPriceId(null);
                          }}
                        />
                        <Button size="sm" variant="ghost" onClick={() => handleQuickPriceSave(product)}>
                          ✓
                        </Button>
                      </div>
                    ) : (
                      <span 
                        className="cursor-pointer hover:underline" 
                        onClick={() => handleQuickPriceEdit(product)}
                        title="Натисніть для редагування"
                      >
                        {product.price.toFixed(2)} ₴
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <ProductImageManager 
                      productId={product.id} 
                      productName={product.name} 
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDuplicate(product)}
                      title="Копіювати"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEdit(product)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        if (confirm('Видалити цей продукт?')) {
                          deleteMutation.mutate(product.id);
                        }
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-4">
            <p className="text-sm text-muted-foreground">
              Показано {(currentPage - 1) * ITEMS_PER_PAGE + 1}-{Math.min(currentPage * ITEMS_PER_PAGE, filteredProducts.length)} з {filteredProducts.length}
            </p>
            <div className="flex items-center gap-2">
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
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ProductManagement;
