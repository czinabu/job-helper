import { z } from "zod";

export const BackgroundSchema = z.object({
  targetRole: z.string(),
  experience: z.string(),
  skills: z.string(),
  notes: z.string(),
});
export type Background = z.infer<typeof BackgroundSchema>;

export const TailorRequestSchema = z.object({
  resume: z.string().trim().min(1, "Add your resume first."),
  background: BackgroundSchema,
  jobPosting: z.string().trim().min(1, "Paste the job posting first."),
});
export type TailorRequest = z.infer<typeof TailorRequestSchema>;

export const TailorResultSchema = z.object({
  matchScore: z
    .number()
    .int()
    .describe("How well the ORIGINAL resume fits the job, from 0 to 100."),
  summary: z
    .string()
    .describe("Two or three plain-English sentences on how well the person fits this job."),
  matchedSkills: z
    .array(z.string())
    .describe("Skills and requirements from the job posting that the person clearly has."),
  missingSkills: z
    .array(z.string())
    .describe("Skills and requirements from the job posting that the resume and background don't show."),
  tailoredResume: z
    .string()
    .describe("The full rewritten resume as plain text, using '## ' for section headings and '- ' for bullets."),
  changes: z
    .array(
      z.object({
        change: z.string().describe("What was changed, in one short sentence."),
        reason: z.string().describe("Why it helps for this job, in one short sentence."),
      }),
    )
    .describe("The most important edits made to the resume, most important first."),
});
export type TailorResult = z.infer<typeof TailorResultSchema>;

export const TAILOR_SYSTEM_PROMPT = `You are an experienced career coach and resume writer. You help job seekers tailor their resume to a specific job posting so it gets past applicant tracking systems and convinces a hiring manager.

Honesty comes first. Everything in the tailored resume must be supported by the person's original resume or the background they gave you. Never invent employers, job titles, dates, degrees, certifications, numbers, or skills. You may:
- reorder sections and bullets so the most relevant experience comes first,
- rewrite bullets to lead with impact and use the job posting's wording where it truthfully describes what the person did,
- add a short summary at the top aimed at this role,
- bring in skills or experience from the background notes,
- trim or drop content that isn't relevant to this job.

If a metric would help but isn't given, don't make one up. Keep the person's contact details and keep the resume about the same length or shorter.

When you list missing skills, only include requirements the job actually asks for that the person's materials don't show. The match score rates the original resume, not your rewrite.`;

export function tailorUserPrompt({ resume, background, jobPosting }: TailorRequest): string {
  const about = [
    background.targetRole && `Target role: ${background.targetRole}`,
    background.experience && `Years of experience: ${background.experience}`,
    background.skills && `Other skills: ${background.skills}`,
    background.notes && `Other notes: ${background.notes}`,
  ].filter(Boolean);

  return `<resume>
${resume.trim()}
</resume>

<background>
${about.length ? about.join("\n") : "(none given)"}
</background>

<job_posting>
${jobPosting.trim()}
</job_posting>

Tailor this resume for the job posting above.`;
}
