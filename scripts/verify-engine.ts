import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { InkVNRunner } from '../src/engine/inkRunner';
import {
  resolveChapter0Battle,
  resolveChapter1Battle,
} from '../src/engine/teamBuilderTree';
import { ShowdownBattleController } from '../src/engine/battleEngine';
import type { BattleSnapshot } from '../src/types/game';

async function runFullSimMatch(
  label: string,
  config: ReturnType<typeof resolveChapter0Battle>,
  maxTurns = 30
): Promise<BattleSnapshot> {
  return new Promise((resolvePromise, rejectPromise) => {
    let settled = false;
    let lastSentTurn = -1;
    let lastForceSwitchSig = '';

    const controller = new ShowdownBattleController(config, (snap) => {
      if (settled) return;

      if (snap.status === 'ended') {
        settled = true;
        controller.destroy();
        resolvePromise(snap);
        return;
      }

      if (snap.turn > maxTurns) {
        settled = true;
        controller.destroy();
        rejectPromise(new Error(`[${label}] Exceeded ${maxTurns} turns`));
        return;
      }

      if (snap.status === 'awaiting-choice' && snap.pendingSlots.length > 0) {
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

        const cmds = snap.pendingSlots.map((slot) => {
          if (slot.pass) return 'pass';
          const damaging = slot.moves.find(
            (m) => !m.disabled && m.category !== 'Status'
          );
          const pick = damaging ?? slot.moves.find((m) => !m.disabled) ?? slot.moves[0];
          if (!pick) return 'pass';
          if (config.format === 'doubles') {
            const needsFoe =
              pick.target === 'normal' ||
              pick.target === 'any' ||
              pick.target === 'adjacentFoe';
            if (needsFoe) {
              const targetIdx = snap.p2.active.findIndex((m) => m && !m.fainted);
              return `move ${pick.index} +${(targetIdx >= 0 ? targetIdx : 0) + 1}`;
            }
          }
          return `move ${pick.index}`;
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
  console.log('=== 1. Testing Ink VN Runner + Decision Tree (Chapter 0) ===');
  const ch0Ink = readFileSync(resolve('src/stories/chapter0_testing.ink'), 'utf8');
  const runner = new InkVNRunner(ch0Ink);
  let frame = runner.step();
  while (!frame.isEnded) {
    if (frame.canContinue) {
      frame = runner.step();
    } else if (frame.choices.length > 0) {
      // Pick choice 0 every time -> Physical Arceus, Solo 1v6, Ceremonial 6 Magikarps
      console.log('  Choice:', frame.choices[0].text);
      frame = runner.choose(0);
    }
  }
  console.log('  Extracted Ink flags:', frame.flags);
  const ch0Config = resolveChapter0Battle(frame.flags);
  console.log('  Injected Player Paste:\n' + ch0Config.playerShowdownPaste);

  console.log('\n=== 2. Testing Arceus vs 6 Magikarps (Physical, Solo, Ceremonial) ===');
  const resPhys = await runFullSimMatch('Arceus-Physical vs 6 Magikarp', ch0Config);
  console.log(
    `  Winner: ${resPhys.winner} | Turns: ${resPhys.turn} | Rival KOs: ${resPhys.koCountP2}/${resPhys.totalP2}`
  );
  if (resPhys.winner !== 'p1' || resPhys.koCountP2 !== 6) {
    throw new Error('Expected Arceus to KO all 6 Magikarps and win!');
  }

  console.log('\n=== 3. Testing Arceus-Electric vs 6 Provoked Lv.100 Magikarps ===');
  const ch0Electric = resolveChapter0Battle({
    arceus_build: 'electric',
    player_companion: 'none',
    rival_stance: 'provoked',
  });
  const resElec = await runFullSimMatch('Arceus-Electric vs 6 Lv100 Magikarp', ch0Electric);
  console.log(
    `  Winner: ${resElec.winner} | Turns: ${resElec.turn} | Rival KOs: ${resElec.koCountP2}/${resElec.totalP2}`
  );
  if (resElec.winner !== 'p1' || resElec.koCountP2 !== 6) {
    throw new Error('Expected Arceus-Electric to KO all 6 provoked Magikarps and win!');
  }

  console.log('\n=== 4. Testing Chapter 0 Special Arceus + Arcanine Companion ===');
  const ch0Special = resolveChapter0Battle({
    arceus_build: 'special',
    player_companion: 'arcanine',
    rival_stance: 'ceremonial',
  });
  const resSpec = await runFullSimMatch('Arceus-Special + Arcanine vs 6 Magikarp', ch0Special);
  console.log(
    `  Winner: ${resSpec.winner} | Turns: ${resSpec.turn} | Rival KOs: ${resSpec.koCountP2}/${resSpec.totalP2}`
  );
  if (resSpec.winner !== 'p1' || resSpec.koCountP2 !== 6) {
    throw new Error('Expected Special Arceus to KO all 6 Magikarps!');
  }

  console.log('\n=== 5. Testing Chapter 1 Doubles 2v2 (Combat Team vs Ditto Mirror Assassin) ===');
  const ch1Combat = resolveChapter1Battle({
    team_mode: 'combat',
    mixed_role: 'special',
    assassin_plan: 'mirror',
  });
  const resCh1 = await runFullSimMatch('Galar Combat 2v2 vs Mirror Assassin', ch1Combat, 40);
  console.log(
    `  Winner: ${resCh1.winner} | Turns: ${resCh1.turn} | Rival KOs: ${resCh1.koCountP2}/${resCh1.totalP2}`
  );

  console.log('\n=== 6. Testing Chapter 1 Doubles 2v2 (Daily Life Team vs Sabotage Assassin) ===');
  const ch1Daily = resolveChapter1Battle({
    team_mode: 'daily',
    mixed_role: 'physical',
    assassin_plan: 'sabotage',
  });
  const resCh1Daily = await runFullSimMatch('Galar Daily 2v2 vs Sabotage Assassin', ch1Daily, 50);
  console.log(
    `  Winner: ${resCh1Daily.winner} | Turns: ${resCh1Daily.turn} | Rival KOs: ${resCh1Daily.koCountP2}/${resCh1Daily.totalP2}`
  );

  console.log('\n=== 7. Testing StrictMode mount/unmount/remount lifecycle ===');
  const strictCtrl = new ShowdownBattleController(ch0Config, () => {});
  const startPromise = strictCtrl.start();
  strictCtrl.destroy();
  await startPromise.catch(() => {});
  console.log('  StrictMode rapid teardown survived cleanly.');

  console.log('\nALL ENGINE TESTS PASSED!');
}

main().catch((err) => {
  console.error('ENGINE TEST FAILED:', err);
  process.exit(1);
});
