import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdmin } from '@/hooks/useAdmin';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Package, ShoppingCart, Users, Trophy, Tag, Settings, LayoutDashboard, BarChart3, TrendingUp } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import DashboardStats from '@/components/admin/DashboardStats';
import AnalyticsDashboard from '@/components/admin/AnalyticsDashboard';
import ProductManagement from '@/components/admin/ProductManagement';
import OrderManagement from '@/components/admin/OrderManagement';
import UserManagement from '@/components/admin/UserManagement';
import AchievementManagement from '@/components/admin/AchievementManagement';
import PromoCodeManagement from '@/components/admin/PromoCodeManagement';
import LoyaltyManagement from '@/components/admin/LoyaltyManagement';
import SettingsManagement from '@/components/admin/SettingsManagement';

const Admin = () => {
  const { isAdmin, loading } = useAdmin();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !isAdmin) {
      navigate('/');
    }
  }, [isAdmin, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8">
        <h1 className="text-4xl font-military mb-8">Адмін Панель</h1>

        <Tabs defaultValue="dashboard" className="w-full">
          <TabsList className="flex flex-wrap gap-1 h-auto mb-8">
            <TabsTrigger value="dashboard" className="flex items-center gap-2">
              <LayoutDashboard className="h-4 w-4" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Аналітика
            </TabsTrigger>
            <TabsTrigger value="products" className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              Продукти
            </TabsTrigger>
            <TabsTrigger value="orders" className="flex items-center gap-2">
              <ShoppingCart className="h-4 w-4" />
              Замовлення
            </TabsTrigger>
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Користувачі
            </TabsTrigger>
            <TabsTrigger value="promo" className="flex items-center gap-2">
              <Tag className="h-4 w-4" />
              Промокоди
            </TabsTrigger>
            <TabsTrigger value="loyalty" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Лояльність
            </TabsTrigger>
            <TabsTrigger value="achievements" className="flex items-center gap-2">
              <Trophy className="h-4 w-4" />
              Досягнення
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Налаштування
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard">
            <DashboardStats />
          </TabsContent>

          <TabsContent value="analytics">
            <AnalyticsDashboard />
          </TabsContent>

          <TabsContent value="products">
            <ProductManagement />
          </TabsContent>

          <TabsContent value="orders">
            <OrderManagement />
          </TabsContent>

          <TabsContent value="users">
            <UserManagement />
          </TabsContent>

          <TabsContent value="promo">
            <PromoCodeManagement />
          </TabsContent>

          <TabsContent value="loyalty">
            <LoyaltyManagement />
          </TabsContent>

          <TabsContent value="achievements">
            <AchievementManagement />
          </TabsContent>

          <TabsContent value="settings">
            <SettingsManagement />
          </TabsContent>
        </Tabs>
      </main>
      <Footer />
    </div>
  );
};

export default Admin;
