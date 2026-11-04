import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Role finder",
  alternates: { canonical: "/role-finder" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
