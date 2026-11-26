import React from 'react';
import {
  BookOpen,
  Crown,
  Home,
  RefreshCw,
  RotateCcw,
  Trophy,
} from 'lucide-react';
import type {
  BattleSnapshot,
  ChapterDefinition,
  ResolvedBattleConfig,
} from '../types/game';
import { SceneBackdrop } from './SceneBackdrop';

interface EpilogueViewProps {
  chapter: ChapterDefinition;
  config: ResolvedBattleConfig;
  won: boolean;
  battleSummary: BattleSnapshot | null;
  onReplayChapter: () => void;
  onRetryBattle: () => void;
  onOpenChapters: () => void;
  onBackHome: () => void;
}

export const EpilogueView: React.FC<EpilogueViewProps> = ({
  chapter,
  config,
  won,
  battleSummary,
  onReplayChapter,
  onRetryBattle,
  onOpenChapters,
  onBackHome,
}) => {
  const epilogue = chapter.getEpilogue(won, config.flags);

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#060a14] p-6 text-slate-100">
      <SceneBackdrop theme={config.arenaTheme} className="opacity-65" />

      <div className="relative z-10 w-full max-w-2xl rounded-3xl border border-amber-400/30 bg-slate-950/90 p-7 shadow-2xl backdrop-blur-xl sm:p-9">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <span
            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold tracking-wider ${
              won
                ? 'border-emerald-400/40 bg-emerald-500/15 text-emerald-300'
                : 'border-rose-400/40 bg-rose-500/15 text-rose-300'
            }`}
          >
            {won ? <Trophy className="h-3.5 w-3.5" /> : <Crown className="h-3.5 w-3.5" />}
            {epilogue.badgeText}
          </span>
          <span className="text-xs font-semibold text-slate-400">
            {chapter.number} · {chapter.title}
          </span>
        </div>

        <h1 className="font-display text-3xl font-extrabold text-white">
          {epilogue.headline}
        </h1>
        <p className="mt-1.5 text-sm font-medium text-amber-200/90">
          {epilogue.subheadline}
        </p>

        <div className="my-6 space-y-3.5 border-y border-slate-800/90 py-5 text-sm leading-relaxed text-slate-200">
          {epilogue.paragraphs.map((p, idx) => (
            <p key={idx}>{p}</p>
          ))}
        </div>

        {/* Summary Stats */}
        {battleSummary && (
          <div className="mb-6 grid grid-cols-3 gap-3 text-center">
            <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-3">
              <p className="text-[11px] uppercase text-slate-400">Turnos</p>
              <p className="font-mono-code mt-0.5 text-lg font-bold text-white">
                {battleSummary.turn}
              </p>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-3">
              <p className="text-[11px] uppercase text-slate-400">Rivales KO</p>
              <p className="font-mono-code mt-0.5 text-lg font-bold text-amber-300">
                {battleSummary.koCountP2} / {battleSummary.totalP2}
              </p>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-3">
              <p className="text-[11px] uppercase text-slate-400">Formato</p>
              <p className="mt-0.5 text-sm font-bold text-sky-300">
                {config.format === 'doubles' ? 'Dobles 2v2' : 'Singles'}
              </p>
            </div>
          </div>
        )}

        {/* Loop Navigation Actions */}
        <div className="flex flex-wrap gap-3">
          <button
            onClick={onOpenChapters}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-amber-500 to-yellow-500 px-5 py-3 text-sm font-bold text-slate-950 shadow-lg shadow-amber-500/20 transition hover:brightness-110 cursor-pointer"
          >
            <BookOpen className="h-4 w-4" />
            Selector de Capítulos
          </button>

          <button
            onClick={onReplayChapter}
            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-sky-400/40 bg-sky-500/10 px-4 py-3 text-sm font-semibold text-sky-200 transition hover:bg-sky-500/20 cursor-pointer"
          >
            <RotateCcw className="h-4 w-4" />
            Probar otras decisiones
          </button>

          <button
            onClick={onRetryBattle}
            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm font-semibold text-slate-200 transition hover:border-amber-400/40 cursor-pointer"
          >
            <RefreshCw className="h-4 w-4" />
            Repetir Combate
          </button>

          <button
            onClick={onBackHome}
            title="Ir al inicio"
            className="inline-flex items-center justify-center rounded-2xl border border-slate-700 bg-slate-900 px-3.5 py-3 text-slate-300 transition hover:text-white cursor-pointer"
          >
            <Home className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
