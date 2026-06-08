import { redirect } from "next/navigation";

interface StudioContentPageProps {
  searchParams: {
    type?: string;
    status?: string;
    q?: string;
  };
}

export default async function StudioContentPage({ searchParams }: StudioContentPageProps) {
  const params = new URLSearchParams();
  if (searchParams.status) params.set("status", searchParams.status);
  if (searchParams.q) params.set("q", searchParams.q);
  redirect(`/studio/writing${params.toString() ? `?${params.toString()}` : ""}`);
}
