import {
  CAMPAIGN_DOUBLES_FORMAT_ID,
  type ChapterDefinition,
  type CharacterId,
} from '../types/game';
import romanceAssassinR1Ink from '../stories/romance_assassin_r1.ink?raw';
import romanceDuelistR1Ink from '../stories/romance_duelist_r1.ink?raw';
import romanceChampionR1Ink from '../stories/romance_champion_r1.ink?raw';
import {
  resolveRomanceRematchBattle,
  resolveRomanceTagBattle,
} from '../engine/romanceBattles';

/**
 * Builds a playable ChapterDefinition on the fly for any Batch 1 Romance Rank:
 * - Rank 1: VN-only scene (unlocks Ironman survival perk)
 * - Rank 2: 2v2 Human Tag-Team (3 yours + 3 theirs vs 6 enemies)
 * - Rank 3: Unfair Rematch (unlocks House PC Pokémon + Romantic Ending flag)
 */
export function buildRomanceChapterDefinition(
  npcId: 'assassin' | 'court_duelist' | 'champion',
  targetRank: 1 | 2 | 3
): ChapterDefinition {
  const rank1InkMap = {
    assassin: romanceAssassinR1Ink,
    court_duelist: romanceDuelistR1Ink,
    champion: romanceChampionR1Ink,
  };

  const titles: Record<string, Record<1 | 2 | 3, string>> = {
    assassin: {
      1: 'Vínculo I · Red de Inteligencia en Ryme (El Pelirrojo)',
      2: 'Vínculo II · Tag 2v2: Cazarrecompensas en Aura (Orre)',
      3: 'Vínculo III · Rematch Injusta: Counter-Team Edgy',
    },
    court_duelist: {
      1: 'Vínculo I · Botiquín de Guerrilla en Vayra (La Duelista)',
      2: 'Vínculo II · Tag 2v2: Purga en las Islas Naranja',
      3: 'Vínculo III · Rematch Injusta: 1v1 Puro (Pick 1)',
    },
    champion: {
      1: 'Vínculo I · Doctrina Real bajo las Nubes (La Campeona)',
      2: 'Vínculo II · Tag 2v2: Con Mega-Rayquaza vs. Ubers',
      3: 'Vínculo III · Rematch Injusta: Anything Goes',
    },
  };

  const showcaseSpecies: Record<string, string> = {
    assassin: 'Kingambit',
    court_duelist: 'Urshifu-Rapid-Strike',
    champion: 'Rayquaza-Mega',
  };

  const isDuelist1v1 = npcId === 'court_duelist' && targetRank === 3;

  const charId: CharacterId = npcId;
  const tagInk =
    targetRank === 2
      ? `VAR bond_ready = true\n-> inicio\n=== inicio ===\nTu aliado apoya su espalda contra la tuya mientras seis adversarios rodean la arena. Tres Pokémon tuyos y tres suyos pelearán lado a lado en combate 2v2 en equipo. # bg: royal-training-ground # speaker: Narrador # char: ${charId} # side: right # pokemon: none # mood: confident\n-> END`
      : targetRank === 3
        ? `VAR bond_ready = true\n-> inicio\n=== inicio ===\nEsta vez no habrá concesiones ni igualdad de condiciones: te enfrentas a una Rematch Injusta por el Vínculo Máximo (Rango 3). Si sobrevives, sus mejores Pokémon quedarán disponibles en tu Casa PC. # bg: royal-training-ground # speaker: Narrador # char: ${charId} # side: right # pokemon: none # mood: serious\n-> END`
        : rank1InkMap[npcId];

  return {
    id: `romance-${npcId}-r${targetRank}`,
    category: 'story',
    number: `VÍNCULO R${targetRank}`,
    title: titles[npcId][targetRank],
    subtitle:
      targetRank === 1
        ? 'Evento de Confianza · Novela Visual'
        : targetRank === 2
          ? 'Capítulo Extra 1 · Combate 2v2 en Equipo (3+3 vs 6)'
          : 'Capítulo Extra 2 · Rematch Injusta (Riesgo/Recompensa)',
    tag:
      targetRank === 1
        ? 'VÍNCULO · RANGO 1'
        : targetRank === 2
          ? 'TAG 2V2 · RANGO 2'
          : 'REMATCH INJUSTA · RANGO 3',
    format: isDuelist1v1 ? 'singles' : 'doubles',
    formatId: isDuelist1v1 ? 'gen91v1' : CAMPAIGN_DOUBLES_FORMAT_ID,
    teamEditPolicy: isDuelist1v1 || targetRank === 2 ? 'fixed' : 'editable',
    teamMode: isDuelist1v1 ? 'challenge' : targetRank === 2 ? 'locked' : 'campaign',
    formatLabel:
      targetRank === 1
        ? 'Evento VN'
        : targetRank === 2
          ? 'Tag 2v2 · 3+3 vs 6'
          : isDuelist1v1
            ? '1v1 Puro · Pick 1'
            : npcId === 'champion'
              ? 'Anything Goes · 6v6'
              : 'Rematch Injusta 6v6',
    difficulty: targetRank === 3 ? 'Injusta' : 'Vínculo',
    description:
      targetRank === 1
        ? 'Escena de afinidad que desbloquea beneficios inmediatos de supervivencia en Campamento.'
        : targetRank === 2
          ? 'Combate en equipo 2v2 humanos (3 Pokémon tuyos + 3 suyos) para desbloquear Scouting Anti-Diablo.'
          : 'Rematch con ventaja rival. Ganar desbloquea sus Pokémon en tu Casa PC y su bandera de Ending Romántico.',
    accentColor: targetRank === 3 ? 'rose' : 'purple',
    showcaseSprite: {
      species: showcaseSpecies[npcId],
      mode: targetRank === 3 ? 'boss' : 'player-ace',
    },
    featuredPokemon: [showcaseSpecies[npcId]],
    rivalPreview: titles[npcId][targetRank],
    rivalProfile: {
      name: titles[npcId][targetRank],
      title: `Capítulo de Afinidad · Rango ${targetRank}`,
      bio: 'Encuentro especial del sistema de Vínculos y Supervivencia.',
      tacticalInsight:
        targetRank === 2
          ? 'Coordina tu flanco izquierdo con los tres Pokémon de tu aliado en el flanco derecho.'
          : 'El rival empieza con ventaja táctica; prepara tu equipo antes de aceptar el desafío.',
      archetypeTag: `Vínculo · Rango ${targetRank}`,
    },
    inkSource: tagInk,
    resolveBattleConfig: (flags) =>
      targetRank === 3
        ? resolveRomanceRematchBattle(npcId, flags)
        : resolveRomanceTagBattle(npcId, flags),
    getEpilogue: (won) =>
      won
        ? {
            headline: `¡Afinidad Elevada a Rango ${targetRank}!`,
            subheadline:
              targetRank === 2
                ? 'El combate 2v2 en equipo selló vuestra complicidad táctica.'
                : 'Superaste la Rematch Injusta: Vínculo Máximo alcanzado.',
            badgeText: `VÍNCULO RANGO ${targetRank} COMPLETADO`,
            paragraphs: [
              targetRank === 2
                ? 'Scouting Táctico Anti-Diablo activado: ahora recibirás alertas previas sobre objetos y movimientos ocultos del modo Diablo en el Teambuilder.'
                : 'Los 3 Pokémon de élite de tu aliado ya descansan en tu Casa PC listos para reforzar tu escuadrón —y su bandera de Ending Romántico quedó grabada en la historia.',
            ],
          }
        : {
            headline: 'El Vínculo Aún Exige Prueba',
            subheadline:
              'La intensidad del desafío superó tu línea antes del golpe final.',
            badgeText: 'REINTENTAR VÍNCULO',
            paragraphs: [
              'Regresa al Campamento, cura a tus supervivientes o ajusta tu estrategia en el Teambuilder antes de volver a aceptar el reto.',
            ],
          },
  };
}
