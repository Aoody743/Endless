type FooterLink = { label: string; labelZh?: string; labelEn?: string; href: string; external?: boolean; description?: string; descriptionZh?: string; descriptionEn?: string };
type FooterColumn = { title: string; titleZh?: string; titleEn?: string; links: FooterLink[] };

export type FooterConfig = {
  brandDescription?: string;
  brandDescriptionZh?: string;
  brandDescriptionEn?: string;
  socialLinks?: FooterLink[];
  columns?: FooterColumn[];
  legalLine?: string;
  legalLineZh?: string;
  legalLineEn?: string;
  legalLinks?: FooterLink[];
};

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

function asLinks(value: unknown): FooterLink[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((entry): entry is Record<string, unknown> => typeof entry === "object" && entry !== null)
    .map((entry) => ({
      label: asString(entry.label),
      labelZh: asString(entry.labelZh) || undefined,
      labelEn: asString(entry.labelEn) || undefined,
      href: asString(entry.href),
      description: asString(entry.description) || undefined,
      descriptionZh: asString(entry.descriptionZh) || undefined,
      descriptionEn: asString(entry.descriptionEn) || undefined,
      external: asBoolean(entry.external)
    }))
    .filter((entry) => entry.label && entry.href && !isPlaceholderHref(entry.href));
}

function asColumns(value: unknown): FooterColumn[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((entry): entry is Record<string, unknown> => typeof entry === "object" && entry !== null)
    .map((entry) => ({
      title: asString(entry.title),
      titleZh: asString(entry.titleZh) || undefined,
      titleEn: asString(entry.titleEn) || undefined,
      links: asLinks(entry.links)
    }))
    .filter((entry) => entry.title && entry.links.length > 0);
}

export function footerConfigFromProps(props: Record<string, unknown> | undefined): FooterConfig | undefined {
  if (!props) return undefined;
  return {
    brandDescription: asString(props.brandDescription) || undefined,
    brandDescriptionZh: asString(props.brandDescriptionZh) || undefined,
    brandDescriptionEn: asString(props.brandDescriptionEn) || undefined,
    socialLinks: asLinks(props.socialLinks),
    columns: asColumns(props.columns),
    legalLine: asString(props.legalLine) || undefined,
    legalLineZh: asString(props.legalLineZh) || undefined,
    legalLineEn: asString(props.legalLineEn) || undefined,
    legalLinks: asLinks(props.legalLinks)
  };
}
