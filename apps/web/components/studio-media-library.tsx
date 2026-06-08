"use client";

import type { StudioMediaAssetRecord } from "@/lib/content-store";
import { Copy, ImagePlus, Save, Trash2 } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";

export function StudioMediaLibrary({ assets }: { assets: StudioMediaAssetRecord[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [alts, setAlts] = useState<Record<string, string>>(() =>
    Object.fromEntries(assets.map((asset) => [asset.id, asset.alt]))
  );

  const countLabel = useMemo(() => `${assets.length} asset${assets.length === 1 ? "" : "s"}`, [assets.length]);

  async function upload(files: FileList | null) {
    if (!files?.length) {
      return;
    }

    setUploading(true);
    setError("");

    try {
      for (const file of Array.from(files)) {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("alt", file.name.replace(/\.[^.]+$/, ""));

        const response = await fetch("/api/studio/media", {
          method: "POST",
          body: formData
        });

        if (!response.ok) {
          throw new Error("Upload failed");
        }
      }

      startTransition(() => router.refresh());
    } catch (uploadError) {
      console.error(uploadError);
      setError("Unable to upload one or more files.");
    } finally {
      setUploading(false);
    }
  }

  async function saveAlt(id: string) {
    const response = await fetch(`/api/studio/media/${id}`, {
      method: "PATCH",
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify({
        alt: alts[id] || ""
      })
    });

    if (!response.ok) {
      throw new Error("Save failed");
    }

    startTransition(() => router.refresh());
  }

  async function remove(id: string) {
    const response = await fetch(`/api/studio/media/${id}`, {
      method: "DELETE"
    });

    if (!response.ok) {
      throw new Error("Delete failed");
    }

    startTransition(() => router.refresh());
  }

  return (
    <div className="studio-page">
      <section className="studio-hero">
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
          <div>
            <p className="meta mb-2 uppercase">Media</p>
            <h1 className="serif-title text-4xl">媒体库</h1>
            <p className="mt-3 max-w-2xl leading-8 text-muted">先从本地存储开始，后面再平滑接 S3 / R2。这里的资源已经可以用于封面和正文引用。</p>
          </div>
          <label className="studio-button cursor-pointer">
            <ImagePlus aria-hidden className="h-4 w-4" />
            {uploading ? "Uploading…" : "Upload images"}
            <input
              type="file"
              accept="image/*"
              multiple
              className="sr-only"
              onChange={(event) => {
                void upload(event.target.files);
                event.currentTarget.value = "";
              }}
            />
          </label>
        </div>
      </section>

      <section className="studio-surface">
        <div className="flex items-center justify-between text-sm text-muted">
          <span>{countLabel}</span>
          {pending ? <span>Refreshing…</span> : null}
        </div>
      </section>

      {error ? <div className="studio-note text-[color:var(--accent)]">{error}</div> : null}

      {assets.length === 0 ? (
        <section className="studio-surface">
          <p className="meta mb-2 uppercase">Media</p>
          <p className="meta mb-3 uppercase">Empty library</p>
          <h2 className="serif-title text-3xl">先放几张图进来</h2>
          <p className="mt-4 max-w-2xl leading-8 text-muted">上传后的资源会立刻获得可引用地址，也能直接作为文章封面使用。</p>
        </section>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {assets.map((asset) => (
          <article key={asset.id} className="studio-mini-card overflow-hidden p-0">
            <div className="relative aspect-[4/3] bg-surface-soft">
              <Image src={asset.url} alt={asset.alt} fill sizes="(max-width: 1280px) 50vw, 33vw" className="object-cover" unoptimized />
            </div>
            <div className="grid gap-3 p-4">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-foreground">{asset.key}</p>
                <p className="mt-1 text-xs text-muted">{asset.mimeType}</p>
              </div>
              <label className="studio-label text-sm">
                <span className="studio-label-text">Alt text</span>
                <textarea
                  value={alts[asset.id] ?? ""}
                  onChange={(event) => setAlts((current) => ({ ...current, [asset.id]: event.target.value }))}
                  className="studio-textarea min-h-[5rem] leading-6"
                />
              </label>
              <div className="grid gap-2 sm:grid-cols-3">
                <button
                  type="button"
                  onClick={() => navigator.clipboard.writeText(`![${alts[asset.id] || asset.alt}](${asset.url})`)}
                  className="studio-button"
                >
                  <Copy aria-hidden className="h-4 w-4" />
                  Markdown
                </button>
                <button
                  type="button"
                  onClick={() => void saveAlt(asset.id)}
                  className="studio-button"
                >
                  <Save aria-hidden className="h-4 w-4" />
                  Save
                </button>
                <button
                  type="button"
                  onClick={() => void remove(asset.id)}
                  className="studio-button studio-button-ghost"
                >
                  <Trash2 aria-hidden className="h-4 w-4" />
                  Delete
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
