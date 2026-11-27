import { Dex, Teams, TeamValidator } from '@pkmn/sim';
import {
  CAMPAIGN_DOUBLES_FORMAT_ID,
  CAMPAIGN_SINGLES_FORMAT_ID,
  type BattleDifficultyMode,
  type PlayerSaveProfile,
  type ResolvedBattleConfig,
  type SupportedFormatId,
} from '../types/game';
import { getFormatGeneration } from './learnsetService';
import { computePokemonBst } from './pricingEngine';

/**
 * Computes total Base Stat Total (BST) across all real Pokémon in a Showdown Paste
 * (ignoring hidden `__EMPTY__` solo-padding placeholders).
 */
export function computeShowdownPasteBst(paste: string): {
  totalBst: number;
  count: number;
  topSpecies: string | null;
  topSpeciesBst: number;
} {
  let sets: ReturnType<typeof Teams.import> = null;
  try {
    sets = Teams.import(paste);
  } catch {
    sets = null;
  }
  const realSets = (sets ?? []).filter(
    (s) => s.name !== '__EMPTY__' && Boolean(s.species)
  );
  let totalBst = 0;
  let topSpecies: string | null = null;
  let topSpeciesBst = 0;

  for (const s of realSets) {
    const sp = Dex.species.get(s.species);
    const bst = computePokemonBst(sp.exists ? sp.name : s.species);
    totalBst += bst;
    if (bst > topSpeciesBst) {
      topSpeciesBst = bst;
      topSpecies = sp.exists ? sp.name : s.species;
    }
  }

  return {
    totalBst,
    count: realSets.length,
    topSpecies,
    topSpeciesBst,
  };
}

/**
 * Checks whether a Showdown team paste fails official/legacy format validation
 * (e.g., Eternatus-Eternamax pasted into `gen9monotype`, `gen9vgc2024regg`, `gen91v1`,
 * `gen9lc`, `gen1customgame`, or `gen6triplescustomgame`).
 */
export function detectStrictFormatIncompatibility(
  formatId: SupportedFormatId,
  playerPaste: string
): string | null {
  if (
    formatId === CAMPAIGN_DOUBLES_FORMAT_ID ||
    formatId === CAMPAIGN_SINGLES_FORMAT_ID
  ) {
    return null;
  }

  let sets: ReturnType<typeof Teams.import> = null;
  try {
    sets = Teams.import(playerPaste);
  } catch {
    return 'No se pudo interpretar el equipo bajo el formato oficial.';
  }
  if (!sets || sets.length === 0) return null;

  const formatGen = getFormatGeneration(formatId);
  const isLegacyGen = formatGen < 9;

  // Legacy Gen 1 / Gen 6 custom games cannot cleanly load Gen 7-9 species, Tera Types, or modern mechanics
  if (isLegacyGen) {
    for (const s of sets) {
      const sp = Dex.species.get(s.species);
      if (!sp.exists) continue;
      if (sp.gen > formatGen) {
        return `${sp.name} es de Gen ${sp.gen} (incompatible con Gen ${formatGen}).`;
      }
      if (formatGen === 1 && (sp.isMega || sp.forme === 'Primal' || s.item)) {
        return `${sp.name} usa objetos o mecánicas ausentes en Gen 1.`;
      }
      if (s.teraType && formatGen < 9) {
        return `${sp.name} trae Teracristalización (Gen 9) en formato Gen ${formatGen}.`;
      }
      if (sp.forme === 'Eternamax') {
        return `${sp.name} requiere formato NatDex Todo Vale.`;
      }
    }
  }

  // Official strict formats: run @pkmn/sim TeamValidator directly
  const isStrictOfficial =
    formatId === 'gen9monotype' ||
    formatId === 'gen9vgc2024regg' ||
    formatId === 'gen91v1' ||
    formatId === 'gen9lc' ||
    !formatId.includes('customgame');

  if (isStrictOfficial) {
    try {
      const validator = new TeamValidator(formatId);
      const problems = validator.validateTeam(sets);
      if (problems && problems.length > 0) {
        return problems[0];
      }
    } catch (err) {
      return err instanceof Error
        ? err.message
        : `El equipo no cumple las reglas estrictas de ${formatId}.`;
    }
  }

  // Even plain gen9customgame without NatDex Mod rejects Mega/Z-Moves/Dexit species
  if (
    (formatId === 'gen9doublescustomgame' || formatId === 'gen9customgame') &&
    !formatId.includes('NatDex Mod')
  ) {
    for (const s of sets) {
      const sp = Dex.species.get(s.species);
      const item = s.item ? Dex.items.get(s.item) : null;
      if (
        sp.isNonstandard === 'Past' ||
        sp.isMega ||
        sp.forme === 'Eternamax' ||
        item?.zMove ||
        item?.megaStone
      ) {
        return `${sp.name} requiere reglas NatDex Mod (Megas / Z / Dexit).`;
      }
    }
  }

  return null;
}

/**
 * Automatic NatDex Fallback ONLY for Baby Mode or Dev Mode!
 * Outside Baby/Dev Mode, official challenge formats (`gen9monotype`, `gen9vgc2024regg`, `gen91v1`, etc.)
 * remain strictly untouched.
 * Inside Baby Mode or Dev Mode, if the player's team/paste fails strict format validation
 * (e.g. pasting Eternatus-Eternamax or Mega-Rayquaza into Monotype / VGC / 1v1 / Gen 1 / Triples),
 * transparently upgrades the battle format to our master NatDex Custom format so the fight launches smoothly!
 */
export function applyBabyOrDevNatDexFallback(
  config: ResolvedBattleConfig,
  playerPaste: string,
  options: { difficultyMode: BattleDifficultyMode; devModeEnabled: boolean }
): ResolvedBattleConfig {
  const isBaby = options.difficultyMode === 'baby';
  const isDev = Boolean(options.devModeEnabled);
  if (!isBaby && !isDev) return config;

  const incompatibility = detectStrictFormatIncompatibility(
    config.formatId,
    playerPaste
  );
  if (!incompatibility) return config;

  const targetFormat = config.format === 'singles' ? 'singles' : 'doubles';
  const targetFormatId: SupportedFormatId =
    targetFormat === 'singles'
      ? CAMPAIGN_SINGLES_FORMAT_ID
      : CAMPAIGN_DOUBLES_FORMAT_ID;
  const originalFormatLabel = config.formatLabel ?? config.formatId;
  const modeTag = isBaby ? '🍼 Baby Mode' : '🧪 Dev Mode';

  const fallbackBanner = `${modeTag}: Fallback automático a NatDex Todo Vale (${originalFormatLabel} invalidado por tu equipo personalizado).`;
  const mergedBanner = config.puzzleConditions?.bannerLog
    ? `${fallbackBanner} · ${config.puzzleConditions.bannerLog}`
    : fallbackBanner;

  return {
    ...config,
    format: targetFormat,
    formatId: targetFormatId,
    formatLabel: `NatDex Todo Vale (${isBaby ? 'Baby Fallback' : 'Dev Fallback'})`,
    // Disable official pick-1 / pick-4 / lead team preview when downgrading out of strict formats
    interactiveTeamPreview: false,
    puzzleConditions: {
      ...(config.puzzleConditions ?? {}),
      bannerLog: mergedBanner,
    },
    babyModeFormatFallback: {
      originalFormatId: config.formatId,
      originalFormatLabel,
      reason: incompatibility,
      triggeredBy: isBaby ? 'baby' : 'dev',
    },
  };
}

/* ===================== Baby Mode Comedy Victory / Review Stamp ===================== */

export interface BabyModeComedyStamp {
  tier: 'interdimensional' | 'rule-breaker' | 'power-abuse' | 'cozy-win' | 'baby-loss';
  badgeTitle: string;
  headline: string;
  quip: string;
  teamBst: number;
  actNormalCap: number;
  overCapBy: number;
  brokeOfficialFormat: boolean;
  originalFormatLabel?: string;
}

/**
 * Evaluates a self-aware comedic stamp for Baby Mode Epilogue & Game Review!
 * Compares the team's actual BST against the Act's Normal Imperial License cap
 * and detects whether Baby Mode broke an official challenge format via NatDex fallback.
 */
export function evaluateBabyModeComedyStamp(
  config: ResolvedBattleConfig,
  profile: PlayerSaveProfile | undefined,
  won: boolean
): BabyModeComedyStamp | null {
  if (config.difficultyMode !== 'baby') return null;

  const completedCount = profile
    ? Object.values(profile.completedChapters).filter((c) => c?.completed).length
    : 0;
  const actNormalCap =
    completedCount >= 7 ? 3550 : completedCount >= 3 ? 3250 : 3000;

  const { totalBst, topSpecies, topSpeciesBst } = computeShowdownPasteBst(
    config.playerShowdownPaste
  );
  const overCapBy = Math.max(0, totalBst - actNormalCap);
  const brokeOfficialFormat = Boolean(config.babyModeFormatFallback);
  const origFmt = config.babyModeFormatFallback?.originalFormatLabel;

  if (!won) {
    return {
      tier: 'baby-loss',
      badgeTitle: '🍼 INCIDENTE CLASIFICADO EN BABY MODE',
      headline: 'No diremos nada, Alteza…',
      quip: `Tranquilo, la bitácora del palacio borró discretamente este tropiezo en Baby Mode${
        topSpecies && topSpeciesBst >= 660
          ? ` (aunque ${topSpecies} con ${topSpeciesBst} BST te está mirando feo)`
          : ''
      }. ¡Revancha y a humillarlo!`,
      teamBst: totalBst,
      actNormalCap,
      overCapBy,
      brokeOfficialFormat,
      originalFormatLabel: origFmt,
    };
  }

  if (brokeOfficialFormat && overCapBy > 0) {
    return {
      tier: 'interdimensional',
      badgeTitle: '🍼 VICTORIA CERTIFICADA EN BABY MODE — ABUSO DE PODER CONFIRMADO',
      headline: 'Desacato Total a las Leyes del Competitivo',
      quip: `Destrozaste el formato ${origFmt} con fallback automático a NatDex y metiste ${totalBst.toLocaleString()} BST (+${overCapBy.toLocaleString()} sobre la Licencia Imperial de ${actNormalCap.toLocaleString()} BST)${
        topSpecies ? ` liderado por ${topSpecies} (${topSpeciesBst} BST)` : ''
      }. El Consejo pidió tiempo fuera por abuso emocional.`,
      teamBst: totalBst,
      actNormalCap,
      overCapBy,
      brokeOfficialFormat,
      originalFormatLabel: origFmt,
    };
  }

  if (brokeOfficialFormat) {
    return {
      tier: 'rule-breaker',
      badgeTitle: '🍼 VICTORIA CERTIFICADA EN BABY MODE — REGLAS TRITURADAS',
      headline: '¿Reglamento Oficial? Nunca Escuché de Eso',
      quip: `Pasaste por encima del formato ${origFmt} activando fallback automático a NatDex Todo Vale${
        topSpecies ? ` con ${topSpecies}` : ''
      }. Legalidad en torneo: 0%. Satisfacción narrativa: 100%.`,
      teamBst: totalBst,
      actNormalCap,
      overCapBy,
      brokeOfficialFormat,
      originalFormatLabel: origFmt,
    };
  }

  if (overCapBy > 0) {
    return {
      tier: 'power-abuse',
      badgeTitle: '🍼 VICTORIA CERTIFICADA EN BABY MODE — ABUSO DE PODER CONFIRMADO',
      headline: 'Licencia Imperial Violada con Cero Remordimientos',
      quip: `Trajiste ${totalBst.toLocaleString()} BST contra un límite normal de ${actNormalCap.toLocaleString()} BST (+${overCapBy.toLocaleString()} BST de pura maldad${
        topSpecies ? ` con ${topSpecies} de ${topSpeciesBst} BST` : ''
      }). La IA distraída ni siquiera vio venir el camión.`,
      teamBst: totalBst,
      actNormalCap,
      overCapBy,
      brokeOfficialFormat,
    };
  }

  return {
    tier: 'cozy-win',
    badgeTitle: '🍼 VICTORIA CERTIFICADA EN BABY MODE',
    headline: 'Paseo Real con Chupón Dorado',
    quip: `Victoria limpia y sin sudar mientras la IA enemiga miraba mariposas (${totalBst.toLocaleString()} BST dentro de la Licencia Imperial). La novela visual sigue rodando sin dramas.`,
    teamBst: totalBst,
    actNormalCap,
    overCapBy: 0,
    brokeOfficialFormat: false,
  };
}
