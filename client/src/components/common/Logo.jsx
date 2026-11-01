import React from 'react';

export function LogoIcon({ size = 32, className = '', animated = false }) {
  return (
    <div
      className={`relative flex items-center justify-center shrink-0 ${className}`}
      style={{ width: size, height: size }}
    >
      <svg
        viewBox="0 0 64 64"
        width={size}
        height={size}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="transition-transform duration-300 hover:scale-105"
      >
        <defs>
          <linearGradient id="kairoCyanBlue1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#22D3EE" />
            <stop offset="50%" stopColor="#06B6D4" />
            <stop offset="100%" stopColor="#3B82F6" />
          </linearGradient>
          <linearGradient id="kairoCyanBlue2" x1="100%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#38BDF8" />
            <stop offset="60%" stopColor="#0EA5E9" />
            <stop offset="100%" stopColor="#2563EB" />
          </linearGradient>
          <filter id="kairoGlowCyan" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3.5" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Outer Shield Frame */}
        <rect
          x="3"
          y="3"
          width="58"
          height="58"
          rx="18"
          fill="#0B0E17"
          stroke="rgba(34, 211, 238, 0.25)"
          strokeWidth="1.5"
        />

        {/* Ambient Radial Core Light */}
        <circle cx="32" cy="32" r="22" fill="url(#kairoCyanBlue1)" opacity="0.12" />

        {/* Stylized K Monogram */}
        <g filter="url(#kairoGlowCyan)">
          {/* Vertical Spine */}
          <path
            d="M19 16C19 14.8954 19.8954 14 21 14H24.5C25.6046 14 26.5 14.8954 26.5 16V48C26.5 49.1046 25.6046 50 24.5 50H21C19.8954 50 19 49.1046 19 48V16Z"
            fill="url(#kairoCyanBlue1)"
          />
          {/* Upper & Lower Chevron Arms */}
          <path
            d="M28.5 30.5L39.8 15.5C40.6 14.4 42 13.8 43.3 14.1L45.8 14.7C47.2 15 47.9 16.5 47.1 17.6L36.2 32L47.5 46.5C48.3 47.5 47.6 49.1 46.2 49.3L43.5 49.8C42.2 50 41 49.4 40.2 48.4L28.5 33.5V30.5Z"
            fill="url(#kairoCyanBlue2)"
          />
          {/* Central Quantum Node */}
          <circle cx="32" cy="32" r="3" fill="#FFFFFF" />
          <circle
            cx="32"
            cy="32"
            r="6"
            stroke="url(#kairoCyanBlue1)"
            strokeWidth="1.2"
            strokeDasharray="2 2"
            className={animated ? 'animate-spin' : ''}
            style={{ animationDuration: '6s' }}
          />
        </g>
      </svg>
    </div>
  );
}

export default function Logo({
  showTagline = true,
  showPro = true,
  size = 'md',
  className = '',
  onClick,
}) {
  const iconSizes = {
    sm: 28,
    md: 34,
    lg: 44,
    xl: 56,
  };

  const textSizes = {
    sm: 'text-sm tracking-[0.14em]',
    md: 'text-[15px] tracking-[0.16em]',
    lg: 'text-xl tracking-[0.18em]',
    xl: 'text-2xl tracking-[0.2em]',
  };

  const iconPx = iconSizes[size] || 34;
  const textClass = textSizes[size] || 'text-[15px] tracking-[0.16em]';

  return (
    <div
      onClick={onClick}
      className={`flex items-center gap-3 select-none ${onClick ? 'cursor-pointer group' : ''} ${className}`}
    >
      <LogoIcon size={iconPx} />
      <div className="flex flex-col min-w-0">
        <div className="flex items-center gap-1.5 leading-none">
          <span className={`font-black text-white group-hover:text-cyan-200 transition-colors ${textClass}`}>
            KAIRO
          </span>
          <span className="font-black bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
            AI
          </span>
          {showPro && (
            <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded-full tracking-widest bg-cyan-500/15 border border-cyan-400/40 text-cyan-300 shadow-[0_0_10px_rgba(6,182,212,0.25)]">
              PRO
            </span>
          )}
        </div>
        {showTagline && (
          <span className="text-[9.5px] uppercase font-semibold tracking-[0.15em] text-slate-400 mt-1 truncate">
            INTELLIGENCE BEYOND LIMITS
          </span>
        )}
      </div>
    </div>
  );
}
