import { Dex } from '@pkmn/sim';
import { getLegalLearnsetForSpecies, getSpeciesKey } from './learnsetService';
import { computePokemonBst, computePokemonShopPricing } from './pricingEngine';
import type { OwnedPokemonInstance, StatSpread } from '../types/game';

export type ShowdownFilterKind = 'type' | 'ability' | 'move' | 'tier';

export interface ShowdownSearchFilter {
  kind: ShowdownFilterKind;
  value: string;
  label: string;
}

export type ShowdownSortKey = 'name' | 'bst' | 'spe' | 'atk' | 'spa' | 'hp' | 'def' | 'spd';

export interface IndexedSpeciesMeta {
  name: string;
  id: string;
  types: string[];
  abilities: string[];
  baseStats: StatSpread;
  bst: number;
  tierBand: string;
  rawTier: string;
  /** 'M' (male-only), 'F' (female-only), 'N' (genderless), or '' (can be M or F). */
  fixedGender: '' | 'M' | 'F' | 'N';
}

export interface ShowdownAutocompleteResult {
  types: Array<{ name: string }>;
  abilities: Array<{ name: string; shortDesc: string }>;
  moves: Array<{ name: string; type: string; basePower: number; category: string }>;
  tiers: Array<{ name: string }>;
}

const ALL_TYPES = [
  'Normal',
  'Fire',
  'Water',
  'Electric',
  'Grass',
  'Ice',
  'Fighting',
  'Poison',
  'Ground',
  'Flying',
  'Psychic',
  'Bug',
  'Rock',
  'Ghost',
  'Dragon',
  'Dark',
  'Steel',
  'Fairy',
];

const ALL_TIERS = ['Uber', 'OU', 'UUBL / UU', 'RU / NU', 'PU / ZU', 'LC'];

const speciesMetaCache = new Map<string, IndexedSpeciesMeta>();
const speciesMoveSetCache = new Map<string, Set<string>>();

let abilitiesIndexCache: Array<{ id: string; name: string; lower: string; shortDesc: string }> | null = null;
let movesIndexCache: Array<{
  id: string;
  name: string;
  lower: string;
  type: string;
  basePower: number;
  category: string;
}> | null = null;

function ensureAbilitiesIndex() {
  if (abilitiesIndexCache) return abilitiesIndexCache;
  abilitiesIndexCache = Dex.abilities
    .all()
    .filter((a) => a.exists && a.isNonstandard !== 'CAP' && a.isNonstandard !== 'Unobtainable')
    .map((a) => ({
      id: a.id,
      name: a.name,
      lower: a.name.toLowerCase(),
      shortDesc: a.shortDesc || a.desc || '',
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
  return abilitiesIndexCache;
}

function ensureMovesIndex() {
  if (movesIndexCache) return movesIndexCache;
  movesIndexCache = Dex.moves
    .all()
    .filter(
      (m) =>
        m.exists &&
        !m.isZ &&
        !m.isMax &&
        m.isNonstandard !== 'CAP' &&
        m.isNonstandard !== 'LGPE' &&
        m.isNonstandard !== 'Future' &&
        m.isNonstandard !== 'Unobtainable'
    )
    .map((m) => ({
      id: m.id,
      name: m.name,
      lower: m.name.toLowerCase(),
      type: m.type,
      basePower: m.basePower ?? 0,
      category: m.category,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
  return movesIndexCache;
}

/**
 * Returns O(1)-cached Showdown Teambuilder metadata (types, abilities, base stats, BST, tier, fixed gender)
 * for any playable Pokémon species in @pkmn/sim.
 */
export function getIndexedSpeciesMeta(speciesName: string): IndexedSpeciesMeta {
  const key = getSpeciesKey(speciesName);
  const cached = speciesMetaCache.get(key);
  if (cached) return cached;

  const sp = Dex.species.get(speciesName);
  const canonical = sp.exists ? sp.name : speciesName;
  const pricing = computePokemonShopPricing(canonical);
  const abilities = sp.exists
    ? Array.from(
        new Set(
          Object.values(sp.abilities ?? {}).filter(
            (a): a is string => typeof a === 'string' && a.length > 0
          )
        )
      )
    : [];
  const bs = sp.exists
    ? sp.baseStats
    : { hp: 80, atk: 80, def: 80, spa: 80, spd: 80, spe: 80 };
  const fixedGender: '' | 'M' | 'F' | 'N' =
    sp.exists && (sp.gender === 'M' || sp.gender === 'F' || sp.gender === 'N')
      ? sp.gender
      : '';

  const meta: IndexedSpeciesMeta = {
    name: canonical,
    id: sp.exists ? sp.id : key,
    types: sp.exists && sp.types.length > 0 ? [...sp.types] : ['Normal'],
    abilities,
    baseStats: {
      hp: bs.hp,
      atk: bs.atk,
      def: bs.def,
      spa: bs.spa,
      spd: bs.spd,
      spe: bs.spe,
    },
    bst: computePokemonBst(canonical),
    tierBand: pricing.tierBand,
    rawTier: pricing.rawTier,
    fixedGender,
  };
  speciesMetaCache.set(key, meta);
  return meta;
}

/**
 * Cached legal move-ID Set for instant Showdown-style `Move` filter chip checks across 1,286 species.
 */
export function speciesCanLearnMove(speciesName: string, moveNameOrId: string): boolean {
  const spKey = getSpeciesKey(speciesName);
  let moveSet = speciesMoveSetCache.get(spKey);
  if (!moveSet) {
    const learnset = getLegalLearnsetForSpecies(
      speciesName,
      'gen9doublescustomgame@@@NatDex Mod'
    );
    moveSet = new Set(learnset.map((m) => m.id));
    speciesMoveSetCache.set(spKey, moveSet);
  }
  const targetId = Dex.moves.get(moveNameOrId).id || getSpeciesKey(moveNameOrId);
  return moveSet.has(targetId);
}

/**
 * Computes Showdown-style grouped autocomplete filter suggestions (Types / Abilities / Moves / Tiers)
 * for the live query string, excluding already-applied chips.
 */
export function queryShowdownSuggestions(
  rawQuery: string,
  activeFilters: ShowdownSearchFilter[]
): ShowdownAutocompleteResult {
  const q = rawQuery.trim().toLowerCase();
  if (q.length < 2) {
    return { types: [], abilities: [], moves: [], tiers: [] };
  }
  const activeKeySet = new Set(
    activeFilters.map((f) => `${f.kind}:${f.value.toLowerCase()}`)
  );

  const types = ALL_TYPES.filter(
    (t) => t.toLowerCase().includes(q) && !activeKeySet.has(`type:${t.toLowerCase()}`)
  )
    .slice(0, 4)
    .map((name) => ({ name }));

  const tiers = ALL_TIERS.filter(
    (t) => t.toLowerCase().includes(q) && !activeKeySet.has(`tier:${t.toLowerCase()}`)
  )
    .slice(0, 3)
    .map((name) => ({ name }));

  const allAb = ensureAbilitiesIndex();
  const abilities = allAb
    .filter(
      (a) =>
        (a.lower.startsWith(q) || a.lower.includes(q)) &&
        !activeKeySet.has(`ability:${a.lower}`)
    )
    .sort((a, b) => Number(b.lower.startsWith(q)) - Number(a.lower.startsWith(q)))
    .slice(0, 4)
    .map((a) => ({ name: a.name, shortDesc: a.shortDesc }));

  const allMv = ensureMovesIndex();
  const moves = allMv
    .filter(
      (m) =>
        (m.lower.startsWith(q) || m.lower.includes(q)) &&
        !activeKeySet.has(`move:${m.lower}`)
    )
    .sort((a, b) => Number(b.lower.startsWith(q)) - Number(a.lower.startsWith(q)))
    .slice(0, 5)
    .map((m) => ({
      name: m.name,
      type: m.type,
      basePower: m.basePower,
      category: m.category,
    }));

  return { types, abilities, moves, tiers };
}

interface StatPredicate {
  stat: keyof StatSpread | 'bst';
  op: '>=' | '<=' | '>' | '<' | '=';
  value: number;
}

function parseStatPredicate(token: string): StatPredicate | null {
  const m = token.match(/^(bst|hp|atk|def|spa|spd|spe)\s*(>=|<=|>|<|=)\s*(\d+)$/i);
  if (!m) return null;
  return {
    stat: m[1].toLowerCase() as StatPredicate['stat'],
    op: m[2] as StatPredicate['op'],
    value: Number(m[3]),
  };
}

function matchesStatPredicate(meta: IndexedSpeciesMeta, pred: StatPredicate): boolean {
  const actual = pred.stat === 'bst' ? meta.bst : meta.baseStats[pred.stat];
  switch (pred.op) {
    case '>=':
      return actual >= pred.value;
    case '<=':
      return actual <= pred.value;
    case '>':
      return actual > pred.value;
    case '<':
      return actual < pred.value;
    case '=':
      return actual === pred.value;
  }
}

export function matchesShowdownFilters(
  speciesName: string,
  rawQuery: string,
  filters: ShowdownSearchFilter[],
  instance?: OwnedPokemonInstance
): boolean {
  const meta = getIndexedSpeciesMeta(speciesName);

  // 1) All explicit Showdown Filter Chips must match (AND semantics)
  for (const f of filters) {
    const val = f.value.toLowerCase();
    if (f.kind === 'type') {
      if (!meta.types.some((t) => t.toLowerCase() === val)) return false;
    } else if (f.kind === 'ability') {
      const hasAb = instance
        ? instance.ability.toLowerCase() === val ||
          meta.abilities.some((a) => a.toLowerCase() === val)
        : meta.abilities.some((a) => a.toLowerCase() === val);
      if (!hasAb) return false;
    } else if (f.kind === 'tier') {
      const bandMatch = meta.tierBand.toLowerCase() === val;
      const rawMatch = meta.rawTier.toLowerCase().includes(val);
      if (!bandMatch && !rawMatch) return false;
    } else if (f.kind === 'move') {
      if (
        instance &&
        instance.moves.some((mv) => mv.toLowerCase() === val)
      ) {
        continue;
      }
      if (!speciesCanLearnMove(meta.name, f.value)) return false;
    }
  }

  // 2) Free-text search (comma-separated or space-separated tokens, supporting stat expressions like `spe>=100` or `bst<=450`!)
  const trimmed = rawQuery.trim().toLowerCase();
  if (!trimmed) return true;

  const tokens = trimmed.split(/\s*,\s*/).filter(Boolean);
  for (const token of tokens) {
    const statPred = parseStatPredicate(token);
    if (statPred) {
      if (!matchesStatPredicate(meta, statPred)) return false;
      continue;
    }
    const nameMatch = meta.name.toLowerCase().includes(token);
    const nickMatch = Boolean(instance?.nickname?.toLowerCase().includes(token));
    const typeMatch = meta.types.some((t) => t.toLowerCase().includes(token));
    const abMatch =
      meta.abilities.some((a) => a.toLowerCase().includes(token)) ||
      Boolean(instance?.ability?.toLowerCase().includes(token));
    const itemMatch = Boolean(instance?.item?.toLowerCase().includes(token));
    const moveMatch = Boolean(
      instance?.moves?.some((mv) => mv.toLowerCase().includes(token))
    );
    const tierMatch =
      meta.tierBand.toLowerCase().includes(token) ||
      meta.rawTier.toLowerCase().includes(token);
    const originMatch = Boolean(instance?.origin?.toLowerCase().includes(token));

    if (
      !nameMatch &&
      !nickMatch &&
      !typeMatch &&
      !abMatch &&
      !itemMatch &&
      !moveMatch &&
      !tierMatch &&
      !originMatch
    ) {
      return false;
    }
  }

  return true;
}

export function compareByShowdownSort(
  speciesA: string,
  speciesB: string,
  sortBy: ShowdownSortKey
): number {
  if (sortBy === 'name') {
    return speciesA.localeCompare(speciesB);
  }
  const a = getIndexedSpeciesMeta(speciesA);
  const b = getIndexedSpeciesMeta(speciesB);
  const diff =
    sortBy === 'bst' ? b.bst - a.bst : b.baseStats[sortBy] - a.baseStats[sortBy];
  return diff !== 0 ? diff : a.name.localeCompare(b.name);
}

/**
 * Exact Showdown / Mainline stat calculation for Level 1..100+ with Nature, IVs & EVs
 * (used by the Showdown-style EV/IV stat panel in <PokemonEditor />!).
 */
const NATURE_MODS: Record<string, { plus?: keyof StatSpread; minus?: keyof StatSpread }> = {
  Adamant: { plus: 'atk', minus: 'spa' },
  Lonely: { plus: 'atk', minus: 'def' },
  Brave: { plus: 'atk', minus: 'spe' },
  Naughty: { plus: 'atk', minus: 'spd' },
  Bold: { plus: 'def', minus: 'atk' },
  Relaxed: { plus: 'def', minus: 'spe' },
  Impish: { plus: 'def', minus: 'spa' },
  Lax: { plus: 'def', minus: 'spd' },
  Timid: { plus: 'spe', minus: 'atk' },
  Hasty: { plus: 'spe', minus: 'def' },
  Jolly: { plus: 'spe', minus: 'spa' },
  Naive: { plus: 'spe', minus: 'spd' },
  Modest: { plus: 'spa', minus: 'atk' },
  Mild: { plus: 'spa', minus: 'def' },
  Quiet: { plus: 'spa', minus: 'spe' },
  Rash: { plus: 'spa', minus: 'spd' },
  Calm: { plus: 'spd', minus: 'atk' },
  Gentle: { plus: 'spd', minus: 'def' },
  Sassy: { plus: 'spd', minus: 'spe' },
  Careful: { plus: 'spd', minus: 'spa' },
};

export function getNatureStatModifiers(nature: string): {
  plus?: keyof StatSpread;
  minus?: keyof StatSpread;
} {
  return NATURE_MODS[nature] ?? {};
}

export function calculatePokemonStats(
  speciesName: string,
  level = 100,
  nature = 'Serious',
  evs: Partial<StatSpread> = {},
  ivs: Partial<StatSpread> = {}
): StatSpread {
  const meta = getIndexedSpeciesMeta(speciesName);
  const bs = meta.baseStats;
  const mods = getNatureStatModifiers(nature);
  const isShedinja = meta.id === 'shedinja';

  const calcOther = (stat: Exclude<keyof StatSpread, 'hp'>): number => {
    const iv = Math.max(0, Math.min(31, Math.floor(ivs[stat] ?? 31)));
    const ev = Math.max(0, Math.min(252, Math.floor(evs[stat] ?? 0)));
    const raw = Math.floor(((2 * bs[stat] + iv + Math.floor(ev / 4)) * level) / 100) + 5;
    const mult = mods.plus === stat ? 1.1 : mods.minus === stat ? 0.9 : 1;
    return Math.floor(raw * mult);
  };

  const hpIv = Math.max(0, Math.min(31, Math.floor(ivs.hp ?? 31)));
  const hpEv = Math.max(0, Math.min(252, Math.floor(evs.hp ?? 0)));
  const hp = isShedinja
    ? 1
    : Math.floor(((2 * bs.hp + hpIv + Math.floor(hpEv / 4)) * level) / 100) + level + 10;

  return {
    hp,
    atk: calcOther('atk'),
    def: calcOther('def'),
    spa: calcOther('spa'),
    spd: calcOther('spd'),
    spe: calcOther('spe'),
  };
}
