import { config } from "../config.js";
import type { Job } from "../types.js";

export async function sendTelegram(text: string): Promise<boolean> {
  const { botToken, chatId } = config.telegram;
  if (!botToken || !chatId) {
    console.warn(
      "未配置 TELEGRAM_BOT_TOKEN / TELEGRAM_CHAT_ID，跳过推送（打印预览）：\n"
    );
    console.log(text);
    return false;
  }
  const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text: text.slice(0, 4000),
      disable_web_page_preview: true,
    }),
  });
  if (!res.ok) {
    console.warn("Telegram 推送失败:", await res.text());
    return false;
  }
  return true;
}

export function formatAlert(jobs: Job[]): string {
  const lines = [
    "🧱 职块 Job Block · Shortlist",
    `共 ${jobs.length} 条高相关机会：`,
    "",
  ];
  for (const j of jobs.slice(0, 10)) {
    lines.push(
      `• [${j.match?.score ?? "?"}] ${j.title} @ ${j.company}`,
      `  ${j.match?.action || ""} · ${j.source_url}`,
      ""
    );
  }
  lines.push("人决策是否申请；Agent 不会自动投递。");
  return lines.join("\n");
}
