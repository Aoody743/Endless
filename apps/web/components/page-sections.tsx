/* eslint-disable react/jsx-key */
import type { ContentRecord, PageSectionRecord, SiteRecord } from "@endless/content";
import Link from "next/link";
import Image from "next/image";
import type { CSSProperties } from "react";
import { ProseMarkdown } from "./prose-markdown";
import {
  ArrowUpRight,
  Blocks,
  BookOpenText,
  Database,
  FileText,
  FolderKanban,
  HardDrive,
  History,
  Image as ImageIcon,
  ImageUp,
  LayoutTemplate,
  LibraryBig,
  MoonStar,
  Newspaper,
  NotebookTabs,
  PenSquare,
  Radar,
  Rss,
  Search,
  Server,
  Settings2,
  Sparkles
} from "lucide-react";

type SiteLocale = "zh" | "en";

function asString(value: unknown) {
  return typeof value === "string" ? value : "";
}

function asBoolean(value: unknown) {
  return value === true || value === "true";
}

function isPlaceholderHref(value: string) {
  const href = value.trim().toLowerCase();
  return (
    href === "https://example.com" ||
    href === "http://example.com" ||
    href === "https://github.com" ||
    href === "https://x.com" ||
    href === "https://t.me" ||
    href === "mailto:me@endlesscms.dev"
  );
}

function asItems(value: unknown): Array<Record<string, string>> {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter((entry): entry is Record<string, unknown> => typeof entry === "object" && entry !== null)
    .map((entry) =>
      Object.fromEntries(Object.entries(entry).map(([key, field]) => [key, typeof field === "string" ? field : ""]))
    );
}

type SectionLink = {
  [key: string]: string | boolean | undefined;
  label: string;
  href: string;
  description?: string;
  external?: boolean;
};

function asLinks(value: unknown): SectionLink[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter((entry): entry is Record<string, unknown> => typeof entry === "object" && entry !== null)
    .map((entry) => {
      const stringFields = Object.fromEntries(
        Object.entries(entry).map(([key, field]) => [key, typeof field === "string" ? field : ""])
      ) as Record<string, string>;

      return {
        ...stringFields,
        label: asString(entry.label),
        href: asString(entry.href),
        description: asString(entry.description) || undefined,
        external: asBoolean(entry.external)
      };
    })
    .filter((entry) => entry.label && entry.href && !isPlaceholderHref(entry.href));
}

function asRecord(value: unknown): Record<string, string> {
  if (typeof value !== "object" || value === null) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(value).map(([key, field]) => [key, typeof field === "string" ? field : ""])
  );
}

function asLines(value: unknown): Array<{ text: string; emoji?: string; suffix?: string }> {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter((entry): entry is Record<string, unknown> => typeof entry === "object" && entry !== null)
    .map((entry) => ({
      text: asString(entry.text),
      emoji: asString(entry.emoji) || undefined,
      suffix: asString(entry.suffix) || undefined
    }))
    .filter((entry) => entry.text || entry.emoji);
}

function sanitizeCustomHtml(value: string) {
  return value
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "")
    .replace(/\s+on[a-z]+\s*=\s*(['"]).*?\1/gi, "")
    .replace(/\s+on[a-z]+\s*=\s*[^\s>]+/gi, "");
}

function pickText(record: Record<string, string>, key: string, locale: SiteLocale, fallback = "") {
  const zh = record[`${key}Zh`] || record[`${key}_zh`] || record[key];
  const en = record[`${key}En`] || record[`${key}_en`];
  if (locale === "en") {
    return en || fallback;
  }
  return zh || fallback;
}

function pickLinkText(link: SectionLink, locale: SiteLocale) {
  const source = asRecord(link as unknown);
  const label = pickText(source, "label", locale, link.label);
  const description = pickText(source, "description", locale, link.description || "");
  return { label, description };
}

function dateLabel(value: string | undefined, locale: SiteLocale) {
  if (!value) {
    return locale === "en" ? "Draft" : "草稿";
  }

  return new Intl.DateTimeFormat(locale === "en" ? "en-US" : "zh-CN", { dateStyle: "medium" }).format(new Date(value));
}

function contentField(item: ContentRecord, locale: SiteLocale, field: "title" | "summary" | "bodyMarkdown") {
  if (locale === "en") {
    const localizedKey = `${field}En` as const;
    return typeof item[localizedKey] === "string" ? item[localizedKey] ?? "" : "";
  }

  return item[field] ?? "";
}

function localeFallback(locale: SiteLocale, zhFallback = "", enFallback = "") {
  return locale === "en" ? enFallback : zhFallback;
}

function sectionMarkdownClass(variant: string) {
  if (variant === "manifesto-lines") {
    return "prose-endless prose-manifesto mx-auto max-w-4xl text-center";
  }

  if (variant === "about-prose") {
    return "prose-endless prose-about mx-auto max-w-3xl";
  }

  return "prose-endless max-w-none";
}

function sizeClass(size: string) {
  switch (size) {
    case "wide":
      return "md:col-span-2";
    case "tall":
      return "md:row-span-2";
    case "large":
      return "md:col-span-2 md:row-span-2";
    default:
      return "";
  }
}

function iconFor(name: string) {
  switch (name) {
    case "sparkles":
      return Sparkles;
    case "moon-star":
      return MoonStar;
    case "layout-template":
      return LayoutTemplate;
    case "radar":
      return Radar;
    case "newspaper":
      return Newspaper;
    case "book-open-text":
      return BookOpenText;
    case "folder-kanban":
      return FolderKanban;
    case "search":
      return Search;
    case "rss":
      return Rss;
    case "image":
      return ImageIcon;
    case "database":
      return Database;
    case "blocks":
      return Blocks;
    case "server":
      return Server;
    case "hard-drive":
      return HardDrive;
    case "image-up":
      return ImageUp;
    case "history":
      return History;
    case "pen-square":
      return PenSquare;
    case "library-big":
      return LibraryBig;
    case "settings-2":
      return Settings2;
    case "file-text":
      return FileText;
    case "notebook-tabs":
      return NotebookTabs;
    default:
      return ArrowUpRight;
  }
}

function linkIcon(label: string) {
  const normalized = label.toLowerCase();
  if (normalized.includes("blog")) return Newspaper;
  if (normalized.includes("lab")) return Server;
  if (normalized.includes("search")) return Search;
  if (normalized.includes("studio")) return PenSquare;
  if (normalized.includes("rss")) return Rss;
  return ArrowUpRight;
}

function SectionMarkdown({ markdown, variant }: { markdown: string; variant: string }) {
  return (
    <div className={sectionMarkdownClass(variant)}>
      <ProseMarkdown markdown={markdown} />
    </div>
  );
}

function HomeHeroSection({ section, locale, site }: { section: PageSectionRecord; locale: SiteLocale; site: SiteRecord }) {
  const lines = asLines(section.props.heroLines);
  const socialLinks = asLinks(section.props.socialLinks);

  const resolvedLines =
    lines.length > 0
      ? lines
      : [
          { text: locale === "en" ? "Software Engineer" : "软件工程师", emoji: "🧑‍💻", suffix: locale === "en" ? "," : "，" },
          { text: locale === "en" ? "Hacker & Painter" : "黑客与创作者", emoji: "🎨", suffix: locale === "en" ? "." : "。" }
        ];

  return (
    <section className="home-hero-poster">
      <p className="editorial-kicker">
        {asString(locale === "en" ? section.props.eyebrowEn : section.props.eyebrowZh) || asString(section.props.eyebrow) || site.name}
      </p>
      <h1 className="hero-display mt-8">
        {resolvedLines.map((line, index) => (
          <span key={`${line.text}-${index}`} className="hero-line reveal-up" style={{ animationDelay: `${index * 120}ms` }}>
            <span>{locale === "en" ? asString((section.props.heroLines as Array<Record<string, unknown>>)?.[index]?.textEn) || line.text : line.text}</span>
            {line.emoji ? <span className="hero-emoji">{line.emoji}</span> : null}
            {(locale === "en"
              ? asString((section.props.heroLines as Array<Record<string, unknown>>)?.[index]?.suffixEn)
              : line.suffix) ? (
              <span>
                {locale === "en"
                  ? asString((section.props.heroLines as Array<Record<string, unknown>>)?.[index]?.suffixEn)
                  : line.suffix}
              </span>
            ) : null}
          </span>
        ))}
      </h1>
      {(asString(locale === "en" ? section.props.bodyEn : section.props.bodyZh) || asString(section.props.body)) ? (
        <p className="poster-summary reveal-up">{asString(locale === "en" ? section.props.bodyEn : section.props.bodyZh) || asString(section.props.body)}</p>
      ) : null}
      <div className="home-hero-social reveal-up">
        <span className="text-muted font-semibold">{asString(section.props.socialBrand) || site.name}</span>
        {socialLinks.length > 0
          ? socialLinks.map((link, index) => (
              <Link
                key={`${link.href}-${index}`}
                href={link.href}
                className="social-icon-link external-link-shift"
                target={link.external || link.href.startsWith("http") ? "_blank" : undefined}
              >
                <i className={asString((section.props.socialIcons as Record<string, string> | undefined)?.[link.label]) || "ri-link-m"} aria-hidden />
              </Link>
            ))
          : null}
      </div>
    </section>
  );
}

function HomeIntroSection({ section, locale }: { section: PageSectionRecord; locale: SiteLocale }) {
  const lines = asLines(section.props.lines);

  if (lines.length === 0) {
    return (
      <section className="mx-auto max-w-6xl text-center">
        <SectionMarkdown markdown={asString(section.props.bodyMarkdown)} variant="manifesto-lines" />
      </section>
    );
  }

  return (
    <section className="home-intro-block">
      {lines.map((line, index) => (
        <p key={`${line.text}-${index}`} className="intro-display reveal-up" style={{ animationDelay: `${index * 100}ms` }}>
          {locale === "en"
            ? asString((section.props.lines as Array<Record<string, unknown>>)?.[index]?.textEn) || asString((section.props.lines as Array<Record<string, unknown>>)?.[index]?.textZh) || line.text
            : asString((section.props.lines as Array<Record<string, unknown>>)?.[index]?.textZh) || line.text}
          {line.emoji ? <span className="hero-emoji">{line.emoji}</span> : null}
          {(locale === "en"
            ? asString((section.props.lines as Array<Record<string, unknown>>)?.[index]?.suffixEn)
            : asString((section.props.lines as Array<Record<string, unknown>>)?.[index]?.suffixZh) || line.suffix) ? (
            <span>
              {locale === "en"
                ? asString((section.props.lines as Array<Record<string, unknown>>)?.[index]?.suffixEn)
                : asString((section.props.lines as Array<Record<string, unknown>>)?.[index]?.suffixZh) || line.suffix}
            </span>
          ) : null}
        </p>
      ))}
    </section>
  );
}

function HomeReferenceGridSection({ section, locale, site }: { section: PageSectionRecord; locale: SiteLocale; site: SiteRecord }) {
  const items = asItems(section.props.items);

  const renderCard = (item: Record<string, string>, index: number) => {
    const cardType = item.cardType || item.layoutKey || "text_stat_card";
    const href = item.externalHref || item.href;
    const external = item.external === "true" || (href?.startsWith("http") ?? false);
    const className = `home-reference-card reveal-up ${href ? "card-hover-scale" : ""} ${item.overlayTone ? `tone-${item.overlayTone}` : ""} ${
      cardType === "resume_link_card" || cardType === "email_link_card" ? "is-half-card" : ""
    } ${item.layoutKey ? `layout-${item.layoutKey}` : ""} ${cardType}`;
    const meta = pickText(item, "meta", locale);
    const headline = pickText(item, "headline", locale, localeFallback(locale, item.title || "内容", item.titleEn || item.title || "Entry"));
    const subheadline = pickText(item, "subheadline", locale, localeFallback(locale, item.description || "", ""));
    const overlayTitle = pickText(item, "overlayTitle", locale);
    const ctaLabel = pickText(item, "ctaLabel", locale, locale === "en" ? "Open" : "");
    const usesCardBackground =
      cardType === "image_location_card" ||
      cardType === "image_school_card" ||
      cardType === "map_card" ||
      cardType === "image_story_card";
    const style = {
      "--grid-lg": item.gridAreaLg || "auto",
      "--grid-sm": item.gridAreaSm || "auto",
      ...(item.image && usesCardBackground ? { backgroundImage: `url(${item.image})` } : {})
    } as CSSProperties;

    const quoteCitation = pickText(item, "quoteCitation", locale, site.name);

    const cta = ctaLabel ? (
      <span className="home-card-cta home-action-serif-thin external-link-shift">
        {ctaLabel} <i className="ri-arrow-right-up-line" aria-hidden />
      </span>
    ) : null;
    const showDefaultCta =
      cardType !== "resume_link_card" &&
      cardType !== "email_link_card" &&
      cardType !== "about_cta_card" &&
      cardType !== "cta_link_card" &&
      cardType !== "mbti_card" &&
      cardType !== "map_card";

    const content = (
      <>
        {cardType === "mbti_card" && item.image ? (
          <Image
            src={item.image}
            alt={item.overlayMeta || item.headline || "MBTI"}
            width={420}
            height={420}
            className="mbti-illustration"
          />
        ) : null}
        {cardType === "avatar_card" && item.image ? (
          <Image src={item.image} alt={headline || "Avatar"} width={220} height={220} className="home-avatar-art" />
        ) : null}
        <div className={`home-reference-inner ${cardType}`}>
        {cardType === "resume_link_card" ? (
          <>
            <p className="home-inline-meta home-meta-sm">
              {item.icon ? <i className={`${item.icon} mr-1`} aria-hidden /> : null}
              {headline}
            </p>
          </>
        ) : cardType === "email_link_card" ? (
          <>
            <div className="home-email-shell">
              <p className="home-inline-meta home-meta-sm">
                {item.icon ? <i className={`${item.icon} mr-1`} aria-hidden /> : null}
                {locale === "en" ? "Email" : "邮箱"}
              </p>
              <h3 className="home-email-title">{headline}</h3>
            </div>
            {cta ? <span className="home-email-cta">{cta}</span> : null}
          </>
        ) : cardType === "about_cta_card" ? (
          <>
            <h3 className="home-title-lg home-about-title">{headline}</h3>
          </>
        ) : cardType === "creator_card" ? (
          <>
            {item.emoji ? <p className="home-reference-emoji home-maker-emoji">{item.emoji}</p> : null}
            <h3 className="home-title-xl home-maker-title">
              {(headline || "").split("\n").map((line, lineIndex) => (
                <span key={`${line}-${lineIndex}`} className={lineIndex === 0 ? "home-maker-title-soft" : "home-maker-title-strong"}>
                  {line}
                </span>
              ))}
            </h3>
            {Array.isArray((section.props.items as Array<Record<string, unknown>>)?.[index]?.iconStack) ? (
              <div className="home-maker-stack-icons">
                {((section.props.items as Array<Record<string, unknown>>)?.[index]?.iconStack as Array<unknown>)
                  .filter((entry): entry is string => typeof entry === "string")
                  .map((icon, iconIndex) => (
                    <i key={`${icon}-${iconIndex}`} className={icon} aria-hidden />
                  ))}
              </div>
            ) : subheadline ? (
              <p className="home-maker-stack">{subheadline}</p>
            ) : null}
          </>
        ) : cardType === "avatar_card" ? (
          <></>
        ) : cardType === "small_statement_card" ? (
          <>
            <h3 className="home-small-statement">{headline}</h3>
          </>
        ) : cardType === "quote_card" ? (
          <>
            <p className="home-quote-mark">
              <i className="ri-double-quotes-l" aria-hidden />
            </p>
            <h3 className="home-title-lg home-quote-title">{headline}</h3>
            {subheadline ? <p className="home-copy-md home-quote-body">{subheadline}</p> : null}
            <p className="home-quote-cite">—— {quoteCitation}</p>
          </>
        ) : cardType === "image_location_card" ? (
          <>
            {meta ? (
              <p className="bento-meta home-image-meta home-meta-sm">
                <i className="ri-home-line mr-1" aria-hidden />
                {meta}
              </p>
            ) : null}
            <p className="home-reference-overlay-title home-location-title">{overlayTitle || headline}</p>
          </>
        ) : cardType === "image_school_card" ? (
          <>
            {meta ? (
              <p className="bento-meta home-image-meta home-meta-sm">
                <i className="ri-graduation-cap-line mr-1" aria-hidden />
                {meta}
              </p>
            ) : null}
            <div className="home-school-copy">
              <p className="home-reference-overlay-title home-image-title home-title-lg">{overlayTitle || headline}</p>
              {subheadline ? <p className="home-school-subtitle">{subheadline}</p> : null}
            </div>
          </>
        ) : cardType === "map_card" ? (
          <>
            {meta ? (
              <p className="bento-meta home-map-meta home-meta-sm">
                <i className="ri-map-pin-line mr-1" aria-hidden />
                {meta}
              </p>
            ) : null}
            <div className="home-map-marker" aria-hidden>
              <span />
            </div>
            <div className="home-map-address">
              <p>{overlayTitle || headline}</p>
            </div>
          </>
        ) : cardType === "cta_link_card" ? (
          <>
            <h3 className="home-title-xl home-cta-title">{headline}</h3>
            {subheadline ? <p className="home-cta-sub home-copy-md">{subheadline}</p> : null}
            {cta ? <span className="home-cta-link">{cta}</span> : null}
          </>
        ) : cardType === "mbti_card" ? (
          <>
            {meta ? (
              <p className="bento-meta home-mbti-meta home-meta-sm">
                <i className="ri-user-heart-line mr-1" aria-hidden />
                {meta}
              </p>
            ) : null}
            <div className="home-mbti-copy">
              <h3 className="home-mbti-code">{headline}</h3>
              {overlayTitle ? <p className="home-mbti-accent">{overlayTitle}</p> : null}
            </div>
            {cta ? <span className="home-mbti-cta">{cta}</span> : null}
          </>
        ) : cardType === "image_story_card" ? (
          <></>
        ) : cardType === "text_stat_card" ? (
          <>
            <h3 className="home-title-xl home-tech-title">{headline}</h3>
          </>
        ) : (
          <>
            {meta ? (
              <p className="bento-meta home-meta-sm">
                {item.icon ? <i className={`${item.icon} mr-1`} aria-hidden /> : null}
                {meta}
              </p>
            ) : null}
            <h3 className="home-title-lg home-resume-title">{headline}</h3>
            {subheadline ? <p className="home-copy-md">{subheadline}</p> : null}
          </>
        )}
        {showDefaultCta ? cta : null}
        </div>
      </>
    );

    if (href) {
      return (
        <Link key={`${headline}-${index}`} href={href} className={className} style={style} target={external ? "_blank" : undefined}>
          {content}
        </Link>
      );
    }

    return (
      <div key={`${headline}-${index}`} className={className} style={style}>
        {content}
      </div>
    );
  };

  return (
    <section className="home-reference-wrap">
      <div className="home-reference-grid">{items.map((item, index) => renderCard(item, index))}</div>
    </section>
  );
}

function HomeDiscoverSection({ section, locale }: { section: PageSectionRecord; locale: SiteLocale }) {
  const items = asItems(section.props.items);

  return (
    <section className="space-y-8">
      <h2 className="section-heading text-center reveal-up">
        {asString(locale === "en" ? section.props.titleEn : section.props.titleZh) || asString(section.props.title) || (locale === "en" ? "Discover More" : "发现更多")}
      </h2>
      <div className="discover-reference-grid">
        {items.map((item, index) => (
          <Link
            key={`${pickText(item, "headline", locale)}-${index}`}
            href={item.href || "#"}
            className="discover-reference-card card-hover-scale external-link-shift reveal-up"
            style={{ animationDelay: `${index * 90}ms` }}
          >
            {pickText(item, "meta", locale) ? <p className="discover-reference-meta">{pickText(item, "meta", locale)}</p> : null}
            <h3 className="discover-reference-title">{pickText(item, "headline", locale, localeFallback(locale, item.title || "内容", item.titleEn || item.title || "Entry"))}</h3>
            {pickText(item, "subheadline", locale) ? <p className="discover-reference-copy">{pickText(item, "subheadline", locale)}</p> : null}
            <span className="discover-reference-arrow">
              <i className="ri-arrow-right-up-line" aria-hidden />
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}

function FeatureGridSection({ section, locale, site }: { section: PageSectionRecord; locale: SiteLocale; site: SiteRecord }) {
  if (section.variant === "home-bento-reference") {
    return <HomeReferenceGridSection section={section} locale={locale} site={site} />;
  }

  if (section.variant === "discover-grid-reference") {
    return <HomeDiscoverSection section={section} locale={locale} />;
  }

  const items = asItems(section.props.items);

  if (section.variant === "status-pills") {
    return (
      <section className="mx-auto flex max-w-3xl flex-wrap justify-center gap-3">
        {items.map((item) => (
          <div key={`${item.title}-${item.description}`} className="status-pill">
            <span className="status-pill-value">{item.title}</span>
            <span className="status-pill-label">{item.description}</span>
          </div>
        ))}
      </section>
    );
  }

  if (section.variant === "home-bento") {
    return (
      <section className="home-bento-grid">
        {items.map((item) => {
          const Icon = iconFor(asString(item.icon));
          const tone = item.tone || "plain";
          const cardClass = `home-bento-card ${tone === "image" ? "is-image" : ""} ${tone === "accent" ? "is-accent" : ""} ${
            tone === "muted" ? "is-muted" : ""
          } ${sizeClass(asString(item.size))}`;
          const content = (
            <>
              <div className="relative z-[1] flex h-full flex-col">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    {item.eyebrow ? <p className="home-card-kicker">{item.eyebrow}</p> : null}
                    {item.meta ? <p className="mt-1 text-xs uppercase tracking-[0.18em] text-faint">{item.meta}</p> : null}
                  </div>
                  {item.image ? null : <Icon aria-hidden className="h-4 w-4 text-faint" />}
                </div>
                <div className="mt-auto">
                  <h3 className="home-card-title">{item.title}</h3>
                  {item.description ? <p className="home-card-copy">{item.description}</p> : null}
                </div>
              </div>
              {item.image ? <div className="home-card-image" style={{ backgroundImage: `url(${item.image})` }} /> : null}
            </>
          );

          return item.href ? (
            <Link key={`${item.title}-${item.href}`} href={item.href} className={cardClass}>
              {content}
            </Link>
          ) : (
            <div key={`${item.title}-${item.description}`} className={cardClass}>
              {content}
            </div>
          );
        })}
      </section>
    );
  }

  if (section.variant === "discover-poster") {
    return (
      <section className="space-y-8">
        {asString(section.props.title) ? <h2 className="section-heading text-center">{asString(section.props.title)}</h2> : null}
        <div className="grid gap-4 lg:grid-cols-2">
          {items.map((item) => (
            <Link key={`${item.title}-${item.href}`} href={item.href || "#"} className="discover-card">
              <div className="flex items-start justify-between gap-4">
                <p className="home-card-kicker">{item.eyebrow}</p>
                <ArrowUpRight aria-hidden className="h-4 w-4 text-faint" />
              </div>
              <h3 className="discover-card-title whitespace-pre-line">{item.title}</h3>
              <p className="discover-card-copy">{item.description}</p>
              {item.meta ? <p className="mt-8 text-xs uppercase tracking-[0.2em] text-faint">{item.meta}</p> : null}
            </Link>
          ))}
        </div>
      </section>
    );
  }

  if (section.variant === "tool-directory") {
    const sectionTitle = pickText(asRecord(section.props), "title", locale, localeFallback(locale, asString(section.props.title), ""));
    return (
      <section className="space-y-6">
        {sectionTitle ? <h2 className="section-heading text-center">{sectionTitle}</h2> : null}
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {items.map((item) => {
            const Icon = iconFor(asString(item.icon));
            const title = pickText(item, "title", locale, localeFallback(locale, item.title || "工具", item.titleEn || item.title || "Tool"));
            const description = pickText(item, "description", locale, localeFallback(locale, item.description || "", ""));
            const meta = pickText(item, "meta", locale, localeFallback(locale, item.meta || "", ""));
            return (
              <Link key={`${title}-${item.href}`} href={item.href || "#"} className="directory-card">
                <div className="flex items-start justify-between gap-3">
                  <div className="directory-icon">
                    <Icon aria-hidden className="h-4 w-4" />
                  </div>
                  {meta ? <p className="directory-meta">{meta}</p> : null}
                </div>
                <h3 className="directory-title">{title}</h3>
                <p className="directory-copy">{description}</p>
              </Link>
            );
          })}
        </div>
      </section>
    );
  }

  if (section.variant === "friend-cards") {
    const sectionTitle = pickText(asRecord(section.props), "title", locale, localeFallback(locale, asString(section.props.title), ""));
    return (
      <section className="space-y-6">
        {sectionTitle ? <h2 className="section-heading text-center">{sectionTitle}</h2> : null}
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {items.map((item) => {
            const title = pickText(item, "title", locale, localeFallback(locale, item.title || "条目", item.titleEn || item.title || "Entry"));
            const meta = pickText(item, "meta", locale, localeFallback(locale, item.meta || "", ""));
            const description = pickText(item, "description", locale, localeFallback(locale, item.description || "", ""));
            const avatar = item.avatar || title.slice(0, 1) || "?";

            return (
              <Link key={`${title}-${item.href}`} href={item.href || "#"} className="friend-card" target={item.href?.startsWith("http") ? "_blank" : undefined}>
                <div className="flex items-start gap-4">
                  <div className="friend-avatar">{avatar}</div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="friend-title">{title}</h3>
                      <ArrowUpRight aria-hidden className="mt-1 h-4 w-4 text-faint" />
                    </div>
                    {meta ? <p className="friend-meta">{meta}</p> : null}
                    <p className="friend-quote">{description}</p>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </section>
    );
  }

  if (section.variant === "thought-stream") {
    const sectionTitle = pickText(asRecord(section.props), "title", locale, localeFallback(locale, asString(section.props.title), ""));
    return (
      <section className="space-y-6">
        {sectionTitle ? <h2 className="section-heading text-center">{sectionTitle}</h2> : null}
        <div className="thoughts-stream">
          {items.map((item, index) => {
            const title = pickText(item, "title", locale, localeFallback(locale, item.title || "新想法", item.titleEn || item.title || "Thought"));
            const meta = pickText(item, "meta", locale, localeFallback(locale, item.meta || "", ""));
            const description = pickText(item, "description", locale, localeFallback(locale, item.description || "", ""));
            const avatar = title.slice(0, 1) || "•";
            // eslint-disable-next-line react/jsx-key
            return (
              <article className="thought-entry">
                <div className="thought-entry-avatar">{avatar}</div>
                <div className="thought-entry-body">
                  <div className="thought-entry-head">
                    <h3 className="thought-entry-title">{title}</h3>
                    {meta ? <p className="thought-entry-meta">{meta}</p> : null}
                  </div>
                  {description ? <p className="thought-entry-copy">{description}</p> : null}
                </div>
              </article>
            );
          })}
        </div>
      </section>
    );
  }

  if (section.variant === "comment-stream") {
    const sectionTitle = pickText(asRecord(section.props), "title", locale, localeFallback(locale, asString(section.props.title), ""));
    return (
      <section className="space-y-6">
        {sectionTitle ? <h2 className="section-heading text-center">{sectionTitle}</h2> : null}
        <div className="comment-stream">
          {items.map((item, index) => {
            const title = pickText(item, "title", locale, localeFallback(locale, item.title || "访客", item.titleEn || item.title || "Visitor"));
            const meta = pickText(item, "meta", locale, localeFallback(locale, item.meta || "", ""));
            const description = pickText(item, "description", locale, localeFallback(locale, item.description || "", ""));
            const statusTone = /approved|已通过/i.test(meta) ? "is-approved" : /hidden|已隐藏/i.test(meta) ? "is-hidden" : "is-pending";
            const badgeText =
              /approved|已通过/i.test(meta) ? (locale === "en" ? "Approved" : "已通过") : /hidden|已隐藏/i.test(meta) ? (locale === "en" ? "Hidden" : "已隐藏") : (locale === "en" ? "Pending" : "待审核");
            // eslint-disable-next-line react/jsx-key
            return (
              <article className="comment-entry">
                <div className="comment-entry-head">
                  <div>
                    <h3 className="comment-entry-title">{title}</h3>
                    {meta ? <p className="comment-entry-meta">{meta}</p> : null}
                  </div>
                  <span className={`comment-entry-badge ${statusTone}`}>{badgeText}</span>
                </div>
                {description ? <p className="comment-entry-copy">{description}</p> : null}
              </article>
            );
          })}
        </div>
      </section>
    );
  }

  const sectionTitle = pickText(asRecord(section.props), "title", locale, localeFallback(locale, asString(section.props.title), ""));
  return (
    <section className="space-y-6">
      {sectionTitle ? <h2 className="section-heading text-center">{sectionTitle}</h2> : null}
      <div className="grid gap-4 md:grid-cols-3">
        {items.map((item) => {
          const eyebrow = pickText(item, "eyebrow", locale, localeFallback(locale, item.eyebrow || "", ""));
          const title = pickText(item, "title", locale, localeFallback(locale, item.title || "条目", item.titleEn || item.title || "Entry"));
          const description = pickText(item, "description", locale, localeFallback(locale, item.description || "", ""));

          return (
            <Link key={`${title}-${item.href}`} href={item.href || "#"} className="directory-card">
              <p className="home-card-kicker">{eyebrow}</p>
              <h3 className="directory-title">{title}</h3>
              <p className="directory-copy">{description}</p>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

function FeaturedPostsSection({
  section,
  posts,
  locale
}: {
  section: PageSectionRecord;
  posts: ContentRecord[];
  locale: SiteLocale;
}) {
  const slugs = Array.isArray(section.props.slugs)
    ? section.props.slugs.filter((item): item is string => typeof item === "string")
    : [];
  const featured =
    slugs.length > 0
      ? slugs.map((slug) => posts.find((post) => post.slug === slug)).filter(Boolean)
      : posts.slice(0, 4);

  return (
    <section className="space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="editorial-kicker">
            {asString(locale === "en" ? section.props.titleEn : section.props.titleZh) || asString(section.props.title) || (locale === "en" ? "Recent Writing" : "最近文章")}
          </p>
          {pickText(asRecord(section.props), "description", locale, localeFallback(locale, asString(section.props.description), "")) ? (
            <p className="mt-3 max-w-2xl text-sm leading-7 text-muted">{pickText(asRecord(section.props), "description", locale, localeFallback(locale, asString(section.props.description), ""))}</p>
          ) : null}
        </div>
        <Link href="/blog" className="text-sm text-muted transition hover:text-foreground">
          {locale === "en" ? "Open archive" : "查看归档"}
        </Link>
      </div>
      <div className="border-t hairline">
        {featured.map((post) => {
          const entry = post as ContentRecord;
          return (
            <article key={entry.slug} className="editorial-list-item">
              <div className="editorial-list-date">{dateLabel(entry.publishedAt, locale)}</div>
              <div className="min-w-0">
                <Link href={`/blog/${entry.slug}`} className="editorial-list-title">
                  {contentField(entry, locale, "title") || entry.title || entry.titleEn || (locale === "en" ? "Article" : "文章")}
                </Link>
                {contentField(entry, locale, "summary") ? <p className="editorial-list-copy">{contentField(entry, locale, "summary")}</p> : null}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

export function PageSections({
  sections,
  posts,
  projects,
  site,
  preview = false,
  locale = "zh"
}: {
  sections: PageSectionRecord[];
  posts: ContentRecord[];
  projects: ContentRecord[];
  site: SiteRecord;
  preview?: boolean;
  locale?: SiteLocale;
}) {
  const enabledSections = sections.filter((section) => section.enabled).sort((a, b) => a.order - b.order);

  return (
    <div className={`space-y-20 ${preview ? "space-y-12" : ""}`}>
      {enabledSections.map((section) => {
        if (section.type === "hero_statement") {
          if (section.variant === "poster-emoji") {
            return <HomeHeroSection key={section.id} section={section} locale={locale} site={site} />;
          }

          if (section.variant === "poster-home") {
            const heroRecord = asRecord(section.props);
            return (
              <section
                key={section.id}
                className={`home-hero ${preview ? "min-h-[26rem] py-10" : "min-h-[calc(100svh-3.75rem)] py-14 md:py-20"}`}
              >
                <p className="editorial-kicker">{pickText(heroRecord, "eyebrow", locale, site.name)}</p>
                <h1 className="poster-title mt-8 whitespace-pre-line">{pickText(heroRecord, "title", locale)}</h1>
                {pickText(heroRecord, "body", locale) ? <p className="poster-summary">{pickText(heroRecord, "body", locale)}</p> : null}
                <div className="home-poster-actions">
                  {pickText(heroRecord, "primaryLabel", locale, localeFallback(locale, asString(section.props.primaryLabel), "")) && asString(section.props.primaryHref) ? (
                    <Link href={asString(section.props.primaryHref)} className="home-poster-link">
                      {pickText(heroRecord, "primaryLabel", locale, localeFallback(locale, asString(section.props.primaryLabel), ""))}
                    </Link>
                  ) : null}
                  {pickText(heroRecord, "secondaryLabel", locale, localeFallback(locale, asString(section.props.secondaryLabel), "")) && asString(section.props.secondaryHref) ? (
                    <Link href={asString(section.props.secondaryHref)} className="home-poster-link">
                      {pickText(heroRecord, "secondaryLabel", locale, localeFallback(locale, asString(section.props.secondaryLabel), ""))}
                    </Link>
                  ) : null}
                </div>
              </section>
            );
          }

          const heroRecord = asRecord(section.props);
          return (
            <section key={section.id} className="editorial-header">
              <p className="editorial-kicker">{pickText(heroRecord, "eyebrow", locale)}</p>
              <h1 className="editorial-title">{pickText(heroRecord, "title", locale)}</h1>
              {pickText(heroRecord, "body", locale) ? <p className="editorial-summary">{pickText(heroRecord, "body", locale)}</p> : null}
            </section>
          );
        }

        if (section.type === "intro_richtext") {
          if (section.variant === "intro-lines") {
            return <HomeIntroSection key={section.id} section={section} locale={locale} />;
          }

          return (
            <section key={section.id}>
              <SectionMarkdown markdown={pickText(asRecord(section.props), "bodyMarkdown", locale, localeFallback(locale, asString(section.props.bodyMarkdown), ""))} variant={section.variant} />
            </section>
          );
        }

        if (section.type === "feature_grid") {
          return <FeatureGridSection key={section.id} section={section} locale={locale} site={site} />;
        }

        if (section.type === "featured_posts") {
          return <FeaturedPostsSection key={section.id} section={section} posts={posts} locale={locale} />;
        }

        if (section.type === "quote_panel") {
          const quote = pickText(asRecord(section.props), "quote", locale, localeFallback(locale, asString(section.props.quote), ""));
          const citation = pickText(asRecord(section.props), "citation", locale, localeFallback(locale, asString(section.props.citation), ""));

          return (
            <section key={section.id} className="mx-auto max-w-4xl border-y hairline py-12 text-center">
              <blockquote className="serif-title text-[clamp(1.75rem,1.5rem+1vw,2.75rem)] leading-[1.35]">{quote}</blockquote>
              {citation ? <p className="mt-6 text-sm text-muted">{citation}</p> : null}
            </section>
          );
        }

        if (section.type === "link_cluster") {
          if (section.variant === "footer-columns-reference") {
            return null;
          }

          const links = asLinks(section.props.links);

          if (section.variant === "social-inline") {
            return (
              <section key={section.id} className="flex flex-wrap items-center justify-center gap-3 text-sm text-muted">
                {links.map((link) => {
                  const Icon = linkIcon(link.label);
                  const resolved = pickLinkText(link, locale);
                  return (
                    <Link key={link.href} href={link.href} className="social-link">
                      <Icon aria-hidden className="h-4 w-4" />
                      <span>{resolved.label}</span>
                    </Link>
                  );
                })}
              </section>
            );
          }

          return (
            <section key={section.id} className="grid gap-3">
              {links.map((link) => (
                <Link key={link.href} href={link.href} className="directory-card">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="directory-title text-xl">{pickLinkText(link, locale).label}</p>
                      {pickLinkText(link, locale).description ? (
                        <p className="directory-copy mt-2">{pickLinkText(link, locale).description}</p>
                      ) : null}
                    </div>
                    <ArrowUpRight aria-hidden className="h-4 w-4 text-faint" />
                  </div>
                </Link>
              ))}
            </section>
          );
        }

        if (section.type === "image_story") {
          return (
            <section key={section.id} className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-end">
              <div
                className="relative min-h-[24rem] overflow-hidden rounded-lg border hairline bg-cover bg-center"
                style={{ backgroundImage: `url(${asString(section.props.image)})` }}
                aria-label={asString(section.props.alt) || site.title}
              />
              <div className="space-y-4 pb-2">
                <p className="editorial-kicker">{pickText(asRecord(section.props), "eyebrow", locale, localeFallback(locale, asString(section.props.eyebrow), ""))}</p>
                <h2 className="section-heading text-left">{pickText(asRecord(section.props), "title", locale, localeFallback(locale, asString(section.props.title), ""))}</h2>
                <p className="max-w-xl text-base leading-8 text-muted">{pickText(asRecord(section.props), "body", locale, localeFallback(locale, asString(section.props.body), ""))}</p>
              </div>
            </section>
          );
        }

        if (section.type === "timeline") {
          const items = asItems(section.props.items);
          const timelineTitle = pickText(asRecord(section.props), "title", locale, localeFallback(locale, asString(section.props.title), ""));
          return (
            <section key={section.id} className="mx-auto max-w-3xl space-y-8">
              {timelineTitle ? <h2 className="section-heading text-center">{timelineTitle}</h2> : null}
              <div className="space-y-8 border-l hairline pl-6">
                {items.map((item) => (
                  <article key={`${item.meta}-${item.title}`} className="timeline-item">
                    <p className="editorial-kicker">{pickText(item, "meta", locale, localeFallback(locale, item.meta || "", ""))}</p>
                    <h3 className="serif-title mt-2 text-2xl">{pickText(item, "title", locale, localeFallback(locale, item.title || "动态", item.titleEn || item.title || "Moment"))}</h3>
                    <p className="mt-3 text-sm leading-7 text-muted">{pickText(item, "body", locale, localeFallback(locale, item.body || "", ""))}</p>
                  </article>
                ))}
              </div>
            </section>
          );
        }

        if (section.type === "contact_strip") {
          const links = asLinks(section.props.links);
          return (
            <section key={section.id} className="contact-strip">
              <div>
                <p className="editorial-kicker">{pickText(asRecord(section.props), "title", locale, localeFallback(locale, asString(section.props.title), ""))}</p>
                <p className="mt-4 max-w-2xl text-sm leading-8 text-muted">
                  {pickText(asRecord(section.props), "body", locale, localeFallback(locale, asString(section.props.body), ""))}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-5 text-sm">
                {links.map((link) => (
                  <Link key={link.href} href={link.href} className="transition hover:text-foreground">
                    {pickLinkText(link, locale).label}
                  </Link>
                ))}
              </div>
            </section>
          );
        }

        if (section.type === "project_directory") {
          return (
            <section key={section.id} className="space-y-6">
              <div className="text-center">
                <p className="editorial-kicker">
                  {pickText(asRecord(section.props), "title", locale, locale === "en" ? "Projects" : "项目")}
                </p>
                {pickText(asRecord(section.props), "description", locale, localeFallback(locale, asString(section.props.description), "")) ? (
                  <p className="mt-3 text-sm text-muted">{pickText(asRecord(section.props), "description", locale, localeFallback(locale, asString(section.props.description), ""))}</p>
                ) : null}
              </div>
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {projects.map((project) => (
                  <Link key={project.slug} href={`/lab/${project.slug}`} className="directory-card">
                    <h3 className="directory-title">{contentField(project, locale, "title") || project.title || project.titleEn || (locale === "en" ? "Project" : "项目")}</h3>
                    {contentField(project, locale, "summary") ? <p className="directory-copy">{contentField(project, locale, "summary")}</p> : null}
                  </Link>
                ))}
              </div>
            </section>
          );
        }

        if (section.type === "custom_html") {
          const html = pickText(asRecord(section.props), "html", locale, localeFallback(locale, asString(section.props.html), ""));
          const title = pickText(asRecord(section.props), "title", locale, localeFallback(locale, asString(section.props.title), ""));

          return (
            <section key={section.id} className="space-y-5">
              {title ? <p className="editorial-kicker">{title}</p> : null}
              <div
                className="prose-endless max-w-none"
                dangerouslySetInnerHTML={{ __html: sanitizeCustomHtml(html) }}
              />
            </section>
          );
        }

        return null;
      })}
    </div>
  );
}
