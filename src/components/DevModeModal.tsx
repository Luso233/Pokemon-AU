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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-lg rounded-3xl border border-fuchsia-400/40 bg-[#0b1020] p-6 text-slate-100 shadow-2xl">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-xl border border-slate-700 bg-slate-900 p-1.5 text-slate-400 hover:text-white cursor-pointer"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-fuchsia-400/40 bg-fuchsia-500/15 text-fuchsia-300">
            <Wrench className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-fuchsia-300">
              Sandbox de Pruebas · Sin Grindeo
            </p>
            <h2 className="font-display text-xl font-bold text-white">
              Dev Mode
            </h2>
          </div>
        </div>

        {/* Current Snapshot */}
        <div className="mb-4 grid grid-cols-3 gap-2 rounded-2xl border border-slate-800 bg-slate-950/80 p-3 text-center">
          <div>
            <p className="text-[10px] uppercase text-slate-500">Saldo</p>
            <p className="font-mono-code text-sm font-bold text-amber-300">
              {profile.coins.toLocaleString()} {CURRENCY_SHORT}
            </p>
          </div>
          <div>
            <p className="text-[10px] uppercase text-slate-500">Capítulos</p>
            <p className="font-mono-code text-sm font-bold text-sky-300">
              {profile.unlockedChapters.length}/{totalChapters} ({completedCount} ✓)
            </p>
          </div>
          <div>
            <p className="text-[10px] uppercase text-slate-500">Estado Dev</p>
            <p
              className={`text-sm font-bold ${
                profile.devModeEnabled ? 'text-fuchsia-300' : 'text-slate-400'
              }`}
            >
              {profile.devModeEnabled ? 'ACTIVO' : 'Normal'}
            </p>
          </div>
        </div>

        {feedback && (
          <div className="mb-4 rounded-xl border border-emerald-400/40 bg-emerald-500/15 px-3.5 py-2 text-xs font-semibold text-emerald-200">
            {feedback}
          </div>
        )}

        <div className="space-y-2.5">
          {/* Action 1: Unlock Full Anything Goes National Pokédex (~1,150+ playable species + Playtesting Lab) */}
          <button
            type="button"
            onClick={() => {
              onUnlockFullAgPokedex();
              setConfirmReset(false);
              setFeedback(
                `🧪 ¡Pokédex Completo Anything Goes desbloqueado (${totalAgSpecies} especies jugables)! Abre Cajas PC (o "Usar Equipo Libre" dentro de cualquier Briefing) para generar cualquier espécimen o importar/exportar equipos de Showdown.`
              );
            }}
            className="flex w-full items-center justify-between gap-3 rounded-2xl bg-gradient-to-r from-sky-400 via-fuchsia-500 to-amber-400 px-4 py-3 text-left text-slate-950 shadow-lg shadow-fuchsia-500/25 transition hover:brightness-110 cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <FlaskConical className="h-5 w-5 shrink-0" />
              <div>
                <p className="text-sm font-extrabold">
                  Pokédex Nacional Completo (Anything Goes · {totalAgSpecies} especies)
                </p>
                <p className="text-[11px] font-semibold text-slate-900/85">
                  Espécimen de CUALQUIER Pokémon jugable + Importador/Exportador Showdown + 6× objetos + todos los slots abiertos
                </p>
              </div>
            </div>
          </button>

          {/* Action 1B: Populate 1 of EVERY playable species into Reserve Box (Living Dex!) */}
          {onPopulateLivingDexBox && (
            <button
              type="button"
              onClick={() => {
                const res = onPopulateLivingDexBox();
                setConfirmReset(false);
                setFeedback(
                  `📦 ¡Living Dex completo cargado! Se agregaron ${res.addedCount} especies nuevas a tu Caja de Reserva (Total vivos en tus Cajas: ${res.totalLiving}). Usa el buscador estilo Showdown para filtrar por Tipo, Habilidad, Movimiento o Tier.`
                );
              }}
              className="flex w-full items-center justify-between gap-3 rounded-2xl border border-emerald-400/50 bg-emerald-500/15 px-4 py-2.5 text-left text-emerald-100 transition hover:bg-emerald-500/25 cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <PackagePlus className="h-4 w-4 shrink-0 text-emerald-300" />
                <div>
                  <p className="text-xs font-extrabold">
                    Agregar 1 de cada especie a mi Caja (Living Dex · {totalAgSpecies})
                  </p>
                  <p className="text-[10px] text-emerald-200/80">
                    Llena tu Caja de Reserva con un ejemplar jugable de cada especie (paginado + búsqueda indexada instantánea)
                  </p>
                </div>
              </div>
            </button>
          )}

          {/* Action 2: Unlock Everything */}
          <button
            type="button"
            onClick={() => {
              onUnlockEverything();
              setConfirmReset(false);
              setFeedback(
                `¡Todo desbloqueado! ${totalChapters}/${totalChapters} capítulos, Pokédex completo, 6× todos los objetos, 6 Shiny Charms, todos los slots de movimiento libres y 9,999,999 PC.`
              );
            }}
            className="flex w-full items-center justify-between gap-3 rounded-2xl border border-fuchsia-400/50 bg-fuchsia-500/20 px-4 py-2.5 text-left text-fuchsia-100 transition hover:bg-fuchsia-500/30 cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <Zap className="h-4 w-4 shrink-0 fill-current text-amber-300" />
              <div>
                <p className="text-xs font-extrabold">
                  Desbloquear TODO de golpe ({totalChapters} capítulos + 9.9M PC)
                </p>
                <p className="text-[10px] text-fuchsia-200/80">
                  Capítulos + todos los Pokémon, objetos (6×), 6 Shiny Charms y slots de learnset completo
                </p>
              </div>
            </div>
          </button>

          {/* Action 2: +1,000,000 PC */}
          <button
            type="button"
            onClick={() => {
              onAddMillionCoins();
              setConfirmReset(false);
              setFeedback('+$1,000,000 PokéCoronas agregadas al monedero.');
            }}
            className="flex w-full items-center justify-between gap-3 rounded-2xl border border-amber-400/40 bg-amber-500/15 px-4 py-2.5 text-left text-amber-100 transition hover:bg-amber-500/25 cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <Coins className="h-4 w-4 text-amber-400" />
              <div>
                <p className="text-xs font-bold">
                  Agregar +1,000,000 PokéCoronas
                </p>
                <p className="text-[10px] text-amber-200/75">
                  Para probar compras de la Tienda, Shiny Charms y desbloqueos de slots
                </p>
              </div>
            </div>
          </button>

          {/* Action 3: Toggle Free Move Slots & Debug */}
          <button
            type="button"
            onClick={() => {
              const next = !profile.devModeEnabled;
              onToggleDevMode(next);
              setConfirmReset(false);
              setFeedback(
                next
                  ? 'Modo Sandbox activado: los 4 slots de movimiento de cualquier Pokémon están abiertos y puedes ver el Debug Paste rival.'
                  : 'Modo Sandbox desactivado: vuelven los candados normales de progresión.'
              );
            }}
            className={`flex w-full items-center justify-between gap-3 rounded-2xl border px-4 py-2.5 text-left transition cursor-pointer ${
              profile.devModeEnabled
                ? 'border-fuchsia-400/50 bg-fuchsia-500/15 text-fuchsia-100'
                : 'border-slate-700 bg-slate-900/80 text-slate-200 hover:border-fuchsia-400/40'
            }`}
          >
            <div className="flex items-center gap-3">
              <Unlock className="h-4 w-4 text-fuchsia-300" />
              <div>
                <p className="text-xs font-bold">
                  {profile.devModeEnabled
                    ? '✓ Modo Sandbox activo (Slots libres + Debug)'
                    : 'Activar Modo Sandbox (Slots de movimientos libres + Debug)'}
                </p>
                <p className="text-[10px] text-slate-400">
                  Permite editar cualquier movimiento legal sin pagar y muestra herramientas de debug en el Briefing
                </p>
              </div>
            </div>
            <Sparkles className="h-4 w-4 shrink-0 text-fuchsia-300" />
          </button>

          {/* Action 4: Reset Story */}
          <div className="rounded-2xl border border-rose-500/35 bg-rose-950/25 p-3">
            {!confirmReset ? (
              <button
                type="button"
                onClick={() => setConfirmReset(true)}
                className="flex w-full items-center gap-3 text-left text-rose-200 transition hover:text-white cursor-pointer"
              >
                <RotateCcw className="h-4 w-4 shrink-0 text-rose-400" />
                <div>
                  <p className="text-xs font-bold">
                    Reiniciar Historia y Progreso desde cero
                  </p>
                  <p className="text-[10px] text-rose-200/70">
                    Vuelve a 1,500 PC, 3 capítulos iniciales, inventario base y candados cerrados
                  </p>
                </div>
              </button>
            ) : (
              <div className="space-y-2">
                <p className="flex items-center gap-1.5 text-xs font-bold text-rose-200">
                  <ShieldAlert className="h-4 w-4 text-rose-400" />
                  ¿Seguro que quieres borrar todo tu progreso local?
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      onResetStoryProgress();
                      setConfirmReset(false);
                      setFeedback(
                        'Historia reiniciada desde cero (1,500 PC, 3 capítulos iniciales, candados restaurados).'
                      );
                    }}
                    className="flex-1 rounded-xl bg-rose-500 px-3 py-1.5 text-xs font-extrabold text-white hover:bg-rose-400 cursor-pointer"
                  >
                    Sí, reiniciar todo
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
