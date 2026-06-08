import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { PageSectionsClient } from "@/components/page-sections-client";
import { LocalizedBreadcrumb } from "@/components/public-primitives";
import { resolveContentBySlug, resolveProjects, resolvePublishedPosts, resolveSite } from "@/lib/content-store";
import { presetBlueprint, presetSections, toPagePresetKey } from "@/lib/page-presets";

export async function presetPageMetadata(slug: string, fallbackTitle: string, fallbackDescription: string): Promise<Metadata> {
  const page = await resolveContentBySlug(slug);
  if (!page || page.type !== "PAGE") {
    const preset = toPagePresetKey(slug);
    if (preset) {
      const blueprint = presetBlueprint(preset);
      return {
        title: blueprint.title || fallbackTitle,
        description: blueprint.summary || fallbackDescription
      };
    }
    return {
      title: fallbackTitle,
      description: fallbackDescription
    };
  }

  return {
    title: page.title || fallbackTitle,
    description: page.summary || page.seoDescription || fallbackDescription
  };
}

export async function PresetPublicPage({
  slug,
  breadcrumbZh,
  breadcrumbEn
}: {
  slug: string;
  breadcrumbZh: string;
  breadcrumbEn: string;
}) {
  const [page, posts, projects, site] = await Promise.all([
    resolveContentBySlug(slug),
    resolvePublishedPosts(),
    resolveProjects(),
    resolveSite()
  ]);

  const preset = toPagePresetKey(slug);
  if ((!page || page.type !== "PAGE") && !preset) {
    notFound();
  }

  const blueprint = preset ? presetBlueprint(preset) : null;
  const sections = page?.type === "PAGE" ? page.sections : preset ? presetSections(preset) : [];
  const titleZh = page?.type === "PAGE" ? page.title : blueprint?.title ?? breadcrumbZh;
  const titleEn = page?.type === "PAGE" ? page.titleEn || page.title : blueprint?.titleEn ?? breadcrumbEn;

  return (
    <>
      <main className="page-shell min-h-screen pb-10 pt-10 md:pt-20">
        <PageSectionsClient sections={sections} posts={posts} projects={projects} site={site} />
      </main>
      <LocalizedBreadcrumb items={[{ labelZh: site.name, labelEn: site.name, href: "/" }, { labelZh: titleZh, labelEn: titleEn }]} />
    </>
  );
}
