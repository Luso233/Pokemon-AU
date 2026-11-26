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
  ShieldAlert,
  ShoppingBag,
  Sparkles,
  Trophy,
  Unlock,
  Wand2,
  Wrench,
} from 'lucide-react';
import { CHAPTERS } from '../data/chapters';
import { CHAPTER_UNLOCK_RULES, CURRENCY_SHORT } from '../data/economyCatalog';
import {
  CAMPAIGN_ROUTE_ORDER,
  CHAPTER_MAP_LOCATIONS,
} from '../data/worldGeopolitics';
import { isChapterUnlocked } from '../engine/playerProfile';
import type {
  ChapterCategory,
  ChapterDefinition,
  PlayerSaveProfile,
} from '../types/game';
import { PokemonSprite } from './PokemonSprite';
import { WorldWarMap } from './WorldWarMap';

interface ChapterSelectProps {
  onBackHome: () => void;
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
}

const CATEGORY_META: Array<{
  id: ChapterCategory;
  label: string;
  icon: React.FC<{ className?: string }>;
}> = [
  { id: 'story', label: 'Historia', icon: BookOpen },
  { id: 'puzzles', label: 'Puzzles', icon: Puzzle },
  { id: 'flashbacks', label: 'Flashbacks', icon: History },
  { id: 'showcases', label: 'Competitivo', icon: Trophy },
  { id: 'challenges', label: 'Desafíos', icon: Flame },
  { id: 'survival', label: 'Supervivencia', icon: ShieldAlert },
  { id: 'archive', label: 'Archivo', icon: Archive },
  { id: 'anime', label: 'Anime', icon: Sparkles },
];

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
}) => {
  const [activeFilter, setActiveFilter] = useState<'all' | ChapterCategory>(
    'all'
  );
  const [hoveredChapterId, setHoveredChapterId] = useState<string | null>(null);
  const [focusedCardId, setFocusedCardId] = useState<string | null>(null);
  const [unlockNotice, setUnlockNotice] = useState<string | null>(null);
  const progress = profile.completedChapters;

  const unlockedChapterIds = useMemo(() => {
    const set = new Set<string>();
    for (const ch of CHAPTERS) {
      if (isChapterUnlocked(profile, ch.id)) set.add(ch.id);
    }
    return set;
  }, [profile]);

  const completedChapterIds = useMemo(() => {
    const set = new Set<string>();
    for (const [id, p] of Object.entries(progress)) {
      if (p?.completed) set.add(id);
    }
    return set;
  }, [progress]);

  // First unlocked & uncompleted chapter along the canonical Exile Campaign Route
  const nextObjectiveChapterId = useMemo(() => {
    for (const routeId of CAMPAIGN_ROUTE_ORDER) {
      if (unlockedChapterIds.has(routeId) && !completedChapterIds.has(routeId)) {
        return routeId;
      }
    }
    for (const ch of CHAPTERS) {
      if (unlockedChapterIds.has(ch.id) && !completedChapterIds.has(ch.id)) {
        return ch.id;
      }
    }
    return CHAPTERS[0]?.id ?? null;
  }, [unlockedChapterIds, completedChapterIds]);

  const handleFocusChapterCard = (chapterId: string) => {
    setActiveFilter('all');
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
    return CATEGORY_META.filter(
      (sec) => activeFilter === 'all' || sec.id === activeFilter
    ).map((sec) => ({
      ...sec,
      chapters: CHAPTERS.filter((ch) => ch.category === sec.id),
    }));
  }, [activeFilter]);

  return (
    <div className="relative min-h-screen bg-[#060a14] text-slate-100">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-32 right-1/4 h-96 w-[36rem] rounded-full bg-amber-500/10 blur-[120px]" />
        <div className="absolute bottom-0 left-1/4 h-96 w-[36rem] rounded-full bg-sky-600/10 blur-[120px]" />
      </div>

      <div className="relative z-10 mx-auto max-w-[1440px] px-5 py-5 sm:px-6">
        {/* Header */}
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 pb-3.5">
          <div className="flex items-center gap-4">
            <button
              onClick={onBackHome}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-700/80 bg-slate-900/80 px-3.5 py-2 text-xs font-semibold text-slate-300 transition hover:border-amber-400/50 hover:text-white cursor-pointer"
            >
              <ArrowLeft className="h-4 w-4" />
              Inicio
            </button>
            <div>
              <div className="flex items-center gap-2 text-amber-300">
                <Crown className="h-4 w-4" />
                <span className="text-xs font-bold uppercase tracking-[0.2em]">
                  Crown of Galar
                </span>
              </div>
              <h1 className="font-display text-2xl font-bold text-white sm:text-3xl">
                Selector de Capítulos
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
            <button
              onClick={onOpenDevMode}
              className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-bold cursor-pointer ${
                profile.devModeEnabled
                  ? 'border-fuchsia-400/60 bg-fuchsia-500/20 text-fuchsia-200'
                  : 'border-slate-700 bg-slate-900 text-slate-300 hover:border-fuchsia-400/45'
              }`}
            >
              <Wrench className="h-3.5 w-3.5 text-fuchsia-300" />
              Dev
            </button>
            <button
              onClick={onOpenCamp}
              className="inline-flex items-center gap-1.5 rounded-xl border border-fuchsia-400/50 bg-fuchsia-500/15 px-3 py-2 text-xs font-extrabold text-fuchsia-200 hover:bg-fuchsia-500/25 cursor-pointer"
            >
              <Heart className="h-3.5 w-3.5 fill-fuchsia-400/60 text-fuchsia-300" />
              Vínculos
            </button>
            <button
              onClick={onOpenShop}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs font-bold text-slate-200 hover:border-amber-400/50 cursor-pointer"
            >
              <ShoppingBag className="h-3.5 w-3.5 text-amber-300" />
              Tienda
            </button>
            <button
              onClick={onOpenTeamEditor}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs font-bold text-slate-200 hover:border-sky-400/50 cursor-pointer"
            >
              <Wrench className="h-3.5 w-3.5 text-sky-300" />
              Cajas PC
            </button>
            <button
              onClick={onOpenArcade}
              className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-400/35 bg-emerald-500/10 px-3 py-2 text-xs font-bold text-emerald-200 hover:bg-emerald-500/20 cursor-pointer"
            >
              <Gamepad2 className="h-3.5 w-3.5" />
              Arcade
            </button>
            <button
              onClick={onOpenAccount}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs font-bold text-slate-200 hover:border-emerald-400/50 cursor-pointer"
            >
              <Cloud className="h-3.5 w-3.5 text-emerald-400" />
              Cuenta
            </button>
            <button
              onClick={onOpenVersus}
              className="inline-flex items-center gap-1.5 rounded-xl border border-rose-400/45 bg-rose-500/15 px-3 py-2 text-xs font-bold text-rose-200 transition hover:bg-rose-500/25 cursor-pointer"
            >
              <Wand2 className="h-3.5 w-3.5" />
              Versus
            </button>
          </div>
        </div>

        {unlockNotice && (
          <div className="mb-4 rounded-2xl border border-amber-400/40 bg-amber-500/15 px-4 py-2.5 text-xs font-semibold text-amber-100">
            {unlockNotice}
          </div>
        )}

        {/* Split War Room Layout: Sticky Civilization World Map (Left) + Scrollable Mission Grid (Right) */}
        <div className="grid gap-6 xl:grid-cols-12 xl:items-start">
          {/* Sticky Interactive Civilization Map */}
          <div className="xl:sticky xl:top-4 xl:col-span-6">
            <WorldWarMap
              chapters={CHAPTERS}
              hoveredChapterId={hoveredChapterId}
              nextObjectiveChapterId={nextObjectiveChapterId}
              onHoverChapterPin={setHoveredChapterId}
              onFocusChapterCard={handleFocusChapterCard}
              onLaunchChapter={onSelectChapter}
              unlockedChapterIds={unlockedChapterIds}
              completedChapterIds={completedChapterIds}
            />
          </div>

          {/* Right Column: Category Filter Pills + Mission Cards */}
          <div className="xl:col-span-6">
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
                Todos ({CHAPTERS.length})
              </button>
              {CATEGORY_META.map((cat) => {
                const Icon = cat.icon;
                const count = CHAPTERS.filter((c) => c.category === cat.id).length;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setActiveFilter(cat.id)}
                    className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-bold transition cursor-pointer ${
                      activeFilter === cat.id
                        ? 'border-amber-400 bg-amber-500/20 text-amber-200'
                        : 'border-slate-800 bg-slate-900/70 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {cat.label} ({count})
                  </button>
                );
              })}
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
                                    {unlockRule?.requirementLabel ?? 'Bloqueado'}
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
