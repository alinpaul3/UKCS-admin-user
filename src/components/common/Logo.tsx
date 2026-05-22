import React from 'react';

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
  // Dimensions based on size
  const sizes = {
    sm: { emblem: 'h-8 w-8', text: 'text-sm md:text-base', subtext: 'text-[7px]' },
    md: { emblem: 'h-12 w-12', text: 'text-xl md:text-2xl', subtext: 'text-[9px] md:text-[10px]' },
    lg: { emblem: 'h-20 w-20', text: 'text-3xl md:text-4xl', subtext: 'text-[11px] md:text-[12px]' },
    xl: { emblem: 'h-28 w-28', text: 'text-5xl md:text-6xl', subtext: 'text-[13px] md:text-[14px]' },
  };

  const currentSize = sizes[size];

  // Brand Colors
  const blueColor = '#18449c'; // Authentic UKCS primary royal blue
  const redColor = '#d11e32';  // Authentic UKCS vibrant ruby red
  const textColor = theme === 'dark' ? '#ffffff' : '#2b2b2b';
  const subtextColor = theme === 'dark' ? 'text-slate-300' : 'text-slate-600';

  return (
    <div className={`flex ${variant === 'vertical' ? 'flex-col items-center text-center' : 'items-center'} gap-3 ${className}`}>
      {/* UKCS Emblem */}
      <svg
        className={currentSize.emblem}
        viewBox="0 0 110 110"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <g transform="translate(10, 10)">
          {/* Red Left Tip (Small outer slice of crescent) */}
          <path
            d="M 5 40 
               L 19 40 
               L 5 54 
               C 3 49, 3 45, 5 40 
               Z"
            fill={redColor}
          />

          {/* Main Red Crescent (Right arm and bottom bowl) */}
          <path
            d="M 80 40 
               L 95 40 
               C 95 65, 80 95, 50 95 
               C 35 95, 22 88, 18 76 
               L 28 66 
               C 33 75, 41 81, 50 81 
               C 67 81, 80 70, 80 55 
               Z"
            fill={redColor}
          />

          {/* Blue Arrow (Angled arrow rising from bottom-left to top-right with top vertical cap) */}
          <path
            d="M 13 52 
               L 55 10 
               L 55 0 
               L 87 0 
               L 87 35 
               L 74 35 
               L 74 15 
               L 25 64 
               Z"
            fill={blueColor}
          />
        </g>
      </svg>

      {/* Brand Text */}
      {variant !== 'emblem-only' && (
        <div className={`flex flex-col ${variant === 'vertical' ? 'items-center mt-2' : 'justify-center text-left'}`}>
          <span
            className={`font-black tracking-tight leading-none ${currentSize.text}`}
            style={{ color: textColor }}
          >
            UKCS
          </span>
          <span
            className={`font-bold tracking-wider uppercase leading-none mt-1 ${currentSize.subtext} ${subtextColor}`}
          >
            UK Certification Solutions
          </span>
        </div>
      )}
    </div>
  );
}
