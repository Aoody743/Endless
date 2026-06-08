import { StudioContentList } from "@/components/studio-content-list";
import { listStudioContent } from "@/lib/content-store";

interface StudioWritingPageProps {
  searchParams: {
    status?: string;
    q?: string;
  };
}

export default async function StudioWritingPage({ searchParams }: StudioWritingPageProps) {
  const [posts, docs, projects] = await Promise.all([
    listStudioContent({
      type: "POST",
      status: (searchParams.status as "ALL" | "DRAFT" | "SCHEDULED" | "PUBLISHED" | "ARCHIVED" | undefined) ?? "ALL",
      query: searchParams.q
    }),
    listStudioContent({
      type: "DOC",
      status: (searchParams.status as "ALL" | "DRAFT" | "SCHEDULED" | "PUBLISHED" | "ARCHIVED" | undefined) ?? "ALL",
      query: searchParams.q
    }),
    listStudioContent({
      type: "PROJECT",
      status: (searchParams.status as "ALL" | "DRAFT" | "SCHEDULED" | "PUBLISHED" | "ARCHIVED" | undefined) ?? "ALL",
      query: searchParams.q
    })
  ]);

  const items = [...posts, ...docs, ...projects].sort((a, b) => new Date(b.updatedAt ?? 0).getTime() - new Date(a.updatedAt ?? 0).getTime());

  return (
    <StudioContentList
      items={items}
      selectedStatus={searchParams.status ?? "ALL"}
      query={searchParams.q ?? ""}
      mode="writing"
    />
  );
}
