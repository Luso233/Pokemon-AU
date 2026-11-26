import React, { useCallback, useEffect, useRef, useState } from 'react';
import type { User } from 'firebase/auth';
import { CHAPTERS } from './data/chapters';
import { AccountModal } from './components/AccountModal';
import { AISettingsModal } from './components/AISettingsModal';
import { ArcadeView } from './components/ArcadeView';
import { BattleArena } from './components/BattleArena';
import { ChapterSelect } from './components/ChapterSelect';
import { DevModeModal } from './components/DevModeModal';
import { EpilogueView } from './components/EpilogueView';
import { HomePage } from './components/HomePage';
import { ShopView } from './components/ShopView';
import { TeambuilderBriefing } from './components/TeambuilderBriefing';
import { TeamEditorView } from './components/TeamEditorView';
import { VersusModeView } from './components/VersusModeView';
import { VisualNovelView } from './components/VisualNovelView';
import { loadAISettings, saveAISettings } from './engine/aiProvider';
import {
  loadCloudProfile,
  saveCloudProfile,
  subscribeAuthState,
} from './engine/firebaseClient';
import {
  addDevCoins,
  applyBattleOutcomeToProfile,
  applyDevUnlockEverything,
  awardArcadeCoins,
  loadLocalProfile,
  mergeCloudAndLocalProfiles,
  purchaseHeldItem,
  purchasePokemon,
  purchaseShinyCharm,
  purchaseTM,
  recordChapterAttemptInProfile,
  resetSpeciesCustomizations,
  resetStoryProgress,
  saveLocalProfile,
  setCustomItemForSpecies,
  setCustomMoveForSpecies,
  setDevModeEnabled,
  unlockChapterWithCoins,
  unlockMoveSlotForSpecies,
  updateCustomTeamSlot,
} from './engine/playerProfile';
import type {
  AISettings,
  BattleRewardSummary,
  BattleSnapshot,
  ChapterDefinition,
  CustomTeamMember,
  MidStoryBattleRequest,
  PersistedPartyState,
  PlayerSaveProfile,
  ResolvedBattleConfig,
  ScreenView,
  StoryFlags,
} from './types/game';

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
    reward: BattleRewardSummary | null;
  }>({ won: false, snapshot: null, reward: null });

  // Unified Player Save Profile (LocalStorage + Cloud Firestore users/{uid})
  const [profile, setProfile] = useState<PlayerSaveProfile>(loadLocalProfile);
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [firebaseConfigEpoch, setFirebaseConfigEpoch] = useState(0);
  const [cloudSyncStatus, setCloudSyncStatus] = useState<
    'local' | 'syncing' | 'synced' | 'error'
  >('local');
  const [accountModalOpen, setAccountModalOpen] = useState(false);
  const [devModalOpen, setDevModalOpen] = useState(false);

  const [aiSettings, setAiSettings] = useState<AISettings>(() =>
    loadAISettings()
  );
  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [suspendedInkState, setSuspendedInkState] = useState<string | null>(
    null
  );
  const [persistedPartyState, setPersistedPartyState] =
    useState<PersistedPartyState | null>(null);

  const profileRef = useRef(profile);
  profileRef.current = profile;

  // Persist locally on every profile update
  useEffect(() => {
    saveLocalProfile(profile);
  }, [profile]);

  // Observe Firebase Auth state & sync Firestore profile on login
  useEffect(() => {
    const unsub = subscribeAuthState((user) => {
      setFirebaseUser(user);
      if (!user) {
        setCloudSyncStatus('local');
        return;
      }
      setCloudSyncStatus('syncing');
      void loadCloudProfile(user.uid)
        .then(async (cloudData) => {
          const merged = mergeCloudAndLocalProfiles(
            {
              ...profileRef.current,
              displayName:
                user.displayName || profileRef.current.displayName || 'Entrenador',
              email: user.email || profileRef.current.email || '',
            },
            cloudData
          );
          setProfile(merged);
          await saveCloudProfile(user.uid, merged);
          setCloudSyncStatus('synced');
        })
        .catch(() => {
          setCloudSyncStatus('error');
        });
    });
    return () => unsub();
  }, [firebaseConfigEpoch]);

  // Debounced auto-save to Cloud Firestore whenever profile changes while signed in
  useEffect(() => {
    if (!firebaseUser) return;
    const timer = window.setTimeout(() => {
      setCloudSyncStatus('syncing');
      void saveCloudProfile(firebaseUser.uid, profile)
        .then(() => setCloudSyncStatus('synced'))
        .catch(() => setCloudSyncStatus('error'));
    }, 650);
    return () => window.clearTimeout(timer);
  }, [profile, firebaseUser]);

  const handleForceCloudSync = useCallback(async () => {
    if (!firebaseUser) return;
    setCloudSyncStatus('syncing');
    try {
      await saveCloudProfile(firebaseUser.uid, profileRef.current);
      setCloudSyncStatus('synced');
    } catch {
      setCloudSyncStatus('error');
    }
  }, [firebaseUser]);

  const handleSaveAISettings = (next: AISettings) => {
    setAiSettings(next);
    saveAISettings(next);
  };

  const recordChapterAttempt = (chapterId: string) => {
    setProfile((prev) => recordChapterAttemptInProfile(prev, chapterId));
  };

  const startChapter = (chapter: ChapterDefinition) => {
    setActiveChapter(chapter);
    setResolvedConfig(null);
    setSuspendedInkState(null);
    setPersistedPartyState(null);
    setScreen('vn');
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

    let earnedReward: BattleRewardSummary | null = null;
    setSuspendedInkState(null);

    if (!resolvedConfig?.isVersusMatch) {
      const res = applyBattleOutcomeToProfile(
        profileRef.current,
        activeChapter.id,
        won,
        snapshot.turn,
        resolvedConfig?.flags
      );
      earnedReward = res.reward;
      setProfile(res.nextProfile);
    } else if (won && resolvedConfig.p2Control !== 'human') {
      // Friendly coin bonus for winning Versus AI matches!
      setProfile((prev) => awardArcadeCoins(prev, 250));
      earnedReward = {
        coinsEarned: 250,
        firstClearBonus: 0,
        replayBonus: 250,
        lowResetBonus: 0,
        newlyUnlockedChapterIds: [],
      };
    }

    setBattleOutcome({ won, snapshot, reward: earnedReward });
    setScreen('epilogue');
  };

  // Economy action wrappers
  const handleUnlockChapterWithCoins = (chapterId: string) => {
    const res = unlockChapterWithCoins(profileRef.current, chapterId);
    if (res.ok) setProfile(res.nextProfile);
    return res;
  };

  const handleBuyPokemon = (species: string) => {
    const res = purchasePokemon(profileRef.current, species);
    if (res.ok) setProfile(res.nextProfile);
    return res;
  };

  const handleBuyItem = (itemName: string) => {
    const res = purchaseHeldItem(profileRef.current, itemName);
    if (res.ok) setProfile(res.nextProfile);
    return res;
  };

  const handleBuyTM = (moveName: string) => {
    const res = purchaseTM(profileRef.current, moveName);
    if (res.ok) setProfile(res.nextProfile);
    return res;
  };

  const handleBuyShinyCharm = () => {
    const res = purchaseShinyCharm(profileRef.current);
    if (res.ok) setProfile(res.nextProfile);
    return res;
  };

  const handleUpdateCustomSlot = (
    slotIndex: number,
    member: CustomTeamMember
  ) => {
    const res = updateCustomTeamSlot(profileRef.current, slotIndex, member);
    if (res.ok) setProfile(res.nextProfile);
    return res;
  };

  const handleAwardArcadeCoins = useCallback((coins: number) => {
    setProfile((prev) => awardArcadeCoins(prev, coins));
  }, []);

  // Narrative Teambuilder progression wrappers
  const handleUnlockMoveSlot = (species: string, slotIndex: number) => {
    const res = unlockMoveSlotForSpecies(profileRef.current, species, slotIndex);
    if (res.ok) setProfile(res.nextProfile);
    return res;
  };

  const handleSetCustomMove = (
    species: string,
    slotIndex: number,
    moveName: string
  ) => {
    const res = setCustomMoveForSpecies(
      profileRef.current,
      species,
      slotIndex,
      moveName
    );
    if (res.ok) setProfile(res.nextProfile);
    return res;
  };

  const handleSetCustomItem = (species: string, itemName: string) => {
    setProfile((prev) => setCustomItemForSpecies(prev, species, itemName));
  };

  const handleResetSpecies = (species: string) => {
    setProfile((prev) => resetSpeciesCustomizations(prev, species));
  };

  // Dev Mode sandbox wrappers
  const handleDevUnlockEverything = () => {
    setProfile((prev) => applyDevUnlockEverything(prev));
  };

  const handleDevAddMillionCoins = () => {
    setProfile((prev) => addDevCoins(prev, 1000000));
  };

  const handleDevToggle = (enabled: boolean) => {
    setProfile((prev) => setDevModeEnabled(prev, enabled));
  };

  const handleResetStory = () => {
    setProfile((prev) => resetStoryProgress(prev));
  };

  let view: React.ReactNode = null;

  if (screen === 'home') {
    view = (
      <HomePage
        onOpenChapters={() => setScreen('chapters')}
        onOpenVersus={() => setScreen('versus')}
        onOpenShop={() => setScreen('shop')}
        onOpenTeamEditor={() => setScreen('team-editor')}
        onOpenArcade={() => setScreen('arcade')}
        onOpenAccount={() => setAccountModalOpen(true)}
        onOpenAISettings={() => setAiModalOpen(true)}
        onOpenDevMode={() => setDevModalOpen(true)}
        onQuickStartMainChapter={() => startChapter(CHAPTERS[0])}
        profile={profile}
        firebaseUser={firebaseUser}
        cloudSyncStatus={cloudSyncStatus}
        aiSettings={aiSettings}
      />
    );
  } else if (screen === 'chapters') {
    view = (
      <ChapterSelect
        onBackHome={() => setScreen('home')}
        onOpenVersus={() => setScreen('versus')}
        onOpenShop={() => setScreen('shop')}
        onOpenTeamEditor={() => setScreen('team-editor')}
        onOpenArcade={() => setScreen('arcade')}
        onOpenAccount={() => setAccountModalOpen(true)}
        onOpenDevMode={() => setDevModalOpen(true)}
        onSelectChapter={startChapter}
        onUnlockChapterWithCoins={handleUnlockChapterWithCoins}
        profile={profile}
      />
    );
  } else if (screen === 'shop') {
    view = (
      <ShopView
        profile={profile}
        onBackHome={() => setScreen('home')}
        onOpenTeamEditor={() => setScreen('team-editor')}
        onOpenArcade={() => setScreen('arcade')}
        onBuyPokemon={handleBuyPokemon}
        onBuyItem={handleBuyItem}
        onBuyTM={handleBuyTM}
        onBuyShinyCharm={handleBuyShinyCharm}
      />
    );
  } else if (screen === 'team-editor') {
    view = (
      <TeamEditorView
        profile={profile}
        onBackHome={() => setScreen('home')}
        onOpenShop={() => setScreen('shop')}
        onUpdateSlot={handleUpdateCustomSlot}
        onToggleUseCustomTeam={(enabled) =>
          setProfile((prev) => ({
            ...prev,
            useCustomTeamInStory: enabled,
            updatedAt: new Date().toISOString(),
          }))
        }
      />
    );
  } else if (screen === 'arcade') {
    view = (
      <ArcadeView
        profile={profile}
        onBackHome={() => setScreen('home')}
        onOpenShop={() => setScreen('shop')}
        onAwardCoins={handleAwardArcadeCoins}
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
        profile={profile}
        onReplayVN={() => setScreen('vn')}
        onOpenShop={() => setScreen('shop')}
        onOpenDevMode={() => setDevModalOpen(true)}
        onUnlockMoveSlot={handleUnlockMoveSlot}
        onSetCustomMove={handleSetCustomMove}
        onSetCustomItem={handleSetCustomItem}
        onResetSpecies={handleResetSpecies}
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
            ? Math.max(
                1,
                profile.completedChapters[activeChapter.id]?.attempts ?? 1
              )
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
        reward={battleOutcome.reward}
        attemptNumber={
          !resolvedConfig.isVersusMatch
            ? Math.max(
                1,
                profile.completedChapters[activeChapter.id]?.attempts ?? 1
              )
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
        onOpenShop={() => setScreen('shop')}
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
      <AccountModal
        open={accountModalOpen}
        onClose={() => setAccountModalOpen(false)}
        firebaseUser={firebaseUser}
        profile={profile}
        cloudSyncStatus={cloudSyncStatus}
        onForceCloudSync={handleForceCloudSync}
        onFirebaseConfigUpdated={() => setFirebaseConfigEpoch((e) => e + 1)}
      />
      <DevModeModal
        open={devModalOpen}
        onClose={() => setDevModalOpen(false)}
        profile={profile}
        onUnlockEverything={handleDevUnlockEverything}
        onAddMillionCoins={handleDevAddMillionCoins}
        onToggleDevMode={handleDevToggle}
        onResetStoryProgress={handleResetStory}
      />
    </>
  );
}
