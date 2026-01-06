import { 
  LayoutDashboard, BarChart3, PieChart, Package, FolderOpen, Gift, Boxes,
  ShoppingCart, Users, Shield, Ban, Tag, Zap, TrendingUp, Trophy,
  Newspaper, Image, MessageSquare, Send, History, Activity, UsersRound,
  FlaskConical, Mail, LineChart, Clock, Settings, Lock, Menu
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { useState } from "react";

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

const AdminMobileNav = ({ activeTab, onTabChange }: AdminMobileNavProps) => {
  const [open, setOpen] = useState(false);
  const currentItem = allItems.find(item => item.id === activeTab);
  const CurrentIcon = currentItem?.icon || LayoutDashboard;

  const handleTabChange = (tab: string) => {
    onTabChange(tab);
    setOpen(false);
  };

  const sections = [...new Set(allItems.map(item => item.section))];

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
          <ScrollArea className="h-[calc(100vh-80px)]">
            <div className="p-4 space-y-4">
              {sections.map(section => (
                <div key={section}>
                  <h3 className="text-sm font-medium text-muted-foreground mb-2 px-2">
                    {section}
                  </h3>
                  <div className="space-y-1">
                    {allItems
                      .filter(item => item.section === section)
                      .map(item => {
                        const Icon = item.icon;
                        const isActive = activeTab === item.id;
                        
                        return (
                          <Button
                            key={item.id}
                            variant={isActive ? "secondary" : "ghost"}
                            className={cn(
                              "w-full justify-start gap-3 h-10",
                              isActive && "bg-primary/10 text-primary font-medium",
                              item.highlight && !isActive && "text-amber-500"
                            )}
                            onClick={() => handleTabChange(item.id)}
                          >
                            <Icon className="h-4 w-4" />
                            {item.label}
                          </Button>
                        );
                      })}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default AdminMobileNav;
