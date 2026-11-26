import React from 'react';
import { Crown, EyeOff, Gauge, Shield, Sparkles } from 'lucide-react';
import { computeEffectiveStat } from '../engine/battleEngine';
import {
  getTypeBadgeClass,
  STATUS_BADGE_STYLES,
} from '../engine/pokemonVisuals';
import type { PartyPokemonState } from '../types/game';
import { TooltipPortal } from './TooltipPortal';

interface PokemonTooltipProps {
  mon: PartyPokemonState | null;
  side: 'p1' | 'p2';
  placement?: 'top' | 'bottom' | 'left' | 'right';
  children: React.ReactElement<React.HTMLAttributes<HTMLElement>>;
}

function hpColor(pct: number): string {
  if (pct > 50) return 'bg-emerald-400';
  if (pct > 22) return 'bg-amber-400';
  return 'bg-rose-500';
}

const STAT_KEYS: Array<{ key: 'atk' | 'def' | 'spa' | 'spd' | 'spe'; label: string }> = [
  { key: 'atk', label: 'Atk' },
  { key: 'def', label: 'Def' },
  { key: 'spa', label: 'SpA' },
  { key: 'spd', label: 'SpD' },
  { key: 'spe', label: 'Spe' },
];

export const PokemonTooltip: React.FC<PokemonTooltipProps> = ({
  mon,
  side,
  placement = 'top',
  children,
}) => {
  const renderCard = () => {
    // Unrevealed rival Pokéball slot (Fog of War)
    if (!mon || (side === 'p2' && !mon.revealed)) {
      return (
        <div className="w-64 rounded-2xl border border-rose-400/35 bg-[#0a0f1d]/98 p-3.5 text-left shadow-2xl shadow-black/85 backdrop-blur-xl">
          <div className="flex items-center gap-2 text-xs font-bold text-rose-200">
            <EyeOff className="h-4 w-4 text-rose-400" />
            Pokémon no revelado
          </div>
          <p className="mt-1.5 text-[11px] leading-relaxed text-slate-400">
            Oculto por Niebla de Guerra. Su especie, rango de velocidad,
            habilidad y objeto se descubrirán cuando entre al campo.
          </p>
        </div>
      );
    }

    const statusBadge = mon.status ? STATUS_BADGE_STYLES[mon.status] : null;
    const activeBoosts = Object.entries(mon.boosts).filter(([, v]) => v !== 0);
    const revealedMoveList = Object.values(mon.revealedMoves);

    return (
      <div
        className={`w-[19rem] rounded-2xl border bg-[#0a1020]/98 p-3.5 text-left shadow-2xl shadow-black/90 backdrop-blur-xl ${
          side === 'p1' ? 'border-amber-400/45' : 'border-rose-400/45'
        }`}
      >
        {/* Header: Name, Species, Gender, Level */}
        <div className="flex items-start justify-between gap-2 border-b border-slate-800 pb-2">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-sm font-extrabold text-white">
                {mon.name}
              </span>
              {mon.name !== mon.species && (
                <span className="text-[11px] text-slate-400">
                  ({mon.species})
                </span>
              )}
              {mon.gender && (
                <span
                  className={`text-xs font-bold ${
                    mon.gender === 'M' ? 'text-sky-400' : 'text-pink-400'
                  }`}
                >
                  {mon.gender === 'M' ? '♂' : '♀'}
                </span>
              )}
              {mon.isBossAce && (
                <span className="inline-flex items-center gap-0.5 rounded bg-amber-500/20 px-1.5 py-0.5 text-[9px] font-extrabold text-amber-300 border border-amber-400/40">
                  <Crown className="h-2.5 w-2.5" />
                  ACE
                </span>
              )}
            </div>

            <div className="mt-1 flex flex-wrap items-center gap-1">
              {mon.types.map((t) => (
                <span
                  key={t}
                  className={`rounded border px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider ${getTypeBadgeClass(t)}`}
                >
                  {t}
                </span>
              ))}
              {mon.terastallized ? (
                <span className="rounded border border-cyan-300/60 bg-cyan-500/20 px-1.5 py-0.5 text-[9px] font-extrabold text-cyan-200">
                  ✦ TERA {mon.terastallized.toUpperCase()}
                </span>
              ) : side === 'p1' && mon.teraType ? (
                <span className="rounded border border-slate-700 bg-slate-900 px-1.5 py-0.5 text-[9px] font-semibold text-slate-300">
                  Tera: {mon.teraType}
                </span>
              ) : null}
              {statusBadge && (
                <span
                  className={`rounded px-1.5 py-0.5 text-[9px] font-extrabold ${statusBadge.cls}`}
                >
                  {statusBadge.label}
                </span>
              )}
              {mon.fainted && (
                <span className="rounded bg-rose-950 px-1.5 py-0.5 text-[9px] font-bold text-rose-300 border border-rose-500/40">
                  DEBILITADO
                </span>
              )}
            </div>
          </div>

          <span className="font-mono-code shrink-0 rounded-lg border border-slate-700 bg-slate-900 px-2 py-0.5 text-[11px] font-bold text-amber-200">
            Nv.{mon.level}
          </span>
        </div>

        {/* HP Section */}
        <div className="mt-2">
          <div className="mb-1 flex items-center justify-between text-[11px]">
            <span className="font-semibold text-slate-400">PS</span>
            <span className="font-mono-code font-bold text-slate-100">
              {side === 'p1'
                ? `${mon.hp} / ${mon.maxhp} · ${mon.hpPercent}%`
                : `${mon.hpPercent}%`}
            </span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-slate-800">
            <div
              className={`h-full rounded-full ${hpColor(mon.hpPercent)}`}
              style={{ width: `${mon.hpPercent}%` }}
            />
          </div>
        </div>

        {/* Boosts & Volatiles */}
        {(activeBoosts.length > 0 || mon.volatiles.length > 0) && (
          <div className="mt-2 flex flex-wrap gap-1">
            {activeBoosts.map(([stat, val]) => (
              <span
                key={stat}
                className={`font-mono-code rounded px-1.5 py-0.5 text-[10px] font-bold ${
                  val > 0
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/35'
                    : 'bg-rose-500/20 text-rose-300 border border-rose-400/35'
                }`}
              >
                {val > 0 ? `+${val}` : val} {stat.toUpperCase()}
              </span>
            ))}
            {mon.volatiles.map((v) => (
              <span
                key={v}
                className="rounded border border-violet-400/35 bg-violet-500/15 px-1.5 py-0.5 text-[10px] font-semibold text-violet-200"
              >
                {v}
              </span>
            ))}
          </div>
        )}

        {/* PLAYER VIEW (Exact Info) */}
        {side === 'p1' ? (
          <div className="mt-2.5 space-y-2 border-t border-slate-800 pt-2 text-[11px]">
            <div className="grid grid-cols-2 gap-1.5">
              <div>
                <span className="text-slate-400">Habilidad: </span>
                <span className="font-semibold text-white">
                  {mon.ability || '—'}
                </span>
              </div>
              <div>
                <span className="text-slate-400">Objeto: </span>
                <span className="font-semibold text-amber-200">
                  {mon.item || (mon.consumedItem ? `${mon.consumedItem} (usado)` : 'Ninguno')}
                </span>
              </div>
            </div>

            {mon.stats && (
              <div className="rounded-xl border border-slate-800 bg-slate-950/90 px-2.5 py-1.5">
                <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1 font-mono-code text-[10px]">
                  {STAT_KEYS.map(({ key, label }) => {
                    const base = mon.stats![key];
                    const stage = mon.boosts[key] ?? 0;
                    const eff = computeEffectiveStat(base, stage);
                    const colorCls =
                      stage > 0
                        ? 'text-emerald-400 font-bold'
                        : stage < 0
                          ? 'text-rose-400 font-bold'
                          : 'text-slate-200';
                    return (
                      <span key={key} className={colorCls}>
                        <span className="text-slate-500">{label}</span> {eff}
                      </span>
                    );
                  })}
                </div>
              </div>
            )}

            {mon.moves.length > 0 && (
              <div className="pt-0.5">
                <p className="mb-1 flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                  <Shield className="h-3 w-3 text-amber-400" />
                  Movimientos
                </p>
                <div className="flex flex-wrap gap-1">
                  {mon.moves.map((mv) => (
                    <span
                      key={mv}
                      className="rounded-md border border-slate-700/80 bg-slate-900 px-1.5 py-0.5 text-[10px] capitalize text-slate-200"
                    >
                      {mv}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          /* RIVAL VIEW (Strict Fog of War + Dex Speed Range + Revealed Moves) */
          <div className="mt-2.5 space-y-2 border-t border-slate-800 pt-2 text-[11px]">
            {/* Ability */}
            <div>
              <span className="text-slate-400">Habilidad: </span>
              {mon.revealedAbility ? (
                <span className="font-extrabold text-amber-200">
                  {mon.revealedAbility}
                </span>
              ) : (
                <span className="text-slate-300">
                  <span className="font-bold text-slate-200">?</span>{' '}
                  <span className="text-slate-400">
                    (Posibles:{' '}
                    {mon.possibleAbilities.length > 0
                      ? mon.possibleAbilities.join(', ')
                      : 'Desconocida'}
                    )
                  </span>
                </span>
              )}
            </div>

            {/* Item */}
            <div>
              <span className="text-slate-400">Objeto: </span>
              {mon.revealedItem ? (
                <span className="font-semibold text-amber-200">
                  {mon.revealedItem}
                </span>
              ) : mon.consumedItem ? (
                <span className="font-semibold text-rose-300">
                  {mon.consumedItem}{' '}
                  <span className="font-normal text-slate-400">(consumido)</span>
                </span>
              ) : (
                <span className="italic text-slate-500">Desconocido</span>
              )}
            </div>

            {/* Dynamic Speed Range from Dex */}
            {mon.speedRange && (
              <div className="rounded-xl border border-slate-800 bg-slate-950/90 px-2.5 py-1.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-slate-400">
                    <Gauge className="h-3 w-3 text-sky-400" />
                    Velocidad est.
                  </span>
                  <span className="font-mono-code text-xs font-bold text-sky-300">
                    Spe: {mon.speedRange.min}–{mon.speedRange.max}
                  </span>
                </div>
                {mon.speedRange.modifiers.length > 0 && (
                  <div className="mt-1 flex flex-wrap gap-1">
                    {mon.speedRange.modifiers.map((mod) => (
                      <span
                        key={mod}
                        className="rounded bg-sky-500/15 px-1.5 py-0.5 text-[9px] font-semibold text-sky-200"
                      >
                        {mod}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Revealed Moves + PP Remaining */}
            <div>
              <p className="mb-1 flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                <Sparkles className="h-3 w-3 text-rose-400" />
                Movimientos revelados
              </p>
              {revealedMoveList.length === 0 ? (
                <p className="text-[11px] italic text-slate-500">
                  Ningún movimiento revelado aún.
                </p>
              ) : (
                <ul className="space-y-1">
                  {revealedMoveList.map((mv) => {
                    const remaining = Math.max(0, mv.maxPP - mv.used);
                    return (
                      <li
                        key={mv.name}
                        className="flex items-center justify-between rounded-lg bg-slate-900/90 px-2 py-1 text-[11px]"
                      >
                        <span className="font-medium text-slate-100">
                          • {mv.name}
                        </span>
                        <span className="font-mono-code text-[10px] text-slate-400">
                          ({remaining}/{mv.maxPP})
                        </span>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <TooltipPortal content={renderCard()} placement={placement}>
      {children}
    </TooltipPortal>
  );
};
