import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Loader2, Search, UserPlus, Shield, ShieldCheck, ShieldAlert, Crown, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/components/auth/AuthProvider';
import { Database } from '@/integrations/supabase/types';

type AppRole = Database['public']['Enums']['app_role'];

interface UserWithRoles {
  id: string;
  username: string;
  steam_id: string | null;
  is_banned: boolean;
  created_at: string;
  roles: AppRole[];
}

const ROLE_INFO: Record<AppRole, { label: string; icon: React.ReactNode; color: string }> = {
  user: { label: 'Користувач', icon: <Shield className="h-4 w-4" />, color: 'bg-muted' },
  veteran: { label: 'Ветеран', icon: <ShieldCheck className="h-4 w-4" />, color: 'bg-green-500/20 text-green-600' },
  moderator: { label: 'Модератор', icon: <ShieldAlert className="h-4 w-4" />, color: 'bg-blue-500/20 text-blue-600' },
  admin: { label: 'Адмін', icon: <Crown className="h-4 w-4" />, color: 'bg-amber-500/20 text-amber-600' },
  super_admin: { label: 'Супер Адмін', icon: <Crown className="h-4 w-4" />, color: 'bg-red-500/20 text-red-600' },
};

const RoleManagement = () => {
  const { user: currentUser } = useAuth();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddRoleDialogOpen, setIsAddRoleDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserWithRoles | null>(null);
  const [selectedRole, setSelectedRole] = useState<AppRole>('user');

  const { data: usersWithRoles, isLoading } = useQuery({
    queryKey: ['users-with-roles'],
    queryFn: async () => {
      // Get all profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, username, steam_id, is_banned, created_at')
        .order('created_at', { ascending: false });

      if (profilesError) throw profilesError;

      // Get all roles
      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role');

      if (rolesError) throw rolesError;

      // Combine data
      const usersWithRoles: UserWithRoles[] = (profiles || []).map(profile => ({
        ...profile,
        is_banned: profile.is_banned || false,
        roles: (roles || [])
          .filter(r => r.user_id === profile.id)
          .map(r => r.role as AppRole),
      }));

      return usersWithRoles;
    },
  });

  const addRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: AppRole }) => {
      // Log the action
      await supabase.from('admin_audit_logs').insert({
        admin_id: currentUser?.id,
        action: 'add_role',
        target_type: 'user_roles',
        target_id: userId,
        new_value: { role },
      });

      const { error } = await supabase
        .from('user_roles')
        .insert({ user_id: userId, role });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users-with-roles'] });
      toast.success('Роль успішно додано');
      setIsAddRoleDialogOpen(false);
    },
    onError: (error: any) => {
      if (error.code === '23505') {
        toast.error('Користувач вже має цю роль');
      } else {
        toast.error('Помилка додавання ролі: ' + error.message);
      }
    },
  });

  const removeRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: AppRole }) => {
      // Log the action
      await supabase.from('admin_audit_logs').insert({
        admin_id: currentUser?.id,
        action: 'remove_role',
        target_type: 'user_roles',
        target_id: userId,
        old_value: { role },
      });

      const { error } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId)
        .eq('role', role);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users-with-roles'] });
      toast.success('Роль успішно видалено');
    },
    onError: (error) => {
      toast.error('Помилка видалення ролі: ' + error.message);
    },
  });

  const filteredUsers = usersWithRoles?.filter(user => 
    user.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.steam_id?.includes(searchQuery) ||
    user.id.includes(searchQuery)
  );

  const handleAddRole = (user: UserWithRoles) => {
    setSelectedUser(user);
    setSelectedRole('user');
    setIsAddRoleDialogOpen(true);
  };

  const handleRemoveRole = (userId: string, role: AppRole) => {
    if (role === 'user') {
      toast.error('Неможливо видалити базову роль користувача');
      return;
    }
    if (userId === currentUser?.id && role === 'admin') {
      toast.error('Ви не можете видалити свою роль адміна');
      return;
    }
    removeRoleMutation.mutate({ userId, role });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Управління ролями
        </CardTitle>
        <CardDescription>
          Призначення ролей: admin, moderator, veteran, user
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
              <TableHead>Ролі</TableHead>
              <TableHead>Статус</TableHead>
              <TableHead className="text-right">Дії</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers?.map((user) => (
              <TableRow key={user.id} className={user.is_banned ? 'opacity-50' : ''}>
                <TableCell className="font-medium">{user.username || 'N/A'}</TableCell>
                <TableCell className="font-mono text-sm">{user.steam_id || 'N/A'}</TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {user.roles.map((role) => (
                      <Badge 
                        key={role} 
                        className={`${ROLE_INFO[role].color} cursor-pointer hover:opacity-80`}
                        onClick={() => handleRemoveRole(user.id, role)}
                      >
                        {ROLE_INFO[role].icon}
                        <span className="ml-1">{ROLE_INFO[role].label}</span>
                        {role !== 'user' && <Trash2 className="ml-1 h-3 w-3" />}
                      </Badge>
                    ))}
                  </div>
                </TableCell>
                <TableCell>
                  {user.is_banned ? (
                    <Badge variant="destructive">Заблокований</Badge>
                  ) : (
                    <Badge variant="outline" className="text-green-600">Активний</Badge>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleAddRole(user)}
                  >
                    <UserPlus className="h-4 w-4 mr-1" />
                    Додати роль
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {filteredUsers?.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            Користувачів не знайдено
          </div>
        )}

        <Dialog open={isAddRoleDialogOpen} onOpenChange={setIsAddRoleDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Додати роль</DialogTitle>
              <DialogDescription>
                Користувач: {selectedUser?.username}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Роль</Label>
                <Select value={selectedRole} onValueChange={(v) => setSelectedRole(v as AppRole)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Оберіть роль" />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.keys(ROLE_INFO) as AppRole[]).map((role) => (
                      <SelectItem 
                        key={role} 
                        value={role}
                        disabled={selectedUser?.roles.includes(role)}
                      >
                        <div className="flex items-center gap-2">
                          {ROLE_INFO[role].icon}
                          {ROLE_INFO[role].label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="p-3 rounded-lg bg-muted/50 text-sm">
                <strong>Опис ролей:</strong>
                <ul className="mt-2 space-y-1 text-muted-foreground">
                  <li>• <strong>user</strong> - базова роль (за замовчуванням)</li>
                  <li>• <strong>veteran</strong> - ветеран АТО/ООС (знижки)</li>
                  <li>• <strong>moderator</strong> - модератор (обмежений доступ до адмінки)</li>
                  <li>• <strong>admin</strong> - повний доступ до адмін-панелі</li>
                </ul>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddRoleDialogOpen(false)}>
                Скасувати
              </Button>
              <Button 
                onClick={() => selectedUser && addRoleMutation.mutate({ userId: selectedUser.id, role: selectedRole })}
                disabled={addRoleMutation.isPending}
              >
                {addRoleMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Додати
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};

export default RoleManagement;
