"use client";

import Link from "next/link";
import { useState } from "react";
import { JobPostingInput } from "@/components/JobPostingInput";
import { ResumeInput } from "@/components/ResumeInput";
import { TailorResults } from "@/components/TailorResults";
import { runTask } from "@/lib/ai";
import { PROVIDERS, SETTINGS_KEY, defaultSettings, type ModelSettings } from "@/lib/providers";
import { friendlyMessage } from "@/lib/errors";
import type { Background, TailorRequest, TailorResult } from "@/lib/tailor";
import { useStoredState } from "@/lib/useStoredState";

type Inputs = TailorRequest;

interface Tailored {
  result: TailorResult;
  /** The resume this result was made from, for the keyword check. */
  resume: string;
}

const EMPTY: Inputs = {
  resume: "",
  background: { targetRole: "", experience: "", skills: "", notes: "" },
  jobPosting: "",
};

export default function Home() {
  const [settings] = useStoredState<ModelSettings>(SETTINGS_KEY, defaultSettings());
  const [inputs, setInputs] = useStoredState<Inputs>("job-helper:inputs", EMPTY);
  const [tailoring, setTailoring] = useState(false);
  const [tailorError, setTailorError] = useState("");
  const [tailored, setTailored] = useState<Tailored | null>(null);

  const setBackground = (patch: Partial<Background>) =>
    setInputs({ ...inputs, background: { ...inputs.background, ...patch } });

  async function tailor() {
    setTailoring(true);
    setTailorError("");
    setTailored(null);
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
        <ResumeInput text={inputs.resume} onChange={(resume) => setInputs({ ...inputs, resume })} />
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

      {tailored && (
        <div id="results" className="border-t border-line pt-8">
          <TailorResults result={tailored.result} originalResume={tailored.resume} />
        </div>
      )}
    </div>
  );
}
