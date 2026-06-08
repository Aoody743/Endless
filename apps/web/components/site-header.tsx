"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { ThemeToggle } from "./theme-toggle";
import { useLanguage, t } from "./use-language";

const navItems = [
  { key: "home", labelZh: "首页", labelEn: "Home", href: "/", icon: "ri-home-line" },
  { key: "blog", labelZh: "博客", labelEn: "Blog", href: "/blog", icon: "ri-news-line" },
  { key: "lab", labelZh: "实验室", labelEn: "Lab", href: "/lab", icon: "ri-server-line" },
  { key: "friends", labelZh: "友链", labelEn: "Friends", href: "/friends", icon: "ri-contacts-line" },
  { key: "about", labelZh: "关于", labelEn: "About", href: "/about", icon: "ri-cup-line" },
  { key: "thoughts", labelZh: "朋友圈", labelEn: "Thoughts", href: "/thoughts", icon: "ri-chat-3-line" },
  { key: "comments", labelZh: "评论", labelEn: "Comments", href: "/comments", icon: "ri-message-2-line" },
  { key: "links", labelZh: "链接", labelEn: "Links", href: "/links", icon: "ri-links-line" },
  { key: "photos", labelZh: "照片", labelEn: "Photos", href: "/photos", icon: "ri-image-line" },
  { key: "resume", labelZh: "简历", labelEn: "Resume", href: "/resume", icon: "ri-profile-line" }
];

function isActive(pathname: string, href: string) {
  if (href === "/") {
    return pathname === "/";
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

export function SiteHeader({
  siteName,
  navigationOrder,
  enabledNavKeys
}: {
  siteName: string;
  navigationOrder?: string[];
  enabledNavKeys?: string[];
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const { language, setLanguage, toggle } = useLanguage();
  const [compact, setCompact] = useState(false);
  const orderedNavItems = useMemo(() => {
    if (!navigationOrder?.length) {
      return navItems.filter((item) => !enabledNavKeys?.length || enabledNavKeys.includes(item.key));
    }
    const map = new Map(navItems.map((item) => [item.key, item]));
    return navigationOrder
      .map((key) => map.get(key))
      .filter((item): item is (typeof navItems)[number] => Boolean(item))
      .filter((item) => !enabledNavKeys?.length || enabledNavKeys.includes(item.key));
  }, [enabledNavKeys, navigationOrder]);
  const isHome = pathname === "/";
  const compactMode = !isHome || compact;

  useEffect(() => {
    document.documentElement.lang = language === "ZH" ? "zh-CN" : "en";
  }, [language]);

  useEffect(() => {
    if (!isHome) {
      setCompact(true);
      return;
    }

    const onScroll = () => {
      setCompact(window.scrollY > 96);
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [isHome]);

  return (
    <header className={`site-header ${compactMode ? "is-compact" : ""}`}>
      <div className="shell site-header-inner">
        <div className="site-header-side hidden md:flex">
          <Link href="/" className="site-brand site-brand--compact">
            <span className="site-brand-word">{siteName}</span>
          </Link>
        </div>

        <Link href="/" className="site-brand site-brand--compact md:hidden">
          <span className="site-brand-word">{siteName}</span>
        </Link>

        <nav className="site-nav hidden md:flex" aria-label="Main">
          {orderedNavItems.map((item) => {
            const active = isActive(pathname, item.href);
            return (
              <Link key={item.href} href={item.href} className={`site-nav-link ${active ? "is-active" : ""}`}>
                <i className={`site-nav-icon ${item.icon}`} aria-hidden />
                {t(language, item.labelZh, item.labelEn)}
              </Link>
            );
          })}
        </nav>

        <div className="site-header-side hidden items-center justify-end gap-4 md:flex">
          <Link href="/search" className="site-tool-square" aria-label={t(language, "搜索", "Search")} title={t(language, "搜索", "Search")}>
            <i className="ri-search-line" aria-hidden />
          </Link>
          <div className="site-language-toggle" aria-label={t(language, "切换语言", "Toggle language")}>
            <button type="button" className={`site-language-option ${language === "ZH" ? "is-active" : ""}`} onClick={() => setLanguage("ZH")}>
              中
            </button>
            <button type="button" className={`site-language-option ${language === "EN" ? "is-active" : ""}`} onClick={() => setLanguage("EN")}>
              En
            </button>
          </div>
          <Link href="/studio" className="site-tool-square" aria-label={t(language, "打开工作台", "Open Studio")} title={t(language, "打开工作台", "Open Studio")}>
            <i className="ri-user-line" aria-hidden />
          </Link>
          <ThemeToggle />
        </div>

        <div className="flex items-center gap-2 md:hidden">
          <Link href="/search" className="site-tool-button" aria-label={t(language, "搜索", "Search")}>
            <i className="ri-search-line" aria-hidden />
          </Link>
          <button type="button" className="site-tool-button site-mobile-lang" onClick={toggle} aria-label={t(language, "切换语言", "Toggle language")}>
            <span className="site-lang-text">
              <span className={language === "ZH" ? "is-active" : ""}>中</span>
              <span className="mx-1 text-faint">/</span>
              <span className={language === "EN" ? "is-active" : ""}>En</span>
            </span>
          </button>
          <ThemeToggle />
          <button
            type="button"
            onClick={() => setOpen((current) => !current)}
            className="site-tool-button"
            aria-expanded={open}
            aria-label={t(language, "打开菜单", "Toggle menu")}
          >
            <Menu aria-hidden className="h-4 w-4" />
          </button>
        </div>
      </div>

      {open ? (
        <div className="shell pb-4 md:hidden">
          <nav className="site-mobile-nav" aria-label="Mobile">
            {orderedNavItems.map((item) => {
              const active = isActive(pathname, item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className={`site-mobile-link ${active ? "is-active" : ""}`}
                >
                  <i className={`${item.icon} mr-2`} aria-hidden />
                  {t(language, item.labelZh, item.labelEn)}
                </Link>
              );
            })}
            <Link href="/studio" onClick={() => setOpen(false)} className="site-mobile-link">
              <i className="ri-user-line mr-2" aria-hidden />
              {t(language, "工作台", "Studio")}
            </Link>
          </nav>
        </div>
      ) : null}
    </header>
  );
}
