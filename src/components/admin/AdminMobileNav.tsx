import { useState, useMemo, useEffect } from "react";
import { 
  LayoutDashboard, BarChart3, PieChart, Package, FolderOpen, Gift, Boxes,
  ShoppingCart, Users, Shield, Ban, Tag, Zap, TrendingUp, Trophy,
  Newspaper, Image, MessageSquare, Send, History, Activity, UsersRound,
  FlaskConical, Mail, LineChart, Clock, Settings, Lock, Menu, Search,
  Pin, PinOff, X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

interface AdminMobileNavProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const allItems = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, section: "Огляд" },
  { id: "analytics", label: "Аналітика", icon: BarChart3, section: "Огляд" },
  { id: "monitoring", label: "Моніторинг", icon: Activity, section: "Огляд" },
  { id: "products", label: "Продукти", icon: Package, section: "Каталог" },
  { id: "categories", label: "Категорії", icon: FolderOpen, section: "Каталог" },
  { id: "bundles", label: "Набори", icon: Gift, section: "Каталог" },
  { id: "inventory", label: "Склад", icon: Boxes, section: "Каталог" },
  { id: "product-analytics", label: "Аналітика товарів", icon: PieChart, section: "Каталог" },
  { id: "orders", label: "Замовлення", icon: ShoppingCart, section: "Продажі" },
  { id: "promo", label: "Промокоди", icon: Tag, section: "Продажі" },
  { id: "flash-sales", label: "Flash Sale", icon: Zap, section: "Продажі" },
  { id: "users", label: "Користувачі", icon: Users, section: "Користувачі" },
  { id: "roles", label: "Ролі", icon: Shield, section: "Користувачі" },
  { id: "bans", label: "Блокування", icon: Ban, section: "Користувачі" },
  { id: "cohorts", label: "Когорти", icon: UsersRound, section: "Користувачі" },
  { id: "loyalty", label: "Лояльність", icon: TrendingUp, section: "Лояльність" },
  { id: "achievements", label: "Досягнення", icon: Trophy, section: "Лояльність" },
  { id: "news", label: "Новини", icon: Newspaper, section: "Контент" },
  { id: "banners", label: "Банери", icon: Image, section: "Контент" },
  { id: "support", label: "Підтримка", icon: MessageSquare, section: "Комунікації" },
  { id: "broadcast", label: "Розсилки", icon: Send, section: "Комунікації" },
  { id: "email-campaigns", label: "Email кампанії", icon: Mail, section: "Комунікації" },
  { id: "email-stats", label: "Email статистика", icon: LineChart, section: "Комунікації" },
  { id: "ab-tests", label: "A/B Тести", icon: FlaskConical, section: "Система" },
  { id: "audit", label: "Аудит", icon: History, section: "Система" },
  { id: "cron-jobs", label: "Cron задачі", icon: Clock, section: "Система" },
  { id: "settings", label: "Налаштування", icon: Settings, section: "Система" },
  { id: "api-keys", label: "API Ключі", icon: Lock, section: "Система", highlight: true },
];

const PINNED_KEY = 'admin_pinned_sections';

const AdminMobileNav = ({ activeTab, onTabChange }: AdminMobileNavProps) => {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [pinnedItems, setPinnedItems] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(PINNED_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const currentItem = allItems.find(item => item.id === activeTab);
  const CurrentIcon = currentItem?.icon || LayoutDashboard;

  useEffect(() => {
    localStorage.setItem(PINNED_KEY, JSON.stringify(pinnedItems));
  }, [pinnedItems]);

  const handleTabChange = (tab: string) => {
    onTabChange(tab);
    setOpen(false);
    setSearchQuery("");
  };

  const togglePin = (itemId: string) => {
    setPinnedItems(prev =>
      prev.includes(itemId)
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

  const sections = [...new Set(allItems.map(item => item.section))];

  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return null;
    const query = searchQuery.toLowerCase();
    return allItems.filter(item =>
      item.label.toLowerCase().includes(query) ||
      item.id.toLowerCase().includes(query)
    );
  }, [searchQuery]);

  const pinnedItemsData = useMemo(() => {
    return pinnedItems
      .map(id => allItems.find(item => item.id === id))
      .filter(Boolean) as typeof allItems;
  }, [pinnedItems]);

  const renderItem = (item: typeof allItems[0]) => {
    const Icon = item.icon;
    const isActive = activeTab === item.id;
    const isPinned = pinnedItems.includes(item.id);

    return (
      <div key={item.id} className="group flex items-center">
        <Button
          variant={isActive ? "secondary" : "ghost"}
          className={cn(
            "flex-1 justify-start gap-3 h-10",
            isActive && "bg-primary/10 text-primary font-medium",
            item.highlight && !isActive && "text-amber-500"
          )}
          onClick={() => handleTabChange(item.id)}
        >
          <Icon className="h-4 w-4" />
          {item.label}
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            "h-8 w-8",
            isPinned && "text-primary"
          )}
          onClick={(e) => {
            e.stopPropagation();
            togglePin(item.id);
          }}
          title={isPinned ? "Відкріпити" : "Закріпити"}
        >
          {isPinned ? (
            <PinOff className="h-4 w-4" />
          ) : (
            <Pin className="h-4 w-4" />
          )}
        </Button>
      </div>
    );
  };

  return (
    <div className="lg:hidden mb-4">
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button variant="outline" className="w-full justify-start gap-3">
            <Menu className="h-4 w-4" />
            <CurrentIcon className="h-4 w-4" />
            <span>{currentItem?.label || "Меню"}</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-80 p-0">
          <SheetHeader className="p-4 border-b">
            <SheetTitle>Адмін Панель</SheetTitle>
          </SheetHeader>
          
          {/* Search */}
          <div className="p-4 border-b">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Пошук розділів..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9"
              />
              {searchQuery && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                  onClick={() => setSearchQuery("")}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>

          <ScrollArea className="h-[calc(100vh-140px)]">
            <div className="p-4 space-y-4">
              {/* Search Results */}
              {filteredItems ? (
                filteredItems.length > 0 ? (
                  <div className="space-y-1">
                    {filteredItems.map(item => renderItem(item))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground text-sm">
                    <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>Нічого не знайдено</p>
                  </div>
                )
              ) : (
                <>
                  {/* Pinned Items */}
                  {pinnedItemsData.length > 0 && (
                    <>
                      <div>
                        <div className="flex items-center gap-2 text-muted-foreground text-sm font-medium px-2 mb-2">
                          <Pin className="h-3.5 w-3.5" />
                          <span>Закріплені</span>
                        </div>
                        <div className="space-y-1">
                          {pinnedItemsData.map(item => renderItem(item))}
                        </div>
                      </div>
                      <Separator />
                    </>
                  )}

                  {/* Regular Sections */}
                  {sections.map(section => (
                    <div key={section}>
                      <h3 className="text-sm font-medium text-muted-foreground mb-2 px-2">
                        {section}
                      </h3>
                      <div className="space-y-1">
                        {allItems
                          .filter(item => item.section === section)
                          .map(item => renderItem(item))}
                      </div>
                    </div>
                  ))}
                </>
              )}
            </div>
          </ScrollArea>
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default AdminMobileNav;
