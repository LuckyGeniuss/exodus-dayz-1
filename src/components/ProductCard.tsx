import { ShoppingCart, Heart, Tag, Star } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "./ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "./ui/card";
import { Badge } from "./ui/badge";
import { useWishlist } from "@/hooks/useWishlist";
import { usePromotions } from "@/hooks/usePromotions";

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

const ProductCard = ({ product, onAddToCart, rating }: ProductCardProps) => {
  const { isInWishlist, toggleWishlist } = useWishlist();
  const { getProductPromotion } = usePromotions();
  const inWishlist = isInWishlist(product.id);
  const promotion = getProductPromotion(product.id);
  
  const finalPrice = promotion 
    ? product.price * (1 - promotion.discount_percent / 100)
    : product.price;

  return (
    <Link to={`/product/${product.id}`} className="animate-fade-in">
      <Card className="overflow-hidden transition-all hover:shadow-[var(--shadow-elevated)] hover:-translate-y-1 bg-gradient-to-br from-card to-card/80 border-border h-full group">
        <CardHeader className="p-0">
          <div className="aspect-square overflow-hidden bg-muted relative">
            {promotion && (
              <Badge className="absolute top-3 left-3 z-10 bg-destructive text-destructive-foreground">
                <Tag className="w-3 h-3 mr-1" />
                -{promotion.discount_percent}%
              </Badge>
            )}
            <img
              src={product.image}
              alt={product.name}
              className="h-full w-full object-cover transition-all duration-500 group-hover:scale-110"
              onError={(e) => {
                e.currentTarget.src = '/placeholder.svg';
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                toggleWishlist(product.id);
              }}
              className="absolute top-2 right-2 h-9 w-9 p-0 bg-background/80 hover:bg-background backdrop-blur-sm"
            >
              <Heart 
                className={`h-5 w-5 transition-colors ${
                  inWishlist ? 'fill-primary text-primary' : 'text-muted-foreground'
                }`}
              />
            </Button>
          </div>
        </CardHeader>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <Badge variant="outline">
            {product.category}
          </Badge>
          {rating && rating.reviewCount > 0 && (
            <div className="flex items-center gap-1 text-sm">
              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              <span className="font-medium">{rating.averageRating.toFixed(1)}</span>
              <span className="text-muted-foreground">({rating.reviewCount})</span>
            </div>
          )}
        </div>
        <h3 className="font-bold text-lg mb-2 line-clamp-1 group-hover:text-primary transition-colors">{product.name}</h3>
        <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
          {product.description}
        </p>
        <div className="flex items-baseline gap-2">
          {promotion ? (
            <>
              <span className="text-2xl font-bold text-primary">{finalPrice.toFixed(0)}</span>
              <span className="text-muted-foreground">₴</span>
              <span className="text-sm text-muted-foreground line-through">{product.price} ₴</span>
            </>
          ) : (
            <>
              <span className="text-2xl font-bold text-primary">{product.price}</span>
              <span className="text-muted-foreground">₴</span>
            </>
          )}
        </div>
      </CardContent>
      <CardFooter className="p-4 pt-0">
          <Button 
            className="w-full" 
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
