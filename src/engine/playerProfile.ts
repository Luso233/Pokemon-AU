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
import {
  BLOC_BY_ID,
  CHAPTER_MAP_LOCATIONS,
} from '../data/worldGeopolitics';
import type {
  BattleDifficultyMode,
  BattleFatalBlow,
  BattleRewardSummary,
  BerryKind,
  CampBerryPlot,
  ChapterProgress,
  CustomTeamMember,
  NuzlockeDeathLogEntry,
  OwnedPokemonInstance,
  PersistedPartyState,
  PlayerSaveProfile,
  PokemonGender,
  PokemonStorageZone,
  SavedCampaignTeam,
  SocialLinkProgress,
  SocialLinkRank,
  StatSpread,
  StoryFlags,
} from '../types/game';
import {
  getFormatGeneration,
  getMoveSlotUnlockCost,
  getSpeciesKey,
  isMoveLegalForSpecies,
} from './learnsetService';
import {
  buildSmartDefaultMemberForSpecies,
  computeCasualtyIndemnification,
  computePokemonShopPricing,
  getAllAnythingGoesPlayableSpecies,
  getAllBiomePokedexSpecies,
  rollRegionalPokedexUnlocks,
  STARTER_UNLOCKED_POKEDEX,
} from './pricingEngine';
import { buildShowdownPaste, type ShowdownSetBlock } from './teamBuilderTree';
import { DEFAULT_RIVAL_NAME, sanitizeRivalName } from './rivalName';

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

const STAT_KEYS: Array<keyof StatSpread> = ['hp', 'atk', 'def', 'spa', 'spd', 'spe'];
const STAT_SHOWDOWN_LABEL: Record<keyof StatSpread, string> = {
  hp: 'HP',
  atk: 'Atk',
  def: 'Def',
  spa: 'SpA',
  spd: 'SpD',
  spe: 'Spe',
};

export function sanitizeEvSpread(
  raw?: Partial<StatSpread>
): Partial<StatSpread> | undefined {
  if (!raw || typeof raw !== 'object') return undefined;
  const out: Partial<StatSpread> = {};
  let total = 0;
  for (const k of STAT_KEYS) {
    const val = Math.max(0, Math.min(252, Math.floor(Number(raw[k] ?? 0))));
    if (!Number.isFinite(val) || val <= 0) continue;
    const allowed = Math.min(val, Math.max(0, 508 - total));
    if (allowed > 0) {
      out[k] = allowed;
      total += allowed;
    }
  }
  return Object.keys(out).length > 0 ? out : undefined;
}

export function sanitizeIvSpread(
  raw?: Partial<StatSpread>
): Partial<StatSpread> | undefined {
  if (!raw || typeof raw !== 'object') return undefined;
  const out: Partial<StatSpread> = {};
  for (const k of STAT_KEYS) {
    if (raw[k] === undefined || raw[k] === null) continue;
    const val = Math.max(0, Math.min(31, Math.floor(Number(raw[k]))));
    if (Number.isFinite(val) && val !== 31) {
      out[k] = val;
    }
  }
  return Object.keys(out).length > 0 ? out : undefined;
}

export function sanitizeGenderForSpecies(
  speciesName: string,
  gender?: string
): PokemonGender {
  const sp = Dex.species.get(speciesName);
  if (sp.exists) {
    if (sp.gender === 'N') return '';
    if (sp.gender === 'M') return 'M';
    if (sp.gender === 'F') return 'F';
  }
  return gender === 'M' || gender === 'F' ? gender : '';
}

function formatEvsLine(evs?: Partial<StatSpread>): string | undefined {
  if (!evs) return undefined;
  const parts: string[] = [];
  for (const k of STAT_KEYS) {
    const v = evs[k] ?? 0;
    if (v > 0) parts.push(`${v} ${STAT_SHOWDOWN_LABEL[k]}`);
  }
  return parts.length > 0 ? parts.join(' / ') : undefined;
}

function formatIvsLine(ivs?: Partial<StatSpread>): string | undefined {
  if (!ivs) return undefined;
  const parts: string[] = [];
  for (const k of STAT_KEYS) {
    if (ivs[k] !== undefined && ivs[k] !== 31) {
      parts.push(`${ivs[k]} ${STAT_SHOWDOWN_LABEL[k]}`);
    }
  }
  return parts.length > 0 ? parts.join(' / ') : undefined;
}

export function syncCustomTeamFromBox(
  box: OwnedPokemonInstance[]
): CustomTeamMember[] {
  const party = box.filter((m) => m.zone === 'party').slice(0, 6);
  return party.map((m) => ({
    species: m.species,
    ...(m.nickname ? { nickname: m.nickname } : {}),
    ...(m.gender ? { gender: m.gender } : {}),
    item: m.item,
    ability: m.ability,
    nature: m.nature,
    teraType: m.teraType,
    moves: [...m.moves],
    ...(m.evs ? { evs: { ...m.evs } } : {}),
    ...(m.ivs ? { ivs: { ...m.ivs } } : {}),
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
    rivalName: DEFAULT_RIVAL_NAME,
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
    devFullAgPokedex: false,
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
    unlockedPokedex: [...STARTER_UNLOCKED_POKEDEX],
    savedTeams: [],
    nuzlockeDeathLog: [],
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

  const normalizedBox: OwnedPokemonInstance[] = (() => {
    if (Array.isArray(raw.pokemonBox) && raw.pokemonBox.length > 0) {
      const seenUids = new Set<string>();
      const cleaned: OwnedPokemonInstance[] = [];
      for (let i = 0; i < raw.pokemonBox.length; i++) {
        const inst = raw.pokemonBox[i];
        if (!inst || !inst.species) continue;
        const uid =
          inst.uid && !seenUids.has(inst.uid)
            ? inst.uid
            : `mon-${i}-${getSpeciesKey(inst.species)}`;
        seenUids.add(uid);
        cleaned.push({
          uid,
          species: inst.species,
          ...(inst.nickname?.trim() ? { nickname: inst.nickname.trim().slice(0, 24) } : {}),
          ...(inst.gender === 'M' || inst.gender === 'F'
            ? { gender: sanitizeGenderForSpecies(inst.species, inst.gender) }
            : {}),
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
          ...(sanitizeEvSpread(inst.evs) ? { evs: sanitizeEvSpread(inst.evs) } : {}),
          ...(sanitizeIvSpread(inst.ivs) ? { ivs: sanitizeIvSpread(inst.ivs) } : {}),
          shiny: Boolean(inst.shiny),
          hp: typeof inst.hp === 'number' ? inst.hp : null,
          maxhp: typeof inst.maxhp === 'number' ? inst.maxhp : null,
          status: inst.status || '',
          ...(inst.ppByMoveId ? { ppByMoveId: { ...inst.ppByMoveId } } : {}),
          ...(inst.epitaph ? { epitaph: inst.epitaph } : {}),
        });
      }
      if (cleaned.length > 0) return cleaned;
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
  })();

  const syncedPartyFromBox = syncCustomTeamFromBox(normalizedBox);

  return {
    displayName: raw.displayName || base.displayName,
    email: raw.email || '',
    runName: raw.runName || base.runName,
    rivalName: sanitizeRivalName(raw.rivalName),
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
    customTeam:
      syncedPartyFromBox.length > 0 ? syncedPartyFromBox : normalizedTeam,
    useCustomTeamInStory: Boolean(raw.useCustomTeamInStory),
    unlockedMoveSlots: normalizeUnlockedMoveSlots(raw.unlockedMoveSlots),
    customMoves: normalizeCustomMoves(raw.customMoves),
    customItems: normalizeCustomItems(raw.customItems),
    devModeEnabled: Boolean(raw.devModeEnabled),
    devFullAgPokedex: Boolean(raw.devFullAgPokedex),
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
    pokemonBox: normalizedBox,
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
    unlockedPokedex: (() => {
      const seen = new Map<string, string>();
      const add = (sp: string) => {
        const k = getSpeciesKey(sp);
        if (k && !seen.has(k)) seen.set(k, sp);
      };
      for (const sp of STARTER_UNLOCKED_POKEDEX) add(sp);
      if (Array.isArray(raw.unlockedPokedex)) {
        for (const sp of raw.unlockedPokedex) {
          if (typeof sp === 'string' && sp.trim()) add(sp.trim());
        }
      }
      for (const sp of inv?.pokemon ?? []) add(sp);
      return Array.from(seen.values());
    })(),
    savedTeams: Array.isArray(raw.savedTeams)
      ? raw.savedTeams
          .filter(
            (t) =>
              t &&
              typeof t.id === 'string' &&
              typeof t.name === 'string' &&
              typeof t.paste === 'string'
          )
          .slice(0, 30)
      : [],
    nuzlockeDeathLog: Array.isArray(raw.nuzlockeDeathLog)
      ? raw.nuzlockeDeathLog.slice(0, 200)
      : [],
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
  flags?: StoryFlags,
  options?: {
    difficulty?: BattleDifficultyMode;
    fallenInBattle?: Array<{ species: string; ability?: string }>;
  }
): { nextProfile: PlayerSaveProfile; reward: BattleRewardSummary | null } {
  const existing = profile.completedChapters[chapterId] ?? {
    completed: false,
    rewardsClaimed: false,
    victories: 0,
    attempts: 1,
  };
  const wasAlreadyCompleted = Boolean(existing.completed || existing.rewardsClaimed);
  const attempts = Math.max(1, existing.attempts ?? 1);
  const effectiveDifficulty = options?.difficulty ?? profile.defaultDifficulty;
  const isStrictAntiGrind =
    profile.ironmanMode ||
    profile.nuzlockePermadeath ||
    effectiveDifficulty === 'kaizo' ||
    effectiveDifficulty === 'nightmare';

  const nextRecord: ChapterProgress = {
    completed: existing.completed || won,
    rewardsClaimed: existing.rewardsClaimed || won,
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
  const antiGrindBlocked = wasAlreadyCompleted && isStrictAntiGrind;

  const firstClearBonus = !wasAlreadyCompleted
    ? rule?.firstClearReward ?? 1500
    : 0;
  const replayBonus =
    wasAlreadyCompleted && !antiGrindBlocked ? rule?.replayReward ?? 350 : 0;
  const lowResetBonus = !wasAlreadyCompleted && attempts <= 2 ? 400 : 0;
  const baseCoinsEarned = Math.round(
    (firstClearBonus + replayBonus + lowResetBonus) * perks.victoryCoinMultiplier
  );

  // Casualty Indemnification: ONLY paid on VICTORY for permanent Nuzlocke casualties (zero farm exploit!)
  const fallenList =
    nextProfile.nuzlockePermadeath && options?.fallenInBattle?.length
      ? options.fallenInBattle
      : [];
  const indemnification =
    fallenList.length > 0
      ? computeCasualtyIndemnification(fallenList, perks.casualtyTaxRate)
      : null;
  const casualtyIndemnificationCoins = indemnification?.totalPayout ?? 0;
  const coinsEarned = baseCoinsEarned + casualtyIndemnificationCoins;

  // Story chapter held-item reward + PLAYABLE POKÉMON reward + BIOGEOGRAPHICAL POKÉDEX UNLOCKS on first clear!
  const rewardItems: string[] = [];
  const rewardPokemon: Array<{ species: string; note: string }> = [];
  const unlockedPokedexSpecies: Array<{
    species: string;
    regionName: string;
    price: number;
    tier: string;
    bst: number;
  }> = [];

  let nextItems = nextProfile.inventory.items;
  let nextOwnedPokemon = nextProfile.inventory.pokemon;
  let nextBox = nextProfile.pokemonBox;
  let nextUnlockedPokedex = [...nextProfile.unlockedPokedex];
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
    if (!nextUnlockedPokedex.some((s) => getSpeciesKey(s) === spKey)) {
      nextUnlockedPokedex = [...nextUnlockedPokedex, rp.species];
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

  // Biogeographical Fauna Roll (3–4 local species added to buyable Campaign Pokédex on first clear ONLY!)
  if (!wasAlreadyCompleted) {
    const loc = CHAPTER_MAP_LOCATIONS[chapterId];
    const blocId = loc?.blocId ?? 'galar_empire';
    const regionName = BLOC_BY_ID[blocId]?.shortName ?? 'GALAR';
    const rollCount = Math.random() < 0.5 ? 3 : 4;
    const rolled = rollRegionalPokedexUnlocks(
      blocId,
      nextUnlockedPokedex,
      rollCount
    );
    for (const sp of rolled) {
      nextUnlockedPokedex.push(sp);
      const pricing = computePokemonShopPricing(sp);
      unlockedPokedexSpecies.push({
        species: pricing.species,
        regionName,
        price: pricing.finalPrice,
        tier: pricing.tierBand,
        bst: pricing.bst,
      });
    }
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
    unlockedPokedex: nextUnlockedPokedex,
  };

  return {
    nextProfile,
    reward: {
      coinsEarned,
      firstClearBonus,
      replayBonus,
      lowResetBonus,
      casualtyIndemnificationCoins,
      casualtyTaxRate: indemnification?.taxRate,
      casualtyBreakdown: indemnification?.entries,
      unlockedPokedexSpecies,
      antiGrindBlocked,
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
  const spKey = getSpeciesKey(species);
  const dexSp = Dex.species.get(species);
  if (!dexSp.exists) {
    return { ok: false, error: 'Pokémon no encontrado en el Dex.', nextProfile: profile };
  }
  const canonicalName = dexSp.name;
  const isInUnlockedPokedex =
    profile.devModeEnabled ||
    Boolean(profile.devFullAgPokedex) ||
    profile.unlockedPokedex.some((s) => getSpeciesKey(s) === spKey) ||
    SHOP_POKEMON.some((p) => getSpeciesKey(p.species) === spKey);

  if (!isInUnlockedPokedex) {
    return {
      ok: false,
      error: `${canonicalName} aún no está desbloqueado en tu Pokédex de Campaña. Supera capítulos en su región para desbloquearlo.`,
      nextProfile: profile,
    };
  }

  // Allow buying a replacement in Nuzlocke if your previous individual died in the Graveyard!
  const hasLivingCopy = profile.pokemonBox.some(
    (inst) => inst.zone !== 'graveyard' && getSpeciesKey(inst.species) === spKey
  );
  if (hasLivingCopy) {
    return {
      ok: false,
      error: `Ya tienes un ${canonicalName} vivo en tus Cajas PC.`,
      nextProfile: profile,
    };
  }

  const def = buildDefaultMemberForSpecies(canonicalName);
  const pricing = computePokemonShopPricing(canonicalName, def.ability);
  if (profile.coins < pricing.finalPrice) {
    return {
      ok: false,
      error: `PokéCoronas insuficientes (cuesta ${pricing.finalPrice.toLocaleString()} PC · ${pricing.breakdownText}).`,
      nextProfile: profile,
    };
  }

  const newInstance: OwnedPokemonInstance = {
    uid: `shop-${spKey}-${Date.now().toString(36)}-${profile.pokemonBox.length}`,
    species: def.species,
    origin: 'Mercado Negro · Pokédex',
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
  const nextInvPokemon = profile.inventory.pokemon.some(
    (s) => getSpeciesKey(s) === spKey
  )
    ? profile.inventory.pokemon
    : [...profile.inventory.pokemon, canonicalName];

  return {
    ok: true,
    nextProfile: {
      ...profile,
      coins: profile.coins - pricing.finalPrice,
      inventory: {
        ...profile.inventory,
        pokemon: nextInvPokemon,
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

  const allBiomeSpecies = Array.from(
    new Set([
      ...getAllBiomePokedexSpecies(),
      ...SHOP_POKEMON.map((p) => p.species),
      ...Object.values(CHAPTER_UNLOCK_RULES).map((r) => r.rewardPokemon.species),
      ...profile.unlockedPokedex,
    ])
  );

  const allItemStock: Record<string, number> = { ...profile.itemStock };
  for (const it of allItems) {
    allItemStock[it] = Math.max(6, allItemStock[it] ?? 0);
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
    itemStock: allItemStock,
    unlockedPokedex: allBiomeSpecies,
    unlockedMoveSlots,
    devModeEnabled: true,
    devFullAgPokedex: true,
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Dev Mode: Unlocks the complete Anything Goes National Pokédex (~1,150+ playable species)
 * + 6x stock of all competitive held items + free move slots for playtesting any Showdown composition!
 */
export function applyDevUnlockFullAgPokedex(
  profile: PlayerSaveProfile
): PlayerSaveProfile {
  const base = applyDevUnlockEverything(profile);
  return {
    ...base,
    devModeEnabled: true,
    devFullAgPokedex: true,
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Dev Mode Playtesting Helper: Spawns a ready-to-customize specimen of ANY playable Anything Goes species
 * directly into your Active Party (auto-parking Slot 6 into Reserve Box if 6/6 full so it ALWAYS enters your team!)
 * or Reserve Box at 0 PC!
 */
export function spawnDevAgSpecimen(
  profile: PlayerSaveProfile,
  species: string,
  targetZone: 'party' | 'box' = 'party'
): {
  ok: boolean;
  error?: string;
  uid?: string;
  placedZone?: 'party' | 'box';
  swappedOutSpecies?: string;
  nextProfile: PlayerSaveProfile;
} {
  const sp = Dex.species.get(species);
  if (!sp.exists) {
    return {
      ok: false,
      error: `Especie "${species}" no encontrada en @pkmn/sim.`,
      nextProfile: profile,
    };
  }
  const canonical = sp.name;
  const spKey = getSpeciesKey(canonical);
  const def = buildDefaultMemberForSpecies(canonical);
  const currentParty = profile.pokemonBox.filter((m) => m.zone === 'party');
  const dupInParty = currentParty.some(
    (m) => getSpeciesKey(m.species) === spKey
  );

  let baseBox = profile.pokemonBox;
  let swappedOutSpecies: string | undefined;
  let resolvedZone: 'party' | 'box' = 'box';

  if (targetZone === 'party' && !dupInParty) {
    resolvedZone = 'party';
    // If Active Party already has 6/6 Pokémon, safely park Slot 6 in Reserve Box (without healing)
    // so the spawned Pokémon enters Active Party immediately instead of vanishing into the Box!
    if (currentParty.length >= 6) {
      const displaced = currentParty[currentParty.length - 1];
      swappedOutSpecies = displaced.species;
      baseBox = profile.pokemonBox.map((m) =>
        m.uid === displaced.uid ? { ...m, zone: 'box' as const } : m
      );
    }
  }

  const uid = `dev-${spKey}-${Date.now().toString(36)}-${profile.pokemonBox.length}`;
  const inst: OwnedPokemonInstance = {
    uid,
    species: def.species,
    origin: 'Dev Lab · Anything Goes',
    zone: resolvedZone,
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

  const nextBox = [...baseBox, inst];
  const nextInvPokemon = profile.inventory.pokemon.some(
    (s) => getSpeciesKey(s) === spKey
  )
    ? profile.inventory.pokemon
    : [...profile.inventory.pokemon, canonical];

  return {
    ok: true,
    uid,
    placedZone: resolvedZone,
    swappedOutSpecies,
    nextProfile: {
      ...profile,
      useCustomTeamInStory:
        resolvedZone === 'party' ? true : profile.useCustomTeamInStory,
      inventory: { ...profile.inventory, pokemon: nextInvPokemon },
      pokemonBox: nextBox,
      customTeam: syncCustomTeamFromBox(nextBox),
      updatedAt: new Date().toISOString(),
    },
  };
}

/**
 * Dev Mode Playtesting Helper: Imports a full Showdown Paste directly into Active Party
 * (moving old party specimens safely into the Reserve Box), enabling rapid level playtesting
 * and round-trip Showdown import/export!
 */
export function importShowdownPasteToParty(
  profile: PlayerSaveProfile,
  rawPaste: string
): { ok: boolean; error?: string; importedCount: number; nextProfile: PlayerSaveProfile } {
  let sets: ReturnType<typeof Teams.import> = null;
  try {
    sets = Teams.import(rawPaste.trim());
  } catch {
    sets = null;
  }
  if (!sets || sets.length === 0) {
    return {
      ok: false,
      error: 'No se pudo parsear el Paste de Showdown. Verifica el formato.',
      importedCount: 0,
      nextProfile: profile,
    };
  }

  const validSets = sets
    .slice(0, 6)
    .filter((s) => Dex.species.get(s.species).exists);
  if (validSets.length === 0) {
    return {
      ok: false,
      error: 'Ninguna especie del paste es válida en @pkmn/sim.',
      importedCount: 0,
      nextProfile: profile,
    };
  }

  // Park current party into Reserve Box (preserving Ironman state — zero data loss!)
  const nextBox: OwnedPokemonInstance[] = profile.pokemonBox.map((m) =>
    m.zone === 'party' ? { ...m, zone: 'box' as const } : m
  );
  const nextItemStock = { ...profile.itemStock };
  const nextItems = new Set(profile.inventory.items);
  const nextPokemon = new Set(profile.inventory.pokemon);

  validSets.forEach((s, idx) => {
    const sp = Dex.species.get(s.species);
    const canonical = sp.name;
    const def = buildDefaultMemberForSpecies(canonical);
    const item = s.item?.trim() || '';
    if (item) {
      nextItems.add(item);
      nextItemStock[item] = Math.max(
        nextItemStock[item] ?? 0,
        validSets.filter((x) => x.item?.trim() === item).length
      );
    }
    nextPokemon.add(canonical);
    nextBox.push({
      uid: `imp-${getSpeciesKey(canonical)}-${Date.now().toString(36)}-${idx}`,
      species: canonical,
      ...(s.name && s.name.trim() && s.name.trim().toLowerCase() !== canonical.toLowerCase()
        ? { nickname: s.name.trim().slice(0, 24) }
        : {}),
      ...(s.gender === 'M' || s.gender === 'F'
        ? { gender: sanitizeGenderForSpecies(canonical, s.gender) }
        : {}),
      origin: 'Importado · Showdown Playtest',
      zone: 'party',
      item,
      ability: s.ability || def.ability,
      nature: s.nature || def.nature,
      teraType: s.teraType || def.teraType,
      moves:
        s.moves && s.moves.length > 0 ? s.moves.slice(0, 4) : [...def.moves],
      ...(sanitizeEvSpread(s.evs) ? { evs: sanitizeEvSpread(s.evs) } : {}),
      ...(sanitizeIvSpread(s.ivs) ? { ivs: sanitizeIvSpread(s.ivs) } : {}),
      shiny: Boolean(s.shiny && (profile.devModeEnabled || profile.inventory.shinyCharms > 0)),
      hp: null,
      maxhp: null,
      status: '',
    });
  });

  // Expose helper count sanity check
  void getAllAnythingGoesPlayableSpecies;

  return {
    ok: true,
    importedCount: validSets.length,
    nextProfile: {
      ...profile,
      useCustomTeamInStory: true,
      inventory: {
        ...profile.inventory,
        pokemon: Array.from(nextPokemon),
        items: Array.from(nextItems),
      },
      itemStock: nextItemStock,
      pokemonBox: nextBox,
      customTeam: syncCustomTeamFromBox(nextBox),
      updatedAt: new Date().toISOString(),
    },
  };
}

/**
 * Dev Mode: Adds 1 unique specimen of EVERY playable Anything Goes species (~1,286)
 * not already living in `pokemonBox` directly into `zone: 'box'` (Living Dex)!
 */
export function applyDevPopulateAllSpeciesToBox(
  profile: PlayerSaveProfile
): { addedCount: number; totalLiving: number; nextProfile: PlayerSaveProfile } {
  const base = applyDevUnlockFullAgPokedex(profile);
  const existingKeys = new Set(
    base.pokemonBox
      .filter((b) => b.zone !== 'graveyard')
      .map((b) => getSpeciesKey(b.species))
  );
  const allSpecies = getAllAnythingGoesPlayableSpecies();
  const additions: OwnedPokemonInstance[] = [];
  const nextInvPokemon = new Set(base.inventory.pokemon);

  for (let i = 0; i < allSpecies.length; i++) {
    const spName = allSpecies[i];
    const spKey = getSpeciesKey(spName);
    nextInvPokemon.add(spName);
    if (existingKeys.has(spKey)) continue;
    existingKeys.add(spKey);
    const sp = Dex.species.get(spName);
    const abilities = sp.exists
      ? Object.values(sp.abilities ?? {}).filter((a): a is string => Boolean(a))
      : [];
    const bs = sp.exists ? sp.baseStats : { hp: 80, atk: 80, def: 80, spa: 80, spd: 80, spe: 80 };
    const isPhys = bs.atk >= bs.spa;
    const def = buildDefaultMemberForSpecies(spName);
    additions.push({
      uid: `ldex-${spKey}`,
      species: def.species,
      origin: 'Dev Living Dex · AG',
      zone: 'box',
      item: '',
      ability: def.ability || abilities[0] || 'Pressure',
      nature: def.nature || (isPhys ? 'Adamant' : 'Modest'),
      teraType: def.teraType || sp.types?.[0] || 'Normal',
      moves: def.moves.slice(0, 4),
      shiny: false,
      hp: null,
      maxhp: null,
      status: '',
    });
  }

  const nextBox = [...base.pokemonBox, ...additions];
  return {
    addedCount: additions.length,
    totalLiving: nextBox.filter((b) => b.zone !== 'graveyard').length,
    nextProfile: {
      ...base,
      inventory: {
        ...base.inventory,
        pokemon: Array.from(nextInvPokemon),
      },
      pokemonBox: nextBox,
      updatedAt: new Date().toISOString(),
    },
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
    return buildSmartDefaultMemberForSpecies(species, cat);
  }
  return buildSmartDefaultMemberForSpecies(species);
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
    const customEvsLine = formatEvsLine(m.evs);
    const customIvsLine = formatIvsLine(m.ivs);
    const cleanGender = sanitizeGenderForSpecies(m.species, m.gender);
    return {
      nickname: m.nickname?.trim() || undefined,
      species: m.species,
      gender: cleanGender || undefined,
      item: m.item || undefined,
      ability: m.ability || sp.abilities?.[0] || undefined,
      level,
      happiness: hasFrustration ? 0 : undefined,
      shiny: m.shiny || undefined,
      teraType: m.teraType || sp.types?.[0] || 'Normal',
      evs:
        customEvsLine ??
        (usesSpecial
          ? '4 HP / 252 SpA / 252 Spe'
          : '4 HP / 252 Atk / 252 Spe'),
      ivs: customIvsLine,
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
    rivalName?: string;
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
    rivalName:
      patch.rivalName !== undefined
        ? sanitizeRivalName(patch.rivalName)
        : profile.rivalName ?? DEFAULT_RIVAL_NAME,
    hasStartedRun: patch.hasStartedRun ?? profile.hasStartedRun,
    updatedAt: new Date().toISOString(),
  };
}

export function setCustomRivalName(
  profile: PlayerSaveProfile,
  rivalName: string
): PlayerSaveProfile {
  return {
    ...profile,
    rivalName: sanitizeRivalName(rivalName),
    updatedAt: new Date().toISOString(),
  };
}

export function createNewConfiguredRunProfile(params: {
  displayName: string;
  email: string;
  runName: string;
  rivalName?: string;
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
    rivalName: sanitizeRivalName(params.rivalName),
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
  battleContext?: {
    chapterId?: string;
    chapterTitle?: string;
    rivalName?: string;
    turn?: number;
    difficulty?: BattleDifficultyMode;
    faintLog?: BattleFatalBlow[];
  }
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

  // Index forensic faint events by victim species so EVERY casualty gets exact killer + move + turn!
  const faintBySpecies = new Map<string, BattleFatalBlow>();
  for (const ev of battleContext?.faintLog ?? []) {
    faintBySpecies.set(getSpeciesKey(ev.victimSpecies), ev);
  }
  const newDeathEntries: NuzlockeDeathLogEntry[] = [];

  // Sync exact post-battle HP/status/PP onto matching active party instances in pokemonBox!
  // In Ultra Nuzlocke Diablo, any fainted instance moves permanently to zone='graveyard' with forensic epitaph + Death Log entry!
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
      const spKey = getSpeciesKey(inst.species);
      const match = bySpecies.get(spKey);
      if (!match) return inst;
      if (match.fainted && profile.nuzlockePermadeath) {
        const forensic = faintBySpecies.get(spKey);
        const nowIso = new Date().toISOString();
        const chId = battleContext?.chapterId || 'campaign';
        const chTitle = battleContext?.chapterTitle || 'Combate de Campaña';
        const rival = forensic?.rivalName || battleContext?.rivalName || 'Adversario';
        const killerSp = forensic?.attackerSpecies || rival;
        const killerMv = forensic?.moveName || 'Golpe letal';
        const deathTurn =
          forensic?.turn ?? battleContext?.turn ?? exportedState.capturedAtTurn ?? 1;
        const diff = battleContext?.difficulty ?? profile.defaultDifficulty;

        newDeathEntries.push({
          id: `death-${inst.uid}-${Date.now().toString(36)}-${newDeathEntries.length}`,
          uid: inst.uid,
          species: inst.species,
          ...(inst.nickname ? { nickname: inst.nickname } : {}),
          chapterId: chId,
          chapterTitle: chTitle,
          rivalName: rival,
          killerSpecies: killerSp,
          killerMove: killerMv,
          turn: deathTurn,
          difficulty: diff,
          fallenAt: nowIso,
        });

        return {
          ...inst,
          zone: 'graveyard' as const,
          hp: 0,
          maxhp: match.maxhp,
          status: '',
          item: '', // drop item back into stock when a mon falls
          epitaph: {
            chapterId: chId,
            chapterTitle: chTitle,
            rivalName: rival,
            killerSpecies: killerSp,
            killerMove: killerMv,
            difficulty: diff,
            turn: deathTurn,
            fallenAt: nowIso,
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

  const nextDeathLog =
    newDeathEntries.length > 0
      ? [...newDeathEntries, ...(profile.nuzlockeDeathLog ?? [])].slice(0, 200)
      : profile.nuzlockeDeathLog ?? [];

  return {
    ...profile,
    campGarden: nextGarden,
    fallenPokemon: Array.from(fallenSet),
    ironmanPartyState: nextIronmanState,
    pokemonBox: nextBox,
    nuzlockeDeathLog: nextDeathLog,
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
 * Permanently releases / discards a Pokémon instance from PC Boxes.
 * - Always keeps at least 1 Pokémon in the Active Party.
 * - In Ultra Nuzlocke mode, Graveyard memorials stay sacred unless Dev Mode is enabled.
 */
export function releasePokemonInstance(
  profile: PlayerSaveProfile,
  uid: string
): { ok: boolean; error?: string; releasedSpecies?: string; nextProfile: PlayerSaveProfile } {
  const target = profile.pokemonBox.find((b) => b.uid === uid);
  if (!target) {
    return { ok: false, error: 'Pokémon no encontrado en tus Cajas.', nextProfile: profile };
  }
  if (target.zone === 'graveyard' && profile.nuzlockePermadeath && !profile.devModeEnabled) {
    return {
      ok: false,
      error: 'En modo Ultra Nuzlocke los caídos del Cementerio permanecen en la bitácora memorial.',
      nextProfile: profile,
    };
  }
  if (target.zone === 'party') {
    const partyCount = profile.pokemonBox.filter((b) => b.zone === 'party').length;
    if (partyCount <= 1) {
      return {
        ok: false,
        error: 'No puedes liberar a tu único Pokémon en el Equipo Activo.',
        nextProfile: profile,
      };
    }
  }
  const nextBox = profile.pokemonBox.filter((b) => b.uid !== uid);
  return {
    ok: true,
    releasedSpecies: target.nickname ? `${target.nickname} (${target.species})` : target.species,
    nextProfile: {
      ...profile,
      pokemonBox: nextBox,
      customTeam: syncCustomTeamFromBox(nextBox),
      updatedAt: new Date().toISOString(),
    },
  };
}

/**
 * Updates moves (including teaching Rest while parked in the Box!), ability, nature, teraType,
 * nickname, gender, EVs (0..252, max 508 total), IVs (0..31), or Shiny on a unique `OwnedPokemonInstance`.
 */
export function updatePokemonInstanceBuild(
  profile: PlayerSaveProfile,
  uid: string,
  patch: Partial<
    Pick<
      OwnedPokemonInstance,
      'ability' | 'nature' | 'teraType' | 'moves' | 'shiny' | 'nickname' | 'gender' | 'evs' | 'ivs'
    >
  >
): { ok: boolean; error?: string; nextProfile: PlayerSaveProfile } {
  const target = profile.pokemonBox.find((b) => b.uid === uid);
  if (!target || target.zone === 'graveyard') {
    return { ok: false, error: 'Instancia no modificable.', nextProfile: profile };
  }

  if (patch.shiny === true && !target.shiny && !profile.devModeEnabled) {
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

  const nextBox = profile.pokemonBox.map((b) => {
    if (b.uid !== uid) return b;
    const nextNick =
      patch.nickname !== undefined
        ? patch.nickname.trim().slice(0, 24) || undefined
        : b.nickname;
    const nextGender =
      patch.gender !== undefined
        ? sanitizeGenderForSpecies(b.species, patch.gender) || undefined
        : b.gender;
    const nextEvs =
      patch.evs !== undefined ? sanitizeEvSpread(patch.evs) : b.evs;
    const nextIvs =
      patch.ivs !== undefined ? sanitizeIvSpread(patch.ivs) : b.ivs;
    return {
      ...b,
      ...patch,
      nickname: nextNick,
      gender: nextGender,
      evs: nextEvs,
      ivs: nextIvs,
      moves: patch.moves ? patch.moves.filter(Boolean).slice(0, 4) : b.moves,
    };
  });
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

/* ================= Saved Campaign Teams Library (Multiple Loadouts!) ================= */

export function saveCurrentPartyAsTeam(
  profile: PlayerSaveProfile,
  rawName: string,
  notes?: string
): { ok: boolean; error?: string; team?: SavedCampaignTeam; nextProfile: PlayerSaveProfile } {
  const party = profile.pokemonBox.filter((b) => b.zone === 'party').slice(0, 6);
  if (party.length === 0) {
    return { ok: false, error: 'Tu Equipo Activo está vacío.', nextProfile: profile };
  }
  const name = rawName.trim().slice(0, 40) || `Equipo #${(profile.savedTeams?.length ?? 0) + 1}`;
  const paste = compileCustomTeamToShowdownPaste(syncCustomTeamFromBox(profile.pokemonBox), 100);
  const existing = profile.savedTeams ?? [];
  const sameIdx = existing.findIndex(
    (t) => t.name.toLowerCase() === name.toLowerCase()
  );
  const record: SavedCampaignTeam = {
    id: sameIdx >= 0 ? existing[sameIdx].id : `team-${Date.now().toString(36)}-${existing.length}`,
    name,
    ...(notes?.trim() ? { notes: notes.trim().slice(0, 120) } : {}),
    paste,
    species: party.map((m) => m.species),
    memberUids: party.map((m) => m.uid),
    updatedAt: new Date().toISOString(),
  };
  const nextTeams =
    sameIdx >= 0
      ? existing.map((t, i) => (i === sameIdx ? record : t))
      : [record, ...existing].slice(0, 30);

  return {
    ok: true,
    team: record,
    nextProfile: {
      ...profile,
      savedTeams: nextTeams,
      updatedAt: new Date().toISOString(),
    },
  };
}

export function loadSavedCampaignTeam(
  profile: PlayerSaveProfile,
  teamId: string,
  options?: { allowSpawnMissing?: boolean }
): {
  ok: boolean;
  error?: string;
  loadedCount: number;
  missingSpecies: string[];
  nextProfile: PlayerSaveProfile;
} {
  const team = (profile.savedTeams ?? []).find((t) => t.id === teamId);
  if (!team) {
    return {
      ok: false,
      error: 'Equipo guardado no encontrado.',
      loadedCount: 0,
      missingSpecies: [],
      nextProfile: profile,
    };
  }

  // In Baby Mode or Dev Mode, allow importing directly from the saved Showdown paste if species aren't in Boxes!
  const allowSpawn = Boolean(options?.allowSpawnMissing || profile.devModeEnabled);
  const living = profile.pokemonBox.filter((b) => b.zone !== 'graveyard');
  const chosenUids: string[] = [];
  const missingSpecies: string[] = [];

  // 1) Try matching exact saved UIDs first (preserves exact Ironman HP/status/nicknames!)
  const preferredUids = team.memberUids ?? [];
  for (let i = 0; i < team.species.length; i++) {
    const spName = team.species[i];
    const spKey = getSpeciesKey(spName);
    const uidPref = preferredUids[i];
    const matchByUid = uidPref
      ? living.find((b) => b.uid === uidPref && !chosenUids.includes(b.uid))
      : undefined;
    const matchBySpecies =
      matchByUid ??
      living.find(
        (b) => getSpeciesKey(b.species) === spKey && !chosenUids.includes(b.uid)
      );
    if (matchBySpecies) {
      chosenUids.push(matchBySpecies.uid);
    } else {
      missingSpecies.push(spName);
    }
  }

  if (chosenUids.length === 0 && !allowSpawn) {
    return {
      ok: false,
      error:
        'Ningún miembro vivo de ese equipo está disponible en tus Cajas (pueden haber caído en Nuzlocke o sido liberados).',
      loadedCount: 0,
      missingSpecies,
      nextProfile: profile,
    };
  }

  if (allowSpawn && missingSpecies.length > 0) {
    const imp = importShowdownPasteToParty(profile, team.paste);
    if (imp.ok) {
      return {
        ok: true,
        loadedCount: imp.importedCount,
        missingSpecies: [],
        nextProfile: imp.nextProfile,
      };
    }
  }

  const chosenSet = new Set(chosenUids);
  // Park old party members safely into 'box' (without healing Ironman state!) and raise chosen living instances to 'party'
  const nextBox = profile.pokemonBox.map((b) => {
    if (chosenSet.has(b.uid)) return { ...b, zone: 'party' as const };
    if (b.zone === 'party') return { ...b, zone: 'box' as const };
    return b;
  });

  // Preserve saved party slot ordering cleanly
  const orderedParty = chosenUids
    .map((id) => nextBox.find((b) => b.uid === id))
    .filter((x): x is OwnedPokemonInstance => Boolean(x));
  const nonParty = nextBox.filter((b) => b.zone !== 'party');
  const finalBox = [...orderedParty, ...nonParty];

  return {
    ok: true,
    loadedCount: orderedParty.length,
    missingSpecies,
    nextProfile: {
      ...profile,
      useCustomTeamInStory: true,
      pokemonBox: finalBox,
      customTeam: syncCustomTeamFromBox(finalBox),
      updatedAt: new Date().toISOString(),
    },
  };
}

export function deleteSavedCampaignTeam(
  profile: PlayerSaveProfile,
  teamId: string
): PlayerSaveProfile {
  return {
    ...profile,
    savedTeams: (profile.savedTeams ?? []).filter((t) => t.id !== teamId),
    updatedAt: new Date().toISOString(),
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
