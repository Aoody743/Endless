import Link from "next/link";
import { ArrowRight, FileText, LayoutTemplate, MessageSquare, Sparkles } from "lucide-react";
import { getStudioSiteSettings, getStudioSpecialPages, getStudioSummary } from "@/lib/content-store";
import { DashboardAiPanel } from "@/components/dashboard-ai-panel";
import type { ContentRecord, PageSectionRecord } from "@endless/content";

function formatDateTime(date: Date, timezone: string, locale: "zh" | "en") {
  return new Intl.DateTimeFormat(locale === "en" ? "en-US" : "zh-CN", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: timezone
  }).format(date);
}

type WeekdayKey = "monday" | "tuesday" | "wednesday" | "thursday" | "friday" | "saturday" | "sunday";

function dayKey(date: Date, timezone: string): WeekdayKey {
  const weekday = new Intl.DateTimeFormat("en-US", { weekday: "long", timeZone: timezone }).format(date).toLowerCase();
  if (weekday === "monday") return "monday";
  if (weekday === "tuesday") return "tuesday";
  if (weekday === "wednesday") return "wednesday";
  if (weekday === "thursday") return "thursday";
  if (weekday === "friday") return "friday";
  if (weekday === "saturday") return "saturday";
  return "sunday";
}

function greeting(hour: number, locale: "zh" | "en") {
  if (locale === "en") {
    if (hour < 5) return "Good night";
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  }
  if (hour < 5) return "凌晨好";
  if (hour < 12) return "早上好";
  if (hour < 18) return "下午好";
  return "晚上好";
}

const defaultWeekdayPhrases: Record<WeekdayKey, { zh: string; en: string }> = {
  monday: { zh: "稳健星期一", en: "Motivated Monday" },
  tuesday: { zh: "敏锐星期二", en: "Focused Tuesday" },
  wednesday: { zh: "高效星期三", en: "Productive Wednesday" },
  thursday: { zh: "卓越星期四", en: "Tremendous Thursday" },
  friday: { zh: "愉快星期五", en: "Happy Friday" },
  saturday: { zh: "轻松星期六", en: "Smooth Saturday" },
  sunday: { zh: "灵感星期日", en: "Sunny Sunday" }
};

function defaultWeekdayPhrase(day: WeekdayKey, locale: "zh" | "en") {
  const phrase = defaultWeekdayPhrases[day];
  return locale === "en" ? phrase.en : phrase.zh;
}

function dateLabel(value: string | undefined, locale: "zh" | "en") {
  if (!value) return "-";
  return new Intl.DateTimeFormat(locale === "en" ? "en-US" : "zh-CN", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

function specialFeedCount(page: ContentRecord | undefined, slug: "thoughts" | "comments") {
  if (!page) return 0;
  const expectedId = `${slug}-feed`;
  const section = page.sections.find((entry) => {
    if (entry.type !== "feature_grid") return false;
    if (entry.id === expectedId) return true;
    return slug === "thoughts"
      ? ["thought-stream", "friend-cards"].includes(entry.variant)
      : ["comment-stream", "friend-cards"].includes(entry.variant);
  });
  if (!section) return 0;
  const items = Array.isArray((section as PageSectionRecord).props.items)
    ? ((section as PageSectionRecord).props.items as unknown[])
    : [];
  return items.filter((item: unknown) => typeof item === "object" && item !== null).length;
}

function deriveOnlineDays(firstCreatedAt: string | undefined, fallbackHours: number) {
  if (firstCreatedAt) {
    const diffMs = Date.now() - new Date(firstCreatedAt).getTime();
    return Math.max(1, Math.floor(diffMs / (1000 * 60 * 60 * 24)) + 1);
  }
  return fallbackHours > 0 ? Math.max(1, Math.floor(fallbackHours / 24)) : 0;
}

export default async function StudioPage() {
  const [summary, settings, specialPages] = await Promise.all([getStudioSummary(), getStudioSiteSettings(), getStudioSpecialPages()]);
  const now = new Date();
  const locale = settings.studio.uiLanguage;
  const timezone = settings.studio.profile.timezone || "Asia/Shanghai";
  const ownerName = settings.site.author;
  const hour = Number(
    new Intl.DateTimeFormat("en-US", { hour: "numeric", hour12: false, timeZone: timezone }).format(now)
  );
  const phraseKey = dayKey(now, timezone);
  const weekdayPhrase = settings.studio.weekdayPhrases[phraseKey] || defaultWeekdayPhrase(phraseKey, locale);
  const drafts = summary.recentDrafts.slice(0, 3);
  const recent = summary.recentItems.slice(0, 6);
  const tx = (zh: string, en: string) => (locale === "en" ? en : zh);
  const writingAiReady = settings.ai.configured;
  const greetingMeta = [settings.studio.profile.location, formatDateTime(now, timezone, settings.studio.uiLanguage)]
    .filter(Boolean)
    .join(" · ");
  const commentsManageHref = specialPages.comments?.id ? `/studio/editor/${specialPages.comments.id}` : "/studio/pages";
  const thoughtsManageHref = specialPages.thoughts?.id ? `/studio/editor/${specialPages.thoughts.id}` : "/studio/pages";
  const thoughtsCount = specialFeedCount(specialPages.thoughts, "thoughts") || settings.studio.metricsFallback.thoughtsCount;
  const commentsCount = specialFeedCount(specialPages.comments, "comments") || settings.studio.metricsFallback.commentsCount;
  const daysOnline = deriveOnlineDays(summary.firstCreatedAt, settings.studio.metricsFallback.onlineHours);

  return (
    <div className="studio-dashboard-v2">
      <section className="studio-dashboard-headline">
        <div className="studio-dashboard-brandline">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={settings.studio.profile.avatarUrl || "/images/daydreamer-avatar.png"}
            alt={settings.studio.profile.siteName || settings.site.name}
            className="studio-dashboard-avatar"
          />
          <div>
            <h1 className="studio-dashboard-site-title">{settings.studio.profile.siteName || settings.site.name}</h1>
            <p className="studio-dashboard-site-subtitle">
              {tx("由 Endless 驱动的写作工作台", "Writing Studio powered by Endless")}
            </p>
            <div className="studio-dashboard-meta-chips">
              <span className="studio-dashboard-meta-chip">
                <FileText aria-hidden className="h-3.5 w-3.5" />
                {summary.counts.DRAFT} {tx("篇草稿", "drafts")}
              </span>
              <span className="studio-dashboard-meta-chip">
                <LayoutTemplate aria-hidden className="h-3.5 w-3.5" />
                {summary.countsByType.PAGE} {tx("个页面", "pages")}
              </span>
              <span className="studio-dashboard-meta-chip">
                <Sparkles aria-hidden className="h-3.5 w-3.5" />
                {writingAiReady ? tx("AI 写作已连接", "Writing AI connected") : tx("去设置里完成 AI 配置", "Finish AI setup in Settings")}
              </span>
            </div>
          </div>
        </div>
        <div className="studio-dashboard-greeting">
          <p className="studio-greeting-line">
            {greeting(hour, locale)}, <strong>{ownerName}</strong>.
          </p>
          <p className="studio-greeting-meta">{greetingMeta}</p>
          <p className="studio-greeting-meta">{weekdayPhrase}</p>
        </div>
      </section>

      <section className="studio-dashboard-main-grid">
        <article className="studio-v2-card studio-v2-card-quick">
          <div className="studio-v2-card-head">
            <h2>{tx("快捷操作", "Quick actions")}</h2>
          </div>
          <div className="studio-v2-quick-grid">
            <Link href="/studio/writing" className="studio-v2-quick-chip">
              <p>{tx("写新文章", "Write post")}</p>
              <span>{tx("进入写作台", "Open writing studio")}</span>
            </Link>
            <Link href="/studio/pages" className="studio-v2-quick-chip">
              <p>{tx("管理页面", "Manage pages")}</p>
              <span>{tx("排序与预设", "Order and presets")}</span>
            </Link>
            <Link href={thoughtsManageHref} className="studio-v2-quick-chip">
              <p>{tx("管理朋友圈", "Manage thoughts")}</p>
              <span>{tx("进入轻量发布与时间线", "Open the lightweight thoughts studio")}</span>
            </Link>
            <Link href={commentsManageHref} className="studio-v2-quick-chip">
              <p>{tx("管理评论", "Manage comments")}</p>
              <span>{tx("审核、整理并回复评论", "Moderate, organize, and reply to comments")}</span>
            </Link>
          </div>
        </article>

        <article className="studio-v2-card studio-v2-card-ai">
          <div className="studio-v2-card-head">
            <h2>{tx("AI 写作助手", "AI Writing Assistant")}</h2>
            <span className="studio-v2-ai-badge">AI</span>
          </div>
          <DashboardAiPanel configured={settings.ai.configured} message={settings.ai.message} />
        </article>

        <article className="studio-v2-card studio-v2-card-recent">
          <div className="studio-v2-card-head">
            <h2>{tx("最近文章与草稿", "Recent posts + drafts")}</h2>
          </div>
          <div className="studio-v2-list">
            {recent.map((item) => (
              <Link key={item.id} href={`/studio/editor/${item.id}`} className="studio-v2-list-row">
                <span className="studio-v2-list-title">{item.title}</span>
                <span className="studio-v2-list-date">{dateLabel(item.updatedAt, locale)}</span>
              </Link>
            ))}
            {recent.length === 0 ? <div className="studio-empty">{tx("还没有内容，先创建一篇吧。", "No content yet. Create your first item.")}</div> : null}
          </div>
        </article>

        <article className="studio-v2-card studio-v2-card-comments">
          <div className="studio-v2-card-head">
            <h2>{tx("评论", "Comments")}</h2>
          </div>
          <div className="studio-v2-comments-entry">
            <MessageSquare aria-hidden className="h-5 w-5" />
            <div>
              <p>{commentsCount} {tx("条评论", "comments")}</p>
              <p className="studio-v2-soft">{tx("进入评论管理", "Open comment management")}</p>
            </div>
            <Link href={commentsManageHref} className="studio-v2-round-arrow" aria-label={tx("进入评论管理", "Open comment management")}>
              <ArrowRight aria-hidden className="h-4 w-4" />
            </Link>
          </div>
          <div className="mt-3">
            <Link href={specialPages.comments?.id ? `/studio/editor/${specialPages.comments.id}` : "/studio/pages"} className="studio-v2-soft">
              {specialPages.comments?.id
                ? tx("继续管理评论页 →", "Continue editing comments page →")
                : tx("创建评论管理页 →", "Create comments page →")}
            </Link>
          </div>
        </article>

        <article className="studio-v2-card studio-v2-card-datas">
          <div className="studio-v2-card-head">
            <h2>{tx("数据概览", "Data overview")}</h2>
          </div>
          <div className="studio-v2-metrics">
            <div className="studio-v2-metric"><strong>{daysOnline}</strong><span>{tx("在线天数", "Online days")}</span></div>
            <div className="studio-v2-metric"><strong>{summary.publishedCountsByType.POST}</strong><span>{tx("已发布文章", "Published posts")}</span></div>
            <div className="studio-v2-metric"><strong>{thoughtsCount}</strong><span>{tx("朋友圈条数", "Thoughts count")}</span></div>
            <div className="studio-v2-metric"><strong>{commentsCount}</strong><span>{tx("评论总数", "Comments count")}</span></div>
            <div className="studio-v2-metric studio-v2-metric-wide"><strong>{summary.totalWords}</strong><span>{tx("站点总字数", "Total words")}</span></div>
          </div>
        </article>

        <article className="studio-v2-card studio-v2-card-drafts">
          <div className="studio-v2-card-head">
            <h2>{tx("近期草稿", "Recent drafts")}</h2>
          </div>
          <div className="studio-v2-draft-grid">
            {drafts.map((item) => (
              <Link key={item.id} href={`/studio/editor/${item.id}`} className="studio-v2-draft-chip">
                <p>{item.title}</p>
                <span>{item.type === "PAGE" ? tx("页面", "page") : tx("文章", "post")}</span>
              </Link>
            ))}
            {drafts.length === 0 ? <div className="studio-empty">{tx("暂无草稿。", "No drafts for now.")}</div> : null}
          </div>
        </article>
      </section>
    </div>
  );
}
