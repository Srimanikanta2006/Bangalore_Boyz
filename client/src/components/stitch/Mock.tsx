import React from 'react';

interface MockProps {
  label: string;
  children: React.ReactNode;
  className?: string;
}

/**
 * Mock data wrapper component to flag hardcoded placeholder values.
 * Renders the children verbatim with an operational inspection attribute.
 */
export const Mock: React.FC<MockProps> = ({ label, children, className = '' }) => {
  return (
    <span
      className={`inline-block ${className}`}
      data-mock={label}
      title={`[MOCK]: ${label}`}
    >
      {children}
    </span>
  );
};
