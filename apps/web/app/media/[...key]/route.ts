import { NextResponse } from "next/server";
import { readMediaFile } from "@/lib/media-storage";
import { prisma } from "@endless/db";

interface RouteProps {
  params: {
    key: string[];
  };
}

export async function GET(_: Request, { params }: RouteProps) {
  const key = params.key.join("/");
  const asset = await prisma.mediaAsset.findUnique({
    where: { key }
  });

  if (!asset) {
    return new NextResponse("Not found", { status: 404 });
  }

  try {
    const file = await readMediaFile(key);
    return new NextResponse(file, {
      headers: {
        "content-type": asset.mimeType,
        "cache-control": "public, max-age=31536000, immutable"
      }
    });
  } catch {
    return new NextResponse("Not found", { status: 404 });
  }
}
