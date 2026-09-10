import React from 'react';

interface StickyActionBarProps {
  children: React.ReactNode;
  className?: string;
}

export const StickyActionBar: React.FC<StickyActionBarProps> = ({ children, className = '' }) => {
  return (
    <div
      className={`fixed bottom-0 left-0 right-0 z-40 bg-surface-container-lowest/95 backdrop-blur-xl px-edge-margin-mobile pt-space-xs pb-safe shadow-[0_-4px_20px_-2px_rgba(15,23,42,0.08)] flex flex-col items-center ${className}`}
    >
      {children}
    </div>
  );
};
