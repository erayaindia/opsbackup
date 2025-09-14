import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthWrapper } from "./components/AuthWrapper";
import { Layout } from "./components/Layout";
import { PermissionGuard } from "./components/PermissionGuard";
import { PermissionsProvider } from "./contexts/PermissionsContext";
import Dashboard from "./pages/Dashboard";
import Orders from "./pages/Orders";
import AbandonedCart from "./pages/orders/AbandonedCart";
import Inventory from "./pages/Inventory";
import InventoryHistory from "./pages/InventoryHistory";
import NewInventory from "./pages/NewInventory";
import Tasks from "./pages/Tasks";
import TeamManagement from "./pages/TeamManagement";
import Packing from "./pages/Packing";
import Support from "./pages/Support";
import Chat from "./pages/Chat";
import Settings from "./pages/Settings";
import { Users } from "./pages/users/Users";
import Analytics from "./pages/Analytics";
import Security from "./pages/Security";
import TeamChat from "./pages/TeamChat";
import NotFound from "./pages/NotFound";
import Auth from "./pages/Auth";
import Onboard from "./pages/Onboard";

// Fulfillment pages
import FulfillmentPacking from "./pages/fulfillment/FulfillmentPacking";
import FulfillmentDisputes from "./pages/fulfillment/FulfillmentDisputes";
import FulfillmentQualityCheck from "./pages/fulfillment/FulfillmentQualityCheck";
import FulfillmentLabelPrinting from "./pages/fulfillment/FulfillmentLabelPrinting";
import FulfillmentPickLists from "./pages/fulfillment/FulfillmentPickLists";
import FulfillmentRTONDR from "./pages/fulfillment/FulfillmentRTONDR";
import FulfillmentInventorySync from "./pages/fulfillment/FulfillmentInventorySync";

// Content pages
import Planning from "./pages/content/Planning";
import ContentLibrary from "./pages/content/ContentLibrary";
import ContentCreator from "./pages/content/ContentCreator";
import ContentDetail from "./pages/content/ContentDetail";

// Customer Support pages
import FeedbackComplaints from "./pages/support/FeedbackComplaints";
import ReturnsRefunds from "./pages/support/ReturnsRefunds";
import NDRRTOManagement from "./pages/support/NDRRTOManagement";

// Team Hub pages
import Attendance from "./pages/team-hub/Attendance";
import TasksTodos from "./pages/team-hub/TasksTodos";
import Announcements from "./pages/team-hub/Announcements";
import TrainingKnowledge from "./pages/team-hub/TrainingKnowledge";
import Holidays from "./pages/team-hub/Holidays";

// Marketing pages
import Campaigns from "./pages/marketing/Campaigns";
import AdsTesting from "./pages/marketing/AdsTesting";
import PerformanceReports from "./pages/marketing/PerformanceReports";
import InfluencerCollabs from "./pages/marketing/InfluencerCollabs";

// Product Management pages
import ProductsVariants from "./pages/products/ProductsVariants";
import Products from "./pages/products/Products";
import Categories from "./pages/products/Categories";
import PerformanceInsight from "./pages/products/PerformanceInsight";
import Suppliers from "./pages/products/Suppliers";
import InventoryManagement from "./pages/products/InventoryManagement";
import SampleTesting from "./pages/products/SampleTesting";
import Warehouse from "./pages/Warehouse";
import SuppliersPage from "./pages/Suppliers";

// Finance pages
import BankAccounts from "./pages/finance/BankAccounts";
import SalesRevenue from "./pages/finance/SalesRevenue";
import ExpensesPayouts from "./pages/finance/ExpensesPayouts";
import ProfitLoss from "./pages/finance/ProfitLoss";
import GSTTax from "./pages/finance/GSTTax";
import PendingRemittances from "./pages/finance/PendingRemittances";
import Purchase from "./pages/finance/Purchase";
import Bills from "./pages/finance/Bills";

// Management pages
import PeopleRoles from "./pages/management/PeopleRoles";
import SystemSettings from "./pages/management/SystemSettings";
import Integrations from "./pages/management/Integrations";
import AnalyticsInsights from "./pages/management/AnalyticsInsights";

// Admin pages
import OnboardingApplications from "./pages/admin/OnboardingApplications";

// Profile page
import Profile from "./pages/Profile";

// Alerts pages
import InventoryAlerts from "./pages/alerts/InventoryAlerts";
import DisputeAlerts from "./pages/alerts/DisputeAlerts";
import SystemNotifications from "./pages/alerts/SystemNotifications";

// Logs page
import Logs from "./pages/Logs";

const App = () => (
  <TooltipProvider>
    <PermissionsProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
      <Routes>
        <Route path="/auth" element={<Auth />} />
        <Route path="/onboard" element={<Onboard />} />
        <Route path="/*" element={
          <AuthWrapper>
            <Routes>
              <Route path="/" element={<Layout />}>
                <Route index element={<Dashboard />} />
                <Route path="dashboard" element={<Dashboard />} />
                <Route path="inventory" element={
                  <PermissionGuard requiredModule="products">
                    <Inventory />
                  </PermissionGuard>
                } />
                <Route path="product/inventory" element={
                  <PermissionGuard requiredModule="products">
                    <NewInventory />
                  </PermissionGuard>
                } />
                <Route path="inventory-history" element={
                  <PermissionGuard requiredModule="products">
                    <InventoryHistory />
                  </PermissionGuard>
                } />
                <Route path="products/suppliers" element={
                  <PermissionGuard requiredModule="products">
                    <SuppliersPage />
                  </PermissionGuard>
                } />
                <Route path="orders" element={
                  <PermissionGuard requiredModule="orders">
                    <Orders />
                  </PermissionGuard>
                } />
                <Route path="orders/abandoned-cart" element={
                  <PermissionGuard requiredModule="orders">
                    <AbandonedCart />
                  </PermissionGuard>
                } />
                <Route path="packing" element={<Packing />} />
                <Route path="support" element={
                  <PermissionGuard requiredModule="support">
                    <Support />
                  </PermissionGuard>
                } />
                <Route path="chat" element={<Chat />} />
                <Route path="tasks" element={<Tasks />} />
                <Route path="team" element={<TeamManagement />} />
                <Route path="users" element={
                  <PermissionGuard requiredModule="management" requiredRole={["admin", "super_admin"]}>
                    <Users />
                  </PermissionGuard>
                } />
                <Route path="settings" element={<Settings />} />
                <Route path="profile" element={<Profile />} />
                <Route path="analytics" element={
                  <PermissionGuard requiredModule="analytics">
                    <Analytics />
                  </PermissionGuard>
                } />
                <Route path="security" element={<Security />} />
                
                {/* Fulfillment routes */}
                <Route path="fulfillment/packing" element={
                  <PermissionGuard requiredModule="fulfillment">
                    <FulfillmentPacking />
                  </PermissionGuard>
                } />
                <Route path="fulfillment/disputes" element={
                  <PermissionGuard requiredModule="fulfillment">
                    <FulfillmentDisputes />
                  </PermissionGuard>
                } />
                <Route path="fulfillment/quality-check" element={
                  <PermissionGuard requiredModule="fulfillment">
                    <FulfillmentQualityCheck />
                  </PermissionGuard>
                } />
                <Route path="fulfillment/label-printing" element={
                  <PermissionGuard requiredModule="fulfillment">
                    <FulfillmentLabelPrinting />
                  </PermissionGuard>
                } />
                <Route path="fulfillment/pick-lists" element={
                  <PermissionGuard requiredModule="fulfillment">
                    <FulfillmentPickLists />
                  </PermissionGuard>
                } />
                <Route path="fulfillment/rto-ndr" element={
                  <PermissionGuard requiredModule="fulfillment">
                    <FulfillmentRTONDR />
                  </PermissionGuard>
                } />
                <Route path="fulfillment/inventory-sync" element={
                  <PermissionGuard requiredModule="fulfillment">
                    <FulfillmentInventorySync />
                  </PermissionGuard>
                } />

                {/* Content routes */}
                <Route path="content/planning" element={
                  <PermissionGuard requiredModule="content">
                    <Planning />
                  </PermissionGuard>
                } />
                <Route path="content/library" element={
                  <PermissionGuard requiredModule="content">
                    <ContentLibrary />
                  </PermissionGuard>
                } />
                <Route path="content/creator" element={
                  <PermissionGuard requiredModule="content">
                    <ContentCreator />
                  </PermissionGuard>
                } />
                
                {/* Customer Support routes */}
                <Route path="support/feedback-complaints" element={
                  <PermissionGuard requiredModule="support">
                    <FeedbackComplaints />
                  </PermissionGuard>
                } />
                <Route path="support/returns-refunds" element={
                  <PermissionGuard requiredModule="support">
                    <ReturnsRefunds />
                  </PermissionGuard>
                } />
                <Route path="support/ndr-rto" element={
                  <PermissionGuard requiredModule="support">
                    <NDRRTOManagement />
                  </PermissionGuard>
                } />
                
                {/* Team Hub routes */}
                <Route path="team-hub/attendance" element={
                  <PermissionGuard requiredModule="team-hub">
                    <Attendance />
                  </PermissionGuard>
                } />
                <Route path="team-hub/tasks" element={
                  <PermissionGuard requiredModule="team-hub">
                    <TasksTodos />
                  </PermissionGuard>
                } />
                <Route path="team-hub/chat" element={
                  <PermissionGuard requiredModule="team-hub">
                    <TeamChat />
                  </PermissionGuard>
                } />
                <Route path="team-hub/chat/:channelId" element={
                  <PermissionGuard requiredModule="team-hub">
                    <TeamChat />
                  </PermissionGuard>
                } />
                <Route path="team-hub/announcements" element={
                  <PermissionGuard requiredModule="team-hub">
                    <Announcements />
                  </PermissionGuard>
                } />
                <Route path="team-hub/holidays" element={
                  <PermissionGuard requiredModule="team-hub">
                    <Holidays />
                  </PermissionGuard>
                } />
                
                {/* Marketing & Growth routes */}
                <Route path="marketing/campaigns" element={
                  <PermissionGuard requiredModule="marketing">
                    <Campaigns />
                  </PermissionGuard>
                } />
                <Route path="marketing/ads-testing" element={
                  <PermissionGuard requiredModule="marketing">
                    <AdsTesting />
                  </PermissionGuard>
                } />
                <Route path="marketing/performance-reports" element={
                  <PermissionGuard requiredModule="marketing">
                    <PerformanceReports />
                  </PermissionGuard>
                } />
                <Route path="marketing/influencer-collabs" element={
                  <PermissionGuard requiredModule="marketing">
                    <InfluencerCollabs />
                  </PermissionGuard>
                } />
                
                {/* Product Management routes */}
                <Route path="products/products-variants" element={
                  <PermissionGuard requiredModule="products">
                    <ProductsVariants />
                  </PermissionGuard>
                } />
                <Route path="products" element={
                  <PermissionGuard requiredModule="products">
                    <Products />
                  </PermissionGuard>
                } />
                <Route path="products/categories" element={
                  <PermissionGuard requiredModule="products">
                    <Categories />
                  </PermissionGuard>
                } />
                <Route path="products/performance-insight" element={
                  <PermissionGuard requiredModule="products">
                    <PerformanceInsight />
                  </PermissionGuard>
                } />
                <Route path="products/suppliers" element={
                  <PermissionGuard requiredModule="products">
                    <Suppliers />
                  </PermissionGuard>
                } />
                <Route path="inventory" element={
                  <PermissionGuard requiredModule="products">
                    <Inventory />
                  </PermissionGuard>
                } />
                <Route path="product/inventory" element={
                  <PermissionGuard requiredModule="products">
                    <NewInventory />
                  </PermissionGuard>
                } />
                <Route path="products/sample-testing" element={
                  <PermissionGuard requiredModule="products">
                    <SampleTesting />
                  </PermissionGuard>
                } />
                <Route path="products/warehouse" element={
                  <PermissionGuard requiredModule="products">
                    <Warehouse />
                  </PermissionGuard>
                } />
                
                {/* Accounts routes */}
                <Route path="account/bank-accounts" element={
                  <PermissionGuard requiredModule="finance">
                    <BankAccounts />
                  </PermissionGuard>
                } />
                <Route path="account/sales-revenue" element={
                  <PermissionGuard requiredModule="finance">
                    <SalesRevenue />
                  </PermissionGuard>
                } />
                <Route path="account/expenses-payouts" element={
                  <PermissionGuard requiredModule="finance">
                    <ExpensesPayouts />
                  </PermissionGuard>
                } />
                <Route path="account/profit-loss" element={
                  <PermissionGuard requiredModule="finance">
                    <ProfitLoss />
                  </PermissionGuard>
                } />
                <Route path="account/gst-tax" element={
                  <PermissionGuard requiredModule="finance">
                    <GSTTax />
                  </PermissionGuard>
                } />
                <Route path="account/pending-remittances" element={
                  <PermissionGuard requiredModule="finance">
                    <PendingRemittances />
                  </PermissionGuard>
                } />
                <Route path="account/purchase" element={
                  <PermissionGuard requiredModule="finance">
                    <Purchase />
                  </PermissionGuard>
                } />
                <Route path="account/bills" element={
                  <PermissionGuard requiredModule="finance">
                    <Bills />
                  </PermissionGuard>
                } />
                
                {/* Management & Admin routes */}
                <Route path="management/people-roles" element={
                  <PermissionGuard requiredModule="management" requiredRole={["admin", "super_admin"]}>
                    <PeopleRoles />
                  </PermissionGuard>
                } />
                <Route path="management/system-settings" element={
                  <PermissionGuard requiredModule="management" requiredRole={["admin", "super_admin"]}>
                    <SystemSettings />
                  </PermissionGuard>
                } />
                <Route path="management/integrations" element={
                  <PermissionGuard requiredModule="management" requiredRole={["admin", "super_admin"]}>
                    <Integrations />
                  </PermissionGuard>
                } />
                <Route path="management/analytics-insights" element={
                  <PermissionGuard requiredModule="management" requiredRole={["admin", "super_admin"]}>
                    <AnalyticsInsights />
                  </PermissionGuard>
                } />
                
                {/* Admin routes */}
                <Route path="admin/onboarding" element={
                  <PermissionGuard requiredModule="management" requiredRole={["admin", "super_admin"]}>
                    <OnboardingApplications />
                  </PermissionGuard>
                } />
                
                {/* Alerts routes */}
                <Route path="alerts/inventory" element={
                  <PermissionGuard requiredModule="alerts">
                    <InventoryAlerts />
                  </PermissionGuard>
                } />
                <Route path="alerts/disputes" element={
                  <PermissionGuard requiredModule="alerts">
                    <DisputeAlerts />
                  </PermissionGuard>
                } />
                <Route path="alerts/system" element={
                  <PermissionGuard requiredModule="alerts">
                    <SystemNotifications />
                  </PermissionGuard>
                } />
                
                {/* Training routes */}
                <Route path="training/hub" element={
                  <PermissionGuard requiredModule="training">
                    <TrainingKnowledge />
                  </PermissionGuard>
                } />
                <Route path="training/sops" element={
                  <PermissionGuard requiredModule="training">
                    <TrainingKnowledge />
                  </PermissionGuard>
                } />
                <Route path="training/onboarding" element={
                  <PermissionGuard requiredModule="training">
                    <TrainingKnowledge />
                  </PermissionGuard>
                } />
                
                {/* Logs route */}
                <Route path="logs" element={
                  <PermissionGuard requiredModule="management" requiredRole={["admin", "super_admin"]}>
                    <Logs />
                  </PermissionGuard>
                } />
              </Route>
              
              {/* Dynamic content detail routes - outside main layout - moved to more specific path */}
              <Route path="/content/:slug" element={<ContentDetail />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AuthWrapper>
        } />
      </Routes>
      </BrowserRouter>
    </PermissionsProvider>
  </TooltipProvider>
)

export default App;
