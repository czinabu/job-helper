// The visitor's color theme. "system" follows the device setting.
export type Theme = "system" | "light" | "dark";

export const THEME_KEY = "job-helper:theme";

/**
 * Runs inline in <head> before first paint, so a saved Light or Dark choice
 * never flashes the other theme on load. Kept tiny and dependency-free.
 */
export const THEME_SCRIPT = `try{var t=localStorage.getItem(${JSON.stringify(THEME_KEY)});if(t==="light"||t==="dark")document.documentElement.dataset.theme=t}catch(e){}`;

export function applyTheme(theme: Theme) {
  const root = document.documentElement;
  if (theme === "system") delete root.dataset.theme;
  else root.dataset.theme = theme;
  try {
    if (theme === "system") localStorage.removeItem(THEME_KEY);
    else localStorage.setItem(THEME_KEY, theme);
  } catch {
    // Storage can be blocked (private windows); the choice still applies for this page.
  }
}
