import React from 'react';

const Attendance = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Attendance</h1>
        <p className="text-muted-foreground mt-2">
          Track team attendance, working hours, and time-off requests.
        </p>
      </div>
      
      {/* Placeholder content */}
      <div className="rounded-lg border bg-card p-8 text-center">
        <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-muted flex items-center justify-center">
          <span className="text-2xl">📅</span>
        </div>
        <p className="text-muted-foreground">
          This page is under development. Team attendance tracking features will be available soon.
        </p>
      </div>
    </div>
  );
};

export default Attendance;