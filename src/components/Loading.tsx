/** A spinner with a friendly status line, shown while something is being generated. */
export function Loading({ message, hint }: { message: string; hint?: string }) {
  return (
    <div role="status" aria-live="polite" className="flex items-center gap-3 rounded-md border border-line p-3 text-sm">
      <span
        aria-hidden="true"
        className="h-5 w-5 shrink-0 animate-spin rounded-full border-2 border-line border-t-accent"
      />
      <div>
        <p className="font-medium">{message}</p>
        {hint && <p className="text-muted">{hint}</p>}
      </div>
    </div>
  );
}
