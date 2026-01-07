import { Link } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useBundles } from '@/hooks/useBundles';
import { useProducts } from '@/hooks/useProducts';
import { useCart } from '@/hooks/useCart';
import { Package, ShoppingCart, Tag, Percent, Clock, Gift } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const Bundles = () => {
  const { bundles, isLoading: bundlesLoading } = useBundles();
  const { products } = useProducts();
  const { addItem, getItemCount } = useCart();

  const getProductDetails = (productId: string) => {
    return products.find(p => p.id === productId);
  };

  const handleAddBundleToCart = (bundle: typeof bundles[0]) => {
    if (!bundle.items) return;
    
    for (const item of bundle.items) {
      const product = getProductDetails(item.product_id);
      if (product) {
        addItem(product, item.quantity);
      }
    }
    toast.success(`Збірку "${bundle.name}" додано в кошик!`);
  };

  const calculateSavingsPercent = (totalValue: number, bundlePrice: number) => {
    if (totalValue <= 0) return 0;
    return Math.round(((totalValue - bundlePrice) / totalValue) * 100);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header cartItemCount={getItemCount()} />
      
      {/* Hero Section */}
      <section className="relative py-16 bg-gradient-to-b from-zinc-900 via-zinc-900/95 to-background overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.03) 2px, rgba(255,255,255,0.03) 4px)',
          }} />
        </div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Gift className="h-10 w-10 text-primary" />
            <h1 className="text-4xl md:text-5xl font-bold text-center">
              Вигідні <span className="text-primary">Збірки</span>
            </h1>
          </div>
          <p className="text-lg text-muted-foreground text-center max-w-2xl mx-auto">
            Купуйте комплекти товарів за спеціальними цінами та економте до 50%!
            Всі збірки ретельно підібрані для максимальної вигоди.
          </p>
        </div>
      </section>

      {/* Bundles Grid */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          {bundlesLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="overflow-hidden">
                  <Skeleton className="h-48 w-full" />
                  <CardHeader>
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-24 w-full" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : bundles.length === 0 ? (
            <div className="text-center py-20">
              <Package className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h2 className="text-2xl font-semibold mb-2">Збірок поки немає</h2>
              <p className="text-muted-foreground mb-6">
                Скоро тут з'являться вигідні пропозиції!
              </p>
              <Button asChild>
                <Link to="/#shop">Перейти в магазин</Link>
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {bundles.map((bundle) => {
                const savingsPercent = calculateSavingsPercent(bundle.totalValue || 0, bundle.bundle_price);
                
                return (
                  <Card 
                    key={bundle.id} 
                    className={cn(
                      "overflow-hidden group hover:shadow-xl transition-all duration-300",
                      "border-2 hover:border-primary/50",
                      "bg-gradient-to-b from-card to-card/80"
                    )}
                  >
                    {/* Bundle Image */}
                    <div className="relative h-48 bg-gradient-to-br from-zinc-800 to-zinc-900 overflow-hidden">
                      {bundle.image ? (
                        <img 
                          src={bundle.image} 
                          alt={bundle.name}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package className="h-20 w-20 text-muted-foreground/30" />
                        </div>
                      )}
                      
                      {/* Discount Badge */}
                      {savingsPercent > 0 && (
                        <Badge 
                          className={cn(
                            "absolute top-3 right-3",
                            "bg-gradient-to-r from-red-600 to-orange-500",
                            "text-white font-bold text-lg px-3 py-1",
                            "animate-pulse shadow-lg"
                          )}
                        >
                          <Percent className="h-4 w-4 mr-1" />
                          -{savingsPercent}%
                        </Badge>
                      )}
                      
                      {/* Items Count */}
                      <Badge 
                        variant="secondary"
                        className="absolute top-3 left-3 bg-black/60 backdrop-blur-sm"
                      >
                        <Tag className="h-3 w-3 mr-1" />
                        {bundle.items?.length || 0} товарів
                      </Badge>
                    </div>

                    <CardHeader className="pb-2">
                      <CardTitle className="text-xl group-hover:text-primary transition-colors">
                        {bundle.name}
                      </CardTitle>
                      {bundle.description && (
                        <CardDescription className="line-clamp-2">
                          {bundle.description}
                        </CardDescription>
                      )}
                    </CardHeader>

                    <CardContent className="space-y-4">
                      {/* Products List */}
                      <div className="space-y-2 max-h-32 overflow-y-auto scrollbar-thin">
                        {bundle.items?.map((item) => {
                          const product = getProductDetails(item.product_id);
                          return (
                            <div 
                              key={item.id}
                              className="flex items-center justify-between text-sm bg-muted/30 rounded px-2 py-1"
                            >
                              <span className="truncate flex-1">
                                {product?.name || item.product_id}
                              </span>
                              <div className="flex items-center gap-2 shrink-0">
                                <span className="text-muted-foreground">x{item.quantity}</span>
                                {product && (
                                  <span className="text-muted-foreground line-through text-xs">
                                    {(product.price * item.quantity).toFixed(0)}₴
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Pricing */}
                      <div className="pt-2 border-t border-border">
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <div className="text-sm text-muted-foreground line-through">
                              {bundle.totalValue?.toFixed(0)}₴
                            </div>
                            <div className="text-2xl font-bold text-primary">
                              {bundle.bundle_price.toFixed(0)}₴
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm text-muted-foreground">Економія</div>
                            <div className="text-lg font-semibold text-green-500">
                              {bundle.savings?.toFixed(0)}₴
                            </div>
                          </div>
                        </div>

                        <Button 
                          className="w-full group/btn"
                          size="lg"
                          onClick={() => handleAddBundleToCart(bundle)}
                        >
                          <ShoppingCart className="h-4 w-4 mr-2 group-hover/btn:animate-bounce" />
                          Додати в кошик
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* Info Section */}
      <section className="py-12 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex items-start gap-4 p-6 rounded-lg bg-card">
              <div className="p-3 rounded-full bg-primary/10">
                <Percent className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Максимальна економія</h3>
                <p className="text-sm text-muted-foreground">
                  Збірки дешевші на 15-50% ніж окремі товари
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4 p-6 rounded-lg bg-card">
              <div className="p-3 rounded-full bg-primary/10">
                <Package className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Підібрані комплекти</h3>
                <p className="text-sm text-muted-foreground">
                  Товари ідеально поєднуються між собою
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4 p-6 rounded-lg bg-card">
              <div className="p-3 rounded-full bg-primary/10">
                <Clock className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Обмежені пропозиції</h3>
                <p className="text-sm text-muted-foreground">
                  Деякі збірки доступні тільки певний час
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Bundles;
