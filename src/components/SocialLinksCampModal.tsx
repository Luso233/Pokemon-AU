import React, { useState } from 'react';
import {
  CheckCircle2,
  Coins,
  Crown,
  Flame,
  Heart,
  Home,
  Lock,
  Pencil,
  Play,
  ShieldAlert,
  Skull,
  Sparkles,
  Sprout,
  Swords,
  Users,
  X,
} from 'lucide-react';
import {
  CURRENCY_SHORT,
  DIFFICULTY_META,
  DIFFICULTY_ORDER,
  VN_PACING_META,
} from '../data/economyCatalog';
import {
  computeActiveSocialLinkPerks,
  PLAYABLE_ROMANCE_NPCS,
  ROMANCE_ROSTER,
  type RomanceNpcDefinition,
} from '../data/socialLinksCatalog';
import {
  applyRivalNameToText,
  getRivalName,
  RIVAL_NAME_PRESETS,
  sanitizeRivalName,
} from '../engine/rivalName';
import type {
  BattleDifficultyMode,
  BerryKind,
  CustomTeamMember,
  PlayerSaveProfile,
  VnPacingMode,
} from '../types/game';
import { CharacterPortrait } from './CharacterPortrait';
import { PokemonIcon } from './PokemonSprite';

interface SocialLinksCampModalProps {
  open: boolean;
  onClose: () => void;
  profile: PlayerSaveProfile;
  onStartRomanceRank: (npcId: string, targetRank: 1 | 2 | 3) => void;
  onToggleRunModifiers: (patch: {
    ironmanMode?: boolean;
    nuzlockePermadeath?: boolean;
    defaultDifficulty?: BattleDifficultyMode;
    vnPacingMode?: VnPacingMode;
  }) => void;
  onCampHeal: (
    species: string,
    action: 'potion' | 'full_heal' | 'emergency_free' | 'lum' | 'sitrus' | 'leppa'
  ) => { ok: boolean; error?: string };
  onPlantBerry: (
    plotIndex: number,
    berry: BerryKind
  ) => { ok: boolean; error?: string };
  onHarvestBerry: (plotIndex: number) => { ok: boolean; error?: string };
  onRecruitHousePokemon: (mon: CustomTeamMember, slotIndex: number) => void;
  onResetSurvivalState: () => void;
  onRenameRival?: (name: string) => void;
}

type ModalTab = 'links' | 'camp' | 'house' | 'rules';

export const SocialLinksCampModal: React.FC<SocialLinksCampModalProps> = ({
  open,
  onClose,
  profile,
  onStartRomanceRank,
  onToggleRunModifiers,
  onCampHeal,
  onPlantBerry,
  onHarvestBerry,
  onRecruitHousePokemon,
  onResetSurvivalState,
  onRenameRival,
}) => {
  const [tab, setTab] = useState<ModalTab>('links');
  const [batchFilter, setBatchFilter] = useState<'all' | 1 | 2 | 3>('all');
  const [notice, setNotice] = useState<string | null>(null);
  const [recruitSlot, setRecruitSlot] = useState<number>(0);
  const [showRivalRename, setShowRivalRename] = useState(false);
  const [rivalDraft, setRivalDraft] = useState<string>(() =>
    getRivalName(profile)
  );

  if (!open) return null;

  const rivalName = getRivalName(profile);
  const fmt = (text: string) => applyRivalNameToText(text, rivalName);

  const commitRivalName = (raw: string) => {
    const clean = sanitizeRivalName(raw);
    setRivalDraft(clean);
    onRenameRival?.(clean);
    setNotice(`🗡️ Tu rival ahora se llama "${clean}" en diálogos, combates y vínculos.`);
  };

  const perks = computeActiveSocialLinkPerks(profile);
  const filteredRoster = ROMANCE_ROSTER.filter(
    (n) => batchFilter === 'all' || n.batch === batchFilter
  );

  const potionCost = Math.round(250 * (1 - perks.campHealDiscountPct / 100));
  const fullHealCost = Math.round(550 * (1 - perks.campHealDiscountPct / 100));

  const renderNpcCard = (npc: RomanceNpcDefinition) => {
    const prog = profile.socialLinks[npc.id] ?? {
      rank: 0,
      r1Done: false,
      r2Done: false,
      r3Done: false,
    };
    const isFirstEnding = profile.firstRomanceMaxedId === npc.id;

    return (
      <div
        key={npc.id}
        className={`rounded-2xl border p-4 transition ${
          npc.playableNow
            ? prog.rank === 3
              ? 'border-fuchsia-400/55 bg-gradient-to-br from-fuchsia-950/35 to-slate-950/90'
              : 'border-slate-700/90 bg-slate-900/80'
            : 'border-slate-800/80 bg-slate-950/60 opacity-75'
        }`}
      >
        <div className="flex items-start gap-3">
          <div className="h-14 w-14 shrink-0 overflow-hidden rounded-2xl border border-amber-400/40 bg-slate-950 p-0.5">
            {npc.charId ? (
              <CharacterPortrait
                charId={npc.charId}
                variant="bust"
                className="h-full w-full object-cover object-top"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-slate-600">
                <Lock className="h-5 w-5" />
              </div>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-1.5">
              <span
                className={`rounded-md border px-1.5 py-0.5 text-[9px] font-extrabold uppercase tracking-wider ${
                  npc.roleTrack === 'champion'
                    ? 'border-amber-400/60 bg-amber-500/20 text-amber-200'
                    : npc.roleTrack === 'elite-4'
                      ? 'border-violet-400/50 bg-violet-500/20 text-violet-200'
                      : 'border-fuchsia-400/45 bg-fuchsia-500/15 text-fuchsia-200'
                }`}
              >
                {npc.roleBadge}
              </span>
              {isFirstEnding && (
                <span className="rounded-md border border-pink-400/60 bg-pink-500/25 px-1.5 py-0.5 text-[9px] font-extrabold text-pink-100">
                  ♥ Ending Principal
                </span>
              )}
              <span className="ml-auto inline-flex items-center gap-0.5 text-xs font-extrabold text-fuchsia-300">
                {[1, 2, 3].map((r) => (
                  <Heart
                    key={r}
                    className={`h-3.5 w-3.5 ${
                      prog.rank >= r
                        ? 'fill-fuchsia-400 text-fuchsia-400'
                        : 'text-slate-700'
                    }`}
                  />
                ))}
                <span className="ml-1 font-mono-code text-[10px]">
                  R{prog.rank}/3
                </span>
              </span>
            </div>

            <div className="mt-1 flex flex-wrap items-center gap-2">
              <h3 className="font-display text-sm font-bold text-white">
                {npc.id === 'assassin' ? fmt(npc.name) : npc.name}
              </h3>
              {npc.id === 'assassin' && onRenameRival && (
                <button
                  type="button"
                  onClick={() => {
                    setRivalDraft(rivalName);
                    setShowRivalRename((prev) => !prev);
                  }}
                  className="inline-flex items-center gap-1 rounded-lg border border-amber-400/45 bg-amber-500/15 px-2 py-0.5 text-[10px] font-extrabold text-amber-200 transition hover:bg-amber-500/25 cursor-pointer"
                >
                  <Pencil className="h-2.5 w-2.5" />
                  {showRivalRename ? 'Cerrar Editor' : 'Renombrar Rival'}
                </button>
              )}
            </div>
            <p className="text-[11px] text-amber-200/80">
              {npc.id === 'assassin' ? fmt(npc.title) : npc.title}
            </p>
            <p className="mt-0.5 text-[10px] font-bold text-sky-300">
              🎯 Arquetipo: {npc.gimmickTag}
            </p>
            <p className="mt-1 text-[11px] leading-relaxed text-slate-300">
              {npc.id === 'assassin' ? fmt(npc.bio) : npc.bio}
            </p>
            {npc.id === 'assassin' && showRivalRename && onRenameRival && (
              <div className="mt-2.5 rounded-xl border border-fuchsia-400/45 bg-slate-950/90 p-2.5">
                <p className="text-[10px] font-extrabold uppercase tracking-wider text-fuchsia-200">
                  ✏️ Privilegio Ancestral Pokémon · Nombra a tu Rival
                </p>
                <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                  <input
                    type="text"
                    value={rivalDraft}
                    onChange={(e) => setRivalDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        commitRivalName(rivalDraft);
                        setShowRivalRename(false);
                      }
                    }}
                    maxLength={24}
                    aria-label="Renombrar rival"
                    className="w-44 rounded-lg border border-fuchsia-400/50 bg-slate-900 px-2.5 py-1 text-xs font-bold text-white focus:border-amber-400 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      commitRivalName(rivalDraft);
                      setShowRivalRename(false);
                    }}
                    className="rounded-lg bg-amber-400 px-2.5 py-1 text-[10.5px] font-extrabold text-slate-950 hover:brightness-110 cursor-pointer"
                  >
                    Guardar
                  </button>
                </div>
                <div className="mt-2 flex flex-wrap gap-1">
                  {RIVAL_NAME_PRESETS.map((preset) => (
                    <button
                      key={preset.name}
                      type="button"
                      onClick={() => commitRivalName(preset.name)}
                      title={preset.tag}
                      className={`rounded-md border px-2 py-0.5 text-[10px] font-bold transition cursor-pointer ${
                        rivalName === preset.name
                          ? 'border-amber-400 bg-amber-500/25 text-amber-100'
                          : 'border-slate-700 bg-slate-900 text-slate-300 hover:border-fuchsia-400/60 hover:text-white'
                      }`}
                    >
                      {preset.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {npc.bossAceRule && (
              <div className="mt-2 rounded-xl border border-rose-400/35 bg-rose-950/25 px-2.5 py-1.5 text-[10.5px]">
                <span className="font-extrabold text-rose-200">
                  ⚡ Regla de Jefe ({npc.bossAceRule.ruleName}) · As {npc.bossAceRule.aceSpecies}:
                </span>{' '}
                <span className="text-slate-300">
                  {npc.id === 'assassin'
                    ? fmt(npc.bossAceRule.ruleDetail)
                    : npc.bossAceRule.ruleDetail}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* 3-Rank Progression Strip */}
        <div className="mt-3 grid gap-2 sm:grid-cols-3">
          {/* Rank 1 */}
          <div
            className={`rounded-xl border p-2.5 text-[10.5px] ${
              prog.rank >= 1
                ? 'border-emerald-400/40 bg-emerald-500/10'
                : 'border-slate-800 bg-slate-950/80'
            }`}
          >
            <div className="flex items-center justify-between font-bold text-emerald-200">
              <span>Cap. 1 · Duelo de Encuentro</span>
              {prog.rank >= 1 && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />}
            </div>
            <p className="mt-1 font-semibold text-white">{npc.rank1PerkTitle}</p>
            <p className="mt-0.5 text-[10px] text-slate-400">{npc.rank1PerkDetail}</p>
            {npc.playableNow && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onStartRomanceRank(npc.id, 1);
                }}
                className="mt-2 inline-flex w-full items-center justify-center gap-1 rounded-lg bg-emerald-500/20 px-2 py-1 text-[10px] font-extrabold text-emerald-200 hover:bg-emerald-500/30 cursor-pointer"
              >
                <Play className="h-2.5 w-2.5 fill-current" />
                {prog.rank >= 1 ? 'Repetir Duelo R1' : 'Jugar Duelo R1'}
              </button>
            )}
          </div>

          {/* Rank 2 */}
          <div
            className={`rounded-xl border p-2.5 text-[10.5px] ${
              prog.rank >= 2
                ? 'border-sky-400/40 bg-sky-500/10'
                : 'border-slate-800 bg-slate-950/80'
            }`}
          >
            <div className="flex items-center justify-between font-bold text-sky-200">
              <span>Cap. 2 · Amigos Tag 2v2</span>
              {prog.rank >= 2 && <CheckCircle2 className="h-3.5 w-3.5 text-sky-400" />}
            </div>
            <p className="mt-1 font-semibold text-white">{npc.rank2PerkTitle}</p>
            <p className="mt-0.5 text-[10px] text-slate-400">{npc.rank2PerkDetail}</p>
            {npc.playableNow && (
              <button
                type="button"
                disabled={prog.rank < 1 && !profile.devModeEnabled}
                onClick={() => {
                  onClose();
                  onStartRomanceRank(npc.id, 2);
                }}
                className="mt-2 inline-flex w-full items-center justify-center gap-1 rounded-lg bg-sky-500/20 px-2 py-1 text-[10px] font-extrabold text-sky-200 hover:bg-sky-500/30 disabled:cursor-not-allowed disabled:opacity-40 cursor-pointer"
              >
                <Users className="h-2.5 w-2.5" />
                {prog.rank >= 2
                  ? 'Repetir Amigos 2v2'
                  : prog.rank >= 1 || profile.devModeEnabled
                    ? 'Pelear Amigos 2v2'
                    : 'Requiere R1'}
              </button>
            )}
          </div>

          {/* Rank 3 */}
          <div
            className={`rounded-xl border p-2.5 text-[10.5px] ${
              prog.rank >= 3
                ? 'border-fuchsia-400/50 bg-fuchsia-500/15'
                : 'border-slate-800 bg-slate-950/80'
            }`}
          >
            <div className="flex items-center justify-between font-bold text-rose-200">
              <span>Cap. 3 · Revancha Cap Alta</span>
              {prog.rank >= 3 && <Crown className="h-3.5 w-3.5 text-amber-300" />}
            </div>
            <p className="mt-1 font-semibold text-white">{npc.rank3PerkTitle}</p>
            <p className="mt-0.5 text-[10px] text-slate-400">{npc.rank3PerkDetail}</p>
            {npc.playableNow && (
              <button
                type="button"
                disabled={prog.rank < 2 && !profile.devModeEnabled}
                onClick={() => {
                  onClose();
                  onStartRomanceRank(npc.id, 3);
                }}
                className="mt-2 inline-flex w-full items-center justify-center gap-1 rounded-lg bg-gradient-to-r from-rose-500/30 to-fuchsia-500/30 px-2 py-1 text-[10px] font-extrabold text-rose-100 hover:brightness-125 disabled:cursor-not-allowed disabled:opacity-40 cursor-pointer"
              >
                <Swords className="h-2.5 w-2.5" />
                {prog.rank >= 3
                  ? 'Repetir Revancha R3'
                  : prog.rank >= 2 || profile.devModeEnabled
                    ? 'Aceptar Revancha R3'
                    : 'Requiere R2'}
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/82 p-4 backdrop-blur-sm">
      <div className="relative flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-3xl border border-fuchsia-400/35 bg-[#080d1b] text-slate-100 shadow-2xl">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 bg-slate-950/90 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-fuchsia-400/50 bg-fuchsia-500/20 text-fuchsia-300">
              <Heart className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-display text-lg font-bold text-white">
                Vínculos, Campamento Ironman & Reglas Diablo
              </h2>
              <p className="text-[11px] text-slate-400">
                13 Romanceables (8 Sellos + Alto Mando + Campeona) · Huerto de Bayas · Casa de Refuerzos · Ultra Nuzlocke
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-xl border border-amber-400/40 bg-amber-500/15 px-2.5 py-1 text-xs font-extrabold text-amber-200">
              <Coins className="h-3.5 w-3.5 text-amber-400" />
              {profile.coins.toLocaleString()} {CURRENCY_SHORT}
            </span>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/90 bg-slate-950/60 px-6 py-2.5">
          <div className="flex flex-wrap gap-1.5">
            {(
              [
                { id: 'links', label: `Vínculos (${perks.maxedPlayableCount}/${PLAYABLE_ROMANCE_NPCS.length} R3)`, icon: Heart },
                { id: 'camp', label: `Campamento & Huerto (${perks.maxBerryPlots} parcelas)`, icon: Sprout },
                { id: 'house', label: `Casa de Aliados (${perks.unlockedHousePokemon.length})`, icon: Home },
                { id: 'rules', label: 'Ironman · Nuzlocke · Diablo', icon: Flame },
              ] as const
            ).map((t) => {
              const Icon = t.icon;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTab(t.id)}
                  className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-bold transition cursor-pointer ${
                    tab === t.id
                      ? 'border-fuchsia-400 bg-fuchsia-500/20 text-fuchsia-100'
                      : 'border-slate-800 bg-slate-900 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {t.label}
                </button>
              );
            })}
          </div>

          {/* Ending Status Pill */}
          <div className="text-[11px] font-bold">
            {perks.isHaremUnlocked ? (
              <span className="inline-flex items-center gap-1 rounded-full border border-amber-300/70 bg-gradient-to-r from-fuchsia-500/30 to-amber-500/30 px-3 py-1 text-amber-100">
                <Crown className="h-3.5 w-3.5 text-amber-300" />
                ENDING HAREM DESBLOQUEADO (Batch 1 Completo)
              </span>
            ) : perks.activeEndingNpc ? (
              <span className="inline-flex items-center gap-1 rounded-full border border-pink-400/50 bg-pink-500/20 px-3 py-1 text-pink-200">
                <Heart className="h-3 w-3 fill-pink-400 text-pink-400" />
                Ending Actual: {fmt(perks.activeEndingNpc.name)}
              </span>
            ) : (
              <span className="text-slate-500">
                Ending Romántico: Ningún Rango 3 aún
              </span>
            )}
          </div>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {notice && (
            <div className="mb-4 rounded-2xl border border-amber-400/45 bg-amber-500/15 px-4 py-2.5 text-xs font-semibold text-amber-100">
              {notice}
            </div>
          )}

          {/* TAB 1: SOCIAL LINKS & ROMANCE ROSTER (13 NPCs in 3 Batches) */}
          {tab === 'links' && (
            <div className="space-y-4">
              {/* Active Perks Summary Bar */}
              <div className="grid gap-2 rounded-2xl border border-fuchsia-400/25 bg-fuchsia-950/20 p-3.5 text-[11px] sm:grid-cols-4">
                <div>
                  <span className="text-[9.5px] uppercase text-slate-400">Scouting ({rivalName} R1)</span>
                  <p className="text-sm font-extrabold text-sky-300">
                    {perks.hasAntiDiabloScouting ? '✓ Activo en Briefing' : 'Bloqueado (R1)'}
                  </p>
                </div>
                <div>
                  <span className="text-[9.5px] uppercase text-slate-400">Guerrilla (Duelista R1)</span>
                  <p className="font-mono-code text-sm font-extrabold text-emerald-300">
                    -{perks.campHealDiscountPct}% Cura · {perks.maxBerryPlots} parc.
                  </p>
                </div>
                <div>
                  <span className="text-[9.5px] uppercase text-slate-400">Doctrina (Campeona R1)</span>
                  <p className="text-sm font-extrabold text-amber-300">
                    {perks.hasFreeTutoringPerk ? '✓ Tutoría 0 PC' : 'Estándar'}
                  </p>
                </div>
                <div>
                  <span className="text-[9.5px] uppercase text-slate-400">Bono de Monedas</span>
                  <p className="font-mono-code text-sm font-extrabold text-fuchsia-300">
                    x{perks.victoryCoinMultiplier.toFixed(1)} · +{perks.passivePpRegen} PP
                  </p>
                </div>
              </div>

              {/* Batch Filter Pills */}
              <div className="flex flex-wrap items-center gap-1.5">
                {(
                  [
                    { id: 'all', label: 'Todos (13 · 39 Caps)' },
                    { id: 1, label: 'Batch 1 · Pilares (3)' },
                    { id: 2, label: 'Batch 2 · Exilio Regional (6)' },
                    { id: 3, label: 'Batch 3 · Alto Mando (4)' },
                  ] as const
                ).map((b) => (
                  <button
                    key={String(b.id)}
                    type="button"
                    onClick={() => setBatchFilter(b.id)}
                    className={`rounded-xl border px-3 py-1 text-[11px] font-bold transition cursor-pointer ${
                      batchFilter === b.id
                        ? 'border-amber-400 bg-amber-500/20 text-amber-200'
                        : 'border-slate-800 bg-slate-900 text-slate-400 hover:text-white'
                    }`}
                  >
                    {b.label}
                  </button>
                ))}
              </div>

              <div className="space-y-3">
                {filteredRoster.map(renderNpcCard)}
              </div>
            </div>
          )}

          {/* TAB 2: IRONMAN CAMP HEALING & BERRY GARDEN */}
          {tab === 'camp' && (
            <div className="space-y-5">
              {/* Berry Pouch + Garden Plots */}
              <div className="rounded-2xl border border-emerald-400/30 bg-slate-900/80 p-4">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h3 className="font-display text-base font-bold text-white">
                      Huerto de Bayas del Exilio ({profile.campGarden.length} parcelas)
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      Planta semillas por 100 PC; maduran tras 1 combate y rinden x2 bayas para sobrevivir al modo Ironman.
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2 text-xs font-bold">
                    <span className="rounded-lg border border-emerald-400/40 bg-emerald-500/15 px-2.5 py-1 text-emerald-200">
                      Lum (Estado): {profile.campBerries.lum}
                    </span>
                    <span className="rounded-lg border border-amber-400/40 bg-amber-500/15 px-2.5 py-1 text-amber-200">
                      Sitrus (+40% PS): {profile.campBerries.sitrus}
                    </span>
                    <span className="rounded-lg border border-sky-400/40 bg-sky-500/15 px-2.5 py-1 text-sky-200">
                      Leppa (+10 PP): {profile.campBerries.leppa}
                    </span>
                  </div>
                </div>

                <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
                  {profile.campGarden.map((plot) => (
                    <div
                      key={plot.plotIndex}
                      className="rounded-xl border border-slate-800 bg-slate-950/85 p-3"
                    >
                      <p className="text-[10px] font-bold uppercase text-slate-400">
                        Parcela #{plot.plotIndex + 1}
                      </p>
                      {plot.berry ? (
                        <div className="mt-1.5 space-y-2">
                          <p className="text-xs font-extrabold text-emerald-200">
                            Baya {plot.berry.toUpperCase()}{' '}
                            {plot.battlesLeft === 0
                              ? '· ¡Lista para cosechar!'
                              : `· Falta ${plot.battlesLeft} combate`}
                          </p>
                          <button
                            type="button"
                            disabled={plot.battlesLeft > 0}
                            onClick={() => {
                              const res = onHarvestBerry(plot.plotIndex);
                              setNotice(
                                res.ok
                                  ? `🌿 ¡Cosechaste x2 Baya ${plot.berry?.toUpperCase()}!`
                                  : res.error || 'Aún creciendo.'
                              );
                            }}
                            className="w-full rounded-lg bg-emerald-500/25 px-3 py-1.5 text-[11px] font-extrabold text-emerald-100 hover:bg-emerald-500/35 disabled:opacity-40 cursor-pointer"
                          >
                            Cosechar (+2)
                          </button>
                        </div>
                      ) : (
                        <div className="mt-2 grid grid-cols-3 gap-1">
                          {(['lum', 'sitrus', 'leppa'] as BerryKind[]).map((b) => (
                            <button
                              key={b}
                              type="button"
                              onClick={() => {
                                const res = onPlantBerry(plot.plotIndex, b);
                                setNotice(
                                  res.ok
                                    ? `🌱 Plantaste Baya ${b.toUpperCase()} (100 PC).`
                                    : res.error || 'Error al plantar.'
                                );
                              }}
                              className="rounded-lg border border-slate-700 bg-slate-900 py-1 text-[10px] font-bold text-slate-200 hover:border-emerald-400/50 hover:text-emerald-200 cursor-pointer"
                            >
                              {b.toUpperCase()}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Persistent Ironman Party Clinic */}
              <div className="rounded-2xl border border-amber-400/30 bg-slate-900/80 p-4">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h3 className="font-display text-base font-bold text-white">
                      Enfermería del Campamento (Persistencia Ironman)
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      Poción (+50% PS): {potionCost} PC · Cura Total: {fullHealCost} PC
                      {perks.campHealDiscountPct > 0
                        ? ` (¡-${perks.campHealDiscountPct}% por La Duelista R1!)`
                        : ''}
                      {profile.freeEmergencyHeals > 0
                        ? ` · Cargas gratis de Campeona: ${profile.freeEmergencyHeals}`
                        : ''}
                    </p>
                  </div>
                </div>

                {!profile.ironmanPartyState ? (
                  <p className="rounded-xl border border-slate-800 bg-slate-950/70 px-4 py-3 text-xs text-slate-400">
                    Tu equipo está al 100% de salud. Activa el <strong>Modo Ironman</strong> en la pestaña de reglas para que el daño, estados y PP persistan entre capítulos.
                  </p>
                ) : (
                  <div className="grid gap-2.5 sm:grid-cols-2">
                    {profile.ironmanPartyState.pokemon.map((mon) => {
                      const pct = Math.round((mon.hp / Math.max(1, mon.maxhp)) * 100);
                      return (
                        <div
                          key={mon.species}
                          className="rounded-xl border border-slate-800 bg-slate-950/85 p-3"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <PokemonIcon species={mon.species} />
                              <div>
                                <p className="text-xs font-bold text-white">
                                  {mon.species}
                                </p>
                                <p className="font-mono-code text-[10px] text-slate-400">
                                  {mon.fainted
                                    ? '💀 DEBILITADO'
                                    : `${mon.hp}/${mon.maxhp} PS (${pct}%) ${
                                        mon.status ? `· ${mon.status.toUpperCase()}` : ''
                                      }`}
                                </p>
                              </div>
                            </div>
                          </div>
                          <div className="mt-2 flex flex-wrap gap-1">
                            <button
                              type="button"
                              onClick={() => {
                                const r = onCampHeal(mon.species, 'potion');
                                setNotice(r.ok ? `✓ ${mon.species} recuperó PS.` : r.error || '');
                              }}
                              className="rounded bg-amber-500/20 px-2 py-0.5 text-[10px] font-bold text-amber-200 hover:bg-amber-500/30 cursor-pointer"
                            >
                              Poción ({potionCost})
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                const r = onCampHeal(mon.species, 'full_heal');
                                setNotice(r.ok ? `✓ ${mon.species} curado al 100%.` : r.error || '');
                              }}
                              className="rounded bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-200 hover:bg-emerald-500/30 cursor-pointer"
                            >
                              Total ({fullHealCost})
                            </button>
                            {profile.freeEmergencyHeals > 0 && (
                              <button
                                type="button"
                                onClick={() => {
                                  const r = onCampHeal(mon.species, 'emergency_free');
                                  setNotice(r.ok ? `👑 Curación Real aplicada a ${mon.species}.` : r.error || '');
                                }}
                                className="rounded bg-fuchsia-500/25 px-2 py-0.5 text-[10px] font-bold text-fuchsia-100 cursor-pointer"
                              >
                                Gratis (Campeona)
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => {
                                const r = onCampHeal(mon.species, 'sitrus');
                                setNotice(r.ok ? `🍊 Baya Sitrus usada en ${mon.species}.` : r.error || '');
                              }}
                              className="rounded bg-slate-800 px-2 py-0.5 text-[10px] font-bold text-slate-200 cursor-pointer"
                            >
                              Sitrus
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                const r = onCampHeal(mon.species, 'lum');
                                setNotice(r.ok ? `🌿 Baya Lum usada en ${mon.species}.` : r.error || '');
                              }}
                              className="rounded bg-slate-800 px-2 py-0.5 text-[10px] font-bold text-slate-200 cursor-pointer"
                            >
                              Lum
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                const r = onCampHeal(mon.species, 'leppa');
                                setNotice(r.ok ? `⚡ Baya Leppa usada en ${mon.species}.` : r.error || '');
                              }}
                              className="rounded bg-slate-800 px-2 py-0.5 text-[10px] font-bold text-slate-200 cursor-pointer"
                            >
                              Leppa
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: HOUSE REINFORCEMENTS (RANK 3) & NUZLOCKE GRAVEYARD */}
          {tab === 'house' && (
            <div className="space-y-5">
              <div className="rounded-2xl border border-fuchsia-400/30 bg-slate-900/80 p-4">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h3 className="font-display text-base font-bold text-white">
                      Casa de Aliados — Refuerzos de Vínculo Rango 3
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      Cuando alcanzas Rango 3 venciendo la Rematch Injusta de un aliado, sus Pokémon competitivos quedan disponibles en tu Casa para reemplazar bajas del Ultra Nuzlocke.
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs">
                    <span className="text-slate-400">Enviar a Slot:</span>
                    <select
                      value={recruitSlot}
                      onChange={(e) => setRecruitSlot(Number(e.target.value))}
                      className="rounded-lg border border-slate-700 bg-slate-950 px-2 py-1 text-xs font-bold text-white"
                    >
                      {[0, 1, 2, 3, 4, 5].map((s) => (
                        <option key={s} value={s}>
                          Slot {s + 1} ({profile.customTeam[s]?.species ?? 'Vacío'})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {perks.unlockedHousePokemon.length === 0 ? (
                  <p className="rounded-xl border border-dashed border-slate-700 bg-slate-950/60 px-4 py-4 text-xs text-slate-400">
                    Aún no has completado ninguna Revancha de Cap Alta (Rango 3). Sube a Rango 3 con cualquiera de los <strong>13 aliados romanceables</strong> del mundo para desbloquear sus 3 Pokémon élite aquí.
                  </p>
                ) : (
                  <div className="grid gap-2.5 sm:grid-cols-3">
                    {perks.unlockedHousePokemon.map((mon) => (
                      <div
                        key={`${mon.donorId}-${mon.species}`}
                        className="rounded-xl border border-fuchsia-400/30 bg-slate-950/85 p-3"
                      >
                        <div className="flex items-center gap-2">
                          <PokemonIcon species={mon.species} />
                          <div className="min-w-0">
                            <p className="truncate text-xs font-bold text-white">
                              {mon.species}
                            </p>
                            <p className="truncate text-[10px] text-fuchsia-300">
                              De: {fmt(mon.donorName)}
                            </p>
                          </div>
                        </div>
                        <p className="mt-1.5 text-[10px] text-slate-400">
                          @ {mon.item} · {mon.ability}
                        </p>
                        <p className="mt-0.5 text-[10px] text-slate-300">
                          {mon.moves.join(' / ')}
                        </p>
                        <button
                          type="button"
                          onClick={() => {
                            onRecruitHousePokemon(mon, recruitSlot);
                            setNotice(
                              `🏠 ${mon.species} (de ${fmt(mon.donorName)}) se unió a tu Slot ${recruitSlot + 1} del Equipo Libre.`
                            );
                          }}
                          className="mt-2 w-full rounded-lg bg-fuchsia-500/25 px-2.5 py-1 text-[10px] font-extrabold text-fuchsia-100 hover:bg-fuchsia-500/35 cursor-pointer"
                        >
                          Incorporar al Slot {recruitSlot + 1}
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Nuzlocke Fallen Graveyard */}
              <div className="rounded-2xl border border-rose-500/30 bg-slate-950/80 p-4">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-rose-300">
                    <Skull className="h-4 w-4" />
                    <h3 className="font-display text-sm font-bold text-white">
                      Cementerio del Exilio (Ultra Nuzlocke · {profile.fallenPokemon.length} caídos)
                    </h3>
                  </div>
                  {(profile.fallenPokemon.length > 0 || profile.ironmanPartyState) && (
                    <button
                      type="button"
                      onClick={() => {
                        onResetSurvivalState();
                        setNotice('♻️ Estado Ironman y Cementerio Nuzlocke limpiados.');
                      }}
                      className="rounded-lg border border-slate-700 bg-slate-900 px-2.5 py-1 text-[10px] font-bold text-slate-300 hover:text-white cursor-pointer"
                    >
                      Limpiar bajas / curar run
                    </button>
                  )}
                </div>
                {profile.fallenPokemon.length === 0 ? (
                  <p className="mt-2 text-xs text-slate-400">
                    Ningún compañero ha caído en combate todavía.
                  </p>
                ) : (
                  <div className="mt-2.5 flex flex-wrap gap-2">
                    {profile.fallenPokemon.map((sp) => (
                      <span
                        key={sp}
                        className="inline-flex items-center gap-1 rounded-lg border border-rose-500/40 bg-rose-950/50 px-2.5 py-1 text-xs font-bold text-rose-200"
                      >
                        💀 {sp}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: IRONMAN, ULTRA NUZLOCKE DIABLO & DIFFICULTY RULES */}
          {tab === 'rules' && (
            <div className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() =>
                    onToggleRunModifiers({ ironmanMode: !profile.ironmanMode })
                  }
                  className={`rounded-2xl border p-4 text-left transition cursor-pointer ${
                    profile.ironmanMode
                      ? 'border-amber-400 bg-amber-500/15'
                      : 'border-slate-800 bg-slate-900/75 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-1.5 font-display text-sm font-bold text-white">
                      <ShieldAlert className="h-4 w-4 text-amber-400" />
                      Modo Ironman (Sin Curación Gratis)
                    </span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-extrabold ${
                        profile.ironmanMode
                          ? 'bg-amber-400 text-slate-950'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {profile.ironmanMode ? 'ACTIVO' : 'OFF'}
                    </span>
                  </div>
                  <p className="mt-1.5 text-xs leading-relaxed text-slate-300">
                    Tus PS, estados alterados y PP persisten entre capítulos. Tendrás que comprar curaciones en Campamento o cultivar bayas Lum/Sitrus/Leppa apoyándote en tus Vínculos.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    onToggleRunModifiers({
                      nuzlockePermadeath: !profile.nuzlockePermadeath,
                    })
                  }
                  className={`rounded-2xl border p-4 text-left transition cursor-pointer ${
                    profile.nuzlockePermadeath
                      ? 'border-rose-400 bg-rose-500/20'
                      : 'border-slate-800 bg-slate-900/75 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-1.5 font-display text-sm font-bold text-white">
                      <Skull className="h-4 w-4 text-rose-400" />
                      Ultra Nuzlocke Diablo (Permadeath)
                    </span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-extrabold ${
                        profile.nuzlockePermadeath
                          ? 'bg-rose-500 text-white'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {profile.nuzlockePermadeath ? 'ACTIVO' : 'OFF'}
                    </span>
                  </div>
                  <p className="mt-1.5 text-xs leading-relaxed text-slate-300">
                    Todo Pokémon que quede debilitado va al Cementerio del Exilio permanentemente. Desbloquear refuerzos en tu Casa (Rango 3) se vuelve cuestión de vida o muerte.
                  </p>
                </button>
              </div>

              {/* Global Default Difficulty Selector (4 Tiers) */}
              <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4">
                <h3 className="flex items-center gap-1.5 font-display text-sm font-bold text-white">
                  <Flame className="h-4 w-4 text-rose-400" />
                  Dificultad Global por Defecto (Baby Mode · Normal · Difícil · Tryhard)
                </h3>
                <p className="mt-1 text-xs text-slate-400">
                  Escala desde Baby Mode (-8 niveles e IA relajada) hasta Tryhard/Diablo (+4 niveles sobre el cap, sets letales como Water Spout + Choice Specs e IA Anti-Explotación).
                </p>
                <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                  {DIFFICULTY_ORDER.map((diffId) => {
                    const meta = DIFFICULTY_META[diffId];
                    return (
                      <button
                        key={diffId}
                        type="button"
                        onClick={() =>
                          onToggleRunModifiers({ defaultDifficulty: diffId })
                        }
                        className={`rounded-xl border p-3 text-left transition cursor-pointer ${
                          profile.defaultDifficulty === diffId
                            ? diffId === 'nightmare'
                              ? 'border-rose-400 bg-rose-500/20 text-white'
                              : diffId === 'kaizo'
                                ? 'border-amber-400 bg-amber-500/20 text-white'
                                : diffId === 'standard'
                                  ? 'border-emerald-400 bg-emerald-500/20 text-white'
                                  : 'border-sky-400 bg-sky-500/20 text-white'
                            : 'border-slate-800 bg-slate-950/75 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        <p className="text-xs font-extrabold">{meta.label}</p>
                        <p className="mt-0.5 text-[10px] font-semibold text-amber-200/85">
                          {meta.subtitle}
                        </p>
                        <p className="mt-1 text-[10px] opacity-85">{meta.desc}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* VN Pacing Mode Selector */}
              <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4">
                <h3 className="font-display text-sm font-bold text-white">
                  Ritmo de Novela Visual (VN Pacing)
                </h3>
                <p className="mt-1 text-xs text-slate-400">
                  Cambia en cualquier momento cómo quieres experimentar las escenas antes de cada combate.
                </p>
                <div className="mt-3 grid gap-2 sm:grid-cols-3">
                  {(['full', 'decisions-only', 'skip-to-battle'] as VnPacingMode[]).map(
                    (modeId) => {
                      const m = VN_PACING_META[modeId];
                      const active = (profile.vnPacingMode ?? 'full') === modeId;
                      return (
                        <button
                          key={modeId}
                          type="button"
                          onClick={() =>
                            onToggleRunModifiers({ vnPacingMode: modeId })
                          }
                          className={`rounded-xl border p-3 text-left transition cursor-pointer ${
                            active
                              ? 'border-sky-400 bg-sky-500/20 text-white'
                              : 'border-slate-800 bg-slate-950/75 text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          <p className="text-xs font-extrabold">{m.label}</p>
                          <p className="mt-1 text-[10px] opacity-85">{m.desc}</p>
                        </button>
                      );
                    }
                  )}
                </div>
              </div>

              <div className="rounded-2xl border border-fuchsia-400/25 bg-fuchsia-950/15 p-3.5 text-xs text-fuchsia-100">
                <Sparkles className="mr-1.5 inline h-3.5 w-3.5 text-fuchsia-300" />
                <strong>Regla de Endings:</strong> El primer NPC en llegar a Rango 3 fija tu{' '}
                <em>Ending Romántico</em> (<code className="text-amber-200">firstRomanceMaxedId</code>). Alcanzar Rango 3 con todos los romanceables jugables sobrescribe el epílogo con el{' '}
                <strong>Ending Harem: Corona de Vínculos</strong>.
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
