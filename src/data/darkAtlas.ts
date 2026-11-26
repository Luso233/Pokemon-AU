import type { WorldBlocId } from './worldGeopolitics';

export type DarkAtlasLandmarkId =
  | 'orre'
  | 'orange_islands'
  | 'poketopia'
  | 'ranger_union'
  | 'pasio'
  | 'aeos_island'
  | 'ryme_city'
  | 'ransei'
  | 'ferrum';

export interface DarkAtlasLandmark {
  id: DarkAtlasLandmarkId;
  name: string;
  shortName: string;
  originGame: string;
  hostBlocId: WorldBlocId;
  coords: [number, number];
  zoom: number;
  accentColor: string;
  threatBadge: string;
  auDestiny: string;
  keySecret: string;
  relatedNpcNote?: string;
}

/**
 * Polygon & frontline dividing Teselia/Unova (East · Piltover) from Aura/Orre (Southwest · Zaun)
 * during their brutal coast-to-coast civil war!
 */
export const ORRE_CIVIL_WAR_POLYGON_COORDS: [number, number][] = [
  [-124.2, 41.8],
  [-117.0, 41.8],
  [-109.0, 41.0],
  [-102.0, 38.5],
  [-98.2, 34.5],
  [-97.0, 26.2],
  [-104.5, 29.5],
  [-111.5, 31.3],
  [-117.2, 32.6],
  [-120.6, 34.8],
  [-122.6, 38.0],
  [-124.2, 41.8],
];

export const ORRE_TESELIA_FRONTLINE_COORDS: [number, number][] = [
  [-109.0, 41.0],
  [-102.0, 38.5],
  [-98.2, 34.5],
  [-97.0, 26.2],
];

export const DARK_ATLAS_LANDMARKS: DarkAtlasLandmark[] = [
  {
    id: 'orre',
    name: 'Aura (Orre) · Zona de Guerra Civil',
    shortName: 'AURA (ORRE)',
    originGame: 'Pokémon Colosseum / XD',
    hostBlocId: 'unova',
    coords: [-111.8, 34.1],
    zoom: 3.8,
    accentColor: '#a855f7',
    threatBadge: 'Guerra Civil · Pokémon Oscuros',
    auDestiny:
      'El «Zaun» del «Piltover» que es Teselia. Para competir contra Galar y la CRU, Teselia explotó sin piedad a su oeste desértico; sin Pokémon salvajes, Aura se levantó en armas usando Pokémon Oscuros como guerrilla desesperada.',
    keySecret: 'Cámaras de Oscurización (Shadow Pokémon) y resistencia de Ciudad Oasis',
    relatedNpcNote: 'Batch 1 Romanceable: El Pelirrojo (Counter-Team IA · Tag 2v2 en Aura)',
  },
  {
    id: 'orange_islands',
    name: 'Islas Naranja · Régimen Agrario',
    shortName: 'ISLAS NARANJA',
    originGame: 'Anime Pokémon (Temp. 2)',
    hostBlocId: 'monsoon_archipelago',
    coords: [122.4, 12.6],
    zoom: 4.5,
    accentColor: '#ef4444',
    threatBadge: 'Dictadura Totalitaria · Enemigo Mortal',
    auDestiny:
      'El colapso provocado por las guerras proxy de Galar en Vayra destruyó el archipiélago vecino, dando paso a una dictadura agraria genocida que purga a los entrenadores tradicionales y odia por igual a la CRU y al vínculo clásico.',
    keySecret: 'Campos de purga de entrenadores y flota corsaria del Pacífico Sur',
    relatedNpcNote: 'Enemigo mortal de La Duelista de Vayra (Batch 1 · Especialista 1v1)',
  },
  {
    id: 'poketopia',
    name: 'Pokétopia · Coliseo de la CRU',
    shortName: 'POKÉTOPIA',
    originGame: 'Pokémon Battle Revolution',
    hostBlocId: 'aztlan_caribe',
    coords: [-66.8, 22.8],
    zoom: 4.6,
    accentColor: '#f59e0b',
    threatBadge: 'Paraíso Fiscal de la CRU · Apuestas a Muerte',
    auDestiny:
      'Isla artificial flotante frente a Mesoa y paraíso fiscal de la Compañía Real de Ultramar (CRU). Mientras medio planeta sufre hambrunas y escasez del Monopolio Ditto, los accionistas y el Consejo apuestan vidas en coliseos de cristal.',
    keySecret: 'Bóvedas financieras de la CRU y coliseos de apuestas clandestinas',
    relatedNpcNote: 'Batch 2 Waifu: La Crupier de Sangre (Ace Kingdra Sniper — La Casa Siempre Gana)',
  },
  {
    id: 'ranger_union',
    name: 'Fiore, Almia y Oblivia · Unión Ranger',
    shortName: 'UNIÓN RANGER',
    originGame: 'Pokémon Ranger (Trilogía)',
    hostBlocId: 'poke_japan',
    coords: [128.2, 26.8],
    zoom: 4.6,
    accentColor: '#10b981',
    threatBadge: 'Guerrilla Ecoterrorista (según la CRU)',
    auDestiny:
      'Archipiélagos al borde de la Confederación Tohjo. Galar y la CRU declararon a la Unión Ranger organización ecoterrorista por usar Capturadores en vez de Poké Balls; operan como guerrilla liberando Pokémon de fábricas y barcos negreros.',
    keySecret: 'Tecnología de Capturadores sin Poké Ball y rutas de rescate marino',
    relatedNpcNote: 'Batch 2 Husbando: El Comandante Ranger (Ace Palafin-Hero T1 — El Héroe Nunca Huye)',
  },
  {
    id: 'pasio',
    name: 'Pasio · Paraíso de Mercenarios',
    shortName: 'PASIO',
    originGame: 'Pokémon Masters EX',
    hostBlocId: 'alola',
    coords: [166.5, 19.2],
    zoom: 3.8,
    accentColor: '#38bdf8',
    threatBadge: 'Estado Mercenario · Cazarrecompensas',
    auDestiny:
      'Isla artificial en mitad del Pacífico entre Alola y la Confederación Tohjo. Bazar sin ley donde los mercenarios más letales del mundo venden sus servicios al Consejo y a la CRU —incluyendo quienes persiguen al príncipe exiliado.',
    keySecret: 'Contratos del Consejo, ligas sin ley y armería de objetos competitivos',
    relatedNpcNote: 'Punto de encuentro de cazarrecompensas y vigilancia secreta de La Campeona',
  },
  {
    id: 'aeos_island',
    name: 'Isla Æos · Black Site de la CRU',
    shortName: 'ISLA ÆOS',
    originGame: 'Pokémon UNITE',
    hostBlocId: 'poke_india',
    coords: [87.5, -9.8],
    zoom: 4.0,
    accentColor: '#f43f5e',
    threatBadge: 'Black Site Científico · Clones Ditto',
    auDestiny:
      'Instalación militar restringida entre Tamra y Tarran levantada durante las Guerras de Extinción. Aquí los científicos de la CRU experimentan ilegalmente con Energía Æos para replicar el ADN del Último Ditto y sostener el monopolio.',
    keySecret: 'Cámaras de clonación Æos y viales robados del Último Ditto',
    relatedNpcNote: 'Batch 2 Waifu: La Genetista Renegada (Ace Ditto Base 150 HP — El Clon Perfecto)',
  },
  {
    id: 'ryme_city',
    name: 'Ciudad Ryme · Gueto Amurallado',
    shortName: 'CIUDAD RYME',
    originGame: 'Detective Pikachu',
    hostBlocId: 'unova',
    coords: [-71.0, 42.3],
    zoom: 4.8,
    accentColor: '#eab308',
    threatBadge: 'Gueto Sobrepoblado · Gas R',
    auDestiny:
      'Nació como una utopía costera donde humanos y Pokémon convivían sin Poké Balls. Tras el colapso ecológico quedó convertida en un gueto amurallado al borde de Teselia, dominado por traficantes de Gas R y desertores del bajo mundo.',
    keySecret: 'Mercado subterráneo de Gas R y escondites de la red de inteligencia',
    relatedNpcNote: 'Zona de rastreo de El Pelirrojo (Batch 1 · Red de Inteligencia)',
  },
  {
    id: 'ransei',
    name: 'Ransei · Reino Ermitaño de Arceus',
    shortName: 'RANSEI',
    originGame: 'Pokémon Conquest',
    hostBlocId: 'poke_china',
    coords: [94.8, 31.2],
    zoom: 4.0,
    accentColor: '#14b8a6',
    threatBadge: 'Estado Feudal Inconquistable',
    auDestiny:
      'Cordillera inaccesible dentro de Shentai cuya geografía forma la silueta de Arceus. Sus señores de la guerra rechazan las Poké Balls y la tecnología de la CRU, pero poseen vínculos tan absurdos con sus Pokémon que Galar jamás se atrevió a invadirlos.',
    keySecret: 'Vínculo Perfecto ancestral sin cápsulas y fortalezas de montaña',
    relatedNpcNote: 'Batch 3 Alto Mando 1/4: Lady Nobuna de Ransei',
  },
  {
    id: 'ferrum',
    name: 'Región de Ferrum · Piedras de Sinergia',
    shortName: 'FERRUM',
    originGame: 'Pokkén Tournament',
    hostBlocId: 'northern_steppe',
    coords: [13.4, 51.2],
    zoom: 4.5,
    accentColor: '#60a5fa',
    threatBadge: 'Complejo Militar · Sinergia Cuerpo a Cuerpo',
    auDestiny:
      'Enclave militarizado en el corazón de Kovaria. Famoso por sus campos de entrenamiento clandestinos donde los comandantes pelean cuerpo a cuerpo junto a sus Pokémon mediante Piedras de Sinergia.',
    keySecret: 'Arsenales de Piedras de Sinergia y doctrina de combate cercano',
    relatedNpcNote: 'Batch 3 Alto Mando 2/4: General Viktoria de Ferrum',
  },
];

export const DARK_ATLAS_BY_ID: Record<DarkAtlasLandmarkId, DarkAtlasLandmark> =
  DARK_ATLAS_LANDMARKS.reduce(
    (acc, lm) => {
      acc[lm.id] = lm;
      return acc;
    },
    {} as Record<DarkAtlasLandmarkId, DarkAtlasLandmark>
  );
