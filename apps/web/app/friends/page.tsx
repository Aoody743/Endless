import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { PageSectionsClient } from "@/components/page-sections-client";
import { LocalizedBreadcrumb } from "@/components/public-primitives";
import { resolveContentBySlug, resolveProjects, resolvePublishedPosts, resolveSite } from "@/lib/content-store";

export const metadata: Metadata = {
  title: "友链",
  description: "一份带注释的朋友名单与互相拜访的入口。"
};

export default async function FriendsPage() {
  const [page, posts, projects, site] = await Promise.all([
    resolveContentBySlug("friends"),
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
      <LocalizedBreadcrumb items={[{ labelZh: site.name, labelEn: site.name, href: "/" }, { labelZh: "友链", labelEn: "Friends" }]} />
    </>
  );
}
