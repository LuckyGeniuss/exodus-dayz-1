import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdmin } from '@/hooks/useAdmin';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Package, ShoppingCart, Users, Trophy, Tag, Settings, LayoutDashboard, BarChart3, TrendingUp, Zap, Shield, Ban, History, Lock, Send, MessageSquare, Activity, FlaskConical, Mail, UsersRound, Gift, Boxes, Newspaper, PieChart } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import DashboardStatsEnhanced from '@/components/admin/DashboardStatsEnhanced';
import AnalyticsDashboard from '@/components/admin/AnalyticsDashboard';
import ProductManagement from '@/components/admin/ProductManagement';
import OrderManagementEnhanced from '@/components/admin/OrderManagementEnhanced';
import UserManagement from '@/components/admin/UserManagement';
import AchievementManagement from '@/components/admin/AchievementManagement';
import PromoCodeManagement from '@/components/admin/PromoCodeManagement';
import LoyaltyManagement from '@/components/admin/LoyaltyManagement';
import FlashSaleManagement from '@/components/admin/FlashSaleManagement';
import SettingsManagement from '@/components/admin/SettingsManagement';
import RoleManagement from '@/components/admin/RoleManagement';
import UserBanManagement from '@/components/admin/UserBanManagement';
import AuditLogs from '@/components/admin/AuditLogs';
import SuperAdminSettings from '@/components/admin/SuperAdminSettings';
import BroadcastManagement from '@/components/admin/BroadcastManagement';
import SupportTicketManagement from '@/components/admin/SupportTicketManagement';
import MonitoringDashboard from '@/components/admin/MonitoringDashboard';
import UserCohortsAnalytics from '@/components/admin/UserCohortsAnalytics';
import ABTestingManager from '@/components/admin/ABTestingManager';
import EmailCampaignManager from '@/components/admin/EmailCampaignManager';
import BundleManagement from '@/components/admin/BundleManagement';
import InventoryManagement from '@/components/admin/InventoryManagement';
import NewsManagement from '@/components/admin/NewsManagement';
import ProductAnalytics from '@/components/admin/ProductAnalytics';

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
            <TabsTrigger value="product-analytics" className="flex items-center gap-2">
              <PieChart className="h-4 w-4" />
              Товари (аналітика)
            </TabsTrigger>
            <TabsTrigger value="products" className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              Продукти
            </TabsTrigger>
            <TabsTrigger value="bundles" className="flex items-center gap-2">
              <Gift className="h-4 w-4" />
              Набори
            </TabsTrigger>
            <TabsTrigger value="inventory" className="flex items-center gap-2">
              <Boxes className="h-4 w-4" />
              Склад
            </TabsTrigger>
            <TabsTrigger value="orders" className="flex items-center gap-2">
              <ShoppingCart className="h-4 w-4" />
              Замовлення
            </TabsTrigger>
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Користувачі
            </TabsTrigger>
            <TabsTrigger value="roles" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Ролі
            </TabsTrigger>
            <TabsTrigger value="bans" className="flex items-center gap-2">
              <Ban className="h-4 w-4" />
              Блокування
            </TabsTrigger>
            <TabsTrigger value="promo" className="flex items-center gap-2">
              <Tag className="h-4 w-4" />
              Промокоди
            </TabsTrigger>
            <TabsTrigger value="flash-sales" className="flex items-center gap-2">
              <Zap className="h-4 w-4" />
              Flash Sale
            </TabsTrigger>
            <TabsTrigger value="loyalty" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Лояльність
            </TabsTrigger>
            <TabsTrigger value="achievements" className="flex items-center gap-2">
              <Trophy className="h-4 w-4" />
              Досягнення
            </TabsTrigger>
            <TabsTrigger value="news" className="flex items-center gap-2">
              <Newspaper className="h-4 w-4" />
              Новини
            </TabsTrigger>
            <TabsTrigger value="support" className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Підтримка
            </TabsTrigger>
            <TabsTrigger value="broadcast" className="flex items-center gap-2">
              <Send className="h-4 w-4" />
              Розсилки
            </TabsTrigger>
            <TabsTrigger value="audit" className="flex items-center gap-2">
              <History className="h-4 w-4" />
              Аудит
            </TabsTrigger>
            <TabsTrigger value="monitoring" className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Моніторинг
            </TabsTrigger>
            <TabsTrigger value="cohorts" className="flex items-center gap-2">
              <UsersRound className="h-4 w-4" />
              Когорти
            </TabsTrigger>
            <TabsTrigger value="ab-tests" className="flex items-center gap-2">
              <FlaskConical className="h-4 w-4" />
              A/B Тести
            </TabsTrigger>
            <TabsTrigger value="email-campaigns" className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Email
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Налаштування
            </TabsTrigger>
            <TabsTrigger value="api-keys" className="flex items-center gap-2 text-amber-500">
              <Lock className="h-4 w-4" />
              API Ключі
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard">
            <DashboardStatsEnhanced />
          </TabsContent>

          <TabsContent value="analytics">
            <AnalyticsDashboard />
          </TabsContent>

          <TabsContent value="product-analytics">
            <ProductAnalytics />
          </TabsContent>

          <TabsContent value="products">
            <ProductManagement />
          </TabsContent>

          <TabsContent value="bundles">
            <BundleManagement />
          </TabsContent>

          <TabsContent value="inventory">
            <InventoryManagement />
          </TabsContent>

          <TabsContent value="orders">
            <OrderManagementEnhanced />
          </TabsContent>

          <TabsContent value="users">
            <UserManagement />
          </TabsContent>

          <TabsContent value="roles">
            <RoleManagement />
          </TabsContent>

          <TabsContent value="bans">
            <UserBanManagement />
          </TabsContent>

          <TabsContent value="promo">
            <PromoCodeManagement />
          </TabsContent>

          <TabsContent value="flash-sales">
            <FlashSaleManagement />
          </TabsContent>

          <TabsContent value="loyalty">
            <LoyaltyManagement />
          </TabsContent>

          <TabsContent value="achievements">
            <AchievementManagement />
          </TabsContent>

          <TabsContent value="news">
            <NewsManagement />
          </TabsContent>

          <TabsContent value="support">
            <SupportTicketManagement />
          </TabsContent>

          <TabsContent value="broadcast">
            <BroadcastManagement />
          </TabsContent>

          <TabsContent value="audit">
            <AuditLogs />
          </TabsContent>

          <TabsContent value="monitoring">
            <MonitoringDashboard />
          </TabsContent>

          <TabsContent value="cohorts">
            <UserCohortsAnalytics />
          </TabsContent>

          <TabsContent value="ab-tests">
            <ABTestingManager />
          </TabsContent>

          <TabsContent value="email-campaigns">
            <EmailCampaignManager />
          </TabsContent>

          <TabsContent value="settings">
            <SettingsManagement />
          </TabsContent>

          <TabsContent value="api-keys">
            <SuperAdminSettings />
          </TabsContent>
        </Tabs>
      </main>
      <Footer />
    </div>
  );
};

export default Admin;
