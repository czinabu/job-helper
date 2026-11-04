import type { MetadataRoute } from "next";

const SITE_URL = "https://rolevisor.vercel.app";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    "",
    "/tailor",
    "/example",
    "/guide/api-key",
    "/role-finder",
    "/applications",
    "/settings",
    "/privacy",
    "/terms",
  ].map((path) => ({
    url: `${SITE_URL}${path}`,
  }));
}
