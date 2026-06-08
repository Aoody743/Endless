import { StudioContentList } from "@/components/studio-content-list";
import { getStudioSiteSettings, listStudioContent } from "@/lib/content-store";

interface StudioPagesPageProps {
  searchParams: {
    status?: string;
    q?: string;
  };
}

export default async function StudioPagesPage({ searchParams }: StudioPagesPageProps) {
  const [items, settings] = await Promise.all([
    listStudioContent({
      type: "PAGE",
      status: (searchParams.status as "ALL" | "DRAFT" | "SCHEDULED" | "PUBLISHED" | "ARCHIVED" | undefined) ?? "ALL",
      query: searchParams.q
    }),
    getStudioSiteSettings()
  ]);

  const templatePages = {
    home: items.find((item) => item.templateKey === "HOME" || item.slug === "home"),
    about: items.find((item) => item.templateKey === "ABOUT" || item.slug === "about"),
    lab: items.find((item) => item.templateKey === "LAB" || item.slug === "lab"),
    friends: items.find((item) => item.slug === "friends"),
    thoughts: items.find((item) => item.slug === "thoughts"),
    links: items.find((item) => item.slug === "links"),
    photos: items.find((item) => item.slug === "photos"),
    resume: items.find((item) => item.slug === "resume"),
    comments: items.find((item) => item.slug === "comments")
  };

  return (
    <StudioContentList
      items={items}
      selectedStatus={searchParams.status ?? "ALL"}
      query={searchParams.q ?? ""}
      siteSnapshot={settings.site}
      studioSnapshot={settings.studio}
      templatePages={templatePages}
      mode="pages"
    />
  );
}
