import React, { useMemo, useState } from 'react';
import { Dex, Teams } from '@pkmn/sim';
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  ClipboardList,
  Code2,
  Cpu,
  Crown,
  Edit3,
  Eye,
  EyeOff,
  GitBranch,
  HelpCircle,
  RotateCcw,
  Swords,
} from 'lucide-react';
import type { OpenTeamsheetEntry, ResolvedBattleConfig } from '../types/game';
import { CharacterPortrait } from './CharacterPortrait';
import { OpenTeamsheetModal } from './OpenTeamsheetModal';
import { PokemonIcon } from './PokemonSprite';
import { RivalPortraitTooltip } from './RivalPortraitTooltip';

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
  const [showTeamsheet, setShowTeamsheet] = useState(false);

  const buildSheet = (sets: ReturnType<typeof Teams.import>): OpenTeamsheetEntry[] =>
    (sets ?? []).map((s) => {
      const sp = Dex.species.get(s.species);
      return {
        species: sp.exists ? sp.name : s.species,
        level: s.level || (config.formatId === 'gen9vgc2024regg' ? 50 : 100),
        item: s.item || 'Ninguno',
        ability: s.ability || sp.abilities?.[0] || '—',
        teraType: s.teraType || sp.types?.[0] || 'Normal',
        moves: s.moves || [],
        types: sp.types ? [...sp.types] : ['Normal'],
      };
    });

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
        <div className="mb-7 flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-5">
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
                Árbol de Decisiones → Teambuilder & IA Scripteada
              </p>
              <h1 className="font-display text-2xl font-bold text-white sm:text-3xl">
                Briefing Táctico Pre-Combate
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {config.openTeamsheet && (
              <button
                onClick={() => setShowTeamsheet(true)}
                className="inline-flex items-center gap-1.5 rounded-xl border border-sky-400/50 bg-sky-500/20 px-3.5 py-2 text-xs font-bold text-sky-100 transition hover:bg-sky-500/30 cursor-pointer"
              >
                <ClipboardList className="h-3.5 w-3.5" />
                Ver Open Teamsheet
              </button>
            )}

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
        <section className="mb-7">
          <h2 className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-amber-300">
            <GitBranch className="h-4 w-4" />
            Impacto de tus Decisiones en la Persecución
          </h2>
          <div className="grid gap-3.5 md:grid-cols-2 lg:grid-cols-4">
            {config.traces.map((trace) => {
              const badgeColor =
                trace.category === 'player-set'
                  ? 'border-amber-400/35 bg-amber-500/15 text-amber-200'
                  : trace.category === 'player-roster'
                    ? 'border-sky-400/35 bg-sky-500/15 text-sky-200'
                    : trace.category === 'ai-script'
                      ? 'border-violet-400/35 bg-violet-500/15 text-violet-200'
                      : 'border-rose-400/35 bg-rose-500/15 text-rose-200';

              const catLabel =
                trace.category === 'player-set'
                  ? 'Sets Príncipe'
                  : trace.category === 'player-roster'
                    ? 'Tu Orden/Lead'
                    : trace.category === 'ai-script'
                      ? 'IA Scripteada'
                      : 'Sabotaje / Rival';

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
                    <span className="font-mono-code truncate text-[10px] text-slate-500">
                      {trace.flagValue}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    {trace.choiceLabel}
                  </p>
                  <p className="mt-1.5 text-sm font-bold text-white">
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
        <section className="mb-7 grid gap-6 lg:grid-cols-2">
          {/* Player Team */}
          <div className="rounded-3xl border border-amber-400/25 bg-slate-900/75 p-5">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-11 w-11 overflow-hidden rounded-xl border border-amber-400/45 bg-slate-950 p-0.5">
                  <CharacterPortrait
                    charId={config.playerCharId}
                    variant="bust"
                    className="h-full w-full object-cover object-top"
                  />
                </div>
                <div>
                  <h3 className="font-display text-lg font-bold text-white">
                    {config.playerName}
                  </h3>
                  <p className="text-[11px] text-amber-300/80">
                    {config.playerTeamSummary}
                  </p>
                </div>
              </div>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-xs font-semibold text-emerald-300">
                <CheckCircle2 className="h-3.5 w-3.5" />
                {parsedPlayer.length} listos
              </span>
            </div>

            <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
              {parsedPlayer.map((set, i) => (
                <div
                  key={`${set.species}-${i}`}
                  className="flex items-center gap-1.5 rounded-xl border border-slate-700/80 bg-slate-950/90 px-2.5 py-1.5 text-xs"
                >
                  <PokemonIcon species={set.species} className="scale-90" />
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-white">
                      {set.species}
                    </p>
                    <p className="truncate text-[10px] text-amber-300/80">
                      {i < 2 ? 'Lead · ' : ''}
                      {set.item || 'Sin obj.'}
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

          {/* Rival Team (Fog of War Intel + Scripted AI Intel) */}
          <div className="flex flex-col justify-between rounded-3xl border border-rose-400/25 bg-slate-900/75 p-5">
            <div>
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-3">
                  {config.rivalProfile ? (
                    <RivalPortraitTooltip
                      profile={config.rivalProfile}
                      charId={config.rivalCharId}
                      placement="bottom"
                    >
                      <button
                        type="button"
                        className="h-11 w-11 overflow-hidden rounded-xl border-2 border-rose-500/60 bg-slate-950 p-0.5 transition hover:border-amber-300 cursor-help"
                      >
                        <CharacterPortrait
                          charId={config.rivalCharId}
                          variant="bust"
                          className="h-full w-full object-cover object-top"
                        />
                      </button>
                    </RivalPortraitTooltip>
                  ) : (
                    <div className="h-11 w-11 overflow-hidden rounded-xl border border-rose-500/45 bg-slate-950 p-0.5">
                      <CharacterPortrait
                        charId={config.rivalCharId}
                        variant="bust"
                        className="h-full w-full object-cover object-top"
                      />
                    </div>
                  )}
                  <div>
                    <h3 className="font-display text-lg font-bold text-white">
                      {config.rivalName}
                    </h3>
                    <p className="text-[11px] text-rose-300/80">
                      {config.rivalTitle}
                    </p>
                  </div>
                </div>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-rose-400/30 bg-rose-500/15 px-2.5 py-0.5 text-[11px] font-semibold text-rose-200">
                  <EyeOff className="h-3 w-3" />
                  {intel.intelLabel}
                </span>
              </div>

              <p className="mb-4 rounded-xl border border-slate-800 bg-slate-950/75 px-3.5 py-2.5 text-xs leading-relaxed text-slate-300">
                {intel.intelNote}
              </p>

              {/* Species-Only Intel Grid */}
              <div className="mb-4 grid grid-cols-2 gap-2.5 sm:grid-cols-3">
                {parsedRival.slice(0, visibleCount).map((set, i) => (
                  <div
                    key={`visible-rival-${set.species}-${i}`}
                    className="flex items-center gap-2 rounded-2xl border border-slate-700/80 bg-slate-950/90 px-2.5 py-2"
                  >
                    <PokemonIcon species={set.species} className="scale-90" />
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
                    className="flex items-center gap-2 rounded-2xl border border-dashed border-rose-500/30 bg-slate-950/60 px-2.5 py-2"
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

              {/* Puzzle Initial Conditions Preview */}
              {config.puzzleConditions && (
                <div className="mb-3.5 rounded-2xl border border-orange-400/35 bg-orange-500/10 p-3.5">
                  <p className="text-xs font-bold text-orange-200">
                    🧩 Condiciones Iniciales del Puzzle (inyectadas al Turno 1)
                  </p>
                  <div className="mt-2 flex flex-wrap gap-1.5 text-[10px]">
                    {config.puzzleConditions.weather && (
                      <span className="rounded border border-amber-400/40 bg-amber-500/20 px-2 py-0.5 font-semibold text-amber-200">
                        Clima: {config.puzzleConditions.weather}
                      </span>
                    )}
                    {config.puzzleConditions.terrain && (
                      <span className="rounded border border-emerald-400/40 bg-emerald-500/20 px-2 py-0.5 font-semibold text-emerald-200">
                        Campo: {config.puzzleConditions.terrain}
                      </span>
                    )}
                    {config.puzzleConditions.sideConditions?.p1?.map((c) => (
                      <span
                        key={`p1-${c}`}
                        className="rounded border border-sky-400/40 bg-sky-500/20 px-2 py-0.5 font-semibold text-sky-200"
                      >
                        Tu lado: {c}
                      </span>
                    ))}
                    {config.puzzleConditions.sideConditions?.p2?.map((c) => (
                      <span
                        key={`p2-${c}`}
                        className="rounded border border-rose-400/40 bg-rose-500/20 px-2 py-0.5 font-semibold text-rose-200"
                      >
                        Rival: {c}
                      </span>
                    ))}
                    {config.puzzleConditions.pokemonModifiers?.map((m, idx) => (
                      <span
                        key={`mod-${idx}`}
                        className="rounded border border-slate-700 bg-slate-900/90 px-2 py-0.5 font-semibold text-slate-200"
                      >
                        {m.slotOrSpecies}
                        {m.hpPercent ? ` (${m.hpPercent}% PS)` : ''}
                        {m.boosts
                          ? ` [${Object.entries(m.boosts)
                              .map(([k, v]) => `${(v ?? 0) > 0 ? `+${v}` : v} ${k}`)
                              .join(', ')}]`
                          : ''}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Scripted AI Pattern Intel */}
              {intel.aiScriptHint && (
                <div className="mb-3.5 rounded-2xl border border-violet-400/30 bg-violet-500/10 p-3.5">
                  <div className="flex items-center gap-2 text-xs font-bold text-violet-200">
                    <Cpu className="h-4 w-4 text-violet-400" />
                    <span>
                      Perfil de IA Scripteada ({config.scriptedEnemyRules.length}{' '}
                      reglas activas)
                    </span>
                  </div>
                  <p className="mt-1 text-xs leading-relaxed text-violet-100/85">
                    {intel.aiScriptHint}
                  </p>
                </div>
              )}

              {/* Boss Ace Warning */}
              {intel.hasBossAce && (
                <div className="mb-3.5 rounded-2xl border border-amber-400/30 bg-amber-500/10 p-3.5">
                  <div className="flex items-center gap-2 text-xs font-bold text-amber-200">
                    <Crown className="h-4 w-4 text-amber-400" />
                    <span>
                      Alerta de Ace · Cap estándar: Nv. {intel.levelCap}
                    </span>
                  </div>
                  {intel.bossAceWarning && (
                    <p className="mt-1 text-xs leading-relaxed text-amber-100/80">
                      {intel.bossAceWarning}
                    </p>
                  )}
                </div>
              )}

              {/* Optional Collapsible Debug Drawer */}
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

      <OpenTeamsheetModal
        open={showTeamsheet}
        onClose={() => setShowTeamsheet(false)}
        formatLabel={config.formatLabel ?? config.formatId}
        playerName={config.playerName}
        rivalName={config.rivalName}
        playerSheet={buildSheet(parsedPlayer)}
        rivalSheet={buildSheet(parsedRival)}
      />
    </div>
  );
};
