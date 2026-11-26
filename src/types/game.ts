export type ScreenView =
  | 'home'
  | 'chapters'
  | 'versus'
  | 'vn'
  | 'teambuilder'
  | 'battle'
  | 'epilogue';

export type AIProviderKind = 'gemini' | 'ollama' | 'offline';

export interface AISettings {
  provider: AIProviderKind;
  geminiApiKey: string;
  geminiModel: string;
  ollamaBaseUrl: string;
  ollamaModel: string;
  /** Feature Flag: false (dormant) by default. Enables Stateless LLM opponent when configured. */
  enableLlmOpponent: boolean;
}

export interface SavedVersusTeam {
  id: string;
  formatId: SupportedFormatId;
  prompt: string;
  normalizedPrompt: string;
  teamName: string;
  strategySummary: string;
  paste: string;
  species: string[];
  source: 'gemini' | 'ollama' | 'offline-demo' | 'manual';
  createdAt: string;
}

export interface LiveCoachAdvice {
  source: 'llm' | 'heuristic';
  modelLabel: string;
  bestPlay: string;
  safeAlternative: string;
  keyThreat: string;
  reasoning: string;
  winChanceEstimate: number;
}

export type MoveAnnotationGrade =
  | 'brilliant'
  | 'great'
  | 'good'
  | 'inaccuracy'
  | 'mistake'
  | 'blunder';

export interface KeyTurnReview {
  turn: number;
  grade: MoveAnnotationGrade;
  symbol: '!!' | '!' | '✓' | '?!' | '?' | '??';
  headline: string;
  whatHappened: string;
  betterLine: string;
}

export interface PostGameReview {
  source: 'llm' | 'heuristic';
  modelLabel: string;
  playerAccuracy: number;
  summaryVerdict: string;
  counts: {
    brilliant: number;
    good: number;
    inaccuracy: number;
    mistake: number;
    blunder: number;
  };
  keyTurns: KeyTurnReview[];
  improvements: string[];
}

export type BattleFormat = 'singles' | 'doubles';

export type ChapterCategory = 'story' | 'puzzles' | 'flashbacks' | 'showcases';

export type SupportedFormatId =
  | 'gen9doublescustomgame'
  | 'gen9customgame'
  | 'gen91v1'
  | 'gen9monotype'
  | 'gen9vgc2024regg'
  | 'gen9lc'
  | (string & {});

export type CharacterId = 'prince' | 'assassin' | 'champion';

export type SceneBackdropId =
  | 'wyndon-alleys'
  | 'clocktower-ruins'
  | 'aqueduct-tunnels'
  | 'sunlit-courtyard'
  | 'royal-training-ground'
  | 'vgc-worlds-stage'
  | 'honor-duel-hall'
  | 'banner-battlefield'
  | 'royal-pond'
  | 'banquet-hall';

export interface StoryFlags {
  [key: string]: string | number | boolean;
}

export interface DecisionTraceItem {
  id: string;
  category: 'player-roster' | 'player-set' | 'rival-team' | 'ai-script';
  choiceLabel: string;
  flagKey: string;
  flagValue: string;
  effectTitle: string;
  effectDetail: string;
}

export interface RivalIntelConfig {
  visibleSpeciesCount: number;
  totalSlots: number;
  intelLabel: string;
  intelNote: string;
  levelCap: number;
  hasBossAce: boolean;
  bossAceWarning?: string;
  aiScriptHint?: string;
}

export type BoostStatKey =
  | 'atk'
  | 'def'
  | 'spa'
  | 'spd'
  | 'spe'
  | 'accuracy'
  | 'evasion';

export type BoostsTable = Partial<Record<BoostStatKey, number>>;

export interface PuzzlePokemonModifier {
  side: 'p1' | 'p2';
  slotOrSpecies: string;
  hpPercent?: number;
  boosts?: BoostsTable;
  status?: string;
  volatiles?: string[];
  preMega?: boolean;
}

export interface PuzzleConditions {
  weather?: 'sunnyday' | 'raindance' | 'sandstorm' | 'snow';
  terrain?:
    | 'grassyterrain'
    | 'electricterrain'
    | 'mistyterrain'
    | 'psychicterrain';
  sideConditions?: { p1?: string[]; p2?: string[] };
  pokemonModifiers?: PuzzlePokemonModifier[];
}

export interface ScriptedEnemyRule {
  id: string;
  description: string;
  tauntLine?: string;
  turn?: number;
  actorSpecies?: string;
  condition?: 'always' | 'hpBelow60' | 'playerHasScreens' | 'playerHasSpecies';
  requiredPlayerSpecies?: string;
  forceMoveId: string;
  targetSpec?: string;
  once?: boolean;
}

export interface ResolvedBattleConfig {
  chapterId: string;
  format: BattleFormat;
  formatId: SupportedFormatId;
  formatLabel?: string;
  /** Enables interactive Team Preview inside BattleArena (Pick 1 of 3 in 1v1, Pick 4 of 6 in VGC, Lead 1 of 6 in Monotype). */
  interactiveTeamPreview?: boolean;
  /** Enables Open Teamsheet inspection modal (full rival sets visible like Worlds VGC!). */
  openTeamsheet?: boolean;
  /** Optional preferred Showdown `team ...` order for Rival AI during Team Preview (e.g. 'team 5631' for Yuta). */
  preferredRivalTeamOrder?: string;
  /** Controls who pilots Player 2: 'ai' (default) or 'human' (Local Hotseat 1v1). */
  p2Control?: 'ai' | 'human';
  /** Marks a custom AI Teambuilder / Versus match (exits back to Versus Mode). */
  isVersusMatch?: boolean;
  playerName: string;
  playerCharId: CharacterId;
  rivalName: string;
  rivalTitle: string;
  rivalCharId: CharacterId;
  arenaTheme: SceneBackdropId;
  playerTeamSummary: string;
  rivalTeamSummary: string;
  playerShowdownPaste: string;
  rivalShowdownPaste: string;
  rivalIntel: RivalIntelConfig;
  puzzleConditions?: PuzzleConditions;
  scriptedEnemyRules: ScriptedEnemyRule[];
  traces: DecisionTraceItem[];
  flags: StoryFlags;
}

export interface ChapterDefinition {
  id: string;
  category: ChapterCategory;
  number: string;
  title: string;
  subtitle: string;
  tag: string;
  format: BattleFormat;
  formatId: SupportedFormatId;
  formatLabel: string;
  difficulty: string;
  description: string;
  accentColor: string;
  featuredPokemon: string[];
  rivalPreview: string;
  monotypeMatchup?: { playerType: string; rivalType: string };
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
  index: number;
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
  priority: number;
  shortDesc: string;
}

export interface RevealedMoveInfo {
  id: string;
  name: string;
  type: string;
  used: number;
  maxPP: number;
}

export interface SpeedRange {
  min: number;
  max: number;
  baseMin: number;
  baseMax: number;
  modifiers: string[];
}

export interface PartyPokemonState {
  slotIndex: number;
  ident: string;
  name: string;
  species: string;
  level: number;
  gender: string;
  hp: number;
  maxhp: number;
  hpPercent: number;
  status: string;
  fainted: boolean;
  active: boolean;
  item: string;
  ability: string;
  moves: string[];
  types: string[];
  teraType?: string;
  terastallized: string | null;
  stats?: {
    atk: number;
    def: number;
    spa: number;
    spd: number;
    spe: number;
  };
  boosts: Record<string, number>;
  revealed: boolean;
  revealedAbility: string | null;
  possibleAbilities: string[];
  revealedItem: string | null;
  consumedItem: string | null;
  revealedMoves: Record<string, RevealedMoveInfo>;
  volatiles: string[];
  speedRange?: SpeedRange;
  isBossAce?: boolean;
}

export interface OpenTeamsheetEntry {
  species: string;
  level: number;
  item: string;
  ability: string;
  teraType: string;
  moves: string[];
  types: string[];
}

export interface TeamPreviewState {
  active: boolean;
  mode: 'pick-1' | 'pick-4' | 'lead-1';
  pickCount: number;
  playerRoster: PartyPokemonState[];
  rivalRoster: Array<{
    species: string;
    level: number;
    gender: string;
    types: string[];
    openSheet?: OpenTeamsheetEntry;
  }>;
}

export interface FieldSideState {
  playerName: string;
  active: (PartyPokemonState | null)[];
  party: PartyPokemonState[];
  sideConditions: string[];
  sideTimers: Record<string, number>;
}

export interface BattleLogEntry {
  id: number;
  turn: number;
  kind:
    | 'turn'
    | 'move'
    | 'damage'
    | 'effective'
    | 'status'
    | 'boost'
    | 'ability'
    | 'item'
    | 'faint'
    | 'switch'
    | 'weather'
    | 'script'
    | 'puzzle'
    | 'system'
    | 'win';
  text: string;
}

export interface PendingDecisionSlot {
  activeIndex: number;
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

export interface EnemyTauntBanner {
  id: number;
  turn: number;
  speaker: string;
  charId: CharacterId;
  text: string;
  ruleDescription: string;
}

export interface BattleSnapshot {
  status:
    | 'initializing'
    | 'team-preview'
    | 'awaiting-choice'
    | 'resolving'
    | 'ended';
  format: BattleFormat;
  formatId: SupportedFormatId;
  formatLabel: string;
  turn: number;
  weather: string;
  weatherTurnsLeft: number | null;
  terrain: string;
  terrainTurnsLeft: number | null;
  trickRoomTurnsLeft: number | null;
  levelCap: number;
  puzzleApplied: boolean;
  teamPreview: TeamPreviewState | null;
  openTeamsheet: {
    enabled: boolean;
    player: OpenTeamsheetEntry[];
    rival: OpenTeamsheetEntry[];
  };
  p1: FieldSideState;
  p2: FieldSideState;
  pendingSlots: PendingDecisionSlot[];
  isForceSwitch: boolean;
  requestSeq: number;
  /** Hotseat P1 vs P2 fields (populated when config.p2Control === 'human'). */
  p2Control: 'ai' | 'human';
  p2HumanParty: PartyPokemonState[];
  p2PendingSlots: PendingDecisionSlot[];
  p2IsForceSwitch: boolean;
  p2TeamPreview: TeamPreviewState | null;
  p2RequestSeq: number;
  p1Waiting: boolean;
  p2Waiting: boolean;
  activeRivalController: 'heuristic' | 'llm' | 'human';
  log: BattleLogEntry[];
  winner: 'p1' | 'p2' | 'tie' | null;
  lastCue: BattleAnimationCue | null;
  activeTaunt: EnemyTauntBanner | null;
  triggeredScriptIds: string[];
  koCountP2: number;
  totalP2: number;
}
