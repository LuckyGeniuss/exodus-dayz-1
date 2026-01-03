import { useCompare } from '@/contexts/CompareContext';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { X, Scale, ShoppingCart, ArrowLeft } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '@/hooks/useCart';
import { toast } from 'sonner';

const Compare = () => {
  const { compareItems, removeFromCompare, clearCompare } = useCompare();
  const { addItem } = useCart();
  const navigate = useNavigate();

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
      vehicles: 'Транспорт',
      kits: 'Набори',
      containers: 'Контейнери',
      building: 'Будівництво',
      parts: 'Запчастини',
      priority: 'Пріоритет'
    };
    return labels[category] || category;
  };

  // Find min price for highlighting
  const minPrice = Math.min(...compareItems.map(item => item.price));

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Scale className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold">Порівняння товарів</h1>
          </div>
          <Button variant="outline" onClick={clearCompare}>
            Очистити все
          </Button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="p-4 text-left bg-muted/50 rounded-tl-lg min-w-[150px]">
                  Характеристика
                </th>
                {compareItems.map((item) => (
                  <th key={item.id} className="p-4 min-w-[250px] bg-muted/50">
                    <Card className="relative overflow-hidden">
                      <button
                        onClick={() => removeFromCompare(item.id)}
                        className="absolute top-2 right-2 z-10 w-8 h-8 bg-background/80 backdrop-blur rounded-full flex items-center justify-center hover:bg-destructive hover:text-destructive-foreground transition-colors"
                      >
                        <X className="h-4 w-4" />
                      </button>
                      <CardContent className="p-4">
                        <Link to={`/product/${item.id}`}>
                          <img
                            src={item.image}
                            alt={item.name}
                            className="w-full h-40 object-cover rounded-lg mb-4 hover:scale-105 transition-transform"
                          />
                        </Link>
                        <h3 className="font-semibold text-lg line-clamp-2 mb-2">
                          {item.name}
                        </h3>
                        <Button
                          className="w-full"
                          onClick={() => handleAddToCart(item)}
                        >
                          <ShoppingCart className="h-4 w-4 mr-2" />
                          До кошика
                        </Button>
                      </CardContent>
                    </Card>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {/* Price Row */}
              <tr>
                <td className="p-4 font-medium bg-muted/30">Ціна</td>
                {compareItems.map((item) => (
                  <td key={item.id} className="p-4 text-center">
                    <span className={`text-2xl font-bold ${item.price === minPrice ? 'text-green-500' : ''}`}>
                      {item.price}₴
                    </span>
                    {item.price === minPrice && (
                      <Badge className="ml-2 bg-green-500">Найнижча</Badge>
                    )}
                  </td>
                ))}
              </tr>

              {/* Category Row */}
              <tr>
                <td className="p-4 font-medium bg-muted/30">Категорія</td>
                {compareItems.map((item) => (
                  <td key={item.id} className="p-4 text-center">
                    <Badge variant="secondary">
                      {getCategoryLabel(item.category)}
                    </Badge>
                  </td>
                ))}
              </tr>

              {/* Description Row */}
              <tr>
                <td className="p-4 font-medium bg-muted/30">Опис</td>
                {compareItems.map((item) => (
                  <td key={item.id} className="p-4 text-sm text-muted-foreground">
                    {item.description || 'Опис недоступний'}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>

        <div className="mt-8 text-center">
          <Button variant="outline" onClick={() => navigate('/')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Продовжити покупки
          </Button>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Compare;
