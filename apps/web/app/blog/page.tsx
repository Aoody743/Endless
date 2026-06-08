import { PublicContentList } from "@/components/public-content-list";
import { EditorialPageHeader, LocalizedBreadcrumb } from "@/components/public-primitives";
import { PublicTaxonomyBar } from "@/components/public-taxonomy-bar";
import type { Metadata } from "next";
import { resolvePublishedPosts, resolveSite, resolveTags } from "@/lib/content-store";

export async function generateMetadata(): Promise<Metadata> {
  const site = await resolveSite();
  return {
    title: "博客",
    description: `${site.name} 的设计札记、写作系统和中文阅读记录。`
  };
}

export default async function BlogPage() {
  const [posts, tags, site] = await Promise.all([resolvePublishedPosts(), resolveTags(), resolveSite()]);

  return (
    <>
      <main className="page-shell min-h-screen pb-10 pt-10 md:pt-20">
        <EditorialPageHeader
          eyebrow={{ zh: "博客", en: "Blog" }}
          title={{ zh: "把思考写下来，\n留给时间与共鸣。", en: "Write the thought down,\nand let time answer it." }}
          description={{
            zh: "这里收录设计札记、写作系统、中文排版，以及关于个人发布系统的长期记录。",
            en: "Notes on design, editorial workflows, Chinese typography, and the long-term shape of a personal publishing system."
          }}
        />

        <PublicTaxonomyBar items={tags} label={{ zh: "主题", en: "Topics" }} />

        <PublicContentList items={posts} />
      </main>
      <LocalizedBreadcrumb items={[{ labelZh: site.name, labelEn: site.name, href: "/" }, { labelZh: "博客", labelEn: "Blog" }]} />
    </>
  );
}
