import { config, hasRemoteEmbedding } from "../config.js";
import { tokenize } from "../util/text.js";

/** 简易本地 TF 向量（无 API 时） */
export function localEmbed(text: string): number[] {
  const tokens = tokenize(text);
  const dim = 256;
  const vec = new Array(dim).fill(0);
  for (const t of tokens) {
    let h = 0;
    for (let i = 0; i < t.length; i++) h = (Math.imul(h, 31) + t.charCodeAt(i)) | 0;
    const idx = Math.abs(h) % dim;
    vec[idx] += 1;
    // bigram hash
    if (t.length > 3) {
      const h2 = Math.abs(h * 2654435761) % dim;
      vec[h2] += 0.5;
    }
  }
  return l2normalize(vec);
}

export function cosine(a: number[], b: number[]): number {
  const n = Math.min(a.length, b.length);
  let dot = 0;
  for (let i = 0; i < n; i++) dot += a[i] * b[i];
  return dot;
}

function l2normalize(v: number[]): number[] {
  let s = 0;
  for (const x of v) s += x * x;
  const n = Math.sqrt(s) || 1;
  return v.map((x) => x / n);
}

export async function embedTexts(texts: string[]): Promise<number[][]> {
  if (!hasRemoteEmbedding()) {
    return texts.map(localEmbed);
  }
  try {
    const res = await fetch(`${config.embedding.baseUrl}/embeddings`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.embedding.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: config.embedding.model,
        input: texts.map((t) => t.slice(0, 8000)),
      }),
    });
    if (!res.ok) {
      console.warn(
        `[embed] remote failed HTTP ${res.status}, fallback local TF`
      );
      return texts.map(localEmbed);
    }
    const data = (await res.json()) as {
      data: { embedding: number[]; index: number }[];
    };
    const sorted = [...data.data].sort((a, b) => a.index - b.index);
    return sorted.map((d) => l2normalize(d.embedding));
  } catch (e) {
    console.warn("[embed] remote error, fallback local:", (e as Error).message);
    return texts.map(localEmbed);
  }
}

export function jobEmbedText(job: {
  title: string;
  company: string;
  description_clean: string;
  tags: string[];
  role_family: string;
}): string {
  return [
    job.title,
    job.company,
    job.role_family,
    job.tags.join(" "),
    job.description_clean.slice(0, 2000),
  ].join("\n");
}

export function profileEmbedText(profile: {
  primary_role: string;
  secondary_roles: string[];
  target_titles?: string[];
  summary: string;
  highlights: string[];
  skills: string[];
  sectors_whitelist: string[];
  company_types?: string[];
  resume_text?: string;
  level?: string;
}): string {
  return [
    profile.primary_role,
    profile.secondary_roles.join(" "),
    (profile.target_titles || []).join(" "),
    profile.level || "",
    profile.summary,
    profile.highlights.join(" "),
    profile.skills.join(" "),
    profile.sectors_whitelist.join(" "),
    (profile.company_types || []).join(" "),
    (profile.resume_text || "").slice(0, 1500),
  ].join("\n");
}
