import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { PageSectionsClient } from "@/components/page-sections-client";
import { LocalizedBreadcrumb } from "@/components/public-primitives";
import { resolveContentBySlug, resolveProjects, resolvePublishedPosts, resolveSite } from "@/lib/content-store";

export const metadata: Metadata = {
  title: "朋友圈思想",
  description: "一个像朋友圈一样的公开思想页。"
};

export default async function ThoughtsPage() {
  const [page, posts, projects, site] = await Promise.all([
    resolveContentBySlug("thoughts"),
    resolvePublishedPosts(),
    resolveProjects(),
    resolveSite()
  ]);

  if (!page || page.type !== "PAGE") {
    notFound();
  }

  return (
    <>
      <main className="page-shell min-h-screen pb-10 pt-10 md:pt-20">
        <PageSectionsClient sections={page.sections} posts={posts} projects={projects} site={site} />
      </main>
      <LocalizedBreadcrumb items={[{ labelZh: site.name, labelEn: site.name, href: "/" }, { labelZh: "朋友圈", labelEn: "Thoughts" }]} />
    </>
  );
}

