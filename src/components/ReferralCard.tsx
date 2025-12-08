import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useReferral } from '@/hooks/useReferral';
import { Users, Copy, Gift, Check } from 'lucide-react';

const ReferralCard = () => {
  const { 
    referralCode, 
    referralCount, 
    loading, 
    applyReferralCode,
    getReferralLink,
    copyReferralLink,
    REFERRAL_BONUS 
  } = useReferral();
  
  const [inputCode, setInputCode] = useState('');
  const [applying, setApplying] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleApplyCode = async () => {
    if (!inputCode.trim()) return;
    
    setApplying(true);
    await applyReferralCode(inputCode.trim());
    setApplying(false);
    setInputCode('');
  };

  const handleCopy = () => {
    copyReferralLink();
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          Завантаження...
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-6 w-6 text-primary" />
          Реферальна програма
        </CardTitle>
        <CardDescription>
          Запрошуйте друзів та отримуйте бонуси
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Your referral code */}
        <div className="space-y-3">
          <Label>Ваш реферальний код</Label>
          <div className="flex items-center gap-2">
            <div className="flex-1 p-3 bg-muted rounded-lg font-mono text-lg font-bold text-center">
              {referralCode || '...'}
            </div>
            <Button 
              variant="outline" 
              size="icon" 
              onClick={handleCopy}
              className="shrink-0"
            >
              {copied ? (
                <Check className="h-4 w-4 text-green-500" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          </div>
          <Button 
            variant="secondary" 
            className="w-full"
            onClick={handleCopy}
          >
            <Copy className="h-4 w-4 mr-2" />
            Копіювати посилання
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 py-4 border-y">
          <div className="text-center">
            <div className="text-3xl font-bold text-primary">{referralCount}</div>
            <div className="text-sm text-muted-foreground">Запрошених друзів</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-green-500">
              {referralCount * REFERRAL_BONUS}₴
            </div>
            <div className="text-sm text-muted-foreground">Зароблено</div>
          </div>
        </div>

        {/* Bonus info */}
        <div className="flex items-start gap-3 p-4 bg-primary/10 rounded-lg">
          <Gift className="h-6 w-6 text-primary shrink-0 mt-0.5" />
          <div>
            <p className="font-medium">Бонус {REFERRAL_BONUS}₴</p>
            <p className="text-sm text-muted-foreground">
              Ви та ваш друг отримаєте по {REFERRAL_BONUS}₴ на баланс після першої покупки
            </p>
          </div>
        </div>

        {/* Apply code */}
        <div className="space-y-3 pt-4 border-t">
          <Label>Маєте реферальний код?</Label>
          <div className="flex gap-2">
            <Input
              value={inputCode}
              onChange={(e) => setInputCode(e.target.value.toUpperCase())}
              placeholder="Введіть код"
              className="font-mono uppercase"
              maxLength={8}
            />
            <Button 
              onClick={handleApplyCode}
              disabled={applying || !inputCode.trim()}
            >
              {applying ? '...' : 'Застосувати'}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ReferralCard;
