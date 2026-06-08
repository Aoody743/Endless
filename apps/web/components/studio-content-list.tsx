"use client";

import type { ContentRecord, StudioConfigRecord } from "@endless/content";
import Link from "next/link";
import { Archive, CheckSquare2, CirclePlus, GripVertical, PencilLine, Plus, Sparkles, Trash2 } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import type { DragEvent as ReactDragEvent } from "react";
import { useEffect, useMemo, useState, useTransition } from "react";
import { contentStatusOptions } from "@/lib/studio";
import { useStudioLocale } from "./studio-locale";

interface StudioContentListProps {
  items: ContentRecord[];
  selectedStatus?: string;
  query?: string;
  mode?: "all" | "writing" | "pages";
  siteSnapshot?: {
    name: string;
    title: string;
    description: string;
    url: string;
    author: string;
    language: string;
  };
  studioSnapshot?: StudioConfigRecord;
  templatePages?: {
    home?: ContentRecord;
    about?: ContentRecord;
    lab?: ContentRecord;
    friends?: ContentRecord;
    thoughts?: ContentRecord;
    links?: ContentRecord;
    photos?: ContentRecord;
    resume?: ContentRecord;
    comments?: ContentRecord;
  };
}

type NavEntry = {
  key: string;
  label: string;
  id?: string;
  status?: string;
};

type ManagedPageRow =
  | {
      kind: "page";
      item: ContentRecord;
      navKey: string | null;
      navIndex: number;
      inNav: boolean;
      publicHref: string | null;
    }
  | {
      kind: "preset";
      entry: NavEntry;
      navIndex: number;
    };

function dateLabel(value: string | undefined, locale: "zh" | "en") {
  if (!value) return "-";
  return new Intl.DateTimeFormat(locale === "en" ? "en-US" : "zh-CN", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

function slugPreset(key: string) {
  if (key === "home") return "home";
  if (key === "about") return "about";
  if (key === "lab") return "lab";
  if (key === "friends") return "friends";
  if (key === "photos") return "photos";
  if (key === "resume") return "resume";
  if (key === "comments") return "comments";
  if (key === "links") return "links";
  return "thoughts";
}

function statusLabel(status: ContentRecord["status"], locale: "zh" | "en") {
  if (locale === "en") {
    if (status === "PUBLISHED") return "published";
    if (status === "SCHEDULED") return "scheduled";
    if (status === "ARCHIVED") return "archived";
    return "draft";
  }
  if (status === "PUBLISHED") return "已发布";
  if (status === "SCHEDULED") return "定时发布";
  if (status === "ARCHIVED") return "已归档";
  return "草稿";
}

function typeLabel(type: ContentRecord["type"], locale: "zh" | "en") {
  if (locale === "en") return type === "PAGE" ? "page" : "post";
  return type === "PAGE" ? "页面" : "文章";
}

function navKeyForItem(item: ContentRecord) {
  const slug = item.slug.trim().toLowerCase();
  if (item.templateKey === "HOME" || slug === "home") return "home";
  if (item.templateKey === "ABOUT" || slug === "about") return "about";
  if (item.templateKey === "LAB" || slug === "lab") return "lab";
  if (slug === "friends") return "friends";
  if (slug === "thoughts") return "thoughts";
  if (slug === "links") return "links";
  if (slug === "photos") return "photos";
  if (slug === "resume") return "resume";
  if (slug === "comments") return "comments";
  return null;
}

function publicHrefForPage(item: ContentRecord) {
  if (item.type !== "PAGE") {
    return null;
  }
  if (item.templateKey === "HOME" || item.slug === "home") return "/";
  if (item.templateKey === "ABOUT" || item.slug === "about") return "/about";
  if (item.templateKey === "LAB" || item.slug === "lab") return "/lab";
  return `/${item.slug}`;
}

export function StudioContentList({
  items,
  selectedStatus = "ALL",
  query = "",
  mode = "all",
  siteSnapshot,
  studioSnapshot,
  templatePages
}: StudioContentListProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { locale, t } = useStudioLocale();
  const [pending, startTransition] = useTransition();
  const [selected, setSelected] = useState<string[]>([]);
  const [navOrder, setNavOrder] = useState<NavEntry[]>([]);
  const [draggingNavKey, setDraggingNavKey] = useState<string | null>(null);
  const [dragOverNavKey, setDragOverNavKey] = useState<string | null>(null);
  const [dragOverList, setDragOverList] = useState(false);
  const [orderSaving, setOrderSaving] = useState(false);
  const [creatingPresetKey, setCreatingPresetKey] = useState<string | null>(null);
  const selectedSet = useMemo(() => new Set(selected), [selected]);
  const drafts = items.filter((item) => item.status === "DRAFT").slice(0, 8);
  const basePath = mode === "pages" ? "/studio/pages" : mode === "writing" ? "/studio/writing" : "/studio/content";
  const navCatalog = useMemo<NavEntry[]>(
    () => [
      { key: "home", label: t("首页", "Home"), id: templatePages?.home?.id, status: templatePages?.home?.status },
      { key: "blog", label: t("博客", "Blog") },
      { key: "lab", label: t("实验室", "Lab"), id: templatePages?.lab?.id, status: templatePages?.lab?.status },
      { key: "friends", label: t("友链", "Friends"), id: templatePages?.friends?.id, status: templatePages?.friends?.status },
      { key: "about", label: t("关于", "About"), id: templatePages?.about?.id, status: templatePages?.about?.status },
      { key: "thoughts", label: t("朋友圈", "Moments"), id: templatePages?.thoughts?.id, status: templatePages?.thoughts?.status },
      { key: "links", label: t("链接", "Links"), id: templatePages?.links?.id, status: templatePages?.links?.status },
      { key: "photos", label: t("照片墙", "Photos"), id: templatePages?.photos?.id, status: templatePages?.photos?.status },
      { key: "resume", label: t("简历", "Resume"), id: templatePages?.resume?.id, status: templatePages?.resume?.status },
      { key: "comments", label: t("评论", "Comments"), id: templatePages?.comments?.id, status: templatePages?.comments?.status }
    ],
    [t, templatePages]
  );
  const navCatalogMap = useMemo(() => new Map(navCatalog.map((entry) => [entry.key, entry])), [navCatalog]);

  const templates = useMemo(
    () => [
      { key: "home", label: t("首页", "Home"), note: t("首页", "Home"), item: templatePages?.home },
      { key: "about", label: t("关于", "About"), note: t("关于页", "About page"), item: templatePages?.about },
      { key: "lab", label: t("实验室", "Lab"), note: t("实验室页", "Lab page"), item: templatePages?.lab },
      { key: "friends", label: t("友链", "Friends"), note: t("友情链接页", "Friends page"), item: templatePages?.friends },
      { key: "links", label: t("链接", "Friend Links"), note: t("友情链接页面预设", "Preset: friend links"), item: templatePages?.links },
      { key: "photos", label: t("照片墙", "Photo Wall"), note: t("照片墙页面预设", "Preset: photo wall"), item: templatePages?.photos },
      { key: "resume", label: t("简历", "Resume"), note: t("个人简历页面预设", "Preset: resume"), item: templatePages?.resume },
      { key: "comments", label: t("评论", "Comments"), note: t("评论管理页面预设", "Preset: comments"), item: templatePages?.comments },
      { key: "thoughts", label: t("朋友圈", "Moments"), note: t("朋友圈思想页", "Moments / Thoughts feed"), item: templatePages?.thoughts }
    ],
    [t, templatePages]
  );
  const defaultNavigationKeys = useMemo(() => ["home", "blog", "lab", "friends", "about", "thoughts"], []);
  const savedNavKeys = useMemo(() => {
    return studioSnapshot?.navigationOrder?.length ? studioSnapshot.navigationOrder : defaultNavigationKeys;
  }, [defaultNavigationKeys, studioSnapshot?.navigationOrder]);
  const navDirty = useMemo(() => {
    if (savedNavKeys.length !== navOrder.length) return true;
    return savedNavKeys.some((key, index) => navOrder[index]?.key !== key);
  }, [navOrder, savedNavKeys]);
  const navKeySet = useMemo(() => new Set(navOrder.map((entry) => entry.key)), [navOrder]);
  const availableTemplates = useMemo(() => templates.filter((entry) => !navKeySet.has(entry.key)), [navKeySet, templates]);

  useEffect(() => {
    const sourceOrder = studioSnapshot?.navigationOrder?.length ? studioSnapshot.navigationOrder : defaultNavigationKeys;
    const ordered = sourceOrder
      .map((key) => navCatalogMap.get(key))
      .filter((entry): entry is NavEntry => Boolean(entry));
    setNavOrder(ordered);
  }, [defaultNavigationKeys, navCatalogMap, studioSnapshot?.navigationOrder]);

  function updateFilters(next: Partial<{ status: string; q: string }>) {
    const params = new URLSearchParams(searchParams.toString());
    if (next.status !== undefined) {
      next.status === "ALL" ? params.delete("status") : params.set("status", next.status);
    }
    if (next.q !== undefined) {
      next.q ? params.set("q", next.q) : params.delete("q");
    }
    startTransition(() => router.push(params.toString() ? `${basePath}?${params.toString()}` : basePath));
  }

  async function createContent(type: "POST" | "PAGE", workspace?: "ai" | "md") {
    const response = await fetch("/api/studio/content", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ type })
    });
    if (!response.ok) {
      window.alert(t("当前无法创建内容。", "Unable to create content right now."));
      return;
    }
    const data = (await response.json()) as { id: string };
    const suffix = workspace ? `?workspace=${workspace}` : "";
    router.push(`/studio/editor/${data.id}${suffix}`);
  }

  async function createAiPage() {
    const response = await fetch("/api/studio/content", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ type: "PAGE" })
    });
    if (!response.ok) {
      window.alert(t("当前无法创建页面。", "Unable to create page right now."));
      return;
    }
    const data = (await response.json()) as { id: string };
    router.push(`/studio/editor/${data.id}`);
  }

  async function ensurePresetPage(key: string) {
    const existingFromNav = navOrder.find((entry) => entry.key === key);
    if (existingFromNav?.id) {
      return existingFromNav;
    }
    const existingFromCatalog = navCatalogMap.get(key);
    if (existingFromCatalog?.id) {
      return existingFromCatalog;
    }
    setCreatingPresetKey(key);
    const response = await fetch("/api/studio/content", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ type: "PAGE", preset: slugPreset(key) })
    });
    if (!response.ok) {
      setCreatingPresetKey(null);
      window.alert(t("当前无法创建页面。", "Unable to create page right now."));
      return null;
    }
    const data = (await response.json()) as { id: string };
    const nextEntry: NavEntry = {
      key,
      label: navCatalogMap.get(key)?.label ?? key,
      id: data.id,
      status: "DRAFT"
    };
    setNavOrder((current) => current.map((entry) => (entry.key === key ? { ...entry, id: data.id, status: "DRAFT" } : entry)));
    setCreatingPresetKey(null);
    startTransition(() => router.refresh());
    return nextEntry;
  }

  async function createPresetPage(key: string) {
    const nextEntry = await ensurePresetPage(key);
    if (!nextEntry?.id) {
      return;
    }
    router.push(`/studio/editor/${nextEntry.id}`);
  }

  async function openOrCreateSpecialPage(kind: "thoughts" | "comments") {
    const existingId = kind === "thoughts" ? templatePages?.thoughts?.id : templatePages?.comments?.id;
    if (existingId) {
      router.push(`/studio/editor/${existingId}`);
      return;
    }
    const nextEntry = await ensurePresetPage(kind);
    if (!nextEntry?.id) {
      return;
    }
    router.push(`/studio/editor/${nextEntry.id}`);
  }

  async function runBatch(action: "hide" | "archive" | "delete") {
    if (!selected.length) return;
    if (action === "delete" && !window.confirm(t("确认删除选中内容？", "Delete selected content?"))) return;
    const response = await fetch("/api/studio/content/batch", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ ids: selected, action })
    });
    if (!response.ok) {
      window.alert(t("批量操作失败。", "Batch action failed."));
      return;
    }
    setSelected([]);
    startTransition(() => router.refresh());
  }

  function toggle(id: string | undefined) {
    if (!id) return;
    setSelected((current) => (current.includes(id) ? current.filter((entry) => entry !== id) : [...current, id]));
  }

  function moveOrder(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= navOrder.length) return;
    const next = [...navOrder];
    const [item] = next.splice(index, 1);
    if (!item) return;
    next.splice(target, 0, item);
    setNavOrder(next);
  }

  function currentDragKey(event?: Pick<DragEvent, "dataTransfer"> | Pick<ReactDragEvent, "dataTransfer">) {
    const transferKey = event?.dataTransfer?.getData("text/plain")?.trim();
    return transferKey || draggingNavKey;
  }

  function startDraggingNav(key: string, event?: Pick<DragEvent, "dataTransfer"> | Pick<ReactDragEvent, "dataTransfer">) {
    setDraggingNavKey(key);
    event?.dataTransfer?.setData("text/plain", key);
    if (event?.dataTransfer) {
      event.dataTransfer.effectAllowed = "move";
    }
  }

  function finishDraggingNav() {
    setDraggingNavKey(null);
    setDragOverNavKey(null);
    setDragOverList(false);
  }

  function removeDraggedFromNav(event?: Pick<DragEvent, "dataTransfer"> | Pick<ReactDragEvent, "dataTransfer">) {
    const sourceKey = currentDragKey(event);
    if (!sourceKey) return;
    setNavOrder((current) => current.filter((entry) => entry.key !== sourceKey));
    finishDraggingNav();
  }

  async function dropOrder(targetKey: string, event?: Pick<DragEvent, "dataTransfer"> | Pick<ReactDragEvent, "dataTransfer">) {
    const sourceKey = currentDragKey(event);
    if (!sourceKey || sourceKey === targetKey) return;
    const targetIndex = navOrder.findIndex((entry) => entry.key === targetKey);
    if (targetIndex < 0) return;
    let addingEntry = navCatalogMap.get(sourceKey);
    if (!addingEntry) return;
    if (!addingEntry.id && sourceKey !== "home" && sourceKey !== "blog") {
      const ensured = await ensurePresetPage(sourceKey);
      if (!ensured) return;
      addingEntry = ensured;
    }
    setNavOrder((current) => {
      const sourceIndex = current.findIndex((entry) => entry.key === sourceKey);
      if (sourceIndex < 0) {
        const next = [...current];
        next.splice(targetIndex, 0, addingEntry);
        return next;
      }
      const next = [...current];
      const [dragged] = next.splice(sourceIndex, 1);
      if (!dragged) return current;
      next.splice(targetIndex, 0, dragged);
      return next;
    });
    finishDraggingNav();
  }

  async function appendDraggedToNav(event?: Pick<DragEvent, "dataTransfer"> | Pick<ReactDragEvent, "dataTransfer">) {
    const sourceKey = currentDragKey(event);
    if (!sourceKey) return;
    let addingEntry = navCatalogMap.get(sourceKey);
    if (!addingEntry) return;
    if (!addingEntry.id && sourceKey !== "home" && sourceKey !== "blog") {
      const ensured = await ensurePresetPage(sourceKey);
      if (!ensured) return;
      addingEntry = ensured;
    }
    setNavOrder((current) => {
      if (current.some((entry) => entry.key === sourceKey)) {
        return current;
      }
      return [...current, addingEntry];
    });
    finishDraggingNav();
  }

  const managedPageRows = useMemo<ManagedPageRow[]>(() => {
    const pageBackedKeys = new Set(["home", "lab", "friends", "about", "thoughts", "links", "photos", "resume", "comments"]);
    const pageByNavKey = new Map<string, ContentRecord>();
    for (const item of items) {
      const key = navKeyForItem(item);
      if (key) {
        pageByNavKey.set(key, item);
      }
    }

    const navRows: ManagedPageRow[] = navOrder.map((entry, index) => {
      const matchedPage = pageByNavKey.get(entry.key);
      if (matchedPage) {
        return {
          kind: "page",
          item: matchedPage,
          navKey: entry.key,
          navIndex: index,
          inNav: true,
          publicHref: publicHrefForPage(matchedPage)
        };
      }
      return {
        kind: "preset",
        entry,
        navIndex: index
      };
    });

    const orphanPages = items
      .filter((item) => {
        const navKey = navKeyForItem(item);
        if (!navKey) return true;
        if (!pageBackedKeys.has(navKey)) return true;
        return !navOrder.some((entry) => entry.key === navKey);
      })
      .sort((left, right) => {
        const leftTime = left.updatedAt ? new Date(left.updatedAt).getTime() : 0;
        const rightTime = right.updatedAt ? new Date(right.updatedAt).getTime() : 0;
        return rightTime - leftTime;
      })
      .map<ManagedPageRow>((item) => ({
        kind: "page",
        item,
        navKey: navKeyForItem(item),
        navIndex: -1,
        inNav: false,
        publicHref: publicHrefForPage(item)
      }));

    return [...navRows, ...orphanPages];
  }, [items, navOrder]);

  async function persistNavigationOrder() {
    if (!siteSnapshot) {
      window.alert(t("缺少站点设置上下文，无法保存排序。", "Site settings context is missing."));
      return;
    }
    const pageBackedKeys = new Set(["lab", "friends", "about", "thoughts", "links", "photos", "resume", "comments"]);
    const missingPage = navOrder.filter((entry) => pageBackedKeys.has(entry.key) && !entry.id);
    if (missingPage.length) {
      window.alert(
        t(
          `以下导航项还没创建页面：${missingPage.map((entry) => entry.label).join("、")}。请先创建页面后再保存。`,
          `These navigation items have no page yet: ${missingPage.map((entry) => entry.label).join(", ")}. Create them before saving.`
        )
      );
      return;
    }
    const unpublishedPage = navOrder.filter((entry) => pageBackedKeys.has(entry.key) && entry.id && entry.status !== "PUBLISHED");
    if (unpublishedPage.length) {
      window.alert(
        t(
          `以下导航项页面未发布：${unpublishedPage.map((entry) => entry.label).join("、")}。发布后再保存，避免前台 404。`,
          `These navigation items are not published: ${unpublishedPage.map((entry) => entry.label).join(", ")}. Publish first to avoid frontend 404.`
        )
      );
      return;
    }
    setOrderSaving(true);
    try {
      const response = await fetch("/api/studio/settings/site", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          ...siteSnapshot,
          studio: {
            ...studioSnapshot,
            navigationOrder: navOrder.map((entry) => entry.key)
          }
        })
      });
      if (!response.ok) {
        throw new Error("Unable to save navigation order.");
      }
      startTransition(() => router.refresh());
    } catch (error) {
      console.error(error);
      window.alert(t("保存排序失败。", "Unable to save navigation order."));
    } finally {
      setOrderSaving(false);
    }
  }

  async function publishNavPage(id: string) {
    const response = await fetch(`/api/studio/content/${id}/publish`, {
      method: "POST"
    });
    if (!response.ok) {
      window.alert(t("发布失败。", "Publish failed."));
      return;
    }
    startTransition(() => router.refresh());
  }

  if (mode === "pages") {
    return (
      <div className="studio-pages-v2">
        <section className="studio-pages-left">
          <button type="button" onClick={() => createContent("PAGE")} className="studio-v2-create-page">
            <Plus aria-hidden className="h-7 w-7" />
            <span>{t("创建页面", "Create page")}</span>
          </button>
          <button type="button" onClick={createAiPage} className="studio-button">
            <Sparkles aria-hidden className="h-4 w-4" />
            {t("AI 创建页面", "Create page with AI")}
          </button>
          <p className="studio-v2-soft">
            {t("在页面编辑器里添加「Custom HTML」模块，即可让 AI 生成并插入页面内容，同时保留前台顶栏。", "Add a Custom HTML section in the editor to let AI generate page content while keeping the public header intact.")}
          </p>

          <article className="studio-v2-card">
            <div className="studio-v2-card-head">
              <h2>{t("页面预设", "Page presets")}</h2>
            </div>
            <p className="studio-v2-soft">
              {t(
                "把预设直接拖到右侧页面列表，就会加入顶栏排序；把右侧页面拖回这里，就会移出顶栏并回到预设区。",
                "Drag a preset into the page list to add it to top navigation; drag a page back here to remove it and return it to presets."
              )}
            </p>
            <div className="studio-v2-presets-grid">
              {availableTemplates.map((entry) => (
                entry.item ? (
                  <div
                    key={entry.key}
                    className={`studio-v2-preset-item ${draggingNavKey === entry.key ? "is-dragging-source" : ""}`}
                    draggable
                    onDragStart={(event) => startDraggingNav(entry.key, event)}
                    onDragEnd={() => finishDraggingNav()}
                  >
                    <strong>{entry.label}</strong>
                    <span>{entry.note} · {t("可拖入顶栏", "Draggable to top nav")}</span>
                    <div className="mt-2 flex justify-end">
                      <Link href={`/studio/editor/${entry.item.id}`} className="studio-button studio-button-compact">
                        {t("编辑", "Edit")}
                      </Link>
                    </div>
                  </div>
                ) : (
                  <div
                    key={entry.key}
                    className={`studio-v2-preset-item ${draggingNavKey === entry.key ? "is-dragging-source" : ""}`}
                    draggable
                    onDragStart={(event) => startDraggingNav(entry.key, event)}
                    onDragEnd={() => finishDraggingNav()}
                  >
                    <strong>{entry.label}</strong>
                    <span>{t("先创建这个预设页面，随后就能拖入顶栏排序", "Create this preset page first, then drag it into the top navigation")}</span>
                    <div className="mt-2 flex justify-end">
                      <button type="button" onClick={() => createPresetPage(entry.key)} disabled={creatingPresetKey === entry.key} className="studio-button studio-button-compact">
                        {creatingPresetKey === entry.key ? t("创建中", "Creating") : t("创建", "Create")}
                      </button>
                    </div>
                  </div>
                )
              ))}
            </div>
            <div
              className={`studio-v2-preset-item studio-v2-preset-empty ${dragOverList ? "is-drop-target" : ""}`}
              onDragOver={(event) => {
                if (currentDragKey(event)) {
                  event.preventDefault();
                  setDragOverList(true);
                }
              }}
              onDragLeave={() => setDragOverList(false)}
              onDrop={(event) => {
                event.preventDefault();
                removeDraggedFromNav(event);
              }}
            >
              <strong>{availableTemplates.length ? t("拖回预设区", "Return to presets") : t("预设区已清空", "Preset area is empty")}</strong>
              <span>
                {t(
                  "把右侧页面拖回这里，就会移出顶栏并回到预设区。",
                  "Drag a page back here to remove it from navigation and return it to presets."
                )}
              </span>
            </div>
          </article>

          <button type="button" onClick={() => openOrCreateSpecialPage("thoughts")} className="studio-v2-special-page text-left">
            {t("特殊来源页：朋友圈", "Special source page · Thoughts")}
          </button>
          <button type="button" onClick={() => openOrCreateSpecialPage("comments")} className="studio-v2-special-page text-left">
            {t("特殊来源页：评论管理", "Special source page · Comments")}
          </button>
        </section>

        <section className="studio-pages-center studio-v2-card studio-pages-order-card">
          <div className="studio-v2-card-head">
            <div>
              <h2>{t("顶栏排序与管理", "Navigation sort + manage")}</h2>
              <p className="studio-v2-soft">
                {navDirty
                  ? t("有未保存的导航调整。", "You have unsaved navigation changes.")
                  : t("页面管理与顶栏排序已经同步。", "Page management and header order are in sync.")}
              </p>
              <p className="studio-v2-soft">
                {t("拖到页面行可按位置插入；拖到列表空白处会追加到末尾。", "Drop onto a page row to insert there, or drop into empty list space to append to the end.")}
              </p>
            </div>
            <button type="button" onClick={persistNavigationOrder} disabled={orderSaving || !navDirty} className="studio-button studio-button-compact">
              {orderSaving ? t("保存中", "Saving") : t("保存", "Save")}
            </button>
          </div>
          <div className="studio-v2-card-head">
            <h2>{t("页面列表", "Pages")}</h2>
            <select value={selectedStatus} onChange={(event) => updateFilters({ status: event.target.value })} className="studio-select max-w-[8.5rem]">
              <option value="ALL">{t("全部", "All")}</option>
              {contentStatusOptions.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>
          <div className="studio-v2-selection-actions">
            <button type="button" onClick={() => openOrCreateSpecialPage("thoughts")} className="studio-button">
              {t("管理朋友圈", "Manage thoughts")}
            </button>
            <button type="button" onClick={() => openOrCreateSpecialPage("comments")} className="studio-button">
              {t("管理评论", "Manage comments")}
            </button>
            <button type="button" onClick={() => createContent("PAGE")} className="studio-button">
              <Plus aria-hidden className="h-4 w-4" />
              {t("增加", "Add page")}
            </button>
          </div>
          <div
            className={`studio-v2-list studio-v2-selection-list ${dragOverList ? "is-drop-target" : ""}`}
            onDragOver={(event) => {
              if (currentDragKey(event)) {
                event.preventDefault();
                setDragOverList(true);
              }
            }}
            onDragLeave={() => setDragOverList(false)}
            onDrop={(event) => {
              event.preventDefault();
              setDragOverList(false);
              appendDraggedToNav(event);
            }}
          >
            {managedPageRows.map((row) => {
              if (row.kind === "preset") {
                return (
                  <article
                    key={row.entry.key}
                    className={`studio-v2-list-row studio-v2-list-row-page studio-v2-page-manage-row ${dragOverNavKey === row.entry.key && draggingNavKey !== row.entry.key ? "is-drop-target" : ""}`}
                    draggable
                    onDragStart={(event) => startDraggingNav(row.entry.key, event)}
                    onDragEnd={() => finishDraggingNav()}
                    onDragOver={(event) => {
                      if (currentDragKey(event)) {
                        event.preventDefault();
                        setDragOverList(false);
                        setDragOverNavKey(row.entry.key);
                      }
                    }}
                    onDragLeave={() => {
                      if (dragOverNavKey === row.entry.key) {
                        setDragOverNavKey(null);
                      }
                    }}
                    onDrop={(event) => {
                      event.preventDefault();
                      event.stopPropagation();
                      setDragOverNavKey(null);
                      void dropOrder(row.entry.key, event);
                    }}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="mb-1 flex flex-wrap items-center gap-2">
                        <div className="studio-v2-nav-status">
                          <span className="studio-button studio-button-compact">{`${t("顶栏", "Top nav")} #${row.navIndex + 1}`}</span>
                          <button
                            type="button"
                            onClick={() => setNavOrder((current) => current.filter((entry) => entry.key !== row.entry.key))}
                            className="studio-button studio-button-compact studio-button-ghost"
                          >
                            {t("移出顶栏", "Remove from nav")}
                          </button>
                        </div>
                        <span className="studio-v2-soft">{t("预设待创建", "Preset awaiting creation")}</span>
                      </div>
                      <p className="studio-v2-list-title">{row.entry.label}</p>
                      <p className="studio-v2-soft">{t("这个预设已经加入顶栏排序，创建并发布后前台即可显示。", "This preset is already placed in the header order. Create and publish it to show it live.")}</p>
                      <div className="studio-v2-page-presence">
                        <span className="studio-v2-page-presence-chip">{t("已加入顶栏，待创建或发布", "In header order, awaiting creation or publish")}</span>
                      </div>
                    </div>
                    <div className="studio-v2-order-actions">
                      <GripVertical aria-hidden className="h-4 w-4" />
                      <button type="button" onClick={() => moveOrder(row.navIndex, -1)}>↑</button>
                      <button type="button" onClick={() => moveOrder(row.navIndex, 1)}>↓</button>
                      <button
                        type="button"
                        onClick={() => createPresetPage(row.entry.key)}
                        disabled={creatingPresetKey === row.entry.key}
                        aria-label={t("创建预设页面", "Create preset page")}
                      >
                        <CirclePlus aria-hidden className="h-4 w-4" />
                      </button>
                    </div>
                  </article>
                );
              }

              const { item, navKey, navIndex, inNav, publicHref } = row;
              const frontState =
                navKey && inNav
                  ? item.status === "PUBLISHED"
                    ? t("前台顶栏可见", "Visible in the public header")
                    : t("已加入顶栏，发布后可见", "In the header order, visible after publish")
                  : item.status === "PUBLISHED"
                    ? t("已发布但不在顶栏", "Published, but not shown in the header")
                    : t("仅后台可见", "Visible only inside Studio");
              return (
                <article
                  key={item.id}
                  className={`studio-v2-list-row studio-v2-list-row-page studio-v2-page-manage-row ${dragOverNavKey === navKey && draggingNavKey !== navKey ? "is-drop-target" : ""}`}
                  draggable={Boolean(navKey && inNav)}
                  onDragStart={(event) => {
                    if (navKey && inNav) startDraggingNav(navKey, event);
                  }}
                  onDragEnd={() => finishDraggingNav()}
                  onDragOver={(event) => {
                    if (currentDragKey(event)) {
                      event.preventDefault();
                      setDragOverList(false);
                      setDragOverNavKey(navKey ?? null);
                    }
                  }}
                  onDragLeave={() => {
                    if (dragOverNavKey === navKey) {
                      setDragOverNavKey(null);
                    }
                  }}
                  onDrop={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    setDragOverNavKey(null);
                    if (navKey) {
                      void dropOrder(navKey, event);
                      return;
                    }
                    void appendDraggedToNav(event);
                  }}
                >
                  <input type="checkbox" checked={selectedSet.has(item.id ?? "")} onChange={() => toggle(item.id)} />
                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex flex-wrap items-center gap-2">
                      {navKey ? (
                        <div className="studio-v2-nav-status">
                          <button
                            type="button"
                            onClick={() => {
                              const catalogEntry = navCatalogMap.get(navKey);
                              if (!catalogEntry) return;
                              setNavOrder((current) =>
                                inNav ? current.filter((entry) => entry.key !== navKey) : [...current, catalogEntry]
                              );
                            }}
                            className={`studio-button studio-button-compact ${inNav ? "" : "studio-button-ghost"}`}
                          >
                            {inNav ? `${t("顶栏", "Top nav")} #${navIndex + 1}` : t("加入顶栏", "Add to header")}
                          </button>
                          {inNav ? (
                            <button
                              type="button"
                              onClick={() => setNavOrder((current) => current.filter((entry) => entry.key !== navKey))}
                              className="studio-button studio-button-compact studio-button-ghost"
                            >
                              {t("移出顶栏", "Remove from nav")}
                            </button>
                          ) : null}
                        </div>
                      ) : (
                        <span className="studio-v2-soft">{t("普通页面", "Standalone page")}</span>
                      )}
                      <span className="studio-v2-soft">{statusLabel(item.status, locale)}</span>
                      <span className="studio-v2-soft">{typeLabel(item.type, locale)}</span>
                    </div>
                    <Link href={`/studio/editor/${item.id}`} className="block min-w-0">
                      <p className="studio-v2-list-title">{item.title}</p>
                      <p className="studio-v2-soft">{item.slug} · {statusLabel(item.status, locale)}</p>
                    </Link>
                    <div className="studio-v2-page-presence">
                      <span className={`studio-v2-page-presence-chip ${item.status === "PUBLISHED" ? "is-live" : ""}`}>{frontState}</span>
                      {publicHref ? <code>{publicHref}</code> : null}
                    </div>
                  </div>
                  <div className="studio-v2-order-actions">
                    {navKey && inNav ? <GripVertical aria-hidden className="h-4 w-4" /> : null}
                    {item.status !== "PUBLISHED" ? (
                      <button type="button" onClick={() => publishNavPage(item.id ?? "")} aria-label={t("发布页面", "Publish page")}>
                        <CheckSquare2 aria-hidden className="h-4 w-4" />
                      </button>
                    ) : null}
                    {navKey && inNav ? <button type="button" onClick={() => moveOrder(navIndex, -1)}>↑</button> : null}
                    {navKey && inNav ? <button type="button" onClick={() => moveOrder(navIndex, 1)}>↓</button> : null}
                    <Link href={`/studio/editor/${item.id}`} aria-label={t("编辑页面", "Edit page")}>
                      <PencilLine aria-hidden className="h-4 w-4" />
                    </Link>
                    {item.status === "PUBLISHED" && publicHref ? (
                      <Link href={publicHref} aria-label={t("打开前台页面", "Open live page")} target="_blank" rel="noreferrer">
                        <Sparkles aria-hidden className="h-4 w-4" />
                      </Link>
                    ) : null}
                  </div>
                </article>
              );
            })}
            {managedPageRows.length === 0 ? <div className="studio-empty">{pending ? t("加载中…", "Loading...") : t("暂无页面", "No pages yet.")}</div> : null}
          </div>
          <div className="studio-v2-selection-actions">
            <p>{t("已选择", "Selected")} · {selected.length}</p>
            <button type="button" disabled={!selected.length} onClick={() => runBatch("hide")} className="studio-button">{t("隐藏", "Hide")}</button>
            <button type="button" disabled={!selected.length} onClick={() => runBatch("archive")} className="studio-button">{t("归档", "Archive")}</button>
            <Link href={selected.length === 1 ? `/studio/editor/${selected[0]}` : "/studio/pages"} className={`studio-button ${selected.length === 1 ? "" : "pointer-events-none opacity-50"}`}>{t("编辑", "Edit")}</Link>
            <button type="button" disabled={!selected.length} onClick={() => runBatch("delete")} className="studio-button studio-button-ghost">{t("删除", "Delete")}</button>
          </div>
          <div className="studio-v2-selection-note">
            <span>{t("还想补一个页面？", "Need one more page?")}</span>
            <button type="button" onClick={() => createContent("PAGE")} className="studio-button studio-button-compact">
              <CirclePlus aria-hidden className="h-4 w-4" />
              {t("新建页面", "New page")}
            </button>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="studio-writing-v2">
      <section className="studio-writing-left-v2">
        <article className="studio-v2-card">
          <div className="studio-v2-card-head">
            <h2>{t("草稿", "Drafts")}</h2>
          </div>
          <div className="studio-v2-list">
            {drafts.map((item) => (
              <Link key={item.id} href={`/studio/editor/${item.id}`} className="studio-v2-list-row">
                <span className="studio-v2-list-title">{item.title}</span>
                <span className="studio-v2-list-date">{dateLabel(item.updatedAt, locale)}</span>
              </Link>
            ))}
            {drafts.length === 0 ? <div className="studio-empty">{t("暂无草稿", "No drafts yet.")}</div> : null}
          </div>
        </article>
        <button type="button" onClick={() => createContent("POST", "ai")} className="studio-v2-workspace-card natural">
          <Sparkles aria-hidden className="h-5 w-5" />
          <div>
            <span>Natural</span>
            <small>{t("自然语言写作台", "Natural language editor")}</small>
          </div>
        </button>
        <button type="button" onClick={() => createContent("POST", "md")} className="studio-v2-workspace-card markdown">
          <PencilLine aria-hidden className="h-5 w-5" />
          <div>
            <span>Markdown</span>
            <small>{t("Markdown 写作台", "Markdown editor")}</small>
          </div>
        </button>
      </section>

      <section className="studio-writing-center-v2 studio-v2-card">
        <div className="studio-v2-card-head">
          <div>
            <h2>{t("文章管理", "Article manager")}</h2>
            <p className="studio-v2-soft">{t("集中查看、筛选并处理你的文章与草稿。", "View, filter, and manage all posts and drafts in one place.")}</p>
          </div>
          <div className="flex gap-2">
            <input
              defaultValue={query}
              onKeyDown={(event) => {
                if (event.key === "Enter") updateFilters({ q: event.currentTarget.value });
              }}
              placeholder={t("搜索", "Search")}
              className="studio-input max-w-[12rem]"
            />
            <select value={selectedStatus} onChange={(event) => updateFilters({ status: event.target.value })} className="studio-select max-w-[10rem]">
              <option value="ALL">{t("全部", "All")}</option>
              {contentStatusOptions.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="studio-v2-list">
          {items.map((item) => (
            <article key={item.id} className="studio-v2-list-row studio-v2-list-row-page">
              <input type="checkbox" checked={selectedSet.has(item.id ?? "")} onChange={() => toggle(item.id)} />
              <Link href={`/studio/editor/${item.id}`} className="min-w-0 flex-1">
                <p className="studio-v2-list-title">{item.title}</p>
                <p className="studio-v2-soft">{typeLabel(item.type, locale)} · {statusLabel(item.status, locale)} · {dateLabel(item.updatedAt, locale)}</p>
              </Link>
            </article>
          ))}
          {items.length === 0 ? <div className="studio-empty">{pending ? t("加载中…", "Loading...") : t("暂无内容", "No writing yet.")}</div> : null}
        </div>
      </section>

      <aside className="studio-writing-right-v2 studio-v2-card">
        <div className="studio-v2-card-head"><h2>{t("选择", "Selection")}</h2></div>
        <p className="studio-v2-soft">
          {selected.length
            ? `${selected.length} ${t("项已选择，可立即批量处理。", "items selected and ready for batch actions.")}`
            : t("先勾选文章，再进行隐藏、归档或删除。", "Select items first, then hide, archive, or delete them.")}
        </p>
        <div className="studio-v2-selection-actions">
          <button type="button" disabled={!selected.length} onClick={() => runBatch("hide")} className="studio-button">
            <CheckSquare2 aria-hidden className="h-4 w-4" /> {t("隐藏", "Hide")}
          </button>
          <button type="button" disabled={!selected.length} onClick={() => runBatch("archive")} className="studio-button">
            <Archive aria-hidden className="h-4 w-4" /> {t("归档", "Archive")}
          </button>
          <button type="button" disabled={!selected.length} onClick={() => runBatch("delete")} className="studio-button studio-button-ghost">
            <Trash2 aria-hidden className="h-4 w-4" /> {t("删除", "Delete")}
          </button>
        </div>
        <div className="studio-v2-selection-note">
          <span>{t("新建入口已经集中在左侧写作卡片，右侧只保留批量管理。", "Creation stays on the left writing cards. This panel is only for batch management.")}</span>
        </div>
      </aside>
    </div>
  );
}
