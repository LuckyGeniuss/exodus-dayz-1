import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { useAuth } from '@/components/auth/AuthProvider';
import { useAchievements } from '@/hooks/useAchievements';
import { useLoyalty } from '@/hooks/useLoyalty';
import { usePromoCode } from '@/hooks/usePromoCode';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Loader2, CreditCard, Wallet, Banknote, ShoppingCart, Tag, X, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import CheckoutStepper from '@/components/CheckoutStepper';
import Confetti from '@/components/Confetti';

const steps = [
  { id: 1, title: "Кошик" },
  { id: 2, title: "Оплата" },
  { id: 3, title: "Підтвердження" },
];

// Validation schema for cart items
const cartItemSchema = z.object({
  product_id: z.string(),
  quantity: z.number().positive(),
});

const Checkout = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { checkAndUnlockAchievements } = useAchievements();
  const { addCashback } = useLoyalty();
  const { loading: promoLoading, appliedCode, applyCode, removeCode, calculateDiscount, recordUsage } = usePromoCode();
  const [currentStep, setCurrentStep] = useState(2);
  const [showConfetti, setShowConfetti] = useState(false);
  const [cartItems, setCartItems] = useState<any[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'usdt' | 'balance'>(() => {
    const saved = localStorage.getItem('lastPaymentMethod');
    return (saved as 'card' | 'usdt' | 'balance') || 'card';
  });
  const [profile, setProfile] = useState<any>(null);
  const [processing, setProcessing] = useState(false);
  const [promoCodeInput, setPromoCodeInput] = useState('');

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user) {
      fetchCart();
      fetchProfile();
    }
  }, [user]);

  const fetchCart = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('cart_items')
      .select('*')
      .eq('user_id', user.id);

    if (error) {
      console.error('Error fetching cart:', error);
      toast.error('Не вдалося завантажити кошик');
      return;
    }

    if (data) {
      setCartItems(data);
    }
  };

  const fetchProfile = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (error) {
      console.error('Error fetching profile:', error);
      return;
    }

    if (data) {
      setProfile(data);
    }
  };

  const subtotal = cartItems.reduce((sum, item) => {
    return sum + (parseFloat(item.product_price || 0) * item.quantity);
  }, 0);

  const veteranDiscount = profile?.is_veteran ? subtotal * 0.1 : 0;
  const promoDiscountAmount = calculateDiscount(subtotal);
  const total = subtotal - veteranDiscount - promoDiscountAmount;

  const handleApplyPromo = async () => {
    await applyCode(promoCodeInput, subtotal);
    setPromoCodeInput('');
  };

  const handleCheckout = async () => {
    if (!user) return;

    // Validate cart items before sending
    try {
      cartItems.forEach((item) => {
        cartItemSchema.parse({
          product_id: item.product_id,
          quantity: item.quantity,
        });
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast.error('Невірні дані кошика');
        console.error('Cart validation error:', error);
        return;
      }
    }

    if (cartItems.length === 0) {
      toast.error('Кошик порожній');
      return;
    }

    setProcessing(true);
    try {
      console.log('Sending order to server:', {
        itemsCount: cartItems.length,
        paymentMethod
      });

      const { data, error } = await supabase.functions.invoke('create-order', {
        body: {
          items: cartItems.map(item => ({
            product: {
              id: item.product_id,
              name: item.product_name || '',
              price: parseFloat(item.product_price || 0),
            },
            quantity: item.quantity,
          })),
          paymentMethod,
        },
      });

      if (error) throw error;

      if (data?.error) {
        throw new Error(data.error);
      }

      // Clear cart after successful order
      await supabase
        .from('cart_items')
        .delete()
        .eq('user_id', user.id);

      // Send email notification
      try {
        await supabase.functions.invoke('send-order-email', {
          body: {
            email: user.email,
            orderNumber: data.orderId?.substring(0, 8) || 'N/A',
            items: cartItems.map(item => ({
              name: item.product_name || '',
              quantity: item.quantity,
              price: parseFloat(item.product_price || 0),
            })),
            totalAmount: subtotal,
            finalAmount: total,
            discountAmount: veteranDiscount + promoDiscountAmount,
          },
        });
      } catch (emailError) {
        console.error('Email notification failed:', emailError);
      }

      // Add cashback
      await addCashback(data.orderId || '', total);

      // Check achievements
      await checkAndUnlockAchievements();

      setCurrentStep(3);
      setShowConfetti(true);
      toast.success('Замовлення успішно створено!');
      setTimeout(() => {
        navigate('/orders');
      }, 3000);
    } catch (error: any) {
      console.error('Checkout error:', error);
      toast.error(error.message || 'Помилка при створенні замовлення');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin" />
        </main>
        <Footer />
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 container mx-auto px-4 py-8 max-w-4xl">
          <Card>
            <CardContent className="py-12 text-center">
              <ShoppingCart className="h-16 w-16 mx-auto mb-4 opacity-20" />
              <p className="text-muted-foreground mb-4">Ваш кошик порожній</p>
              <Button onClick={() => navigate('/')}>Повернутися до магазину</Button>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      {showConfetti && <Confetti />}
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8 max-w-4xl">
      <CheckoutStepper currentStep={currentStep} steps={steps} />
      <h1 className="text-4xl font-military mb-8 animate-fade-in">Оформлення замовлення</h1>

      <div className="grid gap-6 md:grid-cols-2 animate-fade-in" style={{ animationDelay: '200ms' }}>
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Товари</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {cartItems.map((item) => (
                <div key={item.id} className="flex justify-between text-sm">
                  <span>
                    {item.product_name || item.product_id} × {item.quantity}
                  </span>
                  <span>{(parseFloat(item.product_price || 0) * item.quantity).toFixed(2)} ₴</span>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Спосіб оплати</CardTitle>
              <CardDescription>Виберіть зручний спосіб оплати</CardDescription>
            </CardHeader>
            <CardContent>
              <RadioGroup 
                value={paymentMethod} 
                onValueChange={(value: 'card' | 'usdt' | 'balance') => {
                  setPaymentMethod(value);
                  localStorage.setItem('lastPaymentMethod', value);
                }}
              >
                <div className="flex items-center space-x-2 mb-3">
                  <RadioGroupItem value="card" id="card" />
                  <Label htmlFor="card" className="flex items-center gap-2 cursor-pointer">
                    <CreditCard className="h-4 w-4" />
                    Картка (UAH)
                  </Label>
                </div>
                <div className="flex items-center space-x-2 mb-3">
                  <RadioGroupItem value="usdt" id="usdt" />
                  <Label htmlFor="usdt" className="flex items-center gap-2 cursor-pointer">
                    <Banknote className="h-4 w-4" />
                    USDT (Crypto)
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="balance" id="balance" disabled={!profile || profile.balance < total} />
                  <Label htmlFor="balance" className="flex items-center gap-2 cursor-pointer">
                    <Wallet className="h-4 w-4" />
                    Баланс ({profile?.balance || 0} ₴)
                    {profile && profile.balance < total && (
                      <span className="text-xs text-muted-foreground">(Недостатньо коштів)</span>
                    )}
                  </Label>
                </div>
              </RadioGroup>
            </CardContent>
          </Card>
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle>Підсумок</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                {appliedCode ? (
                  <div className="flex items-center justify-between p-3 bg-primary/10 border border-primary/20 rounded-lg">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-primary" />
                      <div>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="font-mono">
                            {appliedCode.code}
                          </Badge>
                          <span className="text-sm font-medium text-primary">
                            -{appliedCode.discount_percent}%
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          Економія: {promoDiscountAmount.toFixed(0)} ₴
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={removeCode}
                      className="h-8 w-8 p-0"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Label htmlFor="promoCode" className="flex items-center gap-2">
                      <Tag className="h-4 w-4" />
                      Промокод
                    </Label>
                    <div className="flex gap-2">
                      <Input
                        id="promoCode"
                        value={promoCodeInput}
                        onChange={(e) => setPromoCodeInput(e.target.value.toUpperCase())}
                        placeholder="Введіть промокод"
                        className="font-mono"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleApplyPromo();
                          }
                        }}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleApplyPromo}
                        disabled={promoLoading || !promoCodeInput.trim()}
                      >
                        {promoLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Застосувати'}
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Доступні промокоди: EXODUS10, NEWPLAYER, VIP20
                    </p>
                  </div>
                )}
                
                <Separator />
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Сума:</span>
                    <span>{subtotal.toFixed(2)} ₴</span>
                  </div>
                  {profile?.is_veteran && veteranDiscount > 0 && (
                    <div className="flex justify-between text-sm text-green-600">
                      <span className="flex items-center gap-2">
                        Знижка ветерана АТО/ООС:
                        <Badge variant="secondary">-10%</Badge>
                      </span>
                      <span>-{veteranDiscount.toFixed(2)} ₴</span>
                    </div>
                  )}
                  {promoDiscountAmount > 0 && (
                    <div className="flex justify-between text-sm text-green-600">
                      <span>Знижка за промокодом:</span>
                      <span>-{promoDiscountAmount.toFixed(2)} ₴</span>
                    </div>
                  )}
                  <Separator />
                  <div className="flex justify-between text-lg font-bold">
                    <span>До сплати:</span>
                    <span className="text-primary">{total.toFixed(2)} ₴</span>
                  </div>
                </div>
              </div>

              <Button 
                className="w-full" 
                size="lg"
                onClick={handleCheckout}
                 disabled={processing || cartItems.length === 0}
              >
                {processing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Обробка...
                  </>
                ) : (
                  'Оплатити'
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
      </main>
      <Footer />
    </div>
  );
};

export default Checkout;
