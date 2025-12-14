import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Loader2, Plus, Pencil, Trash2, Search, Tag } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { uk } from 'date-fns/locale';

interface PromoCode {
  id: string;
  code: string;
  discount_percent: number;
  max_uses: number | null;
  current_uses: number;
  min_order_amount: number;
  valid_from: string;
  valid_until: string | null;
  is_active: boolean;
  created_at: string;
}

const PromoCodeManagement = () => {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCode, setEditingCode] = useState<PromoCode | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [formData, setFormData] = useState({
    code: '',
    discount_percent: '',
    max_uses: '',
    min_order_amount: '',
    valid_until: '',
    is_active: true,
  });

  const { data: promoCodes, isLoading } = useQuery({
    queryKey: ['admin-promo-codes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('promo_codes')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as PromoCode[];
    },
  });

  const filteredCodes = useMemo(() => {
    if (!promoCodes) return [];
    
    return promoCodes.filter((code) => 
      searchQuery === '' || 
      code.code.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [promoCodes, searchQuery]);

  const createMutation = useMutation({
    mutationFn: async (data: { code: string; discount_percent: number; max_uses: number | null; min_order_amount: number; valid_until: string | null; is_active: boolean }) => {
      const { error } = await supabase.from('promo_codes').insert([data]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-promo-codes'] });
      toast.success('Промокод створено');
      handleCloseDialog();
    },
    onError: (error) => {
      toast.error('Помилка створення: ' + error.message);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<PromoCode> }) => {
      const { error } = await supabase
        .from('promo_codes')
        .update(data)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-promo-codes'] });
      toast.success('Промокод оновлено');
      handleCloseDialog();
    },
    onError: (error) => {
      toast.error('Помилка оновлення: ' + error.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('promo_codes').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-promo-codes'] });
      toast.success('Промокод видалено');
    },
    onError: (error) => {
      toast.error('Помилка видалення: ' + error.message);
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase
        .from('promo_codes')
        .update({ is_active })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-promo-codes'] });
      toast.success('Статус оновлено');
    },
    onError: (error) => {
      toast.error('Помилка: ' + error.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const codeData = {
      code: formData.code.toUpperCase(),
      discount_percent: parseInt(formData.discount_percent),
      max_uses: formData.max_uses ? parseInt(formData.max_uses) : null,
      min_order_amount: parseFloat(formData.min_order_amount) || 0,
      valid_until: formData.valid_until || null,
      is_active: formData.is_active,
    };

    if (editingCode) {
      updateMutation.mutate({ id: editingCode.id, data: codeData });
    } else {
      createMutation.mutate(codeData);
    }
  };

  const handleEdit = (code: PromoCode) => {
    setEditingCode(code);
    setFormData({
      code: code.code,
      discount_percent: code.discount_percent.toString(),
      max_uses: code.max_uses?.toString() || '',
      min_order_amount: code.min_order_amount.toString(),
      valid_until: code.valid_until?.split('T')[0] || '',
      is_active: code.is_active,
    });
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingCode(null);
    setFormData({
      code: '',
      discount_percent: '',
      max_uses: '',
      min_order_amount: '',
      valid_until: '',
      is_active: true,
    });
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
              <CardTitle className="flex items-center gap-2">
                <Tag className="h-5 w-5" />
                Управління Промокодами
              </CardTitle>
              <CardDescription>
                Створюйте та керуйте промокодами ({filteredCodes.length})
              </CardDescription>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => handleCloseDialog()}>
                  <Plus className="h-4 w-4 mr-2" />
                  Новий промокод
                </Button>
              </DialogTrigger>
              <DialogContent>
                <form onSubmit={handleSubmit}>
                  <DialogHeader>
                    <DialogTitle>
                      {editingCode ? 'Редагувати промокод' : 'Новий промокод'}
                    </DialogTitle>
                    <DialogDescription>
                      Заповніть дані промокоду
                    </DialogDescription>
                  </DialogHeader>

                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="code">Код</Label>
                      <Input
                        id="code"
                        value={formData.code}
                        onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                        placeholder="PROMO2024"
                        required
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="discount">Знижка (%)</Label>
                        <Input
                          id="discount"
                          type="number"
                          min="1"
                          max="100"
                          value={formData.discount_percent}
                          onChange={(e) => setFormData({ ...formData, discount_percent: e.target.value })}
                          required
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="max_uses">Макс. використань</Label>
                        <Input
                          id="max_uses"
                          type="number"
                          min="1"
                          value={formData.max_uses}
                          onChange={(e) => setFormData({ ...formData, max_uses: e.target.value })}
                          placeholder="Без обмежень"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="min_order">Мін. замовлення (₴)</Label>
                        <Input
                          id="min_order"
                          type="number"
                          min="0"
                          value={formData.min_order_amount}
                          onChange={(e) => setFormData({ ...formData, min_order_amount: e.target.value })}
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="valid_until">Дійсний до</Label>
                        <Input
                          id="valid_until"
                          type="date"
                          value={formData.valid_until}
                          onChange={(e) => setFormData({ ...formData, valid_until: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Switch
                        id="is_active"
                        checked={formData.is_active}
                        onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                      />
                      <Label htmlFor="is_active">Активний</Label>
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
                      {editingCode ? 'Зберегти' : 'Створити'}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
          
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Пошук за кодом..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Код</TableHead>
              <TableHead>Знижка</TableHead>
              <TableHead>Використання</TableHead>
              <TableHead>Мін. замовлення</TableHead>
              <TableHead>Дійсний до</TableHead>
              <TableHead>Статус</TableHead>
              <TableHead className="text-right">Дії</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredCodes.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  Промокодів не знайдено
                </TableCell>
              </TableRow>
            ) : (
              filteredCodes.map((code) => (
                <TableRow key={code.id}>
                  <TableCell className="font-mono font-bold">{code.code}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{code.discount_percent}%</Badge>
                  </TableCell>
                  <TableCell>
                    {code.current_uses} / {code.max_uses || '∞'}
                  </TableCell>
                  <TableCell>{code.min_order_amount} ₴</TableCell>
                  <TableCell>
                    {code.valid_until 
                      ? format(new Date(code.valid_until), 'dd.MM.yyyy', { locale: uk })
                      : 'Безстроково'}
                  </TableCell>
                  <TableCell>
                    <Switch
                      checked={code.is_active}
                      onCheckedChange={(checked) => 
                        toggleActiveMutation.mutate({ id: code.id, is_active: checked })
                      }
                    />
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(code)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        if (confirm('Видалити цей промокод?')) {
                          deleteMutation.mutate(code.id);
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
      </CardContent>
    </Card>
  );
};

export default PromoCodeManagement;
