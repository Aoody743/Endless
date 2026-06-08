export type AiLocale = "zh-CN" | "en-US";
export type AiAction = "format" | "translate" | "summarize";

export interface AiTextBundle {
  title: string;
  summary: string;
  bodyMarkdown: string;
  seoTitle: string;
  seoDescription: string;
}

export interface AIProviderConfig {
  provider: "openai-compatible";
  baseUrl: string;
  apiKey: string;
  model: string;
}

export interface AiActionRequest {
  action: AiAction;
  sourceLocale: AiLocale;
  targetLocale?: AiLocale;
  instruction?: string;
  source: Partial<AiTextBundle>;
  preserveStyle: true;
}

export interface AiActionResult {
  action: AiAction;
  provider: "openai-compatible";
  model: string;
  sourceLocale: AiLocale;
  targetLocale?: AiLocale;
  previewMarkdown: string;
  previewHtml?: string;
  fields: Partial<AiTextBundle>;
}

export interface AiChatResult {
  provider: "openai-compatible";
  model: string;
  text: string;
}

interface OpenAiChatCompletionResponse {
  choices?: Array<{
    message?: {
      content?: string | Array<{ type?: string; text?: string }>;
    };
  }>;
}

type ParsedPayload = {
  previewMarkdown?: string;
  previewHtml?: string;
  fields?: Partial<AiTextBundle>;
};

export class AIProviderError extends Error {
  constructor(
    message: string,
    public readonly code:
      | "invalid_config"
      | "request_failed"
      | "invalid_response"
      | "missing_response_payload"
  ) {
    super(message);
  }
}

function normalizeBaseUrl(baseUrl: string) {
  return baseUrl.trim().replace(/\/$/, "");
}

function ensureConfig(config: AIProviderConfig) {
  if (config.provider !== "openai-compatible") {
    throw new AIProviderError("Unsupported AI provider.", "invalid_config");
  }

  if (!config.baseUrl.trim()) {
    throw new AIProviderError("AI base URL is required.", "invalid_config");
  }

  if (!config.apiKey.trim()) {
    throw new AIProviderError("AI API key is required.", "invalid_config");
  }

  if (!config.model.trim()) {
    throw new AIProviderError("AI model is required.", "invalid_config");
  }
}

function coerceContent(value: string | Array<{ type?: string; text?: string }> | undefined) {
  if (!value) {
    return "";
  }

  if (typeof value === "string") {
    return value;
  }

  return value
    .map((block) => (typeof block?.text === "string" ? block.text : ""))
    .join("\n");
}

function parseJsonPayload(text: string): ParsedPayload {
  const direct = text.trim();
  if (!direct) {
    throw new AIProviderError("AI response is empty.", "missing_response_payload");
  }

  try {
    return JSON.parse(direct) as ParsedPayload;
  } catch {
    const start = direct.indexOf("{");
    const end = direct.lastIndexOf("}");
    if (start < 0 || end <= start) {
      throw new AIProviderError("AI response is not valid JSON.", "invalid_response");
    }

    try {
      return JSON.parse(direct.slice(start, end + 1)) as ParsedPayload;
    } catch {
      throw new AIProviderError("AI response JSON parsing failed.", "invalid_response");
    }
  }
}

function systemPrompt(action: AiAction) {
  if (action === "translate") {
    return [
      "You are a bilingual editorial assistant.",
      "Translate with style preservation. Keep structure, rhythm, and tone.",
      "Do not add commentary.",
      "Return strict JSON only."
    ].join(" ");
  }

  if (action === "summarize") {
    return [
      "You are an editorial summarizer for CMS publishing.",
      "Create concise summary and SEO fields based on the source text.",
      "Do not rewrite the full article body.",
      "Return strict JSON only."
    ].join(" ");
  }

  return [
    "You are a markdown formatter for long-form publishing.",
    "Preserve author style and meaning.",
    "Improve heading hierarchy, paragraph spacing, list and quote structure.",
    "When useful, include previewHtml using only safe semantic tags and token classes.",
    "Return strict JSON only."
  ].join(" ");
}

function userPrompt(request: AiActionRequest) {
  const schemaGuide = {
    previewMarkdown: "string",
    previewHtml: "optional string for format action; only h1-h4, p, ul, ol, li, blockquote, strong, em, code, pre, hr, br, span, a; class may use prose-size-sm/prose-size-md/prose-size-lg/prose-muted/prose-emphasis",
    fields: {
      title: "string",
      summary: "string",
      bodyMarkdown: "string",
      seoTitle: "string",
      seoDescription: "string"
    }
  };

  return JSON.stringify(
    {
      task: request.action,
      rules: {
        preserveStyle: request.preserveStyle,
        instruction: request.instruction ?? "",
        output: "Return one JSON object and no extra text."
      },
      locales: {
        source: request.sourceLocale,
        target: request.targetLocale ?? null
      },
      source: request.source,
      requiredOutputShape: schemaGuide
    },
    null,
    2
  );
}

export class OpenAICompatibleProvider {
  readonly name = "openai-compatible";

  async runChat(config: AIProviderConfig, input: { prompt: string; locale: AiLocale }): Promise<AiChatResult> {
    ensureConfig(config);

    const endpoint = `${normalizeBaseUrl(config.baseUrl)}/chat/completions`;
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${config.apiKey.trim()}`
      },
      body: JSON.stringify({
        model: config.model.trim(),
        temperature: 0.6,
        messages: [
          {
            role: "system",
            content:
              input.locale === "zh-CN"
                ? "你是 Endless Studio 的写作灵感助手。直接给出可执行的写作建议、结构思路、标题、角度和下一步，不要输出 JSON。"
                : "You are the writing copilot inside Endless Studio. Give direct, actionable ideas, structure, titles, angles, and next steps. Do not output JSON."
          },
          { role: "user", content: input.prompt.trim() }
        ]
      })
    }).catch((error) => {
      throw new AIProviderError(error instanceof Error ? error.message : "AI request failed.", "request_failed");
    });

    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      throw new AIProviderError(
        `AI request failed with ${response.status}${detail ? `: ${detail.slice(0, 240)}` : ""}`,
        "request_failed"
      );
    }

    const json = (await response.json()) as OpenAiChatCompletionResponse;
    const text = coerceContent(json.choices?.[0]?.message?.content).trim();
    if (!text) {
      throw new AIProviderError("AI response is empty.", "missing_response_payload");
    }

    return {
      provider: "openai-compatible",
      model: config.model.trim(),
      text
    };
  }

  async runAction(config: AIProviderConfig, request: AiActionRequest): Promise<AiActionResult> {
    ensureConfig(config);

    const endpoint = `${normalizeBaseUrl(config.baseUrl)}/chat/completions`;
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${config.apiKey.trim()}`
      },
      body: JSON.stringify({
        model: config.model.trim(),
        temperature: request.action === "translate" ? 0.2 : 0.35,
        messages: [
          { role: "system", content: systemPrompt(request.action) },
          { role: "user", content: userPrompt(request) }
        ]
      })
    }).catch((error) => {
      throw new AIProviderError(error instanceof Error ? error.message : "AI request failed.", "request_failed");
    });

    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      throw new AIProviderError(
        `AI request failed with ${response.status}${detail ? `: ${detail.slice(0, 240)}` : ""}`,
        "request_failed"
      );
    }

    const json = (await response.json()) as OpenAiChatCompletionResponse;
    const raw = coerceContent(json.choices?.[0]?.message?.content);
    const payload = parseJsonPayload(raw);

    const fields = (payload.fields ?? {}) as Partial<AiTextBundle>;
    const previewMarkdown = payload.previewMarkdown?.trim() || fields.bodyMarkdown?.trim() || "";
    const previewHtml = payload.previewHtml?.trim() || undefined;

    if (!previewMarkdown && !previewHtml && Object.values(fields).every((value) => !value || !String(value).trim())) {
      throw new AIProviderError("AI response does not contain usable fields.", "missing_response_payload");
    }

    return {
      action: request.action,
      provider: "openai-compatible",
      model: config.model.trim(),
      sourceLocale: request.sourceLocale,
      targetLocale: request.targetLocale,
      previewMarkdown,
      previewHtml,
      fields
    };
  }
}
