import React from 'react';

const BankAccounts = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Bank Accounts Overview</h1>
        <p className="text-muted-foreground mt-2">
          Monitor all your business bank accounts and balances.
        </p>
      </div>
      
      {/* Placeholder content */}
      <div className="rounded-lg border bg-card p-8 text-center">
        <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-muted flex items-center justify-center">
          <span className="text-2xl">🏦</span>
        </div>
        <p className="text-muted-foreground">
          This page is under development. Bank account management features will be available soon.
        </p>
      </div>
    </div>
  );
};

export default BankAccounts;