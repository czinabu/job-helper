"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { DownloadPanel } from "@/components/DownloadPanel";
import { FormatChecks, FormatReviewView } from "@/components/FormatCard";
import { SuggestionsList } from "@/components/SuggestionsCard";
import { TailorResults } from "@/components/TailorResults";
import {
  EXAMPLE_FORMAT_REVIEW,
  EXAMPLE_INPUTS,
  EXAMPLE_LAYOUT,
  EXAMPLE_LETTER,
  EXAMPLE_SUGGESTIONS,
  EXAMPLE_TAILORED,
} from "@/lib/example";
import { checkFormat } from "@/lib/formatCheck";
import { EDUCATION_STATUSES } from "@/lib/tailor";

const TABS = [
  { id: "tailor", label: "Tailored resume" },
  { id: "suggestions", label: "Suggestions" },
  { id: "format", label: "Formatting" },
  { id: "letter", label: "Cover letter" },
] as const;

function Sample({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <details className="rounded-md border border-line p-3">
      <summary className="cursor-pointer text-sm font-medium">{title}</summary>
      <div className="mt-3">{children}</div>
    </details>
  );
}

function SampleText({ text }: { text: string }) {
  return <pre className="whitespace-pre-wrap break-words font-sans text-sm text-muted">{text}</pre>;
}

/**
 * A worked example for a made-up person and job. Everything shown was prepared ahead of
 * time, so it needs no API key and sends nothing anywhere.
 */
export default function Example() {
  const [tab, setTab] = useState<(typeof TABS)[number]["id"]>("tailor");
  // The measured checks are Rolevisor's real, free checks run on the sample.
  const report = useMemo(() => checkFormat(EXAMPLE_INPUTS.resume, EXAMPLE_LAYOUT), []);
  const { background } = EXAMPLE_INPUTS;
  const school = background.education?.[0];

  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <h1 className="text-2xl font-semibold">See an example</h1>
        <p className="text-sm text-muted">
          This is what Rolevisor gives you, using a made-up resume for &quot;Sam&quot; and a made-up
          job posting. The results were prepared ahead of time, so you don&apos;t need an API key
          and nothing is sent anywhere.
        </p>
        <div className="flex flex-wrap gap-3">
          <Link href="/tailor" className="btn">
            Try it with your resume
          </Link>
          <Link href="/settings" className="btn-secondary">
            Add an API key
          </Link>
        </div>
      </div>

      <section className="space-y-3">
        <h2 className="text-lg font-medium">What went in</h2>
        <Sample title="Sam's resume">
          <SampleText text={EXAMPLE_INPUTS.resume} />
        </Sample>
        <Sample title="About Sam">
          <ul className="space-y-1 text-sm text-muted">
            <li>Target role: {background.targetRole}</li>
            <li>Years of experience: {background.experience}</li>
            <li>Other skills: {background.skills}</li>
            <li>{background.notes}</li>
            {school && (
              <li>
                Education: {school.program}, {school.school}, {school.dates}
                {school.status && ` (${EDUCATION_STATUSES[school.status].toLowerCase()})`}.
                Coursework: {school.coursework}
              </li>
            )}
          </ul>
        </Sample>
        <Sample title="The job posting">
          <SampleText text={EXAMPLE_INPUTS.jobPosting} />
        </Sample>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-medium">What came out</h2>
        <div role="tablist" aria-label="Example results" className="flex flex-wrap gap-1 border-b border-line">
          {TABS.map((t) => (
            <button
              key={t.id}
              role="tab"
              id={`tab-${t.id}`}
              aria-selected={tab === t.id}
              aria-controls={`panel-${t.id}`}
              onClick={() => setTab(t.id)}
              className={`-mb-px border-b-2 px-3 py-2 text-sm ${
                tab === t.id
                  ? "border-accent font-medium text-foreground"
                  : "border-transparent text-muted hover:text-foreground"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div role="tabpanel" id="panel-tailor" aria-labelledby="tab-tailor" hidden={tab !== "tailor"}>
          <TailorResults result={EXAMPLE_TAILORED} originalResume={EXAMPLE_INPUTS.resume} />
        </div>

        <div role="tabpanel" id="panel-suggestions" aria-labelledby="tab-suggestions" hidden={tab !== "suggestions"}>
          <section className="space-y-4 rounded-lg border border-line bg-card p-5">
            <h2 className="text-lg font-medium">Suggestions for this job</h2>
            <p className="text-sm text-muted">
              The changes most worth making first. Text in [brackets] is for Sam to fill in, only
              if it&apos;s true.
            </p>
            <SuggestionsList result={EXAMPLE_SUGGESTIONS} />
          </section>
        </div>

        <div role="tabpanel" id="panel-format" aria-labelledby="tab-format" hidden={tab !== "format"}>
          <section className="space-y-4 rounded-lg border border-line bg-card p-5">
            <FormatChecks report={report} />
            <p className="text-xs text-muted">
              Measured as if Sam had uploaded a one-page PDF. When you upload your own file,
              Rolevisor measures its margins, fonts, and spacing for free.
            </p>
            <div className="space-y-3 border-t border-line pt-4">
              <h3 className="font-medium">Expert-style review</h3>
              <FormatReviewView review={EXAMPLE_FORMAT_REVIEW} />
            </div>
          </section>
        </div>

        <div role="tabpanel" id="panel-letter" aria-labelledby="tab-letter" hidden={tab !== "letter"}>
          <section className="space-y-4 rounded-lg border border-line bg-card p-5">
            <h2 className="text-lg font-medium">Cover letter</h2>
            <p className="text-sm text-muted">Professional tone, standard length.</p>
            <SampleText text={EXAMPLE_LETTER.letter} />
            <DownloadPanel text={EXAMPLE_LETTER.letter} kind="letter" />
            <ul className="list-disc space-y-1 pl-5 text-sm text-muted">
              {EXAMPLE_LETTER.notes.map((n, i) => (
                <li key={i}>{n}</li>
              ))}
            </ul>
          </section>
        </div>
      </section>

      <div className="flex flex-wrap items-center gap-3 border-t border-line pt-6">
        <span className="text-sm">Ready to try it on your own resume?</span>
        <Link href="/tailor" className="btn">
          Tailor my resume
        </Link>
      </div>
    </div>
  );
}
