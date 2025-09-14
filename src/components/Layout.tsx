import { SidebarProvider, useSidebar } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { AppHeader } from "@/components/AppHeader";
import { Outlet } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";

function LayoutContent() {
  const isMobile = useIsMobile();
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";
  
  return (
    <div className="min-h-screen flex w-full bg-background relative">
      <AppSidebar />
      <div className={`flex-1 flex flex-col transition-all duration-500 ease-in-out ${isCollapsed ? 'ml-16' : 'ml-0'}`}>
        <AppHeader />
        
        <main className="flex-1 p-4 lg:p-6 bg-muted/30 animate-in fade-in-50 duration-200">
          <Outlet />
        </main>
      </div>
      
    </div>
  );
}

export function Layout() {
  const isMobile = useIsMobile();
  
  return (
    <SidebarProvider 
      defaultOpen={!isMobile}
      style={{
        "--sidebar-width": "16rem",
        "--sidebar-width-mobile": "18rem",
        "--sidebar-width-icon": "4rem",
      } as React.CSSProperties}
    >
      <LayoutContent />
    </SidebarProvider>
  );
}