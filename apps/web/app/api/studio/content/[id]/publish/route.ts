import { NextResponse } from "next/server";
import { publishStudioContent } from "@/lib/content-store";
import { assertStudioApiSession } from "@/lib/studio-auth";

interface RouteProps {
  params: {
    id: string;
  };
}

export async function POST(_: Request, { params }: RouteProps) {
  try {
    await assertStudioApiSession();
    const item = await publishStudioContent(params.id);
    return NextResponse.json({ item });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to publish content." },
      { status: error instanceof Error && error.message === "Unauthorized" ? 401 : 500 }
    );
  }
}
