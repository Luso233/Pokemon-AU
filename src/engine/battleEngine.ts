import { BattleStreams, Dex, Teams, toID } from '@pkmn/sim';
import type {
  ActiveMoveOption,
  AISettings,
  BattleAnimationCue,
  BattleFormat,
  BattleLogEntry,
  BattleSnapshot,
  OpenTeamsheetEntry,
  PartyPokemonState,
  PendingDecisionSlot,
  PuzzlePokemonModifier,
  ResolvedBattleConfig,
  SpeedRange,
  TeamPreviewState,
} from '../types/game';
import { BattlePersistenceManager } from './battlePersistence';
import {
  createRivalBattleController,
  isTriplesAdjacentAlly,
  isTriplesAdjacentFoe,
  type RivalBattleController,
  type ShowdownRequest,
} from './tacticalAI';

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
    gen91v1: '1v1 · Bring 3, Pick 1',
    gen9monotype: '6v6 Singles · Monotype',
    gen9vgc2024regg: 'VGC Reg G · Dobles 4v4 Nv. 50',
    gen9lc: 'Little Cup Nv. 5',
    gen6triplescustomgame: 'Triples 6v6 · Gen 6',
    gen1customgame: 'Gen 1 OU vs Ubers',
  };
  return (
    map[formatId] ??
    (format === 'triples'
      ? 'Triples 3v3'
      : format === 'doubles'
        ? 'Dobles 2v2'
        : 'Individuales')
  );
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

function buildOpenTeamsheetFromPaste(
  paste: string,
  defaultLevel = 100
): OpenTeamsheetEntry[] {
  const sets = Teams.import(paste) ?? [];
  return sets.map((s) => {
    const sp = Dex.species.get(s.species);
    return {
      species: sp.exists ? sp.name : s.species,
      level: s.level || defaultLevel,
      item: s.item || 'Ninguno',
      ability: s.ability || sp.abilities?.[0] || '—',
      teraType: s.teraType || sp.types?.[0] || 'Normal',
      moves: s.moves || [],
      types: sp.types ? [...sp.types] : ['Normal'],
    };
  });
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
  const slotIndex = letter === 'c' ? 2 : letter === 'b' ? 1 : 0;
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
  private rivalController: RivalBattleController;
  private state: BattleSnapshot;
  private logSeq = 0;
  private cueSeq = 0;
  private tauntSeq = 0;
  private destroyed = false;
  private puzzleConditionsApplied = false;
  private persistenceInjected = false;
  private emptySlotsCleared = false;
  private turn1RequestsSeen = 0;
  private triggeredRuleIds = new Set<string>();
  private p1HappinessBySpecies = new Map<string, number>();
  private p2HappinessBySpecies = new Map<string, number>();
  private p2ActiveTurns: number[] = [];
  private p1PreviewPokes: Array<{
    species: string;
    level: number;
    gender: string;
    types: string[];
  }> = [];
  private rivalPreviewPokes: Array<{
    species: string;
    level: number;
    gender: string;
    types: string[];
  }> = [];
  private lastAttackSource: { side: 'p1' | 'p2'; slot: number } | null = null;

  constructor(
    config: ResolvedBattleConfig,
    onUpdate: (snapshot: BattleSnapshot) => void,
    aiSettings?: AISettings
  ) {
    this.config = config;
    this.listener = onUpdate;
    this.rivalController = createRivalBattleController(aiSettings);
    const activeCount =
      config.format === 'triples' ? 3 : config.format === 'doubles' ? 2 : 1;
    const defaultLevel =
      config.formatId === 'gen9vgc2024regg'
        ? 50
        : config.formatId === 'gen9lc'
          ? 5
          : 100;
    const p2Control = config.p2Control ?? 'ai';

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
      weatherTurnsLeft: null,
      terrain: '',
      terrainTurnsLeft: null,
      trickRoomTurnsLeft: null,
      levelCap: config.rivalIntel?.levelCap ?? defaultLevel,
      puzzleApplied: false,
      persistenceApplied: false,
      exportedPartyState: null,
      teamPreview: null,
      openTeamsheet: {
        enabled: Boolean(config.openTeamsheet),
        player: buildOpenTeamsheetFromPaste(
          config.playerShowdownPaste,
          defaultLevel
        ),
        rival: config.openTeamsheet
          ? buildOpenTeamsheetFromPaste(config.rivalShowdownPaste, defaultLevel)
          : [],
      },
      p1: {
        playerName: config.playerName,
        active: Array(activeCount).fill(null),
        party: [],
        sideConditions: [],
        sideTimers: {},
      },
      p2: {
        playerName: config.rivalName,
        active: Array(activeCount).fill(null),
        party: [],
        sideConditions: [],
        sideTimers: {},
      },
      pendingSlots: [],
      isForceSwitch: false,
      requestSeq: 0,
      p2Control,
      p2HumanParty: [],
      p2PendingSlots: [],
      p2IsForceSwitch: false,
      p2TeamPreview: null,
      p2RequestSeq: 0,
      p1Waiting: false,
      p2Waiting: false,
      activeRivalController:
        p2Control === 'human' ? 'human' : this.rivalController.kind,
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
      teamPreview: this.state.teamPreview
        ? {
            ...this.state.teamPreview,
            playerRoster: this.state.teamPreview.playerRoster.map((m) =>
              this.cloneMon(m)
            ),
            rivalRoster: this.state.teamPreview.rivalRoster.map((r) => ({
              ...r,
              types: [...r.types],
              openSheet: r.openSheet
                ? {
                    ...r.openSheet,
                    moves: [...r.openSheet.moves],
                    types: [...r.openSheet.types],
                  }
                : undefined,
            })),
          }
        : null,
      openTeamsheet: {
        enabled: this.state.openTeamsheet.enabled,
        player: this.state.openTeamsheet.player.map((e) => ({
          ...e,
          moves: [...e.moves],
          types: [...e.types],
        })),
        rival: this.state.openTeamsheet.rival.map((e) => ({
          ...e,
          moves: [...e.moves],
          types: [...e.types],
        })),
      },
      p1: {
        ...this.state.p1,
        active: this.state.p1.active.map((m) => (m ? this.cloneMon(m) : null)),
        party: this.state.p1.party.map((m) => this.cloneMon(m)),
        sideConditions: [...this.state.p1.sideConditions],
        sideTimers: { ...this.state.p1.sideTimers },
      },
      p2: {
        ...this.state.p2,
        active: this.state.p2.active.map((m) => (m ? this.cloneMon(m) : null)),
        party: this.state.p2.party.map((m) => this.cloneMon(m)),
        sideConditions: [...this.state.p2.sideConditions],
        sideTimers: { ...this.state.p2.sideTimers },
      },
      pendingSlots: this.state.pendingSlots.map((s) => ({
        ...s,
        pokemon: this.cloneMon(s.pokemon),
        moves: [...s.moves],
      })),
      p2HumanParty: this.state.p2HumanParty.map((m) => this.cloneMon(m)),
      p2PendingSlots: this.state.p2PendingSlots.map((s) => ({
        ...s,
        pokemon: this.cloneMon(s.pokemon),
        moves: [...s.moves],
      })),
      p2TeamPreview: this.state.p2TeamPreview
        ? {
            ...this.state.p2TeamPreview,
            playerRoster: this.state.p2TeamPreview.playerRoster.map((m) =>
              this.cloneMon(m)
            ),
            rivalRoster: this.state.p2TeamPreview.rivalRoster.map((r) => ({
              ...r,
              types: [...r.types],
              openSheet: r.openSheet
                ? {
                    ...r.openSheet,
                    moves: [...r.openSheet.moves],
                    types: [...r.openSheet.types],
                  }
                : undefined,
            })),
          }
        : null,
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

  private decrementTurnTimers(): void {
    if (this.state.turn <= 1) return;
    if (this.state.weatherTurnsLeft != null && this.state.weatherTurnsLeft > 1) {
      this.state.weatherTurnsLeft -= 1;
    }
    if (this.state.terrainTurnsLeft != null && this.state.terrainTurnsLeft > 1) {
      this.state.terrainTurnsLeft -= 1;
    }
    if (
      this.state.trickRoomTurnsLeft != null &&
      this.state.trickRoomTurnsLeft > 1
    ) {
      this.state.trickRoomTurnsLeft -= 1;
    }
    for (const sideKey of ['p1', 'p2'] as const) {
      const timers = this.state[sideKey].sideTimers;
      for (const k of Object.keys(timers)) {
        if (timers[k] > 1) timers[k] -= 1;
      }
    }
  }

  private applyInitialBattleOverridesIfNeeded(): void {
    const battle = this.battleStreamRef?.battle;
    if (!battle) return;

    let needsFreshRequest = false;

    // 1. Auto-faint hidden empty placeholder slots for 1 vs 6 Doubles & 1 vs 3 Triples
    if (
      !this.emptySlotsCleared &&
      this.config.emptyPlayerSlots &&
      this.config.emptyPlayerSlots.length > 0
    ) {
      this.emptySlotsCleared = true;
      for (const idx of this.config.emptyPlayerSlots) {
        const mon = battle.p1.pokemon[idx];
        if (mon) {
          mon.hp = 0;
          mon.fainted = true;
          mon.status = 'fnt' as typeof mon.status;
          mon.statusState = {
            effectOrder: 0,
            id: 'fnt',
            target: mon,
          } as unknown as typeof mon.statusState;
        }
        if (this.state.p1.active[idx]) {
          this.state.p1.active[idx]!.hp = 0;
          this.state.p1.active[idx]!.hpPercent = 0;
          this.state.p1.active[idx]!.fainted = true;
        }
        if (this.state.p1.party[idx]) {
          this.state.p1.party[idx].hp = 0;
          this.state.p1.party[idx].hpPercent = 0;
          this.state.p1.party[idx].fainted = true;
        }
      }
      battle.p1.pokemonLeft = battle.p1.pokemon.filter((p) => !p.fainted).length;
      battle.add('-message', '__EMPTY_SLOTS_READY__');
      needsFreshRequest = true;
    }

    // 2. Back-to-Back Persistence Injection (HP, Fainted, Status, exact Move PP — NO HEALING)
    if (!this.persistenceInjected && this.config.persistedPartyState) {
      this.persistenceInjected = true;
      const summary = BattlePersistenceManager.summarizePartyWear(
        this.config.persistedPartyState
      );
      BattlePersistenceManager.injectPartyState(
        battle,
        this.config.persistedPartyState
      );
      this.pushLog(
        'puzzle',
        `💾 Persistencia Back-to-Back (sin curación): ${summary.aliveCount}/${summary.totalCount} en pie · PS prom. ${summary.avgHpPercent}% · PP y estados heredados.`
      );
      battle.add('-message', '__PERSISTENCE_READY__');
      needsFreshRequest = true;
    }

    // 3. Puzzle Conditions
    if (!this.puzzleConditionsApplied && this.config.puzzleConditions) {
      this.applyPuzzleConditionsIfNeeded();
    } else if (needsFreshRequest) {
      this.triggeredRuleIds.clear();
      this.state.triggeredScriptIds = [];
      this.state.pendingSlots = [];
      this.state.status = 'resolving';
      battle.makeRequest('move');
      battle.sendUpdates();
    }
  }

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
      puzzle.bannerLog ??
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

    battle.add('-message', '__PUZZLE_READY__');
    battle.sendUpdates();
  }

  private applySinglePokemonModifier(
    battle: NonNullable<
      InstanceType<typeof BattleStreams.BattleStream>['battle']
    >,
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

    if (
      typeof mod.hpPercent === 'number' &&
      mod.hpPercent > 0 &&
      mod.hpPercent < 100
    ) {
      const targetHp = Math.max(
        1,
        Math.floor((targetMon.maxhp * mod.hpPercent) / 100)
      );
      targetMon.sethp(targetHp);
      battle.add('-damage', targetMon, targetMon.getHealth, '[from] Puzzle');

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

    if (mod.removeVolatiles) {
      for (const vol of mod.removeVolatiles) {
        targetMon.removeVolatile(vol);
        if (
          toID(vol) === 'slowstart' &&
          targetMon.abilityState?.id === 'slowstart'
        ) {
          const abState = targetMon.abilityState as { counter?: number };
          if (abState.counter) {
            delete abState.counter;
            battle.add('-end', targetMon, 'Slow Start');
          }
        }
      }
    }

    if (mod.boosts && Object.keys(mod.boosts).length > 0) {
      battle.boost(mod.boosts, targetMon, targetMon, null, false, true);
    }

    if (mod.status) {
      targetMon.setStatus(mod.status, fallbackSource);
    }

    if (mod.volatiles) {
      for (const vol of mod.volatiles) {
        targetMon.addVolatile(vol, targetMon);
        if (toID(vol) === 'substitute' && targetMon.volatiles['substitute']) {
          const ratio =
            typeof mod.substituteHpRatio === 'number'
              ? mod.substituteHpRatio
              : 0.25;
          targetMon.volatiles['substitute'].hp = Math.max(
            1,
            Math.floor(targetMon.maxhp * ratio)
          );
        }
      }
    }
  }

  public async start(): Promise<void> {
    const effectivePlayerPaste = this.config.persistedPartyState
      ? BattlePersistenceManager.reorderPasteForConsciousLead(
          this.config.playerShowdownPaste,
          this.config.persistedPartyState
        )
      : this.config.playerShowdownPaste;

    const p1Sets = Teams.import(effectivePlayerPaste);
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

    this.p1HappinessBySpecies.clear();
    for (const s of p1Sets) {
      if (typeof s.happiness === 'number') {
        const sp = Dex.species.get(s.species);
        this.p1HappinessBySpecies.set(toID(s.species), s.happiness);
        if (sp.exists) {
          this.p1HappinessBySpecies.set(toID(sp.baseSpecies), s.happiness);
        }
      }
    }
    this.p2HappinessBySpecies.clear();
    for (const s of p2Sets) {
      if (typeof s.happiness === 'number') {
        const sp = Dex.species.get(s.species);
        this.p2HappinessBySpecies.set(toID(s.species), s.happiness);
        if (sp.exists) {
          this.p2HappinessBySpecies.set(toID(sp.baseSpecies), s.happiness);
        }
      }
    }

    // Default totalP2 (updated accurately by |teamsize|p2|N after Team Preview for 1v1 & VGC 4v4)
    this.state.totalP2 =
      this.config.formatId === 'gen91v1'
        ? 1
        : this.config.formatId === 'gen9vgc2024regg'
          ? 4
          : p2Sets.length;

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

  /**
   * Submits interactive Team Preview selection to @pkmn/sim:
   * - 1v1 (`pick-1`): `team 2`
   * - VGC (`pick-4`): `team 1356`
   * - Monotype (`lead-1`): `team 312456`
   */
  public async submitTeamOrder(selectedSlots: number[]): Promise<void> {
    if (!this.streams || this.destroyed || !this.state.teamPreview) return;
    const tp = this.state.teamPreview;
    let cmd = 'default';

    if (tp.mode === 'pick-1' && selectedSlots.length >= 1) {
      cmd = `team ${selectedSlots[0]}`;
    } else if (tp.mode === 'pick-4' && selectedSlots.length >= 4) {
      cmd = `team ${selectedSlots.slice(0, 4).join('')}`;
    } else if (tp.mode === 'lead-1' && selectedSlots.length >= 1) {
      const lead = selectedSlots[0];
      const total = tp.playerRoster.length;
      const rest: number[] = [];
      for (let i = 1; i <= total; i++) {
        if (i !== lead) rest.push(i);
      }
      cmd = `team ${lead}${rest.join('')}`;
    }

    this.state.teamPreview = null;
    this.state.p1Waiting = true;
    this.syncCompositeStatus();
    this.emit();
    await this.streams.p1.write(cmd);
  }

  public async submitP2TeamOrder(selectedSlots: number[]): Promise<void> {
    if (!this.streams || this.destroyed || !this.state.p2TeamPreview) return;
    const tp = this.state.p2TeamPreview;
    let cmd = 'default';

    if (tp.mode === 'pick-1' && selectedSlots.length >= 1) {
      cmd = `team ${selectedSlots[0]}`;
    } else if (tp.mode === 'pick-4' && selectedSlots.length >= 4) {
      cmd = `team ${selectedSlots.slice(0, 4).join('')}`;
    } else if (tp.mode === 'lead-1' && selectedSlots.length >= 1) {
      const lead = selectedSlots[0];
      const total = tp.playerRoster.length;
      const rest: number[] = [];
      for (let i = 1; i <= total; i++) {
        if (i !== lead) rest.push(i);
      }
      cmd = `team ${lead}${rest.join('')}`;
    }

    this.state.p2TeamPreview = null;
    this.state.p2Waiting = true;
    this.syncCompositeStatus();
    this.emit();
    await this.streams.p2.write(cmd);
  }

  public async submitPlayerChoice(command: string): Promise<void> {
    if (!this.streams || this.destroyed || this.state.status === 'ended') return;
    this.state.pendingSlots = [];
    this.state.p1Waiting = true;
    this.syncCompositeStatus();
    this.emit();
    await this.streams.p1.write(command);
  }

  public async submitP2Choice(command: string): Promise<void> {
    if (!this.streams || this.destroyed || this.state.status === 'ended') return;
    this.state.p2PendingSlots = [];
    this.state.p2Waiting = true;
    this.syncCompositeStatus();
    this.emit();
    await this.streams.p2.write(command);
  }

  private isEnded(): boolean {
    return this.state.status === 'ended';
  }

  private syncCompositeStatus(): void {
    if (this.state.status === 'ended') return;
    if (this.state.teamPreview || this.state.p2TeamPreview) {
      this.state.status = 'team-preview';
    } else if (
      this.state.pendingSlots.length > 0 ||
      this.state.p2PendingSlots.length > 0
    ) {
      this.state.status = 'awaiting-choice';
    } else {
      this.state.status = 'resolving';
    }
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
              this.state.requestSeq += 1;
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
          if (this.state.p2Control === 'human') {
            if (line.startsWith('|request|')) {
              const rawJson = line.slice('|request|'.length).trim();
              if (!rawJson) continue;
              const req = JSON.parse(rawJson) as ShowdownRequest;
              this.handleHumanP2Request(req);
            } else if (line.startsWith('|error|')) {
              const errMsg = line.slice('|error|'.length).trim();
              this.pushLog('system', `Aviso (${this.config.rivalName}): ${errMsg}`);
              if (this.state.status !== 'ended') {
                this.state.p2Waiting = false;
                this.state.p2RequestSeq += 1;
                this.syncCompositeStatus();
              }
              this.emit();
            }
            continue;
          }

          if (line.startsWith('|error|')) {
            // Failsafe: if Showdown ever rejects an AI command, fall back to 'default' so battles never stall
            if (this.streams && !this.destroyed && this.state.status !== 'ended') {
              await this.streams.p2.write('default');
            }
            continue;
          }
          if (!line.startsWith('|request|')) continue;
          const rawJson = line.slice('|request|'.length).trim();
          if (!rawJson) continue;
          const req = JSON.parse(rawJson) as ShowdownRequest;

          if (req.wait || this.state.status === 'ended') {
            continue;
          }

          // Ensure Turn-0 puzzle conditions (e.g. Regigigas buffs, Ash Omniboost) are applied BEFORE P2 picks Turn 1!
          if (
            !req.teamPreview &&
            this.state.turn <= 1 &&
            this.config.puzzleConditions &&
            !this.puzzleConditionsApplied
          ) {
            this.applyInitialBattleOverridesIfNeeded();
          }

          const liveBattle = this.battleStreamRef?.battle;
          const decision = await this.rivalController.chooseAction(req, {
            format: this.config.format,
            foeActiveSpecies: this.state.p1.active.map((m, idx) =>
              m && !m.fainted && !this.config.emptyPlayerSlots?.includes(idx)
                ? m.species
                : liveBattle?.p1.active[idx] &&
                    !liveBattle.p1.active[idx]!.fainted &&
                    !this.config.emptyPlayerSlots?.includes(idx)
                  ? liveBattle.p1.active[idx]!.species.name
                  : null
            ),
            foeActiveStatus: this.state.p1.active.map((m, idx) =>
              m && !m.fainted && !this.config.emptyPlayerSlots?.includes(idx)
                ? m.status || null
                : liveBattle?.p1.active[idx]?.status || null
            ),
            foeActiveHpPercent: this.state.p1.active.map((m) =>
              m ? m.hpPercent : null
            ),
            foeActiveBoosts: this.state.p1.active.map((m, idx) => {
              const liveBoosts = liveBattle?.p1.active[idx]?.boosts;
              if (liveBoosts) return { ...liveBoosts } as Record<string, number>;
              return m ? { ...m.boosts } : {};
            }),
            selfActiveTurns: [...this.p2ActiveTurns],
            foeSideConditions: this.state.p1.sideConditions,
            selfSideConditions: this.state.p2.sideConditions,
            weather: this.state.weather,
            terrain: this.state.terrain,
            trickRoomTurnsLeft: this.state.trickRoomTurnsLeft,
            turn: Math.max(1, this.state.turn),
            scriptedRules: this.config.scriptedEnemyRules ?? [],
            triggeredRuleIds: this.triggeredRuleIds,
            preferredTeamPreviewOrder: this.config.preferredRivalTeamOrder,
            reserveAsLastAceSpecies: this.config.reserveAsLastAceSpecies,
          });

          if (decision && this.streams && !this.destroyed && !this.isEnded()) {
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
            } else if (decision.llmNote) {
              this.pushLog(
                'script',
                `🧠 [Entrenador LLM · Turno ${Math.max(1, this.state.turn)}] ${decision.llmNote}`
              );
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

  private parseRequestParty(
    req: ShowdownRequest,
    sideKey: 'p1' | 'p2',
    existingParty: PartyPokemonState[]
  ): PartyPokemonState[] {
    const reqParty = req.side?.pokemon ?? [];
    const existingByIdent = new Map<string, PartyPokemonState>();
    for (const old of existingParty) {
      existingByIdent.set(old.ident, old);
    }

    return reqParty.map((mon, idx) => {
      const cond = parseCondition(mon.condition);
      const det = parseDetails(mon.details);
      const speciesData = Dex.species.get(det.species);
      const identName = mon.ident.includes(':')
        ? mon.ident.split(':').slice(1).join(':').trim()
        : det.species;
      const prev = existingByIdent.get(mon.ident);
      const terastallized = prev?.terastallized ?? null;

      const usePrevHp =
        sideKey === 'p1' &&
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
        happiness:
          (sideKey === 'p1'
            ? this.p1HappinessBySpecies
            : this.p2HappinessBySpecies
          ).get(toID(det.species)) ??
          (sideKey === 'p1'
            ? this.p1HappinessBySpecies
            : this.p2HappinessBySpecies
          ).get(toID(speciesData.baseSpecies)),
      };
      this.refreshSpeedRange(sideKey, stateMon);
      return stateMon;
    });
  }

  private buildPendingSlotsFromRequest(
    req: ShowdownRequest,
    party: PartyPokemonState[]
  ): { isForceSwitch: boolean; pending: PendingDecisionSlot[]; autoPassCmd: string | null } {
    const pending: PendingDecisionSlot[] = [];

    if (req.forceSwitch) {
      const aliveBenchCount = party.filter((p) => !p.active && !p.fainted).length;
      if (aliveBenchCount === 0) {
        return {
          isForceSwitch: false,
          pending: [],
          autoPassCmd: req.forceSwitch.map(() => 'pass').join(', '),
        };
      }
      req.forceSwitch.forEach((mustSwitch, activeIndex) => {
        const mon = party[activeIndex];
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
      return { isForceSwitch: true, pending, autoPassCmd: null };
    }

    if (req.active) {
      req.active.forEach((slot, activeIndex) => {
        const mon = party[activeIndex];
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
          const moveId = toID(m.id || m.move);
          const isMaxFrustration =
            moveId === 'frustration' &&
            (mon.happiness === 0 || (m.move || '').includes('102'));
          const displayName =
            moveId === 'frustration' ? 'Frustration' : m.move || data.name;
          return {
            index: idx + 1,
            id: m.id,
            name: displayName,
            pp: m.pp ?? data.pp ?? 1,
            maxpp: m.maxpp ?? data.pp ?? 1,
            target: m.target || data.target || 'normal',
            disabled: Boolean(m.disabled),
            type: data.type || 'Normal',
            category:
              (data.category as ActiveMoveOption['category']) || 'Physical',
            basePower: isMaxFrustration ? 102 : data.basePower || 0,
            accuracy: data.accuracy ?? true,
            priority: data.priority ?? 0,
            shortDesc: data.shortDesc || data.desc || '',
            userHappiness: mon.happiness,
            powerNote: isMaxFrustration
              ? 'Potencia máxima por Felicidad: 0 (Vínculo roto)'
              : undefined,
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
      return { isForceSwitch: false, pending, autoPassCmd: null };
    }

    return { isForceSwitch: false, pending: [], autoPassCmd: null };
  }

  private handleHumanP2Request(req: ShowdownRequest): void {
    const updatedP2 = this.parseRequestParty(req, 'p2', this.state.p2HumanParty);
    if (updatedP2.length > 0) {
      this.state.p2HumanParty = updatedP2;
    }

    if (req.teamPreview) {
      if (this.config.interactiveTeamPreview) {
        const mode: TeamPreviewState['mode'] =
          req.maxChosenTeamSize === 1
            ? 'pick-1'
            : req.maxChosenTeamSize === 4
              ? 'pick-4'
              : 'lead-1';
        const pickCount = mode === 'pick-4' ? 4 : 1;
        const rawOpp =
          this.p1PreviewPokes.length > 0
            ? this.p1PreviewPokes
            : (Teams.import(this.config.playerShowdownPaste) ?? []).map((s) => {
                const sp = Dex.species.get(s.species);
                return {
                  species: sp.exists ? sp.name : s.species,
                  level:
                    s.level ||
                    (this.config.formatId === 'gen9vgc2024regg'
                      ? 50
                      : this.config.formatId === 'gen9lc'
                        ? 5
                        : 100),
                  gender: s.gender || '',
                  types: sp.types ? [...sp.types] : ['Normal'],
                };
              });

        this.state.p2TeamPreview = {
          active: true,
          mode,
          pickCount,
          playerRoster: this.state.p2HumanParty.map((m) => this.cloneMon(m)),
          rivalRoster: rawOpp.map((r, idx) => ({
            ...r,
            openSheet: this.state.openTeamsheet.enabled
              ? this.state.openTeamsheet.player[idx] ??
                this.state.openTeamsheet.player.find(
                  (os) => toID(os.species) === toID(r.species)
                )
              : undefined,
          })),
        };
        this.state.p2Waiting = false;
        this.state.p2RequestSeq += 1;
        this.syncCompositeStatus();
        this.emit();
      } else {
        void this.streams?.p2.write('default');
      }
      return;
    }

    this.state.p2TeamPreview = null;

    if (req.wait || this.state.status === 'ended') {
      this.state.p2PendingSlots = [];
      this.state.p2Waiting = true;
      this.syncCompositeStatus();
      this.emit();
      return;
    }

    const built = this.buildPendingSlotsFromRequest(req, this.state.p2HumanParty);
    if (built.autoPassCmd) {
      this.state.p2IsForceSwitch = false;
      this.state.p2PendingSlots = [];
      this.state.p2Waiting = true;
      this.syncCompositeStatus();
      this.emit();
      void this.streams?.p2.write(built.autoPassCmd);
      return;
    }

    this.state.p2IsForceSwitch = built.isForceSwitch;
    this.state.p2PendingSlots = built.pending;
    this.state.p2Waiting = built.pending.length === 0;
    this.state.p2RequestSeq += 1;
    this.syncCompositeStatus();
    this.emit();
  }

  private syncPlayerSideFromRequest(req: ShowdownRequest): void {
    const sideState = this.state.p1;
    const updatedParty = this.parseRequestParty(req, 'p1', sideState.party);
    if (updatedParty.length === 0) return;

    sideState.party = updatedParty;

    const activeCount =
      this.config.format === 'triples'
        ? 3
        : this.config.format === 'doubles'
          ? 2
          : 1;
    const nextActive: (PartyPokemonState | null)[] = Array(activeCount).fill(null);
    for (let i = 0; i < activeCount; i++) {
      const candidate = updatedParty[i];
      if (candidate && candidate.active) {
        nextActive[i] = candidate;
      }
    }
    sideState.active = nextActive;
  }

  private buildTeamPreviewState(req: ShowdownRequest): TeamPreviewState {
    const mode: TeamPreviewState['mode'] =
      req.maxChosenTeamSize === 1
        ? 'pick-1'
        : req.maxChosenTeamSize === 4
          ? 'pick-4'
          : 'lead-1';
    const pickCount = mode === 'pick-4' ? 4 : 1;

    // Build rival preview roster from |poke|p2| lines or parsed paste fallback
    const rawRival =
      this.rivalPreviewPokes.length > 0
        ? this.rivalPreviewPokes
        : (Teams.import(this.config.rivalShowdownPaste) ?? []).map((s) => {
            const sp = Dex.species.get(s.species);
            return {
              species: sp.exists ? sp.name : s.species,
              level:
                s.level || (this.config.formatId === 'gen9vgc2024regg' ? 50 : 100),
              gender: s.gender || '',
              types: sp.types ? [...sp.types] : ['Normal'],
            };
          });

    const rivalRoster = rawRival.map((r, idx) => ({
      ...r,
      openSheet: this.state.openTeamsheet.enabled
        ? this.state.openTeamsheet.rival[idx] ??
          this.state.openTeamsheet.rival.find(
            (os) => toID(os.species) === toID(r.species)
          )
        : undefined,
    }));

    return {
      active: true,
      mode,
      pickCount,
      playerRoster: this.state.p1.party.map((m) => this.cloneMon(m)),
      rivalRoster,
    };
  }

  private handlePlayerRequest(req: ShowdownRequest): void {
    const expectsTurn1Override =
      !req.teamPreview &&
      !req.wait &&
      Boolean(
        this.config.persistedPartyState ||
          (this.config.emptyPlayerSlots && this.config.emptyPlayerSlots.length > 0)
      );

    if (expectsTurn1Override && this.state.turn <= 1) {
      this.turn1RequestsSeen += 1;
      if (this.turn1RequestsSeen === 1) {
        // Discard stale pre-override Turn 1 request; wait cleanly for post-override Turn 1 request #2!
        this.state.pendingSlots = [];
        this.state.status = 'resolving';
        this.emit();
        return;
      }
    }

    this.syncPlayerSideFromRequest(req);

    if (req.teamPreview) {
      if (this.config.interactiveTeamPreview) {
        this.state.teamPreview = this.buildTeamPreviewState(req);
        this.state.p1Waiting = false;
        this.state.requestSeq += 1;
        this.syncCompositeStatus();
        this.emit();
      } else {
        void this.streams?.p1.write('default');
      }
      return;
    }

    this.state.teamPreview = null;

    if (req.wait || this.state.status === 'ended') {
      this.state.pendingSlots = [];
      this.state.p1Waiting = true;
      this.syncCompositeStatus();
      this.emit();
      return;
    }

    const built = this.buildPendingSlotsFromRequest(req, this.state.p1.party);
    if (built.autoPassCmd) {
      this.state.isForceSwitch = false;
      this.state.pendingSlots = [];
      this.state.p1Waiting = true;
      this.syncCompositeStatus();
      this.emit();
      void this.streams?.p1.write(built.autoPassCmd);
      return;
    }

    this.state.isForceSwitch = built.isForceSwitch;
    this.state.pendingSlots = built.pending;
    this.state.p1Waiting = built.pending.length === 0;
    this.state.requestSeq += 1;
    if (this.persistenceInjected && this.turn1RequestsSeen >= 2) {
      this.state.persistenceApplied = true;
    }
    this.syncCompositeStatus();
    this.emit();
  }

  private handleProtocolLine(line: string): void {
    const parts = line.split('|');
    const cmd = parts[1];

    switch (cmd) {
      case 'clearpoke': {
        this.p1PreviewPokes = [];
        this.rivalPreviewPokes = [];
        break;
      }

      case 'poke': {
        if (parts[2] === 'p1' || parts[2] === 'p2') {
          const det = parseDetails(parts[3] ?? '');
          const sp = Dex.species.get(det.species);
          const item = {
            species: sp.exists ? sp.name : det.species,
            level:
              det.level ||
              (this.config.formatId === 'gen9vgc2024regg'
                ? 50
                : this.config.formatId === 'gen9lc'
                  ? 5
                  : 100),
            gender: det.gender,
            types: sp.types ? [...sp.types] : ['Normal'],
          };
          if (parts[2] === 'p1') this.p1PreviewPokes.push(item);
          else this.rivalPreviewPokes.push(item);
        }
        break;
      }

      case 'teamsize': {
        if (parts[2] === 'p2') {
          const n = Number(parts[3]);
          if (n > 0) {
            this.state.totalP2 =
              this.config.formatId === 'gen91v1'
                ? 1
                : this.config.formatId === 'gen9vgc2024regg'
                  ? 4
                  : n;
          }
        }
        break;
      }

      case 'turn': {
        this.state.turn = Number(parts[2]) || this.state.turn + 1;
        for (let i = 0; i < this.state.p2.active.length; i++) {
          if (this.state.p2.active[i] && !this.state.p2.active[i]!.fainted) {
            this.p2ActiveTurns[i] = (this.p2ActiveTurns[i] ?? 0) + 1;
          }
        }
        this.decrementTurnTimers();
        this.pushLog('turn', `Turn ${this.state.turn}`);
        if (this.state.turn === 1) {
          this.applyInitialBattleOverridesIfNeeded();
        }
        break;
      }

      case 'switch':
      case 'drag':
      case 'replace': {
        const { side, slotIndex, name } = parseSlotFromIdent(parts[2] ?? '');
        const det = parseDetails(parts[3] ?? '');
        const cond = parseCondition(parts[4] ?? '100/100');
        const isBatonPass = parts
          .slice(4)
          .some((p) => p.includes('Baton Pass'));
        const speciesData = Dex.species.get(det.species);
        const sideState = this.state[side];
        if (side === 'p2') {
          this.p2ActiveTurns[slotIndex] = 0;
        }

        const prevInSlot = sideState.active[slotIndex];
        const passedBoosts =
          isBatonPass && prevInSlot ? { ...prevInSlot.boosts } : {};
        const passedVolatiles =
          isBatonPass && prevInSlot
            ? prevInSlot.volatiles.filter((v) =>
                ['substitute', 'aqua ring', 'ingrain', 'leech seed', 'focus energy'].some(
                  (k) => v.toLowerCase().includes(k)
                )
              )
            : [];

        if (prevInSlot) {
          prevInSlot.active = false;
          prevInSlot.boosts = {};
          prevInSlot.volatiles = [];
          this.refreshSpeedRange(side, prevInSlot);
        }

        const happinessMap =
          side === 'p1'
            ? this.p1HappinessBySpecies
            : this.p2HappinessBySpecies;
        const configuredHappiness =
          happinessMap.get(toID(det.species)) ??
          happinessMap.get(toID(speciesData.baseSpecies));

        // If Open Teamsheet is active (e.g. VGC Worlds), pre-populate rival's known item/ability/tera!
        const openRivalMatch =
          side === 'p2' && this.state.openTeamsheet.enabled
            ? this.state.openTeamsheet.rival.find(
                (os) =>
                  toID(os.species) === toID(det.species) ||
                  toID(os.species) === toID(speciesData.baseSpecies)
              )
            : undefined;

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
            item: openRivalMatch?.item ?? '',
            ability: openRivalMatch?.ability ?? '',
            moves: openRivalMatch?.moves ?? [],
            types: speciesData.types ? [...speciesData.types] : ['Normal'],
            teraType: openRivalMatch?.teraType,
            terastallized: null,
            boosts: passedBoosts,
            revealed: true,
            revealedAbility: openRivalMatch?.ability ?? null,
            possibleAbilities: getPossibleAbilities(det.species),
            revealedItem: openRivalMatch?.item ?? null,
            consumedItem: null,
            revealedMoves: {},
            volatiles: passedVolatiles,
            isBossAce: side === 'p2' && det.level > this.state.levelCap,
            happiness: configuredHappiness,
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
          existing.boosts = passedBoosts;
          existing.volatiles = passedVolatiles;
          existing.types = existing.terastallized
            ? [existing.terastallized]
            : speciesData.types
              ? [...speciesData.types]
              : existing.types;
          existing.possibleAbilities = getPossibleAbilities(det.species);
          existing.isBossAce = side === 'p2' && det.level > this.state.levelCap;
          if (configuredHappiness !== undefined) {
            existing.happiness = configuredHappiness;
          }
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
          const hMap =
            side === 'p1'
              ? this.p1HappinessBySpecies
              : this.p2HappinessBySpecies;
          const actorHappiness =
            activeMon?.happiness ??
            partyMon?.happiness ??
            hMap.get(toID(activeMon?.species ?? name));
          const isMaxFrustration =
            moveData.id === 'frustration' && actorHappiness === 0;
          if (isMaxFrustration) {
            this.pushLog(
              'effective',
              `💢 ${name} desata Frustration a Poder Base 102 (Felicidad: 0 · Vínculo roto)!`
            );
          }
          const updateMoves = (m: PartyPokemonState | null) => {
            if (!m) return;
            const prev = m.revealedMoves[moveName];
            m.revealedMoves[moveName] = {
              id: moveData.id || moveName.toLowerCase(),
              name: moveData.name || moveName,
              type: moveData.type || 'Normal',
              used: (prev?.used ?? 0) + 1,
              maxPP: prev?.maxPP ?? maxPP,
              basePower: isMaxFrustration ? 102 : moveData.basePower || undefined,
              powerNote: isMaxFrustration
                ? 'Potencia máxima por Felicidad: 0 (Vínculo roto)'
                : undefined,
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
        this.pushLog(
          'boost',
          `🔄 ¡Se invirtieron todos los cambios de stats de ${name}!`
        );
        break;
      }

      case '-copyboost': {
        const target = parseSlotFromIdent(parts[2] ?? '');
        const source = parseSlotFromIdent(parts[3] ?? '');
        const sourceMon = this.state[source.side].active[source.slotIndex];
        const { activeMon, partyMon } = this.getTargetMons(
          target.side,
          target.slotIndex,
          target.name
        );
        if (sourceMon) {
          for (const m of [activeMon, partyMon]) {
            if (!m) continue;
            m.boosts = { ...sourceMon.boosts };
            this.refreshSpeedRange(target.side, m);
          }
        }
        this.pushLog(
          'boost',
          `✨ ¡${target.name} copió todas las mejoras de stats de ${source.name}!`
        );
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
          this.state.terrainTurnsLeft = 5;
        } else if (field.includes('Trick Room')) {
          this.state.trickRoomTurnsLeft = 5;
        }
        this.pushLog('weather', `Campo activo: ${terrainLabel(field)}.`);
        break;
      }

      case '-fieldend': {
        const field = cleanEffectName(parts[2] ?? '');
        if (field.includes('Terrain')) {
          this.state.terrain = '';
          this.state.terrainTurnsLeft = null;
        } else if (field.includes('Trick Room')) {
          this.state.trickRoomTurnsLeft = null;
        }
        this.pushLog('weather', `Terminó ${terrainLabel(field)}.`);
        break;
      }

      case '-weather': {
        const w = parts[2] ?? '';
        const isUpkeep = Boolean(parts[3]?.includes('[upkeep]'));
        this.inspectTagsForReveals(undefined, parts.slice(3));
        if (w === 'none') {
          this.state.weather = '';
          this.state.weatherTurnsLeft = null;
        } else {
          const lbl = weatherLabel(w);
          const isNew = !isUpkeep && this.state.weather !== lbl;
          this.state.weather = lbl;
          if (isNew || this.state.weatherTurnsLeft == null) {
            this.state.weatherTurnsLeft = 5;
          }
          if (!isUpkeep) {
            this.pushLog('weather', `Clima activo: ${lbl} (5 turnos).`);
          }
        }
        break;
      }

      case '-sidestart': {
        const side: 'p1' | 'p2' = (parts[2] ?? '').startsWith('p2') ? 'p2' : 'p1';
        const condName = cleanEffectName(parts[3] ?? '');
        if (condName && !this.state[side].sideConditions.includes(condName)) {
          this.state[side].sideConditions.push(condName);
          const low = condName.toLowerCase();
          if (low.includes('tailwind')) {
            this.state[side].sideTimers[condName] = 4;
          } else if (
            low.includes('reflect') ||
            low.includes('light screen') ||
            low.includes('aurora veil')
          ) {
            const hasLightClay = this.state[side].active.some(
              (m) => m && m.item.toLowerCase() === 'light clay'
            );
            this.state[side].sideTimers[condName] = hasLightClay ? 8 : 5;
          }
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
        delete this.state[side].sideTimers[condName];
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
        } else if (msg === '__PERSISTENCE_READY__') {
          if (this.turn1RequestsSeen >= 2) {
            this.state.persistenceApplied = true;
          }
          this.refreshSideSpeeds('p1');
        } else if (msg === '__EMPTY_SLOTS_READY__') {
          this.refreshSideSpeeds('p1');
        } else if (msg) {
          this.pushLog('system', msg);
        }
        break;
      }

      case 'win': {
        const winnerName = parts[2] ?? '';
        this.state.winner =
          toID(winnerName) === toID(this.config.playerName) ? 'p1' : 'p2';
        this.state.status = 'ended';
        this.state.pendingSlots = [];
        this.state.p2PendingSlots = [];
        this.state.teamPreview = null;
        this.state.p2TeamPreview = null;
        if (this.battleStreamRef?.battle) {
          this.state.exportedPartyState = BattlePersistenceManager.exportPartyState(
            this.battleStreamRef.battle,
            this.config.battleStageId ?? this.config.chapterId
          );
        }
        this.pushLog('win', `🏆 ¡${winnerName} ganó el combate!`);
        break;
      }

      case 'tie': {
        this.state.winner = 'tie';
        this.state.status = 'ended';
        this.state.pendingSlots = [];
        this.state.p2PendingSlots = [];
        this.state.teamPreview = null;
        this.state.p2TeamPreview = null;
        if (this.battleStreamRef?.battle) {
          this.state.exportedPartyState = BattlePersistenceManager.exportPartyState(
            this.battleStreamRef.battle,
            this.config.battleStageId ?? this.config.chapterId
          );
        }
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
  if (format !== 'doubles' && format !== 'triples') return 'none';
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

export function isFoeTargetReachable(
  format: BattleFormat,
  attackerSlot: number,
  foeSlot: number,
  moveTarget: string
): boolean {
  if (format !== 'triples') return true;
  if (moveTarget === 'any') return true;
  return isTriplesAdjacentFoe(attackerSlot, foeSlot);
}

export function isAllyTargetReachable(
  format: BattleFormat,
  attackerSlot: number,
  allySlot: number
): boolean {
  if (attackerSlot === allySlot) return false;
  if (format !== 'triples') return true;
  return isTriplesAdjacentAlly(attackerSlot, allySlot);
}
