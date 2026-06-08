import { NextResponse } from "next/server";
import type { ContentStatus, ContentType } from "@endless/content";
import type { PagePresetKey } from "@/lib/page-presets";
import {
  createStudioContent,
  getStudioAIStatus,
  listStudioContent,
  listStudioMediaAssets,
  resolveCategories,
  resolveProjects,
  resolvePublishedPosts,
  resolveSite,
  resolveTags
} from "@/lib/content-store";
import { assertStudioApiSession } from "@/lib/studio-auth";

const contentTypes = new Set(["POST", "PAGE", "DOC", "PROJECT", "ALL"]);
const contentStatuses = new Set(["DRAFT", "SCHEDULED", "PUBLISHED", "ARCHIVED", "ALL"]);

function option<T extends string>(value: string | null, allowed: Set<string>): T | undefined {
  return value && allowed.has(value) ? (value as T) : undefined;
}

export async function GET(request: Request) {
  try {
    await assertStudioApiSession();
    const params = new URL(request.url).searchParams;
    const type = option<ContentType | "ALL">(params.get("type"), contentTypes);
    const status = option<ContentStatus | "ALL">(params.get("status"), contentStatuses);
    const query = params.get("q")?.trim() || undefined;

    const [items, tags, categories, mediaAssets, posts, projects, site, aiStatus] = await Promise.all([
      listStudioContent({ type, status, query }),
      resolveTags(),
      resolveCategories(),
      listStudioMediaAssets(),
      resolvePublishedPosts(),
      resolveProjects(),
      resolveSite(),
      getStudioAIStatus()
    ]);

    return NextResponse.json({
      items,
      tags,
      categories,
      mediaAssets,
      posts,
      projects,
      site,
      aiStatus
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to load content." },
      { status: error instanceof Error && error.message === "Unauthorized" ? 401 : 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    await assertStudioApiSession();
    const body = (await request.json()) as { type?: "POST" | "PAGE" | "DOC" | "PROJECT"; preset?: PagePresetKey };
    const id = await createStudioContent(body.type ?? "POST", body.type === "PAGE" ? body.preset : undefined);
    return NextResponse.json({ id });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to create content." },
      { status: error instanceof Error && error.message === "Unauthorized" ? 401 : 500 }
    );
  }
}
