import { Icons, Sprites } from '@pkmn/img';

export interface PokemonSpriteInfo {
  url: string;
  fallbackUrl: string;
  width: number;
  height: number;
  pixelated: boolean;
}

/**
 * Returns animated Showdown sprites via @pkmn/img with a static PNG fallback.
 */
export function getPokemonSprite(
  species: string,
  side: 'p1' | 'p2' = 'p2',
  animated = true,
  shiny = false
): PokemonSpriteInfo {
  const cleanSpecies = species.trim() || 'Magikarp';
  const primary = Sprites.getPokemon(cleanSpecies, {
    gen: animated ? 'ani' : 'gen5',
    side,
    shiny,
  });
  const fallback = Sprites.getPokemon(cleanSpecies, {
    gen: 'gen5',
    side: 'p2',
    shiny,
  });
  return {
    url: primary.url,
    fallbackUrl: fallback.url,
    width: primary.w,
    height: primary.h,
    pixelated: Boolean(primary.pixelated),
  };
}

/**
 * Returns CSS background-position sprite icon via @pkmn/img for party strips & teambuilder cards.
 */
export function getPokemonIconCss(species: string): React.CSSProperties {
  const icon = Icons.getPokemon(species.trim() || 'Magikarp');
  return icon.css as React.CSSProperties;
}

export const TYPE_BADGE_STYLES: Record<string, string> = {
  Normal: 'bg-stone-500/25 text-stone-200 border-stone-400/40',
  Fire: 'bg-orange-500/25 text-orange-200 border-orange-400/45',
  Water: 'bg-sky-500/25 text-sky-200 border-sky-400/45',
  Electric: 'bg-yellow-400/25 text-yellow-200 border-yellow-400/50',
  Grass: 'bg-emerald-500/25 text-emerald-200 border-emerald-400/45',
  Ice: 'bg-cyan-400/25 text-cyan-200 border-cyan-300/45',
  Fighting: 'bg-red-600/30 text-red-200 border-red-400/45',
  Poison: 'bg-purple-500/25 text-purple-200 border-purple-400/45',
  Ground: 'bg-amber-700/35 text-amber-200 border-amber-500/45',
  Flying: 'bg-indigo-400/25 text-indigo-200 border-indigo-300/45',
  Psychic: 'bg-pink-500/25 text-pink-200 border-pink-400/45',
  Bug: 'bg-lime-500/25 text-lime-200 border-lime-400/45',
  Rock: 'bg-yellow-700/35 text-yellow-200 border-yellow-600/45',
  Ghost: 'bg-violet-600/30 text-violet-200 border-violet-400/45',
  Dragon: 'bg-indigo-600/35 text-indigo-200 border-indigo-400/50',
  Dark: 'bg-zinc-700/50 text-zinc-200 border-zinc-400/40',
  Steel: 'bg-slate-400/25 text-slate-200 border-slate-300/45',
  Fairy: 'bg-rose-400/25 text-rose-200 border-rose-300/45',
  Shadow: 'bg-purple-700/45 text-fuchsia-100 border-fuchsia-400/75 shadow-[0_0_10px_rgba(168,85,247,0.45)]',
};

export const STATUS_BADGE_STYLES: Record<string, { label: string; cls: string }> = {
  brn: { label: 'BRN', cls: 'bg-orange-500 text-white' },
  par: { label: 'PAR', cls: 'bg-yellow-400 text-slate-950' },
  psn: { label: 'PSN', cls: 'bg-purple-500 text-white' },
  tox: { label: 'TOX', cls: 'bg-fuchsia-700 text-white' },
  slp: { label: 'SLP', cls: 'bg-slate-400 text-slate-950' },
  frz: { label: 'FRZ', cls: 'bg-cyan-400 text-slate-950' },
};

export function getTypeBadgeClass(type: string): string {
  return TYPE_BADGE_STYLES[type] ?? 'bg-slate-600/30 text-slate-200 border-slate-400/40';
}
