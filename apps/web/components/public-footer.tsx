"use client";

import Link from "next/link";
import type { SiteRecord } from "@endless/content";
import { useLanguage, t } from "./use-language";
import type { FooterConfig } from "./footer-config";

type FooterLink = { label: string; labelZh?: string; labelEn?: string; href: string; external?: boolean };
type FooterColumn = { title: string; titleZh?: string; titleEn?: string; links: FooterLink[] };

const footerNavMap = new Map([
  ["/", "home"],
  ["/blog", "blog"],
  ["/lab", "lab"],
  ["/friends", "friends"],
  ["/about", "about"],
  ["/thoughts", "thoughts"],
  ["/comments", "comments"],
  ["/links", "links"],
  ["/photos", "photos"],
  ["/resume", "resume"]
]);

const defaultFooterColumnsZh: FooterColumn[] = [
  {
    title: "页面",
    links: [
      { label: "首页", href: "/" },
      { label: "博客", href: "/blog" },
      { label: "实验室", href: "/lab" },
      { label: "友链", href: "/friends" },
      { label: "关于", href: "/about" },
      { label: "朋友圈", href: "/thoughts" },
      { label: "评论", href: "/comments" },
      { label: "链接", href: "/links" },
      { label: "照片墙", href: "/photos" },
      { label: "简历", href: "/resume" }
    ]
  },
  {
    title: "系统",
    links: [
      { label: "搜索", href: "/search" },
      { label: "RSS", href: "/rss.xml" },
      { label: "工作台", href: "/studio" },
      { label: "登录", href: "/login" }
    ]
  },
  {
    title: "内容",
    links: [
      { label: "文章", href: "/posts" },
      { label: "项目", href: "/projects" },
      { label: "朋友圈", href: "/thoughts" }
    ]
  }
];

const defaultFooterColumnsEn: FooterColumn[] = [
  {
    title: "Pages",
    links: [
      { label: "Home", href: "/" },
      { label: "Blog", href: "/blog" },
      { label: "Lab", href: "/lab" },
      { label: "Friends", href: "/friends" },
      { label: "About", href: "/about" },
      { label: "Thoughts", href: "/thoughts" },
      { label: "Comments", href: "/comments" },
      { label: "Links", href: "/links" },
      { label: "Photos", href: "/photos" },
      { label: "Resume", href: "/resume" }
    ]
  },
  {
    title: "System",
    links: [
      { label: "Search", href: "/search" },
      { label: "RSS", href: "/rss.xml" },
      { label: "Studio", href: "/studio" },
      { label: "Login", href: "/login" }
    ]
  },
  {
    title: "Content",
    links: [
      { label: "Posts", href: "/posts" },
      { label: "Projects", href: "/projects" },
      { label: "Thoughts", href: "/thoughts" }
    ]
  }
];

export function PublicFooter({
  site,
  config,
  enabledNavKeys
}: {
  site: SiteRecord;
  config?: FooterConfig;
  enabledNavKeys?: string[];
}) {
  const { language } = useLanguage();
  const defaultColumns = language === "EN" ? defaultFooterColumnsEn : defaultFooterColumnsZh;
  const configuredColumns = config?.columns?.length ? config.columns : [];
  const sourceColumns = configuredColumns.length >= 2 ? configuredColumns : defaultColumns;
  const supportNote = t(
    language,
    "为个人网站、长文笔记与模块化页面服务的写作优先发布系统。",
    "Writing-first publishing for personal websites, long-form notes, and modular pages."
  );
  const columns = sourceColumns
    .map((column) => ({
      ...column,
      links: column.links.filter((link) => {
        const navKey = footerNavMap.get(link.href);
        if (!navKey) {
          return true;
        }
        return !enabledNavKeys?.length || enabledNavKeys.includes(navKey);
      })
    }))
    .filter((column) => column.links.length > 0);
  const socialLinks = config?.socialLinks?.length ? config.socialLinks : [];
  const legalLinks = config?.legalLinks?.length ? config.legalLinks : [];
  const legalLine =
    (language === "EN" ? config?.legalLineEn : config?.legalLineZh) ||
    config?.legalLine ||
    t(language, "浅色与深色分别打磨为独立阅读氛围。", "Light and dark are tuned as separate reading moods.");
  const configuredBrandDescription = (language === "EN" ? config?.brandDescriptionEn : config?.brandDescriptionZh) || config?.brandDescription || site.description;
  const brandDescription =
    configuredBrandDescription === "写作优先、内容优先的个人网站 CMS。" ||
    configuredBrandDescription === "A writing-first CMS for personal publishing."
      ? t(
          language,
          "长期写作、页面编排与安静发布的一体化站点系统。",
          "An integrated site system for long-form writing, page composition, and quiet publishing."
        )
      : configuredBrandDescription;

  return (
    <footer className="border-t hairline">
      <div className="shell footer-grid">
        <div className="footer-lead">
          <div className="site-brand site-brand--compact">
            <span className="site-brand-word">{site.name}</span>
          </div>
          <p className="footer-description">{brandDescription}</p>
          <p className="footer-note">{supportNote}</p>
          {socialLinks.length > 0 ? (
            <div className="footer-socials">
              {socialLinks.map((link) => (
                <Link
                  key={`${link.label}-${link.href}`}
                  href={link.href}
                  className="footer-social-link"
                  target={link.external ? "_blank" : undefined}
                >
                  {(language === "EN" ? link.labelEn : link.labelZh) || (language === "EN" ? "Link" : link.label)}
                  <i className="ri-arrow-right-up-line" aria-hidden />
                </Link>
              ))}
            </div>
          ) : null}
        </div>

        {columns.map((column) => (
          <nav key={`${column.title}-${column.titleEn || ""}`} className="footer-column">
            <p className="footer-title">{(language === "EN" ? column.titleEn : column.titleZh) || (language === "EN" ? "Column" : column.title)}</p>
            <div className="footer-links text-sm">
              {column.links.map((link) => (
                <Link key={link.href} href={link.href} className="footer-link" target={link.external ? "_blank" : undefined}>
                  {(language === "EN" ? link.labelEn : link.labelZh) || (language === "EN" ? "Link" : link.label)}
                </Link>
              ))}
            </div>
          </nav>
        ))}
      </div>

      <div className="shell footer-bottom">
        <p>{t(language, `版权所有 © 2026 ${site.name}。`, `Copyright © 2026 ${site.name}.`)}</p>
        <div className="footer-legal">
          <p>{legalLine}</p>
          {legalLinks.map((link) => (
            <Link key={`${link.label}-${link.href}`} href={link.href} className="footer-link" target={link.external ? "_blank" : undefined}>
              {(language === "EN" ? link.labelEn : link.labelZh) || (language === "EN" ? "Link" : link.label)}
            </Link>
          ))}
        </div>
      </div>
    </footer>
  );
}
