import { redirect } from "next/navigation";

interface LegacyProjectPageProps {
  params: {
    slug: string;
  };
}

export default function LegacyProjectPage({ params }: LegacyProjectPageProps) {
  redirect(`/lab/${params.slug}`);
}
