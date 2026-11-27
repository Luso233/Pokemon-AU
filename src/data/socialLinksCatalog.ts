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
      aceSpecies: 'Kingambit ★',
      ruleName: 'Counter-Team Edgy',
      ruleDetail:
        'Analiza tu equipo antes del combate y arma counters puramente edgy (Siniestro/Fantasma/Acero/Dragón), sacrificando sinergia defensiva por pura presión ofensiva.',
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

  /* ===================== BATCH 2 — 5 WAIFUS & HUSBANDOS CON ACES ROMPE-REGLAS + KEMETIA (6/13) ===================== */
  {
    id: 'cordelia_astronomer',
    name: 'El Astrónomo del Fin del Mundo',
    nickname: 'Husbando · Cordelia',
    title: 'Noble Arruinado · Observatorio frente a Islas Bruma',
    batch: 2,
    roleTrack: 'exile-8',
    roleBadge: 'Batch 2 · Sello 3/8 · Husbando (Próximamente)',
    playableNow: false,
    homeBlocId: 'andes_plata',
    gimmickTag: 'Trick Room Pesado (Ursaluna · Hatterene · Torkoal · Kingambit)',
    bossAceRule: {
      aceSpecies: 'Ursaluna (Agallas)',
      ruleName: 'Reloj de los Andes',
      ruleDetail:
        'Espacio Raro permanente desde Turno 0 (imposible de quitar) y su Ursaluna entra ya quemado para activar Agallas sin sufrir daño de quemadura al final del turno.',
    },
    bio: 'Noble arruinado, estoico, con ojeras crónicas y humor seco; viste abrigo andino-militar oscuro, monóculo astrolabio de latón y un reloj roto. Odia a Galar por la ocupación de las Islas Bruma frente a su costa.',
    rank1PerkTitle: 'Descanso del Observatorio (+25% PS entre capítulos)',
    rank1PerkDetail: 'Desbloquea descanso de campamento: cura 25% de PS a todo tu equipo una vez entre capítulos.',
    rank2BattleTitle: 'Tag 2v2: Asedio Naval de las Islas Bruma',
    rank2PerkTitle: 'Efemérides de Velocidad',
    rank2PerkDetail: 'Revela los umbrales de velocidad exactos y objetos de Trick Room del enemigo.',
    rank3BattleTitle: 'Rematch Injusta: Reloj de los Andes',
    rank3PerkTitle: 'Casa: Ursaluna · Hatterene · Torkoal',
    rank3PerkDetail: 'Núcleo demoledor de Trick Room para tu Casa PC.',
    housePokemon: [],
    endingTitle: 'Final Romántico: El Reloj Vuelve a Girar',
    endingSummary: 'Las Islas Bruma caen y contemplan juntos un cielo austral sin acorazados imperiales.',
  },
  {
    id: 'mesoa_boss',
    name: 'La Jefa del Mercado Negro',
    nickname: 'Waifu · Mesoa',
    title: 'Reina del Contrabando · Cárteles de Crianza de Mesoa',
    batch: 2,
    roleTrack: 'exile-8',
    roleBadge: 'Batch 2 · Sello 4/8 · Waifu (Próximamente)',
    playableNow: false,
    homeBlocId: 'aztlan_caribe',
    gimmickTag: 'Abuso de Objetos & Velocidad (Unburden · Population Bomb)',
    bossAceRule: {
      aceSpecies: 'Hawlucha (Liviano)',
      ruleName: 'Contrabando Perfecto',
      ruleDetail:
        'Su Hawlucha entra en Turno 1 con Liviano (x2 Velocidad) ya activo sin haber consumido su Life Orb, golpeando además con Acrobatics a 110 BP base.',
    },
    bio: 'Carismática, coqueta, despiadada y pragmática; lleva chaqueta de cuero bordada con oro táctico y una bandolera de Poké Balls pirateadas sin sello de la CRU. Te ayuda porque un príncipe fugitivo desestabiliza al Imperio.',
    rank1PerkTitle: 'Mercado Negro (Impuesto de Bajas 15% → 5% + Objetos Choice)',
    rank1PerkDetail:
      'Reduce el Impuesto de Reposición de bajas Nuzlocke del 15% al 5% (95% de reembolso) y desbloquea objetos competitivos premium tempranos.',
    rank2BattleTitle: 'Tag 2v2: Redada de la CRU en el Puerto de Mesoa',
    rank2PerkTitle: 'Aduana Fantasma',
    rank2PerkDetail: 'Revela todos los objetos equipados del jefe y sus sinergias Multi-Hit.',
    rank3BattleTitle: 'Rematch Injusta: Contrabando Perfecto',
    rank3PerkTitle: 'Casa: Hawlucha · Maushold · Sneasler',
    rank3PerkDetail: 'Equipo relámpago de Mesoa para romper jefes lentos.',
    housePokemon: [],
    endingTitle: 'Final Romántico: Mares Sin Sello Imperial',
    endingSummary: 'Transforman las antiguas redes clandestinas de Mesoa en rutas libres del monopolio.',
  },
  {
    id: 'poketopia_croupier',
    name: 'La Crupier de Sangre',
    nickname: 'Waifu · Pokétopia',
    title: 'Anfitriona de Apuestas · Coliseo de la CRU (Pokétopia)',
    batch: 2,
    roleTrack: 'exile-8',
    roleBadge: 'Batch 2 · Sello 5/8 · Waifu (Próximamente)',
    playableNow: false,
    homeBlocId: 'aztlan_caribe',
    gimmickTag: 'RNG Trucado (100% Críticos Sniper · Precisión Infinita)',
    bossAceRule: {
      aceSpecies: 'Kingdra (Francotirador)',
      ruleName: 'La Casa Siempre Gana',
      ruleDetail:
        'Foco Energía permanente (100% golpes críticos x2.25 con Francotirador, ignorando bajones de Draco Meteor) y precisión perfecta en Hydro Pump, Draco Meteor y Hurricane.',
    },
    bio: 'Elegante, sádica, juguetona y adicta a la adrenalina; viste vestido negro de gala con guantes carmesí y naipes metálicos en el cabello platinado. Maneja las apuestas clandestinas de Pokétopia y te llama su «ficha favorita».',
    rank1PerkTitle: 'Apuestas de Combate (x2 PokéCoronas por Capítulo)',
    rank1PerkDetail: 'Duplica las PokéCoronas ganadas en combate para costear pociones y bayas en modo Ironman.',
    rank2BattleTitle: 'Tag 2v2: Mesa VIP de los Accionistas de la CRU',
    rank2PerkTitle: 'Cartas Marcadas',
    rank2PerkDetail: 'Alerta de golpes críticos, Serene Grace y sets de alta varianza en Diablo.',
    rank3BattleTitle: 'Rematch Injusta: La Casa Siempre Gana',
    rank3PerkTitle: 'Casa: Kingdra · Meowscarada · Togekiss',
    rank3PerkDetail: 'Especialistas en críticos garantizados para atravesar muros defensivos.',
    housePokemon: [],
    endingTitle: 'Final Romántico: Todo al Rojo',
    endingSummary: 'Banca rota para los oligarcas de la CRU; ella apuesta su última ficha por un futuro a tu lado.',
  },
  {
    id: 'ranger_commander',
    name: 'El Comandante Ranger',
    nickname: 'Husbando · Fiore / Oblivia',
    title: 'Líder Guerrillero · Unión Ranger (Ecoterrorista según la CRU)',
    batch: 2,
    roleTrack: 'exile-8',
    roleBadge: 'Batch 2 · Sello 6/8 · Husbando (Próximamente)',
    playableNow: false,
    homeBlocId: 'poke_japan',
    gimmickTag: 'VoltTurn + Héroe Solitario (Palafin-Hero · Incineroar · Rillaboom)',
    bossAceRule: {
      aceSpecies: 'Palafin-Hero (Cambio Heroico)',
      ruleName: 'El Héroe Nunca Huye',
      ruleDetail:
        'Por su vínculo puro sin Poké Balls, Palafin entra directo en Forma Heroica (650 BST) en Turno 1 sin cambiar, y su Jet Punch gana potencia extra por debajo del 50% de PS.',
    },
    bio: 'Idealista, intenso y protector; viste uniforme Ranger desgastado, capa de camuflaje selvático y un Capturador modificado brillando en azul. Libera Pokémon de las fábricas de la CRU y al principio te odia por tu apellido.',
    rank1PerkTitle: 'Rescate de Campo (Paquete de Curación Ranger)',
    rank1PerkDetail: 'Una vez por capítulo, si un compañero queda a 1 PS o con estado grave, sus Rangers entregan curación gratuita.',
    rank2BattleTitle: 'Tag 2v2: Liberación del Carguero de Isla Æos',
    rank2PerkTitle: 'Red de Vigías Ranger',
    rank2PerkDetail: 'Revela habilidades y patrones de pivote VoltTurn rivales desde Turno 0.',
    rank3BattleTitle: 'Rematch Injusta: El Héroe Nunca Huye',
    rank3PerkTitle: 'Casa: Palafin · Incineroar · Rotom-Wash',
    rank3PerkDetail: 'Núcleo VoltTurn + prioridad heroica para tu Casa PC.',
    housePokemon: [],
    endingTitle: 'Final Romántico: Cielos Sin Jaulas',
    endingSummary: 'Abolen el monopolio de las cápsulas de la CRU y reconstruyen el mundo sobre el vínculo libre.',
  },
  {
    id: 'aeos_geneticist',
    name: 'La Genetista Renegada',
    nickname: 'Waifu · Isla Æos',
    title: 'Ex-Científica del Último Ditto · Fugitiva del Black Site Æos',
    batch: 2,
    roleTrack: 'exile-8',
    roleBadge: 'Batch 2 · Sello 7/8 · Waifu (Próximamente)',
    playableNow: false,
    homeBlocId: 'poke_india',
    gimmickTag: 'Clonación, Ilusión y Mutatipo (Imposter · Illusion · Protean)',
    bossAceRule: {
      aceSpecies: 'Ditto (Impostor)',
      ruleName: 'El Clon Perfecto',
      ruleDetail:
        'Al copiarte a tu mejor Pokémon, su Ditto NO copia los 48 PS base: conserva una barra de vida masiva de jefe (Base 150 HP) y entra con +1 en la estadística más alta copiada.',
    },
    bio: 'Genia excéntrica, obsesiva y sin filtros sociales; lleva bata manchada de reactivos, lentes holográficos y viales de ADN brillando en el cinturón. Mantuvo vivo al Último Ditto hasta descubrir un horror en Isla Æos y escapar.',
    rank1PerkTitle: 'Clonación de Emergencia (1 Revivir Nuzlocke o Clonar Objeto)',
    rank1PerkDetail: 'En Ultra Nuzlocke Diablo permite revivir a 1 Pokémon caído una sola vez en toda la run o clonar un objeto único perdido.',
    rank2BattleTitle: 'Tag 2v2: Fuga del Laboratorio Subterráneo de Isla Æos',
    rank2PerkTitle: 'Escáner de ADN Æos',
    rank2PerkDetail: 'Revela EVs exactos, Teratipos ocultos y modificaciones ilegales de jefes.',
    rank3BattleTitle: 'Rematch Injusta: El Clon Perfecto',
    rank3PerkTitle: 'Casa: Ditto · Greninja · Porygon-Z',
    rank3PerkDetail: 'Maestros de copia y cobertura adaptable en tu Casa PC.',
    housePokemon: [],
    endingTitle: 'Final Romántico: Código Sin Dueño',
    endingSummary: 'Publican los archivos secretos de Isla Æos y ponen fin para siempre al monopolio genético de la CRU.',
  },
  {
    id: 'kemetia_keeper',
    name: 'Amina del Gran Rift',
    nickname: 'Waifu · Kemetia',
    title: 'Custodia de Especies Puras · Corredor de Kemetia',
    batch: 2,
    roleTrack: 'exile-8',
    roleBadge: 'Batch 2 · Sello 8/8 · Waifu (Próximamente)',
    playableNow: false,
    homeBlocId: 'poke_africa',
    gimmickTag: 'Vínculo Puro y Terreno Ancestral (Farigiraf · Hippowdon · Pyroar)',
    bossAceRule: {
      aceSpecies: 'Farigiraf (Cola Armadura)',
      ruleName: 'Eco del Primer Vínculo',
      ruleDetail:
        'Proyecta Campo Psíquico ancestral en Turno 0 y bloquea cualquier prioridad mientras fortalece los ataques de manada sin clonar.',
    },
    bio: 'Protectora de las últimas manadas salvajes no clonadas de Kemetia. Desprecia las vallas de la CRU, pero reconoce en ti a un heredero dispuesto a escuchar a los pueblos desplazados por el apellido de su padre.',
    rank1PerkTitle: 'Botánica del Rift (Cosecha x2 en Huerto de Bayas)',
    rank1PerkDetail: 'Duplica la velocidad de maduración de tus bayas en el Campamento Ironman.',
    rank2BattleTitle: 'Tag 2v2: Defensa de la Reserva del Rift contra la CRU',
    rank2PerkTitle: 'Presagio Ancestral',
    rank2PerkDetail: 'Alerta sobre golpes de área y trampas climáticas en modo Diablo.',
    rank3BattleTitle: 'Rematch Injusta: Rugido del Mediodía',
    rank3PerkTitle: 'Casa: Farigiraf · Hippowdon · Lucario',
    rank3PerkDetail: 'Linajes puros sin clonar listos para tu Casa PC.',
    housePokemon: [],
    endingTitle: 'Final Romántico: Raíces del Primer Vínculo',
    endingSummary: 'Cae el cerco de la CRU sobre Kemetia y la fauna libre vuelve a recorrer el valle.',
  },

  /* ===================== BATCH 3 — ELITE FOUR ROADMAP (4/5 ÉLITE + CAMPEONA) ===================== */
  {
    id: 'e4_ransei',
    name: 'Lady Nobuna de Ransei',
    nickname: 'Alto Mando 1/4 · Shentai',
    title: 'Señora de la Guerra · Reino Ermitaño de Ransei (Shentai)',
    batch: 3,
    roleTrack: 'elite-4',
    roleBadge: 'Batch 3 · Alto Mando 1/4 (Próximamente)',
    playableNow: false,
    homeBlocId: 'poke_china',
    gimmickTag: 'Vínculo Sin Cápsulas · Cuatro Ruinas',
    bio: 'Comandante de las fortalezas montañosas de Ransei dentro de Shentai que jamás usó una Poké Ball y evalúa si eres digno de derrocar a tu hermano bastardo.',
    rank1PerkTitle: 'Disciplina de Ransei',
    rank1PerkDetail: 'Aumenta tolerancia de supervivencia y bonificaciones tácticas.',
    rank2BattleTitle: 'Tag 2v2: Asedio de las Cuatro Ruinas',
    rank2PerkTitle: 'Ojo de Estratega',
    rank2PerkDetail: 'Scouting total de spreads y velocidades Diablo.',
    rank3BattleTitle: 'Rematch Injusta: Trono de las Nubes',
    rank3PerkTitle: 'Casa: Chien-Pao · Chi-Yu · Kingambit',
    rank3PerkDetail: 'Refuerzos legendarios de Endgame.',
    housePokemon: [],
    endingTitle: 'Final Romántico: Alianza de Dos Dinastías',
    endingSummary: 'Ransei abre sus puertas por primera vez en siglos.',
  },
  {
    id: 'e4_ferrum',
    name: 'General Viktoria de Ferrum',
    nickname: 'Alto Mando 2/4 · Kovaria',
    title: 'Mariscal de Sinergia · Complejo Ferrum (Kovaria)',
    batch: 3,
    roleTrack: 'elite-4',
    roleBadge: 'Batch 3 · Alto Mando 2/4 (Próximamente)',
    playableNow: false,
    homeBlocId: 'northern_steppe',
    gimmickTag: 'Sinergia Cuerpo a Cuerpo · Acero & Hielo Blindado',
    bio: 'Veterana de los campos de Ferrum en Kovaria capaz de igualar el impacto físico de sus Pokémon mediante Piedras de Sinergia.',
    rank1PerkTitle: 'Forja de Ferrum',
    rank1PerkDetail: 'Desbloquea equipamiento defensivo de élite en Campamento.',
    rank2BattleTitle: 'Tag 2v2: Ruptura del Muro de Kovaria',
    rank2PerkTitle: 'Lectura de Impacto',
    rank2PerkDetail: 'Avisa amenazas de prioridad y OHKO físico.',
    rank3BattleTitle: 'Rematch Injusta: Duelo de Sinergia Pura',
    rank3PerkTitle: 'Casa: Archaludon · Scizor · Annihilape',
    rank3PerkDetail: 'Titanes de acero y lucha para modo Diablo.',
    housePokemon: [],
    endingTitle: 'Final Romántico: Acero Templado Juntos',
    endingSummary: 'Kovaria y el nuevo Galar firman un pacto histórico de paz.',
  },
  {
    id: 'e4_veridia',
    name: 'Iara de Veridia',
    nickname: 'Alto Mando 3/4 · Veridia',
    title: 'Custodia del Mito de Mew · Selva de Veridia',
    batch: 3,
    roleTrack: 'elite-4',
    roleBadge: 'Batch 3 · Alto Mando 3/4 (Próximamente)',
    playableNow: false,
    homeBlocId: 'amazonia_veracruz',
    gimmickTag: 'Corazón de la Selva · El Secreto de Mew',
    bio: 'Guardiana de la Selva de Veridia que vio hundirse tres expediciones de la CRU. Ella decide si el heredero de Galar merece conocer la verdad sobre Mew.',
    rank1PerkTitle: 'Elixir de Veridia',
    rank1PerkDetail: 'Cura estados y otorga bayas raras tras cada misión.',
    rank2BattleTitle: 'Tag 2v2: Expedición Clandestina de la CRU',
    rank2PerkTitle: 'Eco Genético',
    rank2PerkDetail: 'Scouting total contra clones y jefes modificados.',
    rank3BattleTitle: 'Rematch Injusta: Juicio del Corazón Verde',
    rank3PerkTitle: 'Casa: Rillaboom · Ogerpon · Mew',
    rank3PerkDetail: 'Refuerzos míticos de Veridia para Endgame.',
    housePokemon: [],
    endingTitle: 'Final Romántico: El Fin del Monopolio Ditto',
    endingSummary: 'La vida silvestre renace más allá de cualquier laboratorio de Wyndon.',
  },
  {
    id: 'e4_kalos',
    name: 'Céline de Luminalia',
    nickname: 'Alto Mando 4/4 · Kalos',
    title: 'Comandante Insurgente · Megaevolución Prohibida (Kalos)',
    batch: 3,
    roleTrack: 'elite-4',
    roleBadge: 'Batch 3 · Alto Mando 4/4 (Próximamente)',
    playableNow: false,
    homeBlocId: 'kalos',
    gimmickTag: 'Megaevolución Clandestina · Resistencia de Luminalia',
    bio: 'Líder clandestina de la resistencia de Kalos que conserva Megapiedras prohibidas por la CRU y desafía la supremacía Gigamax desde el otro lado del canal.',
    rank1PerkTitle: 'Red de Luminalia',
    rank1PerkDetail: 'Descuentos en Megapiedras y objetos especiales.',
    rank2BattleTitle: 'Tag 2v2: Liberación del Canal',
    rank2PerkTitle: 'Espionaje de la Corte',
    rank2PerkDetail: 'Revela los planes scripteados del rival desde Turno 0.',
    rank3BattleTitle: 'Rematch Injusta: Vals de la Megaevolución',
    rank3PerkTitle: 'Casa: Gardevoir-Mega · Aegislash · Greninja',
    rank3PerkDetail: 'Élite de Kalos lista para la batalla final.',
    housePokemon: [],
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
  const assassinRank = links.assassin?.rank ?? 0;
  const duelistRank = links.court_duelist?.rank ?? 0;
  const championRank = links.champion?.rank ?? 0;
  const mesoaRank = links.mesoa_boss?.rank ?? 0;

  // Pilar 1: Información (El Pelirrojo R1!)
  const hasAntiDiabloScouting =
    assassinRank >= 1 || duelistRank >= 2 || championRank >= 2;
  // Pilar 2: Recursos/Bayas (La Duelista R1!)
  const campHealDiscountPct = duelistRank >= 1 ? 35 : 0;
  const maxBerryPlots = 2 + (assassinRank >= 1 ? 1 : 0) + (duelistRank >= 1 ? 2 : 0);
  const passivePpRegen = duelistRank >= 1 ? 2 : 0;
  // Pilar 3: Entrenamiento & Poder (La Campeona R1!)
  const hasFreeTutoringPerk = championRank >= 1;
  const victoryCoinMultiplier = championRank >= 1 ? 1.3 : 1.0;
  const hasFreeEmergencyHealPerk = championRank >= 1;
  // Mesoa Contraband Tax Reduction (15% -> 5%)
  const casualtyTaxRate = mesoaRank >= 1 ? 0.05 : 0.15;

  const unlockedHousePokemon: Array<
    CustomTeamMember & { donorName: string; donorId: string }
  > = [];
  let maxedPlayableCount = 0;

  for (const npc of PLAYABLE_ROMANCE_NPCS) {
    const rank = links[npc.id]?.rank ?? 0;
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
  const isHaremUnlocked =
    totalPlayableCount > 0 && maxedPlayableCount === totalPlayableCount;

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
