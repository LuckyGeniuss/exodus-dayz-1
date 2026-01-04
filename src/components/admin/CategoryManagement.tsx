import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Loader2, Plus, Pencil, Trash2, FolderOpen, Package } from 'lucide-react';
import { toast } from 'sonner';

interface CategoryStats {
  category: string;
  count: number;
}

const PREDEFINED_CATEGORIES = [
  { id: 'vip', name: 'VIP', icon: '👑', color: 'bg-yellow-500/10 text-yellow-500' },
  { id: 'cosmetic', name: 'Косметика', icon: '✨', color: 'bg-pink-500/10 text-pink-500' },
  { id: 'vehicle', name: 'Транспорт', icon: '🚗', color: 'bg-blue-500/10 text-blue-500' },
  { id: 'clothing', name: 'Одяг', icon: '👕', color: 'bg-purple-500/10 text-purple-500' },
  { id: 'cassette', name: 'Касети', icon: '📼', color: 'bg-green-500/10 text-green-500' },
  { id: 'workshop', name: 'Воркшоп', icon: '🔧', color: 'bg-orange-500/10 text-orange-500' },
  { id: 'custom', name: 'Кастомні предмети', icon: '🎨', color: 'bg-red-500/10 text-red-500' },
];

const CategoryManagement = () => {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<typeof PREDEFINED_CATEGORIES[0] | null>(null);
  const [categories, setCategories] = useState(PREDEFINED_CATEGORIES);
  const [newCategory, setNewCategory] = useState({ id: '', name: '', icon: '📦' });

  // Fetch product counts by category
  const { data: categoryStats, isLoading } = useQuery({
    queryKey: ['category-stats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('category');

      if (error) throw error;

      // Count products per category
      const counts: Record<string, number> = {};
      (data || []).forEach((product) => {
        counts[product.category] = (counts[product.category] || 0) + 1;
      });

      return counts;
    },
  });

  const handleAddCategory = () => {
    if (!newCategory.id || !newCategory.name) {
      toast.error('Заповніть ID та назву категорії');
      return;
    }

    if (categories.find(c => c.id === newCategory.id)) {
      toast.error('Категорія з таким ID вже існує');
      return;
    }

    setCategories([...categories, { 
      ...newCategory, 
      color: 'bg-gray-500/10 text-gray-500' 
    }]);
    setNewCategory({ id: '', name: '', icon: '📦' });
    setIsDialogOpen(false);
    toast.success('Категорію додано');
    queryClient.invalidateQueries({ queryKey: ['admin-products'] });
  };

  const handleEditCategory = () => {
    if (!editingCategory) return;

    setCategories(categories.map(c => 
      c.id === editingCategory.id ? editingCategory : c
    ));
    setEditingCategory(null);
    setIsDialogOpen(false);
    toast.success('Категорію оновлено');
    queryClient.invalidateQueries({ queryKey: ['admin-products'] });
  };

  const handleDeleteCategory = async (categoryId: string) => {
    const productCount = categoryStats?.[categoryId] || 0;
    
    if (productCount > 0) {
      toast.error(`Неможливо видалити категорію з ${productCount} товарами`);
      return;
    }

    if (PREDEFINED_CATEGORIES.find(c => c.id === categoryId)) {
      toast.error('Неможливо видалити системну категорію');
      return;
    }

    setCategories(categories.filter(c => c.id !== categoryId));
    toast.success('Категорію видалено');
  };

  const openEditDialog = (category: typeof PREDEFINED_CATEGORIES[0]) => {
    setEditingCategory(category);
    setIsDialogOpen(true);
  };

  const openAddDialog = () => {
    setEditingCategory(null);
    setNewCategory({ id: '', name: '', icon: '📦' });
    setIsDialogOpen(true);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const totalProducts = Object.values(categoryStats || {}).reduce((sum, count) => sum + count, 0);

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <FolderOpen className="h-4 w-4" />
              Категорій
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{categories.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Package className="h-4 w-4" />
              Всього товарів
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalProducts}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Управління категоріями</CardTitle>
              <CardDescription>
                Додавайте, редагуйте та видаляйте категорії товарів
              </CardDescription>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={openAddDialog}>
                  <Plus className="h-4 w-4 mr-2" />
                  Додати категорію
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {editingCategory ? 'Редагувати категорію' : 'Нова категорія'}
                  </DialogTitle>
                  <DialogDescription>
                    {editingCategory 
                      ? 'Змініть параметри категорії' 
                      : 'Створіть нову категорію товарів'}
                  </DialogDescription>
                </DialogHeader>
                
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="id">ID (латиницею)</Label>
                    <Input
                      id="id"
                      value={editingCategory?.id || newCategory.id}
                      onChange={(e) => editingCategory 
                        ? setEditingCategory({ ...editingCategory, id: e.target.value })
                        : setNewCategory({ ...newCategory, id: e.target.value })
                      }
                      placeholder="my-category"
                      disabled={!!editingCategory}
                    />
                  </div>
                  
                  <div className="grid gap-2">
                    <Label htmlFor="name">Назва</Label>
                    <Input
                      id="name"
                      value={editingCategory?.name || newCategory.name}
                      onChange={(e) => editingCategory 
                        ? setEditingCategory({ ...editingCategory, name: e.target.value })
                        : setNewCategory({ ...newCategory, name: e.target.value })
                      }
                      placeholder="Моя категорія"
                    />
                  </div>
                  
                  <div className="grid gap-2">
                    <Label htmlFor="icon">Іконка (емодзі)</Label>
                    <Input
                      id="icon"
                      value={editingCategory?.icon || newCategory.icon}
                      onChange={(e) => editingCategory 
                        ? setEditingCategory({ ...editingCategory, icon: e.target.value })
                        : setNewCategory({ ...newCategory, icon: e.target.value })
                      }
                      placeholder="📦"
                    />
                  </div>
                </div>

                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Скасувати
                  </Button>
                  <Button onClick={editingCategory ? handleEditCategory : handleAddCategory}>
                    {editingCategory ? 'Зберегти' : 'Створити'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Іконка</TableHead>
                <TableHead>ID</TableHead>
                <TableHead>Назва</TableHead>
                <TableHead>Товарів</TableHead>
                <TableHead>Тип</TableHead>
                <TableHead className="text-right">Дії</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {categories.map((category) => {
                const productCount = categoryStats?.[category.id] || 0;
                const isPredefined = PREDEFINED_CATEGORIES.find(c => c.id === category.id);
                
                return (
                  <TableRow key={category.id}>
                    <TableCell>
                      <span className="text-2xl">{category.icon}</span>
                    </TableCell>
                    <TableCell>
                      <code className="text-sm bg-muted px-2 py-1 rounded">
                        {category.id}
                      </code>
                    </TableCell>
                    <TableCell className="font-medium">{category.name}</TableCell>
                    <TableCell>
                      <Badge className={category.color}>
                        {productCount} товарів
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {isPredefined ? (
                        <Badge variant="secondary">Системна</Badge>
                      ) : (
                        <Badge variant="outline">Користувацька</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => openEditDialog(category)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="destructive" 
                          size="sm"
                          onClick={() => handleDeleteCategory(category.id)}
                          disabled={!!isPredefined || productCount > 0}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
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

export default CategoryManagement;
