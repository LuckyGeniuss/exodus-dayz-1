import { useState, useEffect } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { Wallet, CreditCard, Coins } from 'lucide-react';
import { toast } from 'sonner';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import SteamAuthButton from '@/components/auth/SteamAuthButton';
import GiftCard from '@/components/GiftCard';

const Balance = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [balance, setBalance] = useState(0);
  const [steamId, setSteamId] = useState<string | null>(null);
  const [depositAmount, setDepositAmount] = useState('');
  const [transactions, setTransactions] = useState<any[]>([]);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user) {
      fetchBalance();
      fetchTransactions();
    }
  }, [user]);

  const fetchBalance = async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from('profiles')
      .select('balance, steam_id')
      .eq('id', user.id)
      .single();

    if (data && !error) {
      setBalance(Number(data.balance) || 0);
      setSteamId(data.steam_id);
    }
  };

  const fetchTransactions = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('balance_transactions')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10);

    if (data && !error) {
      setTransactions(data);
    }
  };

  const handleDeposit = async (method: 'card' | 'usdt') => {
    if (!depositAmount || Number(depositAmount) <= 0) {
      toast.error('Введіть коректну суму');
      return;
    }

    try {
      if (method === 'card') {
        const { data, error } = await supabase.functions.invoke('wayforpay-payment', {
          body: { amount: Number(depositAmount) },
        });

        if (error) {
          // Check for specific error types
          if (error.message?.includes('429') || error.message?.includes('Too many requests')) {
            toast.error('Забагато запитів. Спробуйте пізніше.');
          } else {
            toast.error('Помилка створення платежу');
          }
          return;
        }

        if (data.url) {
          // Redirect to Wayforpay payment page
          window.location.href = data.url;
        } else {
          toast.error('Помилка створення платежу');
        }
      } else {
        const { data, error } = await supabase.functions.invoke('nowpayments-payment', {
          body: { amount: Number(depositAmount) },
        });

        if (error) {
          // Check for specific error types
          if (error.message?.includes('429') || error.message?.includes('Too many requests')) {
            toast.error('Забагато запитів. Спробуйте пізніше.');
          } else {
            toast.error('Помилка створення платежу');
          }
          return;
        }

        if (data.payment_url) {
          // Redirect to NOWPayments payment page
          window.location.href = data.payment_url;
        } else {
          toast.error('Помилка створення платежу');
        }
      }
    } catch (error) {
      console.error('Payment error:', error);
      const errorMessage = error instanceof Error ? error.message : '';
      
      if (errorMessage.includes('429') || errorMessage.includes('Too many requests')) {
        toast.error('Забагато запитів. Спробуйте пізніше.');
      } else {
        toast.error('Помилка створення платежу');
      }
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Завантаження...</div>;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8 max-w-4xl">
        <h1 className="text-4xl font-military mb-8">Мій баланс</h1>

        <div className="grid gap-6 md:grid-cols-2 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wallet className="h-6 w-6" />
                Поточний баланс
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-primary">{balance.toFixed(2)} ₴</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <svg className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2a10 10 0 0 0-10 10 10 10 0 0 0 10 10 10 10 0 0 0 10-10A10 10 0 0 0 12 2zm0 18a8 8 0 0 1-8-8 8 8 0 0 1 8-8 8 8 0 0 1 8 8 8 8 0 0 1-8 8z"/>
                  <path d="M15.5 8.5a2.5 2.5 0 0 0-2.5 2.5 2.5 2.5 0 0 0 2.5 2.5 2.5 2.5 0 0 0 2.5-2.5 2.5 2.5 0 0 0-2.5-2.5zm-7-1a4 4 0 0 0-4 4 4 4 0 0 0 4 4l2-2a2 2 0 0 1-2-2 2 2 0 0 1 2-2z"/>
                </svg>
                Steam ID
              </CardTitle>
            </CardHeader>
            <CardContent>
              {steamId ? (
                <div>
                  <div className="text-lg font-mono text-muted-foreground mb-2">{steamId}</div>
                  <p className="text-sm text-green-600">✓ Steam підключено</p>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground mb-3">
                    Підключіть Steam для автоматичної доставки товарів
                  </p>
                  <SteamAuthButton userId={user?.id} onSuccess={fetchBalance} />
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="deposit" className="mb-8">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="deposit">Поповнити</TabsTrigger>
            <TabsTrigger value="gift">Подарунок</TabsTrigger>
            <TabsTrigger value="history">Історія</TabsTrigger>
          </TabsList>

        <TabsContent value="deposit" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Поповнення балансу</CardTitle>
              <CardDescription>
                Оберіть зручний для вас спосіб оплати
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="amount">Сума поповнення (₴)</Label>
                <Input
                  id="amount"
                  type="number"
                  placeholder="100"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  min="1"
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <Card className="cursor-pointer hover:border-primary transition-colors">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <CreditCard className="h-5 w-5" />
                      Картка (UAH)
                    </CardTitle>
                    <CardDescription>Apple Pay / Google Pay</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button 
                      className="w-full" 
                      onClick={() => handleDeposit('card')}
                      disabled={!depositAmount}
                    >
                      Поповнити
                    </Button>
                  </CardContent>
                </Card>

                <Card className="cursor-pointer hover:border-primary transition-colors">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Coins className="h-5 w-5" />
                      USDT (TRC-20)
                    </CardTitle>
                    <CardDescription>Криптовалюта</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button 
                      className="w-full" 
                      variant="outline"
                      onClick={() => handleDeposit('usdt')}
                      disabled={!depositAmount}
                    >
                      Поповнити
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="gift">
          <GiftCard />
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>Історія транзакцій</CardTitle>
            </CardHeader>
            <CardContent>
              {transactions.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  Немає транзакцій
                </p>
              ) : (
                <div className="space-y-4">
                  {transactions.map((tx) => (
                    <div key={tx.id} className="flex justify-between items-center p-4 border rounded-lg">
                      <div>
                        <p className="font-semibold">{tx.description || tx.type}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(tx.created_at).toLocaleDateString('uk-UA')}
                        </p>
                      </div>
                      <div className={`text-lg font-bold ${tx.amount > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {tx.amount > 0 ? '+' : ''}{tx.amount} ₴
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      </main>
      <Footer />
    </div>
  );
};

export default Balance;