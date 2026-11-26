import { BattleStreams, Dex, Teams, toID } from '@pkmn/sim';
import type {
  ActiveMoveOption,
  BattleAnimationCue,
  BattleFormat,
  BattleLogEntry,
  BattleSnapshot,
  PartyPokemonState,
  PendingDecisionSlot,
  PuzzlePokemonModifier,
  ResolvedBattleConfig,
  SpeedRange,
} from '../types/game';
import { chooseRivalAction, type ShowdownRequest } from './tacticalAI';

/* ================= Pure Tactical Helpers (Dex & Formulas) ================= */

export function getFormatDisplayLabel(
  formatId: string,
  format: BattleFormat,
  customLabel?: string
): string {
  if (customLabel) return customLabel;
  const map: Record<string, string> = {
    gen9doublescustomgame: 'Dobles 2v2',
    gen9customgame: 'Individuales',
    gen91v1: '1v1 Duelo de Honor',
    gen9monotype: 'Monotype',
    gen9lc: 'Little Cup Nv. 5',
  };
  return map[formatId] ?? (format === 'doubles' ? 'Dobles 2v2' : 'Individuales');
}

export function getStageMultiplier(stage: number): number {
  const clamped = Math.max(-6, Math.min(6, Math.trunc(stage)));
  return clamped >= 0 ? (2 + clamped) / 2 : 2 / (2 - clamped);
}

export function computeEffectiveStat(baseStat: number, stage = 0): number {
  return Math.floor(baseStat * getStageMultiplier(stage));
}

export function getPossibleAbilities(speciesName: string): string[] {
  const sp = Dex.species.get(speciesName);
  if (!sp || !sp.abilities) return [];
  const raw = Object.values(sp.abilities).filter(
    (a): a is string => Boolean(a && typeof a === 'string')
  );
  return Array.from(new Set(raw));
}

export function getShowdownMaxPP(moveNameOrId: string): number {
  const mv = Dex.moves.get(moveNameOrId);
  if (!mv || !mv.exists || !mv.pp) return 1;
  if (mv.noPPBoosts || mv.pp === 1) return mv.pp;
  return Math.floor((mv.pp * 8) / 5);
}

export function computeSpeedRange(
  speciesName: string,
  level: number,
  speBoost = 0,
  isParalyzed = false,
  hasTailwind = false
): SpeedRange {
  const sp = Dex.species.get(speciesName);
  const baseSpe = sp?.baseStats?.spe ?? 50;
  const lvl = Math.max(1, level || 100);

  const baseMin = Math.floor((Math.floor((2 * baseSpe * lvl) / 100) + 5) * 0.9);
  const baseMax = Math.floor(
    (Math.floor(((2 * baseSpe + 31 + 63) * lvl) / 100) + 5) * 1.1
  );

  let min = baseMin;
  let max = baseMax;
  const modifiers: string[] = [];

  if (speBoost !== 0) {
    const mult = getStageMultiplier(speBoost);
    min = Math.floor(min * mult);
    max = Math.floor(max * mult);
    modifiers.push(`${speBoost > 0 ? `+${speBoost}` : speBoost} Spe`);
  }

  if (hasTailwind) {
    min = Math.floor(min * 2);
    max = Math.floor(max * 2);
    modifiers.push('Viento Afín ×2');
  }

  if (isParalyzed) {
    min = Math.floor(min * 0.5);
    max = Math.floor(max * 0.5);
    modifiers.push('Parálisis ×0.5');
  }

  return { min, max, baseMin, baseMax, modifiers };
}

function parseCondition(condition: string): {
  hp: number;
  maxhp: number;
  hpPercent: number;
  status: string;
  fainted: boolean;
  isExact: boolean;
} {
  const clean = (condition || '').trim();
  if (!clean || clean === '0 fnt' || clean.endsWith(' fnt')) {
    return {
      hp: 0,
      maxhp: 100,
      hpPercent: 0,
      status: '',
      fainted: true,
      isExact: false,
    };
  }
  const [hpPart, statusPart = ''] = clean.split(' ');
  const [curStr, maxStr = '100'] = hpPart.split('/');
  const hp = Math.max(0, Number(curStr) || 0);
  const maxhp = Math.max(1, Number(maxStr) || 100);
  const hpPercent = Math.max(0, Math.min(100, Math.round((hp / maxhp) * 100)));
  return {
    hp,
    maxhp,
    hpPercent,
    status: statusPart.trim(),
    fainted: hp <= 0,
    isExact: maxhp !== 100,
  };
}

function parseDetails(details: string): {
  species: string;
  level: number;
  gender: string;
} {
  const parts = (details || '').split(',').map((s) => s.trim());
  const species = parts[0] || 'Unknown';
  let level = 100;
  let gender = '';
  for (let i = 1; i < parts.length; i++) {
    if (parts[i].startsWith('L')) {
      level = Number(parts[i].slice(1)) || 100;
    } else if (parts[i] === 'M' || parts[i] === 'F') {
      gender = parts[i];
    }
  }
  return { species, level, gender };
}

function parseSlotFromIdent(ident: string): {
  side: 'p1' | 'p2';
  slotIndex: number;
  name: string;
} {
  const colonIdx = ident.indexOf(':');
  const prefix = colonIdx >= 0 ? ident.slice(0, colonIdx).trim() : ident.trim();
  const name = colonIdx >= 0 ? ident.slice(colonIdx + 1).trim() : ident.trim();
  const side: 'p1' | 'p2' = prefix.startsWith('p2') ? 'p2' : 'p1';
  const letter = prefix.charAt(2);
  const slotIndex = letter === 'b' ? 1 : 0;
  return { side, slotIndex, name };
}

function cleanEffectName(raw: string): string {
  return (raw || '')
    .replace(/^(move|ability|item|typechange):\s*/i, '')
    .trim();
}

function weatherLabel(id: string): string {
  const map: Record<string, string> = {
    Sandstorm: 'Tormenta de Arena',
    sandstorm: 'Tormenta de Arena',
    RainDance: 'Lluvia',
    raindance: 'Lluvia',
    SunnyDay: 'Sol Intenso',
    sunnyday: 'Sol Intenso',
    Snow: 'Nieve',
    snow: 'Nieve',
    Snowscape: 'Nieve',
    Hail: 'Granizo',
    DeltaStream: 'Ráfaga Delta',
    DesolateLand: 'Tierra del Ocaso',
    PrimordialSea: 'Mar del Albor',
    none: '',
  };
  return map[id] ?? id;
}

function terrainLabel(id: string): string {
  const map: Record<string, string> = {
    'Grassy Terrain': 'Campo de Hierba',
    grassyterrain: 'Campo de Hierba',
    'Electric Terrain': 'Campo Eléctrico',
    electricterrain: 'Campo Eléctrico',
    'Psychic Terrain': 'Campo Psíquico',
    psychicterrain: 'Campo Psíquico',
    'Misty Terrain': 'Campo de Niebla',
    mistyterrain: 'Campo de Niebla',
  };
  return map[id] ?? id;
}

function statusSpanish(st: string): string {
  const map: Record<string, string> = {
    brn: 'quemado',
    par: 'paralizado',
    psn: 'envenenado',
    tox: 'gravemente envenenado',
    slp: 'dormido',
    frz: 'congelado',
  };
  return map[st] ?? st;
}

function sideHasTailwind(sideConditions: string[]): boolean {
  return sideConditions.some((c) => c.toLowerCase().includes('tailwind'));
}

/* ================= Battle Controller ================= */

export class ShowdownBattleController {
  private battleStreamRef: InstanceType<typeof BattleStreams.BattleStream> | null =
    null;
  private streams: ReturnType<typeof BattleStreams.getPlayerStreams> | null =
    null;
  private listener: (snapshot: BattleSnapshot) => void;
  private config: ResolvedBattleConfig;
  private state: BattleSnapshot;
  private logSeq = 0;
  private cueSeq = 0;
  private tauntSeq = 0;
  private destroyed = false;
  private puzzleConditionsApplied = false;
  private triggeredRuleIds = new Set<string>();
  private lastAttackSource: { side: 'p1' | 'p2'; slot: number } | null = null;

  constructor(
    config: ResolvedBattleConfig,
    onUpdate: (snapshot: BattleSnapshot) => void
  ) {
    this.config = config;
    this.listener = onUpdate;
    const activeCount = config.format === 'doubles' ? 2 : 1;

    this.state = {
      status: 'initializing',
      format: config.format,
      formatId: config.formatId,
      formatLabel: getFormatDisplayLabel(
        config.formatId,
        config.format,
        config.formatLabel
      ),
      turn: 0,
      weather: '',
      terrain: '',
      levelCap: config.rivalIntel?.levelCap ?? 100,
      puzzleApplied: false,
      p1: {
        playerName: config.playerName,
        active: Array(activeCount).fill(null),
        party: [],
        sideConditions: [],
      },
      p2: {
        playerName: config.rivalName,
        active: Array(activeCount).fill(null),
        party: [],
        sideConditions: [],
      },
      pendingSlots: [],
      isForceSwitch: false,
      log: [],
      winner: null,
      lastCue: null,
      activeTaunt: null,
      triggeredScriptIds: [],
      koCountP2: 0,
      totalP2: 0,
    };
  }

  public getSnapshot(): BattleSnapshot {
    return this.cloneSnapshot();
  }

  private cloneMon(m: PartyPokemonState): PartyPokemonState {
    const revealedMovesCopy: PartyPokemonState['revealedMoves'] = {};
    for (const [k, v] of Object.entries(m.revealedMoves)) {
      revealedMovesCopy[k] = { ...v };
    }
    return {
      ...m,
      types: [...m.types],
      moves: [...m.moves],
      possibleAbilities: [...m.possibleAbilities],
      boosts: { ...m.boosts },
      volatiles: [...m.volatiles],
      revealedMoves: revealedMovesCopy,
      stats: m.stats ? { ...m.stats } : undefined,
      speedRange: m.speedRange
        ? { ...m.speedRange, modifiers: [...m.speedRange.modifiers] }
        : undefined,
    };
  }

  private cloneSnapshot(): BattleSnapshot {
    return {
      ...this.state,
      p1: {
        ...this.state.p1,
        active: this.state.p1.active.map((m) => (m ? this.cloneMon(m) : null)),
        party: this.state.p1.party.map((m) => this.cloneMon(m)),
        sideConditions: [...this.state.p1.sideConditions],
      },
      p2: {
        ...this.state.p2,
        active: this.state.p2.active.map((m) => (m ? this.cloneMon(m) : null)),
        party: this.state.p2.party.map((m) => this.cloneMon(m)),
        sideConditions: [...this.state.p2.sideConditions],
      },
      pendingSlots: this.state.pendingSlots.map((s) => ({
        ...s,
        pokemon: this.cloneMon(s.pokemon),
        moves: [...s.moves],
      })),
      log: [...this.state.log],
      triggeredScriptIds: [...this.state.triggeredScriptIds],
      activeTaunt: this.state.activeTaunt
        ? { ...this.state.activeTaunt }
        : null,
    };
  }

  private emit(): void {
    if (this.destroyed) return;
    this.listener(this.cloneSnapshot());
  }

  private pushLog(kind: BattleLogEntry['kind'], text: string): void {
    this.state.log.push({
      id: ++this.logSeq,
      turn: this.state.turn,
      kind,
      text,
    });
  }

  private emitCue(cue: Omit<BattleAnimationCue, 'id'>): void {
    this.state.lastCue = {
      id: ++this.cueSeq,
      ...cue,
    };
  }

  private refreshSpeedRange(sideKey: 'p1' | 'p2', mon: PartyPokemonState): void {
    const tailwind = sideHasTailwind(this.state[sideKey].sideConditions);
    mon.speedRange = computeSpeedRange(
      mon.species,
      mon.level,
      mon.boosts.spe ?? 0,
      mon.status === 'par',
      tailwind
    );
  }

  private refreshSideSpeeds(sideKey: 'p1' | 'p2'): void {
    for (const mon of this.state[sideKey].party) {
      this.refreshSpeedRange(sideKey, mon);
    }
    for (const activeMon of this.state[sideKey].active) {
      if (activeMon) this.refreshSpeedRange(sideKey, activeMon);
    }
  }

  private getTargetMons(
    side: 'p1' | 'p2',
    slotIndex: number,
    name: string
  ): { activeMon: PartyPokemonState | null; partyMon: PartyPokemonState | null } {
    const activeMon = this.state[side].active[slotIndex] ?? null;
    const partyMon =
      this.state[side].party.find(
        (p) => (activeMon && p.ident === activeMon.ident) || p.name === name
      ) ?? null;
    return { activeMon, partyMon };
  }

  private recordAbilityReveal(
    side: 'p1' | 'p2',
    slotIndex: number,
    name: string,
    abilityName: string
  ): void {
    if (!abilityName) return;
    const { activeMon, partyMon } = this.getTargetMons(side, slotIndex, name);
    if (activeMon) activeMon.revealedAbility = abilityName;
    if (partyMon) partyMon.revealedAbility = abilityName;
  }

  private recordItemReveal(
    side: 'p1' | 'p2',
    slotIndex: number,
    name: string,
    itemName: string,
    consumed = false
  ): void {
    if (!itemName) return;
    const { activeMon, partyMon } = this.getTargetMons(side, slotIndex, name);
    const apply = (m: PartyPokemonState | null) => {
      if (!m) return;
      if (consumed) {
        m.consumedItem = itemName;
        if (m.revealedItem === itemName) {
          m.revealedItem = null;
        }
      } else {
        m.revealedItem = itemName;
      }
    };
    apply(activeMon);
    apply(partyMon);
  }

  private inspectTagsForReveals(
    defaultIdent: string | undefined,
    extraParts: string[]
  ): void {
    let fromTag = '';
    let ofIdent = '';
    for (const part of extraParts) {
      if (part.startsWith('[from] ')) {
        fromTag = part.slice('[from] '.length).trim();
      } else if (part.startsWith('[of] ')) {
        ofIdent = part.slice('[of] '.length).trim();
      }
    }
    if (!fromTag) return;

    const targetIdent = ofIdent || defaultIdent;
    if (!targetIdent || !targetIdent.includes(':')) return;
    const { side, slotIndex, name } = parseSlotFromIdent(targetIdent);

    if (fromTag.toLowerCase().startsWith('ability:')) {
      const ab = fromTag.slice('ability:'.length).trim();
      this.recordAbilityReveal(side, slotIndex, name, ab);
    } else if (fromTag.toLowerCase().startsWith('item:')) {
      const it = fromTag.slice('item:'.length).trim();
      this.recordItemReveal(side, slotIndex, name, it, false);
    }
  }

  /**
   * Injects PuzzleConditions directly into @pkmn/sim's live Battle instance
   * right after Turn 0 deployment so Weather, Terrain, Side Conditions,
   * HP damage, Boosts, Statuses, Volatiles, and pre-Mega states take effect
   * inside the real Showdown math AND update the UI state immediately.
   */
  private applyPuzzleConditionsIfNeeded(): void {
    if (this.puzzleConditionsApplied) return;
    const puzzle = this.config.puzzleConditions;
    const battle = this.battleStreamRef?.battle;
    if (!puzzle || !battle) return;

    this.puzzleConditionsApplied = true;
    const sourceMon =
      battle.p2.active[0] ?? battle.p1.active[0] ?? battle.p2.pokemon[0];

    this.pushLog(
      'puzzle',
      '🧩 Condiciones iniciales del Puzzle aplicadas al campo.'
    );

    if (puzzle.weather && sourceMon) {
      battle.field.setWeather(puzzle.weather, sourceMon);
    }

    if (puzzle.terrain && sourceMon) {
      battle.field.setTerrain(puzzle.terrain, sourceMon);
    }

    if (puzzle.sideConditions?.p1 && sourceMon) {
      for (const cond of puzzle.sideConditions.p1) {
        battle.p1.addSideCondition(cond, sourceMon);
      }
    }

    if (puzzle.sideConditions?.p2 && sourceMon) {
      for (const cond of puzzle.sideConditions.p2) {
        battle.p2.addSideCondition(cond, sourceMon);
      }
    }

    if (puzzle.pokemonModifiers) {
      for (const mod of puzzle.pokemonModifiers) {
        this.applySinglePokemonModifier(battle, mod, sourceMon);
      }
    }

    // Sentinel marks exact point when all puzzle protocol events have been parsed into state
    battle.add('-message', '__PUZZLE_READY__');
    battle.sendUpdates();
  }

  private applySinglePokemonModifier(
    battle: NonNullable<InstanceType<typeof BattleStreams.BattleStream>['battle']>,
    mod: PuzzlePokemonModifier,
    fallbackSource: NonNullable<
      InstanceType<typeof BattleStreams.BattleStream>['battle']
    >['p1']['pokemon'][number]
  ): void {
    const side = mod.side === 'p1' ? battle.p1 : battle.p2;
    const selector = mod.slotOrSpecies.trim();
    let targetMon = null;

    if (selector === '0' || selector === 'slot:1') {
      targetMon = side.active[0] ?? side.pokemon[0];
    } else if (selector === '1' || selector === 'slot:2') {
      targetMon = side.active[1] ?? side.pokemon[1];
    } else {
      const wantedId = toID(selector);
      targetMon =
        side.active.find(
          (p) =>
            p &&
            (toID(p.species.name) === wantedId ||
              toID(p.baseSpecies.name) === wantedId ||
              toID(p.name) === wantedId)
        ) ??
        side.pokemon.find(
          (p) =>
            toID(p.species.name) === wantedId ||
            toID(p.baseSpecies.name) === wantedId ||
            toID(p.name) === wantedId
        ) ??
        null;
    }

    if (!targetMon) return;

    // 1. Pre-Mega evolution from Turn 1
    if (mod.preMega && !targetMon.species.isMega) {
      const megaSpecies = Dex.species.get(`${targetMon.baseSpecies.name}-Mega`);
      if (megaSpecies.exists) {
        targetMon.formeChange(megaSpecies, null, true);
        if (megaSpecies.abilities[0]) {
          targetMon.setAbility(
            megaSpecies.abilities[0],
            fallbackSource,
            null,
            false,
            true
          );
        }
        battle.add(
          '-mega',
          targetMon,
          targetMon.baseSpecies.name,
          megaSpecies.requiredItem || 'Mega Stone'
        );
      }
    }

    // 2. Starting HP percentage (e.g. Sableye injured to 65% in VN)
    if (typeof mod.hpPercent === 'number' && mod.hpPercent > 0 && mod.hpPercent < 100) {
      const targetHp = Math.max(
        1,
        Math.floor((targetMon.maxhp * mod.hpPercent) / 100)
      );
      targetMon.sethp(targetHp);
      battle.add('-damage', targetMon, targetMon.getHealth, '[from] Puzzle');

      // Immediately reflect exact HP in p1 snapshot state & pendingSlots too
      if (mod.side === 'p1') {
        const pct = Math.round((targetMon.hp / targetMon.maxhp) * 100);
        for (const m of [...this.state.p1.party, ...this.state.p1.active]) {
          if (m && toID(m.species) === toID(targetMon.species.name)) {
            m.hp = targetMon.hp;
            m.maxhp = targetMon.maxhp;
            m.hpPercent = pct;
          }
        }
        for (const slot of this.state.pendingSlots) {
          if (toID(slot.pokemon.species) === toID(targetMon.species.name)) {
            slot.pokemon.hp = targetMon.hp;
            slot.pokemon.maxhp = targetMon.maxhp;
            slot.pokemon.hpPercent = pct;
          }
        }
      }
    }

    // 3. Starting Stat Boosts / Unboosts
    if (mod.boosts && Object.keys(mod.boosts).length > 0) {
      battle.boost(mod.boosts, targetMon, targetMon, null, false, true);
    }

    // 4. Starting Status Condition (brn, par, psn, tox, slp, frz)
    if (mod.status) {
      targetMon.setStatus(mod.status, fallbackSource);
    }

    // 5. Starting Volatiles (aquaring, ingrain, focusenergy, etc.)
    if (mod.volatiles) {
      for (const vol of mod.volatiles) {
        targetMon.addVolatile(vol, targetMon);
      }
    }
  }

  public async start(): Promise<void> {
    const p1Sets = Teams.import(this.config.playerShowdownPaste);
    const p2Sets = Teams.import(this.config.rivalShowdownPaste);

    if (!p1Sets || p1Sets.length === 0) {
      throw new Error(
        'El Showdown Paste del jugador no contiene ningún Pokémon válido.'
      );
    }
    if (!p2Sets || p2Sets.length === 0) {
      throw new Error(
        'El Showdown Paste del rival no contiene ningún Pokémon válido.'
      );
    }

    const p1Packed = Teams.pack(p1Sets);
    const p2Packed = Teams.pack(p2Sets);

    this.state.totalP2 = p2Sets.length;
    this.pushLog(
      'system',
      `Simulador @pkmn/sim iniciado (${this.state.formatLabel} · ${this.config.formatId}).`
    );

    const battleStream = new BattleStreams.BattleStream();
    this.battleStreamRef = battleStream;
    const streams = BattleStreams.getPlayerStreams(battleStream);
    this.streams = streams;

    void this.consumeOmniscient(streams.omniscient);
    void this.consumePlayerStream(streams.p1);
    void this.consumeRivalStream(streams.p2);

    if (this.destroyed) return;

    const spec = { formatid: this.config.formatId };
    const p1spec = { name: this.config.playerName, team: p1Packed };
    const p2spec = { name: this.config.rivalName, team: p2Packed };

    await streams.omniscient.write(
      `>start ${JSON.stringify(spec)}\n` +
        `>player p1 ${JSON.stringify(p1spec)}\n` +
        `>player p2 ${JSON.stringify(p2spec)}`
    );
  }

  public async submitPlayerChoice(command: string): Promise<void> {
    if (!this.streams || this.destroyed || this.state.status === 'ended') return;
    this.state.status = 'resolving';
    this.state.pendingSlots = [];
    this.emit();
    await this.streams.p1.write(command);
  }

  public destroy(): void {
    this.destroyed = true;
    if (this.streams && this.state.status !== 'ended') {
      try {
        void this.streams.omniscient.writeEnd().catch(() => {});
      } catch {
        // ignore cleanup errors
      }
    }
    this.streams = null;
    this.battleStreamRef = null;
  }

  private async consumeOmniscient(stream: AsyncIterable<string>): Promise<void> {
    try {
      for await (const chunk of stream) {
        if (this.destroyed) break;
        const lines = chunk.split('\n');
        for (const line of lines) {
          if (!line.startsWith('|')) continue;
          this.handleProtocolLine(line);
        }
        this.emit();
      }
    } catch (err) {
      if (!this.destroyed) {
        this.pushLog('system', `Error en stream de combate: ${String(err)}`);
        this.emit();
      }
    }
  }

  private async consumePlayerStream(stream: AsyncIterable<string>): Promise<void> {
    try {
      for await (const chunk of stream) {
        if (this.destroyed) break;
        for (const line of chunk.split('\n')) {
          if (line.startsWith('|request|')) {
            const rawJson = line.slice('|request|'.length).trim();
            if (!rawJson) continue;
            const req = JSON.parse(rawJson) as ShowdownRequest;
            this.handlePlayerRequest(req);
          } else if (line.startsWith('|error|')) {
            const errMsg = line.slice('|error|'.length).trim();
            this.pushLog('system', `Aviso del motor: ${errMsg}`);
            if (this.state.status !== 'ended') {
              this.state.status = 'awaiting-choice';
            }
            this.emit();
          }
        }
      }
    } catch {
      // stream closed
    }
  }

  private async consumeRivalStream(stream: AsyncIterable<string>): Promise<void> {
    try {
      for await (const chunk of stream) {
        if (this.destroyed) break;
        for (const line of chunk.split('\n')) {
          if (!line.startsWith('|request|')) continue;
          const rawJson = line.slice('|request|'.length).trim();
          if (!rawJson) continue;
          const req = JSON.parse(rawJson) as ShowdownRequest;

          if (req.wait || this.state.status === 'ended') {
            continue;
          }

          const decision = chooseRivalAction(req, {
            format: this.config.format,
            foeActiveSpecies: this.state.p1.active.map((m) =>
              m && !m.fainted ? m.species : null
            ),
            foeActiveStatus: this.state.p1.active.map((m) =>
              m && !m.fainted ? m.status || null : null
            ),
            foeSideConditions: this.state.p1.sideConditions,
            turn: Math.max(1, this.state.turn),
            scriptedRules: this.config.scriptedEnemyRules ?? [],
            triggeredRuleIds: this.triggeredRuleIds,
          });

          if (decision && this.streams) {
            if (decision.triggeredRules.length > 0) {
              for (const rule of decision.triggeredRules) {
                if (!this.state.triggeredScriptIds.includes(rule.id)) {
                  this.state.triggeredScriptIds.push(rule.id);
                }
                this.pushLog(
                  'script',
                  `⚡ [Patrón Scripteado · Turno ${Math.max(1, this.state.turn)}] ${rule.description}`
                );
                if (rule.tauntLine) {
                  this.state.activeTaunt = {
                    id: ++this.tauntSeq,
                    turn: Math.max(1, this.state.turn),
                    speaker: this.config.rivalName,
                    charId: this.config.rivalCharId,
                    text: rule.tauntLine,
                    ruleDescription: rule.description,
                  };
                }
              }
              this.emit();
            }
            await this.streams.p2.write(decision.command);
          }
        }
      }
    } catch {
      // stream closed
    }
  }

  private syncPlayerSideFromRequest(req: ShowdownRequest): void {
    const sideState = this.state.p1;
    const reqParty = req.side?.pokemon ?? [];
    if (reqParty.length === 0) return;

    const existingByIdent = new Map<string, PartyPokemonState>();
    for (const old of sideState.party) {
      existingByIdent.set(old.ident, old);
    }

    const updatedParty: PartyPokemonState[] = reqParty.map((mon, idx) => {
      const cond = parseCondition(mon.condition);
      const det = parseDetails(mon.details);
      const speciesData = Dex.species.get(det.species);
      const identName = mon.ident.includes(':')
        ? mon.ident.split(':').slice(1).join(':').trim()
        : det.species;
      const prev = existingByIdent.get(mon.ident);
      const terastallized = prev?.terastallized ?? null;

      // Preserve puzzle-modified exact HP if Turn 1 request arrived slightly before puzzle hook
      const usePrevHp =
        this.puzzleConditionsApplied &&
        this.state.turn <= 1 &&
        prev &&
        prev.hp < cond.hp &&
        prev.maxhp === cond.maxhp;

      const stateMon: PartyPokemonState = {
        slotIndex: idx + 1,
        ident: mon.ident,
        name: identName,
        species: det.species,
        level: det.level,
        gender: det.gender,
        hp: usePrevHp ? prev.hp : cond.hp,
        maxhp: usePrevHp ? prev.maxhp : cond.maxhp,
        hpPercent: usePrevHp ? prev.hpPercent : cond.hpPercent,
        status: cond.status || (usePrevHp ? prev.status : ''),
        fainted: cond.fainted,
        active: mon.active,
        item: mon.item || '',
        ability: mon.baseAbility || '',
        moves: mon.moves || [],
        types: terastallized
          ? [terastallized]
          : speciesData.types
            ? [...speciesData.types]
            : ['Normal'],
        teraType: mon.teraType || prev?.teraType,
        terastallized,
        stats: mon.stats
          ? {
              atk: mon.stats.atk ?? 0,
              def: mon.stats.def ?? 0,
              spa: mon.stats.spa ?? 0,
              spd: mon.stats.spd ?? 0,
              spe: mon.stats.spe ?? 0,
            }
          : undefined,
        boosts: mon.active ? prev?.boosts ?? {} : {},
        revealed: true,
        revealedAbility: mon.baseAbility || prev?.revealedAbility || null,
        possibleAbilities: getPossibleAbilities(det.species),
        revealedItem: mon.item || null,
        consumedItem: prev?.consumedItem ?? null,
        revealedMoves: prev?.revealedMoves ?? {},
        volatiles: mon.active ? prev?.volatiles ?? [] : [],
        isBossAce: false,
      };
      this.refreshSpeedRange('p1', stateMon);
      return stateMon;
    });

    sideState.party = updatedParty;

    const activeCount = this.config.format === 'doubles' ? 2 : 1;
    const nextActive: (PartyPokemonState | null)[] = Array(activeCount).fill(null);
    for (let i = 0; i < activeCount; i++) {
      const candidate = updatedParty[i];
      if (candidate && candidate.active) {
        nextActive[i] = candidate;
      }
    }
    sideState.active = nextActive;
  }

  private handlePlayerRequest(req: ShowdownRequest): void {
    this.syncPlayerSideFromRequest(req);

    if (req.teamPreview) {
      void this.streams?.p1.write('default');
      return;
    }

    if (req.wait || this.state.status === 'ended') {
      this.state.pendingSlots = [];
      this.emit();
      return;
    }

    const pending: PendingDecisionSlot[] = [];

    if (req.forceSwitch) {
      req.forceSwitch.forEach((mustSwitch, activeIndex) => {
        const mon = this.state.p1.party[activeIndex];
        if (!mon) return;
        pending.push({
          activeIndex,
          pokemon: mon,
          moves: [],
          trapped: false,
          canMegaEvo: false,
          canTerastallize: false,
          forceSwitch: mustSwitch,
          pass: !mustSwitch,
        });
      });
      this.state.isForceSwitch = true;
      this.state.pendingSlots = pending;
      this.state.status = 'awaiting-choice';
      this.emit();
      return;
    }

    if (req.active) {
      req.active.forEach((slot, activeIndex) => {
        const mon = this.state.p1.party[activeIndex];
        if (!mon) return;
        if (!slot || mon.fainted) {
          pending.push({
            activeIndex,
            pokemon: mon,
            moves: [],
            trapped: false,
            canMegaEvo: false,
            canTerastallize: false,
            forceSwitch: false,
            pass: true,
          });
          return;
        }

        const moves: ActiveMoveOption[] = slot.moves.map((m, idx) => {
          const data = Dex.moves.get(m.id || m.move);
          return {
            index: idx + 1,
            id: m.id,
            name: m.move || data.name,
            pp: m.pp ?? data.pp ?? 1,
            maxpp: m.maxpp ?? data.pp ?? 1,
            target: m.target || data.target || 'normal',
            disabled: Boolean(m.disabled),
            type: data.type || 'Normal',
            category:
              (data.category as ActiveMoveOption['category']) || 'Physical',
            basePower: data.basePower || 0,
            accuracy: data.accuracy ?? true,
            priority: data.priority ?? 0,
            shortDesc: data.shortDesc || data.desc || '',
          };
        });

        pending.push({
          activeIndex,
          pokemon: mon,
          moves,
          trapped: Boolean(slot.trapped),
          canMegaEvo: Boolean(slot.canMegaEvo),
          canTerastallize: slot.canTerastallize || false,
          forceSwitch: false,
          pass: false,
        });
      });

      this.state.isForceSwitch = false;
      this.state.pendingSlots = pending;
      this.state.status = 'awaiting-choice';
      this.emit();
    }
  }

  private handleProtocolLine(line: string): void {
    const parts = line.split('|');
    const cmd = parts[1];

    switch (cmd) {
      case 'teamsize': {
        if (parts[2] === 'p2') {
          const n = Number(parts[3]);
          if (n > 0) this.state.totalP2 = n;
        }
        break;
      }

      case 'turn': {
        this.state.turn = Number(parts[2]) || this.state.turn + 1;
        this.pushLog('turn', `Turn ${this.state.turn}`);
        // Apply PuzzleConditions automatically right as Turn 1 starts!
        if (this.state.turn === 1 && this.config.puzzleConditions) {
          this.applyPuzzleConditionsIfNeeded();
        }
        break;
      }

      case 'switch':
      case 'drag':
      case 'replace': {
        const { side, slotIndex, name } = parseSlotFromIdent(parts[2] ?? '');
        const det = parseDetails(parts[3] ?? '');
        const cond = parseCondition(parts[4] ?? '100/100');
        const speciesData = Dex.species.get(det.species);
        const sideState = this.state[side];

        const prevInSlot = sideState.active[slotIndex];
        if (prevInSlot) {
          prevInSlot.active = false;
          prevInSlot.boosts = {};
          prevInSlot.volatiles = [];
          this.refreshSpeedRange(side, prevInSlot);
        }

        let existing = sideState.party.find(
          (p) => p.name === name && (p.species === det.species || side === 'p1')
        );
        if (!existing) {
          existing = {
            slotIndex: sideState.party.length + 1,
            ident: `${side}: ${name}`,
            name,
            species: det.species,
            level: det.level,
            gender: det.gender,
            hp: cond.hp,
            maxhp: cond.maxhp,
            hpPercent: cond.hpPercent,
            status: cond.status,
            fainted: cond.fainted,
            active: true,
            item: '',
            ability: '',
            moves: [],
            types: speciesData.types ? [...speciesData.types] : ['Normal'],
            terastallized: null,
            boosts: {},
            revealed: true,
            revealedAbility: null,
            possibleAbilities: getPossibleAbilities(det.species),
            revealedItem: null,
            consumedItem: null,
            revealedMoves: {},
            volatiles: [],
            isBossAce: side === 'p2' && det.level > this.state.levelCap,
          };
          sideState.party.push(existing);
        } else {
          existing.species = det.species;
          existing.level = det.level;
          existing.gender = det.gender;
          existing.hpPercent = cond.hpPercent;
          existing.status = cond.status;
          existing.fainted = cond.fainted;
          existing.active = true;
          existing.revealed = true;
          existing.boosts = {};
          existing.volatiles = [];
          existing.types = existing.terastallized
            ? [existing.terastallized]
            : speciesData.types
              ? [...speciesData.types]
              : existing.types;
          existing.possibleAbilities = getPossibleAbilities(det.species);
          existing.isBossAce = side === 'p2' && det.level > this.state.levelCap;
        }

        this.refreshSpeedRange(side, existing);
        sideState.active[slotIndex] = existing;

        const trainer = sideState.playerName;
        const aceTag = existing.isBossAce ? ' [ACE]' : '';
        this.pushLog(
          'switch',
          `${trainer} envió a ${name}${
            name !== det.species ? ` (${det.species})` : ''
          } Nv.${det.level}${aceTag}.`
        );
        break;
      }

      case '-mega':
      case 'detailschange': {
        const { side, slotIndex, name } = parseSlotFromIdent(parts[2] ?? '');
        const newSpeciesName =
          cmd === '-mega'
            ? `${parts[3]}-Mega`
            : parseDetails(parts[3] ?? '').species;
        const sp = Dex.species.get(newSpeciesName);
        if (sp.exists) {
          const { activeMon, partyMon } = this.getTargetMons(side, slotIndex, name);
          for (const m of [activeMon, partyMon]) {
            if (!m) continue;
            m.species = sp.name;
            m.types = [...sp.types];
            m.possibleAbilities = getPossibleAbilities(sp.name);
            if (sp.abilities[0] && cmd === '-mega') {
              m.revealedAbility = sp.abilities[0];
            }
            this.refreshSpeedRange(side, m);
          }
          if (cmd === '-mega') {
            this.pushLog(
              'ability',
              `✦ ${name} ya está Megaevolucionado en ${sp.name}!`
            );
          }
        }
        break;
      }

      case '-terastallize': {
        const { side, slotIndex, name } = parseSlotFromIdent(parts[2] ?? '');
        const teraType = parts[3] ?? '';
        if (teraType) {
          const { activeMon, partyMon } = this.getTargetMons(side, slotIndex, name);
          for (const m of [activeMon, partyMon]) {
            if (!m) continue;
            m.terastallized = teraType;
            m.types = [teraType];
          }
          this.pushLog(
            'ability',
            `✦ ${name} se teracristalizó a tipo ${teraType}!`
          );
        }
        break;
      }

      case 'move': {
        const { side, slotIndex, name } = parseSlotFromIdent(parts[2] ?? '');
        const moveName = parts[3] ?? 'Movimiento';
        const extra = parts.slice(4);
        const isFromSubMove = extra.some((t) => t.startsWith('[from] '));

        this.lastAttackSource = { side, slot: slotIndex };
        this.emitCue({ attackerSide: side, attackerSlot: slotIndex });
        this.pushLog('move', `${name} usó ${moveName}!`);

        const moveData = Dex.moves.get(moveName);
        if (!isFromSubMove && moveData.id !== 'struggle') {
          const { activeMon, partyMon } = this.getTargetMons(side, slotIndex, name);
          const maxPP = getShowdownMaxPP(moveName);
          const updateMoves = (m: PartyPokemonState | null) => {
            if (!m) return;
            const prev = m.revealedMoves[moveName];
            m.revealedMoves[moveName] = {
              id: moveData.id || moveName.toLowerCase(),
              name: moveData.name || moveName,
              type: moveData.type || 'Normal',
              used: (prev?.used ?? 0) + 1,
              maxPP: prev?.maxPP ?? maxPP,
            };
          };
          updateMoves(activeMon);
          if (partyMon && partyMon !== activeMon) updateMoves(partyMon);
        }
        break;
      }

      case '-damage':
      case '-heal': {
        const { side, slotIndex, name } = parseSlotFromIdent(parts[2] ?? '');
        const cond = parseCondition(parts[3] ?? '');
        const extra = parts.slice(4);
        this.inspectTagsForReveals(parts[2], extra);

        const { activeMon, partyMon } = this.getTargetMons(side, slotIndex, name);
        const prevPercent = activeMon?.hpPercent ?? 100;

        const applyHp = (m: PartyPokemonState | null) => {
          if (!m) return;
          m.hpPercent = cond.hpPercent;
          m.status = cond.status;
          m.fainted = cond.fainted;
          if (side === 'p2' || cond.isExact) {
            m.hp = cond.hp;
            m.maxhp = cond.maxhp;
          }
          this.refreshSpeedRange(side, m);
        };
        applyHp(activeMon);
        if (partyMon && partyMon !== activeMon) applyHp(partyMon);

        if (cmd === '-damage') {
          const delta = Math.max(0, prevPercent - cond.hpPercent);
          this.emitCue({
            attackerSide: this.lastAttackSource?.side,
            attackerSlot: this.lastAttackSource?.slot,
            targetSide: side,
            targetSlot: slotIndex,
          });
          if (delta > 0) {
            const fromPart = extra.find((e) => e.startsWith('[from] '));
            const fromTag = fromPart
              ? ` (${cleanEffectName(fromPart.replace('[from] ', ''))})`
              : '';
            this.pushLog(
              'damage',
              `${name} perdió ${delta}% de PS${fromTag} (${cond.hpPercent}% restante).`
            );
          }
        } else {
          const fromPart = extra.find((e) => e.startsWith('[from] '));
          const fromTag = fromPart
            ? ` (${cleanEffectName(fromPart.replace('[from] ', ''))})`
            : '';
          this.pushLog(
            'status',
            `${name} recuperó PS${fromTag} (${cond.hpPercent}%).`
          );
        }
        break;
      }

      case '-supereffective': {
        const { side, slotIndex } = parseSlotFromIdent(parts[2] ?? '');
        this.emitCue({
          targetSide: side,
          targetSlot: slotIndex,
          callout: '¡SÚPER EFICAZ!',
          calloutTone: 'super',
        });
        this.pushLog('effective', '¡Es súper eficaz!');
        break;
      }

      case '-resisted': {
        const { side, slotIndex } = parseSlotFromIdent(parts[2] ?? '');
        this.emitCue({
          targetSide: side,
          targetSlot: slotIndex,
          callout: 'Poco eficaz',
          calloutTone: 'resist',
        });
        this.pushLog('effective', 'No es muy eficaz...');
        break;
      }

      case '-immune': {
        const { side, slotIndex, name } = parseSlotFromIdent(parts[2] ?? '');
        this.inspectTagsForReveals(parts[2], parts.slice(3));
        this.emitCue({
          targetSide: side,
          targetSlot: slotIndex,
          callout: '¡INMUNE!',
          calloutTone: 'immune',
        });
        this.pushLog('effective', `No afecta a ${name}.`);
        break;
      }

      case '-crit': {
        const { side, slotIndex } = parseSlotFromIdent(parts[2] ?? '');
        this.emitCue({
          targetSide: side,
          targetSlot: slotIndex,
          callout: '¡GOLPE CRÍTICO!',
          calloutTone: 'crit',
        });
        this.pushLog('effective', '¡Golpe crítico!');
        break;
      }

      case '-miss': {
        const { name } = parseSlotFromIdent(parts[2] ?? '');
        this.pushLog('status', `El ataque de ${name} falló.`);
        break;
      }

      case '-fail': {
        const { name } = parseSlotFromIdent(parts[2] ?? '');
        this.pushLog('status', `¡Pero falló (${name})!`);
        break;
      }

      case '-status': {
        const { side, slotIndex, name } = parseSlotFromIdent(parts[2] ?? '');
        const st = parts[3] ?? '';
        this.inspectTagsForReveals(parts[2], parts.slice(4));
        const { activeMon, partyMon } = this.getTargetMons(side, slotIndex, name);
        for (const m of [activeMon, partyMon]) {
          if (!m) continue;
          m.status = st;
          this.refreshSpeedRange(side, m);
        }
        this.pushLog('status', `${name} quedó ${statusSpanish(st)}.`);
        break;
      }

      case '-curestatus': {
        const { side, slotIndex, name } = parseSlotFromIdent(parts[2] ?? '');
        const { activeMon, partyMon } = this.getTargetMons(side, slotIndex, name);
        for (const m of [activeMon, partyMon]) {
          if (!m) continue;
          m.status = '';
          this.refreshSpeedRange(side, m);
        }
        this.pushLog('status', `${name} se curó de su estado alterado.`);
        break;
      }

      case '-boost':
      case '-unboost': {
        const { side, slotIndex, name } = parseSlotFromIdent(parts[2] ?? '');
        const stat = parts[3] ?? '';
        const amount = Number(parts[4]) || 1;
        this.inspectTagsForReveals(parts[2], parts.slice(5));
        const delta = cmd === '-boost' ? amount : -amount;
        const { activeMon, partyMon } = this.getTargetMons(side, slotIndex, name);
        const updated = new Set<PartyPokemonState>();
        for (const m of [activeMon, partyMon]) {
          if (!m || updated.has(m) || !stat) continue;
          updated.add(m);
          m.boosts[stat] = Math.max(-6, Math.min(6, (m.boosts[stat] ?? 0) + delta));
          this.refreshSpeedRange(side, m);
        }
        this.pushLog(
          'boost',
          `${name}: ${stat.toUpperCase()} ${delta > 0 ? `+${delta}` : delta}.`
        );
        break;
      }

      case '-invertboost': {
        const { side, slotIndex, name } = parseSlotFromIdent(parts[2] ?? '');
        const { activeMon, partyMon } = this.getTargetMons(side, slotIndex, name);
        const updated = new Set<PartyPokemonState>();
        for (const m of [activeMon, partyMon]) {
          if (!m || updated.has(m)) continue;
          updated.add(m);
          for (const key of Object.keys(m.boosts)) {
            m.boosts[key] = -m.boosts[key];
          }
          this.refreshSpeedRange(side, m);
        }
        this.pushLog('boost', `🔄 ¡Se invirtieron todos los cambios de stats de ${name}!`);
        break;
      }

      case '-setboost': {
        const { side, slotIndex, name } = parseSlotFromIdent(parts[2] ?? '');
        const stat = parts[3] ?? '';
        const val = Number(parts[4]) || 0;
        const { activeMon, partyMon } = this.getTargetMons(side, slotIndex, name);
        for (const m of [activeMon, partyMon]) {
          if (!m || !stat) continue;
          m.boosts[stat] = Math.max(-6, Math.min(6, val));
          this.refreshSpeedRange(side, m);
        }
        break;
      }

      case '-clearboost':
      case '-clearallboost': {
        if (cmd === '-clearallboost') {
          for (const s of ['p1', 'p2'] as const) {
            for (const m of this.state[s].active) {
              if (!m) continue;
              m.boosts = {};
              this.refreshSpeedRange(s, m);
            }
          }
        } else {
          const { side, slotIndex, name } = parseSlotFromIdent(parts[2] ?? '');
          const { activeMon, partyMon } = this.getTargetMons(side, slotIndex, name);
          for (const m of [activeMon, partyMon]) {
            if (!m) continue;
            m.boosts = {};
            this.refreshSpeedRange(side, m);
          }
        }
        break;
      }

      case '-start': {
        const { side, slotIndex, name } = parseSlotFromIdent(parts[2] ?? '');
        const effect = cleanEffectName(parts[3] ?? '');
        this.inspectTagsForReveals(parts[2], parts.slice(4));
        if (effect && !effect.startsWith('typechange')) {
          const { activeMon, partyMon } = this.getTargetMons(side, slotIndex, name);
          for (const m of [activeMon, partyMon]) {
            if (!m) continue;
            if (!m.volatiles.includes(effect)) {
              m.volatiles.push(effect);
            }
          }
          this.pushLog('status', `${name}: efecto activo [${effect}].`);
        }
        break;
      }

      case '-end': {
        const { side, slotIndex, name } = parseSlotFromIdent(parts[2] ?? '');
        const effect = cleanEffectName(parts[3] ?? '');
        if (effect) {
          const { activeMon, partyMon } = this.getTargetMons(side, slotIndex, name);
          for (const m of [activeMon, partyMon]) {
            if (!m) continue;
            m.volatiles = m.volatiles.filter((v) => v !== effect);
          }
        }
        break;
      }

      case '-fieldstart': {
        const field = cleanEffectName(parts[2] ?? '');
        this.inspectTagsForReveals(undefined, parts.slice(3));
        if (field.includes('Terrain')) {
          this.state.terrain = terrainLabel(field);
        } else if (field.includes('Trick Room')) {
          this.state.terrain = 'Espacio Raro (Trick Room)';
        }
        this.pushLog('weather', `Campo activo: ${terrainLabel(field)}.`);
        break;
      }

      case '-fieldend': {
        const field = cleanEffectName(parts[2] ?? '');
        if (field.includes('Terrain') || field.includes('Trick Room')) {
          this.state.terrain = '';
        }
        this.pushLog('weather', `Terminó ${terrainLabel(field)}.`);
        break;
      }

      case '-weather': {
        const w = parts[2] ?? '';
        this.inspectTagsForReveals(undefined, parts.slice(3));
        this.state.weather = w === 'none' ? '' : weatherLabel(w);
        if (w !== 'none' && !parts[3]?.includes('[upkeep]')) {
          this.pushLog('weather', `Clima activo: ${this.state.weather}.`);
        }
        break;
      }

      case '-sidestart': {
        const side: 'p1' | 'p2' = (parts[2] ?? '').startsWith('p2') ? 'p2' : 'p1';
        const condName = cleanEffectName(parts[3] ?? '');
        if (condName && !this.state[side].sideConditions.includes(condName)) {
          this.state[side].sideConditions.push(condName);
          this.refreshSideSpeeds(side);
        }
        this.pushLog('status', `${this.state[side].playerName} activó ${condName}.`);
        break;
      }

      case '-sideend': {
        const side: 'p1' | 'p2' = (parts[2] ?? '').startsWith('p2') ? 'p2' : 'p1';
        const condName = cleanEffectName(parts[3] ?? '');
        this.state[side].sideConditions = this.state[side].sideConditions.filter(
          (c) => c !== condName
        );
        this.refreshSideSpeeds(side);
        this.pushLog(
          'status',
          `Terminó ${condName} en el lado de ${this.state[side].playerName}.`
        );
        break;
      }

      case '-activate': {
        const effect = cleanEffectName(parts[3] ?? '');
        this.inspectTagsForReveals(parts[2], parts.slice(3));
        if (effect) {
          const { side, slotIndex, name } = parseSlotFromIdent(parts[2] ?? '');
          if (parts[3]?.toLowerCase().startsWith('item:')) {
            this.recordItemReveal(side, slotIndex, name, effect, false);
          } else if (parts[3]?.toLowerCase().startsWith('ability:')) {
            this.recordAbilityReveal(side, slotIndex, name, effect);
          }
        }
        break;
      }

      case '-item': {
        const { side, slotIndex, name } = parseSlotFromIdent(parts[2] ?? '');
        const item = parts[3] ?? '';
        this.inspectTagsForReveals(parts[2], parts.slice(4));
        this.recordItemReveal(side, slotIndex, name, item, false);
        this.pushLog('item', `Objeto revelado: ${name} lleva ${item}.`);
        break;
      }

      case '-enditem': {
        const { side, slotIndex, name } = parseSlotFromIdent(parts[2] ?? '');
        const item = parts[3] ?? '';
        this.recordItemReveal(side, slotIndex, name, item, true);
        this.pushLog('item', `${name} consumió/perdió su ${item}!`);
        break;
      }

      case '-ability': {
        const { side, slotIndex, name } = parseSlotFromIdent(parts[2] ?? '');
        const ab = parts[3] ?? '';
        this.recordAbilityReveal(side, slotIndex, name, ab);
        this.pushLog('ability', `[${name} · Habilidad revelada: ${ab}]`);
        break;
      }

      case '-transform': {
        const { side, slotIndex, name } = parseSlotFromIdent(parts[2] ?? '');
        const target = parseSlotFromIdent(parts[3] ?? '');
        this.inspectTagsForReveals(parts[2], parts.slice(4));
        const targetMon = this.state[target.side].active[target.slotIndex];
        const { activeMon, partyMon } = this.getTargetMons(side, slotIndex, name);
        if (targetMon) {
          for (const m of [activeMon, partyMon]) {
            if (!m) continue;
            m.species = targetMon.species;
            m.types = [...targetMon.types];
            m.boosts = { ...targetMon.boosts };
            this.refreshSpeedRange(side, m);
          }
        }
        this.pushLog('ability', `${name} se transformó en ${target.name}!`);
        break;
      }

      case 'faint': {
        const { side, slotIndex, name } = parseSlotFromIdent(parts[2] ?? '');
        const { activeMon, partyMon } = this.getTargetMons(side, slotIndex, name);
        for (const m of [activeMon, partyMon]) {
          if (!m) continue;
          m.hp = 0;
          m.hpPercent = 0;
          m.fainted = true;
          m.volatiles = [];
          m.boosts = {};
        }
        if (side === 'p2') {
          this.state.koCountP2 = this.state.p2.party.filter(
            (p) => p.fainted
          ).length;
        }
        this.pushLog('faint', `¡${name} se debilitó!`);
        break;
      }

      case '-message': {
        const msg = parts[2] ?? '';
        if (msg === '__PUZZLE_READY__') {
          this.state.puzzleApplied = true;
          this.refreshSideSpeeds('p1');
          this.refreshSideSpeeds('p2');
        } else if (msg) {
          this.pushLog('system', msg);
        }
        break;
      }

      case 'win': {
        const winnerName = parts[2] ?? '';
        this.state.winner =
          winnerName === this.config.playerName ? 'p1' : 'p2';
        this.state.status = 'ended';
        this.state.pendingSlots = [];
        this.pushLog('win', `🏆 ¡${winnerName} ganó el combate!`);
        break;
      }

      case 'tie': {
        this.state.winner = 'tie';
        this.state.status = 'ended';
        this.state.pendingSlots = [];
        this.pushLog('win', 'El combate terminó en empate.');
        break;
      }

      default:
        break;
    }
  }
}

export function formatNeedsTarget(
  format: BattleFormat,
  moveTarget: string
): 'foe' | 'ally' | 'none' {
  if (format !== 'doubles') return 'none';
  if (
    moveTarget === 'normal' ||
    moveTarget === 'any' ||
    moveTarget === 'adjacentFoe'
  ) {
    return 'foe';
  }
  if (moveTarget === 'adjacentAlly') {
    return 'ally';
  }
  return 'none';
}
