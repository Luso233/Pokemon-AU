import { CHAPTER_UNLOCK_RULES } from '../data/economyCatalog';
import {
  getRomanceNpcById,
  PLAYABLE_ROMANCE_NPCS,
  ROMANCE_ROSTER,
  type RomanceNpcDefinition,
} from '../data/socialLinksCatalog';
import { BLOC_BY_ID, type WorldBlocId } from '../data/worldGeopolitics';
import type { PlayerSaveProfile, ResolvedEndingType } from '../types/game';
import { applyRivalNameToText, getRivalName } from './rivalName';

/** Main 3 Social Links are ALWAYS accessible from Act I without waiting for regional unlocks. */
export const MAIN_THREE_ROMANCE_IDS = new Set<string>([
  'assassin',
  'court_duelist',
  'champion',
]);

export interface RomanceRegionGate {
  npcId: string;
  requiredRegion: WorldBlocId;
  requiredChapters?: string[];
  regionDisplayName: string;
  unlockHint: string;
}

/**
 * Regional Social Link Visibility Gates:
 * Non-Main-3 Social Links stay HIDDEN (`hideWhenLocked: true`) until the main story
 * reaches their region (tracked in `profile.visitedRegions` or completing their gating story mission).
 */
export const ROMANCE_REGION_GATES: Record<string, RomanceRegionGate> = {
  mesoa_boss: {
    npcId: 'mesoa_boss',
    requiredRegion: 'aztlan_caribe',
    requiredChapters: ['ch3-clandestine-tamer'],
    regionDisplayName: 'Mesoa',
    unlockHint: 'Avanza al Acto II en Mesoa (El Foso del Vínculo Roto).',
  },
  cordelia_astronomer: {
    npcId: 'cordelia_astronomer',
    requiredRegion: 'andes_plata',
    requiredChapters: ['ch4-orre-shadow-ambush', 'challenge-three-knights'],
    regionDisplayName: 'Cordelia',
    unlockHint: 'Avanza al Acto II cruzando Aura (Orre) hacia Cordelia.',
  },
  kemetia_keeper: {
    npcId: 'kemetia_keeper',
    requiredRegion: 'poke_africa',
    requiredChapters: ['challenge-three-knights', 'puzzle-02-regigigas'],
    regionDisplayName: 'Kemetia & Kora',
    unlockHint: 'Llega al Acto III en Kemetia (El Coloso Despertado).',
  },
  ranger_commander: {
    npcId: 'ranger_commander',
    requiredRegion: 'monsoon_archipelago',
    requiredChapters: ['ch8-tamra-cru-viceroy'],
    regionDisplayName: 'Unión Ranger · Vayra',
    unlockHint: 'Derrota al Virrey de la CRU en Tamra (Acto III).',
  },
  aeos_geneticist: {
    npcId: 'aeos_geneticist',
    requiredRegion: 'alola',
    requiredChapters: ['ch9-aeos-ditto-blacksite'],
    regionDisplayName: 'Isla Æos',
    unlockHint: 'Asalta el Black Site del Ditto en Isla Æos (Acto III).',
  },
  poketopia_croupier: {
    npcId: 'poketopia_croupier',
    requiredRegion: 'alola',
    requiredChapters: ['ch9-aeos-ditto-blacksite'],
    regionDisplayName: 'Pokétopia',
    unlockHint: 'Asalta el Black Site de Isla Æos para abrir el circuito de Pokétopia (Acto III).',
  },
  e4_ransei: {
    npcId: 'e4_ransei',
    requiredRegion: 'poke_china',
    requiredChapters: ['ch10-tohjo-shentai-trial'],
    regionDisplayName: 'Shentai · Ransei',
    unlockHint: 'Supera la Prueba de las Potencias Libres en Tohjo/Shentai (Acto IV).',
  },
  e4_ferrum: {
    npcId: 'e4_ferrum',
    requiredRegion: 'northern_steppe',
    requiredChapters: ['ch10-tohjo-shentai-trial'],
    regionDisplayName: 'Kovaria · Ferrum',
    unlockHint: 'Supera la Prueba de las Potencias Libres (Acto IV) para desbloquear al Alto Mando.',
  },
  e4_veridia: {
    npcId: 'e4_veridia',
    requiredRegion: 'amazonia_veracruz',
    requiredChapters: ['ch10-tohjo-shentai-trial'],
    regionDisplayName: 'Selva de Veridia',
    unlockHint: 'Supera la Prueba de las Potencias Libres (Acto IV) para desbloquear al Alto Mando.',
  },
  e4_kalos: {
    npcId: 'e4_kalos',
    requiredRegion: 'kalos',
    requiredChapters: ['ch10-tohjo-shentai-trial'],
    regionDisplayName: 'Kalos · Alto Mando',
    unlockHint: 'Supera la Prueba de las Potencias Libres (Acto IV) para abrir la alianza del Alto Mando de Kalos.',
  },
};

export function parseRomanceChapterId(
  chapterId: string
): { npcId: string; rank: 1 | 2 | 3 } | null {
  const m = /^romance-(.+)-r([123])$/.exec(chapterId);
  if (!m) return null;
  return { npcId: m[1], rank: Number(m[2]) as 1 | 2 | 3 };
}

/**
 * Checks whether a romanceable NPC's Social Link track is VISIBLE & DISCOVERED for this player.
 * - Dev Mode (`devModeEnabled === true`): ALWAYS visible!
 * - Main 3 (`assassin`, `court_duelist`, `champion`): ALWAYS visible from Act I!
 * - All other 10 Regional / Alto Mando NPCs: hidden until main story visits their region or clears their gating mission.
 */
export function isRomanceNpcVisible(
  profile: PlayerSaveProfile,
  npcId: string
): boolean {
  if (profile.devModeEnabled) return true;
  if (MAIN_THREE_ROMANCE_IDS.has(npcId)) return true;
  if ((profile.socialLinks?.[npcId]?.rank ?? 0) >= 1) return true;

  const gate = ROMANCE_REGION_GATES[npcId];
  if (!gate) return true;

  const visited = profile.visitedRegions ?? ['galar_empire'];
  const clearedByChapter = Boolean(
    gate.requiredChapters?.some((chId) => profile.completedChapters?.[chId]?.completed)
  );
  // Late-Game Alto Mando Kalos requires Act IV mission specifically (even though Kalos is visited in Act I!)
  if (npcId === 'e4_kalos') {
    return clearedByChapter;
  }
  return clearedByChapter || visited.includes(gate.requiredRegion);
}

/**
 * Checks whether a specific Romance Chapter (`romance-<npcId>-r<1|2|3>`) is playable right now.
 * - Requires the NPC to be discovered/visible (`isRomanceNpcVisible`)
 * - R2 requires R1 completed; R3 requires R2 completed (except in Dev Mode).
 */
export function isRomanceChapterPlayable(
  profile: PlayerSaveProfile,
  npcId: string,
  targetRank: 1 | 2 | 3
): boolean {
  if (profile.devModeEnabled) return true;
  if (!isRomanceNpcVisible(profile, npcId)) return false;
  if (targetRank === 1) return true;
  const curRank = profile.socialLinks?.[npcId]?.rank ?? 0;
  return curRank >= targetRank - 1;
}

/**
 * Core visibility gate (`hideWhenLocked` + `isPostgame` + `visitedRegions` + Dev Mode bypass).
 * Controls whether a chapter appears on the World Map AND in ChapterSelect!
 */
export function isChapterVisible(
  profile: PlayerSaveProfile,
  chapterId: string
): boolean {
  // Dev Mode ALWAYS exposes every single chapter, Act, Social Link, Climax & Postgame!
  if (profile.devModeEnabled) return true;

  // 1) Romance Social Link Chapters (R1/R2/R3)
  const rom = parseRomanceChapterId(chapterId);
  if (rom) {
    if (!isRomanceNpcVisible(profile, rom.npcId)) return false;
    if (rom.rank === 1) return true;
    const curRank = profile.socialLinks?.[rom.npcId]?.rank ?? 0;
    // Show R2 once R1 is done; show R3 once R2 is done (avoids spoiling R2/R3 pins before R1!)
    return curRank >= rom.rank - 1;
  }

  // 2) Core Campaign / Side / Climax / Postgame Chapters
  const rule = CHAPTER_UNLOCK_RULES[chapterId];
  if (!rule) return true;

  // Already unlocked or completed -> always visible!
  if (
    rule.unlockedByDefault ||
    profile.unlockedChapters.includes(chapterId) ||
    profile.completedChapters[chapterId]?.completed
  ) {
    return true;
  }

  // Postgame is STRICTLY hidden until defeating the Bastard Brother Climax!
  if (rule.isPostgame) {
    return Boolean(
      profile.mainStoryCleared ||
        profile.completedChapters['ch12-bastard-brother-climax']?.completed
    );
  }

  // Explicitly visible with padlock (gives next-objective guidance!)
  if (!rule.hideWhenLocked) return true;

  // Check reveal triggers: if any `revealAfterChapterIds` is completed, show with padlock as next objective!
  if (
    rule.revealAfterChapterIds &&
    rule.revealAfterChapterIds.some((id) => profile.completedChapters[id]?.completed)
  ) {
    return true;
  }

  // Check region trigger if explicitly configured
  if (
    rule.requiredRegion &&
    (profile.visitedRegions ?? ['galar_empire']).includes(rule.requiredRegion)
  ) {
    return true;
  }

  return false;
}

/** Computes which Regional Social Links just became visible after updating a profile! */
export function diffNewlyRevealedSocialLinks(
  beforeProfile: PlayerSaveProfile,
  afterProfile: PlayerSaveProfile
): Array<{ npcId: string; npcName: string; regionName: string }> {
  if (beforeProfile.devModeEnabled || afterProfile.devModeEnabled) return [];
  const rivalName = getRivalName(afterProfile);
  const revealed: Array<{ npcId: string; npcName: string; regionName: string }> = [];
  for (const npc of ROMANCE_ROSTER) {
    if (MAIN_THREE_ROMANCE_IDS.has(npc.id)) continue;
    if (!isRomanceNpcVisible(beforeProfile, npc.id) && isRomanceNpcVisible(afterProfile, npc.id)) {
      const gate = ROMANCE_REGION_GATES[npc.id];
      const regionName =
        gate?.regionDisplayName ??
        (npc.homeBlocId ? BLOC_BY_ID[npc.homeBlocId]?.shortName : 'Región') ??
        'Región';
      revealed.push({
        npcId: npc.id,
        npcName: applyRivalNameToText(npc.name, rivalName),
        regionName,
      });
    }
  }
  return revealed;
}

/* ============================================================================
 * CONFESSION & ENDING RESOLUTION ENGINE (No Late-Game Romance Lockout!)
 * ============================================================================ */

/** True when the player won at least one campaign/romance battle under Baby Mode. */
export function isBabyShamed(profile?: PlayerSaveProfile | null): boolean {
  if (!profile) return false;
  return (profile.babyModeWinsCount ?? 0) > 0;
}

export interface ResolvedEndingDescriptor {
  type: ResolvedEndingType;
  badge: string;
  headline: string;
  summary: string;
  npcId: string | null;
  npc: RomanceNpcDefinition | null;
  confessedCount: number;
  totalRomanceables: number;
}

/**
 * Definitive Campaign Ending Resolver (triggered after defeating the Bastard Brother Climax!):
 * 1. BABY_ENDING — if `isBabyShamed(profile)` is true
 * 2. HAREM_ENDING — if player confessed to ALL 13 romanceable NPCs
 * 3. ROMANCE_<firstConfessionNpcId> — locked ONLY by the FIRST confession (not first Rank 3!)
 * 4. SOLO_MONARCH_ENDING — if player never confessed (chose platonic with everyone or skipped)
 */
export function resolveEnding(
  profile: PlayerSaveProfile
): ResolvedEndingDescriptor {
  const rivalName = getRivalName(profile);
  const fmt = (s: string) => applyRivalNameToText(s, rivalName);
  const confessed = profile.confessedNpcIds ?? [];
  const totalRomanceables = PLAYABLE_ROMANCE_NPCS.length;

  if (isBabyShamed(profile)) {
    return {
      type: 'BABY_ENDING',
      badge: '🍼 FINAL CERTIFICADO · BABY MODE',
      headline: 'Final Baby Mode: El Monarca con Rueditas de Entrenamiento',
      summary:
        'Derrotaste al Hermano Bastardo y recuperaste Wyndon… aunque todos en la corte vieron que activaste Baby Mode en el camino. Tus aliados te aplauden con una sonrisa sospechosamente condescendiente y te regalan un babero real bordado en oro.',
      npcId: null,
      npc: null,
      confessedCount: confessed.length,
      totalRomanceables,
    };
  }

  if (totalRomanceables > 0 && confessed.length >= totalRomanceables) {
    return {
      type: 'HAREM_ENDING',
      badge: '👑♥ FINAL SECRETO · HAREM GLOBAL (13/13)',
      headline: 'Corona de Vínculos: El Harem de los 18 Bloques',
      summary: fmt(
        'Conquistaste el corazón de los 13 aliados romanceables del planeta entero — desde El Pelirrojo, La Duelista y La Campeona hasta el Alto Mando de las cuatro esquinas del mundo. Ningún trono vuelve a estar solo: Galar renace como una alianza tejida por trece promesas.'
      ),
      npcId: null,
      npc: null,
      confessedCount: confessed.length,
      totalRomanceables,
    };
  }

  const firstId = profile.firstConfessionNpcId ?? null;
  if (firstId) {
    const npc = getRomanceNpcById(firstId) ?? null;
    if (npc) {
      return {
        type: `ROMANCE_${npc.id}`,
        badge: `♥ FINAL ROMÁNTICO · ${fmt(npc.name).toUpperCase()}`,
        headline: fmt(npc.endingTitle),
        summary: fmt(npc.endingSummary),
        npcId: npc.id,
        npc,
        confessedCount: confessed.length,
        totalRomanceables,
      };
    }
  }

  return {
    type: 'SOLO_MONARCH_ENDING',
    badge: '👑 FINAL CANÓNICO · MONARCA SOLITARIO',
    headline: 'La Corona sin Cadenas: El Monarca Solitario',
    summary:
      'Forjaste alianzas invencibles en cada continente sin atar tu corazón a una sola promesa. Con el Hermano Bastardo derrotado y el Monopolio Ditto desmantelado, asciendes al trono de Galar por mérito propio como un soberano libre e incorruptible.',
    npcId: null,
    npc: null,
    confessedCount: confessed.length,
    totalRomanceables,
  };
}

export interface ConfessionSceneText {
  promptHeader: string;
  promptQuestion: string;
  confessButtonLabel: string;
  platonicButtonLabel: string;
  confessFirstScene: string;
  confessSecondaryScene: string;
  babyRejectionScene: string;
  platonicScene: string;
}

/** Builds atmospheric post-R3 Confession / Baby-Rejection / Platonic closing scenes for any romanceable NPC. */
export function buildPostRank3ConfessionScene(
  npcId: string,
  profile: PlayerSaveProfile
): ConfessionSceneText {
  const npc = getRomanceNpcById(npcId);
  const rivalName = getRivalName(profile);
  const fmt = (s: string) => applyRivalNameToText(s, rivalName);
  const npcName = fmt(npc?.name ?? 'tu aliado');

  return {
    promptHeader: `Escena de Cierre · Rango 3 con ${npcName}`,
    promptQuestion: `La arena queda en silencio tras la Revancha Definitiva. Ya aseguraste sus 3 Pokémon élite en tu Casa PC y todos sus beneficios de campaña. ${npcName} te sostiene la mirada esperando tus palabras antes de partir…`,
    confessButtonLabel: `♥ Confesar tus sentimientos a ${npcName}`,
    platonicButtonLabel: '🤝 Agradecer su lealtad como camarada (Platónico)',
    confessFirstScene: fmt(
      `Cuando pronuncias lo que sientes sin escudarte detrás de la corona, ${npcName} guarda silencio un segundo y luego te toma de la mano con una sonrisa sincera: «Si logras derribar a tu hermano en la Ciudadela Real, no pienso dejarte cargar ese trono a solas. Mi promesa es tuya.»`
    ),
    confessSecondaryScene: fmt(
      `${npcName} suelta una risa cómplice y te abraza con fuerza: «Sé que ya entregaste una primera promesa en el camino, Alteza… pero si de verdad quieres construir una corona donde quepamos todos, tendrás que ganarte cada corazón de este planeta.»`
    ),
    babyRejectionScene: fmt(
      `${npcName} parpadea incrédulo y señala tu cinturón de Baby Mode con una ceja arqueada: «¿En serio te me declaras después de activar Baby Mode y pasarme por encima sin Cap BST? ¡Qué descaro, Alteza! Te dejo mis Pokémon en tu Casa PC por lástima, pero vuelve a pedirme la mano cuando pelees sin rueditas de entrenamiento.»`
    ),
    platonicScene: fmt(
      `Le extiendes la mano con respeto absoluto y agradeces cada batalla compartida en el exilio. ${npcName} corresponde el apretón con una sonrisa serena: «Camaradas hasta el último turno, Príncipe. Mis Pokémon pelearán a tu lado en la Casa PC… y tu corazón queda libre para quien elijas al final del camino.»`
    ),
  };
}
