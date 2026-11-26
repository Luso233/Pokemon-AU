import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { Teams } from '@pkmn/sim';
import { InkVNRunner } from '../src/engine/inkRunner';
import {
  resolveChapter1ChaseBattle,
  resolveChapter2BanquetBattle,
} from '../src/engine/teamBuilderTree';
import {
  computeSpeedRange,
  ShowdownBattleController,
} from '../src/engine/battleEngine';
import type { BattleSnapshot } from '../src/types/game';

interface MatchRunResult {
  finalSnap: BattleSnapshot;
  turn1Snap: BattleSnapshot | null;
}

async function runFullSimMatch(
  label: string,
  config: ReturnType<typeof resolveChapter1ChaseBattle>,
  options: { maxTurns?: number; testTeraTurn1?: boolean } = {}
): Promise<MatchRunResult> {
  const maxTurns = options.maxTurns ?? 60;
  return new Promise((resolvePromise, rejectPromise) => {
    let settled = false;
    let lastSentTurn = -1;
    let lastForceSwitchSig = '';
    let turn1Snap: BattleSnapshot | null = null;
    let teraUsed = false;

    const controller = new ShowdownBattleController(config, (snap) => {
      if (settled) return;

      if (snap.status === 'ended') {
        settled = true;
        controller.destroy();
        resolvePromise({ finalSnap: snap, turn1Snap });
        return;
      }

      if (snap.turn > maxTurns) {
        settled = true;
        controller.destroy();
        rejectPromise(new Error(`[${label}] Exceeded ${maxTurns} turns`));
        return;
      }

      if (snap.status === 'awaiting-choice' && snap.pendingSlots.length > 0) {
        if (snap.turn === 1 && !turn1Snap) {
          turn1Snap = snap;
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

        if (snap.turn === lastSentTurn) return;
        lastSentTurn = snap.turn;

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
  console.log('=== 1. Testing Wyndon Chase Ink VN + Character Tags + 4 Decisions ===');
  const chaseInk = readFileSync(resolve('src/stories/chapter1_chase.ink'), 'utf8');
  const runner = new InkVNRunner(chaseInk);
  let frame = runner.step();
  let sawPrince = false;
  let sawAssassin = false;
  let choiceCount = 0;

  while (!frame.isEnded) {
    if (frame.currentLine?.leftChar === 'prince') sawPrince = true;
    if (frame.currentLine?.rightChar === 'assassin') sawAssassin = true;
    if (frame.canContinue) {
      frame = runner.step();
    } else if (frame.choices.length > 0) {
      choiceCount++;
      // Pick last option (Hardcore Direct Path -> exact verbatim 6v6 teams!)
      const idx = frame.choices.length - 1;
      console.log(`  Decision ${choiceCount}: ${frame.choices[idx].text}`);
      frame = runner.choose(idx);
    }
  }
  if (!sawPrince || !sawAssassin) {
    throw new Error('Expected both Prince and Assassin character sprites to appear in Ink VN!');
  }
  if (choiceCount !== 4) {
    throw new Error(`Expected 4 branching decisions in Chase chapter, got ${choiceCount}`);
  }
  console.log('  Extracted Ink flags (Hardcore path):', frame.flags);

  const hardcoreConfig = resolveChapter1ChaseBattle(frame.flags);
  const p1Imported = Teams.import(hardcoreConfig.playerShowdownPaste)!;
  const p2Imported = Teams.import(hardcoreConfig.rivalShowdownPaste)!;
  if (p1Imported.length !== 6 || p2Imported.length !== 6) {
    throw new Error(`Expected 6v6 teams, got ${p1Imported.length}v${p2Imported.length}`);
  }
  if (hardcoreConfig.rivalIntel.visibleSpeciesCount !== 2) {
    throw new Error('Expected Hardcore path briefing intel to be 2/6!');
  }
  console.log(
    `  6v6 Verified: Prince=[${p1Imported.map((m) => m.species).join(', ')}] vs Assassin=[${p2Imported.map((m) => m.species).join(', ')}]`
  );

  console.log('\n=== 2. Testing 6v6 Doubles Hardcore Match + Scripted AI + Fog of War + Tera ===');
  const { finalSnap: resHard, turn1Snap: hardT1 } = await runFullSimMatch(
    'Prince vs Assassin Hardcore 6v6',
    hardcoreConfig,
    { maxTurns: 80, testTeraTurn1: true }
  );
  if (!hardT1) throw new Error('Missing Turn 1 snapshot!');
  if (hardT1.p2.party.length !== 2) {
    throw new Error(
      `Fog of War leak in 6v6 Doubles! Expected only 2 revealed leads on Turn 1, got ${hardT1.p2.party.length}`
    );
  }
  if (!resHard.triggeredScriptIds.includes('cold-t1-taunt-gardevoir')) {
    throw new Error('Expected Turn 1 scripted rule `cold-t1-taunt-gardevoir` to fire!');
  }
  const teraMon = resHard.p1.party.find((m) => m.terastallized === 'Water');
  if (!teraMon) {
    throw new Error('Expected Arcanine Terastallization (Water) to be tracked!');
  }
  console.log(
    `  Turn 1 Fog-of-War OK (2/6 leads revealed) | Scripted rules fired: [${resHard.triggeredScriptIds.join(', ')}] | Tera tracked: ${teraMon.species} -> ${teraMon.terastallized}`
  );
  console.log(
    `  Match finished cleanly: winner=${resHard.winner}, turns=${resHard.turn}, rivalKOs=${resHard.koCountP2}/${resHard.totalP2}`
  );

  console.log('\n=== 3. Testing Advantage Branch (Rooftops + Vapor Sabotage + Anti-Taunt + Provoke) ===');
  const advantageConfig = resolveChapter1ChaseBattle({
    chase_route: 'rooftops',
    sabotage_plan: 'vapor_trap',
    prince_prep: 'anti_taunt',
    mind_game: 'provoke',
  });
  const advP1 = Teams.import(advantageConfig.playerShowdownPaste)!;
  const advP2 = Teams.import(advantageConfig.rivalShowdownPaste)!;
  if (advantageConfig.rivalIntel.visibleSpeciesCount !== 4) {
    throw new Error('Expected Rooftops route to raise briefing intel to 4/6!');
  }
  if (advP2[0].species !== 'Heatran') {
    throw new Error(`Expected Rooftops route to disrupt Assassin lead to Heatran, got ${advP2[0].species}`);
  }
  if (advP2.find((m) => m.species === 'Grafaiai')?.item) {
    throw new Error('Expected Vapor Trap to strip Grafaiai Focus Sash!');
  }
  if (advP1.find((m) => m.species === 'Gardevoir')?.item !== 'Mental Herb') {
    throw new Error('Expected Anti-Taunt prep to give Gardevoir Mental Herb!');
  }
  const { finalSnap: resAdv } = await runFullSimMatch(
    'Prince vs Assassin Advantage 6v6',
    advantageConfig,
    { maxTurns: 80 }
  );
  if (!resAdv.triggeredScriptIds.includes('provoked-t1-heatwave')) {
    throw new Error('Expected Provoked Turn 1 Heat Wave scripted rule to fire!');
  }
  console.log(
    `  Advantage branch OK: Intel 4/6, Lead disrupted (${advP2[0].species}+${advP2[1].species}), Scripted rules fired: [${resAdv.triggeredScriptIds.join(', ')}], turns=${resAdv.turn}`
  );

  console.log('\n=== 4. Testing Dynamic Speed Range Modifiers ===');
  const baseSpe = computeSpeedRange('Grafaiai', 100, 0, false, false);
  const paraSpe = computeSpeedRange('Grafaiai', 100, 0, true, false);
  const twSpe = computeSpeedRange('Grafaiai', 100, 1, false, true);
  if (paraSpe.max !== Math.floor(baseSpe.max * 0.5) || twSpe.max <= baseSpe.max * 2) {
    throw new Error('Speed range calculation mismatch!');
  }
  console.log(
    `  Grafaiai Lv.100 Spe: Base ${baseSpe.min}-${baseSpe.max} | Paralyzed ${paraSpe.min}-${paraSpe.max} | +1 & Tailwind ${twSpe.min}-${twSpe.max}`
  );

  console.log('\n=== 5. Testing Chapter 02 Bonus (Banquet <=400 BST Doubles) ===');
  const ch2 = resolveChapter2BanquetBattle({
    team_mode: 'combat',
    mixed_role: 'special',
    assassin_plan: 'mirror',
  });
  const { finalSnap: resCh2 } = await runFullSimMatch('Chapter 2 Banquet', ch2, { maxTurns: 50 });
  console.log(
    `  Winner: ${resCh2.winner} | Turns: ${resCh2.turn} | Scripted rules: [${resCh2.triggeredScriptIds.join(', ')}]`
  );

  console.log('\n=== 6. Testing StrictMode mount/unmount teardown ===');
  const strictCtrl = new ShowdownBattleController(hardcoreConfig, () => {});
  const startPromise = strictCtrl.start();
  strictCtrl.destroy();
  await startPromise.catch(() => {});
  console.log('  StrictMode rapid teardown survived cleanly.');

  console.log('\nALL CHASE VN, 6v6, SCRIPTED AI, FOG-OF-WAR & TERA TESTS PASSED!');
}

main().catch((err) => {
  console.error('ENGINE TEST FAILED:', err);
  process.exit(1);
});
