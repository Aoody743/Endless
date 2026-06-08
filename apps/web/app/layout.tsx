import type { Metadata, Viewport } from "next";
import "./globals.css";
import { footerConfigFromProps } from "@/components/footer-config";
import { RootChrome } from "@/components/root-chrome";
import { getStudioSiteSettings, resolvePublishedContent, resolveSite, resolveTemplatePage } from "@/lib/content-store";

export async function generateMetadata(): Promise<Metadata> {
  const site = await resolveSite();
  const metadataBase = (() => {
    try {
      return new URL(site.url);
    } catch {
      return new URL("http://localhost:3000");
    }
  })();

  return {
    metadataBase,
    title: {
      default: site.title,
      template: `%s - ${site.name}`
    },
    description: site.description,
    openGraph: {
      type: "website",
      locale: site.language.replace("-", "_"),
      siteName: site.name,
      title: site.title,
      description: site.description,
      url: site.url
    },
    twitter: {
      card: "summary_large_image",
      title: site.title,
      description: site.description
    }
  };
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f4efe8" },
    { media: "(prefers-color-scheme: dark)", color: "#171310" }
  ],
  colorScheme: "light dark"
};

const themeScript = `
(() => {
  try {
    const stored = localStorage.getItem("endless-theme");
    const theme = stored || (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
    document.documentElement.dataset.theme = theme;
    const language = localStorage.getItem("endless-language") === "EN" ? "en" : "zh-CN";
    document.documentElement.lang = language;
  } catch (_) {
    document.documentElement.dataset.theme = "light";
    document.documentElement.lang = "zh-CN";
  }
})();
`;

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const [site, homePage, studioSettings, publishedPages] = await Promise.all([
    resolveSite(),
    resolveTemplatePage("HOME"),
    getStudioSiteSettings().catch(() => null),
    resolvePublishedContent("PAGE").catch(() => [])
  ]);
  const footerSection = homePage?.sections.find((section) => section.type === "link_cluster" && section.variant === "footer-columns-reference");
  const footerConfig = footerConfigFromProps(footerSection?.props);
  const enabledNavKeys = (() => {
    const keys = new Set<string>(["home", "blog"]);
    for (const page of publishedPages) {
      if (page.templateKey === "LAB" || page.slug === "lab") keys.add("lab");
      if (page.templateKey === "ABOUT" || page.slug === "about") keys.add("about");
      if (page.slug === "friends") keys.add("friends");
      if (page.slug === "thoughts") keys.add("thoughts");
      if (page.slug === "comments") keys.add("comments");
      if (page.slug === "links") keys.add("links");
      if (page.slug === "photos") keys.add("photos");
      if (page.slug === "resume") keys.add("resume");
    }
    return Array.from(keys);
  })();

  return (
    <html lang={site.language} suppressHydrationWarning>
      <body>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <RootChrome
          site={site}
          siteName={site.name}
          navigationOrder={studioSettings?.studio.navigationOrder}
          enabledNavKeys={enabledNavKeys}
          footerConfig={footerConfig}
        >
          {children}
        </RootChrome>
      </body>
    </html>
  );
}
