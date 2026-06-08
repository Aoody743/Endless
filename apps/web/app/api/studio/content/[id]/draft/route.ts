import { NextResponse } from "next/server";
import { moveStudioContentToDraft } from "@/lib/content-store";
import { assertStudioApiSession } from "@/lib/studio-auth";

interface RouteProps {
  params: {
    id: string;
  };
}

export async function POST(_: Request, { params }: RouteProps) {
  try {
    await assertStudioApiSession();
    const item = await moveStudioContentToDraft(params.id);
    return NextResponse.json({ item });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to return content to draft." },
      { status: error instanceof Error && error.message === "Unauthorized" ? 401 : 500 }
    );
  }
}
