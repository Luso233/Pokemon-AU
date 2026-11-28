import React from 'react';
import {
  ArrowLeft,
  Coins,
  ShoppingBag,
  Sparkles,
} from 'lucide-react';
import { MAX_SHINY_CHARMS } from '../data/economyCatalog';
import type {
  OwnedPokemonInstance,
  PlayerSaveProfile,
  PokemonStorageZone,
  SavedCampaignTeam,
} from '../types/game';
import { HelpTip } from './HelpTip';
import { PcBoxManager } from './PcBoxManager';

interface TeamEditorViewProps {
  profile: PlayerSaveProfile;
  onBackHome: () => void;
  onOpenShop: () => void;
  onMoveInstanceZone: (
    uid: string,
    targetZone: Exclude<PokemonStorageZone, 'graveyard'>
  ) => { ok: boolean; error?: string };
  onReleaseInstance: (
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
  onSpawnDevSpecimen: (
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
  onPopulateLivingDexBox: () => { addedCount: number; totalLiving: number };
  onImportShowdownPaste: (
    rawPaste: string
  ) => { ok: boolean; error?: string; importedCount: number };
  onSaveCampaignTeam: (
    name: string
  ) => { ok: boolean; error?: string; team?: SavedCampaignTeam };
  onLoadCampaignTeam: (
    teamId: string,
    allowSpawnMissing?: boolean
  ) => {
    ok: boolean;
    error?: string;
    loadedCount: number;
    missingSpecies: string[];
  };
  onDeleteCampaignTeam: (teamId: string) => void;
  onToggleUseCustomTeam: (enabled: boolean) => void;
}

/**
 * Standalone full-page wrapper around the reusable <PcBoxManager /> component.
 * Players can ALSO use the exact same <PcBoxManager /> directly inside TeambuilderBriefing
 * without leaving the pre-battle Rival Sighting screen!
 */
export const TeamEditorView: React.FC<TeamEditorViewProps> = ({
  profile,
  onBackHome,
  onOpenShop,
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
  onToggleUseCustomTeam,
}) => {
  const activeShinies = profile.pokemonBox.filter(
    (b) => b.zone !== 'graveyard' && b.shiny
  ).length;
  const maxShinies = Math.min(MAX_SHINY_CHARMS, profile.inventory.shinyCharms);

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#060a14] text-slate-100">
      <div className="mx-auto max-w-6xl px-3 py-4 sm:px-5 sm:py-6">
        {/* Compact Responsive Header */}
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2.5 border-b border-slate-800 pb-3.5">
          <div className="flex min-w-0 items-center gap-2.5">
            <button
              onClick={onBackHome}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs font-semibold text-slate-300 transition hover:border-amber-400/50 hover:text-white cursor-pointer"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Inicio</span>
            </button>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <h1 className="truncate font-display text-lg font-bold text-white sm:text-2xl">
                  Cajas PC &amp; Equipo
                </h1>
                <HelpTip title="PC de Supervivencia" badge="Reglas">
                  <p>
                    Cada Pokémon es una instancia única que conserva su estado Ironman (la Caja <strong>no cura</strong>).
                  </p>
                  <p>
                    Desbloquear slots de movimiento abre el learnset legal completo en <code>@pkmn/sim</code> sin MTs. También puedes abrir estas mismas Cajas directamente dentro del Briefing de combate.
                  </p>
                </HelpTip>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            <button
              type="button"
              onClick={() => onToggleUseCustomTeam(!profile.useCustomTeamInStory)}
              className={`rounded-xl border px-2.5 py-1.5 text-[11px] font-extrabold transition cursor-pointer ${
                profile.useCustomTeamInStory
                  ? 'border-emerald-400 bg-emerald-500/25 text-emerald-100'
                  : 'border-slate-700 bg-slate-900 text-slate-300 hover:border-sky-400/50'
              }`}
            >
              {profile.useCustomTeamInStory ? '✓ PC en Campaña' : 'Usar PC en Campaña'}
            </button>
            <div className="inline-flex items-center gap-1 rounded-xl border border-fuchsia-400/40 bg-fuchsia-500/15 px-2.5 py-1.5 text-[11px] font-bold text-fuchsia-200">
              <Sparkles className="h-3.5 w-3.5 text-fuchsia-300" />
              {activeShinies}/{maxShinies}
            </div>
            <div className="inline-flex items-center gap-1 rounded-xl border border-amber-400/40 bg-amber-500/10 px-2.5 py-1.5 font-mono-code text-[11px] font-bold text-amber-200">
              <Coins className="h-3.5 w-3.5 text-amber-400" />
              {profile.coins.toLocaleString()}
            </div>
            <button
              onClick={onOpenShop}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-900 px-2.5 py-1.5 text-[11px] font-bold text-slate-200 hover:border-amber-400/50 cursor-pointer"
            >
              <ShoppingBag className="h-3.5 w-3.5 text-amber-300" />
              Tienda
            </button>
          </div>
        </div>

        <PcBoxManager
          profile={profile}
          onMoveInstanceZone={onMoveInstanceZone}
          onReleaseInstance={onReleaseInstance}
          onEquipInstanceItem={onEquipInstanceItem}
          onUpdateInstanceBuild={onUpdateInstanceBuild}
          onUnlockMoveSlot={onUnlockMoveSlot}
          onSpawnDevSpecimen={onSpawnDevSpecimen}
          onSpawnDevShadowSpecimen={onSpawnDevShadowSpecimen}
          onPurifyInstance={onPurifyInstance}
          onAssignShadowToChamber={onAssignShadowToChamber}
          onAssignRingPokemonToChamber={onAssignRingPokemonToChamber}
          onAutoOptimizeChamber={onAutoOptimizeChamber}
          onPopulateLivingDexBox={onPopulateLivingDexBox}
          onImportShowdownPaste={onImportShowdownPaste}
          onSaveCampaignTeam={onSaveCampaignTeam}
          onLoadCampaignTeam={onLoadCampaignTeam}
          onDeleteCampaignTeam={onDeleteCampaignTeam}
          onOpenShop={onOpenShop}
        />
      </div>
    </div>
  );
};
