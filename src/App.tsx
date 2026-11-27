import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { User } from 'firebase/auth';
import { CHAPTERS } from './data/chapters';
import { buildRivalProfileFromNpc, getNpcDefinition } from './data/npcProfiles';
import { AccountModal } from './components/AccountModal';
import { AISettingsModal } from './components/AISettingsModal';
import { ArcadeView } from './components/ArcadeView';
import { BattleArena } from './components/BattleArena';
import { ChapterSelect } from './components/ChapterSelect';
import { DevModeModal } from './components/DevModeModal';
import { EpilogueView } from './components/EpilogueView';
import { HomePage, type NewRunLaunchOptions } from './components/HomePage';
import { SaveLoadModal } from './components/SaveLoadModal';
import { ShopView } from './components/ShopView';
import { SocialLinksCampModal } from './components/SocialLinksCampModal';
import { TeambuilderBriefing } from './components/TeambuilderBriefing';
import { TeamEditorView } from './components/TeamEditorView';
import { VersusModeView } from './components/VersusModeView';
import { VisualNovelView } from './components/VisualNovelView';
import { loadAISettings, saveAISettings } from './engine/aiProvider';
import { InkVNRunner } from './engine/inkRunner';
import {
  loadCloudProfile,
  saveCloudProfile,
  subscribeAuthState,
} from './engine/firebaseClient';
import {
  addDevCoins,
  applyBattleOutcomeToProfile,
  applyDevPopulateAllSpeciesToBox,
  applyDevUnlockEverything,
  applyDevUnlockFullAgPokedex,
  awardArcadeCoins,
  buildIronmanPersistedStateForBattle,
  campHealPartyMember,
  clearNuzlockeFallenAndIronman,
  completeRomanceRank,
  createNewConfiguredRunProfile,
  deleteSavedCampaignTeam,
  equipItemOnInstance,
  harvestCampBerry,
  importShowdownPasteToParty,
  loadLocalProfile,
  loadSavedCampaignTeam,
  mergeCloudAndLocalProfiles,
  movePokemonInstanceZone,
  plantCampBerry,
  purchaseHeldItem,
  purchasePokemon,
  purchaseShinyCharm,
  recordChapterAttemptInProfile,
  recordPostBattleSurvivalState,
  recruitHousePokemonToCustomSlot,
  releasePokemonInstance,
  resetSpeciesCustomizations,
  resetStoryProgress,
  saveCurrentPartyAsTeam,
  saveLocalProfile,
  setCustomItemForSpecies,
  setCustomMoveForSpecies,
  setCustomRivalName,
  setDevModeEnabled,
  spawnDevAgSpecimen,
  toggleRunModifiers,
  unlockChapterWithCoins,
  unlockMoveSlotForSpecies,
  updatePokemonInstanceBuild,
} from './engine/playerProfile';
import {
  applyRivalNameToBattleConfig,
  applyRivalNameToChapter,
  getRivalName,
} from './engine/rivalName';
import {
  appendRunHistoryEntry,
  buildRunDeathSummary,
  countAliveBoxPokemon,
  deleteSaveSlot,
  loadRunHistory,
  loadSaveSlots,
  saveProfileToSlot,
} from './engine/saveSlots';
import {
  buildRomanceChapterDefinition,
  ROMANCE_CHAPTERS,
} from './data/romanceChapters';
import type {
  AISettings,
  BattleDifficultyMode,
  BattleRewardSummary,
  BattleSnapshot,
  BerryKind,
  ChapterDefinition,
  CustomTeamMember,
  MidStoryBattleRequest,
  OwnedPokemonInstance,
  PersistedPartyState,
  PlayerSaveProfile,
  PokemonStorageZone,
  ResolvedBattleConfig,
  RunDeathSummary,
  SaveSlotRecord,
  ScreenView,
  StoryFlags,
  VnPacingMode,
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
    deathSummary: RunDeathSummary | null;
  }>({ won: false, snapshot: null, reward: null, deathSummary: null });

  // Unified Player Save Profile (LocalStorage + 5 Save Slots + Cloud Firestore users/{uid})
  const [profile, setProfile] = useState<PlayerSaveProfile>(loadLocalProfile);
  const [saveSlots, setSaveSlots] = useState<Record<number, SaveSlotRecord>>(
    loadSaveSlots
  );
  const [runHistory, setRunHistory] = useState<RunDeathSummary[]>(
    loadRunHistory
  );
  const [saveLoadModalOpen, setSaveLoadModalOpen] = useState(false);
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [firebaseConfigEpoch, setFirebaseConfigEpoch] = useState(0);
  const [cloudSyncStatus, setCloudSyncStatus] = useState<
    'local' | 'syncing' | 'synced' | 'error'
  >('local');
  const [accountModalOpen, setAccountModalOpen] = useState(false);
  const [devModalOpen, setDevModalOpen] = useState(false);
  const [campModalOpen, setCampModalOpen] = useState(false);

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

  const activeRivalName = getRivalName(profile);
  const personalizedActiveChapter = useMemo(
    () => applyRivalNameToChapter(activeChapter, activeRivalName),
    [activeChapter, activeRivalName]
  );

  // Persist locally & auto-sync active save slot on every profile update (including Dev Mode & PC Box edits!)
  useEffect(() => {
    saveLocalProfile(profile);
    const hasProgress =
      profile.hasStartedRun ||
      profile.devModeEnabled ||
      profile.useCustomTeamInStory ||
      profile.pokemonBox.length > 6 ||
      Object.values(profile.completedChapters).some((p) => p?.completed);
    if (hasProgress) {
      setSaveSlots(saveProfileToSlot(profile, profile.activeSaveSlot ?? 1));
    }
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

  const startChapter = (
    chapter: ChapterDefinition,
    overrideVnMode?: VnPacingMode
  ) => {
    const rawChapter =
      CHAPTERS.find((c) => c.id === chapter.id) ??
      ROMANCE_CHAPTERS.find((c) => c.id === chapter.id) ??
      chapter;
    const rivalName = getRivalName(profileRef.current);
    const localizedChapter = applyRivalNameToChapter(rawChapter, rivalName);
    setActiveChapter(rawChapter);
    setResolvedConfig(null);
    setSuspendedInkState(null);
    setPersistedPartyState(null);

    const effectiveVnMode =
      overrideVnMode ?? profileRef.current.vnPacingMode ?? 'full';
    if (effectiveVnMode === 'skip-to-battle') {
      const runner = new InkVNRunner(localizedChapter.inkSource);
      let cur = runner.step();
      let safety = 0;
      while (safety < 140 && !cur.isEnded && !cur.pendingBattleTrigger) {
        if (cur.canContinue) cur = runner.step();
        else if (cur.choices.length > 0) cur = runner.choose(0);
        else break;
        safety++;
      }
      if (cur.pendingBattleTrigger) {
        const resolver = localizedChapter.resolveStageBattleConfig;
        const rawStage = resolver
          ? resolver(cur.pendingBattleTrigger.battleId, cur.flags, undefined)
          : localizedChapter.resolveBattleConfig(cur.flags);
        const npcDef = getNpcDefinition(rawStage.rivalCharId);
        const stageConfig = applyRivalNameToBattleConfig(
          {
            ...rawStage,
            rivalProfile: buildRivalProfileFromNpc(
              rawStage.rivalCharId,
              rawStage.rivalProfile ?? localizedChapter.rivalProfile
            ),
            npcPersonality: rawStage.npcPersonality ?? npcDef.personality,
            npcDialogues: rawStage.npcDialogues ?? npcDef.dialogues,
          },
          rivalName
        );
        if (!cur.pendingBattleTrigger.persist) {
          recordChapterAttempt(localizedChapter.id);
        }
        setSuspendedInkState(
          cur.pendingBattleTrigger.persist ? null : runner.exportStateJson()
        );
        setResolvedConfig(stageConfig);
        setScreen('battle');
        return;
      }
      const rawConfig = localizedChapter.resolveBattleConfig(cur.flags);
      const npcDef = getNpcDefinition(rawConfig.rivalCharId);
      const config = applyRivalNameToBattleConfig(
        {
          ...rawConfig,
          rivalProfile: buildRivalProfileFromNpc(
            rawConfig.rivalCharId,
            rawConfig.rivalProfile ?? localizedChapter.rivalProfile
          ),
          npcPersonality: rawConfig.npcPersonality ?? npcDef.personality,
          npcDialogues: rawConfig.npcDialogues ?? npcDef.dialogues,
        },
        rivalName
      );
      setResolvedConfig(config);
      setScreen('teambuilder');
      return;
    }

    setScreen('vn');
  };

  const handleContinueGame = () => {
    const cur = profileRef.current;
    const hasStarted =
      cur.hasStartedRun ||
      Object.values(cur.completedChapters).some((p) => p?.completed);
    if (hasStarted) {
      setScreen('chapters');
    } else {
      startChapter(CHAPTERS[0]);
    }
  };

  const handleStartNewRun = (options: NewRunLaunchOptions) => {
    const fresh = createNewConfiguredRunProfile({
      displayName: profileRef.current.displayName,
      email: profileRef.current.email,
      runName: options.runName,
      rivalName: options.rivalName,
      slotIndex: options.slotIndex,
      vnPacingMode: options.vnPacingMode,
      defaultDifficulty: options.defaultDifficulty,
      ironmanMode: options.ironmanMode,
      nuzlockePermadeath: options.nuzlockePermadeath,
    });
    profileRef.current = fresh;
    setProfile(fresh);
    setSaveSlots(saveProfileToSlot(fresh, options.slotIndex));
    startChapter(CHAPTERS[0], options.vnPacingMode);
  };

  const handleRenameRival = (name: string) => {
    const next = setCustomRivalName(profileRef.current, name);
    profileRef.current = next;
    setProfile(next);
    const clean = getRivalName(next);
    setResolvedConfig((prev) =>
      prev ? applyRivalNameToBattleConfig(prev, clean) : prev
    );
  };

  const handleSaveToSlot = (slotIndex: number, customRunName?: string) => {
    const nextRunName =
      customRunName?.trim() ||
      profileRef.current.runName ||
      `Run #${slotIndex}`;
    const updated: PlayerSaveProfile = {
      ...profileRef.current,
      activeSaveSlot: slotIndex,
      runName: nextRunName,
      hasStartedRun: true,
      updatedAt: new Date().toISOString(),
    };
    profileRef.current = updated;
    setProfile(updated);
    setSaveSlots(saveProfileToSlot(updated, slotIndex));
  };

  const handleLoadFromSlot = (slotIndex: number) => {
    const rec = saveSlots[slotIndex];
    if (!rec) return;
    const loaded: PlayerSaveProfile = {
      ...rec.profile,
      activeSaveSlot: slotIndex,
      hasStartedRun: true,
    };
    profileRef.current = loaded;
    setProfile(loaded);
    setSaveLoadModalOpen(false);
    setScreen('chapters');
  };

  const handleDeleteSaveSlot = (slotIndex: number) => {
    setSaveSlots(deleteSaveSlot(slotIndex));
  };

  const handleStartRomanceRank = (
    npcId: string,
    targetRank: 1 | 2 | 3
  ) => {
    const ch = buildRomanceChapterDefinition(npcId, targetRank);
    startChapter(ch);
  };

  const handleFinishVN = (flags: StoryFlags) => {
    setSuspendedInkState(null);
    const rivalName = getRivalName(profileRef.current);
    const rawConfig = personalizedActiveChapter.resolveBattleConfig(flags);
    const npcDef = getNpcDefinition(rawConfig.rivalCharId);
    const config = applyRivalNameToBattleConfig(
      {
        ...rawConfig,
        rivalProfile: buildRivalProfileFromNpc(
          rawConfig.rivalCharId,
          rawConfig.rivalProfile ?? personalizedActiveChapter.rivalProfile
        ),
        npcPersonality: rawConfig.npcPersonality ?? npcDef.personality,
        npcDialogues: rawConfig.npcDialogues ?? npcDef.dialogues,
      },
      rivalName
    );
    setResolvedConfig(config);
    setScreen('teambuilder');
  };

  const handleTriggerMidStoryBattle = (req: MidStoryBattleRequest) => {
    const rivalName = getRivalName(profileRef.current);
    const resolver = personalizedActiveChapter.resolveStageBattleConfig;
    const rawConfig = resolver
      ? resolver(
          req.battleId,
          req.flags,
          req.persist ? persistedPartyState ?? undefined : undefined
        )
      : personalizedActiveChapter.resolveBattleConfig(req.flags);
    const npcDef = getNpcDefinition(rawConfig.rivalCharId);
    const config = applyRivalNameToBattleConfig(
      {
        ...rawConfig,
        rivalProfile: buildRivalProfileFromNpc(
          rawConfig.rivalCharId,
          rawConfig.rivalProfile ?? personalizedActiveChapter.rivalProfile
        ),
        npcPersonality: rawConfig.npcPersonality ?? npcDef.personality,
        npcDialogues: rawConfig.npcDialogues ?? npcDef.dialogues,
      },
      rivalName
    );
    if (!req.persist) {
      recordChapterAttempt(personalizedActiveChapter.id);
    }
    setSuspendedInkState(req.persist ? null : req.inkStateJson);
    setResolvedConfig(config);
    setScreen('battle');
  };

  const isCampaignSurvivalBattle = (
    chapter: ChapterDefinition,
    cfg?: ResolvedBattleConfig | null
  ): boolean => {
    if (cfg?.isVersusMatch) return false;
    const mode =
      chapter.teamMode ??
      (chapter.teamEditPolicy === 'editable' ? 'campaign' : 'locked');
    return mode === 'campaign';
  };

  const handleLaunchBattle = (finalConfig: ResolvedBattleConfig) => {
    const npcDef = getNpcDefinition(finalConfig.rivalCharId);
    const curProf = profileRef.current;
    const appliesSurvival = isCampaignSurvivalBattle(activeChapter, finalConfig);
    const ironmanPersisted =
      appliesSurvival &&
      curProf.ironmanMode &&
      !finalConfig.persistedPartyState
        ? buildIronmanPersistedStateForBattle(
            curProf,
            finalConfig.playerShowdownPaste
          )
        : finalConfig.persistedPartyState;

    const hydrated = applyRivalNameToBattleConfig(
      {
        ...finalConfig,
        persistedPartyState: ironmanPersisted,
        isIronmanActive: appliesSurvival && curProf.ironmanMode,
        isNuzlockeActive: appliesSurvival && curProf.nuzlockePermadeath,
        rivalProfile: finalConfig.isVersusMatch
          ? finalConfig.rivalProfile
          : buildRivalProfileFromNpc(
              finalConfig.rivalCharId,
              finalConfig.rivalProfile ?? personalizedActiveChapter.rivalProfile
            ),
        npcPersonality: finalConfig.isVersusMatch
          ? finalConfig.npcPersonality
          : finalConfig.npcPersonality ?? npcDef.personality,
        npcDialogues: finalConfig.isVersusMatch
          ? finalConfig.npcDialogues
          : finalConfig.npcDialogues ?? npcDef.dialogues,
      },
      getRivalName(curProf)
    );
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
    let deathSummary: RunDeathSummary | null = null;
    setSuspendedInkState(null);

    if (!resolvedConfig?.isVersusMatch) {
      const appliesSurvival = isCampaignSurvivalBattle(
        activeChapter,
        resolvedConfig
      );
      const fallenInBattle =
        won && appliesSurvival
          ? snapshot.p1.party
              .filter((p) => p.fainted)
              .map((p) => ({ species: p.species, ability: p.ability }))
          : [];
      const res = applyBattleOutcomeToProfile(
        profileRef.current,
        activeChapter.id,
        won,
        snapshot.turn,
        resolvedConfig?.flags,
        {
          difficulty:
            resolvedConfig?.difficultyMode ??
            profileRef.current.defaultDifficulty,
          fallenInBattle,
        }
      );
      earnedReward = res.reward;
      let nextProf = appliesSurvival
        ? recordPostBattleSurvivalState(
            res.nextProfile,
            snapshot.exportedPartyState,
            won,
            {
              chapterId: activeChapter.id,
              chapterTitle: activeChapter.title,
              rivalName: resolvedConfig?.rivalName,
              turn: snapshot.turn,
              difficulty:
                resolvedConfig?.difficultyMode ??
                profileRef.current.defaultDifficulty,
              faintLog: snapshot.faintLog,
            }
          )
        : res.nextProfile;
      if (won && resolvedConfig?.romanceMeta) {
        nextProf = completeRomanceRank(
          nextProf,
          resolvedConfig.romanceMeta.npcId,
          resolvedConfig.romanceMeta.targetRank
        );
      }
      nextProf = { ...nextProf, hasStartedRun: true };
      profileRef.current = nextProf;
      setProfile(nextProf);

      if (!won) {
        const isTotalNuzlockeWipe =
          appliesSurvival &&
          nextProf.nuzlockePermadeath &&
          countAliveBoxPokemon(nextProf) === 0;
        deathSummary = buildRunDeathSummary({
          runName: nextProf.runName || 'Exilio de Wyndon',
          chapterId: activeChapter.id,
          chapterLabel: `${activeChapter.number} · ${activeChapter.title}`,
          turn: snapshot.turn,
          difficulty:
            resolvedConfig?.difficultyMode ?? nextProf.defaultDifficulty,
          ironmanMode: nextProf.ironmanMode,
          nuzlockePermadeath: nextProf.nuzlockePermadeath,
          isTotalNuzlockeWipe,
          rivalName: resolvedConfig?.rivalName || activeChapter.rivalProfile.name,
          fatalBlow: snapshot.lastFatalBlow ?? null,
          fallbackKillerSpecies:
            snapshot.p2.party.find((m) => !m.fainted)?.species ??
            snapshot.p2.party[0]?.species,
          fallbackVictimSpecies:
            snapshot.p1.party.slice().reverse().find((m) => m.fainted)
              ?.species ?? snapshot.p1.party[0]?.species,
        });
        setRunHistory(appendRunHistoryEntry(deathSummary));
        setSaveSlots(
          saveProfileToSlot(nextProf, nextProf.activeSaveSlot ?? 1, {
            isRunDead: isTotalNuzlockeWipe,
            lastDeath: deathSummary,
          })
        );
      }
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

    setBattleOutcome({ won, snapshot, reward: earnedReward, deathSummary });
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

  const handleBuyShinyCharm = () => {
    const res = purchaseShinyCharm(profileRef.current);
    if (res.ok) setProfile(res.nextProfile);
    return res;
  };

  const handleSpawnDevSpecimen = (
    species: string,
    targetZone: 'party' | 'box'
  ) => {
    const res = spawnDevAgSpecimen(profileRef.current, species, targetZone);
    if (res.ok) setProfile(res.nextProfile);
    return res;
  };

  const handleImportShowdownPaste = (rawPaste: string) => {
    const res = importShowdownPasteToParty(profileRef.current, rawPaste);
    if (res.ok) setProfile(res.nextProfile);
    return res;
  };

  const handleMoveInstanceZone = (
    uid: string,
    targetZone: Exclude<PokemonStorageZone, 'graveyard'>
  ) => {
    const res = movePokemonInstanceZone(profileRef.current, uid, targetZone);
    if (res.ok) setProfile(res.nextProfile);
    return res;
  };

  const handleReleaseInstance = (uid: string) => {
    const res = releasePokemonInstance(profileRef.current, uid);
    if (res.ok) setProfile(res.nextProfile);
    return res;
  };

  const handleEquipInstanceItem = (uid: string, itemName: string) => {
    const res = equipItemOnInstance(profileRef.current, uid, itemName);
    if (res.ok) setProfile(res.nextProfile);
    return res;
  };

  const handleUpdateInstanceBuild = (
    uid: string,
    patch: Partial<
      Pick<
        OwnedPokemonInstance,
        | 'ability'
        | 'nature'
        | 'teraType'
        | 'moves'
        | 'shiny'
        | 'nickname'
        | 'gender'
        | 'evs'
        | 'ivs'
      >
    >
  ) => {
    const res = updatePokemonInstanceBuild(profileRef.current, uid, patch);
    if (res.ok) setProfile(res.nextProfile);
    return res;
  };

  const handlePopulateLivingDexBox = () => {
    const res = applyDevPopulateAllSpeciesToBox(profileRef.current);
    setProfile(res.nextProfile);
    return { addedCount: res.addedCount, totalLiving: res.totalLiving };
  };

  const handleSaveCampaignTeam = (name: string) => {
    const res = saveCurrentPartyAsTeam(profileRef.current, name);
    if (res.ok) setProfile(res.nextProfile);
    return res;
  };

  const handleLoadCampaignTeam = (
    teamId: string,
    allowSpawnMissing?: boolean
  ) => {
    const res = loadSavedCampaignTeam(profileRef.current, teamId, {
      allowSpawnMissing,
    });
    if (res.ok) setProfile(res.nextProfile);
    return res;
  };

  const handleDeleteCampaignTeam = (teamId: string) => {
    setProfile((prev) => deleteSavedCampaignTeam(prev, teamId));
  };

  const handleToggleRunModifiers = (patch: {
    ironmanMode?: boolean;
    nuzlockePermadeath?: boolean;
    defaultDifficulty?: BattleDifficultyMode;
    vnPacingMode?: VnPacingMode;
  }) => {
    setProfile((prev) => toggleRunModifiers(prev, patch));
  };

  const handleCampHeal = (
    species: string,
    action: 'potion' | 'full_heal' | 'emergency_free' | 'lum' | 'sitrus' | 'leppa'
  ) => {
    const res = campHealPartyMember(profileRef.current, species, action);
    if (res.ok) setProfile(res.nextProfile);
    return res;
  };

  const handlePlantBerry = (plotIndex: number, berry: BerryKind) => {
    const res = plantCampBerry(profileRef.current, plotIndex, berry);
    if (res.ok) setProfile(res.nextProfile);
    return res;
  };

  const handleHarvestBerry = (plotIndex: number) => {
    const res = harvestCampBerry(profileRef.current, plotIndex);
    if (res.ok) setProfile(res.nextProfile);
    return res;
  };

  const handleRecruitHousePokemon = (
    mon: CustomTeamMember,
    slotIndex: number
  ) => {
    setProfile((prev) => recruitHousePokemonToCustomSlot(prev, mon, slotIndex));
  };

  const handleResetSurvivalState = () => {
    setProfile((prev) => clearNuzlockeFallenAndIronman(prev));
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

  const handleDevUnlockFullAgPokedex = () => {
    setProfile((prev) => applyDevUnlockFullAgPokedex(prev));
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
        onContinueGame={handleContinueGame}
        onStartNewRun={handleStartNewRun}
        onLoadSaveSlot={handleLoadFromSlot}
        onDeleteSaveSlot={handleDeleteSaveSlot}
        onOpenSaveLoadModal={() => setSaveLoadModalOpen(true)}
        onOpenChapters={() => setScreen('chapters')}
        onOpenVersus={() => setScreen('versus')}
        onOpenShop={() => setScreen('shop')}
        onOpenTeamEditor={() => setScreen('team-editor')}
        onOpenArcade={() => setScreen('arcade')}
        onOpenAccount={() => setAccountModalOpen(true)}
        onOpenAISettings={() => setAiModalOpen(true)}
        onOpenDevMode={() => setDevModalOpen(true)}
        onOpenCamp={() => setCampModalOpen(true)}
        profile={profile}
        saveSlots={saveSlots}
        runHistory={runHistory}
        firebaseUser={firebaseUser}
        cloudSyncStatus={cloudSyncStatus}
        aiSettings={aiSettings}
      />
    );
  } else if (screen === 'chapters') {
    view = (
      <ChapterSelect
        onBackHome={() => setScreen('home')}
        onOpenSaveLoadModal={() => setSaveLoadModalOpen(true)}
        onOpenVersus={() => setScreen('versus')}
        onOpenShop={() => setScreen('shop')}
        onOpenTeamEditor={() => setScreen('team-editor')}
        onOpenArcade={() => setScreen('arcade')}
        onOpenAccount={() => setAccountModalOpen(true)}
        onOpenDevMode={() => setDevModalOpen(true)}
        onOpenCamp={() => setCampModalOpen(true)}
        onSelectChapter={(ch) => startChapter(ch)}
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
        onBuyShinyCharm={handleBuyShinyCharm}
      />
    );
  } else if (screen === 'team-editor') {
    view = (
      <TeamEditorView
        profile={profile}
        onBackHome={() => setScreen('home')}
        onOpenShop={() => setScreen('shop')}
        onMoveInstanceZone={handleMoveInstanceZone}
        onReleaseInstance={handleReleaseInstance}
        onEquipInstanceItem={handleEquipInstanceItem}
        onUpdateInstanceBuild={handleUpdateInstanceBuild}
        onUnlockMoveSlot={handleUnlockMoveSlot}
        onSpawnDevSpecimen={handleSpawnDevSpecimen}
        onPopulateLivingDexBox={handlePopulateLivingDexBox}
        onImportShowdownPaste={handleImportShowdownPaste}
        onSaveCampaignTeam={handleSaveCampaignTeam}
        onLoadCampaignTeam={handleLoadCampaignTeam}
        onDeleteCampaignTeam={handleDeleteCampaignTeam}
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
        chapter={personalizedActiveChapter}
        resumeInkStateJson={suspendedInkState}
        persistedPartyState={persistedPartyState}
        vnPacingMode={profile.vnPacingMode}
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
        teamEditPolicy={personalizedActiveChapter.teamEditPolicy}
        teamMode={personalizedActiveChapter.teamMode}
        onReplayVN={() => setScreen('vn')}
        onOpenShop={() => setScreen('shop')}
        onOpenDevMode={() => setDevModalOpen(true)}
        onOpenCamp={() => setCampModalOpen(true)}
        onToggleUseCustomTeam={(enabled) =>
          setProfile((prev) => ({
            ...prev,
            useCustomTeamInStory: enabled,
            updatedAt: new Date().toISOString(),
          }))
        }
        onUnlockMoveSlot={handleUnlockMoveSlot}
        onSetCustomMove={handleSetCustomMove}
        onSetCustomItem={handleSetCustomItem}
        onResetSpecies={handleResetSpecies}
        onMoveInstanceZone={handleMoveInstanceZone}
        onReleaseInstance={handleReleaseInstance}
        onEquipInstanceItem={handleEquipInstanceItem}
        onUpdateInstanceBuild={handleUpdateInstanceBuild}
        onSpawnDevSpecimen={handleSpawnDevSpecimen}
        onPopulateLivingDexBox={handlePopulateLivingDexBox}
        onImportShowdownPaste={handleImportShowdownPaste}
        onSaveCampaignTeam={handleSaveCampaignTeam}
        onLoadCampaignTeam={handleLoadCampaignTeam}
        onDeleteCampaignTeam={handleDeleteCampaignTeam}
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
        chapter={personalizedActiveChapter}
        config={resolvedConfig}
        profile={profile}
        won={battleOutcome.won}
        battleSummary={battleOutcome.snapshot}
        reward={battleOutcome.reward}
        deathSummary={battleOutcome.deathSummary}
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
            : startChapter(activeChapter, 'full')
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
      <SaveLoadModal
        open={saveLoadModalOpen}
        onClose={() => setSaveLoadModalOpen(false)}
        profile={profile}
        saveSlots={saveSlots}
        onSaveToSlot={handleSaveToSlot}
        onLoadFromSlot={handleLoadFromSlot}
        onDeleteSlot={handleDeleteSaveSlot}
      />
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
        onUnlockFullAgPokedex={handleDevUnlockFullAgPokedex}
        onPopulateLivingDexBox={handlePopulateLivingDexBox}
        onAddMillionCoins={handleDevAddMillionCoins}
        onToggleDevMode={handleDevToggle}
        onResetStoryProgress={handleResetStory}
      />
      <SocialLinksCampModal
        open={campModalOpen}
        onClose={() => setCampModalOpen(false)}
        profile={profile}
        onStartRomanceRank={handleStartRomanceRank}
        onToggleRunModifiers={handleToggleRunModifiers}
        onCampHeal={handleCampHeal}
        onPlantBerry={handlePlantBerry}
        onHarvestBerry={handleHarvestBerry}
        onRecruitHousePokemon={handleRecruitHousePokemon}
        onResetSurvivalState={handleResetSurvivalState}
        onRenameRival={handleRenameRival}
      />
    </>
  );
}
