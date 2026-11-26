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
import { computeActiveSocialLinkPerks } from '../data/socialLinksCatalog';
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
}) => {
  const [copiedTweet, setCopiedTweet] = useState(false);
  const isVersus = Boolean(config.isVersusMatch);
  const isPrologueCh1 = chapter.id === 'ch1-wyndon-chase';

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

        {/* Romance / Harem Ending & Ultra Nuzlocke Survival Banner */}
        {!isVersus && profile && (() => {
          const perks = computeActiveSocialLinkPerks(profile);
          const fallenInBattle =
            profile.nuzlockePermadeath && battleSummary
              ? battleSummary.p1.party.filter((p) => p.fainted).map((p) => p.species)
              : [];
          return (
            <div className="mb-5 space-y-3">
              {won && perks.activeEndingKind === 'harem' && (
                <div className="rounded-2xl border border-amber-300/65 bg-gradient-to-r from-fuchsia-950/70 via-amber-950/50 to-rose-950/70 p-4">
                  <div className="flex items-center gap-2 text-amber-200">
                    <Crown className="h-4 w-4 text-amber-300" />
                    <span className="font-display text-sm font-extrabold uppercase tracking-wider">
                      👑 Ending Secreto Desbloqueado: Harem — Corona de Vínculos
                    </span>
                  </div>
                  <p className="mt-1.5 text-xs leading-relaxed text-amber-100/90">
                    Maxeaste Rango 3 con todos los aliados romanceables del Batch 1 (El Pelirrojo, La Duelista y La Campeona). Ningún trono se sostiene solo: la nueva corona de Galar nace de cada pacto forjado durante el exilio.
                  </p>
                </div>
              )}
              {won && perks.activeEndingKind === 'single' && perks.activeEndingNpc && (
                <div className="rounded-2xl border border-fuchsia-400/45 bg-fuchsia-950/35 p-4">
                  <div className="flex items-center gap-2 text-fuchsia-200">
                    <Heart className="h-4 w-4 fill-fuchsia-400 text-fuchsia-400" />
                    <span className="font-display text-sm font-extrabold">
                      {perks.activeEndingNpc.endingTitle}
                    </span>
                  </div>
                  <p className="mt-1 text-xs leading-relaxed text-slate-200">
                    {perks.activeEndingNpc.endingSummary}
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

        {/* Battle Coin Rewards & Chapter Unlocks Banner */}
        {reward && reward.coinsEarned > 0 && (
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
                  Gastar en la Tienda
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
            </div>
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
                      {found ? `${found.number}: ${found.title}` : cid}
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
