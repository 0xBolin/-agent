import { config, hasLlm } from "../config.js";

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export async function chatJson<T>(
  messages: ChatMessage[],
  opts: { temperature?: number } = {}
): Promise<T> {
  if (!hasLlm()) {
    throw new Error(
      "未配置 OPENAI_API_KEY（或 XAI_API_KEY）。请复制 .env.example 为 .env 并填写。"
    );
  }
  const res = await fetch(`${config.llm.baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.llm.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: config.llm.model,
      temperature: opts.temperature ?? 0.2,
      response_format: { type: "json_object" },
      messages,
    }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`LLM HTTP ${res.status}: ${body.slice(0, 400)}`);
  }
  const data = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error("LLM 返回空内容");
  return JSON.parse(content) as T;
}

export async function chatText(
  messages: ChatMessage[],
  opts: { temperature?: number } = {}
): Promise<string> {
  if (!hasLlm()) {
    throw new Error("未配置 OPENAI_API_KEY（或 XAI_API_KEY）");
  }
  const res = await fetch(`${config.llm.baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.llm.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: config.llm.model,
      temperature: opts.temperature ?? 0.4,
      messages,
    }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`LLM HTTP ${res.status}: ${body.slice(0, 400)}`);
  }
  const data = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  return data.choices?.[0]?.message?.content?.trim() || "";
}
