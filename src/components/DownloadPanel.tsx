"use client";

import { useState } from "react";
import {
  TEMPLATES,
  fileStem,
  makeLetterDocx,
  makeLetterPdf,
  makeResumeDocx,
  makeResumePdf,
  saveBlob,
  type TemplateId,
} from "@/lib/resumeDoc";

/** Template picker and PDF / Word download buttons. Files are built in the browser. */
export function DownloadPanel({ text, kind }: { text: string; kind: "resume" | "letter" }) {
  const [template, setTemplate] = useState<TemplateId>("classic");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function download(format: "pdf" | "docx") {
    setBusy(true);
    setError("");
    try {
      const make =
        kind === "resume"
          ? format === "pdf" ? makeResumePdf : makeResumeDocx
          : format === "pdf" ? makeLetterPdf : makeLetterDocx;
      const stem = kind === "resume" ? fileStem(text, "resume") : "cover-letter";
      saveBlob(await make(text, template), `${stem}.${format}`);
    } catch {
      setError("Couldn't build the file. Try the other format, or copy the text instead.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-2 text-sm">
          <span className="font-medium">Template</span>
          <select
            className="field !w-auto"
            value={template}
            onChange={(e) => setTemplate(e.target.value as TemplateId)}
          >
            {Object.entries(TEMPLATES).map(([id, t]) => (
              <option key={id} value={id}>
                {t.label}
              </option>
            ))}
          </select>
        </label>
        <button className="btn" disabled={busy || !text.trim()} onClick={() => download("pdf")}>
          Download PDF
        </button>
        <button className="btn-secondary" disabled={busy || !text.trim()} onClick={() => download("docx")}>
          Download Word
        </button>
      </div>
      <p className="text-xs text-muted">
        {TEMPLATES[template].note}. Single column, no tables or images, so applicant tracking
        systems can read it. Built on your device; nothing is uploaded.
      </p>
      {error && <p role="alert" className="text-sm text-bad">{error}</p>}
    </div>
  );
}
