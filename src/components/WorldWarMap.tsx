import React, { useMemo, useState } from 'react';
import { geoGraticule10, geoNaturalEarth1, geoPath } from 'd3-geo';
import { feature, merge } from 'topojson-client';
import type { GeometryCollection, Topology } from 'topojson-specification';
import worldAtlasRaw from 'world-atlas/countries-110m.json';
import {
  Compass,
  Crown,
  Crosshair,
  Globe2,
  Layers,
  Lock,
  MapPin,
  Play,
  RotateCcw,
  Sparkles,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import {
  BLOC_BY_ID,
  CHAPTER_MAP_LOCATIONS,
  FACTION_KIND_META,
  ISO_TO_BLOC,
  WORLD_BLOCS,
  ZOOM_LANDMARKS,
  type WorldBlocDefinition,
  type WorldBlocId,
} from '../data/worldGeopolitics';
import type { ChapterDefinition } from '../types/game';

export type MapLensMode = 'regions' | 'empires';

interface WorldWarMapProps {
  chapters: ChapterDefinition[];
  hoveredChapterId: string | null;
  onHoverChapterPin: (chapterId: string | null) => void;
  onFocusChapterCard: (chapterId: string) => void;
  onLaunchChapter: (chapter: ChapterDefinition) => void;
  unlockedChapterIds: Set<string>;
  completedChapterIds: Set<string>;
}

const MAP_WIDTH = 960;
const MAP_HEIGHT = 480;

interface CountryPathItem {
  key: string;
  isoId: string;
  name: string;
  d: string;
  bloc: WorldBlocDefinition | null;
}

interface BlocFrontierItem {
  bloc: WorldBlocDefinition;
  d: string;
}

interface AlolaIslandItem {
  name: string;
  cx: number;
  cy: number;
  r: number;
}

const ALOLA_ISLANDS_GEO: Array<{ name: string; coords: [number, number]; r: number }> = [
  { name: 'Melemele (Oahu / Honolulu)', coords: [-157.85, 21.31], r: 3.1 },
  { name: 'Akala (Maui)', coords: [-156.33, 20.8], r: 2.5 },
  { name: 'Ula-Ula (Hawái)', coords: [-155.55, 19.6], r: 3.8 },
  { name: 'Poni (Kauai)', coords: [-159.5, 22.08], r: 2.2 },
];

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

export const WorldWarMap: React.FC<WorldWarMapProps> = ({
  chapters,
  hoveredChapterId,
  onHoverChapterPin,
  onFocusChapterCard,
  onLaunchChapter,
  unlockedChapterIds,
  completedChapterIds,
}) => {
  const [lens, setLens] = useState<MapLensMode>('regions');
  const [selectedBlocId, setSelectedBlocId] = useState<WorldBlocId | null>(null);
  const [hoveredBlocId, setHoveredBlocId] = useState<WorldBlocId | null>(null);
  const [manualZoomDelta, setManualZoomDelta] = useState<number>(0);

  const chapterById = useMemo(() => {
    const map: Record<string, ChapterDefinition> = {};
    for (const ch of chapters) map[ch.id] = ch;
    return map;
  }, [chapters]);

  /* Precompute Natural Earth 110m vector projection + Civilization unified frontiers once */
  const geoBundle = useMemo(() => {
    const topology = worldAtlasRaw as unknown as Topology<{
      countries: GeometryCollection<{ name?: string }>;
    }>;

    const allCountries = feature(topology, topology.objects.countries);
    // Exclude Antarctica (ISO 010) so the inhabited geopolitical map fills the whole War Room canvas
    const inhabitedFeatures = allCountries.features.filter(
      (f) => String(f.id ?? '').padStart(3, '0') !== '010'
    );

    const inhabitedCollection = {
      type: 'FeatureCollection' as const,
      features: inhabitedFeatures,
    };

    const projection = geoNaturalEarth1().fitExtent(
      [
        [14, 16],
        [MAP_WIDTH - 14, MAP_HEIGHT - 16],
      ],
      inhabitedCollection
    );
    const pathGen = geoPath(projection);

    const graticulePath = pathGen(geoGraticule10()) ?? '';

    const countryPaths: CountryPathItem[] = [];
    for (let idx = 0; idx < inhabitedFeatures.length; idx++) {
      const feat = inhabitedFeatures[idx];
      const isoId = String(feat.id ?? '').padStart(3, '0');
      const d = pathGen(feat);
      if (!d) continue;
      countryPaths.push({
        key: `${isoId}-${idx}`,
        isoId,
        name: feat.properties?.name ?? isoId,
        d,
        bloc: ISO_TO_BLOC[isoId] ?? null,
      });
    }

    // Build Civilization-style unified outer borders per geopolitical bloc via topojson.merge
    const blocFrontiers: BlocFrontierItem[] = [];
    const rawGeoms = topology.objects.countries.geometries;
    for (const bloc of WORLD_BLOCS) {
      if (bloc.isoNumericIds.length === 0) continue;
      const isoSet = new Set(bloc.isoNumericIds);
      const matchingGeoms = rawGeoms.filter((g) =>
        isoSet.has(String(g.id ?? '').padStart(3, '0'))
      );
      if (matchingGeoms.length === 0) continue;
      const merged = merge(topology, matchingGeoms as never);
      const d = pathGen(merged);
      if (d) {
        blocFrontiers.push({ bloc, d });
      }
    }

    // Project Alola islands (Hawaii archipelago)
    const alolaIslands: AlolaIslandItem[] = [];
    for (const isl of ALOLA_ISLANDS_GEO) {
      const pt = projection(isl.coords);
      if (pt) {
        alolaIslands.push({ name: isl.name, cx: pt[0], cy: pt[1], r: isl.r });
      }
    }

    const alolaCenter = projection(BLOC_BY_ID.alola.center) ?? [90, 220];

    const projectPoint = (coords: [number, number]): [number, number] => {
      const pt = projection(coords);
      return pt ? [pt[0], pt[1]] : [MAP_WIDTH / 2, MAP_HEIGHT / 2];
    };

    return {
      graticulePath,
      countryPaths,
      blocFrontiers,
      alolaIslands,
      alolaCenter,
      projectPoint,
    };
  }, []);

  // Active camera target priority:
  // 1) Hovered mission card (or hovered map pin) -> crisp smooth zoom straight to narrative location!
  // 2) Selected geopolitical bloc -> focus on that region to read its AU dossier
  // 3) Global World View (zoom = 1)
  const hoveredLocation = hoveredChapterId
    ? CHAPTER_MAP_LOCATIONS[hoveredChapterId] ?? null
    : null;
  const hoveredChapter = hoveredChapterId
    ? chapterById[hoveredChapterId] ?? null
    : null;

  const activeBloc: WorldBlocDefinition | null = hoveredLocation
    ? BLOC_BY_ID[hoveredLocation.blocId]
    : selectedBlocId
      ? BLOC_BY_ID[selectedBlocId]
      : hoveredBlocId
        ? BLOC_BY_ID[hoveredBlocId]
        : null;

  const camera = useMemo(() => {
    let targetCoords: [number, number] | null = null;
    let baseZoom = 1;

    if (hoveredLocation) {
      targetCoords = hoveredLocation.coords;
      baseZoom = hoveredLocation.zoom;
    } else if (selectedBlocId) {
      const bloc = BLOC_BY_ID[selectedBlocId];
      targetCoords = bloc.center;
      baseZoom = bloc.focusZoom;
    }

    const z = clamp(baseZoom + manualZoomDelta, 1, 9);
    if (!targetCoords || z <= 1.01) {
      return { z: 1, tx: 0, ty: 0 };
    }

    const [px, py] = geoBundle.projectPoint(targetCoords);
    const rawTx = MAP_WIDTH / 2 - px * z;
    const rawTy = MAP_HEIGHT / 2 - py * z;
    const tx = clamp(rawTx, MAP_WIDTH - MAP_WIDTH * z, 0);
    const ty = clamp(rawTy, MAP_HEIGHT - MAP_HEIGHT * z, 0);

    return { z, tx, ty };
  }, [geoBundle, hoveredLocation, selectedBlocId, manualZoomDelta]);

  // Inverse scaling factor so markers, reticles & labels stay legible at both 1x and 7.4x zoom
  const invScale = 1 / Math.pow(camera.z, 0.76);
  const strokeScale = 1 / Math.pow(camera.z, 0.65);

  const projectedMissions = useMemo(() => {
    return chapters
      .map((ch) => {
        const loc = CHAPTER_MAP_LOCATIONS[ch.id];
        if (!loc) return null;
        const [x, y] = geoBundle.projectPoint(loc.coords);
        const arcStart = loc.originArcFrom
          ? geoBundle.projectPoint(loc.originArcFrom)
          : null;
        return {
          chapter: ch,
          loc,
          x,
          y,
          arcStart,
          unlocked: unlockedChapterIds.has(ch.id),
          completed: completedChapterIds.has(ch.id),
        };
      })
      .filter((x): x is NonNullable<typeof x> => x !== null);
  }, [chapters, geoBundle, unlockedChapterIds, completedChapterIds]);

  const activeBlocMissions = useMemo(() => {
    if (!activeBloc) return [];
    return projectedMissions.filter((m) => m.loc.blocId === activeBloc.id);
  }, [activeBloc, projectedMissions]);

  const getBlocColors = (bloc: WorldBlocDefinition) =>
    lens === 'empires'
      ? { fill: bloc.empireFill, stroke: bloc.empireStroke }
      : { fill: bloc.regionFill, stroke: bloc.regionStroke };

  const buildArcPath = (from: [number, number], to: [number, number]): string => {
    const midX = (from[0] + to[0]) / 2;
    const dist = Math.hypot(to[0] - from[0], to[1] - from[1]);
    const lift = Math.min(95, dist * 0.28);
    const midY = (from[1] + to[1]) / 2 - lift;
    return `M ${from[0].toFixed(1)} ${from[1].toFixed(1)} Q ${midX.toFixed(1)} ${midY.toFixed(1)} ${to[0].toFixed(1)} ${to[1].toFixed(1)}`;
  };

  return (
    <div className="flex flex-col overflow-hidden rounded-3xl border border-amber-400/25 bg-[#070d1b]/95 shadow-2xl shadow-black/50 backdrop-blur-md">
      {/* Top Cartographic War-Room Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/90 bg-slate-950/75 px-4 py-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl border border-amber-400/40 bg-amber-500/15 text-amber-300">
            <Globe2 className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-display text-sm font-bold tracking-wide text-white">
                Atlas Geopolítico del Mundo Pokémon
              </h2>
              <span className="hidden rounded-md border border-rose-400/35 bg-rose-500/15 px-1.5 py-0.5 text-[9px] font-extrabold uppercase tracking-wider text-rose-200 sm:inline-block">
                Monopolio Ditto
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Pasa el cursor sobre cualquier misión para enfocar el teatro de combate o haz clic en un bloque.
            </p>
          </div>
        </div>

        {/* Civilization Lens Switcher + Camera Controls */}
        <div className="flex flex-wrap items-center gap-1.5">
          <div className="inline-flex rounded-xl border border-slate-800 bg-slate-900/90 p-0.5 text-[10px] font-bold">
            <button
              type="button"
              onClick={() => setLens('regions')}
              className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 transition cursor-pointer ${
                lens === 'regions'
                  ? 'bg-amber-500/25 text-amber-200 shadow-inner'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Layers className="h-3 w-3" />
              Regiones
            </button>
            <button
              type="button"
              onClick={() => setLens('empires')}
              className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 transition cursor-pointer ${
                lens === 'empires'
                  ? 'bg-rose-500/30 text-rose-100 shadow-inner'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Crown className="h-3 w-3" />
              Imperio vs. Mundo
            </button>
          </div>

          <div className="inline-flex items-center gap-1 rounded-xl border border-slate-800 bg-slate-900/90 p-0.5">
            <button
              type="button"
              title="Acercar"
              onClick={() => setManualZoomDelta((d) => clamp(d + 1.2, -3, 4))}
              className="rounded-lg p-1 text-slate-300 hover:bg-slate-800 hover:text-white cursor-pointer"
            >
              <ZoomIn className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              title="Alejar"
              onClick={() => setManualZoomDelta((d) => clamp(d - 1.2, -4, 4))}
              className="rounded-lg p-1 text-slate-300 hover:bg-slate-800 hover:text-white cursor-pointer"
            >
              <ZoomOut className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              title="Vista Global"
              onClick={() => {
                setSelectedBlocId(null);
                setManualZoomDelta(0);
              }}
              className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[10px] font-bold text-amber-200 hover:bg-amber-500/20 cursor-pointer"
            >
              <RotateCcw className="h-3 w-3" />
              Global
            </button>
          </div>
        </div>
      </div>

      {/* Main Interactive SVG Civilization Map Viewport */}
      <div className="relative aspect-[2/1] w-full overflow-hidden bg-[#040916] select-none">
        <svg
          viewBox={`0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`}
          className="h-full w-full"
          role="img"
          aria-label="Mapa geopolítico interactivo de Crown of Galar"
        >
          <defs>
            <radialGradient id="civOceanGrad" cx="50%" cy="44%" r="65%">
              <stop offset="0%" stopColor="#0c1b36" />
              <stop offset="65%" stopColor="#071124" />
              <stop offset="100%" stopColor="#030712" />
            </radialGradient>

            {/* Subtle imperial diagonal hatching for Galar colonies */}
            <pattern
              id="imperialHatch"
              width="6"
              height="6"
              patternUnits="userSpaceOnUse"
              patternTransform="rotate(45)"
            >
              <line
                x1="0"
                y1="0"
                x2="0"
                y2="6"
                stroke="#fde047"
                strokeWidth="0.9"
                strokeOpacity="0.16"
              />
            </pattern>

            <filter id="civTerritoryGlow" x="-15%" y="-15%" width="130%" height="130%">
              <feGaussianBlur stdDeviation="2.5" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Deep Cartographic Sea Background */}
          <rect width={MAP_WIDTH} height={MAP_HEIGHT} fill="url(#civOceanGrad)" />

          {/* Smooth Camera Transform Layer */}
          <g
            style={{
              transform: `translate(${camera.tx.toFixed(2)}px, ${camera.ty.toFixed(2)}px) scale(${camera.z.toFixed(3)})`,
              transformOrigin: '0px 0px',
              transition: 'transform 700ms cubic-bezier(0.22, 1, 0.36, 1)',
            }}
          >
            {/* Latitude / Longitude Graticule */}
            <path
              d={geoBundle.graticulePath}
              fill="none"
              stroke="#38bdf8"
              strokeOpacity="0.09"
              strokeWidth={0.55 * strokeScale}
            />

            {/* Individual Country Fills colored by Civilization Geopolitical Bloc */}
            <g>
              {geoBundle.countryPaths.map((country) => {
                const bloc = country.bloc;
                const isActive =
                  bloc !== null && activeBloc?.id === bloc.id;
                const isDimmed =
                  activeBloc !== null &&
                  bloc !== null &&
                  activeBloc.id !== bloc.id &&
                  camera.z > 1.8;

                if (!bloc) {
                  return (
                    <path
                      key={country.key}
                      d={country.d}
                      fill="#162033"
                      fillOpacity={0.85}
                      stroke="#293852"
                      strokeWidth={0.45 * strokeScale}
                    />
                  );
                }

                const { fill } = getBlocColors(bloc);
                const baseOpacity = isActive ? 0.78 : isDimmed ? 0.28 : 0.56;

                return (
                  <path
                    key={country.key}
                    d={country.d}
                    fill={fill}
                    fillOpacity={baseOpacity}
                    stroke="#07101f"
                    strokeOpacity={0.5}
                    strokeWidth={0.4 * strokeScale}
                    className="cursor-pointer transition-[fill-opacity] duration-300"
                    onMouseEnter={() => setHoveredBlocId(bloc.id)}
                    onMouseLeave={() => setHoveredBlocId(null)}
                    onClick={() => {
                      setManualZoomDelta(0);
                      setSelectedBlocId((prev) =>
                        prev === bloc.id ? null : bloc.id
                      );
                    }}
                  >
                    <title>{`${bloc.name} (${country.name})`}</title>
                  </path>
                );
              })}
            </g>

            {/* Imperial Colony Hatching Overlay (British-Empire-scale visual cue) */}
            <g pointerEvents="none">
              {geoBundle.blocFrontiers
                .filter((bf) => bf.bloc.factionKind === 'imperial_colony')
                .map(({ bloc, d }) => (
                  <path
                    key={`hatch-${bloc.id}`}
                    d={d}
                    fill="url(#imperialHatch)"
                    opacity={lens === 'empires' ? 0.95 : 0.55}
                  />
                ))}
            </g>

            {/* Civilization Unified Outer Territory Borders */}
            <g pointerEvents="none">
              {geoBundle.blocFrontiers.map(({ bloc, d }) => {
                const { stroke } = getBlocColors(bloc);
                const isActive = activeBloc?.id === bloc.id;
                return (
                  <path
                    key={`frontier-${bloc.id}`}
                    d={d}
                    fill="none"
                    stroke={stroke}
                    strokeOpacity={isActive ? 1 : 0.72}
                    strokeWidth={(isActive ? 2.1 : 1.15) * strokeScale}
                    strokeLinejoin="round"
                    filter={isActive ? 'url(#civTerritoryGlow)' : undefined}
                  />
                );
              })}
            </g>

            {/* Alola Archipelago (Honolulu, Pacific) — Custom Civilization Territory Ring + Islands */}
            <g
              className="cursor-pointer"
              onMouseEnter={() => setHoveredBlocId('alola')}
              onMouseLeave={() => setHoveredBlocId(null)}
              onClick={() => {
                setManualZoomDelta(0);
                setSelectedBlocId((prev) => (prev === 'alola' ? null : 'alola'));
              }}
            >
              <circle
                cx={geoBundle.alolaCenter[0]}
                cy={geoBundle.alolaCenter[1]}
                r={17 * Math.max(0.55, invScale)}
                fill="#f59e0b"
                fillOpacity={activeBloc?.id === 'alola' ? 0.34 : 0.16}
                stroke="#fef08a"
                strokeWidth={(activeBloc?.id === 'alola' ? 1.8 : 1.1) * strokeScale}
                strokeDasharray={`${3 * strokeScale} ${2 * strokeScale}`}
              />
              {geoBundle.alolaIslands.map((isl) => (
                <circle
                  key={isl.name}
                  cx={isl.cx}
                  cy={isl.cy}
                  r={isl.r * Math.max(0.42, invScale)}
                  fill="#fbbf24"
                  stroke="#fffbeb"
                  strokeWidth={0.6 * strokeScale}
                >
                  <title>{`Alola — ${isl.name}`}</title>
                </circle>
              ))}
            </g>

            {/* Strategic Trajectory Arc for Hovered Mission (e.g. Duelist's journey or VGC Hologram Link) */}
            {hoveredLocation?.originArcFrom && (() => {
              const fromPt = geoBundle.projectPoint(hoveredLocation.originArcFrom);
              const toPt = geoBundle.projectPoint(hoveredLocation.coords);
              const arcD = buildArcPath(fromPt, toPt);
              return (
                <g pointerEvents="none">
                  <path
                    d={arcD}
                    fill="none"
                    stroke="#fbbf24"
                    strokeWidth={1.6 * strokeScale}
                    strokeDasharray={`${4.5 * strokeScale} ${3 * strokeScale}`}
                    strokeOpacity="0.9"
                  />
                  <circle
                    cx={fromPt[0]}
                    cy={fromPt[1]}
                    r={3.2 * invScale}
                    fill="#fbbf24"
                    stroke="#0f172a"
                    strokeWidth={0.8 * invScale}
                  />
                </g>
              );
            })()}

            {/* Civilization Bloc Labels (Global & Medium Zoom) */}
            <g pointerEvents="none">
              {WORLD_BLOCS.map((bloc) => {
                const [lx, ly] = geoBundle.projectPoint(bloc.labelCoords);
                const isActive = activeBloc?.id === bloc.id;
                const { stroke } = getBlocColors(bloc);
                return (
                  <g
                    key={`label-${bloc.id}`}
                    transform={`translate(${lx.toFixed(1)}, ${ly.toFixed(1)}) scale(${invScale.toFixed(3)})`}
                    opacity={
                      camera.z > 4.5 && !isActive
                        ? 0.25
                        : isActive
                          ? 1
                          : 0.88
                    }
                  >
                    <text
                      textAnchor="middle"
                      y="3"
                      fill="#020617"
                      stroke="#020617"
                      strokeWidth="3.2"
                      strokeLinejoin="round"
                      fontSize={isActive ? 9.5 : 8}
                      fontWeight="800"
                      letterSpacing="0.11em"
                    >
                      {bloc.shortName}
                    </text>
                    <text
                      textAnchor="middle"
                      y="3"
                      fill={isActive ? '#fef3c7' : stroke}
                      fontSize={isActive ? 9.5 : 8}
                      fontWeight="800"
                      letterSpacing="0.11em"
                    >
                      {bloc.shortName}
                    </text>
                  </g>
                );
              })}
            </g>

            {/* Micro-Landmarks that fade in smoothly when zoomed in (Sinnoh/Kanto/Johto/Hoenn/Wyndon/Guyana) */}
            <g pointerEvents="none">
              {ZOOM_LANDMARKS.filter((lm) => camera.z >= lm.minZoom).map((lm) => {
                const [lx, ly] = geoBundle.projectPoint(lm.coords);
                return (
                  <g
                    key={lm.id}
                    transform={`translate(${lx.toFixed(1)}, ${ly.toFixed(1)}) scale(${invScale.toFixed(3)})`}
                    opacity={0.85}
                  >
                    <text
                      textAnchor="middle"
                      y="2"
                      fill="#020617"
                      stroke="#020617"
                      strokeWidth="2.6"
                      fontSize="7"
                      fontWeight="700"
                      letterSpacing="0.12em"
                    >
                      {lm.label}
                    </text>
                    <text
                      textAnchor="middle"
                      y="2"
                      fill={lm.color}
                      fontSize="7"
                      fontWeight="700"
                      letterSpacing="0.12em"
                    >
                      {lm.label}
                    </text>
                  </g>
                );
              })}
            </g>

            {/* Playable Mission Pins (all 16 Chapters!) */}
            <g>
              {projectedMissions.map((m) => {
                const isHovered = hoveredChapterId === m.chapter.id;
                const pinFill = isHovered
                  ? '#fde047'
                  : m.completed
                    ? '#34d399'
                    : m.unlocked
                      ? '#f59e0b'
                      : '#94a3b8';

                return (
                  <g
                    key={`pin-${m.chapter.id}`}
                    transform={`translate(${m.x.toFixed(2)}, ${m.y.toFixed(2)}) scale(${invScale.toFixed(3)})`}
                    className="cursor-pointer"
                    onMouseEnter={() => onHoverChapterPin(m.chapter.id)}
                    onMouseLeave={() => onHoverChapterPin(null)}
                    onClick={(e) => {
                      e.stopPropagation();
                      onFocusChapterCard(m.chapter.id);
                    }}
                  >
                    {isHovered && (
                      <>
                        <circle
                          r="15"
                          fill="#fbbf24"
                          fillOpacity="0.18"
                          stroke="#fde047"
                          strokeWidth="1.2"
                          strokeDasharray="3 2"
                        />
                        <circle
                          r="9"
                          fill="none"
                          stroke="#fbbf24"
                          strokeWidth="1.5"
                          className="animate-ping"
                        />
                        {/* Tactical Crosshair ticks */}
                        <line x1="-18" y1="0" x2="-11" y2="0" stroke="#fde047" strokeWidth="1.2" />
                        <line x1="11" y1="0" x2="18" y2="0" stroke="#fde047" strokeWidth="1.2" />
                        <line x1="0" y1="-18" x2="0" y2="-11" stroke="#fde047" strokeWidth="1.2" />
                        <line x1="0" y1="11" x2="0" y2="18" stroke="#fde047" strokeWidth="1.2" />
                      </>
                    )}
                    <circle
                      r={isHovered ? 5.6 : 3.8}
                      fill={pinFill}
                      stroke="#020617"
                      strokeWidth="1.4"
                    />
                    <circle
                      r={isHovered ? 2.1 : 1.3}
                      fill="#ffffff"
                      fillOpacity={m.unlocked ? 0.95 : 0.45}
                    />
                    <title>{`${m.chapter.number}: ${m.chapter.title} — ${m.loc.locationName}`}</title>
                  </g>
                );
              })}
            </g>
          </g>
        </svg>

        {/* Floating Top-Left Zoom / Telemetry Badge */}
        <div className="pointer-events-none absolute left-3 top-3 flex flex-wrap items-center gap-1.5">
          <span className="inline-flex items-center gap-1.5 rounded-lg border border-amber-400/35 bg-slate-950/85 px-2.5 py-1 text-[10px] font-bold text-amber-200 backdrop-blur-sm">
            <Crosshair className="h-3 w-3 text-amber-400" />
            {hoveredLocation
              ? `ENFOQUE: ${hoveredLocation.locationName}`
              : selectedBlocId
                ? `REGIÓN: ${BLOC_BY_ID[selectedBlocId].name}`
                : 'VISTA GLOBAL · 12 BLOQUES GEOPOLÍTICOS'}
          </span>
          {camera.z > 1.05 && (
            <span className="font-mono-code rounded-lg border border-slate-700/90 bg-slate-950/85 px-2 py-1 text-[10px] font-bold text-sky-300 backdrop-blur-sm">
              {camera.z.toFixed(1)}x
            </span>
          )}
        </div>

        {/* Floating Mission Callout Overlay when hovering a Chapter Card or Pin */}
        {hoveredChapter && hoveredLocation && (
          <div className="pointer-events-none absolute bottom-3 left-3 right-3 z-20 flex items-end justify-between gap-3">
            <div className="max-w-lg rounded-2xl border border-amber-400/50 bg-slate-950/92 px-3.5 py-2.5 shadow-2xl backdrop-blur-md">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1 rounded-md border border-amber-400/40 bg-amber-500/20 px-1.5 py-0.5 text-[9px] font-extrabold uppercase tracking-wider text-amber-200">
                  <MapPin className="h-2.5 w-2.5" />
                  {hoveredChapter.number}
                </span>
                <span className="text-[10px] font-bold text-sky-300">
                  {hoveredLocation.regionLabel}
                </span>
                {hoveredLocation.originArcLabel && (
                  <span className="rounded-md border border-yellow-400/35 bg-yellow-500/15 px-1.5 py-0.5 text-[9px] font-bold text-yellow-200">
                    ⟶ {hoveredLocation.originArcLabel}
                  </span>
                )}
              </div>
              <p className="mt-1 font-display text-sm font-bold text-white">
                {hoveredChapter.title}
              </p>
              <p className="text-[11px] leading-snug text-slate-300">
                <strong className="text-amber-200">{hoveredLocation.locationName}:</strong>{' '}
                {hoveredLocation.theaterNote}
              </p>
            </div>
          </div>
        )}

        {/* Decorative Compass Watermark */}
        {!hoveredChapter && (
          <div className="pointer-events-none absolute bottom-3 left-3 flex items-center gap-1.5 rounded-lg border border-slate-800/90 bg-slate-950/75 px-2.5 py-1 text-[10px] text-slate-400 backdrop-blur-sm">
            <Compass className="h-3.5 w-3.5 text-amber-400/80" />
            <span>
              {lens === 'empires'
                ? 'Rojo Carmesí = Dominio del Imperio de Galar (Monopolio del Último Ditto)'
                : 'Colores por bloque regional · Franjas doradas = Colonias subyugadas por Galar'}
            </span>
          </div>
        )}
      </div>

      {/* Interactive Civilization Quick-Jump Region Strip */}
      <div className="flex flex-wrap items-center gap-1.5 border-t border-slate-800/80 bg-slate-950/65 px-3.5 py-2.5">
        {WORLD_BLOCS.map((bloc) => {
          const isSelected = selectedBlocId === bloc.id;
          const isHoveredTarget = hoveredLocation?.blocId === bloc.id;
          const colors = getBlocColors(bloc);
          const count = projectedMissions.filter(
            (m) => m.loc.blocId === bloc.id
          ).length;

          return (
            <button
              key={bloc.id}
              type="button"
              onClick={() => {
                setManualZoomDelta(0);
                setSelectedBlocId((prev) =>
                  prev === bloc.id ? null : bloc.id
                );
              }}
              className={`inline-flex items-center gap-1.5 rounded-lg border px-2 py-1 text-[10px] font-bold transition cursor-pointer ${
                isSelected || isHoveredTarget
                  ? 'border-amber-400 bg-amber-500/20 text-white shadow-sm shadow-amber-500/20'
                  : 'border-slate-800 bg-slate-900/85 text-slate-300 hover:border-slate-600 hover:text-white'
              }`}
            >
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-full border border-black/40"
                style={{ backgroundColor: colors.fill }}
              />
              <span>{bloc.shortName}</span>
              {count > 0 && (
                <span className="font-mono-code rounded bg-slate-950/90 px-1 text-[9px] text-amber-300">
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Geopolitical Dossier Card for Selected / Hovered Bloc */}
      <div className="border-t border-slate-800/90 bg-slate-950/90 px-4 py-3.5">
        {activeBloc ? (
          <div className="space-y-2.5">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[10px] font-extrabold ${
                      FACTION_KIND_META[activeBloc.factionKind].pillClass
                    }`}
                  >
                    <Sparkles className="h-2.5 w-2.5" />
                    {activeBloc.factionBadge}
                  </span>
                  <span className="text-[10px] font-semibold text-slate-400">
                    {activeBloc.statusTag}
                  </span>
                </div>
                <h3 className="mt-1 font-display text-sm font-bold text-white sm:text-base">
                  {activeBloc.name}
                </h3>
              </div>

              {selectedBlocId && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedBlocId(null);
                    setManualZoomDelta(0);
                  }}
                  className="rounded-lg border border-slate-700 bg-slate-900 px-2 py-1 text-[10px] font-semibold text-slate-300 hover:border-amber-400/50 hover:text-white cursor-pointer"
                >
                  Soltar enfoque
                </button>
              )}
            </div>

            <p className="text-xs leading-relaxed text-slate-300">
              {activeBloc.loreSummary}
            </p>

            <div className="grid gap-2 text-[11px] sm:grid-cols-2">
              <div className="rounded-xl border border-slate-800/90 bg-slate-900/70 px-3 py-2">
                <span className="block text-[9px] font-extrabold uppercase tracking-wider text-amber-300/90">
                  Recurso / Peso Geopolítico
                </span>
                <span className="text-slate-200">{activeBloc.keyResource}</span>
              </div>
              <div className="rounded-xl border border-slate-800/90 bg-slate-900/70 px-3 py-2">
                <span className="block text-[9px] font-extrabold uppercase tracking-wider text-sky-300/90">
                  Referencia del Mundo Pokémon
                </span>
                <span className="text-slate-200">{activeBloc.featuredCanonClue}</span>
              </div>
            </div>

            {/* Quick mission buttons inside this bloc (when clicked/locked) */}
            {activeBlocMissions.length > 0 && selectedBlocId === activeBloc.id && (
              <div className="pt-1">
                <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Combates en esta región ({activeBlocMissions.length})
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {activeBlocMissions.map((m) => (
                    <button
                      key={`quick-${m.chapter.id}`}
                      type="button"
                      onMouseEnter={() => onHoverChapterPin(m.chapter.id)}
                      onMouseLeave={() => onHoverChapterPin(null)}
                      onClick={() =>
                        m.unlocked
                          ? onLaunchChapter(m.chapter)
                          : onFocusChapterCard(m.chapter.id)
                      }
                      className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-[11px] font-bold transition cursor-pointer ${
                        m.unlocked
                          ? 'border-amber-400/40 bg-amber-500/15 text-amber-100 hover:bg-amber-500/25'
                          : 'border-slate-700 bg-slate-900 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {m.unlocked ? (
                        <Play className="h-2.5 w-2.5 fill-current text-amber-300" />
                      ) : (
                        <Lock className="h-2.5 w-2.5 text-rose-400" />
                      )}
                      <span>{m.chapter.title}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400">
            <p>
              <strong className="text-amber-200">Mapa Estratégico del AU:</strong>{' '}
              Explora los 12 bloques del mundo — desde el monopolio del{' '}
              <span className="text-rose-300">Imperio de Galar</span> (África, India, Canadá, Australia) hasta el rumor de{' '}
              <span className="text-emerald-300">Mew en Sudamérica</span> y el bloque cerrado de{' '}
              <span className="text-violet-300">Poké-Japón</span>.
            </p>
            <span className="font-mono-code text-[10px] text-slate-500">
              16 teatros mapeados
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
