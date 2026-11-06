import { PageHeader } from "@/components/PageHeader";
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
    <article className="card space-y-4 p-6 leading-relaxed sm:p-10 [&_h2]:mt-8 [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:tracking-tight [&_p]:text-[15px] [&_li]:text-[15px] [&_ul]:list-disc [&_ul]:space-y-1 [&_ul]:pl-6 [&_a]:text-accent [&_a]:underline">
      <PageHeader title={title}>
        <p className="!text-sm">Last updated: {updated}</p>
      </PageHeader>
      {children}
    </article>
  );
}
