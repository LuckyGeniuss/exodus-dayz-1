import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tag, X, Loader2, CheckCircle } from 'lucide-react';
import { usePromoCode } from '@/hooks/usePromoCode';

interface PromoCodeInputProps {
  orderAmount: number;
  onDiscountChange: (discount: number) => void;
}

const PromoCodeInput = ({ orderAmount, onDiscountChange }: PromoCodeInputProps) => {
  const [code, setCode] = useState('');
  const { loading, appliedCode, applyCode, removeCode, calculateDiscount } = usePromoCode();

  const handleApply = async () => {
    const success = await applyCode(code, orderAmount);
    if (success) {
      setCode('');
    }
  };

  const handleRemove = () => {
    removeCode();
    onDiscountChange(0);
  };

  // Update parent with discount when applied code changes
  const discount = calculateDiscount(orderAmount);
  if (appliedCode && discount !== 0) {
    onDiscountChange(discount);
  }

  if (appliedCode) {
    return (
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
              Економія: {discount.toFixed(0)} ₴
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleRemove}
          className="h-8 w-8 p-0"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium flex items-center gap-2">
        <Tag className="h-4 w-4" />
        Промокод
      </label>
      <div className="flex gap-2">
        <Input
          placeholder="Введіть промокод"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          className="font-mono"
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              handleApply();
            }
          }}
        />
        <Button
          onClick={handleApply}
          disabled={loading || !code.trim()}
          variant="outline"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            'Застосувати'
          )}
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">
        Доступні промокоди: EXODUS10, NEWPLAYER, VIP20
      </p>
    </div>
  );
};

export default PromoCodeInput;
