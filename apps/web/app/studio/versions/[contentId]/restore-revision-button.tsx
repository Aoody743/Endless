"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function RestoreRevisionButton({ revisionId }: { revisionId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function restore() {
    setBusy(true);
    try {
      const response = await fetch(`/api/studio/revisions/${revisionId}/restore`, { method: "POST" });
      if (!response.ok) {
        throw new Error("Restore failed");
      }
      const data = (await response.json()) as { contentItemId: string };
      router.push(`/studio/editor/${data.contentItemId}`);
      router.refresh();
    } catch (error) {
      console.error(error);
      window.alert("Unable to restore this revision.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      onClick={restore}
      disabled={busy}
      className="studio-button"
    >
      {busy ? "Restoring" : "Restore"}
    </button>
  );
}
