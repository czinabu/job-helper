// Shared rules that keep generated writing from reading as AI-written, plus a
// small cleanup pass that runs on every answer as a safety net.

/**
 * Appended to every task's system prompt. Models follow concrete lists of
 * what to avoid far better than "sound natural", so this names the usual tells.
 */
export const WRITING_STYLE = `Writing style: everything you write should read like a capable person wrote it themselves, not like AI output. Recruiters now spot AI-written applications quickly and some discard them, so this matters as much as the content.
- Never use em dashes (—) or en dashes (–) to join or interrupt clauses, and don't use double hyphens either. Use a period, comma, colon, or parentheses instead, or split the sentence. An en dash is fine only inside a number or date range such as 2021–2023.
- Use plain, specific words. Avoid these words and phrases, which are strongly associated with AI writing: delve, leverage, utilize, harness, unlock, elevate, empower, foster, spearhead (unless it's on the resume), navigate (figuratively), landscape, realm, tapestry, testament, journey, synergy, robust, seamless, dynamic, cutting-edge, game-changer, pivotal, paramount, meticulous, holistic, multifaceted, ever-evolving, fast-paced, passionate, thrilled, eager to contribute, excited to, I am writing to, perfect fit, team player, results-driven, proven track record, hit the ground running, wear many hats, at the intersection of, a deep understanding of, I believe I would be a great asset, not only... but also, it's not just X it's Y.
- Don't group things in threes by habit. List as many items as the facts support, and vary it.
- Vary sentence length and structure. Don't start several sentences in a row the same way, and don't open with "As a..." or end paragraphs with a tidy one-line summary or moral.
- No empty intensifiers or filler (truly, deeply, incredibly, very, highly, extremely, invaluable, I firmly believe). Show qualities through concrete facts instead of naming them.
- No rhetorical questions, exclamation points, emoji, or bolded phrases in prose.
- Write the way a confident professional talks: direct, warm, and specific, with contractions where they'd sound natural. Polished does not mean ornate.`;

/** Words joined by a dash used as punctuation, not as a range or a hyphenated word. */
const DASH = /\s*(?:—|--|(?<=\s)–(?=\s))\s*/g;

function fixDashes(line: string, joiner: string): string {
  // Ranges like 2021—2023 or 9am—5pm keep a proper en dash.
  line = line.replace(/(\d[\w.]*)\s*[—–]\s*(?=\d|present\b|now\b)/gi, "$1–");
  // A dash at the very start of a line is a bullet marker, so leave it.
  const lead = line.match(/^\s*(?:[—–]|--)\s/)?.[0] ?? "";
  let body = line.slice(lead.length);
  body = body
    // A dash right before closing punctuation, or at the end, just goes.
    .replace(/\s*(?:—|--)\s*(?=[.,;:!?)]|$)/g, "")
    .replace(DASH, (match, offset: number, whole: string) => {
      const before = whole.slice(0, offset);
      // "word, — word" shouldn't become a double comma.
      if (/[,;:(]$/.test(before)) return " ";
      return offset === 0 ? "" : joiner;
    });
  return lead + body;
}

/** Replacements that are safe in any context. Everything else is left to the prompt. */
const WORD_SWAPS: [RegExp, string][] = [
  [/\butiliz(e|es|ed|ing)\b/gi, "us$1"],
  [/\butilization\b/gi, "use"],
];

function matchCase(original: string, replacement: string): string {
  return original[0] === original[0].toUpperCase()
    ? replacement[0].toUpperCase() + replacement.slice(1)
    : replacement;
}

function swapWords(text: string): string {
  for (const [pattern, replacement] of WORD_SWAPS) {
    text = text.replace(pattern, (match, ...groups) =>
      matchCase(match, replacement.replace("$1", typeof groups[0] === "string" ? groups[0] : "")),
    );
  }
  return text;
}

/** Cleans prose such as a cover letter or a piece of advice. */
export function cleanProse(text: string): string {
  return swapWords(
    text
      .split("\n")
      .map((line) => fixDashes(line, ", "))
      .join("\n"),
  );
}

/**
 * Cleans a resume. Bullets and sentences get commas, while heading-style lines
 * like "Acme Corp — Analyst | 2021–2023" get " - ", matching how resumes
 * usually separate a company from a title.
 */
export function cleanResume(text: string): string {
  return swapWords(
    text
      .split("\n")
      .map((line) => {
        const isSentence = /^\s*-\s/.test(line) || /[.!?]\s*$/.test(line);
        return fixDashes(line, isSentence ? ", " : " - ");
      })
      .join("\n"),
  );
}

/**
 * Runs cleanProse over every string in a task's answer, except the keys named
 * in `keep` (text copied word for word from the resume or posting) and the
 * keys named in `resume` (which get cleanResume instead).
 */
export function cleanAnswer<T>(
  value: T,
  options: { keep?: string[]; resume?: string[] } = {},
): T {
  const keep = new Set(options.keep);
  const resume = new Set(options.resume);
  const walk = (v: unknown, key?: string): unknown => {
    if (key && keep.has(key)) return v;
    if (typeof v === "string") return key && resume.has(key) ? cleanResume(v) : cleanProse(v);
    if (Array.isArray(v)) return v.map((item) => walk(item, key));
    if (v && typeof v === "object") {
      return Object.fromEntries(Object.entries(v).map(([k, item]) => [k, walk(item, k)]));
    }
    return v;
  };
  return walk(value) as T;
}
