import { NextResponse } from "next/server";
import { assertStudioApiSession } from "@/lib/studio-auth";
import { mapAiError, runStudioAiChat } from "@/lib/content-store";

export async function POST(request: Request) {
  try {
    await assertStudioApiSession();
    const body = (await request.json()) as {
      prompt?: string;
      locale?: "zh-CN" | "en-US";
    };

    const payload = await runStudioAiChat({
      prompt: body.prompt ?? "",
      locale: body.locale ?? "zh-CN"
    });

    return NextResponse.json(payload);
  } catch (error) {
    return NextResponse.json(
      { error: mapAiError(error) },
      { status: error instanceof Error && error.message === "Unauthorized" ? 401 : 500 }
    );
  }
}
