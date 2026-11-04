import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "See an example",
  alternates: { canonical: "/example" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
