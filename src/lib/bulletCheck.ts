/**
 * A rule-based check of resume bullets. It runs in the browser with no model,
 * so it only flags problems and suggests opening verbs. It never rewrites a
 * bullet; that stays with the AI Suggestions.
 */

export type BulletIssueId = "no-result" | "weak-opener" | "passive" | "too-long" | "first-person";

export interface BulletIssue {
  id: BulletIssueId;
  title: string;
  detail: string;
}

export interface CheckedBullet {
  /** The bullet's text, without its bullet symbol. */
  text: string;
  issues: BulletIssue[];
  /** Stronger opening verbs, when the opener is weak. */
  verbs: string[];
}

export interface RepeatedOpener {
  verb: string;
  count: number;
  alternatives: string[];
}

export interface BulletReport {
  total: number;
  /** Only the bullets with at least one issue, in resume order. */
  flagged: CheckedBullet[];
  repeated: RepeatedOpener[];
  /** How many bullets have each kind of issue. */
  counts: Record<BulletIssueId, number>;
  /** Missing keywords from the job posting, passed in by the caller. */
  gaps: string[];
}

/** Lines that start with a bullet symbol, matching the formatting check. */
export const BULLET_LINE = /^\s*[•·▪◦●■►▸➢✓*–—-]\s/;

/** Past two lines on a typical one-column resume. */
const MAX_WORDS = 30;

const LEAD = ["Led", "Managed", "Directed", "Ran", "Oversaw"];
const BUILD = ["Built", "Created", "Designed", "Launched", "Developed"];
const IMPROVE = ["Improved", "Cut", "Increased", "Streamlined", "Reduced"];
const SUPPORT = ["Supported", "Partnered with", "Trained", "Resolved", "Served"];
const DELIVER = ["Delivered", "Completed", "Produced", "Processed", "Executed"];

/**
 * Weak openers, matched at the start of a bullet (case-insensitive), with
 * verbs that usually fit better. Longer phrases come first so they win.
 */
const WEAK_OPENERS: [RegExp, string, string[]][] = [
  [/^(was )?responsible for\b/i, "Responsible for", [...LEAD.slice(0, 3), "Owned"]],
  [/^(was )?in charge of\b/i, "In charge of", LEAD.slice(0, 4)],
  [/^(was )?tasked with\b/i, "Tasked with", DELIVER.slice(0, 4)],
  [/^duties (included|include)\b/i, "Duties included", DELIVER.slice(0, 4)],
  [/^(was )?involved in\b/i, "Involved in", [...BUILD.slice(0, 2), "Contributed to", "Delivered"]],
  [/^participated in\b/i, "Participated in", ["Contributed to", "Delivered", "Ran", "Co-led"]],
  [/^worked (on|with|in|at)\b/i, "Worked on", BUILD.slice(0, 4)],
  [/^helped( to)?\b/i, "Helped", ["Supported", "Contributed to", "Enabled", "Partnered with"]],
  [/^assisted( with| in)?\b/i, "Assisted", ["Supported", "Contributed to", "Coordinated", "Enabled"]],
  [/^handled\b/i, "Handled", ["Managed", "Processed", "Resolved", "Ran"]],
  [/^did\b/i, "Did", ["Completed", "Performed", "Ran", "Carried out"]],
  [/^(utilized|used)\b/i, "Used", ["Applied", "Built with", "Automated with", "Analyzed with"]],
  [/^(various|multiple|several)\b/i, "Various", ["Start with what you did, such as Led, Built, or Cut"]],
];

/** Families of strong verbs, used to suggest swaps when one opener repeats. */
const FAMILIES = [LEAD, BUILD, IMPROVE, SUPPORT, DELIVER, ["Analyzed", "Tracked", "Measured", "Forecast", "Audited"], ["Presented", "Reported", "Wrote", "Briefed", "Documented"]];

const NUMBER_WORDS =
  /\b(one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|fifteen|twenty|thirty|forty|fifty|hundred|hundreds|thousand|thousands|million|millions|billion|dozen|dozens|double[ds]?|doubling|tripled?|halved?)\b/i;

/** Common irregular past participles, for the passive-voice rule. */
const IRREGULAR =
  "built|done|made|given|taken|written|run|led|chosen|known|seen|shown|sent|kept|held|brought|bought|taught|caught|found|told|paid|set|put|cut|grown|drawn|driven|spent|won|begun|broken|spoken|met|sold";
const PASSIVE = new RegExp(`\\b(was|were|is|are|been|being|be|got)\\s+(\\w+ly\\s+)?(\\w+ed|${IRREGULAR})\\b`, "i");

/** Adjectives ending in -ed that often follow "was" without being passive. */
const NOT_PASSIVE = /\b(was|were|is|are|been|be)\s+(\w+ly\s+)?(interested|excited|dedicated|motivated|experienced|skilled|detail-oriented|qualified|talented|organized|tired|based|located|required)\b/i;

const words = (s: string) => s.split(/\s+/).filter(Boolean);
const firstWord = (s: string) => (s.match(/^[A-Za-z][A-Za-z'-]*/)?.[0] ?? "").toLowerCase();
const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/** The resume's bullets, with symbols stripped. Empty lines and headings are skipped. */
export function extractBullets(resume: string): string[] {
  return resume
    .split("\n")
    .filter((l) => BULLET_LINE.test(l))
    .map((l) => l.replace(BULLET_LINE, "").trim())
    .filter((l) => words(l).length >= 2);
}

function hasResult(text: string): boolean {
  return /\d/.test(text) || /[%$£€]/.test(text) || NUMBER_WORDS.test(text);
}

function checkBullet(text: string): CheckedBullet {
  const issues: BulletIssue[] = [];
  let verbs: string[] = [];

  const weak = WEAK_OPENERS.find(([re]) => re.test(text));
  if (weak) {
    const [, label, suggestions] = weak;
    verbs = suggestions;
    issues.push({
      id: "weak-opener",
      title: `Starts with "${label}"`,
      detail: "This describes a duty, not what you did. Open with an action verb.",
    });
  }

  if (/^(i|my|me|we|our)\b/i.test(text) || /\b(I|I'm|I've)\b/.test(text)) {
    issues.push({
      id: "first-person",
      title: "Uses I or my",
      detail: "Resume bullets usually drop the I. Start with the verb instead.",
    });
  }

  if (PASSIVE.test(text) && !NOT_PASSIVE.test(text)) {
    issues.push({
      id: "passive",
      title: "Passive voice",
      detail: "Phrases like \"was built\" hide who did the work. Say what you did, in active voice.",
    });
  }

  if (!hasResult(text)) {
    issues.push({
      id: "no-result",
      title: "No number or result",
      detail: "Add a number if you have one: how many, how much, how often, or what changed because of it.",
    });
  }

  const count = words(text).length;
  if (count > MAX_WORDS) {
    issues.push({
      id: "too-long",
      title: "Long bullet",
      detail: `${count} words. Aim for one or two lines (about ${MAX_WORDS} words or fewer).`,
    });
  }

  return { text, issues, verbs };
}

/** Openers used three or more times, with swaps from the same family of verbs. */
function repeatedOpeners(bullets: string[]): RepeatedOpener[] {
  const tally = new Map<string, number>();
  for (const b of bullets) {
    const w = firstWord(b);
    if (w.length > 1) tally.set(w, (tally.get(w) ?? 0) + 1);
  }
  const repeated: RepeatedOpener[] = [];
  for (const [w, count] of tally) {
    if (count < 3) continue;
    const verb = capitalize(w);
    const family = FAMILIES.find((f) => f.some((v) => v.toLowerCase() === w));
    const alternatives = (family ?? []).filter((v) => v.toLowerCase() !== w).slice(0, 4);
    repeated.push({ verb, count, alternatives });
  }
  return repeated.sort((a, b) => b.count - a.count);
}

/** Checks every bullet in the resume. Pass missing keywords to list them as gaps. */
export function checkBullets(resume: string, missingKeywords: string[] = []): BulletReport {
  const bullets = extractBullets(resume);
  const checked = bullets.map(checkBullet);
  const counts: Record<BulletIssueId, number> = {
    "no-result": 0,
    "weak-opener": 0,
    passive: 0,
    "too-long": 0,
    "first-person": 0,
  };
  for (const b of checked) for (const i of b.issues) counts[i.id]++;
  const seen = new Set<string>();
  const gaps = missingKeywords
    .map((k) => k.trim())
    .filter((k) => k && !seen.has(k.toLowerCase()) && seen.add(k.toLowerCase()));
  return {
    total: bullets.length,
    flagged: checked.filter((b) => b.issues.length > 0),
    repeated: repeatedOpeners(bullets),
    counts,
    gaps,
  };
}
