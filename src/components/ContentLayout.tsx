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
      {children}
    </div>
  );
};