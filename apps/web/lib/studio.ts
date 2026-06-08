import type {
  ContentStatus,
  ContentType,
  LayoutMode,
  PageSectionRecord,
  TaxonomyRecord,
  TemplateKey
} from "@endless/content";
import type { StudioContentInput } from "./content-store";

export const contentTypeOptions: Array<{ label: string; value: ContentType }> = [
  { label: "Post", value: "POST" },
  { label: "Page", value: "PAGE" },
  { label: "Doc", value: "DOC" },
  { label: "Project", value: "PROJECT" }
];

export const contentStatusOptions: Array<{ label: string; value: ContentStatus }> = [
  { label: "Draft", value: "DRAFT" },
  { label: "Scheduled", value: "SCHEDULED" },
  { label: "Published", value: "PUBLISHED" },
  { label: "Archived", value: "ARCHIVED" }
];

export const layoutModeOptions: Array<{ label: string; value: LayoutMode }> = [
  { label: "Markdown", value: "MARKDOWN" },
  { label: "Sections", value: "SECTIONS" },
  { label: "Hybrid", value: "HYBRID" }
];

export const templateKeyOptions: Array<{ label: string; value: TemplateKey }> = [
  { label: "Default", value: "DEFAULT" },
  { label: "Home", value: "HOME" },
  { label: "About", value: "ABOUT" },
  { label: "Lab", value: "LAB" },
  { label: "Landing", value: "LANDING" }
];

export function parseJsonBody<T>(value: string | undefined, fallback: T): T {
  if (!value) {
    return fallback;
  }

  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

function asString(value: unknown) {
  return typeof value === "string" ? value : "";
}

function asType(value: unknown): ContentType {
  return value === "PAGE" || value === "DOC" || value === "PROJECT" ? value : "POST";
}

function asStatus(value: unknown): ContentStatus {
  return value === "SCHEDULED" || value === "PUBLISHED" || value === "ARCHIVED" ? value : "DRAFT";
}

function asLayoutMode(value: unknown): LayoutMode {
  return value === "SECTIONS" || value === "HYBRID" ? value : "MARKDOWN";
}

function asTemplateKey(value: unknown): TemplateKey {
  return value === "HOME" || value === "ABOUT" || value === "LAB" || value === "LANDING" ? value : "DEFAULT";
}

function asStringArray(value: unknown, taxonomy: TaxonomyRecord[]) {
  if (!Array.isArray(value)) {
    return [];
  }

  const allowed = new Set(taxonomy.map((item) => item.slug));
  return value.filter((item): item is string => typeof item === "string" && allowed.has(item));
}

function asOptionalChoice(value: unknown, allowed: string[]) {
  return typeof value === "string" && allowed.includes(value) ? value : undefined;
}

function asSections(value: unknown): PageSectionRecord[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter((entry): entry is Record<string, unknown> => typeof entry === "object" && entry !== null)
    .map((entry, index) => ({
      id: asString(entry.id) || undefined,
      type: asString(entry.type) as PageSectionRecord["type"],
      variant: asString(entry.variant) || "default",
      order: typeof entry.order === "number" ? entry.order : index + 1,
      columnSpan: (asString(entry.columnSpan) as PageSectionRecord["columnSpan"]) || "full",
      enabled: typeof entry.enabled === "boolean" ? entry.enabled : true,
      props: typeof entry.props === "object" && entry.props ? (entry.props as Record<string, unknown>) : {}
    }))
    .filter((entry) => entry.type);
}

export function parseStudioPayload(
  payload: Record<string, unknown>,
  tags: TaxonomyRecord[],
  categories: TaxonomyRecord[],
  mediaIds: string[] = []
): StudioContentInput {
  const type = asType(payload.type);
  const templateKey = asTemplateKey(payload.templateKey);
  const layoutMode = type === "PAGE" ? asLayoutMode(payload.layoutMode) || "SECTIONS" : asLayoutMode(payload.layoutMode);

  return {
    title: asString(payload.title),
    titleEn: asString(payload.titleEn) || undefined,
    slug: asString(payload.slug) || asString(payload.title) || "untitled",
    summary: asString(payload.summary),
    summaryEn: asString(payload.summaryEn) || undefined,
    bodyMarkdown: asString(payload.bodyMarkdown),
    bodyMarkdownEn: asString(payload.bodyMarkdownEn) || undefined,
    type,
    status: asStatus(payload.status),
    layoutMode: type === "PAGE" && layoutMode === "MARKDOWN" ? "SECTIONS" : layoutMode,
    templateKey,
    sections: asSections(payload.sections),
    seoTitle: asString(payload.seoTitle) || undefined,
    seoTitleEn: asString(payload.seoTitleEn) || undefined,
    seoDescription: asString(payload.seoDescription) || undefined,
    seoDescriptionEn: asString(payload.seoDescriptionEn) || undefined,
    publishedAt: asString(payload.publishedAt) || undefined,
    scheduledAt: asString(payload.scheduledAt) || undefined,
    coverMediaId: asOptionalChoice(payload.coverMediaId, mediaIds),
    tagSlugs: asStringArray(payload.tagSlugs, tags),
    categorySlugs: asStringArray(payload.categorySlugs, categories)
  };
}

export function toDatetimeLocal(value?: string) {
  if (!value) {
    return "";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 16);
}
