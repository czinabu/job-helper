import JSZip from "jszip";

/**
 * Builds PDF and Word files from the plain-text resume ('## ' headings, '- ' bullets) in the
 * browser. Both follow the formatting guidance in formatReview.ts: a single column, standard
 * fonts, 0.75 inch margins, 11 pt body text, and no tables, images, or header/footer text.
 */

export const TEMPLATES = {
  classic: { label: "Classic", note: "Times New Roman, centered name, ruled headings" },
  modern: { label: "Modern", note: "Arial, left-aligned name, bold uppercase headings" },
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

/** jsPDF is large, so it loads only when someone asks for a PDF. */
export async function makeResumePdf(text: string, template: TemplateId): Promise<Blob> {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "pt", format: "letter" });
  const font = template === "classic" ? "times" : "helvetica";
  const body = 11;
  const width = PAGE.w - MARGIN_PT * 2;
  let y = MARGIN_PT;

  const room = (h: number) => {
    if (y + h > PAGE.h - MARGIN_PT) {
      doc.addPage();
      y = MARGIN_PT;
    }
  };
  const write = (
    str: string,
    opts: { size: number; style?: "normal" | "bold"; align?: "left" | "center"; indent?: number; gap?: number },
  ) => {
    doc.setFont(font, opts.style ?? "normal");
    doc.setFontSize(opts.size);
    const indent = opts.indent ?? 0;
    const lines: string[] = doc.splitTextToSize(str, width - indent);
    const lead = opts.size * 1.25;
    for (const line of lines) {
      room(lead);
      y += lead;
      if (opts.align === "center") doc.text(line, PAGE.w / 2, y - opts.size * 0.25, { align: "center" });
      else doc.text(line, MARGIN_PT + indent, y - opts.size * 0.25);
    }
    y += opts.gap ?? 0;
  };

  for (const b of parseResumeText(text)) {
    if (b.kind === "name") {
      write(b.text, { size: 20, style: "bold", align: template === "classic" ? "center" : "left", gap: 2 });
    } else if (b.kind === "contact") {
      write(b.text, { size: 10, align: template === "classic" ? "center" : "left" });
    } else if (b.kind === "heading") {
      y += 8;
      room(40); // keep a heading with the line after it
      const label = template === "modern" ? b.text.toUpperCase() : b.text;
      write(label, { size: 12, style: "bold", gap: 1 });
      if (template === "classic") {
        doc.setLineWidth(0.5);
        doc.line(MARGIN_PT, y, PAGE.w - MARGIN_PT, y);
      }
      y += 3;
    } else if (b.kind === "bullet") {
      room(body * 1.25);
      const startY = y;
      write(b.text, { size: body, indent: 14, gap: 1 });
      doc.setFont(font, "normal");
      doc.text("•", MARGIN_PT + 3, startY + body * 1.25 - body * 0.25);
    } else {
      write(b.text, { size: body, gap: 1 });
    }
  }
  return doc.output("blob");
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
