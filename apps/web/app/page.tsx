import { notFound } from "next/navigation";
import { PageSectionsClient } from "@/components/page-sections-client";
import { resolveProjects, resolvePublishedPosts, resolveSite, resolveTemplatePage } from "@/lib/content-store";

export default async function HomePage() {
  const [page, posts, projects, site] = await Promise.all([
    resolveTemplatePage("HOME"),
    resolvePublishedPosts(),
    resolveProjects(),
    resolveSite()
  ]);

  if (!page) {
    notFound();
  }

  return (
    <main className="shell pb-24 pt-0 md:pb-28">
      <PageSectionsClient sections={page.sections} posts={posts} projects={projects} site={site} />
    </main>
  );
}
