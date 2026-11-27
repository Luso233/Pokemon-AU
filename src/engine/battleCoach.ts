import { Dex } from '@pkmn/sim';
import type {
  AISettings,
  BattleSnapshot,
  KeyTurnReview,
  LiveCoachAdvice,
  PostGameReview,
  ResolvedBattleConfig,
} from '../types/game';
import { callStructuredLLM, isLiveLLMConfigured } from './aiProvider';

/* ================= Compact Stateless Board Serializer (~350 tokens) ================= */

export function buildCompactCoachBoardState(snapshot: BattleSnapshot) {
  return {
    turn: Math.max(1, snapshot.turn),
    format: snapshot.format,
    formatId: snapshot.formatId,
    field: {
      weather: snapshot.weather
        ? `${snapshot.weather} (${snapshot.weatherTurnsLeft ?? '?'}t)`
        : 'none',
      terrain: snapshot.terrain
        ? `${snapshot.terrain} (${snapshot.terrainTurnsLeft ?? '?'}t)`
        : 'none',
      trickRoom:
        snapshot.trickRoomTurnsLeft != null
          ? `${snapshot.trickRoomTurnsLeft}t`
          : 'none',
      playerSideConditions: snapshot.p1.sideConditions,
      rivalSideConditions: snapshot.p2.sideConditions,
    },
    playerActive: snapshot.p1.active
      .filter((m): m is NonNullable<typeof m> => Boolean(m))
      .map((m) => ({
        name: m.species,
        hp: `${m.hp}/${m.maxhp} (${m.hpPercent}%)`,
        status: m.status || 'none',
        tera: m.terastallized ? `Active:${m.terastallized}` : m.teraType ?? 'none',
        item: m.item || 'none',
        ability: m.ability || 'none',
        boosts: m.boosts,
      })),
    playerBenchAlive: snapshot.p1.party
      .filter((m) => !m.active && !m.fainted)
      .map((m) => `${m.species} (${m.hpPercent}%)`),
    // Respects Fog of War: ONLY public/revealed rival info!
    rivalActivePublic: snapshot.p2.active
      .filter((m): m is NonNullable<typeof m> => Boolean(m))
      .map((m) => ({
        name: m.species,
        hpPercent: m.hpPercent,
        status: m.status || 'none',
        terastallized: m.terastallized ?? 'none',
        revealedAbility: m.revealedAbility ?? 'unknown',
        revealedItem: m.revealedItem ?? 'unknown',
        revealedMoves: Object.keys(m.revealedMoves),
        boosts: m.boosts,
      })),
    rivalRemainingCount: Math.max(0, snapshot.totalP2 - snapshot.koCountP2),
    legalChoicesPerSlot: snapshot.pendingSlots
      .filter((s) => !s.pass)
      .map((s) => ({
        slot: s.activeIndex + 1,
        pokemon: s.pokemon.species,
        forceSwitch: s.forceSwitch,
        canTera: s.canTerastallize,
        moves: s.moves
          .filter((mv) => !mv.disabled)
          .map((mv) => `${mv.name} (${mv.type}, ${mv.category}, BP:${mv.basePower})`),
      })),
  };
}

/* ================= Local Heuristic Fallbacks (0 tokens) ================= */

function calcTypeEff(moveType: string, targetTypes: string[]): number {
  let mult = 1;
  for (const t of targetTypes) {
    if (!Dex.getImmunity(moveType, t)) return 0;
    const eff = Dex.getEffectiveness(moveType, t);
    if (eff > 0) mult *= 2;
    else if (eff < 0) mult *= 0.5;
  }
  return mult;
}

function buildHeuristicLiveCoach(snapshot: BattleSnapshot): LiveCoachAdvice {
  const foes = snapshot.p2.active.filter(
    (m): m is NonNullable<typeof m> => Boolean(m && !m.fainted)
  );
  const recs: string[] = [];
  const alts: string[] = [];

  for (const slot of snapshot.pendingSlots) {
    if (slot.pass) continue;
    if (slot.forceSwitch) {
      const bench = snapshot.p1.party.filter((p) => !p.active && !p.fainted);
      const bestSwitch = bench.sort((a, b) => b.hpPercent - a.hpPercent)[0];
      recs.push(
        bestSwitch
          ? `Enviar a ${bestSwitch.species} (${bestSwitch.hpPercent}% PS)`
          : 'Pass (sin banca)'
      );
      continue;
    }

    const legal = slot.moves.filter((m) => !m.disabled);
    let bestMove = legal[0];
    let bestScore = -1;
    let bestTargetName = foes[0]?.species ?? 'el rival';

    for (const mv of legal) {
      if (mv.category === 'Status') {
        const sc =
          mv.id === 'tailwind' || mv.id === 'trickroom' || mv.id === 'spore'
            ? 95
            : mv.id === 'protect' || mv.id === 'detect'
              ? 40
              : 55;
        if (sc > bestScore) {
          bestScore = sc;
          bestMove = mv;
        }
        continue;
      }
      const stab = slot.pokemon.types.includes(mv.type) ? 1.5 : 1;
      for (const foe of foes) {
        const eff = calcTypeEff(mv.type, foe.types);
        const sc = (mv.basePower || 60) * stab * eff;
        if (sc > bestScore) {
          bestScore = sc;
          bestMove = mv;
          bestTargetName = foe.species;
        }
      }
    }

    const protectMv = legal.find(
      (m) => m.id === 'protect' || m.id === 'detect' || m.id === 'spikyshield'
    );
    if (bestMove) {
      recs.push(
        `${slot.pokemon.species}: ${bestMove.name}${
          snapshot.format === 'doubles' && bestMove.category !== 'Status'
            ? ` → ${bestTargetName}`
            : ''
        }`
      );
    }
    if (protectMv) {
      alts.push(`${slot.pokemon.species}: ${protectMv.name} para explorar turno`);
    }
  }

  const p1Alive = snapshot.p1.party.filter((p) => !p.fainted).length;
  const p2Alive = Math.max(1, snapshot.totalP2 - snapshot.koCountP2);
  const ratio = Math.round(
    Math.max(10, Math.min(92, (p1Alive / (p1Alive + p2Alive)) * 100))
  );

  const boostedFoe = foes.find((f) =>
    Object.values(f.boosts).some((v) => v > 0)
  );
  const keyThreat = boostedFoe
    ? `${boostedFoe.species} tiene boosts activos — prioridad neutralizarlo o proteger tu pieza clave.`
    : snapshot.trickRoomTurnsLeft != null
      ? `Espacio Raro activo (${snapshot.trickRoomTurnsLeft}t): los Pokémon lentos del rival atacarán primero.`
      : foes[0]
        ? `${foes[0].species} (${foes[0].hpPercent}% PS) es la mayor amenaza inmediata en campo.`
        : 'Mantén presión ofensiva y conserva tu condición de victoria.';

  return {
    source: 'heuristic',
    modelLabel: 'Coach Heurístico Local (0 tokens)',
    bestPlay: recs.join(' · ') || 'Presionar con tu ataque con STAB más fuerte',
    safeAlternative:
      alts[0] ||
      'Cambiar a un resistente defensivo en banca si prevés doble enfoque rival.',
    keyThreat,
    reasoning:
      'Evaluación basada en tabla de tipos, STAB, estado del campo y ventaja numérica (configura Gemini u Ollama en Ajustes IA para análisis estratégico profundo con LLM).',
    winChanceEstimate: ratio,
  };
}

function buildHeuristicPostGameReview(
  snapshot: BattleSnapshot,
  config: ResolvedBattleConfig
): PostGameReview {
  const won = snapshot.winner === 'p1';
  const keyTurns: KeyTurnReview[] = [];
  let currentTurn = 1;
  let lastMoveByPlayer = '';
  let faintsThisTurn: string[] = [];

  const flushTurn = (t: number) => {
    if (faintsThisTurn.length >= 2) {
      keyTurns.push({
        turn: t,
        grade: 'blunder',
        symbol: '??',
        headline: `Doble caída en Turno ${t}`,
        whatHappened: `Se debilitaron múltiples piezas (${faintsThisTurn.join(', ')}) en el mismo turno.`,
        betterLine:
          'Usar Protect/Detect en una pieza frágil o reposicionar un cambio defensivo para evitar un doble KO simultáneo.',
      });
    } else if (faintsThisTurn.length === 1 && keyTurns.length < 4) {
      keyTurns.push({
        turn: t,
        grade: 'inaccuracy',
        symbol: '?!',
        headline: `Intercambio decisivo en Turno ${t}`,
        whatHappened: `${faintsThisTurn[0]} cayó tras ${lastMoveByPlayer || 'el intercambio del turno'}.`,
        betterLine:
          'Evalúa si preservar esa pieza en banca te daba mejor endgame o control de velocidad.',
      });
    }
    faintsThisTurn = [];
  };

  for (const entry of snapshot.log) {
    if (entry.kind === 'turn') {
      flushTurn(currentTurn);
      currentTurn = entry.turn;
    } else if (entry.kind === 'move') {
      lastMoveByPlayer = entry.text;
    } else if (entry.kind === 'faint') {
      faintsThisTurn.push(entry.text.replace(/[¡!]/g, '').replace(' se debilitó', ''));
    } else if (entry.kind === 'effective' && entry.text.includes('súper eficaz') && keyTurns.length < 4) {
      keyTurns.push({
        turn: currentTurn,
        grade: 'great',
        symbol: '!',
        headline: `Golpe súper eficaz en Turno ${currentTurn}`,
        whatHappened: `${lastMoveByPlayer} encontró debilidad elemental.`,
        betterLine: 'Excelente lectura de cobertura ofensiva para mantener el tempo.',
      });
    }
  }
  flushTurn(currentTurn);

  const blunders = keyTurns.filter((k) => k.grade === 'blunder').length;
  const inaccuracies = keyTurns.filter((k) => k.grade === 'inaccuracy').length;
  const good = keyTurns.filter((k) => k.grade === 'great' || k.grade === 'good').length;
  const accuracy = Math.max(
    42,
    Math.min(96, (won ? 82 : 64) + good * 4 - blunders * 14 - inaccuracies * 6)
  );

  const isBabyMode = config.difficultyMode === 'baby';
  const brokeFmt = config.babyModeFormatFallback;
  const babySuffix = isBabyMode
    ? won
      ? brokeFmt
        ? ` 🍼 Victoria certificada en Baby Mode — Abuso de poder confirmado (rompiste ${brokeFmt.originalFormatLabel} con fallback NatDex).`
        : ` 🍼 Victoria certificada en Baby Mode — Abuso de poder confirmado contra IA distraída.`
      : ` 🍼 Nota del Coach: caer en Baby Mode es secreto de Estado, borramos la cinta.`
    : '';

  return {
    source: 'heuristic',
    modelLabel: isBabyMode
      ? 'Game Review Local · Sello Baby Mode 🍼'
      : 'Game Review Local (0 tokens)',
    playerAccuracy: accuracy,
    summaryVerdict:
      (won
        ? `Victoria sólida en ${snapshot.turn} turnos (${config.playerName} vs. ${config.rivalName}).`
        : `Derrota en ${snapshot.turn} turnos — los turnos de doble caída y control de velocidad marcaron la diferencia.`) +
      babySuffix,
    counts: {
      brilliant: won && blunders === 0 ? 1 : 0,
      good: Math.max(1, good),
      inaccuracy: inaccuracies,
      mistake: 0,
      blunder: blunders,
    },
    keyTurns:
      keyTurns.length > 0
        ? keyTurns.slice(0, 5)
        : [
            {
              turn: 1,
              grade: 'good',
              symbol: '✓',
              headline: 'Apertura estándar en Turno 1',
              whatHappened: `Inicio de ${config.formatLabel} sin errores graves tempranos.`,
              betterLine:
                'Activa Gemini u Ollama en Ajustes de IA para obtener revisión jugada a jugada con blunders exactos estilo Chess.com.',
            },
          ],
    improvements: [
      'Protege tu condición de victoria con Protect/Detect en turnos donde el rival amenaza doble ataque o Trick Room.',
      'Controla la velocidad (Tailwind, Trick Room o parálisis) antes de exponer tus sweepers más frágiles.',
      'Configura Gemini u Ollama en el botón "IA" para desbloquear análisis LLM profundo de tu Battle Log completo.',
    ],
  };
}

/* ================= Public On-Demand Live Coach & Post-Game Review ================= */

const LIVE_COACH_SCHEMA = {
  type: 'object',
  properties: {
    bestPlay: { type: 'string' },
    safeAlternative: { type: 'string' },
    keyThreat: { type: 'string' },
    reasoning: { type: 'string' },
    winChanceEstimate: { type: 'integer' },
  },
  required: [
    'bestPlay',
    'safeAlternative',
    'keyThreat',
    'reasoning',
    'winChanceEstimate',
  ],
};

export async function askLiveCoach(
  snapshot: BattleSnapshot,
  settings: AISettings
): Promise<LiveCoachAdvice> {
  if (!isLiveLLMConfigured(settings)) {
    return buildHeuristicLiveCoach(snapshot);
  }

  const board = buildCompactCoachBoardState(snapshot);

  try {
    const res = await callStructuredLLM<Omit<LiveCoachAdvice, 'source' | 'modelLabel'>>({
      settings,
      systemInstruction:
        'Eres un Coach competitivo de Pokémon estilo Chess.com (experto en VGC, OU y Showdown). Responde en español conciso, directo y táctico usando SOLO la información pública del tablero JSON proporcionado.',
      userPrompt: `Analiza esta posición exacta del turno actual y recomienda la mejor jugada para el jugador:\n${JSON.stringify(board)}`,
      jsonSchema: LIVE_COACH_SCHEMA,
      temperature: 0.3,
      timeoutMs: 18000,
    });

    return {
      source: 'llm',
      modelLabel: res.modelLabel,
      bestPlay: res.data.bestPlay,
      safeAlternative: res.data.safeAlternative,
      keyThreat: res.data.keyThreat,
      reasoning: res.data.reasoning,
      winChanceEstimate: Math.max(
        1,
        Math.min(99, Math.round(Number(res.data.winChanceEstimate) || 50))
      ),
    };
  } catch {
    return buildHeuristicLiveCoach(snapshot);
  }
}

const POST_GAME_REVIEW_SCHEMA = {
  type: 'object',
  properties: {
    playerAccuracy: { type: 'integer' },
    summaryVerdict: { type: 'string' },
    counts: {
      type: 'object',
      properties: {
        brilliant: { type: 'integer' },
        good: { type: 'integer' },
        inaccuracy: { type: 'integer' },
        mistake: { type: 'integer' },
        blunder: { type: 'integer' },
      },
      required: ['brilliant', 'good', 'inaccuracy', 'mistake', 'blunder'],
    },
    keyTurns: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          turn: { type: 'integer' },
          grade: {
            type: 'string',
            enum: ['brilliant', 'great', 'good', 'inaccuracy', 'mistake', 'blunder'],
          },
          headline: { type: 'string' },
          whatHappened: { type: 'string' },
          betterLine: { type: 'string' },
        },
        required: ['turn', 'grade', 'headline', 'whatHappened', 'betterLine'],
      },
    },
    improvements: {
      type: 'array',
      items: { type: 'string' },
    },
  },
  required: [
    'playerAccuracy',
    'summaryVerdict',
    'counts',
    'keyTurns',
    'improvements',
  ],
};

function gradeToSymbol(grade: KeyTurnReview['grade']): KeyTurnReview['symbol'] {
  switch (grade) {
    case 'brilliant':
      return '!!';
    case 'great':
      return '!';
    case 'good':
      return '✓';
    case 'inaccuracy':
      return '?!';
    case 'mistake':
      return '?';
    case 'blunder':
      return '??';
  }
}

export async function generatePostGameReview(
  snapshot: BattleSnapshot,
  config: ResolvedBattleConfig,
  settings: AISettings
): Promise<PostGameReview> {
  if (!isLiveLLMConfigured(settings)) {
    return buildHeuristicPostGameReview(snapshot, config);
  }

  // Condense battle log into a single compact transcript for ONE LLM call
  const transcript = snapshot.log
    .filter((l) => l.kind !== 'system')
    .map((l) => (l.kind === 'turn' ? `\n=== ${l.text} ===` : l.text))
    .join('\n')
    .slice(0, 6500);

  try {
    const res = await callStructuredLLM<{
      playerAccuracy: number;
      summaryVerdict: string;
      counts: PostGameReview['counts'];
      keyTurns: Array<Omit<KeyTurnReview, 'symbol'>>;
      improvements: string[];
    }>({
      settings,
      systemInstruction:
        'Eres un Coach de Game Review estilo Chess.com para Pokémon competitivo. Analiza el Battle Log completo en español, identifica los 3 a 5 turnos más decisivos (brillantes, imprecisiones, errores o blunders concretos citando especies y movimientos reales del log) y sugiere mejores líneas tácticas.',
      userPrompt: `Formato: ${config.formatLabel} (${config.formatId})\nJugador (P1): ${config.playerName}\nRival (P2): ${config.rivalName}\nResultado: ${snapshot.winner === 'p1' ? 'VICTORIA de P1' : 'DERROTA de P1'} en ${snapshot.turn} turnos.\n\nBATTLE LOG COMPLETO:\n${transcript}`,
      jsonSchema: POST_GAME_REVIEW_SCHEMA,
      temperature: 0.35,
      timeoutMs: 28000,
    });

    return {
      source: 'llm',
      modelLabel: res.modelLabel,
      playerAccuracy: Math.max(
        1,
        Math.min(100, Math.round(Number(res.data.playerAccuracy) || 70))
      ),
      summaryVerdict: res.data.summaryVerdict,
      counts: res.data.counts,
      keyTurns: (res.data.keyTurns ?? []).slice(0, 6).map((kt) => ({
        ...kt,
        symbol: gradeToSymbol(kt.grade),
      })),
      improvements: (res.data.improvements ?? []).slice(0, 4),
    };
  } catch {
    return buildHeuristicPostGameReview(snapshot, config);
  }
}
