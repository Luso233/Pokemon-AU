import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  ChevronRight,
  Code2,
  GitBranch,
  HeartPulse,
  History,
  RotateCcw,
  Sparkles,
  Swords,
  X,
} from 'lucide-react';
import { InkVNRunner, type VNFrameState } from '../engine/inkRunner';
import { STATUS_BADGE_STYLES } from '../engine/pokemonVisuals';
import type {
  ChapterDefinition,
  CharacterId,
  MidStoryBattleRequest,
  PersistedPartyState,
  StoryFlags,
} from '../types/game';
import { CharacterPortrait } from './CharacterPortrait';
import { PokemonIcon, PokemonSprite } from './PokemonSprite';
import { SceneBackdrop } from './SceneBackdrop';

interface VisualNovelViewProps {
  chapter: ChapterDefinition;
  resumeInkStateJson?: string | null;
  persistedPartyState?: PersistedPartyState | null;
  onExitToChapters: () => void;
  onFinishStory: (flags: StoryFlags) => void;
  onTriggerMidStoryBattle?: (request: MidStoryBattleRequest) => void;
}

const SPEAKER_TO_CHAR: Record<string, CharacterId> = {
  'Príncipe Heredero': 'prince',
  'La Campeona': 'champion',
  'Asesino Carmesí': 'assassin',
  'Comandante Siniestro': 'dark_commander',
  'El Hombre Rata': 'rat_saboteur',
  'Sicario de la Corte': 'rat_saboteur',
  'La Duelista de la Frontera': 'court_duelist',
  'Duelista de la Corte': 'court_duelist',
  'El Estratega Solar': 'solar_strategist',
  'Estratega Solar': 'solar_strategist',
  'Guardián del Coloso': 'colossus_keeper',
  'Capataz de los Muelles': 'dock_militia',
  'Jefe Zapador Rebelde': 'mine_sapper',
  'Capitán de la Guardia Corrupta': 'corrupt_captain',
  'Duque de Hammerlocke': 'hammerlocke_duke',
  'Tríada de Élite del Duque': 'triad_knights',
  'Tríada de Élite': 'triad_knights',
  'El Archivista Real': 'royal_archivist',
  'Lord Vexen': 'clandestine_tamer',
  'Lord Vexen (Domador Clandestino)': 'clandestine_tamer',
  'Custodio del Coloso': 'colossus_keeper',
  'Tobías': 'tobias',
  'Tobías (El del Action Replay)': 'tobias',
  'Ash Ketchum': 'ash_ketchum',
};

export const VisualNovelView: React.FC<VisualNovelViewProps> = ({
  chapter,
  resumeInkStateJson = null,
  persistedPartyState = null,
  onExitToChapters,
  onFinishStory,
  onTriggerMidStoryBattle,
}) => {
  const runnerRef = useRef<InkVNRunner | null>(null);
  const [frame, setFrame] = useState<VNFrameState | null>(null);
  const [typedLen, setTypedLen] = useState(0);
  const [showHistory, setShowHistory] = useState(false);
  const [showFlags, setShowFlags] = useState(false);

  const initStory = (useResume = false) => {
    const runner = new InkVNRunner(chapter.inkSource);
    if (useResume && resumeInkStateJson) {
      runner.loadStateJson(resumeInkStateJson);
      if (persistedPartyState) {
        const alive = persistedPartyState.pokemon.filter((p) => !p.fainted).length;
        runner.setVariable('wave1_alive', alive);
      }
    }
    runnerRef.current = runner;
    const initial = runner.step();
    setFrame(initial);
    setTypedLen(0);
  };

  useEffect(() => {
    initStory(Boolean(resumeInkStateJson));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chapter.id, resumeInkStateJson]);

  const fullText = frame?.currentLine?.text ?? '';
  const isTyping = typedLen < fullText.length;

  useEffect(() => {
    setTypedLen(0);
  }, [frame?.currentLine?.id]);

  useEffect(() => {
    if (!fullText || typedLen >= fullText.length) return;
    const timer = window.setTimeout(() => {
      setTypedLen((prev) => Math.min(fullText.length, prev + 2));
    }, 15);
    return () => window.clearTimeout(timer);
  }, [fullText, typedLen]);

  const handleTriggerBattle = () => {
    if (!frame?.pendingBattleTrigger || !runnerRef.current || !onTriggerMidStoryBattle) {
      return;
    }
    onTriggerMidStoryBattle({
      battleId: frame.pendingBattleTrigger.battleId,
      persist: frame.pendingBattleTrigger.persist,
      flags: frame.flags,
      inkStateJson: runnerRef.current.exportStateJson(),
    });
  };

  const handleAdvance = () => {
    if (!frame || !runnerRef.current) return;
    if (isTyping) {
      setTypedLen(fullText.length);
      return;
    }
    if (frame.pendingBattleTrigger && onTriggerMidStoryBattle) {
      handleTriggerBattle();
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
  const bg = line?.bg ?? 'wyndon-alleys';
  const activeSide = line?.activeSide ?? 'left';
  const leftChar = line?.leftChar ?? null;
  const rightChar = line?.rightChar ?? null;
  const activeSpeakerBust: CharacterId | null = line?.speaker
    ? SPEAKER_TO_CHAR[line.speaker] ?? null
    : null;

  return (
    <div className="relative flex min-h-screen flex-col justify-between overflow-hidden bg-slate-950 text-slate-100">
      <SceneBackdrop theme={bg} />

      {/* Top HUD Bar */}
      <header className="relative z-20 flex flex-wrap items-center justify-between gap-3 border-b border-white/10 bg-slate-950/75 px-5 py-3 backdrop-blur-md">
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
            onClick={() => initStory(false)}
            title="Reiniciar escena"
            className="inline-flex items-center justify-center rounded-xl border border-slate-700/80 bg-slate-900/80 p-1.5 text-slate-300 transition hover:border-amber-400/40 hover:text-white cursor-pointer"
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </button>
        </div>
      </header>

      {/* Live Persisted Party Wear Banner (Back-to-Back intermediate scene without healing!) */}
      {persistedPartyState && (
        <div className="relative z-20 mx-auto mt-3 w-full max-w-4xl px-5">
          <div className="rounded-2xl border border-orange-400/45 bg-slate-950/92 px-4 py-3 shadow-xl backdrop-blur-md">
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
              <span className="inline-flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-orange-300">
                <HeartPulse className="h-4 w-4 text-rose-400" />
                Desgaste Heredado (Sin Curación · BattlePersistenceManager)
              </span>
              <span className="font-mono-code text-[11px] text-slate-400">
                {persistedPartyState.pokemon.filter((p) => !p.fainted).length}/
                {persistedPartyState.pokemon.length} Pokémon conscientes
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {persistedPartyState.pokemon.map((pm, idx) => {
                const pct = pm.fainted
                  ? 0
                  : Math.round((pm.hp / Math.max(1, pm.maxhp)) * 100);
                const statusBadge = pm.status
                  ? STATUS_BADGE_STYLES[pm.status]
                  : null;
                const spentPP = pm.moveSlots.reduce(
                  (acc, m) => acc + (m.maxpp - m.pp),
                  0
                );
                return (
                  <div
                    key={`${pm.species}-${idx}`}
                    className={`rounded-xl border px-2.5 py-1.5 ${
                      pm.fainted
                        ? 'border-rose-500/40 bg-rose-950/30 opacity-60 grayscale'
                        : 'border-slate-700 bg-slate-900/85'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1">
                      <div className="flex min-w-0 items-center gap-1">
                        <PokemonIcon species={pm.species} className="scale-75" />
                        <span className="truncate text-[11px] font-bold text-white">
                          {pm.species}
                        </span>
                      </div>
                      {statusBadge && (
                        <span
                          className={`rounded px-1 text-[8px] font-extrabold ${statusBadge.cls}`}
                        >
                          {statusBadge.label}
                        </span>
                      )}
                    </div>
                    <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
                      <div
                        className={`h-full rounded-full ${
                          pct > 50
                            ? 'bg-emerald-400'
                            : pct > 22
                              ? 'bg-amber-400'
                              : 'bg-rose-500'
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <div className="font-mono-code mt-1 flex items-center justify-between text-[9px] text-slate-300">
                      <span>{pm.fainted ? 'DEBILITADO' : `${pm.hp}/${pm.maxhp}`}</span>
                      <span className="text-amber-300/85">-{spentPP} PP</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Live Ink Variables Overlay */}
      {showFlags && (
        <div className="relative z-20 mx-auto mt-3 w-full max-w-4xl px-5">
          <div className="rounded-2xl border border-sky-400/30 bg-slate-950/90 p-3.5 shadow-xl backdrop-blur-md">
            <div className="mb-2 flex items-center justify-between text-xs">
              <span className="inline-flex items-center gap-1.5 font-semibold text-sky-300">
                <GitBranch className="h-3.5 w-3.5" />
                Variables Ink en vivo (alimentan el Teambuilder y la IA Scripteada)
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
                  <span className="text-amber-300">&quot;{String(v)}&quot;</span>
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Stage Area: Full-Body Character Portraits + Companion Pokémon */}
      <div
        onClick={() => {
          if (frame.choices.length === 0 || isTyping) {
            handleAdvance();
          }
        }}
        className="relative z-10 mx-auto flex w-full max-w-6xl flex-1 items-end justify-between px-4 pb-2 pt-6 sm:px-10 cursor-pointer"
      >
        {/* LEFT CHARACTER SLOT (Prince) */}
        <div
          className={`relative flex items-end gap-2 transition-all duration-300 ${
            activeSide === 'left'
              ? 'z-20 scale-105 opacity-100 brightness-100'
              : 'z-10 scale-95 opacity-55 brightness-75'
          }`}
        >
          {leftChar && (
            <CharacterPortrait
              charId={leftChar}
              variant="sprite"
              className="h-[18rem] w-auto sm:h-[24rem]"
            />
          )}
          {line?.pokemon && activeSide === 'left' && (
            <div className="animate-fade-in-up mb-8 hidden flex-col items-center sm:flex">
              <PokemonSprite
                species={line.pokemon}
                side="p2"
                className="h-28 w-28 animate-float-slow"
              />
              <span className="mt-1 rounded-full border border-amber-400/35 bg-slate-950/85 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-200">
                {line.pokemon}
              </span>
            </div>
          )}
        </div>

        {/* RIGHT CHARACTER SLOT (Assassin) */}
        <div
          className={`relative flex items-end gap-2 transition-all duration-300 ${
            activeSide === 'right'
              ? 'z-20 scale-105 opacity-100 brightness-100'
              : 'z-10 scale-95 opacity-55 brightness-75'
          }`}
        >
          {line?.pokemon && activeSide === 'right' && (
            <div className="animate-fade-in-up mb-8 hidden flex-col items-center sm:flex">
              <PokemonSprite
                species={line.pokemon}
                side="p2"
                className="h-28 w-28 animate-float-slow"
              />
              <span className="mt-1 rounded-full border border-rose-400/35 bg-slate-950/85 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-rose-200">
                {line.pokemon}
              </span>
            </div>
          )}
          {rightChar && (
            <CharacterPortrait
              charId={rightChar}
              variant="sprite"
              className="h-[18rem] w-auto sm:h-[24rem]"
            />
          )}
        </div>
      </div>

      {/* Choices + Dialogue Box */}
      <div className="relative z-20 mx-auto w-full max-w-4xl px-4 pb-5 sm:px-6">
        {/* Branching Choices */}
        {!isTyping && frame.choices.length > 0 && (
          <div className="animate-fade-in-up mb-3.5 space-y-2">
            <div className="flex items-center gap-2 px-1 text-xs font-semibold uppercase tracking-wider text-amber-300">
              <GitBranch className="h-3.5 w-3.5" />
              Decisión táctica — afectará los equipos y la IA del combate
            </div>
            {frame.choices.map((choice, idx) => (
              <button
                key={choice.index}
                onClick={() => handleChoice(choice.index)}
                className="group flex w-full items-center justify-between gap-4 rounded-2xl border border-amber-400/35 bg-slate-950/92 px-5 py-3 text-left text-sm font-medium text-slate-100 shadow-lg backdrop-blur-md transition hover:border-amber-400 hover:bg-amber-500/15 hover:text-white active:scale-[0.99] cursor-pointer"
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
          className="relative rounded-3xl border border-amber-400/35 bg-slate-950/92 p-5 shadow-2xl shadow-black/80 backdrop-blur-xl sm:p-6 cursor-pointer"
        >
          <div className="flex items-start gap-4">
            {activeSpeakerBust && (
              <div
                className={`hidden h-16 w-16 shrink-0 overflow-hidden rounded-2xl border bg-slate-900/90 p-0.5 sm:flex ${
                  activeSpeakerBust === 'prince'
                    ? 'border-amber-400/50'
                    : 'border-rose-500/50'
                }`}
              >
                <CharacterPortrait
                  charId={activeSpeakerBust}
                  variant="bust"
                  className="h-full w-full object-cover object-top"
                />
              </div>
            )}

            <div className="min-w-0 flex-1">
              <div className="mb-2 flex items-center justify-between gap-2">
                <span
                  className={`inline-flex items-center gap-2 rounded-xl px-3.5 py-1 text-xs font-bold uppercase tracking-wider ${
                    line?.speaker === 'Príncipe Heredero'
                      ? 'border border-amber-400/40 bg-amber-500/20 text-amber-200'
                      : line?.speaker === 'La Campeona'
                        ? 'border border-purple-400/45 bg-purple-500/20 text-purple-200'
                        : line?.speaker === 'Asesino Carmesí' ||
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
                        ? 'Fin de la persecución'
                        : 'Clic o Espacio para continuar ▼'}
                </span>
              </div>

              <p className="min-h-[3.75rem] text-base leading-relaxed text-slate-100 sm:text-lg">
                {displayedText}
                {isTyping && (
                  <span className="ml-0.5 inline-block h-4 w-1.5 animate-pulse bg-amber-400 align-middle" />
                )}
              </p>
            </div>
          </div>

          {/* Mid-Story # START_BATTLE Trigger (Back-to-Back Waves) */}
          {!isTyping && frame.pendingBattleTrigger && onTriggerMidStoryBattle && (
            <div className="mt-4 flex justify-end border-t border-slate-800/80 pt-4">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleTriggerBattle();
                }}
                className="inline-flex items-center gap-2.5 rounded-2xl bg-gradient-to-r from-orange-500 via-amber-500 to-yellow-500 px-6 py-3 text-sm font-extrabold text-slate-950 shadow-xl shadow-orange-500/25 transition hover:brightness-110 active:scale-[0.98] cursor-pointer"
              >
                <Swords className="h-4 w-4" />
                {frame.pendingBattleTrigger.persist
                  ? 'Iniciar Oleada 2 (Con Desgaste Heredado)'
                  : 'Iniciar Combate · Oleada 1'}
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}

          {/* End of VN -> Proceed to Teambuilder Briefing */}
          {!isTyping && frame.isEnded && !frame.pendingBattleTrigger && (
            <div className="mt-4 flex justify-end border-t border-slate-800/80 pt-4">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onFinishStory(frame.flags);
                }}
                className="inline-flex items-center gap-2.5 rounded-2xl bg-gradient-to-r from-amber-500 to-yellow-500 px-6 py-3 text-sm font-bold text-slate-950 shadow-xl shadow-amber-500/25 transition hover:brightness-110 active:scale-[0.98] cursor-pointer"
              >
                <Sparkles className="h-4 w-4" />
                Compilar Equipos e IA → Briefing Táctico
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
