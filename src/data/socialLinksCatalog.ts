import type { CharacterId, CustomTeamMember, PlayerSaveProfile } from '../types/game';
import type { WorldBlocId } from './worldGeopolitics';

export type RomanceBatchTier = 1 | 2 | 3;
export type RomanceRoleTrack = 'exile-8' | 'elite-4' | 'champion';

export interface RomanceNpcDefinition {
  id: string;
  charId?: CharacterId;
  name: string;
  nickname: string;
  title: string;
  batch: RomanceBatchTier;
  roleTrack: RomanceRoleTrack;
  roleBadge: string;
  playableNow: boolean;
  homeBlocId: WorldBlocId;
  bio: string;
  /** Competitive gimmick / archetype headline. */
  gimmickTag: string;
  /** Narrative Boss Rule-Breaking Ace showcase (e.g. Ursaluna Reloj de los Andes, Mega-Rayquaza AG). */
  bossAceRule?: {
    aceSpecies: string;
    ruleName: string;
    ruleDetail: string;
  };
  /** Rank 1: VN-only scene -> unlocks immediate Ironman camp survival perk! */
  rank1PerkTitle: string;
  rank1PerkDetail: string;
  /** Rank 2: 2v2 Human Tag-Team (3 yours + 3 theirs vs 6 foes). */
  rank2BattleTitle: string;
  rank2PerkTitle: string;
  rank2PerkDetail: string;
  /** Rank 3: Unfair Rematch -> House PC Pokémon + Romantic Ending flag! */
  rank3BattleTitle: string;
  rank3PerkTitle: string;
  rank3PerkDetail: string;
  /** Top-tier Pokémon unlocked in your House/PC upon reaching Rank 3 (Nuzlocke lifesavers!). */
  housePokemon: CustomTeamMember[];
  /** Default Romantic Ending epilogue headline & text if this NPC was the FIRST to reach Rank 3. */
  endingTitle: string;
  endingSummary: string;
}

/**
 * Full 13-NPC Romance Roster (8 Exile/Gym equivalents + 4 Elite Four + 1 Champion).
 * - Batch 1 (3 NPCs — Playable Today): Covers the 3 Ironman Pillars:
 *     1. Información (El Pelirrojo · Counter-Team Edgy IA)
 *     2. Recursos/Bayas (La Duelista de Vayra · Especialista 1v1)
 *     3. Entrenamiento/Poder Bruto (La Campeona · Mega-Rayquaza AG)
 * - Batch 2 (6 NPCs — Exile Route Roadmap): 5 Waifus & Husbandos with Narrative Rule-Breaking Boss Aces + Amina de Kemetia.
 * - Batch 3 (4 NPCs — Elite Four Endgame): Ransei (Shentai), Ferrum (Kovaria), Veridia, Kalos.
 */
export const ROMANCE_ROSTER: RomanceNpcDefinition[] = [
  /* ===================== BATCH 1 — CORE PLAYABLE NOW (3/13) ===================== */
  {
    id: 'assassin',
    charId: 'assassin',
    name: 'El Pelirrojo (Rival Edgy)',
    nickname: 'Counter-Team IA · Aura/Ryme',
    title: 'Rival Edgy · Analista del Bajo Mundo (Aura / Ciudad Ryme)',
    batch: 1,
    roleTrack: 'exile-8',
    roleBadge: 'Batch 1 · Sello 1/8 · Pilar: Información',
    playableNow: true,
    homeBlocId: 'unova',
    gimmickTag: 'Counter-Teaming Dinámico (Estética Edgy · Debilidad Hada/Lucha)',
    bossAceRule: {
      aceSpecies: 'Absol-Mega ★ + Darkrai',
      ruleName: 'Counter-Team Edgy',
      ruleDetail:
        'Analiza tu equipo antes del combate y arma counters puramente edgy encabezados por Mega-Absol (Espejo Mágico) y Darkrai (Brecha Negra en Revancha R3).',
    },
    bio: 'Te sigue el rastro entre Ciudad Ryme y Aura (Orre) mientras huyes del Consejo. Vive obsesionado con destripar equipos rivales para contrarrestarlos con Pokémon oscuros y afilados —aunque sacrifique cobertura por pura estética.',
    rank1PerkTitle: 'Red de Inteligencia (Scouting Anti-Diablo + 1 Parcela)',
    rank1PerkDetail:
      'Revela desde Rango 1 objetos ocultos y movimientos sorpresa de modo Diablo (como Choice Specs Water Spout) en el Teambuilder + 1 parcela extra en el Huerto.',
    rank2BattleTitle: 'Tag 2v2: Cazarrecompensas en Aura (Orre)',
    rank2PerkTitle: 'Cobertura del Bajo Mundo (3 Edgy Sweepers Aliados)',
    rank2PerkDetail:
      'Pelea a tu lado con Kingambit, Ceruledge y Zoroark-Hisui: tú cubres sus huecos defensivos a Hada/Lucha mientras él barre a los cazarrecompensas.',
    rank3BattleTitle: 'Rematch Injusta: Counter-Team Edgy Sin Freno',
    rank3PerkTitle: 'Casa PC: Glass Cannons (Kingambit · Ceruledge · Zoroark-Hisui)',
    rank3PerkDetail:
      'Sus 3 sweepers ofensivos pasan a tu Casa/PC para reponer bajas rápidas en Ultra Nuzlocke + desbloquea su Ending Romántico.',
    housePokemon: [
      {
        species: 'Kingambit',
        item: 'Black Glasses',
        ability: 'Supreme Overlord',
        nature: 'Adamant',
        teraType: 'Dark',
        moves: ['Kowtow Cleave', 'Sucker Punch', 'Iron Head', 'Protect'],
        shiny: false,
      },
      {
        species: 'Ceruledge',
        item: 'Focus Sash',
        ability: 'Weak Armor',
        nature: 'Adamant',
        teraType: 'Fire',
        moves: ['Bitter Blade', 'Shadow Sneak', 'Close Combat', 'Swords Dance'],
        shiny: false,
      },
      {
        species: 'Zoroark-Hisui',
        item: 'Life Orb',
        ability: 'Illusion',
        nature: 'Timid',
        teraType: 'Ghost',
        moves: ['Bitter Malice', 'Hyper Voice', 'Flamethrower', 'Protect'],
        shiny: false,
      },
    ],
    endingTitle: 'Final Romántico: Dos Fugitivos sobre las Ruinas',
    endingSummary:
      'Con el Consejo y la CRU desmantelados, el Pelirrojo tira su insignia de mercenario al Támesis y se queda a tu lado —no como escolta, sino como igual— reconstruyendo un Galar donde nadie vuelve a cazar por dinero.',
  },
  {
    id: 'court_duelist',
    charId: 'court_duelist',
    name: 'La Duelista de Vayra',
    nickname: 'Especialista 1v1 · Vayra',
    title: 'Lanza Insumisa · Guerrilla de Vayra vs. Islas Naranja',
    batch: 1,
    roleTrack: 'exile-8',
    roleBadge: 'Batch 1 · Sello 2/8 · Pilar: Recursos/Bayas',
    playableNow: true,
    homeBlocId: 'monsoon_archipelago',
    gimmickTag: 'Metajuego 1v1 Puro (Spreads Matemáticos · Custap / No Retreat)',
    bossAceRule: {
      aceSpecies: 'Urshifu-Rapid-Strike ★',
      ruleName: 'Cálculo de Muerte Súbita (1v1)',
      ruleDetail:
        'Sus sets y spreads de EVs están calibrados para el metajuego 1v1 (No Retreat Falinks, Custap Berry + Endure Skeledirge y nukes que sobreviven con 1 PS para devolver OHKO).',
    },
    bio: 'Guerrera curtida de Vayra que sobrevivió a las guerras proxy de la CRU y combate a muerte a la dictadura totalitaria de las Islas Naranja. Especialista absoluta en el formato 1v1 donde un solo turno define la vida o la muerte.',
    rank1PerkTitle: 'Botiquín de Guerrilla (-35% Curación + 2 Parcelas + PP)',
    rank1PerkDetail:
      'Reduce 35% el costo de curación en el Campamento Ironman, desbloquea 2 parcelas extra de Bayas (Lum/Sitrus/Leppa) y regenera +2 PP pasivos tras cada batalla.',
    rank2BattleTitle: 'Tag 2v2: Emboscada contra el Régimen de Islas Naranja',
    rank2PerkTitle: 'Alijo Guerrillero (Focus Sash + Choice Band) + Scouting',
    rank2PerkDetail:
      'Entrega Focus Sash y Choice Band gratis a tu inventario mientras sus sets de 1v1 (No Retreat Falinks / Custap Skeledirge) borran oficiales del régimen.',
    rank3BattleTitle: 'Rematch Injusta: Formato 1v1 Puro (Bring 3, Pick 1)',
    rank3PerkTitle: 'Casa PC: Asesinos de Jefes 1v1 (Urshifu · Falinks · Skeledirge)',
    rank3PerkDetail:
      'Te desafía en formato gen91v1 puro. Vencerla añade sus «asesinos de jefes» con spreads 1v1 a tu Casa/PC + desbloquea su Ending Romántico.',
    housePokemon: [
      {
        species: 'Urshifu',
        item: 'Choice Band',
        ability: 'Unseen Fist',
        nature: 'Jolly',
        teraType: 'Dark',
        moves: ['Wicked Blow', 'Close Combat', 'Sucker Punch', 'U-turn'],
        shiny: false,
      },
      {
        species: 'Falinks',
        item: 'Sitrus Berry',
        ability: 'Defiant',
        nature: 'Adamant',
        teraType: 'Fighting',
        moves: ['No Retreat', 'Close Combat', 'Megahorn', 'First Impression'],
        shiny: false,
      },
      {
        species: 'Skeledirge',
        item: 'Custap Berry',
        ability: 'Unaware',
        nature: 'Modest',
        teraType: 'Fairy',
        moves: ['Torch Song', 'Shadow Ball', 'Endure', 'Slack Off'],
        shiny: false,
      },
    ],
    endingTitle: 'Final Romántico: La Corona que Rompió sus Propias Cadenas',
    endingSummary:
      'Juntos desmantelan el saqueo de la CRU y el régimen brutal de las Islas Naranja. Ella clava su lanza en la frontera abierta de Vayra y toma tu mano frente a dos pueblos finalmente libres.',
  },
  {
    id: 'champion',
    charId: 'champion',
    name: 'La Campeona de Galar',
    nickname: 'Jefa Final Postgame · Mega-Rayquaza',
    title: 'Soberana Invicta · Dueña de Mega-Rayquaza (Postgame)',
    batch: 1,
    roleTrack: 'champion',
    roleBadge: 'Batch 1 · CAMPEONA · Pilar: Entrenamiento/Poder',
    playableNow: true,
    homeBlocId: 'galar_empire',
    gimmickTag: 'Anything Goes / Ubers (Mega-Rayquaza + Kyogre + Zacian-C)',
    bossAceRule: {
      aceSpecies: 'Rayquaza-Mega ★',
      ruleName: 'Soberanía Anything Goes',
      ruleDetail:
        'La entrenadora más poderosa del juego: comanda a Mega-Rayquaza (Delta Stream + Dragon Ascent + V-create) junto a Kyogre (Water Spout + Choice Specs en Diablo) y Zacian-Crowned.',
    },
    bio: 'La mentora que te enseñó a sostener tu primera Poké Ball hace diez años y la verdadera jefa final del Postgame tras derrotar a tu hermano bastardo. Vigila a la CRU desde las sombras entre Pokétopia e Isla Æos para forjarte hasta su nivel.',
    rank1PerkTitle: 'Doctrina Real (Tutoría 0 PC + +30% PC + Cura Gratis)',
    rank1PerkDetail:
      'Romper candados de Slots de Movimiento en el Teambuilder cuesta 0 PC, aumenta +30% tus PokéCoronas por victoria y otorga 1 Curación Total gratuita tras cada combate.',
    rank2BattleTitle: 'Tag 2v2: Con Mega-Rayquaza vs. Fuerza Uber del Consejo',
    rank2PerkTitle: 'Lectura de Soberana (Mega-Rayquaza Aliado + Scouting)',
    rank2PerkDetail:
      'Peleas hombro con hombro CON su Mega-Rayquaza contra un escuadrón Uber del Consejo y activas Scouting Anti-Diablo total.',
    rank3BattleTitle: 'Rematch Injusta: Anything Goes (Mega-Rayquaza + Kyogre)',
    rank3PerkTitle: 'Casa PC: Reserva de Élite (Dragapult · Volcarona · Raging Bolt)',
    rank3PerkDetail:
      'El combate más duro del juego (Anything Goes + Diablo sin restricciones). Superarlo desbloquea su reserva personal en Casa/PC + Ending Romántico.',
    housePokemon: [
      {
        species: 'Dragapult',
        item: 'Life Orb',
        ability: 'Clear Body',
        nature: 'Timid',
        teraType: 'Ghost',
        moves: ['Draco Meteor', 'Shadow Ball', 'Flamethrower', 'Protect'],
        shiny: false,
      },
      {
        species: 'Volcarona',
        item: 'Heavy-Duty Boots',
        ability: 'Flame Body',
        nature: 'Timid',
        teraType: 'Grass',
        moves: ['Heat Wave', 'Quiver Dance', 'Bug Buzz', 'Giga Drain'],
        shiny: false,
      },
      {
        species: 'Raging Bolt',
        item: 'Booster Energy',
        ability: 'Protosynthesis',
        nature: 'Modest',
        teraType: 'Electric',
        moves: ['Thunderclap', 'Draco Meteor', 'Thunderbolt', 'Protect'],
        shiny: false,
      },
    ],
    endingTitle: 'Final Romántico: Dos Coronas en el Jardín del Palacio',
    endingSummary:
      'Tras vencer a tu hermano bastardo y superar incluso a Mega-Rayquaza, tu maestra deposita su capa sobre tus hombros y deja caer la distancia formal. El alumno superó a la soberana —y juntos reescriben el destino de Galar.',
  },

  /* ===================== BATCH 2 — 6 ROMANCEABLES DE LA RUTA DEL EXILIO (TODOS JUGABLES · 3 CAPÍTULOS) ===================== */
  {
    id: 'cordelia_astronomer',
    charId: 'cordelia_astronomer',
    name: 'El Astrónomo del Fin del Mundo',
    nickname: 'Husbando · Cordelia',
    title: 'Noble Arruinado · Observatorio frente a Islas Bruma',
    batch: 2,
    roleTrack: 'exile-8',
    roleBadge: 'Batch 2 · Sello 3/8 · Cordelia (3 Caps)',
    playableNow: true,
    homeBlocId: 'andes_plata',
    gimmickTag: 'Trick Room Pesado (Ursaluna · Hatterene · Torkoal · Kingambit)',
    bossAceRule: {
      aceSpecies: 'Ursaluna (Agallas)',
      ruleName: 'Reloj de los Andes',
      ruleDetail:
        'Espacio Raro activo desde Turno 0 y su Ursaluna ★ (Nv. 108) entra ya quemado con +1 Ataque para activar Agallas desde el primer segundo.',
    },
    bio: 'Noble arruinado, estoico, con ojeras crónicas y humor seco; viste abrigo andino-militar oscuro, monóculo astrolabio de latón y un reloj roto. Odia a Galar por la ocupación de las Islas Bruma frente a su costa.',
    rank1PerkTitle: 'Descanso del Observatorio (-10% Curación + Duelo Austral)',
    rank1PerkDetail: 'Reduce el costo de curación en Campamento y desbloquea su ruta de cooperación en el Cono Austral.',
    rank2BattleTitle: 'Tag 2v2: Asedio Naval de las Islas Bruma',
    rank2PerkTitle: 'Efemérides de Velocidad (Scouting Anti-Diablo)',
    rank2PerkDetail: 'Revela amenazas de velocidad y objetos ocultos de modo Diablo en el Teambuilder.',
    rank3BattleTitle: 'Revancha Cap Alta: Reloj de los Andes (Nv. 108)',
    rank3PerkTitle: 'Casa PC: Ursaluna · Hatterene · Torkoal',
    rank3PerkDetail: 'Núcleo demoledor de Trick Room para tu Casa PC + Ending Romántico.',
    housePokemon: [
      {
        species: 'Ursaluna',
        item: 'Flame Orb',
        ability: 'Guts',
        nature: 'Brave',
        teraType: 'Normal',
        moves: ['Facade', 'Headlong Rush', 'Drain Punch', 'Protect'],
        shiny: false,
      },
      {
        species: 'Hatterene',
        item: 'Life Orb',
        ability: 'Magic Bounce',
        nature: 'Quiet',
        teraType: 'Fire',
        moves: ['Trick Room', 'Dazzling Gleam', 'Psychic', 'Mystical Fire'],
        shiny: false,
      },
      {
        species: 'Torkoal',
        item: 'Charcoal',
        ability: 'Drought',
        nature: 'Quiet',
        teraType: 'Fire',
        moves: ['Eruption', 'Heat Wave', 'Earth Power', 'Protect'],
        shiny: false,
      },
    ],
    endingTitle: 'Final Romántico: El Reloj Vuelve a Girar',
    endingSummary: 'Las Islas Bruma caen y contemplan juntos un cielo austral sin acorazados imperiales.',
  },
  {
    id: 'mesoa_boss',
    charId: 'mesoa_boss',
    name: 'La Jefa del Mercado Negro',
    nickname: 'Waifu · Mesoa',
    title: 'Reina del Contrabando · Cárteles de Crianza de Mesoa',
    batch: 2,
    roleTrack: 'exile-8',
    roleBadge: 'Batch 2 · Sello 4/8 · Mesoa (3 Caps)',
    playableNow: true,
    homeBlocId: 'aztlan_caribe',
    gimmickTag: 'Abuso de Objetos & Velocidad (Unburden · Population Bomb)',
    bossAceRule: {
      aceSpecies: 'Hawlucha (Liviano)',
      ruleName: 'Contrabando Perfecto',
      ruleDetail:
        'Su Hawlucha ★ (Nv. 108) entra en Turno 0 con +2 Velocidad sin haber perdido su Life Orb, arrasando con Close Combat y Acrobatics.',
    },
    bio: 'Carismática, coqueta, despiadada y pragmática; lleva chaqueta de cuero bordada con oro táctico y una bandolera de Poké Balls pirateadas sin sello de la CRU. Te ayuda porque un príncipe fugitivo desestabiliza al Imperio.',
    rank1PerkTitle: 'Mercado Negro (Impuesto de Bajas 15% → 5%)',
    rank1PerkDetail:
      'Reduce el Impuesto de Reposición de bajas Nuzlocke del 15% al 5% (95% de reembolso) desde Rango 1.',
    rank2BattleTitle: 'Tag 2v2: Redada de la CRU en el Puerto de Mesoa',
    rank2PerkTitle: 'Aduana Fantasma (Scouting Anti-Diablo)',
    rank2PerkDetail: 'Revela todos los objetos equipados del jefe y sus trampas Diablo.',
    rank3BattleTitle: 'Revancha Cap Alta: Contrabando Perfecto (Nv. 108)',
    rank3PerkTitle: 'Casa PC: Hawlucha · Maushold · Sneasler',
    rank3PerkDetail: 'Equipo relámpago de Mesoa para romper jefes lentos + Ending Romántico.',
    housePokemon: [
      {
        species: 'Hawlucha',
        item: 'Focus Sash',
        ability: 'Unburden',
        nature: 'Adamant',
        teraType: 'Flying',
        moves: ['Acrobatics', 'Close Combat', 'Swords Dance', 'Protect'],
        shiny: false,
      },
      {
        species: 'Maushold',
        item: 'Wide Lens',
        ability: 'Technician',
        nature: 'Jolly',
        teraType: 'Ghost',
        moves: ['Population Bomb', 'Follow Me', 'Encore', 'Protect'],
        shiny: false,
      },
      {
        species: 'Sneasler',
        item: 'Focus Sash',
        ability: 'Unburden',
        nature: 'Jolly',
        teraType: 'Dark',
        moves: ['Dire Claw', 'Close Combat', 'Fake Out', 'Protect'],
        shiny: false,
      },
    ],
    endingTitle: 'Final Romántico: Mares Sin Sello Imperial',
    endingSummary: 'Transforman las antiguas redes clandestinas de Mesoa en rutas libres del monopolio.',
  },
  {
    id: 'poketopia_croupier',
    charId: 'poketopia_croupier',
    name: 'La Crupier de Sangre',
    nickname: 'Waifu · Pokétopia',
    title: 'Anfitriona de Apuestas · Coliseo de la CRU (Pokétopia)',
    batch: 2,
    roleTrack: 'exile-8',
    roleBadge: 'Batch 2 · Sello 5/8 · Pokétopia (3 Caps)',
    playableNow: true,
    homeBlocId: 'aztlan_caribe',
    gimmickTag: 'RNG Trucado (100% Críticos Sniper · Lluvia VIP)',
    bossAceRule: {
      aceSpecies: 'Kingdra (Francotirador)',
      ruleName: 'La Casa Siempre Gana',
      ruleDetail:
        'Lluvia desde Turno 0 y Kingdra ★ (Nv. 108) entra con Foco Energía activo (100% críticos x2.25 con Francotirador ignorando bajones de Draco Meteor).',
    },
    bio: 'Elegante, sádica, juguetona y adicta a la adrenalina; viste vestido negro de gala con guantes carmesí y naipes metálicos en el cabello platinado. Maneja las apuestas clandestinas de Pokétopia y te llama su «ficha favorita».',
    rank1PerkTitle: 'Apuestas de Combate (+25% PokéCoronas por Capítulo)',
    rank1PerkDetail: 'Aumenta tus PokéCoronas ganadas en combate para costear refuerzos y bayas.',
    rank2BattleTitle: 'Tag 2v2: Mesa VIP de los Accionistas de la CRU',
    rank2PerkTitle: 'Cartas Marcadas (Scouting Anti-Diablo)',
    rank2PerkDetail: 'Alerta de críticos, objetos ocultos y sets de alta varianza en Diablo.',
    rank3BattleTitle: 'Revancha Cap Alta: La Casa Siempre Gana (Nv. 108)',
    rank3PerkTitle: 'Casa PC: Kingdra · Meowscarada · Togekiss',
    rank3PerkDetail: 'Especialistas en críticos garantizados para atravesar muros defensivos + Ending Romántico.',
    housePokemon: [
      {
        species: 'Kingdra',
        item: 'Scope Lens',
        ability: 'Sniper',
        nature: 'Modest',
        teraType: 'Water',
        moves: ['Draco Meteor', 'Hydro Pump', 'Focus Energy', 'Protect'],
        shiny: false,
      },
      {
        species: 'Meowscarada',
        item: 'Focus Sash',
        ability: 'Protean',
        nature: 'Jolly',
        teraType: 'Grass',
        moves: ['Flower Trick', 'Knock Off', 'Sucker Punch', 'Protect'],
        shiny: false,
      },
      {
        species: 'Togekiss',
        item: 'Leftovers',
        ability: 'Serene Grace',
        nature: 'Timid',
        teraType: 'Steel',
        moves: ['Air Slash', 'Dazzling Gleam', 'Follow Me', 'Tailwind'],
        shiny: false,
      },
    ],
    endingTitle: 'Final Romántico: Todo al Rojo',
    endingSummary: 'Banca rota para los oligarcas de la CRU; ella apuesta su última ficha por un futuro a tu lado.',
  },
  {
    id: 'ranger_commander',
    charId: 'ranger_commander',
    name: 'El Comandante Ranger',
    nickname: 'Husbando · Fiore / Oblivia',
    title: 'Líder Guerrillero · Unión Ranger (Confederación Tohjo)',
    batch: 2,
    roleTrack: 'exile-8',
    roleBadge: 'Batch 2 · Sello 6/8 · Unión Ranger (3 Caps)',
    playableNow: true,
    homeBlocId: 'poke_japan',
    gimmickTag: 'VoltTurn + Héroe Solitario (Palafin-Hero · Incineroar · Rillaboom)',
    bossAceRule: {
      aceSpecies: 'Palafin-Hero (Cambio Heroico)',
      ruleName: 'El Héroe Nunca Huye',
      ruleDetail:
        'Por su vínculo puro sin Poké Balls, su Palafin-Hero ★ (Nv. 108) entra directamente en Forma Heroica (650 BST) en Turno 1 sin tener que retirarse.',
    },
    bio: 'Idealista, intenso y protector; viste uniforme Ranger desgastado, capa de camuflaje selvático y un Capturador modificado brillando en azul. Libera Pokémon de las fábricas de la CRU y al principio te odia por tu apellido.',
    rank1PerkTitle: 'Rescate de Campo (+1 PP Pasivo + Cura Ranger)',
    rank1PerkDetail: 'Sus Rangers reponen PP tras cada batalla y abaratan tus suministros en Campamento.',
    rank2BattleTitle: 'Tag 2v2: Liberación del Carguero de Isla Æos',
    rank2PerkTitle: 'Red de Vigías Ranger (Scouting Anti-Diablo)',
    rank2PerkDetail: 'Revela amenazas, objetos y patrones de pivote VoltTurn rivales desde el briefing.',
    rank3BattleTitle: 'Revancha Cap Alta: El Héroe Nunca Huye (Nv. 108)',
    rank3PerkTitle: 'Casa PC: Palafin · Incineroar · Rotom-Wash',
    rank3PerkDetail: 'Núcleo VoltTurn + prioridad heroica para tu Casa PC + Ending Romántico.',
    housePokemon: [
      {
        species: 'Palafin',
        item: 'Mystic Water',
        ability: 'Zero to Hero',
        nature: 'Adamant',
        teraType: 'Water',
        moves: ['Jet Punch', 'Wave Crash', 'Flip Turn', 'Protect'],
        shiny: false,
      },
      {
        species: 'Incineroar',
        item: 'Sitrus Berry',
        ability: 'Intimidate',
        nature: 'Careful',
        teraType: 'Ghost',
        moves: ['Fake Out', 'Flare Blitz', 'Knock Off', 'Parting Shot'],
        shiny: false,
      },
      {
        species: 'Rotom-Wash',
        item: 'Leftovers',
        ability: 'Levitate',
        nature: 'Modest',
        teraType: 'Grass',
        moves: ['Hydro Pump', 'Volt Switch', 'Will-O-Wisp', 'Protect'],
        shiny: false,
      },
    ],
    endingTitle: 'Final Romántico: Cielos Sin Jaulas',
    endingSummary: 'Abolen el monopolio de las cápsulas de la CRU y reconstruyen el mundo sobre el vínculo libre.',
  },
  {
    id: 'aeos_geneticist',
    charId: 'aeos_geneticist',
    name: 'La Genetista Renegada',
    nickname: 'Waifu · Isla Æos',
    title: 'Ex-Científica del Último Ditto · Fugitiva del Black Site Æos',
    batch: 2,
    roleTrack: 'exile-8',
    roleBadge: 'Batch 2 · Sello 7/8 · Isla Æos (3 Caps)',
    playableNow: true,
    homeBlocId: 'poke_india',
    gimmickTag: 'Clonación, Ilusión y Mutatipo (Imposter · Illusion · Protean)',
    bossAceRule: {
      aceSpecies: 'Ditto (Impostor)',
      ruleName: 'El Clon Perfecto',
      ruleDetail:
        'Campo Eléctrico Æos desde Turno 0 y su Ditto ★ (Nv. 112 · Choice Scarf) entra sobrenivelado con salud masiva para voltear tus propios carries contra ti.',
    },
    bio: 'Genia excéntrica, obsesiva y sin filtros sociales; lleva bata manchada de reactivos, lentes holográficos y viales de ADN brillando en el cinturón. Mantuvo vivo al Último Ditto hasta descubrir un horror en Isla Æos y escapar.',
    rank1PerkTitle: 'Escáner de ADN Æos (Scouting Anti-Diablo)',
    rank1PerkDetail: 'Analiza el genoma de los jefes y revela sets sorpresa de modo Diablo desde Rango 1.',
    rank2BattleTitle: 'Tag 2v2: Fuga del Laboratorio Subterráneo de Isla Æos',
    rank2PerkTitle: 'Viales de Síntesis (Cura de Emergencia)',
    rank2PerkDetail: 'Aporta suministros experimentales de recuperación tras cada batalla.',
    rank3BattleTitle: 'Revancha Cap Alta: El Clon Perfecto (Nv. 112)',
    rank3PerkTitle: 'Casa PC: Ditto · Porygon-Z · Cinderace',
    rank3PerkDetail: 'Maestros de copia y cobertura adaptable en tu Casa PC + Ending Romántico.',
    housePokemon: [
      {
        species: 'Ditto',
        item: 'Choice Scarf',
        ability: 'Imposter',
        nature: 'Jolly',
        teraType: 'Ghost',
        moves: ['Transform'],
        shiny: false,
      },
      {
        species: 'Porygon-Z',
        item: 'Choice Specs',
        ability: 'Adaptability',
        nature: 'Timid',
        teraType: 'Normal',
        moves: ['Tri Attack', 'Shadow Ball', 'Ice Beam', 'Hyper Beam'],
        shiny: false,
      },
      {
        species: 'Cinderace',
        item: 'Life Orb',
        ability: 'Libero',
        nature: 'Jolly',
        teraType: 'Fire',
        moves: ['Pyro Ball', 'High Jump Kick', 'Sucker Punch', 'Protect'],
        shiny: false,
      },
    ],
    endingTitle: 'Final Romántico: Código Sin Dueño',
    endingSummary: 'Publican los archivos secretos de Isla Æos y ponen fin para siempre al monopolio genético de la CRU.',
  },
  {
    id: 'kemetia_keeper',
    charId: 'kemetia_keeper',
    name: 'Amina del Gran Rift',
    nickname: 'Waifu · Kemetia & Kora',
    title: 'Custodia de Especies Puras · Kemetia y Reinos Libres de Kora',
    batch: 2,
    roleTrack: 'exile-8',
    roleBadge: 'Batch 2 · Sello 8/8 · Kemetia/Kora (3 Caps)',
    playableNow: true,
    homeBlocId: 'poke_africa',
    gimmickTag: 'Vínculo Puro y Terreno Ancestral (Farigiraf · Hippowdon · Pyroar)',
    bossAceRule: {
      aceSpecies: 'Farigiraf (Cola Armadura)',
      ruleName: 'Eco del Primer Vínculo',
      ruleDetail:
        'Campo Psíquico ancestral desde Turno 0 y Farigiraf ★ (Nv. 108) con +1 Defensa Especial bloqueando toda prioridad rival.',
    },
    bio: 'Protectora de las últimas manadas salvajes no clonadas de Kemetia y puente diplomático con los Reinos Libres de Kora. Desprecia las vallas de la CRU, pero reconoce tu valor cuando bajas al polvo.',
    rank1PerkTitle: 'Botánica del Rift (+1 Parcela de Huerto)',
    rank1PerkDetail: 'Expande tu Huerto de Bayas en el Campamento Ironman con semillas puras del Rift.',
    rank2BattleTitle: 'Tag 2v2: Defensa de los Reinos Libres de Kora',
    rank2PerkTitle: 'Presagio Ancestral (Scouting Anti-Diablo)',
    rank2PerkDetail: 'Alerta sobre golpes de área y trampas climáticas en modo Diablo.',
    rank3BattleTitle: 'Revancha Cap Alta: Rugido del Mediodía (Nv. 108)',
    rank3PerkTitle: 'Casa PC: Farigiraf · Hippowdon · Krookodile',
    rank3PerkDetail: 'Linajes puros sin clonar listos para tu Casa PC + Ending Romántico.',
    housePokemon: [
      {
        species: 'Farigiraf',
        item: 'Throat Spray',
        ability: 'Armor Tail',
        nature: 'Modest',
        teraType: 'Fairy',
        moves: ['Hyper Voice', 'Psychic', 'Trick Room', 'Protect'],
        shiny: false,
      },
      {
        species: 'Hippowdon',
        item: 'Rocky Helmet',
        ability: 'Sand Stream',
        nature: 'Impish',
        teraType: 'Steel',
        moves: ['Earthquake', 'Yawn', 'Slack Off', 'Protect'],
        shiny: false,
      },
      {
        species: 'Krookodile',
        item: 'Choice Scarf',
        ability: 'Intimidate',
        nature: 'Jolly',
        teraType: 'Ground',
        moves: ['Earthquake', 'Knock Off', 'Rock Slide', 'Close Combat'],
        shiny: false,
      },
    ],
    endingTitle: 'Final Romántico: Raíces del Primer Vínculo',
    endingSummary: 'Cae el cerco de la CRU sobre Kemetia y Kora, y la fauna libre vuelve a recorrer el valle.',
  },

  /* ===================== BATCH 3 — ALTO MANDO (4/4 JUGABLES · 3 CAPÍTULOS CADA UNO) ===================== */
  {
    id: 'e4_ransei',
    charId: 'e4_ransei',
    name: 'Lady Nobuna de Ransei',
    nickname: 'Alto Mando 1/4 · Shentai',
    title: 'Señora de la Guerra · Reino Ermitaño de Ransei (Shentai)',
    batch: 3,
    roleTrack: 'elite-4',
    roleBadge: 'Batch 3 · Alto Mando 1/4 · Shentai (3 Caps)',
    playableNow: true,
    homeBlocId: 'poke_china',
    gimmickTag: 'Vínculo Sin Cápsulas · Cuatro Ruinas',
    bossAceRule: {
      aceSpecies: 'Gallade-Mega ★ + Cuatro Ruinas',
      ruleName: 'Gravedad de las Cuatro Ruinas',
      ruleDetail:
        'Gravedad persistente + Reflejo desde Turno 0 mientras Gallade-Mega ★ (Nv. 110) lidera junto a Chien-Pao, Chi-Yu, Ting-Lu y Wo-Chien.',
    },
    bio: 'Comandante de las fortalezas montañosas de Ransei dentro de Shentai que jamás usó una Poké Ball y evalúa si eres digno de derrocar a tu hermano bastardo.',
    rank1PerkTitle: 'Disciplina de Ransei (Scouting + 10% PC)',
    rank1PerkDetail: 'Activa inteligencia de batalla oriental y mejora recompensas de victoria.',
    rank2BattleTitle: 'Tag 2v2: Asedio de las Cuatro Ruinas',
    rank2PerkTitle: 'Ojo de Estratega',
    rank2PerkDetail: 'Scouting total de spreads y velocidades Diablo en Teambuilder.',
    rank3BattleTitle: 'Revancha Cap Alta: Trono de las Nubes (Nv. 110)',
    rank3PerkTitle: 'Casa PC: Chien-Pao · Chi-Yu · Ting-Lu',
    rank3PerkDetail: 'Refuerzos legendarios de Endgame de Shentai + Ending Romántico.',
    housePokemon: [
      {
        species: 'Chien-Pao',
        item: 'Focus Sash',
        ability: 'Sword of Ruin',
        nature: 'Jolly',
        teraType: 'Dark',
        moves: ['Icicle Crash', 'Sucker Punch', 'Sacred Sword', 'Protect'],
        shiny: false,
      },
      {
        species: 'Chi-Yu',
        item: 'Choice Scarf',
        ability: 'Beads of Ruin',
        nature: 'Timid',
        teraType: 'Fire',
        moves: ['Heat Wave', 'Dark Pulse', 'Overheat', 'Snarl'],
        shiny: false,
      },
      {
        species: 'Ting-Lu',
        item: 'Assault Vest',
        ability: 'Vessel of Ruin',
        nature: 'Careful',
        teraType: 'Poison',
        moves: ['Stomping Tantrum', 'Ruination', 'Heavy Slam', 'Snarl'],
        shiny: false,
      },
    ],
    endingTitle: 'Final Romántico: Alianza de Dos Dinastías',
    endingSummary: 'Ransei abre sus puertas por primera vez en siglos.',
  },
  {
    id: 'e4_ferrum',
    charId: 'e4_ferrum',
    name: 'General Viktoria de Ferrum',
    nickname: 'Alto Mando 2/4 · Kovaria & Borelia',
    title: 'Mariscal de Sinergia · Complejo Ferrum (Kovaria / Borelia)',
    batch: 3,
    roleTrack: 'elite-4',
    roleBadge: 'Batch 3 · Alto Mando 2/4 · Kovaria (3 Caps)',
    playableNow: true,
    homeBlocId: 'northern_steppe',
    gimmickTag: 'Sinergia Cuerpo a Cuerpo · Acero & Hielo Blindado',
    bossAceRule: {
      aceSpecies: 'Metagross-Mega ★ + Articuno',
      ruleName: 'Velo de Sinergia Boreal',
      ruleDetail:
        'Nieve persistente + Velo Aurora desde Turno 0 respaldando a Metagross-Mega ★ (Nv. 110), Articuno (Ventisca 100%) y Archaludon.',
    },
    bio: 'Veterana de los campos de Ferrum en Kovaria capaz de igualar el impacto físico de sus Pokémon mediante Piedras de Sinergia, liderando incursiones hasta el hielo de Borelia.',
    rank1PerkTitle: 'Forja de Ferrum (-10% Curación Campamento)',
    rank1PerkDetail: 'Abarata tu logística médica en campañas largas de Ironman.',
    rank2BattleTitle: 'Tag 2v2: Ruptura del Bloqueo Helado de Borelia',
    rank2PerkTitle: 'Lectura de Impacto (Scouting Anti-Diablo)',
    rank2PerkDetail: 'Avisa amenazas de prioridad y OHKO físico en modo Diablo.',
    rank3BattleTitle: 'Revancha Cap Alta: Duelo de Sinergia Pura (Nv. 110)',
    rank3PerkTitle: 'Casa PC: Archaludon · Scizor · Annihilape',
    rank3PerkDetail: 'Titanes de acero y lucha para modo Diablo + Ending Romántico.',
    housePokemon: [
      {
        species: 'Archaludon',
        item: 'Assault Vest',
        ability: 'Stamina',
        nature: 'Modest',
        teraType: 'Fairy',
        moves: ['Flash Cannon', 'Draco Meteor', 'Body Press', 'Electro Shot'],
        shiny: false,
      },
      {
        species: 'Scizor',
        item: 'Choice Band',
        ability: 'Technician',
        nature: 'Adamant',
        teraType: 'Steel',
        moves: ['Bullet Punch', 'U-turn', 'Close Combat', 'Knock Off'],
        shiny: false,
      },
      {
        species: 'Annihilape',
        item: 'Leftovers',
        ability: 'Defiant',
        nature: 'Careful',
        teraType: 'Water',
        moves: ['Rage Fist', 'Drain Punch', 'Bulk Up', 'Protect'],
        shiny: false,
      },
    ],
    endingTitle: 'Final Romántico: Acero Templado Juntos',
    endingSummary: 'Kovaria, Borelia y el nuevo Galar firman un pacto histórico de paz.',
  },
  {
    id: 'e4_veridia',
    charId: 'e4_veridia',
    name: 'Iara de Veridia',
    nickname: 'Alto Mando 3/4 · Veridia',
    title: 'Custodia del Mito de Mew · Selva de Veridia',
    batch: 3,
    roleTrack: 'elite-4',
    roleBadge: 'Batch 3 · Alto Mando 3/4 · Veridia (3 Caps)',
    playableNow: true,
    homeBlocId: 'amazonia_veracruz',
    gimmickTag: 'Corazón de la Selva · Campo de Hierba & Mew',
    bossAceRule: {
      aceSpecies: 'Venusaur-Mega ★ + Mew',
      ruleName: 'Corazón Vivo de Veridia',
      ruleDetail:
        'Campo de Hierba persistente desde Turno 0, Venusaur-Mega ★ (Sebo · Nv. 110) y Mew con +1 Omniboost juzgando al heredero.',
    },
    bio: 'Guardiana de la Selva de Veridia que vio hundirse tres expediciones de la CRU. Ella decide si el heredero de Galar merece conocer la verdad sobre Mew.',
    rank1PerkTitle: 'Elixir de Veridia (+1 Parcela + +1 PP Pasivo)',
    rank1PerkDetail: 'Nutre tu Huerto de Bayas y regenera energía tras cada misión.',
    rank2BattleTitle: 'Tag 2v2: Expedición Clandestina de la CRU',
    rank2PerkTitle: 'Eco Genético (Scouting Anti-Diablo)',
    rank2PerkDetail: 'Scouting total contra clones y jefes modificados.',
    rank3BattleTitle: 'Revancha Cap Alta: Juicio del Corazón Verde (Nv. 110)',
    rank3PerkTitle: 'Casa PC: Rillaboom · Ogerpon-Wellspring · Mew',
    rank3PerkDetail: 'Refuerzos míticos de Veridia para Endgame + Ending Romántico.',
    housePokemon: [
      {
        species: 'Rillaboom',
        item: 'Assault Vest',
        ability: 'Grassy Surge',
        nature: 'Adamant',
        teraType: 'Fire',
        moves: ['Fake Out', 'Grassy Glide', 'Wood Hammer', 'U-turn'],
        shiny: false,
      },
      {
        species: 'Ogerpon-Wellspring',
        item: 'Wellspring Mask',
        ability: 'Water Absorb',
        nature: 'Jolly',
        teraType: 'Water',
        moves: ['Ivy Cudgel', 'Horn Leech', 'Follow Me', 'Spiky Shield'],
        shiny: false,
      },
      {
        species: 'Mew',
        item: 'Leftovers',
        ability: 'Synchronize',
        nature: 'Timid',
        teraType: 'Fairy',
        moves: ['Psychic', 'Dazzling Gleam', 'Nasty Plot', 'Protect'],
        shiny: false,
      },
    ],
    endingTitle: 'Final Romántico: El Fin del Monopolio Ditto',
    endingSummary: 'La vida silvestre renace más allá de cualquier laboratorio de Wyndon.',
  },
  {
    id: 'e4_kalos',
    charId: 'e4_kalos',
    name: 'Céline de Luminalia',
    nickname: 'Alto Mando 4/4 · Kalos',
    title: 'Comandante Insurgente · Megaevolución Prohibida (Kalos)',
    batch: 3,
    roleTrack: 'elite-4',
    roleBadge: 'Batch 3 · Alto Mando 4/4 · Kalos (3 Caps)',
    playableNow: true,
    homeBlocId: 'kalos',
    gimmickTag: 'Megaevolución Clandestina · Resistencia de Luminalia',
    bossAceRule: {
      aceSpecies: 'Gardevoir-Mega ★ + Latios',
      ruleName: 'Vals de la Megaevolución',
      ruleDetail:
        'Campo de Niebla persistente + Viento Afín T0 mientras Gardevoir-Mega ★ (Nv. 110) y Latios dominan el cielo de Luminalia.',
    },
    bio: 'Líder clandestina de la resistencia de Kalos que conserva Megapiedras prohibidas por la CRU y desafía la supremacía Gigamax desde el otro lado del canal.',
    rank1PerkTitle: 'Red de Luminalia (Tutoría Libre + +15% PC)',
    rank1PerkDetail: 'Conecta el circuito clandestino de Kalos para financiar tu campaña.',
    rank2BattleTitle: 'Tag 2v2: Liberación del Canal de Kalos',
    rank2PerkTitle: 'Espionaje de la Corte (Scouting Anti-Diablo)',
    rank2PerkDetail: 'Revela planes y trampas ocultas del rival desde el Teambuilder.',
    rank3BattleTitle: 'Revancha Cap Alta: Vals de la Megaevolución (Nv. 110)',
    rank3PerkTitle: 'Casa PC: Gardevoir-Mega · Aegislash · Greninja',
    rank3PerkDetail: 'Élite de Kalos lista para la batalla final + Ending Romántico.',
    housePokemon: [
      {
        species: 'Gardevoir-Mega',
        item: 'Gardevoirite',
        ability: 'Pixilate',
        nature: 'Timid',
        teraType: 'Fairy',
        moves: ['Hyper Voice', 'Psychic', 'Mystical Fire', 'Protect'],
        shiny: false,
      },
      {
        species: 'Aegislash',
        item: 'Leftovers',
        ability: 'Stance Change',
        nature: 'Quiet',
        teraType: 'Fairy',
        moves: ['Shadow Ball', 'Flash Cannon', 'Wide Guard', "King's Shield"],
        shiny: false,
      },
      {
        species: 'Greninja',
        item: 'Focus Sash',
        ability: 'Protean',
        nature: 'Timid',
        teraType: 'Water',
        moves: ['Hydro Pump', 'Dark Pulse', 'Ice Beam', 'Protect'],
        shiny: false,
      },
    ],
    endingTitle: 'Final Romántico: Luces sobre el Canal',
    endingSummary: 'Galar y Kalos se estrechan la mano como naciones libres.',
  },
];

export const PLAYABLE_ROMANCE_NPCS = ROMANCE_ROSTER.filter((n) => n.playableNow);

export function getRomanceNpcById(id: string): RomanceNpcDefinition | undefined {
  return ROMANCE_ROSTER.find((n) => n.id === id);
}

/**
 * Evaluates aggregate Ironman & Tactical perks currently active from the player's Social Links!
 * Batch 1 covers the 3 Survival Pillars right from Rank 1:
 *  - El Pelirrojo R1: Información (Scouting Anti-Diablo + 1 plot)
 *  - La Duelista R1: Recursos/Bayas (-35% camp healing + 2 berry plots + +2 passive PP)
 *  - La Campeona R1: Entrenamiento/Poder (Free 0-PC Move Slot Tutoring + +30% coins + 1 free emergency heal)
 */
export function computeActiveSocialLinkPerks(profile: PlayerSaveProfile): {
  campHealDiscountPct: number;
  maxBerryPlots: number;
  passivePpRegen: number;
  victoryCoinMultiplier: number;
  /** Replacement tax deducted from Nuzlocke permanent-casualty indemnification (15% default, 5% with Mesoa R1). */
  casualtyTaxRate: number;
  hasAntiDiabloScouting: boolean;
  hasFreeTutoringPerk: boolean;
  hasFreeEmergencyHealPerk: boolean;
  unlockedHousePokemon: Array<CustomTeamMember & { donorName: string; donorId: string }>;
  maxedPlayableCount: number;
  totalPlayableCount: number;
  isHaremUnlocked: boolean;
  activeEndingKind: 'none' | 'single' | 'harem';
  activeEndingNpc: RomanceNpcDefinition | null;
} {
  const links = profile.socialLinks ?? {};
  const rankOf = (id: string) => links[id]?.rank ?? 0;
  const assassinRank = rankOf('assassin');
  const duelistRank = rankOf('court_duelist');
  const championRank = rankOf('champion');
  const mesoaRank = rankOf('mesoa_boss');
  const cordeliaRank = rankOf('cordelia_astronomer');
  const croupierRank = rankOf('poketopia_croupier');
  const rangerRank = rankOf('ranger_commander');
  const aeosRank = rankOf('aeos_geneticist');
  const kemetiaRank = rankOf('kemetia_keeper');
  const ranseiRank = rankOf('e4_ransei');
  const ferrumRank = rankOf('e4_ferrum');
  const veridiaRank = rankOf('e4_veridia');
  const kalosRank = rankOf('e4_kalos');

  // Pilar 1: Información (El Pelirrojo R1, Æos/Ransei R1, o cualquier aliado R2!)
  const hasAntiDiabloScouting =
    assassinRank >= 1 ||
    aeosRank >= 1 ||
    ranseiRank >= 1 ||
    ROMANCE_ROSTER.some((n) => rankOf(n.id) >= 2);
  // Pilar 2: Recursos/Bayas (La Duelista R1 + extras de Cordelia/Ferrum/Kemetia/Veridia/Ranger)
  const campHealDiscountPct = Math.min(
    65,
    (duelistRank >= 1 ? 35 : 0) +
      (cordeliaRank >= 1 ? 10 : 0) +
      (ferrumRank >= 1 ? 10 : 0)
  );
  const maxBerryPlots = Math.min(
    8,
    2 +
      (assassinRank >= 1 ? 1 : 0) +
      (duelistRank >= 1 ? 2 : 0) +
      (kemetiaRank >= 1 ? 1 : 0) +
      (veridiaRank >= 1 ? 1 : 0)
  );
  const passivePpRegen =
    (duelistRank >= 1 ? 2 : 0) +
    (rangerRank >= 1 ? 1 : 0) +
    (veridiaRank >= 1 ? 1 : 0);
  // Pilar 3: Entrenamiento & Poder (La Campeona R1 + Crupier/Ransei/Kalos)
  const hasFreeTutoringPerk = championRank >= 1 || kalosRank >= 1;
  const victoryCoinMultiplier = Number(
    (
      1.0 +
      (championRank >= 1 ? 0.3 : 0) +
      (croupierRank >= 1 ? 0.25 : 0) +
      (ranseiRank >= 1 ? 0.1 : 0) +
      (kalosRank >= 1 ? 0.15 : 0)
    ).toFixed(2)
  );
  const hasFreeEmergencyHealPerk = championRank >= 1 || aeosRank >= 2;
  // Mesoa Contraband Tax Reduction (15% -> 5%)
  const casualtyTaxRate = mesoaRank >= 1 ? 0.05 : 0.15;

  const unlockedHousePokemon: Array<
    CustomTeamMember & { donorName: string; donorId: string }
  > = [];
  let maxedPlayableCount = 0;

  for (const npc of PLAYABLE_ROMANCE_NPCS) {
    const rank = rankOf(npc.id);
    if (rank >= 3) {
      maxedPlayableCount += 1;
      for (const mon of npc.housePokemon) {
        unlockedHousePokemon.push({
          ...mon,
          donorName: npc.name,
          donorId: npc.id,
        });
      }
    }
  }

  const totalPlayableCount = PLAYABLE_ROMANCE_NPCS.length;
  const batch1Ids = ROMANCE_ROSTER.filter((n) => n.batch === 1).map((n) => n.id);
  const isBatch1Harem =
    batch1Ids.length > 0 && batch1Ids.every((id) => rankOf(id) >= 3);
  const isFullRosterHarem =
    totalPlayableCount > 0 && maxedPlayableCount === totalPlayableCount;
  const isHaremUnlocked = isBatch1Harem || isFullRosterHarem;

  const firstNpc = profile.firstRomanceMaxedId
    ? getRomanceNpcById(profile.firstRomanceMaxedId) ?? null
    : null;

  const activeEndingKind: 'none' | 'single' | 'harem' = isHaremUnlocked
    ? 'harem'
    : firstNpc
      ? 'single'
      : 'none';

  return {
    campHealDiscountPct,
    maxBerryPlots,
    passivePpRegen,
    victoryCoinMultiplier,
    casualtyTaxRate,
    hasAntiDiabloScouting,
    hasFreeTutoringPerk,
    hasFreeEmergencyHealPerk,
    unlockedHousePokemon,
    maxedPlayableCount,
    totalPlayableCount,
    isHaremUnlocked,
    activeEndingKind,
    activeEndingNpc: firstNpc,
  };
}
