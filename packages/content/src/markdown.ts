import GithubSlugger from "github-slugger";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import rehypeKatex from "rehype-katex";
import rehypePrettyCode from "rehype-pretty-code";
import rehypeSlug from "rehype-slug";
import rehypeStringify from "rehype-stringify";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import { unified } from "unified";
import type { RenderedMarkdown, TocItem } from "./types";

const headingPattern = /^(#{2,4})\s+(.+)$/gm;

function stripInlineMarkdown(value: string) {
  return value
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/[*_~]/g, "")
    .trim();
}

export function extractToc(markdown: string): TocItem[] {
  const slugger = new GithubSlugger();
  const items: TocItem[] = [];
  let match: RegExpExecArray | null;

  while ((match = headingPattern.exec(markdown)) !== null) {
    const marks = match[1];
    const rawText = match[2];
    if (!marks || !rawText) {
      continue;
    }

    const depth = marks.length as TocItem["depth"];
    const text = stripInlineMarkdown(rawText);
    items.push({
      id: slugger.slug(text),
      depth,
      text
    });
  }

  return items;
}

export function estimateReadingMinutes(markdown: string) {
  const withoutCode = markdown.replace(/```[\s\S]*?```/g, "");
  const compact = withoutCode.replace(/\s+/g, "");
  return Math.max(1, Math.ceil(compact.length / 500));
}

export async function renderMarkdown(markdown: string): Promise<RenderedMarkdown> {
  const file = await unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkMath)
    .use(remarkRehype)
    .use(rehypeSlug)
    .use(rehypeAutolinkHeadings, {
      behavior: "wrap",
      properties: {
        className: ["heading-anchor"]
      }
    })
    .use(rehypeKatex)
    .use(rehypePrettyCode, {
      keepBackground: false,
      theme: {
        light: "github-light",
        dark: "github-dark"
      }
    })
    .use(rehypeStringify)
    .process(markdown);

  return {
    html: String(file),
    toc: extractToc(markdown),
    readingMinutes: estimateReadingMinutes(markdown)
  };
}
