/**
 * Phase 2：Proof 资产 — 从简历/亮点生成可展示证据 + 复制短文案
 */
import type { Profile } from "../types.js";

/** 若用户未手填 proof，从 highlights / resume 启发式抽出 */
export function deriveProofItems(profile: Profile | null | undefined): string[] {
  if (!profile) return [];
  if (profile.proof_items?.length) {
    return profile.proof_items.map(String).filter(Boolean).slice(0, 5);
  }
  const fromHi = (profile.highlights || [])
    .map((h) => h.trim())
    .filter((h) => h.length > 12 && h.length < 200)
    .slice(0, 5);
  if (fromHi.length) return fromHi;

  const lines = (profile.resume_text || "")
    .split(/\n/)
    .map((l) => l.replace(/^[-·•*]\s*/, "").trim())
    .filter(
      (l) =>
        l.length > 24 &&
        l.length < 180 &&
        /\d|%|\$|x\b|用户|增长|boost|scaled|led|built/i.test(l)
    );
  return lines.slice(0, 5);
}

export function formatProofCard(
  profile: Profile,
  lang: "zh" | "en" = "zh"
): {
  items: string[];
  social: { x?: string; linkedin?: string; github?: string };
  copy_text: string;
} {
  const items = deriveProofItems(profile);
  const social = {
    x: profile.social?.x || undefined,
    linkedin: profile.social?.linkedin || undefined,
    github: profile.social?.github || undefined,
  };
  const name = profile.display_name || (lang === "en" ? "Me" : "我");
  const role = profile.primary_role || "";
  const socialLine = [social.x, social.linkedin, social.github]
    .filter(Boolean)
    .join(" · ");

  let copy_text: string;
  if (lang === "en") {
    copy_text = [
      `${name} · ${role}`,
      ...items.map((x, i) => `${i + 1}. ${x}`),
      socialLine ? `Links: ${socialLine}` : "",
    ]
      .filter(Boolean)
      .join("\n");
  } else {
    copy_text = [
      `${name} · ${role}`,
      ...items.map((x, i) => `${i + 1}. ${x}`),
      socialLine ? `链接：${socialLine}` : "",
    ]
      .filter(Boolean)
      .join("\n");
  }

  return { items, social, copy_text };
}

export function normalizeSocialInput(raw: {
  x?: string;
  linkedin?: string;
  github?: string;
}): { x?: string; linkedin?: string; github?: string } {
  const norm = (v?: string, kind?: "x" | "linkedin" | "github") => {
    let s = String(v || "").trim();
    if (!s) return undefined;
    if (kind === "x") {
      s = s.replace(/^@/, "");
      if (/^https?:\/\//i.test(s)) return s;
      if (/^(x|twitter)\.com\//i.test(s)) return `https://${s}`;
      return `https://x.com/${s}`;
    }
    if (kind === "linkedin") {
      if (/^https?:\/\//i.test(s)) return s;
      if (/linkedin\.com\//i.test(s)) return `https://${s}`;
      return `https://www.linkedin.com/in/${s.replace(/^\/+/, "")}`;
    }
    if (kind === "github") {
      if (/^https?:\/\//i.test(s)) return s;
      if (/github\.com\//i.test(s)) return `https://${s}`;
      return `https://github.com/${s.replace(/^@/, "")}`;
    }
    return s;
  };
  return {
    x: norm(raw.x, "x"),
    linkedin: norm(raw.linkedin, "linkedin"),
    github: norm(raw.github, "github"),
  };
}
