"use client";

import { useMemo, useState } from "react";
import { backgroundText } from "@/components/KeywordMatchCard";
import { checkBullets, type BulletIssueId, type BulletReport } from "@/lib/bulletCheck";
import { missingKeywords } from "@/lib/keywordMatch";
import type { Background } from "@/lib/tailor";

const LABELS: Record<BulletIssueId, (n: number) => string> = {
  "weak-opener": (n) => `${n} ${n === 1 ? "starts" : "start"} weakly`,
  "no-result": (n) => `${n} ${n === 1 ? "has" : "have"} no number or result`,
  passive: (n) => `${n} ${n === 1 ? "uses" : "use"} passive voice`,
  "too-long": (n) => `${n} ${n === 1 ? "is" : "are"} too long`,
  "first-person": (n) => `${n} ${n === 1 ? "uses" : "use"} I or my`,
};

/** How many flagged bullets show before "Show all". */
const PREVIEW = 6;
/** Missing keywords to list as gaps, most important first. */
const MAX_GAPS = 10;

/**
 * Flags weak resume bullets with plain rules, no model needed. It points out
 * problems and suggests verbs but doesn't rewrite anything.
 */
export function BulletCheckCard({
  resume,
  jobPosting = "",
  background,
}: {
  resume: string;
  /** When given, the posting's missing keywords show as gaps to address. */
  jobPosting?: string;
  background?: Background;
}) {
  const report = useMemo(() => {
    const gaps = jobPosting.trim() ? missingKeywords(resume, jobPosting, backgroundText(background)) : [];
    return checkBullets(resume, gaps.slice(0, MAX_GAPS));
  }, [resume, jobPosting, background]);
  return (
    <section className="space-y-4 card p-5">
      <BulletChecks report={report} />
    </section>
  );
}

/** The bullet check results, also used by the example page. */
export function BulletChecks({ report }: { report: BulletReport }) {
  const [showAll, setShowAll] = useState(false);
  const shown = showAll ? report.flagged : report.flagged.slice(0, PREVIEW);
  const tally = (Object.keys(LABELS) as BulletIssueId[])
    .filter((id) => report.counts[id] > 0)
    .map((id) => LABELS[id](report.counts[id]));

  return (
    <>
      <div className="flex items-baseline gap-3">
        <h2 className="text-lg font-medium">Bullet check</h2>
        <span className="ml-auto rounded-full bg-good-soft px-2 py-0.5 text-xs font-medium text-good">
          Free, no key needed
        </span>
      </div>
      <p className="text-sm text-muted">
        Plain rules that flag bullets worth a second look. Nothing is rewritten: you decide what to
        change, and Suggestions can draft rewrites if you add a key.
      </p>

      {report.total === 0 ? (
        <p className="text-sm">
          No bullet points found. Start each line under a job with a dash or bullet symbol so it can
          be checked.
        </p>
      ) : report.flagged.length === 0 && report.repeated.length === 0 ? (
        <p className="text-sm">
          <span className="font-bold text-good">✓</span> All {report.total} bullets look solid: action
          verbs, numbers, and a readable length.
        </p>
      ) : (
        <p className="text-sm">
          <span className="font-medium">
            {report.flagged.length} of {report.total} bullets
          </span>{" "}
          could be stronger{tally.length > 0 && `: ${tally.join(", ")}`}.
        </p>
      )}

      {report.repeated.length > 0 && (
        <div className="space-y-1 text-sm">
          <h3 className="font-medium">Repeated openers</h3>
          <ul className="space-y-1 text-muted">
            {report.repeated.map((r) => (
              <li key={r.verb}>
                &quot;{r.verb}&quot; starts {r.count} bullets.
                {r.alternatives.length > 0 && ` Try ${r.alternatives.join(", ")}.`}
              </li>
            ))}
          </ul>
        </div>
      )}

      {shown.length > 0 && (
        <ul className="space-y-2">
          {shown.map((b, i) => (
            <li key={i} className="rounded-md border border-line p-3 text-sm">
              <p>{b.text}</p>
              <ul className="mt-2 space-y-1">
                {b.issues.map((issue) => (
                  <li key={issue.id} className="flex gap-2">
                    <span className="w-4 shrink-0 text-center font-bold text-muted" aria-hidden>
                      !
                    </span>
                    <span>
                      <span className="font-medium">{issue.title}.</span>{" "}
                      <span className="text-muted">{issue.detail}</span>
                    </span>
                  </li>
                ))}
              </ul>
              {b.verbs.length > 0 && (
                <p className="mt-2 text-muted">
                  <span className="font-medium text-foreground">Try:</span> {b.verbs.join(", ")}
                </p>
              )}
            </li>
          ))}
        </ul>
      )}
      {report.flagged.length > PREVIEW && (
        <button className="text-sm text-muted underline" onClick={() => setShowAll(!showAll)}>
          {showAll ? "Show fewer" : `Show all ${report.flagged.length}`}
        </button>
      )}

      {report.gaps.length > 0 && (
        <div className="space-y-2 border-t border-line pt-4 text-sm">
          <h3 className="font-medium">Gaps to address</h3>
          <p className="text-muted">
            The job posting asks for these, but your resume doesn&apos;t mention them (most important first). If you have
            the experience, work it into a bullet.
          </p>
          <ul className="flex flex-wrap gap-2">
            {report.gaps.map((g) => (
              <li key={g} className="rounded-full border border-line px-2.5 py-0.5">
                {g}
              </li>
            ))}
          </ul>
        </div>
      )}
    </>
  );
}
