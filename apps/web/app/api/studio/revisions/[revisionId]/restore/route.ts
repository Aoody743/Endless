import { NextResponse } from "next/server";
import { restoreStudioRevision } from "@/lib/content-store";
import { assertStudioApiSession } from "@/lib/studio-auth";

interface RouteProps {
  params: {
    revisionId: string;
  };
}

export async function POST(_: Request, { params }: RouteProps) {
  try {
    await assertStudioApiSession();
    const contentItemId = await restoreStudioRevision(params.revisionId);
    return NextResponse.json({ contentItemId });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to restore revision." },
      { status: error instanceof Error && error.message === "Unauthorized" ? 401 : 500 }
    );
  }
}
