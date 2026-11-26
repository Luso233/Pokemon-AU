import React, { useState } from 'react';
import {
  Check,
  Flame,
  FolderOpen,
  Save,
  ShieldAlert,
  Skull,
  Trash2,
  X,
} from 'lucide-react';
import { CHAPTERS } from '../data/chapters';
import { DIFFICULTY_META, VN_PACING_META } from '../data/economyCatalog';
import { MAX_SAVE_SLOTS } from '../engine/saveSlots';
import type { PlayerSaveProfile, SaveSlotRecord } from '../types/game';

interface SaveLoadModalProps {
  open: boolean;
  onClose: () => void;
  profile: PlayerSaveProfile;
  saveSlots: Record<number, SaveSlotRecord>;
  onSaveToSlot: (slotIndex: number, customRunName?: string) => void;
  onLoadFromSlot: (slotIndex: number) => void;
  onDeleteSlot: (slotIndex: number) => void;
}

export const SaveLoadModal: React.FC<SaveLoadModalProps> = ({
  open,
  onClose,
  profile,
  saveSlots,
  onSaveToSlot,
  onLoadFromSlot,
  onDeleteSlot,
}) => {
  const [runNameInput, setRunNameInput] = useState(
    profile.runName || 'Exilio de Wyndon'
  );
  const [notice, setNotice] = useState<string | null>(null);

  if (!open) return null;

  const activeSlot = profile.activeSaveSlot ?? 1;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/82 p-4 backdrop-blur-sm">
      <div className="pokerogue-box relative flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl text-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between border-b-2 border-[#d9462f]/70 bg-[#171222] px-5 py-3.5">
          <div className="flex items-center gap-2.5">
            <Save className="h-5 w-5 text-amber-300" />
            <div>
              <h2 className="font-pixel text-sm tracking-wider text-white sm:text-base">
                GUARDAR / CARGAR PARTIDA
              </h2>
              <p className="text-[11px] text-slate-400">
                5 ranuras locales independientes · Guarda tu run o cambia entre partidas
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Active Run Name Input */}
        <div className="flex flex-wrap items-center gap-2 border-b border-slate-800 bg-[#1b1528] px-5 py-3">
          <span className="font-pixel text-[10px] text-amber-300">
            NOMBRE DE RUN:
          </span>
          <input
            type="text"
            value={runNameInput}
            onChange={(e) => setRunNameInput(e.target.value)}
            maxLength={36}
            placeholder="Ej. Nuzlocke Tryhard #1"
            className="flex-1 rounded-lg border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs font-semibold text-white focus:border-amber-400 focus:outline-none"
          />
          <span className="text-[10px] text-slate-400">
            Ranura activa: <strong className="text-amber-200">#{activeSlot}</strong>
          </span>
        </div>

        {notice && (
          <div className="mx-5 mt-3 rounded-xl border border-emerald-400/45 bg-emerald-500/15 px-3.5 py-2 text-xs font-semibold text-emerald-100">
            {notice}
          </div>
        )}

        {/* 5 Slots */}
        <div className="flex-1 space-y-2.5 overflow-y-auto p-5">
          {Array.from({ length: MAX_SAVE_SLOTS }, (_, i) => i + 1).map((slotIdx) => {
            const rec = saveSlots[slotIdx];
            const isCurrent = activeSlot === slotIdx;
            const diffMeta = rec
              ? DIFFICULTY_META[rec.profile.defaultDifficulty] ?? DIFFICULTY_META.kaizo
              : null;
            const vnMeta = rec
              ? VN_PACING_META[rec.profile.vnPacingMode ?? 'full']
              : null;

            return (
              <div
                key={slotIdx}
                className={`rounded-xl border-2 p-3.5 transition ${
                  isCurrent
                    ? 'border-amber-400/75 bg-amber-500/10'
                    : rec
                      ? 'border-slate-700/90 bg-[#181326]'
                      : 'border-dashed border-slate-800 bg-[#140f1f]/70'
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="font-pixel rounded bg-slate-900 px-2 py-0.5 text-[10px] text-amber-300">
                        SLOT {slotIdx}
                      </span>
                      {isCurrent && (
                        <span className="inline-flex items-center gap-1 rounded bg-emerald-500/20 px-1.5 py-0.5 text-[9.5px] font-extrabold text-emerald-200">
                          <Check className="h-2.5 w-2.5" />
                          ACTIVA
                        </span>
                      )}
                      {rec?.isRunDead && (
                        <span className="inline-flex items-center gap-1 rounded bg-rose-500/25 px-1.5 py-0.5 text-[9.5px] font-extrabold text-rose-200">
                          <Skull className="h-2.5 w-2.5" />
                          RUN MUERTA
                        </span>
                      )}
                      {diffMeta && (
                        <span
                          className={`rounded border px-1.5 py-0.5 text-[9.5px] font-bold ${diffMeta.badgeClass}`}
                        >
                          {diffMeta.shortLabel}
                        </span>
                      )}
                      {rec?.profile.ironmanMode && (
                        <span className="inline-flex items-center gap-0.5 rounded bg-amber-500/20 px-1.5 py-0.5 text-[9px] font-bold text-amber-200">
                          <ShieldAlert className="h-2.5 w-2.5" />
                          Ironman
                        </span>
                      )}
                      {rec?.profile.nuzlockePermadeath && (
                        <span className="inline-flex items-center gap-0.5 rounded bg-rose-500/20 px-1.5 py-0.5 text-[9px] font-bold text-rose-200">
                          <Flame className="h-2.5 w-2.5" />
                          Nuzlocke
                        </span>
                      )}
                    </div>

                    {rec ? (
                      <div className="mt-1.5">
                        <p className="font-display text-sm font-bold text-white">
                          {rec.runName}
                        </p>
                        <p className="mt-0.5 text-[11px] text-slate-400">
                          {rec.completedCount}/{CHAPTERS.length} capítulos ·{' '}
                          {rec.aliveCount} Pokémon vivos ·{' '}
                          {rec.profile.coins.toLocaleString()} PC ·{' '}
                          {vnMeta?.shortLabel} ·{' '}
                          {new Date(rec.savedAt).toLocaleString()}
                        </p>
                      </div>
                    ) : (
                      <p className="mt-1.5 text-xs text-slate-500">
                        Ranura vacía — lista para guardar tu partida actual.
                      </p>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        onSaveToSlot(slotIdx, runNameInput);
                        setNotice(`💾 Partida guardada en Slot ${slotIdx} ("${runNameInput.trim() || `Run #${slotIdx}`}").`);
                      }}
                      className="inline-flex items-center gap-1 rounded-lg bg-amber-500/25 px-3 py-1.5 text-[11px] font-extrabold text-amber-100 hover:bg-amber-500/35 cursor-pointer"
                    >
                      <Save className="h-3.5 w-3.5" />
                      Guardar
                    </button>
                    {rec && (
                      <>
                        <button
                          type="button"
                          onClick={() => {
                            onLoadFromSlot(slotIdx);
                            setNotice(`📂 Cargado Slot ${slotIdx} ("${rec.runName}").`);
                          }}
                          className="inline-flex items-center gap-1 rounded-lg bg-sky-500/25 px-3 py-1.5 text-[11px] font-extrabold text-sky-100 hover:bg-sky-500/35 cursor-pointer"
                        >
                          <FolderOpen className="h-3.5 w-3.5" />
                          Cargar
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            onDeleteSlot(slotIdx);
                            setNotice(`🗑️ Slot ${slotIdx} borrado.`);
                          }}
                          title="Borrar ranura"
                          className="rounded-lg border border-rose-500/40 bg-rose-500/15 p-1.5 text-rose-200 hover:bg-rose-500/30 cursor-pointer"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
