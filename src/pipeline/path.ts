/**
 * 完整求职路径：岗位 → 提升 → 活动 → 联系谁（含 X / LinkedIn 跳转）→ 投递
 */
import type { EventItem, Job, Profile } from "../types.js";
import fs from "node:fs";
import { ensureDataDirs, files } from "../paths.js";

export interface PathContact {
  company: string;
  job_title: string;
  who: string;
  /** 角色检索用关键词（英文优先，便于 LinkedIn/X 搜索） */
  who_search: string;
  channels: string[];
  why: string;
  dm_draft: string;
  job_url?: string;
  /** 一键跳转搜索 / 主页 */
  linkedin_url: string;
  linkedin_company_url: string;
  x_url: string;
  x_company_url?: string;
}

export interface PathAction {
  order: number;
  title: string;
  detail: string;
  kind: "job" | "upskill" | "event" | "network" | "apply";
}

export interface CareerPath {
  generated_at: string;
  headline: string;
  summary: string;
  actions: PathAction[];
  improve: string[];
  contacts: PathContact[];
  apply_targets: {
    label: string;
    url: string;
    company: string;
    score?: number;
    note: string;
  }[];
  events: EventItem[];
  shortlist: Job[];
}

export function buildCareerPath(
  profile: Profile,
  shortlist: Job[],
  events: EventItem[]
): CareerPath {
  const name = profile.display_name || "你";
  const role = profile.primary_role;
  const titles = (profile.target_titles || []).slice(0, 3).join(" / ") || role;
  const topJobs = shortlist.slice(0, 8);
  const topEvents = events
    .filter((e) => (e.relevance_score || 0) >= 40)
    .slice(0, 6);

  const gapMap = new Map<string, number>();
  for (const j of topJobs) {
    for (const g of j.match?.gaps || []) {
      gapMap.set(g, (gapMap.get(g) || 0) + 1);
    }
  }
  const improve = [...gapMap.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([g]) => g);
  if (!improve.length) {
    improve.push(
      `对照目标岗「${titles}」补 1–2 个可量化成果到简历`,
      "准备 3 个 STAR 故事（合作 / 增长 / 危机处理）"
    );
  }

  const contacts: PathContact[] = topJobs.slice(0, 6).map((j) => {
    const who = contactRoleFor(j, profile);
    const who_search = contactSearchQuery(j, profile);
    const companyClean = cleanCompany(j.company);
    const links = buildContactLinks(companyClean, who_search, j);
    return {
      company: j.company,
      job_title: j.title,
      who,
      who_search,
      channels: ["LinkedIn 搜索", "X 搜索", ...contactChannels(j, profile)],
      why: `该岗位匹配分 ${j.match?.score ?? "—"}，通过 ${who} 比海投更易进面试池`,
      dm_draft: draftDm(profile, j, who),
      job_url: j.source_url,
      linkedin_url: links.linkedin_people,
      linkedin_company_url: links.linkedin_company,
      x_url: links.x_people,
      x_company_url: links.x_company,
    };
  });

  const apply_targets = topJobs.map((j) => ({
    label: `${j.title} @ ${j.company}`,
    url: j.source_url,
    company: j.company,
    score: j.match?.score,
    note:
      j.source === "x"
        ? "来自 X 招聘帖：可直接回复 / 私信发帖账号"
        : j.source === "dejob.ai"
          ? "DeJob 岗位页投递"
          : "官网/Board 申请链接",
  }));

  const actions: PathAction[] = [
    {
      order: 1,
      title: "锁定本周 3 个目标岗",
      detail: topJobs.length
        ? `优先：${topJobs
            .slice(0, 3)
            .map((j) => `${j.title}@${j.company}`)
            .join("；")}`
        : "等待匹配结果生成后刷新",
      kind: "job",
    },
    {
      order: 2,
      title: "补齐简历缺口",
      detail: improve.slice(0, 3).join("；"),
      kind: "upskill",
    },
    {
      order: 3,
      title: "参加推荐线下活动",
      detail: topEvents.length
        ? `强烈建议：${topEvents
            .slice(0, 2)
            .map((e) => e.title)
            .join("；")}（已按你的画像自动筛选）`
        : "暂无高相关活动，将随城市与赛道持续更新",
      kind: "event",
    },
    {
      order: 4,
      title: "在 X / LinkedIn 联系关键人",
      detail: contacts.length
        ? `本周触达：${contacts
            .slice(0, 3)
            .map((c) => `${c.company} · ${c.who}`)
            .join("；")}（路径里可一点跳转搜索）`
        : "匹配岗位后自动生成联系策略",
      kind: "network",
    },
    {
      order: 5,
      title: "按链接正式投递",
      detail: "使用下方「投递入口」逐条申请；投递后在 Profile 记录状态",
      kind: "apply",
    },
  ];

  return {
    generated_at: new Date().toISOString(),
    headline: `${name} 的 Web3 求职路径 · ${titles}`,
    summary: `职块已从线上岗位与线下活动中拼出可执行路径：投高匹配岗、补短板、去对的活动，并在 X / LinkedIn 上定位该联系的人（一键打开搜索结果）。`,
    actions,
    improve,
    contacts,
    apply_targets,
    events: topEvents,
    shortlist: topJobs,
  };
}

function cleanCompany(company: string): string {
  return company
    .replace(/^@/, "")
    .replace(/\s+/g, " ")
    .replace(/\s*(Inc\.?|Ltd\.?|LLC|Limited|协议|公司)\s*$/i, "")
    .trim();
}

/** 生成 LinkedIn / X 可点击搜索链接 */
export function buildContactLinks(
  company: string,
  whoSearch: string,
  job: Job
): {
  linkedin_people: string;
  linkedin_company: string;
  x_people: string;
  x_company?: string;
} {
  const peopleQ = `${whoSearch} ${company}`.trim();
  const linkedin_people = `https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(
    peopleQ
  )}`;
  const linkedin_company = `https://www.linkedin.com/search/results/companies/?keywords=${encodeURIComponent(
    company
  )}`;

  // X：优先原帖作者主页
  let x_company: string | undefined;
  const handle = extractXHandle(job);
  if (handle) {
    x_company = `https://x.com/${handle}`;
  } else {
    x_company = `https://x.com/search?q=${encodeURIComponent(
      company
    )}&f=user`;
  }

  // 搜人：公司 + 角色关键词
  const x_people = `https://x.com/search?q=${encodeURIComponent(
    `${company} (${whoSearch})`
  )}&f=user`;

  return { linkedin_people, linkedin_company, x_people, x_company };
}

function extractXHandle(job: Job): string | null {
  if (job.source === "x") {
    const fromCompany = job.company.match(/^@([A-Za-z0-9_]{2,30})$/);
    if (fromCompany) return fromCompany[1];
    const fromUrl = job.source_url.match(
      /(?:x|twitter)\.com\/([A-Za-z0-9_]{2,30})(?:\/|$)/i
    );
    if (fromUrl && !["i", "search", "home", "intent"].includes(fromUrl[1])) {
      return fromUrl[1];
    }
  }
  const m = job.company.match(/^@([A-Za-z0-9_]{2,30})$/);
  return m ? m[1] : null;
}

function contactRoleFor(job: Job, profile: Profile): string {
  const t = `${job.title} ${job.role_family}`.toLowerCase();
  if (/intern|junior|entry/.test(t)) return "招聘协调 / Talent 或 Team Lead";
  if (job.role_family === "BD" || /bd|growth|partner|sales/.test(t))
    return "Head of BD / Growth Lead / 业务负责人";
  if (job.role_family === "Community" || /community|moderator|ambassador/.test(t))
    return "Community Lead / Head of Community";
  if (job.role_family === "Security" || /security|audit/.test(t))
    return "Security Lead / 审计团队负责人";
  if (job.role_family === "Research") return "Research Lead / Head of Research";
  if (job.role_family === "Product") return "Product Lead / Hiring Manager";
  if (profile.primary_role === "BD") return "业务负责人或 BD Lead";
  return "Hiring Manager / Team Lead";
}

/** LinkedIn/X 搜索用的英文角色词 */
function contactSearchQuery(job: Job, profile: Profile): string {
  const t = `${job.title} ${job.role_family}`.toLowerCase();
  if (job.role_family === "BD" || /bd|growth|partner|sales/.test(t))
    return "Head of BD OR Growth Lead OR Business Development";
  if (job.role_family === "Community" || /community|moderator/.test(t))
    return "Community Lead OR Head of Community";
  if (job.role_family === "Security" || /security|audit/.test(t))
    return "Security Lead OR Smart Contract Auditor";
  if (job.role_family === "Research")
    return "Research Lead OR Crypto Research";
  if (job.role_family === "Product")
    return "Product Lead OR Product Manager Hiring";
  if (job.role_family === "Engineering")
    return "Engineering Manager OR Hiring Manager";
  if (profile.primary_role === "BD") return "Business Development Lead";
  return "Hiring Manager OR Recruiter";
}

function contactChannels(job: Job, profile: Profile): string[] {
  const ch: string[] = [];
  if (job.source === "x") ch.push("原帖回复");
  if (profile.location_pref?.cities?.length) ch.push("线下活动当面破冰");
  return ch;
}

function draftDm(profile: Profile, job: Job, who: string): string {
  const name = profile.display_name || "你好";
  const highlight =
    profile.highlights?.[0] || profile.summary || "Web3 相关经验";
  return `Hi，我是 ${name}，关注到 ${job.company} 的 ${job.title}。我主方向 ${profile.primary_role}，${highlight}。想请教作为 ${who} 这个角色更看重什么，是否方便 10 分钟聊聊？`;
}

export function saveCareerPath(path: CareerPath): void {
  ensureDataDirs();
  fs.writeFileSync(files.careerPath(), JSON.stringify(path, null, 2), "utf8");
}

export function loadCareerPath(): CareerPath | null {
  const fp = files.careerPath();
  if (!fs.existsSync(fp)) return null;
  try {
    return JSON.parse(fs.readFileSync(fp, "utf8")) as CareerPath;
  } catch {
    return null;
  }
}
