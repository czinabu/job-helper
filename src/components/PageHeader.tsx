import type { ReactNode } from "react";

/** The title block at the top of each page, so every page opens the same way. */
export function PageHeader({
  eyebrow,
  title,
  children,
}: {
  eyebrow?: string;
  title: string;
  children?: ReactNode;
}) {
  return (
    <header className="space-y-2">
      {eyebrow && <p className="eyebrow">{eyebrow}</p>}
      <h1 className="text-3xl font-semibold tracking-tight text-balance">{title}</h1>
      {children && <div className="space-y-2 text-[15px] leading-relaxed text-muted">{children}</div>}
    </header>
  );
}
