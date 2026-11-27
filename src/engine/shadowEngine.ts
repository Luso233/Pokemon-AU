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
 * SHADOW POKÉMON (COLOSSEUM / XD GEN 9 REWORK) + POWER OF FRIENDSHIP (LET'S GO)
 * Injects native Shadow Type, Fairy 0× Immunity, 24 Reworked/Invented Shadow
 * Moves, Shadow Sky Weather, Hyper/Reverse Mode, and Let's Go Affection hooks
 * directly into @pkmn/sim's Dex & Battle engine!
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
 * Full 24-Move Shadow Arsenal:
 * - All 18 classic Colosseum / XD Shadow Moves reworked to modern Gen 9 power standards
 * - 6 brand-new invented Shadow Moves (including XD001 Dark Lugia's Shadow Aeroblast & Shadow Eclipse!)
 */
export const SHADOW_MOVES_CATALOG: ShadowMoveDefinition[] = [
  /* -------- 18 REWORKED COLOSSEUM / XD CLASSICS -------- */
  {
    id: 'shadowrush',
    name: 'Shadow Rush',
    num: 9001,
    basePower: 95,
    accuracy: 100,
    category: 'Physical',
    pp: 15,
    priority: 1,
    target: 'normal',
    type: 'Shadow',
    isOriginalClassic: true,
    shortDesc: 'Prioridad +1 · Embestida Oscura de 95 BP sin retroceso fuera de Modo Hiper.',
    dexData: {
      flags: { contact: 1, protect: 1, mirror: 1 },
      secondary: null,
    },
  },
  {
    id: 'shadowblitz',
    name: 'Shadow Blitz',
    num: 9002,
    basePower: 80,
    accuracy: 100,
    category: 'Physical',
    pp: 15,
    priority: 2,
    target: 'normal',
    type: 'Shadow',
    isOriginalClassic: true,
    shortDesc: 'Prioridad +2 (Extreme Speed Oscuro) con 20% de retroceso.',
    dexData: {
      flags: { contact: 1, protect: 1, mirror: 1 },
      secondary: { chance: 20, volatileStatus: 'flinch' },
    },
  },
  {
    id: 'shadowblast',
    name: 'Shadow Blast',
    num: 9003,
    basePower: 115,
    accuracy: 95,
    category: 'Special',
    pp: 10,
    priority: 0,
    target: 'normal',
    type: 'Shadow',
    isOriginalClassic: true,
    shortDesc: 'Alto ratio de Crítico (+1) y 20% de bajar Def. Esp. rival.',
    dexData: {
      flags: { protect: 1, mirror: 1 },
      critRatio: 2,
      secondary: { chance: 20, boosts: { spd: -1 } },
    },
  },
  {
    id: 'shadowstorm',
    name: 'Shadow Storm',
    num: 9004,
    basePower: 100,
    accuracy: 95,
    category: 'Special',
    pp: 10,
    priority: 0,
    target: 'allAdjacentFoes',
    type: 'Shadow',
    isOriginalClassic: true,
    shortDesc: 'Ataque de área (golpea a ambos rivales) · 20% de confundir.',
    dexData: {
      flags: { protect: 1, mirror: 1, wind: 1 },
      secondary: { chance: 20, volatileStatus: 'confusion' },
    },
  },
  {
    id: 'shadowwave',
    name: 'Shadow Wave',
    num: 9005,
    basePower: 90,
    accuracy: 100,
    category: 'Special',
    pp: 15,
    priority: 0,
    target: 'allAdjacentFoes',
    type: 'Shadow',
    isOriginalClassic: true,
    shortDesc: 'Ataque de área preciso · 30% de reducir el Atq. Esp. rival (-1).',
    dexData: {
      flags: { protect: 1, mirror: 1 },
      secondary: { chance: 30, boosts: { spa: -1 } },
    },
  },
  {
    id: 'shadowbolt',
    name: 'Shadow Bolt',
    num: 9006,
    basePower: 95,
    accuracy: 100,
    category: 'Special',
    pp: 10,
    priority: 0,
    target: 'normal',
    type: 'Shadow',
    isOriginalClassic: true,
    shortDesc: 'Rayo de aura oscura (ignora inmunidad Tierra) · 30% Parálisis.',
    dexData: {
      flags: { protect: 1, mirror: 1 },
      secondary: { chance: 30, status: 'par' },
    },
  },
  {
    id: 'shadowchill',
    name: 'Shadow Chill',
    num: 9007,
    basePower: 95,
    accuracy: 100,
    category: 'Special',
    pp: 10,
    priority: 0,
    target: 'normal',
    type: 'Shadow',
    isOriginalClassic: true,
    shortDesc: 'Escarcha sombría · 15% Congelación y 30% -1 Velocidad.',
    dexData: {
      flags: { protect: 1, mirror: 1 },
      secondaries: [
        { chance: 15, status: 'frz' },
        { chance: 30, boosts: { spe: -1 } },
      ],
    },
  },
  {
    id: 'shadowfire',
    name: 'Shadow Fire',
    num: 9008,
    basePower: 95,
    accuracy: 100,
    category: 'Special',
    pp: 10,
    priority: 0,
    target: 'normal',
    type: 'Shadow',
    isOriginalClassic: true,
    shortDesc: 'Fuego espectral · 30% de quemar (BRN) al objetivo.',
    dexData: {
      flags: { protect: 1, mirror: 1 },
      secondary: { chance: 30, status: 'brn' },
    },
  },
  {
    id: 'shadowbreak',
    name: 'Shadow Break',
    num: 9009,
    basePower: 100,
    accuracy: 100,
    category: 'Physical',
    pp: 10,
    priority: 0,
    target: 'normal',
    type: 'Shadow',
    isOriginalClassic: true,
    shortDesc: 'Destruye Reflejo, Pantalla de Luz y Velo Aurora antes de golpear.',
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
    id: 'shadowend',
    name: 'Shadow End',
    num: 9010,
    basePower: 160,
    accuracy: 90,
    category: 'Physical',
    pp: 5,
    priority: 0,
    target: 'normal',
    type: 'Shadow',
    isOriginalClassic: true,
    shortDesc: 'Remate brutal de 160 BP con 33% de retroceso por fuerza oscura.',
    dexData: {
      flags: { contact: 1, protect: 1, mirror: 1 },
      recoil: [1, 3],
      secondary: null,
    },
  },
  {
    id: 'shadowrave',
    name: 'Shadow Rave',
    num: 9011,
    basePower: 100,
    accuracy: 100,
    category: 'Special',
    pp: 10,
    priority: 0,
    target: 'allAdjacentFoes',
    type: 'Shadow',
    isOriginalClassic: true,
    shortDesc: 'Estallido de área (100 BP) que atraviesa Sustitutos (Bypass Sub).',
    dexData: {
      flags: { protect: 1, mirror: 1, bypasssub: 1 },
      secondary: null,
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
    shortDesc: 'Corta a la MITAD los PS actuales de todos los Pokémon activos no-Hada (sin turno de recarga).',
    dexData: {
      flags: { bypasssub: 1 },
      onHitField(this: any, _t: any, source: any) {
        let hitAny = false;
        for (const side of this.sides) {
          for (const mon of side.active) {
            if (!mon || mon.fainted) continue;
            if (mon.hasType('Fairy')) {
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
    id: 'shadowhold',
    name: 'Shadow Hold',
    num: 9013,
    basePower: 0,
    accuracy: 100,
    category: 'Status',
    pp: 10,
    priority: 0,
    target: 'allAdjacentFoes',
    type: 'Shadow',
    isOriginalClassic: true,
    shortDesc: 'Atrapa a ambos rivales (impide cambios) y baja su Def y Def. Esp. en -1.',
    dexData: {
      flags: { protect: 1, reflectable: 1, mirror: 1 },
      onHit(this: any, target: any, source: any) {
        if (target.hasType('Fairy')) {
          this.add('-immune', target);
          return false;
        }
        target.addVolatile('trapped', source, undefined, 'trapper');
        this.boost({ def: -1, spd: -1 }, target, source);
      },
      secondary: null,
    },
  },
  {
    id: 'shadowpanic',
    name: 'Shadow Panic',
    num: 9014,
    basePower: 0,
    accuracy: 90,
    category: 'Status',
    pp: 10,
    priority: 0,
    target: 'allAdjacentFoes',
    type: 'Shadow',
    isOriginalClassic: true,
    shortDesc: 'Confunde a ambos rivales y reduce su Velocidad (-1).',
    dexData: {
      flags: { protect: 1, reflectable: 1, mirror: 1, sound: 1, bypasssub: 1 },
      onHit(this: any, target: any, source: any) {
        if (target.hasType('Fairy')) {
          this.add('-immune', target);
          return false;
        }
        target.addVolatile('confusion', source);
        this.boost({ spe: -1 }, target, source);
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
    shortDesc: 'Desploma -2 Defensa y -2 Defensa Especial de ambos rivales.',
    dexData: {
      flags: { protect: 1, reflectable: 1, mirror: 1 },
      onHit(this: any, target: any, source: any) {
        if (target.hasType('Fairy')) {
          this.add('-immune', target);
          return false;
        }
        this.boost({ def: -2, spd: -2 }, target, source);
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
    shortDesc: 'Baja -1 Ataque y -1 Atq. Esp. de ambos rivales y limpia su Evasión.',
    dexData: {
      flags: { protect: 1, reflectable: 1, mirror: 1 },
      onHit(this: any, target: any, source: any) {
        if (target.hasType('Fairy')) {
          this.add('-immune', target);
          return false;
        }
        this.boost({ atk: -1, spa: -1, evasion: -2 }, target, source);
      },
      secondary: null,
    },
  },
  {
    id: 'shadowshed',
    name: 'Shadow Shed',
    num: 9017,
    basePower: 0,
    accuracy: true,
    category: 'Status',
    pp: 10,
    priority: 0,
    target: 'all',
    type: 'Shadow',
    isOriginalClassic: true,
    shortDesc: 'Rompe todas las pantallas rivales (Reflejo/Luz/Velo Aurora) y limpia hazards de tu lado.',
    dexData: {
      flags: {},
      onHitField(this: any, _t: any, source: any) {
        for (const side of this.sides) {
          side.removeSideCondition('reflect');
          side.removeSideCondition('lightscreen');
          side.removeSideCondition('auroraveil');
          side.removeSideCondition('safeguard');
        }
        source.side.removeSideCondition('stealthrock');
        source.side.removeSideCondition('spikes');
        source.side.removeSideCondition('toxicspikes');
        source.side.removeSideCondition('stickyweb');
        this.add('-message', '🌑 ¡Shadow Shed destrozó todas las pantallas y despejó las trampas del campo!');
        return true;
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
    shortDesc: 'Invoca Cielo Oscuro (5t): Shadow ×1.35, Def/SpD Oscuros ×1.25 y 1/16 daño a no-Oscuros.',
    dexData: {
      flags: {},
      weather: 'shadowsky',
      secondary: null,
    },
  },

  /* -------- 6 NEW INVENTED GEN 9 BULLSHIT SHADOW MOVES -------- */
  {
    id: 'shadowaeroblast',
    name: 'Shadow Aeroblast',
    num: 9019,
    basePower: 115,
    accuracy: 95,
    category: 'Special',
    pp: 10,
    priority: 0,
    target: 'allAdjacentFoes',
    type: 'Shadow',
    isOriginalClassic: false,
    shortDesc: 'Insignia de XD001 Lugia Oscuro: 115 BP de ÁREA (como Heat Wave) + Alto Crítico (+1).',
    dexData: {
      flags: { protect: 1, mirror: 1, wind: 1 },
      critRatio: 2,
      secondary: null,
    },
  },
  {
    id: 'shadoweclipse',
    name: 'Shadow Eclipse',
    num: 9020,
    basePower: 0,
    accuracy: true,
    category: 'Status',
    pp: 10,
    priority: 0,
    target: 'self',
    type: 'Shadow',
    isOriginalClassic: false,
    shortDesc: 'Equivalente Oscuro a DOS Paz Mental: +2 Atq. Esp., +2 Def. Esp. y +1 Velocidad en un turno.',
    dexData: {
      flags: { snatch: 1 },
      boosts: { spa: 2, spd: 2, spe: 1 },
      secondary: null,
    },
  },
  {
    id: 'shadowdominion',
    name: 'Shadow Dominion',
    num: 9021,
    basePower: 0,
    accuracy: true,
    category: 'Status',
    pp: 10,
    priority: 0,
    target: 'self',
    type: 'Shadow',
    isOriginalClassic: false,
    shortDesc: 'Setup físico prohibido de Aura: +2 Ataque, +1 Defensa y +1 Velocidad.',
    dexData: {
      flags: { snatch: 1 },
      boosts: { atk: 2, def: 1, spe: 1 },
      secondary: null,
    },
  },
  {
    id: 'shadowrend',
    name: 'Shadow Rend',
    num: 9022,
    basePower: 100,
    accuracy: 100,
    category: 'Physical',
    pp: 10,
    priority: 0,
    target: 'normal',
    type: 'Shadow',
    isOriginalClassic: false,
    shortDesc: 'Tajo Oscuro con CRÍTICO GARANTIZADO (ignora pantallas y aumentos de Defensa).',
    dexData: {
      flags: { contact: 1, protect: 1, mirror: 1, slicing: 1 },
      willCrit: true,
      secondary: null,
    },
  },
  {
    id: 'shadowsiphon',
    name: 'Shadow Siphon',
    num: 9023,
    basePower: 90,
    accuracy: 100,
    category: 'Special',
    pp: 10,
    priority: 0,
    target: 'normal',
    type: 'Shadow',
    isOriginalClassic: false,
    shortDesc: 'Absorbe el 75% del daño infligido para compensar el dolor del Modo Hiper.',
    dexData: {
      flags: { protect: 1, mirror: 1, heal: 1 },
      drain: [3, 4],
      secondary: null,
    },
  },
  {
    id: 'shadownova',
    name: 'Shadow Nova',
    num: 9024,
    basePower: 130,
    accuracy: 95,
    category: 'Special',
    pp: 5,
    priority: 0,
    target: 'allAdjacentFoes',
    type: 'Shadow',
    isOriginalClassic: false,
    shortDesc: 'Supernova de área (130 BP contra ambos rivales); reduce -1 Atq. Esp. tras lanzarlo.',
    dexData: {
      flags: { protect: 1, mirror: 1 },
      self: { boosts: { spa: -1 } },
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
 * @pkmn/sim RUNTIME INJECTION (Shadow Type, Fairy Immunity, 24 Moves, Shadow Sky,
 * Hyper/Reverse Mode & Let's Go Power of Friendship!)
 * ============================================================================ */

const INJECTED_DEXES = new WeakSet<object>();

/**
 * Injects the complete Shadow Pokémon & Power of Friendship ecosystem directly into
 * a `@pkmn/sim` Dex instance (base `Dex`, NatDex Custom format Dexes, and live `battle.dex`).
 * Safe & idempotent: runs once per Dex instance.
 */
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

    // 2. Register all 24 Gen 9 Reworked + Invented Shadow Moves
    if (d.data.Moves) {
      for (const m of SHADOW_MOVES_CATALOG) {
        d.data.Moves[m.id] = {
          num: m.num,
          accuracy: m.accuracy,
          basePower: m.basePower,
          category: m.category,
          name: m.name,
          pp: m.pp,
          priority: m.priority,
          target: m.target,
          type: 'Shadow',
          shortDesc: m.shortDesc,
          ...m.dexData,
        };
      }
      d.moves?.moveCache?.clear?.();
    }

    // 3. Register Shadow Sky Weather + Shadow/Affection Battle Rules Condition
    if (d.data.Conditions) {
      d.data.Conditions.shadowsky = {
        name: 'ShadowSky',
        effectType: 'Weather',
        duration: 5,
        onBasePowerPriority: 22,
        onBasePower(this: any, _bp: number, _attacker: any, _defender: any, move: any) {
          if (move?.type === 'Shadow') {
            return this.chainModify(1.35);
          }
        },
        onModifyDefPriority: 10,
        onModifyDef(this: any, def: number, pokemon: any) {
          if (pokemon?.m?.isShadow) {
            return this.chainModify(1.25);
          }
          return def;
        },
        onModifySpDPriority: 10,
        onModifySpD(this: any, spd: number, pokemon: any) {
          if (pokemon?.m?.isShadow) {
            return this.chainModify(1.25);
          }
          return spd;
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

      // Unified Shadow Type Effectiveness + Hyper/Reverse Mode + Let's Go Power of Friendship!
      d.data.Conditions.shadowaffectioncore = {
        name: 'ShadowAffectionCore',
        effectType: 'Condition',
        duration: 999,
        // Exact Colosseum/XD effectiveness: 0× vs Fairy (TypeChart), 0.5× vs Shadow, 2× vs ALL non-Shadow!
        onEffectiveness(
          this: any,
          _typeMod: number,
          target: any,
          type: string,
          move: any
        ) {
          if (!move || move.type !== 'Shadow' || !target) return;
          if (target.hasType('Fairy')) return; // Fairy immunity handled natively by TypeChart (3)!
          const isPrimarySlot = type === target.types?.[0];
          if (target.m?.isShadow) {
            return isPrimarySlot ? -1 : 0;
          }
          return isPrimarySlot ? 1 : 0;
        },
        // Shadow Pokémon aura boost (+20% on Shadow moves, plus +25% extra in Hyper/Reverse Mode!)
        onBasePowerPriority: 21,
        onBasePower(this: any, _bp: number, attacker: any, _defender: any, move: any) {
          if (!attacker?.m?.isShadow) return;
          let mult = 1;
          if (move?.type === 'Shadow') mult *= 1.2;
          if (attacker.m?.hyperMode) mult *= 1.25;
          if (mult > 1) return this.chainModify(mult);
        },
        // Hyper Mode (+1 Crit for Shadow <50% HP) AND Drama Crits (+1 Crit for Affection <25% HP!)
        onModifyCritRatio(this: any, critRatio: number, source: any) {
          if (!source) return critRatio;
          if (source.m?.isShadow && source.m?.hyperMode) {
            return critRatio + 1;
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
        // Power of Friendship (Let's Go!) — Endure lethal blow at 1 HP!
        onDamagePriority: -40,
        onDamage(this: any, damage: number, target: any, _source: any, effect: any) {
          if (!target || target.side?.id !== 'p1') return;
          if (target.m?.isShadow) return; // Closed heart: Shadow Pokémon NEVER get Power of Friendship!
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
        // Hyper/Reverse Mode activation + 1/8 self-pain AND Affection status shake-off!
        onFieldResidualOrder: 26,
        onFieldResidualSubOrder: 5,
        onFieldResidual(this: any) {
          const cfg = this.field?.pseudoWeather?.shadowaffectioncore;
          const affMode: AffectionMode = cfg?.affectionMode ?? 'off';

          for (const side of this.sides) {
            for (const mon of side.active) {
              if (!mon || mon.fainted) continue;

              // 1) Shadow Pokémon Hyper/Reverse Mode (< 50% HP)
              if (mon.m?.isShadow) {
                if (!mon.m.hyperMode && mon.hp * 2 <= mon.maxhp) {
                  mon.m.hyperMode = true;
                  this.add('-start', mon, 'Modo Hiper');
                  this.add(
                    '-message',
                    `🟣⚡ ¡${mon.name} entró en MODO HIPER! (+1 Crítico y +25% daño, pero su corazón cerrado lo consume)`
                  );
                }
                if (mon.m.hyperMode && !mon.fainted) {
                  const recoil = Math.max(1, Math.floor(mon.baseMaxhp / 8));
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
 * - Shadow Pokémon: NEVER (closed heart!).
 * - Freshly bought Black Market "Excel" Shop Pokémon: NOT yet (they don't love you yet!).
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
 * and chosen difficulty mode.
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

  const p1PartyShadow = profile.pokemonBox
    .filter((b) => b.zone === 'party' && b.isShadow)
    .map((b) => b.species);
  const p1PasteShadow = detectShadowSpeciesInPaste(playerPaste).map((s) => s.species);
  const p1ShadowSpecies = Array.from(
    new Set([
      ...(existing?.p1ShadowSpecies ?? []),
      ...p1PartyShadow,
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
      // Default narrative party starters when not using custom box team
      ...(!profile.useCustomTeamInStory
        ? ['Arcanine', 'Gardevoir', 'Corviknight', 'Milotic', 'Dragapult', 'Kingambit', 'Sylveon']
        : []),
    ])
  );

  return {
    p1ShadowSpecies,
    p2ShadowSpecies,
    affectionMode,
    p1HighBondSpecies,
    affectionForceProc: existing?.affectionForceProc,
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
  // Generic purification: replace Shadow moves with strong legal STAB + Protect
  const nonShadow = currentMoves.filter((m) => !isShadowMoveName(m));
  const dexSp = Dex.species.get(species);
  const fallbacks =
    (dexSp.baseStats?.atk ?? 80) >= (dexSp.baseStats?.spa ?? 80)
      ? ['Body Slam', 'Earthquake', 'Knock Off', 'Protect']
      : ['Hyper Voice', 'Earth Power', 'Shadow Ball', 'Protect'];
  const merged = Array.from(new Set([...nonShadow, ...fallbacks])).slice(0, 4);
  return {
    moves: merged,
    signatureGift: 'Vínculo Puro (Afecto Activo)',
  };
}

/** Helper to check if a CustomTeamMember uses Shadow moves. */
export function memberUsesShadowMoves(m: Pick<CustomTeamMember, 'moves'>): boolean {
  return (m.moves ?? []).some((mv) => isShadowMoveName(mv));
}
