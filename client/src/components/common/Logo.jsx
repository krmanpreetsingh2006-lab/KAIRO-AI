import React from 'react';

/**
 * Premium KAIRO AI Logo Icon featuring:
 * - High-precision SVG geometry with beveled metallic/glass depth
 * - Subtle, controlled 3D rotational motion around its vertical (Y) axis
 * - Natural settling into front-facing position with perspective depth
 * - Universal hardware acceleration and prefers-reduced-motion compliance
 */
export function LogoIcon({ size = 32, className = '', animated = true }) {
  const uniqueId = React.useId().replace(/:/g, '');

  return (
    <div
      className={`relative flex items-center justify-center shrink-0 [perspective:600px] select-none ${className}`}
      style={{ width: size, height: size }}
      role="img"
      aria-label="KAIRO AI Logo"
    >
      {/* Layer 1: Base Plate & Beveled Obsidian Glass Shield (Static) */}
      <svg
        viewBox="0 0 64 64"
        width={size}
        height={size}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full"
        shapeRendering="geometricPrecision"
      >
        <defs>
          {/* Bezel Metallic Stroke Gradient */}
          <linearGradient id={`bezelGrad_${uniqueId}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#38BDF8" stopOpacity="0.85" />
            <stop offset="25%" stopColor="#06B6D4" stopOpacity="0.6" />
            <stop offset="60%" stopColor="#3B82F6" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#0E1626" stopOpacity="0.9" />
          </linearGradient>

          {/* Obsidian Glass Substrate Fill */}
          <linearGradient id={`glassSubstrate_${uniqueId}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#0B0F1C" />
            <stop offset="50%" stopColor="#080C16" />
            <stop offset="100%" stopColor="#05070D" />
          </linearGradient>

          {/* Ambient Core Radial Glow */}
          <radialGradient id={`ambientGlow_${uniqueId}`} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#06B6D4" stopOpacity="0.22" />
            <stop offset="60%" stopColor="#3B82F6" stopOpacity="0.08" />
            <stop offset="100%" stopColor="#08090E" stopOpacity="0" />
          </radialGradient>

          {/* Diagonal Glass Sheen Reflection */}
          <linearGradient id={`glassSheen_${uniqueId}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.14" />
            <stop offset="45%" stopColor="#FFFFFF" stopOpacity="0.03" />
            <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Outer Shield Housing */}
        <rect
          x="3"
          y="3"
          width="58"
          height="58"
          rx="17"
          fill={`url(#glassSubstrate_${uniqueId})`}
          stroke={`url(#bezelGrad_${uniqueId})`}
          strokeWidth="1.5"
        />

        {/* Inner Precision Rim */}
        <rect
          x="4.5"
          y="4.5"
          width="55"
          height="55"
          rx="15.5"
          stroke="rgba(255, 255, 255, 0.08)"
          strokeWidth="0.8"
          fill="none"
        />

        {/* Glass Specular Prismatic Sheen */}
        <path
          d="M4.5 22C4.5 12.3 12.3 4.5 22 4.5H35L4.5 35V22Z"
          fill={`url(#glassSheen_${uniqueId})`}
        />

        {/* Soft Radial Ambient Core Light */}
        <circle cx="32" cy="32" r="22" fill={`url(#ambientGlow_${uniqueId})`} />
      </svg>

      {/* Layer 2: 3D Rotational Central K Monogram with Subtle Perspective */}
      <div
        className={`absolute inset-0 flex items-center justify-center pointer-events-none ${
          animated ? 'kairo-3d-logo-glyph' : ''
        }`}
      >
        <svg
          viewBox="0 0 64 64"
          width={size}
          height={size}
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full overflow-visible"
          shapeRendering="geometricPrecision"
        >
          <defs>
            {/* Front Metallic Cyan-to-Blue Gradient (Spine) */}
            <linearGradient id={`kairoSpine_${uniqueId}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#38BDF8" />
              <stop offset="45%" stopColor="#06B6D4" />
              <stop offset="100%" stopColor="#2563EB" />
            </linearGradient>

            {/* Front Metallic Cyan-to-Blue Gradient (Chevrons) */}
            <linearGradient id={`kairoChevrons_${uniqueId}`} x1="100%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#67E8F9" />
              <stop offset="40%" stopColor="#0EA5E9" />
              <stop offset="100%" stopColor="#1D4ED8" />
            </linearGradient>

            {/* 3D Extrusion Depth Shadow Facet */}
            <linearGradient id={`kairoDepthFacet_${uniqueId}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#0369A1" />
              <stop offset="100%" stopColor="#1E3A8A" />
            </linearGradient>

            {/* Specular Ridge Highlight */}
            <linearGradient id={`specularEdge_${uniqueId}`} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.85" />
              <stop offset="60%" stopColor="#38BDF8" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#06B6D4" stopOpacity="0.1" />
            </linearGradient>

            {/* Quantum Core Corona Glow Filter */}
            <filter id={`coreCorona_${uniqueId}`} x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="2.5" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* 3D Monogram Geometry */}
          <g>
            {/* --- 3D Depth Under-Extrusion Layer --- */}
            {/* Spine Depth */}
            <path
              d="M20 16.8C20 15.7 20.9 14.8 22 14.8H25.5C26.6 14.8 27.5 15.7 27.5 16.8V48.8C27.5 49.9 26.6 50.8 25.5 50.8H22C20.9 50.8 20 49.9 20 48.8V16.8Z"
              fill={`url(#kairoDepthFacet_${uniqueId})`}
              opacity="0.85"
            />
            {/* Chevron Depth */}
            <path
              d="M29.5 31.5L40.8 16.5C41.6 15.4 43 14.8 44.3 15.1L46.8 15.7C48.2 16 48.9 17.5 48.1 18.6L37.2 33L48.5 47.5C49.3 48.5 48.6 50.1 47.2 50.3L44.5 50.8C43.2 51 42 50.4 41.2 49.4L29.5 34.5V31.5Z"
              fill={`url(#kairoDepthFacet_${uniqueId})`}
              opacity="0.85"
            />

            {/* --- Front Metallic Facets --- */}
            {/* Vertical Spine */}
            <path
              d="M19 16C19 14.8954 19.8954 14 21 14H24.5C25.6046 14 26.5 14.8954 26.5 16V48C26.5 49.1046 25.6046 50 24.5 50H21C19.8954 50 19 49.1046 19 48V16Z"
              fill={`url(#kairoSpine_${uniqueId})`}
            />
            {/* Specular Bevel Line down Spine */}
            <path
              d="M20.2 15.5V48.5"
              stroke={`url(#specularEdge_${uniqueId})`}
              strokeWidth="0.85"
              strokeLinecap="round"
            />

            {/* Upper & Lower Chevron Wings */}
            <path
              d="M28.5 30.5L39.8 15.5C40.6 14.4 42 13.8 43.3 14.1L45.8 14.7C47.2 15 47.9 16.5 47.1 17.6L36.2 32L47.5 46.5C48.3 47.5 47.6 49.1 46.2 49.3L43.5 49.8C42.2 50 41 49.4 40.2 48.4L28.5 33.5V30.5Z"
              fill={`url(#kairoChevrons_${uniqueId})`}
            />
            {/* Chamfer Crest Specular Highlight on Chevron */}
            <path
              d="M30 30.8L40.2 16.2C41 15.2 42.1 14.7 43.2 15L45 15.4"
              stroke="rgba(255, 255, 255, 0.7)"
              strokeWidth="0.85"
              strokeLinecap="round"
            />

            {/* --- Central Quantum Node --- */}
            {/* Ambient Corona Glow */}
            <circle
              cx="32"
              cy="32"
              r="7.5"
              fill={`url(#kairoSpine_${uniqueId})`}
              opacity="0.3"
              filter={`url(#coreCorona_${uniqueId})`}
            />

            {/* Rotating Orbital Telemetry Ring */}
            <circle
              cx="32"
              cy="32"
              r="6.2"
              stroke={`url(#kairoSpine_${uniqueId})`}
              strokeWidth="1.1"
              strokeDasharray="2.5 2"
              className="kairo-orbital-node"
            />

            {/* Inner Metallic Node Housing */}
            <circle
              cx="32"
              cy="32"
              r="3.6"
              fill="#080E1C"
              stroke="#38BDF8"
              strokeWidth="0.9"
            />

            {/* Pure White Central Quantum Spark */}
            <circle cx="32" cy="32" r="2.2" fill="#FFFFFF" />
          </g>
        </svg>
      </div>
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
      <LogoIcon size={iconPx} animated={true} />
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
