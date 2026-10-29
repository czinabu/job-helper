"use client";

import Link from "next/link";
import { useState } from "react";
import { PROVIDERS, SETTINGS_KEY, defaultSettings, type ModelSettings } from "@/lib/providers";
import { friendlyMessage } from "@/lib/errors";
import { parseResume } from "@/lib/parseResume";
import { useStoredState } from "@/lib/useStoredState";

interface Background {
  targetRole: string;
  experience: string;
  skills: string;
  notes: string;
}

interface Inputs {
  resume: string;
  background: Background;
  jobPosting: string;
}

const EMPTY: Inputs = {
  resume: "",
  background: { targetRole: "", experience: "", skills: "", notes: "" },
  jobPosting: "",
};

export default function Home() {
  const [settings] = useStoredState<ModelSettings>(SETTINGS_KEY, defaultSettings());
  const [inputs, setInputs] = useStoredState<Inputs>("job-helper:inputs", EMPTY);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");

  const setBackground = (patch: Partial<Background>) =>
    setInputs({ ...inputs, background: { ...inputs.background, ...patch } });

  async function upload(file: File) {
    setUploading(true);
    setUploadError("");
    try {
      setInputs({ ...inputs, resume: await parseResume(file) });
    } catch (error) {
      setUploadError(friendlyMessage(error));
    } finally {
      setUploading(false);
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
        <label className="btn-secondary inline-block cursor-pointer">
          {uploading ? "Reading file..." : "Upload PDF or Word file"}
          <input
            type="file"
            accept=".pdf,.docx,.txt,.md"
            className="hidden"
            disabled={uploading}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) upload(file);
              e.target.value = "";
            }}
          />
        </label>
        {uploadError && <p className="text-sm text-bad">{uploadError}</p>}
        <textarea
          className="field h-64 font-mono"
          value={inputs.resume}
          onChange={(e) => setInputs({ ...inputs, resume: e.target.value })}
          placeholder="Or paste your resume text here. After uploading, check the text below and fix anything that came through wrong."
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
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-medium">3. The job posting</h2>
        <textarea
          className="field h-48"
          value={inputs.jobPosting}
          onChange={(e) => setInputs({ ...inputs, jobPosting: e.target.value })}
          placeholder="Paste the full job description here."
        />
      </section>

      <div className="flex flex-wrap items-center gap-3 border-t border-line pt-6">
        <button className="btn" disabled title="Coming in the next update">
          Tailor my resume
        </button>
        <span className="text-sm text-muted">
          {ready
            ? "All set. Resume tailoring is coming in the next update."
            : "Add your resume and a job posting to continue."}
        </span>
        <button className="ml-auto text-sm text-muted underline" onClick={() => setInputs(EMPTY)}>
          Clear everything
        </button>
      </div>
    </div>
  );
}
