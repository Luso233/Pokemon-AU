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
  Navigation,
  Play,
  RotateCcw,
  Route,
  ShieldAlert,
  Sparkles,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import {
  BLOC_BY_ID,
  CAMPAIGN_ROUTE_ORDER,
  CHAPTER_MAP_LOCATIONS,
  FACTION_KIND_META,
  ISO_TO_BLOC,
  NAME_TO_BLOC,
  WORLD_BLOCS,
  ZOOM_LANDMARKS,
  type ThreatLevelLabel,
  type WorldBlocDefinition,
  type WorldBlocId,
} from '../data/worldGeopolitics';
import type { ChapterDefinition } from '../types/game';

export type MapLensMode = 'regions' | 'empires';

interface WorldWarMapProps {
  chapters: ChapterDefinition[];
  hoveredChapterId: string | null;
  nextObjectiveChapterId: string | null;
  onHoverChapterPin: (chapterId: string | null) => void;
  onFocusChapterCard: (chapterId: string) => void;
  onLaunchChapter: (chapter: ChapterDefinition) => void;
  unlockedChapterIds: Set<string>;
  completedChapterIds: Set<string>;
}

const MAP_WIDTH = 960;
const MAP_HEIGHT = 470;

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

function getThreatStyles(level: ThreatLevelLabel): {
  badge: string;
  pip: string;
} {
  switch (level) {
    case 'Extremo':
      return {
        badge: 'border-fuchsia-400/50 bg-fuchsia-500/20 text-fuchsia-200',
        pip: 'bg-fuchsia-400',
      };
    case 'Crítico':
      return {
        badge: 'border-rose-400/50 bg-rose-500/20 text-rose-200',
        pip: 'bg-rose-400',
      };
    case 'Muy Alto':
      return {
        badge: 'border-orange-400/50 bg-orange-500/20 text-orange-200',
        pip: 'bg-orange-400',
      };
    case 'Alto':
      return {
        badge: 'border-amber-400/50 bg-amber-500/20 text-amber-200',
        pip: 'bg-amber-400',
      };
    default:
      return {
        badge: 'border-sky-400/45 bg-sky-500/15 text-sky-200',
        pip: 'bg-sky-400',
      };
  }
}

export const WorldWarMap: React.FC<WorldWarMapProps> = ({
  chapters,
  hoveredChapterId,
  nextObjectiveChapterId,
  onHoverChapterPin,
  onFocusChapterCard,
  onLaunchChapter,
  unlockedChapterIds,
  completedChapterIds,
}) => {
  const [lens, setLens] = useState<MapLensMode>('regions');
  const [showRoutes, setShowRoutes] = useState<boolean>(true);
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
      const countryName = feat.properties?.name ?? isoId;
      const d = pathGen(feat);
      if (!d) continue;
      countryPaths.push({
        key: `${isoId}-${idx}`,
        isoId,
        name: countryName,
        d,
        bloc:
          ISO_TO_BLOC[isoId] ??
          NAME_TO_BLOC[countryName.toLowerCase()] ??
          null,
      });
    }

    const blocFrontiers: BlocFrontierItem[] = [];
    const rawGeoms = topology.objects.countries.geometries;
    for (const bloc of WORLD_BLOCS) {
      if (bloc.isoNumericIds.length === 0 && !bloc.fallbackNames?.length) continue;
      const isoSet = new Set(bloc.isoNumericIds);
      const nameSet = new Set(
        (bloc.fallbackNames ?? []).map((n) => n.toLowerCase())
      );
      const matchingGeoms = rawGeoms.filter((g) => {
        const gid = String(g.id ?? '').padStart(3, '0');
        const gname = (
          (g.properties as { name?: string } | undefined)?.name ?? ''
        ).toLowerCase();
        return isoSet.has(gid) || nameSet.has(gname);
      });
      if (matchingGeoms.length === 0) continue;
      const merged = merge(topology, matchingGeoms as never);
      const d = pathGen(merged);
      if (d) {
        blocFrontiers.push({ bloc, d });
      }
    }

    const malvinasCenter = projection([-59.0, -51.75]) ?? [285, 420];

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
      malvinasCenter,
      projectPoint,
    };
  }, []);

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
          isNextObjective: nextObjectiveChapterId === ch.id,
          isOptional: ch.category !== 'story',
        };
      })
      .filter((x): x is NonNullable<typeof x> => x !== null);
  }, [
    chapters,
    geoBundle,
    unlockedChapterIds,
    completedChapterIds,
    nextObjectiveChapterId,
  ]);

  /* Group mission counts & status per geopolitical bloc for Clustering + Fog of War */
  const blocMissionStats = useMemo(() => {
    const stats: Record<
      WorldBlocId,
      {
        total: number;
        unlockedCount: number;
        completedCount: number;
        hasNextObjective: boolean;
      }
    > = {} as Record<
      WorldBlocId,
      {
        total: number;
        unlockedCount: number;
        completedCount: number;
        hasNextObjective: boolean;
      }
    >;
    for (const bloc of WORLD_BLOCS) {
      stats[bloc.id] = {
        total: 0,
        unlockedCount: 0,
        completedCount: 0,
        hasNextObjective: false,
      };
    }
    for (const m of projectedMissions) {
      const s = stats[m.loc.blocId];
      if (!s) continue;
      s.total += 1;
      if (m.unlocked) s.unlockedCount += 1;
      if (m.completed) s.completedCount += 1;
      if (m.isNextObjective) s.hasNextObjective = true;
    }
    return stats;
  }, [projectedMissions]);

  const hoveredLocation = hoveredChapterId
    ? CHAPTER_MAP_LOCATIONS[hoveredChapterId] ?? null
    : null;
  const hoveredChapter = hoveredChapterId
    ? chapterById[hoveredChapterId] ?? null
    : null;

  const nextObjectiveChapter = nextObjectiveChapterId
    ? chapterById[nextObjectiveChapterId] ?? null
    : null;
  const nextObjectiveLocation = nextObjectiveChapterId
    ? CHAPTER_MAP_LOCATIONS[nextObjectiveChapterId] ?? null
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

  // Global Clustering rule: at global zoom (< 2.2x) with no individual mission hovered,
  // collapse crowded Europe/Japan pins into clean numeric cluster badges!
  const isClusteredGlobalView = camera.z < 2.2 && !hoveredChapterId;

  const invScale = 1 / Math.pow(camera.z, 0.76);
  const strokeScale = 1 / Math.pow(camera.z, 0.65);

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
    const lift = Math.min(92, Math.max(10, dist * 0.28));
    const midY = (from[1] + to[1]) / 2 - lift;
    return `M ${from[0].toFixed(1)} ${from[1].toFixed(1)} Q ${midX.toFixed(1)} ${midY.toFixed(1)} ${to[0].toFixed(1)} ${to[1].toFixed(1)}`;
  };

  /* Indiana-Jones Exile Route segments connecting consecutive campaign waypoints */
  const exileRouteLegs = useMemo(() => {
    const legs: Array<{
      id: string;
      d: string;
      state: 'completed' | 'active' | 'future';
      isLongHaul: boolean;
    }> = [];

    for (let i = 0; i < CAMPAIGN_ROUTE_ORDER.length - 1; i++) {
      const fromId = CAMPAIGN_ROUTE_ORDER[i];
      const toId = CAMPAIGN_ROUTE_ORDER[i + 1];
      const fromLoc = CHAPTER_MAP_LOCATIONS[fromId];
      const toLoc = CHAPTER_MAP_LOCATIONS[toId];
      if (!fromLoc || !toLoc) continue;

      const fromPt = geoBundle.projectPoint(fromLoc.coords);
      const toPt = geoBundle.projectPoint(toLoc.coords);
      const dist = Math.hypot(toPt[0] - fromPt[0], toPt[1] - fromPt[1]);

      const fromDone = completedChapterIds.has(fromId);
      const toDone = completedChapterIds.has(toId);
      const isActiveLeg =
        toId === nextObjectiveChapterId ||
        (fromDone && !toDone && nextObjectiveChapterId === toId);

      const state: 'completed' | 'active' | 'future' =
        fromDone && toDone
          ? 'completed'
          : isActiveLeg
            ? 'active'
            : 'future';

      legs.push({
        id: `route-${fromId}-${toId}`,
        d: buildArcPath(fromPt, toPt),
        state,
        isLongHaul: dist > 30,
      });
    }
    return legs;
  }, [geoBundle, completedChapterIds, nextObjectiveChapterId]);

  const handleJumpToNextObjective = () => {
    if (!nextObjectiveChapter || !nextObjectiveLocation) return;
    setManualZoomDelta(0);
    setSelectedBlocId(nextObjectiveLocation.blocId);
    onFocusChapterCard(nextObjectiveChapter.id);
  };

  return (
    <div className="flex flex-col overflow-hidden rounded-3xl border border-amber-400/25 bg-[#070d1b]/95 shadow-2xl shadow-black/50 backdrop-blur-md">
      {/* Compact War-Room Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/90 bg-slate-950/75 px-3.5 py-2.5">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-xl border border-amber-400/40 bg-amber-500/15 text-amber-300">
            <Globe2 className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-display text-sm font-bold tracking-wide text-white">
                Atlas Geopolítico
              </h2>
              <span className="hidden rounded-md border border-rose-400/35 bg-rose-500/15 px-1.5 py-0.5 text-[9px] font-extrabold uppercase tracking-wider text-rose-200 sm:inline-block">
                Monopolio Ditto
              </span>
            </div>
          </div>
        </div>

        {/* Lens Switcher + Routes Toggle + Camera Controls */}
        <div className="flex flex-wrap items-center gap-1.5">
          <div className="inline-flex rounded-xl border border-slate-800 bg-slate-900/90 p-0.5 text-[10px] font-bold">
            <button
              type="button"
              onClick={() => setLens('regions')}
              className={`inline-flex items-center gap-1 rounded-lg px-2 py-1 transition cursor-pointer ${
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
              className={`inline-flex items-center gap-1 rounded-lg px-2 py-1 transition cursor-pointer ${
                lens === 'empires'
                  ? 'bg-rose-500/30 text-rose-100 shadow-inner'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Crown className="h-3 w-3" />
              Imperio vs. Mundo
            </button>
          </div>

          <button
            type="button"
            title="Mostrar u ocultar Rutas de Exilio"
            onClick={() => setShowRoutes((v) => !v)}
            className={`inline-flex items-center gap-1 rounded-xl border px-2 py-1 text-[10px] font-bold transition cursor-pointer ${
              showRoutes
                ? 'border-amber-400/45 bg-amber-500/15 text-amber-200'
                : 'border-slate-800 bg-slate-900/90 text-slate-400 hover:text-slate-200'
            }`}
          >
            <Route className="h-3 w-3" />
            Ruta
          </button>

          <div className="inline-flex items-center gap-0.5 rounded-xl border border-slate-800 bg-slate-900/90 p-0.5">
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

            {/* Imperial diagonal hatching ONLY shown in Imperio vs. Mundo lens */}
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
                strokeWidth="1"
                strokeOpacity="0.22"
              />
            </pattern>

            {/* Fog of War desaturation filter for regions with no playable content yet */}
            <filter id="fogOfWarDesat">
              <feColorMatrix type="saturate" values="0.45" />
            </filter>

            <filter id="civTerritoryGlow" x="-15%" y="-15%" width="130%" height="130%">
              <feGaussianBlur stdDeviation="2.4" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Deep Cartographic Sea Background */}
          <rect width={MAP_WIDTH} height={MAP_HEIGHT} fill="url(#civOceanGrad)" />

          {/* Smooth Hardware-Accelerated Camera Transform Layer */}
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
              strokeOpacity="0.08"
              strokeWidth={0.55 * strokeScale}
            />

            {/* Country Fills with Fog of War hierarchy */}
            <g>
              {geoBundle.countryPaths.map((country) => {
                const bloc = country.bloc;
                if (!bloc) {
                  return (
                    <path
                      key={country.key}
                      d={country.d}
                      fill="#121b2b"
                      fillOpacity={0.85}
                      stroke="#223047"
                      strokeWidth={0.42 * strokeScale}
                    />
                  );
                }

                const isActive = activeBloc?.id === bloc.id;
                const hasContent = (blocMissionStats[bloc.id]?.total ?? 0) > 0;
                const isFogged =
                  lens === 'regions' && !hasContent && !isActive;

                const isDimmedByFocus =
                  activeBloc !== null &&
                  activeBloc.id !== bloc.id &&
                  camera.z > 1.8;

                const { fill } = getBlocColors(bloc);

                let fillOpacity: number;
                if (isActive) {
                  fillOpacity = 0.82;
                } else if (isDimmedByFocus) {
                  fillOpacity = 0.2;
                } else if (lens === 'empires') {
                  fillOpacity =
                    bloc.factionKind === 'imperial_core' ||
                    bloc.factionKind === 'imperial_colony'
                      ? 0.68
                      : hasContent
                        ? 0.62
                        : 0.34;
                } else {
                  // Regiones lens: playable theaters shine brightly; empty frontiers rest under Fog of War
                  fillOpacity = hasContent ? 0.72 : 0.28;
                }

                return (
                  <path
                    key={country.key}
                    d={country.d}
                    fill={fill}
                    fillOpacity={fillOpacity}
                    filter={isFogged ? 'url(#fogOfWarDesat)' : undefined}
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

            {/* Imperial Hatching Overlay ONLY in Imperio vs. Mundo lens (clean look in Regiones!) */}
            {lens === 'empires' && (
              <g pointerEvents="none">
                {geoBundle.blocFrontiers
                  .filter((bf) => bf.bloc.factionKind === 'imperial_colony')
                  .map(({ bloc, d }) => (
                    <path
                      key={`hatch-${bloc.id}`}
                      d={d}
                      fill="url(#imperialHatch)"
                      opacity={0.9}
                    />
                  ))}
              </g>
            )}

            {/* Civilization Unified Outer Territory Borders */}
            <g pointerEvents="none">
              {geoBundle.blocFrontiers.map(({ bloc, d }) => {
                const { stroke } = getBlocColors(bloc);
                const isActive = activeBloc?.id === bloc.id;
                const hasContent = (blocMissionStats[bloc.id]?.total ?? 0) > 0;
                const isImperialColony = bloc.factionKind === 'imperial_colony';

                const borderOpacity = isActive
                  ? 1
                  : hasContent || lens === 'empires'
                    ? 0.85
                    : isImperialColony
                      ? 0.48
                      : 0.36;

                return (
                  <path
                    key={`frontier-${bloc.id}`}
                    d={d}
                    fill="none"
                    stroke={
                      lens === 'regions' && isImperialColony
                        ? '#f59e0b'
                        : stroke
                    }
                    strokeOpacity={borderOpacity}
                    strokeWidth={
                      (isActive ? 2.1 : hasContent ? 1.35 : 0.95) * strokeScale
                    }
                    strokeLinejoin="round"
                    filter={isActive ? 'url(#civTerritoryGlow)' : undefined}
                  />
                );
              })}
            </g>

            {/* Islas Malvinas — Galar Imperial Naval Outpost right off Andes-Plata */}
            <g
              className="cursor-pointer"
              onMouseEnter={() => setHoveredBlocId('galar_empire')}
              onMouseLeave={() => setHoveredBlocId(null)}
              onClick={() => {
                setManualZoomDelta(0);
                setSelectedBlocId('galar_empire');
              }}
            >
              <circle
                cx={geoBundle.malvinasCenter[0]}
                cy={geoBundle.malvinasCenter[1]}
                r={7 * Math.max(0.45, invScale)}
                fill="#e11d48"
                fillOpacity="0.32"
                stroke="#fbbf24"
                strokeWidth={1.1 * strokeScale}
                strokeDasharray={`${2.5 * strokeScale} ${1.5 * strokeScale}`}
              />
              <circle
                cx={geoBundle.malvinasCenter[0]}
                cy={geoBundle.malvinasCenter[1]}
                r={2.4 * Math.max(0.45, invScale)}
                fill="#e11d48"
                stroke="#fde047"
                strokeWidth={0.8 * strokeScale}
              >
                <title>Islas Malvinas (Archipiélago Austral) — Base Naval del Imperio de Galar</title>
              </circle>
            </g>

            {/* Alola Archipelago (Honolulu, Pacific) */}
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
                fillOpacity={activeBloc?.id === 'alola' ? 0.36 : 0.22}
                stroke="#fef08a"
                strokeWidth={(activeBloc?.id === 'alola' ? 1.8 : 1.2) * strokeScale}
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

            {/* Indiana-Jones Exile Route Arcs */}
            {showRoutes && (
              <g pointerEvents="none">
                {exileRouteLegs
                  // In Global View show long-haul intercontinental legs + active leg; when zoomed show all local hops too!
                  .filter((leg) => !isClusteredGlobalView || leg.isLongHaul || leg.state === 'active')
                  .map((leg) => {
                    if (leg.state === 'active') {
                      return (
                        <path
                          key={leg.id}
                          d={leg.d}
                          fill="none"
                          stroke="#fbbf24"
                          strokeWidth={1.7 * strokeScale}
                          strokeDasharray={`${5 * strokeScale} ${3 * strokeScale}`}
                          strokeOpacity="0.95"
                          className="animate-route-dash"
                        />
                      );
                    }
                    if (leg.state === 'completed') {
                      return (
                        <path
                          key={leg.id}
                          d={leg.d}
                          fill="none"
                          stroke="#34d399"
                          strokeWidth={1.25 * strokeScale}
                          strokeDasharray={`${3.5 * strokeScale} ${2.5 * strokeScale}`}
                          strokeOpacity="0.55"
                        />
                      );
                    }
                    return (
                      <path
                        key={leg.id}
                        d={leg.d}
                        fill="none"
                        stroke="#94a3b8"
                        strokeWidth={0.9 * strokeScale}
                        strokeDasharray={`${2.5 * strokeScale} ${3.5 * strokeScale}`}
                        strokeOpacity="0.25"
                      />
                    );
                  })}
              </g>
            )}

            {/* Special Strategic Trajectory Arc for Hovered Mission (Duelist / Hologram Link) */}
            {hoveredLocation?.originArcFrom && (() => {
              const fromPt = geoBundle.projectPoint(hoveredLocation.originArcFrom);
              const toPt = geoBundle.projectPoint(hoveredLocation.coords);
              const arcD = buildArcPath(fromPt, toPt);
              return (
                <g pointerEvents="none">
                  <path
                    d={arcD}
                    fill="none"
                    stroke="#fde047"
                    strokeWidth={1.8 * strokeScale}
                    strokeDasharray={`${5 * strokeScale} ${3 * strokeScale}`}
                    strokeOpacity="0.95"
                    className="animate-route-dash"
                  />
                  <circle
                    cx={fromPt[0]}
                    cy={fromPt[1]}
                    r={3.2 * invScale}
                    fill="#fde047"
                    stroke="#0f172a"
                    strokeWidth={0.8 * invScale}
                  />
                </g>
              );
            })()}

            {/* Civilization Bloc Labels with Atlantic/Pacific Leader Lines & Subjugated Crown Icon */}
            <g pointerEvents="none">
              {WORLD_BLOCS.map((bloc) => {
                const [lx, ly] = geoBundle.projectPoint(bloc.labelCoords);
                const isActive = activeBloc?.id === bloc.id;
                const hasContent = (blocMissionStats[bloc.id]?.total ?? 0) > 0;
                const isSubjugated = bloc.factionKind === 'imperial_colony';
                const { stroke } = getBlocColors(bloc);

                // In zoomed-in view (>3.6x), hide Atlantic callouts for Europe so local micro-labels own the stage
                if (bloc.leaderTarget && camera.z > 3.6 && !isActive) {
                  return null;
                }

                const leaderEnd = bloc.leaderTarget
                  ? geoBundle.projectPoint(bloc.leaderTarget)
                  : null;
                const align = bloc.labelAlign ?? 'middle';
                const displayText = isSubjugated
                  ? `♛ ${bloc.shortName}`
                  : bloc.shortName;

                const labelOpacity = isActive
                  ? 1
                  : hasContent || lens === 'empires'
                    ? 0.92
                    : 0.54;

                return (
                  <g key={`label-${bloc.id}`} opacity={labelOpacity}>
                    {leaderEnd && (
                      <>
                        <line
                          x1={lx + (align === 'end' ? 3 * invScale : -3 * invScale)}
                          y1={ly}
                          x2={leaderEnd[0]}
                          y2={leaderEnd[1]}
                          stroke={stroke}
                          strokeOpacity={isActive ? 0.95 : 0.6}
                          strokeWidth={0.85 * strokeScale}
                        />
                        <circle
                          cx={leaderEnd[0]}
                          cy={leaderEnd[1]}
                          r={1.6 * invScale}
                          fill={stroke}
                        />
                      </>
                    )}
                    <g
                      transform={`translate(${lx.toFixed(1)}, ${ly.toFixed(1)}) scale(${invScale.toFixed(3)})`}
                    >
                      <text
                        textAnchor={align}
                        y="3"
                        fill="#020617"
                        stroke="#020617"
                        strokeWidth="3.2"
                        strokeLinejoin="round"
                        fontSize={isActive ? 9.2 : hasContent ? 8.2 : 7.4}
                        fontWeight="800"
                        letterSpacing="0.09em"
                      >
                        {displayText}
                      </text>
                      <text
                        textAnchor={align}
                        y="3"
                        fill={
                          isActive
                            ? '#fef3c7'
                            : isSubjugated && lens === 'regions'
                              ? '#fcd34d'
                              : stroke
                        }
                        fontSize={isActive ? 9.2 : hasContent ? 8.2 : 7.4}
                        fontWeight="800"
                        letterSpacing="0.09em"
                      >
                        {displayText}
                      </text>
                    </g>
                  </g>
                );
              })}
            </g>

            {/* Micro-Landmarks that fade in cleanly when zoomed in */}
            <g pointerEvents="none">
              {ZOOM_LANDMARKS.filter((lm) => camera.z >= lm.minZoom).map((lm) => {
                const [lx, ly] = geoBundle.projectPoint(lm.coords);
                return (
                  <g
                    key={lm.id}
                    transform={`translate(${lx.toFixed(1)}, ${ly.toFixed(1)}) scale(${invScale.toFixed(3)})`}
                    opacity={0.82}
                  >
                    <text
                      textAnchor="middle"
                      y="2"
                      fill="#020617"
                      stroke="#020617"
                      strokeWidth="2.5"
                      fontSize="6.8"
                      fontWeight="700"
                      letterSpacing="0.11em"
                    >
                      {lm.label}
                    </text>
                    <text
                      textAnchor="middle"
                      y="2"
                      fill={lm.color}
                      fontSize="6.8"
                      fontWeight="700"
                      letterSpacing="0.11em"
                    >
                      {lm.label}
                    </text>
                  </g>
                );
              })}
            </g>

            {/* GLOBAL VIEW: Numeric Cluster Badges per Active Bloc (Unclutters Europe & Poké-Japan!) */}
            {isClusteredGlobalView && (
              <g>
                {WORLD_BLOCS.filter((b) => (blocMissionStats[b.id]?.total ?? 0) > 0).map(
                  (bloc) => {
                    const st = blocMissionStats[bloc.id];
                    const [cx, cy] = geoBundle.projectPoint(bloc.center);
                    const isFocused = activeBloc?.id === bloc.id;

                    return (
                      <g
                        key={`cluster-${bloc.id}`}
                        transform={`translate(${cx.toFixed(2)}, ${cy.toFixed(2)}) scale(${invScale.toFixed(3)})`}
                        className="cursor-pointer"
                        onMouseEnter={() => setHoveredBlocId(bloc.id)}
                        onMouseLeave={() => setHoveredBlocId(null)}
                        onClick={(e) => {
                          e.stopPropagation();
                          setManualZoomDelta(0);
                          setSelectedBlocId(bloc.id);
                        }}
                      >
                        {st.hasNextObjective && (
                          <circle
                            r="13"
                            fill="none"
                            stroke="#fbbf24"
                            strokeWidth="1.6"
                            className="animate-ping"
                          />
                        )}
                        <circle
                          r={isFocused ? 11 : 9.5}
                          fill="#090f1f"
                          stroke={st.hasNextObjective ? '#fbbf24' : '#38bdf8'}
                          strokeWidth={st.hasNextObjective ? '2' : '1.5'}
                        />
                        <text
                          textAnchor="middle"
                          y="3.5"
                          fill={st.hasNextObjective ? '#fde047' : '#e0f2fe'}
                          fontSize="9.5"
                          fontWeight="900"
                        >
                          {st.total}
                        </text>
                        <title>{`${bloc.name}: ${st.total} misiones (${st.completedCount} completadas). Haz clic para acercar.`}</title>
                      </g>
                    );
                  }
                )}
              </g>
            )}

            {/* ZOOMED VIEW (or Mission Hovered): Individual Mission Pins with 3+ Visual States */}
            {!isClusteredGlobalView && (
              <g>
                {projectedMissions.map((m) => {
                  const isHovered = hoveredChapterId === m.chapter.id;

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
                      {/* Hover Tactical Crosshair */}
                      {isHovered && (
                        <>
                          <circle
                            r="15"
                            fill="#fbbf24"
                            fillOpacity="0.16"
                            stroke="#fde047"
                            strokeWidth="1.2"
                            strokeDasharray="3 2"
                          />
                          <line x1="-18" y1="0" x2="-11" y2="0" stroke="#fde047" strokeWidth="1.2" />
                          <line x1="11" y1="0" x2="18" y2="0" stroke="#fde047" strokeWidth="1.2" />
                          <line x1="0" y1="-18" x2="0" y2="-11" stroke="#fde047" strokeWidth="1.2" />
                          <line x1="0" y1="11" x2="0" y2="18" stroke="#fde047" strokeWidth="1.2" />
                        </>
                      )}

                      {/* STATE 1: Current Campaign Objective — Animated Pulse Ping */}
                      {m.isNextObjective && (
                        <>
                          <circle
                            r="10.5"
                            fill="none"
                            stroke="#fbbf24"
                            strokeWidth="1.7"
                            className="animate-ping"
                          />
                          <circle
                            r={isHovered ? 6.4 : 5.4}
                            fill="#f59e0b"
                            stroke="#fef08a"
                            strokeWidth="1.6"
                          />
                          <circle r="2.2" fill="#fffbeb" />
                        </>
                      )}

                      {/* STATE 2: Completed — Calm Emerald/Gold Checkmark */}
                      {!m.isNextObjective && m.completed && (
                        <>
                          <circle
                            r={isHovered ? 5.8 : 4.5}
                            fill="#064e3b"
                            stroke="#fbbf24"
                            strokeWidth="1.3"
                          />
                          <path
                            d="M -2.2 0.2 L -0.6 1.8 L 2.4 -1.6"
                            fill="none"
                            stroke="#fde047"
                            strokeWidth="1.4"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </>
                      )}

                      {/* STATE 3: Locked — Muted Slate Pin with Padlock Glyph */}
                      {!m.isNextObjective && !m.completed && !m.unlocked && (
                        <>
                          <circle
                            r={isHovered ? 5.6 : 4.3}
                            fill="#1e293b"
                            stroke="#64748b"
                            strokeWidth="1.2"
                          />
                          {/* Tiny padlock vector */}
                          <rect
                            x="-1.8"
                            y="-0.3"
                            width="3.6"
                            height="2.7"
                            rx="0.6"
                            fill="#94a3b8"
                          />
                          <path
                            d="M -1.1 -0.3 V -1.3 A 1.1 1.1 0 0 1 1.1 -1.3 V -0.3"
                            fill="none"
                            stroke="#94a3b8"
                            strokeWidth="0.9"
                          />
                        </>
                      )}

                      {/* STATE 4: Unlocked Optional / Side Encounter — Diamond Marker */}
                      {!m.isNextObjective && !m.completed && m.unlocked && (
                        <>
                          {m.isOptional ? (
                            <rect
                              x={isHovered ? -4.2 : -3.4}
                              y={isHovered ? -4.2 : -3.4}
                              width={isHovered ? 8.4 : 6.8}
                              height={isHovered ? 8.4 : 6.8}
                              rx="1"
                              transform="rotate(45)"
                              fill={isHovered ? '#fde047' : '#38bdf8'}
                              stroke="#020617"
                              strokeWidth="1.2"
                            />
                          ) : (
                            <circle
                              r={isHovered ? 5.8 : 4.4}
                              fill={isHovered ? '#fde047' : '#f59e0b'}
                              stroke="#020617"
                              strokeWidth="1.3"
                            />
                          )}
                          <circle r="1.4" fill="#ffffff" />
                        </>
                      )}

                      <title>{`${m.chapter.number}: ${m.chapter.title} — ${m.loc.locationName} (${
                        m.isNextObjective
                          ? 'Objetivo Actual'
                          : m.completed
                            ? 'Completada'
                            : m.unlocked
                              ? 'Disponible'
                              : 'Bloqueada'
                      })`}</title>
                    </g>
                  );
                })}
              </g>
            )}
          </g>
        </svg>

        {/* Top-Left Telemetry Badge */}
        <div className="pointer-events-none absolute left-2.5 top-2.5 flex flex-wrap items-center gap-1.5">
          <span className="inline-flex items-center gap-1.5 rounded-lg border border-amber-400/35 bg-slate-950/88 px-2.5 py-1 text-[10px] font-bold text-amber-200 backdrop-blur-sm">
            <Crosshair className="h-3 w-3 text-amber-400" />
            {hoveredLocation
              ? hoveredLocation.locationName
              : selectedBlocId
                ? BLOC_BY_ID[selectedBlocId].shortName
                : `VISTA GLOBAL · ${WORLD_BLOCS.length} BLOQUES`}
          </span>
          {camera.z > 1.05 && (
            <span className="font-mono-code rounded-lg border border-slate-700/90 bg-slate-950/88 px-1.5 py-1 text-[10px] font-bold text-sky-300 backdrop-blur-sm">
              {camera.z.toFixed(1)}x
            </span>
          )}
        </div>

        {/* Top-Right Zero-Friction "Siguiente Objetivo" Button */}
        {nextObjectiveChapter && nextObjectiveLocation && (
          <div className="absolute right-2.5 top-2.5 z-20 flex items-center gap-1">
            <button
              type="button"
              onMouseEnter={() => onHoverChapterPin(nextObjectiveChapter.id)}
              onMouseLeave={() => onHoverChapterPin(null)}
              onClick={handleJumpToNextObjective}
              className="inline-flex max-w-[240px] items-center gap-1.5 rounded-xl border border-amber-400/60 bg-slate-950/92 px-2.5 py-1 text-[10px] font-extrabold text-amber-100 shadow-lg shadow-amber-500/15 backdrop-blur-md transition hover:border-amber-300 hover:bg-amber-500/20 cursor-pointer"
              title={`Enfocar siguiente objetivo: ${nextObjectiveChapter.title}`}
            >
              <Navigation className="h-3 w-3 shrink-0 text-amber-400" />
              <span className="truncate">
                Siguiente: {nextObjectiveChapter.title}
              </span>
            </button>
            <button
              type="button"
              onClick={() => onLaunchChapter(nextObjectiveChapter)}
              className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 p-1.5 text-slate-950 shadow-lg transition hover:brightness-110 cursor-pointer"
              title={`Jugar ahora: ${nextObjectiveChapter.title}`}
            >
              <Play className="h-3 w-3 fill-current" />
            </button>
          </div>
        )}

        {/* Floating Mission Callout Overlay when hovering a Chapter Card or Pin */}
        {hoveredChapter && hoveredLocation && (
          <div className="pointer-events-none absolute bottom-2.5 left-2.5 right-2.5 z-20 flex items-end justify-between gap-2">
            <div className="max-w-md rounded-2xl border border-amber-400/50 bg-slate-950/92 px-3 py-2 shadow-2xl backdrop-blur-md">
              <div className="flex flex-wrap items-center gap-1.5">
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
              <p className="mt-0.5 font-display text-xs font-bold text-white sm:text-sm">
                {hoveredChapter.title}
              </p>
              <p className="text-[10px] leading-snug text-slate-300">
                <strong className="text-amber-200">{hoveredLocation.locationName}:</strong>{' '}
                {hoveredLocation.theaterNote}
              </p>
            </div>
          </div>
        )}

        {/* Bottom Legend Strip (Compact, context-aware for Global vs. Zoomed) */}
        {!hoveredChapter && (
          <div className="pointer-events-none absolute bottom-2.5 left-2.5 right-2.5 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 rounded-lg border border-slate-800/90 bg-slate-950/80 px-2 py-1 text-[9.5px] text-slate-300 backdrop-blur-sm">
              <Compass className="h-3 w-3 shrink-0 text-amber-400/90" />
              <span>
                {lens === 'empires'
                  ? 'Carmesí + franjas = Dominio del Imperio de Galar (Último Ditto)'
                  : isClusteredGlobalView
                    ? '♛ Colonia subyugada · Clic en un número para abrir pines'
                    : 'Zoom activo · Clic en un pin para ir a su tarjeta'}
              </span>
            </div>

            {!isClusteredGlobalView && (
              <div className="hidden items-center gap-2.5 rounded-lg border border-slate-800/90 bg-slate-950/85 px-2.5 py-1 text-[9.5px] font-semibold text-slate-300 backdrop-blur-sm sm:flex">
                <span className="inline-flex items-center gap-1 text-amber-300">
                  <span className="h-2 w-2 rounded-full bg-amber-400" />
                  Objetivo
                </span>
                <span className="inline-flex items-center gap-1 text-emerald-300">
                  ✓ Hecha
                </span>
                <span className="inline-flex items-center gap-1 text-sky-300">
                  ◇ Opcional
                </span>
                <span className="inline-flex items-center gap-1 text-slate-400">
                  🔒 Bloqueada
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Single-Row Horizontal Scrollable Region Carousel (Saves Vertical Space!) */}
      <div className="flex flex-nowrap items-center gap-1.5 overflow-x-auto no-scrollbar border-t border-slate-800/80 bg-slate-950/65 px-3 py-2">
        {WORLD_BLOCS.map((bloc) => {
          const isSelected = selectedBlocId === bloc.id;
          const isHoveredTarget = hoveredLocation?.blocId === bloc.id;
          const colors = getBlocColors(bloc);
          const stats = blocMissionStats[bloc.id];
          const hasContent = (stats?.total ?? 0) > 0;
          const isColony = bloc.factionKind === 'imperial_colony';

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
              className={`inline-flex shrink-0 items-center gap-1.5 rounded-lg border px-2 py-1 text-[10px] font-bold transition cursor-pointer ${
                isSelected || isHoveredTarget
                  ? 'border-amber-400 bg-amber-500/20 text-white shadow-sm shadow-amber-500/20'
                  : hasContent
                    ? 'border-slate-700 bg-slate-900/95 text-slate-100 hover:border-amber-400/50'
                    : 'border-slate-800/80 bg-slate-900/50 text-slate-400 hover:border-slate-600 hover:text-slate-200'
              }`}
            >
              <span
                className={`h-2 w-2 shrink-0 rounded-full border border-black/40 ${
                  hasContent || lens === 'empires' ? '' : 'opacity-50'
                }`}
                style={{ backgroundColor: colors.fill }}
              />
              <span>
                {isColony ? '♛ ' : ''}
                {bloc.shortName}
              </span>
              {hasContent && (
                <span className="font-mono-code rounded bg-slate-950/90 px-1 text-[9px] text-amber-300">
                  {stats.total}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Geopolitical Dossier + Combat Threat Logistics */}
      <div className="border-t border-slate-800/90 bg-slate-950/90 px-3.5 py-3">
        {activeBloc ? (
          <div className="space-y-2">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <div className="flex flex-wrap items-center gap-1.5">
                  <span
                    className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[9.5px] font-extrabold ${
                      FACTION_KIND_META[activeBloc.factionKind].pillClass
                    }`}
                  >
                    <Sparkles className="h-2.5 w-2.5" />
                    {activeBloc.factionBadge}
                  </span>
                  <span
                    className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[9.5px] font-extrabold ${
                      getThreatStyles(activeBloc.combatLogistics.threatLevel).badge
                    }`}
                  >
                    <ShieldAlert className="h-2.5 w-2.5" />
                    Amenaza: {activeBloc.combatLogistics.threatLevel}
                    <span className="ml-0.5 inline-flex gap-0.5">
                      {[1, 2, 3, 4, 5].map((pip) => (
                        <span
                          key={pip}
                          className={`h-1.5 w-1.5 rounded-full ${
                            pip <= activeBloc.combatLogistics.threatTier
                              ? getThreatStyles(
                                  activeBloc.combatLogistics.threatLevel
                                ).pip
                              : 'bg-slate-700'
                          }`}
                        />
                      ))}
                    </span>
                  </span>
                </div>
                <h3 className="mt-1 font-display text-sm font-bold text-white">
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

            <p className="text-[11.5px] leading-relaxed text-slate-300">
              {activeBloc.loreSummary}
            </p>

            {/* Logistics & Geopolitics Strip */}
            <div className="grid gap-1.5 text-[10.5px] sm:grid-cols-2">
              <div className="rounded-xl border border-slate-800/90 bg-slate-900/75 px-2.5 py-1.5">
                <span className="block text-[9px] font-extrabold uppercase tracking-wider text-rose-300/90">
                  Logística de Combate · {activeBloc.combatLogistics.levelCapRange}
                </span>
                <span className="block font-semibold text-slate-100">
                  {activeBloc.combatLogistics.predominantFormat}
                </span>
                <span className="text-[10px] text-slate-400">
                  {activeBloc.combatLogistics.prepTip}
                </span>
              </div>
              <div className="rounded-xl border border-slate-800/90 bg-slate-900/75 px-2.5 py-1.5">
                <span className="block text-[9px] font-extrabold uppercase tracking-wider text-amber-300/90">
                  Recurso & Clave del AU
                </span>
                <span className="block font-semibold text-slate-100">
                  {activeBloc.keyResource}
                </span>
                <span className="text-[10px] text-sky-300/85">
                  {activeBloc.featuredCanonClue}
                </span>
              </div>
            </div>

            {/* Quick mission buttons when locked onto an active region */}
            {activeBlocMissions.length > 0 && selectedBlocId === activeBloc.id && (
              <div className="pt-0.5">
                <p className="mb-1 text-[9.5px] font-bold uppercase tracking-wider text-slate-400">
                  Teatros en esta región ({activeBlocMissions.length})
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
                      className={`inline-flex items-center gap-1 rounded-lg border px-2 py-1 text-[10.5px] font-bold transition cursor-pointer ${
                        m.isNextObjective
                          ? 'border-amber-400 bg-amber-500/25 text-amber-100'
                          : m.completed
                            ? 'border-emerald-500/35 bg-emerald-500/10 text-emerald-200 hover:bg-emerald-500/20'
                            : m.unlocked
                              ? 'border-slate-700 bg-slate-900 text-slate-100 hover:border-amber-400/50'
                              : 'border-slate-800 bg-slate-950 text-slate-500'
                      }`}
                    >
                      {m.completed ? (
                        <span className="text-amber-300">✓</span>
                      ) : m.unlocked ? (
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
          <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400">
            <p>
              <strong className="text-amber-200">Sala de Guerra:</strong>{' '}
              Regiones iluminadas = teatros activos ({chapters.length} misiones). Regiones en{' '}
              <span className="text-slate-300">niebla de guerra</span> = próximas fronteras del exilio; haz clic en cualquiera para ver su dossier y nivel de amenaza.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
