import type { Metadata } from "next";
import Link from "next/link";
import { NavLinks } from "@/components/NavLinks";
import "./globals.css";

export const metadata: Metadata = {
  title: "Job Helper",
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
              Job Helper
            </Link>
            <NavLinks />
          </nav>
        </header>
        <main className="mx-auto max-w-3xl px-4 py-8">{children}</main>
      </body>
    </html>
  );
}
