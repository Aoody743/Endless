"use client";

import type { ContentRecord } from "@endless/content";
import Link from "next/link";
import { FileStack, FolderKanban, LayoutTemplate, PencilLine, Settings2 } from "lucide-react";
import { usePathname } from "next/navigation";
import { StudioLogoutButton } from "./studio-logout-button";

const navItems = [
  { href: "/studio", label: "Dashboard", meta: "Overview", icon: PencilLine },
  { href: "/studio/writing", label: "写作", meta: "Writing", icon: FileStack },
  { href: "/studio/pages", label: "页面", meta: "Pages", icon: LayoutTemplate },
  { href: "/studio/settings/site", label: "站点", meta: "Site", icon: Settings2 }
];

export function StudioSidebar({ recentDrafts, recentPages }: { recentDrafts: ContentRecord[]; recentPages: ContentRecord[] }) {
  const pathname = usePathname();

  return (
    <aside className="studio-sidebar">
      <div className="studio-sidebar-inner">
        <div className="studio-sidebar-brand">
          <p className="meta mb-2">Studio</p>
          <h2 className="studio-sidebar-title">写作工作台</h2>
          <p className="mt-3 text-sm leading-7 text-muted">写文章、搭页面、处理媒体与发布状态，都在同一个安静的工作面里。</p>
        </div>

        <nav className="studio-sidebar-nav">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = item.href === "/studio" ? pathname === "/studio" : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`studio-sidebar-link ${active ? "is-active" : ""}`}
              >
                <Icon aria-hidden className="h-4 w-4" />
                <span>{item.label}</span>
                <span className="ml-auto text-[0.68rem] uppercase tracking-[0.16em] text-faint">{item.meta}</span>
              </Link>
            );
          })}
        </nav>

        <div className="mt-10 space-y-8">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 text-sm text-muted">
              <FolderKanban aria-hidden className="h-4 w-4" />
              最近草稿
            </div>
            <div className="studio-sidebar-stack">
              {recentDrafts.map((item) => (
                <Link
                  key={item.id}
                  href={`/studio/editor/${item.id}`}
                  className="studio-sidebar-card"
                >
                  <div className="truncate font-medium text-foreground">{item.title}</div>
                  <div className="mt-1 truncate text-xs text-muted">{item.type.toLowerCase()} · {item.slug}</div>
                </Link>
              ))}
            </div>
          </div>

          <div>
            <div className="mb-3 inline-flex items-center gap-2 text-sm text-muted">
              <LayoutTemplate aria-hidden className="h-4 w-4" />
              页面入口
            </div>
            <div className="studio-sidebar-stack">
              {recentPages.map((item) => (
                <Link
                  key={item.id}
                  href={`/studio/editor/${item.id}`}
                  className="studio-sidebar-card"
                >
                  <div className="truncate font-medium text-foreground">{item.title}</div>
                  <div className="mt-1 truncate text-xs text-muted">{item.templateKey.toLowerCase()} · {item.layoutMode.toLowerCase()}</div>
                </Link>
              ))}
            </div>
          </div>

          <div className="pt-2">
            <StudioLogoutButton />
          </div>
        </div>
      </div>
    </aside>
  );
}
