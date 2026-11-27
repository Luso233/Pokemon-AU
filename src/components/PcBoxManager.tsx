import React, { useMemo, useState } from 'react';
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  Box,
  Check,
  Code2,
  Copy,
  Download,
  FlaskConical,
  Heart,
  Home,
  Plus,
  Search,
  ShieldAlert,
  Skull,
  Upload,
} from 'lucide-react';
import { DIFFICULTY_META, DIFFICULTY_ORDER } from '../data/economyCatalog';
import { compileCustomTeamToShowdownPaste } from '../engine/playerProfile';
import {
  computePokemonBst,
  computePokemonShopPricing,
  getAllAnythingGoesPlayableSpecies,
  getImperialBstLicense,
} from '../engine/pricingEngine';
import type {
  BattleDifficultyMode,
  OwnedPokemonInstance,
  PlayerSaveProfile,
  PokemonStorageZone,
} from '../types/game';
import { PokemonEditor } from './PokemonEditor';
import { PokemonSprite } from './PokemonSprite';

const STATUS_BADGE: Record<string, { label: string; cls: string }> = {
  psn: { label: 'PSN', cls: 'bg-purple-500/30 text-purple-200 border-purple-400/50' },
  tox: { label: 'TOX', cls: 'bg-fuchsia-500/30 text-fuchsia-200 border-fuchsia-400/50' },
  brn: { label: 'BRN', cls: 'bg-orange-500/30 text-orange-200 border-orange-400/50' },
  par: { label: 'PAR', cls: 'bg-amber-500/30 text-amber-200 border-amber-400/50' },
  slp: { label: 'SLP', cls: 'bg-sky-500/30 text-sky-200 border-sky-400/50' },
  frz: { label: 'FRZ', cls: 'bg-cyan-500/30 text-cyan-200 border-cyan-400/50' },
};

export interface PcBoxManagerProps {
  profile: PlayerSaveProfile;
  /** Live difficulty mode from TeambuilderBriefing (or standalone preview) controlling dynamic BST Cap! */
  difficultyMode?: BattleDifficultyMode;
  /** Compact embedded mode inside TeambuilderBriefing left panel (keeps rival sighting visible on the right!). */
  embedded?: boolean;
  formatId?: string;
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
  onUnlockMoveSlot: (
    species: string,
    slotIndex: number
  ) => { ok: boolean; error?: string };
  onSpawnDevSpecimen?: (
    species: string,
    targetZone: 'party' | 'box'
  ) => {
    ok: boolean;
    error?: string;
    uid?: string;
    placedZone?: 'party' | 'box';
    swappedOutSpecies?: string;
  };
  onImportShowdownPaste?: (
    rawPaste: string
  ) => { ok: boolean; error?: string; importedCount: number };
  onOpenShop?: () => void;
  onNotice?: (notice: { tone: 'ok' | 'err'; text: string }) => void;
}

/**
 * Reusable PC Box Manager (<PcBoxManager />):
 *  - Active Party (6 slots) + Dynamic Difficulty-Linked BST Cap Meter
 *  - Reserve Box / House of Allies R3 / Nuzlocke Graveyard
 *  - Unified <PokemonEditor mode="free" />
 *  - Dev Mode Anything Goes Full National Pokédex Spawner (~1,150+ species) + Showdown Paste Import/Export!
 */
export const PcBoxManager: React.FC<PcBoxManagerProps> = ({
  profile,
  difficultyMode,
  embedded = false,
  formatId = 'gen9doublescustomgame@@@NatDex Mod',
  onMoveInstanceZone,
  onEquipInstanceItem,
  onUpdateInstanceBuild,
  onUnlockMoveSlot,
  onSpawnDevSpecimen,
  onImportShowdownPaste,
  onOpenShop,
  onNotice,
}) => {
  const [previewDiff, setPreviewDiff] = useState<BattleDifficultyMode>(
    difficultyMode ?? profile.defaultDifficulty ?? 'kaizo'
  );
  const effectiveDiff = difficultyMode ?? previewDiff;

  const [activeZoneTab, setActiveZoneTab] = useState<
    'box' | 'house' | 'graveyard' | 'dev-lab'
  >('box');
  const [selectedUid, setSelectedUid] = useState<string>(
    profile.pokemonBox.find((b) => b.zone === 'party')?.uid ??
      profile.pokemonBox[0]?.uid ??
      ''
  );
  const [localNotice, setLocalNotice] = useState<{
    tone: 'ok' | 'err';
    text: string;
  } | null>(null);
  const [devSearch, setDevSearch] = useState('');
  const [importPasteText, setImportPasteText] = useState('');
  const [showPasteTools, setShowPasteTools] = useState(false);
  const [copiedPaste, setCopiedPaste] = useState(false);

  const emitNotice = (n: { tone: 'ok' | 'err'; text: string }) => {
    setLocalNotice(n);
    onNotice?.(n);
  };

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

  const bstLicense = useMemo(
    () => getImperialBstLicense(profile, effectiveDiff),
    [profile, effectiveDiff]
  );

  const compiledPaste = useMemo(
    () => compileCustomTeamToShowdownPaste(profile.customTeam, 100),
    [profile.customTeam]
  );

  const showDevLab = Boolean(profile.devModeEnabled || profile.devFullAgPokedex);

  const allAgSpecies = useMemo(
    () => (showDevLab ? getAllAnythingGoesPlayableSpecies() : []),
    [showDevLab]
  );

  const filteredAgSpecies = useMemo(() => {
    if (!showDevLab) return [];
    const q = devSearch.trim().toLowerCase();
    const list = q
      ? allAgSpecies.filter((s) => s.toLowerCase().includes(q))
      : [
          'Rayquaza-Mega',
          'Zacian-Crowned',
          'Miraidon',
          'Calyrex-Shadow',
          'Flutter Mane',
          'Incineroar',
          'Urshifu-Rapid-Strike',
          'Shedinja',
          'Smeargle',
          'Ditto',
          'Cottonee',
          'Ninjask',
          'Zoroark-Hisui',
          'Kingambit',
          'Gholdengo',
          'Bidoof',
        ];
    return list.slice(0, 36);
  }, [showDevLab, devSearch, allAgSpecies]);

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
        <div className="flex items-center gap-1">
          <div className="h-1 flex-1 overflow-hidden rounded-full bg-slate-800">
            <div className={`h-full ${barColor}`} style={{ width: `${pct}%` }} />
          </div>
          <span className="font-mono-code text-[8.5px] font-bold text-slate-400">
            {inst.hp !== null && inst.maxhp ? `${inst.hp}/${inst.maxhp}` : '100%'}
          </span>
        </div>
        {st && (
          <span
            className={`inline-block rounded border px-1 py-0.2 text-[8px] font-extrabold ${st.cls}`}
          >
            {st.label}
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
    <div className="space-y-4">
      {/* Dynamic Difficulty-Linked Imperial BST Cap Bar */}
      <div
        className={`rounded-2xl border px-4 py-3 transition ${
          bstLicense.isOverCap
            ? 'border-rose-500/65 bg-rose-950/40'
            : 'border-emerald-400/35 bg-emerald-950/20'
        }`}
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-xs font-extrabold text-white">
              ⚖️ Presupuesto BST ({bstLicense.difficultyDeltaLabel}) ·{' '}
              <span className="text-sky-200">{bstLicense.shortLabel}</span>
            </p>
            <p className="mt-0.5 text-[11px] text-slate-300">
              {bstLicense.isOverCap
                ? `⚠️ Excedes el límite por +${bstLicense.currentPartyBst - (bstLicense.maxTeamBst ?? 0)} BST en ${DIFFICULTY_META[effectiveDiff]?.label}. Baja un titular a la Caja o mete piezas baratas (LC/PU/cheese).`
                : bstLicense.nextActUnlockHint}
            </p>
          </div>
          <div className="text-right">
            <p
              className={`font-mono-code text-sm font-extrabold ${
                bstLicense.isOverCap ? 'text-rose-300' : 'text-emerald-300'
              }`}
            >
              BST Actual: {bstLicense.currentPartyBst.toLocaleString()} /{' '}
              {bstLicense.maxTeamBst !== null
                ? bstLicense.maxTeamBst.toLocaleString()
                : '∞'}
            </p>
            {!difficultyMode && (
              <div className="mt-1 flex justify-end gap-1">
                {DIFFICULTY_ORDER.map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setPreviewDiff(d)}
                    className={`rounded border px-1.5 py-0.5 text-[9px] font-bold transition cursor-pointer ${
                      effectiveDiff === d
                        ? 'border-amber-400 bg-amber-500/20 text-amber-100'
                        : 'border-slate-700 bg-slate-900 text-slate-400 hover:text-white'
                    }`}
                  >
                    {DIFFICULTY_META[d].shortLabel}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
        {bstLicense.maxTeamBst !== null && (
          <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-900">
            <div
              className={`h-full transition-all ${
                bstLicense.isOverCap ? 'bg-rose-500' : 'bg-emerald-400'
              }`}
              style={{
                width: `${Math.min(
                  100,
                  Math.round(
                    (bstLicense.currentPartyBst / bstLicense.maxTeamBst) * 100
                  )
                )}%`,
              }}
            />
          </div>
        )}
      </div>

      {!embedded && localNotice && (
        <div
          className={`rounded-xl border px-4 py-2 text-xs font-semibold ${
            localNotice.tone === 'ok'
              ? 'border-emerald-400/40 bg-emerald-500/15 text-emerald-200'
              : 'border-rose-500/40 bg-rose-500/15 text-rose-200'
          }`}
        >
          {localNotice.text}
        </div>
      )}

      {/* 1. ACTIVE PARTY (6 UNIQUE INSTANCES) */}
      <div className="rounded-2xl border border-amber-400/30 bg-slate-900/75 p-3.5">
        <div className="mb-2.5 flex flex-wrap items-center justify-between gap-2">
          <h3 className="font-display text-xs font-bold uppercase tracking-wider text-amber-200">
            Equipo Activo ({partyList.length}/6 · Cláusula de Especie)
          </h3>
          <span className="inline-flex items-center gap-1 text-[10px] text-slate-400">
            <ShieldAlert className="h-3 w-3 text-sky-400" />
            La Caja NO cura (tech de Rest intacta)
          </span>
        </div>

        <div
          className={`grid gap-2 ${
            embedded
              ? 'grid-cols-2 sm:grid-cols-3'
              : 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-6'
          }`}
        >
          {partyList.map((inst) => {
            const active = selectedInstance?.uid === inst.uid;
            return (
              <div
                key={inst.uid}
                onClick={() => setSelectedUid(inst.uid)}
                className={`group relative rounded-2xl border p-2.5 text-left transition cursor-pointer ${
                  active
                    ? 'border-amber-400 bg-amber-500/15 ring-1 ring-amber-400/40'
                    : 'border-slate-800 bg-slate-950/85 hover:border-slate-600'
                }`}
              >
                <button
                  type="button"
                  title="Guardar en Caja de Reserva"
                  onClick={(e) => {
                    e.stopPropagation();
                    const res = onMoveInstanceZone(inst.uid, 'box');
                    emitNotice(
                      res.ok
                        ? {
                            tone: 'ok',
                            text: `↓ ${inst.species} estacionado en la Caja de Reserva (sin curar).`,
                          }
                        : { tone: 'err', text: res.error || '' }
                    );
                  }}
                  className="absolute right-1.5 top-1.5 rounded-md border border-slate-700 bg-slate-900/90 p-1 text-slate-400 opacity-75 transition hover:border-sky-400 hover:text-sky-200 hover:opacity-100 cursor-pointer"
                >
                  <ArrowDownToLine className="h-3 w-3" />
                </button>
                <div className="flex justify-center">
                  <PokemonSprite
                    species={inst.species}
                    shiny={inst.shiny}
                    side="p2"
                    className="h-12 w-12"
                  />
                </div>
                <p className="mt-0.5 truncate text-center text-xs font-bold text-white">
                  {inst.shiny ? '✨ ' : ''}
                  {inst.species}
                </p>
                <p className="text-center font-mono-code text-[9px] font-bold text-sky-300">
                  {computePokemonBst(inst.species)} BST
                </p>
                <p className="truncate text-center text-[9px] text-amber-200/80">
                  {inst.item ? `@ ${inst.item}` : 'Sin objeto'}
                </p>
                {renderHpAndStatus(inst)}
              </div>
            );
          })}
          {Array.from({ length: Math.max(0, 6 - partyList.length) }).map(
            (_, idx) => (
              <div
                key={`empty-party-${idx}`}
                className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-800 bg-slate-950/40 p-2.5 text-center text-[10px] text-slate-600"
              >
                <span>Hueco libre</span>
                <span className="mt-0.5 text-[9px]">Sube desde Caja</span>
              </div>
            )
          )}
        </div>
      </div>

      {/* 2. UNIFIED POKÉMON EDITOR (mode="free") FOR SELECTED INDIVIDUAL */}
      {selectedInstance && (
        <PokemonEditor
          key={selectedInstance.uid}
          mode="free"
          profile={profile}
          formatId={formatId}
          instance={selectedInstance}
          onMoveToBox={(uid) => {
            const res = onMoveInstanceZone(uid, 'box');
            emitNotice(
              res.ok
                ? {
                    tone: 'ok',
                    text: `↓ ${selectedInstance.species} guardado en la Caja de Reserva (sin curar).`,
                  }
                : { tone: 'err', text: res.error || '' }
            );
          }}
          onEquipInstanceItem={onEquipInstanceItem}
          onUpdateInstanceBuild={onUpdateInstanceBuild}
          onUnlockMoveSlot={onUnlockMoveSlot}
          onOpenShop={onOpenShop}
          onNotice={emitNotice}
        />
      )}

      {/* 3. STORAGE TRAYS (BOX / HOUSE R3 / GRAVEYARD / DEV AG LAB) */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/75 p-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={() => setActiveZoneTab('box')}
              className={`inline-flex items-center gap-1 rounded-xl border px-2.5 py-1.5 text-[11px] font-bold transition cursor-pointer ${
                activeZoneTab === 'box'
                  ? 'border-sky-400 bg-sky-500/20 text-sky-100'
                  : 'border-slate-800 bg-slate-950 text-slate-400 hover:text-white'
              }`}
            >
              <Box className="h-3.5 w-3.5" />
              Reserva ({reserveBoxList.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveZoneTab('house')}
              className={`inline-flex items-center gap-1 rounded-xl border px-2.5 py-1.5 text-[11px] font-bold transition cursor-pointer ${
                activeZoneTab === 'house'
                  ? 'border-fuchsia-400 bg-fuchsia-500/20 text-fuchsia-100'
                  : 'border-slate-800 bg-slate-950 text-slate-400 hover:text-white'
              }`}
            >
              <Home className="h-3.5 w-3.5" />
              Casa R3 ({houseList.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveZoneTab('graveyard')}
              className={`inline-flex items-center gap-1 rounded-xl border px-2.5 py-1.5 text-[11px] font-bold transition cursor-pointer ${
                activeZoneTab === 'graveyard'
                  ? 'border-rose-400 bg-rose-500/20 text-rose-100'
                  : 'border-slate-800 bg-slate-950 text-slate-400 hover:text-white'
              }`}
            >
              <Skull className="h-3.5 w-3.5" />
              Cementerio ({graveyardList.length})
            </button>
            {showDevLab && (
              <button
                type="button"
                onClick={() => setActiveZoneTab('dev-lab')}
                className={`inline-flex items-center gap-1 rounded-xl border px-2.5 py-1.5 text-[11px] font-extrabold transition cursor-pointer ${
                  activeZoneTab === 'dev-lab'
                    ? 'border-fuchsia-400 bg-gradient-to-r from-fuchsia-500/30 to-amber-500/25 text-white'
                    : 'border-fuchsia-500/40 bg-fuchsia-950/30 text-fuchsia-200 hover:border-fuchsia-400'
                }`}
              >
                <FlaskConical className="h-3.5 w-3.5" />
                Dev Pokédex AG ({allAgSpecies.length})
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={() => setShowPasteTools((v) => !v)}
            className="inline-flex items-center gap-1 rounded-xl border border-slate-700 bg-slate-950 px-2.5 py-1 text-[10.5px] font-bold text-slate-300 hover:border-amber-400/50 hover:text-amber-200 cursor-pointer"
          >
            <Code2 className="h-3.5 w-3.5" />
            {showPasteTools ? 'Ocultar Import/Export' : 'Importar / Exportar Showdown'}
          </button>
        </div>

        {/* Showdown Import / Export Drawer for Playtesting! */}
        {showPasteTools && (
          <div className="mb-4 space-y-2.5 rounded-2xl border border-amber-400/35 bg-slate-950/90 p-3.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-[11px] font-extrabold text-amber-200">
                <Download className="mr-1 inline h-3.5 w-3.5" />
                Exportar Paste Showdown del Equipo Activo
              </p>
              <button
                type="button"
                onClick={() => {
                  if (navigator.clipboard) {
                    void navigator.clipboard.writeText(compiledPaste);
                  }
                  setCopiedPaste(true);
                  window.setTimeout(() => setCopiedPaste(false), 1800);
                }}
                className="inline-flex items-center gap-1 rounded-lg border border-amber-400/45 bg-amber-500/15 px-2.5 py-1 text-[10px] font-extrabold text-amber-100 hover:bg-amber-500/25 cursor-pointer"
              >
                {copiedPaste ? (
                  <>
                    <Check className="h-3 w-3 text-emerald-400" /> ¡Copiado!
                  </>
                ) : (
                  <>
                    <Copy className="h-3 w-3" /> Copiar Paste
                  </>
                )}
              </button>
            </div>
            <pre className="font-mono-code max-h-32 overflow-y-auto whitespace-pre-wrap rounded-xl border border-slate-800 bg-black/60 p-2.5 text-[10px] text-slate-300">
              {compiledPaste}
            </pre>

            {onImportShowdownPaste && showDevLab && (
              <div className="border-t border-slate-800 pt-2.5">
                <p className="mb-1.5 text-[11px] font-extrabold text-fuchsia-200">
                  <Upload className="mr-1 inline h-3.5 w-3.5" />
                  [DEV PLAYTEST] Importar Paste de Showdown al Equipo Activo (Simular jugador)
                </p>
                <textarea
                  value={importPasteText}
                  onChange={(e) => setImportPasteText(e.target.value)}
                  rows={5}
                  placeholder="Pega aquí un equipo de Pokémon Showdown (hasta 6 Pokémon) para probar niveles y simular partidas..."
                  className="font-mono-code w-full rounded-xl border border-fuchsia-400/35 bg-black/70 p-2.5 text-[10.5px] text-slate-200 placeholder-slate-500 focus:border-fuchsia-400 focus:outline-none"
                />
                <div className="mt-2 flex justify-end">
                  <button
                    type="button"
                    disabled={!importPasteText.trim()}
                    onClick={() => {
                      const res = onImportShowdownPaste(importPasteText);
                      emitNotice(
                        res.ok
                          ? {
                              tone: 'ok',
                              text: `🧪 ¡${res.importedCount} Pokémon importados desde Showdown directo a tu Equipo Activo!`,
                            }
                          : { tone: 'err', text: res.error || 'Error al importar.' }
                      );
                      if (res.ok) setImportPasteText('');
                    }}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-fuchsia-500 to-amber-500 px-3.5 py-1.5 text-[11px] font-extrabold text-slate-950 hover:brightness-110 disabled:opacity-40 cursor-pointer"
                  >
                    <Upload className="h-3.5 w-3.5" />
                    Importar al Equipo Activo
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* DEV LAB TAB: Full Anything Goes National Pokédex Specimen Spawner (~1,150+ playable species!) */}
        {activeZoneTab === 'dev-lab' && showDevLab ? (
          <div className="space-y-3">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-fuchsia-300" />
              <input
                type="text"
                value={devSearch}
                onChange={(e) => setDevSearch(e.target.value)}
                placeholder={`Buscar entre los ${allAgSpecies.length} Pokémon jugables en Anything Goes (ej. Rayquaza-Mega, Flutter Mane, Shedinja, Bidoof)...`}
                className="w-full rounded-xl border border-fuchsia-400/40 bg-slate-950 py-2 pl-9 pr-3 text-xs text-white placeholder-slate-500 focus:border-fuchsia-400 focus:outline-none"
              />
            </div>

            <div className="grid max-h-72 gap-2 overflow-y-auto pr-1 sm:grid-cols-2 lg:grid-cols-3">
              {filteredAgSpecies.map((sp) => {
                const pricing = computePokemonShopPricing(sp);
                return (
                  <div
                    key={sp}
                    className="flex items-center justify-between gap-2 rounded-xl border border-slate-800 bg-slate-950/85 p-2.5"
                  >
                    <div className="flex min-w-0 items-center gap-2">
                      <PokemonSprite
                        species={sp}
                        side="p2"
                        className="h-10 w-10 shrink-0"
                      />
                      <div className="min-w-0">
                        <p className="truncate text-xs font-bold text-white">
                          {sp}
                        </p>
                        <p className="font-mono-code text-[9.5px] text-fuchsia-200/85">
                          {pricing.bst} BST · {pricing.tierBand}
                        </p>
                      </div>
                    </div>
                    {onSpawnDevSpecimen && (
                      <div className="flex shrink-0 flex-col gap-1">
                        <button
                          type="button"
                          onClick={() => {
                            const res = onSpawnDevSpecimen(sp, 'party');
                            if (res.ok && res.uid) setSelectedUid(res.uid);
                            emitNotice(
                              res.ok
                                ? {
                                    tone: 'ok',
                                    text:
                                      res.placedZone === 'party'
                                        ? res.swappedOutSpecies
                                          ? `🧪 ¡${sp} entró directo a tu Equipo Activo! (${res.swappedOutSpecies} pasó a la Caja de Reserva · guardado automáticamente).`
                                          : `🧪 ¡${sp} entró directo a tu Equipo Activo (0 PC · guardado automáticamente)!`
                                        : `🧪 ${sp} añadido a la Caja de Reserva (ya había un ejemplar en tu Equipo Activo).`,
                                  }
                                : { tone: 'err', text: res.error || '' }
                            );
                          }}
                          className="inline-flex items-center gap-0.5 rounded-md bg-fuchsia-500/25 px-2 py-1 text-[9.5px] font-extrabold text-fuchsia-100 hover:bg-fuchsia-500/40 cursor-pointer"
                        >
                          <Plus className="h-2.5 w-2.5" />
                          Equipo
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const res = onSpawnDevSpecimen(sp, 'box');
                            if (res.ok && res.uid) setSelectedUid(res.uid);
                            emitNotice(
                              res.ok
                                ? {
                                    tone: 'ok',
                                    text: `🧪 Espécimen ${sp} añadido a tu Caja de Reserva (0 PC).`,
                                  }
                                : { tone: 'err', text: res.error || '' }
                            );
                          }}
                          className="rounded-md border border-slate-700 bg-slate-900 px-2 py-0.5 text-[9px] font-bold text-slate-300 hover:text-white cursor-pointer"
                        >
                          + Caja
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ) : zoneList.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-800 bg-slate-950/50 px-4 py-6 text-center text-xs text-slate-400">
            {activeZoneTab === 'box' &&
              'Tu Caja de Reserva está vacía. Recluta especies en la Tienda (Pokédex de Compra) o baja titulares aquí para ajustar tu presupuesto BST.'}
            {activeZoneTab === 'house' &&
              'Aún no hay refuerzos en tu Casa. Alcanza Rango 3 venciendo la Rematch Injusta de un aliado romanceable.'}
            {activeZoneTab === 'graveyard' &&
              'El Cementerio del Exilio está vacío. Ningún compañero ha caído en modo Ultra Nuzlocke.'}
          </div>
        ) : (
          <div className="grid max-h-72 gap-2.5 overflow-y-auto pr-1 sm:grid-cols-2">
            {zoneList.map((inst) => {
              const isSel = selectedInstance?.uid === inst.uid;
              return (
                <div
                  key={inst.uid}
                  onClick={() => setSelectedUid(inst.uid)}
                  className={`rounded-2xl border p-2.5 transition cursor-pointer ${
                    isSel
                      ? 'border-amber-400 bg-amber-500/10'
                      : inst.zone === 'graveyard'
                        ? 'border-rose-500/30 bg-rose-950/20 opacity-85'
                        : 'border-slate-800 bg-slate-950/80 hover:border-slate-600'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div
                      className={
                        inst.zone === 'graveyard' ? 'grayscale opacity-60' : ''
                      }
                    >
                      <PokemonSprite
                        species={inst.species}
                        shiny={inst.shiny}
                        side="p2"
                        className="h-11 w-11"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1">
                        <p className="truncate text-xs font-bold text-white">
                          {inst.species}
                        </p>
                        <div className="flex items-center gap-1">
                          <span className="font-mono-code rounded bg-slate-900 px-1.5 py-0.2 text-[9px] font-bold text-sky-300">
                            {computePokemonBst(inst.species)} BST
                          </span>
                          {inst.zone === 'house' && (
                            <Heart className="h-3 w-3 shrink-0 fill-fuchsia-400 text-fuchsia-400" />
                          )}
                        </div>
                      </div>
                      <p className="truncate text-[10px] text-amber-300/85">
                        {inst.item ? `@ ${inst.item}` : 'Sin objeto'} ·{' '}
                        {inst.moves.slice(0, 2).join(', ')}
                      </p>
                      {renderHpAndStatus(inst)}
                      {inst.epitaph && (
                        <p className="mt-0.5 text-[9.5px] italic text-rose-300/90">
                          Caído T{inst.epitaph.turn} vs {inst.epitaph.rivalName}
                        </p>
                      )}
                    </div>
                  </div>
                  {inst.zone !== 'graveyard' && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        const res = onMoveInstanceZone(inst.uid, 'party');
                        emitNotice(
                          res.ok
                            ? {
                                tone: 'ok',
                                text: `↑ ${inst.species} subió a tu Equipo Activo.`,
                              }
                            : { tone: 'err', text: res.error || '' }
                        );
                      }}
                      className="mt-2 inline-flex w-full items-center justify-center gap-1 rounded-lg bg-amber-500/20 px-2 py-1 text-[10px] font-extrabold text-amber-200 hover:bg-amber-500/30 cursor-pointer"
                    >
                      <ArrowUpFromLine className="h-3 w-3" />
                      Subir al Equipo
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
