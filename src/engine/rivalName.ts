import type {
  ChapterDefinition,
  PlayerSaveProfile,
  ResolvedBattleConfig,
} from '../types/game';

/** Canonical super-edgy default name for our Gary / Mr. Tutorial Man / Pelirrojo rival. */
export const DEFAULT_RIVAL_NAME = 'Locke';

export interface RivalNamePreset {
  name: string;
  tag: string;
}

/**
 * Ancestral Pokémon Rival Naming Presets (Gen 1–2 tradition):
 * Canonical edgy defaults + classic nicknames every Pokémon player has bestowed upon Gary Oak!
 */
export const RIVAL_NAME_PRESETS: RivalNamePreset[] = [
  { name: 'Locke', tag: 'Canónico Edgy' },
  { name: 'Fang', tag: 'Edgy Alt' },
  { name: 'Gary', tag: 'El Clásico' },
  { name: 'Mr. Tutorial', tag: 'Tutorial Man' },
  { name: 'Edgelord', tag: 'El Pelirrojo' },
  { name: '???', tag: 'Clásico Johto' },
  { name: 'Dickfart', tag: 'Clásico GBA' },
  { name: 'Assface', tag: 'Clásico 1998' },
  { name: 'Bitch', tag: 'Sin Filtro' },
  { name: 'Bobo', tag: 'Modo Stream' },
];

export function sanitizeRivalName(raw?: string | null): string {
  const cleaned = (raw ?? '')
    .replace(/[\r\n#<>]/g, '')
    .trim()
    .slice(0, 24);
  return cleaned || DEFAULT_RIVAL_NAME;
}

export function getRivalName(profile?: PlayerSaveProfile | null): string {
  return sanitizeRivalName(profile?.rivalName);
}

/**
 * Replaces hardcoded labels for our recurring red-haired rival (El Pelirrojo / Asesino Carmesí)
 * with the player's chosen rival name across VN dialogue, Ink speaker tags, Battle Arena,
 * Teambuilder, Social Links, and Romantic Endings!
 */
export function applyRivalNameToText(
  text: string,
  rivalName: string
): string {
  const name = sanitizeRivalName(rivalName);
  if (!text) return text;
  return text
    .replace(/El Pelirrojo \(Rival Edgy\)/g, `${name} (Rival Edgy)`)
    .replace(/el Asesino Carmesí/g, name)
    .replace(/El Asesino Carmesí/g, name)
    .replace(/Asesino Carmesí/g, name)
    .replace(/del Pelirrojo/g, `de ${name}`)
    .replace(/al Pelirrojo/g, `a ${name}`)
    .replace(/El Pelirrojo/g, name)
    .replace(/el Pelirrojo/g, name)
    .replace(/Pelirrojo/g, name);
}

export function applyRivalNameToBattleConfig(
  config: ResolvedBattleConfig,
  rivalName: string
): ResolvedBattleConfig {
  const name = sanitizeRivalName(rivalName);
  const involvesAssassin =
    config.rivalCharId === 'assassin' ||
    config.romanceMeta?.npcId === 'assassin' ||
    config.chapterId === 'ch1-wyndon-chase' ||
    config.chapterId.startsWith('romance-assassin-');

  if (!involvesAssassin) return config;

  const sub = (s?: string) => (s ? applyRivalNameToText(s, name) : s);

  return {
    ...config,
    playerName: applyRivalNameToText(config.playerName, name),
    rivalName:
      config.rivalCharId === 'assassin'
        ? name
        : applyRivalNameToText(config.rivalName, name),
    rivalTitle: applyRivalNameToText(config.rivalTitle, name),
    playerTeamSummary: applyRivalNameToText(config.playerTeamSummary, name),
    rivalTeamSummary: applyRivalNameToText(config.rivalTeamSummary, name),
    rivalProfile: config.rivalProfile
      ? {
          ...config.rivalProfile,
          name:
            config.rivalCharId === 'assassin'
              ? name
              : applyRivalNameToText(config.rivalProfile.name, name),
          title: applyRivalNameToText(config.rivalProfile.title, name),
          bio: applyRivalNameToText(config.rivalProfile.bio, name),
          tacticalInsight: applyRivalNameToText(
            config.rivalProfile.tacticalInsight,
            name
          ),
        }
      : undefined,
    rivalIntel: {
      ...config.rivalIntel,
      intelLabel: applyRivalNameToText(config.rivalIntel.intelLabel, name),
      intelNote: applyRivalNameToText(config.rivalIntel.intelNote, name),
      bossAceWarning: sub(config.rivalIntel.bossAceWarning),
      aiScriptHint: sub(config.rivalIntel.aiScriptHint),
    },
    romanceMeta: config.romanceMeta
      ? {
          ...config.romanceMeta,
          partnerLabel: sub(config.romanceMeta.partnerLabel),
        }
      : undefined,
    puzzleConditions: config.puzzleConditions
      ? {
          ...config.puzzleConditions,
          bannerLog: sub(config.puzzleConditions.bannerLog),
          biomeLabel: sub(config.puzzleConditions.biomeLabel),
          biomeCounterHint: sub(config.puzzleConditions.biomeCounterHint),
        }
      : undefined,
    scriptedEnemyRules: config.scriptedEnemyRules.map((r) => ({
      ...r,
      description: applyRivalNameToText(r.description, name),
      tauntLine: sub(r.tauntLine),
    })),
    traces: config.traces.map((t) => ({
      ...t,
      choiceLabel: applyRivalNameToText(t.choiceLabel, name),
      effectTitle: applyRivalNameToText(t.effectTitle, name),
      effectDetail: applyRivalNameToText(t.effectDetail, name),
    })),
  };
}

export function applyRivalNameToChapter(
  chapter: ChapterDefinition,
  rivalName: string
): ChapterDefinition {
  const name = sanitizeRivalName(rivalName);
  const involvesAssassin =
    chapter.id === 'ch1-wyndon-chase' ||
    chapter.id.startsWith('romance-assassin-') ||
    chapter.inkSource.includes('char: assassin') ||
    chapter.title.includes('Pelirrojo') ||
    chapter.rivalPreview.includes('Asesino') ||
    chapter.rivalPreview.includes('Pelirrojo');

  if (!involvesAssassin) return chapter;

  return {
    ...chapter,
    title: applyRivalNameToText(chapter.title, name),
    subtitle: applyRivalNameToText(chapter.subtitle, name),
    description: applyRivalNameToText(chapter.description, name),
    rivalPreview: applyRivalNameToText(chapter.rivalPreview, name),
    rivalProfile: {
      ...chapter.rivalProfile,
      name: applyRivalNameToText(chapter.rivalProfile.name, name),
      title: applyRivalNameToText(chapter.rivalProfile.title, name),
      bio: applyRivalNameToText(chapter.rivalProfile.bio, name),
      tacticalInsight: applyRivalNameToText(
        chapter.rivalProfile.tacticalInsight,
        name
      ),
    },
    inkSource: applyRivalNameToText(chapter.inkSource, name),
    resolveBattleConfig: (flags) =>
      applyRivalNameToBattleConfig(chapter.resolveBattleConfig(flags), name),
    resolveStageBattleConfig: chapter.resolveStageBattleConfig
      ? (battleId, flags, persisted) =>
          applyRivalNameToBattleConfig(
            chapter.resolveStageBattleConfig!(battleId, flags, persisted),
            name
          )
      : undefined,
    getEpilogue: (won, flags) => {
      const ep = chapter.getEpilogue(won, flags);
      return {
        ...ep,
        headline: applyRivalNameToText(ep.headline, name),
        subheadline: applyRivalNameToText(ep.subheadline, name),
        badgeText: applyRivalNameToText(ep.badgeText, name),
        paragraphs: ep.paragraphs.map((p) => applyRivalNameToText(p, name)),
      };
    },
  };
}
