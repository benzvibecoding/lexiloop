import type { MetadataRoute } from "next";
import { site } from "@/config/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: ["/dashboard", "/decks", "/review", "/study", "/stats", "/settings", "/add", "/library", "/lookup"] },
    ],
    sitemap: `${site.url}/sitemap.xml`,
  };
}
