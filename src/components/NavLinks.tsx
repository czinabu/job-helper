"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/tailor", label: "Tailor" },
  { href: "/role-finder", label: "Role finder" },
  { href: "/applications", label: "Application log" },
  { href: "/settings", label: "Model settings" },
];

/** The top navigation, with the current page highlighted. Scrolls sideways on a phone. */
export function NavLinks() {
  const pathname = usePathname();
  return (
    <div className="scroll-x -mx-4 flex gap-1 px-4 text-sm sm:mx-0 sm:px-0">
      {LINKS.map(({ href, label }) => {
        const active = pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={`shrink-0 rounded-lg px-3 py-1.5 whitespace-nowrap transition ${
              active
                ? "bg-accent-soft font-medium text-accent"
                : "text-muted hover:bg-foreground/5 hover:text-foreground"
            }`}
          >
            {label}
          </Link>
        );
      })}
    </div>
  );
}
