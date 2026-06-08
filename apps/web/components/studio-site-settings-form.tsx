"use client";

import type { StudioSiteSettingsRecord } from "@endless/content";
import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useStudioLocale } from "./studio-locale";

type SaveState = "idle" | "saved" | "error";

export function StudioSiteSettingsForm({ settings }: { settings: StudioSiteSettingsRecord }) {
  const router = useRouter();
  const { setLocale, t } = useStudioLocale();
  const [pending, startTransition] = useTransition();
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [siteDraft, setSiteDraft] = useState(settings.site);
  const [studioDraft, setStudioDraft] = useState(settings.studio);
  const [aiDraft, setAiDraft] = useState({
    provider: "openai-compatible" as const,
    baseUrl: settings.ai.baseUrl ?? "https://api.openai.com/v1",
    model: settings.ai.model ?? "gpt-4.1-mini",
    apiKey: ""
  });
  const [aiStatus, setAiStatus] = useState(settings.ai);
  const [imageAiDraft, setImageAiDraft] = useState({
    provider: "openai-compatible" as const,
    baseUrl: settings.imageAi.baseUrl ?? "https://api.openai.com/v1",
    model: settings.imageAi.model ?? "gpt-image-1",
    apiKey: ""
  });
  const [imageAiStatus, setImageAiStatus] = useState(settings.imageAi);
  const dirty = useMemo(() => {
    return JSON.stringify(siteDraft) !== JSON.stringify(settings.site)
      || JSON.stringify(studioDraft) !== JSON.stringify(settings.studio)
      || aiDraft.baseUrl !== (settings.ai.baseUrl ?? "https://api.openai.com/v1")
      || aiDraft.model !== (settings.ai.model ?? "gpt-4.1-mini")
      || aiDraft.apiKey.trim().length > 0
      || imageAiDraft.baseUrl !== (settings.imageAi.baseUrl ?? "https://api.openai.com/v1")
      || imageAiDraft.model !== (settings.imageAi.model ?? "gpt-image-1")
      || imageAiDraft.apiKey.trim().length > 0;
  }, [aiDraft, imageAiDraft, settings.ai.baseUrl, settings.ai.model, settings.imageAi.baseUrl, settings.imageAi.model, settings.site, settings.studio, siteDraft, studioDraft]);

  const aiReady = useMemo(() => aiStatus.configured, [aiStatus.configured]);
  const imageAiReady = useMemo(() => imageAiStatus.configured, [imageAiStatus.configured]);

  async function save() {
    setSaveState("idle");
    try {
      const response = await fetch("/api/studio/settings/site", {
        method: "PATCH",
        headers: {
          "content-type": "application/json"
        },
        body: JSON.stringify({
          ...siteDraft,
          studio: studioDraft,
          ai: aiDraft,
          aiImage: imageAiDraft
        })
      });

      if (!response.ok) {
        throw new Error("Save failed");
      }

      const data = (await response.json()) as { settings: StudioSiteSettingsRecord };
      setAiStatus(data.settings.ai);
      setImageAiStatus(data.settings.imageAi);
      setSiteDraft(data.settings.site);
      setStudioDraft(data.settings.studio);
      setLocale(data.settings.studio.uiLanguage);
      try {
        window.localStorage.setItem("endless-studio-language", data.settings.studio.uiLanguage);
        window.dispatchEvent(new Event("endless-studio-language-change"));
      } catch (error) {
        console.error(error);
      }
      setAiDraft((current) => ({
        ...current,
        baseUrl: data.settings.ai.baseUrl ?? current.baseUrl ?? "https://api.openai.com/v1",
        model: data.settings.ai.model ?? current.model ?? "gpt-4.1-mini",
        apiKey: ""
      }));
      setImageAiDraft((current) => ({
        ...current,
        baseUrl: data.settings.imageAi.baseUrl ?? current.baseUrl ?? "https://api.openai.com/v1",
        model: data.settings.imageAi.model ?? current.model ?? "gpt-image-1",
        apiKey: ""
      }));
      setSaveState("saved");
      startTransition(() => router.refresh());
    } catch (error) {
      console.error(error);
      setSaveState("error");
    }
  }

  return (
    <div className="studio-settings-v2">
      <section className="studio-v2-card studio-settings-hero-v2">
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
          <div>
            <p className="studio-eyebrow">{t("设置工作台", "Studio settings")}</p>
            <h1 className="studio-dashboard-title">{t("设置", "Settings")}</h1>
            <p className="studio-panel-copy mt-3 max-w-2xl">
              {t(
                "这里控制公开站、Studio 外观，以及文本 AI 与生图 AI 的独立配置。",
                "Control the public site, Studio appearance, and separate configurations for writing AI and image AI here."
              )}
            </p>
          </div>
          <div className="studio-settings-hero-actions">
            <span className={`studio-save-pill ${dirty ? "is-error" : "is-saved"}`}>
              {dirty ? t("有未保存修改", "Unsaved changes") : t("当前已同步", "Everything saved")}
            </span>
            <button type="button" onClick={save} disabled={pending || !dirty} className="studio-button studio-button-primary">
              {pending ? t("保存中…", "Saving…") : t("保存设置", "Save settings")}
            </button>
          </div>
        </div>
        <div className="studio-settings-overview">
          <div className="studio-settings-overview-card">
            <strong>{studioDraft.uiLanguage === "en" ? "English" : "中文"}</strong>
            <span>{t("当前后台语言", "Current studio language")}</span>
          </div>
          <div className="studio-settings-overview-card">
            <strong>{studioDraft.profile.timezone || "Asia/Shanghai"}</strong>
            <span>{t("当前时区", "Current timezone")}</span>
          </div>
          <div className="studio-settings-overview-card">
            <strong>{aiReady ? t("已连通", "Ready") : t("未完成", "Not ready")}</strong>
            <span>{t("AI 工作流状态", "AI workflow status")}</span>
          </div>
          <div className="studio-settings-overview-card">
            <strong>{imageAiReady ? t("已连通", "Ready") : t("未完成", "Not ready")}</strong>
            <span>{t("AI 生图状态", "AI image status")}</span>
          </div>
        </div>
      </section>

      <section className="studio-v2-card studio-settings-panel">
        <div className="mb-5">
          <p className="studio-eyebrow">{t("站点", "Site")}</p>
          <h2 className="studio-panel-title">{t("公开站点信息", "Public site information")}</h2>
          <p className="studio-v2-soft mt-2">{t("这些信息会直接影响前台站点的名称、SEO 标题和描述。", "These values directly affect the public site's name, SEO title, and description.")}</p>
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <label className="studio-label text-sm">
            <span className="studio-label-text">{t("名称", "Name")}</span>
            <input value={siteDraft.name} onChange={(event) => setSiteDraft((current) => ({ ...current, name: event.target.value }))} className="studio-input" />
          </label>
          <label className="studio-label text-sm">
            <span className="studio-label-text">{t("作者", "Author")}</span>
            <input value={siteDraft.author} onChange={(event) => setSiteDraft((current) => ({ ...current, author: event.target.value }))} className="studio-input" />
          </label>
          <label className="studio-label text-sm lg:col-span-2">
            <span className="studio-label-text">{t("标题", "Title")}</span>
            <input value={siteDraft.title} onChange={(event) => setSiteDraft((current) => ({ ...current, title: event.target.value }))} className="studio-input" />
          </label>
          <label className="studio-label text-sm lg:col-span-2">
            <span className="studio-label-text">{t("描述", "Description")}</span>
            <textarea
              value={siteDraft.description}
              onChange={(event) => setSiteDraft((current) => ({ ...current, description: event.target.value }))}
              className="studio-textarea min-h-[8rem]"
            />
          </label>
          <label className="studio-label text-sm">
            <span className="studio-label-text">{t("站点地址", "Site URL")}</span>
            <input value={siteDraft.url} onChange={(event) => setSiteDraft((current) => ({ ...current, url: event.target.value }))} className="studio-input" />
          </label>
          <label className="studio-label text-sm">
            <span className="studio-label-text">{t("语言", "Language")}</span>
            <input value={siteDraft.language} onChange={(event) => setSiteDraft((current) => ({ ...current, language: event.target.value }))} className="studio-input" />
          </label>
        </div>
      </section>

      <section className="studio-v2-card studio-settings-panel">
        <div className="mb-5">
          <p className="studio-eyebrow">{t("工作台", "Studio")}</p>
          <h2 className="studio-panel-title">{t("工作台外观与状态", "Studio appearance and state")}</h2>
          <p className="studio-v2-soft mt-2">{t("这里决定后台显示给你的名字、头像、问候语和看板统计。", "This controls the name, avatar, greeting, and dashboard stats shown inside the studio.")}</p>
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <label className="studio-label text-sm">
            <span className="studio-label-text">{t("工作台名称", "Studio name")}</span>
            <input
              value={studioDraft.profile.siteName}
              onChange={(event) =>
                setStudioDraft((current) => ({
                  ...current,
                  profile: { ...current.profile, siteName: event.target.value }
                }))
              }
              className="studio-input"
            />
          </label>
          <label className="studio-label text-sm">
            <span className="studio-label-text">{t("头像地址", "Avatar URL")}</span>
            <input
              value={studioDraft.profile.avatarUrl}
              onChange={(event) =>
                setStudioDraft((current) => ({
                  ...current,
                  profile: { ...current.profile, avatarUrl: event.target.value }
                }))
              }
              className="studio-input"
            />
          </label>
          <label className="studio-label text-sm">
            <span className="studio-label-text">{t("地点", "Location")}</span>
            <input
              value={studioDraft.profile.location}
              onChange={(event) =>
                setStudioDraft((current) => ({
                  ...current,
                  profile: { ...current.profile, location: event.target.value }
                }))
              }
              className="studio-input"
            />
          </label>
          <label className="studio-label text-sm">
            <span className="studio-label-text">{t("时区", "Timezone")}</span>
            <input
              value={studioDraft.profile.timezone}
              onChange={(event) =>
                setStudioDraft((current) => ({
                  ...current,
                  profile: { ...current.profile, timezone: event.target.value }
                }))
              }
              className="studio-input"
            />
          </label>
          <label className="studio-label text-sm">
            <span className="studio-label-text">{t("后台语言", "Studio language")}</span>
            <select
              value={studioDraft.uiLanguage}
              onChange={(event) => {
                const next = event.target.value === "en" ? "en" : "zh";
                setStudioDraft((current) => ({
                  ...current,
                  uiLanguage: next
                }));
                setLocale(next);
              }}
              className="studio-select"
            >
              <option value="zh">中文</option>
              <option value="en">English</option>
            </select>
          </label>
          <label className="studio-label text-sm">
            <span className="studio-label-text">{t("在线小时数", "Online hours")}</span>
            <input
              type="number"
              min="0"
              value={studioDraft.metricsFallback.onlineHours}
              onChange={(event) =>
                setStudioDraft((current) => ({
                  ...current,
                  metricsFallback: { ...current.metricsFallback, onlineHours: Number(event.target.value) }
                }))
              }
              className="studio-input"
            />
          </label>
          <label className="studio-label text-sm">
            <span className="studio-label-text">{t("评论总数", "Comments count")}</span>
            <input
              type="number"
              min="0"
              value={studioDraft.metricsFallback.commentsCount}
              onChange={(event) =>
                setStudioDraft((current) => ({
                  ...current,
                  metricsFallback: { ...current.metricsFallback, commentsCount: Number(event.target.value) }
                }))
              }
              className="studio-input"
            />
          </label>
          <label className="studio-label text-sm">
            <span className="studio-label-text">{t("朋友圈条数", "Thoughts count")}</span>
            <input
              type="number"
              min="0"
              value={studioDraft.metricsFallback.thoughtsCount}
              onChange={(event) =>
                setStudioDraft((current) => ({
                  ...current,
                  metricsFallback: { ...current.metricsFallback, thoughtsCount: Number(event.target.value) }
                }))
              }
              className="studio-input"
            />
          </label>
        </div>
        <div className="mt-5">
          <div className="mb-3">
            <p className="studio-eyebrow">{t("星期问候", "Weekday phrases")}</p>
            <p className="studio-v2-soft mt-2">{t("这些文案会显示在 Dashboard 顶部日期下方。", "These phrases appear below the date in the dashboard header.")}</p>
          </div>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {Object.entries(studioDraft.weekdayPhrases).map(([day, value]) => (
            <label key={day} className="studio-label text-sm">
              <span className="studio-label-text">{t(
                day === "monday"
                  ? "星期一"
                  : day === "tuesday"
                    ? "星期二"
                    : day === "wednesday"
                      ? "星期三"
                      : day === "thursday"
                        ? "星期四"
                        : day === "friday"
                          ? "星期五"
                          : day === "saturday"
                            ? "星期六"
                            : "星期日",
                day === "monday"
                  ? "Monday"
                  : day === "tuesday"
                    ? "Tuesday"
                    : day === "wednesday"
                      ? "Wednesday"
                      : day === "thursday"
                        ? "Thursday"
                        : day === "friday"
                          ? "Friday"
                          : day === "saturday"
                            ? "Saturday"
                            : "Sunday"
              )}</span>
              <input
                value={value}
                onChange={(event) =>
                  setStudioDraft((current) => ({
                    ...current,
                    weekdayPhrases: { ...current.weekdayPhrases, [day]: event.target.value }
                  }))
                }
                className="studio-input"
              />
            </label>
          ))}
        </div>
        </div>
      </section>

      <section className="studio-v2-card studio-settings-panel">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="studio-eyebrow">AI</p>
            <h2 className="studio-panel-title">{t("排版 / 翻译 / 总结", "Format / Translate / Summarize")}</h2>
            <p className="studio-v2-soft mt-2">{t("这里只需要填模型、接口地址和 API Key；保存后 Dashboard 和编辑器会直接可用。", "You only need a model, endpoint, and API key here; after saving, dashboard and editor AI tools become available.")}</p>
          </div>
          <span className={`studio-save-pill ${aiReady ? "is-saved" : "is-error"}`}>{aiReady ? t("已配置", "Configured") : t("不可用", "Unavailable")}</span>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <label className="studio-label text-sm">
            <span className="studio-label-text">{t("供应商", "Provider")}</span>
            <input value="openai-compatible" disabled className="studio-input" />
          </label>
          <label className="studio-label text-sm">
            <span className="studio-label-text">{t("模型", "Model")}</span>
            <input value={aiDraft.model} onChange={(event) => setAiDraft((current) => ({ ...current, model: event.target.value }))} className="studio-input" placeholder="gpt-4.1-mini" />
          </label>
          <label className="studio-label text-sm lg:col-span-2">
            <span className="studio-label-text">{t("接口地址", "Base URL")}</span>
            <input value={aiDraft.baseUrl} onChange={(event) => setAiDraft((current) => ({ ...current, baseUrl: event.target.value }))} className="studio-input" placeholder="https://api.openai.com/v1" />
          </label>
          <label className="studio-label text-sm lg:col-span-2">
            <span className="studio-label-text">{t("API 密钥", "API Key")}</span>
            <input
              type="password"
              value={aiDraft.apiKey}
              onChange={(event) => setAiDraft((current) => ({ ...current, apiKey: event.target.value }))}
              className="studio-input"
              placeholder={aiStatus.hasApiKey ? t("已保存，输入新值以替换", "Saved. Enter a new value to replace it.") : t("输入 API Key", "Enter API key")}
            />
          </label>
        </div>
        <div className="studio-settings-inline-actions">
          <button
            type="button"
            onClick={() =>
              setAiDraft((current) => ({
                ...current,
                baseUrl: "https://api.openai.com/v1",
                model: "gpt-4.1-mini"
              }))
            }
            className="studio-button studio-button-compact"
          >
            {t("恢复 OpenAI 默认值", "Use OpenAI defaults")}
          </button>
          <button
            type="button"
            onClick={() => setAiDraft((current) => ({ ...current, apiKey: "" }))}
            className="studio-button studio-button-compact studio-button-ghost"
          >
            {t("清空本次新 Key 输入", "Clear new key input")}
          </button>
        </div>

        <p className="mt-4 text-xs leading-6 text-muted">
          {t("API Key 仅以加密形式存储，Studio 不会回显明文。", "The API key is stored only in encrypted form and is never echoed back by Studio.")}
          {aiStatus.message ? ` ${t("当前状态：", "Current status: ")}${aiStatus.message}` : ` ${t("配置完整后，编辑器中的 AI 工具会自动可用。", "Once configured, the AI tools in the editor become available automatically.")}`}
        </p>
      </section>

      <section className="studio-v2-card studio-settings-panel">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="studio-eyebrow">{t("AI 生图", "AI Image")}</p>
            <h2 className="studio-panel-title">{t("AI 生成图片", "AI image generation")}</h2>
            <p className="studio-v2-soft mt-2">{t("这里单独配置生图接口地址、模型和 API Key，不再复用排版/翻译那套配置。", "Configure the image endpoint, model, and API key separately here instead of reusing the writing AI config.")}</p>
          </div>
          <span className={`studio-save-pill ${imageAiReady ? "is-saved" : "is-error"}`}>{imageAiReady ? t("已配置", "Configured") : t("不可用", "Unavailable")}</span>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <label className="studio-label text-sm">
            <span className="studio-label-text">{t("供应商", "Provider")}</span>
            <input value="openai-compatible" disabled className="studio-input" />
          </label>
          <label className="studio-label text-sm">
            <span className="studio-label-text">{t("生图模型", "Image model")}</span>
            <input value={imageAiDraft.model} onChange={(event) => setImageAiDraft((current) => ({ ...current, model: event.target.value }))} className="studio-input" placeholder="gpt-image-1" />
          </label>
          <label className="studio-label text-sm lg:col-span-2">
            <span className="studio-label-text">{t("生图接口地址", "Image base URL")}</span>
            <input value={imageAiDraft.baseUrl} onChange={(event) => setImageAiDraft((current) => ({ ...current, baseUrl: event.target.value }))} className="studio-input" placeholder="https://api.openai.com/v1" />
          </label>
          <label className="studio-label text-sm lg:col-span-2">
            <span className="studio-label-text">{t("生图 API 密钥", "Image API Key")}</span>
            <input
              type="password"
              value={imageAiDraft.apiKey}
              onChange={(event) => setImageAiDraft((current) => ({ ...current, apiKey: event.target.value }))}
              className="studio-input"
              placeholder={imageAiStatus.hasApiKey ? t("已保存，输入新值以替换", "Saved. Enter a new value to replace it.") : t("输入生图 API Key", "Enter image API key")}
            />
          </label>
        </div>
        <div className="studio-settings-inline-actions">
          <button
            type="button"
            onClick={() =>
              setImageAiDraft((current) => ({
                ...current,
                baseUrl: "https://api.openai.com/v1",
                model: "gpt-image-1"
              }))
            }
            className="studio-button studio-button-compact"
          >
            {t("恢复生图默认值", "Use image defaults")}
          </button>
          <button
            type="button"
            onClick={() => setImageAiDraft((current) => ({ ...current, apiKey: "" }))}
            className="studio-button studio-button-compact studio-button-ghost"
          >
            {t("清空本次新 Key 输入", "Clear new key input")}
          </button>
        </div>

        <p className="mt-4 text-xs leading-6 text-muted">
          {t("生图 API Key 也只会加密存储。配置完整后，编辑器里的 AI 生图按钮会单独可用。", "The image API key is also stored only in encrypted form. Once configured, the editor's AI image button becomes available independently.")}
          {imageAiStatus.message ? ` ${t("当前状态：", "Current status: ")}${imageAiStatus.message}` : ` ${t("配置完整后，AI 生图弹窗会直接可用。", "Once configured, the AI image modal becomes available automatically.")}`}
        </p>
      </section>

      <div className="studio-note studio-settings-note">
        {saveState === "saved" ? t("已保存，公开站点信息、文本 AI 与生图 AI 配置都已更新。", "Saved. Public metadata, writing AI, and image AI settings were updated.") : null}
        {saveState === "error" ? t("当前无法保存设置。", "Unable to save settings right now.") : null}
        {saveState === "idle" ? t("这里的 AI 配置会被 Studio 编辑器直接读取；文本 AI 和生图 AI 现在分别独立控制。", "These AI settings are read directly by the Studio editor; writing AI and image AI are now controlled independently.") : null}
      </div>
    </div>
  );
}
