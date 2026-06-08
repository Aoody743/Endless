"use client";

import type { ContentRecord } from "@endless/content";
import Link from "next/link";
import { useLanguage } from "./use-language";

function localizedValue(primary: string | undefined, secondary: string | undefined, language: "ZH" | "EN", fallback = "") {
  if (language === "EN") {
    return secondary?.trim() || primary?.trim() || fallback;
  }

  return primary?.trim() || secondary?.trim() || fallback;
}

export function PublicProjectDetail({
  project,
  htmlZh,
  htmlEn
}: {
  project: ContentRecord;
  htmlZh: string;
  htmlEn: string;
}) {
  const { language } = useLanguage();
  const isEnglish = language === "EN";
  const title = localizedValue(project.title, project.titleEn, language, isEnglish ? "Project" : "项目");
  const summary = localizedValue(project.summary, project.summaryEn, language, "");
  const html = isEnglish ? htmlEn : htmlZh;

  return (
    <main className="article-shell min-h-screen pb-12 pt-10 md:pt-20">
      <article className="mx-auto max-w-[46rem]">
        <Link href="/lab" className="editorial-kicker inline-flex hover:text-foreground">
          {isEnglish ? "Back to lab" : "返回实验室"}
        </Link>
        <header className="border-b hairline pb-10 pt-6">
          <p className="editorial-kicker">{isEnglish ? "Project" : "项目"}</p>
          <h1 className="editorial-title mt-5 text-left text-[clamp(2.6rem,2rem+2.5vw,4.8rem)]">{title}</h1>
          {summary ? <p className="mt-5 max-w-2xl text-base leading-8 text-muted">{summary}</p> : null}
        </header>
        <div className="prose-endless mt-10" dangerouslySetInnerHTML={{ __html: html }} />
      </article>
    </main>
  );
}
