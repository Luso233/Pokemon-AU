import { Teams, toID } from '@pkmn/sim';
import type { BattleDifficultyMode } from '../types/game';

export interface SpeciesDifficultyOverride {
  species: string;
  item?: string;
  moves?: string[];
  levelDelta?: number;
  ability?: string;
  evs?: string;
  nature?: string;
  /** Human-readable alert revealed by Romance Rank 2 Scouting Anti-Diablo! */
  scoutingAlert: string;
}

export interface ChapterDifficultyOverrides {
  /** Mild/forgiving tweaks for Normal ('standard') mode (e.g. Bubble Beam + Mystic Water). */
  standard?: SpeciesDifficultyOverride[];
  /** Ruthless upgrades for Diablo ('nightmare') mode (e.g. Water Spout + Choice Specs + Cap+3). */
  nightmare?: SpeciesDifficultyOverride[];
}

/**
 * Declarative per-chapter Difficulty Overrides.
 * Instead of duplicating chapters, Normal mode nerfs oppressive sets (e.g. Bubble Beam + Mystic Water)
 * while Diablo ('nightmare') mode upgrades them to competitive nightmare threats (Water Spout + Choice Specs,
 * Life Orb, Focus Sash, Cap+3, and ruthless anti-exploit Diablo AI)!
 */
export const CHAPTER_DIFFICULTY_OVERRIDES: Record<
  string,
  ChapterDifficultyOverrides
> = {
  'ch1-wyndon-chase': {
    standard: [
      {
        species: 'Heatran',
        item: 'Charcoal',
        moves: ['Flamethrower', 'Flash Cannon', 'Earth Power', 'Protect'],
        scoutingAlert: 'En Estándar Heatran lleva Flamethrower + Charcoal en lugar de Heat Wave.',
      },
      {
        species: 'Kingambit',
        item: 'Black Glasses',
        moves: ['Night Slash', 'Iron Head', 'Brick Break', 'Protect'],
        scoutingAlert: 'En Estándar Kingambit cambia Sucker Punch por Night Slash.',
      },
    ],
    nightmare: [
      {
        species: 'Heatran',
        item: 'Choice Specs',
        moves: ['Eruption', 'Heat Wave', 'Earth Power', 'Flash Cannon'],
        levelDelta: 3,
        scoutingAlert:
          '⚠️ DIABLO: Heatran reemplaza su set por Choice Specs + Eruption (Nv. +3). ¡No le regales turno con PS al 100%!',
      },
      {
        species: 'Kingambit',
        item: 'Life Orb',
        moves: ['Kowtow Cleave', 'Sucker Punch', 'Iron Head', 'Swords Dance'],
        levelDelta: 3,
        scoutingAlert:
          '⚠️ DIABLO: Kingambit porta Life Orb + Swords Dance y prioriza rematar bajas de Nuzlocke.',
      },
    ],
  },
  'ch2-monotype-banners': {
    standard: [
      {
        species: 'Greninja',
        item: 'Mystic Water',
        moves: ['Bubble Beam', 'Dark Pulse', 'Ice Beam', 'U-turn'],
        scoutingAlert: 'En Estándar Greninja usa Bubble Beam + Mystic Water para suavizar la presión.',
      },
    ],
    nightmare: [
      {
        species: 'Greninja',
        item: 'Choice Specs',
        moves: ['Hydro Pump', 'Dark Pulse', 'Ice Beam', 'Water Shuriken'],
        scoutingAlert:
          '⚠️ DIABLO: Greninja escala a Choice Specs + Hydro Pump (y castiga cambios obvios).',
      },
      {
        species: 'Kingambit',
        item: 'Black Glasses',
        moves: ['Sucker Punch', 'Kowtow Cleave', 'Iron Head', 'Swords Dance'],
        scoutingAlert:
          '⚠️ DIABLO: Kingambit guarda Swords Dance para limpiar tu equipo tras desgastar tu línea.',
      },
    ],
  },
  'challenge-weather-terrains': {
    standard: [
      {
        species: 'Pelipper',
        item: 'Mystic Water',
        moves: ['Bubble Beam', 'Air Slash', 'Tailwind', 'Protect'],
        scoutingAlert: 'En Estándar Pelipper lleva Bubble Beam + Mystic Water.',
      },
      {
        species: 'Castform',
        item: 'Wise Glasses',
        moves: ['Weather Ball', 'Bubble Beam', 'Thunderbolt', 'Protect'],
        scoutingAlert: 'En Estándar Castform ★ reduce su objeto a Wise Glasses.',
      },
    ],
    nightmare: [
      {
        species: 'Pelipper',
        item: 'Choice Specs',
        moves: ['Hydro Pump', 'Hurricane', 'Weather Ball', 'U-turn'],
        levelDelta: 3,
        scoutingAlert:
          '⚠️ DIABLO: Pelipper cambia Bubble Beam por Choice Specs + Hydro Pump / Hurricane 100% precisión.',
      },
      {
        species: 'Castform',
        item: 'Choice Specs',
        moves: ['Weather Ball', 'Hydro Pump', 'Hurricane', 'Blizzard'],
        levelDelta: 4,
        scoutingAlert:
          '⚠️ DIABLO: Castform ★ (Nv. +4) equipa Choice Specs y castiga con cobertura máxima climática.',
      },
    ],
  },
  'puzzle-01-sun-trap': {
    nightmare: [
      {
        species: 'Volcarona',
        item: 'Choice Specs',
        moves: ['Heat Wave', 'Fiery Dance', 'Bug Buzz', 'Giga Drain'],
        levelDelta: 3,
        scoutingAlert:
          '⚠️ DIABLO: Volcarona porta Choice Specs bajo Sol Intenso; cualquier error en Turno 1 es KO directo.',
      },
    ],
  },
  'ch3-clandestine-tamer': {
    standard: [
      {
        species: 'Ursaring',
        item: 'Silk Scarf',
        moves: ['Body Slam', 'Crunch', 'Brick Break', 'Protect'],
        scoutingAlert: 'En Estándar el foso modera el rencor de Ursaring.',
      },
    ],
    nightmare: [
      {
        species: 'Ursaring',
        item: 'Eviolite',
        moves: ['Frustration', 'Close Combat', 'Headlong Rush', 'Bulk Up'],
        levelDelta: 3,
        scoutingAlert:
          '⚠️ DIABLO: Ursaring conserva Frustration 102 BP con Eviolite + Headlong Rush (Nv. +3).',
      },
    ],
  },
  'puzzle-02-regigigas': {
    nightmare: [
      {
        species: 'Regigigas',
        item: 'Leftovers',
        moves: ['Crush Grip', 'Knock Off', 'Drain Punch', 'Heavy Slam'],
        levelDelta: 4,
        scoutingAlert:
          '⚠️ DIABLO: Regigigas entra +4 niveles extra y cambia Protect por Heavy Slam para aplastar Hadas.',
      },
    ],
  },
  'duel-01-honor-1v1': {
    nightmare: [
      {
        species: 'Iron Crown',
        item: 'Choice Specs',
        moves: ['Tachyon Cutter', 'Psychic', 'Focus Blast', 'Volt Switch'],
        scoutingAlert:
          '⚠️ DIABLO: Iron Crown equipa Choice Specs en 1v1 para maximizar OHKO en Turno 1.',
      },
    ],
  },
  'survival-galar-mines': {
    standard: [
      {
        species: 'Coalossal',
        item: 'Mystic Water',
        moves: ['Incinerate', 'Rock Tomb', 'Will-O-Wisp', 'Rapid Spin'],
        scoutingAlert: 'En Estándar Coalossal reduce su presión ofensiva.',
      },
    ],
    nightmare: [
      {
        species: 'Bisharp',
        item: 'Eviolite',
        moves: ['Kowtow Cleave', 'Iron Head', 'Sucker Punch', 'Swords Dance'],
        levelDelta: 4,
        scoutingAlert:
          '⚠️ DIABLO: Bisharp ★ (Oleada 2) entra Nv. +4 con enfoque letal contra tu equipo ya desgastado.',
      },
    ],
  },
  /* Romance Rank 3 Unfair Rematches — showcasing the exact Bubble Beam -> Water Spout + Choice Specs leap + Mega-Rayquaza AG! */
  'romance-champion-r3': {
    standard: [
      {
        species: 'Kyogre',
        item: 'Mystic Water',
        moves: ['Bubble Beam', 'Ice Beam', 'Thunder', 'Protect'],
        scoutingAlert:
          'En Estándar la Campeona contiene a su Kyogre con Bubble Beam + Mystic Water.',
      },
    ],
    nightmare: [
      {
        species: 'Kyogre',
        item: 'Choice Specs',
        moves: ['Water Spout', 'Origin Pulse', 'Ice Beam', 'Thunder'],
        levelDelta: 4,
        scoutingAlert:
          '⚠️ DIABLO: ¡ALERTA LETAL! En Diablo, Kyogre reemplaza Bubble Beam por WATER SPOUT + CHOICE SPECS (Nv. +4). ¡Bájale los PS antes de que ataque!',
      },
      {
        species: 'Rayquaza-Mega',
        item: 'Life Orb',
        moves: ['Dragon Ascent', 'Extreme Speed', 'V-create', 'Protect'],
        levelDelta: 4,
        scoutingAlert:
          '⚠️ DIABLO (AG): Mega-Rayquaza ★ sube +4 niveles extra con Life Orb + V-create + Extreme Speed.',
      },
    ],
  },
  'romance-assassin-r3': {
    nightmare: [
      {
        species: 'Chien-Pao',
        item: 'Focus Sash',
        moves: ['Icicle Crash', 'Sucker Punch', 'Sacred Sword', 'Protect'],
        levelDelta: 3,
        scoutingAlert:
          '⚠️ DIABLO: Chien-Pao porta Focus Sash (+3 Nv.) y baja tu Defensa con Sword of Ruin.',
      },
      {
        species: 'Kingambit',
        item: 'Life Orb',
        moves: ['Kowtow Cleave', 'Sucker Punch', 'Iron Head', 'Swords Dance'],
        levelDelta: 4,
        scoutingAlert:
          '⚠️ DIABLO: El Pelirrojo sube a Kingambit +4 niveles con Life Orb y castiga cada Protect o cambio predecible.',
      },
    ],
  },
  'romance-duelist-r3': {
    nightmare: [
      {
        species: 'Urshifu-Rapid-Strike',
        item: 'Choice Band',
        moves: ['Surging Strikes', 'Close Combat', 'Aqua Jet', 'Ice Spinner'],
        scoutingAlert:
          '⚠️ DIABLO (1v1): Urshifu-Rapid-Strike cambia a Choice Band para reventar en Turno 1 ignorando Protect.',
      },
    ],
  },
};

/**
 * Applies declarative species-level item/move/level overrides cleanly to a Showdown paste.
 */
export function applyChapterDifficultyOverrides(
  chapterId: string,
  rivalPaste: string,
  difficulty: BattleDifficultyMode,
  allowLevelBoost: boolean
): { paste: string; appliedAlerts: string[] } {
  const table = CHAPTER_DIFFICULTY_OVERRIDES[chapterId];
  if (!table) return { paste: rivalPaste, appliedAlerts: [] };
  const overrides =
    difficulty === 'baby' || difficulty === 'standard'
      ? table.standard
      : difficulty === 'nightmare'
        ? table.nightmare
        : undefined;
  if (!overrides || overrides.length === 0) {
    return { paste: rivalPaste, appliedAlerts: [] };
  }

  const sets = Teams.import(rivalPaste);
  if (!sets || sets.length === 0) {
    return { paste: rivalPaste, appliedAlerts: [] };
  }

  const appliedAlerts: string[] = [];
  const nextSets = sets.map((s) => {
    const spId = toID(s.species);
    const match = overrides.find((ov) => toID(ov.species) === spId);
    if (!match) return s;

    appliedAlerts.push(match.scoutingAlert);
    const baseLevel = s.level || 100;
    const nextLevel =
      allowLevelBoost && match.levelDelta
        ? Math.max(1, baseLevel + match.levelDelta)
        : baseLevel;

    return {
      ...s,
      level: nextLevel,
      item: match.item ?? s.item,
      moves: match.moves ? [...match.moves] : s.moves,
      ability: match.ability ?? s.ability,
      nature: match.nature ?? s.nature,
    };
  });

  return {
    paste: Teams.export(nextSets).trim(),
    appliedAlerts,
  };
}

/**
 * Preview scouting alerts shown in Teambuilder when the player has Romance Rank >= 2
 * (Anti-Diablo Tactical Intelligence perk!).
 */
export function getDiabloScoutingAlertsForChapter(
  chapterId: string,
  difficulty: BattleDifficultyMode
): string[] {
  const table = CHAPTER_DIFFICULTY_OVERRIDES[chapterId];
  if (!table) {
    if (difficulty === 'nightmare') {
      return [
        '⚠️ DIABLO ACTIVO: Rival +4 niveles sobre el cap, IA Anti-Explotación (castiga Protect obvio y caza a tu Pokémon más débil para forzar bajas de Nuzlocke).',
      ];
    }
    return [];
  }

  const list =
    difficulty === 'baby' || difficulty === 'standard'
      ? table.standard
      : difficulty === 'nightmare'
        ? table.nightmare
        : table.nightmare; // In Difícil/Kaizo, scouting still warns what Tryhard/Diablo would upgrade!

  const alerts = (list ?? []).map((ov) => ov.scoutingAlert);
  if (difficulty === 'nightmare') {
    alerts.push(
      '🧠 IA DIABLO: Sin fallos gratuitos — predice cambios, evita setups gratis y concentra fuego en tus Pokémon heridos.'
    );
  }
  return alerts;
}
