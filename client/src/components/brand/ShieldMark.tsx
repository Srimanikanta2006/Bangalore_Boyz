import React from 'react';

interface ShieldMarkProps {
  className?: string;
  size?: number;
  glow?: boolean;
}

export const ShieldMark: React.FC<ShieldMarkProps> = ({
  className = 'w-10 h-10',
  size = 40,
  glow = false,
}) => {
  return (
    <div className={`relative inline-flex items-center justify-center shrink-0 ${className}`}>
      {glow && (
        <div className="absolute inset-0 bg-secondary/20 rounded-xl blur-md animate-pulse pointer-events-none" />
      )}
      <svg
        width={size}
        height={size}
        viewBox="0 0 160 160"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="relative z-10 drop-shadow-sm"
      >
        <defs>
          <linearGradient id="shieldGrad" x1="20" y1="20" x2="140" y2="140" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#0F172A" />
            <stop offset="100%" stopColor="#1E293B" />
          </linearGradient>
          <linearGradient id="accentGrad" x1="40" y1="30" x2="120" y2="130" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#0051D5" />
            <stop offset="100%" stopColor="#06B6D4" />
          </linearGradient>
          <linearGradient id="emeraldGrad" x1="60" y1="50" x2="100" y2="110" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#10B981" />
            <stop offset="100%" stopColor="#059669" />
          </linearGradient>
        </defs>

        {/* Outer Shield Outline */}
        <path
          d="M80 18L30 38V82C30 114 51.5 138.5 80 146C108.5 138.5 130 114 130 82V38L80 18Z"
          fill="url(#shieldGrad)"
          stroke="#334155"
          strokeWidth="3"
        />

        {/* Inner Geometric Circuit Lines */}
        <path
          d="M80 32L44 48V78C44 104 60 123.5 80 130C100 123.5 116 104 116 78V48L80 32Z"
          fill="#0B1326"
          stroke="url(#accentGrad)"
          strokeWidth="2"
        />

        {/* Central Pulse / Sensor Core */}
        <path
          d="M80 52L60 62V82C60 97 69 108 80 112C91 108 100 97 100 82V62L80 52Z"
          fill="url(#accentGrad)"
          opacity="0.85"
        />

        <circle cx="80" cy="80" r="10" fill="#FFFFFF" />
        <circle cx="80" cy="80" r="5" fill="#0051D5" />
      </svg>
    </div>
  );
};

export default ShieldMark;
