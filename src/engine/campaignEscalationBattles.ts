import {
  CAMPAIGN_DOUBLES_FORMAT_ID,
  type ResolvedBattleConfig,
  type StoryFlags,
} from '../types/game';
import {
  buildShowdownPaste,
  type ShowdownSetBlock,
} from './teamBuilderTree';

/** Standard full 6-Pokémon player squad used as default fallback when custom PC Box team is disabled. */
function buildExileCampaignPlayerSquad(level = 100): ShowdownSetBlock[] {
  return [
    {
      species: 'Arcanine',
      item: 'Sitrus Berry',
      ability: 'Intimidate',
      level,
      teraType: 'Water',
      evs: '252 HP / 116 Atk / 140 Spe',
      nature: 'Adamant',
      moves: ['Flare Blitz', 'Extreme Speed', 'Will-O-Wisp', 'Protect'],
    },
    {
      species: 'Gardevoir',
      item: 'Focus Sash',
      ability: 'Trace',
      level,
      teraType: 'Fairy',
      evs: '4 HP / 252 SpA / 252 Spe',
      nature: 'Timid',
      ivs: '0 Atk',
      moves: ['Dazzling Gleam', 'Psychic', 'Icy Wind', 'Protect'],
    },
    {
      species: 'Corviknight',
      item: 'Leftovers',
      ability: 'Mirror Armor',
      level,
      teraType: 'Dragon',
      evs: '252 HP / 140 Def / 116 SpD',
      nature: 'Impish',
      moves: ['Brave Bird', 'Iron Head', 'Tailwind', 'Roost'],
    },
    {
      species: 'Milotic',
      item: 'Maranga Berry',
      ability: 'Competitive',
      level,
      teraType: 'Grass',
      evs: '252 HP / 156 Def / 100 SpA',
      nature: 'Bold',
      ivs: '0 Atk',
      moves: ['Scald', 'Ice Beam', 'Icy Wind', 'Recover'],
    },
    {
      species: 'Dragapult',
      item: 'Life Orb',
      ability: 'Clear Body',
      level,
      teraType: 'Ghost',
      evs: '4 HP / 252 SpA / 252 Spe',
      nature: 'Timid',
      ivs: '0 Atk',
      moves: ['Draco Meteor', 'Shadow Ball', 'Flamethrower', 'Protect'],
    },
    {
      species: 'Kingambit',
      item: 'Black Glasses',
      ability: 'Supreme Overlord',
      level,
      teraType: 'Dark',
      evs: '252 HP / 252 Atk / 4 SpD',
      nature: 'Adamant',
      moves: ['Kowtow Cleave', 'Sucker Punch', 'Iron Head', 'Protect'],
    },
  ];
}

/* ============================================================================
 * ACTO II (Misión 5) — AURA (ORRE): EMBOSCADA DE POKÉMON OSCUROS (Nv. 82–88)
 * Mecánica Real de Colosseum / XD: Pokémon Oscuros + Cielo Oscuro (Shadow Sky)
 * ============================================================================ */
export function resolveOrreShadowAmbushBattle(
  flags: StoryFlags = {}
): ResolvedBattleConfig {
  const playerSquad = buildExileCampaignPlayerSquad(88);
  const rivalSquad: ShowdownSetBlock[] = [
    {
      nickname: 'Tyranitar Oscuro',
      species: 'Tyranitar',
      item: 'Sitrus Berry',
      ability: 'Unnerve',
      level: 84,
      teraType: 'Flying',
      evs: '252 HP / 252 Atk / 4 SpD',
      nature: 'Adamant',
      moves: ['Shadow Cataclysm', 'Shadow Rush', 'Shadow Break', 'Rock Slide'],
    },
    {
      species: 'Excadrill',
      item: 'Life Orb',
      ability: 'Mold Breaker',
      level: 85,
      teraType: 'Ground',
      evs: '4 HP / 252 Atk / 252 Spe',
      nature: 'Adamant',
      moves: ['Earthquake', 'Iron Head', 'Rock Slide', 'Protect'],
    },
    {
      species: 'Garchomp',
      item: 'Choice Band',
      ability: 'Rough Skin',
      level: 85,
      teraType: 'Steel',
      evs: '4 HP / 252 Atk / 252 Spe',
      nature: 'Jolly',
      moves: ['Dragon Claw', 'Stomping Tantrum', 'Rock Slide', 'Iron Head'],
    },
    {
      nickname: 'Houndoom Oscuro',
      species: 'Houndoom-Mega',
      item: 'Houndoominite',
      ability: 'Flash Fire',
      level: 86,
      teraType: 'Dark',
      evs: '4 HP / 252 SpA / 252 Spe',
      nature: 'Timid',
      ivs: '0 Atk',
      moves: ['Shadow Fire', 'Shadow Wave', 'Shadow Panic', 'Dark Pulse'],
    },
    {
      nickname: 'Salamence Oscuro',
      species: 'Salamence',
      item: 'Leftovers',
      ability: 'Intimidate',
      level: 86,
      teraType: 'Flying',
      evs: '4 HP / 252 SpA / 252 Spe',
      nature: 'Timid',
      ivs: '0 Atk',
      moves: ['Shadow Storm', 'Shadow Blast', 'Shadow Sky', 'Draco Meteor'],
    },
    {
      nickname: 'Metagross Oscuro ★',
      species: 'Metagross',
      item: 'Clear Amulet',
      ability: 'Clear Body',
      level: 88,
      teraType: 'Steel',
      evs: '252 HP / 252 Atk / 4 Spe',
      nature: 'Adamant',
      moves: ['Shadow Blast', 'Shadow End', 'Shadow Tear', 'Meteor Mash'],
    },
  ];

  return {
    chapterId: 'ch4-orre-shadow-ambush',
    format: 'doubles',
    formatId: CAMPAIGN_DOUBLES_FORMAT_ID,
    formatLabel: 'Acto II · Pokémon Oscuros (Nv. 88)',
    reserveAsLastAceSpecies: 'Metagross',
    playerName: 'Príncipe Heredero',
    playerCharId: 'prince',
    rivalName: 'Sindicato de Pokémon Oscuros',
    rivalTitle: 'Comandante de Aura (Orre) · Guerra Civil del Oeste',
    rivalCharId: 'corrupt_captain',
    arenaTheme: 'wyndon-alleys',
    playerTeamSummary: 'Tu Escuadrón del Exilio (Acto II · Cap BST 3,000)',
    rivalTeamSummary:
      'Sindicato de Aura (Tyranitar Oscuro, Houndoom-Mega Oscuro, Salamence Oscuro, Metagross Oscuro ★ + Excadrill/Garchomp)',
    playerShowdownPaste: buildShowdownPaste(playerSquad),
    rivalShowdownPaste: buildShowdownPaste(rivalSquad),
    shadowMeta: {
      p1ShadowSpecies: [],
      p2ShadowSpecies: ['Tyranitar', 'Houndoom-Mega', 'Salamence', 'Metagross'],
      affectionMode: 'classic-rng',
    },
    rivalIntel: {
      visibleSpeciesCount: 3,
      totalSlots: 6,
      intelLabel: 'Acto II · Pokémon Oscuros + Cielo Oscuro (Colosseum/XD)',
      intelNote:
        'Primer choque con Pokémon Oscuros reales bajo Cielo Oscuro (Shadow Sky): sus ataques Shadow pegan 2× a TODO salvo Hada (0× INMUNE) y otros Oscuros (0.5×). ¡Vencer los arrebata directo a tus Cajas PC!',
      levelCap: 88,
      hasBossAce: true,
      bossAceWarning:
        'Metagross Oscuro ★ (Nv. 88 · Shadow Blast 100% Crítico en Modo Hiper + Shadow Tear anti-Hada + Shadow End 130 BP). ¡Vigila Shadow Tear contra tus Hada!',
    },
    puzzleConditions: {
      weather: 'shadowsky',
      extendedEnvironment: true,
      biomeLabel: '🌑 Cañón de Aura (Orre) · Cielo Oscuro Persistente (Shadow Sky)',
      biomeCounterHint:
        'Cielo Oscuro potencia ataques Shadow ×1.3 y drena 1/16 PS por turno a no-Oscuros. ¡Los tipo Hada son INMUNES (0×) a ataques Shadow salvo que reciban Shadow Tear!',
      bannerLog:
        '🌑 ¡Cañón de Aura (Orre)! Cielo Oscuro (Shadow Sky) envuelve la emboscada del Sindicato de Pokémon Oscuros.',
    },
    scriptedEnemyRules: [
      {
        id: 'orre-t1-ttar-shadow-cataclysm',
        turn: 1,
        actorSpecies: 'Tyranitar',
        forceMoveId: 'shadowcataclysm',
        once: true,
        description:
          'Sindicato T1: Tyranitar Oscuro desata Shadow Cataclysm (110 BP de área adaptativo + invoca Cielo Oscuro).',
        tauntLine:
          '«¡En el desierto de Aura cerramos el corazón de nuestros Pokémon! ¡Siente el Cielo Oscuro y Shadow Cataclysm!»',
      },
    ],
    traces: [
      {
        id: 'orre-route-choice',
        category: 'rival-team',
        choiceLabel:
          String(flags.orre_stance ?? 'direct') === 'ambush'
            ? 'Cortaste las rutas de suministro de Aura antes del choque'
            : 'Cruzaste el cañón de Aura de frente para liberar los convoyes',
        flagKey: 'orre_stance',
        flagValue: String(flags.orre_stance ?? 'direct'),
        effectTitle: 'Apertura de Cordelia + Proyecto XD001',
        effectDetail:
          'Ganar arrebata los 4 Pokémon Oscuros del Sindicato a tus Cajas PC y revela el jefe secreto Proyecto XD001: Lugia Oscuro en Aura.',
      },
    ],
    flags,
  };
}

/* ============================================================================
 * ACTO III (Misión 8) — TAMRA: EL VIRREY DE LA CRU (COPPERAJAH / ACERO · Nv. 95–102)
 * Regla de Jefe: Trampa Rocas + Púas T0 + Arena + Copperajah ★ (+1 Atk/+1 Def T0)
 * ============================================================================ */
export function resolveTamraCruViceroyBattle(
  flags: StoryFlags = {}
): ResolvedBattleConfig {
  const playerSquad = buildExileCampaignPlayerSquad(100);
  const rivalSquad: ShowdownSetBlock[] = [
    {
      species: 'Skarmory',
      item: 'Rocky Helmet',
      ability: 'Sturdy',
      level: 95,
      teraType: 'Ghost',
      evs: '252 HP / 252 Def / 4 Spe',
      nature: 'Impish',
      moves: ['Body Press', 'Brave Bird', 'Tailwind', 'Roost'],
    },
    {
      species: 'Empoleon',
      item: 'Assault Vest',
      ability: 'Competitive',
      level: 96,
      teraType: 'Fairy',
      evs: '252 HP / 4 Def / 252 SpA',
      nature: 'Modest',
      ivs: '0 Atk',
      moves: ['Hydro Pump', 'Flash Cannon', 'Ice Beam', 'Icy Wind'],
    },
    {
      species: 'Aegislash',
      item: 'Weakness Policy',
      ability: 'Stance Change',
      level: 97,
      teraType: 'Fighting',
      evs: '252 HP / 252 SpA / 4 SpD',
      nature: 'Quiet',
      moves: ['Shadow Ball', 'Flash Cannon', 'Close Combat', "King's Shield"],
    },
    {
      species: 'Heatran',
      item: 'Air Balloon',
      ability: 'Flash Fire',
      level: 98,
      teraType: 'Grass',
      evs: '4 HP / 252 SpA / 252 Spe',
      nature: 'Timid',
      ivs: '0 Atk',
      moves: ['Heat Wave', 'Earth Power', 'Flash Cannon', 'Protect'],
    },
    {
      species: 'Gholdengo',
      item: 'Choice Specs',
      ability: 'Good as Gold',
      level: 99,
      teraType: 'Steel',
      evs: '4 HP / 252 SpA / 252 Spe',
      nature: 'Timid',
      ivs: '0 Atk',
      moves: ['Make It Rain', 'Shadow Ball', 'Thunderbolt', 'Dazzling Gleam'],
    },
    {
      nickname: 'Copperajah Colonial ★',
      species: 'Copperajah',
      item: 'Life Orb',
      ability: 'Sheer Force',
      level: 102,
      teraType: 'Ground',
      evs: '252 HP / 252 Atk / 4 SpD',
      nature: 'Adamant',
      moves: ['Heavy Slam', 'High Horsepower', 'Play Rough', 'Rock Slide'],
    },
  ];

  return {
    chapterId: 'ch8-tamra-cru-viceroy',
    format: 'doubles',
    formatId: CAMPAIGN_DOUBLES_FORMAT_ID,
    formatLabel: 'Acto III · Acero CRU (Nv. 102)',
    reserveAsLastAceSpecies: 'Copperajah',
    playerName: 'Príncipe Heredero',
    playerCharId: 'prince',
    rivalName: 'El Virrey de la CRU',
    rivalTitle: 'Gobernador Colonial de Tamra · Blindaje Imperial',
    rivalCharId: 'dark_commander',
    arenaTheme: 'wyndon-docks',
    playerTeamSummary: 'Tu Escuadrón del Exilio (Acto III · Cap BST 3,300)',
    rivalTeamSummary:
      'Guarnición de Acero de Tamra (Skarmory, Empoleon Competitive, Aegislash WP, Heatran Balloon, Gholdengo Specs, Copperajah ★ Nv. 102)',
    playerShowdownPaste: buildShowdownPaste(playerSquad),
    rivalShowdownPaste: buildShowdownPaste(rivalSquad),
    rivalIntel: {
      visibleSpeciesCount: 3,
      totalSlots: 6,
      intelLabel: 'Acto III · Hazards de Acero + Copperajah Sobrecargado',
      intelNote:
        'Arrancas con Trampa Rocas y Púas de Acero en tu campo; Empoleon castiga Intimidación con Tenacidad (+2 SpA) y Copperajah ★ entra con +1 Atk/+1 Def.',
      levelCap: 100,
      hasBossAce: true,
      bossAceWarning:
        'Copperajah Colonial ★ (Nv. 102 · Potencia Bruta + Life Orb + +1 Atk/+1 Def) aplasta equipos sin respuestas de Fuego/Lucha.',
    },
    puzzleConditions: {
      weather: 'sandstorm',
      extendedEnvironment: true,
      sideConditions: { p1: ['stealthrock', 'spikes'] },
      pokemonModifiers: [
        {
          side: 'p2',
          slotOrSpecies: 'Copperajah',
          boosts: { atk: 1, def: 1 },
        },
      ],
      biomeLabel: '⚙️ Fundición Colonial de Tamra · Hazards T0 + Arena Persistente',
      biomeCounterHint:
        'Trampa Rocas + Púas activas desde Turno 0 castigan cambios; cuidado con activar Competitive de Empoleon usando Intimidate. Trae Fuego/Lucha/Tierra y Heavy-Duty Boots.',
      bannerLog:
        '⚙️ ¡Fortaleza de Cobre de Tamra! Trampa Rocas + Púas rodean tu campo mientras el Virrey despliega su blindaje de Acero.',
    },
    scriptedEnemyRules: [
      {
        id: 'tamra-t1-skarm-tw',
        turn: 1,
        actorSpecies: 'Skarmory',
        forceMoveId: 'tailwind',
        once: true,
        description:
          'Virrey T1: Skarmory despliega Viento Afín para que Empoleon y Gholdengo ataquen primero.',
        tauntLine:
          '«¡Tamra pertenece a las fundiciones de la CRU! ¡Aplasten al príncipe desertor con Viento Afín!»',
      },
    ],
    traces: [],
    flags,
  };
}

/* ============================================================================
 * ACTO III (Misión 9) — ISLA ÆOS: ASALTO AL BLACK SITE DEL DITTO (Nv. 96–115)
 * Regla de Jefe: Ditto Imposter Nv. 115 (HP inflado + +1 Def/+1 SpD T0) + Campo Eléctrico
 * ============================================================================ */
export function resolveAeosDittoBlackSiteBattle(
  flags: StoryFlags = {}
): ResolvedBattleConfig {
  const playerSquad = buildExileCampaignPlayerSquad(100);
  const rivalSquad: ShowdownSetBlock[] = [
    {
      species: 'Porygon2',
      item: 'Eviolite',
      ability: 'Download',
      level: 96,
      teraType: 'Ghost',
      evs: '252 HP / 156 Def / 100 SpD',
      nature: 'Bold',
      ivs: '0 Atk',
      moves: ['Tri Attack', 'Ice Beam', 'Thunderbolt', 'Recover'],
    },
    {
      species: 'Iron Hands',
      item: 'Assault Vest',
      ability: 'Quark Drive',
      level: 98,
      teraType: 'Fire',
      evs: '124 HP / 252 Atk / 132 SpD',
      nature: 'Adamant',
      moves: ['Fake Out', 'Drain Punch', 'Wild Charge', 'Heavy Slam'],
    },
    {
      species: 'Magnezone',
      item: 'Choice Specs',
      ability: 'Analytic',
      level: 98,
      teraType: 'Water',
      evs: '252 HP / 252 SpA / 4 SpD',
      nature: 'Modest',
      ivs: '0 Atk',
      moves: ['Thunderbolt', 'Flash Cannon', 'Volt Switch', 'Tera Blast'],
    },
    {
      species: 'Iron Bundle',
      item: 'Booster Energy',
      ability: 'Quark Drive',
      level: 99,
      teraType: 'Ice',
      evs: '4 HP / 252 SpA / 252 Spe',
      nature: 'Timid',
      ivs: '0 Atk',
      moves: ['Freeze-Dry', 'Hydro Pump', 'Icy Wind', 'Protect'],
    },
    {
      species: 'Genesect',
      item: 'Life Orb',
      ability: 'Download',
      level: 100,
      teraType: 'Electric',
      evs: '4 Atk / 252 SpA / 252 Spe',
      nature: 'Hasty',
      moves: ['Flash Cannon', 'Thunderbolt', 'Ice Beam', 'U-turn'],
    },
    {
      nickname: 'El Último Ditto ★',
      species: 'Ditto',
      item: 'Focus Sash',
      ability: 'Imposter',
      level: 115,
      teraType: 'Normal',
      evs: '252 HP / 252 Def / 4 SpD',
      nature: 'Relaxed',
      ivs: '0 Spe',
      moves: ['Transform'],
    },
  ];

  return {
    chapterId: 'ch9-aeos-ditto-blacksite',
    format: 'doubles',
    formatId: CAMPAIGN_DOUBLES_FORMAT_ID,
    formatLabel: 'Acto III · Black Site Æos (Nv. 115)',
    reserveAsLastAceSpecies: 'Ditto',
    playerName: 'Príncipe Heredero',
    playerCharId: 'prince',
    rivalName: 'Director del Black Site Æos',
    rivalTitle: 'Custodio del Monopolio Ditto · División Genética CRU',
    rivalCharId: 'royal_archivist',
    arenaTheme: 'royal-training-ground',
    playerTeamSummary: 'Tu Escuadrón del Exilio (Acto III · Cap BST 3,300)',
    rivalTeamSummary:
      'Seguridad Genética Æos (Porygon2 Eviolite, Iron Hands AV, Magnezone Specs, Iron Bundle, Genesect Life Orb, EL ÚLTIMO DITTO ★ Nv. 115)',
    playerShowdownPaste: buildShowdownPaste(playerSquad),
    rivalShowdownPaste: buildShowdownPaste(rivalSquad),
    rivalIntel: {
      visibleSpeciesCount: 3,
      totalSlots: 6,
      intelLabel: 'Acto III · Regla Rota: Imposter Nv. 115 + Campo Eléctrico',
      intelNote:
        'Campo Eléctrico persistente activa Quark Drive de Iron Hands e Iron Bundle, mientras el Último Ditto ★ (Nv. 115) entra al final con HP inflado y copia a tu carry más peligroso.',
      levelCap: 100,
      hasBossAce: true,
      bossAceWarning:
        'El Último Ditto ★ (Nv. 115 · Imposter + Focus Sash) clona tus propios boosts y stats con HP inflado. ¡No te boostees sin tener respuesta a tu propio carry!',
    },
    puzzleConditions: {
      terrain: 'electricterrain',
      extendedEnvironment: true,
      sideConditions: { p2: ['lightscreen'] },
      pokemonModifiers: [
        {
          side: 'p2',
          slotOrSpecies: 'Ditto',
          boosts: { def: 1, spd: 1 },
        },
      ],
      biomeLabel: '🧬 Reactor Submarino de Isla Æos · Campo Eléctrico ∞ + Pantalla de Luz',
      biomeCounterHint:
        'Campo Eléctrico activa Quark Drive gratis y bloquea el sueño. Rompe Pantalla de Luz y evita dejar un sweeper +2/+2 en campo cuando baje El Último Ditto ★ Nv. 115.',
      bannerLog:
        '🧬 ¡Black Site de Isla Æos! El reactor enciende Campo Eléctrico persistente y Pantalla de Luz custodiando al Último Ditto ★ (Nv. 115).',
    },
    scriptedEnemyRules: [
      {
        id: 'aeos-t1-hands-fakeout',
        turn: 1,
        actorSpecies: 'Iron Hands',
        forceMoveId: 'fakeout',
        once: true,
        description:
          'Seguridad Æos T1: Iron Hands frena tu apertura con Sorpresa mientras Porygon2 gana tempo.',
        tauntLine:
          '«¡Intruso en la cámara del Último Ditto! ¡Inmovilicen al heredero y escaneen su equipo!»',
      },
    ],
    traces: [],
    flags,
  };
}

/* ============================================================================
 * ACTO IV (Misión 10) — TOHJO / SHENTAI: PRUEBA DE LAS POTENCIAS LIBRES (Nv. 100–105)
 * Calibre OU/Uber con IA en modo táctico estricto + Gravedad Persistente
 * ============================================================================ */
export function resolveTohjoShentaiTrialBattle(
  flags: StoryFlags = {}
): ResolvedBattleConfig {
  const playerSquad = buildExileCampaignPlayerSquad(100);
  const rivalSquad: ShowdownSetBlock[] = [
    {
      species: 'Landorus',
      item: 'Life Orb',
      ability: 'Sheer Force',
      level: 101,
      teraType: 'Steel',
      evs: '4 HP / 252 SpA / 252 Spe',
      nature: 'Timid',
      ivs: '0 Atk',
      moves: ['Sandsear Storm', 'Sludge Bomb', 'Earth Power', 'Protect'],
    },
    {
      species: 'Chi-Yu',
      item: 'Choice Scarf',
      ability: 'Beads of Ruin',
      level: 102,
      teraType: 'Fire',
      evs: '4 HP / 252 SpA / 252 Spe',
      nature: 'Timid',
      ivs: '0 Atk',
      moves: ['Heat Wave', 'Dark Pulse', 'Overheat', 'Snarl'],
    },
    {
      species: 'Raging Bolt',
      item: 'Booster Energy',
      ability: 'Protosynthesis',
      level: 102,
      teraType: 'Electric',
      evs: '244 HP / 252 SpA / 12 Spe',
      nature: 'Modest',
      ivs: '0 Atk',
      moves: ['Thunderclap', 'Draco Meteor', 'Thunderbolt', 'Protect'],
    },
    {
      species: 'Urshifu',
      item: 'Focus Sash',
      ability: 'Unseen Fist',
      level: 103,
      teraType: 'Dark',
      evs: '4 HP / 252 Atk / 252 Spe',
      nature: 'Jolly',
      moves: ['Wicked Blow', 'Close Combat', 'Sucker Punch', 'Detect'],
    },
    {
      species: 'Dragonite',
      item: 'Choice Band',
      ability: 'Multiscale',
      level: 104,
      teraType: 'Normal',
      evs: '4 HP / 252 Atk / 252 Spe',
      nature: 'Adamant',
      moves: ['Extreme Speed', 'Outrage', 'Earthquake', 'Ice Spinner'],
    },
    {
      nickname: 'Chien-Pao ★',
      species: 'Chien-Pao',
      item: 'Focus Sash',
      ability: 'Sword of Ruin',
      level: 105,
      teraType: 'Ghost',
      evs: '4 HP / 252 Atk / 252 Spe',
      nature: 'Jolly',
      moves: ['Icicle Crash', 'Sucker Punch', 'Sacred Sword', 'Protect'],
    },
  ];

  return {
    chapterId: 'ch10-tohjo-shentai-trial',
    format: 'doubles',
    formatId: CAMPAIGN_DOUBLES_FORMAT_ID,
    formatLabel: 'Acto IV · OU/Uber (Nv. 105)',
    reserveAsLastAceSpecies: 'Chien-Pao',
    playerName: 'Príncipe Heredero',
    playerCharId: 'prince',
    rivalName: 'Concilio de Tohjo & Shentai',
    rivalTitle: 'Prueba Marcial de las Potencias Libres',
    rivalCharId: 'e4_ransei',
    arenaTheme: 'honor-duel-hall',
    playerTeamSummary: 'Tu Escuadrón del Exilio (Acto IV · Cap BST 3,600)',
    rivalTeamSummary:
      'Potencias Libres (Landorus-I, Chi-Yu Scarf, Raging Bolt, Urshifu-Single, Dragonite Band, Chien-Pao ★ Nv. 105)',
    playerShowdownPaste: buildShowdownPaste(playerSquad),
    rivalShowdownPaste: buildShowdownPaste(rivalSquad),
    rivalIntel: {
      visibleSpeciesCount: 3,
      totalSlots: 6,
      intelLabel: 'Acto IV · Calibre OU/Uber + Gravedad Persistente',
      intelNote:
        'Tohjo y Shentai no prestarán su flota contra Wyndon a un príncipe débil. Gravedad persistente hace que Sandsear Storm y Heat Wave nunca fallen y aterriza a tus voladores.',
      levelCap: 104,
      hasBossAce: true,
      bossAceWarning:
        'Chien-Pao ★ (Nv. 105 · Espada Debacle) + Dragonite Tera Normal Extreme Speed cierran el combate con daño letal.',
    },
    puzzleConditions: {
      pseudoWeathers: ['gravity'],
      extendedEnvironment: true,
      biomeLabel: '🏯 Cumbre de Tohjo & Shentai · Gravedad Marcial Persistente',
      biomeCounterHint:
        'Gravedad (∞) aterriza a voladores/Levitación (vulnerables a Sandsear Storm / Earthquake) y vuelve 100% precisos todos los golpes de área. Trae Wide Guard y control de velocidad.',
      bannerLog:
        '🏯 ¡Prueba de las Potencias Libres! Gravedad persistente sella la cumbre de Tohjo y Shentai frente a Landorus y Chi-Yu.',
    },
    scriptedEnemyRules: [
      {
        id: 'tohjo-t1-chiyu-heatwave',
        turn: 1,
        actorSpecies: 'Chi-Yu',
        forceMoveId: 'heatwave',
        once: true,
        description:
          'Potencias Libres T1: Chi-Yu (Choice Scarf) lanza Onda Ígnea con 100% de precisión bajo Gravedad.',
        tauntLine:
          '«Si quieres el respaldo de Tohjo y Shentai para marchar sobre Wyndon, sobrevive al fuego de las Cuatro Ruinas.»',
      },
    ],
    traces: [],
    flags,
  };
}

/* ============================================================================
 * ACTO IV (Misión 11) — POKÉTOPIA: CAÍDA DEL CONSEJO TRAIDOR (Nv. 102–106)
 * Antesala Uber antes de Galar: Wonder Room + Trick Room + Miraidon & Calyrex-Ice
 * ============================================================================ */
export function resolvePoketopiaTraitorCouncilBattle(
  flags: StoryFlags = {}
): ResolvedBattleConfig {
  const playerSquad = buildExileCampaignPlayerSquad(100);
  const rivalSquad: ShowdownSetBlock[] = [
    {
      species: 'Incineroar',
      item: 'Sitrus Berry',
      ability: 'Intimidate',
      level: 102,
      teraType: 'Ghost',
      evs: '252 HP / 116 Def / 140 SpD',
      nature: 'Careful',
      moves: ['Fake Out', 'Flare Blitz', 'Knock Off', 'Parting Shot'],
    },
    {
      species: 'Amoonguss',
      item: 'Rocky Helmet',
      ability: 'Regenerator',
      level: 102,
      teraType: 'Water',
      evs: '252 HP / 180 Def / 76 SpD',
      nature: 'Bold',
      ivs: '0 Atk',
      moves: ['Spore', 'Rage Powder', 'Pollen Puff', 'Clear Smog'],
    },
    {
      species: 'Ursaluna-Bloodmoon',
      item: 'Life Orb',
      ability: "Mind's Eye",
      level: 104,
      teraType: 'Normal',
      evs: '252 HP / 252 SpA / 4 SpD',
      nature: 'Quiet',
      ivs: '0 Atk / 0 Spe',
      moves: ['Blood Moon', 'Earth Power', 'Hyper Voice', 'Protect'],
    },
    {
      species: 'Flutter Mane',
      item: 'Booster Energy',
      ability: 'Protosynthesis',
      level: 104,
      teraType: 'Fairy',
      evs: '4 HP / 252 SpA / 252 Spe',
      nature: 'Timid',
      ivs: '0 Atk',
      moves: ['Moonblast', 'Shadow Ball', 'Dazzling Gleam', 'Protect'],
    },
    {
      species: 'Miraidon',
      item: 'Choice Specs',
      ability: 'Hadron Engine',
      level: 105,
      teraType: 'Electric',
      evs: '4 HP / 252 SpA / 252 Spe',
      nature: 'Timid',
      ivs: '0 Atk',
      moves: ['Electro Drift', 'Draco Meteor', 'Dazzling Gleam', 'Volt Switch'],
    },
    {
      nickname: 'Calyrex-Ice ★',
      species: 'Calyrex-Ice',
      item: 'Clear Amulet',
      ability: 'As One (Glastrier)',
      level: 106,
      teraType: 'Fire',
      evs: '252 HP / 252 Atk / 4 SpD',
      nature: 'Brave',
      ivs: '0 Spe',
      moves: ['Glacial Lance', 'High Horsepower', 'Trick Room', 'Protect'],
    },
  ];

  return {
    chapterId: 'ch11-poketopia-traitor-council',
    format: 'doubles',
    formatId: CAMPAIGN_DOUBLES_FORMAT_ID,
    formatLabel: 'Acto IV · Uber Consejo (Nv. 106)',
    reserveAsLastAceSpecies: 'Calyrex-Ice',
    playerName: 'Príncipe Heredero',
    playerCharId: 'prince',
    rivalName: 'El Consejo Traidor',
    rivalTitle: 'Cúpula Financiera de la CRU · Coliseo de Pokétopia',
    rivalCharId: 'dark_commander',
    arenaTheme: 'underground-ring',
    playerTeamSummary: 'Tu Escuadrón del Exilio (Acto IV · Cap BST 3,600)',
    rivalTeamSummary:
      'Cúpula Uber del Consejo (Incineroar, Amoonguss, Ursaluna-BM, Flutter Mane, Miraidon Specs, Calyrex-Ice ★ Nv. 106)',
    playerShowdownPaste: buildShowdownPaste(playerSquad),
    rivalShowdownPaste: buildShowdownPaste(rivalSquad),
    rivalIntel: {
      visibleSpeciesCount: 3,
      totalSlots: 6,
      intelLabel: 'Acto IV Final · Espacio Raro + Zona Extraña + Doble Uber',
      intelNote:
        'Último obstáculo antes de regresar a Galar. Espacio Raro y Zona Extraña arrancan activos para que Incineroar, Amoonguss, Ursaluna-BM y Calyrex-Ice dominen el tablero.',
      levelCap: 105,
      hasBossAce: true,
      bossAceWarning:
        'Miraidon (Choice Specs) y Calyrex-Ice ★ (Nv. 106 · Lanza Glacial) lideran la guardia personal del Consejo Traidor.',
    },
    puzzleConditions: {
      pseudoWeathers: ['trickroom', 'wonderroom'],
      biomeLabel: '🎰 Coliseo Dorado de Pokétopia · Espacio Raro + Zona Extraña (5t)',
      biomeCounterHint:
        'Los primeros 5 turnos invierten Velocidad y Defensa↔Def.Esp. Sobrevive la apertura con Protect/Fake Out o revierte Espacio Raro antes de que caiga Calyrex-Ice ★.',
      bannerLog:
        '🎰 ¡Coliseo de Pokétopia! El Consejo Traidor activa Espacio Raro y Zona Extraña desde Turno 0 para blindar su golpe.',
    },
    scriptedEnemyRules: [
      {
        id: 'council-t1-incin-fakeout',
        turn: 1,
        actorSpecies: 'Incineroar',
        forceMoveId: 'fakeout',
        once: true,
        description:
          'Consejo T1: Incineroar usa Sorpresa mientras Amoonguss amenaza Espora bajo Espacio Raro.',
        tauntLine:
          '«¡El trono ya fue vendido, alteza! ¡Que el Coliseo de Pokétopia sea tu tumba!»',
      },
    ],
    traces: [],
    flags,
  };
}

/* ============================================================================
 * CLÍMAX: LA CORONA (Misión 12) — GALAR (CIUDADELA REAL): EL HERMANO BASTARDO
 * Nv. 105–115 · Sin BST Cap · Zamazenta-Crowned + Eternatus-Eternamax ★ + 4 Ubers!
 * Regla de Jefe: "Escudo Usurpado & Sobrecarga Dinamax" (Pantallas T0 + SR + Boosts)
 * ============================================================================ */
export function resolveBastardBrotherClimaxBattle(
  flags: StoryFlags = {}
): ResolvedBattleConfig {
  const playerSquad = buildExileCampaignPlayerSquad(100);
  const rivalSquad: ShowdownSetBlock[] = [
    {
      species: 'Grimmsnarl',
      item: 'Light Clay',
      ability: 'Prankster',
      level: 105,
      teraType: 'Ghost',
      evs: '252 HP / 128 Def / 128 SpD',
      nature: 'Careful',
      moves: ['Reflect', 'Light Screen', 'Parting Shot', 'Spirit Break'],
    },
    {
      species: 'Incineroar',
      item: 'Assault Vest',
      ability: 'Intimidate',
      level: 106,
      teraType: 'Water',
      evs: '252 HP / 100 Atk / 156 SpD',
      nature: 'Careful',
      moves: ['Fake Out', 'Flare Blitz', 'Knock Off', 'U-turn'],
    },
    {
      species: 'Koraidon',
      item: 'Clear Amulet',
      ability: 'Orichalcum Pulse',
      level: 108,
      teraType: 'Fire',
      evs: '4 HP / 252 Atk / 252 Spe',
      nature: 'Jolly',
      moves: ['Collision Course', 'Flare Blitz', 'Flame Charge', 'Protect'],
    },
    {
      species: 'Calyrex-Shadow',
      item: 'Focus Sash',
      ability: 'As One (Spectrier)',
      level: 110,
      teraType: 'Ghost',
      evs: '4 HP / 252 SpA / 252 Spe',
      nature: 'Timid',
      ivs: '0 Atk',
      moves: ['Astral Barrage', 'Psychic', 'Nasty Plot', 'Protect'],
    },
    {
      nickname: 'Zamazenta Usurpado ★',
      species: 'Zamazenta-Crowned',
      item: 'Rusted Shield',
      ability: 'Dauntless Shield',
      level: 112,
      teraType: 'Dragon',
      evs: '252 HP / 252 Def / 4 Spe',
      nature: 'Impish',
      moves: ['Body Press', 'Behemoth Bash', 'Wide Guard', 'Protect'],
    },
    {
      nickname: 'Eternatus-Eternamax ★',
      species: 'Eternatus-Eternamax',
      item: 'Leftovers',
      ability: 'Pressure',
      level: 115,
      teraType: 'Poison',
      evs: '252 HP / 252 SpA / 4 SpD',
      nature: 'Modest',
      ivs: '0 Atk',
      moves: ['Dynamax Cannon', 'Sludge Bomb', 'Flamethrower', 'Recover'],
    },
  ];

  return {
    chapterId: 'ch12-bastard-brother-climax',
    format: 'doubles',
    formatId: CAMPAIGN_DOUBLES_FORMAT_ID,
    formatLabel: 'CLÍMAX · Ciudadela Real (Nv. 115)',
    reserveAsLastAceSpecies: 'Eternatus-Eternamax',
    playerName: 'Príncipe Heredero',
    playerCharId: 'prince',
    rivalName: 'El Hermano Bastardo',
    rivalTitle: 'Usurpador del Trono de Galar · Escudo & Eternamax',
    rivalCharId: 'bastard_brother',
    arenaTheme: 'clocktower-ruins',
    playerTeamSummary: 'Tu Escuadrón Final (Sin Límite BST · Todo Vale)',
    rivalTeamSummary:
      'Corte del Usurpador (Grimmsnarl, Incineroar, Koraidon, Calyrex-Shadow, ZAMAZENTA-CROWNED Nv.112, ETERNATUS-ETERNAMAX ★ Nv.115)',
    playerShowdownPaste: buildShowdownPaste(playerSquad),
    rivalShowdownPaste: buildShowdownPaste(rivalSquad),
    rivalIntel: {
      visibleSpeciesCount: 2,
      totalSlots: 6,
      intelLabel: 'CLÍMAX FINAL · Sin Cap BST · Escudo & Energía Dinamax',
      intelNote:
        'El enfrentamiento definitivo por la Corona de Galar. Reflejo, Pantalla de Luz y Trampa Rocas arrancan activos desde Turno 0 mientras Zamazenta-Crowned (+1 Def extra) protege la llegada de Eternatus-Eternamax ★ (Nv. 115 · 255 HP / 250 Def / 250 SpD).',
      levelCap: 115,
      hasBossAce: true,
      bossAceWarning:
        'Zamazenta-Crowned (Nv. 112 · Escudo Recio + Wide Guard) y Eternatus-Eternamax ★ (Nv. 115 · Cañón Dinamax + Recuperación) son la muralla final del Usurpador.',
    },
    puzzleConditions: {
      sideConditions: {
        p1: ['stealthrock'],
        p2: ['reflect', 'lightscreen'],
      },
      pokemonModifiers: [
        {
          side: 'p2',
          slotOrSpecies: 'Zamazenta-Crowned',
          boosts: { def: 1 },
        },
        {
          side: 'p2',
          slotOrSpecies: 'Eternatus-Eternamax',
          boosts: { spa: 1 },
        },
      ],
      biomeLabel:
        '👑⚡ Trono de la Ciudadela Real · Escudo Usurpado (Pantallas T0 + SR) & Energía Dinamax',
      biomeCounterHint:
        'Reflejo + Pantalla de Luz T0 en el Usurpador + Trampa Rocas en tu lado. Trae Brick Break / Psychic Fangs, corte de curación (Psychic Noise / Taunt) contra Recover de Eternatus-Eternamax y respuestas para Calyrex-Shadow.',
      bannerLog:
        '👑⚡ ¡CLÍMAX EN LA CIUDADELA REAL! El Hermano Bastardo desata Escudo Usurpado (Reflejo + Pantalla de Luz T0) y la Energía Dinamax de Eternatus-Eternamax ★ (Nv. 115).',
    },
    scriptedEnemyRules: [
      {
        id: 'climax-t1-incin-fakeout',
        turn: 1,
        actorSpecies: 'Incineroar',
        forceMoveId: 'fakeout',
        once: true,
        description:
          'Usurpador T1: Incineroar congela tu apertura mientras Grimmsnarl rota con Última Palabra.',
        tauntLine:
          '«¡Mírate, hermanito! Cruzaste el mundo entero solo para arrodillarte ante el Escudo Real y la Energía Dinamax.»',
      },
      {
        id: 'climax-t1-grimm-parting',
        turn: 1,
        actorSpecies: 'Grimmsnarl',
        forceMoveId: 'partingshot',
        once: true,
        description:
          'Usurpador T1: Grimmsnarl debilita a tu carry y trae a Koraidon / Calyrex-Shadow gratis.',
      },
    ],
    traces: [
      {
        id: 'climax-throne-vow',
        category: 'rival-team',
        choiceLabel:
          String(flags.throne_vow ?? 'justice') === 'mercy'
            ? 'Prometiste reconstruir Galar sin repetir el saqueo de la CRU'
            : 'Juraste arrancar la corona usurpada y desmantelar el Monopolio Ditto',
        flagKey: 'throne_vow',
        flagValue: String(flags.throne_vow ?? 'justice'),
        effectTitle: 'Cierre de la Historia Principal & Cálculo de Ending',
        effectDetail:
          'Al derrotar al Hermano Bastardo se calcula tu Ending definitivo (Confesión Romántica, Harem, Monarca Solitario o Baby Mode) y se revela el Postgame de la Campeona.',
      },
    ],
    flags,
  };
}

/* ============================================================================
 * POSTGAME OPCIONAL (Misión 13) — GALAR (ESTADIO DE WYNDON): LA CAMPEONA DE GALAR
 * Nv. 115–120 · Anything Goes Puro · Mega-Rayquaza ★ + Kyogre + Xerneas + Arceus!
 * Desbloquea True Mastery Badge + New Game+!
 * ============================================================================ */
export function resolvePostgameChampionBattle(
  flags: StoryFlags = {}
): ResolvedBattleConfig {
  const playerSquad = buildExileCampaignPlayerSquad(100);
  const rivalSquad: ShowdownSetBlock[] = [
    {
      species: 'Kyogre',
      item: 'Choice Specs',
      ability: 'Drizzle',
      level: 115,
      teraType: 'Water',
      evs: '4 HP / 252 SpA / 252 Spe',
      nature: 'Timid',
      ivs: '0 Atk',
      moves: ['Water Spout', 'Origin Pulse', 'Ice Beam', 'Thunder'],
    },
    {
      species: 'Xerneas',
      item: 'Power Herb',
      ability: 'Fairy Aura',
      level: 116,
      teraType: 'Fairy',
      evs: '184 HP / 252 SpA / 72 Spe',
      nature: 'Modest',
      ivs: '0 Atk',
      moves: ['Geomancy', 'Moonblast', 'Dazzling Gleam', 'Protect'],
    },
    {
      species: 'Zacian-Crowned',
      item: 'Rusted Sword',
      ability: 'Intrepid Sword',
      level: 117,
      evs: '4 HP / 252 Atk / 252 Spe',
      nature: 'Jolly',
      moves: ['Behemoth Blade', 'Play Rough', 'Sacred Sword', 'Protect'],
    },
    {
      species: 'Calyrex-Shadow',
      item: 'Focus Sash',
      ability: 'As One (Spectrier)',
      level: 118,
      teraType: 'Ghost',
      evs: '4 HP / 252 SpA / 252 Spe',
      nature: 'Timid',
      ivs: '0 Atk',
      moves: ['Astral Barrage', 'Psyshock', 'Pollen Puff', 'Protect'],
    },
    {
      species: 'Arceus',
      item: 'Silk Scarf',
      ability: 'Multitype',
      level: 119,
      teraType: 'Normal',
      evs: '252 HP / 252 Atk / 4 Spe',
      nature: 'Adamant',
      moves: ['Extreme Speed', 'Swords Dance', 'Shadow Claw', 'Recover'],
    },
    {
      nickname: 'Mega-Rayquaza ★',
      species: 'Rayquaza-Mega',
      item: 'Life Orb',
      ability: 'Delta Stream',
      level: 120,
      teraType: 'Normal',
      evs: '4 HP / 252 Atk / 252 Spe',
      nature: 'Jolly',
      moves: ['Dragon Ascent', 'V-create', 'Extreme Speed', 'Protect'],
    },
  ];

  return {
    chapterId: 'ch13-postgame-champion',
    format: 'doubles',
    formatId: CAMPAIGN_DOUBLES_FORMAT_ID,
    formatLabel: 'POSTGAME AG · La Campeona (Nv. 120)',
    reserveAsLastAceSpecies: 'Rayquaza-Mega',
    playerName: 'Monarca de Galar',
    playerCharId: 'prince',
    rivalName: 'La Campeona de Galar (Sin Contenerse)',
    rivalTitle: 'Postgame Opcional · Anything Goes Puro (Nv. 115–120)',
    rivalCharId: 'champion',
    arenaTheme: 'royal-training-ground',
    playerTeamSummary: 'Tu Escuadrón Anything Goes (Sin Límite BST)',
    rivalTeamSummary:
      'Anything Goes Absoluto (Kyogre Specs Nv.115, Xerneas Geomancy Nv.116, Zacian-C Nv.117, Calyrex-S Nv.118, Arceus Nv.119, MEGA-RAYQUAZA ★ Nv.120)',
    playerShowdownPaste: buildShowdownPaste(playerSquad),
    rivalShowdownPaste: buildShowdownPaste(rivalSquad),
    rivalIntel: {
      visibleSpeciesCount: 2,
      totalSlots: 6,
      intelLabel: 'POSTGAME OPCIONAL · Anything Goes Puro (Nv. 115–120)',
      intelNote:
        'El combate más roto del juego entero: Kyogre Specs Water Spout + Xerneas Power Herb Geomancy + Zacian-C + Calyrex-Shadow + Arceus Extreme Killer + Mega-Rayquaza ★ Nv. 120.',
      levelCap: 120,
      hasBossAce: true,
      bossAceWarning:
        'Mega-Rayquaza ★ (Nv. 120 · Delta Stream + Life Orb) es la prueba suprema para el True Mastery Badge y New Game+.',
    },
    puzzleConditions: {
      weather: 'raindance',
      extendedEnvironment: true,
      sideConditions: { p2: ['tailwind'] },
      biomeLabel:
        '🏟️👑 Estadio de Wyndon · Lluvia Anything Goes ∞ + Viento Afín de Campeona',
      biomeCounterHint:
        'Kyogre Specs Water Spout bajo Lluvia ∞ + Tailwind T0 + Xerneas Geomancy. Necesitas Wide Guard, Haze/Clear Smog o tu propio equipo Anything Goes al máximo.',
      bannerLog:
        '🏟️👑 ¡POSTGAME ANYTHING GOES! El Estadio de Wyndon estalla en lluvia torrencial y Viento Afín frente a la Campeona al 100% (Nv. 115–120).',
    },
    scriptedEnemyRules: [
      {
        id: 'pg-champ-t1-xerneas-geo',
        turn: 1,
        actorSpecies: 'Xerneas',
        forceMoveId: 'geomancy',
        once: true,
        description:
          'Campeona Postgame T1: Xerneas consume Hierba Única para activar Geocontrol (+2 SpA/+2 SpD/+2 Spe) junto a Kyogre Water Spout.',
        tauntLine:
          '«Ahora que recuperaste la corona, pequeño… ¡demuéstrame si puedes vencerme cuando no guardo absolutamente nada! ¡Geocontrol!»',
      },
    ],
    traces: [
      {
        id: 'postgame-mastery-vow',
        category: 'rival-team',
        choiceLabel: 'Aceptaste el desafío Postgame Anything Goes en el Estadio de Wyndon',
        flagKey: 'postgame_mastery',
        flagValue: 'accepted',
        effectTitle: 'True Mastery Badge & New Game+',
        effectDetail:
          'Superar este combate otorga la Insignia de Maestría Verdadera y habilita New Game+.',
      },
    ],
    flags,
  };
}

/* ============================================================================
 * JEFE SECRETO DE AURA (ORRE) — PROYECTO XD001: LUGIA OSCURO (Nv. 96–102)
 * Shadow Aeroblast (115 BP área + Crítico) · Shadow Eclipse (+2 SpA/+2 SpD/+1 Spe)
 * ¡Ganar arrebata a XD001 Lugia Oscuro y a las 3 Aves Oscuras a tus Cajas PC!
 * ============================================================================ */
export function resolveXd001ShadowLugiaBattle(
  flags: StoryFlags = {}
): ResolvedBattleConfig {
  const playerSquad = buildExileCampaignPlayerSquad(100);
  const rivalSquad: ShowdownSetBlock[] = [
    {
      nickname: 'Articuno Oscuro',
      species: 'Articuno',
      item: 'Leftovers',
      ability: 'Pressure',
      level: 96,
      teraType: 'Ice',
      evs: '252 HP / 120 Def / 136 SpD',
      nature: 'Calm',
      ivs: '0 Atk',
      moves: ['Shadow Chill', 'Shadow Mist', 'Shadow Sky', 'Freeze-Dry'],
    },
    {
      nickname: 'Zapdos Oscuro',
      species: 'Zapdos',
      item: 'Heavy-Duty Boots',
      ability: 'Static',
      level: 97,
      teraType: 'Electric',
      evs: '4 HP / 252 SpA / 252 Spe',
      nature: 'Timid',
      ivs: '0 Atk',
      moves: ['Shadow Bolt', 'Shadow Wave', 'Shadow Shed', 'Heat Wave'],
    },
    {
      nickname: 'Moltres Oscuro',
      species: 'Moltres',
      item: 'Sitrus Berry',
      ability: 'Flame Body',
      level: 97,
      teraType: 'Fire',
      evs: '4 HP / 252 SpA / 252 Spe',
      nature: 'Timid',
      ivs: '0 Atk',
      moves: ['Shadow Fire', 'Shadow Storm', 'Shadow Panic', 'Hurricane'],
    },
    {
      nickname: 'Snorlax Oscuro',
      species: 'Snorlax',
      item: 'Sitrus Berry',
      ability: 'Thick Fat',
      level: 98,
      teraType: 'Normal',
      evs: '252 HP / 252 Atk / 4 SpD',
      nature: 'Adamant',
      moves: ['Shadow Half', 'Shadow Rush', 'Shadow Hold', 'Body Slam'],
    },
    {
      nickname: 'Salamence Oscuro',
      species: 'Salamence',
      item: 'Life Orb',
      ability: 'Intimidate',
      level: 99,
      teraType: 'Dragon',
      evs: '4 HP / 252 SpA / 252 Spe',
      nature: 'Timid',
      ivs: '0 Atk',
      moves: ['Shadow Rave', 'Shadow Cataclysm', 'Shadow Tear', 'Draco Meteor'],
    },
    {
      nickname: 'XD001 Lugia Oscuro ★',
      species: 'Lugia',
      item: 'Leftovers',
      ability: 'Multiscale',
      level: 102,
      shiny: true,
      teraType: 'Dark',
      evs: '252 HP / 100 Def / 156 SpA',
      nature: 'Modest',
      ivs: '0 Atk',
      moves: ['Shadow Aeroblast', 'Shadow Eclipse', 'Shadow Sky', 'Shadow Siphon'],
    },
  ];

  return {
    chapterId: 'challenge-xd001-shadow-lugia',
    format: 'doubles',
    formatId: CAMPAIGN_DOUBLES_FORMAT_ID,
    formatLabel: 'RAID AURA · XD001 Lugia Oscuro (Nv. 102)',
    reserveAsLastAceSpecies: 'Lugia',
    playerName: 'Príncipe Heredero',
    playerCharId: 'prince',
    rivalName: 'Maestro Cifra Greevil',
    rivalTitle: 'Proyecto XD001 · Isla Tempestad (Aura / Orre)',
    rivalCharId: 'dark_commander',
    arenaTheme: 'titan-sanctum',
    playerTeamSummary: 'Tu Escuadrón de Incursión (Cámara de Purificación)',
    rivalTeamSummary:
      'Escuadrón Cifra 100% Oscuro (Articuno, Zapdos, Moltres, Snorlax, Salamence y XD001 LUGIA OSCURO ★ Nv. 102)',
    playerShowdownPaste: buildShowdownPaste(playerSquad),
    rivalShowdownPaste: buildShowdownPaste(rivalSquad),
    shadowMeta: {
      p1ShadowSpecies: [],
      p2ShadowSpecies: [
        'Articuno',
        'Zapdos',
        'Moltres',
        'Snorlax',
        'Salamence',
        'Lugia',
      ],
      affectionMode: 'classic-rng',
    },
    rivalIntel: {
      visibleSpeciesCount: 3,
      totalSlots: 6,
      intelLabel: 'RAID OSCURO · 6 Pokémon Oscuros + XD001 Lugia (Snaggable)',
      intelNote:
        'Todos los Pokémon rivales son Oscuros (2× a no-Oscuros, 0× INMUNE Hada, 0.5× entre Oscuros). ¡Vencer arrebata a XD001 Lugia Oscuro y a las 3 Aves Oscuras directo a tu PC Box!',
      levelCap: 100,
      hasBossAce: true,
      bossAceWarning:
        'XD001 Lugia Oscuro ★ (Nv. 102 · Multiscale): Shadow Eclipse (+2 SpA/+2 SpD + fuerza Modo Hiper al instante) + Shadow Aeroblast (95 BP área · 100% CRÍTICO en Modo Hiper) + Shadow Siphon (50% drenaje). ¡Cuidado con Shadow Tear de Salamence contra Hadas!',
    },
    puzzleConditions: {
      weather: 'shadowsky',
      extendedEnvironment: true,
      biomeLabel: '🌑⚡ Isla Tempestad (Aura) · Cielo Oscuro ∞ (Proyecto XD001)',
      biomeCounterHint:
        'Los tipo Hada (Gardevoir, Sylveon, Flutter Mane, Xerneas) son COMPLETAMENTE INMUNES (0×) a los ataques Shadow, y otros Pokémon Oscuros los resisten (0.5×). Cambia el clima y lleva Haze/Taunt contra Shadow Eclipse.',
      bannerLog:
        '🌑⚡ ¡PROYECTO XD001 EN ISLA TEMPESTAD! Cielo Oscuro ∞ desciende mientras Maestro Cifra libera a las Aves Oscuras y a XD001 Lugia Oscuro ★.',
    },
    scriptedEnemyRules: [
      {
        id: 'xd001-t1-articuno-mist',
        turn: 1,
        actorSpecies: 'Articuno',
        forceMoveId: 'shadowmist',
        once: true,
        description:
          'Cifra T1: Articuno Oscuro lanza Shadow Mist (-1 Atk/-1 SpA a ambos rivales) mientras Zapdos Oscuro presiona con Shadow Wave.',
        tauntLine:
          '«¡Contempla la obra maestra de Aura! Ni la CRU ni Galar pudieron replicar un corazón tan cerrado como el de XD001.»',
      },
      {
        id: 'xd001-lugia-eclipse',
        actorSpecies: 'Lugia',
        onFirstActiveTurn: true,
        forceMoveId: 'shadoweclipse',
        once: true,
        description:
          'XD001 Lugia Oscuro desata Shadow Eclipse (+2 SpA / +2 SpD / +1 Spe) en cuanto pisa el campo bajo Multiscale.',
        tauntLine:
          '«¡Despierta, XD001! ¡Shadow Eclipse… y borra el cielo entero con Shadow Aeroblast!»',
      },
    ],
    traces: [
      {
        id: 'xd001-snag-vow',
        category: 'rival-team',
        choiceLabel:
          String(flags.xd001_stance ?? 'keep_choice') === 'purify'
            ? 'Juraste llevar a XD001 a la Cámara de Purificación para sanar su corazón'
            : 'Decidiste arrebatar a XD001 y decidir después si purificarlo o desatar su poder oscuro',
        flagKey: 'xd001_stance',
        flagValue: String(flags.xd001_stance ?? 'keep_choice'),
        effectTitle: 'Snagging Automático + Elección de Purificación',
        effectDetail:
          'Al ganar, XD001 Lugia Oscuro y sus 5 escoltas aterrizan en tu PC Box con sus movimientos Shadow intactos. ¡Tú eliges si purificarlos (Psycho Boost) o dejarlos Oscuros!',
      },
    ],
    flags,
  };
}
