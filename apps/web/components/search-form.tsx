"use client";

import { Search } from "lucide-react";
import { useLanguage, t } from "./use-language";

export function SearchForm({ query }: { query: string }) {
  const { language } = useLanguage();

  return (
    <form className="mx-auto mb-12 flex max-w-3xl items-center gap-3 border-b hairline pb-4" action="/search">
      <Search aria-hidden className="h-5 w-5 text-muted" />
      <input
        name="q"
        defaultValue={query}
        placeholder={t(language, "输入关键词，例如 中文排版、页面构建、写作系统", "Search Chinese typography, page builder, writing system...")}
        className="min-w-0 flex-1 bg-transparent py-2 text-lg outline-none placeholder:text-faint"
      />
      <button className="rounded-full border hairline px-4 py-2 text-sm transition hover:text-foreground">
        {t(language, "搜索", "Search")}
      </button>
    </form>
  );
}
