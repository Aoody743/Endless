import Link from "next/link";
import { notFound } from "next/navigation";
import { getStudioContent, listStudioRevisions } from "@/lib/content-store";
import { RestoreRevisionButton } from "./restore-revision-button";

interface StudioVersionsPageProps {
  params: {
    contentId: string;
  };
}

export default async function StudioVersionsPage({ params }: StudioVersionsPageProps) {
  const [item, revisions] = await Promise.all([getStudioContent(params.contentId), listStudioRevisions(params.contentId)]);
  if (!item) {
    notFound();
  }

  return (
    <div className="studio-page">
      <section className="studio-hero">
        <p className="meta mb-2 uppercase">Version history</p>
        <h1 className="serif-title text-4xl">{item.title}</h1>
        <Link href={`/studio/editor/${item.id}`} className="mt-4 inline-flex text-sm text-muted transition hover:text-foreground">
          Back to editor
        </Link>
      </section>

      <div className="grid gap-4">
        {revisions.map((revision) => (
          <article key={revision.id} className="studio-surface">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <div className="text-sm text-muted">
                  {new Intl.DateTimeFormat("zh-CN", { dateStyle: "medium", timeStyle: "short" }).format(new Date(revision.createdAt))}
                </div>
                <h2 className="mt-2 text-lg font-medium text-foreground">{revision.reason ?? "Revision snapshot"}</h2>
                <p className="mt-2 max-w-2xl text-sm leading-7 text-muted">{revision.summary || "No summary for this revision."}</p>
              </div>
              <RestoreRevisionButton revisionId={revision.id} />
            </div>
            <pre className="studio-note mt-4 overflow-x-auto text-xs leading-6">
              {revision.bodyMarkdown.slice(0, 900)}
            </pre>
          </article>
        ))}
      </div>
    </div>
  );
}
