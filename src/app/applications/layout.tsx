import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Application log",
  alternates: { canonical: "/applications" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
