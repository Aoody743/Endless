"use client";

import { Sparkles } from "lucide-react";
import { useState } from "react";
import { useStudioLocale } from "./studio-locale";

export function DashboardAiPanel({
  configured,
  message
}: {
  configured: boolean;
  message?: string;
}) {
  const { locale, t } = useStudioLocale();
  const [prompt, setPrompt] = useState("");
  const [result, setResult] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const promptSuggestions = [
    t("给我 3 个今天适合写的题目", "Give me 3 strong ideas for today"),
    t("把这周的内容排成发布节奏", "Turn this week into a publishing plan"),
    t("帮我想一个更好的标题", "Suggest a better title")
  ];

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextPrompt = prompt.trim();
    if (!nextPrompt || busy || !configured) return;

    setBusy(true);
    setError(null);
    try {
      const response = await fetch("/api/studio/ai/chat", {
        method: "POST",
        headers: {
          "content-type": "application/json"
        },
        body: JSON.stringify({
          prompt: nextPrompt,
          locale: locale === "en" ? "en-US" : "zh-CN"
        })
      });
      const raw = await response.text();
      const data = (raw ? JSON.parse(raw) : {}) as {
        availability?: { configured?: boolean; message?: string };
        result?: { text?: string };
        error?: string;
      };

      if (!response.ok) {
        throw new Error(data.error || t("AI 请求失败。", "AI request failed."));
      }

      if (!data.availability?.configured) {
        throw new Error(data.availability?.message || t("AI 当前不可用。", "AI is unavailable."));
      }

      if (!data.result?.text) {
        throw new Error(t("AI 没有返回内容。", "AI did not return a response."));
      }

      setResult(data.result.text);
    } catch (nextError) {
      const messageText = nextError instanceof Error ? nextError.message : t("AI 请求失败。", "AI request failed.");
      if (messageText.includes("<!doctype") || messageText.includes("<html")) {
        setError(t("AI 接口返回了网页错误页，请稍后重试；如果持续出现，需要继续检查服务器日志。", "AI endpoint returned an HTML error page. Please retry; if it continues, inspect server logs."));
      } else {
        setError(messageText);
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <div className="studio-v2-ai-body">
        <p className="studio-v2-soft">
          {t("直接在这里和 AI 讨论选题、结构、标题和表达方向。", "Talk with AI here about topics, structure, titles, and voice.")}
        </p>
        <div className="studio-v2-ai-suggestions">
          {promptSuggestions.map((suggestion) => (
            <button key={suggestion} type="button" onClick={() => setPrompt(suggestion)} className="studio-v2-ai-suggestion">
              {suggestion}
            </button>
          ))}
        </div>
        {!configured ? <p className="mt-2 text-xs text-amber-600 dark:text-amber-300">{message || t("请先在设置里完成 AI 配置。", "Finish AI settings first.")}</p> : null}
        {result ? <div className="studio-v2-ai-result">{result}</div> : null}
        {error ? <p className="text-xs text-rose-600 dark:text-rose-300">{error}</p> : null}
      </div>
      <form className="studio-v2-ai-input" onSubmit={handleSubmit}>
        <input
          name="q"
          value={prompt}
          onChange={(event) => setPrompt(event.target.value)}
          placeholder={t("和 AI 聊聊接下来写什么", "Ask AI what to write next")}
        />
        <button type="submit" aria-label={t("提问 AI", "Ask AI")} disabled={busy || !configured}>
          {busy ? <span className="text-[0.68rem]">{t("生成中", "Working")}</span> : <Sparkles aria-hidden className="h-4 w-4" />}
        </button>
      </form>
    </>
  );
}
