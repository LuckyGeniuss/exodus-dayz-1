import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/AuthProvider';
import { toast } from 'sonner';

export interface PromoCode {
  id: string;
  code: string;
  discount_percent: number;
  max_uses: number | null;
  current_uses: number;
  min_order_amount: number;
  valid_from: string;
  valid_until: string | null;
  is_active: boolean;
}

interface ValidateResult {
  valid: boolean;
  promoCode?: PromoCode;
  error?: string;
}

export const usePromoCode = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [appliedCode, setAppliedCode] = useState<PromoCode | null>(null);

  const validateCode = async (code: string, orderAmount: number): Promise<ValidateResult> => {
    if (!code.trim()) {
      return { valid: false, error: 'Введіть промокод' };
    }

    setLoading(true);
    try {
      // Fetch the promo code
      const { data: promoCode, error } = await supabase
        .from('promo_codes')
        .select('*')
        .eq('code', code.toUpperCase().trim())
        .eq('is_active', true)
        .maybeSingle();

      if (error) throw error;

      if (!promoCode) {
        return { valid: false, error: 'Промокод не знайдено' };
      }

      // Check if valid date range
      const now = new Date();
      const validFrom = new Date(promoCode.valid_from);
      const validUntil = promoCode.valid_until ? new Date(promoCode.valid_until) : null;

      if (now < validFrom) {
        return { valid: false, error: 'Промокод ще не активний' };
      }

      if (validUntil && now > validUntil) {
        return { valid: false, error: 'Промокод вже не дійсний' };
      }

      // Check max uses
      if (promoCode.max_uses !== null && promoCode.current_uses >= promoCode.max_uses) {
        return { valid: false, error: 'Промокод вичерпано' };
      }

      // Check minimum order amount
      if (orderAmount < promoCode.min_order_amount) {
        return { 
          valid: false, 
          error: `Мінімальна сума замовлення: ${promoCode.min_order_amount} ₴` 
        };
      }

      // Check if user already used this code
      if (user) {
        const { data: existingUse } = await supabase
          .from('promo_code_uses')
          .select('id')
          .eq('promo_code_id', promoCode.id)
          .eq('user_id', user.id)
          .maybeSingle();

        if (existingUse) {
          return { valid: false, error: 'Ви вже використовували цей промокод' };
        }
      }

      return { valid: true, promoCode };
    } catch (err) {
      console.error('Error validating promo code:', err);
      return { valid: false, error: 'Помилка перевірки промокоду' };
    } finally {
      setLoading(false);
    }
  };

  const applyCode = async (code: string, orderAmount: number): Promise<boolean> => {
    const result = await validateCode(code, orderAmount);
    
    if (result.valid && result.promoCode) {
      setAppliedCode(result.promoCode);
      toast.success(`Промокод застосовано! Знижка ${result.promoCode.discount_percent}%`);
      return true;
    } else {
      toast.error(result.error || 'Невірний промокод');
      return false;
    }
  };

  const removeCode = () => {
    setAppliedCode(null);
    toast.info('Промокод видалено');
  };

  const recordUsage = async (orderId: string): Promise<boolean> => {
    if (!appliedCode || !user) return false;

    try {
      // Record the usage
      const { error: useError } = await supabase
        .from('promo_code_uses')
        .insert({
          promo_code_id: appliedCode.id,
          user_id: user.id,
          order_id: orderId,
        });

      if (useError) throw useError;

      // Increment current_uses (this should be done via a trigger in production)
      // For now we'll skip this as it requires admin permissions

      return true;
    } catch (err) {
      console.error('Error recording promo code usage:', err);
      return false;
    }
  };

  const calculateDiscount = (amount: number): number => {
    if (!appliedCode) return 0;
    return amount * (appliedCode.discount_percent / 100);
  };

  return {
    loading,
    appliedCode,
    validateCode,
    applyCode,
    removeCode,
    recordUsage,
    calculateDiscount,
  };
};
