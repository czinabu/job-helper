// Shared between the browser and the server, so keep this file free of
// Node-only imports.

export type ProviderId = "claude" | "lmstudio" | "ollama";

export interface ModelSettings {
  provider: ProviderId;
  /** Only used for Claude: the visitor's own Anthropic API key. */
  apiKey: string;
  /** Only used for local models, e.g. http://localhost:1234/v1 */
  baseUrl: string;
  /** The model for heavy work, like rewriting a whole resume. */
  model: string;
  /**
   * Claude only: a cheaper model for light work, like short suggestions.
   * Local providers always use `model`.
   */
  quickModel: string;
}

/** How demanding a task is, which decides the Claude model it runs on. */
export type TaskWeight = "heavy" | "light";

export interface ProviderInfo {
  id: ProviderId;
  label: string;
  description: string;
  defaultBaseUrl: string;
  defaultModel: string;
  defaultQuickModel: string;
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
    defaultQuickModel: "claude-sonnet-5-5",
    isLocal: false,
  },
  lmstudio: {
    id: "lmstudio",
    label: "LM Studio (local, free)",
    description:
      "Runs a model on your own computer. Free and private, but you need to install LM Studio first.",
    defaultBaseUrl: "http://localhost:1234/v1",
    defaultModel: "",
    defaultQuickModel: "",
    isLocal: true,
  },
  ollama: {
    id: "ollama",
    label: "Ollama (local, free)",
    description:
      "Runs a model on your own computer. Free and private, but you need to install Ollama first.",
    defaultBaseUrl: "http://localhost:11434/v1",
    defaultModel: "",
    defaultQuickModel: "",
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
    quickModel: info.defaultQuickModel,
  };
}

export interface TestConnectionResult {
  ok: boolean;
  message: string;
  models: string[];
}

/** localStorage key for the user's model settings. */
export const SETTINGS_KEY = "job-helper:settings";
