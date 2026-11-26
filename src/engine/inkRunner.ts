import { Compiler } from 'inkjs/full';
import type { Story } from 'inkjs/engine/Story';
import type { CharacterId, SceneBackdropId, StoryFlags } from '../types/game';

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
  history: VNDialogueLine[];
  flags: StoryFlags;
}

function parseCharId(val: string): CharacterId | null {
  const low = val.toLowerCase();
  if (low === 'prince' || low === 'assassin' || low === 'champion') return low;
  return null;
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
} {
  let bg: SceneBackdropId = prevBg;
  let speaker = 'Narrador';
  let char: CharacterId | null | undefined;
  let clearChar: 'left' | 'right' | 'all' | undefined;
  let pokemon: string | null | undefined;
  let side: 'left' | 'right' | undefined;
  let mood: string | undefined;

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
      default:
        break;
    }
  }

  return { bg, speaker, char, clearChar, pokemon, side, mood };
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
      } else if (parsed.char === 'prince') {
        this.lastActiveSide = 'left';
      } else if (parsed.char === 'assassin' || parsed.char === 'champion') {
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

    const isEnded = !this.story.canContinue && choices.length === 0;

    return {
      currentLine:
        this.history.length > 0 ? this.history[this.history.length - 1] : null,
      choices,
      canContinue: this.story.canContinue,
      isEnded,
      history: [...this.history],
      flags: this.getFlags(),
    };
  }
}
