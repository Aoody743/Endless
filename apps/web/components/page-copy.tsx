"use client";

import { useLanguage, t } from "./use-language";

export function LocalizedText({ zh, en }: { zh: string; en: string }) {
  const { language } = useLanguage();
  return <>{t(language, zh, en)}</>;
}
