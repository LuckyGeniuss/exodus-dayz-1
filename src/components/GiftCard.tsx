import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import { Gift, Send, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/components/auth/AuthProvider';
import { supabase } from '@/integrations/supabase/client';

const GIFT_AMOUNTS = [50, 100, 200, 500, 1000];

const GiftCard = () => {
  const { user } = useAuth();
  const [amount, setAmount] = useState<number>(100);
  const [customAmount, setCustomAmount] = useState('');
  const [recipientEmail, setRecipientEmail] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const finalAmount = customAmount ? parseInt(customAmount) : amount;

  const handlePurchase = async () => {
    if (!user) {
      toast.error('Увійдіть для покупки подарункового сертифіката');
      return;
    }

    if (!recipientEmail) {
      toast.error('Введіть email отримувача');
      return;
    }

    if (finalAmount < 50) {
      toast.error('Мінімальна сума: 50₴');
      return;
    }

    setLoading(true);
    try {
      // Here you would integrate with your payment system
      // For now, we'll just show a success message
      toast.success(`Подарунковий сертифікат на ${finalAmount}₴ буде надіслано на ${recipientEmail}`);
      
      // Reset form
      setRecipientEmail('');
      setMessage('');
      setCustomAmount('');
    } catch (error) {
      toast.error('Помилка при створенні сертифіката');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-primary to-amber-500 flex items-center justify-center">
            <Gift className="h-5 w-5 text-white" />
          </div>
          Подарунковий сертифікат
        </CardTitle>
        <CardDescription>
          Подаруйте другу баланс на покупки в магазині Exodus DayZ
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Amount Selection */}
        <div className="space-y-2">
          <Label>Оберіть суму</Label>
          <div className="flex flex-wrap gap-2">
            {GIFT_AMOUNTS.map((a) => (
              <Button
                key={a}
                variant={amount === a && !customAmount ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  setAmount(a);
                  setCustomAmount('');
                }}
              >
                {a}₴
              </Button>
            ))}
          </div>
          <div className="flex items-center gap-2 mt-3">
            <span className="text-sm text-muted-foreground">або</span>
            <Input
              type="number"
              placeholder="Своя сума"
              value={customAmount}
              onChange={(e) => setCustomAmount(e.target.value)}
              className="w-32"
              min={50}
            />
            <span className="text-muted-foreground">₴</span>
          </div>
        </div>

        {/* Recipient */}
        <div className="space-y-2">
          <Label htmlFor="recipientEmail">Email отримувача</Label>
          <Input
            id="recipientEmail"
            type="email"
            placeholder="friend@example.com"
            value={recipientEmail}
            onChange={(e) => setRecipientEmail(e.target.value)}
          />
        </div>

        {/* Message */}
        <div className="space-y-2">
          <Label htmlFor="giftMessage">Повідомлення (необов'язково)</Label>
          <Textarea
            id="giftMessage"
            placeholder="Вітаю з днем народження! Бажаю цікавих ігор..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={3}
          />
        </div>

        {/* Preview */}
        <div className="rounded-lg bg-gradient-to-br from-primary/10 to-amber-500/10 p-4 border border-primary/20">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">Сума сертифіката:</span>
            <Badge variant="secondary" className="text-lg px-3 py-1">
              <Sparkles className="h-4 w-4 mr-1" />
              {finalAmount}₴
            </Badge>
          </div>
          {recipientEmail && (
            <div className="flex items-center gap-2 text-sm">
              <Send className="h-4 w-4 text-primary" />
              <span>Буде надіслано на: {recipientEmail}</span>
            </div>
          )}
        </div>

        {/* Purchase Button */}
        <Button 
          className="w-full" 
          size="lg"
          onClick={handlePurchase}
          disabled={loading || !recipientEmail || finalAmount < 50}
        >
          {loading ? (
            'Обробка...'
          ) : (
            <>
              <Gift className="h-5 w-5 mr-2" />
              Купити сертифікат за {finalAmount}₴
            </>
          )}
        </Button>

        <p className="text-xs text-center text-muted-foreground">
          Отримувач отримає email з унікальним кодом для активації балансу
        </p>
      </CardContent>
    </Card>
  );
};

export default GiftCard;
