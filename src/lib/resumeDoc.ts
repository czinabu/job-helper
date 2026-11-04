import JSZip from "jszip";

/**
 * Builds PDF and Word files from the plain-text resume ('## ' headings, '- ' bullets) in the
 * browser. Both follow the formatting guidance in formatReview.ts: a single column, standard
 * fonts, 0.75 inch margins, 11 pt body text, and no tables, images, or header/footer text.
 */

export const TEMPLATES = {
  classic: { label: "Classic", note: "Times New Roman, centered name, ruled headings" },
  modern: { label: "Modern", note: "Arial, blue accent, left-aligned name, ruled uppercase headings" },
} as const;
export type TemplateId = keyof typeof TEMPLATES;

type Block =
  | { kind: "name"; text: string }
  | { kind: "contact"; text: string }
  | { kind: "heading"; text: string }
  | { kind: "bullet"; text: string }
  | { kind: "text"; text: string };

/** Turns the resume text into blocks. The first plain line is the name, the lines until the first heading are contact details. */
export function parseResumeText(text: string): Block[] {
  const blocks: Block[] = [];
  let seenHeading = false;
  for (const raw of text.replace(/\r\n?/g, "\n").split("\n")) {
    const line = raw.trim().replace(/\*\*/g, "");
    if (!line) continue;
    const heading = /^#{1,6}\s+(.*)$/.exec(line);
    const bullet = /^[-*•]\s+(.*)$/.exec(line);
    if (heading) {
      seenHeading = true;
      blocks.push({ kind: "heading", text: heading[1].replace(/[*_]/g, "").trim() });
    } else if (bullet) {
      blocks.push({ kind: "bullet", text: bullet[1].trim() });
    } else if (!seenHeading && !blocks.some((b) => b.kind === "name")) {
      blocks.push({ kind: "name", text: line.replace(/[*_]/g, "") });
    } else if (!seenHeading) {
      blocks.push({ kind: "contact", text: line });
    } else {
      blocks.push({ kind: "text", text: line });
    }
  }
  return blocks;
}

const MARGIN_PT = 54; // 0.75 inch
const PAGE = { w: 612, h: 792 }; // US Letter

/** Safe file name stem, like "Jane-Doe-resume". */
export function fileStem(text: string, suffix: string): string {
  const first = text.split("\n").find((l) => l.trim() && !l.startsWith("#")) ?? "";
  const name = first.replace(/[^\p{L}\p{N} ]/gu, "").trim().split(/\s+/).slice(0, 3).join("-");
  return `${name || "my"}-${suffix}`;
}

export function saveBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

const ACCENT: [number, number, number] = [29, 78, 216]; // Modern template accent (blue)
const MUTED: [number, number, number] = [90, 98, 110];
const INK: [number, number, number] = [24, 28, 36];

/** "Company - Role | June 2026 - Present" -> company, role, dates. Only lines that end in a date-like part count. */
export function parseEntryLine(text: string): { company: string; role: string; dates: string } | null {
  const i = text.lastIndexOf(" | ");
  if (i < 0) return null;
  const dates = text.slice(i + 3).trim();
  if (!/\d{4}|present|current/i.test(dates)) return null;
  const left = text.slice(0, i).trim();
  const m = /^(.+?)\s+[-–—]\s+(.+)$/.exec(left);
  return { company: m ? m[1] : left, role: m ? m[2] : "", dates };
}

type Word = { text: string; url?: string };

/** Splits a contact line into words, keeping links: [label](url), bare URLs, and email addresses become clickable. */
export function contactWords(line: string): Word[] {
  const words: Word[] = [];
  const re = /\[([^\]]+)\]\(((?:https?:\/\/|mailto:)[^)\s]+)\)|(https?:\/\/[^\s•|]+)|([\w.+-]+@[\w-]+(?:\.[\w-]+)+)/g;
  const plain = (t: string) => {
    for (const w of t.split(/\s+/)) if (w) words.push({ text: w });
  };
  let last = 0;
  for (let m = re.exec(line); m; m = re.exec(line)) {
    plain(line.slice(last, m.index));
    if (m[1]) for (const w of m[1].split(/\s+/)) words.push({ text: w, url: m[2] });
    else if (m[3]) words.push({ text: m[3].replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, ""), url: m[3] });
    else words.push({ text: m[4], url: `mailto:${m[4]}` });
    last = m.index + m[0].length;
  }
  plain(line.slice(last));
  return words;
}

/**
 * jsPDF is large, so it loads only when someone asks for a PDF. A resume that is a little too long for one
 * page is shrunk step by step (type size, spacing, then margins) until it fits, down to a still-readable floor.
 */
export async function makeResumePdf(text: string, template: TemplateId): Promise<Blob> {
  const { jsPDF } = await import("jspdf");
  const blocks = parseResumeText(text);
  const steps = [1, 0.96, 0.92, 0.88, 0.85];
  let result: { doc: InstanceType<typeof jsPDF>; pages: number } | null = null;
  for (const scale of steps) {
    result = renderResume(jsPDF, blocks, template, scale);
    if (result.pages === 1) break;
  }
  // Still more than one page at the smallest size: use full size, which reads best across pages.
  if (result && result.pages > 1) result = renderResume(jsPDF, blocks, template, 1);
  return result!.doc.output("blob");
}

function renderResume(
  jsPDF: typeof import("jspdf").jsPDF,
  blocks: Block[],
  template: TemplateId,
  s: number,
): { doc: InstanceType<typeof jsPDF>; pages: number } {
  const modern = template === "modern";
  const doc = new jsPDF({ unit: "pt", format: "letter" });
  const font = modern ? "helvetica" : "times";
  const margin = s < 0.9 ? 43 : MARGIN_PT;
  const width = PAGE.w - margin * 2;
  const body = 11 * s;
  const lead = 1.25;
  const bottom = PAGE.h - margin;
  let y = margin;

  const color = (c: [number, number, number]) => doc.setTextColor(c[0], c[1], c[2]);
  const setFont = (size: number, style: "normal" | "bold" | "italic" = "normal") => {
    doc.setFont(font, style);
    doc.setFontSize(size);
  };
  const lines = (str: string, size: number, w: number, style: "normal" | "bold" = "normal"): string[] => {
    setFont(size, style);
    return doc.splitTextToSize(str, w);
  };
  const room = (h: number) => {
    if (y + h > bottom) {
      doc.addPage();
      y = margin;
    }
  };

  // Writes wrapped text. Each line's baseline is placed before its glyphs are drawn.
  const write = (
    str: string,
    o: { size: number; style?: "normal" | "bold"; align?: "left" | "center"; indent?: number; gap?: number; rgb?: [number, number, number]; before?: () => void },
  ) => {
    const indent = o.indent ?? 0;
    const ls = lines(str, o.size, width - indent, o.style ?? "normal");
    color(o.rgb ?? INK);
    ls.forEach((line, n) => {
      room(o.size * lead);
      y += o.size * lead;
      if (n === 0) o.before?.();
      setFont(o.size, o.style ?? "normal");
      color(o.rgb ?? INK);
      if (o.align === "center") doc.text(line, PAGE.w / 2, y - o.size * 0.25, { align: "center" });
      else doc.text(line, margin + indent, y - o.size * 0.25);
    });
    y += o.gap ?? 0;
  };

  const writeContact = (line: string, center: boolean) => {
    const size = 10 * s;
    setFont(size);
    const words = contactWords(line);
    const space = doc.getTextWidth(" ");
    const rows: Word[][] = [[]];
    let rowW = 0;
    for (const w of words) {
      const ww = doc.getTextWidth(w.text);
      if (rows[rows.length - 1].length && rowW + space + ww > width) {
        rows.push([]);
        rowW = 0;
      }
      rows[rows.length - 1].push(w);
      rowW += (rowW ? space : 0) + ww;
    }
    for (const row of rows) {
      room(size * lead);
      y += size * lead;
      const total = row.reduce((t, w, i) => t + doc.getTextWidth(w.text) + (i ? space : 0), 0);
      let x = center ? (PAGE.w - total) / 2 : margin;
      const base = y - size * 0.25;
      for (const w of row) {
        const ww = doc.getTextWidth(w.text);
        if (w.url) {
          color(modern ? ACCENT : INK);
          doc.text(w.text, x, base);
          doc.link(x, base - size, ww, size * 1.2, { url: w.url });
          doc.setLineWidth(0.4);
          doc.setDrawColor(...(modern ? ACCENT : INK));
          doc.line(x, base + 1.2, x + ww, base + 1.2);
        } else {
          color(modern ? MUTED : INK);
          doc.text(w.text, x, base);
        }
        x += ww + space;
      }
    }
    y += 1;
  };

  // Height of the first thing under a heading or entry line, so they are never left alone at the bottom of a page.
  const firstHeight = (i: number): number => {
    const b = blocks[i];
    if (!b) return 0;
    if (b.kind === "text" && parseEntryLine(b.text)) {
      const n = blocks[i + 1];
      return 13 * s * lead + (n && n.kind === "bullet" ? body * lead : 0);
    }
    return body * lead;
  };

  blocks.forEach((b, i) => {
    if (b.kind === "name") {
      write(b.text, { size: (modern ? 26 : 20) * s, style: "bold", align: modern ? "left" : "center", gap: 2 * s, rgb: INK });
    } else if (b.kind === "contact") {
      writeContact(b.text, !modern);
    } else if (b.kind === "heading") {
      const size = (modern ? 11 : 12) * s;
      y += (modern ? 9 : 8) * s;
      room(size * lead + 6 + firstHeight(i + 1));
      if (modern) {
        doc.setCharSpace(0.8);
        write(b.text.toUpperCase(), { size, style: "bold", rgb: ACCENT, gap: 0 });
        doc.setCharSpace(0);
        doc.setLineWidth(0.9);
        doc.setDrawColor(...ACCENT);
        doc.line(margin, y + 1.5, PAGE.w - margin, y + 1.5);
        y += 4 * s;
      } else {
        write(b.text, { size, style: "bold", gap: 1 });
        doc.setLineWidth(0.5);
        doc.setDrawColor(0, 0, 0);
        doc.line(margin, y, PAGE.w - margin, y);
        y += 3 * s;
      }
    } else if (b.kind === "bullet") {
      const size = body;
      write(b.text, {
        size,
        indent: 14 * s,
        gap: 1.5 * s,
        // The bullet is drawn before its sentence so text extraction reads it first, as it appears on the page.
        before: () => {
          setFont(size);
          color(modern ? ACCENT : INK);
          doc.text("•", margin + 3 * s, y - size * 0.25);
        },
      });
    } else {
      const entry = parseEntryLine(b.text);
      if (!entry) {
        write(b.text, { size: body, gap: 1 });
        return;
      }
      const size = 11.5 * s;
      y += 5 * s; // space between roles
      room(size * lead + firstHeight(i + 1) - 13 * s * lead + 1);
      setFont(size, "bold");
      const datesW = (setFont(size - 0.5), doc.getTextWidth(entry.dates));
      const leftW = width - datesW - 12;
      const roleStyle = modern ? "normal" : "italic";
      // Company in bold, role after it; wrap onto a second line if the pair is too wide.
      setFont(size, "bold");
      const compW = doc.getTextWidth(entry.company);
      setFont(size, roleStyle);
      const sepText = entry.role ? "  |  " : "";
      const roleFull = entry.role ? `${sepText}${entry.role}` : "";
      room(size * lead);
      y += size * lead;
      const base = y - size * 0.25;
      setFont(size, "bold");
      color(INK);
      doc.text(entry.company, margin, base);
      let cursor = margin + compW;
      if (roleFull) {
        setFont(size, roleStyle);
        const rl: string[] = doc.splitTextToSize(roleFull, Math.max(leftW - compW, 60));
        doc.text(rl[0], cursor, base);
        for (const extra of rl.slice(1)) {
          y += size * lead;
          doc.text(extra.trimStart(), margin, y - size * 0.25);
        }
        cursor += 0;
      }
      setFont(size - 0.5, "normal");
      color(modern ? MUTED : INK);
      doc.text(entry.dates, PAGE.w - margin, base, { align: "right" });
      y += 2 * s;
    }
  });
  return { doc, pages: doc.getNumberOfPages() };
}

/** Plain-text letter: first lines are kept as written, blank lines separate paragraphs. */
export async function makeLetterPdf(text: string, template: TemplateId): Promise<Blob> {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "pt", format: "letter" });
  const font = template === "classic" ? "times" : "helvetica";
  doc.setFont(font, "normal");
  doc.setFontSize(11.5);
  const lead = 11.5 * 1.35;
  const width = PAGE.w - MARGIN_PT * 2;
  let y = MARGIN_PT;
  for (const para of text.replace(/\r\n?/g, "\n").split("\n")) {
    const lines: string[] = para.trim() ? doc.splitTextToSize(para, width) : [""];
    for (const line of lines) {
      if (y + lead > PAGE.h - MARGIN_PT) {
        doc.addPage();
        y = MARGIN_PT;
      }
      y += lead;
      if (line) doc.text(line, MARGIN_PT, y - 3);
    }
  }
  return doc.output("blob");
}

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

type Para = { text: string; size: number; bold?: boolean; center?: boolean; rule?: boolean; hang?: boolean; before?: number; after?: number };

function paraXml(p: Para): string {
  const ppr = [
    p.rule ? '<w:pBdr><w:bottom w:val="single" w:sz="4" w:space="1" w:color="000000"/></w:pBdr>' : "",
    `<w:spacing w:before="${p.before ?? 0}" w:after="${p.after ?? 20}"/>`,
    p.hang ? '<w:ind w:left="360" w:hanging="260"/>' : "",
    p.center ? '<w:jc w:val="center"/>' : "",
  ].join("");
  const rpr = `${p.bold ? "<w:b/>" : ""}<w:sz w:val="${p.size * 2}"/>`;
  return `<w:p><w:pPr>${ppr}</w:pPr><w:r><w:rPr>${rpr}</w:rPr><w:t xml:space="preserve">${esc(p.text)}</w:t></w:r></w:p>`;
}

async function zipDocx(paras: Para[], font: string): Promise<Blob> {
  const zip = new JSZip();
  zip.file(
    "[Content_Types].xml",
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/><Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/></Types>',
  );
  zip.file(
    "_rels/.rels",
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>',
  );
  zip.file(
    "word/_rels/document.xml.rels",
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>',
  );
  zip.file(
    "word/styles.xml",
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:docDefaults><w:rPrDefault><w:rPr><w:rFonts w:ascii="${font}" w:hAnsi="${font}" w:cs="${font}"/><w:sz w:val="22"/></w:rPr></w:rPrDefault></w:docDefaults></w:styles>`,
  );
  zip.file(
    "word/document.xml",
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>${paras.map(paraXml).join("")}<w:sectPr><w:pgSz w:w="12240" w:h="15840"/><w:pgMar w:top="1080" w:right="1080" w:bottom="1080" w:left="1080" w:header="720" w:footer="720" w:gutter="0"/></w:sectPr></w:body></w:document>`,
  );
  return zip.generateAsync({
    type: "blob",
    mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  });
}

export function makeResumeDocx(text: string, template: TemplateId): Promise<Blob> {
  const classic = template === "classic";
  const paras: Para[] = parseResumeText(text).map((b): Para => {
    switch (b.kind) {
      case "name":
        return { text: b.text, size: 20, bold: true, center: classic, after: 40 };
      case "contact":
        return { text: b.text, size: 10, center: classic };
      case "heading":
        return {
          text: classic ? b.text : b.text.toUpperCase(),
          size: 12,
          bold: true,
          rule: classic,
          before: 160,
          after: 60,
        };
      case "bullet":
        return { text: `•\t${b.text}`, size: 11, hang: true };
      default:
        return { text: b.text, size: 11 };
    }
  });
  return zipDocx(paras, classic ? "Times New Roman" : "Arial");
}

export function makeLetterDocx(text: string, template: TemplateId): Promise<Blob> {
  const paras = text
    .replace(/\r\n?/g, "\n")
    .split("\n")
    .map((line): Para => ({ text: line, size: 11, after: 0 }));
  return zipDocx(paras, template === "classic" ? "Times New Roman" : "Arial");
}
