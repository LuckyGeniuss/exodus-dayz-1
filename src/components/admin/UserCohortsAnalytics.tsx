import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, Users, TrendingUp, Calendar, UserCheck } from 'lucide-react';
import { format, subDays, startOfWeek, startOfMonth, eachDayOfInterval, eachWeekOfInterval } from 'date-fns';
import { uk } from 'date-fns/locale';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from 'recharts';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

const UserCohortsAnalytics = () => {
  const { data: cohortData, isLoading } = useQuery({
    queryKey: ['user-cohorts'],
    queryFn: async () => {
      const thirtyDaysAgo = subDays(new Date(), 30).toISOString();
      const ninetyDaysAgo = subDays(new Date(), 90).toISOString();

      // Fetch users and orders
      const [usersRes, ordersRes] = await Promise.all([
        supabase.from('profiles').select('id, created_at, total_spent').order('created_at', { ascending: true }),
        supabase.from('orders').select('user_id, created_at, payment_status, final_amount').eq('payment_status', 'completed')
      ]);

      const users = usersRes.data || [];
      const orders = ordersRes.data || [];

      // Weekly cohorts (last 8 weeks)
      const weeks = eachWeekOfInterval({
        start: subDays(new Date(), 56),
        end: new Date()
      }, { weekStartsOn: 1 });

      interface CohortData {
        week: string;
        users: number;
        week0: number;
        week1: number;
        week2: number;
        week3: number;
        week4: number;
      }

      const cohorts: CohortData[] = weeks.map((weekStart, weekIndex) => {
        const weekEnd = subDays(weeks[weekIndex + 1] || new Date(), 1);
        
        // Users who registered this week
        const cohortUsers = users.filter(u => {
          const created = new Date(u.created_at);
          return created >= weekStart && created <= weekEnd;
        });

        // Retention per week
        const retention: Record<string, number> = { week0: 0, week1: 0, week2: 0, week3: 0, week4: 0 };
        
        for (let w = 0; w <= 4; w++) {
          const checkWeekStart = subDays(new Date(), (4 - w) * 7);
          const checkWeekEnd = subDays(new Date(), (3 - w) * 7);
          
          if (checkWeekStart < weekStart) continue;
          
          const activeUsers = cohortUsers.filter(u => {
            return orders.some(o => 
              o.user_id === u.id && 
              new Date(o.created_at) >= checkWeekStart && 
              new Date(o.created_at) < checkWeekEnd
            );
          });
          
          retention[`week${w}`] = cohortUsers.length > 0 
            ? Math.round((activeUsers.length / cohortUsers.length) * 100) 
            : 0;
        }

        return {
          week: format(weekStart, 'dd.MM', { locale: uk }),
          users: cohortUsers.length,
          week0: retention.week0,
          week1: retention.week1,
          week2: retention.week2,
          week3: retention.week3,
          week4: retention.week4
        };
      }).filter(c => c.users > 0);

      // Daily active users (last 30 days)
      const days = eachDayOfInterval({
        start: subDays(new Date(), 29),
        end: new Date()
      });

      const dailyActive = days.map(day => {
        const dayStr = format(day, 'yyyy-MM-dd');
        const activeUsers = new Set(
          orders
            .filter(o => format(new Date(o.created_at), 'yyyy-MM-dd') === dayStr)
            .map(o => o.user_id)
        ).size;
        
        const newUsers = users.filter(u => 
          format(new Date(u.created_at), 'yyyy-MM-dd') === dayStr
        ).length;

        return {
          date: format(day, 'dd.MM', { locale: uk }),
          activeUsers,
          newUsers
        };
      });

      // Customer segments
      const totalUsers = users.length;
      const payingUsers = new Set(orders.map(o => o.user_id)).size;
      const recentActive = new Set(
        orders
          .filter(o => new Date(o.created_at) >= new Date(thirtyDaysAgo))
          .map(o => o.user_id)
      ).size;
      
      // User lifetime value segments
      const userSpending = users.map(u => {
        const userOrders = orders.filter(o => o.user_id === u.id);
        const totalSpent = userOrders.reduce((sum, o) => sum + Number(o.final_amount || 0), 0);
        const orderCount = userOrders.length;
        return { ...u, totalSpent, orderCount };
      });

      const segments = {
        vip: userSpending.filter(u => u.totalSpent >= 5000).length,
        loyal: userSpending.filter(u => u.totalSpent >= 1000 && u.totalSpent < 5000).length,
        regular: userSpending.filter(u => u.totalSpent >= 100 && u.totalSpent < 1000).length,
        newCustomers: userSpending.filter(u => u.orderCount === 1).length,
        inactive: userSpending.filter(u => u.orderCount === 0).length
      };

      const segmentData = [
        { name: 'VIP (5000+₴)', value: segments.vip, color: '#FFD700' },
        { name: 'Лояльні (1000-5000₴)', value: segments.loyal, color: '#00C49F' },
        { name: 'Звичайні (100-1000₴)', value: segments.regular, color: '#0088FE' },
        { name: 'Нові (1 замовлення)', value: segments.newCustomers, color: '#FFBB28' },
        { name: 'Неактивні', value: segments.inactive, color: '#999999' }
      ];

      return {
        cohorts: cohorts.slice(-6),
        dailyActive,
        summary: {
          totalUsers,
          payingUsers,
          conversionRate: totalUsers > 0 ? ((payingUsers / totalUsers) * 100).toFixed(1) : 0,
          recentActive,
          avgOrdersPerUser: payingUsers > 0 ? (orders.length / payingUsers).toFixed(1) : 0
        },
        segmentData
      };
    }
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="h-4 w-4" />
              Всього користувачів
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{cohortData?.summary.totalUsers}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <UserCheck className="h-4 w-4" />
              Платних клієнтів
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{cohortData?.summary.payingUsers}</div>
            <p className="text-xs text-muted-foreground">
              {cohortData?.summary.conversionRate}% конверсія
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Активних (30д)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{cohortData?.summary.recentActive}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Сер. замовлень/клієнт
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{cohortData?.summary.avgOrdersPerUser}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Active Users */}
        <Card>
          <CardHeader>
            <CardTitle>Активність користувачів (30 днів)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={cohortData?.dailyActive}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="date" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Legend />
                  <Area type="monotone" dataKey="activeUsers" name="Активні" fill="hsl(var(--primary))" stroke="hsl(var(--primary))" fillOpacity={0.3} />
                  <Area type="monotone" dataKey="newUsers" name="Нові" fill="#00C49F" stroke="#00C49F" fillOpacity={0.3} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Customer Segments */}
        <Card>
          <CardHeader>
            <CardTitle>Сегменти клієнтів</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={cohortData?.segmentData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" width={140} className="text-xs" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Bar dataKey="value" name="Користувачів" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Retention Cohort Table */}
      <Card>
        <CardHeader>
          <CardTitle>Когортний аналіз утримання</CardTitle>
          <CardDescription>Відсоток користувачів, що повернулись на наступних тижнях</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Тиждень реєстрації</TableHead>
                <TableHead className="text-center">Користувачів</TableHead>
                <TableHead className="text-center">Тиждень 0</TableHead>
                <TableHead className="text-center">Тиждень 1</TableHead>
                <TableHead className="text-center">Тиждень 2</TableHead>
                <TableHead className="text-center">Тиждень 3</TableHead>
                <TableHead className="text-center">Тиждень 4</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {cohortData?.cohorts.map((cohort, index) => (
                <TableRow key={index}>
                  <TableCell className="font-medium">{cohort.week}</TableCell>
                  <TableCell className="text-center">{cohort.users}</TableCell>
                  <TableCell className="text-center">
                    <span className={`px-2 py-1 rounded ${
                      (cohort.week0 || 0) >= 50 ? 'bg-green-500/20 text-green-500' :
                      (cohort.week0 || 0) >= 25 ? 'bg-yellow-500/20 text-yellow-500' :
                      'bg-red-500/20 text-red-500'
                    }`}>
                      {cohort.week0 || 0}%
                    </span>
                  </TableCell>
                  <TableCell className="text-center">
                    <span className={`px-2 py-1 rounded ${
                      (cohort.week1 || 0) >= 30 ? 'bg-green-500/20 text-green-500' :
                      (cohort.week1 || 0) >= 15 ? 'bg-yellow-500/20 text-yellow-500' :
                      'bg-muted text-muted-foreground'
                    }`}>
                      {cohort.week1 || '-'}%
                    </span>
                  </TableCell>
                  <TableCell className="text-center">
                    <span className="px-2 py-1 rounded bg-muted text-muted-foreground">
                      {cohort.week2 || '-'}%
                    </span>
                  </TableCell>
                  <TableCell className="text-center">
                    <span className="px-2 py-1 rounded bg-muted text-muted-foreground">
                      {cohort.week3 || '-'}%
                    </span>
                  </TableCell>
                  <TableCell className="text-center">
                    <span className="px-2 py-1 rounded bg-muted text-muted-foreground">
                      {cohort.week4 || '-'}%
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default UserCohortsAnalytics;
