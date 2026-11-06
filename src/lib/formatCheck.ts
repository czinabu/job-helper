import type { ResumeLayout } from "./layout";

export type CheckStatus = "pass" | "warn" | "fail";

export interface Source {
  label: string;
  url: string;
}

// Expert guidance the checks are based on. Each check names the source it follows.
const JOBSCAN: Source = {
  label: "Jobscan",
  url: "https://www.jobscan.co/blog/how-to-set-resume-margins/",
};
const TOPRESUME: Source = {
  label: "TopResume",
  url: "https://topresume.com/career-advice/best-margin-size-on-your-resume",
};
const RESUME_GENIUS: Source = {
  label: "Resume Genius",
  url: "https://resumegenius.com/how-to-write-a-resume/resume-fonts-margins-paper-guidelines",
};

export interface Check {
  id: string;
  status: CheckStatus;
  title: string;
  detail: string;
  source: Source;
}

export interface FormatReport {
  /** 0 to 100, from the checks below. */
  score: number;
  checks: Check[];
  /** True when only the text was available, so file-based checks were skipped. */
  textOnly: boolean;
}

const SAFE_FONTS = ["arial", "calibri", "times new roman", "times", "helvetica", "georgia", "cambria", "garamond", "verdana", "tahoma", "liberation", "dejavu", "open sans", "lato", "roboto", "carlito", "arimo"];
const BULLET_LINE = /^\s*[•·▪◦●■►▸➢✓*–—-]\s/;

const listOf = (items: string[]) =>
  items.length < 3 ? items.join(" and ") : `${items.slice(0, -1).join(", ")}, and ${items[items.length - 1]}`;

const inches = (n: number) => `${n.toFixed(2).replace(/0$/, "")} in`;

/** Checks a resume against what resume experts and recruiters recommend. */
export function checkFormat(text: string, layout: ResumeLayout | null): FormatReport {
  const checks: Check[] = [];
  const add = (id: string, status: CheckStatus, title: string, detail: string, source: Source) =>
    checks.push({ id, status, title, detail, source });

  const words = text.trim().split(/\s+/).filter(Boolean).length;
  const lines = text.split("\n");

  // Length
  const pages = layout?.pages ?? Math.max(1, Math.round(words / 500));
  const estimated = layout?.pages == null;
  if (pages > 2) {
    add("length", "fail", "Too long", `${estimated ? "About " : ""}${pages} pages. Recruiters skim, so aim for one page (two at most with 10+ years of experience).`, JOBSCAN);
  } else if (pages === 2 && layout?.lastPageFill != null && layout.lastPageFill < 0.3) {
    add("length", "warn", "Barely onto a second page", "A few lines spill onto page two. Tighten it to one page, or add enough to justify the second.", JOBSCAN);
  } else if (pages === 2) {
    add("length", "pass", "Two pages", "Fine if you have a lot of relevant experience. Keep the strongest material on page one.", TOPRESUME);
  } else {
    add("length", "pass", "One page", "Concise, which is what most recruiters prefer.", JOBSCAN);
  }

  if (layout) {
    const m = layout.margins;
    if (m) {
      const smallest = Math.min(m.top, m.bottom, m.left, m.right);
      const biggest = Math.max(m.left, m.right);
      if (smallest < 0.5) {
        add("margins", "fail", "Margins too tight", `Smallest margin is about ${inches(smallest)}. Experts say stay between 0.5 and 1 inch; tighter risks being cut off when printed.`, TOPRESUME);
      } else if (biggest > 1.5) {
        add("margins", "warn", "Wide side margins", `Side margins are about ${inches(biggest)}. That wastes space you could use for content; 1 inch is standard.`, JOBSCAN);
      } else if (Math.abs(m.left - m.right) > 0.3) {
        add("margins", "warn", "Uneven left and right margins", `Left is about ${inches(m.left)}, right is about ${inches(m.right)}. Matching them looks more polished.`, TOPRESUME);
      } else {
        add("margins", "pass", "Comfortable margins", `About ${inches(smallest)} or more on every side, within the recommended 0.5 to 1 inch.`, TOPRESUME);
      }
    }

    if (layout.bodySize) {
      const size = layout.bodySize;
      if (size < 10) {
        add("font-size", "fail", "Body text too small", `Body text is about ${size} pt. Use 10 to 12 pt so it's readable.`, JOBSCAN);
      } else if (size > 12.5) {
        add("font-size", "warn", "Body text large", `Body text is about ${size} pt. 10 to 12 pt is the norm; larger fills space without adding content.`, JOBSCAN);
      } else {
        add("font-size", "pass", "Readable body text", `Body text is about ${size} pt, in the recommended 10 to 12 pt range.`, JOBSCAN);
      }
      if (layout.largestSize && layout.largestSize < size + 2) {
        add("hierarchy", "warn", "Name and headings don't stand out", "Make your name and section headings slightly larger or bolder than body text so the page is easy to scan.", RESUME_GENIUS);
      }
    }

    if (layout.fonts.length > 0) {
      const odd = layout.fonts.filter((f) => !SAFE_FONTS.some((s) => f.toLowerCase().includes(s)));
      if (layout.fonts.length > 2) {
        add("fonts", "warn", "Too many fonts", `Uses ${layout.fonts.length} fonts (${layout.fonts.join(", ")}). Stick to one or two.`, RESUME_GENIUS);
      } else if (odd.length) {
        add("fonts", "warn", "Unusual font", `${odd.join(", ")} may not render or parse reliably. Arial, Calibri, or Times New Roman are the safe picks.`, JOBSCAN);
      } else {
        add("fonts", "pass", "Standard font", `${layout.fonts.join(", ")} is easy to read and ATS-friendly.`, JOBSCAN);
      }
    }
    if (layout.distinctSizes > 4) {
      add("sizes", "warn", "Many different text sizes", `${layout.distinctSizes} sizes are used. Two or three (body, headings, name) look more consistent.`, RESUME_GENIUS);
    }

    if (layout.lineSpacing) {
      const ls = layout.lineSpacing;
      if (ls < 0.95) {
        add("line-spacing", "warn", "Lines packed tightly", "Line spacing is tighter than single. Dense text is hard to skim; trim words instead of squeezing.", TOPRESUME);
      } else if (ls > 1.4) {
        add("line-spacing", "warn", "Lines spaced loosely", "Line spacing is well above single. Experts recommend single spacing; extra space eats room you need.", JOBSCAN);
      } else {
        add("line-spacing", "pass", "Good line spacing", "Roughly single spacing, as recommended.", JOBSCAN);
      }
    }
    if (layout.headingGap != null) {
      if (layout.headingGap < 1.3) {
        add("section-spacing", "warn", "Sections run together", "There's little extra space above section headings. A clear gap between sections helps recruiters find what they want.", JOBSCAN);
      } else if (layout.headingGap > 3) {
        add("section-spacing", "warn", "Big gaps between sections", "Space above headings is much larger than elsewhere. Smaller, even gaps look more consistent.", RESUME_GENIUS);
      } else {
        add("section-spacing", "pass", "Clear section breaks", "Extra space above headings separates sections without wasting room.", JOBSCAN);
      }
    }

    if (layout.columns || layout.tables) {
      add("columns", "warn", layout.tables ? "Tables or text boxes" : "Multiple columns", "Applicant tracking systems can read columns and tables out of order or skip them. A single column is safest.", JOBSCAN);
    }
    if (layout.headerFooterText) {
      add("header-footer", "warn", "Text in header or footer", "Some applicant tracking systems skip headers and footers. Keep contact details in the main body.", JOBSCAN);
    }
    if (layout.images) {
      add("images", "warn", "Images or graphics", "Graphics can't be read by applicant tracking systems and rarely help. Drop them, or make sure nothing important is inside one.", JOBSCAN);
    }
    if (layout.bulletSymbols.length > 1) {
      add("bullets-consistent", "warn", "Mixed bullet symbols", `Uses ${layout.bulletSymbols.join(" ")} for bullets. Pick one style.`, RESUME_GENIUS);
    }
  }

  // Checks that work on the text alone
  const bulletLines = lines.filter((l) => BULLET_LINE.test(l)).length;
  if (words > 150 && bulletLines < 3) {
    add("bullets", "warn", "Few or no bullet points", "Short bullets that start with an action verb are easier to skim than paragraphs.", JOBSCAN);
  } else if (bulletLines >= 3) {
    const long = lines.filter((l) => BULLET_LINE.test(l) && l.length > 260).length;
    add(
      "bullets",
      long ? "warn" : "pass",
      long ? "Some bullets are very long" : "Skimmable bullets",
      long ? `${long} bullet${long === 1 ? " runs" : "s run"} past two lines. Aim for one or two lines each.` : "Content is broken into bullets.",
      JOBSCAN,
    );
  }

  const dense = lines.filter((l) => !BULLET_LINE.test(l) && l.length > 400).length;
  if (dense) {
    add("paragraphs", "warn", "Dense paragraph", "A long block of text is hard to skim. Break it into bullets or shorten it.", TOPRESUME);
  }

  const has = (re: RegExp) => re.test(text);
  const missing: string[] = [];
  if (!has(/(experience|employment|work history|projects)/i)) missing.push("experience");
  if (!has(/(education|training|certif|degree)/i)) missing.push("education");
  if (!has(/\bskills?\b/i)) missing.push("skills");
  if (missing.length) {
    add("sections", "warn", "Standard sections missing", `No ${missing.join(", ")} heading found. Standard, plainly named headings help both recruiters and applicant tracking systems.`, JOBSCAN);
  } else {
    add("sections", "pass", "Standard sections", "Experience, education, and skills sections are easy to find.", JOBSCAN);
  }

  const head = lines.slice(0, 8).join(" ");
  if (!/[\w.+-]+@[\w-]+\.[\w.]+/.test(head) || !/\+?\d[\d\s().-]{8,}\d/.test(head)) {
    add("contact", "warn", "Contact details not at the top", "Put your email and phone number in the first few lines, in the main body of the page.", JOBSCAN);
  }

  const dates = dateStyles(text);
  if (dates.styles.length > 1) {
    add(
      "dates",
      "warn",
      "Dates use different styles",
      `Your dates mix ${listOf(dates.styles.map((s) => `"${s.example}"`))}. Pick one style, such as "Jan 2020 – Mar 2023", and use it everywhere.`,
      RESUME_GENIUS,
    );
  } else if (dates.ongoing.length > 1) {
    add(
      "dates",
      "warn",
      "Current jobs worded differently",
      `Ongoing dates end with both ${dates.ongoing.map((w) => `"${w}"`).join(" and ")}. Use one word, usually "Present".`,
      RESUME_GENIUS,
    );
  } else if (dates.count >= 2) {
    add("dates", "pass", "Consistent dates", "Every date is written the same way.", RESUME_GENIUS);
  }

  const penalty = checks.reduce((sum, c) => sum + (c.status === "fail" ? 15 : c.status === "warn" ? 7 : 0), 0);
  return { score: Math.max(0, 100 - penalty), checks, textOnly: !layout };
}

const SHORT_MONTH = "(?:jan|feb|mar|apr|jun|jul|aug|sept?|oct|nov|dec)\\.?";
const LONG_MONTH = "(?:january|february|march|april|june|july|august|september|october|november|december)";
const YEAR = "(?:19|20)\\d{2}";

/** Date styles, checked in this order so a longer form wins over a shorter one inside it. */
const DATE_STYLES: { name: string; re: string }[] = [
  { name: "full date", re: `\\b\\d{1,2}[/.-]\\d{1,2}[/.-]${YEAR}\\b` },
  { name: "year-month", re: `\\b${YEAR}[/.-](?:0?[1-9]|1[0-2])\\b` },
  { name: "month name", re: `\\b${LONG_MONTH},?\\s+${YEAR}\\b` },
  { name: "short month", re: `\\b${SHORT_MONTH},?\\s+${YEAR}\\b` },
  { name: "numeric month", re: `\\b(?:0?[1-9]|1[0-2])[/.-]${YEAR}\\b` },
  // A bare year counts only in a range ("2019 – 2021", "2019 - Present"), so a graduation year on its own doesn't.
  { name: "year only", re: `\\b${YEAR}\\s*(?:-|–|—|to)\\s*(?:${YEAR}|present|current|now)\\b` },
];
// "May" is both the short and the full name, so it's matched but doesn't count toward either style.
const MAY = `\\bmay,?\\s+${YEAR}\\b`;
const DATE_RE = new RegExp([...DATE_STYLES.map((s) => `(${s.re})`), `(${MAY})`].join("|"), "gi");
const ONGOING_RE = new RegExp(`${YEAR}\\s*(?:-|–|—|to)\\s*(present|current|now|today)\\b`, "gi");

/** The date styles a resume uses, with the first example of each, and the words it uses for an ongoing job. */
export function dateStyles(text: string): { count: number; styles: { name: string; example: string }[]; ongoing: string[] } {
  const styles: { name: string; example: string }[] = [];
  let count = 0;
  for (const m of text.matchAll(DATE_RE)) {
    count++;
    const i = m.slice(1).findIndex(Boolean);
    const style = DATE_STYLES[i];
    if (!style) continue; // "May 2020"
    if (!styles.some((s) => s.name === style.name)) styles.push({ name: style.name, example: m[0].replace(/\s+/g, " ") });
  }
  const ongoing = [...new Set([...text.matchAll(ONGOING_RE)].map((m) => m[1][0].toUpperCase() + m[1].slice(1).toLowerCase()))];
  return { count, styles, ongoing };
}

/** A plain-text summary of the measurements and findings, for the model to build on. */
export function describeLayout(layout: ResumeLayout | null, report: FormatReport): string {
  const facts: (string | false | null)[] = [];
  if (layout) {
    const m = layout.margins;
    facts.push(
      `File type: ${layout.source}`,
      layout.pages != null && `Pages: ${layout.pages}`,
      m && `Margins (in): top ${m.top.toFixed(2)}, bottom ${m.bottom.toFixed(2)}, left ${m.left.toFixed(2)}, right ${m.right.toFixed(2)}`,
      layout.bodySize != null && `Body font size: ${layout.bodySize} pt`,
      layout.fonts.length > 0 && `Fonts: ${layout.fonts.join(", ")}`,
      layout.lineSpacing != null && `Line spacing: ${layout.lineSpacing.toFixed(2)}x single`,
    );
  } else {
    facts.push("No file layout available (pasted text), so margins, fonts, and spacing are unknown.");
  }
  facts.push(...report.checks.map((c) => `[${c.status}] ${c.title}: ${c.detail}`));
  return facts.filter((f): f is string => Boolean(f)).join("\n");
}
