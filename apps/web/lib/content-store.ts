import { AIProviderError, OpenAICompatibleProvider, type AIProviderConfig as RuntimeAIProviderConfig, type AiActionResult } from "@endless/ai";
import {
  absoluteUrl,
  contentItems,
  contentUrl,
  estimateReadingMinutes,
  getSite,
  type AIProviderConfig,
  type AIProviderStatus,
  type ContentRecord,
  type ContentStatus,
  type ContentType,
  type LayoutMode,
  type PageSectionRecord,
  type SiteRecord,
  type StudioSiteSettingsRecord,
  type StudioConfigRecord,
  type TaxonomyRecord,
  type TemplateKey
} from "@endless/content";
import { presetBlueprint, presetSections, type PagePresetKey } from "@/lib/page-presets";
import { prisma } from "@endless/db";
import type { ContentItem, Prisma } from "@prisma/client";
import {
  ContentStatus as PrismaContentStatus,
  ContentType as PrismaContentType,
  LayoutMode as PrismaLayoutMode,
  TemplateKey as PrismaTemplateKey
} from "@prisma/client";
import { revalidatePath } from "next/cache";
import { decryptSecret, encryptSecret, type EncryptedSecretPayload } from "@/lib/ai-credentials";

const aiProvider = new OpenAICompatibleProvider();

type ContentWithRelations = Prisma.ContentItemGetPayload<{
  include: {
    tags: true;
    categories: true;
    coverMedia: true;
    author: true;
    pageSections: {
      orderBy: {
        order: "asc";
      };
    };
  };
}>;

export interface StudioContentInput {
  title: string;
  titleEn?: string;
  slug: string;
  summary: string;
  summaryEn?: string;
  bodyMarkdown: string;
  bodyMarkdownEn?: string;
  type: ContentType;
  status: ContentStatus;
  layoutMode: LayoutMode;
  templateKey: TemplateKey;
  sections: PageSectionRecord[];
  seoTitle?: string;
  seoTitleEn?: string;
  seoDescription?: string;
  seoDescriptionEn?: string;
  publishedAt?: string;
  scheduledAt?: string;
  coverMediaId?: string;
  tagSlugs: string[];
  categorySlugs: string[];
}

export interface StudioContentSummary {
  counts: Record<ContentStatus, number>;
  countsByType: Record<ContentType, number>;
  publishedCountsByType: Record<ContentType, number>;
  recentDrafts: ContentRecord[];
  recentlyPublished: ContentRecord[];
  recentPages: ContentRecord[];
  recentItems: ContentRecord[];
  totalWords: number;
  lastUpdatedAt?: string;
  firstCreatedAt?: string;
}

export interface StudioRevisionRecord {
  id: string;
  title: string;
  summary: string;
  bodyMarkdown: string;
  reason?: string;
  createdAt: string;
}

export interface StudioMediaAssetRecord {
  id: string;
  provider: "LOCAL" | "S3" | "R2";
  key: string;
  url: string;
  mimeType: string;
  width?: number;
  height?: number;
  alt: string;
  createdAt: string;
  updatedAt: string;
}

export interface StudioSiteSettingsInput {
  name?: string;
  title?: string;
  description?: string;
  url?: string;
  author?: string;
  language?: string;
  studio?: Partial<StudioConfigRecord>;
  ai?: {
    provider: "openai-compatible";
    baseUrl: string;
    model: string;
    apiKey?: string;
  };
  aiImage?: {
    provider: "openai-compatible";
    baseUrl: string;
    model: string;
    apiKey?: string;
  };
}

interface StoredAIConfig {
  provider: "openai-compatible";
  baseUrl: string;
  model: string;
  encryptedApiKey?: EncryptedSecretPayload;
}

function hasDatabase() {
  return process.env.ENDLESS_DISABLE_DATABASE !== "1" && Boolean(process.env.DATABASE_URL?.trim());
}

function createSectionId() {
  if (typeof globalThis.crypto?.randomUUID === "function") {
    return `section-${globalThis.crypto.randomUUID()}`;
  }

  return `section-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

function mapTaxonomy(list: Array<Record<string, unknown> & { name: string; slug: string; description: string | null }>): TaxonomyRecord[] {
  return list.map((item) => ({
    name: item.name,
    nameEn: typeof item.nameEn === "string" ? item.nameEn : undefined,
    slug: item.slug,
    description: item.description ?? undefined,
    descriptionEn: typeof item.descriptionEn === "string" ? item.descriptionEn : undefined
  }));
}

function sortSections(sections: PageSectionRecord[]) {
  return [...sections].sort((a, b) => a.order - b.order);
}

const legacyAssetMap: Record<string, string> = {
  "https://743.world/stuff/avatar.jpg": "/images/daydreamer-avatar.png",
  "https://743.world/stuff/background.jpg": "/images/daydreamer-quzhou.jpeg"
};

function normalizeLegacyAssetValue(value: unknown): unknown {
  if (typeof value === "string") {
    return legacyAssetMap[value] ?? value;
  }

  if (Array.isArray(value)) {
    return value.map((entry) => normalizeLegacyAssetValue(entry));
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, field]) => [key, normalizeLegacyAssetValue(field)])
    );
  }

  return value;
}

function normalizeReleaseCopyText(value: string) {
  return value
    .replaceAll("Endless CMS", "Endless")
    .replaceAll("Endless Author", "Endless")
    .replaceAll("一个为个人写作、知识沉淀与作品展示准备的安静内容系统。", "一个面向长期写作、公开页面与安静发布流程的内容系统。")
    .replaceAll("一个为个人博客、知识库、作品集与展示页准备的写作优先 CMS。", "一个面向长期写作、公开页面与安静发布流程的内容系统。")
    .replaceAll("一个写作优先的 CMS，用于个人网站、长文笔记和模块化公开页面。", "一个面向长期写作、公开页面与安静发布流程的内容系统。")
    .replaceAll("写作优先、内容优先的个人网站 CMS。", "长期写作、页面编排与安静发布的一体化站点系统。")
    .replaceAll("A writing-first, content-first CMS for personal websites.", "An integrated site system for long-form writing, page composition, and quiet publishing.")
    .replaceAll(
      "A writing-first CMS for personal websites, long-form notes, and modular public pages.",
      "A content system for long-form writing, modular public pages, and calm publishing workflows."
    )
    .replaceAll(
      "A writing-first, content-first CMS for personal websites.",
      "An integrated site system for long-form writing, page composition, and quiet publishing."
    )
    .replaceAll(
      "A writing-first CMS for personal publishing.",
      "An integrated site system for long-form writing, page composition, and quiet publishing."
    );
}

function normalizeReleaseCopyValue(value: unknown): unknown {
  if (typeof value === "string") {
    return normalizeReleaseCopyText(value);
  }

  if (Array.isArray(value)) {
    return value.map((entry) => normalizeReleaseCopyValue(entry));
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, field]) => [key, normalizeReleaseCopyValue(field)])
    );
  }

  return value;
}

function isPlaceholderTitle(value: string | undefined) {
  const normalized = value?.trim().toLowerCase();
  return !normalized || normalized === "untitled" || normalized === "new draft";
}

function isPlaceholderBody(value: string | undefined) {
  const normalized = value?.trim().toLowerCase();
  return !normalized || normalized === "# untitled" || normalized === "# new draft";
}

function fallbackTitleForRecord(record: Pick<ContentRecord, "type" | "slug" | "templateKey">, locale: "zh" | "en") {
  const slug = record.slug.trim().toLowerCase();
  if (record.templateKey === "HOME" || slug === "home") return locale === "en" ? "Home" : "首页";
  if (record.templateKey === "ABOUT" || slug === "about") return locale === "en" ? "About" : "关于";
  if (record.templateKey === "LAB" || slug === "lab") return locale === "en" ? "Lab" : "实验室";
  if (slug === "friends") return locale === "en" ? "Friends" : "友链";
  if (slug === "thoughts") return locale === "en" ? "Thoughts" : "朋友圈";
  if (slug === "links") return locale === "en" ? "Links" : "链接";
  if (slug === "photos") return locale === "en" ? "Photo Wall" : "照片墙";
  if (slug === "resume") return locale === "en" ? "Resume" : "个人简历";
  if (slug === "comments") return locale === "en" ? "Comments" : "评论管理";

  if (record.type === "PROJECT") return locale === "en" ? "Untitled project" : "未命名项目";
  if (record.type === "PAGE") return locale === "en" ? "Untitled page" : "未命名页面";
  if (record.type === "DOC") return locale === "en" ? "Untitled document" : "未命名文档";
  return locale === "en" ? "Untitled article" : "未命名文章";
}

function isPlaceholderSection(section: PageSectionRecord) {
  const props = section.props as Record<string, unknown>;

  if (section.type === "hero_statement") {
    return (
      props.eyebrow === "New section" &&
      props.eyebrowZh === "新模块" &&
      props.eyebrowEn === "New section" &&
      props.titleZh === "新的开场区块" &&
      props.titleEn === "New opening statement" &&
      props.bodyZh === "用一个清楚的想法打开这个页面。" &&
      props.bodyEn === "Use this section to open the page with one strong idea."
    );
  }

  if (section.type === "intro_richtext") {
    return props.bodyMarkdown === "### Start writing\n\nUse Markdown here.";
  }

  if (section.type === "feature_grid") {
    return (
      props.title === "Discover more" &&
      Array.isArray(props.items) &&
      props.items.length === 1 &&
      typeof props.items[0] === "object" &&
      props.items[0] !== null &&
      (props.items[0] as Record<string, unknown>).title === "Feature title"
    );
  }

  if (section.type === "project_directory") {
    return props.title === "Project directory" && props.description === "This section reads from published project items.";
  }

  if (section.type === "quote_panel") {
    return props.quoteZh === "一段值得停下来的话。" && props.quoteEn === "A quotation worth pausing on.";
  }

  if (section.type === "link_cluster") {
    return (
      props.title === "Links" &&
      Array.isArray(props.links) &&
      props.links.length === 1 &&
      typeof props.links[0] === "object" &&
      props.links[0] !== null &&
      (props.links[0] as Record<string, unknown>).label === "Link label"
    );
  }

  if (section.type === "image_story") {
    return props.title === "A section with image and copy" && props.image === "/images/quiet-desk.png" && props.alt === "Preview";
  }

  if (section.type === "timeline") {
    return props.title === "Timeline";
  }

  if (section.type === "contact_strip") {
    return props.title === "Call to action" && props.body === "Wrap up the page with a clear next step.";
  }

  if (section.type === "custom_html") {
    return (
      props.titleZh === "自定义页面模块" &&
      props.titleEn === "Custom page module" &&
      props.htmlZh === "<section><h2>自定义内容</h2><p>在这里写 HTML，顶栏会继续保留。</p></section>" &&
      props.htmlEn === "<section><h2>Custom content</h2><p>Write HTML here while keeping the site header.</p></section>"
    );
  }

  return false;
}

function normalizedReleaseHomeReferenceItems() {
  return [
    {
      cardType: "text_stat_card",
      layoutKey: "tech",
      gridAreaLg: "1 / 1 / 3 / 3",
      gridAreaSm: "1 / 1 / 3 / 3",
      headlineZh: "📱💻⌨️🛠️\nTech\nEnthusiast",
      headlineEn: "📱💻⌨️🛠️\nTech\nEnthusiast"
    },
    {
      cardType: "cta_link_card",
      layoutKey: "self-hoster",
      gridAreaLg: "1 / 3 / 3 / 5",
      gridAreaSm: "1 / 3 / 3 / 5",
      headlineZh: "Self-\nhoster",
      headlineEn: "Self-\nhoster",
      subheadlineZh: "Check Out\nMy lab",
      subheadlineEn: "Check Out\nMy lab",
      ctaLabelZh: "进入",
      ctaLabelEn: "Check out",
      href: "/lab"
    },
    {
      cardType: "mbti_card",
      layoutKey: "infj",
      gridAreaLg: "1 / 5 / 3 / 9",
      gridAreaSm: "3 / 1 / 5 / 5",
      metaZh: "MBTI Personality Type",
      metaEn: "MBTI Personality Type",
      headlineZh: "INFJ",
      headlineEn: "INFJ",
      overlayTitleZh: "Advocate",
      overlayTitleEn: "Advocate",
      ctaLabelZh: "Learn More",
      ctaLabelEn: "Learn More",
      externalHref: "https://www.16personalities.com/infj-personality",
      image: "/images/infj-reference.svg"
    },
    {
      cardType: "image_location_card",
      layoutKey: "hometown",
      gridAreaLg: "3 / 1 / 7 / 3",
      gridAreaSm: "5 / 1 / 9 / 3",
      metaZh: "Hometown",
      metaEn: "Hometown",
      overlayTitleZh: "Quzhou,\nZhejiang",
      overlayTitleEn: "Quzhou,\nZhejiang",
      image: "/images/daydreamer-quzhou.jpeg"
    },
    {
      cardType: "image_school_card",
      layoutKey: "undergrad",
      gridAreaLg: "3 / 3 / 5 / 5",
      gridAreaSm: "5 / 3 / 7 / 5",
      metaZh: "Self-made",
      metaEn: "Self-made",
      overlayTitleZh: "Human\nUniversity",
      overlayTitleEn: "Human\nUniversity",
      image: "/images/daydreamer-hnu.jpg",
      overlayTone: "dark"
    },
    {
      cardType: "map_card",
      layoutKey: "map",
      gridAreaLg: "3 / 5 / 5 / 9",
      gridAreaSm: "9 / 1 / 11 / 5",
      overlayTone: "muted",
      metaZh: "Current Location",
      metaEn: "Current Location",
      overlayTitleZh: "Yuhang, Hangzhou",
      overlayTitleEn: "Yuhang, Hangzhou",
      image: "/images/daydreamer-map.png"
    },
    {
      cardType: "creator_card",
      layoutKey: "builder",
      gridAreaLg: "5 / 3 / 9 / 7",
      gridAreaSm: "11 / 1 / 15 / 5",
      emoji: "👨‍💻",
      headlineZh: "Creating\nSomething Cool.",
      headlineEn: "Creating\nSomething Cool.",
      metaZh: "持续创造",
      metaEn: "Creator",
      iconStack: [
        "ri-html5-line",
        "ri-css3-line",
        "ri-javascript-line",
        "ri-reactjs-line",
        "ri-nextjs-line",
        "ri-vuejs-line",
        "ri-svelte-line",
        "ri-npmjs-line",
        "ri-nodejs-line",
        "ri-tailwind-css-line",
        "ri-bootstrap-line",
        "ri-webpack-line",
        "ri-chrome-line",
        "ri-firefox-line",
        "ri-flutter-line",
        "ri-apple-line",
        "ri-android-line",
        "ri-google-play-line",
        "ri-windows-line",
        "ri-github-line",
        "ri-openai-line",
        "ri-open-source-line",
        "ri-product-hunt-line",
        "ri-stack-overflow-line"
      ]
    },
    {
      cardType: "image_school_card",
      layoutKey: "campus",
      gridAreaLg: "5 / 7 / 7 / 9",
      gridAreaSm: "7 / 3 / 9 / 5",
      metaZh: "Campus",
      metaEn: "Campus",
      overlayTitleZh: "I ❤️\nHFI!!!",
      overlayTitleEn: "I ❤️\nHFI!!!",
      image: "/images/daydreamer-changsha.jpg",
      overlayTone: "dark"
    },
    {
      cardType: "avatar_card",
      layoutKey: "avatar",
      gridAreaLg: "7 / 1 / 9 / 3",
      gridAreaSm: "15 / 1 / 17 / 3",
      image: "/images/daydreamer-avatar.png"
    },
    {
      cardType: "resume_link_card",
      layoutKey: "resume",
      gridAreaLg: "7 / 7 / 8 / 9",
      gridAreaSm: "15 / 3 / 16 / 5",
      headlineZh: "📄 My Resume",
      headlineEn: "📄 My Resume",
      href: "/resume"
    },
    {
      cardType: "email_link_card",
      layoutKey: "email",
      gridAreaLg: "8 / 7 / 9 / 9",
      gridAreaSm: "16 / 3 / 17 / 5",
      headlineZh: "✉ me@skywt.eu",
      headlineEn: "✉ me@skywt.eu",
      href: "mailto:me@skywt.eu",
      external: "true"
    },
  ];
}

function normalizeHomeReferenceSection(section: PageSectionRecord): PageSectionRecord {
  if (section.variant !== "home-bento-reference") {
    return section;
  }

  const props = section.props as Record<string, unknown>;
  const items = Array.isArray(props.items) ? props.items : [];
  const looksLegacyDemo = items.some((entry) => {
    if (!entry || typeof entry !== "object") return false;
    const item = entry as Record<string, unknown>;
    const layoutKey = typeof item.layoutKey === "string" ? item.layoutKey : "";
    const href = typeof item.href === "string" ? item.href : "";
    const externalHref = typeof item.externalHref === "string" ? item.externalHref : "";
    const headline = typeof item.headline === "string" ? item.headline : "";
    const overlayTitle = typeof item.overlayTitle === "string" ? item.overlayTitle : "";

    return (
      ["mbti", "hometown", "undergrad", "map", "location-photo", "email", "resume"].includes(layoutKey) ||
      href === "mailto:me@endless.cn" ||
      externalHref === "https://www.16personalities.com/infj-personality" ||
      externalHref === "https://cv.endlesscms.dev" ||
      headline.includes("全栈工程师") ||
      overlayTitle.includes("湖南大学") ||
      overlayTitle.includes("浙")
    );
  });

  if (!looksLegacyDemo) {
    return section;
  }

  return {
    ...section,
    props: {
      ...props,
      items: normalizedReleaseHomeReferenceItems()
    }
  };
}

function normalizeHomeHeroSection(section: PageSectionRecord): PageSectionRecord {
  if (section.variant !== "poster-emoji") {
    return section;
  }

  const props = section.props as Record<string, unknown>;
  const bodyZh = typeof props.bodyZh === "string" ? props.bodyZh : "";
  const bodyEn = typeof props.bodyEn === "string" ? props.bodyEn : "";
  const heroLines = Array.isArray(props.heroLines) ? props.heroLines : [];
  const looksLegacyDemo =
    bodyZh.includes("一个写作优先的 CMS") ||
    bodyEn.includes("A writing-first CMS") ||
    heroLines.some((entry) => {
      if (!entry || typeof entry !== "object") return false;
      const item = entry as Record<string, unknown>;
      return item.text === "游无底之境" || item.textEn === "Inspire" || item.text === "创协和之世";
    });

  if (!looksLegacyDemo) {
    return section;
  }

  return {
    ...section,
    props: {
      ...props,
      eyebrowZh: "SkyWT",
      eyebrowEn: "SkyWT",
      bodyZh: "Hi 👋 我是 SkyWT，一名来自中国杭州的 🧑‍💻 软件工程师，也喜欢折腾系统、做有趣的产品和画画。",
      bodyEn: "Hi 👋 I'm SkyWT, a software engineer from Hangzhou, China, into systems, playful products, and painting.",
      heroLines: [
        { text: "Software Engineer", textEn: "Software Engineer", emoji: "🛠️", suffix: ",", suffixEn: "," },
        { text: "Hacker & Painter", textEn: "Hacker & Painter", emoji: "🎨", suffix: ".", suffixEn: "." }
      ],
      socialBrand: "SkyWT"
    }
  };
}

function normalizeHomeIntroSection(section: PageSectionRecord): PageSectionRecord {
  if (section.variant !== "intro-lines") {
    return section;
  }

  const props = section.props as Record<string, unknown>;
  const lines = Array.isArray(props.lines) ? props.lines : [];
  const looksLegacyDemo = lines.some((entry) => {
    if (!entry || typeof entry !== "object") return false;
    const item = entry as Record<string, unknown>;
    return (
      item.text === "你好 👋 我是 Endless，一名软件工程师。" ||
      item.text === "我希望持续做出优雅、克制、好用的产品。" ||
      item.textEn === "Hi 👋 I'm Endless, a software engineer."
    );
  });

  if (!looksLegacyDemo) {
    return section;
  }

  return {
    ...section,
    props: {
      ...props,
      lines: [
        {
          text: "Hi 👋 我是 SkyWT，一名来自杭州的 🧑‍💻 软件工程师。",
          textEn: "Hi 👋 I'm SkyWT, a software engineer from Hangzhou, China."
        },
        {
          text: "我喜欢黑客式折腾、安静写作，也把画画当作长期表达的一部分。",
          textEn: "I like hacker-style tinkering, calm writing, and keeping painting in the mix.",
          emoji: "🪄"
        },
        {
          text: "这里会放文章、页面、thoughts 朋友圈和我正在做的各种实验。",
          textEn: "This is where I keep essays, pages, thoughts, and the experiments I'm building.",
          emoji: "🌙"
        }
      ]
    }
  };
}

function normalizeContentRecord(record: ContentRecord): ContentRecord {
  const titleZh = record.title.trim();
  const titleEn = record.titleEn?.trim();
  const nextTitleZh =
    isPlaceholderTitle(titleZh) && titleEn && !isPlaceholderTitle(titleEn)
      ? titleEn
      : isPlaceholderTitle(titleZh)
        ? fallbackTitleForRecord(record, "zh")
        : titleZh;
  const nextTitleEn =
    isPlaceholderTitle(titleEn) && titleZh && !isPlaceholderTitle(titleZh)
      ? titleZh
      : isPlaceholderTitle(titleEn)
        ? fallbackTitleForRecord(record, "en")
        : titleEn;

  const bodyZh = record.bodyMarkdown?.trim();
  const bodyEn = record.bodyMarkdownEn?.trim();

  return {
    ...record,
    title: normalizeReleaseCopyText(nextTitleZh),
    titleEn: nextTitleEn ? normalizeReleaseCopyText(nextTitleEn) : nextTitleEn,
    summary: normalizeReleaseCopyText(record.summary),
    summaryEn: record.summaryEn ? normalizeReleaseCopyText(record.summaryEn) : record.summaryEn,
    bodyMarkdown: normalizeReleaseCopyText(isPlaceholderBody(bodyZh) && bodyEn && !isPlaceholderBody(bodyEn) ? record.bodyMarkdownEn ?? record.bodyMarkdown : record.bodyMarkdown),
    bodyMarkdownEn:
      typeof (isPlaceholderBody(bodyEn) && bodyZh && !isPlaceholderBody(bodyZh) ? record.bodyMarkdown : record.bodyMarkdownEn) === "string"
        ? normalizeReleaseCopyText((isPlaceholderBody(bodyEn) && bodyZh && !isPlaceholderBody(bodyZh) ? record.bodyMarkdown : record.bodyMarkdownEn) as string)
        : record.bodyMarkdownEn,
    seoTitle: record.seoTitle ? normalizeReleaseCopyText(record.seoTitle) : record.seoTitle,
    seoTitleEn: record.seoTitleEn ? normalizeReleaseCopyText(record.seoTitleEn) : record.seoTitleEn,
    seoDescription: record.seoDescription ? normalizeReleaseCopyText(record.seoDescription) : record.seoDescription,
    seoDescriptionEn: record.seoDescriptionEn ? normalizeReleaseCopyText(record.seoDescriptionEn) : record.seoDescriptionEn,
    authorName: record.authorName ? normalizeReleaseCopyText(record.authorName) : record.authorName,
    sections: sortSections(record.sections)
      .filter((section) => !isPlaceholderSection(section))
      .map((section) => normalizeHomeHeroSection(section))
      .map((section) => normalizeHomeIntroSection(section))
      .map((section) => normalizeHomeReferenceSection(section))
      .map((section) => ({
        ...section,
        props: (normalizeReleaseCopyValue(section.props) as Record<string, unknown>) ?? section.props
      }))
  };
}

function mapSections(
  sections: Array<{
    id: string;
    type: string;
    variant: string;
    order: number;
    columnSpan: string;
    enabled: boolean;
    props: Prisma.JsonValue;
  }>
): PageSectionRecord[] {
  return sections.map((section) => ({
    id: section.id,
    type: section.type as PageSectionRecord["type"],
    variant: section.variant,
    order: section.order,
    columnSpan: section.columnSpan as PageSectionRecord["columnSpan"],
    enabled: section.enabled,
    props: (normalizeLegacyAssetValue(section.props) as Record<string, unknown>) ?? {}
  }));
}

function normalizeSpecialPage(record: ContentRecord): ContentRecord {
  if (record.type !== "PAGE") {
    return record;
  }

  const slug = record.slug.trim().toLowerCase();
  if (slug !== "thoughts" && slug !== "comments") {
    return record;
  }

  const sections = sortSections(record.sections);
  const feedIndex = sections.findIndex((section) => section.type === "feature_grid" && section.variant === "friend-cards");

  const isLegacyThoughtItem = (item: Record<string, unknown>) =>
    item.titleZh === "今天写完了新段落。" &&
    item.titleEn === "Finished a new paragraph today." &&
    item.descriptionZh === "记录一个清晰的小进展。" &&
    item.descriptionEn === "A small clear progress note.";

  const isLegacyCommentItem = (item: Record<string, unknown>) =>
    (item.titleZh === "待处理评论 #1" && item.titleEn === "Pending comment #1") ||
    (item.titleZh === "已通过评论 #2" && item.titleEn === "Approved comment #2");

  const fallbackFeedSection: PageSectionRecord =
    slug === "thoughts"
      ? {
          id: "thoughts-feed",
          type: "feature_grid",
          variant: "thought-stream",
          order: sections.length + 1,
          columnSpan: "full",
          enabled: true,
          props: {
            titleZh: "Moments / 朋友圈",
            titleEn: "Moments / Thoughts",
            items: []
          }
        }
      : {
          id: "comments-feed",
          type: "feature_grid",
          variant: "comment-stream",
          order: sections.length + 1,
          columnSpan: "full",
          enabled: true,
          props: {
            titleZh: "评论队列",
            titleEn: "Comment queue",
            items: []
          }
        };

  if (feedIndex < 0) {
    return {
      ...record,
      sections: [...sections, fallbackFeedSection].map((section, index) => ({
        ...section,
        order: index + 1
      }))
    };
  }

  const normalizedSections = sections.map((section, index) => {
    if (index !== feedIndex) {
      return {
        ...section,
        order: index + 1
      };
    }

    const rawItems = Array.isArray(section.props.items) ? section.props.items : [];
    const items = rawItems.filter((item): item is Record<string, unknown> => typeof item === "object" && item !== null);
    const shouldClearSeededItems =
      items.length > 0 &&
      items.every((item) => (slug === "thoughts" ? isLegacyThoughtItem(item) : isLegacyCommentItem(item)));

    return {
      ...section,
      order: index + 1,
      variant: slug === "thoughts" ? "thought-stream" : "comment-stream",
      props: {
        ...section.props,
        ...(slug === "thoughts"
          ? { titleZh: section.props.titleZh ?? "Moments / 朋友圈", titleEn: section.props.titleEn ?? "Moments / Thoughts" }
          : { titleZh: section.props.titleZh ?? "评论队列", titleEn: section.props.titleEn ?? "Comment queue" }),
        items: shouldClearSeededItems ? [] : rawItems
      }
    };
  });

  return {
    ...record,
    sections: normalizedSections
  };
}

function mapMediaAsset(item: {
  id: string;
  provider: "LOCAL" | "S3" | "R2";
  key: string;
  url: string;
  mimeType: string;
  width: number | null;
  height: number | null;
  alt: string;
  createdAt: Date;
  updatedAt: Date;
}): StudioMediaAssetRecord {
  return {
    id: item.id,
    provider: item.provider,
    key: item.key,
    url: item.url,
    mimeType: item.mimeType,
    width: item.width ?? undefined,
    height: item.height ?? undefined,
    alt: item.alt,
    createdAt: item.createdAt.toISOString(),
    updatedAt: item.updatedAt.toISOString()
  };
}

function mergeSiteRecord(value?: Partial<SiteRecord>): SiteRecord {
  return normalizeSiteRecord({
    ...getSite(),
    ...value
  });
}

function normalizeSiteRecord(site: SiteRecord): SiteRecord {
  const normalizedTitle = site.title.trim() === "Endless CMS" ? site.name : site.title;
  const normalizedDescription =
    site.description.trim() === "一个为个人写作、知识沉淀与作品展示准备的安静内容系统。"
      ? "一个面向长期写作、公开页面与安静发布流程的内容系统。"
      : site.description;

  return {
    ...site,
    title: normalizeReleaseCopyText(normalizedTitle),
    description: normalizeReleaseCopyText(normalizedDescription),
    author: normalizeReleaseCopyText(site.author)
  };
}

function defaultStudioConfig(site?: SiteRecord): StudioConfigRecord {
  return {
    profile: {
      avatarUrl: "/images/daydreamer-avatar.png",
      siteName: site?.name || getSite().name,
      location: "Shanghai",
      timezone: "Asia/Shanghai"
    },
    uiLanguage: "zh",
    navigationOrder: ["home", "blog", "lab", "friends", "about", "thoughts"],
    weekdayPhrases: {
      monday: "Mindful Monday",
      tuesday: "Tender Tuesday",
      wednesday: "Warm Wednesday",
      thursday: "Tremendous Thursday",
      friday: "Happy Friday",
      saturday: "Soft Saturday",
      sunday: "Slow Sunday"
    },
    metricsFallback: {
      commentsCount: 0,
      thoughtsCount: 0,
      onlineHours: 0
    }
  };
}

function asRecord(value: unknown): Record<string, unknown> {
  return typeof value === "object" && value !== null ? (value as Record<string, unknown>) : {};
}

function stringValue(value: unknown, fallback: string) {
  return typeof value === "string" ? value : fallback;
}

function numberValue(value: unknown, fallback: number) {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function normalizeStudioAvatarUrl(value: unknown, fallback: string) {
  const next = typeof value === "string" ? value.trim() : "";
  if (!next || next === "https://743.world/stuff/avatar.jpg") {
    return fallback;
  }
  return next;
}

function parseStudioConfig(value: unknown, site?: SiteRecord): StudioConfigRecord {
  const defaults = defaultStudioConfig(site);
  const record = asRecord(value);
  const profile = asRecord(record.profile);
  const weekdayPhrases = asRecord(record.weekdayPhrases);
  const metricsFallback = asRecord(record.metricsFallback);
  const rawNavigationOrder = Array.isArray(record.navigationOrder) ? record.navigationOrder.filter((item): item is string => typeof item === "string") : defaults.navigationOrder;
  const allowedNavigation = new Set(["home", "blog", "lab", "friends", "about", "thoughts", "links", "photos", "resume", "comments"]);
  const normalizedNavigationOrder = [
    ...new Set(
      rawNavigationOrder
        .map((item) => item.trim().toLowerCase())
        .filter((item) => allowedNavigation.has(item))
    )
  ];
  const navigationOrder = normalizedNavigationOrder.length > 0 ? normalizedNavigationOrder : defaults.navigationOrder;

  return {
    profile: {
      avatarUrl: normalizeStudioAvatarUrl(profile.avatarUrl, defaults.profile.avatarUrl),
      siteName: stringValue(profile.siteName, defaults.profile.siteName),
      location: stringValue(profile.location, defaults.profile.location),
      timezone: stringValue(profile.timezone, defaults.profile.timezone)
    },
    uiLanguage: record.uiLanguage === "en" ? "en" : "zh",
    navigationOrder,
    weekdayPhrases: {
      monday: stringValue(weekdayPhrases.monday, defaults.weekdayPhrases.monday),
      tuesday: stringValue(weekdayPhrases.tuesday, defaults.weekdayPhrases.tuesday),
      wednesday: stringValue(weekdayPhrases.wednesday, defaults.weekdayPhrases.wednesday),
      thursday: stringValue(weekdayPhrases.thursday, defaults.weekdayPhrases.thursday),
      friday: stringValue(weekdayPhrases.friday, defaults.weekdayPhrases.friday),
      saturday: stringValue(weekdayPhrases.saturday, defaults.weekdayPhrases.saturday),
      sunday: stringValue(weekdayPhrases.sunday, defaults.weekdayPhrases.sunday)
    },
    metricsFallback: {
      commentsCount: numberValue(metricsFallback.commentsCount, defaults.metricsFallback.commentsCount),
      thoughtsCount: numberValue(metricsFallback.thoughtsCount, defaults.metricsFallback.thoughtsCount),
      onlineHours: numberValue(metricsFallback.onlineHours, defaults.metricsFallback.onlineHours)
    }
  };
}

async function resolveStudioConfig(site?: SiteRecord) {
  if (!hasDatabase()) {
    return defaultStudioConfig(site);
  }

  const value = await readSiteSettingValue("studio");
  return parseStudioConfig(value, site);
}

function sanitizeAiStatus(config?: Partial<AIProviderConfig>, hasApiKey = false, message?: string): AIProviderStatus {
  const complete = Boolean(config?.baseUrl?.trim() && config?.model?.trim() && hasApiKey);
  return {
    configured: complete && !message,
    provider: "openai-compatible",
    baseUrl: config?.baseUrl,
    model: config?.model,
    hasApiKey,
    message
  };
}

function parseStoredAIConfig(value: unknown): StoredAIConfig | null {
  if (typeof value !== "object" || value === null) {
    return null;
  }

  const record = value as Record<string, unknown>;
  const provider = record.provider === "openai-compatible" ? "openai-compatible" : null;
  const baseUrl = typeof record.baseUrl === "string" ? record.baseUrl.trim() : "";
  const model = typeof record.model === "string" ? record.model.trim() : "";
  const encryptedApiKey =
    typeof record.encryptedApiKey === "object" && record.encryptedApiKey !== null
      ? (record.encryptedApiKey as EncryptedSecretPayload)
      : undefined;

  if (!provider) {
    return null;
  }

  return {
    provider,
    baseUrl,
    model,
    encryptedApiKey
  };
}

async function readSiteSettingValue(key: string): Promise<unknown | undefined> {
  const setting = await prisma.siteSetting.findUnique({
    where: { key }
  });
  return setting?.value;
}

async function loadAIConfig(key = "ai"): Promise<StoredAIConfig | null> {
  if (!hasDatabase()) {
    return null;
  }

  const value = await readSiteSettingValue(key);
  return parseStoredAIConfig(value);
}

function toRuntimeAIConfig(config: StoredAIConfig): RuntimeAIProviderConfig {
  if (!config.baseUrl || !config.model || !config.encryptedApiKey) {
    throw new Error("AI provider config is incomplete.");
  }

  const apiKey = decryptSecret(config.encryptedApiKey).trim();
  if (!apiKey) {
    throw new Error("AI API key is empty.");
  }

  return {
    provider: "openai-compatible",
    baseUrl: config.baseUrl,
    model: config.model,
    apiKey
  };
}

function mapContentItem(item: ContentWithRelations): ContentRecord {
  const localized = item as unknown as Record<string, unknown>;
  return normalizeContentRecord(normalizeSpecialPage({
    id: item.id,
    type: item.type,
    status: item.status,
    slug: item.slug,
    title: item.title,
    titleEn: typeof localized.titleEn === "string" ? localized.titleEn : undefined,
    summary: item.summary,
    summaryEn: typeof localized.summaryEn === "string" ? localized.summaryEn : undefined,
    bodyMarkdown: item.bodyMarkdown,
    bodyMarkdownEn: typeof localized.bodyMarkdownEn === "string" ? localized.bodyMarkdownEn : undefined,
    layoutMode: item.layoutMode,
    templateKey: item.templateKey,
    sections: mapSections(item.pageSections),
    tags: mapTaxonomy(item.tags),
    categories: mapTaxonomy(item.categories),
    cover: item.coverMedia
      ? {
          id: item.coverMedia.id,
          key: item.coverMedia.key,
          url: item.coverMedia.url,
          mimeType: item.coverMedia.mimeType,
          width: item.coverMedia.width ?? undefined,
          height: item.coverMedia.height ?? undefined,
          alt: item.coverMedia.alt,
          provider: item.coverMedia.provider,
          createdAt: item.coverMedia.createdAt.toISOString(),
          updatedAt: item.coverMedia.updatedAt.toISOString()
        }
      : undefined,
    seoTitle: item.seoTitle ?? undefined,
    seoTitleEn: typeof localized.seoTitleEn === "string" ? localized.seoTitleEn : undefined,
    seoDescription: item.seoDescription ?? undefined,
    seoDescriptionEn: typeof localized.seoDescriptionEn === "string" ? localized.seoDescriptionEn : undefined,
    publishedAt: item.publishedAt?.toISOString(),
    scheduledAt: item.scheduledAt?.toISOString(),
    readingMinutes: item.readingMinutes,
    createdAt: item.createdAt.toISOString(),
    updatedAt: item.updatedAt.toISOString(),
    authorName: item.author?.name ?? undefined
  }));
}

function byPublishedDate(a: ContentRecord, b: ContentRecord) {
  return new Date(b.publishedAt ?? b.updatedAt ?? 0).getTime() - new Date(a.publishedAt ?? a.updatedAt ?? 0).getTime();
}

function byUpdatedDate(a: ContentRecord, b: ContentRecord) {
  return new Date(b.updatedAt ?? b.publishedAt ?? 0).getTime() - new Date(a.updatedAt ?? a.publishedAt ?? 0).getTime();
}

function normalizeQuery(query: string) {
  return query.trim().toLocaleLowerCase();
}

function localSearch(records: ContentRecord[], query: string) {
  const normalized = normalizeQuery(query);
  if (!normalized) {
    return [];
  }

  return records.filter((item) => {
    const haystack = [
      item.title,
      item.titleEn ?? "",
      item.summary,
      item.summaryEn ?? "",
      item.bodyMarkdown,
      item.bodyMarkdownEn ?? "",
      ...item.sections.map((section) => JSON.stringify(section.props)),
      ...item.tags.flatMap((tag) => [tag.name, tag.nameEn ?? ""]),
      ...item.categories.flatMap((category) => [category.name, category.nameEn ?? ""])
    ]
      .join(" ")
      .toLocaleLowerCase();

    return haystack.includes(normalized);
  });
}

function slugify(value: string) {
  return value
    .toLocaleLowerCase()
    .trim()
    .replace(/[\s_]+/g, "-")
    .replace(/[^a-z0-9-\u4e00-\u9fa5]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function defaultSectionForPage(): PageSectionRecord[] {
  return [
    {
      id: createSectionId(),
      type: "hero_statement",
      variant: "page-title",
      order: 1,
      columnSpan: "full",
      enabled: true,
      props: {
        eyebrow: "New page",
        title: "New page",
        body: "Start shaping this page with sections."
      }
    }
  ];
}

function publicPathFor(item: Pick<ContentRecord, "type" | "slug" | "templateKey">) {
  if (item.type === "POST") {
    return `/blog/${item.slug}`;
  }

  if (item.type === "PROJECT") {
    return `/lab/${item.slug}`;
  }

  if (item.type === "PAGE") {
    if (item.templateKey === "HOME") {
      return "/";
    }

    if (item.templateKey === "ABOUT") {
      return "/about";
    }

    if (item.templateKey === "LAB") {
      return "/lab";
    }
  }

  return `/${item.slug}`;
}

async function ensureUniqueSlug(slug: string, currentId?: string) {
  const base = slugify(slug) || "untitled";
  let candidate = base;
  let index = 1;

  while (true) {
    const existing = await prisma.contentItem.findUnique({
      where: { slug: candidate },
      select: { id: true }
    });

    if (!existing || existing.id === currentId) {
      return candidate;
    }

    index += 1;
    candidate = `${base}-${index}`;
  }
}

async function loadPublishedFromDatabase(type?: ContentType) {
  const records = await prisma.contentItem.findMany({
    where: {
      status: PrismaContentStatus.PUBLISHED,
      ...(type ? { type: type as PrismaContentType } : {})
    },
    include: {
      tags: true,
      categories: true,
      coverMedia: true,
      author: true,
      pageSections: {
        orderBy: { order: "asc" }
      }
    },
    orderBy: [{ publishedAt: "desc" }, { updatedAt: "desc" }]
  });

  return records.map(mapContentItem);
}

async function loadContentBySlugFromDatabase(slug: string) {
  const item = await prisma.contentItem.findFirst({
    where: {
      slug,
      status: PrismaContentStatus.PUBLISHED
    },
    include: {
      tags: true,
      categories: true,
      coverMedia: true,
      author: true,
      pageSections: {
        orderBy: { order: "asc" }
      }
    }
  });

  return item ? mapContentItem(item) : undefined;
}

async function loadPageByTemplateKeyFromDatabase(templateKey: TemplateKey) {
  const item = await prisma.contentItem.findFirst({
    where: {
      type: PrismaContentType.PAGE,
      templateKey: templateKey as PrismaTemplateKey,
      status: PrismaContentStatus.PUBLISHED
    },
    include: {
      tags: true,
      categories: true,
      coverMedia: true,
      author: true,
      pageSections: {
        orderBy: { order: "asc" }
      }
    }
  });

  return item ? mapContentItem(item) : undefined;
}

async function loadStudioContentById(id: string) {
  const item = await prisma.contentItem.findUnique({
    where: { id },
    include: {
      tags: true,
      categories: true,
      coverMedia: true,
      author: true,
      pageSections: {
        orderBy: { order: "asc" }
      }
    }
  });

  return item ? mapContentItem(item) : undefined;
}

function localPublished(type?: ContentType) {
  return contentItems
    .filter((item) => item.status === "PUBLISHED")
    .filter((item) => (type ? item.type === type : true))
    .map((item) => normalizeContentRecord(normalizeSpecialPage(item)))
    .sort(byPublishedDate);
}

export async function resolveSite() {
  if (!hasDatabase()) {
    return getSite();
  }

  try {
    const setting = await prisma.siteSetting.findUnique({
      where: { key: "site" }
    });

    if (!setting) {
      return getSite();
    }

    const value = setting.value as Partial<SiteRecord>;
    return mergeSiteRecord(value);
  } catch {
    return getSite();
  }
}

export async function getStudioSiteSettings(): Promise<StudioSiteSettingsRecord> {
  const site = await resolveSite();
  const studio = await resolveStudioConfig(site);

  if (!hasDatabase()) {
    return {
      site,
      studio,
      ai: sanitizeAiStatus(undefined, false, "Studio requires DATABASE_URL."),
      imageAi: sanitizeAiStatus(undefined, false, "Studio requires DATABASE_URL.")
    };
  }

  try {
    const [config, imageConfig] = await Promise.all([loadAIConfig("ai"), loadAIConfig("ai-image")]);
    if (!config && !imageConfig) {
      return {
        site,
        studio,
        ai: sanitizeAiStatus(undefined, false, "AI provider is not configured yet."),
        imageAi: sanitizeAiStatus(undefined, false, "AI image provider is not configured yet.")
      };
    }

    return {
      site,
      studio,
      ai: sanitizeAiStatus(
        {
          provider: "openai-compatible",
          baseUrl: config?.baseUrl,
          model: config?.model
        },
        Boolean(config?.encryptedApiKey),
        config ? (Boolean(config.baseUrl && config.model && config.encryptedApiKey) ? undefined : "AI config is incomplete.") : "AI provider is not configured yet."
      ),
      imageAi: sanitizeAiStatus(
        {
          provider: "openai-compatible",
          baseUrl: imageConfig?.baseUrl,
          model: imageConfig?.model
        },
        Boolean(imageConfig?.encryptedApiKey),
        imageConfig
          ? (Boolean(imageConfig.baseUrl && imageConfig.model && imageConfig.encryptedApiKey) ? undefined : "AI image config is incomplete.")
          : "AI image provider is not configured yet."
      )
    };
  } catch (error) {
    return {
      site,
      studio,
      ai: sanitizeAiStatus(undefined, false, error instanceof Error ? error.message : "Unable to read AI settings."),
      imageAi: sanitizeAiStatus(undefined, false, error instanceof Error ? error.message : "Unable to read AI image settings.")
    };
  }
}

export async function resolvePublishedContent(type?: ContentType) {
  if (!hasDatabase()) {
    return localPublished(type);
  }

  try {
    return await loadPublishedFromDatabase(type);
  } catch {
    return localPublished(type);
  }
}

export async function resolvePublishedPosts() {
  return resolvePublishedContent("POST");
}

export async function resolveProjects() {
  return resolvePublishedContent("PROJECT");
}

export async function resolveTemplatePage(templateKey: TemplateKey) {
  if (!hasDatabase()) {
    const item = contentItems.find((item) => item.type === "PAGE" && item.templateKey === templateKey && item.status === "PUBLISHED");
    return item ? normalizeContentRecord(normalizeSpecialPage(item)) : undefined;
  }

  try {
    return await loadPageByTemplateKeyFromDatabase(templateKey);
  } catch {
    const item = contentItems.find((item) => item.type === "PAGE" && item.templateKey === templateKey && item.status === "PUBLISHED");
    return item ? normalizeContentRecord(normalizeSpecialPage(item)) : undefined;
  }
}

export async function resolveContentBySlug(slug: string) {
  if (!hasDatabase()) {
    const item = contentItems.find((item) => item.slug === slug && item.status === "PUBLISHED");
    return item ? normalizeContentRecord(normalizeSpecialPage(item)) : undefined;
  }

  try {
    const fromDb = await loadContentBySlugFromDatabase(slug);
    if (fromDb) return fromDb;
    const item = contentItems.find((item) => item.slug === slug && item.status === "PUBLISHED");
    return item ? normalizeContentRecord(normalizeSpecialPage(item)) : undefined;
  } catch {
    const item = contentItems.find((item) => item.slug === slug && item.status === "PUBLISHED");
    return item ? normalizeContentRecord(normalizeSpecialPage(item)) : undefined;
  }
}

export async function resolvePostBySlug(slug: string) {
  const item = await resolveContentBySlug(slug);
  return item?.type === "POST" ? item : undefined;
}

export async function resolveProjectBySlug(slug: string) {
  const item = await resolveContentBySlug(slug);
  return item?.type === "PROJECT" ? item : undefined;
}

export async function resolveTags() {
  const records = await resolvePublishedContent();
  const seen = new Map<string, TaxonomyRecord>();
  for (const item of records) {
    for (const tag of item.tags) {
      seen.set(tag.slug, tag);
    }
  }
  return Array.from(seen.values()).sort((a, b) => a.name.localeCompare(b.name, "zh-CN"));
}

export async function resolveCategories() {
  if (!hasDatabase()) {
    const seen = new Map<string, TaxonomyRecord>();
    for (const item of contentItems) {
      for (const category of item.categories) {
        seen.set(category.slug, category);
      }
    }
    return Array.from(seen.values());
  }

  try {
    const categories = await prisma.category.findMany({
      orderBy: { name: "asc" }
    });

    return mapTaxonomy(categories);
  } catch {
    const seen = new Map<string, TaxonomyRecord>();
    for (const item of contentItems) {
      for (const category of item.categories) {
        seen.set(category.slug, category);
      }
    }
    return Array.from(seen.values());
  }
}

export async function resolveTagBySlug(slug: string) {
  const tags = await resolveTags();
  return tags.find((tag) => tag.slug === slug);
}

export async function resolvePostsByTag(slug: string) {
  const posts = await resolvePublishedPosts();
  return posts.filter((post) => post.tags.some((tag) => tag.slug === slug));
}

export async function resolveSearchContent(query: string) {
  const published = await resolvePublishedContent();
  return localSearch(published, query);
}

export async function listStudioContent(options?: {
  type?: ContentType | "ALL";
  status?: ContentStatus | "ALL";
  query?: string;
}) {
  if (!hasDatabase()) {
    throw new Error("Studio requires DATABASE_URL.");
  }

  const records = await prisma.contentItem.findMany({
    where: {
      ...(options?.type && options.type !== "ALL" ? { type: options.type as PrismaContentType } : {}),
      ...(options?.status && options.status !== "ALL" ? { status: options.status as PrismaContentStatus } : {}),
      ...(options?.query
        ? {
            OR: [
              { title: { contains: options.query, mode: "insensitive" } },
              { titleEn: { contains: options.query, mode: "insensitive" } },
              { summary: { contains: options.query, mode: "insensitive" } },
              { summaryEn: { contains: options.query, mode: "insensitive" } },
              { bodyMarkdown: { contains: options.query, mode: "insensitive" } },
              { bodyMarkdownEn: { contains: options.query, mode: "insensitive" } }
            ]
          }
        : {})
    },
    include: {
      tags: true,
      categories: true,
      coverMedia: true,
      author: true,
      pageSections: {
        orderBy: { order: "asc" }
      }
    },
    orderBy: [{ updatedAt: "desc" }]
  });

  return records.map(mapContentItem);
}

export async function getStudioSummary(): Promise<StudioContentSummary> {
  if (!hasDatabase()) {
    throw new Error("Studio requires DATABASE_URL.");
  }

  const [records, recentDrafts, recentlyPublished, recentPages] = await Promise.all([
    prisma.contentItem.findMany({
      include: {
        tags: true,
        categories: true,
        coverMedia: true,
        author: true,
        pageSections: {
          orderBy: { order: "asc" }
        }
      }
    }),
    prisma.contentItem.findMany({
      where: { status: PrismaContentStatus.DRAFT },
      include: {
        tags: true,
        categories: true,
        coverMedia: true,
        author: true,
        pageSections: {
          orderBy: { order: "asc" }
        }
      },
      orderBy: { updatedAt: "desc" },
      take: 5
    }),
    prisma.contentItem.findMany({
      where: { status: PrismaContentStatus.PUBLISHED },
      include: {
        tags: true,
        categories: true,
        coverMedia: true,
        author: true,
        pageSections: {
          orderBy: { order: "asc" }
        }
      },
      orderBy: { publishedAt: "desc" },
      take: 4
    }),
    prisma.contentItem.findMany({
      where: { type: PrismaContentType.PAGE },
      include: {
        tags: true,
        categories: true,
        coverMedia: true,
        author: true,
        pageSections: {
          orderBy: { order: "asc" }
        }
      },
      orderBy: { updatedAt: "desc" },
      take: 4
    })
  ]);

  const counts: Record<ContentStatus, number> = {
    DRAFT: 0,
    SCHEDULED: 0,
    PUBLISHED: 0,
    ARCHIVED: 0
  };
  const countsByType: Record<ContentType, number> = {
    POST: 0,
    PAGE: 0,
    DOC: 0,
    PROJECT: 0
  };
  const publishedCountsByType: Record<ContentType, number> = {
    POST: 0,
    PAGE: 0,
    DOC: 0,
    PROJECT: 0
  };

  for (const record of records) {
    counts[record.status] += 1;
    countsByType[record.type] += 1;
    if (record.status === PrismaContentStatus.PUBLISHED) {
      publishedCountsByType[record.type] += 1;
    }
  }

  const mappedRecords = records.map(mapContentItem).sort(byUpdatedDate);
  const byCreatedDate = mappedRecords
    .filter((record) => Boolean(record.createdAt))
    .sort((left, right) => new Date(left.createdAt as string).getTime() - new Date(right.createdAt as string).getTime());
  const totalWords = records.reduce((total, record) => {
    return total + record.bodyMarkdown.length + ((record as unknown as { bodyMarkdownEn?: string | null }).bodyMarkdownEn?.length ?? 0);
  }, 0);

  return {
    counts,
    countsByType,
    publishedCountsByType,
    recentDrafts: recentDrafts.map(mapContentItem).sort(byUpdatedDate),
    recentlyPublished: recentlyPublished.map(mapContentItem).sort(byPublishedDate),
    recentPages: recentPages.map(mapContentItem).sort(byUpdatedDate),
    recentItems: mappedRecords.slice(0, 8),
    totalWords,
    lastUpdatedAt: mappedRecords[0]?.updatedAt,
    firstCreatedAt: byCreatedDate[0]?.createdAt
  };
}

export async function getStudioContent(id: string) {
  if (!hasDatabase()) {
    throw new Error("Studio requires DATABASE_URL.");
  }

  const item = await loadStudioContentById(id);
  if (!item) {
    return undefined;
  }

  return item;
}

export async function getStudioSpecialPages() {
  if (!hasDatabase()) {
    throw new Error("Studio requires DATABASE_URL.");
  }

  const pages = await prisma.contentItem.findMany({
    where: {
      type: PrismaContentType.PAGE,
      slug: {
        in: ["thoughts", "comments"]
      }
    },
    include: {
      tags: true,
      categories: true,
      coverMedia: true,
      author: true,
      pageSections: {
        orderBy: { order: "asc" }
      }
    },
    orderBy: { updatedAt: "desc" }
  });

  const mapped = pages.map(mapContentItem);
  return {
    thoughts: mapped.find((item) => item.slug === "thoughts"),
    comments: mapped.find((item) => item.slug === "comments")
  };
}

export async function createStudioContent(type: ContentType, preset?: PagePresetKey) {
  if (!hasDatabase()) {
    throw new Error("Studio requires DATABASE_URL.");
  }

  const owner = await prisma.user.findFirst({
    orderBy: { createdAt: "asc" }
  });
  const layoutMode = type === "PAGE" ? PrismaLayoutMode.SECTIONS : PrismaLayoutMode.MARKDOWN;
  const presetConfig = type === "PAGE" && preset ? presetBlueprint(preset) : null;
  const baseSlug = await ensureUniqueSlug(presetConfig?.slug || `untitled-${type.toLowerCase()}`);
  const initialSections = type === "PAGE" ? (preset ? presetSections(preset) : defaultSectionForPage()) : [];

  const item = await prisma.contentItem.create({
    data: {
      type: type as PrismaContentType,
      status: PrismaContentStatus.DRAFT,
      title: presetConfig?.title || "",
      titleEn: presetConfig?.titleEn || "",
      slug: baseSlug,
      summary: presetConfig?.summary || "",
      summaryEn: presetConfig?.summaryEn || "",
      bodyMarkdown: "",
      bodyMarkdownEn: "",
      layoutMode,
      templateKey:
        presetConfig?.templateKey === "HOME"
          ? PrismaTemplateKey.HOME
          : presetConfig?.templateKey === "ABOUT"
            ? PrismaTemplateKey.ABOUT
            : presetConfig?.templateKey === "LAB"
              ? PrismaTemplateKey.LAB
              : PrismaTemplateKey.DEFAULT,
      seoTitleEn: "",
      seoDescriptionEn: "",
      readingMinutes: 1,
      authorId: owner?.id
    }
  });

  if (type === "PAGE") {
    await prisma.pageSection.createMany({
      data: initialSections.map((pageSection) => ({
        id: pageSection.id!,
        contentItemId: item.id,
        type: pageSection.type,
        variant: pageSection.variant,
        order: pageSection.order,
        columnSpan: pageSection.columnSpan,
        enabled: pageSection.enabled,
        props: pageSection.props as Prisma.InputJsonValue
      }))
    });
  }

  await prisma.contentRevision.create({
    data: {
      contentItemId: item.id,
      title: item.title,
      titleEn: (item as { titleEn?: string | null }).titleEn ?? null,
      summary: item.summary,
      summaryEn: (item as { summaryEn?: string | null }).summaryEn ?? null,
      bodyMarkdown: item.bodyMarkdown,
      bodyMarkdownEn: (item as { bodyMarkdownEn?: string | null }).bodyMarkdownEn ?? null,
      reason: presetConfig ? `Initial ${preset} preset draft` : "Initial draft"
    }
  });

  revalidatePath("/studio");
  revalidatePath("/studio/content");
  return item.id;
}

export async function batchStudioContentAction(ids: string[], action: "archive" | "hide" | "delete") {
  if (!hasDatabase()) {
    throw new Error("Studio requires DATABASE_URL.");
  }

  const safeIds = ids.filter(Boolean);
  if (!safeIds.length) {
    return { count: 0 };
  }

  if (action === "delete") {
    const result = await prisma.contentItem.deleteMany({
      where: { id: { in: safeIds } }
    });
    revalidatePath("/studio");
    revalidatePath("/studio/writing");
    revalidatePath("/studio/pages");
    return { count: result.count };
  }

  const result = await prisma.contentItem.updateMany({
    where: { id: { in: safeIds } },
    data: { status: PrismaContentStatus.ARCHIVED }
  });

  revalidatePath("/studio");
  revalidatePath("/studio/writing");
  revalidatePath("/studio/pages");
  return { count: result.count };
}

export async function listStudioMediaAssets() {
  if (!hasDatabase()) {
    return contentItems
      .flatMap((item) => (item.cover?.id ? [item.cover] : []))
      .map((item) => ({
        id: item.id ?? item.key,
        provider: item.provider ?? "LOCAL",
        key: item.key,
        url: item.url,
        mimeType: item.mimeType,
        width: item.width,
        height: item.height,
        alt: item.alt,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }));
  }

  const media = await prisma.mediaAsset.findMany({
    orderBy: { createdAt: "desc" }
  });

  return media.map((item) => mapMediaAsset(item));
}

export async function createStudioMediaAsset(input: {
  provider: "LOCAL" | "S3" | "R2";
  key: string;
  url: string;
  mimeType: string;
  width?: number;
  height?: number;
  alt: string;
}) {
  if (!hasDatabase()) {
    throw new Error("Studio requires DATABASE_URL.");
  }

  const media = await prisma.mediaAsset.create({
    data: {
      provider: input.provider,
      key: input.key,
      url: input.url,
      mimeType: input.mimeType,
      width: input.width,
      height: input.height,
      alt: input.alt
    }
  });

  revalidatePath("/studio/media");
  return mapMediaAsset(media);
}

export async function updateStudioMediaAsset(id: string, input: { alt?: string }) {
  if (!hasDatabase()) {
    throw new Error("Studio requires DATABASE_URL.");
  }

  const media = await prisma.mediaAsset.update({
    where: { id },
    data: {
      alt: input.alt?.trim() || "uploaded-image"
    }
  });

  revalidatePath("/studio/media");
  return mapMediaAsset(media);
}

export async function deleteStudioMediaAsset(id: string) {
  if (!hasDatabase()) {
    throw new Error("Studio requires DATABASE_URL.");
  }

  const media = await prisma.mediaAsset.findUnique({
    where: { id }
  });

  if (!media) {
    throw new Error("Media not found.");
  }

  await prisma.contentItem.updateMany({
    where: { coverMediaId: id },
    data: { coverMediaId: null }
  });

  await prisma.mediaAsset.delete({
    where: { id }
  });

  revalidatePath("/studio/media");
  revalidatePath("/studio/content");
  return mapMediaAsset(media);
}

export async function saveSiteSettings(input: StudioSiteSettingsInput): Promise<StudioSiteSettingsRecord> {
  if (!hasDatabase()) {
    throw new Error("Studio requires DATABASE_URL.");
  }

  const currentSite = await resolveSite();
  let normalizedUrl = currentSite.url;
  if (input.url?.trim()) {
    try {
      normalizedUrl = new URL(input.url.trim()).toString().replace(/\/$/, "");
    } catch {
      normalizedUrl = currentSite.url;
    }
  }

  const nextSite = mergeSiteRecord({
    name: input.name?.trim() || currentSite.name,
    title: input.title?.trim() || currentSite.title,
    description: input.description?.trim() || currentSite.description,
    url: normalizedUrl,
    author: input.author?.trim() || currentSite.author,
    language: input.language?.trim() || currentSite.language
  });

  await prisma.siteSetting.upsert({
    where: { key: "site" },
    update: {
      value: JSON.parse(JSON.stringify(nextSite)) as Prisma.InputJsonValue
    },
    create: {
      key: "site",
      value: JSON.parse(JSON.stringify(nextSite)) as Prisma.InputJsonValue
    }
  });

  const existingStudio = await resolveStudioConfig(nextSite);
  const studioInput = input.studio;
  const nextStudio = parseStudioConfig(
    studioInput
      ? {
          ...existingStudio,
          ...studioInput,
          profile: { ...existingStudio.profile, ...(studioInput.profile ?? {}) },
          weekdayPhrases: { ...existingStudio.weekdayPhrases, ...(studioInput.weekdayPhrases ?? {}) },
          metricsFallback: { ...existingStudio.metricsFallback, ...(studioInput.metricsFallback ?? {}) }
        }
      : existingStudio,
    nextSite
  );

  await prisma.siteSetting.upsert({
    where: { key: "studio" },
    update: {
      value: JSON.parse(JSON.stringify(nextStudio)) as Prisma.InputJsonValue
    },
    create: {
      key: "studio",
      value: JSON.parse(JSON.stringify(nextStudio)) as Prisma.InputJsonValue
    }
  });

  const [existingAi, existingImageAi] = await Promise.all([loadAIConfig("ai"), loadAIConfig("ai-image")]);
  const aiInput = input.ai;
  const hasAiInput = Boolean(aiInput);
  const baseUrl = aiInput?.baseUrl.trim() || existingAi?.baseUrl || "https://api.openai.com/v1";
  const model = aiInput?.model.trim() || existingAi?.model || "gpt-4.1-mini";
  const apiKeyInput = aiInput?.apiKey?.trim() ?? "";

  let encryptedApiKey = existingAi?.encryptedApiKey;
  if (apiKeyInput) {
    encryptedApiKey = encryptSecret(apiKeyInput);
  }

  if (hasAiInput) {
    const nextAi: StoredAIConfig = {
      provider: "openai-compatible",
      baseUrl,
      model,
      encryptedApiKey
    };

    await prisma.siteSetting.upsert({
      where: { key: "ai" },
      update: {
        value: JSON.parse(JSON.stringify(nextAi)) as Prisma.InputJsonValue
      },
      create: {
        key: "ai",
        value: JSON.parse(JSON.stringify(nextAi)) as Prisma.InputJsonValue
      }
    });
  }

  const aiImageInput = input.aiImage;
  const hasAiImageInput = Boolean(aiImageInput);
  const imageBaseUrl = aiImageInput?.baseUrl.trim() || existingImageAi?.baseUrl || "https://api.openai.com/v1";
  const imageModel = aiImageInput?.model.trim() || existingImageAi?.model || "gpt-image-1";
  const imageApiKeyInput = aiImageInput?.apiKey?.trim() ?? "";

  let encryptedImageApiKey = existingImageAi?.encryptedApiKey;
  if (imageApiKeyInput) {
    encryptedImageApiKey = encryptSecret(imageApiKeyInput);
  }

  if (hasAiImageInput) {
    const nextImageAi: StoredAIConfig = {
      provider: "openai-compatible",
      baseUrl: imageBaseUrl,
      model: imageModel,
      encryptedApiKey: encryptedImageApiKey
    };

    await prisma.siteSetting.upsert({
      where: { key: "ai-image" },
      update: {
        value: JSON.parse(JSON.stringify(nextImageAi)) as Prisma.InputJsonValue
      },
      create: {
        key: "ai-image",
        value: JSON.parse(JSON.stringify(nextImageAi)) as Prisma.InputJsonValue
      }
    });
  }

  for (const path of ["/", "/blog", "/lab", "/about", "/friends", "/thoughts", "/links", "/photos", "/resume", "/comments", "/rss.xml", "/sitemap.xml", "/robots.txt", "/search"]) {
    revalidatePath(path);
  }

  return {
    site: nextSite,
    studio: nextStudio,
    ai: sanitizeAiStatus(
      {
        provider: "openai-compatible",
        baseUrl,
        model
      },
      Boolean(encryptedApiKey),
      Boolean(baseUrl && model && encryptedApiKey) ? undefined : "AI provider is not fully configured."
    ),
    imageAi: sanitizeAiStatus(
      {
        provider: "openai-compatible",
        baseUrl: imageBaseUrl,
        model: imageModel
      },
      Boolean(encryptedImageApiKey),
      Boolean(imageBaseUrl && imageModel && encryptedImageApiKey) ? undefined : "AI image provider is not fully configured."
    )
  };
}

async function maybeCreateRevision(item: ContentItem, input: StudioContentInput, reason?: string) {
  const lastRevision = await prisma.contentRevision.findFirst({
    where: { contentItemId: item.id },
    orderBy: { createdAt: "desc" }
  });

  const previousBody = lastRevision?.bodyMarkdown ?? "";
  const previousLength = previousBody.length;
  const nextLength = input.bodyMarkdown.length;
  const changeSize = Math.abs(nextLength - previousLength);
  const minutesSinceLastRevision = lastRevision
    ? (Date.now() - new Date(lastRevision.createdAt).getTime()) / (1000 * 60)
    : Number.POSITIVE_INFINITY;

  if (reason || !lastRevision || changeSize > 480 || minutesSinceLastRevision >= 10) {
    await prisma.contentRevision.create({
      data: {
        contentItemId: item.id,
        title: input.title,
        titleEn: input.titleEn ?? null,
        summary: input.summary,
        summaryEn: input.summaryEn ?? null,
        bodyMarkdown: input.bodyMarkdown,
        bodyMarkdownEn: input.bodyMarkdownEn ?? null,
        reason: reason ?? "Autosave snapshot"
      }
    });
  }
}

function studioPathsFor(item: ContentRecord) {
  const publicPath = publicPathFor(item);
  return [
    "/",
    "/blog",
    "/lab",
    "/about",
    "/search",
    `/studio/editor/${item.id}`,
    "/studio/content",
    publicPath,
    `/og/${item.slug}`
  ];
}

function sanitizeSections(sections: PageSectionRecord[]) {
  return sortSections(sections)
    .filter((section) => section.type && section.variant)
    .map((section, index) => ({
      id: section.id || createSectionId(),
      type: section.type,
      variant: section.variant,
      order: index + 1,
      columnSpan: section.columnSpan,
      enabled: section.enabled,
      props: JSON.parse(JSON.stringify(section.props ?? {})) as Record<string, unknown>
    }));
}

export async function saveStudioContent(id: string, input: StudioContentInput, options?: { reason?: string }) {
  if (!hasDatabase()) {
    throw new Error("Studio requires DATABASE_URL.");
  }

  const current = await prisma.contentItem.findUnique({
    where: { id },
    include: {
      tags: true,
      categories: true,
      coverMedia: true,
      author: true,
      pageSections: {
        orderBy: { order: "asc" }
      }
    }
  });

  if (!current) {
    throw new Error("Content not found.");
  }

  const slug = await ensureUniqueSlug(input.slug || input.title, id);
  const readingMinutes = estimateReadingMinutes(input.bodyMarkdown);
  const sections = sanitizeSections(input.sections);

  const saved = await prisma.contentItem.update({
    where: { id },
    data: {
      type: input.type as PrismaContentType,
      status: input.status as PrismaContentStatus,
      title: input.title.trim(),
      titleEn: input.titleEn?.trim() || null,
      slug,
      summary: input.summary.trim(),
      summaryEn: input.summaryEn?.trim() || null,
      bodyMarkdown: input.bodyMarkdown,
      bodyMarkdownEn: input.bodyMarkdownEn?.trim() || null,
      layoutMode: input.layoutMode as PrismaLayoutMode,
      templateKey: input.templateKey as PrismaTemplateKey,
      seoTitle: input.seoTitle?.trim() || null,
      seoTitleEn: input.seoTitleEn?.trim() || null,
      seoDescription: input.seoDescription?.trim() || null,
      seoDescriptionEn: input.seoDescriptionEn?.trim() || null,
      publishedAt: input.publishedAt ? new Date(input.publishedAt) : current.publishedAt,
      scheduledAt: input.scheduledAt ? new Date(input.scheduledAt) : null,
      readingMinutes,
      coverMediaId: input.coverMediaId || null,
      tags: {
        set: [],
        connect: input.tagSlugs.map((tag) => ({ slug: tag }))
      },
      categories: {
        set: [],
        connect: input.categorySlugs.map((category) => ({ slug: category }))
      }
    },
    include: {
      tags: true,
      categories: true,
      coverMedia: true,
      author: true,
      pageSections: {
        orderBy: { order: "asc" }
      }
    }
  });

  await prisma.pageSection.deleteMany({
    where: { contentItemId: id }
  });

  if (sections.length > 0) {
    await prisma.pageSection.createMany({
      data: sections.map((section) => ({
        id: section.id!,
        contentItemId: id,
        type: section.type,
        variant: section.variant,
        order: section.order,
        columnSpan: section.columnSpan,
        enabled: section.enabled,
        props: section.props as Prisma.InputJsonValue
      }))
    });
  }

  await maybeCreateRevision(saved, { ...input, slug, sections }, options?.reason);

  const refreshed = await loadStudioContentById(id);
  if (!refreshed) {
    throw new Error("Content not found after save.");
  }

  for (const path of studioPathsFor(refreshed)) {
    revalidatePath(path);
  }

  return refreshed;
}

export async function publishStudioContent(id: string) {
  const item = await getStudioContent(id);
  if (!item) {
    throw new Error("Content not found.");
  }

  return saveStudioContent(
    id,
    {
      title: item.title,
      titleEn: item.titleEn,
      slug: item.slug,
      summary: item.summary,
      summaryEn: item.summaryEn,
      bodyMarkdown: item.bodyMarkdown,
      bodyMarkdownEn: item.bodyMarkdownEn,
      type: item.type,
      status: "PUBLISHED",
      layoutMode: item.layoutMode,
      templateKey: item.templateKey,
      sections: item.sections,
      seoTitle: item.seoTitle,
      seoTitleEn: item.seoTitleEn,
      seoDescription: item.seoDescription,
      seoDescriptionEn: item.seoDescriptionEn,
      publishedAt: new Date().toISOString(),
      scheduledAt: item.scheduledAt,
      coverMediaId: item.cover?.id,
      tagSlugs: item.tags.map((tag) => tag.slug),
      categorySlugs: item.categories.map((category) => category.slug)
    },
    { reason: "Published from Studio" }
  );
}

export async function moveStudioContentToDraft(id: string) {
  const item = await getStudioContent(id);
  if (!item) {
    throw new Error("Content not found.");
  }

  return saveStudioContent(
    id,
    {
      title: item.title,
      titleEn: item.titleEn,
      slug: item.slug,
      summary: item.summary,
      summaryEn: item.summaryEn,
      bodyMarkdown: item.bodyMarkdown,
      bodyMarkdownEn: item.bodyMarkdownEn,
      type: item.type,
      status: "DRAFT",
      layoutMode: item.layoutMode,
      templateKey: item.templateKey,
      sections: item.sections,
      seoTitle: item.seoTitle,
      seoTitleEn: item.seoTitleEn,
      seoDescription: item.seoDescription,
      seoDescriptionEn: item.seoDescriptionEn,
      publishedAt: item.publishedAt,
      scheduledAt: item.scheduledAt,
      coverMediaId: item.cover?.id,
      tagSlugs: item.tags.map((tag) => tag.slug),
      categorySlugs: item.categories.map((category) => category.slug)
    },
    { reason: "Returned to draft" }
  );
}

export async function listStudioRevisions(contentItemId: string): Promise<StudioRevisionRecord[]> {
  if (!hasDatabase()) {
    throw new Error("Studio requires DATABASE_URL.");
  }

  const revisions = await prisma.contentRevision.findMany({
    where: { contentItemId },
    orderBy: { createdAt: "desc" }
  });

  return revisions.map((revision) => ({
    id: revision.id,
    title: revision.title,
    summary: revision.summary,
    bodyMarkdown: revision.bodyMarkdown,
    reason: revision.reason ?? undefined,
    createdAt: revision.createdAt.toISOString()
  }));
}

export async function restoreStudioRevision(revisionId: string) {
  if (!hasDatabase()) {
    throw new Error("Studio requires DATABASE_URL.");
  }

  const revision = await prisma.contentRevision.findUnique({
    where: { id: revisionId },
    include: {
      contentItem: {
        include: {
          tags: true,
          categories: true,
          coverMedia: true,
          author: true,
          pageSections: {
            orderBy: { order: "asc" }
          }
        }
      }
    }
  });

  if (!revision) {
    throw new Error("Revision not found.");
  }

  await prisma.contentItem.update({
    where: { id: revision.contentItemId },
    data: {
      title: revision.title,
      titleEn: (revision as { titleEn?: string | null }).titleEn ?? null,
      summary: revision.summary,
      summaryEn: (revision as { summaryEn?: string | null }).summaryEn ?? null,
      bodyMarkdown: revision.bodyMarkdown,
      bodyMarkdownEn: (revision as { bodyMarkdownEn?: string | null }).bodyMarkdownEn ?? null,
      readingMinutes: estimateReadingMinutes(revision.bodyMarkdown)
    }
  });

  await prisma.contentRevision.create({
    data: {
      contentItemId: revision.contentItemId,
      title: revision.title,
      titleEn: (revision as { titleEn?: string | null }).titleEn ?? null,
      summary: revision.summary,
      summaryEn: (revision as { summaryEn?: string | null }).summaryEn ?? null,
      bodyMarkdown: revision.bodyMarkdown,
      bodyMarkdownEn: (revision as { bodyMarkdownEn?: string | null }).bodyMarkdownEn ?? null,
      reason: `Restored from ${new Date(revision.createdAt).toLocaleString("zh-CN")}`
    }
  });

  const mapped = mapContentItem(revision.contentItem as ContentWithRelations);
  for (const path of studioPathsFor(mapped)) {
    revalidatePath(path);
  }

  revalidatePath(`/studio/versions/${revision.contentItemId}`);
  return revision.contentItemId;
}

async function resolveAiRuntimeConfig(
  key: "ai" | "ai-image" = "ai",
  missingMessage = "AI provider is not configured yet."
): Promise<{ status: AIProviderStatus; config?: RuntimeAIProviderConfig }> {
  if (!hasDatabase()) {
    return {
      status: sanitizeAiStatus(undefined, false, "Studio requires DATABASE_URL.")
    };
  }

  const stored = await loadAIConfig(key);
  if (!stored) {
    return {
      status: sanitizeAiStatus(undefined, false, missingMessage)
    };
  }

  if (!stored.encryptedApiKey) {
    return {
      status: sanitizeAiStatus(
        {
          provider: "openai-compatible",
          baseUrl: stored.baseUrl,
          model: stored.model
        },
        false,
        "API key is missing."
      )
    };
  }

  try {
    const config = toRuntimeAIConfig(stored);
    return {
      status: sanitizeAiStatus(
        {
          provider: "openai-compatible",
          baseUrl: stored.baseUrl,
          model: stored.model
        },
        true
      ),
      config
    };
  } catch (error) {
    return {
      status: sanitizeAiStatus(
        {
          provider: "openai-compatible",
          baseUrl: stored.baseUrl,
          model: stored.model
        },
        true,
        error instanceof Error ? error.message : "AI key cannot be decrypted."
      )
    };
  }
}

export async function getStudioAIStatus() {
  const { status } = await resolveAiRuntimeConfig();
  return status;
}

export async function getStudioImageAIStatus() {
  const { status } = await resolveAiRuntimeConfig("ai-image", "AI image provider is not configured yet.");
  return status;
}

export async function runStudioAiChat(input: {
  prompt: string;
  locale: "zh-CN" | "en-US";
}): Promise<{ availability: AIProviderStatus; result?: { text: string; model: string; provider: "openai-compatible" } }> {
  const { status, config } = await resolveAiRuntimeConfig();
  if (!status.configured || !config) {
    return { availability: status };
  }

  const result = await aiProvider.runChat(config, {
    prompt: input.prompt,
    locale: input.locale
  });

  return { availability: status, result };
}

export async function runStudioAiAction(input: {
  action: "format" | "translate" | "summarize";
  sourceLocale: "zh-CN" | "en-US";
  targetLocale?: "zh-CN" | "en-US";
  instruction?: string;
  source: {
    title?: string;
    summary?: string;
    bodyMarkdown?: string;
    seoTitle?: string;
    seoDescription?: string;
  };
}): Promise<{ availability: AIProviderStatus; result?: AiActionResult }> {
  const { status, config } = await resolveAiRuntimeConfig();
  if (!status.configured || !config) {
    return { availability: status };
  }

  const result = await aiProvider.runAction(config, {
    action: input.action,
    sourceLocale: input.sourceLocale,
    targetLocale: input.targetLocale,
    instruction: input.instruction ?? "",
    source: {
      title: input.source.title ?? "",
      summary: input.source.summary ?? "",
      bodyMarkdown: input.source.bodyMarkdown ?? "",
      seoTitle: input.source.seoTitle ?? "",
      seoDescription: input.source.seoDescription ?? ""
    },
    preserveStyle: true
  });

  return { availability: status, result };
}

export async function runStudioAiImage(input: {
  prompt: string;
  size?: "1024x1024" | "1536x1024" | "1024x1536";
  model?: string;
}): Promise<{
  availability: AIProviderStatus;
  image?: {
    url: string;
    revisedPrompt?: string;
    provider: "openai-compatible";
    model: string;
  };
}> {
  const { status, config } = await resolveAiRuntimeConfig("ai-image", "AI image provider is not configured yet.");
  if (!status.configured || !config) {
    return { availability: status };
  }

  const trimmedPrompt = input.prompt.trim();
  if (!trimmedPrompt) {
    throw new AIProviderError("Image prompt is required.", "invalid_response");
  }

  const endpoint = `${config.baseUrl.trim().replace(/\/$/, "")}/images/generations`;
  const preferredModel =
    (input.model ?? "").trim() ||
    (config.model.toLowerCase().includes("image") ? config.model : "gpt-image-1");
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${config.apiKey.trim()}`
    },
    body: JSON.stringify({
      model: preferredModel,
      prompt: trimmedPrompt,
      size: input.size ?? "1024x1024"
    })
  }).catch((error) => {
    throw new AIProviderError(error instanceof Error ? error.message : "Image request failed.", "request_failed");
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new AIProviderError(
      `Image request failed with ${response.status}${detail ? `: ${detail.slice(0, 240)}` : ""}`,
      "request_failed"
    );
  }

  const payload = (await response.json()) as {
    data?: Array<{
      url?: string;
      b64_json?: string;
      revised_prompt?: string;
    }>;
  };
  const first = payload.data?.[0];
  const imageUrl = typeof first?.url === "string" && first.url ? first.url : typeof first?.b64_json === "string" && first.b64_json ? `data:image/png;base64,${first.b64_json}` : "";
  if (!imageUrl) {
    throw new AIProviderError("Image response is empty.", "missing_response_payload");
  }

  return {
    availability: status,
    image: {
      url: imageUrl,
      revisedPrompt: first?.revised_prompt,
      provider: "openai-compatible",
      model: preferredModel
    }
  };
}

export function mapAiError(error: unknown) {
  if (error instanceof AIProviderError) {
    return error.message;
  }

  return error instanceof Error ? error.message : "AI request failed.";
}

export async function resolveCanonicalContentUrl(site: SiteRecord, item: ContentRecord) {
  return contentUrl(site, item);
}

export async function resolvePageRouteUrl(site: SiteRecord, path: string) {
  return absoluteUrl(site, path);
}
