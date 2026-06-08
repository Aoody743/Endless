import { NextResponse } from "next/server";
import type { StudioConfigRecord } from "@endless/content";
import { getStudioSiteSettings, saveSiteSettings } from "@/lib/content-store";
import { assertStudioApiSession } from "@/lib/studio-auth";

export async function GET() {
  try {
    await assertStudioApiSession();
    const settings = await getStudioSiteSettings();
    return NextResponse.json({ settings });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to load site settings." },
      { status: error instanceof Error && error.message === "Unauthorized" ? 401 : 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    await assertStudioApiSession();
    const payload = (await request.json()) as Record<string, unknown>;
    const studioPayload = typeof payload.studio === "object" && payload.studio !== null ? (payload.studio as Partial<StudioConfigRecord>) : undefined;
    const settings = await saveSiteSettings({
      name: typeof payload.name === "string" ? payload.name : "",
      title: typeof payload.title === "string" ? payload.title : "",
      description: typeof payload.description === "string" ? payload.description : "",
      url: typeof payload.url === "string" ? payload.url : "",
      author: typeof payload.author === "string" ? payload.author : "",
      language: typeof payload.language === "string" ? payload.language : "",
      studio: studioPayload,
      ai:
        typeof payload.ai === "object" && payload.ai !== null
          ? {
              provider: "openai-compatible",
              baseUrl: typeof (payload.ai as Record<string, unknown>).baseUrl === "string" ? ((payload.ai as Record<string, unknown>).baseUrl as string) : "",
              model: typeof (payload.ai as Record<string, unknown>).model === "string" ? ((payload.ai as Record<string, unknown>).model as string) : "",
              apiKey: typeof (payload.ai as Record<string, unknown>).apiKey === "string" ? ((payload.ai as Record<string, unknown>).apiKey as string) : undefined
            }
          : undefined,
      aiImage:
        typeof payload.aiImage === "object" && payload.aiImage !== null
          ? {
              provider: "openai-compatible",
              baseUrl: typeof (payload.aiImage as Record<string, unknown>).baseUrl === "string" ? ((payload.aiImage as Record<string, unknown>).baseUrl as string) : "",
              model: typeof (payload.aiImage as Record<string, unknown>).model === "string" ? ((payload.aiImage as Record<string, unknown>).model as string) : "",
              apiKey: typeof (payload.aiImage as Record<string, unknown>).apiKey === "string" ? ((payload.aiImage as Record<string, unknown>).apiKey as string) : undefined
            }
          : undefined
    });

    return NextResponse.json({ settings });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to save site settings." },
      { status: error instanceof Error && error.message === "Unauthorized" ? 401 : 500 }
    );
  }
}
