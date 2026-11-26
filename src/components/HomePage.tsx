import React from 'react';
import type { User } from 'firebase/auth';
import {
  BookOpen,
  Cloud,
  CloudOff,
  Coins,
  Crown,
  Gamepad2,
  GitBranch,
  Heart,
  Play,
  Settings2,
  Shield,
  ShoppingBag,
  Sparkles,
  Swords,
  Wand2,
  Wrench,
} from 'lucide-react';
import { CHAPTERS } from '../data/chapters';
import { getActiveProviderLabel } from '../engine/aiProvider';
import { CharacterPortrait } from './CharacterPortrait';
import type { AISettings, PlayerSaveProfile } from '../types/game';

interface HomePageProps {
  onOpenChapters: () => void;
  onOpenVersus: () => void;
  onOpenShop: () => void;
  onOpenTeamEditor: () => void;
  onOpenArcade: () => void;
  onOpenAccount: () => void;
  onOpenAISettings: () => void;
  onOpenDevMode: () => void;
  onOpenCamp: () => void;
  onQuickStartMainChapter: () => void;
  profile: PlayerSaveProfile;
  firebaseUser: User | null;
  cloudSyncStatus: 'local' | 'syncing' | 'synced' | 'error';
  aiSettings: AISettings;
}

export const HomePage: React.FC<HomePageProps> = ({
  onOpenChapters,
  onOpenVersus,
  onOpenShop,
  onOpenTeamEditor,
  onOpenArcade,
  onOpenAccount,
  onOpenAISettings,
  onOpenDevMode,
  onOpenCamp,
  onQuickStartMainChapter,
  profile,
  firebaseUser,
  cloudSyncStatus,
  aiSettings,
}) => {
  const completedCount = Object.values(profile.completedChapters).filter(
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
      <header className="relative z-10 mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-6 py-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-amber-400/40 bg-amber-500/10 text-amber-300 shadow-lg shadow-amber-500/10">
            <Crown className="h-5 w-5" />
          </div>
          <div>
            <p className="font-display text-sm font-bold tracking-[0.2em] text-amber-300">
              CROWN OF GALAR
            </p>
            <p className="text-[11px] text-slate-400">
              Novela Visual Política · Combates Tácticos Pokémon
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={onOpenShop}
            className="inline-flex items-center gap-1.5 rounded-xl border border-amber-400/45 bg-amber-500/15 px-3 py-2 text-xs font-extrabold text-amber-200 transition hover:bg-amber-500/25 cursor-pointer"
          >
            <Coins className="h-3.5 w-3.5 text-amber-400" />
            <span className="font-mono-code">
              {profile.coins.toLocaleString()} PC
            </span>
          </button>

          <button
            onClick={onOpenCamp}
            className="inline-flex items-center gap-1.5 rounded-xl border border-fuchsia-400/50 bg-fuchsia-500/15 px-3 py-2 text-xs font-extrabold text-fuchsia-200 transition hover:bg-fuchsia-500/25 cursor-pointer"
          >
            <Heart className="h-3.5 w-3.5 fill-fuchsia-400/60 text-fuchsia-300" />
            Vínculos & Camp
          </button>

          <button
            onClick={onOpenDevMode}
            className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-bold transition cursor-pointer ${
              profile.devModeEnabled
                ? 'border-fuchsia-400/60 bg-fuchsia-500/20 text-fuchsia-200'
                : 'border-slate-700 bg-slate-900/80 text-slate-300 hover:border-fuchsia-400/45 hover:text-fuchsia-200'
            }`}
          >
            <Wrench className="h-3.5 w-3.5 text-fuchsia-300" />
            Dev Mode
          </button>

          <button
            onClick={onOpenAccount}
            className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-bold transition cursor-pointer ${
              firebaseUser
                ? 'border-emerald-400/45 bg-emerald-500/15 text-emerald-200 hover:bg-emerald-500/25'
                : 'border-slate-700 bg-slate-900/80 text-slate-200 hover:border-amber-400/50'
            }`}
          >
            {firebaseUser ? (
              <Cloud className="h-3.5 w-3.5 text-emerald-400" />
            ) : (
              <CloudOff className="h-3.5 w-3.5 text-slate-400" />
            )}
            <span className="hidden sm:inline">
              {firebaseUser
                ? `${firebaseUser.displayName || profile.displayName}${
                    cloudSyncStatus === 'syncing' ? ' · ...' : ''
                  }`
                : 'Cuenta / Nube'}
            </span>
            <span className="sm:hidden">Cuenta</span>
          </button>

          <button
            onClick={onOpenAISettings}
            className="inline-flex items-center gap-1.5 rounded-xl border border-sky-400/35 bg-sky-500/10 px-3 py-2 text-xs font-semibold text-sky-200 transition hover:bg-sky-500/20 cursor-pointer"
          >
            <Settings2 className="h-3.5 w-3.5" />
            <span className="hidden lg:inline">
              {getActiveProviderLabel(aiSettings)}
            </span>
            <span className="lg:hidden">IA</span>
          </button>

          <button
            onClick={onOpenChapters}
            className="rounded-xl border border-slate-700/80 bg-slate-900/70 px-3.5 py-2 text-xs font-semibold text-slate-200 transition hover:border-amber-400/50 hover:text-amber-200 cursor-pointer"
          >
            Capítulos ({completedCount}/{CHAPTERS.length})
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
              Crónicas de Wyndon · Campaña, Puzzles y Archivos Históricos
            </div>

            <h1 className="font-display text-4xl font-extrabold leading-tight tracking-tight text-white sm:text-5xl">
              Cacería por la{' '}
              <span className="bg-gradient-to-r from-amber-200 via-amber-400 to-rose-300 bg-clip-text text-transparent">
                Corona de Galar
              </span>
            </h1>

            <p className="mt-5 text-base leading-relaxed text-slate-300">
              Bajo la lluvia nocturna de Wyndon, una conspiración corta el paso
              al heredero lejos de la armería real. Cada decisión en la sombra
              deja huella en la arena, y cada victoria te permite perfeccionar
              los objetos y movimientos de tu equipo para sobrevivir a los retos
              más despiadados del reino.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <button
                onClick={onQuickStartMainChapter}
                className="group inline-flex items-center gap-2.5 rounded-2xl bg-gradient-to-r from-amber-500 to-yellow-500 px-6 py-3.5 text-sm font-extrabold text-slate-950 shadow-xl shadow-amber-500/20 transition hover:brightness-110 active:scale-[0.98] cursor-pointer"
              >
                <Play className="h-4 w-4 fill-current" />
                Comenzar Capítulo 01
              </button>

              <button
                onClick={onOpenChapters}
                className="inline-flex items-center gap-2 rounded-2xl border border-slate-700 bg-slate-900/80 px-5 py-3.5 text-sm font-semibold text-slate-200 backdrop-blur transition hover:border-amber-400/50 hover:text-amber-200 cursor-pointer"
              >
                <BookOpen className="h-4 w-4" />
                Selector de Capítulos
              </button>

              <button
                onClick={onOpenVersus}
                className="inline-flex items-center gap-2 rounded-2xl border border-rose-400/50 bg-gradient-to-r from-rose-500/20 to-amber-500/15 px-5 py-3.5 text-sm font-bold text-rose-100 backdrop-blur transition hover:border-rose-300 hover:bg-rose-500/30 cursor-pointer"
              >
                <Wand2 className="h-4 w-4 text-rose-300" />
                Modo Versus
              </button>
            </div>

            {/* Economy & Progression Quick Strip */}
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                onClick={onOpenShop}
                className="inline-flex items-center gap-1.5 rounded-xl border border-amber-400/35 bg-amber-500/10 px-3.5 py-2 text-xs font-bold text-amber-200 transition hover:bg-amber-500/20 cursor-pointer"
              >
                <ShoppingBag className="h-3.5 w-3.5" />
                Tienda & Shiny Charms ({profile.inventory.shinyCharms}/6)
              </button>
              <button
                onClick={onOpenTeamEditor}
                className="inline-flex items-center gap-1.5 rounded-xl border border-sky-400/35 bg-sky-500/10 px-3.5 py-2 text-xs font-bold text-sky-200 transition hover:bg-sky-500/20 cursor-pointer"
              >
                <Wrench className="h-3.5 w-3.5" />
                Equipo Libre
              </button>
              <button
                onClick={onOpenArcade}
                className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-400/35 bg-emerald-500/10 px-3.5 py-2 text-xs font-bold text-emerald-200 transition hover:bg-emerald-500/20 cursor-pointer"
              >
                <Gamepad2 className="h-3.5 w-3.5" />
                Arcade Flash (Farmear PC)
              </button>
            </div>

            {/* 3-Pillar Highlights */}
            <div className="mt-9 grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-slate-800/90 bg-slate-900/60 p-3.5">
                <div className="mb-1.5 flex items-center gap-1.5 text-amber-300">
                  <GitBranch className="h-4 w-4" />
                  <span className="text-[11px] font-bold uppercase tracking-wider">
                    Decisiones Reales
                  </span>
                </div>
                <p className="text-xs leading-relaxed text-slate-400">
                  Lee la escena, arriésgate y descubre las consecuencias en la
                  arena sin advertencias de manual.
                </p>
              </div>

              <div className="rounded-2xl border border-slate-800/90 bg-slate-900/60 p-3.5">
                <div className="mb-1.5 flex items-center gap-1.5 text-sky-300">
                  <Wrench className="h-4 w-4" />
                  <span className="text-[11px] font-bold uppercase tracking-wider">
                    Progresión Táctica
                  </span>
                </div>
                <p className="text-xs leading-relaxed text-slate-400">
                  Equipa objetos de tu inventario y desbloquea slots para
                  enseñar cualquier movimiento legal del learnset.
                </p>
              </div>

              <div className="rounded-2xl border border-slate-800/90 bg-slate-900/60 p-3.5">
                <div className="mb-1.5 flex items-center gap-1.5 text-rose-300">
                  <Swords className="h-4 w-4" />
                  <span className="text-[11px] font-bold uppercase tracking-wider">
                    15 Escenarios
                  </span>
                </div>
                <p className="text-xs leading-relaxed text-slate-400">
                  Campaña, puzzles imposibles, Triples, supervivencia sin
                  curación y archivos históricos.
                </p>
              </div>
            </div>
          </div>

          {/* Right Character Face-Off Card */}
          <div className="lg:col-span-6">
            <div className="relative overflow-hidden rounded-3xl border border-amber-400/25 bg-gradient-to-b from-slate-900/90 via-slate-950/95 to-slate-950 p-5 shadow-2xl shadow-black/70">
              <div className="absolute -left-10 top-10 h-52 w-52 rounded-full bg-amber-400/15 blur-3xl" />
              <div className="absolute -right-10 top-10 h-52 w-52 rounded-full bg-rose-600/20 blur-3xl" />

              <div className="relative flex items-center justify-between border-b border-slate-800/80 pb-3">
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-amber-400" />
                  <span className="text-xs font-bold uppercase tracking-widest text-amber-200">
                    Noche en Wyndon
                  </span>
                </div>
                <span className="rounded-full border border-rose-400/30 bg-rose-500/15 px-2.5 py-0.5 text-[11px] font-semibold text-rose-200">
                  Capítulo 01 · 6v6 Dobles
                </span>
              </div>

              <div className="relative my-4 grid grid-cols-11 items-end rounded-2xl border border-slate-800/90 bg-gradient-to-b from-[#0b1326] to-[#050811] px-3 pt-4 pb-3">
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
                      Escolta diaria de palacio
                    </p>
                  </div>
                </div>

                <div className="col-span-1 flex flex-col items-center justify-center self-center">
                  <span className="font-display text-lg font-black text-amber-400">
                    VS
                  </span>
                </div>

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
                      Formación oculta en la niebla
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
