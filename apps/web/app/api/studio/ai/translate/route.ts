import { NextResponse } from "next/server";
import { mapAiError, runStudioAiAction } from "@/lib/content-store";
import { assertStudioApiSession } from "@/lib/studio-auth";

export async function POST(request: Request) {
  try {
    await assertStudioApiSession();
    const body = (await request.json()) as {
      sourceLocale?: "zh-CN" | "en-US";
      targetLocale?: "zh-CN" | "en-US";
      instruction?: string;
      source?: {
        title?: string;
        summary?: string;
        bodyMarkdown?: string;
        seoTitle?: string;
        seoDescription?: string;
      };
    };

    const payload = await runStudioAiAction({
      action: "translate",
      sourceLocale: body.sourceLocale ?? "zh-CN",
      targetLocale: body.targetLocale ?? "en-US",
      instruction: body.instruction ?? "",
      source: body.source ?? {}
    });

    return NextResponse.json(payload);
  } catch (error) {
    return NextResponse.json(
      { error: mapAiError(error) },
      { status: error instanceof Error && error.message === "Unauthorized" ? 401 : 500 }
    );
  }
}
