"use client";

import type { TaxonomyRecord } from "@endless/content";
import Link from "next/link";
import { useLanguage } from "./use-language";

function localizedValue(primary: string | undefined, secondary: string | undefined, language: "ZH" | "EN", fallback: string) {
  if (language === "EN") {
    return secondary?.trim() || fallback;
  }

  return primary?.trim() || secondary?.trim() || fallback;
}

export function PublicTaxonomyBar({
  items,
  label,
  hrefPrefix = "/tags/"
}: {
  items: TaxonomyRecord[];
  label: { zh: string; en: string };
  hrefPrefix?: string;
}) {
  const { language } = useLanguage();

  return (
    <div className="taxonomy-bar">
      <span className="taxonomy-bar-label">{language === "EN" ? label.en : label.zh}</span>
      {items.map((item) => (
        <Link key={item.slug} href={`${hrefPrefix}${item.slug}`} className="taxonomy-chip">
          {localizedValue(item.name, item.nameEn, language, language === "EN" ? "Tag" : "标签")}
        </Link>
      ))}
    </div>
  );
}
