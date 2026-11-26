import type {
  DecisionTraceItem,
  ResolvedBattleConfig,
  StoryFlags,
} from '../types/game';

export interface ShowdownSetBlock {
  nickname?: string;
  species: string;
  item?: string;
  ability: string;
  level: number;
  evs?: string;
  nature?: string;
  moves: string[];
}

/**
 * Compiles structured Pokémon set blocks into authentic Pokémon Showdown Teambuilder Paste text.
 * This text is injected directly into `@pkmn/sim`'s `Teams.import()` -> `Teams.pack()`.
 */
export function buildShowdownPaste(blocks: ShowdownSetBlock[]): string {
  return blocks
    .map((mon) => {
      const headerName = mon.nickname
        ? `${mon.nickname} (${mon.species})`
        : mon.species;
      const firstLine = mon.item ? `${headerName} @ ${mon.item}` : headerName;
      const lines = [
        firstLine,
        `Ability: ${mon.ability}`,
        `Level: ${mon.level}`,
      ];
      if (mon.evs) {
        lines.push(`EVs: ${mon.evs}`);
      }
      if (mon.nature) {
        lines.push(`${mon.nature} Nature`);
      }
      for (const mv of mon.moves) {
        lines.push(`- ${mv}`);
      }
      return lines.join('\n');
    })
    .join('\n\n');
}

/* ===================== Reusable Canonical Sets (from Galar AU Lore) ===================== */

const ARCEUS_SETS: Record<string, { label: string; detail: string; block: ShowdownSetBlock }> = {
  physical: {
    label: 'Arceus Físico (Extreme Killer)',
    detail: '120 Atk priorizado: Adamant, 252 Atk / 252 Spe, Silk Scarf — Extreme Speed / Earthquake / Shadow Claw / Swords Dance.',
    block: {
      species: 'Arceus',
      item: 'Silk Scarf',
      ability: 'Multitype',
      level: 100,
      evs: '252 Atk / 4 SpD / 252 Spe',
      nature: 'Adamant',
      moves: ['Extreme Speed', 'Earthquake', 'Shadow Claw', 'Swords Dance'],
    },
  },
  special: {
    label: 'Arceus Especial (Calm Mind Judge)',
    detail: '120 SpA priorizado: Modest, 252 SpA / 252 Spe, Life Orb — Judgment / Thunderbolt / Energy Ball / Calm Mind.',
    block: {
      species: 'Arceus',
      item: 'Life Orb',
      ability: 'Multitype',
      level: 100,
      evs: '252 SpA / 4 SpD / 252 Spe',
      nature: 'Modest',
      moves: ['Judgment', 'Thunderbolt', 'Energy Ball', 'Calm Mind'],
    },
  },
  electric: {
    label: 'Arceus-Electric (Placa Trueno)',
    detail: 'Multitype Eléctrico con Zap Plate: Timid, 252 SpA / 252 Spe — Judgment eléctrico x2 vs Agua, Thunderbolt, Ice Beam, Recover.',
    block: {
      species: 'Arceus-Electric',
      item: 'Zap Plate',
      ability: 'Multitype',
      level: 100,
      evs: '252 SpA / 4 SpD / 252 Spe',
      nature: 'Timid',
      moves: ['Judgment', 'Thunderbolt', 'Ice Beam', 'Recover'],
    },
  },
};

const ARCANINE_DAILY_PHYSICAL: ShowdownSetBlock = {
  species: 'Arcanine',
  item: 'Sitrus Berry',
  ability: 'Intimidate',
  level: 100,
  evs: '244 HP / 140 Atk / 124 Spe',
  nature: 'Adamant',
  moves: ['Flare Blitz', 'Extreme Speed', 'Will-O-Wisp', 'Protect'],
};

const ARCANINE_DAILY_SPECIAL: ShowdownSetBlock = {
  species: 'Arcanine',
  item: 'Sitrus Berry',
  ability: 'Intimidate',
  level: 100,
  evs: '244 HP / 140 SpA / 124 Spe',
  nature: 'Modest',
  moves: ['Heat Wave', 'Snarl', 'Will-O-Wisp', 'Protect'],
};

const GALLADE_KNIGHT: ShowdownSetBlock = {
  species: 'Gallade',
  item: 'Life Orb',
  ability: 'Sharpness',
  level: 100,
  evs: '252 Atk / 4 SpD / 252 Spe',
  nature: 'Jolly',
  moves: ['Sacred Sword', 'Psycho Cut', 'Wide Guard', 'Protect'],
};

/* ===================== Chapter 0 Decision Tree (Arceus vs 6 Magikarps) ===================== */

export function resolveChapter0Battle(flags: StoryFlags): ResolvedBattleConfig {
  const arceusBuild = String(flags.arceus_build ?? 'physical');
  const companion = String(flags.player_companion ?? 'none');
  const rivalStance = String(flags.rival_stance ?? 'ceremonial');

  const traces: DecisionTraceItem[] = [];
  const playerBlocks: ShowdownSetBlock[] = [];

  // Node 1: Equal Atk/SpA (120/120) -> Set branch for Arceus
  const chosenArceus = ARCEUS_SETS[arceusBuild] ?? ARCEUS_SETS.physical;
  playerBlocks.push(chosenArceus.block);
  traces.push({
    id: 'ch0-set',
    category: 'player-set',
    choiceLabel:
      arceusBuild === 'physical'
        ? 'Vía Física (Espada)'
        : arceusBuild === 'special'
          ? 'Vía Especial (Juicio)'
          : 'Vía Elemental (Placa Trueno)',
    flagKey: 'arceus_build',
    flagValue: arceusBuild,
    effectTitle: chosenArceus.label,
    effectDetail: chosenArceus.detail,
  });

  // Node 2: Roster branch -> Solo Arceus vs Companion
  if (companion === 'arcanine') {
    playerBlocks.push(ARCANINE_DAILY_PHYSICAL);
    traces.push({
      id: 'ch0-roster',
      category: 'player-roster',
      choiceLabel: 'Llevar a Arcanine como escolta',
      flagKey: 'player_companion',
      flagValue: companion,
      effectTitle: 'Equipo: Arceus + Arcanine',
      effectDetail: 'Se inyecta a Arcanine (Intimidación, Equipo de Vida Diaria) en el slot 2 del Teambuilder.',
    });
  } else if (companion === 'gallade') {
    playerBlocks.push(GALLADE_KNIGHT);
    traces.push({
      id: 'ch0-roster',
      category: 'player-roster',
      choiceLabel: 'Convocar a Gallade como caballero',
      flagKey: 'player_companion',
      flagValue: companion,
      effectTitle: 'Equipo: Arceus + Gallade',
      effectDetail: 'Se inyecta a Gallade (Cortante, Equipo de Combate) en el slot 2 del Teambuilder.',
    });
  } else {
    traces.push({
      id: 'ch0-roster',
      category: 'player-roster',
      choiceLabel: 'Ir solo con Arceus (1 vs 6)',
      flagKey: 'player_companion',
      flagValue: 'none',
      effectTitle: 'Equipo: Solo Arceus (1 Pokémon)',
      effectDetail: 'Modo testing puro: tu único Pokémon es Arceus enfrentando a los 6 Magikarp.',
    });
  }

  // Node 3: Rival branch -> Ceremonial Lv.50 Splash Magikarps vs Provoked Lv.100 Dirty Magikarps
  const numerals = ['I', 'II', 'III', 'IV', 'V', 'VI'];
  let rivalBlocks: ShowdownSetBlock[];

  if (rivalStance === 'provoked') {
    const dirtyLoadouts: Array<{ item: string; nature: string; evs: string; moves: string[] }> = [
      { item: 'Focus Sash', nature: 'Jolly', evs: '252 Atk / 252 Spe', moves: ['Flail', 'Tackle', 'Splash'] },
      { item: 'Choice Band', nature: 'Adamant', evs: '252 Atk / 252 Spe', moves: ['Tackle'] },
      { item: 'Mystic Water', nature: 'Modest', evs: '252 SpA / 252 Spe', moves: ['Hydro Pump', 'Splash'] },
      { item: 'Focus Sash', nature: 'Adamant', evs: '252 Atk / 252 Spe', moves: ['Flail', 'Bounce', 'Splash'] },
      { item: 'Choice Scarf', nature: 'Jolly', evs: '252 Atk / 252 Spe', moves: ['Tackle', 'Flail'] },
      { item: 'Leftovers', nature: 'Impish', evs: '252 HP / 252 Def', moves: ['Bounce', 'Tackle', 'Splash'] },
    ];
    rivalBlocks = numerals.map((num, idx) => ({
      nickname: `Magikarp ${num}`,
      species: 'Magikarp',
      ability: idx % 2 === 0 ? 'Swift Swim' : 'Rattled',
      level: 100,
      ...dirtyLoadouts[idx],
    }));
    traces.push({
      id: 'ch0-rival',
      category: 'rival-team',
      choiceLabel: 'Humillar a Lord Vane en público',
      flagKey: 'rival_stance',
      flagValue: 'provoked',
      effectTitle: 'Rival: 6 Magikarp Furiosos (Nv. 100)',
      effectDetail: 'Focus Sash + Flail, Choice Band Tackle, Hydro Pump y Bounce. Lord Vane abandonó la etiqueta.',
    });
  } else {
    rivalBlocks = numerals.map((num) => ({
      nickname: `Magikarp ${num}`,
      species: 'Magikarp',
      ability: 'Swift Swim',
      level: 50,
      evs: '4 HP',
      nature: 'Bashful',
      moves: ['Splash'],
    }));
    traces.push({
      id: 'ch0-rival',
      category: 'rival-team',
      choiceLabel: 'Aceptar el duelo ceremonial',
      flagKey: 'rival_stance',
      flagValue: 'ceremonial',
      effectTitle: 'Rival: 6 Magikarp Ceremoniales (Nv. 50)',
      effectDetail: 'Seis Magikarp nivel 50 con Salpicadura (Splash) para probar un barrido 6-0 limpio.',
    });
  }

  return {
    chapterId: 'ch0-arceus-test',
    format: 'singles',
    formatId: 'gen9customgame',
    playerName: 'Príncipe Heredero',
    rivalName: 'Lord Vane',
    rivalTitle: 'Emisario de la Rama Secundaria',
    arenaTheme: 'royal-pond',
    playerTeamSummary:
      companion === 'none'
        ? `${chosenArceus.label} (Solo 1v6)`
        : `${chosenArceus.label} + ${companion === 'arcanine' ? 'Arcanine' : 'Gallade'}`,
    rivalTeamSummary:
      rivalStance === 'provoked'
        ? '6× Magikarp Nv. 100 (Focus Sash / Choice Band / Hydro Pump)'
        : '6× Magikarp Nv. 50 (Salpicadura Ceremonial)',
    playerShowdownPaste: buildShowdownPaste(playerBlocks),
    rivalShowdownPaste: buildShowdownPaste(rivalBlocks),
    traces,
    flags,
  };
}

/* ===================== Chapter 1 Decision Tree (Galar Banquet Doubles 2v2) ===================== */

export function resolveChapter1Battle(flags: StoryFlags): ResolvedBattleConfig {
  const teamMode = String(flags.team_mode ?? 'daily');
  const mixedRole = String(flags.mixed_role ?? 'physical');
  const assassinPlan = String(flags.assassin_plan ?? 'sabotage');

  const traces: DecisionTraceItem[] = [];
  let playerBlocks: ShowdownSetBlock[];

  if (teamMode === 'combat') {
    const dragapultBlock: ShowdownSetBlock =
      mixedRole === 'special'
        ? {
            species: 'Dragapult',
            item: 'Choice Specs',
            ability: 'Clear Body',
            level: 100,
            evs: '252 SpA / 4 SpD / 252 Spe',
            nature: 'Timid',
            moves: ['Draco Meteor', 'Shadow Ball', 'Flamethrower', 'U-turn'],
          }
        : {
            species: 'Dragapult',
            item: 'Life Orb',
            ability: 'Clear Body',
            level: 100,
            evs: '252 Atk / 4 SpD / 252 Spe',
            nature: 'Jolly',
            moves: ['Dragon Darts', 'Phantom Force', 'U-turn', 'Protect'],
          };

    playerBlocks = [
      {
        species: 'Zacian-Crowned',
        item: 'Rusted Sword',
        ability: 'Intrepid Sword',
        level: 100,
        evs: '252 Atk / 4 SpD / 252 Spe',
        nature: 'Jolly',
        moves: ['Behemoth Blade', 'Play Rough', 'Sacred Sword', 'Protect'],
      },
      dragapultBlock,
      {
        species: 'Tyranitar',
        item: 'Assault Vest',
        ability: 'Sand Stream',
        level: 100,
        evs: '252 HP / 252 Atk / 4 SpD',
        nature: 'Adamant',
        moves: ['Rock Slide', 'Crunch', 'Low Kick', 'Sucker Punch'],
      },
      GALLADE_KNIGHT,
    ];

    traces.push({
      id: 'ch1-roster',
      category: 'player-roster',
      choiceLabel: 'Código Corona (Teletransporte)',
      flagKey: 'team_mode',
      flagValue: 'combat',
      effectTitle: 'Equipo de Combate del Heredero',
      effectDetail: 'Despliegue de élite: Zacian-Crowned, Dragapult, Tyranitar y Gallade.',
    });
    traces.push({
      id: 'ch1-set',
      category: 'player-set',
      choiceLabel: mixedRole === 'special' ? 'Enfoque Especial' : 'Enfoque Físico',
      flagKey: 'mixed_role',
      flagValue: mixedRole,
      effectTitle:
        mixedRole === 'special'
          ? 'Dragapult Especial (Choice Specs)'
          : 'Dragapult Físico (Dragon Darts + Life Orb)',
      effectDetail:
        mixedRole === 'special'
          ? 'Atacante mixto configurado con 252 SpA, Draco Meteor, Shadow Ball y Flamethrower.'
          : 'Atacante mixto configurado con 252 Atk, Dragon Darts (doble golpe en 2v2) y Phantom Force.',
    });
  } else {
    playerBlocks = [
      mixedRole === 'special' ? ARCANINE_DAILY_SPECIAL : ARCANINE_DAILY_PHYSICAL,
      {
        species: 'Gardevoir',
        item: 'Light Clay',
        ability: 'Telepathy',
        level: 100,
        evs: '252 HP / 120 Def / 136 SpD',
        nature: 'Calm',
        moves: ['Light Screen', 'Reflect', 'Dazzling Gleam', 'Heal Pulse'],
      },
      {
        species: 'Milotic',
        item: 'Leftovers',
        ability: 'Competitive',
        level: 100,
        evs: '252 HP / 140 Def / 116 SpA',
        nature: 'Bold',
        moves: ['Scald', 'Icy Wind', 'Recover', 'Protect'],
      },
      {
        species: 'Corviknight',
        item: 'Rocky Helmet',
        ability: 'Mirror Armor',
        level: 100,
        evs: '252 HP / 252 Def / 4 SpD',
        nature: 'Impish',
        moves: ['Brave Bird', 'Body Press', 'Tailwind', 'Roost'],
      },
    ];

    traces.push({
      id: 'ch1-roster',
      category: 'player-roster',
      choiceLabel: 'Protocolo Civil (Emboscada)',
      flagKey: 'team_mode',
      flagValue: 'daily',
      effectTitle: 'Equipo de Vida Diaria (Protección)',
      effectDetail: 'Sobrevives la emboscada con Arcanine, Gardevoir, Milotic y Corviknight.',
    });
    traces.push({
      id: 'ch1-set',
      category: 'player-set',
      choiceLabel: mixedRole === 'special' ? 'Enfoque Especial' : 'Enfoque Físico',
      flagKey: 'mixed_role',
      flagValue: mixedRole,
      effectTitle:
        mixedRole === 'special'
          ? 'Arcanine Soporte Especial (Heat Wave + Snarl)'
          : 'Arcanine Guardaespaldas Físico (Flare Blitz + Extreme Speed)',
      effectDetail:
        mixedRole === 'special'
          ? 'Atacante mixto (110 Atk / 100 SpA) enfocado en daño en área y control con Alarido.'
          : 'Atacante mixto configurado con presión física directa y prioridad.',
    });
  }

  const smeargle: ShowdownSetBlock = {
    species: 'Smeargle',
    item: 'Focus Sash',
    ability: 'Own Tempo',
    level: 100,
    evs: '252 HP / 4 Def / 252 Spe',
    nature: 'Jolly',
    moves: ['Spore', 'Follow Me', 'Fake Out', 'Endeavor'],
  };
  const sableye: ShowdownSetBlock = {
    species: 'Sableye',
    item: 'Sitrus Berry',
    ability: 'Prankster',
    level: 100,
    evs: '252 HP / 128 Def / 128 SpD',
    nature: 'Careful',
    moves: ['Will-O-Wisp', 'Encore', 'Foul Play', 'Recover'],
  };
  const cottonee: ShowdownSetBlock = {
    species: 'Cottonee',
    item: 'Focus Sash',
    ability: 'Prankster',
    level: 100,
    evs: '252 HP / 4 Def / 252 Spe',
    nature: 'Timid',
    moves: ['Tailwind', 'Endeavor', 'Encore', 'Protect'],
  };
  const clefairy: ShowdownSetBlock = {
    species: 'Clefairy',
    item: 'Eviolite',
    ability: 'Friend Guard',
    level: 100,
    evs: '252 HP / 252 Def / 4 SpD',
    nature: 'Bold',
    moves: ['Follow Me', 'Helping Hand', 'Moonblast', 'Protect'],
  };
  const ditto: ShowdownSetBlock = {
    species: 'Ditto',
    item: 'Choice Scarf',
    ability: 'Imposter',
    level: 100,
    evs: '252 HP / 4 Def / 252 Spe',
    nature: 'Jolly',
    moves: ['Transform'],
  };

  const rivalBlocks =
    assassinPlan === 'mirror'
      ? [ditto, smeargle, sableye, cottonee]
      : [smeargle, sableye, cottonee, clefairy];

  traces.push({
    id: 'ch1-rival',
    category: 'rival-team',
    choiceLabel:
      assassinPlan === 'mirror'
        ? 'Acusar a Tizonio y Dargo'
        : 'Guardar silencio y leer formación',
    flagKey: 'assassin_plan',
    flagValue: assassinPlan,
    effectTitle:
      assassinPlan === 'mirror'
        ? 'Sicario ≤400 BST: Protocolo Espejo (Ditto Impostor)'
        : 'Sicario ≤400 BST: Escuadrón de Sabotaje',
    effectDetail:
      assassinPlan === 'mirror'
        ? 'Incluye Ditto (288 BST) con Impostor + Pañuelo Elegido para copiar a tu Pokémon activo + Smeargle, Sableye y Cottonee.'
        : 'Sets sucios de VGC Early Game: Smeargle (Espora/Señuelo), Sableye (Bromista), Cottonee (Viento Afín) y Clefairy (Compiescolta).',
  });

  return {
    chapterId: 'ch1-banquet-ambush',
    format: 'doubles',
    formatId: 'gen9doublescustomgame',
    playerName: 'Príncipe Heredero',
    rivalName: 'Sicario de la Corte',
    rivalTitle: 'Agente Encubierto (≤400 BST)',
    arenaTheme: 'banquet-hall',
    playerTeamSummary:
      teamMode === 'combat'
        ? `Equipo de Combate (Zacian + Dragapult ${mixedRole === 'special' ? 'SpA' : 'Atk'} + Tyranitar + Gallade)`
        : `Equipo de Vida Diaria (Arcanine ${mixedRole === 'special' ? 'SpA' : 'Atk'} + Gardevoir + Milotic + Corviknight)`,
    rivalTeamSummary:
      assassinPlan === 'mirror'
        ? 'Ditto (Impostor Scarf), Smeargle, Sableye, Cottonee'
        : 'Smeargle, Sableye, Cottonee, Clefairy',
    playerShowdownPaste: buildShowdownPaste(playerBlocks),
    rivalShowdownPaste: buildShowdownPaste(rivalBlocks),
    traces,
    flags,
  };
}
