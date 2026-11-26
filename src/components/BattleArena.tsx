import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  ChevronRight,
  CloudSun,
  Code2,
  Cpu,
  Crown,
  Eye,
  EyeOff,
  Flame,
  RefreshCw,
  Sparkles,
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
import { CharacterPortrait } from './CharacterPortrait';
import { MoveTooltip } from './MoveTooltip';
import { PokemonIcon, PokemonSprite } from './PokemonSprite';
import { PokemonTooltip } from './PokemonTooltip';
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

const MOVE_TYPE_ACCENT: Record<string, string> = {
  Normal: 'border-l-stone-400',
  Fire: 'border-l-orange-400',
  Water: 'border-l-sky-400',
  Electric: 'border-l-yellow-400',
  Grass: 'border-l-emerald-400',
  Ice: 'border-l-cyan-300',
  Fighting: 'border-l-red-500',
  Poison: 'border-l-purple-400',
  Ground: 'border-l-amber-500',
  Flying: 'border-l-indigo-300',
  Psychic: 'border-l-pink-400',
  Bug: 'border-l-lime-400',
  Rock: 'border-l-yellow-600',
  Ghost: 'border-l-violet-400',
  Dragon: 'border-l-indigo-500',
  Dark: 'border-l-zinc-400',
  Steel: 'border-l-slate-300',
  Fairy: 'border-l-rose-300',
};

const UnrevealedPokeballSvg: React.FC<{ className?: string }> = ({
  className = 'h-5 w-5',
}) => (
  <svg viewBox="0 0 24 24" className={className} fill="none">
    <circle
      cx="12"
      cy="12"
      r="9.5"
      stroke="#fb7185"
      strokeOpacity="0.55"
      strokeWidth="1.6"
    />
    <path
      d="M2.6 12h18.8"
      stroke="#fb7185"
      strokeOpacity="0.55"
      strokeWidth="1.6"
    />
    <path
      d="M12 2.5A9.5 9.5 0 0 1 21.5 12h-6.2a3.3 3.3 0 0 0-6.6 0H2.5A9.5 9.5 0 0 1 12 2.5Z"
      fill="#be123c"
      fillOpacity="0.45"
    />
    <circle
      cx="12"
      cy="12"
      r="2.7"
      fill="#0f172a"
      stroke="#fb7185"
      strokeWidth="1.5"
    />
  </svg>
);

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
  const [revealRivalPasteInModal, setRevealRivalPasteInModal] = useState(false);

  // Multi-slot decision queue + Terastallize toggle
  const [slotCursor, setSlotCursor] = useState(0);
  const [queuedCommands, setQueuedCommands] = useState<string[]>([]);
  const [reservedSwitchSlots, setReservedSwitchSlots] = useState<number[]>([]);
  const [teraQueuedInTurn, setTeraQueuedInTurn] = useState(false);
  const [wantTera, setWantTera] = useState(false);
  const [pendingTargetMove, setPendingTargetMove] = useState<{
    move: ActiveMoveOption;
    mode: 'foe' | 'ally';
    tera: boolean;
  } | null>(null);

  const startBattle = () => {
    controllerRef.current?.destroy();
    setError(null);
    setSlotCursor(0);
    setQueuedCommands([]);
    setReservedSwitchSlots([]);
    setTeraQueuedInTurn(false);
    setWantTera(false);
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

  const requestKey = useMemo(() => {
    if (!snapshot) return '';
    return `${snapshot.turn}-${snapshot.status}-${snapshot.isForceSwitch}-${snapshot.pendingSlots.length}`;
  }, [snapshot]);

  useEffect(() => {
    if (!snapshot || snapshot.status !== 'awaiting-choice') return;
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
    setTeraQueuedInTurn(false);
    setWantTera(false);
    setPendingTargetMove(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requestKey]);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [snapshot?.log.length]);

  const commitSlotCommand = (
    cmd: string,
    switchSlotUsed?: number,
    usedTera = false
  ) => {
    if (!snapshot || !controllerRef.current) return;
    const nextCmds = [...queuedCommands, cmd];
    const nextReserved =
      switchSlotUsed != null
        ? [...reservedSwitchSlots, switchSlotUsed]
        : reservedSwitchSlots;
    const nextTeraQueued = teraQueuedInTurn || usedTera;

    let nextIdx = slotCursor + 1;
    while (
      nextIdx < snapshot.pendingSlots.length &&
      snapshot.pendingSlots[nextIdx].pass
    ) {
      nextCmds.push('pass');
      nextIdx++;
    }

    setPendingTargetMove(null);
    setWantTera(false);

    if (nextIdx >= snapshot.pendingSlots.length) {
      setQueuedCommands([]);
      setReservedSwitchSlots([]);
      setTeraQueuedInTurn(false);
      setSlotCursor(0);
      void controllerRef.current.submitPlayerChoice(nextCmds.join(', '));
    } else {
      setQueuedCommands(nextCmds);
      setReservedSwitchSlots(nextReserved);
      setTeraQueuedInTurn(nextTeraQueued);
      setSlotCursor(nextIdx);
    }
  };

  const handleMoveClick = (move: ActiveMoveOption) => {
    if (!snapshot) return;
    const useTera = wantTera && !teraQueuedInTurn;
    const teraSuffix = useTera ? ' terastallize' : '';
    const targetMode = formatNeedsTarget(snapshot.format, move.target);

    if (targetMode === 'none') {
      commitSlotCommand(`move ${move.index}${teraSuffix}`, undefined, useTera);
      return;
    }

    if (targetMode === 'ally') {
      const activeIdx = snapshot.pendingSlots[slotCursor]?.activeIndex ?? 0;
      const allyIdx = activeIdx === 0 ? 1 : 0;
      commitSlotCommand(
        `move ${move.index} -${allyIdx + 1}${teraSuffix}`,
        undefined,
        useTera
      );
      return;
    }

    const aliveFoes = snapshot.p2.active
      .map((m, idx) => ({ m, idx }))
      .filter(({ m }) => m && !m.fainted);

    if (aliveFoes.length === 1) {
      commitSlotCommand(
        `move ${move.index} +${aliveFoes[0].idx + 1}${teraSuffix}`,
        undefined,
        useTera
      );
      return;
    }

    setPendingTargetMove({ move, mode: 'foe', tera: useTera });
  };

  const handleUndoDoubleSlot = () => {
    setPendingTargetMove(null);
    setWantTera(false);
    setTeraQueuedInTurn(false);
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
  const canTeraNow = Boolean(currentSlot?.canTerastallize) && !teraQueuedInTurn;

  const renderActiveFighter = (
    mon: PartyPokemonState | null,
    side: 'p1' | 'p2',
    slotIdx: number
  ) => {
    if (!mon) {
      return (
        <div className="flex h-36 w-36 items-center justify-center rounded-2xl border border-dashed border-slate-700/40 bg-slate-950/20 text-[11px] text-slate-600">
          Vacío
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
      <PokemonTooltip
        mon={mon}
        side={side}
        placement={side === 'p2' ? 'bottom' : 'top'}
      >
        <div
          tabIndex={0}
          className={`group relative flex flex-col items-center rounded-2xl px-2 py-1 outline-none transition-all duration-300 focus-visible:ring-2 focus-visible:ring-amber-400/70 ${
            mon.fainted ? 'opacity-30 grayscale' : 'opacity-100'
          }`}
        >
          {showCallout && (
            <div
              key={cue.id}
              className={`animate-fade-in-up absolute -top-5 z-30 whitespace-nowrap rounded-full px-2.5 py-0.5 text-[10px] font-extrabold tracking-wider shadow-lg ${
                cue.calloutTone === 'super'
                  ? 'bg-amber-400 text-slate-950'
                  : cue.calloutTone === 'crit'
                    ? 'bg-rose-500 text-white'
                    : 'border border-slate-600 bg-slate-900 text-slate-200'
              }`}
            >
              {cue.callout}
            </div>
          )}

          {/* Compact Showdown HP Bar above sprite */}
          <div
            className={`w-44 rounded-xl border bg-slate-950/90 px-2.5 py-1.5 shadow-lg backdrop-blur-md transition group-hover:border-amber-400/70 sm:w-48 ${
              mon.terastallized
                ? 'border-cyan-400/75 ring-1 ring-cyan-400/30'
                : side === 'p1'
                  ? 'border-amber-400/35'
                  : 'border-rose-400/35'
            }`}
          >
            <div className="flex items-center justify-between gap-1 text-[11px]">
              <div className="flex min-w-0 items-center gap-1">
                <span className="truncate font-bold text-white">{mon.name}</span>
                {mon.gender && (
                  <span
                    className={`text-[10px] font-bold ${
                      mon.gender === 'M' ? 'text-sky-400' : 'text-pink-400'
                    }`}
                  >
                    {mon.gender === 'M' ? '♂' : '♀'}
                  </span>
                )}
                {mon.terastallized && (
                  <span className="rounded bg-cyan-500/25 px-1 text-[9px] font-extrabold text-cyan-200">
                    ✦{mon.terastallized}
                  </span>
                )}
                {mon.isBossAce && (
                  <Crown
                    className="h-3 w-3 shrink-0 text-amber-400"
                    aria-label="Boss Ace"
                  />
                )}
              </div>
              <span className="font-mono-code shrink-0 text-[10px] font-semibold text-amber-200/90">
                L{mon.level}
              </span>
            </div>

            <div className="mt-1 flex items-center gap-1.5">
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-800 ring-1 ring-white/10">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${hpBarColor(mon.hpPercent)}`}
                  style={{ width: `${mon.hpPercent}%` }}
                />
              </div>
              <span className="font-mono-code w-9 text-right text-[10px] font-bold text-slate-200">
                {mon.hpPercent}%
              </span>
            </div>

            {(statusBadge ||
              activeBoosts.length > 0 ||
              mon.volatiles.length > 0) && (
              <div className="mt-1 flex flex-wrap items-center gap-1">
                {statusBadge && (
                  <span
                    className={`rounded px-1 text-[9px] font-extrabold ${statusBadge.cls}`}
                  >
                    {statusBadge.label}
                  </span>
                )}
                {activeBoosts.slice(0, 3).map(([st, val]) => (
                  <span
                    key={st}
                    className={`font-mono-code rounded px-1 text-[9px] font-bold ${
                      val > 0
                        ? 'bg-emerald-500/25 text-emerald-300'
                        : 'bg-rose-500/25 text-rose-300'
                    }`}
                  >
                    {val > 0 ? `+${val}` : val} {st}
                  </span>
                ))}
                {mon.volatiles.slice(0, 2).map((vol) => (
                  <span
                    key={vol}
                    className="rounded bg-violet-500/25 px-1 text-[9px] font-semibold text-violet-200"
                  >
                    {vol}
                  </span>
                ))}
              </div>
            )}
          </div>

          <div
            key={`${mon.ident}-${isHit ? cue?.id : 'idle'}`}
            className={`mt-1 flex items-center justify-center ${
              snapshot.format === 'doubles'
                ? 'h-24 w-28 sm:h-28 sm:w-32'
                : 'h-28 w-32 sm:h-36 sm:w-40'
            } ${
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
              className="max-h-full max-w-full"
            />
          </div>
        </div>
      </PokemonTooltip>
    );
  };

  const playerTeamSlots = Array.from(
    { length: Math.max(6, snapshot.p1.party.length) },
    (_, i) => snapshot.p1.party[i] ?? null
  ).slice(0, 6);

  const rivalSlotCount = Math.max(snapshot.totalP2, snapshot.p2.party.length);
  const rivalTeamSlots = Array.from(
    { length: Math.max(6, rivalSlotCount) },
    (_, i) => ({
      exists: i < rivalSlotCount,
      mon: snapshot.p2.party[i] ?? null,
    })
  ).slice(0, 6);

  return (
    <div className="flex min-h-screen flex-col bg-[#060a14] text-slate-100 lg:h-screen lg:overflow-hidden">
      {/* Top HUD Bar */}
      <header className="relative z-30 flex shrink-0 flex-wrap items-center justify-between gap-2.5 border-b border-amber-400/20 bg-slate-950/95 px-4 py-2.5 backdrop-blur-md">
        <div className="flex items-center gap-2.5">
          <button
            onClick={onExitToChapters}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs font-semibold text-slate-300 transition hover:border-amber-400/50 hover:text-white cursor-pointer"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Salir
          </button>

          <span className="font-mono-code rounded-lg border border-amber-400/35 bg-amber-500/15 px-2.5 py-1 text-xs font-bold text-amber-200">
            TURNO {snapshot.turn}
          </span>
          <span className="hidden rounded-lg border border-slate-700 bg-slate-900 px-2.5 py-1 text-xs font-semibold text-slate-300 sm:inline-flex">
            {snapshot.format === 'doubles' ? 'Dobles 2v2' : 'Individuales'}
          </span>
          {snapshot.weather && (
            <span className="inline-flex items-center gap-1 rounded-lg border border-sky-400/35 bg-sky-500/15 px-2.5 py-1 text-xs font-semibold text-sky-200">
              <CloudSun className="h-3.5 w-3.5" />
              {snapshot.weather}
            </span>
          )}
          {snapshot.terrain && (
            <span className="inline-flex items-center gap-1 rounded-lg border border-emerald-400/35 bg-emerald-500/15 px-2.5 py-1 text-xs font-semibold text-emerald-200">
              {snapshot.terrain}
            </span>
          )}
        </div>

        {/* Right HUD */}
        <div className="flex items-center gap-2">
          <div className="inline-flex items-center gap-1.5 rounded-xl border border-rose-400/35 bg-rose-500/15 px-3 py-1.5 text-xs font-bold text-rose-200">
            <Flame className="h-3.5 w-3.5 text-rose-400" />
            Rivales derrotados: {snapshot.koCountP2} / {snapshot.totalP2}
          </div>

          <button
            onClick={() => {
              setRevealRivalPasteInModal(false);
              setShowPasteModal(true);
            }}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:border-sky-400/50 hover:text-white cursor-pointer"
          >
            <Code2 className="h-3.5 w-3.5" />
            Paste
          </button>

          <button
            onClick={startBattle}
            title="Reiniciar combate"
            className="inline-flex items-center justify-center rounded-xl border border-slate-700 bg-slate-900 p-1.5 text-slate-300 hover:border-amber-400/50 hover:text-white cursor-pointer"
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </button>
        </div>
      </header>

      {/* Showdown 2-Column Workspace */}
      <div className="grid flex-1 grid-cols-1 lg:min-h-0 lg:grid-cols-12">
        {/* LEFT COLUMN (~65% = 8 cols): Arena + Scripted Taunt + Action Console */}
        <div className="flex flex-col gap-3 p-3 sm:p-4 lg:col-span-8 lg:min-h-0 lg:overflow-y-auto">
          {/* 1. BATTLEFIELD STAGE */}
          <div className="relative overflow-hidden rounded-3xl border border-amber-400/25 bg-slate-950 shadow-2xl">
            <SceneBackdrop theme={config.arenaTheme} className="opacity-85" />

            {/* Top Overlay */}
            <div className="relative z-20 flex flex-wrap items-center justify-between gap-2 px-3 pt-3 sm:px-4">
              <div className="font-display rounded-xl border border-amber-400/55 bg-slate-950/90 px-3.5 py-1 text-xs font-extrabold tracking-wider text-amber-200 shadow-lg backdrop-blur-md">
                Turn {Math.max(1, snapshot.turn)}
              </div>

              <div className="flex flex-wrap items-center gap-1.5">
                {snapshot.terrain && (
                  <span className="rounded-lg border border-emerald-400/40 bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-200">
                    {snapshot.terrain}
                  </span>
                )}
                {snapshot.p1.sideConditions.map((sc) => (
                  <span
                    key={`p1-${sc}`}
                    className="rounded-lg border border-amber-400/40 bg-amber-500/20 px-2 py-0.5 text-[10px] font-bold text-amber-200"
                  >
                    Tu lado: {sc}
                  </span>
                ))}
                {snapshot.p2.sideConditions.map((sc) => (
                  <span
                    key={`p2-${sc}`}
                    className="rounded-lg border border-rose-400/40 bg-rose-500/20 px-2 py-0.5 text-[10px] font-bold text-rose-200"
                  >
                    Rival: {sc}
                  </span>
                ))}
              </div>
            </div>

            {/* 3-Zone Arena: Left Prince Sideline | Center Stage | Right Assassin Sideline */}
            <div className="relative z-10 flex min-h-[305px] items-stretch justify-between gap-2 px-2 pb-4 pt-2 sm:min-h-[345px] sm:px-4">
              {/* LEFT SIDELINE: Blonde Prince Portrait + 6 Team Icons */}
              <div className="flex w-24 shrink-0 flex-col items-center justify-center rounded-2xl border border-amber-400/20 bg-slate-950/65 px-1.5 py-2.5 backdrop-blur-sm sm:w-28">
                <div className="mb-1 h-20 w-20 overflow-hidden rounded-xl border border-amber-400/40 bg-gradient-to-b from-slate-900 to-slate-950 p-0.5 shadow-md">
                  <CharacterPortrait
                    charId={config.playerCharId}
                    variant="bust"
                    className="h-full w-full object-cover object-top"
                  />
                </div>
                <p className="mb-2 max-w-full truncate text-[10px] font-bold text-amber-200">
                  {config.playerName}
                </p>
                <div className="grid grid-cols-2 gap-1">
                  {playerTeamSlots.map((mon, idx) =>
                    mon ? (
                      <PokemonTooltip
                        key={mon.ident}
                        mon={mon}
                        side="p1"
                        placement="right"
                      >
                        <button
                          type="button"
                          className={`relative flex h-9 w-9 items-center justify-center rounded-lg border transition cursor-help ${
                            mon.fainted
                              ? 'border-slate-800 bg-slate-950/70 opacity-35 grayscale'
                              : mon.active
                                ? 'border-amber-400 bg-amber-500/20 shadow shadow-amber-500/20'
                                : 'border-slate-700/80 bg-slate-900/80 hover:border-amber-400/60'
                          }`}
                        >
                          <PokemonIcon species={mon.species} className="scale-75" />
                        </button>
                      </PokemonTooltip>
                    ) : (
                      <div
                        key={`p1-empty-${idx}`}
                        className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-800/40 bg-slate-950/25"
                      >
                        <span className="h-1.5 w-1.5 rounded-full bg-slate-800" />
                      </div>
                    )
                  )}
                </div>
              </div>

              {/* CENTER FIELD */}
              <div className="relative flex flex-1 flex-col justify-between py-1">
                <div className="flex flex-wrap items-start justify-end gap-2 pr-1 sm:gap-4 sm:pr-4">
                  {snapshot.p2.active.map((mon, idx) => (
                    <React.Fragment key={`p2-active-${idx}`}>
                      {renderActiveFighter(mon, 'p2', idx)}
                    </React.Fragment>
                  ))}
                </div>

                <div className="mt-1 flex flex-wrap items-end justify-start gap-2 pl-1 sm:gap-4 sm:pl-4">
                  {snapshot.p1.active.map((mon, idx) => (
                    <React.Fragment key={`p1-active-${idx}`}>
                      {renderActiveFighter(mon, 'p1', idx)}
                    </React.Fragment>
                  ))}
                </div>
              </div>

              {/* RIGHT SIDELINE: Crimson Assassin Portrait + 6 Fog-of-War Slots */}
              <div className="flex w-24 shrink-0 flex-col items-center justify-center rounded-2xl border border-rose-500/25 bg-slate-950/65 px-1.5 py-2.5 backdrop-blur-sm sm:w-28">
                <div className="mb-1 h-20 w-20 overflow-hidden rounded-xl border border-rose-500/45 bg-gradient-to-b from-slate-900 to-slate-950 p-0.5 shadow-md">
                  <CharacterPortrait
                    charId={config.rivalCharId}
                    variant="bust"
                    className="h-full w-full object-cover object-top"
                  />
                </div>
                <p className="mb-2 max-w-full truncate text-[10px] font-bold text-rose-200">
                  {config.rivalName}
                </p>
                <div className="grid grid-cols-2 gap-1">
                  {rivalTeamSlots.map((slot, idx) => {
                    if (!slot.exists) {
                      return (
                        <div
                          key={`p2-empty-${idx}`}
                          className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-800/40 bg-slate-950/25"
                        >
                          <span className="h-1.5 w-1.5 rounded-full bg-slate-800" />
                        </div>
                      );
                    }

                    const mon = slot.mon;
                    return (
                      <PokemonTooltip
                        key={mon ? mon.ident : `p2-hidden-${idx}`}
                        mon={mon}
                        side="p2"
                        placement="left"
                      >
                        <button
                          type="button"
                          className={`relative flex h-9 w-9 items-center justify-center rounded-lg border transition cursor-help ${
                            !mon
                              ? 'border-rose-500/25 bg-slate-950/80 hover:border-rose-400/60'
                              : mon.fainted
                                ? 'border-slate-800 bg-slate-950/70 opacity-35 grayscale'
                                : mon.active
                                  ? 'border-rose-400 bg-rose-500/20 shadow shadow-rose-500/20'
                                  : 'border-slate-700/80 bg-slate-900/80 hover:border-rose-400/60'
                          }`}
                        >
                          {mon ? (
                            <PokemonIcon
                              species={mon.species}
                              className="scale-75"
                            />
                          ) : (
                            <UnrevealedPokeballSvg className="h-5 w-5" />
                          )}
                        </button>
                      </PokemonTooltip>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* 1.5 SCRIPTED AI DIALOGUE TAUNT STRIP (fires when enemy scripted turn rule activates!) */}
          {snapshot.activeTaunt && (
            <div
              key={snapshot.activeTaunt.id}
              className="animate-fade-in-up flex items-center gap-3 rounded-2xl border border-rose-500/40 bg-gradient-to-r from-rose-950/70 via-slate-950/95 to-slate-950/95 px-3.5 py-2.5 shadow-lg"
            >
              <div className="h-11 w-11 shrink-0 overflow-hidden rounded-xl border border-rose-500/50 bg-slate-900 p-0.5">
                <CharacterPortrait
                  charId={snapshot.activeTaunt.charId}
                  variant="bust"
                  className="h-full w-full object-cover object-top"
                />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-rose-300">
                    {snapshot.activeTaunt.speaker}
                  </span>
                  <span className="inline-flex items-center gap-1 rounded bg-violet-500/20 px-1.5 py-0.5 text-[10px] font-semibold text-violet-200 border border-violet-400/30">
                    <Cpu className="h-2.5 w-2.5" />
                    Turno {snapshot.activeTaunt.turn} Scripteado
                  </span>
                </div>
                <p className="mt-0.5 text-xs italic text-slate-100">
                  {snapshot.activeTaunt.text}
                </p>
              </div>
            </div>
          )}

          {/* 2. ACTION PANEL */}
          <div className="rounded-3xl border border-slate-800 bg-slate-950/95 p-4 shadow-xl">
            {snapshot.status === 'ended' ? (
              <div className="flex flex-col items-center justify-center py-4 text-center">
                <div
                  className={`mb-2.5 flex h-12 w-12 items-center justify-center rounded-2xl border ${
                    snapshot.winner === 'p1'
                      ? 'border-amber-400/40 bg-amber-500/20 text-amber-300'
                      : 'border-rose-400/40 bg-rose-500/20 text-rose-300'
                  }`}
                >
                  <Trophy className="h-6 w-6" />
                </div>
                <h2 className="font-display text-xl font-bold text-white">
                  {snapshot.winner === 'p1'
                    ? '¡Victoria de la Corona!'
                    : 'Derrota en Combate'}
                </h2>
                <p className="mt-1 text-xs text-slate-300">
                  Finalizado en {snapshot.turn} turno
                  {snapshot.turn === 1 ? '' : 's'} · {snapshot.koCountP2} /{' '}
                  {snapshot.totalP2} rivales derrotados.
                </p>
                <div className="mt-4 flex flex-wrap justify-center gap-3">
                  <button
                    onClick={() =>
                      onBattleComplete(snapshot.winner === 'p1', snapshot)
                    }
                    className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-amber-500 to-yellow-500 px-6 py-2.5 text-sm font-bold text-slate-950 shadow-lg shadow-amber-500/25 transition hover:brightness-110 cursor-pointer"
                  >
                    <Sparkles className="h-4 w-4" />
                    Continuar al Epílogo
                    <ChevronRight className="h-4 w-4" />
                  </button>
                  <button
                    onClick={startBattle}
                    className="inline-flex items-center gap-2 rounded-2xl border border-slate-700 bg-slate-900 px-4 py-2.5 text-sm font-semibold text-slate-200 hover:border-amber-400/40 cursor-pointer"
                  >
                    <RefreshCw className="h-4 w-4" />
                    Repetir Combate
                  </button>
                </div>
              </div>
            ) : snapshot.status !== 'awaiting-choice' || !currentSlot ? (
              <div className="flex h-36 items-center justify-center text-sm text-slate-400">
                Resolviendo turno en @pkmn/sim...
              </div>
            ) : pendingTargetMove ? (
              <div>
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-sm font-bold text-amber-200">
                    Objetivo para{' '}
                    <span className="text-white">
                      {pendingTargetMove.move.name}
                    </span>
                    {pendingTargetMove.tera && (
                      <span className="ml-1.5 rounded bg-cyan-500/20 px-1.5 py-0.5 text-[10px] text-cyan-200">
                        ✦ Tera
                      </span>
                    )}{' '}
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
                      <PokemonTooltip
                        key={foe.ident}
                        mon={foe}
                        side="p2"
                        placement="top"
                      >
                        <button
                          onClick={() =>
                            commitSlotCommand(
                              `move ${pendingTargetMove.move.index} +${idx + 1}${
                                pendingTargetMove.tera ? ' terastallize' : ''
                              }`,
                              undefined,
                              pendingTargetMove.tera
                            )
                          }
                          className="flex w-full items-center justify-between rounded-2xl border border-rose-400/40 bg-rose-500/10 p-3.5 text-left transition hover:border-rose-400 hover:bg-rose-500/20 cursor-pointer"
                        >
                          <div className="flex items-center gap-2.5">
                            <PokemonIcon species={foe.species} />
                            <div>
                              <p className="text-sm font-bold text-white">
                                {foe.name}
                              </p>
                              <p className="text-xs text-rose-200">
                                PS: {foe.hpPercent}% · Rival {idx + 1}
                              </p>
                            </div>
                          </div>
                          <ChevronRight className="h-4 w-4 text-rose-300" />
                        </button>
                      </PokemonTooltip>
                    );
                  })}
                </div>
              </div>
            ) : currentSlot.forceSwitch ? (
              <div>
                <p className="mb-3 text-sm font-bold text-amber-300">
                  ¡{currentSlot.pokemon.name} se debilitó! Elige qué Pokémon entra
                  en su lugar:
                </p>
                <div className="grid gap-2.5 sm:grid-cols-2">
                  {availableSwitches.map((mon) => (
                    <PokemonTooltip
                      key={mon.ident}
                      mon={mon}
                      side="p1"
                      placement="top"
                    >
                      <button
                        onClick={() =>
                          commitSlotCommand(
                            `switch ${mon.slotIndex}`,
                            mon.slotIndex
                          )
                        }
                        className="flex w-full items-center justify-between rounded-2xl border border-sky-400/40 bg-sky-500/10 p-3 text-left transition hover:border-sky-300 hover:bg-sky-500/20 cursor-pointer"
                      >
                        <div className="flex items-center gap-2">
                          <PokemonIcon species={mon.species} />
                          <div>
                            <p className="text-sm font-bold text-white">
                              {mon.name}
                            </p>
                            <p className="font-mono-code text-xs text-slate-300">
                              PS {mon.hp}/{mon.maxhp} ({mon.hpPercent}%)
                            </p>
                          </div>
                        </div>
                        <ChevronRight className="h-4 w-4 text-sky-300" />
                      </button>
                    </PokemonTooltip>
                  ))}
                </div>
              </div>
            ) : (
              <div>
                <div className="mb-2.5 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <PokemonIcon
                      species={currentSlot.pokemon.species}
                      className="scale-90"
                    />
                    <span className="text-sm font-bold text-white">
                      ¿Qué hará{' '}
                      <span className="text-amber-300">
                        {currentSlot.pokemon.name}
                      </span>
                      ?
                    </span>
                    <span className="font-mono-code rounded-md border border-slate-700 bg-slate-900 px-2 py-0.5 text-[11px] text-slate-300">
                      PS {currentSlot.pokemon.hp}/{currentSlot.pokemon.maxhp}
                    </span>
                    {snapshot.format === 'doubles' && (
                      <span className="rounded-md border border-amber-400/30 bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold text-amber-200">
                        Slot {currentSlot.activeIndex + 1}/
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

                {/* Attack Row */}
                <p className="mb-1.5 text-[10px] font-bold uppercase tracking-widest text-amber-300/80">
                  Atacar (hover para precisión, potencia y objetivo)
                </p>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {currentSlot.moves.map((mv) => (
                    <MoveTooltip key={mv.id} move={mv} placement="top">
                      <button
                        disabled={mv.disabled}
                        onClick={() => handleMoveClick(mv)}
                        className={`group flex w-full flex-col justify-between rounded-xl border border-slate-700/90 border-l-4 bg-slate-900/95 px-3 py-2.5 text-left transition hover:border-amber-400/70 hover:bg-slate-800/95 disabled:cursor-not-allowed disabled:opacity-35 active:scale-[0.98] cursor-pointer ${
                          MOVE_TYPE_ACCENT[mv.type] ?? 'border-l-slate-400'
                        }`}
                      >
                        <span className="truncate text-xs font-extrabold text-white group-hover:text-amber-200 sm:text-sm">
                          {mv.name}
                        </span>
                        <div className="mt-2 flex items-center justify-between gap-1">
                          <span
                            className={`rounded border px-1.5 py-0.5 text-[9px] font-bold uppercase ${getTypeBadgeClass(mv.type)}`}
                          >
                            {mv.type}
                          </span>
                          <span className="font-mono-code text-[10px] font-semibold text-slate-400">
                            {mv.pp}/{mv.maxpp}
                          </span>
                        </div>
                      </button>
                    </MoveTooltip>
                  ))}
                </div>

                {/* Terastallize Toggle (Showdown-style centered button!) */}
                {canTeraNow && typeof currentSlot.canTerastallize === 'string' && (
                  <div className="mt-2.5 flex justify-center">
                    <button
                      type="button"
                      onClick={() => setWantTera((v) => !v)}
                      className={`inline-flex items-center gap-2 rounded-xl border px-4 py-1.5 text-xs font-bold transition cursor-pointer ${
                        wantTera
                          ? 'border-cyan-300 bg-cyan-500/25 text-cyan-100 shadow-lg shadow-cyan-500/20 ring-1 ring-cyan-300/60'
                          : 'border-slate-700 bg-slate-900/90 text-slate-300 hover:border-cyan-400/60 hover:text-cyan-200'
                      }`}
                    >
                      <Sparkles className="h-3.5 w-3.5 text-cyan-300" />
                      <span>Teracristalizar</span>
                      <span
                        className={`rounded border px-1.5 py-0.5 text-[10px] uppercase ${getTypeBadgeClass(
                          currentSlot.canTerastallize
                        )}`}
                      >
                        {currentSlot.canTerastallize}
                      </span>
                    </button>
                  </div>
                )}

                {/* Switch Row */}
                <div className="mt-3 border-t border-slate-800/90 pt-2.5">
                  <p className="mb-1.5 text-[10px] font-bold uppercase tracking-widest text-sky-300/80">
                    Cambiar Pokémon
                  </p>
                  {availableSwitches.length === 0 ? (
                    <p className="text-[11px] text-slate-500">
                      {currentSlot.trapped
                        ? 'Atrapado en el campo: no puedes cambiar este turno.'
                        : 'Sin Pokémon disponibles en la banca.'}
                    </p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {snapshot.p1.party.map((mon) => {
                        const canSwitch =
                          !currentSlot.trapped &&
                          !mon.active &&
                          !mon.fainted &&
                          !reservedSwitchSlots.includes(mon.slotIndex);

                        return (
                          <PokemonTooltip
                            key={mon.ident}
                            mon={mon}
                            side="p1"
                            placement="top"
                          >
                            <button
                              disabled={!canSwitch}
                              onClick={() =>
                                commitSlotCommand(
                                  `switch ${mon.slotIndex}`,
                                  mon.slotIndex
                                )
                              }
                              className={`inline-flex items-center gap-1.5 rounded-xl border px-2.5 py-1.5 text-xs font-semibold transition ${
                                canSwitch
                                  ? 'border-slate-700 bg-slate-900 text-slate-100 hover:border-sky-400/70 hover:bg-sky-500/15 cursor-pointer'
                                  : 'border-slate-800 bg-slate-950/70 text-slate-500 opacity-50 cursor-not-allowed'
                              }`}
                            >
                              <PokemonIcon
                                species={mon.species}
                                className="scale-75"
                              />
                              <div className="text-left">
                                <span className="block leading-tight">
                                  {mon.name}
                                </span>
                                <div className="mt-0.5 h-1 w-12 overflow-hidden rounded-full bg-slate-800">
                                  <div
                                    className={`h-full ${hpBarColor(mon.hpPercent)}`}
                                    style={{ width: `${mon.hpPercent}%` }}
                                  />
                                </div>
                              </div>
                            </button>
                          </PokemonTooltip>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN (~35% = 4 cols): Full-Height Battle Log */}
        <aside className="flex min-h-[22rem] flex-col border-t border-amber-400/15 bg-[#080d1a] lg:col-span-4 lg:min-h-0 lg:border-l lg:border-t-0">
          <div className="shrink-0 border-b border-slate-800/90 bg-slate-950/90 px-4 py-3">
            <div className="flex items-center justify-between gap-2">
              <span className="font-display text-xs font-bold uppercase tracking-widest text-amber-300">
                Registro de Combate
              </span>
              <span className="font-mono-code rounded border border-slate-700 bg-slate-900 px-2 py-0.5 text-[10px] text-slate-400">
                {config.formatId}
              </span>
            </div>
            <p className="mt-1 text-xs font-semibold text-slate-200">
              {config.playerName}{' '}
              <span className="text-amber-400">vs.</span> {config.rivalName}
            </p>
            <p className="mt-0.5 flex items-center gap-1.5 text-[11px] text-slate-400">
              <EyeOff className="h-3 w-3 text-rose-400" />
              Niebla de Guerra + IA Scripteada ({config.scriptedEnemyRules.length}{' '}
              reglas)
            </p>
          </div>

          <div className="flex-1 space-y-1.5 overflow-y-auto px-4 py-3 text-xs">
            {snapshot.log.map((entry) => {
              if (entry.kind === 'turn') {
                return (
                  <div
                    key={entry.id}
                    className="mt-3 mb-2 -mx-4 border-y border-amber-400/25 bg-gradient-to-r from-amber-500/15 via-slate-900/90 to-slate-950 px-4 py-1.5 font-display text-sm font-extrabold tracking-wide text-amber-200 first:mt-0"
                  >
                    {entry.text}
                  </div>
                );
              }

              if (entry.kind === 'win') {
                return (
                  <div
                    key={entry.id}
                    className="my-2 rounded-xl border border-amber-400/40 bg-amber-500/15 px-3 py-2 text-center text-xs font-extrabold text-amber-200"
                  >
                    {entry.text}
                  </div>
                );
              }

              if (entry.kind === 'script') {
                return (
                  <div
                    key={entry.id}
                    className="my-1 rounded-lg border border-violet-400/30 bg-violet-500/10 px-2.5 py-1.5 text-[11px] font-semibold text-violet-200"
                  >
                    {entry.text}
                  </div>
                );
              }

              const clsMap: Record<string, string> = {
                move: 'font-semibold text-white',
                damage: 'text-orange-300/95',
                effective: 'font-bold text-amber-300',
                boost: 'font-semibold text-emerald-300',
                ability: 'font-semibold text-sky-300',
                item: 'font-semibold text-violet-300',
                faint: 'font-extrabold text-rose-400',
                switch: 'text-cyan-300/95',
                weather: 'font-medium text-sky-200',
                status: 'text-slate-300',
                system: 'text-[11px] italic text-slate-400',
              };

              return (
                <p
                  key={entry.id}
                  className={`leading-relaxed ${clsMap[entry.kind] ?? 'text-slate-300'}`}
                >
                  {entry.text}
                </p>
              );
            })}
            <div ref={logEndRef} />
          </div>
        </aside>
      </div>

      {/* Showdown Paste Modal */}
      {showPasteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
          <div className="w-full max-w-3xl rounded-3xl border border-amber-400/30 bg-slate-950 p-6 shadow-2xl">
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
                  {config.playerName} (Tu Equipo)
                </p>
                <pre className="font-mono-code max-h-80 overflow-auto rounded-xl border border-slate-800 bg-black/60 p-3 text-[11px] text-slate-200">
                  {config.playerShowdownPaste}
                </pre>
              </div>
              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  <p className="text-xs font-bold text-rose-300">
                    {config.rivalName} (Rival)
                  </p>
                  <button
                    onClick={() => setRevealRivalPasteInModal((v) => !v)}
                    className="inline-flex items-center gap-1 rounded-md border border-slate-700 bg-slate-900 px-2 py-0.5 text-[10px] font-semibold text-slate-300 hover:text-rose-200 cursor-pointer"
                  >
                    {revealRivalPasteInModal ? (
                      <>
                        <EyeOff className="h-3 w-3" /> Ocultar
                      </>
                    ) : (
                      <>
                        <Eye className="h-3 w-3" /> Revelar Debug
                      </>
                    )}
                  </button>
                </div>
                {revealRivalPasteInModal ? (
                  <pre className="font-mono-code max-h-80 overflow-auto rounded-xl border border-rose-500/30 bg-black/60 p-3 text-[11px] text-slate-200">
                    {config.rivalShowdownPaste}
                  </pre>
                ) : (
                  <div className="flex h-60 flex-col items-center justify-center rounded-xl border border-dashed border-rose-500/30 bg-slate-900/50 p-4 text-center">
                    <EyeOff className="mb-2 h-6 w-6 text-rose-400/70" />
                    <p className="text-xs font-bold text-rose-200">
                      Paste rival oculto por Niebla de Guerra
                    </p>
                    <p className="mt-1 text-[11px] text-slate-400">
                      Haz clic en &ldquo;Revelar Debug&rdquo; si deseas inspeccionar los
                      sets rivales inyectados.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
