import { contentItems, site, tags } from "./fixtures";
import type { ContentRecord, ContentType, SiteRecord, TaxonomyRecord, TemplateKey } from "./types";

function byPublishedDate(a: ContentRecord, b: ContentRecord) {
  return new Date(b.publishedAt ?? 0).getTime() - new Date(a.publishedAt ?? 0).getTime();
}

export function getSite(): SiteRecord {
  return site;
}

export function getPublishedContent(type?: ContentType): ContentRecord[] {
  return contentItems
    .filter((item) => item.status === "PUBLISHED")
    .filter((item) => (type ? item.type === type : true))
    .sort(byPublishedDate);
}

export function getPublishedPosts(): ContentRecord[] {
  return getPublishedContent("POST");
}

export function getProjects(): ContentRecord[] {
  return getPublishedContent("PROJECT");
}

export function getTemplatePage(templateKey: TemplateKey): ContentRecord | undefined {
  return contentItems.find((item) => item.type === "PAGE" && item.templateKey === templateKey && item.status === "PUBLISHED");
}

export function getContentBySlug(slug: string): ContentRecord | undefined {
  return contentItems.find((item) => item.slug === slug && item.status === "PUBLISHED");
}

export function getPostBySlug(slug: string): ContentRecord | undefined {
  const item = getContentBySlug(slug);
  return item?.type === "POST" ? item : undefined;
}

export function getTags(): TaxonomyRecord[] {
  return tags;
}

export function getTagBySlug(slug: string): TaxonomyRecord | undefined {
  return tags.find((tag) => tag.slug === slug);
}

export function getPostsByTag(slug: string): ContentRecord[] {
  return getPublishedPosts().filter((post) => post.tags.some((tag) => tag.slug === slug));
}

export function searchContent(query: string): ContentRecord[] {
  const normalized = query.trim().toLocaleLowerCase();
  if (!normalized) {
    return [];
  }

  return getPublishedContent().filter((item) => {
    const haystack = [
      item.title,
      item.titleEn ?? "",
      item.summary,
      item.summaryEn ?? "",
      item.bodyMarkdown,
      item.bodyMarkdownEn ?? "",
      ...item.sections.flatMap((section) => JSON.stringify(section.props)),
      ...item.tags.flatMap((tag) => [tag.name, tag.nameEn ?? ""]),
      ...item.categories.flatMap((category) => [category.name, category.nameEn ?? ""])
    ]
      .join(" ")
      .toLocaleLowerCase();

    return haystack.includes(normalized);
  });
}
