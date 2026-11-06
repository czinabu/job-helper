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
    icon: "resume",
    body: "Paste a job posting and get your resume rewritten for it, with a match score, the skills you have and are missing, and a list of what changed and why.",
  },
  {
    title: "Keyword check",
    icon: "keyword",
    body: "See which of the posting's keywords your original and tailored resumes contain, so applicant tracking systems don't filter you out.",
  },
  {
    title: "Cover letters",
    icon: "letter",
    body: "Get a cover letter written for the specific job, based on your real experience, ready to edit and download.",
  },
  {
    title: "Advice for this application",
    icon: "advice",
    body: "Suggestions on what to strengthen, how to list your education, and formatting problems that could trip up a reader or a scanner.",
  },
  {
    title: "Role finder",
    icon: "compass",
    body: "Not sure what to apply for? Get roles that fit your background, what carries over, and links to search for them on the big job boards.",
  },
  {
    title: "Application log",
    icon: "log",
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

/** Simple line icons for the feature cards, drawn in the accent color. */
const ICONS: Record<string, React.ReactNode> = {
  resume: <path d="M7 3h7l5 5v12a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Zm7 0v5h5M9 13h6M9 17h4" />,
  keyword: <path d="M11 4a7 7 0 1 0 4.2 12.6L20 21M8 11l2 2 4-4" />,
  letter: <path d="M4 6h16v12H4zM4 7l8 6 8-6" />,
  advice: <path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.5 10.9V16h7v-2.1A6 6 0 0 0 12 3Z" />,
  compass: <path d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Zm3.5-12.5-2 5-5 2 2-5 5-2Z" />,
  log: <path d="M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01" />,
};

function Icon({ name }: { name: string }) {
  return (
    <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent-soft text-accent">
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        {ICONS[name]}
      </svg>
    </span>
  );
}

function Check() {
  return (
    <svg viewBox="0 0 20 20" className="h-4 w-4 shrink-0 text-good" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="m5 10.5 3.2 3L15 7" />
    </svg>
  );
}

function SectionTitle({ eyebrow, title, children }: { eyebrow: string; title: string; children?: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <p className="eyebrow">{eyebrow}</p>
      <h2 className="text-2xl font-semibold tracking-tight">{title}</h2>
      {children && <p className="text-[15px] leading-relaxed text-muted">{children}</p>}
    </div>
  );
}

export default function Landing() {
  return (
    <div className="space-y-20">
      <section className="relative -mx-4 -mt-10 overflow-hidden border-b border-line px-4 pt-14 pb-14 sm:mx-0 sm:mt-0 sm:rounded-2xl sm:border sm:px-10">
        <div
          aria-hidden="true"
          className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top_left,var(--accent-soft),transparent_60%),radial-gradient(ellipse_at_bottom_right,var(--accent-soft),transparent_55%)] bg-card"
        />
        <div className="space-y-6">
          <p className="inline-flex items-center gap-2 rounded-full border border-line bg-card px-3 py-1 text-xs font-medium text-muted">
            <span className="h-1.5 w-1.5 rounded-full bg-good" aria-hidden="true" />
            Free to use. No account needed.
          </p>
          <h1 className="text-4xl font-semibold tracking-tight text-balance sm:text-5xl sm:leading-[1.1]">
            Tailor your resume to <span className="text-accent">every job</span> you apply for.
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
          <ul className="flex flex-col gap-x-6 gap-y-2 pt-2 text-sm text-muted sm:flex-row sm:flex-wrap">
            <li className="flex items-center gap-2"><Check /> Resume files read in your browser</li>
            <li className="flex items-center gap-2"><Check /> Costs {COST_ESTIMATE.tailoring} per resume</li>
            <li className="flex items-center gap-2"><Check /> Or free on your own computer</li>
          </ul>
        </div>
      </section>

      <section className="space-y-8">
        <SectionTitle eyebrow="What it does" title="Everything for one application, in one place" />
        <div className="grid gap-4 sm:grid-cols-2">
          {FEATURES.map((f) => (
            <div key={f.title} className="card space-y-3 p-5">
              <Icon name={f.icon} />
              <div>
                <h3 className="font-semibold">{f.title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-muted">{f.body}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-8">
        <SectionTitle eyebrow="See it in action" title="Clear results you can act on" />
        <div className="grid gap-6 sm:grid-cols-2">
          {SCREENSHOTS.map((s) => (
            <figure key={s.src} className="space-y-3">
              <div className="card overflow-hidden p-0 shadow-lg shadow-foreground/5">
                <div className="flex gap-1.5 border-b border-line bg-background px-3 py-2" aria-hidden="true">
                  <span className="h-2.5 w-2.5 rounded-full bg-line" />
                  <span className="h-2.5 w-2.5 rounded-full bg-line" />
                  <span className="h-2.5 w-2.5 rounded-full bg-line" />
                </div>
                <Image src={s.src} alt={s.alt} width={1800} height={2200} className="h-auto w-full" />
              </div>
              <figcaption className="text-sm text-muted">{s.caption}</figcaption>
            </figure>
          ))}
        </div>
        <p className="text-xs text-muted">Screenshots use a made-up resume and job posting.</p>
      </section>

      <section className="space-y-8">
        <SectionTitle eyebrow="Your key, your data" title="Why you bring your own key">
          Rolevisor uses Claude, Anthropic&apos;s AI, with an API key from your own Anthropic
          account. That sounds technical, but it&apos;s what keeps the tool private and cheap.
        </SectionTitle>
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="card p-5">
            <h3 className="font-semibold">Private</h3>
            <p className="mt-1 text-sm leading-relaxed text-muted">
              Your resume and key go straight from your browser to Anthropic. They never pass
              through Rolevisor&apos;s server, which stores and logs nothing.
            </p>
          </div>
          <div className="card p-5">
            <h3 className="font-semibold">No subscription</h3>
            <p className="mt-1 text-sm leading-relaxed text-muted">
              You pay Anthropic only for what you use. Tailoring one resume costs {COST_ESTIMATE.tailoring}.
            </p>
          </div>
          <div className="card p-5">
            <h3 className="font-semibold">You stay in control</h3>
            <p className="mt-1 text-sm leading-relaxed text-muted">
              Set a spending limit on your Anthropic account, and delete the key any time.
            </p>
          </div>
        </div>
        <p className="text-sm">
          <Link href="/guide/api-key" className="link font-medium">
            Step-by-step guide to getting a key
          </Link>{" "}
          <span className="text-muted">(about 5 minutes)</span>
        </p>

        <div className="card flex flex-col gap-4 border-dashed p-5 sm:flex-row sm:items-center">
          <div className="flex-1 space-y-1">
            <h3 className="font-semibold">Or use a free model on your own computer</h3>
            <p className="text-sm leading-relaxed text-muted">
              Don&apos;t want an API key? Install LM Studio or Ollama and Rolevisor runs on a model on
              your own computer instead. It&apos;s free, and your resume never leaves your machine.
              Results are less polished than Claude&apos;s, and you need a reasonably recent computer.
            </p>
          </div>
          <a className="btn-secondary shrink-0" href={LOCAL_GUIDE} target="_blank" rel="noreferrer">
            Local model setup guide
          </a>
        </div>
      </section>

      <section className="space-y-8 pb-4">
        <SectionTitle eyebrow="Get started" title="Get started in three steps" />
        <ol className="grid gap-4 sm:grid-cols-3">
          <li className="card space-y-3 p-5 text-sm leading-relaxed">
            <span className="step-dot">1</span>
            <p>
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
          <li className="card space-y-3 p-5 text-sm leading-relaxed">
            <span className="step-dot">2</span>
            <p>
              Add it in{" "}
              <Link href="/settings" className="link">
                Model settings
              </Link>{" "}
              and click Test connection.
            </p>
          </li>
          <li className="card space-y-3 p-5 text-sm leading-relaxed">
            <span className="step-dot">3</span>
            <p>
              Open{" "}
              <Link href="/tailor" className="link">
                Tailor
              </Link>
              , add your resume and a job posting, and click Tailor my resume.
            </p>
          </li>
        </ol>
        <div className="flex flex-col items-start gap-4 rounded-2xl bg-accent px-6 py-8 text-on-accent sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <div>
            <p className="text-xl font-semibold tracking-tight">Ready for your next application?</p>
            <p className="mt-1 text-sm opacity-85">Add your resume and a job posting. It takes about a minute.</p>
          </div>
          <Link
            href="/tailor"
            className="inline-flex shrink-0 items-center rounded-lg bg-on-accent px-5 py-2.5 text-base font-medium text-accent shadow-sm transition hover:opacity-90"
          >
            Start tailoring
          </Link>
        </div>
      </section>
    </div>
  );
}
