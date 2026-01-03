import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/AuthProvider';

interface DailyRewardState {
  streak: number;
  totalClaimed: number;
  canClaim: boolean;
  hoursUntilNext: number;
  loading: boolean;
}

export const useDailyReward = () => {
  const { user } = useAuth();
  const [state, setState] = useState<DailyRewardState>({
    streak: 0,
    totalClaimed: 0,
    canClaim: true,
    hoursUntilNext: 0,
    loading: true,
  });
  const [showModal, setShowModal] = useState(false);

  const fetchRewardStatus = useCallback(async () => {
    if (!user) {
      setState(prev => ({ ...prev, loading: false }));
      return;
    }

    const { data } = await supabase
      .from('daily_rewards')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (data) {
      const lastClaim = new Date(data.last_claim);
      const hoursSinceClaim = (Date.now() - lastClaim.getTime()) / (1000 * 60 * 60);
      const canClaim = hoursSinceClaim >= 20;

      setState({
        streak: data.streak,
        totalClaimed: Number(data.total_claimed),
        canClaim,
        hoursUntilNext: canClaim ? 0 : Math.ceil(20 - hoursSinceClaim),
        loading: false,
      });

      // Auto-show modal if can claim
      if (canClaim) {
        setShowModal(true);
      }
    } else {
      // New user, can claim
      setState({
        streak: 0,
        totalClaimed: 0,
        canClaim: true,
        hoursUntilNext: 0,
        loading: false,
      });
      setShowModal(true);
    }
  }, [user]);

  useEffect(() => {
    fetchRewardStatus();
  }, [fetchRewardStatus]);

  return {
    ...state,
    showModal,
    setShowModal,
    refetch: fetchRewardStatus,
  };
};
