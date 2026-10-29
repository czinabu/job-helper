"use client";

import { useState } from "react";
import {
  BUDGET_COST_ESTIMATE,
  BUDGET_MODEL,
  PROVIDERS,
  defaultSettings,
  type ProviderId,
  type TestConnectionResult,
} from "@/lib/providers";
import { testConnection } from "@/lib/ai";
import { COMPUTER_TYPES } from "@/lib/localModels";
import { useStoredState } from "@/lib/useStoredState";
import { useSettings } from "@/lib/useSettings";

export default function SettingsPage() {
  const { settings, setSettings, remember, setRemember, clearKey } = useSettings();
  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState<TestConnectionResult | null>(null);
  const info = PROVIDERS[settings.provider];

  function chooseProvider(provider: ProviderId) {
    setSettings(defaultSettings(provider));
    setResult(null);
  }

  async function handleTest() {
    setTesting(true);
    setResult(null);
    try {
      const data = await testConnection(settings);
      setResult(data);
      // Pick models automatically if the chosen ones aren't available.
      if (data.ok) {
        const pick = (current: string) =>
          data.models.includes(current) ? current : data.models[0];
        setSettings({
          ...settings,
          model: pick(settings.model),
          quickModel: info.isLocal ? "" : pick(settings.quickModel),
        });
      }
    } finally {
      setTesting(false);
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">Model settings</h1>
        <p className="mt-1 text-sm text-muted">
          Choose which AI model reads your resume. Your settings are saved only in this browser. Nothing you enter here is sent to Job Helper&apos;s server.
        </p>
      </div>

      <fieldset className="space-y-3">
        <legend className="mb-2 text-sm font-medium">Where should the AI run?</legend>
        {Object.values(PROVIDERS).map((p) => (
          <label
            key={p.id}
            className={`flex cursor-pointer gap-3 rounded-lg border p-4 ${
              settings.provider === p.id ? "border-accent bg-card" : "border-line"
            }`}
          >
            <input
              type="radio"
              name="provider"
              checked={settings.provider === p.id}
              onChange={() => chooseProvider(p.id)}
              className="mt-1"
            />
            <span>
              <span className="block font-medium">{p.label}</span>
              <span className="block text-sm text-muted">{p.description}</span>
            </span>
          </label>
        ))}
      </fieldset>

      <div className="space-y-4">
        {info.isLocal ? (
          <div>
            <label className="mb-1 block text-sm font-medium" htmlFor="baseUrl">
              Server address
            </label>
            <input
              id="baseUrl"
              className="field"
              value={settings.baseUrl}
              onChange={(e) => setSettings({ ...settings, baseUrl: e.target.value })}
              placeholder={info.defaultBaseUrl}
            />
            <p className="mt-1 text-xs text-muted">
              The default ({info.defaultBaseUrl}) works unless you changed it in{" "}
              {settings.provider === "lmstudio" ? "LM Studio" : "Ollama"}. New to this? Follow the{" "}
              <a
                className="text-accent underline"
                href="https://github.com/czinabu/job-helper/blob/main/docs/local-models.md"
                target="_blank"
              >
                step-by-step setup guide
              </a>
              .
            </p>
            {settings.provider === "lmstudio" && (
              <p className="mt-1 text-xs text-muted">
                In LM Studio, open the Developer tab, click Server Settings, and switch on{" "}
                <strong>Enable CORS</strong>. Without it, this site can&apos;t connect.
              </p>
            )}
          </div>
        ) : (
          <div>
            <label className="mb-1 block text-sm font-medium" htmlFor="apiKey">
              Anthropic API key
            </label>
            <input
              id="apiKey"
              type="password"
              className="field"
              value={settings.apiKey}
              onChange={(e) => setSettings({ ...settings, apiKey: e.target.value })}
              placeholder="sk-ant-..."
              autoComplete="off"
            />
            <p className="mt-1 text-xs text-muted">
              Get one at{" "}
              <a className="text-accent underline" href="https://console.anthropic.com" target="_blank">
                console.anthropic.com
              </a>
              . Everyone uses their own key, and usage is billed to your Anthropic account.
            </p>
            <label className="mt-3 flex items-start gap-2 text-sm">
              <input
                type="checkbox"
                className="mt-1"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
              />
              <span>
                Remember my key on this device
                <span className="block text-xs text-muted">
                  Off by default: your key is forgotten when you close this tab. Don&apos;t turn
                  this on for a shared or public computer.
                </span>
              </span>
            </label>
            {settings.apiKey && (
              <button type="button" className="btn mt-3" onClick={clearKey}>
                Clear my key
              </button>
            )}
            <div className="mt-3 rounded-lg border border-line bg-card p-3 text-xs text-muted">
              <p className="font-medium text-foreground">Your key and your privacy</p>
              <p className="mt-1">
                Your key and resume go straight from your browser to Anthropic. They never pass
                through Job Helper&apos;s server, and we don&apos;t log or keep them. The key stays
                in this browser only. Use a key with a spending limit, and delete it at
                console.anthropic.com if you ever think it&apos;s been exposed.
              </p>
            </div>
          </div>
        )}

        {info.isLocal && <ModelAdvisor provider={settings.provider} />}

        {!info.isLocal && (
          <div className="rounded-lg border border-line bg-card p-4">
            <label className="flex items-start gap-2 text-sm">
              <input
                type="checkbox"
                className="mt-1"
                checked={settings.budgetMode}
                onChange={(e) => setSettings({ ...settings, budgetMode: e.target.checked })}
              />
              <span>
                <span className="font-medium">Budget mode</span>
                <span className="block text-xs text-muted">
                  Runs every task on Claude Haiku ({BUDGET_MODEL}), the cheapest model. A typical
                  run costs {BUDGET_COST_ESTIMATE.budget}, compared with{" "}
                  {BUDGET_COST_ESTIMATE.normal} on the models below. The tradeoff is quality:
                  Haiku is fast and fine for short suggestions and recommendations, but resume
                  rewrites and cover letters may read less polished and miss subtler details.
                  Costs are rough estimates; your Anthropic account shows the real charges.
                </span>
              </span>
            </label>
          </div>
        )}

        <ModelPicker
          id="model"
          label={info.isLocal ? "Model" : "Model for big jobs"}
          hint={
            info.isLocal
              ? undefined
              : settings.budgetMode
                ? "Ignored while Budget mode is on."
                : "Used for demanding work like rewriting your whole resume. Opus is the most capable."
          }
          value={settings.model}
          options={result?.ok ? result.models : null}
          onChange={(model) => setSettings({ ...settings, model })}
        />

        {!info.isLocal && (
          <ModelPicker
            id="quickModel"
            label="Model for quick jobs"
            hint="Used for lighter work like short suggestions. A smaller model like Sonnet or Haiku is faster and cheaper."
            value={settings.quickModel}
            options={result?.ok ? result.models : null}
            onChange={(quickModel) => setSettings({ ...settings, quickModel })}
          />
        )}

        <div className="flex items-center gap-3">
          <button className="btn" onClick={handleTest} disabled={testing}>
            {testing ? "Testing..." : "Test connection"}
          </button>
        </div>

        {result && (
          <p
            role="status"
            className={`whitespace-pre-line rounded-md border p-3 text-sm ${
              result.ok ? "border-good text-good" : "border-bad text-bad"
            }`}
          >
            {result.message}
          </p>
        )}
      </div>
    </div>
  );
}

function ModelAdvisor({ provider }: { provider: ProviderId }) {
  const [computer, setComputer] = useStoredState("job-helper:computer", { id: "" });
  const pick = COMPUTER_TYPES.find((c) => c.id === computer.id);

  return (
    <div className="rounded-lg border border-line bg-card p-4">
      <label className="mb-1 block text-sm font-medium" htmlFor="computer">
        Which model fits my computer?
      </label>
      <select
        id="computer"
        className="field"
        value={computer.id}
        onChange={(e) => setComputer({ id: e.target.value })}
      >
        <option value="">Choose your computer...</option>
        {COMPUTER_TYPES.map((c) => (
          <option key={c.id} value={c.id}>
            {c.label}
          </option>
        ))}
      </select>
      {pick ? (
        <div className="mt-3 space-y-1 text-sm">
          <p>
            Download <span className="font-medium">{pick.model}</span> ({pick.downloadSize}).{" "}
            {provider === "ollama" ? (
              <>
                In a terminal, run <code className="rounded bg-background px-1">ollama pull {pick.ollamaTag}</code>
              </>
            ) : (
              <>
                In LM Studio&apos;s Discover tab, search{" "}
                <code className="rounded bg-background px-1">{pick.lmStudioSearch}</code> and pick the Q4_K_M
                version (or MLX 4-bit on a Mac). When you load it, set Context Length to at least 8192.
              </>
            )}
          </p>
          <p className="text-muted">Rewriting a resume takes {pick.rewriteTime}.</p>
          <p className="text-muted">{pick.quality}</p>
        </div>
      ) : (
        <p className="mt-1 text-xs text-muted">
          Not sure what you have? The setup guide shows how to check your memory and graphics card.
        </p>
      )}
    </div>
  );
}

function ModelPicker({
  id,
  label,
  hint,
  value,
  options,
  onChange,
}: {
  id: string;
  label: string;
  hint?: string;
  value: string;
  /** Models found by Test connection, or null before testing. */
  options: string[] | null;
  onChange: (model: string) => void;
}) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium" htmlFor={id}>
        {label}
      </label>
      {options ? (
        <select id={id} className="field" value={value} onChange={(e) => onChange(e.target.value)}>
          {options.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>
      ) : (
        <input
          id={id}
          className="field"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Click Test connection to see your models"
        />
      )}
      {hint && <p className="mt-1 text-xs text-muted">{hint}</p>}
    </div>
  );
}
