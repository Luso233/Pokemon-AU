import React, { useMemo, useState } from 'react';
import { Teams } from '@pkmn/sim';
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Code2,
  Crown,
  Edit3,
  Eye,
  EyeOff,
  GitBranch,
  HelpCircle,
  RotateCcw,
  Shield,
  Swords,
} from 'lucide-react';
import type { ResolvedBattleConfig } from '../types/game';
import { PokemonIcon } from './PokemonSprite';

interface TeambuilderBriefingProps {
  config: ResolvedBattleConfig;
  onReplayVN: () => void;
  onLaunchBattle: (finalConfig: ResolvedBattleConfig) => void;
}

export const TeambuilderBriefing: React.FC<TeambuilderBriefingProps> = ({
  config,
  onReplayVN,
  onLaunchBattle,
}) => {
  const [playerPaste, setPlayerPaste] = useState(config.playerShowdownPaste);
  const [rivalPaste, setRivalPaste] = useState(config.rivalShowdownPaste);
  const [editMode, setEditMode] = useState(false);
  const [showRivalDebugPaste, setShowRivalDebugPaste] = useState(false);

  const parsedPlayer = useMemo(() => {
    try {
      return Teams.import(playerPaste) ?? [];
    } catch {
      return [];
    }
  }, [playerPaste]);

  const parsedRival = useMemo(() => {
    try {
      return Teams.import(rivalPaste) ?? [];
    } catch {
      return [];
    }
  }, [rivalPaste]);

  const isValid = parsedPlayer.length > 0 && parsedRival.length > 0;
  const intel = config.rivalIntel;
  const visibleCount = Math.min(intel.visibleSpeciesCount, parsedRival.length);
  const hiddenCount = Math.max(0, parsedRival.length - visibleCount);

  const handleResetPastes = () => {
    setPlayerPaste(config.playerShowdownPaste);
    setRivalPaste(config.rivalShowdownPaste);
  };

  const handleStart = () => {
    if (!isValid) return;
    onLaunchBattle({
      ...config,
      playerShowdownPaste: playerPaste,
      rivalShowdownPaste: rivalPaste,
    });
  };

  return (
    <div className="min-h-screen bg-[#060a14] text-slate-100">
      <div className="mx-auto max-w-6xl px-5 py-8">
        {/* Header */}
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-6">
          <div className="flex items-center gap-4">
            <button
              onClick={onReplayVN}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-3.5 py-2 text-xs font-semibold text-slate-300 transition hover:border-amber-400/50 hover:text-white cursor-pointer"
            >
              <ArrowLeft className="h-4 w-4" />
              Rejugar Decisiones
            </button>
            <div>
              <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.2em] text-sky-400">
                <GitBranch className="h-3.5 w-3.5" />
                Árbol de Decisiones → Inyección Teambuilder Showdown
              </p>
              <h1 className="font-display text-2xl font-bold text-white sm:text-3xl">
                Briefing Táctico Pre-Combate
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setEditMode((v) => !v)}
              className={`inline-flex items-center gap-1.5 rounded-xl border px-3.5 py-2 text-xs font-semibold transition cursor-pointer ${
                editMode
                  ? 'border-amber-400/60 bg-amber-500/20 text-amber-200'
                  : 'border-slate-700 bg-slate-900 text-slate-300 hover:border-amber-400/40'
              }`}
            >
              <Edit3 className="h-3.5 w-3.5" />
              {editMode ? 'Editando Tu Paste' : 'Editar Tu Paste'}
            </button>

            {editMode && (
              <button
                onClick={handleResetPastes}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs font-semibold text-slate-300 hover:text-white cursor-pointer"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Restaurar
              </button>
            )}
          </div>
        </div>

        {/* Decision Tree Traces */}
        <section className="mb-8">
          <h2 className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-amber-300">
            <GitBranch className="h-4 w-4" />
            Ramas Evaluadas desde Ink
          </h2>
          <div className="grid gap-4 md:grid-cols-3">
            {config.traces.map((trace) => {
              const badgeColor =
                trace.category === 'player-set'
                  ? 'border-amber-400/35 bg-amber-500/15 text-amber-200'
                  : trace.category === 'player-roster'
                    ? 'border-sky-400/35 bg-sky-500/15 text-sky-200'
                    : 'border-rose-400/35 bg-rose-500/15 text-rose-200';

              const catLabel =
                trace.category === 'player-set'
                  ? 'Set (Atk vs SpA)'
                  : trace.category === 'player-roster'
                    ? 'Tu Equipo'
                    : 'Inteligencia Rival';

              return (
                <div
                  key={trace.id}
                  className="rounded-2xl border border-slate-800 bg-slate-900/75 p-4"
                >
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <span
                      className={`rounded-md border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${badgeColor}`}
                    >
                      {catLabel}
                    </span>
                    <span className="font-mono-code text-[11px] text-slate-400">
                      {trace.flagKey}="{trace.flagValue}"
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">
                    Decisión:{' '}
                    <span className="text-slate-200">{trace.choiceLabel}</span>
                  </p>
                  <p className="mt-2 text-sm font-bold text-white">
                    {trace.effectTitle}
                  </p>
                  <p className="mt-1 text-xs leading-relaxed text-slate-400">
                    {trace.effectDetail}
                  </p>
                </div>
              );
            })}
          </div>
        </section>

        {/* Side-by-Side: Player Teambuilder vs Rival Fog-of-War Intel */}
        <section className="mb-8 grid gap-6 lg:grid-cols-2">
          {/* Player Team (Full Visibility & Editable Paste) */}
          <div className="rounded-3xl border border-amber-400/25 bg-slate-900/75 p-5">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-amber-400" />
                <h3 className="font-display text-lg font-bold text-white">
                  {config.playerName}
                </h3>
              </div>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-xs font-semibold text-emerald-300">
                <CheckCircle2 className="h-3.5 w-3.5" />
                {parsedPlayer.length} Pokémon listos
              </span>
            </div>

            <div className="mb-4 flex flex-wrap gap-2">
              {parsedPlayer.map((set, i) => (
                <div
                  key={`${set.species}-${i}`}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700/80 bg-slate-950/90 px-2.5 py-1 text-xs"
                >
                  <PokemonIcon species={set.species} />
                  <div>
                    <p className="font-semibold text-white">
                      {set.name && set.name !== set.species
                        ? `${set.name} (${set.species})`
                        : set.species}
                    </p>
                    <p className="text-[10px] text-amber-300/80">
                      Nv.{set.level ?? 100} · {set.item || 'Sin objeto'}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mb-1.5 flex items-center justify-between text-[11px] text-slate-400">
              <span className="inline-flex items-center gap-1 font-mono-code text-amber-300/90">
                <Code2 className="h-3.5 w-3.5" />
                player_team.showdown
              </span>
              <span>Teams.import() → Teams.pack()</span>
            </div>
            <textarea
              value={playerPaste}
              onChange={(e) => setPlayerPaste(e.target.value)}
              readOnly={!editMode}
              rows={11}
              className={`font-mono-code w-full rounded-2xl border bg-black/60 p-3.5 text-xs leading-relaxed text-slate-200 focus:outline-none ${
                editMode
                  ? 'border-amber-400/60 focus:border-amber-400'
                  : 'border-slate-800 cursor-default'
              }`}
            />
          </div>

          {/* Rival Team (Fog of War Intel — Species Only / Partial Roster!) */}
          <div className="flex flex-col justify-between rounded-3xl border border-rose-400/25 bg-slate-900/75 p-5">
            <div>
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Swords className="h-4 w-4 text-rose-400" />
                  <h3 className="font-display text-lg font-bold text-white">
                    {config.rivalName}
                  </h3>
                </div>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-rose-400/30 bg-rose-500/15 px-2.5 py-0.5 text-[11px] font-semibold text-rose-200">
                  <EyeOff className="h-3 w-3" />
                  {intel.intelLabel}
                </span>
              </div>

              <p className="mb-4 rounded-xl border border-slate-800 bg-slate-950/75 px-3.5 py-2.5 text-xs leading-relaxed text-slate-300">
                {intel.intelNote}
              </p>

              {/* Species-Only Intel Grid (NO level, NO item, NO moveset!) */}
              <div className="mb-4 grid grid-cols-2 gap-2.5 sm:grid-cols-3">
                {parsedRival.slice(0, visibleCount).map((set, i) => (
                  <div
                    key={`visible-rival-${set.species}-${i}`}
                    className="flex items-center gap-2 rounded-2xl border border-slate-700/80 bg-slate-950/90 px-3 py-2.5"
                  >
                    <PokemonIcon species={set.species} />
                    <div className="min-w-0">
                      <p className="truncate text-xs font-bold text-white">
                        {set.species}
                      </p>
                      <p className="text-[10px] text-slate-400">
                        Nv. ??? · Set oculto
                      </p>
                    </div>
                  </div>
                ))}

                {Array.from({ length: hiddenCount }).map((_, idx) => (
                  <div
                    key={`hidden-rival-${idx}`}
                    className="flex items-center gap-2.5 rounded-2xl border border-dashed border-rose-500/30 bg-slate-950/60 px-3 py-2.5"
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-rose-400/30 bg-rose-950/50 text-rose-300/70">
                      <HelpCircle className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-xs font-bold text-rose-200/80">
                        ???
                      </p>
                      <p className="text-[10px] text-slate-500">
                        Sin inteligencia
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Boss Ace / Level Cap Warning */}
              {intel.hasBossAce && (
                <div className="mb-4 rounded-2xl border border-amber-400/30 bg-amber-500/10 p-3.5">
                  <div className="flex items-center gap-2 text-xs font-bold text-amber-200">
                    <Crown className="h-4 w-4 text-amber-400" />
                    <span>
                      Alerta de Ace · Límite estándar del capítulo: Nv.{' '}
                      {intel.levelCap}
                    </span>
                  </div>
                  {intel.bossAceWarning && (
                    <p className="mt-1 text-xs leading-relaxed text-amber-100/80">
                      {intel.bossAceWarning}
                    </p>
                  )}
                </div>
              )}

              {/* Optional Collapsible Debug Drawer for Rival Paste */}
              {showRivalDebugPaste && (
                <div className="mt-3">
                  <div className="mb-1.5 flex items-center justify-between text-[11px] text-rose-300">
                    <span className="font-mono-code">
                      [DEBUG] rival_team.showdown
                    </span>
                    <span>Formato: {config.formatId}</span>
                  </div>
                  <textarea
                    value={rivalPaste}
                    onChange={(e) => setRivalPaste(e.target.value)}
                    rows={8}
                    className="font-mono-code w-full rounded-2xl border border-rose-400/40 bg-black/70 p-3 text-xs leading-relaxed text-slate-200 focus:border-rose-400 focus:outline-none"
                  />
                </div>
              )}
            </div>

            <div className="mt-4 flex items-center justify-between border-t border-slate-800/80 pt-3">
              <span className="text-[11px] text-slate-500">
                Fog of War activo: los sets rivales se descubren peleando.
              </span>
              <button
                onClick={() => setShowRivalDebugPaste((v) => !v)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700/80 bg-slate-950 px-2.5 py-1 text-[11px] font-medium text-slate-400 transition hover:border-rose-400/40 hover:text-rose-200 cursor-pointer"
              >
                {showRivalDebugPaste ? (
                  <>
                    <EyeOff className="h-3 w-3" />
                    Ocultar Debug
                  </>
                ) : (
                  <>
                    <Eye className="h-3 w-3" />
                    Debug Paste Rival
                  </>
                )}
              </button>
            </div>
          </div>
        </section>

        {/* Launch CTA */}
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-slate-800 bg-slate-900/90 p-5">
          <div>
            {!isValid ? (
              <p className="flex items-center gap-2 text-sm font-semibold text-rose-400">
                <AlertTriangle className="h-4 w-4" />
                Ambos equipos deben contener al menos 1 Pokémon válido.
              </p>
            ) : (
              <div>
                <p className="text-sm font-bold text-white">
                  Listo para inyectar en{' '}
                  <code className="text-sky-300">@pkmn/sim</code> (
                  {config.format === 'doubles'
                    ? 'Combate Doble 2v2'
                    : 'Combate Individual'}
                  )
                </p>
                <p className="text-xs text-slate-400">
                  {config.playerTeamSummary} vs {config.rivalTeamSummary}
                </p>
              </div>
            )}
          </div>

          <button
            disabled={!isValid}
            onClick={handleStart}
            className="inline-flex items-center gap-2.5 rounded-2xl bg-gradient-to-r from-amber-500 to-yellow-500 px-7 py-3.5 text-sm font-extrabold text-slate-950 shadow-xl shadow-amber-500/25 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40 active:scale-[0.98] cursor-pointer"
          >
            <Swords className="h-4 w-4" />
            Inyectar Equipos e Iniciar Combate
          </button>
        </div>
      </div>
    </div>
  );
};
