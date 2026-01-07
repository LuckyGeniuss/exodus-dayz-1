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
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, Image, GripVertical, Loader2, Eye, ArrowUp, ArrowDown } from 'lucide-react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

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

// Sortable Row Component
const SortableBannerRow = ({ 
  banner, 
  index, 
  onEdit, 
  onDelete, 
  onToggleActive, 
  onPreview 
}: { 
  banner: Banner; 
  index: number;
  onEdit: (banner: Banner) => void;
  onDelete: (id: string) => void;
  onToggleActive: (id: string, is_active: boolean) => void;
  onPreview: (banner: Banner) => void;
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: banner.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-4 p-3 border rounded-lg bg-card ${isDragging ? 'shadow-lg' : ''}`}
    >
      <div
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing p-1 text-muted-foreground hover:text-foreground"
      >
        <GripVertical className="h-5 w-5" />
      </div>
      
      <div className="text-sm font-medium text-muted-foreground w-8">
        {index + 1}
      </div>

      {/* Thumbnail */}
      <div className="w-20 h-12 rounded overflow-hidden bg-muted flex-shrink-0">
        {banner.image_url ? (
          <img src={banner.image_url} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className={`w-full h-full bg-gradient-to-r ${banner.background_gradient || 'from-gray-600 to-gray-800'}`} />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="font-medium truncate">{banner.title}</div>
        {banner.subtitle && (
          <div className="text-sm text-muted-foreground truncate">{banner.subtitle}</div>
        )}
      </div>

      {banner.badge_text && (
        <Badge variant={banner.badge_color === 'destructive' ? 'destructive' : 'secondary'}>
          {banner.badge_text}
        </Badge>
      )}

      <div className="text-sm text-muted-foreground truncate max-w-[150px]">
        {banner.link_url || '—'}
      </div>

      <Switch
        checked={banner.is_active}
        onCheckedChange={(checked) => onToggleActive(banner.id, checked)}
      />

      <div className="flex gap-1">
        <Button variant="ghost" size="icon" onClick={() => onPreview(banner)} title="Попередній перегляд">
          <Eye className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" onClick={() => onEdit(banner)}>
          <Pencil className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" onClick={() => onDelete(banner.id)}>
          <Trash2 className="h-4 w-4 text-destructive" />
        </Button>
      </div>
    </div>
  );
};

const BannerManagement = () => {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewBanner, setPreviewBanner] = useState<Banner | null>(null);
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

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

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

  const reorderMutation = useMutation({
    mutationFn: async (orderedBanners: { id: string; display_order: number }[]) => {
      for (const banner of orderedBanners) {
        const { error } = await supabase
          .from('homepage_banners')
          .update({ display_order: banner.display_order })
          .eq('id', banner.id);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-banners'] });
      queryClient.invalidateQueries({ queryKey: ['homepage-banners'] });
      toast.success('Порядок оновлено');
    },
    onError: () => toast.error('Помилка оновлення порядку'),
  });

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (over && active.id !== over.id) {
      const oldIndex = banners.findIndex(b => b.id === active.id);
      const newIndex = banners.findIndex(b => b.id === over.id);
      
      const newOrder = arrayMove(banners, oldIndex, newIndex);
      
      // Update local state optimistically
      queryClient.setQueryData(['admin-banners'], newOrder);
      
      // Save to database
      reorderMutation.mutate(
        newOrder.map((b, i) => ({ id: b.id, display_order: i }))
      );
    }
  };

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

  const handlePreview = (banner: Banner) => {
    setPreviewBanner(banner);
    setIsPreviewOpen(true);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <>
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
          <p className="text-sm text-muted-foreground mb-4">
            Перетягуйте банери для зміни порядку відображення
          </p>
          
          {banners.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              Банери відсутні
            </div>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={banners.map(b => b.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-2">
                  {banners.map((banner, index) => (
                    <SortableBannerRow
                      key={banner.id}
                      banner={banner}
                      index={index}
                      onEdit={handleEdit}
                      onDelete={(id) => deleteMutation.mutate(id)}
                      onToggleActive={(id, is_active) => toggleActiveMutation.mutate({ id, is_active })}
                      onPreview={handlePreview}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          )}

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>
                  {editingBanner ? 'Редагувати банер' : 'Створити банер'}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 max-h-[60vh] overflow-y-auto">
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
                  <Label htmlFor="image_url">URL зображення</Label>
                  <Input
                    id="image_url"
                    value={formData.image_url}
                    onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                    placeholder="/banners/my-banner.jpg"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="link_url">Посилання</Label>
                    <Input
                      id="link_url"
                      value={formData.link_url}
                      onChange={(e) => setFormData({ ...formData, link_url: e.target.value })}
                      placeholder="/bundles"
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

      {/* Preview Dialog */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-4xl p-0 overflow-hidden">
          <DialogHeader className="p-4 border-b">
            <DialogTitle>Попередній перегляд банера</DialogTitle>
          </DialogHeader>
          {previewBanner && (
            <div className="relative h-[400px] overflow-hidden">
              {previewBanner.image_url ? (
                <img 
                  src={previewBanner.image_url} 
                  alt={previewBanner.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className={`w-full h-full bg-gradient-to-r ${previewBanner.background_gradient || 'from-gray-600 to-gray-800'}`} />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-8">
                {previewBanner.badge_text && (
                  <Badge className="mb-4" variant={previewBanner.badge_color === 'destructive' ? 'destructive' : 'default'}>
                    {previewBanner.badge_text}
                  </Badge>
                )}
                <h2 className="text-4xl font-bold text-white mb-2">{previewBanner.title}</h2>
                {previewBanner.subtitle && (
                  <p className="text-xl text-white/80 mb-4">{previewBanner.subtitle}</p>
                )}
                {previewBanner.link_text && (
                  <Button size="lg">
                    {previewBanner.link_text}
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default BannerManagement;
