export type ScreenView =
  | 'home'
  | 'chapters'
  | 'vn'
  | 'teambuilder'
  | 'battle'
  | 'epilogue';

export type BattleFormat = 'singles' | 'doubles';

export type SupportedFormatId =
  | 'gen9doublescustomgame'
  | 'gen9customgame'
  | 'gen91v1'
  | 'gen9monotype'
  | 'gen9lc'
  | (string & {});

export type CharacterId = 'prince' | 'assassin' | 'champion';

export type SceneBackdropId =
  | 'wyndon-alleys'
  | 'clocktower-ruins'
  | 'aqueduct-tunnels'
  | 'sunlit-courtyard'
  | 'royal-training-ground'
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
  /** Active slot ('0', '1', 'slot:1', 'slot:2') or species/nickname (e.g. 'Sableye', 'Metagross-Mega', 'Volcarona'). */
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
  /** Friendly format label displayed in the top battle bar (e.g. "Puzzle 3v3 Dobles", "Little Cup Nv. 5"). */
  formatLabel?: string;
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

export interface FieldSideState {
  playerName: string;
  active: (PartyPokemonState | null)[];
  party: PartyPokemonState[];
  sideConditions: string[];
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
  status: 'initializing' | 'awaiting-choice' | 'resolving' | 'ended';
  format: BattleFormat;
  formatId: SupportedFormatId;
  formatLabel: string;
  turn: number;
  weather: string;
  terrain: string;
  levelCap: number;
  puzzleApplied: boolean;
  p1: FieldSideState;
  p2: FieldSideState;
  pendingSlots: PendingDecisionSlot[];
  isForceSwitch: boolean;
  log: BattleLogEntry[];
  winner: 'p1' | 'p2' | 'tie' | null;
  lastCue: BattleAnimationCue | null;
  activeTaunt: EnemyTauntBanner | null;
  triggeredScriptIds: string[];
  koCountP2: number;
  totalP2: number;
}
