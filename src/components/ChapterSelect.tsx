import React, { useMemo, useState } from 'react';
import {
  Archive,
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  ClipboardList,
  Crown,
  Flame,
  GitBranch,
  History,
  Play,
  Puzzle,
  ShieldAlert,
  Sparkles,
  Swords,
  Trophy,
  Users,
  Wand2,
} from 'lucide-react';
import { CHAPTERS } from '../data/chapters';
import { getTypeBadgeClass } from '../engine/pokemonVisuals';
import type {
  ChapterCategory,
  ChapterDefinition,
  ChapterProgress,
} from '../types/game';
import { PokemonIcon, PokemonSprite } from './PokemonSprite';

interface ChapterSelectProps {
  onBackHome: () => void;
  onOpenVersus: () => void;
  onSelectChapter: (chapter: ChapterDefinition) => void;
  progress: Record<string, ChapterProgress>;
}

const CATEGORY_META: Array<{
  id: ChapterCategory;
  label: string;
  subtitle: string;
  icon: React.FC<{ className?: string }>;
}> = [
  {
    id: 'story',
    label: 'Historia',
    subtitle: 'Campaña narrativa principal y decretos de la Corona',
    icon: BookOpen,
  },
  {
    id: 'puzzles',
    label: 'Puzzles',
    subtitle: 'Acertijos tácticos con condiciones iniciales forzadas',
    icon: Puzzle,
  },
  {
    id: 'flashbacks',
    label: 'Flashbacks',
    subtitle: 'Recuerdos del Príncipe y formatos con reglas narrativas',
    icon: History,
  },
  {
    id: 'showcases',
    label: 'Showcases Competitivos',
    subtitle: 'Formatos oficiales de Showdown (1v1, VGC Reg G, Triples Gen 6)',
    icon: Trophy,
  },
  {
    id: 'challenges',
    label: 'Desafíos',
    subtitle: 'Asimetría extrema (1 vs 6 Dobles · 1 vs 3 Triples)',
    icon: Flame,
  },
  {
    id: 'survival',
    label: 'Supervivencia',
    subtitle: 'Combates Back-to-Back sin curación con persistencia HP/PP/Estados',
    icon: ShieldAlert,
  },
  {
    id: 'archive',
    label: 'Archivo Histórico',
    subtitle: 'Simulaciones retro nativas (Era Antigua Gen 1 OU vs Ubers)',
    icon: Archive,
  },
  {
    id: 'anime',
    label: 'Archivo Anime',
    subtitle: 'Combates legendarios del anime con mecánicas especiales de Turno 0',
    icon: Sparkles,
  },
];

const TYPE_ES: Record<string, string> = {
  Steel: 'Acero',
  Dark: 'Siniestro',
  Fairy: 'Hada',
  Fire: 'Fuego',
};

function getAccentStyles(accent: string) {
  switch (accent) {
    case 'orange':
      return {
        card: 'border-orange-500/35 hover:border-orange-400/70 hover:shadow-xl hover:shadow-orange-500/10',
        badge: 'bg-orange-500/20 text-orange-200 border border-orange-400/35',
        btn: 'bg-gradient-to-r from-orange-500 to-amber-500 text-slate-950 shadow-lg shadow-orange-500/20 hover:brightness-110',
      };
    case 'purple':
      return {
        card: 'border-purple-500/35 hover:border-purple-400/70 hover:shadow-xl hover:shadow-purple-500/10',
        badge: 'bg-purple-500/20 text-purple-200 border border-purple-400/35',
        btn: 'bg-gradient-to-r from-purple-500 to-fuchsia-500 text-white shadow-lg shadow-purple-500/20 hover:brightness-110',
      };
    case 'rose':
      return {
        card: 'border-rose-500/35 hover:border-rose-400/70 hover:shadow-xl hover:shadow-rose-500/10',
        badge: 'bg-rose-500/20 text-rose-200 border border-rose-400/35',
        btn: 'bg-gradient-to-r from-rose-500 to-pink-500 text-white shadow-lg shadow-rose-500/20 hover:brightness-110',
      };
    case 'sky':
      return {
        card: 'border-sky-400/40 hover:border-sky-300/75 hover:shadow-xl hover:shadow-sky-500/15',
        badge: 'bg-sky-500/20 text-sky-200 border border-sky-400/40',
        btn: 'bg-gradient-to-r from-sky-400 to-cyan-400 text-slate-950 shadow-lg shadow-sky-500/20 hover:brightness-110',
      };
    case 'slate':
      return {
        card: 'border-slate-400/35 hover:border-slate-300/70 hover:shadow-xl hover:shadow-slate-400/10',
        badge: 'bg-slate-400/20 text-slate-100 border border-slate-300/40',
        btn: 'bg-gradient-to-r from-slate-200 to-slate-400 text-slate-950 shadow-lg shadow-slate-300/15 hover:brightness-110',
      };
    case 'indigo':
      return {
        card: 'border-indigo-500/30 hover:border-indigo-400/65 hover:shadow-xl hover:shadow-indigo-500/10',
        badge: 'bg-indigo-500/20 text-indigo-200 border border-indigo-400/30',
        btn: 'bg-gradient-to-r from-indigo-500 to-violet-500 text-white shadow-lg shadow-indigo-500/20 hover:brightness-110',
      };
    default:
      return {
        card: 'border-amber-500/30 hover:border-amber-400/65 hover:shadow-xl hover:shadow-amber-500/10',
        badge: 'bg-amber-500/20 text-amber-200 border border-amber-400/30',
        btn: 'bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 shadow-lg shadow-amber-500/20 hover:brightness-110',
      };
  }
}

export const ChapterSelect: React.FC<ChapterSelectProps> = ({
  onBackHome,
  onOpenVersus,
  onSelectChapter,
  progress,
}) => {
  const [activeFilter, setActiveFilter] = useState<'all' | ChapterCategory>(
    'all'
  );

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

      <div className="relative z-10 mx-auto max-w-5xl px-6 py-8">
        {/* Header */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
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
                  Catálogo Interactivo de Formatos · Crown of Galar
                </span>
              </div>
              <h1 className="font-display text-2xl font-bold text-white sm:text-3xl">
                Selector de Capítulos
              </h1>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={onOpenVersus}
              className="inline-flex items-center gap-1.5 rounded-xl border border-rose-400/45 bg-rose-500/15 px-3.5 py-2 text-xs font-bold text-rose-200 transition hover:bg-rose-500/25 cursor-pointer"
            >
              <Wand2 className="h-4 w-4" />
              Modo Versus (AI Teambuilder)
            </button>
          </div>
        </div>

        {/* Category Filter Bar */}
        <div className="mb-8 flex flex-wrap gap-2">
          <button
            onClick={() => setActiveFilter('all')}
            className={`rounded-xl border px-3.5 py-1.5 text-xs font-bold transition cursor-pointer ${
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
                className={`inline-flex items-center gap-1.5 rounded-xl border px-3.5 py-1.5 text-xs font-bold transition cursor-pointer ${
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

        {/* Categorized Sections */}
        <div className="space-y-10">
          {visibleSections.map((section) => {
            const Icon = section.icon;
            return (
              <section key={section.id}>
                <div className="mb-4 flex items-center justify-between border-b border-slate-800/70 pb-2">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-amber-400/30 bg-amber-500/10 text-amber-300">
                      <Icon className="h-4 w-4" />
                    </div>
                    <div>
                      <h2 className="font-display text-lg font-bold text-white">
                        {section.label}
                      </h2>
                      <p className="text-[11px] text-slate-400">
                        {section.subtitle}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid gap-5">
                  {section.chapters.map((chapter) => {
                    const prog = progress[chapter.id];
                    const accent = getAccentStyles(chapter.accentColor);
                    const hasOpenSheet =
                      chapter.formatId === 'gen9vgc2024regg' ||
                      chapter.formatId === 'gen91v1';

                    return (
                      <div
                        key={chapter.id}
                        className={`group relative overflow-hidden rounded-3xl border bg-slate-900/75 p-5 backdrop-blur transition-all duration-200 hover:-translate-y-0.5 ${accent.card}`}
                      >
                        <div className="grid items-center gap-5 md:grid-cols-12">
                          {/* Left Details */}
                          <div className="md:col-span-8">
                            <div className="mb-2.5 flex flex-wrap items-center gap-2">
                              <span
                                className={`rounded-lg px-2.5 py-1 text-[11px] font-bold tracking-wider ${accent.badge}`}
                              >
                                {chapter.number}
                              </span>
                              <span className="rounded-lg border border-slate-700 bg-slate-800/90 px-2.5 py-1 text-[11px] font-semibold text-slate-200">
                                {chapter.formatLabel}
                              </span>
                              <span className="font-mono-code rounded-lg border border-slate-800 bg-slate-950 px-2 py-1 text-[10px] text-slate-400">
                                {chapter.formatId}
                              </span>
                              {chapter.monotypeMatchup && (
                                <span className="inline-flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-950/90 px-2 py-0.5 text-[10px] font-bold">
                                  <span
                                    className={`rounded border px-1.5 py-0.2 uppercase ${getTypeBadgeClass(
                                      chapter.monotypeMatchup.playerType
                                    )}`}
                                  >
                                    {TYPE_ES[chapter.monotypeMatchup.playerType] ??
                                      chapter.monotypeMatchup.playerType}
                                  </span>
                                  <span className="text-slate-500">vs.</span>
                                  <span
                                    className={`rounded border px-1.5 py-0.2 uppercase ${getTypeBadgeClass(
                                      chapter.monotypeMatchup.rivalType
                                    )}`}
                                  >
                                    {TYPE_ES[chapter.monotypeMatchup.rivalType] ??
                                      chapter.monotypeMatchup.rivalType}
                                  </span>
                                </span>
                              )}
                              {hasOpenSheet && (
                                <span className="inline-flex items-center gap-1 rounded-lg border border-sky-400/35 bg-sky-500/15 px-2 py-0.5 text-[10px] font-semibold text-sky-200">
                                  <ClipboardList className="h-3 w-3" />
                                  Open Teamsheet
                                </span>
                              )}
                              {prog?.completed ? (
                                <span className="inline-flex items-center gap-1 rounded-lg border border-emerald-400/30 bg-emerald-500/15 px-2.5 py-0.5 text-[10px] font-semibold text-emerald-300">
                                  <CheckCircle2 className="h-3 w-3" />
                                  Completado · {prog.victories}{' '}
                                  {prog.victories === 1 ? 'victoria' : 'victorias'}
                                  {prog.attempts
                                    ? ` / ${prog.attempts} ${
                                        prog.attempts === 1 ? 'intento' : 'intentos'
                                      }`
                                    : ''}
                                </span>
                              ) : prog?.attempts && prog.attempts > 0 ? (
                                <span className="inline-flex items-center gap-1 rounded-lg border border-amber-400/30 bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold text-amber-200">
                                  {prog.attempts}{' '}
                                  {prog.attempts === 1 ? 'intento' : 'intentos'}
                                </span>
                              ) : null}
                            </div>

                            <h3 className="font-display text-xl font-bold text-white sm:text-2xl">
                              {chapter.title}
                            </h3>
                            <p className="mt-0.5 text-xs font-medium text-amber-200/85 sm:text-sm">
                              {chapter.subtitle}
                            </p>
                            <p className="mt-2.5 text-xs leading-relaxed text-slate-300 sm:text-sm">
                              {chapter.description}
                            </p>

                            <div className="mt-3.5 flex flex-wrap items-center gap-4 text-[11px] text-slate-400">
                              <span className="inline-flex items-center gap-1.5">
                                <Swords className="h-3.5 w-3.5 text-rose-400" />
                                <strong className="text-slate-200">Rival:</strong>{' '}
                                {chapter.rivalPreview}
                              </span>
                              <span className="inline-flex items-center gap-1.5">
                                <Users className="h-3.5 w-3.5 text-sky-400" />
                                <strong className="text-slate-200">Modo:</strong>{' '}
                                {chapter.format === 'triples'
                                  ? 'Triples 3v3'
                                  : chapter.format === 'doubles'
                                    ? 'Dobles 2v2'
                                    : 'Individuales'}
                              </span>
                              <span className="inline-flex items-center gap-1.5">
                                <GitBranch className="h-3.5 w-3.5 text-amber-400" />
                                {chapter.difficulty}
                              </span>
                            </div>
                          </div>

                          {/* Right Preview & Action */}
                          <div className="flex flex-col items-center justify-between gap-3 rounded-2xl border border-slate-800/90 bg-slate-950/75 p-4 md:col-span-4">
                            <div className="flex items-center justify-center gap-2 py-1">
                              <PokemonSprite
                                species={chapter.featuredPokemon[0]}
                                side="p2"
                                className="h-24 w-24 animate-float-slow"
                              />
                              <div className="flex flex-col items-center gap-0.5">
                                {chapter.featuredPokemon.map((sp) => (
                                  <PokemonIcon key={sp} species={sp} />
                                ))}
                              </div>
                            </div>

                            <button
                              onClick={() => onSelectChapter(chapter)}
                              className={`flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition active:scale-[0.98] cursor-pointer ${accent.btn}`}
                            >
                              <Play className="h-4 w-4 fill-current" />
                              Iniciar Capítulo
                            </button>
                          </div>
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
  );
};
