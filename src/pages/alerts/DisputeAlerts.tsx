import React from 'react';

const DisputeAlerts = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Dispute Alerts</h1>
        <p className="text-muted-foreground mt-2">
          Track and manage payment disputes, chargebacks, and resolution alerts.
        </p>
      </div>
      
      {/* Placeholder content */}
      <div className="rounded-lg border bg-card p-8 text-center">
        <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-muted flex items-center justify-center">
          <span className="text-2xl">⚠️</span>
        </div>
        <p className="text-muted-foreground">
          This page is under development. Dispute alert monitoring features will be available soon.
        </p>
      </div>
    </div>
  );
};

export default DisputeAlerts;