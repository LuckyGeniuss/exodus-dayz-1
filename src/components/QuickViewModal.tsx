import { ShoppingCart, X, ExternalLink } from 'lucide-react';
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';
import { useCart } from '@/hooks/useCart';
import { usePromotions } from '@/hooks/usePromotions';
import { toast } from 'sonner';

interface Product {
  id: string;
  name: string;
  price: number;
  image: string;
  category: string;
  description?: string;
}

interface QuickViewModalProps {
  product: Product | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const QuickViewModal = ({ product, open, onOpenChange }: QuickViewModalProps) => {
  const { addItem } = useCart();
  const { promotions } = usePromotions();

  if (!product) return null;

  const promotion = promotions.find(p => p.product_id === product.id);
  const finalPrice = promotion
    ? product.price * (1 - promotion.discount_percent / 100)
    : product.price;

  const handleAddToCart = () => {
    addItem({
      id: product.id,
      name: product.name,
      price: finalPrice,
      image: product.image,
      category: product.category,
      description: product.description
    });
    toast.success(`${product.name} додано до кошика`);
    onOpenChange(false);
  };

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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl p-0 overflow-hidden">
        <button
          onClick={() => onOpenChange(false)}
          className="absolute top-4 right-4 z-10 w-8 h-8 bg-background/80 backdrop-blur rounded-full flex items-center justify-center hover:bg-background transition-colors"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="grid md:grid-cols-2 gap-0">
          {/* Image */}
          <div className="relative aspect-square">
            <img
              src={product.image}
              alt={product.name}
              className="w-full h-full object-cover"
            />
            {promotion && (
              <Badge className="absolute top-4 left-4 bg-red-500">
                -{promotion.discount_percent}%
              </Badge>
            )}
          </div>

          {/* Content */}
          <div className="p-6 flex flex-col">
            <Badge variant="secondary" className="w-fit mb-2">
              {getCategoryLabel(product.category)}
            </Badge>

            <h2 className="text-2xl font-bold mb-3">{product.name}</h2>

            {product.description && (
              <p className="text-muted-foreground text-sm mb-4 line-clamp-4">
                {product.description}
              </p>
            )}

            <div className="flex items-baseline gap-3 mb-6">
              <span className="text-3xl font-bold text-primary">
                {finalPrice.toFixed(0)}₴
              </span>
              {promotion && (
                <span className="text-lg text-muted-foreground line-through">
                  {product.price}₴
                </span>
              )}
            </div>

            <div className="mt-auto space-y-3">
              <Button
                className="w-full"
                size="lg"
                onClick={handleAddToCart}
              >
                <ShoppingCart className="h-5 w-5 mr-2" />
                Додати до кошика
              </Button>

              <Button
                variant="outline"
                className="w-full"
                asChild
              >
                <Link to={`/product/${product.id}`}>
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Детальніше
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default QuickViewModal;
