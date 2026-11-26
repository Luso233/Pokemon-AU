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

const ARCEUS_SETS: Record<
  string,
  { label: string; detail: string; block: ShowdownSetBlock }
> = {
  physical: {
    label: 'Arceus Físico (Extreme Killer)',
    detail:
      '120 Atk priorizado: Adamant, 252 Atk / 252 Spe, Silk Scarf — Extreme Speed / Earthquake / Shadow Claw / Swords Dance.',
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
    detail:
      '120 SpA priorizado: Modest, 252 SpA / 252 Spe, Life Orb — Judgment / Thunderbolt / Energy Ball / Calm Mind.',
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
    detail:
      'Multitype Eléctrico con Zap Plate: Timid, 252 SpA / 252 Spe — Judgment eléctrico x2 vs Agua, Thunderbolt, Ice Beam, Recover.',
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
      effectDetail:
        'Se inyecta a Arcanine (Intimidación, Equipo de Vida Diaria) en el slot 2 del Teambuilder.',
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
      effectDetail:
        'Se inyecta a Gallade (Cortante, Equipo de Combate) en el slot 2 del Teambuilder.',
    });
  } else {
    traces.push({
      id: 'ch0-roster',
      category: 'player-roster',
      choiceLabel: 'Ir solo con Arceus (1 vs 6)',
      flagKey: 'player_companion',
      flagValue: 'none',
      effectTitle: 'Equipo: Solo Arceus (1 Pokémon)',
      effectDetail:
        'Modo testing puro: tu único Pokémon es Arceus enfrentando a los 6 Magikarp.',
    });
  }

  // Node 3: Rival branch -> Ceremonial vs Provoked (with Boss Ace breaking level cap!)
  const numerals = ['I', 'II', 'III', 'IV', 'V', 'VI'];
  const levelCap = rivalStance === 'provoked' ? 100 : 50;
  let rivalBlocks: ShowdownSetBlock[];

  if (rivalStance === 'provoked') {
    const dirtyLoadouts: Array<{
      item: string;
      nature: string;
      evs: string;
      level: number;
      moves: string[];
    }> = [
      { item: 'Focus Sash', nature: 'Jolly', evs: '252 Atk / 252 Spe', level: 100, moves: ['Flail', 'Tackle', 'Splash'] },
      { item: 'Choice Band', nature: 'Adamant', evs: '252 Atk / 252 Spe', level: 100, moves: ['Tackle'] },
      { item: 'Mystic Water', nature: 'Modest', evs: '252 SpA / 252 Spe', level: 100, moves: ['Hydro Pump', 'Splash'] },
      { item: 'Focus Sash', nature: 'Adamant', evs: '252 Atk / 252 Spe', level: 100, moves: ['Flail', 'Bounce', 'Splash'] },
      { item: 'Choice Scarf', nature: 'Jolly', evs: '252 Atk / 252 Spe', level: 100, moves: ['Tackle', 'Flail'] },
      // Boss Ace: Magikarp VI breaks the Lv.100 cap -> Lv.105!
      { item: 'Leftovers', nature: 'Adamant', evs: '252 HP / 252 Atk / 4 Spe', level: 105, moves: ['Bounce', 'Flail', 'Hydro Pump', 'Splash'] },
    ];
    rivalBlocks = numerals.map((num, idx) => ({
      nickname: idx === 5 ? 'Magikarp VI ★' : `Magikarp ${num}`,
      species: 'Magikarp',
      ability: idx % 2 === 0 ? 'Swift Swim' : 'Rattled',
      ...dirtyLoadouts[idx],
    }));
    traces.push({
      id: 'ch0-rival',
      category: 'rival-team',
      choiceLabel: 'Humillar a Lord Vane en público',
      flagKey: 'rival_stance',
      flagValue: 'provoked',
      effectTitle: 'Rival en estado Hostil (Sets Ocultos)',
      effectDetail:
        'Lord Vane abandonó la etiqueta y recurrió a equipamiento clandestino. Su Ace final rompe el límite de nivel del capítulo.',
    });
  } else {
    rivalBlocks = numerals.map((num, idx) => ({
      nickname: idx === 5 ? 'Magikarp VI ★' : `Magikarp ${num}`,
      species: 'Magikarp',
      ability: 'Swift Swim',
      // Ceremonial Ace slightly breaks the Lv.50 cap -> Lv.55
      level: idx === 5 ? 55 : 50,
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
      effectTitle: 'Rival bajo Protocolo Ceremonial (Sets Ocultos)',
      effectDetail:
        'Lord Vane mantiene su formación de corte. Los objetos, niveles y movimientos exactos solo se revelarán en combate.',
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
    rivalTeamSummary: '6 especies avistadas (sets, objetos y niveles ocultos)',
    playerShowdownPaste: buildShowdownPaste(playerBlocks),
    rivalShowdownPaste: buildShowdownPaste(rivalBlocks),
    rivalIntel: {
      visibleSpeciesCount: 6,
      totalSlots: rivalBlocks.length,
      intelLabel: 'Inteligencia de Corte · 6/6 Especies',
      intelNote:
        'Al ser un duelo público, la Guardia Real identificó las especies rivales, pero sus niveles, objetos, habilidades y movimientos permanecen ocultos hasta entrar en combate.',
      levelCap,
      hasBossAce: true,
      bossAceWarning:
        rivalStance === 'provoked'
          ? 'Amenaza Ace detectada: Lord Vane está furioso; su último Pokémon rompe el límite de nivel del combate (+5 niveles sobre el cap).'
          : 'Ace ceremonial detectado: el último Pokémon de Lord Vane supera ligeramente el límite ceremonial.',
    },
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
      effectDetail:
        'Despliegue de élite: Zacian-Crowned, Dragapult, Tyranitar y Gallade.',
    });
    traces.push({
      id: 'ch1-set',
      category: 'player-set',
      choiceLabel:
        mixedRole === 'special' ? 'Enfoque Especial' : 'Enfoque Físico',
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
      effectDetail:
        'Sobrevives la emboscada con Arcanine, Gardevoir, Milotic y Corviknight.',
    });
    traces.push({
      id: 'ch1-set',
      category: 'player-set',
      choiceLabel:
        mixedRole === 'special' ? 'Enfoque Especial' : 'Enfoque Físico',
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
  // Boss Ace in Sabotage: Clefairy Lv.104 breaks the Lv.100 level cap!
  const clefairyAce: ShowdownSetBlock = {
    nickname: 'Clefairy ★',
    species: 'Clefairy',
    item: 'Eviolite',
    ability: 'Friend Guard',
    level: 104,
    evs: '252 HP / 252 Def / 4 SpD',
    nature: 'Bold',
    moves: ['Follow Me', 'Helping Hand', 'Moonblast', 'Protect'],
  };
  // Boss Ace in Mirror: Ditto Lv.104 (higher HP stat when transformed!)
  const dittoAce: ShowdownSetBlock = {
    nickname: 'Ditto ★',
    species: 'Ditto',
    item: 'Choice Scarf',
    ability: 'Imposter',
    level: 104,
    evs: '252 HP / 4 Def / 252 Spe',
    nature: 'Jolly',
    moves: ['Transform'],
  };

  const rivalBlocks =
    assassinPlan === 'mirror'
      ? [smeargle, sableye, cottonee, dittoAce]
      : [smeargle, sableye, cottonee, clefairyAce];

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
        ? 'Sicario ≤400 BST: Protocolo Espejo Activado'
        : 'Sicario ≤400 BST: Escuadrón de Sabotaje',
    effectDetail:
      assassinPlan === 'mirror'
        ? 'Al exponer a los conspiradores, el sicario activó su Plan B encubierto. La inteligencia es parcial: solo sus dos líderes iniciales fueron avistados.'
        : 'El sicario opera con niebla táctica: el Servicio Secreto solo logró identificar 2 de sus 4 especies antes del apagón.',
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
    rivalTeamSummary: 'Inteligencia parcial: 2 de 4 especies avistadas',
    playerShowdownPaste: buildShowdownPaste(playerBlocks),
    rivalShowdownPaste: buildShowdownPaste(rivalBlocks),
    rivalIntel: {
      visibleSpeciesCount: 2,
      totalSlots: rivalBlocks.length,
      intelLabel: 'Inteligencia Parcial · 2/4 Especies',
      intelNote:
        'En capítulos avanzados y emboscadas encubiertas, la inteligencia del Servicio Secreto es limitada: solo conoces parte del equipo enemigo y nada de sus sets.',
      levelCap: 100,
      hasBossAce: true,
      bossAceWarning:
        'Amenaza Ace clasificada: el sicario reserva un Pokémon oculto que supera el límite Nv. 100 (+4 niveles sobre el cap).',
    },
    traces,
    flags,
  };
}
