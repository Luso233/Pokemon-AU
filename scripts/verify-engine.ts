import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { Teams, TeamValidator } from '@pkmn/sim';
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
  applyDevUnlockEverything,
  awardArcadeCoins,
  buildIronmanPersistedStateForBattle,
  campHealPartyMember,
  compileCustomTeamToShowdownPaste,
  completeRomanceRank,
  createDefaultProfile,
  createNewConfiguredRunProfile,
  equipItemOnInstance,
  harvestCampBerry,
  isChapterUnlocked,
  isMoveSlotUnlocked,
  movePokemonInstanceZone,
  plantCampBerry,
  purchaseHeldItem,
  purchasePokemon,
  purchaseShinyCharm,
  purchaseTM,
  recordPostBattleSurvivalState,
  resetStoryProgress,
  setCustomItemForSpecies,
  setCustomMoveForSpecies,
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
import { DARK_ATLAS_LANDMARKS } from '../src/data/darkAtlas';
import {
  computeActiveSocialLinkPerks,
  ROMANCE_ROSTER,
} from '../src/data/socialLinksCatalog';
import {
  resolveRomanceRematchBattle,
  resolveRomanceTagBattle,
} from '../src/engine/romanceBattles';
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
import { createRivalBattleController } from '../src/engine/tacticalAI';
import type { BattleSnapshot } from '../src/types/game';

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

  console.log('\n=== 20. Personalidades NPC, Diálogos Reactivos, Dificultad/Variantes & Hombre Rata (Hackmons Sin Reglas) ===');
  const ratInk = readFileSync(resolve('src/stories/chapter1_banquet.ink'), 'utf8');
  const ratRunner = new InkVNRunner(ratInk);
  let ratFrame = ratRunner.step();
  while (!ratFrame.isEnded) {
    if (ratFrame.canContinue) ratFrame = ratRunner.step();
    else if (ratFrame.choices.length > 0) ratFrame = ratRunner.choose(0); // daily + physical + sabotage
  }
  const ratBaseCfg = resolveChapter2BanquetBattle(ratFrame.flags);
  const ratHydratedCfg = applyNpcRunModifiers(ratBaseCfg, 'kaizo', 'canonical');
  const { finalSnap: resRat, turn1Snap: t1Rat, turn2Snap: t2Rat } = await runFullSimMatch(
    'Rat-Man Hackmons Bonus 02',
    ratHydratedCfg,
    { maxTurns: 40 }
  );
  if (
    ratHydratedCfg.rivalCharId !== 'rat_saboteur' ||
    !ratHydratedCfg.rivalShowdownPaste.includes('Level: 118') ||
    !resRat.triggeredScriptIds.includes('rat-t1-shedinja-tera')
  ) {
    throw new Error(
      `Expected Rat-Man Hackmons team (Zoroark Lv.118 + Shedinja T1 Tera Electric), got char=${ratHydratedCfg.rivalCharId} scripts=[${resRat.triggeredScriptIds.join(', ')}]`
    );
  }
  const shedT2 = t2Rat?.p2.party.find((p) => p.species === 'Shedinja');
  if (shedT2 && !shedT2.fainted && shedT2.terastallized !== 'Electric') {
    throw new Error(`Expected Shedinja to Terastallize Electric on Turn 1, got tera=${shedT2.terastallized}`);
  }
  if (!t1Rat?.activeTaunt && !resRat.activeTaunt) {
    throw new Error('Expected reactive or scripted NPC dialogue banner during Rat-Man combat!');
  }

  // Verify difficulty scaling + random variant selection across Comandante Siniestro & Rat-Man
  const darkCmdVariants = getVariantsForChapterNpc('dark_commander', 'ch2-monotype-banners');
  if (darkCmdVariants.length < 2) {
    throw new Error(`Expected >=2 variants for Comandante Siniestro, got ${darkCmdVariants.length}`);
  }
  const nightmareRat = applyNpcRunModifiers(ratBaseCfg, 'nightmare', 'rat-banette-nightmare');
  const standardRat = applyNpcRunModifiers(ratBaseCfg, 'standard', 'canonical');
  if (
    !nightmareRat.rivalShowdownPaste.includes('Banette-Mega') ||
    !nightmareRat.rivalShowdownPaste.includes('Level: 122') ||
    !standardRat.rivalShowdownPaste.includes('Level: 114')
  ) {
    throw new Error('Difficulty scaling or Banette-Mega variant check failed!');
  }
  const rivalDef = getNpcDefinition('assassin');
  if (!rivalDef.socialLink?.romanceable || !rivalDef.socialLink?.canTagPartner) {
    throw new Error('Expected recurring rival (assassin) to have future socialLink romanceable & tag-partner metadata!');
  }
  console.log(
    `  OK: Rat-Man (Shedinja Tera Electric + Air Balloon + Prankster Smeargle + Mega Sableye + Wobbuffet + Zoroark Lv.118), Difficulty (114/118/122), Variants & Reactive Dialogues verified (turns=${resRat.turn})`
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
  if (!babyRat.rivalShowdownPaste.includes('Level: 110')) {
    throw new Error(`Expected Baby Mode (-8 lvls) to scale Zoroark Lv.118 -> Lv.110!`);
  }

  // 2) Verify ALL 16 chapters have rewardPokemon & teamEditPolicy, and clearing Puzzle 02 unlocks Regigigas (Slow Start)!
  const chaptersSource = readFileSync(resolve('src/data/chapters.ts'), 'utf8');
  const editableMatches = chaptersSource.match(/teamEditPolicy:\s*'editable'/g) ?? [];
  const fixedMatches = chaptersSource.match(/teamEditPolicy:\s*'fixed'/g) ?? [];
  if (editableMatches.length + fixedMatches.length !== 16 || editableMatches.length < 4 || fixedMatches.length < 8) {
    throw new Error(
      `Expected all 16 chapters split between editable & fixed teamEditPolicy, got editable=${editableMatches.length}, fixed=${fixedMatches.length}`
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
    `  OK: 4 Difficulties (Baby Lv.110..Tryhard Lv.122), 16 Chapter Pokémon Unlocks (Regigigas Slow Start!), FatalBlow (${fatalSnap.lastFatalBlow.attackerSpecies}·${fatalSnap.lastFatalBlow.moveName}) + X/Twitter Share, & Three Knights (Sir Caín, Sir Abel, Sir Frey) ALL VERIFIED!`
  );

  console.log('\nALL 23 ENGINE, MAP, ROMANCE, POKÉROGUE RUN, FATAL-BLOW & KNIGHTS SUITES PASSED!');
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
