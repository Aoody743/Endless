import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageSectionsClient } from "@/components/page-sections-client";
import { LocalizedBreadcrumb } from "@/components/public-primitives";
import { resolveProjects, resolvePublishedPosts, resolveSite, resolveTemplatePage } from "@/lib/content-store";

export async function generateMetadata(): Promise<Metadata> {
  const site = await resolveSite();
  return {
    title: "实验室",
    description: `${site.name} 的公开系统、作品与长期实验目录。`
  };
}

export default async function LabPage() {
  const [page, projects, posts, site] = await Promise.all([
    resolveTemplatePage("LAB"),
    resolveProjects(),
    resolvePublishedPosts(),
    resolveSite()
  ]);

  if (!page) {
    notFound();
  }

  return (
    <>
      <main className="page-shell min-h-screen pb-10 pt-10 md:pt-20">
        <PageSectionsClient sections={page.sections} posts={posts} projects={projects} site={site} />
      </main>
      <LocalizedBreadcrumb items={[{ labelZh: site.name, labelEn: site.name, href: "/" }, { labelZh: "实验室", labelEn: "Lab" }]} />
    </>
  );
}
