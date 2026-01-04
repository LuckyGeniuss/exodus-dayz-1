import { Badge } from './ui/badge';
import { Package, CheckCircle, Clock, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StockBadgeProps {
  inStock?: boolean;
  quantity?: number;
  showQuantity?: boolean;
  className?: string;
}

const StockBadge = ({ 
  inStock = true, 
  quantity, 
  showQuantity = false,
  className 
}: StockBadgeProps) => {
  // For digital products, always in stock
  const isDigital = quantity === undefined || quantity === -1;
  
  if (isDigital) {
    return (
      <Badge 
        variant="outline" 
        className={cn(
          "gap-1 bg-green-500/10 text-green-600 border-green-500/30",
          className
        )}
      >
        <CheckCircle className="h-3 w-3" />
        Доступно
      </Badge>
    );
  }

  if (!inStock || quantity === 0) {
    return (
      <Badge 
        variant="outline" 
        className={cn(
          "gap-1 bg-destructive/10 text-destructive border-destructive/30",
          className
        )}
      >
        <AlertTriangle className="h-3 w-3" />
        Немає в наявності
      </Badge>
    );
  }

  if (quantity && quantity <= 5) {
    return (
      <Badge 
        variant="outline" 
        className={cn(
          "gap-1 bg-yellow-500/10 text-yellow-600 border-yellow-500/30",
          className
        )}
      >
        <Clock className="h-3 w-3" />
        {showQuantity ? `Залишилось: ${quantity}` : 'Закінчується'}
      </Badge>
    );
  }

  return (
    <Badge 
      variant="outline" 
      className={cn(
        "gap-1 bg-green-500/10 text-green-600 border-green-500/30",
        className
      )}
    >
      <Package className="h-3 w-3" />
      {showQuantity && quantity ? `В наявності: ${quantity}` : 'В наявності'}
    </Badge>
  );
};

export default StockBadge;
