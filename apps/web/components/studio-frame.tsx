"use client";

/* eslint-disable @next/next/no-img-element */

import type { SiteRecord, StudioConfigRecord } from "@endless/content";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, FileText, Home, LayoutTemplate, Settings2 } from "lucide-react";
import { StudioLogoutButton } from "./studio-logout-button";
import { useStudioLocale } from "./studio-locale";

const navItems = [
  { href: "/studio", labelZh: "仪表盘", labelEn: "Dashboard", icon: BarChart3 },
  { href: "/studio/writing", labelZh: "写作", labelEn: "Writing", icon: FileText },
  { href: "/studio/pages", labelZh: "页面", labelEn: "Pages", icon: LayoutTemplate },
  { href: "/studio/settings/site", labelZh: "设置", labelEn: "Settings", icon: Settings2 }
];

export function StudioFrame({
  children,
  site,
  studio
}: {
  children: React.ReactNode;
  site: SiteRecord;
  studio: StudioConfigRecord;
}) {
  const pathname = usePathname();
  const { t } = useStudioLocale();

  return (
    <div className="studio-frame">
      <aside className="studio-nav-rail" aria-label={t("工作台导航", "Studio navigation")}>
        <Link href="/studio" className="studio-rail-brand" aria-label={t("回到仪表盘", "Back to dashboard")}>
          <img
            src={studio.profile.avatarUrl || "/images/daydreamer-avatar.png"}
            alt={studio.profile.siteName || site.name}
            className="studio-rail-avatar"
          />
        </Link>
        <nav className="studio-rail-links">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = item.href === "/studio" ? pathname === "/studio" : pathname.startsWith(item.href);
            return (
              <Link key={item.href} href={item.href} className={`studio-rail-link ${active ? "is-active" : ""}`}>
                <Icon aria-hidden className="h-5 w-5" />
                <span>{t(item.labelZh, item.labelEn)}</span>
              </Link>
            );
          })}
        </nav>
        <div className="studio-rail-bottom">
          <Link href="/" className="studio-rail-main-link" aria-label={t("回到主站", "Back to main site")}>
            <Home aria-hidden className="h-4 w-4" />
            <span>{t("主站", "main site")}</span>
          </Link>
          <StudioLogoutButton />
        </div>
      </aside>

      <section className="studio-workspace">
        <div className="studio-workspace-body">{children}</div>
      </section>
    </div>
  );
}
