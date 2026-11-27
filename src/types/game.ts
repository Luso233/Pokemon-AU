export type ScreenView =
  | 'home'
  | 'chapters'
  | 'versus'
  | 'shop'
  | 'team-editor'
  | 'arcade'
  | 'vn'
  | 'teambuilder'
  | 'battle'
  | 'epilogue';

export interface CustomTeamMember {
  species: string;
  item: string;
  ability: string;
  nature: string;
  teraType: string;
  moves: string[];
  shiny: boolean;
}

export type PokemonStorageZone = 'party' | 'box' | 'house' | 'graveyard';

export interface PokemonEpitaph {
  chapterTitle: string;
  rivalName: string;
  turn: number;
  fallenAt: string;
}

export interface OwnedPokemonInstance {
  uid: string;
  species: string;
  nickname?: string;
  origin: string;
  zone: PokemonStorageZone;
  item: string;
  ability: string;
  nature: string;
  teraType: string;
  moves: string[];
  shiny: boolean;
  /** Persistent Ironman health/status/PP frozen on this exact individual (Box NEVER heals!). */
  hp: number | null;
  maxhp: number | null;
  status: '' | 'par' | 'brn' | 'psn' | 'tox' | 'slp' | 'frz';
  ppByMoveId?: Record<string, number>;
  /** Populated when fainted permanently in Ultra Nuzlocke Diablo mode. */
  epitaph?: PokemonEpitaph;
}

export interface PlayerInventory {
  pokemon: string[];
  items: string[];
  tms: string[];
  /** Max 6 Shiny Charms (one per team slot). */
  shinyCharms: number;
}

export type BerryKind = 'lum' | 'sitrus' | 'leppa';

export interface CampBerryPlot {
  plotIndex: number;
  berry: BerryKind | null;
  /** Number of battles remaining until harvestable (0 = ready!). */
  battlesLeft: number;
}

export type SocialLinkRank = 0 | 1 | 2 | 3;

export interface SocialLinkProgress {
  rank: SocialLinkRank;
  /** Rank 1 VN event completed */
  r1Done: boolean;
  /** Rank 2 2v2 Tag-Team battle completed */
  r2Done: boolean;
  /** Rank 3 Unfair Rematch completed */
  r3Done: boolean;
}

export type VnPacingMode = 'full' | 'decisions-only' | 'skip-to-battle';

export type ChapterTeamPolicy = 'fixed' | 'editable';

export interface BattleFatalBlow {
  attackerSpecies: string;
  moveName: string;
  victimSpecies: string;
  turn: number;
  rivalName?: string;
}

export interface RunDeathSummary {
  id: string;
  runName: string;
  chapterId: string;
  chapterLabel: string;
  turn: number;
  difficulty: BattleDifficultyMode;
  ironmanMode: boolean;
  nuzlockePermadeath: boolean;
  isTotalNuzlockeWipe: boolean;
  killerSpecies: string;
  killerMove: string;
  rivalName: string;
  victimSpecies: string;
  recordedAt: string;
}

export interface SaveSlotRecord {
  slotIndex: number;
  runName: string;
  savedAt: string;
  profile: PlayerSaveProfile;
  completedCount: number;
  aliveCount: number;
  isRunDead: boolean;
  lastDeath?: RunDeathSummary | null;
}

export interface PlayerSaveProfile {
  displayName: string;
  email: string;
  /** Human-readable run title for Save/Load slots and X/Twitter sharing. */
  runName?: string;
  /** Active save slot index (1..5) in PokéRogue Save/Load system. */
  activeSaveSlot?: number;
  /** Narrative pacing preference chosen at New Game or Settings. */
  vnPacingMode?: VnPacingMode;
  /** Tracks whether Prologue / Chapter 01 has been entered/cleared so "Continue" goes straight to Chapter Select. */
  hasStartedRun?: boolean;
  coins: number;
  unlockedChapters: string[];
  completedChapters: Record<string, ChapterProgress>;
  inventory: PlayerInventory;
  customTeam: CustomTeamMember[];
  useCustomTeamInStory: boolean;
  /** Species key (e.g. 'arcanine') -> unlocked move slot indices (0..3). */
  unlockedMoveSlots: Record<string, number[]>;
  /** Species key -> slot index ('0'..'3') -> legal custom move name. */
  customMoves: Record<string, Record<string, string>>;
  /** Species key -> custom held item override from owned + chapter items. */
  customItems: Record<string, string>;
  /** Dev Mode sandbox toggle (free move slots + debug tools). */
  devModeEnabled: boolean;
  /** Affinity / Romance ranks per romanceable NPC ID (0..3). */
  socialLinks: Record<string, SocialLinkProgress>;
  /** First romanceable NPC to reach Rank 3 (never overwritten; defines default Romantic Ending). */
  firstRomanceMaxedId: string | null;
  /** Survival Run Modifiers: Ironman (persistent HP/PP/status across chapters) & Ultra Nuzlocke Diablo (permadeath). */
  ironmanMode: boolean;
  nuzlockePermadeath: boolean;
  defaultDifficulty: BattleDifficultyMode;
  /** Persistent party HP/Status/PP carried between chapters when Ironman Mode is active. */
  ironmanPartyState: PersistedPartyState | null;
  /** Species keys of permanently fallen Pokémon when Ultra Nuzlocke Diablo is active. */
  fallenPokemon: string[];
  /** Camp Berry Garden plots (base 2 + extra plots from Romance Rank 1 perks). */
  campGarden: CampBerryPlot[];
  /** Harvested camp berries ready to cure HP, status, or PP in Ironman mode. */
  campBerries: Record<BerryKind, number>;
  /** Free emergency camp heal charges remaining (granted by Champion Rank 1 perk). */
  freeEmergencyHeals: number;
  /** Unique per-individual Pokémon PC Boxes (party / box / house / graveyard) with frozen Ironman state. */
  pokemonBox: OwnedPokemonInstance[];
  /** Real held-item quantities (prevents cloning 6 Sitrus Berries when you only own 1!). */
  itemStock: Record<string, number>;
  /** Biogeographical Campaign Pokédex: species unlocked for purchase in the Black Market Shop! */
  unlockedPokedex: string[];
  updatedAt: string;
}

export interface BattleRewardSummary {
  coinsEarned: number;
  firstClearBonus: number;
  replayBonus: number;
  lowResetBonus: number;
  /** Nuzlocke permanent casualty reimbursement (85% default / 95% Mesoa R1 of dynamic Smogon+BST shop price). */
  casualtyIndemnificationCoins?: number;
  casualtyTaxRate?: number;
  casualtyBreakdown?: Array<{
    species: string;
    bst: number;
    shopPrice: number;
    payout: number;
  }>;
  /** 3–4 biogeographical species rolled from the chapter's region into the player's buyable Pokédex! */
  unlockedPokedexSpecies?: Array<{
    species: string;
    regionName: string;
    price: number;
    tier: string;
    bst: number;
  }>;
  /** True when replaying a cleared chapter under strict Anti-Grind rules (Ironman/Nuzlocke/Difícil/Tryhard). */
  antiGrindBlocked?: boolean;
  newlyUnlockedChapterIds: string[];
  rewardItems?: string[];
  rewardPokemon?: Array<{ species: string; note: string }>;
}

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

export type BattleFormat = 'singles' | 'doubles' | 'triples';

export type ChapterCategory =
  | 'story'
  | 'puzzles'
  | 'flashbacks'
  | 'showcases'
  | 'challenges'
  | 'survival'
  | 'archive'
  | 'anime';

export type SupportedFormatId =
  | 'gen9doublescustomgame'
  | 'gen9customgame'
  | 'gen9nationaldex'
  | 'gen91v1'
  | 'gen9monotype'
  | 'gen9vgc2024regg'
  | 'gen9lc'
  | 'gen6triplescustomgame'
  | 'gen1customgame'
  | (string & {});

export type CharacterId =
  | 'prince'
  | 'assassin'
  | 'champion'
  | 'dark_commander'
  | 'rat_saboteur'
  | 'court_duelist'
  | 'solar_strategist'
  | 'dock_militia'
  | 'mine_sapper'
  | 'corrupt_captain'
  | 'hammerlocke_duke'
  | 'triad_knights'
  | 'knight_cain'
  | 'knight_abel'
  | 'knight_frey'
  | 'royal_archivist'
  | 'clandestine_tamer'
  | 'colossus_keeper'
  | 'tobias'
  | 'ash_ketchum';

export type BattleDifficultyMode = 'baby' | 'standard' | 'kaizo' | 'nightmare';

export interface NpcAiPersonality {
  styleName: string;
  /** 0..1: Raw offensive KO pressure vs patience/setup. */
  aggression: number;
  /** 0..1: Bias toward status, hazards, Taunt, Encore, Spore, Revival Blessing. */
  disruptionBias: number;
  /** 0..1: Bias toward Protect, Recover, Wide Guard, Destiny Bond. */
  protectBias: number;
  /** 0..1: Tactical discipline & switching conservatism. */
  switchDiscipline: number;
  directiveSummary: string;
}

export interface NpcBattleDialogues {
  onBattleStart?: string[];
  onFirstFoeKO?: string[];
  onPlayerFaint?: string[];
  onSuperEffective?: string[];
  onAceEntry?: string[];
  onLowHp?: string[];
  onVictory?: string[];
  onDefeat?: string[];
}

export interface NpcSocialLinkMeta {
  bondTrack: 'rival-romance' | 'mentor' | 'noble-house' | 'antagonist' | 'legend';
  romanceable?: boolean;
  canTagPartner?: boolean;
  bondNote?: string;
}

export interface NpcTeamVariant {
  id: string;
  label: string;
  description: string;
  rivalShowdownPaste?: string;
  reserveAsLastAceSpecies?: string;
}

export interface NpcDefinition {
  id: CharacterId;
  name: string;
  title: string;
  bio: string;
  tacticalInsight: string;
  archetypeTag: string;
  personality: NpcAiPersonality;
  dialogues: NpcBattleDialogues;
  socialLink?: NpcSocialLinkMeta;
  chapterVariants?: Record<string, NpcTeamVariant[]>;
}

export type SceneBackdropId =
  | 'wyndon-alleys'
  | 'clocktower-ruins'
  | 'aqueduct-tunnels'
  | 'sunlit-courtyard'
  | 'royal-training-ground'
  | 'vgc-worlds-stage'
  | 'honor-duel-hall'
  | 'banner-battlefield'
  | 'wyndon-docks'
  | 'galar-mines'
  | 'hammerlocke-field'
  | 'triad-arena'
  | 'silph-archive'
  | 'underground-ring'
  | 'titan-sanctum'
  | 'lily-of-the-valley'
  | 'royal-pond'
  | 'banquet-hall';

export interface RivalProfile {
  name: string;
  title: string;
  bio: string;
  tacticalInsight: string;
  archetypeTag: string;
  personalityStyle?: string;
  directiveSummary?: string;
  bondBadge?: string;
}

export interface PersistedMoveSlot {
  id: string;
  move: string;
  pp: number;
  maxpp: number;
}

export interface PersistedPokemonState {
  species: string;
  name: string;
  hp: number;
  maxhp: number;
  fainted: boolean;
  status: '' | 'par' | 'brn' | 'psn' | 'tox' | 'slp' | 'frz';
  moveSlots: PersistedMoveSlot[];
  ppByMoveId: Record<string, number>;
}

export interface PersistedPartyState {
  sourceBattleId: string;
  capturedAtTurn: number;
  pokemon: PersistedPokemonState[];
}

export interface MidStoryBattleRequest {
  battleId: string;
  persist: boolean;
  flags: StoryFlags;
  inkStateJson: string;
}

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
  /** Volatiles or ability counters (e.g. 'slowstart') removed at Turn 0 before Turn 1. */
  removeVolatiles?: string[];
  /** Substitute HP ratio of maxhp when injecting 'substitute' at Turn 0 (e.g. 0.25). */
  substituteHpRatio?: number;
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
  /** Optional custom log announcement when Turn 0 conditions activate. */
  bannerLog?: string;
}

export interface ScriptedEnemyRule {
  id: string;
  description: string;
  tauntLine?: string;
  turn?: number;
  /** Optional list of turns on which this rule can fire (e.g. [1, 3] for recurring Wide Guard). */
  turnList?: number[];
  actorSpecies?: string;
  /** When true, only fires during the actor's first active turn after switching in. */
  onFirstActiveTurn?: boolean;
  condition?:
    | 'always'
    | 'hpBelow60'
    | 'hpBelow35OrLast'
    | 'lastAlive'
    | 'playerHasScreens'
    | 'playerHasSpecies'
    | 'foePositiveBoostsAtLeast4'
    | 'hpBelow35AndKeyAllyDamaged';
  requiredPlayerSpecies?: string;
  /** Species checked by `hpBelow35AndKeyAllyDamaged` (e.g. ['Giratina-Origin', 'Darkrai']). */
  allySpeciesList?: string[];
  forceMoveId: string;
  /** When true, appends `terastallize` if available when this scripted rule fires. */
  forceTera?: boolean;
  targetSpec?: string;
  once?: boolean;
}

export interface ResolvedBattleConfig {
  chapterId: string;
  /** Optional stage identifier for Back-to-Back multi-wave chapters (e.g. 'mines_wave1', 'mines_wave2'). */
  battleStageId?: string;
  /** Optional label for the continue button when winning a mid-story wave (before Ink resumes). */
  nextStageLabel?: string;
  format: BattleFormat;
  formatId: SupportedFormatId;
  formatLabel?: string;
  /** Enables interactive Team Preview inside BattleArena (Pick 1 of 3 in 1v1, Pick 4 of 6 in VGC, Lead 1 of 6 in Monotype). */
  interactiveTeamPreview?: boolean;
  /** Enables Open Teamsheet inspection modal (full rival sets visible like Worlds VGC!). */
  openTeamsheet?: boolean;
  /** Optional preferred Showdown `team ...` order for Rival AI during Team Preview (e.g. 'team 5631' for Yuta). */
  preferredRivalTeamOrder?: string;
  /** Optional Ace species that the Rival AI saves for LAST on forced switches (e.g. 'Giratina-Origin'). */
  reserveAsLastAceSpecies?: string;
  /** Controls who pilots Player 2: 'ai' (default) or 'human' (Local Hotseat 1v1). */
  p2Control?: 'ai' | 'human';
  /** Marks a custom AI Teambuilder / Versus match (exits back to Versus Mode). */
  isVersusMatch?: boolean;
  /** Pre-battle persisted party state injected without healing (Back-to-Back survival battles). */
  persistedPartyState?: PersistedPartyState;
  /** Indices of hidden placeholder player slots auto-fainted before Turn 1 (for 1 vs 6 Doubles and 1 vs 3 Triples). */
  emptyPlayerSlots?: number[];
  playerName: string;
  playerCharId: CharacterId;
  rivalName: string;
  rivalTitle: string;
  rivalCharId: CharacterId;
  /** Narrative & tactical profile shown in RivalPortraitTooltip during Team Preview and live combat. */
  rivalProfile?: RivalProfile;
  /** Combat directives driving heuristic AI behavior per NPC personality. */
  npcPersonality?: NpcAiPersonality;
  /** Event-reactive battle quotes (first KO, Ace entry, low HP, super effective, etc.). */
  npcDialogues?: NpcBattleDialogues;
  /** Active battle difficulty tier ('standard' | 'kaizo' | 'nightmare'). */
  difficultyMode?: BattleDifficultyMode;
  /** Selected or randomized NPC team variant ID. */
  selectedVariantId?: string;
  selectedVariantLabel?: string;
  /** Romance Social Link battle metadata (Rank 2 Tag 2v2 or Rank 3 Unfair Rematch). */
  romanceMeta?: {
    npcId: CharacterId;
    targetRank: 2 | 3;
    mode: 'tag-2v2' | 'unfair-rematch';
    partnerLabel?: string;
  };
  /** Rank 2 Romance Anti-Diablo scouting alerts revealed in Teambuilder. */
  diabloScoutingAlerts?: string[];
  /** Indicates active Ironman / Nuzlocke run rules for Diablo AI context & post-battle persistence. */
  isIronmanActive?: boolean;
  isNuzlockeActive?: boolean;
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

export interface ChapterShowcaseSprite {
  species: string;
  mode: 'player-ace' | 'boss';
  label?: string;
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
  /** Distinguishes fixed single-team chapters (puzzles/archives/flashbacks) from editable-team chapters! */
  teamEditPolicy?: ChapterTeamPolicy;
  /** Single spoiler-free spotlight sprite shown on the Chapter Select card. */
  showcaseSprite: ChapterShowcaseSprite;
  featuredPokemon: string[];
  rivalPreview: string;
  rivalProfile: RivalProfile;
  monotypeMatchup?: { playerType: string; rivalType: string };
  inkSource: string;
  resolveBattleConfig: (flags: StoryFlags) => ResolvedBattleConfig;
  /** Optional resolver for Ink `# START_BATTLE: <battleId>` mid-story / Back-to-Back waves. */
  resolveStageBattleConfig?: (
    battleId: string,
    flags: StoryFlags,
    persistedPartyState?: PersistedPartyState
  ) => ResolvedBattleConfig;
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
  /** True once first-clear coins, Pokédex rolls & chapter Pokémon reward have been claimed (enforces Anti-Grind!). */
  rewardsClaimed?: boolean;
  victories: number;
  attempts?: number;
  bestTurns?: number | null;
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
  /** Configured happiness of the user (0..255), used for Frustration / Return tooltips. */
  userHappiness?: number;
  /** Special gimmick/power callout (e.g. Frustration at Happiness 0). */
  powerNote?: string;
}

export interface RevealedMoveInfo {
  id: string;
  name: string;
  type: string;
  used: number;
  maxPP: number;
  basePower?: number;
  powerNote?: string;
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
  happiness?: number;
  shiny?: boolean;
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
  persistenceApplied: boolean;
  exportedPartyState: PersistedPartyState | null;
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
  /** Exact rival Pokémon & move that delivered the final KO against the player (for Nuzlocke/Defeat X sharing!). */
  lastFatalBlow?: BattleFatalBlow | null;
}
