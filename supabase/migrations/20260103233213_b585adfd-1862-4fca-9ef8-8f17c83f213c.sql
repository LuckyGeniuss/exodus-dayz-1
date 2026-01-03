-- Support tickets table
CREATE TABLE IF NOT EXISTS public.support_tickets (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subject text NOT NULL,
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
  priority text NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  closed_at timestamp with time zone
);

-- Support ticket messages
CREATE TABLE IF NOT EXISTS public.ticket_messages (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ticket_id uuid NOT NULL REFERENCES public.support_tickets(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES auth.users(id),
  message text NOT NULL,
  is_admin boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Broadcast messages for mass notifications
CREATE TABLE IF NOT EXISTS public.broadcast_messages (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_id uuid NOT NULL REFERENCES auth.users(id),
  title text NOT NULL,
  message text NOT NULL,
  type text NOT NULL CHECK (type IN ('email', 'push', 'both')),
  target_audience text NOT NULL DEFAULT 'all' CHECK (target_audience IN ('all', 'veterans', 'admins', 'active_users')),
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sending', 'sent', 'failed')),
  sent_count integer DEFAULT 0,
  failed_count integer DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  sent_at timestamp with time zone
);

-- Message templates
CREATE TABLE IF NOT EXISTS public.message_templates (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  subject text,
  body text NOT NULL,
  type text NOT NULL CHECK (type IN ('email', 'push', 'ticket_reply')),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Telegram user links
CREATE TABLE IF NOT EXISTS public.telegram_users (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  telegram_id bigint NOT NULL UNIQUE,
  telegram_username text,
  is_verified boolean DEFAULT false,
  verification_code text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_support_tickets_user_id ON public.support_tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON public.support_tickets(status);
CREATE INDEX IF NOT EXISTS idx_ticket_messages_ticket_id ON public.ticket_messages(ticket_id);
CREATE INDEX IF NOT EXISTS idx_telegram_users_telegram_id ON public.telegram_users(telegram_id);

-- Enable RLS
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.broadcast_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.telegram_users ENABLE ROW LEVEL SECURITY;

-- Support tickets policies
CREATE POLICY "Users can view own tickets" ON public.support_tickets
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create tickets" ON public.support_tickets
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own tickets" ON public.support_tickets
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all tickets" ON public.support_tickets
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Ticket messages policies
CREATE POLICY "Users can view own ticket messages" ON public.ticket_messages
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM public.support_tickets 
    WHERE id = ticket_messages.ticket_id AND user_id = auth.uid()
  ));

CREATE POLICY "Users can send messages to own tickets" ON public.ticket_messages
  FOR INSERT WITH CHECK (EXISTS (
    SELECT 1 FROM public.support_tickets 
    WHERE id = ticket_messages.ticket_id AND user_id = auth.uid()
  ));

CREATE POLICY "Admins can manage all messages" ON public.ticket_messages
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Broadcast messages policies
CREATE POLICY "Admins can manage broadcasts" ON public.broadcast_messages
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Templates policies
CREATE POLICY "Admins can manage templates" ON public.message_templates
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Anyone can view templates" ON public.message_templates
  FOR SELECT USING (true);

-- Telegram users policies
CREATE POLICY "Users can view own telegram link" ON public.telegram_users
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own telegram link" ON public.telegram_users
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all telegram links" ON public.telegram_users
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

-- Enable realtime for tickets and messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.support_tickets;
ALTER PUBLICATION supabase_realtime ADD TABLE public.ticket_messages;

-- Insert default templates
INSERT INTO public.message_templates (name, subject, body, type) VALUES
  ('Вітальний лист', 'Ласкаво просимо до Exodus Shop!', 'Привіт, {{username}}!\n\nДякуємо за реєстрацію в нашому магазині. Бажаємо приємних покупок!\n\nЗ повагою,\nКоманда Exodus', 'email'),
  ('Нова акція', '🔥 Нова акція в Exodus Shop!', '{{title}}\n\n{{message}}\n\nПереходьте на сайт та скористайтесь пропозицією!', 'push'),
  ('Відповідь підтримки', NULL, 'Дякуємо за звернення!\n\n{{message}}\n\nЯкщо у вас є додаткові питання - пишіть!', 'ticket_reply')
ON CONFLICT DO NOTHING;