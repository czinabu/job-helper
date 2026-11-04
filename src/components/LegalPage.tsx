import type { ReactNode } from "react";

export function LegalPage({
  title,
  updated,
  children,
}: {
  title: string;
  updated: string;
  children: ReactNode;
}) {
  return (
    <article className="space-y-4 leading-relaxed [&_h2]:mt-6 [&_h2]:text-lg [&_h2]:font-semibold [&_ul]:list-disc [&_ul]:space-y-1 [&_ul]:pl-6 [&_a]:text-accent [&_a]:underline">
      <h1 className="text-2xl font-semibold">{title}</h1>
      <p className="text-sm text-muted">Last updated: {updated}</p>
      {children}
    </article>
  );
}
