import { NavLink, useLocation } from "react-router-dom";
import { Settings } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import React from "react";
import { useModuleAccess } from "@/hooks/useModuleAccess";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { RippleEffect } from "@/components/ui/ripple-effect";

export function AppSidebar({ ...props }) {
  const location = useLocation();
  const hasManagementAccess = useModuleAccess("management");

  const isActive = (url: string) => {
    if (url === '/admin') {
      return location.pathname === '/admin' || location.pathname.startsWith('/admin');
    }
    return location.pathname === url;
  };

  const adminMenuItem = {
    title: "Admin",
    url: "/admin",
    icon: Settings
  };

  return (
    <TooltipProvider>
      <Sidebar variant="inset" {...props}>
        <SidebarContent>
          <div className="flex-1 overflow-y-auto overflow-x-hidden">
            {/* Admin Menu */}
            {hasManagementAccess && (
              <SidebarGroup className="px-3 py-2">
                <SidebarGroupContent>
                  <SidebarMenu>
                    <SidebarMenuItem>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <RippleEffect>
                            <SidebarMenuButton
                              asChild
                              className={`
                                h-10 rounded-lg transition-all duration-300 ease-in-out group
                                hover:scale-105 active:scale-95 hover:shadow-md
                                ${isActive(adminMenuItem.url)
                                  ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium shadow-sm border border-sidebar-accent-foreground/10'
                                  : 'hover:bg-sidebar-accent/80 text-sidebar-foreground/70 hover:text-sidebar-foreground'
                                }
                              `}
                            >
                              <NavLink to={adminMenuItem.url} className="flex items-center">
                                <adminMenuItem.icon className="h-5 w-5 mr-3 transition-transform duration-300 ease-in-out group-hover:scale-110 flex-shrink-0" />
                                <span className="font-medium">{adminMenuItem.title}</span>
                              </NavLink>
                            </SidebarMenuButton>
                          </RippleEffect>
                        </TooltipTrigger>
                        <TooltipContent side="right">
                          <p>Access all administrative functions</p>
                        </TooltipContent>
                      </Tooltip>
                    </SidebarMenuItem>
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