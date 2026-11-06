import type { ReactNode } from "react";

/** The title block at the top of each page, so every page opens the same way. */
export function PageHeader({
  title,
  children,
}: {
  title: string;
  children?: ReactNode;
}) {
  return (
    <header className="space-y-2">
      <h1 className="text-2xl font-semibold tracking-tight text-balance sm:text-3xl">{title}</h1>
      {children && <div className="space-y-2 text-[15px] leading-relaxed text-muted">{children}</div>}
    </header>
  );
}
