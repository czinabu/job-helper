import { z } from "zod";
import type { Task } from "./tasks";

export const FormatRequestSchema = z.object({
  resume: z.string().trim().min(1, "Add your resume first."),
  /** Measurements and automatic findings, from describeLayout(). */
  layout: z.string(),
});
export type FormatRequest = z.infer<typeof FormatRequestSchema>;

export const FormatReviewSchema = z.object({
  summary: z
    .string()
    .describe("Two or three plain-English sentences on how the resume looks and reads to a recruiter."),
  strengths: z.array(z.string()).describe("Up to 3 things the formatting and structure do well."),
  improvements: z
    .array(
      z.object({
        issue: z.string().describe("The problem, in one short sentence."),
        fix: z.string().describe("Exactly what to change, in one or two sentences."),
      }),
    )
    .describe("Up to 6 changes that would help most, most important first."),
});
export type FormatReview = z.infer<typeof FormatReviewSchema>;

const SYSTEM = `You are an experienced recruiter and resume reviewer. You judge how a resume is formatted and organized, not whether the person is qualified.

Base your feedback on mainstream expert guidance: one page for most people and two at most; margins of 0.5 to 1 inch; a standard font (Arial, Calibri, Times New Roman) at 10 to 12 pt with slightly larger headings; single line spacing with clear space between sections; a single column with no tables, images, or header/footer text so applicant tracking systems read it correctly; standard section names; reverse-chronological order with the most relevant material first; short bullets that start with an action verb and show results; consistent dates, punctuation, and bullet style.

You get the resume text and a list of measurements and automatic findings. Treat the measurements as facts and don't repeat them back. Add what they can't see by reading the text: section order, bullet length and wording, consistency of dates and punctuation, how easy it is to skim, and whether the strongest content comes first. Be specific and kind. If layout measurements are unavailable, say what you can't judge. Never invent content for the resume.`;

export const formatTask: Task<FormatRequest, FormatReview> = {
  weight: "light",
  system: SYSTEM,
  user: ({ resume, layout }) => `<resume>
${resume.trim()}
</resume>

<layout_measurements>
${layout}
</layout_measurements>

Review the formatting and organization of this resume.`,
  input: FormatRequestSchema,
  output: FormatReviewSchema,
};
