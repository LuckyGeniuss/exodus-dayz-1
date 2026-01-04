import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/AuthProvider';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { Newspaper, Plus, Trash2, Loader2, Eye, Pin, Edit } from 'lucide-react';
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
import { format } from 'date-fns';
import { uk } from 'date-fns/locale';

interface NewsPost {
  id: string;
  title: string;
  content: string;
  summary: string | null;
  image: string | null;
  category: string;
  is_published: boolean;
  is_pinned: boolean;
  author_id: string;
  published_at: string | null;
  created_at: string;
}

const categories = [
  { value: 'update', label: 'Оновлення' },
  { value: 'event', label: 'Подія' },
  { value: 'promo', label: 'Акція' },
  { value: 'news', label: 'Новина' },
  { value: 'announcement', label: 'Анонс' }
];

const NewsManagement = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [showDialog, setShowDialog] = useState(false);
  const [selectedPost, setSelectedPost] = useState<NewsPost | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    summary: '',
    image: '',
    category: 'update',
    is_published: false,
    is_pinned: false
  });

  // Fetch news
  const { data: news = [], isLoading } = useQuery({
    queryKey: ['admin-news'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('news_posts')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as NewsPost[];
    }
  });

  // Create/Update mutation
  const saveMutation = useMutation({
    mutationFn: async (isEdit: boolean) => {
      const postData = {
        title: formData.title,
        content: formData.content,
        summary: formData.summary || null,
        image: formData.image || null,
        category: formData.category,
        is_published: formData.is_published,
        is_pinned: formData.is_pinned,
        author_id: user?.id,
        published_at: formData.is_published ? new Date().toISOString() : null
      };

      if (isEdit && selectedPost) {
        const { error } = await supabase
          .from('news_posts')
          .update(postData)
          .eq('id', selectedPost.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('news_posts')
          .insert(postData);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-news'] });
      toast.success(selectedPost ? 'Новину оновлено' : 'Новину створено');
      resetForm();
    },
    onError: () => {
      toast.error('Помилка збереження');
    }
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('news_posts')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-news'] });
      toast.success('Новину видалено');
    }
  });

  // Toggle publish mutation
  const togglePublishMutation = useMutation({
    mutationFn: async ({ id, is_published }: { id: string; is_published: boolean }) => {
      const { error } = await supabase
        .from('news_posts')
        .update({ 
          is_published,
          published_at: is_published ? new Date().toISOString() : null
        })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-news'] });
      toast.success('Статус оновлено');
    }
  });

  const resetForm = () => {
    setFormData({
      title: '',
      content: '',
      summary: '',
      image: '',
      category: 'update',
      is_published: false,
      is_pinned: false
    });
    setSelectedPost(null);
    setShowDialog(false);
  };

  const openEditDialog = (post: NewsPost) => {
    setSelectedPost(post);
    setFormData({
      title: post.title,
      content: post.content,
      summary: post.summary || '',
      image: post.image || '',
      category: post.category,
      is_published: post.is_published,
      is_pinned: post.is_pinned
    });
    setShowDialog(true);
  };

  const getCategoryLabel = (category: string) => {
    return categories.find(c => c.value === category)?.label || category;
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
              <Newspaper className="h-6 w-6" />
              Управління новинами
            </CardTitle>
            <CardDescription>
              Публікуйте новини, оновлення та анонси
            </CardDescription>
          </div>
          <Dialog open={showDialog} onOpenChange={(open) => { if (!open) resetForm(); else setShowDialog(true); }}>
            <DialogTrigger asChild>
              <Button onClick={() => setShowDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Нова новина
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {selectedPost ? 'Редагувати новину' : 'Створити новину'}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label>Заголовок</Label>
                  <Input
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Заголовок новини"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Короткий опис</Label>
                  <Input
                    value={formData.summary}
                    onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
                    placeholder="Короткий опис для списку"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Контент</Label>
                  <Textarea
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    placeholder="Повний текст новини..."
                    rows={8}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Категорія</Label>
                    <Select
                      value={formData.category}
                      onValueChange={(value) => setFormData({ ...formData, category: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((cat) => (
                          <SelectItem key={cat.value} value={cat.value}>
                            {cat.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>URL зображення</Label>
                    <Input
                      value={formData.image}
                      onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                      placeholder="https://..."
                    />
                  </div>
                </div>

                <div className="flex gap-6">
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={formData.is_published}
                      onCheckedChange={(checked) => setFormData({ ...formData, is_published: checked })}
                    />
                    <Label>Опублікувати</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={formData.is_pinned}
                      onCheckedChange={(checked) => setFormData({ ...formData, is_pinned: checked })}
                    />
                    <Label>Закріпити</Label>
                  </div>
                </div>

                <Button
                  onClick={() => saveMutation.mutate(!!selectedPost)}
                  disabled={saveMutation.isPending || !formData.title || !formData.content}
                  className="w-full"
                >
                  {saveMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  {selectedPost ? 'Зберегти зміни' : 'Створити новину'}
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
              <TableHead>Заголовок</TableHead>
              <TableHead>Категорія</TableHead>
              <TableHead>Статус</TableHead>
              <TableHead>Дата</TableHead>
              <TableHead className="text-right">Дії</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {news.map((post) => (
              <TableRow key={post.id}>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {post.is_pinned && <Pin className="h-4 w-4 text-yellow-500" />}
                    <span className="font-medium line-clamp-1">{post.title}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="secondary">
                    {getCategoryLabel(post.category)}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Switch
                    checked={post.is_published}
                    onCheckedChange={(checked) => 
                      togglePublishMutation.mutate({ id: post.id, is_published: checked })
                    }
                  />
                </TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  {format(new Date(post.created_at), 'dd MMM yyyy', { locale: uk })}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => openEditDialog(post)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteMutation.mutate(post.id)}
                      disabled={deleteMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {news.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                  Новин поки немає. Створіть першу!
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default NewsManagement;
