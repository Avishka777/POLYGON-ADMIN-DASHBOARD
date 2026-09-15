'use client';

import React from 'react';

interface KingDeveloperIconProps {
  size?: number;
  className?: string;
}

export const KingDeveloperIcon: React.FC<KingDeveloperIconProps> = ({
  size = 48,
  className = '',
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        <linearGradient id="crownGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#F59E0B" />
          <stop offset="50%" stopColor="#EAB308" />
          <stop offset="100%" stopColor="#6366F1" />
        </linearGradient>
        <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#1E1B4B" />
          <stop offset="100%" stopColor="#312E81" />
        </linearGradient>
        <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>

      {/* Circle Outer Frame */}
      <circle cx="50" cy="50" r="46" fill="url(#bgGrad)" stroke="url(#crownGrad)" strokeWidth="3" />

      {/* Crown Graphic */}
      <path
        d="M25 65 L20 38 L38 48 L50 25 L62 48 L80 38 L75 65 Z"
        fill="url(#crownGrad)"
        filter="url(#glow)"
      />
      <rect x="25" y="65" width="50" height="8" rx="2" fill="#F59E0B" />

      {/* Code Brackets overlay on Crown base */}
      <text
        x="50"
        y="58"
        fill="#FFFFFF"
        fontSize="16"
        fontWeight="900"
        fontFamily="monospace"
        textAnchor="middle"
      >
        &lt;/&gt;
      </text>

      {/* Jewels on Crown points */}
      <circle cx="20" cy="36" r="3.5" fill="#EC4899" />
      <circle cx="50" cy="23" r="4.5" fill="#3B82F6" />
      <circle cx="80" cy="36" r="3.5" fill="#10B981" />
    </svg>
  );
};
