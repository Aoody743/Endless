import { PublicContentList } from "@/components/public-content-list";
import { EditorialPageHeader, LocalizedBreadcrumb } from "@/components/public-primitives";
import { resolveSearchContent, resolveSite } from "@/lib/content-store";
import type { Metadata } from "next";
import { LocalizedText } from "@/components/page-copy";
import { SearchForm } from "@/components/search-form";

export async function generateMetadata(): Promise<Metadata> {
  const site = await resolveSite();
  return {
    title: "搜索",
    description: `搜索 ${site.name} 的文章、项目和展示页面。`
  };
}

interface SearchPageProps {
  searchParams: {
    q?: string;
  };
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const query = searchParams.q ?? "";
  const [results, site] = await Promise.all([resolveSearchContent(query), resolveSite()]);

  return (
    <>
      <main className="page-shell min-h-screen pb-10 pt-10 md:pt-20">
        <EditorialPageHeader
          eyebrow={{ zh: "搜索", en: "Search" }}
          title={{ zh: "在文章、页面与实验里\n继续往下找。", en: "Keep looking\nthrough notes, pages, and experiments." }}
          description={{
            zh: "搜索标题、摘要、正文和页面模块文案，快速回到曾经写下或发布过的内容。",
            en: "Search titles, summaries, full text, and page-section copy to return to things already written and published."
          }}
        />
        <SearchForm query={query} />
        {query ? (
          <div>
            <p className="editorial-kicker mb-6">
              <LocalizedText zh={`共找到 ${results.length} 条结果`} en={`${results.length} results`} />
            </p>
            <PublicContentList items={results} />
          </div>
        ) : (
          <p className="mx-auto max-w-2xl text-sm leading-8 text-muted">
            <LocalizedText
              zh="第一版搜索已经覆盖文章、展示页、项目与 section 文案。它现在更像一份安静的全站索引，而不是单纯的博客检索框。"
              en="The first version already covers posts, presentation pages, projects, and section copy. It behaves more like a quiet site-wide index than a blog-only search box."
            />
          </p>
        )}
      </main>
      <LocalizedBreadcrumb items={[{ labelZh: site.name, labelEn: site.name, href: "/" }, { labelZh: "搜索", labelEn: "Search" }]} />
    </>
  );
}
