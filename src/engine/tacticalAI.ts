import { Dex } from '@pkmn/sim';
import type { BattleFormat } from '../types/game';

interface ShowdownRequestMove {
  move: string;
  id: string;
  pp?: number;
  maxpp?: number;
  target?: string;
  disabled?: boolean | string;
}

interface ShowdownRequestActive {
  moves: ShowdownRequestMove[];
  trapped?: boolean;
  canMegaEvo?: boolean;
}

interface ShowdownRequestSidePokemon {
  ident: string;
  details: string;
  condition: string;
  active: boolean;
  stats?: Record<string, number>;
  moves: string[];
  baseAbility: string;
  item: string;
}

export interface ShowdownRequest {
  wait?: boolean;
  teamPreview?: boolean;
  forceSwitch?: boolean[];
  active?: (ShowdownRequestActive | null)[];
  side: {
    name: string;
    id: 'p1' | 'p2';
    pokemon: ShowdownRequestSidePokemon[];
  };
}

export interface OpponentContext {
  format: BattleFormat;
  foeActiveSpecies: (string | null)[];
  foeActiveStatus: (string | null)[];
  turn: number;
}

function isFainted(condition: string): boolean {
  return condition === '0 fnt' || condition.endsWith(' fnt');
}

function parseSpeciesFromDetails(details: string): string {
  return details.split(',')[0].trim();
}

function calcTypeMultiplier(moveType: string, defenderTypes: string[]): number {
  let mult = 1;
  for (const defType of defenderTypes) {
    if (!Dex.getImmunity(moveType, defType)) {
      return 0;
    }
    const eff = Dex.getEffectiveness(moveType, defType);
    if (eff > 0) mult *= 2;
    else if (eff < 0) mult *= 0.5;
  }
  return mult;
}

/**
 * Heuristic tactical AI for P2. Handles both Singles (e.g., 6 Magikarps)
 * and Doubles 2v2 (e.g., Smeargle/Sableye/Cottonee/Clefairy/Ditto).
 */
export function chooseRivalAction(
  request: ShowdownRequest,
  ctx: OpponentContext
): string | null {
  if (request.wait) return null;
  if (request.teamPreview) return 'default';

  const party = request.side?.pokemon ?? [];

  // 1. Forced switches after KO
  if (request.forceSwitch) {
    const usedSlots = new Set<number>();
    const cmds = request.forceSwitch.map((needsSwitch) => {
      if (!needsSwitch) return 'pass';
      const candidateIdx = party.findIndex(
        (p, idx) => !p.active && !isFainted(p.condition) && !usedSlots.has(idx + 1)
      );
      if (candidateIdx === -1) return 'pass';
      const slot = candidateIdx + 1;
      usedSlots.add(slot);
      return `switch ${slot}`;
    });
    return cmds.join(', ');
  }

  // 2. Normal turn move selection
  if (request.active) {
    const commands: string[] = [];

    for (let slotIdx = 0; slotIdx < request.active.length; slotIdx++) {
      const activeSlot = request.active[slotIdx];
      const selfMon = party[slotIdx];
      if (!activeSlot || !selfMon || isFainted(selfMon.condition)) {
        commands.push('pass');
        continue;
      }

      const selfSpecies = Dex.species.get(parseSpeciesFromDetails(selfMon.details));
      const legalMoves = activeSlot.moves
        .map((m, idx) => ({ ...m, slot: idx + 1 }))
        .filter((m) => !m.disabled);

      if (legalMoves.length === 0) {
        commands.push('move 1');
        continue;
      }

      // Score moves against active foes
      let bestCmd = `move ${legalMoves[0].slot}`;
      let bestScore = -999;

      const aliveFoeSlots: number[] = [];
      ctx.foeActiveSpecies.forEach((sp, i) => {
        if (sp) aliveFoeSlots.push(i);
      });
      if (aliveFoeSlots.length === 0) aliveFoeSlots.push(0);

      for (const mv of legalMoves) {
        const moveData = Dex.moves.get(mv.id || mv.move);
        const targetType = mv.target || moveData.target || 'normal';
        const needsFoeTarget =
          ctx.format === 'doubles' &&
          (targetType === 'normal' ||
            targetType === 'any' ||
            targetType === 'adjacentFoe');
        const needsAllyTarget =
          ctx.format === 'doubles' && targetType === 'adjacentAlly';

        if (needsAllyTarget) {
          const allySlot = slotIdx === 0 ? 1 : 0;
          const allyMon = party[allySlot];
          if (!allyMon || isFainted(allyMon.condition)) {
            continue;
          }
          const score = mv.id === 'helpinghand' ? 85 : 40;
          if (score > bestScore) {
            bestScore = score;
            bestCmd = `move ${mv.slot} -${allySlot + 1}`;
          }
          continue;
        }

        if (moveData.category === 'Status') {
          let score = 20;
          if (mv.id === 'splash') score = 5;
          else if (mv.id === 'spore') {
            const hasUnstatusedFoe = aliveFoeSlots.some((fi) => !ctx.foeActiveStatus[fi]);
            score = hasUnstatusedFoe ? 135 : 5;
          } else if (mv.id === 'tailwind') {
            score = ctx.turn <= 2 ? 125 : 25;
          } else if (mv.id === 'followme') {
            score = ctx.format === 'doubles' ? 95 : 5;
          } else if (mv.id === 'willowisp') {
            const hasUnstatusedFoe = aliveFoeSlots.some((fi) => !ctx.foeActiveStatus[fi]);
            score = hasUnstatusedFoe ? 105 : 10;
          } else if (mv.id === 'protect') {
            score = ctx.turn % 3 === 0 ? 55 : 12;
          } else if (mv.id === 'recover') {
            const [hpCur, hpMax] = selfMon.condition.split('/').map(Number);
            score = hpMax && hpCur / hpMax < 0.55 ? 115 : 10;
          } else if (mv.id === 'encore') {
            score = ctx.turn > 1 ? 80 : 15;
          }

          // Small jitter so AI isn't robotic
          score += Math.random() * 12;

          if (needsFoeTarget) {
            const targetIdx =
              aliveFoeSlots.find((fi) => !ctx.foeActiveStatus[fi]) ?? aliveFoeSlots[0];
            if (score > bestScore) {
              bestScore = score;
              bestCmd = `move ${mv.slot} +${targetIdx + 1}`;
            }
          } else if (score > bestScore) {
            bestScore = score;
            bestCmd = `move ${mv.slot}`;
          }
          continue;
        }

        // Damaging move
        const bp = moveData.basePower || (mv.id === 'endeavor' || mv.id === 'flail' ? 90 : 40);
        const stab = selfSpecies.types.includes(moveData.type) ? 1.5 : 1;

        if (needsFoeTarget) {
          for (const foeIdx of aliveFoeSlots) {
            const foeSpeciesName = ctx.foeActiveSpecies[foeIdx];
            const foeTypes = foeSpeciesName
              ? Dex.species.get(foeSpeciesName).types
              : ['Normal'];
            const mult = calcTypeMultiplier(moveData.type, foeTypes);
            let score = bp * stab * mult;
            if (mv.id === 'fakeout' && ctx.turn === 1) score += 90;
            score += Math.random() * 8;
            if (score > bestScore) {
              bestScore = score;
              bestCmd = `move ${mv.slot} +${foeIdx + 1}`;
            }
          }
        } else {
          // Singles or spread move
          let avgMult = 1;
          if (aliveFoeSlots.length > 0) {
            const sum = aliveFoeSlots.reduce((acc, fi) => {
              const sp = ctx.foeActiveSpecies[fi];
              const types = sp ? Dex.species.get(sp).types : ['Normal'];
              return acc + calcTypeMultiplier(moveData.type, types);
            }, 0);
            avgMult = sum / aliveFoeSlots.length;
          }
          let score = bp * stab * avgMult;
          if (mv.id === 'fakeout' && ctx.turn === 1) score += 90;
          score += Math.random() * 8;
          if (score > bestScore) {
            bestScore = score;
            bestCmd = `move ${mv.slot}`;
          }
        }
      }

      commands.push(bestCmd);
    }

    return commands.join(', ');
  }

  return 'default';
}
