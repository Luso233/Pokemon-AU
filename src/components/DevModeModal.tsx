import React, { useState } from 'react';
import {
  Coins,
  FlaskConical,
  PackagePlus,
  RotateCcw,
  ShieldAlert,
  Sparkles,
  Unlock,
  Wrench,
  X,
  Zap,
} from 'lucide-react';
import { CHAPTER_UNLOCK_RULES, CURRENCY_SHORT } from '../data/economyCatalog';
import { getAllAnythingGoesPlayableSpecies } from '../engine/pricingEngine';
import type { PlayerSaveProfile } from '../types/game';

interface DevModeModalProps {
  open: boolean;
  onClose: () => void;
  profile: PlayerSaveProfile;
  onUnlockEverything: () => void;
  onUnlockFullAgPokedex: () => void;
  onPopulateLivingDexBox?: () => { addedCount: number; totalLiving: number };
  onAddMillionCoins: () => void;
  onToggleDevMode: (enabled: boolean) => void;
  onResetStoryProgress: () => void;
}

export const DevModeModal: React.FC<DevModeModalProps> = ({
  open,
  onClose,
  profile,
  onUnlockEverything,
  onUnlockFullAgPokedex,
  onPopulateLivingDexBox,
  onAddMillionCoins,
  onToggleDevMode,
  onResetStoryProgress,
}) => {
  const [confirmReset, setConfirmReset] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  if (!open) return null;

  const totalChapters = Object.keys(CHAPTER_UNLOCK_RULES).length;
  const totalAgSpecies = getAllAnythingGoesPlayableSpecies().length;
  const completedCount = Object.values(profile.completedChapters).filter(
    (p) => p.completed
  ).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-3 backdrop-blur-sm sm:p-4">
      <div className="relative max-h-[90dvh] w-full max-w-lg overflow-y-auto rounded-3xl border border-fuchsia-400/40 bg-[#0b1020] p-4 text-slate-100 shadow-2xl sm:p-6">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-xl border border-slate-700 bg-slate-900 p-1.5 text-slate-400 hover:text-white cursor-pointer"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-fuchsia-400/40 bg-fuchsia-500/15 text-fuchsia-300">
            <Wrench className="h-4 w-4" />
          </div>
          <h2 className="font-display text-xl font-bold text-white">
            Dev Mode
          </h2>
        </div>

        {/* Current Snapshot */}
        <div className="mb-4 grid grid-cols-3 gap-2 rounded-2xl border border-slate-800 bg-slate-950/80 p-2.5 text-center">
          <div>
            <p className="text-[10px] uppercase text-slate-500">Saldo</p>
            <p className="font-mono-code text-xs font-bold text-amber-300 sm:text-sm">
              {profile.coins.toLocaleString()} {CURRENCY_SHORT}
            </p>
          </div>
          <div>
            <p className="text-[10px] uppercase text-slate-500">Capítulos</p>
            <p className="font-mono-code text-xs font-bold text-sky-300 sm:text-sm">
              {profile.unlockedChapters.length}/{totalChapters} ({completedCount} ✓)
            </p>
          </div>
          <div>
            <p className="text-[10px] uppercase text-slate-500">Estado</p>
            <p
              className={`text-xs font-bold sm:text-sm ${
                profile.devModeEnabled ? 'text-fuchsia-300' : 'text-slate-400'
              }`}
            >
              {profile.devModeEnabled ? 'ACTIVO' : 'Normal'}
            </p>
          </div>
        </div>

        {feedback && (
          <div className="mb-3 rounded-xl border border-emerald-400/40 bg-emerald-500/15 px-3 py-2 text-xs font-semibold text-emerald-200">
            {feedback}
          </div>
        )}

        <div className="space-y-2">
          {/* Action 1: Unlock Full Anything Goes National Pokédex */}
          <button
            type="button"
            onClick={() => {
              onUnlockFullAgPokedex();
              setConfirmReset(false);
              setFeedback(`🧪 Pokédex AG desbloqueado (${totalAgSpecies} especies) + 6× objetos + slots libres.`);
            }}
            className="flex w-full items-center justify-between gap-2 rounded-2xl bg-gradient-to-r from-sky-400 via-fuchsia-500 to-amber-400 px-3.5 py-2.5 text-left text-slate-950 shadow-lg shadow-fuchsia-500/20 transition hover:brightness-110 cursor-pointer"
          >
            <span className="inline-flex items-center gap-2 text-xs font-extrabold sm:text-sm">
              <FlaskConical className="h-4 w-4 shrink-0" />
              Pokédex Nacional AG + Showdown
            </span>
            <span className="font-mono-code shrink-0 rounded bg-black/20 px-1.5 py-0.5 text-[10px] font-black">
              {totalAgSpecies} spp
            </span>
          </button>

          {/* Action 1B: Populate 1 of EVERY playable species into Reserve Box (Living Dex!) */}
          {onPopulateLivingDexBox && (
            <button
              type="button"
              onClick={() => {
                const res = onPopulateLivingDexBox();
                setConfirmReset(false);
                setFeedback(`📦 Living Dex: +${res.addedCount} especies en Reserva (Total: ${res.totalLiving}).`);
              }}
              className="flex w-full items-center justify-between gap-2 rounded-2xl border border-emerald-400/50 bg-emerald-500/15 px-3.5 py-2.5 text-left text-emerald-100 transition hover:bg-emerald-500/25 cursor-pointer"
            >
              <span className="inline-flex items-center gap-2 text-xs font-extrabold">
                <PackagePlus className="h-4 w-4 shrink-0 text-emerald-300" />
                Living Dex en mi Caja
              </span>
              <span className="font-mono-code shrink-0 rounded bg-emerald-950 px-1.5 py-0.5 text-[10px] font-bold text-emerald-300">
                +1 c/u
              </span>
            </button>
          )}

          {/* Action 2: Unlock Everything */}
          <button
            type="button"
            onClick={() => {
              onUnlockEverything();
              setConfirmReset(false);
              setFeedback(`⚡ Todo desbloqueado: ${totalChapters} caps, 6× objetos, 6 Shiny Charms y 9.9M PC.`);
            }}
            className="flex w-full items-center justify-between gap-2 rounded-2xl border border-fuchsia-400/50 bg-fuchsia-500/20 px-3.5 py-2.5 text-left text-fuchsia-100 transition hover:bg-fuchsia-500/30 cursor-pointer"
          >
            <span className="inline-flex items-center gap-2 text-xs font-extrabold">
              <Zap className="h-4 w-4 shrink-0 fill-current text-amber-300" />
              Desbloquear TODO
            </span>
            <span className="font-mono-code shrink-0 rounded bg-fuchsia-950 px-1.5 py-0.5 text-[10px] font-bold text-amber-200">
              {totalChapters} caps · 9.9M PC
            </span>
          </button>

          {/* Action 3: +1,000,000 PC */}
          <button
            type="button"
            onClick={() => {
              onAddMillionCoins();
              setConfirmReset(false);
              setFeedback('+1,000,000 PC agregadas.');
            }}
            className="flex w-full items-center justify-between gap-2 rounded-2xl border border-amber-400/40 bg-amber-500/15 px-3.5 py-2.5 text-left text-amber-100 transition hover:bg-amber-500/25 cursor-pointer"
          >
            <span className="inline-flex items-center gap-2 text-xs font-bold">
              <Coins className="h-4 w-4 text-amber-400" />
              +1,000,000 PokéCoronas
            </span>
            <span className="font-mono-code text-[10px] font-bold text-amber-300">
              +1M PC
            </span>
          </button>

          {/* Action 4: Toggle Free Move Slots & Debug */}
          <button
            type="button"
            onClick={() => {
              const next = !profile.devModeEnabled;
              onToggleDevMode(next);
              setConfirmReset(false);
              setFeedback(next ? '✓ Sandbox ON (slots libres + debug).' : 'Sandbox OFF.');
            }}
            className={`flex w-full items-center justify-between gap-2 rounded-2xl border px-3.5 py-2.5 text-left transition cursor-pointer ${
              profile.devModeEnabled
                ? 'border-fuchsia-400/50 bg-fuchsia-500/15 text-fuchsia-100'
                : 'border-slate-700 bg-slate-900/80 text-slate-200 hover:border-fuchsia-400/40'
            }`}
          >
            <span className="inline-flex items-center gap-2 text-xs font-bold">
              <Unlock className="h-4 w-4 text-fuchsia-300" />
              {profile.devModeEnabled ? '✓ Sandbox ON' : 'Activar Sandbox (Slots + Debug)'}
            </span>
            <Sparkles className="h-4 w-4 shrink-0 text-fuchsia-300" />
          </button>

          {/* Action 5: Reset Story */}
          <div className="rounded-2xl border border-rose-500/35 bg-rose-950/25 p-3">
            {!confirmReset ? (
              <button
                type="button"
                onClick={() => setConfirmReset(true)}
                className="flex w-full items-center justify-between gap-2 text-left text-rose-200 transition hover:text-white cursor-pointer"
              >
                <span className="inline-flex items-center gap-2 text-xs font-bold">
                  <RotateCcw className="h-4 w-4 shrink-0 text-rose-400" />
                  Reiniciar Historia desde cero
                </span>
                <span className="text-[10px] text-rose-300/75">Reset</span>
              </button>
            ) : (
              <div className="space-y-2">
                <p className="flex items-center gap-1.5 text-xs font-bold text-rose-200">
                  <ShieldAlert className="h-4 w-4 text-rose-400" />
                  ¿Borrar progreso local?
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      onResetStoryProgress();
                      setConfirmReset(false);
                      setFeedback('Historia reiniciada.');
                    }}
                    className="flex-1 rounded-xl bg-rose-500 px-3 py-1.5 text-xs font-extrabold text-white hover:bg-rose-400 cursor-pointer"
                  >
                    Sí, reiniciar
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmReset(false)}
                    className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:text-white cursor-pointer"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
