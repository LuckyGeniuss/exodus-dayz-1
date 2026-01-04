import { useState, useEffect, useRef, useMemo } from "react";
import { Search, X, Clock, TrendingUp } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useProducts } from "@/hooks/useProducts";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

interface SearchWithAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

const MAX_RECENT_SEARCHES = 5;

const SearchWithAutocomplete = ({ 
  value, 
  onChange, 
  placeholder = "Пошук товарів..." 
}: SearchWithAutocompleteProps) => {
  const { products } = useProducts();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Load recent searches from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('recentSearches');
    if (saved) {
      setRecentSearches(JSON.parse(saved));
    }
  }, []);

  // Filter products based on search query
  const suggestions = useMemo(() => {
    if (!value.trim()) return [];
    const query = value.toLowerCase();
    return products
      .filter(p => 
        p.name.toLowerCase().includes(query) ||
        p.description.toLowerCase().includes(query) ||
        p.category.toLowerCase().includes(query)
      )
      .slice(0, 6);
  }, [value, products]);

  // Popular products (by name, just for suggestions)
  const popularProducts = useMemo(() => {
    return products.slice(0, 4);
  }, [products]);

  const saveSearch = (query: string) => {
    if (!query.trim()) return;
    const updated = [query, ...recentSearches.filter(s => s !== query)].slice(0, MAX_RECENT_SEARCHES);
    setRecentSearches(updated);
    localStorage.setItem('recentSearches', JSON.stringify(updated));
  };

  const handleSelect = (productId?: string, searchQuery?: string) => {
    if (productId) {
      navigate(`/product/${productId}`);
    } else if (searchQuery) {
      onChange(searchQuery);
      saveSearch(searchQuery);
    }
    setIsOpen(false);
    setSelectedIndex(-1);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (value.trim()) {
      saveSearch(value);
      setIsOpen(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    const items = value.trim() ? suggestions : [...recentSearches.slice(0, 3), ...popularProducts];
    
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => Math.min(prev + 1, items.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => Math.max(prev - 1, -1));
    } else if (e.key === 'Enter' && selectedIndex >= 0) {
      e.preventDefault();
      if (value.trim()) {
        const product = suggestions[selectedIndex];
        if (product) handleSelect(product.id);
      } else {
        if (selectedIndex < recentSearches.length) {
          handleSelect(undefined, recentSearches[selectedIndex]);
        } else {
          const product = popularProducts[selectedIndex - recentSearches.length];
          if (product) handleSelect(product.id);
        }
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  const clearRecentSearches = () => {
    setRecentSearches([]);
    localStorage.removeItem('recentSearches');
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current && 
        !dropdownRef.current.contains(e.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const showDropdown = isOpen && (value.trim() ? suggestions.length > 0 : (recentSearches.length > 0 || popularProducts.length > 0));

  return (
    <form onSubmit={handleSubmit} className="relative w-full max-w-md mx-auto animate-fade-in">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
      <Input
        ref={inputRef}
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setIsOpen(true)}
        onKeyDown={handleKeyDown}
        className="pl-10 pr-10 h-12 bg-card border-border"
      />
      {value && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => onChange("")}
          className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 p-0"
        >
          <X className="h-4 w-4" />
        </Button>
      )}

      {/* Dropdown */}
      {showDropdown && (
        <div
          ref={dropdownRef}
          className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-lg shadow-lg z-50 overflow-hidden"
        >
          {value.trim() ? (
            // Product suggestions
            <div className="py-2">
              <p className="px-3 py-1 text-xs text-muted-foreground uppercase tracking-wider">Товари</p>
              {suggestions.map((product, index) => (
                <button
                  key={product.id}
                  type="button"
                  onClick={() => handleSelect(product.id)}
                  className={cn(
                    "w-full px-3 py-2 flex items-center gap-3 hover:bg-muted/50 transition-colors text-left",
                    selectedIndex === index && "bg-muted/50"
                  )}
                >
                  <img 
                    src={product.image} 
                    alt={product.name}
                    className="w-10 h-10 rounded object-cover"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{product.name}</p>
                    <p className="text-sm text-muted-foreground">{product.price} ₴</p>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <>
              {/* Recent searches */}
              {recentSearches.length > 0 && (
                <div className="py-2 border-b border-border">
                  <div className="px-3 py-1 flex items-center justify-between">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                      <Clock className="h-3 w-3" /> Нещодавні
                    </p>
                    <button
                      type="button"
                      onClick={clearRecentSearches}
                      className="text-xs text-muted-foreground hover:text-foreground"
                    >
                      Очистити
                    </button>
                  </div>
                  {recentSearches.slice(0, 3).map((search, index) => (
                    <button
                      key={search}
                      type="button"
                      onClick={() => handleSelect(undefined, search)}
                      className={cn(
                        "w-full px-3 py-2 flex items-center gap-2 hover:bg-muted/50 transition-colors text-left",
                        selectedIndex === index && "bg-muted/50"
                      )}
                    >
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span>{search}</span>
                    </button>
                  ))}
                </div>
              )}

              {/* Popular products */}
              <div className="py-2">
                <p className="px-3 py-1 text-xs text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" /> Популярні товари
                </p>
                {popularProducts.map((product, index) => (
                  <button
                    key={product.id}
                    type="button"
                    onClick={() => handleSelect(product.id)}
                    className={cn(
                      "w-full px-3 py-2 flex items-center gap-3 hover:bg-muted/50 transition-colors text-left",
                      selectedIndex === index + recentSearches.length && "bg-muted/50"
                    )}
                  >
                    <img 
                      src={product.image} 
                      alt={product.name}
                      className="w-10 h-10 rounded object-cover"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{product.name}</p>
                      <p className="text-sm text-muted-foreground">{product.price} ₴</p>
                    </div>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </form>
  );
};

export default SearchWithAutocomplete;
