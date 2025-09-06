import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthWrapper } from "./components/AuthWrapper";
import { Layout } from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import Orders from "./pages/Orders";
import Tasks from "./pages/Tasks";
import TeamManagement from "./pages/TeamManagement";
import Packing from "./pages/Packing";
import Support from "./pages/Support";
import Chat from "./pages/Chat";
import Settings from "./pages/Settings";
import Users from "./pages/Users";
import Analytics from "./pages/Analytics";
import Security from "./pages/Security";
import TeamChat from "./pages/TeamChat";
import NotFound from "./pages/NotFound";
import Auth from "./pages/Auth";

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

// Marketing pages
import Campaigns from "./pages/marketing/Campaigns";
import AdsTesting from "./pages/marketing/AdsTesting";
import PerformanceReports from "./pages/marketing/PerformanceReports";
import InfluencerCollabs from "./pages/marketing/InfluencerCollabs";

// Product Management pages
import ProductsVariants from "./pages/products/ProductsVariants";
import Suppliers from "./pages/products/Suppliers";
import InventoryManagement from "./pages/products/InventoryManagement";
import SampleTesting from "./pages/products/SampleTesting";

// Finance pages
import BankAccounts from "./pages/finance/BankAccounts";
import SalesRevenue from "./pages/finance/SalesRevenue";
import ExpensesPayouts from "./pages/finance/ExpensesPayouts";
import ProfitLoss from "./pages/finance/ProfitLoss";
import GSTTax from "./pages/finance/GSTTax";
import PendingRemittances from "./pages/finance/PendingRemittances";

// Management pages
import PeopleRoles from "./pages/management/PeopleRoles";
import SystemSettings from "./pages/management/SystemSettings";
import Integrations from "./pages/management/Integrations";
import AnalyticsInsights from "./pages/management/AnalyticsInsights";

// Alerts pages
import InventoryAlerts from "./pages/alerts/InventoryAlerts";
import DisputeAlerts from "./pages/alerts/DisputeAlerts";
import SystemNotifications from "./pages/alerts/SystemNotifications";

const App = () => (
  <TooltipProvider>
    <Toaster />
    <Sonner />
    <BrowserRouter>
      <Routes>
        <Route path="/auth" element={<Auth />} />
        <Route path="/*" element={
          <AuthWrapper>
            <Routes>
              <Route path="/" element={<Layout />}>
                <Route index element={<Dashboard />} />
                <Route path="orders" element={<Orders />} />
                <Route path="packing" element={<Packing />} />
                <Route path="support" element={<Support />} />
                <Route path="chat" element={<Chat />} />
                <Route path="tasks" element={<Tasks />} />
                <Route path="team" element={<TeamManagement />} />
                <Route path="users" element={<Users />} />
                <Route path="settings" element={<Settings />} />
                <Route path="analytics" element={<Analytics />} />
                <Route path="security" element={<Security />} />
                
                {/* Fulfillment routes */}
                <Route path="fulfillment/packing" element={<FulfillmentPacking />} />
                <Route path="fulfillment/disputes" element={<FulfillmentDisputes />} />
                <Route path="fulfillment/quality-check" element={<FulfillmentQualityCheck />} />
                <Route path="fulfillment/label-printing" element={<FulfillmentLabelPrinting />} />
                <Route path="fulfillment/pick-lists" element={<FulfillmentPickLists />} />
                <Route path="fulfillment/rto-ndr" element={<FulfillmentRTONDR />} />
                <Route path="fulfillment/inventory-sync" element={<FulfillmentInventorySync />} />

                {/* Content routes */}
                <Route path="content/planning" element={<Planning />} />
                <Route path="content/library" element={<ContentLibrary />} />
                <Route path="content/creator" element={<ContentCreator />} />
                
                {/* Customer Support routes */}
                <Route path="support/feedback-complaints" element={<FeedbackComplaints />} />
                <Route path="support/returns-refunds" element={<ReturnsRefunds />} />
                <Route path="support/ndr-rto" element={<NDRRTOManagement />} />
                
                {/* Team Hub routes */}
                <Route path="team-hub/attendance" element={<Attendance />} />
                <Route path="team-hub/tasks" element={<TasksTodos />} />
                <Route path="team-hub/chat" element={<TeamChat />} />
                <Route path="team-hub/chat/:channelId" element={<TeamChat />} />
                <Route path="team-hub/announcements" element={<Announcements />} />
                
                {/* Marketing & Growth routes */}
                <Route path="marketing/campaigns" element={<Campaigns />} />
                <Route path="marketing/ads-testing" element={<AdsTesting />} />
                <Route path="marketing/performance-reports" element={<PerformanceReports />} />
                <Route path="marketing/influencer-collabs" element={<InfluencerCollabs />} />
                
                {/* Product Management routes */}
                <Route path="products/products-variants" element={<ProductsVariants />} />
                <Route path="products/suppliers" element={<Suppliers />} />
                <Route path="products/inventory-management" element={<InventoryManagement />} />
                <Route path="products/sample-testing" element={<SampleTesting />} />
                
                {/* Accounts & Finance routes */}
                <Route path="finance/bank-accounts" element={<BankAccounts />} />
                <Route path="finance/sales-revenue" element={<SalesRevenue />} />
                <Route path="finance/expenses-payouts" element={<ExpensesPayouts />} />
                <Route path="finance/profit-loss" element={<ProfitLoss />} />
                <Route path="finance/gst-tax" element={<GSTTax />} />
                <Route path="finance/pending-remittances" element={<PendingRemittances />} />
                
                {/* Management & Admin routes */}
                <Route path="management/people-roles" element={<PeopleRoles />} />
                <Route path="management/system-settings" element={<SystemSettings />} />
                <Route path="management/integrations" element={<Integrations />} />
                <Route path="management/analytics-insights" element={<AnalyticsInsights />} />
                
                {/* Alerts routes */}
                <Route path="alerts/inventory" element={<InventoryAlerts />} />
                <Route path="alerts/disputes" element={<DisputeAlerts />} />
                <Route path="alerts/system" element={<SystemNotifications />} />
              </Route>
              
              {/* Dynamic content detail routes - outside main layout */}
              <Route path="/:slug" element={<ContentDetail />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AuthWrapper>
        } />
      </Routes>
    </BrowserRouter>
  </TooltipProvider>
);

export default App;
