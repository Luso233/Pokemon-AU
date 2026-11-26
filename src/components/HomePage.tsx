import React from 'react';
import {
  BookOpen,
  Cpu,
  Crown,
  GitBranch,
  Play,
  Settings2,
  Shield,
  Sparkles,
  Swords,
  Wand2,
} from 'lucide-react';
import { getActiveProviderLabel } from '../engine/aiProvider';
import { CharacterPortrait } from './CharacterPortrait';
import type { AISettings, ChapterProgress } from '../types/game';

interface HomePageProps {
  onOpenChapters: () => void;
  onOpenVersus: () => void;
  onOpenAISettings: () => void;
  onQuickStartMainChapter: () => void;
  progress: Record<string, ChapterProgress>;
  aiSettings: AISettings;
}

export const HomePage: React.FC<HomePageProps> = ({
  onOpenChapters,
  onOpenVersus,
  onOpenAISettings,
  onQuickStartMainChapter,
  progress,
  aiSettings,
}) => {
  const completedCount = Object.values(progress).filter(
    (p) => p.completed
  ).length;

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#060a14] text-slate-100">
      {/* Ambient royal dark-gold & crimson backdrop */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-40 left-1/2 h-[34rem] w-[52rem] -translate-x-1/2 rounded-full bg-amber-500/12 blur-[120px]" />
        <div className="absolute bottom-0 left-0 h-96 w-96 rounded-full bg-sky-600/14 blur-[110px]" />
        <div className="absolute bottom-0 right-0 h-96 w-96 rounded-full bg-rose-600/16 blur-[110px]" />
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              'linear-gradient(to right, #f59e0b 1px, transparent 1px), linear-gradient(to bottom, #f59e0b 1px, transparent 1px)',
            backgroundSize: '48px 48px',
          }}
        />
      </div>

      {/* Top Navigation */}
      <header className="relative z-10 mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-amber-400/40 bg-amber-500/10 text-amber-300 shadow-lg shadow-amber-500/10">
            <Crown className="h-5 w-5" />
          </div>
          <div>
            <p className="font-display text-sm font-bold tracking-[0.2em] text-amber-300">
              CROWN OF GALAR
            </p>
            <p className="text-[11px] text-slate-400">
              Novela Visual Política + Simulador Táctico 6v6 Dobles
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {completedCount > 0 && (
            <span className="hidden items-center gap-1.5 rounded-full border border-emerald-400/30 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-300 md:inline-flex">
              <Sparkles className="h-3.5 w-3.5" />
              {completedCount} capítulo{completedCount > 1 ? 's' : ''} completado
              {completedCount > 1 ? 's' : ''}
            </span>
          )}
          <button
            onClick={onOpenAISettings}
            className="inline-flex items-center gap-1.5 rounded-xl border border-sky-400/35 bg-sky-500/10 px-3 py-2 text-xs font-semibold text-sky-200 transition hover:bg-sky-500/20 cursor-pointer"
          >
            <Settings2 className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{getActiveProviderLabel(aiSettings)}</span>
            <span className="sm:hidden">IA</span>
          </button>
          <button
            onClick={onOpenVersus}
            className="inline-flex items-center gap-1.5 rounded-xl border border-rose-400/40 bg-rose-500/15 px-3.5 py-2 text-xs font-bold text-rose-200 transition hover:bg-rose-500/25 cursor-pointer"
          >
            <Wand2 className="h-3.5 w-3.5" />
            Modo Versus
          </button>
          <button
            onClick={onOpenChapters}
            className="rounded-xl border border-slate-700/80 bg-slate-900/70 px-4 py-2 text-xs font-semibold text-slate-200 transition hover:border-amber-400/50 hover:text-amber-200 cursor-pointer"
          >
            Capítulos
          </button>
        </div>
      </header>

      {/* Main Hero */}
      <main className="relative z-10 mx-auto max-w-6xl px-6 pb-20 pt-6 sm:pt-10">
        <div className="grid items-center gap-10 lg:grid-cols-12">
          {/* Left Copy & CTAs */}
          <div className="lg:col-span-6">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-amber-400/30 bg-amber-500/10 px-3.5 py-1.5 text-xs font-medium text-amber-200">
              <Sparkles className="h-3.5 w-3.5 text-amber-400" />
              InkJS · Niebla de Guerra · IA Scripteada por Turno · @pkmn/sim
            </div>

            <h1 className="font-display text-4xl font-extrabold leading-tight tracking-tight text-white sm:text-5xl">
              Cacería por la{' '}
              <span className="bg-gradient-to-r from-amber-200 via-amber-400 to-rose-300 bg-clip-text text-transparent">
                Corona de Galar
              </span>
            </h1>

            <p className="mt-5 text-base leading-relaxed text-slate-300">
              Acorralado bajo la lluvia de Wyndon solo con tu{' '}
              <strong className="text-amber-200">Equipo de Vida Diaria</strong>,
              enfrentas a un Asesino con un equipo 6v6 construido pieza por pieza
              para hacerte counter. Tus decisiones durante la persecución
              alteran leads, sabotean objetos, mejoran tus sets y exponen{' '}
              <strong className="text-rose-300">
                turnos scripteados de la IA
              </strong>{' '}
              para engañarla.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <button
                onClick={onQuickStartMainChapter}
                className="group inline-flex items-center gap-2.5 rounded-2xl bg-gradient-to-r from-amber-500 to-yellow-500 px-6 py-3.5 text-sm font-extrabold text-slate-950 shadow-xl shadow-amber-500/20 transition hover:brightness-110 active:scale-[0.98] cursor-pointer"
              >
                <Play className="h-4 w-4 fill-current" />
                Jugar Cap. 01: Cacería en Wyndon
              </button>

              <button
                onClick={onOpenVersus}
                className="inline-flex items-center gap-2 rounded-2xl border border-rose-400/50 bg-gradient-to-r from-rose-500/20 to-amber-500/15 px-5 py-3.5 text-sm font-bold text-rose-100 backdrop-blur transition hover:border-rose-300 hover:bg-rose-500/30 cursor-pointer"
              >
                <Wand2 className="h-4 w-4 text-rose-300" />
                Modo Versus (AI Teambuilder)
              </button>

              <button
                onClick={onOpenChapters}
                className="inline-flex items-center gap-2 rounded-2xl border border-slate-700 bg-slate-900/80 px-5 py-3.5 text-sm font-semibold text-slate-200 backdrop-blur transition hover:border-amber-400/50 hover:text-amber-200 cursor-pointer"
              >
                <BookOpen className="h-4 w-4" />
                Selector de Capítulos
              </button>
            </div>

            {/* 3-Pillar Architecture Highlights */}
            <div className="mt-9 grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-slate-800/90 bg-slate-900/60 p-3.5">
                <div className="mb-1.5 flex items-center gap-1.5 text-amber-300">
                  <GitBranch className="h-4 w-4" />
                  <span className="text-[11px] font-bold uppercase tracking-wider">
                    Persecución Ink
                  </span>
                </div>
                <p className="text-xs leading-relaxed text-slate-400">
                  4 decisiones tácticas que suavizan el matchup counter o te dejan
                  en modo desafío puro.
                </p>
              </div>

              <div className="rounded-2xl border border-slate-800/90 bg-slate-900/60 p-3.5">
                <div className="mb-1.5 flex items-center gap-1.5 text-rose-300">
                  <Cpu className="h-4 w-4" />
                  <span className="text-[11px] font-bold uppercase tracking-wider">
                    IA Scripteada
                  </span>
                </div>
                <p className="text-xs leading-relaxed text-slate-400">
                  Reglas por turno y HP para baitear Mofa, Fake Out, Brick Break o
                  Sucker Punch.
                </p>
              </div>

              <div className="rounded-2xl border border-slate-800/90 bg-slate-900/60 p-3.5">
                <div className="mb-1.5 flex items-center gap-1.5 text-sky-300">
                  <Swords className="h-4 w-4" />
                  <span className="text-[11px] font-bold uppercase tracking-wider">
                    6v6 Dobles + Tera
                  </span>
                </div>
                <p className="text-xs leading-relaxed text-slate-400">
                  Teracristalización, Fog of War estilo Showdown, rangos de
                  velocidad y tooltips.
                </p>
              </div>
            </div>
          </div>

          {/* Right Character Face-Off Card (Prince vs Assassin!) */}
          <div className="lg:col-span-6">
            <div className="relative overflow-hidden rounded-3xl border border-amber-400/25 bg-gradient-to-b from-slate-900/90 via-slate-950/95 to-slate-950 p-5 shadow-2xl shadow-black/70">
              <div className="absolute -left-10 top-10 h-52 w-52 rounded-full bg-amber-400/15 blur-3xl" />
              <div className="absolute -right-10 top-10 h-52 w-52 rounded-full bg-rose-600/20 blur-3xl" />

              <div className="relative flex items-center justify-between border-b border-slate-800/80 pb-3">
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-amber-400" />
                  <span className="text-xs font-bold uppercase tracking-widest text-amber-200">
                    Protagonista vs. Antagonista
                  </span>
                </div>
                <span className="rounded-full border border-rose-400/30 bg-rose-500/15 px-2.5 py-0.5 text-[11px] font-semibold text-rose-200">
                  6v6 Dobles · Tera Activo
                </span>
              </div>

              {/* Character Sprites Face-Off */}
              <div className="relative my-4 grid grid-cols-11 items-end rounded-2xl border border-slate-800/90 bg-gradient-to-b from-[#0b1326] to-[#050811] px-3 pt-4 pb-3">
                {/* Prince */}
                <div className="col-span-5 flex flex-col items-center">
                  <CharacterPortrait
                    charId="prince"
                    variant="sprite"
                    className="h-60 w-auto sm:h-72"
                  />
                  <div className="mt-2 w-full rounded-xl border border-amber-400/35 bg-amber-500/10 px-2.5 py-1.5 text-center">
                    <p className="font-display text-xs font-bold text-amber-200">
                      Príncipe Heredero
                    </p>
                    <p className="text-[10px] text-slate-400">
                      Arcanine · Gardevoir · Milotic · Corviknight · Sylveon · Rotom
                    </p>
                  </div>
                </div>

                {/* VS Divider */}
                <div className="col-span-1 flex flex-col items-center justify-center self-center">
                  <span className="font-display text-lg font-black text-amber-400">
                    VS
                  </span>
                </div>

                {/* Assassin */}
                <div className="col-span-5 flex flex-col items-center">
                  <CharacterPortrait
                    charId="assassin"
                    variant="sprite"
                    className="h-60 w-auto sm:h-72"
                  />
                  <div className="mt-2 w-full rounded-xl border border-rose-500/35 bg-rose-500/10 px-2.5 py-1.5 text-center">
                    <p className="font-display text-xs font-bold text-rose-200">
                      Asesino Carmesí
                    </p>
                    <p className="text-[10px] text-slate-400">
                      Equipo Anti-Príncipe 6v6 (Oculto bajo Fog of War)
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
