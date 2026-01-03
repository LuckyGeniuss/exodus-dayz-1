import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/AuthProvider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MessageSquare, Send, Plus, Loader2, User, Shield, X } from 'lucide-react';
import { toast } from 'sonner';

interface Ticket {
  id: string;
  subject: string;
  status: string;
  priority: string;
  created_at: string;
}

interface Message {
  id: string;
  message: string;
  is_admin: boolean;
  created_at: string;
}

const SupportChat = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [newTicketForm, setNewTicketForm] = useState({ subject: '', message: '', priority: 'medium' });
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: tickets, refetch: refetchTickets } = useQuery({
    queryKey: ['user-tickets'],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('support_tickets')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as Ticket[];
    },
    enabled: !!user,
  });

  const { data: messages, refetch: refetchMessages } = useQuery({
    queryKey: ['ticket-messages-user', selectedTicket?.id],
    queryFn: async () => {
      if (!selectedTicket) return [];
      const { data, error } = await supabase
        .from('ticket_messages')
        .select('*')
        .eq('ticket_id', selectedTicket.id)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return data as Message[];
    },
    enabled: !!selectedTicket,
  });

  // Realtime subscription
  useEffect(() => {
    if (!selectedTicket) return;

    const channel = supabase
      .channel(`user-ticket-${selectedTicket.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'ticket_messages',
          filter: `ticket_id=eq.${selectedTicket.id}`,
        },
        () => refetchMessages()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedTicket, refetchMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const createTicketMutation = useMutation({
    mutationFn: async () => {
      if (!user) return;

      // Create ticket
      const { data: ticket, error: ticketError } = await supabase
        .from('support_tickets')
        .insert({
          user_id: user.id,
          subject: newTicketForm.subject,
          priority: newTicketForm.priority,
        })
        .select()
        .single();

      if (ticketError) throw ticketError;

      // Add first message
      const { error: msgError } = await supabase.from('ticket_messages').insert({
        ticket_id: ticket.id,
        sender_id: user.id,
        message: newTicketForm.message,
        is_admin: false,
      });

      if (msgError) throw msgError;

      return ticket;
    },
    onSuccess: (ticket) => {
      refetchTickets();
      setSelectedTicket(ticket as Ticket);
      setIsCreating(false);
      setNewTicketForm({ subject: '', message: '', priority: 'medium' });
      toast.success('Тікет створено');
    },
    onError: (error) => toast.error('Помилка: ' + error.message),
  });

  const sendMessageMutation = useMutation({
    mutationFn: async () => {
      if (!selectedTicket || !user || !newMessage.trim()) return;

      const { error } = await supabase.from('ticket_messages').insert({
        ticket_id: selectedTicket.id,
        sender_id: user.id,
        message: newMessage,
        is_admin: false,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      setNewMessage('');
      refetchMessages();
    },
    onError: (error) => toast.error('Помилка: ' + error.message),
  });

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      open: 'bg-blue-500/20 text-blue-600',
      in_progress: 'bg-amber-500/20 text-amber-600',
      resolved: 'bg-green-500/20 text-green-600',
      closed: 'bg-muted',
    };
    return colors[status] || 'bg-muted';
  };

  if (!user) return null;

  return (
    <>
      {/* Floating Button */}
      <Button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-20 right-4 z-50 rounded-full h-14 w-14 shadow-lg"
        size="icon"
      >
        <MessageSquare className="h-6 w-6" />
      </Button>

      {/* Chat Dialog */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-md h-[600px] flex flex-col p-0">
          <DialogHeader className="p-4 border-b">
            <div className="flex justify-between items-center">
              <DialogTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Підтримка
              </DialogTitle>
              {selectedTicket && (
                <Button variant="ghost" size="sm" onClick={() => setSelectedTicket(null)}>
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </DialogHeader>

          <div className="flex-1 overflow-hidden">
            {!selectedTicket && !isCreating ? (
              /* Tickets List */
              <div className="p-4 space-y-4">
                <Button onClick={() => setIsCreating(true)} className="w-full">
                  <Plus className="h-4 w-4 mr-2" />
                  Новий тікет
                </Button>

                <ScrollArea className="h-[400px]">
                  {tickets?.length === 0 ? (
                    <div className="text-center text-muted-foreground py-8">
                      У вас ще немає звернень
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {tickets?.map((ticket) => (
                        <Card
                          key={ticket.id}
                          className="cursor-pointer hover:bg-muted/50"
                          onClick={() => setSelectedTicket(ticket)}
                        >
                          <CardContent className="p-3">
                            <div className="flex justify-between items-start">
                              <span className="font-medium text-sm">{ticket.subject}</span>
                              <Badge className={getStatusColor(ticket.status)}>
                                {ticket.status}
                              </Badge>
                            </div>
                            <div className="text-xs text-muted-foreground mt-1">
                              {new Date(ticket.created_at).toLocaleDateString('uk-UA')}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </div>
            ) : isCreating ? (
              /* Create Ticket Form */
              <div className="p-4 space-y-4">
                <div className="space-y-2">
                  <Label>Тема</Label>
                  <Input
                    value={newTicketForm.subject}
                    onChange={(e) => setNewTicketForm({ ...newTicketForm, subject: e.target.value })}
                    placeholder="Опишіть коротко вашу проблему"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Пріоритет</Label>
                  <Select
                    value={newTicketForm.priority}
                    onValueChange={(v) => setNewTicketForm({ ...newTicketForm, priority: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Низький</SelectItem>
                      <SelectItem value="medium">Середній</SelectItem>
                      <SelectItem value="high">Високий</SelectItem>
                      <SelectItem value="urgent">Терміновий</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Повідомлення</Label>
                  <Textarea
                    value={newTicketForm.message}
                    onChange={(e) => setNewTicketForm({ ...newTicketForm, message: e.target.value })}
                    placeholder="Опишіть детально вашу проблему..."
                    rows={5}
                  />
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setIsCreating(false)} className="flex-1">
                    Скасувати
                  </Button>
                  <Button
                    onClick={() => createTicketMutation.mutate()}
                    disabled={createTicketMutation.isPending || !newTicketForm.subject || !newTicketForm.message}
                    className="flex-1"
                  >
                    {createTicketMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      'Створити'
                    )}
                  </Button>
                </div>
              </div>
            ) : (
              /* Chat View */
              <div className="flex flex-col h-full">
                <div className="p-3 border-b bg-muted/30">
                  <div className="font-medium">{selectedTicket.subject}</div>
                  <Badge className={getStatusColor(selectedTicket.status)}>
                    {selectedTicket.status}
                  </Badge>
                </div>

                <ScrollArea className="flex-1 p-4">
                  <div className="space-y-3">
                    {messages?.map((msg) => (
                      <div
                        key={msg.id}
                        className={`flex ${msg.is_admin ? 'justify-start' : 'justify-end'}`}
                      >
                        <div
                          className={`max-w-[80%] rounded-lg p-3 ${
                            msg.is_admin ? 'bg-muted' : 'bg-primary text-primary-foreground'
                          }`}
                        >
                          <div className="flex items-center gap-1 mb-1">
                            {msg.is_admin ? (
                              <Shield className="h-3 w-3" />
                            ) : (
                              <User className="h-3 w-3" />
                            )}
                            <span className="text-xs">
                              {msg.is_admin ? 'Підтримка' : 'Ви'}
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

                {selectedTicket.status !== 'closed' && (
                  <div className="p-3 border-t">
                    <div className="flex gap-2">
                      <Input
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Введіть повідомлення..."
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            sendMessageMutation.mutate();
                          }
                        }}
                      />
                      <Button
                        size="icon"
                        onClick={() => sendMessageMutation.mutate()}
                        disabled={sendMessageMutation.isPending || !newMessage.trim()}
                      >
                        {sendMessageMutation.isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Send className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default SupportChat;
