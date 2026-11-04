import type { MetadataRoute } from "next";

const SITE_URL = "https://rolevisor.vercel.app";

export default function sitemap(): MetadataRoute.Sitemap {
  return ["", "/role-finder", "/applications", "/settings"].map((path) => ({
    url: `${SITE_URL}${path}`,
  }));
}
