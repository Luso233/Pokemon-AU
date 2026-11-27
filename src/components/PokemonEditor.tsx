import React, { useMemo, useState } from 'react';
import { Dex } from '@pkmn/sim';
import {
  ArrowDownToLine,
  Backpack,
  BarChart3,
  Lock,
  Package,
  RotateCcw,
  Search,
  Sparkles,
  Trash2,
  Unlock,
} from 'lucide-react';
import { CURRENCY_SHORT } from '../data/economyCatalog';
import { computeActiveSocialLinkPerks } from '../data/socialLinksCatalog';
import {
  getFormatGeneration,
  getLegalLearnsetForSpecies,
  getMoveSlotUnlockCost,
  getSpeciesKey,
} from '../engine/learnsetService';
import { getItemUsageInfo, isMoveSlotUnlocked } from '../engine/playerProfile';
import { computePokemonBst } from '../engine/pricingEngine';
import { getTypeBadgeClass } from '../engine/pokemonVisuals';
import {
  ensureShadowDexRegistered,
  isInstanceHighBond,
} from '../engine/shadowEngine';
import {
  calculatePokemonStats,
  getIndexedSpeciesMeta,
  getNatureStatModifiers,
} from '../engine/showdownSearchIndex';
import type {
  OwnedPokemonInstance,
  PlayerSaveProfile,
  PokemonGender,
  StatSpread,
} from '../types/game';
import { PokemonSprite } from './PokemonSprite';

const STAT_META: Array<{ key: keyof StatSpread; label: string }> = [
  { key: 'hp', label: 'HP' },
  { key: 'atk', label: 'Atk' },
  { key: 'def', label: 'Def' },
  { key: 'spa', label: 'SpA' },
  { key: 'spd', label: 'SpD' },
  { key: 'spe', label: 'Spe' },
];

function getStatBarColor(val: number): string {
  if (val >= 350) return 'bg-cyan-400';
  if (val >= 280) return 'bg-emerald-400';
  if (val >= 210) return 'bg-lime-400';
  if (val >= 160) return 'bg-amber-400';
  return 'bg-rose-400';
}

const NATURES = [
  'Adamant',
  'Jolly',
  'Modest',
  'Timid',
  'Bold',
  'Impish',
  'Calm',
  'Careful',
  'Hasty',
  'Naive',
  'Brave',
  'Quiet',
  'Relaxed',
  'Sassy',
];

const TERA_TYPES = [
  'Normal',
  'Fire',
  'Water',
  'Electric',
  'Grass',
  'Ice',
  'Fighting',
  'Poison',
  'Ground',
  'Flying',
  'Psychic',
  'Bug',
  'Rock',
  'Ghost',
  'Dragon',
  'Dark',
  'Steel',
  'Fairy',
];

export interface NarrativePokemonSetView {
  species: string;
  level?: number;
  item?: string;
  ability?: string;
  nature?: string;
  teraType?: string;
  moves?: string[];
  shiny?: boolean;
}

interface PokemonEditorProps {
  mode: 'narrative' | 'free';
  profile: PlayerSaveProfile;
  formatId?: string;
  /** Narrative mode fields */
  narrativeSet?: NarrativePokemonSetView;
  canonicalSet?: NarrativePokemonSetView;
  chapterDefaultItems?: string[];
  isSlotShiny?: boolean;
  shinyUsedCount?: number;
  onToggleNarrativeShiny?: () => void;
  onSetCustomItem?: (species: string, itemName: string) => void;
  onSetCustomMove?: (
    species: string,
    slotIndex: number,
    moveName: string
  ) => { ok: boolean; error?: string };
  onResetSpecies?: (species: string) => void;
  /** Free (PC Box Instance) mode fields */
  instance?: OwnedPokemonInstance;
  onMoveToBox?: (uid: string) => void;
  onReleaseInstance?: (
    uid: string
  ) => { ok: boolean; error?: string; releasedSpecies?: string };
  onEquipInstanceItem?: (
    uid: string,
    itemName: string
  ) => { ok: boolean; error?: string; transferredFrom?: string };
  onUpdateInstanceBuild?: (
    uid: string,
    patch: Partial<
      Pick<
        OwnedPokemonInstance,
        | 'ability'
        | 'nature'
        | 'teraType'
        | 'moves'
        | 'shiny'
        | 'nickname'
        | 'gender'
        | 'evs'
        | 'ivs'
      >
    >
  ) => { ok: boolean; error?: string };
  /** Shared callbacks */
  onUnlockMoveSlot: (
    species: string,
    slotIndex: number
  ) => { ok: boolean; error?: string };
  onOpenShop?: () => void;
  onNotice?: (notice: { tone: 'ok' | 'err'; text: string }) => void;
}

/**
 * Unified Pokémon Editor for BOTH:
 *  - mode="narrative": Campaign chapter fixed/story squad (chapter + inventory items, unlockable move slots -> FULL Dex learnset, zero TMs!)
 *  - mode="free": Unique PC Box instance (real itemStock enforcement, Ability/Nature/Tera selectors, unlockable move slots -> FULL Dex learnset, zero TMs!)
 */
export const PokemonEditor: React.FC<PokemonEditorProps> = ({
  mode,
  profile,
  formatId = 'gen9doublescustomgame@@@NatDex Mod',
  narrativeSet,
  canonicalSet,
  chapterDefaultItems = [],
  isSlotShiny = false,
  shinyUsedCount = 0,
  onToggleNarrativeShiny,
  onSetCustomItem,
  onSetCustomMove,
  onResetSpecies,
  instance,
  onMoveToBox,
  onReleaseInstance,
  onEquipInstanceItem,
  onUpdateInstanceBuild,
  onUnlockMoveSlot,
  onOpenShop,
  onNotice,
}) => {
  const [activeMovePickerSlot, setActiveMovePickerSlot] = useState<number | null>(
    null
  );
  const [moveSearch, setMoveSearch] = useState('');
  const [showStatsPanel, setShowStatsPanel] = useState(true);
  const [confirmRelease, setConfirmRelease] = useState(false);

  const isGen1 = getFormatGeneration(formatId) === 1;
  const socialPerks = useMemo(
    () => computeActiveSocialLinkPerks(profile),
    [profile]
  );

  const species =
    mode === 'free' ? instance?.species ?? '' : narrativeSet?.species ?? '';
  const moves =
    mode === 'free'
      ? instance?.moves ?? []
      : narrativeSet?.moves ?? [];
  const item =
    mode === 'free' ? instance?.item ?? '' : narrativeSet?.item ?? '';
  const ability =
    mode === 'free' ? instance?.ability ?? '' : narrativeSet?.ability ?? '';
  const nature =
    mode === 'free' ? instance?.nature ?? '' : narrativeSet?.nature ?? '';
  const teraType =
    mode === 'free' ? instance?.teraType ?? '' : narrativeSet?.teraType ?? '';
  const level = mode === 'free' ? 100 : narrativeSet?.level || 100;
  const shiny = mode === 'free' ? Boolean(instance?.shiny) : isSlotShiny;
  const bst = useMemo(() => (species ? computePokemonBst(species) : 0), [species]);

  const ownedShinyCharms = profile.inventory.shinyCharms;
  const activeFreeShinies = profile.pokemonBox.filter(
    (b) => b.zone !== 'graveyard' && b.shiny
  ).length;

  const speciesObj = useMemo(
    () => (species ? Dex.species.get(species) : null),
    [species]
  );
  const indexedMeta = useMemo(
    () => (species ? getIndexedSpeciesMeta(species) : null),
    [species]
  );

  // Live Showdown-style EV/IV stat calculation for mode="free"
  const activeEvs: StatSpread = useMemo(() => {
    const raw = instance?.evs;
    if (raw && Object.keys(raw).length > 0) {
      return {
        hp: raw.hp ?? 0,
        atk: raw.atk ?? 0,
        def: raw.def ?? 0,
        spa: raw.spa ?? 0,
        spd: raw.spd ?? 0,
        spe: raw.spe ?? 0,
      };
    }
    const bs = indexedMeta?.baseStats ?? { hp: 80, atk: 80, def: 80, spa: 80, spd: 80, spe: 80 };
    return bs.spa > bs.atk
      ? { hp: 4, atk: 0, def: 0, spa: 252, spd: 0, spe: 252 }
      : { hp: 4, atk: 252, def: 0, spa: 0, spd: 0, spe: 252 };
  }, [instance?.evs, indexedMeta]);

  const activeIvs: StatSpread = useMemo(
    () => ({
      hp: instance?.ivs?.hp ?? 31,
      atk: instance?.ivs?.atk ?? 31,
      def: instance?.ivs?.def ?? 31,
      spa: instance?.ivs?.spa ?? 31,
      spd: instance?.ivs?.spd ?? 31,
      spe: instance?.ivs?.spe ?? 31,
    }),
    [instance?.ivs]
  );

  const totalEvUsed =
    activeEvs.hp +
    activeEvs.atk +
    activeEvs.def +
    activeEvs.spa +
    activeEvs.spd +
    activeEvs.spe;
  const remainingEvs = Math.max(0, 508 - totalEvUsed);
  const natureMods = useMemo(
    () => getNatureStatModifiers(nature || 'Serious'),
    [nature]
  );
  const calculatedStats = useMemo(
    () =>
      species
        ? calculatePokemonStats(species, level, nature || 'Serious', activeEvs, activeIvs)
        : { hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0 },
    [species, level, nature, activeEvs, activeIvs]
  );

  const availableAbilities = useMemo(() => {
    if (!speciesObj || !speciesObj.exists) return [ability || 'Pressure'];
    const raw = Object.values(speciesObj.abilities ?? {}).filter(
      (a): a is string => Boolean(a)
    );
    return Array.from(new Set(raw.length > 0 ? raw : [ability || 'Pressure']));
  }, [speciesObj, ability]);

  // Full @pkmn/sim legal learnset for this species (plus ALL 24 Shadow Moves for Shadow Pokémon!)
  const isShadowInstance = Boolean(mode === 'free' && instance?.isShadow);
  const legalMoves = useMemo(() => {
    if (!species) return [];
    ensureShadowDexRegistered();
    const baseMoves =
      mode === 'narrative'
        ? canonicalSet?.moves ?? moves
        : moves;
    return getLegalLearnsetForSpecies(
      species,
      formatId,
      baseMoves,
      isShadowInstance
    );
  }, [species, mode, canonicalSet?.moves, moves, formatId, isShadowInstance]);

  const filteredMoves = useMemo(() => {
    const q = moveSearch.trim().toLowerCase();
    if (!q) {
      if (isShadowInstance) {
        const shadowFirst = [
          ...legalMoves.filter((m) => m.type === 'Shadow'),
          ...legalMoves.filter((m) => m.type !== 'Shadow'),
        ];
        return shadowFirst.slice(0, 96);
      }
      return legalMoves.slice(0, 80);
    }
    return legalMoves
      .filter(
        (m) =>
          m.name.toLowerCase().includes(q) ||
          m.type.toLowerCase().includes(q) ||
          m.shortDesc.toLowerCase().includes(q)
      )
      .slice(0, 80);
  }, [legalMoves, moveSearch, isShadowInstance]);

  const availableNarrativeItems = useMemo(() => {
    return Array.from(
      new Set([...chapterDefaultItems, ...profile.inventory.items])
    ).sort((a, b) => a.localeCompare(b));
  }, [chapterDefaultItems, profile.inventory.items]);

  const allStockItems = useMemo(() => {
    const names = new Set<string>([
      ...profile.inventory.items,
      ...Object.keys(profile.itemStock),
    ]);
    return Array.from(names)
      .filter((it) => (profile.itemStock[it] ?? 0) > 0)
      .sort((a, b) => a.localeCompare(b));
  }, [profile.inventory.items, profile.itemStock]);

  const spKey = species ? getSpeciesKey(species) : '';
  const narrativeHasCustomizations = Boolean(
    mode === 'narrative' &&
      spKey &&
      (profile.customItems[spKey] ||
        (profile.customMoves[spKey] &&
          Object.keys(profile.customMoves[spKey]).length > 0))
  );

  if (!species) return null;

  const isGraveyard = mode === 'free' && instance?.zone === 'graveyard';

  const handleUnlockSlot = (slotIdx: number) => {
    const res = onUnlockMoveSlot(species, slotIdx);
    if (res.ok) {
      onNotice?.({
        tone: 'ok',
        text: `🔓 ¡Slot ${slotIdx + 1} de ${species} desbloqueado! Ya tienes acceso a TODOS los ${legalMoves.length} movimientos legales de su learnset.`,
      });
      setActiveMovePickerSlot(slotIdx);
      setMoveSearch('');
    } else {
      onNotice?.({
        tone: 'err',
        text: res.error || 'No tienes suficientes PokéCoronas.',
      });
    }
  };

  const handlePickMove = (slotIdx: number, moveName: string) => {
    if (mode === 'narrative') {
      if (!onSetCustomMove) return;
      const res = onSetCustomMove(species, slotIdx, moveName);
      if (res.ok) {
        onNotice?.({
          tone: 'ok',
          text: `✓ ${species} aprendió ${moveName} en el Slot ${slotIdx + 1}.`,
        });
        setActiveMovePickerSlot(null);
        setMoveSearch('');
      } else {
        onNotice?.({
          tone: 'err',
          text: res.error || 'No se pudo asignar el movimiento.',
        });
      }
      return;
    }

    if (mode === 'free' && instance && onUpdateInstanceBuild) {
      const nextMoves = [...moves];
      while (nextMoves.length <= slotIdx) nextMoves.push('Protect');
      nextMoves[slotIdx] = moveName;
      const res = onUpdateInstanceBuild(instance.uid, { moves: nextMoves });
      if (res.ok) {
        onNotice?.({
          tone: 'ok',
          text: `✓ ${species} aprendió ${moveName} en el Slot ${slotIdx + 1}.`,
        });
        setActiveMovePickerSlot(null);
        setMoveSearch('');
      } else {
        onNotice?.({
          tone: 'err',
          text: res.error || 'No se pudo asignar el movimiento.',
        });
      }
    }
  };

  // Pad to 4 display slots if species has fewer than 4 moves (except Ditto with 1)
  const displaySlotsCount = species.toLowerCase() === 'ditto' ? 1 : 4;
  const displayMoves = Array.from(
    { length: displaySlotsCount },
    (_, idx) => moves[idx] ?? ''
  );

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-950/90 p-4">
      {/* Top Banner */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 pb-3.5">
        <div className="flex items-center gap-3">
          <div
            className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border border-slate-800 bg-slate-900/90 ${
              isGraveyard ? 'grayscale opacity-60' : ''
            }`}
          >
            <PokemonSprite
              species={species}
              side="p2"
              shiny={shiny}
              className="h-14 w-14"
            />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-1.5">
              <h3 className="font-display text-lg font-bold text-white sm:text-xl">
                {species}
              </h3>
              <span className="rounded-md border border-sky-400/35 bg-sky-500/15 px-1.5 py-0.5 font-mono-code text-[10px] font-extrabold text-sky-200">
                {bst} BST
              </span>
              <span className="rounded-md border border-slate-700 bg-slate-900 px-1.5 py-0.5 font-mono-code text-[10px] font-bold text-slate-300">
                Nv. {level}
              </span>
              {teraType && !isGen1 && (
                <span
                  className={`rounded-md border px-1.5 py-0.5 text-[10px] font-bold uppercase ${getTypeBadgeClass(
                    teraType
                  )}`}
                >
                  Tera {teraType}
                </span>
              )}
              {mode === 'free' && instance?.isShadow && (
                <span className="rounded-md border border-fuchsia-400/70 bg-fuchsia-950/80 px-1.5 py-0.5 text-[10px] font-extrabold text-fuchsia-200 shadow shadow-fuchsia-500/20">
                  🟣 OSCURO · Corazón {instance.heartGauge ?? 100}%
                </span>
              )}
              {mode === 'free' && instance && isInstanceHighBond(instance) && (
                <span
                  title="Elegible para Vínculo del Heredero (Aguante a 1 PS y Cura de Estado) incluso en Difícil/Tryhard"
                  className="rounded-md border border-pink-400/55 bg-pink-500/20 px-1.5 py-0.5 text-[10px] font-extrabold text-pink-200"
                >
                  💖 Vínculo Alto
                </span>
              )}
            </div>
            <p className="mt-0.5 text-[11px] text-slate-400">
              {mode === 'free' && instance ? (
                <>
                  Origen: <strong className="text-amber-200/90">{instance.origin}</strong>
                  {' · '}
                  <span className="font-mono-code text-[10px] text-slate-500">
                    {instance.uid}
                  </span>
                </>
              ) : (
                <>
                  {!isGen1 && ability ? (
                    <>
                      Habilidad: <strong className="text-slate-200">{ability}</strong> ·{' '}
                    </>
                  ) : null}
                  {nature ? (
                    <>
                      Naturaleza: <strong className="text-slate-200">{nature}</strong>
                    </>
                  ) : (
                    'Reglas clásicas de Era Antigua'
                  )}
                </>
              )}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {!isGraveyard && ownedShinyCharms > 0 && (
            <button
              type="button"
              onClick={() => {
                if (mode === 'narrative') {
                  onToggleNarrativeShiny?.();
                } else if (instance && onUpdateInstanceBuild) {
                  const res = onUpdateInstanceBuild(instance.uid, {
                    shiny: !instance.shiny,
                  });
                  if (!res.ok) {
                    onNotice?.({ tone: 'err', text: res.error || '' });
                  }
                }
              }}
              className={`inline-flex items-center gap-1 rounded-xl border px-2.5 py-1.5 text-[11px] font-bold transition cursor-pointer ${
                shiny
                  ? 'border-fuchsia-400 bg-fuchsia-500/25 text-fuchsia-100'
                  : 'border-slate-700 bg-slate-900 text-slate-300 hover:border-fuchsia-400/50'
              }`}
            >
              <Sparkles className="h-3.5 w-3.5" />
              Shiny ({mode === 'free' ? activeFreeShinies : shinyUsedCount}/{ownedShinyCharms})
            </button>
          )}

          {mode === 'narrative' && narrativeHasCustomizations && onResetSpecies && (
            <button
              type="button"
              onClick={() => {
                onResetSpecies(species);
                setActiveMovePickerSlot(null);
                onNotice?.({
                  tone: 'ok',
                  text: `Set original restaurado para ${species} (tus slots desbloqueados se mantienen).`,
                });
              }}
              className="inline-flex items-center gap-1 rounded-xl border border-slate-700 bg-slate-900 px-2.5 py-1.5 text-[11px] font-semibold text-slate-300 hover:border-amber-400/40 hover:text-white cursor-pointer"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Restaurar
            </button>
          )}

          {mode === 'free' && instance?.zone === 'party' && onMoveToBox && (
            <button
              type="button"
              onClick={() => onMoveToBox(instance.uid)}
              className="inline-flex items-center gap-1 rounded-xl border border-sky-400/45 bg-sky-500/15 px-2.5 py-1.5 text-[11px] font-extrabold text-sky-200 hover:bg-sky-500/25 cursor-pointer"
            >
              <ArrowDownToLine className="h-3.5 w-3.5" />
              Guardar en Caja
            </button>
          )}

          {mode === 'free' &&
            instance &&
            onReleaseInstance &&
            (!isGraveyard || profile.devModeEnabled || !profile.nuzlockePermadeath) && (
              confirmRelease ? (
                <div className="inline-flex items-center gap-1 rounded-xl border border-rose-400/60 bg-rose-950/80 px-2 py-1">
                  <span className="text-[10px] font-bold text-rose-200">¿Liberar?</span>
                  <button
                    type="button"
                    onClick={() => {
                      const res = onReleaseInstance(instance.uid);
                      setConfirmRelease(false);
                      onNotice?.(
                        res.ok
                          ? {
                              tone: 'ok',
                              text: `🕊️ ${res.releasedSpecies ?? instance.species} fue liberado de tus Cajas PC.`,
                            }
                          : { tone: 'err', text: res.error || 'No se pudo liberar.' }
                      );
                    }}
                    className="rounded-md bg-rose-500 px-2 py-0.5 text-[10px] font-extrabold text-white hover:bg-rose-400 cursor-pointer"
                  >
                    Sí
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmRelease(false)}
                    className="rounded-md border border-slate-700 bg-slate-900 px-1.5 py-0.5 text-[10px] text-slate-300 hover:text-white cursor-pointer"
                  >
                    No
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  title="Liberar / eliminar este Pokémon de tus Cajas PC"
                  onClick={() => setConfirmRelease(true)}
                  className="inline-flex items-center gap-1 rounded-xl border border-rose-500/35 bg-rose-500/10 px-2.5 py-1.5 text-[11px] font-bold text-rose-200 hover:border-rose-400 hover:bg-rose-500/20 cursor-pointer"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Liberar
                </button>
              )
            )}
        </div>
      </div>

      {isGraveyard ? (
        <div className="rounded-2xl border border-rose-500/40 bg-rose-950/30 p-4 text-xs text-rose-200">
          <p className="font-bold">
            💀 {instance?.nickname ? `${instance.nickname} (${species})` : species} · Descansa en el Cementerio del Exilio (Permadeath)
          </p>
          {instance?.epitaph && (
            <div className="mt-2 space-y-1 text-[11px] text-rose-200/85">
              <p>
                Cayó en el <strong>Turno {instance.epitaph.turn}</strong> en{' '}
                <em>{instance.epitaph.chapterTitle}</em> frente a{' '}
                <strong>{instance.epitaph.rivalName}</strong>.
              </p>
              {(instance.epitaph.killerSpecies || instance.epitaph.killerMove) && (
                <p className="text-amber-200/95">
                  Golpe letal:{' '}
                  <strong>{instance.epitaph.killerSpecies || instance.epitaph.rivalName}</strong>{' '}
                  usó <strong>{instance.epitaph.killerMove || 'un golpe fatal'}</strong>.
                </p>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {/* Showdown Identity Strip: Apodo (Nickname) + Sexo (Gender) + Habilidad + Naturaleza + Teratipo */}
          {mode === 'free' && instance && onUpdateInstanceBuild && !isGen1 && (
            <>
              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-12">
                <div className="sm:col-span-4">
                  <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Apodo (Nickname)
                  </label>
                  <input
                    type="text"
                    maxLength={24}
                    value={instance.nickname ?? ''}
                    placeholder={instance.species}
                    onChange={(e) =>
                      onUpdateInstanceBuild(instance.uid, {
                        nickname: e.target.value,
                      })
                    }
                    className="w-full rounded-xl border border-slate-700 bg-slate-900 px-2.5 py-2 text-xs font-semibold text-white placeholder-slate-500 focus:border-amber-400 focus:outline-none"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Sexo
                  </label>
                  {indexedMeta?.fixedGender ? (
                    <div className="flex h-[34px] items-center justify-center rounded-xl border border-slate-800 bg-slate-900/60 text-xs font-bold text-slate-400">
                      {indexedMeta.fixedGender === 'M'
                        ? '♂ Macho'
                        : indexedMeta.fixedGender === 'F'
                          ? '♀ Hembra'
                          : '— Sin sexo'}
                    </div>
                  ) : (
                    <select
                      value={instance.gender ?? ''}
                      onChange={(e) =>
                        onUpdateInstanceBuild(instance.uid, {
                          gender: e.target.value as PokemonGender,
                        })
                      }
                      className="w-full rounded-xl border border-slate-700 bg-slate-900 px-2 py-2 text-xs font-semibold text-white focus:border-amber-400 focus:outline-none"
                    >
                      <option value="">Aleatorio</option>
                      <option value="M">♂ Macho</option>
                      <option value="F">♀ Hembra</option>
                    </select>
                  )}
                </div>
                <div className="sm:col-span-2">
                  <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Habilidad
                  </label>
                  <select
                    value={instance.ability}
                    onChange={(e) =>
                      onUpdateInstanceBuild(instance.uid, { ability: e.target.value })
                    }
                    className="w-full rounded-xl border border-slate-700 bg-slate-900 px-2 py-2 text-xs font-semibold text-white focus:border-amber-400 focus:outline-none"
                  >
                    {availableAbilities.map((ab) => (
                      <option key={ab} value={ab}>
                        {ab}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Naturaleza
                  </label>
                  <select
                    value={instance.nature}
                    onChange={(e) =>
                      onUpdateInstanceBuild(instance.uid, { nature: e.target.value })
                    }
                    className="w-full rounded-xl border border-slate-700 bg-slate-900 px-2 py-2 text-xs font-semibold text-white focus:border-amber-400 focus:outline-none"
                  >
                    {NATURES.map((n) => (
                      <option key={n} value={n}>
                        {n}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Teratipo
                  </label>
                  <select
                    value={instance.teraType}
                    onChange={(e) =>
                      onUpdateInstanceBuild(instance.uid, { teraType: e.target.value })
                    }
                    className="w-full rounded-xl border border-slate-700 bg-slate-900 px-2 py-2 text-xs font-semibold text-white focus:border-amber-400 focus:outline-none"
                  >
                    {TERA_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Showdown-Style EVs & IVs Stat Editor */}
              <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => setShowStatsPanel((v) => !v)}
                    className="inline-flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-wider text-emerald-300 hover:text-emerald-200 cursor-pointer"
                  >
                    <BarChart3 className="h-3.5 w-3.5" />
                    Estadísticas, EVs e IVs (Nv. {level}) · Restantes:{' '}
                    <span
                      className={`font-mono-code ${
                        remainingEvs === 0 ? 'text-amber-300' : 'text-emerald-200'
                      }`}
                    >
                      {remainingEvs}/508
                    </span>
                  </button>

                  <div className="flex flex-wrap gap-1">
                    {(
                      [
                        { label: '252 Atk/Spe', evs: { hp: 4, atk: 252, def: 0, spa: 0, spd: 0, spe: 252 } },
                        { label: '252 SpA/Spe', evs: { hp: 4, atk: 0, def: 0, spa: 252, spd: 0, spe: 252 } },
                        { label: '252 HP/Def', evs: { hp: 252, atk: 0, def: 252, spa: 0, spd: 4, spe: 0 } },
                        { label: '252 HP/SpD', evs: { hp: 252, atk: 0, def: 4, spa: 0, spd: 252, spe: 0 } },
                      ] as const
                    ).map((preset) => (
                      <button
                        key={preset.label}
                        type="button"
                        onClick={() =>
                          onUpdateInstanceBuild(instance.uid, { evs: preset.evs })
                        }
                        className="rounded-md border border-slate-700 bg-slate-950 px-1.5 py-0.5 text-[9.5px] font-bold text-slate-300 hover:border-emerald-400/50 hover:text-emerald-200 cursor-pointer"
                      >
                        {preset.label}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() =>
                        onUpdateInstanceBuild(instance.uid, {
                          ivs: { ...activeIvs, atk: activeIvs.atk === 0 ? 31 : 0 },
                        })
                      }
                      className={`rounded-md border px-1.5 py-0.5 text-[9.5px] font-bold cursor-pointer ${
                        activeIvs.atk === 0
                          ? 'border-amber-400/60 bg-amber-500/20 text-amber-200'
                          : 'border-slate-700 bg-slate-950 text-slate-300 hover:text-amber-200'
                      }`}
                    >
                      0 Atk IV
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        onUpdateInstanceBuild(instance.uid, {
                          ivs: { ...activeIvs, spe: activeIvs.spe === 0 ? 31 : 0 },
                        })
                      }
                      className={`rounded-md border px-1.5 py-0.5 text-[9.5px] font-bold cursor-pointer ${
                        activeIvs.spe === 0
                          ? 'border-violet-400/60 bg-violet-500/20 text-violet-200'
                          : 'border-slate-700 bg-slate-950 text-slate-300 hover:text-violet-200'
                      }`}
                    >
                      0 Spe IV
                    </button>
                  </div>
                </div>

                {showStatsPanel && (
                  <div className="mt-2.5 space-y-1.5">
                    <div className="grid grid-cols-12 items-center gap-1.5 px-1 text-[9.5px] font-bold uppercase tracking-wider text-slate-500">
                      <span className="col-span-2">Stat (Base)</span>
                      <span className="col-span-3">Barra</span>
                      <span className="col-span-4 text-center">EVs (0–252)</span>
                      <span className="col-span-2 text-center">IV (0–31)</span>
                      <span className="col-span-1 text-right">Total</span>
                    </div>
                    {STAT_META.map(({ key, label }) => {
                      const baseVal = indexedMeta?.baseStats[key] ?? 80;
                      const evVal = activeEvs[key];
                      const ivVal = activeIvs[key];
                      const finalVal = calculatedStats[key];
                      const isPlus = natureMods.plus === key;
                      const isMinus = natureMods.minus === key;
                      const maxForThisStat = Math.min(252, evVal + remainingEvs);

                      const setEv = (rawNext: number) => {
                        const clamped = Math.max(
                          0,
                          Math.min(maxForThisStat, Math.floor(rawNext))
                        );
                        onUpdateInstanceBuild(instance.uid, {
                          evs: { ...activeEvs, [key]: clamped },
                        });
                      };
                      const setIv = (rawNext: number) => {
                        const clamped = Math.max(
                          0,
                          Math.min(31, Math.floor(rawNext))
                        );
                        onUpdateInstanceBuild(instance.uid, {
                          ivs: { ...activeIvs, [key]: clamped },
                        });
                      };

                      return (
                        <div
                          key={key}
                          className="grid grid-cols-12 items-center gap-1.5 rounded-lg bg-slate-950/70 px-1.5 py-1"
                        >
                          <div className="col-span-2 flex items-center gap-1 text-[11px] font-bold">
                            <span
                              className={
                                isPlus
                                  ? 'text-rose-300'
                                  : isMinus
                                    ? 'text-sky-300'
                                    : 'text-slate-200'
                              }
                            >
                              {label}
                              {isPlus ? '+' : isMinus ? '-' : ''}
                            </span>
                            <span className="font-mono-code text-[9.5px] text-slate-500">
                              {baseVal}
                            </span>
                          </div>
                          <div className="col-span-3">
                            <div className="h-2 w-full overflow-hidden rounded-full bg-slate-800">
                              <div
                                className={`h-full transition-all ${getStatBarColor(finalVal)}`}
                                style={{
                                  width: `${Math.min(100, Math.round((finalVal / 450) * 100))}%`,
                                }}
                              />
                            </div>
                          </div>
                          <div className="col-span-4 flex items-center gap-1.5">
                            <input
                              type="range"
                              min={0}
                              max={252}
                              step={4}
                              value={evVal}
                              onChange={(e) => setEv(Number(e.target.value))}
                              className="h-1.5 w-full accent-emerald-400 cursor-pointer"
                            />
                            <input
                              type="number"
                              min={0}
                              max={252}
                              value={evVal}
                              onChange={(e) => setEv(Number(e.target.value))}
                              className="font-mono-code w-12 rounded border border-slate-700 bg-slate-900 px-1 py-0.5 text-center text-[10.5px] font-bold text-emerald-200 focus:border-emerald-400 focus:outline-none"
                            />
                          </div>
                          <div className="col-span-2 flex justify-center">
                            <input
                              type="number"
                              min={0}
                              max={31}
                              value={ivVal}
                              onChange={(e) => setIv(Number(e.target.value))}
                              className="font-mono-code w-12 rounded border border-slate-700 bg-slate-900 px-1 py-0.5 text-center text-[10.5px] font-bold text-amber-200 focus:border-amber-400 focus:outline-none"
                            />
                          </div>
                          <span className="col-span-1 text-right font-mono-code text-[11px] font-extrabold text-white">
                            {finalVal}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </>
          )}

          {/* Held Item Selector */}
          <div>
            <div className="mb-1.5 flex items-center justify-between gap-2">
              <label className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-amber-300">
                {mode === 'free' ? (
                  <>
                    <Package className="h-3.5 w-3.5" />
                    Objeto Equipado (Stock Real · Sin Clones)
                  </>
                ) : (
                  <>
                    <Backpack className="h-3.5 w-3.5" />
                    Objeto Equipado (Inventario + Set del Capítulo)
                  </>
                )}
              </label>
              {!isGen1 && onOpenShop && (
                <button
                  type="button"
                  onClick={onOpenShop}
                  className="text-[11px] font-semibold text-amber-300/80 hover:text-amber-200 cursor-pointer"
                >
                  + Comprar objetos en Tienda
                </button>
              )}
            </div>

            {isGen1 ? (
              <div className="rounded-xl border border-slate-800 bg-slate-900/70 px-3.5 py-2 text-xs text-slate-400">
                En Generación 1 (Reliquia de Silph Co.) no existen objetos equipados.
              </div>
            ) : mode === 'free' && instance && onEquipInstanceItem ? (
              <select
                value={instance.item}
                onChange={(e) => {
                  const nextItem = e.target.value;
                  const res = onEquipInstanceItem(instance.uid, nextItem);
                  if (!res.ok) {
                    onNotice?.({ tone: 'err', text: res.error || '' });
                  } else if (res.transferredFrom) {
                    onNotice?.({
                      tone: 'ok',
                      text: `📦 ${nextItem} se movió desde ${res.transferredFrom} a ${instance.species} (stock agotado, sin clones).`,
                    });
                  }
                }}
                className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs font-semibold text-white focus:border-amber-400 focus:outline-none"
              >
                <option value="">(Sin objeto)</option>
                {allStockItems.map((it) => {
                  const usage = getItemUsageInfo(profile, it, instance.uid);
                  const heldBy =
                    usage.used >= usage.stock && usage.holders[0]
                      ? ` · en uso por ${usage.holders[0].species}`
                      : '';
                  return (
                    <option key={it} value={it}>
                      {it} ({Math.max(0, usage.stock - usage.used)}/{usage.stock} libre{heldBy})
                    </option>
                  );
                })}
              </select>
            ) : (
              <select
                value={item}
                onChange={(e) => {
                  onSetCustomItem?.(species, e.target.value);
                  onNotice?.({
                    tone: 'ok',
                    text: e.target.value
                      ? `✓ ${species} equipó ${e.target.value}.`
                      : `Se retiró el objeto de ${species}.`,
                  });
                }}
                className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs font-semibold text-white focus:border-amber-400 focus:outline-none"
              >
                <option value="">
                  (Por defecto: {canonicalSet?.item || 'Sin objeto'})
                </option>
                {availableNarrativeItems.map((itemName) => {
                  const fromChapter = chapterDefaultItems.includes(itemName);
                  const fromInventory = profile.inventory.items.includes(itemName);
                  const tag =
                    fromChapter && fromInventory
                      ? 'Capítulo + Inventario'
                      : fromChapter
                        ? 'Set del capítulo'
                        : 'Tu inventario';
                  return (
                    <option key={itemName} value={itemName}>
                      {itemName} — {tag}
                    </option>
                  );
                })}
              </select>
            )}
          </div>

          {/* 4 Unlockable Move Slots -> FULL Legal Learnset (ZERO TMs!) */}
          <div>
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
              <p className="text-[11px] font-bold uppercase tracking-wider text-sky-300">
                Movimientos · Rompe candados para elegir CUALQUIER movimiento del learnset (Sin MTs)
              </p>
              <span className="text-[10px] font-semibold text-slate-400">
                {legalMoves.length} movimientos legales en @pkmn/sim
              </span>
            </div>

            <div className="grid gap-2 sm:grid-cols-2">
              {displayMoves.map((mvName, slotIdx) => {
                const mvData = mvName ? Dex.moves.get(mvName) : null;
                const unlocked = isMoveSlotUnlocked(profile, species, slotIdx);
                const slotCost =
                  profile.devModeEnabled || socialPerks.hasFreeTutoringPerk
                    ? 0
                    : getMoveSlotUnlockCost(slotIdx);
                const canonicalMove =
                  mode === 'narrative'
                    ? canonicalSet?.moves?.[slotIdx] ?? mvName
                    : mvName;
                const isCustomized =
                  mode === 'narrative' &&
                  canonicalMove.toLowerCase() !== mvName.toLowerCase();
                const isPickerOpen = activeMovePickerSlot === slotIdx;

                return (
                  <div
                    key={`${species}-mv-${slotIdx}`}
                    className={`rounded-2xl border p-3 transition ${
                      isPickerOpen
                        ? 'border-sky-400 bg-sky-950/25'
                        : unlocked
                          ? 'border-emerald-400/35 bg-slate-900/90'
                          : 'border-slate-800 bg-slate-900/65'
                    }`}
                  >
                    <div className="mb-1.5 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono-code text-[10px] font-bold text-slate-500">
                          SLOT {slotIdx + 1}
                        </span>
                        {mvData?.exists && (
                          <span
                            className={`rounded border px-1.5 py-0.2 text-[9px] font-bold uppercase ${getTypeBadgeClass(
                              mvData.type
                            )}`}
                          >
                            {mvData.type}
                          </span>
                        )}
                      </div>

                      {unlocked ? (
                        <button
                          type="button"
                          onClick={() => {
                            setActiveMovePickerSlot(isPickerOpen ? null : slotIdx);
                            setMoveSearch('');
                          }}
                          className="inline-flex items-center gap-1 rounded-lg border border-emerald-400/40 bg-emerald-500/15 px-2 py-0.5 text-[10px] font-bold text-emerald-200 hover:bg-emerald-500/25 cursor-pointer"
                        >
                          <Unlock className="h-3 w-3" />
                          {isPickerOpen ? 'Cerrar' : 'Cambiar'}
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleUnlockSlot(slotIdx)}
                          disabled={profile.coins < slotCost}
                          className="inline-flex items-center gap-1 rounded-lg border border-amber-400/45 bg-amber-500/15 px-2 py-0.5 text-[10px] font-extrabold text-amber-200 transition hover:bg-amber-500/25 disabled:cursor-not-allowed disabled:opacity-45 cursor-pointer"
                        >
                          <Lock className="h-3 w-3" />
                          {slotCost === 0
                            ? 'Abrir · GRATIS'
                            : `Abrir · ${slotCost.toLocaleString()} ${CURRENCY_SHORT}`}
                        </button>
                      )}
                    </div>

                    <p className="text-sm font-bold text-white">
                      {mvName || '(Vacío)'}
                    </p>
                    <div className="mt-0.5 flex flex-wrap items-center gap-2 text-[10px] text-slate-400">
                      <span>
                        {mvData?.exists
                          ? `${mvData.category} · ${
                              mvData.basePower ? `${mvData.basePower} BP` : 'Estado'
                            }`
                          : 'Movimiento'}
                      </span>
                      {isCustomized && (
                        <span className="text-sky-300">(Base: {canonicalMove})</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Searchable FULL Legal Learnset Picker (ALL moves the species can learn!) */}
            {activeMovePickerSlot !== null && (
              <div className="mt-3 rounded-2xl border border-sky-400/45 bg-[#080d1a] p-3.5">
                <div className="mb-2.5 flex flex-wrap items-center justify-between gap-2">
                  <p className="text-xs font-bold text-sky-200">
                    Learnset completo de {species} ({legalMoves.length} movimientos) → Slot{' '}
                    {activeMovePickerSlot + 1}
                  </p>
                  <button
                    type="button"
                    onClick={() => setActiveMovePickerSlot(null)}
                    className="text-[11px] font-semibold text-slate-400 hover:text-white cursor-pointer"
                  >
                    Cerrar buscador
                  </button>
                </div>

                <div className="relative mb-2.5">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={moveSearch}
                    onChange={(e) => setMoveSearch(e.target.value)}
                    placeholder="Buscar entre TODOS los movimientos legales (ej. Rest, Extreme Speed, Fake Out, Protect)..."
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 py-2 pl-9 pr-3 text-xs text-white placeholder-slate-500 focus:border-sky-400 focus:outline-none"
                  />
                </div>

                <div className="grid max-h-56 gap-1.5 overflow-y-auto pr-1 sm:grid-cols-2">
                  {filteredMoves.map((opt) => {
                    const alreadyEquipped = moves.some(
                      (m, idx) =>
                        idx !== activeMovePickerSlot &&
                        m.toLowerCase() === opt.name.toLowerCase()
                    );
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        disabled={alreadyEquipped}
                        onClick={() =>
                          handlePickMove(activeMovePickerSlot, opt.name)
                        }
                        className="flex flex-col rounded-xl border border-slate-800 bg-slate-900/90 px-3 py-2 text-left transition hover:border-sky-400/60 hover:bg-slate-800/90 disabled:cursor-not-allowed disabled:opacity-40 cursor-pointer"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="truncate text-xs font-bold text-white">
                            {opt.name}
                          </span>
                          <span
                            className={`shrink-0 rounded border px-1.5 py-0.2 text-[9px] font-bold uppercase ${getTypeBadgeClass(
                              opt.type
                            )}`}
                          >
                            {opt.type}
                          </span>
                        </div>
                        <div className="mt-0.5 flex items-center gap-2 text-[10px] text-slate-400">
                          <span>{opt.category}</span>
                          <span>{opt.basePower ? `${opt.basePower} BP` : '—'}</span>
                          <span>
                            {opt.accuracy === true ? 'Prec. ∞' : `${opt.accuracy}%`}
                          </span>
                          {opt.priority !== 0 && (
                            <span className="text-amber-300">
                              Prio {opt.priority > 0 ? `+${opt.priority}` : opt.priority}
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                  {filteredMoves.length === 0 && (
                    <p className="col-span-2 py-4 text-center text-xs text-slate-500">
                      Ningún movimiento legal coincide con «{moveSearch}».
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
