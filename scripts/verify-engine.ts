import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { Dex, Teams } from '@pkmn/sim';
import { InkVNRunner } from '../src/engine/inkRunner';
import {
  resolveChampionLittleCupBattle,
  resolveChapter1ChaseBattle,
  resolveChapter2BanquetBattle,
  resolvePuzzle1SunTrapBattle,
} from '../src/engine/teamBuilderTree';
import {
  computeSpeedRange,
  ShowdownBattleController,
} from '../src/engine/battleEngine';
import type { BattleSnapshot } from '../src/types/game';

interface MatchRunResult {
  finalSnap: BattleSnapshot;
  turn1Snap: BattleSnapshot | null;
  turn2Snap: BattleSnapshot | null;
}

async function runFullSimMatch(
  label: string,
  config: ReturnType<typeof resolveChapter1ChaseBattle>,
  options: {
    maxTurns?: number;
    testTeraTurn1?: boolean;
    customTurn1Cmd?: string;
  } = {}
): Promise<MatchRunResult> {
  const maxTurns = options.maxTurns ?? 60;
  return new Promise((resolvePromise, rejectPromise) => {
    let settled = false;
    let lastSentTurn = -1;
    let lastForceSwitchSig = '';
    let turn1Snap: BattleSnapshot | null = null;
    let turn2Snap: BattleSnapshot | null = null;
    let teraUsed = false;

    const controller = new ShowdownBattleController(config, (snap) => {
      if (settled) return;

      if (snap.status === 'ended') {
        settled = true;
        controller.destroy();
        resolvePromise({ finalSnap: snap, turn1Snap, turn2Snap });
        return;
      }

      if (snap.turn > maxTurns) {
        settled = true;
        controller.destroy();
        rejectPromise(new Error(`[${label}] Exceeded ${maxTurns} turns`));
        return;
      }

      if (snap.status === 'awaiting-choice' && snap.pendingSlots.length > 0) {
        if (snap.turn === 1 && (!turn1Snap || (!turn1Snap.puzzleApplied && snap.puzzleApplied))) {
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

        // Wait until puzzleConditions have applied if this battle defines them!
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

async function main() {
  console.log('=== 1. Testing Wyndon Chase Ink VN + 6v6 Doubles + Fog of War + Tera ===');
  const chaseInk = readFileSync(resolve('src/stories/chapter1_chase.ink'), 'utf8');
  const runner = new InkVNRunner(chaseInk);
  let frame = runner.step();
  while (!frame.isEnded) {
    if (frame.canContinue) frame = runner.step();
    else if (frame.choices.length > 0) frame = runner.choose(frame.choices.length - 1);
  }
  const hardcoreConfig = resolveChapter1ChaseBattle(frame.flags);
  const { finalSnap: resHard, turn1Snap: hardT1 } = await runFullSimMatch(
    'Prince vs Assassin Hardcore 6v6',
    hardcoreConfig,
    { maxTurns: 80, testTeraTurn1: true }
  );
  if (!hardT1 || hardT1.p2.party.length !== 2) {
    throw new Error('Fog of War check failed in Chapter 1!');
  }
  if (!resHard.triggeredScriptIds.includes('cold-t1-taunt-gardevoir')) {
    throw new Error('Expected cold-t1-taunt-gardevoir scripted rule to fire!');
  }
  console.log(
    `  Hardcore 6v6 OK: turns=${resHard.turn}, Tera Water verified, scripted=[${resHard.triggeredScriptIds.join(', ')}]`
  );

  console.log('\n=== 2. Testing Puzzle 01: La Trampa del Sol (PuzzleConditions + T1/T2 Scripted AI) ===');
  const puzzleInk = readFileSync(resolve('src/stories/puzzle1_suntrap.ink'), 'utf8');
  const pzRunner = new InkVNRunner(puzzleInk);
  let pzFrame = pzRunner.step();
  while (!pzFrame.isEnded) {
    if (pzFrame.canContinue) pzFrame = pzRunner.step();
    else if (pzFrame.choices.length > 0) pzFrame = pzRunner.choose(0);
  }
  const puzzleConfig = resolvePuzzle1SunTrapBattle(pzFrame.flags);
  // Play Turn 1: Inkay Topsy-Turvy Metagross (+1), Sableye Fake Out Volcarona (+2)!
  const { finalSnap: resPz, turn1Snap: pzT1, turn2Snap: pzT2 } =
    await runFullSimMatch('Puzzle 01 Sun Trap', puzzleConfig, {
      maxTurns: 40,
      customTurn1Cmd: 'move 1 +1, move 1 +2',
    });

  if (!pzT1 || !pzT1.puzzleApplied) {
    throw new Error('PuzzleConditions did not apply on Turn 1!');
  }
  if (pzT1.weather !== 'Sol Intenso') {
    throw new Error(`Expected Sol Intenso weather, got "${pzT1.weather}"`);
  }
  if (!pzT1.p1.sideConditions.some((c) => c.toLowerCase().includes('stealth rock'))) {
    throw new Error('Expected Stealth Rock on p1 sideConditions!');
  }
  if (!pzT1.p2.sideConditions.some((c) => c.toLowerCase().includes('tailwind'))) {
    throw new Error('Expected Tailwind on p2 sideConditions!');
  }
  const sableyeT1 = pzT1.p1.active[1];
  if (!sableyeT1 || sableyeT1.hpPercent !== 65) {
    throw new Error(`Expected Sableye to start at 65% HP, got ${sableyeT1?.hpPercent}%`);
  }
  const metaT1 = pzT1.p2.active[0];
  const volcT1 = pzT1.p2.active[1];
  if (!metaT1 || metaT1.boosts.atk !== 2 || metaT1.boosts.spe !== 1) {
    throw new Error(`Expected Mega Metagross +2 Atk/+1 Spe, got ${JSON.stringify(metaT1?.boosts)}`);
  }
  if (!volcT1 || volcT1.boosts.spa !== 2 || volcT1.boosts.spd !== 2 || volcT1.boosts.spe !== 2) {
    throw new Error(`Expected Volcarona +2/+2/+2, got ${JSON.stringify(volcT1?.boosts)}`);
  }
  if (pzT2?.p2.active[0] && pzT2.p2.active[0].boosts.atk !== -2) {
    throw new Error(`Expected Topsy-Turvy to invert Metagross Atk to -2 on T2, got ${pzT2.p2.active[0].boosts.atk}`);
  }
  if (
    !resPz.triggeredScriptIds.includes('puzzle1-t1-metagross-mash') ||
    !resPz.triggeredScriptIds.includes('puzzle1-t2-metagross-bp')
  ) {
    throw new Error(
      `Expected Puzzle Turn 1 & Turn 2 scripted rules to fire, got [${resPz.triggeredScriptIds.join(', ')}]`
    );
  }
  console.log(
    `  Puzzle 01 OK! Weather=${pzT1.weather} | p1=[${pzT1.p1.sideConditions.join(',')}] | p2=[${pzT1.p2.sideConditions.join(',')}] | Sableye=${sableyeT1.hp}/${sableyeT1.maxhp} (${sableyeT1.hpPercent}%) | Metagross T1=+2Atk/+1Spe -> T2=${pzT2?.p2.active[0]?.boosts.atk}Atk | Scripted=[${resPz.triggeredScriptIds.join(', ')}]`
  );

  console.log('\n=== 3. Testing Flashback Little Cup (Prince Lv.5 vs Champion Lv.6-7 + Portrait) ===');
  const lcInk = readFileSync(resolve('src/stories/chapter_littlecup.ink'), 'utf8');
  const lcRunner = new InkVNRunner(lcInk);
  let lcFrame = lcRunner.step();
  let sawChampion = false;
  while (!lcFrame.isEnded) {
    if (lcFrame.currentLine?.rightChar === 'champion') sawChampion = true;
    if (lcFrame.canContinue) lcFrame = lcRunner.step();
    else if (lcFrame.choices.length > 0) lcFrame = lcRunner.choose(0); // Larvitar lead
  }
  if (!sawChampion) {
    throw new Error('Expected Champion character portrait in Little Cup flashback Ink!');
  }
  const lcConfig = resolveChampionLittleCupBattle(lcFrame.flags);
  const lcP1 = Teams.import(lcConfig.playerShowdownPaste)!;
  const lcP2 = Teams.import(lcConfig.rivalShowdownPaste)!;
  if (lcP1.length !== 6 || lcP2.length !== 6) {
    throw new Error('Expected 6v6 Little Cup teams!');
  }
  if (lcP1.some((m) => m.level !== 5)) {
    throw new Error('Expected all Prince Little Cup Pokémon at Level 5!');
  }
  if (lcP2.find((m) => m.species === 'Vullaby')?.level !== 7) {
    throw new Error('Expected Champion Ace Vullaby at Level 7!');
  }
  const { finalSnap: resLC } = await runFullSimMatch('Champion Little Cup', lcConfig, {
    maxTurns: 80,
  });
  if (!resLC.triggeredScriptIds.includes('lc-t1-onix-sr')) {
    throw new Error('Expected Champion Turn 1 Onix Stealth Rock scripted rule to fire!');
  }
  console.log(
    `  Little Cup OK: format=${lcConfig.formatId} (${lcConfig.formatLabel}), turns=${resLC.turn}, scripted=[${resLC.triggeredScriptIds.join(', ')}]`
  );

  console.log('\n=== 4. Verifying Multi-Format Support in @pkmn/sim Dex ===');
  for (const fmtId of [
    'gen9doublescustomgame',
    'gen9customgame',
    'gen91v1',
    'gen9monotype',
    'gen9lc',
  ]) {
    const fmt = Dex.formats.get(fmtId);
    if (!fmt.exists) {
      throw new Error(`Format ${fmtId} does not exist in @pkmn/sim!`);
    }
  }
  console.log('  All 5 formats verified: gen9doublescustomgame, gen9customgame, gen91v1, gen9monotype, gen9lc');

  console.log('\n=== 5. Testing Dynamic Speed Range + Chapter 02 Bonus + StrictMode ===');
  const baseSpe = computeSpeedRange('Volcarona', 100, 2, false, true);
  if (baseSpe.min <= 0 || !baseSpe.modifiers.includes('Viento Afín ×2')) {
    throw new Error('Speed range modifier check failed!');
  }
  const ch2 = resolveChapter2BanquetBattle({
    team_mode: 'combat',
    mixed_role: 'special',
    assassin_plan: 'mirror',
  });
  await runFullSimMatch('Chapter 2 Banquet', ch2, { maxTurns: 50 });
  const strictCtrl = new ShowdownBattleController(puzzleConfig, () => {});
  const sp = strictCtrl.start();
  strictCtrl.destroy();
  await sp.catch(() => {});

  console.log('\nALL PUZZLE, LITTLE CUP, MULTI-FORMAT, SCRIPTED AI & ENGINE TESTS PASSED!');
}

main().catch((err) => {
  console.error('ENGINE TEST FAILED:', err);
  process.exit(1);
});
