"use client";

import Link from "next/link";
import { useLanguage } from "./use-language";

type LocalizedField = string | { zh?: string; en?: string };

function resolveField(value: LocalizedField | undefined, language: "ZH" | "EN") {
  if (!value) {
    return "";
  }

  if (typeof value === "string") {
    return value;
  }

  if (language === "EN") {
    return value.en ?? "";
  }

  return value.zh ?? value.en ?? "";
}

export function EditorialPageHeader({
  eyebrow,
  title,
  description,
  align = "left"
}: {
  eyebrow: LocalizedField;
  title: LocalizedField;
  description?: LocalizedField;
  align?: "left" | "center";
}) {
  const { language } = useLanguage();
  const resolvedEyebrow = resolveField(eyebrow, language);
  const resolvedTitle = resolveField(title, language);
  const resolvedDescription = resolveField(description, language);

  return (
    <header className={`editorial-header ${align === "center" ? "is-centered" : ""}`}>
      <p className="editorial-kicker">{resolvedEyebrow}</p>
      <h1 className="editorial-title">{resolvedTitle}</h1>
      {resolvedDescription ? <p className="editorial-summary">{resolvedDescription}</p> : null}
    </header>
  );
}

export function PageBreadcrumb({
  items
}: {
  items: Array<{ label: string; href?: string }>;
}) {
  return (
    <div className="page-shell mt-16 md:mt-20">
      <nav aria-label="breadcrumb">
        <ol className="editorial-breadcrumb">
          {items.map((item, index) => (
            <li key={`${item.label}-${index}`} className="inline-flex items-center gap-2">
              {index > 0 ? <span className="text-faint">/</span> : null}
              {item.href ? (
                <Link href={item.href} className="transition hover:text-foreground">
                  {item.label}
                </Link>
              ) : (
                <span className="text-foreground">{item.label}</span>
              )}
            </li>
          ))}
        </ol>
      </nav>
      <div className="mt-8 border-t hairline" />
    </div>
  );
}

export function LocalizedBreadcrumb({
  items
}: {
  items: Array<{ labelZh: string; labelEn: string; href?: string }>;
}) {
  const { language } = useLanguage();

  return (
    <div className="page-shell mt-16 md:mt-20">
      <nav aria-label="breadcrumb">
        <ol className="editorial-breadcrumb">
          {items.map((item, index) => {
            const label = language === "EN" ? item.labelEn : item.labelZh;

            return (
              <li key={`${item.labelZh}-${index}`} className="inline-flex items-center gap-2">
                {index > 0 ? <span className="text-faint">/</span> : null}
                {item.href ? (
                  <Link href={item.href} className="transition hover:text-foreground">
                    {label}
                  </Link>
                ) : (
                  <span className="text-foreground">{label}</span>
                )}
              </li>
            );
          })}
        </ol>
      </nav>
      <div className="mt-8 border-t hairline" />
    </div>
  );
}
