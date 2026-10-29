"use client";

import { useState } from "react";
import type { TailorResult } from "@/lib/tailor";

function scoreLabel(score: number) {
  if (score >= 75) return "Strong match";
  if (score >= 50) return "Partial match";
  return "Stretch role";
}

export function TailorResults({ result }: { result: TailorResult }) {
  const [copied, setCopied] = useState(false);
  const score = Math.max(0, Math.min(100, Math.round(result.matchScore)));

  async function copy() {
    try {
      await navigator.clipboard.writeText(result.tailoredResume);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard can be blocked; the text is still selectable on the page.
    }
  }

  return (
    <div className="space-y-8">
      <section className="rounded-lg border border-line bg-card p-5">
        <div className="flex items-baseline gap-3">
          <span className="text-4xl font-semibold">{score}</span>
          <span className="text-sm text-muted">/ 100 · {scoreLabel(score)}</span>
        </div>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-line">
          <div className="h-full rounded-full bg-accent" style={{ width: `${score}%` }} />
        </div>
        <p className="mt-4 text-sm">{result.summary}</p>
        <p className="mt-2 text-xs text-muted">This score is for your original resume.</p>
      </section>

      <section className="grid gap-6 sm:grid-cols-2">
        <SkillList
          title="What you already have"
          skills={result.matchedSkills}
          empty="No clear matches found."
          tone="good"
        />
        <SkillList
          title="What the job wants that's missing"
          skills={result.missingSkills}
          empty="Nothing major is missing."
          tone="bad"
        />
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium">Your tailored resume</h2>
          <button className="btn-secondary" onClick={copy}>
            {copied ? "Copied!" : "Copy text"}
          </button>
        </div>
        <p className="text-sm text-muted">
          Read it over before using it. The AI is told not to invent anything, but you know your
          history best.
        </p>
        <pre className="field whitespace-pre-wrap break-words p-4 font-sans leading-relaxed">
          {result.tailoredResume}
        </pre>
      </section>

      {result.changes.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-lg font-medium">What changed and why</h2>
          <ul className="space-y-3">
            {result.changes.map((c, i) => (
              <li key={i} className="rounded-md border border-line p-3 text-sm">
                <p className="font-medium">{c.change}</p>
                <p className="mt-1 text-muted">{c.reason}</p>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

function SkillList({
  title,
  skills,
  empty,
  tone,
}: {
  title: string;
  skills: string[];
  empty: string;
  tone: "good" | "bad";
}) {
  return (
    <div>
      <h3 className="mb-2 text-sm font-medium">{title}</h3>
      {skills.length === 0 ? (
        <p className="text-sm text-muted">{empty}</p>
      ) : (
        <ul className="flex flex-wrap gap-2">
          {skills.map((s) => (
            <li
              key={s}
              className={`rounded-full border px-3 py-1 text-xs ${
                tone === "good" ? "border-good text-good" : "border-bad text-bad"
              }`}
            >
              {s}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
