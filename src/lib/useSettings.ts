"use client";

import { useCallback, useEffect, useState } from "react";
import { clearApiKey, loadApiKey, saveApiKey } from "./apiKey";
import { defaultSettings, SETTINGS_KEY, type ModelSettings } from "./providers";

/**
 * The model settings, remembered in this browser. The API key is handled
 * separately (see apiKey.ts) so it is never saved with the other settings.
 */
export function useSettings() {
  const [settings, setSettingsState] = useState<ModelSettings>(defaultSettings());
  const [remember, setRememberState] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let saved: Partial<ModelSettings> = {};
    try {
      const raw = localStorage.getItem(SETTINGS_KEY);
      if (raw !== null) saved = JSON.parse(raw);
    } catch {
      // Start fresh.
    }
    const { key, remembered } = loadApiKey();
    // Older versions saved the key inside the settings. Move it out, keeping
    // it for this tab only.
    const legacy = saved.apiKey;
    if (legacy) {
      if (!key) saveApiKey(legacy, false);
      try {
        localStorage.setItem(SETTINGS_KEY, JSON.stringify({ ...saved, apiKey: "" }));
      } catch {
        // Ignore.
      }
    }
    setSettingsState({ ...defaultSettings(), ...saved, apiKey: key || legacy || "" });
    setRememberState(remembered);
    setLoaded(true);
  }, []);

  const setSettings = useCallback(
    (next: ModelSettings) => {
      setSettingsState(next);
      try {
        localStorage.setItem(SETTINGS_KEY, JSON.stringify({ ...next, apiKey: "" }));
      } catch {
        // Ignore; the app still works without saving.
      }
      saveApiKey(next.apiKey.trim(), remember);
    },
    [remember],
  );

  const setRemember = useCallback(
    (value: boolean) => {
      setRememberState(value);
      saveApiKey(settings.apiKey.trim(), value);
    },
    [settings.apiKey],
  );

  const clearKey = useCallback(() => {
    clearApiKey();
    setRememberState(false);
    setSettingsState((s) => ({ ...s, apiKey: "" }));
  }, []);

  return { settings, setSettings, loaded, remember, setRemember, clearKey };
}
