type LegalSection = {
  titleZh: string;
  titleEn: string;
  paragraphs: Array<{
    zh: string;
    en: string;
  }>;
};

export function LegalPage({
  eyebrowZh,
  eyebrowEn,
  titleZh,
  titleEn,
  descriptionZh,
  descriptionEn,
  sections,
  footerZh,
  footerEn,
  contactHref,
  contactZh,
  contactEn,
  updatedLabelZh,
  updatedLabelEn
}: {
  eyebrowZh: string;
  eyebrowEn: string;
  titleZh: string;
  titleEn: string;
  descriptionZh: string;
  descriptionEn: string;
  sections: LegalSection[];
  footerZh?: string;
  footerEn?: string;
  contactHref?: string;
  contactZh?: string;
  contactEn?: string;
  updatedLabelZh?: string;
  updatedLabelEn?: string;
}) {
  return (
    <main className="page-shell min-h-screen pb-24 pt-10 md:pt-20">
      <article className="mx-auto max-w-4xl">
        <header className="border-b hairline pb-8">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-faint">
            {eyebrowZh} / {eyebrowEn}
          </p>
          <h1 className="mt-4 font-serif text-4xl leading-tight text-foreground md:text-6xl">
            {titleZh}
            <span className="mt-2 block text-2xl text-muted md:text-3xl">{titleEn}</span>
          </h1>
          <div className="mt-6 grid gap-4 text-base leading-8 text-muted md:grid-cols-2">
            <p>{descriptionZh}</p>
            <p>{descriptionEn}</p>
          </div>
        </header>

        <div className="mt-8 grid gap-6">
          {sections.map((section) => (
            <section key={`${section.titleZh}-${section.titleEn}`} className="rounded-3xl border border-border bg-surface p-6 shadow-sm md:p-8">
              <h2 className="font-serif text-2xl text-foreground md:text-3xl">
                {section.titleZh}
                <span className="mt-1 block text-sm text-muted md:text-base">{section.titleEn}</span>
              </h2>
              <div className="mt-5 grid gap-4 text-sm leading-7 text-muted md:grid-cols-2 md:text-base">
                {section.paragraphs.map((paragraph, index) => (
                  <div key={`${section.titleZh}-${index}`} className="space-y-4">
                    <p>{paragraph.zh}</p>
                    <p>{paragraph.en}</p>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>

        {(footerZh || footerEn || contactHref) ? (
          <footer className="mt-8 rounded-3xl border border-border bg-surface p-6 shadow-sm md:p-8">
            <div className="grid gap-4 text-sm leading-7 text-muted md:grid-cols-2 md:text-base">
              {footerZh ? <p>{footerZh}</p> : <div />}
              {footerEn ? <p>{footerEn}</p> : <div />}
            </div>
            {contactHref ? (
              <div className="mt-5 border-t hairline pt-5">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-faint">
                  {updatedLabelZh || "联系"} / {updatedLabelEn || "Contact"}
                </p>
                <a href={contactHref} className="mt-3 inline-flex items-center gap-2 font-medium text-foreground transition hover:text-accent">
                  <span>{contactZh || contactHref}</span>
                  <span className="text-muted">{contactEn || contactHref}</span>
                </a>
              </div>
            ) : null}
          </footer>
        ) : null}
      </article>
    </main>
  );
}
