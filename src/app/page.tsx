"use client";

import Link from "next/link";
import { useState } from "react";
import { CoverLetterCard } from "@/components/CoverLetterCard";
import { FormatCard } from "@/components/FormatCard";
import { JobPostingInput } from "@/components/JobPostingInput";
import { SuggestionsCard } from "@/components/SuggestionsCard";
import { ResumeInput } from "@/components/ResumeInput";
import { TailorResults } from "@/components/TailorResults";
import type { ResumeLayout } from "@/lib/layout";
import { runTask } from "@/lib/ai";
import { PROVIDERS } from "@/lib/providers";
import { friendlyMessage } from "@/lib/errors";
import {
  EDUCATION_STATUSES,
  EMPTY_EDUCATION,
  type Background,
  type Education,
  type EducationStatus,
  type TailorRequest,
  type TailorResult,
} from "@/lib/tailor";
import { useSettings } from "@/lib/useSettings";
import { useStoredState } from "@/lib/useStoredState";
import { addApplication, newApplication } from "@/lib/applications";

type Inputs = TailorRequest;

interface Tailored {
  result: TailorResult;
  /** The resume this result was made from, for the keyword check. */
  resume: string;
}

const EMPTY: Inputs = {
  resume: "",
  background: { targetRole: "", experience: "", skills: "", notes: "", education: [] },
  jobPosting: "",
};

export default function Home() {
  const { settings } = useSettings();
  const [inputs, setInputs] = useStoredState<Inputs>("job-helper:inputs", EMPTY);
  const [tailoring, setTailoring] = useState(false);
  const [tailorError, setTailorError] = useState("");
  // Measured from the uploaded file. Kept in storage so it survives switching pages.
  const [stored, setStored] = useStoredState<{ layout: ResumeLayout | null }>("job-helper:layout", { layout: null });
  const layout = stored.layout;
  const setLayout = (layout: ResumeLayout | null) => setStored({ layout });
  const [tailored, setTailored] = useState<Tailored | null>(null);
  const [logForm, setLogForm] = useState<{ company: string; role: string } | null>(null);
  const [logged, setLogged] = useState(false);

  const setBackground = (patch: Partial<Background>) =>
    setInputs({ ...inputs, background: { ...inputs.background, ...patch } });

  // Always show at least one blank school so the fields are easy to find.
  const schools = inputs.background.education?.length
    ? inputs.background.education
    : [EMPTY_EDUCATION];
  const setSchool = (index: number, patch: Partial<Education>) =>
    setBackground({ education: schools.map((s, i) => (i === index ? { ...s, ...patch } : s)) });

  async function tailor() {
    setTailoring(true);
    setTailorError("");
    setTailored(null);
    setLogForm(null);
    setLogged(false);
    try {
      const result = await runTask<TailorResult>(settings, "tailor", inputs);
      setTailored({ result, resume: inputs.resume });
      setTimeout(() => document.getElementById("results")?.scrollIntoView({ behavior: "smooth" }));
    } catch (error) {
      setTailorError(friendlyMessage(error));
    } finally {
      setTailoring(false);
    }
  }

  const ready = inputs.resume.trim() && inputs.jobPosting.trim();

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-2xl font-semibold">Tailor your resume to a job</h1>
        <p className="mt-1 text-sm text-muted">
          Add your resume, a little about yourself, and the job you want. Everything stays in this
          browser until you ask for help.
        </p>
        <p className="mt-2 text-xs text-muted">
          Using: {PROVIDERS[settings.provider].label}
          {settings.model ? `, ${settings.model}` : ""} ·{" "}
          <Link href="/settings" className="text-accent underline">
            change
          </Link>
        </p>
      </div>

      <section className="space-y-3">
        <h2 className="text-lg font-medium">1. Your resume</h2>
        <ResumeInput
          text={inputs.resume}
          onChange={(resume) => setInputs({ ...inputs, resume })}
          onLayout={setLayout}
        />
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-medium">2. About you (optional)</h2>
        <p className="text-sm text-muted">
          Anything that isn&apos;t on your resume but helps explain your story.
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          <input
            className="field"
            placeholder="Kind of role you want, e.g. Data analyst"
            value={inputs.background.targetRole}
            onChange={(e) => setBackground({ targetRole: e.target.value })}
          />
          <input
            className="field"
            placeholder="Years of experience, e.g. 3"
            value={inputs.background.experience}
            onChange={(e) => setBackground({ experience: e.target.value })}
          />
        </div>
        <input
          className="field"
          placeholder="Skills you have that aren't on your resume"
          value={inputs.background.skills}
          onChange={(e) => setBackground({ skills: e.target.value })}
        />
        <textarea
          className="field h-24"
          placeholder="Anything else: career change, employment gap, side projects, what you're looking for..."
          value={inputs.background.notes}
          onChange={(e) => setBackground({ notes: e.target.value })}
        />

        <div className="space-y-3 pt-2">
          <h3 className="text-sm font-medium">Education</h3>
          <p className="text-sm text-muted">
            Include school you didn&apos;t finish too. Job Helper will suggest whether to list it,
            where it goes, and how to word it for each job.
          </p>
          {schools.map((school, i) => (
            <div key={i} className="space-y-3 rounded-md border border-line p-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <input
                  className="field"
                  placeholder="School, e.g. Ohio State University"
                  value={school.school}
                  onChange={(e) => setSchool(i, { school: e.target.value })}
                />
                <input
                  className="field"
                  placeholder="Degree or program, e.g. B.S. Computer Science"
                  value={school.program}
                  onChange={(e) => setSchool(i, { program: e.target.value })}
                />
                <select
                  className="field"
                  aria-label="Status"
                  value={school.status}
                  onChange={(e) => setSchool(i, { status: e.target.value as EducationStatus | "" })}
                >
                  <option value="">Status...</option>
                  {Object.entries(EDUCATION_STATUSES).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
                <input
                  className="field"
                  placeholder="Dates, e.g. 2021–2023 or expected May 2027"
                  value={school.dates}
                  onChange={(e) => setSchool(i, { dates: e.target.value })}
                />
              </div>
              <textarea
                className="field h-20"
                placeholder="Relevant coursework, credits earned, honors, or projects"
                value={school.coursework}
                onChange={(e) => setSchool(i, { coursework: e.target.value })}
              />
              {schools.length > 1 && (
                <button
                  className="text-sm text-muted underline"
                  onClick={() => setBackground({ education: schools.filter((_, j) => j !== i) })}
                >
                  Remove this school
                </button>
              )}
            </div>
          ))}
          <button
            className="btn-secondary"
            onClick={() => setBackground({ education: [...schools, EMPTY_EDUCATION] })}
          >
            Add another school
          </button>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-medium">3. The job posting</h2>
        <JobPostingInput
          text={inputs.jobPosting}
          onChange={(jobPosting) => setInputs({ ...inputs, jobPosting })}
        />
      </section>

      <div className="flex flex-wrap items-center gap-3 border-t border-line pt-6">
        <button className="btn" disabled={!ready || tailoring} onClick={tailor}>
          {tailoring ? "Tailoring..." : "Tailor my resume"}
        </button>
        <span className="text-sm text-muted">
          {tailoring
            ? PROVIDERS[settings.provider].isLocal
              ? "This can take a few minutes on a local model."
              : "This usually takes under a minute."
            : ready
              ? ""
              : "Add your resume and a job posting to continue."}
        </span>
        <button
          className="ml-auto text-sm text-muted underline"
          onClick={() => {
            setInputs(EMPTY);
            setTailored(null);
            setTailorError("");
          }}
        >
          Clear everything
        </button>
      </div>

      {tailorError && (
        <p
          role="alert"
          className="whitespace-pre-line rounded-md border border-bad p-3 text-sm text-bad"
        >
          {tailorError}
        </p>
      )}

      {inputs.resume.trim() && (
        <div className="border-t border-line pt-8">
          <FormatCard resume={inputs.resume} layout={layout} settings={settings} />
        </div>
      )}

      {ready && (
        <div className="border-t border-line pt-8">
          <CoverLetterCard
            resume={inputs.resume}
            background={inputs.background}
            jobPosting={inputs.jobPosting}
            settings={settings}
          />
        </div>
      )}

      {ready && (
        <div className="border-t border-line pt-8">
          <SuggestionsCard
            resume={inputs.resume}
            background={inputs.background}
            jobPosting={inputs.jobPosting}
            settings={settings}
          />
        </div>
      )}

      {tailored && (
        <div id="results" className="border-t border-line pt-8">
          <TailorResults result={tailored.result} originalResume={tailored.resume} />
          <div className="mt-8 rounded-lg border border-line bg-card p-4 text-sm">
            {logged ? (
              <p>
                Saved. See it in your{" "}
                <Link href="/applications" className="text-accent underline">
                  application log
                </Link>
                .
              </p>
            ) : logForm ? (
              <form
                className="flex flex-wrap gap-3"
                onSubmit={(e) => {
                  e.preventDefault();
                  try {
                    addApplication(
                      newApplication({
                        company: logForm.company.trim(),
                        role: logForm.role.trim(),
                      }),
                    );
                    setLogged(true);
                  } catch {
                    setTailorError("Couldn't save to the log. Browser storage may be blocked.");
                  }
                }}
              >
                <input className="field w-auto flex-1" placeholder="Company" value={logForm.company} onChange={(e) => setLogForm({ ...logForm, company: e.target.value })} />
                <input className="field w-auto flex-1" placeholder="Job title" value={logForm.role} onChange={(e) => setLogForm({ ...logForm, role: e.target.value })} />
                <button className="btn" disabled={!logForm.company.trim() && !logForm.role.trim()}>
                  Save
                </button>
              </form>
            ) : (
              <div className="flex items-center gap-3">
                <span>Applying for this job?</span>
                <button
                  className="btn-secondary"
                  onClick={() => setLogForm({ company: "", role: inputs.background.targetRole })}
                >
                  Save to log
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
