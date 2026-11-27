import { Dex } from '@pkmn/sim';
import type { WorldBlocId } from '../data/worldGeopolitics';
import type {
  BattleDifficultyMode,
  CustomTeamMember,
  PlayerSaveProfile,
} from '../types/game';
import { getLegalLearnsetForSpecies, getSpeciesKey } from './learnsetService';

/* ===================== 1. Smogon Tier + BST + Broken Ability Tax Pricing ===================== */

export type SmogonPriceBand =
  | 'Uber / AG'
  | 'OU'
  | 'UU / UUBL'
  | 'RU / NU'
  | 'PU / ZU'
  | 'LC';

export interface PokemonShopPricing {
  species: string;
  bst: number;
  rawTier: string;
  tierBand: SmogonPriceBand;
  tierMultiplier: number;
  taxedAbility: string | null;
  abilityTax: number;
  basePrice: number;
  finalPrice: number;
  breakdownText: string;
}

export const BROKEN_ABILITY_TAX_MAP: Record<string, number> = {
  // +300 PC — Game-warping cheese / trapping / copy abilities
  'wonder guard': 300,
  imposter: 300,
  moody: 300,
  'shadow tag': 300,

  // +200 PC — High-impact speed / power / priority multipliers
  'huge power': 200,
  'pure power': 200,
  prankster: 200,
  'speed boost': 200,
  'magic bounce': 200,

  // +150 PC — Premier defensive / tempo staples
  intimidate: 150,
  regenerator: 150,
  unaware: 150,
  protean: 150,
  libero: 150,
};

export function computePokemonBst(speciesName: string): number {
  const sp = Dex.species.get(speciesName);
  if (!sp || !sp.exists || !sp.baseStats) return 420;
  const b = sp.baseStats;
  return b.hp + b.atk + b.def + b.spa + b.spd + b.spe;
}

function classifyTierMultiplier(
  rawTier: string,
  bst: number
): { tierBand: SmogonPriceBand; tierMultiplier: number } {
  const clean = (rawTier || '').replace(/[()]/g, '').trim().toUpperCase();
  if (clean === 'AG' || clean === 'UBER' || clean === 'UBERS') {
    return { tierBand: 'Uber / AG', tierMultiplier: 2.0 };
  }
  if (clean === 'OU' || clean === 'OUBL') {
    return { tierBand: 'OU', tierMultiplier: 1.5 };
  }
  if (clean === 'UU' || clean === 'UUBL') {
    return { tierBand: 'UU / UUBL', tierMultiplier: 1.2 };
  }
  if (
    clean === 'RU' ||
    clean === 'RUBL' ||
    clean === 'NU' ||
    clean === 'NUBL'
  ) {
    return { tierBand: 'RU / NU', tierMultiplier: 0.9 };
  }
  if (clean === 'LC') {
    return { tierBand: 'LC', tierMultiplier: 0.4 };
  }
  if (
    clean === 'PU' ||
    clean === 'PUBL' ||
    clean === 'ZU' ||
    clean === 'NFE' ||
    clean === 'UNTIERED'
  ) {
    return { tierBand: 'PU / ZU', tierMultiplier: 0.6 };
  }
  // Fallback for dexit / Illegal / custom formes based on BST
  if (bst >= 660) return { tierBand: 'Uber / AG', tierMultiplier: 2.0 };
  if (bst >= 570) return { tierBand: 'OU', tierMultiplier: 1.5 };
  if (bst >= 510) return { tierBand: 'UU / UUBL', tierMultiplier: 1.2 };
  if (bst >= 440) return { tierBand: 'RU / NU', tierMultiplier: 0.9 };
  if (bst >= 340) return { tierBand: 'PU / ZU', tierMultiplier: 0.6 };
  return { tierBand: 'LC', tierMultiplier: 0.4 };
}

export function getBrokenAbilityTaxInfo(
  speciesName: string,
  preferredAbility?: string
): { taxedAbility: string | null; abilityTax: number } {
  const sp = Dex.species.get(speciesName);
  const candidates: string[] = [];
  if (preferredAbility) {
    candidates.push(preferredAbility);
  }
  if (sp && sp.exists && sp.abilities) {
    for (const ab of Object.values(sp.abilities)) {
      if (typeof ab === 'string' && ab) candidates.push(ab);
    }
  }

  let bestAbility: string | null = null;
  let bestTax = 0;
  for (const ab of candidates) {
    const tax = BROKEN_ABILITY_TAX_MAP[ab.toLowerCase()] ?? 0;
    if (tax > bestTax) {
      bestTax = tax;
      bestAbility = ab;
    }
  }
  return { taxedAbility: bestAbility, abilityTax: bestTax };
}

/**
 * Computes the official Crown of Galar Black Market price for ANY species in @pkmn/sim:
 *   Price (PC) = Math.floor(BST * Smogon_Tier_Multiplier) + Broken_Ability_Tax
 */
export function computePokemonShopPricing(
  speciesName: string,
  preferredAbility?: string
): PokemonShopPricing {
  const sp = Dex.species.get(speciesName);
  const canonicalName = sp.exists ? sp.name : speciesName;
  const bst = computePokemonBst(canonicalName);

  const primaryTier =
    sp.exists && sp.tier && sp.tier !== 'Illegal' && sp.tier !== 'Unreleased'
      ? sp.tier
      : sp.exists && sp.natDexTier && sp.natDexTier !== 'Illegal'
        ? sp.natDexTier
        : sp.exists && sp.doublesTier && sp.doublesTier !== 'Illegal'
          ? sp.doublesTier
          : sp.exists
            ? sp.tier || 'Untiered'
            : 'Untiered';

  const { tierBand, tierMultiplier } = classifyTierMultiplier(primaryTier, bst);
  const { taxedAbility, abilityTax } = getBrokenAbilityTaxInfo(
    canonicalName,
    preferredAbility
  );
  const basePrice = Math.floor(bst * tierMultiplier);
  const finalPrice = basePrice + abilityTax;

  const breakdownText =
    abilityTax > 0 && taxedAbility
      ? `⌊${bst} BST × ${tierMultiplier}x (${tierBand})⌋ + ${abilityTax} PC (${taxedAbility})`
      : `⌊${bst} BST × ${tierMultiplier}x (${tierBand})⌋`;

  return {
    species: canonicalName,
    bst,
    rawTier: primaryTier,
    tierBand,
    tierMultiplier,
    taxedAbility,
    abilityTax,
    basePrice,
    finalPrice,
    breakdownText,
  };
}

/* ===================== 2. Casualty Indemnification (85% Default / 95% Mesoa R1) ===================== */

export interface CasualtyIndemnificationEntry {
  species: string;
  bst: number;
  shopPrice: number;
  payout: number;
}

export interface CasualtyIndemnificationResult {
  totalPayout: number;
  grossValue: number;
  taxRate: number;
  taxAmount: number;
  entries: CasualtyIndemnificationEntry[];
}

export function computeCasualtyIndemnification(
  fallen: Array<{ species: string; ability?: string }>,
  taxRate = 0.15
): CasualtyIndemnificationResult {
  const safeTax = Math.max(0, Math.min(0.5, taxRate));
  const entries: CasualtyIndemnificationEntry[] = [];
  let grossValue = 0;

  for (const mon of fallen) {
    const pricing = computePokemonShopPricing(mon.species, mon.ability);
    const payout = Math.floor(pricing.finalPrice * (1 - safeTax));
    grossValue += pricing.finalPrice;
    entries.push({
      species: pricing.species,
      bst: pricing.bst,
      shopPrice: pricing.finalPrice,
      payout,
    });
  }

  const totalPayout = entries.reduce((sum, e) => sum + e.payout, 0);
  const taxAmount = Math.max(0, grossValue - totalPayout);

  return {
    totalPayout,
    grossValue,
    taxRate: safeTax,
    taxAmount,
    entries,
  };
}

/* ===================== 3. Imperial License Laws (Dynamic Team Total BST Cap by Act + Difficulty) ===================== */

export interface ImperialBstLicense {
  actNumber: 1 | 2 | 3 | 4 | 5;
  actLabel: string;
  shortLabel: string;
  difficultyUsed: BattleDifficultyMode;
  difficultyDeltaLabel: string;
  baseActCap: number | null;
  maxTeamBst: number | null; // null = unlimited (Baby Mode / Clímax / Postgame / Dev Mode)
  currentPartyBst: number;
  isOverCap: boolean;
  remainingBst: number | null;
  nextActUnlockHint: string;
}

export function getImperialBstLicense(
  profile: PlayerSaveProfile,
  difficultyOverride?: BattleDifficultyMode
): ImperialBstLicense {
  const completedCount = Object.values(profile.completedChapters).filter(
    (c) => c?.completed
  ).length;
  const isDone = (id: string) => Boolean(profile.completedChapters[id]?.completed);
  const partyMons = profile.pokemonBox.filter((m) => m.zone === 'party');
  const currentPartyBst = partyMons.reduce(
    (sum, m) => sum + computePokemonBst(m.species),
    0
  );
  const effDiff: BattleDifficultyMode =
    difficultyOverride ?? profile.defaultDifficulty ?? 'kaizo';

  const reachedClimax =
    profile.devModeEnabled ||
    Boolean(profile.mainStoryCleared) ||
    isDone('ch11-poketopia-traitor-council') ||
    isDone('ch12-bastard-brother-climax') ||
    completedCount >= 12;

  if (reachedClimax) {
    return {
      actNumber: 5,
      actLabel: 'Clímax y Postgame · Sin Restricción Imperial',
      shortLabel: 'Sin Límite (∞ BST)',
      difficultyUsed: effDiff,
      difficultyDeltaLabel: profile.devModeEnabled
        ? 'Dev Mode (∞)'
        : 'Clímax / Postgame (∞)',
      baseActCap: null,
      maxTeamBst: null,
      currentPartyBst,
      isOverCap: false,
      remainingBst: null,
      nextActUnlockHint:
        'Licencia total activa: Ubers, Mega-Rayquaza y Legendarios habilitados sin tope BST.',
    };
  }

  // 4-Act Campaign Escalation Ladder (Base Normal Cap; Tryhard = -300 -> 2,700 / 3,000 / 3,300 / 3,600):
  //  - Acto I (La Fuga): Base 3,000 (Difícil 2,850 · Tryhard 2,700)
  //  - Acto II (El Exilio): Base 3,300 (Difícil 3,150 · Tryhard 3,000)
  //  - Acto III (La Herida Imperial): Base 3,600 (Difícil 3,450 · Tryhard 3,300)
  //  - Acto IV (El Regreso): Base 3,900 (Difícil 3,750 · Tryhard 3,600)
  const actInfo: {
    actNumber: 1 | 2 | 3 | 4;
    roman: 'I' | 'II' | 'III' | 'IV';
    actLabel: string;
    baseCap: number;
    nextHint: string;
  } =
    isDone('ch9-aeos-ditto-blacksite') || completedCount >= 9
      ? {
          actNumber: 4,
          roman: 'IV',
          actLabel: 'Acto IV: El Regreso · Licencia de Coalición',
          baseCap: 3900,
          nextHint:
            'Derrota al Consejo Traidor en Pokétopia (Cap. 11) para abolir el límite BST en el Clímax.',
        }
      : isDone('challenge-three-knights') || completedCount >= 6
        ? {
            actNumber: 3,
            roman: 'III',
            actLabel: 'Acto III: La Herida Imperial · Licencia de Asalto',
            baseCap: 3600,
            nextHint:
              'Completa el Black Site de Isla Æos (Cap. 09) para ascender al Acto IV (Tryhard 3,600 BST).',
          }
        : isDone('showcase-triples-phalanx') || completedCount >= 3
          ? {
              actNumber: 2,
              roman: 'II',
              actLabel: 'Acto II: El Exilio · Licencia Global',
              baseCap: 3300,
              nextHint:
                'Supera Cordelia (Tres Caballeros) para abrir el Acto III (Tryhard 3,300 BST).',
            }
          : {
              actNumber: 1,
              roman: 'I',
              actLabel: 'Acto I: La Fuga · Licencia de Escape',
              baseCap: 3000,
              nextHint: `Supera ${Math.max(1, 3 - completedCount)} capítulo(s) o el Paso de los Pirineos para subir al Acto II (Tryhard 3,000 BST).`,
            };

  // Dynamic Difficulty Modifier:
  //  - Baby Mode: NO CAP (∞ BST)
  //  - Normal: Base Act Cap (3,000 / 3,300 / 3,600 / 3,900)
  //  - Difícil (Kaizo): Strict Cap (-150 BST -> 2,850 / 3,150 / 3,450 / 3,750)
  //  - Tryhard (Diablo): Brutal Cap (-300 BST -> 2,700 / 3,000 / 3,300 / 3,600)
  if (effDiff === 'baby') {
    return {
      actNumber: actInfo.actNumber,
      actLabel: `${actInfo.actLabel} · Baby Mode`,
      shortLabel: `Acto ${actInfo.roman} · Sin Cap (Baby Mode)`,
      difficultyUsed: effDiff,
      difficultyDeltaLabel: 'Sin Cap (Baby Mode)',
      baseActCap: actInfo.baseCap,
      maxTeamBst: null,
      currentPartyBst,
      isOverCap: false,
      remainingBst: null,
      nextActUnlockHint:
        'Baby Mode elimina el límite de BST: lleva a tus favoritos desde el Capítulo 1 sin restricciones.',
    };
  }

  const diffDelta =
    effDiff === 'nightmare' ? -300 : effDiff === 'kaizo' ? -150 : 0;
  const difficultyDeltaLabel =
    effDiff === 'nightmare'
      ? 'Tryhard (-300 BST)'
      : effDiff === 'kaizo'
        ? 'Difícil (-150 BST)'
        : 'Normal (Base)';
  const cap = actInfo.baseCap + diffDelta;

  return {
    actNumber: actInfo.actNumber,
    actLabel: `${actInfo.actLabel} · ${difficultyDeltaLabel}`,
    shortLabel: `Acto ${actInfo.roman} · Cap ${cap.toLocaleString()} BST`,
    difficultyUsed: effDiff,
    difficultyDeltaLabel,
    baseActCap: actInfo.baseCap,
    maxTeamBst: cap,
    currentPartyBst,
    isOverCap: currentPartyBst > cap,
    remainingBst: cap - currentPartyBst,
    nextActUnlockHint:
      effDiff === 'nightmare'
        ? `Modo Tryhard fija ${cap.toLocaleString()} BST en Acto ${actInfo.roman}: combina carries con soportes LC/PU. ${actInfo.nextHint}`
        : effDiff === 'kaizo'
          ? `Modo Difícil fija ${cap.toLocaleString()} BST en Acto ${actInfo.roman}. ${actInfo.nextHint}`
          : actInfo.nextHint,
  };
}

/* ===================== 4. Biogeographical Fauna Pools (18 World Blocs) ===================== */

export interface RegionalFaunaEntry {
  species: string;
  role: 'utility' | 'offense';
}

export const REGIONAL_FAUNA_POOLS: Record<WorldBlocId, RegionalFaunaEntry[]> = {
  galar_empire: [
    { species: 'Corviknight', role: 'utility' },
    { species: 'Grimmsnarl', role: 'utility' },
    { species: 'Klefki', role: 'utility' },
    { species: 'Murkrow', role: 'utility' },
    { species: 'Maushold', role: 'utility' },
    { species: 'Ditto', role: 'utility' },
    { species: 'Weezing-Galar', role: 'utility' },
    { species: 'Aegislash', role: 'offense' },
    { species: 'Gardevoir', role: 'offense' },
    { species: 'Ceruledge', role: 'offense' },
    { species: 'Hatterene', role: 'offense' },
    { species: 'Gengar', role: 'offense' },
    { species: 'Dragapult', role: 'offense' },
    { species: 'Toxtricity', role: 'offense' },
  ],
  kalos: [
    { species: 'Klefki', role: 'utility' },
    { species: 'Meowstic', role: 'utility' },
    { species: 'Sableye', role: 'utility' },
    { species: 'Gourgeist', role: 'utility' },
    { species: 'Florges', role: 'utility' },
    { species: 'Talonflame', role: 'utility' },
    { species: 'Aegislash', role: 'offense' },
    { species: 'Greninja', role: 'offense' },
    { species: 'Goodra', role: 'offense' },
    { species: 'Sylveon', role: 'offense' },
    { species: 'Hawlucha', role: 'offense' },
    { species: 'Mawile', role: 'offense' },
  ],
  paldea: [
    { species: 'Clodsire', role: 'utility' },
    { species: 'Tinkaton', role: 'utility' },
    { species: 'Garganacl', role: 'utility' },
    { species: 'Glimmora', role: 'utility' },
    { species: 'Murkrow', role: 'utility' },
    { species: 'Maushold', role: 'utility' },
    { species: 'Cyclizar', role: 'utility' },
    { species: 'Annihilape', role: 'offense' },
    { species: 'Kingambit', role: 'offense' },
    { species: 'Gholdengo', role: 'offense' },
    { species: 'Ceruledge', role: 'offense' },
    { species: 'Armarouge', role: 'offense' },
  ],
  aztlan_caribe: [
    { species: 'Drowzee', role: 'utility' },
    { species: 'Munna', role: 'utility' },
    { species: 'Smeargle', role: 'utility' },
    { species: 'Cottonee', role: 'utility' },
    { species: 'Quagsire', role: 'utility' },
    { species: 'Sableye', role: 'utility' },
    { species: 'Toxicroak', role: 'utility' },
    { species: 'Hawlucha', role: 'offense' },
    { species: 'Ludicolo', role: 'offense' },
    { species: 'Skeledirge', role: 'offense' },
    { species: 'Chandelure', role: 'offense' },
    { species: 'Toucannon', role: 'offense' },
    { species: 'Heracross', role: 'offense' },
  ],
  amazonia_veracruz: [
    { species: 'Drowzee', role: 'utility' },
    { species: 'Munna', role: 'utility' },
    { species: 'Quagsire', role: 'utility' },
    { species: 'Tropius', role: 'utility' },
    { species: 'Cottonee', role: 'utility' },
    { species: 'Tangrowth', role: 'utility' },
    { species: 'Smeargle', role: 'utility' },
    { species: 'Heracross', role: 'offense' },
    { species: 'Toucannon', role: 'offense' },
    { species: 'Rillaboom', role: 'offense' },
    { species: 'Breloom', role: 'offense' },
    { species: 'Venusaur', role: 'offense' },
    { species: 'Ludicolo', role: 'offense' },
  ],
  andes_plata: [
    { species: 'Torkoal', role: 'utility' },
    { species: 'Garganacl', role: 'utility' },
    { species: 'Skarmory', role: 'utility' },
    { species: 'Gliscor', role: 'utility' },
    { species: 'Empoleon', role: 'utility' },
    { species: 'Bronzong', role: 'utility' },
    { species: 'Ursaluna', role: 'offense' },
    { species: 'Hatterene', role: 'offense' },
    { species: 'Lycanroc', role: 'offense' },
    { species: 'Noivern', role: 'offense' },
    { species: 'Honchkrow', role: 'offense' },
    { species: 'Tyranitar', role: 'offense' },
  ],
  poke_africa: [
    { species: 'Hippowdon', role: 'utility' },
    { species: 'Farigiraf', role: 'utility' },
    { species: 'Cofagrigus', role: 'utility' },
    { species: 'Mandibuzz', role: 'utility' },
    { species: 'Donphan', role: 'utility' },
    { species: 'Oranguru', role: 'utility' },
    { species: 'Pyroar', role: 'offense' },
    { species: 'Krookodile', role: 'offense' },
    { species: 'Zebstrika', role: 'offense' },
    { species: 'Heliolisk', role: 'offense' },
    { species: 'Rhyperior', role: 'offense' },
    { species: 'Espathra', role: 'offense' },
  ],
  free_savanna: [
    { species: 'Hippowdon', role: 'utility' },
    { species: 'Farigiraf', role: 'utility' },
    { species: 'Oranguru', role: 'utility' },
    { species: 'Donphan', role: 'utility' },
    { species: 'Mandibuzz', role: 'utility' },
    { species: 'Pyroar', role: 'offense' },
    { species: 'Zebstrika', role: 'offense' },
    { species: 'Passimian', role: 'offense' },
    { species: 'Breloom', role: 'offense' },
    { species: 'Krookodile', role: 'offense' },
    { species: 'Heliolisk', role: 'offense' },
    { species: 'Rillaboom', role: 'offense' },
  ],
  sand_crescent: [
    { species: 'Hippowdon', role: 'utility' },
    { species: 'Cofagrigus', role: 'utility' },
    { species: 'Mandibuzz', role: 'utility' },
    { species: 'Sigilyph', role: 'utility' },
    { species: 'Torkoal', role: 'utility' },
    { species: 'Scrafty', role: 'utility' },
    { species: 'Volcarona', role: 'offense' },
    { species: 'Flygon', role: 'offense' },
    { species: 'Krookodile', role: 'offense' },
    { species: 'Excadrill', role: 'offense' },
    { species: 'Tyranitar', role: 'offense' },
    { species: 'Cacturne', role: 'offense' },
  ],
  poke_india: [
    { species: 'Pelipper', role: 'utility' },
    { species: 'Politoed', role: 'utility' },
    { species: 'Torkoal', role: 'utility' },
    { species: 'Gothitelle', role: 'utility' },
    { species: 'Jellicent', role: 'utility' },
    { species: 'Incineroar', role: 'utility' },
    { species: 'Copperajah', role: 'offense' },
    { species: 'Medicham', role: 'offense' },
    { species: 'Alakazam', role: 'offense' },
    { species: 'Donphan', role: 'offense' },
    { species: 'Barraskewda', role: 'offense' },
    { species: 'Arbok', role: 'offense' },
  ],
  monsoon_archipelago: [
    { species: 'Pelipper', role: 'utility' },
    { species: 'Toxicroak', role: 'utility' },
    { species: 'Milotic', role: 'utility' },
    { species: 'Amoonguss', role: 'utility' },
    { species: 'Quagsire', role: 'utility' },
    { species: 'Falinks', role: 'offense' },
    { species: 'Sneasler', role: 'offense' },
    { species: 'Kommo-o', role: 'offense' },
    { species: 'Breloom', role: 'offense' },
    { species: 'Ludicolo', role: 'offense' },
    { species: 'Mienshao', role: 'offense' },
    { species: 'Scizor', role: 'offense' },
  ],
  poke_australia: [
    { species: 'Toxapex', role: 'utility' },
    { species: 'Komala', role: 'utility' },
    { species: 'Ariados', role: 'utility' },
    { species: 'Mudsdale', role: 'utility' },
    { species: 'Drapion', role: 'utility' },
    { species: 'Kangaskhan', role: 'offense' },
    { species: 'Heliolisk', role: 'offense' },
    { species: 'Krookodile', role: 'offense' },
    { species: 'Salazzle', role: 'offense' },
    { species: 'Garchomp', role: 'offense' },
    { species: 'Excadrill', role: 'offense' },
    { species: 'Cinderace', role: 'offense' },
  ],
  poke_japan: [
    { species: 'Ninetales', role: 'utility' },
    { species: 'Froslass', role: 'utility' },
    { species: 'Shedinja', role: 'utility' },
    { species: 'Ninjask', role: 'utility' },
    { species: 'Gastrodon', role: 'utility' },
    { species: 'Dusclops', role: 'utility' },
    { species: 'Gyarados', role: 'offense' },
    { species: 'Scizor', role: 'offense' },
    { species: 'Shiftry', role: 'offense' },
    { species: 'Arcanine', role: 'offense' },
    { species: 'Kingambit', role: 'offense' },
    { species: 'Bisharp', role: 'offense' },
    { species: 'Espeon', role: 'offense' },
    { species: 'Lucario', role: 'offense' },
  ],
  alola: [
    { species: 'Incineroar', role: 'utility' },
    { species: 'Comfey', role: 'utility' },
    { species: 'Toxapex', role: 'utility' },
    { species: 'Ribombee', role: 'utility' },
    { species: 'Alomomola', role: 'utility' },
    { species: 'Ninetales-Alola', role: 'utility' },
    { species: 'Primarina', role: 'offense' },
    { species: 'Decidueye', role: 'offense' },
    { species: 'Toucannon', role: 'offense' },
    { species: 'Mimikyu', role: 'offense' },
    { species: 'Araquanid', role: 'offense' },
    { species: 'Mudsdale', role: 'offense' },
  ],
  unova: [
    { species: 'Amoonguss', role: 'utility' },
    { species: 'Whimsicott', role: 'utility' },
    { species: 'Cottonee', role: 'utility' },
    { species: 'Gothitelle', role: 'utility' },
    { species: 'Reuniclus', role: 'utility' },
    { species: 'Scrafty', role: 'utility' },
    { species: 'Excadrill', role: 'offense' },
    { species: 'Volcarona', role: 'offense' },
    { species: 'Bisharp', role: 'offense' },
    { species: 'Chandelure', role: 'offense' },
    { species: 'Hydreigon', role: 'offense' },
    { species: 'Conkeldurr', role: 'offense' },
    { species: 'Zoroark', role: 'offense' },
  ],
  poke_canada: [
    { species: 'Piloswine', role: 'utility' },
    { species: 'Abomasnow', role: 'utility' },
    { species: 'Glalie', role: 'utility' },
    { species: 'Walrein', role: 'utility' },
    { species: 'Cryogonal', role: 'utility' },
    { species: 'Sneasel', role: 'utility' },
    { species: 'Mamoswine', role: 'offense' },
    { species: 'Weavile', role: 'offense' },
    { species: 'Cetitan', role: 'offense' },
    { species: 'Baxcalibur', role: 'offense' },
    { species: 'Cloyster', role: 'offense' },
    { species: 'Frosmoth', role: 'offense' },
    { species: 'Ursaring', role: 'offense' },
  ],
  northern_steppe: [
    { species: 'Piloswine', role: 'utility' },
    { species: 'Abomasnow', role: 'utility' },
    { species: 'Ninetales-Alola', role: 'utility' },
    { species: 'Froslass', role: 'utility' },
    { species: 'Glalie', role: 'utility' },
    { species: 'Mamoswine', role: 'offense' },
    { species: 'Weavile', role: 'offense' },
    { species: 'Baxcalibur', role: 'offense' },
    { species: 'Cetitan', role: 'offense' },
    { species: 'Cloyster', role: 'offense' },
    { species: 'Metagross', role: 'offense' },
    { species: 'Archaludon', role: 'offense' },
  ],
  poke_china: [
    { species: 'Snorlax', role: 'utility' },
    { species: 'Ninetales', role: 'utility' },
    { species: 'Arcanine', role: 'utility' },
    { species: 'Gyarados', role: 'utility' },
    { species: 'Mienshao', role: 'offense' },
    { species: 'Infernape', role: 'offense' },
    { species: 'Dragonite', role: 'offense' },
    { species: 'Urshifu-Rapid-Strike', role: 'offense' },
    { species: 'Pangoro', role: 'offense' },
    { species: 'Emboar', role: 'offense' },
    { species: 'Chandelure', role: 'offense' },
    { species: 'Darmanitan', role: 'offense' },
  ],
};

/**
 * Starter Black-Market Pokédex available from the beginning of a run so players
 * who lose royal guards early immediately have cheap LC / Cheese / Early-game tools
 * (plus core tactical picks) while regional chapters expand the Pokédex organically!
 */
export const STARTER_UNLOCKED_POKEDEX: string[] = [
  'Cottonee',
  'Shedinja',
  'Smeargle',
  'Ditto',
  'Ninjask',
  'Murkrow',
  'Piloswine',
  'Dusclops',
  'Bisharp',
  'Maushold',
  'Weavile',
  'Farigiraf',
  'Swellow',
  'Heracross',
  'Sceptile',
  'Pikachu',
  'Dragapult',
];

export function getAllBiomePokedexSpecies(): string[] {
  const seen = new Map<string, string>();
  for (const sp of STARTER_UNLOCKED_POKEDEX) {
    seen.set(getSpeciesKey(sp), sp);
  }
  for (const list of Object.values(REGIONAL_FAUNA_POOLS)) {
    for (const entry of list) {
      const k = getSpeciesKey(entry.species);
      if (!seen.has(k)) seen.set(k, entry.species);
    }
  }
  return Array.from(seen.values());
}

let cachedAgSpecies: string[] | null = null;

/**
 * Returns EVERY playable Pokémon & battle forme in Anything Goes directly from @pkmn/sim Dex (~1,150+ species),
 * excluding CAP/fictional/cosmetic-only clutter while preserving Megas, Regional formes, Primals, Crowned, Therian, etc.!
 */
export function getAllAnythingGoesPlayableSpecies(): string[] {
  if (cachedAgSpecies) return cachedAgSpecies;
  const result: string[] = [];
  const seen = new Set<string>();

  for (const sp of Dex.species.all()) {
    if (!sp.exists || sp.num <= 0) continue;
    if (
      sp.isNonstandard === 'CAP' ||
      sp.isNonstandard === 'Custom' ||
      sp.isNonstandard === 'Future' ||
      sp.isNonstandard === 'LGPE' ||
      sp.isNonstandard === 'Unobtainable'
    ) {
      continue;
    }
    if (sp.isCosmeticForme) continue;
    // Skip Gigantamax & Totem wrappers (Gmax isn't selectable as standalone base species in customgame)
    if (
      sp.forme === 'Gmax' ||
      sp.forme === 'Totem' ||
      sp.forme === 'Totem-Alola' ||
      sp.forme === 'Eternamax'
    ) {
      continue;
    }
    // Keep base species + genuine distinct battle formes (Mega, Primal, Regional, Crowned, Therian, Origin, etc.)
    const k = getSpeciesKey(sp.name);
    if (!seen.has(k)) {
      seen.add(k);
      result.push(sp.name);
    }
  }

  result.sort((a, b) => a.localeCompare(b));
  cachedAgSpecies = result;
  return result;
}

/**
 * Rolls 3–4 unique species from a region's fauna pool that are not yet in `alreadyUnlocked`,
 * guaranteeing at least 1 'utility' pick and 1 'offense' pick when available (prevents softlocks!).
 */
export function rollRegionalPokedexUnlocks(
  blocId: WorldBlocId,
  alreadyUnlocked: string[],
  count = 4,
  rng: () => number = Math.random
): string[] {
  const pool = REGIONAL_FAUNA_POOLS[blocId] ?? REGIONAL_FAUNA_POOLS.galar_empire;
  const ownedKeys = new Set(alreadyUnlocked.map(getSpeciesKey));
  const candidates = pool.filter((e) => !ownedKeys.has(getSpeciesKey(e.species)));
  if (candidates.length === 0) return [];

  const shuffle = <T,>(arr: T[]): T[] => {
    const copy = [...arr];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  };

  const utilities = shuffle(candidates.filter((c) => c.role === 'utility'));
  const offenses = shuffle(candidates.filter((c) => c.role === 'offense'));

  const picked: string[] = [];
  const pickedKeys = new Set<string>();
  const add = (sp: string) => {
    const k = getSpeciesKey(sp);
    if (!pickedKeys.has(k)) {
      pickedKeys.add(k);
      picked.push(sp);
    }
  };

  if (utilities.length > 0) add(utilities[0].species);
  if (offenses.length > 0 && picked.length < count) add(offenses[0].species);

  const rest = shuffle([
    ...utilities.slice(1),
    ...offenses.slice(1),
  ]);
  for (const r of rest) {
    if (picked.length >= count) break;
    add(r.species);
  }

  return picked;
}

/* ===================== 5. Competitive Preset & Smart Fallback Builder for Any Species ===================== */

const CURATED_CHEESE_AND_BIOME_BUILDS: Record<
  string,
  Omit<CustomTeamMember, 'item' | 'shiny'>
> = {
  cottonee: {
    species: 'Cottonee',
    ability: 'Prankster',
    nature: 'Timid',
    teraType: 'Ghost',
    moves: ['Tailwind', 'Encore', 'Taunt', 'Endeavor'],
  },
  shedinja: {
    species: 'Shedinja',
    ability: 'Wonder Guard',
    nature: 'Adamant',
    teraType: 'Electric',
    moves: ['Shadow Sneak', 'Will-O-Wisp', 'Endeavor', 'Protect'],
  },
  smeargle: {
    species: 'Smeargle',
    ability: 'Moody',
    nature: 'Jolly',
    teraType: 'Ghost',
    moves: ['Spore', 'Follow Me', 'Fake Out', 'Endeavor'],
  },
  ditto: {
    species: 'Ditto',
    ability: 'Imposter',
    nature: 'Jolly',
    teraType: 'Normal',
    moves: ['Transform'],
  },
  ninjask: {
    species: 'Ninjask',
    ability: 'Speed Boost',
    nature: 'Jolly',
    teraType: 'Flying',
    moves: ['Baton Pass', 'Swords Dance', 'Substitute', 'Protect'],
  },
  murkrow: {
    species: 'Murkrow',
    ability: 'Prankster',
    nature: 'Calm',
    teraType: 'Ghost',
    moves: ['Tailwind', 'Haze', 'Taunt', 'Foul Play'],
  },
  piloswine: {
    species: 'Piloswine',
    ability: 'Thick Fat',
    nature: 'Adamant',
    teraType: 'Ice',
    moves: ['Earthquake', 'Icicle Crash', 'Ice Shard', 'Protect'],
  },
  dusclops: {
    species: 'Dusclops',
    ability: 'Frisk',
    nature: 'Relaxed',
    teraType: 'Fairy',
    moves: ['Trick Room', 'Will-O-Wisp', 'Night Shade', 'Pain Split'],
  },
  bisharp: {
    species: 'Bisharp',
    ability: 'Defiant',
    nature: 'Adamant',
    teraType: 'Dark',
    moves: ['Sucker Punch', 'Iron Head', 'Throat Chop', 'Protect'],
  },
  maushold: {
    species: 'Maushold',
    ability: 'Friend Guard',
    nature: 'Jolly',
    teraType: 'Ghost',
    moves: ['Follow Me', 'Encore', 'Taunt', 'Super Fang'],
  },
  drowzee: {
    species: 'Drowzee',
    ability: 'Insomnia',
    nature: 'Calm',
    teraType: 'Psychic',
    moves: ['Trick Room', 'Thunder Wave', 'Psychic', 'Protect'],
  },
  munna: {
    species: 'Munna',
    ability: 'Telepathy',
    nature: 'Relaxed',
    teraType: 'Fairy',
    moves: ['Trick Room', 'Helping Hand', 'Moonlight', 'Psyshock'],
  },
  ninetales: {
    species: 'Ninetales',
    ability: 'Drought',
    nature: 'Timid',
    teraType: 'Fire',
    moves: ['Heat Wave', 'Will-O-Wisp', 'Solar Beam', 'Protect'],
  },
  'ninetales-alola': {
    species: 'Ninetales-Alola',
    ability: 'Snow Warning',
    nature: 'Timid',
    teraType: 'Water',
    moves: ['Aurora Veil', 'Blizzard', 'Freeze-Dry', 'Protect'],
  },
  gengar: {
    species: 'Gengar',
    ability: 'Cursed Body',
    nature: 'Timid',
    teraType: 'Ghost',
    moves: ['Shadow Ball', 'Sludge Bomb', 'Icy Wind', 'Trick'],
  },
  gothitelle: {
    species: 'Gothitelle',
    ability: 'Shadow Tag',
    nature: 'Calm',
    teraType: 'Dark',
    moves: ['Fake Out', 'Thunder Wave', 'Taunt', 'Helping Hand'],
  },
  toxicroak: {
    species: 'Toxicroak',
    ability: 'Dry Skin',
    nature: 'Jolly',
    teraType: 'Dark',
    moves: ['Fake Out', 'Drain Punch', 'Sucker Punch', 'Feint'],
  },
  hawlucha: {
    species: 'Hawlucha',
    ability: 'Unburden',
    nature: 'Adamant',
    teraType: 'Flying',
    moves: ['Acrobatics', 'Close Combat', 'Swords Dance', 'Protect'],
  },
  amoonguss: {
    species: 'Amoonguss',
    ability: 'Regenerator',
    nature: 'Calm',
    teraType: 'Water',
    moves: ['Spore', 'Rage Powder', 'Pollen Puff', 'Protect'],
  },
  whimsicott: {
    species: 'Whimsicott',
    ability: 'Prankster',
    nature: 'Timid',
    teraType: 'Ghost',
    moves: ['Tailwind', 'Encore', 'Moonblast', 'Protect'],
  },
  mamoswine: {
    species: 'Mamoswine',
    ability: 'Thick Fat',
    nature: 'Adamant',
    teraType: 'Ice',
    moves: ['Earthquake', 'Icicle Crash', 'Ice Shard', 'Protect'],
  },
  quagsire: {
    species: 'Quagsire',
    ability: 'Unaware',
    nature: 'Impish',
    teraType: 'Grass',
    moves: ['Earthquake', 'Recover', 'Toxic', 'Protect'],
  },
};

/**
 * Generates a legal, battle-ready CustomTeamMember for ANY species in @pkmn/sim,
 * checking curated builds first and dynamically synthesizing legal STAB + utility moves from Dex!
 */
export function buildSmartDefaultMemberForSpecies(
  speciesName: string,
  catalogFallback?: {
    species: string;
    defaultAbility: string;
    defaultNature: string;
    defaultTeraType: string;
    defaultMoves: string[];
  }
): CustomTeamMember {
  const key = getSpeciesKey(speciesName);
  const curated = CURATED_CHEESE_AND_BIOME_BUILDS[key];
  if (curated) {
    return {
      ...curated,
      moves: [...curated.moves],
      item: '',
      shiny: false,
    };
  }
  if (catalogFallback) {
    return {
      species: catalogFallback.species,
      item: '',
      ability: catalogFallback.defaultAbility,
      nature: catalogFallback.defaultNature,
      teraType: catalogFallback.defaultTeraType,
      moves: [...catalogFallback.defaultMoves],
      shiny: false,
    };
  }

  const sp = Dex.species.get(speciesName);
  const canonical = sp.exists ? sp.name : speciesName;
  const abilities = sp.exists
    ? Object.values(sp.abilities ?? {}).filter((a): a is string => Boolean(a))
    : [];
  // Prefer high-value taxed ability if available, else slot 0
  const preferredAb =
    abilities.find((a) => (BROKEN_ABILITY_TAX_MAP[a.toLowerCase()] ?? 0) > 0) ??
    abilities[0] ??
    'Pressure';

  const bs = sp.exists
    ? sp.baseStats
    : { hp: 80, atk: 80, def: 80, spa: 80, spd: 80, spe: 80 };
  const isPhysical = bs.atk >= bs.spa;
  const nature =
    bs.spe >= 85
      ? isPhysical
        ? 'Jolly'
        : 'Timid'
      : isPhysical
        ? 'Adamant'
        : 'Modest';
  const types = sp.exists && sp.types.length > 0 ? sp.types : ['Normal'];

  const learnset = getLegalLearnsetForSpecies(canonical, 'gen9doublescustomgame@@@NatDex Mod');
  const picked: string[] = [];
  const pickedIds = new Set<string>();

  const preferredCategory = isPhysical ? 'Physical' : 'Special';
  // 1) Pick strongest legal STAB attacks matching offensive bias
  const stabAttacks = learnset
    .filter(
      (m) =>
        m.category === preferredCategory &&
        types.includes(m.type) &&
        m.basePower >= 60 &&
        m.basePower <= 130 &&
        (m.accuracy === true || m.accuracy >= 80)
    )
    .sort((a, b) => b.basePower - a.basePower);
  for (const mv of stabAttacks) {
    if (picked.length >= 2) break;
    if (!pickedIds.has(mv.id)) {
      pickedIds.add(mv.id);
      picked.push(mv.name);
    }
  }

  // 2) Pick strong coverage attack
  const coverage = learnset
    .filter(
      (m) =>
        m.category === preferredCategory &&
        !types.includes(m.type) &&
        m.basePower >= 70 &&
        m.basePower <= 120 &&
        (m.accuracy === true || m.accuracy >= 85)
    )
    .sort((a, b) => b.basePower - a.basePower);
  if (coverage.length > 0 && picked.length < 3 && !pickedIds.has(coverage[0].id)) {
    pickedIds.add(coverage[0].id);
    picked.push(coverage[0].name);
  }

  // 3) Pick a premier support/utility move or Protect
  const utilityPrefs = [
    'Protect',
    'Fake Out',
    'Tailwind',
    'Trick Room',
    'Will-O-Wisp',
    'Thunder Wave',
    'Taunt',
    'Encore',
    'Recover',
    'Swords Dance',
    'Nasty Plot',
  ];
  for (const uName of utilityPrefs) {
    if (picked.length >= 4) break;
    const found = learnset.find((m) => m.name === uName);
    if (found && !pickedIds.has(found.id)) {
      pickedIds.add(found.id);
      picked.push(found.name);
    }
  }

  // 4) Fill remaining slots up to 4
  for (const mv of learnset) {
    if (picked.length >= 4) break;
    if (mv.basePower >= 50 && !pickedIds.has(mv.id)) {
      pickedIds.add(mv.id);
      picked.push(mv.name);
    }
  }
  if (picked.length === 0) {
    picked.push(learnset[0]?.name ?? 'Protect');
  }

  return {
    species: canonical,
    item: '',
    ability: preferredAb,
    nature,
    teraType: types[0] || 'Normal',
    moves: picked.slice(0, 4),
    shiny: false,
  };
}
