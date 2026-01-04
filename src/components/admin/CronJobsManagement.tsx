import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Clock, Play, RefreshCw, CheckCircle, XCircle, AlertCircle, Loader2, Bell, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { uk } from 'date-fns/locale';

interface CronJob {
  id: string;
  name: string;
  description: string | null;
  schedule: string;
  function_name: string;
  is_enabled: boolean;
  last_run_at: string | null;
  last_status: string | null;
  created_at: string;
}

interface NotificationLog {
  id: string;
  type: string;
  recipients_count: number;
  sent_count: number;
  failed_count: number;
  details: Record<string, unknown>;
  created_at: string;
  completed_at: string | null;
}

const CronJobsManagement = () => {
  const queryClient = useQueryClient();
  const [runningJob, setRunningJob] = useState<string | null>(null);

  const { data: cronJobs, isLoading: jobsLoading } = useQuery({
    queryKey: ['cron-jobs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cron_jobs')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as CronJob[];
    },
  });

  const { data: notificationLogs, isLoading: logsLoading } = useQuery({
    queryKey: ['notification-logs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('notification_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);
      
      if (error) throw error;
      return data as NotificationLog[];
    },
  });

  const toggleJobMutation = useMutation({
    mutationFn: async ({ id, is_enabled }: { id: string; is_enabled: boolean }) => {
      const { error } = await supabase
        .from('cron_jobs')
        .update({ is_enabled, updated_at: new Date().toISOString() })
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cron-jobs'] });
      toast.success('Статус задачі оновлено');
    },
    onError: () => {
      toast.error('Помилка оновлення статусу');
    },
  });

  const runJobNow = async (job: CronJob) => {
    setRunningJob(job.id);
    
    try {
      const { error } = await supabase.functions.invoke(job.function_name);
      
      if (error) throw error;

      // Update last run time
      await supabase
        .from('cron_jobs')
        .update({ 
          last_run_at: new Date().toISOString(),
          last_status: 'success',
          updated_at: new Date().toISOString(),
        })
        .eq('id', job.id);

      queryClient.invalidateQueries({ queryKey: ['cron-jobs'] });
      queryClient.invalidateQueries({ queryKey: ['notification-logs'] });
      toast.success(`Задача "${job.name}" виконана успішно`);
    } catch (error) {
      // Update with error status
      await supabase
        .from('cron_jobs')
        .update({ 
          last_run_at: new Date().toISOString(),
          last_status: 'error',
          updated_at: new Date().toISOString(),
        })
        .eq('id', job.id);

      queryClient.invalidateQueries({ queryKey: ['cron-jobs'] });
      toast.error('Помилка виконання задачі');
    } finally {
      setRunningJob(null);
    }
  };

  const parseSchedule = (schedule: string): string => {
    const parts = schedule.split(' ');
    if (parts.length !== 5) return schedule;

    const [minute, hour, day, month, weekday] = parts;

    if (minute === '0' && hour.startsWith('*/')) {
      return `Кожні ${hour.replace('*/', '')} годин`;
    }
    if (minute === '*' && hour === '*') {
      return 'Щохвилини';
    }
    if (minute.startsWith('*/')) {
      return `Кожні ${minute.replace('*/', '')} хвилин`;
    }
    if (hour === '*' && minute !== '*') {
      return `Щогодини о :${minute.padStart(2, '0')}`;
    }
    if (day === '*' && month === '*' && weekday === '*') {
      return `Щодня о ${hour}:${minute.padStart(2, '0')}`;
    }

    return schedule;
  };

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case 'success':
        return <Badge className="bg-green-500/10 text-green-500"><CheckCircle className="h-3 w-3 mr-1" />Успішно</Badge>;
      case 'error':
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Помилка</Badge>;
      case 'running':
        return <Badge className="bg-blue-500/10 text-blue-500"><Loader2 className="h-3 w-3 mr-1 animate-spin" />Виконується</Badge>;
      default:
        return <Badge variant="secondary"><AlertCircle className="h-3 w-3 mr-1" />Не запускався</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="jobs">
        <TabsList>
          <TabsTrigger value="jobs" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Cron задачі
          </TabsTrigger>
          <TabsTrigger value="logs" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Логи сповіщень
          </TabsTrigger>
        </TabsList>

        <TabsContent value="jobs" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Заплановані задачі
              </CardTitle>
              <CardDescription>
                Управління автоматичними задачами системи
              </CardDescription>
            </CardHeader>
            <CardContent>
              {jobsLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : cronJobs?.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Немає запланованих задач
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Назва</TableHead>
                      <TableHead>Розклад</TableHead>
                      <TableHead>Функція</TableHead>
                      <TableHead>Останній запуск</TableHead>
                      <TableHead>Статус</TableHead>
                      <TableHead>Активна</TableHead>
                      <TableHead className="text-right">Дії</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {cronJobs?.map((job) => (
                      <TableRow key={job.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{job.name}</div>
                            {job.description && (
                              <div className="text-sm text-muted-foreground">{job.description}</div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="font-mono text-xs">
                            {parseSchedule(job.schedule)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <code className="text-xs bg-muted px-2 py-1 rounded">
                            {job.function_name}
                          </code>
                        </TableCell>
                        <TableCell>
                          {job.last_run_at ? (
                            <span className="text-sm">
                              {format(new Date(job.last_run_at), 'dd.MM.yyyy HH:mm', { locale: uk })}
                            </span>
                          ) : (
                            <span className="text-muted-foreground text-sm">—</span>
                          )}
                        </TableCell>
                        <TableCell>{getStatusBadge(job.last_status)}</TableCell>
                        <TableCell>
                          <Switch
                            checked={job.is_enabled}
                            onCheckedChange={(checked) => 
                              toggleJobMutation.mutate({ id: job.id, is_enabled: checked })
                            }
                          />
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => runJobNow(job)}
                            disabled={runningJob === job.id}
                          >
                            {runningJob === job.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Play className="h-4 w-4" />
                            )}
                            <span className="ml-2">Запустити</span>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="logs" className="mt-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  Логи відправки сповіщень
                </CardTitle>
                <CardDescription>
                  Історія відправлених email-сповіщень
                </CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => queryClient.invalidateQueries({ queryKey: ['notification-logs'] })}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Оновити
              </Button>
            </CardHeader>
            <CardContent>
              {logsLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : notificationLogs?.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Логів сповіщень поки немає
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Тип</TableHead>
                      <TableHead>Дата</TableHead>
                      <TableHead>Отримувачів</TableHead>
                      <TableHead>Відправлено</TableHead>
                      <TableHead>Помилок</TableHead>
                      <TableHead>Статус</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {notificationLogs?.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell>
                          <Badge variant="outline">{log.type}</Badge>
                        </TableCell>
                        <TableCell>
                          {format(new Date(log.created_at), 'dd.MM.yyyy HH:mm', { locale: uk })}
                        </TableCell>
                        <TableCell>{log.recipients_count}</TableCell>
                        <TableCell>
                          <span className="text-green-500 font-medium">{log.sent_count}</span>
                        </TableCell>
                        <TableCell>
                          {log.failed_count > 0 ? (
                            <span className="text-red-500 font-medium">{log.failed_count}</span>
                          ) : (
                            <span className="text-muted-foreground">0</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {log.completed_at ? (
                            <Badge className="bg-green-500/10 text-green-500">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Завершено
                            </Badge>
                          ) : (
                            <Badge className="bg-yellow-500/10 text-yellow-500">
                              <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                              В процесі
                            </Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CronJobsManagement;
