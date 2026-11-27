import React, { useMemo, useState } from 'react';
import {
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  Backpack,
  CheckCircle2,
  Coins,
  Filter,
  Gamepad2,
  Scale,
  Search,
  Shield,
  ShoppingBag,
  Skull,
  Sparkles,
  Wrench,
  X,
} from 'lucide-react';
import {
  CURRENCY_NAME,
  CURRENCY_SHORT,
  MAX_SHINY_CHARMS,
  SHINY_CHARM_PRICE,
  SHOP_ITEMS,
} from '../data/economyCatalog';
import { computeActiveSocialLinkPerks } from '../data/socialLinksCatalog';
import { getSpeciesKey } from '../engine/learnsetService';
import {
  getAllAnythingGoesPlayableSpecies,
  getAllBiomePokedexSpecies,
  getImperialBstLicense,
  type SmogonPriceBand,
} from '../engine/pricingEngine';
import { getTypeBadgeClass } from '../engine/pokemonVisuals';
import {
  compareByShowdownSort,
  getIndexedSpeciesMeta,
  matchesShowdownFilters,
  queryShowdownSuggestions,
  type ShowdownSearchFilter,
  type ShowdownSortKey,
} from '../engine/showdownSearchIndex';
import type { PlayerSaveProfile } from '../types/game';
import { PokemonIcon, PokemonSprite } from './PokemonSprite';

interface ShopViewProps {
  profile: PlayerSaveProfile;
  onBackHome: () => void;
  onOpenTeamEditor: () => void;
  onOpenArcade: () => void;
  onBuyPokemon: (species: string) => { ok: boolean; error?: string };
  onBuyItem: (itemName: string) => { ok: boolean; error?: string };
  onBuyShinyCharm: () => { ok: boolean; error?: string };
}

type ShopTab = 'pokemon' | 'items' | 'shiny';

const SHINY_SHOWCASE_SPECIES = [
  'Arcanine',
  'Gardevoir',
  'Dragapult',
  'Kingambit',
  'Pikachu',
  'Miraidon',
];

const QUICK_TACTICAL_MOVES = [
  'Fake Out',
  'Tailwind',
  'Trick Room',
  'Wide Guard',
  'Spore',
  'Encore',
  'Haze',
  'Baton Pass',
];

const SHOP_PAGE_SIZE = 50;

function getStatValueColor(val: number): string {
  if (val >= 130) return 'text-cyan-300';
  if (val >= 105) return 'text-emerald-300';
  if (val >= 80) return 'text-slate-100';
  if (val >= 55) return 'text-slate-300';
  return 'text-slate-500';
}

export const ShopView: React.FC<ShopViewProps> = ({
  profile,
  onBackHome,
  onOpenTeamEditor,
  onOpenArcade,
  onBuyPokemon,
  onBuyItem,
  onBuyShinyCharm,
}) => {
  const [tab, setTab] = useState<ShopTab>('pokemon');

  // Showdown-style tactical search & filtering state for Pokémon Shop
  const [pokeSearch, setPokeSearch] = useState('');
  const [activeFilters, setActiveFilters] = useState<ShowdownSearchFilter[]>([]);
  const [tierFilter, setTierFilter] = useState<'all' | SmogonPriceBand>('all');
  const [sortBy, setSortBy] = useState<ShowdownSortKey>('price-asc');
  const [onlyAffordable, setOnlyAffordable] = useState(false);
  const [hideOwned, setHideOwned] = useState(false);
  const [visibleLimit, setVisibleLimit] = useState(SHOP_PAGE_SIZE);

  // Item tab search & category filter
  const [itemSearch, setItemSearch] = useState('');
  const [itemCategory, setItemCategory] = useState<'all' | 'Ofensivo' | 'Defensivo' | 'Táctico'>('all');

  const [toast, setToast] = useState<{ tone: 'ok' | 'err'; text: string } | null>(
    null
  );

  const bstLicense = useMemo(() => getImperialBstLicense(profile), [profile]);
  const perks = useMemo(() => computeActiveSocialLinkPerks(profile), [profile]);
  const fullAgDexActive = Boolean(profile.devFullAgPokedex);

  const rawShopSpecies = useMemo(
    () =>
      fullAgDexActive
        ? getAllAnythingGoesPlayableSpecies()
        : profile.devModeEnabled
          ? getAllBiomePokedexSpecies()
          : profile.unlockedPokedex,
    [fullAgDexActive, profile.devModeEnabled, profile.unlockedPokedex]
  );

  const totalWorldSpeciesCount = useMemo(
    () =>
      fullAgDexActive
        ? getAllAnythingGoesPlayableSpecies().length
        : getAllBiomePokedexSpecies().length,
    [fullAgDexActive]
  );

  const livingKeySet = useMemo(() => {
    const s = new Set<string>();
    for (const m of profile.pokemonBox) {
      if (m.zone !== 'graveyard') s.add(getSpeciesKey(m.species));
    }
    return s;
  }, [profile.pokemonBox]);

  const fallenKeySet = useMemo(() => {
    const s = new Set<string>();
    for (const m of profile.pokemonBox) {
      if (m.zone === 'graveyard') s.add(getSpeciesKey(m.species));
    }
    return s;
  }, [profile.pokemonBox]);

  // Showdown grouped autocomplete suggestions (Types / Tiers / Abilities / Learnable Moves!)
  const suggestions = useMemo(
    () => queryShowdownSuggestions(pokeSearch, activeFilters),
    [pokeSearch, activeFilters]
  );
  const hasSuggestions =
    suggestions.types.length > 0 ||
    suggestions.abilities.length > 0 ||
    suggestions.moves.length > 0 ||
    suggestions.tiers.length > 0;

  const addFilterChip = (filter: ShowdownSearchFilter) => {
    setActiveFilters((prev) => {
      if (
        prev.some(
          (f) =>
            f.kind === filter.kind &&
            f.value.toLowerCase() === filter.value.toLowerCase()
        )
      ) {
        return prev;
      }
      return [...prev, filter];
    });
    setPokeSearch('');
    setVisibleLimit(SHOP_PAGE_SIZE);
  };

  const toggleQuickMoveFilter = (moveName: string) => {
    setActiveFilters((prev) => {
      const exists = prev.some(
        (f) => f.kind === 'move' && f.value.toLowerCase() === moveName.toLowerCase()
      );
      if (exists) {
        return prev.filter(
          (f) => !(f.kind === 'move' && f.value.toLowerCase() === moveName.toLowerCase())
        );
      }
      return [...prev, { kind: 'move', value: moveName, label: `Mov: ${moveName}` }];
    });
    setVisibleLimit(SHOP_PAGE_SIZE);
  };

  const removeFilterChip = (idx: number) => {
    setActiveFilters((prev) => prev.filter((_, i) => i !== idx));
    setVisibleLimit(SHOP_PAGE_SIZE);
  };

  const clearAllFilters = () => {
    setPokeSearch('');
    setActiveFilters([]);
    setTierFilter('all');
    setOnlyAffordable(false);
    setHideOwned(false);
    setVisibleLimit(SHOP_PAGE_SIZE);
  };

  // Full indexed filtering + stat/price sorting across ALL available shop species!
  const filteredShopSpecies = useMemo(() => {
    const matched: string[] = [];
    for (const sp of rawShopSpecies) {
      const meta = getIndexedSpeciesMeta(sp);
      if (tierFilter !== 'all' && meta.pricing.tierBand !== tierFilter) continue;
      if (onlyAffordable && meta.pricing.finalPrice > profile.coins) continue;
      const spKey = getSpeciesKey(meta.name);
      if (hideOwned && livingKeySet.has(spKey)) continue;
      if (
        (pokeSearch.trim() || activeFilters.length > 0) &&
        !matchesShowdownFilters(meta.name, pokeSearch, activeFilters)
      ) {
        continue;
      }
      matched.push(meta.name);
    }
    matched.sort((a, b) => compareByShowdownSort(a, b, sortBy));
    return matched;
  }, [
    rawShopSpecies,
    tierFilter,
    onlyAffordable,
    hideOwned,
    profile.coins,
    livingKeySet,
    pokeSearch,
    activeFilters,
    sortBy,
  ]);

  const filteredShopItems = useMemo(() => {
    const q = itemSearch.trim().toLowerCase();
    return SHOP_ITEMS.filter((it) => {
      if (itemCategory !== 'all' && it.category !== itemCategory) return false;
      if (!q) return true;
      return (
        it.name.toLowerCase().includes(q) ||
        it.desc.toLowerCase().includes(q) ||
        it.category.toLowerCase().includes(q)
      );
    });
  }, [itemSearch, itemCategory]);

  const showFeedback = (res: { ok: boolean; error?: string }, okMsg: string) => {
    setToast(
      res.ok
        ? { tone: 'ok', text: okMsg }
        : { tone: 'err', text: res.error || 'No se pudo completar la compra.' }
    );
  };

  const renderStatHeaderBtn = (key: ShowdownSortKey, label: string, title: string) => {
    const active = sortBy === key;
    return (
      <button
        type="button"
        title={title}
        onClick={() => {
          setSortBy(key);
          setVisibleLimit(SHOP_PAGE_SIZE);
        }}
        className={`inline-flex items-center justify-center gap-0.5 rounded px-1 py-0.5 text-[10px] font-extrabold uppercase tracking-wider transition cursor-pointer ${
          active
            ? 'bg-amber-400/20 text-amber-200 ring-1 ring-amber-400/50'
            : 'text-slate-400 hover:bg-slate-800 hover:text-white'
        }`}
      >
        <span>{label}</span>
        {active &&
          (key === 'price-asc' ? (
            <ArrowUp className="h-2.5 w-2.5" />
          ) : (
            <ArrowDown className="h-2.5 w-2.5" />
          ))}
      </button>
    );
  };

  return (
    <div className="relative min-h-screen bg-[#060a14] text-slate-100">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-28 left-1/3 h-96 w-[38rem] rounded-full bg-amber-500/12 blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 h-96 w-[34rem] rounded-full bg-fuchsia-600/10 blur-[120px]" />
      </div>

      <div className="relative z-10 mx-auto max-w-6xl px-5 py-7">
        {/* Header */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
          <div className="flex items-center gap-3.5">
            <button
              onClick={onBackHome}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-3.5 py-2 text-xs font-semibold text-slate-300 transition hover:border-amber-400/50 hover:text-white cursor-pointer"
            >
              <ArrowLeft className="h-4 w-4" />
              Inicio
            </button>
            <div>
              <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.2em] text-amber-300">
                <ShoppingBag className="h-3.5 w-3.5" />
                Mercado Real de Wyndon
              </p>
              <h1 className="font-display text-2xl font-extrabold text-white sm:text-3xl">
                Tienda &amp; Amuletos Variocolor
              </h1>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <div className="inline-flex items-center gap-2 rounded-xl border border-amber-400/45 bg-amber-500/15 px-3.5 py-2 text-xs font-extrabold text-amber-200 shadow-lg shadow-amber-500/10">
              <Coins className="h-4 w-4 text-amber-400" />
              <span className="font-mono-code text-sm">
                {profile.coins.toLocaleString()}
              </span>
              <span className="text-[10px] uppercase text-amber-300/80">
                {CURRENCY_NAME}
              </span>
            </div>

            <button
              onClick={onOpenArcade}
              className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-400/45 bg-emerald-500/15 px-3.5 py-2 text-xs font-bold text-emerald-200 hover:bg-emerald-500/25 cursor-pointer"
            >
              <Gamepad2 className="h-4 w-4" />
              Farmear en Arcade
            </button>

            <button
              onClick={onOpenTeamEditor}
              className="inline-flex items-center gap-1.5 rounded-xl border border-sky-400/45 bg-sky-500/15 px-3.5 py-2 text-xs font-bold text-sky-200 hover:bg-sky-500/25 cursor-pointer"
            >
              <Wrench className="h-4 w-4" />
              Editor de Equipo
            </button>
          </div>
        </div>

        {/* Feedback Toast */}
        {toast && (
          <div
            className={`mb-5 flex items-center justify-between rounded-2xl border px-4 py-3 text-xs font-semibold ${
              toast.tone === 'ok'
                ? 'border-emerald-400/40 bg-emerald-500/15 text-emerald-200'
                : 'border-rose-500/40 bg-rose-500/15 text-rose-200'
            }`}
          >
            <span>{toast.text}</span>
            <button
              type="button"
              onClick={() => setToast(null)}
              className="text-[11px] opacity-75 hover:opacity-100 cursor-pointer"
            >
              Cerrar
            </button>
          </div>
        )}

        {/* Tabs */}
        <div className="mb-6 flex flex-wrap gap-2">
          {(
            [
              {
                id: 'pokemon',
                label: fullAgDexActive
                  ? `Pokédex Nacional AG (${totalWorldSpeciesCount})`
                  : `Pokédex de Compra (${profile.unlockedPokedex.length}/${totalWorldSpeciesCount})`,
                icon: Shield,
              },
              {
                id: 'items',
                label: `Objetos (${profile.inventory.items.length})`,
                icon: Backpack,
              },
              {
                id: 'shiny',
                label: `Shiny Charms (${profile.inventory.shinyCharms}/${MAX_SHINY_CHARMS})`,
                icon: Sparkles,
              },
            ] as const
          ).map((t) => {
            const Icon = t.icon;
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-xs font-bold transition cursor-pointer ${
                  active
                    ? t.id === 'shiny'
                      ? 'border-fuchsia-400 bg-fuchsia-500/20 text-fuchsia-200 shadow-lg shadow-fuchsia-500/15'
                      : 'border-amber-400 bg-amber-500/20 text-amber-200'
                    : 'border-slate-800 bg-slate-900/75 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                }`}
              >
                <Icon className="h-4 w-4" />
                {t.label}
              </button>
            );
          })}
        </div>

        {/* TAB 1: SHOWDOWN-STYLE TACTICAL BLACK MARKET POKÉDEX */}
        {tab === 'pokemon' && (
          <div className="space-y-4">
            {/* Economic Formula + Imperial BST License + Nuzlocke Refund Banner */}
            <div className="grid gap-3 rounded-2xl border border-amber-400/30 bg-slate-900/85 p-4 lg:grid-cols-12">
              <div className="space-y-1 lg:col-span-7">
                <p className="flex items-center gap-1.5 text-xs font-extrabold text-amber-200">
                  <Scale className="h-4 w-4 text-amber-400" />
                  Mercado Estratégico · Economía Smogon + Buscador Showdown
                </p>
                <p className="text-[11px] leading-relaxed text-slate-300">
                  <code className="rounded bg-slate-950 px-1.5 py-0.5 text-amber-200">
                    Precio = ⌊BST × Tier Smogon⌋ + Impuesto Habilidad
                  </code>{' '}
                  · Filtra por <strong>movimientos aprendibles</strong> (ej. Fake Out, Wide Guard, Tailwind), <strong>Tipo</strong>, <strong>Habilidad</strong> u ordena por <strong>Spe / Atk / SpA / Def / SpD / HP</strong> para planear tu siguiente combate.
                </p>
                <p className="text-[10.5px] text-emerald-300/90">
                  💀 En Nuzlocke, ganar un combate con bajas permanentes reembolsa el{' '}
                  <strong>{Math.round((1 - perks.casualtyTaxRate) * 100)}%</strong> de su valor de tienda (impuesto de reposición: {Math.round(perks.casualtyTaxRate * 100)}%).
                </p>
              </div>
              <div className="flex flex-col justify-center rounded-xl border border-sky-400/30 bg-slate-950/80 p-3 lg:col-span-5">
                <div className="flex items-center justify-between gap-2 text-[11px] font-extrabold">
                  <span className="text-sky-200">{bstLicense.shortLabel}</span>
                  <span
                    className={`font-mono-code ${
                      bstLicense.isOverCap ? 'text-rose-300' : 'text-emerald-300'
                    }`}
                  >
                    Equipo: {bstLicense.currentPartyBst}
                    {bstLicense.maxTeamBst !== null
                      ? ` / ${bstLicense.maxTeamBst} BST`
                      : ' BST'}
                  </span>
                </div>
                <p className="mt-1 text-[10px] text-slate-400">
                  {bstLicense.nextActUnlockHint}
                </p>
              </div>
            </div>

            {/* SHOWDOWN-STYLE INDEXED SEARCH + AUTOCOMPLETE CHIPS + TACTICAL SHORTCUTS */}
            <div className="space-y-2.5 rounded-2xl border border-slate-800 bg-slate-900/75 p-3.5">
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative min-w-[240px] flex-1">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-amber-300" />
                  <input
                    type="text"
                    value={pokeSearch}
                    onChange={(e) => {
                      setPokeSearch(e.target.value);
                      setVisibleLimit(SHOP_PAGE_SIZE);
                    }}
                    placeholder="Buscador Showdown: movimiento aprendible (Wide Guard, Fake Out), tipo (Steel), habilidad (Intimidate) o stat (spe>=110, def>=100)..."
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 py-2 pl-9 pr-20 text-xs text-white placeholder-slate-500 focus:border-amber-400 focus:outline-none"
                  />
                  {(pokeSearch ||
                    activeFilters.length > 0 ||
                    tierFilter !== 'all' ||
                    onlyAffordable ||
                    hideOwned) && (
                    <button
                      type="button"
                      onClick={clearAllFilters}
                      className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg border border-slate-700 bg-slate-900 px-2 py-0.5 text-[10px] font-bold text-slate-300 hover:text-white cursor-pointer"
                    >
                      Limpiar
                    </button>
                  )}
                </div>

                <select
                  value={sortBy}
                  onChange={(e) => {
                    setSortBy(e.target.value as ShowdownSortKey);
                    setVisibleLimit(SHOP_PAGE_SIZE);
                  }}
                  className="rounded-xl border border-slate-700 bg-slate-950 px-2.5 py-2 text-[11px] font-bold text-slate-200 focus:border-amber-400 focus:outline-none"
                >
                  <option value="price-asc">Precio ↑ (Más baratos)</option>
                  <option value="price-desc">Precio ↓ (Más caros)</option>
                  <option value="spe">Velocidad (Spe ↓ · Outspeed)</option>
                  <option value="atk">Ataque Físico (Atk ↓)</option>
                  <option value="spa">Ataque Especial (SpA ↓)</option>
                  <option value="hp">Vida (HP ↓ · Tanques)</option>
                  <option value="def">Defensa Física (Def ↓)</option>
                  <option value="spd">Defensa Especial (SpD ↓)</option>
                  <option value="bst">BST ↓ (Más fuertes)</option>
                  <option value="name">Nombre A–Z</option>
                </select>
              </div>

              {/* Grouped Showdown Autocomplete Suggestions (Types / Tiers / Abilities / Learnable Moves!) */}
              {hasSuggestions && (
                <div className="rounded-xl border border-amber-400/35 bg-[#080d1a] p-2.5 text-[11px] shadow-xl">
                  <div className="flex flex-wrap items-center gap-1.5">
                    {suggestions.types.map((t) => (
                      <button
                        key={`shop-sug-type-${t.name}`}
                        type="button"
                        onClick={() =>
                          addFilterChip({
                            kind: 'type',
                            value: t.name,
                            label: `Tipo: ${t.name}`,
                          })
                        }
                        className="inline-flex items-center gap-1 rounded-lg border border-sky-400/40 bg-slate-900 px-2 py-1 text-[10.5px] font-bold text-white hover:border-sky-300 hover:bg-sky-500/15 cursor-pointer"
                      >
                        <span
                          className={`rounded border px-1 py-0.2 text-[9px] uppercase ${getTypeBadgeClass(t.name)}`}
                        >
                          {t.name}
                        </span>
                        <span className="rounded border border-emerald-400/50 bg-emerald-500/15 px-1 text-[9px] text-emerald-200">
                          Filtro
                        </span>
                      </button>
                    ))}
                    {suggestions.tiers.map((tier) => (
                      <button
                        key={`shop-sug-tier-${tier.name}`}
                        type="button"
                        onClick={() =>
                          addFilterChip({
                            kind: 'tier',
                            value: tier.name,
                            label: `Tier: ${tier.name}`,
                          })
                        }
                        className="inline-flex items-center gap-1 rounded-lg border border-fuchsia-400/40 bg-slate-900 px-2 py-1 text-[10.5px] font-bold text-fuchsia-200 hover:bg-fuchsia-500/15 cursor-pointer"
                      >
                        <span>Tier {tier.name}</span>
                        <span className="rounded border border-emerald-400/50 bg-emerald-500/15 px-1 text-[9px] text-emerald-200">
                          Filtro
                        </span>
                      </button>
                    ))}
                    {suggestions.abilities.map((ab) => (
                      <button
                        key={`shop-sug-ab-${ab.name}`}
                        type="button"
                        title={ab.shortDesc}
                        onClick={() =>
                          addFilterChip({
                            kind: 'ability',
                            value: ab.name,
                            label: `Hab: ${ab.name}`,
                          })
                        }
                        className="inline-flex items-center gap-1 rounded-lg border border-emerald-400/35 bg-slate-900 px-2 py-1 text-[10.5px] font-bold text-emerald-200 hover:bg-emerald-500/15 cursor-pointer"
                      >
                        <span>Hab: {ab.name}</span>
                        <span className="rounded border border-emerald-400/50 bg-emerald-500/15 px-1 text-[9px] text-emerald-200">
                          Filtro
                        </span>
                      </button>
                    ))}
                    {suggestions.moves.map((mv) => (
                      <button
                        key={`shop-sug-mv-${mv.name}`}
                        type="button"
                        onClick={() =>
                          addFilterChip({
                            kind: 'move',
                            value: mv.name,
                            label: `Mov: ${mv.name}`,
                          })
                        }
                        className="inline-flex items-center gap-1 rounded-lg border border-amber-400/35 bg-slate-900 px-2 py-1 text-[10.5px] font-bold text-amber-100 hover:bg-amber-500/15 cursor-pointer"
                      >
                        <span>Aprende: {mv.name}</span>
                        <span
                          className={`rounded border px-1 py-0.2 text-[8.5px] uppercase ${getTypeBadgeClass(mv.type)}`}
                        >
                          {mv.type}
                        </span>
                        <span className="rounded border border-emerald-400/50 bg-emerald-500/15 px-1 text-[9px] text-emerald-200">
                          Filtro
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Active Stackable Filter Chips */}
              {activeFilters.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase text-slate-400">
                    <Filter className="h-3 w-3 text-amber-400" />
                    Filtros activos:
                  </span>
                  {activeFilters.map((f, idx) => (
                    <span
                      key={`active-${f.kind}-${f.value}-${idx}`}
                      className={`inline-flex items-center gap-1 rounded-lg border px-2 py-0.5 text-[10.5px] font-extrabold ${
                        f.kind === 'type'
                          ? 'border-sky-400/50 bg-sky-500/20 text-sky-100'
                          : f.kind === 'ability'
                            ? 'border-emerald-400/50 bg-emerald-500/20 text-emerald-100'
                            : f.kind === 'move'
                              ? 'border-amber-400/50 bg-amber-500/20 text-amber-100'
                              : 'border-fuchsia-400/50 bg-fuchsia-500/20 text-fuchsia-100'
                      }`}
                    >
                      <span>{f.label}</span>
                      <button
                        type="button"
                        onClick={() => removeFilterChip(idx)}
                        className="rounded hover:bg-black/30 cursor-pointer"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}

              {/* Tier Pills + Budget / Owned Toggles */}
              <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-800/80 pt-2">
                <div className="flex flex-wrap gap-1">
                  {(
                    ['all', 'LC', 'PU / ZU', 'RU / NU', 'UU / UUBL', 'OU', 'Uber / AG'] as const
                  ).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => {
                        setTierFilter(t);
                        setVisibleLimit(SHOP_PAGE_SIZE);
                      }}
                      className={`rounded-lg border px-2.5 py-1 text-[10.5px] font-bold transition cursor-pointer ${
                        tierFilter === t
                          ? 'border-amber-400 bg-amber-500/20 text-amber-100'
                          : 'border-slate-800 bg-slate-950 text-slate-400 hover:text-white'
                      }`}
                    >
                      {t === 'all' ? 'Todos' : t}
                    </button>
                  ))}
                </div>

                <div className="flex flex-wrap items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setOnlyAffordable((v) => !v);
                      setVisibleLimit(SHOP_PAGE_SIZE);
                    }}
                    className={`rounded-lg border px-2.5 py-1 text-[10.5px] font-bold transition cursor-pointer ${
                      onlyAffordable
                        ? 'border-emerald-400 bg-emerald-500/20 text-emerald-100'
                        : 'border-slate-700 bg-slate-950 text-slate-300 hover:border-emerald-400/50'
                    }`}
                  >
                    💰 Solo comprables (≤ {profile.coins.toLocaleString()} PC)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setHideOwned((v) => !v);
                      setVisibleLimit(SHOP_PAGE_SIZE);
                    }}
                    className={`rounded-lg border px-2.5 py-1 text-[10.5px] font-bold transition cursor-pointer ${
                      hideOwned
                        ? 'border-sky-400 bg-sky-500/20 text-sky-100'
                        : 'border-slate-700 bg-slate-950 text-slate-300 hover:border-sky-400/50'
                    }`}
                  >
                    Ocultar ya reclutados
                  </button>
                </div>
              </div>

              {/* 1-Click Strategic Move Shortcuts */}
              <div className="flex flex-wrap items-center gap-1.5 border-t border-slate-800/70 pt-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Strats rápidas (Aprende):
                </span>
                {QUICK_TACTICAL_MOVES.map((mv) => {
                  const isActive = activeFilters.some(
                    (f) => f.kind === 'move' && f.value.toLowerCase() === mv.toLowerCase()
                  );
                  return (
                    <button
                      key={mv}
                      type="button"
                      onClick={() => toggleQuickMoveFilter(mv)}
                      className={`rounded-md border px-2 py-0.5 text-[10px] font-bold transition cursor-pointer ${
                        isActive
                          ? 'border-amber-400 bg-amber-500/25 text-amber-100'
                          : 'border-slate-800 bg-slate-950 text-slate-400 hover:border-amber-400/50 hover:text-amber-200'
                      }`}
                    >
                      {mv}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Results Counter */}
            <div className="flex flex-wrap items-center justify-between gap-2 px-1 text-[11px] text-slate-400">
              <span>
                Mostrando{' '}
                <strong className="text-white">
                  {Math.min(visibleLimit, filteredShopSpecies.length)}
                </strong>{' '}
                de{' '}
                <strong className="text-amber-200">
                  {filteredShopSpecies.length}
                </strong>{' '}
                especies disponibles · Haz clic en cualquier columna de estadística para ordenar
              </span>
              <span className="font-mono-code text-[10px] text-slate-500">
                Catálogo total: {rawShopSpecies.length} especies
              </span>
            </div>

            {/* SHOWDOWN-STYLE TACTICAL TABLE */}
            <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/75">
              {/* Clickable Column Header Row (Showdown Teambuilder Layout!) */}
              <div className="hidden grid-cols-12 items-center gap-2 border-b border-slate-800 bg-slate-950/90 px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-400 lg:grid">
                <div className="col-span-4 flex items-center gap-2">
                  <span>Tier · Pokémon · Tipos</span>
                </div>
                <div className="col-span-2">Habilidades</div>
                <div className="col-span-4 grid grid-cols-7 gap-0.5 text-center">
                  {renderStatHeaderBtn('hp', 'HP', 'Ordenar por HP base más alto')}
                  {renderStatHeaderBtn('atk', 'Atk', 'Ordenar por Ataque físico más alto')}
                  {renderStatHeaderBtn('def', 'Def', 'Ordenar por Defensa física más alta')}
                  {renderStatHeaderBtn('spa', 'SpA', 'Ordenar por Ataque Especial más alto')}
                  {renderStatHeaderBtn('spd', 'SpD', 'Ordenar por Defensa Especial más alta')}
                  {renderStatHeaderBtn('spe', 'Spe', 'Ordenar por Velocidad más alta (Outspeed)')}
                  {renderStatHeaderBtn('bst', 'BST', 'Ordenar por BST total')}
                </div>
                <div className="col-span-2 flex items-center justify-end gap-2">
                  {renderStatHeaderBtn('price-asc', 'Precio', 'Ordenar por precio más barato')}
                </div>
              </div>

              {filteredShopSpecies.length === 0 ? (
                <div className="px-6 py-10 text-center text-xs text-slate-400">
                  Ningún Pokémon disponible en tu catálogo coincide con esos filtros. Prueba limpiar un filtro o desactivar «Solo comprables».
                </div>
              ) : (
                <div className="divide-y divide-slate-800/75">
                  {filteredShopSpecies.slice(0, visibleLimit).map((spName) => {
                    const meta = getIndexedSpeciesMeta(spName);
                    const { pricing, baseStats: bs } = meta;
                    const spKey = getSpeciesKey(meta.name);
                    const hasLivingCopy = livingKeySet.has(spKey);
                    const hasFallenCopy = fallenKeySet.has(spKey);
                    const canAfford = profile.coins >= pricing.finalPrice;
                    const tierCls =
                      pricing.tierBand === 'Uber / AG'
                        ? 'border-fuchsia-400/50 bg-fuchsia-500/20 text-fuchsia-200'
                        : pricing.tierBand === 'OU'
                          ? 'border-rose-400/45 bg-rose-500/15 text-rose-200'
                          : pricing.tierBand === 'UU / UUBL'
                            ? 'border-amber-400/45 bg-amber-500/15 text-amber-200'
                            : pricing.tierBand === 'RU / NU'
                              ? 'border-sky-400/40 bg-sky-500/15 text-sky-200'
                              : pricing.tierBand === 'LC'
                                ? 'border-emerald-400/45 bg-emerald-500/15 text-emerald-200'
                                : 'border-slate-600 bg-slate-800/80 text-slate-200';

                    return (
                      <div
                        key={meta.name}
                        className="grid grid-cols-1 items-center gap-2.5 px-3 py-2.5 transition hover:bg-slate-800/45 lg:grid-cols-12"
                      >
                        {/* Col 1-4: Tier + Sprite + Name + Types */}
                        <div className="flex min-w-0 items-center gap-2 lg:col-span-4">
                          <span
                            title={`${pricing.tierBand} (${pricing.tierMultiplier}× BST)`}
                            className={`w-16 shrink-0 rounded-md border px-1.5 py-0.5 text-center text-[9px] font-extrabold uppercase ${tierCls}`}
                          >
                            {pricing.tierBand}
                          </span>
                          <PokemonIcon species={meta.name} className="shrink-0" />
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-xs font-extrabold text-white">
                              {meta.name}
                            </p>
                            <div className="mt-0.5 flex flex-wrap items-center gap-1">
                              {meta.types.map((t) => (
                                <button
                                  key={t}
                                  type="button"
                                  title={`Filtrar por tipo ${t}`}
                                  onClick={() =>
                                    addFilterChip({
                                      kind: 'type',
                                      value: t,
                                      label: `Tipo: ${t}`,
                                    })
                                  }
                                  className={`rounded border px-1 py-0.2 text-[8.5px] font-bold uppercase hover:brightness-125 cursor-pointer ${getTypeBadgeClass(t)}`}
                                >
                                  {t}
                                </button>
                              ))}
                              {pricing.abilityTax > 0 && pricing.taxedAbility && (
                                <span className="rounded border border-rose-400/40 bg-rose-500/15 px-1 py-0.2 text-[8.5px] font-bold text-rose-200">
                                  +{pricing.abilityTax} PC ({pricing.taxedAbility})
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Col 5-6: Abilities (clickable to filter!) */}
                        <div className="flex flex-wrap gap-1 lg:col-span-2">
                          {meta.abilities.map((ab) => (
                            <button
                              key={ab}
                              type="button"
                              title={`Filtrar por habilidad ${ab}`}
                              onClick={() =>
                                addFilterChip({
                                  kind: 'ability',
                                  value: ab,
                                  label: `Hab: ${ab}`,
                                })
                              }
                              className="rounded border border-slate-700/80 bg-slate-950/90 px-1.5 py-0.5 text-[9.5px] font-semibold text-slate-300 hover:border-emerald-400/50 hover:text-emerald-200 cursor-pointer"
                            >
                              {ab}
                            </button>
                          ))}
                        </div>

                        {/* Col 7-10: Showdown Base Stats Grid (HP / Atk / Def / SpA / SpD / Spe / BST) */}
                        <div className="grid grid-cols-7 gap-1 rounded-xl bg-slate-950/60 px-2 py-1 text-center font-mono-code text-[11px] lg:col-span-4 lg:bg-transparent lg:px-0 lg:py-0">
                          {(
                            [
                              ['hp', bs.hp, 'HP'],
                              ['atk', bs.atk, 'Atk'],
                              ['def', bs.def, 'Def'],
                              ['spa', bs.spa, 'SpA'],
                              ['spd', bs.spd, 'SpD'],
                              ['spe', bs.spe, 'Spe'],
                              ['bst', meta.bst, 'BST'],
                            ] as const
                          ).map(([statKey, val, lbl]) => {
                            const isSorted = sortBy === statKey;
                            return (
                              <div
                                key={statKey}
                                className={`rounded py-0.5 ${
                                  isSorted
                                    ? 'bg-amber-400/20 ring-1 ring-amber-400/50'
                                    : ''
                                }`}
                              >
                                <span className="block text-[8px] font-bold uppercase text-slate-500 lg:hidden">
                                  {lbl}
                                </span>
                                <span
                                  className={`font-extrabold ${
                                    isSorted
                                      ? 'text-amber-200'
                                      : statKey === 'bst'
                                        ? 'text-sky-300'
                                        : getStatValueColor(val)
                                  }`}
                                >
                                  {val}
                                </span>
                              </div>
                            );
                          })}
                        </div>

                        {/* Col 11-12: Price + Action Button */}
                        <div className="flex items-center justify-between gap-2 lg:col-span-2 lg:justify-end">
                          <span className="font-mono-code text-xs font-extrabold text-amber-300">
                            {pricing.finalPrice.toLocaleString()} {CURRENCY_SHORT}
                          </span>
                          {hasLivingCopy ? (
                            <span className="inline-flex items-center gap-1 rounded-lg border border-emerald-400/35 bg-emerald-500/15 px-2 py-1 text-[10px] font-bold text-emerald-300">
                              <CheckCircle2 className="h-3 w-3" />
                              En PC
                            </span>
                          ) : (
                            <button
                              type="button"
                              disabled={!canAfford}
                              onClick={() =>
                                showFeedback(
                                  onBuyPokemon(meta.name),
                                  `¡Reclutaste a ${meta.name} por ${pricing.finalPrice.toLocaleString()} PC! Ya está en tu Caja de Reserva.`
                                )
                              }
                              className="inline-flex items-center gap-1 rounded-lg bg-gradient-to-r from-amber-500 to-yellow-500 px-2.5 py-1 text-[10.5px] font-extrabold text-slate-950 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-35 cursor-pointer"
                            >
                              {hasFallenCopy ? (
                                <Skull className="h-3 w-3" />
                              ) : (
                                <Coins className="h-3 w-3" />
                              )}
                              {hasFallenCopy ? 'Reemplazar' : 'Reclutar'}
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {filteredShopSpecies.length > visibleLimit && (
              <button
                type="button"
                onClick={() => setVisibleLimit((v) => v + SHOP_PAGE_SIZE)}
                className="w-full rounded-xl border border-slate-700 bg-slate-900 py-2.5 text-xs font-extrabold text-amber-200 hover:border-amber-400/60 hover:bg-slate-800 cursor-pointer"
              >
                Mostrar +{SHOP_PAGE_SIZE} especies más ({filteredShopSpecies.length - visibleLimit} restantes)
              </button>
            )}
          </div>
        )}

        {/* TAB 2: HELD ITEMS (WITH SEARCH & CATEGORY FILTER FOR MEGA STONES & Z-CRYSTALS!) */}
        {tab === 'items' && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative min-w-[220px] flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={itemSearch}
                  onChange={(e) => setItemSearch(e.target.value)}
                  placeholder="Buscar objeto, Mega Piedra (Charizardite, Metagrossite) o Cristal Z (Firium Z, Dragonium Z)..."
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 py-2 pl-9 pr-3 text-xs text-white placeholder-slate-500 focus:border-amber-400 focus:outline-none"
                />
              </div>
              <div className="flex gap-1">
                {(['all', 'Ofensivo', 'Defensivo', 'Táctico'] as const).map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setItemCategory(cat)}
                    className={`rounded-lg border px-2.5 py-1.5 text-[10.5px] font-bold transition cursor-pointer ${
                      itemCategory === cat
                        ? 'border-amber-400 bg-amber-500/20 text-amber-100'
                        : 'border-slate-800 bg-slate-900 text-slate-400 hover:text-white'
                    }`}
                  >
                    {cat === 'all' ? 'Todos' : cat}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
              {filteredShopItems.map((item) => {
                const owned = profile.inventory.items.includes(item.name);
                const canAfford = profile.coins >= item.price;
                return (
                  <div
                    key={item.name}
                    className="flex flex-col justify-between rounded-2xl border border-slate-800 bg-slate-900/80 p-4"
                  >
                    <div>
                      <div className="mb-1.5 flex items-center justify-between">
                        <span className="rounded border border-slate-700 bg-slate-950 px-2 py-0.5 text-[10px] font-bold text-sky-300">
                          {item.category}
                        </span>
                        <span className="font-mono-code text-xs font-extrabold text-amber-300">
                          {item.price.toLocaleString()} {CURRENCY_SHORT}
                        </span>
                      </div>
                      <h3 className="text-sm font-extrabold text-white">
                        {item.name}
                      </h3>
                      <p className="mt-1 text-xs leading-relaxed text-slate-400">
                        {item.desc}
                      </p>
                    </div>
                    <div className="mt-3.5">
                      {owned ? (
                        <div className="flex items-center justify-center gap-1.5 rounded-xl border border-emerald-400/35 bg-emerald-500/15 py-2 text-xs font-bold text-emerald-300">
                          <CheckCircle2 className="h-4 w-4" />
                          Desbloqueado
                        </div>
                      ) : (
                        <button
                          disabled={!canAfford}
                          onClick={() =>
                            showFeedback(
                              onBuyItem(item.name),
                              `¡Compraste ${item.name}! Disponible para tus equipos.`
                            )
                          }
                          className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-amber-500 py-2 text-xs font-extrabold text-slate-950 hover:brightness-110 disabled:opacity-35 cursor-pointer"
                        >
                          <Coins className="h-3.5 w-3.5" />
                          Comprar ({item.price.toLocaleString()} {CURRENCY_SHORT})
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 3: SHINY CHARMS (ENDGAME PRESTIGE — MAX 6) */}
        {tab === 'shiny' && (
          <div className="rounded-3xl border border-fuchsia-400/45 bg-gradient-to-br from-fuchsia-950/40 via-slate-950 to-amber-950/30 p-6 shadow-2xl">
            <div className="grid items-center gap-6 lg:grid-cols-12">
              <div className="lg:col-span-7">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-fuchsia-400/45 bg-fuchsia-500/20 px-3 py-1 text-[11px] font-extrabold uppercase tracking-wider text-fuchsia-200">
                  <Sparkles className="h-3.5 w-3.5" />
                  Endgame de Prestigio · Máximo {MAX_SHINY_CHARMS}
                </span>
                <h2 className="font-display mt-3 text-3xl font-extrabold text-white">
                  Amuleto Variocolor (Shiny Charm)
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-slate-300">
                  Cada <strong>Amuleto Variocolor</strong> desbloquea el modo{' '}
                  <span className="font-bold text-amber-200">✨ Shiny</span> para{' '}
                  <strong>1 slot completo</strong> de tu equipo (tanto en tu
                  Equipo Personalizado como en cualquier capítulo canónico desde
                  el Briefing). Con 6 Amuletos, ¡todo tu equipo brilla en{' '}
                  <code>@pkmn/sim</code> y sprites animados!
                </p>

                {/* 6 Prestige Charm Slots */}
                <div className="mt-5 grid grid-cols-3 gap-2.5 sm:grid-cols-6">
                  {Array.from({ length: MAX_SHINY_CHARMS }).map((_, idx) => {
                    const unlocked = idx < profile.inventory.shinyCharms;
                    return (
                      <div
                        key={idx}
                        className={`flex flex-col items-center rounded-2xl border p-2.5 text-center transition ${
                          unlocked
                            ? 'border-amber-300/70 bg-gradient-to-b from-fuchsia-500/25 to-amber-500/20 shadow-lg shadow-amber-500/15'
                            : 'border-slate-800 bg-slate-950/70 opacity-50'
                        }`}
                      >
                        <Sparkles
                          className={`h-5 w-5 ${
                            unlocked ? 'text-amber-300' : 'text-slate-600'
                          }`}
                        />
                        <span className="mt-1 text-[10px] font-bold text-white">
                          Slot {idx + 1}
                        </span>
                        <span className="text-[9px] text-slate-400">
                          {unlocked ? '✨ Activo' : 'Bloqueado'}
                        </span>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-6 flex flex-wrap items-center gap-3">
                  <button
                    disabled={
                      profile.inventory.shinyCharms >= MAX_SHINY_CHARMS ||
                      profile.coins < SHINY_CHARM_PRICE
                    }
                    onClick={() =>
                      showFeedback(
                        onBuyShinyCharm(),
                        `✨ ¡Amuleto Variocolor #${profile.inventory.shinyCharms + 1} adquirido! Actívalo en el Editor de Equipo o en el Briefing.`
                      )
                    }
                    className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-fuchsia-500 via-amber-400 to-yellow-400 px-6 py-3 text-sm font-extrabold text-slate-950 shadow-xl shadow-fuchsia-500/25 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40 cursor-pointer"
                  >
                    <Sparkles className="h-4 w-4" />
                    {profile.inventory.shinyCharms >= MAX_SHINY_CHARMS
                      ? '¡Colección Completa (6/6)!'
                      : `Comprar Amuleto #${profile.inventory.shinyCharms + 1} — ${SHINY_CHARM_PRICE.toLocaleString()} ${CURRENCY_SHORT}`}
                  </button>

                  {profile.coins < SHINY_CHARM_PRICE &&
                    profile.inventory.shinyCharms < MAX_SHINY_CHARMS && (
                      <span className="text-xs text-amber-200/80">
                        Te faltan{' '}
                        <strong>
                          {(SHINY_CHARM_PRICE - profile.coins).toLocaleString()}{' '}
                          {CURRENCY_SHORT}
                        </strong>{' '}
                        (farmea combates Kaizo o el Arcade).
                      </span>
                    )}
                </div>
              </div>

              {/* Live Animated Shiny Preview Grid */}
              <div className="lg:col-span-5">
                <p className="mb-2 text-center text-[11px] font-bold uppercase tracking-wider text-amber-300">
                  Vista Previa de Sprites Shiny Reales
                </p>
                <div className="grid grid-cols-3 gap-2.5">
                  {SHINY_SHOWCASE_SPECIES.map((sp) => (
                    <div
                      key={sp}
                      className="flex flex-col items-center rounded-2xl border border-amber-400/30 bg-slate-950/85 p-2.5"
                    >
                      <PokemonSprite
                        species={sp}
                        side="p2"
                        shiny
                        className="h-16 w-16"
                      />
                      <span className="mt-1 truncate text-[10px] font-bold text-amber-200">
                        ✨ {sp}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
