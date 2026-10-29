"use client";

import { useState } from "react";
import {
  PROVIDERS,
  defaultSettings,
  SETTINGS_KEY,
  type ModelSettings,
  type ProviderId,
  type TestConnectionResult,
} from "@/lib/providers";
import { testConnection } from "@/lib/ai";
import { useStoredState } from "@/lib/useStoredState";

export default function SettingsPage() {
  const [settings, setSettings] = useStoredState<ModelSettings>(SETTINGS_KEY, defaultSettings());
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
          Choose which AI model reads your resume. Your settings are saved only in this browser.
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
              . Leave blank if whoever runs this site has already set one up.
            </p>
          </div>
        )}

        <ModelPicker
          id="model"
          label={info.isLocal ? "Model" : "Model for big jobs"}
          hint={
            info.isLocal
              ? undefined
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
