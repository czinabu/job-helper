"use client";

import { useEffect, useMemo, useState } from "react";
import { runTask } from "@/lib/ai";
import { friendlyMessage } from "@/lib/errors";
import { checkFormat, describeLayout, type CheckStatus } from "@/lib/formatCheck";
import type { FormatReview } from "@/lib/formatReview";
import type { ResumeLayout } from "@/lib/layout";
import type { ModelSettings } from "@/lib/providers";

const ICON: Record<CheckStatus, string> = { pass: "✓", warn: "!", fail: "✕" };
const TONE: Record<CheckStatus, string> = {
  pass: "text-good",
  warn: "text-muted",
  fail: "text-bad",
};

/**
 * Grades the resume's formatting and spacing. The measured checks show right
 * away and cost nothing; the AI review reads the text for what they can't see.
 */
export function FormatCard({
  resume,
  layout,
  settings,
}: {
  resume: string;
  layout: ResumeLayout | null;
  settings: ModelSettings;
}) {
  const report = useMemo(() => checkFormat(resume, layout), [resume, layout]);
  const [review, setReview] = useState<FormatReview | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  // An old review no longer matches once the resume changes.
  useEffect(() => setReview(null), [resume, layout]);

  async function ask() {
    setBusy(true);
    setError("");
    try {
      setReview(
        await runTask<FormatReview>(settings, "format", {
          resume,
          layout: describeLayout(layout, report),
        }),
      );
    } catch (e) {
      setError(friendlyMessage(e));
    } finally {
      setBusy(false);
    }
  }

  const order: CheckStatus[] = ["fail", "warn", "pass"];
  const checks = [...report.checks].sort((a, b) => order.indexOf(a.status) - order.indexOf(b.status));

  return (
    <section className="space-y-4 rounded-lg border border-line bg-card p-5">
      <div className="flex items-baseline gap-3">
        <h2 className="text-lg font-medium">Formatting and spacing</h2>
        <span className="ml-auto text-3xl font-semibold">{report.score}</span>
        <span className="text-sm text-muted">/ 100{report.textOnly && " (text only)"}</span>
      </div>
      <p className="text-sm text-muted">
        Checked against advice from recruiters and resume experts.
        {report.textOnly &&
          " Margins, fonts, and spacing weren't checked, so this score only covers the text and may be higher than the full score. Upload your PDF or Word file to check those too."}
      </p>

      <ul className="space-y-2">
        {checks.map((c) => (
          <li key={c.id} className="flex gap-3 text-sm">
            <span className={`w-4 shrink-0 text-center font-bold ${TONE[c.status]}`} aria-label={c.status}>
              {ICON[c.status]}
            </span>
            <div>
              <p className="font-medium">{c.title}</p>
              <p className="text-muted">
                {c.detail}{" "}
                <a href={c.source.url} target="_blank" rel="noreferrer" className="underline">
                  {c.source.label}
                </a>
              </p>
            </div>
          </li>
        ))}
      </ul>

      <div className="space-y-3 border-t border-line pt-4">
        {!review && (
          <div className="flex flex-wrap items-center gap-3">
            <button className="btn-secondary" disabled={busy} onClick={ask}>
              {busy ? "Reviewing..." : "Get an expert-style review"}
            </button>
            <span className="text-xs text-muted">
              The AI reads your resume for section order, bullet wording, and consistency.
            </span>
          </div>
        )}
        {error && <p role="alert" className="whitespace-pre-line text-sm text-bad">{error}</p>}
        {review && (
          <div className="space-y-3 text-sm">
            <p>{review.summary}</p>
            {review.strengths.length > 0 && (
              <div>
                <h3 className="mb-1 font-medium">Doing well</h3>
                <ul className="list-disc space-y-1 pl-5 text-muted">
                  {review.strengths.map((s, i) => (
                    <li key={i}>{s}</li>
                  ))}
                </ul>
              </div>
            )}
            {review.improvements.length > 0 && (
              <div>
                <h3 className="mb-1 font-medium">Worth changing</h3>
                <ul className="space-y-2">
                  {review.improvements.map((m, i) => (
                    <li key={i} className="rounded-md border border-line p-3">
                      <p className="font-medium">{m.issue}</p>
                      <p className="mt-1 text-muted">{m.fix}</p>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
