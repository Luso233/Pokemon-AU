import { Compiler } from 'inkjs/full';
import type { Story } from 'inkjs/engine/Story';
import type { SceneBackdropId, StoryFlags } from '../types/game';

export interface VNDialogueLine {
  id: number;
  text: string;
  speaker: string;
  bg: SceneBackdropId;
  pokemon?: string;
  side?: 'left' | 'right';
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

function parseTags(
  tags: string[] | null,
  prevBg: SceneBackdropId
): {
  bg: SceneBackdropId;
  speaker: string;
  pokemon?: string;
  side?: 'left' | 'right';
  mood?: string;
} {
  let bg: SceneBackdropId = prevBg;
  let speaker = 'Narrador';
  let pokemon: string | undefined;
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
      case 'pokemon':
        pokemon = value;
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

  return { bg, speaker, pokemon, side, mood };
}

export class InkVNRunner {
  private story: Story;
  private history: VNDialogueLine[] = [];
  private lineCounter = 0;
  private lastBg: SceneBackdropId = 'royal-pond';
  private lastPokemon: string | undefined;
  private lastSide: 'left' | 'right' | undefined;

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
      if (parsed.pokemon) {
        this.lastPokemon = parsed.pokemon;
      }
      if (parsed.side) {
        this.lastSide = parsed.side;
      }

      const line: VNDialogueLine = {
        id: ++this.lineCounter,
        text: trimmed,
        speaker: parsed.speaker,
        bg: parsed.bg,
        pokemon: parsed.pokemon ?? this.lastPokemon,
        side: parsed.side ?? this.lastSide,
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
      currentLine: this.history.length > 0 ? this.history[this.history.length - 1] : null,
      choices,
      canContinue: this.story.canContinue,
      isEnded,
      history: [...this.history],
      flags: this.getFlags(),
    };
  }
}
