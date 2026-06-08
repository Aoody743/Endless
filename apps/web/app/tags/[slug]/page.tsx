import { PublicContentList } from "@/components/public-content-list";
import { EditorialPageHeader, LocalizedBreadcrumb } from "@/components/public-primitives";
import { resolvePostsByTag, resolveSite, resolveTagBySlug, resolveTags } from "@/lib/content-store";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

interface TagPageProps {
  params: {
    slug: string;
  };
}

export async function generateStaticParams() {
  const tags = await resolveTags();
  return tags.map((tag) => ({ slug: tag.slug }));
}

export async function generateMetadata({ params }: TagPageProps): Promise<Metadata> {
  const tag = await resolveTagBySlug(params.slug);
  if (!tag) {
    return {};
  }

  return {
    title: tag.name,
    description: tag.description
  };
}

export default async function TagPage({ params }: TagPageProps) {
  const [tag, posts, site] = await Promise.all([resolveTagBySlug(params.slug), resolvePostsByTag(params.slug), resolveSite()]);
  if (!tag) {
    notFound();
  }

  return (
    <>
      <main className="page-shell min-h-screen pb-10 pt-10 md:pt-20">
        <EditorialPageHeader
          eyebrow={{ zh: "标签", en: "Tag" }}
          title={{ zh: tag.name, en: tag.nameEn ?? tag.name ?? "Tag" }}
          description={{ zh: tag.description ?? "", en: tag.descriptionEn ?? "" }}
          align="left"
        />
        <PublicContentList items={posts} />
      </main>
      <LocalizedBreadcrumb
        items={[
          { labelZh: site.name, labelEn: site.name, href: "/" },
          { labelZh: "博客", labelEn: "Blog", href: "/blog" },
          { labelZh: tag.name, labelEn: tag.nameEn ?? "Tag" }
        ]}
      />
    </>
  );
}
