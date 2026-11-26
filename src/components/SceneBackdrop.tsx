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
  if (theme === 'wyndon-docks') {
    return (
      <div
        className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-[#04141d] via-[#0a2230] to-[#040911]" />
        <div className="absolute top-0 left-1/4 h-80 w-96 rounded-full bg-teal-400/18 blur-[110px]" />
        <div className="absolute bottom-0 right-1/4 h-72 w-96 rounded-full bg-amber-500/14 blur-[100px]" />
        <svg
          className="absolute inset-0 h-full w-full opacity-25"
          viewBox="0 0 1200 600"
          preserveAspectRatio="none"
        >
          <path d="M0 440 L1200 440" stroke="#2dd4bf" strokeOpacity="0.4" strokeWidth="3" />
          <path d="M120 440 L200 180 L380 180" fill="none" stroke="#94a3b8" strokeOpacity="0.4" strokeWidth="4" />
          <path d="M1080 440 L1000 180 L820 180" fill="none" stroke="#94a3b8" strokeOpacity="0.4" strokeWidth="4" />
          <ellipse cx="600" cy="495" rx="460" ry="38" fill="none" stroke="#2dd4bf" strokeOpacity="0.3" strokeWidth="2" />
        </svg>
      </div>
    );
  }

  if (theme === 'galar-mines') {
    return (
      <div
        className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-[#1a0d07] via-[#171110] to-[#080607]" />
        <div className="absolute top-0 left-1/2 h-80 w-[40rem] -translate-x-1/2 rounded-full bg-orange-500/20 blur-[110px]" />
        <div className="absolute bottom-0 right-1/4 h-72 w-96 rounded-full bg-red-600/18 blur-[100px]" />
        <svg
          className="absolute inset-0 h-full w-full opacity-28"
          viewBox="0 0 1200 600"
          preserveAspectRatio="none"
        >
          {[140, 320, 500].map((r, i) => (
            <path
              key={i}
              d={`M${600 - r} 520 L${600 - r} 220 Q600 ${80 + i * 25} ${600 + r} 220 L${600 + r} 520`}
              fill="none"
              stroke="#fb923c"
              strokeOpacity="0.32"
              strokeWidth="4"
            />
          ))}
          <line x1="360" y1="580" x2="540" y2="390" stroke="#a8a29e" strokeOpacity="0.4" strokeWidth="3" />
          <line x1="840" y1="580" x2="660" y2="390" stroke="#a8a29e" strokeOpacity="0.4" strokeWidth="3" />
        </svg>
      </div>
    );
  }

  if (theme === 'hammerlocke-field') {
    return (
      <div
        className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-[#0d102b] via-[#131c3d] to-[#070a14]" />
        <div className="absolute -top-20 left-1/3 h-80 w-[44rem] -translate-x-1/2 rounded-full bg-indigo-500/22 blur-[110px]" />
        <div className="absolute bottom-0 right-1/4 h-72 w-96 rounded-full bg-amber-400/15 blur-[100px]" />
        <svg
          className="absolute inset-0 h-full w-full opacity-28"
          viewBox="0 0 1200 600"
          preserveAspectRatio="none"
        >
          {/* 3-lane Triples military formation grid */}
          <line x1="400" y1="180" x2="320" y2="560" stroke="#818cf8" strokeOpacity="0.35" strokeDasharray="8 6" strokeWidth="2" />
          <line x1="800" y1="180" x2="880" y2="560" stroke="#818cf8" strokeOpacity="0.35" strokeDasharray="8 6" strokeWidth="2" />
          <ellipse cx="600" cy="445" rx="500" ry="72" fill="none" stroke="#fbbf24" strokeOpacity="0.35" strokeWidth="2" />
        </svg>
      </div>
    );
  }

  if (theme === 'triad-arena') {
    return (
      <div
        className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-[#171226] via-[#1a1524] to-[#08070e]" />
        <div className="absolute top-0 left-1/2 h-80 w-[42rem] -translate-x-1/2 rounded-full bg-amber-500/20 blur-[110px]" />
        <div className="absolute bottom-0 left-1/4 h-72 w-80 rounded-full bg-rose-500/18 blur-[100px]" />
        <svg
          className="absolute inset-0 h-full w-full opacity-28"
          viewBox="0 0 1200 600"
          preserveAspectRatio="none"
        >
          <polygon points="600,90 960,490 240,490" fill="none" stroke="#fbbf24" strokeOpacity="0.35" strokeWidth="2.5" />
          <circle cx="600" cy="360" r="145" fill="none" stroke="#e2e8f0" strokeOpacity="0.25" strokeWidth="2" />
        </svg>
      </div>
    );
  }

  if (theme === 'silph-archive') {
    return (
      <div
        className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-[#041712] via-[#07241e] to-[#030b0a]" />
        <div className="absolute -top-24 left-1/2 h-80 w-[44rem] -translate-x-1/2 rounded-full bg-emerald-400/20 blur-[110px]" />
        <div className="absolute bottom-0 right-1/4 h-72 w-96 rounded-full bg-teal-500/18 blur-[100px]" />
        <svg
          className="absolute inset-0 h-full w-full opacity-25"
          viewBox="0 0 1200 600"
          preserveAspectRatio="none"
        >
          {/* Retro Gen 1 CRT phosphor grid */}
          {Array.from({ length: 12 }).map((_, i) => (
            <line key={`h-${i}`} x1="0" y1={i * 52} x2="1200" y2={i * 52} stroke="#34d399" strokeOpacity="0.22" strokeWidth="1" />
          ))}
          {Array.from({ length: 16 }).map((_, i) => (
            <line key={`v-${i}`} x1={i * 80} y1="0" x2={i * 80} y2="600" stroke="#34d399" strokeOpacity="0.16" strokeWidth="1" />
          ))}
          <ellipse cx="600" cy="450" rx="410" ry="48" fill="none" stroke="#6ee7b7" strokeOpacity="0.45" strokeWidth="2.5" />
        </svg>
      </div>
    );
  }

  if (theme === 'vgc-worlds-stage') {
    return (
      <div
        className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-[#160b2c] via-[#0c1d3a] to-[#060a14]" />
        <div className="absolute -top-24 left-1/3 h-80 w-[44rem] -translate-x-1/2 rounded-full bg-rose-500/20 blur-[110px]" />
        <div className="absolute top-1/4 right-1/4 h-72 w-96 rounded-full bg-sky-400/20 blur-[100px]" />
        <div className="absolute bottom-0 left-1/2 h-64 w-[48rem] -translate-x-1/2 rounded-full bg-amber-400/12 blur-[90px]" />
        <svg
          className="absolute inset-0 h-full w-full opacity-30"
          viewBox="0 0 1200 600"
          preserveAspectRatio="none"
        >
          {/* Championship stadium arena rings */}
          <ellipse cx="600" cy="430" rx="490" ry="95" fill="none" stroke="#38bdf8" strokeOpacity="0.4" strokeWidth="2.5" />
          <ellipse cx="600" cy="430" rx="220" ry="44" fill="none" stroke="#fbbf24" strokeOpacity="0.5" strokeWidth="2.5" />
          <circle cx="600" cy="430" r="36" fill="none" stroke="#f43f5e" strokeOpacity="0.5" strokeWidth="2" />
          <line x1="110" y1="430" x2="1090" y2="430" stroke="#e2e8f0" strokeOpacity="0.22" strokeWidth="1.5" />
          {/* Overhead broadcast spotlights */}
          <polygon points="180,0 440,340 310,340" fill="#38bdf8" fillOpacity="0.08" />
          <polygon points="1020,0 760,340 890,340" fill="#f43f5e" fillOpacity="0.08" />
        </svg>
      </div>
    );
  }

  if (theme === 'honor-duel-hall') {
    return (
      <div
        className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-[#1a0d16] via-[#121226] to-[#06070f]" />
        <div className="absolute top-0 left-1/2 h-80 w-[40rem] -translate-x-1/2 rounded-full bg-amber-400/18 blur-[110px]" />
        <div className="absolute bottom-0 right-1/4 h-72 w-80 rounded-full bg-rose-600/18 blur-[95px]" />
        <svg
          className="absolute inset-0 h-full w-full opacity-25"
          viewBox="0 0 1200 600"
          preserveAspectRatio="none"
        >
          <ellipse cx="600" cy="475" rx="340" ry="42" fill="none" stroke="#fbbf24" strokeOpacity="0.55" strokeWidth="3" />
          <line x1="600" y1="80" x2="600" y2="520" stroke="#fbbf24" strokeOpacity="0.18" strokeDasharray="6 6" />
        </svg>
      </div>
    );
  }

  if (theme === 'banner-battlefield') {
    return (
      <div
        className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-[#0b1320] via-[#141b2c] to-[#070a12]" />
        <div className="absolute top-0 left-1/4 h-80 w-96 rounded-full bg-slate-300/14 blur-[100px]" />
        <div className="absolute bottom-0 right-1/4 h-80 w-96 rounded-full bg-purple-700/20 blur-[100px]" />
        <svg
          className="absolute inset-0 h-full w-full opacity-25"
          viewBox="0 0 1200 600"
          preserveAspectRatio="none"
        >
          <path d="M120 80 L220 80 L220 340 L170 300 L120 340 Z" fill="#94a3b8" fillOpacity="0.35" />
          <path d="M980 80 L1080 80 L1080 340 L1030 300 L980 340 Z" fill="#7c3aed" fillOpacity="0.35" />
          <line x1="0" y1="455" x2="1200" y2="455" stroke="#94a3b8" strokeOpacity="0.28" />
        </svg>
      </div>
    );
  }

  if (theme === 'sunlit-courtyard') {
    return (
      <div
        className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-[#2a1205] via-[#1c0c0a] to-[#08070d]" />
        <div className="absolute -top-20 left-1/2 h-80 w-[44rem] -translate-x-1/2 rounded-full bg-amber-500/25 blur-[110px]" />
        <div className="absolute bottom-0 right-1/4 h-72 w-96 rounded-full bg-orange-600/20 blur-[100px]" />
        <svg
          className="absolute inset-0 h-full w-full opacity-25"
          viewBox="0 0 1200 600"
          preserveAspectRatio="none"
        >
          <circle cx="600" cy="90" r="95" fill="#fbbf24" fillOpacity="0.25" />
          <circle cx="600" cy="90" r="145" fill="none" stroke="#f97316" strokeOpacity="0.35" strokeWidth="2" />
          <ellipse cx="600" cy="480" rx="460" ry="44" fill="none" stroke="#fbbf24" strokeOpacity="0.35" strokeWidth="2" />
          <line x1="0" y1="440" x2="1200" y2="440" stroke="#f59e0b" strokeOpacity="0.22" />
        </svg>
      </div>
    );
  }

  if (theme === 'royal-training-ground') {
    return (
      <div
        className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-[#170e29] via-[#1b1433] to-[#090915]" />
        <div className="absolute -top-24 left-1/3 h-80 w-[42rem] -translate-x-1/2 rounded-full bg-amber-400/18 blur-[110px]" />
        <div className="absolute bottom-0 right-1/4 h-72 w-96 rounded-full bg-purple-500/20 blur-[100px]" />
        <svg
          className="absolute inset-0 h-full w-full opacity-25"
          viewBox="0 0 1200 600"
          preserveAspectRatio="none"
        >
          <path d="M80 460 L80 180 Q240 80 400 180 L400 460" fill="none" stroke="#fbbf24" strokeOpacity="0.3" strokeWidth="2.5" />
          <path d="M800 460 L800 180 Q960 80 1120 180 L1120 460" fill="none" stroke="#c084fc" strokeOpacity="0.3" strokeWidth="2.5" />
          <ellipse cx="600" cy="490" rx="430" ry="42" fill="none" stroke="#fbbf24" strokeOpacity="0.35" strokeWidth="2" />
          <line x1="600" y1="448" x2="600" y2="532" stroke="#c084fc" strokeOpacity="0.25" strokeWidth="2" />
        </svg>
      </div>
    );
  }

  if (theme === 'wyndon-alleys') {
    return (
      <div
        className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-[#060b18] via-[#0c162b] to-[#050811]" />
        {/* Warm amber streetlamp glow & crimson menace on right */}
        <div className="absolute top-12 left-1/4 h-72 w-72 rounded-full bg-amber-500/14 blur-[90px]" />
        <div className="absolute bottom-10 right-1/5 h-80 w-80 rounded-full bg-rose-700/18 blur-[100px]" />
        {/* Rainy alleyway silhouettes + rain streaks */}
        <svg
          className="absolute inset-0 h-full w-full opacity-30"
          viewBox="0 0 1200 600"
          preserveAspectRatio="none"
        >
          {/* Narrow alley walls converging */}
          <polygon points="0,0 320,120 320,440 0,600" fill="#020617" opacity="0.85" />
          <polygon points="1200,0 880,120 880,440 1200,600" fill="#020617" opacity="0.85" />
          {/* Streetlamp posts */}
          <line x1="250" y1="160" x2="250" y2="480" stroke="#fbbf24" strokeOpacity="0.35" strokeWidth="3" />
          <circle cx="250" cy="160" r="14" fill="#fbbf24" fillOpacity="0.45" />
          <line x1="950" y1="160" x2="950" y2="480" stroke="#fb7185" strokeOpacity="0.3" strokeWidth="3" />
          <circle cx="950" cy="160" r="12" fill="#fb7185" fillOpacity="0.35" />
          {/* Diagonal rain streaks */}
          {Array.from({ length: 24 }).map((_, i) => (
            <line
              key={i}
              x1={i * 55}
              y1={0}
              x2={i * 55 - 80}
              y2={600}
              stroke="#93c5fd"
              strokeOpacity="0.16"
              strokeWidth="1"
            />
          ))}
          {/* Wet cobblestones */}
          <line x1="0" y1="455" x2="1200" y2="455" stroke="#38bdf8" strokeOpacity="0.22" />
          <line x1="0" y1="515" x2="1200" y2="515" stroke="#fbbf24" strokeOpacity="0.18" />
        </svg>
      </div>
    );
  }

  if (theme === 'clocktower-ruins') {
    return (
      <div
        className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-[#0b0c1e] via-[#131730] to-[#060913]" />
        {/* Storm lightning & moonlit clockface */}
        <div className="absolute -top-24 left-1/2 h-96 w-[44rem] -translate-x-1/2 rounded-full bg-amber-400/14 blur-[110px]" />
        <div className="absolute bottom-0 right-0 h-80 w-96 rounded-full bg-rose-600/16 blur-[100px]" />
        <div className="absolute bottom-0 left-0 h-72 w-96 rounded-full bg-sky-500/12 blur-[100px]" />
        <svg
          className="absolute inset-0 h-full w-full opacity-25"
          viewBox="0 0 1200 600"
          preserveAspectRatio="none"
        >
          {/* Clocktower giant face silhouette */}
          <circle cx="600" cy="210" r="125" fill="none" stroke="#fbbf24" strokeOpacity="0.4" strokeWidth="3" />
          <circle cx="600" cy="210" r="106" fill="none" stroke="#fbbf24" strokeOpacity="0.22" strokeWidth="1.5" />
          <line x1="600" y1="210" x2="600" y2="128" stroke="#fbbf24" strokeOpacity="0.5" strokeWidth="4" />
          <line x1="600" y1="210" x2="665" y2="230" stroke="#fbbf24" strokeOpacity="0.5" strokeWidth="3" />
          {/* Ruined stone arches */}
          <path d="M60 470 L60 220 Q180 120 300 220 L300 470" fill="none" stroke="#94a3b8" strokeOpacity="0.28" strokeWidth="3" />
          <path d="M900 470 L900 220 Q1020 120 1140 220 L1140 470" fill="none" stroke="#94a3b8" strokeOpacity="0.28" strokeWidth="3" />
          {/* Battle arena stone circle */}
          <ellipse cx="600" cy="490" rx="440" ry="44" fill="none" stroke="#fbbf24" strokeOpacity="0.28" strokeWidth="2" />
          <ellipse cx="600" cy="490" rx="280" ry="26" fill="none" stroke="#fb7185" strokeOpacity="0.2" strokeWidth="1.5" />
        </svg>
      </div>
    );
  }

  if (theme === 'aqueduct-tunnels') {
    return (
      <div
        className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-[#05131f] via-[#092136] to-[#040d17]" />
        <div className="absolute top-1/4 left-1/3 h-80 w-96 rounded-full bg-cyan-400/14 blur-[100px]" />
        <div className="absolute bottom-0 right-1/4 h-72 w-96 rounded-full bg-emerald-500/12 blur-[100px]" />
        <svg
          className="absolute inset-0 h-full w-full opacity-25"
          viewBox="0 0 1200 600"
          preserveAspectRatio="none"
        >
          {[140, 340, 540].map((r, i) => (
            <ellipse
              key={i}
              cx="600"
              cy="340"
              rx={r}
              ry={r * 0.62}
              fill="none"
              stroke="#38bdf8"
              strokeOpacity="0.28"
              strokeWidth="2"
            />
          ))}
          <line x1="0" y1="450" x2="1200" y2="450" stroke="#22d3ee" strokeOpacity="0.35" strokeWidth="2" />
          <ellipse cx="420" cy="510" rx="180" ry="10" fill="none" stroke="#38bdf8" strokeOpacity="0.25" />
          <ellipse cx="790" cy="535" rx="210" ry="12" fill="none" stroke="#34d399" strokeOpacity="0.22" />
        </svg>
      </div>
    );
  }

  if (theme === 'banquet-hall') {
    return (
      <div
        className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-[#130b24] via-[#1c1030] to-[#080912]" />
        <div className="absolute -top-24 left-1/2 h-80 w-[44rem] -translate-x-1/2 rounded-full bg-fuchsia-700/20 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-72 w-96 rounded-full bg-rose-600/15 blur-3xl" />
        <div className="absolute bottom-0 left-0 h-64 w-96 rounded-full bg-indigo-500/15 blur-3xl" />
        <svg
          className="absolute inset-0 h-full w-full opacity-20"
          viewBox="0 0 1200 600"
          preserveAspectRatio="none"
        >
          {[80, 320, 560, 800, 1040].map((x) => (
            <g key={x}>
              <rect x={x} y="60" width="52" height="540" fill="#312e81" opacity="0.55" />
              <path
                d={`M ${x + 52} 140 Q ${x + 146} 30 ${x + 240} 140`}
                stroke="#f59e0b"
                strokeWidth="2"
                fill="none"
                opacity="0.35"
              />
            </g>
          ))}
          <line x1="0" y1="450" x2="1200" y2="450" stroke="#f59e0b" strokeOpacity="0.22" />
        </svg>
      </div>
    );
  }

  return (
    <div
      className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}
    >
      <div className="absolute inset-0 bg-gradient-to-b from-[#0a1628] via-[#0f243d] to-[#06101c]" />
      <div className="absolute -top-20 left-1/3 h-80 w-[40rem] -translate-x-1/2 rounded-full bg-amber-400/15 blur-3xl" />
    </div>
  );
};
