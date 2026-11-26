import React, { useMemo, useState } from 'react';
import {
  ArrowLeft,
  Bot,
  CheckCircle2,
  ClipboardList,
  Code2,
  Cpu,
  Database,
  Dices,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  RefreshCw,
  Settings2,
  ShieldAlert,
  Sparkles,
  Swords,
  Trash2,
  Users,
  Wand2,
} from 'lucide-react';
import {
  deleteSavedTeam,
  generateValidatedTeam,
  getVersusFormatSpec,
  loadSavedTeams,
  normalizePromptKey,
  saveTeamToLibrary,
  validatePasteForFormat,
  VERSUS_FORMATS,
} from '../engine/aiTeambuilder';
import { getActiveProviderLabel } from '../engine/aiProvider';
import type {
  AISettings,
  ResolvedBattleConfig,
  SavedVersusTeam,
  SupportedFormatId,
} from '../types/game';
import { PokemonSprite } from './PokemonSprite';

interface VersusModeViewProps {
  aiSettings: AISettings;
  onOpenAISettings: () => void;
  onBackHome: () => void;
  onLaunchBattle: (config: ResolvedBattleConfig) => void;
}

interface PlayerSlotState {
  trainerName: string;
  prompt: string;
  team: SavedVersusTeam | null;
  pasteDraft: string;
  editingPaste: boolean;
  hiddenForHotseat: boolean;
  loading: boolean;
  progressText: string;
  metaNote: string;
  validationErrors: string[];
}

const PROMPT_CHIPS: Record<string, string[]> = {
  gen9ou: [
    'Equipo de lluvia ofensivo con Pelipper y Barraskewda',
    'Sol ofensivo con Torkoal y Pokémon paradoja rápidos',
    'Balance sólido con Dragapult, hazards y Kingambit rematador',
  ],
  gen9doublesou: [
    'Lluvia ofensiva en Dobles con un buen counter para hadas',
    'Equipo de Espacio Raro (Trick Room) con Torkoal e Indeedee-F',
    'Control de velocidad con Tailwind, Fake Out e Intimidate',
  ],
  gen9vgc2024regg: [
    'Equipo de lluvia VGC Reg G alrededor de Kyogre y Tornadus',
    'Sol agresivo con Koraidon, Flutter Mane y Chi-Yu',
    'Trick Room defensivo alrededor de Calyrex-Ice y Amoonguss',
  ],
  gen91v1: [
    'Trío 1v1 explosivo con burst de Hada, Acero y Agua',
    'Trío 1v1 bulky con Weakness Policy y prioridad',
  ],
  gen9monotype: [
    'Monotype Acero balanceado cubriendo Fuego y Tierra',
    'Monotype Agua ofensivo bajo lluvia con cobertura de Planta',
  ],
  gen9lc: [
    'Little Cup balanceado con Mienfoo, Foongus y Vullaby',
    'Little Cup hiper-ofensivo con hazards y prioridad',
  ],
  gen9ubers: [
    'Equipo Ubers agresivo con Koraidon, Miraidon y Arceus',
    'Balance Ubers con Ho-Oh, Ting-Lu y Zacian-Crowned',
  ],
};

const RIVAL_SURPRISE_PROMPTS = [
  'Equipo de lluvia ofensivo con presión especial y buena cobertura',
  'Equipo de sol agresivo con sweepers rápidos y control de velocidad',
  'Balance defensivo con hazards, pivotes y un rematador físico letal',
  'Espacio Raro con atacantes lentos de altísimo daño en área',
];

function createInitialSlot(name: string, defaultPrompt: string): PlayerSlotState {
  return {
    trainerName: name,
    prompt: defaultPrompt,
    team: null,
    pasteDraft: '',
    editingPaste: false,
    hiddenForHotseat: false,
    loading: false,
    progressText: '',
    metaNote: '',
    validationErrors: [],
  };
}

export const VersusModeView: React.FC<VersusModeViewProps> = ({
  aiSettings,
  onOpenAISettings,
  onBackHome,
  onLaunchBattle,
}) => {
  const [formatId, setFormatId] = useState<SupportedFormatId>('gen9doublesou');
  const [mode, setMode] = useState<'vs-ai' | 'hotseat'>('vs-ai');
  const [openTeamsheet, setOpenTeamsheet] = useState(false);
  const [showLibrary, setShowLibrary] = useState(false);
  const [libraryFilterOnlyFormat, setLibraryFilterOnlyFormat] = useState(true);
  const [savedTeams, setSavedTeams] = useState<SavedVersusTeam[]>(() =>
    loadSavedTeams()
  );

  const [p1, setP1] = useState<PlayerSlotState>(() =>
    createInitialSlot(
      'Jugador 1',
      'Un equipo de lluvia ofensivo para Dobles con un buen counter para hadas'
    )
  );
  const [p2, setP2] = useState<PlayerSlotState>(() =>
    createInitialSlot(
      'Estratega IA',
      'Equipo de Espacio Raro con atacantes de alto daño en área'
    )
  );

  const spec = useMemo(() => getVersusFormatSpec(formatId), [formatId]);
  const chips = PROMPT_CHIPS[formatId] ?? PROMPT_CHIPS.gen9ou;

  const handleFormatChange = (nextFmt: SupportedFormatId) => {
    const nextSpec = getVersusFormatSpec(nextFmt);
    setFormatId(nextFmt);
    setOpenTeamsheet(nextSpec.defaultOpenTeamsheet);
    const nextChips = PROMPT_CHIPS[nextFmt] ?? PROMPT_CHIPS.gen9ou;
    setP1((prev) => ({
      ...prev,
      team: null,
      pasteDraft: '',
      metaNote: '',
      validationErrors: [],
      hiddenForHotseat: false,
      prompt: nextChips[0] ?? prev.prompt,
    }));
    setP2((prev) => ({
      ...prev,
      team: null,
      pasteDraft: '',
      metaNote: '',
      validationErrors: [],
      hiddenForHotseat: false,
      prompt: nextChips[1] ?? nextChips[0] ?? prev.prompt,
    }));
  };

  const handleModeChange = (nextMode: 'vs-ai' | 'hotseat') => {
    setMode(nextMode);
    setP2((prev) => ({
      ...prev,
      trainerName:
        nextMode === 'hotseat'
          ? prev.trainerName === 'Estratega IA'
            ? 'Jugador 2'
            : prev.trainerName
          : prev.trainerName === 'Jugador 2'
            ? 'Estratega IA'
            : prev.trainerName,
      hiddenForHotseat: false,
    }));
  };

  const generateForSlot = async (
    side: 'p1' | 'p2',
    options?: { bypassCache?: boolean; overridePrompt?: string }
  ) => {
    const setter = side === 'p1' ? setP1 : setP2;
    const current = side === 'p1' ? p1 : p2;
    const other = side === 'p1' ? p2 : p1;
    const promptToUse = options?.overridePrompt ?? current.prompt;

    setter((prev) => ({
      ...prev,
      prompt: promptToUse,
      loading: true,
      progressText: 'Consultando al estratega real...',
      metaNote: '',
      validationErrors: [],
      editingPaste: false,
    }));

    try {
      const res = await generateValidatedTeam({
        formatId,
        prompt: promptToUse,
        settings: aiSettings,
        bypassCache: options?.bypassCache,
        excludeOfflineName: other.team?.teamName,
        onProgress: (txt) => {
          setter((prev) => ({ ...prev, progressText: txt }));
        },
      });

      setSavedTeams(loadSavedTeams());

      const noteParts: string[] = [];
      if (res.fromCache) noteParts.push('⚡ Desde caché local (0 llamadas)');
      else if (res.usedOfflineFallback)
        noteParts.push(
          res.fallbackReason
            ? `Arquetipo legal de respaldo (${res.fallbackReason})`
            : 'Modo Demo Offline · 100% legal en TeamValidator'
        );
      else {
        noteParts.push(
          `✅ Certificado por TeamValidator en ${res.attempts} intento${res.attempts > 1 ? 's' : ''}`
        );
        if (res.repairedErrors.length > 0) {
          noteParts.push(
            `${res.repairedErrors.length} error(es) auto-corregido(s)`
          );
        }
      }

      setter((prev) => ({
        ...prev,
        loading: false,
        progressText: '',
        team: res.team,
        pasteDraft: res.team.paste,
        metaNote: noteParts.join(' · '),
        validationErrors: [],
      }));
    } catch (err) {
      setter((prev) => ({
        ...prev,
        loading: false,
        progressText: '',
        validationErrors: [
          err instanceof Error ? err.message : String(err),
        ],
      }));
    }
  };

  const handleApplyManualPaste = (side: 'p1' | 'p2') => {
    const setter = side === 'p1' ? setP1 : setP2;
    const current = side === 'p1' ? p1 : p2;
    const check = validatePasteForFormat(formatId, current.pasteDraft);

    if (!check.valid) {
      setter((prev) => ({
        ...prev,
        validationErrors: check.errors,
      }));
      return;
    }

    const updatedTeam: SavedVersusTeam = {
      id: current.team?.id ?? `manual-${Date.now()}`,
      formatId,
      prompt: current.prompt || 'Equipo editado manualmente',
      normalizedPrompt: normalizePromptKey(current.prompt || 'manual'),
      teamName: current.team?.teamName || `Equipo Personalizado (${spec.shortLabel})`,
      strategySummary:
        current.team?.strategySummary ||
        'Paste editado y validado con @pkmn/sim TeamValidator.',
      paste: current.pasteDraft.trim(),
      species: check.sets.map((s) => s.species),
      source: 'manual',
      createdAt: new Date().toISOString(),
    };

    saveTeamToLibrary(updatedTeam);
    setSavedTeams(loadSavedTeams());

    setter((prev) => ({
      ...prev,
      team: updatedTeam,
      editingPaste: false,
      validationErrors: [],
      metaNote: '✅ Paste manual validado 100% legal con TeamValidator.',
    }));
  };

  const handleLoadFromLibrary = (side: 'p1' | 'p2', item: SavedVersusTeam) => {
    if (item.formatId !== formatId) {
      handleFormatChange(item.formatId);
    }
    const setter = side === 'p1' ? setP1 : setP2;
    setter((prev) => ({
      ...prev,
      prompt: item.prompt,
      team: item,
      pasteDraft: item.paste,
      editingPaste: false,
      validationErrors: [],
      metaNote: `📦 Cargado desde Biblioteca (${item.source}).`,
    }));
  };

  const handleDeleteSaved = (id: string) => {
    setSavedTeams(deleteSavedTeam(id));
  };

  const canStartBattle =
    Boolean(p1.team) &&
    Boolean(p2.team) &&
    !p1.loading &&
    !p2.loading &&
    p1.validationErrors.length === 0 &&
    p2.validationErrors.length === 0;

  const handleLaunchVersus = () => {
    if (!p1.team || !p2.team) return;
    const config: ResolvedBattleConfig = {
      chapterId: `versus-${formatId}`,
      format: spec.battleFormat,
      formatId: spec.id,
      formatLabel: spec.shortLabel,
      interactiveTeamPreview: spec.interactiveTeamPreview,
      openTeamsheet,
      p2Control: mode === 'hotseat' ? 'human' : 'ai',
      isVersusMatch: true,
      playerName: p1.trainerName.trim() || 'Jugador 1',
      playerCharId: 'prince',
      rivalName:
        p2.trainerName.trim() ||
        (mode === 'hotseat' ? 'Jugador 2' : 'Estratega IA'),
      rivalTitle:
        mode === 'hotseat'
          ? `Versus Hotseat Local · ${spec.shortLabel}`
          : `Versus AI Teambuilder · ${spec.shortLabel}`,
      rivalCharId: mode === 'hotseat' ? 'champion' : 'assassin',
      arenaTheme: 'vgc-worlds-stage',
      playerTeamSummary: p1.team.teamName,
      rivalTeamSummary: p2.team.teamName,
      playerShowdownPaste: p1.team.paste,
      rivalShowdownPaste: p2.team.paste,
      rivalIntel: {
        visibleSpeciesCount: spec.teamSize,
        totalSlots: spec.teamSize,
        intelLabel: openTeamsheet
          ? 'Open Teamsheet Activo'
          : 'Fog of War Competitivo',
        intelNote: spec.rulesHint,
        levelCap: spec.defaultLevel,
        hasBossAce: false,
      },
      scriptedEnemyRules: [],
      traces: [],
      flags: {
        versus_format: spec.id,
        versus_mode: mode,
      },
    };
    onLaunchBattle(config);
  };

  const visibleLibrary = useMemo(() => {
    return libraryFilterOnlyFormat
      ? savedTeams.filter((t) => t.formatId === formatId)
      : savedTeams;
  }, [savedTeams, libraryFilterOnlyFormat, formatId]);

  const renderPlayerCard = (
    side: 'p1' | 'p2',
    state: PlayerSlotState,
    setter: React.Dispatch<React.SetStateAction<PlayerSlotState>>
  ) => {
    const isP1 = side === 'p1';
    const accentBorder = isP1 ? 'border-amber-400/35' : 'border-rose-400/35';
    const accentText = isP1 ? 'text-amber-300' : 'text-rose-300';

    return (
      <div
        className={`flex flex-col rounded-3xl border bg-slate-900/75 p-5 shadow-xl backdrop-blur ${accentBorder}`}
      >
        {/* Card header */}
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <span
              className={`rounded-lg px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider ${
                isP1
                  ? 'bg-amber-500/20 text-amber-200 border border-amber-400/40'
                  : 'bg-rose-500/20 text-rose-200 border border-rose-400/40'
              }`}
            >
              {isP1 ? 'Jugador 1' : mode === 'hotseat' ? 'Jugador 2' : 'Rival IA'}
            </span>
            <input
              type="text"
              value={state.trainerName}
              onChange={(e) =>
                setter((prev) => ({ ...prev, trainerName: e.target.value }))
              }
              className="w-36 rounded-lg border border-slate-800 bg-slate-950 px-2 py-1 text-xs font-bold text-white focus:border-amber-400 focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-1.5">
            {!isP1 && mode === 'vs-ai' && (
              <button
                type="button"
                disabled={state.loading}
                onClick={() => {
                  const pick =
                    RIVAL_SURPRISE_PROMPTS[
                      Math.floor(Math.random() * RIVAL_SURPRISE_PROMPTS.length)
                    ];
                  void generateForSlot('p2', {
                    overridePrompt: pick,
                    bypassCache: false,
                  });
                }}
                className="inline-flex items-center gap-1 rounded-lg border border-rose-400/40 bg-rose-500/15 px-2.5 py-1 text-[11px] font-bold text-rose-200 hover:bg-rose-500/25 disabled:opacity-40 cursor-pointer"
              >
                <Dices className="h-3.5 w-3.5" />
                Rival Sorpresa
              </button>
            )}

            {state.team && (
              <button
                type="button"
                onClick={() =>
                  setter((prev) => ({
                    ...prev,
                    hiddenForHotseat: !prev.hiddenForHotseat,
                  }))
                }
                className={`inline-flex items-center gap-1 rounded-lg border px-2.5 py-1 text-[11px] font-bold transition cursor-pointer ${
                  state.hiddenForHotseat
                    ? 'border-emerald-400/50 bg-emerald-500/20 text-emerald-200'
                    : 'border-slate-700 bg-slate-950 text-slate-300 hover:text-white'
                }`}
              >
                {state.hiddenForHotseat ? (
                  <>
                    <Eye className="h-3.5 w-3.5" />
                    Mostrar
                  </>
                ) : (
                  <>
                    <EyeOff className="h-3.5 w-3.5" />
                    Listo / Ocultar
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Hidden Privacy Shield (for Hotseat anti-counter-pick!) */}
        {state.hiddenForHotseat && state.team ? (
          <div className="flex flex-1 flex-col items-center justify-center rounded-2xl border border-dashed border-emerald-400/45 bg-emerald-950/20 px-5 py-12 text-center">
            <Lock className="mb-3 h-8 w-8 text-emerald-300" />
            <p className="font-display text-base font-bold text-white">
              Equipo de {state.trainerName} Bloqueado y Oculto
            </p>
            <p className="mt-1 max-w-xs text-xs text-slate-400">
              {state.team.species.length} Pokémon validados en{' '}
              <code className="text-emerald-300">{formatId}</code>. Listo para
              evitar counter-picking en modo Hotseat.
            </p>
          </div>
        ) : (
          <>
            {/* Natural Language Prompt Input */}
            <label className={`mb-1.5 text-[11px] font-bold uppercase tracking-wider ${accentText}`}>
              Describe tu estrategia en lenguaje natural
            </label>
            <textarea
              rows={3}
              value={state.prompt}
              onChange={(e) =>
                setter((prev) => ({ ...prev, prompt: e.target.value }))
              }
              placeholder="Ej. Un equipo de lluvia ofensivo para Dobles con un buen counter para hadas..."
              className="w-full rounded-2xl border border-slate-700/90 bg-slate-950/90 p-3 text-xs leading-relaxed text-slate-100 placeholder:text-slate-500 focus:border-amber-400 focus:outline-none"
            />

            {/* Quick Prompt Inspiration Chips */}
            <div className="mt-2 flex flex-wrap gap-1.5">
              {chips.map((chip) => (
                <button
                  key={chip}
                  type="button"
                  onClick={() => setter((prev) => ({ ...prev, prompt: chip }))}
                  className="rounded-full border border-slate-700/80 bg-slate-950/75 px-2.5 py-0.5 text-[10px] text-slate-300 transition hover:border-amber-400/50 hover:text-amber-200 cursor-pointer"
                >
                  {chip.length > 44 ? `${chip.slice(0, 44)}…` : chip}
                </button>
              ))}
            </div>

            {/* Generate Actions */}
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <button
                type="button"
                disabled={state.loading}
                onClick={() => void generateForSlot(side, { bypassCache: false })}
                className={`inline-flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-xs font-extrabold shadow-lg transition hover:brightness-110 disabled:opacity-50 cursor-pointer ${
                  isP1
                    ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 shadow-amber-500/20'
                    : 'bg-gradient-to-r from-rose-500 to-pink-500 text-white shadow-rose-500/20'
                }`}
              >
                {state.loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {state.progressText || 'Generando...'}
                  </>
                ) : (
                  <>
                    <Wand2 className="h-4 w-4" />
                    Generar Equipo ({spec.teamSize} Pokémon)
                  </>
                )}
              </button>

              {state.team && !state.loading && (
                <button
                  type="button"
                  title="Ignorar caché y generar nueva variante"
                  onClick={() =>
                    void generateForSlot(side, { bypassCache: true })
                  }
                  className="inline-flex items-center gap-1 rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-xs font-semibold text-slate-300 hover:border-amber-400/50 hover:text-white cursor-pointer"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {/* Status / Self-healing note */}
            {state.metaNote && (
              <p className="mt-2.5 flex items-center gap-1.5 rounded-xl border border-emerald-400/30 bg-emerald-500/10 px-3 py-1.5 text-[11px] font-medium text-emerald-200">
                <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                <span>{state.metaNote}</span>
              </p>
            )}

            {/* Validation Errors */}
            {state.validationErrors.length > 0 && (
              <div className="mt-2.5 rounded-xl border border-rose-500/45 bg-rose-950/40 p-2.5 text-[11px] text-rose-200">
                <p className="mb-1 flex items-center gap-1 font-bold">
                  <ShieldAlert className="h-3.5 w-3.5" />
                  Errores de TeamValidator ({formatId}):
                </p>
                <ul className="list-disc space-y-0.5 pl-4">
                  {state.validationErrors.slice(0, 5).map((err, i) => (
                    <li key={i}>{err}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Generated Team Preview */}
            {state.team && (
              <div className="mt-4 rounded-2xl border border-slate-800 bg-slate-950/85 p-3.5">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-xs font-extrabold text-white">
                      {state.team.teamName}
                    </p>
                    <p className="text-[11px] text-slate-400">
                      {state.team.strategySummary}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setter((prev) => ({
                        ...prev,
                        editingPaste: !prev.editingPaste,
                      }))
                    }
                    className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-slate-700 bg-slate-900 px-2.5 py-1 text-[10px] font-bold text-sky-200 hover:border-sky-400/60 cursor-pointer"
                  >
                    <Code2 className="h-3 w-3" />
                    {state.editingPaste ? 'Cerrar Paste' : 'Editar Paste'}
                  </button>
                </div>

                {/* Sprites grid */}
                <div className="grid grid-cols-3 gap-2">
                  {state.team.species.map((sp, i) => (
                    <div
                      key={`${sp}-${i}`}
                      className="flex flex-col items-center rounded-xl border border-slate-800 bg-slate-900/75 p-1.5 text-center"
                    >
                      <PokemonSprite
                        species={sp}
                        side="p2"
                        className="h-12 w-12"
                      />
                      <span className="mt-0.5 w-full truncate text-[10px] font-bold text-slate-200">
                        {sp}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Editable Pokepaste with Live TeamValidator */}
                {state.editingPaste && (
                  <div className="mt-3 space-y-2 border-t border-slate-800 pt-3">
                    <textarea
                      rows={9}
                      value={state.pasteDraft}
                      onChange={(e) =>
                        setter((prev) => ({
                          ...prev,
                          pasteDraft: e.target.value,
                        }))
                      }
                      className="font-mono-code w-full rounded-xl border border-slate-700 bg-black/70 p-2.5 text-[11px] text-slate-200 focus:border-amber-400 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => handleApplyManualPaste(side)}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-sky-500 px-3 py-1.5 text-xs font-bold text-slate-950 hover:brightness-110 cursor-pointer"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Validar con TeamValidator y Guardar
                    </button>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    );
  };

  return (
    <div className="relative min-h-screen bg-[#060a14] text-slate-100">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-32 left-1/4 h-96 w-[36rem] rounded-full bg-amber-500/10 blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 h-96 w-[36rem] rounded-full bg-rose-600/10 blur-[120px]" />
      </div>

      <div className="relative z-10 mx-auto max-w-6xl px-5 py-7">
        {/* Top Bar */}
        <header className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={onBackHome}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-900 px-3.5 py-2 text-xs font-semibold text-slate-300 hover:border-amber-400/50 hover:text-white cursor-pointer"
            >
              <ArrowLeft className="h-4 w-4" />
              Inicio
            </button>
            <div>
              <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.2em] text-amber-300">
                <Sparkles className="h-3.5 w-3.5" />
                Prompt-to-Battle · Autocuración TeamValidator
              </p>
              <h1 className="font-display text-2xl font-extrabold text-white sm:text-3xl">
                Modo Versus (AI Teambuilder)
              </h1>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setShowLibrary((v) => !v)}
              className={`inline-flex items-center gap-1.5 rounded-xl border px-3.5 py-2 text-xs font-bold transition cursor-pointer ${
                showLibrary
                  ? 'border-sky-400 bg-sky-500/20 text-sky-100'
                  : 'border-slate-700 bg-slate-900 text-slate-300 hover:border-sky-400/50'
              }`}
            >
              <Database className="h-4 w-4" />
              Biblioteca / Caché ({savedTeams.length})
            </button>

            <button
              type="button"
              onClick={onOpenAISettings}
              className="inline-flex items-center gap-1.5 rounded-xl border border-amber-400/40 bg-amber-500/15 px-3.5 py-2 text-xs font-bold text-amber-200 hover:bg-amber-500/25 cursor-pointer"
            >
              <Settings2 className="h-4 w-4" />
              {getActiveProviderLabel(aiSettings)}
            </button>
          </div>
        </header>

        {/* STEP 1: Format & Rules Configurator */}
        <section className="mb-6 rounded-3xl border border-slate-800 bg-slate-900/70 p-4">
          <div className="grid gap-4 lg:grid-cols-12">
            {/* Format Picker */}
            <div className="lg:col-span-7">
              <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-amber-300">
                Paso 1 · Formato de Showdown (@pkmn/sim TeamValidator)
              </p>
              <div className="flex flex-wrap gap-1.5">
                {VERSUS_FORMATS.map((fmt) => (
                  <button
                    key={fmt.id}
                    type="button"
                    onClick={() => handleFormatChange(fmt.id)}
                    className={`rounded-xl border px-3 py-1.5 text-xs font-bold transition cursor-pointer ${
                      formatId === fmt.id
                        ? 'border-amber-400 bg-amber-500/20 text-amber-100 shadow'
                        : 'border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                    }`}
                  >
                    {fmt.shortLabel}
                  </button>
                ))}
              </div>
              <p className="mt-2 text-[11px] text-slate-400">
                <code className="text-sky-300">{spec.id}</code> — {spec.rulesHint}
              </p>
            </div>

            {/* Battle Mode & Open Teamsheet */}
            <div className="flex flex-col justify-between gap-2.5 border-t border-slate-800 pt-3 lg:col-span-5 lg:border-t-0 lg:border-l lg:pt-0 lg:pl-4">
              <div>
                <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-sky-300">
                  Modalidad de Combate
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => handleModeChange('vs-ai')}
                    className={`inline-flex items-center justify-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-bold transition cursor-pointer ${
                      mode === 'vs-ai'
                        ? 'border-sky-400 bg-sky-500/20 text-sky-100'
                        : 'border-slate-800 bg-slate-950 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Bot className="h-4 w-4" />
                    Jugador vs. IA
                  </button>
                  <button
                    type="button"
                    onClick={() => handleModeChange('hotseat')}
                    className={`inline-flex items-center justify-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-bold transition cursor-pointer ${
                      mode === 'hotseat'
                        ? 'border-amber-400 bg-amber-500/20 text-amber-100'
                        : 'border-slate-800 bg-slate-950 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Users className="h-4 w-4" />
                    P1 vs. P2 (Hotseat)
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 text-[11px]">
                <label className="inline-flex items-center gap-2 text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={openTeamsheet}
                    onChange={(e) => setOpenTeamsheet(e.target.checked)}
                    className="h-3.5 w-3.5 accent-amber-400"
                  />
                  <ClipboardList className="h-3.5 w-3.5 text-sky-300" />
                  <span>Open Teamsheet visible</span>
                </label>

                {mode === 'vs-ai' && (
                  <span className="inline-flex items-center gap-1 rounded-full border border-slate-700 bg-slate-950 px-2.5 py-0.5 text-[10px] text-slate-300">
                    <Cpu className="h-3 w-3 text-violet-300" />
                    IA Rival:{' '}
                    {aiSettings.enableLlmOpponent ? 'LLM Stateless' : 'Heurística (0 tokens)'}
                  </span>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* STEP 3 (Optional Expandable): localStorage Library & Cache */}
        {showLibrary && (
          <section className="mb-6 rounded-3xl border border-sky-400/35 bg-slate-900/80 p-5">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <h2 className="font-display text-base font-bold text-white">
                Biblioteca de Equipos Guardados (<code className="text-sky-300">localStorage</code>)
              </h2>
              <label className="inline-flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={libraryFilterOnlyFormat}
                  onChange={(e) => setLibraryFilterOnlyFormat(e.target.checked)}
                  className="h-3.5 w-3.5 accent-sky-400"
                />
                Solo formato actual ({formatId})
              </label>
            </div>

            {visibleLibrary.length === 0 ? (
              <p className="py-4 text-center text-xs text-slate-400">
                Aún no hay equipos guardados para este filtro. Genera un equipo para cachearlo automáticamente.
              </p>
            ) : (
              <div className="grid gap-3 md:grid-cols-2">
                {visibleLibrary.map((item) => (
                  <div
                    key={item.id}
                    className="flex flex-col justify-between rounded-2xl border border-slate-800 bg-slate-950/90 p-3.5"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="truncate text-xs font-extrabold text-white">
                          {item.teamName}
                        </span>
                        <span className="font-mono-code rounded border border-slate-700 bg-slate-900 px-1.5 py-0.5 text-[9px] text-sky-300">
                          {item.formatId} · {item.source}
                        </span>
                      </div>
                      <p className="mt-1 line-clamp-2 text-[11px] italic text-slate-400">
                        «{item.prompt}»
                      </p>
                      <div className="mt-2 flex flex-wrap gap-1">
                        {item.species.map((s, i) => (
                          <span
                            key={`${s}-${i}`}
                            className="rounded-md border border-slate-800 bg-slate-900 px-1.5 py-0.5 text-[10px] text-slate-200"
                          >
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="mt-3 flex items-center justify-between gap-2 border-t border-slate-800/80 pt-2.5">
                      <div className="flex gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleLoadFromLibrary('p1', item)}
                          className="rounded-lg border border-amber-400/40 bg-amber-500/15 px-2.5 py-1 text-[10px] font-bold text-amber-200 hover:bg-amber-500/25 cursor-pointer"
                        >
                          Cargar en P1
                        </button>
                        <button
                          type="button"
                          onClick={() => handleLoadFromLibrary('p2', item)}
                          className="rounded-lg border border-rose-400/40 bg-rose-500/15 px-2.5 py-1 text-[10px] font-bold text-rose-200 hover:bg-rose-500/25 cursor-pointer"
                        >
                          Cargar en P2
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDeleteSaved(item.id)}
                        className="rounded-lg p-1 text-slate-500 hover:bg-slate-800 hover:text-rose-400 cursor-pointer"
                        title="Eliminar de biblioteca"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* STEP 2: Dual Prompt Room */}
        <section className="mb-6 grid gap-5 lg:grid-cols-2">
          {renderPlayerCard('p1', p1, setP1)}
          {renderPlayerCard('p2', p2, setP2)}
        </section>

        {/* Launch Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-amber-400/35 bg-gradient-to-r from-amber-500/10 via-slate-900/90 to-rose-500/10 p-5">
          <div>
            <p className="font-display text-base font-bold text-white">
              {canStartBattle
                ? '¡Ambos equipos validados y listos para el estadio!'
                : 'Genera o carga ambos equipos para desbloquear el combate'}
            </p>
            <p className="text-xs text-slate-400">
              {mode === 'hotseat'
                ? 'Modo Hotseat Local: incluirá cortina de privacidad entre turnos de Jugador 1 y Jugador 2.'
                : 'Al terminar podrás abrir el Game Review estilo Chess.com y consultar al Coach en cualquier turno.'}
            </p>
          </div>

          <button
            type="button"
            disabled={!canStartBattle}
            onClick={handleLaunchVersus}
            className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-amber-500 to-yellow-500 px-7 py-3.5 text-sm font-extrabold text-slate-950 shadow-xl shadow-amber-500/25 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40 cursor-pointer"
          >
            <Swords className="h-4 w-4" />
            ¡Comenzar Combate Versus!
          </button>
        </div>
      </div>
    </div>
  );
};
