import React, { useMemo, useState } from 'react';
import { Dex } from '@pkmn/sim';
import {
  ArrowLeft,
  Code2,
  Coins,
  ShoppingBag,
  Sparkles,
  Wrench,
} from 'lucide-react';
import { MAX_SHINY_CHARMS } from '../data/economyCatalog';
import {
  buildDefaultMemberForSpecies,
  compileCustomTeamToShowdownPaste,
} from '../engine/playerProfile';
import type { CustomTeamMember, PlayerSaveProfile } from '../types/game';
import { PokemonSprite } from './PokemonSprite';

interface TeamEditorViewProps {
  profile: PlayerSaveProfile;
  onBackHome: () => void;
  onOpenShop: () => void;
  onUpdateSlot: (
    slotIndex: number,
    member: CustomTeamMember
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

export const TeamEditorView: React.FC<TeamEditorViewProps> = ({
  profile,
  onBackHome,
  onOpenShop,
  onUpdateSlot,
  onToggleUseCustomTeam,
}) => {
  const [selectedSlot, setSelectedSlot] = useState(0);
  const [notice, setNotice] = useState<string | null>(null);

  const member = profile.customTeam[selectedSlot] ?? profile.customTeam[0];
  const activeShinies = profile.customTeam.filter((m) => m.shiny).length;
  const maxShinies = Math.min(MAX_SHINY_CHARMS, profile.inventory.shinyCharms);

  const speciesObj = Dex.species.get(member.species);
  const availableAbilities = useMemo(() => {
    const raw = Object.values(speciesObj.abilities ?? {}).filter(
      (a): a is string => Boolean(a)
    );
    return Array.from(new Set(raw.length > 0 ? raw : [member.ability || 'Pressure']));
  }, [speciesObj, member.ability]);

  // Allowed moves = species' own default starter moves + player's purchased TMs!
  const allowedMoves = useMemo(() => {
    const defaults = buildDefaultMemberForSpecies(member.species).moves;
    return Array.from(
      new Set([...defaults, ...member.moves, ...profile.inventory.tms])
    ).sort();
  }, [member.species, member.moves, profile.inventory.tms]);

  const compiledPaste = useMemo(
    () => compileCustomTeamToShowdownPaste(profile.customTeam, 100),
    [profile.customTeam]
  );

  const applyEdit = (next: CustomTeamMember) => {
    setNotice(null);
    const res = onUpdateSlot(selectedSlot, next);
    if (!res.ok && res.error) {
      setNotice(res.error);
    }
  };

  const handleChangeSpecies = (newSpecies: string) => {
    const def = buildDefaultMemberForSpecies(newSpecies);
    const itemOwned = profile.inventory.items.includes(def.item)
      ? def.item
      : profile.inventory.items[0] || '';
    applyEdit({
      ...def,
      item: itemOwned,
      shiny: member.shiny,
    });
  };

  return (
    <div className="relative min-h-screen bg-[#060a14] text-slate-100">
      <div className="relative z-10 mx-auto max-w-6xl px-5 py-7">
        {/* Header */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-5">
          <div className="flex items-center gap-3.5">
            <button
              onClick={onBackHome}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-3.5 py-2 text-xs font-semibold text-slate-300 hover:border-amber-400/50 hover:text-white cursor-pointer"
            >
              <ArrowLeft className="h-4 w-4" />
              Inicio
            </button>
            <div>
              <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.2em] text-sky-400">
                <Wrench className="h-3.5 w-3.5" />
                Armería Real · Inventario Desbloqueado
              </p>
              <h1 className="font-display text-2xl font-extrabold text-white sm:text-3xl">
                Editor de Equipo & Shiny Charms
              </h1>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <div className="inline-flex items-center gap-1.5 rounded-xl border border-fuchsia-400/40 bg-fuchsia-500/15 px-3 py-2 text-xs font-bold text-fuchsia-200">
              <Sparkles className="h-3.5 w-3.5 text-amber-300" />
              Shinies activos: {activeShinies} / {maxShinies}
            </div>
            <div className="inline-flex items-center gap-1.5 rounded-xl border border-amber-400/35 bg-amber-500/10 px-3 py-2 text-xs font-bold text-amber-200">
              <Coins className="h-3.5 w-3.5" />
              {profile.coins.toLocaleString()} PC
            </div>
            <button
              onClick={onOpenShop}
              className="inline-flex items-center gap-1.5 rounded-xl bg-amber-500 px-3.5 py-2 text-xs font-extrabold text-slate-950 hover:brightness-110 cursor-pointer"
            >
              <ShoppingBag className="h-3.5 w-3.5" />
              Ir a la Tienda
            </button>
          </div>
        </div>

        {/* Use Custom Team toggle banner */}
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-sky-400/35 bg-sky-500/10 px-4 py-3">
          <div>
            <p className="text-xs font-extrabold text-sky-200">
              Desplegar Equipo Personalizado en Capítulos de Historia / Campaña
            </p>
            <p className="text-[11px] text-slate-300">
              Si lo activas, podrás cambiar al instante entre el equipo canónico del capítulo y este equipo personalizado desde el Briefing Pre-Combate (conservando tus Shiny Charms).
            </p>
          </div>
          <button
            type="button"
            onClick={() => onToggleUseCustomTeam(!profile.useCustomTeamInStory)}
            className={`rounded-xl border px-4 py-2 text-xs font-extrabold transition cursor-pointer ${
              profile.useCustomTeamInStory
                ? 'border-emerald-400 bg-emerald-500/20 text-emerald-200'
                : 'border-slate-700 bg-slate-900 text-slate-300 hover:border-sky-400/50'
            }`}
          >
            {profile.useCustomTeamInStory
              ? '✓ Activo por defecto en Briefing'
              : 'Usar equipo canónico por defecto'}
          </button>
        </div>

        {notice && (
          <div className="mb-4 rounded-xl border border-rose-500/40 bg-rose-500/15 px-4 py-2.5 text-xs font-semibold text-rose-200">
            {notice}
          </div>
        )}

        {/* 6 Team Slots Selector */}
        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {profile.customTeam.map((slotMon, idx) => {
            const isSel = idx === selectedSlot;
            return (
              <button
                key={`slot-${idx}`}
                type="button"
                onClick={() => setSelectedSlot(idx)}
                className={`relative flex flex-col items-center rounded-2xl border p-3 text-center transition cursor-pointer ${
                  isSel
                    ? 'border-amber-400 bg-amber-500/15 ring-2 ring-amber-400/40'
                    : 'border-slate-800 bg-slate-900/80 hover:border-slate-600'
                }`}
              >
                <span className="absolute left-2 top-2 font-mono-code text-[9px] font-bold text-slate-500">
                  #{idx + 1}
                </span>
                {slotMon.shiny && (
                  <span className="absolute right-2 top-2 rounded bg-fuchsia-500/25 px-1 text-[9px] font-bold text-amber-200">
                    ✨
                  </span>
                )}
                <PokemonSprite
                  species={slotMon.species}
                  side="p2"
                  shiny={slotMon.shiny}
                  className="h-16 w-16"
                />
                <p className="mt-1 w-full truncate text-xs font-extrabold text-white">
                  {slotMon.species}
                </p>
                <p className="w-full truncate text-[10px] text-amber-200/80">
                  @ {slotMon.item || 'Sin objeto'}
                </p>
              </button>
            );
          })}
        </div>

        {/* Slot Editor + Compiled Paste */}
        <div className="grid gap-6 lg:grid-cols-12">
          <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-5 lg:col-span-7">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-20 w-20 items-center justify-center rounded-2xl border border-amber-400/35 bg-slate-950 p-1">
                  <PokemonSprite
                    species={member.species}
                    side="p2"
                    shiny={member.shiny}
                    className="h-16 w-16"
                  />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-amber-300">
                    Editando Slot #{selectedSlot + 1}
                  </p>
                  <h2 className="font-display text-xl font-extrabold text-white">
                    {member.shiny ? '✨ ' : ''}
                    {member.species}
                  </h2>
                  <p className="text-xs text-slate-400">
                    Solo muestra Pokémon, Objetos y MTs de tu inventario.
                  </p>
                </div>
              </div>

              {/* Shiny Charm Slot Toggle */}
              <button
                type="button"
                onClick={() => applyEdit({ ...member, shiny: !member.shiny })}
                className={`inline-flex items-center gap-2 rounded-2xl border px-4 py-2.5 text-xs font-extrabold transition cursor-pointer ${
                  member.shiny
                    ? 'border-amber-300 bg-gradient-to-r from-fuchsia-500/30 to-amber-500/30 text-amber-100 shadow-lg shadow-fuchsia-500/20'
                    : maxShinies > activeShinies
                      ? 'border-fuchsia-400/45 bg-fuchsia-500/15 text-fuchsia-200 hover:bg-fuchsia-500/25'
                      : 'border-slate-700 bg-slate-950 text-slate-500'
                }`}
              >
                <Sparkles className="h-4 w-4" />
                {member.shiny
                  ? '✨ Shiny Activado'
                  : maxShinies > activeShinies
                    ? 'Activar Shiny Charm'
                    : `Sin Shiny Charms (${activeShinies}/${maxShinies})`}
              </button>
            </div>

            <div className="grid gap-3.5 sm:grid-cols-2">
              {/* Species (Owned Pokémon only) */}
              <div>
                <label className="mb-1 block text-[11px] font-bold text-slate-300">
                  Pokémon ({profile.inventory.pokemon.length} propios)
                </label>
                <select
                  value={member.species}
                  onChange={(e) => handleChangeSpecies(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white focus:border-amber-400 focus:outline-none"
                >
                  {profile.inventory.pokemon.map((sp) => (
                    <option key={sp} value={sp}>
                      {sp}
                    </option>
                  ))}
                </select>
              </div>

              {/* Held Item (Owned Items only) */}
              <div>
                <label className="mb-1 block text-[11px] font-bold text-slate-300">
                  Objeto ({profile.inventory.items.length} propios)
                </label>
                <select
                  value={member.item}
                  onChange={(e) => applyEdit({ ...member, item: e.target.value })}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white focus:border-amber-400 focus:outline-none"
                >
                  <option value="">Sin objeto</option>
                  {profile.inventory.items.map((it) => (
                    <option key={it} value={it}>
                      {it}
                    </option>
                  ))}
                </select>
              </div>

              {/* Ability */}
              <div>
                <label className="mb-1 block text-[11px] font-bold text-slate-300">
                  Habilidad
                </label>
                <select
                  value={member.ability}
                  onChange={(e) =>
                    applyEdit({ ...member, ability: e.target.value })
                  }
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white focus:border-amber-400 focus:outline-none"
                >
                  {availableAbilities.map((ab) => (
                    <option key={ab} value={ab}>
                      {ab}
                    </option>
                  ))}
                </select>
              </div>

              {/* Nature + Tera */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="mb-1 block text-[11px] font-bold text-slate-300">
                    Naturaleza
                  </label>
                  <select
                    value={member.nature}
                    onChange={(e) =>
                      applyEdit({ ...member, nature: e.target.value })
                    }
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-2.5 py-2 text-xs text-white focus:border-amber-400 focus:outline-none"
                  >
                    {NATURES.map((n) => (
                      <option key={n} value={n}>
                        {n}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-[11px] font-bold text-slate-300">
                    Tipo Tera
                  </label>
                  <select
                    value={member.teraType}
                    onChange={(e) =>
                      applyEdit({ ...member, teraType: e.target.value })
                    }
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-2.5 py-2 text-xs text-white focus:border-amber-400 focus:outline-none"
                  >
                    {TERA_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* 4 Move Slots (Signature moves + Owned TMs) */}
            <div className="mt-4 border-t border-slate-800 pt-4">
              <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-amber-300">
                Moveset (Movimientos base + tus {profile.inventory.tms.length} MTs)
              </p>
              <div className="grid gap-2.5 sm:grid-cols-2">
                {[0, 1, 2, 3].map((mIdx) => (
                  <div key={mIdx}>
                    <label className="mb-0.5 block text-[10px] text-slate-400">
                      Movimiento {mIdx + 1}
                    </label>
                    <select
                      value={member.moves[mIdx] ?? ''}
                      onChange={(e) => {
                        const nextMoves = [...member.moves];
                        nextMoves[mIdx] = e.target.value;
                        applyEdit({ ...member, moves: nextMoves });
                      }}
                      className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white focus:border-amber-400 focus:outline-none"
                    >
                      {allowedMoves.map((mv) => (
                        <option key={mv} value={mv}>
                          {mv}
                        </option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Live Compiled Showdown Paste */}
          <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-5 lg:col-span-5">
            <div className="mb-2 flex items-center justify-between text-xs">
              <span className="inline-flex items-center gap-1.5 font-mono-code font-bold text-amber-300">
                <Code2 className="h-4 w-4" />
                custom_team.showdown
              </span>
              <span className="text-[10px] text-slate-400">
                Guardado automático
              </span>
            </div>
            <pre className="font-mono-code max-h-[27rem] overflow-auto rounded-2xl border border-slate-800 bg-black/75 p-3.5 text-[11px] leading-relaxed text-slate-200">
              {compiledPaste}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};
