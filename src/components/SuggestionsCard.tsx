"use client";

import { useState } from "react";
import { Loading } from "@/components/Loading";
import { runTask } from "@/lib/ai";
import { friendlyMessage } from "@/lib/errors";
import type { ModelSettings } from "@/lib/providers";
import type { SuggestionsResult } from "@/lib/suggestions";
import type { Background } from "@/lib/tailor";

const BADGE: Record<string, string> = {
  High: "text-bad border-bad",
  Medium: "text-accent border-accent",
  Low: "text-muted border-line",
};

function Priority({ level }: { level: string }) {
  return (
    <span className={`rounded border px-1.5 py-0.5 text-xs font-medium ${BADGE[level] ?? BADGE.Low}`}>
      {level}
    </span>
  );
}

/** Prioritized advice for this job: bullets to strengthen, gaps to address, what to emphasize. */
export function SuggestionsCard({
  resume,
  background,
  jobPosting,
  settings,
}: {
  resume: string;
  background: Background;
  jobPosting: string;
  settings: ModelSettings;
}) {
  const [result, setResult] = useState<SuggestionsResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function run() {
    setBusy(true);
    setError("");
    try {
      setResult(await runTask<SuggestionsResult>(settings, "suggestions", { resume, background, jobPosting }));
    } catch (e) {
      setError(friendlyMessage(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="space-y-4 rounded-lg border border-line bg-card p-5">
      <h2 className="text-lg font-medium">Suggestions for this job</h2>
      <p className="text-sm text-muted">
        The changes most worth making first: bullets to strengthen, gaps to address, and what to
        emphasize. Rewrites only use what you&apos;ve told Job Helper.
      </p>
      <button className="btn" disabled={busy} onClick={run}>
        {busy ? "Thinking..." : result ? "Refresh suggestions" : "Get suggestions"}
      </button>
      {busy && <Loading message="Looking for the changes worth making..." hint="This usually takes under a minute." />}
      {error && <p role="alert" className="whitespace-pre-line text-sm text-bad">{error}</p>}

      {result && (
        <div className="space-y-6">
          <div className="space-y-3">
            <h3 className="font-medium">Bullets to strengthen</h3>
            {result.bullets.length === 0 && <p className="text-sm text-muted">Nothing needs changing here.</p>}
            {result.bullets.map((b, i) => (
              <div key={i} className="space-y-1 rounded-md border border-line p-3 text-sm">
                <Priority level={b.priority} />
                <p className="text-muted line-through">{b.original}</p>
                <p>{b.rewrite}</p>
                <p className="text-xs text-muted">{b.why}</p>
              </div>
            ))}
          </div>
          <div className="space-y-3">
            <h3 className="font-medium">Gaps to address</h3>
            {result.gaps.length === 0 && <p className="text-sm text-muted">No clear gaps found.</p>}
            {result.gaps.map((g, i) => (
              <div key={i} className="space-y-1 rounded-md border border-line p-3 text-sm">
                <Priority level={g.priority} />
                <p className="font-medium">{g.gap}</p>
                <p className="text-muted">{g.howToAddress}</p>
              </div>
            ))}
          </div>
          <div className="space-y-3">
            <h3 className="font-medium">What to emphasize</h3>
            {result.emphasize.length === 0 && <p className="text-sm text-muted">Nothing specific.</p>}
            {result.emphasize.map((p, i) => (
              <div key={i} className="space-y-1 rounded-md border border-line p-3 text-sm">
                <Priority level={p.priority} />
                <p className="font-medium">{p.point}</p>
                <p className="text-muted">{p.how}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
