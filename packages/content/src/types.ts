export type ContentType = "POST" | "PAGE" | "DOC" | "PROJECT";
export type ContentStatus = "DRAFT" | "SCHEDULED" | "PUBLISHED" | "ARCHIVED";
export type LayoutMode = "MARKDOWN" | "SECTIONS" | "HYBRID";
export type TemplateKey = "HOME" | "ABOUT" | "LAB" | "LANDING" | "DEFAULT";

export interface TaxonomyRecord {
  name: string;
  nameEn?: string;
  slug: string;
  description?: string;
  descriptionEn?: string;
}

export interface MediaAssetRecord {
  id?: string;
  key: string;
  url: string;
  mimeType: string;
  width?: number;
  height?: number;
  alt: string;
  provider?: "LOCAL" | "S3" | "R2";
  createdAt?: string;
  updatedAt?: string;
}

export type PageSectionType =
  | "hero_statement"
  | "intro_richtext"
  | "feature_grid"
  | "featured_posts"
  | "project_directory"
  | "quote_panel"
  | "link_cluster"
  | "image_story"
  | "timeline"
  | "contact_strip"
  | "custom_html";

export type PageSectionColumnSpan = "full" | "wide" | "half" | "third";

export interface PageSectionRecord {
  id?: string;
  type: PageSectionType;
  variant: string;
  order: number;
  columnSpan: PageSectionColumnSpan;
  enabled: boolean;
  props: Record<string, unknown>;
}

export interface ContentRecord {
  id?: string;
  type: ContentType;
  status: ContentStatus;
  slug: string;
  title: string;
  titleEn?: string;
  summary: string;
  summaryEn?: string;
  bodyMarkdown: string;
  bodyMarkdownEn?: string;
  layoutMode: LayoutMode;
  templateKey: TemplateKey;
  sections: PageSectionRecord[];
  tags: TaxonomyRecord[];
  categories: TaxonomyRecord[];
  cover?: MediaAssetRecord;
  seoTitle?: string;
  seoTitleEn?: string;
  seoDescription?: string;
  seoDescriptionEn?: string;
  publishedAt?: string;
  scheduledAt?: string;
  readingMinutes?: number;
  createdAt?: string;
  updatedAt?: string;
  authorName?: string;
}

export interface SiteRecord {
  name: string;
  title: string;
  description: string;
  url: string;
  author: string;
  language: string;
}

export interface StudioProfileRecord {
  avatarUrl: string;
  siteName: string;
  location: string;
  timezone: string;
}

export interface StudioWeekdayPhrases {
  monday: string;
  tuesday: string;
  wednesday: string;
  thursday: string;
  friday: string;
  saturday: string;
  sunday: string;
}

export interface StudioMetricsFallback {
  commentsCount: number;
  thoughtsCount: number;
  onlineHours: number;
}

export interface StudioConfigRecord {
  profile: StudioProfileRecord;
  uiLanguage: "zh" | "en";
  navigationOrder: string[];
  weekdayPhrases: StudioWeekdayPhrases;
  metricsFallback: StudioMetricsFallback;
}

export interface AIProviderConfig {
  provider: "openai-compatible";
  baseUrl: string;
  model: string;
}

export interface AIProviderStatus {
  configured: boolean;
  provider: "openai-compatible";
  baseUrl?: string;
  model?: string;
  hasApiKey: boolean;
  message?: string;
}

export interface StudioSiteSettingsRecord {
  site: SiteRecord;
  studio: StudioConfigRecord;
  ai: AIProviderStatus;
  imageAi: AIProviderStatus;
}

export interface TocItem {
  id: string;
  depth: 2 | 3 | 4;
  text: string;
}

export interface RenderedMarkdown {
  html: string;
  toc: TocItem[];
  readingMinutes: number;
}
