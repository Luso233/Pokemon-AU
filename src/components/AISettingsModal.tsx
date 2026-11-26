import React, { useState } from 'react';
import {
  Bot,
  Check,
  Cpu,
  Eye,
  EyeOff,
  KeyRound,
  Server,
  ShieldCheck,
  Sparkles,
  WifiOff,
  X,
} from 'lucide-react';
import {
  GEMINI_MODEL_OPTIONS,
  getEnvGeminiApiKey,
  isLiveLLMConfigured,
} from '../engine/aiProvider';
import type { AIProviderKind, AISettings } from '../types/game';

interface AISettingsModalProps {
  open: boolean;
  settings: AISettings;
  onSave: (next: AISettings) => void;
  onClose: () => void;
}

export const AISettingsModal: React.FC<AISettingsModalProps> = ({
  open,
  settings,
  onSave,
  onClose,
}) => {
  const [draft, setDraft] = useState<AISettings>(settings);
  const [showKey, setShowKey] = useState(false);
  const envKeyPresent = getEnvGeminiApiKey().length > 0;

  React.useEffect(() => {
    if (open) setDraft(settings);
  }, [open, settings]);

  if (!open) return null;

  const liveReady = isLiveLLMConfigured(draft);

  const providers: Array<{
    id: AIProviderKind;
    title: string;
    subtitle: string;
    icon: React.FC<{ className?: string }>;
  }> = [
    {
      id: 'gemini',
      title: 'Gemini API',
      subtitle: '@google/genai · JSON estructurado rápido',
      icon: Sparkles,
    },
    {
      id: 'ollama',
      title: 'Ollama Local',
      subtitle: '100% gratis y offline en localhost:11434',
      icon: Server,
    },
    {
      id: 'offline',
      title: 'Modo Demo Offline',
      subtitle: '0 tokens · Arquetipos legales y coach local',
      icon: WifiOff,
    },
  ];

  const handleSave = () => {
    onSave(draft);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
      <div className="w-full max-w-2xl overflow-hidden rounded-3xl border border-amber-400/35 bg-[#080d1a] text-slate-100 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 bg-slate-950/90 px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-amber-400/40 bg-amber-500/15 text-amber-300">
              <Bot className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-display text-lg font-bold text-white">
                Configuración de IA · Teambuilder & Coach
              </h2>
              <p className="text-[11px] text-slate-400">
                Guardado únicamente en tu navegador (<code className="text-amber-300">localStorage</code>)
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-800 hover:text-white cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="max-h-[75vh] space-y-5 overflow-y-auto px-6 py-5">
          {/* Provider selector */}
          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-wider text-amber-300">
              1. Motor de Inteligencia Artificial
            </p>
            <div className="grid gap-2.5 sm:grid-cols-3">
              {providers.map((p) => {
                const Icon = p.icon;
                const active = draft.provider === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setDraft({ ...draft, provider: p.id })}
                    className={`flex flex-col items-start rounded-2xl border p-3.5 text-left transition cursor-pointer ${
                      active
                        ? 'border-amber-400 bg-amber-500/15 shadow-lg shadow-amber-500/10'
                        : 'border-slate-800 bg-slate-900/70 hover:border-slate-700'
                    }`}
                  >
                    <Icon
                      className={`h-4 w-4 ${active ? 'text-amber-300' : 'text-slate-400'}`}
                    />
                    <span className="mt-2 text-xs font-extrabold text-white">
                      {p.title}
                    </span>
                    <span className="mt-0.5 text-[10px] leading-snug text-slate-400">
                      {p.subtitle}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Gemini Config */}
          {draft.provider === 'gemini' && (
            <div className="space-y-3 rounded-2xl border border-sky-400/25 bg-slate-950/75 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <label className="flex items-center gap-1.5 text-xs font-bold text-sky-200">
                  <KeyRound className="h-3.5 w-3.5" />
                  Gemini API Key
                </label>
                {envKeyPresent && (
                  <span className="rounded-full border border-emerald-400/40 bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold text-emerald-300">
                    Detectada en VITE_GEMINI_API_KEY
                  </span>
                )}
              </div>
              <div className="relative">
                <input
                  type={showKey ? 'text' : 'password'}
                  value={draft.geminiApiKey}
                  onChange={(e) =>
                    setDraft({ ...draft, geminiApiKey: e.target.value })
                  }
                  placeholder={
                    envKeyPresent
                      ? 'Usando VITE_GEMINI_API_KEY (o escribe otra para sobrescribir)'
                      : 'AIzaSy...'
                  }
                  className="font-mono-code w-full rounded-xl border border-slate-700 bg-slate-900 py-2 pr-10 pl-3 text-xs text-slate-100 placeholder:text-slate-500 focus:border-amber-400 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowKey((v) => !v)}
                  className="absolute top-1/2 right-2.5 -translate-y-1/2 text-slate-400 hover:text-white cursor-pointer"
                >
                  {showKey ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>

              <div>
                <label className="mb-1 block text-xs font-bold text-slate-300">
                  Modelo Gemini
                </label>
                <select
                  value={draft.geminiModel}
                  onChange={(e) =>
                    setDraft({ ...draft, geminiModel: e.target.value })
                  }
                  className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-slate-100 focus:border-amber-400 focus:outline-none"
                >
                  {GEMINI_MODEL_OPTIONS.map((opt) => (
                    <option key={opt.id} value={opt.id}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Ollama Config */}
          {draft.provider === 'ollama' && (
            <div className="space-y-3 rounded-2xl border border-emerald-400/25 bg-slate-950/75 p-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-bold text-emerald-200">
                    Endpoint de Ollama
                  </label>
                  <input
                    type="text"
                    value={draft.ollamaBaseUrl}
                    onChange={(e) =>
                      setDraft({ ...draft, ollamaBaseUrl: e.target.value })
                    }
                    placeholder="http://localhost:11434"
                    className="font-mono-code w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-slate-100 focus:border-amber-400 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-bold text-emerald-200">
                    Modelo Local
                  </label>
                  <input
                    type="text"
                    value={draft.ollamaModel}
                    onChange={(e) =>
                      setDraft({ ...draft, ollamaModel: e.target.value })
                    }
                    placeholder="llama3.1:8b / qwen2.5:7b / gemma3"
                    className="font-mono-code w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-slate-100 focus:border-amber-400 focus:outline-none"
                  />
                </div>
              </div>
              <p className="text-[11px] leading-relaxed text-slate-400">
                Nota: Si el navegador bloquea CORS en local, inicia Ollama con{' '}
                <code className="text-emerald-300">OLLAMA_ORIGINS=*</code>. El bucle de
                autocuración con <code className="text-amber-300">TeamValidator</code> corregirá
                automáticamente movimientos o EVs inválidos.
              </p>
            </div>
          )}

          {/* Feature Flag: Stateless LLM Rival Opponent (Dormant by default) */}
          <div className="rounded-2xl border border-violet-400/30 bg-violet-950/20 p-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <Cpu className="h-4 w-4 text-violet-300" />
                  <span className="text-xs font-extrabold text-white">
                    Feature Flag: Entrenador Rival controlado por LLM
                  </span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                      draft.enableLlmOpponent && liveReady
                        ? 'bg-violet-500/25 text-violet-200 border border-violet-400/40'
                        : 'bg-slate-800 text-slate-400 border border-slate-700'
                    }`}
                  >
                    {draft.enableLlmOpponent && liveReady
                      ? 'ACTIVO · ~350 tokens/turno'
                      : 'INERTE · 0 tokens (Heurística local)'}
                  </span>
                </div>
                <p className="mt-1.5 text-[11px] leading-relaxed text-slate-300">
                  Desactivado por defecto. Si lo activas, la IA rival usará{' '}
                  <code className="text-violet-300">LLMController</code> enviando solo una foto
                  stateless compacta del tablero actual (nunca el historial entero). En caso de
                  error o timeout cae automáticamente a la heurística local.
                </p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={draft.enableLlmOpponent}
                onClick={() =>
                  setDraft({
                    ...draft,
                    enableLlmOpponent: !draft.enableLlmOpponent,
                  })
                }
                className={`relative mt-1 inline-flex h-6 w-11 shrink-0 items-center rounded-full border transition cursor-pointer ${
                  draft.enableLlmOpponent
                    ? 'border-violet-300 bg-violet-500'
                    : 'border-slate-700 bg-slate-800'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition ${
                    draft.enableLlmOpponent ? 'translate-x-5' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
            {draft.enableLlmOpponent && !liveReady && (
              <p className="mt-2 rounded-lg border border-amber-400/35 bg-amber-500/10 px-2.5 py-1.5 text-[11px] text-amber-200">
                Configura Gemini API Key u Ollama arriba para que el entrenador LLM tome el control; mientras tanto seguirá usando la heurística local.
              </p>
            )}
          </div>

          <div className="flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900/60 px-3.5 py-2.5 text-[11px] text-slate-300">
            <ShieldCheck className="h-4 w-4 shrink-0 text-emerald-400" />
            <span>
              <strong>Modo Coach estilo Chess.com</strong> (botón «¿Qué haría el Coach?» en batalla
              y «Game Review» al terminar) funciona siempre bajo demanda para no gastar tokens innecesarios.
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2.5 border-t border-slate-800 bg-slate-950/90 px-6 py-3.5">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-700 bg-slate-900 px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 px-5 py-2 text-xs font-extrabold text-slate-950 shadow-lg shadow-amber-500/20 hover:brightness-110 cursor-pointer"
          >
            <Check className="h-4 w-4" />
            Guardar Configuración
          </button>
        </div>
      </div>
    </div>
  );
};
