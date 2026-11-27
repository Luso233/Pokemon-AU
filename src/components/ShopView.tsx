import React, { useMemo, useState } from 'react';
import {
  ArrowLeft,
  Backpack,
  CheckCircle2,
  Coins,
  Disc3,
  Gamepad2,
  Scale,
  Search,
  Shield,
  ShoppingBag,
  Skull,
  Sparkles,
  Wrench,
} from 'lucide-react';
import {
  CURRENCY_NAME,
  CURRENCY_SHORT,
  MAX_SHINY_CHARMS,
  POKEMON_CATALOG_MAP,
  SHINY_CHARM_PRICE,
  SHOP_ITEMS,
  SHOP_TMS,
} from '../data/economyCatalog';
import { computeActiveSocialLinkPerks } from '../data/socialLinksCatalog';
import { getSpeciesKey } from '../engine/learnsetService';
import {
  buildSmartDefaultMemberForSpecies,
  computePokemonShopPricing,
  getAllBiomePokedexSpecies,
  getImperialBstLicense,
  type SmogonPriceBand,
} from '../engine/pricingEngine';
import { getTypeBadgeClass } from '../engine/pokemonVisuals';
import type { PlayerSaveProfile } from '../types/game';
import { PokemonSprite } from './PokemonSprite';

interface ShopViewProps {
  profile: PlayerSaveProfile;
  onBackHome: () => void;
  onOpenTeamEditor: () => void;
  onOpenArcade: () => void;
  onBuyPokemon: (species: string) => { ok: boolean; error?: string };
  onBuyItem: (itemName: string) => { ok: boolean; error?: string };
  onBuyTM: (moveName: string) => { ok: boolean; error?: string };
  onBuyShinyCharm: () => { ok: boolean; error?: string };
}

type ShopTab = 'pokemon' | 'items' | 'tms' | 'shiny';

const SHINY_SHOWCASE_SPECIES = [
  'Arcanine',
  'Gardevoir',
  'Dragapult',
  'Kingambit',
  'Pikachu',
  'Miraidon',
];

export const ShopView: React.FC<ShopViewProps> = ({
  profile,
  onBackHome,
  onOpenTeamEditor,
  onOpenArcade,
  onBuyPokemon,
  onBuyItem,
  onBuyTM,
  onBuyShinyCharm,
}) => {
  const [tab, setTab] = useState<ShopTab>('pokemon');
  const [pokeSearch, setPokeSearch] = useState('');
  const [tierFilter, setTierFilter] = useState<'all' | SmogonPriceBand>('all');
  const [sortBy, setSortBy] = useState<'price-asc' | 'price-desc' | 'bst-desc'>('price-asc');
  const [toast, setToast] = useState<{ tone: 'ok' | 'err'; text: string } | null>(
    null
  );

  const bstLicense = useMemo(() => getImperialBstLicense(profile), [profile]);
  const perks = useMemo(() => computeActiveSocialLinkPerks(profile), [profile]);
  const totalWorldSpeciesCount = useMemo(() => getAllBiomePokedexSpecies().length, []);

  const buyablePokedexRows = useMemo(() => {
    const unlockedList = profile.devModeEnabled
      ? getAllBiomePokedexSpecies()
      : profile.unlockedPokedex;
    const rows = unlockedList.map((species) => {
      const cat = POKEMON_CATALOG_MAP.get(species.toLowerCase());
      const def = buildSmartDefaultMemberForSpecies(species, cat);
      const pricing = computePokemonShopPricing(def.species, def.ability);
      const spKey = getSpeciesKey(def.species);
      const hasLivingCopy = profile.pokemonBox.some(
        (m) => m.zone !== 'graveyard' && getSpeciesKey(m.species) === spKey
      );
      const hasFallenCopy = profile.pokemonBox.some(
        (m) => m.zone === 'graveyard' && getSpeciesKey(m.species) === spKey
      );
      return {
        species: def.species,
        ability: def.ability,
        teraType: def.teraType,
        role: cat?.role ?? `${def.moves.slice(0, 3).join(' · ')}`,
        pricing,
        hasLivingCopy,
        hasFallenCopy,
      };
    });

    const q = pokeSearch.trim().toLowerCase();
    const filtered = rows.filter((r) => {
      if (tierFilter !== 'all' && r.pricing.tierBand !== tierFilter) return false;
      if (!q) return true;
      return (
        r.species.toLowerCase().includes(q) ||
        r.ability.toLowerCase().includes(q) ||
        r.pricing.tierBand.toLowerCase().includes(q) ||
        r.role.toLowerCase().includes(q)
      );
    });

    filtered.sort((a, b) => {
      if (sortBy === 'price-desc') return b.pricing.finalPrice - a.pricing.finalPrice;
      if (sortBy === 'bst-desc') return b.pricing.bst - a.pricing.bst;
      return a.pricing.finalPrice - b.pricing.finalPrice;
    });
    return filtered;
  }, [profile.unlockedPokedex, profile.pokemonBox, profile.devModeEnabled, pokeSearch, tierFilter, sortBy]);

  const showFeedback = (res: { ok: boolean; error?: string }, okMsg: string) => {
    setToast(
      res.ok
        ? { tone: 'ok', text: okMsg }
        : { tone: 'err', text: res.error || 'No se pudo completar la compra.' }
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
                Tienda & Amuletos Variocolor
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
                label: `Pokédex de Compra (${profile.unlockedPokedex.length}/${totalWorldSpeciesCount})`,
                icon: Shield,
              },
              {
                id: 'items',
                label: `Objetos (${profile.inventory.items.length})`,
                icon: Backpack,
              },
              {
                id: 'tms',
                label: `MTs / Moves (${profile.inventory.tms.length})`,
                icon: Disc3,
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

        {/* TAB 1: DYNAMIC SMOGON-TIER + BST + ABILITY TAX CAMPAIGN POKÉDEX */}
        {tab === 'pokemon' && (
          <div className="space-y-4">
            {/* Economic Formula + Imperial BST License + Nuzlocke Refund Info Banner */}
            <div className="grid gap-3 rounded-2xl border border-amber-400/30 bg-slate-900/85 p-4 lg:grid-cols-12">
              <div className="lg:col-span-7 space-y-1">
                <p className="flex items-center gap-1.5 text-xs font-extrabold text-amber-200">
                  <Scale className="h-4 w-4 text-amber-400" />
                  Economía Smogon + BST + Impuesto de Habilidad Rota
                </p>
                <p className="text-[11px] leading-relaxed text-slate-300">
                  <code className="rounded bg-slate-950 px-1.5 py-0.5 text-amber-200">
                    Precio = ⌊BST × Tier Smogon⌋ + Impuesto Habilidad
                  </code>{' '}
                  (LC 0.4× · PU/ZU 0.6× · RU/NU 0.9× · UU 1.2× · OU 1.5× · Uber 2.0×). Superar capítulos por primera vez desbloquea 3–4 especies locales de esa región.
                </p>
                <p className="text-[10.5px] text-emerald-300/90">
                  💀 En Nuzlocke, ganar un combate con bajas permanentes reembolsa el{' '}
                  <strong>{Math.round((1 - perks.casualtyTaxRate) * 100)}%</strong> de su valor de tienda (impuesto de reposición: {Math.round(perks.casualtyTaxRate * 100)}%).
                </p>
              </div>
              <div className="lg:col-span-5 flex flex-col justify-center rounded-xl border border-sky-400/30 bg-slate-950/80 p-3">
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

            {/* Search + Tier Filter + Sort Bar */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative min-w-[210px] flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={pokeSearch}
                  onChange={(e) => setPokeSearch(e.target.value)}
                  placeholder="Buscar especie, habilidad (Prankster, Moody, Wonder Guard)..."
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 py-2 pl-9 pr-3 text-xs text-white placeholder-slate-500 focus:border-amber-400 focus:outline-none"
                />
              </div>
              <div className="flex flex-wrap gap-1">
                {(
                  ['all', 'LC', 'PU / ZU', 'RU / NU', 'UU / UUBL', 'OU', 'Uber / AG'] as const
                ).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTierFilter(t)}
                    className={`rounded-lg border px-2.5 py-1.5 text-[10.5px] font-bold transition cursor-pointer ${
                      tierFilter === t
                        ? 'border-amber-400 bg-amber-500/20 text-amber-100'
                        : 'border-slate-800 bg-slate-900 text-slate-400 hover:text-white'
                    }`}
                  >
                    {t === 'all' ? 'Todos' : t}
                  </button>
                ))}
              </div>
              <select
                value={sortBy}
                onChange={(e) =>
                  setSortBy(e.target.value as 'price-asc' | 'price-desc' | 'bst-desc')
                }
                className="rounded-xl border border-slate-700 bg-slate-950 px-2.5 py-1.5 text-[11px] font-bold text-slate-200 focus:border-amber-400 focus:outline-none"
              >
                <option value="price-asc">Precio ↑ (Más baratos)</option>
                <option value="price-desc">Precio ↓ (Más caros)</option>
                <option value="bst-desc">BST ↓ (Más fuertes)</option>
              </select>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {buyablePokedexRows.map((entry) => {
                const { pricing } = entry;
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
                    key={entry.species}
                    className="flex flex-col justify-between rounded-2xl border border-slate-800 bg-slate-900/80 p-4 transition hover:border-amber-400/40"
                  >
                    <div>
                      <div className="mb-2 flex flex-wrap items-center justify-between gap-1.5">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`rounded-md border px-2 py-0.5 text-[9.5px] font-extrabold uppercase ${tierCls}`}
                          >
                            {pricing.tierBand} · {pricing.tierMultiplier}×
                          </span>
                          <span className="font-mono-code rounded-md border border-slate-700 bg-slate-950 px-1.5 py-0.5 text-[9.5px] font-bold text-slate-300">
                            {pricing.bst} BST
                          </span>
                        </div>
                        <span className="font-mono-code text-xs font-extrabold text-amber-300">
                          {pricing.finalPrice.toLocaleString()} {CURRENCY_SHORT}
                        </span>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl border border-slate-800 bg-slate-950/90 p-1">
                          <PokemonSprite
                            species={entry.species}
                            side="p2"
                            className="h-16 w-16"
                          />
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-display truncate text-base font-bold text-white">
                            {entry.species}
                          </h3>
                          <p className="line-clamp-2 text-[10.5px] text-slate-400">
                            {entry.role}
                          </p>
                          <p className="mt-1 text-[10px] text-amber-200/85">
                            Hab: {entry.ability} · Tera {entry.teraType}
                          </p>
                          {pricing.abilityTax > 0 && pricing.taxedAbility && (
                            <span className="mt-1 inline-block rounded border border-rose-400/40 bg-rose-500/15 px-1.5 py-0.2 text-[9px] font-bold text-rose-200">
                              +{pricing.abilityTax} PC imp. ({pricing.taxedAbility})
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="mt-3.5">
                      {entry.hasLivingCopy ? (
                        <div className="flex items-center justify-center gap-1.5 rounded-xl border border-emerald-400/35 bg-emerald-500/15 py-2 text-xs font-bold text-emerald-300">
                          <CheckCircle2 className="h-4 w-4" />
                          Vivo en tus Cajas PC
                        </div>
                      ) : (
                        <button
                          disabled={!canAfford}
                          onClick={() =>
                            showFeedback(
                              onBuyPokemon(entry.species),
                              `¡Reclutaste a ${entry.species} por ${pricing.finalPrice.toLocaleString()} PC! Ya está en tu Caja de Reserva.`
                            )
                          }
                          className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 py-2 text-xs font-extrabold text-slate-950 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-35 cursor-pointer"
                        >
                          {entry.hasFallenCopy ? (
                            <Skull className="h-3.5 w-3.5" />
                          ) : (
                            <Coins className="h-3.5 w-3.5" />
                          )}
                          {entry.hasFallenCopy
                            ? `Reemplazar por ${pricing.finalPrice.toLocaleString()} ${CURRENCY_SHORT}`
                            : `Reclutar por ${pricing.finalPrice.toLocaleString()} ${CURRENCY_SHORT}`}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 2: HELD ITEMS */}
        {tab === 'items' && (
          <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
            {SHOP_ITEMS.map((item) => {
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
        )}

        {/* TAB 3: TMs */}
        {tab === 'tms' && (
          <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
            {SHOP_TMS.map((tm) => {
              const owned = profile.inventory.tms.includes(tm.move);
              const canAfford = profile.coins >= tm.price;
              return (
                <div
                  key={tm.move}
                  className="flex flex-col justify-between rounded-2xl border border-slate-800 bg-slate-900/80 p-4"
                >
                  <div>
                    <div className="mb-1.5 flex items-center justify-between gap-2">
                      <span
                        className={`rounded border px-2 py-0.5 text-[10px] font-bold uppercase ${getTypeBadgeClass(
                          tm.type
                        )}`}
                      >
                        MT · {tm.type}
                      </span>
                      <span className="font-mono-code text-xs font-extrabold text-amber-300">
                        {tm.price.toLocaleString()} {CURRENCY_SHORT}
                      </span>
                    </div>
                    <h3 className="text-sm font-extrabold text-white">
                      {tm.move}
                    </h3>
                    <p className="mt-1 text-xs leading-relaxed text-slate-400">
                      {tm.desc}
                    </p>
                  </div>
                  <div className="mt-3.5">
                    {owned ? (
                      <div className="flex items-center justify-center gap-1.5 rounded-xl border border-emerald-400/35 bg-emerald-500/15 py-2 text-xs font-bold text-emerald-300">
                        <CheckCircle2 className="h-4 w-4" />
                        En tu Mochila de MTs
                      </div>
                    ) : (
                      <button
                        disabled={!canAfford}
                        onClick={() =>
                          showFeedback(
                            onBuyTM(tm.move),
                            `¡MT ${tm.move} añadida! Ahora puedes enseñarla en el Editor de Equipo.`
                          )
                        }
                        className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-amber-500 py-2 text-xs font-extrabold text-slate-950 hover:brightness-110 disabled:opacity-35 cursor-pointer"
                      >
                        <Disc3 className="h-3.5 w-3.5" />
                        Comprar MT ({tm.price.toLocaleString()} {CURRENCY_SHORT})
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* TAB 4: SHINY CHARMS (ENDGAME PRESTIGE — MAX 6) */}
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
