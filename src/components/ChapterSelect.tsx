import React from 'react';
import {
  ArrowLeft,
  CheckCircle2,
  Crown,
  GitBranch,
  Play,
  Swords,
  Users,
} from 'lucide-react';
import { CHAPTERS } from '../data/chapters';
import { PokemonIcon, PokemonSprite } from './PokemonSprite';
import type { ChapterDefinition, ChapterProgress } from '../types/game';

interface ChapterSelectProps {
  onBackHome: () => void;
  onSelectChapter: (chapter: ChapterDefinition) => void;
  progress: Record<string, ChapterProgress>;
}

export const ChapterSelect: React.FC<ChapterSelectProps> = ({
  onBackHome,
  onSelectChapter,
  progress,
}) => {
  return (
    <div className="relative min-h-screen bg-[#060a14] text-slate-100">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-32 right-1/4 h-96 w-[36rem] rounded-full bg-amber-500/10 blur-[120px]" />
        <div className="absolute bottom-0 left-1/4 h-96 w-[36rem] rounded-full bg-indigo-600/10 blur-[120px]" />
      </div>

      <div className="relative z-10 mx-auto max-w-5xl px-6 py-8">
        {/* Header */}
        <div className="mb-10 flex flex-wrap items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
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
                  Archivo Real de Galar
                </span>
              </div>
              <h1 className="font-display text-2xl font-bold text-white sm:text-3xl">
                Selector de Capítulos
              </h1>
            </div>
          </div>

          <p className="max-w-sm text-xs leading-relaxed text-slate-400">
            Cada capítulo ejecuta un guion <code className="text-amber-300">.ink</code>,
            resuelve un árbol de decisiones y compila los equipos en formato Showdown
            para combatir en <code className="text-sky-300">@pkmn/sim</code>.
          </p>
        </div>

        {/* Chapter Cards */}
        <div className="grid gap-6">
          {CHAPTERS.map((chapter) => {
            const prog = progress[chapter.id];
            const accentStyles =
              chapter.accentColor === 'orange'
                ? {
                    card: 'border-orange-500/35 hover:border-orange-400/65 hover:shadow-xl hover:shadow-orange-500/10',
                    badge: 'bg-orange-500/20 text-orange-200 border border-orange-400/35',
                    btn: 'bg-gradient-to-r from-orange-500 to-amber-500 text-slate-950 shadow-lg shadow-orange-500/20 hover:brightness-110',
                  }
                : chapter.accentColor === 'purple'
                  ? {
                      card: 'border-purple-500/35 hover:border-purple-400/65 hover:shadow-xl hover:shadow-purple-500/10',
                      badge: 'bg-purple-500/20 text-purple-200 border border-purple-400/35',
                      btn: 'bg-gradient-to-r from-purple-500 to-fuchsia-500 text-white shadow-lg shadow-purple-500/20 hover:brightness-110',
                    }
                  : chapter.accentColor === 'indigo'
                    ? {
                        card: 'border-indigo-500/30 hover:border-indigo-400/60 hover:shadow-xl hover:shadow-indigo-500/10',
                        badge: 'bg-indigo-500/20 text-indigo-200 border border-indigo-400/30',
                        btn: 'bg-gradient-to-r from-indigo-500 to-violet-500 text-white shadow-lg shadow-indigo-500/20 hover:brightness-110',
                      }
                    : {
                        card: 'border-amber-500/30 hover:border-amber-400/60 hover:shadow-xl hover:shadow-amber-500/10',
                        badge: 'bg-amber-500/20 text-amber-200 border border-amber-400/30',
                        btn: 'bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 shadow-lg shadow-amber-500/20 hover:brightness-110',
                      };

            return (
              <div
                key={chapter.id}
                className={`group relative overflow-hidden rounded-3xl border bg-slate-900/75 p-6 backdrop-blur transition-all duration-200 hover:-translate-y-0.5 ${accentStyles.card}`}
              >
                <div className="grid items-center gap-6 md:grid-cols-12">
                  {/* Left Text */}
                  <div className="md:col-span-8">
                    <div className="mb-3 flex flex-wrap items-center gap-2">
                      <span
                        className={`rounded-lg px-2.5 py-1 text-[11px] font-bold tracking-wider ${accentStyles.badge}`}
                      >
                        {chapter.number}
                      </span>
                      <span className="rounded-lg border border-slate-700 bg-slate-800/80 px-2.5 py-1 text-[11px] font-semibold text-slate-300">
                        {chapter.formatLabel}
                      </span>
                      <span className="font-mono-code rounded-lg border border-slate-800 bg-slate-950 px-2 py-1 text-[10px] text-slate-400">
                        {chapter.formatId}
                      </span>
                      {prog?.completed && (
                        <span className="inline-flex items-center gap-1 rounded-lg border border-emerald-400/30 bg-emerald-500/15 px-2.5 py-1 text-[11px] font-semibold text-emerald-300">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          Completado ({prog.victories} victoria
                          {prog.victories === 1 ? '' : 's'})
                        </span>
                      )}
                    </div>

                    <h2 className="font-display text-2xl font-bold text-white">
                      {chapter.title}
                    </h2>
                    <p className="mt-1 text-sm font-medium text-amber-200/85">
                      {chapter.subtitle}
                    </p>
                    <p className="mt-3 text-sm leading-relaxed text-slate-300">
                      {chapter.description}
                    </p>

                    <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-slate-400">
                      <span className="inline-flex items-center gap-1.5">
                        <Swords className="h-3.5 w-3.5 text-rose-400" />
                        <strong className="text-slate-200">Rival:</strong>{' '}
                        {chapter.rivalPreview}
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <Users className="h-3.5 w-3.5 text-sky-400" />
                        <strong className="text-slate-200">Formato:</strong>{' '}
                        {chapter.format === 'doubles' ? 'Dobles 2v2' : 'Individuales'}
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <GitBranch className="h-3.5 w-3.5 text-amber-400" />
                        Decisiones ramificadas + IA Scripteada
                      </span>
                    </div>
                  </div>

                  {/* Right Preview & Action */}
                  <div className="flex flex-col items-center justify-between gap-4 rounded-2xl border border-slate-800/90 bg-slate-950/70 p-4 md:col-span-4">
                    <div className="flex items-center justify-center gap-2 py-2">
                      <PokemonSprite
                        species={chapter.featuredPokemon[0]}
                        side="p2"
                        className="h-24 w-24 animate-float-slow"
                      />
                      <div className="flex flex-col items-center gap-1">
                        {chapter.featuredPokemon.map((sp) => (
                          <PokemonIcon key={sp} species={sp} />
                        ))}
                      </div>
                    </div>

                    <button
                      onClick={() => onSelectChapter(chapter)}
                      className={`flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold transition active:scale-[0.98] cursor-pointer ${accentStyles.btn}`}
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
      </div>
    </div>
  );
};
