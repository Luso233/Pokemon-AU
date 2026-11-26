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
import {
  computeActiveSocialLinkPerks,
  getRomanceNpcById,
} from '../data/socialLinksCatalog';
import type {
  BattleDifficultyMode,
  BattleRewardSummary,
  BerryKind,
  CampBerryPlot,
  ChapterProgress,
  CustomTeamMember,
  OwnedPokemonInstance,
  PersistedPartyState,
  PlayerSaveProfile,
  PokemonStorageZone,
  SocialLinkProgress,
  SocialLinkRank,
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

function buildStarterPokemonBox(): OwnedPokemonInstance[] {
  return STARTER_CUSTOM_TEAM.map((m, idx) => ({
    uid: `starter-${idx}-${getSpeciesKey(m.species)}`,
    species: m.species,
    origin: 'Escolta Real de Galar',
    zone: 'party' as const,
    item: m.item,
    ability: m.ability,
    nature: m.nature,
    teraType: m.teraType,
    moves: [...m.moves],
    shiny: false,
    hp: null,
    maxhp: null,
    status: '',
  }));
}

function buildStarterItemStock(): Record<string, number> {
  const stock: Record<string, number> = {};
  for (const item of STARTER_INVENTORY.items) {
    stock[item] = Math.max(1, stock[item] ?? 0);
  }
  for (const m of STARTER_CUSTOM_TEAM) {
    if (m.item) stock[m.item] = Math.max(1, stock[m.item] ?? 0);
  }
  return stock;
}

export function syncCustomTeamFromBox(
  box: OwnedPokemonInstance[]
): CustomTeamMember[] {
  const party = box.filter((m) => m.zone === 'party').slice(0, 6);
  return party.map((m) => ({
    species: m.species,
    item: m.item,
    ability: m.ability,
    nature: m.nature,
    teraType: m.teraType,
    moves: [...m.moves],
    shiny: m.shiny,
  }));
}

export function createDefaultProfile(
  displayName = 'Invitado de Galar',
  email = ''
): PlayerSaveProfile {
  const starterBox = buildStarterPokemonBox();
  return {
    displayName,
    email,
    runName: 'Exilio de Wyndon',
    activeSaveSlot: 1,
    vnPacingMode: 'full',
    hasStartedRun: false,
    coins: 1500,
    unlockedChapters: [...STARTER_UNLOCKED_CHAPTERS],
    completedChapters: {},
    inventory: {
      pokemon: [...STARTER_INVENTORY.pokemon],
      items: [...STARTER_INVENTORY.items],
      tms: [...STARTER_INVENTORY.tms],
      shinyCharms: STARTER_INVENTORY.shinyCharms,
    },
    customTeam: syncCustomTeamFromBox(starterBox),
    useCustomTeamInStory: false,
    unlockedMoveSlots: {},
    customMoves: {},
    customItems: {},
    devModeEnabled: false,
    socialLinks: {},
    firstRomanceMaxedId: null,
    ironmanMode: false,
    nuzlockePermadeath: false,
    defaultDifficulty: 'kaizo',
    ironmanPartyState: null,
    fallenPokemon: [],
    campGarden: [
      { plotIndex: 0, berry: null, battlesLeft: 0 },
      { plotIndex: 1, berry: null, battlesLeft: 0 },
    ],
    campBerries: { lum: 2, sitrus: 2, leppa: 1 },
    freeEmergencyHeals: 0,
    pokemonBox: starterBox,
    itemStock: buildStarterItemStock(),
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
    runName: raw.runName || base.runName,
    activeSaveSlot:
      typeof raw.activeSaveSlot === 'number' &&
      raw.activeSaveSlot >= 1 &&
      raw.activeSaveSlot <= 5
        ? Math.floor(raw.activeSaveSlot)
        : 1,
    vnPacingMode:
      raw.vnPacingMode === 'full' ||
      raw.vnPacingMode === 'decisions-only' ||
      raw.vnPacingMode === 'skip-to-battle'
        ? raw.vnPacingMode
        : 'full',
    hasStartedRun:
      raw.hasStartedRun !== undefined
        ? Boolean(raw.hasStartedRun)
        : Object.keys(raw.completedChapters ?? {}).length > 0,
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
    socialLinks:
      raw.socialLinks && typeof raw.socialLinks === 'object'
        ? { ...raw.socialLinks }
        : {},
    firstRomanceMaxedId:
      typeof raw.firstRomanceMaxedId === 'string' && raw.firstRomanceMaxedId
        ? raw.firstRomanceMaxedId
        : null,
    ironmanMode: Boolean(raw.ironmanMode),
    nuzlockePermadeath: Boolean(raw.nuzlockePermadeath),
    defaultDifficulty:
      raw.defaultDifficulty === 'baby' ||
      raw.defaultDifficulty === 'standard' ||
      raw.defaultDifficulty === 'nightmare' ||
      raw.defaultDifficulty === 'kaizo'
        ? raw.defaultDifficulty
        : 'kaizo',
    ironmanPartyState: raw.ironmanPartyState ?? null,
    fallenPokemon: Array.isArray(raw.fallenPokemon)
      ? Array.from(new Set(raw.fallenPokemon.map((s) => getSpeciesKey(s))))
      : [],
    campGarden:
      Array.isArray(raw.campGarden) && raw.campGarden.length >= 2
        ? raw.campGarden.map((p, idx) => ({
            plotIndex: idx,
            berry:
              p?.berry === 'lum' || p?.berry === 'sitrus' || p?.berry === 'leppa'
                ? p.berry
                : null,
            battlesLeft: Math.max(0, Math.floor(Number(p?.battlesLeft ?? 0))),
          }))
        : base.campGarden,
    campBerries: {
      lum: Math.max(0, Math.floor(Number(raw.campBerries?.lum ?? 2))),
      sitrus: Math.max(0, Math.floor(Number(raw.campBerries?.sitrus ?? 2))),
      leppa: Math.max(0, Math.floor(Number(raw.campBerries?.leppa ?? 1))),
    },
    freeEmergencyHeals: Math.max(
      0,
      Math.floor(Number(raw.freeEmergencyHeals ?? 0))
    ),
    pokemonBox: (() => {
      if (Array.isArray(raw.pokemonBox) && raw.pokemonBox.length > 0) {
        const seenUids = new Set<string>();
        const cleaned: OwnedPokemonInstance[] = [];
        for (let i = 0; i < raw.pokemonBox.length; i++) {
          const inst = raw.pokemonBox[i];
          if (!inst || !inst.species) continue;
          const uid = inst.uid && !seenUids.has(inst.uid) ? inst.uid : `mon-${i}-${getSpeciesKey(inst.species)}`;
          seenUids.add(uid);
          cleaned.push({
            uid,
            species: inst.species,
            nickname: inst.nickname,
            origin: inst.origin || 'Escolta Real de Galar',
            zone:
              inst.zone === 'party' ||
              inst.zone === 'box' ||
              inst.zone === 'house' ||
              inst.zone === 'graveyard'
                ? inst.zone
                : 'box',
            item: inst.item || '',
            ability: inst.ability || '',
            nature: inst.nature || 'Adamant',
            teraType: inst.teraType || 'Normal',
            moves:
              Array.isArray(inst.moves) && inst.moves.length > 0
                ? inst.moves.slice(0, 4)
                : ['Protect'],
            shiny: Boolean(inst.shiny),
            hp: typeof inst.hp === 'number' ? inst.hp : null,
            maxhp: typeof inst.maxhp === 'number' ? inst.maxhp : null,
            status: inst.status || '',
            ppByMoveId: inst.ppByMoveId ? { ...inst.ppByMoveId } : undefined,
            epitaph: inst.epitaph,
          });
        }
        return cleaned;
      }
      // Migrate legacy flat save into unique per-individual PC Box instances!
      const migrated: OwnedPokemonInstance[] = normalizedTeam.map((m, idx) => ({
        uid: `starter-${idx}-${getSpeciesKey(m.species)}`,
        species: m.species,
        origin: 'Escolta Real de Galar',
        zone: 'party' as const,
        item: m.item,
        ability: m.ability,
        nature: m.nature,
        teraType: m.teraType,
        moves: [...m.moves],
        shiny: m.shiny,
        hp: null,
        maxhp: null,
        status: '',
      }));
      const inPartySpecies = new Set(migrated.map((m) => getSpeciesKey(m.species)));
      for (const sp of inv?.pokemon ?? []) {
        if (!inPartySpecies.has(getSpeciesKey(sp))) {
          const def = buildDefaultMemberForSpecies(sp);
          migrated.push({
            uid: `shop-${getSpeciesKey(sp)}`,
            species: def.species,
            origin: 'Tienda de Wyndon',
            zone: 'box',
            item: '',
            ability: def.ability,
            nature: def.nature,
            teraType: def.teraType,
            moves: [...def.moves],
            shiny: false,
            hp: null,
            maxhp: null,
            status: '',
          });
          inPartySpecies.add(getSpeciesKey(sp));
        }
      }
      return migrated;
    })(),
    itemStock: (() => {
      const stock: Record<string, number> = { ...buildStarterItemStock() };
      for (const it of inv?.items ?? []) {
        stock[it] = Math.max(1, stock[it] ?? 0);
      }
      if (raw.itemStock && typeof raw.itemStock === 'object') {
        for (const [k, v] of Object.entries(raw.itemStock)) {
          const qty = Math.max(0, Math.min(99, Math.floor(Number(v ?? 0))));
          if (qty > 0) stock[k] = qty;
        }
      }
      return stock;
    })(),
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
  const perks = computeActiveSocialLinkPerks(nextProfile);
  const firstClearBonus = !wasAlreadyCompleted
    ? rule?.firstClearReward ?? 1500
    : 0;
  const replayBonus = wasAlreadyCompleted ? rule?.replayReward ?? 350 : 0;
  const lowResetBonus = !wasAlreadyCompleted && attempts <= 2 ? 400 : 0;
  const coinsEarned = Math.round(
    (firstClearBonus + replayBonus + lowResetBonus) * perks.victoryCoinMultiplier
  );

  // Story chapter held-item reward + PLAYABLE POKÉMON reward on first clear (including hilarious Regigigas!)
  const rewardItems: string[] = [];
  const rewardPokemon: Array<{ species: string; note: string }> = [];
  let nextItems = nextProfile.inventory.items;
  let nextOwnedPokemon = nextProfile.inventory.pokemon;
  let nextBox = nextProfile.pokemonBox;
  const nextItemStock = { ...nextProfile.itemStock };
  if (
    !wasAlreadyCompleted &&
    rule?.rewardItem &&
    !nextItems.includes(rule.rewardItem)
  ) {
    nextItems = [...nextItems, rule.rewardItem];
    nextItemStock[rule.rewardItem] = (nextItemStock[rule.rewardItem] ?? 0) + 1;
    rewardItems.push(rule.rewardItem);
  }
  if (!wasAlreadyCompleted && rule?.rewardPokemon) {
    const rp = rule.rewardPokemon;
    const spKey = getSpeciesKey(rp.species);
    if (!nextOwnedPokemon.some((s) => getSpeciesKey(s) === spKey)) {
      nextOwnedPokemon = [...nextOwnedPokemon, rp.species];
    }
    const alreadyInBox = nextBox.some(
      (inst) =>
        inst.zone !== 'graveyard' && getSpeciesKey(inst.species) === spKey
    );
    if (!alreadyInBox) {
      const rewardInst: OwnedPokemonInstance = {
        uid: `reward-${chapterId}-${spKey}`,
        species: rp.species,
        origin: `Recompensa · ${chapterId}`,
        zone: 'box',
        item: '',
        ability: rp.ability,
        nature: rp.nature,
        teraType: rp.teraType,
        moves: [...rp.moves],
        shiny: false,
        hp: null,
        maxhp: null,
        status: '',
      };
      nextBox = [...nextBox, rewardInst];
    }
    rewardPokemon.push({ species: rp.species, note: rp.note });
  }

  const newlyUnlocked = computeNewlyEligibleUnlocks(nextProfile);
  nextProfile = {
    ...nextProfile,
    hasStartedRun: true,
    coins: Math.min(10000000, nextProfile.coins + coinsEarned),
    unlockedChapters: Array.from(
      new Set([...nextProfile.unlockedChapters, chapterId, ...newlyUnlocked])
    ),
    inventory: {
      ...nextProfile.inventory,
      pokemon: nextOwnedPokemon,
      items: nextItems,
    },
    pokemonBox: nextBox,
    itemStock: nextItemStock,
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
      rewardPokemon,
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
  const def = buildDefaultMemberForSpecies(species);
  const newInstance: OwnedPokemonInstance = {
    uid: `shop-${getSpeciesKey(species)}-${profile.pokemonBox.length}`,
    species: def.species,
    origin: 'Tienda de Wyndon',
    zone: 'box',
    item: '',
    ability: def.ability,
    nature: def.nature,
    teraType: def.teraType,
    moves: [...def.moves],
    shiny: false,
    hp: null,
    maxhp: null,
    status: '',
  };
  return {
    ok: true,
    nextProfile: {
      ...profile,
      coins: profile.coins - entry.price,
      inventory: {
        ...profile.inventory,
        pokemon: [...profile.inventory.pokemon, species],
      },
      pokemonBox: [...profile.pokemonBox, newInstance],
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
  const currentQty = profile.itemStock[itemName] ?? (profile.inventory.items.includes(itemName) ? 1 : 0);
  if (currentQty >= 6) {
    return { ok: false, error: 'Stock máximo alcanzado (6 copias).', nextProfile: profile };
  }
  if (profile.coins < entry.price) {
    return { ok: false, error: 'PokéCoronas insuficientes.', nextProfile: profile };
  }
  const nextItems = profile.inventory.items.includes(itemName)
    ? profile.inventory.items
    : [...profile.inventory.items, itemName];
  return {
    ok: true,
    nextProfile: {
      ...profile,
      coins: profile.coins - entry.price,
      inventory: {
        ...profile.inventory,
        items: nextItems,
      },
      itemStock: {
        ...profile.itemStock,
        [itemName]: currentQty + 1,
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
  const perks = computeActiveSocialLinkPerks(profile);
  const cost =
    profile.devModeEnabled || perks.hasFreeTutoringPerk
      ? 0
      : getMoveSlotUnlockCost(slotIndex);
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

/* ================= Romance Affinity, Ironman Camp, Berry Garden & Nuzlocke Permadeath ================= */

export function toggleRunModifiers(
  profile: PlayerSaveProfile,
  patch: {
    ironmanMode?: boolean;
    nuzlockePermadeath?: boolean;
    defaultDifficulty?: BattleDifficultyMode;
    vnPacingMode?: 'full' | 'decisions-only' | 'skip-to-battle';
    runName?: string;
    hasStartedRun?: boolean;
  }
): PlayerSaveProfile {
  return {
    ...profile,
    ironmanMode: patch.ironmanMode ?? profile.ironmanMode,
    nuzlockePermadeath: patch.nuzlockePermadeath ?? profile.nuzlockePermadeath,
    defaultDifficulty: patch.defaultDifficulty ?? profile.defaultDifficulty,
    vnPacingMode: patch.vnPacingMode ?? profile.vnPacingMode,
    runName: patch.runName ?? profile.runName,
    hasStartedRun: patch.hasStartedRun ?? profile.hasStartedRun,
    updatedAt: new Date().toISOString(),
  };
}

export function createNewConfiguredRunProfile(params: {
  displayName: string;
  email: string;
  runName: string;
  slotIndex: number;
  vnPacingMode: 'full' | 'decisions-only' | 'skip-to-battle';
  defaultDifficulty: BattleDifficultyMode;
  ironmanMode: boolean;
  nuzlockePermadeath: boolean;
}): PlayerSaveProfile {
  const fresh = createDefaultProfile(params.displayName, params.email);
  return {
    ...fresh,
    runName: params.runName.trim() || `Run #${params.slotIndex}`,
    activeSaveSlot: params.slotIndex,
    vnPacingMode: params.vnPacingMode,
    defaultDifficulty: params.defaultDifficulty,
    ironmanMode: params.ironmanMode,
    nuzlockePermadeath: params.nuzlockePermadeath,
    hasStartedRun: true,
    updatedAt: new Date().toISOString(),
  };
}

export function completeRomanceRank(
  profile: PlayerSaveProfile,
  npcId: string,
  targetRank: 1 | 2 | 3
): PlayerSaveProfile {
  const prev: SocialLinkProgress = profile.socialLinks[npcId] ?? {
    rank: 0,
    r1Done: false,
    r2Done: false,
    r3Done: false,
  };
  const nextRank = Math.max(prev.rank, targetRank) as SocialLinkRank;
  const nextLinks: Record<string, SocialLinkProgress> = {
    ...profile.socialLinks,
    [npcId]: {
      rank: nextRank,
      r1Done: prev.r1Done || targetRank >= 1,
      r2Done: prev.r2Done || targetRank >= 2,
      r3Done: prev.r3Done || targetRank >= 3,
    },
  };

  // First NPC to hit Rank 3 sets the default Romantic Ending and is NEVER overwritten!
  const nextFirstMaxed =
    nextRank === 3 && !profile.firstRomanceMaxedId
      ? npcId
      : profile.firstRomanceMaxedId;

  // Award immediate Rank perks (items + real stock on Duelist R2, unique House Pokémon instances in zone='house' on R3!)
  const nextItems = new Set(profile.inventory.items);
  const nextPokemon = new Set(profile.inventory.pokemon);
  const nextItemStock = { ...profile.itemStock };
  const nextBox = [...profile.pokemonBox];

  if (npcId === 'court_duelist' && targetRank >= 2 && !prev.r2Done) {
    nextItems.add('Focus Sash');
    nextItems.add('Choice Band');
    nextItemStock['Focus Sash'] = (nextItemStock['Focus Sash'] ?? 0) + 1;
    nextItemStock['Choice Band'] = (nextItemStock['Choice Band'] ?? 0) + 1;
  }
  const npcDef = getRomanceNpcById(npcId);
  if (npcDef && targetRank === 3) {
    for (const mon of npcDef.housePokemon) {
      nextPokemon.add(mon.species);
      if (mon.item) {
        nextItems.add(mon.item);
        nextItemStock[mon.item] = Math.max(1, (nextItemStock[mon.item] ?? 0) + (prev.r3Done ? 0 : 1));
      }
      const houseUid = `house-${npcId}-${getSpeciesKey(mon.species)}`;
      if (!nextBox.some((b) => b.uid === houseUid)) {
        nextBox.push({
          uid: houseUid,
          species: mon.species,
          origin: `Casa · ${npcDef.name} (R3)`,
          zone: 'house',
          item: mon.item,
          ability: mon.ability,
          nature: mon.nature,
          teraType: mon.teraType,
          moves: [...mon.moves],
          shiny: false,
          hp: null,
          maxhp: null,
          status: '',
        });
      }
    }
  }

  let nextProfile: PlayerSaveProfile = {
    ...profile,
    socialLinks: nextLinks,
    firstRomanceMaxedId: nextFirstMaxed,
    inventory: {
      ...profile.inventory,
      items: Array.from(nextItems),
      pokemon: Array.from(nextPokemon),
    },
    itemStock: nextItemStock,
    pokemonBox: nextBox,
    freeEmergencyHeals:
      npcId === 'champion' && targetRank >= 1
        ? Math.max(1, profile.freeEmergencyHeals)
        : profile.freeEmergencyHeals,
    updatedAt: new Date().toISOString(),
  };

  // Expand camp berry garden plots to match active Rank 1 perks!
  const perks = computeActiveSocialLinkPerks(nextProfile);
  const nextGarden: CampBerryPlot[] = [...nextProfile.campGarden];
  while (nextGarden.length < perks.maxBerryPlots) {
    nextGarden.push({
      plotIndex: nextGarden.length,
      berry: null,
      battlesLeft: 0,
    });
  }
  nextProfile = { ...nextProfile, campGarden: nextGarden };
  return nextProfile;
}

/**
 * Updates Ironman persistent HP/Status/PP, ticks Camp Berry Garden growth,
 * applies Rank 1 passive PP regen / Champion free emergency heal,
 * and records permadeath casualties in Ultra Nuzlocke Diablo mode!
 */
export function recordPostBattleSurvivalState(
  profile: PlayerSaveProfile,
  exportedState: PersistedPartyState | null | undefined,
  won: boolean,
  battleContext?: { chapterTitle?: string; rivalName?: string; turn?: number }
): PlayerSaveProfile {
  const perks = computeActiveSocialLinkPerks(profile);

  // Tick berry plots down by 1 battle
  const nextGarden = profile.campGarden.map((plot) =>
    plot.berry && plot.battlesLeft > 0
      ? { ...plot, battlesLeft: Math.max(0, plot.battlesLeft - 1) }
      : plot
  );

  // Record permadeath casualties if Ultra Nuzlocke is active
  const fallenSet = new Set(profile.fallenPokemon);
  if (profile.nuzlockePermadeath && exportedState) {
    for (const mon of exportedState.pokemon) {
      if (mon.fainted) {
        fallenSet.add(getSpeciesKey(mon.species));
      }
    }
  }

  // Persist Ironman party state + optional passive PP regen (Duelist Rank 1 perk)
  let nextIronmanState = profile.ironmanPartyState;
  if (profile.ironmanMode && exportedState) {
    nextIronmanState = {
      ...exportedState,
      pokemon: exportedState.pokemon.map((mon) => {
        if (mon.fainted || perks.passivePpRegen <= 0) return mon;
        const nextMoveSlots = mon.moveSlots.map((ms) => ({
          ...ms,
          pp: Math.min(ms.maxpp, ms.pp + perks.passivePpRegen),
        }));
        const nextPpMap: Record<string, number> = {};
        for (const ms of nextMoveSlots) nextPpMap[ms.id] = ms.pp;
        return { ...mon, moveSlots: nextMoveSlots, ppByMoveId: nextPpMap };
      }),
    };
  }

  // Sync exact post-battle HP/status/PP onto matching active party instances in pokemonBox!
  // In Ultra Nuzlocke Diablo, any fainted instance moves permanently to zone='graveyard' with epitaph!
  let nextBox = profile.pokemonBox;
  if (exportedState && (profile.ironmanMode || profile.nuzlockePermadeath)) {
    const bySpecies = new Map(
      (nextIronmanState ?? exportedState).pokemon.map((p) => [
        getSpeciesKey(p.species),
        p,
      ])
    );
    nextBox = profile.pokemonBox.map((inst) => {
      if (inst.zone !== 'party') return inst;
      const match = bySpecies.get(getSpeciesKey(inst.species));
      if (!match) return inst;
      if (match.fainted && profile.nuzlockePermadeath) {
        return {
          ...inst,
          zone: 'graveyard' as const,
          hp: 0,
          maxhp: match.maxhp,
          status: '',
          item: '', // drop item back into stock when a mon falls
          epitaph: {
            chapterTitle: battleContext?.chapterTitle || 'Combate de Campaña',
            rivalName: battleContext?.rivalName || 'Adversario',
            turn: battleContext?.turn ?? exportedState.capturedAtTurn ?? 1,
            fallenAt: new Date().toISOString(),
          },
        };
      }
      if (!profile.ironmanMode) return inst;
      return {
        ...inst,
        hp: match.fainted ? 0 : match.hp,
        maxhp: match.maxhp,
        status: match.fainted ? '' : match.status,
        ppByMoveId: { ...match.ppByMoveId },
      };
    });
  }

  const nextEmergencyHeals =
    perks.hasFreeEmergencyHealPerk && won
      ? Math.min(3, profile.freeEmergencyHeals + 1)
      : profile.freeEmergencyHeals;

  return {
    ...profile,
    campGarden: nextGarden,
    fallenPokemon: Array.from(fallenSet),
    ironmanPartyState: nextIronmanState,
    pokemonBox: nextBox,
    customTeam:
      nextBox !== profile.pokemonBox
        ? syncCustomTeamFromBox(nextBox)
        : profile.customTeam,
    freeEmergencyHeals: nextEmergencyHeals,
    updatedAt: new Date().toISOString(),
  };
}

export function plantCampBerry(
  profile: PlayerSaveProfile,
  plotIndex: number,
  berry: BerryKind
): { ok: boolean; error?: string; nextProfile: PlayerSaveProfile } {
  const plot = profile.campGarden[plotIndex];
  if (!plot) return { ok: false, error: 'Parcela inválida.', nextProfile: profile };
  if (plot.berry) {
    return {
      ok: false,
      error: 'Esta parcela ya tiene una baya creciendo.',
      nextProfile: profile,
    };
  }
  const seedCost = 100;
  if (profile.coins < seedCost) {
    return {
      ok: false,
      error: `Necesitas ${seedCost} PC para plantar semillas.`,
      nextProfile: profile,
    };
  }
  const nextGarden = profile.campGarden.map((p, idx) =>
    idx === plotIndex ? { ...p, berry, battlesLeft: 1 } : p
  );
  return {
    ok: true,
    nextProfile: {
      ...profile,
      coins: profile.coins - seedCost,
      campGarden: nextGarden,
      updatedAt: new Date().toISOString(),
    },
  };
}

export function harvestCampBerry(
  profile: PlayerSaveProfile,
  plotIndex: number
): { ok: boolean; error?: string; nextProfile: PlayerSaveProfile } {
  const plot = profile.campGarden[plotIndex];
  if (!plot || !plot.berry) {
    return { ok: false, error: 'No hay baya en esta parcela.', nextProfile: profile };
  }
  if (plot.battlesLeft > 0) {
    return {
      ok: false,
      error: `Falta(n) ${plot.battlesLeft} combate(s) para cosechar.`,
      nextProfile: profile,
    };
  }
  const harvested = plot.berry;
  const nextGarden = profile.campGarden.map((p, idx) =>
    idx === plotIndex ? { ...p, berry: null, battlesLeft: 0 } : p
  );
  return {
    ok: true,
    nextProfile: {
      ...profile,
      campGarden: nextGarden,
      campBerries: {
        ...profile.campBerries,
        [harvested]: (profile.campBerries[harvested] ?? 0) + 2,
      },
      updatedAt: new Date().toISOString(),
    },
  };
}

export function campHealPartyMember(
  profile: PlayerSaveProfile,
  species: string,
  action: 'potion' | 'full_heal' | 'emergency_free' | 'lum' | 'sitrus' | 'leppa'
): { ok: boolean; error?: string; nextProfile: PlayerSaveProfile } {
  const state = profile.ironmanPartyState;
  if (!state) {
    return {
      ok: false,
      error: 'Tu escuadrón ya está sano (sin heridas persistentes de Ironman).',
      nextProfile: profile,
    };
  }
  const spKey = getSpeciesKey(species);
  const idx = state.pokemon.findIndex((p) => getSpeciesKey(p.species) === spKey);
  if (idx === -1) {
    return { ok: false, error: 'Pokémon no encontrado en el escuadrón.', nextProfile: profile };
  }
  const mon = state.pokemon[idx];
  if (mon.fainted && profile.nuzlockePermadeath) {
    return {
      ok: false,
      error: `${mon.species} cayó en Ultra Nuzlocke (Permadeath). No puede ser revivido.`,
      nextProfile: profile,
    };
  }

  const perks = computeActiveSocialLinkPerks(profile);
  const discount = 1 - perks.campHealDiscountPct / 100;
  let nextCoins = profile.coins;
  let nextEmergency = profile.freeEmergencyHeals;
  const nextBerries = { ...profile.campBerries };
  let updatedMon = { ...mon };

  if (action === 'potion') {
    const cost = Math.round(250 * discount);
    if (nextCoins < cost) {
      return { ok: false, error: `Necesitas ${cost} PC.`, nextProfile: profile };
    }
    nextCoins -= cost;
    updatedMon.hp = Math.min(mon.maxhp, mon.hp + Math.round(mon.maxhp * 0.5));
    updatedMon.fainted = false;
  } else if (action === 'full_heal') {
    const cost = Math.round(550 * discount);
    if (nextCoins < cost) {
      return { ok: false, error: `Necesitas ${cost} PC.`, nextProfile: profile };
    }
    nextCoins -= cost;
    updatedMon.hp = mon.maxhp;
    updatedMon.status = '';
    updatedMon.fainted = false;
    updatedMon.moveSlots = mon.moveSlots.map((ms) => ({ ...ms, pp: ms.maxpp }));
    updatedMon.ppByMoveId = Object.fromEntries(
      updatedMon.moveSlots.map((ms) => [ms.id, ms.maxpp])
    );
  } else if (action === 'emergency_free') {
    if (nextEmergency <= 0) {
      return {
        ok: false,
        error: 'No tienes cargas gratuitas de Curación de Emergencia.',
        nextProfile: profile,
      };
    }
    nextEmergency -= 1;
    updatedMon.hp = mon.maxhp;
    updatedMon.status = '';
    updatedMon.fainted = false;
  } else if (action === 'lum') {
    if ((nextBerries.lum ?? 0) <= 0) {
      return { ok: false, error: 'Sin Bayas Lum. Plántalas en el huerto.', nextProfile: profile };
    }
    nextBerries.lum -= 1;
    updatedMon.status = '';
  } else if (action === 'sitrus') {
    if ((nextBerries.sitrus ?? 0) <= 0) {
      return { ok: false, error: 'Sin Bayas Sitrus. Plántalas en el huerto.', nextProfile: profile };
    }
    nextBerries.sitrus -= 1;
    updatedMon.hp = Math.min(mon.maxhp, mon.hp + Math.round(mon.maxhp * 0.4));
    updatedMon.fainted = false;
  } else if (action === 'leppa') {
    if ((nextBerries.leppa ?? 0) <= 0) {
      return { ok: false, error: 'Sin Bayas Leppa. Plántalas en el huerto.', nextProfile: profile };
    }
    nextBerries.leppa -= 1;
    updatedMon.moveSlots = mon.moveSlots.map((ms) => ({
      ...ms,
      pp: Math.min(ms.maxpp, ms.pp + 10),
    }));
    updatedMon.ppByMoveId = Object.fromEntries(
      updatedMon.moveSlots.map((ms) => [ms.id, ms.pp])
    );
  }

  const nextParty = [...state.pokemon];
  nextParty[idx] = updatedMon;
  // Also reflect the camp heal onto the matching PC Box instance!
  const nextBox = profile.pokemonBox.map((inst) =>
    inst.zone !== 'graveyard' && getSpeciesKey(inst.species) === spKey
      ? {
          ...inst,
          hp: updatedMon.hp,
          maxhp: updatedMon.maxhp,
          status: updatedMon.status,
          ppByMoveId: { ...updatedMon.ppByMoveId },
        }
      : inst
  );
  return {
    ok: true,
    nextProfile: {
      ...profile,
      coins: nextCoins,
      freeEmergencyHeals: nextEmergency,
      campBerries: nextBerries,
      ironmanPartyState: { ...state, pokemon: nextParty },
      pokemonBox: nextBox,
      updatedAt: new Date().toISOString(),
    },
  };
}

export function recruitHousePokemonToCustomSlot(
  profile: PlayerSaveProfile,
  houseMon: CustomTeamMember,
  slotIndex: number
): PlayerSaveProfile {
  const nextOwned = Array.from(new Set([...profile.inventory.pokemon, houseMon.species]));
  const houseMatch = profile.pokemonBox.find(
    (b) =>
      b.zone === 'house' &&
      getSpeciesKey(b.species) === getSpeciesKey(houseMon.species)
  );
  if (houseMatch) {
    // Move existing House instance cleanly into Party (swapping out slotIndex into Box without healing!)
    const partyInsts = profile.pokemonBox.filter((b) => b.zone === 'party');
    const swappedOutUid =
      partyInsts.length >= 6 ? partyInsts[Math.min(slotIndex, partyInsts.length - 1)]?.uid : null;
    const nextBox = profile.pokemonBox.map((b) => {
      if (b.uid === houseMatch.uid) return { ...b, zone: 'party' as const };
      if (swappedOutUid && b.uid === swappedOutUid) return { ...b, zone: 'box' as const };
      return b;
    });
    return {
      ...profile,
      inventory: { ...profile.inventory, pokemon: nextOwned },
      pokemonBox: nextBox,
      customTeam: syncCustomTeamFromBox(nextBox),
      useCustomTeamInStory: true,
      updatedAt: new Date().toISOString(),
    };
  }
  const nextTeam = [...profile.customTeam];
  const targetIdx = Math.max(0, Math.min(5, slotIndex));
  nextTeam[targetIdx] = {
    ...houseMon,
    moves: [...houseMon.moves],
    shiny: false,
  };
  return {
    ...profile,
    inventory: { ...profile.inventory, pokemon: nextOwned },
    customTeam: nextTeam,
    useCustomTeamInStory: true,
    updatedAt: new Date().toISOString(),
  };
}

export function clearNuzlockeFallenAndIronman(
  profile: PlayerSaveProfile
): PlayerSaveProfile {
  const restoredBox = profile.pokemonBox.map((inst) => ({
    ...inst,
    zone: inst.zone === 'graveyard' ? ('box' as const) : inst.zone,
    hp: null,
    maxhp: null,
    status: '' as const,
    ppByMoveId: undefined,
    epitaph: undefined,
  }));
  return {
    ...profile,
    ironmanPartyState: null,
    fallenPokemon: [],
    pokemonBox: restoredBox,
    customTeam: syncCustomTeamFromBox(restoredBox),
    updatedAt: new Date().toISOString(),
  };
}

/* ================= Per-Instance PC Box Manager (Party / Reserve Box / House / Graveyard + Real Item Stock) ================= */

export function getItemUsageInfo(
  profile: PlayerSaveProfile,
  itemName: string,
  excludeUid?: string
): { stock: number; used: number; holders: OwnedPokemonInstance[] } {
  const stock =
    profile.itemStock[itemName] ??
    (profile.inventory.items.includes(itemName) ? 1 : 0);
  const holders = profile.pokemonBox.filter(
    (b) =>
      b.zone !== 'graveyard' &&
      b.uid !== excludeUid &&
      b.item === itemName
  );
  return { stock, used: holders.length, holders };
}

/**
 * Moves a unique Pokémon instance (`uid`) between 'party', 'box', and 'house'.
 * - NEVER heals when parked in 'box' (enabling the Run & Bun 1-HP poisoned + Rest tech!).
 * - Enforces max 6 in 'party', Species Clause in 'party', and permadeath lock on 'graveyard'.
 */
export function movePokemonInstanceZone(
  profile: PlayerSaveProfile,
  uid: string,
  targetZone: Exclude<PokemonStorageZone, 'graveyard'>
): { ok: boolean; error?: string; nextProfile: PlayerSaveProfile } {
  const target = profile.pokemonBox.find((b) => b.uid === uid);
  if (!target) {
    return { ok: false, error: 'Instancia no encontrada en tus Cajas.', nextProfile: profile };
  }
  if (target.zone === 'graveyard') {
    return {
      ok: false,
      error: `${target.species} descansa en el Cementerio (Permadeath). No puede salir.`,
      nextProfile: profile,
    };
  }
  if (target.zone === targetZone) {
    return { ok: true, nextProfile: profile };
  }

  const currentParty = profile.pokemonBox.filter((b) => b.zone === 'party');
  if (targetZone === 'party') {
    if (currentParty.length >= 6) {
      return {
        ok: false,
        error: 'Tu Equipo Activo ya tiene 6 Pokémon. Guarda primero a uno en la Caja de Reserva.',
        nextProfile: profile,
      };
    }
    // Species Clause: prevents cloning 6 Arcanines into the active party!
    const dup = currentParty.find(
      (b) => getSpeciesKey(b.species) === getSpeciesKey(target.species)
    );
    if (dup) {
      return {
        ok: false,
        error: `Cláusula de Especie: ya tienes a ${dup.species} en tu Equipo Activo.`,
        nextProfile: profile,
      };
    }
  } else if (target.zone === 'party' && currentParty.length <= 1) {
    return {
      ok: false,
      error: 'Debes mantener al menos 1 Pokémon en tu Equipo Activo.',
      nextProfile: profile,
    };
  }

  const nextBox = profile.pokemonBox.map((b) =>
    b.uid === uid ? { ...b, zone: targetZone } : b
  );
  return {
    ok: true,
    nextProfile: {
      ...profile,
      pokemonBox: nextBox,
      customTeam: syncCustomTeamFromBox(nextBox),
      updatedAt: new Date().toISOString(),
    },
  };
}

/**
 * Equips an item onto a specific Pokémon instance while strictly enforcing real `itemStock`.
 * If stock is exhausted (e.g. only 1 Sitrus Berry), automatically unequips from the previous holder!
 */
export function equipItemOnInstance(
  profile: PlayerSaveProfile,
  uid: string,
  itemName: string
): {
  ok: boolean;
  error?: string;
  transferredFrom?: string;
  nextProfile: PlayerSaveProfile;
} {
  const target = profile.pokemonBox.find((b) => b.uid === uid);
  if (!target || target.zone === 'graveyard') {
    return { ok: false, error: 'No puedes equipar objetos en esta instancia.', nextProfile: profile };
  }
  if (!itemName) {
    const nextBox = profile.pokemonBox.map((b) =>
      b.uid === uid ? { ...b, item: '' } : b
    );
    return {
      ok: true,
      nextProfile: {
        ...profile,
        pokemonBox: nextBox,
        customTeam: syncCustomTeamFromBox(nextBox),
        updatedAt: new Date().toISOString(),
      },
    };
  }

  const usage = getItemUsageInfo(profile, itemName, uid);
  if (usage.stock <= 0) {
    return {
      ok: false,
      error: `No tienes ${itemName} en tu inventario. Cómpralo en la Tienda.`,
      nextProfile: profile,
    };
  }

  let transferredFrom: string | undefined;
  let stealUid: string | null = null;
  if (usage.used >= usage.stock && usage.holders.length > 0) {
    stealUid = usage.holders[0].uid;
    transferredFrom = usage.holders[0].species;
  }

  const nextBox = profile.pokemonBox.map((b) => {
    if (b.uid === uid) return { ...b, item: itemName };
    if (stealUid && b.uid === stealUid) return { ...b, item: '' };
    return b;
  });

  return {
    ok: true,
    transferredFrom,
    nextProfile: {
      ...profile,
      pokemonBox: nextBox,
      customTeam: syncCustomTeamFromBox(nextBox),
      updatedAt: new Date().toISOString(),
    },
  };
}

/**
 * Updates moves (including teaching Rest while parked in the Box!), ability, nature, teraType, or Shiny
 * on a unique `OwnedPokemonInstance`.
 */
export function updatePokemonInstanceBuild(
  profile: PlayerSaveProfile,
  uid: string,
  patch: Partial<
    Pick<
      OwnedPokemonInstance,
      'ability' | 'nature' | 'teraType' | 'moves' | 'shiny' | 'nickname'
    >
  >
): { ok: boolean; error?: string; nextProfile: PlayerSaveProfile } {
  const target = profile.pokemonBox.find((b) => b.uid === uid);
  if (!target || target.zone === 'graveyard') {
    return { ok: false, error: 'Instancia no modificable.', nextProfile: profile };
  }

  if (patch.shiny === true && !target.shiny) {
    const currentShinies = profile.pokemonBox.filter(
      (b) => b.zone !== 'graveyard' && b.shiny
    ).length;
    if (currentShinies >= profile.inventory.shinyCharms) {
      return {
        ok: false,
        error: `Solo tienes ${profile.inventory.shinyCharms} Amuleto(s) Variocolor.`,
        nextProfile: profile,
      };
    }
  }

  const nextBox = profile.pokemonBox.map((b) =>
    b.uid === uid
      ? {
          ...b,
          ...patch,
          moves: patch.moves ? patch.moves.filter(Boolean).slice(0, 4) : b.moves,
        }
      : b
  );
  return {
    ok: true,
    nextProfile: {
      ...profile,
      pokemonBox: nextBox,
      customTeam: syncCustomTeamFromBox(nextBox),
      updatedAt: new Date().toISOString(),
    },
  };
}

/**
 * Builds a PersistedPartyState directly from frozen Ironman per-instance state inside `pokemonBox`
 * (falling back to `ironmanPartyState`), so a 1-HP poisoned Pokémon pulled out of the Reserve Box
 * enters battle with EXACTLY 1 HP + PSN (enabling the Run & Bun Turn-1 Rest tech!).
 */
export function buildIronmanPersistedStateForBattle(
  profile: PlayerSaveProfile,
  playerPaste: string
): PersistedPartyState | undefined {
  if (!profile.ironmanMode) return undefined;
  const sets = Teams.import(playerPaste) ?? [];
  if (sets.length === 0) return profile.ironmanPartyState ?? undefined;

  const boxBySpecies = new Map<string, OwnedPokemonInstance>();
  for (const inst of profile.pokemonBox) {
    if (inst.zone === 'party') {
      boxBySpecies.set(getSpeciesKey(inst.species), inst);
    }
  }
  const legacyBySpecies = new Map(
    (profile.ironmanPartyState?.pokemon ?? []).map((p) => [
      getSpeciesKey(p.species),
      p,
    ])
  );

  let anyModified = false;
  const pokemon = sets.map((s) => {
    const spKey = getSpeciesKey(s.species);
    const inst = boxBySpecies.get(spKey);
    const leg = legacyBySpecies.get(spKey);
    if (inst && inst.hp !== null && inst.maxhp !== null) {
      anyModified = true;
      return {
        species: s.species,
        name: s.name || s.species,
        hp: inst.hp,
        maxhp: inst.maxhp,
        fainted: inst.hp <= 0,
        status: inst.status,
        moveSlots: (s.moves ?? []).map((mv) => {
          const mvId = mv.toLowerCase().replace(/[^a-z0-9]/g, '');
          const maxpp = Dex.moves.get(mv).pp ? Math.floor((Dex.moves.get(mv).pp * 8) / 5) : 16;
          return {
            id: mvId,
            move: mv,
            pp: inst.ppByMoveId?.[mvId] ?? maxpp,
            maxpp,
          };
        }),
        ppByMoveId: inst.ppByMoveId ? { ...inst.ppByMoveId } : {},
      };
    }
    if (leg) {
      anyModified = true;
      return leg;
    }
    // Untouched full-HP mon
    return {
      species: s.species,
      name: s.name || s.species,
      hp: 9999,
      maxhp: 9999,
      fainted: false,
      status: '' as const,
      moveSlots: [],
      ppByMoveId: {},
    };
  });

  if (!anyModified) return undefined;
  return {
    sourceBattleId: 'ironman-box-state',
    capturedAtTurn: 0,
    pokemon: pokemon.filter((p) => p.maxhp !== 9999),
  };
}
