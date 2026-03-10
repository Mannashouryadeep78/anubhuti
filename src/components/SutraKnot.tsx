import React from 'react';

export const SutraKnot = ({ className = "w-6 h-6" }: { className?: string }) => (
  <svg 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="1" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <path d="M12 2v20M2 12h20" />
    <circle cx="12" cy="12" r="3" />
    <path d="M7.5 7.5l9 9M16.5 7.5l-9 9" />
  </svg>
);