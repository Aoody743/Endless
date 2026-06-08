import type { MetadataRoute } from "next";
import { absoluteUrl } from "@endless/content";
import { resolveCanonicalContentUrl, resolvePublishedContent, resolveSite, resolveTags } from "@/lib/content-store";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [site, content, tags] = await Promise.all([resolveSite(), resolvePublishedContent(), resolveTags()]);
  const routes = ["/", "/blog", "/lab", "/about", "/search", "/thoughts", "/friends", "/links", "/photos", "/resume", "/comments", "/privacy", "/support"].map((path) => ({
    url: absoluteUrl(site, path),
    lastModified: new Date()
  }));

  const contentRoutes = await Promise.all(
    content
      .filter((item) => !(item.type === "PAGE" && (item.templateKey === "HOME" || item.templateKey === "ABOUT" || item.templateKey === "LAB")))
      .map(async (item) => ({
        url: await resolveCanonicalContentUrl(site, item),
        lastModified: item.publishedAt ? new Date(item.publishedAt) : new Date()
      }))
  );

  const tagRoutes = tags.map((tag) => ({
    url: absoluteUrl(site, `/tags/${tag.slug}`),
    lastModified: new Date()
  }));

  const seen = new Set<string>();
  return [...routes, ...contentRoutes, ...tagRoutes].filter((item) => {
    if (seen.has(item.url)) {
      return false;
    }
    seen.add(item.url);
    return true;
  });
}
