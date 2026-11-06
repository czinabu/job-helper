import Image from "next/image";
import Link from "next/link";
import { COST_ESTIMATE } from "@/lib/providers";

/** Where the "See an example" button goes. Set to null to hide the button. */
const EXAMPLE_HREF: string | null = "/example";

const LOCAL_GUIDE =
  "https://github.com/czinabu/rolevisor/blob/main/docs/local-models.md";

const FEATURES = [
  {
    title: "A resume tailored to the posting",
    body: "Paste a job posting and get your resume rewritten for it, with a match score, the skills you have and are missing, and a list of what changed and why.",
  },
  {
    title: "Keyword check",
    body: "See which of the posting's keywords your original and tailored resumes contain, so applicant tracking systems don't filter you out.",
  },
  {
    title: "Cover letters",
    body: "Get a cover letter written for the specific job, based on your real experience, ready to edit and download.",
  },
  {
    title: "Advice for this application",
    body: "Suggestions on what to strengthen, how to list your education, and formatting problems that could trip up a reader or a scanner.",
  },
  {
    title: "Role finder",
    body: "Not sure what to apply for? Get roles that fit your background, what carries over, and links to search for them on the big job boards.",
  },
  {
    title: "Application log",
    body: "Keep track of where you applied and which version of your resume you sent, all saved in your own browser.",
  },
];

const SCREENSHOTS = [
  {
    src: "/screenshots/results.png",
    alt: "Tailored resume results with a match score, matched and missing skills, and a keyword check",
    caption: "Your match score, skills, and keyword check for one job.",
  },
  {
    src: "/screenshots/inputs.png",
    alt: "The Tailor page with a resume, background details, and a job posting filled in",
    caption: "Add your resume (PDF, Word, or text) and paste the job posting.",
  },
];

function SectionTitle({ title, children }: { title: string; children?: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
      {children && <p className="text-[15px] leading-relaxed text-muted">{children}</p>}
    </div>
  );
}

export default function Landing() {
  return (
    <div className="space-y-20">
      <section className="space-y-6 pt-6">
        <h1 className="text-4xl font-semibold tracking-tight text-balance sm:text-5xl sm:leading-[1.1]">
          Tailor your resume to every job you apply for.
        </h1>
        <p className="max-w-2xl text-lg leading-relaxed text-muted">
          Rolevisor reads your resume and a job posting, then rewrites your resume for that job,
          writes a cover letter, and tells you what to fix. No account, no subscription, and your
          resume stays between you and the AI.
        </p>
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <Link href="/tailor" className="btn px-5 py-2.5 text-base">
            Start tailoring
          </Link>
          {EXAMPLE_HREF && (
            <Link href={EXAMPLE_HREF} className="btn-secondary px-5 py-2.5 text-base">
              See an example
            </Link>
          )}
          <Link href="/guide/api-key" className="btn-secondary px-5 py-2.5 text-base">
            How to get a Claude API key
          </Link>
        </div>
      </section>

      <section className="space-y-8">
        <SectionTitle title="What it does" />
        <div className="grid gap-x-10 gap-y-8 sm:grid-cols-2">
          {FEATURES.map((f) => (
            <div key={f.title} className="border-t border-line pt-4">
              <h3 className="font-medium">{f.title}</h3>
              <p className="mt-1 text-sm leading-relaxed text-muted">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-8">
        <SectionTitle title="See it in action" />
        <div className="grid gap-6 sm:grid-cols-2">
          {SCREENSHOTS.map((s) => (
            <figure key={s.src} className="space-y-3">
              <Image
                src={s.src}
                alt={s.alt}
                width={1800}
                height={2200}
                className="h-auto w-full rounded-lg border border-line"
              />
              <figcaption className="text-sm text-muted">{s.caption}</figcaption>
            </figure>
          ))}
        </div>
        <p className="text-xs text-muted">Screenshots use a made-up resume and job posting.</p>
      </section>

      <section className="space-y-8">
        <SectionTitle title="Why you bring your own key">
          Rolevisor uses Claude, Anthropic&apos;s AI, with an API key from your own Anthropic
          account. That sounds technical, but it&apos;s what keeps the tool private and cheap.
        </SectionTitle>
        <div className="grid gap-x-10 gap-y-8 sm:grid-cols-3">
          <div className="border-t border-line pt-4">
            <h3 className="font-medium">Private</h3>
            <p className="mt-1 text-sm leading-relaxed text-muted">
              Your resume and key go straight from your browser to Anthropic. They never pass
              through Rolevisor&apos;s server, which stores and logs nothing.
            </p>
          </div>
          <div className="border-t border-line pt-4">
            <h3 className="font-medium">No subscription</h3>
            <p className="mt-1 text-sm leading-relaxed text-muted">
              You pay Anthropic only for what you use. Tailoring one resume costs {COST_ESTIMATE.tailoring}.
            </p>
          </div>
          <div className="border-t border-line pt-4">
            <h3 className="font-medium">You stay in control</h3>
            <p className="mt-1 text-sm leading-relaxed text-muted">
              Set a spending limit on your Anthropic account, and delete the key any time.
            </p>
          </div>
        </div>
        <p className="text-sm">
          <Link href="/guide/api-key" className="link">
            Step-by-step guide to getting a key
          </Link>{" "}
          <span className="text-muted">(about 5 minutes)</span>
        </p>
      </section>

      <section className="card space-y-2 bg-card p-6">
        <h2 className="text-lg font-semibold tracking-tight">Or use a free model on your own computer</h2>
        <p className="text-sm leading-relaxed text-muted">
          Don&apos;t want an API key? Install LM Studio or Ollama and Rolevisor runs on a model on
          your own computer instead. It&apos;s free, and your resume never leaves your machine.
          Results are less polished than Claude&apos;s, and you need a reasonably recent computer.
        </p>
        <p className="pt-1 text-sm">
          <a className="link" href={LOCAL_GUIDE} target="_blank" rel="noreferrer">
            Local model setup guide
          </a>
        </p>
      </section>

      <section className="space-y-6 pb-4">
        <SectionTitle title="Get started in three steps" />
        <ol className="space-y-4 text-[15px] leading-relaxed">
          <li className="flex gap-4">
            <span className="step-dot">1</span>
            <p className="pt-0.5">
              <Link href="/guide/api-key" className="link">
                Get a Claude API key
              </Link>{" "}
              or{" "}
              <a className="link" href={LOCAL_GUIDE} target="_blank" rel="noreferrer">
                set up a local model
              </a>
              .
            </p>
          </li>
          <li className="flex gap-4">
            <span className="step-dot">2</span>
            <p className="pt-0.5">
              Add it in{" "}
              <Link href="/settings" className="link">
                Model settings
              </Link>{" "}
              and click Test connection.
            </p>
          </li>
          <li className="flex gap-4">
            <span className="step-dot">3</span>
            <p className="pt-0.5">
              Open{" "}
              <Link href="/tailor" className="link">
                Tailor
              </Link>
              , add your resume and a job posting, and click Tailor my resume.
            </p>
          </li>
        </ol>
        <Link href="/tailor" className="btn px-5 py-2.5 text-base">
          Start tailoring
        </Link>
      </section>
    </div>
  );
}
