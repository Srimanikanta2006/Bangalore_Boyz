import type { ButtonHTMLAttributes, ReactNode } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md';
  children: ReactNode;
}

const variants = {
  primary: 'bg-cs-primary/20 text-cs-primary border-cs-primary/50 hover:bg-cs-primary/30',
  secondary: 'bg-cs-panelAlt text-cs-text border-cs-border hover:bg-cs-border/30',
  ghost: 'bg-transparent text-cs-textDim border-transparent hover:text-cs-text hover:bg-cs-panelAlt',
  danger: 'bg-cs-critical/20 text-cs-critical border-cs-critical/50 hover:bg-cs-critical/30',
};

const sizes = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-4 py-2 text-sm',
};

export function Button({
  variant = 'primary',
  size = 'md',
  className = '',
  children,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded border font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-cs-primary/50 disabled:cursor-not-allowed disabled:opacity-40 ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
}
