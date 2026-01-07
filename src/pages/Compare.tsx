import { useCompare } from '@/contexts/CompareContext';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { X, Scale, ShoppingCart, ArrowLeft, Check, Minus, Star } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '@/hooks/useCart';
import { useProductsRatings } from '@/hooks/useProductsRatings';
import { toast } from 'sonner';

// Характеристики товарів за категоріями
const PRODUCT_SPECS: Record<string, Record<string, { label: string; getValue: (product: any) => string | boolean }>> = {
  'Пріоритет': {
    skipQueue: { label: 'Прохід без черги', getValue: () => true },
    duration: { label: 'Тривалість', getValue: (p) => p.name.includes('місяць') ? '1 місяць' : p.name.includes('тижн') ? '1 тиждень' : 'Необмежено' },
    reservedSlot: { label: 'Зарезервований слот', getValue: () => true },
    vipBadge: { label: 'VIP значок', getValue: (p) => p.name.toLowerCase().includes('vip') },
    support: { label: 'Пріоритетна підтримка', getValue: (p) => p.price > 200 },
  },
  'Транспорт': {
    seats: { label: 'Місць', getValue: (p) => p.name.includes('V3S') ? '2' : p.name.includes('Boat') ? '4' : p.name.includes('HMMWV') ? '4' : '4' },
    speed: { label: 'Швидкість', getValue: (p) => p.name.includes('Sarka') || p.name.includes('Ada') ? 'Висока' : 'Середня' },
    fuel: { label: 'Включає пальне', getValue: () => true },
    cargo: { label: 'Вантажний простір', getValue: (p) => p.name.includes('V3S') ? 'Великий' : 'Середній' },
    offroad: { label: 'Прохідність', getValue: (p) => p.name.includes('V3S') || p.name.includes('HMMWV') },
  },
  'Набори': {
    weapons: { label: 'Містить зброю', getValue: (p) => p.name.includes('Duo') || p.name.includes('Big') },
    food: { label: 'Їжа та вода', getValue: () => true },
    medical: { label: 'Медикаменти', getValue: () => true },
    tools: { label: 'Інструменти', getValue: (p) => p.name.includes('Big') || p.price > 300 },
    building: { label: 'Будівельні матеріали', getValue: (p) => p.price > 400 },
  },
  'Будматеріали': {
    quantity: { label: 'Кількість', getValue: (p) => p.name.includes('x') ? p.name.match(/\d+x/)?.[0] || 'Стандарт' : 'Стандарт' },
    durability: { label: 'Міцність', getValue: () => 'Висока' },
    craftable: { label: 'Можна крафтити', getValue: () => false },
  },
  'Контейнери': {
    slots: { label: 'Слотів', getValue: (p) => p.name.includes('Big') ? '100' : p.name.includes('Crate') ? '50' : '70' },
    lockable: { label: 'Замок', getValue: () => true },
    waterproof: { label: 'Водонепроникний', getValue: () => true },
  },
  'Запчастини': {
    quality: { label: 'Якість', getValue: () => 'Нова' },
    compatible: { label: 'Сумісність', getValue: () => 'Універсальна' },
  },
};

const Compare = () => {
  const { compareItems, removeFromCompare, clearCompare } = useCompare();
  const { addItem } = useCart();
  const { data: ratingsData } = useProductsRatings();
  const navigate = useNavigate();

  const ratingsMap = new Map(ratingsData?.map(r => [r.productId, r]) || []);

  const handleAddToCart = (product: typeof compareItems[0]) => {
    addItem({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.image,
      category: product.category,
      description: product.description
    });
    toast.success(`${product.name} додано до кошика`);
  };

  if (compareItems.length === 0) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <main className="flex-1 container mx-auto px-4 py-8">
          <div className="text-center py-16">
            <Scale className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h1 className="text-2xl font-bold mb-2">Немає товарів для порівняння</h1>
            <p className="text-muted-foreground mb-6">
              Додайте товари до порівняння, натиснувши іконку ваг на картці товару
            </p>
            <Button onClick={() => navigate('/')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              До магазину
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      'Транспорт': 'Транспорт',
      'Набори': 'Набори',
      'Контейнери': 'Контейнери',
      'Будматеріали': 'Будівництво',
      'Запчастини': 'Запчастини',
      'Пріоритет': 'Пріоритет'
    };
    return labels[category] || category;
  };

  // Find min price for highlighting
  const minPrice = Math.min(...compareItems.map(item => item.price));
  const maxPrice = Math.max(...compareItems.map(item => item.price));

  // Get common specs based on categories
  const categories = [...new Set(compareItems.map(item => item.category))];
  const commonSpecs = categories.length === 1 && PRODUCT_SPECS[categories[0]] 
    ? PRODUCT_SPECS[categories[0]] 
    : null;

  const renderSpecValue = (value: string | boolean) => {
    if (typeof value === 'boolean') {
      return value ? (
        <Check className="h-5 w-5 text-green-500 mx-auto" />
      ) : (
        <Minus className="h-5 w-5 text-muted-foreground mx-auto" />
      );
    }
    return value;
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Scale className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-3xl font-bold">Порівняння товарів</h1>
              <p className="text-muted-foreground text-sm">
                {compareItems.length} товарів для порівняння
              </p>
            </div>
          </div>
          <Button variant="outline" onClick={clearCompare}>
            Очистити все
          </Button>
        </div>

        <div className="overflow-x-auto rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="min-w-[180px] font-semibold">Характеристика</TableHead>
                {compareItems.map((item) => (
                  <TableHead key={item.id} className="min-w-[220px] p-4">
                    <Card className="relative overflow-hidden border-0 shadow-none bg-transparent">
                      <button
                        onClick={() => removeFromCompare(item.id)}
                        className="absolute top-0 right-0 z-10 w-7 h-7 bg-background/80 backdrop-blur rounded-full flex items-center justify-center hover:bg-destructive hover:text-destructive-foreground transition-colors"
                      >
                        <X className="h-4 w-4" />
                      </button>
                      <CardContent className="p-0">
                        <Link to={`/product/${item.id}`}>
                          <img
                            src={item.image}
                            alt={item.name}
                            className="w-full h-32 object-cover rounded-lg mb-3 hover:scale-105 transition-transform"
                          />
                        </Link>
                        <h3 className="font-semibold text-sm line-clamp-2 mb-2">
                          {item.name}
                        </h3>
                        <Button
                          className="w-full"
                          size="sm"
                          onClick={() => handleAddToCart(item)}
                        >
                          <ShoppingCart className="h-4 w-4 mr-2" />
                          До кошика
                        </Button>
                      </CardContent>
                    </Card>
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {/* Price Row */}
              <TableRow className="bg-primary/5">
                <TableCell className="font-semibold">💰 Ціна</TableCell>
                {compareItems.map((item) => (
                  <TableCell key={item.id} className="text-center">
                    <span className={`text-xl font-bold ${
                      item.price === minPrice ? 'text-green-500' : 
                      item.price === maxPrice ? 'text-amber-500' : ''
                    }`}>
                      {item.price}₴
                    </span>
                    {item.price === minPrice && compareItems.length > 1 && (
                      <Badge className="ml-2 bg-green-500">Найнижча</Badge>
                    )}
                  </TableCell>
                ))}
              </TableRow>

              {/* Rating Row */}
              <TableRow>
                <TableCell className="font-semibold">⭐ Рейтинг</TableCell>
                {compareItems.map((item) => {
                  const rating = ratingsMap.get(item.id);
                  return (
                    <TableCell key={item.id} className="text-center">
                      {rating ? (
                        <div className="flex items-center justify-center gap-1">
                          <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
                          <span className="font-medium">{rating.averageRating.toFixed(1)}</span>
                          <span className="text-muted-foreground text-sm">
                            ({rating.reviewCount})
                          </span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">Немає відгуків</span>
                      )}
                    </TableCell>
                  );
                })}
              </TableRow>

              {/* Category Row */}
              <TableRow>
                <TableCell className="font-semibold">📁 Категорія</TableCell>
                {compareItems.map((item) => (
                  <TableCell key={item.id} className="text-center">
                    <Badge variant="secondary">
                      {getCategoryLabel(item.category)}
                    </Badge>
                  </TableCell>
                ))}
              </TableRow>

              {/* Dynamic Specs based on category */}
              {commonSpecs && Object.entries(commonSpecs).map(([key, spec]) => (
                <TableRow key={key}>
                  <TableCell className="font-medium">{spec.label}</TableCell>
                  {compareItems.map((item) => (
                    <TableCell key={item.id} className="text-center">
                      {renderSpecValue(spec.getValue(item))}
                    </TableCell>
                  ))}
                </TableRow>
              ))}

              {/* Description Row */}
              <TableRow>
                <TableCell className="font-semibold align-top">📝 Опис</TableCell>
                {compareItems.map((item) => (
                  <TableCell key={item.id} className="text-sm text-muted-foreground max-w-[220px]">
                    <p className="line-clamp-4">
                      {item.description || 'Опис недоступний'}
                    </p>
                  </TableCell>
                ))}
              </TableRow>

              {/* Value for money */}
              <TableRow className="bg-muted/30">
                <TableCell className="font-semibold">💎 Співвідношення ціна/якість</TableCell>
                {compareItems.map((item) => {
                  const rating = ratingsMap.get(item.id);
                  const avgRating = rating?.averageRating || 3;
                  const valueScore = (avgRating / item.price * 100).toFixed(1);
                  const maxValueScore = Math.max(...compareItems.map(i => {
                    const r = ratingsMap.get(i.id);
                    return ((r?.averageRating || 3) / i.price * 100);
                  }));
                  const isMax = parseFloat(valueScore) === maxValueScore;
                  
                  return (
                    <TableCell key={item.id} className="text-center">
                      <div className={`font-medium ${isMax ? 'text-green-500' : ''}`}>
                        {avgRating > 0 ? (
                          <>
                            {isMax && <Badge className="bg-green-500 mb-1">Найкраще</Badge>}
                            <div>{valueScore} балів</div>
                          </>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </div>
                    </TableCell>
                  );
                })}
              </TableRow>
            </TableBody>
          </Table>
        </div>

        <div className="mt-8 flex justify-center gap-4">
          <Button variant="outline" onClick={() => navigate('/')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Продовжити покупки
          </Button>
          <Button variant="outline" onClick={() => navigate('/wishlist')}>
            Переглянути збережені
          </Button>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Compare;
