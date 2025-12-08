import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/AuthProvider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { History, ArrowUpCircle, ArrowDownCircle, Gift, CreditCard } from 'lucide-react';
import { format } from 'date-fns';
import { uk } from 'date-fns/locale';

interface Transaction {
  id: string;
  type: string;
  amount: number;
  description: string | null;
  status: string | null;
  created_at: string;
}

const BalanceHistory = () => {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchTransactions();
    }
  }, [user]);

  const fetchTransactions = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('balance_transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      setTransactions(data || []);
    } catch (err) {
      console.error('Error fetching transactions:', err);
    } finally {
      setLoading(false);
    }
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'deposit':
        return <ArrowUpCircle className="h-5 w-5 text-green-500" />;
      case 'purchase':
        return <ArrowDownCircle className="h-5 w-5 text-red-500" />;
      case 'cashback':
        return <Gift className="h-5 w-5 text-primary" />;
      case 'referral':
        return <Gift className="h-5 w-5 text-purple-500" />;
      default:
        return <CreditCard className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const getTransactionLabel = (type: string) => {
    switch (type) {
      case 'deposit':
        return 'Поповнення';
      case 'purchase':
        return 'Покупка';
      case 'cashback':
        return 'Кешбек';
      case 'referral':
        return 'Реферал';
      case 'achievement':
        return 'Досягнення';
      default:
        return type;
    }
  };

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case 'completed':
        return <Badge variant="default" className="bg-green-600 text-xs">Виконано</Badge>;
      case 'pending':
        return <Badge variant="secondary" className="text-xs">В очікуванні</Badge>;
      case 'failed':
        return <Badge variant="destructive" className="text-xs">Помилка</Badge>;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Історія балансу
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground py-4">
            Завантаження...
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <History className="h-5 w-5" />
          Історія балансу
        </CardTitle>
      </CardHeader>
      <CardContent>
        {transactions.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            Немає транзакцій
          </div>
        ) : (
          <ScrollArea className="h-[300px] pr-4">
            <div className="space-y-3">
              {transactions.map((tx) => (
                <div
                  key={tx.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                >
                  <div className="flex items-center gap-3">
                    {getTransactionIcon(tx.type)}
                    <div>
                      <div className="font-medium flex items-center gap-2">
                        {getTransactionLabel(tx.type)}
                        {getStatusBadge(tx.status)}
                      </div>
                      {tx.description && (
                        <div className="text-sm text-muted-foreground">
                          {tx.description}
                        </div>
                      )}
                      <div className="text-xs text-muted-foreground">
                        {format(new Date(tx.created_at), 'd MMM yyyy, HH:mm', { locale: uk })}
                      </div>
                    </div>
                  </div>
                  <div className={`font-bold ${tx.type === 'purchase' ? 'text-red-500' : 'text-green-500'}`}>
                    {tx.type === 'purchase' ? '-' : '+'}
                    {Math.abs(tx.amount).toFixed(2)}₴
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
};

export default BalanceHistory;
