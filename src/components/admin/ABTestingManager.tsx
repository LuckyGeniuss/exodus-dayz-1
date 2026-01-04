import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Plus, FlaskConical, TrendingUp, Users, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';

interface ABTest {
  id: string;
  key: string;
  name: string;
  description: string;
  variant_a: string;
  variant_b: string;
  is_active: boolean;
  traffic_split: number;
  created_at: string;
  impressions_a?: number;
  impressions_b?: number;
  conversions_a?: number;
  conversions_b?: number;
}

const ABTestingManager = () => {
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [newTest, setNewTest] = useState({
    name: '',
    description: '',
    variant_a: 'Контроль (A)',
    variant_b: 'Варіант (B)',
    traffic_split: 50
  });

  // Since we don't have an ab_tests table yet, we'll use admin_settings to store tests
  const { data: tests, isLoading } = useQuery({
    queryKey: ['ab-tests'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('admin_settings')
        .select('*')
        .like('key', 'ab_test_%');

      if (error) throw error;
      
      return (data || []).map(setting => {
        const testData = JSON.parse(setting.value || '{}');
        return {
          id: setting.id,
          key: setting.key,
          ...testData
        } as ABTest;
      });
    }
  });

  const createTestMutation = useMutation({
    mutationFn: async (test: typeof newTest) => {
      const testId = `ab_test_${Date.now()}`;
      const testData: ABTest = {
        id: testId,
        key: testId,
        name: test.name,
        description: test.description,
        variant_a: test.variant_a,
        variant_b: test.variant_b,
        is_active: true,
        traffic_split: test.traffic_split,
        created_at: new Date().toISOString(),
        impressions_a: 0,
        impressions_b: 0,
        conversions_a: 0,
        conversions_b: 0
      };

      const { error } = await supabase
        .from('admin_settings')
        .insert({
          key: testId,
          value: JSON.stringify(testData),
          description: `A/B тест: ${test.name}`
        });

      if (error) throw error;
      return testData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ab-tests'] });
      toast.success('A/B тест створено');
      setIsOpen(false);
      setNewTest({
        name: '',
        description: '',
        variant_a: 'Контроль (A)',
        variant_b: 'Варіант (B)',
        traffic_split: 50
      });
    },
    onError: (error) => {
      toast.error('Помилка створення тесту');
      console.error(error);
    }
  });

  const toggleTestMutation = useMutation({
    mutationFn: async ({ id, isActive, key }: { id: string; isActive: boolean; key: string }) => {
      const { data: current } = await supabase
        .from('admin_settings')
        .select('value')
        .eq('key', key)
        .single();

      const testData = JSON.parse(current?.value || '{}');
      testData.is_active = isActive;

      const { error } = await supabase
        .from('admin_settings')
        .update({ value: JSON.stringify(testData) })
        .eq('key', key);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ab-tests'] });
      toast.success('Статус тесту оновлено');
    }
  });

  const calculateSignificance = (test: ABTest) => {
    const impressionsA = test.impressions_a || 0;
    const impressionsB = test.impressions_b || 0;
    const conversionsA = test.conversions_a || 0;
    const conversionsB = test.conversions_b || 0;

    if (impressionsA < 100 || impressionsB < 100) {
      return { significant: false, confidence: 0, winner: null };
    }

    const rateA = impressionsA > 0 ? conversionsA / impressionsA : 0;
    const rateB = impressionsB > 0 ? conversionsB / impressionsB : 0;
    
    // Simplified statistical significance (would need proper z-test in production)
    const diff = Math.abs(rateA - rateB);
    const pooledRate = (conversionsA + conversionsB) / (impressionsA + impressionsB);
    const se = Math.sqrt(pooledRate * (1 - pooledRate) * (1/impressionsA + 1/impressionsB));
    const zScore = se > 0 ? diff / se : 0;
    
    // 95% confidence = z > 1.96
    const confidence = Math.min(99, Math.round(zScore * 30));
    const significant = zScore > 1.96;
    const winner = rateA > rateB ? 'A' : rateB > rateA ? 'B' : null;

    return { significant, confidence, winner };
  };

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
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <FlaskConical className="h-6 w-6" />
            A/B Тестування
          </h2>
          <p className="text-muted-foreground">Створюйте та аналізуйте A/B тести для оптимізації конверсії</p>
        </div>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Новий тест
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Створити A/B тест</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Назва тесту</Label>
                <Input
                  value={newTest.name}
                  onChange={(e) => setNewTest({ ...newTest, name: e.target.value })}
                  placeholder="Наприклад: Колір кнопки купити"
                />
              </div>
              <div>
                <Label>Опис</Label>
                <Textarea
                  value={newTest.description}
                  onChange={(e) => setNewTest({ ...newTest, description: e.target.value })}
                  placeholder="Тестуємо зелену vs червону кнопку..."
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Варіант A (контроль)</Label>
                  <Input
                    value={newTest.variant_a}
                    onChange={(e) => setNewTest({ ...newTest, variant_a: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Варіант B</Label>
                  <Input
                    value={newTest.variant_b}
                    onChange={(e) => setNewTest({ ...newTest, variant_b: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <Label>Розподіл трафіку: {newTest.traffic_split}% / {100 - newTest.traffic_split}%</Label>
                <input
                  type="range"
                  min="10"
                  max="90"
                  value={newTest.traffic_split}
                  onChange={(e) => setNewTest({ ...newTest, traffic_split: parseInt(e.target.value) })}
                  className="w-full mt-2"
                />
              </div>
              <Button 
                onClick={() => createTestMutation.mutate(newTest)}
                disabled={!newTest.name || createTestMutation.isPending}
                className="w-full"
              >
                {createTestMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Створити тест
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Tests List */}
      <div className="grid gap-4">
        {tests && tests.length > 0 ? (
          tests.map((test) => {
            const stats = calculateSignificance(test);
            const conversionA = test.impressions_a && test.impressions_a > 0 
              ? ((test.conversions_a || 0) / test.impressions_a * 100).toFixed(2) 
              : '0.00';
            const conversionB = test.impressions_b && test.impressions_b > 0 
              ? ((test.conversions_b || 0) / test.impressions_b * 100).toFixed(2) 
              : '0.00';

            return (
              <Card key={test.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        {test.name}
                        <Badge variant={test.is_active ? "default" : "secondary"}>
                          {test.is_active ? 'Активний' : 'Завершено'}
                        </Badge>
                        {stats.significant && stats.winner && (
                          <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Переможець: {stats.winner}
                          </Badge>
                        )}
                      </CardTitle>
                      <CardDescription>{test.description}</CardDescription>
                    </div>
                    <Switch
                      checked={test.is_active}
                      onCheckedChange={(checked) => 
                        toggleTestMutation.mutate({ id: test.id, isActive: checked, key: test.key })
                      }
                    />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-6">
                    {/* Variant A */}
                    <div className={`p-4 rounded-lg border ${stats.winner === 'A' ? 'border-green-500 bg-green-500/5' : 'border-border'}`}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium">{test.variant_a}</span>
                        <Badge variant="outline">A</Badge>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground flex items-center gap-1">
                            <Users className="h-3 w-3" /> Покази
                          </span>
                          <span>{test.impressions_a || 0}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground flex items-center gap-1">
                            <TrendingUp className="h-3 w-3" /> Конверсії
                          </span>
                          <span>{test.conversions_a || 0}</span>
                        </div>
                        <div className="flex justify-between text-sm font-medium">
                          <span>Конверсія</span>
                          <span className="text-primary">{conversionA}%</span>
                        </div>
                      </div>
                    </div>

                    {/* Variant B */}
                    <div className={`p-4 rounded-lg border ${stats.winner === 'B' ? 'border-green-500 bg-green-500/5' : 'border-border'}`}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium">{test.variant_b}</span>
                        <Badge variant="outline">B</Badge>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground flex items-center gap-1">
                            <Users className="h-3 w-3" /> Покази
                          </span>
                          <span>{test.impressions_b || 0}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground flex items-center gap-1">
                            <TrendingUp className="h-3 w-3" /> Конверсії
                          </span>
                          <span>{test.conversions_b || 0}</span>
                        </div>
                        <div className="flex justify-between text-sm font-medium">
                          <span>Конверсія</span>
                          <span className="text-primary">{conversionB}%</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Statistical Significance */}
                  <div className="mt-4 p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Статистична значущість</span>
                      <span className="text-sm">{stats.confidence}%</span>
                    </div>
                    <Progress value={stats.confidence} className="h-2" />
                    <p className="text-xs text-muted-foreground mt-2">
                      {stats.significant 
                        ? `Результати статистично значущі. Варіант ${stats.winner} перемагає.`
                        : 'Потрібно більше даних для статистично значущих висновків (мін. 100 показів на варіант)'}
                    </p>
                  </div>
                </CardContent>
              </Card>
            );
          })
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <FlaskConical className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">Немає активних тестів</h3>
              <p className="text-muted-foreground mb-4">
                Створіть перший A/B тест для оптимізації конверсії
              </p>
              <Button onClick={() => setIsOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Створити тест
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* How to use */}
      <Card>
        <CardHeader>
          <CardTitle>Як використовувати A/B тести</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>1. Створіть тест з описом двох варіантів (A - контроль, B - експеримент)</p>
          <p>2. В коді перевіряйте варіант для користувача через useABTest hook</p>
          <p>3. Трекайте покази та конверсії для кожного варіанту</p>
          <p>4. Дочекайтесь статистичної значущості (95%+ впевненість)</p>
          <p>5. Впровадьте переможний варіант для всіх користувачів</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default ABTestingManager;
