import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, MessageSquare, Send, User, Shield, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/components/auth/AuthProvider';

interface Ticket {
  id: string;
  user_id: string;
  subject: string;
  status: string;
  priority: string;
  created_at: string;
  updated_at: string;
  username?: string;
}

interface TicketMessage {
  id: string;
  ticket_id: string;
  sender_id: string;
  message: string;
  is_admin: boolean;
  created_at: string;
  sender_username?: string;
}

const STATUS_CONFIG: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  open: { label: 'Відкритий', icon: <AlertCircle className="h-3 w-3" />, color: 'bg-blue-500/20 text-blue-600' },
  in_progress: { label: 'В роботі', icon: <Clock className="h-3 w-3" />, color: 'bg-amber-500/20 text-amber-600' },
  resolved: { label: 'Вирішено', icon: <CheckCircle className="h-3 w-3" />, color: 'bg-green-500/20 text-green-600' },
  closed: { label: 'Закритий', icon: <XCircle className="h-3 w-3" />, color: 'bg-muted' },
};

const PRIORITY_CONFIG: Record<string, { label: string; color: string }> = {
  low: { label: 'Низький', color: 'bg-muted' },
  medium: { label: 'Середній', color: 'bg-blue-500/20 text-blue-600' },
  high: { label: 'Високий', color: 'bg-amber-500/20 text-amber-600' },
  urgent: { label: 'Терміновий', color: 'bg-red-500/20 text-red-600' },
};

const SupportTicketManagement = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [replyMessage, setReplyMessage] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: tickets, isLoading } = useQuery({
    queryKey: ['admin-tickets', statusFilter],
    queryFn: async () => {
      let query = supabase
        .from('support_tickets')
        .select('*')
        .order('created_at', { ascending: false });

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      const { data: ticketsData, error } = await query;
      if (error) throw error;

      // Get usernames
      const userIds = [...new Set(ticketsData?.map(t => t.user_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, username')
        .in('id', userIds);

      const profilesMap = new Map(profiles?.map(p => [p.id, p.username]));

      return ticketsData?.map(t => ({
        ...t,
        username: profilesMap.get(t.user_id) || 'Unknown',
      })) as Ticket[];
    },
  });

  const { data: messages, refetch: refetchMessages } = useQuery({
    queryKey: ['ticket-messages', selectedTicket?.id],
    queryFn: async () => {
      if (!selectedTicket) return [];

      const { data: messagesData, error } = await supabase
        .from('ticket_messages')
        .select('*')
        .eq('ticket_id', selectedTicket.id)
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Get sender usernames
      const senderIds = [...new Set(messagesData?.map(m => m.sender_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, username')
        .in('id', senderIds);

      const profilesMap = new Map(profiles?.map(p => [p.id, p.username]));

      return messagesData?.map(m => ({
        ...m,
        sender_username: profilesMap.get(m.sender_id) || 'Unknown',
      })) as TicketMessage[];
    },
    enabled: !!selectedTicket,
  });

  // Realtime subscription for messages
  useEffect(() => {
    if (!selectedTicket) return;

    const channel = supabase
      .channel(`ticket-${selectedTicket.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'ticket_messages',
          filter: `ticket_id=eq.${selectedTicket.id}`,
        },
        () => {
          refetchMessages();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedTicket, refetchMessages]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendReplyMutation = useMutation({
    mutationFn: async () => {
      if (!selectedTicket || !replyMessage.trim()) return;

      const { error } = await supabase.from('ticket_messages').insert({
        ticket_id: selectedTicket.id,
        sender_id: user?.id,
        message: replyMessage,
        is_admin: true,
      });

      if (error) throw error;

      // Update ticket status if it's open
      if (selectedTicket.status === 'open') {
        await supabase
          .from('support_tickets')
          .update({ status: 'in_progress', updated_at: new Date().toISOString() })
          .eq('id', selectedTicket.id);
      }
    },
    onSuccess: () => {
      setReplyMessage('');
      refetchMessages();
      queryClient.invalidateQueries({ queryKey: ['admin-tickets'] });
      toast.success('Відповідь надіслано');
    },
    onError: (error) => toast.error('Помилка: ' + error.message),
  });

  const updateStatusMutation = useMutation({
    mutationFn: async (status: string) => {
      if (!selectedTicket) return;

      const updateData: any = { status, updated_at: new Date().toISOString() };
      if (status === 'closed') {
        updateData.closed_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('support_tickets')
        .update(updateData)
        .eq('id', selectedTicket.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-tickets'] });
      toast.success('Статус оновлено');
    },
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const openTicketsCount = tickets?.filter(t => t.status === 'open').length || 0;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Tickets List */}
      <Card className="lg:col-span-1">
        <CardHeader className="pb-3">
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Тікети
              {openTicketsCount > 0 && (
                <Badge variant="destructive">{openTicketsCount}</Badge>
              )}
            </CardTitle>
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Фільтр" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Всі</SelectItem>
              <SelectItem value="open">Відкриті</SelectItem>
              <SelectItem value="in_progress">В роботі</SelectItem>
              <SelectItem value="resolved">Вирішені</SelectItem>
              <SelectItem value="closed">Закриті</SelectItem>
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-[500px]">
            {tickets?.map((ticket) => (
              <div
                key={ticket.id}
                onClick={() => setSelectedTicket(ticket)}
                className={`p-4 border-b cursor-pointer hover:bg-muted/50 transition-colors ${
                  selectedTicket?.id === ticket.id ? 'bg-muted' : ''
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <span className="font-medium truncate flex-1">{ticket.subject}</span>
                  <Badge className={PRIORITY_CONFIG[ticket.priority].color}>
                    {PRIORITY_CONFIG[ticket.priority].label}
                  </Badge>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">{ticket.username}</span>
                  <Badge className={STATUS_CONFIG[ticket.status].color}>
                    {STATUS_CONFIG[ticket.status].icon}
                    <span className="ml-1">{STATUS_CONFIG[ticket.status].label}</span>
                  </Badge>
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  {new Date(ticket.created_at).toLocaleString('uk-UA')}
                </div>
              </div>
            ))}
            {tickets?.length === 0 && (
              <div className="p-8 text-center text-muted-foreground">
                Тікетів не знайдено
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Chat Area */}
      <Card className="lg:col-span-2">
        {selectedTicket ? (
          <>
            <CardHeader className="border-b">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle>{selectedTicket.subject}</CardTitle>
                  <CardDescription className="flex items-center gap-2 mt-1">
                    <User className="h-4 w-4" />
                    {selectedTicket.username}
                  </CardDescription>
                </div>
                <Select
                  value={selectedTicket.status}
                  onValueChange={(v) => {
                    updateStatusMutation.mutate(v);
                    setSelectedTicket({ ...selectedTicket, status: v });
                  }}
                >
                  <SelectTrigger className="w-[150px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(STATUS_CONFIG).map(([key, config]) => (
                      <SelectItem key={key} value={key}>
                        <div className="flex items-center gap-2">
                          {config.icon}
                          {config.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent className="p-0 flex flex-col h-[400px]">
              <ScrollArea className="flex-1 p-4">
                <div className="space-y-4">
                  {messages?.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.is_admin ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[70%] rounded-lg p-3 ${
                          msg.is_admin
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted'
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          {msg.is_admin ? (
                            <Shield className="h-3 w-3" />
                          ) : (
                            <User className="h-3 w-3" />
                          )}
                          <span className="text-xs font-medium">
                            {msg.sender_username}
                          </span>
                        </div>
                        <p className="text-sm whitespace-pre-wrap">{msg.message}</p>
                        <div className="text-xs opacity-70 mt-1">
                          {new Date(msg.created_at).toLocaleTimeString('uk-UA')}
                        </div>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>
              <div className="p-4 border-t">
                <div className="flex gap-2">
                  <Textarea
                    value={replyMessage}
                    onChange={(e) => setReplyMessage(e.target.value)}
                    placeholder="Введіть відповідь..."
                    className="min-h-[60px]"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        sendReplyMutation.mutate();
                      }
                    }}
                  />
                  <Button
                    onClick={() => sendReplyMutation.mutate()}
                    disabled={sendReplyMutation.isPending || !replyMessage.trim()}
                    className="self-end"
                  >
                    {sendReplyMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </>
        ) : (
          <CardContent className="h-[500px] flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Оберіть тікет зі списку</p>
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  );
};

export default SupportTicketManagement;
