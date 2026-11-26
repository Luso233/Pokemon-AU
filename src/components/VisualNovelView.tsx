import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  ChevronRight,
  Code2,
  GitBranch,
  History,
  RotateCcw,
  Sparkles,
  X,
} from 'lucide-react';
import { InkVNRunner, type VNFrameState } from '../engine/inkRunner';
import type { ChapterDefinition, StoryFlags } from '../types/game';
import { PokemonSprite } from './PokemonSprite';
import { SceneBackdrop } from './SceneBackdrop';

interface VisualNovelViewProps {
  chapter: ChapterDefinition;
  onExitToChapters: () => void;
  onFinishStory: (flags: StoryFlags) => void;
}

export const VisualNovelView: React.FC<VisualNovelViewProps> = ({
  chapter,
  onExitToChapters,
  onFinishStory,
}) => {
  const runnerRef = useRef<InkVNRunner | null>(null);
  const [frame, setFrame] = useState<VNFrameState | null>(null);
  const [typedLen, setTypedLen] = useState(0);
  const [showHistory, setShowHistory] = useState(false);
  const [showFlags, setShowFlags] = useState(false);

  const initStory = () => {
    const runner = new InkVNRunner(chapter.inkSource);
    runnerRef.current = runner;
    const initial = runner.step();
    setFrame(initial);
    setTypedLen(0);
  };

  useEffect(() => {
    initStory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chapter.id]);

  const fullText = frame?.currentLine?.text ?? '';
  const isTyping = typedLen < fullText.length;

  useEffect(() => {
    setTypedLen(0);
  }, [frame?.currentLine?.id]);

  useEffect(() => {
    if (!fullText || typedLen >= fullText.length) return;
    const timer = window.setTimeout(() => {
      setTypedLen((prev) => Math.min(fullText.length, prev + 2));
    }, 16);
    return () => window.clearTimeout(timer);
  }, [fullText, typedLen]);

  const handleAdvance = () => {
    if (!frame || !runnerRef.current) return;
    if (isTyping) {
      setTypedLen(fullText.length);
      return;
    }
    if (frame.canContinue) {
      setFrame(runnerRef.current.step());
    } else if (frame.isEnded) {
      onFinishStory(frame.flags);
    }
  };

  const handleChoice = (index: number) => {
    if (!runnerRef.current) return;
    setFrame(runnerRef.current.choose(index));
  };

  // Keyboard shortcuts: Space / Enter to advance, 1-3 for choices
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (showHistory) return;
      if (e.key === ' ' || e.key === 'Enter') {
        if (frame && frame.choices.length > 0 && !isTyping) return;
        e.preventDefault();
        handleAdvance();
      } else if (frame && frame.choices.length > 0 && !isTyping) {
        const num = Number(e.key);
        if (num >= 1 && num <= frame.choices.length) {
          e.preventDefault();
          handleChoice(frame.choices[num - 1].index);
        }
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [frame, isTyping, showHistory]);

  const flagEntries = useMemo(
    () => Object.entries(frame?.flags ?? {}),
    [frame?.flags]
  );

  if (!frame) return null;

  const line = frame.currentLine;
  const displayedText = fullText.slice(0, typedLen);
  const bg = line?.bg ?? 'royal-pond';
  const side = line?.side ?? 'left';

  return (
    <div className="relative flex min-h-screen flex-col justify-between overflow-hidden bg-slate-950 text-slate-100">
      <SceneBackdrop theme={bg} />

      {/* Top HUD Bar */}
      <header className="relative z-20 flex flex-wrap items-center justify-between gap-3 border-b border-white/10 bg-slate-950/65 px-5 py-3.5 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <button
            onClick={onExitToChapters}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700/80 bg-slate-900/80 px-3 py-1.5 text-xs font-semibold text-slate-300 transition hover:border-amber-400/50 hover:text-white cursor-pointer"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Capítulos
          </button>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-amber-300">
              {chapter.number} · NOVELA VISUAL (INKJS)
            </p>
            <h1 className="font-display text-sm font-bold text-white sm:text-base">
              {chapter.title}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowFlags((v) => !v)}
            className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold transition cursor-pointer ${
              showFlags
                ? 'border-sky-400/60 bg-sky-500/20 text-sky-200'
                : 'border-slate-700/80 bg-slate-900/80 text-slate-300 hover:border-sky-400/40'
            }`}
          >
            <Code2 className="h-3.5 w-3.5" />
            Variables Ink ({flagEntries.length})
          </button>

          <button
            onClick={() => setShowHistory(true)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700/80 bg-slate-900/80 px-3 py-1.5 text-xs font-semibold text-slate-300 transition hover:border-amber-400/40 cursor-pointer"
          >
            <History className="h-3.5 w-3.5" />
            Historial
          </button>

          <button
            onClick={initStory}
            title="Reiniciar escena"
            className="inline-flex items-center justify-center rounded-xl border border-slate-700/80 bg-slate-900/80 p-1.5 text-slate-300 transition hover:border-amber-400/40 hover:text-white cursor-pointer"
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </button>
        </div>
      </header>

      {/* Live Ink Variables Overlay Pill */}
      {showFlags && (
        <div className="relative z-20 mx-auto mt-3 w-full max-w-4xl px-5">
          <div className="rounded-2xl border border-sky-400/30 bg-slate-950/90 p-3.5 shadow-xl backdrop-blur-md">
            <div className="mb-2 flex items-center justify-between text-xs">
              <span className="inline-flex items-center gap-1.5 font-semibold text-sky-300">
                <GitBranch className="h-3.5 w-3.5" />
                Estado en vivo de variables Ink (alimentarán el Teambuilder)
              </span>
              <span className="font-mono-code text-[11px] text-slate-400">
                story.variablesState
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {flagEntries.map(([k, v]) => (
                <span
                  key={k}
                  className="font-mono-code rounded-lg border border-slate-700 bg-slate-900 px-2.5 py-1 text-xs text-slate-200"
                >
                  <span className="text-sky-400">{k}</span> ={' '}
                  <span className="text-amber-300">"{String(v)}"</span>
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Stage Area (Sprites + Character Presence) */}
      <div
        onClick={() => {
          if (frame.choices.length === 0 || isTyping) {
            handleAdvance();
          }
        }}
        className="relative z-10 mx-auto flex w-full max-w-5xl flex-1 items-end justify-between px-6 pb-4 pt-8 cursor-pointer"
      >
        {/* Left Character/Pokemon Stage */}
        <div
          className={`flex flex-col items-center transition-all duration-300 ${
            side === 'left'
              ? 'scale-105 opacity-100'
              : 'scale-90 opacity-40 blur-[0.4px]'
          }`}
        >
          {line?.pokemon && side === 'left' && (
            <div className="animate-fade-in-up flex flex-col items-center">
              <PokemonSprite
                species={line.pokemon}
                side="p2"
                className="h-40 w-40 sm:h-48 sm:w-48 animate-float-slow"
              />
              <span className="mt-2 rounded-full border border-amber-400/30 bg-slate-950/80 px-3 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-amber-200">
                {line.pokemon}
              </span>
            </div>
          )}
        </div>

        {/* Right Character/Pokemon Stage */}
        <div
          className={`flex flex-col items-center transition-all duration-300 ${
            side === 'right'
              ? 'scale-105 opacity-100'
              : 'scale-90 opacity-40 blur-[0.4px]'
          }`}
        >
          {line?.pokemon && side === 'right' && (
            <div className="animate-fade-in-up flex flex-col items-center">
              <PokemonSprite
                species={line.pokemon}
                side="p2"
                className="h-40 w-40 sm:h-48 sm:w-48 animate-float-slow"
              />
              <span className="mt-2 rounded-full border border-rose-400/30 bg-slate-950/80 px-3 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-rose-200">
                {line.pokemon}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Choices + Dialogue Box */}
      <div className="relative z-20 mx-auto w-full max-w-4xl px-4 pb-6 sm:px-6">
        {/* Branching Choices */}
        {!isTyping && frame.choices.length > 0 && (
          <div className="animate-fade-in-up mb-4 space-y-2.5">
            <div className="flex items-center gap-2 px-1 text-xs font-semibold uppercase tracking-wider text-amber-300">
              <GitBranch className="h-3.5 w-3.5" />
              Tu decisión modificará el Teambuilder del combate
            </div>
            {frame.choices.map((choice, idx) => (
              <button
                key={choice.index}
                onClick={() => handleChoice(choice.index)}
                className="group flex w-full items-center justify-between gap-4 rounded-2xl border border-amber-400/35 bg-slate-950/90 px-5 py-3.5 text-left text-sm font-medium text-slate-100 shadow-lg backdrop-blur-md transition hover:border-amber-400 hover:bg-amber-500/15 hover:text-white active:scale-[0.99] cursor-pointer"
              >
                <div className="flex items-center gap-3.5">
                  <span className="font-mono-code flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border border-amber-400/40 bg-amber-500/15 text-xs font-bold text-amber-300 group-hover:bg-amber-400 group-hover:text-slate-950">
                    {idx + 1}
                  </span>
                  <span>{choice.text}</span>
                </div>
                <ChevronRight className="h-4 w-4 shrink-0 text-amber-400/60 transition group-hover:translate-x-1 group-hover:text-amber-300" />
              </button>
            ))}
          </div>
        )}

        {/* Dialogue Card */}
        <div
          onClick={() => {
            if (frame.choices.length === 0 || isTyping) {
              handleAdvance();
            }
          }}
          className="relative rounded-3xl border border-amber-400/30 bg-slate-950/90 p-5 shadow-2xl shadow-black/70 backdrop-blur-xl sm:p-6 cursor-pointer"
        >
          {/* Speaker nameplate */}
          <div className="mb-2.5 flex items-center justify-between">
            <span
              className={`inline-flex items-center gap-2 rounded-xl px-3.5 py-1 text-xs font-bold uppercase tracking-wider ${
                line?.speaker === 'Príncipe Heredero'
                  ? 'border border-amber-400/40 bg-amber-500/20 text-amber-200'
                  : line?.speaker === 'Lord Vane' ||
                      line?.speaker === 'Sicario de la Corte'
                    ? 'border border-rose-400/40 bg-rose-500/20 text-rose-200'
                    : line?.speaker === 'Sistema Táctico'
                      ? 'border border-sky-400/40 bg-sky-500/20 text-sky-200'
                      : 'border border-slate-700 bg-slate-800/90 text-slate-200'
              }`}
            >
              {line?.speaker ?? 'Narrador'}
            </span>

            <span className="text-[11px] text-slate-400">
              {isTyping
                ? 'Clic o Espacio para completar'
                : frame.choices.length > 0
                  ? 'Elige una opción (1–3)'
                  : frame.isEnded
                    ? 'Fin de la escena narrativa'
                    : 'Clic o Espacio para continuar ▼'}
            </span>
          </div>

          {/* Dialogue text */}
          <p className="min-h-[4.25rem] text-base leading-relaxed text-slate-100 sm:text-lg">
            {displayedText}
            {isTyping && (
              <span className="ml-0.5 inline-block h-4 w-1.5 animate-pulse bg-amber-400 align-middle" />
            )}
          </p>

          {/* End of VN -> Proceed to Teambuilder */}
          {!isTyping && frame.isEnded && (
            <div className="mt-4 flex justify-end border-t border-slate-800/80 pt-4">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onFinishStory(frame.flags);
                }}
                className="inline-flex items-center gap-2.5 rounded-2xl bg-gradient-to-r from-amber-500 to-yellow-500 px-6 py-3 text-sm font-bold text-slate-950 shadow-xl shadow-amber-500/25 transition hover:brightness-110 active:scale-[0.98] cursor-pointer"
              >
                <Sparkles className="h-4 w-4" />
                Compilar Árbol de Decisiones → Teambuilder
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* History Drawer */}
      {showHistory && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/70 backdrop-blur-sm">
          <div className="flex h-full w-full max-w-md flex-col border-l border-slate-800 bg-slate-950 p-5">
            <div className="mb-4 flex items-center justify-between border-b border-slate-800 pb-3">
              <h2 className="font-display text-lg font-bold text-amber-200">
                Historial de Diálogo
              </h2>
              <button
                onClick={() => setShowHistory(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="flex-1 space-y-3 overflow-y-auto pr-1">
              {frame.history.map((item) => (
                <div
                  key={item.id}
                  className="rounded-xl border border-slate-800/80 bg-slate-900/70 p-3"
                >
                  <p className="text-[11px] font-bold uppercase tracking-wider text-amber-300">
                    {item.speaker}
                  </p>
                  <p className="mt-1 text-xs leading-relaxed text-slate-200">
                    {item.text}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
