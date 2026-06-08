import { contentItems, estimateReadingMinutes, site } from "@endless/content";
import { PrismaClient } from "@prisma/client";
import type { Prisma } from "@prisma/client";

const prisma = new PrismaClient();

function toJson(value: unknown): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}

async function main() {
  const author = await prisma.user.upsert({
    where: { email: "owner@endless.local" },
    update: {
      name: site.author
    },
    create: {
      email: "owner@endless.local",
      name: site.author,
      role: "OWNER"
    }
  });

  for (const item of contentItems) {
    for (const tag of item.tags) {
      await prisma.tag.upsert({
        where: { slug: tag.slug },
        update: {
          name: tag.name,
          nameEn: tag.nameEn,
          description: tag.description
          ,
          descriptionEn: tag.descriptionEn
        },
        create: {
          name: tag.name,
          nameEn: tag.nameEn,
          slug: tag.slug,
          description: tag.description,
          descriptionEn: tag.descriptionEn
        }
      });
    }

    for (const category of item.categories) {
      await prisma.category.upsert({
        where: { slug: category.slug },
        update: {
          name: category.name,
          nameEn: category.nameEn,
          description: category.description
          ,
          descriptionEn: category.descriptionEn
        },
        create: {
          name: category.name,
          nameEn: category.nameEn,
          slug: category.slug,
          description: category.description,
          descriptionEn: category.descriptionEn
        }
      });
    }

    let coverMediaId: string | undefined;
    if (item.cover) {
      const cover = await prisma.mediaAsset.upsert({
        where: { key: item.cover.key },
        update: {
          url: item.cover.url,
          mimeType: item.cover.mimeType,
          width: item.cover.width,
          height: item.cover.height,
          alt: item.cover.alt
        },
        create: {
          key: item.cover.key,
          url: item.cover.url,
          mimeType: item.cover.mimeType,
          width: item.cover.width,
          height: item.cover.height,
          alt: item.cover.alt
        }
      });
      coverMediaId = cover.id;
    }

    const saved = await prisma.contentItem.upsert({
      where: { slug: item.slug },
      update: {
        type: item.type,
        status: item.status,
        title: item.title,
        titleEn: item.titleEn,
        summary: item.summary,
        summaryEn: item.summaryEn,
        bodyMarkdown: item.bodyMarkdown,
        bodyMarkdownEn: item.bodyMarkdownEn,
        layoutMode: item.layoutMode,
        templateKey: item.templateKey,
        seoTitle: item.seoTitle,
        seoTitleEn: item.seoTitleEn,
        seoDescription: item.seoDescription,
        seoDescriptionEn: item.seoDescriptionEn,
        publishedAt: item.publishedAt ? new Date(item.publishedAt) : null,
        scheduledAt: item.scheduledAt ? new Date(item.scheduledAt) : null,
        readingMinutes: estimateReadingMinutes(item.bodyMarkdown),
        coverMediaId,
        authorId: author.id,
        tags: {
          set: item.tags.map((tag) => ({ slug: tag.slug }))
        },
        categories: {
          set: item.categories.map((category) => ({ slug: category.slug }))
        }
      },
      create: {
        type: item.type,
        status: item.status,
        title: item.title,
        titleEn: item.titleEn,
        slug: item.slug,
        summary: item.summary,
        summaryEn: item.summaryEn,
        bodyMarkdown: item.bodyMarkdown,
        bodyMarkdownEn: item.bodyMarkdownEn,
        layoutMode: item.layoutMode,
        templateKey: item.templateKey,
        seoTitle: item.seoTitle,
        seoTitleEn: item.seoTitleEn,
        seoDescription: item.seoDescription,
        seoDescriptionEn: item.seoDescriptionEn,
        publishedAt: item.publishedAt ? new Date(item.publishedAt) : null,
        scheduledAt: item.scheduledAt ? new Date(item.scheduledAt) : null,
        readingMinutes: estimateReadingMinutes(item.bodyMarkdown),
        coverMediaId,
        authorId: author.id,
        tags: {
          connect: item.tags.map((tag) => ({ slug: tag.slug }))
        },
        categories: {
          connect: item.categories.map((category) => ({ slug: category.slug }))
        }
      }
    });

    await prisma.pageSection.deleteMany({
      where: { contentItemId: saved.id }
    });

    if (item.sections.length > 0) {
      await prisma.pageSection.createMany({
        data: item.sections.map((pageSection) => ({
          id: pageSection.id,
          contentItemId: saved.id,
          type: pageSection.type,
          variant: pageSection.variant,
          order: pageSection.order,
          columnSpan: pageSection.columnSpan,
          enabled: pageSection.enabled,
          props: toJson(pageSection.props)
        }))
      });
    }

    await prisma.contentRevision.upsert({
      where: {
        id: `${saved.id}-seed`
      },
      update: {
        title: item.title,
        titleEn: item.titleEn,
        summary: item.summary,
        summaryEn: item.summaryEn,
        bodyMarkdown: item.bodyMarkdown,
        bodyMarkdownEn: item.bodyMarkdownEn,
        reason: "Seed snapshot"
      },
      create: {
        id: `${saved.id}-seed`,
        contentItemId: saved.id,
        title: item.title,
        titleEn: item.titleEn,
        summary: item.summary,
        summaryEn: item.summaryEn,
        bodyMarkdown: item.bodyMarkdown,
        bodyMarkdownEn: item.bodyMarkdownEn,
        reason: "Seed snapshot"
      }
    });
  }

  await prisma.siteSetting.upsert({
    where: { key: "site" },
    update: {
      value: toJson(site)
    },
    create: {
      key: "site",
      value: toJson(site)
    }
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
