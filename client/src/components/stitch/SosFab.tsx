import React from 'react';
import { Link } from 'react-router-dom';

export const SosFab: React.FC = () => {
  return (
    <aside className="absolute right-4 bottom-24 z-30 pointer-events-auto">
      <Link
        to="/citizen/sos"
        className="flex items-center justify-center w-14 h-14 rounded-full bg-error text-on-error shadow-[0_8px_24px_-2px_rgba(186,26,26,0.5)] active:scale-95 transition-transform duration-150 group border-2 border-white"
        data-path="emergency"
        title="Emergency Assistance / SOS"
      >
        <div className="flex flex-col items-center justify-center">
          <span className="material-symbols-outlined text-[22px]">sos</span>
          <span className="font-label-sm text-[8px] font-bold tracking-tight leading-none uppercase">Alert</span>
        </div>
      </Link>
    </aside>
  );
};
