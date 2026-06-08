import { getStudioSummary, getStudioSiteSettings } from "@/lib/content-store";
import { StudioFrame } from "@/components/studio-frame";
import { StudioLocaleProvider } from "@/components/studio-locale";
import { requireStudioPageSession } from "@/lib/studio-auth";

export const dynamic = "force-dynamic";

export default async function StudioLayout({ children }: { children: React.ReactNode }) {
  const session = await requireStudioPageSession();
  const [summary, settings] = await Promise.all([
    getStudioSummary().catch(() => null),
    getStudioSiteSettings().catch(() => null)
  ]);

  if (!summary || !settings) {
    return (
      <main className="studio-shell">
        <div className="studio-unavailable">
          <p className="meta mb-3">Studio unavailable / 工作台暂不可用</p>
          <h1 className="serif-title text-4xl">Studio needs a database connection / 需要数据库连接</h1>
          <p className="mt-4 leading-8 text-muted">
            Set `DATABASE_URL`, run `pnpm db:push`, then reload this page. The public site still works with fixture data, but the Studio only runs against PostgreSQL.
            <br />
            设置好 `DATABASE_URL` 后运行 `pnpm db:push`，再刷新页面。公开站点仍可使用示例数据，但 Studio 只会在 PostgreSQL 可用时启动。
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="studio-shell">
      <StudioLocaleProvider initialLocale={settings.studio.uiLanguage}>
        <StudioFrame
          site={settings.site}
          studio={settings.studio}
        >
          {children}
        </StudioFrame>
      </StudioLocaleProvider>
    </main>
  );
}
