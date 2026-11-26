import React, { useEffect, useState } from 'react';
import { CHAPTERS } from './data/chapters';
import { AISettingsModal } from './components/AISettingsModal';
import { BattleArena } from './components/BattleArena';
import { ChapterSelect } from './components/ChapterSelect';
import { EpilogueView } from './components/EpilogueView';
import { HomePage } from './components/HomePage';
import { TeambuilderBriefing } from './components/TeambuilderBriefing';
import { VersusModeView } from './components/VersusModeView';
import { VisualNovelView } from './components/VisualNovelView';
import { loadAISettings, saveAISettings } from './engine/aiProvider';
import type {
  AISettings,
  BattleSnapshot,
  ChapterDefinition,
  ChapterProgress,
  MidStoryBattleRequest,
  PersistedPartyState,
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
  const [aiSettings, setAiSettings] = useState<AISettings>(() =>
    loadAISettings()
  );
  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [suspendedInkState, setSuspendedInkState] = useState<string | null>(
    null
  );
  const [persistedPartyState, setPersistedPartyState] =
    useState<PersistedPartyState | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
    } catch {
      // ignore storage errors
    }
  }, [progress]);

  const handleSaveAISettings = (next: AISettings) => {
    setAiSettings(next);
    saveAISettings(next);
  };

  const startChapter = (chapter: ChapterDefinition) => {
    setActiveChapter(chapter);
    setResolvedConfig(null);
    setSuspendedInkState(null);
    setPersistedPartyState(null);
    setScreen('vn');
  };

  const recordChapterAttempt = (chapterId: string) => {
    setProgress((prev) => {
      const existing = prev[chapterId] ?? {
        completed: false,
        victories: 0,
        attempts: 0,
      };
      return {
        ...prev,
        [chapterId]: {
          ...existing,
          attempts: (existing.attempts ?? 0) + 1,
        },
      };
    });
  };

  const handleFinishVN = (flags: StoryFlags) => {
    setSuspendedInkState(null);
    const rawConfig = activeChapter.resolveBattleConfig(flags);
    const config: ResolvedBattleConfig = {
      ...rawConfig,
      rivalProfile: rawConfig.rivalProfile ?? activeChapter.rivalProfile,
    };
    setResolvedConfig(config);
    setScreen('teambuilder');
  };

  const handleTriggerMidStoryBattle = (req: MidStoryBattleRequest) => {
    const resolver = activeChapter.resolveStageBattleConfig;
    const rawConfig = resolver
      ? resolver(
          req.battleId,
          req.flags,
          req.persist ? persistedPartyState ?? undefined : undefined
        )
      : activeChapter.resolveBattleConfig(req.flags);
    const config: ResolvedBattleConfig = {
      ...rawConfig,
      rivalProfile: rawConfig.rivalProfile ?? activeChapter.rivalProfile,
    };
    if (!req.persist) {
      recordChapterAttempt(activeChapter.id);
    }
    setSuspendedInkState(req.persist ? null : req.inkStateJson);
    setResolvedConfig(config);
    setScreen('battle');
  };

  const handleLaunchBattle = (finalConfig: ResolvedBattleConfig) => {
    const hydrated: ResolvedBattleConfig = {
      ...finalConfig,
      rivalProfile:
        finalConfig.rivalProfile ??
        (finalConfig.isVersusMatch ? undefined : activeChapter.rivalProfile),
    };
    if (!hydrated.isVersusMatch) {
      recordChapterAttempt(activeChapter.id);
    }
    setResolvedConfig(hydrated);
    setScreen('battle');
  };

  const handleBattleComplete = (won: boolean, snapshot: BattleSnapshot) => {
    // Back-to-Back Wave 1 -> export exact HP/status/PP and return to intermediate Ink scene!
    if (
      won &&
      suspendedInkState &&
      resolvedConfig?.nextStageLabel &&
      snapshot.exportedPartyState
    ) {
      setPersistedPartyState(snapshot.exportedPartyState);
      setScreen('vn');
      return;
    }

    setBattleOutcome({ won, snapshot });
    setSuspendedInkState(null);
    if (!resolvedConfig?.isVersusMatch) {
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
    }
    setScreen('epilogue');
  };

  let view: React.ReactNode = null;

  if (screen === 'home') {
    view = (
      <HomePage
        onOpenChapters={() => setScreen('chapters')}
        onOpenVersus={() => setScreen('versus')}
        onOpenAISettings={() => setAiModalOpen(true)}
        onQuickStartMainChapter={() => startChapter(CHAPTERS[0])}
        progress={progress}
        aiSettings={aiSettings}
      />
    );
  } else if (screen === 'chapters') {
    view = (
      <ChapterSelect
        onBackHome={() => setScreen('home')}
        onOpenVersus={() => setScreen('versus')}
        onSelectChapter={startChapter}
        progress={progress}
      />
    );
  } else if (screen === 'versus') {
    view = (
      <VersusModeView
        aiSettings={aiSettings}
        onOpenAISettings={() => setAiModalOpen(true)}
        onBackHome={() => setScreen('home')}
        onLaunchBattle={handleLaunchBattle}
      />
    );
  } else if (screen === 'vn') {
    view = (
      <VisualNovelView
        chapter={activeChapter}
        resumeInkStateJson={suspendedInkState}
        persistedPartyState={persistedPartyState}
        onExitToChapters={() => setScreen('chapters')}
        onFinishStory={handleFinishVN}
        onTriggerMidStoryBattle={handleTriggerMidStoryBattle}
      />
    );
  } else if (screen === 'teambuilder' && resolvedConfig) {
    view = (
      <TeambuilderBriefing
        config={resolvedConfig}
        onReplayVN={() => setScreen('vn')}
        onLaunchBattle={handleLaunchBattle}
      />
    );
  } else if (screen === 'battle' && resolvedConfig) {
    view = (
      <BattleArena
        config={resolvedConfig}
        aiSettings={aiSettings}
        attemptNumber={
          !resolvedConfig.isVersusMatch
            ? Math.max(1, progress[activeChapter.id]?.attempts ?? 1)
            : undefined
        }
        onRetryAttempt={
          !resolvedConfig.isVersusMatch
            ? () => recordChapterAttempt(activeChapter.id)
            : undefined
        }
        onOpenAISettings={() => setAiModalOpen(true)}
        onExitToChapters={() =>
          setScreen(resolvedConfig.isVersusMatch ? 'versus' : 'chapters')
        }
        onBattleComplete={handleBattleComplete}
      />
    );
  } else if (screen === 'epilogue' && resolvedConfig) {
    view = (
      <EpilogueView
        chapter={activeChapter}
        config={resolvedConfig}
        won={battleOutcome.won}
        battleSummary={battleOutcome.snapshot}
        attemptNumber={
          !resolvedConfig.isVersusMatch
            ? Math.max(1, progress[activeChapter.id]?.attempts ?? 1)
            : undefined
        }
        aiSettings={aiSettings}
        onOpenAISettings={() => setAiModalOpen(true)}
        onReplayChapter={() =>
          resolvedConfig.isVersusMatch
            ? setScreen('versus')
            : startChapter(activeChapter)
        }
        onRetryBattle={() => {
          if (!resolvedConfig.isVersusMatch) {
            recordChapterAttempt(activeChapter.id);
          }
          setScreen('battle');
        }}
        onOpenChapters={() => setScreen('chapters')}
        onOpenVersus={() => setScreen('versus')}
        onBackHome={() => setScreen('home')}
      />
    );
  }

  return (
    <>
      {view}
      <AISettingsModal
        open={aiModalOpen}
        settings={aiSettings}
        onSave={handleSaveAISettings}
        onClose={() => setAiModalOpen(false)}
      />
    </>
  );
}
