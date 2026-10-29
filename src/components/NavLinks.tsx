"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/", label: "Tailor" },
  { href: "/jobs", label: "Find jobs" },
  { href: "/applications", label: "Application log" },
  { href: "/settings", label: "Model settings" },
];

/** The top navigation, with the current page highlighted. */
export function NavLinks() {
  const pathname = usePathname();
  return (
    <div className="flex flex-wrap gap-x-5 gap-y-1 text-sm">
      {LINKS.map(({ href, label }) => {
        const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={
              active
                ? "border-b-2 border-accent pb-1 font-medium text-foreground"
                : "border-b-2 border-transparent pb-1 text-muted hover:text-foreground"
            }
          >
            {label}
          </Link>
        );
      })}
    </div>
  );
}
