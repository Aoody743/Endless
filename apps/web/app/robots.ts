import type { MetadataRoute } from "next";
import { absoluteUrl } from "@endless/content";
import { resolveSite } from "@/lib/content-store";

export default async function robots(): Promise<MetadataRoute.Robots> {
  const site = await resolveSite();

  return {
    rules: {
      userAgent: "*",
      allow: "/"
    },
    sitemap: absoluteUrl(site, "/sitemap.xml")
  };
}
