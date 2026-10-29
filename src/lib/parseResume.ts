"use client";

import { FriendlyError } from "./errors";

const MAX_BYTES = 5 * 1024 * 1024;

export type ResumeFileKind = "pdf" | "docx" | "text";

export function resumeFileKind(name: string): ResumeFileKind | null {
  const lower = name.toLowerCase();
  if (lower.endsWith(".pdf")) return "pdf";
  if (lower.endsWith(".docx")) return "docx";
  if (lower.endsWith(".txt") || lower.endsWith(".md")) return "text";
  return null;
}

/** Opens a PDF with the PDF reader, which is loaded on demand so it only downloads when needed. */
export async function openPdf(file: Blob) {
  const { getDocumentProxy } = await import("unpdf");
  // The reader takes ownership of the bytes it's given, so hand it a fresh copy each time.
  return getDocumentProxy(new Uint8Array(await file.arrayBuffer()));
}

/**
 * Turns an uploaded resume into plain text, entirely in the browser, so the
 * file is never uploaded anywhere.
 */
export async function parseResume(file: File): Promise<string> {
  if (file.size > MAX_BYTES) {
    throw new FriendlyError("That file is over 5 MB. Try exporting a smaller PDF.");
  }

  const kind = resumeFileKind(file.name);
  if (!kind) throw new FriendlyError("Please upload a PDF, Word (.docx), or text file.");

  let text: string;
  try {
    if (kind === "pdf") {
      text = await pdfText(await openPdf(file));
    } else if (kind === "docx") {
      const mammoth = await import("mammoth");
      ({ value: text } = await mammoth.extractRawText({ arrayBuffer: await file.arrayBuffer() }));
    } else {
      text = await file.text();
    }
  } catch (error) {
    if (error instanceof FriendlyError) throw error;
    throw new FriendlyError(
      "That file couldn't be read. Try another format, or paste the text instead.",
    );
  }

  text = text
    .replace(/\r\n/g, "\n")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
  if (!text) {
    throw new FriendlyError(
      "No text could be read from that file. If it's a scanned image, paste your resume text instead.",
    );
  }
  return text;
}

type Pdf = Awaited<ReturnType<typeof openPdf>>;
export type PdfPage = Awaited<ReturnType<Pdf["getPage"]>>;

export interface Line {
  text: string;
  left: number;
  right: number;
  y: number;
  size: number;
  /** The font of the line's first piece, as the PDF names it (e.g. "ABCDEF+Calibri-Bold"). */
  font: string;
  /** Where on the line (x) a wide gap starts a new chunk of text, which hints at columns. */
  splits: number[];
}

export const BULLET = /^[•·▪◦●■►▸➢✓*–—-]\s/;

/**
 * Rebuilds the text of a PDF from where each piece sits on the page, so lines
 * that only broke because they reached the margin are joined back together,
 * while headings, bullets, and section gaps keep their own lines.
 */
async function pdfText(pdf: Pdf): Promise<string> {
  const pages: string[] = [];
  for (let n = 1; n <= pdf.numPages; n++) {
    pages.push(joinLines(await pageLines(await pdf.getPage(n))));
  }
  return pages.join("\n\n");
}

/** The lines of text on one PDF page, top to bottom, with where each sits. */
export async function pageLines(page: PdfPage): Promise<Line[]> {
  const content = await page.getTextContent();
  const lines: Line[] = [];
  for (const item of content.items) {
    if (!("str" in item) || !item.str) continue;
    const x = item.transform[4];
    const y = item.transform[5];
    const size = Math.hypot(item.transform[2], item.transform[3]) || item.height || 10;
    const line = lines[lines.length - 1];
    if (line && Math.abs(line.y - y) < size * 0.5) {
      // Same line: add a space if the gap between the pieces looks like one.
      const gap = x - line.right;
      if (gap > size * 0.15 && !/\s$/.test(line.text) && !/^\s/.test(item.str)) {
        line.text += " ";
      }
      if (gap > size * 2.5 && item.str.trim()) line.splits.push(x);
      line.text += item.str;
      line.right = Math.max(line.right, x + item.width);
      line.left = Math.min(line.left, x);
    } else {
      lines.push({ text: item.str, left: x, right: x + item.width, y, size, font: item.fontName, splits: [] });
    }
  }
  return lines.filter((line) => line.text.trim());
}

function joinLines(lines: Line[]): string {
  if (!lines.length) return "";
  const left = Math.min(...lines.map((l) => l.left));
  const right = Math.max(...lines.map((l) => l.right));
  const gaps = lines
    .slice(1)
    .map((l, i) => lines[i].y - l.y)
    .filter((g) => g > 0)
    .sort((a, b) => a - b);
  const lineGap = gaps[Math.floor(gaps.length / 2)] ?? 0;

  let out = lines[0].text.trim();
  for (let i = 1; i < lines.length; i++) {
    const prev = lines[i - 1];
    const line = lines[i];
    const text = line.text.trim();
    const gap = prev.y - line.y;
    const reachedMargin = prev.right >= right - (right - left) * 0.12;
    const sameBlock = gap > 0 && gap <= lineGap * 1.3;
    const startsNewItem =
      BULLET.test(text) || (/[.!?:]$/.test(out) && /^[A-Z0-9]/.test(text));

    if (sameBlock && reachedMargin && !startsNewItem && Math.abs(prev.size - line.size) < 1) {
      out += /-$/.test(out) && /^[a-z]/.test(text) ? text : ` ${text}`;
    } else {
      out += gap > lineGap * 1.8 ? `\n\n${text}` : `\n${text}`;
    }
  }
  return out;
}
