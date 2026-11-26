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
  /** Optional Atlantic/Pacific callout leader target [lon, lat] to keep Europe & Japan crisp. */
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
  /** Optional curved strategic arc from another point on Earth (e.g. Malvinas Naval Garrison or Hologram Link). */
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
    label: 'Zona Disputada · Insurgencia',
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
    label: 'Bloque Aislacionista',
    dotColor: '#8b5cf6',
    pillClass: 'border-violet-400/50 bg-violet-500/20 text-violet-200',
  },
  mystery: {
    label: 'Frontera Selvática · Amenaza al Monopolio',
    dotColor: '#059669',
    pillClass: 'border-emerald-400/50 bg-emerald-500/20 text-emerald-200',
  },
};

export const WORLD_BLOCS: WorldBlocDefinition[] = [
  /* ===================== ACTIVE PLAYABLE EXILE BLOCS (12) ===================== */
  {
    id: 'galar_empire',
    name: 'Imperio de Galar (Metrópoli + Malvinas)',
    shortName: 'GALAR',
    factionKind: 'imperial_core',
    factionBadge: 'Metrópoli Imperial · Monopolio Ditto',
    isoNumericIds: ['826', '372', '238'], // UK, Ireland, Falkland Islands (Malvinas!)
    regionFill: '#e11d48',
    regionStroke: '#fbbf24',
    empireFill: '#e11d48',
    empireStroke: '#fde047',
    center: [-1.4, 52.2],
    labelCoords: [-17.5, 61.5],
    leaderTarget: [-3.0, 54.5],
    labelAlign: 'end',
    focusZoom: 6.2,
    statusTag: 'Prólogo y Golpe de Estado (4 misiones)',
    loreSummary:
      'Sede de la Corona y monopolio científico del Último Ditto en Wyndon. Además de la metrópoli, mantiene enclaves navales estratégicos como las Islas Malvinas frente al Cono Austral.',
    keyResource: 'Monopolio genético del Último Ditto y flotas navales',
    featuredCanonClue: 'Wyndon · Muelles del Támesis · Guarnición Naval de las Malvinas',
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
    name: 'Kalos (Frontera Ocupada · Paz Forzada)',
    shortName: 'KALOS',
    factionKind: 'contested',
    factionBadge: 'Hegemonía Tensa · Insurgencia',
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
      'Al otro lado del canal, sometida a una paz forzada con Galar. Tras la muerte del rey, nobles rebeldes y facciones insurgentes chocan por el control de sus rutas hacia el continente.',
    keyResource: 'Energía de Megaevolución y red ferroviaria europea',
    featuredCanonClue: 'Frontera del Canal · Ciudad Luminalia',
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
    name: 'Paldea (Paso Ibérico · Gran Cráter)',
    shortName: 'PALDEA',
    factionKind: 'independent',
    factionBadge: 'Potencia Vecina · Teracristalización',
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
      'Potencia peninsular limítrofe con Kalos que custodia el fenómeno Teracristal en el Gran Cráter. Sus pasos montañosos del norte son el último cuello de botella antes de embarcar hacia América.',
    keyResource: 'Cristales del Área Cero y puertos atlánticos neutrales',
    featuredCanonClue: 'Paso de los Pirineos · Gran Cráter de Paldea',
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
    name: 'Aztlán-Caribe (Confederación Mesoamericana y del Caribe)',
    shortName: 'AZTLÁN-CARIBE',
    factionKind: 'independent',
    factionBadge: 'Mercados Negros · Cárteles de Crianza',
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
    statusTag: 'Refugio Clandestino de Fugitivos',
    loreSummary:
      'De México y el Caribe hasta Colombia y Venezuela: territorio de cárteles de crianza clandestina, mercados negros de Poké Balls y puertos sin ley. El mejor sitio para desaparecer del radar imperial si tienes contactos o monedas.',
    keyResource: 'Crianza clandestina fuera del registro de Wyndon y pasaportes falsos',
    featuredCanonClue: 'Foso Subterráneo Portuario · Rutas del Caribe',
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
    name: 'Andes-Plata (El Cono Austral)',
    shortName: 'ANDES-PLATA',
    factionKind: 'independent',
    factionBadge: 'Tierras Altas & Pampas · Frente a Malvinas',
    isoNumericIds: ['604', '152', '032', '068', '218', '600', '858'],
    regionFill: '#3b82f6',
    regionStroke: '#93c5fd',
    empireFill: '#2563eb',
    empireStroke: '#93c5fd',
    center: [-68.0, -34.0],
    labelCoords: [-72.0, -32.0],
    focusZoom: 2.8,
    statusTag: 'Patrullaje Imperial desde Malvinas',
    loreSummary:
      'Perú, Chile, Argentina y las cordilleras australes: tierras altas, desiertos salinos y pampas heladas con entrenadores recios y orgullosos. Justo frente a su costa sur, Galar mantiene las Islas Malvinas como base naval de vigilancia.',
    keyResource: 'Rutas del Estrecho Austral y fortalezas andinas',
    featuredCanonClue: 'Estrecho Austral · Base Naval Imperial de las Malvinas',
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
    name: 'Poké-África (Corredor del Nilo al Cabo)',
    shortName: 'POKÉ-ÁFRICA',
    factionKind: 'imperial_colony',
    factionBadge: 'Reserva Imperial · Minorías Oprimidas',
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
      'Corredor británico de Egipto a Sudáfrica y la costa occidental. Última gran reserva biológica con especies sin clonar (Pyroar, Hippowdon, Farigiraf, Cofagrigus) y santuarios más antiguos que el propio Imperio.',
    keyResource: 'Reservas naturales sin clonar, fósiles y piedras evolutivas',
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
    name: 'Creciente de Arena (Medio Oriente y Magreb)',
    shortName: 'CRECIENTE DE ARENA',
    factionKind: 'contested',
    factionBadge: 'Peaje Marítimo · Canal del Desierto',
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
    statusTag: 'Paso Obligado hacia Oriente',
    loreSummary:
      'Del Magreb al Golfo y el paso equivalente al Canal de Suez: llave marítima entre Europa, Poké-África y Poké-India. Quien paga el peaje —o sobrevive al calor extremo de sus aduanas— cruza el planeta.',
    keyResource: 'Control de canales marítimos, comercio energético y peajes',
    featuredCanonClue: 'Estación Solar del Canal (Calor 48°C vs. Cabina A/C)',
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
    name: 'Poké-India (Tierra de Copperajah)',
    shortName: 'POKÉ-INDIA',
    factionKind: 'imperial_colony',
    factionBadge: 'Joya de la Corona · Subyugada',
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
      'La región ancestral de donde Galar importó a Copperajah hace siglos. Densamente poblada y rica en especies Psíquico, Lucha y Acero, sometida como mano de obra y laboratorio climático para la Corona.',
    keyResource: 'Linajes originales de Copperajah y estaciones de monzón',
    featuredCanonClue: 'Domo Climático de los Monzones (4 Climas + 4 Terrenos)',
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
    name: 'Archipiélago del Monzón (Sudeste Insular)',
    shortName: 'MONZÓN',
    factionKind: 'contested',
    factionBadge: 'Guerrillas Selváticas · Contrabando',
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
      'Vietnam, Tailandia, Indonesia y Filipinas: laberinto de selvas monzónicas, rutas de contrabando y guerrillas que quebraron toda tentativa de colonización. Famoso por sus duelistas implacables en combate 1v1.',
    keyResource: 'Rutas clandestinas del Índico-Pacífico y tácticas asimétricas',
    featuredCanonClue: 'Costa Rebelde del Monzón (Duelo a Muerte 1v1)',
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
    name: 'Colonia Penal del Sur (Poké-Australia)',
    shortName: 'COLONIA PENAL',
    factionKind: 'imperial_colony',
    factionBadge: 'Exilio Imperial · Minas & Desertores',
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
      'Continente aislado adonde la Corona deporta a entrenadores rebeldes y desertores a picar piedra en galerías profundas. Su fauna salvaje —Kangaskhan, Komala— y sus cazarrecompensas no dan tregua.',
    keyResource: 'Minas profundas de piedras evolutivas y clanes desertores',
    featuredCanonClue: 'Galerías de Kalgoorlie (2 Oleadas Sin Curación)',
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
    name: 'Bloque Aislacionista de Poké-Japón',
    shortName: 'POKÉ-JAPÓN',
    factionKind: 'isolationist',
    factionBadge: 'Archipiélago Cerrado · Estilo Meiji',
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
      'Archipiélago celosamente cerrado que reúne a Kanto, Johto, Hoenn, Sinnoh y Kitakami. Rechaza toda tutela de Galar y guarda tanto las bóvedas clásicas de Silph Co. como la leyenda de la Liga de Sinnoh.',
    keyResource: 'Ecosistemas intactos, tecnología Silph y ligas independientes',
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
    labelCoords: [-156.5, 27.5],
    focusZoom: 4.8,
    statusTag: 'Sede del Archivo Mundial VGC',
    loreSummary:
      'Islas volcánicas soberanas en medio del Pacífico, protegidas por los Espíritus Guardianes. Sede neutral de la histórica Final Mundial VGC 2024 registrada en los archivos holográficos.',
    keyResource: 'Recorrido Insular y santuarios de los Tapu',
    featuredCanonClue: 'Honolulu (Final Mundial VGC 2024 · Luca vs. Yuta)',
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
    name: 'Amazonia / Vera Cruz (Imperio de la Selva)',
    shortName: 'AMAZONIA',
    factionKind: 'mystery',
    factionBadge: 'Potencia Selvática · El Secreto de Mew',
    isoNumericIds: ['076', '328', '740'], // Brazil, Guyana, Suriname
    regionFill: '#059669',
    regionStroke: '#34d399',
    empireFill: '#059669',
    empireStroke: '#34d399',
    center: [-53.0, -9.0],
    labelCoords: [-52.0, -10.5],
    focusZoom: 2.7,
    statusTag: 'Rumor Mortal para el Monopolio Ditto · Próximo Arco',
    loreSummary:
      'Brasil y las Guayanas: una potencia independiente gigantesca cuya selva impenetrable resguarda el mayor secreto político del planeta —el rumor de que ahí sobrevive Mew, capaz de romper para siempre el monopolio del Último Ditto.',
    keyResource: 'El mito viviente de Mew y biodiversidad selvática inexplorada',
    featuredCanonClue: 'Selvas de Guyana (Diarios de Gen 1) · Corazón de Amazonia',
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
    name: 'Teselia / Unova (República Independiente)',
    shortName: 'TESELIA',
    factionKind: 'independent',
    factionBadge: 'República Industrial Independiente',
    isoNumericIds: ['840'],
    regionFill: '#10b981',
    regionStroke: '#6ee7b7',
    empireFill: '#10b981',
    empireStroke: '#6ee7b7',
    center: [-95.0, 39.0],
    labelCoords: [-98.0, 39.5],
    focusZoom: 2.8,
    statusTag: 'Circuito Profesional Independiente · Próximo Arco',
    loreSummary:
      'Potencia industrial independiente anclada en su metrópoli costera y la Academia Arándano en el Atlántico. Se niega a comprar licencias genéticas a Wyndon y sostiene una frontera tensa con el Dominio Boreal.',
    keyResource: 'Biodomos artificiales (Academia Arándano) y circuito competitivo libre',
    featuredCanonClue: 'Costa Este (Unova) · Academia Arándano',
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
    name: 'Dominio Boreal (Poké-Canadá)',
    shortName: 'DOMINIO BOREAL',
    factionKind: 'imperial_colony',
    factionBadge: 'Dominio Imperial · Frontera Helada',
    isoNumericIds: ['124', '304'], // Canada + Greenland Arctic Watch
    regionFill: '#be123c',
    regionStroke: '#fbbf24',
    empireFill: '#be123c',
    empireStroke: '#fbbf24',
    center: [-96.0, 57.5],
    labelCoords: [-102.0, 59.0],
    focusZoom: 2.4,
    statusTag: 'Guarnición del Norte · Próximo Arco',
    loreSummary:
      'Extenso dominio septentrional gobernado por virreyes leales a Galar. Sostiene un cerco militar y aduanero permanente sobre la frontera norte de Teselia y el Atlántico ártico.',
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
    name: 'Estepa del Norte (Europa Continental y Rusia)',
    shortName: 'ESTEPA DEL NORTE',
    factionKind: 'rival_empire',
    factionBadge: 'Bloque Militarizado · Industria Pesada',
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
    statusTag: 'Potencia Armada Continental · Próximo Arco',
    loreSummary:
      'De Alemania y Europa del Este hasta la inmensidad rusa y las estepas centrales: un bloque militarizado y frío con industria pesada propia que observa con recelo armado cualquier expansión de Galar.',
    keyResource: 'Industria pesada de Acero/Hielo y ferrocarriles transcontinentales',
    featuredCanonClue: 'Frontera Este de Kalos · Estepas Blindadas',
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
    name: 'Reinos de la Sabana (África Occidental y Central)',
    shortName: 'SABANA LIBRE',
    factionKind: 'independent',
    factionBadge: 'Tierras Libres · Resistencia Africana',
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
    statusTag: 'Resistencia al Corredor Imperial · Próximo Arco',
    loreSummary:
      'Tierras altas de Etiopía, selvas del Congo y costas occidentales que resistieron el corredor imperial de Galar. Sus clanes protegen rutas secretas de fauna salvaje lejos de los laboratorios de Wyndon.',
    keyResource: 'Santuarios indómitos y alianzas de resistencia anticolonial',
    featuredCanonClue: 'Rutas Libres frente al Corredor del Nilo',
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
    name: 'Asia Continental (Cuatro Ruinas y Montañas de Urshifu)',
    shortName: 'ASIA CONTINENTAL',
    factionKind: 'rival_empire',
    factionBadge: 'Imperio Rival · No Conquistado',
    isoNumericIds: ['156', '496', '410', '408', '158'],
    regionFill: '#0d9488',
    regionStroke: '#5eead4',
    empireFill: '#0f766e',
    empireStroke: '#5eead4',
    center: [105.0, 35.5],
    labelCoords: [104.0, 36.5],
    focusZoom: 2.75,
    statusTag: 'Contrapeso Mundial de Galar · Próximo Arco',
    loreSummary:
      'Coloso continental que Galar jamás logró someter. Tierra lejana al este de Paldea de donde provienen las Cuatro Ruinas (Chien-Pao, Chi-Yu, Ting-Lu, Wo-Chien) y las montañas marciales de Kubfu y Urshifu.',
    keyResource: 'Artes marciales antiguas y sellos de las Cuatro Ruinas',
    featuredCanonClue: 'Tierras de las Cuatro Ruinas · Montañas de Kubfu/Urshifu',
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
  'ch1-wyndon-chase',
  'challenge-last-bastion',
  'ch2-monotype-banners',
  'showcase-triples-phalanx',
  'ch3-clandestine-tamer',
  'challenge-three-knights',
  'puzzle-02-regigigas',
  'puzzle-01-sun-trap',
  'challenge-weather-terrains',
  'duel-01-honor-1v1',
  'survival-galar-mines',
  'archive-gen1-silph',
  'anime-ash-vs-tobias',
  'archive-vgc-2024',
];

/**
 * Global narrative coordinates for all 16 playable chapters:
 * Only 4 remain in Galar (Prologue, Flashback, Banquet, Docks escape);
 * 12 are distributed across Europe, Americas, Africa, Middle East, India, SE Asia, Australia, Poké-Japan & Alola!
 */
export const CHAPTER_MAP_LOCATIONS: Record<string, ChapterMapLocation> = {
  /* ---- GALAR (4: Prólogo, Recuerdo, Banquete y Fuga por el Puerto) ---- */
  'ch1-wyndon-chase': {
    chapterId: 'ch1-wyndon-chase',
    blocId: 'galar_empire',
    locationName: 'Callejones de Wyndon · Torre del Reloj',
    regionLabel: 'Galar · Metrópoli (Huida Inicial)',
    theaterNote: 'Emboscada nocturna bajo la lluvia tras el golpe del Consejo.',
    coords: [-0.25, 51.55],
    zoom: 7.4,
  },
  'ch2-banquet-ambush': {
    chapterId: 'ch2-banquet-ambush',
    blocId: 'galar_empire',
    locationName: 'Palacio Real de Wyndon · Salón de Cristal',
    regionLabel: 'Galar · Ciudadela Real',
    theaterNote: 'Apagón en plena cena de Estado con sabotaje sin reglas.',
    coords: [-0.15, 52.15],
    zoom: 7.2,
  },
  'flashback-lc-champion': {
    chapterId: 'flashback-lc-champion',
    blocId: 'galar_empire',
    locationName: 'Jardines del Palacio Real (Hace 10 años)',
    regionLabel: 'Galar · Recuerdo de Infancia',
    theaterNote: 'Primera lección con crías frente a la Campeona antes de la crisis.',
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
    locationName: 'Frontera Ocupada de Kalos · Llanura del Canal',
    regionLabel: 'Kalos · Territorio Disputado',
    theaterNote: 'Nada más cruzar el canal, la Casa Rebelde invoca el decreto de estandartes.',
    coords: [0.85, 49.15],
    zoom: 5.8,
  },
  'showcase-triples-phalanx': {
    chapterId: 'showcase-triples-phalanx',
    blocId: 'paldea',
    locationName: 'Paso de los Pirineos · Frontera Kalos–Paldea',
    regionLabel: 'Paldea · Salida Atlántica',
    theaterNote: 'La Falange del Duque bloquea el paso hacia los puertos del Atlántico en Triples.',
    coords: [-2.4, 42.3],
    zoom: 5.6,
  },

  /* ---- LATINOAMÉRICA (Aztlán-Caribe & Andes-Plata frente a Malvinas) ---- */
  'ch3-clandestine-tamer': {
    chapterId: 'ch3-clandestine-tamer',
    blocId: 'aztlan_caribe',
    locationName: 'Foso Portuario Clandestino · Costa Caribeña',
    regionLabel: 'Aztlán-Caribe · Mercado Negro',
    theaterNote: 'Fugitivo al otro lado del océano, entras en el cuadrilátero ilegal de Lord Vexen.',
    coords: [-75.55, 10.42],
    zoom: 4.2,
  },
  'challenge-three-knights': {
    chapterId: 'challenge-three-knights',
    blocId: 'andes_plata',
    locationName: 'Estrecho Austral · Costa frente a Malvinas',
    regionLabel: 'Andes-Plata · Cono Austral',
    theaterNote: 'Tres caballeros despachados desde la base naval imperial de las Malvinas cierran tu paso.',
    coords: [-67.6, -50.2],
    zoom: 4.4,
    originArcFrom: [-59.0, -51.75],
    originArcLabel: 'Despliegue desde Base Naval Malvinas (Galar)',
  },

  /* ---- ÁFRICA & MEDIO ORIENTE (Poké-África & Creciente de Arena) ---- */
  'puzzle-02-regigigas': {
    chapterId: 'puzzle-02-regigigas',
    blocId: 'poke_africa',
    locationName: 'Santuario Rúnico del Gran Valle del Rift',
    regionLabel: 'Poké-África · Reserva Ancestral',
    theaterNote: 'El Guardián no humano gira la llave que despierta al Coloso en una cámara anterior al Imperio.',
    coords: [35.4, -1.6],
    zoom: 4.2,
  },
  'puzzle-01-sun-trap': {
    chapterId: 'puzzle-01-sun-trap',
    blocId: 'sand_crescent',
    locationName: 'Estación Solar del Canal · Aduana del Desierto',
    regionLabel: 'Creciente de Arena · Ruta de Suez',
    theaterNote: '48°C afuera sobre la arena mientras el niño de OU manda macros desde su cabina con A/C.',
    coords: [32.55, 29.95],
    zoom: 4.8,
  },

  /* ---- ASIA & OCEANÍA (Poké-India, Archipiélago del Monzón & Colonia Penal) ---- */
  'challenge-weather-terrains': {
    chapterId: 'challenge-weather-terrains',
    blocId: 'poke_india',
    locationName: 'Domo Climático de los Monzones · Deccan',
    regionLabel: 'Poké-India · Joya de la Corona',
    theaterNote: 'El Estratega Solar secuestró el laboratorio climático colonial para presumir a Castform ★.',
    coords: [77.2, 20.4],
    zoom: 4.2,
  },
  'duel-01-honor-1v1': {
    chapterId: 'duel-01-honor-1v1',
    blocId: 'monsoon_archipelago',
    locationName: 'Círculo de Piedra · Costa Rebelde del Monzón',
    regionLabel: 'Archipiélago del Monzón · Tierra Insumisa',
    theaterNote: 'La Duelista de la Frontera exige cobrar en un duelo 1v1 a muerte la opresión imperial.',
    coords: [108.1, 15.9],
    zoom: 4.4,
    originArcFrom: [78.5, 21.5],
    originArcLabel: 'Eco de las Fronteras Subyugadas',
  },
  'survival-galar-mines': {
    chapterId: 'survival-galar-mines',
    blocId: 'poke_australia',
    locationName: 'Galerías de Kalgoorlie · Nivel Profundo 4',
    regionLabel: 'Colonia Penal · Poké-Australia',
    theaterNote: 'Fuga subterránea en dos oleadas sin curación frente a zapadores desertores y la guardia corrupta.',
    coords: [121.48, -30.75],
    zoom: 4.2,
  },

  /* ---- PACÍFICO & ARCHIPIÉLAGO CERRADO (Poké-Japón & Alola) ---- */
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
  'archive-vgc-2024': {
    chapterId: 'archive-vgc-2024',
    blocId: 'alola',
    locationName: 'Estadio de Honolulu · Archivo Mundial',
    regionLabel: 'Alola · Archipiélago del Pacífico',
    theaterNote: 'Simulación oficial de la Final Mundial VGC 2024 (Luca vs. Yuta).',
    coords: [-157.85, 21.31],
    zoom: 4.8,
    originArcFrom: [-0.25, 51.55],
    originArcLabel: 'Enlace Holográfico desde Wyndon',
  },
};

/** Subtle regional micro-labels rendered when zoomed in (including Malvinas Imperial Base!). */
export const ZOOM_LANDMARKS: Array<{
  id: string;
  label: string;
  coords: [number, number];
  minZoom: number;
  color: string;
}> = [
  { id: 'lm-malvinas', label: '♛ MALVINAS (GALAR)', coords: [-43.0, -49.5], minZoom: 1.0, color: '#fda4af' },
  { id: 'lm-sinnoh', label: 'SINNOH', coords: [142.8, 43.8], minZoom: 3.2, color: '#c4b5fd' },
  { id: 'lm-kitakami', label: 'KITAKAMI', coords: [140.8, 39.4], minZoom: 3.8, color: '#a78bfa' },
  { id: 'lm-kanto', label: 'KANTO', coords: [139.6, 36.1], minZoom: 3.2, color: '#fde047' },
  { id: 'lm-johto', label: 'JOHTO', coords: [135.8, 35.1], minZoom: 3.6, color: '#67e8f9' },
  { id: 'lm-hoenn', label: 'HOENN', coords: [131.0, 32.8], minZoom: 3.6, color: '#86efac' },
  { id: 'lm-crown-tundra', label: 'NIEVES CORONA', coords: [-4.3, 57.2], minZoom: 4.5, color: '#fca5a5' },
  { id: 'lm-wyndon', label: 'WYNDON', coords: [-0.25, 51.1], minZoom: 4.5, color: '#fde68a' },
  { id: 'lm-blueberry', label: 'ACADEMIA ARÁNDANO', coords: [-70.5, 37.8], minZoom: 2.4, color: '#6ee7b7' },
  { id: 'lm-guyana-mew', label: 'SELVA DE GUYANA (¿MEW?)', coords: [-58.8, 4.9], minZoom: 1.8, color: '#6ee7b7' },
  { id: 'lm-four-ruins', label: 'CUATRO RUINAS', coords: [115.0, 36.0], minZoom: 2.0, color: '#5eead4' },
  { id: 'lm-kubfu', label: 'MONTAÑAS URSHIFU', coords: [112.0, 26.5], minZoom: 2.0, color: '#5eead4' },
  { id: 'lm-suez', label: 'CANAL DE ARENA', coords: [32.5, 31.8], minZoom: 2.8, color: '#fef08a' },
];
