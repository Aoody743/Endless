"use client";

import type { SiteRecord } from "@endless/content";
import { usePathname } from "next/navigation";
import { PublicFooter } from "@/components/public-footer";
import { SiteHeader } from "@/components/site-header";
import type { FooterConfig } from "./footer-config";

interface RootChromeProps {
  children: React.ReactNode;
  site: SiteRecord;
  siteName: string;
  navigationOrder?: string[];
  enabledNavKeys?: string[];
  footerConfig?: FooterConfig;
}

export function RootChrome({ children, site, siteName, navigationOrder, enabledNavKeys, footerConfig }: RootChromeProps) {
  const pathname = usePathname();
  const isStudioRoute = pathname.startsWith("/studio");

  if (isStudioRoute) {
    return <div className="min-h-screen">{children}</div>;
  }

  return (
    <>
      <SiteHeader siteName={siteName} navigationOrder={navigationOrder} enabledNavKeys={enabledNavKeys} />
      <div className="min-h-screen pt-[3.5rem] md:pt-[3.65rem]">{children}</div>
      <PublicFooter site={site} config={footerConfig} enabledNavKeys={enabledNavKeys} />
    </>
  );
}
