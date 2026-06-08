import Link from "next/link";
import type { ReactNode } from "react";
import ReactMarkdown from "react-markdown";
import rehypeKatex from "rehype-katex";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";

const audioPattern = /\.(mp3|wav|ogg|m4a|aac|flac)(\?.*)?$/i;
const videoPattern = /\.(mp4|webm|mov|m4v|ogv)(\?.*)?$/i;

function asText(children: ReactNode) {
  if (typeof children === "string") return children;
  if (!Array.isArray(children)) return "";
  return children
    .map((entry) => (typeof entry === "string" ? entry : ""))
    .join("")
    .trim();
}

function MediaAwareLink({ href, children }: { href?: string; children: ReactNode }) {
  const resolvedHref = href?.trim() ?? "";
  const caption = asText(children);

  if (audioPattern.test(resolvedHref)) {
    return (
      <span className="prose-media-embed">
        <audio controls preload="metadata" src={resolvedHref} className="prose-media-player" />
        {caption ? <span className="prose-media-caption">{caption}</span> : null}
      </span>
    );
  }

  if (videoPattern.test(resolvedHref)) {
    return (
      <span className="prose-media-embed">
        <video controls preload="metadata" src={resolvedHref} className="prose-media-player prose-media-player--video" />
        {caption ? <span className="prose-media-caption">{caption}</span> : null}
      </span>
    );
  }

  if (!resolvedHref) {
    return <>{children}</>;
  }

  const external = /^(https?:\/\/|mailto:|tel:)/i.test(resolvedHref);
  if (external) {
    return (
      <a href={resolvedHref} target="_blank" rel="noreferrer">
        {children}
      </a>
    );
  }

  return <Link href={resolvedHref}>{children}</Link>;
}

export function ProseMarkdown({ markdown }: { markdown: string }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm, remarkMath]}
      rehypePlugins={[rehypeKatex]}
      components={{
        a: ({ href, children }) => <MediaAwareLink href={href}>{children}</MediaAwareLink>
      }}
    >
      {markdown}
    </ReactMarkdown>
  );
}
