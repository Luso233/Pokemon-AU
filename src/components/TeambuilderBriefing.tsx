import React, { useMemo, useState } from 'react';
import { Dex, Teams } from '@pkmn/sim';
import {
  AlertTriangle,
  ArrowLeft,
  Backpack,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  ClipboardList,
  Code2,
  Coins,
  Dices,
  Eye,
  EyeOff,
  Flame,
  Heart,
  HelpCircle,
  Lock,
  RotateCcw,
  Search,
  ShieldAlert,
  Sparkles,
  Swords,
  Unlock,
  Wrench,
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
  getLegalLearnsetForSpecies,
  getMoveSlotUnlockCost,
  getSpeciesKey,
} from '../engine/learnsetService';
import {
  applyChapterProgressionToPaste,
  applyShinySlotsToPaste,
  compileCustomTeamToShowdownPaste,
  isMoveSlotUnlocked,
} from '../engine/playerProfile';
import { getTypeBadgeClass } from '../engine/pokemonVisuals';
import type {
  BattleDifficultyMode,
  ChapterTeamPolicy,
  OpenTeamsheetEntry,
  PlayerSaveProfile,
  ResolvedBattleConfig,
} from '../types/game';
import { CharacterPortrait } from './CharacterPortrait';
import { OpenTeamsheetModal } from './OpenTeamsheetModal';
import { PokemonIcon, PokemonSprite } from './PokemonSprite';
import { RivalPortraitTooltip } from './RivalPortraitTooltip';

interface TeambuilderBriefingProps {
  config: ResolvedBattleConfig;
  profile: PlayerSaveProfile;
  teamEditPolicy?: ChapterTeamPolicy;
  onReplayVN: () => void;
  onOpenShop: () => void;
  onOpenDevMode: () => void;
  onOpenCamp?: () => void;
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
  onLaunchBattle: (finalConfig: ResolvedBattleConfig) => void;
}

export const TeambuilderBriefing: React.FC<TeambuilderBriefingProps> = ({
  config,
  profile,
  teamEditPolicy,
  onReplayVN,
  onOpenShop,
  onOpenDevMode,
  onOpenCamp,
  onUnlockMoveSlot,
  onSetCustomMove,
  onSetCustomItem,
  onResetSpecies,
  onLaunchBattle,
}) => {
  const isGen1 = getFormatGeneration(config.formatId) === 1;
  const effectiveTeamPolicy: ChapterTeamPolicy =
    teamEditPolicy ??
    CHAPTERS.find((c) => c.id === config.chapterId)?.teamEditPolicy ??
    'fixed';
  const canSwapCustomTeam =
    effectiveTeamPolicy === 'editable' &&
    profile.customTeam.length > 0 &&
    config.formatId !== 'gen1customgame' &&
    config.formatId !== 'gen6triplescustomgame' &&
    config.formatId !== 'gen91v1' &&
    config.formatId !== 'gen9monotype' &&
    config.formatId !== 'gen9vgc2024regg' &&
    !config.emptyPlayerSlots?.length &&
    !config.persistedPartyState;

  const [useCustomTeam, setUseCustomTeam] = useState(
    Boolean(canSwapCustomTeam && profile.useCustomTeamInStory)
  );
  const [selectedSlot, setSelectedSlot] = useState(0);
  const [shinySlots, setShinySlots] = useState<number[]>(() => {
    if (canSwapCustomTeam && profile.useCustomTeamInStory) {
      return profile.customTeam
        .map((m, i) => (m.shiny ? i : -1))
        .filter((i) => i >= 0);
    }
    return [];
  });
  const [activeMovePickerSlot, setActiveMovePickerSlot] = useState<
    number | null
  >(null);
  const [moveSearch, setMoveSearch] = useState('');
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
  const [difficultyMode, setDifficultyMode] = useState<BattleDifficultyMode>(
    config.difficultyMode ?? profile.defaultDifficulty ?? 'kaizo'
  );
  const [selectedVariantId, setSelectedVariantId] = useState<string>(
    config.selectedVariantId ?? 'canonical'
  );

  const socialPerks = useMemo(
    () => computeActiveSocialLinkPerks(profile),
    [profile]
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

  // Union of chapter's canonical held items + player's owned inventory items
  const availableItems = useMemo(() => {
    return Array.from(
      new Set([...chapterDefaultItems, ...profile.inventory.items])
    ).sort((a, b) => a.localeCompare(b));
  }, [chapterDefaultItems, profile.inventory.items]);

  // Dynamically computed Showdown paste reflecting story roster + progression overrides
  const effectivePlayerPaste = useMemo(() => {
    if (manualPasteOverride !== null) return manualPasteOverride;
    if (useCustomTeam && canSwapCustomTeam) {
      const customPaste = compileCustomTeamToShowdownPaste(
        profile.customTeam,
        config.rivalIntel?.levelCap ?? 100
      );
      return shinySlots.length > 0
        ? applyShinySlotsToPaste(customPaste, shinySlots, ownedShinyCharms)
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

  const legalMovesForActive = useMemo(() => {
    if (!activeSet) return [];
    const baseMoves = canonicalActiveSet?.moves ?? activeSet.moves ?? [];
    return getLegalLearnsetForSpecies(
      activeSet.species,
      config.formatId,
      baseMoves
    );
  }, [activeSet, canonicalActiveSet, config.formatId]);

  const filteredMoves = useMemo(() => {
    const q = moveSearch.trim().toLowerCase();
    if (!q) return legalMovesForActive.slice(0, 60);
    return legalMovesForActive
      .filter(
        (m) =>
          m.name.toLowerCase().includes(q) ||
          m.type.toLowerCase().includes(q) ||
          m.shortDesc.toLowerCase().includes(q)
      )
      .slice(0, 60);
  }, [legalMovesForActive, moveSearch]);

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

  const isValid = parsedPlayer.length > 0 && parsedRival.length > 0;
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

  const handleUnlockSlot = (species: string, slotIdx: number) => {
    setManualPasteOverride(null);
    const res = onUnlockMoveSlot(species, slotIdx);
    if (res.ok) {
      setNotice({
        tone: 'ok',
        text: `🔓 ¡Slot ${slotIdx + 1} de ${species} desbloqueado! Ya puedes elegir cualquier movimiento legal de su learnset.`,
      });
      setActiveMovePickerSlot(slotIdx);
      setMoveSearch('');
    } else {
      setNotice({
        tone: 'err',
        text: res.error || 'No tienes suficientes PokéCoronas.',
      });
    }
  };

  const handlePickMove = (species: string, slotIdx: number, moveName: string) => {
    setManualPasteOverride(null);
    const res = onSetCustomMove(species, slotIdx, moveName);
    if (res.ok) {
      setNotice({
        tone: 'ok',
        text: `✓ ${species} aprendió ${moveName} en el Slot ${slotIdx + 1}.`,
      });
      setActiveMovePickerSlot(null);
      setMoveSearch('');
    } else {
      setNotice({
        tone: 'err',
        text: res.error || 'No se pudo asignar el movimiento.',
      });
    }
  };

  const handleStart = () => {
    if (!isValid) return;
    const baseWithPlayer: ResolvedBattleConfig = {
      ...config,
      playerShowdownPaste: effectivePlayerPaste,
      rivalShowdownPaste:
        showRivalDebugPaste && rivalPaste !== config.rivalShowdownPaste
          ? rivalPaste
          : config.rivalShowdownPaste,
    };
    const finalWithNpc = applyNpcRunModifiers(
      baseWithPlayer,
      difficultyMode,
      selectedVariantId
    );
    onLaunchBattle(finalWithNpc);
  };

  const activeSpeciesKey = activeSet ? getSpeciesKey(activeSet.species) : '';
  const activeHasCustomizations = Boolean(
    activeSpeciesKey &&
      (profile.customItems[activeSpeciesKey] ||
        (profile.customMoves[activeSpeciesKey] &&
          Object.keys(profile.customMoves[activeSpeciesKey]).length > 0))
  );

  return (
    <div className="min-h-screen bg-[#060a14] text-slate-100">
      <div className="mx-auto max-w-6xl px-5 py-7">
        {/* Header */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3.5">
            <button
              onClick={onReplayVN}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-3.5 py-2 text-xs font-semibold text-slate-300 transition hover:border-amber-400/50 hover:text-white cursor-pointer"
            >
              <ArrowLeft className="h-4 w-4" />
              Volver a la escena
            </button>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-amber-300">
                Preparación del Escuadrón · {config.formatLabel ?? config.formatId}
              </p>
              <h1 className="font-display text-2xl font-bold text-white sm:text-3xl">
                Teambuilder de Campaña
              </h1>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={onOpenShop}
              className="inline-flex items-center gap-1.5 rounded-xl border border-amber-400/45 bg-amber-500/15 px-3 py-2 text-xs font-extrabold text-amber-200 hover:bg-amber-500/25 cursor-pointer"
            >
              <Coins className="h-3.5 w-3.5 text-amber-400" />
              <span className="font-mono-code">
                {profile.coins.toLocaleString()} {CURRENCY_SHORT}
              </span>
            </button>

            {onOpenCamp && (
              <button
                onClick={onOpenCamp}
                className="inline-flex items-center gap-1.5 rounded-xl border border-fuchsia-400/45 bg-fuchsia-500/15 px-3 py-2 text-xs font-bold text-fuchsia-200 hover:bg-fuchsia-500/25 cursor-pointer"
              >
                <Heart className="h-3.5 w-3.5 text-fuchsia-300" />
                Vínculos & Campamento
              </button>
            )}

            <button
              onClick={onOpenDevMode}
              className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-bold transition cursor-pointer ${
                profile.devModeEnabled
                  ? 'border-fuchsia-400/60 bg-fuchsia-500/20 text-fuchsia-200'
                  : 'border-slate-700 bg-slate-900 text-slate-300 hover:border-fuchsia-400/40'
              }`}
            >
              <Wrench className="h-3.5 w-3.5" />
              Dev Mode
            </button>

            {config.openTeamsheet && (
              <button
                onClick={() => setShowTeamsheet(true)}
                className="inline-flex items-center gap-1.5 rounded-xl border border-sky-400/50 bg-sky-500/20 px-3.5 py-2 text-xs font-bold text-sky-100 transition hover:bg-sky-500/30 cursor-pointer"
              >
                <ClipboardList className="h-3.5 w-3.5" />
                Open Teamsheet
              </button>
            )}
          </div>
        </div>

        {notice && (
          <div
            className={`mb-4 rounded-2xl border px-4 py-2.5 text-xs font-semibold ${
              notice.tone === 'ok'
                ? 'border-emerald-400/40 bg-emerald-500/15 text-emerald-100'
                : 'border-rose-400/40 bg-rose-500/15 text-rose-100'
            }`}
          >
            {notice.text}
          </div>
        )}

        {/* Main 12-Col Layout: Story-Locked Teambuilder (Left 8) + Fog-of-War Rival Card (Right 4) */}
        <section className="mb-6 grid gap-6 lg:grid-cols-12">
          {/* LEFT 8 COLS: Interactive Story-Locked Teambuilder */}
          <div className="space-y-4 lg:col-span-8">
            <div className="rounded-3xl border border-amber-400/25 bg-slate-900/80 p-5">
              {/* Roster Bar */}
              <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 overflow-hidden rounded-xl border border-amber-400/45 bg-slate-950 p-0.5">
                    <CharacterPortrait
                      charId={config.playerCharId}
                      variant="bust"
                      className="h-full w-full object-cover object-top"
                    />
                  </div>
                  <div>
                    <h2 className="font-display text-lg font-bold text-white">
                      {config.playerName}
                    </h2>
                    <p className="text-[11px] text-slate-400">
                      Escuadrón disponible en este punto de la historia · Personaliza objetos y desbloquea slots de movimientos
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {canSwapCustomTeam && (
                    <button
                      type="button"
                      onClick={() => {
                        setManualPasteOverride(null);
                        setActiveMovePickerSlot(null);
                        setUseCustomTeam((v) => !v);
                      }}
                      className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-[11px] font-bold transition cursor-pointer ${
                        useCustomTeam
                          ? 'border-sky-400 bg-sky-500/20 text-sky-100'
                          : 'border-slate-700 bg-slate-950 text-slate-300 hover:border-sky-400/40'
                      }`}
                    >
                      <Wrench className="h-3 w-3" />
                      {useCustomTeam ? '✓ Equipo Libre' : 'Usar Equipo Libre'}
                    </button>
                  )}
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-xs font-semibold text-emerald-300">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    {parsedPlayer.length} listos
                  </span>
                </div>
              </div>

              {/* Chapter Team Policy Banner (Fixed Single-Team vs Editable Squad) */}
              <div
                className={`mb-4 rounded-2xl border px-3.5 py-2.5 text-xs ${
                  effectiveTeamPolicy === 'editable'
                    ? 'border-sky-400/40 bg-sky-500/10 text-sky-100'
                    : 'border-slate-700 bg-slate-950/80 text-slate-300'
                }`}
              >
                {effectiveTeamPolicy === 'editable' ? (
                  <p>
                    <strong className="text-sky-200">
                      🛠️ Capítulo de Equipo Modificable:
                    </strong>{' '}
                    Puedes usar el escuadrón narrativo o cambiar a tu{' '}
                    <strong>Equipo Libre (Cajas PC)</strong> con los Pokémon que hayas desbloqueado en tu run.
                  </p>
                ) : (
                  <p>
                    <strong className="text-amber-200">
                      🔒 Capítulo de Equipo Único Fijo:
                    </strong>{' '}
                    Este escenario se juega con un único equipo predefinido para respetar el reto táctico (puedes seguir ajustando objetos y slots desbloqueados).
                  </p>
                )}
              </div>

              {/* Selectable Party Slots */}
              <div className="mb-5 grid grid-cols-2 gap-2 sm:grid-cols-3">
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
                      onClick={() => {
                        setSelectedSlot(i);
                        setActiveMovePickerSlot(null);
                        setMoveSearch('');
                      }}
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

              {/* Active Pokémon Progression Editor */}
              {activeSet && (
                <div className="rounded-2xl border border-slate-800 bg-slate-950/90 p-4">
                  {/* Top Pokémon Banner */}
                  <div className="mb-4 flex flex-wrap items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
                    <div className="flex items-center gap-3.5">
                      <div className="flex h-20 w-20 items-center justify-center rounded-2xl border border-slate-800 bg-slate-900/90">
                        <PokemonSprite
                          species={activeSet.species}
                          side="p2"
                          shiny={
                            Boolean(activeSet.shiny) ||
                            shinySlots.includes(clampedSlot)
                          }
                          className="h-16 w-16"
                        />
                      </div>
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-display text-xl font-bold text-white">
                            {activeSet.species}
                          </h3>
                          <span className="rounded-md border border-slate-700 bg-slate-900 px-2 py-0.5 font-mono-code text-[10px] font-bold text-slate-300">
                            Nv. {activeSet.level || 100}
                          </span>
                          {activeSet.teraType && !isGen1 && (
                            <span
                              className={`rounded-md border px-2 py-0.5 text-[10px] font-bold uppercase ${getTypeBadgeClass(
                                activeSet.teraType
                              )}`}
                            >
                              Tera {activeSet.teraType}
                            </span>
                          )}
                        </div>
                        <p className="mt-1 text-xs text-slate-400">
                          {!isGen1 && activeSet.ability ? (
                            <>
                              Habilidad:{' '}
                              <strong className="text-slate-200">
                                {activeSet.ability}
                              </strong>
                              {' · '}
                            </>
                          ) : null}
                          {activeSet.nature ? (
                            <>
                              Naturaleza:{' '}
                              <strong className="text-slate-200">
                                {activeSet.nature}
                              </strong>
                            </>
                          ) : (
                            'Reglas clásicas de Era Antigua'
                          )}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      {ownedShinyCharms > 0 && (
                        <button
                          type="button"
                          onClick={() => handleToggleSlotShiny(clampedSlot)}
                          className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-bold transition cursor-pointer ${
                            Boolean(activeSet.shiny) ||
                            shinySlots.includes(clampedSlot)
                              ? 'border-fuchsia-400 bg-fuchsia-500/25 text-fuchsia-100'
                              : 'border-slate-700 bg-slate-900 text-slate-300 hover:border-fuchsia-400/50'
                          }`}
                        >
                          <Sparkles className="h-3.5 w-3.5" />
                          Shiny ({shinySlots.length}/{ownedShinyCharms})
                        </button>
                      )}

                      {!useCustomTeam && activeHasCustomizations && (
                        <button
                          type="button"
                          onClick={() => {
                            setManualPasteOverride(null);
                            onResetSpecies(activeSet.species);
                            setActiveMovePickerSlot(null);
                            setNotice({
                              tone: 'ok',
                              text: `Set original restaurado para ${activeSet.species} (tus slots desbloqueados se mantienen).`,
                            });
                          }}
                          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:border-amber-400/40 hover:text-white cursor-pointer"
                        >
                          <RotateCcw className="h-3.5 w-3.5" />
                          Restaurar original
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Held Item Selector (Restricted to Chapter Defaults + Player Inventory) */}
                  <div className="mb-4">
                    <div className="mb-1.5 flex items-center justify-between">
                      <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-amber-300">
                        <Backpack className="h-3.5 w-3.5" />
                        Objeto Equipado (Inventario + Set del Capítulo)
                      </label>
                      {!isGen1 && (
                        <button
                          type="button"
                          onClick={onOpenShop}
                          className="text-[11px] font-semibold text-amber-300/80 hover:text-amber-200 cursor-pointer"
                        >
                          + Comprar más objetos en la Tienda
                        </button>
                      )}
                    </div>

                    {isGen1 ? (
                      <div className="rounded-xl border border-slate-800 bg-slate-900/70 px-3.5 py-2 text-xs text-slate-400">
                        En Generación 1 (Reliquia de Silph Co.) no existen objetos equipados.
                      </div>
                    ) : useCustomTeam ? (
                      <div className="rounded-xl border border-slate-800 bg-slate-900/70 px-3.5 py-2 text-xs text-slate-300">
                        Objeto del Equipo Libre:{' '}
                        <strong className="text-amber-200">
                          {activeSet.item || 'Ninguno'}
                        </strong>
                      </div>
                    ) : (
                      <select
                        value={activeSet.item || ''}
                        onChange={(e) => {
                          setManualPasteOverride(null);
                          onSetCustomItem(activeSet.species, e.target.value);
                          setNotice({
                            tone: 'ok',
                            text: e.target.value
                              ? `✓ ${activeSet.species} equipó ${e.target.value}.`
                              : `Se retiró el objeto de ${activeSet.species}.`,
                          });
                        }}
                        className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3.5 py-2.5 text-sm font-semibold text-white focus:border-amber-400 focus:outline-none"
                      >
                        <option value="">
                          (Por defecto:{' '}
                          {canonicalActiveSet?.item || 'Sin objeto'})
                        </option>
                        {availableItems.map((itemName) => {
                          const fromChapter =
                            chapterDefaultItems.includes(itemName);
                          const fromInventory =
                            profile.inventory.items.includes(itemName);
                          const tag =
                            fromChapter && fromInventory
                              ? 'Capítulo + Inventario'
                              : fromChapter
                                ? 'Set del capítulo'
                                : 'Tu inventario';
                          return (
                            <option key={itemName} value={itemName}>
                              {itemName} — {tag}
                            </option>
                          );
                        })}
                      </select>
                    )}
                  </div>

                  {/* 4 Unlockable Move Slots */}
                  <div>
                    <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                      <p className="text-xs font-bold uppercase tracking-wider text-sky-300">
                        Movimientos · Rompe candados para asignar cualquier ataque legal del Learnset
                      </p>
                      <span className="text-[10px] text-slate-400">
                        {legalMovesForActive.length} movimientos legales en @pkmn/sim
                      </span>
                    </div>

                    <div className="grid gap-2.5 sm:grid-cols-2">
                      {(activeSet.moves ?? []).slice(0, 4).map((mvName, slotIdx) => {
                        const mvData = Dex.moves.get(mvName);
                        const unlocked =
                          !useCustomTeam &&
                          isMoveSlotUnlocked(
                            profile,
                            activeSet.species,
                            slotIdx
                          );
                        const slotCost =
                          profile.devModeEnabled || socialPerks.hasFreeTutoringPerk
                            ? 0
                            : getMoveSlotUnlockCost(slotIdx);
                        const canonicalMove =
                          canonicalActiveSet?.moves?.[slotIdx] ?? mvName;
                        const isCustomized =
                          canonicalMove.toLowerCase() !== mvName.toLowerCase();
                        const isPickerOpen = activeMovePickerSlot === slotIdx;

                        return (
                          <div
                            key={`${activeSet.species}-mv-${slotIdx}`}
                            className={`rounded-2xl border p-3 transition ${
                              isPickerOpen
                                ? 'border-sky-400 bg-sky-950/25'
                                : unlocked
                                  ? 'border-emerald-400/35 bg-slate-900/90'
                                  : 'border-slate-800 bg-slate-900/65'
                            }`}
                          >
                            <div className="mb-1.5 flex items-center justify-between gap-2">
                              <div className="flex items-center gap-1.5">
                                <span className="font-mono-code text-[10px] font-bold text-slate-500">
                                  SLOT {slotIdx + 1}
                                </span>
                                {mvData.exists && (
                                  <span
                                    className={`rounded border px-1.5 py-0.2 text-[9px] font-bold uppercase ${getTypeBadgeClass(
                                      mvData.type
                                    )}`}
                                  >
                                    {mvData.type}
                                  </span>
                                )}
                              </div>

                              {!useCustomTeam &&
                                (unlocked ? (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setActiveMovePickerSlot(
                                        isPickerOpen ? null : slotIdx
                                      );
                                      setMoveSearch('');
                                    }}
                                    className="inline-flex items-center gap-1 rounded-lg border border-emerald-400/40 bg-emerald-500/15 px-2 py-0.5 text-[10px] font-bold text-emerald-200 hover:bg-emerald-500/25 cursor-pointer"
                                  >
                                    <Unlock className="h-3 w-3" />
                                    {isPickerOpen ? 'Cerrar' : 'Cambiar'}
                                  </button>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleUnlockSlot(
                                        activeSet.species,
                                        slotIdx
                                      )
                                    }
                                    disabled={profile.coins < slotCost}
                                    className="inline-flex items-center gap-1 rounded-lg border border-amber-400/45 bg-amber-500/15 px-2 py-0.5 text-[10px] font-extrabold text-amber-200 transition hover:bg-amber-500/25 disabled:cursor-not-allowed disabled:opacity-45 cursor-pointer"
                                  >
                                    <Lock className="h-3 w-3" />
                                    {slotCost === 0
                                      ? 'Abrir · GRATIS (Campeona R1)'
                                      : `Abrir · ${slotCost.toLocaleString()} ${CURRENCY_SHORT}`}
                                  </button>
                                ))}
                            </div>

                            <p className="text-sm font-bold text-white">
                              {mvName}
                            </p>
                            <div className="mt-0.5 flex flex-wrap items-center gap-2 text-[10px] text-slate-400">
                              <span>
                                {mvData.exists
                                  ? `${mvData.category} · ${
                                      mvData.basePower
                                        ? `${mvData.basePower} BP`
                                        : 'Estado'
                                    }`
                                  : 'Movimiento'}
                              </span>
                              {isCustomized && (
                                <span className="text-sky-300">
                                  (Base: {canonicalMove})
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Searchable @pkmn/sim Dex Learnset Picker */}
                    {activeMovePickerSlot !== null && !useCustomTeam && (
                      <div className="mt-3 rounded-2xl border border-sky-400/45 bg-[#080d1a] p-3.5">
                        <div className="mb-2.5 flex flex-wrap items-center justify-between gap-2">
                          <p className="text-xs font-bold text-sky-200">
                            Learnset legal de {activeSet.species} → Slot{' '}
                            {activeMovePickerSlot + 1}
                          </p>
                          <button
                            type="button"
                            onClick={() => setActiveMovePickerSlot(null)}
                            className="text-[11px] font-semibold text-slate-400 hover:text-white cursor-pointer"
                          >
                            Cerrar buscador
                          </button>
                        </div>

                        <div className="relative mb-2.5">
                          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                          <input
                            type="text"
                            value={moveSearch}
                            onChange={(e) => setMoveSearch(e.target.value)}
                            placeholder="Buscar movimiento por nombre o tipo (ej. Extreme Speed, Protect, Fire)..."
                            className="w-full rounded-xl border border-slate-700 bg-slate-950 py-2 pl-9 pr-3 text-xs text-white placeholder-slate-500 focus:border-sky-400 focus:outline-none"
                          />
                        </div>

                        <div className="grid max-h-56 gap-1.5 overflow-y-auto pr-1 sm:grid-cols-2">
                          {filteredMoves.map((opt) => {
                            const alreadyEquipped = (activeSet.moves ?? []).some(
                              (m, idx) =>
                                idx !== activeMovePickerSlot &&
                                m.toLowerCase() === opt.name.toLowerCase()
                            );
                            return (
                              <button
                                key={opt.id}
                                type="button"
                                disabled={alreadyEquipped}
                                onClick={() =>
                                  handlePickMove(
                                    activeSet.species,
                                    activeMovePickerSlot,
                                    opt.name
                                  )
                                }
                                className="flex flex-col rounded-xl border border-slate-800 bg-slate-900/90 px-3 py-2 text-left transition hover:border-sky-400/60 hover:bg-slate-800/90 disabled:cursor-not-allowed disabled:opacity-40 cursor-pointer"
                              >
                                <div className="flex items-center justify-between gap-2">
                                  <span className="truncate text-xs font-bold text-white">
                                    {opt.name}
                                  </span>
                                  <span
                                    className={`shrink-0 rounded border px-1.5 py-0.2 text-[9px] font-bold uppercase ${getTypeBadgeClass(
                                      opt.type
                                    )}`}
                                  >
                                    {opt.type}
                                  </span>
                                </div>
                                <div className="mt-0.5 flex items-center gap-2 text-[10px] text-slate-400">
                                  <span>{opt.category}</span>
                                  <span>
                                    {opt.basePower ? `${opt.basePower} BP` : '—'}
                                  </span>
                                  <span>
                                    {opt.accuracy === true
                                      ? 'Prec. ∞'
                                      : `${opt.accuracy}%`}
                                  </span>
                                  {opt.priority !== 0 && (
                                    <span className="text-amber-300">
                                      Prio {opt.priority > 0 ? `+${opt.priority}` : opt.priority}
                                    </span>
                                  )}
                                </div>
                              </button>
                            );
                          })}
                          {filteredMoves.length === 0 && (
                            <p className="col-span-2 py-4 text-center text-xs text-slate-500">
                              Ningún movimiento legal coincide con «{moveSearch}».
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
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

          {/* RIGHT 4 COLS: Rival Atmosphere & Fog of War (Spoiler-Free) */}
          <div className="flex flex-col justify-between rounded-3xl border border-rose-400/25 bg-slate-900/75 p-5 lg:col-span-4">
            <div>
              <div className="mb-4 flex items-center gap-3">
                {config.rivalProfile ? (
                  <RivalPortraitTooltip
                    profile={config.rivalProfile}
                    charId={config.rivalCharId}
                    placement="bottom"
                  >
                    <button
                      type="button"
                      className="h-12 w-12 overflow-hidden rounded-xl border-2 border-rose-500/60 bg-slate-950 p-0.5 transition hover:border-amber-300 cursor-help"
                    >
                      <CharacterPortrait
                        charId={config.rivalCharId}
                        variant="bust"
                        className="h-full w-full object-cover object-top"
                      />
                    </button>
                  </RivalPortraitTooltip>
                ) : (
                  <div className="h-12 w-12 overflow-hidden rounded-xl border border-rose-500/45 bg-slate-950 p-0.5">
                    <CharacterPortrait
                      charId={config.rivalCharId}
                      variant="bust"
                      className="h-full w-full object-cover object-top"
                    />
                  </div>
                )}
                <div className="min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-rose-300">
                    Adversario
                  </p>
                  <h3 className="truncate font-display text-lg font-bold text-white">
                    {config.rivalName}
                  </h3>
                  <p className="truncate text-[11px] text-slate-400">
                    {config.rivalTitle}
                  </p>
                </div>
              </div>

              {config.rivalProfile && (
                <p className="mb-3 rounded-xl border border-slate-800 bg-slate-950/75 px-3.5 py-2.5 text-xs leading-relaxed text-slate-300">
                  {config.rivalProfile.bio}
                </p>
              )}

              {/* NPC Personality Directives & Difficulty / Variant Run Selector */}
              <div className="mb-4 space-y-2.5 rounded-2xl border border-violet-400/25 bg-violet-950/20 p-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-violet-200">
                    Estilo: {npcDef.personality.styleName}
                  </span>
                  {npcDef.socialLink?.romanceable && (
                    <span className="rounded bg-fuchsia-500/20 px-1.5 py-0.5 text-[9px] font-bold text-fuchsia-200">
                      Rival Clave
                    </span>
                  )}
                </div>
                <p className="text-[11px] leading-relaxed text-violet-100/80">
                  {npcDef.personality.directiveSummary}
                </p>

                {/* 4-Tier Difficulty Selector (Baby Mode / Normal / Difícil / Tryhard) */}
                <div className="border-t border-white/10 pt-2">
                  <p className="mb-1.5 flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-amber-200">
                    <Flame className="h-3 w-3 text-amber-400" />
                    Dificultad del Rival
                  </p>
                  <div className="grid grid-cols-2 gap-1.5">
                    {DIFFICULTY_ORDER.map((diffId) => {
                      const meta = DIFFICULTY_META[diffId];
                      return (
                        <button
                          key={diffId}
                          type="button"
                          onClick={() => setDifficultyMode(diffId)}
                          className={`rounded-lg border px-2 py-1 text-[10px] font-bold transition cursor-pointer ${
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
                          {meta.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Rank 1 Romance Anti-Diablo Tactical Scouting (El Pelirrojo) */}
                <div className="border-t border-white/10 pt-2">
                  {socialPerks.hasAntiDiabloScouting ? (
                    <div className="space-y-1.5 rounded-xl border border-sky-400/35 bg-sky-950/40 p-2.5">
                      <p className="flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-wider text-sky-200">
                        <ShieldAlert className="h-3 w-3 text-sky-400" />
                        Scouting Anti-Diablo (El Pelirrojo R1 Activo)
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
                        <p className="text-[10.5px] text-sky-200/80">
                          Sin overrides ocultos en esta dificultad. Vigila el patrón de Turno 1.
                        </p>
                      )}
                    </div>
                  ) : (
                    <p className="text-[10px] text-slate-400">
                      ♥ Sube a <strong>El Pelirrojo a Rango 1</strong> para revelar objetos y movimientos sorpresa del modo Tryhard/Diablo.
                    </p>
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

              {/* Fog of War Silhouettes */}
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
                  {parsedRival.slice(0, visibleCount).map((set, i) => (
                    <div
                      key={`visible-rival-${set.species}-${i}`}
                      className="flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-950/90 px-2.5 py-1.5"
                    >
                      <PokemonIcon species={set.species} className="scale-90" />
                      <p className="truncate text-xs font-semibold text-white">
                        {set.species}
                      </p>
                    </div>
                  ))}
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

              {/* Narrative Decision Consequence Summary (Clean, non-spoilery) */}
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
                <AlertTriangle className="h-4 w-4" />
                Ambos equipos deben tener al menos un Pokémon válido.
              </p>
            ) : (
              <div>
                <p className="text-sm font-bold text-white">
                  Escuadrón listo para entrar al campo
                </p>
                <p className="text-xs text-slate-400">
                  {config.formatLabel ?? config.formatId} · {parsedPlayer.length}{' '}
                  Pokémon en posición
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
