import type { CustomTeamMember, PlayerInventory } from '../types/game';

export const CURRENCY_NAME = 'PokéCoronas';
export const CURRENCY_SHORT = 'PC';
export const MAX_SHINY_CHARMS = 6;
export const SHINY_CHARM_PRICE = 10000;

export interface ChapterUnlockRule {
  chapterId: string;
  unlockedByDefault?: boolean;
  prerequisiteChapterIds?: string[];
  minCompletedCount?: number;
  unlockCostCoins: number;
  requirementLabel: string;
  firstClearReward: number;
  replayReward: number;
}

export const STARTER_UNLOCKED_CHAPTERS: string[] = [
  'ch1-wyndon-chase',
  'puzzle-01-sun-trap',
  'flashback-lc-champion',
];

export const CHAPTER_UNLOCK_RULES: Record<string, ChapterUnlockRule> = {
  'ch1-wyndon-chase': {
    chapterId: 'ch1-wyndon-chase',
    unlockedByDefault: true,
    unlockCostCoins: 0,
    requirementLabel: 'Disponible desde el inicio',
    firstClearReward: 1500,
    replayReward: 350,
  },
  'puzzle-01-sun-trap': {
    chapterId: 'puzzle-01-sun-trap',
    unlockedByDefault: true,
    unlockCostCoins: 0,
    requirementLabel: 'Disponible desde el inicio',
    firstClearReward: 1500,
    replayReward: 350,
  },
  'flashback-lc-champion': {
    chapterId: 'flashback-lc-champion',
    unlockedByDefault: true,
    unlockCostCoins: 0,
    requirementLabel: 'Disponible desde el inicio',
    firstClearReward: 1400,
    replayReward: 300,
  },
  'ch2-monotype-banners': {
    chapterId: 'ch2-monotype-banners',
    prerequisiteChapterIds: ['ch1-wyndon-chase'],
    unlockCostCoins: 1200,
    requirementLabel: 'Completa el Capítulo 01',
    firstClearReward: 1600,
    replayReward: 350,
  },
  'ch2-banquet-ambush': {
    chapterId: 'ch2-banquet-ambush',
    prerequisiteChapterIds: ['ch1-wyndon-chase'],
    unlockCostCoins: 900,
    requirementLabel: 'Completa el Capítulo 01',
    firstClearReward: 1200,
    replayReward: 300,
  },
  'duel-01-honor-1v1': {
    chapterId: 'duel-01-honor-1v1',
    prerequisiteChapterIds: ['ch1-wyndon-chase'],
    unlockCostCoins: 1000,
    requirementLabel: 'Completa el Capítulo 01',
    firstClearReward: 1300,
    replayReward: 300,
  },
  'ch3-clandestine-tamer': {
    chapterId: 'ch3-clandestine-tamer',
    prerequisiteChapterIds: ['ch2-monotype-banners'],
    unlockCostCoins: 1600,
    requirementLabel: 'Completa el Capítulo 02',
    firstClearReward: 1800,
    replayReward: 400,
  },
  'puzzle-02-regigigas': {
    chapterId: 'puzzle-02-regigigas',
    prerequisiteChapterIds: ['puzzle-01-sun-trap'],
    unlockCostCoins: 2000,
    requirementLabel: 'Completa el Puzzle 01',
    firstClearReward: 2400,
    replayReward: 500,
  },
  'archive-vgc-2024': {
    chapterId: 'archive-vgc-2024',
    prerequisiteChapterIds: ['duel-01-honor-1v1'],
    unlockCostCoins: 1800,
    requirementLabel: 'Completa el Duelo 01 (1v1)',
    firstClearReward: 2000,
    replayReward: 450,
  },
  'challenge-last-bastion': {
    chapterId: 'challenge-last-bastion',
    prerequisiteChapterIds: ['ch2-monotype-banners'],
    unlockCostCoins: 1800,
    requirementLabel: 'Completa el Capítulo 02',
    firstClearReward: 2100,
    replayReward: 450,
  },
  'survival-galar-mines': {
    chapterId: 'survival-galar-mines',
    prerequisiteChapterIds: ['ch3-clandestine-tamer'],
    unlockCostCoins: 2000,
    requirementLabel: 'Completa el Capítulo 03',
    firstClearReward: 2300,
    replayReward: 500,
  },
  'showcase-triples-phalanx': {
    chapterId: 'showcase-triples-phalanx',
    prerequisiteChapterIds: ['challenge-last-bastion'],
    unlockCostCoins: 2200,
    requirementLabel: 'Completa El Último Bastión',
    firstClearReward: 2200,
    replayReward: 450,
  },
  'challenge-three-knights': {
    chapterId: 'challenge-three-knights',
    prerequisiteChapterIds: ['showcase-triples-phalanx'],
    unlockCostCoins: 2500,
    requirementLabel: 'Completa La Falange de Hammerlocke',
    firstClearReward: 2600,
    replayReward: 550,
  },
  'archive-gen1-silph': {
    chapterId: 'archive-gen1-silph',
    minCompletedCount: 3,
    unlockCostCoins: 1500,
    requirementLabel: 'Completa 3 capítulos cualesquiera',
    firstClearReward: 1900,
    replayReward: 400,
  },
  'anime-ash-vs-tobias': {
    chapterId: 'anime-ash-vs-tobias',
    prerequisiteChapterIds: ['puzzle-02-regigigas', 'archive-vgc-2024'],
    unlockCostCoins: 3000,
    requirementLabel: 'Completa Puzzle 02 o Archivo VGC',
    firstClearReward: 3000,
    replayReward: 600,
  },
};

export interface ShopPokemonItem {
  species: string;
  price: number;
  role: string;
  defaultAbility: string;
  defaultNature: string;
  defaultTeraType: string;
  defaultMoves: string[];
  tier: 'Estándar' | 'Élite' | 'Legendario';
}

export interface ShopHeldItem {
  name: string;
  price: number;
  desc: string;
  category: 'Ofensivo' | 'Defensivo' | 'Táctico';
}

export interface ShopTMItem {
  move: string;
  type: string;
  price: number;
  desc: string;
}

export const STARTER_INVENTORY: PlayerInventory = {
  pokemon: [
    'Arcanine',
    'Gardevoir',
    'Corviknight',
    'Milotic',
    'Sylveon',
    'Rotom',
  ],
  items: ['Leftovers', 'Sitrus Berry', 'Focus Sash', 'Light Clay', 'Rocky Helmet'],
  tms: [
    'Protect',
    'Will-O-Wisp',
    'Tailwind',
    'Scald',
    'Dazzling Gleam',
    'Flare Blitz',
    'Body Press',
    'Brave Bird',
  ],
  shinyCharms: 0,
};

export const STARTER_CUSTOM_TEAM: CustomTeamMember[] = [
  {
    species: 'Arcanine',
    item: 'Sitrus Berry',
    ability: 'Intimidate',
    nature: 'Careful',
    teraType: 'Water',
    moves: ['Flare Blitz', 'Snarl', 'Will-O-Wisp', 'Protect'],
    shiny: false,
  },
  {
    species: 'Gardevoir',
    item: 'Light Clay',
    ability: 'Telepathy',
    nature: 'Calm',
    teraType: 'Steel',
    moves: ['Dazzling Gleam', 'Light Screen', 'Reflect', 'Protect'],
    shiny: false,
  },
  {
    species: 'Corviknight',
    item: 'Rocky Helmet',
    ability: 'Mirror Armor',
    nature: 'Impish',
    teraType: 'Dragon',
    moves: ['Brave Bird', 'Body Press', 'Tailwind', 'Roost'],
    shiny: false,
  },
  {
    species: 'Milotic',
    item: 'Leftovers',
    ability: 'Competitive',
    nature: 'Calm',
    teraType: 'Grass',
    moves: ['Scald', 'Icy Wind', 'Recover', 'Protect'],
    shiny: false,
  },
  {
    species: 'Sylveon',
    item: 'Leftovers',
    ability: 'Pixilate',
    nature: 'Modest',
    teraType: 'Fire',
    moves: ['Hyper Voice', 'Yawn', 'Dazzling Gleam', 'Protect'],
    shiny: false,
  },
  {
    species: 'Rotom',
    item: 'Focus Sash',
    ability: 'Levitate',
    nature: 'Timid',
    teraType: 'Electric',
    moves: ['Thunderbolt', 'Shadow Ball', 'Will-O-Wisp', 'Protect'],
    shiny: false,
  },
];

export const SHOP_POKEMON: ShopPokemonItem[] = [
  {
    species: 'Weavile',
    price: 850,
    role: 'Rompe-pantallas y velocidad extrema',
    defaultAbility: 'Pressure',
    defaultNature: 'Jolly',
    defaultTeraType: 'Fighting',
    defaultMoves: ['Knock Off', 'Triple Axel', 'Brick Break', 'Protect'],
    tier: 'Estándar',
  },
  {
    species: 'Farigiraf',
    price: 900,
    role: 'Bloqueo de prioridad + Psicorruido',
    defaultAbility: 'Armor Tail',
    defaultNature: 'Modest',
    defaultTeraType: 'Fairy',
    defaultMoves: ['Psychic Noise', 'Hyper Voice', 'Helping Hand', 'Protect'],
    tier: 'Estándar',
  },
  {
    species: 'Swellow',
    price: 950,
    role: 'Agallas + Relevo de velocidad',
    defaultAbility: 'Guts',
    defaultNature: 'Jolly',
    defaultTeraType: 'Normal',
    defaultMoves: ['Brave Bird', 'Facade', 'Quick Attack', 'Baton Pass'],
    tier: 'Estándar',
  },
  {
    species: 'Heracross',
    price: 1000,
    role: 'Rompe-muros físico con Guts',
    defaultAbility: 'Guts',
    defaultNature: 'Jolly',
    defaultTeraType: 'Bug',
    defaultMoves: ['Megahorn', 'Close Combat', 'Facade', 'Protect'],
    tier: 'Estándar',
  },
  {
    species: 'Sceptile',
    price: 1100,
    role: 'Atacante especial ultra veloz',
    defaultAbility: 'Overgrow',
    defaultNature: 'Timid',
    defaultTeraType: 'Grass',
    defaultMoves: ['Leaf Storm', 'Dragon Pulse', 'Focus Blast', 'Protect'],
    tier: 'Estándar',
  },
  {
    species: 'Pikachu',
    price: 1200,
    role: 'Cañón de cristal con Bolaluminosa',
    defaultAbility: 'Static',
    defaultNature: 'Hasty',
    defaultTeraType: 'Electric',
    defaultMoves: ['Thunderbolt', 'Volt Tackle', 'Fake Out', 'Quick Attack'],
    tier: 'Estándar',
  },
  {
    species: 'Incineroar',
    price: 1400,
    role: 'Rey del soporte VGC (Intimidate + Fake Out)',
    defaultAbility: 'Intimidate',
    defaultNature: 'Careful',
    defaultTeraType: 'Grass',
    defaultMoves: ['Fake Out', 'Flare Blitz', 'Knock Off', 'Parting Shot'],
    tier: 'Élite',
  },
  {
    species: 'Rillaboom',
    price: 1400,
    role: 'Control de Campo de Hierba + Prioridad',
    defaultAbility: 'Grassy Surge',
    defaultNature: 'Adamant',
    defaultTeraType: 'Fire',
    defaultMoves: ['Fake Out', 'Grassy Glide', 'Wood Hammer', 'U-turn'],
    tier: 'Élite',
  },
  {
    species: 'Annihilape',
    price: 1700,
    role: 'Escalado Raid Boss (Defiant + Rage Fist)',
    defaultAbility: 'Defiant',
    defaultNature: 'Adamant',
    defaultTeraType: 'Fire',
    defaultMoves: ['Rage Fist', 'Drain Punch', 'Bulk Up', 'Protect'],
    tier: 'Élite',
  },
  {
    species: 'Dragapult',
    price: 1800,
    role: 'Infiltrator veloz que ignora Sustituto y Pantallas',
    defaultAbility: 'Infiltrator',
    defaultNature: 'Timid',
    defaultTeraType: 'Ghost',
    defaultMoves: ['Draco Meteor', 'Shadow Ball', 'Flamethrower', 'U-turn'],
    tier: 'Élite',
  },
  {
    species: 'Archaludon',
    price: 1850,
    role: 'Tanque Firmeza con Plancha Corporal',
    defaultAbility: 'Stamina',
    defaultNature: 'Bold',
    defaultTeraType: 'Fighting',
    defaultMoves: ['Body Press', 'Draco Meteor', 'Flash Cannon', 'Protect'],
    tier: 'Élite',
  },
  {
    species: 'Gholdengo',
    price: 2100,
    role: 'Inmune a estado (Good as Gold) + Fiebre Dorada',
    defaultAbility: 'Good as Gold',
    defaultNature: 'Timid',
    defaultTeraType: 'Steel',
    defaultMoves: ['Make It Rain', 'Shadow Ball', 'Nasty Plot', 'Protect'],
    tier: 'Élite',
  },
  {
    species: 'Kingambit',
    price: 2200,
    role: 'Rematador supremo con Golpe Bajo y Competitivo',
    defaultAbility: 'Defiant',
    defaultNature: 'Adamant',
    defaultTeraType: 'Dark',
    defaultMoves: ['Kowtow Cleave', 'Sucker Punch', 'Iron Head', 'Swords Dance'],
    tier: 'Élite',
  },
  {
    species: 'Garchomp',
    price: 2000,
    role: 'Dragón clásico físico con Piel Tosca',
    defaultAbility: 'Rough Skin',
    defaultNature: 'Jolly',
    defaultTeraType: 'Ground',
    defaultMoves: ['Earthquake', 'Dragon Claw', 'Swords Dance', 'Protect'],
    tier: 'Élite',
  },
  {
    species: 'Urshifu-Rapid-Strike',
    price: 3200,
    role: 'Puño Invisible (ignora Protect) + Críticos garantizados',
    defaultAbility: 'Unseen Fist',
    defaultNature: 'Jolly',
    defaultTeraType: 'Water',
    defaultMoves: ['Surging Strikes', 'Close Combat', 'Aqua Jet', 'U-turn'],
    tier: 'Legendario',
  },
  {
    species: 'Heatran',
    price: 3000,
    role: 'Fortaleza Acero/Fuego con Absorbe Fuego',
    defaultAbility: 'Flash Fire',
    defaultNature: 'Modest',
    defaultTeraType: 'Grass',
    defaultMoves: ['Heat Wave', 'Earth Power', 'Flash Cannon', 'Protect'],
    tier: 'Legendario',
  },
  {
    species: 'Zacian-Crowned',
    price: 6000,
    role: 'Código Corona · Espada Indómita',
    defaultAbility: 'Intrepid Sword',
    defaultNature: 'Jolly',
    defaultTeraType: 'Fairy',
    defaultMoves: ['Behemoth Blade', 'Play Rough', 'Sacred Sword', 'Protect'],
    tier: 'Legendario',
  },
  {
    species: 'Miraidon',
    price: 6800,
    role: 'Motor Hadrónico · Campeón Mundial VGC 2024',
    defaultAbility: 'Hadron Engine',
    defaultNature: 'Timid',
    defaultTeraType: 'Fairy',
    defaultMoves: ['Electro Drift', 'Draco Meteor', 'Dazzling Gleam', 'Volt Switch'],
    tier: 'Legendario',
  },
];

export const SHOP_ITEMS: ShopHeldItem[] = [
  { name: 'Life Orb', price: 750, desc: '+30% daño en ataques a cambio de 10% PS.', category: 'Ofensivo' },
  { name: 'Choice Specs', price: 900, desc: '×1.5 Ataque Especial bloqueando en un movimiento.', category: 'Ofensivo' },
  { name: 'Choice Band', price: 900, desc: '×1.5 Ataque Físico bloqueando en un movimiento.', category: 'Ofensivo' },
  { name: 'Choice Scarf', price: 950, desc: '×1.5 Velocidad bloqueando en un movimiento.', category: 'Ofensivo' },
  { name: 'Assault Vest', price: 850, desc: '×1.5 Defensa Especial (impide movimientos de Estado).', category: 'Defensivo' },
  { name: 'Heavy-Duty Boots', price: 650, desc: 'Inmunidad total a Trampa Rocas y Púas.', category: 'Defensivo' },
  { name: 'Eviolite', price: 800, desc: '×1.5 Def y SpD en Pokémon que aún pueden evolucionar.', category: 'Defensivo' },
  { name: 'Covert Cloak', price: 700, desc: 'Protege contra efectos secundarios (Fake Out, Icy Wind).', category: 'Defensivo' },
  { name: 'Mental Herb', price: 500, desc: 'Cura Mofa (Taunt) y Otra Vez (Encore) una vez.', category: 'Táctico' },
  { name: 'Flame Orb', price: 600, desc: 'Activa Agallas (Guts) quemando al portador al fin de turno.', category: 'Táctico' },
  { name: 'Toxic Orb', price: 600, desc: 'Activa Ímpetu Tóxico / Antídoto.', category: 'Táctico' },
  { name: 'Air Balloon', price: 600, desc: 'Inmunidad a Tierra hasta recibir un golpe.', category: 'Táctico' },
  { name: 'Black Glasses', price: 500, desc: '+20% potencia a ataques tipo Siniestro.', category: 'Ofensivo' },
  { name: 'Silk Scarf', price: 500, desc: '+20% potencia a ataques tipo Normal (combo Frustration).', category: 'Ofensivo' },
  { name: 'Light Ball', price: 900, desc: 'Duplica Ataque y Ataque Especial de Pikachu.', category: 'Ofensivo' },
  { name: 'Booster Energy', price: 1100, desc: 'Activa Paleosíntesis o Carga Cuark al instante.', category: 'Táctico' },
];

export const SHOP_TMS: ShopTMItem[] = [
  { move: 'Earthquake', type: 'Ground', price: 700, desc: '100 BP área Tierra. Clásico demoledor.' },
  { move: 'Ice Beam', type: 'Ice', price: 650, desc: '90 BP Especial Hielo con 10% congelar.' },
  { move: 'Thunderbolt', type: 'Electric', price: 650, desc: '90 BP Especial Eléctrico con 10% parálisis.' },
  { move: 'Flamethrower', type: 'Fire', price: 650, desc: '90 BP Especial Fuego con 10% quemadura.' },
  { move: 'Shadow Ball', type: 'Ghost', price: 650, desc: '80 BP Especial Fantasma, puede bajar SpD.' },
  { move: 'Draco Meteor', type: 'Dragon', price: 850, desc: '130 BP Dragón devastador (-2 SpA).' },
  { move: 'Close Combat', type: 'Fighting', price: 800, desc: '120 BP Físico Lucha (-1 Def/SpD).' },
  { move: 'Drain Punch', type: 'Fighting', price: 700, desc: '75 BP Físico Lucha que cura 50% del daño.' },
  { move: 'Knock Off', type: 'Dark', price: 750, desc: 'Retira el objeto rival y aumenta potencia.' },
  { move: 'Sucker Punch', type: 'Dark', price: 750, desc: '70 BP Prioridad +1 si el rival ataca.' },
  { move: 'U-turn', type: 'Bug', price: 650, desc: '70 BP pivote físico que cambia al usuario.' },
  { move: 'Volt Switch', type: 'Electric', price: 650, desc: '70 BP pivote especial Eléctrico.' },
  { move: 'Baton Pass', type: 'Normal', price: 1100, desc: 'Transfiere boosts y sustitutos a un compañero.' },
  { move: 'Psychic Noise', type: 'Psychic', price: 950, desc: '75 BP Psíquico que bloquea toda curación 2 turnos.' },
  { move: 'Brick Break', type: 'Fighting', price: 600, desc: '75 BP Lucha que destruye Reflejo y Pantalla Luz.' },
  { move: 'Haze', type: 'Ice', price: 750, desc: 'Reinicia todos los cambios de stats en el campo.' },
  { move: 'Taunt', type: 'Dark', price: 600, desc: 'Impide usar movimientos de Estado durante 3 turnos.' },
  { move: 'Encore', type: 'Normal', price: 700, desc: 'Obliga al rival a repetir su último movimiento.' },
  { move: 'Swords Dance', type: 'Normal', price: 800, desc: '+2 Ataque Físico al usuario.' },
  { move: 'Nasty Plot', type: 'Dark', price: 800, desc: '+2 Ataque Especial al usuario.' },
  { move: 'Bulk Up', type: 'Fighting', price: 700, desc: '+1 Ataque y +1 Defensa al usuario.' },
  { move: 'Trick Room', type: 'Psychic', price: 900, desc: 'Invierte el orden de Velocidad durante 5 turnos.' },
  { move: 'Fake Out', type: 'Normal', price: 850, desc: 'Prioridad +3, hace retroceder en Turno 1.' },
  { move: 'Helping Hand', type: 'Normal', price: 550, desc: '×1.5 al daño del compañero en Dobles/Triples.' },
  { move: 'Stealth Rock', type: 'Rock', price: 600, desc: 'Trampa Rocas que daña a cada rival al entrar.' },
  { move: 'Recover', type: 'Normal', price: 700, desc: 'Restaura 50% de los PS máximos.' },
  { move: 'Frustration', type: 'Normal', price: 900, desc: 'Hasta 102 BP si se combina con Felicidad: 0 (Vínculo roto).' },
];

export const POKEMON_CATALOG_MAP = new Map(
  SHOP_POKEMON.map((p) => [p.species.toLowerCase(), p])
);
