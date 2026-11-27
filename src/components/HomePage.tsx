import React, { useEffect, useMemo, useState } from 'react';
import type { User } from 'firebase/auth';
import {
  BookOpen,
  Cloud,
  CloudOff,
  Crown,
  Flame,
  FolderOpen,
  Music,
  Play,
  Save,
  Settings2,
  Share2,
  ShieldAlert,
  Skull,
  Trash2,
  Wrench,
} from 'lucide-react';
import { CHAPTERS } from '../data/chapters';
import {
  DIFFICULTY_META,
  DIFFICULTY_ORDER,
  VN_PACING_META,
} from '../data/economyCatalog';
import { getActiveProviderLabel } from '../engine/aiProvider';
import {
  buildDefeatTweetText,
  buildTwitterShareUrl,
  MAX_SAVE_SLOTS,
} from '../engine/saveSlots';
import type {
  AISettings,
  BattleDifficultyMode,
  PlayerSaveProfile,
  RunDeathSummary,
  SaveSlotRecord,
  VnPacingMode,
} from '../types/game';
import { CharacterPortrait } from './CharacterPortrait';

export interface NewRunLaunchOptions {
  runName: string;
  slotIndex: number;
  vnPacingMode: VnPacingMode;
  defaultDifficulty: BattleDifficultyMode;
  ironmanMode: boolean;
  nuzlockePermadeath: boolean;
}

interface HomePageProps {
  onContinueGame: () => void;
  onStartNewRun: (options: NewRunLaunchOptions) => void;
  onLoadSaveSlot: (slotIndex: number) => void;
  onDeleteSaveSlot: (slotIndex: number) => void;
  onOpenSaveLoadModal: () => void;
  onOpenChapters: () => void;
  onOpenVersus: () => void;
  onOpenShop: () => void;
  onOpenTeamEditor: () => void;
  onOpenArcade: () => void;
  onOpenAccount: () => void;
  onOpenAISettings: () => void;
  onOpenDevMode: () => void;
  onOpenCamp: () => void;
  profile: PlayerSaveProfile;
  saveSlots: Record<number, SaveSlotRecord>;
  runHistory: RunDeathSummary[];
  firebaseUser: User | null;
  cloudSyncStatus: 'local' | 'syncing' | 'synced' | 'error';
  aiSettings: AISettings;
}

type TitlePanelMode = 'main' | 'new-game' | 'load-game' | 'run-history' | 'submenu';

const SPLASH_TAGS = [
  'Monopolio Ditto!',
  'Slow Start? Nah.',
  'Bigotes de Acero!',
  '1v1 Me Bro!',
  'Cero Curación!',
];

export const HomePage: React.FC<HomePageProps> = ({
  onContinueGame,
  onStartNewRun,
  onLoadSaveSlot,
  onDeleteSaveSlot,
  onOpenSaveLoadModal,
  onOpenChapters,
  onOpenVersus,
  onOpenShop,
  onOpenTeamEditor,
  onOpenArcade,
  onOpenAccount,
  onOpenAISettings,
  onOpenDevMode,
  onOpenCamp,
  profile,
  saveSlots,
  runHistory,
  firebaseUser,
  cloudSyncStatus,
  aiSettings,
}) => {
  const [panel, setPanel] = useState<TitlePanelMode>('main');
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [subSelectedIdx, setSubSelectedIdx] = useState(0);
  const [splashIdx] = useState(() => Math.floor(Math.random() * SPLASH_TAGS.length));

  // New Run Configurator state (defaults to active profile preferences!)
  const [newRunName, setNewRunName] = useState('Exilio de Wyndon');
  const [newRunSlot, setNewRunSlot] = useState<number>(() => {
    for (let s = 1; s <= MAX_SAVE_SLOTS; s++) {
      if (!saveSlots[s]) return s;
    }
    return profile.activeSaveSlot ?? 1;
  });
  const [newVnMode, setNewVnMode] = useState<VnPacingMode>(
    profile.vnPacingMode ?? 'full'
  );
  const [newDifficulty, setNewDifficulty] = useState<BattleDifficultyMode>(
    profile.defaultDifficulty ?? 'kaizo'
  );
  const [newIronman, setNewIronman] = useState<boolean>(false);
  const [newNuzlocke, setNewNuzlocke] = useState<boolean>(false);

  const completedCount = Object.values(profile.completedChapters).filter(
    (p) => p?.completed
  ).length;
  const savedSlotCount = Object.keys(saveSlots).length;
  const activeDiffMeta =
    DIFFICULTY_META[profile.defaultDifficulty] ?? DIFFICULTY_META.kaizo;
  const activeVnMeta = VN_PACING_META[profile.vnPacingMode ?? 'full'];

  const mainMenuItems = useMemo(
    () => [
      {
        id: 'continue',
        label: 'Continue',
        hint: `Continúa tu partida activa ("${profile.runName || 'Exilio de Wyndon'}" · Slot #${profile.activeSaveSlot ?? 1}) directo al Selector de Capítulos.`,
        action: () => onContinueGame(),
      },
      {
        id: 'new-game',
        label: 'New Game',
        hint: 'Inicia una nueva run eligiendo modo de Novela Visual, dificultad (Baby Mode a Tryhard), Ironman y Nuzlocke.',
        action: () => setPanel('new-game'),
      },
      {
        id: 'load-game',
        label: 'Load Game',
        hint: `Carga o administra tus 5 ranuras de guardado (${savedSlotCount}/${MAX_SAVE_SLOTS} ocupadas).`,
        action: () => setPanel('load-game'),
      },
      {
        id: 'run-history',
        label: 'Run History',
        hint: `Revisa tu historial de caídas (${runHistory.length} registros) y comparte en X/Twitter en qué turno y contra qué Pokémon murió tu run.`,
        action: () => setPanel('run-history'),
      },
      {
        id: 'menu',
        label: 'Menu',
        hint: 'Abre el menú extendido: Mapa de Capítulos, Cajas PC, Vínculos, Tienda, Versus, Arcade, Cuenta y Dev Mode.',
        action: () => {
          setSubSelectedIdx(0);
          setPanel('submenu');
        },
      },
    ],
    [
      profile.runName,
      profile.activeSaveSlot,
      savedSlotCount,
      runHistory.length,
      onContinueGame,
    ]
  );

  const subMenuItems = useMemo(
    () => [
      {
        id: 'chapters',
        label: 'Selector de Capítulos',
        hint: 'Entra al Mapa Geopolítico ("el juego") con los 16 escenarios, Atlas Oscuro y Crónica CRU.',
        action: onOpenChapters,
      },
      {
        id: 'boxes',
        label: 'Cajas PC & Equipo',
        hint: 'Administra tus Pokémon únicos (uid), stock real de objetos, Casa R3 y Cementerio Nuzlocke.',
        action: onOpenTeamEditor,
      },
      {
        id: 'camp',
        label: 'Vínculos & Campamento',
        hint: 'Sube afinidad con los 13 romanceables, cultiva bayas Ironman y gestiona curación.',
        action: onOpenCamp,
      },
      {
        id: 'shop',
        label: 'Tienda & Shiny Charms',
        hint: `Gasta tus ${profile.coins.toLocaleString()} PC en Pokémon de tu Pokédex regional, objetos competitivos y Amuletos Shiny.`,
        action: onOpenShop,
      },
      {
        id: 'versus',
        label: 'Modo Versus',
        hint: 'Combates libres 1v1 / 2v2 / VGC / Hotseat contra IA o un amigo.',
        action: onOpenVersus,
      },
      {
        id: 'arcade',
        label: 'Arcade Flash',
        hint: 'Minijuegos rápidos para farmear PokéCoronas extra.',
        action: onOpenArcade,
      },
      {
        id: 'settings',
        label: 'Ajustes de IA',
        hint: `Configura el rival LLM u Offline (Actual: ${getActiveProviderLabel(aiSettings)}).`,
        action: onOpenAISettings,
      },
      {
        id: 'account',
        label: firebaseUser ? 'Cuenta (Conectada)' : 'Login / Cuenta Nube',
        hint: 'Inicia sesión para respaldar tu perfil en Firebase Cloud Firestore.',
        action: onOpenAccount,
      },
      {
        id: 'dev',
        label: profile.devModeEnabled ? 'Dev Mode (ON)' : 'Dev Mode',
        hint: 'Herramientas rápidas para desbloquear todo, agregar PC o reiniciar historia.',
        action: onOpenDevMode,
      },
      {
        id: 'back',
        label: '← Volver',
        hint: 'Regresa al menú principal de Crown of Galar.',
        action: () => setPanel('main'),
      },
    ],
    [
      profile.coins,
      profile.devModeEnabled,
      aiSettings,
      firebaseUser,
      onOpenChapters,
      onOpenTeamEditor,
      onOpenCamp,
      onOpenShop,
      onOpenVersus,
      onOpenArcade,
      onOpenAISettings,
      onOpenAccount,
      onOpenDevMode,
    ]
  );

  // Authentic PokéRogue keyboard navigation on Title Menu & Submenu!
  useEffect(() => {
    if (panel !== 'main' && panel !== 'submenu') return;
    const onKeyDown = (e: KeyboardEvent) => {
      const list = panel === 'main' ? mainMenuItems : subMenuItems;
      const curIdx = panel === 'main' ? selectedIdx : subSelectedIdx;
      const setIdx = panel === 'main' ? setSelectedIdx : setSubSelectedIdx;

      if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
        e.preventDefault();
        setIdx((curIdx + 1) % list.length);
      } else if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
        e.preventDefault();
        setIdx((curIdx - 1 + list.length) % list.length);
      } else if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        list[curIdx]?.action();
      } else if (e.key === 'Escape' && panel === 'submenu') {
        e.preventDefault();
        setPanel('main');
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [panel, mainMenuItems, subMenuItems, selectedIdx, subSelectedIdx]);

  const bottomHintText =
    panel === 'main'
      ? mainMenuItems[selectedIdx]?.hint
      : panel === 'submenu'
        ? subMenuItems[subSelectedIdx]?.hint
        : panel === 'new-game'
          ? 'Configura tu nueva run: ritmo de Novela Visual, dificultad (Baby Mode a Tryhard) y modificadores Ironman / Nuzlocke.'
          : panel === 'load-game'
            ? 'Selecciona una de las 5 ranuras para cargar tu partida o borrar runs anteriores.'
            : 'Historial de caídas y wipes de tus runs — comparte cualquiera directo en X / Twitter sin restricciones.';

  return (
    <div className="pokerogue-bands relative flex min-h-screen flex-col justify-between overflow-hidden text-slate-100 select-none">
      {/* Subtle royal ambient glow behind retro bands */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-28 left-1/2 h-80 w-[44rem] -translate-x-1/2 rounded-full bg-rose-600/15 blur-[110px]" />
        <div className="absolute bottom-10 left-10 h-64 w-64 rounded-full bg-amber-500/10 blur-[100px]" />
      </div>

      {/* Top Retro Utility Bar (PokéRogue Style) */}
      <header className="relative z-20 flex flex-wrap items-center justify-between gap-3 px-5 pt-4 sm:px-8">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            title="Ajustes de IA"
            onClick={onOpenAISettings}
            className="flex h-9 w-9 items-center justify-center rounded-lg border-2 border-slate-600/80 bg-[#1e182c] text-slate-300 transition hover:border-amber-400 hover:text-amber-200 cursor-pointer"
          >
            <Settings2 className="h-4 w-4" />
          </button>
          <button
            type="button"
            title="Guardar / Cargar Partida (5 Slots)"
            onClick={onOpenSaveLoadModal}
            className="flex h-9 w-9 items-center justify-center rounded-lg border-2 border-slate-600/80 bg-[#1e182c] text-amber-300 transition hover:border-amber-400 hover:text-white cursor-pointer"
          >
            <Save className="h-4 w-4" />
          </button>
          <button
            type="button"
            title="Dev Mode"
            onClick={onOpenDevMode}
            className={`flex h-9 w-9 items-center justify-center rounded-lg border-2 transition cursor-pointer ${
              profile.devModeEnabled
                ? 'border-fuchsia-400 bg-fuchsia-500/25 text-fuchsia-200'
                : 'border-slate-600/80 bg-[#1e182c] text-slate-300 hover:border-fuchsia-400'
            }`}
          >
            <Wrench className="h-4 w-4" />
          </button>
          <div className="hidden items-center gap-1.5 rounded-r-lg border-l-4 border-[#d9462f] bg-black/65 px-3 py-1.5 text-[11px] font-bold text-slate-200 sm:inline-flex">
            <Music className="h-3.5 w-3.5 text-amber-300" />
            <span className="font-pixel text-[10px]">
              Crown of Galar — Wyndon Exile
            </span>
          </div>
        </div>

        {/* Right Trainer Status (Logged in as...) */}
        <div className="flex flex-col items-end text-right">
          <button
            type="button"
            onClick={onOpenAccount}
            className="inline-flex items-center gap-1.5 font-pixel text-[10px] text-amber-200 hover:text-white cursor-pointer"
          >
            {firebaseUser ? (
              <Cloud className="h-3.5 w-3.5 text-emerald-400" />
            ) : (
              <CloudOff className="h-3.5 w-3.5 text-slate-400" />
            )}
            <span>
              Logged in as: {firebaseUser?.displayName || profile.displayName}
              {cloudSyncStatus === 'syncing' ? ' ...' : ''}
            </span>
          </button>
          <p className="mt-0.5 font-mono-code text-[10px] text-slate-400">
            Slot #{profile.activeSaveSlot ?? 1} · {completedCount}/{CHAPTERS.length} caps ·{' '}
            {activeDiffMeta.shortLabel}
            {profile.ironmanMode ? ' · Ironman' : ''}
            {profile.nuzlockePermadeath ? ' · Nuzlocke' : ''}
          </p>
        </div>
      </header>

      {/* Center PokéRogue Title Logo + Interactive Workspace */}
      <main className="relative z-10 mx-auto flex w-full max-w-6xl flex-1 flex-col justify-center px-5 py-4 sm:px-8">
        {/* Retro Title Logo + Tilted Splash */}
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="relative inline-block">
            <div className="flex items-center justify-center gap-2.5">
              <Crown className="h-8 w-8 text-amber-400 drop-shadow-[0_4px_0_#7f1d1d] sm:h-10 sm:w-10" />
              <h1
                className="font-pixel text-3xl font-bold tracking-wider text-[#58a6ff] sm:text-5xl"
                style={{
                  textShadow:
                    '0 4px 0 #9f1d28, 3px 3px 0 #9f1d28, -2px -2px 0 #1e1b4b, 0 10px 24px rgba(0,0,0,0.8)',
                }}
              >
                CROWN OF GALAR
              </h1>
            </div>
            <span className="animate-splash-bounce font-pixel absolute -bottom-3 -right-3 rounded bg-black/50 px-2 py-0.5 text-[10px] font-bold text-yellow-300 shadow sm:-right-8 sm:text-xs">
              {SPLASH_TAGS[splashIdx]}
            </span>
          </div>
          <p className="font-pixel mt-3 text-[10px] tracking-widest text-amber-200/80">
            v2.0 · POLITICAL POKÉMON VN &amp; TACTICAL SIMULATOR
          </p>
        </div>

        {/* Main Content Grid: Left Showcase / Configurator Panel + Right PokéRogue Menu Box */}
        <div className="grid items-start gap-6 lg:grid-cols-12">
          {/* LEFT 8 COLS: Context-dependent Panel (Active Run Card / New Game / Load Game / Run History) */}
          <div className="lg:col-span-8">
            {panel === 'new-game' ? (
              <div className="pokerogue-box rounded-2xl p-5">
                <div className="mb-4 flex flex-wrap items-center justify-between gap-2 border-b-2 border-[#d9462f]/50 pb-3">
                  <div>
                    <h2 className="font-pixel text-sm text-amber-300 sm:text-base">
                      ▶ NUEVA PARTIDA · CONFIGURACIÓN DE RUN
                    </h2>
                    <p className="mt-0.5 text-xs text-slate-300">
                      Arranca el Prólogo / Capítulo 01 y al terminarlo se abre el Mapa de Capítulos.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setPanel('main')}
                    className="font-pixel rounded-lg border border-slate-600 bg-slate-900 px-2.5 py-1 text-[10px] text-slate-300 hover:border-amber-400 hover:text-white cursor-pointer"
                  >
                    Cancelar
                  </button>
                </div>

                <div className="space-y-4">
                  {/* Run Name + Save Slot Picker */}
                  <div className="grid gap-3 sm:grid-cols-12">
                    <div className="sm:col-span-7">
                      <label className="font-pixel mb-1 block text-[10px] text-amber-200">
                        NOMBRE DE LA RUN
                      </label>
                      <input
                        type="text"
                        value={newRunName}
                        onChange={(e) => setNewRunName(e.target.value)}
                        maxLength={36}
                        placeholder="Ej. Nuzlocke Tryhard #1"
                        className="w-full rounded-lg border-2 border-slate-700 bg-[#140f20] px-3 py-2 text-xs font-bold text-white focus:border-amber-400 focus:outline-none"
                      />
                    </div>
                    <div className="sm:col-span-5">
                      <label className="font-pixel mb-1 block text-[10px] text-amber-200">
                        RANURA DE GUARDADO
                      </label>
                      <div className="grid grid-cols-5 gap-1">
                        {[1, 2, 3, 4, 5].map((s) => {
                          const occupied = Boolean(saveSlots[s]);
                          return (
                            <button
                              key={s}
                              type="button"
                              onClick={() => setNewRunSlot(s)}
                              className={`font-pixel rounded-lg border-2 py-2 text-[11px] transition cursor-pointer ${
                                newRunSlot === s
                                  ? 'border-amber-400 bg-amber-500/25 text-amber-100'
                                  : occupied
                                    ? 'border-rose-500/40 bg-rose-950/30 text-rose-200/80 hover:border-amber-300'
                                    : 'border-slate-700 bg-[#140f20] text-slate-300 hover:border-slate-500'
                              }`}
                              title={
                                occupied
                                  ? `Slot ${s} ocupado ("${saveSlots[s].runName}") — sobrescribirá`
                                  : `Slot ${s} vacío`
                              }
                            >
                              {s}
                              {occupied ? '•' : ''}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* 1. VN Pacing Mode */}
                  <div>
                    <p className="font-pixel mb-1.5 text-[10px] text-sky-300">
                      1. NOVELA VISUAL (RITMO DE HISTORIA)
                    </p>
                    <div className="grid gap-2 sm:grid-cols-3">
                      {(['full', 'decisions-only', 'skip-to-battle'] as VnPacingMode[]).map(
                        (modeId) => {
                          const m = VN_PACING_META[modeId];
                          const active = newVnMode === modeId;
                          return (
                            <button
                              key={modeId}
                              type="button"
                              onClick={() => setNewVnMode(modeId)}
                              className={`rounded-xl border-2 p-2.5 text-left transition cursor-pointer ${
                                active
                                  ? 'border-sky-400 bg-sky-500/20 text-white'
                                  : 'border-slate-700/80 bg-[#151022] text-slate-300 hover:border-slate-500'
                              }`}
                            >
                              <p className="text-xs font-extrabold">{m.label}</p>
                              <p className="mt-0.5 text-[10px] leading-snug text-slate-400">
                                {m.desc}
                              </p>
                            </button>
                          );
                        }
                      )}
                    </div>
                  </div>

                  {/* 2. 4-Tier Difficulty Setting */}
                  <div>
                    <p className="font-pixel mb-1.5 text-[10px] text-amber-300">
                      2. DIFICULTAD DE COMBATE
                    </p>
                    <div className="grid gap-2 sm:grid-cols-4">
                      {DIFFICULTY_ORDER.map((diffId) => {
                        const meta = DIFFICULTY_META[diffId];
                        const active = newDifficulty === diffId;
                        return (
                          <button
                            key={diffId}
                            type="button"
                            onClick={() => setNewDifficulty(diffId)}
                            className={`rounded-xl border-2 p-2.5 text-left transition cursor-pointer ${
                              active
                                ? diffId === 'nightmare'
                                  ? 'border-rose-400 bg-rose-500/25 text-white'
                                  : diffId === 'kaizo'
                                    ? 'border-amber-400 bg-amber-500/25 text-white'
                                    : diffId === 'standard'
                                      ? 'border-emerald-400 bg-emerald-500/20 text-white'
                                      : 'border-sky-400 bg-sky-500/20 text-white'
                                : 'border-slate-700/80 bg-[#151022] text-slate-300 hover:border-slate-500'
                            }`}
                          >
                            <p className="font-pixel text-[11px]">{meta.label}</p>
                            <p className="mt-1 text-[9.5px] leading-snug opacity-85">
                              {meta.subtitle}
                            </p>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* 3. Ironman & Nuzlocke Checkboxes */}
                  <div>
                    <p className="font-pixel mb-1.5 text-[10px] text-rose-300">
                      3. MODIFICADORES DE SUPERVIVENCIA (CHECKS OPCIONALES)
                    </p>
                    <div className="grid gap-2.5 sm:grid-cols-2">
                      <label
                        className={`flex cursor-pointer items-start gap-2.5 rounded-xl border-2 p-3 transition ${
                          newIronman
                            ? 'border-amber-400 bg-amber-500/15 text-white'
                            : 'border-slate-700/80 bg-[#151022] text-slate-300'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={newIronman}
                          onChange={(e) => setNewIronman(e.target.checked)}
                          className="mt-0.5 h-4 w-4 accent-amber-400"
                        />
                        <div>
                          <p className="flex items-center gap-1 text-xs font-extrabold">
                            <ShieldAlert className="h-3.5 w-3.5 text-amber-400" />
                            Modo Ironman (Sin Curación Gratis)
                          </p>
                          <p className="mt-0.5 text-[10px] text-slate-400">
                            PS, estados alterados y PP persisten entre capítulos. Cúrate en Campamento o con Bayas.
                          </p>
                        </div>
                      </label>

                      <label
                        className={`flex cursor-pointer items-start gap-2.5 rounded-xl border-2 p-3 transition ${
                          newNuzlocke
                            ? 'border-rose-400 bg-rose-500/20 text-white'
                            : 'border-slate-700/80 bg-[#151022] text-slate-300'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={newNuzlocke}
                          onChange={(e) => setNewNuzlocke(e.target.checked)}
                          className="mt-0.5 h-4 w-4 accent-rose-500"
                        />
                        <div>
                          <p className="flex items-center gap-1 text-xs font-extrabold">
                            <Skull className="h-3.5 w-3.5 text-rose-400" />
                            Modo Nuzlocke (Permadeath)
                          </p>
                          <p className="mt-0.5 text-[10px] text-slate-400">
                            Pokémon debilitado = Cementerio permanente 💀. Si te quedas con 0 vivos, muere la run.
                          </p>
                        </div>
                      </label>
                    </div>
                  </div>

                  {/* Launch New Run CTA */}
                  <div className="flex flex-wrap items-center justify-between gap-3 border-t-2 border-[#d9462f]/40 pt-3">
                    <span className="text-[11px] text-slate-400">
                      {saveSlots[newRunSlot]
                        ? `⚠️ Sobrescribirá Slot #${newRunSlot} ("${saveSlots[newRunSlot].runName}")`
                        : `✓ Se guardará en Slot #${newRunSlot}`}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        onStartNewRun({
                          runName: newRunName.trim() || `Run #${newRunSlot}`,
                          slotIndex: newRunSlot,
                          vnPacingMode: newVnMode,
                          defaultDifficulty: newDifficulty,
                          ironmanMode: newIronman,
                          nuzlockePermadeath: newNuzlocke,
                        })
                      }
                      className="font-pixel inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 px-5 py-2.5 text-xs font-bold text-slate-950 shadow-lg transition hover:brightness-110 cursor-pointer"
                    >
                      <Play className="h-4 w-4 fill-current" />
                      INICIAR PRÓLOGO / CAP. 01
                    </button>
                  </div>
                </div>
              </div>
            ) : panel === 'load-game' ? (
              <div className="pokerogue-box rounded-2xl p-5">
                <div className="mb-3 flex items-center justify-between border-b-2 border-[#d9462f]/50 pb-2.5">
                  <h2 className="font-pixel text-sm text-amber-300">
                    ▶ CARGAR PARTIDA (5 RANURAS)
                  </h2>
                  <button
                    type="button"
                    onClick={() => setPanel('main')}
                    className="font-pixel rounded-lg border border-slate-600 bg-slate-900 px-2.5 py-1 text-[10px] text-slate-300 hover:text-white cursor-pointer"
                  >
                    Volver
                  </button>
                </div>
                <div className="space-y-2">
                  {[1, 2, 3, 4, 5].map((s) => {
                    const rec = saveSlots[s];
                    const dMeta = rec
                      ? DIFFICULTY_META[rec.profile.defaultDifficulty] ??
                        DIFFICULTY_META.kaizo
                      : null;
                    return (
                      <div
                        key={s}
                        className={`flex flex-wrap items-center justify-between gap-2 rounded-xl border-2 px-3.5 py-2.5 ${
                          rec
                            ? 'border-slate-700 bg-[#151022]'
                            : 'border-dashed border-slate-800 bg-[#120d1d]/60'
                        }`}
                      >
                        <div>
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="font-pixel text-[10px] text-amber-300">
                              SLOT {s}
                            </span>
                            {rec && dMeta && (
                              <span
                                className={`rounded border px-1.5 py-0.2 text-[9px] font-bold ${dMeta.badgeClass}`}
                              >
                                {dMeta.shortLabel}
                              </span>
                            )}
                            {rec?.profile.ironmanMode && (
                              <span className="rounded bg-amber-500/20 px-1.5 py-0.2 text-[9px] font-bold text-amber-200">
                                Ironman
                              </span>
                            )}
                            {rec?.profile.nuzlockePermadeath && (
                              <span className="rounded bg-rose-500/20 px-1.5 py-0.2 text-[9px] font-bold text-rose-200">
                                Nuzlocke
                              </span>
                            )}
                            {rec?.isRunDead && (
                              <span className="rounded bg-rose-600/35 px-1.5 py-0.2 text-[9px] font-extrabold text-rose-100">
                                💀 MUERTA
                              </span>
                            )}
                          </div>
                          {rec ? (
                            <p className="mt-1 text-xs font-bold text-white">
                              {rec.runName}{' '}
                              <span className="font-normal text-slate-400">
                                · {rec.completedCount}/{CHAPTERS.length} caps ·{' '}
                                {rec.aliveCount} vivos · {rec.profile.coins.toLocaleString()} PC
                              </span>
                            </p>
                          ) : (
                            <p className="mt-1 text-[11px] text-slate-500">
                              Vacía — inicia una Nueva Partida para usarla.
                            </p>
                          )}
                        </div>
                        {rec && (
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => onLoadSaveSlot(s)}
                              className="font-pixel inline-flex items-center gap-1 rounded-lg bg-sky-500/25 px-3 py-1.5 text-[10px] text-sky-100 hover:bg-sky-500/35 cursor-pointer"
                            >
                              <FolderOpen className="h-3.5 w-3.5" />
                              Cargar
                            </button>
                            <button
                              type="button"
                              onClick={() => onDeleteSaveSlot(s)}
                              className="rounded-lg border border-rose-500/40 bg-rose-500/15 p-1.5 text-rose-200 hover:bg-rose-500/30 cursor-pointer"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : panel === 'run-history' ? (
              <div className="pokerogue-box rounded-2xl p-5">
                <div className="mb-3 flex items-center justify-between border-b-2 border-[#d9462f]/50 pb-2.5">
                  <h2 className="font-pixel text-sm text-rose-300">
                    ▶ RUN HISTORY · CAÍDAS Y WIPES ({runHistory.length})
                  </h2>
                  <button
                    type="button"
                    onClick={() => setPanel('main')}
                    className="font-pixel rounded-lg border border-slate-600 bg-slate-900 px-2.5 py-1 text-[10px] text-slate-300 hover:text-white cursor-pointer"
                  >
                    Volver
                  </button>
                </div>
                {runHistory.length === 0 ? (
                  <p className="rounded-xl border border-dashed border-slate-700 bg-[#151022] p-5 text-center text-xs text-slate-400">
                    Aún no hay derrotas ni wipes registrados. Cuando caigas en combate (en cualquier modo, sea Nuzlocke o no), quedará registrado aquí listo para presumir tu tragedia en X/Twitter.
                  </p>
                ) : (
                  <div className="max-h-72 space-y-2.5 overflow-y-auto pr-1">
                    {runHistory.map((item) => {
                      const tweet = buildDefeatTweetText(item);
                      const shareUrl = buildTwitterShareUrl(tweet);
                      const diffLabel =
                        DIFFICULTY_META[item.difficulty]?.label ?? item.difficulty;
                      return (
                        <div
                          key={item.id}
                          className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-rose-500/35 bg-[#161022] p-3"
                        >
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-1.5">
                              <span className="font-pixel text-[10px] text-rose-300">
                                {item.isTotalNuzlockeWipe
                                  ? '💀 WIPE NUZLOCKE'
                                  : '💀 DERROTA'}
                              </span>
                              <span className="rounded bg-slate-800 px-1.5 py-0.2 text-[9.5px] font-bold text-amber-200">
                                {diffLabel}
                              </span>
                              <span className="text-[10px] text-slate-400">
                                Turno {item.turn}
                              </span>
                            </div>
                            <p className="mt-1 text-xs font-bold text-white">
                              {item.runName} — {item.chapterLabel}
                            </p>
                            <p className="text-[11px] text-slate-300">
                              Verdugo:{' '}
                              <strong className="text-rose-200">
                                {item.killerSpecies}
                              </strong>{' '}
                              ({item.killerMove}) de {item.rivalName} vs.{' '}
                              {item.victimSpecies}
                            </p>
                          </div>
                          <a
                            href={shareUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 rounded-lg border border-sky-400/50 bg-black px-3 py-1.5 text-[11px] font-extrabold text-white hover:bg-slate-900"
                          >
                            <Share2 className="h-3.5 w-3.5 text-sky-400" />
                            Postear en 𝕏
                          </a>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ) : (
              /* DEFAULT LEFT SHOWCASE CARD: Atmospheric Face-off + Active Run Telemetry */
              <div className="pokerogue-box relative overflow-hidden rounded-2xl p-5">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-2.5">
                  <div className="flex items-center gap-2">
                    <BookOpen className="h-4 w-4 text-amber-400" />
                    <span className="font-pixel text-[10px] text-amber-200">
                      RUN ACTIVA: {profile.runName || 'Exilio de Wyndon'} (SLOT #{profile.activeSaveSlot ?? 1})
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    <span
                      className={`rounded border px-2 py-0.5 text-[9.5px] font-extrabold ${activeDiffMeta.badgeClass}`}
                    >
                      {activeDiffMeta.label}
                    </span>
                    <span className="rounded border border-sky-400/40 bg-sky-500/15 px-2 py-0.5 text-[9.5px] font-bold text-sky-200">
                      {activeVnMeta.shortLabel}
                    </span>
                    {profile.ironmanMode && (
                      <span className="rounded border border-amber-400/50 bg-amber-500/20 px-2 py-0.5 text-[9.5px] font-bold text-amber-100">
                        Ironman
                      </span>
                    )}
                    {profile.nuzlockePermadeath && (
                      <span className="rounded border border-rose-400/55 bg-rose-500/20 px-2 py-0.5 text-[9.5px] font-bold text-rose-100">
                        Nuzlocke
                      </span>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-11 items-end rounded-xl border border-slate-800/90 bg-gradient-to-b from-[#0f172e] to-[#080c17] px-3 pb-3 pt-4">
                  <div className="col-span-5 flex flex-col items-center">
                    <CharacterPortrait
                      charId="prince"
                      variant="sprite"
                      className="h-48 w-auto sm:h-56"
                    />
                    <p className="font-pixel mt-1 text-[10px] text-amber-200">
                      PRÍNCIPE HEREDERO
                    </p>
                  </div>
                  <div className="col-span-1 flex items-center justify-center self-center">
                    <span className="font-pixel text-base text-rose-400 sm:text-xl">
                      VS
                    </span>
                  </div>
                  <div className="col-span-5 flex flex-col items-center">
                    <CharacterPortrait
                      charId="assassin"
                      variant="sprite"
                      className="h-48 w-auto sm:h-56"
                    />
                    <p className="font-pixel mt-1 text-[10px] text-rose-300">
                      EL PELIRROJO
                    </p>
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-300">
                  <span>
                    <Flame className="mr-1 inline h-3.5 w-3.5 text-amber-400" />
                    Progreso: <strong>{completedCount}/{CHAPTERS.length}</strong> capítulos ·{' '}
                    <strong>{profile.pokemonBox.filter((m) => m.zone !== 'graveyard').length}</strong> Pokémon vivos ·{' '}
                    <strong className="text-amber-300">{profile.coins.toLocaleString()} PC</strong>
                  </span>
                  <span className="font-pixel text-[9px] text-slate-400">
                    ↑↓ / ENTER O CLIC
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* RIGHT 4 COLS: Classic PokéRogue Framed Command Menu Box */}
          <div className="lg:col-span-4">
            <div className="pokerogue-box rounded-xl p-3 sm:p-4">
              {panel === 'submenu' ? (
                <div className="space-y-1">
                  {subMenuItems.map((item, idx) => {
                    const active = subSelectedIdx === idx;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onMouseEnter={() => setSubSelectedIdx(idx)}
                        onClick={item.action}
                        className={`font-pixel flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs transition cursor-pointer ${
                          active
                            ? 'bg-white/10 text-amber-200'
                            : 'text-slate-200 hover:bg-white/5'
                        }`}
                      >
                        <span
                          className={`inline-block w-3 text-white transition-opacity ${
                            active ? 'opacity-100' : 'opacity-0'
                          }`}
                        >
                          ▶
                        </span>
                        <span>{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="space-y-1.5">
                  {mainMenuItems.map((item, idx) => {
                    const active =
                      (panel === 'main' && selectedIdx === idx) ||
                      (panel === 'new-game' && item.id === 'new-game') ||
                      (panel === 'load-game' && item.id === 'load-game') ||
                      (panel === 'run-history' && item.id === 'run-history');
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onMouseEnter={() => {
                          setSelectedIdx(idx);
                        }}
                        onClick={() => {
                          setSelectedIdx(idx);
                          item.action();
                        }}
                        className={`font-pixel flex w-full items-center gap-2.5 rounded-lg px-3.5 py-3 text-left text-sm transition cursor-pointer sm:text-base ${
                          active
                            ? 'bg-white/10 text-white'
                            : 'text-slate-300 hover:bg-white/5 hover:text-white'
                        }`}
                      >
                        <span
                          className={`inline-block w-3.5 text-white transition-opacity ${
                            active ? 'opacity-100' : 'opacity-0'
                          }`}
                        >
                          ▶
                        </span>
                        <span>{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Bottom PokéRogue Full-Width Crimson-Framed Dialogue / Instruction Strip */}
      <footer className="relative z-20 mx-3 mb-3 sm:mx-6 sm:mb-4">
        <div className="pokerogue-box mx-auto max-w-6xl rounded-xl px-5 py-3.5">
          <p className="font-pixel text-xs leading-relaxed text-white sm:text-sm">
            {bottomHintText}
          </p>
        </div>
      </footer>
    </div>
  );
};
