import React, { useEffect, useState } from 'react';
import { CHAPTERS } from './data/chapters';
import { BattleArena } from './components/BattleArena';
import { ChapterSelect } from './components/ChapterSelect';
import { EpilogueView } from './components/EpilogueView';
import { HomePage } from './components/HomePage';
import { TeambuilderBriefing } from './components/TeambuilderBriefing';
import { VisualNovelView } from './components/VisualNovelView';
import type {
  BattleSnapshot,
  ChapterDefinition,
  ChapterProgress,
  ResolvedBattleConfig,
  ScreenView,
  StoryFlags,
} from './types/game';

const STORAGE_KEY = 'galar-crown-vn-progress-v1';

function loadProgress(): Record<string, ChapterProgress> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Record<string, ChapterProgress>) : {};
  } catch {
    return {};
  }
}

export default function App() {
  const [screen, setScreen] = useState<ScreenView>('home');
  const [activeChapter, setActiveChapter] = useState<ChapterDefinition>(
    CHAPTERS[0]
  );
  const [resolvedConfig, setResolvedConfig] =
    useState<ResolvedBattleConfig | null>(null);
  const [battleOutcome, setBattleOutcome] = useState<{
    won: boolean;
    snapshot: BattleSnapshot | null;
  }>({ won: false, snapshot: null });
  const [progress, setProgress] =
    useState<Record<string, ChapterProgress>>(loadProgress);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
    } catch {
      // ignore storage errors
    }
  }, [progress]);

  const startChapter = (chapter: ChapterDefinition) => {
    setActiveChapter(chapter);
    setResolvedConfig(null);
    setScreen('vn');
  };

  const handleFinishVN = (flags: StoryFlags) => {
    const config = activeChapter.resolveBattleConfig(flags);
    setResolvedConfig(config);
    setScreen('teambuilder');
  };

  const handleLaunchBattle = (finalConfig: ResolvedBattleConfig) => {
    setResolvedConfig(finalConfig);
    setScreen('battle');
  };

  const handleBattleComplete = (won: boolean, snapshot: BattleSnapshot) => {
    setBattleOutcome({ won, snapshot });
    setProgress((prev) => {
      const existing = prev[activeChapter.id] ?? {
        completed: false,
        victories: 0,
      };
      return {
        ...prev,
        [activeChapter.id]: {
          completed: existing.completed || won,
          victories: existing.victories + (won ? 1 : 0),
          lastOutcome: won ? 'win' : 'loss',
          lastFlags: resolvedConfig?.flags,
        },
      };
    });
    setScreen('epilogue');
  };

  if (screen === 'home') {
    return (
      <HomePage
        onOpenChapters={() => setScreen('chapters')}
        onQuickStartMainChapter={() => startChapter(CHAPTERS[0])}
        progress={progress}
      />
    );
  }

  if (screen === 'chapters') {
    return (
      <ChapterSelect
        onBackHome={() => setScreen('home')}
        onSelectChapter={startChapter}
        progress={progress}
      />
    );
  }

  if (screen === 'vn') {
    return (
      <VisualNovelView
        chapter={activeChapter}
        onExitToChapters={() => setScreen('chapters')}
        onFinishStory={handleFinishVN}
      />
    );
  }

  if (screen === 'teambuilder' && resolvedConfig) {
    return (
      <TeambuilderBriefing
        config={resolvedConfig}
        onReplayVN={() => setScreen('vn')}
        onLaunchBattle={handleLaunchBattle}
      />
    );
  }

  if (screen === 'battle' && resolvedConfig) {
    return (
      <BattleArena
        config={resolvedConfig}
        onExitToChapters={() => setScreen('chapters')}
        onBattleComplete={handleBattleComplete}
      />
    );
  }

  if (screen === 'epilogue' && resolvedConfig) {
    return (
      <EpilogueView
        chapter={activeChapter}
        config={resolvedConfig}
        won={battleOutcome.won}
        battleSummary={battleOutcome.snapshot}
        onReplayChapter={() => startChapter(activeChapter)}
        onRetryBattle={() => setScreen('battle')}
        onOpenChapters={() => setScreen('chapters')}
        onBackHome={() => setScreen('home')}
      />
    );
  }

  return null;
}
