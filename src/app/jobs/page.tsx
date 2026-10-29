"use client";

import Link from "next/link";
import { useState } from "react";
import { runTask } from "@/lib/ai";
import { addApplication, newApplication } from "@/lib/applications";
import { friendlyMessage } from "@/lib/errors";
import { searchLinks, type RecommendResult } from "@/lib/recommend";
import { PROVIDERS } from "@/lib/providers";
import type { TailorRequest } from "@/lib/tailor";
import { useSettings } from "@/lib/useSettings";
import { useStoredState } from "@/lib/useStoredState";

const EMPTY: TailorRequest = {
  resume: "",
  background: { targetRole: "", experience: "", skills: "", notes: "", education: [] },
  jobPosting: "",
};

export default function JobsPage() {
  const { settings } = useSettings();
  // The same saved resume and "About you" details the home page uses.
  const [inputs, , loaded] = useStoredState<TailorRequest>("job-helper:inputs", EMPTY);
  const [location, setLocation] = useStoredState("job-helper:location", { value: "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<RecommendResult | null>(null);
  const [saved, setSaved] = useState<Set<string>>(new Set());

  async function find() {
    setBusy(true);
    setError("");
    setResult(null);
    try {
      setResult(
        await runTask<RecommendResult>(settings, "recommend", {
          resume: inputs.resume,
          background: inputs.background,
          location: location.value,
        }),
      );
    } catch (e) {
      setError(friendlyMessage(e));
    } finally {
      setBusy(false);
    }
  }

  function saveToLog(title: string) {
    try {
      addApplication(newApplication({ role: title, status: "applied", notes: "Saved from job recommendations." }));
      setSaved(new Set(saved).add(title));
    } catch {
      setError("Couldn't save to the log. Browser storage may be blocked.");
    }
  }

  const hasResume = !!inputs.resume.trim();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">Find jobs that fit you</h1>
        <p className="mt-1 text-sm text-muted">
          Job Helper reads your resume and the &ldquo;About you&rdquo; details from the{" "}
          <Link href="/" className="text-accent underline">
            home page
          </Link>{" "}
          and suggests roles to look for, what carries over, and what to work on. It doesn&apos;t
          see live listings, so each role comes with search links to the big job boards.
        </p>
        <p className="mt-2 text-xs text-muted">
          Using: {PROVIDERS[settings.provider].label}
          {settings.model ? `, ${settings.model}` : ""} ·{" "}
          <Link href="/settings" className="text-accent underline">
            change
          </Link>
        </p>
      </div>

      {loaded && !hasResume && (
        <p className="rounded-md border border-line p-3 text-sm">
          Add your resume on the{" "}
          <Link href="/" className="text-accent underline">
            home page
          </Link>{" "}
          first.
        </p>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <input
          className="field w-auto flex-1"
          placeholder="Where? e.g. Columbus, OH or Remote (optional)"
          value={location.value}
          onChange={(e) => setLocation({ value: e.target.value })}
        />
        <button className="btn" disabled={!hasResume || busy} onClick={find}>
          {busy ? "Looking..." : "Recommend jobs"}
        </button>
      </div>

      {error && (
        <p role="alert" className="whitespace-pre-line rounded-md border border-bad p-3 text-sm text-bad">
          {error}
        </p>
      )}

      {result && (
        <div className="space-y-6">
          <p className="text-sm">{result.summary}</p>
          {result.roles.map((role) => (
            <section key={role.title} className="space-y-3 rounded-lg border border-line bg-card p-5">
              <div className="flex flex-wrap items-baseline gap-3">
                <h2 className="text-lg font-medium">{role.title}</h2>
                <span className="text-sm text-muted">{role.fit}</span>
              </div>
              <p className="text-sm">{role.whyItFits}</p>
              {role.transferableSkills.length > 0 && (
                <div className="text-sm">
                  <h3 className="font-medium">Skills that carry over</h3>
                  <p className="text-muted">{role.transferableSkills.join(", ")}</p>
                </div>
              )}
              {role.gaps.length > 0 && (
                <div className="text-sm">
                  <h3 className="font-medium">To close the gap</h3>
                  <ul className="list-disc pl-5 text-muted">
                    {role.gaps.map((g) => (
                      <li key={g}>{g}</li>
                    ))}
                  </ul>
                </div>
              )}
              <div className="flex flex-wrap items-center gap-3 text-sm">
                <span className="text-muted">Search on</span>
                {searchLinks(role.searchTerms || role.title, location.value).map((l) => (
                  <a key={l.name} href={l.url} target="_blank" rel="noopener noreferrer" className="text-accent underline">
                    {l.name}
                  </a>
                ))}
                <span className="ml-auto">
                  {saved.has(role.title) ? (
                    <Link href="/applications" className="text-accent underline">
                      Saved to log
                    </Link>
                  ) : (
                    <button className="btn-secondary" onClick={() => saveToLog(role.title)}>
                      Save to log
                    </button>
                  )}
                </span>
              </div>
            </section>
          ))}
          {result.careerPaths.length > 0 && (
            <section className="space-y-2">
              <h2 className="text-lg font-medium">Where this could lead</h2>
              <ul className="list-disc pl-5 text-sm">
                {result.careerPaths.map((p) => (
                  <li key={p}>{p}</li>
                ))}
              </ul>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
