import { notFound } from "next/navigation";
import { getStudioAIStatus, getStudioImageAIStatus, resolveCategories, resolveTags, getStudioContent, listStudioMediaAssets, resolveProjects, resolvePublishedPosts, resolveSite } from "@/lib/content-store";
import { StudioEditor } from "@/components/studio-editor";

interface StudioEditorPageProps {
  params: {
    id: string;
  };
  searchParams?: {
    workspace?: "md" | "ai";
    preset?: string;
  };
}

export default async function StudioEditorPage({ params, searchParams }: StudioEditorPageProps) {
  const [item, tags, categories, mediaAssets, posts, projects, site, aiStatus, imageAiStatus] = await Promise.all([
    getStudioContent(params.id),
    resolveTags(),
    resolveCategories(),
    listStudioMediaAssets(),
    resolvePublishedPosts(),
    resolveProjects(),
    resolveSite(),
    getStudioAIStatus(),
    getStudioImageAIStatus()
  ]);

  if (!item) {
    notFound();
  }

  return (
    <StudioEditor
      item={item}
      tags={tags}
      categories={categories}
      mediaAssets={mediaAssets}
      posts={posts}
      projects={projects}
      site={site}
      aiStatus={aiStatus}
      imageAiStatus={imageAiStatus}
      initialWorkspace={searchParams?.workspace === "ai" ? "ai" : "md"}
      presetSlug={searchParams?.preset}
    />
  );
}
