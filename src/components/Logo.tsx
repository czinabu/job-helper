/** Rolevisor's mark: a document with a check, in the accent color. */
export function LogoMark({ className = "h-7 w-7" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true" className={className}>
      <rect width="32" height="32" rx="8" className="fill-accent" />
      <path d="M10 9.5h8.5l3.5 3.5v9.5a1 1 0 0 1-1 1H10a1 1 0 0 1-1-1v-12a1 1 0 0 1 1-1Z" className="fill-on-accent" opacity="0.95" />
      <path d="m12.5 17.5 2.5 2.5 4.5-5" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="stroke-accent" />
    </svg>
  );
}
