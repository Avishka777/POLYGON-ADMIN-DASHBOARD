'use client';

import React from 'react';

interface DevilWomanIconProps {
  size?: number;
  className?: string;
  isBouncing?: boolean;
}

export const DevilWomanIcon: React.FC<DevilWomanIconProps> = ({
  size = 48,
  className = '',
  isBouncing = false,
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`${isBouncing ? 'animate-[bounce_1.5s_infinite]' : ''} ${className}`}
    >
      <defs>
        {/* Outer Glow & Shadow Filter */}
        <filter id="badQaGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="3.5" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>

        {/* Outer Border Gradient */}
        <linearGradient id="badQaBorder" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#F43F5E" />
          <stop offset="50%" stopColor="#E11D48" />
          <stop offset="100%" stopColor="#7C3AED" />
        </linearGradient>

        {/* Background Radial Gradient */}
        <radialGradient id="badQaBg" cx="50%" cy="45%" r="55%">
          <stop offset="0%" stopColor="#3B071E" />
          <stop offset="60%" stopColor="#1E030F" />
          <stop offset="100%" stopColor="#0B0106" />
        </radialGradient>

        {/* Devil Horns Gradient */}
        <linearGradient id="hornGrad" x1="0%" y1="100%" x2="50%" y2="0%">
          <stop offset="0%" stopColor="#881337" />
          <stop offset="50%" stopColor="#E11D48" />
          <stop offset="100%" stopColor="#FDA4AF" />
        </linearGradient>

        {/* Glowing Eyes Gradient */}
        <linearGradient id="eyeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFE4E6" />
          <stop offset="60%" stopColor="#FB7185" />
          <stop offset="100%" stopColor="#E11D48" />
        </linearGradient>

        {/* Hair Gradient */}
        <linearGradient id="hairGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#2E0818" />
          <stop offset="60%" stopColor="#18030E" />
          <stop offset="100%" stopColor="#4C0519" />
        </linearGradient>
      </defs>

      {/* 1. Circular Outer Frame */}
      <circle
        cx="50"
        cy="50"
        r="46"
        fill="url(#badQaBg)"
        stroke="url(#badQaBorder)"
        strokeWidth="3.5"
      />

      {/* 2. Left Devil Horn */}
      <path
        d="M32 38 C28 26, 22 17, 18 12 C24 16, 33 24, 38 31 Z"
        fill="url(#hornGrad)"
        filter="url(#badQaGlow)"
      />
      {/* Right Devil Horn */}
      <path
        d="M68 38 C72 26, 78 17, 82 12 C76 16, 67 24, 62 31 Z"
        fill="url(#hornGrad)"
        filter="url(#badQaGlow)"
      />

      {/* 3. Devil Woman Hair Silhouette */}
      <path
        d="M24 50 C24 28, 35 22, 50 22 C65 22, 76 28, 76 50 C76 68, 72 78, 70 82 C65 74, 62 68, 62 62 C58 64, 54 65, 50 65 C46 65, 42 64, 38 62 C38 68, 35 74, 30 82 C28 78, 24 68, 24 50 Z"
        fill="url(#hairGrad)"
      />

      {/* 4. Sleek Face Shape */}
      <path
        d="M33 44 C33 34, 40 32, 50 32 C60 32, 67 34, 67 44 C67 56, 58 72, 50 76 C42 72, 33 56, 33 44 Z"
        fill="#FFE4E6"
      />

      {/* 5. Hair Bangs / Framing */}
      <path
        d="M33 40 C38 34, 46 36, 50 42 C54 36, 62 34, 67 40 C65 34, 59 32, 50 32 C41 32, 35 34, 33 40 Z"
        fill="#18030E"
      />

      {/* 6. Winged Eyeliner & Glowing Crimson Eyes */}
      {/* Left Eye */}
      <path
        d="M38 48 C41 46, 45 47, 47 50 C44 51, 40 50, 38 48 Z"
        fill="#18030E"
      />
      <circle cx="43" cy="48.5" r="2" fill="url(#eyeGrad)" filter="url(#badQaGlow)" />
      <circle cx="43.5" cy="48" r="0.7" fill="#FFFFFF" />

      {/* Right Eye */}
      <path
        d="M62 48 C59 46, 55 47, 53 50 C56 51, 60 50, 62 48 Z"
        fill="#18030E"
      />
      <circle cx="57" cy="48.5" r="2" fill="url(#eyeGrad)" filter="url(#badQaGlow)" />
      <circle cx="56.5" cy="48" r="0.7" fill="#FFFFFF" />

      {/* Sharp Eyebrows */}
      <path d="M37 44 Q42 43 47 46" stroke="#881337" strokeWidth="1.2" strokeLinecap="round" />
      <path d="M63 44 Q58 43 53 46" stroke="#881337" strokeWidth="1.2" strokeLinecap="round" />

      {/* 7. Mischievous Smirk (Dark Lipstick) */}
      <path
        d="M45 61 Q50 64 55 60 C53 62, 48 62, 45 61 Z"
        fill="#BE123C"
      />

      {/* 8. QA Badge / Bug Emblem at Bottom */}
      <g transform="translate(0, 3)">
        <rect x="37" y="76" width="26" height="12" rx="4" fill="#E11D48" stroke="#FDA4AF" strokeWidth="1" />
        <text
          x="50"
          y="85"
          fill="#FFFFFF"
          fontSize="8.5"
          fontWeight="900"
          fontFamily="system-ui, -apple-system, sans-serif"
          textAnchor="middle"
          letterSpacing="0.5"
        >
          BAD QA
        </text>
      </g>
    </svg>
  );
};

// Also export alias BadQaIcon
export const BadQaIcon = DevilWomanIcon;
