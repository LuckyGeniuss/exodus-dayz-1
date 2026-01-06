import { useState } from "react";
import { 
  LayoutDashboard, BarChart3, PieChart, Package, FolderOpen, Gift, Boxes,
  ShoppingCart, Users, Shield, Ban, Tag, Zap, TrendingUp, Trophy,
  Newspaper, Image, MessageSquare, Send, History, Activity, UsersRound,
  FlaskConical, Mail, LineChart, Clock, Settings, Lock, ChevronDown, ChevronRight
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface AdminSidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
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
      { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
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
      { id: "inventory", label: "Склад", icon: Boxes },
      { id: "product-analytics", label: "Аналітика товарів", icon: PieChart },
    ],
  },
  {
    title: "Продажі",
    items: [
      { id: "orders", label: "Замовлення", icon: ShoppingCart },
      { id: "promo", label: "Промокоди", icon: Tag },
      { id: "flash-sales", label: "Flash Sale", icon: Zap },
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

const AdminSidebar = ({ activeTab, onTabChange }: AdminSidebarProps) => {
  const [openSections, setOpenSections] = useState<string[]>(
    menuSections.map(s => s.title)
  );

  const toggleSection = (title: string) => {
    setOpenSections(prev =>
      prev.includes(title)
        ? prev.filter(t => t !== title)
        : [...prev, title]
    );
  };

  return (
    <aside className="w-64 bg-card border-r border-border flex-shrink-0 hidden lg:block">
      <ScrollArea className="h-[calc(100vh-80px)]">
        <div className="p-4 space-y-2">
          {menuSections.map((section) => (
            <Collapsible
              key={section.title}
              open={openSections.includes(section.title)}
              onOpenChange={() => toggleSection(section.title)}
            >
              <CollapsibleTrigger asChild>
                <Button
                  variant="ghost"
                  className="w-full justify-between text-muted-foreground hover:text-foreground text-sm font-medium px-2"
                >
                  {section.title}
                  {openSections.includes(section.title) ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-1 mt-1">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  
                  return (
                    <Button
                      key={item.id}
                      variant={isActive ? "secondary" : "ghost"}
                      className={cn(
                        "w-full justify-start gap-3 pl-4 h-9 text-sm",
                        isActive && "bg-primary/10 text-primary font-medium",
                        item.highlight && !isActive && "text-amber-500"
                      )}
                      onClick={() => onTabChange(item.id)}
                    >
                      <Icon className="h-4 w-4" />
                      {item.label}
                    </Button>
                  );
                })}
              </CollapsibleContent>
            </Collapsible>
          ))}
        </div>
      </ScrollArea>
    </aside>
  );
};

export default AdminSidebar;
