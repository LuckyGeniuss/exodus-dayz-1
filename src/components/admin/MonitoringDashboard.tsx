import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, RefreshCw, AlertTriangle, CheckCircle, XCircle, Activity, Clock, Server } from 'lucide-react';
import { format, subHours, subDays } from 'date-fns';
import { uk } from 'date-fns/locale';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const MonitoringDashboard = () => {
  const { data: logs, isLoading, refetch } = useQuery({
    queryKey: ['edge-function-logs'],
    queryFn: async () => {
      const twentyFourHoursAgo = subHours(new Date(), 24).toISOString();
      
      const { data, error } = await supabase
        .from('edge_function_logs')
        .select('*')
        .gte('created_at', twentyFourHoursAgo)
        .order('created_at', { ascending: false })
        .limit(500);

      if (error) throw error;
      return data || [];
    },
    refetchInterval: 30000, // Auto-refresh every 30 seconds
  });

  const { data: rateLimitLogs } = useQuery({
    queryKey: ['rate-limit-logs'],
    queryFn: async () => {
      const oneHourAgo = subHours(new Date(), 1).toISOString();
      
      const { data, error } = await supabase
        .from('rate_limit_log')
        .select('*')
        .gte('created_at', oneHourAgo)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    refetchInterval: 30000,
  });

  // Calculate stats
  const stats = logs ? {
    total: logs.length,
    success: logs.filter(l => l.status === 'success').length,
    errors: logs.filter(l => l.status === 'error').length,
    avgDuration: logs.length > 0 
      ? Math.round(logs.reduce((sum, l) => sum + (l.duration_ms || 0), 0) / logs.length)
      : 0,
  } : { total: 0, success: 0, errors: 0, avgDuration: 0 };

  // Group by function name
  const byFunction = logs?.reduce((acc, log) => {
    const name = log.function_name;
    if (!acc[name]) {
      acc[name] = { total: 0, errors: 0, avgDuration: 0, durations: [] };
    }
    acc[name].total++;
    if (log.status === 'error') acc[name].errors++;
    acc[name].durations.push(log.duration_ms || 0);
    return acc;
  }, {} as Record<string, { total: number; errors: number; avgDuration: number; durations: number[] }>);

  // Calculate average durations
  Object.values(byFunction || {}).forEach((fn: any) => {
    fn.avgDuration = Math.round(fn.durations.reduce((a: number, b: number) => a + b, 0) / fn.durations.length);
  });

  // Time series data (last 24 hours, hourly)
  const timeSeriesData = Array.from({ length: 24 }, (_, i) => {
    const hour = subHours(new Date(), 23 - i);
    const hourStr = format(hour, 'HH:00');
    const hourStart = new Date(hour).setMinutes(0, 0, 0);
    const hourEnd = hourStart + 3600000;
    
    const hourLogs = logs?.filter(l => {
      const logTime = new Date(l.created_at).getTime();
      return logTime >= hourStart && logTime < hourEnd;
    }) || [];

    return {
      hour: hourStr,
      requests: hourLogs.length,
      errors: hourLogs.filter(l => l.status === 'error').length,
    };
  });

  // Error breakdown by type
  const errorsByMessage = logs?.filter(l => l.status === 'error')
    .reduce((acc, log) => {
      const msg = log.error_message || 'Unknown';
      acc[msg] = (acc[msg] || 0) + 1;
      return acc;
    }, {} as Record<string, number>) || {};

  const errorData = Object.entries(errorsByMessage)
    .map(([message, count]) => ({ message: message.slice(0, 30), count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Моніторинг системи</h2>
          <p className="text-muted-foreground">Останні 24 години</p>
        </div>
        <Button onClick={() => refetch()} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Оновити
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Всього запитів
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              Успішних
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">{stats.success}</div>
            <p className="text-xs text-muted-foreground">
              {stats.total > 0 ? ((stats.success / stats.total) * 100).toFixed(1) : 0}%
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <XCircle className="h-4 w-4 text-destructive" />
              Помилок
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{stats.errors}</div>
            <p className="text-xs text-muted-foreground">
              {stats.total > 0 ? ((stats.errors / stats.total) * 100).toFixed(1) : 0}%
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Сер. час відповіді
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.avgDuration} ms</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Огляд</TabsTrigger>
          <TabsTrigger value="functions">Функції</TabsTrigger>
          <TabsTrigger value="errors">Помилки</TabsTrigger>
          <TabsTrigger value="ratelimit">Rate Limiting</TabsTrigger>
          <TabsTrigger value="logs">Логи</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Запити за годину</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={timeSeriesData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="hour" className="text-xs" />
                    <YAxis className="text-xs" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                    />
                    <Line type="monotone" dataKey="requests" name="Запити" stroke="hsl(var(--primary))" strokeWidth={2} />
                    <Line type="monotone" dataKey="errors" name="Помилки" stroke="hsl(var(--destructive))" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="functions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Статистика по функціях</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(byFunction || {}).map(([name, data]: [string, any]) => (
                  <div key={name} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Server className="h-5 w-5 text-primary" />
                      <div>
                        <p className="font-medium">{name}</p>
                        <p className="text-sm text-muted-foreground">{data.total} запитів</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-sm">Помилок: <span className="text-destructive">{data.errors}</span></p>
                        <p className="text-xs text-muted-foreground">Сер. час: {data.avgDuration}ms</p>
                      </div>
                      <Badge variant={data.errors > 0 ? "destructive" : "secondary"}>
                        {((1 - data.errors / data.total) * 100).toFixed(0)}%
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="errors" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Топ помилок</CardTitle>
            </CardHeader>
            <CardContent>
              {errorData.length > 0 ? (
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={errorData} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis type="number" />
                      <YAxis dataKey="message" type="category" width={150} className="text-xs" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px'
                        }}
                      />
                      <Bar dataKey="count" name="Кількість" fill="hsl(var(--destructive))" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckCircle className="h-12 w-12 mx-auto mb-2 text-green-500" />
                  <p>Немає помилок за останні 24 години</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ratelimit" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Rate Limiting (остання година)</CardTitle>
              <CardDescription>Запити, що потрапили під обмеження</CardDescription>
            </CardHeader>
            <CardContent>
              {rateLimitLogs && rateLimitLogs.length > 0 ? (
                <div className="space-y-2">
                  {rateLimitLogs.slice(0, 20).map((log) => (
                    <div key={log.id} className="flex items-center justify-between p-2 bg-muted/50 rounded">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-yellow-500" />
                        <span className="text-sm">{log.endpoint}</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-xs text-muted-foreground">{log.ip_address}</span>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(log.created_at), 'HH:mm:ss', { locale: uk })}
                        </span>
                        <Badge variant="outline">{log.request_count} запитів</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckCircle className="h-12 w-12 mx-auto mb-2 text-green-500" />
                  <p>Немає обмежених запитів</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="logs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Останні логи</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px]">
                <div className="space-y-2">
                  {logs?.slice(0, 100).map((log) => (
                    <div 
                      key={log.id} 
                      className={`p-3 rounded-lg border ${
                        log.status === 'error' ? 'border-destructive/50 bg-destructive/5' : 'border-border bg-muted/30'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          {log.status === 'success' ? (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          ) : (
                            <XCircle className="h-4 w-4 text-destructive" />
                          )}
                          <span className="font-medium">{log.function_name}</span>
                          <Badge variant="outline" className="text-xs">{log.operation}</Badge>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(log.created_at), 'dd.MM HH:mm:ss', { locale: uk })}
                        </span>
                      </div>
                      {log.error_message && (
                        <p className="text-sm text-destructive mt-1">{log.error_message}</p>
                      )}
                      <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                        <span>{log.duration_ms}ms</span>
                        <span>{log.ip_address}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default MonitoringDashboard;
