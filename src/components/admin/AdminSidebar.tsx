import { useState, useMemo, useEffect } from "react";
import { 
  LayoutDashboard, BarChart3, PieChart, Package, FolderOpen, Gift, Boxes,
  ShoppingCart, Users, Shield, Ban, Tag, Zap, TrendingUp, Trophy,
  Newspaper, Image, MessageSquare, Send, History, Activity, UsersRound,
  FlaskConical, Mail, LineChart, Clock, Settings, Lock, ChevronDown, ChevronRight,
  Search, Pin, PinOff, X, PanelLeftClose, PanelLeft
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface AdminSidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  isCollapsed: boolean;
  onCollapsedChange: (collapsed: boolean) => void;
}

interface MenuItem {
  id: string;
  label: string;
  icon: React.ElementType;
  highlight?: boolean;
}

interface MenuSection {
  title: string;
  items: MenuItem[];
}

const menuSections: MenuSection[] = [
  {
    title: "Огляд",
    items: [
      { id: "dashboard", label: "Панель", icon: LayoutDashboard },
      { id: "analytics", label: "Аналітика", icon: BarChart3 },
      { id: "monitoring", label: "Моніторинг", icon: Activity },
    ],
  },
  {
    title: "Каталог",
    items: [
      { id: "products", label: "Продукти", icon: Package },
      { id: "categories", label: "Категорії", icon: FolderOpen },
      { id: "bundles", label: "Набори", icon: Gift },
      { id: "bundle-analytics", label: "Аналітика наборів", icon: LineChart },
      { id: "inventory", label: "Склад", icon: Boxes },
      { id: "product-analytics", label: "Аналітика товарів", icon: PieChart },
    ],
  },
  {
    title: "Продажі",
    items: [
      { id: "orders", label: "Замовлення", icon: ShoppingCart },
      { id: "promo", label: "Промокоди", icon: Tag },
      { id: "flash-sales", label: "Флеш-акції", icon: Zap },
    ],
  },
  {
    title: "Користувачі",
    items: [
      { id: "users", label: "Користувачі", icon: Users },
      { id: "roles", label: "Ролі", icon: Shield },
      { id: "bans", label: "Блокування", icon: Ban },
      { id: "cohorts", label: "Когорти", icon: UsersRound },
    ],
  },
  {
    title: "Лояльність",
    items: [
      { id: "loyalty", label: "Програма лояльності", icon: TrendingUp },
      { id: "achievements", label: "Досягнення", icon: Trophy },
    ],
  },
  {
    title: "Контент",
    items: [
      { id: "news", label: "Новини", icon: Newspaper },
      { id: "banners", label: "Банери", icon: Image },
    ],
  },
  {
    title: "Комунікації",
    items: [
      { id: "support", label: "Підтримка", icon: MessageSquare },
      { id: "broadcast", label: "Розсилки", icon: Send },
      { id: "promo-email", label: "Промо-розсилка", icon: Mail, highlight: true },
      { id: "email-campaigns", label: "Email кампанії", icon: Mail },
      { id: "email-stats", label: "Email статистика", icon: LineChart },
    ],
  },
  {
    title: "Система",
    items: [
      { id: "ab-tests", label: "A/B Тести", icon: FlaskConical },
      { id: "audit", label: "Аудит", icon: History },
      { id: "cron-jobs", label: "Cron задачі", icon: Clock },
      { id: "settings", label: "Налаштування", icon: Settings },
      { id: "api-keys", label: "API Ключі", icon: Lock, highlight: true },
    ],
  },
];

// All items flat list for search
const allItems = menuSections.flatMap(section => 
  section.items.map(item => ({ ...item, section: section.title }))
);

const PINNED_KEY = 'admin_pinned_sections';
const COLLAPSED_KEY = 'admin_sidebar_collapsed';

const AdminSidebar = ({ activeTab, onTabChange, isCollapsed, onCollapsedChange }: AdminSidebarProps) => {
  const [openSections, setOpenSections] = useState<string[]>(
    menuSections.map(s => s.title)
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [pinnedItems, setPinnedItems] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(PINNED_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Persist pinned items
  useEffect(() => {
    localStorage.setItem(PINNED_KEY, JSON.stringify(pinnedItems));
  }, [pinnedItems]);

  // Persist collapsed state
  useEffect(() => {
    localStorage.setItem(COLLAPSED_KEY, JSON.stringify(isCollapsed));
  }, [isCollapsed]);

  const toggleSection = (title: string) => {
    setOpenSections(prev =>
      prev.includes(title)
        ? prev.filter(t => t !== title)
        : [...prev, title]
    );
  };

  const togglePin = (itemId: string) => {
    setPinnedItems(prev =>
      prev.includes(itemId)
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

  // Filtered items based on search
  const filteredSections = useMemo(() => {
    if (!searchQuery.trim()) return menuSections;

    const query = searchQuery.toLowerCase();
    return menuSections
      .map(section => ({
        ...section,
        items: section.items.filter(item =>
          item.label.toLowerCase().includes(query) ||
          item.id.toLowerCase().includes(query)
        ),
      }))
      .filter(section => section.items.length > 0);
  }, [searchQuery]);

  // Pinned items data
  const pinnedItemsData = useMemo(() => {
    return pinnedItems
      .map(id => allItems.find(item => item.id === id))
      .filter(Boolean) as (MenuItem & { section: string })[];
  }, [pinnedItems]);

  const renderMenuItem = (item: MenuItem, showPinButton = true) => {
    const Icon = item.icon;
    const isActive = activeTab === item.id;
    const isPinned = pinnedItems.includes(item.id);

    if (isCollapsed) {
      return (
        <Tooltip key={item.id} delayDuration={0}>
          <TooltipTrigger asChild>
            <Button
              variant={isActive ? "secondary" : "ghost"}
              size="icon"
              className={cn(
                "w-10 h-10",
                isActive && "bg-primary/10 text-primary",
                item.highlight && !isActive && "text-amber-500"
              )}
              onClick={() => onTabChange(item.id)}
            >
              <Icon className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right" className="flex items-center gap-2">
            {item.label}
            {isPinned && <Pin className="h-3 w-3 text-primary" />}
          </TooltipContent>
        </Tooltip>
      );
    }

    return (
      <div key={item.id} className="group flex items-center">
        <Button
          variant={isActive ? "secondary" : "ghost"}
          className={cn(
            "flex-1 justify-start gap-3 pl-4 h-9 text-sm",
            isActive && "bg-primary/10 text-primary font-medium",
            item.highlight && !isActive && "text-amber-500"
          )}
          onClick={() => onTabChange(item.id)}
        >
          <Icon className="h-4 w-4" />
          {item.label}
        </Button>
        {showPinButton && (
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              "h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity",
              isPinned && "opacity-100 text-primary"
            )}
            onClick={() => togglePin(item.id)}
            title={isPinned ? "Відкріпити" : "Закріпити"}
          >
            {isPinned ? (
              <PinOff className="h-3.5 w-3.5" />
            ) : (
              <Pin className="h-3.5 w-3.5" />
            )}
          </Button>
        )}
      </div>
    );
  };

  return (
    <TooltipProvider>
      <aside className={cn(
        "bg-card border-r border-border flex-shrink-0 hidden lg:flex flex-col transition-all duration-300",
        isCollapsed ? "w-16" : "w-64"
      )}>
        {/* Collapse Toggle */}
        <div className={cn(
          "p-2 border-b border-border flex",
          isCollapsed ? "justify-center" : "justify-end"
        )}>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onCollapsedChange(!isCollapsed)}
            title={isCollapsed ? "Розгорнути" : "Згорнути"}
          >
            {isCollapsed ? (
              <PanelLeft className="h-4 w-4" />
            ) : (
              <PanelLeftClose className="h-4 w-4" />
            )}
          </Button>
        </div>

        {/* Search - hidden when collapsed */}
        {!isCollapsed && (
          <div className="p-4 border-b border-border">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Пошук розділів..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9 bg-background"
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
        )}

        <ScrollArea className="flex-1">
          <div className={cn("space-y-2", isCollapsed ? "p-2" : "p-4")}>
            {/* Pinned Items Section */}
            {pinnedItemsData.length > 0 && !searchQuery && (
              <>
                <div className={cn("space-y-1", isCollapsed && "flex flex-col items-center")}>
                  {!isCollapsed && (
                    <div className="flex items-center gap-2 text-muted-foreground text-sm font-medium px-2 mb-2">
                      <Pin className="h-3.5 w-3.5" />
                      <span>Закріплені</span>
                    </div>
                  )}
                  {pinnedItemsData.map(item => renderMenuItem(item, !isCollapsed))}
                </div>
                <Separator className="my-4" />
              </>
            )}

            {/* Collapsed Mode - just icons */}
            {isCollapsed ? (
              <div className="flex flex-col items-center space-y-1">
                {allItems.map(item => renderMenuItem(item, false))}
              </div>
            ) : (
              <>
                {/* Regular Sections */}
                {filteredSections.map((section) => (
                  <Collapsible
                    key={section.title}
                    open={openSections.includes(section.title) || !!searchQuery}
                    onOpenChange={() => !searchQuery && toggleSection(section.title)}
                  >
                    <CollapsibleTrigger asChild>
                      <Button
                        variant="ghost"
                        className="w-full justify-between text-muted-foreground hover:text-foreground text-sm font-medium px-2"
                        disabled={!!searchQuery}
                      >
                        {section.title}
                        {!searchQuery && (
                          openSections.includes(section.title) ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )
                        )}
                      </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="space-y-1 mt-1">
                      {section.items.map(item => renderMenuItem(item))}
                    </CollapsibleContent>
                  </Collapsible>
                ))}

                {/* No results */}
                {searchQuery && filteredSections.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground text-sm">
                    <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>Нічого не знайдено</p>
                  </div>
                )}
              </>
            )}
          </div>
        </ScrollArea>
      </aside>
    </TooltipProvider>
  );
};

export default AdminSidebar;
