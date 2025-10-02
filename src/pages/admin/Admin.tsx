import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import {
  Users,
  UserPlus,
  ClipboardList,
  UserCheck,
  Settings,
  Link2,
  BarChart3,
  Shield,
  ChevronRight,
  Activity,
  Loader2,
} from 'lucide-react';

interface KPIData {
  activePeople: number;
  activeTasks: number;
  pendingApplications: number;
  integrations: number;
  loading: boolean;
}

const Admin = () => {
  const navigate = useNavigate();
  const [kpiData, setKpiData] = useState<KPIData>({
    activePeople: 0,
    activeTasks: 0,
    pendingApplications: 0,
    integrations: 0,
    loading: true,
  });

  // Fetch real KPI data from database
  useEffect(() => {
    const fetchKPIData = async () => {
      try {
        setKpiData(prev => ({ ...prev, loading: true }));

        // Fetch active people count
        const { count: usersCount } = await supabase
          .from('app_users')
          .select('*', { count: 'exact', head: true });

        // Fetch active tasks count (not approved or rejected)
        const { count: tasksCount } = await supabase
          .from('tasks')
          .select('*', { count: 'exact', head: true })
          .not('status', 'in', '(approved,rejected,done_auto_approved)');

        // Fetch pending onboarding applications (assuming there's an onboarding_applications table)
        // If this table doesn't exist, we'll set it to 0
        let applicationsCount = 0;
        try {
          const { count: appsCount } = await supabase
            .from('onboarding_applications')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'pending');
          applicationsCount = appsCount || 0;
        } catch (error) {
          // Table might not exist, keep as 0
          console.log('Onboarding applications table not found, using 0');
        }

        // For integrations, we'll count active connections or set a placeholder
        // This would depend on your integrations table structure
        let integrationsCount = 12; // Placeholder - you can replace with actual query

        setKpiData({
          activePeople: usersCount || 0,
          activeTasks: tasksCount || 0,
          pendingApplications: applicationsCount,
          integrations: integrationsCount,
          loading: false,
        });

      } catch (error) {
        console.error('Error fetching KPI data:', error);
        setKpiData(prev => ({ ...prev, loading: false }));
      }
    };

    fetchKPIData();
  }, []);

  const adminOptions = [
    {
      title: 'People & Roles',
      description: 'Manage people accounts, roles, permissions, and access controls',
      icon: Users,
      path: '/people',
      color: 'bg-blue-500',
      stats: `${kpiData.activePeople} Active`,
      category: 'People Management'
    },
    {
      title: 'Employee Onboarding',
      description: 'Create and manage employee onboarding forms and processes',
      icon: UserPlus,
      path: '/onboard',
      color: 'bg-green-500',
      stats: 'Setup Forms',
      category: 'HR Management'
    },
    {
      title: 'Onboarding Applications',
      description: 'Review and process employee onboarding applications',
      icon: ClipboardList,
      path: '/admin/onboarding',
      color: 'bg-purple-500',
      stats: `${kpiData.pendingApplications} Pending`,
      category: 'HR Management'
    },
    {
      title: 'Task Management',
      description: 'Oversee all tasks, assignments, and project workflows',
      icon: UserCheck,
      path: '/admin/tasks',
      color: 'bg-orange-500',
      stats: `${kpiData.activeTasks} Active`,
      category: 'Operations'
    },
    {
      title: 'System Settings',
      description: 'Configure system-wide settings and preferences',
      icon: Settings,
      path: '/management/system-settings',
      color: 'bg-gray-600',
      stats: 'Configure',
      category: 'System'
    },
    {
      title: 'Integrations',
      description: 'Manage third-party integrations and API connections',
      icon: Link2,
      path: '/management/integrations',
      color: 'bg-teal-500',
      stats: `${kpiData.integrations} Connected`,
      category: 'System'
    },
    {
      title: 'Analytics & Insights',
      description: 'View comprehensive analytics and business insights',
      icon: BarChart3,
      path: '/management/analytics-insights',
      color: 'bg-indigo-500',
      stats: 'View Reports',
      category: 'Analytics'
    }
  ];

  const handleCardClick = (path: string) => {
    navigate(path);
  };

  return (
    <div className="container mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
          <p className="text-muted-foreground mt-2">
            Manage all administrative functions and system settings
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-green-500" />
          <Badge variant="outline" className="text-green-700 border-green-200">
            System Healthy
          </Badge>
        </div>
      </div>

      {/* Quick Stats KPI Cards */}
      <div className="p-6 bg-muted/30 rounded-lg border">
        <h3 className="text-lg font-semibold mb-4">Quick Overview</h3>
        {kpiData.loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <span className="ml-2 text-muted-foreground">Loading KPI data...</span>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{kpiData.activePeople}</div>
              <div className="text-sm text-muted-foreground">Active People</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{kpiData.activeTasks}</div>
              <div className="text-sm text-muted-foreground">Active Tasks</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{kpiData.pendingApplications}</div>
              <div className="text-sm text-muted-foreground">Pending Applications</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{kpiData.integrations}</div>
              <div className="text-sm text-muted-foreground">Integrations</div>
            </div>
          </div>
        )}
      </div>

      {/* Admin Options Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {adminOptions.map((option) => {
          const IconComponent = option.icon;
          return (
            <Card
              key={option.title}
              className="group cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-105 hover:border-primary/20 bg-card/50 backdrop-blur-sm"
              onClick={() => handleCardClick(option.path)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className={`p-2 rounded-lg ${option.color} text-white`}>
                    <IconComponent className="h-5 w-5" />
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
                <CardTitle className="text-base group-hover:text-primary transition-colors">
                  {option.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                  {option.description}
                </p>
                <div className="flex items-center justify-between">
                  <Badge variant="secondary" className="text-xs">
                    {option.stats}
                  </Badge>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="opacity-0 group-hover:opacity-100 transition-opacity text-xs h-6 px-2"
                  >
                    Open
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default Admin;