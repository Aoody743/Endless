import type { Metadata } from "next";
import { PresetPublicPage, presetPageMetadata } from "@/components/public-page-shell";

export async function generateMetadata(): Promise<Metadata> {
  return presetPageMetadata("photos", "照片墙", "公开照片墙与视觉记录页面。");
}

export default async function PhotosPage() {
  return <PresetPublicPage slug="photos" breadcrumbZh="照片墙" breadcrumbEn="Photos" />;
}
