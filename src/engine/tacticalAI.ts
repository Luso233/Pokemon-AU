import { Dex, toID } from '@pkmn/sim';
import type { BattleFormat, ScriptedEnemyRule } from '../types/game';

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
  canTerastallize?: string;
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
  teraType?: string;
}

export interface ShowdownRequest {
  wait?: boolean;
  teamPreview?: boolean;
  maxChosenTeamSize?: number;
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
  foeSideConditions: string[];
  turn: number;
  scriptedRules: ScriptedEnemyRule[];
  triggeredRuleIds: Set<string>;
  preferredTeamPreviewOrder?: string;
}

export interface RivalActionDecision {
  command: string;
  triggeredRules: ScriptedEnemyRule[];
}

function isFainted(condition: string): boolean {
  return condition === '0 fnt' || condition.endsWith(' fnt');
}

function parseHpRatio(condition: string): number {
  if (isFainted(condition)) return 0;
  const [cur, max] = condition.split(' ')[0].split('/').map(Number);
  if (!max) return 1;
  return cur / max;
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

function ruleConditionMatches(
  rule: ScriptedEnemyRule,
  selfMon: ShowdownRequestSidePokemon,
  ctx: OpponentContext
): boolean {
  const cond = rule.condition ?? 'always';
  if (cond === 'always') return true;
  if (cond === 'hpBelow60') {
    return parseHpRatio(selfMon.condition) < 0.6;
  }
  if (cond === 'playerHasScreens') {
    return ctx.foeSideConditions.some((c) => {
      const low = c.toLowerCase();
      return low.includes('reflect') || low.includes('light screen') || low.includes('aurora veil');
    });
  }
  if (cond === 'playerHasSpecies' && rule.requiredPlayerSpecies) {
    const wanted = toID(rule.requiredPlayerSpecies);
    return ctx.foeActiveSpecies.some((sp) => sp && toID(sp) === wanted);
  }
  return false;
}

function resolveScriptedTarget(
  targetSpec: string | undefined,
  needsFoeTarget: boolean,
  ctx: OpponentContext,
  aliveFoeSlots: number[]
): string {
  if (!needsFoeTarget || aliveFoeSlots.length === 0) return '';

  if (targetSpec?.startsWith('species:')) {
    const wanted = toID(targetSpec.slice('species:'.length));
    const idx = ctx.foeActiveSpecies.findIndex(
      (sp, i) => sp && toID(sp) === wanted && aliveFoeSlots.includes(i)
    );
    if (idx !== -1) return ` +${idx + 1}`;
  } else if (targetSpec === 'slot:1' && aliveFoeSlots.includes(0)) {
    return ' +1';
  } else if (targetSpec === 'slot:2' && aliveFoeSlots.includes(1)) {
    return ' +2';
  }

  return ` +${aliveFoeSlots[0] + 1}`;
}

/**
 * Hybrid Scripted + Heuristic Tactical AI for P2.
 * Evaluates turn-specific & conditional `ScriptedEnemyRule` overrides first
 * (so boss turns are readable and trickable!), then falls back to tactical heuristics.
 */
export function chooseRivalAction(
  request: ShowdownRequest,
  ctx: OpponentContext
): RivalActionDecision | null {
  if (request.wait) return null;
  if (request.teamPreview) {
    return {
      command: ctx.preferredTeamPreviewOrder || 'default',
      triggeredRules: [],
    };
  }

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
    return { command: cmds.join(', '), triggeredRules: [] };
  }

  // 2. Normal turn move selection
  if (request.active) {
    const commands: string[] = [];
    const triggeredRules: ScriptedEnemyRule[] = [];

    const aliveFoeSlots: number[] = [];
    ctx.foeActiveSpecies.forEach((sp, i) => {
      if (sp) aliveFoeSlots.push(i);
    });
    if (aliveFoeSlots.length === 0) aliveFoeSlots.push(0);

    for (let slotIdx = 0; slotIdx < request.active.length; slotIdx++) {
      const activeSlot = request.active[slotIdx];
      const selfMon = party[slotIdx];
      if (!activeSlot || !selfMon || isFainted(selfMon.condition)) {
        commands.push('pass');
        continue;
      }

      const selfSpeciesName = parseSpeciesFromDetails(selfMon.details);
      const selfSpecies = Dex.species.get(selfSpeciesName);
      const legalMoves = activeSlot.moves
        .map((m, idx) => ({ ...m, slot: idx + 1 }))
        .filter((m) => !m.disabled);

      if (legalMoves.length === 0) {
        commands.push('move 1');
        continue;
      }

      /* --- A. Check Scripted Turn / Condition Rules first --- */
      let matchedCommand: string | null = null;
      for (const rule of ctx.scriptedRules) {
        if (rule.once && ctx.triggeredRuleIds.has(rule.id)) continue;
        if (rule.turn != null && rule.turn !== ctx.turn) continue;
        if (
          rule.actorSpecies &&
          toID(selfSpeciesName) !== toID(rule.actorSpecies) &&
          toID(selfSpecies.baseSpecies) !== toID(rule.actorSpecies)
        ) {
          continue;
        }
        if (!ruleConditionMatches(rule, selfMon, ctx)) continue;

        const forced = legalMoves.find(
          (m) => toID(m.id || m.move) === toID(rule.forceMoveId)
        );
        if (!forced) continue;

        const moveData = Dex.moves.get(forced.id || forced.move);
        const targetType = forced.target || moveData.target || 'normal';
        const needsFoeTarget =
          ctx.format === 'doubles' &&
          (targetType === 'normal' ||
            targetType === 'any' ||
            targetType === 'adjacentFoe');
        const needsAllyTarget =
          ctx.format === 'doubles' && targetType === 'adjacentAlly';

        let suffix = '';
        if (needsAllyTarget) {
          const allySlot = slotIdx === 0 ? 1 : 0;
          const allyMon = party[allySlot];
          if (!allyMon || isFainted(allyMon.condition)) {
            continue;
          }
          suffix = ` -${allySlot + 1}`;
        } else {
          suffix = resolveScriptedTarget(
            rule.targetSpec,
            needsFoeTarget,
            ctx,
            aliveFoeSlots
          );
        }
        matchedCommand = `move ${forced.slot}${suffix}`;
        ctx.triggeredRuleIds.add(rule.id);
        triggeredRules.push(rule);
        break;
      }

      if (matchedCommand) {
        commands.push(matchedCommand);
        continue;
      }

      /* --- B. Tactical Heuristic Fallback --- */
      let bestCmd = `move ${legalMoves[0].slot}`;
      let bestScore = -999;

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
          if (!allyMon || isFainted(allyMon.condition)) continue;
          const score = mv.id === 'helpinghand' ? 85 : 40;
          if (score > bestScore) {
            bestScore = score;
            bestCmd = `move ${mv.slot} -${allySlot + 1}`;
          }
          continue;
        }

        if (moveData.category === 'Status') {
          let score = 20;
          if (mv.id === 'taunt') score = ctx.turn <= 2 ? 105 : 35;
          else if (mv.id === 'encore') score = ctx.turn > 1 ? 85 : 15;
          else if (mv.id === 'spore') {
            const hasUnstatused = aliveFoeSlots.some((fi) => !ctx.foeActiveStatus[fi]);
            score = hasUnstatused ? 135 : 5;
          } else if (mv.id === 'tailwind') score = ctx.turn <= 2 ? 120 : 20;
          else if (mv.id === 'followme') score = ctx.format === 'doubles' ? 90 : 5;
          else if (mv.id === 'willowisp') {
            const hasUnstatused = aliveFoeSlots.some((fi) => !ctx.foeActiveStatus[fi]);
            score = hasUnstatused ? 100 : 10;
          } else if (mv.id === 'protect') score = ctx.turn % 3 === 0 ? 50 : 12;
          else if (mv.id === 'recover') {
            score = parseHpRatio(selfMon.condition) < 0.55 ? 115 : 10;
          }
          score += Math.random() * 12;

          if (needsFoeTarget) {
            const targetIdx =
              aliveFoeSlots.find((fi) => !ctx.foeActiveStatus[fi]) ??
              aliveFoeSlots[0];
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

        const bp =
          moveData.basePower ||
          (mv.id === 'endeavor' || mv.id === 'flail' ? 90 : 40);
        const stab = selfSpecies.types.includes(moveData.type) ? 1.5 : 1;

        if (needsFoeTarget) {
          for (const foeIdx of aliveFoeSlots) {
            const foeSpeciesName = ctx.foeActiveSpecies[foeIdx];
            const foeTypes = foeSpeciesName
              ? Dex.species.get(foeSpeciesName).types
              : ['Normal'];
            const mult = calcTypeMultiplier(moveData.type, foeTypes);
            let score = bp * stab * mult;
            if (mv.id === 'fakeout' && ctx.turn === 1) score += 95;
            if (
              mv.id === 'brickbreak' &&
              ctx.foeSideConditions.some((c) =>
                c.toLowerCase().includes('reflect') ||
                c.toLowerCase().includes('light screen')
              )
            ) {
              score += 75;
            }
            score += Math.random() * 8;
            if (score > bestScore) {
              bestScore = score;
              bestCmd = `move ${mv.slot} +${foeIdx + 1}`;
            }
          }
        } else {
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
          if (mv.id === 'makeitrain' || mv.id === 'heatwave') score *= 1.15;
          score += Math.random() * 8;
          if (score > bestScore) {
            bestScore = score;
            bestCmd = `move ${mv.slot}`;
          }
        }
      }

      commands.push(bestCmd);
    }

    return { command: commands.join(', '), triggeredRules };
  }

  return { command: 'default', triggeredRules: [] };
}
