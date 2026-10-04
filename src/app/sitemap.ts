import type { MetadataRoute } from "next";
import { site } from "@/config/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = site.url;
  const now = new Date();
  return [
    { url: `${base}/`, lastModified: now },
    { url: `${base}/about`, lastModified: now },
    { url: `${base}/privacy`, lastModified: now },
    { url: `${base}/onboarding`, lastModified: now },
    { url: `${base}/placement`, lastModified: now },
  ];
}
