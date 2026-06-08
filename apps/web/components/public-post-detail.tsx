"use client";

import type { ContentRecord, TocItem } from "@endless/content";
import Link from "next/link";
import Image from "next/image";
import { useLanguage } from "./use-language";

function localizedValue(primary: string | undefined, secondary: string | undefined, language: "ZH" | "EN", fallback = "") {
  if (language === "EN") {
    return secondary?.trim() || primary?.trim() || fallback;
  }

  return primary?.trim() || secondary?.trim() || fallback;
}

function dateLabel(value: string | undefined, language: "ZH" | "EN") {
  if (!value) {
    return null;
  }

  return new Intl.DateTimeFormat(language === "EN" ? "en-US" : "zh-CN", { dateStyle: "medium" }).format(new Date(value));
}

export function PublicPostDetail({
  post,
  htmlZh,
  htmlEn,
  tocZh,
  tocEn,
  readingMinutesZh,
  readingMinutesEn
}: {
  post: ContentRecord;
  htmlZh: string;
  htmlEn: string;
  tocZh: TocItem[];
  tocEn: TocItem[];
  readingMinutesZh: number;
  readingMinutesEn: number;
}) {
  const { language } = useLanguage();
  const isEnglish = language === "EN";
  const title = localizedValue(post.title, post.titleEn, language, isEnglish ? "Article" : "文章");
  const summary = localizedValue(post.summary, post.summaryEn, language, "");
  const toc = isEnglish ? tocEn : tocZh;
  const html = isEnglish ? htmlEn : htmlZh;
  const readingMinutes = isEnglish ? readingMinutesEn : readingMinutesZh;
  const publishedAt = dateLabel(post.publishedAt, language);

  return (
    <main className="article-shell min-h-screen pb-16 pt-8 md:pt-16">
      <div className="mx-auto max-w-5xl">
        <Link href="/blog" className="editorial-kicker inline-flex hover:text-foreground">
          {isEnglish ? "Back to blog" : "返回博客"}
        </Link>
        <header className="mx-auto max-w-[40rem] border-b hairline pb-14 pt-6 text-center">
          <p className="reading-meta">
            {publishedAt}
            {publishedAt ? " · " : ""}
            {readingMinutes} {isEnglish ? "min read" : "分钟阅读"}
          </p>
          <h1 className="editorial-title mt-5 text-[clamp(2.6rem,2rem+2.8vw,5.2rem)]">{title}</h1>
          {summary ? <p className="mx-auto mt-6 max-w-xl text-[0.98rem] leading-8 text-muted">{summary}</p> : null}
          <div className="mt-8 flex flex-wrap justify-center gap-3 text-xs uppercase tracking-[0.14em] text-faint">
            {post.tags.map((tag) => (
              <Link key={tag.slug} href={`/tags/${tag.slug}`} className="transition hover:text-foreground">
                {localizedValue(tag.name, tag.nameEn, language, isEnglish ? "Tag" : "标签")}
              </Link>
            ))}
          </div>
        </header>
      </div>

      {post.cover ? (
        <div className="mx-auto mt-12 max-w-5xl overflow-hidden rounded-md border hairline">
          <Image src={post.cover.url} alt={post.cover.alt} width={post.cover.width ?? 1600} height={post.cover.height ?? 1000} className="h-auto w-full object-cover" />
        </div>
      ) : null}

      <div className="mx-auto mt-14 grid max-w-6xl gap-12 lg:grid-cols-[minmax(0,42rem)_14rem]">
        <article className="min-w-0">
          <div className="prose-endless max-w-none" dangerouslySetInnerHTML={{ __html: html }} />
        </article>

        <aside className="hidden lg:block">
          <div className="sticky top-28 border-l hairline pl-5">
            <p className="editorial-kicker mb-4">{isEnglish ? "On this page" : "本页目录"}</p>
            <nav className="space-y-3 text-sm text-muted">
              {toc.map((item) => (
                <a
                  key={item.id}
                  href={`#${item.id}`}
                  className="block transition hover:text-foreground"
                  style={{ paddingLeft: `${(item.depth - 2) * 12}px` }}
                >
                  {item.text}
                </a>
              ))}
            </nav>
          </div>
        </aside>
      </div>
    </main>
  );
}
