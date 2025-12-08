import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Pencil, Trash2, Trophy, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  requirement_type: string;
  requirement_value: number;
  reward_balance: number | null;
  created_at: string | null;
}

const ICONS = ['🏆', '⭐', '🎖️', '👑', '💎', '🔥', '⚡', '🎯', '🛒', '💰', '🎁', '🌟'];
const REQUIREMENT_TYPES = [
  { value: 'orders_count', label: 'Кількість замовлень' },
  { value: 'total_spent', label: 'Загальна сума покупок' },
  { value: 'reviews_count', label: 'Кількість відгуків' },
  { value: 'referrals_count', label: 'Кількість рефералів' },
];

const AchievementManagement = () => {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAchievement, setEditingAchievement] = useState<Achievement | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    icon: '🏆',
    requirement_type: 'orders_count',
    requirement_value: 1,
    reward_balance: 0,
  });

  useEffect(() => {
    fetchAchievements();
  }, []);

  const fetchAchievements = async () => {
    try {
      const { data, error } = await supabase
        .from('achievements')
        .select('*')
        .order('requirement_value', { ascending: true });

      if (error) throw error;
      setAchievements(data || []);
    } catch (err) {
      console.error('Error fetching achievements:', err);
      toast.error('Помилка завантаження досягнень');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.description) {
      toast.error('Заповніть всі поля');
      return;
    }

    try {
      if (editingAchievement) {
        const { error } = await supabase
          .from('achievements')
          .update(formData)
          .eq('id', editingAchievement.id);

        if (error) throw error;
        toast.success('Досягнення оновлено');
      } else {
        const { error } = await supabase
          .from('achievements')
          .insert(formData);

        if (error) throw error;
        toast.success('Досягнення створено');
      }

      setIsDialogOpen(false);
      resetForm();
      fetchAchievements();
    } catch (err) {
      console.error('Error saving achievement:', err);
      toast.error('Помилка збереження');
    }
  };

  const handleEdit = (achievement: Achievement) => {
    setEditingAchievement(achievement);
    setFormData({
      name: achievement.name,
      description: achievement.description,
      icon: achievement.icon,
      requirement_type: achievement.requirement_type,
      requirement_value: achievement.requirement_value,
      reward_balance: achievement.reward_balance || 0,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Видалити це досягнення?')) return;

    try {
      const { error } = await supabase
        .from('achievements')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Досягнення видалено');
      fetchAchievements();
    } catch (err) {
      console.error('Error deleting achievement:', err);
      toast.error('Помилка видалення');
    }
  };

  const resetForm = () => {
    setEditingAchievement(null);
    setFormData({
      name: '',
      description: '',
      icon: '🏆',
      requirement_type: 'orders_count',
      requirement_value: 1,
      reward_balance: 0,
    });
  };

  const getRequirementLabel = (type: string) => {
    return REQUIREMENT_TYPES.find(t => t.value === type)?.label || type;
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 flex justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-6 w-6" />
          Керування досягненнями
        </CardTitle>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Додати
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingAchievement ? 'Редагувати досягнення' : 'Нове досягнення'}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Іконка</Label>
                <div className="flex flex-wrap gap-2">
                  {ICONS.map((icon) => (
                    <Button
                      key={icon}
                      type="button"
                      variant={formData.icon === icon ? 'default' : 'outline'}
                      size="icon"
                      className="text-xl"
                      onClick={() => setFormData({ ...formData, icon })}
                    >
                      {icon}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Назва</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Перше замовлення"
                />
              </div>

              <div className="space-y-2">
                <Label>Опис</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Зробіть своє перше замовлення"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Тип вимоги</Label>
                  <Select
                    value={formData.requirement_type}
                    onValueChange={(value) => setFormData({ ...formData, requirement_type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {REQUIREMENT_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Значення</Label>
                  <Input
                    type="number"
                    min={1}
                    value={formData.requirement_value}
                    onChange={(e) => setFormData({ ...formData, requirement_value: parseInt(e.target.value) || 1 })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Винагорода (₴)</Label>
                <Input
                  type="number"
                  min={0}
                  value={formData.reward_balance}
                  onChange={(e) => setFormData({ ...formData, reward_balance: parseInt(e.target.value) || 0 })}
                />
              </div>

              <Button className="w-full" onClick={handleSubmit}>
                {editingAchievement ? 'Зберегти' : 'Створити'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Досягнення</TableHead>
              <TableHead>Вимога</TableHead>
              <TableHead>Винагорода</TableHead>
              <TableHead className="text-right">Дії</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {achievements.map((achievement) => (
              <TableRow key={achievement.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{achievement.icon}</span>
                    <div>
                      <div className="font-medium">{achievement.name}</div>
                      <div className="text-sm text-muted-foreground">{achievement.description}</div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="text-sm">
                    {getRequirementLabel(achievement.requirement_type)}
                    <span className="font-bold ml-1">≥ {achievement.requirement_value}</span>
                  </div>
                </TableCell>
                <TableCell>
                  {achievement.reward_balance ? (
                    <span className="text-green-500 font-bold">+{achievement.reward_balance}₴</span>
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEdit(achievement)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(achievement.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default AchievementManagement;
