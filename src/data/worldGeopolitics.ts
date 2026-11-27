import { buildRomanceMapLocations } from './regionalRomanceBlueprints';

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
  | 'kalos'
  | 'paldea'
  | 'aztlan_caribe'
  | 'amazonia_veracruz'
  | 'andes_plata'
  | 'poke_africa'
  | 'free_savanna'
  | 'sand_crescent'
  | 'poke_india'
  | 'monsoon_archipelago'
  | 'poke_australia'
  | 'poke_japan'
  | 'alola'
  | 'unova'
  | 'poke_canada'
  | 'northern_steppe'
  | 'poke_china';

export type ThreatLevelLabel =
  | 'Moderado'
  | 'Alto'
  | 'Muy Alto'
  | 'Crítico'
  | 'Extremo';

export interface BlocCombatLogistics {
  threatLevel: ThreatLevelLabel;
  /** 1..5 tactical threat pips. */
  threatTier: 1 | 2 | 3 | 4 | 5;
  predominantFormat: string;
  levelCapRange: string;
  prepTip: string;
}

export interface WorldBlocDefinition {
  id: WorldBlocId;
  name: string;
  shortName: string;
  factionKind: GeopoliticalFactionKind;
  factionBadge: string;
  /** ISO 3166-1 numeric codes (3-digit zero-padded strings in world-atlas countries-110m). */
  isoNumericIds: string[];
  /** Optional fallback country names for unnumbered territories in countries-110m (e.g. Somaliland, Kosovo, N. Cyprus). */
  fallbackNames?: string[];
  /** Distinct regional/cultural Civilization palette. */
  regionFill: string;
  regionStroke: string;
  /** Unified Imperial vs. Rival Powers lens palette. */
  empireFill: string;
  empireStroke: string;
  /** Geographic focus center [lon, lat] for camera pan/zoom & cluster badge anchor. */
  center: [number, number];
  /** Label anchor [lon, lat] in global view. */
  labelCoords: [number, number];
  /** Optional Atlantic/Pacific callout leader target [lon, lat] to keep Europe & Tohjo crisp. */
  leaderTarget?: [number, number];
  /** Label text-anchor alignment when pulled out via leader line. */
  labelAlign?: 'start' | 'middle' | 'end';
  focusZoom: number;
  statusTag: string;
  loreSummary: string;
  keyResource: string;
  featuredCanonClue: string;
  combatLogistics: BlocCombatLogistics;
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
  /** Optional curved strategic arc from another point on Earth (e.g. Islas Bruma Naval Garrison or Hologram Link). */
  originArcFrom?: [number, number];
  originArcLabel?: string;
}

export interface WorldHistoryAct {
  actNumber: number;
  eraTag: string;
  title: string;
  summary: string;
  keyConsequences: string[];
}

/**
 * 4-Act Geopolitical Cohesion Chronicle:
 * How Galar and the Compañía Real de Ultramar (CRU — dark precursor to Macro Cosmos)
 * rotted the Pokémon world over 200 years, setting up the Golden-Hearted Prince vs. the Elder Bastard Brother.
 */
export const WORLD_HISTORY_ACTS: WorldHistoryAct[] = [
  {
    actNumber: 1,
    eraTag: 'Hace 200 años',
    title: 'Acto I · La Era del Saqueo y la Compañía Real de Ultramar (CRU)',
    summary:
      'Galar industrializa la energía Dinamax antes que nadie y delega el saqueo planetario a la Compañía Real de Ultramar (CRU), mega-corporación con ejército privado y precursora oscura de Macro Cosmos.',
    keyConsequences: [
      'Caída de Tamra: la CRU llegó como comerciante, desmanteló sus reinos y exportó masivamente a sus Copperajah como mano de obra esclava hacia Galar.',
      'Fractura de Kemetia y Kalos: la CRU partió el corredor de Kemetia para saquear fósiles y especies salvajes, mientras humilló a Kalos en guerra y prohibió la Megaevolución.',
    ],
  },
  {
    actNumber: 2,
    eraTag: 'Hace 80 años',
    title: 'Acto II · Las Guerras de Extinción y el Monopolio del Último Ditto',
    summary:
      'Kovaria, Shentai y una joven Teselia intentaron frenar a Galar usando Pokémon como armas de destrucción masiva. El resultado fue un colapso ecológico global que dejó a la fauna al borde de la extinción.',
    keyConsequences: [
      'El Golpe Maestro de la CRU: capturaron al Último Ditto y levantaron el Black Site de Isla Æos para clonar especies con Energía Æos. Tener un Pokémon fuerte pasó de derecho a lujo vendido por la Corona.',
      'Nacimiento de la Confederación Tohjo: al ver caer a Tamra, Kanto, Johto, Hoenn, Sinnoh y Kitakami enterraron sus rivalidades (estilo Restauración Meiji) y cerraron fronteras con ecosistemas de Silph Co. y Devon.',
    ],
  },
  {
    actNumber: 3,
    eraTag: 'Hace 30 años – Actualidad',
    title: 'Acto III · La Era de las Guerras Proxy y el Atlas Oscuro',
    summary:
      'Con el mundo fracturado, Galar dejó de invadir de frente para financiar guerras sucias y dictaduras que mantienen ocupados a sus rivales mientras la CRU vacía las arcas desde Pokétopia.',
    keyConsequences: [
      'Infierno en Vayra e Islas Naranja: para contener a Shentai, Galar convirtió Vayra en un tablero proxy; el colapso dio paso a la dictadura agraria genocida de las Islas Naranja.',
      'Guerra Civil Teselia vs. Aura (Orre): Teselia explotó sin piedad su oeste desértico hasta desatar la rebelión de los Pokémon Oscuros; la Unión Ranger fue declarada ecoterrorista y Alola solo sobrevivió porque los Tapu hundieron la primera flota imperial.',
    ],
  },
  {
    actNumber: 4,
    eraTag: 'El Presente · Campaña Principal',
    title: 'Acto IV · El Niño de Oro frente al Hermano Bastardo',
    summary:
      'Tu padre, el Rey tirano, mantuvo este imperio podrido firmando cartas de corso para la CRU. Al morir, tu hermano bastardo mayor —forjado en el odio desde abajo— dio el golpe con el Consejo, corrompiendo a Zamazenta y despertando a Eternatus Gigamax.',
    keyConsequences: [
      'Arco del Heredero: criado en privilegio pero con corazón de oro, huyes por un planeta que odia tu apellido. Cada región saqueada (Tamra, Kemetia, Mesoa, Vayra, Tohjo, Orre) te obliga a decidir si restauras el Imperio o lo desmantelas.',
      'Clímax y Postgame: tu hermano bastardo (Zamazenta corrompido + Eternatus Gigamax) es el Jefe Final de la historia principal; tras la Corona, solo queda la prueba definitiva del Postgame contra La Campeona de Galar y su Mega-Rayquaza.',
    ],
  },
];

export const FACTION_KIND_META: Record<
  GeopoliticalFactionKind,
  { label: string; dotColor: string; pillClass: string }
> = {
  imperial_core: {
    label: 'Metrópoli · Imperio de Galar & CRU',
    dotColor: '#e11d48',
    pillClass: 'border-rose-400/50 bg-rose-500/20 text-rose-200',
  },
  imperial_colony: {
    label: 'Colonia Saqueada · Imperio de Galar',
    dotColor: '#ea580c',
    pillClass: 'border-amber-400/50 bg-amber-500/20 text-amber-200',
  },
  contested: {
    label: 'Zona Proxy · Insurgencia',
    dotColor: '#84cc16',
    pillClass: 'border-lime-400/50 bg-lime-500/20 text-lime-200',
  },
  independent: {
    label: 'Bloque Independiente',
    dotColor: '#06b6d4',
    pillClass: 'border-cyan-400/50 bg-cyan-500/20 text-cyan-200',
  },
  rival_empire: {
    label: 'Potencia Militar Rival',
    dotColor: '#0d9488',
    pillClass: 'border-teal-400/50 bg-teal-500/20 text-teal-200',
  },
  isolationist: {
    label: 'Confederación Cerrada · Tohjo',
    dotColor: '#8b5cf6',
    pillClass: 'border-violet-400/50 bg-violet-500/20 text-violet-200',
  },
  mystery: {
    label: 'Selva Indomable · Secreto de Mew',
    dotColor: '#059669',
    pillClass: 'border-emerald-400/50 bg-emerald-500/20 text-emerald-200',
  },
};

export const WORLD_BLOCS: WorldBlocDefinition[] = [
  /* ===================== ACTIVE PLAYABLE EXILE BLOCS (12) ===================== */
  {
    id: 'galar_empire',
    name: 'Imperio de Galar (Metrópoli + Islas Bruma)',
    shortName: 'GALAR',
    factionKind: 'imperial_core',
    factionBadge: 'Metrópoli Imperial · CRU & Monopolio Ditto',
    isoNumericIds: ['826', '372', '238'], // UK, Ireland, Islas Bruma (Falklands naval garrison)
    regionFill: '#e11d48',
    regionStroke: '#fbbf24',
    empireFill: '#e11d48',
    empireStroke: '#fde047',
    center: [-1.4, 52.2],
    labelCoords: [-17.5, 61.5],
    leaderTarget: [-3.0, 54.5],
    labelAlign: 'end',
    focusZoom: 6.2,
    statusTag: 'Prólogo, Golpe del Hermano Bastardo y Endgame (4 misiones)',
    loreSummary:
      'La joya podrida: mientras Wyndon brilla con oro y estadios Gigamax, la Compañía Real de Ultramar (CRU) factura el saqueo al resto del planeta. Tras la muerte del Rey tirano, tu hermano bastardo tomó el trono con el Consejo, Zamazenta corrompido y Eternatus Gigamax. Mantiene además la base naval de las Islas Bruma frente a Cordelia.',
    keyResource: 'Patentes del Último Ditto (CRU), Estrellas Deseo y Flota Naval',
    featuredCanonClue: 'Wyndon · Sede de la CRU · Guarnición Naval de las Islas Bruma',
    combatLogistics: {
      threatLevel: 'Alto',
      threatTier: 4,
      predominantFormat: 'Dobles 6v6 · 1 vs 6 · Sin Reglas · Little Cup',
      levelCapRange: 'Nv. 5 – 100 (Ases hasta Nv. 118)',
      prepTip: 'Sobrevive al golpe en Wyndon y ajusta tus slots antes de cruzar el canal.',
    },
  },
  {
    id: 'kalos',
    name: 'Kalos (Protectorado Humillado)',
    shortName: 'KALOS',
    factionKind: 'contested',
    factionBadge: 'Estado Vasallo · Megaevolución Prohibida',
    isoNumericIds: ['250', '056', '442', '528', '756'],
    regionFill: '#84cc16',
    regionStroke: '#d9f99d',
    empireFill: '#eab308',
    empireStroke: '#fef08a',
    center: [1.6, 47.6],
    labelCoords: [-16.0, 49.0],
    leaderTarget: [1.5, 47.2],
    labelAlign: 'end',
    focusZoom: 5.2,
    statusTag: 'Primera Escala del Exilio',
    loreSummary:
      'Reducida a estado vasallo tras una guerra brutal hace un siglo. La CRU prohibió la investigación libre de la Megaevolución por considerarla una amenaza militar a la supremacía Gigamax y confisca Megapiedras mientras sus nobles colaboran por migajas y el pueblo hierve en insurgencia.',
    keyResource: 'Megapiedras clandestinas y corredores ferroviarios europeos',
    featuredCanonClue: 'Frontera del Canal · Resistencia de Luminalia',
    combatLogistics: {
      threatLevel: 'Alto',
      threatTier: 3,
      predominantFormat: 'Monotype 6v6 (Acero vs. Siniestro)',
      levelCapRange: 'Nv. 100 (Reglas Oficiales Monotype)',
      prepTip: 'Cuida tu orden de salida en Team Preview para cortar trampas de entrada.',
    },
  },
  {
    id: 'paldea',
    name: 'Paldea (Frontera Aislada · Área Cero)',
    shortName: 'PALDEA',
    factionKind: 'independent',
    factionBadge: 'Estado Paranoico · Teracristalización',
    isoNumericIds: ['724', '620'],
    regionFill: '#ec4899',
    regionStroke: '#fbcfe8',
    empireFill: '#ec4899',
    empireStroke: '#fbcfe8',
    center: [-3.5, 40.8],
    labelCoords: [-17.5, 38.0],
    leaderTarget: [-5.5, 40.2],
    labelAlign: 'end',
    focusZoom: 5.2,
    statusTag: 'Salida hacia el Atlántico',
    loreSummary:
      'Sobrevivió a la anexión imperial gracias a su geografía montañosa y al terror que le tiene la CRU a las anomalías del Área Cero. Es un estado paranoico y militarizado que vende paso seguro hacia el océano a precios absurdos mientras se pudre por dentro en burocracia.',
    keyResource: 'Cristales del Área Cero y puertos atlánticos de peaje',
    featuredCanonClue: 'Paso de la Cordillera · Gran Cráter de Paldea',
    combatLogistics: {
      threatLevel: 'Alto',
      threatTier: 4,
      predominantFormat: 'Triples 6v6 Clásico (Gen 6 · Megaevoluciones)',
      levelCapRange: 'Nv. 100 (Posicionamiento de 3 Flancos)',
      prepTip: 'Aprovecha Wide Guard y ataques de alcance cruzado desde los extremos.',
    },
  },
  {
    id: 'aztlan_caribe',
    name: 'Mesoa (Confederación de Mercados Negros)',
    shortName: 'MESOA',
    factionKind: 'independent',
    factionBadge: 'Cárteles de Crianza · Puertos Sin Ley',
    isoNumericIds: [
      '484', '320', '084', '222', '340', '558', '188', '591',
      '170', '862', '192', '332', '214', '388', '630', '044', '780',
    ],
    regionFill: '#06b6d4',
    regionStroke: '#67e8f9',
    empireFill: '#0891b2',
    empireStroke: '#67e8f9',
    center: [-84.0, 16.5],
    labelCoords: [-93.0, 14.0],
    focusZoom: 3.1,
    statusTag: 'Refugio Clandestino · Primer Golpe de Realidad',
    loreSummary:
      'Confederación fracturada donde la CRU destruyó las economías locales hace décadas; hoy la controlan cárteles de crianza clandestina que operan fuera del registro de Wyndon. Primer golpe de realidad para el heredero: gente brutal haciendo cosas terribles solo para sobrevivir al bloqueo imperial.',
    keyResource: 'Poké Balls pirateadas sin sello imperial y crianza clandestina',
    featuredCanonClue: 'Foso Portuario de Mesoa · Red de La Jefa del Mercado Negro',
    combatLogistics: {
      threatLevel: 'Muy Alto',
      threatTier: 4,
      predominantFormat: 'Singles 6v6 · Gimmick Rencor (Frustration 102 BP)',
      levelCapRange: 'Nv. 100 (Combates Clandestinos Sin Piedad)',
      prepTip: 'Sus Pokémon golpean a potencia máxima por rencor; controla desgaste e intimidación.',
    },
  },
  {
    id: 'andes_plata',
    name: 'Cordelia (El Cono Austral)',
    shortName: 'CORDELIA',
    factionKind: 'independent',
    factionBadge: 'Tierras Altas & Pampas · Frente a Islas Bruma',
    isoNumericIds: ['604', '152', '032', '068', '218', '600', '858'],
    regionFill: '#3b82f6',
    regionStroke: '#93c5fd',
    empireFill: '#2563eb',
    empireStroke: '#93c5fd',
    center: [-68.0, -34.0],
    labelCoords: [-72.0, -32.0],
    focusZoom: 2.8,
    statusTag: 'Guerra Fría frente a Islas Bruma',
    loreSummary:
      'Naciones orgullosas y curtidas de la cordillera austral y las pampas heladas que llevan generaciones en guerra fría contra la base naval de Galar en las Islas Bruma. Hogar de observatorios remotos y estrategias de resistencia extrema.',
    keyResource: 'Estrecho Austral, observatorios de altura y fortalezas de piedra',
    featuredCanonClue: 'Estrecho Austral · Base Naval de las Islas Bruma · El Astrónomo',
    combatLogistics: {
      threatLevel: 'Muy Alto',
      threatTier: 4,
      predominantFormat: 'Desafío 1 vs 3 · Triples Gen 6 (Guarnición de Élite)',
      levelCapRange: 'Nv. 100 (Un solo As contra la Tríada)',
      prepTip: 'Lee el compás de Wide Guard enemigo en turnos impares antes de lanzar ataques de área.',
    },
  },
  {
    id: 'poke_africa',
    name: 'Kemetia (Corredor Imperial del Rift)',
    shortName: 'KEMETIA',
    factionKind: 'imperial_colony',
    factionBadge: 'Corredor Saqueado · CRU & Reservas Cercadas',
    isoNumericIds: [
      '818', '729', '728', '404', '800', '834', '566', '288', '694',
      '270', '894', '716', '072', '710', '516', '706', '454', '426', '748',
    ],
    fallbackNames: ['Somaliland'],
    regionFill: '#ea580c',
    regionStroke: '#fbbf24',
    empireFill: '#be123c',
    empireStroke: '#fbbf24',
    center: [31.0, -2.5],
    labelCoords: [28.0, -7.0],
    focusZoom: 2.6,
    statusTag: 'Jefe Raid Activo · Santuario del Rift',
    loreSummary:
      'La herida más grande del Imperio: el corredor que la CRU partió en dos para saquear fósiles, piedras evolutivas y las últimas especies salvajes sin clonar (Pyroar, Hippowdon, Farigiraf, Cofagrigus). Aquí el príncipe ve de frente las reservas cercadas y los pueblos desplazados por el apellido de su padre.',
    keyResource: 'Reservas naturales sin clonar, fósiles antiguos y piedras evolutivas',
    featuredCanonClue: 'Santuario del Gran Valle del Rift (Regigigas) · Culturas del Vínculo',
    combatLogistics: {
      threatLevel: 'Extremo',
      threatTier: 5,
      predominantFormat: 'Puzzle Jefe Raid 6v6 Dobles (Regigigas Despertado)',
      levelCapRange: 'Nv. 55 vs. Jefe Nv. 85 (Sin Slow Start)',
      prepTip: 'Imprescindible cortar curación (Psychic Noise), limpiar boosts (Haze) y romper pantallas.',
    },
  },
  {
    id: 'sand_crescent',
    name: 'Miraj (Cártel del Canal de Arena)',
    shortName: 'MIRAJ',
    factionKind: 'contested',
    factionBadge: 'Cártel Energético · Aduanas del Desierto',
    isoNumericIds: [
      '504', '732', '012', '788', '434', '792', '196', '760', '422',
      '376', '275', '400', '368', '364', '004', '682', '887', '512',
      '784', '634', '414',
    ],
    fallbackNames: ['N. Cyprus'],
    regionFill: '#ca8a04',
    regionStroke: '#fef08a',
    empireFill: '#a16207',
    empireStroke: '#fde047',
    center: [34.0, 29.0],
    labelCoords: [42.0, 27.5],
    focusZoom: 3.3,
    statusTag: 'Peaje Obligado hacia Oriente',
    loreSummary:
      'No es colonia directa de Galar, sino un cártel energético y marítimo que controla el Canal de Arena. Cobra peajes brutales tanto a la CRU como a sus enemigos, enriqueciendo a sus jeques mientras sus aduanas a 48°C son un infierno para cualquier fugitivo.',
    keyResource: 'Control del Canal de Arena, combustible y peajes marítimos',
    featuredCanonClue: 'Estación Solar de Miraj (Calor 48°C vs. Cabina A/C)',
    combatLogistics: {
      threatLevel: 'Muy Alto',
      threatTier: 4,
      predominantFormat: 'Puzzle Táctico 3v3 Dobles bajo Sol Intenso',
      levelCapRange: 'Nv. 100 (Desventaja Inicial + Boosts Rivales)',
      prepTip: 'No intentes ganar a fuerza bruta: invierte los boosts rivales y explota el patrón T1/T2.',
    },
  },
  {
    id: 'poke_india',
    name: 'Tamra (Tierra Saqueada de Copperajah)',
    shortName: 'TAMRA',
    factionKind: 'imperial_colony',
    factionBadge: 'Joya Explotada · Saqueo de la CRU',
    isoNumericIds: ['356', '586', '050', '144', '104', '524', '064'],
    regionFill: '#d97706',
    regionStroke: '#fbbf24',
    empireFill: '#be123c',
    empireStroke: '#fbbf24',
    center: [78.5, 21.5],
    labelCoords: [78.5, 22.0],
    focusZoom: 3.3,
    statusTag: 'Domo de los 8 Elementos Activo',
    loreSummary:
      'Del sánscrito tāmra (cobre). La CRU llegó hace 200 años como «comerciante», desmanteló sus reinos, saqueó sus riquezas y exportó masivamente a sus Copperajah como mano de obra esclava hacia Galar. Hoy es una tierra explotada al límite con hambrunas y domos climáticos coloniales.',
    keyResource: 'Linajes ancestrales de Copperajah, cobre y estaciones de monzón',
    featuredCanonClue: 'Domo Climático de Tamra (4 Climas + 4 Terrenos)',
    combatLogistics: {
      threatLevel: 'Alto',
      threatTier: 4,
      predominantFormat: 'Desafío 4v4 Dobles · 4 Climas y 4 Terrenos',
      levelCapRange: 'Nv. 96 – 100 (As Castform ★ Nv. 105)',
      prepTip: 'Cada modo activa un clima o terreno en Turno 0; usa el clima a tu favor o rómpelo.',
    },
  },
  {
    id: 'monsoon_archipelago',
    name: 'Vayra (Archipiélago del Monzón)',
    shortName: 'VAYRA',
    factionKind: 'contested',
    factionBadge: 'Guerras Proxy · Duelistas 1v1',
    isoNumericIds: ['704', '764', '418', '116', '458', '096', '360', '626', '608'],
    regionFill: '#f97316',
    regionStroke: '#fed7aa',
    empireFill: '#ea580c',
    empireStroke: '#fed7aa',
    center: [110.0, 9.0],
    labelCoords: [113.5, 5.5],
    focusZoom: 3.2,
    statusTag: 'Tierra Insumisa · Duelo 1v1',
    loreSummary:
      'De Vayu (viento/monzón). Para frenar la influencia de Shentai, Galar convirtió a Vayra en un tablero de guerras proxy. Sus selvas indomables quebraron toda invasión, pero el colapso dio pie a la dictadura genocida vecina de las Islas Naranja. Hogar de los implacables duelistas 1v1.',
    keyResource: 'Rutas clandestinas del Índico-Pacífico, bayas de guerrilla y doctrina 1v1',
    featuredCanonClue: 'Costa Rebelde de Vayra (Duelo a Muerte 1v1 · La Duelista)',
    combatLogistics: {
      threatLevel: 'Muy Alto',
      threatTier: 4,
      predominantFormat: 'Showcase 1v1 Oficial (Bring 3, Pick 1 · Sin Relevos)',
      levelCapRange: 'Nv. 100 (Muerte Súbita)',
      prepTip: 'Lee la pista corporal de la Duelista antes del Team Preview: un mal cruce cuesta el duelo.',
    },
  },
  {
    id: 'poke_australia',
    name: 'Tarran (Continente-Prisión del Sur)',
    shortName: 'TARRAN',
    factionKind: 'imperial_colony',
    factionBadge: 'Colonia Penal de Galar · Desertores',
    isoNumericIds: ['036', '554', '598', '242', '090', '548', '540', '260'],
    regionFill: '#c2410c',
    regionStroke: '#fbbf24',
    empireFill: '#be123c',
    empireStroke: '#fbbf24',
    center: [133.0, -25.5],
    labelCoords: [134.5, -24.5],
    focusZoom: 2.9,
    statusTag: 'Supervivencia Back-to-Back Activa',
    loreSummary:
      'De Terra Australis. El continente-prisión adonde la Corona y la CRU deportan a disidentes políticos, entrenadores rebeldes y desertores a picar piedra en galerías profundas rodeadas de polvo rojo, Kangaskhan salvajes y cazarrecompensas.',
    keyResource: 'Minas profundas de piedras evolutivas y clanes desertores',
    featuredCanonClue: 'Galerías de Tarran (Nivel Profundo 4 · 2 Oleadas Sin Curación)',
    combatLogistics: {
      threatLevel: 'Muy Alto',
      threatTier: 4,
      predominantFormat: 'Supervivencia 2 Oleadas Back-to-Back (Sin Curación)',
      levelCapRange: 'Nv. 95 – 100 (Persistencia Real de PS/PP/Estados)',
      prepTip: 'Cuida a Dragapult (inmune a Explosion) y ahorra PS en la Oleada 1 para el Capitán.',
    },
  },
  {
    id: 'poke_japan',
    name: 'Confederación Tohjo (Archipiélago Cerrado)',
    shortName: 'TOHJO',
    factionKind: 'isolationist',
    factionBadge: 'Unión Defensiva · Estilo Meiji',
    isoNumericIds: ['392'],
    regionFill: '#8b5cf6',
    regionStroke: '#ddd6fe',
    empireFill: '#7c3aed',
    empireStroke: '#c4b5fd',
    center: [140.5, 39.2],
    labelCoords: [153.5, 39.5],
    leaderTarget: [140.5, 38.0],
    labelAlign: 'start',
    focusZoom: 4.8,
    statusTag: '2 Archivos Legendarios · Kanto & Sinnoh',
    loreSummary:
      'Al ver cómo Tamra fue devorada por la CRU y el mundo se quedaba sin fauna, Kanto, Johto, Hoenn, Sinnoh y Kitakami enterraron sus rivalidades y se unificaron bajo el nombre de las Cataratas Tohjo. Cerraron fronteras y usan la tecnología de Silph Co. y Devon para sostener ecosistemas independientes del Monopolio Ditto.',
    keyResource: 'Ecosistemas autosuficientes, tecnología Silph/Devon y ligas soberanas',
    featuredCanonClue: 'Kanto (Silph Co. Gen 1) · Sinnoh (Valle Lirio) · Johto · Hoenn · Kitakami',
    combatLogistics: {
      threatLevel: 'Extremo',
      threatTier: 5,
      predominantFormat: 'Gen 1 Clásico (Sin Objetos) & 6v6 Liga Anime',
      levelCapRange: 'Nv. 60 – 100 (Mewtwo / Darkrai / Giratina)',
      prepTip: 'En Gen 1 manda el estado (parálisis/sueño); en Sinnoh, pasa el Omniboost con Baton Pass.',
    },
  },
  {
    id: 'alola',
    name: 'Alola (Santuario Neutral · Los Tapu)',
    shortName: 'ALOLA',
    factionKind: 'independent',
    factionBadge: 'Archipiélago Soberano del Pacífico',
    isoNumericIds: [],
    regionFill: '#f59e0b',
    regionStroke: '#fef08a',
    empireFill: '#f59e0b',
    empireStroke: '#fef08a',
    center: [-157.85, 21.31],
    labelCoords: [-156.5, 27.5],
    focusZoom: 4.8,
    statusTag: 'Sede del Archivo Mundial VGC',
    loreSummary:
      'Sobrevive como santuario neutral en medio del Pacífico por una sola razón: sus Espíritus Guardianes (los Tapu) hundieron la primera flota de la CRU que intentó anexar las islas. Sede neutral de la histórica Final Mundial VGC 2024.',
    keyResource: 'Protección ancestral de los Tapu y sede neutral de torneos',
    featuredCanonClue: 'Honolulu / Melemele (Final Mundial VGC 2024 · Luca vs. Yuta)',
    combatLogistics: {
      threatLevel: 'Crítico',
      threatTier: 5,
      predominantFormat: 'VGC Reg G Oficial · Dobles 4v4 · Open Teamsheet',
      levelCapRange: 'Nv. 50 Fijo (Miraidon vs. Calyrex-Ice)',
      prepTip: 'Revisa el Open Teamsheet en Team Preview; el control de velocidad define cada turno.',
    },
  },

  /* ===================== FUTURE EXILE FRONTIERS (6 — FULL GLOBE COVERAGE!) ===================== */
  {
    id: 'amazonia_veracruz',
    name: 'Selva de Veridia (El Secreto de Mew)',
    shortName: 'VERIDIA',
    factionKind: 'mystery',
    factionBadge: 'Pulmón Indomable · Amenaza al Monopolio Ditto',
    isoNumericIds: ['076', '328', '740'],
    regionFill: '#059669',
    regionStroke: '#34d399',
    empireFill: '#059669',
    empireStroke: '#34d399',
    center: [-53.0, -9.0],
    labelCoords: [-52.0, -10.5],
    focusZoom: 2.7,
    statusTag: 'Selva Viva · Arco de Iara de Veridia (3 Caps)',
    loreSummary:
      'El pulmón indomable del sur: la CRU intentó talar y colonizar Veridia tres veces y las tres veces la selva se tragó enteras sus expediciones. En su corazón sobrevive el rumor más peligroso para Galar: la existencia de Mew, capaz de destruir para siempre el monopolio genético del Último Ditto.',
    keyResource: 'El mito viviente de Mew y biodiversidad selvática inviolada',
    featuredCanonClue: 'Corazón de Veridia (Diarios Antiguos de Mew)',
    combatLogistics: {
      threatLevel: 'Extremo',
      threatTier: 5,
      predominantFormat: 'Expedición Clandestina · Jefe Mítico (Próximamente)',
      levelCapRange: 'Estimado Nv. 90 – 100 (Mew & Guardianes)',
      prepTip: 'Reserva tu mejor equipo optimizado para el clímax de la campaña de exilio.',
    },
  },
  {
    id: 'unova',
    name: 'Teselia / Unova (República Capitalista)',
    shortName: 'TESELIA',
    factionKind: 'independent',
    factionBadge: 'Potencia Independiente · Guerra Civil vs. Aura',
    isoNumericIds: ['840'],
    regionFill: '#10b981',
    regionStroke: '#6ee7b7',
    empireFill: '#10b981',
    empireStroke: '#6ee7b7',
    center: [-95.0, 39.0],
    labelCoords: [-98.0, 39.5],
    focusZoom: 2.8,
    statusTag: 'Guerra Civil vs. Aura · Arco de El Pelirrojo (3 Caps)',
    loreSummary:
      'El «Piltover» del planeta: potencia industrial independiente anclada en la Costa Este y la Academia Arándano que se negó a comprar licencias a la CRU. Sin embargo, para competir con Galar explotó sin piedad a su oeste desértico, Aura (Orre), desatando una brutal guerra civil con Pokémon Oscuros.',
    keyResource: 'Biodomos artificiales (Academia Arándano) y circuito profesional libre',
    featuredCanonClue: 'Costa Este (Teselia) · Frente Oeste contra Aura (Orre)',
    combatLogistics: {
      threatLevel: 'Alto',
      threatTier: 4,
      predominantFormat: 'Dobles de Liga & Biodomo (Próximamente)',
      levelCapRange: 'Estimado Nv. 75 – 90',
      prepTip: 'Prepárate para equipos balanceados estilo torneo y estrategias de terreno.',
    },
  },
  {
    id: 'poke_canada',
    name: 'Borelia (Dominio Helado de la Corona)',
    shortName: 'BORELIA',
    factionKind: 'imperial_colony',
    factionBadge: 'Dominio Virreinal · Cerco al Norte de Teselia',
    isoNumericIds: ['124', '304'],
    regionFill: '#be123c',
    regionStroke: '#fbbf24',
    empireFill: '#be123c',
    empireStroke: '#fbbf24',
    center: [-96.0, 57.5],
    labelCoords: [-102.0, 59.0],
    focusZoom: 2.4,
    statusTag: 'Fuerte Helado CRU · Operación Borelia (Tag 2v2)',
    loreSummary:
      'Territorio helado al norte de Teselia bajo control directo de virreyes leales a Galar y a la CRU. Sostiene un cerco militar y aduanero permanente sobre las rutas árticas y la frontera norte teseliana.',
    keyResource: 'Rutas boreales, reservas de Hielo y acuartelamientos virreinales',
    featuredCanonClue: 'Frontera Helada al Norte de Teselia',
    combatLogistics: {
      threatLevel: 'Moderado',
      threatTier: 3,
      predominantFormat: 'Clima Nieve & Guarniciones Virreinales (Próximamente)',
      levelCapRange: 'Estimado Nv. 65 – 80',
      prepTip: 'Lleva rompe-pantallas contra Velo Aurora y defensas físicas de Hielo.',
    },
  },
  {
    id: 'northern_steppe',
    name: 'Kovaria (Bloque Blindado del Norte)',
    shortName: 'KOVARIA',
    factionKind: 'rival_empire',
    factionBadge: 'Potencia Militarizada · Acero y Hielo',
    isoNumericIds: [
      '276', '616', '380', '040', '203', '703', '348', '642', '100',
      '300', '191', '705', '070', '688', '499', '807', '008', '498',
      '804', '112', '440', '428', '233', '208', '578', '752', '246',
      '352', '643', '398', '860', '795', '417', '762', '268', '051', '031',
    ],
    fallbackNames: ['Kosovo'],
    regionFill: '#475569',
    regionStroke: '#94a3b8',
    empireFill: '#334155',
    empireStroke: '#94a3b8',
    center: [62.0, 57.0],
    labelCoords: [65.0, 61.5],
    focusZoom: 2.1,
    statusTag: 'Enclave Ferrum · Arco de General Viktoria (3 Caps)',
    loreSummary:
      'Potencia industrial, fría y blindada que luchó en las Guerras de Extinción y hoy contiene por tierra cualquier ambición continental de Galar y la CRU. Sus doctrinas de Acero, Hielo y los enclaves de Ferrum no toleran debilidades.',
    keyResource: 'Industria pesada de Acero/Hielo, Ferrum y ferrocarriles blindados',
    featuredCanonClue: 'Frontera Este de Kalos · Complejo Militar de Ferrum',
    combatLogistics: {
      threatLevel: 'Muy Alto',
      threatTier: 4,
      predominantFormat: 'Guerra de Desgaste · Acero, Hielo y Hazards (Próximamente)',
      levelCapRange: 'Estimado Nv. 80 – 95',
      prepTip: 'Trae control de Trampa Rocas y cobertura Fuego/Lucha para atravesar blindajes.',
    },
  },
  {
    id: 'free_savanna',
    name: 'Tierra de Kora (Reinos Libres)',
    shortName: 'KORA',
    factionKind: 'independent',
    factionBadge: 'Reinos Libres · Resistencia Anticolonial',
    isoNumericIds: [
      '478', '686', '466', '854', '562', '148', '324', '624', '430',
      '384', '768', '204', '120', '140', '226', '266', '178', '180',
      '024', '108', '646', '231', '232', '262', '508', '450',
    ],
    regionFill: '#a16207',
    regionStroke: '#fde68a',
    empireFill: '#78350f',
    empireStroke: '#fcd34d',
    center: [12.0, 7.0],
    labelCoords: [8.0, 12.0],
    focusZoom: 2.5,
    statusTag: 'Frontera Libre · Defensa de Kora con Amina (Tag 2v2)',
    loreSummary:
      'Los reinos libres que lograron frenar el avance de la CRU en el oeste y centro continental. Desconfían a muerte de cualquier acento de Wyndon; ganarse su respeto siendo un niño de la realeza de Galar será una de las pruebas más duras del exilio.',
    keyResource: 'Santuarios indómitos y alianzas libres contra la CRU',
    featuredCanonClue: 'Rutas Libres de Kora frente al Corredor de Kemetia',
    combatLogistics: {
      threatLevel: 'Alto',
      threatTier: 3,
      predominantFormat: 'Combates Territoriales & Vínculo Puro (Próximamente)',
      levelCapRange: 'Estimado Nv. 70 – 85',
      prepTip: 'Sus entrenadores pelean con sinergias salvajes de terreno y velocidad natural.',
    },
  },
  {
    id: 'poke_china',
    name: 'Shentai (Imperio Milenario · Cuatro Ruinas)',
    shortName: 'SHENTAI',
    factionKind: 'rival_empire',
    factionBadge: 'Coloso Rival · Jamás Conquistado',
    isoNumericIds: ['156', '496', '410', '408', '158'],
    regionFill: '#0d9488',
    regionStroke: '#5eead4',
    empireFill: '#0f766e',
    empireStroke: '#5eead4',
    center: [105.0, 35.5],
    labelCoords: [104.0, 36.5],
    focusZoom: 2.75,
    statusTag: 'Reino de Ransei · Arco de Lady Nobuna (3 Caps)',
    loreSummary:
      'Coloso elegante y milenario que jamás cayó ante Galar ni la CRU. Tierra lejana al este de Paldea de donde provienen las Cuatro Ruinas (Chien-Pao, Chi-Yu, Ting-Lu, Wo-Chien), las montañas marciales de Kubfu/Urshifu y el reino ermitaño de Ransei.',
    keyResource: 'Artes marciales antiguas y sellos de las Cuatro Ruinas',
    featuredCanonClue: 'Tierras de las Cuatro Ruinas · Montañas Urshifu · Ransei',
    combatLogistics: {
      threatLevel: 'Crítico',
      threatTier: 5,
      predominantFormat: 'Artes Marciales 1v1 & Dobles Cuatro Ruinas (Próximamente)',
      levelCapRange: 'Estimado Nv. 85 – 100 (Urshifu / Cuatro Ruinas)',
      prepTip: 'Los sellos de las Ruinas alteran estadísticas globales; planifica contra debuffs pasivos.',
    },
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
export const NAME_TO_BLOC: Record<string, WorldBlocDefinition> = {};
for (const bloc of WORLD_BLOCS) {
  for (const iso of bloc.isoNumericIds) {
    ISO_TO_BLOC[iso] = bloc;
  }
  if (bloc.fallbackNames) {
    for (const nm of bloc.fallbackNames) {
      NAME_TO_BLOC[nm.toLowerCase()] = bloc;
    }
  }
}

/**
 * Global Exile & Circumnavigation Campaign Route (Indiana Jones flight-path arcs).
 * Leaves Galar immediately after the docks ambush and sweeps across ALL continents!
 */
export const CAMPAIGN_ROUTE_ORDER: string[] = [
  // Acto I: La Fuga
  'ch1-wyndon-chase',
  'ch2-monotype-banners',
  'showcase-triples-phalanx',
  // Acto II: El Exilio
  'ch3-clandestine-tamer',
  'ch4-orre-shadow-ambush',
  'challenge-three-knights',
  // Acto III: La Herida Imperial
  'puzzle-02-regigigas',
  'ch8-tamra-cru-viceroy',
  'ch9-aeos-ditto-blacksite',
  // Acto IV: El Regreso
  'ch10-tohjo-shentai-trial',
  'ch11-poketopia-traitor-council',
  // Clímax: La Corona & Postgame Opcional
  'ch12-bastard-brother-climax',
  'ch13-postgame-champion',
];

/**
 * Global narrative coordinates for all 16 playable chapters:
 * Only 4 remain in Galar (Prologue, Flashback, Banquet, Docks escape);
 * 12 are distributed across Kalos, Paldea, Mesoa, Cordelia, Kemetia, Miraj, Tamra, Vayra, Tarran, Confederación Tohjo & Alola!
 */
export const CHAPTER_MAP_LOCATIONS: Record<string, ChapterMapLocation> = {
  /* ---- GALAR (4: Prólogo, Recuerdo, Banquete y Fuga por el Puerto) ---- */
  'ch1-wyndon-chase': {
    chapterId: 'ch1-wyndon-chase',
    blocId: 'galar_empire',
    locationName: 'Callejones de Wyndon · Torre del Reloj',
    regionLabel: 'Galar · Metrópoli (Huida Inicial)',
    theaterNote: 'Emboscada nocturna bajo la lluvia tras el golpe de tu hermano bastardo y el Consejo.',
    coords: [-0.25, 51.55],
    zoom: 7.4,
  },
  'ch2-banquet-ambush': {
    chapterId: 'ch2-banquet-ambush',
    blocId: 'galar_empire',
    locationName: 'Palacio Real de Wyndon · Salón de Cristal',
    regionLabel: 'Galar · Ciudadela Real',
    theaterNote: 'Apagón en plena cena de Estado de la CRU con sabotaje sin reglas.',
    coords: [-0.15, 52.15],
    zoom: 7.2,
  },
  'flashback-lc-champion': {
    chapterId: 'flashback-lc-champion',
    blocId: 'galar_empire',
    locationName: 'Jardines del Palacio Real (Hace 10 años)',
    regionLabel: 'Galar · Recuerdo de Infancia',
    theaterNote: 'Primera lección con crías frente a la Campeona antes del colapso.',
    coords: [-1.45, 52.45],
    zoom: 7.0,
  },
  'challenge-last-bastion': {
    chapterId: 'challenge-last-bastion',
    blocId: 'galar_empire',
    locationName: 'Muelles de Wyndon · Embarcadero de Fuga',
    regionLabel: 'Galar · Salida al Exilio',
    theaterNote: 'Sostienes el puente de carga 1 contra 6 para abordar el barco hacia Kalos.',
    coords: [0.65, 51.35],
    zoom: 7.4,
  },

  /* ---- EUROPA CONTINENTAL (Kalos & Paldea) ---- */
  'ch2-monotype-banners': {
    chapterId: 'ch2-monotype-banners',
    blocId: 'kalos',
    locationName: 'Protectorado de Kalos · Llanura del Canal',
    regionLabel: 'Kalos · Protectorado Humillado',
    theaterNote: 'Nada más cruzar el canal, la Casa Rebelde invoca el decreto de estandartes.',
    coords: [0.85, 49.15],
    zoom: 5.8,
  },
  'showcase-triples-phalanx': {
    chapterId: 'showcase-triples-phalanx',
    blocId: 'paldea',
    locationName: 'Paso de la Cordillera · Frontera Kalos–Paldea',
    regionLabel: 'Paldea · Frontera Aislada',
    theaterNote: 'La Falange del Duque bloquea el paso hacia los puertos del Atlántico en Triples.',
    coords: [-2.4, 42.3],
    zoom: 5.6,
  },

  /* ---- LAS AMÉRICAS (Mesoa & Cordelia frente a Islas Bruma) ---- */
  'ch3-clandestine-tamer': {
    chapterId: 'ch3-clandestine-tamer',
    blocId: 'aztlan_caribe',
    locationName: 'Foso Portuario Clandestino · Costa de Mesoa',
    regionLabel: 'Mesoa · Mercado Negro',
    theaterNote: 'Fugitivo al otro lado del océano, entras en el cuadrilátero ilegal de Lord Vexen.',
    coords: [-75.55, 10.42],
    zoom: 4.2,
  },
  'challenge-three-knights': {
    chapterId: 'challenge-three-knights',
    blocId: 'andes_plata',
    locationName: 'Estrecho Austral · Costa de Cordelia',
    regionLabel: 'Cordelia · Cono Austral',
    theaterNote: 'Tres caballeros despachados desde la base naval de Galar en las Islas Bruma cierran tu paso.',
    coords: [-67.6, -50.2],
    zoom: 4.4,
    originArcFrom: [-59.0, -51.75],
    originArcLabel: 'Despliegue desde Base Naval Islas Bruma (Galar)',
  },

  /* ---- KEMETIA & MIRAJ ---- */
  'puzzle-02-regigigas': {
    chapterId: 'puzzle-02-regigigas',
    blocId: 'poke_africa',
    locationName: 'Santuario Rúnico del Gran Valle del Rift',
    regionLabel: 'Kemetia · Corredor Imperial',
    theaterNote: 'El Guardián no humano gira la llave que despierta al Coloso en una cámara anterior a la CRU.',
    coords: [35.4, -1.6],
    zoom: 4.2,
  },
  'puzzle-01-sun-trap': {
    chapterId: 'puzzle-01-sun-trap',
    blocId: 'sand_crescent',
    locationName: 'Estación Solar del Canal · Aduana de Miraj',
    regionLabel: 'Miraj · Canal de Arena',
    theaterNote: '48°C afuera sobre la arena mientras el niño de OU manda macros desde su cabina con A/C.',
    coords: [32.55, 29.95],
    zoom: 4.8,
  },

  /* ---- TAMRA, VAYRA & TARRAN ---- */
  'challenge-weather-terrains': {
    chapterId: 'challenge-weather-terrains',
    blocId: 'poke_india',
    locationName: 'Domo Climático de los Monzones · Tamra',
    regionLabel: 'Tamra · Tierra Saqueada por la CRU',
    theaterNote: 'El Estratega Solar secuestró el laboratorio climático colonial de Tamra para presumir a Castform ★.',
    coords: [77.2, 20.4],
    zoom: 4.2,
  },
  'duel-01-honor-1v1': {
    chapterId: 'duel-01-honor-1v1',
    blocId: 'monsoon_archipelago',
    locationName: 'Círculo de Piedra · Costa Rebelde de Vayra',
    regionLabel: 'Vayra · Guerras Proxy',
    theaterNote: 'La Duelista de Vayra exige cobrar en un duelo 1v1 a muerte décadas de saqueo imperial.',
    coords: [108.1, 15.9],
    zoom: 4.4,
    originArcFrom: [78.5, 21.5],
    originArcLabel: 'Eco de las Tierras Saqueadas (Tamra → Vayra)',
  },
  'survival-galar-mines': {
    chapterId: 'survival-galar-mines',
    blocId: 'poke_australia',
    locationName: 'Galerías de Tarran · Nivel Profundo 4',
    regionLabel: 'Tarran · Continente-Prisión',
    theaterNote: 'Fuga subterránea en dos oleadas sin curación frente a zapadores desertores y la guardia corrupta.',
    coords: [121.48, -30.75],
    zoom: 4.2,
  },

  /* ---- CONFEDERACIÓN TOHJO & ALOLA ---- */
  'archive-gen1-silph': {
    chapterId: 'archive-gen1-silph',
    blocId: 'poke_japan',
    locationName: 'Bóveda de Silph Co. · Ciudad Azafrán',
    regionLabel: 'Kanto · Confederación Tohjo',
    theaterNote: 'Cinta sellada de la Era Antigua frente al mito de Mewtwo.',
    coords: [139.75, 35.68],
    zoom: 5.8,
  },
  'anime-ash-vs-tobias': {
    chapterId: 'anime-ash-vs-tobias',
    blocId: 'poke_japan',
    locationName: 'Estadio del Valle Lirio · Semifinales',
    regionLabel: 'Sinnoh Este · Confederación Tohjo',
    theaterNote: 'La semifinal legendaria de la Liga de Sinnoh.',
    coords: [144.35, 43.15],
    zoom: 5.8,
  },
  'archive-vgc-2024': {
    chapterId: 'archive-vgc-2024',
    blocId: 'alola',
    locationName: 'Estadio de Honolulu · Archivo Mundial',
    regionLabel: 'Alola · Santuario Neutral',
    theaterNote: 'Simulación oficial de la Final Mundial VGC 2024 (Luca vs. Yuta).',
    coords: [-157.85, 21.31],
    zoom: 4.8,
    originArcFrom: [-0.25, 51.55],
    originArcLabel: 'Enlace Holográfico desde Wyndon',
  },
  /* ---- ESCALERA PRINCIPAL ACTOS II–IV, CLÍMAX & POSTGAME ---- */
  'ch4-orre-shadow-ambush': {
    chapterId: 'ch4-orre-shadow-ambush',
    blocId: 'unova',
    locationName: 'Cañón de Aura (Orre) · Guerra Civil del Oeste',
    regionLabel: 'Acto II · Aura (Orre)',
    theaterNote: 'Emboscada de Pokémon Oscuros reales bajo Cielo Oscuro (Shadow Sky). ¡Ganar los arrebata directo a tus Cajas PC!',
    coords: [-111.2, 33.4],
    zoom: 4.2,
    originArcFrom: [-75.55, 10.42],
    originArcLabel: 'Travesía Mesoa → Desierto de Aura',
  },
  'challenge-xd001-shadow-lugia': {
    chapterId: 'challenge-xd001-shadow-lugia',
    blocId: 'unova',
    locationName: 'Isla Tempestad (Aura) · Proyecto XD001',
    regionLabel: 'Raid Oscuro · XD001 Lugia',
    theaterNote: 'Santuario Cifra bajo Cielo Oscuro ∞: XD001 Lugia Oscuro ★ (Shadow Aeroblast + Shadow Eclipse) y las 3 Aves Oscuras snaggables.',
    coords: [-117.2, 31.6],
    zoom: 4.5,
    originArcFrom: [-111.2, 33.4],
    originArcLabel: 'Señal Cifra desde Cañón de Aura → Isla Tempestad',
  },
  'ch8-tamra-cru-viceroy': {
    chapterId: 'ch8-tamra-cru-viceroy',
    blocId: 'poke_india',
    locationName: 'Fortaleza de Cobre · Fundiciones de Tamra',
    regionLabel: 'Acto III · Tamra (CRU)',
    theaterNote: 'El Virrey de la CRU blinda Tamra con Hazards Turno 0 y Copperajah ★ sobrecargado.',
    coords: [73.8, 19.1],
    zoom: 4.3,
    originArcFrom: [35.4, -1.6],
    originArcLabel: 'Ruta del Índico: Kemetia → Tamra',
  },
  'ch9-aeos-ditto-blacksite': {
    chapterId: 'ch9-aeos-ditto-blacksite',
    blocId: 'alola',
    locationName: 'Black Site Submarino · Isla Æos',
    regionLabel: 'Acto III · Isla Æos',
    theaterNote: 'Incursión al laboratorio secreto del Último Ditto (Imposter Nv. 115 + Campo Eléctrico ∞).',
    coords: [-148.5, 14.2],
    zoom: 4.3,
    originArcFrom: [73.8, 19.1],
    originArcLabel: 'Asalto clandestino al Pacífico · Isla Æos',
  },
  'ch10-tohjo-shentai-trial': {
    chapterId: 'ch10-tohjo-shentai-trial',
    blocId: 'poke_china',
    locationName: 'Cumbre de Tohjo & Shentai · Alianza Libre',
    regionLabel: 'Acto IV · Tohjo / Shentai',
    theaterNote: 'Prueba marcial OU/Uber bajo Gravedad persistente para ganar el respaldo de las Potencias Libres.',
    coords: [118.8, 32.1],
    zoom: 4.2,
    originArcFrom: [-148.5, 14.2],
    originArcLabel: 'Cumbre del Pacífico → Shentai / Tohjo',
  },
  'ch11-poketopia-traitor-council': {
    chapterId: 'ch11-poketopia-traitor-council',
    blocId: 'alola',
    locationName: 'Coliseo Dorado de Pokétopia · Cúpula CRU',
    regionLabel: 'Acto IV · Pokétopia',
    theaterNote: 'Caída del Consejo Traidor: Espacio Raro + Zona Extraña frente a Miraidon y Calyrex-Ice ★.',
    coords: [-163.4, 17.5],
    zoom: 4.4,
    originArcFrom: [118.8, 32.1],
    originArcLabel: 'Ofensiva de regreso: Shentai → Pokétopia',
  },
  'ch12-bastard-brother-climax': {
    chapterId: 'ch12-bastard-brother-climax',
    blocId: 'galar_empire',
    locationName: 'Ciudadela Real de Wyndon · Salón del Trono',
    regionLabel: 'CLÍMAX · La Corona (Galar)',
    theaterNote: 'Batalla final de la historia contra El Hermano Bastardo: Zamazenta-Crowned + Eternatus-Eternamax ★ (Nv. 115).',
    coords: [-0.85, 51.85],
    zoom: 7.4,
    originArcFrom: [-163.4, 17.5],
    originArcLabel: 'Regreso Definitivo a Galar · Ciudadela Real',
  },
  'ch13-postgame-champion': {
    chapterId: 'ch13-postgame-champion',
    blocId: 'galar_empire',
    locationName: 'Estadio Real de Wyndon · Copa Anything Goes',
    regionLabel: 'POSTGAME · La Campeona (Nv. 120)',
    theaterNote: 'Desafío postgame opcional Anything Goes puro contra Mega-Rayquaza ★ Nv. 120, Kyogre, Xerneas y Arceus.',
    coords: [-2.15, 53.35],
    zoom: 7.2,
  },
  ...buildRomanceMapLocations(),
};

/** Subtle regional micro-labels rendered when zoomed in (including Islas Bruma Imperial Base!). */
export const ZOOM_LANDMARKS: Array<{
  id: string;
  label: string;
  coords: [number, number];
  minZoom: number;
  color: string;
}> = [
  { id: 'lm-islas-bruma', label: '♛ ISLAS BRUMA (GALAR)', coords: [-43.0, -49.5], minZoom: 1.0, color: '#fda4af' },
  { id: 'lm-sinnoh', label: 'SINNOH', coords: [142.8, 43.8], minZoom: 3.2, color: '#c4b5fd' },
  { id: 'lm-kitakami', label: 'KITAKAMI', coords: [140.8, 39.4], minZoom: 3.8, color: '#a78bfa' },
  { id: 'lm-kanto', label: 'KANTO', coords: [139.6, 36.1], minZoom: 3.2, color: '#fde047' },
  { id: 'lm-johto', label: 'JOHTO', coords: [135.8, 35.1], minZoom: 3.6, color: '#67e8f9' },
  { id: 'lm-hoenn', label: 'HOENN', coords: [131.0, 32.8], minZoom: 3.6, color: '#86efac' },
  { id: 'lm-crown-tundra', label: 'NIEVES CORONA', coords: [-4.3, 57.2], minZoom: 4.5, color: '#fca5a5' },
  { id: 'lm-wyndon', label: 'WYNDON · CRU', coords: [-0.25, 51.1], minZoom: 4.5, color: '#fde68a' },
  { id: 'lm-blueberry', label: 'ACADEMIA ARÁNDANO', coords: [-70.5, 37.8], minZoom: 2.4, color: '#6ee7b7' },
  { id: 'lm-veridia-mew', label: 'SELVA DE VERIDIA (¿MEW?)', coords: [-58.8, 4.9], minZoom: 1.8, color: '#6ee7b7' },
  { id: 'lm-four-ruins', label: 'CUATRO RUINAS', coords: [115.0, 36.0], minZoom: 2.0, color: '#5eead4' },
  { id: 'lm-kubfu', label: 'MONTAÑAS URSHIFU', coords: [112.0, 26.5], minZoom: 2.0, color: '#5eead4' },
  { id: 'lm-miraj-canal', label: 'CANAL DE MIRAJ', coords: [32.5, 31.8], minZoom: 2.8, color: '#fef08a' },
];
