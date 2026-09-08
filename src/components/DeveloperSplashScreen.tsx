'use client';

import React, { useEffect, useState } from 'react';
import { ArrowRight, Code2, Crown, Sparkles, Terminal, Zap } from 'lucide-react';
import { KingDeveloperIcon } from './KingDeveloperIcon';

interface DeveloperSplashScreenProps {
  onFinish: () => void;
  durationMs?: number;
  isLightTheme?: boolean;
}

export const DeveloperSplashScreen: React.FC<DeveloperSplashScreenProps> = ({
  onFinish,
  durationMs = 2600,
  isLightTheme = false,
}) => {
  const [progress, setProgress] = useState(0);
  const [isFadingOut, setIsFadingOut] = useState(false);

  useEffect(() => {
    const intervalTime = 40;
    const increment = 100 / (durationMs / intervalTime);

    const timer = setInterval(() => {
      setProgress((prev) => {
        const next = prev + increment;
        if (next >= 100) {
          clearInterval(timer);
          triggerFinish();
          return 100;
        }
        return next;
      });
    }, intervalTime);

    return () => clearInterval(timer);
  }, [durationMs]);

  const triggerFinish = () => {
    setIsFadingOut(true);
    setTimeout(() => {
      onFinish();
    }, 400);
  };

  return (
    <div
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center select-none transition-opacity duration-500 overflow-hidden ${
        isLightTheme ? 'bg-slate-50 text-slate-900' : 'bg-slate-950 text-slate-100'
      } ${isFadingOut ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
    >
      {/* Background Lighting */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] bg-amber-500/15 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] bg-indigo-600/20 rounded-full blur-[90px] pointer-events-none" />

      {/* Grid Pattern */}
      <div
        className="absolute inset-0 opacity-[0.06] pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(to right, ${isLightTheme ? '#000000' : '#ffffff'} 1px, transparent 1px), linear-gradient(to bottom, ${isLightTheme ? '#000000' : '#ffffff'} 1px, transparent 1px)`,
          backgroundSize: '40px 40px',
        }}
      />

      <div className="relative z-10 flex flex-col items-center text-center px-6 max-w-lg w-full">
        {/* Crown Icon */}
        <div className="mb-6 transform transition-transform hover:scale-105 duration-300 shadow-2xl rounded-full p-2 bg-gradient-to-br from-amber-500/20 to-indigo-500/20 border border-amber-500/30">
          <KingDeveloperIcon size={130} />
        </div>

        {/* Badge Header */}
        <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-500 text-xs font-mono font-bold uppercase tracking-widest mb-3 shadow-[0_0_15px_rgba(245,158,11,0.2)]">
          <Crown className="w-4 h-4 text-amber-400 animate-bounce" />
          <span>King of Developer Portal</span>
        </div>

        {/* Banner Text */}
        <div className="space-y-1">
          <h1 className="text-3xl sm:text-4xl font-black tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-indigo-400 to-purple-400 uppercase drop-shadow-[0_2px_15px_rgba(245,158,11,0.4)]">
            King of Developer
          </h1>
          <p className="text-xs font-mono text-indigo-400/90 tracking-widest uppercase">
            Developer Ops • Out Packages • DB Console v2.0
          </p>
        </div>

        {/* Progress Bar Container */}
        <div className="w-full max-w-xs mt-8 space-y-2">
          <div className="h-1.5 w-full bg-slate-800/80 rounded-full overflow-hidden border border-slate-700/60 p-[1px]">
            <div
              className="h-full bg-gradient-to-r from-amber-500 via-indigo-500 to-purple-500 rounded-full transition-all duration-75 ease-out shadow-[0_0_12px_rgba(245,158,11,0.7)]"
              style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 px-1">
            <span className="flex items-center gap-1">
              <Terminal className="w-3.5 h-3.5 text-indigo-400" />
              Loading developer tools...
            </span>
            <span className="font-bold text-amber-400">{Math.round(progress)}%</span>
          </div>
        </div>

        {/* Skip / Enter Button */}
        <button
          onClick={triggerFinish}
          className={`mt-6 flex items-center gap-2 px-5 py-2.5 rounded-xl border text-xs font-bold transition-all shadow-md group ${
            isLightTheme
              ? 'bg-white hover:bg-slate-100 border-slate-300 text-slate-800'
              : 'bg-slate-900/90 hover:bg-slate-800 border-slate-800 text-slate-300 hover:text-white'
          }`}
        >
          <span>Skip to Developer Hub</span>
          <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform text-amber-500" />
        </button>
      </div>

      {/* Footer System Status */}
      <div className="absolute bottom-4 text-center text-[10px] font-mono text-slate-500">
        KING OF DEVELOPER ENVIRONMENT • MOBILE APP MANAGER v2.0
      </div>
    </div>
  );
};
