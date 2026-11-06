import type { LinkAdvice, TailorResult } from "./tailor";

/**
 * Rule-based LinkedIn and GitHub advice for a job posting, with no model involved. It follows the same rules the
 * tailor prompt gives the model, and returns the same shape, so `linksToAskFor` and the link prompt can use either.
 */

interface Rule {
  re: RegExp;
  /** What to call the match in the reason, e.g. "software roles". */
  why: string;
}

// Jobs where hiring managers look at code.
const GITHUB_RECOMMENDED: Rule[] = [
  { re: /\b(software|backend|back-end|frontend|front-end|full[- ]?stack|web|mobile|ios|android|game|embedded|firmware)\s+(engineer|developer|dev)\b/i, why: "software roles" },
  { re: /\b(developer|programmer|software engineer(ing)?|swe)\b/i, why: "software roles" },
  { re: /\b(data scientist|data engineer|analytics engineer|machine learning|ml engineer|deep learning|\bai engineer|computer vision|nlp)\b/i, why: "data and machine learning roles" },
  { re: /\b(devops|site reliability|sre|platform engineer|infrastructure engineer|cloud engineer)\b/i, why: "DevOps and infrastructure roles" },
  { re: /\b(open[- ]source|github|gitlab|code samples?|portfolio of code)\b/i, why: "jobs that ask to see your code" },
];

// Programming languages and tools. Two or more of these is a strong sign the job involves writing code.
const CODE_TERMS =
  /\b(python|javascript|typescript|java|c\+\+|c#|golang|go lang|rust|ruby|php|kotlin|swift|scala|react|angular|vue|node\.?js|django|flask|spring boot|\.net|kubernetes|docker|terraform|pytorch|tensorflow|pandas|git)(?![\w+#])/gi;

// Jobs that only touch code.
const GITHUB_OPTIONAL: Rule[] = [
  { re: /\b(technical support|tech support|help ?desk|it support|it specialist|systems administrator|sysadmin|network (administrator|engineer))\b/i, why: "IT and support roles" },
  { re: /\b(product manager|product owner|technical program manager|ux|ui designer|product designer|web designer)\b/i, why: "product and design roles" },
  { re: /\b(qa|quality assurance|test engineer|data analyst|business analyst|bi analyst|sql)\b/i, why: "analyst and QA roles" },
];

// Hourly, trade, and in-person jobs, where recruiters rarely look at LinkedIn.
const LINKEDIN_OPTIONAL =
  /\b(warehouse|forklift|cdl|truck driver|delivery driver|cashier|retail associate|sales associate|barista|food server|restaurant server|bartender|line cook|cook|dishwasher|housekeep(er|ing)|janitor|custodian|electrician|plumber|carpenter|welder|hvac|mechanic|maintenance technician|construction|laborer|landscap(er|ing)|cna|nursing assistant|caregiver|security guard|crew member|stocker|picker|packer|per hour|\/\s?(hr|hour)\b|hourly)\b/i;

/** LinkedIn and GitHub advice for this posting. The background's target role counts too, for a short posting. */
export function adviseLinks(jobPosting: string, targetRole = ""): TailorResult["linkAdvice"] {
  const text = `${targetRole}\n${jobPosting}`;

  let github: LinkAdvice = "Not needed";
  let githubWhy = "";
  const strong = GITHUB_RECOMMENDED.find((r) => r.re.test(text));
  const codeTerms = new Set((text.match(CODE_TERMS) ?? []).map((t) => t.toLowerCase()));
  if (strong) {
    github = "Recommended";
    githubWhy = strong.why;
  } else if (codeTerms.size >= 2) {
    github = "Recommended";
    githubWhy = `jobs that use ${[...codeTerms].slice(0, 2).join(" and ")}`;
  } else {
    const some = GITHUB_OPTIONAL.find((r) => r.re.test(text));
    if (some || codeTerms.size === 1) {
      github = "Optional";
      githubWhy = some?.why ?? "jobs that touch code";
    }
  }

  // A posting that names LinkedIn wants it, whatever the job.
  const mentionsLinkedIn = /\blinkedin\b/i.test(text);
  const linkedin: LinkAdvice = !mentionsLinkedIn && LINKEDIN_OPTIONAL.test(text) && github !== "Recommended" ? "Optional" : "Recommended";

  return { linkedin, github, reason: reasonFor(linkedin, github, githubWhy, mentionsLinkedIn) };
}

function reasonFor(linkedin: LinkAdvice, github: LinkAdvice, githubWhy: string, mentionsLinkedIn: boolean): string {
  if (github === "Recommended") {
    return `Hiring managers for ${githubWhy} often look at GitHub to see real code, and most check LinkedIn too.`;
  }
  if (linkedin === "Recommended") {
    const li = mentionsLinkedIn
      ? "The posting mentions LinkedIn, so recruiters will likely look for yours."
      : "Recruiters for most professional jobs look at LinkedIn.";
    return github === "Optional" ? `${li} GitHub is a plus for ${githubWhy} if you have projects to show.` : li;
  }
  return "Recruiters for hourly and in-person jobs rarely look at profiles, so these are optional here.";
}
