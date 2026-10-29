// Shared between the browser and the server, so keep this file free of
// Node-only imports.

export type ProviderId = "claude" | "lmstudio" | "ollama";

export interface ModelSettings {
  provider: ProviderId;
  /** Only used for Claude. Leave blank to use the server's ANTHROPIC_API_KEY. */
  apiKey: string;
  /** Only used for local models, e.g. http://localhost:1234/v1 */
  baseUrl: string;
  model: string;
}

export interface ProviderInfo {
  id: ProviderId;
  label: string;
  description: string;
  defaultBaseUrl: string;
  defaultModel: string;
  isLocal: boolean;
}

export const PROVIDERS: Record<ProviderId, ProviderInfo> = {
  claude: {
    id: "claude",
    label: "Claude (Anthropic API)",
    description:
      "Best quality. Needs an Anthropic API key, and each request costs a small amount.",
    defaultBaseUrl: "",
    defaultModel: "claude-opus-5-5",
    isLocal: false,
  },
  lmstudio: {
    id: "lmstudio",
    label: "LM Studio (local, free)",
    description:
      "Runs a model on your own computer. Free and private, but you need to install LM Studio first.",
    defaultBaseUrl: "http://localhost:1234/v1",
    defaultModel: "",
    isLocal: true,
  },
  ollama: {
    id: "ollama",
    label: "Ollama (local, free)",
    description:
      "Runs a model on your own computer. Free and private, but you need to install Ollama first.",
    defaultBaseUrl: "http://localhost:11434/v1",
    defaultModel: "",
    isLocal: true,
  },
};

export function defaultSettings(provider: ProviderId = "claude"): ModelSettings {
  const info = PROVIDERS[provider];
  return {
    provider,
    apiKey: "",
    baseUrl: info.defaultBaseUrl,
    model: info.defaultModel,
  };
}

export interface TestConnectionResult {
  ok: boolean;
  message: string;
  models: string[];
}

/** localStorage key for the user's model settings. */
export const SETTINGS_KEY = "job-helper:settings";
