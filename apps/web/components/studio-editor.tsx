"use client";

import type { AIProviderStatus, ContentRecord, PageSectionRecord, SiteRecord, TaxonomyRecord } from "@endless/content";
import { PageSections } from "@/components/page-sections";
import { useDeferredValue, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  contentStatusOptions,
  contentTypeOptions,
  layoutModeOptions,
  templateKeyOptions,
  toDatetimeLocal
} from "@/lib/studio";
import { createSection, presetBlueprint, presetSections, toPagePresetKey, type PagePresetKey } from "@/lib/page-presets";
import {
  ArrowLeft,
  ArrowUpRight,
  FilePenLine,
  Eye,
  History,
  Layers3,
  ImagePlus,
  PanelRight,
  PanelRightClose,
  Plus,
  Sparkles,
  GripVertical,
  Copy,
  Trash2,
  ChevronUp,
  ChevronDown,
  X
} from "lucide-react";
import { useStudioLocale } from "./studio-locale";
import { ProseMarkdown } from "./prose-markdown";

type SaveState = "idle" | "saving" | "saved" | "error";
type ViewMode = "split" | "write" | "preview";
type EditorLocale = "zh" | "en";
type AiMode = "format" | "translate" | "summarize";
type AiAvailability = "ready" | "unavailable";
type WorkspaceMode = "md" | "ai";

interface StudioEditorProps {
  item: ContentRecord;
  tags: TaxonomyRecord[];
  categories: TaxonomyRecord[];
  mediaAssets: Array<{
    id: string;
    url: string;
    alt: string;
    mimeType: string;
    key: string;
  }>;
  posts: ContentRecord[];
  projects: ContentRecord[];
  site: SiteRecord;
  aiStatus: AIProviderStatus;
  imageAiStatus: AIProviderStatus;
  initialWorkspace?: WorkspaceMode;
  presetSlug?: string;
}

interface AiApplyFields {
  title?: string;
  summary?: string;
  bodyMarkdown?: string;
  seoTitle?: string;
  seoDescription?: string;
}

interface AiResultPayload {
  action: AiMode;
  previewMarkdown: string;
  previewHtml?: string;
  fields: AiApplyFields;
  targetLocale?: "zh-CN" | "en-US";
}

interface EditorDraft {
  title: string;
  titleEn: string;
  slug: string;
  summary: string;
  summaryEn: string;
  bodyMarkdown: string;
  bodyMarkdownEn: string;
  type: ContentRecord["type"];
  status: ContentRecord["status"];
  layoutMode: ContentRecord["layoutMode"];
  templateKey: ContentRecord["templateKey"];
  sections: PageSectionRecord[];
  seoTitle: string;
  seoTitleEn: string;
  seoDescription: string;
  seoDescriptionEn: string;
  publishedAt: string;
  scheduledAt: string;
  coverMediaId: string;
  tagSlugs: string[];
  categorySlugs: string[];
}

const sectionTypeOptions: Array<{ value: PageSectionRecord["type"]; label: string }> = [
  { value: "hero_statement", label: "Hero" },
  { value: "intro_richtext", label: "Rich text" },
  { value: "feature_grid", label: "Feature grid" },
  { value: "featured_posts", label: "Featured posts" },
  { value: "project_directory", label: "Project directory" },
  { value: "quote_panel", label: "Quote" },
  { value: "link_cluster", label: "Link cluster" },
  { value: "image_story", label: "Image story" },
  { value: "timeline", label: "Timeline" },
  { value: "contact_strip", label: "Contact strip" },
  { value: "custom_html", label: "Custom HTML" }
];

const columnSpanOptions: Array<{ value: PageSectionRecord["columnSpan"]; label: string }> = [
  { value: "full", label: "Full" },
  { value: "wide", label: "Wide" },
  { value: "half", label: "Half" },
  { value: "third", label: "Third" }
];

function sectionTypeLabel(value: PageSectionRecord["type"], locale: "zh" | "en") {
  if (locale === "en") {
    return sectionTypeOptions.find((option) => option.value === value)?.label ?? value;
  }
  const table: Record<PageSectionRecord["type"], string> = {
    hero_statement: "头图区块",
    intro_richtext: "富文本区块",
    feature_grid: "特性网格",
    featured_posts: "精选文章",
    project_directory: "项目目录",
    quote_panel: "引言区块",
    link_cluster: "链接分组",
    image_story: "图文叙事",
    timeline: "时间线",
    contact_strip: "联系区块",
    custom_html: "自定义 HTML"
  };
  return table[value];
}

function columnSpanLabel(value: PageSectionRecord["columnSpan"], locale: "zh" | "en") {
  if (locale === "en") {
    return columnSpanOptions.find((option) => option.value === value)?.label ?? value;
  }
  const table: Record<PageSectionRecord["columnSpan"], string> = {
    full: "全宽",
    wide: "加宽",
    half: "半宽",
    third: "三分之一"
  };
  return table[value];
}

function applyPreset(current: EditorDraft, preset: PagePresetKey): EditorDraft {
  const blueprint = presetBlueprint(preset);
  return {
    ...current,
    type: "PAGE",
    layoutMode: "SECTIONS",
    templateKey: blueprint.templateKey,
    slug: blueprint.slug,
    title: blueprint.title,
    titleEn: blueprint.titleEn,
    summary: blueprint.summary,
    summaryEn: blueprint.summaryEn,
    bodyMarkdown: "",
    bodyMarkdownEn: "",
    sections: presetSections(preset)
  };
}

function toDraft(item: ContentRecord): EditorDraft {
  return {
    title: item.title,
    titleEn: item.titleEn ?? "",
    slug: item.slug,
    summary: item.summary,
    summaryEn: item.summaryEn ?? "",
    bodyMarkdown: item.bodyMarkdown,
    bodyMarkdownEn: item.bodyMarkdownEn ?? "",
    type: item.type,
    status: item.status,
    layoutMode: item.layoutMode,
    templateKey: item.templateKey,
    sections: [...item.sections].sort((a, b) => a.order - b.order),
    seoTitle: item.seoTitle ?? "",
    seoTitleEn: item.seoTitleEn ?? "",
    seoDescription: item.seoDescription ?? "",
    seoDescriptionEn: item.seoDescriptionEn ?? "",
    publishedAt: toDatetimeLocal(item.publishedAt),
    scheduledAt: toDatetimeLocal(item.scheduledAt),
    coverMediaId: item.cover?.id ?? "",
    tagSlugs: item.tags.map((tag) => tag.slug),
    categorySlugs: item.categories.map((category) => category.slug)
  };
}

function serializeDraft(draft: EditorDraft) {
  return JSON.stringify({
    ...draft,
    sections: draft.sections.map((section, index) => ({
      ...section,
      order: index + 1
    }))
  });
}

function savedAtLabel(value: string | null, locale: "zh" | "en") {
  if (!value) {
    return locale === "en" ? "Not saved in this session" : "本次会话尚未保存";
  }

  return new Intl.DateTimeFormat(locale === "en" ? "en-US" : "zh-CN", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit"
  }).format(new Date(value));
}

const aiModeCopy: Record<AiMode, { labelZh: string; labelEn: string; bodyZh: string; bodyEn: string; buttonZh: string; buttonEn: string }> = {
  format: {
    labelZh: "排版",
    labelEn: "Format",
    bodyZh: "整理标题层级、段落间距、列表和引用，让文章结构更适合发布。",
    bodyEn: "Refine heading levels, spacing, lists, and quotes for a publish-ready structure.",
    buttonZh: "生成排版稿",
    buttonEn: "Generate formatted draft"
  },
  translate: {
    labelZh: "翻译",
    labelEn: "Translate",
    bodyZh: "把当前语言版本翻译到另一种语言，保持原文结构和语气。",
    bodyEn: "Translate the current locale version while preserving structure and tone.",
    buttonZh: "翻译并写入另一语言",
    buttonEn: "Translate and fill other locale"
  },
  summarize: {
    labelZh: "总结",
    labelEn: "Summarize",
    bodyZh: "提炼摘要、SEO 标题和描述，并自动写回当前文章的另一侧摘要字段。",
    bodyEn: "Extract summary, SEO title, and SEO description, then write them back into the current article automatically.",
    buttonZh: "总结并写入字段",
    buttonEn: "Summarize and fill fields"
  }
};

function sectionLabel(section: PageSectionRecord) {
  const title =
    typeof section.props.title === "string"
      ? section.props.title
      : typeof section.props.eyebrow === "string"
        ? section.props.eyebrow
        : section.type;

  return title || section.type;
}

function listValue(value: unknown) {
  return Array.isArray(value) ? value : [];
}

function sanitizeControlledHtml(input: string) {
  if (typeof window === "undefined") {
    return input
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  const allowedTags = new Set(["P", "H1", "H2", "H3", "H4", "UL", "OL", "LI", "BLOCKQUOTE", "STRONG", "EM", "CODE", "PRE", "HR", "BR", "SPAN", "A"]);
  const allowedClasses = new Set(["prose-size-sm", "prose-size-md", "prose-size-lg", "prose-muted", "prose-emphasis"]);
  const doc = new DOMParser().parseFromString(`<div>${input}</div>`, "text/html");
  const root = doc.body.firstElementChild;
  if (!root) return "";

  const walker = doc.createTreeWalker(root, NodeFilter.SHOW_ELEMENT);
  const toReplace: Element[] = [];
  while (walker.nextNode()) {
    const node = walker.currentNode as Element;
    if (!allowedTags.has(node.tagName)) {
      toReplace.push(node);
      continue;
    }

    const attrs = Array.from(node.attributes);
    for (const attr of attrs) {
      const name = attr.name.toLowerCase();
      if (
        name === "class" &&
        attr.value
          .split(/\s+/)
          .filter(Boolean)
          .every((entry) => allowedClasses.has(entry))
      ) {
        continue;
      }
      if (node.tagName === "A" && name === "href" && /^(https?:\/\/|mailto:|\/)/i.test(attr.value)) {
        continue;
      }
      node.removeAttribute(attr.name);
    }
  }

  for (const node of toReplace) {
    const text = doc.createTextNode(node.textContent ?? "");
    node.parentNode?.replaceChild(text, node);
  }

  return root.innerHTML;
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function renderHighlightedMarkdown(current: string, next: string) {
  const currentLines = current.replace(/\r\n/g, "\n").split("\n");
  const nextLines = next.replace(/\r\n/g, "\n").split("\n");
  return nextLines
    .map((line, index) => {
      const safeLine = escapeHtml(line || " ");
      return (currentLines[index] ?? "") !== line ? `<mark>${safeLine}</mark>` : safeLine;
    })
    .join("<br />");
}

function countChangedLines(current: string, next: string) {
  const currentLines = current.replace(/\r\n/g, "\n").split("\n");
  const nextLines = next.replace(/\r\n/g, "\n").split("\n");
  return nextLines.reduce((count, line, index) => count + ((currentLines[index] ?? "") !== line ? 1 : 0), 0);
}

function renderAiPreviewBlock(
  localeText: (zh: string, en: string) => string,
  aiResult: AiResultPayload | null,
  currentMarkdown: string
) {
  if (!aiResult) {
    return null;
  }

  if (aiResult.action === "format" && (aiResult.previewMarkdown || aiResult.previewHtml)) {
    const formattedMarkdown = aiResult.fields.bodyMarkdown ?? aiResult.previewMarkdown;
    const changedLines = countChangedLines(currentMarkdown, formattedMarkdown);
    return (
      <div className="studio-note prose-endless max-w-none">
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <p className="meta">{localeText("AI 排版结果（高亮改动预览）", "AI layout result (highlighted changes)")}</p>
          <span className="rounded-full border border-emerald-500/25 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-medium text-emerald-700 dark:text-emerald-300">
            {localeText(`高亮 ${changedLines} 行改动`, `${changedLines} changed lines highlighted`)}
          </span>
        </div>
        <div
          className="studio-ai-highlight-preview"
          dangerouslySetInnerHTML={{
            __html: renderHighlightedMarkdown(currentMarkdown, formattedMarkdown)
          }}
        />
        {aiResult.previewHtml ? (
          <div className="mt-4 rounded-[1.25rem] border border-border/80 bg-background/80 p-4">
            <p className="meta mb-2">{localeText("排版后成品预览", "Formatted preview")}</p>
            <div className="prose-endless max-w-none" dangerouslySetInnerHTML={{ __html: sanitizeControlledHtml(aiResult.previewHtml) }} />
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <div className="studio-note text-sm leading-7">
      <ProseMarkdown markdown={aiResult.previewMarkdown} />
    </div>
  );
}

function resolveSpecialFeedSectionIndex(sections: PageSectionRecord[], slug: "thoughts" | "comments") {
  const expectedId = `${slug}-feed`;
  const directIdIndex = sections.findIndex((section) => section.id === expectedId);
  if (directIdIndex >= 0) {
    return directIdIndex;
  }

  return sections.findIndex((section) => {
    if (
      section.type !== "feature_grid" ||
      !["friend-cards", "thought-stream", "comment-stream"].includes(section.variant)
    ) {
      return false;
    }

    const titleZh = typeof section.props.titleZh === "string" ? section.props.titleZh : "";
    const titleEn = typeof section.props.titleEn === "string" ? section.props.titleEn : "";
    if (slug === "thoughts") {
      return titleZh.includes("朋友圈") || titleEn.toLowerCase().includes("thought");
    }
    return titleZh.includes("评论") || titleEn.toLowerCase().includes("comment");
  });
}

export function StudioEditor({
  item,
  tags,
  categories,
  mediaAssets,
  posts,
  projects,
  site,
  aiStatus,
  imageAiStatus,
  initialWorkspace = "md",
  presetSlug
}: StudioEditorProps) {
  const router = useRouter();
  const { locale: studioLocale, t: tx } = useStudioLocale();
  const contentTypeLabel = (value: string) => {
    if (value === "PAGE") return tx("页面", "Page");
    if (value === "DOC") return tx("文档", "Doc");
    if (value === "PROJECT") return tx("项目", "Project");
    return tx("文章", "Post");
  };
  const contentStatusLabel = (value: string) => {
    if (value === "PUBLISHED") return tx("已发布", "Published");
    if (value === "SCHEDULED") return tx("定时发布", "Scheduled");
    if (value === "ARCHIVED") return tx("已归档", "Archived");
    return tx("草稿", "Draft");
  };
  const layoutModeLabel = (value: string) => {
    if (value === "SECTIONS") return tx("区块", "Sections");
    if (value === "HYBRID") return tx("混合", "Hybrid");
    return "Markdown";
  };
  const templateLabel = (value: string) => {
    if (value === "HOME") return tx("首页", "Home");
    if (value === "ABOUT") return tx("关于", "About");
    if (value === "LAB") return tx("实验室", "Lab");
    if (value === "LANDING") return tx("落地页", "Landing");
    return tx("默认", "Default");
  };
  const [draft, setDraft] = useState<EditorDraft>(() => toDraft(item));
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(item.updatedAt ?? null);
  const [viewMode, setViewMode] = useState<ViewMode>("split");
  const [workspaceMode, setWorkspaceMode] = useState<WorkspaceMode>(initialWorkspace);
  const [asideOpen, setAsideOpen] = useState(false);
  const [selectedSectionId, setSelectedSectionId] = useState<string | undefined>(item.sections[0]?.id);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [editorLocale, setEditorLocale] = useState<EditorLocale>(studioLocale === "en" ? "en" : "zh");
  const [aiMode, setAiMode] = useState<AiMode>("format");
  const [aiInstruction, setAiInstruction] = useState("整理排版结构，保留原文语气。");
  const [aiResult, setAiResult] = useState<AiResultPayload | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiHint, setAiHint] = useState<string | null>(null);
  const [aiBusy, setAiBusy] = useState(false);
  const [imageDialogOpen, setImageDialogOpen] = useState(false);
  const [imagePrompt, setImagePrompt] = useState("写一张适合文章封面的插图，构图简洁，留有呼吸感。");
  const [imageSize, setImageSize] = useState<"1024x1024" | "1536x1024" | "1024x1536">("1536x1024");
  const [imageBusy, setImageBusy] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);
  const [imageResult, setImageResult] = useState<{ url: string; revisedPrompt?: string } | null>(null);
  const [pageTextMode, setPageTextMode] = useState(false);
  const [sectionsJson, setSectionsJson] = useState("");
  const [sectionsJsonError, setSectionsJsonError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const hydratedRef = useRef(false);
  const presetAppliedRef = useRef<string | null>(null);
  const savedSnapshotRef = useRef(serializeDraft(toDraft(item)));
  const draftRef = useRef(draft);
  const previewMarkdown = useDeferredValue(draft.bodyMarkdown);
  const previewMarkdownEn = useDeferredValue(draft.bodyMarkdownEn);
  const activeTitle = editorLocale === "zh" ? draft.title : draft.titleEn;
  const activeSummary = editorLocale === "zh" ? draft.summary : draft.summaryEn;
  const activeMarkdown = editorLocale === "zh" ? draft.bodyMarkdown : draft.bodyMarkdownEn;
  const activeSeoTitle = editorLocale === "zh" ? draft.seoTitle : draft.seoTitleEn;
  const activeSeoDescription = editorLocale === "zh" ? draft.seoDescription : draft.seoDescriptionEn;
  const activePreviewMarkdown = editorLocale === "zh" ? previewMarkdown : previewMarkdownEn;
  const activeStoredMarkdown = editorLocale === "zh" ? draft.bodyMarkdown : draft.bodyMarkdownEn;
  const isHomePage = draft.templateKey === "HOME" || draft.slug === "home";
  const [thoughtZhInput, setThoughtZhInput] = useState("");
  const [thoughtEnInput, setThoughtEnInput] = useState("");
  const [commentAuthorInput, setCommentAuthorInput] = useState("");
  const [commentZhInput, setCommentZhInput] = useState("");
  const [commentStatusInput, setCommentStatusInput] = useState("pending");
  const presetKey = useMemo(() => toPagePresetKey(presetSlug), [presetSlug]);
  const draftSnapshot = useMemo(() => serializeDraft(draft), [draft]);
  const isDirty = hydratedRef.current && draftSnapshot !== savedSnapshotRef.current;

  useEffect(() => {
    draftRef.current = draft;
  }, [draft]);

  useEffect(() => {
    const nextDraft = toDraft(item);
    presetAppliedRef.current = null;
    savedSnapshotRef.current = serializeDraft(nextDraft);
    draftRef.current = nextDraft;
    hydratedRef.current = true;
    setDraft(nextDraft);
    setSelectedSectionId(item.sections[0]?.id);
    setWorkspaceMode(initialWorkspace);
    setAsideOpen(false);
    setLastSavedAt(item.updatedAt ?? null);
    setSaveState("saved");
    setImageDialogOpen(false);
    setImageResult(null);
    setImageError(null);
  }, [item, initialWorkspace]);

  useEffect(() => {
    setEditorLocale(studioLocale === "en" ? "en" : "zh");
  }, [item.id, studioLocale]);

  useEffect(() => {
    if (!isHomePage) {
      return;
    }

    setDraft((current) => {
      if (current.title === site.title && current.titleEn === site.title) {
        return current;
      }

      return {
        ...current,
        title: site.title,
        titleEn: site.title
      };
    });
  }, [isHomePage, site.title]);

  useEffect(() => {
    if (!presetKey || item.type !== "PAGE") {
      return;
    }

    const mark = `${item.id}:${presetKey}`;
    if (presetAppliedRef.current === mark) {
      return;
    }

    setDraft((current) => {
      const looksUntouched =
        current.slug.startsWith("untitled-") &&
        current.title.toLowerCase() === "untitled" &&
        current.sections.length <= 1;
      if (!looksUntouched) {
        return current;
      }
      const next = applyPreset(current, presetKey);
      setSelectedSectionId(next.sections[0]?.id);
      return next;
    });
    presetAppliedRef.current = mark;
  }, [item.id, item.type, presetKey]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const explicit = params.get("workspace");
    const stored = window.localStorage.getItem(`endless-studio-workspace:${item.id}`);
    const next =
      explicit === "ai" || explicit === "md"
        ? explicit
        : stored === "ai" || stored === "md"
          ? stored
          : initialWorkspace;
    setWorkspaceMode(next);
  }, [item.id, initialWorkspace]);

  useEffect(() => {
    window.localStorage.setItem(`endless-studio-workspace:${item.id}`, workspaceMode);
  }, [item.id, workspaceMode]);

  useEffect(() => {
    if (!hydratedRef.current || draftSnapshot === savedSnapshotRef.current) {
      return;
    }

    setSaveState("idle");
    const timeout = window.setTimeout(async () => {
      setSaveState("saving");
      try {
        const response = await fetch(`/api/studio/content/${item.id}`, {
          method: "PATCH",
          headers: {
            "content-type": "application/json"
          },
          body: JSON.stringify({ ...draft })
        });

        if (!response.ok) {
          throw new Error("Autosave failed");
        }

        if (serializeDraft(draftRef.current) === draftSnapshot) {
          savedSnapshotRef.current = draftSnapshot;
          setLastSavedAt(new Date().toISOString());
          setSaveState("saved");
        }
      } catch (error) {
        console.error(error);
        setSaveState("error");
      }
    }, 1800);

    return () => window.clearTimeout(timeout);
  }, [draft, draftSnapshot, item.id]);

  useEffect(() => {
    const warnBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!isDirty && saveState !== "saving") {
        return;
      }

      event.preventDefault();
      event.returnValue = "";
    };

    window.addEventListener("beforeunload", warnBeforeUnload);
    return () => window.removeEventListener("beforeunload", warnBeforeUnload);
  }, [isDirty, saveState, tx]);

  useEffect(() => {
    const warnBeforeNavigation = (event: MouseEvent) => {
      if (!isDirty && saveState !== "saving") {
        return;
      }

      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) {
        return;
      }

      const target = event.target instanceof Element ? event.target.closest<HTMLAnchorElement>("a[href]") : null;
      if (!target || target.target === "_blank" || target.hasAttribute("download")) {
        return;
      }

      const href = target.getAttribute("href") ?? "";
      if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:")) {
        return;
      }

      if (!window.confirm(tx("还有未保存的更改或保存仍在进行，确定离开当前编辑页吗？", "You still have unsaved changes or an active save in progress. Leave this editor anyway?"))) {
        event.preventDefault();
        event.stopPropagation();
      }
    };

    document.addEventListener("click", warnBeforeNavigation, true);
    return () => document.removeEventListener("click", warnBeforeNavigation, true);
  }, [isDirty, saveState, tx]);

  const selectedSection = useMemo(
    () => draft.sections.find((section) => section.id === selectedSectionId) ?? draft.sections[0],
    [draft.sections, selectedSectionId]
  );

  const isSectionDriven = draft.type === "PAGE" || draft.layoutMode !== "MARKDOWN";
  const isThoughtsPage = draft.type === "PAGE" && draft.slug.trim().toLowerCase() === "thoughts";
  const isCommentsPage = draft.type === "PAGE" && draft.slug.trim().toLowerCase() === "comments";
  const aiAvailability: AiAvailability = aiStatus.configured ? "ready" : "unavailable";
  const imageAiAvailability: AiAvailability = imageAiStatus.configured ? "ready" : "unavailable";

  const thoughtsSectionIndex = useMemo(
    () => resolveSpecialFeedSectionIndex(draft.sections, "thoughts"),
    [draft.sections]
  );
  const commentsSectionIndex = useMemo(
    () => resolveSpecialFeedSectionIndex(draft.sections, "comments"),
    [draft.sections]
  );

  const thoughtsItems = useMemo(() => {
    if (thoughtsSectionIndex < 0) return [] as Array<Record<string, string>>;
    const section = draft.sections[thoughtsSectionIndex];
    const raw = Array.isArray(section?.props?.items) ? section.props.items : [];
    return raw.filter((item): item is Record<string, string> => typeof item === "object" && item !== null) as Array<Record<string, string>>;
  }, [draft.sections, thoughtsSectionIndex]);
  const commentsItems = useMemo(() => {
    if (commentsSectionIndex < 0) return [] as Array<Record<string, string>>;
    const section = draft.sections[commentsSectionIndex];
    const raw = Array.isArray(section?.props?.items) ? section.props.items : [];
    return raw.filter((item): item is Record<string, string> => typeof item === "object" && item !== null) as Array<Record<string, string>>;
  }, [draft.sections, commentsSectionIndex]);

  async function saveNow(reason: string, draftOverride?: EditorDraft) {
    const payload = draftOverride ?? draft;
    setSaveState("saving");
    try {
      const response = await fetch(`/api/studio/content/${item.id}`, {
        method: "PATCH",
        headers: {
          "content-type": "application/json"
        },
        body: JSON.stringify({ ...payload, reason })
      });

      if (!response.ok) {
        throw new Error("Save failed");
      }

      const data = (await response.json()) as { item: ContentRecord };
      const nextDraft = toDraft(data.item);
      savedSnapshotRef.current = serializeDraft(nextDraft);
      setDraft(nextDraft);
      setLastSavedAt(data.item.updatedAt ?? new Date().toISOString());
      setSaveState("saved");
      startTransition(() => router.refresh());
      return data.item;
    } catch (error) {
      console.error(error);
      setSaveState("error");
      return undefined;
    }
  }

  async function publish() {
    setSaveState("saving");
    try {
      const saved = await saveNow("Manual save before publish");
      if (!saved) {
        throw new Error(tx("发布前保存失败。", "Save before publish failed."));
      }
      const response = await fetch(`/api/studio/content/${item.id}/publish`, { method: "POST" });
      if (!response.ok) {
        throw new Error(tx("发布失败。", "Publish failed."));
      }
      const data = (await response.json()) as { item: ContentRecord };
      const nextDraft = toDraft(data.item);
      savedSnapshotRef.current = serializeDraft(nextDraft);
      setDraft(nextDraft);
      setLastSavedAt(data.item.updatedAt ?? new Date().toISOString());
      setSaveState("saved");
      startTransition(() => router.refresh());
    } catch (error) {
      console.error(error);
      setSaveState("error");
    }
  }

  async function moveToDraft() {
    try {
      const response = await fetch(`/api/studio/content/${item.id}/draft`, { method: "POST" });
      if (!response.ok) {
        throw new Error(tx("切换为草稿失败。", "Draft transition failed."));
      }
      const data = (await response.json()) as { item: ContentRecord };
      const nextDraft = toDraft(data.item);
      savedSnapshotRef.current = serializeDraft(nextDraft);
      setDraft(nextDraft);
      setLastSavedAt(data.item.updatedAt ?? new Date().toISOString());
      setSaveState("saved");
      startTransition(() => router.refresh());
    } catch (error) {
      console.error(error);
    }
  }

  async function askAi(nextMode?: AiMode, options?: { autoApply?: boolean }) {
    const runMode = nextMode ?? aiMode;
    const shouldAutoApply = options?.autoApply ?? runMode !== "format";
    if (aiAvailability !== "ready") {
      setAiError(aiStatus.message ?? tx("AI 服务尚未配置。", "AI provider is not configured."));
      return;
    }

    setAiBusy(true);
    setAiError(null);
    setAiHint(tx("AI 正在生成结果…", "AI is generating the result..."));
    try {
      const response = await fetch(runMode === "translate" ? "/api/studio/ai/translate" : "/api/studio/ai/suggest", {
        method: "POST",
        headers: {
          "content-type": "application/json"
        },
        body: JSON.stringify(
          runMode === "translate"
            ? {
                sourceLocale: editorLocale === "zh" ? "zh-CN" : "en-US",
                targetLocale: editorLocale === "zh" ? "en-US" : "zh-CN",
                instruction: aiInstruction,
                source: {
                  title: activeTitle,
                  summary: activeSummary,
                  bodyMarkdown: activeMarkdown,
                  seoTitle: activeSeoTitle,
                  seoDescription: activeSeoDescription
                }
              }
            : {
                action: runMode,
                sourceLocale: editorLocale === "zh" ? "zh-CN" : "en-US",
                instruction: aiInstruction,
                source: {
                  title: activeTitle,
                  summary: activeSummary,
                  bodyMarkdown: activeMarkdown,
                  seoTitle: activeSeoTitle,
                  seoDescription: activeSeoDescription
                }
              }
        )
      });

      if (!response.ok) {
        throw new Error(tx("AI 请求失败。", "AI request failed."));
      }

      const data = (await response.json()) as {
        availability: AIProviderStatus;
        result?: {
          action: AiMode;
          previewMarkdown: string;
          previewHtml?: string;
          fields: AiApplyFields;
          targetLocale?: "zh-CN" | "en-US";
        };
      };

      if (!data.availability?.configured) {
        setAiResult(null);
        setAiError(data.availability?.message ?? tx("AI 服务当前不可用。", "AI provider is unavailable."));
        return;
      }

      if (!data.result) {
        setAiResult(null);
        setAiError(tx("AI 没有返回可用结果。", "AI did not return a usable result."));
        return;
      }

      const nextResult: AiResultPayload = {
        action: data.result.action,
        previewMarkdown: data.result.previewMarkdown,
        previewHtml: data.result.previewHtml,
        fields: data.result.fields ?? {},
        targetLocale: data.result.targetLocale
      };

      if (shouldAutoApply && (runMode === "translate" || runMode === "summarize")) {
        const saved = await applyAiPayload(nextResult);
        if (saved) {
          setAiResult(null);
          setAiHint(
            runMode === "translate"
              ? tx("翻译结果已自动填入另一种语言并保存。", "Translation filled the other locale automatically and was saved.")
              : tx("总结结果已自动填入摘要与 SEO 并保存。", "Summary filled summary and SEO fields automatically and was saved.")
          );
        }
        return;
      }

      setAiResult(nextResult);
      setAiHint(
        runMode === "format"
          ? tx("AI 排版结果已生成，已高亮显示改动内容。", "AI formatting result is ready and changed lines are highlighted.")
          : tx("AI 结果已生成，可直接应用或复制。", "AI result is ready. You can apply or copy it.")
      );
    } catch (error) {
      console.error(error);
      setAiResult(null);
      setAiError(error instanceof Error ? error.message : tx("AI 请求失败。", "AI request failed."));
    } finally {
      setAiBusy(false);
    }
  }

  async function quickTranslate() {
    setAiMode("translate");
    await askAi("translate", { autoApply: true });
  }

  async function quickSummarize() {
    setAiMode("summarize");
    await askAi("summarize", { autoApply: true });
  }

  function appendToActiveBody(snippet: string) {
    setDraft((current) => {
      const existing = editorLocale === "zh" ? current.bodyMarkdown : current.bodyMarkdownEn;
      const nextValue = existing.trim().length ? `${existing.replace(/\s*$/, "\n\n")}${snippet}` : snippet;
      if (editorLocale === "zh") {
        return {
          ...current,
          bodyMarkdown: nextValue
        };
      }
      return {
        ...current,
        bodyMarkdownEn: nextValue
      };
    });
  }

  async function generateAiImage() {
    if (imageAiAvailability !== "ready") {
      setImageError(imageAiStatus.message ?? tx("AI 生图服务当前不可用。", "AI image provider is unavailable."));
      return;
    }
    if (!imagePrompt.trim()) {
      setImageError(tx("请先输入图片描述。", "Please enter an image prompt first."));
      return;
    }

    setImageBusy(true);
    setImageError(null);
    try {
      const response = await fetch("/api/studio/ai/image", {
        method: "POST",
        headers: {
          "content-type": "application/json"
        },
        body: JSON.stringify({
          prompt: imagePrompt,
          size: imageSize
        })
      });
      const data = (await response.json()) as {
        availability?: AIProviderStatus;
        image?: {
          url: string;
          revisedPrompt?: string;
        };
        error?: string;
      };
      if (!response.ok) {
        throw new Error(data.error || tx("图片生成失败。", "Image generation failed."));
      }
      if (!data.availability?.configured) {
        throw new Error(data.availability?.message || tx("AI 服务当前不可用。", "AI provider is unavailable."));
      }
      if (!data.image?.url) {
        throw new Error(tx("AI 图片结果为空。", "AI image result is empty."));
      }
      setImageResult({
        url: data.image.url,
        revisedPrompt: data.image.revisedPrompt
      });
    } catch (error) {
      console.error(error);
      setImageResult(null);
      setImageError(error instanceof Error ? error.message : tx("图片生成失败。", "Image generation failed."));
    } finally {
      setImageBusy(false);
    }
  }

  async function applyAiPayload(result: AiResultPayload) {
    if (!result) {
      return;
    }

    const nextDraft: EditorDraft = { ...draft };
    const fields = result.fields;

    if (result.action === "translate") {
      const target = result.targetLocale === "zh-CN" ? "zh" : "en";
      if (target === "zh") {
        nextDraft.title = fields.title ?? nextDraft.title;
        nextDraft.summary = fields.summary ?? nextDraft.summary;
        nextDraft.bodyMarkdown = fields.bodyMarkdown ?? nextDraft.bodyMarkdown;
        nextDraft.seoTitle = fields.seoTitle ?? nextDraft.seoTitle;
        nextDraft.seoDescription = fields.seoDescription ?? nextDraft.seoDescription;
      } else {
        nextDraft.titleEn = fields.title ?? nextDraft.titleEn;
        nextDraft.summaryEn = fields.summary ?? nextDraft.summaryEn;
        nextDraft.bodyMarkdownEn = fields.bodyMarkdown ?? nextDraft.bodyMarkdownEn;
        nextDraft.seoTitleEn = fields.seoTitle ?? nextDraft.seoTitleEn;
        nextDraft.seoDescriptionEn = fields.seoDescription ?? nextDraft.seoDescriptionEn;
      }
    } else if (result.action === "summarize") {
      if (editorLocale === "zh") {
        nextDraft.summary = fields.summary ?? nextDraft.summary;
        nextDraft.seoTitle = fields.seoTitle ?? nextDraft.seoTitle;
        nextDraft.seoDescription = fields.seoDescription ?? nextDraft.seoDescription;
      } else {
        nextDraft.summaryEn = fields.summary ?? nextDraft.summaryEn;
        nextDraft.seoTitleEn = fields.seoTitle ?? nextDraft.seoTitleEn;
        nextDraft.seoDescriptionEn = fields.seoDescription ?? nextDraft.seoDescriptionEn;
      }
    } else {
      const formattedBody = fields.bodyMarkdown ?? result.previewMarkdown;
      if (editorLocale === "zh") {
        nextDraft.bodyMarkdown = formattedBody || nextDraft.bodyMarkdown;
      } else {
        nextDraft.bodyMarkdownEn = formattedBody || nextDraft.bodyMarkdownEn;
      }
    }

    const saved = await saveNow(
      result.action === "translate" ? "Applied AI translation result" : result.action === "summarize" ? "Applied AI summary result" : "Applied AI formatting result",
      nextDraft
    );

    if (saved) {
      if (result.action === "translate") {
        setEditorLocale(result.targetLocale === "zh-CN" ? "zh" : "en");
      }
      setAiError(null);
      setAiHint(tx("已应用 AI 结果并保存。", "AI result applied and saved."));
    }
    return saved;
  }

  async function applyAiResult() {
    if (!aiResult) {
      return;
    }
    await applyAiPayload(aiResult);
  }

  async function copyAiResult() {
    if (!aiResult?.previewMarkdown) return;
    try {
      await navigator.clipboard.writeText(aiResult.previewMarkdown);
      setAiHint(tx("AI 结果已复制到剪贴板。", "AI result copied to clipboard."));
    } catch {
      setAiHint(tx("复制失败，请手动复制。", "Copy failed. Please copy manually."));
    }
  }

  function toggleChoice(value: string, list: string[], setter: (next: string[]) => void) {
    setter(list.includes(value) ? list.filter((entry) => entry !== value) : [...list, value]);
  }

  function updateSection(sectionId: string, updater: (section: PageSectionRecord) => PageSectionRecord) {
    setDraft((current) => ({
      ...current,
      sections: current.sections.map((section) => (section.id === sectionId ? updater(section) : section))
    }));
  }

  function addSection(type: PageSectionRecord["type"]) {
    setDraft((current) => {
      const next = [...current.sections, createSection(type, current.sections.length + 1)].map((section, index) => ({
        ...section,
        order: index + 1
      }));
      const created = next[next.length - 1];
      if (created?.id) {
        setSelectedSectionId(created.id);
      }
      return { ...current, sections: next };
    });
  }

  function duplicateSection(sectionId: string) {
    setDraft((current) => {
      const index = current.sections.findIndex((section) => section.id === sectionId);
      if (index < 0) {
        return current;
      }

      const source = current.sections[index];
      if (!source) {
        return current;
      }
      const copy: PageSectionRecord = {
        ...source,
        id: `section-${Math.random().toString(36).slice(2, 10)}`,
        order: source.order + 1,
        props: JSON.parse(JSON.stringify(source.props)) as Record<string, unknown>
      };
      const next = [...current.sections];
      next.splice(index + 1, 0, copy);
      const ordered = next.map((section, order) => ({ ...section, order: order + 1 }));
      setSelectedSectionId(copy.id);
      return { ...current, sections: ordered };
    });
  }

  function removeSection(sectionId: string) {
    setDraft((current) => {
      const next = current.sections.filter((section) => section.id !== sectionId).map((section, index) => ({ ...section, order: index + 1 }));
      setSelectedSectionId(next[0]?.id);
      return { ...current, sections: next };
    });
  }

  function moveSection(sectionId: string, direction: -1 | 1) {
    setDraft((current) => {
      const index = current.sections.findIndex((section) => section.id === sectionId);
      const nextIndex = index + direction;
      if (index < 0 || nextIndex < 0 || nextIndex >= current.sections.length) {
        return current;
      }

      const next = [...current.sections];
      const [section] = next.splice(index, 1);
      if (!section) {
        return current;
      }
      next.splice(nextIndex, 0, section);
      return {
        ...current,
        sections: next.map((entry, order) => ({ ...entry, order: order + 1 }))
      };
    });
  }

  function replaceArrayField(
    sectionId: string,
    key: string,
    nextItems: Array<Record<string, unknown>>
  ) {
    updateSection(sectionId, (section) => ({
      ...section,
      props: {
        ...section.props,
        [key]: nextItems
      }
    }));
  }

  function handleDrop(targetId: string) {
    if (!draggingId || draggingId === targetId) {
      return;
    }

    setDraft((current) => {
      const sourceIndex = current.sections.findIndex((section) => section.id === draggingId);
      const targetIndex = current.sections.findIndex((section) => section.id === targetId);
      if (sourceIndex < 0 || targetIndex < 0) {
        return current;
      }

      const next = [...current.sections];
      const [dragged] = next.splice(sourceIndex, 1);
      if (!dragged) {
        return current;
      }
      next.splice(targetIndex, 0, dragged);
      return {
        ...current,
        sections: next.map((section, index) => ({ ...section, order: index + 1 }))
      };
    });

    setDraggingId(null);
  }

  function updateThoughtItems(nextItems: Array<Record<string, string>>) {
    if (thoughtsSectionIndex < 0) return;
    setDraft((current) => {
      const nextSections = [...current.sections];
      const target = nextSections[thoughtsSectionIndex];
      if (!target) return current;
      nextSections[thoughtsSectionIndex] = {
        ...target,
        props: {
          ...target.props,
          items: nextItems
        }
      };
      return {
        ...current,
        sections: nextSections
      };
    });
  }

  function addThoughtItem() {
    const zh = thoughtZhInput.trim();
    const en = thoughtEnInput.trim();
    if (!zh && !en) return;
    const stamp = new Date().toISOString();
    updateThoughtItems([
      {
        titleZh: zh || en,
        titleEn: en || zh,
        descriptionZh: zh,
        descriptionEn: en,
        metaZh: new Intl.DateTimeFormat("zh-CN", { dateStyle: "medium", timeStyle: "short" }).format(new Date(stamp)),
        metaEn: new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short" }).format(new Date(stamp))
      },
      ...thoughtsItems
    ]);
    setThoughtZhInput("");
    setThoughtEnInput("");
  }

  function updateThoughtItem(index: number, patch: Record<string, string>) {
    updateThoughtItems(thoughtsItems.map((entry, entryIndex) => (entryIndex === index ? { ...entry, ...patch } : entry)));
  }

  function removeThoughtItem(index: number) {
    updateThoughtItems(thoughtsItems.filter((_, entryIndex) => entryIndex !== index));
  }

  function updateCommentItems(nextItems: Array<Record<string, string>>) {
    if (commentsSectionIndex < 0) return;
    setDraft((current) => {
      const nextSections = [...current.sections];
      const target = nextSections[commentsSectionIndex];
      if (!target) return current;
      nextSections[commentsSectionIndex] = {
        ...target,
        props: {
          ...target.props,
          items: nextItems
        }
      };
      return {
        ...current,
        sections: nextSections
      };
    });
  }

  function addCommentItem() {
    const author = commentAuthorInput.trim() || tx("访客", "Visitor");
    const content = commentZhInput.trim();
    if (!content) return;
    const statusText = commentStatusInput === "approved" ? tx("已通过", "Approved") : commentStatusInput === "hidden" ? tx("已隐藏", "Hidden") : tx("待审核", "Pending");
    const stamp = new Date();
    updateCommentItems([
      {
        titleZh: author,
        titleEn: author,
        descriptionZh: content,
        descriptionEn: content,
        metaZh: `${statusText} · ${new Intl.DateTimeFormat("zh-CN", { dateStyle: "medium", timeStyle: "short" }).format(stamp)}`,
        metaEn: `${statusText} · ${new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short" }).format(stamp)}`
      },
      ...commentsItems
    ]);
    setCommentAuthorInput("");
    setCommentZhInput("");
    setCommentStatusInput("pending");
  }

  function updateCommentItem(index: number, patch: Record<string, string>) {
    updateCommentItems(commentsItems.map((entry, entryIndex) => (entryIndex === index ? { ...entry, ...patch } : entry)));
  }

  function removeCommentItem(index: number) {
    updateCommentItems(commentsItems.filter((_, entryIndex) => entryIndex !== index));
  }

  function openPageTextMode() {
    setSectionsJson(JSON.stringify(draft.sections, null, 2));
    setSectionsJsonError(null);
    setPageTextMode(true);
  }

  function selectSectionByVariant(variant: string) {
    const match = draft.sections.find((section) => section.variant === variant);
    if (match?.id) {
      setSelectedSectionId(match.id);
    }
  }

  function applySectionsJson() {
    try {
      const parsed = JSON.parse(sectionsJson);
      if (!Array.isArray(parsed)) {
        throw new Error(tx("区块 JSON 必须是数组。", "Sections JSON must be an array."));
      }
      const normalized = parsed
        .filter((entry): entry is PageSectionRecord => typeof entry === "object" && entry !== null)
        .map((section, index) => ({
          ...section,
          id: typeof section.id === "string" && section.id ? section.id : `section-${Math.random().toString(36).slice(2, 10)}`,
          order: index + 1,
          enabled: section.enabled !== false
        }));
      setDraft((current) => ({ ...current, sections: normalized }));
      setSelectedSectionId(normalized[0]?.id);
      setPageTextMode(false);
      setSectionsJsonError(null);
    } catch (error) {
      setSectionsJsonError(error instanceof Error ? error.message : tx("JSON 解析失败。", "JSON parse failed."));
    }
  }

  return (
    <div
      className={`studio-editor-shell ${isSectionDriven ? "is-builder" : workspaceMode === "ai" ? "is-natural" : "is-markdown"} ${
        isSectionDriven || asideOpen ? "aside-open" : "aside-collapsed"
      }`}
    >
      <div className="studio-editor-pane">
        <div className="studio-editor-topbar">
          <div className="studio-editor-left-tools">
            <Link href={isSectionDriven ? "/studio/pages" : "/studio/writing"} className="studio-icon-link" aria-label={tx("返回", "Back")}>
              <ArrowLeft aria-hidden className="h-4 w-4" />
            </Link>
            <span className="studio-editor-context">
              {isSectionDriven ? <Layers3 aria-hidden className="h-4 w-4" /> : <FilePenLine aria-hidden className="h-4 w-4" />}
              {isSectionDriven ? tx("页面构建", "Page builder") : workspaceMode === "ai" ? tx("AI 写作台", "AI workbench") : tx("Markdown 写作台", "Markdown workbench")}
            </span>
            {!isSectionDriven ? (
              <div className="studio-pill-toggle text-xs">
                <button type="button" onClick={() => setWorkspaceMode("md")} className={`studio-pill-option ${workspaceMode === "md" ? "is-active" : ""}`}>
                  MD
                </button>
                <button type="button" onClick={() => setWorkspaceMode("ai")} className={`studio-pill-option ${workspaceMode === "ai" ? "is-active" : ""}`}>
                  AI
                </button>
              </div>
            ) : null}
          </div>
          <div className="studio-editor-right-tools">
            {isSectionDriven ? (
              <div className="studio-pill-toggle text-xs">
                {(["zh", "en"] as EditorLocale[]).map((locale) => (
                  <button key={locale} type="button" onClick={() => setEditorLocale(locale)} className={`studio-pill-option ${editorLocale === locale ? "is-active" : ""}`}>
                    {locale === "zh" ? "CN" : "EN"}
                  </button>
                ))}
              </div>
            ) : null}
            {!isSectionDriven ? (
              <span className="hidden text-xs text-faint md:inline">
                {workspaceMode === "ai" ? tx("自然语言工作台", "Natural workspace") : tx("Markdown 工作台", "Markdown workspace")}
              </span>
            ) : null}
            <span className={`studio-save-pill ${saveState === "error" ? "is-error" : saveState === "saving" ? "is-saving" : isDirty ? "is-dirty" : "is-saved"}`}>
              {saveState === "saving" ? tx("保存中", "Saving") : saveState === "saved" && !isDirty ? tx("已保存", "Saved") : saveState === "error" ? tx("保存失败", "Save error") : tx("未保存", "Unsaved")}
            </span>
            <span className="hidden text-xs text-faint md:inline">{tx("上次保存", "Last saved")} {savedAtLabel(lastSavedAt, studioLocale)}</span>
            <Link href={`/studio/versions/${item.id}`} className="inline-flex items-center gap-1 transition hover:text-foreground">
              <History aria-hidden className="h-4 w-4" />
              {tx("版本", "Versions")}
            </Link>
          </div>
        </div>

        {isSectionDriven ? (
          isThoughtsPage ? (
            <div className="studio-editor-builder">
              <section className="studio-section-rail">
                <div className="studio-pane-topbar">
                  <p className="text-sm font-medium text-foreground">{tx("朋友圈轻量编辑", "Thoughts quick editor")}</p>
                </div>
                <div className="studio-section-scroll">
                  <div className="grid gap-3">
                    <textarea
                      value={thoughtZhInput}
                      onChange={(event) => setThoughtZhInput(event.target.value)}
                      placeholder={tx("写一条朋友圈内容（中文）", "Write a thought in Chinese")}
                      className="studio-textarea min-h-[7rem]"
                    />
                    <textarea
                      value={thoughtEnInput}
                      onChange={(event) => setThoughtEnInput(event.target.value)}
                      placeholder={tx("写一条朋友圈内容（英文，可选）", "Write an English version (optional)")}
                      className="studio-textarea min-h-[6rem]"
                    />
                    <button type="button" onClick={addThoughtItem} className="studio-button studio-button-primary">
                      {tx("发布到草稿流", "Add to thoughts stream")}
                    </button>
                    <p className="text-xs text-muted">{tx("新增后会自动保存。点击右侧“发布”即可正式发布。", "New entries autosave instantly. Click Publish on the right rail when ready.")}</p>
                  </div>
                </div>
              </section>

              <section className="studio-canvas">
                <div className="studio-pane-topbar">
                  <div className="flex items-center gap-2 text-sm text-muted">
                    <Eye aria-hidden className="h-4 w-4" />
                    {tx("实时预览与编辑", "Live edit and preview")}
                  </div>
                </div>
                <div className="studio-canvas-scroll">
                  <div className="grid gap-3">
                    {thoughtsItems.map((entry, index) => (
                      <article key={`thought-${index}`} className="studio-v2-list-row studio-v2-list-row-page">
                        <div className="min-w-0 flex-1 grid gap-2">
                          <textarea
                            value={String(entry.descriptionZh ?? entry.titleZh ?? "")}
                            onChange={(event) =>
                              updateThoughtItem(index, {
                                descriptionZh: event.target.value,
                                titleZh: event.target.value
                              })
                            }
                            className="studio-textarea min-h-[5rem]"
                          />
                          <textarea
                            value={String(entry.descriptionEn ?? entry.titleEn ?? "")}
                            onChange={(event) =>
                              updateThoughtItem(index, {
                                descriptionEn: event.target.value,
                                titleEn: event.target.value
                              })
                            }
                            placeholder={tx("英文版本（可选）", "English version (optional)")}
                            className="studio-textarea min-h-[4rem]"
                          />
                          <p className="studio-v2-soft">{entry.metaZh || entry.metaEn || ""}</p>
                        </div>
                        <button type="button" className="studio-button studio-button-ghost" onClick={() => removeThoughtItem(index)}>
                          {tx("删除", "Delete")}
                        </button>
                      </article>
                    ))}
                    {thoughtsItems.length === 0 ? <div className="studio-empty">{tx("还没有朋友圈内容，先写第一条吧。", "No thoughts yet. Write your first one.")}</div> : null}
                  </div>
                </div>
              </section>
            </div>
          ) : isCommentsPage ? (
            <div className="studio-editor-builder">
              <section className="studio-section-rail">
                <div className="studio-pane-topbar">
                  <p className="text-sm font-medium text-foreground">{tx("评论管理台", "Comment management")}</p>
                </div>
                <div className="studio-section-scroll">
                  <div className="grid gap-3">
                    <input
                      value={commentAuthorInput}
                      onChange={(event) => setCommentAuthorInput(event.target.value)}
                      placeholder={tx("评论者昵称", "Author name")}
                      className="studio-input"
                    />
                    <textarea
                      value={commentZhInput}
                      onChange={(event) => setCommentZhInput(event.target.value)}
                      placeholder={tx("评论内容", "Comment content")}
                      className="studio-textarea min-h-[7rem]"
                    />
                    <select value={commentStatusInput} onChange={(event) => setCommentStatusInput(event.target.value)} className="studio-select">
                      <option value="pending">{tx("待审核", "Pending")}</option>
                      <option value="approved">{tx("已通过", "Approved")}</option>
                      <option value="hidden">{tx("已隐藏", "Hidden")}</option>
                    </select>
                    <button type="button" onClick={addCommentItem} className="studio-button studio-button-primary">
                      {tx("添加评论记录", "Add comment item")}
                    </button>
                    <p className="text-xs text-muted">{tx("这里是评论源数据管理。新增后自动保存，发布后前台即可读取。", "This panel manages comment source data. New entries autosave; publish to make them live.")}</p>
                  </div>
                </div>
              </section>

              <section className="studio-canvas">
                <div className="studio-pane-topbar">
                  <div className="flex items-center gap-2 text-sm text-muted">
                    <Eye aria-hidden className="h-4 w-4" />
                    {tx("评论列表（可直接编辑）", "Comment list (editable)")}
                  </div>
                </div>
                <div className="studio-canvas-scroll">
                  <div className="grid gap-3">
                    {commentsItems.map((entry, index) => (
                      <article key={`comment-${index}`} className="studio-v2-list-row studio-v2-list-row-page">
                        <div className="min-w-0 flex-1 grid gap-2">
                          <input
                            value={String(entry.titleZh ?? entry.titleEn ?? "")}
                            onChange={(event) => updateCommentItem(index, { titleZh: event.target.value, titleEn: event.target.value })}
                            className="studio-input"
                          />
                          <textarea
                            value={String(entry.descriptionZh ?? "")}
                            onChange={(event) => updateCommentItem(index, { descriptionZh: event.target.value, descriptionEn: event.target.value })}
                            className="studio-textarea min-h-[5rem]"
                          />
                          <input
                            value={String(entry.metaZh ?? entry.metaEn ?? "")}
                            onChange={(event) => updateCommentItem(index, { metaZh: event.target.value, metaEn: event.target.value })}
                            className="studio-input"
                          />
                        </div>
                        <button type="button" className="studio-button studio-button-ghost" onClick={() => removeCommentItem(index)}>
                          {tx("删除", "Delete")}
                        </button>
                      </article>
                    ))}
                    {commentsItems.length === 0 ? <div className="studio-empty">{tx("还没有评论记录。", "No comment items yet.")}</div> : null}
                  </div>
                </div>
              </section>
            </div>
          ) : (
          <div className="studio-editor-builder">
            <section className="studio-section-rail">
              <div className="studio-pane-topbar">
                <div className="grid gap-1">
                  <p className="text-sm font-medium text-foreground">{tx("页面区块", "Page sections")}</p>
                  {isHomePage ? <p className="text-xs text-muted">{tx("首页可直接跳到 Hero、简介、卡片矩阵和 Discover 模块。", "Home pages can jump straight to Hero, intro, card grid, and discover modules.")}</p> : null}
                </div>
              </div>
              <div className="studio-section-scroll">
                <div className="grid gap-2">
                {isHomePage ? (
                  <div className="studio-note grid gap-2">
                    <p className="text-xs font-medium text-foreground">{tx("首页快捷编辑", "Home quick edit")}</p>
                    <div className="grid gap-2">
                      <button type="button" onClick={() => selectSectionByVariant("poster-emoji")} className="studio-button justify-between">
                        {tx("编辑首页 Hero", "Edit home hero")}
                        <ArrowUpRight aria-hidden className="h-4 w-4" />
                      </button>
                      <button type="button" onClick={() => selectSectionByVariant("intro-lines")} className="studio-button justify-between">
                        {tx("编辑首页简介", "Edit home intro")}
                        <ArrowUpRight aria-hidden className="h-4 w-4" />
                      </button>
                      <button type="button" onClick={() => selectSectionByVariant("home-bento-reference")} className="studio-button justify-between">
                        {tx("编辑首页卡片矩阵", "Edit home card grid")}
                        <ArrowUpRight aria-hidden className="h-4 w-4" />
                      </button>
                      <button type="button" onClick={() => selectSectionByVariant("discover-grid-reference")} className="studio-button justify-between">
                        {tx("编辑 Discover 卡片", "Edit discover cards")}
                        <ArrowUpRight aria-hidden className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ) : null}
                {draft.sections.map((section) => (
                  <div
                    key={section.id}
                    draggable
                    onDragStart={() => setDraggingId(section.id ?? null)}
                    onDragOver={(event) => event.preventDefault()}
                    onDrop={() => handleDrop(section.id ?? "")}
                    onClick={() => setSelectedSectionId(section.id)}
                    className={`studio-section-card ${selectedSection?.id === section.id ? "is-active" : ""}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="meta">{section.type.replace(/_/g, " ")}</div>
                        <div className="mt-1 truncate font-medium text-foreground">{sectionLabel(section)}</div>
                      </div>
                      <GripVertical aria-hidden className="mt-1 h-4 w-4 shrink-0 text-faint" />
                    </div>
                    <div className="mt-3 flex items-center gap-2 text-xs text-muted">
                      <button type="button" onClick={(event) => { event.stopPropagation(); moveSection(section.id ?? "", -1); }} className="transition hover:text-foreground">
                        <ChevronUp aria-hidden className="h-4 w-4" />
                      </button>
                      <button type="button" onClick={(event) => { event.stopPropagation(); moveSection(section.id ?? "", 1); }} className="transition hover:text-foreground">
                        <ChevronDown aria-hidden className="h-4 w-4" />
                      </button>
                      <button type="button" onClick={(event) => { event.stopPropagation(); duplicateSection(section.id ?? ""); }} className="transition hover:text-foreground">
                        <Copy aria-hidden className="h-4 w-4" />
                      </button>
                      <button type="button" onClick={(event) => { event.stopPropagation(); removeSection(section.id ?? ""); }} className="transition hover:text-foreground">
                        <Trash2 aria-hidden className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}

                <div className="mt-3 border-t hairline pt-3">
                  <p className="meta mb-2">{tx("添加区块", "Add section")}</p>
                  <div className="grid gap-2">
                    {sectionTypeOptions.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => addSection(option.value)}
                        className="studio-button justify-between"
                      >
                        {sectionTypeLabel(option.value, studioLocale)}
                        <Plus aria-hidden className="h-4 w-4" />
                      </button>
                    ))}
                  </div>
                </div>
                </div>
              </div>
            </section>

              <section className="studio-canvas">
                <div className="studio-pane-topbar">
                  <div className="flex items-center gap-2 text-sm text-muted">
                    <Eye aria-hidden className="h-4 w-4" />
                    {tx("预览画布", "Preview canvas")}
                    <span>·</span>
                    <span>{editorLocale === "zh" ? "CN" : "EN"}</span>
                  </div>
                </div>
                <div className="studio-canvas-scroll">
                  <div className="studio-canvas-frame">
                  <PageSections sections={draft.sections} posts={posts} projects={projects} site={site} preview locale={editorLocale === "zh" ? "zh" : "en"} />
                  </div>
                </div>
              </section>
          </div>
          )
        ) : (
          <div className="studio-editor-writing-shell">
            <div className={`studio-editor-writeup is-${workspaceMode} is-${viewMode}`}>
            {workspaceMode === "md" ? <section className="studio-pane-topbar studio-writing-modebar lg:col-span-2">
              <div>
                <p className="studio-eyebrow">{tx("Markdown 编辑器", "Markdown editor")}</p>
                <p className="studio-writing-modebar-title">{tx("左侧写作，右侧预览，适合长文和技术内容。", "Write on the left and preview on the right for long-form and technical content.")}</p>
              </div>
                <div className="studio-pill-toggle text-xs">
                  {(["write", "split", "preview"] as ViewMode[]).map((mode) => (
                    <button key={mode} type="button" onClick={() => setViewMode(mode)} className={`studio-pill-option ${viewMode === mode ? "is-active" : ""}`}>
                      {mode}
                    </button>
                  ))}
                </div>
            </section> : null}

            {workspaceMode === "md" ? (
              <>
                {viewMode !== "preview" ? (
                  <section className="studio-write-scroll studio-write-surface">
                    <div className="studio-write-body">
                      <div className="grid gap-5">
                        <input
                          value={activeTitle}
                          onChange={(event) => setDraft((current) => ({ ...current, ...(editorLocale === "zh" ? { title: event.target.value } : { titleEn: event.target.value }) }))}
                          placeholder={editorLocale === "zh" ? "中文标题" : "English title"}
                          className="studio-title-input"
                        />
                        <textarea
                          value={activeSummary}
                          onChange={(event) => setDraft((current) => ({ ...current, ...(editorLocale === "zh" ? { summary: event.target.value } : { summaryEn: event.target.value }) }))}
                          placeholder={editorLocale === "zh" ? "中文摘要" : "English summary"}
                          className="studio-textarea min-h-[5rem] resize-none"
                        />
                        <div className="flex flex-wrap items-center gap-2">
                          <button type="button" onClick={quickSummarize} disabled={aiBusy || aiAvailability !== "ready"} className="studio-button studio-button-ghost">
                            {tx("AI 总结", "AI Summary")}
                          </button>
                          <button type="button" onClick={quickTranslate} disabled={aiBusy || aiAvailability !== "ready"} className="studio-button studio-button-ghost">
                            {tx("AI 翻译到另一语言", "AI Translate to other locale")}
                          </button>
                        </div>
                    <div className="studio-markdown-toolbar" aria-label={tx("Markdown 工具", "Markdown tools")}>
                      <button type="button" onClick={() => appendToActiveBody("\n# Heading\n")} title={tx("标题", "Heading")}>H</button>
                      <button type="button" onClick={() => appendToActiveBody("**bold**")} title={tx("粗体", "Bold")}>B</button>
                      <button type="button" onClick={() => appendToActiveBody("*italic*")} title={tx("斜体", "Italic")}>I</button>
                      <button type="button" onClick={() => appendToActiveBody("<u>underline</u>")} title={tx("下划线", "Underline")}>U</button>
                      <button type="button" onClick={() => appendToActiveBody("\n- [ ] task\n")} title={tx("任务列表", "Task list")}>☑</button>
                      <button type="button" onClick={() => appendToActiveBody("\n> quote\n")} title={tx("引用", "Quote")}>❝</button>
                      <button type="button" onClick={() => appendToActiveBody("`code`")} title={tx("行内代码", "Inline code")}>{`</>`}</button>
                      <button type="button" onClick={() => appendToActiveBody("\n---\n")} title={tx("分隔线", "Divider")}>—</button>
                    </div>
                    <textarea
                      value={activeMarkdown}
                      onChange={(event) => setDraft((current) => ({ ...current, ...(editorLocale === "zh" ? { bodyMarkdown: event.target.value } : { bodyMarkdownEn: event.target.value }) }))}
                      className="studio-markdown-input"
                      spellCheck={false}
                    />
                    {renderAiPreviewBlock(tx, aiResult?.action === "format" ? aiResult : null, activeStoredMarkdown)}
                    <p className="studio-markdown-signature">{editorLocale === "zh" ? "Endless Markdown Atelier" : "Endless Markdown Atelier"}</p>
                  </div>
                </div>
              </section>
                ) : null}
                {viewMode !== "write" ? (
                  <section className="studio-preview-scroll studio-preview-surface">
                    <div className="studio-preview-body prose-endless max-w-none">
                      <ProseMarkdown markdown={activePreviewMarkdown} />
                    </div>
                  </section>
                ) : null}
              </>
            ) : (
              <section className="studio-write-scroll studio-natural-surface lg:col-span-2">
                <div className="studio-write-body">
                  <div className="grid gap-5">
                    <input
                      value={activeTitle}
                      onChange={(event) => setDraft((current) => ({ ...current, ...(editorLocale === "zh" ? { title: event.target.value } : { titleEn: event.target.value }) }))}
                      placeholder={editorLocale === "zh" ? "中文标题" : "English title"}
                      className="studio-title-input studio-natural-title-input"
                    />
                    <textarea
                      value={activeSummary}
                      onChange={(event) => setDraft((current) => ({ ...current, ...(editorLocale === "zh" ? { summary: event.target.value } : { summaryEn: event.target.value }) }))}
                      placeholder={editorLocale === "zh" ? "一句话摘要，也可以留给 AI 总结。" : "One-sentence summary, or leave it to AI."}
                      className="studio-natural-summary"
                    />
                    <div className="flex flex-wrap items-center gap-2">
                      <button type="button" onClick={quickSummarize} disabled={aiBusy || aiAvailability !== "ready"} className="studio-button studio-button-ghost">
                        {tx("AI 总结", "AI Summary")}
                      </button>
                      <button type="button" onClick={quickTranslate} disabled={aiBusy || aiAvailability !== "ready"} className="studio-button studio-button-ghost">
                        {tx("AI 翻译到另一语言", "AI Translate to other locale")}
                      </button>
                      <button type="button" onClick={() => askAi("format")} disabled={aiBusy || aiAvailability !== "ready"} className="studio-button studio-button-ghost">
                        {tx("AI 排版高亮预览", "AI Format Highlight")}
                      </button>
                    </div>
                    <textarea
                      value={activeMarkdown}
                      onChange={(event) => setDraft((current) => ({ ...current, ...(editorLocale === "zh" ? { bodyMarkdown: event.target.value } : { bodyMarkdownEn: event.target.value }) }))}
                      className="studio-natural-input"
                      spellCheck={false}
                    />
                    {renderAiPreviewBlock(tx, aiResult?.action === "format" ? aiResult : null, activeStoredMarkdown)}
                    <p className="studio-natural-signature">Endless Natural Editor</p>
                  </div>
                </div>
              </section>
            )}
            </div>

            <aside className="studio-editor-action-rail">
              <div className="studio-rail-panel">
                <p className="studio-rail-panel-label">{tx("语言", "Language")}</p>
              <div className="studio-rail-locale">
                {(["zh", "en"] as EditorLocale[]).map((locale) => (
                  <button key={locale} type="button" onClick={() => setEditorLocale(locale)} className={`studio-rail-locale-btn ${editorLocale === locale ? "is-active" : ""}`}>
                    {locale === "zh" ? "CN" : "EN"}
                  </button>
                ))}
              </div>
              </div>

              {workspaceMode === "ai" ? (
                <div className="studio-rail-panel">
                  <p className="studio-rail-panel-label">{tx("AI 快捷功能", "AI shortcuts")}</p>
                <div className="studio-rail-stack">
                  <button type="button" onClick={() => setImageDialogOpen(true)} disabled={imageAiAvailability !== "ready"} className="studio-rail-action">{tx("AI 生图", "AI Image")}</button>
                  <button type="button" onClick={() => askAi("format")} disabled={aiBusy || aiAvailability !== "ready"} className="studio-rail-action">{tx("AI 排版", "AI Layout")}</button>
                  <button type="button" onClick={quickTranslate} disabled={aiBusy || aiAvailability !== "ready"} className="studio-rail-action">{tx("AI 翻译", "AI Translate")}</button>
                  <button type="button" onClick={quickSummarize} disabled={aiBusy || aiAvailability !== "ready"} className="studio-rail-action">{tx("AI 总结", "AI Summary")}</button>
                </div>
                </div>
              ) : (
                <div className="studio-rail-panel">
                  <p className="studio-rail-panel-label">{tx("插入与 AI", "Insert + AI")}</p>
                <div className="studio-rail-stack">
                  <button type="button" onClick={() => appendToActiveBody("![图片描述](/images/quiet-desk.png)")} className="studio-rail-action">{tx("图片", "Image")}</button>
                  <button type="button" onClick={() => appendToActiveBody("[视频标题](/media/your-video.mp4)")} className="studio-rail-action">{tx("视频", "Video")}</button>
                  <button type="button" onClick={() => appendToActiveBody("[音频标题](/media/your-audio.mp3)")} className="studio-rail-action">{tx("音乐", "Music")}</button>
                  <button type="button" onClick={() => appendToActiveBody("$$\nE = mc^2\n$$")} className="studio-rail-action">LaTeX</button>
                  <button type="button" onClick={quickTranslate} disabled={aiBusy || aiAvailability !== "ready"} className="studio-rail-action">{tx("AI 翻译", "AI Translate")}</button>
                  <button type="button" onClick={quickSummarize} disabled={aiBusy || aiAvailability !== "ready"} className="studio-rail-action">{tx("AI 总结", "AI Summary")}</button>
                  <button type="button" onClick={() => setImageDialogOpen(true)} disabled={imageAiAvailability !== "ready"} className="studio-rail-action">{tx("AI 生图", "AI Image")}</button>
                </div>
                </div>
              )}

              <div className="studio-rail-panel studio-rail-ask">
                <p className="studio-rail-panel-label">{tx("Ask AI", "Ask AI")}</p>
                <textarea
                  value={aiInstruction}
                  onChange={(event) => setAiInstruction(event.target.value)}
                  placeholder={tx("告诉 AI 要怎么改", "Ask AI for edits...")}
                  className="studio-rail-ask-input"
                />
                <button type="button" onClick={() => askAi()} disabled={aiBusy || aiAvailability !== "ready"} className="studio-rail-ask-button">
                  {aiBusy ? tx("生成中…", "Working…") : tx("发送", "Send")}
                </button>
                {aiAvailability !== "ready" ? (
                  <p className="text-xs text-amber-600 dark:text-amber-300">{aiStatus.message || tx("请先在设置里配置 AI。", "Configure AI in settings first.")}</p>
                ) : null}
                <div className="studio-natural-actions">
                  <button type="button" className="studio-button studio-button-ghost" onClick={() => setAiInstruction(tx("请优化段落层级与可读性", "Improve hierarchy and readability"))}>{tx("排版建议", "Layout hint")}</button>
                  <button type="button" className="studio-button studio-button-ghost" onClick={() => setAiInstruction(tx("保留语气，翻译成英文", "Translate to English, keep tone"))}>{tx("翻译建议", "Translation hint")}</button>
                </div>
                {aiHint ? <p className="text-xs text-muted">{aiHint}</p> : null}
              </div>

              <div className="studio-rail-panel studio-rail-bottom">
                <p className="studio-rail-panel-label">{tx("发布操作", "Publishing")}</p>
                <button type="button" className="studio-rail-action is-settings" onClick={() => setAsideOpen((current) => !current)}>
                  {asideOpen ? <PanelRightClose aria-hidden className="h-4 w-4" /> : <PanelRight aria-hidden className="h-4 w-4" />}
                  <span>{tx("设置", "Settings")}</span>
                </button>
                {isSectionDriven ? (
                  <button type="button" onClick={openPageTextMode} className="studio-rail-action">
                    {tx("文本编辑", "Text mode")}
                  </button>
                ) : null}
                <button type="button" onClick={moveToDraft} className="studio-rail-action">
                  {tx("草稿", "Draft")}
                </button>
                <button type="button" onClick={publish} className="studio-rail-action is-primary">
                  {tx("发布", "Publish")}
                </button>
              </div>
            </aside>
          </div>
        )}
      </div>

      <aside className={`studio-aside ${isSectionDriven || asideOpen ? "is-open" : "is-collapsed"}`}>
        <div className="studio-inspector-scroll">
          <div className="grid gap-5">
            <div className="studio-aside-status-card">
              <p className="text-sm font-medium text-foreground">{tx("发布状态", "Publishing")}</p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <span className={`studio-save-pill ${saveState === "error" ? "is-error" : saveState === "saving" ? "is-saving" : isDirty ? "is-dirty" : "is-saved"}`}>
                  {saveState === "saving" ? tx("保存中", "Saving") : saveState === "error" ? tx("保存失败", "Save error") : isDirty ? tx("未保存修改", "Unsaved changes") : tx("已保存", "Saved")}
                </span>
                <span className="text-xs text-faint">{savedAtLabel(lastSavedAt, studioLocale)}</span>
              </div>
              <p className="mt-2 text-xs leading-6 text-muted">{tx("这里会实时告诉你内容是否已经保存到后台。", "This area tells you whether the current draft is already saved to the server.")}</p>
            </div>

            <div className="grid gap-2 studio-aside-action-group">
              <button type="button" onClick={() => saveNow("Manual save")} className="studio-button">
                {tx("立即保存", "Save now")}
              </button>
              <button type="button" onClick={publish} className="studio-button studio-button-primary">
                {tx("发布", "Publish")}
              </button>
              <button type="button" onClick={moveToDraft} className="studio-button studio-button-ghost">
                {tx("转为草稿", "Move to draft")}
              </button>
            </div>

            <section className="studio-aside-section">
              <div>
                <div className="text-sm font-medium text-foreground">{tx("内容", "Content")}</div>
                <p className="studio-aside-copy">{tx("先确认标题、摘要和链接，再继续处理状态与发布时间。", "Confirm title, summary, and slug first, then set status and publishing time.")}</p>
                {isHomePage ? (
                  <p className="mt-2 text-xs leading-6 text-muted">
                    {tx("首页站点标题同步后台设置里的站点标题，这里只展示当前结果。", "Home page title syncs from the site title in settings. These fields are display-only here.")}
                  </p>
                ) : null}
              </div>
              <label className="studio-label text-sm">
                <span className="studio-label-text">{tx("标题（中文）", "Title (ZH)")}</span>
                <input value={isHomePage ? site.title : draft.title} onChange={(event) => setDraft((current) => ({ ...current, title: event.target.value }))} className="studio-input" disabled={isHomePage} />
              </label>
              <label className="studio-label text-sm">
                <span className="studio-label-text">{tx("标题（英文）", "Title (EN)")}</span>
                <input value={isHomePage ? site.title : draft.titleEn} onChange={(event) => setDraft((current) => ({ ...current, titleEn: event.target.value }))} className="studio-input" disabled={isHomePage} />
              </label>
              <label className="studio-label text-sm">
                <span className="studio-label-text">{tx("摘要（中文）", "Summary (ZH)")}</span>
                <textarea value={draft.summary} onChange={(event) => setDraft((current) => ({ ...current, summary: event.target.value }))} className="studio-textarea min-h-[5rem]" />
              </label>
              <label className="studio-label text-sm">
                <span className="studio-label-text">{tx("摘要（英文）", "Summary (EN)")}</span>
                <textarea value={draft.summaryEn} onChange={(event) => setDraft((current) => ({ ...current, summaryEn: event.target.value }))} className="studio-textarea min-h-[5rem]" />
              </label>
              <label className="studio-label text-sm">
                <span className="studio-label-text">{tx("自定义链接", "Slug")}</span>
                <input value={draft.slug} onChange={(event) => setDraft((current) => ({ ...current, slug: event.target.value }))} className="studio-input" />
              </label>
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                <label className="studio-label text-sm">
                  <span className="studio-label-text">{tx("类型", "Type")}</span>
                  <select
                    value={draft.type}
                    onChange={(event) =>
                      setDraft((current) => ({
                        ...current,
                        type: event.target.value as ContentRecord["type"],
                        layoutMode: event.target.value === "PAGE" ? "SECTIONS" : current.layoutMode
                      }))
                    }
                    className="studio-select"
                  >
                    {contentTypeOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.value === "PAGE"
                          ? tx("页面", "Page")
                          : option.value === "DOC"
                            ? tx("文档", "Doc")
                            : option.value === "PROJECT"
                              ? tx("项目", "Project")
                              : tx("文章", "Post")}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="studio-label text-sm">
                  <span className="studio-label-text">{tx("状态", "State")}</span>
                  <select value={draft.status} onChange={(event) => setDraft((current) => ({ ...current, status: event.target.value as ContentRecord["status"] }))} className="studio-select">
                    {contentStatusOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.value === "PUBLISHED"
                          ? tx("已发布", "Published")
                          : option.value === "SCHEDULED"
                            ? tx("定时发布", "Scheduled")
                            : option.value === "ARCHIVED"
                              ? tx("已归档", "Archived")
                              : tx("草稿", "Draft")}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                <label className="studio-label text-sm">
                  <span className="studio-label-text">{tx("布局模式", "Layout mode")}</span>
                  <select value={draft.layoutMode} onChange={(event) => setDraft((current) => ({ ...current, layoutMode: event.target.value as ContentRecord["layoutMode"] }))} className="studio-select" disabled={draft.type === "PAGE"}>
                    {layoutModeOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.value === "SECTIONS" ? tx("区块", "Sections") : option.value === "HYBRID" ? tx("混合", "Hybrid") : "Markdown"}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="studio-label text-sm">
                  <span className="studio-label-text">{tx("模板", "Template")}</span>
                  <select value={draft.templateKey} onChange={(event) => setDraft((current) => ({ ...current, templateKey: event.target.value as ContentRecord["templateKey"] }))} className="studio-select">
                    {templateKeyOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.value === "HOME"
                          ? tx("首页", "Home")
                          : option.value === "ABOUT"
                            ? tx("关于", "About")
                            : option.value === "LAB"
                              ? tx("实验室", "Lab")
                              : option.value === "LANDING"
                                ? tx("落地页", "Landing")
                                : tx("默认", "Default")}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                <label className="studio-label text-sm">
                  <span className="studio-label-text">{tx("发布时间", "Published at")}</span>
                  <input type="datetime-local" value={draft.publishedAt} onChange={(event) => setDraft((current) => ({ ...current, publishedAt: event.target.value }))} className="studio-input" />
                </label>
                <label className="studio-label text-sm">
                  <span className="studio-label-text">{tx("定时发布时间", "Scheduled at")}</span>
                  <input type="datetime-local" value={draft.scheduledAt} onChange={(event) => setDraft((current) => ({ ...current, scheduledAt: event.target.value }))} className="studio-input" />
                </label>
              </div>
            </section>

            {mediaAssets.length > 0 ? (
              <section className="studio-aside-section">
                <div>
                  <div className="text-sm font-medium text-foreground">{tx("封面", "Cover")}</div>
                  <p className="studio-aside-copy">{tx("封面会用于文章列表、分享卡片和部分前台模板。", "The cover is used in lists, share cards, and some frontend templates.")}</p>
                </div>
                <select value={draft.coverMediaId} onChange={(event) => setDraft((current) => ({ ...current, coverMediaId: event.target.value }))} className="studio-select">
                  <option value="">{tx("不使用封面", "No cover")}</option>
                  {mediaAssets.map((asset) => (
                    <option key={asset.id} value={asset.id}>
                      {asset.alt || asset.key}
                    </option>
                  ))}
                </select>
                {draft.coverMediaId ? (
                  <div className="overflow-hidden rounded-[1rem] border hairline">
                    <Image
                      src={mediaAssets.find((asset) => asset.id === draft.coverMediaId)?.url ?? "/images/quiet-desk.png"}
                      alt={mediaAssets.find((asset) => asset.id === draft.coverMediaId)?.alt ?? draft.title}
                      width={480}
                      height={320}
                      className="h-auto w-full object-cover"
                    />
                  </div>
                ) : null}
              </section>
            ) : null}

            <section className="studio-aside-section">
              <div>
                <div className="text-sm font-medium text-foreground">{tx("分类体系", "Taxonomy")}</div>
                <p className="studio-aside-copy">{tx("标签更细，分类更粗；只保留真正有用的维度。", "Tags are granular, categories are broad; keep only the dimensions you really need.")}</p>
              </div>
              <div className="grid gap-2">
                <p className="text-xs text-muted">{tx("标签", "Tags")}</p>
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag) => (
                    <button
                      key={tag.slug}
                      type="button"
                      onClick={() => toggleChoice(tag.slug, draft.tagSlugs, (next) => setDraft((current) => ({ ...current, tagSlugs: next })))}
                      className={`rounded-full border px-2.5 py-1 text-xs transition ${
                        draft.tagSlugs.includes(tag.slug) ? "border-foreground bg-foreground text-background" : "border-border text-muted hover:border-border-strong hover:text-foreground"
                      }`}
                    >
                      {tag.name}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid gap-2">
                <p className="text-xs text-muted">{tx("分类", "Categories")}</p>
                <div className="flex flex-wrap gap-2">
                  {categories.map((category) => (
                    <button
                      key={category.slug}
                      type="button"
                      onClick={() => toggleChoice(category.slug, draft.categorySlugs, (next) => setDraft((current) => ({ ...current, categorySlugs: next })))}
                      className={`rounded-full border px-2.5 py-1 text-xs transition ${
                        draft.categorySlugs.includes(category.slug) ? "border-foreground bg-foreground text-background" : "border-border text-muted hover:border-border-strong hover:text-foreground"
                      }`}
                    >
                      {category.name}
                    </button>
                  ))}
                </div>
              </div>
            </section>

            {!isSectionDriven ? (
              <section className="studio-aside-section">
                <div>
                  <div className="text-sm font-medium text-foreground">{tx("快捷插入", "Insert")}</div>
                  <p className="studio-aside-copy">{tx("这些按钮适合快速补媒体，不想切换编辑器时用。", "Use these for quick media inserts without breaking writing flow.")}</p>
                </div>
                <div className="grid gap-2">
                  <button type="button" className="studio-button" onClick={() => appendToActiveBody("![图片描述](/images/quiet-desk.png)")}>
                    {tx("插入图片", "Insert image")}
                  </button>
                  <button type="button" className="studio-button" onClick={() => appendToActiveBody("[音频标题](/media/your-audio.mp3)")}>
                    {tx("插入音频", "Insert audio")}
                  </button>
                  <button type="button" className="studio-button" onClick={() => appendToActiveBody("[视频标题](/media/your-video.mp4)")}>
                    {tx("插入视频", "Insert video")}
                  </button>
                  <button type="button" className="studio-button" onClick={() => appendToActiveBody("$$\nE = mc^2\n$$")}>
                    {tx("插入公式", "Insert formula")}
                  </button>
                </div>
              </section>
            ) : null}

            {isSectionDriven && selectedSection ? (
              <SectionInspector section={selectedSection} updateSection={updateSection} mediaAssets={mediaAssets} posts={posts} replaceArrayField={replaceArrayField} />
            ) : (
              <section className="studio-aside-section">
                <div>
                  <div className="text-sm font-medium text-foreground">SEO</div>
                  <p className="studio-aside-copy">{tx("如果不单独填写，前台仍会回退到标题和摘要。", "If left empty, the frontend can still fall back to the main title and summary.")}</p>
                </div>
                <label className="studio-label text-sm">
                  <span className="studio-label-text">{tx("SEO 标题（中文）", "SEO title (ZH)")}</span>
                  <input value={draft.seoTitle} onChange={(event) => setDraft((current) => ({ ...current, seoTitle: event.target.value }))} className="studio-input" />
                </label>
                <label className="studio-label text-sm">
                  <span className="studio-label-text">{tx("SEO 标题（英文）", "SEO title (EN)")}</span>
                  <input value={draft.seoTitleEn} onChange={(event) => setDraft((current) => ({ ...current, seoTitleEn: event.target.value }))} className="studio-input" />
                </label>
                <label className="studio-label text-sm">
                  <span className="studio-label-text">{tx("SEO 描述（中文）", "SEO description (ZH)")}</span>
                  <textarea value={draft.seoDescription} onChange={(event) => setDraft((current) => ({ ...current, seoDescription: event.target.value }))} className="studio-textarea min-h-[6rem]" />
                </label>
                <label className="studio-label text-sm">
                  <span className="studio-label-text">{tx("SEO 描述（英文）", "SEO description (EN)")}</span>
                  <textarea value={draft.seoDescriptionEn} onChange={(event) => setDraft((current) => ({ ...current, seoDescriptionEn: event.target.value }))} className="studio-textarea min-h-[6rem]" />
                </label>
              </section>
            )}

            <section className="studio-aside-section">
              <div>
                <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                  <Sparkles aria-hidden className="h-4 w-4" />
                  {tx("AI 工具", "AI tools")}
                </div>
                <p className="studio-aside-copy">{tx("文本 AI 负责排版、翻译和总结；生图 AI 单独负责生成并插入图片。", "Writing AI handles formatting, translation, and summaries; image AI separately generates and inserts images.")}</p>
              </div>
              <div className="grid gap-1">
                <p className={`text-xs leading-6 ${aiAvailability === "ready" ? "text-muted" : "text-amber-600 dark:text-amber-300"}`}>
                  {aiAvailability === "ready"
                    ? `${tx("文本 AI", "Writing AI")}: ${aiStatus.provider} · ${aiStatus.model || tx("未设置模型", "model not set")}`
                    : `${tx("文本 AI", "Writing AI")}: ${aiStatus.message || tx("AI 服务当前不可用。", "AI provider is unavailable.")}`}
                </p>
                {!isSectionDriven ? (
                  <p className={`text-xs leading-6 ${imageAiAvailability === "ready" ? "text-muted" : "text-amber-600 dark:text-amber-300"}`}>
                    {imageAiAvailability === "ready"
                      ? `${tx("生图 AI", "Image AI")}: ${imageAiStatus.provider} · ${imageAiStatus.model || tx("未设置模型", "model not set")}`
                      : `${tx("生图 AI", "Image AI")}: ${imageAiStatus.message || tx("AI 生图服务当前不可用。", "AI image provider is unavailable.")}`}
                  </p>
                ) : null}
              </div>
              <div className="studio-ai-tabs" role="tablist" aria-label={tx("AI 工具", "AI tools")}>
                {(["format", "translate", "summarize"] as AiMode[]).map((mode) => (
                  <button key={mode} type="button" onClick={() => setAiMode(mode)} className={`studio-ai-tab ${aiMode === mode ? "is-active" : ""}`}>
                    {tx(aiModeCopy[mode].labelZh, aiModeCopy[mode].labelEn)}
                  </button>
                ))}
              </div>
              {!isSectionDriven ? (
                <button type="button" onClick={() => setImageDialogOpen(true)} disabled={imageAiAvailability !== "ready"} className="studio-button">
                  <ImagePlus aria-hidden className="h-4 w-4" />
                  {tx("AI 生成图片", "AI Image")}
                </button>
              ) : null}
              <p className="text-xs leading-6 text-muted">{tx(aiModeCopy[aiMode].bodyZh, aiModeCopy[aiMode].bodyEn)}</p>
              <textarea value={aiInstruction} onChange={(event) => setAiInstruction(event.target.value)} className="studio-textarea min-h-[5rem]" />
              <button type="button" onClick={() => askAi()} disabled={aiBusy || aiAvailability !== "ready"} className="studio-button">
                {aiBusy ? tx("生成中…", "Working…") : tx(aiModeCopy[aiMode].buttonZh, aiModeCopy[aiMode].buttonEn)}
              </button>
              {aiHint ? <p className="text-xs leading-6 text-emerald-700 dark:text-emerald-300">{aiHint}</p> : null}
              {aiError ? <p className="text-xs leading-6 text-rose-600 dark:text-rose-300">{aiError}</p> : null}
              {aiResult ? (
                <div className="grid gap-3">
                  {renderAiPreviewBlock(tx, aiResult, activeStoredMarkdown)}
                  <div className="grid gap-2 sm:grid-cols-3">
                    <button type="button" onClick={applyAiResult} className="studio-button studio-button-primary">
                      {tx("一键应用到当前内容", "Apply to current content")}
                    </button>
                    <button type="button" onClick={copyAiResult} className="studio-button">
                      {tx("复制结果", "Copy result")}
                    </button>
                    <button type="button" onClick={() => setAiResult(null)} className="studio-button studio-button-ghost">
                      {tx("清空结果", "Clear result")}
                    </button>
                  </div>
                </div>
              ) : (
                <p className="text-xs leading-6 text-muted">
                  {aiMode === "format"
                    ? tx("AI 排版会先在这里显示高亮改动预览，确认后再应用到正文。", "AI formatting shows a highlighted preview here before you apply it to the article.")
                    : aiMode === "translate"
                      ? tx("AI 翻译会自动写入另一种语言字段并保存。", "AI translation writes into the opposite locale fields and saves automatically.")
                      : tx("AI 总结会自动写入摘要与 SEO 字段并保存。", "AI summary writes summary and SEO fields automatically and saves.")}
                </p>
              )}
            </section>
          </div>
        </div>
      </aside>

      {imageDialogOpen ? (
        <div className="studio-modal-backdrop" role="dialog" aria-modal="true" onClick={() => setImageDialogOpen(false)}>
          <div className="studio-workspace-modal" onClick={(event) => event.stopPropagation()}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="studio-eyebrow">{tx("AI 生图", "AI Image")}</p>
                <h3>{tx("生成并插入图片", "Generate and insert image")}</h3>
              </div>
              <button type="button" onClick={() => setImageDialogOpen(false)} className="studio-icon-link" aria-label={tx("关闭", "Close")}>
                <X aria-hidden className="h-4 w-4" />
              </button>
            </div>
            <textarea
              value={imagePrompt}
              onChange={(event) => setImagePrompt(event.target.value)}
              className="studio-textarea min-h-[7rem]"
              placeholder={tx("描述你想要的图片风格、主体、构图和光线…", "Describe style, subject, composition, and lighting...")}
            />
            <div className="grid gap-2 sm:grid-cols-3">
              <label className="studio-label text-sm sm:col-span-2">
                <span className="studio-label-text">{tx("尺寸", "Size")}</span>
                <select value={imageSize} onChange={(event) => setImageSize(event.target.value as "1024x1024" | "1536x1024" | "1024x1536")} className="studio-select">
                  <option value="1536x1024">{tx("横向 1536x1024", "Landscape 1536x1024")}</option>
                  <option value="1024x1024">{tx("方形 1024x1024", "Square 1024x1024")}</option>
                  <option value="1024x1536">{tx("竖向 1024x1536", "Portrait 1024x1536")}</option>
                </select>
              </label>
              <button type="button" onClick={generateAiImage} disabled={imageBusy || imageAiAvailability !== "ready"} className="studio-button self-end">
                {imageBusy ? tx("生成中…", "Generating…") : tx("生成", "Generate")}
              </button>
            </div>
            <p className={`text-xs leading-6 ${imageAiAvailability === "ready" ? "text-muted" : "text-amber-600 dark:text-amber-300"}`}>
              {imageAiAvailability === "ready"
                ? `${tx("当前生图模型", "Current image model")}: ${imageAiStatus.model || tx("未设置模型", "model not set")}`
                : imageAiStatus.message || tx("AI 生图服务当前不可用。", "AI image provider is unavailable.")}
            </p>
            {imageError ? <p className="text-xs leading-6 text-rose-600 dark:text-rose-300">{imageError}</p> : null}
            {imageResult ? (
              <div className="grid gap-3">
                <div className="overflow-hidden rounded-[0.9rem] border hairline">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={imageResult.url} alt={imagePrompt} className="h-auto w-full object-cover" />
                </div>
                {imageResult.revisedPrompt ? <p className="text-xs leading-6 text-muted">{imageResult.revisedPrompt}</p> : null}
                <button
                  type="button"
                  onClick={() => {
                    appendToActiveBody(`![${imagePrompt}](${imageResult.url})`);
                    setImageDialogOpen(false);
                  }}
                  className="studio-button studio-button-primary"
                >
                  {tx("插入到正文", "Insert into content")}
                </button>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}

      {pageTextMode ? (
        <div className="studio-modal-backdrop" role="dialog" aria-modal="true" onClick={() => setPageTextMode(false)}>
          <div className="studio-workspace-modal" onClick={(event) => event.stopPropagation()}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="studio-eyebrow">{tx("页面文本模式", "Page text mode")}</p>
                <h3>{tx("直接编辑区块 JSON", "Edit sections JSON directly")}</h3>
              </div>
              <button type="button" onClick={() => setPageTextMode(false)} className="studio-icon-link" aria-label={tx("关闭", "Close")}>
                <X aria-hidden className="h-4 w-4" />
              </button>
            </div>
            <textarea value={sectionsJson} onChange={(event) => setSectionsJson(event.target.value)} className="studio-textarea min-h-[22rem] font-mono text-xs" />
            {sectionsJsonError ? <p className="text-xs text-rose-600 dark:text-rose-300">{sectionsJsonError}</p> : null}
            <div className="flex gap-2 justify-end">
              <button type="button" onClick={() => setPageTextMode(false)} className="studio-button">{tx("取消", "Cancel")}</button>
              <button type="button" onClick={applySectionsJson} className="studio-button studio-button-primary">{tx("应用并继续", "Apply and continue")}</button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <span className="studio-label-text">{children}</span>;
}

function localizeStudioLabel(t: (zh: string, en: string) => string, label: string) {
  if (/[\u4e00-\u9fff]/.test(label)) {
    return label;
  }
  const dictionary: Record<string, string> = {
    "Title": "标题",
    "Title (ZH)": "标题（中文）",
    "Title (EN)": "标题（英文）",
    "Description": "描述",
    "Description (ZH)": "描述（中文）",
    "Description (EN)": "描述（英文）",
    "Body": "正文",
    "Body (ZH)": "正文（中文）",
    "Body (EN)": "正文（英文）",
    "Quote (ZH)": "引语（中文）",
    "Quote (EN)": "引语（英文）",
    "Citation (ZH)": "出处（中文）",
    "Citation (EN)": "出处（英文）",
    "Eyebrow (ZH)": "眉注（中文）",
    "Eyebrow (EN)": "眉注（英文）",
    "Label": "标签",
    "Label (ZH)": "标签（中文）",
    "Label (EN)": "标签（英文）",
    "Links": "链接",
    "Link": "链接",
    "Href": "链接地址",
    "External href": "外链地址",
    "External (true/false)": "外链（true/false）",
    "Image URL": "图片地址",
    "Image / background URL": "图片/背景地址",
    "Alt text": "替代文本",
    "Meta": "元信息",
    "Meta (ZH)": "元信息（中文）",
    "Meta (EN)": "元信息（英文）",
    "Subheadline": "副标题",
    "Subheadline (ZH)": "副标题（中文）",
    "Subheadline (EN)": "副标题（英文）",
    "Headline": "主标题",
    "Headline (ZH)": "主标题（中文）",
    "Headline (EN)": "主标题（英文）",
    "CTA (ZH)": "按钮文案（中文）",
    "CTA (EN)": "按钮文案（英文）",
    "Overlay title (ZH)": "覆盖标题（中文）",
    "Overlay title (EN)": "覆盖标题（英文）",
    "Desktop grid area": "桌面网格区域",
    "Mobile grid area": "移动网格区域",
    "Layout key": "布局键",
    "Card type": "卡片类型",
    "Emoji": "表情",
    "Icon": "图标",
    "Avatar": "头像",
    "Markdown": "Markdown",
    "Intro lines": "开场文案",
    "Text (ZH)": "文本（中文）",
    "Text (EN)": "文本（英文）",
    "Suffix (ZH)": "后缀（中文）",
    "Suffix (EN)": "后缀（英文）",
    "Brand description (ZH)": "品牌描述（中文）",
    "Brand description (EN)": "品牌描述（英文）",
    "Legal line (ZH)": "版权说明（中文）",
    "Legal line (EN)": "版权说明（英文）",
    "Column links": "列链接",
    "Timeline items": "时间线条目",
    "Home cards": "首页卡片",
    "Raw props JSON": "原始属性 JSON",
    "Markdown body": "Markdown 正文"
  };
  return t(dictionary[label] ?? label, label);
}

function SectionInspector({
  section,
  updateSection,
  mediaAssets,
  posts,
  replaceArrayField
}: {
  section: PageSectionRecord;
  updateSection: (sectionId: string, updater: (section: PageSectionRecord) => PageSectionRecord) => void;
  mediaAssets: Array<{ id: string; url: string; alt: string; mimeType: string; key: string }>;
  posts: ContentRecord[];
  replaceArrayField: (sectionId: string, key: string, nextItems: Array<Record<string, unknown>>) => void;
}) {
  const { t } = useStudioLocale();
  const [advancedMode, setAdvancedMode] = useState(false);
  const [rawProps, setRawProps] = useState("");
  const [rawPropsError, setRawPropsError] = useState<string | null>(null);
  const links = listValue(section.props.links).filter((item): item is Record<string, string> => typeof item === "object" && item !== null) as Array<Record<string, string>>;
  const items = listValue(section.props.items).filter((item): item is Record<string, string> => typeof item === "object" && item !== null) as Array<Record<string, string>>;
  const homeGridEntries = listValue(section.props.items).filter((item): item is Record<string, unknown> => typeof item === "object" && item !== null) as Array<Record<string, unknown>>;
  const footerColumns = listValue(section.props.columns).filter((item): item is Record<string, unknown> => typeof item === "object" && item !== null) as Array<Record<string, unknown>>;
  const spanLabel = (value: PageSectionRecord["columnSpan"]) => {
    if (value === "full") return t("全宽", "Full");
    if (value === "wide") return t("加宽", "Wide");
    if (value === "half") return t("半宽", "Half");
    return t("三分之一", "Third");
  };

  useEffect(() => {
    setRawProps(JSON.stringify(section.props ?? {}, null, 2));
    setRawPropsError(null);
    setAdvancedMode(false);
  }, [section.id, section.props]);

  const updateProps = (next: Record<string, unknown>) => {
    updateSection(section.id ?? "", (current) => ({
      ...current,
      props: {
        ...current.props,
        ...next
      }
    }));
  };

  return (
    <section className="studio-aside-section">
      <div>
        <p className="text-sm font-medium text-foreground">{t("当前区块", "Selected section")}</p>
        <p className="mt-1 text-xs text-muted">{section.type.replace(/_/g, " ")}</p>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-xs text-muted">{t("字段面板默认结构化编辑，高级模式可直接编辑 JSON。", "Use structured fields by default, or switch to advanced JSON editing.")}</p>
        <button type="button" onClick={() => setAdvancedMode((current) => !current)} className="text-xs text-muted transition hover:text-foreground">
          {advancedMode ? t("关闭高级模式", "Exit advanced mode") : t("高级模式", "Advanced mode")}
        </button>
      </div>

      <div className="studio-field-group">
        <p className="studio-field-group-title">{t("结构", "Structure")}</p>
        <label className="studio-label">
          <FieldLabel>{t("样式变体", "Variant")}</FieldLabel>
          <input
            value={section.variant}
            onChange={(event) => updateSection(section.id ?? "", (current) => ({ ...current, variant: event.target.value }))}
            className="studio-input"
          />
        </label>

        <label className="studio-label">
          <FieldLabel>{t("宽度", "Span")}</FieldLabel>
          <select
            value={section.columnSpan}
            onChange={(event) => updateSection(section.id ?? "", (current) => ({ ...current, columnSpan: event.target.value as PageSectionRecord["columnSpan"] }))}
            className="studio-select"
          >
            {columnSpanOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {spanLabel(option.value)}
              </option>
            ))}
          </select>
        </label>

        <label className="studio-check">
          <input
            type="checkbox"
            checked={section.enabled}
            onChange={(event) => updateSection(section.id ?? "", (current) => ({ ...current, enabled: event.target.checked }))}
          />
          {t("启用", "Enabled")}
        </label>
      </div>

      <div className="studio-field-group">
        <p className="studio-field-group-title">{t("内容字段", "Content fields")}</p>

      {section.type === "hero_statement" ? (
        <>
          <TextField label={t("眉注（中文）", "Eyebrow (ZH)")} value={String(section.props.eyebrowZh ?? section.props.eyebrow ?? "")} onChange={(value) => updateProps({ eyebrowZh: value })} />
          <TextField label={t("眉注（英文）", "Eyebrow (EN)")} value={String(section.props.eyebrowEn ?? "")} onChange={(value) => updateProps({ eyebrowEn: value })} />
          <TextAreaField label={t("标题（中文）", "Title (ZH)")} value={String(section.props.titleZh ?? section.props.title ?? "")} onChange={(value) => updateProps({ titleZh: value })} />
          <TextAreaField label={t("标题（英文）", "Title (EN)")} value={String(section.props.titleEn ?? "")} onChange={(value) => updateProps({ titleEn: value })} />
          <TextAreaField label={t("正文（中文）", "Body (ZH)")} value={String(section.props.bodyZh ?? section.props.body ?? "")} onChange={(value) => updateProps({ bodyZh: value })} />
          <TextAreaField label={t("正文（英文）", "Body (EN)")} value={String(section.props.bodyEn ?? "")} onChange={(value) => updateProps({ bodyEn: value })} />
          {section.variant === "poster-emoji" ? (
            <>
              <TextField label={t("社交品牌", "Social brand")} value={String(section.props.socialBrand ?? "")} onChange={(value) => updateProps({ socialBrand: value })} />
              <ArrayObjectEditor
                title={t("头图区文案", "Hero lines")}
                entries={listValue(section.props.heroLines).filter((item): item is Record<string, string> => typeof item === "object" && item !== null) as Array<Record<string, string>>}
                fields={[
                  { key: "text", label: "Text (ZH)" },
                  { key: "textEn", label: "Text (EN)" },
                  { key: "emoji", label: "Emoji" },
                  { key: "suffix", label: "Suffix (ZH)" },
                  { key: "suffixEn", label: "Suffix (EN)" }
                ]}
                onChange={(next) => replaceArrayField(section.id ?? "", "heroLines", next)}
              />
              <ArrayObjectEditor
                title={t("社交链接", "Social links")}
                entries={listValue(section.props.socialLinks).filter((item): item is Record<string, string> => typeof item === "object" && item !== null) as Array<Record<string, string>>}
                fields={[
                  { key: "label", label: "Label" },
                  { key: "href", label: "Href" },
                  { key: "external", label: "External (true/false)" }
                ]}
                onChange={(next) => replaceArrayField(section.id ?? "", "socialLinks", next)}
              />
            </>
          ) : null}
          <TextField label={t("主按钮文案（中文）", "Primary label (ZH)")} value={String(section.props.primaryLabelZh ?? section.props.primaryLabel ?? "")} onChange={(value) => updateProps({ primaryLabelZh: value })} />
          <TextField label={t("主按钮文案（英文）", "Primary label (EN)")} value={String(section.props.primaryLabelEn ?? "")} onChange={(value) => updateProps({ primaryLabelEn: value })} />
          <TextField label={t("主按钮链接", "Primary href")} value={String(section.props.primaryHref ?? "")} onChange={(value) => updateProps({ primaryHref: value })} />
          <TextField label={t("次按钮文案（中文）", "Secondary label (ZH)")} value={String(section.props.secondaryLabelZh ?? section.props.secondaryLabel ?? "")} onChange={(value) => updateProps({ secondaryLabelZh: value })} />
          <TextField label={t("次按钮文案（英文）", "Secondary label (EN)")} value={String(section.props.secondaryLabelEn ?? "")} onChange={(value) => updateProps({ secondaryLabelEn: value })} />
          <TextField label={t("次按钮链接", "Secondary href")} value={String(section.props.secondaryHref ?? "")} onChange={(value) => updateProps({ secondaryHref: value })} />
        </>
      ) : null}

      {section.type === "intro_richtext" ? (
        <>
          {section.variant === "intro-lines" ? (
            <ArrayObjectEditor
              title={t("引导文案行", "Intro lines")}
              entries={listValue(section.props.lines).filter((item): item is Record<string, string> => typeof item === "object" && item !== null) as Array<Record<string, string>>}
              fields={[
                { key: "text", label: "Text (ZH)" },
                { key: "textEn", label: "Text (EN)" },
                { key: "emoji", label: "Emoji" },
                { key: "suffix", label: "Suffix (ZH)" },
                { key: "suffixEn", label: "Suffix (EN)" }
              ]}
              onChange={(next) => replaceArrayField(section.id ?? "", "lines", next)}
            />
          ) : null}
          <TextAreaField label={t("Markdown 正文", "Markdown body")} value={String(section.props.bodyMarkdown ?? "")} onChange={(value) => updateProps({ bodyMarkdown: value })} rows={10} />
        </>
      ) : null}

      {section.type === "feature_grid" ? (
        <>
          <TextField label={t("区块标题（中文）", "Section title (ZH)")} value={String(section.props.titleZh ?? section.props.title ?? "")} onChange={(value) => updateProps({ titleZh: value })} />
          <TextField label={t("区块标题（英文）", "Section title (EN)")} value={String(section.props.titleEn ?? "")} onChange={(value) => updateProps({ titleEn: value })} />
          {section.variant === "home-bento-reference" ? (
            <HomeGridEditor entries={homeGridEntries} onChange={(next) => replaceArrayField(section.id ?? "", "items", next)} />
          ) : (
            <ArrayObjectEditor
              title={t("条目", "Items")}
              entries={items}
              fields={[
                { key: "eyebrow", label: "Eyebrow" },
                { key: "eyebrowZh", label: "Eyebrow (ZH)" },
                { key: "eyebrowEn", label: "Eyebrow (EN)" },
                { key: "layoutKey", label: "Layout key" },
                { key: "cardType", label: "Card type" },
                { key: "title", label: "Title" },
                { key: "titleZh", label: "Title (ZH)" },
                { key: "titleEn", label: "Title (EN)" },
                { key: "headline", label: "Headline" },
                { key: "headlineZh", label: "Headline (ZH)" },
                { key: "headlineEn", label: "Headline (EN)" },
                { key: "subheadline", label: "Subheadline", multiline: true },
                { key: "subheadlineZh", label: "Subheadline (ZH)", multiline: true },
                { key: "subheadlineEn", label: "Subheadline (EN)", multiline: true },
                { key: "description", label: "Description", multiline: true },
                { key: "descriptionZh", label: "Description (ZH)", multiline: true },
                { key: "descriptionEn", label: "Description (EN)", multiline: true },
                { key: "href", label: "Href" },
                { key: "externalHref", label: "External href" },
                { key: "external", label: "External (true/false)" },
                { key: "ctaLabel", label: "CTA label" },
                { key: "ctaLabelZh", label: "CTA label (ZH)" },
                { key: "ctaLabelEn", label: "CTA label (EN)" },
                { key: "meta", label: "Meta" },
                { key: "metaZh", label: "Meta (ZH)" },
                { key: "metaEn", label: "Meta (EN)" },
                { key: "emoji", label: "Emoji" },
                { key: "icon", label: "Icon" },
                { key: "avatar", label: "Avatar" },
                { key: "overlayTitle", label: "Overlay title" },
                { key: "overlayTitleZh", label: "Overlay title (ZH)" },
                { key: "overlayTitleEn", label: "Overlay title (EN)" },
                { key: "overlayMeta", label: "Overlay meta" },
                { key: "overlayMetaZh", label: "Overlay meta (ZH)" },
                { key: "overlayMetaEn", label: "Overlay meta (EN)" },
                { key: "overlayTone", label: "Overlay tone" },
                { key: "accentColor", label: "Accent color" },
                { key: "size", label: "Size" },
                { key: "tone", label: "Tone" },
                { key: "image", label: "Image URL" },
                { key: "gridAreaLg", label: "Grid area lg" },
                { key: "gridAreaSm", label: "Grid area sm" }
              ]}
              onChange={(next) => replaceArrayField(section.id ?? "", "items", next)}
            />
          )}
        </>
      ) : null}

      {section.type === "featured_posts" ? (
        <>
          <TextField label={t("标题（中文）", "Title (ZH)")} value={String(section.props.titleZh ?? section.props.title ?? "")} onChange={(value) => updateProps({ titleZh: value })} />
          <TextField label={t("标题（英文）", "Title (EN)")} value={String(section.props.titleEn ?? "")} onChange={(value) => updateProps({ titleEn: value })} />
          <TextAreaField label={t("描述（中文）", "Description (ZH)")} value={String(section.props.descriptionZh ?? section.props.description ?? "")} onChange={(value) => updateProps({ descriptionZh: value })} />
          <TextAreaField label={t("描述（英文）", "Description (EN)")} value={String(section.props.descriptionEn ?? "")} onChange={(value) => updateProps({ descriptionEn: value })} />
          <label className="grid gap-1">
            <FieldLabel>{t("精选文章", "Featured posts")}</FieldLabel>
            <select
              multiple
              value={(Array.isArray(section.props.slugs) ? section.props.slugs : []).filter((item): item is string => typeof item === "string")}
              onChange={(event) =>
                updateProps({
                  slugs: Array.from(event.target.selectedOptions).map((option) => option.value)
                })
              }
              className="min-h-[8rem] rounded-xs border border-border bg-surface px-3 py-2 text-sm outline-none"
            >
              {posts.map((post) => (
                <option key={post.slug} value={post.slug}>
                  {post.title}
                </option>
              ))}
            </select>
          </label>
        </>
      ) : null}

      {section.type === "project_directory" ? (
        <>
          <TextField label={t("标题（中文）", "Title (ZH)")} value={String(section.props.titleZh ?? section.props.title ?? "")} onChange={(value) => updateProps({ titleZh: value })} />
          <TextField label={t("标题（英文）", "Title (EN)")} value={String(section.props.titleEn ?? "")} onChange={(value) => updateProps({ titleEn: value })} />
          <TextAreaField label={t("描述（中文）", "Description (ZH)")} value={String(section.props.descriptionZh ?? section.props.description ?? "")} onChange={(value) => updateProps({ descriptionZh: value })} />
          <TextAreaField label={t("描述（英文）", "Description (EN)")} value={String(section.props.descriptionEn ?? "")} onChange={(value) => updateProps({ descriptionEn: value })} />
        </>
      ) : null}

      {section.type === "quote_panel" ? (
        <>
          <TextAreaField label={t("引语（中文）", "Quote (ZH)")} value={String(section.props.quoteZh ?? section.props.quote ?? "")} onChange={(value) => updateProps({ quoteZh: value })} rows={5} />
          <TextAreaField label={t("引语（英文）", "Quote (EN)")} value={String(section.props.quoteEn ?? "")} onChange={(value) => updateProps({ quoteEn: value })} rows={5} />
          <TextField label={t("出处（中文）", "Citation (ZH)")} value={String(section.props.citationZh ?? section.props.citation ?? "")} onChange={(value) => updateProps({ citationZh: value })} />
          <TextField label={t("出处（英文）", "Citation (EN)")} value={String(section.props.citationEn ?? "")} onChange={(value) => updateProps({ citationEn: value })} />
        </>
      ) : null}

      {section.type === "link_cluster" ? (
        <>
          {section.variant === "footer-columns-reference" ? (
            <>
              <TextAreaField
                label={t("品牌描述（中文）", "Brand description (ZH)")}
                value={String(section.props.brandDescriptionZh ?? section.props.brandDescription ?? "")}
                onChange={(value) => updateProps({ brandDescriptionZh: value })}
                rows={3}
              />
              <TextAreaField
                label={t("品牌描述（英文）", "Brand description (EN)")}
                value={String(section.props.brandDescriptionEn ?? "")}
                onChange={(value) => updateProps({ brandDescriptionEn: value })}
                rows={3}
              />
              <TextField
                label={t("版权说明（中文）", "Legal line (ZH)")}
                value={String(section.props.legalLineZh ?? section.props.legalLine ?? "")}
                onChange={(value) => updateProps({ legalLineZh: value })}
              />
              <TextField label={t("版权说明（英文）", "Legal line (EN)")} value={String(section.props.legalLineEn ?? "")} onChange={(value) => updateProps({ legalLineEn: value })} />
              <ArrayObjectEditor
                title={t("社交链接", "Social links")}
                entries={listValue(section.props.socialLinks).filter((item): item is Record<string, string> => typeof item === "object" && item !== null) as Array<Record<string, string>>}
                fields={[
                  { key: "label", label: "Label" },
                  { key: "labelZh", label: "Label (ZH)" },
                  { key: "labelEn", label: "Label (EN)" },
                  { key: "href", label: "Href" },
                  { key: "external", label: "External (true/false)" }
                ]}
                onChange={(next) => replaceArrayField(section.id ?? "", "socialLinks", next)}
              />
              <FooterColumnsEditor
                columns={footerColumns}
                onChange={(next) => updateProps({ columns: next })}
              />
              <ArrayObjectEditor
                title={t("法律链接", "Legal links")}
                entries={listValue(section.props.legalLinks).filter((item): item is Record<string, string> => typeof item === "object" && item !== null) as Array<Record<string, string>>}
                fields={[
                  { key: "label", label: "Label" },
                  { key: "labelZh", label: "Label (ZH)" },
                  { key: "labelEn", label: "Label (EN)" },
                  { key: "href", label: "Href" },
                  { key: "external", label: "External (true/false)" }
                ]}
                onChange={(next) => replaceArrayField(section.id ?? "", "legalLinks", next)}
              />
            </>
          ) : (
            <>
              <TextField label={t("标题（中文）", "Title (ZH)")} value={String(section.props.titleZh ?? section.props.title ?? "")} onChange={(value) => updateProps({ titleZh: value })} />
              <TextField label={t("标题（英文）", "Title (EN)")} value={String(section.props.titleEn ?? "")} onChange={(value) => updateProps({ titleEn: value })} />
              <ArrayObjectEditor
                title={t("链接条目", "Links")}
                entries={links}
                fields={[
                  { key: "label", label: "Label" },
                  { key: "labelZh", label: "Label (ZH)" },
                  { key: "labelEn", label: "Label (EN)" },
                  { key: "href", label: "Href" },
                  { key: "description", label: "Description", multiline: true },
                  { key: "descriptionZh", label: "Description (ZH)", multiline: true },
                  { key: "descriptionEn", label: "Description (EN)", multiline: true }
                ]}
                onChange={(next) => replaceArrayField(section.id ?? "", "links", next)}
              />
            </>
          )}
        </>
      ) : null}

      {section.type === "image_story" ? (
        <>
          <TextField label={t("眉注（中文）", "Eyebrow (ZH)")} value={String(section.props.eyebrowZh ?? section.props.eyebrow ?? "")} onChange={(value) => updateProps({ eyebrowZh: value })} />
          <TextField label={t("眉注（英文）", "Eyebrow (EN)")} value={String(section.props.eyebrowEn ?? "")} onChange={(value) => updateProps({ eyebrowEn: value })} />
          <TextField label={t("标题（中文）", "Title (ZH)")} value={String(section.props.titleZh ?? section.props.title ?? "")} onChange={(value) => updateProps({ titleZh: value })} />
          <TextField label={t("标题（英文）", "Title (EN)")} value={String(section.props.titleEn ?? "")} onChange={(value) => updateProps({ titleEn: value })} />
          <TextAreaField label={t("正文（中文）", "Body (ZH)")} value={String(section.props.bodyZh ?? section.props.body ?? "")} onChange={(value) => updateProps({ bodyZh: value })} />
          <TextAreaField label={t("正文（英文）", "Body (EN)")} value={String(section.props.bodyEn ?? "")} onChange={(value) => updateProps({ bodyEn: value })} />
          <label className="grid gap-1">
            <FieldLabel>{t("图片资源", "Image asset")}</FieldLabel>
            <select
              value={mediaAssets.find((asset) => asset.url === section.props.image)?.url ?? String(section.props.image ?? "")}
              onChange={(event) => {
                const asset = mediaAssets.find((entry) => entry.url === event.target.value);
                updateProps({
                  image: asset?.url ?? event.target.value,
                  alt: asset?.alt ?? String(section.props.alt ?? "")
                });
              }}
              className="rounded-xs border border-border bg-surface px-3 py-2 text-sm outline-none"
            >
              <option value={String(section.props.image ?? "")}>{t("当前图片", "Current image")}</option>
              {mediaAssets.map((asset) => (
                <option key={asset.id} value={asset.url}>
                  {asset.alt || asset.key}
                </option>
              ))}
            </select>
          </label>
          <TextField label={t("图片链接", "Image URL")} value={String(section.props.image ?? "")} onChange={(value) => updateProps({ image: value })} />
          <TextField label={t("替代文本", "Alt text")} value={String(section.props.alt ?? "")} onChange={(value) => updateProps({ alt: value })} />
        </>
      ) : null}

      {section.type === "timeline" ? (
        <>
          <TextField label={t("标题（中文）", "Title (ZH)")} value={String(section.props.titleZh ?? section.props.title ?? "")} onChange={(value) => updateProps({ titleZh: value })} />
          <TextField label={t("标题（英文）", "Title (EN)")} value={String(section.props.titleEn ?? "")} onChange={(value) => updateProps({ titleEn: value })} />
          <ArrayObjectEditor
            title={t("时间线条目", "Timeline items")}
            entries={items}
            fields={[
              { key: "meta", label: "Meta" },
              { key: "metaZh", label: "Meta (ZH)" },
              { key: "metaEn", label: "Meta (EN)" },
              { key: "title", label: "Title" },
              { key: "titleZh", label: "Title (ZH)" },
              { key: "titleEn", label: "Title (EN)" },
              { key: "body", label: "Body", multiline: true },
              { key: "bodyZh", label: "Body (ZH)", multiline: true },
              { key: "bodyEn", label: "Body (EN)", multiline: true }
            ]}
            onChange={(next) => replaceArrayField(section.id ?? "", "items", next)}
          />
        </>
      ) : null}

      {section.type === "contact_strip" ? (
        <>
          <TextField label={t("标题（中文）", "Title (ZH)")} value={String(section.props.titleZh ?? section.props.title ?? "")} onChange={(value) => updateProps({ titleZh: value })} />
          <TextField label={t("标题（英文）", "Title (EN)")} value={String(section.props.titleEn ?? "")} onChange={(value) => updateProps({ titleEn: value })} />
          <TextAreaField label={t("正文（中文）", "Body (ZH)")} value={String(section.props.bodyZh ?? section.props.body ?? "")} onChange={(value) => updateProps({ bodyZh: value })} />
          <TextAreaField label={t("正文（英文）", "Body (EN)")} value={String(section.props.bodyEn ?? "")} onChange={(value) => updateProps({ bodyEn: value })} />
          <ArrayObjectEditor
            title={t("链接列表", "Links")}
            entries={links}
            fields={[
              { key: "label", label: "Label" },
              { key: "labelZh", label: "Label (ZH)" },
              { key: "labelEn", label: "Label (EN)" },
              { key: "href", label: "Href" }
            ]}
            onChange={(next) => replaceArrayField(section.id ?? "", "links", next)}
          />
        </>
      ) : null}

      {section.type === "custom_html" ? (
        <>
          <TextField label={t("标题（中文）", "Title (ZH)")} value={String(section.props.titleZh ?? section.props.title ?? "")} onChange={(value) => updateProps({ titleZh: value })} />
          <TextField label={t("标题（英文）", "Title (EN)")} value={String(section.props.titleEn ?? "")} onChange={(value) => updateProps({ titleEn: value })} />
          <TextAreaField
            label={t("自定义 HTML（中文）", "Custom HTML (ZH)")}
            value={String(section.props.htmlZh ?? section.props.html ?? "")}
            onChange={(value) => updateProps({ htmlZh: value })}
            rows={10}
          />
          <TextAreaField label={t("自定义 HTML（英文）", "Custom HTML (EN)")} value={String(section.props.htmlEn ?? "")} onChange={(value) => updateProps({ htmlEn: value })} rows={10} />
          <p className="text-xs text-muted">{t("自定义 HTML 只渲染页面模块内容，站点顶栏仍然保留。", "Custom HTML only renders the page module content. The public site header stays intact.")}</p>
        </>
      ) : null}

      {advancedMode ? (
        <div className="grid gap-2 border-t hairline pt-4">
          <TextAreaField label={t("原始属性 JSON", "Raw props JSON")} value={rawProps} onChange={(value) => setRawProps(value)} rows={12} />
          <button
            type="button"
            className="studio-button"
            onClick={() => {
              try {
                const parsed = JSON.parse(rawProps) as Record<string, unknown>;
                updateSection(section.id ?? "", (current) => ({
                  ...current,
                  props: parsed
                }));
                setRawPropsError(null);
              } catch {
                setRawPropsError(t("JSON 解析失败，请检查格式。", "JSON parsing failed. Please check the format."));
              }
            }}
          >
            {t("应用 JSON", "Apply JSON")}
          </button>
          {rawPropsError ? <p className="text-xs text-rose-600 dark:text-rose-300">{rawPropsError}</p> : null}
        </div>
      ) : null}
      </div>
    </section>
  );
}

function TextField({
  label,
  value,
  onChange
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  const { t } = useStudioLocale();
  return (
    <label className="studio-label">
      <FieldLabel>{localizeStudioLabel(t, label)}</FieldLabel>
      <input value={value} onChange={(event) => onChange(event.target.value)} className="studio-input" />
    </label>
  );
}

function TextAreaField({
  label,
  value,
  onChange,
  rows = 6
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  rows?: number;
}) {
  const { t } = useStudioLocale();
  return (
    <label className="studio-label">
      <FieldLabel>{localizeStudioLabel(t, label)}</FieldLabel>
      <textarea rows={rows} value={value} onChange={(event) => onChange(event.target.value)} className="studio-textarea" />
    </label>
  );
}

function HomeGridEditor({
  entries,
  onChange
}: {
  entries: Array<Record<string, unknown>>;
  onChange: (next: Array<Record<string, unknown>>) => void;
}) {
  const { t } = useStudioLocale();
  const getText = (entry: Record<string, unknown>, key: string) => (typeof entry[key] === "string" ? (entry[key] as string) : "");
  const getLocalizedText = (entry: Record<string, unknown>, baseKey: string, locale: "Zh" | "En") =>
    getText(entry, `${baseKey}${locale}`) || getText(entry, baseKey);
  const getIconStackText = (entry: Record<string, unknown>) =>
    Array.isArray(entry.iconStack) ? (entry.iconStack as Array<unknown>).filter((value): value is string => typeof value === "string").join("\n") : "";
  const presetCards: Array<{
    key: string;
    nameZh: string;
    nameEn: string;
    descriptionZh: string;
    descriptionEn: string;
    create: () => Record<string, unknown>;
  }> = [
    {
      key: "infj",
      nameZh: "INFJ 卡片",
      nameEn: "INFJ card",
      descriptionZh: "保留你原来的主页人格卡片。",
      descriptionEn: "Keep your original personality card on home.",
      create: () => ({
        cardType: "mbti_card",
        layoutKey: `infj-${Date.now()}`,
        meta: "MBTI Personality Type",
        metaEn: "MBTI Personality Type",
        headline: "INFJ",
        headlineEn: "INFJ",
        overlayTitle: "提倡者",
        overlayTitleEn: "Advocate",
        ctaLabel: "了解更多",
        ctaLabelEn: "Learn more",
        externalHref: "https://www.16personalities.com/infj-personality",
        image: "/images/infj-reference.svg",
        gridAreaLg: "",
        gridAreaSm: ""
      })
    },
    {
      key: "tech-release",
      nameZh: "Tech Enthusiast 卡片",
      nameEn: "Tech Enthusiast card",
      descriptionZh: "当前首页左上角的技术标签卡片。",
      descriptionEn: "The top-left tech tag card used on home.",
      create: () => ({
        cardType: "text_stat_card",
        layoutKey: `tech-${Date.now()}`,
        headline: "📱💻⌨️🛠️\nTech\nEnthusiast",
        headlineEn: "📱💻⌨️🛠️\nTech\nEnthusiast",
        gridAreaLg: "",
        gridAreaSm: ""
      })
    },
    {
      key: "self-hoster",
      nameZh: "Self-hoster 卡片",
      nameEn: "Self-hoster card",
      descriptionZh: "当前首页实验室入口卡片。",
      descriptionEn: "The lab entry card used on home.",
      create: () => ({
        cardType: "cta_link_card",
        layoutKey: `self-hoster-${Date.now()}`,
        headline: "Self-\nhoster",
        headlineEn: "Self-\nhoster",
        subheadline: "Check Out\nMy lab",
        subheadlineEn: "Check Out\nMy lab",
        ctaLabel: "进入",
        ctaLabelEn: "Check out",
        href: "/lab",
        gridAreaLg: "",
        gridAreaSm: ""
      })
    },
    {
      key: "mbti",
      nameZh: "MBTI 卡片",
      nameEn: "MBTI card",
      descriptionZh: "适合人格、身份或角色标签。",
      descriptionEn: "For personality, identity, or role tags.",
      create: () => ({
        cardType: "mbti_card",
        layoutKey: `mbti-${Date.now()}`,
        meta: "MBTI",
        metaEn: "MBTI",
        headline: "INTJ",
        headlineEn: "INTJ",
        overlayTitle: "建筑师",
        overlayTitleEn: "Architect",
        ctaLabel: "查看说明",
        ctaLabelEn: "View details",
        externalHref: "",
        image: "/images/daydreamer-avatar.png",
        gridAreaLg: "",
        gridAreaSm: ""
      })
    },
    {
      key: "hometown-release",
      nameZh: "家乡卡片",
      nameEn: "Hometown card",
      descriptionZh: "当前首页的衢州地点图卡。",
      descriptionEn: "The Quzhou location card used on home.",
      create: () => ({
        cardType: "image_location_card",
        layoutKey: `hometown-${Date.now()}`,
        meta: "Hometown",
        metaEn: "Hometown",
        overlayTitle: "Quzhou,\nZhejiang",
        overlayTitleEn: "Quzhou,\nZhejiang",
        image: "/images/daydreamer-quzhou.jpeg",
        gridAreaLg: "",
        gridAreaSm: ""
      })
    },
    {
      key: "location",
      nameZh: "地点卡片",
      nameEn: "Location card",
      descriptionZh: "适合城市、驻地和位置展示。",
      descriptionEn: "For cities, bases, and location display.",
      create: () => ({
        cardType: "image_location_card",
        layoutKey: `location-${Date.now()}`,
        meta: "所在城市",
        metaEn: "Location",
        headline: "上海",
        headlineEn: "Shanghai",
        overlayTitle: "安静工作中",
        overlayTitleEn: "Working quietly",
        image: "/images/quiet-desk.png",
        href: "",
        externalHref: "",
        gridAreaLg: "",
        gridAreaSm: ""
      })
    },
    {
      key: "undergrad-release",
      nameZh: "大学卡片",
      nameEn: "University card",
      descriptionZh: "当前首页的 Human University 卡片。",
      descriptionEn: "The Human University card used on home.",
      create: () => ({
        cardType: "image_school_card",
        layoutKey: `undergrad-${Date.now()}`,
        meta: "Self-made",
        metaEn: "Self-made",
        overlayTitle: "Human\nUniversity",
        overlayTitleEn: "Human\nUniversity",
        image: "/images/daydreamer-hnu.jpg",
        overlayTone: "dark",
        gridAreaLg: "",
        gridAreaSm: ""
      })
    },
    {
      key: "map-release",
      nameZh: "地图卡片",
      nameEn: "Map card",
      descriptionZh: "当前首页的杭州地图卡片。",
      descriptionEn: "The Hangzhou map card used on home.",
      create: () => ({
        cardType: "map_card",
        layoutKey: `map-${Date.now()}`,
        meta: "Current Location",
        metaEn: "Current Location",
        overlayTitle: "Yuhang, Hangzhou",
        overlayTitleEn: "Yuhang, Hangzhou",
        image: "/images/daydreamer-map.png",
        overlayTone: "muted",
        gridAreaLg: "",
        gridAreaSm: ""
      })
    },
    {
      key: "campus-release",
      nameZh: "校园卡片",
      nameEn: "Campus card",
      descriptionZh: "当前首页的 HFI 校园图卡。",
      descriptionEn: "The HFI campus image card used on home.",
      create: () => ({
        cardType: "image_school_card",
        layoutKey: `campus-${Date.now()}`,
        meta: "Campus",
        metaEn: "Campus",
        overlayTitle: "I ❤️\nHFI!!!",
        overlayTitleEn: "I ❤️\nHFI!!!",
        image: "/images/daydreamer-changsha.jpg",
        overlayTone: "dark",
        gridAreaLg: "",
        gridAreaSm: ""
      })
    },
    {
      key: "creator-release",
      nameZh: "创造者卡片",
      nameEn: "Creator card",
      descriptionZh: "当前首页的技能栈创造者卡片。",
      descriptionEn: "The stacked creator card used on home.",
      create: () => ({
        cardType: "creator_card",
        layoutKey: `creator-${Date.now()}`,
        emoji: "👨‍💻",
        headline: "Creating\nSomething Cool.",
        headlineEn: "Creating\nSomething Cool.",
        meta: "持续创造",
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
        ],
        gridAreaLg: "",
        gridAreaSm: ""
      })
    },
    {
      key: "avatar-release",
      nameZh: "头像卡片",
      nameEn: "Avatar card",
      descriptionZh: "当前首页左下角头像卡片。",
      descriptionEn: "The bottom-left avatar card used on home.",
      create: () => ({
        cardType: "avatar_card",
        layoutKey: `avatar-${Date.now()}`,
        image: "/images/daydreamer-avatar.png",
        headline: "Avatar",
        headlineEn: "Avatar",
        gridAreaLg: "",
        gridAreaSm: ""
      })
    },
    {
      key: "resume-release",
      nameZh: "简历入口卡片",
      nameEn: "Resume card",
      descriptionZh: "当前首页右下角简历入口卡片。",
      descriptionEn: "The bottom-right resume entry card used on home.",
      create: () => ({
        cardType: "resume_link_card",
        layoutKey: `resume-${Date.now()}`,
        headline: "📄 My Resume",
        headlineEn: "📄 My Resume",
        ctaLabel: "打开",
        ctaLabelEn: "Open",
        href: "/resume",
        gridAreaLg: "",
        gridAreaSm: ""
      })
    },
    {
      key: "email-release",
      nameZh: "邮箱入口卡片",
      nameEn: "Email card",
      descriptionZh: "当前首页右下角邮箱入口卡片。",
      descriptionEn: "The bottom-right email entry card used on home.",
      create: () => ({
        cardType: "email_link_card",
        layoutKey: `email-${Date.now()}`,
        headline: "✉ me@skywt.eu",
        headlineEn: "✉ me@skywt.eu",
        ctaLabel: "发送邮件",
        ctaLabelEn: "Send Mail",
        href: "mailto:me@skywt.eu",
        external: "true",
        gridAreaLg: "",
        gridAreaSm: ""
      })
    },
    {
      key: "text",
      nameZh: "文字卡片",
      nameEn: "Text card",
      descriptionZh: "适合短句、主题表达和状态。",
      descriptionEn: "For short statements, themes, and status.",
      create: () => ({
        cardType: "text_stat_card",
        layoutKey: `text-${Date.now()}`,
        headline: "长期写作\n安静发布",
        headlineEn: "Long-form writing\nCalm publishing",
        subheadline: "",
        subheadlineEn: "",
        href: "",
        externalHref: "",
        gridAreaLg: "",
        gridAreaSm: ""
      })
    },
    {
      key: "statement",
      nameZh: "短句卡片",
      nameEn: "Statement card",
      descriptionZh: "适合一两行强调态度或表达。",
      descriptionEn: "For short bold statements or attitude blocks.",
      create: () => ({
        cardType: "small_statement_card",
        layoutKey: `statement-${Date.now()}`,
        headline: "不是一个\n❌\n做题家",
        headlineEn: "Not just a\n❌\nTest Taker",
        gridAreaLg: "",
        gridAreaSm: ""
      })
    },
    {
      key: "quote",
      nameZh: "引言卡片",
      nameEn: "Quote card",
      descriptionZh: "适合品牌语、宣言和一句话介绍。",
      descriptionEn: "For brand lines, manifestos, and short intros.",
      create: () => ({
        cardType: "quote_card",
        layoutKey: `quote-${Date.now()}`,
        headline: "安静发布，持续积累。",
        headlineEn: "Publish quietly, build over time.",
        subheadline: "为长期写作准备的结构、节奏与界面。",
        subheadlineEn: "Structure, cadence, and interfaces shaped for long-term writing.",
        quoteCitation: "Endless",
        quoteCitationEn: "Endless",
        gridAreaLg: "",
        gridAreaSm: ""
      })
    },
    {
      key: "about-cta",
      nameZh: "关于入口卡片",
      nameEn: "About CTA card",
      descriptionZh: "适合放在主页矩阵里的关于入口。",
      descriptionEn: "A playful CTA card for the home matrix.",
      create: () => ({
        cardType: "about_cta_card",
        layoutKey: `about-${Date.now()}`,
        headline: "了🤔解\n更多👉\n🌟↗👀",
        headlineEn: "Le🤔arn\nMore👉\n🌟↗👀",
        href: "/about",
        ctaLabel: "关于",
        ctaLabelEn: "About",
        gridAreaLg: "",
        gridAreaSm: ""
      })
    }
  ];

  function hasMissingEnglish(entry: Record<string, unknown>) {
    const required = ["headlineEn", "subheadlineEn", "metaEn", "ctaLabelEn", "overlayTitleEn"];
    return required.some((key) => {
      if (!(key in entry) && !(key.replace(/En$/, "") in entry)) {
        return false;
      }
      return !getText(entry, key).trim() && !getText(entry, key.replace(/En$/, "")).trim();
    });
  }

  function updateEntry(index: number, key: string, value: string) {
    onChange(entries.map((entry, entryIndex) => (entryIndex === index ? { ...entry, [key]: value } : entry)));
  }

  function updateIconStack(index: number, rawValue: string) {
    const nextValue = rawValue
      .split(/[\n,]+/)
      .map((item) => item.trim())
      .filter(Boolean);
    onChange(entries.map((entry, entryIndex) => (entryIndex === index ? { ...entry, iconStack: nextValue } : entry)));
  }

  function addPresetCard(factory: () => Record<string, unknown>) {
    onChange([...entries, factory()]);
  }

  function removeEntry(index: number) {
    onChange(entries.filter((_, entryIndex) => entryIndex !== index));
  }

  return (
    <div className="grid gap-3">
      <FieldLabel>{t("首页卡片", "Home cards")}</FieldLabel>
      <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
        {presetCards.map((preset) => (
          <button
            key={preset.key}
            type="button"
            onClick={() => addPresetCard(preset.create)}
            className="studio-note text-left transition hover:border-[var(--accent)]/40 hover:bg-[var(--panel-strong)]"
          >
            <div className="mb-1 text-sm font-medium text-foreground">{t(preset.nameZh, preset.nameEn)}</div>
            <div className="text-xs leading-6 text-muted">{t(preset.descriptionZh, preset.descriptionEn)}</div>
            <div className="mt-3 text-xs font-medium text-[var(--accent)]">{t("加入主页", "Add to home")}</div>
          </button>
        ))}
      </div>
      {entries.map((entry, index) => (
        <div
          key={`${getText(entry, "layoutKey") || getText(entry, "cardType") || "card"}-${index}`}
          className={`studio-note grid gap-3 ${hasMissingEnglish(entry) ? "ring-1 ring-amber-400/70 dark:ring-amber-300/60" : ""}`}
        >
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-sm font-medium text-foreground">{getText(entry, "layoutKey") || `${t("卡片", "Card")} ${index + 1}`}</div>
              <div className="text-xs text-muted">{getText(entry, "cardType") || t("卡片", "card")}</div>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-xs text-muted">{getText(entry, "gridAreaLg") || t("自动", "auto")}</div>
              <button type="button" onClick={() => removeEntry(index)} className="text-xs text-muted transition hover:text-foreground">
                {t("移除", "Remove")}
              </button>
            </div>
          </div>
          {hasMissingEnglish(entry) ? <p className="text-xs text-amber-700 dark:text-amber-300">{t("英文关键字段缺失，前台 EN 模式会出现占位词。", "Some required English fields are missing. The public EN mode will show fallback placeholders.")}</p> : null}
          <div className="grid gap-2">
            <TextField label="Headline (ZH)" value={getLocalizedText(entry, "headline", "Zh")} onChange={(value) => updateEntry(index, "headlineZh", value)} />
            <TextField label="Headline (EN)" value={getLocalizedText(entry, "headline", "En")} onChange={(value) => updateEntry(index, "headlineEn", value)} />
            <TextAreaField label="Subheadline (ZH)" value={getLocalizedText(entry, "subheadline", "Zh")} onChange={(value) => updateEntry(index, "subheadlineZh", value)} rows={3} />
            <TextAreaField label="Subheadline (EN)" value={getLocalizedText(entry, "subheadline", "En")} onChange={(value) => updateEntry(index, "subheadlineEn", value)} rows={3} />
            <div className="grid gap-2 md:grid-cols-2">
              <TextField label="Meta (ZH)" value={getLocalizedText(entry, "meta", "Zh")} onChange={(value) => updateEntry(index, "metaZh", value)} />
              <TextField label="Meta (EN)" value={getLocalizedText(entry, "meta", "En")} onChange={(value) => updateEntry(index, "metaEn", value)} />
            </div>
            <div className="grid gap-2 md:grid-cols-2">
              <TextField label="Card type" value={getText(entry, "cardType")} onChange={(value) => updateEntry(index, "cardType", value)} />
              <TextField label="Layout key" value={getText(entry, "layoutKey")} onChange={(value) => updateEntry(index, "layoutKey", value)} />
            </div>
            <div className="grid gap-2 md:grid-cols-2">
              <TextField label="Overlay title (ZH)" value={getLocalizedText(entry, "overlayTitle", "Zh")} onChange={(value) => updateEntry(index, "overlayTitleZh", value)} />
              <TextField label="Overlay title (EN)" value={getLocalizedText(entry, "overlayTitle", "En")} onChange={(value) => updateEntry(index, "overlayTitleEn", value)} />
            </div>
            <div className="grid gap-2 md:grid-cols-2">
              <TextField label="CTA (ZH)" value={getLocalizedText(entry, "ctaLabel", "Zh")} onChange={(value) => updateEntry(index, "ctaLabelZh", value)} />
              <TextField label="CTA (EN)" value={getLocalizedText(entry, "ctaLabel", "En")} onChange={(value) => updateEntry(index, "ctaLabelEn", value)} />
            </div>
            <div className="grid gap-2 md:grid-cols-2">
              <TextField label="Quote citation (ZH)" value={getLocalizedText(entry, "quoteCitation", "Zh")} onChange={(value) => updateEntry(index, "quoteCitationZh", value)} />
              <TextField label="Quote citation (EN)" value={getLocalizedText(entry, "quoteCitation", "En")} onChange={(value) => updateEntry(index, "quoteCitationEn", value)} />
            </div>
            <TextField label="Image / background URL" value={getText(entry, "image")} onChange={(value) => updateEntry(index, "image", value)} />
            <TextAreaField
              label="Icon stack"
              value={getIconStackText(entry)}
              onChange={(value) => updateIconStack(index, value)}
              rows={4}
            />
            <div className="grid gap-2 md:grid-cols-2">
              <TextField label="Href" value={getText(entry, "href")} onChange={(value) => updateEntry(index, "href", value)} />
              <TextField label="External href" value={getText(entry, "externalHref")} onChange={(value) => updateEntry(index, "externalHref", value)} />
            </div>
            <div className="grid gap-2 md:grid-cols-2">
              <TextField label="Desktop grid area" value={getText(entry, "gridAreaLg")} onChange={(value) => updateEntry(index, "gridAreaLg", value)} />
              <TextField label="Mobile grid area" value={getText(entry, "gridAreaSm")} onChange={(value) => updateEntry(index, "gridAreaSm", value)} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function FooterColumnsEditor({
  columns,
  onChange
}: {
  columns: Array<Record<string, unknown>>;
  onChange: (next: Array<Record<string, unknown>>) => void;
}) {
  const { t } = useStudioLocale();
  const normalized = columns.map((column) => ({
    title: typeof column.title === "string" ? column.title : "",
    titleZh: typeof column.titleZh === "string" ? column.titleZh : "",
    titleEn: typeof column.titleEn === "string" ? column.titleEn : "",
    links: Array.isArray(column.links)
      ? column.links
          .filter((entry): entry is Record<string, unknown> => typeof entry === "object" && entry !== null)
          .map((entry) => ({
            label: typeof entry.label === "string" ? entry.label : "",
            labelZh: typeof entry.labelZh === "string" ? entry.labelZh : "",
            labelEn: typeof entry.labelEn === "string" ? entry.labelEn : "",
            href: typeof entry.href === "string" ? entry.href : "",
            external: typeof entry.external === "string" ? entry.external : ""
          }))
      : []
  }));

  function updateColumn(
    index: number,
    updater: (column: {
      title: string;
      titleZh: string;
      titleEn: string;
      links: Array<{ label: string; labelZh: string; labelEn: string; href: string; external: string }>;
    }) => {
      title: string;
      titleZh: string;
      titleEn: string;
      links: Array<{ label: string; labelZh: string; labelEn: string; href: string; external: string }>;
    }
  ) {
    const next = normalized.map((column, columnIndex) => (columnIndex === index ? updater(column) : column));
    onChange(next.map((column) => ({ ...column })));
  }

  function addColumn() {
    onChange([
      ...normalized.map((column) => ({ ...column })),
      { title: "", titleZh: "", titleEn: "", links: [] }
    ]);
  }

  function removeColumn(index: number) {
    onChange(normalized.filter((_, columnIndex) => columnIndex !== index).map((column) => ({ ...column })));
  }

  return (
    <div className="grid gap-3">
      <div className="flex items-center justify-between">
        <FieldLabel>{t("页脚列", "Footer columns")}</FieldLabel>
        <button type="button" onClick={addColumn} className="text-xs text-muted transition hover:text-foreground">
          {t("新增列", "Add column")}
        </button>
      </div>
      {normalized.map((column, index) => (
        <div key={`footer-column-${index}`} className="studio-note grid gap-2">
          <div className="mb-1 flex items-center justify-between">
            <div className="text-xs text-muted">{t("列", "Column")} {index + 1}</div>
            <button type="button" onClick={() => removeColumn(index)} className="text-xs text-muted transition hover:text-foreground">
              {t("移除", "Remove")}
            </button>
          </div>
          <TextField label={t("标题", "Title")} value={column.title} onChange={(value) => updateColumn(index, (current) => ({ ...current, title: value }))} />
          <TextField label="Title (ZH)" value={column.titleZh} onChange={(value) => updateColumn(index, (current) => ({ ...current, titleZh: value }))} />
          <TextField label="Title (EN)" value={column.titleEn} onChange={(value) => updateColumn(index, (current) => ({ ...current, titleEn: value }))} />
          <ArrayObjectEditor
            title={t("列链接", "Column links")}
            entries={column.links}
            fields={[
              { key: "label", label: "Label" },
              { key: "labelZh", label: "Label (ZH)" },
              { key: "labelEn", label: "Label (EN)" },
              { key: "href", label: "Href" },
              { key: "external", label: "External (true/false)" }
            ]}
            onChange={(nextLinks) =>
              updateColumn(index, (current) => ({
                ...current,
                links: nextLinks.map((entry) => ({
                  label: entry.label ?? "",
                  labelZh: entry.labelZh ?? "",
                  labelEn: entry.labelEn ?? "",
                  href: entry.href ?? "",
                  external: entry.external ?? ""
                }))
              }))
            }
          />
        </div>
      ))}
    </div>
  );
}

function ArrayObjectEditor({
  title,
  entries,
  fields,
  onChange
}: {
  title: string;
  entries: Array<Record<string, string>>;
  fields: Array<{ key: string; label: string; multiline?: boolean }>;
  onChange: (next: Array<Record<string, string>>) => void;
}) {
  const { t } = useStudioLocale();
  function updateEntry(index: number, key: string, value: string) {
    const next = entries.map((entry, entryIndex) => (entryIndex === index ? { ...entry, [key]: value } : entry));
    onChange(next);
  }

  function addEntry() {
    const next = [...entries, Object.fromEntries(fields.map((field) => [field.key, ""]))];
    onChange(next);
  }

  function removeEntry(index: number) {
    onChange(entries.filter((_, entryIndex) => entryIndex !== index));
  }

  return (
    <div className="grid gap-2">
      <div className="flex items-center justify-between">
        <FieldLabel>{localizeStudioLabel(t, title)}</FieldLabel>
        <button type="button" onClick={addEntry} className="text-xs text-muted transition hover:text-foreground">
          {t("新增", "Add")}
        </button>
      </div>
      <div className="grid gap-3">
        {entries.map((entry, index) => (
          <div key={`${title}-${index}`} className="studio-note">
            <div className="mb-3 flex items-center justify-between">
              <div className="text-xs text-muted">{t("条目", "Item")} {index + 1}</div>
              <button type="button" onClick={() => removeEntry(index)} className="text-xs text-muted transition hover:text-foreground">
                {t("移除", "Remove")}
              </button>
            </div>
            <div className="grid gap-2">
              {fields.map((field) => (
                <label key={field.key} className="studio-label">
                  <FieldLabel>{localizeStudioLabel(t, field.label)}</FieldLabel>
                  {field.multiline ? (
                    <textarea rows={4} value={entry[field.key] ?? ""} onChange={(event) => updateEntry(index, field.key, event.target.value)} className="studio-textarea" />
                  ) : (
                    <input value={entry[field.key] ?? ""} onChange={(event) => updateEntry(index, field.key, event.target.value)} className="studio-input" />
                  )}
                </label>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
