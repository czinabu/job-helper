import type { Metadata } from "next";
import Link from "next/link";
import { Analytics } from "@vercel/analytics/next";
import { Inter } from "next/font/google";
import { NavLinks } from "@/components/NavLinks";
import { ThemeToggle } from "@/components/ThemeToggle";
import { THEME_SCRIPT } from "@/lib/theme";
import "./globals.css";

// Self-hosted by Next.js at build time, so it stays within the font-src 'self' policy.
const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });

const SITE_URL = "https://rolevisor.vercel.app";
const DESCRIPTION =
  "Tailor your resume to any job posting, find matching roles, and draft cover letters, with Claude or a free local model.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: "Rolevisor: tailor your resume to any job", template: "%s | Rolevisor" },
  description: DESCRIPTION,
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: "Rolevisor",
    url: "/",
    title: "Rolevisor: tailor your resume to any job",
    description: DESCRIPTION,
  },
  twitter: {
    card: "summary_large_image",
    title: "Rolevisor: tailor your resume to any job",
    description: DESCRIPTION,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // The head script sets data-theme before React hydrates, so the server markup won't match it.
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body className="flex min-h-screen flex-col antialiased">
        <header className="sticky top-0 z-20 border-b border-line bg-background/90 backdrop-blur">
          <nav className="mx-auto flex max-w-3xl flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <Link href="/" className="text-lg font-semibold tracking-tight">
              Rolevisor
            </Link>
            <NavLinks />
          </nav>
        </header>
        <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10">{children}</main>
        <footer className="border-t border-line">
          <div className="mx-auto flex max-w-3xl flex-col gap-3 px-4 py-6 text-sm text-muted sm:flex-row sm:items-center sm:justify-between">
            <ThemeToggle />
            <div className="flex flex-wrap gap-x-4 gap-y-1">
              <Link href="/privacy" className="hover:text-foreground">
                Privacy
              </Link>
              <Link href="/terms" className="hover:text-foreground">
                Terms
              </Link>
              <a
                href="https://github.com/czinabu/rolevisor/issues/new"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-foreground"
              >
                Send feedback or report a problem
              </a>
            </div>
          </div>
        </footer>
        {/* Cookie-free page-view analytics only. Never pass resume, job or key data to it. */}
        <Analytics />
      </body>
    </html>
  );
}
