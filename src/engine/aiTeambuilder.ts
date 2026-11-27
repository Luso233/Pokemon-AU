import { Dex, Teams, TeamValidator, toID, type PokemonSet } from '@pkmn/sim';
import type {
  AISettings,
  BattleFormat,
  SavedVersusTeam,
  SupportedFormatId,
} from '../types/game';
import { callStructuredLLM, isLiveLLMConfigured } from './aiProvider';

const SAVED_TEAMS_STORAGE_KEY = 'galar-crown-versus-teams-v1';

export interface VersusFormatSpec {
  id: SupportedFormatId;
  name: string;
  shortLabel: string;
  battleFormat: BattleFormat;
  teamSize: number;
  defaultLevel: number;
  interactiveTeamPreview: boolean;
  defaultOpenTeamsheet: boolean;
  rulesHint: string;
}

export const VERSUS_FORMATS: VersusFormatSpec[] = [
  {
    id: 'gen9doublescustomgame@@@NatDex Mod',
    name: 'NatDex Todo Vale (Dobles · Megas + Z + Tera)',
    shortLabel: 'NatDex AG · Dobles',
    battleFormat: 'doubles',
    teamSize: 6,
    defaultLevel: 100,
    interactiveTeamPreview: true,
    defaultOpenTeamsheet: false,
    rulesHint: 'Todos los Pokémon, Megaevoluciones, Movimientos Z y Teracristalización conviviendo en Dobles sin restricciones.',
  },
  {
    id: 'gen9customgame@@@NatDex Mod',
    name: 'NatDex Todo Vale (Singles · Megas + Z + Tera)',
    shortLabel: 'NatDex AG · Singles',
    battleFormat: 'singles',
    teamSize: 6,
    defaultLevel: 100,
    interactiveTeamPreview: true,
    defaultOpenTeamsheet: false,
    rulesHint: 'Todos los Pokémon, Megaevoluciones, Movimientos Z y Teracristalización conviviendo en 6v6 Singles sin banlist.',
  },
  {
    id: 'gen9ou',
    name: 'Gen 9 OU (6v6 Singles)',
    shortLabel: 'OU · 6v6 Singles',
    battleFormat: 'singles',
    teamSize: 6,
    defaultLevel: 100,
    interactiveTeamPreview: true,
    defaultOpenTeamsheet: false,
    rulesHint: 'Estándar competitivo 6v6 Singles (Smogon OU, Nivel 100, Species Clause).',
  },
  {
    id: 'gen9doublesou',
    name: 'Gen 9 Doubles OU (6v6 Dobles)',
    shortLabel: 'Doubles OU · 6v6',
    battleFormat: 'doubles',
    teamSize: 6,
    defaultLevel: 100,
    interactiveTeamPreview: true,
    defaultOpenTeamsheet: false,
    rulesHint: 'Dobles 6v6 Nivel 100 con control de velocidad, Protect, Fake Out y sinergias.',
  },
  {
    id: 'gen9vgc2024regg',
    name: 'VGC 2024 Reg G (Bring 6 Pick 4 · Nv.50)',
    shortLabel: 'VGC Reg G · 4v4 Nv.50',
    battleFormat: 'doubles',
    teamSize: 6,
    defaultLevel: 50,
    interactiveTeamPreview: true,
    defaultOpenTeamsheet: true,
    rulesHint: 'Reglas oficiales de Mundial: Nivel 50, 1 Legendario Restringido, Item Clause, Open Teamsheet.',
  },
  {
    id: 'gen91v1',
    name: 'Gen 9 1v1 (Bring 3, Pick 1)',
    shortLabel: '1v1 · Bring 3 Pick 1',
    battleFormat: 'singles',
    teamSize: 3,
    defaultLevel: 100,
    interactiveTeamPreview: true,
    defaultOpenTeamsheet: true,
    rulesHint: 'Solo 3 Pokémon por equipo; eliges 1 en Team Preview para combate a muerte súbita.',
  },
  {
    id: 'gen9monotype',
    name: 'Gen 9 Monotype (6v6 Singles)',
    shortLabel: 'Monotype · 6v6',
    battleFormat: 'singles',
    teamSize: 6,
    defaultLevel: 100,
    interactiveTeamPreview: true,
    defaultOpenTeamsheet: false,
    rulesHint: 'Los 6 Pokémon del equipo deben compartir exactamente un mismo tipo elemental.',
  },
  {
    id: 'gen9lc',
    name: 'Gen 9 Little Cup (Nv. 5)',
    shortLabel: 'Little Cup · Nv.5',
    battleFormat: 'singles',
    teamSize: 6,
    defaultLevel: 5,
    interactiveTeamPreview: true,
    defaultOpenTeamsheet: false,
    rulesHint: 'Solo Pokémon básicos capaces de evolucionar a Nivel 5 exacto.',
  },
  {
    id: 'gen9ubers',
    name: 'Gen 9 Ubers (6v6 Legendarios)',
    shortLabel: 'Ubers · 6v6',
    battleFormat: 'singles',
    teamSize: 6,
    defaultLevel: 100,
    interactiveTeamPreview: true,
    defaultOpenTeamsheet: false,
    rulesHint: 'Sin banlist OU: Koraidon, Miraidon, Calyrex, Arceus y titanes Nivel 100.',
  },
];

export function getVersusFormatSpec(formatId: string): VersusFormatSpec {
  return (
    VERSUS_FORMATS.find((f) => f.id === formatId) ?? VERSUS_FORMATS[0]
  );
}

export function normalizePromptKey(prompt: string): string {
  return prompt
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/* ================= LocalStorage Team Library & Cache ================= */

export function loadSavedTeams(): SavedVersusTeam[] {
  try {
    if (typeof localStorage === 'undefined') return [];
    const raw = localStorage.getItem(SAVED_TEAMS_STORAGE_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw) as SavedVersusTeam[];
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

export function saveTeamToLibrary(team: SavedVersusTeam): SavedVersusTeam[] {
  const existing = loadSavedTeams().filter(
    (t) =>
      t.id !== team.id &&
      !(
        t.formatId === team.formatId &&
        t.normalizedPrompt === team.normalizedPrompt &&
        team.normalizedPrompt.length > 0
      )
  );
  const updated = [team, ...existing].slice(0, 40);
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(SAVED_TEAMS_STORAGE_KEY, JSON.stringify(updated));
    }
  } catch {
    // ignore storage errors
  }
  return updated;
}

export function deleteSavedTeam(id: string): SavedVersusTeam[] {
  const updated = loadSavedTeams().filter((t) => t.id !== id);
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(SAVED_TEAMS_STORAGE_KEY, JSON.stringify(updated));
    }
  } catch {
    // ignore
  }
  return updated;
}

export function findCachedTeam(
  formatId: SupportedFormatId,
  prompt: string
): SavedVersusTeam | null {
  const norm = normalizePromptKey(prompt);
  if (!norm) return null;
  const all = loadSavedTeams();
  return (
    all.find((t) => t.formatId === formatId && t.normalizedPrompt === norm) ??
    null
  );
}

/* ================= Dex Sanitization & Official TeamValidator ================= */

interface RawAITeamMember {
  species: string;
  item?: string;
  ability?: string;
  level?: number;
  teraType?: string;
  nature?: string;
  evs?: Partial<Record<'hp' | 'atk' | 'def' | 'spa' | 'spd' | 'spe', number>>;
  ivs?: Partial<Record<'hp' | 'atk' | 'def' | 'spa' | 'spd' | 'spe', number>>;
  moves: string[];
}

interface RawAITeamResponse {
  teamName?: string;
  strategySummary?: string;
  pokemon?: RawAITeamMember[];
  showdownPaste?: string;
}

const VALID_NATURES = new Set([
  'Adamant', 'Bashful', 'Bold', 'Brave', 'Calm', 'Careful', 'Docile',
  'Gentle', 'Hardy', 'Hasty', 'Impish', 'Jolly', 'Lax', 'Lonely', 'Mild',
  'Modest', 'Naive', 'Naughty', 'Quiet', 'Quirky', 'Rash', 'Relaxed',
  'Sassy', 'Serious', 'Timid',
]);

function clampEvs(
  rawEvs: Partial<Record<'hp' | 'atk' | 'def' | 'spa' | 'spd' | 'spe', number>> | undefined
): PokemonSet['evs'] {
  const keys = ['hp', 'atk', 'def', 'spa', 'spd', 'spe'] as const;
  const out: PokemonSet['evs'] = { hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0 };
  let remaining = 508;
  for (const k of keys) {
    const val = Math.max(0, Math.min(252, Math.floor(Number(rawEvs?.[k]) || 0)));
    const clamped = Math.min(val, remaining);
    out[k] = clamped;
    remaining -= clamped;
  }
  return out;
}

function clampIvs(
  rawIvs: Partial<Record<'hp' | 'atk' | 'def' | 'spa' | 'spd' | 'spe', number>> | undefined
): PokemonSet['ivs'] {
  const keys = ['hp', 'atk', 'def', 'spa', 'spd', 'spe'] as const;
  const out: PokemonSet['ivs'] = { hp: 31, atk: 31, def: 31, spa: 31, spd: 31, spe: 31 };
  for (const k of keys) {
    if (rawIvs && typeof rawIvs[k] === 'number' && !Number.isNaN(rawIvs[k])) {
      out[k] = Math.max(0, Math.min(31, Math.floor(rawIvs[k]!)));
    }
  }
  return out;
}

export function sanitizeRawMembersToSets(
  members: RawAITeamMember[],
  spec: VersusFormatSpec
): PokemonSet[] {
  const result: PokemonSet[] = [];
  const usedBaseSpecies = new Set<string>();

  for (const raw of members) {
    if (result.length >= spec.teamSize) break;
    const sp = Dex.species.get(raw.species || '');
    if (!sp.exists) continue;
    const baseKey = toID(sp.baseSpecies || sp.name);
    if (usedBaseSpecies.has(baseKey)) continue;
    usedBaseSpecies.add(baseKey);

    const legalAbilities = Object.values(sp.abilities).filter(
      (a): a is string => Boolean(a && typeof a === 'string')
    );
    const chosenAbility =
      legalAbilities.find((a) => toID(a) === toID(raw.ability || '')) ??
      legalAbilities[0] ??
      '';

    const itemData = raw.item ? Dex.items.get(raw.item) : null;
    const chosenItem = itemData?.exists ? itemData.name : '';

    const nature = VALID_NATURES.has(raw.nature ?? '')
      ? raw.nature!
      : 'Serious';

    const validMoves: string[] = [];
    for (const mName of raw.moves ?? []) {
      const mv = Dex.moves.get(mName);
      if (mv.exists && !validMoves.includes(mv.name)) {
        validMoves.push(mv.name);
      }
      if (validMoves.length >= 4) break;
    }

    const teraValid = raw.teraType
      ? Dex.types.get(raw.teraType).exists
        ? Dex.types.get(raw.teraType).name
        : sp.types[0]
      : sp.types[0];

    result.push({
      name: sp.name,
      species: sp.name,
      item: chosenItem,
      ability: chosenAbility,
      moves: validMoves,
      nature,
      gender: '',
      evs: clampEvs(raw.evs),
      ivs: clampIvs(raw.ivs),
      level: spec.defaultLevel,
      teraType: teraValid,
    });
  }

  return result;
}

export function validatePasteForFormat(
  formatId: SupportedFormatId,
  paste: string
): { valid: boolean; errors: string[]; sets: PokemonSet[] } {
  const sets = Teams.import(paste) ?? [];
  if (sets.length === 0) {
    return {
      valid: false,
      errors: ['El Showdown Paste está vacío o tiene sintaxis inválida.'],
      sets: [],
    };
  }
  const validator = new TeamValidator(formatId);
  const problems = validator.validateTeam(sets);
  return {
    valid: !problems || problems.length === 0,
    errors: problems ?? [],
    sets,
  };
}

/* ================= Curated 100% TeamValidator-Legal Offline Archetypes ================= */

interface OfflineTeamPreset {
  keywords: string[];
  teamName: string;
  strategySummary: string;
  paste: string;
}

const OFFLINE_PRESETS: Record<string, OfflineTeamPreset[]> = {
  gen9ou: [
    {
      keywords: ['lluvia', 'rain', 'agua', 'water', 'pelipper', 'barraskewda'],
      teamName: 'Tormenta de Wyndon (Rain OU)',
      strategySummary:
        'Pelipper invoca lluvia para potenciar a Barraskewda, Archaludon/Zapdos y Walking Wake mientras Iron Treads controla hazards.',
      paste: `Pelipper @ Damp Rock
Ability: Drizzle
Tera Type: Ground
EVs: 248 HP / 252 Def / 8 SpD
Bold Nature
- Surf
- Hurricane
- U-turn
- Roost

Barraskewda @ Choice Band
Ability: Swift Swim
Tera Type: Water
EVs: 252 Atk / 4 Def / 252 Spe
Adamant Nature
- Liquidation
- Flip Turn
- Close Combat
- Aqua Jet

Raging Bolt @ Booster Energy
Ability: Protosynthesis
Tera Type: Fairy
EVs: 252 SpA / 4 SpD / 252 Spe
Modest Nature
IVs: 20 Atk
- Thunder
- Dragon Pulse
- Thunderclap
- Calm Mind

Iron Treads @ Assault Vest
Ability: Quark Drive
Tera Type: Water
EVs: 252 HP / 4 Atk / 252 SpD
Careful Nature
- Earthquake
- Iron Head
- Rapid Spin
- Volt Switch

Kingambit @ Black Glasses
Ability: Supreme Overlord
Tera Type: Dark
EVs: 252 HP / 252 Atk / 4 SpD
Adamant Nature
- Kowtow Cleave
- Sucker Punch
- Iron Head
- Swords Dance

Zapdos @ Heavy-Duty Boots
Ability: Static
Tera Type: Steel
EVs: 248 HP / 244 Def / 16 Spe
Bold Nature
IVs: 0 Atk
- Hurricane
- Thunder
- Volt Switch
- Roost`,
    },
    {
      keywords: ['sol', 'sun', 'fuego', 'fire', 'torkoal', 'offense', 'hiper', 'rapido'],
      teamName: 'Sol de Galar (Sun Offense OU)',
      strategySummary:
        'Torkoal abre Sol Intenso para activar Protosynthesis de Walking Wake y Great Tusk junto a presión ofensiva de Cinderace y Kingambit.',
      paste: `Torkoal @ Heat Rock
Ability: Drought
Tera Type: Flying
EVs: 248 HP / 252 Def / 8 SpD
Bold Nature
- Lava Plume
- Rapid Spin
- Stealth Rock
- Will-O-Wisp

Walking Wake @ Choice Specs
Ability: Protosynthesis
Tera Type: Water
EVs: 12 HP / 244 SpA / 252 Spe
Timid Nature
IVs: 0 Atk
- Hydro Steam
- Draco Meteor
- Flamethrower
- Flip Turn

Great Tusk @ Heavy-Duty Boots
Ability: Protosynthesis
Tera Type: Steel
EVs: 252 Atk / 4 Def / 252 Spe
Jolly Nature
- Headlong Rush
- Close Combat
- Ice Spinner
- Knock Off

Cinderace @ Heavy-Duty Boots
Ability: Libero
Tera Type: Fire
EVs: 252 Atk / 4 Def / 252 Spe
Jolly Nature
- Pyro Ball
- U-turn
- High Jump Kick
- Sucker Punch

Hatterene @ Assault Vest
Ability: Magic Bounce
Tera Type: Steel
EVs: 252 HP / 164 SpA / 92 SpD
Modest Nature
IVs: 0 Atk
- Psyshock
- Draining Kiss
- Mystical Fire
- Nuzzle

Kingambit @ Leftovers
Ability: Supreme Overlord
Tera Type: Flying
EVs: 252 HP / 252 Atk / 4 SpD
Adamant Nature
- Kowtow Cleave
- Sucker Punch
- Iron Head
- Swords Dance`,
    },
    {
      keywords: ['defens', 'stall', 'balance', 'hada', 'dragapult', 'acero', 'steel'],
      teamName: 'Balance Real de la Corona (OU)',
      strategySummary:
        'Núcleo equilibrado con Dragapult, Gholdengo, Great Tusk y Corviknight para dominar hazards, velocidad y remate con Kingambit.',
      paste: `Dragapult @ Choice Specs
Ability: Infiltrator
Tera Type: Ghost
EVs: 252 SpA / 4 SpD / 252 Spe
Timid Nature
IVs: 0 Atk
- Draco Meteor
- Shadow Ball
- Flamethrower
- U-turn

Gholdengo @ Air Balloon
Ability: Good as Gold
Tera Type: Fairy
EVs: 252 SpA / 4 SpD / 252 Spe
Timid Nature
IVs: 0 Atk
- Make It Rain
- Shadow Ball
- Nasty Plot
- Recover

Great Tusk @ Leftovers
Ability: Protosynthesis
Tera Type: Water
EVs: 252 HP / 252 Def / 4 Spe
Impish Nature
- Earthquake
- Body Press
- Rapid Spin
- Stealth Rock

Corviknight @ Rocky Helmet
Ability: Pressure
Tera Type: Dragon
EVs: 248 HP / 252 Def / 8 SpD
Impish Nature
- Brave Bird
- Body Press
- U-turn
- Roost

Ting-Lu @ Leftovers
Ability: Vessel of Ruin
Tera Type: Poison
EVs: 252 HP / 4 Def / 252 SpD
Careful Nature
- Earthquake
- Ruination
- Spikes
- Whirlwind

Kingambit @ Heavy-Duty Boots
Ability: Supreme Overlord
Tera Type: Dark
EVs: 252 Atk / 4 Def / 252 Spe
Adamant Nature
- Kowtow Cleave
- Sucker Punch
- Iron Head
- Swords Dance`,
    },
  ],
  gen9doublesou: [
    {
      keywords: ['lluvia', 'rain', 'agua', 'hada', 'fairy', 'dobles'],
      teamName: 'Diluvio Táctico (Doubles OU)',
      strategySummary:
        'Pelipper + Raging Bolt (Thunder 100% bajo lluvia) + Gholdengo anti-Hadas, respaldados por Rillaboom, Incineroar y Tornadus.',
      paste: `Pelipper @ Focus Sash
Ability: Drizzle
Tera Type: Ghost
EVs: 252 SpA / 4 SpD / 252 Spe
Modest Nature
IVs: 0 Atk
- Weather Ball
- Hurricane
- Wide Guard
- Protect

Raging Bolt @ Assault Vest
Ability: Protosynthesis
Tera Type: Fairy
EVs: 244 HP / 4 Def / 252 SpA / 8 SpD
Modest Nature
IVs: 20 Atk
- Thunder
- Draco Meteor
- Thunderclap
- Electroweb

Gholdengo @ Life Orb
Ability: Good as Gold
Tera Type: Steel
EVs: 4 HP / 252 SpA / 252 Spe
Timid Nature
IVs: 0 Atk
- Make It Rain
- Shadow Ball
- Nasty Plot
- Protect

Incineroar @ Sitrus Berry
Ability: Intimidate
Tera Type: Grass
EVs: 252 HP / 100 Def / 156 SpD
Careful Nature
- Fake Out
- Flare Blitz
- Knock Off
- Parting Shot

Rillaboom @ Miracle Seed
Ability: Grassy Surge
Tera Type: Fire
EVs: 252 HP / 252 Atk / 4 SpD
Adamant Nature
- Fake Out
- Grassy Glide
- Wood Hammer
- U-turn

Tornadus @ Covert Cloak
Ability: Prankster
Tera Type: Steel
EVs: 252 HP / 4 Def / 252 Spe
Timid Nature
IVs: 0 Atk
- Bleakwind Storm
- Tailwind
- Rain Dance
- Protect`,
    },
    {
      keywords: ['trick room', 'espacio raro', 'lento', 'fuego', 'sol', 'sun'],
      teamName: 'Espacio Raro Real (Doubles OU)',
      strategySummary:
        'Indeedee-F + Farigiraf aseguran Trick Room para que Ursaluna-Bloodmoon y Torkoal arrasen en área con soporte de Amoonguss e Incineroar.',
      paste: `Indeedee-F @ Psychic Seed
Ability: Psychic Surge
Tera Type: Fairy
EVs: 252 HP / 252 Def / 4 SpD
Bold Nature
IVs: 0 Atk
- Follow Me
- Helping Hand
- Psychic
- Trick Room

Ursaluna-Bloodmoon @ Life Orb
Ability: Mind's Eye
Tera Type: Normal
EVs: 252 HP / 252 SpA / 4 SpD
Quiet Nature
IVs: 0 Atk / 0 Spe
- Blood Moon
- Hyper Voice
- Earth Power
- Protect

Torkoal @ Charcoal
Ability: Drought
Tera Type: Fire
EVs: 252 HP / 252 SpA / 4 SpD
Quiet Nature
IVs: 0 Atk / 0 Spe
- Eruption
- Heat Wave
- Earth Power
- Protect

Amoonguss @ Sitrus Berry
Ability: Regenerator
Tera Type: Water
EVs: 252 HP / 156 Def / 100 SpD
Relaxed Nature
IVs: 0 Atk / 0 Spe
- Spore
- Rage Powder
- Pollen Puff
- Protect

Incineroar @ Safety Goggles
Ability: Intimidate
Tera Type: Ghost
EVs: 252 HP / 100 Def / 156 SpD
Careful Nature
- Fake Out
- Flare Blitz
- Knock Off
- Parting Shot

Iron Hands @ Assault Vest
Ability: Quark Drive
Tera Type: Grass
EVs: 252 HP / 252 Atk / 4 SpD
Brave Nature
IVs: 0 Spe
- Fake Out
- Drain Punch
- Wild Charge
- Heavy Slam`,
    },
  ],
  gen9vgc2024regg: [
    {
      keywords: ['lluvia', 'rain', 'kyogre', 'agua', 'hada'],
      teamName: 'Marea de Kyogre (VGC Reg G)',
      strategySummary:
        'Kyogre domina bajo lluvia con soporte de Tornadus (Tailwind), Tsareena anti-prioridad, Incineroar, Amoonguss y Archaludon.',
      paste: `Kyogre @ Mystic Water
Ability: Drizzle
Level: 50
Tera Type: Grass
EVs: 116 HP / 4 Def / 252 SpA / 4 SpD / 132 Spe
Modest Nature
IVs: 0 Atk
- Water Spout
- Origin Pulse
- Ice Beam
- Protect

Tornadus @ Covert Cloak
Ability: Prankster
Level: 50
Tera Type: Dark
EVs: 252 HP / 100 Def / 4 SpA / 100 SpD / 52 Spe
Calm Nature
IVs: 0 Atk
- Bleakwind Storm
- Tailwind
- Rain Dance
- Protect

Archaludon @ Assault Vest
Ability: Stamina
Level: 50
Tera Type: Grass
EVs: 252 HP / 4 Def / 116 SpA / 132 SpD / 4 Spe
Modest Nature
IVs: 0 Atk
- Electro Shot
- Draco Meteor
- Flash Cannon
- Body Press

Incineroar @ Sitrus Berry
Ability: Intimidate
Level: 50
Tera Type: Ghost
EVs: 252 HP / 100 Def / 156 SpD
Careful Nature
- Fake Out
- Flare Blitz
- Knock Off
- Parting Shot

Amoonguss @ Rocky Helmet
Ability: Regenerator
Level: 50
Tera Type: Water
EVs: 236 HP / 156 Def / 116 SpD
Relaxed Nature
IVs: 0 Atk / 0 Spe
- Spore
- Rage Powder
- Pollen Puff
- Protect

Urshifu-Rapid-Strike @ Focus Sash
Ability: Unseen Fist
Level: 50
Tera Type: Water
EVs: 252 Atk / 4 SpD / 252 Spe
Adamant Nature
- Surging Strikes
- Close Combat
- Aqua Jet
- Detect`,
    },
    {
      keywords: ['sol', 'sun', 'koraidon', 'fuego', 'ofensivo', 'rapido'],
      teamName: 'Sol Carmesí de Koraidon (VGC Reg G)',
      strategySummary:
        'Koraidon activa Sol Intenso para Flutter Mane y Chi-Yu mientras Raging Bolt, Incineroar y Whimsicott controlan ritmo y prioridad.',
      paste: `Koraidon @ Clear Amulet
Ability: Orichalcum Pulse
Level: 50
Tera Type: Fire
EVs: 4 HP / 252 Atk / 252 Spe
Jolly Nature
- Collision Course
- Flare Blitz
- Flame Charge
- Protect

Flutter Mane @ Focus Sash
Ability: Protosynthesis
Level: 50
Tera Type: Fairy
EVs: 4 HP / 252 SpA / 252 Spe
Timid Nature
IVs: 0 Atk
- Moonblast
- Shadow Ball
- Icy Wind
- Protect

Chi-Yu @ Choice Scarf
Ability: Beads of Ruin
Level: 50
Tera Type: Ghost
EVs: 4 HP / 252 SpA / 252 Spe
Modest Nature
IVs: 0 Atk
- Heat Wave
- Dark Pulse
- Overheat
- Snarl

Raging Bolt @ Assault Vest
Ability: Protosynthesis
Level: 50
Tera Type: Electric
EVs: 188 HP / 116 Def / 180 SpA / 4 SpD / 20 Spe
Modest Nature
IVs: 20 Atk
- Thunderclap
- Thunderbolt
- Draco Meteor
- Snarl

Whimsicott @ Covert Cloak
Ability: Prankster
Level: 50
Tera Type: Dark
EVs: 236 HP / 164 SpD / 108 Spe
Timid Nature
IVs: 0 Atk
- Moonblast
- Tailwind
- Encore
- Light Screen

Incineroar @ Safety Goggles
Ability: Intimidate
Level: 50
Tera Type: Grass
EVs: 252 HP / 100 Def / 156 SpD
Careful Nature
- Fake Out
- Flare Blitz
- Knock Off
- Parting Shot`,
    },
  ],
  gen91v1: [
    {
      keywords: ['ofensivo', 'rapido', 'dragon', 'fuego', 'acero', 'hada'],
      teamName: 'Trío de Duelo 1v1',
      strategySummary:
        'Triángulo de burst y aguante: Iron Valiant Booster Energy, Metagross Weakness Policy y Primarina Choice Specs.',
      paste: `Iron Valiant @ Booster Energy
Ability: Quark Drive
EVs: 4 HP / 252 SpA / 252 Spe
Timid Nature
IVs: 0 Atk
- Moonblast
- Aura Sphere
- Encore
- Destiny Bond

Metagross @ Weakness Policy
Ability: Clear Body
EVs: 252 HP / 252 Atk / 4 Def
Adamant Nature
- Heavy Slam
- Earthquake
- Bullet Punch
- Iron Defense

Primarina @ Choice Specs
Ability: Torrent
EVs: 252 HP / 252 SpA / 4 SpD
Modest Nature
IVs: 0 Atk
- Hydro Cannon
- Moonblast
- Psychic Noise
- Icy Wind`,
    },
  ],
  gen9monotype: [
    {
      keywords: ['agua', 'water', 'lluvia', 'rain'],
      teamName: 'Monotype Agua (Lluvia)',
      strategySummary:
        'Pelipper + Barraskewda + Swampert + Toxapex + Ogerpon-Wellspring + Greninja cubriendo Planta y Eléctrico.',
      paste: `Pelipper @ Heavy-Duty Boots
Ability: Drizzle
EVs: 248 HP / 252 Def / 8 SpD
Bold Nature
- Surf
- Hurricane
- U-turn
- Roost

Barraskewda @ Choice Band
Ability: Swift Swim
EVs: 252 Atk / 4 Def / 252 Spe
Adamant Nature
- Liquidation
- Close Combat
- Flip Turn
- Aqua Jet

Swampert @ Leftovers
Ability: Torrent
EVs: 252 HP / 4 Def / 252 SpD
Careful Nature
- Earthquake
- Flip Turn
- Stealth Rock
- Knock Off

Toxapex @ Black Sludge
Ability: Regenerator
EVs: 252 HP / 252 Def / 4 SpD
Bold Nature
IVs: 0 Atk
- Surf
- Toxic
- Haze
- Recover

Ogerpon-Wellspring @ Wellspring Mask
Ability: Water Absorb
EVs: 252 Atk / 4 Def / 252 Spe
Jolly Nature
- Ivy Cudgel
- Horn Leech
- Play Rough
- Swords Dance

Greninja @ Choice Scarf
Ability: Protean
EVs: 252 SpA / 4 SpD / 252 Spe
Timid Nature
IVs: 0 Atk
- Hydro Pump
- Ice Beam
- Dark Pulse
- U-turn`,
    },
    {
      keywords: ['acero', 'steel', 'dragon', 'fuego', 'hada'],
      teamName: 'Monotype Acero Real',
      strategySummary:
        'Corviknight, Heatran, Gholdengo, Archaludon, Iron Treads y Scizor cubriendo todas las debilidades del tipo Acero.',
      paste: `Corviknight @ Rocky Helmet
Ability: Pressure
EVs: 252 HP / 252 Def / 4 SpD
Impish Nature
- Brave Bird
- Body Press
- Defog
- Roost

Heatran @ Air Balloon
Ability: Flash Fire
EVs: 252 SpA / 4 SpD / 252 Spe
Timid Nature
IVs: 0 Atk
- Magma Storm
- Earth Power
- Flash Cannon
- Stealth Rock

Gholdengo @ Choice Scarf
Ability: Good as Gold
EVs: 252 SpA / 4 SpD / 252 Spe
Timid Nature
IVs: 0 Atk
- Make It Rain
- Shadow Ball
- Focus Blast
- Trick

Archaludon @ Assault Vest
Ability: Stamina
EVs: 252 HP / 4 Def / 252 SpA
Modest Nature
IVs: 0 Atk
- Draco Meteor
- Flash Cannon
- Body Press
- Thunderbolt

Iron Treads @ Leftovers
Ability: Quark Drive
EVs: 252 Atk / 4 SpD / 252 Spe
Jolly Nature
- Earthquake
- Iron Head
- Rapid Spin
- Knock Off

Scizor @ Choice Band
Ability: Technician
EVs: 252 Atk / 4 Def / 252 Spe
Adamant Nature
- Bullet Punch
- U-turn
- Close Combat
- Knock Off`,
    },
  ],
  gen9lc: [
    {
      keywords: ['lc', 'little', 'balance', 'ofensivo', 'rapido'],
      teamName: 'Academia Real Little Cup (Nv. 5)',
      strategySummary:
        'Mienfoo, Foongus, Grookey, Pawniard, Glimmet y Stunky con Eviolite y control de ritmo Nivel 5.',
      paste: `Mienfoo @ Eviolite
Ability: Regenerator
Level: 5
Tera Type: Fighting
EVs: 156 Def / 196 SpD / 156 Spe
Jolly Nature
- Fake Out
- High Jump Kick
- Knock Off
- U-turn

Foongus @ Eviolite
Ability: Regenerator
Level: 5
Tera Type: Water
EVs: 124 HP / 156 Def / 156 SpD
Bold Nature
IVs: 0 Atk
- Spore
- Giga Drain
- Sludge Bomb
- Synthesis

Grookey @ Eviolite
Ability: Grassy Surge
Level: 5
Tera Type: Grass
EVs: 236 Atk / 36 Def / 236 Spe
Jolly Nature
- Fake Out
- Grassy Glide
- Wood Hammer
- U-turn

Pawniard @ Eviolite
Ability: Defiant
Level: 5
Tera Type: Flying
EVs: 156 Atk / 36 Def / 116 SpD / 196 Spe
Jolly Nature
- Iron Head
- Night Slash
- Sucker Punch
- Swords Dance

Glimmet @ Eviolite
Ability: Toxic Debris
Level: 5
Tera Type: Grass
EVs: 132 HP / 116 Def / 180 SpA / 76 Spe
Timid Nature
IVs: 0 Atk
- Stealth Rock
- Power Gem
- Sludge Wave
- Dazzling Gleam

Stunky @ Eviolite
Ability: Aftermath
Level: 5
Tera Type: Dark
EVs: 12 HP / 172 Atk / 108 Def / 188 Spe
Jolly Nature
- Sucker Punch
- Gunk Shot
- Knock Off
- Taunt`,
    },
  ],
  gen9ubers: [
    {
      keywords: ['ubers', 'legendario', 'koraidon', 'miraidon', 'arceus', 'ofensivo'],
      teamName: 'Panteón Ubers de Galar',
      strategySummary:
        'Koraidon, Kyogre, Arceus Extreme Killer, Ting-Lu, Ho-Oh y Zacian-Crowned en máxima potencia Nivel 100.',
      paste: `Koraidon @ Choice Scarf
Ability: Orichalcum Pulse
Tera Type: Fire
EVs: 252 Atk / 4 Def / 252 Spe
Jolly Nature
- Low Kick
- Flare Blitz
- Dragon Claw
- U-turn

Kyogre @ Choice Specs
Ability: Drizzle
Tera Type: Water
EVs: 252 SpA / 4 SpD / 252 Spe
Timid Nature
IVs: 0 Atk
- Water Spout
- Origin Pulse
- Ice Beam
- Thunder

Arceus @ Heavy-Duty Boots
Ability: Multitype
Tera Type: Normal
EVs: 240 HP / 252 Atk / 16 Spe
Adamant Nature
- Extreme Speed
- Shadow Claw
- Swords Dance
- Recover

Zacian-Crowned @ Rusted Sword
Ability: Intrepid Sword
Tera Type: Flying
EVs: 252 Atk / 4 Def / 252 Spe
Jolly Nature
- Behemoth Blade
- Play Rough
- Wild Charge
- Swords Dance

Ho-Oh @ Heavy-Duty Boots
Ability: Regenerator
Tera Type: Fairy
EVs: 248 HP / 252 Def / 8 SpD
Impish Nature
- Sacred Fire
- Brave Bird
- Whirlwind
- Recover

Ting-Lu @ Leftovers
Ability: Vessel of Ruin
Tera Type: Poison
EVs: 252 HP / 4 Def / 252 SpD
Careful Nature
- Earthquake
- Ruination
- Stealth Rock
- Spikes`,
    },
  ],
  'gen9doublescustomgame@@@NatDex Mod': [
    {
      keywords: ['natdex', 'mega', 'z', 'rayquaza', 'todo', 'dobles'],
      teamName: 'Trinidad NatDex · Mega + Z + Tera (Dobles)',
      strategySummary:
        'Charizard Mega-Y + Rayquaza-Mega con Firium Z + Shedinja Tera Eléctrico conviviendo en el mismo ecosistema NatDex Dobles.',
      paste: `Charizard @ Charizardite Y
Ability: Blaze
Level: 100
Tera Type: Fire
EVs: 4 HP / 252 SpA / 252 Spe
Timid Nature
- Heat Wave
- Solar Beam
- Air Slash
- Protect

Rayquaza-Mega @ Firium Z
Ability: Delta Stream
Level: 100
Tera Type: Normal
EVs: 4 HP / 252 Atk / 252 Spe
Jolly Nature
- Dragon Ascent
- V-create
- Extreme Speed
- Protect

Shedinja @ Heavy-Duty Boots
Ability: Wonder Guard
Level: 100
Tera Type: Electric
EVs: 252 Atk / 252 Spe
Adamant Nature
- Poltergeist
- Shadow Sneak
- Will-O-Wisp
- Protect

Incineroar @ Sitrus Berry
Ability: Intimidate
Level: 100
Tera Type: Ghost
EVs: 244 HP / 128 Def / 136 SpD
Careful Nature
- Fake Out
- Flare Blitz
- Knock Off
- Parting Shot

Miraidon @ Choice Specs
Ability: Hadron Engine
Level: 100
Tera Type: Fairy
EVs: 4 HP / 252 SpA / 252 Spe
Timid Nature
- Electro Drift
- Draco Meteor
- Dazzling Gleam
- Volt Switch

Zacian-Crowned @ Rusted Sword
Ability: Intrepid Sword
Level: 100
Tera Type: Fairy
EVs: 4 HP / 252 Atk / 252 Spe
Jolly Nature
- Behemoth Blade
- Play Rough
- Sacred Sword
- Protect`,
    },
  ],
  'gen9customgame@@@NatDex Mod': [
    {
      keywords: ['natdex', 'mega', 'z', 'rayquaza', 'todo', 'singles'],
      teamName: 'Trinidad NatDex · Mega + Z + Tera (Singles)',
      strategySummary:
        'Ecosistema completo National Dex Singles: Mega-Charizard Y, Rayquaza-Mega con Cristal Z, Shedinja Tera Eléctrico y Ubers sin banlist.',
      paste: `Charizard @ Charizardite Y
Ability: Blaze
Level: 100
Tera Type: Fire
EVs: 4 HP / 252 SpA / 252 Spe
Timid Nature
- Flamethrower
- Solar Beam
- Scorching Sands
- Roost

Rayquaza-Mega @ Firium Z
Ability: Delta Stream
Level: 100
Tera Type: Normal
EVs: 4 HP / 252 Atk / 252 Spe
Jolly Nature
- Dragon Ascent
- V-create
- Extreme Speed
- Swords Dance

Shedinja @ Heavy-Duty Boots
Ability: Wonder Guard
Level: 100
Tera Type: Electric
EVs: 252 Atk / 252 Spe
Adamant Nature
- Poltergeist
- Shadow Sneak
- Will-O-Wisp
- Protect

Zacian-Crowned @ Rusted Sword
Ability: Intrepid Sword
Level: 100
Tera Type: Fairy
EVs: 4 HP / 252 Atk / 252 Spe
Jolly Nature
- Behemoth Blade
- Play Rough
- Close Combat
- Swords Dance

Miraidon @ Choice Specs
Ability: Hadron Engine
Level: 100
Tera Type: Electric
EVs: 4 HP / 252 SpA / 252 Spe
Timid Nature
- Electro Drift
- Draco Meteor
- Overheat
- Volt Switch

Eternatus @ Leftovers
Ability: Pressure
Level: 100
Tera Type: Fairy
EVs: 252 HP / 252 Def / 4 Spe
Bold Nature
- Dynamax Cannon
- Flamethrower
- Toxic
- Recover`,
    },
  ],
};

function selectOfflinePreset(
  formatId: SupportedFormatId,
  prompt: string,
  excludeTeamName?: string
): OfflineTeamPreset {
  const list = OFFLINE_PRESETS[formatId] ?? OFFLINE_PRESETS.gen9ou;
  const norm = normalizePromptKey(prompt);
  let best = list[0];
  let bestScore = -1;

  for (const preset of list) {
    let score = 0;
    for (const kw of preset.keywords) {
      if (norm.includes(kw)) score += 10;
    }
    if (excludeTeamName && preset.teamName === excludeTeamName) {
      score -= 5;
    }
    if (score > bestScore) {
      bestScore = score;
      best = preset;
    }
  }
  return best;
}

/* ================= Main Self-Healing Generation Pipeline ================= */

const TEAM_JSON_SCHEMA = {
  type: 'object',
  properties: {
    teamName: { type: 'string' },
    strategySummary: { type: 'string' },
    pokemon: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          species: { type: 'string' },
          item: { type: 'string' },
          ability: { type: 'string' },
          teraType: { type: 'string' },
          nature: { type: 'string' },
          evs: {
            type: 'object',
            properties: {
              hp: { type: 'integer' },
              atk: { type: 'integer' },
              def: { type: 'integer' },
              spa: { type: 'integer' },
              spd: { type: 'integer' },
              spe: { type: 'integer' },
            },
          },
          ivs: {
            type: 'object',
            properties: {
              hp: { type: 'integer' },
              atk: { type: 'integer' },
              def: { type: 'integer' },
              spa: { type: 'integer' },
              spd: { type: 'integer' },
              spe: { type: 'integer' },
            },
          },
          moves: {
            type: 'array',
            items: { type: 'string' },
          },
        },
        required: ['species', 'item', 'ability', 'nature', 'moves'],
      },
    },
  },
  required: ['teamName', 'strategySummary', 'pokemon'],
};

export interface TeamGenerationResult {
  team: SavedVersusTeam;
  fromCache: boolean;
  attempts: number;
  repairedErrors: string[];
  usedOfflineFallback: boolean;
  fallbackReason?: string;
}

export async function generateValidatedTeam(options: {
  formatId: SupportedFormatId;
  prompt: string;
  settings: AISettings;
  bypassCache?: boolean;
  excludeOfflineName?: string;
  onProgress?: (statusText: string) => void;
}): Promise<TeamGenerationResult> {
  const {
    formatId,
    prompt,
    settings,
    bypassCache = false,
    excludeOfflineName,
    onProgress,
  } = options;
  const spec = getVersusFormatSpec(formatId);
  const cleanPrompt = prompt.trim() || `Equipo competitivo balanceado para ${spec.name}`;

  // 1. Cache lookup in localStorage
  if (!bypassCache) {
    const cached = findCachedTeam(formatId, cleanPrompt);
    if (cached) {
      const recheck = validatePasteForFormat(formatId, cached.paste);
      if (recheck.valid) {
        onProgress?.('⚡ Equipo recuperado al instante desde caché local.');
        return {
          team: cached,
          fromCache: true,
          attempts: 0,
          repairedErrors: [],
          usedOfflineFallback: cached.source === 'offline-demo',
        };
      }
    }
  }

  // 2. Offline / Demo mode (no live LLM configured)
  if (!isLiveLLMConfigured(settings)) {
    onProgress?.('Modo Offline activo: seleccionando arquetipo legal verificado...');
    const preset = selectOfflinePreset(formatId, cleanPrompt, excludeOfflineName);
    const check = validatePasteForFormat(formatId, preset.paste);
    const team: SavedVersusTeam = {
      id: `team-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      formatId,
      prompt: cleanPrompt,
      normalizedPrompt: normalizePromptKey(cleanPrompt),
      teamName: preset.teamName,
      strategySummary: preset.strategySummary,
      paste: preset.paste.trim(),
      species: check.sets.map((s) => s.species),
      source: 'offline-demo',
      createdAt: new Date().toISOString(),
    };
    saveTeamToLibrary(team);
    return {
      team,
      fromCache: false,
      attempts: 1,
      repairedErrors: [],
      usedOfflineFallback: true,
    };
  }

  // 3. Live LLM Generation + Self-Healing TeamValidator Loop (up to 3 attempts)
  const validator = new TeamValidator(formatId);
  const maxAttempts = 3;
  const allRepairedErrors: string[] = [];
  let lastErrors: string[] = [];
  let lastPaste = '';
  let lastProvider: 'gemini' | 'ollama' =
    settings.provider === 'ollama' ? 'ollama' : 'gemini';

  const systemInstruction = [
    'Eres un Teambuilder competitivo experto de Pokémon Showdown (Generación 9).',
    `Formato exacto de @pkmn/sim: "${formatId}" (${spec.name}).`,
    `Reglas clave: ${spec.rulesHint}`,
    `Debes devolver EXACTAMENTE ${spec.teamSize} Pokémon distintos (sin repetir especie) a Nivel ${spec.defaultLevel}.`,
    'Todos los nombres de especies, objetos, habilidades, naturalezas y movimientos DEBEN ir en inglés oficial de Pokémon Showdown.',
    'La suma de EVs de cada Pokémon debe ser <= 508 (cada stat 0..252).',
    'No inventes movimientos ni habilidades ilegales ni Pokémon baneados en este formato.',
    formatId === 'gen9vgc2024regg'
      ? 'REGLA VGC REG G: Máximo 1 legendario restringido (ej. Miraidon, Koraidon, Calyrex-Ice, Calyrex-Shadow, Kyogre, Groudon, Terapagos, Zamazenta-Crowned) y NO repitas objetos (Item Clause).'
      : '',
    formatId === 'gen9monotype'
      ? 'REGLA MONOTYPE: Los 6 Pokémon deben compartir exactamente el mismo tipo elemental.'
      : '',
    formatId === 'gen9lc'
      ? 'REGLA LITTLE CUP: Solo preevoluciones básicas legales en Gen 9 LC a Nivel 5.'
      : '',
  ]
    .filter(Boolean)
    .join('\n');

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    onProgress?.(
      attempt === 1
        ? `Consultando al estratega (${settings.provider === 'gemini' ? settings.geminiModel : settings.ollamaModel})...`
        : `Autocuración (${attempt}/${maxAttempts}): corrigiendo ${lastErrors.length} error(es) de TeamValidator...`
    );

    const userPrompt =
      attempt === 1
        ? `Concepto pedido por el jugador (en español o inglés):\n"${cleanPrompt}"\n\nConstruye un equipo 100% legal en "${formatId}" con exactamente ${spec.teamSize} Pokémon y responde SOLO el JSON pedido.`
        : `Tu equipo anterior para "${formatId}" falló la validación oficial de @pkmn/sim TeamValidator.\n\nIdea original del jugador: "${cleanPrompt}"\n\nEquipo anterior:\n${lastPaste}\n\nERRORES EXACTOS DE LEGALIDAD QUE DEBES CORREGIR:\n- ${lastErrors.join('\n- ')}\n\nCorrige TODOS estos errores (reemplaza Pokémon baneados, objetos duplicados o movimientos/habilidades ilegales) manteniendo la estrategia del jugador y devuelve el JSON completo corregido.`;

    try {
      const llmRes = await callStructuredLLM<RawAITeamResponse>({
        settings,
        systemInstruction,
        userPrompt,
        jsonSchema: TEAM_JSON_SCHEMA,
        temperature: attempt === 1 ? 0.55 : 0.25,
      });
      lastProvider = llmRes.provider;

      onProgress?.(`Validando legalidad con TeamValidator (${formatId})...`);

      let sets: PokemonSet[] = [];
      if (Array.isArray(llmRes.data.pokemon) && llmRes.data.pokemon.length > 0) {
        sets = sanitizeRawMembersToSets(llmRes.data.pokemon, spec);
      } else if (typeof llmRes.data.showdownPaste === 'string') {
        sets = Teams.import(llmRes.data.showdownPaste) ?? [];
      }

      if (sets.length !== spec.teamSize) {
        lastErrors = [
          `Se requieren exactamente ${spec.teamSize} Pokémon válidos, pero solo se obtuvieron ${sets.length}.`,
        ];
        allRepairedErrors.push(...lastErrors);
        lastPaste = Teams.export(sets);
        continue;
      }

      const problems = validator.validateTeam(sets);
      lastPaste = Teams.export(sets).trim();

      if (!problems || problems.length === 0) {
        const team: SavedVersusTeam = {
          id: `team-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          formatId,
          prompt: cleanPrompt,
          normalizedPrompt: normalizePromptKey(cleanPrompt),
          teamName: llmRes.data.teamName?.trim() || `Equipo ${spec.shortLabel}`,
          strategySummary:
            llmRes.data.strategySummary?.trim() ||
            `Generado para "${cleanPrompt}" y verificado con TeamValidator.`,
          paste: lastPaste,
          species: sets.map((s) => s.species),
          source: lastProvider,
          createdAt: new Date().toISOString(),
        };
        saveTeamToLibrary(team);
        onProgress?.('✅ ¡Equipo 100% legal certificado y guardado en caché!');
        return {
          team,
          fromCache: false,
          attempts: attempt,
          repairedErrors: allRepairedErrors,
          usedOfflineFallback: false,
        };
      }

      lastErrors = problems;
      allRepairedErrors.push(...problems);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      lastErrors = [msg];
      allRepairedErrors.push(msg);
      // If auth/network error, no point retrying 3 times
      if (
        msg.includes('API Key') ||
        msg.includes('401') ||
        msg.includes('403') ||
        msg.includes('Failed to fetch') ||
        msg.includes('ECONNREFUSED')
      ) {
        break;
      }
    }
  }

  // Graceful fallback to guaranteed TeamValidator-legal preset so gameplay never dead-ends
  onProgress?.('⚠️ Usando arquetipo legal de respaldo verificado...');
  const preset = selectOfflinePreset(formatId, cleanPrompt, excludeOfflineName);
  const check = validatePasteForFormat(formatId, preset.paste);
  const fallbackTeam: SavedVersusTeam = {
    id: `team-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    formatId,
    prompt: cleanPrompt,
    normalizedPrompt: normalizePromptKey(cleanPrompt),
    teamName: `${preset.teamName} (Respaldo)`,
    strategySummary: preset.strategySummary,
    paste: preset.paste.trim(),
    species: check.sets.map((s) => s.species),
    source: 'offline-demo',
    createdAt: new Date().toISOString(),
  };
  return {
    team: fallbackTeam,
    fromCache: false,
    attempts: maxAttempts,
    repairedErrors: allRepairedErrors,
    usedOfflineFallback: true,
    fallbackReason: lastErrors[0] ?? 'No se pudo validar el equipo en 3 intentos.',
  };
}
