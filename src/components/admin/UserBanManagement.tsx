import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Loader2, Search, Ban, UserCheck, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/components/auth/AuthProvider';

interface UserProfile {
  id: string;
  username: string;
  steam_id: string | null;
  balance: number;
  is_banned: boolean;
  banned_at: string | null;
  banned_reason: string | null;
  created_at: string;
}

const UserBanManagement = () => {
  const { user: currentUser } = useAuth();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [isBanDialogOpen, setIsBanDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [banReason, setBanReason] = useState('');

  const { data: users, isLoading } = useQuery({
    queryKey: ['users-for-ban'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, username, steam_id, balance, is_banned, banned_at, banned_reason, created_at')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as UserProfile[];
    },
  });

  const banMutation = useMutation({
    mutationFn: async ({ userId, ban, reason }: { userId: string; ban: boolean; reason?: string }) => {
      // Log the action
      await supabase.from('admin_audit_logs').insert({
        admin_id: currentUser?.id,
        action: ban ? 'ban_user' : 'unban_user',
        target_type: 'profiles',
        target_id: userId,
        new_value: ban ? { reason } : null,
      });

      const { error } = await supabase
        .from('profiles')
        .update({
          is_banned: ban,
          banned_at: ban ? new Date().toISOString() : null,
          banned_reason: ban ? reason : null,
        })
        .eq('id', userId);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['users-for-ban'] });
      toast.success(variables.ban ? 'Користувача заблоковано' : 'Користувача розблоковано');
      setIsBanDialogOpen(false);
      setBanReason('');
    },
    onError: (error) => {
      toast.error('Помилка: ' + error.message);
    },
  });

  const filteredUsers = users?.filter(user =>
    user.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.steam_id?.includes(searchQuery) ||
    user.id.includes(searchQuery)
  );

  const handleBanClick = (user: UserProfile) => {
    if (user.id === currentUser?.id) {
      toast.error('Ви не можете заблокувати себе');
      return;
    }
    setSelectedUser(user);
    setBanReason('');
    setIsBanDialogOpen(true);
  };

  const handleUnban = (user: UserProfile) => {
    banMutation.mutate({ userId: user.id, ban: false });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const bannedCount = users?.filter(u => u.is_banned).length || 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Ban className="h-5 w-5" />
          Блокування користувачів
        </CardTitle>
        <CardDescription>
          Заблоковано: {bannedCount} користувачів
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Пошук за username, Steam ID або ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Користувач</TableHead>
              <TableHead>Steam ID</TableHead>
              <TableHead>Баланс</TableHead>
              <TableHead>Статус</TableHead>
              <TableHead>Причина</TableHead>
              <TableHead className="text-right">Дії</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers?.map((user) => (
              <TableRow key={user.id} className={user.is_banned ? 'bg-destructive/5' : ''}>
                <TableCell className="font-medium">{user.username || 'N/A'}</TableCell>
                <TableCell className="font-mono text-sm">{user.steam_id || 'N/A'}</TableCell>
                <TableCell>{user.balance?.toFixed(2)} ₴</TableCell>
                <TableCell>
                  {user.is_banned ? (
                    <Badge variant="destructive" className="flex items-center gap-1 w-fit">
                      <Ban className="h-3 w-3" />
                      Заблокований
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-green-600 flex items-center gap-1 w-fit">
                      <UserCheck className="h-3 w-3" />
                      Активний
                    </Badge>
                  )}
                </TableCell>
                <TableCell className="max-w-[200px] truncate">
                  {user.banned_reason || '-'}
                </TableCell>
                <TableCell className="text-right">
                  {user.is_banned ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleUnban(user)}
                      disabled={banMutation.isPending}
                    >
                      <UserCheck className="h-4 w-4 mr-1" />
                      Розблокувати
                    </Button>
                  ) : (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleBanClick(user)}
                      disabled={user.id === currentUser?.id}
                    >
                      <Ban className="h-4 w-4 mr-1" />
                      Заблокувати
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        <Dialog open={isBanDialogOpen} onOpenChange={setIsBanDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="h-5 w-5" />
                Заблокувати користувача
              </DialogTitle>
              <DialogDescription>
                Користувач: {selectedUser?.username}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="ban-reason">Причина блокування</Label>
                <Textarea
                  id="ban-reason"
                  placeholder="Вкажіть причину блокування..."
                  value={banReason}
                  onChange={(e) => setBanReason(e.target.value)}
                  rows={3}
                />
              </div>

              <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-sm">
                <strong className="text-destructive">Увага!</strong>
                <p className="mt-1 text-muted-foreground">
                  Заблокований користувач не зможе авторизуватись та створювати замовлення.
                </p>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsBanDialogOpen(false)}>
                Скасувати
              </Button>
              <Button
                variant="destructive"
                onClick={() => selectedUser && banMutation.mutate({
                  userId: selectedUser.id,
                  ban: true,
                  reason: banReason,
                })}
                disabled={banMutation.isPending || !banReason.trim()}
              >
                {banMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Заблокувати
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};

export default UserBanManagement;
