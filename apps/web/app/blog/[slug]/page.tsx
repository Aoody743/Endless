import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { contentDescription, contentTitle, renderMarkdown } from "@endless/content";
import { resolveCanonicalContentUrl, resolvePostBySlug, resolvePublishedPosts, resolveSite } from "@/lib/content-store";
import { LocalizedBreadcrumb } from "@/components/public-primitives";
import { PublicPostDetail } from "@/components/public-post-detail";

interface BlogPostPageProps {
  params: {
    slug: string;
  };
}

export async function generateStaticParams() {
  const posts = await resolvePublishedPosts();
  return posts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: BlogPostPageProps): Promise<Metadata> {
  const [post, site] = await Promise.all([resolvePostBySlug(params.slug), resolveSite()]);
  if (!post) {
    return {};
  }

  const url = await resolveCanonicalContentUrl(site, post);
  const seoTitle =
    post.seoTitle?.replace(new RegExp(`\\s*-\\s*${site.name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*$`, "u"), "") ?? post.title;

  return {
    title: seoTitle,
    description: contentDescription(site, post),
    alternates: {
      canonical: url
    },
    openGraph: {
      type: "article",
      title: seoTitle,
      description: contentDescription(site, post),
      url,
      publishedTime: post.publishedAt,
      tags: post.tags.map((tag) => tag.name),
      images: [`/og/${post.slug}`]
    }
  };
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const [post, site] = await Promise.all([resolvePostBySlug(params.slug), resolveSite()]);
  if (!post) {
    notFound();
  }

  const [renderedZh, renderedEn] = await Promise.all([
    renderMarkdown(post.bodyMarkdown),
    renderMarkdown(post.bodyMarkdownEn?.trim() || post.bodyMarkdown || "")
  ]);

  return (
    <>
      <PublicPostDetail
        post={post}
        htmlZh={renderedZh.html}
        htmlEn={renderedEn.html}
        tocZh={renderedZh.toc}
        tocEn={renderedEn.toc}
        readingMinutesZh={renderedZh.readingMinutes}
        readingMinutesEn={renderedEn.readingMinutes}
      />
      <LocalizedBreadcrumb
        items={[
          { labelZh: site.name, labelEn: site.name, href: "/" },
          { labelZh: "博客", labelEn: "Blog", href: "/blog" },
          { labelZh: post.title, labelEn: post.titleEn || post.title || "Article" }
        ]}
      />
    </>
  );
}
