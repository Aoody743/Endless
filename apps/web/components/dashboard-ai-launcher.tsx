"use client";

import { Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function DashboardAiLauncher({
  placeholder,
  ariaLabel
}: {
  placeholder: string;
  ariaLabel: string;
}) {
  const router = useRouter();
  const [prompt, setPrompt] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextPrompt = prompt.trim();
    setBusy(true);
    try {
      const response = await fetch("/api/studio/content", {
        method: "POST",
        headers: {
          "content-type": "application/json"
        },
        body: JSON.stringify({ type: "POST" })
      });

      if (!response.ok) {
        throw new Error("Unable to create AI draft.");
      }

      const data = (await response.json()) as { id: string };
      const query = new URLSearchParams({ workspace: "ai" });
      if (nextPrompt) {
        query.set("prompt", nextPrompt);
      }
      router.push(`/studio/editor/${data.id}?${query.toString()}`);
    } catch (error) {
      console.error(error);
      setBusy(false);
    }
  }

  return (
    <form className="studio-v2-ai-input" onSubmit={handleSubmit}>
      <input value={prompt} onChange={(event) => setPrompt(event.target.value)} name="q" placeholder={placeholder} />
      <button type="submit" aria-label={ariaLabel} disabled={busy}>
        <Sparkles aria-hidden className="h-4 w-4" />
      </button>
    </form>
  );
}
