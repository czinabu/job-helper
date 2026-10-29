"use client";

import { FriendlyError } from "./errors";

const MAX_BYTES = 5 * 1024 * 1024;

/**
 * Turns an uploaded resume into plain text, entirely in the browser, so the
 * file is never uploaded anywhere.
 */
export async function parseResume(file: File): Promise<string> {
  if (file.size > MAX_BYTES) {
    throw new FriendlyError("That file is over 5 MB. Try exporting a smaller PDF.");
  }

  const name = file.name.toLowerCase();
  let text: string;
  try {
    if (name.endsWith(".pdf")) {
      // Loaded on demand so the PDF reader only downloads when it's needed.
      const { extractText, getDocumentProxy } = await import("unpdf");
      const pdf = await getDocumentProxy(new Uint8Array(await file.arrayBuffer()));
      ({ text } = await extractText(pdf, { mergePages: true }));
    } else if (name.endsWith(".docx")) {
      const mammoth = await import("mammoth");
      ({ value: text } = await mammoth.extractRawText({ arrayBuffer: await file.arrayBuffer() }));
    } else if (name.endsWith(".txt") || name.endsWith(".md")) {
      text = await file.text();
    } else {
      throw new FriendlyError("Please upload a PDF, Word (.docx), or text file.");
    }
  } catch (error) {
    if (error instanceof FriendlyError) throw error;
    throw new FriendlyError(
      "That file couldn't be read. Try another format, or paste the text instead.",
    );
  }

  text = text.replace(/\r\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
  if (!text) {
    throw new FriendlyError(
      "No text could be read from that file. If it's a scanned image, paste your resume text instead.",
    );
  }
  return text;
}
