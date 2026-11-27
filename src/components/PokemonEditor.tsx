import React, { useMemo, useState } from 'react';
import { Dex } from '@pkmn/sim';
import {
  ArrowDownToLine,
  Backpack,
  Lock,
  Package,
  RotateCcw,
  Search,
  Sparkles,
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
import type {
  OwnedPokemonInstance,
  PlayerSaveProfile,
} from '../types/game';
import { PokemonSprite } from './PokemonSprite';

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
  onEquipInstanceItem?: (
    uid: string,
    itemName: string
  ) => { ok: boolean; error?: string; transferredFrom?: string };
  onUpdateInstanceBuild?: (
    uid: string,
    patch: Partial<
      Pick<
        OwnedPokemonInstance,
        'ability' | 'nature' | 'teraType' | 'moves' | 'shiny' | 'nickname'
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
  formatId = 'gen9doublescustomgame',
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

  const availableAbilities = useMemo(() => {
    if (!speciesObj || !speciesObj.exists) return [ability || 'Pressure'];
    const raw = Object.values(speciesObj.abilities ?? {}).filter(
      (a): a is string => Boolean(a)
    );
    return Array.from(new Set(raw.length > 0 ? raw : [ability || 'Pressure']));
  }, [speciesObj, ability]);

  // Full @pkmn/sim legal learnset for this species (NO TMs — once a slot is unlocked, EVERY legal move is available!)
  const legalMoves = useMemo(() => {
    if (!species) return [];
    const baseMoves =
      mode === 'narrative'
        ? canonicalSet?.moves ?? moves
        : moves;
    return getLegalLearnsetForSpecies(species, formatId, baseMoves);
  }, [species, mode, canonicalSet?.moves, moves, formatId]);

  const filteredMoves = useMemo(() => {
    const q = moveSearch.trim().toLowerCase();
    if (!q) return legalMoves.slice(0, 80);
    return legalMoves
      .filter(
        (m) =>
          m.name.toLowerCase().includes(q) ||
          m.type.toLowerCase().includes(q) ||
          m.shortDesc.toLowerCase().includes(q)
      )
      .slice(0, 80);
  }, [legalMoves, moveSearch]);

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
        </div>
      </div>

      {isGraveyard ? (
        <div className="rounded-2xl border border-rose-500/40 bg-rose-950/30 p-4 text-xs text-rose-200">
          <p className="font-bold">💀 Descansa en el Cementerio del Exilio (Permadeath)</p>
          {instance?.epitaph && (
            <p className="mt-1 text-[11px] text-rose-200/80">
              Cayó en el Turno {instance.epitaph.turn} contra{' '}
              <strong>{instance.epitaph.rivalName}</strong> en{' '}
              <em>{instance.epitaph.chapterTitle}</em>.
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {/* Free-Mode Core Build Selectors: Ability, Nature, Tera Type */}
          {mode === 'free' && instance && onUpdateInstanceBuild && !isGen1 && (
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
              <div>
                <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Habilidad
                </label>
                <select
                  value={instance.ability}
                  onChange={(e) =>
                    onUpdateInstanceBuild(instance.uid, { ability: e.target.value })
                  }
                  className="w-full rounded-xl border border-slate-700 bg-slate-900 px-2.5 py-2 text-xs font-semibold text-white focus:border-amber-400 focus:outline-none"
                >
                  {availableAbilities.map((ab) => (
                    <option key={ab} value={ab}>
                      {ab}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Naturaleza
                </label>
                <select
                  value={instance.nature}
                  onChange={(e) =>
                    onUpdateInstanceBuild(instance.uid, { nature: e.target.value })
                  }
                  className="w-full rounded-xl border border-slate-700 bg-slate-900 px-2.5 py-2 text-xs font-semibold text-white focus:border-amber-400 focus:outline-none"
                >
                  {NATURES.map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Teratipo
                </label>
                <select
                  value={instance.teraType}
                  onChange={(e) =>
                    onUpdateInstanceBuild(instance.uid, { teraType: e.target.value })
                  }
                  className="w-full rounded-xl border border-slate-700 bg-slate-900 px-2.5 py-2 text-xs font-semibold text-white focus:border-amber-400 focus:outline-none"
                >
                  {TERA_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
            </div>
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
