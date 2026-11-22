import type { AiConfig } from '../types/global';

const DEFAULT_AI_CONFIG: AiConfig = {
  AI_PROVIDER: 'ollama',
  AI_MODEL: 'jp-assistant:latest',
  OLLAMA_MODEL: '',
  GEMINI_MODEL: '',
  OLLAMA_BASE_URL: 'http://localhost:11434',
  GEMINI_API_KEY: '',
  API_BASE: 'http://127.0.0.1:8000/api',
};

function env(key: keyof ImportMetaEnv): string {
  return import.meta.env[key] ?? '';
}

function loadConfigFromEnv(): AiConfig {
  return {
    AI_PROVIDER: env('VITE_AI_PROVIDER') || DEFAULT_AI_CONFIG.AI_PROVIDER,
    AI_MODEL: env('VITE_AI_MODEL') || DEFAULT_AI_CONFIG.AI_MODEL,
    OLLAMA_MODEL: env('VITE_OLLAMA_MODEL'),
    GEMINI_MODEL: env('VITE_GEMINI_MODEL'),
    OLLAMA_BASE_URL: env('VITE_OLLAMA_BASE_URL') || DEFAULT_AI_CONFIG.OLLAMA_BASE_URL,
    GEMINI_API_KEY: env('VITE_GEMINI_API_KEY'),
    API_BASE: env('VITE_API_BASE') || DEFAULT_AI_CONFIG.API_BASE,
  };
}

const config: AiConfig = loadConfigFromEnv();

export function getAiConfig(): AiConfig {
  return config;
}

export { getApiBase } from './config';

export function getAiSettings() {
  const cfg = config;
  const provider = String(cfg.AI_PROVIDER || 'ollama').toLowerCase();
  const defaultModel = cfg.AI_MODEL || 'jp-assistant:latest';
  const model =
    provider === 'ollama'
      ? cfg.OLLAMA_MODEL || defaultModel
      : cfg.GEMINI_MODEL || defaultModel || 'gemini-2.0-flash';
  return {
    provider,
    model,
    ollamaBaseUrl: (cfg.OLLAMA_BASE_URL || 'http://localhost:11434').replace(/\/$/, ''),
    geminiApiKey: cfg.GEMINI_API_KEY || '',
  };
}
