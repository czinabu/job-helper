import type { Metadata } from "next";
import Link from "next/link";
import { NavLinks } from "@/components/NavLinks";
import "./globals.css";

export const metadata: Metadata = {
  title: "Rolevisor",
  description: "Tailor your resume to any job posting, with Claude or a free local model.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <header className="border-b border-line">
          <nav className="mx-auto flex max-w-3xl flex-wrap items-center justify-between gap-2 px-4 pt-4">
            <Link href="/" className="text-lg font-semibold">
              Rolevisor
            </Link>
            <NavLinks />
          </nav>
        </header>
        <main className="mx-auto max-w-3xl px-4 py-8">{children}</main>
        <footer className="border-t border-line">
          <div className="mx-auto flex max-w-3xl flex-wrap gap-x-4 gap-y-1 px-4 py-4 text-sm text-muted">
            <Link href="/privacy" className="hover:underline">
              Privacy
            </Link>
            <Link href="/terms" className="hover:underline">
              Terms
            </Link>
          </div>
        </footer>
      </body>
    </html>
  );
}
