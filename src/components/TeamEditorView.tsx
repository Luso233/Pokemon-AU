import React from 'react';
import {
  ArrowLeft,
  Coins,
  ShieldAlert,
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
                PC de Supervivencia · Instancias Únicas · Editor Unificado (Sin MTs)
              </p>
              <h1 className="font-display text-2xl font-bold text-white sm:text-3xl">
                Gestor de Cajas &amp; Equipo
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

        {/* Use PC Team in Story Toggle */}
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-sky-400/30 bg-sky-500/10 px-4 py-3">
          <div className="space-y-0.5">
            <p className="flex items-center gap-1.5 text-xs font-extrabold text-sky-100">
              <ShieldAlert className="h-3.5 w-3.5 text-amber-300" />
              Tip: también puedes abrir estas mismas Cajas PC directamente dentro del Briefing de combate
            </p>
            <p className="text-[11px] text-slate-300">
              Cada individuo conserva su estado Ironman (la Caja no cura) y los slots de movimiento desbloqueados abren todo el learnset legal en @pkmn/sim.
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
