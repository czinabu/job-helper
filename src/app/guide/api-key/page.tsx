import type { Metadata } from "next";
import Link from "next/link";
import { COST_ESTIMATE } from "@/lib/providers";

export const metadata: Metadata = {
  title: "How to get a Claude API key",
  description:
    "A step-by-step guide to getting a Claude API key for Rolevisor, with a spending limit and what each tailoring costs.",
  alternates: { canonical: "/guide/api-key" },
};

const CONSOLE = "https://console.anthropic.com";

function Step({
  n,
  title,
  children,
}: {
  n: number;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <li className="flex gap-4">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent text-sm font-semibold text-white dark:text-black">
        {n}
      </span>
      <div className="space-y-2 pt-1">
        <h2 className="font-semibold">{title}</h2>
        <div className="space-y-2 text-sm text-muted">{children}</div>
      </div>
    </li>
  );
}

export default function ApiKeyGuide() {
  return (
    <div className="space-y-10">
      <div>
        <p className="text-sm">
          <Link href="/" className="text-accent underline">
            Rolevisor
          </Link>{" "}
          <span className="text-muted">/ Guide</span>
        </p>
        <h1 className="mt-2 text-2xl font-semibold">How to get a Claude API key</h1>
        <p className="mt-2 text-sm text-muted">
          About 5 minutes. You need an email address and a payment card. An API key is a
          password that lets Rolevisor use Claude on your behalf, billed to your own Anthropic
          account. Rolevisor never sees your bill or charges you anything.
        </p>
      </div>

      <div className="rounded-lg border border-line bg-card p-4 text-sm">
        <p className="font-medium">Already pay for Claude Pro or Max?</p>
        <p className="mt-1 text-muted">
          That subscription covers the Claude app, not the API. The API is billed separately, pay
          as you go, so you still need to add a few dollars of credit below.
        </p>
      </div>

      <ol className="space-y-8">
        <Step n={1} title="Create an Anthropic account">
          <p>
            Go to{" "}
            <a className="text-accent underline" href={CONSOLE} target="_blank" rel="noreferrer">
              console.anthropic.com
            </a>{" "}
            and sign up with your email or Google account. This is Anthropic&apos;s developer
            console, which is separate from the Claude chat app.
          </p>
          <p>If it asks for an organization name, your own name is fine.</p>
        </Step>

        <Step n={2} title="Add credit">
          <p>
            Open <strong className="text-foreground">Settings</strong>, then{" "}
            <strong className="text-foreground">Billing</strong>, and buy credits. The smallest
            amount (usually $5) is plenty to start: it covers a few hundred tailored resumes.
          </p>
          <p>
            You can leave auto-reload off, so you&apos;re never charged more than what you
            bought.
          </p>
        </Step>

        <Step n={3} title="Set a spending limit (recommended)">
          <p>
            Under <strong className="text-foreground">Settings</strong>, then{" "}
            <strong className="text-foreground">Limits</strong>, set a monthly spend limit, such
            as $10. If your key ever leaked, nobody could spend more than that.
          </p>
        </Step>

        <Step n={4} title="Create your API key">
          <p>
            Go to <strong className="text-foreground">Settings</strong>, then{" "}
            <strong className="text-foreground">API keys</strong>, and click{" "}
            <strong className="text-foreground">Create key</strong>. Name it
            &ldquo;Rolevisor&rdquo; so you know what it&apos;s for.
          </p>
          <p>
            Copy the key right away. It starts with <code className="text-foreground">sk-ant-</code>,
            and Anthropic only shows it once. If you lose it, just delete it and make a new one.
          </p>
        </Step>

        <Step n={5} title="Paste it into Rolevisor">
          <p>
            Open{" "}
            <Link href="/settings" className="text-accent underline">
              Model settings
            </Link>
            , choose Claude, paste the key, and click{" "}
            <strong className="text-foreground">Test connection</strong>. Then head to{" "}
            <Link href="/tailor" className="text-accent underline">
              Tailor
            </Link>{" "}
            and you&apos;re ready.
          </p>
          <p>
            Your key is forgotten when you close the tab unless you tick &ldquo;Remember my key on
            this device&rdquo;.
          </p>
        </Step>
      </ol>

      <p className="text-xs text-muted">
        Anthropic sometimes renames or moves menu items in the console. If a step doesn&apos;t
        match what you see, look for Billing, Limits, and API keys in the console&apos;s settings.
      </p>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">What it costs</h2>
        <p className="text-sm text-muted">
          You pay Anthropic per use. Rough costs with Rolevisor&apos;s default models (Sonnet for big jobs, Haiku for
          quick ones):
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-line">
                <th className="py-2 pr-4 font-medium">What you do</th>
                <th className="py-2 font-medium">Rough cost</th>
              </tr>
            </thead>
            <tbody className="text-muted">
              <tr className="border-b border-line">
                <td className="py-2 pr-4">Tailor one resume</td>
                <td className="py-2">{COST_ESTIMATE.tailoring}</td>
              </tr>
              <tr className="border-b border-line">
                <td className="py-2 pr-4">
                  A full application (tailored resume, cover letter, suggestions, formatting check)
                </td>
                <td className="py-2">{COST_ESTIMATE.fullApplication}</td>
              </tr>
              <tr className="border-b border-line">
                <td className="py-2 pr-4">Tailor one resume with Opus, the most capable model</td>
                <td className="py-2">{COST_ESTIMATE.opusTailoring}</td>
              </tr>
              <tr className="border-b border-line">
                <td className="py-2 pr-4">Tailor one resume in Budget mode</td>
                <td className="py-2">{COST_ESTIMATE.budgetTailoring}</td>
              </tr>
              <tr>
                <td className="py-2 pr-4">$5 of credit</td>
                <td className="py-2">{COST_ESTIMATE.perFiveDollars} tailored resumes</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="text-xs text-muted">
          These are estimates. Longer resumes and postings cost a bit more. Your Anthropic
          console shows the real charges. You can switch models in Model settings: Opus writes
          the most polished resumes, and Budget mode runs everything on the cheapest model.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Keeping your key safe</h2>
        <ul className="list-disc space-y-1 pl-5 text-sm text-muted">
          <li>Treat it like a password. Don&apos;t paste it into emails, chats, or other sites.</li>
          <li>
            Rolevisor sends it only to Anthropic, straight from your browser. It never reaches
            Rolevisor&apos;s server.
          </li>
          <li>Don&apos;t tick &ldquo;Remember my key&rdquo; on a shared or public computer.</li>
          <li>
            If you think it&apos;s been exposed, delete it in the console under API keys and
            create a new one.
          </li>
        </ul>
      </section>

      <section className="rounded-lg border border-line p-5 text-sm">
        <p className="font-medium">Rather not pay anything?</p>
        <p className="mt-1 text-muted">
          Rolevisor also works with a free model running on your own computer through LM Studio
          or Ollama. See the{" "}
          <a
            className="text-accent underline"
            href="https://github.com/czinabu/rolevisor/blob/main/docs/local-models.md"
            target="_blank"
            rel="noreferrer"
          >
            local model setup guide
          </a>
          .
        </p>
      </section>
    </div>
  );
}
