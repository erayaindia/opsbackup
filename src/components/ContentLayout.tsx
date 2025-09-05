import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { 
  Calendar, 
  Archive, 
  Edit, 
  ChevronLeft,
  BarChart3
} from 'lucide-react';

interface ContentLayoutProps {
  children: React.ReactNode;
  showBackButton?: boolean;
  backUrl?: string;
  backLabel?: string;
}

const contentItems = [
  { title: "Planning", url: "/content/planning", icon: Calendar, description: "Plan and organize content ideas" },
  { title: "Content Library", url: "/content/library", icon: Archive, description: "Browse existing content" },
  { title: "Editing", url: "/content/editing", icon: Edit, description: "Edit and refine content" },
];

export const ContentLayout: React.FC<ContentLayoutProps> = ({ 
  children, 
  showBackButton = false, 
  backUrl = "/content/planning",
  backLabel = "Back to Planning"
}) => {
  const location = useLocation();
  const currentPath = location.pathname;

  const isActive = (url: string) => {
    if (url === "/content/planning" && currentPath === "/content/planning") return true;
    if (url === "/content/library" && currentPath === "/content/library") return true;
    if (url === "/content/editing" && currentPath === "/content/editing") return true;
    // Handle dynamic content detail pages
    if (url === "/content/planning" && currentPath !== "/content/library" && currentPath !== "/content/editing" && currentPath.startsWith("/")) {
      return true; // Content detail pages are considered part of planning
    }
    return false;
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="flex">
        {/* Content Sidebar */}
        <aside className="w-72 bg-card border-r border-border shadow-lg">
          <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                <Edit className="h-4 w-4 text-primary-foreground" />
              </div>
              <div>
                <h2 className="font-semibold text-foreground">Content Hub</h2>
                <p className="text-xs text-muted-foreground">Create, plan, and manage</p>
              </div>
            </div>

            {/* Back Button */}
            {showBackButton && (
              <Link to={backUrl}>
                <Button variant="ghost" size="sm" className="w-full justify-start gap-2">
                  <ChevronLeft className="h-4 w-4" />
                  {backLabel}
                </Button>
              </Link>
            )}

            {/* Navigation Items */}
            <nav className="space-y-2">
              {contentItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.url);
                
                return (
                  <Link key={item.title} to={item.url}>
                    <div
                      className={`
                        p-4 rounded-xl transition-all duration-200 group cursor-pointer
                        hover:shadow-md border
                        ${active 
                          ? 'bg-primary/5 border-primary/20 shadow-sm' 
                          : 'hover:bg-muted/50 border-transparent hover:border-border'
                        }
                      `}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`
                          p-2 rounded-lg transition-colors
                          ${active 
                            ? 'bg-primary/10 text-primary' 
                            : 'bg-muted group-hover:bg-muted/80'
                          }
                        `}>
                          <Icon className="h-5 w-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className={`
                            font-medium transition-colors
                            ${active ? 'text-primary' : 'text-foreground'}
                          `}>
                            {item.title}
                          </h3>
                          <p className="text-sm text-muted-foreground truncate">
                            {item.description}
                          </p>
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </nav>

            {/* Quick Stats */}
            <div className="bg-muted/30 rounded-xl p-4 space-y-3">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
                <h4 className="text-sm font-medium text-foreground">Quick Stats</h4>
              </div>
              <div className="grid grid-cols-2 gap-3 text-center">
                <div className="bg-background rounded-lg p-3">
                  <div className="text-lg font-bold text-foreground">12</div>
                  <div className="text-xs text-muted-foreground">Active</div>
                </div>
                <div className="bg-background rounded-lg p-3">
                  <div className="text-lg font-bold text-green-600">8</div>
                  <div className="text-xs text-muted-foreground">Complete</div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-foreground mb-3">Quick Actions</h4>
              <Button variant="outline" size="sm" className="w-full justify-start gap-2">
                <Calendar className="h-4 w-4" />
                New Content Idea
              </Button>
              <Button variant="outline" size="sm" className="w-full justify-start gap-2">
                <Archive className="h-4 w-4" />
                Browse Templates
              </Button>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1">
          {children}
        </main>
      </div>
    </div>
  );
};