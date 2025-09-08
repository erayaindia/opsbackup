import { useState } from 'react';
import { useModuleAccess } from '@/hooks/useModuleAccess';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { triggerGlobalPermissionRefresh } from '@/contexts/PermissionsContext';
import { linkUserAccount } from '@/utils/linkUserAccount';
import { RefreshCw, Link } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

export function UserAccessDebugger() {
  const { canAccessModule, getUserInfo, currentUser, isLoading } = useModuleAccess();
  const [showDebug, setShowDebug] = useState(false);

  // Always show debug in development, even if there are issues
  if (isLoading) {
    return (
      <div className="fixed top-4 right-4 z-50">
        <Button variant="outline" size="sm" disabled>
          Loading...
        </Button>
      </div>
    );
  }

  const userInfo = getUserInfo();
  const modules = ['dashboard', 'orders', 'fulfillment', 'support', 'content', 'marketing', 'products', 'finance', 'management', 'team-hub', 'analytics', 'training', 'alerts'];

  const handleRefreshPermissions = () => {
    console.log('🔄 [UserAccessDebugger] Manual permission refresh triggered');
    triggerGlobalPermissionRefresh();
  };

  const handleFixLink = async () => {
    console.log('🔗 [UserAccessDebugger] Attempting to fix user link...');
    
    // We need to get the current auth user's email to link
    const { data: { user } } = await supabase.auth.getUser();
    if (user?.email) {
      const result = await linkUserAccount(user.email);
      
      if (result.success) {
        toast.success(result.message || 'User account linked successfully!');
        // Refresh permissions after successful link
        triggerGlobalPermissionRefresh();
      } else {
        toast.error(`Failed to link account: ${result.error}`);
      }
    } else {
      toast.error('No authenticated user found');
    }
  };

  // Show debug info even when user is null to diagnose issues
  const debugInfo = !currentUser ? "NO USER LOADED" : userInfo;

  return (
    <div className="fixed top-4 right-4 z-50">
      <div className="flex gap-2">
        <Button 
          onClick={handleRefreshPermissions}
          variant="outline"
          size="sm"
        >
          <RefreshCw className="h-4 w-4" />
        </Button>
        {!currentUser && (
          <Button 
            onClick={handleFixLink}
            variant="outline"
            size="sm"
            className="text-orange-600 border-orange-300 hover:bg-orange-50"
          >
            <Link className="h-4 w-4" />
          </Button>
        )}
        <Button 
          onClick={() => setShowDebug(!showDebug)}
          variant="outline"
          size="sm"
        >
          Debug Access
        </Button>
      </div>
      
      {showDebug && (
        <Card className="mt-2 w-96 max-h-96 overflow-auto">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Access Debug Info</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-sm font-medium">Debug Status:</p>
              <p className="text-xs text-muted-foreground">
                {!currentUser ? "❌ NO USER LOADED" : `✅ User loaded: ${userInfo.name}`}
              </p>
              {currentUser && (
                <>
                  <p className="text-xs text-muted-foreground">Email: {currentUser.company_email}</p>
                  <p className="text-xs text-muted-foreground">Role: {userInfo.role}</p>
                </>
              )}
            </div>
            
            {currentUser ? (
              <>
                <div>
                  <p className="text-sm font-medium mb-2">Granted Modules:</p>
                  <div className="flex flex-wrap gap-1">
                    {userInfo.modules?.map((module: string) => (
                      <Badge key={module} variant="secondary" className="text-xs">
                        {module}
                      </Badge>
                    )) || <span className="text-xs text-muted-foreground">None</span>}
                  </div>
                </div>
                
                <div>
                  <p className="text-sm font-medium mb-2">Module Access Check:</p>
                  <div className="space-y-1 text-xs">
                    {modules.map(module => (
                      <div key={module} className="flex justify-between">
                        <span>{module}:</span>
                        <Badge 
                          variant={canAccessModule(module) ? "default" : "destructive"}
                          className="text-xs"
                        >
                          {canAccessModule(module) ? "✓" : "✗"}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <div>
                <p className="text-sm text-red-600">User not loaded. Possible issues:</p>
                <ul className="text-xs text-muted-foreground ml-4 list-disc">
                  <li>Auth user not linked to app_users table</li>
                  <li>Database permission issue</li>
                  <li>User activation failed</li>
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}