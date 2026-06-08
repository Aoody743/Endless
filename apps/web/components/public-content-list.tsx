"use client";

import type { ContentRecord } from "@endless/content";
import Link from "next/link";
import { contentPath } from "@endless/content";
import { useLanguage } from "./use-language";

function dateLabel(value: string | undefined, language: "ZH" | "EN") {
  if (!value) {
    return language === "EN" ? "Draft" : "草稿";
  }

  return new Intl.DateTimeFormat(language === "EN" ? "en-US" : "zh-CN", { dateStyle: "medium" }).format(new Date(value));
}

function localizedValue(primary: string | undefined, secondary: string | undefined, language: "ZH" | "EN", fallback: string) {
  if (language === "EN") {
    return secondary?.trim() || primary?.trim() || fallback;
  }

  return primary?.trim() || secondary?.trim() || fallback;
}

export function PublicContentList({ items }: { items: ContentRecord[] }) {
  const { language } = useLanguage();

  if (items.length === 0) {
    return <p className="editorial-empty-state">{language === "EN" ? "Nothing published yet." : "这里还没有公开内容。"}</p>;
  }

  return (
    <div className="border-t hairline">
      {items.map((item) => {
        const title = localizedValue(item.title, item.titleEn, language, language === "EN" ? "Entry" : "内容");
        const summary = localizedValue(item.summary, item.summaryEn, language, "");

        return (
          <article key={item.slug} className="editorial-list-item">
            <div className="editorial-list-date">{dateLabel(item.publishedAt, language)}</div>
            <div className="min-w-0">
              <div className="editorial-list-meta">
                <span>{item.type === "POST" ? (language === "EN" ? "Article" : "文章") : item.type === "PROJECT" ? (language === "EN" ? "Project" : "项目") : language === "EN" ? "Page" : "页面"}</span>
                <span className="editorial-list-dot" aria-hidden />
                <span>{item.status === "PUBLISHED" ? (language === "EN" ? "Published" : "已发布") : language === "EN" ? "Draft" : "草稿"}</span>
              </div>
              <Link href={contentPath(item)} className="editorial-list-title">
                {title}
              </Link>
              {summary ? <p className="editorial-list-copy">{summary}</p> : null}
              {item.tags.length > 0 ? (
                <div className="mt-5 flex flex-wrap gap-3 text-xs uppercase tracking-[0.14em] text-faint">
                  {item.tags.map((tag) => {
                    const tagLabel = localizedValue(tag.name, tag.nameEn, language, language === "EN" ? "Tag" : "标签");

                    return (
                      <Link key={tag.slug} href={`/tags/${tag.slug}`} className="transition hover:text-foreground">
                        {tagLabel}
                      </Link>
                    );
                  })}
                </div>
              ) : null}
            </div>
          </article>
        );
      })}
    </div>
  );
}
