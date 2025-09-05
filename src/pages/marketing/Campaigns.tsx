import React from 'react';

const Campaigns = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Campaigns (FB, Google, IG, TikTok)</h1>
        <p className="text-muted-foreground mt-2">
          Manage and monitor your marketing campaigns across all platforms.
        </p>
      </div>
      
      {/* Placeholder content */}
      <div className="rounded-lg border bg-card p-8 text-center">
        <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-muted flex items-center justify-center">
          <span className="text-2xl">📢</span>
        </div>
        <p className="text-muted-foreground">
          This page is under development. Campaign management features will be available soon.
        </p>
      </div>
    </div>
  );
};

export default Campaigns;