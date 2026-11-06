"use client";

import { useState } from "react";
import { LINK_FIELDS, linksToAskFor, normalizeUrl, useProfileLinks } from "@/lib/profileLinks";
import type { TailorResult } from "@/lib/tailor";

/**
 * Asks for LinkedIn or GitHub when the resume names one without an address, or when it would help for
 * this job and isn't there. A field stays up once the person starts typing, so it doesn't vanish mid-word.
 */
export function LinkPrompt({ resume, advice }: { resume: string; advice?: TailorResult["linkAdvice"] }) {
  const [links, setLinks] = useProfileLinks();
  const [touched, setTouched] = useState<string[]>([]);
  const [dismissed, setDismissed] = useState(false);
  const needs = linksToAskFor(resume, links, advice);
  const fields = LINK_FIELDS.filter(
    (f) => (f.key === "linkedin" || f.key === "github") && (needs[f.key] || touched.includes(f.key)),
  );
  if (dismissed || fields.length === 0) return null;

  const why = (key: "linkedin" | "github", label: string) =>
    needs[key] === "mentioned"
      ? `Your contact line says "${label}" but there's no address behind it, so it won't be a working link.`
      : needs[key] === "recommended"
        ? `Recommended for this job.`
        : "";
  const anyRecommended = fields.some((f) => needs[f.key as "linkedin" | "github"] === "recommended");

  return (
    <div role="status" className="space-y-3 card border-accent p-4 text-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-medium">Add your profile links</p>
          <p className="mt-1 text-muted">
            {anyRecommended && advice?.reason ? `${advice.reason} ` : ""}
            Paste your own profile address and it&apos;s added to your contact line when you download.
            Leave it blank if you don&apos;t have one; nothing is made up for you.
          </p>
        </div>
        <button className="btn-secondary shrink-0" onClick={() => setDismissed(true)}>
          Skip
        </button>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {fields.map((f) => {
          const key = f.key as "linkedin" | "github";
          const value = links[key];
          const ok = !!normalizeUrl(value);
          const bad = value.trim() !== "" && !ok;
          return (
            <label key={key} className="space-y-1">
              <span className="font-medium">{f.label}</span>
              <input
                className="field"
                type="url"
                inputMode="url"
                placeholder={f.placeholder}
                value={value}
                aria-invalid={bad}
                onChange={(e) => {
                  if (!touched.includes(key)) setTouched([...touched, key]);
                  setLinks({ ...links, [key]: e.target.value });
                }}
              />
              {ok ? (
                <span className="text-xs text-good">✓ Saved. It&apos;ll be linked in your download.</span>
              ) : bad ? (
                <span className="text-xs text-bad">That doesn&apos;t look like a web address.</span>
              ) : (
                <span className="text-xs text-muted">{why(key, f.label)}</span>
              )}
            </label>
          );
        })}
      </div>
    </div>
  );
}
