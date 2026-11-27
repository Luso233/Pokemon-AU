import { Compiler } from 'inkjs/full';
import type { Story } from 'inkjs/engine/Story';
import type { CharacterId, SceneBackdropId, StoryFlags } from '../types/game';

export interface InkBattleTrigger {
  battleId: string;
  persist: boolean;
}

export interface VNDialogueLine {
  id: number;
  text: string;
  speaker: string;
  bg: SceneBackdropId;
  leftChar?: CharacterId | null;
  rightChar?: CharacterId | null;
  activeSide?: 'left' | 'right';
  pokemon?: string | null;
  mood?: string;
  battleTrigger?: InkBattleTrigger | null;
  rawTags: string[];
}

export interface VNChoice {
  index: number;
  text: string;
}

export interface VNFrameState {
  currentLine: VNDialogueLine | null;
  choices: VNChoice[];
  canContinue: boolean;
  isEnded: boolean;
  pendingBattleTrigger: InkBattleTrigger | null;
  history: VNDialogueLine[];
  flags: StoryFlags;
}

const VALID_CHAR_IDS = new Set<CharacterId>([
  'prince',
  'assassin',
  'champion',
  'dark_commander',
  'rat_saboteur',
  'court_duelist',
  'solar_strategist',
  'dock_militia',
  'mine_sapper',
  'corrupt_captain',
  'hammerlocke_duke',
  'triad_knights',
  'royal_archivist',
  'clandestine_tamer',
  'colossus_keeper',
  'tobias',
  'ash_ketchum',
  'cordelia_astronomer',
  'mesoa_boss',
  'poketopia_croupier',
  'ranger_commander',
  'aeos_geneticist',
  'kemetia_keeper',
  'e4_ransei',
  'e4_ferrum',
  'e4_veridia',
  'e4_kalos',
  'bastard_brother',
]);

function parseCharId(val: string): CharacterId | null {
  const low = val.toLowerCase() as CharacterId;
  if (VALID_CHAR_IDS.has(low)) return low;
  return null;
}

function parseStartBattleValue(rawVal: string): InkBattleTrigger | null {
  const tokens = rawVal.trim().split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return null;
  const battleId = tokens[0];
  const persist = tokens.some(
    (t) => t.toLowerCase() === '--persist=true' || t.toLowerCase() === '--persist'
  );
  return { battleId, persist };
}

function parseTags(
  tags: string[] | null,
  prevBg: SceneBackdropId
): {
  bg: SceneBackdropId;
  speaker: string;
  char?: CharacterId | null;
  clearChar?: 'left' | 'right' | 'all';
  pokemon?: string | null;
  side?: 'left' | 'right';
  mood?: string;
  battleTrigger?: InkBattleTrigger | null;
} {
  let bg: SceneBackdropId = prevBg;
  let speaker = 'Narrador';
  let char: CharacterId | null | undefined;
  let clearChar: 'left' | 'right' | 'all' | undefined;
  let pokemon: string | null | undefined;
  let side: 'left' | 'right' | undefined;
  let mood: string | undefined;
  let battleTrigger: InkBattleTrigger | null | undefined;

  for (const raw of tags ?? []) {
    const idx = raw.indexOf(':');
    if (idx === -1) continue;
    const key = raw.slice(0, idx).trim().toLowerCase();
    const value = raw.slice(idx + 1).trim();
    if (!value) continue;

    switch (key) {
      case 'bg':
        bg = value as SceneBackdropId;
        break;
      case 'speaker':
        speaker = value;
        break;
      case 'char':
        if (value.toLowerCase() === 'none') {
          clearChar = 'all';
        } else {
          char = parseCharId(value);
        }
        break;
      case 'clear':
        if (value === 'left' || value === 'right' || value === 'all') {
          clearChar = value;
        }
        break;
      case 'pokemon':
        pokemon = value.toLowerCase() === 'none' ? null : value;
        break;
      case 'side':
        if (value === 'left' || value === 'right') {
          side = value;
        }
        break;
      case 'mood':
        mood = value;
        break;
      case 'start_battle':
        battleTrigger = parseStartBattleValue(value);
        break;
      default:
        break;
    }
  }

  return { bg, speaker, char, clearChar, pokemon, side, mood, battleTrigger };
}

export class InkVNRunner {
  private story: Story;
  private history: VNDialogueLine[] = [];
  private lineCounter = 0;
  private lastBg: SceneBackdropId = 'wyndon-alleys';
  private leftChar: CharacterId | null = null;
  private rightChar: CharacterId | null = null;
  private lastActiveSide: 'left' | 'right' = 'left';
  private lastPokemon: string | null = null;

  constructor(inkSource: string) {
    const compiler = new Compiler(inkSource);
    this.story = compiler.Compile() as unknown as Story;
  }

  public exportStateJson(): string {
    return this.story.state.ToJson();
  }

  public loadStateJson(stateJson: string): void {
    this.story.state.LoadJson(stateJson);
  }

  public setVariable(name: string, value: string | number | boolean): void {
    try {
      const varsState = this.story.variablesState as unknown as {
        $?: (k: string, v?: unknown) => unknown;
      };
      if (typeof varsState.$ === 'function') {
        varsState.$(name, value);
      }
    } catch {
      // variable may not be declared in every ink file
    }
  }

  public getFlags(): StoryFlags {
    const flags: StoryFlags = {};
    const varsState = this.story.variablesState as unknown as {
      _globalVariables?: Map<string, unknown>;
      $?: (name: string) => unknown;
    };

    if (varsState._globalVariables && typeof varsState.$ === 'function') {
      for (const key of varsState._globalVariables.keys()) {
        const val = varsState.$(key);
        if (
          typeof val === 'string' ||
          typeof val === 'number' ||
          typeof val === 'boolean'
        ) {
          flags[key] = val;
        }
      }
    }
    return flags;
  }

  public step(): VNFrameState {
    while (this.story.canContinue) {
      const rawText = this.story.Continue() ?? '';
      const trimmed = rawText.trim();
      const rawTags = this.story.currentTags ?? [];

      if (!trimmed) {
        continue;
      }

      const parsed = parseTags(rawTags, this.lastBg);
      this.lastBg = parsed.bg;

      if (parsed.clearChar === 'all') {
        this.leftChar = null;
        this.rightChar = null;
      } else if (parsed.clearChar === 'left') {
        this.leftChar = null;
      } else if (parsed.clearChar === 'right') {
        this.rightChar = null;
      }

      if (parsed.side) {
        this.lastActiveSide = parsed.side;
      } else if (parsed.char === 'prince' || parsed.char === 'ash_ketchum') {
        this.lastActiveSide = 'left';
      } else if (parsed.char) {
        this.lastActiveSide = 'right';
      }

      if (parsed.char) {
        if (this.lastActiveSide === 'right') {
          this.rightChar = parsed.char;
        } else {
          this.leftChar = parsed.char;
        }
      }

      if (parsed.pokemon !== undefined) {
        this.lastPokemon = parsed.pokemon;
      }

      const line: VNDialogueLine = {
        id: ++this.lineCounter,
        text: trimmed,
        speaker: parsed.speaker,
        bg: parsed.bg,
        leftChar: this.leftChar,
        rightChar: this.rightChar,
        activeSide: this.lastActiveSide,
        pokemon: this.lastPokemon,
        mood: parsed.mood,
        battleTrigger: parsed.battleTrigger ?? null,
        rawTags,
      };
      this.history.push(line);
      return this.snapshot();
    }

    return this.snapshot();
  }

  public choose(choiceIndex: number): VNFrameState {
    this.story.ChooseChoiceIndex(choiceIndex);
    return this.step();
  }

  public snapshot(): VNFrameState {
    const choices: VNChoice[] = this.story.currentChoices.map((c) => ({
      index: c.index,
      text: c.text,
    }));

    const currentLine =
      this.history.length > 0 ? this.history[this.history.length - 1] : null;
    const pendingBattleTrigger = currentLine?.battleTrigger ?? null;
    const isEnded =
      !this.story.canContinue && choices.length === 0 && !pendingBattleTrigger;

    return {
      currentLine,
      choices,
      canContinue: this.story.canContinue,
      isEnded,
      pendingBattleTrigger,
      history: [...this.history],
      flags: this.getFlags(),
    };
  }
}
