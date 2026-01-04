import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, Image, GripVertical, Loader2 } from 'lucide-react';

interface Banner {
  id: string;
  title: string;
  subtitle: string | null;
  image_url: string | null;
  link_url: string | null;
  link_text: string | null;
  badge_text: string | null;
  badge_color: string | null;
  background_gradient: string | null;
  is_active: boolean;
  display_order: number;
  start_date: string | null;
  end_date: string | null;
}

const GRADIENT_OPTIONS = [
  { value: 'from-orange-500 via-red-500 to-pink-500', label: 'Оранжево-рожевий' },
  { value: 'from-blue-600 via-purple-600 to-indigo-600', label: 'Синьо-фіолетовий' },
  { value: 'from-amber-500 via-yellow-500 to-orange-400', label: 'Жовто-оранжевий' },
  { value: 'from-pink-500 via-rose-500 to-red-500', label: 'Рожево-червоний' },
  { value: 'from-green-500 via-emerald-500 to-teal-500', label: 'Зелено-бірюзовий' },
  { value: 'from-gray-800 via-gray-700 to-gray-600', label: 'Темно-сірий' },
];

const BannerManagement = () => {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    subtitle: '',
    image_url: '',
    link_url: '',
    link_text: '',
    badge_text: '',
    badge_color: 'default',
    background_gradient: GRADIENT_OPTIONS[0].value,
    display_order: 0,
  });

  const { data: banners = [], isLoading } = useQuery({
    queryKey: ['admin-banners'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('homepage_banners')
        .select('*')
        .order('display_order', { ascending: true });

      if (error) throw error;
      return data as Banner[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const { error } = await supabase.from('homepage_banners').insert({
        title: data.title,
        subtitle: data.subtitle || null,
        image_url: data.image_url || null,
        link_url: data.link_url || null,
        link_text: data.link_text || null,
        badge_text: data.badge_text || null,
        badge_color: data.badge_color,
        background_gradient: data.background_gradient,
        display_order: data.display_order,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-banners'] });
      queryClient.invalidateQueries({ queryKey: ['homepage-banners'] });
      toast.success('Банер створено');
      handleCloseDialog();
    },
    onError: () => toast.error('Помилка створення банера'),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: typeof formData }) => {
      const { error } = await supabase.from('homepage_banners').update({
        title: data.title,
        subtitle: data.subtitle || null,
        image_url: data.image_url || null,
        link_url: data.link_url || null,
        link_text: data.link_text || null,
        badge_text: data.badge_text || null,
        badge_color: data.badge_color,
        background_gradient: data.background_gradient,
        display_order: data.display_order,
      }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-banners'] });
      queryClient.invalidateQueries({ queryKey: ['homepage-banners'] });
      toast.success('Банер оновлено');
      handleCloseDialog();
    },
    onError: () => toast.error('Помилка оновлення банера'),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('homepage_banners').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-banners'] });
      queryClient.invalidateQueries({ queryKey: ['homepage-banners'] });
      toast.success('Банер видалено');
    },
    onError: () => toast.error('Помилка видалення банера'),
  });

  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase.from('homepage_banners').update({ is_active }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-banners'] });
      queryClient.invalidateQueries({ queryKey: ['homepage-banners'] });
      toast.success('Статус оновлено');
    },
    onError: () => toast.error('Помилка оновлення статусу'),
  });

  const handleEdit = (banner: Banner) => {
    setEditingBanner(banner);
    setFormData({
      title: banner.title,
      subtitle: banner.subtitle || '',
      image_url: banner.image_url || '',
      link_url: banner.link_url || '',
      link_text: banner.link_text || '',
      badge_text: banner.badge_text || '',
      badge_color: banner.badge_color || 'default',
      background_gradient: banner.background_gradient || GRADIENT_OPTIONS[0].value,
      display_order: banner.display_order,
    });
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingBanner(null);
    setFormData({
      title: '',
      subtitle: '',
      image_url: '',
      link_url: '',
      link_text: '',
      badge_text: '',
      badge_color: 'default',
      background_gradient: GRADIENT_OPTIONS[0].value,
      display_order: banners.length,
    });
  };

  const handleSubmit = () => {
    if (!formData.title) {
      toast.error('Введіть заголовок');
      return;
    }

    if (editingBanner) {
      updateMutation.mutate({ id: editingBanner.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Image className="h-5 w-5" />
          Управління банерами
        </CardTitle>
        <Button onClick={() => setIsDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Додати банер
        </Button>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">#</TableHead>
              <TableHead>Заголовок</TableHead>
              <TableHead>Бейдж</TableHead>
              <TableHead>Посилання</TableHead>
              <TableHead>Статус</TableHead>
              <TableHead className="text-right">Дії</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {banners.map((banner, index) => (
              <TableRow key={banner.id}>
                <TableCell>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <GripVertical className="h-4 w-4" />
                    {index + 1}
                  </div>
                </TableCell>
                <TableCell>
                  <div>
                    <div className="font-medium">{banner.title}</div>
                    {banner.subtitle && (
                      <div className="text-sm text-muted-foreground truncate max-w-[200px]">
                        {banner.subtitle}
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  {banner.badge_text ? (
                    <Badge variant={banner.badge_color === 'destructive' ? 'destructive' : 'secondary'}>
                      {banner.badge_text}
                    </Badge>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </TableCell>
                <TableCell>
                  {banner.link_url ? (
                    <span className="text-sm text-primary">{banner.link_url}</span>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </TableCell>
                <TableCell>
                  <Switch
                    checked={banner.is_active}
                    onCheckedChange={(checked) =>
                      toggleActiveMutation.mutate({ id: banner.id, is_active: checked })
                    }
                  />
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleEdit(banner)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => deleteMutation.mutate(banner.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {banners.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                  Банери відсутні
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>
                {editingBanner ? 'Редагувати банер' : 'Створити банер'}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Заголовок *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="🎮 Літній розпродаж!"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="subtitle">Підзаголовок</Label>
                <Input
                  id="subtitle"
                  value={formData.subtitle}
                  onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                  placeholder="Знижки до 50% на всі товари"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="badge_text">Бейдж</Label>
                  <Input
                    id="badge_text"
                    value={formData.badge_text}
                    onChange={(e) => setFormData({ ...formData, badge_text: e.target.value })}
                    placeholder="-50%"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Колір бейджу</Label>
                  <Select
                    value={formData.badge_color}
                    onValueChange={(value) => setFormData({ ...formData, badge_color: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="default">Основний</SelectItem>
                      <SelectItem value="secondary">Вторинний</SelectItem>
                      <SelectItem value="destructive">Червоний</SelectItem>
                      <SelectItem value="outline">Контурний</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Градієнт фону</Label>
                <Select
                  value={formData.background_gradient}
                  onValueChange={(value) => setFormData({ ...formData, background_gradient: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {GRADIENT_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        <div className="flex items-center gap-2">
                          <div className={`w-4 h-4 rounded bg-gradient-to-r ${option.value}`} />
                          {option.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="image_url">URL зображення (опціонально)</Label>
                <Input
                  id="image_url"
                  value={formData.image_url}
                  onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                  placeholder="https://..."
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="link_url">Посилання</Label>
                  <Input
                    id="link_url"
                    value={formData.link_url}
                    onChange={(e) => setFormData({ ...formData, link_url: e.target.value })}
                    placeholder="/products"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="link_text">Текст кнопки</Label>
                  <Input
                    id="link_text"
                    value={formData.link_text}
                    onChange={(e) => setFormData({ ...formData, link_text: e.target.value })}
                    placeholder="До товарів"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="display_order">Порядок відображення</Label>
                <Input
                  id="display_order"
                  type="number"
                  value={formData.display_order}
                  onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) || 0 })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={handleCloseDialog}>
                Скасувати
              </Button>
              <Button onClick={handleSubmit}>
                {editingBanner ? 'Зберегти' : 'Створити'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};

export default BannerManagement;
