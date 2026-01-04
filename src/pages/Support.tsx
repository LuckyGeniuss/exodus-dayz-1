import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/AuthProvider';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { uk } from 'date-fns/locale';
import { 
  MessageSquare, Plus, Send, Clock, CheckCircle, 
  XCircle, AlertCircle, ArrowLeft, Loader2 
} from 'lucide-react';
import { Navigate } from 'react-router-dom';

interface Ticket {
  id: string;
  subject: string;
  status: string;
  priority: string;
  created_at: string;
  updated_at: string;
}

interface Message {
  id: string;
  ticket_id: string;
  message: string;
  is_admin: boolean;
  created_at: string;
  sender_id: string;
}

const Support = () => {
  const { user, loading } = useAuth();
  const queryClient = useQueryClient();
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [showNewTicket, setShowNewTicket] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [newTicketSubject, setNewTicketSubject] = useState('');
  const [newTicketMessage, setNewTicketMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch tickets
  const { data: tickets, isLoading: ticketsLoading } = useQuery({
    queryKey: ['support-tickets', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('support_tickets')
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Ticket[];
    },
    enabled: !!user
  });

  // Fetch messages for selected ticket
  const { data: messages, isLoading: messagesLoading } = useQuery({
    queryKey: ['ticket-messages', selectedTicket?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ticket_messages')
        .select('*')
        .eq('ticket_id', selectedTicket!.id)
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      return data as Message[];
    },
    enabled: !!selectedTicket
  });

  // Real-time subscription for messages
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
          filter: `ticket_id=eq.${selectedTicket.id}`
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['ticket-messages', selectedTicket.id] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedTicket, queryClient]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Create ticket mutation
  const createTicketMutation = useMutation({
    mutationFn: async () => {
      // Create ticket
      const { data: ticket, error: ticketError } = await supabase
        .from('support_tickets')
        .insert({
          user_id: user!.id,
          subject: newTicketSubject,
          status: 'open',
          priority: 'medium'
        })
        .select()
        .single();

      if (ticketError) throw ticketError;

      // Add initial message
      const { error: messageError } = await supabase
        .from('ticket_messages')
        .insert({
          ticket_id: ticket.id,
          sender_id: user!.id,
          message: newTicketMessage,
          is_admin: false
        });

      if (messageError) throw messageError;

      // Send Telegram notification
      await supabase.functions.invoke('telegram-notify', {
        body: {
          type: 'new_ticket',
          data: {
            subject: newTicketSubject,
            message: newTicketMessage,
            user_email: user!.email
          }
        }
      });

      return ticket;
    },
    onSuccess: (ticket) => {
      queryClient.invalidateQueries({ queryKey: ['support-tickets'] });
      setNewTicketSubject('');
      setNewTicketMessage('');
      setShowNewTicket(false);
      setSelectedTicket(ticket);
      toast.success('Тікет створено!');
    },
    onError: () => {
      toast.error('Помилка створення тікета');
    }
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('ticket_messages')
        .insert({
          ticket_id: selectedTicket!.id,
          sender_id: user!.id,
          message: newMessage,
          is_admin: false
        });

      if (error) throw error;

      // Update ticket updated_at
      await supabase
        .from('support_tickets')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', selectedTicket!.id);
    },
    onSuccess: () => {
      setNewMessage('');
      queryClient.invalidateQueries({ queryKey: ['ticket-messages', selectedTicket?.id] });
    },
    onError: () => {
      toast.error('Помилка надсилання повідомлення');
    }
  });

  const getStatusBadge = (status: string) => {
    const configs: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: typeof Clock }> = {
      open: { variant: 'default', icon: AlertCircle },
      in_progress: { variant: 'secondary', icon: Clock },
      resolved: { variant: 'outline', icon: CheckCircle },
      closed: { variant: 'destructive', icon: XCircle }
    };
    
    const config = configs[status] || configs.open;
    const Icon = config.icon;
    const labels: Record<string, string> = {
      open: 'Відкрито',
      in_progress: 'В роботі',
      resolved: 'Вирішено',
      closed: 'Закрито'
    };

    return (
      <Badge variant={config.variant} className="gap-1">
        <Icon className="h-3 w-3" />
        {labels[status] || status}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold">Підтримка</h1>
              <p className="text-muted-foreground">Ваші звернення до служби підтримки</p>
            </div>
            {!showNewTicket && !selectedTicket && (
              <Button onClick={() => setShowNewTicket(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Новий тікет
              </Button>
            )}
          </div>

          {/* New Ticket Form */}
          {showNewTicket && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Нове звернення</CardTitle>
                <CardDescription>Опишіть вашу проблему або питання</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Тема</label>
                  <Input
                    value={newTicketSubject}
                    onChange={(e) => setNewTicketSubject(e.target.value)}
                    placeholder="Коротко опишіть тему"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Повідомлення</label>
                  <Textarea
                    value={newTicketMessage}
                    onChange={(e) => setNewTicketMessage(e.target.value)}
                    placeholder="Детально опишіть вашу проблему..."
                    rows={5}
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={() => createTicketMutation.mutate()}
                    disabled={!newTicketSubject || !newTicketMessage || createTicketMutation.isPending}
                  >
                    {createTicketMutation.isPending ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4 mr-2" />
                    )}
                    Створити тікет
                  </Button>
                  <Button variant="outline" onClick={() => setShowNewTicket(false)}>
                    Скасувати
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Chat View */}
          {selectedTicket && (
            <Card>
              <CardHeader className="border-b">
                <div className="flex items-center gap-4">
                  <Button variant="ghost" size="icon" onClick={() => setSelectedTicket(null)}>
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                  <div className="flex-1">
                    <CardTitle className="text-lg">{selectedTicket.subject}</CardTitle>
                    <div className="flex items-center gap-2 mt-1">
                      {getStatusBadge(selectedTicket.status)}
                      <span className="text-xs text-muted-foreground">
                        Створено {format(new Date(selectedTicket.created_at), 'd MMMM yyyy, HH:mm', { locale: uk })}
                      </span>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {/* Messages */}
                <ScrollArea className="h-[400px] p-4">
                  {messagesLoading ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {messages?.map((msg) => (
                        <div
                          key={msg.id}
                          className={`flex ${msg.is_admin ? 'justify-start' : 'justify-end'}`}
                        >
                          <div
                            className={`max-w-[80%] rounded-lg p-3 ${
                              msg.is_admin
                                ? 'bg-muted text-foreground'
                                : 'bg-primary text-primary-foreground'
                            }`}
                          >
                            <p className="text-sm whitespace-pre-wrap">{msg.message}</p>
                            <p className={`text-xs mt-1 ${msg.is_admin ? 'text-muted-foreground' : 'text-primary-foreground/70'}`}>
                              {msg.is_admin ? 'Підтримка • ' : ''}
                              {format(new Date(msg.created_at), 'HH:mm', { locale: uk })}
                            </p>
                          </div>
                        </div>
                      ))}
                      <div ref={messagesEndRef} />
                    </div>
                  )}
                </ScrollArea>

                {/* Message Input */}
                {selectedTicket.status !== 'closed' && (
                  <>
                    <Separator />
                    <div className="p-4 flex gap-2">
                      <Input
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Введіть повідомлення..."
                        onKeyPress={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey && newMessage.trim()) {
                            sendMessageMutation.mutate();
                          }
                        }}
                      />
                      <Button
                        onClick={() => sendMessageMutation.mutate()}
                        disabled={!newMessage.trim() || sendMessageMutation.isPending}
                      >
                        {sendMessageMutation.isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Send className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          )}

          {/* Tickets List */}
          {!selectedTicket && !showNewTicket && (
            <div className="space-y-4">
              {ticketsLoading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : tickets?.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium mb-2">Немає тікетів</h3>
                    <p className="text-muted-foreground mb-4">
                      Створіть новий тікет, щоб звернутися до підтримки
                    </p>
                    <Button onClick={() => setShowNewTicket(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Створити тікет
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                tickets?.map((ticket) => (
                  <Card
                    key={ticket.id}
                    className="cursor-pointer hover:border-primary/50 transition-colors"
                    onClick={() => setSelectedTicket(ticket)}
                  >
                    <CardContent className="py-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-medium">{ticket.subject}</h3>
                            {getStatusBadge(ticket.status)}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Створено {format(new Date(ticket.created_at), 'd MMMM yyyy, HH:mm', { locale: uk })}
                          </p>
                        </div>
                        <MessageSquare className="h-5 w-5 text-muted-foreground" />
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Support;
