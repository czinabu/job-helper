"use client";

import { useEffect, useState } from "react";
import { applyTheme, type Theme } from "@/lib/theme";

const OPTIONS: { value: Theme; label: string; icon: React.ReactNode }[] = [
  {
    value: "system",
    label: "System",
    icon: (
      <>
        <rect x="2.5" y="3.5" width="11" height="7.5" rx="1" />
        <path d="M6 13.5h4M8 11v2.5" />
      </>
    ),
  },
  {
    value: "light",
    label: "Light",
    icon: (
      <>
        <circle cx="8" cy="8" r="2.75" />
        <path d="M8 1.5v1.5M8 13v1.5M1.5 8H3M13 8h1.5M3.4 3.4l1.06 1.06M11.54 11.54l1.06 1.06M3.4 12.6l1.06-1.06M11.54 4.46l1.06-1.06" />
      </>
    ),
  },
  {
    value: "dark",
    label: "Dark",
    icon: <path d="M13.5 9.5A5.5 5.5 0 0 1 6.5 2.5a5.5 5.5 0 1 0 7 7Z" />,
  },
];

/** A three-way System / Light / Dark switch. The choice is saved in this browser only. */
export function ThemeToggle() {
  // Read the theme the inline head script already applied, once mounted.
  const [theme, setTheme] = useState<Theme | null>(null);

  useEffect(() => {
    const current = document.documentElement.dataset.theme;
    setTheme(current === "light" || current === "dark" ? current : "system");
  }, []);

  return (
    <div role="radiogroup" aria-label="Color theme" className="inline-flex gap-0.5 rounded-lg border border-line p-0.5">
      {OPTIONS.map(({ value, label, icon }) => {
        const active = theme === value;
        return (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={active}
            title={label}
            onClick={() => {
              setTheme(value);
              applyTheme(value);
            }}
            className={`flex items-center gap-1.5 rounded-md px-2 py-1 text-xs transition-colors ${
              active ? "bg-card font-medium text-foreground" : "text-muted hover:text-foreground"
            }`}
          >
            <svg
              viewBox="0 0 16 16"
              width="14"
              height="14"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              {icon}
            </svg>
            {label}
          </button>
        );
      })}
    </div>
  );
}
