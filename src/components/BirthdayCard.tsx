import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/AuthProvider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Cake, Gift, Calendar, Check, Loader2 } from 'lucide-react';
import { format, parseISO, differenceInDays } from 'date-fns';
import { uk } from 'date-fns/locale';

const BirthdayCard = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [birthdayInput, setBirthdayInput] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  const { data: profile, isLoading } = useQuery({
    queryKey: ['profile-birthday', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from('profiles')
        .select('birthday')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const { data: birthdayCoupon } = useQuery({
    queryKey: ['birthday-coupon', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const currentYear = new Date().getFullYear();
      
      const { data, error } = await supabase
        .from('birthday_coupons')
        .select(`
          *,
          promo_codes (
            code,
            discount_percent,
            valid_until
          )
        `)
        .eq('user_id', user.id)
        .eq('year', currentYear)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const updateBirthdayMutation = useMutation({
    mutationFn: async (birthday: string) => {
      if (!user) throw new Error('Not authenticated');
      
      const { error } = await supabase
        .from('profiles')
        .update({ birthday })
        .eq('id', user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile-birthday', user?.id] });
      toast.success('Дату народження оновлено!');
      setIsEditing(false);
    },
    onError: () => {
      toast.error('Помилка оновлення дати народження');
    },
  });

  const handleSaveBirthday = () => {
    if (!birthdayInput) {
      toast.error('Введіть дату народження');
      return;
    }
    updateBirthdayMutation.mutate(birthdayInput);
  };

  const getDaysUntilBirthday = () => {
    if (!profile?.birthday) return null;
    
    const today = new Date();
    const birthday = parseISO(profile.birthday);
    const nextBirthday = new Date(today.getFullYear(), birthday.getMonth(), birthday.getDate());
    
    if (nextBirthday < today) {
      nextBirthday.setFullYear(today.getFullYear() + 1);
    }
    
    return differenceInDays(nextBirthday, today);
  };

  const isBirthdayToday = () => {
    if (!profile?.birthday) return false;
    
    const today = new Date();
    const birthday = parseISO(profile.birthday);
    
    return today.getMonth() === birthday.getMonth() && today.getDate() === birthday.getDate();
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  const daysUntilBirthday = getDaysUntilBirthday();
  const isToday = isBirthdayToday();

  return (
    <Card className={isToday ? 'border-pink-500 bg-gradient-to-br from-pink-500/10 to-rose-500/10' : ''}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Cake className="h-5 w-5 text-pink-500" />
          День народження
          {isToday && (
            <Badge className="ml-auto bg-gradient-to-r from-pink-500 to-rose-500">
              🎂 Сьогодні!
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {profile?.birthday && !isEditing ? (
          <>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
              <Calendar className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-medium">
                  {format(parseISO(profile.birthday), 'd MMMM', { locale: uk })}
                </p>
                {daysUntilBirthday !== null && daysUntilBirthday > 0 && (
                  <p className="text-sm text-muted-foreground">
                    Залишилось {daysUntilBirthday} днів
                  </p>
                )}
              </div>
            </div>

            {isToday && birthdayCoupon?.promo_codes && (
              <div className="p-4 rounded-lg bg-gradient-to-r from-pink-500/20 to-rose-500/20 border border-pink-500/30">
                <div className="flex items-center gap-2 mb-2">
                  <Gift className="h-5 w-5 text-pink-500" />
                  <span className="font-semibold">Ваш подарунок!</span>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold font-mono">
                      {birthdayCoupon.promo_codes.code}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Знижка {birthdayCoupon.promo_codes.discount_percent}% • Дійсний до{' '}
                      {birthdayCoupon.promo_codes.valid_until && 
                        format(parseISO(birthdayCoupon.promo_codes.valid_until), 'd MMM', { locale: uk })}
                    </p>
                  </div>
                  <Badge variant="secondary" className="text-lg px-3 py-1">
                    -{birthdayCoupon.promo_codes.discount_percent}%
                  </Badge>
                </div>
              </div>
            )}

            {birthdayCoupon?.used_at && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Check className="h-4 w-4 text-green-500" />
                Купон використано
              </div>
            )}

            <Button variant="outline" size="sm" onClick={() => {
              setBirthdayInput(profile.birthday || '');
              setIsEditing(true);
            }}>
              Змінити дату
            </Button>
          </>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Вкажіть вашу дату народження, щоб отримати персональний промокод у ваш особливий день! 🎁
            </p>
            <div className="space-y-2">
              <Label htmlFor="birthday">Дата народження</Label>
              <Input
                id="birthday"
                type="date"
                value={birthdayInput}
                onChange={(e) => setBirthdayInput(e.target.value)}
                max={new Date().toISOString().split('T')[0]}
              />
            </div>
            <div className="flex gap-2">
              <Button 
                onClick={handleSaveBirthday}
                disabled={updateBirthdayMutation.isPending}
              >
                {updateBirthdayMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : null}
                Зберегти
              </Button>
              {isEditing && (
                <Button variant="outline" onClick={() => setIsEditing(false)}>
                  Скасувати
                </Button>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default BirthdayCard;
