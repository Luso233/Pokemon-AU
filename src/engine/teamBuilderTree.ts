import type {
  DecisionTraceItem,
  ResolvedBattleConfig,
  ScriptedEnemyRule,
  StoryFlags,
} from '../types/game';

export interface ShowdownSetBlock {
  nickname?: string;
  species: string;
  item?: string;
  ability: string;
  level: number;
  teraType?: string;
  evs?: string;
  ivs?: string;
  nature?: string;
  moves: string[];
}

/**
 * Compiles structured Pokémon set blocks into authentic Pokémon Showdown Teambuilder Paste text.
 * Supports Tera Type, EVs, IVs (e.g. `0 Atk`), Nature, Level, Item, Ability, and Nicknames.
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
      if (mon.teraType) {
        lines.push(`Tera Type: ${mon.teraType}`);
      }
      if (mon.evs) {
        lines.push(`EVs: ${mon.evs}`);
      }
      if (mon.nature) {
        lines.push(`${mon.nature} Nature`);
      }
      if (mon.ivs) {
        lines.push(`IVs: ${mon.ivs}`);
      }
      for (const mv of mon.moves) {
        lines.push(`- ${mv}`);
      }
      return lines.join('\n');
    })
    .join('\n\n');
}

/* ===================== Exact Canonical 6v6 Teams (User Specification) ===================== */

function createBasePrinceTeam(): ShowdownSetBlock[] {
  return [
    {
      species: 'Arcanine',
      item: 'Sitrus Berry',
      ability: 'Intimidate',
      level: 100,
      teraType: 'Water',
      evs: '244 HP / 4 Atk / 108 Def / 4 SpA / 116 SpD / 32 Spe',
      nature: 'Careful',
      moves: ['Flare Blitz', 'Snarl', 'Will-O-Wisp', 'Protect'],
    },
    {
      species: 'Gardevoir',
      item: 'Light Clay',
      ability: 'Telepathy',
      level: 100,
      teraType: 'Steel',
      evs: '252 HP / 140 Def / 4 SpA / 108 SpD / 4 Spe',
      nature: 'Calm',
      ivs: '0 Atk',
      moves: ['Light Screen', 'Reflect', 'Dazzling Gleam', 'Heal Pulse'],
    },
    {
      species: 'Milotic',
      item: 'Leftovers',
      ability: 'Competitive',
      level: 100,
      teraType: 'Grass',
      evs: '252 HP / 172 Def / 4 SpA / 76 SpD / 4 Spe',
      nature: 'Calm',
      ivs: '0 Atk',
      moves: ['Scald', 'Icy Wind', 'Recover', 'Protect'],
    },
    {
      species: 'Corviknight',
      item: 'Rocky Helmet',
      ability: 'Mirror Armor',
      level: 100,
      teraType: 'Dragon',
      evs: '252 HP / 4 Atk / 164 Def / 84 SpD / 4 Spe',
      nature: 'Impish',
      moves: ['Brave Bird', 'Body Press', 'Tailwind', 'Roost'],
    },
    {
      species: 'Sylveon',
      item: 'Throat Spray',
      ability: 'Pixilate',
      level: 100,
      teraType: 'Fire',
      evs: '252 HP / 108 Def / 116 SpA / 28 SpD / 4 Spe',
      nature: 'Modest',
      ivs: '0 Atk',
      moves: ['Hyper Voice', 'Yawn', 'Helping Hand', 'Protect'],
    },
    {
      species: 'Rotom',
      item: 'Focus Sash',
      ability: 'Levitate',
      level: 100,
      teraType: 'Electric',
      evs: '4 HP / 252 SpA / 252 Spe',
      nature: 'Timid',
      ivs: '0 Atk',
      moves: ['Electroweb', 'Volt Switch', 'Will-O-Wisp', 'Protect'],
    },
  ];
}

function createBaseAssassinTeam(): ShowdownSetBlock[] {
  return [
    {
      species: 'Grafaiai',
      item: 'Focus Sash',
      ability: 'Prankster',
      level: 100,
      teraType: 'Dark',
      evs: '252 HP / 4 Def / 252 Spe',
      nature: 'Jolly',
      moves: ['Taunt', 'Encore', 'Knock Off', 'Gunk Shot'],
    },
    {
      species: 'Kingambit',
      item: 'Black Glasses',
      ability: 'Defiant',
      level: 100,
      teraType: 'Dark',
      evs: '252 HP / 252 Atk / 4 SpD',
      nature: 'Adamant',
      moves: ['Brick Break', 'Iron Head', 'Kowtow Cleave', 'Sucker Punch'],
    },
    {
      species: 'Slowking-Galar',
      item: 'Assault Vest',
      ability: 'Regenerator',
      level: 100,
      teraType: 'Water',
      evs: '252 HP / 4 Def / 252 SpA',
      nature: 'Modest',
      ivs: '0 Atk',
      moves: ['Psychic Noise', 'Sludge Bomb', 'Flamethrower', 'Ice Beam'],
    },
    {
      species: 'Gholdengo',
      item: 'Life Orb',
      ability: 'Good as Gold',
      level: 100,
      teraType: 'Steel',
      evs: '4 HP / 252 SpA / 252 Spe',
      nature: 'Timid',
      ivs: '0 Atk',
      moves: ['Make It Rain', 'Shadow Ball', 'Thunderbolt', 'Protect'],
    },
    {
      species: 'Heatran',
      item: 'Leftovers',
      ability: 'Flash Fire',
      level: 100,
      teraType: 'Grass',
      evs: '252 HP / 4 Def / 252 SpA',
      nature: 'Modest',
      ivs: '0 Atk',
      moves: ['Heat Wave', 'Flash Cannon', 'Earth Power', 'Protect'],
    },
    {
      species: 'Rillaboom',
      item: 'Miracle Seed',
      ability: 'Grassy Surge',
      level: 100,
      teraType: 'Fire',
      evs: '252 HP / 252 Atk / 4 SpD',
      nature: 'Adamant',
      moves: ['Fake Out', 'Grassy Glide', 'Wood Hammer', 'High Horsepower'],
    },
  ];
}

/* ===================== Chapter 01: Wyndon Alley Chase (Prince vs Assassin 6v6 Doubles) ===================== */

export function resolveChapter1ChaseBattle(
  flags: StoryFlags
): ResolvedBattleConfig {
  const chaseRoute = String(flags.chase_route ?? 'main_alley');
  const sabotagePlan = String(flags.sabotage_plan ?? 'no_trap');
  const princePrep = String(flags.prince_prep ?? 'palace_standard');
  const mindGame = String(flags.mind_game ?? 'cold_silence');

  const traces: DecisionTraceItem[] = [];
  let princeTeam = createBasePrinceTeam();
  let assassinTeam = createBaseAssassinTeam();

  let visibleSpeciesCount = 2;
  let arenaTheme: ResolvedBattleConfig['arenaTheme'] = 'clocktower-ruins';
  let intelNote =
    'Emboscada directa: el Asesino te acorraló sin darte tiempo de espiar su equipo. Solo 2 de 6 especies son visibles en el briefing.';

  /* --- Decision 1: Chase Route -> Lead order & Briefing Intel --- */
  if (chaseRoute === 'rooftops') {
    visibleSpeciesCount = 4;
    intelNote =
      'Desde los tejados identificaste 4 de sus 6 Pokémon y rompiste su apertura counter (forzaste un lead menos agresivo).';
    // Reorder Assassin team so Heatran + Slowking-Galar lead instead of Grafaiai + Kingambit!
    const heatran = assassinTeam.find((m) => m.species === 'Heatran')!;
    const slowking = assassinTeam.find((m) => m.species === 'Slowking-Galar')!;
    const rest = assassinTeam.filter(
      (m) => m.species !== 'Heatran' && m.species !== 'Slowking-Galar'
    );
    assassinTeam = [heatran, slowking, ...rest];

    traces.push({
      id: 'chase-route',
      category: 'rival-team',
      choiceLabel: 'Escapar por los tejados con Corviknight',
      flagKey: 'chase_route',
      flagValue: 'rooftops',
      effectTitle: 'Inteligencia 4/6 + Lead rival desordenado',
      effectDetail:
        'Evitaste la apertura mortal Grafaiai + Kingambit; el Asesino entra descolocado y revelas 4 especies en el briefing.',
    });
  } else if (chaseRoute === 'aqueducts') {
    visibleSpeciesCount = 3;
    arenaTheme = 'aqueduct-tunnels';
    intelNote =
      'En los acueductos avistaste 3 de sus 6 especies y reordenaste tu equipo para abrir con Milotic + Rotom (esquivando Defiant en Turno 1).';
    // Reorder Prince team so Milotic + Rotom lead instead of Arcanine + Gardevoir (dodges Kingambit Defiant + Grafaiai Taunt!)
    const milotic = princeTeam.find((m) => m.species === 'Milotic')!;
    const rotom = princeTeam.find((m) => m.species === 'Rotom')!;
    const rest = princeTeam.filter(
      (m) => m.species !== 'Milotic' && m.species !== 'Rotom'
    );
    princeTeam = [milotic, rotom, ...rest];

    traces.push({
      id: 'chase-route',
      category: 'player-roster',
      choiceLabel: 'Bajar a los acueductos con Milotic y Rotom',
      flagKey: 'chase_route',
      flagValue: 'aqueducts',
      effectTitle: 'Lead seguro: Milotic + Rotom (+Inteligencia 3/6)',
      effectDetail:
        'Al guardar a Arcanine en la banca, no activas el Defiant (+2 Atk) de Kingambit al iniciar el combate.',
    });
  } else {
    arenaTheme = 'wyndon-alleys';
    traces.push({
      id: 'chase-route',
      category: 'rival-team',
      choiceLabel: 'Correr directo por el callejón principal',
      flagKey: 'chase_route',
      flagValue: 'main_alley',
      effectTitle: 'Emboscada frontal (Inteligencia mínima 2/6)',
      effectDetail:
        'El Asesino dicta la apertura con su pareja counter diseñada para castigar a Arcanine + Gardevoir.',
    });
  }

  /* --- Decision 2: Sabotage -> Weakens Assassin's Counter Sets/Items (or triggers Boss Ace Lv.103!) --- */
  let hasBossAce = false;
  let bossAceWarning: string | undefined;

  if (sabotagePlan === 'vapor_trap') {
    const grafaiai = assassinTeam.find((m) => m.species === 'Grafaiai');
    const gholdengo = assassinTeam.find((m) => m.species === 'Gholdengo');
    if (grafaiai) grafaiai.item = undefined;
    if (gholdengo) gholdengo.item = undefined;

    traces.push({
      id: 'chase-sabotage',
      category: 'rival-team',
      choiceLabel: 'Sobrecargar válvulas de vapor con Rotom',
      flagKey: 'sabotage_plan',
      flagValue: 'vapor_trap',
      effectTitle: 'Sabotaje exitoso: Objetos clave destruidos',
      effectDetail:
        'El vapor inutilizó el Focus Sash de Grafaiai y la Life Orb de Gholdengo, reduciendo enormemente su presión.',
    });
  } else if (sabotagePlan === 'rubble_decoy') {
    const kingambit = assassinTeam.find((m) => m.species === 'Kingambit');
    const rillaboom = assassinTeam.find((m) => m.species === 'Rillaboom');
    if (kingambit) {
      kingambit.item = undefined;
      kingambit.moves = kingambit.moves.map((m) =>
        m === 'Brick Break' ? 'Night Slash' : m
      );
    }
    if (rillaboom) rillaboom.item = undefined;

    traces.push({
      id: 'chase-sabotage',
      category: 'rival-team',
      choiceLabel: 'Derrumbar andamio sobre su vanguardia',
      flagKey: 'sabotage_plan',
      flagValue: 'rubble_decoy',
      effectTitle: 'Sabotaje exitoso: Rompepantallas anulado',
      effectDetail:
        'Kingambit perdió Black Glasses y Brick Break (ya no puede romper tus pantallas) y Rillaboom perdió Miracle Seed.',
    });
  } else {
    // Hardcore untouched rival -> Kingambit becomes Lv.103 Boss Ace!
    const kingambit = assassinTeam.find((m) => m.species === 'Kingambit');
    if (kingambit) {
      kingambit.nickname = 'Kingambit ★';
      kingambit.level = 103;
    }
    hasBossAce = true;
    bossAceWarning =
      'Sin sabotaje previo, el Asesino llega al 100% de su potencia: su Ace rompe el límite de nivel (Nv. 103) con sus sets counter intactos.';

    traces.push({
      id: 'chase-sabotage',
      category: 'rival-team',
      choiceLabel: 'No poner trampas (correr directo)',
      flagKey: 'sabotage_plan',
      flagValue: 'no_trap',
      effectTitle: 'Rival intacto + Ace Nv. 103 (Modo Desafío)',
      effectDetail:
        'El Asesino conserva todos sus objetos, EVs y movimientos counter exactos, y su Ace supera el cap Nv. 100.',
    });
  }

  /* --- Decision 3: Prince Tactical Prep -> Upgrades Prince's sets to fight back --- */
  if (princePrep === 'anti_taunt') {
    const gardevoir = princeTeam.find((m) => m.species === 'Gardevoir');
    const arcanine = princeTeam.find((m) => m.species === 'Arcanine');
    const sylveon = princeTeam.find((m) => m.species === 'Sylveon');
    if (gardevoir) gardevoir.item = 'Mental Herb';
    if (arcanine) {
      arcanine.moves = ['Flare Blitz', 'Close Combat', 'Snarl', 'Protect'];
    }
    if (sylveon) {
      sylveon.moves = ['Hyper Voice', 'Mystical Fire', 'Helping Hand', 'Protect'];
    }

    traces.push({
      id: 'chase-prep',
      category: 'player-set',
      choiceLabel: 'Protocolo Anti-Mofa y Cobertura',
      flagKey: 'prince_prep',
      flagValue: 'anti_taunt',
      effectTitle: 'Gardevoir @ Mental Herb + Close Combat / Mystical Fire',
      effectDetail:
        'Gardevoir ignora la Mofa Turno 1 de Grafaiai para poner pantallas gratis; Arcanine gana Close Combat (x4 vs Kingambit) y Sylveon gana Mystical Fire.',
    });
  } else if (princePrep === 'anti_steel') {
    const gardevoir = princeTeam.find((m) => m.species === 'Gardevoir');
    const arcanine = princeTeam.find((m) => m.species === 'Arcanine');
    const rotom = princeTeam.find((m) => m.species === 'Rotom');
    if (arcanine) {
      arcanine.moves = ['Flare Blitz', 'Close Combat', 'Will-O-Wisp', 'Protect'];
    }
    if (gardevoir) {
      gardevoir.moves = ['Light Screen', 'Reflect', 'Dazzling Gleam', 'Mystical Fire'];
    }
    if (rotom) {
      rotom.moves = ['Shadow Ball', 'Volt Switch', 'Will-O-Wisp', 'Protect'];
    }

    traces.push({
      id: 'chase-prep',
      category: 'player-set',
      choiceLabel: 'Reconfiguración Rompe-Acero',
      flagKey: 'prince_prep',
      flagValue: 'anti_steel',
      effectTitle: 'Cobertura directa vs Kingambit, Gholdengo y Heatran',
      effectDetail:
        'Arcanine aprende Close Combat, Gardevoir cambia Heal Pulse por Mystical Fire y Rotom equipa Shadow Ball.',
    });
  } else {
    traces.push({
      id: 'chase-prep',
      category: 'player-set',
      choiceLabel: 'Mantener sets exactos de palacio',
      flagKey: 'prince_prep',
      flagValue: 'palace_standard',
      effectTitle: 'Equipo de Vida Diaria Original (6/6 exactos)',
      effectDetail:
        'Conservas tus 6 movesets y objetos originales de palacio sin alteraciones.',
    });
  }

  /* --- Decision 4: Mind Game -> Scripted Turn AI Rules (Trickable Patterns!) --- */
  const scriptedEnemyRules: ScriptedEnemyRule[] = [];
  let aiScriptHint: string | undefined;

  if (mindGame === 'provoke') {
    aiScriptHint =
      'Lectura psicológica: el Asesino está furioso. En Turno 1 forzará Mofa (o un golpe directo) al Slot 1, y su Kingambit usará Sucker Punch SIEMPRE que baje de 60% PS — ¡úsalo a tu favor con movimientos de estado/Protección!';

    scriptedEnemyRules.push(
      {
        id: 'provoked-t1-taunt',
        turn: 1,
        actorSpecies: 'Grafaiai',
        forceMoveId: 'taunt',
        targetSpec: 'slot:1',
        once: true,
        description:
          'Turno 1 scripteado: Grafaiai usa Taunt impulsivamente sobre tu Slot 1.',
        tauntLine:
          '«¡Dijiste trucos sucios?! ¡Te cerraré la boca desde el primer segundo! ¡Grafaiai, Mofa al frente!»',
      },
      {
        id: 'provoked-t1-heatwave',
        turn: 1,
        actorSpecies: 'Heatran',
        forceMoveId: 'heatwave',
        once: true,
        description:
          'Turno 1 scripteado: Heatran abre agresivamente con Heat Wave.',
        tauntLine:
          '«¡Ardan todos de una vez! ¡Heatran, Onda Ígnea sin contemplaciones!»',
      },
      {
        id: 'provoked-kingambit-sucker-bait',
        actorSpecies: 'Kingambit',
        condition: 'hpBelow60',
        forceMoveId: 'suckerpunch',
        targetSpec: 'slot:1',
        description:
          'Patrón explotable: Kingambit (<60% PS) siempre fuerza Sucker Punch (falla si usas Estado o Protección).',
        tauntLine:
          '«¡No me importa recibir daño, caerás antes de parpadear! ¡Kingambit, Golpe Bajo!»',
      }
    );

    traces.push({
      id: 'chase-mindgame',
      category: 'ai-script',
      choiceLabel: 'Provocar el orgullo del Asesino',
      flagKey: 'mind_game',
      flagValue: 'provoke',
      effectTitle: 'IA Scripteada Impulsiva (Explotable)',
      effectDetail:
        'Su rabia telegrafía sus turnos: Grafaiai dispara Mofa a Slot 1 y Kingambit spamea Sucker Punch bajo 60% PS (burlable con Will-O-Wisp/Protect).',
    });
  } else if (mindGame === 'feign_panic') {
    aiScriptHint =
      'Lectura psicológica: el Asesino cree que estás aterrado. En Turno 1 enfocará toda su codicia en tu Slot 1 (Fake Out / Gunk Shot / Kowtow Cleave) — ¡un Protect en Slot 1 o cambio a Rotom desperdicia su turno!';

    scriptedEnemyRules.push(
      {
        id: 'panic-t1-gunkshot',
        turn: 1,
        actorSpecies: 'Grafaiai',
        forceMoveId: 'gunkshot',
        targetSpec: 'slot:1',
        once: true,
        description:
          'Turno 1 scripteado (Codicia): Grafaiai ataca directo con Gunk Shot a Slot 1 en vez de usar Mofa.',
        tauntLine:
          '«¡Está temblando! Ni siquiera necesita Mofa: ¡Grafaiai, Lanza Mugre directo al líder!»',
      },
      {
        id: 'panic-t1-kowtow',
        turn: 1,
        actorSpecies: 'Kingambit',
        forceMoveId: 'kowtowcleave',
        targetSpec: 'slot:1',
        once: true,
        description:
          'Turno 1 scripteado (Codicia): Kingambit intenta rematar a tu Slot 1 con Kowtow Cleave.',
        tauntLine:
          '«¡Acaba con su guardaespaldas primero! ¡Kingambit, Genuflexión!»',
      },
      {
        id: 'panic-rillaboom-fakeout',
        actorSpecies: 'Rillaboom',
        forceMoveId: 'fakeout',
        targetSpec: 'slot:1',
        once: true,
        description:
          'Patrón explotable: Rillaboom siempre usa Fake Out al entrar sobre tu Slot 1 (inmune si entra Rotom o usas Protect).',
        tauntLine:
          '«¡No te muevas! ¡Rillaboom, Sorpresa al flanco izquierdo!»',
      }
    );

    traces.push({
      id: 'chase-mindgame',
      category: 'ai-script',
      choiceLabel: 'Fingir pánico para atraerlo',
      flagKey: 'mind_game',
      flagValue: 'feign_panic',
      effectTitle: 'IA Scripteada Codiciosa (Trampa de Turno 1)',
      effectDetail:
        'Renuncia a Mofa en Turno 1 para atacar directo a tu Slot 1. Puedes anular su turno entero con Protect o pivote a Rotom.',
    });
  } else {
    aiScriptHint =
      'Sin lectura emocional: el Asesino ejecutará su protocolo táctico frío (Mofa sobre Gardevoir en Turno 1, Brick Break si levantas pantallas y Fake Out al entrar Rillaboom).';

    scriptedEnemyRules.push(
      {
        id: 'cold-t1-taunt-gardevoir',
        turn: 1,
        actorSpecies: 'Grafaiai',
        condition: 'playerHasSpecies',
        requiredPlayerSpecies: 'Gardevoir',
        forceMoveId: 'taunt',
        targetSpec: 'species:Gardevoir',
        once: true,
        description:
          'Turno 1 scripteado: Grafaiai prioriza Mofa directo sobre Gardevoir para bloquear pantallas.',
        tauntLine:
          '«¿Crees que te dejaré levantar Reflejo y Pantalla de Luz? ¡Grafaiai, Mofa a Gardevoir!»',
      },
      {
        id: 'cold-kingambit-brickbreak',
        actorSpecies: 'Kingambit',
        condition: 'playerHasScreens',
        forceMoveId: 'brickbreak',
        targetSpec: 'auto',
        once: true,
        description:
          'Reacción scripteada: Al detectar pantallas activas, Kingambit ejecuta Brick Break para destruirlas.',
        tauntLine:
          '«Barreras inútiles. ¡Kingambit, parte esas pantallas con Demolición!»',
      },
      {
        id: 'cold-rillaboom-fakeout',
        actorSpecies: 'Rillaboom',
        forceMoveId: 'fakeout',
        targetSpec: 'species:Milotic',
        once: true,
        description:
          'Entrada scripteada: Rillaboom intenta neutralizar a Milotic con Fake Out.',
        tauntLine:
          '«Control de ritmo. ¡Rillaboom, frena a ese Milotic con Sorpresa!»',
      }
    );

    traces.push({
      id: 'chase-mindgame',
      category: 'ai-script',
      choiceLabel: 'Guardar silencio absoluto',
      flagKey: 'mind_game',
      flagValue: 'cold_silence',
      effectTitle: 'IA Scripteada Metódica (Protocolo Óptimo)',
      effectDetail:
        'El Asesino sigue su guion profesional: Mofa a Gardevoir en Turno 1 y Demolición inmediata si levantas pantallas.',
    });
  }

  return {
    chapterId: 'ch1-wyndon-chase',
    format: 'doubles',
    formatId: 'gen9doublescustomgame',
    playerName: 'Príncipe Heredero',
    playerCharId: 'prince',
    rivalName: 'Asesino Carmesí',
    rivalTitle: 'Cazador de la Corona · Anti-Counter 6v6',
    rivalCharId: 'assassin',
    arenaTheme,
    playerTeamSummary:
      princePrep === 'palace_standard'
        ? 'Equipo de Vida Diaria (6/6 Sets Originales · Tera habilitado)'
        : princePrep === 'anti_taunt'
          ? 'Equipo de Vida Diaria (Gardevoir Mental Herb + Cobertura Anti-Acero)'
          : 'Equipo de Vida Diaria (Reconfiguración Rompe-Acero)',
    rivalTeamSummary: `Inteligencia: ${visibleSpeciesCount}/6 especies avistadas (sets ocultos)`,
    playerShowdownPaste: buildShowdownPaste(princeTeam),
    rivalShowdownPaste: buildShowdownPaste(assassinTeam),
    rivalIntel: {
      visibleSpeciesCount,
      totalSlots: assassinTeam.length,
      intelLabel: `Inteligencia · ${visibleSpeciesCount}/${assassinTeam.length} Especies`,
      intelNote,
      levelCap: 100,
      hasBossAce,
      bossAceWarning,
      aiScriptHint,
    },
    scriptedEnemyRules,
    traces,
    flags,
  };
}

/* ===================== Chapter 02 Bonus: Banquet Ambush (<=400 BST Showdown Dirty Sets) ===================== */

export function resolveChapter2BanquetBattle(
  flags: StoryFlags
): ResolvedBattleConfig {
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
            teraType: 'Ghost',
            evs: '252 SpA / 4 SpD / 252 Spe',
            nature: 'Timid',
            moves: ['Draco Meteor', 'Shadow Ball', 'Flamethrower', 'U-turn'],
          }
        : {
            species: 'Dragapult',
            item: 'Life Orb',
            ability: 'Clear Body',
            level: 100,
            teraType: 'Dragon',
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
        teraType: 'Flying',
        evs: '252 HP / 252 Atk / 4 SpD',
        nature: 'Adamant',
        moves: ['Rock Slide', 'Crunch', 'Low Kick', 'Sucker Punch'],
      },
      {
        species: 'Gallade',
        item: 'Life Orb',
        ability: 'Sharpness',
        level: 100,
        teraType: 'Fighting',
        evs: '252 Atk / 4 SpD / 252 Spe',
        nature: 'Jolly',
        moves: ['Sacred Sword', 'Psycho Cut', 'Wide Guard', 'Protect'],
      },
    ];

    traces.push({
      id: 'ch2-roster',
      category: 'player-roster',
      choiceLabel: 'Código Corona (Teletransporte)',
      flagKey: 'team_mode',
      flagValue: 'combat',
      effectTitle: 'Equipo de Combate del Heredero',
      effectDetail:
        'Despliegue de élite: Zacian-Crowned, Dragapult, Tyranitar y Gallade.',
    });
    traces.push({
      id: 'ch2-set',
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
          ? 'Configurado con 252 SpA, Draco Meteor, Shadow Ball y Flamethrower.'
          : 'Configurado con 252 Atk, Dragon Darts y Phantom Force.',
    });
  } else {
    playerBlocks = createBasePrinceTeam().slice(0, 4);
    if (mixedRole === 'special') {
      playerBlocks[0] = {
        ...playerBlocks[0],
        nature: 'Modest',
        evs: '244 HP / 140 SpA / 124 Spe',
        moves: ['Heat Wave', 'Snarl', 'Will-O-Wisp', 'Protect'],
      };
    }

    traces.push({
      id: 'ch2-roster',
      category: 'player-roster',
      choiceLabel: 'Protocolo Civil (Emboscada)',
      flagKey: 'team_mode',
      flagValue: 'daily',
      effectTitle: 'Equipo de Vida Diaria (Protección)',
      effectDetail:
        'Sobrevives la emboscada con Arcanine, Gardevoir, Milotic y Corviknight.',
    });
    traces.push({
      id: 'ch2-set',
      category: 'player-set',
      choiceLabel:
        mixedRole === 'special' ? 'Enfoque Especial' : 'Enfoque Físico',
      flagKey: 'mixed_role',
      flagValue: mixedRole,
      effectTitle:
        mixedRole === 'special'
          ? 'Arcanine Soporte Especial (Heat Wave + Snarl)'
          : 'Arcanine Guardaespaldas Físico (Flare Blitz + Snarl)',
      effectDetail: 'Ajuste de rol ofensivo/soporte en el equipo civil.',
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
    id: 'ch2-rival',
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
      'Inteligencia parcial: solo 2 de 4 especies avistadas antes del apagón.',
  });

  const scriptedEnemyRules: ScriptedEnemyRule[] = [
    {
      id: 'ch2-t1-fakeout',
      turn: 1,
      actorSpecies: 'Smeargle',
      forceMoveId: 'fakeout',
      targetSpec: 'slot:1',
      once: true,
      description: 'Turno 1 scripteado: Smeargle intenta frenar tu Slot 1 con Fake Out.',
      tauntLine: '«¡No te apresures! ¡Smeargle, Sorpresa al frente!»',
    },
    {
      id: 'ch2-t1-wisp',
      turn: 1,
      actorSpecies: 'Sableye',
      forceMoveId: 'willowisp',
      targetSpec: 'slot:1',
      once: true,
      description: 'Turno 1 scripteado: Sableye usa Fuego Fatuo con Bromista.',
      tauntLine: '«Arde lentamente, Alteza. ¡Sableye, Fuego Fatuo!»',
    },
  ];

  return {
    chapterId: 'ch2-banquet-ambush',
    format: 'doubles',
    formatId: 'gen9doublescustomgame',
    playerName: 'Príncipe Heredero',
    playerCharId: 'prince',
    rivalName: 'Sicario de la Corte',
    rivalTitle: 'Agente Encubierto (≤400 BST)',
    rivalCharId: 'assassin',
    arenaTheme: 'banquet-hall',
    playerTeamSummary:
      teamMode === 'combat'
        ? `Equipo de Combate (Zacian + Dragapult ${mixedRole === 'special' ? 'SpA' : 'Atk'})`
        : `Equipo de Vida Diaria (Arcanine ${mixedRole === 'special' ? 'SpA' : 'Atk'})`,
    rivalTeamSummary: 'Inteligencia parcial: 2 de 4 especies avistadas',
    playerShowdownPaste: buildShowdownPaste(playerBlocks),
    rivalShowdownPaste: buildShowdownPaste(rivalBlocks),
    rivalIntel: {
      visibleSpeciesCount: 2,
      totalSlots: rivalBlocks.length,
      intelLabel: 'Inteligencia Parcial · 2/4 Especies',
      intelNote:
        'Durante el apagón diplomático solo identificaste 2 de sus 4 Pokémon.',
      levelCap: 100,
      hasBossAce: true,
      bossAceWarning:
        'Amenaza Ace clasificada: el sicario reserva un Pokémon oculto Nv. 104.',
      aiScriptHint:
        'Smeargle y Sableye abren con un guion de Fake Out + Will-O-Wisp sobre tu Slot 1 en Turno 1.',
    },
    scriptedEnemyRules,
    traces,
    flags,
  };
}
