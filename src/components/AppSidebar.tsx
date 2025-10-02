import { NavLink, useLocation } from "react-router-dom";
import {
  BarChart3,
  Package,
  Users,
  MessageSquare,
  CheckSquare,
  Headphones,
  Settings,
  Inbox,
  User,
  Shield,
  TrendingUp,
  Home,
  PackageCheck,
  AlertTriangle,
  Camera,
  Printer,
  ClipboardList,
  RotateCcw,
  ChevronDown,
  ChevronRight,
  Megaphone,
  TestTube,
  Archive,
  Calendar,
  Percent,
  Box,
  Beaker,
  Truck,
  GraduationCap,
  BookOpen,
  UserPlus,
  UserCog,
  Plug,
  PieChart,
  Brain,
  DollarSign,
  FileText,
  Bell,
  AlertCircle,
  BellRing,
  Edit,
  MessageCircle,
  RotateCw,
  RefreshCw,
  Calendar as CalendarIcon,
  CheckSquare as CheckSquareIcon,
  MessageSquare as MessageSquareIcon,
  BookOpen as BookOpenIcon,
  Bell as BellIcon,
  Megaphone as Bullhorn,
  BarChart,
  Wallet,
  Settings as Gear,
  Target,
  TestTube as FlaskConical,
  DollarSign as Banknote,
  TrendingUp as TrendingUpIcon,
  CreditCard,
  Clock,
  UserCheck,
  Link,
  PieChart as PieChartIcon,
  Plus,
  Menu,
  Repeat,
  Activity,
  ShoppingCart,
  Building,
  Lock,
  ScrollText,
  Grid3X3,
  BookText
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar,
} from "@/components/ui/sidebar";
import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";
import { useModuleAccess } from "@/hooks/useModuleAccess";
import { usePermissionsContext } from "@/contexts/PermissionsContext";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { RippleEffect } from "@/components/ui/ripple-effect";
import { SkeletonMenu, SkeletonCollapsible } from "@/components/ui/skeleton-menu";
import { SearchInput } from "@/components/ui/search-input";
import { SearchResults } from "@/components/ui/search-results";
import { searchMenuItems, debounce, MenuSection } from "@/lib/search-utils";

// Operations Section
const operationsItems = [
  { title: "Dashboard", url: "/", icon: Home },
];

// Orders Sub-items
const ordersItems = [
  { title: "All Orders", url: "/orders", icon: Package },
  { title: "Abandoned Cart", url: "/orders/abandoned-cart", icon: ShoppingCart },
];

// Fulfillment Sub-items (Processing)
const processingItems = [
  { title: "Packing", url: "/fulfillment/packing", icon: PackageCheck },
  { title: "Courier Handover", url: "/fulfillment/courier-handover", icon: Truck },
  { title: "Label Printing", url: "/fulfillment/label-printing", icon: Printer },
  { title: "Quality Check", url: "/fulfillment/quality-check", icon: Camera },
];

// Fulfillment Sub-items (Exceptions)
const exceptionsItems = [
  { title: "Disputes", url: "/fulfillment/disputes", icon: AlertTriangle },
  { title: "RTO/NDR", url: "/fulfillment/rto-ndr", icon: RotateCcw },
];


// Customer Support Section
const customerSupportItems = [
  { title: "Support Tickets", url: "/support", icon: Headphones },
  { title: "Feedback & Complaints", url: "/support/feedback-complaints", icon: MessageCircle },
  { title: "Returns & Refunds", url: "/support/returns-refunds", icon: RotateCw },
  { title: "NDR & RTO Management", url: "/support/ndr-rto", icon: RefreshCw },
];

// Team Section
const teamHubItems = [
  { title: "Attendance", url: "/attendance", icon: CalendarIcon },
  { title: "Chat", url: "/chat", icon: MessageSquareIcon },
  { title: "Holiday Calendar", url: "/holiday-calendar", icon: Calendar },
];

// Marketing & Growth Section
const marketingGrowthItems = [
  { title: "Campaigns (FB, Google, IG, TikTok)", url: "/marketing/campaigns", icon: Megaphone },
  { title: "Ads Testing", url: "/marketing/ads-testing", icon: Target },
  { title: "Performance Reports (CTR, CPC, ROAS)", url: "/marketing/performance-reports", icon: BarChart },
  { title: "Influencer / Agency Collabs", url: "/marketing/influencer-collabs", icon: UserCheck },
];

// Product Management Section  
const productManagementItems = [
  { title: "Products", url: "/products", icon: Repeat },
  { title: "Categories", url: "/products/categories", icon: Grid3X3 },
  { title: "Performance Insight", url: "/products/performance-insight", icon: Activity },
  { title: "Vendors", url: "/vendors", icon: Truck },
  { title: "Inventory", url: "/inventory", icon: ClipboardList },
  { title: "Warehouse", url: "/products/warehouse", icon: Building },
  { title: "Sample Testing / QC", url: "/products/sample-testing", icon: FlaskConical },
];

// Accounts Section
const accountsItems = [
  { title: "Purchase", url: "/account/purchase", icon: ShoppingCart },
  { title: "Invoice", url: "/account/invoice", icon: FileText },
];

// Admin Section
// Admin submenu removed - all these options are now available in /admin page
// const managementAdminItems = [
//   { title: "Users", url: "/users", icon: UserCog },
//   { title: "Employee Onboarding Form", url: "/onboard", icon: UserPlus },
//   { title: "Onboarding Applications", url: "/admin/onboarding", icon: UserPlus },
//   { title: "Task Management", url: "/admin/tasks", icon: CheckSquare },
//   { title: "People & Roles", url: "/management/people-roles", icon: UserCheck },
//   { title: "System Settings", url: "/management/system-settings", icon: Settings },
//   { title: "Integrations", url: "/management/integrations", icon: Link },
//   { title: "Analytics & Insights", url: "/management/analytics-insights", icon: PieChartIcon },
// ];
const managementAdminItems = [];


// Content Section
const contentItems = [
  { title: "Planning", url: "/content/planning", icon: Calendar },
  { title: "Content Library", url: "/content/library", icon: Archive },
  { title: "Editing", url: "/content/editing", icon: Edit },
  { title: "Content Creator", url: "/content/creator", icon: Plus },
];



// Training Section
const trainingItems = [
  { title: "Training Hub", url: "/training/hub", icon: GraduationCap },
  { title: "SOPs / Playbooks", url: "/training/sops", icon: BookOpen },
  { title: "Onboarding", url: "/training/onboarding", icon: UserPlus },
];


// Analytics Section
const analyticsItems = [
  { title: "Analytics", url: "/analytics", icon: TrendingUp },
  { title: "Customer Insights", url: "/analytics/customers", icon: Brain },
  { title: "Finance & Profitability", url: "/analytics/finance", icon: DollarSign },
  { title: "Reports / Exports", url: "/analytics/reports", icon: FileText },
];

// Alerts Section
const alertsItems = [
  { title: "Inventory Alerts", url: "/alerts/inventory", icon: Bell },
  { title: "Dispute Alerts", url: "/alerts/disputes", icon: AlertCircle },
  { title: "System Notifications", url: "/alerts/system", icon: BellRing },
];

export function AppSidebar() {
  const { state, open, setOpen, openMobile, setOpenMobile } = useSidebar();
  const location = useLocation();
  const currentPath = location.pathname;
  const isCollapsed = state === "collapsed";
  const isMobile = useIsMobile();
  const { canAccessModule, isLoading: permissionsLoading, getUserInfo, currentUser } = useModuleAccess();
  const permissionsContext = usePermissionsContext();
  
  // Collapsible group states
  const [ordersOpen, setOrdersOpen] = useState(currentPath.startsWith('/orders'));
  const [fulfillmentOpen, setFulfillmentOpen] = useState(currentPath.startsWith('/fulfillment'));
  const [customerSupportOpen, setCustomerSupportOpen] = useState(currentPath.startsWith('/support') && currentPath !== '/support' ? true : currentPath === '/support');
  const [teamHubOpen, setTeamHubOpen] = useState(currentPath.startsWith('/team-hub'));

  const [marketingGrowthOpen, setMarketingGrowthOpen] = useState(currentPath.startsWith('/marketing'));
  const [productManagementOpen, setProductManagementOpen] = useState(currentPath.startsWith('/products'));
  const [accountsOpen, setAccountsOpen] = useState(currentPath.startsWith('/account'));
  // Removed managementAdminOpen state since Admin is now a direct link
  const [contentOpen, setContentOpen] = useState(currentPath.startsWith('/content'));
  const [trainingOpen, setTrainingOpen] = useState(currentPath.startsWith('/training'));
  const [analyticsOpen, setAnalyticsOpen] = useState(currentPath.startsWith('/analytics'));
  const [alertsOpen, setAlertsOpen] = useState(currentPath.startsWith('/alerts'));
  const [hoverExpanded, setHoverExpanded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Search functionality
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);

  // Memoized menu sections for search
  const menuSections = useMemo((): { [key: string]: MenuSection } => ({
    dashboard: { title: "Dashboard", items: [{ title: "Dashboard", url: "/", icon: Home }] },
    operations: { title: "Operations", items: operationsItems },
    orders: { title: "Orders", items: ordersItems },
    fulfillment: {
      title: "Fulfillment",
      items: [],
      subsections: [
        { title: "Processing", items: processingItems },
        { title: "Exceptions", items: exceptionsItems },
      ]
    },
    support: { title: "Customer Support", items: customerSupportItems },
    myTasks: { title: "My Tasks", items: [{ title: "My Tasks", url: "/me/tasks", icon: CheckSquareIcon }] },
    teamHub: { title: "Team", items: teamHubItems },
    content: { title: "Content", items: contentItems },
    marketing: { title: "Marketing & Growth", items: marketingGrowthItems },
    products: { title: "Product Management", items: productManagementItems },
    accounts: { title: "Accounts", items: accountsItems },
    training: { title: "Training", items: trainingItems },
    analytics: { title: "Analytics", items: analyticsItems },
    // Removed admin section from search since it's now a direct link
    alerts: { title: "Alerts", items: alertsItems },
  }), []);

  // Debounced search function
  const debouncedSearch = useCallback(
    debounce((query: string) => {
      const results = searchMenuItems(menuSections, query);
      setSearchResults(results);
    }, 200),
    [menuSections]
  );

  // Handle search query changes
  useEffect(() => {
    if (searchQuery.trim()) {
      debouncedSearch(searchQuery);
    } else {
      setSearchResults([]);
    }
  }, [searchQuery, debouncedSearch]);

  // Clear search when route changes
  useEffect(() => {
    setSearchQuery("");
    setSearchResults([]);
  }, [currentPath]);

  // Handle search input change
  const handleSearchChange = useCallback((value: string) => {
    setSearchQuery(value);
  }, []);

  // Handle search clear
  const handleSearchClear = useCallback(() => {
    setSearchQuery("");
    setSearchResults([]);
  }, []);

  // Handle search result click
  const handleSearchResultClick = useCallback(() => {
    if (isMobile) {
      setOpenMobile(false);
    }
    setSearchQuery("");
    setSearchResults([]);
  }, [isMobile, setOpenMobile]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+K or Cmd+K to focus search
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        const searchInput = document.querySelector('input[placeholder*="Search"]') as HTMLInputElement;
        if (searchInput) {
          searchInput.focus();
          // Auto-expand sidebar if collapsed
          if (isCollapsed && !isMobile) {
            setOpen(true);
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isCollapsed, isMobile, setOpen]);

  // Force re-render when permissions change
  useEffect(() => {
    if (permissionsContext?.refreshTrigger) {
      console.log('🔄 [AppSidebar] Permissions refreshed, forcing re-render:', permissionsContext.refreshTrigger)
      // Force a re-render by updating the loading state temporarily
      setIsLoading(true)
      setTimeout(() => setIsLoading(false), 50)
    }
  }, [permissionsContext?.refreshTrigger])

  const isActive = (path: string) => currentPath === path;
  const isOrdersActive = currentPath.startsWith('/orders');
  const isFulfillmentActive = currentPath.startsWith('/fulfillment');
  const isCustomerSupportActive = currentPath.startsWith('/support');
  const isTeamHubActive = currentPath.startsWith('/team-hub');
  const isMarketingGrowthActive = currentPath.startsWith('/marketing');
  const isProductManagementActive = currentPath.startsWith('/products');
  const isAccountsActive = currentPath.startsWith('/account');
  // Removed isManagementAdminActive since Admin is now a direct link
  const isContentActive = currentPath.startsWith('/content');
  const isTrainingActive = currentPath.startsWith('/training');
  const isAnalyticsActive = currentPath.startsWith('/analytics');
  const isAlertsActive = currentPath.startsWith('/alerts');

  const shouldShowLabels = !isCollapsed || (isCollapsed && hoverExpanded && !isMobile);

  // Check if user has admin or super_admin role
  const hasAdminAccess = (): boolean => {
    if (!currentUser) return false;
    return ['admin', 'super_admin'].includes(currentUser.role);
  };

  // Check if user has super_admin role only
  const hasSuperAdminAccess = (): boolean => {
    if (!currentUser) return false;
    return currentUser.role === 'super_admin';
  };

  // Special render function for Admin menu with role-based access
  const renderAdminMenuSection = () => {
    if (isLoading || permissionsLoading) {
      return <SkeletonMenu count={1} showLabels={shouldShowLabels} />;
    }

    const hasModuleAccess = canAccessModule('management');
    const hasRoleAccess = hasAdminAccess();
    const hasFullAccess = hasModuleAccess && hasRoleAccess;
    const active = isActive('/admin');

    const adminItem = { title: "Admin", url: "/admin", icon: Settings };

    const menuButton = (
      <SidebarMenuItem style={{ animationDelay: '0ms' }}>
        <RippleEffect className="rounded-none">
          <SidebarMenuButton
            asChild
            className={`
              h-9 rounded-none transition-all duration-400 ease-in-out group relative
              hover:scale-105 active:scale-95 animate-spring-in
              ${active
                ? 'bg-sidebar-primary text-sidebar-primary-foreground shadow-sm shadow-sidebar-primary/20'
                : hasFullAccess
                  ? 'hover:bg-sidebar-accent/50 text-sidebar-foreground/80 hover:text-sidebar-foreground hover:shadow-sm'
                  : 'hover:bg-sidebar-accent/30 text-sidebar-foreground/50 cursor-not-allowed'
              }
              ${isCollapsed && !hoverExpanded ? 'justify-center w-full' : ''}
            `}
          >
            <NavLink
              to={hasFullAccess ? adminItem.url : '#'}
              end
              className={`${isCollapsed && !hoverExpanded ? 'flex items-center justify-center w-full h-full' : 'flex items-center w-full'}`}
              onClick={hasFullAccess ? undefined : (e) => e.preventDefault()}
            >
              <adminItem.icon className={`h-4 w-4 transition-all duration-300 ease-in-out group-hover:scale-110 ${active ? 'text-sidebar-primary-foreground' : hasFullAccess ? '' : 'text-sidebar-foreground/40'} ${isCollapsed && !hoverExpanded ? '' : 'mr-2'}`} />
              {shouldShowLabels && (
                <span className={`${active ? 'font-medium' : ''} ${hasFullAccess ? '' : 'text-sidebar-foreground/50'} transition-all duration-500 ease-in-out whitespace-nowrap text-sm`}>
                  {adminItem.title}
                </span>
              )}
              {!hasFullAccess && shouldShowLabels && (
                <Lock className="h-4 w-4 text-orange-500 ml-2 flex-shrink-0" />
              )}
              {active && shouldShowLabels && hasFullAccess && (
                <div className="absolute right-2 w-1 h-1 bg-sidebar-primary-foreground rounded-full animate-bounce-in" />
              )}
            </NavLink>
          </SidebarMenuButton>
        </RippleEffect>
      </SidebarMenuItem>
    );

    // Wrap with tooltip when collapsed and not hover-expanded
    if (isCollapsed && !hoverExpanded && !isMobile) {
      return (
        <SidebarGroup className="px-2 pt-2 pb-1">
          <SidebarGroupContent>
            <SidebarMenu className="space-y-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  {menuButton}
                </TooltipTrigger>
                <TooltipContent side="right" className="ml-2">
                  <div className="flex items-center gap-2">
                    {adminItem.title}
                    {!hasFullAccess && <Lock className="h-3 w-3" />}
                  </div>
                </TooltipContent>
              </Tooltip>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      );
    }

    return (
      <SidebarGroup className="px-3 pt-2 pb-1">
        <SidebarGroupContent>
          <SidebarMenu className="space-y-0.5">
            {menuButton}
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
    );
  };

  // Special render function for Payroll menu with super_admin role-based access
  const renderPayrollMenuSection = () => {
    if (isLoading || permissionsLoading) {
      return <SkeletonMenu count={1} showLabels={shouldShowLabels} />;
    }

    const hasModuleAccess = canAccessModule('finance');
    const hasRoleAccess = hasSuperAdminAccess();
    const hasFullAccess = hasModuleAccess && hasRoleAccess;
    const active = isActive('/payroll');

    const payrollItem = { title: "Payroll", url: "/payroll", icon: DollarSign };

    const menuButton = (
      <SidebarMenuItem style={{ animationDelay: '0ms' }}>
        <RippleEffect className="rounded-none">
          <SidebarMenuButton
            asChild
            className={`
              h-8 rounded-none transition-all duration-400 ease-in-out ml-6 group
              hover:scale-105 active:scale-95
              ${active
                ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium shadow-sm'
                : hasFullAccess
                  ? 'hover:bg-sidebar-accent/50 text-sidebar-foreground/70 hover:text-sidebar-foreground hover:shadow-sm'
                  : 'hover:bg-sidebar-accent/30 text-sidebar-foreground/50 cursor-not-allowed'
              }
            `}
          >
            <NavLink
              to={hasFullAccess ? payrollItem.url : '#'}
              className="flex items-center w-full"
              onClick={hasFullAccess ? undefined : (e) => e.preventDefault()}
            >
              <payrollItem.icon className={`h-4 w-4 mr-2 transition-transform duration-300 ease-in-out group-hover:scale-110 flex-shrink-0 ${active ? '' : hasFullAccess ? '' : 'text-sidebar-foreground/40'}`} />
              <span className={`whitespace-nowrap text-sm ${hasFullAccess ? '' : 'text-sidebar-foreground/50'}`}>
                {payrollItem.title}
              </span>
              {!hasFullAccess && (
                <Lock className="h-4 w-4 text-orange-500 ml-2 flex-shrink-0" />
              )}
            </NavLink>
          </SidebarMenuButton>
        </RippleEffect>
      </SidebarMenuItem>
    );

    return menuButton;
  };

  const renderMenuSection = (items: typeof operationsItems, label: string, requiredModule?: string) => {
    if (isLoading || permissionsLoading) {
      return <SkeletonMenu count={items.length} showLabels={shouldShowLabels} />;
    }

    // Show all items but mark inaccessible ones with lock icons
    const accessibleItems = items;

    return (
      <SidebarGroup className={`${isCollapsed && !hoverExpanded ? 'px-2' : 'px-3'} ${label ? 'py-1' : 'pt-2 pb-1'}`}>
        {shouldShowLabels && label && (
          <SidebarGroupLabel className="text-xs uppercase tracking-wider text-sidebar-foreground/60 font-semibold mb-2 px-2 transition-all duration-500 ease-in-out animate-fade-in">
            {label}
          </SidebarGroupLabel>
        )}
        <SidebarGroupContent>
          <SidebarMenu className={`${isCollapsed && !hoverExpanded ? 'space-y-2' : 'space-y-0.5'}`}>
            {accessibleItems.map((item, index) => {
              const active = isActive(item.url);
              const hasAccess = requiredModule ? canAccessModule(requiredModule) : true;
              
              const menuButton = (
                <SidebarMenuItem key={item.title} style={{ animationDelay: `${index * 50}ms` }}>
                  <RippleEffect className="rounded-none">
                    <SidebarMenuButton 
                      asChild 
                      className={`
                        h-9 rounded-none transition-all duration-400 ease-in-out group relative
                        hover:scale-105 active:scale-95 animate-spring-in
                        ${active 
                          ? 'bg-sidebar-primary text-sidebar-primary-foreground shadow-sm shadow-sidebar-primary/20' 
                          : hasAccess 
                            ? 'hover:bg-sidebar-accent/50 text-sidebar-foreground/80 hover:text-sidebar-foreground hover:shadow-sm'
                            : 'hover:bg-sidebar-accent/30 text-sidebar-foreground/50 cursor-not-allowed'
                        }
                        ${isCollapsed && !hoverExpanded ? 'justify-center w-full' : ''}
                      `}
                    >
                      <NavLink 
                        to={hasAccess ? item.url : '#'} 
                        end 
                        className={`${isCollapsed && !hoverExpanded ? 'flex items-center justify-center w-full h-full' : 'flex items-center'}`}
                        onClick={hasAccess ? undefined : (e) => e.preventDefault()}
                      >
                        <item.icon className={`h-4 w-4 transition-all duration-300 ease-in-out group-hover:scale-110 ${active ? 'text-sidebar-primary-foreground' : hasAccess ? '' : 'text-sidebar-foreground/40'} ${isCollapsed && !hoverExpanded ? '' : 'mr-2'}`} />
                        {shouldShowLabels && (
                          <span className={`${active ? 'font-medium' : ''} ${hasAccess ? '' : 'text-sidebar-foreground/50'} transition-all duration-500 ease-in-out whitespace-nowrap text-sm flex-1`}>
                            {item.title}
                          </span>
                        )}
                        {!hasAccess && shouldShowLabels && (
                          <Lock className="h-3 w-3 text-sidebar-foreground/40 ml-auto" />
                        )}
                        {active && shouldShowLabels && hasAccess && (
                          <div className="absolute right-2 w-1 h-1 bg-sidebar-primary-foreground rounded-full animate-bounce-in" />
                        )}
                      </NavLink>
                    </SidebarMenuButton>
                  </RippleEffect>
                </SidebarMenuItem>
              );

              // Wrap with tooltip when collapsed and not hover-expanded
              if (isCollapsed && !hoverExpanded && !isMobile) {
                return (
                  <Tooltip key={item.title}>
                    <TooltipTrigger asChild>
                      {menuButton}
                    </TooltipTrigger>
                    <TooltipContent side="right" className="ml-2">
                      <div className="flex items-center gap-2">
                        {item.title}
                        {!hasAccess && <Lock className="h-3 w-3" />}
                      </div>
                    </TooltipContent>
                  </Tooltip>
                );
              }

              return menuButton;
            })}
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
    );
  };

  // Generic collapsible section renderer
  const renderCollapsibleSection = (
    title: string,
    isOpen: boolean,
    setIsOpen: (open: boolean) => void,
    isActive: boolean,
    icon: React.ComponentType<React.SVGProps<SVGSVGElement>>,
    requiredModule: string,
    subSections?: { title: string; items: typeof operationsItems }[]
  ) => {
    if (isLoading || permissionsLoading) {
      return <SkeletonCollapsible showLabels={shouldShowLabels} />;
    }

    // Check access for this section
    const hasAccess = canAccessModule(requiredModule);
    console.log(`🔍 [AppSidebar] renderCollapsibleSection('${title}', requiredModule: '${requiredModule}'): ${hasAccess ? 'ACCESSIBLE' : 'LOCKED'}`);

    const sectionButton = (
      <SidebarGroup className="px-3 py-1">
        <SidebarGroupContent>
          <SidebarMenu className="space-y-0.5">
            <SidebarMenuItem>
              <RippleEffect className="rounded-none">
                <SidebarMenuButton
                  onClick={hasAccess ? () => setIsOpen(!isOpen) : undefined}
                  className={`
                    h-9 rounded-none transition-all duration-400 ease-in-out group relative
                    hover:scale-105 active:scale-95 animate-spring-in
                    ${isActive 
                      ? 'bg-sidebar-primary text-sidebar-primary-foreground shadow-sm shadow-sidebar-primary/20' 
                      : hasAccess
                        ? 'hover:bg-sidebar-accent/50 text-sidebar-foreground/80 hover:text-sidebar-foreground hover:shadow-sm'
                        : 'hover:bg-sidebar-accent/30 text-sidebar-foreground/50 cursor-not-allowed'
                    }
                    ${isCollapsed && !hoverExpanded ? 'justify-center w-full' : ''}
                  `}
                >
                  <div className={`${isCollapsed && !hoverExpanded ? 'flex items-center justify-center w-full h-full' : 'flex items-center w-full'}`}>
                    {React.createElement(icon, { 
                      className: `h-4 w-4 transition-all duration-300 ease-in-out group-hover:scale-110 ${isActive ? 'text-sidebar-primary-foreground' : hasAccess ? '' : 'text-sidebar-foreground/40'} ${isCollapsed && !hoverExpanded ? '' : 'mr-2'}` 
                    })}
                    {shouldShowLabels && (
                      <>
                        <span className={`${isActive ? 'font-medium' : ''} ${hasAccess ? '' : 'text-sidebar-foreground/50'} transition-all duration-500 ease-in-out whitespace-nowrap text-sm flex-1`}>
                          {title}
                        </span>
                        {!hasAccess ? (
                          <Lock className="ml-auto h-4 w-4 text-sidebar-foreground/40 transition-all duration-400 ease-in-out" />
                        ) : isOpen ? (
                          <ChevronDown className="ml-auto h-4 w-4 transition-all duration-400 ease-in-out" />
                        ) : (
                          <ChevronRight className="ml-auto h-4 w-4 transition-all duration-400 ease-in-out" />
                        )}
                      </>
                    )}
                  </div>
                  {isActive && shouldShowLabels && (
                    <div className="absolute right-8 w-1 h-1 bg-sidebar-primary-foreground rounded-full animate-bounce-in" />
                  )}
                </SidebarMenuButton>
              </RippleEffect>
              {shouldShowLabels && isOpen && hasAccess && subSections && (
                <SidebarMenuSub className="mt-1 space-y-0.5 animate-fade-in">
                  {subSections.map((section, sectionIndex) => (
                    <div key={section.title} className="mb-2 last:mb-0">
                      <div className="px-2 py-1 text-xs font-medium text-sidebar-foreground/60 uppercase tracking-wider animate-stagger-in" style={{ animationDelay: `${sectionIndex * 50}ms` }}>
                        {section.title}
                      </div>
                       {section.items.map((item, itemIndex) => {
                         const active = currentPath === item.url;
                        return (
                          <SidebarMenuSubItem key={item.title} className="animate-stagger-in" style={{ animationDelay: `${(sectionIndex * section.items.length + itemIndex) * 30}ms` }}>
                            <RippleEffect className="rounded-none">
                              <SidebarMenuSubButton
                                asChild
                                className={`
                                  h-8 rounded-none transition-all duration-200 ml-2 group
                                  hover:scale-105 active:scale-95
                                  ${active 
                                    ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium shadow-sm' 
                                    : 'hover:bg-sidebar-accent/50 text-sidebar-foreground/70 hover:text-sidebar-foreground hover:shadow-sm'
                                  }
                                `}
                              >
                                <NavLink to={item.url}>
                                  <item.icon className="h-4 w-4 transition-transform duration-200 group-hover:scale-110" />
                                  <span>{item.title}</span>
                                </NavLink>
                              </SidebarMenuSubButton>
                            </RippleEffect>
                          </SidebarMenuSubItem>
                        );
                      })}
                    </div>
                  ))}
                </SidebarMenuSub>
              )}
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
    );

    // Wrap with tooltip when collapsed and not hover-expanded
    if (isCollapsed && !hoverExpanded && !isMobile) {
      return (
        <Tooltip key={title}>
          <TooltipTrigger asChild>
            {sectionButton}
          </TooltipTrigger>
          <TooltipContent side="right" className="ml-2">
            <div className="flex items-center gap-2">
              {title}
              {!hasAccess && <Lock className="h-3 w-3" />}
            </div>
          </TooltipContent>
        </Tooltip>
      );
    }

    return sectionButton;
  };

  const handleMouseEnter = () => {
    if (!isMobile) {
      setHoverExpanded(true);
      setOpen(true); // Auto-open sidebar on hover
    }
  };

  const handleMouseLeave = () => {
    if (!isMobile) {
      setHoverExpanded(false);
      setOpen(false); // Auto-close sidebar when hover ends
    }
  };

  return (
    <TooltipProvider>
      <Sidebar 
        className={`
          border-r border-sidebar-border transition-all duration-500 ease-in-out
          ${isCollapsed && !hoverExpanded ? "w-16" : "w-64"}
          ${isMobile && openMobile ? 'fixed inset-y-0 left-0 z-50 shadow-lg' : ''}
          ${isMobile && !openMobile ? 'translate-x-[-100%]' : ''}
        `}
        collapsible="icon"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {/* Mobile backdrop */}
        {isMobile && openMobile && (
          <div 
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
            onClick={() => setOpenMobile(false)}
          />
        )}
        
        
        <SidebarContent className="bg-sidebar/95 backdrop-blur supports-[backdrop-filter]:bg-sidebar/95 relative z-50">
          <div className={`p-4 border-b border-sidebar-border transition-all duration-500 ease-in-out ${isCollapsed && !hoverExpanded ? 'px-2' : ''}`}>
            <div className="flex items-center justify-between w-full mb-3">
              {/* Toggle Button - Always visible */}
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 hover:bg-sidebar-accent/50 transition-all duration-300 ease-in-out flex-shrink-0"
                onClick={() => {
                  if (isMobile) {
                    setOpenMobile(!openMobile);
                  } else {
                    setOpen(!open);
                  }
                }}
              >
                <Menu className="h-4 w-4 text-sidebar-foreground" />
              </Button>

              {/* Logo and Title - Show when expanded */}
              {shouldShowLabels && (
                <div className="flex items-center gap-3 flex-1 ml-3">
                  <div className="h-8 w-8 rounded-none bg-sidebar-primary flex items-center justify-center flex-shrink-0 transition-transform duration-300 hover:scale-110 animate-spring-in">
                    <BarChart3 className="h-4 w-4 text-sidebar-primary-foreground transition-transform duration-200" />
                  </div>
                  <div className="transition-all duration-500 ease-in-out animate-fade-in">
                    <h2 className="font-semibold text-sidebar-foreground">Eraya Ops</h2>
                  </div>
                </div>
              )}
            </div>

            {/* Search Input */}
            <div className={`transition-all duration-500 ease-in-out ${isCollapsed && !hoverExpanded ? 'px-0' : ''}`}>
              <SearchInput
                value={searchQuery}
                onChange={handleSearchChange}
                onClear={handleSearchClear}
                isCollapsed={isCollapsed && !hoverExpanded}
                placeholder="Search menu items..."
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto overflow-x-hidden">
            {/* Search Results */}
            {searchQuery.trim() && (
              <SearchResults
                results={searchResults}
                query={searchQuery}
                onItemClick={handleSearchResultClick}
                isCollapsed={isCollapsed && !hoverExpanded}
              />
            )}

            {/* Regular Menu - Hidden when searching */}
            {!searchQuery.trim() && (
              <>
                {/* Dashboard - Single Menu Item */}
                {renderMenuSection([{ title: "Dashboard", url: "/", icon: Home }], "")}
            
            {/* 3. Fulfillment - Collapsible with sub-sections */}
            {renderCollapsibleSection(
              "Fulfillment",
              fulfillmentOpen,
              setFulfillmentOpen,
              isFulfillmentActive,
              PackageCheck,
              "fulfillment",
              [
                { title: "Processing", items: processingItems },
                { title: "Exceptions", items: exceptionsItems },
              ]
            )}
            
            {/* 3. Support - Collapsible */}
            {renderCollapsibleSection(
              "Support",
              customerSupportOpen,
              setCustomerSupportOpen,
              isCustomerSupportActive,
              Headphones,
              "support"
            )}
            {shouldShowLabels && customerSupportOpen && (
              <SidebarGroup className="px-3 py-0 -mt-1">
                <SidebarGroupContent>
                  <SidebarMenu className="space-y-0.5 animate-fade-in">
                    {customerSupportItems.map((item, index) => {
                      const active = isActive(item.url);
                      const hasItemAccess = canAccessModule("support");
                      return (
                        <SidebarMenuItem key={item.title} className="animate-stagger-in" style={{ animationDelay: `${index * 50}ms` }}>
                          <RippleEffect className="rounded-none">
                            <SidebarMenuButton 
                              asChild 
                              className={`
                                h-8 rounded-none transition-all duration-400 ease-in-out ml-6 group
                                hover:scale-105 active:scale-95
                                ${active 
                                  ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium shadow-sm' 
                                  : hasItemAccess
                                    ? 'hover:bg-sidebar-accent/50 text-sidebar-foreground/70 hover:text-sidebar-foreground hover:shadow-sm'
                                    : 'hover:bg-sidebar-accent/30 text-sidebar-foreground/50 cursor-not-allowed'
                                }
                              `}
                            >
                              <NavLink 
                                to={hasItemAccess ? item.url : '#'} 
                                className="flex items-center"
                                onClick={hasItemAccess ? undefined : (e) => e.preventDefault()}
                              >
                                <item.icon className={`h-4 w-4 mr-2 transition-transform duration-300 ease-in-out group-hover:scale-110 flex-shrink-0 ${hasItemAccess ? '' : 'text-sidebar-foreground/40'}`} />
                                <span className={`whitespace-nowrap text-sm flex-1 ${hasItemAccess ? '' : 'text-sidebar-foreground/50'}`}>{item.title}</span>
                                {!hasItemAccess && <Lock className="h-3 w-3 text-sidebar-foreground/40 ml-auto" />}
                              </NavLink>
                            </SidebarMenuButton>
                          </RippleEffect>
                        </SidebarMenuItem>
                      );
                    })}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            )}

            {/* My Tasks - Standalone */}
            {renderMenuSection([{ title: "My Tasks", url: "/me/tasks", icon: CheckSquareIcon }], "")}

            {/* 4. Team - Collapsible */}
            {renderCollapsibleSection(
              "Team",
              teamHubOpen,
              setTeamHubOpen,
              isTeamHubActive,
              Users,
              "team-hub"
            )}
            {shouldShowLabels && teamHubOpen && (
              <SidebarGroup className="px-3 py-0 -mt-1">
                <SidebarGroupContent>
                  <SidebarMenu className="space-y-0.5 animate-fade-in">
                    {teamHubItems.map((item, index) => {
                      const active = isActive(item.url);
                      return (
                        <SidebarMenuItem key={item.title} className="animate-stagger-in" style={{ animationDelay: `${index * 50}ms` }}>
                          <RippleEffect className="rounded-none">
                            <SidebarMenuButton 
                              asChild 
                              className={`
                                h-8 rounded-none transition-all duration-400 ease-in-out ml-6 group
                                hover:scale-105 active:scale-95
                                ${active 
                                  ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium shadow-sm' 
                                  : 'hover:bg-sidebar-accent/50 text-sidebar-foreground/70 hover:text-sidebar-foreground hover:shadow-sm'
                                }
                              `}
                            >
                              <NavLink to={item.url} className="flex items-center">
                                <item.icon className="h-4 w-4 mr-2 transition-transform duration-300 ease-in-out group-hover:scale-110 flex-shrink-0" />
                                <span className="whitespace-nowrap text-sm">{item.title}</span>
                              </NavLink>
                            </SidebarMenuButton>
                          </RippleEffect>
                        </SidebarMenuItem>
                      );
                    })}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            )}

            {/* 5. Products - Collapsible */}
            {renderCollapsibleSection(
              "Products",
              productManagementOpen,
              setProductManagementOpen,
              isProductManagementActive,
              Box,
              "products"
            )}
            {shouldShowLabels && productManagementOpen && (
              <SidebarGroup className="px-3 py-0 -mt-1">
                <SidebarGroupContent>
                  <SidebarMenu className="space-y-0.5 animate-fade-in">
                    {productManagementItems.map((item, index) => {
                      const active = isActive(item.url);
                      return (
                        <SidebarMenuItem key={item.title} className="animate-stagger-in" style={{ animationDelay: `${index * 50}ms` }}>
                          <RippleEffect className="rounded-none">
                            <SidebarMenuButton
                              asChild
                              className={`
                                h-8 rounded-none transition-all duration-400 ease-in-out ml-6 group
                                hover:scale-105 active:scale-95
                                ${active
                                  ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium shadow-sm'
                                  : 'hover:bg-sidebar-accent/50 text-sidebar-foreground/70 hover:text-sidebar-foreground hover:shadow-sm'
                                }
                              `}
                            >
                              <NavLink to={item.url} className="flex items-center">
                                <item.icon className="h-4 w-4 mr-2 transition-transform duration-300 ease-in-out group-hover:scale-110 flex-shrink-0" />
                                <span className="whitespace-nowrap text-sm">{item.title}</span>
                              </NavLink>
                            </SidebarMenuButton>
                          </RippleEffect>
                        </SidebarMenuItem>
                      );
                    })}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            )}

            {/* 6. Content - Collapsible */}
            {renderCollapsibleSection(
              "Content",
              contentOpen,
              setContentOpen,
              isContentActive,
              Edit,
              "content"
            )}
            {shouldShowLabels && contentOpen && (
              <SidebarGroup className="px-3 py-0 -mt-1">
                <SidebarGroupContent>
                  <SidebarMenu className="space-y-0.5 animate-fade-in">
                    {contentItems.map((item, index) => {
                      const active = isActive(item.url);
                      return (
                        <SidebarMenuItem key={item.title} className="animate-stagger-in" style={{ animationDelay: `${index * 50}ms` }}>
                          <RippleEffect className="rounded-none">
                            <SidebarMenuButton 
                              asChild 
                              className={`
                                h-8 rounded-none transition-all duration-400 ease-in-out ml-6 group
                                hover:scale-105 active:scale-95
                                ${active 
                                  ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium shadow-sm' 
                                  : 'hover:bg-sidebar-accent/50 text-sidebar-foreground/70 hover:text-sidebar-foreground hover:shadow-sm'
                                }
                              `}
                            >
                              <NavLink to={item.url} className="flex items-center">
                                <item.icon className="h-4 w-4 mr-2 transition-transform duration-300 ease-in-out group-hover:scale-110 flex-shrink-0" />
                                <span className="whitespace-nowrap text-sm">{item.title}</span>
                              </NavLink>
                            </SidebarMenuButton>
                          </RippleEffect>
                        </SidebarMenuItem>
                      );
                    })}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            )}
            
            {/* 7. Marketing - Collapsible */}
            {renderCollapsibleSection(
              "Marketing",
              marketingGrowthOpen,
              setMarketingGrowthOpen,
              isMarketingGrowthActive,
              Bullhorn,
              "marketing"
            )}
            {shouldShowLabels && marketingGrowthOpen && (
              <SidebarGroup className="px-3 py-0 -mt-1">
                <SidebarGroupContent>
                  <SidebarMenu className="space-y-0.5 animate-fade-in">
                    {marketingGrowthItems.map((item, index) => {
                      const active = isActive(item.url);
                      return (
                        <SidebarMenuItem key={item.title} className="animate-stagger-in" style={{ animationDelay: `${index * 50}ms` }}>
                          <RippleEffect className="rounded-none">
                            <SidebarMenuButton 
                              asChild 
                              className={`
                                h-8 rounded-none transition-all duration-400 ease-in-out ml-6 group
                                hover:scale-105 active:scale-95
                                ${active 
                                  ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium shadow-sm' 
                                  : 'hover:bg-sidebar-accent/50 text-sidebar-foreground/70 hover:text-sidebar-foreground hover:shadow-sm'
                                }
                              `}
                            >
                              <NavLink to={item.url} className="flex items-center">
                                <item.icon className="h-4 w-4 mr-2 transition-transform duration-300 ease-in-out group-hover:scale-110 flex-shrink-0" />
                                <span className="whitespace-nowrap text-sm">{item.title}</span>
                              </NavLink>
                            </SidebarMenuButton>
                          </RippleEffect>
                        </SidebarMenuItem>
                      );
                    })}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            )}

            {/* 8. Accounts - Collapsible */}
            {renderCollapsibleSection(
              "Accounts",
              accountsOpen,
              setAccountsOpen,
              isAccountsActive,
              Wallet,
              "finance"
            )}
            {shouldShowLabels && accountsOpen && (
              <SidebarGroup className="px-3 py-0 -mt-1">
                <SidebarGroupContent>
                  <SidebarMenu className="space-y-0.5 animate-fade-in">
                    {accountsItems.map((item, index) => {
                      const active = isActive(item.url);
                      return (
                        <SidebarMenuItem key={item.title} className="animate-stagger-in" style={{ animationDelay: `${index * 50}ms` }}>
                          <RippleEffect className="rounded-none">
                            <SidebarMenuButton
                              asChild
                              className={`
                                h-8 rounded-none transition-all duration-400 ease-in-out ml-6 group
                                hover:scale-105 active:scale-95
                                ${active
                                  ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium shadow-sm'
                                  : 'hover:bg-sidebar-accent/50 text-sidebar-foreground/70 hover:text-sidebar-foreground hover:shadow-sm'
                                }
                              `}
                            >
                              <NavLink to={item.url} className="flex items-center">
                                <item.icon className="h-4 w-4 mr-2 transition-transform duration-300 ease-in-out group-hover:scale-110 flex-shrink-0" />
                                <span className="whitespace-nowrap text-sm">{item.title}</span>
                              </NavLink>
                            </SidebarMenuButton>
                          </RippleEffect>
                        </SidebarMenuItem>
                      );
                    })}
                    {/* Payroll - Super Admin Only */}
                    {renderPayrollMenuSection()}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            )}
            
            {/* 9. Training - Collapsible */}
            {renderCollapsibleSection(
              "Training",
              trainingOpen,
              setTrainingOpen,
              isTrainingActive,
              GraduationCap,
              "training"
            )}
            {shouldShowLabels && trainingOpen && (
              <SidebarGroup className="px-3 py-0 -mt-1">
                <SidebarGroupContent>
                  <SidebarMenu className="space-y-0.5 animate-fade-in">
                    {trainingItems.map((item, index) => {
                      const active = isActive(item.url);
                      return (
                        <SidebarMenuItem key={item.title} className="animate-stagger-in" style={{ animationDelay: `${index * 50}ms` }}>
                          <RippleEffect className="rounded-none">
                            <SidebarMenuButton 
                              asChild 
                              className={`
                                h-8 rounded-none transition-all duration-400 ease-in-out ml-6 group
                                hover:scale-105 active:scale-95
                                ${active 
                                  ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium shadow-sm' 
                                  : 'hover:bg-sidebar-accent/50 text-sidebar-foreground/70 hover:text-sidebar-foreground hover:shadow-sm'
                                }
                              `}
                            >
                              <NavLink to={item.url} className="flex items-center">
                                <item.icon className="h-4 w-4 mr-2 transition-transform duration-300 ease-in-out group-hover:scale-110 flex-shrink-0" />
                                <span className="whitespace-nowrap text-sm">{item.title}</span>
                              </NavLink>
                            </SidebarMenuButton>
                          </RippleEffect>
                        </SidebarMenuItem>
                      );
                    })}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            )}
            
            {/* 10. Analytics - Collapsible */}
            {renderCollapsibleSection(
              "Analytics",
              analyticsOpen,
              setAnalyticsOpen,
              isAnalyticsActive,
              PieChart,
              "analytics"
            )}
            {shouldShowLabels && analyticsOpen && (
              <SidebarGroup className="px-3 py-0 -mt-1">
                <SidebarGroupContent>
                  <SidebarMenu className="space-y-0.5 animate-fade-in">
                    {analyticsItems.map((item, index) => {
                      const active = isActive(item.url);
                      return (
                        <SidebarMenuItem key={item.title} className="animate-stagger-in" style={{ animationDelay: `${index * 50}ms` }}>
                          <RippleEffect className="rounded-none">
                            <SidebarMenuButton 
                              asChild 
                              className={`
                                h-8 rounded-none transition-all duration-400 ease-in-out ml-6 group
                                hover:scale-105 active:scale-95
                                ${active 
                                  ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium shadow-sm' 
                                  : 'hover:bg-sidebar-accent/50 text-sidebar-foreground/70 hover:text-sidebar-foreground hover:shadow-sm'
                                }
                              `}
                            >
                              <NavLink to={item.url} className="flex items-center">
                                <item.icon className="h-4 w-4 mr-2 transition-transform duration-300 ease-in-out group-hover:scale-110 flex-shrink-0" />
                                <span className="whitespace-nowrap text-sm">{item.title}</span>
                              </NavLink>
                            </SidebarMenuButton>
                          </RippleEffect>
                        </SidebarMenuItem>
                      );
                    })}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            )}
            
            {/* 12. Alerts - Collapsible */}
            {renderCollapsibleSection(
              "Alerts",
              alertsOpen,
              setAlertsOpen,
              isAlertsActive,
              Bell,
              "alerts"
            )}
            {shouldShowLabels && alertsOpen && (
              <SidebarGroup className="px-3 py-0 -mt-1">
                <SidebarGroupContent>
                  <SidebarMenu className="space-y-0.5 animate-fade-in">
                    {alertsItems.map((item, index) => {
                      const active = isActive(item.url);
                      return (
                        <SidebarMenuItem key={item.title} className="animate-stagger-in" style={{ animationDelay: `${index * 50}ms` }}>
                          <RippleEffect className="rounded-none">
                            <SidebarMenuButton 
                              asChild 
                              className={`
                                h-8 rounded-none transition-all duration-400 ease-in-out ml-6 group
                                hover:scale-105 active:scale-95
                                ${active 
                                  ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium shadow-sm' 
                                  : 'hover:bg-sidebar-accent/50 text-sidebar-foreground/70 hover:text-sidebar-foreground hover:shadow-sm'
                                }
                              `}
                            >
                              <NavLink to={item.url} className="flex items-center">
                                <item.icon className="h-4 w-4 mr-2 transition-transform duration-300 ease-in-out group-hover:scale-110 flex-shrink-0" />
                                <span className="whitespace-nowrap text-sm">{item.title}</span>
                              </NavLink>
                            </SidebarMenuButton>
                          </RippleEffect>
                        </SidebarMenuItem>
                      );
                    })}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            )}

            {/* Admin - Single Menu Item (after Alerts) with Role-based Lock */}
            {renderAdminMenuSection()}

            {/* Separator */}
            {shouldShowLabels && (
              <div className="px-6 py-2">
                <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent" />
              </div>
            )}
            
            {/* 13. Logs - Standalone */}
            {renderMenuSection([{ title: "Logs", url: "/logs", icon: ScrollText }], "", "management")}

            {/* 14. Notion - Standalone - HIDDEN */}
            {/* {renderMenuSection([{ title: "Notion", url: "/notion", icon: BookText }], "", "management")} */}
              </>
            )}
          </div>
        </SidebarContent>
      </Sidebar>
    </TooltipProvider>
  );
}