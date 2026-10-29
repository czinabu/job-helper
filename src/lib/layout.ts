"use client";

import { BULLET, openPdf, pageLines, resumeFileKind, type Line } from "./parseResume";

/**
 * What a resume file looks like on the page, measured in the browser from the
 * uploaded PDF or Word file. Anything that can't be measured is null.
 */
export interface ResumeLayout {
  source: "pdf" | "docx";
  pages: number | null;
  /** Fraction of the last page's height that has text on it, 0 to 1. */
  lastPageFill: number | null;
  /** Space between the page edge and the text, in inches. */
  margins: { top: number; bottom: number; left: number; right: number } | null;
  /** The most common font size, in points. */
  bodySize: number | null;
  /** The largest font size on the page (usually the name), in points. */
  largestSize: number | null;
  distinctSizes: number;
  /** Font family names, e.g. "Calibri". Empty when the file doesn't say. */
  fonts: string[];
  /** Line spacing as a multiple of single spacing (1 = single). */
  lineSpacing: number | null;
  /** How much taller the gap above section headings is than a normal line gap. */
  headingGap: number | null;
  /** The distinct bullet symbols used. Empty for Word files, where bullets are list styles. */
  bulletSymbols: string[];
  columns: boolean;
  tables: boolean;
  images: boolean;
  /** Text sitting in a page header or footer, which some applicant tracking systems skip. */
  headerFooterText: boolean;
}

const EMPTY: Omit<ResumeLayout, "source"> = {
  pages: null,
  lastPageFill: null,
  margins: null,
  bodySize: null,
  largestSize: null,
  distinctSizes: 0,
  fonts: [],
  lineSpacing: null,
  headingGap: null,
  bulletSymbols: [],
  columns: false,
  tables: false,
  images: false,
  headerFooterText: false,
};

/** Measures the layout of an uploaded file. Returns null for plain text or if measuring fails. */
export async function readLayout(file: File): Promise<ResumeLayout | null> {
  try {
    const kind = resumeFileKind(file.name);
    if (kind === "pdf") return await pdfLayout(file);
    if (kind === "docx") return await docxLayout(file);
  } catch {
    // Layout checks are a bonus; the resume text is still analyzed without them.
  }
  return null;
}

const median = (nums: number[]) => {
  const sorted = [...nums].sort((a, b) => a - b);
  return sorted.length ? sorted[Math.floor(sorted.length / 2)] : null;
};

/** The size with the most characters in it, so one big name doesn't count as the body. */
function dominant(weights: Map<number, number>): number | null {
  let best: number | null = null;
  let bestWeight = 0;
  for (const [size, weight] of weights) {
    if (weight > bestWeight) [best, bestWeight] = [size, weight];
  }
  return best;
}

/** "ABCDEF+Calibri-Bold" -> "Calibri" */
function familyName(raw: string): string {
  return raw
    .replace(/^[A-Z]{6}\+/, "")
    .split(/[-,]/)[0]
    .replace(/(PS)?MT$/, "")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .trim();
}

// A PDF's own spacing: a typical single-spaced line sits about 1.2 times the font size below the last.
const SINGLE = 1.2;

async function pdfLayout(file: File): Promise<ResumeLayout> {
  const pdf = await openPdf(file);
  const sizeWeights = new Map<number, number>();
  const fontNames = new Set<string>();
  const bullets = new Set<string>();
  const paragraphGaps: number[] = [];
  const headingRatios: number[] = [];
  let top = Infinity;
  let bottom = Infinity;
  let left = Infinity;
  let right = Infinity;
  let largest = 0;
  let lastFill: number | null = null; // set below
  let splitLines = 0;
  let totalLines = 0;
  const pages: { lines: Line[]; width: number; height: number }[] = [];

  for (let n = 1; n <= pdf.numPages; n++) {
    const page = await pdf.getPage(n);
    const [x0, y0, x1, y1] = page.view;
    const width = x1 - x0;
    const height = y1 - y0;
    // Loading the page's fonts lets us read their real names.
    await page.getOperatorList().catch(() => null);
    const lines = await pageLines(page);
    for (const line of lines) {
      if (line.font) {
        try {
          const name = page.commonObjs.get(line.font)?.name;
          if (typeof name === "string") fontNames.add(familyName(name));
          line.font = typeof name === "string" ? name : line.font;
        } catch {
          // Not loaded; the font just stays unnamed.
        }
      }
    }
    pages.push({ lines, width, height });
  }

  for (const { lines, width, height } of pages) {
    if (!lines.length) continue;
    for (const l of lines) {
      const size = Math.round(l.size * 2) / 2;
      sizeWeights.set(size, (sizeWeights.get(size) ?? 0) + l.text.length);
      largest = Math.max(largest, l.size);
      top = Math.min(top, height - (l.y + l.size * 0.8));
      bottom = Math.min(bottom, l.y);
      left = Math.min(left, l.left);
      right = Math.min(right, width - l.right);
      const symbol = BULLET.test(l.text) ? l.text[0] : null;
      if (symbol) bullets.add(symbol);
    }
  }

  const bodySize = dominant(sizeWeights);

  for (const { lines, width } of pages) {
    for (let i = 0; i < lines.length; i++) {
      const l = lines[i];
      totalLines++;
      if (l.splits.some((x) => x > width * 0.3 && x < width * 0.65)) splitLines++;
      if (i === 0 || bodySize === null) continue;
      const gap = lines[i - 1].y - l.y;
      if (gap <= 0) continue;
      const sameSize = Math.abs(l.size - bodySize) < 1 && Math.abs(lines[i - 1].size - bodySize) < 1;
      if (sameSize && gap < bodySize * 2.2) paragraphGaps.push(gap);
    }
  }

  const typicalGap = median(paragraphGaps);
  for (const { lines } of pages) {
    for (let i = 1; i < lines.length; i++) {
      const l = lines[i];
      const text = l.text.trim();
      const looksLikeHeading =
        text.length <= 40 &&
        !BULLET.test(text) &&
        (l.size > (bodySize ?? 0) + 0.5 || (text === text.toUpperCase() && /[A-Z]/.test(text)) || /bold/i.test(l.font));
      const gap = lines[i - 1].y - l.y;
      if (looksLikeHeading && typicalGap && gap > 0 && lines[i - 1].size <= (bodySize ?? 99) + 0.5) {
        headingRatios.push(gap / typicalGap);
      }
    }
  }

  // Page fill: how far down the last page the text reaches.
  const last = pages[pages.length - 1];
  if (last?.lines.length) {
    const lowestY = Math.min(...last.lines.map((l) => l.y));
    lastFill = (last.height - lowestY) / last.height;
  }

  return {
    ...EMPTY,
    source: "pdf",
    pages: pdf.numPages,
    lastPageFill: lastFill,
    margins: Number.isFinite(top)
      ? {
          top: top / 72,
          bottom: bottom / 72,
          left: left / 72,
          // Ragged-right text never reaches the real margin, so past 1.5 in the right side is a guess.
          right: (right > 1.5 * 72 ? left : right) / 72,
        }
      : null,
    bodySize,
    largestSize: largest || null,
    distinctSizes: sizeWeights.size,
    fonts: [...fontNames].filter(Boolean),
    lineSpacing: typicalGap && bodySize ? typicalGap / (bodySize * SINGLE) : null,
    headingGap: median(headingRatios),
    bulletSymbols: [...bullets],
    columns: totalLines >= 8 && splitLines / totalLines > 0.25,
  };
}

async function docxLayout(file: File): Promise<ResumeLayout> {
  const { default: JSZip } = await import("jszip");
  const zip = await JSZip.loadAsync(await file.arrayBuffer());
  const read = async (path: string) => (await zip.file(path)?.async("string")) ?? "";
  const parse = (xml: string) => new DOMParser().parseFromString(xml, "application/xml");

  const doc = parse(await read("word/document.xml"));
  const styles = parse(await read("word/styles.xml"));
  const app = await read("docProps/app.xml");

  const W = "http://schemas.openxmlformats.org/wordprocessingml/2006/main";
  const all = (root: Document | Element, tag: string) => Array.from(root.getElementsByTagNameNS(W, tag));
  const attr = (el: Element | null | undefined, name: string) => el?.getAttributeNS(W, name) ?? null;
  const first = (root: Document | Element, tag: string) => all(root, tag)[0] ?? null;

  const defaults = first(styles, "docDefaults");
  const defaultSize = defaults ? Number(attr(first(defaults, "sz"), "val")) / 2 || null : null;
  const defaultFont = defaults ? attr(first(defaults, "rFonts"), "ascii") : null;
  const defaultLine = defaults ? Number(attr(first(defaults, "spacing"), "line")) / 240 || null : null;

  const sizeWeights = new Map<number, number>();
  const fonts = new Set<string>();
  const lineRatios: number[] = [];
  for (const p of all(doc, "p")) {
    const chars = (p.textContent ?? "").trim().length;
    if (!chars) continue;
    const run = first(p, "r");
    const size = Number(attr(run && first(run, "sz"), "val")) / 2 || defaultSize;
    if (size) sizeWeights.set(size, (sizeWeights.get(size) ?? 0) + chars);
    const font = (run && attr(first(run, "rFonts"), "ascii")) || defaultFont;
    if (font) fonts.add(font);
    const spacing = first(p, "spacing");
    const rule = attr(spacing, "lineRule");
    const line = Number(attr(spacing, "line")) / 240;
    if (line && (!rule || rule === "auto")) lineRatios.push(line);
    else if (defaultLine) lineRatios.push(defaultLine);
  }

  const pgMar = first(doc, "pgMar");
  const twips = (name: string) => Number(attr(pgMar, name)) / 1440;
  const pgCount = Number(/<Pages>(\d+)<\/Pages>/.exec(app)?.[1]) || null;

  let headerFooterText = false;
  for (const name of Object.keys(zip.files)) {
    if (!/^word\/(header|footer)\d*\.xml$/.test(name)) continue;
    const text = all(parse(await read(name)), "t").map((t) => t.textContent).join("").trim();
    if (text) headerFooterText = true;
  }

  const sizes = [...sizeWeights.keys()];
  return {
    ...EMPTY,
    source: "docx",
    pages: pgCount,
    margins: pgMar
      ? { top: twips("top"), bottom: twips("bottom"), left: twips("left"), right: twips("right") }
      : null,
    bodySize: dominant(sizeWeights),
    largestSize: sizes.length ? Math.max(...sizes) : null,
    distinctSizes: sizes.length,
    fonts: [...fonts],
    lineSpacing: median(lineRatios),
    columns: all(doc, "cols").some((c) => Number(attr(c, "num")) > 1) || all(doc, "txbxContent").length > 0,
    tables: all(doc, "tbl").length > 0,
    images: all(doc, "drawing").length + all(doc, "pict").length > 0,
    headerFooterText,
  };
}
