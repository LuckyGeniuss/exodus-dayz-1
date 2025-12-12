import { useState, useMemo, useEffect } from "react";
import Header from "@/components/Header";
import Hero from "@/components/Hero";
import VeteranBanner from "@/components/VeteranBanner";
import ProductCard from "@/components/ProductCard";
import ProductSkeleton from "@/components/ProductSkeleton";
import SearchBar from "@/components/SearchBar";
import ProductFilters, { SortOption, Category } from "@/components/ProductFilters";
import Pagination from "@/components/Pagination";
import EmptyState from "@/components/EmptyState";
import CartDrawer from "@/components/cart/CartDrawer";
import Footer from "@/components/Footer";
import { useAuth } from "@/components/auth/AuthProvider";
import { useProducts } from "@/hooks/useProducts";
import { Product } from "@/components/ProductCard";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Search, Package } from "lucide-react";

const ITEMS_PER_PAGE = 12;

const Index = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [selectedCategories, setSelectedCategories] = useState<Category[]>([]);
  const [sortOption, setSortOption] = useState<SortOption>("newest");
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 10000]);
  const [searchQuery, setSearchQuery] = useState("");
  const [cartOpen, setCartOpen] = useState(false);
  const [cartItems, setCartItems] = useState<Array<{ productId: string; quantity: number }>>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const { products, loading: productsLoading } = useProducts();

  const maxPrice = useMemo(() => {
    return Math.max(...products.map(p => p.price), 10000);
  }, [products]);

  useEffect(() => {
    setPriceRange([0, maxPrice]);
  }, [maxPrice]);

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
    "VIP": "vip",
    "Одяг": "clothing",
    "Транспорт": "transport",
    "Косметика": "cosmetic",
    "Музичні кассети": "cassettes",
    "Воркшоп": "workshop",
    "Кастомні предмети": "custom",
  };

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
        // Sort by price descending as popularity proxy
        sorted.sort((a, b) => b.price - a.price);
        break;
      case "rating":
        // Sort by price as rating proxy (higher price = higher quality)
        sorted.sort((a, b) => b.price - a.price);
        break;
      case "newest":
      default:
        // Already sorted by created_at desc from DB
        break;
    }
    
    return sorted;
  }, [selectedCategories, priceRange, searchQuery, sortOption, products]);

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
      
      <section id="shop" className="container mx-auto px-4 py-20">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4">
            Магазин <span className="text-primary">товарів</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Обирайте з нашої колекції VIP-пакетів, косметичних предметів та унікальних модифікацій.
            Всі товари відповідають правилам монетизації Bohemia Interactive.
          </p>
        </div>
        
        <div className="mb-8">
          <SearchBar value={searchQuery} onChange={setSearchQuery} />
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
