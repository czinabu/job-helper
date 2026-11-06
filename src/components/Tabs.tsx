/** A row of tabs that scrolls sideways on a phone instead of wrapping onto two lines. */
export function Tabs<T extends string>({
  tabs,
  value,
  onChange,
  label,
}: {
  tabs: readonly { id: T; label: string; note?: string }[];
  value: T;
  onChange: (id: T) => void;
  label: string;
}) {
  return (
    <div role="tablist" aria-label={label} className="scroll-x -mx-4 flex gap-1 border-b border-line px-4 sm:mx-0 sm:px-0">
      {tabs.map((t) => (
        <button
          key={t.id}
          role="tab"
          id={`tab-${t.id}`}
          aria-selected={value === t.id}
          aria-controls={`panel-${t.id}`}
          onClick={() => onChange(t.id)}
          className={`-mb-px shrink-0 border-b-2 px-3 py-2.5 text-sm whitespace-nowrap transition ${
            value === t.id
              ? "border-accent font-medium text-foreground"
              : "border-transparent text-muted hover:text-foreground"
          }`}
        >
          {t.label}
          {t.note && <span className="ml-1.5 text-xs font-normal text-muted">{t.note}</span>}
        </button>
      ))}
    </div>
  );
}
