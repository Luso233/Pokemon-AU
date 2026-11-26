import { BattleStreams, Dex, Teams } from '@pkmn/sim';
import type {
  ActiveMoveOption,
  BattleAnimationCue,
  BattleFormat,
  BattleLogEntry,
  BattleSnapshot,
  PartyPokemonState,
  PendingDecisionSlot,
  ResolvedBattleConfig,
} from '../types/game';
import { chooseRivalAction, type ShowdownRequest } from './tacticalAI';

function parseCondition(condition: string): {
  hp: number;
  maxhp: number;
  hpPercent: number;
  status: string;
  fainted: boolean;
} {
  const clean = (condition || '').trim();
  if (!clean || clean === '0 fnt' || clean.endsWith(' fnt')) {
    return { hp: 0, maxhp: 100, hpPercent: 0, status: '', fainted: true };
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
  slotIndex: number; // 0 for a, 1 for b
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

function weatherLabel(id: string): string {
  const map: Record<string, string> = {
    Sandstorm: 'Tormenta de Arena',
    RainDance: 'Lluvia',
    SunnyDay: 'Sol Intenso',
    Snow: 'Nieve',
    Hail: 'Granizo',
    DeltaStream: 'Ráfaga Delta',
    DesolateLand: 'Tierra del Ocaso',
    PrimordialSea: 'Mar del Albor',
    none: '',
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

export class ShowdownBattleController {
  private streams: ReturnType<typeof BattleStreams.getPlayerStreams> | null = null;
  private listener: (snapshot: BattleSnapshot) => void;
  private config: ResolvedBattleConfig;
  private state: BattleSnapshot;
  private logSeq = 0;
  private cueSeq = 0;
  private destroyed = false;
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
      turn: 0,
      weather: '',
      terrain: '',
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
      koCountP2: 0,
      totalP2: 0,
    };
  }

  public getSnapshot(): BattleSnapshot {
    return this.cloneSnapshot();
  }

  private cloneSnapshot(): BattleSnapshot {
    return {
      ...this.state,
      p1: {
        ...this.state.p1,
        active: this.state.p1.active.map((m) => (m ? { ...m, boosts: { ...m.boosts } } : null)),
        party: this.state.p1.party.map((m) => ({ ...m, boosts: { ...m.boosts } })),
        sideConditions: [...this.state.p1.sideConditions],
      },
      p2: {
        ...this.state.p2,
        active: this.state.p2.active.map((m) => (m ? { ...m, boosts: { ...m.boosts } } : null)),
        party: this.state.p2.party.map((m) => ({ ...m, boosts: { ...m.boosts } })),
        sideConditions: [...this.state.p2.sideConditions],
      },
      pendingSlots: this.state.pendingSlots.map((s) => ({
        ...s,
        moves: [...s.moves],
      })),
      log: [...this.state.log],
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

  public async start(): Promise<void> {
    const p1Sets = Teams.import(this.config.playerShowdownPaste);
    const p2Sets = Teams.import(this.config.rivalShowdownPaste);

    if (!p1Sets || p1Sets.length === 0) {
      throw new Error('El Showdown Paste del jugador no contiene ningún Pokémon válido.');
    }
    if (!p2Sets || p2Sets.length === 0) {
      throw new Error('El Showdown Paste del rival no contiene ningún Pokémon válido.');
    }

    const p1Packed = Teams.pack(p1Sets);
    const p2Packed = Teams.pack(p2Sets);

    this.state.totalP2 = p2Sets.length;
    this.pushLog(
      'system',
      `Simulador @pkmn/sim iniciado (${this.config.format === 'doubles' ? 'Dobles 2v2' : 'Individuales'} · ${this.config.formatId}).`
    );

    const battleStream = new BattleStreams.BattleStream();
    const streams = BattleStreams.getPlayerStreams(battleStream);
    this.streams = streams;

    // Pump omniscient public protocol stream
    void this.consumeOmniscient(streams.omniscient);
    // Pump player 1 request stream
    void this.consumePlayerStream(streams.p1);
    // Pump rival AI request stream
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
    // Let finished streams close naturally without throwing Push-after-end in @pkmn/streams
    if (this.streams && this.state.status !== 'ended') {
      try {
        void this.streams.omniscient.writeEnd().catch(() => {});
      } catch {
        // ignore cleanup errors
      }
    }
    this.streams = null;
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
            // Re-enable choice input if Showdown rejected a command
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
          this.syncSideFromRequest('p2', req);

          if (req.wait || this.state.status === 'ended') {
            this.emit();
            continue;
          }

          const cmd = chooseRivalAction(req, {
            format: this.config.format,
            foeActiveSpecies: this.state.p1.active.map((m) =>
              m && !m.fainted ? m.species : null
            ),
            foeActiveStatus: this.state.p1.active.map((m) =>
              m && !m.fainted ? m.status || null : null
            ),
            turn: this.state.turn,
          });
          if (cmd && this.streams) {
            await this.streams.p2.write(cmd);
          }
        }
      }
    } catch {
      // stream closed
    }
  }

  private syncSideFromRequest(sideKey: 'p1' | 'p2', req: ShowdownRequest): void {
    const sideState = this.state[sideKey];
    const reqParty = req.side?.pokemon ?? [];
    if (reqParty.length === 0) return;

    const existingBoostsByIdent = new Map<string, Record<string, number>>();
    for (const old of sideState.party) {
      existingBoostsByIdent.set(old.ident, old.boosts);
    }

    const updatedParty: PartyPokemonState[] = reqParty.map((mon, idx) => {
      const cond = parseCondition(mon.condition);
      const det = parseDetails(mon.details);
      const speciesData = Dex.species.get(det.species);
      const identName = mon.ident.includes(':')
        ? mon.ident.split(':').slice(1).join(':').trim()
        : det.species;

      return {
        slotIndex: idx + 1,
        ident: mon.ident,
        name: identName,
        species: det.species,
        level: det.level,
        gender: det.gender,
        hp: cond.hp,
        maxhp: cond.maxhp,
        hpPercent: cond.hpPercent,
        status: cond.status,
        fainted: cond.fainted,
        active: mon.active,
        item: mon.item || '',
        ability: mon.baseAbility || '',
        moves: mon.moves || [],
        types: speciesData.types ? [...speciesData.types] : ['Normal'],
        stats: mon.stats
          ? {
              atk: mon.stats.atk ?? 0,
              def: mon.stats.def ?? 0,
              spa: mon.stats.spa ?? 0,
              spd: mon.stats.spd ?? 0,
              spe: mon.stats.spe ?? 0,
            }
          : undefined,
        boosts: mon.active ? existingBoostsByIdent.get(mon.ident) ?? {} : {},
      };
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

    if (sideKey === 'p2') {
      this.state.totalP2 = updatedParty.length;
      this.state.koCountP2 = updatedParty.filter((p) => p.fainted).length;
    }
  }

  private handlePlayerRequest(req: ShowdownRequest): void {
    this.syncSideFromRequest('p1', req);

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
            category: (data.category as ActiveMoveOption['category']) || 'Physical',
            basePower: data.basePower || 0,
            accuracy: data.accuracy ?? true,
            shortDesc: data.shortDesc || data.desc || '',
          };
        });

        pending.push({
          activeIndex,
          pokemon: mon,
          moves,
          trapped: Boolean(slot.trapped),
          canMegaEvo: Boolean(slot.canMegaEvo),
          canTerastallize: false,
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
      case 'turn': {
        this.state.turn = Number(parts[2]) || this.state.turn + 1;
        this.pushLog('turn', `— Turno ${this.state.turn} —`);
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

        let existing = sideState.party.find(
          (p) => p.name === name && p.species === det.species
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
            boosts: {},
          };
          sideState.party.push(existing);
        } else {
          existing.hpPercent = cond.hpPercent;
          existing.status = cond.status;
          existing.fainted = cond.fainted;
          existing.active = true;
          existing.boosts = {};
        }

        sideState.active[slotIndex] = existing;
        const trainer = sideState.playerName;
        this.pushLog(
          'switch',
          `${trainer} envió a ${name}${name !== det.species ? ` (${det.species})` : ''} (Nv. ${det.level}).`
        );
        break;
      }

      case 'move': {
        const { side, slotIndex, name } = parseSlotFromIdent(parts[2] ?? '');
        const moveName = parts[3] ?? 'Movimiento';
        this.lastAttackSource = { side, slot: slotIndex };
        this.emitCue({ attackerSide: side, attackerSlot: slotIndex });
        this.pushLog('move', `${name} usó ${moveName}!`);
        break;
      }

      case '-damage':
      case '-heal': {
        const { side, slotIndex, name } = parseSlotFromIdent(parts[2] ?? '');
        const cond = parseCondition(parts[3] ?? '');
        const activeMon = this.state[side].active[slotIndex];
        const prevPercent = activeMon?.hpPercent ?? 100;

        if (activeMon) {
          activeMon.hpPercent = cond.hpPercent;
          activeMon.status = cond.status;
          activeMon.fainted = cond.fainted;
          if (side === 'p2') {
            activeMon.hp = cond.hp;
            activeMon.maxhp = cond.maxhp;
          }
          const partyMatch = this.state[side].party.find(
            (p) => p.ident === activeMon.ident || p.name === activeMon.name
          );
          if (partyMatch) {
            partyMatch.hpPercent = cond.hpPercent;
            partyMatch.status = cond.status;
            partyMatch.fainted = cond.fainted;
          }
        }

        if (cmd === '-damage') {
          const delta = Math.max(0, prevPercent - cond.hpPercent);
          this.emitCue({
            attackerSide: this.lastAttackSource?.side,
            attackerSlot: this.lastAttackSource?.slot,
            targetSide: side,
            targetSlot: slotIndex,
          });
          if (delta > 0) {
            const fromTag = parts[4] ? ` (${parts[4].replace('[from] ', '')})` : '';
            this.pushLog(
              'damage',
              `${name} perdió ${delta}% de PS${fromTag} (${cond.hpPercent}% restante).`
            );
          }
        } else {
          this.pushLog('status', `${name} recuperó PS (${cond.hpPercent}%).`);
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

      case '-status': {
        const { side, slotIndex, name } = parseSlotFromIdent(parts[2] ?? '');
        const st = parts[3] ?? '';
        const mon = this.state[side].active[slotIndex];
        if (mon) mon.status = st;
        this.pushLog('status', `${name} quedó ${statusSpanish(st)}.`);
        break;
      }

      case '-curestatus': {
        const { side, slotIndex, name } = parseSlotFromIdent(parts[2] ?? '');
        const mon = this.state[side].active[slotIndex];
        if (mon) mon.status = '';
        this.pushLog('status', `${name} se curó de su estado alterado.`);
        break;
      }

      case '-boost':
      case '-unboost': {
        const { side, slotIndex, name } = parseSlotFromIdent(parts[2] ?? '');
        const stat = parts[3] ?? '';
        const amount = Number(parts[4]) || 1;
        const delta = cmd === '-boost' ? amount : -amount;
        const mon = this.state[side].active[slotIndex];
        if (mon && stat) {
          mon.boosts[stat] = Math.max(-6, Math.min(6, (mon.boosts[stat] ?? 0) + delta));
        }
        this.pushLog(
          'status',
          `${name}: ${stat.toUpperCase()} ${delta > 0 ? `+${delta}` : delta}.`
        );
        break;
      }

      case '-weather': {
        const w = parts[2] ?? '';
        this.state.weather = w === 'none' ? '' : weatherLabel(w);
        if (w !== 'none' && !parts[3]?.includes('[upkeep]')) {
          this.pushLog('weather', `Clima activo: ${this.state.weather}.`);
        }
        break;
      }

      case '-sidestart': {
        const side: 'p1' | 'p2' = (parts[2] ?? '').startsWith('p2') ? 'p2' : 'p1';
        const condName = (parts[3] ?? '').replace(/^move:\s*/i, '');
        if (condName && !this.state[side].sideConditions.includes(condName)) {
          this.state[side].sideConditions.push(condName);
        }
        this.pushLog('status', `${this.state[side].playerName} activó ${condName}.`);
        break;
      }

      case '-sideend': {
        const side: 'p1' | 'p2' = (parts[2] ?? '').startsWith('p2') ? 'p2' : 'p1';
        const condName = (parts[3] ?? '').replace(/^move:\s*/i, '');
        this.state[side].sideConditions = this.state[side].sideConditions.filter(
          (c) => c !== condName
        );
        break;
      }

      case '-activate': {
        const effect = parts[3] ?? '';
        if (effect.includes('Splash')) {
          this.pushLog('status', '¡Pero no tuvo ningún efecto!');
        }
        break;
      }

      case '-enditem': {
        const { name } = parseSlotFromIdent(parts[2] ?? '');
        const item = parts[3] ?? '';
        this.pushLog('status', `${name} consumió su ${item}!`);
        break;
      }

      case '-ability': {
        const { side, slotIndex, name } = parseSlotFromIdent(parts[2] ?? '');
        const ab = parts[3] ?? '';
        const mon = this.state[side].active[slotIndex];
        if (mon && ab) mon.ability = ab;
        this.pushLog('status', `[${name} · ${ab}]`);
        break;
      }

      case '-transform': {
        const { side, slotIndex, name } = parseSlotFromIdent(parts[2] ?? '');
        const target = parseSlotFromIdent(parts[3] ?? '');
        const targetMon = this.state[target.side].active[target.slotIndex];
        const selfMon = this.state[side].active[slotIndex];
        if (selfMon && targetMon) {
          selfMon.species = targetMon.species;
          selfMon.types = [...targetMon.types];
        }
        this.pushLog('status', `${name} se transformó en ${target.name}!`);
        break;
      }

      case 'faint': {
        const { side, slotIndex, name } = parseSlotFromIdent(parts[2] ?? '');
        const mon = this.state[side].active[slotIndex];
        if (mon) {
          mon.hp = 0;
          mon.hpPercent = 0;
          mon.fainted = true;
        }
        const partyMatch = this.state[side].party.find(
          (p) => p.name === name || (mon && p.ident === mon.ident)
        );
        if (partyMatch) {
          partyMatch.hp = 0;
          partyMatch.hpPercent = 0;
          partyMatch.fainted = true;
        }
        if (side === 'p2') {
          this.state.koCountP2 = this.state.p2.party.filter((p) => p.fainted).length;
        }
        this.pushLog('faint', `¡${name} se debilitó!`);
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
