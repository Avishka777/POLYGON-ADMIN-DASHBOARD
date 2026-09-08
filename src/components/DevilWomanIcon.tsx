import React from 'react';

interface DevilWomanIconProps {
  className?: string;
  size?: number;
  isBouncing?: boolean;
}

export const DevilWomanIcon: React.FC<DevilWomanIconProps> = ({
  className = '',
  size = 180,
  isBouncing = false,
}) => {
  return (
    <div
      className={`relative flex items-center justify-center select-none ${
        isBouncing ? 'animate-[bounce_1.5s_infinite]' : ''
      } ${className}`}
      style={{ width: size, height: size }}
    >
      {/* Background Glow Lighting */}
      <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-rose-600/60 via-red-600/50 to-purple-700/60 blur-2xl animate-pulse" />
      <div className="absolute -inset-2 rounded-full bg-gradient-to-r from-rose-500 via-red-600 to-amber-500 opacity-80 blur-lg" />

      {/* Outer Glowing Ring */}
      <div className="absolute -inset-1 rounded-full border-4 border-rose-500/80 shadow-[0_0_30px_rgba(244,63,94,0.9)] animate-pulse pointer-events-none z-20" />

      {/* Main Image Avatar Container */}
      <div className="w-full h-full rounded-full overflow-hidden border-4 border-rose-500 shadow-2xl relative z-10 bg-slate-950 flex items-center justify-center">
        <img
          src="/bad-qa.jpeg"
          alt="Bad QA Avatar"
          className="w-full h-full object-cover object-center transform scale-110 hover:scale-125 transition-transform duration-300"
        />
      </div>
    </div>
  );
};
