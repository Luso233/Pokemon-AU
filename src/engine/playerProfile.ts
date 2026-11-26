import { Dex, Teams } from '@pkmn/sim';
import {
  CHAPTER_UNLOCK_RULES,
  MAX_SHINY_CHARMS,
  POKEMON_CATALOG_MAP,
  SHINY_CHARM_PRICE,
  SHOP_ITEMS,
  SHOP_POKEMON,
  SHOP_TMS,
  STARTER_CUSTOM_TEAM,
  STARTER_INVENTORY,
  STARTER_UNLOCKED_CHAPTERS,
} from '../data/economyCatalog';
import type {
  BattleRewardSummary,
  ChapterProgress,
  CustomTeamMember,
  PlayerSaveProfile,
  StoryFlags,
} from '../types/game';
import {
  getFormatGeneration,
  getMoveSlotUnlockCost,
  getSpeciesKey,
  isMoveLegalForSpecies,
} from './learnsetService';
import { buildShowdownPaste, type ShowdownSetBlock } from './teamBuilderTree';

const PROFILE_STORAGE_KEY = 'galar-crown-profile-v2';
const LEGACY_PROGRESS_KEY = 'galar-crown-vn-progress-v1';

const EXTRA_DEV_ITEMS = [
  'Sitrus Berry',
  'Throat Spray',
  'Miracle Seed',
  'Weakness Policy',
  'Clear Amulet',
  'Safety Goggles',
  'Lum Berry',
  'Rusted Sword',
  'Griseous Core',
];

export function createDefaultProfile(
  displayName = 'Invitado de Galar',
  email = ''
): PlayerSaveProfile {
  return {
    displayName,
    email,
    coins: 1500,
    unlockedChapters: [...STARTER_UNLOCKED_CHAPTERS],
    completedChapters: {},
    inventory: {
      pokemon: [...STARTER_INVENTORY.pokemon],
      items: [...STARTER_INVENTORY.items],
      tms: [...STARTER_INVENTORY.tms],
      shinyCharms: STARTER_INVENTORY.shinyCharms,
    },
    customTeam: STARTER_CUSTOM_TEAM.map((m) => ({
      ...m,
      moves: [...m.moves],
    })),
    useCustomTeamInStory: false,
    unlockedMoveSlots: {},
    customMoves: {},
    customItems: {},
    devModeEnabled: false,
    updatedAt: new Date().toISOString(),
  };
}

function normalizeUnlockedMoveSlots(
  raw: Record<string, number[]> | undefined
): Record<string, number[]> {
  if (!raw || typeof raw !== 'object') return {};
  const result: Record<string, number[]> = {};
  for (const [spKey, slots] of Object.entries(raw)) {
    if (!Array.isArray(slots)) continue;
    const clean = Array.from(
      new Set(
        slots
          .map((n) => Math.floor(Number(n)))
          .filter((n) => Number.isInteger(n) && n >= 0 && n <= 3)
      )
    ).sort((a, b) => a - b);
    if (clean.length > 0) {
      result[getSpeciesKey(spKey)] = clean;
    }
  }
  return result;
}

function normalizeCustomMoves(
  raw: Record<string, Record<string, string>> | undefined
): Record<string, Record<string, string>> {
  if (!raw || typeof raw !== 'object') return {};
  const result: Record<string, Record<string, string>> = {};
  for (const [spKey, slotMap] of Object.entries(raw)) {
    if (!slotMap || typeof slotMap !== 'object') continue;
    const cleanMap: Record<string, string> = {};
    for (const [slotIdx, mvName] of Object.entries(slotMap)) {
      if (
        (slotIdx === '0' || slotIdx === '1' || slotIdx === '2' || slotIdx === '3') &&
        typeof mvName === 'string' &&
        mvName.trim().length > 0
      ) {
        cleanMap[slotIdx] = mvName.trim().slice(0, 40);
      }
    }
    if (Object.keys(cleanMap).length > 0) {
      result[getSpeciesKey(spKey)] = cleanMap;
    }
  }
  return result;
}

function normalizeCustomItems(
  raw: Record<string, string> | undefined
): Record<string, string> {
  if (!raw || typeof raw !== 'object') return {};
  const result: Record<string, string> = {};
  for (const [spKey, itemName] of Object.entries(raw)) {
    if (typeof itemName === 'string' && itemName.trim().length > 0) {
      result[getSpeciesKey(spKey)] = itemName.trim().slice(0, 60);
    }
  }
  return result;
}

export function normalizeProfile(
  raw: Partial<PlayerSaveProfile> | null | undefined
): PlayerSaveProfile {
  const base = createDefaultProfile();
  if (!raw) return base;

  const unlocked = Array.from(
    new Set([
      ...STARTER_UNLOCKED_CHAPTERS,
      ...(Array.isArray(raw.unlockedChapters) ? raw.unlockedChapters : []),
    ])
  );

  const inv = raw.inventory;
  const shinyCharms = Math.max(
    0,
    Math.min(MAX_SHINY_CHARMS, Math.floor(inv?.shinyCharms ?? 0))
  );

  const rawTeam =
    Array.isArray(raw.customTeam) && raw.customTeam.length > 0
      ? raw.customTeam.slice(0, 6)
      : base.customTeam;

  let shinyUsed = 0;
  const normalizedTeam: CustomTeamMember[] = rawTeam.map((m) => {
    const canBeShiny = Boolean(m.shiny) && shinyUsed < shinyCharms;
    if (canBeShiny) shinyUsed++;
    return {
      species: m.species || 'Arcanine',
      item: m.item || '',
      ability: m.ability || '',
      nature: m.nature || 'Adamant',
      teraType: m.teraType || 'Normal',
      moves:
        Array.isArray(m.moves) && m.moves.length > 0
          ? m.moves.slice(0, 4)
          : ['Protect'],
      shiny: canBeShiny,
    };
  });

  return {
    displayName: raw.displayName || base.displayName,
    email: raw.email || '',
    coins: Math.max(0, Math.min(10000000, Math.floor(raw.coins ?? base.coins))),
    unlockedChapters: unlocked,
    completedChapters: raw.completedChapters
      ? { ...raw.completedChapters }
      : {},
    inventory: {
      pokemon: Array.from(
        new Set([...STARTER_INVENTORY.pokemon, ...(inv?.pokemon ?? [])])
      ),
      items: Array.from(
        new Set([...STARTER_INVENTORY.items, ...(inv?.items ?? [])])
      ),
      tms: Array.from(
        new Set([...STARTER_INVENTORY.tms, ...(inv?.tms ?? [])])
      ),
      shinyCharms,
    },
    customTeam: normalizedTeam,
    useCustomTeamInStory: Boolean(raw.useCustomTeamInStory),
    unlockedMoveSlots: normalizeUnlockedMoveSlots(raw.unlockedMoveSlots),
    customMoves: normalizeCustomMoves(raw.customMoves),
    customItems: normalizeCustomItems(raw.customItems),
    devModeEnabled: Boolean(raw.devModeEnabled),
    updatedAt: raw.updatedAt || new Date().toISOString(),
  };
}

export function loadLocalProfile(): PlayerSaveProfile {
  try {
    if (typeof window === 'undefined') return createDefaultProfile();
    const raw = window.localStorage.getItem(PROFILE_STORAGE_KEY);
    if (raw) {
      return normalizeProfile(JSON.parse(raw) as Partial<PlayerSaveProfile>);
    }
    // Migrate legacy progress seamlessly if present
    const legacyRaw = window.localStorage.getItem(LEGACY_PROGRESS_KEY);
    if (legacyRaw) {
      const legacyProgress = JSON.parse(legacyRaw) as Record<
        string,
        ChapterProgress
      >;
      const migrated = createDefaultProfile();
      migrated.completedChapters = legacyProgress;
      const completedIds = Object.entries(legacyProgress)
        .filter(([, p]) => p.completed)
        .map(([id]) => id);
      migrated.unlockedChapters = Array.from(
        new Set([
          ...STARTER_UNLOCKED_CHAPTERS,
          ...completedIds,
          ...computeNewlyEligibleUnlocks(migrated),
        ])
      );
      migrated.coins = 1500 + completedIds.length * 500;
      return migrated;
    }
    return createDefaultProfile();
  } catch {
    return createDefaultProfile();
  }
}

export function saveLocalProfile(profile: PlayerSaveProfile): void {
  try {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile));
  } catch {
    // ignore storage errors
  }
}

export function mergeCloudAndLocalProfiles(
  local: PlayerSaveProfile,
  cloud: Partial<PlayerSaveProfile> | null
): PlayerSaveProfile {
  if (!cloud) return local;
  const normCloud = normalizeProfile(cloud);
  const mergedCompleted: Record<string, ChapterProgress> = {
    ...local.completedChapters,
  };
  for (const [id, cProg] of Object.entries(normCloud.completedChapters)) {
    const lProg = mergedCompleted[id];
    if (!lProg) {
      mergedCompleted[id] = cProg;
    } else {
      mergedCompleted[id] = {
        completed: lProg.completed || cProg.completed,
        victories: Math.max(lProg.victories ?? 0, cProg.victories ?? 0),
        attempts: Math.max(lProg.attempts ?? 0, cProg.attempts ?? 0),
        bestTurns:
          lProg.bestTurns && cProg.bestTurns
            ? Math.min(lProg.bestTurns, cProg.bestTurns)
            : cProg.bestTurns ?? lProg.bestTurns ?? null,
        lastOutcome: cProg.lastOutcome ?? lProg.lastOutcome,
        lastFlags: lProg.lastFlags ?? cProg.lastFlags,
      };
    }
  }

  // Union unlocked move slots per species
  const mergedSlots: Record<string, number[]> = { ...local.unlockedMoveSlots };
  for (const [spKey, slots] of Object.entries(normCloud.unlockedMoveSlots)) {
    mergedSlots[spKey] = Array.from(
      new Set([...(mergedSlots[spKey] ?? []), ...slots])
    ).sort((a, b) => a - b);
  }

  const mergedCustomMoves: Record<string, Record<string, string>> = {
    ...local.customMoves,
  };
  for (const [spKey, mvMap] of Object.entries(normCloud.customMoves)) {
    mergedCustomMoves[spKey] = {
      ...(mergedCustomMoves[spKey] ?? {}),
      ...mvMap,
    };
  }

  return normalizeProfile({
    displayName: normCloud.displayName || local.displayName,
    email: normCloud.email || local.email,
    coins: Math.max(normCloud.coins, local.coins),
    unlockedChapters: Array.from(
      new Set([...local.unlockedChapters, ...normCloud.unlockedChapters])
    ),
    completedChapters: mergedCompleted,
    inventory: {
      pokemon: Array.from(
        new Set([...local.inventory.pokemon, ...normCloud.inventory.pokemon])
      ),
      items: Array.from(
        new Set([...local.inventory.items, ...normCloud.inventory.items])
      ),
      tms: Array.from(
        new Set([...local.inventory.tms, ...normCloud.inventory.tms])
      ),
      shinyCharms: Math.max(
        local.inventory.shinyCharms,
        normCloud.inventory.shinyCharms
      ),
    },
    customTeam:
      normCloud.customTeam.length > 0 ? normCloud.customTeam : local.customTeam,
    useCustomTeamInStory:
      normCloud.useCustomTeamInStory ?? local.useCustomTeamInStory,
    unlockedMoveSlots: mergedSlots,
    customMoves: mergedCustomMoves,
    customItems: {
      ...local.customItems,
      ...normCloud.customItems,
    },
    devModeEnabled: local.devModeEnabled || normCloud.devModeEnabled,
    updatedAt: new Date().toISOString(),
  });
}

export function isChapterUnlocked(
  profile: PlayerSaveProfile,
  chapterId: string
): boolean {
  if (profile.devModeEnabled) return true;
  const rule = CHAPTER_UNLOCK_RULES[chapterId];
  if (rule?.unlockedByDefault) return true;
  if (profile.unlockedChapters.includes(chapterId)) return true;
  if (profile.completedChapters[chapterId]?.completed) return true;
  return false;
}

export function computeNewlyEligibleUnlocks(
  profile: PlayerSaveProfile
): string[] {
  const completedCount = Object.values(profile.completedChapters).filter(
    (p) => p.completed
  ).length;
  const newlyUnlocked: string[] = [];

  for (const rule of Object.values(CHAPTER_UNLOCK_RULES)) {
    if (isChapterUnlocked(profile, rule.chapterId)) continue;
    let eligible = false;
    if (
      rule.prerequisiteChapterIds &&
      rule.prerequisiteChapterIds.length > 0
    ) {
      eligible = rule.prerequisiteChapterIds.some(
        (reqId) => profile.completedChapters[reqId]?.completed
      );
    }
    if (
      typeof rule.minCompletedCount === 'number' &&
      completedCount >= rule.minCompletedCount
    ) {
      eligible = true;
    }
    if (eligible) {
      newlyUnlocked.push(rule.chapterId);
    }
  }
  return newlyUnlocked;
}

export function recordChapterAttemptInProfile(
  profile: PlayerSaveProfile,
  chapterId: string
): PlayerSaveProfile {
  const existing = profile.completedChapters[chapterId] ?? {
    completed: false,
    victories: 0,
    attempts: 0,
  };
  return {
    ...profile,
    completedChapters: {
      ...profile.completedChapters,
      [chapterId]: {
        ...existing,
        attempts: (existing.attempts ?? 0) + 1,
      },
    },
    updatedAt: new Date().toISOString(),
  };
}

export function applyBattleOutcomeToProfile(
  profile: PlayerSaveProfile,
  chapterId: string,
  won: boolean,
  turns: number,
  flags?: StoryFlags
): { nextProfile: PlayerSaveProfile; reward: BattleRewardSummary | null } {
  const existing = profile.completedChapters[chapterId] ?? {
    completed: false,
    victories: 0,
    attempts: 1,
  };
  const wasAlreadyCompleted = existing.completed;
  const attempts = Math.max(1, existing.attempts ?? 1);

  const nextRecord: ChapterProgress = {
    completed: existing.completed || won,
    victories: existing.victories + (won ? 1 : 0),
    attempts,
    bestTurns: won
      ? existing.bestTurns
        ? Math.min(existing.bestTurns, turns)
        : turns
      : existing.bestTurns ?? null,
    lastOutcome: won ? 'win' : 'loss',
    lastFlags: flags ?? existing.lastFlags,
  };

  let nextProfile: PlayerSaveProfile = {
    ...profile,
    completedChapters: {
      ...profile.completedChapters,
      [chapterId]: nextRecord,
    },
    updatedAt: new Date().toISOString(),
  };

  if (!won) {
    return { nextProfile, reward: null };
  }

  const rule = CHAPTER_UNLOCK_RULES[chapterId];
  const firstClearBonus = !wasAlreadyCompleted
    ? rule?.firstClearReward ?? 1500
    : 0;
  const replayBonus = wasAlreadyCompleted ? rule?.replayReward ?? 350 : 0;
  const lowResetBonus = !wasAlreadyCompleted && attempts <= 2 ? 400 : 0;
  const coinsEarned = firstClearBonus + replayBonus + lowResetBonus;

  // Story chapter held-item reward on first clear
  const rewardItems: string[] = [];
  let nextItems = nextProfile.inventory.items;
  if (
    !wasAlreadyCompleted &&
    rule?.rewardItem &&
    !nextItems.includes(rule.rewardItem)
  ) {
    nextItems = [...nextItems, rule.rewardItem];
    rewardItems.push(rule.rewardItem);
  }

  const newlyUnlocked = computeNewlyEligibleUnlocks(nextProfile);
  nextProfile = {
    ...nextProfile,
    coins: Math.min(10000000, nextProfile.coins + coinsEarned),
    unlockedChapters: Array.from(
      new Set([...nextProfile.unlockedChapters, chapterId, ...newlyUnlocked])
    ),
    inventory: {
      ...nextProfile.inventory,
      items: nextItems,
    },
  };

  return {
    nextProfile,
    reward: {
      coinsEarned,
      firstClearBonus,
      replayBonus,
      lowResetBonus,
      newlyUnlockedChapterIds: newlyUnlocked,
      rewardItems,
    },
  };
}

export function unlockChapterWithCoins(
  profile: PlayerSaveProfile,
  chapterId: string
): { ok: boolean; error?: string; nextProfile: PlayerSaveProfile } {
  if (isChapterUnlocked(profile, chapterId)) {
    return { ok: true, nextProfile: profile };
  }
  const rule = CHAPTER_UNLOCK_RULES[chapterId];
  const cost = rule?.unlockCostCoins ?? 1500;
  if (profile.coins < cost) {
    return {
      ok: false,
      error: `Necesitas ${cost.toLocaleString()} PokéCoronas (tienes ${profile.coins.toLocaleString()}).`,
      nextProfile: profile,
    };
  }
  return {
    ok: true,
    nextProfile: {
      ...profile,
      coins: profile.coins - cost,
      unlockedChapters: [...profile.unlockedChapters, chapterId],
      updatedAt: new Date().toISOString(),
    },
  };
}

export function purchasePokemon(
  profile: PlayerSaveProfile,
  species: string
): { ok: boolean; error?: string; nextProfile: PlayerSaveProfile } {
  const entry = SHOP_POKEMON.find((p) => p.species === species);
  if (!entry) return { ok: false, error: 'Pokémon no encontrado.', nextProfile: profile };
  if (profile.inventory.pokemon.includes(species)) {
    return { ok: false, error: 'Ya tienes este Pokémon.', nextProfile: profile };
  }
  if (profile.coins < entry.price) {
    return { ok: false, error: 'PokéCoronas insuficientes.', nextProfile: profile };
  }
  return {
    ok: true,
    nextProfile: {
      ...profile,
      coins: profile.coins - entry.price,
      inventory: {
        ...profile.inventory,
        pokemon: [...profile.inventory.pokemon, species],
      },
      updatedAt: new Date().toISOString(),
    },
  };
}

export function purchaseHeldItem(
  profile: PlayerSaveProfile,
  itemName: string
): { ok: boolean; error?: string; nextProfile: PlayerSaveProfile } {
  const entry = SHOP_ITEMS.find((i) => i.name === itemName);
  if (!entry) return { ok: false, error: 'Objeto no encontrado.', nextProfile: profile };
  if (profile.inventory.items.includes(itemName)) {
    return { ok: false, error: 'Ya tienes este objeto.', nextProfile: profile };
  }
  if (profile.coins < entry.price) {
    return { ok: false, error: 'PokéCoronas insuficientes.', nextProfile: profile };
  }
  return {
    ok: true,
    nextProfile: {
      ...profile,
      coins: profile.coins - entry.price,
      inventory: {
        ...profile.inventory,
        items: [...profile.inventory.items, itemName],
      },
      updatedAt: new Date().toISOString(),
    },
  };
}

export function purchaseTM(
  profile: PlayerSaveProfile,
  moveName: string
): { ok: boolean; error?: string; nextProfile: PlayerSaveProfile } {
  const entry = SHOP_TMS.find((t) => t.move === moveName);
  if (!entry) return { ok: false, error: 'MT no encontrada.', nextProfile: profile };
  if (profile.inventory.tms.includes(moveName)) {
    return { ok: false, error: 'Ya tienes esta MT.', nextProfile: profile };
  }
  if (profile.coins < entry.price) {
    return { ok: false, error: 'PokéCoronas insuficientes.', nextProfile: profile };
  }
  return {
    ok: true,
    nextProfile: {
      ...profile,
      coins: profile.coins - entry.price,
      inventory: {
        ...profile.inventory,
        tms: [...profile.inventory.tms, moveName],
      },
      updatedAt: new Date().toISOString(),
    },
  };
}

export function purchaseShinyCharm(profile: PlayerSaveProfile): {
  ok: boolean;
  error?: string;
  nextProfile: PlayerSaveProfile;
} {
  if (profile.inventory.shinyCharms >= MAX_SHINY_CHARMS) {
    return {
      ok: false,
      error: `Ya alcanzaste el máximo de ${MAX_SHINY_CHARMS} Amuletos Variocolor (1 por slot).`,
      nextProfile: profile,
    };
  }
  if (profile.coins < SHINY_CHARM_PRICE) {
    return {
      ok: false,
      error: `Cada Amuleto Variocolor cuesta ${SHINY_CHARM_PRICE.toLocaleString()} PokéCoronas.`,
      nextProfile: profile,
    };
  }
  return {
    ok: true,
    nextProfile: {
      ...profile,
      coins: profile.coins - SHINY_CHARM_PRICE,
      inventory: {
        ...profile.inventory,
        shinyCharms: profile.inventory.shinyCharms + 1,
      },
      updatedAt: new Date().toISOString(),
    },
  };
}

export function awardArcadeCoins(
  profile: PlayerSaveProfile,
  amount: number
): PlayerSaveProfile {
  const safeAmount = Math.max(0, Math.min(25000, Math.floor(amount)));
  if (safeAmount === 0) return profile;
  return {
    ...profile,
    coins: Math.min(10000000, profile.coins + safeAmount),
    updatedAt: new Date().toISOString(),
  };
}

/* ================= Narrative Teambuilder Move-Slot & Item Progression ================= */

export function isMoveSlotUnlocked(
  profile: PlayerSaveProfile,
  species: string,
  slotIndex: number
): boolean {
  if (profile.devModeEnabled) return true;
  const key = getSpeciesKey(species);
  const unlocked = profile.unlockedMoveSlots[key] ?? [];
  return unlocked.includes(slotIndex);
}

export function unlockMoveSlotForSpecies(
  profile: PlayerSaveProfile,
  species: string,
  slotIndex: number
): { ok: boolean; error?: string; nextProfile: PlayerSaveProfile } {
  if (slotIndex < 0 || slotIndex > 3) {
    return { ok: false, error: 'Slot de movimiento inválido.', nextProfile: profile };
  }
  const key = getSpeciesKey(species);
  const current = profile.unlockedMoveSlots[key] ?? [];
  if (current.includes(slotIndex)) {
    return { ok: true, nextProfile: profile };
  }
  const cost = profile.devModeEnabled ? 0 : getMoveSlotUnlockCost(slotIndex);
  if (profile.coins < cost) {
    return {
      ok: false,
      error: `Necesitas ${cost.toLocaleString()} PokéCoronas para desbloquear el Slot ${slotIndex + 1}.`,
      nextProfile: profile,
    };
  }
  const nextSlots = [...current, slotIndex].sort((a, b) => a - b);
  return {
    ok: true,
    nextProfile: {
      ...profile,
      coins: profile.coins - cost,
      unlockedMoveSlots: {
        ...profile.unlockedMoveSlots,
        [key]: nextSlots,
      },
      updatedAt: new Date().toISOString(),
    },
  };
}

export function setCustomMoveForSpecies(
  profile: PlayerSaveProfile,
  species: string,
  slotIndex: number,
  moveName: string
): { ok: boolean; error?: string; nextProfile: PlayerSaveProfile } {
  if (slotIndex < 0 || slotIndex > 3) {
    return { ok: false, error: 'Slot inválido.', nextProfile: profile };
  }
  if (!isMoveSlotUnlocked(profile, species, slotIndex)) {
    return {
      ok: false,
      error: `El Slot ${slotIndex + 1} de ${species} todavía está bloqueado.`,
      nextProfile: profile,
    };
  }
  const key = getSpeciesKey(species);
  const existing = profile.customMoves[key] ?? {};
  const nextSpeciesMoves = { ...existing };
  if (!moveName.trim()) {
    delete nextSpeciesMoves[String(slotIndex)];
  } else {
    nextSpeciesMoves[String(slotIndex)] = moveName.trim();
  }
  const nextAll = { ...profile.customMoves };
  if (Object.keys(nextSpeciesMoves).length === 0) {
    delete nextAll[key];
  } else {
    nextAll[key] = nextSpeciesMoves;
  }
  return {
    ok: true,
    nextProfile: {
      ...profile,
      customMoves: nextAll,
      updatedAt: new Date().toISOString(),
    },
  };
}

export function setCustomItemForSpecies(
  profile: PlayerSaveProfile,
  species: string,
  itemName: string
): PlayerSaveProfile {
  const key = getSpeciesKey(species);
  const nextItems = { ...profile.customItems };
  if (!itemName.trim()) {
    delete nextItems[key];
  } else {
    nextItems[key] = itemName.trim();
  }
  return {
    ...profile,
    customItems: nextItems,
    updatedAt: new Date().toISOString(),
  };
}

export function resetSpeciesCustomizations(
  profile: PlayerSaveProfile,
  species: string
): PlayerSaveProfile {
  const key = getSpeciesKey(species);
  const nextMoves = { ...profile.customMoves };
  delete nextMoves[key];
  const nextItems = { ...profile.customItems };
  delete nextItems[key];
  return {
    ...profile,
    customMoves: nextMoves,
    customItems: nextItems,
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Applies the player's narrative Teambuilder progression (inventory-restricted held items,
 * unlocked custom legal learnset moves, and owned Shiny Charms) onto the chapter's locked roster.
 */
export function applyChapterProgressionToPaste(
  canonicalPaste: string,
  profile: PlayerSaveProfile,
  formatId: string,
  shinySlotIndices: number[] = []
): string {
  const sets = Teams.import(canonicalPaste);
  if (!sets || sets.length === 0) return canonicalPaste;

  const isGen1 = getFormatGeneration(formatId) === 1;
  const chapterDefaultItems = new Set(
    sets.map((s) => s.item).filter((i): i is string => Boolean(i))
  );
  const allowedItems = new Set<string>([
    ...chapterDefaultItems,
    ...profile.inventory.items,
  ]);

  const allowedShinySlots = new Set(
    shinySlotIndices.slice(0, Math.max(0, profile.inventory.shinyCharms))
  );

  const updated = sets.map((set, idx) => {
    const key = getSpeciesKey(set.species);
    let item = set.item;
    if (!isGen1) {
      const overrideItem = profile.customItems[key];
      if (
        overrideItem &&
        (profile.devModeEnabled || allowedItems.has(overrideItem))
      ) {
        item = overrideItem;
      }
    } else {
      item = '';
    }

    const baseMoves = [...(set.moves ?? [])];
    const speciesOverrides = profile.customMoves[key] ?? {};
    const finalMoves = baseMoves.map((canonicalMove, slotIdx) => {
      const customMove = speciesOverrides[String(slotIdx)];
      if (
        customMove &&
        isMoveSlotUnlocked(profile, set.species, slotIdx) &&
        isMoveLegalForSpecies(set.species, customMove, formatId, baseMoves)
      ) {
        return customMove;
      }
      return canonicalMove;
    });

    // Prevent duplicate moves cleanly
    const dedupedMoves: string[] = [];
    for (let i = 0; i < finalMoves.length; i++) {
      const candidate = finalMoves[i];
      if (
        !dedupedMoves.some(
          (m) => m.toLowerCase() === candidate.toLowerCase()
        )
      ) {
        dedupedMoves.push(candidate);
      } else if (
        baseMoves[i] &&
        !dedupedMoves.some(
          (m) => m.toLowerCase() === baseMoves[i].toLowerCase()
        )
      ) {
        dedupedMoves.push(baseMoves[i]);
      }
    }

    return {
      ...set,
      item,
      moves: dedupedMoves.length > 0 ? dedupedMoves : baseMoves,
      shiny: allowedShinySlots.has(idx) ? true : set.shiny || undefined,
    };
  });

  return Teams.export(updated).trim();
}

/* ================= Dev Mode Sandbox Helpers ================= */

export function applyDevUnlockEverything(
  profile: PlayerSaveProfile
): PlayerSaveProfile {
  const allChapters = Object.keys(CHAPTER_UNLOCK_RULES);
  const allPokemon = Array.from(
    new Set([
      ...STARTER_INVENTORY.pokemon,
      ...SHOP_POKEMON.map((p) => p.species),
      ...profile.inventory.pokemon,
    ])
  );
  const allItems = Array.from(
    new Set([
      ...STARTER_INVENTORY.items,
      ...SHOP_ITEMS.map((i) => i.name),
      ...Object.values(CHAPTER_UNLOCK_RULES)
        .map((r) => r.rewardItem)
        .filter((x): x is string => Boolean(x)),
      ...EXTRA_DEV_ITEMS,
      ...profile.inventory.items,
    ])
  );
  const allTms = Array.from(
    new Set([
      ...STARTER_INVENTORY.tms,
      ...SHOP_TMS.map((t) => t.move),
      ...profile.inventory.tms,
    ])
  );

  const unlockedMoveSlots: Record<string, number[]> = {
    ...profile.unlockedMoveSlots,
  };
  for (const sp of allPokemon) {
    unlockedMoveSlots[getSpeciesKey(sp)] = [0, 1, 2, 3];
  }

  return {
    ...profile,
    coins: 9999999,
    unlockedChapters: allChapters,
    inventory: {
      pokemon: allPokemon,
      items: allItems,
      tms: allTms,
      shinyCharms: MAX_SHINY_CHARMS,
    },
    unlockedMoveSlots,
    devModeEnabled: true,
    updatedAt: new Date().toISOString(),
  };
}

export function addDevCoins(
  profile: PlayerSaveProfile,
  amount = 1000000
): PlayerSaveProfile {
  return {
    ...profile,
    coins: Math.min(9999999, profile.coins + Math.max(0, Math.floor(amount))),
    updatedAt: new Date().toISOString(),
  };
}

export function setDevModeEnabled(
  profile: PlayerSaveProfile,
  enabled: boolean
): PlayerSaveProfile {
  return {
    ...profile,
    devModeEnabled: enabled,
    updatedAt: new Date().toISOString(),
  };
}

export function resetStoryProgress(
  profile: PlayerSaveProfile
): PlayerSaveProfile {
  try {
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(LEGACY_PROGRESS_KEY);
    }
  } catch {
    // ignore storage errors
  }
  return createDefaultProfile(profile.displayName, profile.email);
}

/* ================= Custom Team Editor Helpers ================= */

export function buildDefaultMemberForSpecies(species: string): CustomTeamMember {
  const cat = POKEMON_CATALOG_MAP.get(species.toLowerCase());
  const starterMatch = STARTER_CUSTOM_TEAM.find(
    (s) => s.species.toLowerCase() === species.toLowerCase()
  );
  if (starterMatch) {
    return { ...starterMatch, moves: [...starterMatch.moves], shiny: false };
  }
  if (cat) {
    return {
      species: cat.species,
      item: 'Leftovers',
      ability: cat.defaultAbility,
      nature: cat.defaultNature,
      teraType: cat.defaultTeraType,
      moves: [...cat.defaultMoves],
      shiny: false,
    };
  }
  const sp = Dex.species.get(species);
  return {
    species: sp.exists ? sp.name : species,
    item: 'Leftovers',
    ability: sp.abilities?.[0] || 'Pressure',
    nature: 'Adamant',
    teraType: sp.types?.[0] || 'Normal',
    moves: ['Protect', 'Body Press', 'Scald', 'Will-O-Wisp'],
    shiny: false,
  };
}

export function updateCustomTeamSlot(
  profile: PlayerSaveProfile,
  slotIndex: number,
  updated: CustomTeamMember
): { ok: boolean; error?: string; nextProfile: PlayerSaveProfile } {
  if (slotIndex < 0 || slotIndex >= 6) {
    return { ok: false, error: 'Slot inválido.', nextProfile: profile };
  }
  const nextTeam = [...profile.customTeam];
  nextTeam[slotIndex] = {
    ...updated,
    moves: updated.moves.filter(Boolean).slice(0, 4),
  };

  const activeShinies = nextTeam.filter((m) => m.shiny).length;
  if (activeShinies > profile.inventory.shinyCharms) {
    return {
      ok: false,
      error: `Solo tienes ${profile.inventory.shinyCharms} Amuleto(s) Variocolor. Compra más en la Tienda (máx. 6).`,
      nextProfile: profile,
    };
  }

  return {
    ok: true,
    nextProfile: {
      ...profile,
      customTeam: nextTeam,
      updatedAt: new Date().toISOString(),
    },
  };
}

export function compileCustomTeamToShowdownPaste(
  team: CustomTeamMember[],
  level = 100
): string {
  const blocks: ShowdownSetBlock[] = team.slice(0, 6).map((m) => {
    const sp = Dex.species.get(m.species);
    const usesSpecial = (sp.baseStats?.spa ?? 80) > (sp.baseStats?.atk ?? 80);
    const hasFrustration = m.moves.some(
      (mv) => mv.toLowerCase() === 'frustration'
    );
    return {
      species: m.species,
      item: m.item || undefined,
      ability: m.ability || sp.abilities?.[0] || undefined,
      level,
      happiness: hasFrustration ? 0 : undefined,
      shiny: m.shiny || undefined,
      teraType: m.teraType || sp.types?.[0] || 'Normal',
      evs: usesSpecial
        ? '4 HP / 252 SpA / 252 Spe'
        : '4 HP / 252 Atk / 252 Spe',
      nature: m.nature || (usesSpecial ? 'Timid' : 'Jolly'),
      moves: m.moves.length > 0 ? m.moves.slice(0, 4) : ['Protect'],
    };
  });
  return buildShowdownPaste(blocks);
}

/**
 * Applies owned Shiny Charms onto selected slots (0-based) of any existing Showdown paste
 * without altering EVs, levels, items, or moves.
 */
export function applyShinySlotsToPaste(
  paste: string,
  shinySlotIndices: number[],
  maxCharms: number
): string {
  const sets = Teams.import(paste);
  if (!sets || sets.length === 0) return paste;
  const allowed = new Set(shinySlotIndices.slice(0, Math.max(0, maxCharms)));
  const updated = sets.map((s, idx) => ({
    ...s,
    shiny: allowed.has(idx) ? true : undefined,
  }));
  return Teams.export(updated).trim();
}
