export type ScreenView =
  | 'home'
  | 'chapters'
  | 'vn'
  | 'teambuilder'
  | 'battle'
  | 'epilogue';

export type BattleFormat = 'singles' | 'doubles';

export type SceneBackdropId =
  | 'royal-pond'
  | 'wyndon-throne'
  | 'banquet-hall'
  | 'palace-courtyard'
  | 'dark-corridor';

export interface StoryFlags {
  [key: string]: string | number | boolean;
}

export interface DecisionTraceItem {
  id: string;
  category: 'player-roster' | 'player-set' | 'rival-team' | 'format';
  choiceLabel: string;
  flagKey: string;
  flagValue: string;
  effectTitle: string;
  effectDetail: string;
}

export interface ResolvedBattleConfig {
  chapterId: string;
  format: BattleFormat;
  formatId: string; // e.g. 'gen9customgame' | 'gen9doublescustomgame'
  playerName: string;
  rivalName: string;
  rivalTitle: string;
  arenaTheme: SceneBackdropId;
  playerTeamSummary: string;
  rivalTeamSummary: string;
  playerShowdownPaste: string;
  rivalShowdownPaste: string;
  traces: DecisionTraceItem[];
  flags: StoryFlags;
}

export interface ChapterDefinition {
  id: string;
  number: string;
  title: string;
  subtitle: string;
  tag: string;
  format: BattleFormat;
  difficulty: string;
  description: string;
  accentColor: string;
  featuredPokemon: string[];
  rivalPreview: string;
  inkSource: string;
  resolveBattleConfig: (flags: StoryFlags) => ResolvedBattleConfig;
  getEpilogue: (won: boolean, flags: StoryFlags) => EpilogueContent;
}

export interface EpilogueContent {
  headline: string;
  subheadline: string;
  paragraphs: string[];
  badgeText: string;
}

export interface ChapterProgress {
  completed: boolean;
  victories: number;
  lastOutcome?: 'win' | 'loss';
  lastFlags?: StoryFlags;
}

/* ================= Battle Engine State Types ================= */

export interface ActiveMoveOption {
  index: number; // 1-based for Showdown choice command (`move 1`)
  id: string;
  name: string;
  pp: number;
  maxpp: number;
  target: string;
  disabled: boolean;
  type: string;
  category: 'Physical' | 'Special' | 'Status';
  basePower: number;
  accuracy: number | true;
  shortDesc: string;
}

export interface PartyPokemonState {
  slotIndex: number; // 1-based for Showdown `switch N`
  ident: string;
  name: string;
  species: string;
  level: number;
  gender: string;
  hp: number;
  maxhp: number;
  hpPercent: number;
  status: string; // '', 'brn', 'par', 'psn', 'tox', 'slp', 'frz'
  fainted: boolean;
  active: boolean;
  item: string;
  ability: string;
  moves: string[];
  types: string[];
  stats?: {
    atk: number;
    def: number;
    spa: number;
    spd: number;
    spe: number;
  };
  boosts: Record<string, number>;
}

export interface FieldSideState {
  playerName: string;
  active: (PartyPokemonState | null)[];
  party: PartyPokemonState[];
  sideConditions: string[];
}

export interface BattleLogEntry {
  id: number;
  turn: number;
  kind: 'turn' | 'move' | 'damage' | 'effective' | 'status' | 'faint' | 'switch' | 'weather' | 'system' | 'win';
  text: string;
}

export interface PendingDecisionSlot {
  activeIndex: number; // 0 for singles or left slot, 1 for right slot in doubles
  pokemon: PartyPokemonState;
  moves: ActiveMoveOption[];
  trapped: boolean;
  canMegaEvo: boolean;
  canTerastallize: string | false;
  forceSwitch: boolean;
  pass?: boolean;
}

export interface BattleAnimationCue {
  id: number;
  attackerSide?: 'p1' | 'p2';
  attackerSlot?: number;
  targetSide?: 'p1' | 'p2';
  targetSlot?: number;
  callout?: string;
  calloutTone?: 'super' | 'resist' | 'crit' | 'immune' | 'status';
}

export interface BattleSnapshot {
  status: 'initializing' | 'awaiting-choice' | 'resolving' | 'ended';
  format: BattleFormat;
  turn: number;
  weather: string;
  terrain: string;
  p1: FieldSideState;
  p2: FieldSideState;
  pendingSlots: PendingDecisionSlot[];
  isForceSwitch: boolean;
  log: BattleLogEntry[];
  winner: 'p1' | 'p2' | 'tie' | null;
  lastCue: BattleAnimationCue | null;
  koCountP2: number;
  totalP2: number;
}
