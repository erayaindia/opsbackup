import { NavLink, useLocation } from "react-router-dom";
import {
  BarChart3,
  Package,
  Users,
  MessageSquare,
  CheckSquare,
  Headphones,
  Settings,
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
  Database,
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
  Receipt,
  TrendingUp as TrendingUpIcon,
  CreditCard,
  Clock,
  UserCheck,
  Link,
  PieChart as PieChartIcon,
  Plus
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
import React, { useState } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { RippleEffect } from "@/components/ui/ripple-effect";
import { SkeletonMenu, SkeletonCollapsible } from "@/components/ui/skeleton-menu";

// Operations Section
const operationsItems = [
  { title: "Dashboard", url: "/", icon: Home },
  { title: "Orders", url: "/orders", icon: Package },
];

// Fulfillment Sub-items (Processing)
const processingItems = [
  { title: "Packing", url: "/fulfillment/packing", icon: PackageCheck },
  { title: "Label Printing", url: "/fulfillment/label-printing", icon: Printer },
  { title: "Quality Check", url: "/fulfillment/quality-check", icon: Camera },
];

// Fulfillment Sub-items (Exceptions)
const exceptionsItems = [
  { title: "Disputes", url: "/fulfillment/disputes", icon: AlertTriangle },
  { title: "RTO/NDR", url: "/fulfillment/rto-ndr", icon: RotateCcw },
];

// Fulfillment Sub-items (Inventory)
const inventoryItems = [
  { title: "Pick Lists", url: "/fulfillment/pick-lists", icon: ClipboardList },
  { title: "Inventory Sync", url: "/fulfillment/inventory-sync", icon: Database },
];

// Customer Support Section
const customerSupportItems = [
  { title: "Support Tickets", url: "/support", icon: Headphones },
  { title: "Feedback & Complaints", url: "/support/feedback-complaints", icon: MessageCircle },
  { title: "Returns & Refunds", url: "/support/returns-refunds", icon: RotateCw },
  { title: "NDR & RTO Management", url: "/support/ndr-rto", icon: RefreshCw },
];

// Team Hub Section
const teamHubItems = [
  { title: "Attendance", url: "/team-hub/attendance", icon: CalendarIcon },
  { title: "Tasks & To-Dos", url: "/team-hub/tasks", icon: CheckSquareIcon },
  { title: "Team Chat", url: "/team-hub/chat", icon: MessageSquareIcon },
  { title: "Announcements", url: "/team-hub/announcements", icon: BellIcon },
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
  { title: "Products & Variants", url: "/products/products-variants", icon: Box },
  { title: "Suppliers", url: "/products/suppliers", icon: Truck },
  { title: "Inventory Management", url: "/products/inventory-management", icon: ClipboardList },
  { title: "Sample Testing / QC", url: "/products/sample-testing", icon: FlaskConical },
];

// Accounts & Finance Section
const accountsFinanceItems = [
  { title: "Bank Accounts Overview", url: "/finance/bank-accounts", icon: CreditCard },
  { title: "Sales & Revenue Tracking", url: "/finance/sales-revenue", icon: TrendingUpIcon },
  { title: "Expenses & Payouts", url: "/finance/expenses-payouts", icon: Banknote },
  { title: "Profit & Loss", url: "/finance/profit-loss", icon: PieChartIcon },
  { title: "GST / Tax Reports", url: "/finance/gst-tax", icon: Receipt },
  { title: "Pending Remittances", url: "/finance/pending-remittances", icon: Clock },
];

// Management & Admin Section
const managementAdminItems = [
  { title: "People & Roles", url: "/management/people-roles", icon: UserCheck },
  { title: "System Settings", url: "/management/system-settings", icon: Settings },
  { title: "Integrations", url: "/management/integrations", icon: Link },
  { title: "Analytics & Insights", url: "/management/analytics-insights", icon: PieChartIcon },
];


// Content Section
const contentItems = [
  { title: "Planning", url: "/content/planning", icon: Calendar },
  { title: "Content Library", url: "/content/library", icon: Archive },
  { title: "Editing", url: "/content/editing", icon: Edit },
  { title: "Content Creator", url: "/content/creator", icon: Plus },
];



// Training & Knowledge Section
const trainingItems = [
  { title: "Training Hub", url: "/training/hub", icon: GraduationCap },
  { title: "SOPs / Playbooks", url: "/training/sops", icon: BookOpen },
  { title: "Onboarding", url: "/training/onboarding", icon: UserPlus },
];


// Analytics & Insights Section
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
  
  // Collapsible group states
  const [fulfillmentOpen, setFulfillmentOpen] = useState(currentPath.startsWith('/fulfillment'));
  const [customerSupportOpen, setCustomerSupportOpen] = useState(currentPath.startsWith('/support') && currentPath !== '/support' ? true : currentPath === '/support');
  const [teamHubOpen, setTeamHubOpen] = useState(currentPath.startsWith('/team-hub'));
  const [marketingGrowthOpen, setMarketingGrowthOpen] = useState(currentPath.startsWith('/marketing'));
  const [productManagementOpen, setProductManagementOpen] = useState(currentPath.startsWith('/products'));
  const [accountsFinanceOpen, setAccountsFinanceOpen] = useState(currentPath.startsWith('/finance'));
  const [managementAdminOpen, setManagementAdminOpen] = useState(currentPath.startsWith('/management'));
  const [contentOpen, setContentOpen] = useState(currentPath.startsWith('/content'));
  const [trainingOpen, setTrainingOpen] = useState(currentPath.startsWith('/training'));
  const [analyticsOpen, setAnalyticsOpen] = useState(currentPath.startsWith('/analytics'));
  const [alertsOpen, setAlertsOpen] = useState(currentPath.startsWith('/alerts'));
  const [hoverExpanded, setHoverExpanded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const isActive = (path: string) => currentPath === path;
  const isFulfillmentActive = currentPath.startsWith('/fulfillment');
  const isCustomerSupportActive = currentPath.startsWith('/support');
  const isTeamHubActive = currentPath.startsWith('/team-hub');
  const isMarketingGrowthActive = currentPath.startsWith('/marketing');
  const isProductManagementActive = currentPath.startsWith('/products');
  const isAccountsFinanceActive = currentPath.startsWith('/finance');
  const isManagementAdminActive = currentPath.startsWith('/management');
  const isContentActive = currentPath.startsWith('/content');
  const isTrainingActive = currentPath.startsWith('/training');
  const isAnalyticsActive = currentPath.startsWith('/analytics');
  const isAlertsActive = currentPath.startsWith('/alerts');

  const shouldShowLabels = !isCollapsed || (isCollapsed && hoverExpanded && !isMobile);

  const renderMenuSection = (items: typeof operationsItems, label: string) => {
    if (isLoading) {
      return <SkeletonMenu count={items.length} showLabels={shouldShowLabels} />;
    }

    return (
      <SidebarGroup className="px-3 py-1">
        {shouldShowLabels && (
          <SidebarGroupLabel className="text-xs uppercase tracking-wider text-sidebar-foreground/60 font-semibold mb-2 px-2 transition-opacity duration-200 animate-fade-in">
            {label}
          </SidebarGroupLabel>
        )}
        <SidebarGroupContent>
          <SidebarMenu className="space-y-0.5">
            {items.map((item, index) => {
              const active = isActive(item.url);
              const menuButton = (
                <SidebarMenuItem key={item.title} style={{ animationDelay: `${index * 50}ms` }}>
                  <RippleEffect className="rounded-lg">
                    <SidebarMenuButton 
                      asChild 
                      className={`
                        h-9 rounded-lg transition-all duration-300 group relative
                        hover:scale-105 active:scale-95 animate-spring-in
                        ${active 
                          ? 'bg-sidebar-primary text-sidebar-primary-foreground shadow-sm shadow-sidebar-primary/20' 
                          : 'hover:bg-sidebar-accent/50 text-sidebar-foreground/80 hover:text-sidebar-foreground hover:shadow-sm'
                        }
                        ${isCollapsed && !hoverExpanded ? 'justify-center' : ''}
                      `}
                    >
                      <NavLink to={item.url} end>
                        <item.icon className={`h-4 w-4 transition-transform duration-200 group-hover:scale-110 ${active ? 'text-sidebar-primary-foreground' : ''} ${isCollapsed && !hoverExpanded ? '' : 'mr-2'}`} />
                        {shouldShowLabels && (
                          <span className={`${active ? 'font-medium' : ''} transition-opacity duration-200`}>
                            {item.title}
                          </span>
                        )}
                        {active && shouldShowLabels && (
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
                      {item.title}
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
    icon: React.ComponentType<any>,
    subSections?: { title: string; items: typeof operationsItems }[]
  ) => {
    if (isLoading) {
      return <SkeletonCollapsible showLabels={shouldShowLabels} />;
    }

    const sectionButton = (
      <SidebarGroup className="px-3 py-1">
        <SidebarGroupContent>
          <SidebarMenu className="space-y-0.5">
            <SidebarMenuItem>
              <RippleEffect className="rounded-lg">
                <SidebarMenuButton
                  onClick={() => setIsOpen(!isOpen)}
                  className={`
                    h-9 rounded-lg transition-all duration-300 group relative
                    hover:scale-105 active:scale-95 animate-spring-in
                    ${isActive 
                      ? 'bg-sidebar-primary text-sidebar-primary-foreground shadow-sm shadow-sidebar-primary/20' 
                      : 'hover:bg-sidebar-accent/50 text-sidebar-foreground/80 hover:text-sidebar-foreground hover:shadow-sm'
                    }
                    ${isCollapsed && !hoverExpanded ? 'justify-center' : ''}
                  `}
                >
                  {React.createElement(icon, { 
                    className: `h-4 w-4 transition-transform duration-200 group-hover:scale-110 ${isActive ? 'text-sidebar-primary-foreground' : ''} ${isCollapsed && !hoverExpanded ? '' : 'mr-2'}` 
                  })}
                  {shouldShowLabels && (
                    <>
                      <span className={`${isActive ? 'font-medium' : ''} transition-opacity duration-200`}>
                        {title}
                      </span>
                      {isOpen ? (
                        <ChevronDown className="ml-auto h-4 w-4 transition-transform duration-200" />
                      ) : (
                        <ChevronRight className="ml-auto h-4 w-4 transition-transform duration-200" />
                      )}
                    </>
                  )}
                  {isActive && shouldShowLabels && (
                    <div className="absolute right-8 w-1 h-1 bg-sidebar-primary-foreground rounded-full animate-bounce-in" />
                  )}
                </SidebarMenuButton>
              </RippleEffect>
              {shouldShowLabels && isOpen && subSections && (
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
                            <RippleEffect className="rounded-md">
                              <SidebarMenuSubButton
                                asChild
                                className={`
                                  h-8 rounded-md transition-all duration-200 ml-2 group
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
            {title}
          </TooltipContent>
        </Tooltip>
      );
    }

    return sectionButton;
  };

  const handleMouseEnter = () => {
    if (isCollapsed && !isMobile) {
      setHoverExpanded(true);
    }
  };

  const handleMouseLeave = () => {
    if (isCollapsed && !isMobile) {
      setHoverExpanded(false);
    }
  };

  return (
    <TooltipProvider>
      <Sidebar 
        className={`
          border-r border-sidebar-border transition-all duration-300 ease-in-out
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
          <div className={`p-4 border-b border-sidebar-border transition-all duration-300 ${isCollapsed && !hoverExpanded ? 'px-2' : ''}`}>
            <div className={`flex items-center gap-3 ${isCollapsed && !hoverExpanded ? 'justify-center' : ''}`}>
              <div className="h-8 w-8 rounded-lg bg-sidebar-primary flex items-center justify-center flex-shrink-0 transition-transform duration-300 hover:scale-110 animate-spring-in">
                <BarChart3 className="h-4 w-4 text-sidebar-primary-foreground transition-transform duration-200" />
              </div>
              {shouldShowLabels && (
                <div className="transition-opacity duration-200 animate-fade-in">
                  <h2 className="font-semibold text-sidebar-foreground">Eraya Ops</h2>
                  <p className="text-xs text-sidebar-foreground/60">Operations Management</p>
                </div>
              )}
            </div>
          </div>

          <div className="flex-1 py-1 overflow-y-auto space-y-1">
            {/* 1. Dashboard & Orders (Operations) */}
            {renderMenuSection(operationsItems, "Operations")}
            
            {/* 2. Fulfillment - Collapsible with sub-sections */}
            {renderCollapsibleSection(
              "Fulfillment",
              fulfillmentOpen,
              setFulfillmentOpen,
              isFulfillmentActive,
              PackageCheck,
              [
                { title: "Processing", items: processingItems },
                { title: "Exceptions", items: exceptionsItems },
                { title: "Inventory", items: inventoryItems },
              ]
            )}
            
            {/* 3. Customer Support - Collapsible */}
            {renderCollapsibleSection(
              "Customer Support",
              customerSupportOpen,
              setCustomerSupportOpen,
              isCustomerSupportActive,
              Headphones
            )}
            {shouldShowLabels && customerSupportOpen && (
              <SidebarGroup className="px-3 py-0 -mt-1">
                <SidebarGroupContent>
                  <SidebarMenu className="space-y-0.5 animate-fade-in">
                    {customerSupportItems.map((item, index) => {
                      const active = isActive(item.url);
                      return (
                        <SidebarMenuItem key={item.title} className="animate-stagger-in" style={{ animationDelay: `${index * 50}ms` }}>
                          <RippleEffect className="rounded-md">
                            <SidebarMenuButton 
                              asChild 
                              className={`
                                h-8 rounded-md transition-all duration-200 ml-6 group
                                hover:scale-105 active:scale-95
                                ${active 
                                  ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium shadow-sm' 
                                  : 'hover:bg-sidebar-accent/50 text-sidebar-foreground/70 hover:text-sidebar-foreground hover:shadow-sm'
                                }
                              `}
                            >
                              <NavLink to={item.url}>
                                <item.icon className="h-4 w-4 mr-2 transition-transform duration-200 group-hover:scale-110" />
                                <span>{item.title}</span>
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
            
            {/* 4. Team Hub - Collapsible */}
            {renderCollapsibleSection(
              "Team Hub",
              teamHubOpen,
              setTeamHubOpen,
              isTeamHubActive,
              Users
            )}
            {shouldShowLabels && teamHubOpen && (
              <SidebarGroup className="px-3 py-0 -mt-1">
                <SidebarGroupContent>
                  <SidebarMenu className="space-y-0.5 animate-fade-in">
                    {teamHubItems.map((item, index) => {
                      const active = isActive(item.url);
                      return (
                        <SidebarMenuItem key={item.title} className="animate-stagger-in" style={{ animationDelay: `${index * 50}ms` }}>
                          <RippleEffect className="rounded-md">
                            <SidebarMenuButton 
                              asChild 
                              className={`
                                h-8 rounded-md transition-all duration-200 ml-6 group
                                hover:scale-105 active:scale-95
                                ${active 
                                  ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium shadow-sm' 
                                  : 'hover:bg-sidebar-accent/50 text-sidebar-foreground/70 hover:text-sidebar-foreground hover:shadow-sm'
                                }
                              `}
                            >
                              <NavLink to={item.url}>
                                <item.icon className="h-4 w-4 mr-2 transition-transform duration-200 group-hover:scale-110" />
                                <span>{item.title}</span>
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
            
            {/* 5. Content - Collapsible */}
            {renderCollapsibleSection(
              "Content",
              contentOpen,
              setContentOpen,
              isContentActive,
              Edit
            )}
            {shouldShowLabels && contentOpen && (
              <SidebarGroup className="px-3 py-0 -mt-1">
                <SidebarGroupContent>
                  <SidebarMenu className="space-y-0.5 animate-fade-in">
                    {contentItems.map((item, index) => {
                      const active = isActive(item.url);
                      return (
                        <SidebarMenuItem key={item.title} className="animate-stagger-in" style={{ animationDelay: `${index * 50}ms` }}>
                          <RippleEffect className="rounded-md">
                            <SidebarMenuButton 
                              asChild 
                              className={`
                                h-8 rounded-md transition-all duration-200 ml-6 group
                                hover:scale-105 active:scale-95
                                ${active 
                                  ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium shadow-sm' 
                                  : 'hover:bg-sidebar-accent/50 text-sidebar-foreground/70 hover:text-sidebar-foreground hover:shadow-sm'
                                }
                              `}
                            >
                              <NavLink to={item.url}>
                                <item.icon className="h-4 w-4 mr-2 transition-transform duration-200 group-hover:scale-110" />
                                <span>{item.title}</span>
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
            
            {/* 7. Marketing & Growth - Collapsible */}
            {renderCollapsibleSection(
              "Marketing & Growth",
              marketingGrowthOpen,
              setMarketingGrowthOpen,
              isMarketingGrowthActive,
              Bullhorn
            )}
            {shouldShowLabels && marketingGrowthOpen && (
              <SidebarGroup className="px-3 py-0 -mt-1">
                <SidebarGroupContent>
                  <SidebarMenu className="space-y-0.5 animate-fade-in">
                    {marketingGrowthItems.map((item, index) => {
                      const active = isActive(item.url);
                      return (
                        <SidebarMenuItem key={item.title} className="animate-stagger-in" style={{ animationDelay: `${index * 50}ms` }}>
                          <RippleEffect className="rounded-md">
                            <SidebarMenuButton 
                              asChild 
                              className={`
                                h-8 rounded-md transition-all duration-200 ml-6 group
                                hover:scale-105 active:scale-95
                                ${active 
                                  ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium shadow-sm' 
                                  : 'hover:bg-sidebar-accent/50 text-sidebar-foreground/70 hover:text-sidebar-foreground hover:shadow-sm'
                                }
                              `}
                            >
                              <NavLink to={item.url}>
                                <item.icon className="h-4 w-4 mr-2 transition-transform duration-200 group-hover:scale-110" />
                                <span>{item.title}</span>
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
            
            {/* 8. Product Management - Collapsible */}
            {renderCollapsibleSection(
              "Product Management",
              productManagementOpen,
              setProductManagementOpen,
              isProductManagementActive,
              Box
            )}
            {shouldShowLabels && productManagementOpen && (
              <SidebarGroup className="px-3 py-0 -mt-1">
                <SidebarGroupContent>
                  <SidebarMenu className="space-y-0.5 animate-fade-in">
                    {productManagementItems.map((item, index) => {
                      const active = isActive(item.url);
                      return (
                        <SidebarMenuItem key={item.title} className="animate-stagger-in" style={{ animationDelay: `${index * 50}ms` }}>
                          <RippleEffect className="rounded-md">
                            <SidebarMenuButton 
                              asChild 
                              className={`
                                h-8 rounded-md transition-all duration-200 ml-6 group
                                hover:scale-105 active:scale-95
                                ${active 
                                  ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium shadow-sm' 
                                  : 'hover:bg-sidebar-accent/50 text-sidebar-foreground/70 hover:text-sidebar-foreground hover:shadow-sm'
                                }
                              `}
                            >
                              <NavLink to={item.url}>
                                <item.icon className="h-4 w-4 mr-2 transition-transform duration-200 group-hover:scale-110" />
                                <span>{item.title}</span>
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
            
            {/* 9. Accounts & Finance - Collapsible */}
            {renderCollapsibleSection(
              "Accounts & Finance",
              accountsFinanceOpen,
              setAccountsFinanceOpen,
              isAccountsFinanceActive,
              Wallet
            )}
            {shouldShowLabels && accountsFinanceOpen && (
              <SidebarGroup className="px-3 py-0 -mt-1">
                <SidebarGroupContent>
                  <SidebarMenu className="space-y-0.5 animate-fade-in">
                    {accountsFinanceItems.map((item, index) => {
                      const active = isActive(item.url);
                      return (
                        <SidebarMenuItem key={item.title} className="animate-stagger-in" style={{ animationDelay: `${index * 50}ms` }}>
                          <RippleEffect className="rounded-md">
                            <SidebarMenuButton 
                              asChild 
                              className={`
                                h-8 rounded-md transition-all duration-200 ml-6 group
                                hover:scale-105 active:scale-95
                                ${active 
                                  ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium shadow-sm' 
                                  : 'hover:bg-sidebar-accent/50 text-sidebar-foreground/70 hover:text-sidebar-foreground hover:shadow-sm'
                                }
                              `}
                            >
                              <NavLink to={item.url}>
                                <item.icon className="h-4 w-4 mr-2 transition-transform duration-200 group-hover:scale-110" />
                                <span>{item.title}</span>
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
            
            {/* 10. Training & Knowledge - Collapsible */}
            {renderCollapsibleSection(
              "Training & Knowledge",
              trainingOpen,
              setTrainingOpen,
              isTrainingActive,
              GraduationCap
            )}
            {shouldShowLabels && trainingOpen && (
              <SidebarGroup className="px-3 py-0 -mt-1">
                <SidebarGroupContent>
                  <SidebarMenu className="space-y-0.5 animate-fade-in">
                    {trainingItems.map((item, index) => {
                      const active = isActive(item.url);
                      return (
                        <SidebarMenuItem key={item.title} className="animate-stagger-in" style={{ animationDelay: `${index * 50}ms` }}>
                          <RippleEffect className="rounded-md">
                            <SidebarMenuButton 
                              asChild 
                              className={`
                                h-8 rounded-md transition-all duration-200 ml-6 group
                                hover:scale-105 active:scale-95
                                ${active 
                                  ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium shadow-sm' 
                                  : 'hover:bg-sidebar-accent/50 text-sidebar-foreground/70 hover:text-sidebar-foreground hover:shadow-sm'
                                }
                              `}
                            >
                              <NavLink to={item.url}>
                                <item.icon className="h-4 w-4 mr-2 transition-transform duration-200 group-hover:scale-110" />
                                <span>{item.title}</span>
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
            
            {/* 11. Analytics & Insights - Collapsible */}
            {renderCollapsibleSection(
              "Analytics & Insights",
              analyticsOpen,
              setAnalyticsOpen,
              isAnalyticsActive,
              PieChart
            )}
            {shouldShowLabels && analyticsOpen && (
              <SidebarGroup className="px-3 py-0 -mt-1">
                <SidebarGroupContent>
                  <SidebarMenu className="space-y-0.5 animate-fade-in">
                    {analyticsItems.map((item, index) => {
                      const active = isActive(item.url);
                      return (
                        <SidebarMenuItem key={item.title} className="animate-stagger-in" style={{ animationDelay: `${index * 50}ms` }}>
                          <RippleEffect className="rounded-md">
                            <SidebarMenuButton 
                              asChild 
                              className={`
                                h-8 rounded-md transition-all duration-200 ml-6 group
                                hover:scale-105 active:scale-95
                                ${active 
                                  ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium shadow-sm' 
                                  : 'hover:bg-sidebar-accent/50 text-sidebar-foreground/70 hover:text-sidebar-foreground hover:shadow-sm'
                                }
                              `}
                            >
                              <NavLink to={item.url}>
                                <item.icon className="h-4 w-4 mr-2 transition-transform duration-200 group-hover:scale-110" />
                                <span>{item.title}</span>
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
            
            {/* 12. Management & Admin - Collapsible */}
            {renderCollapsibleSection(
              "Management & Admin",
              managementAdminOpen,
              setManagementAdminOpen,
              isManagementAdminActive,
              Settings
            )}
            {shouldShowLabels && managementAdminOpen && (
              <SidebarGroup className="px-3 py-0 -mt-1">
                <SidebarGroupContent>
                  <SidebarMenu className="space-y-0.5 animate-fade-in">
                    {managementAdminItems.map((item, index) => {
                      const active = isActive(item.url);
                      return (
                        <SidebarMenuItem key={item.title} className="animate-stagger-in" style={{ animationDelay: `${index * 50}ms` }}>
                          <RippleEffect className="rounded-md">
                            <SidebarMenuButton 
                              asChild 
                              className={`
                                h-8 rounded-md transition-all duration-200 ml-6 group
                                hover:scale-105 active:scale-95
                                ${active 
                                  ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium shadow-sm' 
                                  : 'hover:bg-sidebar-accent/50 text-sidebar-foreground/70 hover:text-sidebar-foreground hover:shadow-sm'
                                }
                              `}
                            >
                              <NavLink to={item.url}>
                                <item.icon className="h-4 w-4 mr-2 transition-transform duration-200 group-hover:scale-110" />
                                <span>{item.title}</span>
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
            
            {/* 13. Alerts - Collapsible */}
            {renderCollapsibleSection(
              "Alerts",
              alertsOpen,
              setAlertsOpen,
              isAlertsActive,
              Bell
            )}
            {shouldShowLabels && alertsOpen && (
              <SidebarGroup className="px-3 py-0 -mt-1">
                <SidebarGroupContent>
                  <SidebarMenu className="space-y-0.5 animate-fade-in">
                    {alertsItems.map((item, index) => {
                      const active = isActive(item.url);
                      return (
                        <SidebarMenuItem key={item.title} className="animate-stagger-in" style={{ animationDelay: `${index * 50}ms` }}>
                          <RippleEffect className="rounded-md">
                            <SidebarMenuButton 
                              asChild 
                              className={`
                                h-8 rounded-md transition-all duration-200 ml-6 group
                                hover:scale-105 active:scale-95
                                ${active 
                                  ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium shadow-sm' 
                                  : 'hover:bg-sidebar-accent/50 text-sidebar-foreground/70 hover:text-sidebar-foreground hover:shadow-sm'
                                }
                              `}
                            >
                              <NavLink to={item.url}>
                                <item.icon className="h-4 w-4 mr-2 transition-transform duration-200 group-hover:scale-110" />
                                <span>{item.title}</span>
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
          </div>
        </SidebarContent>
      </Sidebar>
    </TooltipProvider>
  );
}