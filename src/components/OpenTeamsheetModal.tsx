import React from 'react';
import { ClipboardList, Shield, Sparkles, Swords, X } from 'lucide-react';
import { getTypeBadgeClass } from '../engine/pokemonVisuals';
import type { OpenTeamsheetEntry } from '../types/game';
import { PokemonIcon } from './PokemonSprite';

interface OpenTeamsheetModalProps {
  open: boolean;
  onClose: () => void;
  formatLabel: string;
  playerName: string;
  rivalName: string;
  playerSheet: OpenTeamsheetEntry[];
  rivalSheet: OpenTeamsheetEntry[];
}

export const OpenTeamsheetModal: React.FC<OpenTeamsheetModalProps> = ({
  open,
  onClose,
  formatLabel,
  playerName,
  rivalName,
  playerSheet,
  rivalSheet,
}) => {
  if (!open) return null;

  const renderTeamColumn = (
    title: string,
    entries: OpenTeamsheetEntry[],
    tone: 'player' | 'rival'
  ) => (
    <div>
      <div className="mb-3 flex items-center gap-2">
        {tone === 'player' ? (
          <Shield className="h-4 w-4 text-amber-400" />
        ) : (
          <Swords className="h-4 w-4 text-rose-400" />
        )}
        <h4
          className={`font-display text-sm font-bold uppercase tracking-wider ${
            tone === 'player' ? 'text-amber-200' : 'text-rose-200'
          }`}
        >
          {title} ({entries.length})
        </h4>
      </div>
      <div className="grid gap-2.5 sm:grid-cols-2">
        {entries.map((mon, idx) => (
          <div
            key={`${mon.species}-${idx}`}
            className={`rounded-2xl border bg-slate-900/90 p-3 ${
              tone === 'player'
                ? 'border-amber-400/25'
                : 'border-rose-400/25'
            }`}
          >
            <div className="flex items-center justify-between gap-1.5 border-b border-slate-800 pb-2">
              <div className="flex min-w-0 items-center gap-1.5">
                <PokemonIcon species={mon.species} className="scale-90" />
                <div className="min-w-0">
                  <p className="truncate text-xs font-extrabold text-white">
                    {mon.species}
                  </p>
                  <div className="mt-0.5 flex flex-wrap gap-1">
                    {mon.types.map((t) => (
                      <span
                        key={t}
                        className={`rounded border px-1 py-0.2 text-[8px] font-bold uppercase ${getTypeBadgeClass(t)}`}
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              <span className="font-mono-code shrink-0 rounded bg-slate-950 px-1.5 py-0.5 text-[10px] font-bold text-slate-300">
                Nv.{mon.level}
              </span>
            </div>

            <div className="mt-2 space-y-1 text-[11px]">
              <p className="text-slate-300">
                <span className="text-slate-500">Objeto:</span>{' '}
                <strong className="text-amber-200">{mon.item}</strong>
              </p>
              <p className="text-slate-300">
                <span className="text-slate-500">Habilidad:</span>{' '}
                <strong className="text-white">{mon.ability}</strong>
              </p>
              <p className="flex items-center gap-1 text-slate-300">
                <span className="text-slate-500">Tera:</span>
                <span
                  className={`inline-flex items-center gap-0.5 rounded border px-1.5 py-0.2 text-[9px] font-bold uppercase ${getTypeBadgeClass(mon.teraType)}`}
                >
                  <Sparkles className="h-2.5 w-2.5" />
                  {mon.teraType}
                </span>
              </p>
            </div>

            <div className="mt-2 grid grid-cols-2 gap-1 border-t border-slate-800/80 pt-2">
              {mon.moves.map((mv) => (
                <span
                  key={mv}
                  className="truncate rounded-md bg-slate-950/90 px-1.5 py-0.5 text-[10px] font-medium text-slate-200"
                >
                  • {mv}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
      <div className="flex max-h-[90vh] w-full max-w-6xl flex-col overflow-hidden rounded-3xl border border-sky-400/35 bg-[#070d1b] shadow-2xl">
        <div className="flex shrink-0 items-center justify-between border-b border-slate-800 bg-slate-950/95 px-5 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-sky-400/40 bg-sky-500/15 text-sky-300">
              <ClipboardList className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-display text-base font-bold text-white sm:text-lg">
                Open Teamsheets Oficiales
              </h3>
              <p className="text-xs text-slate-400">
                {formatLabel} · Objetos, Habilidades, Teratipos y Movimientos visibles
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl border border-slate-700 bg-slate-900 p-2 text-slate-300 hover:border-amber-400/50 hover:text-white cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="grid flex-1 gap-6 overflow-y-auto p-5 lg:grid-cols-2">
          {renderTeamColumn(playerName, playerSheet, 'player')}
          {renderTeamColumn(rivalName, rivalSheet, 'rival')}
        </div>
      </div>
    </div>
  );
};
