import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Model settings",
  alternates: { canonical: "/settings" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
