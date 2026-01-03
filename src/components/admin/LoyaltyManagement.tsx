import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Loader2, Plus, Edit, Trash2, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';

interface LoyaltyLevel {
  id: string;
  name: string;
  min_spent: number;
  discount_percent: number;
  cashback_percent: number;
  icon: string;
  color: string;
}

const LoyaltyManagement = () => {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingLevel, setEditingLevel] = useState<LoyaltyLevel | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    min_spent: '0',
    discount_percent: '0',
    cashback_percent: '0',
    icon: '🥉',
    color: '#CD7F32',
  });

  const { data: levels, isLoading } = useQuery({
    queryKey: ['admin-loyalty-levels'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('loyalty_levels')
        .select('*')
        .order('min_spent', { ascending: true });
      if (error) throw error;
      return data as LoyaltyLevel[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (level: Omit<LoyaltyLevel, 'id'>) => {
      const { error } = await supabase.from('loyalty_levels').insert(level);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-loyalty-levels'] });
      toast.success('Рівень створено');
      handleCloseDialog();
    },
    onError: (error) => toast.error('Помилка: ' + error.message),
  });

  const updateMutation = useMutation({
    mutationFn: async (level: LoyaltyLevel) => {
      const { error } = await supabase
        .from('loyalty_levels')
        .update(level)
        .eq('id', level.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-loyalty-levels'] });
      toast.success('Рівень оновлено');
      handleCloseDialog();
    },
    onError: (error) => toast.error('Помилка: ' + error.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('loyalty_levels').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-loyalty-levels'] });
      toast.success('Рівень видалено');
    },
    onError: (error) => toast.error('Помилка: ' + error.message),
  });

  const handleEdit = (level: LoyaltyLevel) => {
    setEditingLevel(level);
    setFormData({
      name: level.name,
      min_spent: level.min_spent.toString(),
      discount_percent: level.discount_percent.toString(),
      cashback_percent: level.cashback_percent.toString(),
      icon: level.icon,
      color: level.color,
    });
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingLevel(null);
    setFormData({
      name: '',
      min_spent: '0',
      discount_percent: '0',
      cashback_percent: '0',
      icon: '🥉',
      color: '#CD7F32',
    });
  };

  const handleSubmit = () => {
    const levelData = {
      name: formData.name,
      min_spent: parseFloat(formData.min_spent),
      discount_percent: parseFloat(formData.discount_percent),
      cashback_percent: parseFloat(formData.cashback_percent),
      icon: formData.icon,
      color: formData.color,
    };

    if (editingLevel) {
      updateMutation.mutate({ ...levelData, id: editingLevel.id });
    } else {
      createMutation.mutate(levelData);
    }
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
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Рівні лояльності
          </CardTitle>
          <Button onClick={() => { handleCloseDialog(); setIsDialogOpen(true); }}>
            <Plus className="h-4 w-4 mr-2" />
            Додати рівень
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Іконка</TableHead>
              <TableHead>Назва</TableHead>
              <TableHead>Мін. витрати</TableHead>
              <TableHead>Знижка</TableHead>
              <TableHead>Кешбек</TableHead>
              <TableHead className="text-right">Дії</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {levels?.map((level) => (
              <TableRow key={level.id}>
                <TableCell className="text-2xl">{level.icon}</TableCell>
                <TableCell style={{ color: level.color }} className="font-medium">
                  {level.name}
                </TableCell>
                <TableCell>{level.min_spent.toFixed(2)} ₴</TableCell>
                <TableCell>{level.discount_percent}%</TableCell>
                <TableCell>{level.cashback_percent}%</TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="icon" onClick={() => handleEdit(level)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      if (confirm('Видалити цей рівень?')) {
                        deleteMutation.mutate(level.id);
                      }
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingLevel ? 'Редагувати рівень' : 'Новий рівень'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Назва</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Іконка (емоджі)</Label>
                <Input
                  value={formData.icon}
                  onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Мінімальні витрати (₴)</Label>
                <Input
                  type="number"
                  min="0"
                  value={formData.min_spent}
                  onChange={(e) => setFormData({ ...formData, min_spent: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Колір</Label>
                <Input
                  type="color"
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Знижка (%)</Label>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  value={formData.discount_percent}
                  onChange={(e) => setFormData({ ...formData, discount_percent: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Кешбек (%)</Label>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  value={formData.cashback_percent}
                  onChange={(e) => setFormData({ ...formData, cashback_percent: e.target.value })}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleCloseDialog}>Скасувати</Button>
            <Button onClick={handleSubmit} disabled={createMutation.isPending || updateMutation.isPending}>
              {(createMutation.isPending || updateMutation.isPending) && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              {editingLevel ? 'Зберегти' : 'Створити'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default LoyaltyManagement;
