import React from 'react';

const Loading = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background">
      <div className="relative">
        {/* Outer ring */}
        <div className="w-16 h-16 rounded-full border-4 border-emerald-200 dark:border-emerald-900"></div>
        {/* Spinning arc */}
        <div className="absolute top-0 left-0 w-16 h-16 rounded-full border-4 border-transparent border-t-emerald-500 animate-spin"></div>
      </div>
      <p className="mt-4 text-sm text-muted-foreground animate-pulse">Loading...</p>
    </div>
  );
};

export default Loading;
