"use client";

import { useMemo } from "react";
import { keywordScoreLabel, matchKeywords, type KeywordResult } from "@/lib/keywordMatch";
import type { Background } from "@/lib/tailor";

/** The background notes as one block of text, for spotting keywords that aren't on the resume yet. */
export function backgroundText(background?: Background): string {
  if (!background) return "";
  return [
    background.skills,
    background.notes,
    ...(background.education ?? []).flatMap((e) => [e.program, e.coursework]),
  ]
    .filter((t) => t?.trim())
    .join("\n");
}

/**
 * The ATS-style keyword match score. Plain code, no model, so it works without an API key and
 * updates as the person edits their resume or the posting.
 */
export function KeywordMatchCard({
  resume,
  jobPosting,
  background,
}: {
  resume: string;
  jobPosting: string;
  background?: Background;
}) {
  const match = useMemo(
    () => matchKeywords(resume, jobPosting, backgroundText(background)),
    [resume, jobPosting, background],
  );
  const required = match.keywords.filter((k) => k.importance === "required");
  const preferred = match.keywords.filter((k) => k.importance === "preferred");
  const fromBackground = match.missing.filter((k) => k.inBackground);

  return (
    <section className="space-y-5 card p-5">
      <div className="space-y-2">
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <h2 className="text-lg font-medium">Keyword match score</h2>
          <span className="rounded-full bg-good-soft px-2 py-0.5 text-xs font-medium text-good">
            Free, no key needed
          </span>
        </div>
        {match.score === null ? (
          <p className="text-sm text-muted">
            Rolevisor didn&apos;t find any skills, tools, or credentials it knows in this posting,
            so there&apos;s nothing to score. Check that the whole posting is pasted, including the
            requirements.
          </p>
        ) : (
          <>
            <div className="flex items-baseline gap-3">
              <span className="text-5xl font-semibold tracking-tight">{match.score}</span>
              <span className="text-sm text-muted">/ 100 · {keywordScoreLabel(match.score)}</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-line">
              <div className="h-full rounded-full bg-accent" style={{ width: `${match.score}%` }} />
            </div>
            <p className="text-sm">
              Your resume has {match.found.length} of the {match.keywords.length} keywords this
              posting asks for. Requirements count the most, nice-to-haves less, and the company
              description and benefits not at all.
            </p>
          </>
        )}
        <p className="text-xs text-muted">
          This checks words, the way an applicant tracking system scans a resume. It doesn&apos;t
          judge meaning, so &quot;ran payroll&quot; won&apos;t count for &quot;payroll
          processing&quot;. The AI fit score on the Tailored resume tab reads for meaning.
        </p>
      </div>

      {fromBackground.length > 0 && (
        <div role="status" className="space-y-2 rounded-lg border border-accent bg-accent-soft p-3 text-sm">
          <p className="font-medium">Easy wins: on your background notes, not on your resume</p>
          <p className="text-muted">
            Applicant tracking systems only read the resume, so these don&apos;t count yet. Add
            them where they&apos;re true.
          </p>
          <KeywordChips keywords={fromBackground} />
        </div>
      )}

      {required.length > 0 && <KeywordGroup title="What the job asks for" keywords={required} />}
      {preferred.length > 0 && <KeywordGroup title="Nice to have" keywords={preferred} />}

      {match.missing.length > 0 && (
        <p className="text-xs text-muted">
          Only add a missing keyword if it&apos;s true for you. Use the posting&apos;s exact
          wording, since many systems won&apos;t count &quot;spreadsheets&quot; for
          &quot;Excel&quot;.
        </p>
      )}
    </section>
  );
}

function KeywordGroup({ title, keywords }: { title: string; keywords: KeywordResult[] }) {
  const found = keywords.filter((k) => k.inResume);
  const missing = keywords.filter((k) => !k.inResume);
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium">
        {title} <span className="font-normal text-muted">({found.length} of {keywords.length} found)</span>
      </h3>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <p className="mb-2 text-xs text-muted">On your resume</p>
          {found.length ? <KeywordChips keywords={found} /> : <p className="text-sm text-muted">None yet.</p>}
        </div>
        <div>
          <p className="mb-2 text-xs text-muted">Missing</p>
          {missing.length ? <KeywordChips keywords={missing} /> : <p className="text-sm text-muted">Nothing missing.</p>}
        </div>
      </div>
    </div>
  );
}

function KeywordChips({ keywords }: { keywords: KeywordResult[] }) {
  return (
    <ul className="flex flex-wrap gap-2">
      {keywords.map((k) => (
        <li
          key={k.keyword}
          title={`${k.mentions === 1 ? "Mentioned once" : `Mentioned ${k.mentions} times`} in the posting${
            k.kind === "phrase" ? ". A phrase the posting repeats" : ""
          }${k.inBackground ? ". In your background notes, not your resume" : ""}`}
          className={`rounded-full border px-3 py-1 text-xs ${
            k.inResume ? "border-good/30 bg-good-soft text-good" : "border-bad/30 bg-bad-soft text-bad"
          }`}
        >
          {k.inResume ? "✓ " : ""}
          {k.keyword}
        </li>
      ))}
    </ul>
  );
}
