import React, { useMemo, useState } from 'react';
import {
  Archive,
  ArrowLeft,
  BookOpen,
  Cloud,
  Coins,
  Crown,
  Flame,
  Gamepad2,
  Heart,
  History,
  Lock,
  MapPin,
  Play,
  Puzzle,
  Save,
  ShieldAlert,
  ShoppingBag,
  Skull,
  Sparkles,
  Trophy,
  Unlock,
  Wand2,
  Wrench,
} from 'lucide-react';
import { CHAPTERS } from '../data/chapters';
import {
  CHAPTER_UNLOCK_RULES,
  CURRENCY_SHORT,
  DIFFICULTY_META,
} from '../data/economyCatalog';
import {
  isRomanceChapterUnlocked,
  ROMANCE_CHAPTERS,
} from '../data/romanceChapters';
import {
  CAMPAIGN_ROUTE_ORDER,
  CHAPTER_MAP_LOCATIONS,
} from '../data/worldGeopolitics';
import { isChapterVisible } from '../engine/campaignProgression';
import { isChapterUnlocked } from '../engine/playerProfile';
import { applyRivalNameToChapter, getRivalName } from '../engine/rivalName';
import type {
  ChapterCategory,
  ChapterDefinition,
  ChapterTeamMode,
  PlayerSaveProfile,
} from '../types/game';
import { HelpTip } from './HelpTip';
import { PokemonSprite } from './PokemonSprite';
import { WorldWarMap } from './WorldWarMap';

interface ChapterSelectProps {
  onBackHome: () => void;
  onOpenSaveLoadModal: () => void;
  onOpenVersus: () => void;
  onOpenShop: () => void;
  onOpenTeamEditor: () => void;
  onOpenArcade: () => void;
  onOpenAccount: () => void;
  onOpenDevMode: () => void;
  onOpenCamp: () => void;
  onSelectChapter: (chapter: ChapterDefinition) => void;
  onUnlockChapterWithCoins: (chapterId: string) => {
    ok: boolean;
    error?: string;
  };
  profile: PlayerSaveProfile;
  recentSocialLinkAlerts?: Array<{
    npcId: string;
    npcName: string;
    regionName: string;
  }>;
  onDismissSocialLinkAlerts?: () => void;
}

const CATEGORY_META: Array<{
  id: ChapterCategory;
  label: string;
  icon: React.FC<{ className?: string }>;
}> = [
  { id: 'story', label: 'Historia', icon: BookOpen },
  { id: 'romance', label: 'Vínculos y Regiones', icon: Heart },
  { id: 'puzzles', label: 'Puzzles', icon: Puzzle },
  { id: 'flashbacks', label: 'Flashbacks', icon: History },
  { id: 'showcases', label: 'Competitivo', icon: Trophy },
  { id: 'challenges', label: 'Desafíos', icon: Flame },
  { id: 'survival', label: 'Supervivencia', icon: ShieldAlert },
  { id: 'archive', label: 'Archivo', icon: Archive },
  { id: 'anime', label: 'Anime', icon: Sparkles },
];

const ALL_SELECTABLE_CHAPTERS: ChapterDefinition[] = [
  ...CHAPTERS,
  ...ROMANCE_CHAPTERS,
];

function parseRomanceChapterMeta(
  chapterId: string
): { npcId: string; rank: 1 | 2 | 3 } | null {
  const m = /^romance-(.+)-r([123])$/.exec(chapterId);
  if (!m) return null;
  return { npcId: m[1], rank: Number(m[2]) as 1 | 2 | 3 };
}

function getAccentStyles(accent: string) {
  switch (accent) {
    case 'orange':
      return {
        card: 'border-orange-500/30 hover:border-orange-400/70',
        badge: 'bg-orange-500/15 text-orange-200 border border-orange-400/35',
        glow: 'bg-orange-500/15',
        btn: 'bg-gradient-to-r from-orange-500 to-amber-500 text-slate-950 hover:brightness-110',
      };
    case 'purple':
      return {
        card: 'border-purple-500/30 hover:border-purple-400/70',
        badge: 'bg-purple-500/15 text-purple-200 border border-purple-400/35',
        glow: 'bg-purple-500/15',
        btn: 'bg-gradient-to-r from-purple-500 to-fuchsia-500 text-white hover:brightness-110',
      };
    case 'rose':
      return {
        card: 'border-rose-500/30 hover:border-rose-400/70',
        badge: 'bg-rose-500/15 text-rose-200 border border-rose-400/35',
        glow: 'bg-rose-500/15',
        btn: 'bg-gradient-to-r from-rose-500 to-pink-500 text-white hover:brightness-110',
      };
    case 'sky':
      return {
        card: 'border-sky-400/35 hover:border-sky-300/75',
        badge: 'bg-sky-500/15 text-sky-200 border border-sky-400/35',
        glow: 'bg-sky-500/15',
        btn: 'bg-gradient-to-r from-sky-400 to-cyan-400 text-slate-950 hover:brightness-110',
      };
    case 'slate':
      return {
        card: 'border-slate-500/35 hover:border-slate-300/70',
        badge: 'bg-slate-400/15 text-slate-100 border border-slate-300/35',
        glow: 'bg-slate-400/15',
        btn: 'bg-gradient-to-r from-slate-200 to-slate-400 text-slate-950 hover:brightness-110',
      };
    case 'indigo':
      return {
        card: 'border-indigo-500/30 hover:border-indigo-400/65',
        badge: 'bg-indigo-500/15 text-indigo-200 border border-indigo-400/35',
        glow: 'bg-indigo-500/15',
        btn: 'bg-gradient-to-r from-indigo-500 to-violet-500 text-white hover:brightness-110',
      };
    default:
      return {
        card: 'border-amber-500/30 hover:border-amber-400/65',
        badge: 'bg-amber-500/15 text-amber-200 border border-amber-400/35',
        glow: 'bg-amber-500/15',
        btn: 'bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 hover:brightness-110',
      };
  }
}

export const ChapterSelect: React.FC<ChapterSelectProps> = ({
  onBackHome,
  onOpenSaveLoadModal,
  onOpenVersus,
  onOpenShop,
  onOpenTeamEditor,
  onOpenArcade,
  onOpenAccount,
  onOpenDevMode,
  onOpenCamp,
  onSelectChapter,
  onUnlockChapterWithCoins,
  profile,
  recentSocialLinkAlerts,
  onDismissSocialLinkAlerts,
}) => {
  const [activeFilter, setActiveFilter] = useState<'all' | ChapterCategory>(
    'all'
  );
  const [teamModeFilter, setTeamModeFilter] = useState<
    'all' | ChapterTeamMode
  >('all');
  const [hoveredChapterId, setHoveredChapterId] = useState<string | null>(null);
  const [focusedCardId, setFocusedCardId] = useState<string | null>(null);
  const [unlockNotice, setUnlockNotice] = useState<string | null>(null);
  // Mobile/Tablet (<1280px) switcher between Misiones & Mapa Mundial so mobile users never scroll endlessly!
  const [mobileHubTab, setMobileHubTab] = useState<'missions' | 'map'>('missions');
  const progress = profile.completedChapters;
  const rivalName = getRivalName(profile);
  const visibleCoreChapters = useMemo(
    () => CHAPTERS.filter((ch) => isChapterVisible(profile, ch.id)),
    [profile]
  );
  const visibleRomanceChapters = useMemo(
    () => ROMANCE_CHAPTERS.filter((ch) => isChapterVisible(profile, ch.id)),
    [profile]
  );
  const localizedAllChapters = useMemo(
    () =>
      [...visibleCoreChapters, ...visibleRomanceChapters].map((ch) =>
        applyRivalNameToChapter(ch, rivalName)
      ),
    [visibleCoreChapters, visibleRomanceChapters, rivalName]
  );
  const hiddenTotalCount =
    ALL_SELECTABLE_CHAPTERS.length -
    (visibleCoreChapters.length + visibleRomanceChapters.length);
  const activeDiffMeta =
    DIFFICULTY_META[profile.defaultDifficulty] ?? DIFFICULTY_META.kaizo;
  const resolveMode = (c: ChapterDefinition): ChapterTeamMode =>
    c.teamMode ?? (c.teamEditPolicy === 'editable' ? 'campaign' : 'locked');
  const campaignCount = visibleCoreChapters.filter(
    (c) => resolveMode(c) === 'campaign'
  ).length;
  const lockedCount = visibleCoreChapters.filter(
    (c) => resolveMode(c) === 'locked'
  ).length;
  const challengeCount = visibleCoreChapters.filter(
    (c) => resolveMode(c) === 'challenge'
  ).length;

  const unlockedChapterIds = useMemo(() => {
    const set = new Set<string>();
    for (const ch of CHAPTERS) {
      if (isChapterUnlocked(profile, ch.id)) set.add(ch.id);
    }
    for (const ch of ROMANCE_CHAPTERS) {
      const parsed = parseRomanceChapterMeta(ch.id);
      if (
        parsed &&
        isRomanceChapterUnlocked(profile, parsed.npcId, parsed.rank)
      ) {
        set.add(ch.id);
      }
    }
    return set;
  }, [profile]);

  const completedChapterIds = useMemo(() => {
    const set = new Set<string>();
    for (const [id, p] of Object.entries(progress)) {
      if (p?.completed) set.add(id);
    }
    for (const [npcId, link] of Object.entries(profile.socialLinks ?? {})) {
      if (link.r1Done || link.rank >= 1) set.add(`romance-${npcId}-r1`);
      if (link.r2Done || link.rank >= 2) set.add(`romance-${npcId}-r2`);
      if (link.r3Done || link.rank >= 3) set.add(`romance-${npcId}-r3`);
    }
    return set;
  }, [progress, profile.socialLinks]);

  // First visible, unlocked & uncompleted chapter along the canonical 4-Act Exile Campaign Route
  const nextObjectiveChapterId = useMemo(() => {
    for (const routeId of CAMPAIGN_ROUTE_ORDER) {
      if (
        isChapterVisible(profile, routeId) &&
        unlockedChapterIds.has(routeId) &&
        !completedChapterIds.has(routeId)
      ) {
        return routeId;
      }
    }
    for (const ch of visibleCoreChapters) {
      if (unlockedChapterIds.has(ch.id) && !completedChapterIds.has(ch.id)) {
        return ch.id;
      }
    }
    return visibleCoreChapters[0]?.id ?? CHAPTERS[0]?.id ?? null;
  }, [profile, unlockedChapterIds, completedChapterIds, visibleCoreChapters]);

  const handleFocusChapterCard = (chapterId: string) => {
    setActiveFilter(chapterId.startsWith('romance-') ? 'romance' : 'all');
    setTeamModeFilter('all');
    setFocusedCardId(chapterId);
    setHoveredChapterId(chapterId);
    window.setTimeout(() => {
      const el = document.getElementById(`chapter-card-${chapterId}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 60);
    window.setTimeout(() => {
      setFocusedCardId((curr) => (curr === chapterId ? null : curr));
    }, 2400);
  };

  const visibleSections = useMemo(() => {
    return CATEGORY_META.filter((sec) => {
      if (activeFilter === 'all') {
        // Keep the default Campaign overview clean (16 core chapters); click "Vínculos y Regiones" to browse all 39 regional romance chapters!
        return sec.id !== 'romance';
      }
      return sec.id === activeFilter;
    })
      .map((sec) => ({
        ...sec,
        chapters: (
          sec.id === 'romance' ? visibleRomanceChapters : visibleCoreChapters
        )
          .filter(
            (ch) =>
              ch.category === sec.id &&
              (teamModeFilter === 'all' || resolveMode(ch) === teamModeFilter)
          )
          .map((ch) => applyRivalNameToChapter(ch, rivalName)),
      }))
      .filter((sec) => sec.chapters.length > 0);
  }, [
    activeFilter,
    teamModeFilter,
    rivalName,
    visibleCoreChapters,
    visibleRomanceChapters,
  ]);

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[#060a14] text-slate-100">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-32 right-1/4 h-96 w-[36rem] rounded-full bg-amber-500/10 blur-[120px]" />
        <div className="absolute bottom-0 left-1/4 h-96 w-[36rem] rounded-full bg-sky-600/10 blur-[120px]" />
      </div>

      <div className="relative z-10 mx-auto max-w-[1440px] px-3 py-4 sm:px-6 sm:py-5">
        {/* Compact Responsive Header */}
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2.5 border-b border-slate-800/80 pb-3.5">
          <div className="flex min-w-0 items-center gap-2.5">
            <button
              onClick={onBackHome}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-slate-700/80 bg-slate-900/80 px-2.5 py-2 text-xs font-semibold text-slate-300 transition hover:border-amber-400/50 hover:text-white cursor-pointer"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Inicio</span>
            </button>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-1.5">
                <h1 className="truncate font-display text-lg font-bold text-white sm:text-2xl">
                  Capítulos
                </h1>
                <span
                  className={`rounded-md border px-1.5 py-0.2 text-[9.5px] font-extrabold ${activeDiffMeta.badgeClass}`}
                >
                  {activeDiffMeta.shortLabel}
                </span>
                {profile.ironmanMode && (
                  <span className="inline-flex items-center gap-0.5 rounded-md border border-amber-400/50 bg-amber-500/20 px-1.5 py-0.2 text-[9.5px] font-extrabold text-amber-200">
                    <ShieldAlert className="h-2.5 w-2.5" />
                    Ironman
                  </span>
                )}
                {profile.nuzlockePermadeath && (
                  <span className="inline-flex items-center gap-0.5 rounded-md border border-rose-400/50 bg-rose-500/20 px-1.5 py-0.2 text-[9.5px] font-extrabold text-rose-200">
                    <Skull className="h-2.5 w-2.5" />
                    Nuzlocke
                  </span>
                )}
                {profile.masteryBadgeUnlocked && (
                  <span className="inline-flex items-center gap-0.5 rounded-md border border-amber-300/70 bg-amber-500/25 px-1.5 py-0.2 text-[9.5px] font-extrabold text-amber-100">
                    <Trophy className="h-2.5 w-2.5 text-amber-300" />
                    Mastery
                  </span>
                )}
                {profile.devModeEnabled ? (
                  <span className="rounded-md border border-fuchsia-400/50 bg-fuchsia-500/20 px-1.5 py-0.2 text-[9.5px] font-extrabold text-fuchsia-200">
                    🧪 Dev
                  </span>
                ) : hiddenTotalCount > 0 ? (
                  <span className="inline-flex items-center gap-1 rounded-md border border-slate-700 bg-slate-900 px-1.5 py-0.2 text-[9.5px] font-bold text-slate-400">
                    🗺️ {hiddenTotalCount} ocultos
                    <HelpTip title="Capítulos Ocultos" size="xs">
                      <p>
                        Los Actos futuros, el Postgame y los Vínculos regionales se revelan automáticamente conforme la historia te lleva a cada región (o al activar Dev Mode).
                      </p>
                    </HelpTip>
                  </span>
                ) : null}
              </div>
              <p className="truncate font-mono-code text-[10px] text-slate-400">
                {profile.runName || 'Exilio de Wyndon'} · Slot #{profile.activeSaveSlot ?? 1}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <button
              onClick={onOpenShop}
              className="inline-flex items-center gap-1.5 rounded-xl border border-amber-400/45 bg-amber-500/15 px-2.5 py-1.5 text-xs font-extrabold text-amber-200 hover:bg-amber-500/25 cursor-pointer"
            >
              <ShoppingBag className="h-3.5 w-3.5 text-amber-300" />
              <span className="font-mono-code">
                {profile.coins.toLocaleString()} {CURRENCY_SHORT}
              </span>
            </button>
            <button
              onClick={onOpenTeamEditor}
              className="inline-flex items-center gap-1 rounded-xl border border-slate-700 bg-slate-900 px-2.5 py-1.5 text-xs font-bold text-slate-200 hover:border-sky-400/50 cursor-pointer"
            >
              <Wrench className="h-3.5 w-3.5 text-sky-300" />
              <span>PC</span>
            </button>
            <button
              onClick={onOpenCamp}
              className="inline-flex items-center gap-1 rounded-xl border border-fuchsia-400/50 bg-fuchsia-500/15 px-2.5 py-1.5 text-xs font-extrabold text-fuchsia-200 hover:bg-fuchsia-500/25 cursor-pointer"
            >
              <Heart className="h-3.5 w-3.5 fill-fuchsia-400/60 text-fuchsia-300" />
              <span>Vínculos</span>
            </button>
            <button
              onClick={onOpenSaveLoadModal}
              title="Guardar / Cargar Partida"
              className="inline-flex items-center gap-1 rounded-xl border border-amber-400/45 bg-amber-500/15 px-2.5 py-1.5 text-xs font-bold text-amber-100 hover:bg-amber-500/25 cursor-pointer"
            >
              <Save className="h-3.5 w-3.5 text-amber-300" />
              <span className="hidden sm:inline">Guardar</span>
            </button>
            <button
              onClick={onOpenArcade}
              className="inline-flex items-center gap-1 rounded-xl border border-emerald-400/35 bg-emerald-500/10 px-2.5 py-1.5 text-xs font-bold text-emerald-200 hover:bg-emerald-500/20 cursor-pointer"
            >
              <Gamepad2 className="h-3.5 w-3.5" />
              <span className="hidden md:inline">Arcade</span>
            </button>
            <button
              onClick={onOpenVersus}
              className="inline-flex items-center gap-1 rounded-xl border border-rose-400/45 bg-rose-500/15 px-2.5 py-1.5 text-xs font-bold text-rose-200 transition hover:bg-rose-500/25 cursor-pointer"
            >
              <Wand2 className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Versus</span>
            </button>
            <button
              onClick={onOpenAccount}
              title="Cuenta Nube"
              className="inline-flex items-center gap-1 rounded-xl border border-slate-700 bg-slate-900 px-2 py-1.5 text-xs font-bold text-slate-200 hover:border-emerald-400/50 cursor-pointer"
            >
              <Cloud className="h-3.5 w-3.5 text-emerald-400" />
              <span className="hidden lg:inline">Cuenta</span>
            </button>
            <button
              onClick={onOpenDevMode}
              title="Dev Mode"
              className={`inline-flex items-center gap-1 rounded-xl border px-2 py-1.5 text-xs font-bold cursor-pointer ${
                profile.devModeEnabled
                  ? 'border-fuchsia-400/60 bg-fuchsia-500/20 text-fuchsia-200'
                  : 'border-slate-700 bg-slate-900 text-slate-300 hover:border-fuchsia-400/45'
              }`}
            >
              <Wrench className="h-3.5 w-3.5 text-fuchsia-300" />
              <span>Dev</span>
            </button>
          </div>
        </div>

        {recentSocialLinkAlerts && recentSocialLinkAlerts.length > 0 && (
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-fuchsia-400/45 bg-gradient-to-r from-fuchsia-950/60 via-slate-950/90 to-amber-950/40 px-4 py-2.5 text-xs text-fuchsia-100">
            <div className="flex flex-wrap items-center gap-2">
              <Heart className="h-4 w-4 shrink-0 fill-fuchsia-400 text-fuchsia-400" />
              <span>
                {recentSocialLinkAlerts
                  .map(
                    (a) =>
                      `Nuevo Vínculo disponible en ${a.regionName}: ${a.npcName}`
                  )
                  .join(' · ')}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => {
                  onDismissSocialLinkAlerts?.();
                  onOpenCamp();
                }}
                className="rounded-lg border border-fuchsia-400/55 bg-fuchsia-500/25 px-2.5 py-1 text-[10.5px] font-extrabold text-white hover:bg-fuchsia-500/35 cursor-pointer"
              >
                Abrir Vínculos
              </button>
              {onDismissSocialLinkAlerts && (
                <button
                  type="button"
                  onClick={onDismissSocialLinkAlerts}
                  className="rounded-lg border border-slate-700 bg-slate-900 px-2 py-1 text-[10px] text-slate-400 hover:text-white cursor-pointer"
                >
                  Ocultar
                </button>
              )}
            </div>
          </div>
        )}

        {unlockNotice && (
          <div className="mb-4 rounded-2xl border border-amber-400/40 bg-amber-500/15 px-4 py-2.5 text-xs font-semibold text-amber-100">
            {unlockNotice}
          </div>
        )}

        {/* Mobile/Tablet (<1280px) Tab Switcher: Capítulos vs Atlas Mundial */}
        <div className="mb-4 grid grid-cols-2 gap-1.5 rounded-2xl border border-slate-800 bg-slate-900/90 p-1 xl:hidden">
          <button
            type="button"
            onClick={() => setMobileHubTab('missions')}
            className={`rounded-xl px-3 py-2 text-xs font-extrabold transition cursor-pointer ${
              mobileHubTab === 'missions'
                ? 'bg-amber-500/25 text-amber-100 ring-1 ring-amber-400/50'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            📋 Misiones ({visibleCoreChapters.length})
          </button>
          <button
            type="button"
            onClick={() => setMobileHubTab('map')}
            className={`rounded-xl px-3 py-2 text-xs font-extrabold transition cursor-pointer ${
              mobileHubTab === 'map'
                ? 'bg-sky-500/25 text-sky-100 ring-1 ring-sky-400/50'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            🗺️ Atlas Mundial
          </button>
        </div>

        {/* Split War Room Layout: Sticky Civilization World Map (Left) + Scrollable Mission Grid (Right) */}
        <div className="grid gap-6 xl:grid-cols-12 xl:items-start">
          {/* Sticky Interactive Civilization Map */}
          <div className={`${mobileHubTab === 'missions' ? 'hidden xl:block' : ''} xl:sticky xl:top-4 xl:col-span-6`}>
            <WorldWarMap
              chapters={localizedAllChapters}
              hoveredChapterId={hoveredChapterId}
              nextObjectiveChapterId={nextObjectiveChapterId}
              onHoverChapterPin={setHoveredChapterId}
              onFocusChapterCard={(id) => {
                setMobileHubTab('missions');
                handleFocusChapterCard(id);
              }}
              onLaunchChapter={onSelectChapter}
              unlockedChapterIds={unlockedChapterIds}
              completedChapterIds={completedChapterIds}
            />
          </div>

          {/* Right Column: Category Filter Pills + Mission Cards */}
          <div className={`${mobileHubTab === 'map' ? 'hidden xl:block' : ''} xl:col-span-6`}>
            {/* Category Filter Pills */}
            <div className="mb-6 flex flex-wrap gap-2">
              <button
                onClick={() => setActiveFilter('all')}
                className={`rounded-xl border px-3 py-1.5 text-xs font-bold transition cursor-pointer ${
                  activeFilter === 'all'
                    ? 'border-amber-400 bg-amber-500/20 text-amber-200'
                    : 'border-slate-800 bg-slate-900/70 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                }`}
              >
                Campaña Base ({visibleCoreChapters.length})
              </button>
              {CATEGORY_META.map((cat) => {
                const Icon = cat.icon;
                const count =
                  cat.id === 'romance'
                    ? visibleRomanceChapters.length
                    : visibleCoreChapters.filter((c) => c.category === cat.id).length;
                if (count === 0 && cat.id !== 'romance') return null;
                const isRomTab = cat.id === 'romance';
                return (
                  <button
                    key={cat.id}
                    onClick={() => setActiveFilter(cat.id)}
                    className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-bold transition cursor-pointer ${
                      activeFilter === cat.id
                        ? isRomTab
                          ? 'border-fuchsia-400 bg-fuchsia-500/25 text-fuchsia-100'
                          : 'border-amber-400 bg-amber-500/20 text-amber-200'
                        : isRomTab
                          ? 'border-fuchsia-500/35 bg-fuchsia-950/35 text-fuchsia-200 hover:border-fuchsia-400/65'
                          : 'border-slate-800 bg-slate-900/70 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {cat.label} ({count})
                  </button>
                );
              })}
            </div>

            {/* 3-Mode Loadout Filter Bar */}
            <div className="mb-4 flex flex-wrap items-center gap-1.5 rounded-2xl border border-slate-800/90 bg-slate-900/65 px-2.5 py-2">
              <HelpTip title="Modos de Equipo" size="xs">
                <p>
                  <strong>⚔️ Campaña NatDex:</strong> usa tus Cajas PC (Megas + Z + Tera) con Cap BST y reglas Ironman/Nuzlocke.
                </p>
                <p>
                  <strong>🔒 Guion / Puzzle:</strong> escuadrón fijo aislado (sin permadeath ni desgaste).
                </p>
                <p>
                  <strong>🏆 Reto Especial:</strong> formato propio (VGC, 1v1, Monotype, Triples, Gen 1) aislado de tus Cajas PC.
                </p>
              </HelpTip>
              {(
                [
                  { id: 'all', label: `Todos (${visibleCoreChapters.length})` },
                  {
                    id: 'campaign',
                    label: `⚔️ Campaña (${campaignCount})`,
                  },
                  {
                    id: 'locked',
                    label: `🔒 Fijo (${lockedCount})`,
                  },
                  {
                    id: 'challenge',
                    label: `🏆 Reto (${challengeCount})`,
                  },
                ] as const
              ).map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setTeamModeFilter(opt.id)}
                  className={`rounded-lg border px-2.5 py-1 text-[11px] font-bold transition cursor-pointer ${
                    teamModeFilter === opt.id
                      ? opt.id === 'campaign'
                        ? 'border-sky-400 bg-sky-500/20 text-sky-100'
                        : opt.id === 'locked'
                          ? 'border-amber-400 bg-amber-500/20 text-amber-100'
                          : opt.id === 'challenge'
                            ? 'border-violet-400 bg-violet-500/20 text-violet-100'
                            : 'border-white/40 bg-white/10 text-white'
                      : 'border-slate-800 bg-slate-950/70 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            {/* Clean 4-Element Spoiler-Free Chapter Grid */}
            <div className="space-y-8">
              {visibleSections.map((section) => {
                const Icon = section.icon;
                return (
                  <section key={section.id}>
                    <div className="mb-3.5 flex items-center gap-2.5 border-b border-slate-800/70 pb-2">
                      <div className="flex h-7 w-7 items-center justify-center rounded-lg border border-amber-400/30 bg-amber-500/10 text-amber-300">
                        <Icon className="h-3.5 w-3.5" />
                      </div>
                      <h2 className="font-display text-lg font-bold text-white">
                        {section.label}
                      </h2>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
                      {section.chapters.map((chapter) => {
                        const prog = progress[chapter.id];
                        const unlocked = unlockedChapterIds.has(chapter.id);
                        const unlockRule = CHAPTER_UNLOCK_RULES[chapter.id];
                        const accent = getAccentStyles(chapter.accentColor);
                        const isBossSpotlight =
                          chapter.showcaseSprite.mode === 'boss';
                        const mapLoc = CHAPTER_MAP_LOCATIONS[chapter.id];
                        const isMapHighlighted =
                          hoveredChapterId === chapter.id ||
                          focusedCardId === chapter.id;

                        return (
                          <div
                            id={`chapter-card-${chapter.id}`}
                            key={chapter.id}
                            onMouseEnter={() => setHoveredChapterId(chapter.id)}
                            onMouseLeave={() =>
                              setHoveredChapterId((prev) =>
                                prev === chapter.id ? null : prev
                              )
                            }
                            onFocus={() => setHoveredChapterId(chapter.id)}
                            className={`group relative flex flex-col justify-between overflow-hidden rounded-3xl border bg-slate-900/75 p-5 backdrop-blur transition-all duration-200 ${
                              isMapHighlighted
                                ? 'border-amber-400 ring-2 ring-amber-400/35 -translate-y-0.5 shadow-lg shadow-amber-500/10'
                                : unlocked
                                  ? `hover:-translate-y-0.5 ${accent.card}`
                                  : 'border-slate-800/90 opacity-85 hover:border-amber-400/40'
                            }`}
                          >
                            {/* Top Row: Clean Header + Single Large Spotlight Sprite */}
                            <div className="flex items-start justify-between gap-4">
                              <div className="min-w-0 flex-1">
                                {/* 1. Clean Header: Chapter Label + 1 Format Badge + Active Objective Pill */}
                                <div className="mb-2 flex flex-wrap items-center gap-1.5">
                                  <span
                                    className={`rounded-lg px-2 py-0.5 text-[10px] font-bold tracking-wider ${accent.badge}`}
                                  >
                                    {chapter.number}
                                  </span>
                                  <span className="rounded-lg border border-slate-700/90 bg-slate-950/90 px-2 py-0.5 text-[10px] font-semibold text-slate-300">
                                    {chapter.formatLabel}
                                  </span>
                                  {(() => {
                                    const mode = resolveMode(chapter);
                                    if (mode === 'campaign') {
                                      return (
                                        <span
                                          title="Campaña NatDex (Megas + Z + Tera): usa tus Cajas PC con Cap BST y reglas Ironman/Nuzlocke."
                                          className="rounded-lg border border-sky-400/45 bg-sky-500/15 px-2 py-0.5 text-[9.5px] font-extrabold text-sky-200"
                                        >
                                          ⚔️ Campaña · PC
                                        </span>
                                      );
                                    }
                                    if (mode === 'challenge') {
                                      return (
                                        <span
                                          title="Reto Especial con formato propio (VGC/1v1/Monotype/Triples/Gen1). Aislado: no daña tus Cajas PC ni tu Nuzlocke."
                                          className="rounded-lg border border-violet-400/45 bg-violet-500/15 px-2 py-0.5 text-[9.5px] font-extrabold text-violet-200"
                                        >
                                          🏆 Reto Especial
                                        </span>
                                      );
                                    }
                                    return (
                                      <span
                                        title="Guion / Puzzle con equipo fijo predefinido. Aislado: no aplica permadeath ni desgaste a tus Cajas PC."
                                        className="rounded-lg border border-amber-400/35 bg-amber-500/10 px-2 py-0.5 text-[9.5px] font-extrabold text-amber-200"
                                      >
                                        🔒 Guion / Puzzle
                                      </span>
                                    );
                                  })()}
                                  {nextObjectiveChapterId === chapter.id && (
                                    <span className="rounded-lg border border-amber-400/60 bg-amber-500/20 px-2 py-0.5 text-[9.5px] font-extrabold uppercase tracking-wider text-amber-200">
                                      Objetivo Actual
                                    </span>
                                  )}
                                </div>

                                <h3 className="font-display text-lg font-bold leading-snug text-white">
                                  {chapter.title}
                                </h3>

                                {mapLoc && (
                                  <p className="mt-1 inline-flex items-center gap-1 text-[10px] font-semibold text-amber-300/85">
                                    <MapPin className="h-3 w-3 shrink-0 text-amber-400" />
                                    <span className="truncate">
                                      {mapLoc.regionLabel}
                                    </span>
                                  </p>
                                )}

                                {/* 2. Atmospheric 2-line synopsis (Zero Spoilers) */}
                                <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-slate-300">
                                  {chapter.description}
                                </p>

                                {unlockRule?.rewardPokemon && (
                                  <div className="mt-2 inline-flex items-center gap-1.5 rounded-lg border border-emerald-400/35 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-200">
                                    <Sparkles className="h-3 w-3 shrink-0 text-emerald-300" />
                                    <span>
                                      {prog?.completed
                                        ? `✓ Desbloqueado: ${unlockRule.rewardPokemon.species}`
                                        : `+ Desbloquea para tu Run: ${unlockRule.rewardPokemon.species}`}
                                    </span>
                                  </div>
                                )}
                              </div>

                              {/* 3. Single Large Spotlight Sprite (Player Ace OR Boss) */}
                              <div className="relative flex h-24 w-24 shrink-0 flex-col items-center justify-center rounded-2xl border border-slate-800/90 bg-slate-950/80">
                                <div
                                  className={`pointer-events-none absolute inset-2 rounded-full blur-xl ${
                                    isBossSpotlight
                                      ? 'bg-rose-500/25'
                                      : accent.glow
                                  }`}
                                />
                                <div
                                  className={
                                    unlocked ? '' : 'opacity-40 grayscale'
                                  }
                                >
                                  <PokemonSprite
                                    species={chapter.showcaseSprite.species}
                                    side="p2"
                                    className="relative z-10 h-20 w-20 animate-float-slow"
                                  />
                                </div>
                                {isBossSpotlight && (
                                  <span className="absolute -bottom-1.5 z-20 rounded-md border border-rose-400/50 bg-rose-950 px-1.5 py-0.2 text-[9px] font-extrabold uppercase tracking-wider text-rose-200">
                                    Jefe
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* 4. Compact Progress Footer + Action */}
                            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-800/80 pt-3.5">
                              <div className="flex flex-wrap items-center gap-2 text-[11px]">
                                {prog?.completed ? (
                                  <span className="inline-flex items-center gap-1 rounded-lg border border-amber-400/35 bg-amber-500/15 px-2 py-0.5 font-bold text-amber-200">
                                    <Crown className="h-3 w-3 text-amber-400" />
                                    Superado
                                    {prog.bestTurns
                                      ? ` · ${prog.bestTurns}t`
                                      : ''}
                                    {prog.attempts
                                      ? ` · ${prog.attempts} ${
                                          prog.attempts === 1 ? 'int.' : 'ints.'
                                        }`
                                      : ''}
                                  </span>
                                ) : prog?.attempts && prog.attempts > 0 ? (
                                  <span className="rounded-lg border border-slate-700 bg-slate-950 px-2 py-0.5 font-semibold text-slate-300">
                                    {prog.attempts}{' '}
                                    {prog.attempts === 1 ? 'intento' : 'intentos'}
                                  </span>
                                ) : !unlocked ? (
                                  <span className="inline-flex items-center gap-1 text-slate-400">
                                    <Lock className="h-3 w-3 text-rose-400" />
                                    {unlockRule?.requirementLabel ??
                                      (chapter.id.endsWith('-r2')
                                        ? 'Completa primero su Cap. 1 (Duelo R1)'
                                        : chapter.id.endsWith('-r3')
                                          ? 'Completa primero su Cap. 2 (Amigos Tag 2v2)'
                                          : 'Bloqueado')}
                                  </span>
                                ) : (
                                  <span className="text-slate-500">
                                    Sin completar
                                  </span>
                                )}

                                {unlocked && unlockRule && !prog?.completed && (
                                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-300/85">
                                    <Coins className="h-3 w-3 text-amber-400" />+
                                    {unlockRule.firstClearReward.toLocaleString()}{' '}
                                    {CURRENCY_SHORT}
                                    {unlockRule.rewardItem
                                      ? ` · ${unlockRule.rewardItem}`
                                      : ''}
                                  </span>
                                )}
                              </div>

                              {unlocked ? (
                                <button
                                  onClick={() => onSelectChapter(chapter)}
                                  className={`inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-extrabold transition active:scale-[0.98] cursor-pointer ${accent.btn}`}
                                >
                                  <Play className="h-3.5 w-3.5 fill-current" />
                                  Jugar
                                </button>
                              ) : unlockRule && unlockRule.unlockCostCoins > 0 ? (
                                <button
                                  type="button"
                                  disabled={
                                    profile.coins < unlockRule.unlockCostCoins
                                  }
                                  onClick={() => {
                                    const res = onUnlockChapterWithCoins(
                                      chapter.id
                                    );
                                    setUnlockNotice(
                                      res.ok
                                        ? `🔓 ¡Desbloqueaste "${chapter.title}" por ${unlockRule.unlockCostCoins.toLocaleString()} ${CURRENCY_SHORT}!`
                                        : res.error ||
                                            'No tienes suficientes PokéCoronas.'
                                    );
                                  }}
                                  className="inline-flex items-center gap-1.5 rounded-xl border border-amber-400/50 bg-amber-500/20 px-3 py-1.5 text-xs font-extrabold text-amber-200 transition hover:bg-amber-500/30 disabled:cursor-not-allowed disabled:opacity-40 cursor-pointer"
                                >
                                  <Unlock className="h-3.5 w-3.5" />
                                  {unlockRule.unlockCostCoins.toLocaleString()}{' '}
                                  {CURRENCY_SHORT}
                                </button>
                              ) : null}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </section>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
