import { contentUrl } from "./seo";
import type { ContentRecord, SiteRecord } from "./types";

function escapeXml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export function generateRssFeed(site: SiteRecord, posts: ContentRecord[]) {
  const items = posts
    .map((post) => {
      const link = contentUrl(site, post);
      const pubDate = post.publishedAt ? new Date(post.publishedAt).toUTCString() : new Date().toUTCString();

      return [
        "<item>",
        `<title>${escapeXml(post.title)}</title>`,
        `<link>${escapeXml(link)}</link>`,
        `<guid>${escapeXml(link)}</guid>`,
        `<description>${escapeXml(post.summary)}</description>`,
        `<pubDate>${pubDate}</pubDate>`,
        "</item>"
      ].join("");
    })
    .join("");

  return `<?xml version="1.0" encoding="UTF-8" ?><rss version="2.0"><channel><title>${escapeXml(
    site.title
  )}</title><link>${escapeXml(site.url)}</link><description>${escapeXml(site.description)}</description>${items}</channel></rss>`;
}
