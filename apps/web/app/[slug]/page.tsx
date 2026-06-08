import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { PageSectionsClient } from "@/components/page-sections-client";
import { LocalizedBreadcrumb } from "@/components/public-primitives";
import { resolveContentBySlug, resolveProjects, resolvePublishedPosts, resolveSite } from "@/lib/content-store";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const item = await resolveContentBySlug(slug);
  if (!item || item.type !== "PAGE") {
    return {};
  }
  return {
    title: item.title,
    description: item.summary || item.seoDescription || undefined
  };
}

export default async function PublicPageBySlug({ params }: PageProps) {
  const { slug } = await params;
  const [item, posts, projects, site] = await Promise.all([
    resolveContentBySlug(slug),
    resolvePublishedPosts(),
    resolveProjects(),
    resolveSite()
  ]);

  if (!item || item.type !== "PAGE") {
    notFound();
  }

  return (
    <>
      <main className="page-shell min-h-screen pb-10 pt-10 md:pt-20">
        <PageSectionsClient sections={item.sections} posts={posts} projects={projects} site={site} />
      </main>
      <LocalizedBreadcrumb items={[{ labelZh: site.name, labelEn: site.name, href: "/" }, { labelZh: item.title, labelEn: item.titleEn || item.title }]} />
    </>
  );
}
