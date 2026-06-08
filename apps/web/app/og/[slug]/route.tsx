import { ImageResponse } from "next/og";
import { resolveContentBySlug, resolveSite } from "@/lib/content-store";

export const runtime = "nodejs";

interface OgRouteProps {
  params: {
    slug: string;
  };
}

export async function GET(_: Request, { params }: OgRouteProps) {
  const [site, item] = await Promise.all([resolveSite(), resolveContentBySlug(params.slug)]);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#151210",
          color: "#f3ede4",
          padding: "72px",
          fontFamily: "Georgia, serif"
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "14px", fontSize: 28, color: "#98b5a4" }}>
          <span style={{ width: 10, height: 10, borderRadius: 9999, background: "#98b5a4" }} />
          {site.name}
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ maxWidth: 900, fontSize: 82, lineHeight: 1.06 }}>{item?.title ?? site.title}</div>
          <div style={{ maxWidth: 820, marginTop: 30, fontSize: 30, lineHeight: 1.45, color: "#b7aa9a" }}>
            {item?.summary ?? site.description}
          </div>
        </div>
        <div style={{ height: 1, background: "#2e2721", width: "100%" }} />
      </div>
    ),
    {
      width: 1200,
      height: 630
    }
  );
}
