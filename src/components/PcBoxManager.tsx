import React, { useMemo, useState } from 'react';
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  Bookmark,
  BookmarkPlus,
  Box,
  Check,
  ClipboardPaste,
  Code2,
  Copy,
  Download,
  Filter,
  FlaskConical,
  Heart,
  Home,
  PackagePlus,
  Plus,
  ScrollText,
  Search,
  ShieldAlert,
  Skull,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import { Dex } from '@pkmn/sim';
import { DIFFICULTY_META, DIFFICULTY_ORDER } from '../data/economyCatalog';
import {
  compileCustomTeamToShowdownPaste,
  normalizePurificationChambers,
} from '../engine/playerProfile';
import {
  computePokemonBst,
  getAllAnythingGoesPlayableSpecies,
  getImperialBstLicense,
} from '../engine/pricingEngine';
import { getTypeBadgeClass } from '../engine/pokemonVisuals';
import {
  computeChamberFlowAndTempo,
  getShadowNatureProfile,
  getShadowUnlockState,
  isInstanceHighBond,
} from '../engine/shadowEngine';
import {
  compareByShowdownSort,
  getIndexedSpeciesMeta,
  matchesShowdownFilters,
  queryShowdownSuggestions,
  type ShowdownSearchFilter,
  type ShowdownSortKey,
} from '../engine/showdownSearchIndex';
import type {
  BattleDifficultyMode,
  OwnedPokemonInstance,
  PlayerSaveProfile,
  PokemonStorageZone,
  SavedCampaignTeam,
} from '../types/game';
import { PokemonEditor } from './PokemonEditor';
import { PokemonIcon, PokemonSprite } from './PokemonSprite';

const STATUS_BADGE: Record<string, { label: string; cls: string }> = {
  psn: { label: 'PSN', cls: 'bg-purple-500/30 text-purple-200 border-purple-400/50' },
  tox: { label: 'TOX', cls: 'bg-fuchsia-500/30 text-fuchsia-200 border-fuchsia-400/50' },
  brn: { label: 'BRN', cls: 'bg-orange-500/30 text-orange-200 border-orange-400/50' },
  par: { label: 'PAR', cls: 'bg-amber-500/30 text-amber-200 border-amber-400/50' },
  slp: { label: 'SLP', cls: 'bg-sky-500/30 text-sky-200 border-sky-400/50' },
  frz: { label: 'FRZ', cls: 'bg-cyan-500/30 text-cyan-200 border-cyan-400/50' },
};

const PAGE_SIZE = 48;

export interface PcBoxManagerProps {
  profile: PlayerSaveProfile;
  /** Live difficulty mode from TeambuilderBriefing (or standalone preview) controlling dynamic BST Cap & Baby Mode paste! */
  difficultyMode?: BattleDifficultyMode;
  /** Compact embedded mode inside TeambuilderBriefing left panel (keeps rival sighting visible on the right!). */
  embedded?: boolean;
  formatId?: string;
  onMoveInstanceZone: (
    uid: string,
    targetZone: Exclude<PokemonStorageZone, 'graveyard'>
  ) => { ok: boolean; error?: string };
  onReleaseInstance?: (
    uid: string
  ) => { ok: boolean; error?: string; releasedSpecies?: string };
  onEquipInstanceItem: (
    uid: string,
    itemName: string
  ) => { ok: boolean; error?: string; transferredFrom?: string };
  onUpdateInstanceBuild: (
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
  onSpawnDevShadowSpecimen?: (
    species?: string,
    targetZone?: 'party' | 'box' | 'purify'
  ) => { ok: boolean; error?: string; uid?: string };
  onPurifyInstance?: (
    uid: string
  ) => { ok: boolean; error?: string; species?: string; signatureGift?: string };
  onAssignShadowToChamber?: (
    chamberIndex: number,
    shadowUid: string | null
  ) => { ok: boolean; error?: string };
  onAssignRingPokemonToChamber?: (
    chamberIndex: number,
    ringSlotIndex: number,
    monUid: string | null
  ) => { ok: boolean; error?: string };
  onAutoOptimizeChamber?: (
    chamberIndex: number
  ) => {
    ok: boolean;
    error?: string;
    tempo?: number;
    isMaxTempo?: boolean;
    isPerfectSet?: boolean;
  };
  onPopulateLivingDexBox?: () => { addedCount: number; totalLiving: number };
  onImportShowdownPaste?: (
    rawPaste: string
  ) => { ok: boolean; error?: string; importedCount: number };
  onSaveCampaignTeam?: (
    name: string
  ) => { ok: boolean; error?: string; team?: SavedCampaignTeam };
  onLoadCampaignTeam?: (
    teamId: string,
    allowSpawnMissing?: boolean
  ) => {
    ok: boolean;
    error?: string;
    loadedCount: number;
    missingSpecies: string[];
  };
  onDeleteCampaignTeam?: (teamId: string) => void;
  onOpenShop?: () => void;
  onNotice?: (notice: { tone: 'ok' | 'err'; text: string }) => void;
}

/**
 * Reusable PC Box Manager (<PcBoxManager />):
 *  - Active Party (6 unique instances) + Dynamic Difficulty-Linked BST Cap Meter
 *  - Multiple Saved Campaign Teams Library (Save / 1-Click Load / Copy / Delete)
 *  - Unified Showdown-Style <PokemonEditor mode="free" /> (Apodo, Sexo, EVs, IVs, Habilidad, Naturaleza, Tera, Liberar)
 *  - Showdown-Inspired Indexed Search Engine (Filter Chips: Type / Ability / Move / Tier + Stat expressions + Sort + Pagination)
 *    working seamlessly across Reserve Box, House R3, Graveyard (with Nuzlocke Forensic Death Log!), and Dev AG Pokédex!
 *  - Baby Mode & Dev Mode Showdown Paste Importer + Direct Clipboard Paste!
 */
export const PcBoxManager: React.FC<PcBoxManagerProps> = ({
  profile,
  difficultyMode,
  embedded = false,
  formatId = 'gen9doublescustomgame@@@NatDex Mod',
  onMoveInstanceZone,
  onReleaseInstance,
  onEquipInstanceItem,
  onUpdateInstanceBuild,
  onUnlockMoveSlot,
  onSpawnDevSpecimen,
  onSpawnDevShadowSpecimen,
  onPurifyInstance,
  onAssignShadowToChamber,
  onAssignRingPokemonToChamber,
  onAutoOptimizeChamber,
  onPopulateLivingDexBox,
  onImportShowdownPaste,
  onSaveCampaignTeam,
  onLoadCampaignTeam,
  onDeleteCampaignTeam,
  onOpenShop,
  onNotice,
}) => {
  const [previewDiff, setPreviewDiff] = useState<BattleDifficultyMode>(
    difficultyMode ?? profile.defaultDifficulty ?? 'kaizo'
  );
  const effectiveDiff = difficultyMode ?? previewDiff;
  const isBabyMode = effectiveDiff === 'baby';
  const showDevLab = Boolean(profile.devModeEnabled || profile.devFullAgPokedex);
  const canImportPaste = Boolean(onImportShowdownPaste && (isBabyMode || showDevLab));

  const [activeZoneTab, setActiveZoneTab] = useState<
    'box' | 'purify' | 'house' | 'graveyard' | 'dev-lab'
  >('box');
  const [activeChamberIdx, setActiveChamberIdx] = useState<number>(0);
  const [selectedUid, setSelectedUid] = useState<string>(
    profile.pokemonBox.find((b) => b.zone === 'party')?.uid ??
      profile.pokemonBox[0]?.uid ??
      ''
  );
  const [localNotice, setLocalNotice] = useState<{
    tone: 'ok' | 'err';
    text: string;
  } | null>(null);

  // Showdown-style unified indexed search state (applies cleanly to Reserva, Casa R3, Cementerio & Dev Lab!)
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilters, setActiveFilters] = useState<ShowdownSearchFilter[]>([]);
  const [sortBy, setSortBy] = useState<ShowdownSortKey>('bst');
  const [visibleLimit, setVisibleLimit] = useState(PAGE_SIZE);
  const [confirmReleaseUid, setConfirmReleaseUid] = useState<string | null>(null);

  // Saved Teams Drawer & Paste Import/Export Drawer
  const [showSavedTeams, setShowSavedTeams] = useState(false);
  const [newTeamName, setNewTeamName] = useState('');
  const [showPasteTools, setShowPasteTools] = useState(false);
  const [importPasteText, setImportPasteText] = useState('');
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
  const purifyList = useMemo(
    () => profile.pokemonBox.filter((b) => b.zone === 'purify'),
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
  const savedTeams = profile.savedTeams ?? [];
  const deathLog = profile.nuzlockeDeathLog ?? [];
  const chambers = useMemo(
    () =>
      normalizePurificationChambers(
        profile.purificationChambers,
        profile.pokemonBox
      ),
    [profile.purificationChambers, profile.pokemonBox]
  );
  const boxByUid = useMemo(
    () => new Map(profile.pokemonBox.map((b) => [b.uid, b])),
    [profile.pokemonBox]
  );
  const allLivingShadows = useMemo(
    () =>
      profile.pokemonBox.filter(
        (b) => b.isShadow && b.zone !== 'graveyard'
      ),
    [profile.pokemonBox]
  );
  const ringSupportPool = useMemo(
    () =>
      profile.pokemonBox.filter(
        (b) => !b.isShadow && (b.zone === 'box' || b.zone === 'house')
      ),
    [profile.pokemonBox]
  );
  // Lightweight dropdown options for XD Purification Ring slots (uses fast Dex.species.get, capped at 80 entries so Living Dex 1,286 renders in <2ms!)
  const ringDropdownOptions = useMemo(() => {
    const out: Array<{ uid: string; label: string; species: string }> = [];
    const curRingSet = new Set<string>(
      (chambers[activeChamberIdx]?.ringUids ?? []).filter((x): x is string => Boolean(x))
    );
    const prioritized = [
      ...ringSupportPool.filter((m) => curRingSet.has(m.uid)),
      ...ringSupportPool.filter((m) => !curRingSet.has(m.uid)).slice(0, 80),
    ];
    for (const cand of prioritized) {
      const sp = Dex.species.get(cand.species);
      const typesLabel = sp.exists && sp.types.length > 0 ? sp.types.join('/') : 'Normal';
      out.push({
        uid: cand.uid,
        species: cand.species,
        label: `${cand.nickname || cand.species} [${typesLabel}]`,
      });
    }
    return out;
  }, [ringSupportPool, chambers, activeChamberIdx]);

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

  const allAgSpecies = useMemo(
    () => (showDevLab ? getAllAnythingGoesPlayableSpecies() : []),
    [showDevLab]
  );

  // Showdown grouped autocomplete suggestions (Types / Abilities / Moves / Tiers)
  const suggestions = useMemo(
    () => queryShowdownSuggestions(searchQuery, activeFilters),
    [searchQuery, activeFilters]
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
    setSearchQuery('');
    setVisibleLimit(PAGE_SIZE);
  };

  const removeFilterChip = (idx: number) => {
    setActiveFilters((prev) => prev.filter((_, i) => i !== idx));
    setVisibleLimit(PAGE_SIZE);
  };

  const clearAllSearch = () => {
    setSearchQuery('');
    setActiveFilters([]);
    setVisibleLimit(PAGE_SIZE);
  };

  // Filtered & sorted storage zone instances (Reserva / Cámara de Purificación / Casa / Cementerio)
  const rawZoneList =
    activeZoneTab === 'box'
      ? reserveBoxList
      : activeZoneTab === 'purify'
        ? purifyList
        : activeZoneTab === 'house'
          ? houseList
          : graveyardList;

  const filteredZoneInstances = useMemo(() => {
    if (activeZoneTab === 'dev-lab') return [];
    const matched =
      searchQuery.trim() || activeFilters.length > 0
        ? rawZoneList.filter((inst) =>
            matchesShowdownFilters(inst.species, searchQuery, activeFilters, inst)
          )
        : rawZoneList;
    return [...matched].sort((a, b) =>
      compareByShowdownSort(a.species, b.species, sortBy)
    );
  }, [activeZoneTab, rawZoneList, searchQuery, activeFilters, sortBy]);

  // Filtered & sorted Dev Pokédex AG species (all ~1,286 playable!)
  const filteredAgSpecies = useMemo(() => {
    if (activeZoneTab !== 'dev-lab' || !showDevLab) return [];
    const hasFilter = searchQuery.trim().length > 0 || activeFilters.length > 0;
    const pool = hasFilter
      ? allAgSpecies.filter((sp) =>
          matchesShowdownFilters(sp, searchQuery, activeFilters)
        )
      : [
          'Rayquaza-Mega',
          'Charizard-Mega-Y',
          'Zacian-Crowned',
          'Miraidon',
          'Calyrex-Shadow',
          'Flutter Mane',
          'Incineroar',
          'Urshifu-Rapid-Strike',
          'Shedinja',
          'Falinks',
          'Smeargle',
          'Ditto',
          'Cottonee',
          'Ninjask',
          'Zoroark-Hisui',
          'Kingambit',
          'Gholdengo',
          'Bidoof',
          ...allAgSpecies,
        ].filter((sp, idx, arr) => arr.indexOf(sp) === idx);
    return hasFilter
      ? [...pool].sort((a, b) => compareByShowdownSort(a, b, sortBy))
      : pool;
  }, [activeZoneTab, showDevLab, searchQuery, activeFilters, allAgSpecies, sortBy]);

  const handleClipboardImport = async () => {
    if (!onImportShowdownPaste) return;
    try {
      if (!navigator.clipboard || !navigator.clipboard.readText) {
        setShowPasteTools(true);
        emitNotice({
          tone: 'err',
          text: 'Tu navegador no permite leer el portapapeles directo. Pega el texto de Showdown en el cuadro de abajo.',
        });
        return;
      }
      const clipText = await navigator.clipboard.readText();
      if (!clipText.trim()) {
        setShowPasteTools(true);
        emitNotice({
          tone: 'err',
          text: 'El portapapeles está vacío. Copia un equipo en formato Pokémon Showdown primero.',
        });
        return;
      }
      const res = onImportShowdownPaste(clipText);
      emitNotice(
        res.ok
          ? {
              tone: 'ok',
              text: `📋 ¡${res.importedCount} Pokémon pegados desde el portapapeles directo a tu Equipo Activo!`,
            }
          : { tone: 'err', text: res.error || 'El texto del portapapeles no es un Paste válido de Showdown.' }
      );
      if (!res.ok) {
        setImportPasteText(clipText);
        setShowPasteTools(true);
      }
    } catch {
      setShowPasteTools(true);
      emitNotice({
        tone: 'err',
        text: 'Permiso de portapapeles bloqueado. Usa Ctrl+V en el cuadro de Importar Showdown abajo.',
      });
    }
  };

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

  const renderStatsLine = (speciesName: string) => {
    const meta = getIndexedSpeciesMeta(speciesName);
    const bs = meta.baseStats;
    return (
      <div className="hidden items-center gap-1.5 font-mono-code text-[9.5px] text-slate-400 md:flex">
        <span>HP <strong className="text-slate-200">{bs.hp}</strong></span>
        <span>Atk <strong className="text-slate-200">{bs.atk}</strong></span>
        <span>Def <strong className="text-slate-200">{bs.def}</strong></span>
        <span>SpA <strong className="text-slate-200">{bs.spa}</strong></span>
        <span>SpD <strong className="text-slate-200">{bs.spd}</strong></span>
        <span>Spe <strong className="text-amber-200">{bs.spe}</strong></span>
        <span className="rounded bg-slate-800 px-1 py-0.2 text-sky-300">
          BST {meta.bst}
        </span>
      </div>
    );
  };

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

      {/* 1. ACTIVE PARTY (6 UNIQUE INSTANCES) + SAVED TEAMS & CLIPBOARD TOOLBAR */}
      <div className="rounded-2xl border border-amber-400/30 bg-slate-900/75 p-3.5">
        <div className="mb-2.5 flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-display text-xs font-bold uppercase tracking-wider text-amber-200">
              Equipo Activo ({partyList.length}/6 · Cláusula de Especie)
            </h3>
            <span className="inline-flex items-center gap-1 text-[10px] text-slate-400">
              <ShieldAlert className="h-3 w-3 text-sky-400" />
              La Caja NO cura
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {onSaveCampaignTeam && (
              <button
                type="button"
                onClick={() => setShowSavedTeams((v) => !v)}
                className={`inline-flex items-center gap-1 rounded-lg border px-2.5 py-1 text-[10.5px] font-bold transition cursor-pointer ${
                  showSavedTeams
                    ? 'border-amber-400 bg-amber-500/20 text-amber-100'
                    : 'border-slate-700 bg-slate-950 text-slate-200 hover:border-amber-400/50'
                }`}
              >
                <Bookmark className="h-3 w-3 text-amber-300" />
                Mis Equipos ({savedTeams.length})
              </button>
            )}
            {canImportPaste && (
              <button
                type="button"
                onClick={() => void handleClipboardImport()}
                title="Lee tu portapapeles e importa un equipo en formato Pokémon Showdown al instante"
                className="inline-flex items-center gap-1 rounded-lg border border-sky-400/50 bg-sky-500/15 px-2.5 py-1 text-[10.5px] font-extrabold text-sky-100 hover:bg-sky-500/25 cursor-pointer"
              >
                <ClipboardPaste className="h-3 w-3 text-sky-300" />
                Pegar del Portapapeles
              </button>
            )}
            <button
              type="button"
              onClick={() => setShowPasteTools((v) => !v)}
              className="inline-flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-950 px-2 py-1 text-[10.5px] font-bold text-slate-300 hover:border-amber-400/50 hover:text-amber-200 cursor-pointer"
            >
              <Code2 className="h-3 w-3" />
              {showPasteTools ? 'Ocultar Paste' : 'Showdown Paste'}
            </button>
          </div>
        </div>

        {/* Multiple Saved Campaign Teams Library Drawer */}
        {showSavedTeams && onSaveCampaignTeam && (
          <div className="mb-3 space-y-2.5 rounded-2xl border border-amber-400/35 bg-slate-950/90 p-3">
            <div className="flex flex-wrap items-center gap-2">
              <input
                type="text"
                maxLength={40}
                value={newTeamName}
                onChange={(e) => setNewTeamName(e.target.value)}
                placeholder="Nombre para guardar este equipo (ej. Anti-Hombre Rata, Lluvia VGC, Trinidad Mega+Z)..."
                className="min-w-[200px] flex-1 rounded-xl border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:border-amber-400 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => {
                  const res = onSaveCampaignTeam(newTeamName);
                  if (res.ok && res.team) {
                    setNewTeamName('');
                    emitNotice({
                      tone: 'ok',
                      text: `💾 Equipo "${res.team.name}" guardado (${res.team.species.length} Pokémon).`,
                    });
                  } else {
                    emitNotice({ tone: 'err', text: res.error || 'Error al guardar equipo.' });
                  }
                }}
                className="inline-flex items-center gap-1 rounded-xl bg-amber-500 px-3 py-1.5 text-xs font-extrabold text-slate-950 hover:brightness-110 cursor-pointer"
              >
                <BookmarkPlus className="h-3.5 w-3.5" />
                Guardar Equipo Actual
              </button>
            </div>

            {savedTeams.length === 0 ? (
              <p className="text-[11px] text-slate-400">
                Aún no tienes equipos guardados. Guarda tus composiciones favoritas aquí para cambiar entre ellas con 1 clic antes de cada capítulo.
              </p>
            ) : (
              <div className="grid gap-2 sm:grid-cols-2">
                {savedTeams.map((team) => (
                  <div
                    key={team.id}
                    className="flex flex-col justify-between gap-2 rounded-xl border border-slate-800 bg-slate-900/90 p-2.5"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate text-xs font-extrabold text-amber-200">
                          {team.name}
                        </p>
                        <div className="mt-1 flex flex-wrap items-center gap-0.5">
                          {team.species.map((sp, i) => (
                            <span key={`${team.id}-${sp}-${i}`} title={sp}>
                              <PokemonIcon species={sp} className="scale-75" />
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className="flex shrink-0 items-center gap-1">
                        {onLoadCampaignTeam && (
                          <button
                            type="button"
                            onClick={() => {
                              const res = onLoadCampaignTeam(
                                team.id,
                                isBabyMode || showDevLab
                              );
                              if (res.ok) {
                                const warn =
                                  res.missingSpecies.length > 0
                                    ? ` (Faltan en Cajas/Caídos: ${res.missingSpecies.join(', ')})`
                                    : '';
                                emitNotice({
                                  tone: 'ok',
                                  text: `✅ Equipo "${team.name}" cargado (${res.loadedCount} Pokémon).${warn}`,
                                });
                              } else {
                                emitNotice({
                                  tone: 'err',
                                  text: res.error || 'No se pudo cargar el equipo.',
                                });
                              }
                            }}
                            className="rounded-lg bg-sky-500/25 px-2.5 py-1 text-[10px] font-extrabold text-sky-100 hover:bg-sky-500/40 cursor-pointer"
                          >
                            Cargar
                          </button>
                        )}
                        <button
                          type="button"
                          title="Copiar Paste Showdown de este equipo"
                          onClick={() => {
                            if (navigator.clipboard) {
                              void navigator.clipboard.writeText(team.paste);
                            }
                            emitNotice({
                              tone: 'ok',
                              text: `📋 Paste de "${team.name}" copiado al portapapeles.`,
                            });
                          }}
                          className="rounded-lg border border-slate-700 bg-slate-950 p-1 text-slate-300 hover:text-amber-200 cursor-pointer"
                        >
                          <Copy className="h-3 w-3" />
                        </button>
                        {onDeleteCampaignTeam && (
                          <button
                            type="button"
                            title="Eliminar equipo guardado"
                            onClick={() => {
                              onDeleteCampaignTeam(team.id);
                              emitNotice({
                                tone: 'ok',
                                text: `🗑️ Equipo "${team.name}" eliminado de tu biblioteca.`,
                              });
                            }}
                            className="rounded-lg border border-rose-500/35 bg-rose-950/40 p-1 text-rose-300 hover:bg-rose-500/25 cursor-pointer"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Showdown Import / Export Drawer (Available in Baby Mode & Dev Mode for Import; ALL modes for Export!) */}
        {showPasteTools && (
          <div className="mb-3 space-y-2.5 rounded-2xl border border-amber-400/35 bg-slate-950/90 p-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-[11px] font-extrabold text-amber-200">
                <Download className="mr-1 inline h-3.5 w-3.5" />
                Exportar Paste Showdown (Apodos, Sexo, EVs, IVs, Objetos y Movimientos)
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

            {canImportPaste ? (
              <div className="border-t border-slate-800 pt-2.5">
                <div className="mb-1.5 flex flex-wrap items-center justify-between gap-2">
                  <p className="text-[11px] font-extrabold text-sky-200">
                    <Upload className="mr-1 inline h-3.5 w-3.5" />
                    {isBabyMode && !showDevLab
                      ? '👶 [BABY MODE] Importar cualquier equipo de Showdown al instante'
                      : '🧪 [DEV / BABY MODE] Importar Paste Showdown directo al Equipo Activo'}
                  </p>
                  <button
                    type="button"
                    onClick={() => void handleClipboardImport()}
                    className="inline-flex items-center gap-1 rounded-lg border border-sky-400/50 bg-sky-500/20 px-2.5 py-1 text-[10px] font-extrabold text-sky-100 hover:bg-sky-500/30 cursor-pointer"
                  >
                    <ClipboardPaste className="h-3 w-3" />
                    Leer del Portapapeles
                  </button>
                </div>
                <textarea
                  value={importPasteText}
                  onChange={(e) => setImportPasteText(e.target.value)}
                  rows={5}
                  placeholder="Pega aquí un equipo de Pokémon Showdown (hasta 6 Pokémon con Apodos, Sexo, EVs, IVs, Mega Piedras o Cristales Z)..."
                  className="font-mono-code w-full rounded-xl border border-sky-400/35 bg-black/70 p-2.5 text-[10.5px] text-slate-200 placeholder-slate-500 focus:border-sky-400 focus:outline-none"
                />
                <div className="mt-2 flex justify-end">
                  <button
                    type="button"
                    disabled={!importPasteText.trim()}
                    onClick={() => {
                      const res = onImportShowdownPaste!(importPasteText);
                      emitNotice(
                        res.ok
                          ? {
                              tone: 'ok',
                              text: `✅ ¡${res.importedCount} Pokémon importados desde Showdown directo a tu Equipo Activo!`,
                            }
                          : { tone: 'err', text: res.error || 'Error al importar.' }
                      );
                      if (res.ok) setImportPasteText('');
                    }}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-sky-400 to-amber-400 px-3.5 py-1.5 text-[11px] font-extrabold text-slate-950 hover:brightness-110 disabled:opacity-40 cursor-pointer"
                  >
                    <Upload className="h-3.5 w-3.5" />
                    Importar al Equipo Activo
                  </button>
                </div>
              </div>
            ) : (
              <p className="border-t border-slate-800 pt-2 text-[10.5px] text-slate-400">
                💡 Para pegar equipos libres desde Showdown al instante, cambia la dificultad a{' '}
                <strong className="text-sky-300">Baby Mode</strong> o activa{' '}
                <strong className="text-fuchsia-300">Dev Mode</strong>.
              </p>
            )}
          </div>
        )}

        {/* Active Party 6-Slot Grid */}
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
                            text: `↓ ${inst.nickname || inst.species} estacionado en la Caja de Reserva (sin curar).`,
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
                  {inst.nickname || inst.species}
                  {inst.gender === 'M' ? (
                    <span className="ml-0.5 text-sky-400">♂</span>
                  ) : inst.gender === 'F' ? (
                    <span className="ml-0.5 text-pink-400">♀</span>
                  ) : null}
                </p>
                {inst.nickname && (
                  <p className="truncate text-center text-[9px] text-slate-400">
                    ({inst.species})
                  </p>
                )}
                <p className="text-center font-mono-code text-[9px] font-bold text-sky-300">
                  {computePokemonBst(inst.species)} BST
                </p>
                <p className="truncate text-center text-[9px] text-amber-200/80">
                  {inst.item ? `@ ${inst.item}` : 'Sin objeto'}
                </p>
                {inst.isShadow ? (
                  <div className="mt-1 rounded-md border border-fuchsia-400/55 bg-fuchsia-950/75 px-1.5 py-0.5 text-center text-[8.5px] font-extrabold text-fuchsia-200">
                    🟣 Oscuro · Corazón {inst.heartGauge ?? 100}%
                  </div>
                ) : isInstanceHighBond(inst) ? (
                  <p className="mt-0.5 text-center text-[8.5px] font-bold text-pink-300">
                    💖 Vínculo Alto
                  </p>
                ) : null}
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

      {/* 2. UNIFIED SHOWDOWN-STYLE POKÉMON EDITOR (mode="free": Apodo, Sexo, EVs, IVs, Liberar, Learnset) */}
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
                    text: `↓ ${selectedInstance.nickname || selectedInstance.species} guardado en la Caja de Reserva (sin curar).`,
                  }
                : { tone: 'err', text: res.error || '' }
            );
          }}
          onReleaseInstance={onReleaseInstance}
          onEquipInstanceItem={onEquipInstanceItem}
          onUpdateInstanceBuild={onUpdateInstanceBuild}
          onUnlockMoveSlot={onUnlockMoveSlot}
          onOpenShop={onOpenShop}
          onNotice={emitNotice}
        />
      )}

      {/* 3. STORAGE TRAYS WITH SHOWDOWN-INSPIRED INDEXED SEARCH ENGINE (BOX / HOUSE R3 / GRAVEYARD + DEATH LOG / DEV AG LAB) */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/75 p-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={() => {
                setActiveZoneTab('box');
                setVisibleLimit(PAGE_SIZE);
              }}
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
              onClick={() => {
                setActiveZoneTab('purify');
                setVisibleLimit(PAGE_SIZE);
              }}
              className={`inline-flex items-center gap-1 rounded-xl border px-2.5 py-1.5 text-[11px] font-extrabold transition cursor-pointer ${
                activeZoneTab === 'purify'
                  ? 'border-fuchsia-400 bg-fuchsia-500/25 text-fuchsia-100 shadow-md shadow-fuchsia-500/20'
                  : 'border-fuchsia-500/35 bg-fuchsia-950/30 text-fuchsia-200 hover:border-fuchsia-400'
              }`}
            >
              🟣 Cámara de Purificación ({purifyList.length})
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveZoneTab('house');
                setVisibleLimit(PAGE_SIZE);
              }}
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
              onClick={() => {
                setActiveZoneTab('graveyard');
                setVisibleLimit(PAGE_SIZE);
              }}
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
                onClick={() => {
                  setActiveZoneTab('dev-lab');
                  setVisibleLimit(PAGE_SIZE);
                }}
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

          {/* Sort selector (Showdown-style quick sort!) */}
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-bold uppercase text-slate-500">
              Orden:
            </span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as ShowdownSortKey)}
              className="rounded-lg border border-slate-700 bg-slate-950 px-2 py-1 text-[10.5px] font-bold text-slate-200 focus:border-amber-400 focus:outline-none"
            >
              <option value="bst">BST ↓</option>
              <option value="name">Nombre A–Z</option>
              <option value="spe">Velocidad ↓</option>
              <option value="atk">Ataque ↓</option>
              <option value="spa">At. Esp. ↓</option>
              <option value="hp">HP ↓</option>
              <option value="def">Defensa ↓</option>
              <option value="spd">Def. Esp. ↓</option>
            </select>
          </div>
        </div>

        {/* SHOWDOWN-INSPIRED UNIFIED INDEXED SEARCH BAR + FILTER CHIPS + GROUPED AUTOCOMPLETE */}
        <div className="mb-3 space-y-2">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-amber-300" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setVisibleLimit(PAGE_SIZE);
              }}
              placeholder="Buscador Showdown: nombre, apodo, tipo (Fighting), habilidad (Intimidate), movimiento (Fake Out), tier (Uber) o stats (spe>=100, bst<=450)..."
              className="w-full rounded-xl border border-slate-700 bg-slate-950 py-2 pl-9 pr-20 text-xs text-white placeholder-slate-500 focus:border-amber-400 focus:outline-none"
            />
            {(searchQuery || activeFilters.length > 0) && (
              <button
                type="button"
                onClick={clearAllSearch}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg border border-slate-700 bg-slate-900 px-2 py-0.5 text-[10px] font-bold text-slate-300 hover:text-white cursor-pointer"
              >
                Limpiar
              </button>
            )}
          </div>

          {/* Active Showdown Filter Chips */}
          {activeFilters.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase text-slate-400">
                <Filter className="h-3 w-3 text-amber-400" />
                Filtros:
              </span>
              {activeFilters.map((f, idx) => (
                <span
                  key={`${f.kind}-${f.value}-${idx}`}
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

          {/* Grouped Showdown Autocomplete Strip (Types / Tiers / Abilities / Moves with [Filter] button!) */}
          {hasSuggestions && (
            <div className="rounded-xl border border-amber-400/35 bg-[#080d1a] p-2.5 text-[11px] shadow-xl">
              <div className="flex flex-wrap items-center gap-1.5">
                {suggestions.types.map((t) => (
                  <button
                    key={`sug-type-${t.name}`}
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
                    key={`sug-tier-${tier.name}`}
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
                    key={`sug-ab-${ab.name}`}
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
                    key={`sug-mv-${mv.name}`}
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
                    <span>Mov: {mv.name}</span>
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
        </div>

        {/* DEV LAB TAB: Living Dex Button + Full Showdown-Indexed AG Pokédex */}
        {activeZoneTab === 'dev-lab' && showDevLab ? (
          <div className="space-y-2.5">
            {onPopulateLivingDexBox && (
              <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-emerald-400/35 bg-emerald-950/25 px-3 py-2">
                <p className="text-[11px] font-semibold text-emerald-100">
                  📦 <strong>Dev Living Dex:</strong> agrega 1 ejemplar de cada una de las{' '}
                  {allAgSpecies.length} especies directo a tu Caja de Reserva.
                </p>
                <div className="flex flex-wrap items-center gap-1.5">
                  {onSpawnDevShadowSpecimen && (
                    <button
                      type="button"
                      onClick={() => {
                        const res = onSpawnDevShadowSpecimen('Lugia', 'purify');
                        if (res.ok && res.uid) setSelectedUid(res.uid);
                        emitNotice(
                          res.ok
                            ? {
                                tone: 'ok',
                                text: '🟣 ¡XD001 Lugia Oscuro (Shadow Aeroblast / Shadow Eclipse / Shadow Sky / Shadow Siphon) invocado en la Cámara de Purificación!',
                              }
                            : { tone: 'err', text: res.error || '' }
                        );
                        setActiveZoneTab('purify');
                      }}
                      className="inline-flex items-center gap-1 rounded-lg border border-fuchsia-400/60 bg-fuchsia-500/25 px-3 py-1 text-[10.5px] font-extrabold text-fuchsia-100 hover:bg-fuchsia-500/40 cursor-pointer"
                    >
                      🟣 Invocar XD001 Lugia Oscuro
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      const res = onPopulateLivingDexBox();
                      emitNotice({
                        tone: 'ok',
                        text: `📦 ¡Living Dex cargado! +${res.addedCount} especies agregadas a tu Caja de Reserva (Total vivos: ${res.totalLiving}).`,
                      });
                      setActiveZoneTab('box');
                    }}
                    className="inline-flex items-center gap-1 rounded-lg bg-emerald-500 px-3 py-1 text-[10.5px] font-extrabold text-slate-950 hover:brightness-110 cursor-pointer"
                  >
                    <PackagePlus className="h-3.5 w-3.5" />
                    Meter 1 de cada especie a mi Caja
                  </button>
                </div>
              </div>
            )}

            <p className="text-[10.5px] text-slate-400">
              Mostrando {Math.min(visibleLimit, filteredAgSpecies.length)} de{' '}
              <strong className="text-fuchsia-200">{filteredAgSpecies.length}</strong>{' '}
              especies jugables (Anything Goes)
            </p>

            <div className="max-h-80 space-y-1.5 overflow-y-auto pr-1">
              {filteredAgSpecies.slice(0, visibleLimit).map((sp) => {
                const meta = getIndexedSpeciesMeta(sp);
                return (
                  <div
                    key={sp}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-800 bg-slate-950/90 px-2.5 py-1.5 transition hover:border-fuchsia-400/40"
                  >
                    <div className="flex min-w-0 flex-1 items-center gap-2">
                      <span className="w-12 shrink-0 rounded bg-slate-900 px-1 py-0.5 text-center font-mono-code text-[9px] font-bold text-fuchsia-300">
                        {meta.tierBand}
                      </span>
                      <PokemonIcon species={sp} className="shrink-0" />
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-1">
                          <span className="truncate text-xs font-bold text-white">
                            {sp}
                          </span>
                          {meta.types.map((t) => (
                            <span
                              key={t}
                              className={`rounded border px-1 py-0.2 text-[8.5px] font-bold uppercase ${getTypeBadgeClass(t)}`}
                            >
                              {t}
                            </span>
                          ))}
                        </div>
                        <p className="truncate text-[9.5px] text-slate-400">
                          {meta.abilities.join(' · ')}
                        </p>
                      </div>
                    </div>

                    {renderStatsLine(sp)}

                    {onSpawnDevSpecimen && (
                      <div className="flex shrink-0 items-center gap-1">
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
                          className="rounded-md border border-slate-700 bg-slate-900 px-2 py-1 text-[9.5px] font-bold text-slate-300 hover:text-white cursor-pointer"
                        >
                          + Caja
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {filteredAgSpecies.length > visibleLimit && (
              <button
                type="button"
                onClick={() => setVisibleLimit((v) => v + PAGE_SIZE)}
                className="w-full rounded-xl border border-slate-700 bg-slate-950 py-1.5 text-xs font-bold text-slate-300 hover:border-amber-400/50 hover:text-amber-200 cursor-pointer"
              >
                Mostrar +{PAGE_SIZE} más ({filteredAgSpecies.length - visibleLimit} restantes)
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {/* XD PURIFICATION CHAMBER: 9 PARALLEL FLOW & TEMPO RINGS + CLOCKWISE TYPE-ADVANTAGE VISUALIZER */}
            {activeZoneTab === 'purify' && (() => {
              const curChamber = chambers[activeChamberIdx] ?? chambers[0];
              const centerShadow = curChamber.shadowUid
                ? boxByUid.get(curChamber.shadowUid) ?? null
                : null;
              const ringMons = curChamber.ringUids.map((uid) =>
                uid ? boxByUid.get(uid) ?? null : null
              );
              const flowTempo = computeChamberFlowAndTempo(centerShadow, ringMons);
              const centerUnlock = centerShadow
                ? getShadowUnlockState(centerShadow, profile.devModeEnabled)
                : null;
              const centerNatureProf = centerShadow
                ? getShadowNatureProfile(centerShadow.nature)
                : null;
              const ringSlotLabels = ['Norte (1)', 'Este (2)', 'Sur (3)', 'Oeste (4)'];

              const edgeBadge = (edgeIdx: number) => {
                const e = flowTempo.edges[edgeIdx];
                if (!e || e.outcome === 'empty') {
                  return (
                    <span className="rounded bg-slate-900/90 px-1.5 py-0.5 text-[9px] font-bold text-slate-500">
                      → Vacío
                    </span>
                  );
                }
                if (e.outcome === 'super') {
                  return (
                    <span className="rounded border border-emerald-400/55 bg-emerald-500/20 px-1.5 py-0.5 text-[9px] font-extrabold text-emerald-200">
                      → SE +6
                    </span>
                  );
                }
                if (e.outcome === 'neutral') {
                  return (
                    <span className="rounded border border-amber-400/40 bg-amber-500/15 px-1.5 py-0.5 text-[9px] font-bold text-amber-200">
                      → Neutro 0
                    </span>
                  );
                }
                return (
                  <span className="rounded border border-rose-400/50 bg-rose-500/20 px-1.5 py-0.5 text-[9px] font-extrabold text-rose-200">
                    → Resist -3
                  </span>
                );
              };

              const renderRingCard = (slotIdx: number) => {
                const mon = ringMons[slotIdx];
                const meta = mon ? getIndexedSpeciesMeta(mon.species) : null;
                return (
                  <div
                    key={`ring-slot-${slotIdx}`}
                    className={`rounded-xl border p-2 transition ${
                      mon
                        ? 'border-sky-400/45 bg-slate-950/90'
                        : 'border-dashed border-slate-700 bg-slate-950/50'
                    }`}
                  >
                    <div className="mb-1 flex items-center justify-between gap-1">
                      <span className="text-[9.5px] font-extrabold uppercase tracking-wider text-sky-300">
                        {ringSlotLabels[slotIdx]}
                      </span>
                      {edgeBadge(slotIdx)}
                    </div>
                    {mon ? (
                      <div className="mb-1.5 flex items-center gap-1.5">
                        <PokemonIcon species={mon.species} className="scale-75 shrink-0" />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[11px] font-bold text-white">
                            {mon.nickname || mon.species}
                          </p>
                          <div className="flex flex-wrap gap-0.5">
                            {meta?.types.map((t) => (
                              <span
                                key={t}
                                className={`rounded border px-1 text-[8px] font-bold uppercase ${getTypeBadgeClass(t)}`}
                              >
                                {t}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <p className="mb-1.5 text-[10px] text-slate-500">
                        Sin aliado de soporte
                      </p>
                    )}
                    {onAssignRingPokemonToChamber && (
                      <select
                        value={mon?.uid ?? ''}
                        onChange={(e) => {
                          const res = onAssignRingPokemonToChamber(
                            activeChamberIdx,
                            slotIdx,
                            e.target.value || null
                          );
                          if (!res.ok) {
                            emitNotice({ tone: 'err', text: res.error || '' });
                          }
                        }}
                        className="w-full rounded-lg border border-slate-700 bg-slate-900 px-1.5 py-1 text-[10px] font-semibold text-slate-200 focus:border-sky-400 focus:outline-none"
                      >
                        <option value="">(Vaciar ranura)</option>
                        {ringDropdownOptions.map((opt) => (
                          <option key={opt.uid} value={opt.uid}>
                            {opt.label}
                          </option>
                        ))}
                        {ringSupportPool.length > 80 && (
                          <option value="" disabled>
                            — Usa «⚡ Auto-Optimizar Anillo» para escanear los {ringSupportPool.length} Pokémon —
                          </option>
                        )}
                      </select>
                    )}
                  </div>
                );
              };

              return (
                <div className="space-y-3 rounded-2xl border border-fuchsia-400/50 bg-gradient-to-br from-fuchsia-950/55 via-slate-950/92 to-purple-950/45 p-3.5 text-xs">
                  {/* Top Chamber Header + Auto-Optimize Button */}
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="font-extrabold text-fuchsia-200">
                        🟣 Cámara de Purificación XD (9 Anillos · Flow &amp; Tempo Horario)
                      </p>
                      <p className="mt-0.5 text-[10.5px] text-slate-300">
                        Rodea a cada Pokémon Oscuro con 4 aliados en sentido horario (<strong>Norte → Este → Sur → Oeste → Norte</strong>) con ventaja de tipo (Normal pega SE a Normal) para disparar el <strong>Tempo</strong> y romper el Sello Final de XD001 Lugia Oscuro.
                      </p>
                    </div>
                    {onAutoOptimizeChamber && centerShadow && (
                      <button
                        type="button"
                        onClick={() => {
                          const res = onAutoOptimizeChamber(activeChamberIdx);
                          emitNotice(
                            res.ok
                              ? {
                                  tone: 'ok',
                                  text: `⚡ ¡Anillo de Cámara #${activeChamberIdx + 1} optimizado! Tempo ${res.tempo}%${res.isMaxTempo ? ' · 🏆 ¡TEMPO MÁXIMO!' : ''}${res.isPerfectSet ? ' · ✨ Set Perfecto!' : ''}`,
                                }
                              : { tone: 'err', text: res.error || '' }
                          );
                        }}
                        className="inline-flex items-center gap-1 rounded-xl bg-gradient-to-r from-amber-400 to-fuchsia-400 px-3 py-1.5 text-[10.5px] font-black text-slate-950 shadow hover:brightness-110 cursor-pointer"
                      >
                        ⚡ Auto-Optimizar Anillo
                      </button>
                    )}
                  </div>

                  {/* 9-Chamber Selector Strip */}
                  <div className="grid grid-cols-3 gap-1.5 sm:grid-cols-9">
                    {chambers.map((ch) => {
                      const sh = ch.shadowUid ? boxByUid.get(ch.shadowUid) ?? null : null;
                      const chRing = ch.ringUids.map((u) => (u ? boxByUid.get(u) ?? null : null));
                      const chEval = computeChamberFlowAndTempo(sh, chRing);
                      const isSelCh = ch.chamberIndex === activeChamberIdx;
                      return (
                        <button
                          key={`chamber-tab-${ch.chamberIndex}`}
                          type="button"
                          onClick={() => setActiveChamberIdx(ch.chamberIndex)}
                          className={`flex flex-col items-center rounded-xl border px-1.5 py-1.5 text-center transition cursor-pointer ${
                            isSelCh
                              ? 'border-fuchsia-300 bg-fuchsia-500/25 text-white ring-1 ring-fuchsia-300/60'
                              : sh
                                ? 'border-fuchsia-500/35 bg-slate-950/85 text-fuchsia-100 hover:border-fuchsia-400'
                                : 'border-slate-800 bg-slate-950/50 text-slate-500 hover:text-slate-300'
                          }`}
                        >
                          <span className="font-mono-code text-[9px] font-extrabold">
                            C{ch.chamberIndex + 1}
                          </span>
                          {sh ? (
                            <PokemonIcon species={sh.species} className="scale-[0.65] -my-1" />
                          ) : (
                            <span className="my-1 text-[10px] opacity-40">○</span>
                          )}
                          <span
                            className={`font-mono-code text-[8px] font-bold ${
                              chEval.isMaxTempo
                                ? 'text-amber-300'
                                : sh
                                  ? 'text-fuchsia-200'
                                  : 'text-slate-600'
                            }`}
                          >
                            {chEval.isMaxTempo ? '★MAX' : sh ? `${sh.heartGauge ?? 100}%` : 'Libre'}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Interactive XD Circular Flow & Tempo Ring Layout */}
                  <div className="grid gap-2.5 lg:grid-cols-3 lg:items-center">
                    {/* West (3) + North (0) */}
                    <div className="space-y-2">
                      {renderRingCard(0)}
                      {renderRingCard(3)}
                    </div>

                    {/* CENTER SHADOW PEDESTAL + FLOW & TEMPO METERS */}
                    <div className="flex flex-col items-center rounded-2xl border-2 border-fuchsia-400/60 bg-slate-950/90 p-3 text-center shadow-xl shadow-fuchsia-950/50">
                      <span className="text-[9.5px] font-black uppercase tracking-widest text-fuchsia-300">
                        Cámara #{activeChamberIdx + 1} · Centro Oscuro
                      </span>

                      {centerShadow && centerUnlock ? (
                        <>
                          <div
                            onClick={() => setSelectedUid(centerShadow.uid)}
                            className="mt-1.5 flex h-16 w-16 items-center justify-center rounded-full border-2 border-fuchsia-400/70 bg-fuchsia-950/60 shadow-inner cursor-pointer hover:scale-105 transition"
                          >
                            <PokemonSprite
                              species={centerShadow.species}
                              shiny={centerShadow.shiny}
                              side="p2"
                              className="h-14 w-14"
                            />
                          </div>
                          <p className="mt-1 text-xs font-extrabold text-white">
                            🟣 {centerShadow.nickname || centerShadow.species}
                          </p>
                          <p className="text-[10px] font-bold text-fuchsia-200">
                            {centerUnlock.stageLabel} ({centerUnlock.heartGauge}%)
                          </p>

                          {/* 5-Bar Heart Gauge */}
                          <div className="mt-1.5 grid w-full grid-cols-5 gap-1">
                            {[1, 2, 3, 4, 5].map((b) => (
                              <div
                                key={`center-bar-${b}`}
                                className={`h-2 rounded-full ${
                                  centerUnlock.barsClosed >= b
                                    ? 'bg-gradient-to-r from-fuchsia-500 to-purple-400'
                                    : 'bg-emerald-400/35 border border-emerald-400/50'
                                }`}
                              />
                            ))}
                          </div>

                          <p className="mt-1 text-[9.5px] text-amber-200/90">
                            {centerUnlock.natureRevealed && centerNatureProf
                              ? `${centerShadow.nature} · ${centerNatureProf.label}`
                              : '🔒 Naturaleza ???? (se revela al 3/5)'}
                          </p>

                          {centerUnlock.requiresMaxTempoSeal && (
                            <p
                              className={`mt-1.5 rounded-lg border px-2 py-1 text-[9.5px] font-extrabold ${
                                flowTempo.isMaxTempo
                                  ? 'border-emerald-400/60 bg-emerald-500/20 text-emerald-200'
                                  : 'border-amber-400/55 bg-amber-500/15 text-amber-200'
                              }`}
                            >
                              {flowTempo.isMaxTempo
                                ? '🔓 ¡TEMPO MÁXIMO LISTO! Gana 1 combate para abrir XD001 a 0%.'
                                : '🔒 Sello XD001 (20%): logra Tempo Máximo (4 flechas SE) para romper a 0%.'}
                            </p>
                          )}

                          {onPurifyInstance &&
                            (centerUnlock.heartGauge <= 0 || profile.devModeEnabled) && (
                              <button
                                type="button"
                                onClick={() => {
                                  const res = onPurifyInstance(centerShadow.uid);
                                  emitNotice(
                                    res.ok
                                      ? {
                                          tone: 'ok',
                                          text: `✨ ¡${res.species} purificado! Regalo exclusivo: ${res.signatureGift}.`,
                                        }
                                      : { tone: 'err', text: res.error || '' }
                                  );
                                }}
                                className="mt-2 w-full rounded-xl bg-gradient-to-r from-emerald-400 to-cyan-400 px-3 py-1.5 text-[10.5px] font-black text-slate-950 shadow hover:brightness-110 cursor-pointer"
                              >
                                ✨ Purificar Ahora (Opcional)
                              </button>
                            )}
                        </>
                      ) : (
                        <div className="my-4 text-[10.5px] text-slate-400">
                          Ranura central vacía. Elige un Pokémon Oscuro debajo o arrebata uno en Aura (Orre).
                        </div>
                      )}

                      {onAssignShadowToChamber && (
                        <select
                          value={centerShadow?.uid ?? ''}
                          onChange={(e) => {
                            const res = onAssignShadowToChamber(
                              activeChamberIdx,
                              e.target.value || null
                            );
                            if (!res.ok) {
                              emitNotice({ tone: 'err', text: res.error || '' });
                            }
                          }}
                          className="mt-2 w-full rounded-lg border border-fuchsia-400/40 bg-slate-900 px-2 py-1 text-[10px] font-bold text-fuchsia-100 focus:border-fuchsia-300 focus:outline-none"
                        >
                          <option value="">(Vaciar centro de Cámara)</option>
                          {allLivingShadows.map((sh) => (
                            <option key={sh.uid} value={sh.uid}>
                              🟣 {sh.nickname || sh.species} ({sh.heartGauge ?? 100}%)
                            </option>
                          ))}
                        </select>
                      )}

                      {/* Live Flow & Tempo Gauges */}
                      <div className="mt-2.5 w-full space-y-1.5 border-t border-white/10 pt-2 text-left">
                        <div>
                          <div className="flex justify-between font-mono-code text-[9.5px]">
                            <span className="font-bold text-sky-300">FLOW (Anillo Horario)</span>
                            <span className="font-extrabold text-white">{flowTempo.flow}%</span>
                          </div>
                          <div className="mt-0.5 h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
                            <div
                              className="h-full bg-gradient-to-r from-sky-500 to-cyan-300 transition-all"
                              style={{ width: `${flowTempo.flow}%` }}
                            />
                          </div>
                        </div>
                        <div>
                          <div className="flex justify-between font-mono-code text-[9.5px]">
                            <span className="font-bold text-amber-300">
                              TEMPO (×{flowTempo.centralFactor} centro)
                            </span>
                            <span className="font-extrabold text-white">
                              {flowTempo.tempo}% {flowTempo.isMaxTempo ? '★ MÁX' : ''}
                            </span>
                          </div>
                          <div className="mt-0.5 h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
                            <div
                              className={`h-full transition-all ${
                                flowTempo.isMaxTempo
                                  ? 'bg-gradient-to-r from-amber-400 via-yellow-300 to-emerald-400'
                                  : 'bg-gradient-to-r from-fuchsia-500 to-amber-400'
                              }`}
                              style={{ width: `${flowTempo.tempo}%` }}
                            />
                          </div>
                        </div>
                        <div className="flex flex-wrap items-center justify-between gap-1 pt-0.5 text-[9.5px]">
                          <span className="font-mono-code font-extrabold text-emerald-300">
                            -{flowTempo.effectiveHeartDropPerBattle}% Corazón / combate
                          </span>
                          {flowTempo.isPerfectSet && (
                            <span className="rounded bg-amber-400/25 px-1.5 py-0.2 font-extrabold text-amber-200">
                              ✨ Set Perfecto (+12)
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* East (1) + South (2) */}
                    <div className="space-y-2">
                      {renderRingCard(1)}
                      {renderRingCard(2)}
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* NUZLOCKE FORENSIC DEATH LOG (inside Graveyard tab!) */}
            {activeZoneTab === 'graveyard' && (
              <div className="rounded-2xl border border-rose-500/35 bg-rose-950/20 p-3">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <p className="inline-flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-rose-200">
                    <ScrollText className="h-3.5 w-3.5 text-rose-400" />
                    Bitácora Forense de Caídos Nuzlocke ({deathLog.length})
                  </p>
                  <span className="text-[10px] text-rose-300/75">
                    Oponente · Movimiento letal · Capítulo · Turno
                  </span>
                </div>
                {deathLog.length === 0 ? (
                  <p className="text-[11px] text-slate-400">
                    Sin muertes permanentes registradas en la bitácora. Cuando un compañero caiga con Permadeath activo, aquí quedarán grabadas las circunstancias exactas de su caída.
                  </p>
                ) : (
                  <div className="max-h-48 space-y-1.5 overflow-y-auto pr-1">
                    {deathLog.map((entry) => (
                      <div
                        key={entry.id}
                        className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-rose-500/25 bg-slate-950/85 px-3 py-2 text-[11px]"
                      >
                        <div className="flex items-center gap-2">
                          <div className="grayscale opacity-75">
                            <PokemonIcon species={entry.species} />
                          </div>
                          <div>
                            <p className="font-bold text-rose-100">
                              💀 {entry.nickname ? `${entry.nickname} (${entry.species})` : entry.species}
                              <span className="ml-1.5 rounded bg-rose-500/20 px-1.5 py-0.2 font-mono-code text-[9.5px] text-rose-200">
                                Turno {entry.turn}
                              </span>
                            </p>
                            <p className="text-[10.5px] text-slate-300">
                              Eliminado por{' '}
                              <strong className="text-amber-200">{entry.killerSpecies}</strong>{' '}
                              con <strong className="text-rose-300">{entry.killerMove}</strong> ·{' '}
                              <span>{entry.rivalName}</span>
                            </p>
                          </div>
                        </div>
                        <div className="text-right text-[10px] text-slate-400">
                          <p className="font-semibold text-slate-200">{entry.chapterTitle}</p>
                          <p>
                            {DIFFICULTY_META[entry.difficulty]?.shortLabel ?? entry.difficulty} ·{' '}
                            {new Date(entry.fallenAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Filtered Zone List (Reserva / Casa R3 / Cementerio) */}
            {filteredZoneInstances.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-800 bg-slate-950/50 px-4 py-6 text-center text-xs text-slate-400">
                {searchQuery || activeFilters.length > 0
                  ? 'Ningún Pokémon de esta caja coincide con tu búsqueda o filtros Showdown.'
                  : activeZoneTab === 'box'
                    ? 'Tu Caja de Reserva está vacía. Recluta especies en la Tienda, baja titulares aquí o usa el Living Dex en Dev Mode.'
                    : activeZoneTab === 'purify'
                      ? 'La Cámara de Purificación está vacía. Gana combates contra Pokémon Oscuros en Aura (Orre) para arrebatarlos y envíalos aquí desde tu Reserva o Equipo.'
                      : activeZoneTab === 'house'
                        ? 'Aún no hay refuerzos en tu Casa. Alcanza Rango 3 venciendo la Rematch Injusta de un aliado romanceable.'
                        : 'El Cementerio del Exilio está vacío. Ningún compañero ha caído en modo Ultra Nuzlocke.'}
              </div>
            ) : (
              <>
                <p className="text-[10.5px] text-slate-400">
                  Mostrando {Math.min(visibleLimit, filteredZoneInstances.length)} de{' '}
                  <strong className="text-sky-200">{filteredZoneInstances.length}</strong>{' '}
                  Pokémon en{' '}
                  {activeZoneTab === 'box'
                    ? 'Reserva'
                    : activeZoneTab === 'purify'
                      ? 'Cámara de Purificación'
                      : activeZoneTab === 'house'
                        ? 'Casa R3'
                        : 'Cementerio'}
                </p>

                <div className="max-h-80 space-y-1.5 overflow-y-auto pr-1">
                  {filteredZoneInstances.slice(0, visibleLimit).map((inst) => {
                    const isSel = selectedInstance?.uid === inst.uid;
                    const meta = getIndexedSpeciesMeta(inst.species);
                    const canReleaseHere =
                      Boolean(onReleaseInstance) &&
                      (inst.zone !== 'graveyard' ||
                        profile.devModeEnabled ||
                        !profile.nuzlockePermadeath);
                    const isConfirmingRelease = confirmReleaseUid === inst.uid;

                    return (
                      <div
                        key={inst.uid}
                        onClick={() => setSelectedUid(inst.uid)}
                        className={`flex flex-wrap items-center justify-between gap-2 rounded-xl border px-2.5 py-2 transition cursor-pointer ${
                          isSel
                            ? 'border-amber-400 bg-amber-500/10'
                            : inst.zone === 'graveyard'
                              ? 'border-rose-500/30 bg-rose-950/20 opacity-90'
                              : 'border-slate-800 bg-slate-950/85 hover:border-slate-600'
                        }`}
                      >
                        <div className="flex min-w-0 flex-1 items-center gap-2">
                          <span className="w-12 shrink-0 rounded bg-slate-900 px-1 py-0.5 text-center font-mono-code text-[9px] font-bold text-sky-300">
                            {meta.tierBand}
                          </span>
                          <div
                            className={
                              inst.zone === 'graveyard' ? 'grayscale opacity-65' : ''
                            }
                          >
                            <PokemonIcon species={inst.species} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-1">
                              <span className="truncate text-xs font-bold text-white">
                                {inst.shiny ? '✨ ' : ''}
                                {inst.nickname
                                  ? `${inst.nickname} (${inst.species})`
                                  : inst.species}
                                {inst.gender === 'M' ? (
                                  <span className="ml-0.5 text-sky-400">♂</span>
                                ) : inst.gender === 'F' ? (
                                  <span className="ml-0.5 text-pink-400">♀</span>
                                ) : null}
                              </span>
                              {meta.types.map((t) => (
                                <span
                                  key={t}
                                  className={`rounded border px-1 py-0.2 text-[8.5px] font-bold uppercase ${getTypeBadgeClass(t)}`}
                                >
                                  {t}
                                </span>
                              ))}
                              {inst.zone === 'house' && (
                                <Heart className="h-3 w-3 shrink-0 fill-fuchsia-400 text-fuchsia-400" />
                              )}
                              {inst.isShadow && (
                                <span className="rounded border border-fuchsia-400/60 bg-fuchsia-950/85 px-1.5 py-0.2 text-[8.5px] font-extrabold text-fuchsia-200">
                                  🟣 OSCURO · Corazón {inst.heartGauge ?? 100}%
                                </span>
                              )}
                              {!inst.isShadow && isInstanceHighBond(inst) && (
                                <span className="rounded border border-pink-400/45 bg-pink-500/15 px-1 py-0.2 text-[8.5px] font-bold text-pink-200">
                                  💖 Vínculo
                                </span>
                              )}
                            </div>
                            {inst.isShadow && (
                              <div className="mt-1 flex max-w-xs items-center gap-1.5">
                                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-800">
                                  <div
                                    className={`h-full transition-all ${
                                      (inst.heartGauge ?? 100) <= 0
                                        ? 'bg-emerald-400'
                                        : 'bg-gradient-to-r from-fuchsia-500 to-purple-400'
                                    }`}
                                    style={{ width: `${Math.max(4, inst.heartGauge ?? 100)}%` }}
                                  />
                                </div>
                                <span className="font-mono-code text-[9px] font-bold text-fuchsia-200">
                                  {(inst.heartGauge ?? 100) <= 0
                                    ? '¡Listo para purificar (opcional)!'
                                    : `Corazón ${inst.heartGauge ?? 100}%`}
                                </span>
                              </div>
                            )}
                            <p className="truncate text-[10px] text-amber-300/85">
                              {inst.ability} · {inst.item ? `@ ${inst.item}` : 'Sin objeto'} ·{' '}
                              {inst.moves.slice(0, 3).join(', ')}
                            </p>
                            {inst.epitaph && (
                              <p className="mt-0.5 text-[9.5px] italic text-rose-300/90">
                                💀 T{inst.epitaph.turn} ·{' '}
                                {inst.epitaph.killerSpecies
                                  ? `${inst.epitaph.killerSpecies} (${inst.epitaph.killerMove || 'KO'})`
                                  : inst.epitaph.rivalName}{' '}
                                · {inst.epitaph.chapterTitle}
                              </p>
                            )}
                          </div>
                        </div>

                        {renderStatsLine(inst.species)}

                        <div
                          className="flex shrink-0 items-center gap-1"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {inst.isShadow && inst.zone !== 'purify' && inst.zone !== 'graveyard' && (
                            <button
                              type="button"
                              title="Enviar a la Cámara de Purificación para abrir su Medidor de Corazón pasivamente"
                              onClick={() => {
                                const res = onMoveInstanceZone(inst.uid, 'purify');
                                emitNotice(
                                  res.ok
                                    ? {
                                        tone: 'ok',
                                        text: `🟣 ${inst.nickname || inst.species} enviado a la Cámara de Purificación (-20% Corazón por combate).`,
                                      }
                                    : { tone: 'err', text: res.error || '' }
                                );
                              }}
                              className="rounded-lg border border-fuchsia-400/50 bg-fuchsia-500/20 px-2 py-1 text-[10px] font-extrabold text-fuchsia-100 hover:bg-fuchsia-500/35 cursor-pointer"
                            >
                              🟣 Cámara
                            </button>
                          )}
                          {inst.isShadow &&
                            onPurifyInstance &&
                            ((inst.heartGauge ?? 100) <= 0 || profile.devModeEnabled) && (
                              <button
                                type="button"
                                title="Purificación opcional: quita Modo Hiper, activa Vínculo Alto y otorga ataque exclusivo (o déjalo Oscuro para conservar sus ataques Shadow!)"
                                onClick={() => {
                                  const res = onPurifyInstance(inst.uid);
                                  emitNotice(
                                    res.ok
                                      ? {
                                          tone: 'ok',
                                          text: `✨ ¡${res.species} purificado con éxito! Regalo exclusivo: ${res.signatureGift}. ¡Ahora activa Poder de la Amistad!`,
                                        }
                                      : { tone: 'err', text: res.error || '' }
                                  );
                                }}
                                className="rounded-lg bg-gradient-to-r from-emerald-400 to-cyan-400 px-2 py-1 text-[10px] font-black text-slate-950 shadow hover:brightness-110 cursor-pointer"
                              >
                                ✨ Purificar
                              </button>
                            )}
                          {inst.zone !== 'graveyard' && (
                            <button
                              type="button"
                              onClick={() => {
                                const res = onMoveInstanceZone(inst.uid, 'party');
                                emitNotice(
                                  res.ok
                                    ? {
                                        tone: 'ok',
                                        text: `↑ ${inst.nickname || inst.species} subió a tu Equipo Activo.`,
                                      }
                                    : { tone: 'err', text: res.error || '' }
                                );
                              }}
                              className="inline-flex items-center gap-0.5 rounded-lg bg-amber-500/20 px-2 py-1 text-[10px] font-extrabold text-amber-200 hover:bg-amber-500/35 cursor-pointer"
                            >
                              <ArrowUpFromLine className="h-3 w-3" />
                              Equipo
                            </button>
                          )}

                          {canReleaseHere &&
                            (isConfirmingRelease ? (
                              <div className="inline-flex items-center gap-1 rounded-lg border border-rose-400/60 bg-rose-950 px-1.5 py-0.5">
                                <button
                                  type="button"
                                  onClick={() => {
                                    const res = onReleaseInstance!(inst.uid);
                                    setConfirmReleaseUid(null);
                                    emitNotice(
                                      res.ok
                                        ? {
                                            tone: 'ok',
                                            text: `🕊️ ${res.releasedSpecies ?? inst.species} fue liberado.`,
                                          }
                                        : { tone: 'err', text: res.error || '' }
                                    );
                                  }}
                                  className="rounded bg-rose-500 px-1.5 py-0.5 text-[9.5px] font-extrabold text-white cursor-pointer"
                                >
                                  Sí
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setConfirmReleaseUid(null)}
                                  className="text-[9.5px] text-slate-300 hover:text-white cursor-pointer"
                                >
                                  No
                                </button>
                              </div>
                            ) : (
                              <button
                                type="button"
                                title="Liberar / eliminar Pokémon"
                                onClick={() => setConfirmReleaseUid(inst.uid)}
                                className="rounded-lg border border-rose-500/30 bg-rose-950/30 p-1 text-rose-300 hover:border-rose-400 hover:bg-rose-500/20 cursor-pointer"
                              >
                                <Trash2 className="h-3 w-3" />
                              </button>
                            ))}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {filteredZoneInstances.length > visibleLimit && (
                  <button
                    type="button"
                    onClick={() => setVisibleLimit((v) => v + PAGE_SIZE)}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 py-1.5 text-xs font-bold text-slate-300 hover:border-amber-400/50 hover:text-amber-200 cursor-pointer"
                  >
                    Mostrar +{PAGE_SIZE} más ({filteredZoneInstances.length - visibleLimit} restantes)
                  </button>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
