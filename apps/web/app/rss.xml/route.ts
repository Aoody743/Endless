import { generateRssFeed } from "@endless/content";
import { resolvePublishedPosts, resolveSite } from "@/lib/content-store";

export const dynamic = "force-static";

export async function GET() {
  const [site, posts] = await Promise.all([resolveSite(), resolvePublishedPosts()]);
  return new Response(generateRssFeed(site, posts), {
    headers: {
      "content-type": "application/rss+xml; charset=utf-8"
    }
  });
}
