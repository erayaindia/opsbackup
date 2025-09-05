import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { AppHeader } from "@/components/AppHeader";
import { FloatingChatButton, useChatStatus } from "@/components/FloatingChatButton";
import { Outlet } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";

export function Layout() {
  const isMobile = useIsMobile();
  const { unreadCount, isOnline } = useChatStatus();
  
  return (
    <SidebarProvider 
      defaultOpen={!isMobile}
      style={{
        "--sidebar-width": "16rem",
        "--sidebar-width-mobile": "18rem",
      } as React.CSSProperties}
    >
      <div className="min-h-screen flex w-full bg-background relative">
        <AppSidebar />
        <div className="flex-1 flex flex-col transition-all duration-300 ease-in-out">
          <AppHeader />
          
          <main className="flex-1 p-4 lg:p-6 bg-muted/30 animate-in fade-in-50 duration-200">
            <Outlet />
          </main>
        </div>
        
        {/* Floating Chat Button */}
        <FloatingChatButton unreadCount={unreadCount} isOnline={isOnline} />
      </div>
    </SidebarProvider>
  );
}