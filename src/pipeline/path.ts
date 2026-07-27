/**
 * 完整求职路径：岗位 → 提升 → 活动 → 联系谁 → 投递
 * 支持 zh / en 路径正文
 */
import type { EventItem, Job, Profile } from "../types.js";
import fs from "node:fs";
import { ensureDataDirs, files } from "../paths.js";
import { getProfile, normalizeProfile } from "../profile/setup.js";

export type PathLang = "zh" | "en";

export interface PathContact {
  company: string;
  job_title: string;
  who: string;
  who_search: string;
  channels: string[];
  why: string;
  dm_draft: string;
  job_url?: string;
  linkedin_url: string;
  linkedin_company_url: string;
  x_url: string;
  x_company_url?: string;
}

export interface PathAction {
  order: number;
  title: string;
  detail?: string;
  items: string[];
  kind: "job" | "upskill" | "event" | "network" | "apply";
}

export interface PathImproveItem {
  title: string;
  why: string;
  steps: string[];
}

export interface CareerPath {
  generated_at: string;
  /** 正文语言 */
  lang: PathLang;
  headline: string;
  summary: string;
  summary_lines?: string[];
  actions: PathAction[];
  improve: PathImproveItem[];
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

function pick(lang: PathLang, zh: string, en: string): string {
  return lang === "en" ? en : zh;
}

export function buildCareerPath(
  profile: Profile,
  shortlist: Job[],
  events: EventItem[],
  opts?: { lang?: PathLang }
): CareerPath {
  const lang: PathLang = opts?.lang === "en" ? "en" : "zh";
  const name =
    profile.display_name ||
    pick(lang, "你", "you");
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
  const gapList = [...gapMap.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([g, n]) => ({ gap: g, count: n }));

  const improve = buildImproveItems(profile, gapList, titles, topJobs, lang);

  const contacts: PathContact[] = topJobs.slice(0, 6).map((j) => {
    const who = contactRoleFor(j, profile, lang);
    const who_search = contactSearchQuery(j, profile);
    const companyClean = cleanCompany(j.company);
    const links = buildContactLinks(companyClean, who_search, j);
    const score = j.match?.score ?? "—";
    return {
      company: j.company,
      job_title: j.title,
      who,
      who_search,
      channels: [
        pick(lang, "LinkedIn 搜索", "LinkedIn search"),
        pick(lang, "X 搜索", "X search"),
        ...contactChannels(j, profile, lang),
      ],
      why: pick(
        lang,
        `该岗位匹配分 ${score}，通过 ${who} 比海投更易进面试池`,
        `Match score ${score}. Reaching ${who} usually beats cold apply.`
      ),
      dm_draft: draftDm(profile, j, who, lang),
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
        ? pick(
            lang,
            "来自 X 招聘帖：可直接回复 / 私信发帖账号",
            "From an X hiring post: reply or DM the poster"
          )
        : j.source === "dejob.ai"
          ? pick(lang, "DeJob 岗位页投递", "Apply on DeJob")
          : pick(lang, "官网 / 招聘板申请链接", "Official / board apply link"),
  }));

  const jobItems = topJobs.length
    ? topJobs.slice(0, 3).map((j, i) => {
        const scoreBit =
          j.match?.score != null
            ? pick(
                lang,
                `（匹配 ${j.match.score}）`,
                ` (match ${j.match.score})`
              )
            : "";
        return `${i + 1}. ${j.title} @ ${j.company}${scoreBit}`;
      })
    : [
        pick(
          lang,
          "等待匹配结果生成后刷新本页",
          "Refresh after matching finishes"
        ),
      ];

  const improveItems = improve
    .slice(0, 3)
    .map((it, i) => `${i + 1}. ${it.title}`);

  const eventItems = topEvents.length
    ? topEvents.slice(0, 3).map((e, i) => {
        const when = e.start_at
          ? new Date(e.start_at).toLocaleDateString(
              lang === "en" ? "en-US" : "zh-CN"
            )
          : pick(lang, "日期待定", "Date TBD");
        return `${i + 1}. ${e.title} · ${e.city || "—"} · ${when}`;
      })
    : [
        pick(
          lang,
          "暂无高相关活动，完善活动城市后重新生成",
          "No strong event matches yet — add event cities and regenerate"
        ),
      ];

  const networkItems = contacts.length
    ? contacts.slice(0, 3).map(
        (c, i) =>
          `${i + 1}. ${c.company} → ${pick(lang, "找", "reach")} ${c.who}` +
          pick(lang, "（LinkedIn / X 一点跳转）", " (LinkedIn / X one-click)")
      )
    : [
        pick(
          lang,
          "匹配岗位后自动生成联系策略",
          "Contact plan appears after jobs are matched"
        ),
      ];

  const actions: PathAction[] = [
    {
      order: 1,
      title: pick(lang, "锁定本周 3 个目标岗", "Lock 3 target roles this week"),
      detail: pick(
        lang,
        "先只盯下面这几条，避免海投。",
        "Focus only on these — avoid spray-and-pray."
      ),
      items: jobItems,
      kind: "job",
    },
    {
      order: 2,
      title: pick(lang, "补齐简历缺口", "Close resume gaps"),
      detail: pick(
        lang,
        "按「建议提升」逐条执行，优先做最上面 1–2 项。",
        "Follow Improve below; do the top 1–2 first."
      ),
      items: improveItems.length
        ? improveItems
        : [
            pick(
              lang,
              "见下方「建议提升」完整步骤",
              "See full Improve steps below"
            ),
          ],
      kind: "upskill",
    },
    {
      order: 3,
      title: pick(lang, "参加推荐线下活动", "Attend recommended events"),
      detail: pick(
        lang,
        "已按你的画像筛选，到场比只投简历更易认识招人方。",
        "Matched to your profile — showing up beats cold applications."
      ),
      items: eventItems,
      kind: "event",
    },
    {
      order: 4,
      title: pick(
        lang,
        "在 X / LinkedIn 联系关键人",
        "Reach people on X / LinkedIn"
      ),
      detail: pick(
        lang,
        "先搜人 → 发简短私信 → 再投递，转化通常高于冷投。",
        "Search → short DM → then apply. Usually beats cold apply."
      ),
      items: networkItems,
      kind: "network",
    },
    {
      order: 5,
      title: pick(lang, "按链接正式投递", "Apply via the links"),
      detail: pick(
        lang,
        "用下方「投递入口」逐条申请。",
        "Use Apply links below, one by one."
      ),
      items: [
        pick(
          lang,
          "打开对应岗位链接，按 JD 定制 2–3 句 opening",
          "Open the job link; tailor a 2–3 sentence opening to the JD"
        ),
        pick(
          lang,
          "投递后在「申请」记下状态（已投 / 面试 / 跟进）",
          "Log status in Apps (applied / interview / follow-up)"
        ),
        pick(
          lang,
          "48 小时后若无回复，用联系人草稿跟进一次",
          "If no reply in 48h, follow up with the contact draft"
        ),
      ],
      kind: "apply",
    },
  ];

  const summary_lines = [
    pick(
      lang,
      "从线上岗位里筛出高匹配 shortlist",
      "Shortlist high-match jobs from online sources"
    ),
    pick(
      lang,
      "针对缺口给出可执行的提升步骤",
      "Actionable steps for your skill gaps"
    ),
    pick(
      lang,
      "自动匹配适合你的线下活动",
      "Offline events matched to your profile"
    ),
    pick(
      lang,
      "在 X / LinkedIn 定位该联系的人（一点跳转搜索）",
      "People to contact on X / LinkedIn (one-click search)"
    ),
  ];

  return {
    generated_at: new Date().toISOString(),
    lang,
    headline: pick(
      lang,
      `${name} 的 Web3 求职路径 · ${titles}`,
      `${name}'s Web3 career path · ${titles}`
    ),
    summary: summary_lines.join("\n"),
    summary_lines,
    actions,
    improve,
    contacts,
    apply_targets,
    events: topEvents,
    shortlist: topJobs,
  };
}

/** 不重新扫岗：用已有 shortlist/events 按语言重写路径正文 */
export function rebuildCareerPathForLang(lang: PathLang): CareerPath | null {
  const existing = loadCareerPath();
  if (!existing?.shortlist?.length && !existing?.events?.length) {
    // still allow rebuild if only path shell
    if (!existing) return null;
  }
  const raw = getProfile();
  if (!raw) return null;
  const profile = normalizeProfile(raw);
  const path = buildCareerPath(
    profile,
    existing?.shortlist || [],
    existing?.events || [],
    { lang }
  );
  // 若 shortlist 在 path 被截断，优先保留已存 full shortlist
  if (existing?.shortlist?.length) {
    path.shortlist = existing.shortlist.slice(0, 8);
  }
  if (existing?.events?.length && !path.events.length) {
    path.events = existing.events
      .filter((e) => (e.relevance_score || 0) >= 40)
      .slice(0, 6);
  }
  saveCareerPath(path);
  return path;
}

function buildImproveItems(
  profile: Profile,
  gaps: { gap: string; count: number }[],
  titles: string,
  topJobs: Job[],
  lang: PathLang
): PathImproveItem[] {
  const items: PathImproveItem[] = [];
  const seen = new Set<string>();

  const pushUnique = (it: PathImproveItem) => {
    const k = it.title.toLowerCase();
    if (seen.has(k)) return;
    seen.add(k);
    items.push(it);
  };

  for (const { gap, count } of gaps) {
    pushUnique(expandGapToImprove(gap, count, profile, titles, lang));
  }

  if (items.length < 4) {
    for (const it of defaultImproveForRole(profile, titles, topJobs, lang)) {
      pushUnique(it);
      if (items.length >= 5) break;
    }
  }

  return items.slice(0, 5);
}

function expandGapToImprove(
  gap: string,
  count: number,
  profile: Profile,
  titles: string,
  lang: PathLang
): PathImproveItem {
  const role = profile.primary_role;
  const freq = pick(
    lang,
    count > 1 ? `在 shortlist 中出现 ${count} 次` : "出现在匹配分析中",
    count > 1
      ? `appeared ${count}× in your shortlist`
      : "flagged in match analysis"
  );

  if (/岗位偏|主角色|role_family|role family/i.test(gap)) {
    return {
      title: pick(
        lang,
        "对齐目标角色与岗位家族",
        "Align role family with target jobs"
      ),
      why: pick(
        lang,
        `${gap}（${freq}）。招聘方会先用岗位名 / 角色线过滤，错位会直接进不了下一轮。`,
        `${gap} (${freq}). Recruiters filter by title/role first — mismatch ends the process early.`
      ),
      steps: [
        pick(
          lang,
          `在设置里把主角色定为你真正要投的方向（当前：${role}），次角色可补相邻能力线`,
          `In Setup set primary role to what you actually want (now: ${role}); add adjacent secondary roles`
        ),
        pick(
          lang,
          `目标岗位名称改成 JD 高频写法，例如：${titles}`,
          `Rewrite target titles to JD-common wording, e.g. ${titles}`
        ),
        pick(
          lang,
          "简历抬头与 LinkedIn Headline 写成「角色 + 赛道 + 1 个成果数字」同一口径",
          "Make resume header & LinkedIn headline consistent: role + sector + one metric"
        ),
        pick(
          lang,
          "每投一岗，opening 第一句点明「为什么你能做这个家族的工作」，不要只列技能",
          "First line of each opening: why you fit this role family — not a skill dump"
        ),
      ],
    };
  }

  if (/技能|覆盖|skill|关键词|keyword/i.test(gap)) {
    const skills =
      (profile.skills || []).slice(0, 5).join(lang === "en" ? ", " : "、") ||
      pick(lang, "你的核心技能", "your core skills");
    return {
      title: pick(
        lang,
        "把技能写进 JD 语言（可扫可读）",
        "Mirror JD skill language (ATS-readable)"
      ),
      why: pick(
        lang,
        `${gap}（${freq}）。系统与人工扫简历都看是否出现岗位关键词，有经历但没写对词会被当成不会。`,
        `${gap} (${freq}). ATS and humans scan for JD keywords — experience without the words looks like a miss.`
      ),
      steps: [
        pick(
          lang,
          "打开 shortlist 前 3 个 JD，各圈出 5 个重复硬技能/工具词",
          "Open top 3 shortlist JDs; circle 5 repeated hard skills/tools each"
        ),
        pick(
          lang,
          `在简历技能区用 JD 原词改写（你已有：${skills}），同义词合并、删弱相关词`,
          `Rewrite Skills with JD wording (you have: ${skills}); merge synonyms, drop weak noise`
        ),
        pick(
          lang,
          "在最近 1–2 段经历 bullet 里嵌入这些词，并带结果数字（%、人数、金额、周期）",
          "Embed those words in your last 1–2 roles with metrics (%, people, $, time)"
        ),
        pick(
          lang,
          "做一版 1 页「角色向」简历：只保留能证明目标岗的项目",
          "Make a 1-page role-focused resume: only proof for the target job"
        ),
      ],
    };
  }

  if (/远程|地点|location|城市|onsite|hybrid/i.test(gap)) {
    return {
      title: pick(
        lang,
        "地点与工作方式说清楚",
        "Clarify location & work mode"
      ),
      why: pick(
        lang,
        `${gap}（${freq}）。地点不符是自动拒信高发原因，简历和设置必须一致。`,
        `${gap} (${freq}). Location mismatch is a top auto-reject reason — resume and Setup must match.`
      ),
      steps: [
        pick(
          lang,
          "设置里求职城市只保留你能接受的 1–3 个",
          "Keep only 1–3 real job cities in Setup"
        ),
        pick(
          lang,
          "远程 / 混合 / 现场勾选与真实意愿一致；能出差的写清可到场城市",
          "Remote/Hybrid/Onsite must match reality; list cities you can visit"
        ),
        pick(
          lang,
          "简历顶部地点一行写清：当前城市 · 可远程 · 可到场城市",
          "Resume location line: current city · open to remote · cities you can attend"
        ),
        pick(
          lang,
          "投递表单位置栏与简历完全一致",
          "Application form location must match the resume exactly"
        ),
      ],
    };
  }

  if (/年限|senior|junior|级别|level|经验不足|experience/i.test(gap)) {
    return {
      title: pick(
        lang,
        "用项目深度补年限叙事",
        "Offset years with depth of ownership"
      ),
      why: pick(
        lang,
        `${gap}（${freq}）。年限不够时，要用「独立负责范围 + 结果」证明可越级。`,
        `${gap} (${freq}). If years look light, prove scope + outcomes that punch above level.`
      ),
      steps: [
        pick(
          lang,
          "挑 1 个项目写成：背景 → 你独立负责的模块 → 指标前后对比 → 可迁移能力",
          "Rewrite one project: context → what you owned → before/after metrics → transferable skills"
        ),
        pick(
          lang,
          "简历 bullet 用「动词 + 对象 + 结果」，避免「参与 / 协助」弱表述",
          "Bullets = verb + object + result; avoid “assisted / participated”"
        ),
        pick(
          lang,
          "准备 3 个 STAR 口述：协作、增长/转化、危机各 1 个",
          "Prep 3 STAR stories: collab, growth, crisis"
        ),
        pick(
          lang,
          "若为实习/在校：标题标明 Intern/Associate，并写可全职到岗时间",
          "If intern/student: label Intern/Associate and state full-time availability"
        ),
      ],
    };
  }

  if (/英文|english|语言|language/i.test(gap)) {
    return {
      title: pick(lang, "补齐英文表达证据", "Prove English communication"),
      why: pick(
        lang,
        `${gap}（${freq}）。跨境团队会先看你是否能用英文独立沟通。`,
        `${gap} (${freq}). Cross-border teams first check if you can work in English solo.`
      ),
      steps: [
        pick(
          lang,
          "准备 1 页英文简历，数字与中文版一致，title 用行业标准英文",
          "One-page English resume; same metrics; standard industry titles"
        ),
        pick(
          lang,
          "写 3 段 80 词英文自我介绍：背景 / 代表成果 / 为什么看这个岗",
          "Three ~80-word English intros: background / win / why this role"
        ),
        pick(
          lang,
          "每周发 1 条英文 X/LinkedIn 帖，链接放进简历",
          "Post weekly in English on X/LinkedIn; link it on the resume"
        ),
        pick(
          lang,
          "面试前用目标 JD 做 10 分钟英文 mock",
          "10-min English mock on the target JD before interviews"
        ),
      ],
    };
  }

  if (/token|薪资|补偿|comp|equity/i.test(gap)) {
    return {
      title: pick(
        lang,
        "薪资与代币预期对齐市场",
        "Align salary & token expectations"
      ),
      why: pick(
        lang,
        `${gap}（${freq}）。预期与市场差太大，或简历未体现可谈空间，容易卡在 HR 关。`,
        `${gap} (${freq}). Unrealistic or unclear pay/token asks stall at HR.`
      ),
      steps: [
        pick(
          lang,
          "在设置填最低可接受月薪，并标清是否接受代币占比高的方案",
          "Set min monthly pay in Setup; note if token-heavy packages are OK"
        ),
        pick(
          lang,
          "面谈前准备：法币底线 / 可接受代币占比 / 锁仓与 cliff 问题",
          "Before talks: cash floor / token share / cliff & vesting questions"
        ),
        pick(
          lang,
          "公开材料不要写死过高期望；用「可谈」+ 口头区间",
          "Don’t hardcode high asks publicly; use “flexible” + verbal range"
        ),
      ],
    };
  }

  const shortTitle =
    gap.length > 36 ? gap.slice(0, 36) + "…" : gap || pick(lang, "补齐匹配缺口", "Close match gap");

  return {
    title: shortTitle,
    why: pick(
      lang,
      `匹配分析提示：${gap}（${freq}）。需要把抽象缺口变成可交付物。`,
      `Match note: ${gap} (${freq}). Turn the abstract gap into deliverables.`
    ),
    steps: [
      pick(
        lang,
        "用一句话写下：这个缺口会让招聘方担心什么",
        "One sentence: what fear does this gap create for the hiring side?"
      ),
      pick(
        lang,
        "选 1 个现有项目，补 2 条能回应该担心的 bullet（带数字）",
        "Add 2 metric bullets on an existing project that answer that fear"
      ),
      pick(
        lang,
        "在本周投递的每封 opening 里用 1 句正面回应该缺口",
        "One positive line in each opening this week that addresses the gap"
      ),
      pick(
        lang,
        "完成后重新生成计划，看 shortlist 匹配分是否上升",
        "Regenerate Plan and check if shortlist scores improve"
      ),
    ],
  };
}

function defaultImproveForRole(
  profile: Profile,
  titles: string,
  topJobs: Job[],
  lang: PathLang
): PathImproveItem[] {
  const role = profile.primary_role;
  const sampleJob = topJobs[0];
  const base: PathImproveItem[] = [
    {
      title: pick(
        lang,
        "对照目标岗补 1–2 个可量化成果",
        "Add 1–2 quantified wins for target roles"
      ),
      why: pick(
        lang,
        `目标方向是「${titles}」。没有数字的经历很难进入 shortlist 头部。`,
        `Target track: ${titles}. Unquantified experience rarely makes the top of shortlists.`
      ),
      steps: [
        pick(
          lang,
          "每个关键经历至少 1 条带 %、人数、金额、周期或排名的结果",
          "Every key role: ≥1 bullet with %, people, $, time, or rank"
        ),
        pick(
          lang,
          "优先写：获客 / 转化 / 合作数 / 内容曝光 / TVL / 用户量 等业务结果",
          "Prefer business outcomes: acquisition, conversion, deals, reach, TVL, users"
        ),
        pick(
          lang,
          "把最强的 1 条成果放到简历简介第一句",
          "Put your strongest metric in the first summary sentence"
        ),
        sampleJob
          ? pick(
              lang,
              `参考岗位「${sampleJob.title} @ ${sampleJob.company}」的 JD 动词改写 bullet`,
              `Rewrite bullets with verbs from “${sampleJob.title} @ ${sampleJob.company}” JD`
            )
          : pick(
              lang,
              "用目标岗位常见 JD 动词改写 bullet",
              "Rewrite bullets with common JD verbs for your target titles"
            ),
      ],
    },
    {
      title: pick(lang, "准备 3 个 STAR 故事", "Prep 3 STAR stories"),
      why: pick(
        lang,
        "面试官会反复问协作、增长、踩坑；没有结构化故事容易答散。",
        "Interviews re-ask collab, growth, failure — unstructured answers scatter."
      ),
      steps: [
        pick(
          lang,
          "故事 A · 合作：跨团队推动一件事落地",
          "Story A · collab: shipping something across teams"
        ),
        pick(
          lang,
          "故事 B · 增长或结果：指标从 A 到 B，你做了哪 3 步",
          "Story B · growth: metric A→B and your 3 moves"
        ),
        pick(
          lang,
          "故事 C · 危机：延期 / 争议 / 数据异常，你如何止损与复盘",
          "Story C · crisis: delay / conflict / bad data — stop-loss & retro"
        ),
        pick(
          lang,
          "每个故事练到 90 秒内讲完，中英各一版要点卡",
          "Each story under 90s; bullet cards in Chinese and English"
        ),
      ],
    },
  ];

  if (role === "BD" || role === "Community") {
    base.push({
      title: pick(
        lang,
        "做出可展示的 BD / 增长作品集",
        "Ship a visible BD / growth portfolio"
      ),
      why: pick(
        lang,
        "BD/Growth 岗看 pipeline 与渠道能力，口头说「有资源」说服力弱。",
        "BD/Growth roles buy pipeline proof — “I have resources” is weak alone."
      ),
      steps: [
        pick(
          lang,
          "整理一张表：接触过的 10 个项目/渠道 · 结果 · 你的动作（可脱敏）",
          "Table of 10 projects/channels · outcomes · your moves (redact if needed)"
        ),
        pick(
          lang,
          "写 1 篇公开 case study（GTM / KOL / listing / 活动获客任选）",
          "One public case study (GTM / KOL / listing / event growth)"
        ),
        pick(
          lang,
          "LinkedIn/X 置顶代表合作或内容数据截图（打码敏感信息）",
          "Pin a redacted win screenshot on LinkedIn/X"
        ),
        pick(
          lang,
          "准备 30 秒 elevator pitch：你帮项目解决什么增长问题",
          "30s pitch: what growth problem you solve for projects"
        ),
      ],
    });
  } else if (role === "Engineering" || role === "Security") {
    base.push({
      title: pick(
        lang,
        "补公开技术证据（仓库 / 审计 / demo）",
        "Public technical proof (repo / audit / demo)"
      ),
      why: pick(
        lang,
        "技术岗需要可点击验证的产出，简历描述不足以过筛。",
        "Tech roles need clickable proof — resume prose alone rarely clears screens."
      ),
      steps: [
        pick(
          lang,
          "选 1 个小而完整的 repo：README 写清问题、架构、如何跑",
          "One small complete repo: problem, architecture, how to run in README"
        ),
        pick(
          lang,
          "Security：整理 1 份公开 write-up 或练习审计笔记（无敏感信息）",
          "Security: one public write-up or practice audit notes (no secrets)"
        ),
        pick(
          lang,
          "在简历项目链接旁写「你负责的模块 + 技术栈」一行",
          "Beside each project link: module you owned + stack"
        ),
        pick(
          lang,
          "针对 shortlist 技术栈，补 1 个最小 demo",
          "Minimal demo for shortlist stack gaps"
        ),
      ],
    });
  } else if (role === "Research") {
    base.push({
      title: pick(lang, "做出研究交付物样本", "Produce a research sample"),
      why: pick(
        lang,
        "Research 看框架与写作密度，需要 1 份能外发的 sample。",
        "Research hires for structure & writing density — need one shareable sample."
      ),
      steps: [
        pick(
          lang,
          "写 1 篇 1500 字内赛道研究：结构、数据来源、结论与风险",
          "≤1500-word sector note: structure, sources, conclusion, risks"
        ),
        pick(
          lang,
          "做 1 页 one-pager：问题 → 方法 → 发现 → 建议",
          "One-pager: problem → method → findings → asks"
        ),
        pick(
          lang,
          "公开或脱敏分享，链接放进简历",
          "Publish or share redacted; put the link on the resume"
        ),
        pick(
          lang,
          "准备：若只有 2 小时，你会如何尽调一个新协议",
          "Be ready: 2-hour diligence plan for a new protocol"
        ),
      ],
    });
  } else if (role === "Product") {
    base.push({
      title: pick(lang, "补产品决策样本", "Ship a product decision sample"),
      why: pick(
        lang,
        "Product 岗看 trade-off 与用户问题定义，需要书面样例。",
        "PM roles buy trade-offs & problem framing — need a written sample."
      ),
      steps: [
        pick(
          lang,
          "写 1 份 PRD 片段：问题、用户、方案对比、成功指标",
          "PRD slice: problem, users, options, success metrics"
        ),
        pick(
          lang,
          "用 1 个你做过的功能复盘：上线前后数据与取舍",
          "Retro one shipped feature: pre/post data and trade-offs"
        ),
        pick(
          lang,
          "准备：如何把 BD/运营需求翻译成可开发范围",
          "Be ready: translate BD/ops asks into buildable scope"
        ),
      ],
    });
  }

  return base;
}

function cleanCompany(company: string): string {
  return company
    .replace(/^@/, "")
    .replace(/\s+/g, " ")
    .replace(/\s*(Inc\.?|Ltd\.?|LLC|Limited|协议|公司)\s*$/i, "")
    .trim();
}

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

  let x_company: string | undefined;
  const handle = extractXHandle(job);
  if (handle) {
    x_company = `https://x.com/${handle}`;
  } else {
    x_company = `https://x.com/search?q=${encodeURIComponent(
      company
    )}&f=user`;
  }

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

function contactRoleFor(
  job: Job,
  profile: Profile,
  lang: PathLang
): string {
  const t = `${job.title} ${job.role_family}`.toLowerCase();
  if (/intern|junior|entry/.test(t))
    return pick(
      lang,
      "招聘协调 / Talent 或 Team Lead",
      "Talent partner or Team Lead"
    );
  if (job.role_family === "BD" || /bd|growth|partner|sales/.test(t))
    return pick(
      lang,
      "Head of BD / Growth Lead / 业务负责人",
      "Head of BD / Growth Lead"
    );
  if (
    job.role_family === "Community" ||
    /community|moderator|ambassador/.test(t)
  )
    return "Community Lead / Head of Community";
  if (job.role_family === "Security" || /security|audit/.test(t))
    return pick(
      lang,
      "Security Lead / 审计团队负责人",
      "Security Lead / audit lead"
    );
  if (job.role_family === "Research")
    return "Research Lead / Head of Research";
  if (job.role_family === "Product")
    return "Product Lead / Hiring Manager";
  if (profile.primary_role === "BD")
    return pick(lang, "业务负责人或 BD Lead", "BD Lead / business owner");
  return "Hiring Manager / Team Lead";
}

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

function contactChannels(
  job: Job,
  profile: Profile,
  lang: PathLang
): string[] {
  const ch: string[] = [];
  if (job.source === "x")
    ch.push(pick(lang, "原帖回复", "Reply on original post"));
  if (profile.location_pref?.cities?.length)
    ch.push(pick(lang, "线下活动当面破冰", "Ice-break at offline events"));
  return ch;
}

function draftDm(
  profile: Profile,
  job: Job,
  who: string,
  lang: PathLang
): string {
  const name = profile.display_name || pick(lang, "你好", "there");
  const highlight =
    profile.highlights?.[0] ||
    profile.summary ||
    pick(lang, "Web3 相关经验", "relevant Web3 experience");
  if (lang === "en") {
    return `Hi, I'm ${name}. I saw the ${job.title} role at ${job.company}. My focus is ${profile.primary_role}; ${highlight}. As ${who}, what do you weight most in this hire — open to a quick 10-min chat?`;
  }
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
    const p = JSON.parse(fs.readFileSync(fp, "utf8")) as CareerPath;
    if (!p.lang) p.lang = "zh";
    return p;
  } catch {
    return null;
  }
}
