import React from 'react';
import {
  BookOpen,
  Crown,
  GitBranch,
  Play,
  Shield,
  Sparkles,
  Swords,
  Zap,
} from 'lucide-react';
import { PokemonSprite } from './PokemonSprite';
import type { ChapterProgress } from '../types/game';

interface HomePageProps {
  onOpenChapters: () => void;
  onQuickStartTestChapter: () => void;
  progress: Record<string, ChapterProgress>;
}

export const HomePage: React.FC<HomePageProps> = ({
  onOpenChapters,
  onQuickStartTestChapter,
  progress,
}) => {
  const completedCount = Object.values(progress).filter((p) => p.completed).length;

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#060a14] text-slate-100">
      {/* Ambient royal background */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-40 left-1/2 h-[34rem] w-[52rem] -translate-x-1/2 rounded-full bg-amber-500/12 blur-[120px]" />
        <div className="absolute bottom-0 left-0 h-96 w-96 rounded-full bg-indigo-600/15 blur-[110px]" />
        <div className="absolute bottom-0 right-0 h-96 w-96 rounded-full bg-sky-500/12 blur-[110px]" />
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              'linear-gradient(to right, #f59e0b 1px, transparent 1px), linear-gradient(to bottom, #f59e0b 1px, transparent 1px)',
            backgroundSize: '48px 48px',
          }}
        />
      </div>

      {/* Top Navigation Bar */}
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
              Visual Novel + Pokémon Showdown Engine
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {completedCount > 0 && (
            <span className="hidden items-center gap-1.5 rounded-full border border-emerald-400/30 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-300 sm:inline-flex">
              <Sparkles className="h-3.5 w-3.5" />
              {completedCount} capítulo{completedCount > 1 ? 's' : ''} completado
              {completedCount > 1 ? 's' : ''}
            </span>
          )}
          <button
            onClick={onOpenChapters}
            className="rounded-xl border border-slate-700/80 bg-slate-900/70 px-4 py-2 text-xs font-semibold text-slate-200 transition hover:border-amber-400/50 hover:text-amber-200 cursor-pointer"
          >
            Capítulos
          </button>
        </div>
      </header>

      {/* Main Hero */}
      <main className="relative z-10 mx-auto max-w-6xl px-6 pb-20 pt-8 sm:pt-12">
        <div className="grid items-center gap-12 lg:grid-cols-12">
          {/* Left Copy & CTAs */}
          <div className="lg:col-span-7">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-amber-400/30 bg-amber-500/10 px-3.5 py-1.5 text-xs font-medium text-amber-200">
              <Sparkles className="h-3.5 w-3.5 text-amber-400" />
              Prototipo Jugable · InkJS + @pkmn/sim 100% en Navegador
            </div>

            <h1 className="font-display text-4xl font-extrabold leading-tight tracking-tight text-white sm:text-5xl lg:text-6xl">
              Novela Visual Política &{' '}
              <span className="bg-gradient-to-r from-amber-200 via-amber-400 to-yellow-200 bg-clip-text text-transparent">
                Combate Táctico
              </span>
            </h1>

            <p className="mt-5 max-w-2xl text-base leading-relaxed text-slate-300 sm:text-lg">
              Sin rutas de hierba ni grindeo. Cada decisión en los diálogos atraviesa
              un <strong className="text-amber-200">árbol de decisiones</strong> que
              compila e inyecta texto real de{' '}
              <strong className="text-sky-300">Pokémon Showdown Teambuilder</strong>{' '}
              — modificando tu equipo, el set físico/especial de tus Pokémon y lo que
              llevará tu rival.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-4">
              <button
                onClick={onOpenChapters}
                className="group inline-flex items-center gap-2.5 rounded-2xl bg-gradient-to-r from-amber-500 to-yellow-500 px-6 py-3.5 text-sm font-bold text-slate-950 shadow-xl shadow-amber-500/20 transition hover:brightness-110 active:scale-[0.98] cursor-pointer"
              >
                <BookOpen className="h-4 w-4" />
                Seleccionar Capítulo
              </button>

              <button
                onClick={onQuickStartTestChapter}
                className="inline-flex items-center gap-2.5 rounded-2xl border border-sky-400/40 bg-sky-500/10 px-5 py-3.5 text-sm font-semibold text-sky-200 backdrop-blur transition hover:border-sky-300/70 hover:bg-sky-500/20 active:scale-[0.98] cursor-pointer"
              >
                <Zap className="h-4 w-4 text-sky-400" />
                Test Rápido: Arceus vs 6 Magikarp
                <Play className="h-3.5 w-3.5 fill-current" />
              </button>
            </div>

            {/* Architecture Loop Pipeline */}
            <div className="mt-10 grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-slate-800/90 bg-slate-900/60 p-4 backdrop-blur">
                <div className="mb-2 flex items-center gap-2 text-amber-300">
                  <BookOpen className="h-4 w-4" />
                  <span className="text-xs font-bold uppercase tracking-wider">
                    1. Guion Ink
                  </span>
                </div>
                <p className="text-xs leading-relaxed text-slate-400">
                  Diálogos y elecciones escritos en archivos{' '}
                  <code className="text-slate-200">.ink</code> (estándar profesional
                  headless compatible con React).
                </p>
              </div>

              <div className="rounded-2xl border border-slate-800/90 bg-slate-900/60 p-4 backdrop-blur">
                <div className="mb-2 flex items-center gap-2 text-sky-300">
                  <GitBranch className="h-4 w-4" />
                  <span className="text-xs font-bold uppercase tracking-wider">
                    2. Teambuilder
                  </span>
                </div>
                <p className="text-xs leading-relaxed text-slate-400">
                  El árbol lee las variables Ink e inyecta texto Showdown Paste para tu
                  equipo, tus sets mixtos y el rival.
                </p>
              </div>

              <div className="rounded-2xl border border-slate-800/90 bg-slate-900/60 p-4 backdrop-blur">
                <div className="mb-2 flex items-center gap-2 text-rose-300">
                  <Swords className="h-4 w-4" />
                  <span className="text-xs font-bold uppercase tracking-wider">
                    3. @pkmn/sim
                  </span>
                </div>
                <p className="text-xs leading-relaxed text-slate-400">
                  Combates reales con fórmulas exactas de Showdown (Singles y Dobles
                  2v2) e IA táctica local.
                </p>
              </div>
            </div>
          </div>

          {/* Right Visual Showcase Card */}
          <div className="lg:col-span-5">
            <div className="relative overflow-hidden rounded-3xl border border-amber-400/25 bg-gradient-to-b from-slate-900/90 via-slate-950/95 to-slate-950 p-6 shadow-2xl shadow-black/60">
              <div className="absolute -right-12 -top-12 h-44 w-44 rounded-full bg-amber-400/15 blur-3xl" />
              <div className="absolute -bottom-12 -left-12 h-44 w-44 rounded-full bg-sky-500/15 blur-3xl" />

              <div className="relative flex items-center justify-between border-b border-slate-800/80 pb-4">
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-amber-400" />
                  <span className="text-xs font-bold uppercase tracking-widest text-amber-200">
                    Escenario de Prueba Activo
                  </span>
                </div>
                <span className="rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-300">
                  Cap. 00 & 01 Listos
                </span>
              </div>

              {/* Sprites Showcase */}
              <div className="relative my-6 flex items-center justify-around rounded-2xl border border-slate-800/80 bg-slate-950/70 px-4 py-8">
                <div className="flex flex-col items-center">
                  <PokemonSprite
                    species="Arceus"
                    side="p2"
                    className="h-28 w-28 animate-float-slow"
                  />
                  <span className="mt-2 rounded-lg border border-amber-400/30 bg-amber-500/10 px-2.5 py-0.5 text-xs font-bold text-amber-200">
                    Arceus · 120 Atk / 120 SpA
                  </span>
                  <span className="mt-1 text-[11px] text-slate-400">
                    Set dinámico según decisión
                  </span>
                </div>

                <div className="font-display text-xl font-black text-amber-400/80">
                  VS
                </div>

                <div className="flex flex-col items-center">
                  <PokemonSprite
                    species="Magikarp"
                    side="p2"
                    className="h-24 w-24 animate-float-slow"
                  />
                  <span className="mt-2 rounded-lg border border-sky-400/30 bg-sky-500/10 px-2.5 py-0.5 text-xs font-bold text-sky-200">
                    6× Magikarp
                  </span>
                  <span className="mt-1 text-[11px] text-slate-400">
                    Nv. 50 o Nv. 100 según diálogo
                  </span>
                </div>
              </div>

              {/* Preview of Showdown injection */}
              <div className="rounded-xl border border-slate-800 bg-black/50 p-3.5">
                <div className="mb-1.5 flex items-center justify-between text-[11px] text-slate-400">
                  <span className="font-mono-code text-amber-300/90">
                    teambuilder_output.showdown
                  </span>
                  <span>Inyección automática</span>
                </div>
                <pre className="font-mono-code overflow-x-auto text-[11px] leading-relaxed text-slate-300">
{`Arceus @ Silk Scarf | Life Orb | Zap Plate
Ability: Multitype · Level: 100
EVs: 252 Atk o 252 SpA (según tu elección)
- Extreme Speed / Judgment / Swords Dance`}
                </pre>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
