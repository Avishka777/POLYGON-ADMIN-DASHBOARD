import React from 'react';

interface DevilWomanIconProps {
  className?: string;
  size?: number;
}

export const DevilWomanIcon: React.FC<DevilWomanIconProps> = ({
  className = '',
  size = 120,
}) => {
  return (
    <div
      className={`relative flex items-center justify-center ${className}`}
      style={{ width: size, height: size }}
    >
      {/* Background glow effects */}
      <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-rose-600/40 via-red-600/30 to-purple-700/40 blur-xl animate-pulse" />
      <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-rose-500 via-red-600 to-amber-500 opacity-60 blur-sm" />

      {/* SVG Container */}
      <svg
        viewBox="0 0 200 200"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full relative z-10 drop-shadow-[0_0_25px_rgba(225,29,72,0.8)]"
      >
        <defs>
          <linearGradient id="hornGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ff0055" />
            <stop offset="50%" stopColor="#c00028" />
            <stop offset="100%" stopColor="#4a0011" />
          </linearGradient>

          <linearGradient id="skinGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#ffe4e6" />
            <stop offset="100%" stopColor="#fda4af" />
          </linearGradient>

          <linearGradient id="hairGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#1e1b4b" />
            <stop offset="50%" stopColor="#4c0519" />
            <stop offset="100%" stopColor="#0f172a" />
          </linearGradient>

          <linearGradient id="eyeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#ff0055" />
            <stop offset="100%" stopColor="#ff3366" />
          </linearGradient>

          <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Outer Circular Frame */}
        <circle
          cx="100"
          cy="100"
          r="92"
          stroke="url(#hornGrad)"
          strokeWidth="3.5"
          className="animate-spin-slow"
          strokeDasharray="14 6"
        />
        <circle cx="100" cy="100" r="86" fill="#09050d" />

        {/* Devil Horns */}
        {/* Left Horn */}
        <path
          d="M 68 85 C 55 60 40 30 18 36 C 28 58 48 95 62 102 Z"
          fill="url(#hornGrad)"
          filter="url(#glow)"
        />
        <path
          d="M 68 85 C 57 65 42 42 22 40 C 30 58 48 88 62 102 Z"
          fill="#ff4d6d"
          opacity="0.6"
        />

        {/* Right Horn */}
        <path
          d="M 132 85 C 145 60 160 30 182 36 C 172 58 152 95 138 102 Z"
          fill="url(#hornGrad)"
          filter="url(#glow)"
        />
        <path
          d="M 132 85 C 143 65 158 42 178 40 C 170 58 152 88 138 102 Z"
          fill="#ff4d6d"
          opacity="0.6"
        />

        {/* Back Hair */}
        <path
          d="M 50 95 C 40 130 50 170 70 185 C 100 190 130 185 150 170 C 160 130 150 95 150 95 Z"
          fill="url(#hairGrad)"
        />

        {/* Neck and Shoulders */}
        <path
          d="M 85 155 L 75 190 L 125 190 L 115 155 Z"
          fill="url(#skinGrad)"
        />
        {/* Collar / Choker with Ruby */}
        <path d="M 86 160 Q 100 166 114 160 L 115 167 Q 100 173 85 167 Z" fill="#0f172a" />
        <polygon points="100,163 105,168 100,173 95,168" fill="#e11d48" filter="url(#glow)" />

        {/* Face Silhouette */}
        <path
          d="M 70 95 C 70 65 130 65 130 95 C 130 128 115 155 100 155 C 85 155 70 128 70 95 Z"
          fill="url(#skinGrad)"
        />

        {/* Side / Bangs Hair */}
        <path
          d="M 68 85 C 65 110 60 145 75 160 C 70 135 78 110 78 95 C 82 85 92 78 100 78 C 108 78 118 85 122 95 C 122 110 130 135 125 160 C 140 145 135 110 132 85 C 125 65 75 65 68 85 Z"
          fill="url(#hairGrad)"
        />

        {/* Devil Eyebrows */}
        <path d="M 78 102 Q 88 95 95 102" stroke="#be123c" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M 122 102 Q 112 95 105 102" stroke="#be123c" strokeWidth="2.5" strokeLinecap="round" />

        {/* Fierce Glowing Eyes */}
        <path
          d="M 78 110 Q 87 104 95 112 Q 87 118 78 110 Z"
          fill="#111827"
        />
        <circle cx="87" cy="111" r="3.5" fill="url(#eyeGrad)" filter="url(#glow)" />
        <circle cx="88" cy="110" r="1" fill="#ffffff" />

        <path
          d="M 122 110 Q 113 104 105 112 Q 113 118 122 110 Z"
          fill="#111827"
        />
        <circle cx="113" cy="111" r="3.5" fill="url(#eyeGrad)" filter="url(#glow)" />
        <circle cx="112" cy="110" r="1" fill="#ffffff" />

        {/* Eyelash Wings */}
        <path d="M 76 109 L 71 106" stroke="#991b1b" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M 124 109 L 129 106" stroke="#991b1b" strokeWidth="1.5" strokeLinecap="round" />

        {/* Nose */}
        <path d="M 98 120 L 100 126 L 102 125" stroke="#f43f5e" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />

        {/* Smirking Devil Lips with Tiny Fang */}
        <path
          d="M 90 137 Q 100 144 110 137 Q 100 148 90 137 Z"
          fill="#e11d48"
        />
        {/* Tiny Fang */}
        <polygon points="94,138 97,143 98,138" fill="#ffffff" />

        {/* Little Devil Cheek Markings */}
        <path d="M 75 125 L 72 128 M 75 129 L 72 132" stroke="#f43f5e" strokeWidth="1.5" strokeLinecap="round" opacity="0.7" />
        <path d="M 125 125 L 128 128 M 125 129 L 128 132" stroke="#f43f5e" strokeWidth="1.5" strokeLinecap="round" opacity="0.7" />

        {/* Tiny Inverted Star / Pentagram Forehead Tattoo */}
        <path
          d="M 100 88 L 101.5 92 L 105 92 L 102 94.5 L 103.5 98.5 L 100 96 L 96.5 98.5 L 98 94.5 L 95 92 L 98.5 92 Z"
          fill="#ff0055"
          opacity="0.8"
        />
      </svg>
    </div>
  );
};
