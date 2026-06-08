import { StudioMediaLibrary } from "@/components/studio-media-library";
import { listStudioMediaAssets } from "@/lib/content-store";

export default async function StudioMediaPage() {
  const assets = await listStudioMediaAssets();
  return <StudioMediaLibrary assets={assets} />;
}
