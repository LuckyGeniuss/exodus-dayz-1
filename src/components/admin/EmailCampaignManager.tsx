import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Plus, Mail, Send, Users, Clock, CheckCircle, ShoppingCart, Star, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { format } from 'date-fns';
import { uk } from 'date-fns/locale';

const CAMPAIGN_TRIGGERS = [
  { value: 'abandoned_cart', label: 'Покинутий кошик', icon: ShoppingCart, description: 'Нагадування про товари в кошику' },
  { value: 'inactive_7d', label: 'Неактивний 7 днів', icon: Clock, description: 'Користувачі без замовлень 7+ днів' },
  { value: 'inactive_30d', label: 'Неактивний 30 днів', icon: Clock, description: 'Користувачі без замовлень 30+ днів' },
  { value: 'first_purchase', label: 'Перша покупка', icon: Star, description: 'Привітання з першим замовленням' },
  { value: 'birthday', label: 'День народження', icon: Calendar, description: 'Привітання з днем народження' },
  { value: 'manual', label: 'Ручна розсилка', icon: Send, description: 'Одноразова кампанія' }
];

const EmailCampaignManager = () => {
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [newCampaign, setNewCampaign] = useState({
    name: '',
    subject: '',
    body: '',
    trigger: 'abandoned_cart',
    delay_hours: 24
  });

  // Fetch campaigns from message_templates
  const { data: campaigns, isLoading } = useQuery({
    queryKey: ['email-campaigns'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('message_templates')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    }
  });

  // Fetch campaign stats
  const { data: stats } = useQuery({
    queryKey: ['campaign-stats'],
    queryFn: async () => {
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      
      // Get abandoned cart items count
      const { data: cartItems } = await supabase
        .from('cart_items')
        .select('user_id')
        .lt('added_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

      const abandonedCarts = new Set(cartItems?.map(c => c.user_id) || []).size;

      // Get broadcast stats
      const { data: broadcasts } = await supabase
        .from('broadcast_messages')
        .select('sent_count, failed_count, status')
        .gte('created_at', sevenDaysAgo);

      const totalSent = broadcasts?.reduce((sum, b) => sum + (b.sent_count || 0), 0) || 0;
      const totalFailed = broadcasts?.reduce((sum, b) => sum + (b.failed_count || 0), 0) || 0;

      return {
        abandonedCarts,
        totalSent,
        totalFailed,
        campaigns: campaigns?.length || 0
      };
    }
  });

  const createCampaignMutation = useMutation({
    mutationFn: async (campaign: typeof newCampaign) => {
      const { error } = await supabase
        .from('message_templates')
        .insert({
          name: campaign.name,
          type: campaign.trigger,
          subject: campaign.subject,
          body: campaign.body
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email-campaigns'] });
      toast.success('Кампанію створено');
      setIsOpen(false);
      setNewCampaign({
        name: '',
        subject: '',
        body: '',
        trigger: 'abandoned_cart',
        delay_hours: 24
      });
    },
    onError: (error) => {
      toast.error('Помилка створення кампанії');
      console.error(error);
    }
  });

  const sendCampaignMutation = useMutation({
    mutationFn: async (templateId: string) => {
      const template = campaigns?.find(c => c.id === templateId);
      if (!template) throw new Error('Template not found');

      // Create broadcast message
      const { data: { user } } = await supabase.auth.getUser();
      
      const { data: broadcast, error } = await supabase
        .from('broadcast_messages')
        .insert({
          admin_id: user?.id,
          title: template.subject || template.name,
          message: template.body,
          type: 'email',
          target_audience: template.type === 'abandoned_cart' ? 'active' : 'all',
          status: 'pending'
        })
        .select()
        .single();

      if (error) throw error;

      // Trigger send
      const { error: sendError } = await supabase.functions.invoke('send-broadcast', {
        body: { broadcastId: broadcast.id }
      });

      if (sendError) throw sendError;
      return broadcast;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email-campaigns', 'campaign-stats'] });
      toast.success('Кампанію запущено');
    },
    onError: (error) => {
      toast.error('Помилка запуску кампанії');
      console.error(error);
    }
  });

  const deleteCampaignMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('message_templates')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email-campaigns'] });
      toast.success('Кампанію видалено');
    }
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <ShoppingCart className="h-4 w-4" />
              Покинутих кошиків
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.abandonedCarts || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Активних кампаній
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{campaigns?.length || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Send className="h-4 w-4 text-green-500" />
              Надіслано (7д)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">{stats?.totalSent || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="h-4 w-4" />
              Помилок
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{stats?.totalFailed || 0}</div>
          </CardContent>
        </Card>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Email кампанії</h2>
          <p className="text-muted-foreground">Автоматичні та ручні email розсилки</p>
        </div>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Нова кампанія
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Створити email кампанію</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Назва кампанії</Label>
                <Input
                  value={newCampaign.name}
                  onChange={(e) => setNewCampaign({ ...newCampaign, name: e.target.value })}
                  placeholder="Нагадування про кошик"
                />
              </div>
              
              <div>
                <Label>Тригер</Label>
                <Select
                  value={newCampaign.trigger}
                  onValueChange={(value) => setNewCampaign({ ...newCampaign, trigger: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CAMPAIGN_TRIGGERS.map((trigger) => (
                      <SelectItem key={trigger.value} value={trigger.value}>
                        <div className="flex items-center gap-2">
                          <trigger.icon className="h-4 w-4" />
                          <span>{trigger.label}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-1">
                  {CAMPAIGN_TRIGGERS.find(t => t.value === newCampaign.trigger)?.description}
                </p>
              </div>

              <div>
                <Label>Тема листа</Label>
                <Input
                  value={newCampaign.subject}
                  onChange={(e) => setNewCampaign({ ...newCampaign, subject: e.target.value })}
                  placeholder="Ви забули товари в кошику!"
                />
              </div>

              <div>
                <Label>Текст листа (підтримує HTML)</Label>
                <Textarea
                  value={newCampaign.body}
                  onChange={(e) => setNewCampaign({ ...newCampaign, body: e.target.value })}
                  placeholder="<h1>Привіт!</h1><p>У вашому кошику залишились товари...</p>"
                  rows={6}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Змінні: {'{username}'}, {'{cart_items}'}, {'{total}'}, {'{shop_url}'}
                </p>
              </div>

              {newCampaign.trigger !== 'manual' && (
                <div>
                  <Label>Затримка (годин)</Label>
                  <Input
                    type="number"
                    value={newCampaign.delay_hours}
                    onChange={(e) => setNewCampaign({ ...newCampaign, delay_hours: parseInt(e.target.value) })}
                    min={1}
                    max={168}
                  />
                </div>
              )}

              <Button 
                onClick={() => createCampaignMutation.mutate(newCampaign)}
                disabled={!newCampaign.name || !newCampaign.subject || createCampaignMutation.isPending}
                className="w-full"
              >
                {createCampaignMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Створити кампанію
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Campaigns List */}
      <div className="grid gap-4">
        {campaigns && campaigns.length > 0 ? (
          campaigns.map((campaign) => {
            const triggerInfo = CAMPAIGN_TRIGGERS.find(t => t.value === campaign.type);
            const TriggerIcon = triggerInfo?.icon || Mail;

            return (
              <Card key={campaign.id}>
                <CardContent className="py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <TriggerIcon className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold">{campaign.name}</h3>
                        <p className="text-sm text-muted-foreground">{campaign.subject}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline">{triggerInfo?.label || campaign.type}</Badge>
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(campaign.created_at), 'dd.MM.yyyy', { locale: uk })}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => sendCampaignMutation.mutate(campaign.id)}
                        disabled={sendCampaignMutation.isPending}
                      >
                        {sendCampaignMutation.isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <>
                            <Send className="h-4 w-4 mr-1" />
                            Запустити
                          </>
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteCampaignMutation.mutate(campaign.id)}
                      >
                        Видалити
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <Mail className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">Немає email кампаній</h3>
              <p className="text-muted-foreground mb-4">
                Створіть першу кампанію для автоматичних email розсилок
              </p>
              <Button onClick={() => setIsOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Створити кампанію
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default EmailCampaignManager;
