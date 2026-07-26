/**
 * 将 PDF 解析结果写入用户 Profile（Agent 预填 / 网页解析共用）
 */
import type { Profile, RoleFamily } from "../types.js";
import {
  defaultProfile,
  normalizeProfile,
  saveProfileFromInput,
} from "../profile/setup.js";
import { loadProfile } from "../store/fs-store.js";
import type { ResumeParseResult } from "./parse.js";

const ROLES: RoleFamily[] = [
  "BD",
  "Community",
  "Research",
  "Security",
  "Product",
  "Engineering",
  "Other",
];

export function profilePatchFromParsed(
  parsed: ResumeParseResult,
  existing?: Profile | null
): Partial<Profile> {
  const base = existing || loadProfile() || defaultProfile();
  const skills = [
    ...new Set([...(parsed.skills || []), ...(base.skills || [])]),
  ].slice(0, 30);
  const keywords = parsed.keywords || [];
  const role =
    parsed.suggested_role && ROLES.includes(parsed.suggested_role)
      ? parsed.suggested_role
      : base.primary_role;

  return {
    resume_text: parsed.resume_text || base.resume_text,
    summary: parsed.summary || base.summary,
    skills,
    highlights:
      parsed.highlights?.length > 0 ? parsed.highlights : base.highlights,
    target_titles:
      parsed.suggested_titles?.length > 0
        ? parsed.suggested_titles
        : base.target_titles,
    primary_role: role,
    role_extensions: {
      ...(base.role_extensions || {}),
      job_keywords: keywords,
      experiences_json: JSON.stringify(parsed.experiences || []),
      resume_parse_method: parsed.method,
      resume_extract_engine: parsed.extract_engine || "",
    },
  };
}

/** 在当前 dataDir（用户上下文）下保存预填画像 */
export function saveParsedResumeToProfile(parsed: ResumeParseResult): {
  profile: Profile;
  warnings: string[];
} {
  const patch = profilePatchFromParsed(parsed);
  // setup_completed 先 false，用户进网页还可改
  return saveProfileFromInput({
    ...patch,
    setup_completed: false,
  });
}

export function formatParseSummaryForAgent(parsed: ResumeParseResult): string {
  const lines = [
    `【简历初步识别】引擎=${parsed.extract_engine} · 结构化=${parsed.method}`,
    parsed.pages != null ? `页数≈${parsed.pages}` : "",
    `简介：${parsed.summary || "—"}`,
    `技能：${(parsed.skills || []).join(", ") || "—"}`,
    `关键词：${(parsed.keywords || []).join(", ") || "—"}`,
    `建议岗位：${(parsed.suggested_titles || []).join(", ") || "—"}`,
    `建议角色线：${parsed.suggested_role || "—"}`,
    "经历：",
    ...(parsed.experiences || []).slice(0, 5).map(
      (e, i) =>
        `  ${i + 1}. ${e.title || "?"} @ ${e.company || "?"} ${e.period || ""}`
    ),
    "亮点：",
    ...(parsed.highlights || []).map((h) => `  - ${h}`),
  ].filter(Boolean);
  return lines.join("\n");
}
