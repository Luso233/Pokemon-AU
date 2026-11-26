import React from 'react';
import type { SceneBackdropId } from '../types/game';

interface SceneBackdropProps {
  theme: SceneBackdropId;
  className?: string;
}

export const SceneBackdrop: React.FC<SceneBackdropProps> = ({
  theme,
  className = '',
}) => {
  if (theme === 'banquet-hall') {
    return (
      <div
        className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-[#130b24] via-[#1c1030] to-[#080912]" />
        {/* Dramatic violet smoke & crimson emergency glow */}
        <div className="absolute -top-24 left-1/2 h-80 w-[44rem] -translate-x-1/2 rounded-full bg-fuchsia-700/20 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-72 w-96 rounded-full bg-rose-600/15 blur-3xl" />
        <div className="absolute bottom-0 left-0 h-64 w-96 rounded-full bg-indigo-500/15 blur-3xl" />
        {/* Palace Arches Silhouette */}
        <svg
          className="absolute inset-0 h-full w-full opacity-20"
          viewBox="0 0 1200 600"
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id="pillarGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#a855f7" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#0f172a" stopOpacity="0.9" />
            </linearGradient>
          </defs>
          {[80, 320, 560, 800, 1040].map((x) => (
            <g key={x}>
              <rect x={x} y="60" width="52" height="540" fill="url(#pillarGrad)" />
              <path
                d={`M ${x + 52} 140 Q ${x + 146} 30 ${x + 240} 140`}
                stroke="#f59e0b"
                strokeWidth="2"
                fill="none"
                opacity="0.35"
              />
            </g>
          ))}
          {/* Floor perspective grid */}
          <line x1="0" y1="450" x2="1200" y2="450" stroke="#f59e0b" strokeOpacity="0.22" />
          <line x1="0" y1="510" x2="1200" y2="510" stroke="#a855f7" strokeOpacity="0.18" />
        </svg>
      </div>
    );
  }

  // Default: royal-pond (Wyndon Royal Gardens)
  return (
    <div
      className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}
    >
      <div className="absolute inset-0 bg-gradient-to-b from-[#0a1628] via-[#0f243d] to-[#06101c]" />
      {/* Golden twilight sky glow */}
      <div className="absolute -top-20 left-1/3 h-80 w-[40rem] -translate-x-1/2 rounded-full bg-amber-400/15 blur-3xl" />
      <div className="absolute top-1/4 right-1/4 h-72 w-96 rounded-full bg-sky-400/15 blur-3xl" />
      <div className="absolute bottom-0 inset-x-0 h-1/3 bg-gradient-to-t from-sky-950/80 via-cyan-950/35 to-transparent" />

      {/* Wyndon Castle skyline & water ripples */}
      <svg
        className="absolute inset-0 h-full w-full opacity-25"
        viewBox="0 0 1200 600"
        preserveAspectRatio="none"
      >
        {/* Distant royal spires */}
        <path
          d="M0 370 L120 370 L145 250 L170 370 L320 370 L355 180 L390 370 L530 370 L585 110 L640 370 L790 370 L825 210 L860 370 L1020 370 L1055 260 L1090 370 L1200 370 L1200 410 L0 410 Z"
          fill="#020617"
          opacity="0.7"
        />
        {/* Water reflections */}
        <line x1="0" y1="410" x2="1200" y2="410" stroke="#38bdf8" strokeOpacity="0.35" strokeWidth="1.5" />
        <ellipse cx="320" cy="485" rx="180" ry="12" fill="none" stroke="#38bdf8" strokeOpacity="0.22" />
        <ellipse cx="860" cy="465" rx="210" ry="14" fill="none" stroke="#fbbf24" strokeOpacity="0.2" />
        <ellipse cx="600" cy="540" rx="280" ry="16" fill="none" stroke="#38bdf8" strokeOpacity="0.16" />
      </svg>
    </div>
  );
};
