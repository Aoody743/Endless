"use client";

import { ChevronDown, FilePlus2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export function StudioCreateButton({
  type = "POST",
  label,
  className = "",
  chooseWorkspace = false
}: {
  type?: "POST" | "PAGE" | "DOC" | "PROJECT";
  label?: string;
  className?: string;
  chooseWorkspace?: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [open, setOpen] = useState(false);
  const [locale, setLocale] = useState<"zh" | "en">("zh");

  useEffect(() => {
    if (typeof document === "undefined") return;
    const lang = document.documentElement.lang?.toLowerCase() ?? "";
    setLocale(lang.startsWith("en") ? "en" : "zh");
  }, []);

  const tx = (zh: string, en: string) => (locale === "en" ? en : zh);
  const typeLabel = type === "POST" ? tx("文章", "post") : type === "PAGE" ? tx("页面", "page") : type === "DOC" ? tx("文档", "doc") : tx("项目", "project");

  async function createDraft(workspace?: "md" | "ai") {
    setBusy(true);
    try {
      const response = await fetch("/api/studio/content", {
        method: "POST",
        headers: {
          "content-type": "application/json"
        },
        body: JSON.stringify({ type })
      });

      if (!response.ok) {
        throw new Error(tx("无法创建草稿。", "Unable to create draft."));
      }

      const data = (await response.json()) as { id: string };
      const query = workspace ? `?workspace=${workspace}` : "";
      router.push(`/studio/editor/${data.id}${query}`);
    } catch (error) {
      console.error(error);
      window.alert(tx("当前无法创建草稿，请稍后重试。", "Unable to create draft right now."));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="relative inline-flex">
      <button
        type="button"
        onClick={() => (chooseWorkspace ? setOpen((current) => !current) : createDraft())}
        disabled={busy}
        className={`studio-button ${className}`}
      >
        <FilePlus2 aria-hidden className="h-4 w-4" />
        {busy ? tx("创建中", "Creating") : label ?? tx(`新建${typeLabel}`, `New ${typeLabel}`)}
        {chooseWorkspace ? <ChevronDown aria-hidden className="h-4 w-4" /> : null}
      </button>

      {open ? (
        <div className="studio-create-menu">
          <button
            type="button"
            onClick={async () => {
              setOpen(false);
              await createDraft("ai");
            }}
            className="studio-create-menu-item"
          >
            <span>{tx("新建自然编辑", "New Natural")}</span>
            <span>{tx("纯写作区 + AI 排版", "Pure writing + AI layout")}</span>
          </button>
          <button
            type="button"
            onClick={async () => {
              setOpen(false);
              await createDraft("md");
            }}
            className="studio-create-menu-item"
          >
            <span>{tx("新建 Markdown", "New Markdown")}</span>
            <span>{tx("编辑器 + 实时预览", "Editor + live preview")}</span>
          </button>
        </div>
      ) : null}
    </div>
  );
}
