import Link from "next/link";

const LOCAL_GUIDE = "https://github.com/czinabu/rolevisor/blob/main/docs/local-models.md";

/** Marks a feature that runs as plain code in the browser, with no key or model. */
export function FreeBadge({ className = "" }: { className?: string }) {
  return (
    <span
      className={`inline-block rounded-full bg-good-soft px-2 py-0.5 text-xs font-medium whitespace-nowrap text-good ${className}`}
    >
      Free, no key needed
    </span>
  );
}

/** Marks a feature that needs a Claude API key or a local model. */
export function KeyBadge({ className = "" }: { className?: string }) {
  return (
    <span
      className={`inline-block rounded-full border border-line px-2 py-0.5 text-xs whitespace-nowrap text-muted ${className}`}
    >
      Needs a key or local model
    </span>
  );
}

/**
 * Shown where an AI feature would be when no model is set up, so the visitor
 * sees what to do instead of an error.
 */
export function NoModel({ feature, compact = false }: { feature: string; compact?: boolean }) {
  const links = (
    <>
      <Link href="/settings" className="link">
        Add a Claude API key
      </Link>{" "}
      or{" "}
      <a href={LOCAL_GUIDE} className="link" target="_blank" rel="noreferrer">
        connect LM Studio or Ollama
      </a>{" "}
      to get it.
    </>
  );
  if (compact) {
    return (
      <p className="text-sm text-muted">
        {feature} needs an AI model. {links}
      </p>
    );
  }
  return (
    <div className="space-y-2 rounded-xl border border-dashed border-line bg-card/50 p-6 text-center text-sm">
      <p className="font-medium">{feature} needs an AI model.</p>
      <p className="text-muted">
        {links} A key takes about 5 minutes to set up (
        <Link href="/guide/api-key" className="link">
          guide
        </Link>
        ), and a local model is free.
      </p>
    </div>
  );
}
