import React from "react";
import { NavLink } from "react-router-dom";
import { SearchResult, highlightMatch } from "@/lib/search-utils";
import { SidebarMenu, SidebarMenuItem, SidebarMenuButton } from "@/components/ui/sidebar";
import { RippleEffect } from "@/components/ui/ripple-effect";
import { useModuleAccess } from "@/hooks/useModuleAccess";
import { Lock } from "lucide-react";

interface SearchResultsProps {
  results: SearchResult[];
  query: string;
  onItemClick: () => void;
  isCollapsed: boolean;
}

export const SearchResults: React.FC<SearchResultsProps> = ({
  results,
  query,
  onItemClick,
  isCollapsed
}) => {
  const { canAccessModule } = useModuleAccess();

  if (isCollapsed) return null;

  if (results.length === 0 && query.trim()) {
    return (
      <div className="px-3 py-4 text-center">
        <div className="text-sm text-sidebar-foreground/60">
          No results found for "{query}"
        </div>
      </div>
    );
  }

  if (results.length === 0) return null;

  // Group results by section
  const groupedResults = results.reduce((acc, result) => {
    const key = result.subsection
      ? `${result.section} > ${result.subsection}`
      : result.section;

    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(result);
    return acc;
  }, {} as Record<string, SearchResult[]>);

  return (
    <div className="px-3 py-2 border-t border-sidebar-border">
      <div className="text-xs uppercase tracking-wider text-sidebar-foreground/60 font-semibold mb-2 px-2">
        Search Results ({results.length})
      </div>

      <SidebarMenu className="space-y-1">
        {Object.entries(groupedResults).map(([sectionPath, sectionResults]) => (
          <div key={sectionPath} className="mb-3 last:mb-0">
            <div className="text-xs text-sidebar-foreground/50 px-2 mb-1 truncate">
              {highlightMatch(sectionPath, query)}
            </div>

            {sectionResults.map((result, index) => {
              // Determine module access - this is a simplified check
              // You might need to adjust based on your actual access control logic
              const moduleKey = result.section.toLowerCase().replace(/\s+/g, '-');
              const hasAccess = canAccessModule(moduleKey) || canAccessModule('management');

              return (
                <SidebarMenuItem key={`${result.item.url}-${index}`}>
                  <RippleEffect className="rounded-none">
                    <SidebarMenuButton
                      asChild
                      className={`
                        h-8 rounded-none transition-all duration-200 group
                        hover:scale-105 active:scale-95
                        ${hasAccess
                          ? 'hover:bg-sidebar-accent/50 text-sidebar-foreground/80 hover:text-sidebar-foreground'
                          : 'hover:bg-sidebar-accent/30 text-sidebar-foreground/50 cursor-not-allowed'
                        }
                      `}
                    >
                      <NavLink
                        to={hasAccess ? result.item.url : '#'}
                        className="flex items-center"
                        onClick={hasAccess ? onItemClick : (e) => e.preventDefault()}
                      >
                        <result.item.icon className={`
                          h-4 w-4 mr-2 transition-transform duration-200 group-hover:scale-110 flex-shrink-0
                          ${hasAccess ? '' : 'text-sidebar-foreground/40'}
                        `} />
                        <span className={`
                          whitespace-nowrap text-sm flex-1 truncate
                          ${hasAccess ? '' : 'text-sidebar-foreground/50'}
                        `}>
                          {highlightMatch(result.item.title, query)}
                        </span>
                        {!hasAccess && (
                          <Lock className="h-3 w-3 text-sidebar-foreground/40 ml-auto flex-shrink-0" />
                        )}
                      </NavLink>
                    </SidebarMenuButton>
                  </RippleEffect>
                </SidebarMenuItem>
              );
            })}
          </div>
        ))}
      </SidebarMenu>
    </div>
  );
};