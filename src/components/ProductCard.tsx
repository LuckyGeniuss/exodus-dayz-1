import { ShoppingCart, Heart, Tag, Star, Eye, Zap } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "./ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "./ui/card";
import { Badge } from "./ui/badge";
import { useWishlist } from "@/hooks/useWishlist";
import { usePromotions } from "@/hooks/usePromotions";
import FlashSaleBadge from "./FlashSaleBadge";
export interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  description: string;
  image: string;
  fullDescription?: string;
  features?: string[];
}

interface ProductCardProps {
  product: Product;
  onAddToCart: (productId: string) => void;
  rating?: { averageRating: number; reviewCount: number };
}

const getCategoryLabel = (category: string): string => {
  const labels: Record<string, string> = {
    priority: 'Пріоритет',
    vehicle: 'Транспорт',
    kit: 'Набори',
    building: 'Будівництво',
    container: 'Контейнери',
    parts: 'Запчастини',
    vip: 'VIP',
    cosmetic: 'Косметика',
    clothing: 'Одяг',
    cassette: 'Касети',
    workshop: 'Воркшоп',
  };
  return labels[category] || category;
};

const getCategoryColor = (category: string): string => {
  const colors: Record<string, string> = {
    priority: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    vehicle: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    kit: 'bg-green-500/20 text-green-400 border-green-500/30',
    building: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
    container: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    parts: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
    vip: 'bg-primary/20 text-primary border-primary/30',
    cosmetic: 'bg-pink-500/20 text-pink-400 border-pink-500/30',
    clothing: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30',
    cassette: 'bg-red-500/20 text-red-400 border-red-500/30',
    workshop: 'bg-teal-500/20 text-teal-400 border-teal-500/30',
  };
  return colors[category] || 'bg-muted text-muted-foreground border-border';
};

const ProductCard = ({ product, onAddToCart, rating }: ProductCardProps) => {
  const { isInWishlist, toggleWishlist } = useWishlist();
  const { getProductPromotion } = usePromotions();
  const inWishlist = isInWishlist(product.id);
  const promotion = getProductPromotion(product.id);
  
  const finalPrice = promotion 
    ? product.price * (1 - promotion.discount_percent / 100)
    : product.price;

  return (
    <Link to={`/product/${product.id}`} className="animate-fade-in block h-full">
      <Card className="overflow-hidden h-full flex flex-col bg-gradient-to-br from-card via-card to-card/80 border border-border/50 hover:border-primary/50 transition-all duration-300 hover:shadow-[0_0_30px_rgba(234,88,12,0.15)] hover:-translate-y-2 group">
        <CardHeader className="p-0 relative">
          <div className="aspect-[4/3] overflow-hidden bg-gradient-to-br from-muted to-muted/50 relative">
            {/* Promotion Badge */}
            {promotion && (
              <div className="absolute top-3 left-3 z-10">
                {promotion.is_flash_sale && promotion.end_date ? (
                  <div className="flex flex-col gap-1">
                    <Badge className="bg-gradient-to-r from-red-500 to-orange-500 text-white backdrop-blur-sm shadow-lg px-3 py-1.5 font-bold animate-pulse">
                      <Zap className="w-3.5 h-3.5 mr-1.5" />
                      -{promotion.discount_percent}%
                    </Badge>
                    <FlashSaleBadge endDate={promotion.end_date} discountPercent={promotion.discount_percent} variant="timer" />
                  </div>
                ) : (
                  <Badge className="bg-destructive/90 text-destructive-foreground backdrop-blur-sm shadow-lg px-3 py-1.5 font-bold">
                    <Tag className="w-3.5 h-3.5 mr-1.5" />
                    -{promotion.discount_percent}%
                  </Badge>
                )}
              </div>
            )}
            
            {/* Wishlist Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                toggleWishlist(product.id);
              }}
              className={`absolute top-3 right-3 z-10 h-10 w-10 p-0 rounded-full backdrop-blur-sm shadow-lg transition-all duration-300 ${
                inWishlist 
                  ? 'bg-primary/90 hover:bg-primary text-primary-foreground' 
                  : 'bg-background/80 hover:bg-background text-muted-foreground hover:text-primary'
              }`}
            >
              <Heart 
                className={`h-5 w-5 transition-transform duration-300 group-hover:scale-110 ${
                  inWishlist ? 'fill-current' : ''
                }`}
              />
            </Button>

            {/* Product Image */}
            <img
              src={product.image}
              alt={product.name}
              className="h-full w-full object-cover transition-all duration-500 group-hover:scale-110"
              onError={(e) => {
                e.currentTarget.src = '/placeholder.svg';
              }}
            />
            
            {/* Overlay gradient */}
            <div className="absolute inset-0 bg-gradient-to-t from-card via-transparent to-transparent opacity-60" />
            
            {/* Quick view indicator */}
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <div className="bg-background/90 backdrop-blur-sm rounded-full p-3 shadow-lg transform scale-75 group-hover:scale-100 transition-transform duration-300">
                <Eye className="h-5 w-5 text-primary" />
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-4 flex-1 flex flex-col">
          {/* Category & Rating Row */}
          <div className="flex items-center justify-between mb-3">
            <Badge 
              variant="outline" 
              className={`${getCategoryColor(product.category)} font-medium text-xs px-2.5 py-1`}
            >
              {getCategoryLabel(product.category)}
            </Badge>
            {rating && rating.reviewCount > 0 && (
              <div className="flex items-center gap-1.5 text-sm">
                <div className="flex items-center">
                  {[...Array(5)].map((_, i) => (
                    <Star 
                      key={i}
                      className={`h-3.5 w-3.5 ${
                        i < Math.round(rating.averageRating) 
                          ? 'fill-yellow-400 text-yellow-400' 
                          : 'text-muted-foreground/30'
                      }`}
                    />
                  ))}
                </div>
                <span className="text-muted-foreground text-xs">({rating.reviewCount})</span>
              </div>
            )}
          </div>

          {/* Product Name */}
          <h3 className="font-bold text-lg mb-2 line-clamp-2 group-hover:text-primary transition-colors duration-300 leading-tight">
            {product.name}
          </h3>

          {/* Description */}
          <p className="text-sm text-muted-foreground line-clamp-2 mb-4 flex-1">
            {product.description}
          </p>

          {/* Price Section */}
          <div className="flex items-end gap-2 mt-auto">
            <div className="flex flex-col">
              {promotion && (
                <span className="text-sm text-muted-foreground line-through">
                  {product.price.toFixed(0)} ₴
                </span>
              )}
              <div className="flex items-baseline gap-1">
                <span className={`text-2xl font-bold ${promotion ? 'text-destructive' : 'text-primary'}`}>
                  {finalPrice.toFixed(0)}
                </span>
                <span className="text-muted-foreground text-sm">₴</span>
              </div>
            </div>
            {promotion && (
              <Badge variant="destructive" className="text-xs mb-1">
                Економія {(product.price - finalPrice).toFixed(0)} ₴
              </Badge>
            )}
          </div>
        </CardContent>

        <CardFooter className="p-4 pt-0">
          <Button 
            className="w-full h-11 font-semibold transition-all duration-300 shadow-lg hover:shadow-primary/25" 
            variant="default"
            onClick={(e) => {
              e.preventDefault();
              onAddToCart(product.id);
            }}
          >
            <ShoppingCart className="mr-2 h-4 w-4" />
            До кошика
          </Button>
        </CardFooter>
      </Card>
    </Link>
  );
};

export default ProductCard;
