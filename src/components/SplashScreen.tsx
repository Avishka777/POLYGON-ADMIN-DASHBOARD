'use client';

import React, { useEffect, useState } from 'react';
import { ArrowRight, Flame, ShieldAlert, Sparkles, Zap } from 'lucide-react';
import { DevilWomanIcon } from './DevilWomanIcon';

interface SplashScreenProps {
  onFinish: () => void;
  durationMs?: number;
  isLightTheme?: boolean;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({
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
      {/* Background Cyber/Hellfire Atmospheric Lighting */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[650px] bg-rose-600/30 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[450px] h-[450px] bg-red-600/35 rounded-full blur-[100px] pointer-events-none" />

      {/* Grid Pattern Background */}
      <div
        className="absolute inset-0 opacity-[0.07] pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(to right, ${isLightTheme ? '#000000' : '#ffffff'} 1px, transparent 1px), linear-gradient(to bottom, ${isLightTheme ? '#000000' : '#ffffff'} 1px, transparent 1px)`,
          backgroundSize: '40px 40px',
        }}
      />

      <div className="relative z-10 flex flex-col items-center text-center px-6 max-w-lg w-full">
        {/* BIG BOUNCING BAD QA ICON */}
        <div className="mb-6 transform transition-transform animate-[bounce_1.4s_infinite] drop-shadow-[0_15px_35px_rgba(244,63,94,0.6)]">
          <DevilWomanIcon size={220} isBouncing={false} />
        </div>

        {/* Badge Header */}
        <div className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-red-950/80 border border-red-500/40 text-red-400 text-xs font-mono font-bold uppercase tracking-widest mb-3 shadow-[0_0_15px_rgba(239,68,68,0.4)]">
          <Flame className="w-4 h-4 text-rose-500 animate-pulse" />
          <span>Napuru QA Access Portal</span>
        </div>

        {/* Banner Text */}
        <div className="space-y-1">
          <h1 className="text-3xl sm:text-4xl font-black tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-rose-400 via-red-300 to-amber-300 uppercase drop-shadow-[0_2px_15px_rgba(244,63,94,0.6)]">
            For Napuru QA Team
          </h1>
          <p className="text-xs font-mono text-rose-300/80 tracking-widest uppercase">
            Mobile App Manager • QA Test & Release Portal
          </p>
        </div>

        {/* Progress Bar Container */}
        <div className="w-full max-w-xs mt-8 space-y-2">
          <div className="h-2 w-full bg-slate-900/90 rounded-full overflow-hidden border border-slate-800 p-[1px]">
            <div
              className="h-full bg-gradient-to-r from-rose-600 via-red-500 to-amber-400 rounded-full transition-all duration-75 ease-out shadow-[0_0_15px_rgba(244,63,94,0.9)]"
              style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 px-1">
            <span className="flex items-center gap-1 text-slate-400">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              Initializing QA modules...
            </span>
            <span className="font-semibold text-rose-400">{Math.round(progress)}%</span>
          </div>
        </div>

        {/* Skip / Enter Button */}
        <button
          onClick={triggerFinish}
          className={`mt-6 flex items-center gap-2 px-6 py-2.5 rounded-xl border text-xs font-bold transition-all shadow-md group ${
            isLightTheme
              ? 'bg-white hover:bg-slate-100 border-slate-300 text-slate-800'
              : 'bg-slate-900/90 hover:bg-slate-800 border-slate-800 text-slate-300 hover:text-white'
          }`}
        >
          <span>Skip to QA Hub</span>
          <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform text-rose-400" />
        </button>
      </div>

      {/* Footer System Status */}
      <div className="absolute bottom-4 text-center text-[10px] font-mono text-slate-500">
        NAPURU QA ENVIRONMENT • MOBILE APP MANAGER v2.0
      </div>
    </div>
  );
};
