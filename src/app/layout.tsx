import type { Metadata } from "next";
import Link from "next/link";
import { NavLinks } from "@/components/NavLinks";
import "./globals.css";

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
      </body>
    </html>
  );
}
