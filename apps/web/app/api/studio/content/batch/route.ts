import { NextResponse } from "next/server";
import { batchStudioContentAction } from "@/lib/content-store";
import { assertStudioApiSession } from "@/lib/studio-auth";

export async function POST(request: Request) {
  try {
    await assertStudioApiSession();
    const payload = (await request.json()) as { ids?: unknown; action?: unknown };
    const ids = Array.isArray(payload.ids) ? payload.ids.filter((id): id is string => typeof id === "string") : [];
    const action = payload.action === "delete" ? "delete" : payload.action === "hide" ? "hide" : "archive";
    const result = await batchStudioContentAction(ids, action);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to run batch action." },
      { status: error instanceof Error && error.message === "Unauthorized" ? 401 : 500 }
    );
  }
}
