import React from 'react';

const SystemSettings = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">System Settings</h1>
        <p className="text-muted-foreground mt-2">
          Configure system-wide settings and preferences.
        </p>
      </div>
      
      {/* Placeholder content */}
      <div className="rounded-lg border bg-card p-8 text-center">
        <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-muted flex items-center justify-center">
          <span className="text-2xl">⚙️</span>
        </div>
        <p className="text-muted-foreground">
          This page is under development. System settings features will be available soon.
        </p>
      </div>
    </div>
  );
};

export default SystemSettings;