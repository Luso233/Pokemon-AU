import {
  CAMPAIGN_DOUBLES_FORMAT_ID,
  type ResolvedBattleConfig,
  type StoryFlags,
} from '../types/game';
import { buildShowdownPaste, type ShowdownSetBlock } from './teamBuilderTree';

function buildPrinceCoreTrio(): ShowdownSetBlock[] {
  return [
    {
      species: 'Arcanine',
      item: 'Sitrus Berry',
      ability: 'Intimidate',
      level: 100,
      teraType: 'Water',
      evs: '244 HP / 4 Atk / 108 Def / 116 SpD / 36 Spe',
      nature: 'Careful',
      moves: ['Flare Blitz', 'Snarl', 'Will-O-Wisp', 'Protect'],
    },
    {
      species: 'Gardevoir',
      item: 'Light Clay',
      ability: 'Trace',
      level: 100,
      teraType: 'Fairy',
      evs: '252 HP / 100 Def / 156 SpA',
      nature: 'Modest',
      ivs: '0 Atk',
      moves: ['Moonblast', 'Psychic', 'Reflect', 'Light Screen'],
    },
    {
      species: 'Corviknight',
      item: 'Leftovers',
      ability: 'Mirror Armor',
      level: 100,
      teraType: 'Dragon',
      evs: '252 HP / 252 Def / 4 SpD',
      nature: 'Impish',
      moves: ['Brave Bird', 'Body Press', 'Tailwind', 'Roost'],
    },
  ];
}

function buildPrinceFullSquad(): ShowdownSetBlock[] {
  return [
    ...buildPrinceCoreTrio(),
    {
      species: 'Milotic',
      item: 'Leftovers',
      ability: 'Competitive',
      level: 100,
      teraType: 'Grass',
      evs: '252 HP / 172 Def / 84 SpA',
      nature: 'Bold',
      ivs: '0 Atk',
      moves: ['Scald', 'Icy Wind', 'Recover', 'Protect'],
    },
    {
      species: 'Dragapult',
      item: 'Life Orb',
      ability: 'Clear Body',
      level: 100,
      teraType: 'Ghost',
      evs: '4 HP / 252 SpA / 252 Spe',
      nature: 'Timid',
      ivs: '0 Atk',
      moves: ['Draco Meteor', 'Shadow Ball', 'Flamethrower', 'Protect'],
    },
    {
      species: 'Archaludon',
      item: 'Assault Vest',
      ability: 'Stamina',
      level: 100,
      teraType: 'Fairy',
      evs: '252 HP / 4 Def / 252 SpA',
      nature: 'Modest',
      ivs: '0 Atk',
      moves: ['Flash Cannon', 'Dragon Pulse', 'Body Press', 'Electro Shot'],
    },
  ];
}

/**
 * Interleaves your 3 Pokémon with your Partner's 3 Pokémon so Turn 1 starts shoulder-to-shoulder:
 * Slot 0 = Your Lead, Slot 1 = Partner's Lead (True 2v2 Human Tag-Team: 3+3 vs 6!).
 */
function interleaveTagTeam(
  playerTrio: ShowdownSetBlock[],
  partnerTrio: ShowdownSetBlock[]
): ShowdownSetBlock[] {
  const result: ShowdownSetBlock[] = [];
  for (let i = 0; i < 3; i++) {
    if (playerTrio[i]) result.push(playerTrio[i]);
    if (partnerTrio[i]) result.push(partnerTrio[i]);
  }
  return result;
}

/* ===================== RANK 2: 2v2 TAG-TEAM BATTLES (3 YOURS + 3 PARTNER VS 6 ENEMIES) ===================== */

export function resolveRomanceTagBattle(
  npcId: 'assassin' | 'court_duelist' | 'champion',
  flags: StoryFlags = {}
): ResolvedBattleConfig {
  const princeTrio = buildPrinceCoreTrio();

  if (npcId === 'assassin') {
    // El Pelirrojo: Pure Edgy offensive trio (Dark/Ghost/Steel) — you cover his Fairy/Fighting holes while he sweeps!
    const partnerTrio: ShowdownSetBlock[] = [
      {
        nickname: 'Kingambit [Aliado]',
        species: 'Kingambit',
        item: 'Black Glasses',
        ability: 'Supreme Overlord',
        level: 100,
        teraType: 'Dark',
        evs: '252 HP / 252 Atk / 4 SpD',
        nature: 'Adamant',
        moves: ['Kowtow Cleave', 'Sucker Punch', 'Iron Head', 'Protect'],
      },
      {
        nickname: 'Ceruledge [Aliado]',
        species: 'Ceruledge',
        item: 'Focus Sash',
        ability: 'Weak Armor',
        level: 100,
        teraType: 'Fire',
        evs: '4 HP / 252 Atk / 252 Spe',
        nature: 'Adamant',
        moves: ['Bitter Blade', 'Shadow Sneak', 'Close Combat', 'Protect'],
      },
      {
        nickname: 'Zoroark-H [Aliado]',
        species: 'Zoroark-Hisui',
        item: 'Life Orb',
        ability: 'Illusion',
        level: 100,
        teraType: 'Ghost',
        evs: '4 HP / 252 SpA / 252 Spe',
        nature: 'Timid',
        ivs: '0 Atk',
        moves: ['Bitter Malice', 'Hyper Voice', 'Flamethrower', 'Protect'],
      },
    ];

    const orreBountyHunters: ShowdownSetBlock[] = [
      {
        species: 'Incineroar',
        item: 'Sitrus Berry',
        ability: 'Intimidate',
        level: 98,
        teraType: 'Ghost',
        evs: '252 HP / 128 Def / 128 SpD',
        nature: 'Careful',
        moves: ['Fake Out', 'Flare Blitz', 'Knock Off', 'Parting Shot'],
      },
      {
        species: 'Flutter Mane',
        item: 'Booster Energy',
        ability: 'Protosynthesis',
        level: 98,
        teraType: 'Fairy',
        evs: '4 HP / 252 SpA / 252 Spe',
        nature: 'Timid',
        ivs: '0 Atk',
        moves: ['Moonblast', 'Shadow Ball', 'Dazzling Gleam', 'Protect'],
      },
      {
        species: 'Iron Hands',
        item: 'Assault Vest',
        ability: 'Quark Drive',
        level: 98,
        teraType: 'Grass',
        evs: '252 HP / 252 Atk / 4 SpD',
        nature: 'Adamant',
        moves: ['Fake Out', 'Drain Punch', 'Wild Charge', 'Heavy Slam'],
      },
      {
        species: 'Landorus',
        item: 'Life Orb',
        ability: 'Sheer Force',
        level: 98,
        teraType: 'Poison',
        evs: '4 HP / 252 SpA / 252 Spe',
        nature: 'Timid',
        ivs: '0 Atk',
        moves: ['Earth Power', 'Sludge Bomb', 'Sandsear Storm', 'Protect'],
      },
      {
        species: 'Gholdengo',
        item: 'Leftovers',
        ability: 'Good as Gold',
        level: 99,
        teraType: 'Water',
        evs: '252 HP / 252 SpA / 4 SpD',
        nature: 'Modest',
        ivs: '0 Atk',
        moves: ['Make It Rain', 'Shadow Ball', 'Nasty Plot', 'Protect'],
      },
      {
        species: 'Roaring Moon',
        item: 'Clear Amulet',
        ability: 'Protosynthesis',
        level: 100,
        teraType: 'Flying',
        evs: '4 HP / 252 Atk / 252 Spe',
        nature: 'Jolly',
        moves: ['Knock Off', 'Acrobatics', 'Tailwind', 'Protect'],
      },
    ];

    return {
      chapterId: 'romance-assassin-r2',
      format: 'doubles',
      formatId: CAMPAIGN_DOUBLES_FORMAT_ID,
      formatLabel: 'Tag 2v2 · Aura (Orre)',
      playerName: 'Príncipe + El Pelirrojo',
      playerCharId: 'prince',
      rivalName: 'Cazarrecompensas de Aura',
      rivalTitle: 'Sindicato de Orre · Combate 2v2 en Equipo',
      rivalCharId: 'corrupt_captain',
      arenaTheme: 'wyndon-alleys',
      playerTeamSummary: 'Tu Trío (Arcanine/Gardevoir/Corviknight) + El Pelirrojo Edgy (Kingambit/Ceruledge/Zoroark-Hisui)',
      rivalTeamSummary: '6 Cazarrecompensas en Aura (Incineroar, Flutter Mane, Iron Hands, Landorus, Gholdengo, Roaring Moon)',
      playerShowdownPaste: buildShowdownPaste(interleaveTagTeam(princeTrio, partnerTrio)),
      rivalShowdownPaste: buildShowdownPaste(orreBountyHunters),
      rivalIntel: {
        visibleSpeciesCount: 4,
        totalSlots: 6,
        intelLabel: 'Tag 2v2 en Aura (Orre) · 3+3 vs 6',
        intelNote:
          'El Pelirrojo armó 3 counters puramente edgy (Siniestro/Fantasma/Acero). Cubre sus huecos frente a Hada (Flutter Mane) y Lucha (Iron Hands) mientras él barre.',
        levelCap: 100,
        hasBossAce: false,
      },
      romanceMeta: {
        npcId: 'assassin',
        targetRank: 2,
        mode: 'tag-2v2',
        partnerLabel: 'El Pelirrojo (Rival Edgy)',
      },
      scriptedEnemyRules: [
        {
          id: 'rom-ass-r2-t1-incin',
          turn: 1,
          actorSpecies: 'Incineroar',
          forceMoveId: 'fakeout',
          targetSpec: 'slot:1',
          once: true,
          description: 'Cazarrecompensas T1: Incineroar frena tu flanco izquierdo mientras Flutter Mane presiona al Pelirrojo.',
          tauntLine: '«¡El Consejo y la CRU pagan doble por el príncipe y el desertor de Ryme! ¡Sorpresa!»',
        },
      ],
      traces: [
        {
          id: 'tag-assassin',
          category: 'player-roster',
          choiceLabel: 'Alianza Tag 2v2 en Aura con El Pelirrojo',
          flagKey: 'romance_partner',
          flagValue: 'assassin',
          effectTitle: '3 Pokémon tuyos + 3 sweepers edgy de El Pelirrojo',
          effectDetail: 'Ganar sube su Afinidad a Rango 2 y abre su Rematch Injusta.',
        },
      ],
      flags,
    };
  }

  if (npcId === 'court_duelist') {
    // La Duelista de Vayra: Authentic 1v1 specialty sets (No Retreat Falinks, Choice Band Urshifu, Custap + Endure Skeledirge!)
    const partnerTrio: ShowdownSetBlock[] = [
      {
        nickname: 'Falinks [Aliada]',
        species: 'Falinks',
        item: 'Sitrus Berry',
        ability: 'Defiant',
        level: 100,
        teraType: 'Fighting',
        evs: '252 HP / 252 Atk / 4 SpD',
        nature: 'Adamant',
        moves: ['No Retreat', 'Close Combat', 'Megahorn', 'First Impression'],
      },
      {
        nickname: 'Urshifu [Aliada]',
        species: 'Urshifu',
        item: 'Choice Band',
        ability: 'Unseen Fist',
        level: 100,
        teraType: 'Dark',
        evs: '4 HP / 252 Atk / 252 Spe',
        nature: 'Jolly',
        moves: ['Wicked Blow', 'Close Combat', 'Sucker Punch', 'U-turn'],
      },
      {
        nickname: 'Skeledirge [Aliada]',
        species: 'Skeledirge',
        item: 'Custap Berry',
        ability: 'Unaware',
        level: 100,
        teraType: 'Fairy',
        evs: '252 HP / 100 Def / 156 SpA',
        nature: 'Modest',
        ivs: '0 Atk',
        moves: ['Torch Song', 'Shadow Ball', 'Endure', 'Slack Off'],
      },
    ];

    const orangeRegimeEnemies: ShowdownSetBlock[] = [
      {
        species: 'Pelipper',
        item: 'Damp Rock',
        ability: 'Drizzle',
        level: 98,
        teraType: 'Water',
        evs: '252 HP / 252 SpA / 4 SpD',
        nature: 'Modest',
        ivs: '0 Atk',
        moves: ['Hurricane', 'Weather Ball', 'Tailwind', 'Protect'],
      },
      {
        species: 'Palafin',
        item: 'Mystic Water',
        ability: 'Zero to Hero',
        level: 98,
        teraType: 'Water',
        evs: '252 HP / 252 Atk / 4 SpD',
        nature: 'Adamant',
        moves: ['Jet Punch', 'Wave Crash', 'Flip Turn', 'Protect'],
      },
      {
        species: 'Amoonguss',
        item: 'Rocky Helmet',
        ability: 'Regenerator',
        level: 98,
        teraType: 'Water',
        evs: '252 HP / 180 Def / 76 SpD',
        nature: 'Bold',
        ivs: '0 Atk',
        moves: ['Spore', 'Rage Powder', 'Pollen Puff', 'Clear Smog'],
      },
      {
        species: 'Dragonite',
        item: 'Choice Band',
        ability: 'Multiscale',
        level: 99,
        teraType: 'Normal',
        evs: '252 HP / 252 Atk / 4 SpD',
        nature: 'Adamant',
        moves: ['Extreme Speed', 'Outrage', 'Earthquake', 'Ice Spinner'],
      },
      {
        species: 'Gyarados',
        item: 'Sitrus Berry',
        ability: 'Intimidate',
        level: 98,
        teraType: 'Steel',
        evs: '252 HP / 100 Atk / 156 Def',
        nature: 'Impish',
        moves: ['Waterfall', 'Thunder Wave', 'Taunt', 'Protect'],
      },
      {
        species: 'Basculegion',
        item: 'Life Orb',
        ability: 'Swift Swim',
        level: 100,
        teraType: 'Ghost',
        evs: '4 HP / 252 Atk / 252 Spe',
        nature: 'Adamant',
        moves: ['Wave Crash', 'Last Respects', 'Aqua Jet', 'Protect'],
      },
    ];

    return {
      chapterId: 'romance-duelist-r2',
      format: 'doubles',
      formatId: CAMPAIGN_DOUBLES_FORMAT_ID,
      formatLabel: 'Tag 2v2 · Vayra',
      playerName: 'Príncipe + La Duelista',
      playerCharId: 'prince',
      rivalName: 'Comisario de las Islas Naranja',
      rivalTitle: 'Régimen Agrario Totalitario · Purga en Vayra',
      rivalCharId: 'dock_militia',
      arenaTheme: 'wyndon-docks',
      playerTeamSummary: 'Tu Trío + Sets 1v1 de La Duelista (No Retreat Falinks / Band Urshifu / Custap Skeledirge)',
      rivalTeamSummary: 'Flota de Purga de las Islas Naranja (Pelipper, Palafin, Amoonguss, Dragonite, Gyarados, Basculegion)',
      playerShowdownPaste: buildShowdownPaste(interleaveTagTeam(princeTrio, partnerTrio)),
      rivalShowdownPaste: buildShowdownPaste(orangeRegimeEnemies),
      rivalIntel: {
        visibleSpeciesCount: 4,
        totalSlots: 6,
        intelLabel: 'Tag 2v2 en Vayra · 3+3 vs 6',
        intelNote:
          'Sus 3 Pokémon traen sets de 1v1 (No Retreat Falinks, Choice Band Urshifu, Custap Berry + Endure Skeledirge) para borrar blancos uno a uno mientras tú controlas la masa.',
        levelCap: 100,
        hasBossAce: false,
      },
      romanceMeta: {
        npcId: 'court_duelist',
        targetRank: 2,
        mode: 'tag-2v2',
        partnerLabel: 'La Duelista de Vayra',
      },
      scriptedEnemyRules: [
        {
          id: 'rom-duel-r2-t1-peli',
          turn: 1,
          actorSpecies: 'Pelipper',
          forceMoveId: 'tailwind',
          once: true,
          description: 'Patrulla Islas Naranja T1: Pelipper despliega Tailwind bajo Lluvia.',
          tauntLine: '«¡Todo entrenador tradicional será purgado en la costa de Vayra! ¡Viento Afín!»',
        },
      ],
      traces: [
        {
          id: 'tag-duelist',
          category: 'player-roster',
          choiceLabel: 'Alianza Tag 2v2 con La Duelista de Vayra',
          flagKey: 'romance_partner',
          flagValue: 'court_duelist',
          effectTitle: '3 Pokémon tuyos + 3 asesinos 1v1 de La Duelista',
          effectDetail: 'Ganar sube su Afinidad a Rango 2, regala Focus Sash + Choice Band y abre su Rematch 1v1 Puro.',
        },
      ],
      flags,
    };
  }

  // Champion Rank 2 Tag-Team 2v2: YOU FIGHT SIDE-BY-SIDE WITH HER MEGA-RAYQUAZA AGAINST COUNCIL UBERS!
  const champTrio: ShowdownSetBlock[] = [
    {
      nickname: 'Mega-Rayquaza [Maestra]',
      species: 'Rayquaza-Mega',
      item: 'Life Orb',
      ability: 'Delta Stream',
      level: 100,
      teraType: 'Normal',
      evs: '4 HP / 252 Atk / 252 Spe',
      nature: 'Jolly',
      moves: ['Dragon Ascent', 'Extreme Speed', 'V-create', 'Protect'],
    },
    {
      nickname: 'Dragapult [Maestra]',
      species: 'Dragapult',
      item: 'Focus Sash',
      ability: 'Clear Body',
      level: 100,
      teraType: 'Ghost',
      evs: '4 HP / 252 SpA / 252 Spe',
      nature: 'Timid',
      ivs: '0 Atk',
      moves: ['Draco Meteor', 'Shadow Ball', 'Flamethrower', 'Protect'],
    },
    {
      nickname: 'Raging Bolt [Maestra]',
      species: 'Raging Bolt',
      item: 'Booster Energy',
      ability: 'Protosynthesis',
      level: 100,
      teraType: 'Electric',
      evs: '244 HP / 252 SpA / 12 Spe',
      nature: 'Modest',
      ivs: '0 Atk',
      moves: ['Thunderclap', 'Draco Meteor', 'Thunderbolt', 'Protect'],
    },
  ];

  const councilUbers: ShowdownSetBlock[] = [
    {
      species: 'Grimmsnarl',
      item: 'Light Clay',
      ability: 'Prankster',
      level: 100,
      teraType: 'Ghost',
      evs: '252 HP / 128 Def / 128 SpD',
      nature: 'Careful',
      moves: ['Reflect', 'Light Screen', 'Spirit Break', 'Parting Shot'],
    },
    {
      species: 'Miraidon',
      item: 'Choice Specs',
      ability: 'Hadron Engine',
      level: 100,
      teraType: 'Electric',
      evs: '4 HP / 252 SpA / 252 Spe',
      nature: 'Timid',
      ivs: '0 Atk',
      moves: ['Electro Drift', 'Draco Meteor', 'Dazzling Gleam', 'Volt Switch'],
    },
    {
      species: 'Chi-Yu',
      item: 'Choice Scarf',
      ability: 'Beads of Ruin',
      level: 100,
      teraType: 'Fire',
      evs: '4 HP / 252 SpA / 252 Spe',
      nature: 'Timid',
      ivs: '0 Atk',
      moves: ['Heat Wave', 'Dark Pulse', 'Overheat', 'Snarl'],
    },
    {
      species: 'Chien-Pao',
      item: 'Focus Sash',
      ability: 'Sword of Ruin',
      level: 100,
      teraType: 'Dark',
      evs: '4 HP / 252 Atk / 252 Spe',
      nature: 'Jolly',
      moves: ['Icicle Crash', 'Sucker Punch', 'Sacred Sword', 'Protect'],
    },
    {
      species: 'Ursaluna-Bloodmoon',
      item: 'Leftovers',
      ability: "Mind's Eye",
      level: 100,
      teraType: 'Normal',
      evs: '252 HP / 252 SpA / 4 SpD',
      nature: 'Modest',
      ivs: '0 Atk',
      moves: ['Blood Moon', 'Earth Power', 'Hyper Voice', 'Protect'],
    },
    {
      species: 'Zamazenta-Crowned',
      item: 'Rusted Shield',
      ability: 'Dauntless Shield',
      level: 100,
      evs: '252 HP / 252 Def / 4 Spe',
      nature: 'Impish',
      moves: ['Body Press', 'Heavy Slam', 'Wide Guard', 'Protect'],
    },
  ];

  return {
    chapterId: 'romance-champion-r2',
    format: 'doubles',
    formatId: CAMPAIGN_DOUBLES_FORMAT_ID,
    formatLabel: 'Tag 2v2 · Mega-Rayquaza',
    playerName: 'Príncipe + La Campeona',
    playerCharId: 'prince',
    rivalName: 'Fuerza Uber del Consejo',
    rivalTitle: 'Élite del Hermano Bastardo & CRU · Combate 2v2 Uber',
    rivalCharId: 'dark_commander',
    arenaTheme: 'royal-training-ground',
    playerTeamSummary: 'Tu Trío + La Campeona (MEGA-RAYQUAZA / Dragapult / Raging Bolt)',
    rivalTeamSummary: 'Fuerza Uber del Consejo (Grimmsnarl, Miraidon, Chi-Yu, Chien-Pao, Ursaluna-BM, Zamazenta-C)',
    playerShowdownPaste: buildShowdownPaste(interleaveTagTeam(princeTrio, champTrio)),
    rivalShowdownPaste: buildShowdownPaste(councilUbers),
    rivalIntel: {
      visibleSpeciesCount: 4,
      totalSlots: 6,
      intelLabel: 'Tag 2v2 Uber · Mega-Rayquaza Aliado',
      intelNote:
        'Peleas al lado de tu maestra y su Mega-Rayquaza (Delta Stream + Dragon Ascent + V-create) frente a una fuerza Uber del Consejo.',
      levelCap: 100,
      hasBossAce: true,
      bossAceWarning: 'Miraidon y Zamazenta-Crowned encabezan la división Uber de la CRU.',
    },
    romanceMeta: {
      npcId: 'champion',
      targetRank: 2,
      mode: 'tag-2v2',
      partnerLabel: 'La Campeona de Galar',
    },
    scriptedEnemyRules: [
      {
        id: 'rom-champ-r2-t1-grimm',
        turn: 1,
        actorSpecies: 'Grimmsnarl',
        forceMoveId: 'reflect',
        once: true,
        description: 'Fuerza Uber T1: Grimmsnarl alza Reflejo desesperado ante Mega-Rayquaza.',
        tauntLine: '«¡¿Desplegó a Mega-Rayquaza para proteger al heredero?! ¡Alcen Reflejo inmediato!»',
      },
    ],
    traces: [
      {
        id: 'tag-champion',
        category: 'player-roster',
        choiceLabel: 'Alianza Tag 2v2 con La Campeona y Mega-Rayquaza',
        flagKey: 'romance_partner',
        flagValue: 'champion',
        effectTitle: '3 Pokémon tuyos + Mega-Rayquaza, Dragapult y Raging Bolt',
        effectDetail: 'Ganar sube su Afinidad a Rango 2 y abre el desafío final Anything Goes (Rango 3).',
      },
    ],
    flags,
  };
}

/* ===================== RANK 3: UNFAIR REMATCHES (HIGH RISK / HOUSE PC + ROMANTIC ENDING!) ===================== */

export function resolveRomanceRematchBattle(
  npcId: 'assassin' | 'court_duelist' | 'champion',
  flags: StoryFlags = {}
): ResolvedBattleConfig {
  const playerSquad = buildPrinceFullSquad();

  if (npcId === 'assassin') {
    // El Pelirrojo R3: Peak Edgy Powerhouses (Kingambit, Chien-Pao, Dragapult, Ceruledge, Zoroark-Hisui, Hydreigon)!
    const rivalSquad: ShowdownSetBlock[] = [
      {
        species: 'Zoroark-Hisui',
        item: 'Focus Sash',
        ability: 'Illusion',
        level: 103,
        teraType: 'Ghost',
        evs: '4 HP / 252 SpA / 252 Spe',
        nature: 'Timid',
        ivs: '0 Atk',
        moves: ['Bitter Malice', 'Hyper Voice', 'Taunt', 'Protect'],
      },
      {
        species: 'Ceruledge',
        item: 'Clear Amulet',
        ability: 'Flash Fire',
        level: 103,
        teraType: 'Grass',
        evs: '252 HP / 252 Atk / 4 SpD',
        nature: 'Adamant',
        moves: ['Bitter Blade', 'Shadow Sneak', 'Close Combat', 'Swords Dance'],
      },
      {
        species: 'Dragapult',
        item: 'Choice Specs',
        ability: 'Infiltrator',
        level: 104,
        teraType: 'Ghost',
        evs: '4 HP / 252 SpA / 252 Spe',
        nature: 'Timid',
        ivs: '0 Atk',
        moves: ['Draco Meteor', 'Shadow Ball', 'Flamethrower', 'U-turn'],
      },
      {
        species: 'Hydreigon',
        item: 'Life Orb',
        ability: 'Levitate',
        level: 104,
        teraType: 'Steel',
        evs: '4 HP / 252 SpA / 252 Spe',
        nature: 'Timid',
        ivs: '0 Atk',
        moves: ['Dark Pulse', 'Draco Meteor', 'Heat Wave', 'Tailwind'],
      },
      {
        species: 'Chien-Pao',
        item: 'Focus Sash',
        ability: 'Sword of Ruin',
        level: 105,
        teraType: 'Dark',
        evs: '4 HP / 252 Atk / 252 Spe',
        nature: 'Jolly',
        moves: ['Icicle Crash', 'Sucker Punch', 'Sacred Sword', 'Protect'],
      },
      {
        nickname: 'Kingambit ★',
        species: 'Kingambit',
        item: 'Black Glasses',
        ability: 'Supreme Overlord',
        level: 106,
        teraType: 'Dark',
        evs: '252 HP / 252 Atk / 4 SpD',
        nature: 'Adamant',
        moves: ['Kowtow Cleave', 'Sucker Punch', 'Iron Head', 'Swords Dance'],
      },
    ];

    return {
      chapterId: 'romance-assassin-r3',
      format: 'doubles',
      formatId: CAMPAIGN_DOUBLES_FORMAT_ID,
      formatLabel: 'Rematch Injusta · Edgy R3',
      reserveAsLastAceSpecies: 'Kingambit',
      playerName: 'Príncipe Heredero',
      playerCharId: 'prince',
      rivalName: 'El Pelirrojo (Rival Edgy)',
      rivalTitle: 'Rematch Injusta · Counter-Team Edgy Rango 3',
      rivalCharId: 'assassin',
      arenaTheme: 'wyndon-alleys',
      playerTeamSummary: 'Tu Escuadrón Completo (6 Pokémon · Sin Piedad)',
      rivalTeamSummary: 'Counter-Team Edgy al Límite (Zoroark-H, Ceruledge, Dragapult, Hydreigon, Chien-Pao, Kingambit ★ Nv.106)',
      playerShowdownPaste: buildShowdownPaste(playerSquad),
      rivalShowdownPaste: buildShowdownPaste(rivalSquad),
      rivalIntel: {
        visibleSpeciesCount: 3,
        totalSlots: 6,
        intelLabel: 'Rematch Injusta · Counter-Team Edgy',
        intelNote:
          'Arrancas con Trampa Rocas en tu campo frente a los 6 sweepers más edgys y rotos de El Pelirrojo. Si lo vences, sus 3 glass cannons se unen a tu Casa/PC.',
        levelCap: 100,
        hasBossAce: true,
        bossAceWarning: 'Chien-Pao + Kingambit ★ (Nv. 106 · Supreme Overlord) cierran el duelo.',
      },
      puzzleConditions: {
        sideConditions: { p1: ['stealthrock'] },
        bannerLog:
          '🗡️ ¡Rematch Injusta (El Pelirrojo)! Empiezas con Trampa Rocas y sus 6 sweepers edgy sobre el cap de nivel.',
      },
      romanceMeta: {
        npcId: 'assassin',
        targetRank: 3,
        mode: 'unfair-rematch',
      },
      scriptedEnemyRules: [
        {
          id: 'rom-ass-r3-t1-taunt',
          turn: 1,
          actorSpecies: 'Zoroark-Hisui',
          forceMoveId: 'taunt',
          targetSpec: 'species:Gardevoir',
          once: true,
          description: 'Rematch Injusta T1: Zoroark-Hisui busca silenciar las pantallas de Gardevoir desde el inicio.',
          tauntLine: '«Ya leí cada miembro de tu equipo, Alteza. ¡Demuéstrame que puedes sobrevivir a mis mejores counters!»',
        },
      ],
      traces: [],
      flags,
    };
  }

  if (npcId === 'court_duelist') {
    // La Duelista de Vayra R3: PURE 1v1 FORMAT (gen91v1 — Bring 3, Pick 1!) with mathematically tuned 1v1 spreads!
    const duelist1v1Trio: ShowdownSetBlock[] = [
      {
        species: 'Urshifu-Rapid-Strike',
        item: 'Focus Sash',
        ability: 'Unseen Fist',
        level: 100,
        evs: '4 HP / 252 Atk / 252 Spe',
        nature: 'Jolly',
        moves: ['Surging Strikes', 'Close Combat', 'Aqua Jet', 'Counter'],
      },
      {
        species: 'Iron Crown',
        item: 'Booster Energy',
        ability: 'Quark Drive',
        level: 100,
        evs: '132 HP / 124 Def / 252 SpA',
        nature: 'Modest',
        ivs: '0 Atk',
        moves: ['Tachyon Cutter', 'Psychic', 'Focus Blast', 'Calm Mind'],
      },
      {
        species: 'Skeledirge',
        item: 'Custap Berry',
        ability: 'Unaware',
        level: 100,
        evs: '248 HP / 164 Def / 96 SpA',
        nature: 'Bold',
        ivs: '0 Atk',
        moves: ['Torch Song', 'Shadow Ball', 'Endure', 'Slack Off'],
      },
    ];

    const prince1v1Trio: ShowdownSetBlock[] = [
      {
        species: 'Metagross',
        item: 'Weakness Policy',
        ability: 'Clear Body',
        level: 100,
        evs: '252 HP / 196 Atk / 60 Spe',
        nature: 'Adamant',
        moves: ['Meteor Mash', 'Psychic Fangs', 'Bullet Punch', 'Earthquake'],
      },
      {
        species: 'Primarina',
        item: 'Custap Berry',
        ability: 'Torrent',
        level: 100,
        evs: '248 HP / 108 Def / 152 SpA',
        nature: 'Modest',
        ivs: '0 Atk',
        moves: ['Hydro Cannon', 'Moonblast', 'Endure', 'Aqua Jet'],
      },
      {
        species: 'Gallade',
        item: 'Choice Scarf',
        ability: 'Sharpness',
        level: 100,
        evs: '4 HP / 252 Atk / 252 Spe',
        nature: 'Jolly',
        moves: ['Sacred Sword', 'Psycho Cut', 'Leaf Blade', 'Trick'],
      },
    ];

    return {
      chapterId: 'romance-duelist-r3',
      format: 'singles',
      formatId: 'gen91v1',
      formatLabel: '1v1 Puro · Pick 1 (R3)',
      interactiveTeamPreview: true,
      openTeamsheet: false,
      playerName: 'Príncipe Heredero',
      playerCharId: 'prince',
      rivalName: 'La Duelista de Vayra',
      rivalTitle: 'Rematch Injusta · Formato 1v1 Puro Rango 3',
      rivalCharId: 'court_duelist',
      arenaTheme: 'honor-duel-hall',
      playerTeamSummary: 'Trío 1v1 del Heredero (Metagross WP / Primarina Custap / Gallade Scarf — Eliges 1)',
      rivalTeamSummary: 'Trío Especialista 1v1 (Urshifu-R Focus Sash+Counter / Iron Crown Bulky / Skeledirge Custap+Endure)',
      playerShowdownPaste: buildShowdownPaste(prince1v1Trio),
      rivalShowdownPaste: buildShowdownPaste(duelist1v1Trio),
      rivalIntel: {
        visibleSpeciesCount: 3,
        totalSlots: 3,
        intelLabel: 'Rematch 1v1 Puro · Bring 3, Pick 1',
        intelNote:
          'Sin relevos ni segunda oportunidad: formato oficial gen91v1. Sus spreads están calculados para aguantar golpes con 1 PS (Focus Sash + Counter / Custap Berry + Endure) y devolver OHKO.',
        levelCap: 100,
        hasBossAce: true,
        bossAceWarning: 'Urshifu-Rapid-Strike (Sash + Counter) y Skeledirge (Custap + Endure) castigan cualquier mal cruce.',
      },
      romanceMeta: {
        npcId: 'court_duelist',
        targetRank: 3,
        mode: 'unfair-rematch',
      },
      scriptedEnemyRules: [],
      traces: [],
      flags,
    };
  }

  // Champion Rank 3 Unfair Rematch: ANYTHING GOES FINAL BOSS!
  // Mega-Rayquaza ★ + Kyogre (Normal: Bubble Beam + Mystic Water -> Diablo: Water Spout + Choice Specs) + Zacian-Crowned!
  const championSquad: ShowdownSetBlock[] = [
    {
      species: 'Kyogre',
      item: 'Mystic Water',
      ability: 'Drizzle',
      level: 104,
      teraType: 'Water',
      evs: '4 HP / 252 SpA / 252 Spe',
      nature: 'Timid',
      ivs: '0 Atk',
      moves: ['Bubble Beam', 'Ice Beam', 'Thunder', 'Protect'],
    },
    {
      species: 'Tornadus',
      item: 'Focus Sash',
      ability: 'Prankster',
      level: 103,
      teraType: 'Ghost',
      evs: '252 HP / 4 Def / 252 Spe',
      nature: 'Timid',
      ivs: '0 Atk',
      moves: ['Tailwind', 'Bleakwind Storm', 'Taunt', 'Protect'],
    },
    {
      species: 'Dragapult',
      item: 'Sitrus Berry',
      ability: 'Clear Body',
      level: 104,
      teraType: 'Ghost',
      evs: '4 HP / 252 SpA / 252 Spe',
      nature: 'Timid',
      ivs: '0 Atk',
      moves: ['Draco Meteor', 'Shadow Ball', 'Flamethrower', 'Protect'],
    },
    {
      species: 'Volcarona',
      item: 'Heavy-Duty Boots',
      ability: 'Flame Body',
      level: 104,
      teraType: 'Grass',
      evs: '4 HP / 252 SpA / 252 Spe',
      nature: 'Timid',
      ivs: '0 Atk',
      moves: ['Heat Wave', 'Quiver Dance', 'Bug Buzz', 'Giga Drain'],
    },
    {
      species: 'Zacian-Crowned',
      item: 'Rusted Sword',
      ability: 'Intrepid Sword',
      level: 106,
      evs: '4 HP / 252 Atk / 252 Spe',
      nature: 'Jolly',
      moves: ['Behemoth Blade', 'Play Rough', 'Sacred Sword', 'Protect'],
    },
    {
      nickname: 'Mega-Rayquaza ★',
      species: 'Rayquaza-Mega',
      item: 'Life Orb',
      ability: 'Delta Stream',
      level: 108,
      teraType: 'Normal',
      evs: '4 HP / 252 Atk / 252 Spe',
      nature: 'Jolly',
      moves: ['Dragon Ascent', 'Extreme Speed', 'V-create', 'Protect'],
    },
  ];

  return {
    chapterId: 'romance-champion-r3',
    format: 'doubles',
    formatId: CAMPAIGN_DOUBLES_FORMAT_ID,
    formatLabel: 'Anything Goes · Campeona R3',
    reserveAsLastAceSpecies: 'Rayquaza-Mega',
    playerName: 'Príncipe Heredero',
    playerCharId: 'prince',
    rivalName: 'La Campeona de Galar',
    rivalTitle: 'Postgame · Anything Goes (Mega-Rayquaza ★)',
    rivalCharId: 'champion',
    arenaTheme: 'royal-training-ground',
    playerTeamSummary: 'Tu Escuadrón Completo (6 Pokémon)',
    rivalTeamSummary: 'Equipo Anything Goes (Kyogre + Tornadus + Dragapult + Volcarona + Zacian-C + MEGA-RAYQUAZA ★ Nv.108)',
    playerShowdownPaste: buildShowdownPaste(playerSquad),
    rivalShowdownPaste: buildShowdownPaste(championSquad),
    rivalIntel: {
      visibleSpeciesCount: 2,
      totalSlots: 6,
      intelLabel: 'Anything Goes · Jefa Final Postgame',
      intelNote:
        'Reglas Anything Goes sin restricciones. En Estándar Kyogre lleva Bubble Beam + Mystic Water; en Diablo sube a Water Spout + Choice Specs y Mega-Rayquaza ★ cierra la arena.',
      levelCap: 100,
      hasBossAce: true,
      bossAceWarning: 'Mega-Rayquaza ★ (Nv. 108 · Delta Stream + Dragon Ascent + V-create) espera como cierre definitivo.',
    },
    puzzleConditions: {
      weather: 'raindance',
      sideConditions: { p2: ['reflect'] },
      bannerLog:
        '👑 ¡Anything Goes — La Graduación de la Campeona! Lluvia intensa, Reflejo inicial y Mega-Rayquaza ★ esperando en la reserva.',
    },
    romanceMeta: {
      npcId: 'champion',
      targetRank: 3,
      mode: 'unfair-rematch',
    },
    scriptedEnemyRules: [
      {
        id: 'rom-champ-r3-t1-torn',
        turn: 1,
        actorSpecies: 'Tornadus',
        forceMoveId: 'tailwind',
        once: true,
        description: 'Campeona T1: Tornadus asegura velocidad total con Tailwind.',
        tauntLine: '«Veamos si el niño del jardín realmente superó a su maestra antes de bajar a Mega-Rayquaza del cielo. ¡Viento Afín!»',
      },
    ],
    traces: [],
    flags,
  };
}
