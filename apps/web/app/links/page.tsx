import type { Metadata } from "next";
import { PresetPublicPage, presetPageMetadata } from "@/components/public-page-shell";

export async function generateMetadata(): Promise<Metadata> {
  return presetPageMetadata("links", "链接", "站点公开链接与常用入口。");
}

export default async function LinksPage() {
  return <PresetPublicPage slug="links" breadcrumbZh="链接" breadcrumbEn="Links" />;
}
