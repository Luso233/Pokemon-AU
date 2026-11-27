import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { Dex, Teams, TeamValidator } from '@pkmn/sim';
import type { ChapterDefinition } from '../src/types/game';
import { InkVNRunner } from '../src/engine/inkRunner';
import {
  resolveAnimeAshVsTobiasBattle,
  resolveChampionLittleCupBattle,
  resolveChapter1ChaseBattle,
  resolveChapter2BanquetBattle,
  resolveChapter2MonotypeBattle,
  resolveClandestineTamerBattle,
  resolveDuel1Honor1v1Battle,
  resolveGen1SilphArchiveBattle,
  resolveLastBastionBattle,
  resolveMinesWave1Battle,
  resolveMinesWave2Battle,
  resolvePuzzle1SunTrapBattle,
  resolvePuzzle2RegigigasBattle,
  resolveThreeKnightsBattle,
  resolveTriplesPhalanxBattle,
  resolveVgcWorlds2024Battle,
  resolveWeatherTerrainsChallengeBattle,
} from '../src/engine/teamBuilderTree';
import {
  computeSpeedRange,
  isFoeTargetReachable,
  ShowdownBattleController,
} from '../src/engine/battleEngine';
import { getDefaultAISettings } from '../src/engine/aiProvider';
import {
  generateValidatedTeam,
  getVersusFormatSpec,
  sanitizeRawMembersToSets,
  validatePasteForFormat,
  VERSUS_FORMATS,
} from '../src/engine/aiTeambuilder';
import { askLiveCoach, generatePostGameReview } from '../src/engine/battleCoach';
import {
  addDevCoins,
  applyBattleOutcomeToProfile,
  applyChapterProgressionToPaste,
  applyDevPopulateAllSpeciesToBox,
  applyDevUnlockEverything,
  applyDevUnlockFullAgPokedex,
  awardArcadeCoins,
  buildIronmanPersistedStateForBattle,
  campHealPartyMember,
  compileCustomTeamToShowdownPaste,
  completeRomanceRank,
  createDefaultProfile,
  createNewConfiguredRunProfile,
  deleteSavedCampaignTeam,
  equipItemOnInstance,
  harvestCampBerry,
  importShowdownPasteToParty,
  isChapterUnlocked,
  isMoveSlotUnlocked,
  loadSavedCampaignTeam,
  movePokemonInstanceZone,
  normalizeProfile,
  plantCampBerry,
  purchaseHeldItem,
  purchasePokemon,
  purchaseShinyCharm,
  purchaseTM,
  purifyShadowPokemonInstance,
  recordPostBattleSurvivalState,
  recordRomanceConfession,
  releasePokemonInstance,
  resetStoryProgress,
  saveCurrentPartyAsTeam,
  setCustomItemForSpecies,
  setCustomMoveForSpecies,
  setCustomRivalName,
  spawnDevAgSpecimen,
  spawnDevShadowSpecimen,
  toggleRunModifiers,
  unlockChapterWithCoins,
  unlockMoveSlotForSpecies,
  updateCustomTeamSlot,
  updatePokemonInstanceBuild,
} from '../src/engine/playerProfile';
import { getLegalLearnsetForSpecies } from '../src/engine/learnsetService';
import {
  CHAPTER_UNLOCK_RULES,
  DIFFICULTY_META,
  DIFFICULTY_ORDER,
} from '../src/data/economyCatalog';
import {
  buildDefeatTweetText,
  buildRunDeathSummary,
  buildTwitterShareUrl,
} from '../src/engine/saveSlots';
import {
  computeCasualtyIndemnification,
  computePokemonBst,
  computePokemonShopPricing,
  getAllAnythingGoesPlayableSpecies,
  getImperialBstLicense,
  REGIONAL_FAUNA_POOLS,
} from '../src/engine/pricingEngine';
import { DARK_ATLAS_LANDMARKS } from '../src/data/darkAtlas';
import {
  computeActiveSocialLinkPerks,
  ROMANCE_ROSTER,
} from '../src/data/socialLinksCatalog';
import {
  resolveRomanceEncounterDuel,
  resolveRomanceRematchBattle,
  resolveRomanceTagBattle,
} from '../src/engine/romanceBattles';
import {
  resolveAeosDittoBlackSiteBattle,
  resolveBastardBrotherClimaxBattle,
  resolveOrreShadowAmbushBattle,
  resolvePoketopiaTraitorCouncilBattle,
  resolvePostgameChampionBattle,
  resolveTamraCruViceroyBattle,
  resolveTohjoShentaiTrialBattle,
  resolveXd001ShadowLugiaBattle,
} from '../src/engine/campaignEscalationBattles';
import {
  detectShadowSpeciesInPaste,
  ensureShadowDexRegistered,
  isInstanceHighBond,
  SHADOW_MOVES_CATALOG,
} from '../src/engine/shadowEngine';
import {
  isBabyShamed,
  isChapterVisible,
  isRomanceNpcVisible,
  resolveEnding,
} from '../src/engine/campaignProgression';
import {
  applyBabyOrDevNatDexFallback,
  evaluateBabyModeComedyStamp,
} from '../src/engine/formatFallback';
import {
  applyRivalNameToBattleConfig,
  applyRivalNameToChapter,
  DEFAULT_RIVAL_NAME,
  getRivalName,
  RIVAL_NAME_PRESETS,
} from '../src/engine/rivalName';
import { REGIONAL_ROMANCE_BLUEPRINTS } from '../src/data/regionalRomanceBlueprints';
import {
  BLOC_BY_ID,
  CHAPTER_MAP_LOCATIONS,
  WORLD_BLOCS,
  WORLD_HISTORY_ACTS,
} from '../src/data/worldGeopolitics';
import {
  applyNpcRunModifiers,
  getNpcDefinition,
  getVariantsForChapterNpc,
} from '../src/data/npcProfiles';
import {
  calculatePokemonStats,
  compareByShowdownSort,
  getIndexedSpeciesMeta,
  matchesShowdownFilters,
  queryShowdownSuggestions,
} from '../src/engine/showdownSearchIndex';
import { createRivalBattleController } from '../src/engine/tacticalAI';
import {
  CAMPAIGN_DOUBLES_FORMAT_ID,
  CAMPAIGN_SINGLES_FORMAT_ID,
  type BattleSnapshot,
} from '../src/types/game';

interface MatchRunResult {
  finalSnap: BattleSnapshot;
  turn1Snap: BattleSnapshot | null;
  turn2Snap: BattleSnapshot | null;
  previewSnap: BattleSnapshot | null;
}

async function runFullSimMatch(
  label: string,
  config: ReturnType<typeof resolveChapter1ChaseBattle>,
  options: {
    maxTurns?: number;
    testTeraTurn1?: boolean;
    customTurn1Cmd?: string;
    teamPreviewPick?: number[];
  } = {}
): Promise<MatchRunResult> {
  const maxTurns = options.maxTurns ?? 60;
  return new Promise((resolvePromise, rejectPromise) => {
    let settled = false;
    let lastSentTurn = -1;
    let lastForceSwitchSig = '';
    let sentPreview = false;
    let turn1Snap: BattleSnapshot | null = null;
    let turn2Snap: BattleSnapshot | null = null;
    let previewSnap: BattleSnapshot | null = null;
    let teraUsed = false;

    const controller = new ShowdownBattleController(config, (snap) => {
      if (settled) return;

      if (snap.status === 'ended') {
        settled = true;
        controller.destroy();
        resolvePromise({ finalSnap: snap, turn1Snap, turn2Snap, previewSnap });
        return;
      }

      if (snap.status === 'team-preview' && snap.teamPreview && !sentPreview) {
        sentPreview = true;
        previewSnap = snap;
        const defaultPick =
          options.teamPreviewPick ??
          (snap.teamPreview.mode === 'pick-4' ? [1, 2, 3, 4] : [1]);
        void controller.submitTeamOrder(defaultPick);
        return;
      }

      if (snap.turn > maxTurns) {
        settled = true;
        controller.destroy();
        rejectPromise(new Error(`[${label}] Exceeded ${maxTurns} turns`));
        return;
      }

      if (snap.status === 'awaiting-choice' && snap.pendingSlots.length > 0) {
        if (
          snap.turn === 1 &&
          (!turn1Snap ||
            (!turn1Snap.puzzleApplied && snap.puzzleApplied) ||
            (!turn1Snap.persistenceApplied && snap.persistenceApplied))
        ) {
          turn1Snap = snap;
        }
        if (snap.turn === 2 && !turn2Snap) {
          turn2Snap = snap;
        }

        if (snap.isForceSwitch) {
          const sig = `${snap.turn}-fs-${snap.p1.party.map((p) => p.fainted).join(',')}`;
          if (sig === lastForceSwitchSig) return;
          lastForceSwitchSig = sig;

          const used = new Set<number>();
          const cmds = snap.pendingSlots.map((slot) => {
            if (!slot.forceSwitch || slot.pass) return 'pass';
            const nextMon = snap.p1.party.find(
              (p) => !p.active && !p.fainted && !used.has(p.slotIndex)
            );
            if (!nextMon) return 'pass';
            used.add(nextMon.slotIndex);
            return `switch ${nextMon.slotIndex}`;
          });
          void controller.submitPlayerChoice(cmds.join(', '));
          return;
        }

        if (config.puzzleConditions && !snap.puzzleApplied) {
          return;
        }
        if (config.persistedPartyState && !snap.persistenceApplied) {
          return;
        }
        if (
          config.emptyPlayerSlots &&
          config.emptyPlayerSlots.length > 0 &&
          snap.turn === 1 &&
          config.emptyPlayerSlots.some((idx) => !snap.p1.party[idx]?.fainted)
        ) {
          return;
        }

        if (snap.turn === lastSentTurn) return;
        lastSentTurn = snap.turn;

        if (snap.turn === 1 && options.customTurn1Cmd) {
          void controller.submitPlayerChoice(options.customTurn1Cmd);
          return;
        }

        let megaUsed = false;
        const cmds = snap.pendingSlots.map((slot, i) => {
          if (slot.pass) return 'pass';
          const legalMoves = slot.moves.filter((m) => !m.disabled);
          if (legalMoves.length === 0) return 'move 1';

          const wantMega = Boolean(slot.canMegaEvo) && !megaUsed;
          const megaSuffix = wantMega ? ' mega' : '';
          let teraSuffix = '';
          if (
            options.testTeraTurn1 &&
            !teraUsed &&
            i === 0 &&
            slot.canTerastallize
          ) {
            teraUsed = true;
            teraSuffix = ' terastallize';
          }
          const modSuffix = `${teraSuffix}${megaSuffix}`;

          if (config.format === 'doubles' || config.format === 'triples') {
            for (const cand of [
              ...legalMoves.filter((m) => m.category !== 'Status'),
              ...legalMoves.filter((m) => m.category === 'Status'),
            ]) {
              const needsFoe =
                cand.target === 'normal' ||
                cand.target === 'any' ||
                cand.target === 'adjacentFoe';
              const needsAlly = cand.target === 'adjacentAlly';
              if (needsAlly) continue;
              if (needsFoe) {
                const targetIdx = snap.p2.active.findIndex(
                  (m, fi) =>
                    m &&
                    !m.fainted &&
                    isFoeTargetReachable(
                      config.format,
                      slot.activeIndex,
                      fi,
                      cand.target
                    )
                );
                if (targetIdx === -1) continue;
                if (wantMega) megaUsed = true;
                return `move ${cand.index} +${targetIdx + 1}${modSuffix}`;
              }
              if (wantMega) megaUsed = true;
              return `move ${cand.index}${modSuffix}`;
            }
            if (config.format === 'triples' && slot.activeIndex !== 1) {
              return 'shift';
            }
          }

          const pick =
            legalMoves.find((m) => m.category !== 'Status') ?? legalMoves[0];
          if (wantMega) megaUsed = true;
          return `move ${pick.index}${modSuffix}`;
        });
        void controller.submitPlayerChoice(cmds.join(', '));
      }
    });

    controller.start().catch((err) => {
      if (!settled) {
        settled = true;
        rejectPromise(err);
      }
    });
  });
}

function assertValidTeam(formatId: string, label: string, paste: string) {
  const val = new TeamValidator(formatId);
  const problems = val.validateTeam(Teams.import(paste)!);
  if (problems && problems.length > 0) {
    throw new Error(`[${formatId}] ${label} failed TeamValidator:\n  - ${problems.join('\n  - ')}`);
  }
}

async function main() {
  console.log('=== 1. Chapter 01: Wyndon Chase 6v6 Doubles + Fog of War + Tera ===');
  const chaseInk = readFileSync(resolve('src/stories/chapter1_chase.ink'), 'utf8');
  const runner = new InkVNRunner(chaseInk);
  let frame = runner.step();
  while (!frame.isEnded) {
    if (frame.canContinue) frame = runner.step();
    else if (frame.choices.length > 0) frame = runner.choose(frame.choices.length - 1);
  }
  const hardcoreConfig = resolveChapter1ChaseBattle(frame.flags);
  const { finalSnap: resHard, turn1Snap: hardT1 } = await runFullSimMatch(
    'Wyndon Chase 6v6',
    hardcoreConfig,
    { maxTurns: 80, testTeraTurn1: true }
  );
  if (!hardT1 || hardT1.p2.party.length !== 2) {
    throw new Error('Fog of War check failed in Chapter 1!');
  }
  console.log(
    `  OK: turns=${resHard.turn}, scripted=[${resHard.triggeredScriptIds.join(', ')}]`
  );

  console.log('\n=== 2. Puzzle 01: La Trampa del Sol (PuzzleConditions + T1/T2 Scripted AI) ===');
  const puzzleConfig = resolvePuzzle1SunTrapBattle({ puzzle_hint: 'show' });
  const { finalSnap: resPz, turn1Snap: pzT1, turn2Snap: pzT2 } =
    await runFullSimMatch('Puzzle 01 Sun Trap', puzzleConfig, {
      maxTurns: 40,
      customTurn1Cmd: 'move 1 +1, move 1 +2',
    });
  if (!pzT1?.puzzleApplied || pzT1.weather !== 'Sol Intenso' || pzT1.weatherTurnsLeft !== 5) {
    throw new Error(`Puzzle weather/timer mismatch: ${pzT1?.weather} (${pzT1?.weatherTurnsLeft}t)`);
  }
  if (pzT1.p1.active[1]?.hpPercent !== 65 || (pzT2?.p2.active[0]?.boosts.atk ?? 0) > -2) {
    throw new Error('Puzzle Sableye HP or Metagross Topsy-Turvy inversion mismatch!');
  }
  console.log(
    `  OK: Weather=${pzT1.weather} (${pzT1.weatherTurnsLeft}t), Sableye=65%, Metagross +2->-2, scripted=[${resPz.triggeredScriptIds.join(', ')}]`
  );

  console.log('\n=== 3. Flashback LC: La Prueba de la Campeona (Nv. 5 vs Nv. 6-7) ===');
  const lcConfig = resolveChampionLittleCupBattle({ lc_lead: 'larvitar' });
  const { finalSnap: resLC } = await runFullSimMatch('Champion Little Cup', lcConfig, {
    maxTurns: 80,
  });
  if (!resLC.triggeredScriptIds.includes('lc-t1-onix-sr')) {
    throw new Error('Expected Champion Turn 1 Onix Stealth Rock scripted rule!');
  }
  console.log(`  OK: turns=${resLC.turn}, scripted=[${resLC.triggeredScriptIds.join(', ')}]`);

  console.log('\n=== 4. DUELO 01: Duelo de Honor (gen91v1 · Bring 3, Pick 1) ===');
  const duelInk = readFileSync(resolve('src/stories/duel1_honor1v1.ink'), 'utf8');
  const dRunner = new InkVNRunner(duelInk);
  let dFrame = dRunner.step();
  while (!dFrame.isEnded) {
    if (dFrame.canContinue) dFrame = dRunner.step();
    else if (dFrame.choices.length > 0) dFrame = dRunner.choose(0); // ironcrown clue
  }
  const duelConfig = resolveDuel1Honor1v1Battle(dFrame.flags);
  assertValidTeam('gen91v1', '1v1 Prince', duelConfig.playerShowdownPaste);
  assertValidTeam('gen91v1', '1v1 Rival', duelConfig.rivalShowdownPaste);
  const { finalSnap: res1v1, previewSnap: pv1v1, turn1Snap: t1_1v1 } =
    await runFullSimMatch('Duelo 1v1', duelConfig, {
      maxTurns: 30,
      teamPreviewPick: [3], // Metagross vs Iron Crown!
    });
  if (pv1v1?.teamPreview?.mode !== 'pick-1' || pv1v1.teamPreview.pickCount !== 1) {
    throw new Error('Expected gen91v1 interactive teamPreview mode=pick-1!');
  }
  if (t1_1v1?.p1.active[0]?.species !== 'Metagross' || t1_1v1?.p2.active[0]?.species !== 'Iron Crown') {
    throw new Error(
      `Expected Metagross vs Iron Crown in 1v1, got ${t1_1v1?.p1.active[0]?.species} vs ${t1_1v1?.p2.active[0]?.species}`
    );
  }
  console.log(
    `  OK: TeamValidator clean, Team Preview Pick 1 (Metagross vs Iron Crown), winner=${res1v1.winner}, turns=${res1v1.turn}`
  );

  console.log('\n=== 5. CAPÍTULO 02: Choque de Estandartes (gen9monotype · Steel vs Dark) ===');
  const monoInk = readFileSync(resolve('src/stories/chapter2_monotype.ink'), 'utf8');
  const mRunner = new InkVNRunner(monoInk);
  let mFrame = mRunner.step();
  while (!mFrame.isEnded) {
    if (mFrame.canContinue) mFrame = mRunner.step();
    else if (mFrame.choices.length > 0) mFrame = mRunner.choose(0);
  }
  const monoConfig = resolveChapter2MonotypeBattle(mFrame.flags);
  assertValidTeam('gen9monotype', 'Monotype Steel', monoConfig.playerShowdownPaste);
  assertValidTeam('gen9monotype', 'Monotype Dark', monoConfig.rivalShowdownPaste);
  const { finalSnap: resMono, previewSnap: pvMono, turn1Snap: t1Mono } =
    await runFullSimMatch('Monotype Steel vs Dark', monoConfig, {
      maxTurns: 100,
      teamPreviewPick: [2], // Lead Heatran
    });
  if (pvMono?.teamPreview?.mode !== 'lead-1') {
    throw new Error('Expected gen9monotype interactive teamPreview mode=lead-1!');
  }
  if (t1Mono?.p1.active[0]?.species !== 'Heatran') {
    throw new Error(`Expected chosen Monotype lead Heatran, got ${t1Mono?.p1.active[0]?.species}`);
  }
  console.log(
    `  OK: TeamValidator clean (Steel vs Dark), Lead Heatran verified, turns=${resMono.turn}`
  );

  console.log('\n=== 6. ARCHIVO VGC: Final Mundial 2024 Luca vs Yuta (Both Sides + Double-KO ForceSwitch + Defeat) ===');
  const vgcInk = readFileSync(resolve('src/stories/archive_vgc2024.ink'), 'utf8');

  // 6a. Play as Luca Ceribelli (choice 0 -> Luca, choice 0 -> Game 1 Yuta)
  const vRunnerLuca = new InkVNRunner(vgcInk);
  let vFrame = vRunnerLuca.step();
  while (!vFrame.isEnded) {
    if (vFrame.canContinue) vFrame = vRunnerLuca.step();
    else if (vFrame.choices.length > 0) vFrame = vRunnerLuca.choose(0);
  }
  const vgcConfig = resolveVgcWorlds2024Battle(vFrame.flags);
  assertValidTeam('gen9vgc2024regg', 'VGC Luca Ceribelli', vgcConfig.playerShowdownPaste);
  assertValidTeam('gen9vgc2024regg', 'VGC Yuta Ishigaki', vgcConfig.rivalShowdownPaste);
  const { finalSnap: resVgc, previewSnap: pvVgc, turn1Snap: t1Vgc } =
    await runFullSimMatch('VGC Worlds 2024 as Luca', vgcConfig, {
      maxTurns: 60,
      teamPreviewPick: [1, 2, 3, 4],
      testTeraTurn1: true,
    });
  if (pvVgc?.teamPreview?.mode !== 'pick-4' || pvVgc.openTeamsheet.rival.length !== 6) {
    throw new Error('Expected VGC pick-4 Team Preview + 6-mon Open Teamsheet!');
  }
  const yutaLeads = t1Vgc?.p2.active.map((m) => m?.species).join(' + ');
  if (yutaLeads !== 'Iron Valiant + Landorus') {
    throw new Error(`Expected Yuta Worlds lead Iron Valiant + Landorus, got ${yutaLeads}`);
  }
  if (t1Vgc?.terrain !== 'Campo Eléctrico' || t1Vgc?.terrainTurnsLeft !== 5) {
    throw new Error(`Expected Miraidon Hadron Engine Electric Terrain (5t), got ${t1Vgc?.terrain} (${t1Vgc?.terrainTurnsLeft}t)`);
  }
  console.log(
    `  OK (as Luca): TeamValidator clean, Yuta Lead=[${yutaLeads}], Scripted=[${resVgc.triggeredScriptIds.join(', ')}], turns=${resVgc.turn}`
  );

  // 6b. Play as Yuta Ishigaki (choice 1 -> Yuta, choice 0 -> Game 1 Luca)
  const vRunnerYuta = new InkVNRunner(vgcInk);
  let yFrame = vRunnerYuta.step();
  let yChoiceStep = 0;
  while (!yFrame.isEnded) {
    if (yFrame.canContinue) yFrame = vRunnerYuta.step();
    else if (yFrame.choices.length > 0) {
      yFrame = vRunnerYuta.choose(yChoiceStep === 0 ? 1 : 0);
      yChoiceStep++;
    }
  }
  const vgcYutaConfig = resolveVgcWorlds2024Battle(yFrame.flags);
  if (vgcYutaConfig.playerName !== 'Yuta Ishigaki' || vgcYutaConfig.rivalName !== 'Luca Ceribelli') {
    throw new Error(`Expected Yuta vs Luca swap, got ${vgcYutaConfig.playerName} vs ${vgcYutaConfig.rivalName}`);
  }
  assertValidTeam('gen9vgc2024regg', 'VGC Yuta as P1', vgcYutaConfig.playerShowdownPaste);
  assertValidTeam('gen9vgc2024regg', 'VGC Luca as P2', vgcYutaConfig.rivalShowdownPaste);
  const { finalSnap: resVgcYuta, turn1Snap: t1VgcYuta } =
    await runFullSimMatch('VGC Worlds 2024 as Yuta', vgcYutaConfig, {
      maxTurns: 60,
      teamPreviewPick: [5, 6, 3, 1], // Iron Valiant + Landorus lead, Pelipper + Calyrex-Ice back!
    });
  const lucaLeads = t1VgcYuta?.p2.active.map((m) => m?.species).join(' + ');
  if (lucaLeads !== 'Whimsicott + Miraidon') {
    throw new Error(`Expected Luca Worlds lead Whimsicott + Miraidon, got ${lucaLeads}`);
  }
  if (!resVgcYuta.triggeredScriptIds.includes('vgc-luca-t1-tailwind')) {
    throw new Error(`Expected Luca Turn 1 Tailwind scripted rule, got [${resVgcYuta.triggeredScriptIds.join(', ')}]`);
  }
  console.log(
    `  OK (as Yuta): TeamValidator clean, Luca Lead=[${lucaLeads}], Scripted=[${resVgcYuta.triggeredScriptIds.join(', ')}], turns=${resVgcYuta.turn}`
  );

  // 6c. Regression test: VGC Doubles simultaneous Double-KO forceSwitch with ONLY 1 bench mon left (`switch N, pass`) + Defeat recognition
  // Turn 1: Snom survives Glacial Lance on Focus Sash (1 HP), Sunkern faints -> Caterpie replaces Sunkern (1 bench mon left: Weedle)
  // Turn 2: Glacial Lance double-KOs Snom + Caterpie -> forceSwitch: [true, true] with ONLY 1 bench mon (Weedle) -> must send `switch 4, pass`!
  // Turn 3: Glacial Lance KOs Weedle -> status='ended', winner='p2'!
  const weakDefeatConfig = {
    ...vgcConfig,
    preferredRivalTeamOrder: 'team 1356',
    scriptedEnemyRules: [
      {
        id: 'test-calyrex-lance',
        actorSpecies: 'Calyrex-Ice',
        forceMoveId: 'glaciallance',
        description: 'Force Glacial Lance every turn for double-KO regression',
      },
      {
        id: 'test-pelipper-wg',
        actorSpecies: 'Pelipper',
        forceMoveId: 'wideguard',
        description: 'Pelipper uses Wide Guard so Snom survives T1 on Focus Sash',
      },
    ],
    playerShowdownPaste: [
      'Sunkern\nAbility: Chlorophyll\nLevel: 50\n- Splash',
      'Snom @ Focus Sash\nAbility: Shield Dust\nLevel: 50\n- Struggle Bug',
      'Caterpie\nAbility: Shield Dust\nLevel: 50\n- String Shot',
      'Weedle\nAbility: Shield Dust\nLevel: 50\n- String Shot',
      'Wurmple\nAbility: Shield Dust\nLevel: 50\n- String Shot',
      'Blipbug\nAbility: Swarm\nLevel: 50\n- Struggle Bug',
    ].join('\n\n'),
  };
  let observedDoubleKoWithOneBench = false;
  const defeatSnap = await new Promise<BattleSnapshot>((resP, rejP) => {
    let settled = false;
    let lastReqSeq = -1;
    const ctrl = new ShowdownBattleController(weakDefeatConfig, (snap) => {
      if (settled) return;
      if (snap.status === 'ended') {
        settled = true;
        ctrl.destroy();
        resP(snap);
        return;
      }
      if (snap.status === 'team-preview' && snap.requestSeq !== lastReqSeq) {
        lastReqSeq = snap.requestSeq;
        void ctrl.submitTeamOrder([1, 2, 3, 4]);
        return;
      }
      if (snap.status === 'awaiting-choice' && snap.requestSeq !== lastReqSeq) {
        lastReqSeq = snap.requestSeq;
        if (snap.isForceSwitch) {
          const needCount = snap.pendingSlots.filter((s) => s.forceSwitch && !s.pass).length;
          const avail = snap.p1.party.filter((p) => !p.active && !p.fainted);
          if (needCount === 2 && avail.length === 1) {
            observedDoubleKoWithOneBench = true;
          }
          // Mirror BattleArena's exact commitSlotCommand logic: auto-pass once bench is exhausted
          const used = new Set<number>();
          const cmds = snap.pendingSlots.map((slot) => {
            if (!slot.forceSwitch || slot.pass) return 'pass';
            const pick = avail.find((p) => !used.has(p.slotIndex));
            if (!pick) return 'pass';
            used.add(pick.slotIndex);
            return `switch ${pick.slotIndex}`;
          });
          void ctrl.submitPlayerChoice(cmds.join(', '));
          return;
        }
        const cmds = snap.pendingSlots.map((slot) =>
          slot.pass ? 'pass' : 'move 1'
        );
        void ctrl.submitPlayerChoice(cmds.join(', '));
      }
    });
    ctrl.start().catch((e) => {
      if (!settled) {
        settled = true;
        rejP(e);
      }
    });
  });
  if (!observedDoubleKoWithOneBench || defeatSnap.status !== 'ended' || defeatSnap.winner !== 'p2') {
    throw new Error(
      `Expected double-KO-with-1-bench + clean p2 defeat, got observed=${observedDoubleKoWithOneBench}, status=${defeatSnap.status}, winner=${defeatSnap.winner}`
    );
  }
  console.log(
    `  OK (Double-KO + 1 Bench -> Defeat Regression): observedDoubleKoWithOneBench=${observedDoubleKoWithOneBench}, status=${defeatSnap.status}, winner=${defeatSnap.winner}, turns=${defeatSnap.turn}`
  );

  console.log('\n=== 7. Chapter 02 Bonus + Speed Calc + StrictMode Teardown ===');
  const ch2 = resolveChapter2BanquetBattle({
    team_mode: 'combat',
    mixed_role: 'special',
    assassin_plan: 'mirror',
  });
  await runFullSimMatch('Bonus Banquet', ch2, { maxTurns: 50 });
  const spe = computeSpeedRange('Miraidon', 50, 0, false, true);
  if (!spe.modifiers.includes('Viento Afín ×2')) {
    throw new Error('Speed range check failed!');
  }
  const strictCtrl = new ShowdownBattleController(vgcConfig, () => {});
  const sp = strictCtrl.start();
  strictCtrl.destroy();
  await sp.catch(() => {});

  console.log('\n=== 8. Modo Versus AI Teambuilder (All 7 Formats TeamValidator + Sanitizer) ===');
  const defaultAI = getDefaultAISettings();
  if (defaultAI.enableLlmOpponent !== false) {
    throw new Error('Feature flag enableLlmOpponent MUST be false (dormant) by default!');
  }
  const defaultCtrl = createRivalBattleController(defaultAI);
  if (defaultCtrl.kind !== 'heuristic') {
    throw new Error(`Expected dormant default controller=heuristic, got ${defaultCtrl.kind}`);
  }
  const enabledCtrl = createRivalBattleController({
    ...defaultAI,
    provider: 'ollama',
    enableLlmOpponent: true,
  });
  if (enabledCtrl.kind !== 'llm') {
    throw new Error(`Expected enabled LLM controller=llm, got ${enabledCtrl.kind}`);
  }

  // Test Dex EV/Ability/Level sanitizer
  const sanitized = sanitizeRawMembersToSets(
    [
      {
        species: 'Pelipper',
        item: 'Focus Sash',
        ability: 'HallucinatedAbility',
        nature: 'Modest',
        evs: { hp: 252, spa: 252, spe: 252 }, // intentionally > 508!
        moves: ['Weather Ball', 'Hurricane', 'FakeMoveXYZ', 'Protect'],
      },
    ],
    getVersusFormatSpec('gen9vgc2024regg')
  );
  const totalEv = Object.values(sanitized[0].evs).reduce((a, b) => a + b, 0);
  if (totalEv > 508 || sanitized[0].level !== 50 || sanitized[0].ability === 'HallucinatedAbility') {
    throw new Error(`Sanitizer failed: totalEv=${totalEv}, level=${sanitized[0].level}, ability=${sanitized[0].ability}`);
  }

  for (const fmt of VERSUS_FORMATS) {
    const gen = await generateValidatedTeam({
      formatId: fmt.id,
      prompt: `Equipo competitivo de prueba para ${fmt.name}`,
      settings: { ...defaultAI, provider: 'offline' },
      bypassCache: true,
    });
    const check = validatePasteForFormat(fmt.id, gen.team.paste);
    if (!check.valid) {
      throw new Error(`Versus preset for ${fmt.id} failed TeamValidator: ${check.errors.join('; ')}`);
    }
  }
  console.log(`  OK: All ${VERSUS_FORMATS.length} Versus formats TeamValidator-clean + Feature Flag dormant verified`);

  console.log('\n=== 9. Local Hotseat (P1 vs P2 Human) + On-Demand Live Coach + Post-Game Review ===');
  const hotseatConfig = {
    ...duelConfig,
    p2Control: 'human' as const,
    isVersusMatch: true,
    playerName: 'Jugador 1',
    rivalName: 'Jugador 2',
  };
  let coachChecked = false;
  const hotseatSnap = await new Promise<BattleSnapshot>((resP, rejP) => {
    let settled = false;
    let lastP1Seq = -1;
    let lastP2Seq = -1;
    const ctrl = new ShowdownBattleController(hotseatConfig, (snap) => {
      if (settled) return;
      if (snap.status === 'ended') {
        settled = true;
        ctrl.destroy();
        resP(snap);
        return;
      }
      if (snap.teamPreview && snap.requestSeq !== lastP1Seq) {
        lastP1Seq = snap.requestSeq;
        void ctrl.submitTeamOrder([1]);
      }
      if (snap.p2TeamPreview && snap.p2RequestSeq !== lastP2Seq) {
        lastP2Seq = snap.p2RequestSeq;
        void ctrl.submitP2TeamOrder([1]);
      }
      if (snap.pendingSlots.length > 0 && snap.requestSeq !== lastP1Seq) {
        lastP1Seq = snap.requestSeq;
        if (!coachChecked) {
          coachChecked = true;
          void askLiveCoach(snap, { ...defaultAI, provider: 'offline' }).then((adv) => {
            if (!adv.bestPlay || adv.winChanceEstimate <= 0) {
              rejP(new Error('Live Coach returned empty advice!'));
            }
          });
        }
        void ctrl.submitPlayerChoice('move 1');
      }
      if (snap.p2PendingSlots.length > 0 && snap.p2RequestSeq !== lastP2Seq) {
        lastP2Seq = snap.p2RequestSeq;
        void ctrl.submitP2Choice('move 1');
      }
    });
    ctrl.start().catch((e) => {
      if (!settled) {
        settled = true;
        rejP(e);
      }
    });
  });
  const postReview = await generatePostGameReview(hotseatSnap, hotseatConfig, {
    ...defaultAI,
    provider: 'offline',
  });
  if (hotseatSnap.status !== 'ended' || !coachChecked || postReview.keyTurns.length === 0) {
    throw new Error('Hotseat or Coach/Post-Game Review check failed!');
  }
  console.log(
    `  OK: Hotseat P1 vs P2 ended (winner=${hotseatSnap.winner}, turns=${hotseatSnap.turn}), Live Coach OK, Game Review accuracy=${postReview.playerAccuracy}%`
  );

  console.log('\n=== 10. CAPÍTULO A: El Último Bastión (1 vs 6 Dobles · Milicia de los Muelles) ===');
  const bastionInk = readFileSync(resolve('src/stories/challenge1_last_bastion.ink'), 'utf8');
  const bRunner = new InkVNRunner(bastionInk);
  let bFrame = bRunner.step();
  while (!bFrame.isEnded) {
    if (bFrame.canContinue) bFrame = bRunner.step();
    else if (bFrame.choices.length > 0) bFrame = bRunner.choose(0);
  }
  const bastionCfg = resolveLastBastionBattle(bFrame.flags);
  const { finalSnap: resBastion, turn1Snap: t1Bastion } = await runFullSimMatch(
    'El Ultimo Bastion 1v6 Doubles',
    bastionCfg,
    { maxTurns: 50, testTeraTurn1: true }
  );
  if ((t1Bastion?.p1.active[0]?.boosts.atk ?? 0) < 1) {
    throw new Error(`Expected Annihilape Defiant +1 Atk from Krookodile Intimidate, got ${JSON.stringify(t1Bastion?.p1.active[0]?.boosts)}`);
  }
  if (!resBastion.triggeredScriptIds.includes('bastion-t1-krook-eq')) {
    throw new Error('Expected Krookodile Turn 1 friendly-fire Earthquake script!');
  }
  console.log(
    `  OK: Annihilape Defiant +${t1Bastion?.p1.active[0]?.boosts.atk} Atk, Scripted=[${resBastion.triggeredScriptIds.join(', ')}], turns=${resBastion.turn}`
  );

  console.log('\n=== 11. CAPÍTULO B: Asedio en las Minas (Back-to-Back Ink + BattlePersistenceManager) ===');
  const minesInk = readFileSync(resolve('src/stories/survival1_galar_mines.ink'), 'utf8');
  const minesRunner = new InkVNRunner(minesInk);
  let minesFrame = minesRunner.step();
  while (!minesFrame.isEnded && !minesFrame.pendingBattleTrigger) {
    if (minesFrame.canContinue) minesFrame = minesRunner.step();
    else if (minesFrame.choices.length > 0) minesFrame = minesRunner.choose(0);
  }
  if (minesFrame.pendingBattleTrigger?.battleId !== 'mines_wave1' || minesFrame.pendingBattleTrigger.persist) {
    throw new Error(`Expected # START_BATTLE: mines_wave1, got ${JSON.stringify(minesFrame.pendingBattleTrigger)}`);
  }
  const suspendedMinesJson = minesRunner.exportStateJson();
  const wave1Cfg = resolveMinesWave1Battle(minesFrame.flags);
  const { finalSnap: resWave1 } = await runFullSimMatch('Mines Wave 1', wave1Cfg, {
    maxTurns: 40,
  });
  if (!resWave1.exportedPartyState || resWave1.exportedPartyState.pokemon.length !== 4) {
    throw new Error('BattlePersistenceManager failed to export 4-mon party state after Wave 1!');
  }

  // Resume suspended Ink story into intermediate smoke scene and hit Wave 2 (--persist=true)!
  const minesRunner2 = new InkVNRunner(minesInk);
  minesRunner2.loadStateJson(suspendedMinesJson);
  let minesFrame2 = minesRunner2.step();
  while (!minesFrame2.isEnded && !minesFrame2.pendingBattleTrigger) {
    if (minesFrame2.canContinue) minesFrame2 = minesRunner2.step();
    else break;
  }
  if (minesFrame2.pendingBattleTrigger?.battleId !== 'mines_wave2' || !minesFrame2.pendingBattleTrigger.persist) {
    throw new Error(`Expected # START_BATTLE: mines_wave2 --persist=true, got ${JSON.stringify(minesFrame2.pendingBattleTrigger)}`);
  }

  // Explicitly verify fainted lead reorder + exact HP + status + PP injection into Wave 2!
  const persistedTestState = {
    sourceBattleId: 'mines_wave1',
    capturedAtTurn: resWave1.turn,
    pokemon: resWave1.exportedPartyState.pokemon.map((pm) => {
      if (pm.species === 'Arcanine') {
        return { ...pm, hp: 0, fainted: true, status: '' as const };
      }
      if (pm.species === 'Corviknight') {
        return {
          ...pm,
          hp: 150,
          fainted: false,
          status: 'par' as const,
          ppByMoveId: { ...pm.ppByMoveId, bravebird: 2 },
        };
      }
      return { ...pm, hp: Math.min(200, pm.maxhp), fainted: false, status: '' as const };
    }),
  };
  const wave2Cfg = resolveMinesWave2Battle(minesFrame2.flags, persistedTestState);
  const { finalSnap: resWave2, turn1Snap: t1Wave2 } = await runFullSimMatch(
    'Mines Wave 2 (Persisted)',
    wave2Cfg,
    { maxTurns: 50 }
  );
  const leadW2 = t1Wave2?.p1.active[0];
  const braveBirdSlot = t1Wave2?.pendingSlots[0]?.moves.find((m) => m.id === 'bravebird');
  const faintedArcanine = t1Wave2?.p1.party.find((p) => p.species === 'Arcanine');
  if (
    !t1Wave2?.persistenceApplied ||
    leadW2?.species !== 'Corviknight' ||
    leadW2.hp !== 150 ||
    leadW2.status !== 'par' ||
    braveBirdSlot?.pp !== 2 ||
    !faintedArcanine?.fainted
  ) {
    throw new Error(
      `Wave 2 persistence injection mismatch: applied=${t1Wave2?.persistenceApplied}, lead=${leadW2?.species} hp=${leadW2?.hp} st=${leadW2?.status} bbPP=${braveBirdSlot?.pp} arcFnt=${faintedArcanine?.fainted}`
    );
  }
  console.log(
    `  OK: Ink #START_BATTLE chain + Conscious Lead Reorder (Corviknight), HP=150, status=par, Brave Bird PP=2, Arcanine=fnt, Wave 2 turns=${resWave2.turn}`
  );

  console.log('\n=== 12. CAPÍTULO C: La Falange de Hammerlocke (Triples 6v6 · Gen 6) ===');
  const triplesInk = readFileSync(resolve('src/stories/showcase_triples_phalanx.ink'), 'utf8');
  const tRunner = new InkVNRunner(triplesInk);
  let tFrame = tRunner.step();
  while (!tFrame.isEnded) {
    if (tFrame.canContinue) tFrame = tRunner.step();
    else if (tFrame.choices.length > 0) tFrame = tRunner.choose(0);
  }
  const triplesCfg = resolveTriplesPhalanxBattle(tFrame.flags);
  const { finalSnap: resTriples, turn1Snap: t1Triples } = await runFullSimMatch(
    'Triples 6v6 Phalanx',
    triplesCfg,
    { maxTurns: 60 }
  );
  if (t1Triples?.p1.active.length !== 3 || t1Triples?.p2.active.length !== 3) {
    throw new Error(`Expected 3 active slots per side in Triples, got ${t1Triples?.p1.active.length} vs ${t1Triples?.p2.active.length}`);
  }
  if (!t1Triples?.pendingSlots[1]?.canMegaEvo) {
    throw new Error('Expected Center Gardevoir canMegaEvo=true in Gen 6 Triples!');
  }
  if (!resTriples.triggeredScriptIds.includes('triples-t1-aegislash-wg')) {
    throw new Error('Expected Aegislash Turn 1 Wide Guard in Triples Phalanx!');
  }
  console.log(
    `  OK: 3v3 active Triples verified, Mega Gardevoir ready, Scripted=[${resTriples.triggeredScriptIds.join(', ')}], turns=${resTriples.turn}`
  );

  console.log('\n=== 13. CAPÍTULO D: El Juicio de los Tres Caballeros (1 vs 3 Triples · Gen 6) ===');
  const knightsInk = readFileSync(resolve('src/stories/challenge2_three_knights.ink'), 'utf8');
  const kRunner = new InkVNRunner(knightsInk);
  let kFrame = kRunner.step();
  while (!kFrame.isEnded) {
    if (kFrame.canContinue) kFrame = kRunner.step();
    else if (kFrame.choices.length > 0) kFrame = kRunner.choose(0); // Mega Charizard Y
  }
  const knightsCfg = resolveThreeKnightsBattle(kFrame.flags);
  const { finalSnap: resKnights, turn1Snap: t1Knights } = await runFullSimMatch(
    'Triples 1v3 Three Knights',
    knightsCfg,
    { maxTurns: 30 }
  );
  if (t1Knights?.p1.active[1]?.species !== 'Charizard') {
    throw new Error(`Expected Center Charizard in 1v3 Triples, got ${t1Knights?.p1.active[1]?.species}`);
  }
  if (!resKnights.triggeredScriptIds.includes('triad-wideguard-t1-t3')) {
    throw new Error('Expected Aegislash Turn 1/3 Wide Guard script in Three Knights!');
  }
  console.log(
    `  OK: Center Mega Charizard Y vs 3 Knights, Scripted=[${resKnights.triggeredScriptIds.join(', ')}], winner=${resKnights.winner}, turns=${resKnights.turn}`
  );

  console.log('\n=== 14. CAPÍTULO E: Reliquia de Silph Co. (Gen 1 OU vs Balanced Mew & Mewtwo) ===');
  const gen1Ink = readFileSync(resolve('src/stories/archive_gen1_silph.ink'), 'utf8');
  const g1Runner = new InkVNRunner(gen1Ink);
  let g1Frame = g1Runner.step();
  while (!g1Frame.isEnded) {
    if (g1Frame.canContinue) g1Frame = g1Runner.step();
    else if (g1Frame.choices.length > 0) g1Frame = g1Runner.choose(1); // Tauros lead
  }
  const gen1Cfg = resolveGen1SilphArchiveBattle(g1Frame.flags);
  const { finalSnap: resGen1, turn1Snap: t1Gen1 } = await runFullSimMatch(
    'Gen 1 Silph Co Archive',
    gen1Cfg,
    { maxTurns: 120 }
  );
  if (t1Gen1?.p1.active[0]?.species !== 'Tauros' || t1Gen1?.p2.active[0]?.species !== 'Mewtwo') {
    throw new Error(`Expected Tauros vs Mewtwo in Gen 1, got ${t1Gen1?.p1.active[0]?.species} vs ${t1Gen1?.p2.active[0]?.species}`);
  }
  console.log(
    `  OK: Native gen1customgame (Tauros vs Mewtwo/Mew), Scripted=[${resGen1.triggeredScriptIds.join(', ')}], winner=${resGen1.winner}, turns=${resGen1.turn}`
  );

  console.log('\n=== 15. CAPÍTULO 03: El Domador Clandestino (Gimmick Frustration 102 BP / Felicidad: 0) ===');
  const tamerInk = readFileSync(resolve('src/stories/chapter3_clandestine_tamer.ink'), 'utf8');
  const tmRunner = new InkVNRunner(tamerInk);
  let tmFrame = tmRunner.step();
  while (!tmFrame.isEnded) {
    if (tmFrame.canContinue) tmFrame = tmRunner.step();
    else if (tmFrame.choices.length > 0) tmFrame = tmRunner.choose(0); // listen + rescued_ursaring
  }
  const tamerCfg = resolveClandestineTamerBattle(tmFrame.flags);
  const { finalSnap: resTamer, turn1Snap: t1Tamer } = await runFullSimMatch(
    'Clandestine Tamer Frustration 102',
    tamerCfg,
    { maxTurns: 80 }
  );
  const playerFrust = t1Tamer?.pendingSlots[0]?.moves.find((m) => m.id === 'frustration');
  if (
    !playerFrust ||
    playerFrust.basePower !== 102 ||
    playerFrust.userHappiness !== 0 ||
    !playerFrust.powerNote?.includes('Felicidad: 0')
  ) {
    throw new Error(
      `Expected rescued Ursaring Frustration at 102 BP with Happiness: 0 note, got ${JSON.stringify(playerFrust)}`
    );
  }
  if (!resTamer.triggeredScriptIds.includes('tamer-t1-fakeout')) {
    throw new Error('Expected Kangaskhan Turn 1 Scrappy Fake Out script!');
  }
  console.log(
    `  OK: Frustration basePower=${playerFrust.basePower}, happiness=${playerFrust.userHappiness}, note="${playerFrust.powerNote}", Scripted=[${resTamer.triggeredScriptIds.join(', ')}], turns=${resTamer.turn}`
  );

  console.log('\n=== 16. PUZZLE 02: El Coloso Despertado (Regigigas Raid Boss Turn 0 Injection) ===');
  const regiInk = readFileSync(resolve('src/stories/puzzle2_regigigas_boss.ink'), 'utf8');
  const rgRunner = new InkVNRunner(regiInk);
  let rgFrame = rgRunner.step();
  while (!rgFrame.isEnded) {
    if (rgFrame.canContinue) rgFrame = rgRunner.step();
    else if (rgFrame.choices.length > 0) rgFrame = rgRunner.choose(0); // Dragapult + Farigiraf
  }
  const regiCfg = resolvePuzzle2RegigigasBattle(rgFrame.flags);
  const { finalSnap: resRegi, turn1Snap: t1Regi, turn2Snap: t2Regi } = await runFullSimMatch(
    'Puzzle 02 Regigigas Raid Boss',
    regiCfg,
    {
      maxTurns: 70,
      customTurn1Cmd: 'move 2 +1, move 1 +1', // Dragapult Dragon Pulse (Infiltrator) + Farigiraf Psychic Noise!
    }
  );
  const regiT1 = t1Regi?.p2.active[0];
  const p2SideConds = t1Regi?.p2.sideConditions ?? [];
  if (
    !t1Regi?.puzzleApplied ||
    regiT1?.species !== 'Regigigas' ||
    !regiT1.isBossAce ||
    regiT1.boosts.atk !== 1 ||
    regiT1.boosts.def !== 1 ||
    regiT1.boosts.spd !== 1 ||
    regiT1.volatiles.some((v) => v.toLowerCase().includes('slow start')) ||
    !regiT1.volatiles.some((v) => v.toLowerCase().includes('aqua ring')) ||
    !regiT1.volatiles.some((v) => v.toLowerCase().includes('ingrain')) ||
    !regiT1.volatiles.some((v) => v.toLowerCase().includes('substitute')) ||
    !p2SideConds.some((c) => c.toLowerCase().includes('reflect')) ||
    !p2SideConds.some((c) => c.toLowerCase().includes('light screen'))
  ) {
    throw new Error(
      `Regigigas Turn 0 injection mismatch: applied=${t1Regi?.puzzleApplied} boosts=${JSON.stringify(regiT1?.boosts)} volatiles=${JSON.stringify(regiT1?.volatiles)} sideConds=${JSON.stringify(p2SideConds)}`
    );
  }
  const regiT2 = t2Regi?.p2.active[0];
  if (!regiT2 || !regiT2.volatiles.some((v) => v.toLowerCase().includes('heal block'))) {
    throw new Error(
      `Expected Farigiraf Psychic Noise to apply Heal Block on Regigigas by Turn 2, got volatiles=${JSON.stringify(regiT2?.volatiles)}`
    );
  }
  console.log(
    `  OK: Regigigas Nv.85 ACE (Slow Start cleared, Sub/Aqua Ring/Ingrain + Reflect/Light Screen +1/+1/+1), Psychic Noise Heal Block verified, turns=${resRegi.turn}`
  );

  console.log('\n=== 17. ARCHIVO ANIME: Liga de Sinnoh — Ash vs. Tobías (Omniboost + Baton Pass + Cresselia AI + Giratina Ace) ===');
  const tobiasInk = readFileSync(resolve('src/stories/archive_anime_tobias.ink'), 'utf8');
  const tbRunner = new InkVNRunner(tobiasInk);
  let tbFrame = tbRunner.step();
  while (!tbFrame.isEnded) {
    if (tbFrame.canContinue) tbFrame = tbRunner.step();
    else if (tbFrame.choices.length > 0) tbFrame = tbRunner.choose(0);
  }
  const tobiasCfg = resolveAnimeAshVsTobiasBattle(tbFrame.flags);
  const {
    finalSnap: resTobias,
    previewSnap: pvTobias,
    turn1Snap: t1Tobias,
    turn2Snap: t2Tobias,
  } = await runFullSimMatch('Ash vs Tobias 6v6', tobiasCfg, {
    maxTurns: 90,
    teamPreviewPick: [4], // Swellow Lead -> +2 Omniboost -> Baton Pass!
    customTurn1Cmd: 'move 4', // Swellow Baton Pass (slot 4) -> Pikachu!
  });
  if (pvTobias?.teamPreview?.mode !== 'lead-1') {
    throw new Error(`Expected Ash vs Tobias Team Preview mode=lead-1, got ${pvTobias?.teamPreview?.mode}`);
  }
  const swellowT1 = t1Tobias?.p1.active[0];
  if (
    swellowT1?.species !== 'Swellow' ||
    swellowT1.boosts.atk !== 2 ||
    swellowT1.boosts.def !== 2 ||
    swellowT1.boosts.spa !== 2 ||
    swellowT1.boosts.spd !== 2 ||
    swellowT1.boosts.spe !== 2
  ) {
    throw new Error(
      `Expected Ash chosen Lead Swellow with +2 Omniboost, got ${swellowT1?.species} boosts=${JSON.stringify(swellowT1?.boosts)}`
    );
  }
  if (t1Tobias?.p2.active[0]?.species !== 'Darkrai') {
    throw new Error(`Expected Tobias to always lead Darkrai, got ${t1Tobias?.p2.active[0]?.species}`);
  }
  if (!resTobias.triggeredScriptIds.includes('tobias-t1-darkvoid')) {
    throw new Error('Expected Tobias Darkrai Turn 1 Dark Void scripted rule!');
  }
  // Verify Baton Pass carried +2 boosts onto the switched-in teammate on Turn 2
  const bpRecipient = t2Tobias?.p1.active[0];
  if (!bpRecipient || bpRecipient.species === 'Swellow' || bpRecipient.boosts.spa !== 2) {
    throw new Error(
      `Expected Baton Pass recipient on Turn 2 to retain +2 Omniboost, got ${bpRecipient?.species} boosts=${JSON.stringify(bpRecipient?.boosts)}`
    );
  }
  // Verify Giratina-Origin is saved as the LAST Pokémon if sent out
  const p2Order = resTobias.p2.party.map((p) => p.species);
  const giraIdx = p2Order.findIndex((s) => s.includes('Giratina'));
  if (giraIdx !== -1 && giraIdx !== p2Order.length - 1 && p2Order.length < 6) {
    throw new Error(`Expected Giratina-Origin to be reserved for LAST, got reveal order [${p2Order.join(', ')}]`);
  }
  if (giraIdx !== -1 && p2Order.length === 6 && giraIdx !== 5) {
    throw new Error(`Expected Giratina-Origin as 6th (last) mon, got index ${giraIdx} in [${p2Order.join(', ')}]`);
  }

  // Targeted Cresselia Psych Up + Lunar Dance + Giratina-Origin last-Ace micro-verification
  const cressTestCfg = {
    ...tobiasCfg,
    interactiveTeamPreview: false,
    preferredRivalTeamOrder: 'team 123',
    playerShowdownPaste:
      'Pikachu @ Light Ball\nAbility: Static\nLevel: 60\n- Thunderbolt\n- Quick Attack',
    rivalShowdownPaste: [
      'Cresselia @ Leftovers\nAbility: Levitate\nLevel: 60\n- Psych Up\n- Lunar Dance\n- Psyshock\n- Lunar Blessing',
      'Darkrai @ Life Orb\nAbility: Bad Dreams\nLevel: 60\n- Dark Pulse',
      'Giratina-Origin @ Griseous Core\nAbility: Levitate\nLevel: 60\n- Shadow Force',
    ].join('\n\n'),
    puzzleConditions: {
      pokemonModifiers: [
        { side: 'p1', slotOrSpecies: 'slot:1', boosts: { atk: 2, def: 2, spa: 2, spd: 2, spe: 2 } },
        { side: 'p2', slotOrSpecies: 'Darkrai', hpPercent: 50 },
      ],
    },
  };
  const { finalSnap: resCress, turn2Snap: t2Cress } = await runFullSimMatch(
    'Tobias Cresselia Psych Up + Giratina Ace',
    cressTestCfg,
    { maxTurns: 30, customTurn1Cmd: 'move 2' } // Quick Attack T1 so Cresselia survives & copies +2 Omniboost with Psych Up!
  );
  if (!resCress.triggeredScriptIds.includes('tobias-cresselia-psychup')) {
    throw new Error(`Expected Cresselia Psych Up vs +10 boosts, got [${resCress.triggeredScriptIds.join(', ')}]`);
  }
  if ((t2Cress?.p2.active[0]?.boosts.spa ?? 0) !== 2) {
    throw new Error(`Expected Cresselia to copy +2 SpA via Psych Up, got ${JSON.stringify(t2Cress?.p2.active[0]?.boosts)}`);
  }
  const cressRevealOrder = resCress.p2.party.map((p) => p.species);
  if (cressRevealOrder.length === 3 && !cressRevealOrder[2].includes('Giratina')) {
    throw new Error(`Expected Giratina-Origin strictly last in Cresselia micro-test, got [${cressRevealOrder.join(', ')}]`);
  }

  // Targeted Lunar Dance verification (Cresselia starts at 30% HP while Darkrai is injured -> prioritizes Lunar Dance!)
  const lunarTestCfg = {
    ...cressTestCfg,
    puzzleConditions: {
      pokemonModifiers: [
        { side: 'p2' as const, slotOrSpecies: 'Cresselia', hpPercent: 30 },
        { side: 'p2' as const, slotOrSpecies: 'Darkrai', hpPercent: 45 },
      ],
    },
  };
  const { finalSnap: resLunar } = await runFullSimMatch(
    'Tobias Cresselia Lunar Dance',
    lunarTestCfg,
    { maxTurns: 20, customTurn1Cmd: 'move 2' }
  );
  if (!resLunar.triggeredScriptIds.includes('tobias-cresselia-lunardance')) {
    throw new Error(`Expected Cresselia Lunar Dance at 30% HP with injured Darkrai, got [${resLunar.triggeredScriptIds.join(', ')}]`);
  }

  console.log(
    `  OK: Ash Lead Swellow +2 Omniboost -> Baton Pass (${bpRecipient.species} +2), Darkrai Dark Void T1, Cresselia Psych Up (+2 copied) & Lunar Dance (<35% HP), Giratina-Origin last Ace [${cressRevealOrder.join(' -> ')}], turns=${resTobias.turn}`
  );

  console.log('\n=== 18. Economía, Candados, Tienda, Editor de Equipo & Shiny Charms (Máx. 6) ===');
  let prof = createDefaultProfile('Luso233', 'luso@example.com');
  if (!isChapterUnlocked(prof, 'ch1-wyndon-chase') || isChapterUnlocked(prof, 'anime-ash-vs-tobias')) {
    throw new Error('Chapter starter lock rules mismatch!');
  }
  const winRes = applyBattleOutcomeToProfile(prof, 'ch1-wyndon-chase', true, 10);
  prof = winRes.nextProfile;
  if (!winRes.reward || winRes.reward.coinsEarned < 1500 || !isChapterUnlocked(prof, 'ch2-monotype-banners')) {
    throw new Error(`Expected victory reward + ch2 unlock, got ${JSON.stringify(winRes.reward)}`);
  }
  const buyMon = purchasePokemon(prof, 'Dragapult');
  if (!buyMon.ok) throw new Error('Expected Dragapult purchase to succeed!');
  prof = buyMon.nextProfile;
  const buyIt = purchaseHeldItem(prof, 'Life Orb');
  if (!buyIt.ok) throw new Error('Expected Life Orb purchase to succeed!');
  prof = buyIt.nextProfile;
  const buyTm = purchaseTM(prof, 'Earthquake');
  if (!buyTm.ok) throw new Error('Expected Earthquake TM purchase to succeed!');
  prof = buyTm.nextProfile;
  // Award Arcade coins to buy 1 Shiny Charm (10,000 PC) + unlock Ash vs Tobias (3,000 PC)
  prof = awardArcadeCoins(prof, 15000);
  const buyCharm = purchaseShinyCharm(prof);
  if (!buyCharm.ok || buyCharm.nextProfile.inventory.shinyCharms !== 1) {
    throw new Error('Expected Shiny Charm #1 purchase to succeed!');
  }
  prof = buyCharm.nextProfile;
  const unlockAsh = unlockChapterWithCoins(prof, 'anime-ash-vs-tobias');
  if (!unlockAsh.ok || !isChapterUnlocked(unlockAsh.nextProfile, 'anime-ash-vs-tobias')) {
    throw new Error('Expected coin unlock of Ash vs Tobias to succeed!');
  }
  prof = unlockAsh.nextProfile;
  // Activate Shiny on slot 0 (Dragapult) & verify exceeding shinyCharms (slot 1 shiny too) is blocked!
  const setShiny0 = updateCustomTeamSlot(prof, 0, {
    ...prof.customTeam[0],
    species: 'Dragapult',
    item: 'Life Orb',
    moves: ['Draco Meteor', 'Shadow Ball', 'Earthquake', 'Protect'],
    shiny: true,
  });
  if (!setShiny0.ok) throw new Error('Expected slot 0 Shiny activation to succeed!');
  prof = setShiny0.nextProfile;
  const setShiny1Blocked = updateCustomTeamSlot(prof, 1, {
    ...prof.customTeam[1],
    shiny: true,
  });
  if (setShiny1Blocked.ok) {
    throw new Error('Expected slot 1 Shiny to be rejected when only 1 Shiny Charm is owned!');
  }
  const customPaste = compileCustomTeamToShowdownPaste(prof.customTeam, 100);
  if (!customPaste.includes('Shiny: Yes')) {
    throw new Error('Expected compiled custom paste to contain Shiny: Yes!');
  }
  // Verify ShowdownBattleController propagates mon.shiny === true into BattleSnapshot!
  const { turn1Snap: shinyT1 } = await runFullSimMatch(
    'Shiny Custom Team Test',
    {
      ...tamerCfg,
      playerShowdownPaste: customPaste,
    },
    { maxTurns: 60 }
  );
  if (!shinyT1?.p1.active[0]?.shiny) {
    throw new Error(`Expected Shiny Dragapult active[0].shiny === true, got ${shinyT1?.p1.active[0]?.shiny}`);
  }
  console.log(
    `  OK: Economy/Locks/Shop/TeamEditor verified, Shiny Charm cap enforced, Shiny Dragapult active in @pkmn/sim (coins=${prof.coins})`
  );

  console.log('\n=== 19. Teambuilder Narrativo (Learnsets Dex, Slots Desbloqueables, Inventario) & Dev Mode ===');
  const arcanineGen9 = getLegalLearnsetForSpecies('Arcanine', 'gen9doublescustomgame');
  if (
    arcanineGen9.length < 40 ||
    !arcanineGen9.some((m) => m.id === 'extremespeed') ||
    !arcanineGen9.some((m) => m.id === 'closecombat')
  ) {
    throw new Error(`Expected Arcanine Gen 9 learnset to contain Extreme Speed & Close Combat, got count=${arcanineGen9.length}`);
  }
  const taurosGen1 = getLegalLearnsetForSpecies('Tauros', 'gen1customgame');
  if (
    !taurosGen1.some((m) => m.id === 'bodyslam') ||
    !taurosGen1.some((m) => m.id === 'hyperbeam') ||
    taurosGen1.some((m) => m.id === 'closecombat')
  ) {
    throw new Error(`Expected Tauros Gen 1 learnset strictly Gen 1 legal, got count=${taurosGen1.length}`);
  }

  let progProf = createDefaultProfile('Tester', 'test@example.com');
  // Clearing Chapter 01 awards Mental Herb directly into inventory!
  const ch1Clear = applyBattleOutcomeToProfile(progProf, 'ch1-wyndon-chase', true, 8);
  progProf = ch1Clear.nextProfile;
  if (!ch1Clear.reward?.rewardItems?.includes('Mental Herb') || !progProf.inventory.items.includes('Mental Herb')) {
    throw new Error(`Expected Chapter 01 first clear to award Mental Herb, got ${JSON.stringify(ch1Clear.reward)}`);
  }
  // Move slot 0 is locked initially -> setCustomMove must fail before paying!
  if (isMoveSlotUnlocked(progProf, 'Arcanine', 0)) {
    throw new Error('Expected Arcanine slot 0 to be locked initially!');
  }
  const blockedMoveRes = setCustomMoveForSpecies(progProf, 'Arcanine', 0, 'Extreme Speed');
  if (blockedMoveRes.ok) {
    throw new Error('Expected setting move on locked slot 0 to be rejected!');
  }
  // Unlock slot 0 (500 PC) and assign Extreme Speed + Mental Herb (owned from Ch1 clear!)
  const unlockSlot0 = unlockMoveSlotForSpecies(progProf, 'Arcanine', 0);
  if (!unlockSlot0.ok) throw new Error(`Expected slot 0 unlock to succeed: ${unlockSlot0.error}`);
  progProf = unlockSlot0.nextProfile;
  const assignMove0 = setCustomMoveForSpecies(progProf, 'Arcanine', 0, 'Extreme Speed');
  if (!assignMove0.ok) throw new Error(`Expected assigning Extreme Speed to succeed: ${assignMove0.error}`);
  progProf = assignMove0.nextProfile;
  progProf = setCustomItemForSpecies(progProf, 'Arcanine', 'Mental Herb');
  // Also try setting an UNOWNED item ('Choice Specs') on Gardevoir -> progression compiler must ignore unowned item!
  progProf = setCustomItemForSpecies(progProf, 'Gardevoir', 'Choice Specs');

  const ch1CfgBase = resolveChapter1ChaseBattle({});
  const progressedPaste = applyChapterProgressionToPaste(
    ch1CfgBase.playerShowdownPaste,
    progProf,
    ch1CfgBase.formatId
  );
  const progressedSets = Teams.import(progressedPaste) ?? [];
  const progArc = progressedSets.find((s) => s.species === 'Arcanine');
  const progGard = progressedSets.find((s) => s.species === 'Gardevoir');
  if (
    !progArc ||
    progArc.item !== 'Mental Herb' ||
    progArc.moves[0] !== 'Extreme Speed' ||
    progGard?.item !== 'Light Clay'
  ) {
    throw new Error(
      `Story Teambuilder progression mismatch: Arc=${JSON.stringify(progArc?.item)}/${JSON.stringify(progArc?.moves)} Gard=${JSON.stringify(progGard?.item)}`
    );
  }

  // Verify Dev Mode: Unlock Everything -> +1M coins -> Reset Story!
  let devProf = applyDevUnlockEverything(progProf);
  devProf = addDevCoins(devProf, 1000000);
  const totalChapters = Object.keys(CHAPTER_UNLOCK_RULES).length;
  if (
    !devProf.devModeEnabled ||
    devProf.coins !== 9999999 ||
    devProf.inventory.shinyCharms !== 6 ||
    devProf.unlockedChapters.length !== totalChapters ||
    !isMoveSlotUnlocked(devProf, 'Regigigas', 3)
  ) {
    throw new Error(`Dev Mode unlock-all invariant failed: coins=${devProf.coins}, ch=${devProf.unlockedChapters.length}`);
  }
  const resetProf = resetStoryProgress(devProf);
  if (
    resetProf.devModeEnabled ||
    resetProf.coins !== 1500 ||
    resetProf.unlockedChapters.length !== 3 ||
    Object.keys(resetProf.completedChapters).length !== 0 ||
    Object.keys(resetProf.unlockedMoveSlots).length !== 0
  ) {
    throw new Error(`Dev Mode story reset failed: coins=${resetProf.coins}, ch=${resetProf.unlockedChapters.length}`);
  }
  console.log(
    `  OK: Dex learnsets (Arcanine=${arcanineGen9.length}, Gen1 Tauros=${taurosGen1.length}), slot unlock + Mental Herb reward + unowned item guard + Dev Mode Unlock/Reset verified`
  );

  console.log('\n=== 20. Personalidades NPC, Diálogos Reactivos, Dificultad/Variantes & Hombre Rata (Doble Zoroark Nv. 130 + 4 Cebos) ===');
  const ratInk = readFileSync(resolve('src/stories/chapter1_banquet.ink'), 'utf8');
  const ratRunner = new InkVNRunner(ratInk);
  let ratFrame = ratRunner.step();
  while (!ratFrame.isEnded) {
    if (ratFrame.canContinue) ratFrame = ratRunner.step();
    else if (ratFrame.choices.length > 0) ratFrame = ratRunner.choose(0); // daily + physical + sabotage
  }
  const ratBaseCfg = resolveChapter2BanquetBattle(ratFrame.flags);
  const ratHydratedCfg = applyNpcRunModifiers(ratBaseCfg, 'kaizo', 'canonical');
  const { finalSnap: resRat, turn1Snap: t1Rat } = await runFullSimMatch(
    'Rat-Man Double Illusion Lv.130 Bonus 02',
    ratHydratedCfg,
    { maxTurns: 40 }
  );
  if (
    ratHydratedCfg.rivalCharId !== 'rat_saboteur' ||
    !ratHydratedCfg.rivalShowdownPaste.includes('Zoroark-Hisui') ||
    !ratHydratedCfg.rivalShowdownPaste.includes('Zoroark @ Choice Specs') ||
    !ratHydratedCfg.rivalShowdownPaste.includes('Level: 130') ||
    !ratHydratedCfg.rivalShowdownPaste.includes('Gengar @ Choice Band') ||
    !ratHydratedCfg.rivalShowdownPaste.includes('Maushold @ Focus Sash') ||
    !ratHydratedCfg.rivalShowdownPaste.includes('Toxicroak @ Focus Sash') ||
    !ratHydratedCfg.rivalShowdownPaste.includes('Gothitelle @ Sitrus Berry')
  ) {
    throw new Error(
      `Expected Rat-Man Double Lv.130 Zoroark + 4 Type-Bait Supports team, got char=${ratHydratedCfg.rivalCharId}`
    );
  }
  // Verify Turn 1 hides the Lv.130 Zoroark behind Illusion disguise (species, level AND [ACE] tag all masked!)
  const t1RivalSpecies = t1Rat?.p2.active.map((m) => m?.species).filter(Boolean) ?? [];
  const t1LeadMasked = t1Rat?.p2.active[0];
  if (
    t1RivalSpecies.some((sp) => sp?.startsWith('Zoroark')) ||
    !t1LeadMasked ||
    t1LeadMasked.level !== 100 ||
    t1LeadMasked.isBossAce
  ) {
    throw new Error(
      `Expected Turn 1 lead Zoroark to be completely disguised (species + Lv.100 + isBossAce=false), got active=[${t1RivalSpecies.join(', ')}], leadLv=${t1LeadMasked?.level}, ace=${t1LeadMasked?.isBossAce}`
    );
  }
  if (!t1Rat?.activeTaunt && !resRat.activeTaunt) {
    throw new Error('Expected reactive or scripted NPC dialogue banner during Rat-Man combat!');
  }

  // Verify difficulty scaling + classic Shedinja/Moody Smeargle/Scarf Ditto variant selection
  const darkCmdVariants = getVariantsForChapterNpc('dark_commander', 'ch2-monotype-banners');
  if (darkCmdVariants.length < 2) {
    throw new Error(`Expected >=2 variants for Comandante Siniestro, got ${darkCmdVariants.length}`);
  }
  const nightmareRat = applyNpcRunModifiers(ratBaseCfg, 'nightmare', 'rat-banette-nightmare');
  const standardRat = applyNpcRunModifiers(ratBaseCfg, 'standard', 'canonical');
  if (
    !nightmareRat.rivalShowdownPaste.includes('Banette-Mega') ||
    !nightmareRat.rivalShowdownPaste.includes('Ability: Moody') ||
    !nightmareRat.rivalShowdownPaste.includes('Level: 134') ||
    !standardRat.rivalShowdownPaste.includes('Level: 126')
  ) {
    throw new Error('Difficulty scaling (126/130/134) or Classic Diablo variant check failed!');
  }
  const rivalDef = getNpcDefinition('assassin');
  if (!rivalDef.socialLink?.romanceable || !rivalDef.socialLink?.canTagPartner) {
    throw new Error('Expected recurring rival (assassin) to have future socialLink romanceable & tag-partner metadata!');
  }
  console.log(
    `  OK: Rat-Man Double Lv.130 Illusion (Zoroark-Hisui + Zoroark disguised as ${t1RivalSpecies.join(' + ')} on T1 + Gengar Choice Band Trick / Maushold / Toxicroak / Gothitelle), Difficulty (126/130/134) & Variants verified (turns=${resRat.turn})`
  );

  console.log('\n=== 21. Nuevos Personajes (Duelista, Estratega Solar, Guardián) & Desafío 8 Climas/Terrenos (Castform ★) ===');
  const duelNewCfg = resolveDuel1Honor1v1Battle({ rival_read: 'ironcrown' });
  const sunNewCfg = resolvePuzzle1SunTrapBattle({ puzzle_hint: 'show' });
  const regiNewCfg = resolvePuzzle2RegigigasBattle({ puzzle2_lead: 'dragapult_farigiraf' });
  if (
    duelNewCfg.rivalCharId !== 'court_duelist' ||
    sunNewCfg.rivalCharId !== 'solar_strategist' ||
    regiNewCfg.rivalCharId !== 'colossus_keeper' ||
    regiNewCfg.rivalName !== 'Guardián del Coloso'
  ) {
    throw new Error(
      `Expected updated rival identities, got duel=${duelNewCfg.rivalCharId}, sun=${sunNewCfg.rivalCharId}, regi=${regiNewCfg.rivalCharId}/${regiNewCfg.rivalName}`
    );
  }

  // Test Ink branching for challenge_weather_terrains.ink -> pick Rain (choice 0 -> choice 1)
  const wxInk = readFileSync(resolve('src/stories/challenge_weather_terrains.ink'), 'utf8');
  const wxRunner = new InkVNRunner(wxInk);
  let wxFrame = wxRunner.step();
  let wxStepIdx = 0;
  while (!wxFrame.isEnded) {
    if (wxFrame.canContinue) wxFrame = wxRunner.step();
    else if (wxFrame.choices.length > 0) {
      // First menu: 0 = 4 Climas; Second menu: 1 = Lluvia Torrencial
      wxFrame = wxRunner.choose(wxStepIdx === 0 ? 0 : 1);
      wxStepIdx++;
    }
  }
  if (wxFrame.flags.climate_mode !== 'rain') {
    throw new Error(`Expected climate_mode="rain" from Ink choices, got ${String(wxFrame.flags.climate_mode)}`);
  }

  // Run 3 distinct weather/terrain simulations in @pkmn/sim: rain, snow, psychic!
  const wxRainCfg = applyNpcRunModifiers(
    resolveWeatherTerrainsChallengeBattle({ climate_mode: 'rain' }),
    'kaizo',
    'canonical'
  );
  const { turn1Snap: t1WxRain, finalSnap: resWxRain } = await runFullSimMatch(
    '8 Elements — Rain + Castform Ace',
    wxRainCfg,
    { maxTurns: 35 }
  );
  if (
    wxRainCfg.rivalCharId !== 'solar_strategist' ||
    wxRainCfg.reserveAsLastAceSpecies !== 'Castform' ||
    !wxRainCfg.rivalShowdownPaste.includes('Level: 105') ||
    !t1WxRain?.weather.includes('Lluvia')
  ) {
    throw new Error(
      `Rain challenge failed: char=${wxRainCfg.rivalCharId} ace=${wxRainCfg.reserveAsLastAceSpecies} weather=${t1WxRain?.weather}`
    );
  }

  const wxSnowCfg = resolveWeatherTerrainsChallengeBattle({ climate_mode: 'snow' });
  const { turn1Snap: t1WxSnow } = await runFullSimMatch(
    '8 Elements — Snow + Castform Ace',
    wxSnowCfg,
    { maxTurns: 25 }
  );
  if (!t1WxSnow?.weather.includes('Nieve')) {
    throw new Error(`Snow challenge expected weather 'Nieve', got '${t1WxSnow?.weather}'`);
  }

  const wxPsyCfg = resolveWeatherTerrainsChallengeBattle({ climate_mode: 'psychic' });
  const { turn1Snap: t1WxPsy } = await runFullSimMatch(
    '8 Elements — Psychic Terrain + Castform Ace',
    wxPsyCfg,
    { maxTurns: 25 }
  );
  if (!t1WxPsy?.terrain.includes('Psíquico')) {
    throw new Error(`Psychic terrain challenge expected terrain 'Campo Psíquico', got '${t1WxPsy?.terrain}'`);
  }

  // Also ensure all 8 modes resolve cleanly with Castform ★ Lv.105
  for (const mode of ['sun', 'rain', 'sand', 'snow', 'electric', 'grassy', 'psychic', 'misty']) {
    const cfg = resolveWeatherTerrainsChallengeBattle({ climate_mode: mode });
    if (!cfg.rivalShowdownPaste.includes('Castform ★ (Castform)') || !cfg.rivalShowdownPaste.includes('Level: 105')) {
      throw new Error(`Expected Castform ★ Lv.105 in climate_mode=${mode}`);
    }
  }
  // Verify every chapter has a valid geopolitical map location & bloc
  const allChapterIds = Object.keys(CHAPTER_UNLOCK_RULES);
  for (const chId of allChapterIds) {
    const loc = CHAPTER_MAP_LOCATIONS[chId];
    if (!loc || !BLOC_BY_ID[loc.blocId]) {
      throw new Error(`Missing or invalid WorldWarMap location for chapter '${chId}'`);
    }
  }
  console.log(
    `  OK: Duelista/Estratega Solar/Guardián verified + all 8 Weather/Terrain modes (Rain='${t1WxRain.weather}', Snow='${t1WxSnow.weather}', Psychic='${t1WxPsy.terrain}', Castform ★ Nv.105 Ace, turns=${resWxRain.turn}) + WorldWarMap (${WORLD_BLOCS.length} blocs, ${allChapterIds.length}/${allChapterIds.length} chapters mapped)`
  );

  console.log('\n=== 22. Regiones Pokémon Auténticas + Crónica CRU (4 Actos), Atlas Oscuro, Batch 1/2 (Mega-Rayquaza, 1v1, Waifus/Husbandos), Diablo & Cajas PC ===');
  if (
    DARK_ATLAS_LANDMARKS.length !== 9 ||
    ROMANCE_ROSTER.length !== 13 ||
    WORLD_HISTORY_ACTS.length !== 4
  ) {
    throw new Error(
      `Expected 9 Dark Atlas landmarks, 13 Romance NPCs & 4 CRU History Acts, got dark=${DARK_ATLAS_LANDMARKS.length}, romance=${ROMANCE_ROSTER.length}, acts=${WORLD_HISTORY_ACTS.length}`
    );
  }

  // 0) Verify ZERO real-world placeholder names remain in WORLD_BLOCS and all new Pokémon names are present!
  const allBlocText = WORLD_BLOCS.map((b) => `${b.name} ${b.shortName} ${b.loreSummary}`).join(' ');
  const bannedPlaceholders = [
    'Poké-India',
    'Poké-África',
    'Poké-Japón',
    'Poké-Australia',
    'Poké-Canadá',
    'Estepa del Norte',
    'Aztlán-Caribe',
    'Andes-Plata',
    'Malvinas',
    'Asia Continental',
  ];
  for (const banned of bannedPlaceholders) {
    if (allBlocText.includes(banned)) {
      throw new Error(`Found banned real-world placeholder "${banned}" inside WORLD_BLOCS!`);
    }
  }
  const requiredNames = [
    'Mesoa',
    'Cordelia',
    'Veridia',
    'Kemetia',
    'Kora',
    'Miraj',
    'Tamra',
    'Kovaria',
    'Shentai',
    'Tohjo',
    'Vayra',
    'Tarran',
    'Borelia',
    'Islas Bruma',
  ];
  for (const reqName of requiredNames) {
    if (!allBlocText.includes(reqName)) {
      throw new Error(`Missing authentic Pokémon region name "${reqName}" in WORLD_BLOCS!`);
    }
  }
  // Verify Batch 2 Waifus & Husbandos carry narrative Boss-Rule Aces!
  for (const b2Id of [
    'cordelia_astronomer',
    'mesoa_boss',
    'poketopia_croupier',
    'ranger_commander',
    'aeos_geneticist',
  ]) {
    const npc = ROMANCE_ROSTER.find((n) => n.id === b2Id);
    if (!npc || !npc.bossAceRule) {
      throw new Error(`Expected Batch 2 Waifu/Husbando "${b2Id}" with narrative bossAceRule!`);
    }
  }

  // 1) Declarative Difficulty Overrides + Mega-Rayquaza AG: Normal (Bubble Beam + Mystic Water) -> Diablo (Water Spout + Choice Specs + Mega-Rayquaza)
  const champRematchBase = resolveRomanceRematchBattle('champion');
  const champStd = applyNpcRunModifiers(champRematchBase, 'standard', 'canonical');
  const champDiablo = applyNpcRunModifiers(champRematchBase, 'nightmare', 'canonical');
  if (
    !champStd.rivalShowdownPaste.includes('Bubble Beam') ||
    !champStd.rivalShowdownPaste.includes('Mystic Water') ||
    !champDiablo.rivalShowdownPaste.includes('Water Spout') ||
    !champDiablo.rivalShowdownPaste.includes('Choice Specs') ||
    !champDiablo.rivalShowdownPaste.includes('Rayquaza-Mega')
  ) {
    throw new Error('Champion AG Rematch (Mega-Rayquaza + Kyogre Normal->Diablo override) failed!');
  }

  // 2a) Run real 2v2 Human Tag-Team battle with El Pelirrojo (3 yours + 3 Edgy Sweepers vs 6 Orre Bounty Hunters)
  const tagAssassinCfg = applyNpcRunModifiers(
    resolveRomanceTagBattle('assassin'),
    'nightmare',
    'canonical'
  );
  const { turn1Snap: t1Tag, finalSnap: resTag } = await runFullSimMatch(
    'Romance Rank 2 Tag-Team 2v2 — Orre (El Pelirrojo)',
    tagAssassinCfg,
    { maxTurns: 30 }
  );
  if (
    t1Tag?.p1.party.length !== 6 ||
    !t1Tag?.p1.active[1]?.name.includes('[Aliado]')
  ) {
    throw new Error(
      `Expected 2v2 Tag-Team shoulder-to-shoulder lead (Slot 1=Player, Slot 2=[Aliado]), got active=[${t1Tag?.p1.active.map((a) => a?.name).join(', ')}]`
    );
  }

  // 2b) Run Champion Rank 2 Tag-Team WITH MEGA-RAYQUAZA ON YOUR SIDE in @pkmn/sim!
  const tagChampCfg = resolveRomanceTagBattle('champion');
  const { turn1Snap: t1ChampTag } = await runFullSimMatch(
    'Romance Rank 2 Tag-Team 2v2 — Champion + Mega-Rayquaza',
    tagChampCfg,
    { maxTurns: 25 }
  );
  if (
    !t1ChampTag?.p1.active[1]?.name.includes('Mega-Rayquaza') ||
    t1ChampTag?.p1.active[1]?.species !== 'Rayquaza-Mega'
  ) {
    throw new Error(
      `Expected Mega-Rayquaza fighting on player's side in Champion R2 Tag 2v2, got ${JSON.stringify(t1ChampTag?.p1.active[1])}`
    );
  }

  // 2c) Run Duelist Rank 3 Rematch in PURE gen91v1 (Bring 3, Pick 1!)
  const duelist1v1Cfg = resolveRomanceRematchBattle('court_duelist');
  const { previewSnap: pvDuelistR3, finalSnap: resDuelistR3 } = await runFullSimMatch(
    'Romance Rank 3 — Duelist Pure gen91v1',
    duelist1v1Cfg,
    { maxTurns: 25, teamPreviewPick: [1] }
  );
  if (
    duelist1v1Cfg.formatId !== 'gen91v1' ||
    pvDuelistR3?.teamPreview?.mode !== 'pick-1' ||
    resDuelistR3.status !== 'ended'
  ) {
    throw new Error(
      `Expected Duelist R3 Rematch in pure gen91v1 (pick-1), got format=${duelist1v1Cfg.formatId}, preview=${pvDuelistR3?.teamPreview?.mode}, status=${resDuelistR3.status}`
    );
  }

  // 3) Romance 3-Rank Progression (3 Ironman Pillars at R1!) + First Romance Ending + Harem Ending + House PC
  let romProf = createDefaultProfile('Exiliado', 'exile@galar.com');
  // Verify starter itemStock has zero duplicate Leftovers conflict (Sylveon uses Throat Spray!)
  const starterSylveon = romProf.pokemonBox.find((b) => b.species === 'Sylveon');
  if (starterSylveon?.item !== 'Throat Spray') {
    throw new Error(`Expected starter Sylveon holding Throat Spray (no Leftovers clone), got ${starterSylveon?.item}`);
  }
  romProf = toggleRunModifiers(romProf, {
    ironmanMode: true,
    nuzlockePermadeath: true,
    defaultDifficulty: 'nightmare',
  });
  romProf = completeRomanceRank(romProf, 'assassin', 1);
  if (!computeActiveSocialLinkPerks(romProf).hasAntiDiabloScouting) {
    throw new Error('Expected El Pelirrojo R1 (Red de Inteligencia) to unlock Anti-Diablo Scouting immediately!');
  }
  romProf = completeRomanceRank(romProf, 'court_duelist', 1);
  romProf = completeRomanceRank(romProf, 'champion', 1);
  const r1Perks = computeActiveSocialLinkPerks(romProf);
  if (
    !r1Perks.hasAntiDiabloScouting ||
    r1Perks.campHealDiscountPct !== 35 ||
    r1Perks.maxBerryPlots !== 5 ||
    r1Perks.passivePpRegen !== 2 ||
    !r1Perks.hasFreeTutoringPerk ||
    r1Perks.victoryCoinMultiplier !== 1.3
  ) {
    throw new Error(`Rank 1 Ironman 3-Pillar perks mismatch: ${JSON.stringify(r1Perks)}`);
  }
  // Verify Champion R1 Doctrina Real makes Move Slot unlocking FREE (0 PC)!
  const coinsBeforeTutor = romProf.coins;
  const freeSlotRes = unlockMoveSlotForSpecies(romProf, 'Arcanine', 0);
  if (!freeSlotRes.ok || freeSlotRes.nextProfile.coins !== coinsBeforeTutor) {
    throw new Error('Expected Champion R1 Doctrina Real to unlock Move Slot for 0 PC!');
  }
  romProf = freeSlotRes.nextProfile;

  // Plant + tick + harvest camp berry
  const plantRes = plantCampBerry(romProf, 0, 'lum');
  if (!plantRes.ok) throw new Error('Expected camp berry planting to succeed!');
  romProf = plantRes.nextProfile;
  romProf = recordPostBattleSurvivalState(romProf, null, true);
  const harvestRes = harvestCampBerry(romProf, 0);
  if (!harvestRes.ok || harvestRes.nextProfile.campBerries.lum !== 4) {
    throw new Error('Expected camp berry harvest (+2 Lum -> 4) to succeed!');
  }
  romProf = harvestRes.nextProfile;

  // Max Duelist FIRST -> locks firstRomanceMaxedId='court_duelist'; then max all 3 -> triggers Harem Ending!
  romProf = completeRomanceRank(romProf, 'court_duelist', 2);
  romProf = completeRomanceRank(romProf, 'court_duelist', 3);
  if (romProf.firstRomanceMaxedId !== 'court_duelist') {
    throw new Error(`Expected firstRomanceMaxedId='court_duelist', got ${romProf.firstRomanceMaxedId}`);
  }
  romProf = completeRomanceRank(romProf, 'assassin', 3);
  romProf = completeRomanceRank(romProf, 'champion', 3);
  const maxPerks = computeActiveSocialLinkPerks(romProf);
  if (
    romProf.firstRomanceMaxedId !== 'court_duelist' ||
    !maxPerks.isHaremUnlocked ||
    maxPerks.unlockedHousePokemon.length !== 9 ||
    romProf.pokemonBox.filter((b) => b.zone === 'house').length !== 9
  ) {
    throw new Error(
      `Expected Harem Ending + 9 House PC instances, got first=${romProf.firstRomanceMaxedId}, harem=${maxPerks.isHaremUnlocked}, house=${romProf.pokemonBox.filter((b) => b.zone === 'house').length}`
    );
  }

  // 4) PC Box System: Anti-Clone Item Stock Transfer + Box NO-HEAL 1-HP Poisoned Rest Tech + Nuzlocke Permadeath Graveyard!
  const arcInst = romProf.pokemonBox.find((b) => b.zone === 'party' && b.species === 'Arcanine');
  const gardInst = romProf.pokemonBox.find((b) => b.zone === 'party' && b.species === 'Gardevoir');
  if (!arcInst || !gardInst) throw new Error('Expected starter Arcanine & Gardevoir in party box!');
  // Stock of Sitrus Berry is 1 (held by Arcanine). Equipping on Gardevoir MUST transfer it away from Arcanine!
  const equipRes = equipItemOnInstance(romProf, gardInst.uid, 'Sitrus Berry');
  if (
    !equipRes.ok ||
    equipRes.transferredFrom !== 'Arcanine' ||
    equipRes.nextProfile.pokemonBox.find((b) => b.uid === arcInst.uid)?.item !== '' ||
    equipRes.nextProfile.pokemonBox.find((b) => b.uid === gardInst.uid)?.item !== 'Sitrus Berry'
  ) {
    throw new Error('Expected real itemStock enforcement (transfer Sitrus Berry without cloning)!');
  }
  romProf = equipRes.nextProfile;

  // Simulate Ironman + Nuzlocke battle aftermath: Arcanine survives at 1 HP + PSN; Gardevoir faints -> Graveyard!
  romProf = recordPostBattleSurvivalState(
    romProf,
    {
      sourceBattleId: 'test-ironman',
      capturedAtTurn: 7,
      pokemon: [
        {
          species: 'Arcanine',
          name: 'Arcanine',
          hp: 1,
          maxhp: 382,
          fainted: false,
          status: 'psn',
          moveSlots: [{ id: 'flareblitz', move: 'Flare Blitz', pp: 10, maxpp: 15 }],
          ppByMoveId: { flareblitz: 10 },
        },
        {
          species: 'Gardevoir',
          name: 'Gardevoir',
          hp: 0,
          maxhp: 340,
          fainted: true,
          status: '',
          moveSlots: [],
          ppByMoveId: {},
        },
      ],
    },
    true,
    { chapterTitle: 'Prueba Diablo', rivalName: 'El Pelirrojo', turn: 7 }
  );

  // Verify Gardevoir moved permanently to graveyard & cannot return to party!
  const deadGard = romProf.pokemonBox.find((b) => b.uid === gardInst.uid);
  const reviveBlocked = movePokemonInstanceZone(romProf, gardInst.uid, 'party');
  if (deadGard?.zone !== 'graveyard' || !deadGard.epitaph || reviveBlocked.ok) {
    throw new Error('Expected Ultra Nuzlocke fainted Gardevoir locked in graveyard with epitaph!');
  }

  // Run & Bun Rest Tech: Park 1-HP PSN Arcanine in Box -> verify ZERO healing -> teach Rest -> return to party -> inject 1 HP PSN!
  const parkArc = movePokemonInstanceZone(romProf, arcInst.uid, 'box');
  if (!parkArc.ok) throw new Error('Expected parking Arcanine in Box to succeed!');
  romProf = parkArc.nextProfile;
  const boxedArc = romProf.pokemonBox.find((b) => b.uid === arcInst.uid);
  if (boxedArc?.zone !== 'box' || boxedArc.hp !== 1 || boxedArc.status !== 'psn') {
    throw new Error(`Expected Box to preserve frozen 1 HP PSN without healing, got hp=${boxedArc?.hp} status=${boxedArc?.status}`);
  }
  const teachRest = updatePokemonInstanceBuild(romProf, arcInst.uid, {
    moves: ['Rest', 'Flare Blitz', 'Snarl', 'Protect'],
  });
  if (!teachRest.ok) throw new Error('Expected teaching Rest to boxed Arcanine to succeed!');
  romProf = teachRest.nextProfile;
  const unparkArc = movePokemonInstanceZone(romProf, arcInst.uid, 'party');
  if (!unparkArc.ok) throw new Error('Expected moving Arcanine back to party to succeed!');
  romProf = unparkArc.nextProfile;
  const ironmanInjected = buildIronmanPersistedStateForBattle(
    romProf,
    compileCustomTeamToShowdownPaste(romProf.customTeam, 100)
  );
  const injArc = ironmanInjected?.pokemon.find((p) => p.species === 'Arcanine');
  if (!injArc || injArc.hp !== 1 || injArc.status !== 'psn') {
    throw new Error(`Expected Ironman battle injection to preserve 1 HP PSN for Rest tech, got ${JSON.stringify(injArc)}`);
  }
  // Verify Camp Lum Berry cures Arcanine's PSN!
  const lumCure = campHealPartyMember(romProf, 'Arcanine', 'lum');
  if (!lumCure.ok || lumCure.nextProfile.pokemonBox.find((b) => b.uid === arcInst.uid)?.status !== '') {
    throw new Error('Expected Camp Lum Berry to cure Arcanine PSN cleanly!');
  }
  // Verify Rank 3 House Pokémon (Urshifu) can fill Gardevoir's empty party slot!
  const houseUrshifu = romProf.pokemonBox.find((b) => b.zone === 'house' && b.species === 'Urshifu');
  if (!houseUrshifu) throw new Error('Expected Urshifu in House PC!');
  const deployHouse = movePokemonInstanceZone(romProf, houseUrshifu.uid, 'party');
  if (!deployHouse.ok) throw new Error(`Expected House Urshifu to replace fallen Gardevoir: ${deployHouse.error}`);

  console.log(
    `  OK: Dark Atlas (9), 13 Romanceables + Harem Ending, Diablo Overrides (Bubble Beam->Water Spout + Choice Specs), Tag 2v2 (turns=${resTag.turn}), PC Boxes (Anti-Clone Stock + 1-HP PSN Box Rest Tech + Nuzlocke Graveyard + House Recruit) ALL VERIFIED!`
  );

  console.log('\n=== 23. PokéRogue Run Config (4 Dificultades), Unlocks por Capítulo (Regigigas Slow Start), X/Twitter Fatal Blow & Tres Caballeros ===');

  // 1) Verify all 4 difficulty tiers (baby -8, standard -4, kaizo 0, nightmare +4)
  if (DIFFICULTY_ORDER.length !== 4 || !DIFFICULTY_META.baby) {
    throw new Error(`Expected 4 difficulty modes including 'baby', got ${DIFFICULTY_ORDER.join(',')}`);
  }
  const babyRat = applyNpcRunModifiers(ratBaseCfg, 'baby', 'canonical');
  if (!babyRat.rivalShowdownPaste.includes('Level: 122')) {
    throw new Error(`Expected Baby Mode (-8 lvls) to scale Zoroark Lv.130 -> Lv.122!`);
  }

  // 2) Verify ALL 16 chapters have rewardPokemon & teamEditPolicy, and clearing Puzzle 02 unlocks Regigigas (Slow Start)!
  const chaptersSource = readFileSync(resolve('src/data/chapters.ts'), 'utf8');
  const editableMatches = chaptersSource.match(/teamEditPolicy:\s*'editable'/g) ?? [];
  const fixedMatches = chaptersSource.match(/teamEditPolicy:\s*'fixed'/g) ?? [];
  const expectedTotalChapters = Object.keys(CHAPTER_UNLOCK_RULES).length;
  if (
    editableMatches.length + fixedMatches.length !== expectedTotalChapters ||
    editableMatches.length < 4 ||
    fixedMatches.length < 8
  ) {
    throw new Error(
      `Expected all ${expectedTotalChapters} chapters split between editable & fixed teamEditPolicy, got editable=${editableMatches.length}, fixed=${fixedMatches.length}`
    );
  }
  for (const [cid, rule] of Object.entries(CHAPTER_UNLOCK_RULES)) {
    if (!rule.rewardPokemon?.species || !rule.rewardPokemon.moves.length) {
      throw new Error(`Chapter '${cid}' missing rewardPokemon spec!`);
    }
  }
  const regiRule = CHAPTER_UNLOCK_RULES['puzzle-02-regigigas'];
  if (regiRule.rewardPokemon.species !== 'Regigigas' || regiRule.rewardPokemon.ability !== 'Slow Start') {
    throw new Error(`Expected puzzle-02-regigigas to unlock hilarious Slow Start Regigigas!`);
  }

  let runProf = createNewConfiguredRunProfile({
    displayName: 'Luso',
    email: 'luso@galar.com',
    runName: 'Nuzlocke Tryhard Test',
    slotIndex: 2,
    vnPacingMode: 'decisions-only',
    defaultDifficulty: 'nightmare',
    ironmanMode: true,
    nuzlockePermadeath: true,
  });
  if (
    runProf.activeSaveSlot !== 2 ||
    runProf.vnPacingMode !== 'decisions-only' ||
    runProf.defaultDifficulty !== 'nightmare' ||
    !runProf.ironmanMode ||
    !runProf.nuzlockePermadeath
  ) {
    throw new Error('createNewConfiguredRunProfile failed to apply run settings!');
  }
  const regiClear = applyBattleOutcomeToProfile(runProf, 'puzzle-02-regigigas', true, 6);
  runProf = regiClear.nextProfile;
  const unlockedRegi = runProf.pokemonBox.find((m) => m.species === 'Regigigas');
  if (
    !unlockedRegi ||
    unlockedRegi.ability !== 'Slow Start' ||
    !regiClear.reward?.rewardPokemon?.some((p) => p.species === 'Regigigas')
  ) {
    throw new Error('Expected clearing puzzle-02-regigigas to add Slow Start Regigigas to pokemonBox & reward summary!');
  }

  // 3) Real @pkmn/sim forced defeat verifying BattleSnapshot.lastFatalBlow + X/Twitter share URL (both Nuzlocke Wipe & Regular non-Nuzlocke!)
  const fatalBlowSimCfg = {
    chapterId: 'test-fatal-blow',
    format: 'singles' as const,
    formatId: 'gen9customgame',
    formatLabel: 'Test 1v1 Fatal Blow',
    playerName: 'Príncipe',
    playerCharId: 'prince' as const,
    rivalName: 'Campeona de Galar',
    rivalCharId: 'champion' as const,
    rivalTitle: 'Prueba Fatal Blow',
    arenaTheme: 'wyndon-alleys' as const,
    playerTeamSummary: 'Magikarp Lv.5',
    rivalTeamSummary: 'Rayquaza-Mega Lv.100',
    playerShowdownPaste: `Magikarp\nAbility: Swift Swim\nLevel: 5\nEVs: 4 HP\nHardy Nature\n- Splash`,
    rivalShowdownPaste: `Rayquaza-Mega\nAbility: Delta Stream\nLevel: 100\nEVs: 252 Atk / 252 Spe\nJolly Nature\n- Dragon Ascent`,
    aiSystemPrompt: '',
    aiStyleSummary: '',
    rivalIntel: { visibleSpeciesCount: 1, threatLevel: 'Test', levelCap: 100, leadHint: '', tacticalWarning: '' },
    flags: {},
    traces: [],
  };
  const { finalSnap: fatalSnap } = await runFullSimMatch(
    'Fatal Blow Defeat Tracker',
    fatalBlowSimCfg,
    { maxTurns: 5 }
  );
  if (
    fatalSnap.winner !== 'p2' ||
    !fatalSnap.lastFatalBlow ||
    fatalSnap.lastFatalBlow.attackerSpecies !== 'Rayquaza-Mega' ||
    fatalSnap.lastFatalBlow.moveName !== 'Dragon Ascent' ||
    fatalSnap.lastFatalBlow.victimSpecies !== 'Magikarp'
  ) {
    throw new Error(`Expected lastFatalBlow Rayquaza-Mega/Dragon Ascent vs Magikarp, got ${JSON.stringify(fatalSnap.lastFatalBlow)}`);
  }

  const wipeSummary = buildRunDeathSummary({
    runName: 'Mi Nuzlocke Maldito',
    chapterId: 'ch1-wyndon-chase',
    chapterLabel: 'CAPÍTULO 01 · Sangre en los Callejones de Wyndon',
    turn: fatalSnap.turn,
    difficulty: 'nightmare',
    ironmanMode: true,
    nuzlockePermadeath: true,
    isTotalNuzlockeWipe: true,
    rivalName: fatalBlowSimCfg.rivalName,
    fatalBlow: fatalSnap.lastFatalBlow,
  });
  const regularDefeatSummary = buildRunDeathSummary({
    runName: 'Partida Chill',
    chapterId: 'ch1-wyndon-chase',
    chapterLabel: 'CAPÍTULO 01 · Sangre en los Callejones de Wyndon',
    turn: fatalSnap.turn,
    difficulty: 'baby',
    ironmanMode: false,
    nuzlockePermadeath: false,
    isTotalNuzlockeWipe: false,
    rivalName: fatalBlowSimCfg.rivalName,
    fatalBlow: fatalSnap.lastFatalBlow,
  });
  const wipeTweet = buildDefeatTweetText(wipeSummary);
  const regTweet = buildDefeatTweetText(regularDefeatSummary);
  const shareUrl = buildTwitterShareUrl(wipeTweet);
  if (
    !wipeTweet.includes('WIPE') && !wipeTweet.includes('NUZLOCKE MURIÓ') ||
    !wipeTweet.includes('Rayquaza-Mega') ||
    !wipeTweet.includes('Dragon Ascent') ||
    !regTweet.includes('Baby Mode') ||
    !shareUrl.startsWith('https://twitter.com/intent/tweet?text=')
  ) {
    throw new Error(`Unexpected Twitter share payload: wipe="${wipeTweet}", reg="${regTweet}"`);
  }

  // 4) Verify Three Knights split dialogue emits lines from Sir Caín, Sir Abel, and Sir Frey!
  const knightsSplitInk = readFileSync(resolve('src/stories/challenge2_three_knights.ink'), 'utf8');
  const knightsSplitRunner = new InkVNRunner(knightsSplitInk);
  let knightsSplitFrame = knightsSplitRunner.step();
  const seenSpeakers = new Set<string>();
  while (!knightsSplitFrame.isEnded) {
    if (knightsSplitFrame.currentLine?.speaker) seenSpeakers.add(knightsSplitFrame.currentLine.speaker);
    if (knightsSplitFrame.canContinue) knightsSplitFrame = knightsSplitRunner.step();
    else if (knightsSplitFrame.choices.length > 0) knightsSplitFrame = knightsSplitRunner.choose(0);
    else break;
  }
  if (knightsSplitFrame.currentLine?.speaker) seenSpeakers.add(knightsSplitFrame.currentLine.speaker);
  for (const requiredKnight of ['Sir Caín', 'Sir Abel', 'Sir Frey']) {
    if (!seenSpeakers.has(requiredKnight)) {
      throw new Error(`Expected Three Knights Ink dialogue to include speaker "${requiredKnight}", seen=[${Array.from(seenSpeakers).join(', ')}]`);
    }
  }
  console.log(
    `  OK: 4 Difficulties (Baby Lv.122..Tryhard Lv.134), 16 Chapter Pokémon Unlocks (Regigigas Slow Start!), FatalBlow (${fatalSnap.lastFatalBlow.attackerSpecies}·${fatalSnap.lastFatalBlow.moveName}) + X/Twitter Share, & Three Knights (Sir Caín, Sir Abel, Sir Frey) ALL VERIFIED!`
  );

  console.log('\n=== 24. Economía Smogon + BST + Impuesto Habilidades, Indemnización Nuzlocke, Pokédex Regional, Anti-Grind & Cap BST Imperial ===');
  // 1) Dynamic Smogon Tier + BST + Broken Ability Tax formula verification
  const cottoneePrice = computePokemonShopPricing('Cottonee', 'Prankster');
  const shedinjaPrice = computePokemonShopPricing('Shedinja', 'Wonder Guard');
  const smearglePrice = computePokemonShopPricing('Smeargle', 'Moody');
  const kingambitPrice = computePokemonShopPricing('Kingambit', 'Defiant');
  const miraidonPrice = computePokemonShopPricing('Miraidon', 'Hadron Engine');
  if (
    cottoneePrice.bst !== 280 ||
    cottoneePrice.abilityTax !== 200 ||
    cottoneePrice.finalPrice !== 312 ||
    shedinjaPrice.abilityTax !== 300 ||
    smearglePrice.abilityTax !== 300 ||
    kingambitPrice.tierBand !== 'OU' ||
    kingambitPrice.finalPrice !== 825 ||
    miraidonPrice.tierBand !== 'Uber / AG' ||
    miraidonPrice.finalPrice !== 1340
  ) {
    throw new Error(
      `Smogon pricing formula mismatch: Cottonee=${JSON.stringify(cottoneePrice)}, Kingambit=${JSON.stringify(kingambitPrice)}, Miraidon=${JSON.stringify(miraidonPrice)}`
    );
  }

  // 2) Casualty Indemnification (85% default / 95% with Mesoa R1) on Nuzlocke Victory + Re-purchase fallen species!
  const ind85 = computeCasualtyIndemnification(
    [
      { species: 'Arcanine', ability: 'Intimidate' },
      { species: 'Gardevoir', ability: 'Trace' },
      { species: 'Milotic', ability: 'Competitive' },
      { species: 'Rotom', ability: 'Levitate' },
    ],
    0.15
  );
  const ind95 = computeCasualtyIndemnification(
    [{ species: 'Arcanine', ability: 'Intimidate' }],
    0.05
  );
  if (ind85.totalPayout <= 0 || ind95.totalPayout <= Math.floor(ind85.entries[0].payout)) {
    throw new Error(`Expected casualty indemnification payout (85% -> 95% Mesoa R1), got 85%=${ind85.totalPayout}, 95%=${ind95.totalPayout}`);
  }

  let econProf = createNewConfiguredRunProfile({
    displayName: 'ExilioEcon',
    email: 'econ@galar.com',
    runName: 'Diablo Nuzlocke Economy',
    slotIndex: 3,
    vnPacingMode: 'skip-to-battle',
    defaultDifficulty: 'nightmare',
    ironmanMode: true,
    nuzlockePermadeath: true,
  });
  const ch1EconWin = applyBattleOutcomeToProfile(
    econProf,
    'ch1-wyndon-chase',
    true,
    9,
    undefined,
    {
      difficulty: 'nightmare',
      fallenInBattle: [
        { species: 'Arcanine', ability: 'Intimidate' },
        { species: 'Gardevoir', ability: 'Trace' },
      ],
    }
  );
  econProf = ch1EconWin.nextProfile;
  if (
    !ch1EconWin.reward?.casualtyIndemnificationCoins ||
    ch1EconWin.reward.casualtyIndemnificationCoins <= 0 ||
    !ch1EconWin.reward.unlockedPokedexSpecies ||
    ch1EconWin.reward.unlockedPokedexSpecies.length < 3
  ) {
    throw new Error(`Expected Ch1 Nuzlocke victory indemnification + 3-4 biogeographical Pokédex unlocks, got ${JSON.stringify(ch1EconWin.reward)}`);
  }

  // 3) Strict Anti-Grind Rule: replaying Ch1 on Ironman/Nuzlocke/Difícil/Tryhard yields 0 PC & 0 Pokédex rolls!
  const replayBlocked = applyBattleOutcomeToProfile(
    econProf,
    'ch1-wyndon-chase',
    true,
    5,
    undefined,
    { difficulty: 'nightmare' }
  );
  if (
    !replayBlocked.reward?.antiGrindBlocked ||
    replayBlocked.reward.coinsEarned !== 0 ||
    replayBlocked.reward.replayBonus !== 0 ||
    (replayBlocked.reward.unlockedPokedexSpecies?.length ?? 0) !== 0
  ) {
    throw new Error(`Expected Strict Anti-Grind to block replay coins & Pokédex rolls, got ${JSON.stringify(replayBlocked.reward)}`);
  }
  // Whereas replaying on Normal with Ironman/Nuzlocke OFF still grants small replay PC!
  let chillProf = createDefaultProfile('Chill', 'chill@galar.com');
  chillProf = toggleRunModifiers(chillProf, { defaultDifficulty: 'standard', ironmanMode: false, nuzlockePermadeath: false });
  chillProf = applyBattleOutcomeToProfile(chillProf, 'ch1-wyndon-chase', true, 8, undefined, { difficulty: 'standard' }).nextProfile;
  const chillReplay = applyBattleOutcomeToProfile(chillProf, 'ch1-wyndon-chase', true, 7, undefined, { difficulty: 'standard' });
  if (chillReplay.reward?.antiGrindBlocked || (chillReplay.reward?.replayBonus ?? 0) <= 0) {
    throw new Error(`Expected Normal non-Ironman replay to keep replayBonus, got ${JSON.stringify(chillReplay.reward)}`);
  }

  // 4) Biogeographical Fauna coverage across all 18 World Blocs (Drowzee/Munna in South America, Ninetales in Tohjo, Piloswine in Borelia!)
  for (const bloc of WORLD_BLOCS) {
    const pool = REGIONAL_FAUNA_POOLS[bloc.id];
    if (!pool || pool.length < 10) {
      throw new Error(`Expected >=10 regional fauna entries for bloc '${bloc.id}'`);
    }
  }
  if (
    !REGIONAL_FAUNA_POOLS.amazonia_veracruz.some((f) => f.species === 'Drowzee') ||
    !REGIONAL_FAUNA_POOLS.amazonia_veracruz.some((f) => f.species === 'Munna') ||
    !REGIONAL_FAUNA_POOLS.poke_japan.some((f) => f.species === 'Ninetales') ||
    !REGIONAL_FAUNA_POOLS.poke_canada.some((f) => f.species === 'Piloswine')
  ) {
    throw new Error('Missing canonical biogeographical species in regional fauna pools!');
  }

  // 5) Dynamic Difficulty-Linked Imperial BST Cap (Baby=∞, Normal=3000, Difícil=2850, Tryhard=2700 in Act 1!)
  const act1Baby = getImperialBstLicense(econProf, 'baby');
  const act1Normal = getImperialBstLicense(econProf, 'standard');
  const act1Hard = getImperialBstLicense(econProf, 'kaizo');
  const act1Tryhard = getImperialBstLicense(econProf, 'nightmare');
  if (
    act1Baby.maxTeamBst !== null ||
    act1Baby.isOverCap ||
    act1Normal.maxTeamBst !== 3000 ||
    !act1Normal.isOverCap ||
    act1Hard.maxTeamBst !== 2850 ||
    !act1Hard.isOverCap ||
    act1Tryhard.maxTeamBst !== 2700 ||
    !act1Tryhard.isOverCap
  ) {
    throw new Error(
      `Dynamic difficulty BST cap mismatch: baby=${act1Baby.maxTeamBst}, normal=${act1Normal.maxTeamBst}, hard=${act1Hard.maxTeamBst}, tryhard=${act1Tryhard.maxTeamBst}`
    );
  }
  // Buy cheap Cottonee (312 PC, 280 BST) and drop Arcanine + Milotic -> fits cleanly under Tryhard 2,700 BST!
  const buyCot = purchasePokemon(econProf, 'Cottonee');
  if (!buyCot.ok) throw new Error(`Expected Cottonee purchase (312 PC) to succeed: ${buyCot.error}`);
  econProf = buyCot.nextProfile;
  const miloticUid = econProf.pokemonBox.find((b) => b.zone === 'party' && b.species === 'Milotic')?.uid;
  const cotUid = econProf.pokemonBox.find((b) => b.species === 'Cottonee')?.uid;
  if (!miloticUid || !cotUid) throw new Error('Expected Milotic and purchased Cottonee in box!');
  econProf = movePokemonInstanceZone(econProf, miloticUid, 'box').nextProfile;
  econProf = movePokemonInstanceZone(econProf, cotUid, 'party').nextProfile;
  const arcUid24 = econProf.pokemonBox.find((b) => b.zone === 'party' && b.species === 'Arcanine')?.uid;
  if (arcUid24) econProf = movePokemonInstanceZone(econProf, arcUid24, 'box').nextProfile;
  const legalAct1Tryhard = getImperialBstLicense(econProf, 'nightmare');
  if (legalAct1Tryhard.isOverCap || legalAct1Tryhard.currentPartyBst > 2700) {
    throw new Error(`Expected adjusted Act 1 party with Cottonee (${computePokemonBst('Cottonee')} BST) to fit under Tryhard 2,700 BST, got ${JSON.stringify(legalAct1Tryhard)}`);
  }

  // 6) Dev Mode Anything Goes Full National Pokédex (~1,150+ species) + Specimen Spawner + Showdown Paste Playtest Importer!
  const agSpecies = getAllAnythingGoesPlayableSpecies();
  if (
    agSpecies.length < 1000 ||
    !agSpecies.includes('Rayquaza-Mega') ||
    !agSpecies.includes('Zacian-Crowned') ||
    !agSpecies.includes('Shedinja') ||
    !agSpecies.includes('Bidoof')
  ) {
    throw new Error(`Expected >=1,000 playable Anything Goes species including Rayquaza-Mega/Shedinja/Bidoof, got ${agSpecies.length}`);
  }
  let devAgProf = applyDevUnlockFullAgPokedex(createDefaultProfile('DevPlaytester', 'dev@galar.com'));
  if (!devAgProf.devFullAgPokedex || !devAgProf.devModeEnabled || getImperialBstLicense(devAgProf, 'nightmare').maxTeamBst !== null) {
    throw new Error('Expected applyDevUnlockFullAgPokedex to unlock full AG dex & unlimited BST cap!');
  }
  const spawnRay = spawnDevAgSpecimen(devAgProf, 'Rayquaza-Mega', 'box');
  if (!spawnRay.ok || !spawnRay.nextProfile.pokemonBox.some((m) => m.species === 'Rayquaza-Mega')) {
    throw new Error(`Expected Dev AG specimen spawn of Rayquaza-Mega to succeed: ${spawnRay.error}`);
  }
  devAgProf = spawnRay.nextProfile;
  const testImportPaste = `Flutter Mane @ Booster Energy\nAbility: Protosynthesis\nTera Type: Fairy\nTimid Nature\n- Moonblast\n- Shadow Ball\n- Icy Wind\n- Protect\n\nBidoof @ Focus Sash\nAbility: Moody\nTera Type: Normal\nJolly Nature\n- Quick Attack\n- Protect`;
  const impRes = importShowdownPasteToParty(devAgProf, testImportPaste);
  if (
    !impRes.ok ||
    impRes.importedCount !== 2 ||
    impRes.nextProfile.pokemonBox.filter((m) => m.zone === 'party').length !== 2 ||
    !compileCustomTeamToShowdownPaste(impRes.nextProfile.customTeam, 100).includes('Flutter Mane')
  ) {
    throw new Error(`Expected Showdown Playtest Paste import/export round-trip to succeed: ${JSON.stringify(impRes)}`);
  }

  console.log(
    `  OK: Smogon Pricing (Cottonee=312 PC, Kingambit=825 PC, Miraidon=1340 PC), Nuzlocke Indemnification (+${ch1EconWin.reward.casualtyIndemnificationCoins} PC), 18-Region Fauna Pokédex, Anti-Grind Lock, Dynamic Difficulty BST Cap (Baby=∞ / Normal=3000 / Difícil=2850 / Tryhard=2700 -> ${legalAct1Tryhard.currentPartyBst}/2700) & Dev AG Pokédex (${agSpecies.length} species + Showdown Import/Export) ALL VERIFIED!`
  );

  /* ===================== 25. Standardized NatDex Ecosystem (Mega + Z-Move + Tera + Lv.130), 3-Mode Loadouts & Dev Party Persistence ===================== */
  console.log('\n=== 25. Standardized NatDex Ecosystem (Mega + Z-Move + Tera + Lv.130), 3-Mode Loadouts & Dev Party Fix ===');

  // 1) Verify all 16 chapters in chapters.ts declare clean 3-mode `teamMode` ('campaign' | 'locked' | 'challenge') and NatDex standardization
  const chaptersSrc = readFileSync(
    resolve(process.cwd(), 'src/data/chapters.ts'),
    'utf-8'
  );
  const campaignMatches = chaptersSrc.match(/teamMode:\s*'campaign'/g) ?? [];
  const lockedMatches = chaptersSrc.match(/teamMode:\s*'locked'/g) ?? [];
  const challengeMatches = chaptersSrc.match(/teamMode:\s*'challenge'/g) ?? [];
  if (
    campaignMatches.length !== 13 ||
    lockedMatches.length !== 6 ||
    challengeMatches.length !== 5
  ) {
    throw new Error(
      `Expected 3-mode distribution 13 campaign / 6 locked / 5 challenge in chapters.ts, got campaign=${campaignMatches.length}, locked=${lockedMatches.length}, challenge=${challengeMatches.length}`
    );
  }
  if (
    chaptersSrc.includes("'gen9doublescustomgame'") ||
    chaptersSrc.includes("'gen9customgame'")
  ) {
    throw new Error('chapters.ts still contains legacy gen9doublescustomgame/gen9customgame instead of standardized NatDex!');
  }
  const ch1Std = resolveChapter1ChaseBattle({});
  const ch3Std = resolveClandestineTamerBattle({});
  const banquetStd = resolveChapter2BanquetBattle({});
  const minesStd = resolveMinesWave1Battle({});
  const sunStd = resolvePuzzle1SunTrapBattle({});
  const regiStd = resolvePuzzle2RegigigasBattle({});
  const lcStd = resolveChampionLittleCupBattle({});
  const tobiasStd = resolveAnimeAshVsTobiasBattle({});
  if (
    ch1Std.formatId !== CAMPAIGN_DOUBLES_FORMAT_ID ||
    banquetStd.formatId !== CAMPAIGN_DOUBLES_FORMAT_ID ||
    sunStd.formatId !== CAMPAIGN_DOUBLES_FORMAT_ID ||
    regiStd.formatId !== CAMPAIGN_DOUBLES_FORMAT_ID ||
    ch3Std.formatId !== CAMPAIGN_SINGLES_FORMAT_ID ||
    minesStd.formatId !== CAMPAIGN_SINGLES_FORMAT_ID ||
    lcStd.formatId !== CAMPAIGN_SINGLES_FORMAT_ID ||
    tobiasStd.formatId !== CAMPAIGN_SINGLES_FORMAT_ID
  ) {
    throw new Error('One or more non-specialty chapter resolvers did not migrate to standardized NatDex format!');
  }

  // 2) Verify Dev Mode team-saving fix: spawning Rayquaza-Mega into FULL 6/6 starter party MUST park Slot 6 in Box,
  //    put Rayquaza-Mega directly into Active Party, set useCustomTeamInStory=true, and survive serialize/normalize!
  let devSaveProf = applyDevUnlockFullAgPokedex(createDefaultProfile('DevRay', 'ray@galar.com'));
  const rayPartyRes = spawnDevAgSpecimen(devSaveProf, 'Rayquaza-Mega', 'party');
  if (
    !rayPartyRes.ok ||
    rayPartyRes.placedZone !== 'party' ||
    !rayPartyRes.swappedOutSpecies ||
    !rayPartyRes.nextProfile.useCustomTeamInStory ||
    !rayPartyRes.nextProfile.pokemonBox.some((m) => m.zone === 'party' && m.species === 'Rayquaza-Mega') ||
    !rayPartyRes.nextProfile.customTeam.some((m) => m.species === 'Rayquaza-Mega') ||
    !rayPartyRes.nextProfile.pokemonBox.some((m) => m.zone === 'box' && m.species === rayPartyRes.swappedOutSpecies)
  ) {
    throw new Error(`Dev Mode Rayquaza-Mega +Equipo auto-swap fix failed: ${JSON.stringify(rayPartyRes)}`);
  }
  const reloadedProf = normalizeProfile(JSON.parse(JSON.stringify(rayPartyRes.nextProfile)));
  const reloadedPaste = compileCustomTeamToShowdownPaste(reloadedProf.customTeam, 100);
  if (!reloadedProf.useCustomTeamInStory || !reloadedPaste.includes('Rayquaza-Mega')) {
    throw new Error('Reloaded profile lost Rayquaza-Mega or useCustomTeamInStory after JSON round-trip!');
  }

  // 3) Live ShowdownBattleController battle in CAMPAIGN_DOUBLES_FORMAT_ID verifying Mega + Tera + Z-Move + Lv.130 ALL coexist!
  const natDexTrifectaCfg: ReturnType<typeof resolveChapter1ChaseBattle> = {
    chapterId: 'test-natdex-trifecta',
    format: 'doubles',
    formatId: CAMPAIGN_DOUBLES_FORMAT_ID,
    formatLabel: 'NatDex Dobles · Todo Vale',
    playerName: 'Príncipe NatDex',
    playerCharId: 'prince',
    rivalName: 'Jefe Eternamax',
    rivalTitle: 'Prueba NatDex',
    rivalCharId: 'champion',
    arenaTheme: 'royal-training-ground',
    playerTeamSummary: 'Shedinja Tera + Charizard Mega-Y + Rayquaza-Mega Firium Z',
    rivalTeamSummary: 'Eternatus-Eternamax Nv.130 + Zoroark-Hisui Nv.130',
    playerShowdownPaste: `Shedinja @ Heavy-Duty Boots
Ability: Wonder Guard
Level: 100
Tera Type: Electric
EVs: 252 Atk / 252 Spe
Adamant Nature
- Poltergeist
- Shadow Sneak
- Protect
- Will-O-Wisp

Charizard @ Charizardite Y
Ability: Blaze
Level: 100
Tera Type: Fire
EVs: 4 HP / 252 SpA / 252 Spe
Timid Nature
- Flamethrower
- Solar Beam
- Air Slash
- Protect

Rayquaza-Mega @ Firium Z
Ability: Delta Stream
Level: 130
Tera Type: Normal
EVs: 4 HP / 252 Atk / 252 Spe
Jolly Nature
- Dragon Ascent
- V-create
- Extreme Speed
- Protect`,
    rivalShowdownPaste: `Eternatus-Eternamax @ Leftovers
Ability: Pressure
Level: 130
Tera Type: Poison
EVs: 252 HP / 252 Def / 4 SpD
Bold Nature
- Dynamax Cannon
- Recover
- Flamethrower
- Protect

Zoroark-Hisui @ Life Orb
Ability: Illusion
Level: 130
Tera Type: Ghost
EVs: 4 HP / 252 SpA / 252 Spe
Timid Nature
- Bitter Malice
- Hyper Voice
- Flamethrower
- Protect`,
    rivalIntel: {
      visibleSpeciesCount: 2,
      totalSlots: 2,
      intelLabel: 'NatDex Trifecta',
      intelNote: 'Mega + Tera + Z-Move + Lv.130',
      levelCap: 130,
      hasBossAce: true,
    },
    scriptedEnemyRules: [],
    traces: [],
    flags: {},
  };

  const trifectaResult = await new Promise<{
    sawTera: boolean;
    sawMegaY: boolean;
    sawZMoveSlot: boolean;
    sawZPowerLog: boolean;
  }>((resP, rejP) => {
    let settled = false;
    let lastTurnSent = -1;
    let sawTera = false;
    let sawMegaY = false;
    let sawZMoveSlot = false;
    let sawZPowerLog = false;
    const timer = setTimeout(() => {
      if (!settled) {
        settled = true;
        ctrl.destroy();
        rejP(new Error('NatDex Trifecta battle timed out!'));
      }
    }, 8000);
    const ctrl = new ShowdownBattleController(natDexTrifectaCfg, (snap) => {
      if (settled) return;
      if (snap.p1.active.some((m) => m?.terastallized === 'Electric')) sawTera = true;
      if (snap.p1.active.some((m) => m?.species === 'Charizard-Mega-Y')) sawMegaY = true;
      if (snap.log.some((l) => l.text.includes('Poder Z'))) sawZPowerLog = true;

      if (snap.status === 'ended' || (sawTera && sawMegaY && sawZMoveSlot && sawZPowerLog)) {
        settled = true;
        clearTimeout(timer);
        ctrl.destroy();
        resP({ sawTera, sawMegaY, sawZMoveSlot, sawZPowerLog });
        return;
      }

      if (snap.status === 'awaiting-choice' && snap.pendingSlots.length > 0) {
        if (snap.isForceSwitch) {
          const aliveBench = snap.p1.party.filter((p) => !p.active && !p.fainted);
          const cmds = snap.pendingSlots.map((s) =>
            s.pass || !s.forceSwitch
              ? 'pass'
              : aliveBench.length > 0
                ? `switch ${aliveBench.shift()!.slotIndex}`
                : 'pass'
          );
          void ctrl.submitPlayerChoice(cmds.join(', '));
          return;
        }
        if (snap.turn === lastTurnSent) return;
        lastTurnSent = snap.turn;

        if (snap.turn === 1) {
          // Verify Slot 0 Shedinja can Tera AND Slot 1 Charizard can Mega simultaneously!
          if (!snap.pendingSlots[0]?.canTerastallize || !snap.pendingSlots[1]?.canMegaEvo) {
            settled = true;
            clearTimeout(timer);
            ctrl.destroy();
            rejP(new Error(`Turn 1 expected Shedinja Tera + Charizard Mega, got ${JSON.stringify(snap.pendingSlots.map((s) => ({ sp: s.pokemon.species, mega: s.canMegaEvo, tera: s.canTerastallize })))}`));
            return;
          }
          void ctrl.submitPlayerChoice('move 3 terastallize, move 1 +1 mega');
        } else if (snap.turn === 2) {
          // Switch Slot 0 -> Rayquaza-Mega (slot 3)
          void ctrl.submitPlayerChoice('switch 3, move 4');
        } else if (snap.turn === 3) {
          // Verify Rayquaza-Mega exposes canZMove for V-create (index 1 -> move 2) and fire Z-Move!
          const raySlot = snap.pendingSlots.find((s) => s.pokemon.species === 'Rayquaza-Mega');
          const zIdx = raySlot?.canZMove?.findIndex((z) => z !== null) ?? -1;
          if (zIdx >= 0) sawZMoveSlot = true;
          const cmds = snap.pendingSlots.map((s) => {
            if (s.pass) return 'pass';
            if (s.pokemon.species === 'Rayquaza-Mega' && zIdx >= 0) {
              return `move ${zIdx + 1} +1 zmove`;
            }
            return 'move 4';
          });
          void ctrl.submitPlayerChoice(cmds.join(', '));
        } else {
          settled = true;
          clearTimeout(timer);
          ctrl.destroy();
          resP({ sawTera, sawMegaY, sawZMoveSlot, sawZPowerLog });
        }
      }
    });
    void ctrl.start().catch((err) => {
      if (!settled) {
        settled = true;
        clearTimeout(timer);
        rejP(err);
      }
    });
  });

  if (
    !trifectaResult.sawTera ||
    !trifectaResult.sawMegaY ||
    !trifectaResult.sawZMoveSlot ||
    !trifectaResult.sawZPowerLog
  ) {
    throw new Error(`NatDex Mega + Z-Move + Tera Trifecta verification failed: ${JSON.stringify(trifectaResult)}`);
  }

  console.log(
    `  OK: Standardized NatDex Custom (Mega-Charizard Y + Shedinja Tera Electric + Rayquaza-Mega Lv.130 Poder Z + Eternamax Lv.130 in ONE battle), 3-Mode Loadouts (5 Campaign / 6 Locked / 5 Challenge) & Dev Party Auto-Swap + Reload Persistence ALL VERIFIED!`
  );

  /* ===================== 26. Showdown Indexed Search, Full EV/IV/Gender/Nickname Editor, Release, Living Dex, Saved Teams & Nuzlocke Forensic Death Log ===================== */
  console.log('\n=== 26. Showdown Indexed Search, EV/IV/Gender/Nickname, Release, Living Dex, Saved Teams & Nuzlocke Death Log ===');

  // 1) Full Editor (Apodo, Sexo, EVs 508-cap, IVs 0..31, Level 100 stat calc & Showdown Paste round-trip!)
  let prof26 = createDefaultProfile('ShowdownPro', 'pro@galar.com');
  const arc26 = prof26.pokemonBox.find((m) => m.zone === 'party' && m.species === 'Arcanine');
  if (!arc26) throw new Error('Expected starter Arcanine in Suite 26!');
  const editBuildRes = updatePokemonInstanceBuild(prof26, arc26.uid, {
    nickname: 'Solarius',
    gender: 'M',
    nature: 'Adamant',
    evs: { hp: 252, atk: 252, def: 4, spa: 100, spd: 0, spe: 0 }, // 608 requested -> MUST clamp cleanly to 508!
    ivs: { hp: 31, atk: 31, def: 31, spa: 0, spd: 31, spe: 0 },
  });
  if (!editBuildRes.ok) throw new Error(`Expected EV/IV/Nickname/Gender build edit to succeed: ${editBuildRes.error}`);
  prof26 = editBuildRes.nextProfile;
  const editedArc = prof26.pokemonBox.find((m) => m.uid === arc26.uid)!;
  const sumEvs = Object.values(editedArc.evs ?? {}).reduce((a, b) => a + (b ?? 0), 0);
  if (
    editedArc.nickname !== 'Solarius' ||
    editedArc.gender !== 'M' ||
    sumEvs !== 508 ||
    editedArc.ivs?.spa !== 0 ||
    editedArc.ivs?.spe !== 0
  ) {
    throw new Error(`EV/IV/Nickname/Gender clamp mismatch: ${JSON.stringify(editedArc)}`);
  }
  const compiled26 = compileCustomTeamToShowdownPaste(prof26.customTeam, 100);
  if (
    !compiled26.includes('Solarius (Arcanine) (M)') ||
    !compiled26.includes('EVs: 252 HP / 252 Atk / 4 Def') ||
    !compiled26.includes('IVs: 0 SpA / 0 Spe')
  ) {
    throw new Error(`Expected compiled Showdown paste to include Nickname, Gender, EVs & IVs:\n${compiled26}`);
  }
  // Verify exact Level 100 stat calculation (252 HP / 252 Atk Adamant Arcanine: HP=384, Atk=350)
  const calcArc = calculatePokemonStats('Arcanine', 100, 'Adamant', editedArc.evs, editedArc.ivs);
  if (calcArc.hp !== 384 || calcArc.atk !== 350) {
    throw new Error(`Unexpected Level 100 stat calculation for Arcanine: ${JSON.stringify(calcArc)}`);
  }
  // Verify genderless species lock (Falinks -> fixedGender='N')
  if (getIndexedSpeciesMeta('Falinks').fixedGender !== 'N') {
    throw new Error('Expected Falinks fixedGender to be "N" (genderless)!');
  }

  // 2) Multiple Saved Campaign Teams Library (Save -> Modify -> Reload Team -> Delete!)
  const saveT1 = saveCurrentPartyAsTeam(prof26, 'Escuadra Solarius');
  if (!saveT1.ok || !saveT1.team || (saveT1.nextProfile.savedTeams?.length ?? 0) !== 1) {
    throw new Error('Expected saveCurrentPartyAsTeam to persist team!');
  }
  prof26 = saveT1.nextProfile;

  // 3) Release Pokémon (`releasePokemonInstance`) + guard against releasing last party member
  const rotom26 = prof26.pokemonBox.find((m) => m.zone === 'party' && m.species === 'Rotom');
  if (!rotom26) throw new Error('Expected Rotom in starter party!');
  const relRes = releasePokemonInstance(prof26, rotom26.uid);
  if (!relRes.ok || relRes.nextProfile.pokemonBox.some((m) => m.uid === rotom26.uid)) {
    throw new Error('Expected releasePokemonInstance to remove Rotom cleanly!');
  }
  prof26 = relRes.nextProfile;
  // Reload saved team in normal mode -> Rotom was released so missingSpecies=['Rotom'] & 5 loaded cleanly!
  const loadT1 = loadSavedCampaignTeam(prof26, saveT1.team.id);
  if (!loadT1.ok || loadT1.loadedCount !== 5 || !loadT1.missingSpecies.includes('Rotom')) {
    throw new Error(`Expected loadSavedCampaignTeam to report missing Rotom and load 5 alive: ${JSON.stringify(loadT1)}`);
  }
  // Reload saved team in Baby Mode (`allowSpawnMissing: true`) -> restores all 6 from saved Showdown paste!
  const loadT1Baby = loadSavedCampaignTeam(prof26, saveT1.team.id, { allowSpawnMissing: true });
  if (!loadT1Baby.ok || loadT1Baby.loadedCount !== 6 || !loadT1Baby.nextProfile.pokemonBox.some((m) => m.zone === 'party' && m.nickname === 'Solarius' && m.gender === 'M')) {
    throw new Error(`Expected Baby Mode team reload to restore all 6 with nickname/gender intact: ${JSON.stringify(loadT1Baby)}`);
  }
  prof26 = deleteSavedCampaignTeam(loadT1Baby.nextProfile, saveT1.team.id);
  if ((prof26.savedTeams?.length ?? 0) !== 0) {
    throw new Error('Expected deleteSavedCampaignTeam to remove saved team!');
  }

  // 4) Nuzlocke Forensic Death Log (`faintLog` -> `epitaph` + `nuzlockeDeathLog`!)
  let nuzProf = toggleRunModifiers(prof26, { nuzlockePermadeath: true, ironmanMode: true, defaultDifficulty: 'nightmare' });
  const fakeExport = {
    sourceBattleId: 'ch2-banquet-ambush',
    capturedAtTurn: 6,
    pokemon: [
      {
        species: 'Arcanine',
        name: 'Solarius',
        hp: 0,
        maxhp: 384,
        fainted: true,
        status: '' as const,
        moveSlots: [],
        ppByMoveId: {},
      },
    ],
  };
  nuzProf = recordPostBattleSurvivalState(nuzProf, fakeExport, false, {
    chapterId: 'ch2-banquet-ambush',
    chapterTitle: 'Emboscada en la Cena de Estado',
    rivalName: 'El Hombre Rata',
    turn: 6,
    difficulty: 'nightmare',
    faintLog: [
      {
        attackerSpecies: 'Zoroark-Hisui',
        moveName: 'Bitter Malice',
        victimSpecies: 'Arcanine',
        turn: 6,
        rivalName: 'El Hombre Rata',
      },
    ],
  });
  const fallenArc = nuzProf.pokemonBox.find((m) => m.zone === 'graveyard' && m.species === 'Arcanine');
  const deathEntry = nuzProf.nuzlockeDeathLog?.[0];
  if (
    !fallenArc?.epitaph ||
    fallenArc.epitaph.killerSpecies !== 'Zoroark-Hisui' ||
    fallenArc.epitaph.killerMove !== 'Bitter Malice' ||
    !deathEntry ||
    deathEntry.nickname !== 'Solarius' ||
    deathEntry.chapterTitle !== 'Emboscada en la Cena de Estado' ||
    deathEntry.turn !== 6
  ) {
    throw new Error(`Expected forensic Nuzlocke Death Log & Epitaph, got epitaph=${JSON.stringify(fallenArc?.epitaph)}, log=${JSON.stringify(deathEntry)}`);
  }
  // Nuzlocke memorial cannot be released outside Dev Mode!
  const blockedRel = releasePokemonInstance(nuzProf, fallenArc.uid);
  if (blockedRel.ok) {
    throw new Error('Expected Nuzlocke Graveyard memorial release to be blocked outside Dev Mode!');
  }

  // 5) Dev Living Dex (1 of EVERY playable species into Reserve Box) + Showdown-Style Indexed Search Engine!
  const ldexRes = applyDevPopulateAllSpeciesToBox(createDefaultProfile('LivingDexDev', 'ldex@galar.com'));
  if (ldexRes.addedCount < 1000 || ldexRes.totalLiving < 1200) {
    throw new Error(`Expected Living Dex to populate >=1200 living species in Box, got added=${ldexRes.addedCount}, total=${ldexRes.totalLiving}`);
  }
  const sugFigh = queryShowdownSuggestions('figh', []);
  if (!sugFigh.types.some((t) => t.name === 'Fighting')) {
    throw new Error(`Expected Showdown autocomplete for "figh" to suggest Type Fighting: ${JSON.stringify(sugFigh)}`);
  }
  const fastFighters = ldexRes.nextProfile.pokemonBox.filter((inst) =>
    matchesShowdownFilters(
      inst.species,
      'spe>=110',
      [
        { kind: 'type', value: 'Fighting', label: 'Tipo: Fighting' },
        { kind: 'move', value: 'Close Combat', label: 'Mov: Close Combat' },
      ],
      inst
    )
  );
  if (
    fastFighters.length === 0 ||
    !fastFighters.some((m) => m.species === 'Marshadow' || m.species === 'Koraidon' || m.species === 'Hawlucha' || m.species === 'Infernape')
  ) {
    throw new Error(`Expected Showdown indexed filter (Fighting + Close Combat + spe>=110) to find fast Fighters, got ${fastFighters.length}`);
  }

  // 6) Regression test: 1-Pokémon solo Showdown Paste (Falinks) launched directly into a 6v6 Doubles NatDex battle MUST auto-pad hidden Slot 2 & run cleanly!
  const soloFalinksCfg = {
    ...resolveChapter1ChaseBattle({}),
    playerShowdownPaste: `Falinks @ Assault Vest
Ability: Battle Armor
Level: 100
Tera Type: Fighting
EVs: 252 HP / 252 Atk / 4 SpD
Adamant Nature
- No Retreat
- Close Combat
- Megahorn
- First Impression`,
  };
  const { turn1Snap: soloT1 } = await runFullSimMatch(
    'Solo 1-Pokémon Falinks Paste in NatDex Doubles',
    soloFalinksCfg,
    { maxTurns: 6 }
  );
  if (
    !soloT1 ||
    soloT1.p1.active[0]?.species !== 'Falinks' ||
    !soloT1.emptyPlayerSlots?.includes(1)
  ) {
    throw new Error(`Expected solo 1-Pokémon Falinks Doubles auto-pad to succeed, got active0=${soloT1?.p1.active[0]?.species}, empty=${JSON.stringify(soloT1?.emptyPlayerSlots)}`);
  }

  // 7) Shop Showdown Tactical Strat Search: fastest Tailwind users under 1,000 PC & tankiest Def Wide Guard users!
  const allShopAg = getAllAnythingGoesPlayableSpecies();
  const fastBudgetTailwind = allShopAg
    .filter(
      (sp) =>
        getIndexedSpeciesMeta(sp).pricing.finalPrice <= 1000 &&
        matchesShowdownFilters(sp, '', [
          { kind: 'move', value: 'Tailwind', label: 'Mov: Tailwind' },
        ])
    )
    .sort((a, b) => compareByShowdownSort(a, b, 'spe'));
  const tankyWideGuard = allShopAg
    .filter((sp) =>
      matchesShowdownFilters(sp, '', [
        { kind: 'move', value: 'Wide Guard', label: 'Mov: Wide Guard' },
      ])
    )
    .sort((a, b) => compareByShowdownSort(a, b, 'def'));
  if (
    fastBudgetTailwind.length === 0 ||
    getIndexedSpeciesMeta(fastBudgetTailwind[0]).baseStats.spe < 120 ||
    tankyWideGuard.length === 0 ||
    getIndexedSpeciesMeta(tankyWideGuard[0]).baseStats.def < 150
  ) {
    throw new Error(
      `Shop Showdown strat filtering/sorting failed: fastestTailwind=${fastBudgetTailwind[0]}, tankiestWG=${tankyWideGuard[0]}`
    );
  }

  console.log(
    `  OK: Showdown Editor (Solarius M · 508-clamped EVs · IVs · L100 HP=384/Atk=350), Release Guard, Saved Teams Library, Nuzlocke Forensic Death Log, Dev Living Dex (+${ldexRes.addedCount} -> ${ldexRes.totalLiving}), Indexed Search (${fastFighters.length} Fighting+CC+Spe>=110), Shop Strats (Fast Tailwind <=1000 PC: ${fastBudgetTailwind[0]} Spe ${getIndexedSpeciesMeta(fastBudgetTailwind[0]).baseStats.spe}; Top Def Wide Guard: ${tankyWideGuard[0]} Def ${getIndexedSpeciesMeta(tankyWideGuard[0]).baseStats.def}) & Solo 1-Pokémon Doubles Paste (Falinks) ALL VERIFIED!`
  );

  console.log('\n=== 27. Baby Mode Auto-NatDex Fallback (Eternatus-Eternamax), Sello Cómico & 39 Capítulos Regionales Romanceables (18/18 Bloques) ===');

  // 1) Baby Mode automatic NatDex fallback on strict official formats (Monotype + VGC) with Eternatus-Eternamax!
  const eternamaxPaste = `Eternatus-Eternamax @ Leftovers
Ability: Pressure
Level: 100
Tera Type: Poison
EVs: 252 HP / 252 SpA / 4 Spe
Modest Nature
IVs: 0 Atk
- Dynamax Cannon
- Sludge Bomb
- Flamethrower
- Recover`;

  const ch2MonotypeBase = resolveChapter2MonotypeBattle({});
  // Outside Baby/Dev Mode: official format MUST stay strictly untouched!
  const untouchedMono = applyBabyOrDevNatDexFallback(ch2MonotypeBase, eternamaxPaste, {
    difficultyMode: 'kaizo',
    devModeEnabled: false,
  });
  if (untouchedMono.formatId !== 'gen9monotype' || untouchedMono.babyModeFormatFallback) {
    throw new Error(`Expected Monotype to remain untouched outside Baby/Dev Mode, got ${untouchedMono.formatId}`);
  }
  // Inside Baby Mode: automatically falls back to NatDex Custom AND runs live in @pkmn/sim!
  const babyMonoFallback = applyNpcRunModifiers(
    applyBabyOrDevNatDexFallback(
      { ...ch2MonotypeBase, playerShowdownPaste: eternamaxPaste },
      eternamaxPaste,
      { difficultyMode: 'baby', devModeEnabled: false }
    ),
    'baby',
    'canonical'
  );
  if (
    babyMonoFallback.formatId !== 'gen9customgame@@@NatDex Mod' ||
    !babyMonoFallback.babyModeFormatFallback ||
    babyMonoFallback.interactiveTeamPreview !== false
  ) {
    throw new Error(`Expected Baby Mode Monotype fallback to gen9customgame@@@NatDex Mod, got ${babyMonoFallback.formatId}`);
  }
  const { turn1Snap: etMonoT1, finalSnap: etMonoFinal } = await runFullSimMatch(
    'Baby Mode Auto-NatDex Fallback — Eternatus-Eternamax vs Monotype',
    babyMonoFallback,
    { maxTurns: 25 }
  );
  if (!etMonoT1 || etMonoT1.p1.active[0]?.species !== 'Eternatus-Eternamax') {
    throw new Error(`Expected Eternatus-Eternamax active T1 after Baby Mode Monotype fallback, got ${etMonoT1?.p1.active[0]?.species}`);
  }

  // Also test VGC 2024 Reg G fallback with Eternatus-Eternamax!
  const vgcBase = resolveVgcWorlds2024Battle({});
  const babyVgcFallback = applyBabyOrDevNatDexFallback(
    { ...vgcBase, playerShowdownPaste: eternamaxPaste },
    eternamaxPaste,
    { difficultyMode: 'baby', devModeEnabled: false }
  );
  if (
    babyVgcFallback.formatId !== 'gen9doublescustomgame@@@NatDex Mod' ||
    !babyVgcFallback.babyModeFormatFallback
  ) {
    throw new Error(`Expected Baby Mode VGC fallback to NatDex Doubles, got ${babyVgcFallback.formatId}`);
  }

  // 2) Baby Mode Comedic Stamp + Game Review snark!
  const act1Prof = createDefaultProfile('BabyTester', 'baby@galar.com');
  const uberSixPaste = [
    eternamaxPaste,
    'Rayquaza-Mega @ Life Orb\nAbility: Delta Stream\nLevel: 100\nJolly Nature\n- Dragon Ascent\n- Extreme Speed\n- V-create\n- Protect',
    'Arceus @ Silk Scarf\nAbility: Multitype\nLevel: 100\nAdamant Nature\n- Extreme Speed\n- Earthquake\n- Shadow Claw\n- Recover',
    'Miraidon @ Choice Specs\nAbility: Hadron Engine\nLevel: 100\nTimid Nature\n- Electro Drift\n- Draco Meteor\n- Dazzling Gleam\n- Volt Switch',
    'Koraidon @ Choice Scarf\nAbility: Orichalcum Pulse\nLevel: 100\nJolly Nature\n- Collision Course\n- Flare Blitz\n- Dragon Claw\n- U-turn',
    'Calyrex-Shadow @ Focus Sash\nAbility: As One (Spectrier)\nLevel: 100\nTimid Nature\n- Astral Barrage\n- Psychic\n- Draining Kiss\n- Protect',
  ].join('\n\n');
  const stampInter = evaluateBabyModeComedyStamp(
    { ...babyMonoFallback, playerShowdownPaste: uberSixPaste },
    act1Prof,
    true
  );
  const stampPowerAbuse = evaluateBabyModeComedyStamp(
    {
      ...resolveChapter1ChaseBattle({}),
      difficultyMode: 'baby',
      playerShowdownPaste: uberSixPaste,
    },
    act1Prof,
    true
  );
  const stampCozy = evaluateBabyModeComedyStamp(
    {
      ...resolveChapter1ChaseBattle({}),
      difficultyMode: 'baby',
      playerShowdownPaste: 'Pikachu @ Light Ball\nAbility: Static\nLevel: 100\nTimid Nature\n- Thunderbolt',
    },
    act1Prof,
    true
  );
  const stampNoneInKaizo = evaluateBabyModeComedyStamp(
    { ...resolveChapter1ChaseBattle({}), difficultyMode: 'kaizo' },
    act1Prof,
    true
  );
  if (
    stampInter?.tier !== 'interdimensional' ||
    !stampInter.badgeTitle.includes('BABY MODE') ||
    stampPowerAbuse?.tier !== 'power-abuse' ||
    stampPowerAbuse.overCapBy <= 1000 ||
    stampCozy?.tier !== 'cozy-win' ||
    stampNoneInKaizo !== null
  ) {
    throw new Error(
      `Baby Mode Comedy Stamp tiers failed: inter=${stampInter?.tier}, abuse=${stampPowerAbuse?.tier}/+${stampPowerAbuse?.overCapBy}, cozy=${stampCozy?.tier}, kaizo=${String(stampNoneInKaizo)}`
    );
  }
  const babyReview = await generatePostGameReview(
    etMonoFinal,
    babyMonoFallback,
    getDefaultAISettings()
  );
  if (!babyReview.summaryVerdict.includes('Baby Mode')) {
    throw new Error(`Expected Baby Mode comedy stamp inside Game Review verdict, got: ${babyReview.summaryVerdict}`);
  }

  // 3) ALL 13 Romanceables × 3 Chapters (R1 Duelo / R2 Amigos Tag 2v2 / R3 Revancha Cap Alta) = 39 Playable Chapters across ALL 18/18 World Blocs!
  if (Object.keys(REGIONAL_ROMANCE_BLUEPRINTS).length !== 13) {
    throw new Error(`Expected 13 regional romance blueprints, got ${Object.keys(REGIONAL_ROMANCE_BLUEPRINTS).length}`);
  }
  const coveredBlocs = new Set<string>();
  for (const loc of Object.values(CHAPTER_MAP_LOCATIONS)) {
    coveredBlocs.add(loc.blocId);
  }
  for (const bloc of WORLD_BLOCS) {
    if (!coveredBlocs.has(bloc.id)) {
      throw new Error(`World Bloc '${bloc.id}' (${bloc.name}) STILL has 0 mapped playable chapters!`);
    }
  }

  let validatedRomanceBattles = 0;
  for (const npc of ROMANCE_ROSTER) {
    if (!npc.playableNow || !npc.charId || npc.housePokemon.length !== 3) {
      throw new Error(`Expected romance NPC '${npc.id}' playable with charId & 3 housePokemon, got playable=${npc.playableNow}, house=${npc.housePokemon.length}`);
    }
    const r1Cfg = resolveRomanceEncounterDuel(npc.id);
    const r2Cfg = resolveRomanceTagBattle(npc.id);
    const r3Cfg = resolveRomanceRematchBattle(npc.id);
    for (const [rankIdx, cfg] of [r1Cfg, r2Cfg, r3Cfg].entries()) {
      const p1 = Teams.import(cfg.playerShowdownPaste);
      const p2 = Teams.import(cfg.rivalShowdownPaste);
      if (!p1?.length || !p2?.length) {
        throw new Error(`Invalid Showdown paste for romance ${npc.id} R${rankIdx + 1}`);
      }
      if (!CHAPTER_MAP_LOCATIONS[`romance-${npc.id}-r${rankIdx + 1}`]) {
        throw new Error(`Missing CHAPTER_MAP_LOCATIONS for romance-${npc.id}-r${rankIdx + 1}`);
      }
      validatedRomanceBattles++;
    }
    if (npc.id !== 'court_duelist') {
      const r3MaxLvl = Math.max(
        ...(Teams.import(r3Cfg.rivalShowdownPaste) ?? []).map((s) => s.level || 100)
      );
      if (r3MaxLvl < 106 || r3MaxLvl <= r1Cfg.rivalIntel.levelCap) {
        throw new Error(`Expected ${npc.id} R3 rematch max level (${r3MaxLvl}) >= 106 and > R1 cap (${r1Cfg.rivalIntel.levelCap})`);
      }
    }
  }

  // 4) Run live @pkmn/sim battles for new regional romance chapters & verify Boss Ace Rules!
  // 4a) Cordelia Astronomer R1 Encounter Duel + R3 Reloj de los Andes (Turn-0 Trick Room + burned Ursaluna ★ Nv. 108!)
  const cordR1 = resolveRomanceEncounterDuel('cordelia_astronomer');
  await runFullSimMatch('Romance R1 — El Astrónomo (Cordelia)', cordR1, { maxTurns: 35 });

  const cordR3 = resolveRomanceRematchBattle('cordelia_astronomer');
  const { turn1Snap: cordR3T1 } = await runFullSimMatch(
    'Romance R3 — Reloj de los Andes (Trick Room T0 + Burned Ursaluna Nv.108)',
    cordR3,
    { maxTurns: 35 }
  );
  const ursaActive = cordR3T1?.p2.active.find((m) => m?.species === 'Ursaluna');
  if (!cordR3T1?.trickRoomTurnsLeft || !ursaActive || ursaActive.status !== 'brn' || ursaActive.level !== 108) {
    throw new Error(
      `Expected Cordelia R3 Turn-0 Trick Room + Burned Ursaluna Lv.108, got TR=${cordR3T1?.trickRoomTurnsLeft}, ursa=${JSON.stringify(ursaActive)}`
    );
  }

  // 4b) Tierra de Kora (Amina R2 Tag 2v2) & Borelia (General Viktoria R2 Tag 2v2)
  const koraTag = resolveRomanceTagBattle('kemetia_keeper');
  const { turn1Snap: koraT1 } = await runFullSimMatch(
    'Romance R2 Tag 2v2 — Tierra de Kora (Amina)',
    koraTag,
    { maxTurns: 35 }
  );
  if (!koraT1?.p1.active[1]?.name.includes('[Aliada]')) {
    throw new Error(`Expected Amina [Aliada] in Slot 2 for Kora Tag 2v2!`);
  }
  const boreliaTag = resolveRomanceTagBattle('e4_ferrum');
  await runFullSimMatch('Romance R2 Tag 2v2 — Borelia (General Viktoria)', boreliaTag, {
    maxTurns: 35,
  });

  // 4c) Pokétopia Crupier R3 (Rain + Focus Energy Kingdra Nv. 108), Ranger R3 (Palafin-Hero Nv. 108), Veridia R3 (Mew Nv. 110 + Grassy Terrain), Kalos R3 (Gardevoir-Mega Nv. 110)
  const croupierR3 = resolveRomanceRematchBattle('poketopia_croupier');
  const { turn1Snap: croupierT1 } = await runFullSimMatch(
    'Romance R3 — Pokétopia Crupier (Kingdra Focus Energy + Rain)',
    croupierR3,
    { maxTurns: 35 }
  );
  if (!croupierT1?.weather.includes('Lluvia')) {
    throw new Error(`Expected Rain T0 in Pokétopia Crupier R3, got '${croupierT1?.weather}'`);
  }

  const rangerR3 = resolveRomanceRematchBattle('ranger_commander');
  const { turn1Snap: rangerT1 } = await runFullSimMatch(
    'Romance R3 — Comandante Ranger (Palafin-Hero Nv.108)',
    rangerR3,
    { maxTurns: 35 }
  );
  if (!rangerT1?.p2.active.some((m) => m?.species === 'Palafin-Hero')) {
    throw new Error(`Expected Palafin-Hero active T1 in Ranger R3!`);
  }

  const veridiaR3 = resolveRomanceRematchBattle('e4_veridia');
  const { turn1Snap: veridiaT1 } = await runFullSimMatch(
    'Romance R3 — Iara de Veridia (Mew Nv.110 + Grassy Terrain)',
    veridiaR3,
    { maxTurns: 35 }
  );
  if (!veridiaT1?.terrain.includes('Hierba') || !veridiaT1.p2.active.some((m) => m?.species === 'Mew')) {
    throw new Error(`Expected Grassy Terrain + Mew active T1 in Veridia R3!`);
  }

  const kalosR3 = resolveRomanceRematchBattle('e4_kalos');
  const { turn1Snap: kalosT1 } = await runFullSimMatch(
    'Romance R3 — Céline de Luminalia (Gardevoir-Mega Nv.110)',
    kalosR3,
    { maxTurns: 35 }
  );
  if (!kalosT1?.p2.active.some((m) => m?.species === 'Gardevoir-Mega')) {
    throw new Error(`Expected Gardevoir-Mega active T1 in Kalos R3!`);
  }

  console.log(
    `  OK: Baby Mode Auto-NatDex Fallback (Eternatus-Eternamax vs Monotype & VGC), Comedy Stamp (4 Tiers + Game Review), & ALL ${validatedRomanceBattles} Regional Romance Battles (13 NPCs × 3 Chapters covering ${coveredBlocs.size}/${WORLD_BLOCS.length} World Blocs incl. Cordelia TR+Burned Ursaluna, Kora, Borelia, Pokétopia Sniper, Ranger Palafin-Hero, Veridia Mew & Kalos Mega-Gardevoir) ALL VERIFIED!`
  );

  console.log(
    '\n=== 28. Zero-Duplicate 13 Aces & 13 R3 Legendaries, Persistent Biome Field Effects (Gravity/MagicRoom/WonderRoom) & Ancestral Rival Naming ==='
  );
  // 1) Programmatically verify ZERO duplicate Signature Aces & ZERO duplicate species across ALL 13 NPCs (R1 & R3)!
  const seenAces = new Map<string, string>();
  const speciesOwner = new Map<string, { npcId: string; rank: string }>();
  const expectedR3Legendaries: Record<string, string> = {
    assassin: 'Darkrai',
    court_duelist: 'Iron Crown',
    champion: 'Kyogre',
    cordelia_astronomer: 'Cresselia',
    mesoa_boss: 'Moltres-Galar',
    poketopia_croupier: 'Suicune',
    ranger_commander: 'Zapdos',
    aeos_geneticist: 'Tapu Koko',
    kemetia_keeper: 'Landorus-Therian',
    e4_ransei: 'Chien-Pao',
    e4_ferrum: 'Articuno',
    e4_veridia: 'Mew',
    e4_kalos: 'Latios',
  };

  for (const npc of ROMANCE_ROSTER) {
    const ace = npc.bossAceRule?.aceSpecies;
    if (!ace) {
      throw new Error(`Missing bossAceRule.aceSpecies on NPC '${npc.id}'`);
    }
    const aceBase = Dex.species.get(ace).baseSpecies || ace;
    if (seenAces.has(aceBase)) {
      throw new Error(
        `DUPLICATE ACE detected: '${ace}' (${aceBase}) shared between '${seenAces.get(aceBase)}' and '${npc.id}'!`
      );
    }
    seenAces.set(aceBase, npc.id);

    const r1Cfg = resolveRomanceEncounterDuel(npc.id);
    const r2Cfg = resolveRomanceTagBattle(npc.id);
    const r3Cfg = resolveRomanceRematchBattle(npc.id);

    // Every single romance chapter (R1, R2, R3) must declare a Turn-0 Biome label & counter hint!
    for (const [label, cfg] of [
      ['R1', r1Cfg],
      ['R2', r2Cfg],
      ['R3', r3Cfg],
    ] as const) {
      if (!cfg.puzzleConditions?.biomeLabel || !cfg.puzzleConditions?.biomeCounterHint) {
        throw new Error(
          `Missing biomeLabel / biomeCounterHint on ${npc.id} ${label}!`
        );
      }
    }

    const r1Sets = Teams.import(r1Cfg.rivalShowdownPaste) ?? [];
    const r3Sets = Teams.import(r3Cfg.rivalShowdownPaste) ?? [];

    for (const [rankLabel, sets] of [
      ['R1', r1Sets],
      ['R3', r3Sets],
    ] as const) {
      for (const s of sets) {
        const spObj = Dex.species.get(s.species);
        const baseKey = spObj.baseSpecies || s.species;
        const existing = speciesOwner.get(baseKey);
        if (existing && existing.npcId !== npc.id) {
          throw new Error(
            `DUPLICATE ROSTER SPECIES across NPCs: '${s.species}' (base '${baseKey}') used by BOTH '${existing.npcId}' (${existing.rank}) AND '${npc.id}' (${rankLabel})!`
          );
        }
        speciesOwner.set(baseKey, { npcId: npc.id, rank: rankLabel });
      }
    }

    const reqLeg = expectedR3Legendaries[npc.id];
    if (!r3Sets.some((s) => s.species === reqLeg)) {
      throw new Error(
        `Expected R3 Legendary '${reqLeg}' in ${npc.id} R3 rematch, got [${r3Sets.map((s) => s.species).join(', ')}]`
      );
    }
  }
  if (seenAces.size !== 13) {
    throw new Error(`Expected 13 unique Signature Aces, got ${seenAces.size}`);
  }

  // Verify special signature item showcase: Pikachu @ Light Ball on aeos_geneticist!
  const aeosR1Sets = Teams.import(resolveRomanceEncounterDuel('aeos_geneticist').rivalShowdownPaste) ?? [];
  const aeosR3Sets = Teams.import(resolveRomanceRematchBattle('aeos_geneticist').rivalShowdownPaste) ?? [];
  if (
    !aeosR1Sets.some((s) => s.species === 'Pikachu' && s.item === 'Light Ball') ||
    !aeosR3Sets.some((s) => s.species === 'Pikachu' && s.item === 'Light Ball')
  ) {
    throw new Error('Expected Pikachu @ Light Ball in aeos_geneticist R1 & R3!');
  }

  // 2) Run live @pkmn/sim battles verifying Turn-0 Persistent Biome Pseudo-Weathers & Extended Weather!
  const mesoaR1 = resolveRomanceEncounterDuel('mesoa_boss');
  const { turn1Snap: mesoaT1 } = await runFullSimMatch(
    'Biome Pseudo-Weather — Mesoa R1 (Magic Room 5t)',
    mesoaR1,
    { maxTurns: 30 }
  );
  const magicPw = mesoaT1?.activePseudoWeathers?.find((p) => p.id === 'magicroom');
  if (!magicPw || magicPw.turnsLeft !== 5) {
    throw new Error(`Expected Magic Room (5t) on Mesoa R1 T1, got ${JSON.stringify(mesoaT1?.activePseudoWeathers)}`);
  }

  const pokeR1 = resolveRomanceEncounterDuel('poketopia_croupier');
  const { turn1Snap: pokeT1 } = await runFullSimMatch(
    'Biome Pseudo-Weather — Pokétopia R1 (Wonder Room 99t)',
    pokeR1,
    { maxTurns: 30 }
  );
  const wonderPw = pokeT1?.activePseudoWeathers?.find((p) => p.id === 'wonderroom');
  if (!wonderPw || (wonderPw.turnsLeft ?? 0) < 90) {
    throw new Error(`Expected persistent Wonder Room (99t) on Pokétopia R1 T1, got ${JSON.stringify(pokeT1?.activePseudoWeathers)}`);
  }

  const ranseiR1 = resolveRomanceEncounterDuel('e4_ransei');
  const { turn1Snap: ranseiT1 } = await runFullSimMatch(
    'Biome Pseudo-Weather — Ransei R1 (Gravity 99t + Gallade-Mega)',
    ranseiR1,
    { maxTurns: 30 }
  );
  const gravPw = ranseiT1?.activePseudoWeathers?.find((p) => p.id === 'gravity');
  if (!gravPw || (gravPw.turnsLeft ?? 0) < 90) {
    throw new Error(`Expected persistent Gravity (99t) on Ransei R1 T1, got ${JSON.stringify(ranseiT1?.activePseudoWeathers)}`);
  }

  const ferrumR3 = resolveRomanceRematchBattle('e4_ferrum');
  const { turn1Snap: ferrumT1 } = await runFullSimMatch(
    'Biome Extended Snow + Articuno + Metagross-Mega — Ferrum R3',
    ferrumR3,
    { maxTurns: 30 }
  );
  if (
    !ferrumT1?.weather.includes('Nieve') ||
    (ferrumT1.weatherTurnsLeft ?? 0) < 90 ||
    !ferrumR3.rivalShowdownPaste.includes('Articuno') ||
    !ferrumR3.rivalShowdownPaste.includes('Metagross-Mega')
  ) {
    throw new Error(
      `Expected persistent Snow (99t) + Articuno + Metagross-Mega on Ferrum R3, got wx=${ferrumT1?.weather} (${ferrumT1?.weatherTurnsLeft}t)`
    );
  }

  const assassinR3Diablo = applyNpcRunModifiers(
    resolveRomanceRematchBattle('assassin'),
    'nightmare',
    'canonical'
  );
  await runFullSimMatch(
    'Rival R3 Diablo — Darkrai + Absol-Mega',
    assassinR3Diablo,
    { maxTurns: 30 }
  );
  if (
    !assassinR3Diablo.rivalShowdownPaste.includes('Darkrai') ||
    !assassinR3Diablo.rivalShowdownPaste.includes('Absol-Mega')
  ) {
    throw new Error('Expected Darkrai + Absol-Mega in Assassin R3 Diablo rematch!');
  }

  // 3) Ancestral Pokémon Privilege: Custom Rival Naming ("Locke" default + Gary/Mr. Tutorial/Edgelord/Dickfart presets + dynamic Ink/Battle/Tag substitution)
  if (
    DEFAULT_RIVAL_NAME !== 'Locke' ||
    RIVAL_NAME_PRESETS.length < 8 ||
    !RIVAL_NAME_PRESETS.some((p) => p.name === 'Gary') ||
    !RIVAL_NAME_PRESETS.some((p) => p.name === 'Dickfart')
  ) {
    throw new Error(`RIVAL_NAME_PRESETS validation failed: default=${DEFAULT_RIVAL_NAME}, count=${RIVAL_NAME_PRESETS.length}`);
  }
  let rivalProf = createNewConfiguredRunProfile({
    displayName: 'Príncipe',
    email: 'prince@galar.com',
    runName: 'Run Gary',
    rivalName: 'Dickfart',
    slotIndex: 2,
    vnPacingMode: 'full',
    defaultDifficulty: 'kaizo',
    ironmanMode: false,
    nuzlockePermadeath: false,
  });
  rivalProf = normalizeProfile(rivalProf);
  if (getRivalName(rivalProf) !== 'Dickfart') {
    throw new Error(`Expected persisted rivalName='Dickfart', got '${getRivalName(rivalProf)}'`);
  }
  const ch1RawInk = readFileSync(
    resolve(process.cwd(), 'src/stories/chapter1_chase.ink'),
    'utf-8'
  );
  const mockCh1: ChapterDefinition = {
    id: 'ch1-wyndon-chase',
    number: 'CAPÍTULO 01',
    category: 'story',
    title: 'Persecución contra El Asesino Carmesí',
    subtitle: 'Prólogo',
    description: 'El Pelirrojo te acorrala en Wyndon.',
    formatLabel: 'Dobles',
    difficulty: 'Normal',
    accentColor: 'amber',
    showcaseSprite: { species: 'Absol-Mega', mode: 'boss' },
    rivalPreview: 'El Asesino Carmesí',
    rivalProfile: {
      charId: 'assassin',
      name: 'El Asesino Carmesí',
      title: 'Cazador del Consejo',
      bio: 'El Pelirrojo no perdona.',
      tacticalInsight: 'Vigila al Pelirrojo.',
    },
    inkSource: ch1RawInk,
    resolveBattleConfig: resolveChapter1ChaseBattle,
    getEpilogue: () => ({
      headline: 'Choque con El Pelirrojo',
      subheadline: 'Asesino Carmesí en retirada',
      badgeText: 'FIN',
      paragraphs: ['El Pelirrojo escapó entre la niebla.'],
    }),
  };
  const ch1Custom = applyRivalNameToChapter(mockCh1, getRivalName(rivalProf));
  if (
    !ch1Custom.inkSource.includes('Dickfart') ||
    ch1Custom.inkSource.includes('Asesino Carmesí') ||
    ch1Custom.inkSource.includes('El Pelirrojo') ||
    !ch1Custom.title.includes('Dickfart')
  ) {
    throw new Error('Expected applyRivalNameToChapter to substitute rival name cleanly in Ch1 Ink source & metadata!');
  }
  // Compile & step the personalized Ch1 Ink script via InkVNRunner to prove zero syntax corruption!
  const customInkRunner = new InkVNRunner(ch1Custom.inkSource);
  let foundCustomInInk = false;
  let inkStep = customInkRunner.step();
  for (let i = 0; i < 60 && !inkStep.isEnded; i++) {
    const lineText = inkStep.currentLine?.text ?? '';
    const lineSpeaker = inkStep.currentLine?.speaker ?? '';
    if (lineText.includes('Dickfart') || lineSpeaker.includes('Dickfart')) {
      foundCustomInInk = true;
      break;
    }
    inkStep = inkStep.canContinue
      ? customInkRunner.step()
      : inkStep.choices.length > 0
        ? customInkRunner.choose(0)
        : inkStep;
  }
  if (!foundCustomInInk) {
    throw new Error('Expected personalized rivalName "Dickfart" to appear live inside InkVNRunner dialogue/speaker!');
  }
  const ch1CustomCfg = ch1Custom.resolveBattleConfig({});
  if (ch1CustomCfg.rivalName !== 'Dickfart') {
    throw new Error(`Expected Ch1 resolved battle rivalName='Dickfart', got '${ch1CustomCfg.rivalName}'`);
  }
  rivalProf = setCustomRivalName(rivalProf, 'Gary');
  const tagRenamed = applyRivalNameToBattleConfig(
    resolveRomanceTagBattle('assassin'),
    getRivalName(rivalProf)
  );
  if (tagRenamed.playerName !== 'Príncipe + Gary') {
    throw new Error(`Expected Tag 2v2 playerName='Príncipe + Gary', got '${tagRenamed.playerName}'`);
  }
  const unrelatedFerrum: ChapterDefinition = {
    ...mockCh1,
    id: 'romance-e4_ferrum-r1',
    title: 'General Viktoria — Glaciar Ferrum',
    description: 'Nieve eterna.',
    rivalPreview: 'General Viktoria',
    inkSource: 'Viktoria te espera en el glaciar.\n-> END',
  };
  const unrelatedCheck = applyRivalNameToChapter(unrelatedFerrum, 'Gary');
  if (unrelatedCheck !== unrelatedFerrum) {
    throw new Error('Expected unrelated chapters to remain unmodified by applyRivalNameToChapter!');
  }

  console.log(
    `  OK: 13/13 Unique Aces, ZERO duplicate species across ${speciesOwner.size} distinct regional Pokémon (all 13 NPCs R1+R3), 13/13 Unique R3 Legendaries, Pikachu @ Light Ball, persistent Turn-0 Biomes (MagicRoom=${magicPw.turnsLeft}t, WonderRoom=${wonderPw.turnsLeft}t, Gravity=${gravPw.turnsLeft}t, Snow=${ferrumT1.weatherTurnsLeft}t), & Ancestral Rival Naming (default='${DEFAULT_RIVAL_NAME}', 'Dickfart'->Ink/Battle, 'Gary'->Tag 2v2) ALL VERIFIED!`
  );

  console.log(
    '\n=== 29. 4-Act Campaign Escalation -> Bastard Brother Climax (Zamazenta + Eternamax) -> Postgame Champion, Hidden Visibility & Confession Endings ==='
  );
  // 1) Run live @pkmn/sim matches for ALL 7 new escalation battles including Bastard Brother Climax & Postgame Champion!
  const orreCfg = resolveOrreShadowAmbushBattle({});
  const { turn1Snap: orreT1 } = await runFullSimMatch(
    'Act II — Orre Shadow Ambush (Shadow Sky 99t + Shadow Pokémon)',
    orreCfg,
    { maxTurns: 30 }
  );
  if (
    !orreT1?.weather.includes('Cielo Oscuro') ||
    (orreT1.weatherTurnsLeft ?? 0) < 90 ||
    !orreT1.p2.active.some((m) => m?.isShadow)
  ) {
    throw new Error(
      `Expected persistent Cielo Oscuro + Shadow Pokémon on Orre Act II, got wx=${orreT1?.weather} (${orreT1?.weatherTurnsLeft}t)`
    );
  }

  const tamraCfg = resolveTamraCruViceroyBattle({});
  const { turn1Snap: tamraT1 } = await runFullSimMatch(
    'Act III — Tamra CRU Viceroy (Hazards T0 + Copperajah ★ Lv.102)',
    tamraCfg,
    { maxTurns: 30 }
  );
  if (!tamraT1?.p1.sideConditions.some((c) => c.toLowerCase().includes('stealth'))) {
    throw new Error(`Expected Turn-0 Stealth Rock on player side in Tamra Viceroy, got [${tamraT1?.p1.sideConditions.join(', ')}]`);
  }

  const aeosSiteCfg = resolveAeosDittoBlackSiteBattle({});
  const { turn1Snap: aeosT1 } = await runFullSimMatch(
    'Act III — Isla Æos Ditto Black Site (Electric Terrain 99t + Imposter Ditto Lv.115)',
    aeosSiteCfg,
    { maxTurns: 30 }
  );
  if (
    !aeosT1?.terrain.includes('Eléctrico') ||
    !aeosSiteCfg.rivalShowdownPaste.includes('Level: 115')
  ) {
    throw new Error(`Expected Electric Terrain + Lv.115 Imposter Ditto in Isla Æos Black Site!`);
  }

  const tohjoTrialCfg = resolveTohjoShentaiTrialBattle({});
  const { turn1Snap: tohjoT1 } = await runFullSimMatch(
    'Act IV — Tohjo/Shentai Free Powers Trial (Gravity 99t + OU/Uber)',
    tohjoTrialCfg,
    { maxTurns: 30 }
  );
  if (!tohjoT1?.activePseudoWeathers?.some((p) => p.id === 'gravity' && (p.turnsLeft ?? 0) >= 90)) {
    throw new Error(`Expected persistent Gravity (99t) on Act IV Tohjo/Shentai Trial!`);
  }

  const councilCfg = resolvePoketopiaTraitorCouncilBattle({});
  const { turn1Snap: councilT1 } = await runFullSimMatch(
    'Act IV — Pokétopia Traitor Council (Trick Room + Wonder Room + Miraidon/Calyrex-Ice)',
    councilCfg,
    { maxTurns: 30 }
  );
  if (
    !councilT1?.trickRoomTurnsLeft ||
    !councilT1.activePseudoWeathers?.some((p) => p.id === 'wonderroom')
  ) {
    throw new Error(`Expected Trick Room + Wonder Room on Act IV Traitor Council!`);
  }

  const climaxCfg = resolveBastardBrotherClimaxBattle({});
  const { turn1Snap: climaxT1 } = await runFullSimMatch(
    'CLIMAX — Bastard Brother (Zamazenta-Crowned Lv.112 + Eternatus-Eternamax ★ Lv.115 + Dual Screens)',
    climaxCfg,
    { maxTurns: 35 }
  );
  if (
    !climaxCfg.rivalShowdownPaste.includes('Zamazenta-Crowned') ||
    !climaxCfg.rivalShowdownPaste.includes('Eternatus-Eternamax') ||
    !climaxT1?.p2.sideConditions.some((c) => c.toLowerCase().includes('reflect')) ||
    !climaxT1?.p2.sideConditions.some((c) => c.toLowerCase().includes('light screen')) ||
    !climaxT1?.p1.sideConditions.some((c) => c.toLowerCase().includes('stealth'))
  ) {
    throw new Error(
      `Bastard Brother Climax failed: p2Conds=[${climaxT1?.p2.sideConditions.join(', ')}], p1Conds=[${climaxT1?.p1.sideConditions.join(', ')}]`
    );
  }

  const postgameCfg = resolvePostgameChampionBattle({});
  const { turn1Snap: pgT1 } = await runFullSimMatch(
    'POSTGAME — Champion Anything Goes (Kyogre/Xerneas/Zacian-C/Calyrex-S/Arceus/Mega-Rayquaza ★ Lv.120)',
    postgameCfg,
    { maxTurns: 35 }
  );
  if (
    !pgT1?.weather.includes('Lluvia') ||
    !pgT1?.p2.sideConditions.some((c) => c.toLowerCase().includes('tailwind')) ||
    !postgameCfg.rivalShowdownPaste.includes('Rayquaza-Mega') ||
    !postgameCfg.rivalShowdownPaste.includes('Level: 120')
  ) {
    throw new Error(`Postgame Champion AG failed: wx=${pgT1?.weather}, p2Conds=[${pgT1?.p2.sideConditions.join(', ')}]`);
  }

  // 2) Hidden Visibility (`hideWhenLocked`, Regional Social Link gating, Postgame lock, & Dev Mode override) + 4-Act BST Ladder!
  let campProf = createDefaultProfile('Exiliado', 'exile@galar.com');
  if (
    !isChapterVisible(campProf, 'ch1-wyndon-chase') ||
    !isChapterVisible(campProf, 'ch2-monotype-banners') ||
    isChapterVisible(campProf, 'ch4-orre-shadow-ambush') ||
    isChapterVisible(campProf, 'ch12-bastard-brother-climax') ||
    isChapterVisible(campProf, 'ch13-postgame-champion')
  ) {
    throw new Error('Initial Act I hideWhenLocked visibility rules mismatch!');
  }
  // Main 3 SLs visible at R1; ALL 10 regional SLs HIDDEN initially!
  if (
    !isRomanceNpcVisible(campProf, 'assassin') ||
    !isRomanceNpcVisible(campProf, 'court_duelist') ||
    !isRomanceNpcVisible(campProf, 'champion') ||
    isRomanceNpcVisible(campProf, 'mesoa_boss') ||
    isRomanceNpcVisible(campProf, 'cordelia_astronomer') ||
    isRomanceNpcVisible(campProf, 'kemetia_keeper') ||
    isRomanceNpcVisible(campProf, 'aeos_geneticist') ||
    isRomanceNpcVisible(campProf, 'e4_kalos') ||
    isChapterVisible(campProf, 'romance-assassin-r2')
  ) {
    throw new Error('Initial Regional Social Link visibility gating mismatch!');
  }
  // Dev Mode MUST make EVERY hidden chapter, Postgame, and ALL 13 Social Links visible immediately!
  const devVisProf = { ...campProf, devModeEnabled: true };
  if (
    !isChapterVisible(devVisProf, 'ch12-bastard-brother-climax') ||
    !isChapterVisible(devVisProf, 'ch13-postgame-champion') ||
    !isRomanceNpcVisible(devVisProf, 'e4_veridia') ||
    !isChapterVisible(devVisProf, 'romance-e4_veridia-r3')
  ) {
    throw new Error('Dev Mode visibility bypass failed!');
  }

  // Step through Acts I -> II -> III -> IV -> Climax -> Postgame verifying Tryhard BST Caps & Regional SL Discovery!
  if (getImperialBstLicense(campProf, 'nightmare').maxTeamBst !== 2700) {
    throw new Error('Expected Act I Tryhard BST Cap = 2700!');
  }
  campProf = applyBattleOutcomeToProfile(campProf, 'showcase-triples-phalanx', true, 8, undefined, { difficulty: 'kaizo' }).nextProfile;
  if (getImperialBstLicense(campProf, 'nightmare').maxTeamBst !== 3000) {
    throw new Error(`Expected Act II Tryhard BST Cap = 3000, got ${getImperialBstLicense(campProf, 'nightmare').maxTeamBst}`);
  }
  const mesoaClear = applyBattleOutcomeToProfile(campProf, 'ch3-clandestine-tamer', true, 10, undefined, { difficulty: 'kaizo' });
  campProf = mesoaClear.nextProfile;
  if (!isRomanceNpcVisible(campProf, 'mesoa_boss')) {
    throw new Error('Expected Mesoa Boss SL to become visible upon clearing Mesoa story chapter!');
  }
  const orreClear = applyBattleOutcomeToProfile(campProf, 'ch4-orre-shadow-ambush', true, 11, undefined, { difficulty: 'kaizo' });
  campProf = orreClear.nextProfile;
  if (
    !isRomanceNpcVisible(campProf, 'cordelia_astronomer') ||
    !orreClear.reward?.newlyUnlockedSocialLinks?.some((s) => s.npcId === 'cordelia_astronomer')
  ) {
    throw new Error('Expected Cordelia Astronomer SL notification + visibility upon clearing Orre!');
  }
  campProf = applyBattleOutcomeToProfile(campProf, 'challenge-three-knights', true, 9, undefined, { difficulty: 'kaizo' }).nextProfile;
  if (getImperialBstLicense(campProf, 'nightmare').maxTeamBst !== 3300) {
    throw new Error(`Expected Act III Tryhard BST Cap = 3300, got ${getImperialBstLicense(campProf, 'nightmare').maxTeamBst}`);
  }
  campProf = applyBattleOutcomeToProfile(campProf, 'ch9-aeos-ditto-blacksite', true, 12, undefined, { difficulty: 'kaizo' }).nextProfile;
  if (
    getImperialBstLicense(campProf, 'nightmare').maxTeamBst !== 3600 ||
    !isRomanceNpcVisible(campProf, 'aeos_geneticist') ||
    !isRomanceNpcVisible(campProf, 'poketopia_croupier')
  ) {
    throw new Error('Expected Act IV Tryhard BST Cap = 3600 + Isla Æos / Pokétopia SLs unlocked!');
  }
  campProf = applyBattleOutcomeToProfile(campProf, 'ch10-tohjo-shentai-trial', true, 12, undefined, { difficulty: 'kaizo' }).nextProfile;
  if (
    !isRomanceNpcVisible(campProf, 'e4_ransei') ||
    !isRomanceNpcVisible(campProf, 'e4_ferrum') ||
    !isRomanceNpcVisible(campProf, 'e4_veridia') ||
    !isRomanceNpcVisible(campProf, 'e4_kalos')
  ) {
    throw new Error('Expected all 4 Late-Game Alto Mando SLs visible after Act IV Tohjo/Shentai Trial!');
  }
  campProf = applyBattleOutcomeToProfile(campProf, 'ch11-poketopia-traitor-council', true, 14, undefined, { difficulty: 'kaizo' }).nextProfile;
  if (
    getImperialBstLicense(campProf, 'nightmare').maxTeamBst !== null ||
    !isChapterVisible(campProf, 'ch12-bastard-brother-climax') ||
    isChapterVisible(campProf, 'ch13-postgame-champion')
  ) {
    throw new Error('Expected Climax unlocked with unlimited BST Cap while Postgame remains hidden before beating Bastard Brother!');
  }
  campProf = applyBattleOutcomeToProfile(campProf, 'ch12-bastard-brother-climax', true, 18, undefined, { difficulty: 'kaizo' }).nextProfile;
  if (!campProf.mainStoryCleared || !isChapterVisible(campProf, 'ch13-postgame-champion')) {
    throw new Error('Expected Postgame Optional Champion (Ch13) to reveal ONLY after defeating Bastard Brother Climax!');
  }
  campProf = applyBattleOutcomeToProfile(campProf, 'ch13-postgame-champion', true, 20, undefined, { difficulty: 'kaizo' }).nextProfile;
  if (!campProf.masteryBadgeUnlocked || !campProf.newGamePlusUnlocked) {
    throw new Error('Expected Postgame Champion clear to grant True Mastery Badge & New Game+!');
  }
  const ngpProf = createNewConfiguredRunProfile({
    displayName: campProf.displayName,
    email: campProf.email,
    runName: 'NG+ Run',
    rivalName: 'Locke',
    slotIndex: 3,
    vnPacingMode: 'full',
    defaultDifficulty: 'nightmare',
    ironmanMode: true,
    nuzlockePermadeath: true,
    newGamePlusFrom: campProf,
  });
  if (!ngpProf.masteryBadgeUnlocked || (ngpProf.newGamePlusCount ?? 0) !== 1) {
    throw new Error('Expected New Game+ profile to carry over True Mastery Badge and increment newGamePlusCount!');
  }

  // 3) Post-R3 Confession vs Platonic System + resolveEnding() (SOLO_MONARCH -> ROMANCE_e4_kalos -> HAREM -> BABY_ENDING)!
  let endProf = createDefaultProfile('Príncipe', 'prince@galar.com');
  // Max early-game Assassin & Duelist to R3, pick PLATONIC for both -> keeps all 6 House Pokémon, heart stays FREE!
  endProf = completeRomanceRank(endProf, 'assassin', 3);
  endProf = completeRomanceRank(endProf, 'court_duelist', 3);
  endProf = recordRomanceConfession(endProf, 'assassin', 'platonic').nextProfile;
  endProf = recordRomanceConfession(endProf, 'court_duelist', 'platonic').nextProfile;
  if (
    endProf.firstConfessionNpcId !== null ||
    endProf.pokemonBox.filter((b) => b.zone === 'house').length !== 6 ||
    resolveEnding(endProf).type !== 'SOLO_MONARCH_ENDING'
  ) {
    throw new Error(`Expected Platonic R3 early-game allies to grant 6 House Pokémon while keeping SOLO_MONARCH_ENDING!`);
  }
  // Now save FIRST confession for Late-Game Alto Mando (`e4_kalos`), then confess to `champion` too -> Ending stays `ROMANCE_e4_kalos`!
  endProf = completeRomanceRank(endProf, 'e4_kalos', 3);
  const firstConf = recordRomanceConfession(endProf, 'e4_kalos', 'confess');
  endProf = firstConf.nextProfile;
  endProf = completeRomanceRank(endProf, 'champion', 3);
  const secondConf = recordRomanceConfession(endProf, 'champion', 'confess');
  endProf = secondConf.nextProfile;
  if (
    !firstConf.isFirstConfession ||
    secondConf.isFirstConfession ||
    endProf.firstConfessionNpcId !== 'e4_kalos' ||
    (endProf.confessedNpcIds?.length ?? 0) !== 2 ||
    resolveEnding(endProf).type !== 'ROMANCE_e4_kalos'
  ) {
    throw new Error(`Expected FIRST confession ('e4_kalos') to lock ROMANCE_e4_kalos even after secondary confession!`);
  }
  // Confess to ALL 13 romanceables -> HAREM_ENDING!
  let haremProf = endProf;
  for (const npc of ROMANCE_ROSTER) {
    haremProf = completeRomanceRank(haremProf, npc.id, 3);
    haremProf = recordRomanceConfession(haremProf, npc.id, 'confess').nextProfile;
  }
  if (resolveEnding(haremProf).type !== 'HAREM_ENDING') {
    throw new Error(`Expected 13/13 confessions to trigger HAREM_ENDING, got ${resolveEnding(haremProf).type}`);
  }
  // Baby Mode win -> isBabyShamed === true -> Humiliating Rejection on confess + BABY_ENDING!
  const babyWinProf = applyBattleOutcomeToProfile(
    createDefaultProfile('Bebe', 'baby@galar.com'),
    'ch1-wyndon-chase',
    true,
    5,
    undefined,
    { difficulty: 'baby' }
  ).nextProfile;
  const babyReject = recordRomanceConfession(
    completeRomanceRank(babyWinProf, 'assassin', 3),
    'assassin',
    'confess'
  );
  if (
    !isBabyShamed(babyWinProf) ||
    babyReject.outcome !== 'rejected_baby' ||
    resolveEnding(babyReject.nextProfile).type !== 'BABY_ENDING'
  ) {
    throw new Error(`Expected Baby Mode shame rejection & BABY_ENDING, got outcome=${babyReject.outcome}, ending=${resolveEnding(babyReject.nextProfile).type}`);
  }

  console.log(
    `  OK: 4-Act Campaign Ladder (2700->3000->3300->3600->∞ BST), ALL 7 New Escalation Battles incl. Bastard Brother Climax (Zamazenta-C Lv.112 + Eternatus-Eternamax ★ Lv.115) & Postgame Champion AG (Lv.120 + Mastery Badge + NG+), Hidden Visibility + Regional SL Discovery + Dev Mode Override, & Confession Endings (SOLO_MONARCH / ROMANCE_e4_kalos / HAREM 13/13 / BABY_ENDING) ALL VERIFIED!`
  );

  /* ===================== 30. Shadow Pokémon (Colosseum/XD 24 Moves + Fairy 0x + Shadow Sky + Hyper Mode + XD001) & Power of Friendship ===================== */
  console.log(
    '\n=== 30. Shadow Pokémon (24 Moves, Fairy 0× Immunity, Shadow Sky, Hyper Mode, XD001 Lugia) & Power of Friendship (Let\'s Go Affection) ==='
  );

  // 1) Verify all 24 modernized & invented Shadow Moves exist natively in Dex with type === 'Shadow'
  ensureShadowDexRegistered();
  if (SHADOW_MOVES_CATALOG.length !== 24) {
    throw new Error(`Expected 24 Shadow Moves in catalog, got ${SHADOW_MOVES_CATALOG.length}`);
  }
  for (const sm of SHADOW_MOVES_CATALOG) {
    const dexMv = Dex.moves.get(sm.name);
    if (!dexMv.exists || dexMv.type !== 'Shadow') {
      throw new Error(`Shadow move "${sm.name}" missing or wrong type in Dex (${dexMv.type})`);
    }
  }
  const aeroDex = Dex.moves.get('Shadow Aeroblast');
  const eclDex = Dex.moves.get('Shadow Eclipse');
  if (
    aeroDex.basePower !== 115 ||
    aeroDex.target !== 'allAdjacentFoes' ||
    (aeroDex.critRatio ?? 1) < 2 ||
    eclDex.boosts?.spa !== 2 ||
    eclDex.boosts?.spd !== 2 ||
    eclDex.boosts?.spe !== 1
  ) {
    throw new Error(`XD001 signature Shadow moves misconfigured: Aeroblast=${JSON.stringify(aeroDex.basePower)}/${aeroDex.target}, Eclipse=${JSON.stringify(eclDex.boosts)}`);
  }
  const lugiaShadowLearnset = getLegalLearnsetForSpecies('Lugia', CAMPAIGN_DOUBLES_FORMAT_ID, [], true);
  if (!lugiaShadowLearnset.some((m) => m.name === 'Shadow Aeroblast') || !lugiaShadowLearnset.some((m) => m.name === 'Shadow Eclipse')) {
    throw new Error('Expected Shadow Pokémon learnset to expose all 24 Shadow Moves!');
  }

  // 2) Live @pkmn/sim deterministic test proving:
  //    - Shadow Aeroblast: 0× IMMUNE vs Fairy (Gardevoir), 2× SUPER EFFECTIVE vs non-Shadow (Arcanine), 0.5× RESISTED vs Shadow (Mewtwo Oscuro)
  //    - Power of Friendship (tactical-limited): High-Bond Arcanine endures lethal Shadow Aeroblast at 1 HP & shakes off Burn!
  //    - Shadow Eclipse: +2 SpA / +2 SpD / +1 Spe in one turn!
  //    - Hyper Mode: Shadow Lugia drops <50% HP -> activates 'Modo Hiper' + takes 1/8 residual self-damage!
  //    - Shadow Pokémon & non-High-Bond Shop Pokémon NEVER trigger Tactical Affection!
  const shadowMatrixCfg: ReturnType<typeof resolveChapter1ChaseBattle> = {
    chapterId: 'test-shadow-affection-matrix',
    format: 'doubles',
    formatId: CAMPAIGN_DOUBLES_FORMAT_ID,
    formatLabel: 'Shadow & Affection Matrix',
    playerName: 'Heredero',
    playerCharId: 'prince',
    rivalName: 'Maestro Cifra',
    rivalTitle: 'Prueba XD001',
    rivalCharId: 'dark_commander',
    arenaTheme: 'titan-sanctum',
    playerTeamSummary: 'Gardevoir (Hada) + Arcanine (High-Bond) + Mewtwo Oscuro',
    rivalTeamSummary: 'XD001 Lugia Oscuro + Salamence Oscuro',
    playerShowdownPaste: `Gardevoir @ Leftovers
Ability: Trace
Level: 100
EVs: 252 HP / 252 SpA / 4 Spe
Modest Nature
- Shadow Ball
- Moonblast
- Protect
- Calm Mind

Arcanine @ Oran Berry
Ability: Flash Fire
Level: 12
EVs: 4 HP
Hardy Nature
- Protect
- Tackle
- Growl
- Helping Hand

Mewtwo Oscuro (Mewtwo) @ Leftovers
Ability: Pressure
Level: 100
EVs: 252 HP / 252 SpA / 4 Spe
Timid Nature
- Shadow Blast
- Shadow Siphon
- Shadow Eclipse
- Protect`,
    rivalShowdownPaste: `XD001 Lugia Oscuro (Lugia) @ Leftovers
Ability: Pressure
Level: 100
EVs: 4 HP / 252 SpA / 252 Spe
Timid Nature
- Shadow Aeroblast
- Shadow Eclipse
- Shadow Sky
- Shadow Siphon

Salamence Oscuro (Salamence) @ Leftovers
Ability: Intimidate
Level: 100
EVs: 252 HP / 252 SpD / 4 Spe
Calm Nature
- Shadow Wave
- Shadow Mist
- Protect
- Draco Meteor`,
    puzzleConditions: {
      weather: 'shadowsky',
      extendedEnvironment: true,
      pokemonModifiers: [
        { side: 'p1', slotOrSpecies: 'Arcanine', status: 'par' },
        { side: 'p2', slotOrSpecies: 'Lugia', hpPercent: 35 },
      ],
    },
    shadowMeta: {
      p1ShadowSpecies: ['Mewtwo'],
      p2ShadowSpecies: ['Lugia', 'Salamence'],
      affectionMode: 'tactical-limited',
      p1HighBondSpecies: ['Gardevoir', 'Arcanine'],
    },
    rivalIntel: {
      visibleSpeciesCount: 2,
      totalSlots: 2,
      intelLabel: 'Shadow Matrix',
      intelNote: 'Test',
      levelCap: 100,
      hasBossAce: true,
    },
    scriptedEnemyRules: [
      {
        id: 't1-lugia-aeroblast',
        turn: 1,
        actorSpecies: 'Lugia',
        forceMoveId: 'shadowaeroblast',
        once: true,
        description: 'T1 Lugia Shadow Aeroblast',
      },
      {
        id: 't1-mence-protect',
        turn: 1,
        actorSpecies: 'Salamence',
        forceMoveId: 'protect',
        once: true,
        description: 'T1 Salamence Protect',
      },
      {
        id: 't2-lugia-eclipse',
        turn: 2,
        actorSpecies: 'Lugia',
        forceMoveId: 'shadoweclipse',
        once: true,
        description: 'T2 Lugia Shadow Eclipse',
      },
      {
        id: 't2-mence-wave',
        turn: 2,
        actorSpecies: 'Salamence',
        forceMoveId: 'shadowwave',
        once: true,
        description: 'T2 Salamence Shadow Wave vs Shadow Mewtwo',
      },
    ],
    traces: [],
    flags: {},
  };

  const matrixResult = await new Promise<{
    logs: string[];
    weather: string;
    lugiaHyper: boolean;
    lugiaBoosts: Record<string, number>;
  }>((resP, rejP) => {
    let settled = false;
    let lastTurn = -1;
    const timer = setTimeout(() => {
      if (!settled) {
        settled = true;
        ctrl.destroy();
        rejP(new Error('Suite 30 Shadow Matrix battle timed out!'));
      }
    }, 8000);
    const ctrl = new ShowdownBattleController(shadowMatrixCfg, (snap) => {
      if (settled) return;
      if (snap.status === 'ended' || snap.turn >= 3) {
        settled = true;
        clearTimeout(timer);
        const lugiaMon =
          snap.p2.active.find((m) => m?.species === 'Lugia') ??
          snap.p2.party.find((m) => m.species === 'Lugia');
        ctrl.destroy();
        resP({
          logs: snap.log.map((l) => l.text),
          weather: snap.weather,
          lugiaHyper: Boolean(lugiaMon?.hyperMode),
          lugiaBoosts: { ...(lugiaMon?.boosts ?? {}) },
        });
        return;
      }
      if (snap.status === 'awaiting-choice' && snap.pendingSlots.length > 0) {
        if (snap.isForceSwitch) {
          const bench = snap.p1.party.filter((p) => !p.active && !p.fainted);
          const cmds = snap.pendingSlots.map((s) =>
            s.pass || !s.forceSwitch ? 'pass' : bench.length ? `switch ${bench.shift()!.slotIndex}` : 'pass'
          );
          void ctrl.submitPlayerChoice(cmds.join(', '));
          return;
        }
        if (snap.turn === lastTurn) return;
        lastTurn = snap.turn;
        if (snap.turn === 1) {
          // Gardevoir Calm Mind, Arcanine Growl (so it eats Shadow Aeroblast -> 1 HP Endure + Burn cure!)
          void ctrl.submitPlayerChoice('move 4, move 3');
        } else if (snap.turn === 2) {
          // Switch Arcanine -> Shadow Mewtwo (slot 3) to verify 0.5× Shadow resist vs Shadow Wave + Lugia Shadow Eclipse!
          const m2Slot = snap.p1.party.find((p) => p.species === 'Mewtwo')?.slotIndex ?? 3;
          void ctrl.submitPlayerChoice(`move 3, switch ${m2Slot}`);
        }
      }
    });
    void ctrl.start().catch((err) => {
      if (!settled) {
        settled = true;
        clearTimeout(timer);
        rejP(err);
      }
    });
  });

  const allMatrixText = matrixResult.logs.join('\n');
  if (
    !matrixResult.weather.includes('Cielo Oscuro') ||
    !allMatrixText.includes('No afecta a Gardevoir') ||
    !allMatrixText.includes('¡Es súper eficaz!') ||
    !allMatrixText.includes('VÍNCULO REAL') ||
    !allMatrixText.includes('aguantó con 1 PS') ||
    !allMatrixText.includes('se sacudió PAR') ||
    !allMatrixText.includes('MODO HIPER') ||
    !matrixResult.lugiaHyper ||
    !allMatrixText.includes('No es muy eficaz') ||
    (matrixResult.lugiaBoosts.spa ?? 0) < 2 ||
    (matrixResult.lugiaBoosts.spd ?? 0) < 2 ||
    (matrixResult.lugiaBoosts.spe ?? 0) < 1
  ) {
    throw new Error(
      `Suite 30 Shadow & Affection live matrix failed!\nweather=${matrixResult.weather}, hyper=${matrixResult.lugiaHyper}, boosts=${JSON.stringify(matrixResult.lugiaBoosts)}\nlogs:\n${allMatrixText}`
    );
  }

  // 3) Verify Affection is STRICTLY BLOCKED on Shadow Pokémon AND on non-High-Bond Shop Pokémon in `tactical-limited`!
  const blockedAffCfg: ReturnType<typeof resolveChapter1ChaseBattle> = {
    ...shadowMatrixCfg,
    chapterId: 'test-affection-blocked-shadow',
    format: 'singles',
    formatId: CAMPAIGN_SINGLES_FORMAT_ID,
    playerShowdownPaste: `Sableye Oscuro (Sableye)
Ability: Keen Eye
Level: 5
Hardy Nature
- Shadow Rush`,
    rivalShowdownPaste: `Rayquaza-Mega
Ability: Delta Stream
Level: 100
EVs: 252 Atk / 252 Spe
Jolly Nature
- Dragon Ascent`,
    puzzleConditions: undefined,
    shadowMeta: {
      p1ShadowSpecies: ['Sableye'],
      p2ShadowSpecies: [],
      affectionMode: 'classic-rng',
      affectionForceProc: true, // even with forced 100% RNG roll, Shadow Pokémon MUST NOT endure!
      p1HighBondSpecies: ['Sableye'],
    },
    scriptedEnemyRules: [],
  };
  const { finalSnap: blockedShadowSnap } = await runFullSimMatch(
    'Affection Strictly Blocked on Shadow Pokémon',
    blockedAffCfg,
    { maxTurns: 5 }
  );
  if (
    blockedShadowSnap.winner !== 'p2' ||
    blockedShadowSnap.log.some((l) => l.text.includes('aguantó'))
  ) {
    throw new Error('Expected Shadow Pokémon to NEVER activate Power of Friendship endure!');
  }

  // 4) Run full live XD001 Shadow Lugia Boss Raid chapter (`challenge-xd001-shadow-lugia`)!
  const xd001Cfg = resolveXd001ShadowLugiaBattle({});
  const { turn1Snap: xd001T1 } = await runFullSimMatch(
    'RAID AURA — Proyecto XD001: Lugia Oscuro (6 Shadow Pokémon + Cielo Oscuro)',
    xd001Cfg,
    { maxTurns: 30 }
  );
  if (
    !xd001T1?.weather.includes('Cielo Oscuro') ||
    !xd001T1.p2.active.some((m) => m?.isShadow) ||
    detectShadowSpeciesInPaste(xd001Cfg.rivalShowdownPaste).length !== 6
  ) {
    throw new Error(`XD001 Shadow Lugia raid failed: wx=${xd001T1?.weather}`);
  }

  // 5) Verify Auto Shadow Snagging -> Pokédex + PC Box, Multi-Slot Purification Chamber, Optional Keep-Shadow vs Purify (Psycho Boost + High Bond)!
  let shProf = createDefaultProfile('Purificador', 'aura@orre.com');
  const xdWin = applyBattleOutcomeToProfile(
    shProf,
    'challenge-xd001-shadow-lugia',
    true,
    14,
    undefined,
    {
      difficulty: 'kaizo',
      rivalShowdownPaste: xd001Cfg.rivalShowdownPaste,
    }
  );
  shProf = xdWin.nextProfile;
  const snaggedLugia = shProf.pokemonBox.find((b) => b.species === 'Lugia' && b.isShadow);
  const snaggedArticuno = shProf.pokemonBox.find((b) => b.species === 'Articuno' && b.isShadow);
  const snaggedZapdos = shProf.pokemonBox.find((b) => b.species === 'Zapdos' && b.isShadow);
  if (
    !xdWin.reward?.snaggedShadowPokemon ||
    xdWin.reward.snaggedShadowPokemon.length !== 6 ||
    !snaggedLugia ||
    !snaggedArticuno ||
    !snaggedZapdos ||
    !snaggedLugia.moves.includes('Shadow Aeroblast') ||
    !snaggedLugia.moves.includes('Shadow Eclipse') ||
    !shProf.unlockedPokedex.includes('Lugia') ||
    isInstanceHighBond(snaggedLugia)
  ) {
    throw new Error(`Shadow Snagging on XD001 victory failed: snagged=${xdWin.reward?.snaggedShadowPokemon?.length}`);
  }

  // Reject placing non-Shadow Arcanine into Purification Chamber
  const nonShadowArc = shProf.pokemonBox.find((b) => b.species === 'Arcanine')!;
  if (movePokemonInstanceZone(shProf, nonShadowArc.uid, 'purify').ok) {
    throw new Error('Expected Purification Chamber to reject non-Shadow Pokémon!');
  }

  // Park 3 Shadow Pokémon simultaneously into Purification Chamber (`zone: 'purify'`)!
  shProf = movePokemonInstanceZone(shProf, snaggedLugia.uid, 'purify').nextProfile;
  shProf = movePokemonInstanceZone(shProf, snaggedArticuno.uid, 'purify').nextProfile;
  shProf = movePokemonInstanceZone(shProf, snaggedZapdos.uid, 'purify').nextProfile;
  if (shProf.pokemonBox.filter((b) => b.zone === 'purify').length !== 3) {
    throw new Error('Expected multi-slot Purification Chamber to hold 3 Shadow Pokémon simultaneously!');
  }

  // Tick 5 battles -> Heart Gauge drops 100 -> 80 -> 60 -> 40 -> 20 -> 0 WITHOUT auto-purifying!
  for (let i = 0; i < 5; i++) {
    shProf = recordPostBattleSurvivalState(shProf, null, true);
  }
  const readyLugia = shProf.pokemonBox.find((b) => b.uid === snaggedLugia.uid)!;
  const readyArticuno = shProf.pokemonBox.find((b) => b.uid === snaggedArticuno.uid)!;
  if (
    readyLugia.heartGauge !== 0 ||
    !readyLugia.isShadow || // MUST stay Shadow until player explicitly chooses to Purify!
    readyArticuno.heartGauge !== 0 ||
    !readyArticuno.isShadow
  ) {
    throw new Error(`Expected passive Purification Chamber to reach 0% without forcing purification: Lugia=${JSON.stringify(readyLugia)}`);
  }

  // Purify Articuno (gains High Bond + Heal Bell) while deliberately KEEPING XD001 Lugia Oscuro Shadow forever!
  const purifyArt = purifyShadowPokemonInstance(shProf, snaggedArticuno.uid);
  if (!purifyArt.ok) throw new Error(`Expected Articuno purification at 0% to succeed: ${purifyArt.error}`);
  shProf = purifyArt.nextProfile;
  const purifiedArt = shProf.pokemonBox.find((b) => b.uid === snaggedArticuno.uid)!;
  const keptDarkLugia = shProf.pokemonBox.find((b) => b.uid === snaggedLugia.uid)!;
  if (
    purifiedArt.isShadow ||
    !purifiedArt.purifiedAt ||
    !isInstanceHighBond(purifiedArt) ||
    !purifiedArt.moves.includes('Heal Bell') ||
    !keptDarkLugia.isShadow ||
    !keptDarkLugia.moves.includes('Shadow Aeroblast')
  ) {
    throw new Error(`Expected Articuno purified + High Bond while XD001 Lugia stays deliberately Shadow!`);
  }
  // Verify purifying XD001 Lugia on a copy grants Psycho Boost!
  const purifyLugiaCopy = purifyShadowPokemonInstance(shProf, snaggedLugia.uid);
  const purifiedLugiaMon = purifyLugiaCopy.nextProfile.pokemonBox.find((b) => b.uid === snaggedLugia.uid)!;
  if (!purifyLugiaCopy.ok || !purifiedLugiaMon.moves.includes('Psycho Boost') || !isInstanceHighBond(purifiedLugiaMon)) {
    throw new Error('Expected purifying XD001 Lugia to grant Psycho Boost & High Bond!');
  }
  // Verify Dev Shadow Spawner works cleanly too!
  const devShSpawn = spawnDevShadowSpecimen(shProf, 'Mewtwo', undefined, 'box');
  if (!devShSpawn.ok || !devShSpawn.nextProfile.pokemonBox.some((b) => b.uid === devShSpawn.uid && b.isShadow)) {
    throw new Error('Expected spawnDevShadowSpecimen to create Shadow Mewtwo!');
  }

  console.log(
    `  OK: ALL 24 Shadow Moves (Shadow Aeroblast 115 BP Spread + Shadow Eclipse +2/+2/+1), Fairy 0× Immunity, 2× Super Effective vs Non-Shadow, 0.5× Shadow Resist, Shadow Sky, Hyper Mode (<50% HP + 1/8 self-pain), Power of Friendship (1-HP Endure + Status Shake-Off + STRICTLY Blocked on Shadow), XD001 Lugia Boss Raid + Auto-Snag (6/6), Unlimited Purification Chamber & Optional Keep-Shadow vs Purify (Psycho Boost!) ALL VERIFIED!`
  );

  console.log('\nALL 30 ENGINE, SHADOW POKÉMON, POWER OF FRIENDSHIP, CAMPAIGN LADDER, HIDDEN VISIBILITY & CONFESSION SUITES PASSED!');
}

let allSuitesCompleted = false;
process.on('beforeExit', () => {
  if (!allSuitesCompleted) {
    console.error('ENGINE TEST STALLED: event loop drained before all suites completed!');
    process.exit(1);
  }
});

main()
  .then(() => {
    allSuitesCompleted = true;
  })
  .catch((err) => {
    console.error('ENGINE TEST FAILED:', err);
    process.exit(1);
  });
