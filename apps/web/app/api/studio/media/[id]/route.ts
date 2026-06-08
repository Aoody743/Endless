import { NextResponse } from "next/server";
import { deleteStudioMediaAsset, updateStudioMediaAsset } from "@/lib/content-store";
import { deleteMediaFile } from "@/lib/media-storage";
import { assertStudioApiSession } from "@/lib/studio-auth";

interface RouteProps {
  params: {
    id: string;
  };
}

export async function PATCH(request: Request, { params }: RouteProps) {
  try {
    await assertStudioApiSession();
    const payload = (await request.json()) as { alt?: string };
    const asset = await updateStudioMediaAsset(params.id, {
      alt: payload.alt
    });
    return NextResponse.json({ asset });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to update media." },
      { status: error instanceof Error && error.message === "Unauthorized" ? 401 : 500 }
    );
  }
}

export async function DELETE(_: Request, { params }: RouteProps) {
  try {
    await assertStudioApiSession();
    const asset = await deleteStudioMediaAsset(params.id);
    if (asset.provider === "LOCAL") {
      await deleteMediaFile(asset.key);
    }
    return NextResponse.json({ asset });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to delete media." },
      { status: error instanceof Error && error.message === "Unauthorized" ? 401 : 500 }
    );
  }
}
