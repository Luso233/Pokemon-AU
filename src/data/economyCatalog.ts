import type {
  BattleDifficultyMode,
  CustomTeamMember,
  PlayerInventory,
  VnPacingMode,
} from '../types/game';

export const CURRENCY_NAME = 'PokéCoronas';
export const CURRENCY_SHORT = 'PC';
export const MAX_SHINY_CHARMS = 6;
export const SHINY_CHARM_PRICE = 10000;

export const DIFFICULTY_META: Record<
  BattleDifficultyMode,
  {
    id: BattleDifficultyMode;
    label: string;
    shortLabel: string;
    subtitle: string;
    desc: string;
    badgeClass: string;
  }
> = {
  baby: {
    id: 'baby',
    label: 'Baby Mode',
    shortLabel: 'Baby Mode',
    subtitle: 'Paseo Real (-8 Nv. · IA relajada)',
    desc: 'Rivales 8 niveles por debajo del cap, sets suavizados e IA indulgente. Ideal para disfrutar la trama sin estrés.',
    badgeClass: 'border-sky-400/50 bg-sky-500/20 text-sky-200',
  },
  standard: {
    id: 'standard',
    label: 'Normal',
    shortLabel: 'Normal',
    subtitle: 'Estándar (-4 Nv. · Sets contenidos)',
    desc: 'Sets contenidos (ej. Bubble Beam + Mystic Water) e IA directa y legible para aprender el sistema.',
    badgeClass: 'border-emerald-400/50 bg-emerald-500/20 text-emerald-200',
  },
  kaizo: {
    id: 'kaizo',
    label: 'Difícil',
    shortLabel: 'Difícil',
    subtitle: 'Kaizo Canónico (Cap exacto)',
    desc: 'Balance táctico oficial de Crown of Galar. Cada jefe juega al nivel canónico con sus trucos completos.',
    badgeClass: 'border-amber-400/50 bg-amber-500/20 text-amber-200',
  },
  nightmare: {
    id: 'nightmare',
    label: 'Tryhard',
    shortLabel: 'Tryhard',
    subtitle: 'Diablo (+4 Nv. · Anti-Explotación)',
    desc: 'Rivales sobre el level cap con overrides letales (Water Spout + Choice Specs) e IA Anti-Explotación que caza bajas.',
    badgeClass: 'border-rose-400/60 bg-rose-500/25 text-rose-100',
  },
};

export const DIFFICULTY_ORDER: BattleDifficultyMode[] = [
  'baby',
  'standard',
  'kaizo',
  'nightmare',
];

export const VN_PACING_META: Record<
  VnPacingMode,
  {
    id: VnPacingMode;
    label: string;
    shortLabel: string;
    desc: string;
  }
> = {
  full: {
    id: 'full',
    label: 'Chutármelo todo (VN Completa)',
    shortLabel: 'VN Completa',
    desc: 'Lee todos los diálogos, retratos y escenas políticas línea por línea antes de cada batalla.',
  },
  'decisions-only': {
    id: 'decisions-only',
    label: 'Directo a las Decisiones',
    shortLabel: 'Solo Decisiones',
    desc: 'Avanza automáticamente el texto narrativo y frena justo en cada elección táctica que cambia el combate.',
  },
  'skip-to-battle': {
    id: 'skip-to-battle',
    label: 'Saltar Novela Visual',
    shortLabel: 'Saltar VN',
    desc: 'Aplica la ruta canónica al instante y te lleva directo al Teambuilder / Combate sin leer diálogos.',
  },
};

export interface ChapterRewardPokemonSpec {
  species: string;
  ability: string;
  nature: string;
  teraType: string;
  moves: string[];
  item?: string;
  note: string;
}

export interface ChapterUnlockRule {
  chapterId: string;
  /** Campaign escalation stage: 1..4 = Acts I–IV, 5 = Climax, 6 = Optional Postgame. */
  campaignAct?: 1 | 2 | 3 | 4 | 5 | 6;
  isMainStory?: boolean;
  unlockedByDefault?: boolean;
  prerequisiteChapterIds?: string[];
  /** Chapters that reveal this node on Map & ChapterSelect (even while still locked with padlock). */
  revealAfterChapterIds?: string[];
  /** World Bloc ID required in `profile.visitedRegions` for visibility. */
  requiredRegion?: string;
  /** Required NPC affinity rank (used for Social Links R2/R3). */
  requiredAffinity?: { npcId: string; rank: number };
  /** Regions added to `profile.visitedRegions` upon clearing this chapter (unlocking Regional Social Links!). */
  unlocksRegions?: string[];
  /** True for Postgame content (only visible after defeating Bastard Brother Climax). */
  isPostgame?: boolean;
  /** true = invisible in Map & ChapterSelect until revealed/unlocked; false = shown with padlock as next objective. */
  hideWhenLocked?: boolean;
  minCompletedCount?: number;
  unlockCostCoins: number;
  requirementLabel: string;
  firstClearReward: number;
  replayReward: number;
  /** Optional held item awarded directly into inventory upon first clear. */
  rewardItem?: string;
  /** Playable Pokémon unlocked into your PC Boxes for the rest of the run upon clearing this chapter! */
  rewardPokemon: ChapterRewardPokemonSpec;
}

export const STARTER_UNLOCKED_CHAPTERS: string[] = [
  'ch1-wyndon-chase',
  'puzzle-01-sun-trap',
  'flashback-lc-champion',
];

export const CHAPTER_UNLOCK_RULES: Record<string, ChapterUnlockRule> = {
  'ch1-wyndon-chase': {
    chapterId: 'ch1-wyndon-chase',
    campaignAct: 1,
    isMainStory: true,
    unlockedByDefault: true,
    hideWhenLocked: false,
    unlocksRegions: ['galar_empire', 'kalos'],
    unlockCostCoins: 0,
    requirementLabel: 'Disponible desde el inicio (Acto I)',
    firstClearReward: 1500,
    replayReward: 350,
    rewardItem: 'Mental Herb',
    rewardPokemon: {
      species: 'Ceruledge',
      ability: 'Flash Fire',
      nature: 'Adamant',
      teraType: 'Fire',
      moves: ['Bitter Blade', 'Shadow Sneak', 'Close Combat', 'Protect'],
      note: 'Espadachín espectro-fuego de los callejones de Wyndon: sustento y prioridad brutal para tu run.',
    },
  },
  'puzzle-01-sun-trap': {
    chapterId: 'puzzle-01-sun-trap',
    campaignAct: 1,
    unlockedByDefault: true,
    hideWhenLocked: false,
    unlockCostCoins: 0,
    requirementLabel: 'Disponible desde el inicio',
    firstClearReward: 1500,
    replayReward: 350,
    rewardItem: 'Choice Scarf',
    rewardPokemon: {
      species: 'Volcarona',
      ability: 'Flame Body',
      nature: 'Timid',
      teraType: 'Grass',
      moves: ['Heat Wave', 'Quiver Dance', 'Bug Buzz', 'Giga Drain'],
      note: 'Sweeper especial rescatado del patio solar de Miraj: Quiver Dance rompe combates largos.',
    },
  },
  'challenge-weather-terrains': {
    chapterId: 'challenge-weather-terrains',
    campaignAct: 3,
    prerequisiteChapterIds: ['puzzle-01-sun-trap'],
    revealAfterChapterIds: ['puzzle-01-sun-trap'],
    hideWhenLocked: true,
    unlockCostCoins: 1100,
    requirementLabel: 'Completa el Puzzle 01',
    firstClearReward: 1800,
    replayReward: 400,
    rewardItem: 'Clear Amulet',
    rewardPokemon: {
      species: 'Pelipper',
      ability: 'Drizzle',
      nature: 'Modest',
      teraType: 'Water',
      moves: ['Hurricane', 'Weather Ball', 'Tailwind', 'Wide Guard'],
      note: 'Soporte de lluvia instantánea + Tailwind + Wide Guard robado del domo climático de Tamra.',
    },
  },
  'flashback-lc-champion': {
    chapterId: 'flashback-lc-champion',
    campaignAct: 1,
    unlockedByDefault: true,
    hideWhenLocked: false,
    unlockCostCoins: 0,
    requirementLabel: 'Disponible desde el inicio',
    firstClearReward: 1400,
    replayReward: 300,
    rewardItem: 'Eviolite',
    rewardPokemon: {
      species: 'Dragapult',
      ability: 'Clear Body',
      nature: 'Timid',
      teraType: 'Ghost',
      moves: ['Draco Meteor', 'Shadow Ball', 'Flamethrower', 'U-turn'],
      note: 'Velocidad élite heredada del entrenamiento con La Campeona: pivote fantasma top tier.',
    },
  },
  'ch2-monotype-banners': {
    chapterId: 'ch2-monotype-banners',
    campaignAct: 1,
    isMainStory: true,
    prerequisiteChapterIds: ['ch1-wyndon-chase'],
    hideWhenLocked: false,
    unlocksRegions: ['kalos', 'paldea'],
    unlockCostCoins: 1200,
    requirementLabel: 'Acto I · Completa el Capítulo 01 (Wyndon)',
    firstClearReward: 1600,
    replayReward: 350,
    rewardItem: 'Assault Vest',
    rewardPokemon: {
      species: 'Gholdengo',
      ability: 'Good as Gold',
      nature: 'Timid',
      teraType: 'Steel',
      moves: ['Make It Rain', 'Shadow Ball', 'Nasty Plot', 'Protect'],
      note: 'Inmune a cualquier movimiento de Estado gracias a Good as Gold: oro puro en Ironman.',
    },
  },
  'ch2-banquet-ambush': {
    chapterId: 'ch2-banquet-ambush',
    campaignAct: 1,
    prerequisiteChapterIds: ['ch1-wyndon-chase'],
    revealAfterChapterIds: ['ch1-wyndon-chase'],
    hideWhenLocked: true,
    unlockCostCoins: 900,
    requirementLabel: 'Completa el Capítulo 01',
    firstClearReward: 1200,
    replayReward: 300,
    rewardItem: 'Covert Cloak',
    rewardPokemon: {
      species: 'Zoroark-Hisui',
      ability: 'Illusion',
      nature: 'Timid',
      teraType: 'Ghost',
      moves: ['Bitter Malice', 'Hyper Voice', 'Flamethrower', 'Protect'],
      note: 'Trofeo del Salón de Cristal: 3 inmunidades (Normal/Lucha/Fantasma) + ilusión táctica.',
    },
  },
  'duel-01-honor-1v1': {
    chapterId: 'duel-01-honor-1v1',
    campaignAct: 2,
    prerequisiteChapterIds: ['ch1-wyndon-chase'],
    revealAfterChapterIds: ['ch1-wyndon-chase'],
    hideWhenLocked: true,
    unlockCostCoins: 1000,
    requirementLabel: 'Completa el Capítulo 01',
    firstClearReward: 1300,
    replayReward: 300,
    rewardItem: 'Weakness Policy',
    rewardPokemon: {
      species: 'Iron Crown',
      ability: 'Quark Drive',
      nature: 'Timid',
      teraType: 'Steel',
      moves: ['Tachyon Cutter', 'Psychic', 'Focus Blast', 'Protect'],
      note: 'Tachyon Cutter de doble golpe que rompe Focus Sash y Sustitutos sin fallar.',
    },
  },
  'ch3-clandestine-tamer': {
    chapterId: 'ch3-clandestine-tamer',
    campaignAct: 2,
    isMainStory: true,
    prerequisiteChapterIds: ['ch2-monotype-banners', 'showcase-triples-phalanx'],
    revealAfterChapterIds: ['ch2-monotype-banners'],
    hideWhenLocked: true,
    unlocksRegions: ['aztlan_caribe', 'unova'],
    unlockCostCoins: 1600,
    requirementLabel: 'Acto II · Completa Kalos (Cap. 02) o Paldea (Pirineos)',
    firstClearReward: 1800,
    replayReward: 400,
    rewardItem: 'Silk Scarf',
    rewardPokemon: {
      species: 'Ursaring',
      ability: 'Guts',
      nature: 'Adamant',
      teraType: 'Normal',
      moves: ['Frustration', 'Close Combat', 'Headlong Rush', 'Protect'],
      note: 'El Ursaring liberado del foso de Mesoa: golpea como un camión con Guts + Frustration 102 BP.',
    },
  },
  'ch4-orre-shadow-ambush': {
    chapterId: 'ch4-orre-shadow-ambush',
    campaignAct: 2,
    isMainStory: true,
    prerequisiteChapterIds: ['ch3-clandestine-tamer'],
    revealAfterChapterIds: ['ch3-clandestine-tamer'],
    hideWhenLocked: true,
    unlocksRegions: ['unova', 'andes_plata'],
    unlockCostCoins: 1900,
    requirementLabel: 'Acto II · Completa Mesoa (El Foso del Vínculo Roto)',
    firstClearReward: 2100,
    replayReward: 450,
    rewardItem: 'Smooth Rock',
    rewardPokemon: {
      species: 'Excadrill',
      ability: 'Mold Breaker',
      nature: 'Adamant',
      teraType: 'Ground',
      moves: ['Earthquake', 'Iron Head', 'Rock Slide', 'Protect'],
      note: 'Taladro rescatado de Aura (Orre), además de arrebatar los 4 Pokémon Oscuros del Sindicato directo a tu PC Box.',
    },
  },
  'challenge-xd001-shadow-lugia': {
    chapterId: 'challenge-xd001-shadow-lugia',
    campaignAct: 3,
    isMainStory: false,
    prerequisiteChapterIds: ['ch4-orre-shadow-ambush'],
    revealAfterChapterIds: ['ch4-orre-shadow-ambush'],
    hideWhenLocked: true,
    unlockCostCoins: 2200,
    requirementLabel: 'Raid Aura · Completa Emboscada de Pokémon Oscuros (Acto II)',
    firstClearReward: 3200,
    replayReward: 650,
    rewardItem: 'Leftovers',
    rewardPokemon: {
      species: 'Espeon',
      ability: 'Magic Bounce',
      nature: 'Timid',
      teraType: 'Fairy',
      moves: ['Psychic', 'Dazzling Gleam', 'Morning Sun', 'Protect'],
      note: 'Compañero clásico de Aura (Colosseum) + arrebato automático de XD001 Lugia Oscuro y las 3 Aves Oscuras a tus Cajas PC.',
    },
  },
  'puzzle-02-regigigas': {
    chapterId: 'puzzle-02-regigigas',
    campaignAct: 3,
    isMainStory: true,
    prerequisiteChapterIds: ['puzzle-01-sun-trap', 'challenge-three-knights'],
    revealAfterChapterIds: ['challenge-three-knights', 'puzzle-01-sun-trap'],
    hideWhenLocked: true,
    unlocksRegions: ['poke_africa', 'free_savanna', 'sand_crescent', 'poke_india'],
    unlockCostCoins: 2000,
    requirementLabel: 'Acto III · Completa Cordelia (Tres Caballeros) o Puzzle 01',
    firstClearReward: 2400,
    replayReward: 500,
    rewardItem: 'Life Orb',
    rewardPokemon: {
      species: 'Regigigas',
      ability: 'Slow Start',
      nature: 'Adamant',
      teraType: 'Normal',
      moves: ['Crush Grip', 'Drain Punch', 'Knock Off', 'Protect'],
      note: '¡LO LOGRASTE! Te llevas a Regigigas para el resto de la run… sí, con Slow Start intacto (absurdo en costo/recompensa, pero graciosísimo).',
    },
  },
  'ch8-tamra-cru-viceroy': {
    chapterId: 'ch8-tamra-cru-viceroy',
    campaignAct: 3,
    isMainStory: true,
    prerequisiteChapterIds: ['puzzle-02-regigigas'],
    revealAfterChapterIds: ['puzzle-02-regigigas'],
    hideWhenLocked: true,
    unlocksRegions: ['poke_india', 'monsoon_archipelago', 'poke_australia'],
    unlockCostCoins: 2400,
    requirementLabel: 'Acto III · Completa Kemetia (El Coloso Despertado)',
    firstClearReward: 2600,
    replayReward: 550,
    rewardItem: 'Rocky Helmet',
    rewardPokemon: {
      species: 'Copperajah',
      ability: 'Sheer Force',
      nature: 'Adamant',
      teraType: 'Ground',
      moves: ['Heavy Slam', 'High Horsepower', 'Play Rough', 'Protect'],
      note: 'Liberado de las fundiciones de Tamra: Potencia Bruta + Life Orb destruye muros en Espacio Raro.',
    },
  },
  'ch9-aeos-ditto-blacksite': {
    chapterId: 'ch9-aeos-ditto-blacksite',
    campaignAct: 3,
    isMainStory: true,
    prerequisiteChapterIds: ['ch8-tamra-cru-viceroy'],
    revealAfterChapterIds: ['ch8-tamra-cru-viceroy'],
    hideWhenLocked: true,
    unlocksRegions: ['alola', 'poke_japan', 'poke_china'],
    unlockCostCoins: 2800,
    requirementLabel: 'Acto III · Completa Tamra (El Virrey de la CRU)',
    firstClearReward: 2900,
    replayReward: 600,
    rewardItem: 'Focus Sash',
    rewardPokemon: {
      species: 'Ditto',
      ability: 'Imposter',
      nature: 'Relaxed',
      teraType: 'Normal',
      moves: ['Transform'],
      note: 'Muestra rescatada del Black Site de Isla Æos: Impostor voltea los boosts de cualquier jefe Uber.',
    },
  },
  'ch10-tohjo-shentai-trial': {
    chapterId: 'ch10-tohjo-shentai-trial',
    campaignAct: 4,
    isMainStory: true,
    prerequisiteChapterIds: ['ch9-aeos-ditto-blacksite'],
    revealAfterChapterIds: ['ch9-aeos-ditto-blacksite'],
    hideWhenLocked: true,
    unlocksRegions: ['poke_japan', 'poke_china', 'northern_steppe', 'poke_canada', 'amazonia_veracruz'],
    unlockCostCoins: 3200,
    requirementLabel: 'Acto IV · Completa Isla Æos (Black Site del Ditto)',
    firstClearReward: 3400,
    replayReward: 650,
    rewardItem: 'Choice Band',
    rewardPokemon: {
      species: 'Urshifu',
      ability: 'Unseen Fist',
      nature: 'Jolly',
      teraType: 'Dark',
      moves: ['Wicked Blow', 'Close Combat', 'Sucker Punch', 'Detect'],
      note: 'Brazalete de las Potencias Libres: Puño Invisible atraviesa Protección y asegura críticos oscuros.',
    },
  },
  'ch11-poketopia-traitor-council': {
    chapterId: 'ch11-poketopia-traitor-council',
    campaignAct: 4,
    isMainStory: true,
    prerequisiteChapterIds: ['ch10-tohjo-shentai-trial'],
    revealAfterChapterIds: ['ch10-tohjo-shentai-trial'],
    hideWhenLocked: true,
    unlocksRegions: ['alola', 'galar_empire'],
    unlockCostCoins: 3600,
    requirementLabel: 'Acto IV · Completa Tohjo/Shentai (Potencias Libres)',
    firstClearReward: 3800,
    replayReward: 700,
    rewardItem: 'Booster Energy',
    rewardPokemon: {
      species: 'Flutter Mane',
      ability: 'Protosynthesis',
      nature: 'Timid',
      teraType: 'Fairy',
      moves: ['Moonblast', 'Shadow Ball', 'Dazzling Gleam', 'Protect'],
      note: 'Botín del Coliseo Dorado: velocidad y ataque especial de élite para el asalto final a Wyndon.',
    },
  },
  'ch12-bastard-brother-climax': {
    chapterId: 'ch12-bastard-brother-climax',
    campaignAct: 5,
    isMainStory: true,
    prerequisiteChapterIds: ['ch11-poketopia-traitor-council'],
    revealAfterChapterIds: ['ch11-poketopia-traitor-council'],
    hideWhenLocked: true,
    unlocksRegions: ['galar_empire'],
    unlockCostCoins: 5000,
    requirementLabel: 'CLÍMAX · Derrota al Consejo Traidor en Pokétopia',
    firstClearReward: 5000,
    replayReward: 900,
    rewardItem: 'Leftovers',
    rewardPokemon: {
      species: 'Zamazenta-Crowned',
      ability: 'Dauntless Shield',
      nature: 'Impish',
      teraType: 'Dragon',
      moves: ['Body Press', 'Behemoth Bash', 'Wide Guard', 'Protect'],
      note: 'El Escudo Real de Galar regresa a su dueño legítimo tras caer el Usurpador.',
    },
  },
  'ch13-postgame-champion': {
    chapterId: 'ch13-postgame-champion',
    campaignAct: 6,
    isMainStory: false,
    isPostgame: true,
    prerequisiteChapterIds: ['ch12-bastard-brother-climax'],
    revealAfterChapterIds: ['ch12-bastard-brother-climax'],
    hideWhenLocked: true,
    unlockCostCoins: 0,
    requirementLabel: 'POSTGAME · Derrota al Hermano Bastardo en la Ciudadela Real',
    firstClearReward: 8000,
    replayReward: 1500,
    rewardItem: 'Life Orb',
    rewardPokemon: {
      species: 'Rayquaza-Mega',
      ability: 'Delta Stream',
      nature: 'Jolly',
      teraType: 'Normal',
      moves: ['Dragon Ascent', 'V-create', 'Extreme Speed', 'Protect'],
      note: 'True Mastery Badge + New Game+: la soberana suprema de Anything Goes se une a tus Cajas PC.',
    },
  },
  'archive-vgc-2024': {
    chapterId: 'archive-vgc-2024',
    campaignAct: 3,
    prerequisiteChapterIds: ['duel-01-honor-1v1'],
    revealAfterChapterIds: ['duel-01-honor-1v1'],
    hideWhenLocked: true,
    unlockCostCoins: 1800,
    requirementLabel: 'Completa el Duelo 01 (1v1)',
    firstClearReward: 2000,
    replayReward: 450,
    rewardItem: 'Booster Energy',
    rewardPokemon: {
      species: 'Miraidon',
      ability: 'Hadron Engine',
      nature: 'Timid',
      teraType: 'Fairy',
      moves: ['Electro Drift', 'Draco Meteor', 'Dazzling Gleam', 'Volt Switch'],
      note: 'Campeón Mundial de Honolulu: Motor Hadrónico + Electro Drift derriten jefes en Tryhard.',
    },
  },
  'challenge-last-bastion': {
    chapterId: 'challenge-last-bastion',
    campaignAct: 1,
    prerequisiteChapterIds: ['ch2-monotype-banners'],
    revealAfterChapterIds: ['ch1-wyndon-chase'],
    hideWhenLocked: true,
    unlockCostCoins: 1800,
    requirementLabel: 'Completa el Capítulo 02',
    firstClearReward: 2100,
    replayReward: 450,
    rewardItem: 'Choice Band',
    rewardPokemon: {
      species: 'Annihilape',
      ability: 'Defiant',
      nature: 'Adamant',
      teraType: 'Fire',
      moves: ['Rage Fist', 'Drain Punch', 'Bulk Up', 'Protect'],
      note: 'El muro de los muelles de Wyndon: Rage Fist escala hasta borrar cualquier Raid Boss.',
    },
  },
  'survival-galar-mines': {
    chapterId: 'survival-galar-mines',
    campaignAct: 3,
    prerequisiteChapterIds: ['ch3-clandestine-tamer'],
    revealAfterChapterIds: ['ch3-clandestine-tamer'],
    hideWhenLocked: true,
    unlockCostCoins: 2000,
    requirementLabel: 'Completa el Capítulo 03',
    firstClearReward: 2300,
    replayReward: 500,
    rewardItem: 'Heavy-Duty Boots',
    rewardPokemon: {
      species: 'Kingambit',
      ability: 'Supreme Overlord',
      nature: 'Adamant',
      teraType: 'Dark',
      moves: ['Kowtow Cleave', 'Sucker Punch', 'Iron Head', 'Swords Dance'],
      note: 'Sobreviviste a Tarran sin curarte: Kingambit remata late-game mejor que nadie en el juego.',
    },
  },
  'showcase-triples-phalanx': {
    chapterId: 'showcase-triples-phalanx',
    campaignAct: 1,
    isMainStory: true,
    prerequisiteChapterIds: ['challenge-last-bastion', 'ch2-monotype-banners'],
    revealAfterChapterIds: ['ch2-monotype-banners'],
    hideWhenLocked: true,
    unlocksRegions: ['paldea', 'aztlan_caribe'],
    unlockCostCoins: 2200,
    requirementLabel: 'Acto I · Completa Kalos (Cap. 02) o El Último Bastión',
    firstClearReward: 2200,
    replayReward: 450,
    rewardItem: 'Choice Specs',
    rewardPokemon: {
      species: 'Talonflame',
      ability: 'Gale Wings',
      nature: 'Jolly',
      teraType: 'Ghost',
      moves: ['Tailwind', 'Brave Bird', 'Will-O-Wisp', 'Taunt'],
      note: 'Tailwind con prioridad +1 de Gale Wings para robar el control de velocidad desde Turno 1.',
    },
  },
  'challenge-three-knights': {
    chapterId: 'challenge-three-knights',
    campaignAct: 2,
    isMainStory: true,
    prerequisiteChapterIds: ['showcase-triples-phalanx', 'ch4-orre-shadow-ambush'],
    revealAfterChapterIds: ['ch4-orre-shadow-ambush', 'showcase-triples-phalanx'],
    hideWhenLocked: true,
    unlocksRegions: ['andes_plata', 'poke_africa'],
    unlockCostCoins: 2500,
    requirementLabel: 'Acto II · Completa Aura/Orre o La Falange (Paldea)',
    firstClearReward: 2600,
    replayReward: 550,
    rewardItem: 'Flame Orb',
    rewardPokemon: {
      species: 'Garchomp',
      ability: 'Rough Skin',
      nature: 'Jolly',
      teraType: 'Ground',
      moves: ['Earthquake', 'Dragon Claw', 'Swords Dance', 'Protect'],
      note: 'Veterano del Estrecho Austral en Cordelia: presión física y castigo de contacto.',
    },
  },
  'archive-gen1-silph': {
    chapterId: 'archive-gen1-silph',
    campaignAct: 4,
    minCompletedCount: 3,
    revealAfterChapterIds: ['ch3-clandestine-tamer'],
    hideWhenLocked: true,
    unlockCostCoins: 1500,
    requirementLabel: 'Completa 3 capítulos cualesquiera',
    firstClearReward: 1900,
    replayReward: 400,
    rewardItem: 'Air Balloon',
    rewardPokemon: {
      species: 'Mew',
      ability: 'Synchronize',
      nature: 'Timid',
      teraType: 'Psychic',
      moves: ['Psychic', 'Nasty Plot', 'Flamethrower', 'Recover'],
      note: 'Reliquia mítica de Silph Co.: aprende prácticamente cualquier MT legal de tu inventario.',
    },
  },
  'anime-ash-vs-tobias': {
    chapterId: 'anime-ash-vs-tobias',
    campaignAct: 4,
    prerequisiteChapterIds: ['puzzle-02-regigigas', 'archive-vgc-2024'],
    revealAfterChapterIds: ['puzzle-02-regigigas', 'archive-vgc-2024'],
    hideWhenLocked: true,
    unlockCostCoins: 3000,
    requirementLabel: 'Completa Puzzle 02 o Archivo VGC',
    firstClearReward: 3000,
    replayReward: 600,
    rewardItem: 'Light Ball',
    rewardPokemon: {
      species: 'Darkrai',
      ability: 'Bad Dreams',
      nature: 'Timid',
      teraType: 'Dark',
      moves: ['Dark Pulse', 'Ice Beam', 'Nasty Plot', 'Hypnosis'],
      note: 'La pesadilla del Valle Lirio ahora pelea bajo tu estandarte por el resto de la run.',
    },
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
  items: ['Leftovers', 'Sitrus Berry', 'Focus Sash', 'Light Clay', 'Rocky Helmet', 'Throat Spray'],
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
    item: 'Throat Spray',
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
  // Mega Stones & Z-Crystals (Native NatDex Ecosystem: Megas + Z-Moves + Tera!)
  { name: 'Charizardite Y', price: 1600, desc: 'Megaevoluciona a Charizard en Mega-Charizard Y (Sequía).', category: 'Ofensivo' },
  { name: 'Charizardite X', price: 1600, desc: 'Megaevoluciona a Charizard en Mega-Charizard X (Garra Dura).', category: 'Ofensivo' },
  { name: 'Gardevoirite', price: 1500, desc: 'Megaevoluciona a Gardevoir en Mega-Gardevoir (Piel Feérica).', category: 'Ofensivo' },
  { name: 'Metagrossite', price: 1700, desc: 'Megaevoluciona a Metagross en Mega-Metagross (Garra Dura).', category: 'Ofensivo' },
  { name: 'Garchompite', price: 1500, desc: 'Megaevoluciona a Garchomp en Mega-Garchomp.', category: 'Ofensivo' },
  { name: 'Lucarionite', price: 1700, desc: 'Megaevoluciona a Lucario en Mega-Lucario (Adaptable).', category: 'Ofensivo' },
  { name: 'Salamencite', price: 1800, desc: 'Megaevoluciona a Salamence en Mega-Salamence (Piel Celeste).', category: 'Ofensivo' },
  { name: 'Gengarite', price: 1800, desc: 'Megaevoluciona a Gengar en Mega-Gengar (Sombra Trampa).', category: 'Táctico' },
  { name: 'Scizorite', price: 1500, desc: 'Megaevoluciona a Scizor en Mega-Scizor (Experto).', category: 'Defensivo' },
  { name: 'Firium Z', price: 1300, desc: 'Desbloquea el Movimiento Z tipo Fuego (Hecatombe Pírica).', category: 'Ofensivo' },
  { name: 'Electrium Z', price: 1300, desc: 'Desbloquea el Movimiento Z tipo Eléctrico (Gigavoltio Destructor).', category: 'Ofensivo' },
  { name: 'Fairium Z', price: 1300, desc: 'Desbloquea el Movimiento Z tipo Hada (Arrumaco Sideral).', category: 'Ofensivo' },
  { name: 'Ghostium Z', price: 1300, desc: 'Desbloquea el Movimiento Z tipo Fantasma (Presa Espectral).', category: 'Ofensivo' },
  { name: 'Dragonium Z', price: 1300, desc: 'Desbloquea el Movimiento Z tipo Dragón (Dracoaliento Devastador).', category: 'Ofensivo' },
  { name: 'Fightinium Z', price: 1300, desc: 'Desbloquea el Movimiento Z tipo Lucha (Ráfaga Demoledora).', category: 'Ofensivo' },
  { name: 'Waterium Z', price: 1300, desc: 'Desbloquea el Movimiento Z tipo Agua (Hidrovórtice Abisal).', category: 'Ofensivo' },
  { name: 'Darkinium Z', price: 1300, desc: 'Desbloquea el Movimiento Z tipo Siniestro (Agujero Negro Aniquilador).', category: 'Ofensivo' },
  { name: 'Normalium Z', price: 1200, desc: 'Desbloquea el Movimiento Z tipo Normal (Carrera Arrolladora / Z-Status).', category: 'Táctico' },
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
