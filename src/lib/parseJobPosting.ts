"use client";

import { FriendlyError } from "./errors";
import { parseResume } from "./parseResume";

const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const IMAGE_TYPES = /^image\/(png|jpe?g|webp|bmp|gif)$/;

export function isImage(file: File): boolean {
  return IMAGE_TYPES.test(file.type) || /\.(png|jpe?g|webp|bmp|gif)$/i.test(file.name);
}

/**
 * Reads a screenshot with OCR in the browser, so it works with every provider
 * and the image never leaves this device. The OCR engine and English language
 * data are downloaded once on first use, then cached by the browser.
 */
async function imageText(file: File, onProgress?: (percent: number) => void): Promise<string> {
  if (file.size > MAX_IMAGE_BYTES) {
    throw new FriendlyError("That image is over 10 MB. Try a smaller screenshot.");
  }
  const { createWorker } = await import("tesseract.js");
  const worker = await createWorker("eng", 1, {
    logger: (m) => {
      if (m.status === "recognizing text") onProgress?.(Math.round(m.progress * 100));
    },
  });
  try {
    const { data } = await worker.recognize(file);
    return data.text;
  } finally {
    await worker.terminate();
  }
}

/** Turns a screenshot, PDF, Word, or text file into the text of a job posting. */
export async function parseJobPosting(
  file: File,
  onProgress?: (percent: number) => void,
): Promise<string> {
  if (!isImage(file)) return parseResume(file, "job posting");

  let text: string;
  try {
    text = await imageText(file, onProgress);
  } catch (error) {
    if (error instanceof FriendlyError) throw error;
    throw new FriendlyError(
      "That image couldn't be read. Check your connection (the reader downloads on first use), or paste the text instead.",
    );
  }
  text = text.replace(/[ \t]+\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
  if (!text) {
    throw new FriendlyError("No text was found in that image. Try a sharper screenshot, or paste the text.");
  }
  return text;
}
