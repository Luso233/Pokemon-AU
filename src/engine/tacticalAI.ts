import { Dex, toID } from '@pkmn/sim';
import type {
  AISettings,
  BattleFormat,
  ScriptedEnemyRule,
} from '../types/game';
import { callStructuredLLM, isLiveLLMConfigured } from './aiProvider';

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
  rqid?: number;
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
  foeActiveHpPercent?: (number | null)[];
  foeSideConditions: string[];
  selfSideConditions?: string[];
  weather?: string;
  terrain?: string;
  trickRoomTurnsLeft?: number | null;
  turn: number;
  scriptedRules: ScriptedEnemyRule[];
  triggeredRuleIds: Set<string>;
  preferredTeamPreviewOrder?: string;
}

export interface RivalActionDecision {
  command: string;
  triggeredRules: ScriptedEnemyRule[];
  llmNote?: string;
}

export interface RivalBattleController {
  readonly kind: 'heuristic' | 'llm';
  chooseAction(
    request: ShowdownRequest,
    ctx: OpponentContext
  ): Promise<RivalActionDecision | null>;
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
  party: ShowdownRequestSidePokemon[],
  ctx: OpponentContext
): boolean {
  const cond = rule.condition ?? 'always';
  if (cond === 'always') return true;
  if (cond === 'hpBelow60') {
    return parseHpRatio(selfMon.condition) < 0.6;
  }
  if (cond === 'hpBelow35OrLast') {
    const aliveSelf = party.filter((p) => !isFainted(p.condition)).length;
    return parseHpRatio(selfMon.condition) < 0.35 || aliveSelf <= 1;
  }
  if (cond === 'lastAlive') {
    const aliveSelf = party.filter((p) => !isFainted(p.condition)).length;
    return aliveSelf <= 1;
  }
  if (cond === 'playerHasScreens') {
    return ctx.foeSideConditions.some((c) => {
      const low = c.toLowerCase();
      return (
        low.includes('reflect') ||
        low.includes('light screen') ||
        low.includes('aurora veil')
      );
    });
  }
  if (cond === 'playerHasSpecies' && rule.requiredPlayerSpecies) {
    const wanted = toID(rule.requiredPlayerSpecies);
    return ctx.foeActiveSpecies.some((sp) => sp && toID(sp) === wanted);
  }
  return false;
}

/**
 * Gen 6 Triples adjacency in @pkmn/sim:
 * Attacker pos 0 (Left) faces Foe pos 2 (visual left); Center (1) reaches 0,1,2; Right (2) reaches 0,1.
 */
export function isTriplesAdjacentFoe(
  attackerSlot: number,
  foeSlot: number
): boolean {
  return Math.abs(attackerSlot - (2 - foeSlot)) <= 1;
}

export function isTriplesAdjacentAlly(
  attackerSlot: number,
  allySlot: number
): boolean {
  return Math.abs(attackerSlot - allySlot) === 1;
}

function getReachableFoeSlots(
  format: BattleFormat,
  attackerSlot: number,
  targetType: string,
  aliveFoeSlots: number[]
): number[] {
  if (format !== 'triples' || targetType === 'any') {
    return aliveFoeSlots;
  }
  return aliveFoeSlots.filter((fi) => isTriplesAdjacentFoe(attackerSlot, fi));
}

function findReachableAllySlot(
  format: BattleFormat,
  attackerSlot: number,
  party: ShowdownRequestSidePokemon[],
  activeLen: number
): number {
  for (let i = 0; i < activeLen; i++) {
    if (i === attackerSlot) continue;
    const ally = party[i];
    if (!ally || isFainted(ally.condition)) continue;
    if (format === 'triples' && !isTriplesAdjacentAlly(attackerSlot, i)) {
      continue;
    }
    return i;
  }
  return -1;
}

function resolveScriptedTarget(
  targetSpec: string | undefined,
  needsFoeTarget: boolean,
  ctx: OpponentContext,
  reachableFoeSlots: number[]
): string {
  if (!needsFoeTarget || reachableFoeSlots.length === 0) return '';

  if (targetSpec?.startsWith('species:')) {
    const wanted = toID(targetSpec.slice('species:'.length));
    const idx = ctx.foeActiveSpecies.findIndex(
      (sp, i) => sp && toID(sp) === wanted && reachableFoeSlots.includes(i)
    );
    if (idx !== -1) return ` +${idx + 1}`;
  } else if (targetSpec === 'slot:1' && reachableFoeSlots.includes(0)) {
    return ' +1';
  } else if (targetSpec === 'slot:2' && reachableFoeSlots.includes(1)) {
    return ' +2';
  } else if (targetSpec === 'slot:3' && reachableFoeSlots.includes(2)) {
    return ' +3';
  }

  return ` +${reachableFoeSlots[0] + 1}`;
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

    const isMulti = ctx.format === 'doubles' || ctx.format === 'triples';
    let megaUsedThisTurn = false;

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

      const wantMegaSuffix =
        Boolean(activeSlot.canMegaEvo) && !megaUsedThisTurn ? ' mega' : '';

      /* --- A. Check Scripted Turn / Condition Rules first --- */
      let matchedCommand: string | null = null;
      for (const rule of ctx.scriptedRules) {
        if (rule.once && ctx.triggeredRuleIds.has(rule.id)) continue;
        if (rule.turn != null && rule.turn !== ctx.turn) continue;
        if (rule.turnList && !rule.turnList.includes(ctx.turn)) continue;
        if (
          rule.actorSpecies &&
          toID(selfSpeciesName) !== toID(rule.actorSpecies) &&
          toID(selfSpecies.baseSpecies) !== toID(rule.actorSpecies)
        ) {
          continue;
        }
        if (!ruleConditionMatches(rule, selfMon, party, ctx)) continue;

        const forced = legalMoves.find(
          (m) => toID(m.id || m.move) === toID(rule.forceMoveId)
        );
        if (!forced) continue;

        const moveData = Dex.moves.get(forced.id || forced.move);
        const targetType = forced.target || moveData.target || 'normal';
        const needsFoeTarget =
          isMulti &&
          (targetType === 'normal' ||
            targetType === 'any' ||
            targetType === 'adjacentFoe');
        const needsAllyTarget = isMulti && targetType === 'adjacentAlly';

        let suffix = '';
        if (needsAllyTarget) {
          const allySlot = findReachableAllySlot(
            ctx.format,
            slotIdx,
            party,
            request.active.length
          );
          if (allySlot === -1) continue;
          suffix = ` -${allySlot + 1}`;
        } else if (needsFoeTarget) {
          const reachable = getReachableFoeSlots(
            ctx.format,
            slotIdx,
            targetType,
            aliveFoeSlots
          );
          if (reachable.length === 0) continue;
          suffix = resolveScriptedTarget(
            rule.targetSpec,
            true,
            ctx,
            reachable
          );
        }
        matchedCommand = `move ${forced.slot}${suffix}${wantMegaSuffix}`;
        if (wantMegaSuffix) megaUsedThisTurn = true;
        ctx.triggeredRuleIds.add(rule.id);
        triggeredRules.push(rule);
        break;
      }

      if (matchedCommand) {
        commands.push(matchedCommand);
        continue;
      }

      /* --- B. Tactical Heuristic Fallback --- */
      let bestCmd: string | null = null;
      let bestScore = -999;

      for (const mv of legalMoves) {
        const moveData = Dex.moves.get(mv.id || mv.move);
        const targetType = mv.target || moveData.target || 'normal';
        const needsFoeTarget =
          isMulti &&
          (targetType === 'normal' ||
            targetType === 'any' ||
            targetType === 'adjacentFoe');
        const needsAllyTarget = isMulti && targetType === 'adjacentAlly';

        if (needsAllyTarget) {
          const allySlot = findReachableAllySlot(
            ctx.format,
            slotIdx,
            party,
            request.active.length
          );
          if (allySlot === -1) continue;
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
          else if (mv.id === 'spore' || mv.id === 'sleeppowder') {
            const hasUnstatused = aliveFoeSlots.some((fi) => !ctx.foeActiveStatus[fi]);
            score = hasUnstatused ? 135 : 5;
          } else if (mv.id === 'tailwind') score = ctx.turn <= 2 ? 120 : 20;
          else if (mv.id === 'followme') score = isMulti ? 90 : 5;
          else if (mv.id === 'wideguard') score = isMulti && ctx.turn % 2 === 1 ? 55 : 12;
          else if (mv.id === 'willowisp' || mv.id === 'thunderwave' || mv.id === 'stunspore') {
            const hasUnstatused = aliveFoeSlots.some((fi) => !ctx.foeActiveStatus[fi]);
            score = hasUnstatused ? 100 : 10;
          } else if (mv.id === 'protect') score = ctx.turn % 3 === 0 ? 50 : 12;
          else if (mv.id === 'recover' || mv.id === 'softboiled' || mv.id === 'rest') {
            score = parseHpRatio(selfMon.condition) < 0.55 ? 115 : 10;
          } else if (mv.id === 'swordsdance' || mv.id === 'nastyplot') {
            score = parseHpRatio(selfMon.condition) > 0.7 ? 92 : 12;
          }
          score += Math.random() * 12;

          if (needsFoeTarget) {
            const reachable = getReachableFoeSlots(
              ctx.format,
              slotIdx,
              targetType,
              aliveFoeSlots
            );
            if (reachable.length === 0) continue;
            const targetIdx =
              reachable.find((fi) => !ctx.foeActiveStatus[fi]) ?? reachable[0];
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
          const reachable = getReachableFoeSlots(
            ctx.format,
            slotIdx,
            targetType,
            aliveFoeSlots
          );
          for (const foeIdx of reachable) {
            const foeSpeciesName = ctx.foeActiveSpecies[foeIdx];
            const foeTypes = foeSpeciesName
              ? Dex.species.get(foeSpeciesName).types
              : ['Normal'];
            const mult = calcTypeMultiplier(moveData.type, foeTypes);
            let score = bp * stab * mult;
            if (mv.id === 'fakeout' && ctx.turn === 1) score += 95;
            if (
              mv.id === 'brickbreak' &&
              ctx.foeSideConditions.some(
                (c) =>
                  c.toLowerCase().includes('reflect') ||
                  c.toLowerCase().includes('light screen')
              )
            ) {
              score += 75;
            }
            if (mv.id === 'explosion' || mv.id === 'selfdestruct') {
              score = parseHpRatio(selfMon.condition) < 0.35 ? 140 : 15;
            }
            score += Math.random() * 8;
            if (score > bestScore) {
              bestScore = score;
              bestCmd = `move ${mv.slot} +${foeIdx + 1}`;
            }
          }
        } else {
          const spreadReachable =
            ctx.format === 'triples' &&
            (targetType === 'allAdjacent' || targetType === 'allAdjacentFoes')
              ? aliveFoeSlots.filter((fi) => isTriplesAdjacentFoe(slotIdx, fi))
              : aliveFoeSlots;
          if (
            ctx.format === 'triples' &&
            (targetType === 'allAdjacent' || targetType === 'allAdjacentFoes') &&
            spreadReachable.length === 0
          ) {
            continue;
          }
          let avgMult = 1;
          if (spreadReachable.length > 0) {
            const sum = spreadReachable.reduce((acc, fi) => {
              const sp = ctx.foeActiveSpecies[fi];
              const types = sp ? Dex.species.get(sp).types : ['Normal'];
              return acc + calcTypeMultiplier(moveData.type, types);
            }, 0);
            avgMult = sum / spreadReachable.length;
          }
          let score = bp * stab * avgMult;
          if (mv.id === 'makeitrain' || mv.id === 'heatwave' || mv.id === 'hypervoice') {
            score *= 1.15;
          }
          if (mv.id === 'explosion' || mv.id === 'selfdestruct') {
            score = parseHpRatio(selfMon.condition) < 0.35 ? 140 : 15;
          }
          score += Math.random() * 8;
          if (score > bestScore) {
            bestScore = score;
            bestCmd = `move ${mv.slot}`;
          }
        }
      }

      if (!bestCmd) {
        // In Gen 6 Triples, corner mon with no reachable foes can shift to center if center is empty/fainted, or default move 1
        if (ctx.format === 'triples' && slotIdx !== 1) {
          bestCmd = 'shift';
        } else {
          bestCmd = `move ${legalMoves[0].slot}`;
        }
      }

      if (wantMegaSuffix && bestCmd.startsWith('move ')) {
        bestCmd += wantMegaSuffix;
        megaUsedThisTurn = true;
      }

      commands.push(bestCmd);
    }

    return { command: commands.join(', '), triggeredRules };
  }

  return { command: 'default', triggeredRules: [] };
}

/* ================= Pluggable Battle Controllers (Heuristic Default vs Dormant Stateless LLM) ================= */

export class HeuristicBattleController implements RivalBattleController {
  public readonly kind = 'heuristic' as const;

  public async chooseAction(
    request: ShowdownRequest,
    ctx: OpponentContext
  ): Promise<RivalActionDecision | null> {
    return chooseRivalAction(request, ctx);
  }
}

interface LegalSlotOption {
  index: number;
  command: string;
  label: string;
}

function enumerateLegalCommandsForSlot(
  activeSlot: ShowdownRequestActive,
  slotIdx: number,
  party: ShowdownRequestSidePokemon[],
  ctx: OpponentContext
): LegalSlotOption[] {
  const options: LegalSlotOption[] = [];
  const aliveFoeSlots: number[] = [];
  ctx.foeActiveSpecies.forEach((sp, i) => {
    if (sp) aliveFoeSlots.push(i);
  });
  if (aliveFoeSlots.length === 0) aliveFoeSlots.push(0);

  activeSlot.moves.forEach((mv, idx) => {
    if (mv.disabled) return;
    const moveData = Dex.moves.get(mv.id || mv.move);
    const targetType = mv.target || moveData.target || 'normal';
    const needsFoe =
      ctx.format === 'doubles' &&
      (targetType === 'normal' ||
        targetType === 'any' ||
        targetType === 'adjacentFoe');
    const needsAlly = ctx.format === 'doubles' && targetType === 'adjacentAlly';

    if (needsAlly) {
      const allySlot = slotIdx === 0 ? 1 : 0;
      const allyMon = party[allySlot];
      if (allyMon && !isFainted(allyMon.condition)) {
        options.push({
          index: options.length,
          command: `move ${idx + 1} -${allySlot + 1}`,
          label: `${mv.move} -> aliado ${parseSpeciesFromDetails(allyMon.details)}`,
        });
      }
      return;
    }

    if (needsFoe) {
      for (const fi of aliveFoeSlots) {
        options.push({
          index: options.length,
          command: `move ${idx + 1} +${fi + 1}`,
          label: `${mv.move} (${moveData.type}) -> ${ctx.foeActiveSpecies[fi] ?? `Foe ${fi + 1}`}`,
        });
      }
      return;
    }

    options.push({
      index: options.length,
      command: `move ${idx + 1}`,
      label: `${mv.move} (${moveData.type})`,
    });
  });

  if (!activeSlot.trapped) {
    party.forEach((p, idx) => {
      if (!p.active && !isFainted(p.condition)) {
        const sp = parseSpeciesFromDetails(p.details);
        options.push({
          index: options.length,
          command: `switch ${idx + 1}`,
          label: `Switch -> ${sp} (${Math.round(parseHpRatio(p.condition) * 100)}% HP)`,
        });
      }
    });
  }

  return options;
}

const LLM_TURN_CHOICE_SCHEMA = {
  type: 'object',
  properties: {
    slotOptionIndices: {
      type: 'array',
      items: { type: 'integer' },
    },
    rationale: { type: 'string' },
  },
  required: ['slotOptionIndices', 'rationale'],
};

/**
 * Stateless Compact-Board LLM Controller (~300-500 tokens/turn).
 * Activated ONLY when `aiSettings.enableLlmOpponent === true` and a live LLM is configured.
 * Always falls back cleanly to HeuristicBattleController on timeout/error/TeamPreview/ForceSwitch.
 */
export class LLMBattleController implements RivalBattleController {
  public readonly kind = 'llm' as const;
  private readonly fallback = new HeuristicBattleController();
  private readonly settings: AISettings;

  constructor(settings: AISettings) {
    this.settings = settings;
  }

  public async chooseAction(
    request: ShowdownRequest,
    ctx: OpponentContext
  ): Promise<RivalActionDecision | null> {
    if (request.wait) return null;

    // Team preview & force-switch stay instantaneous & deterministic (0 wasted tokens)
    if (request.teamPreview || request.forceSwitch || !request.active) {
      return this.fallback.chooseAction(request, ctx);
    }

    // If a scripted boss turn applies, honor the narrative script first!
    if (ctx.scriptedRules.length > 0) {
      const probeTriggered = new Set(ctx.triggeredRuleIds);
      const heuristicDecision = chooseRivalAction(request, {
        ...ctx,
        triggeredRuleIds: probeTriggered,
      });
      if (heuristicDecision && heuristicDecision.triggeredRules.length > 0) {
        for (const r of heuristicDecision.triggeredRules) {
          ctx.triggeredRuleIds.add(r.id);
        }
        return heuristicDecision;
      }
    }

    const party = request.side?.pokemon ?? [];
    const perSlotOptions: Array<{
      slotIdx: number;
      pokemon: string;
      hpPercent: number;
      options: LegalSlotOption[];
    }> = [];

    for (let slotIdx = 0; slotIdx < request.active.length; slotIdx++) {
      const activeSlot = request.active[slotIdx];
      const selfMon = party[slotIdx];
      if (!activeSlot || !selfMon || isFainted(selfMon.condition)) {
        perSlotOptions.push({
          slotIdx,
          pokemon: 'FAINTED',
          hpPercent: 0,
          options: [],
        });
        continue;
      }
      perSlotOptions.push({
        slotIdx,
        pokemon: parseSpeciesFromDetails(selfMon.details),
        hpPercent: Math.round(parseHpRatio(selfMon.condition) * 100),
        options: enumerateLegalCommandsForSlot(activeSlot, slotIdx, party, ctx),
      });
    }

    const compactBoard = {
      turn: ctx.turn,
      format: ctx.format,
      field: {
        weather: ctx.weather || 'none',
        terrain: ctx.terrain || 'none',
        trickRoom: ctx.trickRoomTurnsLeft ?? 0,
        foeSide: ctx.foeSideConditions,
        mySide: ctx.selfSideConditions ?? [],
      },
      foeActive: ctx.foeActiveSpecies.map((sp, i) => ({
        slot: i + 1,
        species: sp ?? 'empty',
        hpPercent: ctx.foeActiveHpPercent?.[i] ?? null,
        status: ctx.foeActiveStatus[i] ?? 'none',
      })),
      myActiveSlots: perSlotOptions.map((s) => ({
        slot: s.slotIdx + 1,
        species: s.pokemon,
        hpPercent: s.hpPercent,
        legalOptions: s.options.map((o) => `${o.index}: ${o.label}`),
      })),
    };

    try {
      const llmRes = await callStructuredLLM<{
        slotOptionIndices: number[];
        rationale: string;
      }>({
        settings: this.settings,
        systemInstruction:
          'You are an elite competitive Pokemon Showdown AI opponent. Given the compact current board state JSON, choose the optimal legalOption index for each active slot (use -1 for FAINTED slots). Do not pick the same switch target for two slots. Keep rationale under 12 words in Spanish.',
        userPrompt: JSON.stringify(compactBoard),
        jsonSchema: LLM_TURN_CHOICE_SCHEMA,
        temperature: 0.25,
        timeoutMs: 12000,
      });

      const indices = llmRes.data.slotOptionIndices ?? [];
      const usedSwitches = new Set<string>();
      const cmds: string[] = [];

      for (let i = 0; i < perSlotOptions.length; i++) {
        const slotInfo = perSlotOptions[i];
        if (slotInfo.options.length === 0) {
          cmds.push('pass');
          continue;
        }
        const chosenIdx = Number(indices[i]);
        let picked = slotInfo.options.find((o) => o.index === chosenIdx);
        if (
          !picked ||
          (picked.command.startsWith('switch ') &&
            usedSwitches.has(picked.command))
        ) {
          picked =
            slotInfo.options.find(
              (o) =>
                !o.command.startsWith('switch ') || !usedSwitches.has(o.command)
            ) ?? slotInfo.options[0];
        }
        if (picked.command.startsWith('switch ')) {
          usedSwitches.add(picked.command);
        }
        cmds.push(picked.command);
      }

      return {
        command: cmds.join(', '),
        triggeredRules: [],
        llmNote: llmRes.data.rationale?.trim() || undefined,
      };
    } catch {
      // Seamless fallback to local heuristic so battles never stall
      return this.fallback.chooseAction(request, ctx);
    }
  }
}

export function createRivalBattleController(
  aiSettings?: AISettings
): RivalBattleController {
  if (aiSettings?.enableLlmOpponent && isLiveLLMConfigured(aiSettings)) {
    return new LLMBattleController(aiSettings);
  }
  return new HeuristicBattleController();
}
