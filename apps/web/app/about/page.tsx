import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageSectionsClient } from "@/components/page-sections-client";
import { LocalizedBreadcrumb } from "@/components/public-primitives";
import { resolveProjects, resolvePublishedPosts, resolveSite, resolveTemplatePage } from "@/lib/content-store";

export async function generateMetadata(): Promise<Metadata> {
  const site = await resolveSite();
  return {
    title: "关于",
    description: `关于 ${site.name} 的设计目标、内容模型与站点哲学。`
  };
}

export default async function AboutPage() {
  const [page, posts, projects, site] = await Promise.all([
    resolveTemplatePage("ABOUT"),
    resolvePublishedPosts(),
    resolveProjects(),
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
      <LocalizedBreadcrumb items={[{ labelZh: site.name, labelEn: site.name, href: "/" }, { labelZh: "关于", labelEn: "About" }]} />
    </>
  );
}
