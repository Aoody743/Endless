import type { Metadata } from "next";
import { PresetPublicPage, presetPageMetadata } from "@/components/public-page-shell";

export async function generateMetadata(): Promise<Metadata> {
  return presetPageMetadata("resume", "简历", "公开履历、时间线与个人介绍页面。");
}

export default async function ResumePage() {
  return <PresetPublicPage slug="resume" breadcrumbZh="简历" breadcrumbEn="Resume" />;
}
