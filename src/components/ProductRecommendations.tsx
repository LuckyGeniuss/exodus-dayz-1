import { useRecommendations } from '@/hooks/useRecommendations';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Sparkles, ShoppingCart, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useCart } from '@/hooks/useCart';
import { toast } from 'sonner';

interface ProductRecommendationsProps {
  title?: string;
  limit?: number;
  excludeProductId?: string;
}

const ProductRecommendations = ({ 
  title = 'Рекомендовано для вас', 
  limit = 4,
  excludeProductId 
}: ProductRecommendationsProps) => {
  const { data: recommendations = [], isLoading } = useRecommendations(limit + 1);
  const { addItem } = useCart();

  // Filter out the excluded product
  const filteredRecommendations = excludeProductId 
    ? recommendations.filter(p => p.id !== excludeProductId).slice(0, limit)
    : recommendations.slice(0, limit);

  const handleAddToCart = (product: typeof filteredRecommendations[0]) => {
    addItem({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.image || '',
      category: product.category,
      description: product.description || undefined
    });
    toast.success(`${product.name} додано до кошика`);
  };

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      'Пріоритет': 'VIP',
      'Транспорт': 'Транспорт',
      'Набори': 'Набори',
      'Будматеріали': 'Будівництво',
      'Контейнери': 'Контейнери',
      'Запчастини': 'Запчастини',
    };
    return labels[category] || category;
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Array.from({ length: limit }).map((_, i) => (
              <Skeleton key={i} className="h-48" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (filteredRecommendations.length === 0) {
    return null;
  }

  return (
    <Card className="border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {filteredRecommendations.map(product => (
            <div 
              key={product.id} 
              className="group relative bg-muted/30 rounded-lg overflow-hidden hover:shadow-lg transition-shadow"
            >
              <Link to={`/product/${product.id}`}>
                <div className="aspect-square overflow-hidden">
                  <img 
                    src={product.image || '/placeholder.svg'} 
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
              </Link>
              
              <div className="p-3">
                <Badge variant="secondary" className="text-xs mb-2">
                  {getCategoryLabel(product.category)}
                </Badge>
                
                <Link to={`/product/${product.id}`}>
                  <h4 className="font-medium text-sm line-clamp-2 hover:text-primary transition-colors">
                    {product.name}
                  </h4>
                </Link>
                
                <div className="flex items-center justify-between mt-2">
                  <span className="font-bold text-primary">{product.price}₴</span>
                  <Button 
                    size="icon" 
                    variant="ghost" 
                    className="h-8 w-8"
                    onClick={() => handleAddToCart(product)}
                  >
                    <ShoppingCart className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-4 text-center">
          <Button variant="outline" asChild>
            <Link to="/#shop">
              Переглянути всі товари
              <ArrowRight className="h-4 w-4 ml-2" />
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProductRecommendations;
