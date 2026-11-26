import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { Teams, TeamValidator } from '@pkmn/sim';
import { InkVNRunner } from '../src/engine/inkRunner';
import {
  resolveChampionLittleCupBattle,
  resolveChapter1ChaseBattle,
  resolveChapter2BanquetBattle,
  resolveChapter2MonotypeBattle,
  resolveDuel1Honor1v1Battle,
  resolvePuzzle1SunTrapBattle,
  resolveVgcWorlds2024Battle,
} from '../src/engine/teamBuilderTree';
import {
  computeSpeedRange,
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
          (!turn1Snap || (!turn1Snap.puzzleApplied && snap.puzzleApplied))
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

        if (snap.turn === lastSentTurn) return;
        lastSentTurn = snap.turn;

        if (snap.turn === 1 && options.customTurn1Cmd) {
          void controller.submitPlayerChoice(options.customTurn1Cmd);
          return;
        }

        const cmds = snap.pendingSlots.map((slot, i) => {
          if (slot.pass) return 'pass';
          const damaging = slot.moves.find(
            (m) => !m.disabled && m.category !== 'Status'
          );
          const pick =
            damaging ?? slot.moves.find((m) => !m.disabled) ?? slot.moves[0];
          if (!pick) return 'pass';

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

          if (config.format === 'doubles') {
            const needsFoe =
              pick.target === 'normal' ||
              pick.target === 'any' ||
              pick.target === 'adjacentFoe';
            if (needsFoe) {
              const targetIdx = snap.p2.active.findIndex((m) => m && !m.fainted);
              return `move ${pick.index} +${(targetIdx >= 0 ? targetIdx : 0) + 1}${teraSuffix}`;
            }
          }
          return `move ${pick.index}${teraSuffix}`;
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

  console.log('\nALL 7 CHAPTERS + VERSUS TEAMBUILDER + HOTSEAT + COACH + ENGINE TESTS PASSED!');
}

main().catch((err) => {
  console.error('ENGINE TEST FAILED:', err);
  process.exit(1);
});
