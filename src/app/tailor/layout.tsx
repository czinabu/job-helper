import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Tailor your resume",
  alternates: { canonical: "/tailor" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
