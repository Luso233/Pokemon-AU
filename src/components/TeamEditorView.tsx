import React, { useMemo, useState } from 'react';
import { Dex } from '@pkmn/sim';
import {
  ArrowDownToLine,
  ArrowLeft,
  ArrowUpFromLine,
  Box,
  Code2,
  Coins,
  Heart,
  Home,
  Package,
  ShieldAlert,
  ShoppingBag,
  Skull,
  Sparkles,
  Wrench,
} from 'lucide-react';
import { MAX_SHINY_CHARMS } from '../data/economyCatalog';
import { getLegalLearnsetForSpecies } from '../engine/learnsetService';
import {
  compileCustomTeamToShowdownPaste,
  getItemUsageInfo,
} from '../engine/playerProfile';
import type {
  OwnedPokemonInstance,
  PlayerSaveProfile,
  PokemonStorageZone,
} from '../types/game';
import { PokemonSprite } from './PokemonSprite';

interface TeamEditorViewProps {
  profile: PlayerSaveProfile;
  onBackHome: () => void;
  onOpenShop: () => void;
  onMoveInstanceZone: (
    uid: string,
    targetZone: Exclude<PokemonStorageZone, 'graveyard'>
  ) => { ok: boolean; error?: string };
  onEquipInstanceItem: (
    uid: string,
    itemName: string
  ) => { ok: boolean; error?: string; transferredFrom?: string };
  onUpdateInstanceBuild: (
    uid: string,
    patch: Partial<
      Pick<
        OwnedPokemonInstance,
        'ability' | 'nature' | 'teraType' | 'moves' | 'shiny' | 'nickname'
      >
    >
  ) => { ok: boolean; error?: string };
  onToggleUseCustomTeam: (enabled: boolean) => void;
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

const STATUS_BADGE: Record<string, { label: string; cls: string }> = {
  psn: { label: 'PSN', cls: 'bg-purple-500/30 text-purple-200 border-purple-400/50' },
  tox: { label: 'TOX', cls: 'bg-fuchsia-500/30 text-fuchsia-200 border-fuchsia-400/50' },
  brn: { label: 'BRN', cls: 'bg-orange-500/30 text-orange-200 border-orange-400/50' },
  par: { label: 'PAR', cls: 'bg-amber-500/30 text-amber-200 border-amber-400/50' },
  slp: { label: 'SLP', cls: 'bg-sky-500/30 text-sky-200 border-sky-400/50' },
  frz: { label: 'FRZ', cls: 'bg-cyan-500/30 text-cyan-200 border-cyan-400/50' },
};

export const TeamEditorView: React.FC<TeamEditorViewProps> = ({
  profile,
  onBackHome,
  onOpenShop,
  onMoveInstanceZone,
  onEquipInstanceItem,
  onUpdateInstanceBuild,
  onToggleUseCustomTeam,
}) => {
  const [activeZoneTab, setActiveZoneTab] = useState<'box' | 'house' | 'graveyard'>('box');
  const [selectedUid, setSelectedUid] = useState<string>(
    profile.pokemonBox.find((b) => b.zone === 'party')?.uid ??
      profile.pokemonBox[0]?.uid ??
      ''
  );
  const [notice, setNotice] = useState<{ tone: 'ok' | 'err'; text: string } | null>(
    null
  );

  const partyList = useMemo(
    () => profile.pokemonBox.filter((b) => b.zone === 'party'),
    [profile.pokemonBox]
  );
  const reserveBoxList = useMemo(
    () => profile.pokemonBox.filter((b) => b.zone === 'box'),
    [profile.pokemonBox]
  );
  const houseList = useMemo(
    () => profile.pokemonBox.filter((b) => b.zone === 'house'),
    [profile.pokemonBox]
  );
  const graveyardList = useMemo(
    () => profile.pokemonBox.filter((b) => b.zone === 'graveyard'),
    [profile.pokemonBox]
  );

  const selectedInstance =
    profile.pokemonBox.find((b) => b.uid === selectedUid) ??
    partyList[0] ??
    profile.pokemonBox[0];

  const activeShinies = profile.pokemonBox.filter(
    (b) => b.zone !== 'graveyard' && b.shiny
  ).length;
  const maxShinies = Math.min(MAX_SHINY_CHARMS, profile.inventory.shinyCharms);

  const speciesObj = selectedInstance
    ? Dex.species.get(selectedInstance.species)
    : null;

  const availableAbilities = useMemo(() => {
    if (!selectedInstance || !speciesObj) return ['Pressure'];
    const raw = Object.values(speciesObj.abilities ?? {}).filter(
      (a): a is string => Boolean(a)
    );
    return Array.from(
      new Set(raw.length > 0 ? raw : [selectedInstance.ability || 'Pressure'])
    );
  }, [speciesObj, selectedInstance]);

  // Allowed moves = species' own moves + purchased TMs + 'Rest' if legal (Run & Bun Box-Rest tech!)
  const allowedMoves = useMemo(() => {
    if (!selectedInstance) return [];
    const legalNames = new Set(
      getLegalLearnsetForSpecies(selectedInstance.species, 'gen9doublescustomgame').map(
        (m) => m.name
      )
    );
    const pool = new Set<string>([
      ...selectedInstance.moves,
      ...profile.inventory.tms.filter((tm) => legalNames.has(tm)),
    ]);
    if (legalNames.has('Rest')) pool.add('Rest');
    if (legalNames.has('Protect')) pool.add('Protect');
    if (legalNames.has('Sleep Talk')) pool.add('Sleep Talk');
    // Also expose full legal learnset if Dev Mode is on
    if (profile.devModeEnabled) {
      for (const mv of legalNames) pool.add(mv);
    }
    return Array.from(pool).sort();
  }, [selectedInstance, profile.inventory.tms, profile.devModeEnabled]);

  const allStockItems = useMemo(() => {
    const names = new Set<string>([
      ...profile.inventory.items,
      ...Object.keys(profile.itemStock),
    ]);
    return Array.from(names)
      .filter((it) => (profile.itemStock[it] ?? 0) > 0)
      .sort((a, b) => a.localeCompare(b));
  }, [profile.inventory.items, profile.itemStock]);

  const compiledPaste = useMemo(
    () => compileCustomTeamToShowdownPaste(profile.customTeam, 100),
    [profile.customTeam]
  );

  const renderHpAndStatus = (inst: OwnedPokemonInstance) => {
    if (inst.zone === 'graveyard') {
      return (
        <span className="inline-flex items-center gap-1 rounded border border-rose-500/40 bg-rose-950/70 px-1.5 py-0.5 text-[9px] font-extrabold text-rose-200">
          💀 CAÍDO
        </span>
      );
    }
    const pct =
      inst.hp !== null && inst.maxhp
        ? Math.max(0, Math.min(100, Math.round((inst.hp / inst.maxhp) * 100)))
        : 100;
    const barColor =
      pct > 50 ? 'bg-emerald-400' : pct > 20 ? 'bg-amber-400' : 'bg-rose-500';
    const st = inst.status ? STATUS_BADGE[inst.status] : null;

    return (
      <div className="mt-1 space-y-1">
        <div className="flex items-center gap-1.5">
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-800">
            <div className={`h-full ${barColor}`} style={{ width: `${pct}%` }} />
          </div>
          <span className="font-mono-code text-[9px] font-bold text-slate-300">
            {inst.hp !== null && inst.maxhp
              ? `${inst.hp}/${inst.maxhp}`
              : '100%'}
          </span>
        </div>
        {st && (
          <span
            className={`inline-block rounded border px-1 py-0.2 text-[8.5px] font-extrabold ${st.cls}`}
          >
            {st.label} (congelado)
          </span>
        )}
      </div>
    );
  };

  const zoneList =
    activeZoneTab === 'box'
      ? reserveBoxList
      : activeZoneTab === 'house'
        ? houseList
        : graveyardList;

  return (
    <div className="min-h-screen bg-[#060a14] text-slate-100">
      <div className="mx-auto max-w-6xl px-5 py-7">
        {/* Header */}
        <div className="mb-5 flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3.5">
            <button
              onClick={onBackHome}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-3.5 py-2 text-xs font-semibold text-slate-300 transition hover:border-amber-400/50 hover:text-white cursor-pointer"
            >
              <ArrowLeft className="h-4 w-4" />
              Inicio
            </button>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-sky-300">
                PC de Supervivencia · Instancias Únicas (Sin Clones) & Stock Real de Objetos
              </p>
              <h1 className="font-display text-2xl font-bold text-white sm:text-3xl">
                Gestor de Cajas & Equipo
              </h1>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex items-center gap-1.5 rounded-xl border border-fuchsia-400/40 bg-fuchsia-500/15 px-3 py-2 text-xs font-bold text-fuchsia-200">
              <Sparkles className="h-3.5 w-3.5 text-fuchsia-300" />
              Shinies: {activeShinies}/{maxShinies}
            </div>
            <div className="inline-flex items-center gap-1.5 rounded-xl border border-amber-400/40 bg-amber-500/10 px-3 py-2 text-xs font-bold text-amber-200">
              <Coins className="h-3.5 w-3.5 text-amber-400" />
              {profile.coins.toLocaleString()} PC
            </div>
            <button
              onClick={onOpenShop}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs font-bold text-slate-200 hover:border-amber-400/50 cursor-pointer"
            >
              <ShoppingBag className="h-3.5 w-3.5 text-amber-300" />
              Tienda
            </button>
          </div>
        </div>

        {/* Ironman Box Rule + Use in Story Toggle */}
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-sky-400/30 bg-sky-500/10 px-4 py-3">
          <div className="space-y-0.5">
            <p className="flex items-center gap-1.5 text-xs font-extrabold text-sky-100">
              <ShieldAlert className="h-3.5 w-3.5 text-amber-300" />
              Reglas Ironman & Nuzlocke: la Caja NO cura (habilita la tech de Rest) y cada objeto tiene stock único
            </p>
            <p className="text-[11px] text-slate-300">
              Cada Pokémon es un individuo único (<code className="text-sky-200">uid</code>): si queda a 1 HP y envenenado, conserva ese estado en la Caja hasta curarlo en Campamento o sacarlo a usar <strong className="text-amber-200">Rest</strong>.
            </p>
          </div>
          <button
            type="button"
            onClick={() => onToggleUseCustomTeam(!profile.useCustomTeamInStory)}
            className={`rounded-xl border px-4 py-2 text-xs font-extrabold transition cursor-pointer ${
              profile.useCustomTeamInStory
                ? 'border-emerald-400 bg-emerald-500/25 text-emerald-100'
                : 'border-slate-700 bg-slate-900 text-slate-300 hover:border-sky-400/50'
            }`}
          >
            {profile.useCustomTeamInStory
              ? '✓ Usando Equipo del PC en Campaña'
              : 'Usar Equipo del PC en Campaña'}
          </button>
        </div>

        {notice && (
          <div
            className={`mb-4 rounded-xl border px-4 py-2.5 text-xs font-semibold ${
              notice.tone === 'ok'
                ? 'border-emerald-400/40 bg-emerald-500/15 text-emerald-200'
                : 'border-rose-500/40 bg-rose-500/15 text-rose-200'
            }`}
          >
            {notice.text}
          </div>
        )}

        {/* ACTIVE PARTY (MAX 6 UNIQUE INSTANCES) */}
        <div className="mb-5 rounded-3xl border border-amber-400/30 bg-slate-900/80 p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-display text-sm font-bold uppercase tracking-wider text-amber-200">
              1. Equipo Activo ({partyList.length}/6 · Cláusula de Especie)
            </h2>
            <span className="text-[11px] text-slate-400">
              Haz clic en un individuo para editar sus movimientos/objeto o enviarlo a la Caja
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-6">
            {partyList.map((inst) => {
              const active = selectedInstance?.uid === inst.uid;
              return (
                <button
                  key={inst.uid}
                  type="button"
                  onClick={() => {
                    setSelectedUid(inst.uid);
                    setNotice(null);
                  }}
                  className={`relative rounded-2xl border p-3 text-left transition cursor-pointer ${
                    active
                      ? 'border-amber-400 bg-amber-500/15 ring-2 ring-amber-400/35'
                      : 'border-slate-800 bg-slate-950/85 hover:border-slate-600'
                  }`}
                >
                  {inst.shiny && (
                    <span className="absolute right-2 top-2 rounded bg-fuchsia-500/30 px-1 py-0.5 text-[9px] font-extrabold text-fuchsia-200">
                      ★
                    </span>
                  )}
                  <div className="flex justify-center">
                    <PokemonSprite
                      species={inst.species}
                      shiny={inst.shiny}
                      side="p2"
                      className="h-14 w-14"
                    />
                  </div>
                  <p className="mt-1 truncate text-center text-xs font-bold text-white">
                    {inst.species}
                  </p>
                  <p className="truncate text-center text-[9.5px] text-amber-200/80">
                    {inst.item ? `@ ${inst.item}` : 'Sin objeto'}
                  </p>
                  {renderHpAndStatus(inst)}
                </button>
              );
            })}
            {Array.from({ length: Math.max(0, 6 - partyList.length) }).map((_, idx) => (
              <div
                key={`empty-party-${idx}`}
                className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-800 bg-slate-950/40 p-3 text-center text-[10px] text-slate-600"
              >
                <span>Hueco libre</span>
                <span className="mt-0.5 text-[9px]">Trae de Reserva o Casa</span>
              </div>
            ))}
          </div>
        </div>

        {/* LOWER GRID: 3 STORAGE TRAYS (LEFT 7) + INDIVIDUAL INSTANCE INSPECTOR (RIGHT 5) */}
        <div className="grid gap-6 lg:grid-cols-12">
          {/* LEFT 7 COLS: RESERVE BOX / HOUSE OF ALLIES / GRAVEYARD */}
          <div className="rounded-3xl border border-slate-800 bg-slate-900/75 p-5 lg:col-span-7">
            <div className="mb-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setActiveZoneTab('box')}
                className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-bold transition cursor-pointer ${
                  activeZoneTab === 'box'
                    ? 'border-sky-400 bg-sky-500/20 text-sky-100'
                    : 'border-slate-800 bg-slate-950 text-slate-400 hover:text-white'
                }`}
              >
                <Box className="h-3.5 w-3.5" />
                Caja de Reserva ({reserveBoxList.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveZoneTab('house')}
                className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-bold transition cursor-pointer ${
                  activeZoneTab === 'house'
                    ? 'border-fuchsia-400 bg-fuchsia-500/20 text-fuchsia-100'
                    : 'border-slate-800 bg-slate-950 text-slate-400 hover:text-white'
                }`}
              >
                <Home className="h-3.5 w-3.5" />
                Casa de Aliados R3 ({houseList.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveZoneTab('graveyard')}
                className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-bold transition cursor-pointer ${
                  activeZoneTab === 'graveyard'
                    ? 'border-rose-400 bg-rose-500/20 text-rose-100'
                    : 'border-slate-800 bg-slate-950 text-slate-400 hover:text-white'
                }`}
              >
                <Skull className="h-3.5 w-3.5" />
                Cementerio ({graveyardList.length})
              </button>
            </div>

            {zoneList.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-800 bg-slate-950/50 px-5 py-8 text-center text-xs text-slate-400">
                {activeZoneTab === 'box' &&
                  'Tu Caja de Reserva está vacía. Compra especies nuevas en la Tienda o guarda aquí a tus Pokémon heridos para protegerlos (recuerda: la Caja no cura).'}
                {activeZoneTab === 'house' &&
                  'Aún no hay refuerzos en tu Casa. Alcanza Rango 3 venciendo la Rematch Injusta de un NPC romanceable para recibir sus Pokémon aquí.'}
                {activeZoneTab === 'graveyard' &&
                  'El Cementerio del Exilio está vacío. Ningún compañero ha caído en modo Ultra Nuzlocke Diablo.'}
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {zoneList.map((inst) => {
                  const isSel = selectedInstance?.uid === inst.uid;
                  return (
                    <div
                      key={inst.uid}
                      onClick={() => {
                        setSelectedUid(inst.uid);
                        setNotice(null);
                      }}
                      className={`rounded-2xl border p-3 transition cursor-pointer ${
                        isSel
                          ? 'border-amber-400 bg-amber-500/10'
                          : inst.zone === 'graveyard'
                            ? 'border-rose-500/30 bg-rose-950/20 opacity-85'
                            : 'border-slate-800 bg-slate-950/80 hover:border-slate-600'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={inst.zone === 'graveyard' ? 'grayscale opacity-60' : ''}>
                          <PokemonSprite
                            species={inst.species}
                            shiny={inst.shiny}
                            side="p2"
                            className="h-12 w-12"
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-1">
                            <p className="truncate text-xs font-bold text-white">
                              {inst.species}
                            </p>
                            {inst.zone === 'house' && (
                              <Heart className="h-3 w-3 shrink-0 fill-fuchsia-400 text-fuchsia-400" />
                            )}
                          </div>
                          <p className="truncate text-[10px] text-slate-400">
                            {inst.origin}
                          </p>
                          <p className="truncate text-[10px] text-amber-300/85">
                            {inst.item ? `@ ${inst.item}` : 'Sin objeto'} · {inst.moves.slice(0, 2).join(', ')}
                          </p>
                          {renderHpAndStatus(inst)}
                          {inst.epitaph && (
                            <p className="mt-1 text-[9.5px] italic text-rose-300/90">
                              Caído T{inst.epitaph.turn} vs {inst.epitaph.rivalName} ({inst.epitaph.chapterTitle})
                            </p>
                          )}
                        </div>
                      </div>

                      {inst.zone !== 'graveyard' && (
                        <div className="mt-2.5 flex gap-1.5">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              const res = onMoveInstanceZone(inst.uid, 'party');
                              setNotice(
                                res.ok
                                  ? {
                                      tone: 'ok',
                                      text: `↑ ${inst.species} entró a tu Equipo Activo (conservando su estado Ironman).`,
                                    }
                                  : { tone: 'err', text: res.error || 'No se pudo mover.' }
                              );
                            }}
                            className="inline-flex flex-1 items-center justify-center gap-1 rounded-lg bg-amber-500/20 px-2 py-1 text-[10px] font-extrabold text-amber-200 hover:bg-amber-500/30 cursor-pointer"
                          >
                            <ArrowUpFromLine className="h-3 w-3" />
                            Subir al Equipo
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Showdown Paste Preview */}
            <div className="mt-5 rounded-2xl border border-slate-800 bg-slate-950/75 p-3.5">
              <p className="mb-1.5 flex items-center gap-1.5 text-[11px] font-bold text-slate-300">
                <Code2 className="h-3.5 w-3.5 text-amber-300" />
                Paste Showdown del Equipo Activo ({partyList.length} individuos únicos)
              </p>
              <pre className="font-mono-code max-h-40 overflow-y-auto whitespace-pre-wrap text-[10px] leading-relaxed text-slate-400">
                {compiledPaste}
              </pre>
            </div>
          </div>

          {/* RIGHT 5 COLS: SELECTED INSTANCE EDITOR + REAL ITEM STOCK */}
          <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-5 lg:col-span-5">
            {selectedInstance ? (
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div
                      className={`rounded-2xl border border-slate-800 bg-slate-950 p-1.5 ${
                        selectedInstance.zone === 'graveyard' ? 'grayscale opacity-60' : ''
                      }`}
                    >
                      <PokemonSprite
                        species={selectedInstance.species}
                        shiny={selectedInstance.shiny}
                        side="p2"
                        className="h-14 w-14"
                      />
                    </div>
                    <div>
                      <p className="font-mono-code text-[9.5px] text-slate-500">
                        UID: {selectedInstance.uid}
                      </p>
                      <h2 className="font-display text-lg font-bold text-white">
                        {selectedInstance.species}
                      </h2>
                      <p className="text-[11px] text-amber-200/85">
                        Origen: {selectedInstance.origin}
                      </p>
                    </div>
                  </div>

                  {selectedInstance.zone === 'party' && (
                    <button
                      type="button"
                      onClick={() => {
                        const res = onMoveInstanceZone(selectedInstance.uid, 'box');
                        setNotice(
                          res.ok
                            ? {
                                tone: 'ok',
                                text: `↓ ${selectedInstance.species} estacionado en la Caja de Reserva (sin curar).`,
                              }
                            : { tone: 'err', text: res.error || '' }
                        );
                      }}
                      className="inline-flex items-center gap-1 rounded-xl border border-sky-400/45 bg-sky-500/15 px-2.5 py-1.5 text-[10px] font-extrabold text-sky-200 hover:bg-sky-500/25 cursor-pointer"
                    >
                      <ArrowDownToLine className="h-3 w-3" />
                      Guardar en Caja
                    </button>
                  )}
                </div>

                {selectedInstance.zone === 'graveyard' ? (
                  <div className="rounded-2xl border border-rose-500/40 bg-rose-950/30 p-4 text-xs text-rose-200">
                    <p className="font-bold">💀 Descansa en el Cementerio del Exilio</p>
                    {selectedInstance.epitaph && (
                      <p className="mt-1 text-[11px] text-rose-200/80">
                        Cayó en el Turno {selectedInstance.epitaph.turn} contra{' '}
                        <strong>{selectedInstance.epitaph.rivalName}</strong> en{' '}
                        <em>{selectedInstance.epitaph.chapterTitle}</em>.
                      </p>
                    )}
                  </div>
                ) : (
                  <>
                    {/* Shiny Toggle */}
                    <div className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950/80 px-3 py-2">
                      <span className="text-[11px] font-semibold text-slate-300">
                        Amuleto Variocolor ({activeShinies}/{maxShinies})
                      </span>
                      <button
                        type="button"
                        disabled={!selectedInstance.shiny && maxShinies === 0}
                        onClick={() => {
                          const res = onUpdateInstanceBuild(selectedInstance.uid, {
                            shiny: !selectedInstance.shiny,
                          });
                          if (!res.ok) {
                            setNotice({ tone: 'err', text: res.error || '' });
                          }
                        }}
                        className={`inline-flex items-center gap-1 rounded-lg border px-2.5 py-1 text-[10px] font-extrabold cursor-pointer disabled:opacity-40 ${
                          selectedInstance.shiny
                            ? 'border-fuchsia-400 bg-fuchsia-500/25 text-fuchsia-100'
                            : 'border-slate-700 bg-slate-900 text-slate-300'
                        }`}
                      >
                        <Sparkles className="h-3 w-3" />
                        {selectedInstance.shiny ? '★ Shiny Activo' : 'Activar Shiny'}
                      </button>
                    </div>

                    {/* Held Item with Real Stock Enforcement (No Item Cloning!) */}
                    <div>
                      <label className="mb-1 flex items-center justify-between text-[11px] font-bold text-slate-300">
                        <span className="inline-flex items-center gap-1">
                          <Package className="h-3 w-3 text-amber-400" />
                          Objeto Equipado (Stock Real)
                        </span>
                        <span className="text-[10px] text-slate-500">
                          Sin duplicación
                        </span>
                      </label>
                      <select
                        value={selectedInstance.item}
                        onChange={(e) => {
                          const item = e.target.value;
                          const res = onEquipInstanceItem(
                            selectedInstance.uid,
                            item
                          );
                          if (!res.ok) {
                            setNotice({ tone: 'err', text: res.error || '' });
                          } else if (res.transferredFrom) {
                            setNotice({
                              tone: 'ok',
                              text: `📦 ${item} se movió desde ${res.transferredFrom} a ${selectedInstance.species} (stock agotado, sin clones).`,
                            });
                          } else {
                            setNotice(null);
                          }
                        }}
                        className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white focus:border-amber-400 focus:outline-none"
                      >
                        <option value="">(Sin objeto)</option>
                        {allStockItems.map((it) => {
                          const usage = getItemUsageInfo(
                            profile,
                            it,
                            selectedInstance.uid
                          );
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
                    </div>

                    {/* Ability, Nature, Tera */}
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="mb-1 block text-[10px] font-bold text-slate-400">
                          Habilidad
                        </label>
                        <select
                          value={selectedInstance.ability}
                          onChange={(e) =>
                            onUpdateInstanceBuild(selectedInstance.uid, {
                              ability: e.target.value,
                            })
                          }
                          className="w-full rounded-xl border border-slate-700 bg-slate-950 px-2 py-1.5 text-[11px] text-white"
                        >
                          {availableAbilities.map((ab) => (
                            <option key={ab} value={ab}>
                              {ab}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="mb-1 block text-[10px] font-bold text-slate-400">
                          Naturaleza
                        </label>
                        <select
                          value={selectedInstance.nature}
                          onChange={(e) =>
                            onUpdateInstanceBuild(selectedInstance.uid, {
                              nature: e.target.value,
                            })
                          }
                          className="w-full rounded-xl border border-slate-700 bg-slate-950 px-2 py-1.5 text-[11px] text-white"
                        >
                          {NATURES.map((n) => (
                            <option key={n} value={n}>
                              {n}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="mb-1 block text-[10px] font-bold text-slate-400">
                          Teratipo
                        </label>
                        <select
                          value={selectedInstance.teraType}
                          onChange={(e) =>
                            onUpdateInstanceBuild(selectedInstance.uid, {
                              teraType: e.target.value,
                            })
                          }
                          className="w-full rounded-xl border border-slate-700 bg-slate-950 px-2 py-1.5 text-[11px] text-white"
                        >
                          {TERA_TYPES.map((t) => (
                            <option key={t} value={t}>
                              {t}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* 4 Move Slots (Includes Rest for the Ironman Box-Rest tech!) */}
                    <div>
                      <p className="mb-1.5 flex items-center gap-1 text-[11px] font-bold text-slate-300">
                        <Wrench className="h-3 w-3 text-sky-400" />
                        Moveset (incluye Rest para limpiar estado en combate)
                      </p>
                      <div className="grid grid-cols-2 gap-2">
                        {[0, 1, 2, 3].map((mvIdx) => (
                          <select
                            key={mvIdx}
                            value={selectedInstance.moves[mvIdx] ?? ''}
                            onChange={(e) => {
                              const nextMoves = [...selectedInstance.moves];
                              nextMoves[mvIdx] = e.target.value;
                              onUpdateInstanceBuild(selectedInstance.uid, {
                                moves: nextMoves,
                              });
                            }}
                            className="rounded-xl border border-slate-700 bg-slate-950 px-2.5 py-2 text-xs text-white focus:border-sky-400 focus:outline-none"
                          >
                            {allowedMoves.map((mv) => (
                              <option key={mv} value={mv}>
                                {mv}
                              </option>
                            ))}
                          </select>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
};
