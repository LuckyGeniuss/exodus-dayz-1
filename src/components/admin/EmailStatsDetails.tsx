import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Mail, Eye, MousePointerClick, Users, TrendingUp, BarChart3 } from 'lucide-react';
import { format } from 'date-fns';
import { uk } from 'date-fns/locale';
import { Progress } from '@/components/ui/progress';

interface EmailCampaign {
  id: string;
  name: string;
  subject: string;
  status: string | null;
  sent_at: string | null;
  created_at: string | null;
  total_recipients: number | null;
  total_sent: number | null;
  total_opened: number | null;
  total_clicked: number | null;
}

const EmailStatsDetails = () => {
  const { data: campaigns, isLoading } = useQuery({
    queryKey: ['email-campaigns-stats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('email_campaigns')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      return data as EmailCampaign[];
    },
  });

  // Calculate aggregate stats
  const aggregateStats = campaigns?.reduce(
    (acc, campaign) => ({
      totalSent: acc.totalSent + (campaign.total_sent || 0),
      totalOpened: acc.totalOpened + (campaign.total_opened || 0),
      totalClicked: acc.totalClicked + (campaign.total_clicked || 0),
      totalRecipients: acc.totalRecipients + (campaign.total_recipients || 0),
    }),
    { totalSent: 0, totalOpened: 0, totalClicked: 0, totalRecipients: 0 }
  ) || { totalSent: 0, totalOpened: 0, totalClicked: 0, totalRecipients: 0 };

  const overallOpenRate = aggregateStats.totalSent > 0 
    ? ((aggregateStats.totalOpened / aggregateStats.totalSent) * 100).toFixed(1)
    : '0';
    
  const overallClickRate = aggregateStats.totalOpened > 0 
    ? ((aggregateStats.totalClicked / aggregateStats.totalOpened) * 100).toFixed(1)
    : '0';

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-24 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Відправлено
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{aggregateStats.totalSent}</div>
            <p className="text-xs text-muted-foreground">всього листів</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Eye className="h-4 w-4 text-blue-500" />
              Відкрито
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-500">{aggregateStats.totalOpened}</div>
            <p className="text-xs text-muted-foreground">{overallOpenRate}% open rate</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <MousePointerClick className="h-4 w-4 text-green-500" />
              Кліків
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">{aggregateStats.totalClicked}</div>
            <p className="text-xs text-muted-foreground">{overallClickRate}% click rate</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-orange-500" />
              Конверсія
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-500">
              {aggregateStats.totalSent > 0 
                ? ((aggregateStats.totalClicked / aggregateStats.totalSent) * 100).toFixed(1)
                : '0'}%
            </div>
            <p className="text-xs text-muted-foreground">загальна</p>
          </CardContent>
        </Card>
      </div>

      {/* Campaigns Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Статистика по кампаніям
          </CardTitle>
          <CardDescription>
            Детальна інформація про кожну email-розсилку
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!campaigns || campaigns.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Mail className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Кампаній поки немає</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Кампанія</TableHead>
                  <TableHead>Дата</TableHead>
                  <TableHead>Статус</TableHead>
                  <TableHead>Відправлено</TableHead>
                  <TableHead>Відкрито</TableHead>
                  <TableHead>Кліків</TableHead>
                  <TableHead>Open Rate</TableHead>
                  <TableHead>Click Rate</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {campaigns.map((campaign) => {
                  const openRate = campaign.total_sent && campaign.total_sent > 0
                    ? ((campaign.total_opened || 0) / campaign.total_sent) * 100
                    : 0;
                  const clickRate = campaign.total_opened && campaign.total_opened > 0
                    ? ((campaign.total_clicked || 0) / campaign.total_opened) * 100
                    : 0;

                  return (
                    <TableRow key={campaign.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{campaign.name}</div>
                          <div className="text-sm text-muted-foreground truncate max-w-[200px]">
                            {campaign.subject}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {campaign.sent_at ? (
                          format(new Date(campaign.sent_at), 'dd.MM.yyyy HH:mm', { locale: uk })
                        ) : campaign.created_at ? (
                          format(new Date(campaign.created_at), 'dd.MM.yyyy', { locale: uk })
                        ) : '—'}
                      </TableCell>
                      <TableCell>
                        <Badge variant={
                          campaign.status === 'sent' ? 'default' :
                          campaign.status === 'draft' ? 'secondary' :
                          'outline'
                        }>
                          {campaign.status === 'sent' ? 'Надіслано' :
                           campaign.status === 'draft' ? 'Чернетка' :
                           campaign.status || 'Невідомо'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          {campaign.total_sent || 0}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Eye className="h-4 w-4 text-blue-500" />
                          <span className="text-blue-500 font-medium">{campaign.total_opened || 0}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <MousePointerClick className="h-4 w-4 text-green-500" />
                          <span className="text-green-500 font-medium">{campaign.total_clicked || 0}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <span className="text-sm font-medium">{openRate.toFixed(1)}%</span>
                          <Progress value={openRate} className="h-1.5" />
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <span className="text-sm font-medium">{clickRate.toFixed(1)}%</span>
                          <Progress value={clickRate} className="h-1.5" />
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default EmailStatsDetails;
