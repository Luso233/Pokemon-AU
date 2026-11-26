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
  className = 'h-4 w-4',
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
  // Strict internal log scroll ref (NEVER use scrollIntoView!)
  const logContainerRef = useRef<HTMLDivElement | null>(null);

  const [snapshot, setSnapshot] = useState<BattleSnapshot | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showPasteModal, setShowPasteModal] = useState(false);
  const [revealRivalPasteInModal, setRevealRivalPasteInModal] = useState(false);

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

  // Strict internal container auto-scroll ONLY (never scrolls parent window)
  useEffect(() => {
    const el = logContainerRef.current;
    if (el) {
      el.scrollTop = el.scrollHeight;
    }
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
      <div className="flex h-screen max-h-screen flex-col items-center justify-center overflow-hidden bg-slate-950 p-6 text-center">
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
      <div className="flex h-screen max-h-screen items-center justify-center overflow-hidden bg-slate-950 text-amber-300">
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
        <div className="flex h-28 w-28 items-center justify-center rounded-2xl border border-dashed border-slate-700/40 bg-slate-950/20 text-[10px] text-slate-600">
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
          className={`group relative flex flex-col items-center rounded-xl px-1.5 py-0.5 outline-none transition-all duration-300 focus-visible:ring-2 focus-visible:ring-amber-400/70 ${
            mon.fainted ? 'opacity-30 grayscale' : 'opacity-100'
          }`}
        >
          {showCallout && (
            <div
              key={cue.id}
              className={`animate-fade-in-up absolute -top-4 z-30 whitespace-nowrap rounded-full px-2 py-0.5 text-[9px] font-extrabold tracking-wider shadow-lg ${
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
            className={`w-40 rounded-lg border bg-slate-950/92 px-2 py-1 shadow-lg backdrop-blur-md transition group-hover:border-amber-400/70 xl:w-44 ${
              mon.terastallized
                ? 'border-cyan-400/75 ring-1 ring-cyan-400/30'
                : side === 'p1'
                  ? 'border-amber-400/35'
                  : 'border-rose-400/35'
            }`}
          >
            <div className="flex items-center justify-between gap-1 text-[10px]">
              <div className="flex min-w-0 items-center gap-1">
                <span className="truncate font-bold text-white">{mon.name}</span>
                {mon.gender && (
                  <span
                    className={`text-[9px] font-bold ${
                      mon.gender === 'M' ? 'text-sky-400' : 'text-pink-400'
                    }`}
                  >
                    {mon.gender === 'M' ? '♂' : '♀'}
                  </span>
                )}
                {mon.terastallized && (
                  <span className="rounded bg-cyan-500/25 px-1 text-[8px] font-extrabold text-cyan-200">
                    ✦{mon.terastallized}
                  </span>
                )}
                {mon.isBossAce && (
                  <Crown
                    className="h-2.5 w-2.5 shrink-0 text-amber-400"
                    aria-label="Boss Ace"
                  />
                )}
              </div>
              <span className="font-mono-code shrink-0 text-[9px] font-semibold text-amber-200/90">
                L{mon.level}
              </span>
            </div>

            <div className="mt-0.5 flex items-center gap-1.5">
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-800 ring-1 ring-white/10">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${hpBarColor(mon.hpPercent)}`}
                  style={{ width: `${mon.hpPercent}%` }}
                />
              </div>
              <span className="font-mono-code w-8 text-right text-[9px] font-bold text-slate-200">
                {mon.hpPercent}%
              </span>
            </div>

            {(statusBadge ||
              activeBoosts.length > 0 ||
              mon.volatiles.length > 0) && (
              <div className="mt-0.5 flex flex-wrap items-center gap-0.5">
                {statusBadge && (
                  <span
                    className={`rounded px-1 text-[8px] font-extrabold ${statusBadge.cls}`}
                  >
                    {statusBadge.label}
                  </span>
                )}
                {activeBoosts.slice(0, 3).map(([st, val]) => (
                  <span
                    key={st}
                    className={`font-mono-code rounded px-1 text-[8px] font-bold ${
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
                    className="rounded bg-violet-500/25 px-1 text-[8px] font-semibold text-violet-200"
                  >
                    {vol}
                  </span>
                ))}
              </div>
            )}
          </div>

          <div
            key={`${mon.ident}-${isHit ? cue?.id : 'idle'}`}
            className={`mt-0.5 flex items-center justify-center ${
              snapshot.format === 'doubles'
                ? 'h-20 w-24 xl:h-24 xl:w-28'
                : 'h-24 w-28 xl:h-28 xl:w-32'
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
    /* STRICT VIEWPORT LOCK: Never allows outer page scrolling during battle! */
    <div className="flex h-screen max-h-screen flex-col overflow-hidden bg-[#060a14] text-slate-100">
      {/* Compact Top HUD Bar */}
      <header className="relative z-30 flex shrink-0 items-center justify-between gap-2 border-b border-amber-400/20 bg-slate-950/95 px-3 py-2 backdrop-blur-md">
        <div className="flex min-w-0 items-center gap-2">
          <button
            onClick={onExitToChapters}
            className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-slate-700 bg-slate-900 px-2.5 py-1 text-xs font-semibold text-slate-300 transition hover:border-amber-400/50 hover:text-white cursor-pointer"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Salir
          </button>

          <span className="font-mono-code shrink-0 rounded-lg border border-amber-400/35 bg-amber-500/15 px-2 py-1 text-[11px] font-bold text-amber-200">
            TURNO {snapshot.turn}
          </span>
          <span className="truncate rounded-lg border border-slate-700 bg-slate-900 px-2.5 py-1 text-[11px] font-semibold text-slate-200">
            {snapshot.formatLabel}
          </span>
          {snapshot.weather && (
            <span className="hidden shrink-0 items-center gap-1 rounded-lg border border-amber-400/35 bg-amber-500/15 px-2 py-1 text-[11px] font-semibold text-amber-200 sm:inline-flex">
              <CloudSun className="h-3 w-3" />
              {snapshot.weather}
            </span>
          )}
          {snapshot.terrain && (
            <span className="hidden shrink-0 items-center gap-1 rounded-lg border border-emerald-400/35 bg-emerald-500/15 px-2 py-1 text-[11px] font-semibold text-emerald-200 md:inline-flex">
              {snapshot.terrain}
            </span>
          )}
        </div>

        {/* Right HUD: Rival KOs + Showdown Paste + Restart */}
        <div className="flex shrink-0 items-center gap-1.5">
          <div className="inline-flex items-center gap-1.5 rounded-lg border border-rose-400/35 bg-rose-500/15 px-2.5 py-1 text-[11px] font-bold text-rose-200">
            <Flame className="h-3 w-3 text-rose-400" />
            Rivales KO: {snapshot.koCountP2}/{snapshot.totalP2}
          </div>

          <button
            onClick={() => {
              setRevealRivalPasteInModal(false);
              setShowPasteModal(true);
            }}
            className="inline-flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-900 px-2.5 py-1 text-[11px] font-semibold text-slate-300 hover:border-sky-400/50 hover:text-white cursor-pointer"
          >
            <Code2 className="h-3.5 w-3.5" />
            Paste
          </button>

          <button
            onClick={startBattle}
            title="Reiniciar combate"
            className="inline-flex items-center justify-center rounded-lg border border-slate-700 bg-slate-900 p-1.5 text-slate-300 hover:border-amber-400/50 hover:text-white cursor-pointer"
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </button>
        </div>
      </header>

      {/* STRICT 2-COLUMN WORKSPACE (Left ~68% flex-1 | Right fixed w-72/w-80/w-96) */}
      <div className="flex min-h-0 flex-1 flex-row overflow-hidden">
        {/* LEFT COLUMN (~68%): Arena (flex-1) + Taunt Strip (shrink-0) + Actions (shrink-0) */}
        <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-2 overflow-hidden p-2.5">
          {/* 1. BATTLEFIELD ARENA */}
          <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-amber-400/25 bg-slate-950 shadow-2xl">
            <SceneBackdrop theme={config.arenaTheme} className="opacity-85" />

            {/* Top Arena Overlay: Turn Badge + Active Field/Side Conditions */}
            <div className="relative z-20 flex shrink-0 flex-wrap items-center justify-between gap-1.5 px-3 pt-2">
              <div className="font-display rounded-lg border border-amber-400/55 bg-slate-950/90 px-3 py-0.5 text-[11px] font-extrabold tracking-wider text-amber-200 shadow">
                Turn {Math.max(1, snapshot.turn)}
              </div>

              <div className="flex flex-wrap items-center gap-1">
                {snapshot.weather && (
                  <span className="inline-flex items-center gap-1 rounded border border-amber-400/40 bg-amber-500/20 px-1.5 py-0.5 text-[10px] font-bold text-amber-200">
                    <CloudSun className="h-3 w-3" />
                    {snapshot.weather}
                  </span>
                )}
                {snapshot.terrain && (
                  <span className="rounded border border-emerald-400/40 bg-emerald-500/20 px-1.5 py-0.5 text-[10px] font-bold text-emerald-200">
                    {snapshot.terrain}
                  </span>
                )}
                {snapshot.p1.sideConditions.map((sc) => (
                  <span
                    key={`p1-${sc}`}
                    className="rounded border border-sky-400/40 bg-sky-500/20 px-1.5 py-0.5 text-[10px] font-bold text-sky-200"
                  >
                    Tu lado: {sc}
                  </span>
                ))}
                {snapshot.p2.sideConditions.map((sc) => (
                  <span
                    key={`p2-${sc}`}
                    className="rounded border border-rose-400/40 bg-rose-500/20 px-1.5 py-0.5 text-[10px] font-bold text-rose-200"
                  >
                    Rival: {sc}
                  </span>
                ))}
              </div>
            </div>

            {/* 3-Zone Stage: Player Sideline | Center Active Field | Rival Sideline */}
            <div className="relative z-10 flex min-h-0 flex-1 items-stretch justify-between gap-1.5 px-2 pb-2.5 pt-1">
              {/* LEFT SIDELINE: Player Portrait + 6 Mini-Sprites */}
              <div className="flex w-[5.5rem] shrink-0 flex-col items-center justify-center rounded-xl border border-amber-400/20 bg-slate-950/65 px-1 py-2 backdrop-blur-sm xl:w-24">
                <div className="mb-1 h-14 w-14 overflow-hidden rounded-xl border border-amber-400/45 bg-gradient-to-b from-slate-900 to-slate-950 p-0.5 shadow">
                  <CharacterPortrait
                    charId={config.playerCharId}
                    variant="bust"
                    className="h-full w-full object-cover object-top"
                  />
                </div>
                <p className="mb-1.5 max-w-full truncate text-[9px] font-bold text-amber-200">
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
                          className={`relative flex h-8 w-8 items-center justify-center rounded-md border transition cursor-help ${
                            mon.fainted
                              ? 'border-slate-800 bg-slate-950/70 opacity-35 grayscale'
                              : mon.active
                                ? 'border-amber-400 bg-amber-500/20'
                                : 'border-slate-700/80 bg-slate-900/80 hover:border-amber-400/60'
                          }`}
                        >
                          <PokemonIcon species={mon.species} className="scale-[0.68]" />
                        </button>
                      </PokemonTooltip>
                    ) : (
                      <div
                        key={`p1-empty-${idx}`}
                        className="flex h-8 w-8 items-center justify-center rounded-md border border-slate-800/40 bg-slate-950/25"
                      >
                        <span className="h-1 w-1 rounded-full bg-slate-800" />
                      </div>
                    )
                  )}
                </div>
              </div>

              {/* CENTER ACTIVE BATTLEFIELD */}
              <div className="relative flex min-h-0 flex-1 flex-col justify-between py-0.5">
                <div className="flex items-start justify-end gap-2 pr-1 xl:gap-4 xl:pr-3">
                  {snapshot.p2.active.map((mon, idx) => (
                    <React.Fragment key={`p2-active-${idx}`}>
                      {renderActiveFighter(mon, 'p2', idx)}
                    </React.Fragment>
                  ))}
                </div>

                <div className="flex items-end justify-start gap-2 pl-1 xl:gap-4 xl:pl-3">
                  {snapshot.p1.active.map((mon, idx) => (
                    <React.Fragment key={`p1-active-${idx}`}>
                      {renderActiveFighter(mon, 'p1', idx)}
                    </React.Fragment>
                  ))}
                </div>
              </div>

              {/* RIGHT SIDELINE: Rival/Champion Portrait + 6 Fog-of-War Slots */}
              <div className="flex w-[5.5rem] shrink-0 flex-col items-center justify-center rounded-xl border border-rose-500/25 bg-slate-950/65 px-1 py-2 backdrop-blur-sm xl:w-24">
                <div className="mb-1 h-14 w-14 overflow-hidden rounded-xl border border-rose-500/45 bg-gradient-to-b from-slate-900 to-slate-950 p-0.5 shadow">
                  <CharacterPortrait
                    charId={config.rivalCharId}
                    variant="bust"
                    className="h-full w-full object-cover object-top"
                  />
                </div>
                <p className="mb-1.5 max-w-full truncate text-[9px] font-bold text-rose-200">
                  {config.rivalName}
                </p>
                <div className="grid grid-cols-2 gap-1">
                  {rivalTeamSlots.map((slot, idx) => {
                    if (!slot.exists) {
                      return (
                        <div
                          key={`p2-empty-${idx}`}
                          className="flex h-8 w-8 items-center justify-center rounded-md border border-slate-800/40 bg-slate-950/25"
                        >
                          <span className="h-1 w-1 rounded-full bg-slate-800" />
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
                          className={`relative flex h-8 w-8 items-center justify-center rounded-md border transition cursor-help ${
                            !mon
                              ? 'border-rose-500/25 bg-slate-950/80 hover:border-rose-400/60'
                              : mon.fainted
                                ? 'border-slate-800 bg-slate-950/70 opacity-35 grayscale'
                                : mon.active
                                  ? 'border-rose-400 bg-rose-500/20'
                                  : 'border-slate-700/80 bg-slate-900/80 hover:border-rose-400/60'
                          }`}
                        >
                          {mon ? (
                            <PokemonIcon
                              species={mon.species}
                              className="scale-[0.68]"
                            />
                          ) : (
                            <UnrevealedPokeballSvg className="h-4 w-4" />
                          )}
                        </button>
                      </PokemonTooltip>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* 2. COMPACT SCRIPTED DIALOGUE TAUNT STRIP */}
          {snapshot.activeTaunt && (
            <div
              key={snapshot.activeTaunt.id}
              className="animate-fade-in-up flex shrink-0 items-center gap-2.5 rounded-xl border border-rose-500/40 bg-gradient-to-r from-rose-950/75 via-slate-950/95 to-slate-950/95 px-3 py-1.5 shadow"
            >
              <div className="h-9 w-9 shrink-0 overflow-hidden rounded-lg border border-rose-500/50 bg-slate-900 p-0.5">
                <CharacterPortrait
                  charId={snapshot.activeTaunt.charId}
                  variant="bust"
                  className="h-full w-full object-cover object-top"
                />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-rose-300">
                    {snapshot.activeTaunt.speaker}
                  </span>
                  <span className="inline-flex items-center gap-1 rounded border border-violet-400/30 bg-violet-500/20 px-1.5 py-0.2 text-[9px] font-semibold text-violet-200">
                    <Cpu className="h-2.5 w-2.5" />
                    Turno {snapshot.activeTaunt.turn} Scripteado
                  </span>
                </div>
                <p className="truncate text-[11px] italic text-slate-100">
                  {snapshot.activeTaunt.text}
                </p>
              </div>
            </div>
          )}

          {/* 3. ALWAYS-VISIBLE ACTION PANEL (shrink-0, never clipped) */}
          <div className="shrink-0 rounded-2xl border border-slate-800 bg-slate-950/95 p-3 shadow-xl">
            {snapshot.status === 'ended' ? (
              <div className="flex flex-wrap items-center justify-between gap-3 py-1">
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-xl border ${
                      snapshot.winner === 'p1'
                        ? 'border-amber-400/40 bg-amber-500/20 text-amber-300'
                        : 'border-rose-400/40 bg-rose-500/20 text-rose-300'
                    }`}
                  >
                    <Trophy className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="font-display text-base font-bold text-white">
                      {snapshot.winner === 'p1'
                        ? '¡Victoria de la Corona!'
                        : 'Derrota en Combate'}
                    </h2>
                    <p className="text-xs text-slate-400">
                      {snapshot.turn} turno{snapshot.turn === 1 ? '' : 's'} ·{' '}
                      {snapshot.koCountP2}/{snapshot.totalP2} rivales KO
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={startBattle}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-900 px-3.5 py-2 text-xs font-semibold text-slate-200 hover:border-amber-400/40 cursor-pointer"
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                    Reintentar
                  </button>
                  <button
                    onClick={() =>
                      onBattleComplete(snapshot.winner === 'p1', snapshot)
                    }
                    className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 px-5 py-2 text-xs font-extrabold text-slate-950 shadow-lg shadow-amber-500/25 hover:brightness-110 cursor-pointer"
                  >
                    <Sparkles className="h-3.5 w-3.5" />
                    Continuar al Epílogo
                    <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ) : snapshot.status !== 'awaiting-choice' || !currentSlot ? (
              <div className="flex h-28 items-center justify-center text-xs text-slate-400">
                Resolviendo turno en @pkmn/sim...
              </div>
            ) : pendingTargetMove ? (
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-xs font-bold text-amber-200">
                    Elige objetivo para{' '}
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
                    className="rounded-lg border border-slate-700 px-2.5 py-1 text-[11px] text-slate-300 hover:text-white cursor-pointer"
                  >
                    ← Volver
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2.5">
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
                          className="flex w-full items-center justify-between rounded-xl border border-rose-400/40 bg-rose-500/10 px-3 py-2.5 text-left transition hover:border-rose-400 hover:bg-rose-500/20 cursor-pointer"
                        >
                          <div className="flex items-center gap-2">
                            <PokemonIcon species={foe.species} className="scale-90" />
                            <div>
                              <p className="text-xs font-bold text-white">
                                {foe.name}
                              </p>
                              <p className="text-[11px] text-rose-200">
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
                <p className="mb-2 text-xs font-bold text-amber-300">
                  ¡{currentSlot.pokemon.name} se debilitó! Elige reemplazo:
                </p>
                <div className="flex flex-wrap gap-2">
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
                        className="inline-flex items-center gap-2 rounded-xl border border-sky-400/40 bg-sky-500/10 px-3 py-2 text-left transition hover:border-sky-300 hover:bg-sky-500/20 cursor-pointer"
                      >
                        <PokemonIcon species={mon.species} className="scale-75" />
                        <div>
                          <p className="text-xs font-bold text-white">
                            {mon.name}
                          </p>
                          <p className="font-mono-code text-[10px] text-slate-300">
                            {mon.hp}/{mon.maxhp} ({mon.hpPercent}%)
                          </p>
                        </div>
                      </button>
                    </PokemonTooltip>
                  ))}
                </div>
              </div>
            ) : (
              <div>
                {/* Compact Action Header + Inline Tera Toggle */}
                <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <PokemonIcon
                      species={currentSlot.pokemon.species}
                      className="scale-75"
                    />
                    <span className="text-xs font-bold text-white">
                      ¿Qué hará{' '}
                      <span className="text-amber-300">
                        {currentSlot.pokemon.name}
                      </span>
                      ?
                    </span>
                    <span className="font-mono-code rounded border border-slate-700 bg-slate-900 px-1.5 py-0.5 text-[10px] text-slate-300">
                      PS {currentSlot.pokemon.hp}/{currentSlot.pokemon.maxhp}
                    </span>
                    {snapshot.format === 'doubles' && (
                      <span className="rounded border border-amber-400/30 bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-amber-200">
                        Slot {currentSlot.activeIndex + 1}/
                        {snapshot.pendingSlots.length}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {canTeraNow &&
                      typeof currentSlot.canTerastallize === 'string' && (
                        <button
                          type="button"
                          onClick={() => setWantTera((v) => !v)}
                          className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-[11px] font-bold transition cursor-pointer ${
                            wantTera
                              ? 'border-cyan-300 bg-cyan-500/25 text-cyan-100 ring-1 ring-cyan-300/60'
                              : 'border-slate-700 bg-slate-900 text-slate-300 hover:border-cyan-400/60 hover:text-cyan-200'
                          }`}
                        >
                          <Sparkles className="h-3 w-3 text-cyan-300" />
                          <span>Tera</span>
                          <span
                            className={`rounded border px-1 py-0.2 text-[9px] uppercase ${getTypeBadgeClass(
                              currentSlot.canTerastallize
                            )}`}
                          >
                            {currentSlot.canTerastallize}
                          </span>
                        </button>
                      )}

                    {slotCursor > 0 && (
                      <button
                        onClick={handleUndoDoubleSlot}
                        className="rounded-lg border border-slate-700 px-2 py-1 text-[11px] text-slate-300 hover:text-white cursor-pointer"
                      >
                        ← Slot 1
                      </button>
                    )}
                  </div>
                </div>

                {/* 4 Moves Row */}
                <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4">
                  {currentSlot.moves.map((mv) => (
                    <MoveTooltip key={mv.id} move={mv} placement="top">
                      <button
                        disabled={mv.disabled}
                        onClick={() => handleMoveClick(mv)}
                        className={`group flex w-full flex-col justify-between rounded-xl border border-slate-700/90 border-l-4 bg-slate-900/95 px-2.5 py-2 text-left transition hover:border-amber-400/70 hover:bg-slate-800/95 disabled:cursor-not-allowed disabled:opacity-35 active:scale-[0.98] cursor-pointer ${
                          MOVE_TYPE_ACCENT[mv.type] ?? 'border-l-slate-400'
                        }`}
                      >
                        <span className="truncate text-xs font-extrabold text-white group-hover:text-amber-200">
                          {mv.name}
                        </span>
                        <div className="mt-1.5 flex items-center justify-between gap-1">
                          <span
                            className={`rounded border px-1 py-0.2 text-[9px] font-bold uppercase ${getTypeBadgeClass(mv.type)}`}
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

                {/* Compact Switch Strip */}
                <div className="mt-2 flex flex-wrap items-center gap-1.5 border-t border-slate-800/80 pt-2">
                  <span className="mr-1 text-[10px] font-bold uppercase tracking-wider text-sky-300/80">
                    Cambiar:
                  </span>
                  {availableSwitches.length === 0 ? (
                    <span className="text-[11px] text-slate-500">
                      {currentSlot.trapped
                        ? 'Atrapado este turno'
                        : 'Sin banca disponible'}
                    </span>
                  ) : (
                    snapshot.p1.party.map((mon) => {
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
                            className={`inline-flex items-center gap-1 rounded-lg border px-2 py-1 text-[11px] font-semibold transition ${
                              canSwitch
                                ? 'border-slate-700 bg-slate-900 text-slate-100 hover:border-sky-400/70 hover:bg-sky-500/15 cursor-pointer'
                                : 'border-slate-800 bg-slate-950/70 text-slate-500 opacity-45 cursor-not-allowed'
                            }`}
                          >
                            <PokemonIcon
                              species={mon.species}
                              className="scale-[0.65]"
                            />
                            <span>{mon.name}</span>
                            <span className="font-mono-code text-[9px] text-emerald-300">
                              {mon.hpPercent}%
                            </span>
                          </button>
                        </PokemonTooltip>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN (Fixed width w-72 / md:w-80 / lg:w-96, full height, INTERNAL SCROLL ONLY!) */}
        <aside className="flex h-full w-64 shrink-0 flex-col border-l border-amber-400/15 bg-[#080d1a] md:w-80 lg:w-96">
          <div className="shrink-0 border-b border-slate-800/90 bg-slate-950/90 px-3.5 py-2.5">
            <div className="flex items-center justify-between gap-2">
              <span className="font-display text-xs font-bold uppercase tracking-widest text-amber-300">
                Registro de Combate
              </span>
              <span className="font-mono-code rounded border border-slate-700 bg-slate-900 px-1.5 py-0.5 text-[9px] text-slate-400">
                {snapshot.formatId}
              </span>
            </div>
            <p className="mt-0.5 truncate text-[11px] font-semibold text-slate-200">
              {config.playerName}{' '}
              <span className="text-amber-400">vs.</span> {config.rivalName}
            </p>
            <p className="mt-0.5 flex items-center gap-1 text-[10px] text-slate-400">
              <EyeOff className="h-3 w-3 text-rose-400" />
              Fog of War · {config.scriptedEnemyRules.length} reglas IA
            </p>
          </div>

          {/* Dedicated Internal Scrollable Log Container (logContainerRef.scrollTop = scrollHeight) */}
          <div
            ref={logContainerRef}
            className="min-h-0 flex-1 space-y-1.5 overflow-y-auto px-3.5 py-2.5 text-xs"
          >
            {snapshot.log.map((entry) => {
              if (entry.kind === 'turn') {
                return (
                  <div
                    key={entry.id}
                    className="mt-2.5 mb-1.5 -mx-3.5 border-y border-amber-400/25 bg-gradient-to-r from-amber-500/15 via-slate-900/90 to-slate-950 px-3.5 py-1 font-display text-xs font-extrabold tracking-wide text-amber-200 first:mt-0"
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

              if (entry.kind === 'puzzle') {
                return (
                  <div
                    key={entry.id}
                    className="my-1 rounded-lg border border-amber-400/35 bg-amber-500/10 px-2.5 py-1.5 text-[11px] font-semibold text-amber-200"
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
          </div>
        </aside>
      </div>

      {/* Showdown Paste Modal */}
      {showPasteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
          <div className="w-full max-w-3xl rounded-3xl border border-amber-400/30 bg-slate-950 p-6 shadow-2xl">
            <div className="mb-4 flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-display text-lg font-bold text-amber-200">
                Equipos Inyectados ({snapshot.formatLabel})
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
