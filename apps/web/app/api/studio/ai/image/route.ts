import { NextResponse } from "next/server";
import { assertStudioApiSession } from "@/lib/studio-auth";
import { mapAiError, runStudioAiImage } from "@/lib/content-store";

export async function POST(request: Request) {
  try {
    await assertStudioApiSession();
    const body = (await request.json()) as {
      prompt?: string;
      size?: "1024x1024" | "1536x1024" | "1024x1536";
      model?: string;
    };
    const result = await runStudioAiImage({
      prompt: body.prompt ?? "",
      size: body.size,
      model: body.model
    });
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: mapAiError(error) },
      { status: error instanceof Error && error.message === "Unauthorized" ? 401 : 500 }
    );
  }
}
