import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdmin } from '@/hooks/useAdmin';
import { Loader2 } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import AdminSidebar from '@/components/admin/AdminSidebar';
import AdminMobileNav from '@/components/admin/AdminMobileNav';
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
import BannerManagement from '@/components/admin/BannerManagement';
import CronJobsManagement from '@/components/admin/CronJobsManagement';
import CategoryManagement from '@/components/admin/CategoryManagement';
import EmailStatsDetails from '@/components/admin/EmailStatsDetails';

const COLLAPSED_KEY = 'admin_sidebar_collapsed';

const Admin = () => {
  const { isAdmin, loading } = useAdmin();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isCollapsed, setIsCollapsed] = useState(() => {
    try {
      const saved = localStorage.getItem(COLLAPSED_KEY);
      return saved ? JSON.parse(saved) : false;
    } catch {
      return false;
    }
  });

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

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardStatsEnhanced />;
      case 'analytics':
        return <AnalyticsDashboard />;
      case 'product-analytics':
        return <ProductAnalytics />;
      case 'products':
        return <ProductManagement />;
      case 'categories':
        return <CategoryManagement />;
      case 'bundles':
        return <BundleManagement />;
      case 'inventory':
        return <InventoryManagement />;
      case 'orders':
        return <OrderManagementEnhanced />;
      case 'users':
        return <UserManagement />;
      case 'roles':
        return <RoleManagement />;
      case 'bans':
        return <UserBanManagement />;
      case 'promo':
        return <PromoCodeManagement />;
      case 'flash-sales':
        return <FlashSaleManagement />;
      case 'loyalty':
        return <LoyaltyManagement />;
      case 'achievements':
        return <AchievementManagement />;
      case 'news':
        return <NewsManagement />;
      case 'banners':
        return <BannerManagement />;
      case 'support':
        return <SupportTicketManagement />;
      case 'broadcast':
        return <BroadcastManagement />;
      case 'audit':
        return <AuditLogs />;
      case 'monitoring':
        return <MonitoringDashboard />;
      case 'cohorts':
        return <UserCohortsAnalytics />;
      case 'ab-tests':
        return <ABTestingManager />;
      case 'email-campaigns':
        return <EmailCampaignManager />;
      case 'email-stats':
        return <EmailStatsDetails />;
      case 'cron-jobs':
        return <CronJobsManagement />;
      case 'settings':
        return <SettingsManagement />;
      case 'api-keys':
        return <SuperAdminSettings />;
      default:
        return <DashboardStatsEnhanced />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <div className="flex-1 flex">
        <AdminSidebar 
          activeTab={activeTab} 
          onTabChange={setActiveTab}
          isCollapsed={isCollapsed}
          onCollapsedChange={setIsCollapsed}
        />
        <main className="flex-1 p-6 overflow-auto">
          <AdminMobileNav activeTab={activeTab} onTabChange={setActiveTab} />
          <h1 className="text-3xl font-military mb-6 lg:mb-8">Адмін Панель</h1>
          {renderContent()}
        </main>
      </div>
      <Footer />
    </div>
  );
};

export default Admin;
