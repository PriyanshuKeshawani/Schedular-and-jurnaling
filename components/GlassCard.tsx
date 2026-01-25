import React from 'react';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  hoverEffect?: boolean;
}

export const GlassCard: React.FC<GlassCardProps> = ({ children, className = '', onClick, hoverEffect = false }) => {
  return (
    <div 
      onClick={onClick}
      className={`
        glass-panel rounded-2xl p-6
        ${hoverEffect ? 'hover:bg-white/10 cursor-pointer hover:translate-y-[-2px]' : ''}
        ${className}
      `}
    >
      {children}
    </div>
  );
};
