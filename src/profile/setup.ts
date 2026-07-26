import fs from "node:fs";
import readline from "node:readline";
import type {
  AlertFrequency,
  Profile,
  RoleFamily,
  SeniorityLevel,
} from "../types.js";
import { saveProfile, loadProfile } from "../store/fs-store.js";
import { files, ensureDataDirs } from "../paths.js";
import { hasLlm } from "../config.js";
import { chatJson } from "../llm/client.js";

export const ROLES: RoleFamily[] = [
  "BD",
  "Community",
  "Research",
  "Security",
  "Product",
  "Engineering",
  "Other",
];

export const LEVELS: SeniorityLevel[] = [
  "junior",
  "mid",
  "senior",
  "lead",
  "executive",
  "",
];

export const COMPANY_TYPE_OPTIONS = [
  "Exchange",
  "Wallet",
  "L1/L2 Protocol",
  "DeFi Protocol",
  "Infrastructure",
  "Security Firm",
  "Research/Fund",
  "Startup (early)",
  "Growth-stage",
  "DAO",
  "Agency/Studio",
];

export const SECTOR_OPTIONS = [
  "DeFi",
  "Wallet",
  "Exchange",
  "Infrastructure",
  "ZK/Privacy",
  "NFT/Gaming",
  "RWA",
  "AI+Crypto",
  "Payments",
  "Social",
  "Security",
  "Data",
];

/** 规范化旧 profile → 新 schema */
export function normalizeProfile(raw: Partial<Profile> | null | undefined): Profile {
  const d = defaultProfile();
  if (!raw || typeof raw !== "object") return d;
  return {
    ...d,
    ...raw,
    target_titles: arr(raw.target_titles),
    secondary_roles: arr(raw.secondary_roles) as RoleFamily[],
    languages: arr(raw.languages).length ? arr(raw.languages) : d.languages,
    highlights: arr(raw.highlights),
    skills: arr(raw.skills),
    sectors_whitelist: arr(raw.sectors_whitelist),
    sectors_blacklist: arr(raw.sectors_blacklist),
    deal_breakers: arr(raw.deal_breakers),
    company_types: arr(raw.company_types),
    event_cities: arr(raw.event_cities),
    resume_text: String(raw.resume_text || ""),
    timezone: String(raw.timezone || d.timezone),
    level: (raw.level as SeniorityLevel) || d.level,
    discrete_mode: Boolean(raw.discrete_mode),
    alert_frequency: (raw.alert_frequency as AlertFrequency) || d.alert_frequency,
    location_pref: {
      cities: arr(raw.location_pref?.cities),
      remote_ok: raw.location_pref?.remote_ok ?? true,
      hybrid_ok: raw.location_pref?.hybrid_ok ?? true,
      onsite_ok: raw.location_pref?.onsite_ok ?? false,
    },
    comp_pref: {
      min_base_fiat: raw.comp_pref?.min_base_fiat,
      currency: raw.comp_pref?.currency || "USD",
      token_ok: raw.comp_pref?.token_ok ?? true,
      token_only_ok: raw.comp_pref?.token_only_ok ?? false,
      equity_ok: raw.comp_pref?.equity_ok ?? true,
    },
    role_extensions: raw.role_extensions || {},
    primary_role: (raw.primary_role as RoleFamily) || d.primary_role,
    experience_years: Number(raw.experience_years || 0),
    display_name: String(raw.display_name || ""),
    summary: String(raw.summary || ""),
    writing_style: raw.writing_style,
    updated_at: raw.updated_at || new Date().toISOString(),
    setup_completed: Boolean(raw.setup_completed),
  };
}

function arr(v: unknown): string[] {
  if (Array.isArray(v)) return v.map(String).filter(Boolean);
  if (typeof v === "string" && v.trim()) {
    return v
      .split(/[,，|]/)
      .map((s) => s.trim())
      .filter(Boolean);
  }
  return [];
}

export function defaultProfile(): Profile {
  return {
    display_name: "",
    target_titles: [],
    primary_role: "Product",
    secondary_roles: [],
    resume_text: "",
    experience_years: 0,
    level: "mid",
    languages: ["中文", "English"],
    summary: "",
    highlights: [],
    skills: [],
    location_pref: {
      cities: [],
      remote_ok: true,
      hybrid_ok: true,
      onsite_ok: false,
    },
    comp_pref: {
      token_ok: true,
      token_only_ok: false,
      equity_ok: true,
      currency: "USD",
    },
    sectors_whitelist: [],
    sectors_blacklist: [],
    deal_breakers: [],
    company_types: [],
    timezone: "UTC+8",
    discrete_mode: false,
    alert_frequency: "weekly",
    event_cities: [],
    role_extensions: {},
    updated_at: new Date().toISOString(),
    setup_completed: false,
  };
}

export function validateProfile(p: Profile): string[] {
  const errors: string[] = [];
  if (!p.target_titles.length && !p.primary_role) {
    errors.push("请至少填写目标岗位或选择角色线");
  }
  if (!p.resume_text?.trim() && !p.summary?.trim() && !p.skills.length) {
    errors.push("请提供简历文本，或至少填写简介/技能");
  }
  if (
    !p.location_pref.cities.length &&
    !p.location_pref.remote_ok &&
    !p.location_pref.hybrid_ok &&
    !p.location_pref.onsite_ok
  ) {
    errors.push("请选择城市或至少一种工作方式（Remote/Hybrid/Onsite）");
  }
  return errors;
}

/** 从前端/API 保存 */
export function saveProfileFromInput(input: Partial<Profile>): {
  profile: Profile;
  warnings: string[];
} {
  const profile = normalizeProfile({
    ...loadProfile(),
    ...input,
    updated_at: new Date().toISOString(),
    setup_completed:
      input.setup_completed === false
        ? false
        : input.setup_completed ?? true,
  });
  // 从简历粗抽 summary
  if (!profile.summary && profile.resume_text) {
    profile.summary = profile.resume_text.replace(/\s+/g, " ").slice(0, 280);
  }
  if (!profile.skills.length && profile.resume_text) {
    profile.skills = guessSkills(profile.resume_text);
  }
  const warnings = validateProfile(profile);
  saveProfile(profile);
  return { profile, warnings };
}

function guessSkills(text: string): string[] {
  const dict = [
    "Solidity",
    "Rust",
    "TypeScript",
    "React",
    "BD",
    "Partnerships",
    "Community",
    "Discord",
    "Telegram",
    "Research",
    "Tokenomics",
    "Audit",
    "Security",
    "Product",
    "Growth",
    "Python",
    "Go",
    "ZK",
    "DeFi",
    "English",
  ];
  const lower = text.toLowerCase();
  return dict.filter((s) => lower.includes(s.toLowerCase())).slice(0, 12);
}

export async function ensureExample(): Promise<void> {
  ensureDataDirs();
  if (!fs.existsSync(files.profileExample())) {
    const YAML = (await import("yaml")).default;
    fs.writeFileSync(
      files.profileExample(),
      YAML.stringify(exampleProfile()),
      "utf8"
    );
  }
}

export function exampleProfile(): Profile {
  const p = defaultProfile();
  p.display_name = "Alex Chen";
  p.target_titles = [
    "Business Development Manager",
    "Growth Lead",
    "Partnerships Manager",
  ];
  p.primary_role = "BD";
  p.secondary_roles = ["Community"];
  p.experience_years = 4;
  p.level = "senior";
  p.summary =
    "Web3 BD，深耕东南亚市场，有钱包与交易所渠道合作经验。";
  p.resume_text = `Alex Chen — Web3 BD / Growth
4 years in crypto partnerships across SEA.
Led 3 protocol listings and regional BD pipelines.
Channels: Telegram KOL, exchange BD, wallet integrations.
Languages: Mandarin, English.
Skills: BD, Partnerships, SEA markets, Growth, Community ops.`;
  p.highlights = [
    "主导 3 个协议东南亚 listing / 合作",
    "搭建 KOL 与社区增长漏斗",
    "覆盖新加坡 / 香港渠道网络",
  ];
  p.skills = ["BD", "Partnerships", "SEA", "Telegram", "Growth", "English"];
  p.location_pref = {
    cities: ["Singapore", "Hong Kong"],
    remote_ok: true,
    hybrid_ok: true,
    onsite_ok: false,
  };
  p.comp_pref = {
    min_base_fiat: 4000,
    currency: "USD",
    token_ok: true,
    token_only_ok: false,
    equity_ok: true,
  };
  p.sectors_whitelist = ["DeFi", "Wallet", "Exchange", "Infrastructure"];
  p.sectors_blacklist = ["gambling"];
  p.deal_breakers = ["token only", "pay to apply"];
  p.company_types = ["Exchange", "Wallet", "L1/L2 Protocol", "Growth-stage"];
  p.timezone = "UTC+8";
  p.discrete_mode = true;
  p.alert_frequency = "weekly";
  p.event_cities = ["Singapore", "Hong Kong"];
  p.role_extensions = {
    regions: ["SEA", "HK"],
    channels: ["Telegram", "KOL", "Exchange BD"],
  };
  p.setup_completed = true;
  p.updated_at = new Date().toISOString();
  return p;
}

async function ask(
  rl: readline.Interface,
  q: string,
  def = ""
): Promise<string> {
  const hint = def ? ` [${def}]` : "";
  return new Promise((resolve) => {
    rl.question(`${q}${hint}: `, (ans) => {
      resolve(ans.trim() || def);
    });
  });
}

function splitList(s: string): string[] {
  return s
    .split(/[,，|]/)
    .map((x) => x.trim())
    .filter(Boolean);
}

/** CLI 交互式 setup（完整 1–13） */
export async function interactiveSetup(): Promise<Profile> {
  await ensureExample();
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  const base = normalizeProfile(loadProfile());

  console.log("\n=== 职块 Job Block · Setup（用户输入 1–13）===\n");
  console.log("提示：也可用前端 npm run web\n");

  // ① 目标岗位
  base.display_name = await ask(rl, "① 称呼", base.display_name || "Seeker");
  base.target_titles = splitList(
    await ask(
      rl,
      "① 目标岗位 title（逗号分隔）",
      base.target_titles.join(", ")
    )
  );
  const role = await ask(rl, "① 主角色线", base.primary_role);
  base.primary_role = (ROLES.includes(role as RoleFamily)
    ? role
    : base.primary_role) as RoleFamily;
  base.secondary_roles = splitList(
    await ask(rl, "① 次角色", base.secondary_roles.join(","))
  ).filter((s) => ROLES.includes(s as RoleFamily)) as RoleFamily[];

  // ② 简历
  const resumeFile = await ask(rl, "② 简历文件路径（.txt/.md，回车则粘贴）", "");
  if (resumeFile && fs.existsSync(resumeFile)) {
    base.resume_text = fs.readFileSync(resumeFile, "utf8");
  } else {
    base.resume_text = await ask(
      rl,
      "② 粘贴简历文本（可较短）",
      base.resume_text.slice(0, 200)
    );
  }

  // ③ 地区
  base.location_pref.cities = splitList(
    await ask(rl, "③ 求职城市", base.location_pref.cities.join(", "))
  );
  base.location_pref.remote_ok =
    (await ask(rl, "③ 接受 Remote? y/n", base.location_pref.remote_ok ? "y" : "n")).toLowerCase() !==
    "n";
  base.location_pref.hybrid_ok =
    (await ask(rl, "③ 接受 Hybrid? y/n", base.location_pref.hybrid_ok ? "y" : "n")).toLowerCase() !==
    "n";
  base.location_pref.onsite_ok =
    (await ask(rl, "③ 接受 Onsite? y/n", base.location_pref.onsite_ok ? "y" : "n")).toLowerCase() ===
    "y";

  // ④ 赛道
  base.sectors_whitelist = splitList(
    await ask(rl, "④ 感兴趣赛道", base.sectors_whitelist.join(", "))
  );
  base.sectors_blacklist = splitList(
    await ask(rl, "④ 黑名单赛道", base.sectors_blacklist.join(", "))
  );

  // ⑤ 薪资
  const minPay = await ask(
    rl,
    "⑤ 最低月薪法币（数字，可空）",
    String(base.comp_pref.min_base_fiat || "")
  );
  if (minPay) base.comp_pref.min_base_fiat = Number(minPay);
  base.comp_pref.currency = await ask(rl, "⑤ 币种", base.comp_pref.currency || "USD");
  base.comp_pref.token_ok =
    (await ask(rl, "⑤ 接受 token 部分? y/n", base.comp_pref.token_ok ? "y" : "n")).toLowerCase() !==
    "n";
  base.comp_pref.token_only_ok =
    (await ask(rl, "⑤ 接受纯 token? y/n", base.comp_pref.token_only_ok ? "y" : "n")).toLowerCase() ===
    "y";
  base.comp_pref.equity_ok =
    (await ask(rl, "⑤ 接受 equity? y/n", base.comp_pref.equity_ok ? "y" : "n")).toLowerCase() !==
    "n";

  // ⑥ deal-breakers
  base.deal_breakers = splitList(
    await ask(rl, "⑥ 绝对不要（deal-breakers）", base.deal_breakers.join(", "))
  );

  // ⑦ 语言
  base.languages = splitList(
    await ask(rl, "⑦ 工作语言", base.languages.join(", "))
  );

  // ⑧ 年限级别
  base.experience_years = Number(
    await ask(rl, "⑧ 年限", String(base.experience_years || 3))
  );
  const lvl = await ask(
    rl,
    "⑧ 级别 junior/mid/senior/lead/executive",
    base.level || "mid"
  );
  base.level = (LEVELS.includes(lvl as SeniorityLevel) ? lvl : "mid") as SeniorityLevel;

  // ⑨ 亮点
  base.highlights = (await ask(rl, "⑨ 亮点（| 分隔）", base.highlights.join(" | ")))
    .split("|")
    .map((s) => s.trim())
    .filter(Boolean);

  // ⑩ 公司类型
  base.company_types = splitList(
    await ask(rl, "⑩ 目标公司类型", base.company_types.join(", "))
  );

  // ⑪ 时区
  base.timezone = await ask(rl, "⑪ 时区", base.timezone || "UTC+8");

  // ⑫ 保密
  base.discrete_mode =
    (await ask(rl, "⑫ 在职保密观望? y/n", base.discrete_mode ? "y" : "n")).toLowerCase() ===
    "y";
  base.alert_frequency = (await ask(
    rl,
    "⑫ Alert 频率 daily/weekly/high_only/off",
    base.alert_frequency
  )) as AlertFrequency;

  // ⑬ 活动城市
  base.event_cities = splitList(
    await ask(
      rl,
      "⑬ Networking 活动城市",
      base.event_cities.join(", ") || base.location_pref.cities.join(", ")
    )
  );

  base.skills = splitList(
    await ask(rl, "技能关键词（可空，可从简历推断）", base.skills.join(", "))
  );
  base.summary = await ask(rl, "一句话简介（可空）", base.summary);

  rl.close();

  if (base.resume_text && hasLlm()) {
    try {
      const enriched = await enrichFromResume(base, base.resume_text);
      Object.assign(base, enriched, {
        resume_text: base.resume_text,
        target_titles: base.target_titles,
      });
      console.log("  ✓ LLM 已增强画像");
    } catch (e) {
      console.warn("  增强失败:", (e as Error).message);
    }
  }

  base.updated_at = new Date().toISOString();
  base.setup_completed = true;
  const profile = normalizeProfile(base);
  saveProfile(profile);
  console.log(`\n✓ 画像已保存: ${files.profile()}\n`);
  return profile;
}

async function enrichFromResume(
  base: Profile,
  resume: string
): Promise<Partial<Profile>> {
  return chatJson<Partial<Profile>>([
    {
      role: "system",
      content: `从简历提取 Web3 求职画像。输出 JSON 可选字段:
summary, highlights, skills, experience_years, level, languages,
sectors_whitelist, target_titles, company_types。不要编造。`,
    },
    {
      role: "user",
      content: JSON.stringify({
        existing: {
          primary_role: base.primary_role,
          target_titles: base.target_titles,
        },
        resume: resume.slice(0, 10000),
      }),
    },
  ]);
}

export async function bootstrapProfile(force = false): Promise<Profile> {
  await ensureExample();
  if (!force && loadProfile()) return normalizeProfile(loadProfile());
  const p = exampleProfile();
  saveProfile(p);
  return p;
}

/** 读取并规范化（兼容旧 profile.yml） */
export function getProfile(): Profile | null {
  const raw = loadProfile();
  if (!raw) return null;
  return normalizeProfile(raw);
}
