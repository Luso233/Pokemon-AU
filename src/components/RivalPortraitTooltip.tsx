import React from 'react';
import { Crosshair, ShieldAlert, Sparkles } from 'lucide-react';
import type { CharacterId, RivalProfile } from '../types/game';
import { CharacterPortrait } from './CharacterPortrait';
import { TooltipPortal } from './TooltipPortal';

interface RivalPortraitTooltipProps {
  profile: RivalProfile;
  charId?: CharacterId;
  placement?: 'top' | 'bottom' | 'left' | 'right';
  children: React.ReactElement<React.HTMLAttributes<HTMLElement>>;
}

function getArchetypeBadgeClass(tag: string): string {
  const low = tag.toLowerCase();
  if (low.includes('rencor') || low.includes('gimmick')) {
    return 'border-rose-400/50 bg-rose-500/20 text-rose-200';
  }
  if (low.includes('puzzle') || low.includes('raid')) {
    return 'border-orange-400/50 bg-orange-500/20 text-orange-200';
  }
  if (low.includes('anime') || low.includes('ubers')) {
    return 'border-violet-400/55 bg-violet-500/20 text-violet-200';
  }
  if (low.includes('vgc') || low.includes('showcase') || low.includes('triples')) {
    return 'border-sky-400/50 bg-sky-500/20 text-sky-200';
  }
  return 'border-amber-400/50 bg-amber-500/20 text-amber-200';
}

export const RivalPortraitTooltip: React.FC<RivalPortraitTooltipProps> = ({
  profile,
  charId,
  placement = 'left',
  children,
}) => {
  const card = (
    <div className="w-[19.5rem] rounded-2xl border border-rose-400/55 bg-[#0a1020]/98 p-3.5 text-left shadow-2xl shadow-black/95 ring-1 ring-rose-500/20 backdrop-blur-xl">
      {/* Header: Portrait + Name + Title + Archetype Tag */}
      <div className="flex items-start gap-2.5 border-b border-slate-800 pb-2.5">
        {charId && (
          <div className="h-11 w-11 shrink-0 overflow-hidden rounded-full border-2 border-rose-400/65 bg-slate-900 p-0.5 shadow-md shadow-rose-500/20">
            <CharacterPortrait
              charId={charId}
              variant="bust"
              className="h-full w-full rounded-full object-cover object-top"
            />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center justify-between gap-1.5">
            <span className="truncate text-sm font-extrabold text-white">
              {profile.name}
            </span>
          </div>
          <p className="truncate text-[11px] font-semibold text-rose-300/90">
            {profile.title}
          </p>
          <span
            className={`mt-1.5 inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[9px] font-extrabold uppercase tracking-wider ${getArchetypeBadgeClass(
              profile.archetypeTag
            )}`}
          >
            <Sparkles className="h-2.5 w-2.5" />
            {profile.archetypeTag}
          </span>
        </div>
      </div>

      {/* Lore / Bio */}
      <p className="mt-2.5 text-[11px] leading-relaxed text-slate-300">
        {profile.bio}
      </p>

      {/* AI Personality & Combat Directives */}
      {profile.personalityStyle && (
        <div className="mt-2.5 rounded-xl border border-violet-400/35 bg-violet-500/10 p-2.5">
          <div className="mb-0.5 flex items-center justify-between gap-2 text-[10px] font-extrabold uppercase tracking-wider text-violet-200">
            <span>Personalidad: {profile.personalityStyle}</span>
            {profile.bondBadge && (
              <span className="rounded bg-fuchsia-500/20 px-1.5 py-0.2 text-[8px] text-fuchsia-200">
                {profile.bondBadge}
              </span>
            )}
          </div>
          {profile.directiveSummary && (
            <p className="text-[10.5px] leading-relaxed text-violet-100/85">
              {profile.directiveSummary}
            </p>
          )}
        </div>
      )}

      {/* Highlighted Tactical Reading */}
      <div className="mt-2.5 rounded-xl border border-amber-400/35 bg-gradient-to-br from-amber-500/12 via-rose-500/8 to-slate-950/95 p-2.5">
        <div className="mb-1 flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-wider text-amber-300">
          <Crosshair className="h-3.5 w-3.5 text-amber-400" />
          Lectura Táctica
        </div>
        <p className="text-[11px] leading-relaxed text-amber-50/95">
          {profile.tacticalInsight}
        </p>
      </div>

      <div className="mt-2 flex items-center justify-between text-[9px] text-slate-500">
        <span className="inline-flex items-center gap-1">
          <ShieldAlert className="h-2.5 w-2.5 text-rose-400/80" />
          Dossier de Inteligencia Rival
        </span>
        <span>Clic para fijar · Esc</span>
      </div>
    </div>
  );

  return (
    <TooltipPortal content={card} placement={placement} triggerOnClick>
      {children}
    </TooltipPortal>
  );
};
