import React from 'react';
import ukcsLogo from '../../assets/UKCSLogo.png';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'horizontal' | 'vertical' | 'emblem-only';
  theme?: 'light' | 'dark';
}

export function Logo({
  className = '',
  size = 'md',
  variant = 'horizontal',
  theme = 'light',
}: LogoProps) {
  const sizes = {
    sm: 'h-9',
    md: 'h-12',
    lg: 'h-20',
    xl: 'h-28',
  };

  const currentSize = sizes[size];
  const themeClass = theme === 'dark' ? 'bg-white rounded-sm px-2 py-1' : '';
  const variantClass =
    variant === 'emblem-only'
      ? 'w-auto max-w-none'
      : variant === 'vertical'
        ? 'w-auto max-w-[min(22rem,80vw)]'
        : 'w-auto max-w-[min(20rem,62vw)]';

  return (
    <div className={`flex ${variant === 'vertical' ? 'justify-center' : 'items-center'} ${className}`}>
      <img
        src={ukcsLogo}
        alt="UKCS Certification Solutions"
        className={`${currentSize} ${variantClass} ${themeClass} object-contain`}
      />
    </div>
  );
}
