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
  /** Claude only: run every task on the cheapest model (Haiku). */
  budgetMode: boolean;
}

/** The model Budget mode runs everything on. */
export const BUDGET_MODEL = "claude-haiku-5-5";

/**
 * Rough cost of one typical run (about 3,000 words in, 2,000 out, plus some
 * thinking), from Anthropic's per-million-token prices:
 * Opus 5.5 $4 in / $20 out, Sonnet 5.5 $2 / $10, Haiku 5.5 $0.10 / $0.50.
 */
export const BUDGET_COST_ESTIMATE = {
  normal: "about 3 to 6 cents for big jobs, 1 to 3 cents for quick ones",
  budget: "about a fifth of a cent or less",
};

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
    budgetMode: false,
  };
}

export interface TestConnectionResult {
  ok: boolean;
  message: string;
  models: string[];
}

/** localStorage key for the user's model settings. */
export const SETTINGS_KEY = "job-helper:settings";
