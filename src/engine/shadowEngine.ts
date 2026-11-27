import { Dex, Teams, toID } from '@pkmn/sim';
import type {
  AffectionMode,
  BattleDifficultyMode,
  CustomTeamMember,
  OwnedPokemonInstance,
  PlayerSaveProfile,
  ShadowBattleMeta,
} from '../types/game';

/* ============================================================================
 * SHADOW POKÉMON (COLOSSEUM / XD GEN 9 CALIBRATED REWORK) + POWER OF FRIENDSHIP
 * - 5-Bar Heart Gauge (100 -> 0) with progressive Nature reveal, EV & Move unlocks
 * - Authentic Colosseum Nature Affinity Table (Battle / Call / Purification Chamber)
 * - Closed Heart Lock (Blocks Mega, Tera, Z-Moves & Affection while Shadow!)
 * - Hyper/Reverse Mode (+2 Crit, +15% Shadow dmg, 1/12 recoil, blocks healing items,
 *   Nature-driven disobedience ONLY on non-Shadow moves) + `📢 Llamar` (`shadowcall`)
 * - 23 Calibrated Shadow Moves (18 Reworked Classics + 5 New Gen 9 Moves) + Shadow Sky ×1.3
 * - XD Purification Chamber Flow & Tempo Ring Solver + XD001 Dark Lugia Max-Tempo Seal
 * ============================================================================ */

export interface ShadowMoveDefinition {
  id: string;
  name: string;
  num: number;
  basePower: number;
  accuracy: number | true;
  category: 'Physical' | 'Special' | 'Status';
  pp: number;
  priority: number;
  target:
    | 'normal'
    | 'allAdjacentFoes'
    | 'all'
    | 'self'
    | 'allySide'
    | 'foeSide';
  type: 'Shadow';
  isOriginalClassic: boolean;
  shortDesc: string;
  dexData: Record<string, unknown>;
}

/**
 * Helper used by Shadow status moves: checks Fairy 0× immunity unless the target
 * has `shadowtear` active (which suppresses Fairy immunity to Shadow for 3 turns!).
 */
function isTargetShadowImmune(target: any): boolean {
  if (!target) return false;
  if (target.volatiles?.shadowtear) return false;
  return Boolean(target.hasType?.('Fairy'));
}

/**
 * Helper used by Shadow Half: checks whether target is protected this turn.
 */
function isTargetProtected(target: any): boolean {
  if (!target?.volatiles) return false;
  return Boolean(
    target.volatiles.protect ||
      target.volatiles.spikyshield ||
      target.volatiles.kingsshield ||
      target.volatiles.banefulbunker ||
      target.volatiles.obstruct ||
      target.volatiles.burningbulwark ||
      target.volatiles.silktrap ||
      target.volatiles.maxguard
  );
}

/**
 * Full 23-Move Calibrated Gen 9 Shadow Arsenal:
 * - 18 Reworked Colosseum / XD Classics (balanced around Shadow's universal 2× SE!)
 * - 5 Brand-New Moves: Shadow Eclipse, Shadow Aeroblast, Shadow Siphon, Shadow Tear, Shadow Cataclysm
 */
export const SHADOW_MOVES_CATALOG: ShadowMoveDefinition[] = [
  /* -------- 18 REWORKED COLOSSEUM / XD CLASSICS -------- */
  {
    id: 'shadowblitz',
    name: 'Shadow Blitz',
    num: 9001,
    basePower: 60,
    accuracy: 100,
    category: 'Physical',
    pp: 15,
    priority: 1,
    target: 'normal',
    type: 'Shadow',
    isOriginalClassic: true,
    shortDesc: 'Prioridad +1 · Golpe rápido de aura oscura (60 BP · 15 PP).',
    dexData: {
      flags: { contact: 1, protect: 1, mirror: 1 },
      secondary: null,
    },
  },
  {
    id: 'shadowrush',
    name: 'Shadow Rush',
    num: 9002,
    basePower: 85,
    accuracy: 100,
    category: 'Physical',
    pp: 12,
    priority: 0,
    target: 'normal',
    type: 'Shadow',
    isOriginalClassic: true,
    shortDesc: '85 BP · 1/16 PS de retroceso y +20% probabilidad extra de activar Modo Hiper.',
    dexData: {
      flags: { contact: 1, protect: 1, mirror: 1 },
      onAfterMoveSecondarySelf(this: any, source: any) {
        if (source && !source.fainted) {
          this.damage(
            Math.max(1, Math.floor(source.baseMaxhp / 16)),
            source,
            source,
            { id: 'shadowrush', name: 'Shadow Rush', effectType: 'Move' }
          );
        }
      },
      secondary: null,
    },
  },
  {
    id: 'shadowbreak',
    name: 'Shadow Break',
    num: 9003,
    basePower: 80,
    accuracy: 100,
    category: 'Physical',
    pp: 12,
    priority: 0,
    target: 'normal',
    type: 'Shadow',
    isOriginalClassic: true,
    shortDesc: '80 BP · Destruye Reflejo, Pantalla de Luz y Velo Aurora antes de golpear.',
    dexData: {
      flags: { contact: 1, protect: 1, mirror: 1 },
      onTryHit(this: any, pokemon: any) {
        pokemon.side.removeSideCondition('reflect');
        pokemon.side.removeSideCondition('lightscreen');
        pokemon.side.removeSideCondition('auroraveil');
      },
      secondary: null,
    },
  },
  {
    id: 'shadowblast',
    name: 'Shadow Blast',
    num: 9004,
    basePower: 95,
    accuracy: 95,
    category: 'Physical',
    pp: 8,
    priority: 0,
    target: 'normal',
    type: 'Shadow',
    isOriginalClassic: true,
    shortDesc: '95 BP · Alto Crítico (+1) → ¡100% CRÍTICO GARANTIZADO en Modo Hiper!',
    dexData: {
      flags: { protect: 1, mirror: 1 },
      critRatio: 2,
      secondary: null,
    },
  },
  {
    id: 'shadowend',
    name: 'Shadow End',
    num: 9005,
    basePower: 130,
    accuracy: 85,
    category: 'Physical',
    pp: 5,
    priority: 0,
    target: 'normal',
    type: 'Shadow',
    isOriginalClassic: true,
    shortDesc: 'Remate brutal de 130 BP · Cuesta 33% de los PS actuales del usuario.',
    dexData: {
      flags: { contact: 1, protect: 1, mirror: 1 },
      onAfterMoveSecondarySelf(this: any, source: any) {
        if (source && !source.fainted && source.hp > 1) {
          const selfCost = Math.max(1, Math.floor(source.hp / 3));
          this.damage(selfCost, source, source, {
            id: 'shadowend',
            name: 'Shadow End',
            effectType: 'Move',
          });
        }
      },
      secondary: null,
    },
  },
  {
    id: 'shadowwave',
    name: 'Shadow Wave',
    num: 9006,
    basePower: 65,
    accuracy: 100,
    category: 'Special',
    pp: 15,
    priority: 0,
    target: 'allAdjacentFoes',
    type: 'Shadow',
    isOriginalClassic: true,
    shortDesc: '65 BP de área (Icy Wind Oscuro) · 100% de bajar -1 Velocidad a ambos rivales.',
    dexData: {
      flags: { protect: 1, mirror: 1 },
      secondary: { chance: 100, boosts: { spe: -1 } },
    },
  },
  {
    id: 'shadowrave',
    name: 'Shadow Rave',
    num: 9007,
    basePower: 85,
    accuracy: 100,
    category: 'Special',
    pp: 10,
    priority: 0,
    target: 'allAdjacentFoes',
    type: 'Shadow',
    isOriginalClassic: true,
    shortDesc: '85 BP de área · Atraviesa Sustitutos (Bypass Sub).',
    dexData: {
      flags: { protect: 1, mirror: 1, bypasssub: 1 },
      secondary: null,
    },
  },
  {
    id: 'shadowstorm',
    name: 'Shadow Storm',
    num: 9008,
    basePower: 95,
    accuracy: 95,
    category: 'Special',
    pp: 8,
    priority: 0,
    target: 'allAdjacentFoes',
    type: 'Shadow',
    isOriginalClassic: true,
    shortDesc: '95 BP de área · Viento oscuro con 20% de bajar -1 Def. Esp.',
    dexData: {
      flags: { protect: 1, mirror: 1, wind: 1 },
      secondary: { chance: 20, boosts: { spd: -1 } },
    },
  },
  {
    id: 'shadowbolt',
    name: 'Shadow Bolt',
    num: 9009,
    basePower: 85,
    accuracy: 100,
    category: 'Special',
    pp: 10,
    priority: 0,
    target: 'normal',
    type: 'Shadow',
    isOriginalClassic: true,
    shortDesc: '85 BP · Rayo de aura oscura con 20% de Parálisis (PAR).',
    dexData: {
      flags: { protect: 1, mirror: 1 },
      secondary: { chance: 20, status: 'par' },
    },
  },
  {
    id: 'shadowfire',
    name: 'Shadow Fire',
    num: 9010,
    basePower: 85,
    accuracy: 100,
    category: 'Special',
    pp: 10,
    priority: 0,
    target: 'normal',
    type: 'Shadow',
    isOriginalClassic: true,
    shortDesc: '85 BP · Llamas espectrales con 20% de Quemadura (BRN).',
    dexData: {
      flags: { protect: 1, mirror: 1 },
      secondary: { chance: 20, status: 'brn' },
    },
  },
  {
    id: 'shadowchill',
    name: 'Shadow Chill',
    num: 9011,
    basePower: 85,
    accuracy: 100,
    category: 'Special',
    pp: 10,
    priority: 0,
    target: 'normal',
    type: 'Shadow',
    isOriginalClassic: true,
    shortDesc: '85 BP · Escarcha oscura con 20% de Congelación (FRZ).',
    dexData: {
      flags: { protect: 1, mirror: 1 },
      secondary: { chance: 20, status: 'frz' },
    },
  },
  {
    id: 'shadowhalf',
    name: 'Shadow Half',
    num: 9012,
    basePower: 0,
    accuracy: 100,
    category: 'Status',
    pp: 5,
    priority: 0,
    target: 'all',
    type: 'Shadow',
    isOriginalClassic: true,
    shortDesc: 'Reduce a la MITAD los PS actuales de todos en campo (bloqueado por Protect y Hada).',
    dexData: {
      flags: { bypasssub: 1 },
      ignoreImmunity: true,
      onHitField(this: any, _t: any, source: any) {
        let hitAny = false;
        for (const side of this.sides) {
          for (const mon of side.active) {
            if (!mon || mon.fainted) continue;
            if (isTargetProtected(mon)) {
              this.add('-activate', mon, 'move: Protect');
              continue;
            }
            if (isTargetShadowImmune(mon)) {
              this.add('-immune', mon);
              continue;
            }
            const cut = Math.max(1, Math.floor(mon.hp / 2));
            this.damage(cut, mon, source);
            hitAny = true;
          }
        }
        return hitAny;
      },
      secondary: null,
    },
  },
  {
    id: 'shadowshed',
    name: 'Shadow Shed',
    num: 9013,
    basePower: 0,
    accuracy: true,
    category: 'Status',
    pp: 10,
    priority: 0,
    target: 'all',
    type: 'Shadow',
    isOriginalClassic: true,
    shortDesc: 'Elimina TODAS las pantallas, Velo Aurora, Velo Sagrado y Entry Hazards del campo.',
    dexData: {
      flags: {},
      ignoreImmunity: true,
      onHitField(this: any) {
        for (const side of this.sides) {
          side.removeSideCondition('reflect');
          side.removeSideCondition('lightscreen');
          side.removeSideCondition('auroraveil');
          side.removeSideCondition('safeguard');
          side.removeSideCondition('stealthrock');
          side.removeSideCondition('spikes');
          side.removeSideCondition('toxicspikes');
          side.removeSideCondition('stickyweb');
        }
        this.add(
          '-message',
          '🌑 ¡Shadow Shed destrozó todas las pantallas y barrió todos los Entry Hazards del campo!'
        );
        return true;
      },
      secondary: null,
    },
  },
  {
    id: 'shadowhold',
    name: 'Shadow Hold',
    num: 9014,
    basePower: 0,
    accuracy: 100,
    category: 'Status',
    pp: 10,
    priority: 0,
    target: 'allAdjacentFoes',
    type: 'Shadow',
    isOriginalClassic: true,
    shortDesc: 'Atrapa a los rivales (impide cambios) y drena 1/16 PS cada turno.',
    dexData: {
      flags: { protect: 1, reflectable: 1, mirror: 1 },
      ignoreImmunity: true,
      onHit(this: any, target: any, source: any) {
        if (isTargetShadowImmune(target)) {
          this.add('-immune', target);
          return false;
        }
        target.addVolatile('trapped', source, undefined, 'trapper');
        target.addVolatile('shadowholdcurse', source);
      },
      secondary: null,
    },
  },
  {
    id: 'shadowdown',
    name: 'Shadow Down',
    num: 9015,
    basePower: 0,
    accuracy: 100,
    category: 'Status',
    pp: 10,
    priority: 0,
    target: 'allAdjacentFoes',
    type: 'Shadow',
    isOriginalClassic: true,
    shortDesc: 'Reduce -2 Defensa a los rivales adyacentes.',
    dexData: {
      flags: { protect: 1, reflectable: 1, mirror: 1 },
      ignoreImmunity: true,
      onHit(this: any, target: any, source: any) {
        if (isTargetShadowImmune(target)) {
          this.add('-immune', target);
          return false;
        }
        this.boost({ def: -2 }, target, source);
      },
      secondary: null,
    },
  },
  {
    id: 'shadowmist',
    name: 'Shadow Mist',
    num: 9016,
    basePower: 0,
    accuracy: 100,
    category: 'Status',
    pp: 10,
    priority: 0,
    target: 'allAdjacentFoes',
    type: 'Shadow',
    isOriginalClassic: true,
    shortDesc: 'Baja -2 Evasión a los rivales y rompe sus Sustitutos.',
    dexData: {
      flags: { protect: 1, reflectable: 1, mirror: 1, bypasssub: 1 },
      ignoreImmunity: true,
      onHit(this: any, target: any, source: any) {
        if (isTargetShadowImmune(target)) {
          this.add('-immune', target);
          return false;
        }
        if (target.volatiles?.substitute) {
          target.removeVolatile('substitute');
          this.add('-end', target, 'Substitute');
          this.add('-message', `🌑 ¡Shadow Mist deshizo el Sustituto de ${target.name}!`);
        }
        this.boost({ evasion: -2 }, target, source);
      },
      secondary: null,
    },
  },
  {
    id: 'shadowpanic',
    name: 'Shadow Panic',
    num: 9017,
    basePower: 0,
    accuracy: 85,
    category: 'Status',
    pp: 10,
    priority: 0,
    target: 'allAdjacentFoes',
    type: 'Shadow',
    isOriginalClassic: true,
    shortDesc: 'Ataque de sonido en área que confunde a los rivales (atraviesa Sustituto).',
    dexData: {
      flags: { protect: 1, reflectable: 1, mirror: 1, sound: 1, bypasssub: 1 },
      ignoreImmunity: true,
      onHit(this: any, target: any, source: any) {
        if (isTargetShadowImmune(target)) {
          this.add('-immune', target);
          return false;
        }
        target.addVolatile('confusion', source);
      },
      secondary: null,
    },
  },
  {
    id: 'shadowsky',
    name: 'Shadow Sky',
    num: 9018,
    basePower: 0,
    accuracy: true,
    category: 'Status',
    pp: 5,
    priority: 0,
    target: 'all',
    type: 'Shadow',
    isOriginalClassic: true,
    shortDesc: 'Invoca Cielo Oscuro (5t): Shadow ×1.3 y 1/16 PS de daño por turno a no-Oscuros.',
    dexData: {
      flags: {},
      weather: 'shadowsky',
      secondary: null,
    },
  },

  /* -------- 5 AGREED NEW GEN 9 SHADOW MOVES -------- */
  {
    id: 'shadoweclipse',
    name: 'Shadow Eclipse',
    num: 9019,
    basePower: 0,
    accuracy: true,
    category: 'Status',
    pp: 5,
    priority: 0,
    target: 'self',
    type: 'Shadow',
    isOriginalClassic: false,
    shortDesc: 'Insignia XD001: +2 Atq. Esp., +2 Def. Esp., cuesta 1/8 PS y fuerza Modo Hiper al instante.',
    dexData: {
      flags: { snatch: 1 },
      boosts: { spa: 2, spd: 2 },
      onHit(this: any, target: any) {
        if (!target || target.fainted) return;
        const cost = Math.max(1, Math.floor(target.baseMaxhp / 8));
        if (target.hp > 1) {
          this.damage(Math.min(cost, target.hp - 1), target, target, {
            id: 'shadoweclipse',
            name: 'Shadow Eclipse',
            effectType: 'Move',
          });
        }
        if (target.m?.isShadow && !target.m.hyperMode) {
          target.m.hyperMode = true;
          this.add('-start', target, 'Modo Hiper');
          this.add(
            '-message',
            `🟣⚡ ¡Shadow Eclipse forzó a ${target.name} a entrar en MODO HIPER (+2 Crítico, +15% daño Shadow)!`
          );
        }
      },
      secondary: null,
    },
  },
  {
    id: 'shadowaeroblast',
    name: 'Shadow Aeroblast',
    num: 9020,
    basePower: 95,
    accuracy: 95,
    category: 'Special',
    pp: 8,
    priority: 0,
    target: 'allAdjacentFoes',
    type: 'Shadow',
    isOriginalClassic: false,
    shortDesc: 'Insignia XD001: 95 BP de ÁREA (Viento) + Alto Crítico (+1) → ¡100% CRÍTICO en Modo Hiper!',
    dexData: {
      flags: { protect: 1, mirror: 1, wind: 1 },
      critRatio: 2,
      secondary: null,
    },
  },
  {
    id: 'shadowsiphon',
    name: 'Shadow Siphon',
    num: 9021,
    basePower: 75,
    accuracy: 100,
    category: 'Special',
    pp: 10,
    priority: 0,
    target: 'normal',
    type: 'Shadow',
    isOriginalClassic: false,
    shortDesc: '75 BP · Drena el 50% del daño infligido para sostenerte bajo Modo Hiper.',
    dexData: {
      flags: { protect: 1, mirror: 1, heal: 1 },
      drain: [1, 2],
      secondary: null,
    },
  },
  {
    id: 'shadowtear',
    name: 'Shadow Tear',
    num: 9022,
    basePower: 0,
    accuracy: 100,
    category: 'Status',
    pp: 10,
    priority: 0,
    target: 'normal',
    type: 'Shadow',
    isOriginalClassic: false,
    shortDesc: 'Desgarra el aura Hada: suprime la inmunidad 0× de Hada a Shadow por 3 turnos y baja -1 Def. Esp.',
    dexData: {
      flags: { protect: 1, reflectable: 1, mirror: 1 },
      ignoreImmunity: true,
      onHit(this: any, target: any, source: any) {
        target.addVolatile('shadowtear', source);
        this.boost({ spd: -1 }, target, source);
      },
      secondary: null,
    },
  },
  {
    id: 'shadowcataclysm',
    name: 'Shadow Cataclysm',
    num: 9023,
    basePower: 110,
    accuracy: 90,
    category: 'Physical',
    pp: 5,
    priority: 0,
    target: 'allAdjacentFoes',
    type: 'Shadow',
    isOriginalClassic: false,
    shortDesc: '110 BP de área adaptativo (Físico/Especial) · Destruye Terreno, invoca Cielo Oscuro y baja -1 Def/-1 SpD propios.',
    dexData: {
      flags: { protect: 1, mirror: 1 },
      onModifyMove(this: any, move: any, pokemon: any) {
        if (pokemon.getStat('spa', false, true) > pokemon.getStat('atk', false, true)) {
          move.category = 'Special';
        }
      },
      onAfterHit(this: any, _target: any, source: any) {
        if (this.field.terrain) {
          this.field.clearTerrain();
        }
        if (this.field.weather !== 'shadowsky') {
          this.field.setWeather('shadowsky', source);
        }
      },
      self: { boosts: { def: -1, spd: -1 } },
      secondary: null,
    },
  },
];

export const SHADOW_MOVE_MAP = new Map<string, ShadowMoveDefinition>(
  SHADOW_MOVES_CATALOG.map((m) => [m.id, m])
);

export function isShadowMoveName(moveNameOrId: string): boolean {
  return SHADOW_MOVE_MAP.has(toID(moveNameOrId));
}

export function getShadowMoveDefinition(
  moveNameOrId: string
): ShadowMoveDefinition | undefined {
  return SHADOW_MOVE_MAP.get(toID(moveNameOrId));
}

/* ============================================================================
 * 5-BAR HEART GAUGE & COLOSSEUM NATURE AFFINITY TABLE
 * ============================================================================ */

export type ShadowAffinityMethod = 'battle' | 'call' | 'chamber' | 'balanced';

export interface ShadowNatureProfile {
  nature: string;
  affinity: ShadowAffinityMethod;
  label: string;
  tip: string;
  battleMult: number;
  callMult: number;
  chamberMult: number;
  disobeyStyle: 'aggressive' | 'hesitant' | 'volatile' | 'balanced';
}

const BATTLE_NATURES = new Set([
  'adamant',
  'brave',
  'impish',
  'naughty',
  'hasty',
  'sassy',
]);
const CALL_NATURES = new Set([
  'docile',
  'lonely',
  'timid',
  'careful',
  'gentle',
  'bashful',
]);
const CHAMBER_NATURES = new Set([
  'modest',
  'relaxed',
  'calm',
  'quiet',
  'quirky',
  'lax',
  'mild',
]);

export function getShadowNatureProfile(natureName?: string): ShadowNatureProfile {
  const clean = (natureName || 'Hardy').trim();
  const key = toID(clean);
  if (BATTLE_NATURES.has(key)) {
    return {
      nature: clean,
      affinity: 'battle',
      label: '⚔️ Combate (×1.5)',
      tip: 'Su corazón se abre más rápido combatiendo en tu Equipo Activo (×1.5). En Modo Hiper tiende a embestir con furia.',
      battleMult: 1.5,
      callMult: 1.0,
      chamberMult: 0.9,
      disobeyStyle: 'aggressive',
    };
  }
  if (CALL_NATURES.has(key)) {
    return {
      nature: clean,
      affinity: 'call',
      label: '📢 Llamar (×1.6)',
      tip: 'Responde mucho mejor al comando «📢 Llamar» en combate (×1.6). En Modo Hiper suele dudar e ignorar órdenes no-Shadow.',
      battleMult: 1.0,
      callMult: 1.6,
      chamberMult: 1.0,
      disobeyStyle: 'hesitant',
    };
  }
  if (CHAMBER_NATURES.has(key)) {
    return {
      nature: clean,
      affinity: 'chamber',
      label: '🟣 Cámara XD (×1.5)',
      tip: 'Resuena especialmente rápido en la Cámara de Purificación XD (×1.5 Tempo). En Modo Hiper se vuelve errático.',
      battleMult: 0.9,
      callMult: 1.0,
      chamberMult: 1.5,
      disobeyStyle: 'volatile',
    };
  }
  return {
    nature: clean,
    affinity: 'balanced',
    label: '⚖️ Equilibrado (×1.2)',
    tip: 'Avanza a ritmo parejo peleando, usando «📢 Llamar» y en la Cámara de Purificación XD.',
    battleMult: 1.2,
    callMult: 1.25,
    chamberMult: 1.2,
    disobeyStyle: 'balanced',
  };
}

export interface ShadowUnlockState {
  heartGauge: number;
  /** 5 (81..100%) down to 0 (0%) */
  barsClosed: number;
  /** Nature hidden as '????' while 5/5 or 4/5 bars closed; revealed at <= 3/5 bars (<= 60%)! */
  natureRevealed: boolean;
  /** Max allowed EV total: 0 at 5/5..3/5 bars, 252 at 2/5 bars, 508 at 1/5..0/5 bars! */
  maxEvTotal: number;
  /** How many non-Shadow move slots are unlocked (0 at 5/5, 1 at 4/5..3/5, 4 at <=2/5). */
  unlockedNonShadowSlots: number;
  /** Probability (%) of entering Modo Hiper upon using a Shadow move. */
  hyperTriggerChance: number;
  /** Probability (%) of disobeying a NON-Shadow move while in Modo Hiper. */
  disobeyChance: number;
  /** True when XD001 Dark Lugia is on its final bar (1..20%) and requires Max Tempo in an XD Chamber! */
  requiresMaxTempoSeal: boolean;
  stageLabel: string;
  stageHint: string;
}

export function getShadowHeartBars(heartGauge = 100): number {
  const g = Math.max(0, Math.min(100, Math.floor(heartGauge)));
  if (g === 0) return 0;
  return Math.min(5, Math.ceil(g / 20));
}

export function getShadowUnlockState(
  inst: Pick<OwnedPokemonInstance, 'isShadow' | 'heartGauge' | 'species'>,
  devMode = false
): ShadowUnlockState {
  if (!inst.isShadow) {
    return {
      heartGauge: 0,
      barsClosed: 0,
      natureRevealed: true,
      maxEvTotal: 508,
      unlockedNonShadowSlots: 4,
      hyperTriggerChance: 0,
      disobeyChance: 0,
      requiresMaxTempoSeal: false,
      stageLabel: 'Purificado',
      stageHint: 'Corazón abierto.',
    };
  }

  const gauge = Math.max(0, Math.min(100, Math.floor(inst.heartGauge ?? 100)));
  const bars = getShadowHeartBars(gauge);
  const isXd001Lugia = toID(inst.species) === 'lugia';

  if (devMode) {
    return {
      heartGauge: gauge,
      barsClosed: bars,
      natureRevealed: true,
      maxEvTotal: 508,
      unlockedNonShadowSlots: 4,
      hyperTriggerChance:
        bars >= 5 ? 45 : bars === 4 ? 35 : bars === 3 ? 25 : bars === 2 ? 15 : bars === 1 ? 10 : 5,
      disobeyChance:
        bars >= 5 ? 55 : bars === 4 ? 42 : bars === 3 ? 30 : bars === 2 ? 18 : bars === 1 ? 10 : 5,
      requiresMaxTempoSeal: false,
      stageLabel: `${bars}/5 barras [DEV]`,
      stageHint: 'Dev Mode omite bloqueos de EVs/Naturaleza y permite purificar en cualquier momento.',
    };
  }

  const labels: Record<number, { label: string; hint: string }> = {
    5: {
      label: '5/5 Sellado Total',
      hint: 'Naturaleza oculta (????), EVs sellados en 0 y solo ataques Shadow utilizables.',
    },
    4: {
      label: '4/5 Primera Grieta',
      hint: '1.er slot de movimiento normal desbloqueado. Naturaleza sigue oculta y EVs en 0.',
    },
    3: {
      label: '3/5 Naturaleza Revelada',
      hint: '¡Naturaleza y afinidad reveladas! Baja a 2/5 para liberar EVs y el resto del moveset.',
    },
    2: {
      label: '2/5 Corazón Flexible',
      hint: 'Todos los slots normales libres + entrenamiento parcial de EVs (hasta 252 EVs totales).',
    },
    1: {
      label: isXd001Lugia ? '1/5 Sello XD001 (Tempo Máx)' : '1/5 Umbral Táctico',
      hint: isXd001Lugia
        ? '¡Última barra de XD001! Logra Tempo Máximo en la Cámara de Purificación para romper el sello a 0%.'
        : 'Punto dulce si quieres dejarlo Oscuro: baja desobediencia y 508 EVs completos desbloqueados.',
    },
    0: {
      label: '0/5 Puerta Abierta',
      hint: '¡Listo para ✨ Purificar (opcional) o conservar Oscuro para siempre con 508 EVs!',
    },
  };

  return {
    heartGauge: gauge,
    barsClosed: bars,
    natureRevealed: bars <= 3,
    maxEvTotal: bars >= 3 ? 0 : bars === 2 ? 252 : 508,
    unlockedNonShadowSlots: bars >= 5 ? 0 : bars >= 3 ? 1 : 4,
    hyperTriggerChance:
      bars >= 5 ? 45 : bars === 4 ? 35 : bars === 3 ? 25 : bars === 2 ? 15 : bars === 1 ? 10 : 5,
    disobeyChance:
      bars >= 5 ? 55 : bars === 4 ? 42 : bars === 3 ? 30 : bars === 2 ? 18 : bars === 1 ? 10 : 5,
    requiresMaxTempoSeal: isXd001Lugia && gauge > 0 && gauge <= 20,
    stageLabel: labels[bars].label,
    stageHint: labels[bars].hint,
  };
}

/* ============================================================================
 * POKÉMON XD PURIFICATION CHAMBER: FLOW & TEMPO RING SOLVER
 * ============================================================================ */

export interface ChamberEdgeEval {
  fromIdx: number;
  toIdx: number;
  outcome: 'super' | 'neutral' | 'resist' | 'empty';
  points: number;
}

export interface ChamberFlowTempoResult {
  filledRingCount: number;
  edges: ChamberEdgeEval[];
  rawClockwiseScore: number;
  flow: number;
  centralFactor: number;
  isPerfectSet: boolean;
  tempo: number;
  isMaxTempo: boolean;
  baseHeartDropPerBattle: number;
  effectiveHeartDropPerBattle: number;
}

function getTypesForSpecies(speciesName: string): string[] {
  const sp = Dex.species.get(speciesName);
  return sp.exists && sp.types.length > 0 ? [...sp.types] : ['Normal'];
}

/**
 * Authentic Pokémon XD pairwise type advantage:
 * - Normal counts as Super Effective (+6) against Normal!
 * - Dual types prioritize weakness (+6) over neutral (0) over resist/immune (-3).
 */
export function evaluateXdTypeMatchup(
  attackerTypes: string[],
  defenderTypes: string[]
): { outcome: 'super' | 'neutral' | 'resist'; points: number; mult: number } {
  if (attackerTypes.includes('Normal') && defenderTypes.includes('Normal')) {
    return { outcome: 'super', points: 6, mult: 4 / 3 };
  }
  let hasSuper = false;
  let hasNeutral = false;
  for (const atkType of attackerTypes) {
    if (!Dex.getImmunity(atkType, defenderTypes)) {
      continue;
    }
    const eff = Dex.getEffectiveness(atkType, defenderTypes);
    if (eff > 0) {
      hasSuper = true;
      break;
    }
    if (eff === 0) {
      hasNeutral = true;
    }
  }
  if (hasSuper) return { outcome: 'super', points: 6, mult: 4 / 3 };
  if (hasNeutral) return { outcome: 'neutral', points: 0, mult: 1 };
  return { outcome: 'resist', points: -3, mult: 2 / 3 };
}

export function computeChamberFlowAndTempo(
  shadowMon: Pick<OwnedPokemonInstance, 'species' | 'nature'> | null | undefined,
  ringMons: Array<Pick<OwnedPokemonInstance, 'species'> | null | undefined>
): ChamberFlowTempoResult {
  const slots = [0, 1, 2, 3].map((i) => ringMons[i] ?? null);
  const filledIndices = [0, 1, 2, 3].filter((i) => slots[i] !== null);
  const filledRingCount = filledIndices.length;

  const edges: ChamberEdgeEval[] = [];
  let sumClockwise = 0;
  for (let i = 0; i < 4; i++) {
    const nextIdx = (i + 1) % 4;
    const a = slots[i];
    const b = slots[nextIdx];
    if (!a || !b) {
      edges.push({ fromIdx: i, toIdx: nextIdx, outcome: 'empty', points: 0 });
    } else {
      const ev = evaluateXdTypeMatchup(
        getTypesForSpecies(a.species),
        getTypesForSpecies(b.species)
      );
      edges.push({
        fromIdx: i,
        toIdx: nextIdx,
        outcome: ev.outcome,
        points: ev.points,
      });
      sumClockwise += ev.points;
    }
  }

  // XD rule: completing all 4 outer ring slots doubles the clockwise flow score (max 4 * 6 * 2 = 48)!
  const rawClockwiseScore =
    filledRingCount === 4 ? sumClockwise * 2 : sumClockwise;
  const flow = Math.max(0, Math.min(100, Math.round((rawClockwiseScore / 48) * 100)));

  let centralFactor = 1;
  if (shadowMon && filledRingCount > 0) {
    const shadowTypes = getTypesForSpecies(shadowMon.species);
    let multSum = 0;
    for (const idx of filledIndices) {
      const m = slots[idx]!;
      multSum += evaluateXdTypeMatchup(getTypesForSpecies(m.species), shadowTypes).mult;
    }
    centralFactor = multSum / filledRingCount;
  }

  // Perfect Set bonus: 4 ring mons + 1 central Shadow with ZERO repeated types among all 5 Pokémon!
  let isPerfectSet = false;
  if (shadowMon && filledRingCount === 4) {
    const seenTypes = new Set<string>();
    let duplicate = false;
    for (const t of getTypesForSpecies(shadowMon.species)) {
      if (seenTypes.has(t)) duplicate = true;
      seenTypes.add(t);
    }
    for (const m of slots) {
      if (!m) continue;
      for (const t of getTypesForSpecies(m.species)) {
        if (seenTypes.has(t)) duplicate = true;
        seenTypes.add(t);
      }
    }
    isPerfectSet = !duplicate;
  }

  const perfectBonus = isPerfectSet ? 12 : 0;
  const tempo =
    filledRingCount === 0
      ? 0
      : Math.max(
          0,
          Math.min(100, Math.round(flow * centralFactor + perfectBonus))
        );

  const allFourSuper =
    filledRingCount === 4 && edges.every((e) => e.outcome === 'super');
  const isMaxTempo = allFourSuper && tempo >= 90;

  // Base Heart Gauge drop per battle: 10 (empty chamber) up to 45 at Tempo 100!
  const baseHeartDropPerBattle =
    filledRingCount === 0 ? 10 : Math.round(12 + (tempo / 100) * 33);
  const natureProfile = getShadowNatureProfile(shadowMon?.nature);
  const effectiveHeartDropPerBattle = Math.max(
    8,
    Math.round(baseHeartDropPerBattle * natureProfile.chamberMult)
  );

  return {
    filledRingCount,
    edges,
    rawClockwiseScore,
    flow,
    centralFactor: Number(centralFactor.toFixed(2)),
    isPerfectSet,
    tempo,
    isMaxTempo,
    baseHeartDropPerBattle,
    effectiveHeartDropPerBattle,
  };
}

/**
 * Fast XD Ring Optimizer: searches the player's available non-Shadow candidates to
 * assemble up to 4 clockwise partners maximizing Flow & Tempo (targeting Max Tempo!).
 * Deduplicates candidates by type signature so even a 1,286-mon Living Dex runs in <5ms!
 */
export function autoOptimizeChamberRing(
  shadowMon: OwnedPokemonInstance,
  availableCandidates: OwnedPokemonInstance[]
): [string | null, string | null, string | null, string | null] {
  const valid = availableCandidates.filter(
    (c) => !c.isShadow && c.zone !== 'graveyard' && c.uid !== shadowMon.uid
  );
  if (valid.length === 0) return [null, null, null, null];

  // Keep up to 2 representatives per unique type signature (allows Normal-Normal loops!)
  const bucketCounts = new Map<string, number>();
  const reps: Array<{ mon: OwnedPokemonInstance; types: string[] }> = [];
  for (const mon of valid) {
    const types = getTypesForSpecies(mon.species);
    const sig = [...types].sort().join('/');
    const cur = bucketCounts.get(sig) ?? 0;
    const cap = sig === 'Normal' ? 4 : 2;
    if (cur < cap) {
      bucketCounts.set(sig, cur + 1);
      reps.push({ mon, types });
    }
  }

  // Sort representatives by their central matchup against the Shadow Pokémon (SE first!)
  const shadowTypes = getTypesForSpecies(shadowMon.species);
  reps.sort((a, b) => {
    const ma = evaluateXdTypeMatchup(a.types, shadowTypes).mult;
    const mb = evaluateXdTypeMatchup(b.types, shadowTypes).mult;
    return mb - ma;
  });

  const pool = reps.slice(0, 32);
  const n = pool.length;

  // Precompute pairwise SE matrix + central multipliers once (O(1) per quad -> <1ms even on 1,286 Living Dex!)
  const edgeScore: number[][] = Array.from({ length: n }, () => Array(n).fill(0));
  const centralMults: number[] = new Array(n).fill(1);
  for (let i = 0; i < n; i++) {
    centralMults[i] = evaluateXdTypeMatchup(pool[i].types, shadowTypes).mult;
    for (let j = 0; j < n; j++) {
      if (i === j) continue;
      edgeScore[i][j] = evaluateXdTypeMatchup(pool[i].types, pool[j].types).points;
    }
  }

  if (n < 4) {
    const out: [string | null, string | null, string | null, string | null] = [
      null,
      null,
      null,
      null,
    ];
    for (let i = 0; i < n; i++) out[i] = pool[i].mon.uid;
    return out;
  }

  const seNeighbors: number[][] = Array.from({ length: n }, (_, i) => {
    const list: number[] = [];
    for (let j = 0; j < n; j++) {
      if (i !== j && edgeScore[i][j] === 6) list.push(j);
    }
    return list;
  });

  let bestRing: [number, number, number, number] = [0, 1, 2, 3];
  let bestScore = -9999;

  const evalQuadFast = (a: number, b: number, c: number, d: number): number => {
    const sumEdges = edgeScore[a][b] + edgeScore[b][c] + edgeScore[c][d] + edgeScore[d][a];
    const allSe =
      edgeScore[a][b] === 6 &&
      edgeScore[b][c] === 6 &&
      edgeScore[c][d] === 6 &&
      edgeScore[d][a] === 6;
    const flow = Math.max(0, Math.min(100, Math.round(((sumEdges * 2) / 48) * 100)));
    const avgCentral =
      (centralMults[a] + centralMults[b] + centralMults[c] + centralMults[d]) / 4;
    // Fast duplicate-type check for Perfect Set bonus
    const seen = new Set<string>(shadowTypes);
    let perfect = true;
    for (const idx of [a, b, c, d]) {
      for (const t of pool[idx].types) {
        if (seen.has(t)) {
          perfect = false;
          break;
        }
        seen.add(t);
      }
      if (!perfect) break;
    }
    const tempo = Math.max(
      0,
      Math.min(100, Math.round(flow * avgCentral + (perfect ? 12 : 0)))
    );
    const isMax = allSe && tempo >= 90;
    return (isMax ? 1000 : 0) + tempo * 10 + (perfect ? 50 : 0);
  };

  // Phase 1: Search pure SE 4-cycles (a -> b -> c -> d -> a) for guaranteed Max Tempo!
  let checked = 0;
  outer: for (let a = 0; a < Math.min(n, 24); a++) {
    for (const b of seNeighbors[a]) {
      if (b === a) continue;
      for (const c of seNeighbors[b]) {
        if (c === a || c === b) continue;
        for (const d of seNeighbors[c]) {
          if (d === a || d === b || d === c) continue;
          if (edgeScore[d][a] !== 6) continue;
          const sc = evalQuadFast(a, b, c, d);
          if (sc > bestScore) {
            bestScore = sc;
            bestRing = [a, b, c, d];
            if (bestScore >= 2050) break outer;
          }
          if (++checked > 600) break outer;
        }
      }
    }
  }

  // Phase 2: Fallback greedy search if player doesn't yet have a full 4-cycle of SE types
  if (bestScore < 1000) {
    const limit = Math.min(n, 16);
    for (let a = 0; a < limit; a++) {
      for (let b = 0; b < limit; b++) {
        if (b === a) continue;
        let bestC = -1;
        let bestCVal = -999;
        for (let c = 0; c < limit; c++) {
          if (c === a || c === b) continue;
          if (edgeScore[b][c] > bestCVal) {
            bestCVal = edgeScore[b][c];
            bestC = c;
          }
        }
        if (bestC === -1) continue;
        let bestD = -1;
        let bestDVal = -999;
        for (let d = 0; d < limit; d++) {
          if (d === a || d === b || d === bestC) continue;
          const v = edgeScore[bestC][d] + edgeScore[d][a];
          if (v > bestDVal) {
            bestDVal = v;
            bestD = d;
          }
        }
        if (bestD === -1) continue;
        const sc = evalQuadFast(a, b, bestC, bestD);
        if (sc > bestScore) {
          bestScore = sc;
          bestRing = [a, b, bestC, bestD];
        }
      }
    }
  }

  return [
    pool[bestRing[0]].mon.uid,
    pool[bestRing[1]].mon.uid,
    pool[bestRing[2]].mon.uid,
    pool[bestRing[3]].mon.uid,
  ];
}

/* ============================================================================
 * @pkmn/sim RUNTIME INJECTION (Shadow Type, Fairy Immunity + Shadow Tear,
 * 23 Calibrated Shadow Moves, `shadowcall` (`📢 Llamar`), Shadow Sky ×1.3,
 * Hyper/Reverse Mode + Nature Disobedience & Let's Go Power of Friendship!)
 * ============================================================================ */

const INJECTED_DEXES = new WeakSet<object>();

export function ensureShadowDexRegistered(dexLike?: unknown): void {
  const targets: any[] = [];
  if (dexLike && typeof dexLike === 'object') {
    targets.push(dexLike);
  } else {
    targets.push(Dex);
    try {
      targets.push(Dex.forFormat('gen9doublescustomgame@@@NatDex Mod'));
      targets.push(Dex.forFormat('gen9customgame@@@NatDex Mod'));
      targets.push(Dex.forFormat('gen9doublescustomgame'));
      targets.push(Dex.forFormat('gen9customgame'));
    } catch {
      // ignore unavailable formats
    }
  }

  for (const d of targets) {
    if (!d || typeof d !== 'object' || INJECTED_DEXES.has(d)) continue;
    if (!d.data) continue;
    INJECTED_DEXES.add(d);

    // 1. Register Shadow Type & Fairy 0× Immunity (`damageTaken.Shadow = 3` on Fairy!)
    if (d.data.TypeChart) {
      for (const [typeKey, typeEntry] of Object.entries<any>(d.data.TypeChart)) {
        if (typeEntry && typeEntry.damageTaken) {
          typeEntry.damageTaken.Shadow = typeKey === 'fairy' ? 3 : 0;
        }
      }
      d.data.TypeChart.shadow = {
        damageTaken: {
          Shadow: 2,
          Fairy: 1,
        },
      };
      d.types?.typeCache?.clear?.();
    }

    // 2. Register all 23 Calibrated Shadow Moves + internal `shadowcall` (`Llamar`) action!
    if (d.data.Moves) {
      for (const m of SHADOW_MOVES_CATALOG) {
        d.data.Moves[m.id] = {
          num: m.num,
          accuracy: m.accuracy,
          basePower: m.basePower,
          category: m.category,
          name: m.name,
          pp: m.pp,
          noPPBoosts: true,
          priority: m.priority,
          target: m.target,
          type: 'Shadow',
          shortDesc: m.shortDesc,
          ...m.dexData,
        };
      }

      // Dedicated Colosseum / XD `📢 Llamar` (`shadowcall`) priority +6 action!
      // NOTE: `name` MUST be 'Shadow Call' so @pkmn/sim's DataMove computes `move.id = toID('Shadow Call') = 'shadowcall'`!
      d.data.Moves.shadowcall = {
        num: 9099,
        accuracy: true,
        basePower: 0,
        category: 'Status',
        name: 'Shadow Call',
        pp: 99,
        noPPBoosts: true,
        priority: 6,
        target: 'self',
        type: 'Normal',
        flags: {},
        shortDesc:
          'Comando táctico Colosseum/XD: saca 100% del Modo Hiper, despierta del Sueño, cura Confusión y abre el Medidor de Corazón.',
        onHit(this: any, target: any) {
          if (!target || target.fainted) return;
          const effects: string[] = [];
          if (target.m?.hyperMode) {
            target.m.hyperMode = false;
            this.add('-end', target, 'Modo Hiper');
            effects.push('salió del Modo Hiper');
          }
          if (target.status === 'slp') {
            target.cureStatus();
            effects.push('despertó');
          }
          if (target.volatiles?.confusion) {
            target.removeVolatile('confusion');
            this.add('-end', target, 'confusion');
            effects.push('recuperó la lucidez');
          }
          target.m.shadowCallCount = (target.m.shadowCallCount ?? 0) + 1;
          const detail =
            effects.length > 0
              ? ` (${effects.join(', ')})`
              : ' (su corazón se abrió un poco más)';
          this.add(
            '-message',
            `📢 ¡Llamaste a ${target.name}! Volvió en sí${detail}.`
          );
        },
        secondary: null,
      };

      d.moves?.moveCache?.clear?.();
    }

    // 3. Register Shadow Sky Weather (×1.3), Shadow Tear volatile, Shadow Hold Curse volatile, & Core Engine!
    if (d.data.Conditions) {
      d.data.Conditions.shadowsky = {
        name: 'ShadowSky',
        effectType: 'Weather',
        duration: 5,
        onBasePowerPriority: 22,
        onBasePower(this: any, _bp: number, _attacker: any, _defender: any, move: any) {
          if (move?.type === 'Shadow') {
            return this.chainModify(1.3);
          }
        },
        onFieldStart(this: any, _field: any, _source: any, effect: any) {
          if (effect?.effectType === 'Ability') {
            this.add('-weather', 'ShadowSky', '[from] ability: ' + effect.name);
          } else {
            this.add('-weather', 'ShadowSky');
          }
        },
        onFieldResidualOrder: 1,
        onFieldResidual(this: any) {
          this.add('-weather', 'ShadowSky', '[upkeep]');
          this.eachEvent('Weather');
        },
        onWeather(this: any, target: any) {
          if (!target?.m?.isShadow) {
            this.damage(Math.max(1, Math.floor(target.baseMaxhp / 16)));
          }
        },
        onFieldEnd(this: any) {
          this.add('-weather', 'none');
        },
      };

      // Shadow Tear volatile: suppresses Fairy 0× immunity to Shadow for 3 turns!
      d.data.Conditions.shadowtear = {
        name: 'Shadow Tear',
        duration: 3,
        onStart(this: any, target: any) {
          this.add('-start', target, 'Shadow Tear');
          this.add(
            '-message',
            `🟣⚔️ ¡El aura Hada de ${target.name} se desgarró! Su inmunidad a Shadow queda anulada por 3 turnos.`
          );
        },
        onNegateImmunity(this: any, _pokemon: any, type: string) {
          if (type === 'Shadow') return false;
        },
        onEnd(this: any, target: any) {
          this.add('-end', target, 'Shadow Tear');
        },
      };

      // Shadow Hold residual curse: 1/16 max HP per turn while trapped
      d.data.Conditions.shadowholdcurse = {
        name: 'Shadow Hold',
        onStart(this: any, target: any) {
          this.add('-start', target, 'Shadow Hold');
        },
        onResidualOrder: 13,
        onResidual(this: any, pokemon: any) {
          if (!pokemon.volatiles?.trapped) {
            pokemon.removeVolatile('shadowholdcurse');
            return;
          }
          this.damage(Math.max(1, Math.floor(pokemon.baseMaxhp / 16)), pokemon);
        },
      };

      // Unified Shadow Effectiveness + Hyper/Reverse Mode + Nature Disobedience + Call + Power of Friendship!
      d.data.Conditions.shadowaffectioncore = {
        name: 'ShadowAffectionCore',
        effectType: 'Condition',
        duration: 999,
        // Exact Colosseum/XD effectiveness:
        // - 0× vs Fairy (UNLESS `shadowtear` is active, which drops Fairy immunity -> 2× SE!)
        // - 0.5× vs Shadow Pokémon
        // - 2× vs ALL other non-Shadow Pokémon!
        onEffectiveness(
          this: any,
          _typeMod: number,
          target: any,
          type: string,
          move: any
        ) {
          if (!move || move.type !== 'Shadow' || !target) return;
          if (target.hasType('Fairy') && !target.volatiles?.shadowtear) return;
          const isPrimarySlot = type === target.types?.[0];
          if (target.m?.isShadow) {
            return isPrimarySlot ? -1 : 0;
          }
          return isPrimarySlot ? 1 : 0;
        },
        // Hyper/Reverse Mode: +15% power on Shadow moves!
        onBasePowerPriority: 21,
        onBasePower(this: any, _bp: number, attacker: any, _defender: any, move: any) {
          if (attacker?.m?.isShadow && attacker.m?.hyperMode && move?.type === 'Shadow') {
            return this.chainModify(1.15);
          }
        },
        // Hyper Mode (+2 Crit stages -> 100% Crit on High-Crit Shadow Blast & Shadow Aeroblast!)
        // AND Drama Crits (+1 Crit for High-Bond Affection <25% HP!)
        onModifyCritRatio(this: any, critRatio: number, source: any) {
          if (!source) return critRatio;
          if (source.m?.isShadow && source.m?.hyperMode) {
            return critRatio + 2;
          }
          const cfg = this.field?.pseudoWeather?.shadowaffectioncore;
          const affMode: AffectionMode = cfg?.affectionMode ?? 'off';
          if (
            affMode !== 'off' &&
            source.side?.id === 'p1' &&
            !source.m?.isShadow &&
            source.hp > 0 &&
            source.hp * 4 <= source.maxhp &&
            (affMode === 'classic-rng' || source.m?.highBond)
          ) {
            return critRatio + 1;
          }
          return critRatio;
        },
        // Block healing items / berries while raging in Modo Hiper!
        onTryHeal(this: any, _damage: number, target: any, _source: any, effect: any) {
          if (
            target?.m?.isShadow &&
            target.m?.hyperMode &&
            effect?.effectType === 'Item'
          ) {
            this.add(
              '-message',
              `🟣🚫 ¡${target.name} en Modo Hiper rechazó la curación de ${effect.name}!`
            );
            return false;
          }
        },
        onTryEatItem(this: any, _item: any, pokemon: any) {
          if (pokemon?.m?.isShadow && pokemon.m?.hyperMode) {
            this.add(
              '-message',
              `🟣🚫 ¡${pokemon.name} está en Modo Hiper y se niega a comer su baya!`
            );
            return false;
          }
        },
        // 1) Priority 12: Ensure `shadowcall` (`📢 Llamar`) wakes from Sleep & cures Confusion BEFORE slp/confusion block it!
        // 2) Nature-driven Disobedience ONLY on NON-Shadow moves while in Modo Hiper!
        onBeforeMovePriority: 12,
        onBeforeMove(this: any, pokemon: any, _target: any, move: any) {
          if (!pokemon || !move) return;
          if (move.id === 'shadowcall') {
            if (pokemon.status === 'slp') {
              pokemon.cureStatus();
            }
            if (pokemon.volatiles?.confusion) {
              pokemon.removeVolatile('confusion');
              this.add('-end', pokemon, 'confusion');
            }
            return;
          }

          if (
            pokemon.m?.isShadow &&
            pokemon.m?.hyperMode &&
            move.type !== 'Shadow' &&
            move.id !== 'struggle'
          ) {
            const cfg = this.field?.pseudoWeather?.shadowaffectioncore;
            const heart = typeof pokemon.m.heartGauge === 'number' ? pokemon.m.heartGauge : 100;
            const unlock = getShadowUnlockState({
              isShadow: true,
              heartGauge: heart,
              species: pokemon.species?.name || pokemon.name,
            });
            const roll = cfg?.shadowForceDisobey ? 0 : this.random(100);
            if (roll < unlock.disobeyChance) {
              const natureProf = getShadowNatureProfile(pokemon.set?.nature);
              if (natureProf.disobeyStyle === 'aggressive') {
                this.add(
                  '-message',
                  `🟣💢 ¡${pokemon.name} ignoró tus órdenes en Modo Hiper y se lanzó furioso hacia el entrenador rival!`
                );
              } else if (natureProf.disobeyStyle === 'volatile') {
                this.add(
                  '-message',
                  `🟣💢 ¡${pokemon.name} ignoró tus órdenes en Modo Hiper y atacó a su propio entrenador!`
                );
                this.damage(
                  Math.max(1, Math.floor(pokemon.baseMaxhp / 16)),
                  pokemon,
                  pokemon,
                  { id: 'hypermode', name: 'Modo Hiper', effectType: 'Condition' }
                );
              } else if (natureProf.disobeyStyle === 'hesitant') {
                this.add(
                  '-message',
                  `🟣💢 ¡${pokemon.name} ignoró tus órdenes en Modo Hiper y se negó a usar ${move.name}! (Usa 📢 Llamar para calmarlo)`
                );
              } else {
                this.add(
                  '-message',
                  `🟣💢 ¡${pokemon.name} desobedeció en Modo Hiper! Los ataques Shadow siempre obedecen, o usa 📢 Llamar.`
                );
              }
              return false;
            }
          }
        },
        // Trigger Modo Hiper on Shadow move execution (chance scales by closed Heart Gauge bars; Shadow Rush gets +20%!)
        onAfterMoveSecondarySelf(this: any, source: any, _target: any, move: any) {
          if (!source || source.fainted || !source.m?.isShadow) return;
          if (!move || move.type !== 'Shadow' || source.m.hyperMode) return;
          if (move.id === 'shadoweclipse') return; // already forced inside Shadow Eclipse onHit

          const cfg = this.field?.pseudoWeather?.shadowaffectioncore;
          const heart = typeof source.m.heartGauge === 'number' ? source.m.heartGauge : 100;
          const unlock = getShadowUnlockState({
            isShadow: true,
            heartGauge: heart,
            species: source.species?.name || source.name,
          });
          const bonus = move.id === 'shadowrush' ? 20 : 0;
          const chance = Math.min(90, unlock.hyperTriggerChance + bonus);
          const roll = cfg?.shadowForceHyper ? 0 : this.random(100);
          if (roll < chance) {
            source.m.hyperMode = true;
            this.add('-start', source, 'Modo Hiper');
            this.add(
              '-message',
              `🟣⚡ ¡${source.name} entró en MODO HIPER! (+2 Crítico, +15% daño Shadow · -1/12 PS/turno · desobedece ataques normales · usa 📢 Llamar para calmarlo)`
            );
          }
        },
        // Power of Friendship (Let's Go!) — Endure lethal blow at 1 HP (STRICTLY blocked on Shadow Pokémon!)
        onDamagePriority: -40,
        onDamage(this: any, damage: number, target: any, _source: any, effect: any) {
          if (!target || target.side?.id !== 'p1') return;
          if (target.m?.isShadow) return;
          if (!effect || effect.effectType !== 'Move') return;
          if (damage < target.hp || target.hp <= 1) return;

          const cfg = this.field?.pseudoWeather?.shadowaffectioncore;
          const affMode: AffectionMode = cfg?.affectionMode ?? 'off';
          if (affMode === 'off') return;

          if (affMode === 'tactical-limited') {
            if (!target.m?.highBond) return;
            if (cfg.tacticalEndureUsed) return;
            cfg.tacticalEndureUsed = true;
            this.add(
              '-message',
              `💖 ¡VÍNCULO REAL! ¡${target.name} aguantó con 1 PS para no ponerte triste! (Carga táctica 1/1)`
            );
            return target.hp - 1;
          }

          if (affMode === 'classic-rng') {
            const roll = cfg.forceProc ? 0 : this.random(100);
            if (roll < 22 && !target.m?.classicEndureUsed) {
              target.m.classicEndureUsed = true;
              this.add(
                '-message',
                `💖 ¡Afecto! ¡${target.name} aguantó el golpe con 1 PS porque te quiere mucho!`
              );
              return target.hp - 1;
            }
          }
        },
        // End-of-turn Field Residual (runs ONCE per turn across the whole field!):
        // - Hyper/Reverse Mode 1/12 max HP pain
        // - Affection status shake-off for non-Shadow Pokémon!
        onFieldResidualOrder: 26,
        onFieldResidualSubOrder: 5,
        onFieldResidual(this: any) {
          const cfg = this.field?.pseudoWeather?.shadowaffectioncore;
          const affMode: AffectionMode = cfg?.affectionMode ?? 'off';

          for (const side of this.sides) {
            for (const mon of side.active) {
              if (!mon || mon.fainted) continue;

              // 1) Shadow Pokémon Hyper/Reverse Mode: 1/12 max HP recoil per turn
              if (mon.m?.isShadow) {
                if (mon.m.hyperMode && !mon.fainted) {
                  const recoil = Math.max(1, Math.floor(mon.baseMaxhp / 12));
                  this.damage(recoil, mon, mon, {
                    id: 'hypermode',
                    name: 'Modo Hiper',
                    effectType: 'Condition',
                  });
                }
                continue;
              }

              // 2) Power of Friendship — Shake off status condition!
              if (affMode !== 'off' && side.id === 'p1' && mon.status && !mon.fainted) {
                if (affMode === 'tactical-limited') {
                  if (mon.m?.highBond && !cfg.tacticalCureUsed) {
                    cfg.tacticalCureUsed = true;
                    const oldStatus = mon.status.toUpperCase();
                    mon.cureStatus();
                    this.add(
                      '-message',
                      `💖 ¡VÍNCULO REAL! ¡${mon.name} se sacudió ${oldStatus} por pura fuerza de voluntad! (Cura táctica 1/1)`
                    );
                  }
                } else if (affMode === 'classic-rng') {
                  const roll = cfg.forceProc ? 0 : this.random(100);
                  if (roll < 20) {
                    const oldStatus = mon.status.toUpperCase();
                    mon.cureStatus();
                    this.add(
                      '-message',
                      `💖 ¡Afecto! ¡${mon.name} se curó de ${oldStatus} para que no te preocupes!`
                    );
                  }
                }
              }
            }
          }
        },
      };

      d.conditions?.conditionCache?.clear?.();
    }
  }
}

/**
 * Inspects a Showdown paste and returns all species that carry at least one Shadow move.
 * Used both for battle Shadow-aura detection AND automatic Shadow Snagging on victory!
 */
export function detectShadowSpeciesInPaste(paste: string): Array<{
  species: string;
  moves: string[];
  ability: string;
  item: string;
  nature: string;
  teraType: string;
}> {
  ensureShadowDexRegistered();
  const sets = Teams.import(paste) ?? [];
  const result: Array<{
    species: string;
    moves: string[];
    ability: string;
    item: string;
    nature: string;
    teraType: string;
  }> = [];
  for (const s of sets) {
    if (!s.species || s.name === '__EMPTY__') continue;
    const hasShadowMove = (s.moves ?? []).some((mv) => isShadowMoveName(mv));
    const isTaggedShadow =
      (s.name ?? '').toLowerCase().includes('oscuro') ||
      (s.name ?? '').toLowerCase().includes('shadow') ||
      (s.name ?? '').toLowerCase().includes('xd001');
    if (hasShadowMove || isTaggedShadow) {
      result.push({
        species: s.species,
        moves: [...(s.moves ?? [])],
        ability: s.ability || '',
        item: s.item || '',
        nature: s.nature || 'Timid',
        teraType: s.teraType || 'Dark',
      });
    }
  }
  return result;
}

/**
 * Determines whether a player's `OwnedPokemonInstance` has High Bond (eligible for Tactical
 * Affection in Difícil/Tryhard/Nuzlocke).
 * - Shadow Pokémon: NEVER (Closed Heart Lock!).
 * - Freshly bought Black Market "Excel" Shop Pokémon: NOT yet.
 * - Starters (`Escolta Real`), R3 House Allies (`Casa ·`), Chapter Rewards (`Recompensa ·`),
 *   and Purified Ex-Shadow Pokémon (`purifiedAt`): HIGH BOND!
 */
export function isInstanceHighBond(inst: OwnedPokemonInstance): boolean {
  if (inst.isShadow) return false;
  if (inst.purifiedAt) return true;
  const orig = (inst.origin || '').toLowerCase();
  return (
    orig.includes('escolta') ||
    orig.includes('casa') ||
    orig.includes('recompensa') ||
    orig.includes('purificado')
  );
}

/**
 * Builds the `ShadowBattleMeta` payload for a player's campaign/romance battle from their profile
 * and chosen difficulty mode (including exact Heart Gauge values per Shadow Pokémon!).
 */
export function buildShadowAndAffectionMetaForProfile(
  profile: PlayerSaveProfile,
  difficultyMode: BattleDifficultyMode,
  rivalPaste: string,
  playerPaste: string,
  existing?: ShadowBattleMeta
): ShadowBattleMeta {
  const affectionMode: AffectionMode =
    existing?.affectionMode ??
    (difficultyMode === 'baby' || difficultyMode === 'standard'
      ? 'classic-rng'
      : 'tactical-limited');

  const p1PartyShadows = profile.pokemonBox.filter(
    (b) => b.zone === 'party' && b.isShadow
  );
  const p1HeartBySpecies: Record<string, number> = {
    ...(existing?.p1ShadowHeartBySpecies ?? {}),
  };
  for (const sh of p1PartyShadows) {
    p1HeartBySpecies[toID(sh.species)] = sh.heartGauge ?? 100;
  }

  const p1PasteShadow = detectShadowSpeciesInPaste(playerPaste).map((s) => s.species);
  const p1ShadowSpecies = Array.from(
    new Set([
      ...(existing?.p1ShadowSpecies ?? []),
      ...p1PartyShadows.map((b) => b.species),
      ...p1PasteShadow,
    ])
  );

  const p2PasteShadow = detectShadowSpeciesInPaste(rivalPaste).map((s) => s.species);
  const p2ShadowSpecies = Array.from(
    new Set([...(existing?.p2ShadowSpecies ?? []), ...p2PasteShadow])
  );

  const p1HighBondSpecies = Array.from(
    new Set([
      ...(existing?.p1HighBondSpecies ?? []),
      ...profile.pokemonBox
        .filter((b) => b.zone === 'party' && isInstanceHighBond(b))
        .map((b) => b.species),
      ...(!profile.useCustomTeamInStory
        ? ['Arcanine', 'Gardevoir', 'Corviknight', 'Milotic', 'Dragapult', 'Kingambit', 'Sylveon']
        : []),
    ])
  );

  return {
    p1ShadowSpecies,
    p2ShadowSpecies,
    p1ShadowHeartBySpecies: p1HeartBySpecies,
    p2ShadowHeartBySpecies: existing?.p2ShadowHeartBySpecies,
    affectionMode,
    p1HighBondSpecies,
    affectionForceProc: existing?.affectionForceProc,
    shadowForceHyper: existing?.shadowForceHyper,
    shadowForceDisobey: existing?.shadowForceDisobey,
  };
}

/**
 * Computes a competitive Purified moveset when the player deliberately chooses to purify a
 * Shadow Pokémon whose Heart Gauge reached 0 (e.g., XD001 Lugia receives Psycho Boost!).
 */
export function buildPurifiedMovesetForSpecies(
  species: string,
  currentMoves: string[]
): { moves: string[]; signatureGift: string } {
  const spKey = toID(species);
  if (spKey === 'lugia') {
    return {
      moves: ['Aeroblast', 'Psycho Boost', 'Calm Mind', 'Recover'],
      signatureGift: 'Psycho Boost (Exclusivo XD001 Purificado)',
    };
  }
  if (spKey === 'articuno') {
    return {
      moves: ['Freeze-Dry', 'Hurricane', 'Heal Bell', 'Roost'],
      signatureGift: 'Heal Bell (Exclusivo XD Purificado)',
    };
  }
  if (spKey === 'zapdos') {
    return {
      moves: ['Thunderbolt', 'Hurricane', 'Baton Pass', 'Roost'],
      signatureGift: 'Baton Pass (Exclusivo XD Purificado)',
    };
  }
  if (spKey === 'moltres') {
    return {
      moves: ['Flamethrower', 'Hurricane', 'Will-O-Wisp', 'Roost'],
      signatureGift: 'Morning Sun / Roost (Purificado)',
    };
  }
  if (spKey === 'tyranitar') {
    return {
      moves: ['Rock Slide', 'Knock Off', 'Dragon Dance', 'Protect'],
      signatureGift: 'Dragon Dance (Purificado)',
    };
  }
  if (spKey === 'metagross') {
    return {
      moves: ['Meteor Mash', 'Psychic Fangs', 'Bullet Punch', 'Protect'],
      signatureGift: 'Bullet Punch (Purificado)',
    };
  }
  if (spKey === 'salamence') {
    return {
      moves: ['Draco Meteor', 'Hurricane', 'Flamethrower', 'Protect'],
      signatureGift: 'Refresh / Protect (Purificado)',
    };
  }
  if (spKey === 'houndoommega' || spKey === 'houndoom') {
    return {
      moves: ['Dark Pulse', 'Heat Wave', 'Nasty Plot', 'Protect'],
      signatureGift: 'Nasty Plot (Purificado)',
    };
  }
  if (spKey === 'snorlax') {
    return {
      moves: ['Body Slam', 'High Horsepower', 'Curse', 'Recycle'],
      signatureGift: 'Refresh / Curse (Purificado)',
    };
  }
  const nonShadow = currentMoves.filter((m) => !isShadowMoveName(m));
  const dexSp = Dex.species.get(species);
  const fallbacks =
    (dexSp.baseStats?.atk ?? 80) >= (dexSp.baseStats?.spa ?? 80)
      ? ['Body Slam', 'Earthquake', 'Knock Off', 'Protect']
      : ['Hyper Voice', 'Earth Power', 'Shadow Ball', 'Protect'];
  const merged = Array.from(new Set([...nonShadow, ...fallbacks])).slice(0, 4);
  return {
    moves: merged,
    signatureGift: 'Vínculo Puro (Afecto Activo + Mega/Tera/Z Desbloqueados)',
  };
}

/** Helper to check if a CustomTeamMember uses Shadow moves. */
export function memberUsesShadowMoves(m: Pick<CustomTeamMember, 'moves'>): boolean {
  return (m.moves ?? []).some((mv) => isShadowMoveName(mv));
}
