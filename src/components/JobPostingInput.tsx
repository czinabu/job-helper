"use client";

import { useState } from "react";
import { friendlyMessage } from "@/lib/errors";
import { isImage, parseJobPosting } from "@/lib/parseJobPosting";

interface Props {
  text: string;
  onChange: (text: string) => void;
}

/**
 * The job posting step: paste text, paste or drop a screenshot, or attach a
 * file. Screenshots are read with OCR in this browser; the extracted text goes
 * into the same box so it can be checked and fixed before tailoring.
 */
export function JobPostingInput({ text, onChange }: Props) {
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [note, setNote] = useState("");

  async function read(file: File) {
    setBusy(true);
    setProgress(null);
    setError("");
    setNote("");
    try {
      const parsed = await parseJobPosting(file, setProgress);
      onChange(text.trim() ? `${text.trim()}\n\n${parsed}` : parsed);
      setNote(
        isImage(file)
          ? "Text read from your screenshot in this browser. Check it below for mistakes."
          : `Text read from ${file.name}.`,
      );
    } catch (e) {
      setError(friendlyMessage(e));
    } finally {
      setBusy(false);
      setProgress(null);
    }
  }

  return (
    <div
      className="space-y-3"
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        const file = e.dataTransfer.files?.[0];
        if (file && !busy) {
          e.preventDefault();
          read(file);
        }
      }}
    >
      <textarea
        className="field h-48"
        value={text}
        disabled={busy}
        onChange={(e) => onChange(e.target.value)}
        onPaste={(e) => {
          const image = Array.from(e.clipboardData.files).find(isImage);
          if (image) {
            e.preventDefault();
            read(image);
          }
        }}
        placeholder="Paste the job description here, paste or drop a screenshot of it, or attach a file."
      />
      <div className="flex flex-wrap items-center gap-3">
        <label className="btn-secondary inline-block cursor-pointer">
          {busy
            ? progress !== null
              ? `Reading screenshot... ${progress}%`
              : "Reading..."
            : "Upload screenshot or file"}
          <input
            type="file"
            accept="image/*,.pdf,.docx,.txt,.md"
            className="hidden"
            disabled={busy}
            onChange={(e) => {
              const chosen = e.target.files?.[0];
              if (chosen) read(chosen);
              e.target.value = "";
            }}
          />
        </label>
        <span className="text-xs text-muted">Image, PDF, Word, or text file. Read in your browser.</span>
      </div>
      {note && !error && <p className="text-xs text-muted">{note}</p>}
      {error && <p className="text-sm text-bad">{error}</p>}
    </div>
  );
}
