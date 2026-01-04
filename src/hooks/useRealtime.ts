import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/components/auth/AuthProvider";
import { toast } from "sonner";

export const useRealtimeOrders = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('orders-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          const newStatus = payload.new.payment_status;
          const oldStatus = payload.old?.payment_status;

          if (newStatus !== oldStatus) {
            // Invalidate orders query
            queryClient.invalidateQueries({ queryKey: ['orders'] });

            // Show toast notification
            const statusMessages: Record<string, string> = {
              completed: '✅ Ваше замовлення успішно оплачено!',
              processing: '⏳ Ваше замовлення обробляється...',
              failed: '❌ Оплата замовлення не вдалась',
              refunded: '💰 Кошти за замовлення повернуто'
            };

            if (statusMessages[newStatus]) {
              toast(statusMessages[newStatus], {
                duration: 5000
              });
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, queryClient]);
};

export const useRealtimeNotifications = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('notifications-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          // Invalidate notifications query
          queryClient.invalidateQueries({ queryKey: ['notifications'] });

          // Show toast for new notification
          toast(payload.new.title, {
            description: payload.new.message,
            duration: 5000
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, queryClient]);
};
