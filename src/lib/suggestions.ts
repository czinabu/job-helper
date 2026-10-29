import { z } from "zod";
import { aboutText } from "./coverLetter";
import { BackgroundSchema } from "./tailor";
import type { Task } from "./tasks";

export const SuggestionsRequestSchema = z.object({
  resume: z.string().trim().min(1, "Add your resume first."),
  background: BackgroundSchema,
  jobPosting: z.string().trim().min(1, "Paste the job posting first."),
});
export type SuggestionsRequest = z.infer<typeof SuggestionsRequestSchema>;

const PRIORITIES = ["High", "Medium", "Low"] as const;

export const SuggestionsResultSchema = z.object({
  bullets: z
    .array(
      z.object({
        priority: z.enum(PRIORITIES).describe("How much this rewrite would help for this job."),
        original: z.string().describe("The bullet exactly as it appears on the resume."),
        rewrite: z.string().describe("A stronger version using only facts the person gave."),
        why: z.string().describe("Why the rewrite works better for this job, in one sentence."),
      }),
    )
    .describe("Up to 5 bullets worth strengthening, most important first."),
  gaps: z
    .array(
      z.object({
        priority: z.enum(PRIORITIES).describe("How much this gap could hurt the application."),
        gap: z.string().describe("A requirement the job asks for that the materials don't show."),
        howToAddress: z
          .string()
          .describe(
            "Honest, practical ways to close or work around it (cover letter, a project, a course, related experience), in one or two sentences.",
          ),
      }),
    )
    .describe("Up to 5 gaps, most important first."),
  emphasize: z
    .array(
      z.object({
        priority: z.enum(PRIORITIES).describe("How much this matters to the employer."),
        point: z.string().describe("A strength or experience to put forward for this role."),
        how: z.string().describe("Where and how to feature it, in one sentence."),
      }),
    )
    .describe("Up to 5 things to emphasize, most important first."),
});
export type SuggestionsResult = z.infer<typeof SuggestionsResultSchema>;

const SYSTEM = `You are an experienced career coach giving a job seeker specific, prioritized advice for one job posting.

Honesty comes first. Rewrites and advice must be supported by the person's resume and background. Never invent employers, titles, dates, degrees, numbers, or skills. If a metric would help but isn't given, write the rewrite with a clear [placeholder] such as "[X%]" for the person to fill in only if true, and say so in the reason.

Give three kinds of advice, each ordered with the highest priority first (priority reflects how much it would improve this person's chances for this job):
- bullets: pick the resume bullets that matter most for this job and are weakest (vague, duty-focused, no result, missing the posting's wording). Copy each original exactly, then give a stronger rewrite that leads with an action verb and impact.
- gaps: requirements the posting asks for that the materials don't show. Say honestly how to address each. Never suggest claiming experience the person lacks.
- emphasize: strengths and experience that match what this employer cares about most, and where to feature them.

Be concrete and brief. Skip generic advice. Return fewer items rather than padding; an empty list is fine if nothing applies.`;

export const suggestionsTask: Task<SuggestionsRequest, SuggestionsResult> = {
  // Reads existing text and writes a few rewrites; the quick model is enough.
  weight: "light",
  system: SYSTEM,
  user: ({ resume, background, jobPosting }) => `<resume>
${resume.trim()}
</resume>

${aboutText(background)}

<job_posting>
${jobPosting.trim()}
</job_posting>

Give prioritized suggestions for improving this person's application to this job.`,
  input: SuggestionsRequestSchema,
  output: SuggestionsResultSchema,
};
