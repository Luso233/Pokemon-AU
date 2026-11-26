import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { InkVNRunner } from '../src/engine/inkRunner';
import {
  resolveChapter0Battle,
  resolveChapter1Battle,
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
  config: ReturnType<typeof resolveChapter0Battle>,
  maxTurns = 30
): Promise<MatchRunResult> {
  return new Promise((resolvePromise, rejectPromise) => {
    let settled = false;
    let lastSentTurn = -1;
    let lastForceSwitchSig = '';
    let turn1Snap: BattleSnapshot | null = null;

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

        const cmds = snap.pendingSlots.map((slot) => {
          if (slot.pass) return 'pass';
          const damaging = slot.moves.find(
            (m) => !m.disabled && m.category !== 'Status'
          );
          const pick =
            damaging ?? slot.moves.find((m) => !m.disabled) ?? slot.moves[0];
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
      console.log('  Choice:', frame.choices[0].text);
      frame = runner.choose(0);
    }
  }
  const ch0Config = resolveChapter0Battle(frame.flags);
  if (ch0Config.rivalIntel.visibleSpeciesCount !== 6) {
    throw new Error('Expected Chapter 0 briefing intel to expose 6 species only.');
  }

  console.log('\n=== 2. Testing Fog of War + Arceus Physical vs 6 Magikarps ===');
  const { finalSnap: resPhys, turn1Snap: physT1 } = await runFullSimMatch(
    'Arceus-Physical vs 6 Magikarp',
    ch0Config
  );
  if (!physT1) throw new Error('Missing Turn 1 snapshot!');
  const leadRival = physT1.p2.active[0];
  if (!leadRival) throw new Error('Missing lead rival on Turn 1!');
  if (physT1.p2.party.length !== 1) {
    throw new Error(
      `Fog of War leak! Expected only 1 revealed rival on Turn 1, got ${physT1.p2.party.length}`
    );
  }
  if (leadRival.revealedAbility !== null) {
    throw new Error(
      `Fog of War leak! Rival ability should not be revealed on Turn 1, got ${leadRival.revealedAbility}`
    );
  }
  if (leadRival.revealedItem !== null) {
    throw new Error(
      `Fog of War leak! Rival item should not be revealed on Turn 1, got ${leadRival.revealedItem}`
    );
  }
  if (!leadRival.possibleAbilities.includes('Swift Swim')) {
    throw new Error('Expected Dex possibleAbilities to include Swift Swim!');
  }
  if (!leadRival.speedRange || leadRival.speedRange.min <= 0 || leadRival.speedRange.max <= leadRival.speedRange.min) {
    throw new Error('Invalid Dex speedRange computed for rival!');
  }
  console.log(
    `  Turn 1 Fog-of-War OK: partyRevealed=${physT1.p2.party.length}/${physT1.totalP2}, ability=${leadRival.revealedAbility}, possible=[${leadRival.possibleAbilities.join(', ')}], spe=${leadRival.speedRange.min}-${leadRival.speedRange.max}`
  );
  console.log(
    `  Winner: ${resPhys.winner} | Turns: ${resPhys.turn} | Rival KOs: ${resPhys.koCountP2}/${resPhys.totalP2}`
  );
  if (resPhys.winner !== 'p1' || resPhys.koCountP2 !== 6) {
    throw new Error('Expected Arceus to KO all 6 Magikarps and win!');
  }

  console.log('\n=== 3. Testing Provoked Lv.100 Magikarps + Lv.105 Boss Ace + Item/Move Reveals ===');
  const ch0Electric = resolveChapter0Battle({
    arceus_build: 'electric',
    player_companion: 'none',
    rival_stance: 'provoked',
  });
  const { finalSnap: resElec } = await runFullSimMatch(
    'Arceus-Electric vs 6 Lv100 Magikarp',
    ch0Electric
  );
  const sashMon = resElec.p2.party.find((m) => m.consumedItem === 'Focus Sash');
  const aceMon = resElec.p2.party.find((m) => m.isBossAce);
  if (!sashMon) {
    throw new Error('Expected Focus Sash activation to be tracked in consumedItem!');
  }
  if (!aceMon || aceMon.level !== 105) {
    throw new Error('Expected Boss Ace Magikarp VI ★ at Lv.105 to be detected!');
  }
  if (Object.keys(sashMon.revealedMoves).length === 0) {
    throw new Error('Expected Focus Sash survivor to reveal at least 1 move!');
  }
  console.log(
    `  Winner: ${resElec.winner} | Turns: ${resElec.turn} | Rival KOs: ${resElec.koCountP2}/${resElec.totalP2} | Sash tracked: ${sashMon.name} (moves: ${Object.keys(sashMon.revealedMoves).join(', ')}) | Boss Ace: ${aceMon.name} Lv.${aceMon.level}`
  );

  console.log('\n=== 4. Testing Dynamic Speed Range Modifiers (Boosts / Paralysis / Tailwind) ===');
  const baseSpe = computeSpeedRange('Arceus', 100, 0, false, false);
  const paraSpe = computeSpeedRange('Arceus', 100, 0, true, false);
  const twBoostSpe = computeSpeedRange('Arceus', 100, 1, false, true);
  if (paraSpe.max !== Math.floor(baseSpe.max * 0.5)) {
    throw new Error('Paralysis speed halving mismatch!');
  }
  if (twBoostSpe.max <= baseSpe.max * 2) {
    throw new Error('Boost + Tailwind speed scaling mismatch!');
  }
  console.log(
    `  Arceus Lv.100 Spe: Base ${baseSpe.min}-${baseSpe.max} | Paralyzed ${paraSpe.min}-${paraSpe.max} | +1 & Tailwind ${twBoostSpe.min}-${twBoostSpe.max}`
  );

  console.log('\n=== 5. Testing Chapter 1 Doubles 2v2 (Partial Intel 2/4 + Boss Ace Lv.104) ===');
  const ch1Combat = resolveChapter1Battle({
    team_mode: 'combat',
    mixed_role: 'special',
    assassin_plan: 'mirror',
  });
  if (ch1Combat.rivalIntel.visibleSpeciesCount !== 2) {
    throw new Error('Expected Chapter 1 partial intel to hide 2 of 4 rival species!');
  }
  const { finalSnap: resCh1 } = await runFullSimMatch(
    'Galar Combat 2v2 vs Mirror Assassin',
    ch1Combat,
    40
  );
  console.log(
    `  Winner: ${resCh1.winner} | Turns: ${resCh1.turn} | Rival KOs: ${resCh1.koCountP2}/${resCh1.totalP2}`
  );

  console.log('\n=== 6. Testing Chapter 1 Doubles 2v2 (Daily Life Team vs Sabotage Assassin) ===');
  const ch1Daily = resolveChapter1Battle({
    team_mode: 'daily',
    mixed_role: 'physical',
    assassin_plan: 'sabotage',
  });
  const { finalSnap: resCh1Daily } = await runFullSimMatch(
    'Galar Daily 2v2 vs Sabotage Assassin',
    ch1Daily,
    50
  );
  console.log(
    `  Winner: ${resCh1Daily.winner} | Turns: ${resCh1Daily.turn} | Rival KOs: ${resCh1Daily.koCountP2}/${resCh1Daily.totalP2}`
  );

  console.log('\n=== 7. Testing StrictMode mount/unmount/remount lifecycle ===');
  const strictCtrl = new ShowdownBattleController(ch0Config, () => {});
  const startPromise = strictCtrl.start();
  strictCtrl.destroy();
  await startPromise.catch(() => {});
  console.log('  StrictMode rapid teardown survived cleanly.');

  console.log('\nALL ENGINE & FOG-OF-WAR TESTS PASSED!');
}

main().catch((err) => {
  console.error('ENGINE TEST FAILED:', err);
  process.exit(1);
});
