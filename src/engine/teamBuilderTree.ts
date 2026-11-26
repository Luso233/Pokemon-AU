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
    formatLabel: '6v6 Dobles · Tera',
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
    formatLabel: 'Dobles 2v2 · ≤400 BST',
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



/* ===================== Puzzle 01: La Trampa del Sol (3v3 Dobles con PuzzleConditions) ===================== */

export function resolvePuzzle1SunTrapBattle(
  flags: StoryFlags
): ResolvedBattleConfig {
  const showHint = String(flags.puzzle_hint ?? 'show') !== 'hide';

  const playerBlocks: ShowdownSetBlock[] = [
    {
      species: 'Inkay',
      item: 'Focus Sash',
      ability: 'Contrary',
      level: 100,
      evs: '252 HP / 4 Def / 252 SpD',
      nature: 'Sassy',
      moves: ['Topsy-Turvy', 'Trick Room', 'Foul Play', 'Protect'],
    },
    {
      species: 'Sableye',
      item: 'Sitrus Berry',
      ability: 'Prankster',
      level: 100,
      evs: '252 HP / 252 Def / 4 SpD',
      nature: 'Impish',
      moves: ['Fake Out', 'Foul Play', 'Quash', 'Protect'],
    },
    {
      species: 'Ditto',
      item: 'Choice Scarf',
      ability: 'Imposter',
      level: 100,
      evs: '252 HP / 4 Def / 252 Spe',
      nature: 'Jolly',
      moves: ['Transform'],
    },
  ];

  const rivalBlocks: ShowdownSetBlock[] = [
    {
      species: 'Metagross-Mega',
      ability: 'Tough Claws',
      level: 100,
      evs: '252 Atk / 4 Def / 252 Spe',
      nature: 'Jolly',
      moves: ['Meteor Mash', 'Bullet Punch', 'Ice Punch', 'Protect'],
    },
    {
      species: 'Volcarona',
      item: 'Heavy-Duty Boots',
      ability: 'Flame Body',
      level: 100,
      evs: '4 HP / 252 SpA / 252 Spe',
      nature: 'Timid',
      ivs: '0 Atk',
      moves: ['Heat Wave', 'Bug Buzz', 'Giga Drain', 'Protect'],
    },
    {
      species: 'Garchomp',
      item: 'Life Orb',
      ability: 'Rough Skin',
      level: 100,
      evs: '252 Atk / 4 Def / 252 Spe',
      nature: 'Jolly',
      moves: ['Dragon Claw', 'Earthquake', 'Rock Slide', 'Protect'],
    },
  ];

  const scriptedEnemyRules: ScriptedEnemyRule[] = [
    {
      id: 'puzzle1-t1-volcarona-heatwave',
      turn: 1,
      actorSpecies: 'Volcarona',
      forceMoveId: 'heatwave',
      once: true,
      description: 'Turno 1 scripteado: Volcarona (+2 SpA/+2 Spe bajo Sol) usa Heat Wave.',
      tauntLine: '«¡El sol quema todo! ¡Volcarona, arrasa el campo con Onda Ígnea!»',
    },
    {
      id: 'puzzle1-t1-metagross-mash',
      turn: 1,
      actorSpecies: 'Metagross-Mega',
      forceMoveId: 'meteormash',
      targetSpec: 'species:Inkay',
      once: true,
      description: 'Turno 1 scripteado: Mega Metagross (+2 Atk/+1 Spe) lanza Meteor Mash sobre Inkay.',
      tauntLine: '«Eliminen a ese pequeño calamar primero. ¡Mega Metagross, Puño Meteoro a Inkay!»',
    },
    {
      id: 'puzzle1-t2-metagross-bp',
      turn: 2,
      actorSpecies: 'Metagross-Mega',
      forceMoveId: 'bulletpunch',
      targetSpec: 'species:Inkay',
      once: true,
      description: 'Turno 2 scripteado: Mega Metagross remata a Inkay con Bullet Punch.',
      tauntLine: '«¿Sigues de pie por tu Banda Focus? ¡Mega Metagross, Puño Bala a Inkay!»',
    },
    {
      id: 'puzzle1-t2-volcarona-heatwave',
      turn: 2,
      actorSpecies: 'Volcarona',
      forceMoveId: 'heatwave',
      once: true,
      description: 'Turno 2 scripteado: Volcarona repite Heat Wave bajo el Sol Intenso.',
      tauntLine: '«¡No hay escapatoria del calor! ¡Otra Onda Ígnea, Volcarona!»',
    },
    {
      id: 'puzzle1-t3-garchomp-eq',
      turn: 3,
      actorSpecies: 'Garchomp',
      forceMoveId: 'earthquake',
      once: true,
      description: 'Turno 3 scripteado: Garchomp entra presionando con Earthquake.',
      tauntLine: '«¡Terminemos este acertijo con Terremoto!»',
    },
  ];

  const traces: DecisionTraceItem[] = [
    {
      id: 'pz1-field',
      category: 'rival-team',
      choiceLabel: 'Condiciones de Arena Pre-Combate',
      flagKey: 'puzzle_field',
      flagValue: 'sun+tw+sr',
      effectTitle: 'Sol Intenso + Viento Afín (Rival) + Trampa Rocas (Aliado)',
      effectDetail:
        'Comienzas en desventaja masiva: Sableye inicia herido al 65% PS y las rocas castigan cualquier cambio.',
    },
    {
      id: 'pz1-boosts',
      category: 'rival-team',
      choiceLabel: 'Amenazas Pre-Boosteadas',
      flagKey: 'puzzle_boosts',
      flagValue: 'mega+quiver',
      effectTitle: 'Mega Metagross (+2 Atk/+1 Spe) & Volcarona (+2 SpA/+2 SpD/+2 Spe)',
      effectDetail:
        'Ambas amenazas rivales ya están potenciadas desde el Turno 1. Fuerza bruta no basta: usa Topsy-Turvy, Fake Out, Foul Play y Ditto.',
    },
    {
      id: 'pz1-ai',
      category: 'ai-script',
      choiceLabel: showHint ? 'Analizar patrón del Puzzle' : 'Modo Puzzle Puro',
      flagKey: 'puzzle_hint',
      flagValue: showHint ? 'show' : 'hide',
      effectTitle: 'Turnos 1 y 2 100% Scripteados',
      effectDetail: showHint
        ? 'T1: Volcarona Heat Wave + Metagross Meteor Mash a Inkay. T2: Metagross Bullet Punch a Inkay + Volcarona Heat Wave.'
        : 'Ocultaste la pista táctica. Lee el comportamiento enemigo en vivo.',
    },
  ];

  return {
    chapterId: 'puzzle-01-sun-trap',
    format: 'doubles',
    formatId: 'gen9doublescustomgame',
    formatLabel: 'Puzzle 3v3 Dobles',
    playerName: 'Príncipe Heredero',
    playerCharId: 'prince',
    rivalName: 'Asesino Carmesí',
    rivalTitle: 'Prueba Táctica · La Trampa del Sol',
    rivalCharId: 'assassin',
    arenaTheme: 'sunlit-courtyard',
    playerTeamSummary: 'Inkay (Focus Sash), Sableye (65% PS), Ditto (Choice Scarf)',
    rivalTeamSummary: 'Mega Metagross (+2/+1), Volcarona (+2/+2/+2), Garchomp',
    playerShowdownPaste: buildShowdownPaste(playerBlocks),
    rivalShowdownPaste: buildShowdownPaste(rivalBlocks),
    rivalIntel: {
      visibleSpeciesCount: 3,
      totalSlots: 3,
      intelLabel: 'Puzzle Táctico · 3/3 Especies',
      intelNote:
        'En los Puzzles Tácticos conoces las especies en campo y las condiciones iniciales para diseñar la jugada perfecta.',
      levelCap: 100,
      hasBossAce: false,
      aiScriptHint: showHint
        ? 'Guion confirmado — T1: Volcarona usa Heat Wave y Mega Metagross usa Meteor Mash a Inkay. T2: Mega Metagross usa Bullet Punch a Inkay y Volcarona usa Heat Wave.'
        : 'IA scripteada activa en Turnos 1 y 2 (pistas ocultas por tu elección).',
    },
    puzzleConditions: {
      weather: 'sunnyday',
      sideConditions: {
        p1: ['stealthrock'],
        p2: ['tailwind'],
      },
      pokemonModifiers: [
        {
          side: 'p2',
          slotOrSpecies: 'Metagross-Mega',
          preMega: true,
          boosts: { atk: 2, spe: 1 },
        },
        {
          side: 'p2',
          slotOrSpecies: 'Volcarona',
          boosts: { spa: 2, spd: 2, spe: 2 },
        },
        {
          side: 'p1',
          slotOrSpecies: 'Sableye',
          hpPercent: 65,
        },
      ],
    },
    scriptedEnemyRules,
    traces,
    flags,
  };
}



/* ===================== Flashback Little Cup: Príncipe 6 años (Nv. 5) vs La Campeona (Nv. 6–7) ===================== */

export function resolveChampionLittleCupBattle(
  flags: StoryFlags
): ResolvedBattleConfig {
  const leadChoice = String(flags.lc_lead ?? 'larvesta');

  let princeBlocks: ShowdownSetBlock[] = [
    {
      species: 'Larvesta',
      item: 'Eviolite',
      ability: 'Flame Body',
      level: 5,
      evs: '76 HP / 236 Def / 156 SpD / 36 Spe',
      nature: 'Impish',
      moves: ['Flare Blitz', 'U-turn', 'Will-O-Wisp', 'Morning Sun'],
    },
    {
      species: 'Growlithe',
      item: 'Eviolite',
      ability: 'Intimidate',
      level: 5,
      evs: '236 HP / 156 Def / 116 SpD',
      nature: 'Impish',
      moves: ['Flare Blitz', 'Crunch', 'Will-O-Wisp', 'Morning Sun'],
    },
    {
      species: 'Rookidee',
      item: 'Eviolite',
      ability: 'Keen Eye',
      level: 5,
      evs: '196 HP / 156 Def / 156 SpD',
      nature: 'Careful',
      moves: ['Brave Bird', 'Bulk Up', 'Roost', 'Taunt'],
    },
    {
      species: 'Larvitar',
      item: 'Berry Juice',
      ability: 'Guts',
      level: 5,
      evs: '36 HP / 244 Atk / 36 Def / 196 Spe',
      nature: 'Jolly',
      moves: ['Dragon Dance', 'Rock Blast', 'Earthquake', 'Crunch'],
    },
    {
      species: 'Gible',
      item: 'Choice Scarf',
      ability: 'Rough Skin',
      level: 5,
      evs: '196 Atk / 36 Def / 36 SpD / 236 Spe',
      nature: 'Jolly',
      moves: ['Outrage', 'Earthquake', 'Rock Slide', 'Iron Head'],
    },
    {
      species: 'Ralts',
      item: 'Focus Sash',
      ability: 'Trace',
      level: 5,
      evs: '36 HP / 236 SpA / 236 Spe',
      nature: 'Timid',
      moves: ['Psyshock', 'Shadow Sneak', 'Will-O-Wisp', 'Destiny Bond'],
    },
  ];

  // Move chosen lead to slot 1
  if (leadChoice === 'larvitar' || leadChoice === 'rookidee') {
    const targetName = leadChoice === 'larvitar' ? 'Larvitar' : 'Rookidee';
    const picked = princeBlocks.find((m) => m.species === targetName)!;
    princeBlocks = [
      picked,
      ...princeBlocks.filter((m) => m.species !== targetName),
    ];
  }

  const championBlocks: ShowdownSetBlock[] = [
    {
      species: 'Onix',
      item: 'Berry Juice',
      ability: 'Sturdy',
      level: 6,
      evs: '76 HP / 236 Atk / 196 Spe',
      nature: 'Jolly',
      moves: ['Stealth Rock', 'Rock Blast', 'Earthquake', 'Taunt'],
    },
    {
      species: 'Mienfoo',
      item: 'Eviolite',
      ability: 'Regenerator',
      level: 6,
      evs: '156 Def / 116 SpD / 236 Spe',
      nature: 'Jolly',
      moves: ['Fake Out', 'High Jump Kick', 'Knock Off', 'U-turn'],
    },
    {
      species: 'Foongus',
      item: 'Eviolite',
      ability: 'Regenerator',
      level: 6,
      evs: '124 HP / 156 Def / 156 SpD / 72 Spe',
      nature: 'Bold',
      ivs: '0 Atk',
      moves: ['Spore', 'Giga Drain', 'Sludge Bomb', 'Clear Smog'],
    },
    {
      species: 'Gastly',
      item: 'Life Orb',
      ability: 'Levitate',
      level: 6,
      evs: '36 Def / 196 SpA / 76 SpD / 196 Spe',
      nature: 'Timid',
      ivs: '0 Atk',
      moves: ['Shadow Ball', 'Sludge Bomb', 'Dazzling Gleam', 'Energy Ball'],
    },
    {
      species: 'Pawniard',
      item: 'Eviolite',
      ability: 'Defiant',
      level: 6,
      evs: '156 Atk / 36 Def / 116 SpD / 196 Spe',
      nature: 'Jolly',
      moves: ['Swords Dance', 'Knock Off', 'Iron Head', 'Sucker Punch'],
    },
    {
      nickname: 'Vullaby ★',
      species: 'Vullaby',
      item: 'Eviolite',
      ability: 'Overcoat',
      level: 7,
      evs: '116 HP / 76 Atk / 76 Def / 236 Spe',
      nature: 'Jolly',
      moves: ['Brave Bird', 'Knock Off', 'Roost', 'Defog'],
    },
  ];

  const scriptedEnemyRules: ScriptedEnemyRule[] = [
    {
      id: 'lc-t1-onix-sr',
      turn: 1,
      actorSpecies: 'Onix',
      forceMoveId: 'stealthrock',
      once: true,
      description: 'Turno 1 scripteado: Onix Nv. 6 abre colocando Stealth Rock para romper Bandas Focus.',
      tauntLine: '«Primera lección de Little Cup, pequeño: controla el terreno. ¡Onix, Trampa Rocas!»',
    },
    {
      id: 'lc-t2-onix-rockblast',
      turn: 2,
      actorSpecies: 'Onix',
      forceMoveId: 'rockblast',
      once: true,
      description: 'Turno 2 scripteado: Onix presiona con Rock Blast.',
      tauntLine: '«Ahora veamos si sabes aguantar la presión. ¡Onix, Pedrada!»',
    },
    {
      id: 'lc-mienfoo-fakeout',
      actorSpecies: 'Mienfoo',
      forceMoveId: 'fakeout',
      once: true,
      description: 'Entrada scripteada: Mienfoo Nv. 6 siempre abre con Fake Out al pisar el campo.',
      tauntLine: '«Nunca descuides la prioridad. ¡Mienfoo, Sorpresa!»',
    },
  ];

  const traces: DecisionTraceItem[] = [
    {
      id: 'lc-lead-trace',
      category: 'player-roster',
      choiceLabel:
        leadChoice === 'larvitar'
          ? 'Abrir con Larvitar'
          : leadChoice === 'rookidee'
            ? 'Abrir con Rookidee'
            : 'Abrir con Larvesta',
      flagKey: 'lc_lead',
      flagValue: leadChoice,
      effectTitle: `Lead elegido: ${
        leadChoice === 'larvitar'
          ? 'Larvitar (Rock Blast vs Sturdy)'
          : leadChoice === 'rookidee'
            ? 'Rookidee (Taunt vs Stealth Rock)'
            : 'Larvesta (Flame Body)'
      }`,
      effectDetail:
        'Reordena tu equipo Nivel 5 para enfrentar a Onix Nv. 6 desde el Turno 1.',
    },
    {
      id: 'lc-cap-trace',
      category: 'rival-team',
      choiceLabel: 'Regla de Flashback (gen9customgame)',
      flagKey: 'lc_cap',
      flagValue: '5-vs-6/7',
      effectTitle: 'Cap Little Cup roto: Nv. 5 vs Nv. 6–7',
      effectDetail:
        'La Campeona usa 5 Pokémon Nv. 6 S-Tier y a su As Vullaby ★ Nv. 7. Guarda la Focus Sash de Ralts para Destiny Bond o busca un Dragon Dance con Larvitar.',
    },
    {
      id: 'lc-ai-trace',
      category: 'ai-script',
      choiceLabel: 'Lección de La Campeona',
      flagKey: 'lc_script',
      flagValue: 'onix-t1-sr',
      effectTitle: 'IA Scripteada: Onix abre con Stealth Rock en T1',
      effectDetail:
        'Puedes frenar las rocas con Rookidee (Taunt) o castigar a Onix con Larvitar (Rock Blast) antes de que entre Vullaby ★.',
    },
  ];

  return {
    chapterId: 'flashback-lc-champion',
    format: 'singles',
    formatId: 'gen9customgame',
    formatLabel: 'Little Cup Nv. 5 vs Nv. 6–7',
    playerName: 'Príncipe (6 años)',
    playerCharId: 'prince',
    rivalName: 'La Campeona',
    rivalTitle: 'Meta S-Tier Little Cup · Nv. 6–7',
    rivalCharId: 'champion',
    arenaTheme: 'royal-training-ground',
    playerTeamSummary: 'Crías Nv. 5 (Larvesta, Growlithe, Rookidee, Larvitar, Gible, Ralts)',
    rivalTeamSummary: 'Inteligencia parcial: 3/6 especies (Nv. 6 y Ace Nv. 7)',
    playerShowdownPaste: buildShowdownPaste(princeBlocks),
    rivalShowdownPaste: buildShowdownPaste(championBlocks),
    rivalIntel: {
      visibleSpeciesCount: 3,
      totalSlots: 6,
      intelLabel: 'Flashback LC · 3/6 Especies',
      intelNote:
        'Corriendo en gen9customgame para permitir que La Campeona rompa el cap Nv. 5 de Little Cup con su escuadrón Nv. 6 y su As Nv. 7.',
      levelCap: 5,
      hasBossAce: true,
      bossAceWarning:
        'Jefe Final Little Cup: el equipo de La Campeona está en Nv. 6 y su As (Vullaby ★) rompe el límite llegando al Nivel 7.',
      aiScriptHint:
        'Turno 1 scripteado: Onix siempre coloca Trampa Rocas. Evita activar Defiant de Pawniard con Growlithe y conserva a Ralts con Focus Sash + Destiny Bond para Vullaby Nv. 7.',
    },
    scriptedEnemyRules,
    traces,
    flags,
  };
}



/* ===================== Duelo 01: Duelo de Honor (gen91v1 · Bring 3, Pick 1) ===================== */

export function resolveDuel1Honor1v1Battle(
  flags: StoryFlags
): ResolvedBattleConfig {
  const rivalRead = String(flags.rival_read ?? 'ironcrown');
  const rivalSlot =
    rivalRead === 'skeledirge' ? 2 : rivalRead === 'urshifu' ? 3 : 1;

  const playerBlocks: ShowdownSetBlock[] = [
    {
      species: 'Gallade',
      item: 'Choice Band',
      ability: 'Sharpness',
      level: 100,
      evs: '252 Atk / 4 SpD / 252 Spe',
      nature: 'Jolly',
      moves: ['Sacred Sword', 'Psycho Cut', 'Leaf Blade', 'Aqua Cutter'],
    },
    {
      species: 'Primarina',
      item: 'Choice Specs',
      ability: 'Torrent',
      level: 100,
      evs: '248 HP / 120 Def / 140 SpA',
      nature: 'Modest',
      ivs: '0 Atk',
      moves: ['Hydro Cannon', 'Moonblast', 'Psychic Noise', 'Icy Wind'],
    },
    {
      species: 'Metagross',
      item: 'Weakness Policy',
      ability: 'Clear Body',
      level: 100,
      evs: '252 HP / 176 Atk / 80 Def',
      nature: 'Adamant',
      moves: ['Meteor Mash', 'Earthquake', 'Bullet Punch', 'Iron Defense'],
    },
  ];

  const rivalBlocks: ShowdownSetBlock[] = [
    {
      species: 'Iron Crown',
      item: 'Booster Energy',
      ability: 'Quark Drive',
      level: 100,
      evs: '4 HP / 252 SpA / 252 Spe',
      nature: 'Timid',
      ivs: '20 Atk',
      moves: ['Tachyon Cutter', 'Psychic', 'Focus Blast', 'Calm Mind'],
    },
    {
      species: 'Skeledirge',
      item: 'Throat Spray',
      ability: 'Unaware',
      level: 100,
      evs: '248 HP / 84 Def / 176 SpA',
      nature: 'Modest',
      ivs: '0 Atk',
      moves: ['Torch Song', 'Shadow Ball', 'Slack Off', 'Encore'],
    },
    {
      species: 'Urshifu',
      item: 'Choice Band',
      ability: 'Unseen Fist',
      level: 100,
      evs: '252 Atk / 4 SpD / 252 Spe',
      nature: 'Jolly',
      moves: ['Wicked Blow', 'Close Combat', 'Sucker Punch', 'Iron Head'],
    },
  ];

  const readNames: Record<string, string> = {
    ironcrown: 'Iron Crown (Booster Energy)',
    skeledirge: 'Skeledirge (Unaware)',
    urshifu: 'Urshifu (Choice Band)',
  };

  const scriptedEnemyRules: ScriptedEnemyRule[] = [
    {
      id: 'duel1v1-t1-ironcrown',
      turn: 1,
      actorSpecies: 'Iron Crown',
      forceMoveId: 'tachyoncutter',
      once: true,
      description: 'Turno 1 1v1: Iron Crown presiona con doble golpe Tachyon Cutter.',
      tauntLine: '«Sin cambios ni excusas: ¡Iron Crown, Taquión Cortante!»',
    },
    {
      id: 'duel1v1-t1-skeledirge',
      turn: 1,
      actorSpecies: 'Skeledirge',
      forceMoveId: 'torchsong',
      once: true,
      description: 'Turno 1 1v1: Skeledirge activa Throat Spray con Torch Song.',
      tauntLine: '«¡Quema su honor con Canto Ardiente, Skeledirge!»',
    },
    {
      id: 'duel1v1-t1-urshifu',
      turn: 1,
      actorSpecies: 'Urshifu',
      forceMoveId: 'wickedblow',
      once: true,
      description: 'Turno 1 1v1: Urshifu busca OHKO crítico con Wicked Blow.',
      tauntLine: '«Un golpe basta en 1v1. ¡Urshifu, Golpe Oscuro!»',
    },
  ];

  return {
    chapterId: 'duel-01-honor-1v1',
    format: 'singles',
    formatId: 'gen91v1',
    formatLabel: '1v1 · Bring 3, Pick 1',
    interactiveTeamPreview: true,
    openTeamsheet: true,
    preferredRivalTeamOrder: `team ${rivalSlot}`,
    playerName: 'Príncipe Heredero',
    playerCharId: 'prince',
    rivalName: 'Asesino Carmesí',
    rivalTitle: 'Duelista de la Corte · Formato 1v1',
    rivalCharId: 'assassin',
    arenaTheme: 'honor-duel-hall',
    playerTeamSummary: 'Trío Real: Gallade, Primarina, Metagross (Elige 1)',
    rivalTeamSummary: 'Trío Rival: Iron Crown, Skeledirge, Urshifu (Elige 1)',
    playerShowdownPaste: buildShowdownPaste(playerBlocks),
    rivalShowdownPaste: buildShowdownPaste(rivalBlocks),
    rivalIntel: {
      visibleSpeciesCount: 3,
      totalSlots: 3,
      intelLabel: 'Team Preview 1v1 · 3/3 Especies',
      intelNote:
        'En 1v1 ves los 3 Pokémon del rival y eliges solo 1 para combate a muerte súbita sin cambios. También puedes consultar el Teamsheet.',
      levelCap: 100,
      hasBossAce: false,
      aiScriptHint: `Pista de la escena Ink: todo indica que el rival elegirá a ${readNames[rivalRead] ?? 'Iron Crown'} en el Team Preview.`,
    },
    scriptedEnemyRules,
    traces: [
      {
        id: '1v1-read',
        category: 'ai-script',
        choiceLabel: `Pista observada: ${readNames[rivalRead] ?? 'Iron Crown'}`,
        flagKey: 'rival_read',
        flagValue: rivalRead,
        effectTitle: 'Lectura de Team Preview 1v1',
        effectDetail:
          'Elige el counter adecuado entre Gallade, Primarina y Metagross durante la selección interactiva 1 de 3.',
      },
      {
        id: '1v1-format',
        category: 'player-set',
        choiceLabel: 'Reglas oficiales gen91v1',
        flagKey: 'format',
        flagValue: 'gen91v1',
        effectTitle: 'Sin cambios · Objetos de burst y aguante',
        effectDetail:
          'Choice Band Gallade, Choice Specs Primarina y Weakness Policy Metagross forman un triángulo táctico completo.',
      },
    ],
    flags,
  };
}

/* ===================== Capítulo 02: Choque de Estandartes (gen9monotype · Acero vs Siniestro) ===================== */

export function resolveChapter2MonotypeBattle(
  flags: StoryFlags
): ResolvedBattleConfig {
  const doctrine = String(flags.steel_doctrine ?? 'scarf_gholdengo');

  const playerBlocks: ShowdownSetBlock[] = [
    {
      species: 'Corviknight',
      item: 'Rocky Helmet',
      ability: 'Pressure',
      level: 100,
      evs: '252 HP / 252 Def / 4 SpD',
      nature: 'Impish',
      moves: ['Brave Bird', 'Body Press', 'Defog', 'Roost'],
    },
    {
      species: 'Heatran',
      item: doctrine === 'bulky_steel' ? 'Leftovers' : 'Air Balloon',
      ability: 'Flash Fire',
      level: 100,
      evs:
        doctrine === 'bulky_steel'
          ? '252 HP / 4 SpA / 252 SpD'
          : '252 SpA / 4 SpD / 252 Spe',
      nature: doctrine === 'bulky_steel' ? 'Calm' : 'Timid',
      ivs: '0 Atk',
      moves:
        doctrine === 'bulky_steel'
          ? ['Magma Storm', 'Earth Power', 'Protect', 'Stealth Rock']
          : ['Magma Storm', 'Earth Power', 'Flash Cannon', 'Stealth Rock'],
    },
    {
      species: 'Gholdengo',
      item: doctrine === 'bulky_steel' ? 'Leftovers' : 'Choice Scarf',
      ability: 'Good as Gold',
      level: 100,
      evs: '252 SpA / 4 SpD / 252 Spe',
      nature: 'Timid',
      ivs: '0 Atk',
      moves:
        doctrine === 'bulky_steel'
          ? ['Make It Rain', 'Shadow Ball', 'Nasty Plot', 'Recover']
          : ['Make It Rain', 'Shadow Ball', 'Focus Blast', 'Trick'],
    },
    {
      species: 'Archaludon',
      item: 'Assault Vest',
      ability: 'Stamina',
      level: 100,
      evs: '252 HP / 4 Def / 252 SpA',
      nature: 'Modest',
      ivs: '0 Atk',
      moves: ['Draco Meteor', 'Flash Cannon', 'Body Press', 'Thunderbolt'],
    },
    {
      species: 'Iron Treads',
      item: 'Leftovers',
      ability: 'Quark Drive',
      level: 100,
      evs: '252 Atk / 4 SpD / 252 Spe',
      nature: 'Jolly',
      moves: ['Earthquake', 'Iron Head', 'Rapid Spin', 'Knock Off'],
    },
    {
      species: 'Scizor',
      item: 'Choice Band',
      ability: 'Technician',
      level: 100,
      evs: '252 Atk / 4 Def / 252 Spe',
      nature: 'Adamant',
      moves: ['Bullet Punch', 'U-turn', 'Close Combat', 'Knock Off'],
    },
  ];

  const rivalBlocks: ShowdownSetBlock[] = [
    {
      species: 'Samurott-Hisui',
      item: 'Focus Sash',
      ability: 'Sharpness',
      level: 100,
      evs: '252 Atk / 4 SpD / 252 Spe',
      nature: 'Jolly',
      moves: ['Ceaseless Edge', 'Razor Shell', 'Sacred Sword', 'Aqua Jet'],
    },
    {
      species: 'Ting-Lu',
      item: 'Leftovers',
      ability: 'Vessel of Ruin',
      level: 100,
      evs: '252 HP / 4 Def / 252 SpD',
      nature: 'Careful',
      moves: ['Earthquake', 'Ruination', 'Stealth Rock', 'Whirlwind'],
    },
    {
      species: 'Meowscarada',
      item: 'Choice Scarf',
      ability: 'Protean',
      level: 100,
      evs: '252 Atk / 4 SpD / 252 Spe',
      nature: 'Jolly',
      moves: ['Flower Trick', 'Knock Off', 'U-turn', 'Triple Axel'],
    },
    {
      species: 'Mandibuzz',
      item: 'Heavy-Duty Boots',
      ability: 'Overcoat',
      level: 100,
      evs: '248 HP / 252 Def / 8 SpD',
      nature: 'Impish',
      moves: ['Foul Play', 'U-turn', 'Defog', 'Roost'],
    },
    {
      species: 'Greninja',
      item: 'Life Orb',
      ability: 'Protean',
      level: 100,
      evs: '252 SpA / 4 SpD / 252 Spe',
      nature: 'Timid',
      ivs: '0 Atk',
      moves: ['Hydro Pump', 'Dark Pulse', 'Ice Beam', 'Extrasensory'],
    },
    {
      species: 'Sableye',
      item: 'Leftovers',
      ability: 'Prankster',
      level: 100,
      evs: '252 HP / 252 Def / 4 SpD',
      nature: 'Impish',
      moves: ['Will-O-Wisp', 'Knock Off', 'Encore', 'Recover'],
    },
  ];

  const scriptedEnemyRules: ScriptedEnemyRule[] = [
    {
      id: 'mono-t1-samurott-edge',
      turn: 1,
      actorSpecies: 'Samurott-Hisui',
      forceMoveId: 'ceaselessedge',
      once: true,
      description: 'Turno 1 Monotype: Samurott-Hisui abre colocando Púas con Ceaseless Edge.',
      tauntLine: '«¡Llenen el campo de púas! ¡Samurott, Tajo Metralla!»',
    },
    {
      id: 'mono-tinglu-sr',
      actorSpecies: 'Ting-Lu',
      forceMoveId: 'stealthrock',
      once: true,
      description: 'Entrada de Ting-Lu: busca colocar Stealth Rock contra tu equipo Acero.',
      tauntLine: '«Tu armadura pesará el doble con Trampa Rocas. ¡Ting-Lu!»',
    },
  ];

  return {
    chapterId: 'ch2-monotype-banners',
    format: 'singles',
    formatId: 'gen9monotype',
    formatLabel: '6v6 Singles · Monotype',
    interactiveTeamPreview: true,
    openTeamsheet: false,
    playerName: 'Príncipe Heredero',
    playerCharId: 'prince',
    rivalName: 'Asesino Carmesí',
    rivalTitle: 'Estandarte Siniestro (Monotype Dark)',
    rivalCharId: 'assassin',
    arenaTheme: 'banner-battlefield',
    playerTeamSummary: 'Monotype Acero: Corviknight, Heatran, Gholdengo, Archaludon, Iron Treads, Scizor',
    rivalTeamSummary: 'Monotype Siniestro (6 especies visibles en Team Preview)',
    playerShowdownPaste: buildShowdownPaste(playerBlocks),
    rivalShowdownPaste: buildShowdownPaste(rivalBlocks),
    rivalIntel: {
      visibleSpeciesCount: 6,
      totalSlots: 6,
      intelLabel: 'Monotype Acero vs. Siniestro',
      intelNote:
        'En gen9monotype oficial ambos equipos comparten un único tipo obligatorio. Elegirás tu Lead (1 de 6) en Team Preview.',
      levelCap: 100,
      hasBossAce: false,
      aiScriptHint:
        'Samurott-Hisui suele abrir con Ceaseless Edge para poner Púas en Turno 1; Corviknight (Defog) o Iron Treads (Rapid Spin) limpian el terreno.',
    },
    scriptedEnemyRules,
    traces: [
      {
        id: 'mono-doctrine',
        category: 'player-set',
        choiceLabel:
          doctrine === 'bulky_steel'
            ? 'Doctrina Muralla (Desgaste)'
            : 'Doctrina Velocidad (Scarf + Band)',
        flagKey: 'steel_doctrine',
        flagValue: doctrine,
        effectTitle:
          doctrine === 'bulky_steel'
            ? 'Heatran Leftovers + Gholdengo Nasty Plot'
            : 'Heatran Air Balloon + Gholdengo Choice Scarf',
        effectDetail:
          doctrine === 'bulky_steel'
            ? 'Prioriza recuperación y aguante prolongado frente a Ting-Lu y Mandibuzz.'
            : 'Outspeedea a Greninja/Meowscarada y absorbe Earthquake con Globo Helio.',
      },
      {
        id: 'mono-matchup',
        category: 'rival-team',
        choiceLabel: 'Decreto Monotype (gen9monotype)',
        flagKey: 'monotype',
        flagValue: 'steel-vs-dark',
        effectTitle: 'Acero vs. Siniestro (100% legal en Showdown)',
        effectDetail:
          'Ambos equipos superan el TeamValidator oficial de gen9monotype.',
      },
    ],
    flags,
  };
}

/* ===================== Archivo VGC: Final Mundial 2024 — Luca Ceribelli vs. Yuta Ishigaki ===================== */

export function resolveVgcWorlds2024Battle(
  flags: StoryFlags
): ResolvedBattleConfig {
  const selectedPlayer =
    String(flags.selected_player ?? 'luca') === 'yuta' ? 'yuta' : 'luca';
  const rivalPlan = String(flags.rival_plan ?? flags.yuta_plan ?? 'game1');

  const lucaBlocks: ShowdownSetBlock[] = [
    {
      species: 'Miraidon',
      item: 'Choice Specs',
      ability: 'Hadron Engine',
      level: 50,
      teraType: 'Fairy',
      evs: '44 HP / 4 Def / 244 SpA / 12 SpD / 204 Spe',
      nature: 'Modest',
      moves: ['Electro Drift', 'Draco Meteor', 'Volt Switch', 'Dazzling Gleam'],
    },
    {
      species: 'Whimsicott',
      item: 'Covert Cloak',
      ability: 'Prankster',
      level: 50,
      teraType: 'Dark',
      evs: '236 HP / 164 SpD / 108 Spe',
      nature: 'Timid',
      ivs: '0 Atk',
      moves: ['Moonblast', 'Tailwind', 'Light Screen', 'Encore'],
    },
    {
      species: 'Urshifu-Rapid-Strike',
      item: 'Focus Sash',
      ability: 'Unseen Fist',
      level: 50,
      teraType: 'Stellar',
      evs: '252 Atk / 4 SpD / 252 Spe',
      nature: 'Adamant',
      moves: ['Surging Strikes', 'Close Combat', 'Aqua Jet', 'Detect'],
    },
    {
      species: 'Ogerpon-Hearthflame',
      item: 'Hearthflame Mask',
      ability: 'Mold Breaker',
      level: 50,
      teraType: 'Fire',
      evs: '188 HP / 76 Atk / 52 Def / 4 SpD / 188 Spe',
      nature: 'Adamant',
      moves: ['Ivy Cudgel', 'Wood Hammer', 'Follow Me', 'Spiky Shield'],
    },
    {
      species: 'Iron Hands',
      item: 'Assault Vest',
      ability: 'Quark Drive',
      level: 50,
      teraType: 'Bug',
      evs: '76 HP / 180 Atk / 12 Def / 236 SpD',
      nature: 'Brave',
      ivs: '0 Spe',
      moves: ['Drain Punch', 'Wild Charge', 'Fake Out', 'Low Kick'],
    },
    {
      species: 'Farigiraf',
      item: 'Electric Seed',
      ability: 'Armor Tail',
      level: 50,
      teraType: 'Water',
      evs: '204 HP / 164 Def / 4 SpA / 108 SpD / 28 Spe',
      nature: 'Bold',
      ivs: '6 Atk',
      moves: ['Psychic Noise', 'Foul Play', 'Helping Hand', 'Trick Room'],
    },
  ];

  const yutaBlocks: ShowdownSetBlock[] = [
    {
      species: 'Calyrex-Ice',
      item: 'Clear Amulet',
      ability: 'As One (Glastrier)',
      level: 50,
      teraType: 'Grass',
      evs: '252 HP / 172 Atk / 84 SpD',
      nature: 'Brave',
      ivs: '1 Spe',
      moves: ['Glacial Lance', 'High Horsepower', 'Protect', 'Trick Room'],
    },
    {
      species: 'Urshifu-Rapid-Strike',
      item: 'Focus Sash',
      ability: 'Unseen Fist',
      level: 50,
      teraType: 'Water',
      evs: '252 Atk / 4 SpD / 252 Spe',
      nature: 'Adamant',
      moves: ['Surging Strikes', 'Close Combat', 'Aqua Jet', 'Detect'],
    },
    {
      species: 'Pelipper',
      item: 'Life Orb',
      ability: 'Drizzle',
      level: 50,
      teraType: 'Grass',
      evs: '252 HP / 252 SpA / 4 SpD',
      nature: 'Modest',
      ivs: '0 Atk',
      moves: ['Weather Ball', 'Hurricane', 'Helping Hand', 'Wide Guard'],
    },
    {
      species: 'Amoonguss',
      item: 'Rocky Helmet',
      ability: 'Regenerator',
      level: 50,
      teraType: 'Fire',
      evs: '236 HP / 228 Def / 44 SpD',
      nature: 'Relaxed',
      ivs: '0 Atk / 0 Spe',
      moves: ['Spore', 'Rage Powder', 'Clear Smog', 'Pollen Puff'],
    },
    {
      species: 'Iron Valiant',
      item: 'Booster Energy',
      ability: 'Quark Drive',
      level: 50,
      teraType: 'Ghost',
      evs: '204 HP / 4 Atk / 100 Def / 28 SpD / 172 Spe',
      nature: 'Jolly',
      moves: ['Spirit Break', 'Coaching', 'Wide Guard', 'Encore'],
    },
    {
      species: 'Landorus',
      item: 'Choice Scarf',
      ability: 'Sheer Force',
      level: 50,
      teraType: 'Ghost',
      evs: '4 HP / 252 SpA / 252 Spe',
      nature: 'Modest',
      moves: ['Earth Power', 'Sandsear Storm', 'Sludge Bomb', 'U-turn'],
    },
  ];

  const isPlayingAsYuta = selectedPlayer === 'yuta';

  // When playing as Luca -> Rival is Yuta (Iron Valiant + Landorus lead, Pelipper/Amoonguss + Calyrex-Ice back)
  // When playing as Yuta -> Rival is Luca (Whimsicott + Miraidon lead, Iron Hands + Farigiraf OR Urshifu-R + Ogerpon-H back)
  const preferredRivalTeamOrder = isPlayingAsYuta
    ? rivalPlan === 'game2'
      ? 'team 2134'
      : 'team 2156'
    : rivalPlan === 'game2'
      ? 'team 5641'
      : 'team 5631';

  const scriptedEnemyRules: ScriptedEnemyRule[] = isPlayingAsYuta
    ? [
        {
          id: 'vgc-luca-t1-tailwind',
          turn: 1,
          actorSpecies: 'Whimsicott',
          forceMoveId: 'tailwind',
          once: true,
          description:
            'Final Mundial T1: Whimsicott (Prankster) asegura velocidad con Tailwind para Miraidon.',
          tauntLine: '«¡Control del ritmo desde el inicio! ¡Whimsicott, Viento Afín!»',
        },
        {
          id: 'vgc-luca-t1-gleam',
          turn: 1,
          actorSpecies: 'Miraidon',
          forceMoveId: 'dazzlinggleam',
          once: true,
          description:
            'Final Mundial T1: Miraidon Choice Specs presiona a ambos rivales con Dazzling Gleam.',
          tauntLine: '«¡Presión en área con Gafas Elección! ¡Miraidon, Brillo Mágico!»',
        },
        {
          id: 'vgc-luca-hands-fakeout',
          actorSpecies: 'Iron Hands',
          forceMoveId: 'fakeout',
          targetSpec: 'species:Calyrex-Ice',
          once: true,
          description:
            'Entrada de Iron Hands: intenta frenar el Espacio Raro rival con Fake Out.',
          tauntLine: '«¡No tan rápido con ese Espacio Raro! ¡Ferropalmas, Sorpresa!»',
        },
        {
          id: 'vgc-luca-farigiraf-hh',
          actorSpecies: 'Farigiraf',
          forceMoveId: 'helpinghand',
          once: true,
          description:
            'Sinergia Mundial: Farigiraf potencia el ataque de su compañero con Helping Hand.',
          tauntLine: '«¡Refuerzo de Farigiraf para cerrar el turno!»',
        },
      ]
    : [
        {
          id: 'vgc-t1-valiant-spiritbreak',
          turn: 1,
          actorSpecies: 'Iron Valiant',
          forceMoveId: 'spiritbreak',
          targetSpec: 'species:Miraidon',
          once: true,
          description:
            'Final Mundial T1: Iron Valiant presiona con Spirit Break para bajar el SpA de Miraidon.',
          tauntLine:
            '«¡Presión directa sobre Miraidon! ¡Iron Valiant, Choque Anímico!»',
        },
        {
          id: 'vgc-t1-landorus-sandsear',
          turn: 1,
          actorSpecies: 'Landorus',
          forceMoveId: 'sandsearstorm',
          once: true,
          description:
            'Final Mundial T1: Landorus Choice Scarf presiona en área con Sandsear Storm.',
          tauntLine: '«¡Control total del centro! ¡Landorus, Simún de Arena!»',
        },
        {
          id: 'vgc-calyrex-tr',
          actorSpecies: 'Calyrex-Ice',
          forceMoveId: 'trickroom',
          once: true,
          description:
            'Mid-game Mundial: Calyrex-Ice intenta invertir velocidades con Trick Room.',
          tauntLine:
            '«Es hora de invertir el ritmo de la final. ¡Calyrex, Espacio Raro!»',
        },
        {
          id: 'vgc-pelipper-wideguard',
          actorSpecies: 'Pelipper',
          condition: 'playerHasSpecies',
          requiredPlayerSpecies: 'Miraidon',
          forceMoveId: 'helpinghand',
          once: true,
          description:
            'Sinergia Mundial: Pelipper potencia a su compañero con Helping Hand bajo Lluvia.',
          tauntLine: '«¡Lluvia y Refuerzo de Pelipper para asegurar el KO!»',
        },
      ];

  const playerName = isPlayingAsYuta ? 'Yuta Ishigaki' : 'Luca Ceribelli';
  const rivalName = isPlayingAsYuta ? 'Luca Ceribelli' : 'Yuta Ishigaki';

  return {
    chapterId: 'archive-vgc-2024',
    format: 'doubles',
    formatId: 'gen9vgc2024regg',
    formatLabel: 'VGC Reg G · Dobles 4v4 Nv. 50',
    interactiveTeamPreview: true,
    openTeamsheet: true,
    preferredRivalTeamOrder,
    playerName,
    playerCharId: isPlayingAsYuta ? 'champion' : 'prince',
    rivalName,
    rivalTitle: 'Final Mundial VGC 2024 · Honolulu',
    rivalCharId: isPlayingAsYuta ? 'prince' : 'champion',
    arenaTheme: 'vgc-worlds-stage',
    playerTeamSummary: isPlayingAsYuta
      ? 'Yuta Ishigaki (Calyrex-Ice, Urshifu-R, Pelipper, Amoonguss, Iron Valiant, Landorus)'
      : 'Luca Ceribelli (Miraidon, Whimsicott, Urshifu-R, Ogerpon-H, Iron Hands, Farigiraf)',
    rivalTeamSummary: isPlayingAsYuta
      ? 'Luca Ceribelli (Miraidon, Whimsicott, Urshifu-R, Ogerpon-H, Iron Hands, Farigiraf)'
      : 'Yuta Ishigaki (Calyrex-Ice, Urshifu-R, Pelipper, Amoonguss, Iron Valiant, Landorus)',
    playerShowdownPaste: buildShowdownPaste(
      isPlayingAsYuta ? yutaBlocks : lucaBlocks
    ),
    rivalShowdownPaste: buildShowdownPaste(
      isPlayingAsYuta ? lucaBlocks : yutaBlocks
    ),
    rivalIntel: {
      visibleSpeciesCount: 6,
      totalSlots: 6,
      intelLabel: 'Open Teamsheets Oficiales · 6/6',
      intelNote:
        'Reglamento oficial de Campeonato Mundial: ambos equipos tienen Open Teamsheets visibles (objetos, habilidades, teratipos y movimientos). Elige 4 de 6 en Team Preview.',
      levelCap: 50,
      hasBossAce: false,
      aiScriptHint: isPlayingAsYuta
        ? rivalPlan === 'game2'
          ? 'Plan Juego 2: Luca abre con Whimsicott (Tailwind) + Miraidon (Dazzling Gleam) y reserva Urshifu-R + Ogerpon-H.'
          : 'Plan Juego 1: Luca abre con Whimsicott (Tailwind) + Miraidon (Dazzling Gleam) y reserva Iron Hands + Farigiraf.'
        : rivalPlan === 'game2'
          ? 'Plan Juego 2: Yuta abre con Iron Valiant + Landorus y reserva Amoonguss + Calyrex-Ice (Espacio Raro).'
          : 'Plan Juego 1: Yuta abre con Iron Valiant + Landorus y reserva Pelipper (Lluvia) + Calyrex-Ice (Espacio Raro).',
    },
    scriptedEnemyRules,
    traces: [
      {
        id: 'vgc-side',
        category: 'player-roster',
        choiceLabel: isPlayingAsYuta
          ? 'Bando elegido: Yuta Ishigaki'
          : 'Bando elegido: Luca Ceribelli',
        flagKey: 'selected_player',
        flagValue: selectedPlayer,
        effectTitle: isPlayingAsYuta
          ? 'Piloteas el núcleo de Calyrex-Ice (Japón)'
          : 'Piloteas el núcleo de Miraidon (Italia)',
        effectDetail: isPlayingAsYuta
          ? 'Controlas a Calyrex-Ice, Iron Valiant, Landorus, Pelipper, Amoonguss y Urshifu-R frente a la IA de Luca.'
          : 'Controlas a Miraidon, Whimsicott, Urshifu-R, Ogerpon-H, Iron Hands y Farigiraf frente a la IA de Yuta.',
      },
      {
        id: 'vgc-plan',
        category: 'ai-script',
        choiceLabel: isPlayingAsYuta
          ? rivalPlan === 'game2'
            ? 'Plan Rival Juego 2 (Urshifu-R + Ogerpon-H)'
            : 'Plan Rival Juego 1 (Iron Hands + Farigiraf)'
          : rivalPlan === 'game2'
            ? 'Plan Rival Juego 2 (Amoonguss + Calyrex-Ice)'
            : 'Plan Rival Juego 1 (Pelipper + Calyrex-Ice)',
        flagKey: 'rival_plan',
        flagValue: rivalPlan,
        effectTitle: isPlayingAsYuta
          ? 'Apertura oficial de Luca Ceribelli'
          : 'Apertura oficial de Yuta Ishigaki',
        effectDetail: isPlayingAsYuta
          ? 'Whimsicott + Miraidon en Turno 1 con Viento Afín y Brillo Mágico.'
          : 'Iron Valiant + Landorus en Turno 1, con pivote mid-game hacia Calyrex-Ice (Trick Room).',
      },
    ],
    flags,
  };
}
