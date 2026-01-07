import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, Send, Mail, Users, Package, CheckCircle, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
}

const PromoEmailSender = () => {
  const [subject, setSubject] = useState('🔥 Спеціальна пропозиція від Exodus DayZ!');
  const [heading, setHeading] = useState('Не пропустіть вигідні товари!');
  const [message, setMessage] = useState('Ми підготували для вас ексклюзивну добірку товарів за найкращими цінами. Поспішайте — кількість обмежена!');
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [lastResult, setLastResult] = useState<{ sent: number; failed: number } | null>(null);

  // Fetch products for selection
  const { data: products = [], isLoading: productsLoading } = useQuery({
    queryKey: ['products-for-promo'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('id, name, price, category')
        .order('name');
      if (error) throw error;
      return data as Product[];
    }
  });

  // Fetch subscribed users count
  const { data: subscribersCount = 0 } = useQuery({
    queryKey: ['promo-subscribers-count'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('email_promotions_enabled', true);
      if (error) throw error;
      return count || 0;
    }
  });

  const sendPromoMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('send-promo-email', {
        body: {
          subject,
          heading,
          message,
          productIds: selectedProducts.length > 0 ? selectedProducts : undefined
        }
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      setLastResult({ sent: data.sent || 0, failed: data.failed || 0 });
      toast.success(`Розсилка надіслана ${data.sent} користувачам`);
    },
    onError: (error: Error) => {
      toast.error(`Помилка: ${error.message}`);
    }
  });

  const toggleProduct = (productId: string) => {
    setSelectedProducts(prev =>
      prev.includes(productId)
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  const selectCategory = (category: string) => {
    const categoryProducts = products.filter(p => p.category === category).map(p => p.id);
    const allSelected = categoryProducts.every(id => selectedProducts.includes(id));
    
    if (allSelected) {
      setSelectedProducts(prev => prev.filter(id => !categoryProducts.includes(id)));
    } else {
      setSelectedProducts(prev => [...new Set([...prev, ...categoryProducts])]);
    }
  };

  const categories = [...new Set(products.map(p => p.category))];

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Промо-розсилка
          </CardTitle>
          <CardDescription>
            Надішліть промоційний email підписаним користувачам
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
            <Users className="h-5 w-5 text-primary" />
            <span className="text-sm">
              <strong>{subscribersCount}</strong> підписаних користувачів
            </span>
          </div>

          <div className="space-y-2">
            <Label>Тема листа</Label>
            <Input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Тема email..."
            />
          </div>

          <div className="space-y-2">
            <Label>Заголовок</Label>
            <Input
              value={heading}
              onChange={(e) => setHeading(e.target.value)}
              placeholder="Основний заголовок..."
            />
          </div>

          <div className="space-y-2">
            <Label>Повідомлення</Label>
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Текст повідомлення..."
              rows={4}
            />
          </div>

          <Button
            onClick={() => sendPromoMutation.mutate()}
            disabled={sendPromoMutation.isPending || !subject.trim()}
            className="w-full"
          >
            {sendPromoMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Надсилання...
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Надіслати розсилку
              </>
            )}
          </Button>

          {lastResult && (
            <div className="flex gap-4 p-3 bg-muted rounded-lg">
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle className="h-4 w-4" />
                <span className="text-sm">Надіслано: {lastResult.sent}</span>
              </div>
              {lastResult.failed > 0 && (
                <div className="flex items-center gap-2 text-destructive">
                  <AlertCircle className="h-4 w-4" />
                  <span className="text-sm">Помилок: {lastResult.failed}</span>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Product Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Товари для рекомендацій
          </CardTitle>
          <CardDescription>
            Оберіть товари для показу в листі (або залиште порожнім для автовибору)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {productsLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : (
            <div className="space-y-4">
              {/* Category quick select */}
              <div className="flex flex-wrap gap-2">
                {categories.map(category => (
                  <Button
                    key={category}
                    variant="outline"
                    size="sm"
                    onClick={() => selectCategory(category)}
                  >
                    {category}
                  </Button>
                ))}
                {selectedProducts.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedProducts([])}
                  >
                    Очистити
                  </Button>
                )}
              </div>

              <Badge variant="secondary">
                Обрано: {selectedProducts.length} товарів
              </Badge>

              <ScrollArea className="h-[300px] border rounded-lg p-3">
                <div className="space-y-2">
                  {products.map(product => (
                    <div
                      key={product.id}
                      className="flex items-center gap-3 p-2 hover:bg-muted rounded-lg cursor-pointer"
                      onClick={() => toggleProduct(product.id)}
                    >
                      <Checkbox
                        checked={selectedProducts.includes(product.id)}
                        onCheckedChange={() => toggleProduct(product.id)}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{product.name}</p>
                        <p className="text-xs text-muted-foreground">{product.category}</p>
                      </div>
                      <span className="text-sm font-medium">{product.price} ₴</span>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PromoEmailSender;
