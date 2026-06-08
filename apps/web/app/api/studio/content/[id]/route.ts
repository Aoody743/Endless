import { NextResponse } from "next/server";
import { getStudioContent, listStudioMediaAssets, resolveCategories, resolveTags, saveStudioContent } from "@/lib/content-store";
import { parseStudioPayload } from "@/lib/studio";
import { assertStudioApiSession } from "@/lib/studio-auth";

interface RouteProps {
  params: {
    id: string;
  };
}

export async function GET(_: Request, { params }: RouteProps) {
  try {
    await assertStudioApiSession();
    const item = await getStudioContent(params.id);
    if (!item) {
      return NextResponse.json({ error: "Content not found." }, { status: 404 });
    }
    return NextResponse.json({ item });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to load content." },
      { status: error instanceof Error && error.message === "Unauthorized" ? 401 : 500 }
    );
  }
}

export async function PATCH(request: Request, { params }: RouteProps) {
  try {
    await assertStudioApiSession();
    const payload = (await request.json()) as Record<string, unknown>;
    const [tags, categories, mediaAssets] = await Promise.all([resolveTags(), resolveCategories(), listStudioMediaAssets()]);
    const input = parseStudioPayload(payload, tags, categories, mediaAssets.map((asset) => asset.id));
    const item = await saveStudioContent(params.id, input, {
      reason: typeof payload.reason === "string" ? payload.reason : undefined
    });

    return NextResponse.json({ item });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to save content." },
      { status: error instanceof Error && error.message === "Unauthorized" ? 401 : 500 }
    );
  }
}
