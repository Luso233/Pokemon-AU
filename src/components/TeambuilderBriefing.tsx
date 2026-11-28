import React, { useEffect, useMemo, useState } from 'react';
import { Dex, Teams } from '@pkmn/sim';
import {
  AlertTriangle,
  ArrowLeft,
  Box,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  ClipboardList,
  ClipboardPaste,
  CloudSun,
  Code2,
  Coins,
  Dices,
  Eye,
  EyeOff,
  Flame,
  Heart,
  HelpCircle,
  ShieldAlert,
  ShoppingBag,
  Swords,
  Wrench,
  Zap,
} from 'lucide-react';
import { CHAPTERS } from '../data/chapters';
import { getDiabloScoutingAlertsForChapter } from '../data/difficultyOverrides';
import {
  CURRENCY_SHORT,
  DIFFICULTY_META,
  DIFFICULTY_ORDER,
} from '../data/economyCatalog';
import { computeActiveSocialLinkPerks } from '../data/socialLinksCatalog';
import {
  applyNpcRunModifiers,
  getNpcDefinition,
  getVariantsForChapterNpc,
} from '../data/npcProfiles';
import {
  getFormatGeneration,
  getSpeciesKey,
} from '../engine/learnsetService';
import { applyBabyOrDevNatDexFallback } from '../engine/formatFallback';
import { getRivalName } from '../engine/rivalName';
import {
  applyChapterProgressionToPaste,
  applyShinySlotsToPaste,
  compileCustomTeamToShowdownPaste,
} from '../engine/playerProfile';
import { getImperialBstLicense } from '../engine/pricingEngine';
import type {
  BattleDifficultyMode,
  ChapterTeamMode,
  ChapterTeamPolicy,
  OpenTeamsheetEntry,
  OwnedPokemonInstance,
  PlayerSaveProfile,
  PokemonStorageZone,
  ResolvedBattleConfig,
  SavedCampaignTeam,
} from '../types/game';
import { CharacterPortrait } from './CharacterPortrait';
import { HelpTip } from './HelpTip';
import { OpenTeamsheetModal } from './OpenTeamsheetModal';
import { PcBoxManager } from './PcBoxManager';
import { PokemonEditor } from './PokemonEditor';
import { PokemonIcon } from './PokemonSprite';
import { RivalPortraitTooltip } from './RivalPortraitTooltip';

interface TeambuilderBriefingProps {
  config: ResolvedBattleConfig;
  profile: PlayerSaveProfile;
  teamEditPolicy?: ChapterTeamPolicy;
  teamMode?: ChapterTeamMode;
  onReplayVN: () => void;
  onOpenShop: () => void;
  onOpenDevMode: () => void;
  onOpenCamp?: () => void;
  onToggleUseCustomTeam?: (enabled: boolean) => void;
  onUnlockMoveSlot: (
    species: string,
    slotIndex: number
  ) => { ok: boolean; error?: string };
  onSetCustomMove: (
    species: string,
    slotIndex: number,
    moveName: string
  ) => { ok: boolean; error?: string };
  onSetCustomItem: (species: string, itemName: string) => void;
  onResetSpecies: (species: string) => void;
  onMoveInstanceZone: (
    uid: string,
    targetZone: Exclude<PokemonStorageZone, 'graveyard'>
  ) => { ok: boolean; error?: string };
  onReleaseInstance: (
    uid: string
  ) => { ok: boolean; error?: string; releasedSpecies?: string };
  onEquipInstanceItem: (
    uid: string,
    itemName: string
  ) => { ok: boolean; error?: string; transferredFrom?: string };
  onUpdateInstanceBuild: (
    uid: string,
    patch: Partial<
      Pick<
        OwnedPokemonInstance,
        | 'ability'
        | 'nature'
        | 'teraType'
        | 'moves'
        | 'shiny'
        | 'nickname'
        | 'gender'
        | 'evs'
        | 'ivs'
      >
    >
  ) => { ok: boolean; error?: string };
  onSpawnDevSpecimen: (
    species: string,
    targetZone: 'party' | 'box'
  ) => {
    ok: boolean;
    error?: string;
    uid?: string;
    placedZone?: 'party' | 'box';
    swappedOutSpecies?: string;
  };
  onSpawnDevShadowSpecimen?: (
    species?: string,
    targetZone?: 'party' | 'box' | 'purify'
  ) => { ok: boolean; error?: string; uid?: string };
  onPurifyInstance?: (
    uid: string
  ) => { ok: boolean; error?: string; species?: string; signatureGift?: string };
  onAssignShadowToChamber?: (
    chamberIndex: number,
    shadowUid: string | null
  ) => { ok: boolean; error?: string };
  onAssignRingPokemonToChamber?: (
    chamberIndex: number,
    ringSlotIndex: number,
    monUid: string | null
  ) => { ok: boolean; error?: string };
  onAutoOptimizeChamber?: (
    chamberIndex: number
  ) => {
    ok: boolean;
    error?: string;
    tempo?: number;
    isMaxTempo?: boolean;
    isPerfectSet?: boolean;
  };
  onPopulateLivingDexBox: () => { addedCount: number; totalLiving: number };
  onImportShowdownPaste: (
    rawPaste: string
  ) => { ok: boolean; error?: string; importedCount: number };
  onSaveCampaignTeam: (
    name: string
  ) => { ok: boolean; error?: string; team?: SavedCampaignTeam };
  onLoadCampaignTeam: (
    teamId: string,
    allowSpawnMissing?: boolean
  ) => {
    ok: boolean;
    error?: string;
    loadedCount: number;
    missingSpecies: string[];
  };
  onDeleteCampaignTeam: (teamId: string) => void;
  onLaunchBattle: (finalConfig: ResolvedBattleConfig) => void;
}

export const TeambuilderBriefing: React.FC<TeambuilderBriefingProps> = ({
  config,
  profile,
  teamEditPolicy,
  teamMode,
  onReplayVN,
  onOpenShop,
  onOpenDevMode,
  onOpenCamp,
  onToggleUseCustomTeam,
  onUnlockMoveSlot,
  onSetCustomMove,
  onSetCustomItem,
  onResetSpecies,
  onMoveInstanceZone,
  onReleaseInstance,
  onEquipInstanceItem,
  onUpdateInstanceBuild,
  onSpawnDevSpecimen,
  onSpawnDevShadowSpecimen,
  onPurifyInstance,
  onAssignShadowToChamber,
  onAssignRingPokemonToChamber,
  onAutoOptimizeChamber,
  onPopulateLivingDexBox,
  onImportShowdownPaste,
  onSaveCampaignTeam,
  onLoadCampaignTeam,
  onDeleteCampaignTeam,
  onLaunchBattle,
}) => {
  const isGen1 = getFormatGeneration(config.formatId) === 1;
  const chapterMeta = CHAPTERS.find((c) => c.id === config.chapterId);
  const effectiveTeamPolicy: ChapterTeamPolicy =
    teamEditPolicy ?? chapterMeta?.teamEditPolicy ?? 'fixed';
  const effectiveTeamMode: ChapterTeamMode =
    teamMode ??
    chapterMeta?.teamMode ??
    (effectiveTeamPolicy === 'editable' ? 'campaign' : 'locked');

  const [difficultyMode, setDifficultyMode] = useState<BattleDifficultyMode>(
    config.difficultyMode ?? profile.defaultDifficulty ?? 'kaizo'
  );
  const isBabyMode = difficultyMode === 'baby';
  const canQuickPasteOnSpot = isBabyMode || profile.devModeEnabled;

  // Baby Mode & Dev Mode let you test ANY chapter with custom PC / Showdown-imported compositions!
  const canSwapCustomTeam =
    profile.customTeam.length > 0 &&
    !config.emptyPlayerSlots?.length &&
    !config.persistedPartyState &&
    (profile.devModeEnabled ||
      isBabyMode ||
      (effectiveTeamMode === 'campaign' &&
        config.formatId !== 'gen1customgame' &&
        config.formatId !== 'gen6triplescustomgame' &&
        config.formatId !== 'gen91v1' &&
        config.formatId !== 'gen9monotype' &&
        config.formatId !== 'gen9vgc2024regg'));

  const [useCustomTeam, setUseCustomTeam] = useState(
    Boolean(canSwapCustomTeam && profile.useCustomTeamInStory)
  );
  const [showQuickPasteBox, setShowQuickPasteBox] = useState(false);
  const [quickPasteDraft, setQuickPasteDraft] = useState('');

  // Keep embedded PC Box view synced whenever Dev Lab spawn / Showdown import enables custom team!
  useEffect(() => {
    if (canSwapCustomTeam && profile.useCustomTeamInStory) {
      setUseCustomTeam(true);
    }
  }, [canSwapCustomTeam, profile.useCustomTeamInStory]);
  const [selectedSlot, setSelectedSlot] = useState(0);
  const [shinySlots, setShinySlots] = useState<number[]>(() => {
    if (canSwapCustomTeam && profile.useCustomTeamInStory) {
      return profile.customTeam
        .map((m, i) => (m.shiny ? i : -1))
        .filter((i) => i >= 0);
    }
    return [];
  });
  const [notice, setNotice] = useState<{
    tone: 'ok' | 'err';
    text: string;
  } | null>(null);
  const [showRawPaste, setShowRawPaste] = useState(false);
  const [manualPasteOverride, setManualPasteOverride] = useState<string | null>(
    null
  );
  const [showRivalDebugPaste, setShowRivalDebugPaste] = useState(false);
  const [rivalPaste, setRivalPaste] = useState(config.rivalShowdownPaste);
  const [showTeamsheet, setShowTeamsheet] = useState(false);
  const [selectedVariantId, setSelectedVariantId] = useState<string>(
    config.selectedVariantId ?? 'canonical'
  );
  // Responsive <1024px tab switcher ("Equipo / Cajas" vs "Rival / Dificultad")
  const [mobileBriefingTab, setMobileBriefingTab] = useState<'team' | 'rival'>('team');

  const socialPerks = useMemo(
    () => computeActiveSocialLinkPerks(profile),
    [profile]
  );

  // LIVE Dynamic BST Cap recalculated instantaneously whenever you click Baby Mode / Normal / Difícil / Tryhard!
  const bstLicense = useMemo(
    () => getImperialBstLicense(profile, difficultyMode),
    [profile, difficultyMode]
  );
  const isCustomTeamBlockedByBstCap = Boolean(
    useCustomTeam && canSwapCustomTeam && bstLicense.isOverCap
  );

  const scoutingAlerts = useMemo(
    () =>
      socialPerks.hasAntiDiabloScouting
        ? getDiabloScoutingAlertsForChapter(config.chapterId, difficultyMode)
        : [],
    [socialPerks.hasAntiDiabloScouting, config.chapterId, difficultyMode]
  );

  const npcDef = useMemo(
    () => getNpcDefinition(config.rivalCharId),
    [config.rivalCharId]
  );
  const npcVariants = useMemo(
    () => getVariantsForChapterNpc(config.rivalCharId, config.chapterId),
    [config.rivalCharId, config.chapterId]
  );

  const ownedShinyCharms = profile.inventory.shinyCharms;

  const canonicalSets = useMemo(() => {
    try {
      return Teams.import(config.playerShowdownPaste) ?? [];
    } catch {
      return [];
    }
  }, [config.playerShowdownPaste]);

  const chapterDefaultItems = useMemo(() => {
    return Array.from(
      new Set(
        canonicalSets
          .map((s) => s.item)
          .filter((item): item is string => Boolean(item))
      )
    );
  }, [canonicalSets]);

  const effectivePlayerPaste = useMemo(() => {
    if (manualPasteOverride !== null) return manualPasteOverride;
    if (useCustomTeam && canSwapCustomTeam) {
      const customPaste = compileCustomTeamToShowdownPaste(
        profile.customTeam,
        config.rivalIntel?.levelCap ?? 100
      );
      const customShinies = profile.customTeam
        .map((m, idx) => (m.shiny ? idx : -1))
        .filter((idx) => idx >= 0);
      return customShinies.length > 0
        ? applyShinySlotsToPaste(customPaste, customShinies, ownedShinyCharms)
        : customPaste;
    }
    return applyChapterProgressionToPaste(
      config.playerShowdownPaste,
      profile,
      config.formatId,
      shinySlots
    );
  }, [
    manualPasteOverride,
    useCustomTeam,
    canSwapCustomTeam,
    profile,
    config.playerShowdownPaste,
    config.formatId,
    config.rivalIntel?.levelCap,
    shinySlots,
    ownedShinyCharms,
  ]);

  const parsedPlayer = useMemo(() => {
    try {
      return Teams.import(effectivePlayerPaste) ?? [];
    } catch {
      return [];
    }
  }, [effectivePlayerPaste]);

  const parsedRival = useMemo(() => {
    try {
      return Teams.import(rivalPaste) ?? [];
    } catch {
      return [];
    }
  }, [rivalPaste]);

  const clampedSlot = Math.min(
    selectedSlot,
    Math.max(0, parsedPlayer.length - 1)
  );
  const activeSet = parsedPlayer[clampedSlot];
  const canonicalActiveSet = canonicalSets[clampedSlot];

  const buildSheet = (
    sets: ReturnType<typeof Teams.import>
  ): OpenTeamsheetEntry[] =>
    (sets ?? []).map((s) => {
      const sp = Dex.species.get(s.species);
      return {
        species: sp.exists ? sp.name : s.species,
        level: s.level || (config.formatId === 'gen9vgc2024regg' ? 50 : 100),
        item: s.item || 'Ninguno',
        ability: s.ability || sp.abilities?.[0] || '—',
        teraType: s.teraType || sp.types?.[0] || 'Normal',
        moves: s.moves || [],
        types: sp.types ? [...sp.types] : ['Normal'],
      };
    });

  const isValid =
    parsedPlayer.length > 0 &&
    parsedRival.length > 0 &&
    !isCustomTeamBlockedByBstCap;
  const intel = config.rivalIntel;
  const visibleCount = config.openTeamsheet
    ? parsedRival.length
    : Math.min(intel.visibleSpeciesCount, parsedRival.length);
  const hiddenCount = Math.max(0, parsedRival.length - visibleCount);

  const handleToggleSlotShiny = (idx: number) => {
    if (ownedShinyCharms <= 0) return;
    setManualPasteOverride(null);
    setShinySlots((prev) => {
      if (prev.includes(idx)) {
        return prev.filter((i) => i !== idx);
      }
      if (prev.length >= ownedShinyCharms) {
        setNotice({
          tone: 'err',
          text: `Solo tienes ${ownedShinyCharms} Shiny Charm(s). Desactiva otro slot o compra más en la Tienda.`,
        });
        return prev;
      }
      return [...prev, idx];
    });
  };

  const launchWithPaste = (playerPasteToUse: string) => {
    const baseWithPlayer: ResolvedBattleConfig = {
      ...config,
      playerShowdownPaste: playerPasteToUse,
      rivalShowdownPaste:
        showRivalDebugPaste && rivalPaste !== config.rivalShowdownPaste
          ? rivalPaste
          : config.rivalShowdownPaste,
    };
    // ONLY in Baby Mode or Dev Mode: if the player's paste fails strict format validation
    // (e.g. Eternatus-Eternamax or Mega-Rayquaza on Monotype / VGC / 1v1 / Gen 1 / Triples),
    // automatically fall back to our master NatDex Custom format!
    const formatSafeConfig = applyBabyOrDevNatDexFallback(
      baseWithPlayer,
      playerPasteToUse,
      {
        difficultyMode,
        devModeEnabled: profile.devModeEnabled,
      }
    );
    const finalWithNpc = applyNpcRunModifiers(
      formatSafeConfig,
      difficultyMode,
      selectedVariantId
    );
    onLaunchBattle(finalWithNpc);
  };

  const handleStart = () => {
    if (!isValid) return;
    launchWithPaste(effectivePlayerPaste);
  };

  const applyShowdownPasteOnSpot = (rawText: string, launchNow: boolean) => {
    const trimmed = rawText.trim();
    if (!trimmed) {
      setNotice({
        tone: 'err',
        text: 'Pega un equipo válido en formato de texto de Pokémon Showdown.',
      });
      return;
    }
    let parsed: ReturnType<typeof Teams.import> = null;
    try {
      parsed = Teams.import(trimmed);
    } catch {
      parsed = null;
    }
    const validSets = (parsed ?? []).filter((s) => Dex.species.get(s.species).exists);
    if (validSets.length === 0) {
      setNotice({
        tone: 'err',
        text: 'No se reconoció ningún Pokémon válido en ese Paste de Showdown.',
      });
      return;
    }
    const cleanPaste = Teams.export(validSets.slice(0, 6)).trim();
    if (launchNow) {
      onImportShowdownPaste(cleanPaste);
      launchWithPaste(cleanPaste);
      return;
    }
    const imp = onImportShowdownPaste(cleanPaste);
    if (imp.ok) {
      setManualPasteOverride(null);
      setUseCustomTeam(true);
      onToggleUseCustomTeam?.(true);
      setQuickPasteDraft('');
      setShowQuickPasteBox(false);
      setNotice({
        tone: 'ok',
        text: `⚡ ¡${imp.importedCount} Pokémon importados desde Showdown listos para este capítulo!`,
      });
    } else {
      setManualPasteOverride(cleanPaste);
      setNotice({
        tone: 'ok',
        text: `⚡ Equipo Showdown cargado on-the-spot (${validSets.length} Pokémon).`,
      });
    }
  };

  const handleClipboardAction = async (launchNow: boolean) => {
    try {
      if (!navigator.clipboard || !navigator.clipboard.readText) {
        setShowQuickPasteBox(true);
        setNotice({
          tone: 'err',
          text: 'Tu navegador no permite leer el portapapeles directo. Usa Ctrl+V en el cuadro rápido de abajo.',
        });
        return;
      }
      const clipText = await navigator.clipboard.readText();
      if (!clipText.trim()) {
        setShowQuickPasteBox(true);
        setNotice({
          tone: 'err',
          text: 'El portapapeles está vacío. Copia primero un equipo en formato Pokémon Showdown.',
        });
        return;
      }
      applyShowdownPasteOnSpot(clipText, launchNow);
    } catch {
      setShowQuickPasteBox(true);
      setNotice({
        tone: 'err',
        text: 'Permiso de portapapeles bloqueado. Pega el equipo con Ctrl+V en el cuadro rápido de abajo.',
      });
    }
  };

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#060a14] text-slate-100">
      <div className="mx-auto max-w-7xl px-3 py-4 sm:px-5 sm:py-6">
        {/* Compact Responsive Header */}
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2.5 border-b border-slate-800 pb-3.5">
          <div className="flex min-w-0 items-center gap-2.5">
            <button
              onClick={onReplayVN}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs font-semibold text-slate-300 transition hover:border-amber-400/50 hover:text-white cursor-pointer"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Escena</span>
            </button>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-1.5">
                <h1 className="truncate font-display text-lg font-bold text-white sm:text-2xl">
                  Teambuilder
                </h1>
                <span className="rounded-md border border-amber-400/40 bg-amber-500/15 px-1.5 py-0.5 text-[10px] font-bold text-amber-200">
                  {config.formatLabel ?? config.formatId}
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            <button
              onClick={onOpenShop}
              className="inline-flex items-center gap-1 rounded-xl border border-amber-400/45 bg-amber-500/15 px-2.5 py-1.5 text-xs font-extrabold text-amber-200 hover:bg-amber-500/25 cursor-pointer"
            >
              <Coins className="h-3.5 w-3.5 text-amber-400" />
              <span className="font-mono-code">
                {profile.coins.toLocaleString()} {CURRENCY_SHORT}
              </span>
            </button>

            {onOpenCamp && (
              <button
                onClick={onOpenCamp}
                className="inline-flex items-center gap-1 rounded-xl border border-fuchsia-400/45 bg-fuchsia-500/15 px-2.5 py-1.5 text-xs font-bold text-fuchsia-200 hover:bg-fuchsia-500/25 cursor-pointer"
              >
                <Heart className="h-3.5 w-3.5 text-fuchsia-300" />
                <span>Vínculos</span>
              </button>
            )}

            <button
              onClick={onOpenDevMode}
              className={`inline-flex items-center gap-1 rounded-xl border px-2.5 py-1.5 text-xs font-bold transition cursor-pointer ${
                profile.devModeEnabled
                  ? 'border-fuchsia-400/60 bg-fuchsia-500/20 text-fuchsia-200'
                  : 'border-slate-700 bg-slate-900 text-slate-300 hover:border-fuchsia-400/40'
              }`}
            >
              <Wrench className="h-3.5 w-3.5" />
              <span>Dev</span>
            </button>

            {config.openTeamsheet && (
              <button
                onClick={() => setShowTeamsheet(true)}
                className="inline-flex items-center gap-1 rounded-xl border border-sky-400/50 bg-sky-500/20 px-2.5 py-1.5 text-xs font-bold text-sky-100 transition hover:bg-sky-500/30 cursor-pointer"
              >
                <ClipboardList className="h-3.5 w-3.5" />
                <span>Teamsheet</span>
              </button>
            )}
          </div>
        </div>

        {notice && (
          <div
            className={`mb-4 rounded-2xl border px-3.5 py-2 text-xs font-semibold ${
              notice.tone === 'ok'
                ? 'border-emerald-400/40 bg-emerald-500/15 text-emerald-100'
                : 'border-rose-400/40 bg-rose-500/15 text-rose-100'
            }`}
          >
            {notice.text}
          </div>
        )}

        {/* Mobile/Tablet (<1024px) Single-Column Tab Switcher */}
        <div className="mb-4 grid grid-cols-2 gap-1.5 rounded-2xl border border-slate-800 bg-slate-900/90 p-1 lg:hidden">
          <button
            type="button"
            onClick={() => setMobileBriefingTab('team')}
            className={`rounded-xl px-3 py-2 text-xs font-extrabold transition cursor-pointer ${
              mobileBriefingTab === 'team'
                ? 'bg-amber-500/25 text-amber-100 ring-1 ring-amber-400/50'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            ⚔️ Equipo / Cajas ({parsedPlayer.length})
          </button>
          <button
            type="button"
            onClick={() => setMobileBriefingTab('rival')}
            className={`rounded-xl px-3 py-2 text-xs font-extrabold transition cursor-pointer ${
              mobileBriefingTab === 'rival'
                ? 'bg-rose-500/25 text-rose-100 ring-1 ring-rose-400/50'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            👁️ Rival · {DIFFICULTY_META[difficultyMode]?.shortLabel}
          </button>
        </div>

        {/* Main 12-Col Layout: Narrative Editor OR Embedded <PcBoxManager /> (Left 8) + Sticky Rival Sighting & Difficulty (Right 4) */}
        <section className="mb-5 grid gap-5 lg:grid-cols-12 lg:items-start">
          {/* LEFT 8 COLS */}
          <div className={`${mobileBriefingTab === 'rival' ? 'hidden lg:block' : ''} space-y-4 lg:col-span-8`}>
            <div className="rounded-3xl border border-amber-400/25 bg-slate-900/80 p-3.5 sm:p-5">
              {/* Top Mode Switcher Bar */}
              <div className="mb-3.5 flex flex-wrap items-center justify-between gap-2">
                <div className="flex min-w-0 items-center gap-2.5">
                  <div
                    className={`h-10 w-10 shrink-0 overflow-hidden rounded-xl border bg-slate-950 p-0.5 ${
                      isBabyMode ? 'border-sky-300/75 shadow shadow-sky-500/25' : 'border-amber-400/45'
                    }`}
                  >
                    <CharacterPortrait
                      charId={
                        isBabyMode && config.playerCharId === 'prince'
                          ? 'prince_baby'
                          : config.playerCharId
                      }
                      variant="bust"
                      className="h-full w-full object-cover object-top"
                    />
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <h2 className="truncate font-display text-base font-bold text-white sm:text-lg">
                        {config.playerName}
                      </h2>
                      <span
                        className={`rounded-md border px-1.5 py-0.5 text-[9.5px] font-extrabold ${
                          effectiveTeamMode === 'campaign'
                            ? 'border-sky-400/40 bg-sky-500/15 text-sky-200'
                            : effectiveTeamMode === 'challenge'
                              ? 'border-violet-400/40 bg-violet-500/15 text-violet-200'
                              : 'border-amber-400/40 bg-amber-500/15 text-amber-200'
                        }`}
                      >
                        {effectiveTeamMode === 'campaign'
                          ? '⚔️ Campaña · NatDex'
                          : effectiveTeamMode === 'challenge'
                            ? '🏆 Reto · Aislado'
                            : '🔒 Fijo · Aislado'}
                      </span>
                      <HelpTip title="Modo de Equipo del Capítulo" size="xs">
                        {effectiveTeamMode === 'campaign' ? (
                          <p>
                            <strong>Campaña NatDex (Megas + Z + Tera):</strong> usa tus Cajas PC embebidas con el límite BST de la dificultad elegida. Aplica reglas activas de Ironman / Nuzlocke.
                          </p>
                        ) : effectiveTeamMode === 'challenge' ? (
                          <p>
                            <strong>Reto Especial ({config.formatLabel ?? config.formatId}):</strong> usa un escuadrón aislado propio de este formato competitivo — no desgasta ni elimina Pokémon de tus Cajas PC.
                          </p>
                        ) : (
                          <p>
                            <strong>Guion / Puzzle (Fijo):</strong> escuadrón narrativo cerrado y aislado de tus Cajas PC (sin permadeath ni daño persistente).
                          </p>
                        )}
                      </HelpTip>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-1.5">
                  {canSwapCustomTeam && (
                    <button
                      type="button"
                      onClick={() => {
                        setManualPasteOverride(null);
                        const next = !useCustomTeam;
                        setUseCustomTeam(next);
                        onToggleUseCustomTeam?.(next);
                      }}
                      className={`inline-flex items-center gap-1.5 rounded-xl border px-2.5 py-1.5 text-xs font-extrabold transition cursor-pointer ${
                        useCustomTeam
                          ? 'border-sky-400 bg-sky-500/25 text-sky-100'
                          : 'border-amber-400/45 bg-amber-500/15 text-amber-200 hover:bg-amber-500/25'
                      }`}
                    >
                      <Box className="h-3.5 w-3.5" />
                      {useCustomTeam
                        ? '← Equipo Narrativo'
                        : `Cajas PC${
                            effectiveTeamMode !== 'campaign' && profile.devModeEnabled
                              ? ' · DEV'
                              : ''
                          }`}
                    </button>
                  )}
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-xs font-semibold text-emerald-300">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    {parsedPlayer.length}
                  </span>
                </div>
              </div>

              {/* BABY MODE / DEV MODE: Compact Instant Showdown Paste Bar */}
              {canQuickPasteOnSpot && (
                <div className="mb-3.5 rounded-2xl border border-sky-400/45 bg-gradient-to-r from-sky-950/60 via-slate-950/90 to-fuchsia-950/40 p-2.5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-extrabold text-sky-200">
                        {isBabyMode ? '👶 Baby Paste' : '🧪 Dev Paste'}
                      </span>
                      <HelpTip title="Paste Showdown On-The-Spot" badge="Auto-NatDex" size="xs">
                        <p>
                          Pega cualquier equipo en formato Pokémon Showdown directo desde tu portapapeles y entra al combate al instante. Si rompe un formato estricto (Monotype, VGC, 1v1, Gen 1/6), cambia automáticamente a <strong>NatDex Todo Vale</strong>.
                        </p>
                      </HelpTip>
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => void handleClipboardAction(false)}
                        className="inline-flex items-center gap-1 rounded-xl border border-sky-400/55 bg-sky-500/20 px-2.5 py-1.5 text-[11px] font-extrabold text-sky-100 hover:bg-sky-500/35 cursor-pointer"
                      >
                        <ClipboardPaste className="h-3.5 w-3.5" />
                        Pegar
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleClipboardAction(true)}
                        className="inline-flex items-center gap-1 rounded-xl bg-gradient-to-r from-sky-400 to-amber-400 px-2.5 py-1.5 text-[11px] font-extrabold text-slate-950 shadow-md shadow-sky-500/20 hover:brightness-110 cursor-pointer"
                      >
                        <Zap className="h-3.5 w-3.5 fill-current" />
                        Pegar y Jugar
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowQuickPasteBox((v) => !v)}
                        className="rounded-xl border border-slate-700 bg-slate-900 px-2 py-1.5 text-[10.5px] font-bold text-slate-300 hover:text-white cursor-pointer"
                      >
                        {showQuickPasteBox ? '✕' : 'Manual'}
                      </button>
                    </div>
                  </div>

                  {showQuickPasteBox && (
                    <div className="mt-2.5 space-y-2 border-t border-sky-400/20 pt-2.5">
                      <textarea
                        value={quickPasteDraft}
                        onChange={(e) => setQuickPasteDraft(e.target.value)}
                        rows={5}
                        placeholder="Pega aquí tu equipo de Pokémon Showdown (Ctrl+V)..."
                        className="font-mono-code w-full rounded-xl border border-sky-400/40 bg-black/75 p-2.5 text-[11px] text-slate-100 placeholder-slate-500 focus:border-sky-300 focus:outline-none"
                      />
                      <div className="flex flex-wrap justify-end gap-2">
                        <button
                          type="button"
                          disabled={!quickPasteDraft.trim()}
                          onClick={() =>
                            applyShowdownPasteOnSpot(quickPasteDraft, false)
                          }
                          className="rounded-xl border border-sky-400/50 bg-sky-500/20 px-3 py-1.5 text-[11px] font-extrabold text-sky-100 hover:bg-sky-500/30 disabled:opacity-40 cursor-pointer"
                        >
                          Cargar en este Capítulo
                        </button>
                        <button
                          type="button"
                          disabled={!quickPasteDraft.trim()}
                          onClick={() =>
                            applyShowdownPasteOnSpot(quickPasteDraft, true)
                          }
                          className="inline-flex items-center gap-1 rounded-xl bg-amber-400 px-3 py-1.5 text-[11px] font-extrabold text-slate-950 hover:brightness-110 disabled:opacity-40 cursor-pointer"
                        >
                          <Zap className="h-3.5 w-3.5 fill-current" />
                          Usar y Jugar Ya!
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* EMBEDDED <PcBoxManager /> when Using Custom PC Team! */}
              {useCustomTeam && canSwapCustomTeam ? (
                <PcBoxManager
                  profile={profile}
                  difficultyMode={difficultyMode}
                  embedded
                  formatId={config.formatId}
                  onMoveInstanceZone={onMoveInstanceZone}
                  onReleaseInstance={onReleaseInstance}
                  onEquipInstanceItem={onEquipInstanceItem}
                  onUpdateInstanceBuild={onUpdateInstanceBuild}
                  onUnlockMoveSlot={onUnlockMoveSlot}
                  onSpawnDevSpecimen={onSpawnDevSpecimen}
                  onSpawnDevShadowSpecimen={onSpawnDevShadowSpecimen}
                  onPurifyInstance={onPurifyInstance}
                  onAssignShadowToChamber={onAssignShadowToChamber}
                  onAssignRingPokemonToChamber={onAssignRingPokemonToChamber}
                  onAutoOptimizeChamber={onAutoOptimizeChamber}
                  onPopulateLivingDexBox={onPopulateLivingDexBox}
                  onImportShowdownPaste={onImportShowdownPaste}
                  onSaveCampaignTeam={onSaveCampaignTeam}
                  onLoadCampaignTeam={onLoadCampaignTeam}
                  onDeleteCampaignTeam={onDeleteCampaignTeam}
                  onOpenShop={onOpenShop}
                  onNotice={setNotice}
                />
              ) : (
                <>
                  {/* Narrative Squad Slot Selector */}
                  <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {parsedPlayer.map((set, i) => {
                      const isSelected = i === clampedSlot;
                      const isSlotShiny =
                        Boolean(set.shiny) || shinySlots.includes(i);
                      const spKey = getSpeciesKey(set.species);
                      const unlockedCount = profile.devModeEnabled
                        ? 4
                        : (profile.unlockedMoveSlots[spKey]?.length ?? 0);

                      return (
                        <button
                          key={`${set.species}-${i}`}
                          type="button"
                          onClick={() => setSelectedSlot(i)}
                          className={`flex items-center justify-between gap-1.5 rounded-2xl border px-3 py-2 text-left transition cursor-pointer ${
                            isSelected
                              ? 'border-amber-400 bg-amber-500/15 shadow-lg shadow-amber-500/10'
                              : 'border-slate-800 bg-slate-950/80 hover:border-slate-600'
                          }`}
                        >
                          <div className="flex min-w-0 items-center gap-2">
                            <PokemonIcon
                              species={set.species}
                              className="scale-95"
                            />
                            <div className="min-w-0">
                              <p className="truncate text-xs font-bold text-white">
                                {isSlotShiny ? '✨ ' : ''}
                                {set.species}
                              </p>
                              <p className="truncate text-[10px] text-amber-300/80">
                                {isGen1
                                  ? `Nv. ${set.level || 100}`
                                  : set.item || 'Sin objeto'}
                              </p>
                            </div>
                          </div>
                          <span
                            title={`${unlockedCount}/4 slots de movimiento desbloqueados`}
                            className="shrink-0 rounded-md border border-slate-700/80 bg-slate-900 px-1.5 py-0.5 font-mono-code text-[9px] font-bold text-slate-300"
                          >
                            {unlockedCount}/4
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Unified <PokemonEditor mode="narrative" /> */}
                  {activeSet && (
                    <PokemonEditor
                      key={`narrative-${activeSet.species}-${clampedSlot}`}
                      mode="narrative"
                      profile={profile}
                      formatId={config.formatId}
                      narrativeSet={activeSet}
                      canonicalSet={canonicalActiveSet}
                      chapterDefaultItems={chapterDefaultItems}
                      isSlotShiny={
                        Boolean(activeSet.shiny) ||
                        shinySlots.includes(clampedSlot)
                      }
                      shinyUsedCount={shinySlots.length}
                      onToggleNarrativeShiny={() =>
                        handleToggleSlotShiny(clampedSlot)
                      }
                      onSetCustomItem={(sp, it) => {
                        setManualPasteOverride(null);
                        onSetCustomItem(sp, it);
                      }}
                      onSetCustomMove={(sp, slotIdx, mv) => {
                        setManualPasteOverride(null);
                        return onSetCustomMove(sp, slotIdx, mv);
                      }}
                      onResetSpecies={(sp) => {
                        setManualPasteOverride(null);
                        onResetSpecies(sp);
                      }}
                      onUnlockMoveSlot={(sp, slotIdx) => {
                        setManualPasteOverride(null);
                        return onUnlockMoveSlot(sp, slotIdx);
                      }}
                      onOpenShop={onOpenShop}
                      onNotice={setNotice}
                    />
                  )}
                </>
              )}

              {/* Collapsible Raw Showdown Paste */}
              <div className="mt-4 border-t border-slate-800/80 pt-3">
                <button
                  type="button"
                  onClick={() => setShowRawPaste((v) => !v)}
                  className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-slate-400 hover:text-amber-200 cursor-pointer"
                >
                  <Code2 className="h-3.5 w-3.5" />
                  {showRawPaste
                    ? 'Ocultar Paste Showdown'
                    : 'Ver / exportar Paste Showdown'}
                  {showRawPaste ? (
                    <ChevronUp className="h-3.5 w-3.5" />
                  ) : (
                    <ChevronDown className="h-3.5 w-3.5" />
                  )}
                </button>

                {showRawPaste && (
                  <div className="mt-2.5 space-y-2">
                    <textarea
                      value={effectivePlayerPaste}
                      onChange={(e) => {
                        if (profile.devModeEnabled) {
                          setManualPasteOverride(e.target.value);
                        }
                      }}
                      readOnly={!profile.devModeEnabled}
                      rows={9}
                      className="font-mono-code w-full rounded-2xl border border-slate-800 bg-black/60 p-3 text-xs leading-relaxed text-slate-200 focus:border-amber-400 focus:outline-none"
                    />
                    {manualPasteOverride !== null && (
                      <button
                        type="button"
                        onClick={() => setManualPasteOverride(null)}
                        className="text-[11px] font-semibold text-amber-300 hover:underline cursor-pointer"
                      >
                        Volver al equipo compilado del Teambuilder
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* RIGHT 4 COLS (STICKY): Rival Atmosphere, Dynamic Difficulty (live BST Cap!) & Fog of War Sighting */}
          <div className={`${mobileBriefingTab === 'team' ? 'hidden lg:flex' : 'flex'} flex-col justify-between rounded-3xl border border-rose-400/25 bg-slate-900/75 p-4 sm:p-5 lg:sticky lg:top-4 lg:col-span-4`}>
            <div>
              <div className="mb-3 flex items-center gap-3">
                {config.rivalProfile ? (
                  <RivalPortraitTooltip
                    profile={config.rivalProfile}
                    charId={config.rivalCharId}
                    placement="bottom"
                  >
                    <button
                      type="button"
                      className="h-12 w-12 shrink-0 overflow-hidden rounded-xl border-2 border-rose-500/60 bg-slate-950 p-0.5 transition hover:border-amber-300 cursor-help"
                    >
                      <CharacterPortrait
                        charId={config.rivalCharId}
                        variant="bust"
                        className="h-full w-full object-cover object-top"
                      />
                    </button>
                  </RivalPortraitTooltip>
                ) : (
                  <div className="h-12 w-12 shrink-0 overflow-hidden rounded-xl border border-rose-500/45 bg-slate-950 p-0.5">
                    <CharacterPortrait
                      charId={config.rivalCharId}
                      variant="bust"
                      className="h-full w-full object-cover object-top"
                    />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <h3 className="truncate font-display text-lg font-bold text-white">
                      {config.rivalName}
                    </h3>
                    <HelpTip title={config.rivalName} badge={npcDef.personality.styleName} size="xs">
                      {config.rivalProfile?.bio && <p>{config.rivalProfile.bio}</p>}
                      <p className="text-violet-200">{npcDef.personality.directiveSummary}</p>
                    </HelpTip>
                  </div>
                  <p className="truncate text-[11px] text-slate-400">
                    {config.rivalTitle}
                  </p>
                </div>
              </div>

              {/* Difficulty / Variant Run Selector */}
              <div className="mb-3.5 space-y-2.5 rounded-2xl border border-violet-400/25 bg-violet-950/20 p-3">
                <div className="flex flex-wrap items-center justify-between gap-1.5">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-violet-200">
                    {npcDef.personality.styleName}
                  </span>
                  {npcDef.socialLink?.romanceable && (
                    <span className="rounded bg-fuchsia-500/20 px-1.5 py-0.5 text-[9px] font-bold text-fuchsia-200">
                      Rival Clave
                    </span>
                  )}
                </div>

                {/* 4-Tier Difficulty Selector (Recalculates BST Cap LIVE!) */}
                <div className="border-t border-white/10 pt-2">
                  <div className="mb-1.5 flex items-center justify-between gap-1">
                    <p className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-amber-200">
                      <Flame className="h-3 w-3 text-amber-400" />
                      Dificultad
                    </p>
                    <span className="font-mono-code text-[9.5px] font-bold text-sky-300">
                      Cap:{' '}
                      {bstLicense.maxTeamBst !== null
                        ? `${bstLicense.maxTeamBst} BST`
                        : '∞'}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-1.5">
                    {DIFFICULTY_ORDER.map((diffId) => {
                      const meta = DIFFICULTY_META[diffId];
                      const previewLic = getImperialBstLicense(profile, diffId);
                      return (
                        <button
                          key={diffId}
                          type="button"
                          onClick={() => setDifficultyMode(diffId)}
                          className={`rounded-lg border px-2 py-1.5 text-left transition cursor-pointer ${
                            difficultyMode === diffId
                              ? diffId === 'nightmare'
                                ? 'border-rose-400 bg-rose-500/25 text-rose-100'
                                : diffId === 'kaizo'
                                  ? 'border-amber-400 bg-amber-500/25 text-amber-100'
                                  : diffId === 'standard'
                                    ? 'border-emerald-400 bg-emerald-500/20 text-emerald-100'
                                    : 'border-sky-400 bg-sky-500/20 text-sky-100'
                              : 'border-slate-800 bg-slate-950/80 text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          <p className="text-[10px] font-extrabold">{meta.label}</p>
                          <p className="font-mono-code text-[9px] opacity-80">
                            {previewLic.maxTeamBst !== null
                              ? `${previewLic.maxTeamBst} BST`
                              : 'Sin Cap ∞'}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                  <div className="mt-2 flex items-center justify-between gap-2 rounded-lg border border-pink-400/30 bg-pink-950/25 px-2.5 py-1 text-[10px]">
                    <span className="font-extrabold text-pink-200">
                      💖 Vínculo: {difficultyMode === 'baby' || difficultyMode === 'standard' ? 'Clásico' : 'Táctico (1×)'}
                    </span>
                    <HelpTip title="Vínculo del Heredero" size="xs">
                      <p>
                        <strong>Baby / Normal (Clásico):</strong> 22% aguante a 1 PS + 20% cura de estado al final del turno en Pokémon no-Oscuros.
                      </p>
                      <p>
                        <strong>Difícil / Tryhard (Táctico):</strong> 1× aguante a 1 PS + 1× cura de estado por combate SOLO en Vínculo Alto (Iniciales, Casa R3, Recompensas o Purificados). Bloqueado en Pokémon Oscuros.
                      </p>
                    </HelpTip>
                  </div>
                </div>

                {/* Rank 1 Romance Anti-Diablo Tactical Scouting (Rival Personalizado) */}
                <div className="border-t border-white/10 pt-2">
                  {socialPerks.hasAntiDiabloScouting ? (
                    <div className="space-y-1 rounded-xl border border-sky-400/35 bg-sky-950/40 p-2">
                      <p className="flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-wider text-sky-200">
                        <ShieldAlert className="h-3 w-3 text-sky-400" />
                        Scouting ({getRivalName(profile)} R1)
                      </p>
                      {scoutingAlerts.length > 0 ? (
                        scoutingAlerts.map((al, idx) => (
                          <p
                            key={idx}
                            className="text-[10.5px] leading-snug text-amber-100"
                          >
                            {al}
                          </p>
                        ))
                      ) : (
                        <p className="text-[10px] text-sky-200/80">
                          Sin overrides ocultos en esta dificultad.
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center justify-between text-[10px] text-slate-400">
                      <span>🔒 Scouting: {getRivalName(profile)} R1</span>
                      <HelpTip title="Scouting Anti-Diablo" size="xs">
                        <p>
                          Sube a <strong>{getRivalName(profile)}</strong> a Rango 1 en Vínculos para revelar objetos y movimientos sorpresa del modo Tryhard/Diablo antes del combate.
                        </p>
                      </HelpTip>
                    </div>
                  )}
                </div>

                {/* Variant / Random Run Selector when NPC has multiple teams */}
                {npcVariants.length > 1 && (
                  <div className="border-t border-white/10 pt-2">
                    <p className="mb-1.5 flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-sky-200">
                      <Dices className="h-3 w-3 text-sky-400" />
                      Variante de Equipo (Run)
                    </p>
                    <select
                      value={selectedVariantId}
                      onChange={(e) => setSelectedVariantId(e.target.value)}
                      className="w-full rounded-lg border border-slate-700 bg-slate-950 px-2.5 py-1.5 text-[11px] font-semibold text-slate-100 focus:border-sky-400 focus:outline-none"
                    >
                      {npcVariants.map((v) => (
                        <option key={v.id} value={v.id}>
                          {v.label}
                        </option>
                      ))}
                      <option value="random">
                        🎲 Sorpresa (Aleatorio en esta Run)
                      </option>
                    </select>
                  </div>
                )}
              </div>

              {/* Turn-0 Biome Field Effect Sighting (Weather, Terrain, Gravity, Magic/Wonder/Trick Room) */}
              {config.puzzleConditions &&
                (config.puzzleConditions.biomeLabel ||
                  config.puzzleConditions.weather ||
                  config.puzzleConditions.terrain ||
                  (config.puzzleConditions.pseudoWeathers &&
                    config.puzzleConditions.pseudoWeathers.length > 0)) && (() => {
                  const pc = config.puzzleConditions;
                  const wxLabels: Record<string, string> = {
                    sunnyday: '☀️ Sol Intenso',
                    raindance: '🌧️ Lluvia',
                    sandstorm: '🏜️ Tormenta de Arena',
                    snow: '❄️ Nieve',
                    shadowsky: '🌑 Cielo Oscuro (Shadow Sky)',
                  };
                  const trLabels: Record<string, string> = {
                    electricterrain: '⚡ Campo Eléctrico',
                    grassyterrain: '🌿 Campo de Hierba',
                    psychicterrain: '🔮 Campo Psíquico',
                    mistyterrain: '🌫️ Campo de Niebla',
                  };
                  const pwLabels: Record<string, string> = {
                    gravity: '🌌 Gravedad',
                    trickroom: '⏳ Espacio Raro',
                    magicroom: '🃏 Zona Mágica',
                    wonderroom: '🪞 Zona Extraña',
                  };
                  const activeTags: string[] = [];
                  if (pc.weather) activeTags.push(wxLabels[pc.weather] ?? pc.weather);
                  if (pc.terrain) activeTags.push(trLabels[pc.terrain] ?? pc.terrain);
                  for (const pw of pc.pseudoWeathers ?? []) {
                    activeTags.push(pwLabels[pw] ?? pw);
                  }
                  return (
                    <div className="mb-4 rounded-2xl border border-cyan-400/40 bg-gradient-to-br from-cyan-950/45 via-slate-950/85 to-indigo-950/35 p-3">
                      <div className="flex flex-wrap items-center justify-between gap-1.5">
                        <span className="inline-flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-wider text-cyan-200">
                          <CloudSun className="h-3.5 w-3.5 text-cyan-300" />
                          🌍 Avistamiento de Bioma (Turno 0)
                        </span>
                        {pc.extendedEnvironment && (
                          <span className="rounded-md border border-amber-400/45 bg-amber-500/15 px-1.5 py-0.5 font-mono-code text-[9px] font-extrabold text-amber-200">
                            ∞ Persistente (hasta sobrescribir)
                          </span>
                        )}
                      </div>
                      {pc.biomeLabel && (
                        <p className="mt-1.5 text-xs font-extrabold text-white">
                          {pc.biomeLabel}
                        </p>
                      )}
                      {activeTags.length > 0 && (
                        <div className="mt-1.5 flex flex-wrap gap-1">
                          {activeTags.map((tag) => (
                            <span
                              key={tag}
                              className="rounded-full border border-cyan-400/35 bg-cyan-500/15 px-2 py-0.5 text-[10px] font-bold text-cyan-100"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                      {pc.biomeCounterHint && (
                        <p className="mt-2 text-[10.5px] leading-relaxed text-slate-300">
                          💡 {pc.biomeCounterHint}
                        </p>
                      )}
                      <button
                        type="button"
                        onClick={onOpenShop}
                        className="mt-2 inline-flex w-full items-center justify-center gap-1.5 rounded-xl border border-amber-400/45 bg-amber-500/15 px-2.5 py-1.5 text-[10.5px] font-extrabold text-amber-100 transition hover:bg-amber-500/25 cursor-pointer"
                      >
                        <ShoppingBag className="h-3.5 w-3.5 text-amber-300" />
                        Buscar Counters en Tienda (Filtros Showdown)
                      </button>
                    </div>
                  );
                })()}

              {/* Fog of War Silhouettes (Masks Illusion Lead!) */}
              <div className="mb-4">
                <div className="mb-2 flex items-center justify-between text-[11px]">
                  <span className="font-bold text-slate-300">
                    Avistamiento enemigo
                  </span>
                  <span className="inline-flex items-center gap-1 text-rose-300">
                    <EyeOff className="h-3 w-3" />
                    {config.openTeamsheet
                      ? 'Open Teamsheet'
                      : `${visibleCount}/${parsedRival.length}`}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {parsedRival.slice(0, visibleCount).map((set, i) => {
                    const maskedSpecies =
                      !config.openTeamsheet &&
                      set.ability?.toLowerCase() === 'illusion' &&
                      parsedRival.length > 1
                        ? parsedRival[parsedRival.length - 1].species
                        : set.species;
                    return (
                      <div
                        key={`visible-rival-${maskedSpecies}-${i}`}
                        className="flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-950/90 px-2.5 py-1.5"
                      >
                        <PokemonIcon
                          species={maskedSpecies}
                          className="scale-90"
                        />
                        <p className="truncate text-xs font-semibold text-white">
                          {maskedSpecies}
                        </p>
                      </div>
                    );
                  })}
                  {Array.from({ length: hiddenCount }).map((_, idx) => (
                    <div
                      key={`hidden-rival-${idx}`}
                      className="flex items-center gap-2 rounded-xl border border-dashed border-rose-500/30 bg-slate-950/50 px-2.5 py-2"
                    >
                      <HelpCircle className="h-4 w-4 shrink-0 text-rose-300/60" />
                      <span className="text-xs font-semibold text-rose-200/70">
                        ???
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Narrative Decision Consequence Summary */}
              {config.traces.length > 0 && (
                <div className="space-y-2 border-t border-slate-800/80 pt-3">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-amber-300">
                    Decisiones tomadas en la escena
                  </p>
                  {config.traces.map((trace) => (
                    <div
                      key={trace.id}
                      className="rounded-xl border border-slate-800/90 bg-slate-950/70 px-3 py-2"
                    >
                      <p className="text-[11px] font-semibold text-slate-200">
                        {trace.choiceLabel}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              {/* Debug Rival Paste (ONLY visible in Dev Mode!) */}
              {profile.devModeEnabled && showRivalDebugPaste && (
                <div className="mt-3">
                  <p className="mb-1 font-mono-code text-[10px] text-fuchsia-300">
                    [DEV MODE] rival_team.showdown
                  </p>
                  <textarea
                    value={rivalPaste}
                    onChange={(e) => setRivalPaste(e.target.value)}
                    rows={7}
                    className="font-mono-code w-full rounded-xl border border-fuchsia-400/40 bg-black/70 p-2.5 text-[11px] text-slate-200 focus:outline-none"
                  />
                </div>
              )}
            </div>

            <div className="mt-4 flex items-center justify-between border-t border-slate-800/80 pt-3">
              <span className="text-[11px] text-slate-500">
                Niebla de guerra activa
              </span>
              {profile.devModeEnabled && (
                <button
                  type="button"
                  onClick={() => setShowRivalDebugPaste((v) => !v)}
                  className="inline-flex items-center gap-1 rounded-lg border border-fuchsia-400/35 bg-fuchsia-500/10 px-2.5 py-1 text-[10px] font-bold text-fuchsia-200 cursor-pointer"
                >
                  {showRivalDebugPaste ? (
                    <>
                      <EyeOff className="h-3 w-3" /> Ocultar Debug
                    </>
                  ) : (
                    <>
                      <Eye className="h-3 w-3" /> Debug Rival
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </section>

        {/* Launch CTA */}
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-slate-800 bg-slate-900/90 p-5">
          <div>
            {!isValid ? (
              <p className="flex items-center gap-2 text-sm font-semibold text-rose-400">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                {isCustomTeamBlockedByBstCap
                  ? `Excedes el límite BST de ${DIFFICULTY_META[difficultyMode]?.label} (${bstLicense.currentPartyBst} / ${bstLicense.maxTeamBst} BST). Ajusta tu equipo en las Cajas PC arriba, cambia a Baby Mode o vuelve al equipo narrativo.`
                  : 'Ambos equipos deben tener al menos un Pokémon válido.'}
              </p>
            ) : (
              <div>
                <p className="text-sm font-bold text-white">
                  Escuadrón listo para entrar al campo
                </p>
                <p className="text-xs text-slate-400">
                  {config.formatLabel ?? config.formatId} · {parsedPlayer.length}{' '}
                  Pokémon · {DIFFICULTY_META[difficultyMode]?.label}
                  {useCustomTeam && canSwapCustomTeam
                    ? ` · ${bstLicense.currentPartyBst} / ${
                        bstLicense.maxTeamBst !== null
                          ? `${bstLicense.maxTeamBst} BST`
                          : '∞ BST'
                      }`
                    : ''}
                </p>
              </div>
            )}
          </div>

          <button
            disabled={!isValid}
            onClick={handleStart}
            className="inline-flex items-center gap-2.5 rounded-2xl bg-gradient-to-r from-amber-500 to-yellow-500 px-7 py-3.5 text-sm font-extrabold text-slate-950 shadow-xl shadow-amber-500/25 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40 active:scale-[0.98] cursor-pointer"
          >
            <Swords className="h-4 w-4" />
            Entrar al Combate
          </button>
        </div>
      </div>

      <OpenTeamsheetModal
        open={showTeamsheet}
        onClose={() => setShowTeamsheet(false)}
        formatLabel={config.formatLabel ?? config.formatId}
        playerName={config.playerName}
        rivalName={config.rivalName}
        playerSheet={buildSheet(parsedPlayer)}
        rivalSheet={buildSheet(parsedRival)}
      />
    </div>
  );
};
