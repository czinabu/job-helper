import { z } from "zod";
import { BackgroundSchema, EDUCATION_STATUSES } from "./tailor";
import type { Task } from "./tasks";

export const RecommendRequestSchema = z.object({
  resume: z.string().trim().min(1, "Add your resume on the home page first."),
  background: BackgroundSchema,
  location: z.string(),
});
export type RecommendRequest = z.infer<typeof RecommendRequestSchema>;

export const RecommendResultSchema = z.object({
  summary: z
    .string()
    .describe("Two or three plain-English sentences on the person's strengths and the directions that suit them."),
  roles: z
    .array(
      z.object({
        title: z
          .string()
          .describe("A job title people actually search for and employers actually post, e.g. 'Data Analyst'."),
        fit: z.enum(["Strong fit", "Good fit", "Stretch"]),
        whyItFits: z.string().describe("Two or three sentences tying this role to specific things in the resume or background."),
        transferableSkills: z.array(z.string()).describe("Skills the person already has that carry over to this role."),
        gaps: z
          .array(z.string())
          .describe("Things employers usually want for this role that the materials don't show, each with a quick way to close it."),
        searchTerms: z.string().describe("A short job-board search query for this role, without the location."),
      }),
    )
    .describe("Five to eight roles, best fit first. Include a mix of safe matches and a couple of stretch or adjacent paths."),
  careerPaths: z
    .array(z.string())
    .describe("Up to three longer-term directions, each one sentence on where the roles above could lead."),
});
export type RecommendResult = z.infer<typeof RecommendResultSchema>;

const SYSTEM = `You are an experienced career coach. From a person's resume and background, you suggest job titles and career directions that suit them.

You have no access to live job listings, so recommend role types, not specific openings, and never invent companies or postings. Be honest about fit: base every reason on what the resume and background actually show, and mark roles that need new skills as "Stretch". Consider the person's stated target role, but also surface adjacent roles they may not have thought of. Use real, searchable job titles. Take their education into account, including unfinished degrees, without overstating it. Keep the tone encouraging and specific.`;

function userPrompt({ resume, background, location }: RecommendRequest): string {
  const about = [
    background.targetRole && `Target role: ${background.targetRole}`,
    background.experience && `Years of experience: ${background.experience}`,
    background.skills && `Other skills: ${background.skills}`,
    background.notes && `Other notes: ${background.notes}`,
    location.trim() && `Preferred location: ${location.trim()}`,
  ].filter(Boolean);

  const education = (background.education ?? [])
    .filter((e) => e.school.trim() || e.program.trim())
    .map((e) =>
      [e.program.trim(), e.school.trim(), e.status && EDUCATION_STATUSES[e.status], e.coursework.trim()]
        .filter(Boolean)
        .join(", "),
    );

  return `<resume>
${resume.trim()}
</resume>

<background>
${about.length ? about.join("\n") : "(none given)"}
</background>

<education>
${education.length ? education.join("\n") : "(none given beyond the resume)"}
</education>

Recommend jobs for this person.`;
}

export const recommendTask: Task<RecommendRequest, RecommendResult> = {
  weight: "light",
  system: SYSTEM,
  user: userPrompt,
  input: RecommendRequestSchema,
  output: RecommendResultSchema,
};

/** Pre-filled searches on the big job boards. No API needed; they open in a new tab. */
export function searchLinks(terms: string, location: string) {
  const q = encodeURIComponent(terms.trim());
  const l = encodeURIComponent(location.trim());
  return [
    { name: "LinkedIn", url: `https://www.linkedin.com/jobs/search/?keywords=${q}&location=${l}` },
    { name: "Indeed", url: `https://www.indeed.com/jobs?q=${q}&l=${l}` },
    {
      name: "Google Jobs",
      url: `https://www.google.com/search?q=${encodeURIComponent(`${terms.trim()} jobs ${location.trim()}`.trim())}&ibp=htl;jobs`,
    },
  ];
}
