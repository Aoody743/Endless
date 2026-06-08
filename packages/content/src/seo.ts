import type { ContentRecord, SiteRecord } from "./types";

export function absoluteUrl(site: SiteRecord, path = "/") {
  return new URL(path, site.url).toString();
}

export function contentPath(item: ContentRecord) {
  if (item.type === "POST") {
    return `/blog/${item.slug}`;
  }

  if (item.type === "PROJECT") {
    return `/lab/${item.slug}`;
  }

  if (item.type === "PAGE") {
    if (item.templateKey === "HOME") {
      return "/";
    }

    if (item.templateKey === "ABOUT") {
      return "/about";
    }

    if (item.templateKey === "LAB") {
      return "/lab";
    }
  }

  return `/${item.slug}`;
}

export function contentUrl(site: SiteRecord, item: ContentRecord) {
  return absoluteUrl(site, contentPath(item));
}

export function contentTitle(site: SiteRecord, item?: ContentRecord) {
  if (!item) {
    return site.title;
  }

  return item.seoTitle ?? `${item.title} - ${site.name}`;
}

export function contentDescription(site: SiteRecord, item?: ContentRecord) {
  return item?.seoDescription ?? item?.summary ?? site.description;
}
