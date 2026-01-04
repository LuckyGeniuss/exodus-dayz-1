import { useState, useMemo, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import Hero from "@/components/Hero";
import VeteranBanner from "@/components/VeteranBanner";
import ShopBanner from "@/components/ShopBanner";
import ProductCard from "@/components/ProductCard";
import ProductSkeleton from "@/components/ProductSkeleton";
import SearchWithAutocomplete from "@/components/SearchWithAutocomplete";
import ProductFilters, { SortOption, Category } from "@/components/ProductFilters";
import Pagination from "@/components/Pagination";
import EmptyState from "@/components/EmptyState";
import CartDrawer from "@/components/cart/CartDrawer";
import Footer from "@/components/Footer";
import RecentlyViewedProducts from "@/components/RecentlyViewedProducts";
import DailyRewardModal from "@/components/DailyRewardModal";
import SEOHead from "@/components/SEOHead";
import { useAuth } from "@/components/auth/AuthProvider";
import { useProducts } from "@/hooks/useProducts";
import { useProductsRatings } from "@/hooks/useProductsRatings";
import { useDailyReward } from "@/hooks/useDailyReward";
import { useSEO } from "@/hooks/useSEO";
import { Product } from "@/components/ProductCard";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Search, Package } from "lucide-react";

const ITEMS_PER_PAGE = 12;

const Index = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Parse URL params
  const initialCategories = (searchParams.get('categories')?.split(',').filter(Boolean) || []) as Category[];
  const initialSort = (searchParams.get('sort') || 'newest') as SortOption;
  const initialSearch = searchParams.get('search') || '';
  const initialPage = parseInt(searchParams.get('page') || '1', 10);
  const initialMinPrice = parseInt(searchParams.get('min') || '0', 10);
  const initialMaxPrice = parseInt(searchParams.get('max') || '10000', 10);

  const [selectedCategories, setSelectedCategories] = useState<Category[]>(initialCategories);
  const [sortOption, setSortOption] = useState<SortOption>(initialSort);
  const [priceRange, setPriceRange] = useState<[number, number]>([initialMinPrice, initialMaxPrice]);
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [cartOpen, setCartOpen] = useState(false);
  const [cartItems, setCartItems] = useState<Array<{ productId: string; quantity: number }>>([]);
  const [currentPage, setCurrentPage] = useState(initialPage);
  const { products, loading: productsLoading } = useProducts();
  const { data: ratingsData } = useProductsRatings();
  const { showModal: showDailyReward, setShowModal: setShowDailyReward } = useDailyReward();

  // SEO
  useSEO({
    title: 'Магазин',
    description: 'Офіційний магазин Exodus DayZ - пріоритет, транспорт, набори та косметичні предмети для серверів DayZ. Найкращі ціни та миттєва доставка.',
    url: '/',
    type: 'website'
  });

  const maxPrice = useMemo(() => {
    return Math.max(...products.map(p => p.price), 10000);
  }, [products]);

  // Update URL when filters change
  useEffect(() => {
    const params = new URLSearchParams();
    
    if (selectedCategories.length > 0) {
      params.set('categories', selectedCategories.join(','));
    }
    if (sortOption !== 'newest') {
      params.set('sort', sortOption);
    }
    if (searchQuery) {
      params.set('search', searchQuery);
    }
    if (currentPage > 1) {
      params.set('page', currentPage.toString());
    }
    if (priceRange[0] > 0) {
      params.set('min', priceRange[0].toString());
    }
    if (priceRange[1] < maxPrice) {
      params.set('max', priceRange[1].toString());
    }
    
    setSearchParams(params, { replace: true });
  }, [selectedCategories, sortOption, searchQuery, currentPage, priceRange, maxPrice, setSearchParams]);

  useEffect(() => {
    if (user) {
      fetchCart();
    } else {
      const savedCart = localStorage.getItem('cart');
      if (savedCart) {
        setCartItems(JSON.parse(savedCart));
      }
    }
  }, [user]);

  const fetchCart = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('cart_items')
      .select('*')
      .eq('user_id', user.id);

    if (data && !error) {
      setCartItems(data.map(item => ({
        productId: item.product_id,
        quantity: item.quantity
      })));
    }
  };

  const addToCart = async (productId: string) => {
    const existingItem = cartItems.find(item => item.productId === productId);
    
    if (existingItem) {
      await updateCartQuantity(productId, existingItem.quantity + 1);
    } else {
      const newItems = [...cartItems, { productId, quantity: 1 }];
      setCartItems(newItems);

      if (user) {
        await supabase.from('cart_items').insert({
          user_id: user.id,
          product_id: productId,
          quantity: 1
        });
      } else {
        localStorage.setItem('cart', JSON.stringify(newItems));
      }
      
      toast.success('Товар додано до кошика');
    }
  };

  const updateCartQuantity = async (productId: string, quantity: number) => {
    const newItems = cartItems.map(item =>
      item.productId === productId ? { ...item, quantity } : item
    );
    setCartItems(newItems);

    if (user) {
      await supabase
        .from('cart_items')
        .update({ quantity })
        .eq('user_id', user.id)
        .eq('product_id', productId);
    } else {
      localStorage.setItem('cart', JSON.stringify(newItems));
    }
  };

  const removeFromCart = async (productId: string) => {
    const newItems = cartItems.filter(item => item.productId !== productId);
    setCartItems(newItems);

    if (user) {
      await supabase
        .from('cart_items')
        .delete()
        .eq('user_id', user.id)
        .eq('product_id', productId);
    } else {
      localStorage.setItem('cart', JSON.stringify(newItems));
    }
    
    toast.success('Товар видалено з кошика');
  };

  const handleCheckout = () => {
    if (!user) {
      navigate('/auth');
      return;
    }
    setCartOpen(false);
    navigate('/checkout');
  };

  const categoryMap: Record<string, Category> = {
    "Пріоритет": "vip",
    "Транспорт": "transport",
    "Набори": "kits",
    "Будматеріали": "materials",
    "Контейнери": "containers",
    "Запчастини": "parts",
  };

  // Create ratings lookup map
  const ratingsMap = useMemo(() => {
    const map = new Map<string, { averageRating: number; reviewCount: number }>();
    ratingsData?.forEach(r => {
      map.set(r.productId, { averageRating: r.averageRating, reviewCount: r.reviewCount });
    });
    return map;
  }, [ratingsData]);

  const filteredProducts = useMemo(() => {
    let filtered = products;
    
    // Filter by categories
    if (selectedCategories.length > 0) {
      filtered = filtered.filter(product => {
        const productCategory = categoryMap[product.category];
        return selectedCategories.includes(productCategory);
      });
    }
    
    // Filter by price range
    filtered = filtered.filter(product => 
      product.price >= priceRange[0] && product.price <= priceRange[1]
    );
    
    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(query) ||
        product.description.toLowerCase().includes(query) ||
        product.category.toLowerCase().includes(query)
      );
    }

    // Sort products
    const sorted = [...filtered];
    switch (sortOption) {
      case "price-asc":
        sorted.sort((a, b) => a.price - b.price);
        break;
      case "price-desc":
        sorted.sort((a, b) => b.price - a.price);
        break;
      case "name-asc":
        sorted.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case "name-desc":
        sorted.sort((a, b) => b.name.localeCompare(a.name));
        break;
      case "popular":
        // Sort by review count
        sorted.sort((a, b) => {
          const aCount = ratingsMap.get(a.id)?.reviewCount || 0;
          const bCount = ratingsMap.get(b.id)?.reviewCount || 0;
          return bCount - aCount;
        });
        break;
      case "rating":
        // Sort by average rating
        sorted.sort((a, b) => {
          const aRating = ratingsMap.get(a.id)?.averageRating || 0;
          const bRating = ratingsMap.get(b.id)?.averageRating || 0;
          return bRating - aRating;
        });
        break;
      case "newest":
      default:
        // Already sorted by created_at desc from DB
        break;
    }
    
    return sorted;
  }, [selectedCategories, priceRange, searchQuery, sortOption, products, ratingsMap]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCategories, priceRange, searchQuery, sortOption]);

  // Pagination
  const totalPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE);
  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredProducts.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredProducts, currentPage]);

  return (
    <div className="min-h-screen bg-background">
      <SEOHead includeOrganization canonicalUrl="https://exodus-dayz.lovable.app/" />
      <ShopBanner />
      <Header 
        onCartOpen={() => setCartOpen(true)} 
        cartItemCount={cartItems.reduce((sum, item) => sum + item.quantity, 0)}
      />
      
      <CartDrawer
        open={cartOpen}
        onClose={() => setCartOpen(false)}
        items={cartItems}
        onUpdateQuantity={updateCartQuantity}
        onRemove={removeFromCart}
        onCheckout={handleCheckout}
      />
      <Hero />
      <VeteranBanner />
      
      {/* Daily Reward Modal */}
      <DailyRewardModal 
        open={showDailyReward} 
        onOpenChange={setShowDailyReward} 
      />
      
      <section id="shop" className="container mx-auto px-4 py-20">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4">
            Магазин <span className="text-primary">товарів</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Обирайте з нашої колекції пріоритету, транспорту, наборів для кланів та будівельних матеріалів.
          </p>
        </div>
        
        <div className="mb-8">
          <SearchWithAutocomplete value={searchQuery} onChange={setSearchQuery} />
        </div>

        <div className="flex gap-8">
          {/* Filters Sidebar */}
          <aside className="w-full lg:w-64 flex-shrink-0">
            <ProductFilters
              onSortChange={setSortOption}
              onPriceRangeChange={(min, max) => setPriceRange([min, max])}
              onCategoriesChange={setSelectedCategories}
              maxPrice={maxPrice}
              currentSort={sortOption}
              currentPriceRange={priceRange}
              currentCategories={selectedCategories}
              resultsCount={filteredProducts.length}
            />
          </aside>

          {/* Products Grid */}
          <div className="flex-1">
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
            {productsLoading ? (
              // Show skeletons while loading
              Array.from({ length: ITEMS_PER_PAGE }).map((_, index) => (
                <ProductSkeleton key={index} />
              ))
            ) : (
              paginatedProducts.map((product, index) => (
                <div
                  key={product.id}
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <ProductCard 
                    product={product}
                    onAddToCart={addToCart}
                    rating={ratingsMap.get(product.id)}
                  />
                </div>
              ))
            )}
            </div>

            {filteredProducts.length === 0 && !productsLoading && (
              <EmptyState
                icon={searchQuery ? Search : Package}
                title={searchQuery ? 'Нічого не знайдено' : 'Товарів поки немає'}
                description={
                  searchQuery 
                    ? 'Спробуйте змінити параметри пошуку або фільтри' 
                    : 'Оберіть іншу категорію або скиньте фільтри'
                }
              />
            )}

            {filteredProducts.length > 0 && !productsLoading && (
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
                itemsPerPage={ITEMS_PER_PAGE}
                totalItems={filteredProducts.length}
              />
            )}
          </div>
        </div>
        
        {/* Recently Viewed Products */}
        <RecentlyViewedProducts />
      </section>

      <section id="about" className="bg-card border-y border-border py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-6">
              Про <span className="text-primary">Exodus DayZ</span>
            </h2>
            <p className="text-muted-foreground mb-4">
              Exodus DayZ — це приватні PVE/PVP сервери з унікальними кастомними модами, 
              створені для справжніх фанатів постапокаліптичного виживання.
            </p>
            <p className="text-muted-foreground mb-4">
              Ми дотримуємося правил монетизації Bohemia Interactive: всі товари в нашому магазині 
              є виключно косметичними та не впливають на баланс гри. Жодного pay-to-win!
            </p>
            <p className="text-muted-foreground">
              Приєднуйтесь до нашої спільноти та насолоджуйтесь справжнім DayZ досвідом 
              з VIP-опціями та ексклюзивними косметичними предметами.
            </p>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Index;
