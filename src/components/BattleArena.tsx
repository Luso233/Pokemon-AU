import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  Brain,
  Check,
  ChevronRight,
  ClipboardList,
  CloudSun,
  Code2,
  Cpu,
  Crown,
  Eye,
  EyeOff,
  Flame,
  Loader2,
  Lock,
  RefreshCw,
  ScrollText,
  Settings2,
  Sparkles,
  Swords,
  Trophy,
  Users,
  X,
} from 'lucide-react';
import { askLiveCoach } from '../engine/battleCoach';
import {
  formatNeedsTarget,
  isAllyTargetReachable,
  isFoeTargetReachable,
  ShowdownBattleController,
} from '../engine/battleEngine';
import {
  getTypeBadgeClass,
  STATUS_BADGE_STYLES,
} from '../engine/pokemonVisuals';
import type {
  ActiveMoveOption,
  AISettings,
  BattleSnapshot,
  LiveCoachAdvice,
  PartyPokemonState,
  ResolvedBattleConfig,
} from '../types/game';
import { CharacterPortrait } from './CharacterPortrait';
import {
  ActionInfoTooltip,
  FieldEffectTooltip,
  getFormatRuleDescription,
} from './InfoTooltip';
import { MoveTooltip } from './MoveTooltip';
import { OpenTeamsheetModal } from './OpenTeamsheetModal';
import { PokemonIcon, PokemonSprite } from './PokemonSprite';
import { PokemonTooltip } from './PokemonTooltip';
import { RivalPortraitTooltip } from './RivalPortraitTooltip';
import { SceneBackdrop } from './SceneBackdrop';

interface BattleArenaProps {
  config: ResolvedBattleConfig;
  aiSettings: AISettings;
  attemptNumber?: number;
  onRetryAttempt?: () => void;
  onOpenAISettings: () => void;
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
  Shadow: 'border-l-fuchsia-500 bg-fuchsia-950/35',
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
      strokeOpacity="0.6"
      strokeWidth="1.6"
    />
    <path
      d="M2.6 12h18.8"
      stroke="#fb7185"
      strokeOpacity="0.6"
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
  aiSettings,
  attemptNumber,
  onRetryAttempt,
  onOpenAISettings,
  onExitToChapters,
  onBattleComplete,
}) => {
  const controllerRef = useRef<ShowdownBattleController | null>(null);
  // Strict internal log scroll ref (NEVER use scrollIntoView!)
  const logContainerRef = useRef<HTMLDivElement | null>(null);

  const [snapshot, setSnapshot] = useState<BattleSnapshot | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showPasteModal, setShowPasteModal] = useState(false);
  const [showTeamsheetModal, setShowTeamsheetModal] = useState(false);
  const [revealRivalPasteInModal, setRevealRivalPasteInModal] = useState(false);
  // Mobile/Tablet (<1024px) collapsible Battle Log drawer so the arena & move buttons always get 100% width!
  const [showMobileLog, setShowMobileLog] = useState(false);

  // On-Demand Chess.com-style Live Coach state
  const [coachAdvice, setCoachAdvice] = useState<LiveCoachAdvice | null>(null);
  const [coachLoading, setCoachLoading] = useState(false);

  // Hotseat local privacy curtain unlock key
  const [unlockedHotseatKey, setUnlockedHotseatKey] = useState<string>('');

  // Interactive Team Preview selection state (1-based slot numbers)
  const [previewSelected, setPreviewSelected] = useState<number[]>([]);

  // Per-turn command queue
  const [slotCursor, setSlotCursor] = useState(0);
  const [queuedCommands, setQueuedCommands] = useState<string[]>([]);
  const [reservedSwitchSlots, setReservedSwitchSlots] = useState<number[]>([]);
  const [teraQueuedInTurn, setTeraQueuedInTurn] = useState(false);
  const [wantTera, setWantTera] = useState(false);
  const [megaQueuedInTurn, setMegaQueuedInTurn] = useState(false);
  const [wantMega, setWantMega] = useState(false);
  const [zMoveQueuedInTurn, setZMoveQueuedInTurn] = useState(false);
  const [wantZMove, setWantZMove] = useState(false);
  const [pendingTargetMove, setPendingTargetMove] = useState<{
    move: ActiveMoveOption;
    mode: 'foe' | 'ally';
    tera: boolean;
    mega: boolean;
    zmove: boolean;
    zMoveName?: string;
  } | null>(null);

  const startBattle = () => {
    controllerRef.current?.destroy();
    setError(null);
    setCoachAdvice(null);
    setCoachLoading(false);
    setUnlockedHotseatKey('');
    setPreviewSelected([]);
    setSlotCursor(0);
    setQueuedCommands([]);
    setReservedSwitchSlots([]);
    setTeraQueuedInTurn(false);
    setWantTera(false);
    setMegaQueuedInTurn(false);
    setWantMega(false);
    setZMoveQueuedInTurn(false);
    setWantZMove(false);
    setPendingTargetMove(null);

    const ctrl = new ShowdownBattleController(
      config,
      (nextSnap) => {
        setSnapshot(nextSnap);
      },
      aiSettings
    );
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

  // Determine active human-controlled side (always 'p1' vs AI; switches between 'p1' and 'p2' in Hotseat)
  const activeSide: 'p1' | 'p2' = useMemo(() => {
    if (!snapshot || snapshot.p2Control !== 'human') return 'p1';
    if (snapshot.status === 'team-preview') {
      if (snapshot.teamPreview) return 'p1';
      if (snapshot.p2TeamPreview) return 'p2';
      return 'p1';
    }
    if (snapshot.pendingSlots.length > 0) return 'p1';
    if (snapshot.p2PendingSlots.length > 0) return 'p2';
    return 'p1';
  }, [snapshot]);

  const activePendingSlots = useMemo(() => {
    if (!snapshot) return [];
    return activeSide === 'p2' ? snapshot.p2PendingSlots : snapshot.pendingSlots;
  }, [snapshot, activeSide]);

  const activeIsForceSwitch = snapshot
    ? activeSide === 'p2'
      ? snapshot.p2IsForceSwitch
      : snapshot.isForceSwitch
    : false;

  const activeTeamPreview = snapshot
    ? activeSide === 'p2'
      ? snapshot.p2TeamPreview
      : snapshot.teamPreview
    : null;

  const activeParty = useMemo(() => {
    if (!snapshot) return [];
    return activeSide === 'p2' ? snapshot.p2HumanParty : snapshot.p1.party;
  }, [snapshot, activeSide]);

  const activeFoes = useMemo(() => {
    if (!snapshot) return [];
    return activeSide === 'p2' ? snapshot.p1.active : snapshot.p2.active;
  }, [snapshot, activeSide]);

  const activeReqSeq = snapshot
    ? activeSide === 'p2'
      ? snapshot.p2RequestSeq
      : snapshot.requestSeq
    : 0;

  const requestKey = useMemo(() => {
    if (!snapshot) return '';
    return `${activeSide}-${activeReqSeq}-${snapshot.turn}-${snapshot.status}-${activeIsForceSwitch}-${activePendingSlots.length}`;
  }, [
    snapshot,
    activeSide,
    activeReqSeq,
    activeIsForceSwitch,
    activePendingSlots.length,
  ]);

  const hotseatGateKey = useMemo(() => {
    if (!snapshot || snapshot.p2Control !== 'human') return '';
    if (snapshot.status === 'team-preview' && activeTeamPreview) {
      return `tp-${activeSide}-${activeReqSeq}`;
    }
    if (snapshot.status === 'awaiting-choice' && activePendingSlots.length > 0) {
      return `turn-${snapshot.turn}-${activeSide}-${activeReqSeq}`;
    }
    return '';
  }, [
    snapshot,
    activeSide,
    activeReqSeq,
    activeTeamPreview,
    activePendingSlots.length,
  ]);

  const isHotseatLocked =
    Boolean(hotseatGateKey) && unlockedHotseatKey !== hotseatGateKey;

  useEffect(() => {
    setCoachAdvice(null);
    setCoachLoading(false);
    setPreviewSelected([]);
    if (!snapshot || snapshot.status !== 'awaiting-choice') return;
    let idx = 0;
    const autoCmds: string[] = [];
    while (idx < activePendingSlots.length && activePendingSlots[idx].pass) {
      autoCmds.push('pass');
      idx++;
    }
    if (
      activePendingSlots.length > 0 &&
      idx >= activePendingSlots.length &&
      autoCmds.length > 0
    ) {
      setSlotCursor(0);
      setQueuedCommands([]);
      setReservedSwitchSlots([]);
      setTeraQueuedInTurn(false);
      setWantTera(false);
      setMegaQueuedInTurn(false);
      setWantMega(false);
      setZMoveQueuedInTurn(false);
      setWantZMove(false);
      setPendingTargetMove(null);
      if (activeSide === 'p2') {
        void controllerRef.current?.submitP2Choice(autoCmds.join(', '));
      } else {
        void controllerRef.current?.submitPlayerChoice(autoCmds.join(', '));
      }
      return;
    }
    setSlotCursor(idx);
    setQueuedCommands(autoCmds);
    setReservedSwitchSlots([]);
    setTeraQueuedInTurn(false);
    setWantTera(false);
    setMegaQueuedInTurn(false);
    setWantMega(false);
    setZMoveQueuedInTurn(false);
    setWantZMove(false);
    setPendingTargetMove(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requestKey]);

  // Strict internal container auto-scroll ONLY
  useEffect(() => {
    const el = logContainerRef.current;
    if (el) {
      el.scrollTop = el.scrollHeight;
    }
  }, [snapshot?.log.length, showMobileLog]);

  const handleAskCoach = async () => {
    if (!snapshot || coachLoading) return;
    setCoachLoading(true);
    try {
      const advice = await askLiveCoach(snapshot, aiSettings);
      setCoachAdvice(advice);
    } finally {
      setCoachLoading(false);
    }
  };

  const commitSlotCommand = (
    cmd: string,
    switchSlotUsed?: number,
    usedTera = false,
    usedMega = false,
    usedZMove = false
  ) => {
    if (!snapshot || !controllerRef.current) return;
    const nextCmds = [...queuedCommands, cmd];
    const nextReserved =
      switchSlotUsed != null
        ? [...reservedSwitchSlots, switchSlotUsed]
        : reservedSwitchSlots;
    const nextTeraQueued = teraQueuedInTurn || usedTera;
    const nextMegaQueued = megaQueuedInTurn || usedMega;
    const nextZMoveQueued = zMoveQueuedInTurn || usedZMove;

    // Count unreserved, non-active, alive bench Pokémon remaining after this pick.
    // Crucial for Doubles/Triples multi-KO (`forceSwitch`) with fewer alive bench Pokémon than fainted slots!
    const remainingBenchCount = activeParty.filter(
      (p) => !p.active && !p.fainted && !nextReserved.includes(p.slotIndex)
    ).length;

    let nextIdx = slotCursor + 1;
    while (
      nextIdx < activePendingSlots.length &&
      (activePendingSlots[nextIdx].pass ||
        (activeIsForceSwitch && remainingBenchCount === 0))
    ) {
      nextCmds.push('pass');
      nextIdx++;
    }

    setPendingTargetMove(null);
    setWantTera(false);
    setWantMega(false);
    setWantZMove(false);

    if (nextIdx >= activePendingSlots.length) {
      setQueuedCommands([]);
      setReservedSwitchSlots([]);
      setTeraQueuedInTurn(false);
      setMegaQueuedInTurn(false);
      setZMoveQueuedInTurn(false);
      setSlotCursor(0);
      if (activeSide === 'p2') {
        void controllerRef.current.submitP2Choice(nextCmds.join(', '));
      } else {
        void controllerRef.current.submitPlayerChoice(nextCmds.join(', '));
      }
    } else {
      setQueuedCommands(nextCmds);
      setReservedSwitchSlots(nextReserved);
      setTeraQueuedInTurn(nextTeraQueued);
      setMegaQueuedInTurn(nextMegaQueued);
      setZMoveQueuedInTurn(nextZMoveQueued);
      setSlotCursor(nextIdx);
    }
  };

  const handleMoveClick = (move: ActiveMoveOption) => {
    if (!snapshot) return;
    const slotObj = activePendingSlots[slotCursor];
    const zOpt = slotObj?.canZMove?.[move.index - 1] ?? null;
    const useZMove = Boolean(wantZMove && !zMoveQueuedInTurn && zOpt);
    const useTera = !useZMove && wantTera && !teraQueuedInTurn;
    const useMega = !useZMove && wantMega && !megaQueuedInTurn;
    const modSuffix = `${useTera ? ' terastallize' : ''}${useMega ? ' mega' : ''}${useZMove ? ' zmove' : ''}`;
    const effectiveTarget = useZMove && zOpt?.target ? zOpt.target : move.target;
    const targetMode = formatNeedsTarget(snapshot.format, effectiveTarget);
    const activeIdx = slotObj?.activeIndex ?? 0;

    if (targetMode === 'none') {
      commitSlotCommand(
        `move ${move.index}${modSuffix}`,
        undefined,
        useTera,
        useMega,
        useZMove
      );
      return;
    }

    if (targetMode === 'ally') {
      const myActiveRow =
        activeSide === 'p2' ? snapshot.p2.active : snapshot.p1.active;
      const reachableAllies = myActiveRow
        .map((m, idx) => ({ m, idx }))
        .filter(
          ({ m, idx }) =>
            m &&
            !m.fainted &&
            !(
              activeSide === 'p1' &&
              (config.emptyPlayerSlots?.includes(idx) ||
                snapshot.emptyPlayerSlots?.includes(idx))
            ) &&
            isAllyTargetReachable(snapshot.format, activeIdx, idx)
        );

      if (reachableAllies.length === 1) {
        commitSlotCommand(
          `move ${move.index} -${reachableAllies[0].idx + 1}${modSuffix}`,
          undefined,
          useTera,
          useMega,
          useZMove
        );
        return;
      }
      if (reachableAllies.length === 0) {
        commitSlotCommand(
          `move ${move.index}${modSuffix}`,
          undefined,
          useTera,
          useMega,
          useZMove
        );
        return;
      }
      setPendingTargetMove({
        move,
        mode: 'ally',
        tera: useTera,
        mega: useMega,
        zmove: useZMove,
        zMoveName: zOpt?.move,
      });
      return;
    }

    const reachableFoes = activeFoes
      .map((m, idx) => ({ m, idx }))
      .filter(
        ({ m, idx }) =>
          m &&
          !m.fainted &&
          isFoeTargetReachable(snapshot.format, activeIdx, idx, effectiveTarget)
      );

    if (reachableFoes.length === 1) {
      commitSlotCommand(
        `move ${move.index} +${reachableFoes[0].idx + 1}${modSuffix}`,
        undefined,
        useTera,
        useMega,
        useZMove
      );
      return;
    }

    setPendingTargetMove({
      move,
      mode: 'foe',
      tera: useTera,
      mega: useMega,
      zmove: useZMove,
      zMoveName: zOpt?.move,
    });
  };

  const handleUndoDoubleSlot = () => {
    setPendingTargetMove(null);
    setWantTera(false);
    setTeraQueuedInTurn(false);
    setWantMega(false);
    setMegaQueuedInTurn(false);
    setWantZMove(false);
    setZMoveQueuedInTurn(false);
    if (!snapshot) return;
    let firstInteractive = 0;
    const leadingPasses: string[] = [];
    while (
      firstInteractive < activePendingSlots.length &&
      activePendingSlots[firstInteractive].pass
    ) {
      leadingPasses.push('pass');
      firstInteractive++;
    }
    if (slotCursor > firstInteractive) {
      setSlotCursor(firstInteractive);
      setQueuedCommands(leadingPasses);
      setReservedSwitchSlots([]);
    }
  };

  const togglePreviewSlot = (slotNum: number, pickCount: number) => {
    setPreviewSelected((prev) => {
      if (prev.includes(slotNum)) {
        return prev.filter((n) => n !== slotNum);
      }
      if (pickCount === 1) {
        return [slotNum];
      }
      if (prev.length >= pickCount) {
        return prev;
      }
      return [...prev, slotNum];
    });
  };

  const effectiveRivalProfile = useMemo(
    () =>
      config.rivalProfile ?? {
        name: config.rivalName,
        title: config.rivalTitle || 'Entrenador Rival',
        bio:
          config.rivalTeamSummary ||
          'Oponente competitivo en simulación de Crown of Galar.',
        tacticalInsight:
          config.rivalIntel?.aiScriptHint ||
          config.rivalIntel?.intelNote ||
          'Observa sus revelaciones de habilidades y objetos para anticipar su plan de juego.',
        archetypeTag: config.isVersusMatch
          ? 'Modo Versus · IA'
          : `Formato: ${config.formatLabel ?? config.formatId}`,
      },
    [config]
  );

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

  const currentSlot = activePendingSlots[slotCursor] ?? null;
  const availableSwitches = activeParty.filter(
    (p) => !p.active && !p.fainted && !reservedSwitchSlots.includes(p.slotIndex)
  );
  const canUndoSlot = activePendingSlots
    .slice(0, slotCursor)
    .some((s) => !s.pass);
  const remainingForceSwitchSlots = activeIsForceSwitch
    ? activePendingSlots
        .slice(slotCursor)
        .filter((s) => s.forceSwitch && !s.pass).length
    : 0;
  const canPassForceSwitch =
    activeIsForceSwitch &&
    (availableSwitches.length === 0 ||
      remainingForceSwitchSlots > availableSwitches.length);
  const isEmptyPlayerSlot = (idx: number) =>
    Boolean(
      config.emptyPlayerSlots?.includes(idx) ||
        snapshot.emptyPlayerSlots?.includes(idx)
    );
  const visibleP1Party = snapshot.p1.party.filter(
    (_, idx) => !isEmptyPlayerSlot(idx)
  );
  const canTeraNow = Boolean(currentSlot?.canTerastallize) && !teraQueuedInTurn;
  const canMegaNow = Boolean(currentSlot?.canMegaEvo) && !megaQueuedInTurn;
  const canZMoveNow =
    Boolean(currentSlot?.canZMove?.some((z) => z !== null)) &&
    !zMoveQueuedInTurn;
  const aliveP1 = visibleP1Party.filter((p) => !p.fainted).length;
  const aliveP2 = Math.max(0, snapshot.totalP2 - snapshot.koCountP2);
  const activeTrainerName =
    activeSide === 'p2' ? config.rivalName : config.playerName;
  const opponentTrainerName =
    activeSide === 'p2' ? config.playerName : config.rivalName;

  const renderActiveSprite = (
    mon: PartyPokemonState | null,
    side: 'p1' | 'p2',
    slotIdx: number
  ) => {
    if (!mon || (side === 'p1' && isEmptyPlayerSlot(slotIdx))) {
      return (
        <div
          className={`flex items-center justify-center rounded-2xl border border-dashed border-slate-700/35 bg-slate-950/15 text-[9px] text-slate-600 ${
            snapshot.format === 'triples' ? 'h-16 w-20 xl:h-20 xl:w-24' : 'h-20 w-24'
          }`}
        >
          {snapshot.format === 'triples' ? 'Flanco vacío' : 'Vacío'}
        </div>
      );
    }

    const cue = snapshot.lastCue;
    const isHit = cue?.targetSide === side && cue?.targetSlot === slotIdx;
    const isAttacking =
      cue?.attackerSide === side && cue?.attackerSlot === slotIdx;
    const showCallout = isHit && cue?.callout;

    return (
      <PokemonTooltip
        mon={mon}
        side={side}
        placement={side === 'p2' ? 'bottom' : 'top'}
      >
        <div
          tabIndex={0}
          className={`group relative flex flex-col items-center rounded-xl px-1 outline-none transition-all duration-300 focus-visible:ring-2 focus-visible:ring-amber-400/70 cursor-help ${
            mon.fainted ? 'opacity-25 grayscale' : 'opacity-100'
          }`}
        >
          {showCallout && (
            <div
              key={cue.id}
              className={`animate-fade-in-up absolute -top-5 z-30 whitespace-nowrap rounded-full px-2 py-0.5 text-[9px] font-extrabold tracking-wider shadow-lg ${
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

          {/* Compact floating name + HP pill above sprite */}
          <div
            className={`flex items-center gap-1.5 rounded-full border bg-slate-950/88 px-2 py-0.5 text-[9px] shadow backdrop-blur transition group-hover:border-amber-400/75 ${
              mon.isShadow
                ? 'border-fuchsia-400/85 text-fuchsia-100 shadow-fuchsia-500/35'
                : mon.terastallized
                  ? 'border-cyan-400/70 text-cyan-100'
                  : side === 'p1'
                    ? 'border-amber-400/35 text-amber-100'
                    : 'border-rose-400/35 text-rose-100'
            }`}
          >
            {mon.isShadow && (
              <span title="Pokémon Oscuro (Colosseum/XD)" className="text-[9px] font-black text-fuchsia-300">
                🟣
              </span>
            )}
            <span className="max-w-[6.5rem] truncate font-bold text-white">
              {mon.shiny && (
                <span className="mr-0.5 text-amber-300" title="Variocolor (Shiny Charm)">
                  ✨
                </span>
              )}
              {mon.name}
            </span>
            {mon.hyperMode && (
              <span
                title="Modo Hiper activo (+2 Crítico, +15% daño Shadow, -1/12 PS/turno, desobedece no-Shadow · Usa 📢 Llamar)"
                className="animate-pulse rounded bg-fuchsia-600/90 px-1 text-[7.5px] font-black text-white shadow shadow-fuchsia-500/40"
              >
                ⚡HIPER
              </span>
            )}
            {mon.terastallized && (
              <span className="font-extrabold text-cyan-300">
                ✦{mon.terastallized}
              </span>
            )}
            {mon.isBossAce && (
              <Crown className="h-2.5 w-2.5 text-amber-400" />
            )}
            <span className="font-mono-code font-bold text-slate-300">
              {mon.hpPercent}%
            </span>
          </div>

          <div
            key={`${mon.ident}-${isHit ? cue?.id : 'idle'}`}
            className={`mt-0.5 flex items-center justify-center ${
              snapshot.format === 'triples'
                ? 'h-16 w-20 xl:h-20 xl:w-24'
                : snapshot.format === 'doubles'
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
              shiny={Boolean(mon.shiny)}
              className="max-h-full max-w-full"
            />
          </div>
        </div>
      </PokemonTooltip>
    );
  };

  /**
   * Switch Broadcast Bottom HUD Plate (inspired by Worlds 2024 Switch overlay):
   * `Lv. 50 Miraidon 181/181` with full color bar, boosts, status, and hover PokemonTooltip.
   */
  const renderSwitchHudPlate = (
    mon: PartyPokemonState | null,
    side: 'p1' | 'p2',
    idx: number
  ) => {
    if (!mon || (side === 'p1' && isEmptyPlayerSlot(idx))) return null;
    const statusBadge = mon.status ? STATUS_BADGE_STYLES[mon.status] : null;
    const boosts = Object.entries(mon.boosts).filter(([, v]) => v !== 0);

    return (
      <PokemonTooltip
        key={`hud-${side}-${idx}-${mon.ident}`}
        mon={mon}
        side={side}
        placement="top"
      >
        <div
          tabIndex={0}
          className={`flex min-w-0 flex-1 flex-col rounded-xl border bg-slate-950/92 px-2.5 py-1.5 backdrop-blur-md transition hover:border-amber-400/75 cursor-help ${
            mon.fainted
              ? 'border-slate-800 opacity-40 grayscale'
              : mon.isShadow
                ? 'border-fuchsia-400/80 shadow-md shadow-fuchsia-600/25'
                : mon.terastallized
                  ? 'border-cyan-400/75'
                  : side === 'p1'
                    ? 'border-amber-400/40'
                    : 'border-rose-400/40'
          }`}
        >
          <div className="flex items-center justify-between gap-1 text-[10px]">
            <div className="flex min-w-0 items-center gap-1">
              <span className="font-mono-code rounded bg-slate-900 px-1 text-[9px] font-bold text-amber-200">
                Lv.{mon.level}
              </span>
              {mon.isShadow && (
                <span className="rounded bg-fuchsia-950 px-1 text-[8px] font-black text-fuchsia-300 ring-1 ring-fuchsia-400/50">
                  {mon.hyperMode ? '⚡HIPER' : 'OSCURO'}
                </span>
              )}
              <span className="truncate font-extrabold text-white">
                {mon.name}
              </span>
              {mon.gender && (
                <span
                  className={`text-[9px] font-bold ${
                    mon.gender === 'M' ? 'text-sky-400' : 'text-pink-400'
                  }`}
                >
                  {mon.gender === 'M' ? '♂' : '♀'}
                </span>
              )}
              {mon.isBossAce && (
                <Crown className="h-3 w-3 shrink-0 text-amber-400" />
              )}
            </div>
            <div className="flex shrink-0 items-center gap-1">
              {statusBadge && (
                <span
                  className={`rounded px-1 text-[8px] font-extrabold ${statusBadge.cls}`}
                >
                  {statusBadge.label}
                </span>
              )}
              {boosts.slice(0, 2).map(([st, val]) => (
                <span
                  key={st}
                  className={`font-mono-code rounded px-1 text-[8px] font-bold ${
                    val > 0
                      ? 'bg-emerald-500/25 text-emerald-300'
                      : 'bg-rose-500/25 text-rose-300'
                  }`}
                >
                  {val > 0 ? `+${val}` : val}
                  {st}
                </span>
              ))}
            </div>
          </div>

          <div className="mt-1 flex items-center gap-1.5">
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-800 ring-1 ring-white/10">
              <div
                className={`h-full rounded-full transition-all duration-500 ${hpBarColor(mon.hpPercent)}`}
                style={{ width: `${mon.hpPercent}%` }}
              />
            </div>
            <span className="font-mono-code shrink-0 text-[10px] font-bold text-slate-100">
              {side === 'p1' ? `${mon.hp}/${mon.maxhp}` : `${mon.hpPercent}%`}
            </span>
          </div>
        </div>
      </PokemonTooltip>
    );
  };

  const playerRailCount = Math.min(6, Math.max(visibleP1Party.length, 1));
  const playerRailSlots = Array.from(
    { length: playerRailCount },
    (_, i) => visibleP1Party[i] ?? null
  );

  // Visual lane order: in Triples, P2 row is mirrored [2, 1, 0] so P2 pos 2 faces P1 pos 0 (Left)!
  const p2ActiveIndices =
    snapshot.format === 'triples'
      ? [2, 1, 0].filter((i) => i < snapshot.p2.active.length)
      : snapshot.p2.active.map((_, i) => i);
  const p1ActiveIndices = snapshot.p1.active.map((_, i) => i);
  const triplesLaneLabel = (visualCol: number) =>
    visualCol === 0 ? 'Flanco Izq' : visualCol === 1 ? 'Centro' : 'Flanco Der';

  const rivalRailCount = Math.min(
    6,
    Math.max(snapshot.totalP2, snapshot.p2.party.length, 1)
  );
  const rivalRailSlots = Array.from(
    { length: rivalRailCount },
    (_, i) => snapshot.p2.party[i] ?? null
  );

  const latestLogText = useMemo(() => {
    if (!snapshot || snapshot.log.length === 0) return '';
    for (let i = snapshot.log.length - 1; i >= 0; i--) {
      const entry = snapshot.log[i];
      if (entry.kind !== 'turn' && entry.text.trim()) return entry.text;
    }
    return snapshot.log[snapshot.log.length - 1]?.text ?? '';
  }, [snapshot]);

  return (
    /* Strict viewport lock on Desktop (`lg:`); natural `min-h-[100dvh]` on mobile/tablet so landscape never crushes sprites or move buttons! */
    <div className="flex min-h-[100dvh] flex-col overflow-x-hidden bg-[#060a14] text-slate-100 lg:h-[100dvh] lg:max-h-[100dvh] lg:overflow-hidden">
      {/* RESPONSIVE SWITCH-STYLE TOP BROADCAST BAR */}
      <header className="relative z-30 flex shrink-0 flex-wrap items-center justify-between gap-1.5 border-b border-amber-400/25 bg-gradient-to-r from-[#0c1428] via-[#130d24] to-[#1f0b18] px-2.5 py-1.5 backdrop-blur-md sm:px-3">
        {/* Left Player Scoreboard Wing */}
        <div className="flex min-w-0 items-center gap-1.5">
          <ActionInfoTooltip
            title="Salir del Combate"
            description="Regresa al Selector de Capítulos (el combate actual no se guardará)."
          >
            <button
              onClick={onExitToChapters}
              className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-slate-700 bg-slate-950/90 px-2 py-1 text-[11px] font-semibold text-slate-300 transition hover:border-amber-400/50 hover:text-white cursor-pointer"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Salir</span>
            </button>
          </ActionInfoTooltip>

          <div className="hidden items-center gap-1.5 rounded-lg border border-amber-400/35 bg-amber-500/15 px-2 py-0.5 md:flex">
            <span className="max-w-[7rem] truncate text-[11px] font-bold text-amber-200">
              {config.playerName}
            </span>
            <span className="font-mono-code rounded bg-slate-950/80 px-1.5 text-[10px] font-extrabold text-emerald-300">
              {aliveP1}
            </span>
          </div>

          {attemptNumber != null && attemptNumber > 0 && (
            <ActionInfoTooltip
              title={`Intento #${attemptNumber}`}
              badge="Kaizo Tracker"
              description="Contador persistente de intentos en este capítulo."
            >
              <span className="font-mono-code hidden items-center gap-1 rounded-lg border border-slate-700/90 bg-slate-950/90 px-2 py-0.5 text-[10px] font-bold text-slate-300 lg:inline-flex cursor-help">
                <RefreshCw className="h-2.5 w-2.5 text-amber-400" />
                #{attemptNumber}
              </span>
            </ActionInfoTooltip>
          )}
        </div>

        {/* Center Switch Broadcast Pill: Format + Active Field Timers */}
        <div className="flex min-w-0 flex-wrap items-center justify-center gap-1">
          <ActionInfoTooltip
            title={snapshot.formatLabel}
            badge={snapshot.formatId}
            description={getFormatRuleDescription(snapshot.formatId)}
          >
            <button
              type="button"
              className="max-w-[10rem] truncate rounded-full border border-amber-400/40 bg-slate-950/90 px-2.5 py-0.5 text-[10.5px] font-extrabold tracking-wide text-amber-200 transition hover:border-amber-300 sm:max-w-none sm:px-3 sm:py-1 sm:text-[11px] cursor-help"
            >
              {snapshot.formatLabel}
            </button>
          </ActionInfoTooltip>

          {snapshot.weather && (
            <FieldEffectTooltip
              effectName={snapshot.weather}
              turnsLeft={snapshot.weatherTurnsLeft}
            >
              <button
                type="button"
                className={`inline-flex shrink-0 items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold cursor-help ${
                  snapshot.weather.toLowerCase().includes('oscuro')
                    ? 'border-fuchsia-400/70 bg-fuchsia-950/75 text-fuchsia-100 shadow-sm shadow-fuchsia-500/30'
                    : 'border-sky-400/45 bg-sky-500/20 text-sky-100'
                }`}
              >
                <CloudSun className={`h-3 w-3 ${snapshot.weather.toLowerCase().includes('oscuro') ? 'text-fuchsia-300' : 'text-sky-300'}`} />
                <span className="hidden sm:inline">{snapshot.weather}</span>
                {snapshot.weatherTurnsLeft != null && (
                  <span className="font-mono-code text-amber-200">
                    {snapshot.weatherTurnsLeft >= 50 ? '∞' : `${snapshot.weatherTurnsLeft}t`}
                  </span>
                )}
              </button>
            </FieldEffectTooltip>
          )}

          {snapshot.terrain && (
            <FieldEffectTooltip
              effectName={snapshot.terrain}
              turnsLeft={snapshot.terrainTurnsLeft}
            >
              <button
                type="button"
                className="hidden shrink-0 items-center gap-1 rounded-full border border-emerald-400/45 bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-100 sm:inline-flex cursor-help"
              >
                <span>{snapshot.terrain}</span>
                {snapshot.terrainTurnsLeft != null && (
                  <span className="font-mono-code text-amber-200">
                    · {snapshot.terrainTurnsLeft >= 50 ? '∞' : `${snapshot.terrainTurnsLeft}t`}
                  </span>
                )}
              </button>
            </FieldEffectTooltip>
          )}

          {snapshot.trickRoomTurnsLeft != null && (
            <FieldEffectTooltip
              effectName="Trick Room"
              turnsLeft={snapshot.trickRoomTurnsLeft}
            >
              <button
                type="button"
                className="inline-flex shrink-0 items-center gap-1 rounded-full border border-violet-400/50 bg-violet-500/25 px-2 py-0.5 text-[10px] font-bold text-violet-100 cursor-help"
              >
                <span>TR</span>
                <span className="font-mono-code text-amber-200">
                  {snapshot.trickRoomTurnsLeft >= 50 ? '∞' : `${snapshot.trickRoomTurnsLeft}t`}
                </span>
              </button>
            </FieldEffectTooltip>
          )}

          {(snapshot.activePseudoWeathers ?? [])
            .filter((pw) => pw.id !== 'trickroom')
            .map((pw) => {
              const badgeStyle =
                pw.id === 'gravity'
                  ? 'border-amber-400/55 bg-amber-500/20 text-amber-100'
                  : pw.id === 'magicroom'
                    ? 'border-fuchsia-400/55 bg-fuchsia-500/20 text-fuchsia-100'
                    : 'border-cyan-400/55 bg-cyan-500/20 text-cyan-100';
              return (
                <FieldEffectTooltip
                  key={pw.id}
                  effectName={pw.label}
                  turnsLeft={pw.turnsLeft}
                >
                  <button
                    type="button"
                    className={`inline-flex shrink-0 items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold cursor-help ${badgeStyle}`}
                  >
                    <Sparkles className="h-3 w-3 opacity-85" />
                    <span className="hidden sm:inline">{pw.label}</span>
                    {pw.turnsLeft != null && (
                      <span className="font-mono-code text-amber-200">
                        {pw.turnsLeft >= 50 ? '∞' : `${pw.turnsLeft}t`}
                      </span>
                    )}
                  </button>
                </FieldEffectTooltip>
              );
            })}
        </div>

        {/* Right Broadcast Wing: Rival KO + Mobile Log Drawer Toggle + Teamsheet + Paste + AI + Restart */}
        <div className="flex shrink-0 items-center gap-1 sm:gap-1.5">
          <ActionInfoTooltip
            title="Marcador de Rivales"
            badge={`${aliveP2} vivos`}
            description={`Rivales debilitados: ${snapshot.koCountP2} de ${snapshot.totalP2}.`}
          >
            <div className="inline-flex items-center gap-1 rounded-lg border border-rose-400/35 bg-rose-500/15 px-1.5 py-1 text-[10.5px] font-bold text-rose-200 sm:px-2 sm:text-[11px] cursor-help">
              <Flame className="h-3 w-3 text-rose-400" />
              <span>
                {snapshot.koCountP2}/{snapshot.totalP2}
              </span>
            </div>
          </ActionInfoTooltip>

          {/* Mobile/Tablet (<1024px) Battle Log Drawer Toggle */}
          <button
            type="button"
            onClick={() => setShowMobileLog((v) => !v)}
            className={`inline-flex items-center gap-1 rounded-lg border px-2 py-1 text-[10.5px] font-extrabold transition lg:hidden cursor-pointer ${
              showMobileLog
                ? 'border-amber-400 bg-amber-500/25 text-amber-100'
                : 'border-amber-400/45 bg-amber-500/15 text-amber-200 hover:bg-amber-500/25'
            }`}
          >
            <ScrollText className="h-3.5 w-3.5" />
            <span>Log</span>
          </button>

          {snapshot.openTeamsheet.enabled && (
            <ActionInfoTooltip
              title="Open Teamsheet Oficial"
              badge="VGC / 1v1"
              description="Inspecciona objetos, habilidades, teratipos y movimientos de ambos equipos."
            >
              <button
                onClick={() => setShowTeamsheetModal(true)}
                className="inline-flex items-center gap-1 rounded-lg border border-sky-400/50 bg-sky-500/20 px-2 py-1 text-[11px] font-bold text-sky-100 hover:bg-sky-500/30 cursor-pointer"
              >
                <ClipboardList className="h-3.5 w-3.5" />
                <span className="hidden md:inline">Teamsheet</span>
              </button>
            </ActionInfoTooltip>
          )}

          <ActionInfoTooltip
            title="Showdown Paste"
            description="Equipos inyectados en el simulador."
          >
            <button
              onClick={() => {
                setRevealRivalPasteInModal(false);
                setShowPasteModal(true);
              }}
              className="hidden items-center gap-1 rounded-lg border border-slate-700 bg-slate-900 px-2 py-1 text-[11px] font-semibold text-slate-300 hover:border-sky-400/50 hover:text-white sm:inline-flex cursor-pointer"
            >
              <Code2 className="h-3.5 w-3.5" />
              <span className="hidden md:inline">Paste</span>
            </button>
          </ActionInfoTooltip>

          <ActionInfoTooltip
            title="IA & Coach"
            badge={
              snapshot.activeRivalController === 'human'
                ? 'Hotseat'
                : snapshot.activeRivalController === 'llm'
                  ? 'LLM'
                  : 'Offline'
            }
            description="Ajustes de Gemini u Ollama para Coach y Game Review."
          >
            <button
              onClick={onOpenAISettings}
              className={`inline-flex items-center gap-1 rounded-lg border px-1.5 py-1 text-[11px] font-semibold transition sm:px-2 cursor-pointer ${
                snapshot.activeRivalController === 'llm'
                  ? 'border-violet-400/50 bg-violet-500/20 text-violet-200'
                  : 'border-slate-700 bg-slate-900 text-slate-300 hover:border-amber-400/50 hover:text-white'
              }`}
            >
              <Settings2 className="h-3.5 w-3.5" />
              <span className="hidden lg:inline">
                {snapshot.activeRivalController === 'human'
                  ? 'Hotseat'
                  : snapshot.activeRivalController === 'llm'
                    ? 'IA LLM'
                    : 'IA'}
              </span>
            </button>
          </ActionInfoTooltip>

          <ActionInfoTooltip
            title="Reiniciar"
            description="Reinicia este combate desde Turno 1."
          >
            <button
              onClick={() => {
                onRetryAttempt?.();
                startBattle();
              }}
              className="inline-flex items-center justify-center rounded-lg border border-slate-700 bg-slate-900 p-1.5 text-slate-300 hover:border-amber-400/50 hover:text-white cursor-pointer"
            >
              <RefreshCw className="h-3.5 w-3.5" />
            </button>
          </ActionInfoTooltip>
        </div>
      </header>

      {/* RESPONSIVE WORKSPACE: Full-width Arena on Mobile/Tablet (<1024px) + Side Log on Desktop (lg:) */}
      <div className="relative flex min-h-0 flex-1 flex-row lg:overflow-hidden">
        {/* LEFT COLUMN */}
        <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-1.5 p-1.5 sm:gap-2 sm:p-2.5 lg:overflow-hidden">
          {snapshot.status === 'team-preview' && activeTeamPreview ? (
            /* ================= INTERACTIVE TEAM PREVIEW OVERLAY (1v1 / VGC / Monotype / Versus) ================= */
            <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-amber-400/35 bg-slate-950 shadow-2xl">
              <SceneBackdrop theme={config.arenaTheme} className="opacity-55" />

              {isHotseatLocked ? (
                <div className="relative z-10 flex flex-1 flex-col items-center justify-center p-6 text-center">
                  <div className="max-w-md rounded-3xl border border-amber-400/40 bg-slate-950/90 p-7 shadow-2xl backdrop-blur-xl">
                    <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl border border-amber-400/40 bg-amber-500/15 text-amber-300">
                      <Lock className="h-6 w-6" />
                    </div>
                    <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-amber-300">
                      HOTSEAT LOCAL · TEAM PREVIEW PRIVADO
                    </p>
                    <h2 className="font-display mt-1 text-xl font-extrabold text-white">
                      Turno de {activeTrainerName}
                    </h2>
                    <p className="mt-2 text-xs leading-relaxed text-slate-300">
                      Asegúrate de que <strong>{opponentTrainerName}</strong> no esté mirando la pantalla antes de elegir tu equipo.
                    </p>
                    <button
                      type="button"
                      onClick={() => setUnlockedHotseatKey(hotseatGateKey)}
                      className="mt-5 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 px-6 py-2.5 text-xs font-extrabold text-slate-950 shadow-lg hover:brightness-110 cursor-pointer"
                    >
                      <Users className="h-4 w-4" />
                      Estoy listo — Ver Team Preview de {activeTrainerName}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="relative z-10 flex min-h-0 flex-1 flex-col justify-between overflow-y-auto p-4">
                  <div>
                    <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-3">
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-amber-300">
                          TEAM PREVIEW INTERACTIVO · {snapshot.formatLabel}
                          {snapshot.p2Control === 'human'
                            ? ` · TURNO DE ${activeTrainerName.toUpperCase()}`
                            : ''}
                        </p>
                        <h2 className="font-display text-lg font-extrabold text-white sm:text-xl">
                          {activeTeamPreview.mode === 'pick-1'
                            ? 'Elige 1 de tus 3 Pokémon (Duelo 1v1 sin cambios)'
                            : activeTeamPreview.mode === 'pick-4'
                              ? 'Elige 4 de tus 6 Pokémon (1–2 Líderes, 3–4 Banca)'
                              : 'Elige tu Pokémon Líder (Lead 1 de 6)'}
                        </h2>
                      </div>

                      {snapshot.openTeamsheet.enabled && (
                        <button
                          onClick={() => setShowTeamsheetModal(true)}
                          className="inline-flex items-center gap-1.5 rounded-xl border border-sky-400/50 bg-sky-500/20 px-3.5 py-2 text-xs font-bold text-sky-100 hover:bg-sky-500/30 cursor-pointer"
                        >
                          <ClipboardList className="h-4 w-4" />
                          Ver Open Teamsheet Completo
                        </button>
                      )}
                    </div>

                    {/* Rival Preview Row */}
                    <div className="mb-4">
                      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <RivalPortraitTooltip
                            profile={effectiveRivalProfile}
                            charId={config.rivalCharId}
                            placement="bottom"
                          >
                            <button
                              type="button"
                              aria-label={`Ver dossier táctico de ${effectiveRivalProfile.name}`}
                              className="group relative h-9 w-9 shrink-0 overflow-hidden rounded-full border-2 border-rose-400/75 bg-slate-900 p-0.5 shadow-md shadow-rose-500/25 transition hover:scale-105 hover:border-amber-300 focus-visible:ring-2 focus-visible:ring-amber-400 cursor-help"
                            >
                              <CharacterPortrait
                                charId={config.rivalCharId}
                                variant="bust"
                                className="h-full w-full rounded-full object-cover object-top"
                              />
                            </button>
                          </RivalPortraitTooltip>
                          <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-rose-300">
                            <Swords className="h-3.5 w-3.5" />
                            Equipo de {opponentTrainerName} (
                            {activeTeamPreview.rivalRoster.length} Pokémon)
                          </p>
                        </div>
                        <span className="rounded-md border border-rose-400/35 bg-rose-500/15 px-2 py-0.5 text-[10px] font-semibold text-rose-200">
                          Pasa el cursor o haz clic en el retrato rival para lectura táctica
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
                        {activeTeamPreview.rivalRoster.map((rMon, idx) => (
                          <div
                            key={`tp-rival-${rMon.species}-${idx}`}
                            className="flex flex-col items-center rounded-2xl border border-rose-400/25 bg-slate-950/85 p-2 text-center backdrop-blur"
                          >
                            <PokemonSprite
                              species={rMon.species}
                              side="p2"
                              className="h-14 w-14"
                            />
                            <p className="mt-1 w-full truncate text-[11px] font-bold text-white">
                              {rMon.species}
                            </p>
                            <div className="mt-0.5 flex flex-wrap justify-center gap-0.5">
                              {rMon.types.map((t) => (
                                <span
                                  key={t}
                                  className={`rounded border px-1 text-[8px] font-bold uppercase ${getTypeBadgeClass(t)}`}
                                >
                                  {t}
                                </span>
                              ))}
                            </div>
                            {rMon.openSheet && (
                              <p className="mt-1 w-full truncate text-[9px] text-amber-200/90">
                                @ {rMon.openSheet.item}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Player Selectable Row */}
                    <div>
                      <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-amber-300">
                        {activeTrainerName}: selecciona en orden ({previewSelected.length} /{' '}
                        {activeTeamPreview.pickCount}) — pasa el mouse para ver sets exactos
                      </p>
                      <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-6">
                        {activeTeamPreview.playerRoster.map((pMon) => {
                          const orderIdx = previewSelected.indexOf(pMon.slotIndex);
                          const isSelected = orderIdx !== -1;
                          const roleTag =
                            activeTeamPreview.mode === 'pick-4'
                              ? orderIdx < 2
                                ? `LÍDER ${orderIdx + 1}`
                                : `BANCA ${orderIdx - 1}`
                              : activeTeamPreview.mode === 'pick-1'
                                ? 'ELEGIDO'
                                : 'LÍDER';

                          return (
                            <PokemonTooltip
                              key={pMon.ident}
                              mon={pMon}
                              side="p1"
                              placement="top"
                            >
                              <button
                                type="button"
                                onClick={() =>
                                  togglePreviewSlot(
                                    pMon.slotIndex,
                                    activeTeamPreview.pickCount
                                  )
                                }
                                className={`relative flex w-full flex-col items-center rounded-2xl border p-2.5 text-center transition cursor-pointer ${
                                  isSelected
                                    ? 'border-amber-400 bg-amber-500/20 ring-2 ring-amber-400/50 shadow-lg shadow-amber-500/15'
                                    : 'border-slate-700/80 bg-slate-900/85 hover:border-amber-400/50'
                                }`}
                              >
                                {isSelected && (
                                  <span className="absolute -top-2 right-1.5 rounded-full bg-amber-400 px-2 py-0.5 text-[9px] font-extrabold text-slate-950 shadow">
                                    {roleTag}
                                  </span>
                                )}
                                <PokemonSprite
                                  species={pMon.species}
                                  side="p2"
                                  shiny={Boolean(pMon.shiny)}
                                  className="h-14 w-14"
                                />
                                <p className="mt-1 w-full truncate text-[11px] font-extrabold text-white">
                                  {pMon.shiny ? '✨ ' : ''}
                                  {pMon.species}
                                </p>
                                <p className="w-full truncate text-[9px] text-amber-200/85">
                                  @ {pMon.item || 'Sin obj.'}
                                </p>
                                {pMon.teraType && (
                                  <span className="mt-1 rounded bg-cyan-500/15 px-1.5 text-[8px] font-bold text-cyan-200">
                                    ✦ Tera {pMon.teraType}
                                  </span>
                                )}
                              </button>
                            </PokemonTooltip>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Team Preview Confirmation Footer */}
                  <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-3">
                    <button
                      type="button"
                      onClick={() => setPreviewSelected([])}
                      className="rounded-xl border border-slate-700 bg-slate-900 px-3.5 py-2 text-xs font-semibold text-slate-300 hover:text-white cursor-pointer"
                    >
                      Limpiar selección
                    </button>

                    <button
                      type="button"
                      disabled={
                        previewSelected.length !== activeTeamPreview.pickCount
                      }
                      onClick={() => {
                        if (activeSide === 'p2') {
                          void controllerRef.current?.submitP2TeamOrder(previewSelected);
                        } else {
                          void controllerRef.current?.submitTeamOrder(previewSelected);
                        }
                      }}
                      className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 px-6 py-2.5 text-xs font-extrabold text-slate-950 shadow-xl shadow-amber-500/25 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40 cursor-pointer"
                    >
                      <Check className="h-4 w-4" />
                      Confirmar Selección ({activeTrainerName})
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* ================= SWITCH-STYLE LIVE BATTLE ARENA ================= */
            <>
              {/* 1. BATTLEFIELD STAGE (flex-1 min-h-[250px] on mobile/landscape, min-h-0 on desktop) */}
              <div className="relative flex min-h-[250px] flex-1 flex-col overflow-hidden rounded-2xl border border-amber-400/25 bg-slate-950 shadow-2xl sm:min-h-[280px] lg:min-h-0">
                <SceneBackdrop theme={config.arenaTheme} className="opacity-85" />

                {/* Top Arena Overlay: Turn Badge + Side Conditions with Timers + FieldEffectTooltip */}
                <div className="relative z-20 flex shrink-0 flex-wrap items-center justify-between gap-1.5 px-3 pt-2">
                  <div className="font-display rounded-lg border border-amber-400/55 bg-slate-950/90 px-2.5 py-0.5 text-[11px] font-extrabold tracking-wider text-amber-200 shadow">
                    Turn {Math.max(1, snapshot.turn)}
                  </div>

                  <div className="flex flex-wrap items-center gap-1">
                    {snapshot.p1.sideConditions.map((sc) => (
                      <FieldEffectTooltip
                        key={`p1-${sc}`}
                        effectName={sc}
                        turnsLeft={snapshot.p1.sideTimers[sc] ?? null}
                        sideLabel={config.playerName}
                      >
                        <button
                          type="button"
                          className="rounded border border-sky-400/45 bg-sky-500/20 px-1.5 py-0.5 text-[9px] font-bold text-sky-100 cursor-help"
                        >
                          Tu lado: {sc}
                          {snapshot.p1.sideTimers[sc]
                            ? ` (${snapshot.p1.sideTimers[sc]}t)`
                            : ''}
                        </button>
                      </FieldEffectTooltip>
                    ))}
                    {snapshot.p2.sideConditions.map((sc) => (
                      <FieldEffectTooltip
                        key={`p2-${sc}`}
                        effectName={sc}
                        turnsLeft={snapshot.p2.sideTimers[sc] ?? null}
                        sideLabel={config.rivalName}
                      >
                        <button
                          type="button"
                          className="rounded border border-rose-400/45 bg-rose-500/20 px-1.5 py-0.5 text-[9px] font-bold text-rose-100 cursor-help"
                        >
                          Rival: {sc}
                          {snapshot.p2.sideTimers[sc]
                            ? ` (${snapshot.p2.sideTimers[sc]}t)`
                            : ''}
                        </button>
                      </FieldEffectTooltip>
                    ))}
                  </div>
                </div>

                {/* 3-Zone Stage: Switch Vertical Circle Rails (sm:+) + Center Sprites */}
                <div className="relative z-10 flex min-h-0 flex-1 items-stretch justify-between gap-1 px-1.5 py-0.5 sm:gap-1.5 sm:px-2 sm:py-1">
                  {/* LEFT SWITCH VERTICAL CIRCLE RAIL (Hidden on narrow mobile so sprites get full width!) */}
                  <div className="hidden w-12 shrink-0 flex-col items-center justify-center gap-1 rounded-xl border border-amber-400/15 bg-slate-950/55 py-1.5 backdrop-blur-sm sm:flex xl:w-16">
                    <div className="h-11 w-11 shrink-0 overflow-hidden rounded-full border-2 border-amber-400/60 bg-slate-900 p-0.5 shadow">
                      <CharacterPortrait
                        charId={config.playerCharId}
                        variant="bust"
                        className="h-full w-full rounded-full object-cover object-top"
                      />
                    </div>
                    <div className="flex flex-col items-center gap-1">
                      {playerRailSlots.map((mon, idx) =>
                        mon ? (
                          <PokemonTooltip
                            key={`rail-p1-${mon.ident}`}
                            mon={mon}
                            side="p1"
                            placement="right"
                          >
                            <button
                              type="button"
                              onClick={() => {
                                const canQuickSwitch =
                                  activeSide === 'p1' &&
                                  !isHotseatLocked &&
                                  snapshot.status === 'awaiting-choice' &&
                                  currentSlot &&
                                  !currentSlot.trapped &&
                                  !mon.active &&
                                  !mon.fainted &&
                                  !reservedSwitchSlots.includes(mon.slotIndex);
                                if (canQuickSwitch) {
                                  commitSlotCommand(
                                    `switch ${mon.slotIndex}`,
                                    mon.slotIndex
                                  );
                                }
                              }}
                              className={`flex h-8 w-8 items-center justify-center rounded-full border-2 transition cursor-pointer ${
                                mon.fainted
                                  ? 'border-slate-700 bg-slate-950/80 opacity-30 grayscale'
                                  : mon.active
                                    ? 'border-amber-400 bg-amber-400/25 shadow-md shadow-amber-400/30'
                                    : 'border-slate-600/80 bg-slate-900/90 hover:border-sky-400'
                              }`}
                            >
                              <PokemonIcon
                                species={mon.species}
                                className="scale-[0.62]"
                              />
                            </button>
                          </PokemonTooltip>
                        ) : (
                          <div
                            key={`rail-p1-empty-${idx}`}
                            className="h-7 w-7 rounded-full border border-slate-800/50 bg-slate-950/30"
                          />
                        )
                      )}
                    </div>
                  </div>

                  {/* CENTER SPRITE ARENA */}
                  <div className="relative flex min-h-0 flex-1 flex-col justify-between py-0.5">
                    <div
                      className={`flex items-start ${
                        snapshot.format === 'triples'
                          ? 'justify-around gap-1.5 px-1'
                          : 'justify-end gap-3 pr-2 xl:gap-6 xl:pr-5'
                      }`}
                    >
                      {p2ActiveIndices.map((slotIdx, visualCol) => {
                        const mon = snapshot.p2.active[slotIdx] ?? null;
                        return (
                          <div
                            key={`p2-active-${slotIdx}`}
                            className="flex flex-col items-center"
                          >
                            {snapshot.format === 'triples' && (
                              <span className="mb-0.5 rounded bg-rose-500/15 px-1.5 py-0.2 text-[8px] font-bold uppercase tracking-wider text-rose-200/80">
                                {triplesLaneLabel(visualCol)}
                              </span>
                            )}
                            {renderActiveSprite(mon, 'p2', slotIdx)}
                          </div>
                        );
                      })}
                    </div>

                    <div
                      className={`flex items-end ${
                        snapshot.format === 'triples'
                          ? 'justify-around gap-1.5 px-1'
                          : 'justify-start gap-3 pl-2 xl:gap-6 xl:pl-5'
                      }`}
                    >
                      {p1ActiveIndices.map((slotIdx, visualCol) => {
                        const mon = snapshot.p1.active[slotIdx] ?? null;
                        return (
                          <div
                            key={`p1-active-${slotIdx}`}
                            className="flex flex-col items-center"
                          >
                            {renderActiveSprite(mon, 'p1', slotIdx)}
                            {snapshot.format === 'triples' && (
                              <span className="mt-0.5 rounded bg-amber-500/15 px-1.5 py-0.2 text-[8px] font-bold uppercase tracking-wider text-amber-200/80">
                                {triplesLaneLabel(visualCol)}
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* RIGHT SWITCH VERTICAL CIRCLE RAIL (Hidden on narrow mobile so sprites get full width!) */}
                  <div className="hidden w-12 shrink-0 flex-col items-center justify-center gap-1 rounded-xl border border-rose-500/20 bg-slate-950/55 py-1.5 backdrop-blur-sm sm:flex xl:w-16">
                    <RivalPortraitTooltip
                      profile={effectiveRivalProfile}
                      charId={config.rivalCharId}
                      placement="left"
                    >
                      <button
                        type="button"
                        aria-label={`Ver dossier táctico de ${effectiveRivalProfile.name}`}
                        className="group relative h-11 w-11 shrink-0 overflow-hidden rounded-full border-2 border-rose-500/75 bg-slate-900 p-0.5 shadow-md shadow-rose-500/20 transition hover:scale-105 hover:border-amber-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 cursor-help"
                      >
                        <CharacterPortrait
                          charId={config.rivalCharId}
                          variant="bust"
                          className="h-full w-full rounded-full object-cover object-top"
                        />
                        <span className="pointer-events-none absolute -right-0.5 -bottom-0.5 h-2.5 w-2.5 rounded-full border border-slate-950 bg-amber-400 shadow" />
                      </button>
                    </RivalPortraitTooltip>
                    <div className="flex flex-col items-center gap-1">
                      {rivalRailSlots.map((mon, idx) => (
                        <PokemonTooltip
                          key={mon ? `rail-p2-${mon.ident}` : `rail-p2-hidden-${idx}`}
                          mon={mon}
                          side="p2"
                          placement="left"
                        >
                          <button
                            type="button"
                            className={`flex h-8 w-8 items-center justify-center rounded-full border-2 transition cursor-help ${
                              !mon
                                ? 'border-rose-500/35 bg-slate-950/85 hover:border-rose-400'
                                : mon.fainted
                                  ? 'border-slate-700 bg-slate-950/80 opacity-30 grayscale'
                                  : mon.active
                                    ? 'border-amber-400 bg-rose-500/25 shadow-md shadow-rose-500/30'
                                    : 'border-slate-600/80 bg-slate-900/90 hover:border-rose-400'
                            }`}
                          >
                            {mon ? (
                              <PokemonIcon
                                species={mon.species}
                                className="scale-[0.62]"
                              />
                            ) : (
                              <UnrevealedPokeballSvg className="h-4 w-4" />
                            )}
                          </button>
                        </PokemonTooltip>
                      ))}
                    </div>
                  </div>
                </div>

                {/* SWITCH BROADCAST BOTTOM ACTIVE-COMBATANTS BAR */}
                <div className="relative z-20 grid shrink-0 grid-cols-2 gap-1.5 border-t border-white/10 bg-slate-950/80 px-2 py-1 backdrop-blur-md sm:gap-2 sm:px-2.5 sm:py-1.5">
                  <div className="flex min-w-0 flex-col gap-1 sm:flex-row sm:gap-1.5">
                    {snapshot.p1.active.map((mon, idx) =>
                      renderSwitchHudPlate(mon, 'p1', idx)
                    )}
                  </div>
                  <div className="flex min-w-0 flex-col gap-1 sm:flex-row sm:gap-1.5">
                    {p2ActiveIndices.map((slotIdx) =>
                      renderSwitchHudPlate(snapshot.p2.active[slotIdx] ?? null, 'p2', slotIdx)
                    )}
                  </div>
                </div>

                {/* Mobile/Tablet (<1024px) Compact 1-Line Last-Event Ticker -> Tap to open Log Drawer */}
                {latestLogText && (
                  <button
                    type="button"
                    onClick={() => setShowMobileLog(true)}
                    className="relative z-20 flex shrink-0 items-center justify-between gap-2 border-t border-amber-400/20 bg-slate-950/95 px-2.5 py-1 text-left text-[10.5px] text-slate-300 hover:text-amber-200 lg:hidden cursor-pointer"
                  >
                    <span className="truncate">
                      <span className="mr-1 font-bold text-amber-300">📜</span>
                      {latestLogText}
                    </span>
                    <span className="shrink-0 text-[9.5px] font-bold text-amber-300">
                      Ver Log ▸
                    </span>
                  </button>
                )}
              </div>

              {/* 2. COMPACT SCRIPTED TAUNT STRIP */}
              {snapshot.activeTaunt && (
                <div
                  key={snapshot.activeTaunt.id}
                  className="animate-fade-in-up flex shrink-0 items-center gap-2.5 rounded-xl border border-rose-500/40 bg-gradient-to-r from-rose-950/75 via-slate-950/95 to-slate-950/95 px-3 py-1.5 shadow"
                >
                  <div className="h-8 w-8 shrink-0 overflow-hidden rounded-lg border border-rose-500/50 bg-slate-900 p-0.5">
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
                      <ActionInfoTooltip
                        title="IA Scripteada Activada"
                        badge={`Turno ${snapshot.activeTaunt.turn}`}
                        description={snapshot.activeTaunt.ruleDescription}
                        placement="top"
                      >
                        <span className="inline-flex items-center gap-1 rounded border border-violet-400/35 bg-violet-500/20 px-1.5 py-0.2 text-[9px] font-semibold text-violet-200 cursor-help">
                          <Cpu className="h-2.5 w-2.5" />
                          Turno {snapshot.activeTaunt.turn} Scripteado
                        </span>
                      </ActionInfoTooltip>
                    </div>
                    <p className="truncate text-[11px] italic text-slate-100">
                      {snapshot.activeTaunt.text}
                    </p>
                  </div>
                </div>
              )}

              {/* 2b. COMPACT ON-DEMAND CHESS.COM-STYLE LIVE COACH STRIP */}
              {coachAdvice && (
                <div className="animate-fade-in-up flex shrink-0 items-start justify-between gap-3 rounded-xl border border-sky-400/45 bg-gradient-to-r from-sky-950/90 via-slate-950/95 to-slate-950/95 px-3 py-2 text-[11px] shadow-lg">
                  <div className="min-w-0 flex-1 space-y-0.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center gap-1 font-extrabold text-sky-300">
                        <Brain className="h-3.5 w-3.5" />
                        Coach Táctico
                      </span>
                      <span className="rounded bg-sky-500/20 px-1.5 py-0.2 text-[9px] font-bold text-sky-200">
                        {coachAdvice.modelLabel}
                      </span>
                      <span className="font-mono-code rounded bg-emerald-500/15 px-1.5 py-0.2 text-[9px] font-bold text-emerald-300">
                        Win% ~{coachAdvice.winChanceEstimate}%
                      </span>
                    </div>
                    <p className="text-white">
                      <strong className="text-amber-300">Mejor jugada:</strong>{' '}
                      {coachAdvice.bestPlay}{' '}
                      <span className="text-slate-400">
                        · Alternativa: {coachAdvice.safeAlternative}
                      </span>
                    </p>
                    <p className="text-[10px] text-slate-300">
                      <strong className="text-rose-300">Amenaza:</strong>{' '}
                      {coachAdvice.keyThreat} — {coachAdvice.reasoning}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setCoachAdvice(null)}
                    className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white cursor-pointer"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}

              {/* 3. ALWAYS-VISIBLE PLAYER ACTION DECK */}
              <div className="shrink-0 rounded-2xl border border-slate-800 bg-slate-950/95 p-2.5 shadow-xl">
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
                          {snapshot.p2Control === 'human'
                            ? `¡Victoria de ${
                                snapshot.winner === 'p1'
                                  ? config.playerName
                                  : config.rivalName
                              }!`
                            : snapshot.winner === 'p1'
                              ? '¡Victoria de la Corona!'
                              : 'Derrota en Combate'}
                        </h2>
                        <p className="text-xs text-slate-400">
                          {attemptNumber != null && attemptNumber > 0
                            ? `${
                                snapshot.winner === 'p1'
                                  ? `¡Victoria en ${attemptNumber} ${attemptNumber === 1 ? 'intento' : 'intentos'}! · `
                                  : `Intento #${attemptNumber} · `
                              }`
                            : ''}
                          {snapshot.turn} turno{snapshot.turn === 1 ? '' : 's'} ·{' '}
                          {snapshot.koCountP2}/{snapshot.totalP2} rivales KO
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          onRetryAttempt?.();
                          startBattle();
                        }}
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
                        {snapshot.winner === 'p1' && config.nextStageLabel ? (
                          <>
                            <Sparkles className="h-3.5 w-3.5" />
                            {config.nextStageLabel}
                            <ChevronRight className="h-3.5 w-3.5" />
                          </>
                        ) : (
                          <>
                            <Brain className="h-3.5 w-3.5" />
                            Epílogo & Game Review
                            <ChevronRight className="h-3.5 w-3.5" />
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                ) : snapshot.status !== 'awaiting-choice' || !currentSlot ? (
                  <div className="flex h-24 items-center justify-center text-xs text-slate-400">
                    {snapshot.activeRivalController === 'llm'
                      ? 'Esperando decisión del Entrenador LLM y resolviendo turno...'
                      : 'Resolviendo turno en @pkmn/sim...'}
                  </div>
                ) : isHotseatLocked ? (
                  <div className="flex flex-wrap items-center justify-between gap-3 py-2.5">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-amber-400/40 bg-amber-500/15 text-amber-300">
                        <Lock className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-xs font-extrabold text-amber-300">
                          HOTSEAT LOCAL · TURNO DE {activeTrainerName.toUpperCase()}
                        </p>
                        <p className="text-[11px] text-slate-400">
                          Asegúrate de que {opponentTrainerName} no vea la pantalla antes de revelar tus movimientos.
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setUnlockedHotseatKey(hotseatGateKey)}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 px-5 py-2.5 text-xs font-extrabold text-slate-950 shadow-lg hover:brightness-110 cursor-pointer"
                    >
                      <Users className="h-4 w-4" />
                      Mostrar Mano de {activeTrainerName}
                    </button>
                  </div>
                ) : pendingTargetMove ? (
                  <div>
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <p className="text-xs font-bold text-amber-200">
                        Elige {pendingTargetMove.mode === 'ally' ? 'aliado' : 'objetivo'} para{' '}
                        <span className="text-white">
                          {pendingTargetMove.zmove && pendingTargetMove.zMoveName
                            ? `⚡ ${pendingTargetMove.zMoveName}`
                            : pendingTargetMove.move.name}
                        </span>
                        {pendingTargetMove.tera && (
                          <span className="ml-1.5 rounded bg-cyan-500/20 px-1.5 py-0.5 text-[10px] text-cyan-200">
                            ✦ Tera
                          </span>
                        )}
                        {pendingTargetMove.mega && (
                          <span className="ml-1.5 rounded bg-fuchsia-500/20 px-1.5 py-0.5 text-[10px] text-fuchsia-200">
                            ✦ Mega
                          </span>
                        )}
                        {pendingTargetMove.zmove && (
                          <span className="ml-1.5 rounded bg-amber-400/25 px-1.5 py-0.5 text-[10px] text-amber-200">
                            ⚡ Poder Z
                          </span>
                        )}
                        {snapshot.format === 'triples' &&
                          pendingTargetMove.move.target === 'any' && (
                            <span className="ml-1.5 rounded bg-emerald-500/20 px-1.5 py-0.5 text-[10px] text-emerald-200">
                              ✦ Cruce de Campo
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
                    {pendingTargetMove.mode === 'ally' ? (
                      <div className="grid grid-cols-2 gap-2">
                        {(activeSide === 'p2'
                          ? snapshot.p2.active
                          : snapshot.p1.active
                        ).map((ally, idx) => {
                          if (
                            !ally ||
                            ally.fainted ||
                            (activeSide === 'p1' && isEmptyPlayerSlot(idx)) ||
                            !isAllyTargetReachable(
                              snapshot.format,
                              currentSlot.activeIndex,
                              idx
                            )
                          ) {
                            return null;
                          }
                          return (
                            <button
                              key={`ally-${ally.ident}-${idx}`}
                              onClick={() =>
                                commitSlotCommand(
                                  `move ${pendingTargetMove.move.index} -${idx + 1}${
                                    pendingTargetMove.tera ? ' terastallize' : ''
                                  }${pendingTargetMove.mega ? ' mega' : ''}${
                                    pendingTargetMove.zmove ? ' zmove' : ''
                                  }`,
                                  undefined,
                                  pendingTargetMove.tera,
                                  pendingTargetMove.mega,
                                  pendingTargetMove.zmove
                                )
                              }
                              className="flex w-full items-center justify-between rounded-xl border border-sky-400/45 bg-sky-500/15 px-3 py-2 text-left transition hover:border-sky-300 hover:bg-sky-500/25 cursor-pointer"
                            >
                              <div className="flex items-center gap-2">
                                <PokemonIcon species={ally.species} className="scale-90" />
                                <div>
                                  <p className="text-xs font-bold text-white">{ally.name}</p>
                                  <p className="text-[11px] text-sky-200">
                                    Aliado · {snapshot.format === 'triples' ? triplesLaneLabel(idx) : `Slot ${idx + 1}`}
                                  </p>
                                </div>
                              </div>
                              <ChevronRight className="h-4 w-4 text-sky-300" />
                            </button>
                          );
                        })}
                      </div>
                    ) : (
                      <div
                        className={`grid gap-2 ${
                          snapshot.format === 'triples' ? 'grid-cols-3' : 'grid-cols-2'
                        }`}
                      >
                        {(snapshot.format === 'triples' && activeSide === 'p1'
                          ? [2, 1, 0].filter((i) => i < activeFoes.length)
                          : activeFoes.map((_, i) => i)
                        ).map((foeIdx, visualCol) => {
                          const foe = activeFoes[foeIdx];
                          if (!foe || foe.fainted) {
                            return snapshot.format === 'triples' ? (
                              <div
                                key={`foe-empty-${foeIdx}`}
                                className="flex items-center justify-center rounded-xl border border-dashed border-slate-800 bg-slate-950/40 px-2 py-2 text-[10px] text-slate-600"
                              >
                                {triplesLaneLabel(visualCol)} vacío
                              </div>
                            ) : null;
                          }
                          const reachable = isFoeTargetReachable(
                            snapshot.format,
                            currentSlot.activeIndex,
                            foeIdx,
                            pendingTargetMove.move.target
                          );
                          return (
                            <PokemonTooltip
                              key={foe.ident}
                              mon={foe}
                              side={activeSide === 'p2' ? 'p1' : 'p2'}
                              placement="top"
                            >
                              <button
                                disabled={!reachable}
                                onClick={() =>
                                  commitSlotCommand(
                                    `move ${pendingTargetMove.move.index} +${foeIdx + 1}${
                                      pendingTargetMove.tera ? ' terastallize' : ''
                                    }${pendingTargetMove.mega ? ' mega' : ''}${
                                      pendingTargetMove.zmove ? ' zmove' : ''
                                    }`,
                                    undefined,
                                    pendingTargetMove.tera,
                                    pendingTargetMove.mega,
                                    pendingTargetMove.zmove
                                  )
                                }
                                className={`flex w-full items-center justify-between rounded-xl border px-2.5 py-2 text-left transition ${
                                  reachable
                                    ? 'border-rose-400/40 bg-rose-500/10 hover:border-rose-400 hover:bg-rose-500/20 cursor-pointer'
                                    : 'border-slate-800 bg-slate-950/60 opacity-40 cursor-not-allowed'
                                }`}
                              >
                                <div className="flex min-w-0 items-center gap-1.5">
                                  <PokemonIcon
                                    species={foe.species}
                                    className="scale-90"
                                  />
                                  <div className="min-w-0">
                                    <p className="truncate text-xs font-bold text-white">
                                      {foe.name}
                                    </p>
                                    <p className="truncate text-[10px] text-rose-200">
                                      {reachable
                                        ? `${foe.hpPercent}% · ${
                                            snapshot.format === 'triples'
                                              ? triplesLaneLabel(visualCol)
                                              : `Rival ${foeIdx + 1}`
                                          }`
                                        : 'Fuera de alcance'}
                                    </p>
                                  </div>
                                </div>
                                {reachable && (
                                  <ChevronRight className="h-4 w-4 shrink-0 text-rose-300" />
                                )}
                              </button>
                            </PokemonTooltip>
                          );
                        })}
                      </div>
                    )}
                    {snapshot.format === 'triples' &&
                      currentSlot.activeIndex !== 1 && (
                        <div className="mt-2 flex justify-end">
                          <button
                            type="button"
                            onClick={() => commitSlotCommand('shift')}
                            className="rounded-lg border border-indigo-400/45 bg-indigo-500/15 px-3 py-1 text-[11px] font-bold text-indigo-200 hover:bg-indigo-500/25 cursor-pointer"
                          >
                            ↔ Desplazarse al Centro (Shift)
                          </button>
                        </div>
                      )}
                  </div>
                ) : currentSlot.forceSwitch ? (
                  <div>
                    <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                      <p className="text-xs font-bold text-amber-300">
                        ¡{currentSlot.pokemon.name} se debilitó! Elige reemplazo
                        {snapshot.format === 'doubles'
                          ? ` (Slot ${currentSlot.activeIndex + 1}/${snapshot.pendingSlots.length})`
                          : ''}
                        :
                      </p>
                      {canUndoSlot && (
                        <button
                          type="button"
                          onClick={handleUndoDoubleSlot}
                          className="rounded-lg border border-slate-700 px-2 py-0.5 text-[11px] text-slate-300 hover:text-white cursor-pointer"
                        >
                          ← Slot 1
                        </button>
                      )}
                    </div>
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
                            className="inline-flex items-center gap-2 rounded-xl border border-sky-400/40 bg-sky-500/10 px-3 py-1.5 text-left transition hover:border-sky-300 hover:bg-sky-500/20 cursor-pointer"
                          >
                            <PokemonIcon
                              species={mon.species}
                              className="scale-75"
                            />
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

                      {canPassForceSwitch && (
                        <ActionInfoTooltip
                          title="Dejar Slot Vacío (Pass)"
                          description={
                            availableSwitches.length === 0
                              ? 'Ya no quedan más Pokémon disponibles en banca para este espacio.'
                              : 'Deja este espacio vacío para enviar tu último Pokémon al otro slot.'
                          }
                          placement="top"
                        >
                          <button
                            type="button"
                            onClick={() => commitSlotCommand('pass')}
                            className="inline-flex items-center gap-1.5 rounded-xl border border-amber-400/45 bg-amber-500/15 px-3 py-1.5 text-xs font-bold text-amber-200 transition hover:bg-amber-500/25 cursor-pointer"
                          >
                            {availableSwitches.length === 0
                              ? 'Continuar (Sin reemplazo)'
                              : 'Dejar vacío (Pass)'}
                          </button>
                        </ActionInfoTooltip>
                      )}
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="mb-1.5 flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <PokemonIcon
                          species={currentSlot.pokemon.species}
                          className="scale-75"
                        />
                        <span className="text-xs font-bold text-white">
                          {snapshot.p2Control === 'human' && (
                            <span className="mr-1.5 rounded bg-amber-500/20 px-1.5 py-0.5 text-[10px] font-extrabold text-amber-300">
                              {activeTrainerName}
                            </span>
                          )}
                          ¿Qué hará{' '}
                          <span className="text-amber-300">
                            {currentSlot.pokemon.name}
                          </span>
                          ?
                        </span>
                        <span className="font-mono-code rounded border border-slate-700 bg-slate-900 px-1.5 py-0.5 text-[10px] text-slate-300">
                          PS {currentSlot.pokemon.hp}/{currentSlot.pokemon.maxhp}
                        </span>
                        {(snapshot.format === 'doubles' ||
                          snapshot.format === 'triples') && (
                          <span className="rounded border border-amber-400/30 bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-amber-200">
                            {snapshot.format === 'triples'
                              ? triplesLaneLabel(currentSlot.activeIndex)
                              : `Slot ${currentSlot.activeIndex + 1}/${activePendingSlots.length}`}
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        {currentSlot.pokemon.isShadow && (
                          <ActionInfoTooltip
                            title="Candado de Corazón Cerrado"
                            badge="Pokémon Oscuro"
                            description="Mientras su corazón esté cerrado (Oscuro), este Pokémon NO puede Megaevolucionar, Teracristalizar, usar Movimientos Z ni activar Poder de la Amistad. Purifícalo en la Cámara XD para liberar estas mecánicas."
                            placement="top"
                          >
                            <span className="inline-flex items-center gap-1 rounded-lg border border-fuchsia-400/50 bg-fuchsia-950/75 px-2 py-1 text-[10.5px] font-extrabold text-fuchsia-200 cursor-help">
                              <Lock className="h-3 w-3 text-fuchsia-300" />
                              <span>Corazón Cerrado</span>
                            </span>
                          </ActionInfoTooltip>
                        )}
                        {currentSlot.shadowCallMoveIndex != null && (
                          <ActionInfoTooltip
                            title="📢 Llamar (Colosseum / XD)"
                            badge="Prioridad +6"
                            description="Consume este turno para llamar a tu Pokémon Oscuro: lo saca 100% del Modo Hiper, lo despierta del Sueño, cura Confusión y abre su Medidor de Corazón al terminar el combate (multiplicado por su Naturaleza)."
                            placement="top"
                          >
                            <button
                              type="button"
                              onClick={() =>
                                commitSlotCommand(
                                  `move ${currentSlot.shadowCallMoveIndex}`
                                )
                              }
                              className={`inline-flex items-center gap-1 rounded-lg border px-2.5 py-1 text-[11px] font-extrabold transition cursor-pointer ${
                                currentSlot.pokemon.hyperMode ||
                                currentSlot.pokemon.status === 'slp' ||
                                currentSlot.pokemon.volatiles.includes('confusion')
                                  ? 'animate-pulse border-fuchsia-300 bg-gradient-to-r from-fuchsia-600 to-amber-500 text-slate-950 shadow-lg shadow-fuchsia-500/40 hover:brightness-110'
                                  : 'border-fuchsia-400/60 bg-fuchsia-500/20 text-fuchsia-100 hover:bg-fuchsia-500/35'
                              }`}
                            >
                              <span>📢</span>
                              <span>
                                {currentSlot.pokemon.hyperMode
                                  ? 'Llamar (Calmar Hiper!)'
                                  : 'Llamar'}
                              </span>
                            </button>
                          </ActionInfoTooltip>
                        )}
                        {canMegaNow && (
                          <ActionInfoTooltip
                            title="Megaevolución"
                            badge="1× por combate"
                            description="Transforma a tu Pokémon en su Mega Forma este turno al ejecutar su movimiento."
                            placement="top"
                          >
                            <button
                              type="button"
                              onClick={() => {
                                setWantMega((v) => {
                                  const next = !v;
                                  if (next) {
                                    setWantZMove(false);
                                    setWantTera(false);
                                  }
                                  return next;
                                });
                              }}
                              className={`inline-flex items-center gap-1 rounded-lg border px-2.5 py-1 text-[11px] font-bold transition cursor-pointer ${
                                wantMega
                                  ? 'border-fuchsia-300 bg-fuchsia-500/25 text-fuchsia-100 ring-1 ring-fuchsia-300/60'
                                  : 'border-slate-700 bg-slate-900 text-slate-300 hover:border-fuchsia-400/60 hover:text-fuchsia-200'
                              }`}
                            >
                              <Sparkles className="h-3 w-3 text-fuchsia-300" />
                              <span>Mega</span>
                            </button>
                          </ActionInfoTooltip>
                        )}
                        {canZMoveNow && (
                          <ActionInfoTooltip
                            title="Movimiento Z (Cristal Z)"
                            badge="1× por combate"
                            description="Potencia un movimiento compatible con tu Cristal Z en un devastador Movimiento Z de un solo uso (convive con Megas y Tera en NatDex)."
                            placement="top"
                          >
                            <button
                              type="button"
                              onClick={() => {
                                setWantZMove((v) => {
                                  const next = !v;
                                  if (next) {
                                    setWantMega(false);
                                    setWantTera(false);
                                  }
                                  return next;
                                });
                              }}
                              className={`inline-flex items-center gap-1 rounded-lg border px-2.5 py-1 text-[11px] font-extrabold transition cursor-pointer ${
                                wantZMove
                                  ? 'border-amber-300 bg-amber-400/30 text-amber-100 ring-1 ring-amber-300/70'
                                  : 'border-amber-500/45 bg-amber-500/10 text-amber-200 hover:border-amber-300 hover:bg-amber-500/20'
                              }`}
                            >
                              <span>⚡</span>
                              <span>Poder Z</span>
                            </button>
                          </ActionInfoTooltip>
                        )}
                        {snapshot.format === 'triples' &&
                          currentSlot.activeIndex !== 1 && (
                            <ActionInfoTooltip
                              title="Desplazar al Centro (Shift)"
                              description="En Batalla Triple, un Pokémon de esquina puede cambiar de posición con el Centro para alcanzar todo el tablero."
                              placement="top"
                            >
                              <button
                                type="button"
                                onClick={() => commitSlotCommand('shift')}
                                className="rounded-lg border border-indigo-400/40 bg-indigo-500/15 px-2 py-1 text-[11px] font-bold text-indigo-200 hover:bg-indigo-500/25 cursor-pointer"
                              >
                                ↔ Shift
                              </button>
                            </ActionInfoTooltip>
                          )}
                        {snapshot.p2Control !== 'human' && (
                          <ActionInfoTooltip
                            title="¿Qué haría el Coach?"
                            badge="Bajo demanda"
                            description="Envía solo la foto compacta de este turno (~350 tokens en LLM o 0 en modo offline) para recibir una recomendación táctica estilo Chess.com."
                            placement="top"
                          >
                            <button
                              type="button"
                              disabled={coachLoading}
                              onClick={() => void handleAskCoach()}
                              className="inline-flex items-center gap-1 rounded-lg border border-sky-400/45 bg-sky-500/15 px-2.5 py-1 text-[11px] font-bold text-sky-200 transition hover:bg-sky-500/25 disabled:opacity-50 cursor-pointer"
                            >
                              {coachLoading ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                <Brain className="h-3 w-3" />
                              )}
                              <span className="sm:hidden">Coach</span>
                              <span className="hidden sm:inline">Coach Táctico</span>
                            </button>
                          </ActionInfoTooltip>
                        )}
                        {canTeraNow &&
                          typeof currentSlot.canTerastallize === 'string' && (
                            <ActionInfoTooltip
                              title={`Teracristalizar (${currentSlot.canTerastallize})`}
                              badge="1× por combate"
                              description={`Cambia tu tipo defensivo a ${currentSlot.canTerastallize} y potencia tus ataques de ese tipo (×1.5 nuevo STAB, ×2.0 si coincide con tipo original).`}
                              placement="top"
                            >
                              <button
                                type="button"
                                onClick={() =>
                                  setWantTera((v) => {
                                    const next = !v;
                                    if (next) {
                                      setWantMega(false);
                                      setWantZMove(false);
                                    }
                                    return next;
                                  })
                                }
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
                            </ActionInfoTooltip>
                          )}

                        {canUndoSlot && (
                          <ActionInfoTooltip
                            title="Deshacer Slot 1"
                            description="Cancela la orden elegida para tu primer Pokémon en este turno Doble."
                            placement="top"
                          >
                            <button
                              onClick={handleUndoDoubleSlot}
                              className="rounded-lg border border-slate-700 px-2 py-1 text-[11px] text-slate-300 hover:text-white cursor-pointer"
                            >
                              ← Slot 1
                            </button>
                          </ActionInfoTooltip>
                        )}
                      </div>
                    </div>

                    {/* 4 Moves Row (Generous Touch Height on Mobile/Tablet!) */}
                    <div className="grid grid-cols-2 gap-1.5 lg:grid-cols-4">
                      {currentSlot.moves.map((mv) => {
                        const zOpt = currentSlot.canZMove?.[mv.index - 1] ?? null;
                        const zModeActive = wantZMove && canZMoveNow;
                        const isZEligible = zModeActive && Boolean(zOpt);
                        const isDisabled =
                          mv.disabled || (zModeActive && !zOpt);
                        return (
                          <MoveTooltip key={mv.id} move={mv} placement="top">
                            <button
                              disabled={isDisabled}
                              onClick={() => handleMoveClick(mv)}
                              className={`group flex min-h-[50px] w-full flex-col justify-between rounded-xl border border-l-4 px-2.5 py-2 text-left transition disabled:cursor-not-allowed disabled:opacity-35 active:scale-[0.98] cursor-pointer sm:min-h-[48px] ${
                                isZEligible
                                  ? 'border-amber-300 bg-gradient-to-br from-amber-500/25 via-slate-900 to-fuchsia-950/50 ring-1 ring-amber-300/60 hover:brightness-110'
                                  : `border-slate-700/90 bg-slate-900/95 hover:border-amber-400/70 hover:bg-slate-800/95 ${
                                      MOVE_TYPE_ACCENT[mv.type] ??
                                      'border-l-slate-400'
                                    }`
                              }`}
                            >
                              <span
                                className={`truncate text-xs font-extrabold ${
                                  isZEligible
                                    ? 'text-amber-200'
                                    : 'text-white group-hover:text-amber-200'
                                }`}
                              >
                                {isZEligible && zOpt ? `⚡ ${zOpt.move}` : mv.name}
                              </span>
                              <div className="mt-1 flex items-center justify-between gap-1">
                                <span
                                  className={`rounded border px-1 py-0.2 text-[9px] font-bold uppercase ${getTypeBadgeClass(mv.type)}`}
                                >
                                  {isZEligible ? `Z-${mv.type}` : mv.type}
                                </span>
                                <span className="font-mono-code text-[10px] font-semibold text-slate-400">
                                  {isZEligible ? '1/1 Z' : `${mv.pp}/${mv.maxpp}`}
                                </span>
                              </div>
                            </button>
                          </MoveTooltip>
                        );
                      })}
                    </div>

                    {/* Compact Switch Strip (Horizontally scrollable on mobile so bottom bar never overflows vertically!) */}
                    <div className="no-scrollbar mt-1.5 flex items-center gap-1.5 overflow-x-auto border-t border-slate-800/80 pt-1.5 sm:mt-2 sm:flex-wrap sm:overflow-visible">
                      <span className="mr-0.5 shrink-0 text-[10px] font-bold uppercase tracking-wider text-sky-300/80">
                        Cambiar:
                      </span>
                      {availableSwitches.length === 0 ? (
                        <span className="shrink-0 text-[11px] text-slate-500">
                          {currentSlot.trapped ? 'Atrapado' : 'Sin banca'}
                        </span>
                      ) : (
                        activeParty
                          .filter(
                            (_, idx) =>
                              !(activeSide === 'p1' && isEmptyPlayerSlot(idx))
                          )
                          .map((mon) => {
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
                                className={`inline-flex shrink-0 items-center gap-1 rounded-lg border px-2 py-1 text-[11px] font-semibold transition sm:py-0.5 ${
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
            </>
          )}
        </div>

        {/* Mobile/Tablet (<1024px) Backdrop when Battle Log Drawer is Open */}
        {showMobileLog && (
          <div
            onClick={() => setShowMobileLog(false)}
            className="fixed inset-0 z-30 bg-black/65 backdrop-blur-xs lg:hidden"
          />
        )}

        {/* RIGHT COLUMN: Dedicated Full-Height Battle Log on Desktop (lg:) | Slide-Over Drawer on Mobile/Tablet (<lg) */}
        <aside
          className={`${
            showMobileLog
              ? 'fixed inset-y-0 right-0 z-40 flex w-[86vw] max-w-sm shadow-2xl shadow-black'
              : 'hidden'
          } h-full shrink-0 flex-col border-l border-amber-400/20 bg-[#080d1a] lg:static lg:z-auto lg:flex lg:w-80 lg:shadow-none xl:w-96`}
        >
          <div className="shrink-0 border-b border-slate-800/90 bg-slate-950/90 px-3.5 py-2.5">
            <div className="flex items-center justify-between gap-2">
              <span className="font-display text-xs font-bold uppercase tracking-widest text-amber-300">
                Registro de Combate
              </span>
              <div className="flex items-center gap-1.5">
                <span className="font-mono-code max-w-[10rem] truncate rounded border border-slate-700 bg-slate-900 px-1.5 py-0.5 text-[9px] text-slate-400">
                  {snapshot.formatId}
                </span>
                <button
                  type="button"
                  onClick={() => setShowMobileLog(false)}
                  aria-label="Cerrar Registro de Combate"
                  className="rounded-lg border border-slate-700 bg-slate-900 p-1 text-slate-300 hover:text-white lg:hidden cursor-pointer"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
            <p className="mt-0.5 truncate text-[11px] font-semibold text-slate-200">
              {config.playerName}{' '}
              <span className="text-amber-400">vs.</span> {config.rivalName}
            </p>
            <p className="mt-0.5 flex items-center gap-1 text-[10px] text-slate-400">
              {snapshot.openTeamsheet.enabled ? (
                <>
                  <ClipboardList className="h-3 w-3 text-sky-400" />
                  Open Teamsheet activo · {config.scriptedEnemyRules.length}{' '}
                  reglas IA
                </>
              ) : (
                <>
                  <EyeOff className="h-3 w-3 text-rose-400" />
                  Fog of War · {config.scriptedEnemyRules.length} reglas IA
                </>
              )}
            </p>
          </div>

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

      {/* Open Teamsheet Modal (VGC Worlds / 1v1) */}
      <OpenTeamsheetModal
        open={showTeamsheetModal}
        onClose={() => setShowTeamsheetModal(false)}
        formatLabel={snapshot.formatLabel}
        playerName={config.playerName}
        rivalName={config.rivalName}
        playerSheet={snapshot.openTeamsheet.player}
        rivalSheet={snapshot.openTeamsheet.rival}
      />

      {/* Showdown Paste Modal */}
      {showPasteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-3 backdrop-blur-sm sm:p-4">
          <div className="max-h-[90dvh] w-full max-w-3xl overflow-y-auto rounded-3xl border border-amber-400/30 bg-slate-950 p-4 shadow-2xl sm:p-6">
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
                  {!snapshot.openTeamsheet.enabled && (
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
                  )}
                </div>
                {snapshot.openTeamsheet.enabled || revealRivalPasteInModal ? (
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
