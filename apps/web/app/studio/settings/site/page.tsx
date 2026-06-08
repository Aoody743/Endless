import { getStudioSiteSettings } from "@/lib/content-store";
import { StudioSiteSettingsForm } from "@/components/studio-site-settings-form";

export default async function StudioSiteSettingsPage() {
  const settings = await getStudioSiteSettings();

  return <StudioSiteSettingsForm settings={settings} />;
}
