import { Dex } from '@pkmn/sim';
import {
  ensureShadowDexRegistered,
  isShadowMoveName,
  SHADOW_MOVES_CATALOG,
} from './shadowEngine';

export interface LegalMoveOption {
  id: string;
  name: string;
  type: string;
  category: 'Physical' | 'Special' | 'Status';
  basePower: number;
  accuracy: number | true;
  priority: number;
  shortDesc: string;
}

export const MOVE_SLOT_UNLOCK_COSTS = [500, 1000, 1500, 2000] as const;

export function getMoveSlotUnlockCost(slotIndex: number): number {
  const clamped = Math.max(0, Math.min(3, Math.floor(slotIndex)));
  return MOVE_SLOT_UNLOCK_COSTS[clamped];
}

export function getSpeciesKey(species: string): string {
  return species.toLowerCase().replace(/[^a-z0-9]/g, '');
}

export function getFormatGeneration(formatId: string): number {
  const lower = formatId.toLowerCase();
  if (lower.startsWith('gen1')) return 1;
  if (lower.startsWith('gen2')) return 2;
  if (lower.startsWith('gen3')) return 3;
  if (lower.startsWith('gen4')) return 4;
  if (lower.startsWith('gen5')) return 5;
  if (lower.startsWith('gen6')) return 6;
  if (lower.startsWith('gen7')) return 7;
  if (lower.startsWith('gen8')) return 8;
  return 9;
}

const learnsetCache = new Map<string, LegalMoveOption[]>();

/**
 * Queries @pkmn/sim's built-in Dex Learnsets database (walking pre-evolutions
 * and base formes automatically) to return every legal move a Pokémon can learn
 * in the target format's generation.
 */
export function getLegalLearnsetForSpecies(
  speciesName: string,
  formatId = 'gen9customgame@@@NatDex Mod',
  extraAllowedMoves: string[] = [],
  includeShadowMoves = false
): LegalMoveOption[] {
  ensureShadowDexRegistered();
  const gen = getFormatGeneration(formatId);
  const isOfficialStandard =
    formatId === 'gen9vgc2024regg' ||
    formatId === 'gen9monotype' ||
    formatId === 'gen91v1' ||
    formatId === 'gen9lc';

  const baseKey = `${getSpeciesKey(speciesName)}::g${gen}::${isOfficialStandard ? 'std' : 'custom'}`;

  let cached = learnsetCache.get(baseKey);
  if (!cached) {
    const genDex = Dex.forGen(gen);
    const fullDex = Dex;
    const rawMoveIds = new Set<string>();

    // Collect species lineage: target forme -> baseSpecies -> changesFrom -> prevo chain
    const queue: string[] = [speciesName];
    const visited = new Set<string>();

    while (queue.length > 0) {
      const currentName = queue.shift()!;
      const sp = fullDex.species.get(currentName);
      if (!sp.exists) continue;
      if (visited.has(sp.id)) continue;
      visited.add(sp.id);

      const lsEntry =
        (gen < 9 ? genDex.data.Learnsets[sp.id]?.learnset : undefined) ??
        fullDex.data.Learnsets[sp.id]?.learnset;
      if (lsEntry) {
        for (const [moveId, sources] of Object.entries(lsEntry)) {
          if (!Array.isArray(sources) || sources.length === 0) continue;
          if (gen === 1) {
            if (sources.some((s) => s.startsWith('1'))) {
              rawMoveIds.add(moveId);
            }
          } else if (gen < 9) {
            if (
              sources.some((s) => {
                const srcGen = parseInt(s[0], 10);
                return !Number.isNaN(srcGen) && srcGen <= gen;
              })
            ) {
              rawMoveIds.add(moveId);
            }
          } else {
            if (isOfficialStandard) {
              // Standard Gen 9 legal learnset (includes Gen 9 level-up/TM/egg/tutor)
              if (sources.some((s) => s.startsWith('9'))) {
                rawMoveIds.add(moveId);
              }
            } else {
              rawMoveIds.add(moveId);
            }
          }
        }
      }

      if (sp.baseSpecies && sp.baseSpecies !== sp.name) {
        queue.push(sp.baseSpecies);
      }
      if (sp.changesFrom) {
        const changes = Array.isArray(sp.changesFrom)
          ? sp.changesFrom
          : [sp.changesFrom];
        for (const ch of changes) queue.push(ch);
      }
      if (sp.prevo) {
        queue.push(sp.prevo);
      }
    }

    // Fallback for Gen 9 standard formats if a Pokémon wasn't in S/V Dex directly
    if (rawMoveIds.size === 0 && gen === 9) {
      for (const id of visited) {
        const lsEntry = fullDex.data.Learnsets[id]?.learnset;
        if (!lsEntry) continue;
        for (const moveId of Object.keys(lsEntry)) {
          rawMoveIds.add(moveId);
        }
      }
    }

    const options: LegalMoveOption[] = [];
    for (const moveId of rawMoveIds) {
      const mv = gen < 9 ? genDex.moves.get(moveId) : fullDex.moves.get(moveId);
      if (!mv.exists) continue;
      if (mv.gen > gen) continue;
      if (mv.isZ || mv.isMax) continue;
      if (
        mv.isNonstandard === 'CAP' ||
        mv.isNonstandard === 'LGPE' ||
        mv.isNonstandard === 'Future' ||
        mv.isNonstandard === 'Unobtainable'
      ) {
        continue;
      }
      if (isOfficialStandard && mv.isNonstandard === 'Past') continue;

      options.push({
        id: mv.id,
        name: mv.name,
        type: mv.type,
        category: mv.category as 'Physical' | 'Special' | 'Status',
        basePower: mv.basePower ?? 0,
        accuracy: mv.accuracy,
        priority: mv.priority ?? 0,
        shortDesc: mv.shortDesc || mv.desc || '',
      });
    }

    options.sort((a, b) => a.name.localeCompare(b.name));
    cached = options;
    learnsetCache.set(baseKey, cached);
  }

  const combinedExtras = includeShadowMoves
    ? [...SHADOW_MOVES_CATALOG.map((m) => m.name), ...extraAllowedMoves]
    : extraAllowedMoves;

  if (combinedExtras.length === 0) return cached;

  const existingIds = new Set(cached.map((m) => m.id));
  const extras: LegalMoveOption[] = [];
  for (const mvName of combinedExtras) {
    const mv = Dex.moves.get(mvName);
    if (!mv.exists || existingIds.has(mv.id)) continue;
    existingIds.add(mv.id);
    extras.push({
      id: mv.id,
      name: mv.name,
      type: mv.type,
      category: mv.category as 'Physical' | 'Special' | 'Status',
      basePower: mv.basePower ?? 0,
      accuracy: mv.accuracy,
      priority: mv.priority ?? 0,
      shortDesc: mv.shortDesc || mv.desc || '',
    });
  }

  if (extras.length === 0) return cached;
  return [...extras, ...cached].sort((a, b) => a.name.localeCompare(b.name));
}

export function isMoveLegalForSpecies(
  speciesName: string,
  moveName: string,
  formatId = 'gen9customgame@@@NatDex Mod',
  extraAllowedMoves: string[] = [],
  includeShadowMoves = false
): boolean {
  ensureShadowDexRegistered();
  if (includeShadowMoves && isShadowMoveName(moveName)) return true;
  const targetId = Dex.moves.get(moveName).id;
  if (!targetId) return false;
  const learnset = getLegalLearnsetForSpecies(
    speciesName,
    formatId,
    extraAllowedMoves,
    includeShadowMoves
  );
  return learnset.some((m) => m.id === targetId);
}
