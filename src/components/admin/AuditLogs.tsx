import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, History, RefreshCw, Search } from 'lucide-react';
import { useState } from 'react';

interface AuditLog {
  id: string;
  admin_id: string;
  action: string;
  target_type: string;
  target_id: string | null;
  old_value: any;
  new_value: any;
  ip_address: string | null;
  created_at: string;
  admin_username?: string;
}

const ACTION_LABELS: Record<string, { label: string; color: string }> = {
  add_role: { label: 'Додано роль', color: 'bg-green-500/20 text-green-600' },
  remove_role: { label: 'Видалено роль', color: 'bg-red-500/20 text-red-600' },
  ban_user: { label: 'Заблоковано', color: 'bg-red-500/20 text-red-600' },
  unban_user: { label: 'Розблоковано', color: 'bg-green-500/20 text-green-600' },
  update_balance: { label: 'Оновлено баланс', color: 'bg-blue-500/20 text-blue-600' },
  update_order: { label: 'Оновлено замовлення', color: 'bg-amber-500/20 text-amber-600' },
  update_setting: { label: 'Оновлено налаштування', color: 'bg-purple-500/20 text-purple-600' },
  create_promo: { label: 'Створено промокод', color: 'bg-green-500/20 text-green-600' },
  delete_promo: { label: 'Видалено промокод', color: 'bg-red-500/20 text-red-600' },
};

const AuditLogs = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [actionFilter, setActionFilter] = useState<string>('all');

  const { data: logs, isLoading, refetch } = useQuery({
    queryKey: ['admin-audit-logs'],
    queryFn: async () => {
      const { data: logsData, error: logsError } = await supabase
        .from('admin_audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (logsError) throw logsError;

      // Get admin usernames
      const adminIds = [...new Set(logsData?.map(l => l.admin_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, username')
        .in('id', adminIds);

      const profilesMap = new Map(profiles?.map(p => [p.id, p.username]));

      return (logsData || []).map(log => ({
        ...log,
        admin_username: profilesMap.get(log.admin_id) || 'Unknown',
      })) as AuditLog[];
    },
  });

  const filteredLogs = logs?.filter(log => {
    const matchesSearch = 
      log.admin_username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.target_id?.includes(searchQuery) ||
      log.action.includes(searchQuery);
    
    const matchesAction = actionFilter === 'all' || log.action === actionFilter;

    return matchesSearch && matchesAction;
  });

  const formatValue = (value: any) => {
    if (!value) return '-';
    if (typeof value === 'object') {
      return JSON.stringify(value, null, 2);
    }
    return String(value);
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
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              Аудит-логи
            </CardTitle>
            <CardDescription>
              Історія дій адміністраторів (останні 100)
            </CardDescription>
          </div>
          <Button variant="outline" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Оновити
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Пошук за адміном, ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={actionFilter} onValueChange={setActionFilter}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Всі дії" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Всі дії</SelectItem>
              {Object.entries(ACTION_LABELS).map(([key, { label }]) => (
                <SelectItem key={key} value={key}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="rounded-lg border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Дата</TableHead>
                <TableHead>Адмін</TableHead>
                <TableHead>Дія</TableHead>
                <TableHead>Об'єкт</TableHead>
                <TableHead>Деталі</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLogs?.map((log) => {
                const actionInfo = ACTION_LABELS[log.action] || { label: log.action, color: 'bg-muted' };
                
                return (
                  <TableRow key={log.id}>
                    <TableCell className="whitespace-nowrap">
                      {new Date(log.created_at).toLocaleString('uk-UA')}
                    </TableCell>
                    <TableCell className="font-medium">
                      {log.admin_username}
                    </TableCell>
                    <TableCell>
                      <Badge className={actionInfo.color}>
                        {actionInfo.label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div className="text-muted-foreground">{log.target_type}</div>
                        <div className="font-mono text-xs">{log.target_id?.slice(0, 8) || '-'}</div>
                      </div>
                    </TableCell>
                    <TableCell className="max-w-[200px]">
                      {log.new_value && (
                        <code className="text-xs bg-muted px-1 py-0.5 rounded block truncate">
                          {formatValue(log.new_value)}
                        </code>
                      )}
                      {log.old_value && (
                        <code className="text-xs bg-muted/50 px-1 py-0.5 rounded block truncate mt-1 line-through">
                          {formatValue(log.old_value)}
                        </code>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>

        {filteredLogs?.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            Логів не знайдено
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AuditLogs;
