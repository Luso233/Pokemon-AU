import React from 'react';
import {
  Anchor,
  Bomb,
  BookMarked,
  Castle,
  Shield,
  Swords,
} from 'lucide-react';
import type { CharacterId } from '../types/game';

interface CharacterVisualMeta {
  name: string;
  role: string;
  spriteUrl?: string;
  bustUrl?: string;
  accentBorder: string;
  accentGlow: string;
  emblemGradient?: string;
  emblemAccent?: string;
  emblemIcon?: React.FC<{ className?: string }>;
}

export const CHARACTER_META: Record<CharacterId, CharacterVisualMeta> = {
  prince: {
    name: 'Príncipe Heredero',
    role: 'Heredero de la Corona de Galar',
    spriteUrl: '/characters/prince_sprite.png',
    bustUrl: '/characters/prince_bust.png',
    accentBorder: 'border-amber-400/55',
    accentGlow: 'drop-shadow-[0_12px_24px_rgba(251,191,36,0.22)]',
  },
  assassin: {
    name: 'Asesino Carmesí',
    role: 'Cazador de la Corona',
    spriteUrl: '/characters/assassin_sprite.png',
    bustUrl: '/characters/assassin_bust.png',
    accentBorder: 'border-rose-500/55',
    accentGlow: 'drop-shadow-[0_12px_24px_rgba(244,63,94,0.28)]',
  },
  champion: {
    name: 'La Campeona',
    role: 'Soberana Invicta de Galar',
    spriteUrl: '/characters/champion_sprite.png',
    bustUrl: '/characters/champion_bust.png',
    accentBorder: 'border-purple-400/55',
    accentGlow: 'drop-shadow-[0_12px_24px_rgba(192,132,252,0.28)]',
  },
  dock_militia: {
    name: 'Capataz de los Muelles',
    role: 'La Milicia de los Muelles',
    accentBorder: 'border-teal-400/55',
    accentGlow: 'drop-shadow-[0_10px_22px_rgba(45,212,191,0.28)]',
    emblemGradient: 'from-teal-950 via-slate-900 to-cyan-950',
    emblemAccent: 'text-teal-300',
    emblemIcon: Anchor,
  },
  mine_sapper: {
    name: 'Jefe Zapador Rebelde',
    role: 'Escuadrón de Demolición · Minas',
    accentBorder: 'border-orange-400/55',
    accentGlow: 'drop-shadow-[0_10px_22px_rgba(251,146,60,0.3)]',
    emblemGradient: 'from-orange-950 via-stone-900 to-amber-950',
    emblemAccent: 'text-orange-300',
    emblemIcon: Bomb,
  },
  corrupt_captain: {
    name: 'Capitán de la Guardia Corrupta',
    role: 'Fuerza de Choque Traidora',
    accentBorder: 'border-red-500/55',
    accentGlow: 'drop-shadow-[0_10px_22px_rgba(239,68,68,0.3)]',
    emblemGradient: 'from-red-950 via-slate-900 to-zinc-950',
    emblemAccent: 'text-red-300',
    emblemIcon: Shield,
  },
  hammerlocke_duke: {
    name: 'Duque de Hammerlocke',
    role: 'Comandante de la Falange',
    accentBorder: 'border-indigo-400/55',
    accentGlow: 'drop-shadow-[0_10px_22px_rgba(129,140,248,0.3)]',
    emblemGradient: 'from-indigo-950 via-slate-900 to-violet-950',
    emblemAccent: 'text-indigo-300',
    emblemIcon: Castle,
  },
  triad_knights: {
    name: 'Tríada de Élite del Duque',
    role: 'Escavalier · Aegislash · Bisharp',
    accentBorder: 'border-slate-300/55',
    accentGlow: 'drop-shadow-[0_10px_22px_rgba(226,232,240,0.28)]',
    emblemGradient: 'from-slate-800 via-zinc-900 to-slate-950',
    emblemAccent: 'text-amber-300',
    emblemIcon: Swords,
  },
  royal_archivist: {
    name: 'El Archivista Real',
    role: 'Custodio de la Reliquia de Silph Co.',
    accentBorder: 'border-emerald-400/55',
    accentGlow: 'drop-shadow-[0_10px_22px_rgba(52,211,153,0.28)]',
    emblemGradient: 'from-emerald-950 via-slate-900 to-teal-950',
    emblemAccent: 'text-emerald-300',
    emblemIcon: BookMarked,
  },
};

interface CharacterPortraitProps {
  charId: CharacterId;
  variant?: 'sprite' | 'bust';
  className?: string;
  flipHorizontal?: boolean;
}

export const CharacterPortrait: React.FC<CharacterPortraitProps> = ({
  charId,
  variant = 'sprite',
  className = '',
  flipHorizontal = false,
}) => {
  const meta = CHARACTER_META[charId] ?? CHARACTER_META.prince;
  const src = variant === 'bust' ? meta.bustUrl : meta.spriteUrl;

  if (src) {
    return (
      <img
        src={src}
        alt={meta.name}
        draggable={false}
        className={`select-none object-contain ${meta.accentGlow} ${
          flipHorizontal ? '-scale-x-100' : ''
        } ${className}`}
      />
    );
  }

  const EmblemIcon = meta.emblemIcon ?? Shield;

  if (variant === 'bust') {
    return (
      <div
        className={`flex h-full w-full items-center justify-center rounded-full bg-gradient-to-br ${meta.emblemGradient ?? 'from-slate-800 to-slate-950'} ${className}`}
        title={`${meta.name} — ${meta.role}`}
      >
        <EmblemIcon className={`h-5 w-5 ${meta.emblemAccent ?? 'text-amber-300'}`} />
      </div>
    );
  }

  return (
    <div
      className={`flex flex-col items-center justify-end pb-4 ${meta.accentGlow} ${className}`}
    >
      <div
        className={`flex h-48 w-40 flex-col items-center justify-center rounded-3xl border-2 bg-gradient-to-b px-4 text-center shadow-2xl backdrop-blur-md sm:h-60 sm:w-48 ${meta.accentBorder} ${meta.emblemGradient ?? 'from-slate-800 to-slate-950'}`}
      >
        <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-2xl border border-white/15 bg-black/35 shadow-inner">
          <EmblemIcon
            className={`h-9 w-9 ${meta.emblemAccent ?? 'text-amber-300'}`}
          />
        </div>
        <p className="font-display text-sm font-extrabold text-white">
          {meta.name}
        </p>
        <p className="mt-1 text-[10px] font-semibold uppercase tracking-wider text-slate-300/80">
          {meta.role}
        </p>
      </div>
    </div>
  );
};
