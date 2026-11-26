import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  ChevronRight,
  CloudSun,
  Code2,
  Flame,
  RefreshCw,
  Shield,
  Sparkles,
  Swords,
  Trophy,
  X,
} from 'lucide-react';
import {
  formatNeedsTarget,
  ShowdownBattleController,
} from '../engine/battleEngine';
import {
  getTypeBadgeClass,
  STATUS_BADGE_STYLES,
} from '../engine/pokemonVisuals';
import type {
  ActiveMoveOption,
  BattleSnapshot,
  PartyPokemonState,
  ResolvedBattleConfig,
} from '../types/game';
import { PokemonIcon, PokemonSprite } from './PokemonSprite';
import { SceneBackdrop } from './SceneBackdrop';

interface BattleArenaProps {
  config: ResolvedBattleConfig;
  onExitToChapters: () => void;
  onBattleComplete: (won: boolean, snapshot: BattleSnapshot) => void;
}

function hpBarColor(percent: number): string {
  if (percent > 50) return 'bg-emerald-400';
  if (percent > 22) return 'bg-amber-400';
  return 'bg-rose-500';
}

function categoryBadge(cat: ActiveMoveOption['category']): {
  label: string;
  cls: string;
} {
  if (cat === 'Physical') {
    return { label: 'Físico', cls: 'bg-orange-500/20 text-orange-200 border-orange-400/35' };
  }
  if (cat === 'Special') {
    return { label: 'Especial', cls: 'bg-sky-500/20 text-sky-200 border-sky-400/35' };
  }
  return { label: 'Estado', cls: 'bg-slate-600/30 text-slate-200 border-slate-400/35' };
}

export const BattleArena: React.FC<BattleArenaProps> = ({
  config,
  onExitToChapters,
  onBattleComplete,
}) => {
  const controllerRef = useRef<ShowdownBattleController | null>(null);
  const logEndRef = useRef<HTMLDivElement | null>(null);

  const [snapshot, setSnapshot] = useState<BattleSnapshot | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showPasteModal, setShowPasteModal] = useState(false);

  // Multi-slot decision queue (handles both Singles 1-slot & Doubles 2-slot)
  const [slotCursor, setSlotCursor] = useState(0);
  const [queuedCommands, setQueuedCommands] = useState<string[]>([]);
  const [reservedSwitchSlots, setReservedSwitchSlots] = useState<number[]>([]);
  const [pendingTargetMove, setPendingTargetMove] = useState<{
    move: ActiveMoveOption;
    mode: 'foe' | 'ally';
  } | null>(null);

  const startBattle = () => {
    controllerRef.current?.destroy();
    setError(null);
    setSlotCursor(0);
    setQueuedCommands([]);
    setReservedSwitchSlots([]);
    setPendingTargetMove(null);

    const ctrl = new ShowdownBattleController(config, (nextSnap) => {
      setSnapshot(nextSnap);
    });
    controllerRef.current = ctrl;
    ctrl.start().catch((err) => {
      setError(err instanceof Error ? err.message : String(err));
    });
  };

  useEffect(() => {
    startBattle();
    return () => {
      controllerRef.current?.destroy();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config]);

  // Reset per-turn command cursor when a new decision request arrives
  const requestKey = useMemo(() => {
    if (!snapshot) return '';
    return `${snapshot.turn}-${snapshot.status}-${snapshot.isForceSwitch}-${snapshot.pendingSlots.length}`;
  }, [snapshot]);

  useEffect(() => {
    if (!snapshot || snapshot.status !== 'awaiting-choice') return;
    // Automatically skip any slots marked as `pass`
    let idx = 0;
    const autoCmds: string[] = [];
    while (
      idx < snapshot.pendingSlots.length &&
      snapshot.pendingSlots[idx].pass
    ) {
      autoCmds.push('pass');
      idx++;
    }
    setSlotCursor(idx);
    setQueuedCommands(autoCmds);
    setReservedSwitchSlots([]);
    setPendingTargetMove(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requestKey]);

  // Auto-scroll battle log
  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [snapshot?.log.length]);

  const commitSlotCommand = (cmd: string, switchSlotUsed?: number) => {
    if (!snapshot || !controllerRef.current) return;
    const nextCmds = [...queuedCommands, cmd];
    const nextReserved =
      switchSlotUsed != null
        ? [...reservedSwitchSlots, switchSlotUsed]
        : reservedSwitchSlots;

    let nextIdx = slotCursor + 1;
    while (
      nextIdx < snapshot.pendingSlots.length &&
      snapshot.pendingSlots[nextIdx].pass
    ) {
      nextCmds.push('pass');
      nextIdx++;
    }

    setPendingTargetMove(null);

    if (nextIdx >= snapshot.pendingSlots.length) {
      setQueuedCommands([]);
      setReservedSwitchSlots([]);
      setSlotCursor(0);
      void controllerRef.current.submitPlayerChoice(nextCmds.join(', '));
    } else {
      setQueuedCommands(nextCmds);
      setReservedSwitchSlots(nextReserved);
      setSlotCursor(nextIdx);
    }
  };

  const handleMoveClick = (move: ActiveMoveOption) => {
    if (!snapshot) return;
    const targetMode = formatNeedsTarget(snapshot.format, move.target);
    if (targetMode === 'none') {
      commitSlotCommand(`move ${move.index}`);
      return;
    }

    if (targetMode === 'ally') {
      const activeIdx = snapshot.pendingSlots[slotCursor]?.activeIndex ?? 0;
      const allyIdx = activeIdx === 0 ? 1 : 0;
      commitSlotCommand(`move ${move.index} -${allyIdx + 1}`);
      return;
    }

    // In Doubles, if only 1 foe is alive, auto-target it cleanly!
    const aliveFoes = snapshot.p2.active
      .map((m, idx) => ({ m, idx }))
      .filter(({ m }) => m && !m.fainted);

    if (aliveFoes.length === 1) {
      commitSlotCommand(`move ${move.index} +${aliveFoes[0].idx + 1}`);
      return;
    }

    setPendingTargetMove({ move, mode: 'foe' });
  };

  const handleUndoDoubleSlot = () => {
    setPendingTargetMove(null);
    if (slotCursor > 0 && queuedCommands.length > 0) {
      setSlotCursor(0);
      setQueuedCommands([]);
      setReservedSwitchSlots([]);
    }
  };

  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-slate-950 p-6 text-center">
        <p className="text-lg font-bold text-rose-400">
          Error al inicializar el combate
        </p>
        <p className="mt-2 max-w-md text-sm text-slate-300">{error}</p>
        <button
          onClick={onExitToChapters}
          className="mt-6 rounded-xl bg-amber-500 px-5 py-2.5 text-sm font-bold text-slate-950 cursor-pointer"
        >
          Volver a Capítulos
        </button>
      </div>
    );
  }

  if (!snapshot) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-amber-300">
        Inicializando motor @pkmn/sim...
      </div>
    );
  }

  const currentSlot = snapshot.pendingSlots[slotCursor] ?? null;
  const availableSwitches = snapshot.p1.party.filter(
    (p) => !p.active && !p.fainted && !reservedSwitchSlots.includes(p.slotIndex)
  );

  const renderMonCard = (
    mon: PartyPokemonState | null,
    side: 'p1' | 'p2',
    slotIdx: number
  ) => {
    if (!mon) {
      return (
        <div className="flex h-44 w-56 items-center justify-center rounded-2xl border border-dashed border-slate-700/60 bg-slate-950/30 text-xs text-slate-500">
          Slot vacío
        </div>
      );
    }

    const cue = snapshot.lastCue;
    const isHit = cue?.targetSide === side && cue?.targetSlot === slotIdx;
    const isAttacking =
      cue?.attackerSide === side && cue?.attackerSlot === slotIdx;
    const showCallout = isHit && cue?.callout;

    const statusBadge = mon.status ? STATUS_BADGE_STYLES[mon.status] : null;
    const activeBoosts = Object.entries(mon.boosts).filter(([, v]) => v !== 0);

    return (
      <div
        className={`relative flex w-full max-w-[19rem] flex-col items-center transition-opacity duration-300 ${
          mon.fainted ? 'opacity-35 grayscale' : 'opacity-100'
        }`}
      >
        {/* Callout Pill */}
        {showCallout && (
          <div
            key={cue.id}
            className={`animate-fade-in-up absolute -top-3 z-30 rounded-full px-3 py-1 text-[11px] font-extrabold tracking-wider shadow-lg ${
              cue.calloutTone === 'super'
                ? 'bg-amber-400 text-slate-950'
                : cue.calloutTone === 'crit'
                  ? 'bg-rose-500 text-white'
                  : 'bg-slate-800 text-slate-200 border border-slate-600'
            }`}
          >
            {cue.callout}
          </div>
        )}

        {/* Info Nameplate */}
        <div
          className={`w-full rounded-2xl border bg-slate-950/88 p-3 shadow-xl backdrop-blur-md ${
            side === 'p1' ? 'border-amber-400/35' : 'border-rose-400/35'
          }`}
        >
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-bold text-white">{mon.name}</span>
                {statusBadge && (
                  <span
                    className={`rounded px-1.5 py-0.5 text-[10px] font-extrabold ${statusBadge.cls}`}
                  >
                    {statusBadge.label}
                  </span>
                )}
              </div>
              <div className="mt-1 flex flex-wrap gap-1">
                {mon.types.map((t) => (
                  <span
                    key={t}
                    className={`rounded border px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider ${getTypeBadgeClass(t)}`}
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>

            <span className="font-mono-code rounded-lg bg-slate-900 px-2 py-0.5 text-[11px] font-semibold text-slate-300">
              Nv.{mon.level}
            </span>
          </div>

          {/* HP Bar */}
          <div className="mt-2.5">
            <div className="mb-1 flex items-center justify-between text-[11px]">
              <span className="font-semibold text-slate-400">PS</span>
              <span className="font-mono-code font-bold text-slate-200">
                {side === 'p1'
                  ? `${mon.hp} / ${mon.maxhp} (${mon.hpPercent}%)`
                  : `${mon.hpPercent}%`}
              </span>
            </div>
            <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-800">
              <div
                className={`h-full rounded-full transition-all duration-500 ${hpBarColor(mon.hpPercent)}`}
                style={{ width: `${mon.hpPercent}%` }}
              />
            </div>
          </div>

          {/* Item / Ability / Boosts */}
          <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[10px] text-slate-400">
            {mon.ability && (
              <span className="rounded bg-slate-900 px-1.5 py-0.5 text-slate-300">
                {mon.ability}
              </span>
            )}
            {mon.item && side === 'p1' && (
              <span className="rounded bg-amber-500/15 px-1.5 py-0.5 text-amber-200">
                @ {mon.item}
              </span>
            )}
            {activeBoosts.map(([stat, val]) => (
              <span
                key={stat}
                className={`font-mono-code rounded px-1.5 py-0.5 font-bold ${
                  val > 0
                    ? 'bg-emerald-500/20 text-emerald-300'
                    : 'bg-rose-500/20 text-rose-300'
                }`}
              >
                {stat.toUpperCase()} {val > 0 ? `+${val}` : val}
              </span>
            ))}
          </div>
        </div>

        {/* Animated Sprite */}
        <div
          key={`${mon.ident}-${isHit ? cue?.id : 'idle'}`}
          className={`mt-2 flex h-32 items-center justify-center sm:h-36 ${
            isHit
              ? 'animate-hit-shake'
              : isAttacking
                ? side === 'p1'
                  ? 'animate-lunge-right'
                  : 'animate-lunge-left'
                : 'animate-float-slow'
          }`}
        >
          <PokemonSprite
            species={mon.species}
            side={side}
            className={side === 'p1' ? 'h-32 w-32 sm:h-36 sm:w-36' : 'h-28 w-28 sm:h-32 sm:w-32'}
          />
        </div>
      </div>
    );
  };

  return (
    <div className="relative flex min-h-screen flex-col bg-[#060a14] text-slate-100">
      <SceneBackdrop theme={config.arenaTheme} className="opacity-70" />

      {/* Top Battle HUD */}
      <header className="relative z-20 flex flex-wrap items-center justify-between gap-3 border-b border-white/10 bg-slate-950/80 px-4 py-3 backdrop-blur-md sm:px-6">
        <div className="flex items-center gap-3">
          <button
            onClick={onExitToChapters}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs font-semibold text-slate-300 transition hover:border-amber-400/50 hover:text-white cursor-pointer"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Salir
          </button>

          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono-code rounded-lg border border-amber-400/35 bg-amber-500/15 px-2.5 py-1 text-xs font-bold text-amber-200">
              TURNO {snapshot.turn}
            </span>
            <span className="rounded-lg border border-slate-700 bg-slate-900 px-2.5 py-1 text-xs font-semibold text-slate-300">
              {snapshot.format === 'doubles' ? 'Dobles 2v2' : 'Individuales'}
            </span>
            {snapshot.weather && (
              <span className="inline-flex items-center gap-1 rounded-lg border border-sky-400/35 bg-sky-500/15 px-2.5 py-1 text-xs font-semibold text-sky-200">
                <CloudSun className="h-3.5 w-3.5" />
                {snapshot.weather}
              </span>
            )}
          </div>
        </div>

        {/* KO Counter & Controls */}
        <div className="flex items-center gap-2.5">
          <div className="inline-flex items-center gap-2 rounded-xl border border-rose-400/35 bg-rose-500/15 px-3 py-1.5 text-xs font-bold text-rose-200">
            <Flame className="h-3.5 w-3.5 text-rose-400" />
            Rivales derrotados: {snapshot.koCountP2} / {snapshot.totalP2}
          </div>

          <button
            onClick={() => setShowPasteModal(true)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:border-sky-400/40 hover:text-white cursor-pointer"
          >
            <Code2 className="h-3.5 w-3.5" />
            Paste
          </button>

          <button
            onClick={startBattle}
            title="Reiniciar combate"
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:border-amber-400/40 hover:text-white cursor-pointer"
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </button>
        </div>
      </header>

      {/* Main Arena + Bottom Console */}
      <div className="relative z-10 mx-auto flex w-full max-w-6xl flex-1 flex-col justify-between gap-4 px-4 py-4 sm:px-6">
        {/* Battlefield Stage */}
        <div className="relative rounded-3xl border border-white/10 bg-slate-950/55 p-4 shadow-2xl backdrop-blur-sm sm:p-6">
          {/* Rival Party Strip */}
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-3">
            <div className="flex items-center gap-2">
              <Swords className="h-4 w-4 text-rose-400" />
              <span className="text-xs font-bold uppercase tracking-wider text-rose-200">
                {config.rivalName}
              </span>
              <span className="text-xs text-slate-400">
                · {config.rivalTitle}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              {snapshot.p2.party.map((mon) => (
                <div
                  key={mon.ident}
                  title={`${mon.name} (${mon.fainted ? 'Debilitado' : `${mon.hpPercent}%`})`}
                  className={`inline-flex items-center gap-1 rounded-lg border px-1.5 py-0.5 text-[10px] font-semibold transition ${
                    mon.fainted
                      ? 'border-slate-800 bg-slate-900/60 text-slate-500 line-through opacity-50'
                      : mon.active
                        ? 'border-rose-400/60 bg-rose-500/20 text-rose-200'
                        : 'border-slate-700 bg-slate-900 text-slate-300'
                  }`}
                >
                  <PokemonIcon species={mon.species} className="scale-75" />
                  <span className="hidden sm:inline">{mon.name}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Active Combatants Layout */}
          <div className="grid items-center gap-6 lg:grid-cols-2">
            {/* Player Side (Left / Bottom-Left) */}
            <div className="order-2 lg:order-1">
              <div className="mb-2 flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-amber-300">
                <Shield className="h-3.5 w-3.5" />
                Tu Equipo ({config.playerName})
                {snapshot.p1.sideConditions.map((sc) => (
                  <span
                    key={sc}
                    className="rounded bg-amber-500/20 px-2 py-0.5 text-[10px] text-amber-200"
                  >
                    {sc}
                  </span>
                ))}
              </div>
              <div
                className={`flex flex-wrap justify-center gap-4 ${
                  snapshot.format === 'doubles' ? 'sm:flex-nowrap' : ''
                }`}
              >
                {snapshot.p1.active.map((mon, idx) => (
                  <React.Fragment key={`p1-slot-${idx}`}>
                    {renderMonCard(mon, 'p1', idx)}
                  </React.Fragment>
                ))}
              </div>
            </div>

            {/* Rival Side (Right / Top-Right) */}
            <div className="order-1 lg:order-2">
              <div className="mb-2 flex items-center justify-end gap-2 text-[11px] font-bold uppercase tracking-wider text-rose-300">
                {snapshot.p2.sideConditions.map((sc) => (
                  <span
                    key={sc}
                    className="rounded bg-rose-500/20 px-2 py-0.5 text-[10px] text-rose-200"
                  >
                    {sc}
                  </span>
                ))}
                Rival Activo
                <Swords className="h-3.5 w-3.5" />
              </div>
              <div
                className={`flex flex-wrap justify-center gap-4 ${
                  snapshot.format === 'doubles' ? 'sm:flex-nowrap' : ''
                }`}
              >
                {snapshot.p2.active.map((mon, idx) => (
                  <React.Fragment key={`p2-slot-${idx}`}>
                    {renderMonCard(mon, 'p2', idx)}
                  </React.Fragment>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Command Deck & Battle Log */}
        <div className="grid gap-4 lg:grid-cols-12">
          {/* Action Console */}
          <div className="rounded-3xl border border-slate-800 bg-slate-950/90 p-5 shadow-xl lg:col-span-7">
            {/* Ended Banner */}
            {snapshot.status === 'ended' ? (
              <div className="flex flex-col items-center justify-center py-6 text-center">
                <div
                  className={`mb-3 flex h-14 w-14 items-center justify-center rounded-2xl ${
                    snapshot.winner === 'p1'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-400/40'
                      : 'bg-rose-500/20 text-rose-300 border border-rose-400/40'
                  }`}
                >
                  <Trophy className="h-7 w-7" />
                </div>
                <h2 className="font-display text-2xl font-bold text-white">
                  {snapshot.winner === 'p1'
                    ? '¡Victoria de la Corona!'
                    : 'Derrota en Combate'}
                </h2>
                <p className="mt-1 text-sm text-slate-300">
                  Combate finalizado en {snapshot.turn} turno
                  {snapshot.turn === 1 ? '' : 's'} · {snapshot.koCountP2} /{' '}
                  {snapshot.totalP2} rivales derrotados.
                </p>
                <div className="mt-5 flex flex-wrap justify-center gap-3">
                  <button
                    onClick={() =>
                      onBattleComplete(snapshot.winner === 'p1', snapshot)
                    }
                    className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-amber-500 to-yellow-500 px-6 py-3 text-sm font-bold text-slate-950 shadow-lg shadow-amber-500/25 transition hover:brightness-110 cursor-pointer"
                  >
                    <Sparkles className="h-4 w-4" />
                    Continuar al Epílogo
                    <ChevronRight className="h-4 w-4" />
                  </button>
                  <button
                    onClick={startBattle}
                    className="inline-flex items-center gap-2 rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm font-semibold text-slate-200 hover:border-amber-400/40 cursor-pointer"
                  >
                    <RefreshCw className="h-4 w-4" />
                    Repetir Combate
                  </button>
                </div>
              </div>
            ) : snapshot.status !== 'awaiting-choice' || !currentSlot ? (
              <div className="flex h-44 items-center justify-center text-sm text-slate-400">
                Resolviendo turno en @pkmn/sim...
              </div>
            ) : pendingTargetMove ? (
              /* Doubles Target Picker */
              <div>
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-sm font-bold text-amber-200">
                    Elige objetivo para{' '}
                    <span className="text-white">{pendingTargetMove.move.name}</span>{' '}
                    ({currentSlot.pokemon.name})
                  </p>
                  <button
                    onClick={() => setPendingTargetMove(null)}
                    className="rounded-lg border border-slate-700 px-2.5 py-1 text-xs text-slate-300 hover:text-white cursor-pointer"
                  >
                    ← Volver
                  </button>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  {snapshot.p2.active.map((foe, idx) => {
                    if (!foe || foe.fainted) return null;
                    return (
                      <button
                        key={foe.ident}
                        onClick={() =>
                          commitSlotCommand(
                            `move ${pendingTargetMove.move.index} +${idx + 1}`
                          )
                        }
                        className="flex items-center justify-between rounded-2xl border border-rose-400/40 bg-rose-500/10 p-4 text-left transition hover:border-rose-400 hover:bg-rose-500/20 cursor-pointer"
                      >
                        <div className="flex items-center gap-2.5">
                          <PokemonIcon species={foe.species} />
                          <div>
                            <p className="text-sm font-bold text-white">
                              {foe.name}
                            </p>
                            <p className="text-xs text-rose-200">
                              PS: {foe.hpPercent}% · Slot Rival {idx + 1}
                            </p>
                          </div>
                        </div>
                        <ChevronRight className="h-4 w-4 text-rose-300" />
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : currentSlot.forceSwitch ? (
              /* Forced Switch Panel */
              <div>
                <p className="mb-3 text-sm font-bold text-amber-300">
                  ¡{currentSlot.pokemon.name} se debilitó! Elige qué Pokémon entra
                  en su lugar:
                </p>
                <div className="grid gap-2.5 sm:grid-cols-2">
                  {availableSwitches.map((mon) => (
                    <button
                      key={mon.ident}
                      onClick={() =>
                        commitSlotCommand(`switch ${mon.slotIndex}`, mon.slotIndex)
                      }
                      className="flex items-center justify-between rounded-2xl border border-sky-400/40 bg-sky-500/10 p-3.5 text-left transition hover:border-sky-300 hover:bg-sky-500/20 cursor-pointer"
                    >
                      <div className="flex items-center gap-2.5">
                        <PokemonIcon species={mon.species} />
                        <div>
                          <p className="text-sm font-bold text-white">
                            {mon.name}
                          </p>
                          <p className="text-xs text-slate-300">
                            PS: {mon.hp}/{mon.maxhp} ({mon.hpPercent}%)
                          </p>
                        </div>
                      </div>
                      <ChevronRight className="h-4 w-4 text-sky-300" />
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              /* Standard Move + Switch Panel */
              <div>
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <PokemonIcon species={currentSlot.pokemon.species} />
                    <span className="text-sm font-bold text-white">
                      ¿Qué hará{' '}
                      <span className="text-amber-300">
                        {currentSlot.pokemon.name}
                      </span>
                      ?
                    </span>
                    {snapshot.format === 'doubles' && (
                      <span className="rounded-md bg-slate-800 px-2 py-0.5 text-[10px] font-semibold text-slate-300">
                        Slot {currentSlot.activeIndex + 1} de{' '}
                        {snapshot.pendingSlots.length}
                      </span>
                    )}
                  </div>

                  {slotCursor > 0 && (
                    <button
                      onClick={handleUndoDoubleSlot}
                      className="rounded-lg border border-slate-700 px-2.5 py-1 text-xs text-slate-300 hover:text-white cursor-pointer"
                    >
                      ← Deshacer Slot 1
                    </button>
                  )}
                </div>

                {/* 2x2 Moves Grid */}
                <div className="grid gap-2.5 sm:grid-cols-2">
                  {currentSlot.moves.map((mv) => {
                    const cat = categoryBadge(mv.category);
                    return (
                      <button
                        key={mv.id}
                        disabled={mv.disabled}
                        onClick={() => handleMoveClick(mv)}
                        title={mv.shortDesc}
                        className="group flex flex-col justify-between rounded-2xl border border-slate-700/90 bg-slate-900/90 p-3.5 text-left transition hover:border-amber-400/70 hover:bg-slate-800/90 disabled:cursor-not-allowed disabled:opacity-35 active:scale-[0.98] cursor-pointer"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-sm font-bold text-white group-hover:text-amber-200">
                            {mv.name}
                          </span>
                          <span className="font-mono-code text-[11px] text-slate-400">
                            PP {mv.pp}/{mv.maxpp}
                          </span>
                        </div>

                        <div className="mt-2 flex flex-wrap items-center gap-1.5">
                          <span
                            className={`rounded border px-1.5 py-0.5 text-[10px] font-bold uppercase ${getTypeBadgeClass(mv.type)}`}
                          >
                            {mv.type}
                          </span>
                          <span
                            className={`rounded border px-1.5 py-0.5 text-[10px] font-semibold ${cat.cls}`}
                          >
                            {cat.label}
                          </span>
                          {mv.basePower > 0 && (
                            <span className="font-mono-code rounded bg-slate-950 px-1.5 py-0.5 text-[10px] font-semibold text-amber-200">
                              BP {mv.basePower}
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Optional Switch Bar */}
                {!currentSlot.trapped && availableSwitches.length > 0 && (
                  <div className="mt-3.5 border-t border-slate-800/80 pt-3">
                    <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                      Cambiar Pokémon
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {availableSwitches.map((mon) => (
                        <button
                          key={mon.ident}
                          onClick={() =>
                            commitSlotCommand(
                              `switch ${mon.slotIndex}`,
                              mon.slotIndex
                            )
                          }
                          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs font-semibold text-slate-200 transition hover:border-sky-400/60 hover:bg-sky-500/15 cursor-pointer"
                        >
                          <PokemonIcon species={mon.species} className="scale-75" />
                          <span>{mon.name}</span>
                          <span className="font-mono-code text-[10px] text-emerald-300">
                            {mon.hpPercent}%
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Live Battle Log */}
          <div className="flex max-h-72 flex-col rounded-3xl border border-slate-800 bg-slate-950/90 p-4 shadow-xl lg:col-span-5">
            <div className="mb-2 flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Registro del Combate (@pkmn/sim)
              </span>
              <span className="font-mono-code text-[10px] text-slate-500">
                {config.formatId}
              </span>
            </div>
            <div className="flex-1 space-y-1.5 overflow-y-auto pr-1 text-xs">
              {snapshot.log.map((entry) => {
                const colorClass =
                  entry.kind === 'turn'
                    ? 'mt-2 border-t border-slate-800 pt-1.5 font-bold text-amber-300'
                    : entry.kind === 'faint'
                      ? 'font-bold text-rose-400'
                      : entry.kind === 'effective'
                        ? 'font-semibold text-amber-200'
                        : entry.kind === 'win'
                          ? 'rounded-lg bg-amber-500/15 p-2 font-bold text-amber-200'
                          : entry.kind === 'move'
                            ? 'text-white font-medium'
                            : entry.kind === 'switch'
                              ? 'text-sky-300'
                              : 'text-slate-400';

                return (
                  <p key={entry.id} className={colorClass}>
                    {entry.text}
                  </p>
                );
              })}
              <div ref={logEndRef} />
            </div>
          </div>
        </div>
      </div>

      {/* Showdown Paste Modal */}
      {showPasteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
          <div className="w-full max-w-3xl rounded-3xl border border-slate-700 bg-slate-950 p-6 shadow-2xl">
            <div className="mb-4 flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-display text-lg font-bold text-amber-200">
                Equipos Inyectados en esta Batalla (Showdown Paste)
              </h3>
              <button
                onClick={() => setShowPasteModal(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <p className="mb-1.5 text-xs font-bold text-amber-300">
                  {config.playerName}
                </p>
                <pre className="font-mono-code max-h-80 overflow-auto rounded-xl border border-slate-800 bg-black/60 p-3 text-[11px] text-slate-200">
                  {config.playerShowdownPaste}
                </pre>
              </div>
              <div>
                <p className="mb-1.5 text-xs font-bold text-rose-300">
                  {config.rivalName}
                </p>
                <pre className="font-mono-code max-h-80 overflow-auto rounded-xl border border-slate-800 bg-black/60 p-3 text-[11px] text-slate-200">
                  {config.rivalShowdownPaste}
                </pre>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
