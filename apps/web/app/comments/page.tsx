import type { Metadata } from "next";
import { PresetPublicPage, presetPageMetadata } from "@/components/public-page-shell";

export async function generateMetadata(): Promise<Metadata> {
  return presetPageMetadata("comments", "评论", "公开评论页面与互动记录。");
}

export default async function CommentsPage() {
  return <PresetPublicPage slug="comments" breadcrumbZh="评论" breadcrumbEn="Comments" />;
}
