import { useBundles } from "@/hooks/useBundles";
import { useProducts } from "@/hooks/useProducts";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Package, Gift, Sparkles, ArrowRight } from "lucide-react";
import { toast } from "sonner";

interface BundleShowcaseProps {
  onAddToCart: (productId: string) => void;
}

const BundleShowcase = ({ onAddToCart }: BundleShowcaseProps) => {
  const { bundles, isLoading } = useBundles();
  const { products } = useProducts();

  if (isLoading) {
    return (
      <section className="container mx-auto px-4 py-12">
        <div className="flex items-center gap-3 mb-8">
          <Gift className="h-8 w-8 text-primary" />
          <h2 className="text-3xl font-bold">Вигідні набори</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="overflow-hidden">
              <Skeleton className="h-48 w-full" />
              <CardContent className="p-4 space-y-3">
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-10 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    );
  }

  if (bundles.length === 0) return null;

  const getProductNames = (items: { product_id: string; quantity: number }[]) => {
    return items.map(item => {
      const product = products.find(p => p.id === item.product_id);
      return product ? `${product.name}${item.quantity > 1 ? ` ×${item.quantity}` : ''}` : null;
    }).filter(Boolean);
  };

  const handleAddBundleToCart = (bundle: typeof bundles[0]) => {
    if (!bundle.items) return;
    
    bundle.items.forEach(item => {
      for (let i = 0; i < item.quantity; i++) {
        onAddToCart(item.product_id);
      }
    });
    
    toast.success(`Набір "${bundle.name}" додано до кошика!`);
  };

  return (
    <section className="container mx-auto px-4 py-12">
      <div className="flex items-center gap-3 mb-8">
        <Gift className="h-8 w-8 text-primary animate-pulse" />
        <h2 className="text-3xl font-bold">
          Вигідні <span className="text-primary">набори</span>
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {bundles.map((bundle) => {
          const productNames = getProductNames(bundle.items || []);
          const savingsPercent = bundle.totalValue 
            ? Math.round(((bundle.totalValue - bundle.bundle_price) / bundle.totalValue) * 100)
            : 0;

          return (
            <Card 
              key={bundle.id} 
              className="overflow-hidden border-primary/20 hover:border-primary/50 transition-all duration-300 hover:shadow-[0_0_30px_rgba(234,88,12,0.15)] group"
            >
              <CardHeader className="p-0 relative">
                {bundle.image ? (
                  <div className="aspect-video overflow-hidden bg-muted">
                    <img
                      src={bundle.image}
                      alt={bundle.name}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                  </div>
                ) : (
                  <div className="aspect-video bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                    <Package className="h-16 w-16 text-primary/50" />
                  </div>
                )}

                {savingsPercent > 0 && (
                  <Badge className="absolute top-3 left-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold text-sm px-3 py-1.5 shadow-lg">
                    <Sparkles className="w-4 h-4 mr-1" />
                    Економія {savingsPercent}%
                  </Badge>
                )}
              </CardHeader>

              <CardContent className="p-4 space-y-4">
                <CardTitle className="text-xl">{bundle.name}</CardTitle>
                
                {bundle.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {bundle.description}
                  </p>
                )}

                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground font-medium">В наборі:</p>
                  <div className="flex flex-wrap gap-1.5">
                    {productNames.slice(0, 4).map((name, i) => (
                      <Badge key={i} variant="secondary" className="text-xs">
                        {name}
                      </Badge>
                    ))}
                    {productNames.length > 4 && (
                      <Badge variant="outline" className="text-xs">
                        +{productNames.length - 4} ще
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="flex items-end gap-2 pt-2 border-t">
                  <div className="flex flex-col">
                    {bundle.totalValue && bundle.totalValue > bundle.bundle_price && (
                      <span className="text-sm text-muted-foreground line-through">
                        {bundle.totalValue.toFixed(0)} ₴
                      </span>
                    )}
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-bold text-primary">
                        {bundle.bundle_price.toFixed(0)}
                      </span>
                      <span className="text-muted-foreground">₴</span>
                    </div>
                  </div>
                  {bundle.savings && bundle.savings > 0 && (
                    <Badge variant="destructive" className="mb-1">
                      -{bundle.savings.toFixed(0)} ₴
                    </Badge>
                  )}
                </div>
              </CardContent>

              <CardFooter className="p-4 pt-0">
                <Button 
                  className="w-full group/btn"
                  onClick={() => handleAddBundleToCart(bundle)}
                >
                  Додати набір
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover/btn:translate-x-1" />
                </Button>
              </CardFooter>
            </Card>
          );
        })}
      </div>
    </section>
  );
};

export default BundleShowcase;
