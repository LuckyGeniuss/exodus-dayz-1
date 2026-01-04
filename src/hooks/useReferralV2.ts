import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/AuthProvider';
import { toast } from 'sonner';

// Multi-level referral bonuses
const REFERRAL_LEVELS = [
  { level: 1, bonus: 50, label: 'Прямий реферал' },
  { level: 2, bonus: 25, label: 'Реферал 2-го рівня' },
  { level: 3, bonus: 10, label: 'Реферал 3-го рівня' }
];

interface ReferralStats {
  level1: { count: number; earned: number; pending: number };
  level2: { count: number; earned: number; pending: number };
  level3: { count: number; earned: number; pending: number };
  totalEarned: number;
  totalPending: number;
  totalReferrals: number;
}

export const useReferralV2 = () => {
  const { user } = useAuth();
  const [referralCode, setReferralCode] = useState<string | null>(null);
  const [stats, setStats] = useState<ReferralStats>({
    level1: { count: 0, earned: 0, pending: 0 },
    level2: { count: 0, earned: 0, pending: 0 },
    level3: { count: 0, earned: 0, pending: 0 },
    totalEarned: 0,
    totalPending: 0,
    totalReferrals: 0
  });
  const [hasUsedReferral, setHasUsedReferral] = useState(false);
  const [loading, setLoading] = useState(true);
  const [referralTree, setReferralTree] = useState<any[]>([]);

  useEffect(() => {
    if (user) {
      fetchReferralData();
    }
  }, [user]);

  const fetchReferralData = async () => {
    if (!user) return;

    try {
      setLoading(true);

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

      // Get Level 1 referrals (direct)
      const { data: level1Referrals } = await supabase
        .from('referrals')
        .select('id, referred_id, bonus_given, created_at')
        .eq('referrer_id', user.id);

      const level1Ids = level1Referrals?.map(r => r.referred_id) || [];
      
      // Get Level 2 referrals (referrals of my referrals)
      let level2Ids: string[] = [];
      if (level1Ids.length > 0) {
        const { data: level2Referrals } = await supabase
          .from('referrals')
          .select('referred_id')
          .in('referrer_id', level1Ids);
        
        level2Ids = level2Referrals?.map(r => r.referred_id) || [];
      }

      // Get Level 3 referrals
      let level3Ids: string[] = [];
      if (level2Ids.length > 0) {
        const { data: level3Referrals } = await supabase
          .from('referrals')
          .select('referred_id')
          .in('referrer_id', level2Ids);
        
        level3Ids = level3Referrals?.map(r => r.referred_id) || [];
      }

      // Calculate stats
      const level1Given = level1Referrals?.filter(r => r.bonus_given).length || 0;
      const level1Pending = (level1Referrals?.length || 0) - level1Given;

      // For multi-level, we track based on orders from downstream referrals
      // Simplified: assume bonus given for each level
      const newStats: ReferralStats = {
        level1: {
          count: level1Ids.length,
          earned: level1Given * REFERRAL_LEVELS[0].bonus,
          pending: level1Pending
        },
        level2: {
          count: level2Ids.length,
          earned: level2Ids.length * REFERRAL_LEVELS[1].bonus * 0.5, // Estimate
          pending: 0
        },
        level3: {
          count: level3Ids.length,
          earned: level3Ids.length * REFERRAL_LEVELS[2].bonus * 0.3, // Estimate
          pending: 0
        },
        totalEarned: 0,
        totalPending: level1Pending,
        totalReferrals: level1Ids.length + level2Ids.length + level3Ids.length
      };

      newStats.totalEarned = newStats.level1.earned + newStats.level2.earned + newStats.level3.earned;
      setStats(newStats);

      // Build referral tree for visualization
      const tree = await buildReferralTree(level1Ids, level2Ids, level3Ids);
      setReferralTree(tree);

    } catch (err) {
      console.error('Error fetching referral data:', err);
    } finally {
      setLoading(false);
    }
  };

  const buildReferralTree = async (level1Ids: string[], level2Ids: string[], level3Ids: string[]) => {
    const allIds = [...level1Ids, ...level2Ids, ...level3Ids];
    if (allIds.length === 0) return [];

    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, username, created_at, total_spent, referred_by')
      .in('id', allIds);

    const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

    // Build tree structure
    const level1Nodes = level1Ids.map(id => {
      const profile = profileMap.get(id);
      const level2Children = level2Ids
        .filter(l2 => profileMap.get(l2)?.referred_by === id)
        .map(l2id => {
          const l2Profile = profileMap.get(l2id);
          const level3Children = level3Ids
            .filter(l3 => profileMap.get(l3)?.referred_by === l2id)
            .map(l3id => ({
              id: l3id,
              username: profileMap.get(l3id)?.username || 'User',
              level: 3,
              totalSpent: profileMap.get(l3id)?.total_spent || 0
            }));
          
          return {
            id: l2id,
            username: l2Profile?.username || 'User',
            level: 2,
            totalSpent: l2Profile?.total_spent || 0,
            children: level3Children
          };
        });

      return {
        id,
        username: profile?.username || 'User',
        level: 1,
        totalSpent: profile?.total_spent || 0,
        children: level2Children
      };
    });

    return level1Nodes;
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

      setHasUsedReferral(true);
      toast.success(`🎁 Реферальний код застосовано! Бонус буде нараховано після першої покупки.`);
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
    stats,
    hasUsedReferral,
    loading,
    referralTree,
    applyReferralCode,
    getReferralLink,
    copyReferralLink,
    REFERRAL_LEVELS,
    refreshData: fetchReferralData
  };
};
