import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/AuthProvider';
import { toast } from 'sonner';

const REFERRAL_BONUS = 50; // 50₴ for both referrer and referred

export const useReferral = () => {
  const { user } = useAuth();
  const [referralCode, setReferralCode] = useState<string | null>(null);
  const [referralCount, setReferralCount] = useState(0);
  const [referralBonusTotal, setReferralBonusTotal] = useState(0);
  const [pendingBonuses, setPendingBonuses] = useState(0);
  const [hasUsedReferral, setHasUsedReferral] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchReferralData();
    }
  }, [user]);

  const fetchReferralData = async () => {
    if (!user) return;

    try {
      // Get user's referral code
      const { data: profile } = await supabase
        .from('profiles')
        .select('referral_code, referred_by')
        .eq('id', user.id)
        .single();

      if (profile?.referral_code) {
        setReferralCode(profile.referral_code);
      }
      
      setHasUsedReferral(!!profile?.referred_by);

      // Get referral stats
      const { data: referrals } = await supabase
        .from('referrals')
        .select('id, bonus_given')
        .eq('referrer_id', user.id);

      if (referrals) {
        setReferralCount(referrals.length);
        const completedBonuses = referrals.filter(r => r.bonus_given).length;
        setReferralBonusTotal(completedBonuses * REFERRAL_BONUS);
        setPendingBonuses(referrals.length - completedBonuses);
      }
    } catch (err) {
      console.error('Error fetching referral data:', err);
    } finally {
      setLoading(false);
    }
  };

  const applyReferralCode = async (code: string) => {
    if (!user) {
      toast.error('Спочатку увійдіть в систему');
      return false;
    }

    try {
      // Find referrer by code
      const { data: referrer, error: referrerError } = await supabase
        .from('profiles')
        .select('id, referral_code')
        .eq('referral_code', code.toUpperCase())
        .maybeSingle();

      if (referrerError || !referrer) {
        toast.error('Реферальний код не знайдено');
        return false;
      }

      if (referrer.id === user.id) {
        toast.error('Ви не можете використати власний код');
        return false;
      }

      // Check if already referred
      const { data: existingReferral } = await supabase
        .from('referrals')
        .select('id')
        .eq('referred_id', user.id)
        .maybeSingle();

      if (existingReferral) {
        toast.error('Ви вже використали реферальний код');
        return false;
      }

      // Create referral
      const { error: referralError } = await supabase
        .from('referrals')
        .insert({
          referrer_id: referrer.id,
          referred_id: user.id,
          referral_code: code.toUpperCase(),
        });

      if (referralError) throw referralError;

      // Update referred user's profile
      await supabase
        .from('profiles')
        .update({ referred_by: referrer.id })
        .eq('id', user.id);

      toast.success(`🎁 Реферальний код застосовано! +${REFERRAL_BONUS}₴ на баланс`);
      return true;
    } catch (err) {
      console.error('Error applying referral code:', err);
      toast.error('Помилка при застосуванні коду');
      return false;
    }
  };

  const getReferralLink = () => {
    if (!referralCode) return null;
    return `${window.location.origin}?ref=${referralCode}`;
  };

  const copyReferralLink = () => {
    const link = getReferralLink();
    if (link) {
      navigator.clipboard.writeText(link);
      toast.success('Реферальне посилання скопійовано');
    }
  };

  return {
    referralCode,
    referralCount,
    referralBonusTotal,
    pendingBonuses,
    hasUsedReferral,
    loading,
    applyReferralCode,
    getReferralLink,
    copyReferralLink,
    REFERRAL_BONUS,
  };
};
