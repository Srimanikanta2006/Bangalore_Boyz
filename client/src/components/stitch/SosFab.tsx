import React from 'react';
import { Link } from 'react-router-dom';

export const SosFab: React.FC = () => {
  return (
    <aside className="fixed right-edge-margin-mobile bottom-24 mb-3 z-50 pointer-events-auto">
      <Link
        to="/rescue/sos"
        className="flex items-center justify-center w-14 h-14 rounded-full bg-error text-on-error shadow-[0_12px_32px_-4px_rgba(186,26,26,0.36)] active:scale-95 transition-transform duration-150 group"
        data-path="emergency"
        title="Emergency Assistance / SOS"
      >
        <div className="flex flex-col items-center justify-center">
          <span className="material-symbols-outlined text-[24px]">sos</span>
          <span className="font-label-sm text-[9px] font-bold tracking-tight leading-none uppercase">Alert</span>
        </div>
      </Link>
    </aside>
  );
};
