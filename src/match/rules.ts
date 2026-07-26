import type { Job, MatchResult, Profile, RoleFamily } from "../types.js";
import { config } from "../config.js";

/** 角色维度默认权重 */
export const ROLE_WEIGHTS: Record<
  RoleFamily,
  Record<string, number>
> = {
  BD: {
    skills: 0.25,
    domain: 0.15,
    level: 0.1,
    comp: 0.15,
    geo: 0.15,
    network: 0.15,
    risk: 0.05,
  },
  Community: {
    skills: 0.25,
    domain: 0.15,
    level: 0.1,
    comp: 0.1,
    geo: 0.1,
    network: 0.2,
    risk: 0.1,
  },
  Research: {
    skills: 0.3,
    domain: 0.25,
    level: 0.15,
    comp: 0.1,
    geo: 0.05,
    network: 0.05,
    risk: 0.1,
  },
  Security: {
    skills: 0.35,
    domain: 0.2,
    level: 0.15,
    comp: 0.1,
    geo: 0.05,
    network: 0.05,
    risk: 0.1,
  },
  Product: {
    skills: 0.25,
    domain: 0.2,
    level: 0.15,
    comp: 0.1,
    geo: 0.1,
    network: 0.1,
    risk: 0.1,
  },
  Engineering: {
    skills: 0.35,
    domain: 0.2,
    level: 0.15,
    comp: 0.1,
    geo: 0.05,
    network: 0.05,
    risk: 0.1,
  },
  Other: {
    skills: 0.25,
    domain: 0.15,
    level: 0.15,
    comp: 0.15,
    geo: 0.1,
    network: 0.1,
    risk: 0.1,
  },
};

export function hardFilter(
  profile: Profile,
  job: Job
): { pass: boolean; reasons: string[] } {
  const reasons: string[] = [];
  const blob = `${job.title}\n${job.description_clean}\n${job.comp_hint}`.toLowerCase();

  for (const db of profile.deal_breakers || []) {
    if (db && blob.includes(db.toLowerCase())) {
      reasons.push(`deal_breaker:${db}`);
    }
  }
  for (const black of profile.sectors_blacklist || []) {
    if (black && blob.includes(black.toLowerCase())) {
      reasons.push(`sector_blacklist:${black}`);
    }
  }
  if (
    !profile.comp_pref.token_only_ok &&
    /token\s*only|only\s*token|纯token|仅token/i.test(blob) &&
    !/\$|usd|usdt|salary|薪|base/i.test(blob)
  ) {
    reasons.push("token_only_suspected");
  }
  if (
    !profile.location_pref.remote_ok &&
    job.remote_type === "remote" &&
    profile.location_pref.cities.length === 0
  ) {
    // only if user explicitly disallows remote
  }
  if (
    profile.location_pref.remote_ok === false &&
    job.remote_type === "remote"
  ) {
    reasons.push("remote_not_wanted");
  }
  if (
    profile.location_pref.onsite_ok === false &&
    profile.location_pref.remote_ok === false &&
    profile.location_pref.hybrid_ok === false &&
    job.remote_type === "onsite"
  ) {
    reasons.push("onsite_not_wanted");
  }

  if (job.legitimacy_flags?.length) {
    reasons.push(...job.legitimacy_flags.map((f) => `flag:${f}`));
  }

  // soft: hard fail only on clear risks
  const hard = reasons.filter(
    (r) =>
      r.startsWith("deal_breaker") ||
      r.startsWith("sector_blacklist") ||
      r.includes("credential_theft") ||
      r.includes("pay_to_apply")
  );
  return { pass: hard.length === 0, reasons };
}

export function ruleScore(profile: Profile, job: Job): MatchResult {
  const weights = ROLE_WEIGHTS[profile.primary_role] || ROLE_WEIGHTS.Other;
  const text = `${job.title} ${job.description_clean} ${job.tags.join(" ")}`.toLowerCase();
  const skills = profile.skills.map((s) => s.toLowerCase());
  const hits = skills.filter((s) => s && text.includes(s));
  // 目标 title 命中加分
  const titleHits = (profile.target_titles || []).filter((t) => {
    const w = t.toLowerCase();
    return w && (job.title.toLowerCase().includes(w) || text.includes(w));
  });
  const skillScore = skills.length
    ? Math.min(5, 1 + (hits.length / Math.max(skills.length, 1)) * 4)
    : titleHits.length
      ? 3.5
      : 2.5;

  const roleBoost =
    job.role_family === profile.primary_role
      ? 5
      : profile.secondary_roles.includes(job.role_family)
        ? 4
        : job.role_family === "Other"
          ? 2.5
          : 2;
  const titleBoost = titleHits.length ? Math.min(5, 3 + titleHits.length) : roleBoost;

  let domain = 2.5;
  for (const s of profile.sectors_whitelist) {
    if (s && text.includes(s.toLowerCase())) domain = Math.min(5, domain + 1);
  }

  let geo = 3;
  if (profile.location_pref.remote_ok && job.remote_type === "remote") geo = 5;
  else if (
    profile.location_pref.cities.some((c) =>
      (job.location || "").toLowerCase().includes(c.toLowerCase())
    )
  )
    geo = 5;

  let comp = 3;
  if (!profile.comp_pref.token_only_ok && /token only/i.test(text)) comp = 1;

  let risk = job.legitimacy_flags?.length ? 1 : 4;
  const level = 3;
  const network =
    profile.primary_role === "BD" || profile.primary_role === "Community"
      ? roleBoost * 0.8
      : 3;

  const dimensions: Record<string, number> = {
    skills: round1(skillScore),
    domain: round1(domain),
    level,
    comp,
    geo,
    network: round1(network),
    risk,
    role_fit: Math.max(roleBoost, titleBoost),
  };

  let score = 0;
  for (const [k, w] of Object.entries(weights)) {
    const dim = dimensions[k] ?? 3;
    score += (dim / 5) * w * 100;
  }
  // blend role_fit + target title
  score = score * 0.8 + (dimensions.role_fit / 5) * 20;
  score = Math.round(Math.max(0, Math.min(100, score)));

  const strengths: string[] = [];
  const gaps: string[] = [];
  if (titleHits.length)
    strengths.push(`目标岗位命中: ${titleHits.slice(0, 3).join(", ")}`);
  if (hits.length) strengths.push(`技能命中: ${hits.slice(0, 5).join(", ")}`);
  if (job.role_family === profile.primary_role)
    strengths.push(`角色线一致: ${job.role_family}`);
  if (hits.length < Math.ceil(skills.length * 0.3) && skills.length)
    gaps.push("简历技能在 JD 中覆盖偏少");
  if (job.role_family !== profile.primary_role)
    gaps.push(`岗位偏 ${job.role_family}，你主角色是 ${profile.primary_role}`);

  const concerns = [...(job.legitimacy_flags || [])];
  const action =
    score >= config.match.strongScore
      ? "apply"
      : score >= config.match.maybeScore
        ? "maybe"
        : "skip";

  return {
    score,
    action,
    dimensions,
    strengths: strengths.length ? strengths : ["规则粗分：信息有限"],
    gaps: gaps.length ? gaps : ["建议用 LLM 精排补全解释"],
    concerns,
    summary: `规则分 ${score}（${action}）· ${job.title} @ ${job.company}`,
    ranked_at: new Date().toISOString(),
    method: "rules",
  };
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}
