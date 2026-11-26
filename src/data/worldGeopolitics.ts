export type GeopoliticalFactionKind =
  | 'imperial_core'
  | 'imperial_colony'
  | 'contested'
  | 'independent'
  | 'rival_empire'
  | 'isolationist'
  | 'mystery';

export type WorldBlocId =
  | 'galar_empire'
  | 'poke_africa'
  | 'poke_india'
  | 'poke_canada'
  | 'poke_australia'
  | 'kalos'
  | 'paldea'
  | 'unova'
  | 'alola'
  | 'poke_south_america'
  | 'poke_china'
  | 'poke_japan';

export interface WorldBlocDefinition {
  id: WorldBlocId;
  name: string;
  shortName: string;
  factionKind: GeopoliticalFactionKind;
  factionBadge: string;
  /** ISO 3166-1 numeric codes (3-digit zero-padded strings in world-atlas countries-110m). */
  isoNumericIds: string[];
  /** Distinct regional/cultural Civilization palette. */
  regionFill: string;
  regionStroke: string;
  /** Unified Imperial vs. Rival Powers lens palette. */
  empireFill: string;
  empireStroke: string;
  /** Geographic focus center [lon, lat] for camera pan/zoom & label anchor. */
  center: [number, number];
  /** Label anchor [lon, lat] in global view. */
  labelCoords: [number, number];
  focusZoom: number;
  statusTag: string;
  loreSummary: string;
  keyResource: string;
  featuredCanonClue: string;
}

export interface ChapterMapLocation {
  chapterId: string;
  blocId: WorldBlocId;
  locationName: string;
  regionLabel: string;
  theaterNote: string;
  /** [longitude, latitude] in WGS84 degrees. */
  coords: [number, number];
  /** Camera zoom factor when hovering/selecting this chapter. */
  zoom: number;
  /** Optional curved strategic arc from another point on Earth (e.g. Duelist's journey or Holographic Archive link). */
  originArcFrom?: [number, number];
  originArcLabel?: string;
}

export const FACTION_KIND_META: Record<
  GeopoliticalFactionKind,
  { label: string; dotColor: string; pillClass: string }
> = {
  imperial_core: {
    label: 'Metrópoli · Imperio de Galar',
    dotColor: '#e11d48',
    pillClass: 'border-rose-400/50 bg-rose-500/20 text-rose-200',
  },
  imperial_colony: {
    label: 'Colonia Subyugada · Imperio de Galar',
    dotColor: '#ea580c',
    pillClass: 'border-amber-400/50 bg-amber-500/20 text-amber-200',
  },
  contested: {
    label: 'Paz Forzada · Polvorín Rebelde',
    dotColor: '#84cc16',
    pillClass: 'border-lime-400/50 bg-lime-500/20 text-lime-200',
  },
  independent: {
    label: 'Potencia Independiente',
    dotColor: '#10b981',
    pillClass: 'border-emerald-400/50 bg-emerald-500/20 text-emerald-200',
  },
  rival_empire: {
    label: 'Imperio Rival Continental',
    dotColor: '#0d9488',
    pillClass: 'border-teal-400/50 bg-teal-500/20 text-teal-200',
  },
  isolationist: {
    label: 'Bloque Aislacionista',
    dotColor: '#8b5cf6',
    pillClass: 'border-violet-400/50 bg-violet-500/20 text-violet-200',
  },
  mystery: {
    label: 'Frontera Inexplorada · Amenaza al Monopolio',
    dotColor: '#059669',
    pillClass: 'border-cyan-400/50 bg-cyan-500/20 text-cyan-200',
  },
};

export const WORLD_BLOCS: WorldBlocDefinition[] = [
  {
    id: 'galar_empire',
    name: 'Imperio de Galar (Metrópoli)',
    shortName: 'GALAR',
    factionKind: 'imperial_core',
    factionBadge: 'Metrópoli Imperial · Monopolio Ditto',
    isoNumericIds: ['826', '372'],
    regionFill: '#e11d48',
    regionStroke: '#fbbf24',
    empireFill: '#e11d48',
    empireStroke: '#fde047',
    center: [-2.2, 53.6],
    labelCoords: [-3.5, 56.5],
    focusZoom: 5.8,
    statusTag: 'Crisis de Sucesión Activa',
    loreSummary:
      'Corazón del Imperio y custodio del Último Ditto en los laboratorios de Wyndon. El golpe del Consejo tras la muerte del rey fracturó la paz interna y desató la persecución del heredero.',
    keyResource: 'Monopolio genético del Último Ditto y armería real',
    featuredCanonClue: 'Wyndon · Hammerlocke · Isla de la Armadura · Nieves de la Corona',
  },
  {
    id: 'poke_africa',
    name: 'Poké-África (Corredor del Nilo a la Sabana)',
    shortName: 'POKÉ-ÁFRICA',
    factionKind: 'imperial_colony',
    factionBadge: 'Reserva Imperial · Minorías Oprimidas',
    isoNumericIds: [
      '818', // Egipto
      '729', // Sudán
      '728', // Sudán del Sur
      '404', // Kenia
      '800', // Uganda
      '834', // Tanzania
      '566', // Nigeria
      '288', // Ghana
      '694', // Sierra Leona
      '894', // Zambia
      '716', // Zimbabue
      '072', // Botsuana
      '710', // Sudáfrica
      '516', // Namibia
      '706', // Somalia
      '454', // Malaui
      '426', // Lesoto
      '748', // Esuatini
    ],
    regionFill: '#ea580c',
    regionStroke: '#fdba74',
    empireFill: '#be123c',
    empireStroke: '#fbbf24',
    center: [26.0, -2.5],
    labelCoords: [26.0, 2.0],
    focusZoom: 2.35,
    statusTag: 'Frontera Colonial · Próximo Arco',
    loreSummary:
      'Corredor estratégico de Egipto a Sudáfrica y la costa occidental. Última gran reserva biológica con especies sin clonar (Pyroar, Hippowdon, Farigiraf, Cofagrigus) y culturas antiguas con vínculos ajenos al Imperio.',
    keyResource: 'Reservas naturales sin clonar, fósiles y piedras evolutivas',
    featuredCanonClue: 'Corredor del Nilo · Sabana del Sur · Culturas del Vínculo Antiguo',
  },
  {
    id: 'poke_india',
    name: 'Poké-India (Tierra de Copperajah)',
    shortName: 'POKÉ-INDIA',
    factionKind: 'imperial_colony',
    factionBadge: 'Joya de la Corona · Subyugada',
    isoNumericIds: ['356', '586', '050', '144', '104', '458', '524', '064'],
    regionFill: '#d97706',
    regionStroke: '#fde68a',
    empireFill: '#be123c',
    empireStroke: '#fbbf24',
    center: [80.0, 21.0],
    labelCoords: [79.5, 22.0],
    focusZoom: 3.1,
    statusTag: 'Tributos bajo Tensión · Próximo Arco',
    loreSummary:
      'La región ancestral de donde Galar importó a Copperajah hace siglos. Densamente poblada y rica en especies Psíquico, Lucha y Acero, sometida como mano de obra y fuente de tributos para la Corona.',
    keyResource: 'Linajes originales de Copperajah y templos Psíquico/Acero',
    featuredCanonClue: 'Origen histórico de Copperajah (Pokédex de Galar)',
  },
  {
    id: 'poke_canada',
    name: 'Poké-Canadá (Dominio Boreal)',
    shortName: 'DOMINIO BOREAL',
    factionKind: 'imperial_colony',
    factionBadge: 'Dominio Imperial · Frontera Sur Tensa',
    isoNumericIds: ['124', '084', '044', '388'],
    regionFill: '#be123c',
    regionStroke: '#fda4af',
    empireFill: '#be123c',
    empireStroke: '#fbbf24',
    center: [-96.0, 56.0],
    labelCoords: [-102.0, 58.0],
    focusZoom: 2.3,
    statusTag: 'Frontera Militarizada con Teselia',
    loreSummary:
      'Extenso territorio septentrional controlado por virreyes de Galar. Sostiene un cerco aduanero y militar constante frente a la vecina República Independiente de Teselia.',
    keyResource: 'Rutas boreales, reservas de Hielo y acuartelamientos del Atlántico',
    featuredCanonClue: 'Frontera Norte sobre Teselia (Unova)',
  },
  {
    id: 'poke_australia',
    name: 'Poké-Australia (Colonia Penal del Sur)',
    shortName: 'COLONIA PENAL',
    factionKind: 'imperial_colony',
    factionBadge: 'Exilio Imperial · Fauna Hostil',
    isoNumericIds: ['036', '554', '598'],
    regionFill: '#c2410c',
    regionStroke: '#fed7aa',
    empireFill: '#be123c',
    empireStroke: '#fbbf24',
    center: [135.0, -25.0],
    labelCoords: [134.0, -24.5],
    focusZoom: 2.75,
    statusTag: 'Exilio de Rebeldes · Próximo Arco',
    loreSummary:
      'Continente aislado adonde la Corona deporta a entrenadores insurrectos y desertores. Sus páramos albergan Pokémon salvajes indómitos que jamás aceptaron una Poké Ball imperial.',
    keyResource: 'Entrenadores exiliados y fauna salvaje hiperagresiva',
    featuredCanonClue: 'Frontera Salvaje (Kangaskhan, Komala y clanes desertores)',
  },
  {
    id: 'kalos',
    name: 'Kalos (Paz Forzada · Polvorín Rebelde)',
    shortName: 'KALOS',
    factionKind: 'contested',
    factionBadge: 'Hegemonía Tensa · Insurgencia',
    isoNumericIds: ['250', '056', '442', '756'],
    regionFill: '#84cc16',
    regionStroke: '#d9f99d',
    empireFill: '#eab308',
    empireStroke: '#fef08a',
    center: [2.4, 46.8],
    labelCoords: [2.2, 47.0],
    focusZoom: 5.0,
    statusTag: 'Facciones Rebeldes Activas',
    loreSummary:
      'Separada de Galar solo por el canal. Bajo una paz forzada durante décadas, la muerte del rey encendió de inmediato a las facciones insurgentes y a los nobles dispuestos a negociar con el Consejo.',
    keyResource: 'Energía de Megaevolución y red ferroviaria europea',
    featuredCanonClue: 'Ciudad Luminalia · Facciones de la Megaevolución',
  },
  {
    id: 'paldea',
    name: 'Paldea (Reino del Gran Cráter)',
    shortName: 'PALDEA',
    factionKind: 'independent',
    factionBadge: 'Potencia Vecina · Teracristalización',
    isoNumericIds: ['724', '620'],
    regionFill: '#ec4899',
    regionStroke: '#fbcfe8',
    empireFill: '#ec4899',
    empireStroke: '#fbcfe8',
    center: [-4.0, 40.2],
    labelCoords: [-4.2, 40.0],
    focusZoom: 5.2,
    statusTag: 'Neutralidad Armada',
    loreSummary:
      'Potencia peninsular limítrofe con Kalos. Sus academias y el Gran Cráter custodian el fenómeno Teracristal mientras observan con alarma la crisis de sucesión al norte.',
    keyResource: 'Cristales del Área Cero y expediciones académicas',
    featuredCanonClue: 'Gran Cráter de Paldea · Meseta Añil',
  },
  {
    id: 'unova',
    name: 'Teselia / Unova (República Independiente)',
    shortName: 'TESELIA',
    factionKind: 'independent',
    factionBadge: 'República Independiente',
    isoNumericIds: ['840'],
    regionFill: '#10b981',
    regionStroke: '#6ee7b7',
    empireFill: '#10b981',
    empireStroke: '#6ee7b7',
    center: [-95.0, 39.0],
    labelCoords: [-96.0, 39.5],
    focusZoom: 2.8,
    statusTag: 'Frontera Tensa con Galar',
    loreSummary:
      'Potencia independiente anclada en su metrópoli costera y la Academia Arándano en el Atlántico. Se niega a comprar licencias genéticas a Wyndon y vigila de cerca al Dominio Boreal.',
    keyResource: 'Biodomos artificiales (Academia Arándano) y comercio libre',
    featuredCanonClue: 'Costa Este (Unova) · Academia Arándano',
  },
  {
    id: 'alola',
    name: 'Alola (Archipiélago Autónomo · Honolulu)',
    shortName: 'ALOLA',
    factionKind: 'independent',
    factionBadge: 'Archipiélago Neutral del Pacífico',
    isoNumericIds: [],
    regionFill: '#f59e0b',
    regionStroke: '#fef08a',
    empireFill: '#f59e0b',
    empireStroke: '#fef08a',
    center: [-157.85, 21.31],
    labelCoords: [-156.5, 24.5],
    focusZoom: 4.6,
    statusTag: 'Sede del Archivo Mundial VGC',
    loreSummary:
      'Islas volcánicas soberanas en medio del Pacífico, protegidas por los Espíritus Guardianes. Sede neutral de la histórica Final Mundial VGC 2024 registrada en los archivos holográficos.',
    keyResource: 'Recorrido Insular y santuarios de los Tapu',
    featuredCanonClue: 'Honolulu (Final Mundial VGC 2024 · Luca vs. Yuta)',
  },
  {
    id: 'poke_south_america',
    name: 'Poké-Sudamérica (Selvas de Guyana · El Secreto de Mew)',
    shortName: 'SELVA DE MEW',
    factionKind: 'mystery',
    factionBadge: 'Zona Inexplorada · Secreto de Estado',
    isoNumericIds: [
      '076', // Brasil
      '328', // Guyana
      '740', // Surinam
      '862', // Venezuela
      '170', // Colombia
      '604', // Perú
      '218', // Ecuador
      '068', // Bolivia
      '032', // Argentina
      '152', // Chile
      '600', // Paraguay
      '858', // Uruguay
    ],
    regionFill: '#059669',
    regionStroke: '#34d399',
    empireFill: '#0891b2',
    empireStroke: '#67e8f9',
    center: [-59.0, -7.0],
    labelCoords: [-59.0, -8.5],
    focusZoom: 2.35,
    statusTag: 'Rumor Mortal para el Monopolio Ditto',
    loreSummary:
      'El mayor temor de la Corona: las selvas inexploradas de Guyana donde, según los archivos antiguos, fue avistado Mew. Si sobrevive ahí, el monopolio genético del Último Ditto quedaría destruido para siempre.',
    keyResource: 'El mito viviente de Mew (ADN ancestral de todas las especies)',
    featuredCanonClue: 'Selvas de Guyana (Diarios de la Mansión Pokémon Gen 1)',
  },
  {
    id: 'poke_china',
    name: 'Poké-China y Asia Continental',
    shortName: 'ASIA CONTINENTAL',
    factionKind: 'rival_empire',
    factionBadge: 'Imperio Rival · No Conquistado',
    isoNumericIds: ['156', '496', '410', '408', '704', '764', '418', '116', '158'],
    regionFill: '#0d9488',
    regionStroke: '#5eead4',
    empireFill: '#0f766e',
    empireStroke: '#5eead4',
    center: [105.0, 34.0],
    labelCoords: [104.0, 35.0],
    focusZoom: 2.65,
    statusTag: 'Contrapeso Mundial de Galar',
    loreSummary:
      'Coloso continental que el Imperio de Galar jamás logró someter. Tierra lejana al este de Paldea de donde provienen las Cuatro Ruinas y las montañas secretas de los maestros de Kubfu y Urshifu.',
    keyResource: 'Artes marciales antiguas y sellos de las Cuatro Ruinas',
    featuredCanonClue: 'Tierras de las Cuatro Ruinas · Montañas de Kubfu/Urshifu',
  },
  {
    id: 'poke_japan',
    name: 'Bloque Aislacionista de Poké-Japón',
    shortName: 'POKÉ-JAPÓN',
    factionKind: 'isolationist',
    factionBadge: 'Archipiélago Cerrado · Estilo Meiji',
    isoNumericIds: ['392'],
    regionFill: '#8b5cf6',
    regionStroke: '#ddd6fe',
    empireFill: '#7c3aed',
    empireStroke: '#c4b5fd',
    center: [139.5, 38.8],
    labelCoords: [147.0, 36.5],
    focusZoom: 4.5,
    statusTag: '3 Escenarios Activos · Sinnoh & Kanto',
    loreSummary:
      'Archipiélago celosamente cerrado que reúne a Kanto, Johto, Hoenn, Sinnoh y Kitakami. Rechaza toda tutela de Galar y guarda tanto las bóvedas clásicas de Silph Co. como el Templo de Regigigas.',
    keyResource: 'Ecosistemas intactos, tecnología Silph y templos legendarios',
    featuredCanonClue: 'Kanto (Silph Co.) · Sinnoh (Puntaneva & Valle Lirio) · Johto · Hoenn · Kitakami',
  },
];

export const BLOC_BY_ID: Record<WorldBlocId, WorldBlocDefinition> = WORLD_BLOCS.reduce(
  (acc, bloc) => {
    acc[bloc.id] = bloc;
    return acc;
  },
  {} as Record<WorldBlocId, WorldBlocDefinition>
);

export const ISO_TO_BLOC: Record<string, WorldBlocDefinition> = {};
for (const bloc of WORLD_BLOCS) {
  for (const iso of bloc.isoNumericIds) {
    ISO_TO_BLOC[iso] = bloc;
  }
}

/**
 * Exact narrative theater coordinates for every playable chapter.
 * Hovering a mission card in ChapterSelect smoothly zooms the Civilization map here!
 */
export const CHAPTER_MAP_LOCATIONS: Record<string, ChapterMapLocation> = {
  'ch1-wyndon-chase': {
    chapterId: 'ch1-wyndon-chase',
    blocId: 'galar_empire',
    locationName: 'Callejones de Wyndon · Torre del Reloj',
    regionLabel: 'Galar · Metrópoli (Sur)',
    theaterNote: 'Emboscada nocturna bajo la lluvia tras el golpe del Consejo.',
    coords: [-0.15, 51.52],
    zoom: 7.4,
  },
  'ch2-monotype-banners': {
    chapterId: 'ch2-monotype-banners',
    blocId: 'galar_empire',
    locationName: 'Campos de Ceniza · Frontera de las Casas',
    regionLabel: 'Galar · Tierras Altas del Norte',
    theaterNote: 'Decreto real de estandartes entre la Corona y la Casa Rebelde.',
    coords: [-2.65, 55.15],
    zoom: 6.4,
  },
  'ch3-clandestine-tamer': {
    chapterId: 'ch3-clandestine-tamer',
    blocId: 'galar_empire',
    locationName: 'Foso Subterráneo · Distrito Industrial',
    regionLabel: 'Galar · Subsuelo de Wyndon',
    theaterNote: 'Cuadrilátero prohibido operado por un noble caído.',
    coords: [-0.85, 51.45],
    zoom: 7.4,
  },
  'ch2-banquet-ambush': {
    chapterId: 'ch2-banquet-ambush',
    blocId: 'galar_empire',
    locationName: 'Palacio Real de Wyndon · Salón de Cristal',
    regionLabel: 'Galar · Ciudadela Real',
    theaterNote: 'Apagón en plena cena diplomática con sabotaje sin reglas.',
    coords: [-0.05, 51.82],
    zoom: 7.4,
  },
  'puzzle-01-sun-trap': {
    chapterId: 'puzzle-01-sun-trap',
    blocId: 'galar_empire',
    locationName: 'Patio Solar · Afueras de Wyndon',
    regionLabel: 'Galar · Costa Suroeste',
    theaterNote: 'Tablero abrasador dirigido desde una cabina con aire acondicionado.',
    coords: [-1.85, 51.02],
    zoom: 7.0,
  },
  'puzzle-02-regigigas': {
    chapterId: 'puzzle-02-regigigas',
    blocId: 'poke_japan',
    locationName: 'Templo de Puntaneva · Cámara Sellada',
    regionLabel: 'Sinnoh Norte · Bloque Poké-Japón',
    theaterNote: 'El Guardián antiguo gira la llave rúnica que despierta al Coloso.',
    coords: [141.75, 45.25],
    zoom: 5.8,
  },
  'flashback-lc-champion': {
    chapterId: 'flashback-lc-champion',
    blocId: 'galar_empire',
    locationName: 'Jardines del Palacio Real (Hace 10 años)',
    regionLabel: 'Galar · Recuerdo de Infancia',
    theaterNote: 'Primera prueba con crías frente a la Campeona invicta.',
    coords: [-0.95, 52.05],
    zoom: 7.2,
  },
  'duel-01-honor-1v1': {
    chapterId: 'duel-01-honor-1v1',
    blocId: 'galar_empire',
    locationName: 'Círculo de Piedra · Puertas de la Corte',
    regionLabel: 'Galar · Acantilados del Canal',
    theaterNote:
      'Una guerrera venida de las colonias subyugadas reta al heredero a muerte súbita 1v1.',
    coords: [1.15, 51.18],
    zoom: 6.4,
    originArcFrom: [31.2, 26.8],
    originArcLabel: 'Travesía desde la Frontera Subyugada',
  },
  'archive-vgc-2024': {
    chapterId: 'archive-vgc-2024',
    blocId: 'alola',
    locationName: 'Estadio de Honolulu · Archivo Mundial',
    regionLabel: 'Alola · Archipiélago del Pacífico',
    theaterNote: 'Simulación oficial de la Final Mundial VGC 2024 (Luca vs. Yuta).',
    coords: [-157.85, 21.31],
    zoom: 4.8,
    originArcFrom: [-0.15, 51.52],
    originArcLabel: 'Enlace Holográfico desde Wyndon',
  },
  'showcase-triples-phalanx': {
    chapterId: 'showcase-triples-phalanx',
    blocId: 'galar_empire',
    locationName: 'Murallas de Hammerlocke',
    regionLabel: 'Galar · Centro Militar',
    theaterNote: 'Formación triple de caballería desplegada frente a la fortaleza.',
    coords: [-1.85, 53.05],
    zoom: 6.8,
  },
  'challenge-weather-terrains': {
    chapterId: 'challenge-weather-terrains',
    blocId: 'galar_empire',
    locationName: 'Domo Climático Robado · Sur de Galar',
    regionLabel: 'Galar · Laboratorio Secuestrado',
    theaterNote: 'Ocho proyectores de climas y terrenos bajo control VR.',
    coords: [-2.85, 50.85],
    zoom: 6.8,
  },
  'challenge-last-bastion': {
    chapterId: 'challenge-last-bastion',
    blocId: 'galar_empire',
    locationName: 'Muelles de Wyndon · Puente de Carga',
    regionLabel: 'Galar · Estuario Oriental',
    theaterNote: 'Emboscada portuaria 1 contra 6 entre la niebla marina.',
    coords: [0.55, 51.55],
    zoom: 7.4,
  },
  'challenge-three-knights': {
    chapterId: 'challenge-three-knights',
    blocId: 'galar_empire',
    locationName: 'Patio Interior de Hammerlocke',
    regionLabel: 'Galar · Consejo de Guerra',
    theaterNote: 'Juicio marcial 1 contra 3 frente a la Tríada de Élite.',
    coords: [-1.35, 53.55],
    zoom: 6.8,
  },
  'survival-galar-mines': {
    chapterId: 'survival-galar-mines',
    blocId: 'galar_empire',
    locationName: 'Minas de Galar · Nivel Profundo 4',
    regionLabel: 'Galar · Galerías del Oeste',
    theaterNote: 'Fuga subterránea en dos oleadas consecutivas sin curación.',
    coords: [-3.55, 52.35],
    zoom: 6.8,
  },
  'archive-gen1-silph': {
    chapterId: 'archive-gen1-silph',
    blocId: 'poke_japan',
    locationName: 'Bóveda de Silph Co. · Ciudad Azafrán',
    regionLabel: 'Kanto · Bloque Poké-Japón',
    theaterNote: 'Cinta sellada de la Era Antigua frente al mito de Mewtwo.',
    coords: [139.75, 35.68],
    zoom: 5.8,
  },
  'anime-ash-vs-tobias': {
    chapterId: 'anime-ash-vs-tobias',
    blocId: 'poke_japan',
    locationName: 'Estadio del Valle Lirio · Semifinales',
    regionLabel: 'Sinnoh Este · Bloque Poké-Japón',
    theaterNote: 'La semifinal legendaria de la Liga de Sinnoh.',
    coords: [144.35, 43.15],
    zoom: 5.8,
  },
};

/** Subtle regional micro-labels rendered when zoomed into Poké-Japan or Galar. */
export const ZOOM_LANDMARKS: Array<{
  id: string;
  label: string;
  coords: [number, number];
  minZoom: number;
  color: string;
}> = [
  { id: 'lm-sinnoh', label: 'SINNOH', coords: [142.8, 43.8], minZoom: 3.2, color: '#c4b5fd' },
  { id: 'lm-kitakami', label: 'KITAKAMI', coords: [140.8, 39.4], minZoom: 3.8, color: '#a78bfa' },
  { id: 'lm-kanto', label: 'KANTO', coords: [139.6, 36.1], minZoom: 3.2, color: '#fde047' },
  { id: 'lm-johto', label: 'JOHTO', coords: [135.8, 35.1], minZoom: 3.6, color: '#67e8f9' },
  { id: 'lm-hoenn', label: 'HOENN', coords: [131.0, 32.8], minZoom: 3.6, color: '#86efac' },
  { id: 'lm-crown-tundra', label: 'NIEVES CORONA', coords: [-4.3, 57.2], minZoom: 4.5, color: '#fca5a5' },
  { id: 'lm-isle-armor', label: 'ISLA ARMADURA', coords: [-4.55, 54.2], minZoom: 4.8, color: '#fcd34d' },
  { id: 'lm-wyndon', label: 'WYNDON', coords: [-0.15, 51.3], minZoom: 4.5, color: '#fde68a' },
  { id: 'lm-hammerlocke', label: 'HAMMERLOCKE', coords: [-1.85, 53.25], minZoom: 4.5, color: '#fde68a' },
  { id: 'lm-blueberry', label: 'ACADEMIA ARÁNDANO', coords: [-70.5, 37.8], minZoom: 2.4, color: '#6ee7b7' },
  { id: 'lm-guyana-mew', label: 'SELVA DE GUYANA (¿MEW?)', coords: [-58.8, 4.9], minZoom: 1.8, color: '#67e8f9' },
  { id: 'lm-four-ruins', label: 'CUATRO RUINAS', coords: [115.0, 36.0], minZoom: 2.0, color: '#5eead4' },
  { id: 'lm-kubfu', label: 'MONTAÑAS URSHIFU', coords: [112.0, 26.5], minZoom: 2.0, color: '#5eead4' },
];
