import React, { useState } from 'react';
import {
  AlertTriangle,
  Award,
  Brain,
  CheckCircle2,
  Loader2,
  Settings2,
  Sparkles,
  TrendingUp,
} from 'lucide-react';
import { generatePostGameReview } from '../engine/battleCoach';
import { getActiveProviderLabel } from '../engine/aiProvider';
import type {
  AISettings,
  BattleSnapshot,
  MoveAnnotationGrade,
  PostGameReview,
  ResolvedBattleConfig,
} from '../types/game';

interface GameReviewPanelProps {
  snapshot: BattleSnapshot;
  config: ResolvedBattleConfig;
  aiSettings: AISettings;
  onOpenAISettings: () => void;
}

const GRADE_STYLE: Record<
  MoveAnnotationGrade,
  { badge: string; label: string; border: string }
> = {
  brilliant: {
    badge: 'bg-cyan-400/20 text-cyan-200 border-cyan-400/50',
    label: 'Brillante !!',
    border: 'border-cyan-400/35',
  },
  great: {
    badge: 'bg-sky-400/20 text-sky-200 border-sky-400/50',
    label: 'Gran Jugada !',
    border: 'border-sky-400/30',
  },
  good: {
    badge: 'bg-emerald-400/20 text-emerald-200 border-emerald-400/45',
    label: 'Buena ✓',
    border: 'border-emerald-500/25',
  },
  inaccuracy: {
    badge: 'bg-amber-400/20 text-amber-200 border-amber-400/45',
    label: 'Imprecisión ?!',
    border: 'border-amber-500/30',
  },
  mistake: {
    badge: 'bg-orange-500/20 text-orange-200 border-orange-400/50',
    label: 'Error ?',
    border: 'border-orange-500/35',
  },
  blunder: {
    badge: 'bg-rose-500/25 text-rose-200 border-rose-400/55',
    label: 'Blunder ??',
    border: 'border-rose-500/40',
  },
};

export const GameReviewPanel: React.FC<GameReviewPanelProps> = ({
  snapshot,
  config,
  aiSettings,
  onOpenAISettings,
}) => {
  const [review, setReview] = useState<PostGameReview | null>(null);
  const [loading, setLoading] = useState(false);

  const handleAnalyze = async () => {
    setLoading(true);
    try {
      const result = await generatePostGameReview(snapshot, config, aiSettings);
      setReview(result);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mb-6 rounded-2xl border border-sky-400/30 bg-slate-900/75 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-sky-400/40 bg-sky-500/15 text-sky-300">
            <Brain className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-extrabold uppercase tracking-wider text-sky-300">
              Game Review estilo Chess.com
            </p>
            <p className="text-[11px] text-slate-400">
              1 sola llamada al Coach sobre el Battle Log · Motor:{' '}
              <span className="text-slate-200">
                {getActiveProviderLabel(aiSettings)}
              </span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onOpenAISettings}
            className="inline-flex items-center gap-1 rounded-xl border border-slate-700 bg-slate-950 px-2.5 py-1.5 text-[11px] font-semibold text-slate-300 hover:border-amber-400/50 hover:text-white cursor-pointer"
          >
            <Settings2 className="h-3.5 w-3.5" />
            IA
          </button>

          <button
            type="button"
            disabled={loading}
            onClick={() => void handleAnalyze()}
            className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-sky-400 to-cyan-400 px-3.5 py-1.5 text-xs font-extrabold text-slate-950 shadow-lg shadow-sky-500/20 hover:brightness-110 disabled:opacity-50 cursor-pointer"
          >
            {loading ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Analizando partida...
              </>
            ) : (
              <>
                <Sparkles className="h-3.5 w-3.5" />
                {review ? 'Re-analizar Partida' : 'Analizar Partida'}
              </>
            )}
          </button>
        </div>
      </div>

      {review && (
        <div className="mt-4 space-y-4 border-t border-slate-800 pt-4">
          {/* Accuracy + Chess.com-style grade counters */}
          <div className="grid gap-3 sm:grid-cols-12">
            <div className="flex flex-col items-center justify-center rounded-2xl border border-amber-400/35 bg-slate-950/90 p-3 sm:col-span-4">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Precisión Táctica
              </span>
              <span className="font-display mt-0.5 text-3xl font-black text-amber-300">
                {review.playerAccuracy}%
              </span>
              <span className="mt-0.5 text-[10px] text-slate-400">
                {review.modelLabel}
              </span>
            </div>

            <div className="flex flex-col justify-between rounded-2xl border border-slate-800 bg-slate-950/80 p-3 sm:col-span-8">
              <p className="text-xs leading-relaxed text-slate-200">
                {review.summaryVerdict}
              </p>
              <div className="mt-2.5 flex flex-wrap gap-1.5 text-[10px] font-bold">
                <span className="rounded-md border border-cyan-400/40 bg-cyan-500/15 px-2 py-0.5 text-cyan-200">
                  !! Brillantes: {review.counts.brilliant}
                </span>
                <span className="rounded-md border border-emerald-400/40 bg-emerald-500/15 px-2 py-0.5 text-emerald-200">
                  ✓ Buenas: {review.counts.good}
                </span>
                <span className="rounded-md border border-amber-400/40 bg-amber-500/15 px-2 py-0.5 text-amber-200">
                  ?! Imprecisiones: {review.counts.inaccuracy}
                </span>
                <span className="rounded-md border border-orange-400/40 bg-orange-500/15 px-2 py-0.5 text-orange-200">
                  ? Errores: {review.counts.mistake}
                </span>
                <span className="rounded-md border border-rose-400/45 bg-rose-500/15 px-2 py-0.5 text-rose-200">
                  ?? Blunders: {review.counts.blunder}
                </span>
              </div>
            </div>
          </div>

          {/* Key Turns Annotated */}
          <div className="space-y-2">
            <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-amber-300">
              <Award className="h-3.5 w-3.5" />
              Turnos Clave y Blunders Detectados
            </p>
            {review.keyTurns.map((kt, idx) => {
              const st = GRADE_STYLE[kt.grade] ?? GRADE_STYLE.good;
              return (
                <div
                  key={`${kt.turn}-${idx}`}
                  className={`rounded-xl border bg-slate-950/85 p-3 ${st.border}`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono-code rounded bg-slate-900 px-1.5 py-0.5 text-[10px] font-bold text-slate-300">
                        Turno {kt.turn}
                      </span>
                      <span className="text-xs font-bold text-white">
                        {kt.headline}
                      </span>
                    </div>
                    <span
                      className={`rounded-full border px-2 py-0.5 text-[10px] font-extrabold ${st.badge}`}
                    >
                      {st.label}
                    </span>
                  </div>
                  <p className="mt-1.5 text-[11px] text-slate-300">
                    {kt.whatHappened}
                  </p>
                  <p className="mt-1 flex items-start gap-1.5 text-[11px] text-emerald-300">
                    <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                    <span>
                      <strong>Mejor línea:</strong> {kt.betterLine}
                    </span>
                  </p>
                </div>
              );
            })}
          </div>

          {/* Concrete Improvements */}
          {review.improvements.length > 0 && (
            <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-3">
              <p className="mb-1.5 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-sky-300">
                <TrendingUp className="h-3.5 w-3.5" />
                Recomendaciones del Coach
              </p>
              <ul className="space-y-1 text-[11px] text-slate-300">
                {review.improvements.map((tip, i) => (
                  <li key={i} className="flex items-start gap-1.5">
                    <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0 text-amber-400" />
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
