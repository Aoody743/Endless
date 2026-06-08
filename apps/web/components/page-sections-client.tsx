"use client";

import { PageSections } from "@/components/page-sections";
import type { ContentRecord, PageSectionRecord, SiteRecord } from "@endless/content";
import { useLanguage } from "./use-language";

export function PageSectionsClient({
  sections,
  posts,
  projects,
  site,
  preview = false
}: {
  sections: PageSectionRecord[];
  posts: ContentRecord[];
  projects: ContentRecord[];
  site: SiteRecord;
  preview?: boolean;
}) {
  const { language } = useLanguage();
  return <PageSections sections={sections} posts={posts} projects={projects} site={site} preview={preview} locale={language === "EN" ? "en" : "zh"} />;
}
