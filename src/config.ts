import "dotenv/config";

export const config = {
  brand: {
    nameZh: "职块",
    nameEn: "Job Block",
    tagline: "Web3 机会上链到你的 shortlist",
  },
  llm: {
    apiKey: process.env.OPENAI_API_KEY || process.env.XAI_API_KEY || "",
    baseUrl: (
      process.env.OPENAI_BASE_URL ||
      process.env.XAI_BASE_URL ||
      "https://api.openai.com/v1"
    ).replace(/\/$/, ""),
    model: process.env.OPENAI_MODEL || process.env.XAI_MODEL || "gpt-4o-mini",
  },
  embedding: {
    apiKey:
      process.env.EMBEDDING_API_KEY ||
      process.env.OPENAI_API_KEY ||
      process.env.XAI_API_KEY ||
      "",
    baseUrl: (
      process.env.EMBEDDING_BASE_URL ||
      process.env.OPENAI_BASE_URL ||
      "https://api.openai.com/v1"
    ).replace(/\/$/, ""),
    model: process.env.EMBEDDING_MODEL || "text-embedding-3-small",
  },
  telegram: {
    botToken: process.env.TELEGRAM_BOT_TOKEN || "",
    chatId: process.env.TELEGRAM_CHAT_ID || "",
  },
  match: {
    topRecall: 50,
    topShow: 15,
    strongScore: 85,
    maybeScore: 70,
  },
  sources: {
    web3Career: "https://web3.career",
    dejobTopics: "https://dejob.ai/api/worker/topics",
    dejobJob: "https://www.dejob.ai/job",
    dejobTg: "https://t.me/DeJob_official",
    luma: "https://luma.com",
  },
};

export function hasLlm(): boolean {
  return Boolean(config.llm.apiKey);
}

export function hasRemoteEmbedding(): boolean {
  return Boolean(config.embedding.apiKey);
}
