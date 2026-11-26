import React from 'react';
import { CloudSun, Info, Shield, Sparkles } from 'lucide-react';
import { TooltipPortal } from './TooltipPortal';

interface ActionInfoTooltipProps {
  title: string;
  badge?: string;
  description: string;
  placement?: 'top' | 'bottom' | 'left' | 'right';
  children: React.ReactElement<React.HTMLAttributes<HTMLElement>>;
}

export const ActionInfoTooltip: React.FC<ActionInfoTooltipProps> = ({
  title,
  badge,
  description,
  placement = 'bottom',
  children,
}) => {
  const card = (
    <div className="w-64 rounded-xl border border-amber-400/45 bg-[#0a1020]/98 p-3 text-left shadow-2xl shadow-black/90 backdrop-blur-xl">
      <div className="flex items-center justify-between gap-2 border-b border-slate-800 pb-1.5">
        <span className="inline-flex items-center gap-1.5 text-xs font-extrabold text-amber-200">
          <Info className="h-3.5 w-3.5 text-amber-400" />
          {title}
        </span>
        {badge && (
          <span className="font-mono-code rounded border border-slate-700 bg-slate-900 px-1.5 py-0.5 text-[9px] font-bold text-slate-300">
            {badge}
          </span>
        )}
      </div>
      <p className="mt-1.5 text-[11px] leading-relaxed text-slate-300">
        {description}
      </p>
    </div>
  );

  return (
    <TooltipPortal content={card} placement={placement}>
      {children}
    </TooltipPortal>
  );
};

const FIELD_EFFECT_INFO: Record<string, { title: string; detail: string }> = {
  'sol intenso': {
    title: 'Sol Intenso (Sun)',
    detail:
      'Potencia ataques Fuego ×1.5, reduce Agua ×0.5, Solar Beam no carga, Síntesis/Sol Matinal curan 66% y Protosíntesis se activa.',
  },
  lluvia: {
    title: 'Lluvia (Rain)',
    detail:
      'Potencia ataques Agua ×1.5, reduce Fuego ×0.5, Trueno y Vendaval nunca fallan, y Nado Rápido duplica Velocidad.',
  },
  'tormenta de arena': {
    title: 'Tormenta de Arena (Sandstorm)',
    detail:
      'Aumenta la Def. Esp. de tipo Roca ×1.5 e inflige 1/16 de PS por turno a Pokémon no Roca/Acero/Tierra.',
  },
  nieve: {
    title: 'Nieve (Snow)',
    detail:
      'Aumenta la Defensa física de los Pokémon tipo Hielo ×1.5 y permite activar Velo Aurora y Ventisca sin fallos.',
  },
  'campo eléctrico': {
    title: 'Campo Eléctrico (Electric Terrain)',
    detail:
      'Potencia movimientos Eléctricos ×1.3 en Pokémon tocando suelo, evita el sueño (Espora/Bostezo) y activa Quark Drive / Semilla Electro.',
  },
  'campo de hierba': {
    title: 'Campo de Hierba (Grassy Terrain)',
    detail:
      'Potencia ataques Planta ×1.3, cura 1/16 PS cada turno, debilita Terremoto a la mitad y da prioridad +1 a Fitoimpulso (Grassy Glide).',
  },
  'campo psíquico': {
    title: 'Campo Psíquico (Psychic Terrain)',
    detail:
      'Potencia ataques Psíquicos ×1.3 y bloquea movimientos de prioridad contra Pokémon que tocan el suelo.',
  },
  'campo de niebla': {
    title: 'Campo de Niebla (Misty Terrain)',
    detail:
      'Reduce el daño Dragón ×0.5 y protege contra estados alterados a los Pokémon en el suelo.',
  },
  'trick room': {
    title: 'Espacio Raro (Trick Room)',
    detail:
      'Invierte el orden de velocidad: los Pokémon más lentos actúan primero durante 5 turnos.',
  },
  tailwind: {
    title: 'Viento Afín (Tailwind)',
    detail:
      'Duplica (×2) la Velocidad de todo el bando activo durante 4 turnos.',
  },
  'stealth rock': {
    title: 'Trampa Rocas (Stealth Rock)',
    detail:
      'Inflige daño tipo Roca (6.25% a 50% según efectividad) a cada Pokémon rival al entrar al campo y rompe Focus Sash / Sturdy.',
  },
  spikes: {
    title: 'Púas (Spikes)',
    detail:
      'Inflige daño al entrar a Pokémon que tocan el suelo (1 capa: 12.5%, 2 capas: 16.7%, 3 capas: 25%).',
  },
  reflect: {
    title: 'Reflejo (Reflect)',
    detail:
      'Reduce el daño de ataques físicos recibidos (×0.5 en Individuales, ×0.67 en Dobles). Dura 5 turnos (8 con Light Clay).',
  },
  'light screen': {
    title: 'Pantalla de Luz (Light Screen)',
    detail:
      'Reduce el daño de ataques especiales recibidos (×0.5 en Individuales, ×0.67 en Dobles). Dura 5 turnos (8 con Light Clay).',
  },
};

export function getFormatRuleDescription(formatId: string): string {
  const map: Record<string, string> = {
    gen9vgc2024regg:
      'Reglas oficiales Mundial VGC 2024 Reg G: Dobles 4v4 (Bring 6, Pick 4), Nivel 50, 1 Legendario Restringido, Teracristalización y Open Teamsheets.',
    gen91v1:
      'Formato oficial 1v1: ambos jugadores muestran 3 Pokémon y eligen solo 1 para un combate a muerte súbita sin cambios.',
    gen9monotype:
      'Formato oficial Monotype 6v6 Singles: los 6 Pokémon de cada equipo deben compartir al menos un tipo elemental común.',
    gen9doublescustomgame:
      'Formato Dobles 2v2 personalizable (permite reglas narrativas especiales, Puzzles con condiciones iniciales, Megas y Boss Aces).',
    gen9customgame:
      'Formato Individuales personalizable (usado en Little Cup con cap roto Nv. 5 vs Nv. 6–7 y combates de historia).',
    gen9lc:
      'Little Cup oficial: solo Pokémon básicos en su primera etapa evolutiva al Nivel 5.',
  };
  return (
    map[formatId] ??
    `Simulación oficial en @pkmn/sim bajo reglas del formato ${formatId}.`
  );
}

interface FieldEffectTooltipProps {
  effectName: string;
  turnsLeft?: number | null;
  sideLabel?: string;
  placement?: 'top' | 'bottom' | 'left' | 'right';
  children: React.ReactElement<React.HTMLAttributes<HTMLElement>>;
}

export const FieldEffectTooltip: React.FC<FieldEffectTooltipProps> = ({
  effectName,
  turnsLeft,
  sideLabel,
  placement = 'bottom',
  children,
}) => {
  const key = effectName.toLowerCase();
  const matched = Object.entries(FIELD_EFFECT_INFO).find(([k]) =>
    key.includes(k)
  )?.[1];

  const card = (
    <div className="w-64 rounded-xl border border-sky-400/45 bg-[#0a1020]/98 p-3 text-left shadow-2xl shadow-black/90 backdrop-blur-xl">
      <div className="flex items-center justify-between gap-2 border-b border-slate-800 pb-1.5">
        <span className="inline-flex items-center gap-1.5 text-xs font-extrabold text-sky-200">
          {sideLabel ? (
            <Shield className="h-3.5 w-3.5 text-amber-400" />
          ) : key.includes('trick') ? (
            <Sparkles className="h-3.5 w-3.5 text-violet-400" />
          ) : (
            <CloudSun className="h-3.5 w-3.5 text-amber-400" />
          )}
          {matched?.title ?? effectName}
        </span>
        {turnsLeft != null && (
          <span className="font-mono-code rounded border border-amber-400/40 bg-amber-500/15 px-1.5 py-0.5 text-[9px] font-bold text-amber-200">
            ~{turnsLeft}t
          </span>
        )}
      </div>
      {sideLabel && (
        <p className="mt-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
          Activo en: {sideLabel}
        </p>
      )}
      <p className="mt-1 text-[11px] leading-relaxed text-slate-300">
        {matched?.detail ??
          `Efecto de campo o bando activo (${effectName}) gestionado por @pkmn/sim.`}
      </p>
    </div>
  );

  return (
    <TooltipPortal content={card} placement={placement}>
      {children}
    </TooltipPortal>
  );
};
