import { GoogleGenAI } from '@google/genai';
import type { AISettings } from '../types/game';

const AI_SETTINGS_STORAGE_KEY = 'galar-crown-ai-settings-v1';

export const GEMINI_MODEL_OPTIONS = [
  {
    id: 'gemini-4-hydrogen',
    label: 'Gemini 4 Hydrogen (Recomendado · Rápido y equilibrado)',
  },
  {
    id: 'gemini-3.5-flash-lite',
    label: 'Gemini 3.5 Flash-Lite (Ultra rápido · Mínimo costo)',
  },
  {
    id: 'gemini-4-argon',
    label: 'Gemini 4 Argon (Razonamiento táctico avanzado)',
  },
] as const;

export function getEnvGeminiApiKey(): string {
  try {
    const env = (import.meta as unknown as { env?: Record<string, string> })
      ?.env;
    return (env?.VITE_GEMINI_API_KEY ?? '').trim();
  } catch {
    return '';
  }
}

export function getDefaultAISettings(): AISettings {
  const envKey = getEnvGeminiApiKey();
  return {
    provider: envKey ? 'gemini' : 'offline',
    geminiApiKey: '',
    geminiModel: 'gemini-4-hydrogen',
    ollamaBaseUrl: 'http://localhost:11434',
    ollamaModel: 'llama3.1:8b',
    // Strictly DORMANT by default (0 tokens spent during regular gameplay)
    enableLlmOpponent: false,
  };
}

export function loadAISettings(): AISettings {
  const defaults = getDefaultAISettings();
  try {
    if (typeof localStorage === 'undefined') return defaults;
    const raw = localStorage.getItem(AI_SETTINGS_STORAGE_KEY);
    if (!raw) return defaults;
    const parsed = JSON.parse(raw) as Partial<AISettings>;
    return {
      provider:
        parsed.provider === 'gemini' ||
        parsed.provider === 'ollama' ||
        parsed.provider === 'offline'
          ? parsed.provider
          : defaults.provider,
      geminiApiKey:
        typeof parsed.geminiApiKey === 'string'
          ? parsed.geminiApiKey
          : defaults.geminiApiKey,
      geminiModel:
        typeof parsed.geminiModel === 'string' && parsed.geminiModel.trim()
          ? parsed.geminiModel.trim()
          : defaults.geminiModel,
      ollamaBaseUrl:
        typeof parsed.ollamaBaseUrl === 'string' && parsed.ollamaBaseUrl.trim()
          ? parsed.ollamaBaseUrl.trim()
          : defaults.ollamaBaseUrl,
      ollamaModel:
        typeof parsed.ollamaModel === 'string' && parsed.ollamaModel.trim()
          ? parsed.ollamaModel.trim()
          : defaults.ollamaModel,
      enableLlmOpponent: Boolean(parsed.enableLlmOpponent),
    };
  } catch {
    return defaults;
  }
}

export function saveAISettings(settings: AISettings): void {
  try {
    if (typeof localStorage === 'undefined') return;
    localStorage.setItem(AI_SETTINGS_STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // ignore storage quota errors
  }
}

export function resolveEffectiveGeminiKey(settings: AISettings): string {
  return settings.geminiApiKey.trim() || getEnvGeminiApiKey();
}

export function isLiveLLMConfigured(settings: AISettings): boolean {
  if (settings.provider === 'gemini') {
    return resolveEffectiveGeminiKey(settings).length > 0;
  }
  if (settings.provider === 'ollama') {
    return (
      settings.ollamaBaseUrl.trim().length > 0 &&
      settings.ollamaModel.trim().length > 0
    );
  }
  return false;
}

export function getActiveProviderLabel(settings: AISettings): string {
  if (settings.provider === 'gemini') {
    return resolveEffectiveGeminiKey(settings)
      ? `Gemini (${settings.geminiModel})`
      : 'Gemini (Sin API Key)';
  }
  if (settings.provider === 'ollama') {
    return `Ollama (${settings.ollamaModel})`;
  }
  return 'Modo Offline / Demo';
}

function extractJsonObject(raw: string): string {
  const trimmed = raw.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenced ? fenced[1].trim() : trimmed;
  const firstBrace = candidate.indexOf('{');
  const lastBrace = candidate.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace > firstBrace) {
    return candidate.slice(firstBrace, lastBrace + 1);
  }
  return candidate;
}

export interface StructuredLLMRequest {
  settings: AISettings;
  systemInstruction: string;
  userPrompt: string;
  jsonSchema: Record<string, unknown>;
  temperature?: number;
  timeoutMs?: number;
}

export interface StructuredLLMResult<T> {
  data: T;
  provider: 'gemini' | 'ollama';
  modelLabel: string;
}

/**
 * Provider-agnostic Structured JSON call:
 * - Gemini via official `@google/genai` Interactions API (`client.interactions.create` + `response_format`)
 * - Ollama via local `/api/chat` with `format: "json"`
 */
export async function callStructuredLLM<T>(
  req: StructuredLLMRequest
): Promise<StructuredLLMResult<T>> {
  const {
    settings,
    systemInstruction,
    userPrompt,
    jsonSchema,
    temperature = 0.4,
    timeoutMs = 28000,
  } = req;

  if (settings.provider === 'gemini') {
    const apiKey = resolveEffectiveGeminiKey(settings);
    if (!apiKey) {
      throw new Error(
        'Falta configurar la API Key de Gemini (en Configuración de IA o en VITE_GEMINI_API_KEY).'
      );
    }
    const client = new GoogleGenAI({ apiKey });
    const interactionPromise = client.interactions.create({
      model: settings.geminiModel || 'gemini-4-hydrogen',
      system_instruction: systemInstruction,
      input: userPrompt,
      store: false,
      generation_config: {
        temperature,
      },
      response_format: {
        type: 'text',
        mime_type: 'application/json',
        schema: jsonSchema,
      },
    });

    const interaction = await Promise.race([
      interactionPromise,
      new Promise<never>((_, reject) =>
        setTimeout(
          () => reject(new Error('Tiempo de espera agotado con Gemini API.')),
          timeoutMs
        )
      ),
    ]);

    const rawText = interaction.output_text ?? '';
    if (!rawText.trim()) {
      throw new Error('Gemini devolvió una respuesta vacía.');
    }

    const parsed = JSON.parse(extractJsonObject(rawText)) as T;
    return {
      data: parsed,
      provider: 'gemini',
      modelLabel: `Gemini · ${settings.geminiModel}`,
    };
  }

  if (settings.provider === 'ollama') {
    const base = settings.ollamaBaseUrl.replace(/\/+$/, '');
    const model = settings.ollamaModel.trim() || 'llama3.1:8b';
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(`${base}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          model,
          stream: false,
          format: 'json',
          options: { temperature },
          messages: [
            {
              role: 'system',
              content: `${systemInstruction}\n\nRespond ONLY with a valid JSON object matching this JSON Schema:\n${JSON.stringify(jsonSchema)}`,
            },
            { role: 'user', content: userPrompt },
          ],
        }),
      });

      if (!response.ok) {
        const errBody = await response.text().catch(() => '');
        throw new Error(
          `Ollama respondió ${response.status}: ${errBody.slice(0, 140) || response.statusText}`
        );
      }

      const json = (await response.json()) as {
        message?: { content?: string };
        response?: string;
      };
      const rawText = json.message?.content ?? json.response ?? '';
      if (!rawText.trim()) {
        throw new Error('Ollama devolvió contenido vacío.');
      }

      const parsed = JSON.parse(extractJsonObject(rawText)) as T;
      return {
        data: parsed,
        provider: 'ollama',
        modelLabel: `Ollama · ${model}`,
      };
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        throw new Error(
          `Tiempo de espera agotado conectando a Ollama (${base}).`
        );
      }
      throw err;
    } finally {
      clearTimeout(timer);
    }
  }

  throw new Error(
    'El proveedor de IA está en Modo Offline. Activa Gemini u Ollama en Configuración.'
  );
}
