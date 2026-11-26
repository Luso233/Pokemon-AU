import { DIFFICULTY_META } from '../data/economyCatalog';
import type {
  BattleDifficultyMode,
  BattleFatalBlow,
  PlayerSaveProfile,
  RunDeathSummary,
  SaveSlotRecord,
} from '../types/game';
import { normalizeProfile } from './playerProfile';

const SAVE_SLOTS_KEY = 'galar-crown-save-slots-v1';
const RUN_HISTORY_KEY = 'galar-crown-run-history-v1';
export const MAX_SAVE_SLOTS = 5;

export function countAliveBoxPokemon(profile: PlayerSaveProfile): number {
  return profile.pokemonBox.filter(
    (m) => m.zone === 'party' || m.zone === 'box' || m.zone === 'house'
  ).length;
}

export function countCompletedChapters(profile: PlayerSaveProfile): number {
  return Object.values(profile.completedChapters).filter((p) => p?.completed)
    .length;
}

export function loadSaveSlots(): Record<number, SaveSlotRecord> {
  try {
    if (typeof window === 'undefined') return {};
    const raw = window.localStorage.getItem(SAVE_SLOTS_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, SaveSlotRecord>;
    const clean: Record<number, SaveSlotRecord> = {};
    for (const [k, rec] of Object.entries(parsed)) {
      const idx = Number(k);
      if (idx >= 1 && idx <= MAX_SAVE_SLOTS && rec && rec.profile) {
        const normProf = normalizeProfile(rec.profile);
        clean[idx] = {
          slotIndex: idx,
          runName: rec.runName || normProf.runName || `Run #${idx}`,
          savedAt: rec.savedAt || normProf.updatedAt,
          profile: { ...normProf, activeSaveSlot: idx },
          completedCount: countCompletedChapters(normProf),
          aliveCount: countAliveBoxPokemon(normProf),
          isRunDead: Boolean(rec.isRunDead),
          lastDeath: rec.lastDeath ?? null,
        };
      }
    }
    return clean;
  } catch {
    return {};
  }
}

export function persistSaveSlots(slots: Record<number, SaveSlotRecord>): void {
  try {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(SAVE_SLOTS_KEY, JSON.stringify(slots));
  } catch {
    // ignore storage errors
  }
}

export function saveProfileToSlot(
  profile: PlayerSaveProfile,
  slotIndex: number,
  extra?: { isRunDead?: boolean; lastDeath?: RunDeathSummary | null }
): Record<number, SaveSlotRecord> {
  const safeSlot = Math.max(1, Math.min(MAX_SAVE_SLOTS, Math.floor(slotIndex)));
  const current = loadSaveSlots();
  const prevRec = current[safeSlot];
  const normalized = normalizeProfile({
    ...profile,
    activeSaveSlot: safeSlot,
    runName: profile.runName || prevRec?.runName || `Run #${safeSlot}`,
    updatedAt: new Date().toISOString(),
  });
  const aliveCount = countAliveBoxPokemon(normalized);
  const isRunDead =
    extra?.isRunDead ??
    (normalized.nuzlockePermadeath && aliveCount === 0);

  const nextSlots: Record<number, SaveSlotRecord> = {
    ...current,
    [safeSlot]: {
      slotIndex: safeSlot,
      runName: normalized.runName || `Run #${safeSlot}`,
      savedAt: normalized.updatedAt,
      profile: normalized,
      completedCount: countCompletedChapters(normalized),
      aliveCount,
      isRunDead,
      lastDeath: extra?.lastDeath !== undefined ? extra.lastDeath : prevRec?.lastDeath ?? null,
    },
  };
  persistSaveSlots(nextSlots);
  return nextSlots;
}

export function deleteSaveSlot(
  slotIndex: number
): Record<number, SaveSlotRecord> {
  const current = loadSaveSlots();
  delete current[slotIndex];
  persistSaveSlots(current);
  return current;
}

export function loadRunHistory(): RunDeathSummary[] {
  try {
    if (typeof window === 'undefined') return [];
    const raw = window.localStorage.getItem(RUN_HISTORY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as RunDeathSummary[]).slice(0, 30) : [];
  } catch {
    return [];
  }
}

export function appendRunHistoryEntry(
  entry: RunDeathSummary
): RunDeathSummary[] {
  const list = [entry, ...loadRunHistory()].slice(0, 30);
  try {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(RUN_HISTORY_KEY, JSON.stringify(list));
    }
  } catch {
    // ignore storage errors
  }
  return list;
}

/**
 * Builds the exact shareable Run Death / Defeat record (works for Nuzlocke wipes AND regular defeats alike!).
 */
export function buildRunDeathSummary(params: {
  runName: string;
  chapterId: string;
  chapterLabel: string;
  turn: number;
  difficulty: BattleDifficultyMode;
  ironmanMode: boolean;
  nuzlockePermadeath: boolean;
  isTotalNuzlockeWipe: boolean;
  rivalName: string;
  fatalBlow?: BattleFatalBlow | null;
  fallbackKillerSpecies?: string;
  fallbackVictimSpecies?: string;
}): RunDeathSummary {
  return {
    id: `death-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    runName: params.runName || 'Run sin nombre',
    chapterId: params.chapterId,
    chapterLabel: params.chapterLabel,
    turn: Math.max(1, params.turn),
    difficulty: params.difficulty,
    ironmanMode: params.ironmanMode,
    nuzlockePermadeath: params.nuzlockePermadeath,
    isTotalNuzlockeWipe: params.isTotalNuzlockeWipe,
    killerSpecies:
      params.fatalBlow?.attackerSpecies ||
      params.fallbackKillerSpecies ||
      params.rivalName,
    killerMove: params.fatalBlow?.moveName || 'el golpe final',
    rivalName: params.rivalName,
    victimSpecies:
      params.fatalBlow?.victimSpecies ||
      params.fallbackVictimSpecies ||
      'mi último Pokémon',
    recordedAt: new Date().toISOString(),
  };
}

/**
 * Generates a punchy, funny X/Twitter post summarizing EXACTLY where and how your run/battle died!
 * Never gated behind Ironman or Nuzlocke — everyone can share their glorious humiliation!
 */
export function buildDefeatTweetText(summary: RunDeathSummary): string {
  const diffLabel = DIFFICULTY_META[summary.difficulty]?.label ?? summary.difficulty;
  const rulesParts: string[] = [diffLabel];
  if (summary.ironmanMode) rulesParts.push('Ironman');
  if (summary.nuzlockePermadeath) rulesParts.push('Nuzlocke');
  const rulesTag = rulesParts.join(' + ');

  const moveClause =
    summary.killerMove && summary.killerMove !== 'el golpe final'
      ? ` con ${summary.killerMove}`
      : '';

  if (summary.isTotalNuzlockeWipe) {
    return (
      `💀 MI RUN DE NUZLOCKE MURIÓ POR COMPLETO (0 Pokémon vivos) en Crown of Galar!\n` +
      `📍 Capítulo: ${summary.chapterLabel}\n` +
      `⏱️ Turno ${summary.turn} · ⚙️ ${rulesTag}\n` +
      `⚔️ Verdugo: ${summary.killerSpecies} de ${summary.rivalName} remató a mi ${summary.victimSpecies}${moveClause}.\n` +
      `Descansa en paz, "${summary.runName}". #CrownOfGalar #PokemonAU`
    );
  }

  return (
    `💀 Mi run "${summary.runName}" se estrelló en Crown of Galar!\n` +
    `📍 Capítulo: ${summary.chapterLabel}\n` +
    `⏱️ Turno ${summary.turn} · ⚙️ ${rulesTag}\n` +
    `⚔️ Golpe final: ${summary.killerSpecies} (${summary.rivalName}) mandó al lobby a mi ${summary.victimSpecies}${moveClause}.\n` +
    `#CrownOfGalar #PokemonAU`
  );
}

export function buildTwitterShareUrl(tweetText: string): string {
  return `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}`;
}
