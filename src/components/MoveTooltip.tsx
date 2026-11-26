import React from 'react';
import { AlertTriangle, Crosshair, Zap } from 'lucide-react';
import { getTypeBadgeClass } from '../engine/pokemonVisuals';
import type { ActiveMoveOption } from '../types/game';
import { TooltipPortal } from './TooltipPortal';

interface MoveTooltipProps {
  move: ActiveMoveOption;
  placement?: 'top' | 'bottom' | 'left' | 'right';
  children: React.ReactElement<React.HTMLAttributes<HTMLElement>>;
}

function targetLabelSpanish(target: string): string {
  const map: Record<string, string> = {
    normal: 'Un rival o aliado adyacente',
    adjacentFoe: 'Un rival adyacente',
    any: 'Cualquier Pokémon en campo',
    allAdjacentFoes: 'Todos los rivales (área)',
    allAdjacent: 'Todos en campo (incluye aliado)',
    self: 'Usuario',
    allySide: 'Todo tu bando',
    foeSide: 'Todo el bando rival',
    allyTeam: 'Todo tu equipo',
    adjacentAlly: 'Tu aliado',
    adjacentAllyOrSelf: 'Aliado o usuario',
    all: 'Todo el campo',
    randomNormal: 'Un rival al azar',
    scripted: 'Objetivo automático',
  };
  return map[target] ?? target;
}

function categorySpanish(cat: ActiveMoveOption['category']): {
  label: string;
  cls: string;
} {
  if (cat === 'Physical') {
    return {
      label: 'Físico',
      cls: 'bg-orange-500/20 text-orange-200 border-orange-400/40',
    };
  }
  if (cat === 'Special') {
    return {
      label: 'Especial',
      cls: 'bg-sky-500/20 text-sky-200 border-sky-400/40',
    };
  }
  return {
    label: 'Estado',
    cls: 'bg-slate-600/30 text-slate-200 border-slate-400/40',
  };
}

export const MoveTooltip: React.FC<MoveTooltipProps> = ({
  move,
  placement = 'top',
  children,
}) => {
  const cat = categorySpanish(move.category);
  const accuracyText =
    move.accuracy === true ? 'Nunca falla' : `${move.accuracy}%`;
  const isMaxFrustration =
    move.id === 'frustration' &&
    (move.userHappiness === 0 || move.basePower === 102 || Boolean(move.powerNote));
  const displayedBasePower = isMaxFrustration ? 102 : move.basePower;
  const effectivePowerNote =
    move.powerNote ??
    (isMaxFrustration
      ? 'Potencia máxima por Felicidad: 0 (Vínculo roto)'
      : undefined);

  const card = (
    <div className="w-[18.5rem] rounded-2xl border border-amber-400/45 bg-[#0a1020]/98 p-3.5 text-left shadow-2xl shadow-black/90 backdrop-blur-xl">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 border-b border-slate-800 pb-2">
        <span className="text-sm font-extrabold text-white">{move.name}</span>
        <div className="flex items-center gap-1">
          <span
            className={`rounded border px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider ${getTypeBadgeClass(move.type)}`}
          >
            {move.type}
          </span>
          <span
            className={`rounded border px-1.5 py-0.5 text-[9px] font-bold ${cat.cls}`}
          >
            {cat.label}
          </span>
        </div>
      </div>

      {/* Metrics */}
      <div className="mt-2.5 grid grid-cols-3 gap-1.5 text-center">
        <div
          className={`rounded-lg border px-2 py-1 ${
            isMaxFrustration
              ? 'border-rose-400/50 bg-rose-950/55'
              : 'border-slate-800 bg-slate-950/90'
          }`}
        >
          <p className="text-[9px] uppercase text-slate-400">Poder Base</p>
          <p
            className={`font-mono-code text-xs font-bold ${
              isMaxFrustration ? 'text-rose-200' : 'text-amber-200'
            }`}
          >
            {displayedBasePower > 0 ? displayedBasePower : '—'}
          </p>
        </div>
        <div className="rounded-lg border border-slate-800 bg-slate-950/90 px-2 py-1">
          <p className="text-[9px] uppercase text-slate-400">Precisión</p>
          <p className="font-mono-code text-xs font-bold text-slate-100">
            {accuracyText}
          </p>
        </div>
        <div className="rounded-lg border border-slate-800 bg-slate-950/90 px-2 py-1">
          <p className="text-[9px] uppercase text-slate-400">PP</p>
          <p className="font-mono-code text-xs font-bold text-sky-300">
            {move.pp}/{move.maxpp}
          </p>
        </div>
      </div>

      {/* Special Gimmick Power Warning (e.g. Frustration Happiness: 0 -> 102 BP) */}
      {effectivePowerNote && (
        <div className="mt-2 flex items-start gap-1.5 rounded-lg border border-rose-400/45 bg-rose-500/15 px-2.5 py-1.5 text-[10px] leading-snug text-rose-100">
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-rose-400" />
          <div>
            <span className="font-extrabold text-amber-200">
              Poder Base: {displayedBasePower}
            </span>{' '}
            — {effectivePowerNote}
          </div>
        </div>
      )}

      {/* Target + Priority */}
      <div className="mt-2 flex flex-wrap items-center justify-between gap-1.5 rounded-lg border border-slate-800/80 bg-slate-900/70 px-2.5 py-1.5 text-[11px]">
        <span className="inline-flex items-center gap-1.5 text-slate-200">
          <Crosshair className="h-3.5 w-3.5 text-amber-400" />
          <strong className="text-slate-400">Objetivo:</strong>{' '}
          {targetLabelSpanish(move.target)}
        </span>
        {move.priority !== 0 && (
          <span
            className={`font-mono-code inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[10px] font-bold ${
              move.priority > 0
                ? 'bg-emerald-500/20 text-emerald-300'
                : 'bg-rose-500/20 text-rose-300'
            }`}
          >
            <Zap className="h-2.5 w-2.5" />
            {move.priority > 0 ? `+${move.priority}` : move.priority}
          </span>
        )}
      </div>

      {/* Short Description */}
      {move.shortDesc && (
        <p className="mt-2 text-[11px] leading-relaxed text-slate-300">
          {move.shortDesc}
        </p>
      )}
    </div>
  );

  return (
    <TooltipPortal content={card} placement={placement}>
      {children}
    </TooltipPortal>
  );
};
