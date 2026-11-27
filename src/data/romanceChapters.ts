import {
  CAMPAIGN_DOUBLES_FORMAT_ID,
  type ChapterDefinition,
  type CharacterId,
  type PlayerSaveProfile,
} from '../types/game';
import romanceAssassinR1Ink from '../stories/romance_assassin_r1.ink?raw';
import romanceDuelistR1Ink from '../stories/romance_duelist_r1.ink?raw';
import romanceChampionR1Ink from '../stories/romance_champion_r1.ink?raw';
import { REGIONAL_ROMANCE_BLUEPRINTS } from './regionalRomanceBlueprints';
import { getRomanceNpcById, ROMANCE_ROSTER } from './socialLinksCatalog';
import {
  resolveRomanceEncounterDuel,
  resolveRomanceRematchBattle,
  resolveRomanceTagBattle,
} from '../engine/romanceBattles';
import { isRomanceChapterPlayable } from '../engine/campaignProgression';

const HANDCRAFTED_R1_INK: Record<string, string> = {
  assassin: romanceAssassinR1Ink,
  court_duelist: romanceDuelistR1Ink,
  champion: romanceChampionR1Ink,
};

function sanitizeInkLine(s: string): string {
  return s.replace(/\r?\n/g, ' ').replace(/#/g, '').trim();
}

function buildGeneratedRomanceInk(
  npcId: string,
  targetRank: 1 | 2 | 3
): string {
  const bp = REGIONAL_ROMANCE_BLUEPRINTS[npcId];
  const npc = getRomanceNpcById(npcId);
  if (!bp || !npc) {
    return `VAR bond_ready = true\n-> inicio\n=== inicio ===\nEncuentro especial de vínculo.\n-> END`;
  }

  const charId = (npc.charId ?? bp.npcId) as CharacterId;
  const bg = bp.arenaTheme;
  const spTag = bp.showcaseSpecies.toLowerCase().replace(/[^a-z0-9]/g, '');

  // Batch 1 R1 preserves the handcrafted regional story AND appends the smooth combat lead-in!
  if (targetRank === 1 && HANDCRAFTED_R1_INK[npcId]) {
    const raw = HANDCRAFTED_R1_INK[npcId];
    const transitionLine = `${sanitizeInkLine(npc.name)} toma una Poké Ball y te sonríe con chispa de reto: «Antes de sellar el pacto, Príncipe, midamos nuestra fuerza en un duelo de encuentro aquí mismo (Cap Nv. ${bp.r1.levelCap}).» # bg: ${bg} # speaker: ${sanitizeInkLine(npc.name)} # char: ${charId} # side: right # pokemon: ${spTag} # mood: confident\n-> END`;
    return raw.replace(/->\s*END\s*$/, transitionLine);
  }

  if (targetRank === 1) {
    return [
      `VAR bond_tone = "respect"`,
      `-> encuentro`,
      `=== encuentro ===`,
      `${sanitizeInkLine(bp.r1.introNarrator)} # bg: ${bg} # speaker: Narrador # char: ${charId} # side: right # pokemon: none # mood: serious`,
      `${sanitizeInkLine(bp.r1.npcGreeting)} # bg: ${bg} # speaker: ${sanitizeInkLine(npc.name)} # char: ${charId} # side: right # pokemon: ${spTag} # mood: smug`,
      `${sanitizeInkLine(bp.r1.princeReply)} # bg: ${bg} # speaker: Príncipe Heredero # char: prince # side: left # pokemon: gardevoir # mood: serious`,
      `${sanitizeInkLine(bp.r1.npcContext)} # bg: ${bg} # speaker: ${sanitizeInkLine(npc.name)} # char: ${charId} # side: right # pokemon: none # mood: confident`,
      `* [${sanitizeInkLine(bp.r1.choiceA)}]`,
      `    ~ bond_tone = "bold"`,
      `    ${sanitizeInkLine(bp.r1.replyA)} # bg: ${bg} # speaker: ${sanitizeInkLine(npc.name)} # char: ${charId} # side: right # pokemon: ${spTag} # mood: confident`,
      `    -> cierre_r1`,
      `* [${sanitizeInkLine(bp.r1.choiceB)}]`,
      `    ~ bond_tone = "promise"`,
      `    ${sanitizeInkLine(bp.r1.replyB)} # bg: ${bg} # speaker: ${sanitizeInkLine(npc.name)} # char: ${charId} # side: right # pokemon: ${spTag} # mood: serious`,
      `    -> cierre_r1`,
      `=== cierre_r1 ===`,
      `${sanitizeInkLine(bp.r1.closingBeat)} [Duelo de Encuentro · Cap Nv. ${bp.r1.levelCap} · Recompensa R1: ${sanitizeInkLine(npc.rank1PerkTitle)}] # bg: ${bg} # speaker: Narrador # char: ${charId} # side: right # pokemon: ${spTag} # mood: confident`,
      `-> END`,
    ].join('\n');
  }

  if (targetRank === 2) {
    return [
      `VAR tag_plan = "sync"`,
      `-> alianza`,
      `=== alianza ===`,
      `${sanitizeInkLine(bp.r2.introNarrator)} # bg: ${bg} # speaker: Narrador # char: ${charId} # side: right # pokemon: none # mood: serious`,
      `${sanitizeInkLine(bp.r2.npcCallout)} # bg: ${bg} # speaker: ${sanitizeInkLine(npc.name)} # char: ${charId} # side: right # pokemon: ${spTag} # mood: confident`,
      `* [${sanitizeInkLine(bp.r2.choiceA)}]`,
      `    ~ tag_plan = "vanguard"`,
      `    ${sanitizeInkLine(bp.r2.replyA)} # bg: ${bg} # speaker: ${sanitizeInkLine(npc.name)} # char: ${charId} # side: right # pokemon: ${spTag} # mood: confident`,
      `    -> cierre_r2`,
      `* [${sanitizeInkLine(bp.r2.choiceB)}]`,
      `    ~ tag_plan = "cover"`,
      `    ${sanitizeInkLine(bp.r2.replyB)} # bg: ${bg} # speaker: ${sanitizeInkLine(npc.name)} # char: ${charId} # side: right # pokemon: ${spTag} # mood: smug`,
      `    -> cierre_r2`,
      `=== cierre_r2 ===`,
      `Tres Pokémon tuyos y tres de ${sanitizeInkLine(npc.name)} toman posición hombro con hombro contra seis enemigos en ${sanitizeInkLine(bp.r2.locationName)}. [Combate de Amigos Tag 2v2 · 3+3 vs 6] # bg: ${bg} # speaker: Narrador # char: ${charId} # side: right # pokemon: ${spTag} # mood: confident`,
      `-> END`,
    ].join('\n');
  }

  // Rank 3: High-Level-Cap Unfair Rematch
  return [
    `VAR rematch_vow = "all_in"`,
    `-> revancha`,
    `=== revancha ===`,
    `${sanitizeInkLine(bp.r3.introNarrator)} # bg: ${bg} # speaker: Narrador # char: ${charId} # side: right # pokemon: none # mood: serious`,
    `${sanitizeInkLine(bp.r3.npcChallenge)} # bg: ${bg} # speaker: ${sanitizeInkLine(npc.name)} # char: ${charId} # side: right # pokemon: ${spTag} # mood: fierce`,
    `* [${sanitizeInkLine(bp.r3.choiceA)}]`,
    `    ~ rematch_vow = "rival"`,
    `    ${sanitizeInkLine(bp.r3.replyA)} # bg: ${bg} # speaker: ${sanitizeInkLine(npc.name)} # char: ${charId} # side: right # pokemon: ${spTag} # mood: confident`,
    `    -> cierre_r3`,
    `* [${sanitizeInkLine(bp.r3.choiceB)}]`,
    `    ~ rematch_vow = "romance"`,
    `    ${sanitizeInkLine(bp.r3.replyB)} # bg: ${bg} # speaker: ${sanitizeInkLine(npc.name)} # char: ${charId} # side: right # pokemon: ${spTag} # mood: confident`,
    `    -> cierre_r3`,
    `=== cierre_r3 ===`,
    `Se abre la Revancha Definitiva (Cap Alto Nv. ${bp.r3.levelCap}+) contra ${sanitizeInkLine(npc.name)}. Ganar deposita sus 3 Pokémon élite en tu Casa PC y sella su Vínculo Máximo (Rango 3). # bg: ${bg} # speaker: Narrador # char: ${charId} # side: right # pokemon: ${spTag} # mood: fierce`,
    `-> END`,
  ].join('\n');
}

/**
 * Checks whether a specific romance chapter (R1/R2/R3) is currently playable for a profile:
 * - Main 3 (Pelirrojo, Duelista, Campeona): R1 unlocked from Act I.
 * - Regional / Alto Mando NPCs: hidden & locked until main story reaches their region!
 * - R2 requires R1 completed; R3 requires R2 completed.
 * - Dev Mode (`devModeEnabled === true`) unlocks everything immediately.
 */
export function isRomanceChapterUnlocked(
  profile: PlayerSaveProfile,
  npcId: string,
  targetRank: 1 | 2 | 3
): boolean {
  return isRomanceChapterPlayable(profile, npcId, targetRank);
}

/**
 * Builds a playable ChapterDefinition for ANY of the 13 romanceable NPCs across all 3 chapters:
 * - Cap. 1 (R1): Duelo de Encuentro & Exploración Regional (Cap Nv. 82–95 · Campaña NatDex)
 * - Cap. 2 (R2): Combate de Amigos — Tag 2v2 (3 tuyos + 3 suyos vs 6 antagonistas regionales)
 * - Cap. 3 (R3): Revancha Definitiva — Level Cap Más Alta (Nv. 105–112 + bossAceRule -> Casa PC + Ending)
 */
export function buildRomanceChapterDefinition(
  npcId: string,
  targetRank: 1 | 2 | 3
): ChapterDefinition {
  const bp = REGIONAL_ROMANCE_BLUEPRINTS[npcId];
  const npc = getRomanceNpcById(npcId);
  if (!bp || !npc) {
    throw new Error(`Unknown romance NPC: ${npcId}`);
  }

  const isDuelist1v1 = npcId === 'court_duelist' && targetRank === 3;
  const maxR3Level = bp.r3.rivalSquad
    ? Math.max(...bp.r3.rivalSquad.map((s) => s.level ?? bp.r3.levelCap))
    : bp.r3.levelCap;

  const title =
    targetRank === 1
      ? bp.r1.title
      : targetRank === 2
        ? bp.r2.title
        : bp.r3.title;

  const formatLabel =
    targetRank === 1
      ? `Duelo · Nv. ${bp.r1.levelCap}`
      : targetRank === 2
        ? 'Amigos Tag 2v2 (3+3)'
        : isDuelist1v1
          ? '1v1 Puro · Pick 1'
          : `Revancha · Cap Nv. ${maxR3Level}`;

  return {
    id: `romance-${npcId}-r${targetRank}`,
    category: 'romance',
    number:
      targetRank === 1
        ? 'VÍNCULO I · DUELO'
        : targetRank === 2
          ? 'VÍNCULO II · AMIGOS'
          : 'VÍNCULO III · REVANCHA',
    title,
    subtitle: `${npc.name} · ${bp.regionShort}`,
    tag:
      targetRank === 1
        ? `ENCUENTRO · NV.${bp.r1.levelCap}`
        : targetRank === 2
          ? 'TAG 2V2 · 3+3 VS 6'
          : `CAP ALTA · NV.${maxR3Level}`,
    format: isDuelist1v1 ? 'singles' : 'doubles',
    formatId: isDuelist1v1 ? 'gen91v1' : CAMPAIGN_DOUBLES_FORMAT_ID,
    teamEditPolicy: isDuelist1v1 || targetRank === 2 ? 'fixed' : 'editable',
    teamMode: isDuelist1v1 ? 'challenge' : targetRank === 2 ? 'locked' : 'campaign',
    formatLabel,
    difficulty:
      targetRank === 1
        ? `Exploración Nv.${bp.r1.levelCap}`
        : targetRank === 2
          ? 'Cooperativo 2v2'
          : `Revancha Nv.${maxR3Level}`,
    description:
      targetRank === 1
        ? `${bp.r1.theaterNote} Desbloquea: ${npc.rank1PerkTitle}.`
        : targetRank === 2
          ? `${bp.r2.theaterNote} Desbloquea: ${npc.rank2PerkTitle}.`
          : `${bp.r3.theaterNote} Desbloquea Casa PC (${npc.rank3PerkTitle}) y Final Romántico.`,
    accentColor: targetRank === 3 ? 'rose' : bp.accentColor,
    showcaseSprite: {
      species: bp.showcaseSpecies,
      mode: targetRank === 3 ? 'boss' : 'player-ace',
    },
    featuredPokemon: [bp.showcaseSpecies],
    rivalPreview: `${npc.name} · ${bp.regionShort}`,
    rivalProfile: {
      name: npc.name,
      title: npc.title,
      bio: npc.bio,
      tacticalInsight:
        targetRank === 1
          ? `Encuentro regional (Cap Nv. ${bp.r1.levelCap}): ${npc.gimmickTag}.`
          : targetRank === 2
            ? `Peleas hombro con hombro (3+3 vs 6) contra ${bp.r2.antagonistName}.`
            : npc.bossAceRule?.ruleDetail ?? `Revancha de Level Cap Alta (Nv. ${maxR3Level}).`,
      archetypeTag: `${bp.regionShort} · Rango ${targetRank}`,
    },
    inkSource: buildGeneratedRomanceInk(npcId, targetRank),
    resolveBattleConfig: (flags) =>
      targetRank === 1
        ? resolveRomanceEncounterDuel(npcId, flags)
        : targetRank === 2
          ? resolveRomanceTagBattle(npcId, flags)
          : resolveRomanceRematchBattle(npcId, flags),
    getEpilogue: (won) =>
      won
        ? {
            headline: `¡Vínculo con ${npc.name} Elevado a Rango ${targetRank}!`,
            subheadline:
              targetRank === 1
                ? `Exploraste ${bp.regionShort} y superaste el Duelo de Encuentro.`
                : targetRank === 2
                  ? `El combate de amigos 2v2 en ${bp.r2.locationName} selló su confianza.`
                  : `¡Superaste la Revancha de Level Cap Alta (Nv. ${maxR3Level})! Vínculo Máximo alcanzado.`,
            badgeText: `VÍNCULO RANGO ${targetRank} COMPLETADO`,
            paragraphs: [
              targetRank === 1
                ? `Beneficio R1 activado: ${npc.rank1PerkTitle} — ${npc.rank1PerkDetail} Además se desbloqueó su Capítulo 2 (Combate de Amigos Tag 2v2) y fauna local de ${bp.regionShort} en la Tienda.`
                : targetRank === 2
                  ? `Beneficio R2 activado: ${npc.rank2PerkTitle} — ${npc.rank2PerkDetail} Ahora puedes desafiar a ${npc.name} en su Revancha Definitiva de Level Cap Alta (Rango 3).`
                  : `¡${npc.rank3PerkTitle} ya descansan en tu Casa PC listos para reforzar tu equipo! ${npc.endingTitle}: ${npc.endingSummary}`,
            ],
          }
        : {
            headline: `${npc.name} Aún Espera tu Revancha`,
            subheadline: `El desafío de ${bp.regionShort} (Rango ${targetRank}) exigió más de lo esperado.`,
            badgeText: `REINTENTAR VÍNCULO R${targetRank}`,
            paragraphs: [
              `Regresa al Campamento, ajusta tus Cajas PC o revisa el Game Review antes de volver a retar a ${npc.name}.`,
            ],
          },
  };
}

/**
 * Full catalog of 39 playable regional romance chapters (13 NPCs × 3 chapters each:
 * 1. Duelo de Encuentro · 2. Amigos Tag 2v2 · 3. Revancha Level Cap Alta).
 */
export const ROMANCE_CHAPTERS: ChapterDefinition[] = ROMANCE_ROSTER.flatMap(
  (npc) => [
    buildRomanceChapterDefinition(npc.id, 1),
    buildRomanceChapterDefinition(npc.id, 2),
    buildRomanceChapterDefinition(npc.id, 3),
  ]
);

export function getRomanceChapterById(id: string): ChapterDefinition | undefined {
  return ROMANCE_CHAPTERS.find((c) => c.id === id);
}
