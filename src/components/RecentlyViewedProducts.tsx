import { useViewedProducts } from '@/hooks/useViewedProducts';
import { useProducts } from '@/hooks/useProducts';
import { Card, CardContent } from '@/components/ui/card';
import { Link } from 'react-router-dom';
import { Eye } from 'lucide-react';

interface RecentlyViewedProductsProps {
  currentProductId?: string;
  maxItems?: number;
}

const RecentlyViewedProducts = ({ currentProductId, maxItems = 6 }: RecentlyViewedProductsProps) => {
  const { viewedProductIds } = useViewedProducts();
  const { products } = useProducts();

  // Filter out current product and get viewed products
  const viewedProducts = viewedProductIds
    .filter(id => id !== currentProductId)
    .slice(0, maxItems)
    .map(id => products.find(p => p.id === id))
    .filter(Boolean);

  if (viewedProducts.length === 0) {
    return null;
  }

  return (
    <section className="py-8">
      <div className="flex items-center gap-2 mb-6">
        <Eye className="h-5 w-5 text-primary" />
        <h2 className="text-xl font-bold">Нещодавно переглянуті</h2>
      </div>
      
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {viewedProducts.map((product) => product && (
          <Link key={product.id} to={`/product/${product.id}`}>
            <Card className="group hover:shadow-lg transition-all duration-300 overflow-hidden h-full">
              <CardContent className="p-0">
                <div className="aspect-square overflow-hidden">
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <div className="p-3">
                  <h3 className="text-sm font-medium line-clamp-2 group-hover:text-primary transition-colors">
                    {product.name}
                  </h3>
                  <p className="text-primary font-bold mt-1">
                    {product.price}₴
                  </p>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </section>
  );
};

export default RecentlyViewedProducts;
