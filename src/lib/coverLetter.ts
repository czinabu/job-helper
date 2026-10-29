import { z } from "zod";
import { BackgroundSchema, EDUCATION_STATUSES } from "./tailor";
import type { Task } from "./tasks";

export const TONES = {
  professional: "Professional",
  warm: "Warm and personable",
  confident: "Confident and direct",
  enthusiastic: "Enthusiastic",
} as const;
export type Tone = keyof typeof TONES;

export const LENGTHS = {
  short: "Short (about 150 words)",
  standard: "Standard (about 250 words)",
  detailed: "Detailed (about 350 words)",
} as const;
export type Length = keyof typeof LENGTHS;

const LENGTH_WORDS: Record<Length, number> = { short: 150, standard: 250, detailed: 350 };

export const CoverLetterRequestSchema = z.object({
  resume: z.string().trim().min(1, "Add your resume first."),
  background: BackgroundSchema,
  jobPosting: z.string().trim().min(1, "Paste the job posting first."),
  tone: z.enum(Object.keys(TONES) as [Tone, ...Tone[]]),
  length: z.enum(Object.keys(LENGTHS) as [Length, ...Length[]]),
  /** Optional extra direction, e.g. "mention that I'm relocating". */
  instructions: z.string().optional(),
  /** Earlier versions to avoid repeating when the person regenerates. */
  previous: z.string().optional(),
});
export type CoverLetterRequest = z.infer<typeof CoverLetterRequestSchema>;

export const CoverLetterResultSchema = z.object({
  letter: z
    .string()
    .describe(
      "The complete cover letter as plain text, from greeting to sign-off, with a blank line between paragraphs.",
    ),
  notes: z
    .array(z.string())
    .describe(
      "Up to 3 short heads-ups for the person, such as a company name or detail to fill in, or a requirement they should address themselves.",
    ),
});
export type CoverLetterResult = z.infer<typeof CoverLetterResultSchema>;

const SYSTEM = `You are an experienced career coach who writes cover letters that hiring managers actually read.

Honesty comes first. Use only facts from the person's resume, background, and education details. Never invent employers, titles, dates, degrees, certifications, numbers, achievements, or skills, and never claim a degree the person hasn't finished. If the job asks for something the person doesn't show, don't pretend; lean on related strengths and eagerness to learn instead. If a company name, hiring manager, or contact detail isn't in the materials, don't guess: use "Dear Hiring Manager" and leave out the name, or put a clear [placeholder] and mention it in the notes.

Follow mainstream expert guidance:
- One page, three to four short paragraphs, plain text, no headers or bullet lists.
- Open with a specific hook tied to this role and company, not "I am writing to apply for...".
- In the middle, pick the two or three most relevant things from the person's background and tie each to a need in the posting, showing results where the materials give them. Don't just restate the resume.
- Echo the posting's own wording where it truthfully describes the person.
- Show you understand what the employer cares about, then close with confidence and a clear next step.
- Avoid clichés ("team player", "passionate", "perfect fit"), filler, and apologizing for gaps.
- Education: mention it only if it helps for this job (a required degree, a recent graduate, or a career changer), and be accurate about whether it's finished.

Match the requested tone and aim for the requested length. If the person gave extra instructions, follow them as long as they stay truthful. If earlier versions are given, write a clearly different take with a fresh opening.`;

export function aboutText(background: z.infer<typeof BackgroundSchema>): string {
  const about = [
    background.targetRole && `Target role: ${background.targetRole}`,
    background.experience && `Years of experience: ${background.experience}`,
    background.skills && `Other skills: ${background.skills}`,
    background.notes && `Other notes: ${background.notes}`,
  ].filter(Boolean);
  const education = (background.education ?? [])
    .filter((e) => e.school.trim() || e.program.trim() || e.coursework.trim())
    .map((e) =>
      [
        `- School: ${e.school.trim() || "(not given)"}`,
        e.program.trim() && `  Degree or program: ${e.program.trim()}`,
        e.status && `  Status: ${EDUCATION_STATUSES[e.status]}`,
        e.dates.trim() && `  Dates: ${e.dates.trim()}`,
        e.coursework.trim() && `  Relevant coursework: ${e.coursework.trim()}`,
      ]
        .filter(Boolean)
        .join("\n"),
    );
  return `<background>
${about.length ? about.join("\n") : "(none given)"}
</background>

<education>
${education.length ? education.join("\n") : "(none given beyond the resume)"}
</education>`;
}

export const coverLetterTask: Task<CoverLetterRequest, CoverLetterResult> = {
  // A short letter from material we already have; the quick model is enough.
  weight: "light",
  system: SYSTEM,
  user: ({ resume, background, jobPosting, tone, length, instructions, previous }) => `<resume>
${resume.trim()}
</resume>

${aboutText(background)}

<job_posting>
${jobPosting.trim()}
</job_posting>
${instructions?.trim() ? `\n<extra_instructions>\n${instructions.trim()}\n</extra_instructions>\n` : ""}${previous?.trim() ? `\n<earlier_version>\n${previous.trim()}\n</earlier_version>\n` : ""}
Write a cover letter for this job. Tone: ${TONES[tone]}. Length: about ${LENGTH_WORDS[length]} words.`,
  input: CoverLetterRequestSchema,
  output: CoverLetterResultSchema,
};
