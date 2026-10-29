// Where the visitor's Claude API key lives in their browser. By default it
// is kept for this tab only (sessionStorage) and disappears when the tab
// closes. "Remember on this device" is an opt-in that uses localStorage.
// The key is never part of the saved model settings and never sent to our
// server.

const KEY = "job-helper:api-key";

export function loadApiKey(): { key: string; remembered: boolean } {
  try {
    const remembered = localStorage.getItem(KEY);
    if (remembered) return { key: remembered, remembered: true };
    return { key: sessionStorage.getItem(KEY) ?? "", remembered: false };
  } catch {
    return { key: "", remembered: false };
  }
}

export function saveApiKey(key: string, remember: boolean) {
  try {
    localStorage.removeItem(KEY);
    sessionStorage.removeItem(KEY);
    if (!key) return;
    (remember ? localStorage : sessionStorage).setItem(KEY, key);
  } catch {
    // Storage can be blocked; the key then lasts until the page reloads.
  }
}

export function clearApiKey() {
  saveApiKey("", false);
}
