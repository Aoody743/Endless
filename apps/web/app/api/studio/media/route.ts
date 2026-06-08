import { NextResponse } from "next/server";
import { createStudioMediaAsset, listStudioMediaAssets } from "@/lib/content-store";
import { createMediaObjectKey, mediaUrlForKey, writeMediaFile } from "@/lib/media-storage";
import { assertStudioApiSession } from "@/lib/studio-auth";

export async function GET() {
  try {
    await assertStudioApiSession();
    const assets = await listStudioMediaAssets();
    return NextResponse.json({ assets });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to load media." },
      { status: error instanceof Error && error.message === "Unauthorized" ? 401 : 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    await assertStudioApiSession();
    const formData = await request.formData();
    const file = formData.get("file");
    const alt = typeof formData.get("alt") === "string" ? String(formData.get("alt")) : "uploaded-image";

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "File is required." }, { status: 400 });
    }

    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ error: "Only image uploads are supported right now." }, { status: 400 });
    }

    const key = await createMediaObjectKey(file.name);
    await writeMediaFile(key, new Uint8Array(await file.arrayBuffer()));

    const asset = await createStudioMediaAsset({
      provider: "LOCAL",
      key,
      url: mediaUrlForKey(key),
      mimeType: file.type || "application/octet-stream",
      alt
    });

    return NextResponse.json({ asset });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to upload media." },
      { status: error instanceof Error && error.message === "Unauthorized" ? 401 : 500 }
    );
  }
}
