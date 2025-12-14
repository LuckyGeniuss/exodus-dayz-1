import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/AuthProvider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Tag, Calendar, Receipt } from 'lucide-react';
import { format } from 'date-fns';
import { uk } from 'date-fns/locale';

interface PromoCodeUse {
  id: string;
  used_at: string;
  order_id: string | null;
  promo_code: {
    code: string;
    discount_percent: number;
  };
}

const PromoCodeHistory = () => {
  const { user } = useAuth();

  const { data: usedCodes, isLoading } = useQuery({
    queryKey: ['promo-code-history', user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from('promo_code_uses')
        .select(`
          id,
          used_at,
          order_id,
          promo_codes:promo_code_id (
            code,
            discount_percent
          )
        `)
        .eq('user_id', user.id)
        .order('used_at', { ascending: false });

      if (error) throw error;
      
      return data.map(item => ({
        id: item.id,
        used_at: item.used_at,
        order_id: item.order_id,
        promo_code: item.promo_codes as unknown as { code: string; discount_percent: number }
      })) as PromoCodeUse[];
    },
    enabled: !!user,
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Tag className="h-5 w-5 text-primary" />
          Історія промокодів
        </CardTitle>
        <CardDescription>
          Використані вами промокоди
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!usedCodes || usedCodes.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Tag className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>Ви ще не використовували промокоди</p>
          </div>
        ) : (
          <div className="space-y-3">
            {usedCodes.map((use) => (
              <div 
                key={use.id}
                className="flex items-center justify-between p-4 rounded-lg bg-muted/50 border border-border"
              >
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Tag className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <div className="font-mono font-bold text-lg">
                      {use.promo_code?.code || 'N/A'}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      {use.used_at && format(new Date(use.used_at), 'dd MMMM yyyy, HH:mm', { locale: uk })}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant="secondary" className="text-lg px-3 py-1">
                    -{use.promo_code?.discount_percent || 0}%
                  </Badge>
                  {use.order_id && (
                    <Badge variant="outline" className="flex items-center gap-1">
                      <Receipt className="h-3 w-3" />
                      Замовлення
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PromoCodeHistory;
