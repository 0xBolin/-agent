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

function parseCitiesFromLocation(loc?: string): string[] {
  if (!loc) return [];
  // "Kowloon Tong, Hong Kong" → prefer known city tokens
  const known = [
    "Hong Kong",
    "Singapore",
    "Shanghai",
    "Beijing",
    "Shenzhen",
    "Guangzhou",
    "Dubai",
    "London",
    "Tokyo",
    "Seoul",
    "Bangkok",
    "Remote",
    "香港",
    "新加坡",
  ];
  for (const c of known) {
    if (new RegExp(c, "i").test(loc)) return [c];
  }
  // fallback: take last comma segment or whole
  const parts = loc
    .split(/[,，/|]/)
    .map((s) => s.trim())
    .filter(Boolean);
  if (!parts.length) return [];
  return [parts[parts.length - 1]].filter((p) => p.length < 40);
}

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

  const citiesFromResume = parseCitiesFromLocation(parsed.location);
  const cities =
    citiesFromResume.length > 0
      ? citiesFromResume
      : base.location_pref?.cities || [];

  const displayName =
    (parsed.name && parsed.name.trim()) || base.display_name || "";

  const summary =
    parsed.summary && !/@|\+\d{8,}/.test(parsed.summary)
      ? parsed.summary
      : base.summary || parsed.summary || "";

  return {
    display_name: displayName,
    resume_text: parsed.resume_text || base.resume_text,
    summary,
    skills,
    highlights:
      parsed.highlights?.length > 0 ? parsed.highlights : base.highlights,
    target_titles:
      parsed.suggested_titles?.length > 0
        ? parsed.suggested_titles
        : base.target_titles,
    primary_role: role,
    location_pref: {
      cities,
      remote_ok: base.location_pref?.remote_ok !== false,
      hybrid_ok: base.location_pref?.hybrid_ok !== false,
      onsite_ok: !!base.location_pref?.onsite_ok,
    },
    // 活动城市默认跟求职城市，用户可改
    event_cities:
      base.event_cities?.length > 0
        ? base.event_cities
        : cities.length
          ? [...cities]
          : [],
    role_extensions: {
      ...(base.role_extensions || {}),
      job_keywords: keywords,
      experiences_json: JSON.stringify(parsed.experiences || []),
      education_json: JSON.stringify(parsed.education || []),
      resume_name: parsed.name || "",
      resume_location: parsed.location || "",
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
  // 始终以 default 为底 + 解析覆盖，避免旧示例画像污染
  // 但保留用户已手工填写且解析没有的字段（通过 load 再合并策略：解析优先）
  const existing = loadProfile();
  const patch = profilePatchFromParsed(parsed, existing);
  // 若 existing 像示例画像（Alex Chen），忽略它
  const isDemo =
    existing &&
    (existing.display_name === "Alex Chen" ||
      (existing.resume_text || "").includes("Alex Chen — Web3 BD"));
  const finalPatch = isDemo
    ? profilePatchFromParsed(parsed, defaultProfile())
    : patch;

  return saveProfileFromInput({
    ...finalPatch,
    setup_completed: false,
  });
}

export function formatParseSummaryForAgent(parsed: ResumeParseResult): string {
  const lines = [
    `【简历初步识别】引擎=${parsed.extract_engine} · 结构化=${parsed.method}`,
    parsed.pages != null ? `页数≈${parsed.pages}` : "",
    `姓名：${parsed.name || "—"}`,
    `地区：${parsed.location || "—"}`,
    `简介：${parsed.summary || "—"}`,
    `技能：${(parsed.skills || []).join(", ") || "—"}`,
    `关键词：${(parsed.keywords || []).join(", ") || "—"}`,
    `建议岗位：${(parsed.suggested_titles || []).join(", ") || "—"}`,
    `建议角色线：${parsed.suggested_role || "—"}`,
    "教育：",
    ...((parsed.education || []).length
      ? (parsed.education || []).slice(0, 4).map(
          (e, i) =>
            `  ${i + 1}. ${e.school || "?"} · ${e.degree || "—"} ${e.period || ""}`
        )
      : ["  —"]),
    "工作经历：",
    ...((parsed.experiences || []).length
      ? (parsed.experiences || []).slice(0, 6).map(
          (e, i) =>
            `  ${i + 1}. ${e.title || "?"} @ ${e.company || "?"} ${e.period || ""}`
        )
      : ["  —"]),
    "亮点：",
    ...((parsed.highlights || []).length
      ? (parsed.highlights || []).map((h) => `  - ${h}`)
      : ["  —"]),
  ].filter(Boolean);
  return lines.join("\n");
}

/** 从 profile.role_extensions 读回结构化摘要（供 API/前端） */
export function structuredResumeFromProfile(profile: Profile | null | undefined): {
  name: string;
  location: string;
  skills: string[];
  keywords: string[];
  experiences: { title?: string; company?: string; period?: string; bullets?: string[] }[];
  education: { school?: string; degree?: string; period?: string; details?: string }[];
  highlights: string[];
  summary: string;
} {
  const re = profile?.role_extensions || {};
  const parseJson = <T,>(v: unknown, fb: T): T => {
    if (typeof v !== "string" || !v) return fb;
    try {
      return JSON.parse(v) as T;
    } catch {
      return fb;
    }
  };
  return {
    name: String(re.resume_name || profile?.display_name || ""),
    location: String(
      re.resume_location ||
        (profile?.location_pref?.cities || []).join(", ") ||
        ""
    ),
    skills: profile?.skills || [],
    keywords: Array.isArray(re.job_keywords)
      ? (re.job_keywords as string[])
      : [],
    experiences: parseJson(re.experiences_json, []),
    education: parseJson(re.education_json, []),
    highlights: profile?.highlights || [],
    summary: profile?.summary || "",
  };
}
