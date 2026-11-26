import React from 'react';
import {
  Anchor,
  Bomb,
  BookMarked,
  Castle,
  Flame,
  Landmark,
  MoonStar,
  Shield,
  Swords,
  Zap,
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

const ASSET_BASE = import.meta.env.BASE_URL || '/';
const charAsset = (file: string) => `${ASSET_BASE}characters/${file}`;

export const CHARACTER_META: Record<CharacterId, CharacterVisualMeta> = {
  prince: {
    name: 'Príncipe Heredero',
    role: 'Heredero de la Corona de Galar',
    spriteUrl: charAsset('prince_sprite.png'),
    bustUrl: charAsset('prince_bust.png'),
    accentBorder: 'border-amber-400/55',
    accentGlow: 'drop-shadow-[0_12px_24px_rgba(251,191,36,0.22)]',
  },
  assassin: {
    name: 'Asesino Carmesí',
    role: 'Cazador de la Corona',
    spriteUrl: charAsset('assassin_sprite.png'),
    bustUrl: charAsset('assassin_bust.png'),
    accentBorder: 'border-rose-500/55',
    accentGlow: 'drop-shadow-[0_12px_24px_rgba(244,63,94,0.28)]',
  },
  champion: {
    name: 'La Campeona',
    role: 'Soberana Invicta de Galar',
    spriteUrl: charAsset('champion_sprite.png'),
    bustUrl: charAsset('champion_bust.png'),
    accentBorder: 'border-purple-400/55',
    accentGlow: 'drop-shadow-[0_12px_24px_rgba(192,132,252,0.28)]',
  },
  dark_commander: {
    name: 'Comandante Siniestro',
    role: 'Casa Rebelde del Estandarte Oscuro',
    spriteUrl: charAsset('dark_commander_sprite.png'),
    bustUrl: charAsset('dark_commander_bust.png'),
    accentBorder: 'border-slate-400/60',
    accentGlow: 'drop-shadow-[0_12px_24px_rgba(148,163,184,0.3)]',
  },
  rat_saboteur: {
    name: 'El Hombre Rata',
    role: 'Saboteador del Banquete · Sin Reglas',
    spriteUrl: charAsset('rat_saboteur_sprite.png'),
    bustUrl: charAsset('rat_saboteur_bust.png'),
    accentBorder: 'border-rose-500/60',
    accentGlow: 'drop-shadow-[0_12px_24px_rgba(244,63,94,0.34)]',
  },
  court_duelist: {
    name: 'La Duelista de la Frontera',
    role: 'Guerrera Insumisa · Duelo a Muerte 1v1',
    spriteUrl: charAsset('court_duelist_sprite.png'),
    bustUrl: charAsset('court_duelist_bust.png'),
    accentBorder: 'border-rose-400/60',
    accentGlow: 'drop-shadow-[0_12px_24px_rgba(251,113,133,0.32)]',
  },
  solar_strategist: {
    name: 'El Estratega Solar',
    role: 'Tirano del Ladder OU · Cabina VR',
    spriteUrl: charAsset('solar_strategist_sprite.png'),
    bustUrl: charAsset('solar_strategist_bust.png'),
    accentBorder: 'border-orange-400/65',
    accentGlow: 'drop-shadow-[0_12px_24px_rgba(251,146,60,0.34)]',
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
    name: 'Tríada de Élite (Caín · Abel · Frey)',
    role: 'Escavalier · Aegislash · Bisharp',
    spriteUrl: charAsset('triad_knights_sprite.png'),
    bustUrl: charAsset('triad_knights_bust.png'),
    accentBorder: 'border-amber-300/60',
    accentGlow: 'drop-shadow-[0_12px_26px_rgba(251,191,36,0.3)]',
  },
  knight_cain: {
    name: 'Sir Caín «El Toro Carmesí»',
    role: 'Lanza Roja · Compañero de Escavalier',
    spriteUrl: charAsset('triad_knights_sprite.png'),
    bustUrl: charAsset('knight_cain_bust.png'),
    accentBorder: 'border-rose-400/65',
    accentGlow: 'drop-shadow-[0_12px_24px_rgba(244,63,94,0.34)]',
  },
  knight_abel: {
    name: 'Sir Abel «El Muro Esmeralda»',
    role: 'Escudo Central · Compañero de Aegislash',
    spriteUrl: charAsset('triad_knights_sprite.png'),
    bustUrl: charAsset('knight_abel_bust.png'),
    accentBorder: 'border-emerald-400/65',
    accentGlow: 'drop-shadow-[0_12px_24px_rgba(52,211,153,0.32)]',
  },
  knight_frey: {
    name: 'Sir Frey «La Hoja Siniestra»',
    role: 'Alabarda Oscura · Compañero de Bisharp',
    spriteUrl: charAsset('triad_knights_sprite.png'),
    bustUrl: charAsset('knight_frey_bust.png'),
    accentBorder: 'border-indigo-400/65',
    accentGlow: 'drop-shadow-[0_12px_24px_rgba(129,140,248,0.34)]',
  },
  royal_archivist: {
    name: 'El Archivista Real',
    role: 'Custodio de la Reliquia de Silph Co.',
    spriteUrl: charAsset('royal_archivist_sprite.png'),
    bustUrl: charAsset('royal_archivist_bust.png'),
    accentBorder: 'border-emerald-400/55',
    accentGlow: 'drop-shadow-[0_12px_24px_rgba(52,211,153,0.28)]',
  },
  clandestine_tamer: {
    name: 'Lord Vexen',
    role: 'Domador Clandestino',
    spriteUrl: charAsset('clandestine_tamer_sprite.png'),
    bustUrl: charAsset('clandestine_tamer_bust.png'),
    accentBorder: 'border-rose-500/60',
    accentGlow: 'drop-shadow-[0_12px_24px_rgba(244,63,94,0.34)]',
  },
  colossus_keeper: {
    name: 'Guardián del Coloso',
    role: 'Ente Antiguo · Portador de la Llave Rúnica',
    spriteUrl: charAsset('colossus_keeper_sprite.png'),
    bustUrl: charAsset('colossus_keeper_bust.png'),
    accentBorder: 'border-amber-400/60',
    accentGlow: 'drop-shadow-[0_12px_24px_rgba(251,191,36,0.34)]',
  },
  tobias: {
    name: 'Tobías',
    role: 'El del Action Replay · Valle Lirio',
    accentBorder: 'border-violet-400/65',
    accentGlow: 'drop-shadow-[0_10px_24px_rgba(167,139,250,0.38)]',
    emblemGradient: 'from-violet-950 via-indigo-950 to-slate-950',
    emblemAccent: 'text-violet-300',
    emblemIcon: MoonStar,
  },
  ash_ketchum: {
    name: 'Ash Ketchum',
    role: 'Retador de Pueblo Paleta · Sinnoh',
    accentBorder: 'border-sky-400/65',
    accentGlow: 'drop-shadow-[0_10px_24px_rgba(56,189,248,0.34)]',
    emblemGradient: 'from-sky-950 via-blue-950 to-amber-950',
    emblemAccent: 'text-amber-300',
    emblemIcon: Zap,
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
