import { useParams, Link, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { ArrowLeft, ShoppingCart, Shield, Package, Tag } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Breadcrumbs from "@/components/Breadcrumbs";
import ProductGallery from "@/components/ProductGallery";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useCart } from "@/hooks/useCart";
import { useProducts } from "@/hooks/useProducts";
import { useViewedProducts } from "@/hooks/useViewedProducts";
import { usePromotions } from "@/hooks/usePromotions";
import { useReviews } from "@/hooks/useReviews";
import { toast } from "@/hooks/use-toast";
import { Product } from "@/components/ProductCard";
import ReviewList from "@/components/ReviewList";
import ReviewForm from "@/components/ReviewForm";

const ProductDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { products, loading } = useProducts();
  const { addItem, getItemCount } = useCart();
  const { addViewedProduct } = useViewedProducts();
  const { getProductPromotion } = usePromotions();
  const product = products.find((p) => p.id === id);
  const promotion = product ? getProductPromotion(product.id) : null;
  const { reviews, averageRating, addReview, deleteReview } = useReviews(id);
  
  const finalPrice = product && promotion
    ? product.price * (1 - promotion.discount_percent / 100)
    : product?.price;

  useEffect(() => {
    if (product) {
      addViewedProduct(product.id);
    }
  }, [product]);

  const handleAddToCart = () => {
    if (!product) return;
    addItem(product);
    toast({
      title: "Додано до кошика",
      description: `${product.name} додано до кошика`,
    });
  };

  const handleBuyNow = () => {
    if (!product) return;
    addItem(product);
    navigate("/checkout");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header onCartOpen={() => {}} cartItemCount={0} />
        <div className="container mx-auto px-4 py-20 text-center">
          <p className="text-muted-foreground">Завантаження...</p>
        </div>
        <Footer />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-background">
        <Header onCartOpen={() => {}} cartItemCount={0} />
        <div className="container mx-auto px-4 py-20 text-center">
          <h1 className="text-3xl font-bold mb-4">Товар не знайдено</h1>
          <p className="text-muted-foreground mb-8">На жаль, цей товар не існує або був видалений</p>
          <Button onClick={() => navigate("/")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Повернутися до магазину
          </Button>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header onCartOpen={() => {}} cartItemCount={getItemCount()} />
      
      <div className="container mx-auto px-4 py-12">
        <Breadcrumbs 
          items={[
            { label: 'Магазин', href: '/#shop' },
            { label: product.category, href: '/#shop' },
            { label: product.name }
          ]}
        />

        <div className="grid md:grid-cols-2 gap-12 items-start">
          {/* Product Gallery */}
          <div className="animate-fade-in">
            <ProductGallery
              productId={product.id}
              mainImage={product.image || '/placeholder.svg'}
              productName={product.name}
            />
          </div>

          {/* Product Info */}
          <div className="space-y-6 animate-fade-in" style={{ animationDelay: '200ms' }}>
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Badge>{product.category}</Badge>
                {promotion && (
                  <Badge className="bg-destructive text-destructive-foreground">
                    <Tag className="w-3 h-3 mr-1" />
                    -{promotion.discount_percent}%
                  </Badge>
                )}
              </div>
              <h1 className="text-4xl font-bold mb-4">{product.name}</h1>
              <p className="text-muted-foreground text-lg leading-relaxed mb-6">
                {product.fullDescription || product.description}
              </p>
              
              {product.features && product.features.length > 0 && (
                <div className="space-y-3 mt-6">
                  <h3 className="font-semibold text-lg">Особливості:</h3>
                  <ul className="space-y-2">
                    {product.features.map((feature, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <span className="text-primary mt-1">✓</span>
                        <span className="text-muted-foreground">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <div className="flex items-baseline gap-3 py-6 border-y border-border">
              <span className="text-5xl font-bold text-primary">{finalPrice?.toFixed(0)}</span>
              <span className="text-2xl text-muted-foreground">₴</span>
              {promotion && (
                <span className="text-2xl text-muted-foreground line-through">{product.price} ₴</span>
              )}
            </div>

            <div className="space-y-4">
              <Button size="lg" className="w-full" onClick={handleAddToCart}>
                <ShoppingCart className="mr-2 h-5 w-5" />
                Додати до кошика
              </Button>
              <Button variant="outline" size="lg" className="w-full" onClick={handleBuyNow}>
                Купити зараз
              </Button>
            </div>

            {/* Features */}
            <div className="space-y-4 pt-6 border-t border-border">
              <h3 className="font-semibold text-lg">Особливості:</h3>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <Shield className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <p className="font-medium">Відповідає правилам BI</p>
                    <p className="text-sm text-muted-foreground">
                      Тільки косметичні зміни, без pay-to-win
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Package className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <p className="font-medium">Миттєва доставка</p>
                    <p className="text-sm text-muted-foreground">
                      Отримайте товар одразу після оплати
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Reviews Section */}
        <div className="mt-20">
          <h2 className="text-3xl font-bold mb-8">
            Відгуки <span className="text-primary">покупців</span>
          </h2>
          <div className="grid md:grid-cols-2 gap-8">
            <ReviewForm onSubmit={addReview} />
            <ReviewList
              reviews={reviews}
              averageRating={averageRating}
              onDeleteReview={deleteReview}
            />
          </div>
        </div>

        <Separator className="my-20" />

        {/* Related Products */}
        <div className="mt-20">
          <h2 className="text-3xl font-bold mb-8">
            Схожі <span className="text-primary">товари</span>
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {products
              .filter(p => p.category === product.category && p.id !== product.id)
              .slice(0, 4)
              .map(relatedProduct => (
                <Link 
                  key={relatedProduct.id} 
                  to={`/product/${relatedProduct.id}`}
                  className="group"
                >
                  <div className="overflow-hidden rounded-lg border border-border transition-all hover:shadow-[var(--shadow-elevated)] hover:-translate-y-1">
                    <div className="aspect-square bg-muted overflow-hidden">
                      <img
                        src={relatedProduct.image}
                        alt={relatedProduct.name}
                        className="w-full h-full object-cover transition-transform group-hover:scale-110"
                      />
                    </div>
                    <div className="p-4">
                      <h3 className="font-bold line-clamp-1 mb-2">{relatedProduct.name}</h3>
                      <div className="flex items-baseline gap-1">
                        <span className="text-xl font-bold text-primary">{relatedProduct.price}</span>
                        <span className="text-muted-foreground">₴</span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default ProductDetail;
