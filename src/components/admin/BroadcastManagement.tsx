import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Send, Plus, Mail, Bell, FileText, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/components/auth/AuthProvider';

interface Template {
  id: string;
  name: string;
  subject: string | null;
  body: string;
  type: string;
}

interface Broadcast {
  id: string;
  title: string;
  message: string;
  type: string;
  target_audience: string;
  status: string;
  sent_count: number;
  failed_count: number;
  created_at: string;
  sent_at: string | null;
}

const BroadcastManagement = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isTemplateOpen, setIsTemplateOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    type: 'push' as 'email' | 'push' | 'both',
    target_audience: 'all' as 'all' | 'veterans' | 'admins' | 'active_users',
  });
  const [templateForm, setTemplateForm] = useState({
    name: '',
    subject: '',
    body: '',
    type: 'push' as 'email' | 'push' | 'ticket_reply',
  });

  const { data: broadcasts, isLoading: loadingBroadcasts } = useQuery({
    queryKey: ['broadcasts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('broadcast_messages')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as Broadcast[];
    },
  });

  const { data: templates, isLoading: loadingTemplates } = useQuery({
    queryKey: ['message-templates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('message_templates')
        .select('*')
        .order('name');
      if (error) throw error;
      return data as Template[];
    },
  });

  const createBroadcastMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const { error } = await supabase.from('broadcast_messages').insert({
        admin_id: user?.id,
        ...data,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['broadcasts'] });
      toast.success('Розсилку створено');
      setIsCreateOpen(false);
      setFormData({ title: '', message: '', type: 'push', target_audience: 'all' });
    },
    onError: (error) => toast.error('Помилка: ' + error.message),
  });

  const sendBroadcastMutation = useMutation({
    mutationFn: async (broadcastId: string) => {
      const { error } = await supabase.functions.invoke('send-broadcast', {
        body: { broadcastId },
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['broadcasts'] });
      toast.success('Розсилку відправлено');
    },
    onError: (error) => toast.error('Помилка: ' + error.message),
  });

  const createTemplateMutation = useMutation({
    mutationFn: async (data: typeof templateForm) => {
      const { error } = await supabase.from('message_templates').insert(data);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['message-templates'] });
      toast.success('Шаблон створено');
      setIsTemplateOpen(false);
      setTemplateForm({ name: '', subject: '', body: '', type: 'push' });
    },
    onError: (error) => toast.error('Помилка: ' + error.message),
  });

  const deleteTemplateMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('message_templates').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['message-templates'] });
      toast.success('Шаблон видалено');
    },
  });

  const applyTemplate = (template: Template) => {
    setFormData(prev => ({
      ...prev,
      title: template.subject || template.name,
      message: template.body,
      type: template.type === 'email' ? 'email' : 'push',
    }));
    toast.success('Шаблон застосовано');
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      draft: 'bg-muted',
      sending: 'bg-blue-500/20 text-blue-600',
      sent: 'bg-green-500/20 text-green-600',
      failed: 'bg-red-500/20 text-red-600',
    };
    const labels: Record<string, string> = {
      draft: 'Чернетка',
      sending: 'Відправляється',
      sent: 'Відправлено',
      failed: 'Помилка',
    };
    return <Badge className={styles[status]}>{labels[status]}</Badge>;
  };

  const getTypeBadge = (type: string) => {
    const icons: Record<string, React.ReactNode> = {
      email: <Mail className="h-3 w-3" />,
      push: <Bell className="h-3 w-3" />,
      both: <><Mail className="h-3 w-3" /><Bell className="h-3 w-3" /></>,
    };
    return (
      <Badge variant="outline" className="flex items-center gap-1">
        {icons[type]}
        {type === 'both' ? 'Email + Push' : type.toUpperCase()}
      </Badge>
    );
  };

  if (loadingBroadcasts) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Tabs defaultValue="broadcasts" className="space-y-6">
      <TabsList>
        <TabsTrigger value="broadcasts" className="flex items-center gap-2">
          <Send className="h-4 w-4" />
          Розсилки
        </TabsTrigger>
        <TabsTrigger value="templates" className="flex items-center gap-2">
          <FileText className="h-4 w-4" />
          Шаблони
        </TabsTrigger>
      </TabsList>

      <TabsContent value="broadcasts">
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Send className="h-5 w-5" />
                  Масові розсилки
                </CardTitle>
                <CardDescription>Email та Push-сповіщення для користувачів</CardDescription>
              </div>
              <Button onClick={() => setIsCreateOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Нова розсилка
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Заголовок</TableHead>
                  <TableHead>Тип</TableHead>
                  <TableHead>Аудиторія</TableHead>
                  <TableHead>Статус</TableHead>
                  <TableHead>Відправлено</TableHead>
                  <TableHead className="text-right">Дії</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {broadcasts?.map((broadcast) => (
                  <TableRow key={broadcast.id}>
                    <TableCell className="font-medium">{broadcast.title}</TableCell>
                    <TableCell>{getTypeBadge(broadcast.type)}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{broadcast.target_audience}</Badge>
                    </TableCell>
                    <TableCell>{getStatusBadge(broadcast.status)}</TableCell>
                    <TableCell>
                      {broadcast.sent_count > 0 && (
                        <span className="text-sm">
                          ✓ {broadcast.sent_count}
                          {broadcast.failed_count > 0 && (
                            <span className="text-destructive"> / ✗ {broadcast.failed_count}</span>
                          )}
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {broadcast.status === 'draft' && (
                        <Button
                          size="sm"
                          onClick={() => sendBroadcastMutation.mutate(broadcast.id)}
                          disabled={sendBroadcastMutation.isPending}
                        >
                          <Send className="h-4 w-4 mr-1" />
                          Відправити
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="templates">
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Шаблони повідомлень
                </CardTitle>
                <CardDescription>Готові шаблони для швидкої розсилки</CardDescription>
              </div>
              <Button onClick={() => setIsTemplateOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Новий шаблон
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {templates?.map((template) => (
                <Card key={template.id} className="cursor-pointer hover:border-primary transition-colors">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-base">{template.name}</CardTitle>
                      <Badge variant="outline">{template.type}</Badge>
                    </div>
                    {template.subject && (
                      <CardDescription>{template.subject}</CardDescription>
                    )}
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground line-clamp-3 mb-4">
                      {template.body}
                    </p>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => applyTemplate(template)}>
                        Використати
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-destructive"
                        onClick={() => deleteTemplateMutation.mutate(template.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      {/* Create Broadcast Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Нова розсилка</DialogTitle>
            <DialogDescription>Створіть повідомлення для масової розсилки</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Заголовок</Label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Заголовок повідомлення"
              />
            </div>
            <div className="space-y-2">
              <Label>Повідомлення</Label>
              <Textarea
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                placeholder="Текст повідомлення..."
                rows={5}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Тип розсилки</Label>
                <Select value={formData.type} onValueChange={(v: any) => setFormData({ ...formData, type: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="push">Push-сповіщення</SelectItem>
                    <SelectItem value="email">Email</SelectItem>
                    <SelectItem value="both">Email + Push</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Аудиторія</Label>
                <Select value={formData.target_audience} onValueChange={(v: any) => setFormData({ ...formData, target_audience: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Всі користувачі</SelectItem>
                    <SelectItem value="veterans">Ветерани</SelectItem>
                    <SelectItem value="active_users">Активні (з покупками)</SelectItem>
                    <SelectItem value="admins">Адміністратори</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Скасувати</Button>
            <Button
              onClick={() => createBroadcastMutation.mutate(formData)}
              disabled={createBroadcastMutation.isPending || !formData.title || !formData.message}
            >
              {createBroadcastMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Створити
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Template Dialog */}
      <Dialog open={isTemplateOpen} onOpenChange={setIsTemplateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Новий шаблон</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Назва шаблону</Label>
              <Input
                value={templateForm.name}
                onChange={(e) => setTemplateForm({ ...templateForm, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Тема (для email)</Label>
              <Input
                value={templateForm.subject}
                onChange={(e) => setTemplateForm({ ...templateForm, subject: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Текст шаблону</Label>
              <Textarea
                value={templateForm.body}
                onChange={(e) => setTemplateForm({ ...templateForm, body: e.target.value })}
                rows={5}
                placeholder="Використовуйте {{username}}, {{message}} для змінних"
              />
            </div>
            <div className="space-y-2">
              <Label>Тип</Label>
              <Select value={templateForm.type} onValueChange={(v: any) => setTemplateForm({ ...templateForm, type: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="push">Push</SelectItem>
                  <SelectItem value="ticket_reply">Відповідь на тікет</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsTemplateOpen(false)}>Скасувати</Button>
            <Button
              onClick={() => createTemplateMutation.mutate(templateForm)}
              disabled={createTemplateMutation.isPending || !templateForm.name || !templateForm.body}
            >
              Створити
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Tabs>
  );
};

export default BroadcastManagement;
