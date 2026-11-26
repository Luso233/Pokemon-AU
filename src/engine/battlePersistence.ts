import { Teams, toID, type BattleStreams } from '@pkmn/sim';
import type {
  PersistedMoveSlot,
  PersistedPartyState,
  PersistedPokemonState,
} from '../types/game';

type SimBattle = NonNullable<
  InstanceType<typeof BattleStreams.BattleStream>['battle']
>;

const VALID_PERSISTED_STATUSES = new Set([
  'par',
  'brn',
  'psn',
  'tox',
  'slp',
  'frz',
]);

function normalizeStatus(
  raw: string | undefined
): PersistedPokemonState['status'] {
  const s = (raw ?? '').trim().toLowerCase();
  return VALID_PERSISTED_STATUSES.has(s)
    ? (s as PersistedPokemonState['status'])
    : '';
}

/**
 * BattlePersistenceManager:
 * Supports consecutive Back-to-Back battles without healing (`VN -> Battle 1 -> VN -> Battle 2`).
 * - `exportPartyState`: extracts exact HP, fainted state, status, and remaining PP per move from `battle.sides[0].pokemon`.
 * - `reorderPasteForConsciousLead`: ensures slot 0 of Battle 2 is always a conscious Pokémon so @pkmn/sim deploys cleanly.
 * - `injectPartyState`: overwrites `hp`, `fainted`, `status`, `pokemonLeft`, and `moveSlots[i].pp` before Turn 1 resolves.
 */
export class BattlePersistenceManager {
  public static exportPartyState(
    battle: SimBattle,
    sourceBattleId = 'wave-1'
  ): PersistedPartyState {
    const side0 = battle.sides[0];
    const pokemon: PersistedPokemonState[] = side0.pokemon.map((poke) => {
      const moveSlots: PersistedMoveSlot[] = (poke.moveSlots ?? []).map(
        (slot) => ({
          id: toID(slot.id || slot.move),
          move: slot.move,
          pp: Math.max(0, Number(slot.pp) || 0),
          maxpp: Math.max(1, Number(slot.maxpp) || 1),
        })
      );

      const ppByMoveId: Record<string, number> = {};
      for (const ms of moveSlots) {
        ppByMoveId[ms.id] = ms.pp;
      }

      const isFainted = Boolean(poke.fainted || poke.hp <= 0);
      return {
        species: poke.baseSpecies?.name || poke.species?.name || poke.name,
        name: poke.name,
        hp: isFainted ? 0 : Math.max(1, poke.hp),
        maxhp: Math.max(1, poke.maxhp),
        fainted: isFainted,
        status: isFainted ? '' : normalizeStatus(poke.status),
        moveSlots,
        ppByMoveId,
      };
    });

    return {
      sourceBattleId,
      capturedAtTurn: battle.turn,
      pokemon,
    };
  }

  /**
   * If Pokémon #0 fainted during Battle 1, moves the first conscious Pokémon to slot 0
   * so `@pkmn/sim` deploys a conscious lead automatically at the start of Battle 2.
   */
  public static reorderPasteForConsciousLead(
    paste: string,
    savedParty?: PersistedPartyState
  ): string {
    if (!savedParty || savedParty.pokemon.length === 0) return paste;
    const sets = Teams.import(paste);
    if (!sets || sets.length <= 1) return paste;

    const findSaved = (speciesName: string, nickname?: string) =>
      savedParty.pokemon.find(
        (s) =>
          (nickname && toID(s.name) === toID(nickname)) ||
          toID(s.species) === toID(speciesName)
      );

    const firstSaved = findSaved(sets[0].species, sets[0].name);
    if (!firstSaved || !firstSaved.fainted) {
      return paste;
    }

    const consciousIdx = sets.findIndex((set) => {
      const matched = findSaved(set.species, set.name);
      return !matched || !matched.fainted;
    });

    if (consciousIdx <= 0) return paste;

    const reordered = [...sets];
    const [lead] = reordered.splice(consciousIdx, 1);
    reordered.unshift(lead);
    return Teams.export(reordered).trim();
  }

  /**
   * Injects exact saved HP, fainted status, status ailments, and remaining move PP
   * directly into `battle.sides[0].pokemon`, then triggers a fresh player request & protocol update.
   */
  public static injectPartyState(
    battle: SimBattle,
    savedParty: PersistedPartyState
  ): { appliedCount: number; faintedCount: number } {
    const side0 = battle.sides[0];
    const usedSavedIndices = new Set<number>();
    let appliedCount = 0;
    let faintedCount = 0;

    for (const poke of side0.pokemon) {
      const pokeSpeciesId = toID(poke.baseSpecies?.name || poke.species?.name);
      const pokeNameId = toID(poke.name);

      let matchIdx = savedParty.pokemon.findIndex(
        (s, idx) =>
          !usedSavedIndices.has(idx) &&
          (toID(s.name) === pokeNameId || toID(s.species) === pokeSpeciesId)
      );
      if (matchIdx === -1) {
        matchIdx = savedParty.pokemon.findIndex(
          (s, idx) =>
            !usedSavedIndices.has(idx) && toID(s.species) === pokeSpeciesId
        );
      }
      if (matchIdx === -1) continue;

      usedSavedIndices.add(matchIdx);
      const saved = savedParty.pokemon[matchIdx];
      appliedCount++;

      // 1. Overwrite Move PP
      if (poke.moveSlots && poke.moveSlots.length > 0) {
        for (let i = 0; i < poke.moveSlots.length; i++) {
          const slot = poke.moveSlots[i];
          const moveId = toID(slot.id || slot.move);
          const savedPP =
            saved.ppByMoveId[moveId] ?? saved.moveSlots[i]?.pp ?? slot.pp;
          slot.pp = Math.max(0, Math.min(slot.maxpp, savedPP));
          if (poke.baseMoveSlots?.[i]) {
            poke.baseMoveSlots[i].pp = slot.pp;
          }
        }
      }

      // 2. Overwrite Fainted / HP / Status
      if (saved.fainted || saved.hp <= 0) {
        poke.hp = 0;
        poke.fainted = true;
        poke.status = 'fnt' as typeof poke.status;
        poke.statusState = {
          effectOrder: 0,
          id: 'fnt',
          target: poke,
        } as unknown as typeof poke.statusState;
        faintedCount++;
        if (poke.isActive) {
          battle.add('-damage', poke, '0 fnt', '[from] Persistencia');
          battle.add('faint', poke);
        }
      } else {
        const clampedHp = Math.max(1, Math.min(poke.maxhp, saved.hp));
        if (clampedHp < poke.maxhp) {
          poke.sethp(clampedHp);
          if (poke.isActive) {
            battle.add(
              '-damage',
              poke,
              poke.getHealth,
              '[from] Desgaste previo'
            );
          }
        }
        if (saved.status) {
          poke.status = saved.status as typeof poke.status;
          poke.statusState = {
            effectOrder: 0,
            id: saved.status,
            target: poke,
            ...(saved.status === 'slp' ? { time: 2, startTime: 2 } : {}),
            ...(saved.status === 'tox' ? { stage: 1 } : {}),
          } as unknown as typeof poke.statusState;
          if (poke.isActive) {
            battle.add('-status', poke, saved.status, '[from] Desgaste previo');
          }
        }
      }
    }

    // Keep side.pokemonLeft accurate so win/loss triggers at the exact right KO!
    side0.pokemonLeft = side0.pokemon.filter((p) => !p.fainted).length;

    return { appliedCount, faintedCount };
  }

  public static summarizePartyWear(savedParty: PersistedPartyState): {
    aliveCount: number;
    faintedCount: number;
    totalCount: number;
    avgHpPercent: number;
  } {
    const totalCount = savedParty.pokemon.length;
    const aliveMons = savedParty.pokemon.filter((p) => !p.fainted);
    const faintedCount = totalCount - aliveMons.length;
    const avgHpPercent =
      totalCount > 0
        ? Math.round(
            savedParty.pokemon.reduce(
              (acc, p) => acc + (p.fainted ? 0 : (p.hp / Math.max(1, p.maxhp)) * 100),
              0
            ) / totalCount
          )
        : 0;
    return {
      aliveCount: aliveMons.length,
      faintedCount,
      totalCount,
      avgHpPercent,
    };
  }
}
