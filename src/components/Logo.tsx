import React from 'react';

interface LogoProps {
  variant?: 'full' | 'horizontal' | 'vertical' | 'mark' | 'white-footer' | 'hero-badge';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  showTagline?: boolean;
}

export const DocMateEmblem: React.FC<{ size?: number; className?: string }> = ({ 
  size = 40, 
  className = '' 
}) => {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 100 100" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={`inline-block flex-shrink-0 transition-transform ${className}`}
      aria-label="DocMate Logo Mark"
    >
      <defs>
        {/* Main D gradient */}
        <linearGradient id="docmate-blue-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#0066FF" />
          <stop offset="100%" stopColor="#0047CC" />
        </linearGradient>

        {/* Dynamic lower swoosh gradient */}
        <linearGradient id="docmate-swoosh-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#0088FF" />
          <stop offset="100%" stopColor="#0055EE" />
        </linearGradient>

        {/* Inner subtle glow */}
        <filter id="subtle-shadow" x="-10%" y="-10%" width="120%" height="120%">
          <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="#003399" floodOpacity="0.25" />
        </filter>
      </defs>

      {/* Main outer "D" boundary structure */}
      <path 
        d="M20 12 C20 8, 24 5, 32 5 L55 5 C78 5, 95 22, 95 50 C95 78, 78 95, 55 95 L32 95 C24 95, 20 92, 20 88 Z" 
        fill="url(#docmate-blue-grad)" 
      />

      {/* Folded Document shape inside */}
      {/* Document Body */}
      <path 
        d="M36 20 C36 18, 38 16, 40 16 L65 16 L80 31 L80 72 C80 74, 78 76, 76 76 L40 76 C38 76, 36 74, 36 72 Z" 
        fill="#FFFFFF" 
        filter="url(#subtle-shadow)"
      />

      {/* Document Top-Right Corner Fold */}
      <path 
        d="M65 16 L65 28 C65 30, 67 31, 69 31 L80 31 Z" 
        fill="#0066FF" 
      />

      {/* 3 Horizontal Document Lines */}
      <rect x="44" y="38" width="28" height="4" rx="2" fill="#0066FF" />
      <rect x="44" y="47" width="28" height="4" rx="2" fill="#0066FF" />
      <rect x="44" y="56" width="18" height="4" rx="2" fill="#0066FF" />

      {/* Dynamic curved swoosh overlay wrapping the bottom */}
      <path 
        d="M20 74 C28 62, 45 54, 70 48 C85 45, 93 48, 93 54 C93 78, 76 95, 52 95 C35 95, 24 86, 20 74 Z" 
        fill="url(#docmate-swoosh-grad)" 
      />
    </svg>
  );
};

export const Logo: React.FC<LogoProps> = ({
  variant = 'horizontal',
  size = 'md',
  className = '',
  showTagline = false
}) => {
  const sizeMap = {
    sm: { emblem: 28, text: 'text-xl', subtext: 'text-[9px]' },
    md: { emblem: 36, text: 'text-2xl', subtext: 'text-[11px]' },
    lg: { emblem: 48, text: 'text-3xl', subtext: 'text-xs' },
    xl: { emblem: 64, text: 'text-4xl', subtext: 'text-sm' }
  };

  const { emblem: emblemSize, text: textSize, subtext: subtextSize } = sizeMap[size];

  if (variant === 'mark') {
    return <DocMateEmblem size={emblemSize} className={className} />;
  }

  const isWhiteFooter = variant === 'white-footer';
  const isVertical = variant === 'vertical';

  return (
    <div className={`inline-flex ${isVertical ? 'flex-col items-center text-center gap-2' : 'items-center gap-2.5'} select-none ${className}`}>
      <DocMateEmblem size={emblemSize} />
      
      <div className={`flex flex-col ${isVertical ? 'items-center' : ''}`}>
        <div className="flex items-center font-extrabold tracking-tight leading-none" style={{ fontFamily: 'Outfit, sans-serif' }}>
          <span className={`${textSize} ${isWhiteFooter ? 'text-white' : 'text-slate-900'} tracking-tight`}>
            Doc
          </span>
          <span className={`${textSize} text-[#0066FF] tracking-tight`}>
            Mate
          </span>
        </div>
        {(showTagline || variant === 'full' || isWhiteFooter || isVertical) && (
          <span className={`${subtextSize} font-medium tracking-wide mt-1 ${isWhiteFooter ? 'text-slate-400' : 'text-slate-500'}`}>
            Your Files. Made Simple.
          </span>
        )}
      </div>
    </div>
  );
};

export default Logo;
