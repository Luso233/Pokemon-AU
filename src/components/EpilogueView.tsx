import React from 'react';
import {
  BookOpen,
  Coins,
  Crown,
  Home,
  RefreshCw,
  RotateCcw,
  ShoppingBag,
  Sparkles,
  Trophy,
  Unlock,
  Wand2,
} from 'lucide-react';
import { CHAPTERS } from '../data/chapters';
import { CURRENCY_NAME } from '../data/economyCatalog';
import type {
  AISettings,
  BattleRewardSummary,
  BattleSnapshot,
  ChapterDefinition,
  ResolvedBattleConfig,
} from '../types/game';
import { GameReviewPanel } from './GameReviewPanel';
import { SceneBackdrop } from './SceneBackdrop';

interface EpilogueViewProps {
  chapter: ChapterDefinition;
  config: ResolvedBattleConfig;
  won: boolean;
  battleSummary: BattleSnapshot | null;
  reward?: BattleRewardSummary | null;
  attemptNumber?: number;
  aiSettings: AISettings;
  onOpenAISettings: () => void;
  onReplayChapter: () => void;
  onRetryBattle: () => void;
  onOpenChapters: () => void;
  onOpenShop?: () => void;
  onOpenVersus: () => void;
  onBackHome: () => void;
}

export const EpilogueView: React.FC<EpilogueViewProps> = ({
  chapter,
  config,
  won,
  battleSummary,
  reward,
  attemptNumber,
  aiSettings,
  onOpenAISettings,
  onReplayChapter,
  onRetryBattle,
  onOpenChapters,
  onOpenShop,
  onOpenVersus,
  onBackHome,
}) => {
  const isVersus = Boolean(config.isVersusMatch);
  const winnerLabel =
    battleSummary?.winner === 'p1'
      ? config.playerName
      : battleSummary?.winner === 'p2'
        ? config.rivalName
        : 'Empate';

  const epilogue = isVersus
    ? {
        headline:
          battleSummary?.winner === 'tie'
            ? 'Empate en Combate Versus'
            : `¡Victoria para ${winnerLabel}!`,
        subheadline: `${config.playerName} (${config.playerTeamSummary}) vs. ${config.rivalName} (${config.rivalTeamSummary})`,
        badgeText:
          config.p2Control === 'human'
            ? 'VERSUS HOTSEAT · FINALIZADO'
            : won
              ? 'VERSUS IA · VICTORIA'
              : 'VERSUS IA · DERROTA',
        paragraphs: [
          `Combate completado bajo las reglas oficiales de ${config.formatLabel ?? config.formatId} (${config.formatId}). Usa el Game Review estilo Chess.com debajo para detectar blunders, turnos clave y líneas óptimas.`,
        ],
      }
    : chapter.getEpilogue(won, config.flags);

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#060a14] p-6 text-slate-100">
      <SceneBackdrop theme={config.arenaTheme} className="opacity-65" />

      <div className="relative z-10 w-full max-w-3xl rounded-3xl border border-amber-400/30 bg-slate-950/92 p-7 shadow-2xl backdrop-blur-xl sm:p-9">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <span
            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold tracking-wider ${
              won || config.p2Control === 'human'
                ? 'border-emerald-400/40 bg-emerald-500/15 text-emerald-300'
                : 'border-rose-400/40 bg-rose-500/15 text-rose-300'
            }`}
          >
            {won || config.p2Control === 'human' ? (
              <Trophy className="h-3.5 w-3.5" />
            ) : (
              <Crown className="h-3.5 w-3.5" />
            )}
            {epilogue.badgeText}
          </span>
          <span className="text-xs font-semibold text-slate-400">
            {isVersus
              ? `MODO VERSUS · ${config.formatLabel ?? config.formatId}`
              : `${chapter.number} · ${chapter.title}`}
          </span>
        </div>

        <h1 className="font-display text-3xl font-extrabold text-white">
          {epilogue.headline}
        </h1>
        <p className="mt-1.5 text-sm font-medium text-amber-200/90">
          {epilogue.subheadline}
        </p>

        <div className="my-5 space-y-3 border-y border-slate-800/90 py-4 text-sm leading-relaxed text-slate-200">
          {epilogue.paragraphs.map((p, idx) => (
            <p key={idx}>{p}</p>
          ))}
        </div>

        {/* Battle Coin Rewards & Chapter Unlocks Banner */}
        {reward && reward.coinsEarned > 0 && (
          <div className="mb-5 rounded-2xl border border-amber-400/45 bg-gradient-to-r from-amber-500/15 via-yellow-500/10 to-emerald-500/15 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-amber-200">
                <Coins className="h-5 w-5 text-amber-400" />
                <span className="font-display text-base font-extrabold">
                  +{reward.coinsEarned.toLocaleString()} {CURRENCY_NAME} ganadas
                </span>
              </div>
              {onOpenShop && (
                <button
                  onClick={onOpenShop}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-amber-400/50 bg-amber-500/20 px-3 py-1.5 text-xs font-extrabold text-amber-100 hover:bg-amber-500/30 cursor-pointer"
                >
                  <ShoppingBag className="h-3.5 w-3.5" />
                  Gastar en la Tienda
                </button>
              )}
            </div>
            <div className="mt-1.5 flex flex-wrap gap-2 text-[11px] text-slate-300">
              {reward.firstClearBonus > 0 && (
                <span className="rounded bg-amber-500/20 px-2 py-0.5 font-semibold text-amber-200">
                  Primera Victoria: +{reward.firstClearBonus.toLocaleString()} PC
                </span>
              )}
              {reward.replayBonus > 0 && (
                <span className="rounded bg-sky-500/20 px-2 py-0.5 font-semibold text-sky-200">
                  Bono Rejugar: +{reward.replayBonus.toLocaleString()} PC
                </span>
              )}
              {reward.lowResetBonus > 0 && (
                <span className="inline-flex items-center gap-1 rounded bg-emerald-500/20 px-2 py-0.5 font-semibold text-emerald-200">
                  <Sparkles className="h-3 w-3" />
                  Bono Maestría Kaizo (≤2 intentos): +{reward.lowResetBonus} PC
                </span>
              )}
            </div>
            {reward.rewardItems && reward.rewardItems.length > 0 && (
              <div className="mt-2 flex flex-wrap items-center gap-1.5 border-t border-white/10 pt-2 text-xs font-bold text-amber-200">
                <Sparkles className="h-3.5 w-3.5 text-amber-400" />
                <span>Objeto añadido a tu inventario:</span>
                {reward.rewardItems.map((item) => (
                  <span
                    key={item}
                    className="rounded-lg border border-amber-400/40 bg-amber-500/20 px-2 py-0.5 text-[11px] text-amber-100"
                  >
                    {item}
                  </span>
                ))}
              </div>
            )}
            {reward.newlyUnlockedChapterIds.length > 0 && (
              <div className="mt-2.5 flex flex-wrap items-center gap-1.5 border-t border-white/10 pt-2 text-xs font-bold text-emerald-300">
                <Unlock className="h-3.5 w-3.5" />
                <span>Nuevos escenarios desbloqueados:</span>
                {reward.newlyUnlockedChapterIds.map((cid) => {
                  const found = CHAPTERS.find((c) => c.id === cid);
                  return (
                    <span
                      key={cid}
                      className="rounded-lg border border-emerald-400/40 bg-emerald-500/15 px-2 py-0.5 text-[11px] text-emerald-100"
                    >
                      {found ? `${found.number}: ${found.title}` : cid}
                    </span>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Summary Stats */}
        {battleSummary && (
          <div
            className={`mb-5 grid gap-3 text-center ${
              !isVersus && attemptNumber ? 'grid-cols-2 sm:grid-cols-4' : 'grid-cols-3'
            }`}
          >
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
            {!isVersus && attemptNumber != null && (
              <div className="rounded-2xl border border-amber-400/25 bg-amber-500/10 p-3">
                <p className="text-[11px] uppercase text-amber-200/80">
                  {won ? 'Victoria en' : 'Intentos'}
                </p>
                <p className="font-mono-code mt-0.5 text-lg font-bold text-amber-200">
                  #{attemptNumber}
                </p>
              </div>
            )}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-3">
              <p className="text-[11px] uppercase text-slate-400">Formato</p>
              <p className="mt-0.5 text-xs font-bold text-sky-300">
                {config.formatLabel ??
                  (config.format === 'triples'
                    ? 'Triples'
                    : config.format === 'doubles'
                      ? 'Dobles'
                      : 'Singles')}
              </p>
            </div>
          </div>
        )}

        {/* Chess.com-style On-Demand Post-Game Review */}
        {battleSummary && (
          <GameReviewPanel
            snapshot={battleSummary}
            config={config}
            aiSettings={aiSettings}
            onOpenAISettings={onOpenAISettings}
          />
        )}

        {/* Loop Navigation Actions */}
        <div className="flex flex-wrap gap-3">
          {isVersus ? (
            <button
              onClick={onOpenVersus}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-amber-500 to-yellow-500 px-5 py-3 text-sm font-bold text-slate-950 shadow-lg shadow-amber-500/20 transition hover:brightness-110 cursor-pointer"
            >
              <Wand2 className="h-4 w-4" />
              Volver al Modo Versus
            </button>
          ) : (
            <>
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
            </>
          )}

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
