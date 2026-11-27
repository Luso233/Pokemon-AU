import React, { useMemo, useState } from 'react';
import {
  BookOpen,
  Check,
  Coins,
  Copy,
  Crown,
  Heart,
  Home,
  Map,
  RefreshCw,
  RotateCcw,
  Share2,
  ShoppingBag,
  Skull,
  Sparkles,
  Trophy,
  Unlock,
  Wand2,
} from 'lucide-react';
import { CHAPTERS } from '../data/chapters';
import { CURRENCY_NAME, DIFFICULTY_META } from '../data/economyCatalog';
import {
  buildPostRank3ConfessionScene,
  resolveEnding,
} from '../engine/campaignProgression';
import { evaluateBabyModeComedyStamp } from '../engine/formatFallback';
import { applyRivalNameToText, getRivalName } from '../engine/rivalName';
import {
  buildDefeatTweetText,
  buildRunDeathSummary,
  buildTwitterShareUrl,
  countAliveBoxPokemon,
} from '../engine/saveSlots';
import type {
  AISettings,
  BattleRewardSummary,
  BattleSnapshot,
  ChapterDefinition,
  PlayerSaveProfile,
  ResolvedBattleConfig,
  RunDeathSummary,
} from '../types/game';
import { GameReviewPanel } from './GameReviewPanel';
import { PokemonSprite } from './PokemonSprite';
import { SceneBackdrop } from './SceneBackdrop';

interface EpilogueViewProps {
  chapter: ChapterDefinition;
  config: ResolvedBattleConfig;
  profile?: PlayerSaveProfile;
  won: boolean;
  battleSummary: BattleSnapshot | null;
  reward?: BattleRewardSummary | null;
  deathSummary?: RunDeathSummary | null;
  attemptNumber?: number;
  aiSettings: AISettings;
  onOpenAISettings: () => void;
  onReplayChapter: () => void;
  onRetryBattle: () => void;
  onOpenChapters: () => void;
  onOpenShop?: () => void;
  onOpenVersus: () => void;
  onBackHome: () => void;
  onRecordConfession?: (
    npcId: string,
    choice: 'confess' | 'platonic'
  ) => {
    outcome: 'confessed' | 'platonic' | 'rejected_baby';
    isFirstConfession: boolean;
  };
  onStartNewGamePlus?: () => void;
}

export const EpilogueView: React.FC<EpilogueViewProps> = ({
  chapter,
  config,
  profile,
  won,
  battleSummary,
  reward,
  deathSummary,
  attemptNumber,
  aiSettings,
  onOpenAISettings,
  onReplayChapter,
  onRetryBattle,
  onOpenChapters,
  onOpenShop,
  onOpenVersus,
  onBackHome,
  onRecordConfession,
  onStartNewGamePlus,
}) => {
  const [copiedTweet, setCopiedTweet] = useState(false);
  const [confessionFeedback, setConfessionFeedback] = useState<{
    outcome: 'confessed' | 'platonic' | 'rejected_baby';
    isFirstConfession: boolean;
  } | null>(null);
  const rivalName = getRivalName(profile);
  const fmt = (text: string) => applyRivalNameToText(text, rivalName);
  const isVersus = Boolean(config.isVersusMatch);
  const isPrologueCh1 = chapter.id === 'ch1-wyndon-chase';
  const babyStamp = useMemo(
    () => (isVersus ? null : evaluateBabyModeComedyStamp(config, profile, won)),
    [isVersus, config, profile, won]
  );

  const effectiveDeathSummary = useMemo<RunDeathSummary | null>(() => {
    if (won || isVersus) return null;
    if (deathSummary) return deathSummary;
    const isTotalWipe = Boolean(
      profile?.nuzlockePermadeath && countAliveBoxPokemon(profile) === 0
    );
    return buildRunDeathSummary({
      runName: profile?.runName || 'Exilio de Wyndon',
      chapterId: chapter.id,
      chapterLabel: `${chapter.number} · ${chapter.title}`,
      turn: battleSummary?.turn ?? 1,
      difficulty: config.difficultyMode ?? profile?.defaultDifficulty ?? 'kaizo',
      ironmanMode: Boolean(profile?.ironmanMode),
      nuzlockePermadeath: Boolean(profile?.nuzlockePermadeath),
      isTotalNuzlockeWipe: isTotalWipe,
      rivalName: config.rivalName || chapter.rivalProfile.name,
      fatalBlow: battleSummary?.lastFatalBlow ?? null,
      fallbackKillerSpecies:
        battleSummary?.p2.party.find((m) => !m.fainted)?.species ??
        battleSummary?.p2.party[0]?.species,
      fallbackVictimSpecies:
        battleSummary?.p1.party.slice().reverse().find((m) => m.fainted)
          ?.species ?? battleSummary?.p1.party[0]?.species,
    });
  }, [won, isVersus, deathSummary, profile, chapter, battleSummary, config]);

  const defeatTweetText = useMemo(
    () => (effectiveDeathSummary ? buildDefeatTweetText(effectiveDeathSummary) : ''),
    [effectiveDeathSummary]
  );
  const twitterShareUrl = useMemo(
    () => (defeatTweetText ? buildTwitterShareUrl(defeatTweetText) : ''),
    [defeatTweetText]
  );
  const winnerLabel =
    battleSummary?.winner === 'p1'
      ? config.playerName
      : battleSummary?.winner === 'p2'
        ? config.rivalName
        : 'Empate';

  const epilogue = isVersus
    ? {
        headline:
          battleSummary?.winner === 'tie'
            ? 'Empate en Combate Versus'
            : `¡Victoria para ${winnerLabel}!`,
        subheadline: `${config.playerName} (${config.playerTeamSummary}) vs. ${config.rivalName} (${config.rivalTeamSummary})`,
        badgeText:
          config.p2Control === 'human'
            ? 'VERSUS HOTSEAT · FINALIZADO'
            : won
              ? 'VERSUS IA · VICTORIA'
              : 'VERSUS IA · DERROTA',
        paragraphs: [
          `Combate completado bajo las reglas oficiales de ${config.formatLabel ?? config.formatId} (${config.formatId}). Usa el Game Review estilo Chess.com debajo para detectar blunders, turnos clave y líneas óptimas.`,
        ],
      }
    : chapter.getEpilogue(won, config.flags);

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#060a14] p-6 text-slate-100">
      <SceneBackdrop theme={config.arenaTheme} className="opacity-65" />

      <div className="relative z-10 w-full max-w-3xl rounded-3xl border border-amber-400/30 bg-slate-950/92 p-7 shadow-2xl backdrop-blur-xl sm:p-9">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <span
            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold tracking-wider ${
              won || config.p2Control === 'human'
                ? 'border-emerald-400/40 bg-emerald-500/15 text-emerald-300'
                : 'border-rose-400/40 bg-rose-500/15 text-rose-300'
            }`}
          >
            {won || config.p2Control === 'human' ? (
              <Trophy className="h-3.5 w-3.5" />
            ) : (
              <Crown className="h-3.5 w-3.5" />
            )}
            {epilogue.badgeText}
          </span>
          <span className="text-xs font-semibold text-slate-400">
            {isVersus
              ? `MODO VERSUS · ${config.formatLabel ?? config.formatId}`
              : `${chapter.number} · ${chapter.title}`}
          </span>
        </div>

        <h1 className="font-display text-3xl font-extrabold text-white">
          {epilogue.headline}
        </h1>
        <p className="mt-1.5 text-sm font-medium text-amber-200/90">
          {epilogue.subheadline}
        </p>

        <div className="my-5 space-y-3 border-y border-slate-800/90 py-4 text-sm leading-relaxed text-slate-200">
          {epilogue.paragraphs.map((p, idx) => (
            <p key={idx}>{p}</p>
          ))}
        </div>

        {/* Baby Mode Self-Aware Comedic Certification Stamp */}
        {babyStamp && (
          <div
            className={`mb-5 rounded-2xl border-2 border-dashed p-4 shadow-lg ${
              babyStamp.tier === 'baby-loss'
                ? 'border-pink-400/55 bg-gradient-to-r from-pink-950/60 via-slate-950/90 to-rose-950/60'
                : babyStamp.overCapBy > 0 || babyStamp.brokeOfficialFormat
                  ? 'border-sky-300/75 bg-gradient-to-r from-sky-950/75 via-fuchsia-950/55 to-amber-950/65'
                  : 'border-sky-400/55 bg-gradient-to-r from-sky-950/65 via-slate-950/85 to-cyan-950/55'
            }`}
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-lg border border-sky-300/60 bg-sky-500/20 px-2.5 py-1 text-[11px] font-black uppercase tracking-wider text-sky-100 -rotate-1 shadow-sm">
                {babyStamp.badgeTitle}
              </span>
              <div className="flex flex-wrap items-center gap-1.5 font-mono-code text-[10px]">
                <span className="rounded-md border border-white/15 bg-black/45 px-2 py-0.5 font-bold text-amber-200">
                  Equipo: {babyStamp.teamBst.toLocaleString()} BST
                </span>
                {babyStamp.overCapBy > 0 && (
                  <span className="rounded-md border border-fuchsia-400/50 bg-fuchsia-500/25 px-2 py-0.5 font-extrabold text-fuchsia-100">
                    +{babyStamp.overCapBy.toLocaleString()} BST sobre Licencia ({babyStamp.actNormalCap.toLocaleString()})
                  </span>
                )}
                {babyStamp.brokeOfficialFormat && babyStamp.originalFormatLabel && (
                  <span className="rounded-md border border-rose-400/50 bg-rose-500/25 px-2 py-0.5 font-extrabold text-rose-100">
                    ⚡ Fallback NatDex ({babyStamp.originalFormatLabel})
                  </span>
                )}
              </div>
            </div>
            <p className="mt-2 font-display text-sm font-extrabold text-white">
              {babyStamp.headline}
            </p>
            <p className="mt-1 text-xs leading-relaxed text-sky-100/90">
              {babyStamp.quip}
            </p>
          </div>
        )}

        {/* Post-Rank-3 Confession Bifurcation Scene (Ink-style Closing Choice) */}
        {!isVersus &&
          won &&
          config.romanceMeta?.targetRank === 3 &&
          profile &&
          onRecordConfession && (() => {
            const npcId = config.romanceMeta.npcId;
            const scene = buildPostRank3ConfessionScene(npcId, profile);
            const savedChoice = profile.socialLinks?.[npcId]?.r3Choice;
            const resolvedOutcome =
              confessionFeedback?.outcome ??
              (savedChoice === 'confess'
                ? 'confessed'
                : savedChoice === 'platonic'
                  ? 'platonic'
                  : savedChoice === 'rejected_baby'
                    ? 'rejected_baby'
                    : null);
            const isFirst =
              confessionFeedback?.isFirstConfession ??
              profile.firstConfessionNpcId === npcId;
            return (
              <div className="mb-5 rounded-2xl border-2 border-fuchsia-400/55 bg-gradient-to-br from-fuchsia-950/55 via-slate-950/92 to-pink-950/45 p-5 shadow-xl">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-fuchsia-200">
                    <Heart className="h-4 w-4 fill-fuchsia-400 text-fuchsia-400" />
                    {scene.promptHeader}
                  </span>
                  <span className="rounded-full border border-emerald-400/40 bg-emerald-500/15 px-2.5 py-0.5 text-[10px] font-bold text-emerald-200">
                    ✓ Casa PC R3 Desbloqueada (sin compromiso obligatorio)
                  </span>
                </div>
                <p className="mt-2 text-xs leading-relaxed text-slate-200">
                  {scene.promptQuestion}
                </p>

                {!resolvedOutcome ? (
                  <div className="mt-4 grid gap-2.5 sm:grid-cols-2">
                    <button
                      type="button"
                      onClick={() => {
                        const res = onRecordConfession(npcId, 'confess');
                        setConfessionFeedback(res);
                      }}
                      className="rounded-xl border-2 border-pink-400/70 bg-gradient-to-r from-pink-600/35 to-fuchsia-600/35 px-4 py-3 text-left transition hover:brightness-125 cursor-pointer"
                    >
                      <p className="text-xs font-extrabold text-pink-100">
                        {scene.confessButtonLabel}
                      </p>
                      <p className="mt-1 text-[10.5px] text-pink-200/80">
                        {profile.firstConfessionNpcId
                          ? 'Suma hacia el Ending Harem (13/13); tu Ending principal sigue fijado en tu primera confesión.'
                          : '¡Tu primera confesión! Define oficialmente tu Ending Romántico tras el Clímax.'}
                      </p>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        const res = onRecordConfession(npcId, 'platonic');
                        setConfessionFeedback(res);
                      }}
                      className="rounded-xl border-2 border-sky-400/55 bg-sky-950/45 px-4 py-3 text-left transition hover:bg-sky-900/55 cursor-pointer"
                    >
                      <p className="text-xs font-extrabold text-sky-100">
                        {scene.platonicButtonLabel}
                      </p>
                      <p className="mt-1 text-[10.5px] text-sky-200/80">
                        Cierre emotivo de camaradería: conservas Rango 3 y sus 3 Pokémon en Casa PC sin ocupar tu Ending Romántico.
                      </p>
                    </button>
                  </div>
                ) : (
                  <div
                    className={`mt-3 rounded-xl border p-3.5 text-xs leading-relaxed ${
                      resolvedOutcome === 'rejected_baby'
                        ? 'border-sky-400/55 bg-sky-950/50 text-sky-100'
                        : resolvedOutcome === 'confessed'
                          ? 'border-pink-400/55 bg-pink-950/40 text-pink-50'
                          : 'border-emerald-400/45 bg-emerald-950/35 text-emerald-50'
                    }`}
                  >
                    <p>
                      {resolvedOutcome === 'rejected_baby'
                        ? scene.babyRejectionScene
                        : resolvedOutcome === 'confessed'
                          ? isFirst
                            ? scene.confessFirstScene
                            : scene.confessSecondaryScene
                          : scene.platonicScene}
                    </p>
                  </div>
                )}
              </div>
            );
          })()}

        {/* Climax Definitive Ending Showcase (Chapter 12: Bastard Brother) & Postgame Mastery Showcase (Chapter 13) */}
        {!isVersus && won && profile && chapter.id === 'ch12-bastard-brother-climax' && (() => {
          const finalEnding = resolveEnding(profile);
          return (
            <div className="mb-5 rounded-2xl border-2 border-amber-300/70 bg-gradient-to-br from-amber-950/60 via-fuchsia-950/50 to-slate-950/95 p-5 shadow-2xl">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-300/60 bg-amber-500/20 px-3 py-1 text-[11px] font-black uppercase tracking-wider text-amber-100">
                  <Crown className="h-3.5 w-3.5 text-amber-300" />
                  {finalEnding.badge}
                </span>
                <span className="font-mono-code text-[10px] font-bold text-fuchsia-200">
                  Confesiones: {finalEnding.confessedCount}/{finalEnding.totalRomanceables}
                </span>
              </div>
              <h2 className="mt-2.5 font-display text-xl font-extrabold text-white">
                {finalEnding.headline}
              </h2>
              <p className="mt-1.5 text-xs leading-relaxed text-amber-50/90">
                {finalEnding.summary}
              </p>
              <p className="mt-3 rounded-xl border border-purple-400/45 bg-purple-950/45 px-3 py-2 text-[11px] font-bold text-purple-100">
                🏟️ ¡Postgame Desbloqueado! Ahora aparece en el Mapa el desafío opcional Anything Goes contra La Campeona de Galar (Cap. 13 · Nv. 115–120).
              </p>
            </div>
          );
        })()}

        {!isVersus && won && profile && chapter.id === 'ch13-postgame-champion' && (
          <div className="mb-5 rounded-2xl border-2 border-amber-300/80 bg-gradient-to-r from-amber-500/20 via-purple-950/70 to-amber-500/20 p-5 shadow-2xl">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-widest text-amber-200">
                  <Trophy className="h-4 w-4 text-amber-300" />
                  🏆 TRUE MASTERY BADGE OBTENIDO
                </p>
                <p className="mt-1 text-xs text-slate-200">
                  Conquistaste Anything Goes puro (Nv. 115–120) contra La Campeona de Galar. New Game+ queda desbloqueado permanentemente.
                </p>
              </div>
              {onStartNewGamePlus && (
                <button
                  type="button"
                  onClick={onStartNewGamePlus}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-amber-400 to-yellow-300 px-4 py-2 text-xs font-black text-slate-950 shadow-lg hover:brightness-110 cursor-pointer"
                >
                  <Sparkles className="h-4 w-4" />
                  Iniciar New Game+
                </button>
              )}
            </div>
          </div>
        )}

        {/* Discreet Regional Social Link Discovery Banner */}
        {!isVersus &&
          won &&
          reward?.newlyUnlockedSocialLinks &&
          reward.newlyUnlockedSocialLinks.length > 0 && (
            <div className="mb-5 rounded-2xl border border-fuchsia-400/50 bg-fuchsia-950/35 p-3.5 text-xs text-fuchsia-100">
              <div className="flex items-center gap-1.5 font-extrabold text-fuchsia-200">
                <Heart className="h-4 w-4 fill-fuchsia-400 text-fuchsia-400" />
                Nuevos Vínculos Regionales Descubiertos en el Mapa:
              </div>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {reward.newlyUnlockedSocialLinks.map((sl) => (
                  <span
                    key={sl.npcId}
                    className="rounded-lg border border-fuchsia-400/40 bg-fuchsia-500/20 px-2.5 py-1 text-[11px] font-bold text-white"
                  >
                    ♥ Nuevo Vínculo disponible en {sl.regionName}: {sl.npcName}
                  </span>
                ))}
              </div>
            </div>
          )}

        {/* Romance / Ending Preview & Ultra Nuzlocke Survival Banner */}
        {!isVersus && profile && (() => {
          const finalEnding = resolveEnding(profile);
          const fallenInBattle =
            profile.nuzlockePermadeath && battleSummary
              ? battleSummary.p1.party.filter((p) => p.fainted).map((p) => p.species)
              : [];
          const showEndingPreview =
            won &&
            chapter.id !== 'ch12-bastard-brother-climax' &&
            (finalEnding.type === 'HAREM_ENDING' ||
              finalEnding.type.startsWith('ROMANCE_'));
          return (
            <div className="mb-5 space-y-3">
              {showEndingPreview && finalEnding.type === 'HAREM_ENDING' && (
                <div className="rounded-2xl border border-amber-300/65 bg-gradient-to-r from-fuchsia-950/70 via-amber-950/50 to-rose-950/70 p-4">
                  <div className="flex items-center gap-2 text-amber-200">
                    <Crown className="h-4 w-4 text-amber-300" />
                    <span className="font-display text-sm font-extrabold uppercase tracking-wider">
                      {finalEnding.headline}
                    </span>
                  </div>
                  <p className="mt-1.5 text-xs leading-relaxed text-amber-100/90">
                    {finalEnding.summary}
                  </p>
                </div>
              )}
              {showEndingPreview && finalEnding.npc && (
                <div className="rounded-2xl border border-fuchsia-400/45 bg-fuchsia-950/35 p-4">
                  <div className="flex items-center gap-2 text-fuchsia-200">
                    <Heart className="h-4 w-4 fill-fuchsia-400 text-fuchsia-400" />
                    <span className="font-display text-sm font-extrabold">
                      {finalEnding.headline}
                    </span>
                  </div>
                  <p className="mt-1 text-xs leading-relaxed text-slate-200">
                    {finalEnding.summary}
                  </p>
                </div>
              )}
              {fallenInBattle.length > 0 && (
                <div className="rounded-2xl border border-rose-500/50 bg-rose-950/45 p-3.5 text-xs text-rose-100">
                  <div className="flex items-center gap-1.5 font-extrabold text-rose-300">
                    <Skull className="h-4 w-4" />
                    Bajas permanentes de Ultra Nuzlocke Diablo ({fallenInBattle.length}):
                  </div>
                  <p className="mt-1 text-[11px] text-rose-200/90">
                    {fallenInBattle.join(', ')} han sido trasladados al Cementerio del Exilio. Revisa tus Cajas PC o la Casa de Aliados (R3) para cubrir los huecos.
                  </p>
                </div>
              )}
            </div>
          );
        })()}

        {/* Strict Anti-Grind Notice when replaying an already-cleared chapter on Ironman/Nuzlocke/Difícil/Tryhard */}
        {reward?.antiGrindBlocked && (
          <div className="mb-5 rounded-2xl border border-slate-700 bg-slate-900/80 px-4 py-3 text-xs text-slate-300">
            <strong className="text-amber-200">
              🛡️ Regla Anti-Grind Activa:
            </strong>{' '}
            Repetir un capítulo ya superado en Ironman, Nuzlocke, Difícil o Tryhard sirve para practicar y mejorar tu Game Review, pero no vuelve a otorgar PokéCoronas ni tiradas de Pokédex regional.
          </div>
        )}

        {/* Battle Coin Rewards, Shadow Snagging, Casualty Indemnification & Biogeographical Pokédex Unlocks Banner */}
        {reward &&
          (reward.coinsEarned > 0 ||
            (reward.snaggedShadowPokemon &&
              reward.snaggedShadowPokemon.length > 0) ||
            (reward.unlockedPokedexSpecies &&
              reward.unlockedPokedexSpecies.length > 0)) && (
          <div className="mb-5 rounded-2xl border border-amber-400/45 bg-gradient-to-r from-amber-500/15 via-yellow-500/10 to-emerald-500/15 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-amber-200">
                <Coins className="h-5 w-5 text-amber-400" />
                <span className="font-display text-base font-extrabold">
                  +{reward.coinsEarned.toLocaleString()} {CURRENCY_NAME} ganadas
                </span>
              </div>
              {onOpenShop && (
                <button
                  onClick={onOpenShop}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-amber-400/50 bg-amber-500/20 px-3 py-1.5 text-xs font-extrabold text-amber-100 hover:bg-amber-500/30 cursor-pointer"
                >
                  <ShoppingBag className="h-3.5 w-3.5" />
                  Ir al Mercado Negro / Tienda
                </button>
              )}
            </div>
            <div className="mt-1.5 flex flex-wrap gap-2 text-[11px] text-slate-300">
              {reward.firstClearBonus > 0 && (
                <span className="rounded bg-amber-500/20 px-2 py-0.5 font-semibold text-amber-200">
                  Primera Victoria: +{reward.firstClearBonus.toLocaleString()} PC
                </span>
              )}
              {reward.replayBonus > 0 && (
                <span className="rounded bg-sky-500/20 px-2 py-0.5 font-semibold text-sky-200">
                  Bono Rejugar: +{reward.replayBonus.toLocaleString()} PC
                </span>
              )}
              {reward.lowResetBonus > 0 && (
                <span className="inline-flex items-center gap-1 rounded bg-emerald-500/20 px-2 py-0.5 font-semibold text-emerald-200">
                  <Sparkles className="h-3 w-3" />
                  Bono Maestría Kaizo (≤2 intentos): +{reward.lowResetBonus} PC
                </span>
              )}
              {(reward.casualtyIndemnificationCoins ?? 0) > 0 && (
                <span className="inline-flex items-center gap-1 rounded bg-rose-500/25 px-2 py-0.5 font-extrabold text-rose-100">
                  <Skull className="h-3 w-3" />
                  Liquidación por Bajas ({Math.round((1 - (reward.casualtyTaxRate ?? 0.15)) * 100)}%): +
                  {(reward.casualtyIndemnificationCoins ?? 0).toLocaleString()} PC
                </span>
              )}
            </div>

            {reward.casualtyBreakdown && reward.casualtyBreakdown.length > 0 && (
              <div className="mt-2.5 rounded-xl border border-rose-400/35 bg-rose-950/35 p-2.5 text-[11px]">
                <p className="font-extrabold text-rose-200">
                  💀 Indemnización por Bajas Permanentes (Impuesto de Reposición{' '}
                  {Math.round((reward.casualtyTaxRate ?? 0.15) * 100)}%):
                </p>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {reward.casualtyBreakdown.map((c, idx) => (
                    <span
                      key={`${c.species}-${idx}`}
                      className="rounded-lg border border-rose-400/30 bg-black/40 px-2 py-0.5 font-mono-code text-[10px] text-rose-100"
                    >
                      {c.species} ({c.bst} BST · {c.shopPrice} PC) → +{c.payout} PC
                    </span>
                  ))}
                </div>
              </div>
            )}

            {reward.unlockedPokedexSpecies &&
              reward.unlockedPokedexSpecies.length > 0 && (
                <div className="mt-3 space-y-2 border-t border-white/10 pt-3">
                  <p className="flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-sky-300">
                    <Map className="h-3.5 w-3.5 text-sky-400" />
                    Fauna Regional Desbloqueada en tu Pokédex de Compra (
                    {reward.unlockedPokedexSpecies[0].regionName})
                  </p>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {reward.unlockedPokedexSpecies.map((sp) => (
                      <div
                        key={sp.species}
                        className="flex items-center gap-2.5 rounded-xl border border-sky-400/35 bg-slate-950/80 p-2"
                      >
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-slate-800 bg-slate-900">
                          <PokemonSprite
                            species={sp.species}
                            side="p2"
                            className="h-10 w-10"
                          />
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-xs font-extrabold text-white">
                            {sp.species}
                          </p>
                          <p className="font-mono-code text-[10px] text-sky-200">
                            {sp.tier} · {sp.bst} BST · {sp.price.toLocaleString()} PC
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            {reward.rewardItems && reward.rewardItems.length > 0 && (
              <div className="mt-2 flex flex-wrap items-center gap-1.5 border-t border-white/10 pt-2 text-xs font-bold text-amber-200">
                <Sparkles className="h-3.5 w-3.5 text-amber-400" />
                <span>Objeto añadido a tu inventario:</span>
                {reward.rewardItems.map((item) => (
                  <span
                    key={item}
                    className="rounded-lg border border-amber-400/40 bg-amber-500/20 px-2 py-0.5 text-[11px] text-amber-100"
                  >
                    {item}
                  </span>
                ))}
              </div>
            )}
            {reward.snaggedShadowPokemon &&
              reward.snaggedShadowPokemon.length > 0 && (
                <div className="mt-3 space-y-2 border-t border-fuchsia-400/30 pt-3">
                  <p className="flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-fuchsia-300">
                    <Sparkles className="h-3.5 w-3.5 text-fuchsia-400" />
                    🟣 ¡Pokémon Oscuros Arrebatados (Colosseum / XD) → Cajas PC &amp; Pokédex!
                  </p>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {reward.snaggedShadowPokemon.map((sh) => (
                      <div
                        key={`snag-${sh.species}`}
                        className="flex items-center gap-2.5 rounded-xl border border-fuchsia-400/45 bg-fuchsia-950/45 p-2"
                      >
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border border-fuchsia-400/40 bg-slate-950">
                          <PokemonSprite
                            species={sh.species}
                            shiny={sh.species.toLowerCase() === 'lugia'}
                            side="p2"
                            className="h-11 w-11"
                          />
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-xs font-extrabold text-fuchsia-100">
                            🟣 {sh.species} Oscuro
                            {sh.alreadyOwned && (
                              <span className="ml-1 text-[9.5px] font-semibold text-slate-400">
                                (ya en PC)
                              </span>
                            )}
                          </p>
                          <p className="truncate text-[10px] text-fuchsia-200/85">
                            {sh.shadowMoves.length > 0
                              ? sh.shadowMoves.join(' · ')
                              : 'Corazón Cerrado (100%)'}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <p className="text-[10.5px] leading-snug text-fuchsia-200/85">
                    💡 Colócalos en la pestaña <strong>🟣 Cámara de Purificación</strong> de tus Cajas PC para bajar su Medidor de Corazón pasivamente — y al llegar a 0%, decide si <strong>Purificarlos</strong> (desbloquea Poder de la Amistad + movimiento exclusivo) o <strong>dejarlos Oscuros</strong> para conservar sus ataques Shadow rotos.
                  </p>
                </div>
              )}
            {reward.rewardPokemon && reward.rewardPokemon.length > 0 && (
              <div className="mt-3 space-y-2 border-t border-white/10 pt-3">
                <p className="flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-emerald-300">
                  <Sparkles className="h-3.5 w-3.5 text-emerald-400" />
                  ¡Nuevo Pokémon desbloqueado en tus Cajas PC para el resto de la run!
                </p>
                {reward.rewardPokemon.map((rp) => (
                  <div
                    key={rp.species}
                    className="flex items-center gap-3 rounded-xl border border-emerald-400/40 bg-slate-950/75 p-2.5"
                  >
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border border-emerald-400/30 bg-slate-900">
                      <PokemonSprite
                        species={rp.species}
                        side="p2"
                        className="h-12 w-12"
                      />
                    </div>
                    <div className="min-w-0">
                      <p className="font-display text-sm font-extrabold text-white">
                        {rp.species}{' '}
                        <span className="rounded bg-emerald-500/20 px-1.5 py-0.2 text-[10px] font-bold text-emerald-200">
                          Caja de Reserva
                        </span>
                      </p>
                      <p className="mt-0.5 text-[11px] leading-snug text-slate-300">
                        {rp.note}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {reward.newlyUnlockedChapterIds.length > 0 && (
              <div className="mt-2.5 flex flex-wrap items-center gap-1.5 border-t border-white/10 pt-2 text-xs font-bold text-emerald-300">
                <Unlock className="h-3.5 w-3.5" />
                <span>Nuevos escenarios desbloqueados:</span>
                {reward.newlyUnlockedChapterIds.map((cid) => {
                  const found = CHAPTERS.find((c) => c.id === cid);
                  return (
                    <span
                      key={cid}
                      className="rounded-lg border border-emerald-400/40 bg-emerald-500/15 px-2 py-0.5 text-[11px] text-emerald-100"
                    >
                      {found ? `${found.number}: ${fmt(found.title)}` : cid}
                    </span>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* X / Twitter Defeat & Run-Death Share Card (ALWAYS unlocked on defeat — NOT gated by Ironman/Nuzlocke!) */}
        {effectiveDeathSummary && (
          <div className="mb-5 rounded-2xl border-2 border-rose-500/55 bg-gradient-to-br from-rose-950/60 via-slate-950/95 to-black p-4 shadow-xl">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-rose-200">
                <Skull className="h-5 w-5 text-rose-400" />
                <h2 className="font-pixel text-xs font-bold tracking-wider sm:text-sm">
                  {effectiveDeathSummary.isTotalNuzlockeWipe
                    ? 'RUN MUERTA · WIPE TOTAL NUZLOCKE (0 VIVOS)'
                    : 'DERROTA REGISTRADA · COMPARTE EN X / TWITTER'}
                </h2>
              </div>
              <span className="rounded-lg border border-rose-400/40 bg-rose-500/20 px-2 py-0.5 text-[10px] font-extrabold text-rose-100">
                {DIFFICULTY_META[effectiveDeathSummary.difficulty]?.label ??
                  effectiveDeathSummary.difficulty}
                {effectiveDeathSummary.ironmanMode ? ' · Ironman' : ''}
                {effectiveDeathSummary.nuzlockePermadeath ? ' · Nuzlocke' : ''}
              </span>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
              <div className="rounded-xl border border-white/10 bg-black/45 p-2">
                <p className="text-[9.5px] uppercase text-slate-400">Capítulo</p>
                <p className="truncate font-bold text-white">
                  {effectiveDeathSummary.chapterLabel}
                </p>
              </div>
              <div className="rounded-xl border border-white/10 bg-black/45 p-2">
                <p className="text-[9.5px] uppercase text-slate-400">Turno</p>
                <p className="font-mono-code font-bold text-amber-300">
                  Turno {effectiveDeathSummary.turn}
                </p>
              </div>
              <div className="rounded-xl border border-white/10 bg-black/45 p-2">
                <p className="text-[9.5px] uppercase text-slate-400">Verdugo</p>
                <p className="truncate font-bold text-rose-300">
                  {effectiveDeathSummary.killerSpecies}
                </p>
              </div>
              <div className="rounded-xl border border-white/10 bg-black/45 p-2">
                <p className="text-[9.5px] uppercase text-slate-400">Golpe Final</p>
                <p className="truncate font-bold text-sky-200">
                  {effectiveDeathSummary.killerMove}
                </p>
              </div>
            </div>

            <pre className="mt-3 whitespace-pre-wrap rounded-xl border border-slate-800 bg-black/75 p-3 font-mono-code text-[11px] leading-relaxed text-slate-200">
              {defeatTweetText}
            </pre>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <a
                href={twitterShareUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-sky-400/60 bg-black px-4 py-2.5 text-xs font-extrabold text-white shadow-lg transition hover:bg-slate-900"
              >
                <Share2 className="h-4 w-4 text-sky-400" />
                Compartir mi derrota en 𝕏 / Twitter
              </a>
              <button
                type="button"
                onClick={() => {
                  if (navigator.clipboard) {
                    void navigator.clipboard.writeText(defeatTweetText);
                  }
                  setCopiedTweet(true);
                  window.setTimeout(() => setCopiedTweet(false), 2000);
                }}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-900 px-3.5 py-2.5 text-xs font-bold text-slate-200 hover:border-amber-400/50 hover:text-white cursor-pointer"
              >
                {copiedTweet ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-emerald-400" />
                    ¡Copiado!
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" />
                    Copiar texto
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Summary Stats */}
        {battleSummary && (
          <div
            className={`mb-5 grid gap-3 text-center ${
              !isVersus && attemptNumber ? 'grid-cols-2 sm:grid-cols-4' : 'grid-cols-3'
            }`}
          >
            <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-3">
              <p className="text-[11px] uppercase text-slate-400">Turnos</p>
              <p className="font-mono-code mt-0.5 text-lg font-bold text-white">
                {battleSummary.turn}
              </p>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-3">
              <p className="text-[11px] uppercase text-slate-400">Rivales KO</p>
              <p className="font-mono-code mt-0.5 text-lg font-bold text-amber-300">
                {battleSummary.koCountP2} / {battleSummary.totalP2}
              </p>
            </div>
            {!isVersus && attemptNumber != null && (
              <div className="rounded-2xl border border-amber-400/25 bg-amber-500/10 p-3">
                <p className="text-[11px] uppercase text-amber-200/80">
                  {won ? 'Victoria en' : 'Intentos'}
                </p>
                <p className="font-mono-code mt-0.5 text-lg font-bold text-amber-200">
                  #{attemptNumber}
                </p>
              </div>
            )}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-3">
              <p className="text-[11px] uppercase text-slate-400">Formato</p>
              <p className="mt-0.5 text-xs font-bold text-sky-300">
                {config.formatLabel ??
                  (config.format === 'triples'
                    ? 'Triples'
                    : config.format === 'doubles'
                      ? 'Dobles'
                      : 'Singles')}
              </p>
            </div>
          </div>
        )}

        {/* Chess.com-style On-Demand Post-Game Review */}
        {battleSummary && (
          <GameReviewPanel
            snapshot={battleSummary}
            config={config}
            profile={profile}
            aiSettings={aiSettings}
            onOpenAISettings={onOpenAISettings}
          />
        )}

        {/* Loop Navigation Actions */}
        <div className="flex flex-wrap gap-3">
          {isVersus ? (
            <button
              onClick={onOpenVersus}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-amber-500 to-yellow-500 px-5 py-3 text-sm font-bold text-slate-950 shadow-lg shadow-amber-500/20 transition hover:brightness-110 cursor-pointer"
            >
              <Wand2 className="h-4 w-4" />
              Volver al Modo Versus
            </button>
          ) : (
            <>
              <button
                onClick={onOpenChapters}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-amber-500 to-yellow-500 px-5 py-3 text-sm font-bold text-slate-950 shadow-lg shadow-amber-500/20 transition hover:brightness-110 cursor-pointer"
              >
                {isPrologueCh1 ? (
                  <>
                    <Map className="h-4 w-4" />
                    Ir al Selector de Capítulos (El Juego)
                  </>
                ) : (
                  <>
                    <BookOpen className="h-4 w-4" />
                    Selector de Capítulos
                  </>
                )}
              </button>

              <button
                onClick={onReplayChapter}
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-sky-400/40 bg-sky-500/10 px-4 py-3 text-sm font-semibold text-sky-200 transition hover:bg-sky-500/20 cursor-pointer"
              >
                <RotateCcw className="h-4 w-4" />
                Probar otras decisiones
              </button>
            </>
          )}

          <button
            onClick={onRetryBattle}
            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm font-semibold text-slate-200 transition hover:border-amber-400/40 cursor-pointer"
          >
            <RefreshCw className="h-4 w-4" />
            Repetir Combate
          </button>

          <button
            onClick={onBackHome}
            title="Ir al inicio"
            className="inline-flex items-center justify-center rounded-2xl border border-slate-700 bg-slate-900 px-3.5 py-3 text-slate-300 transition hover:text-white cursor-pointer"
          >
            <Home className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
