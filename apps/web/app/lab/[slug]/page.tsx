import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { contentDescription, renderMarkdown } from "@endless/content";
import { resolveCanonicalContentUrl, resolveProjectBySlug, resolveProjects, resolveSite } from "@/lib/content-store";
import { LocalizedBreadcrumb } from "@/components/public-primitives";
import { PublicProjectDetail } from "@/components/public-project-detail";

interface LabProjectPageProps {
  params: {
    slug: string;
  };
}

export async function generateStaticParams() {
  const projects = await resolveProjects();
  return projects.map((project) => ({ slug: project.slug }));
}

export async function generateMetadata({ params }: LabProjectPageProps): Promise<Metadata> {
  const [project, site] = await Promise.all([resolveProjectBySlug(params.slug), resolveSite()]);
  if (!project) {
    return {};
  }

  const url = await resolveCanonicalContentUrl(site, project);

  return {
    title: project.seoTitle ?? project.title,
    description: contentDescription(site, project),
    alternates: {
      canonical: url
    },
    openGraph: {
      title: project.seoTitle ?? project.title,
      description: contentDescription(site, project),
      url,
      images: [`/og/${project.slug}`]
    }
  };
}

export default async function LabProjectPage({ params }: LabProjectPageProps) {
  const [project, site] = await Promise.all([resolveProjectBySlug(params.slug), resolveSite()]);
  if (!project) {
    notFound();
  }

  const [renderedZh, renderedEn] = await Promise.all([
    renderMarkdown(project.bodyMarkdown),
    renderMarkdown(project.bodyMarkdownEn?.trim() || project.bodyMarkdown || "")
  ]);

  return (
    <>
      <PublicProjectDetail project={project} htmlZh={renderedZh.html} htmlEn={renderedEn.html} />
      <LocalizedBreadcrumb
        items={[
          { labelZh: site.name, labelEn: site.name, href: "/" },
          { labelZh: "实验室", labelEn: "Lab", href: "/lab" },
          { labelZh: project.title, labelEn: project.titleEn || project.title || "Project" }
        ]}
      />
    </>
  );
}
