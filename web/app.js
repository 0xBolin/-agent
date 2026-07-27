/** 职块 Job Block — i18n：中文界面全中文，英文界面全英文 */

const I18N = {
  zh: {
    nav_setup: "设置",
    nav_plan: "计划",
    nav_tracker: "申请",
    nav_events: "活动",
    nav_profile: "画像",
    brand_sub: "Web3 求职 Agent",
    brand_sub_auth: "OKX.AI · 专属链接登录",
    btn_logout: "退出",
    btn_example: "示例",
    btn_load: "读取",
    btn_prev: "上一步",
    btn_next: "下一步",
    btn_save: "生成求职路径",
    btn_edit_setup: "去设置修改",
    hero_title:
      '每一份值得的机会，<br /><span class="grad">都是一块职块。</span>',
    hero_eyebrow_setup: "职块",
    hero_eyebrow_plan: "求职路径",
    hero_eyebrow_tracker: "申请流水线",
    hero_eyebrow_events: "自动 · 活动",
    hero_eyebrow_profile: "个人画像",
    auth_sub: "OKX.AI · 专属链接登录",
    auth_title: "请使用专属链接进入",
    auth_lede:
      "本页不提供注册或网页钱包登录。请在自己的 Agent 中完成 Agentic Wallet 登录与购买，再点击 Agent 给你的链接。",
    auth_step_1: "在 OKX.AI 复制职块提示词，在自己的 Agent 中打开",
    auth_step_2: "Agent 引导 Agentic Wallet 登录（只返回登录链接，请自行点击）",
    auth_step_3: "先付费（或开发开通）→ 生成专属链接 /p/…",
    auth_step_4: "自行点击专属链接 → 默认登录进入",
    auth_dev_title: "开发者：模拟开通（仅返回链接，不代登）",
    auth_dev_btn: "生成测试专属链接",
    auth_copy: "复制链接",
    auth_note: "用户提示词见仓库 docs/USER-PROMPT.md",
    auth_dev_done: "请自行复制并打开专属链接（默认登录）。不会自动跳转。",
    path_building: "正在为你生成完整求职路径…",
    step_01_t: "目标岗位",
    step_01_d: "岗位名称与角色线",
    step_02_t: "简历",
    step_02_d: "结构化摘要 · 可确认微调",
    step_03_t: "地区",
    step_03_d: "城市与工作方式",
    step_04_t: "赛道",
    step_04_d: "白名单 / 黑名单",
    step_05_t: "薪资",
    step_05_d: "薪资与代币",
    step_06_t: "否决项",
    step_06_d: "硬性不接受的条件",
    step_07_t: "语言与级别",
    step_07_d: "语言 · 年限 · 级别",
    step_08_t: "亮点",
    step_08_d: "代表项目",
    step_09_t: "公司类型",
    step_09_d: "目标组织",
    step_10_t: "时区与保密",
    step_10_d: "时区与观望模式",
    step_11_t: "活动城市",
    step_11_d: "自动联动线下路径",
    f_name: "称呼",
    ph_name: "名字 / 花名",
    f_titles: "目标岗位名称",
    f_primary_role: "主角色线",
    f_secondary_role: "次角色",
    resume_hint:
      "简历由你的 Agent 在开通专属链接前解析并预填。此处展示结构化摘要，可确认与微调。",
    resume_empty:
      "尚未解析到简历摘要。请通过 Agent 提交 PDF 后再打开专属链接。",
    resume_raw_toggle: "完整简历原文（匹配用，可微调）",
    f_resume_raw: "简历原文",
    ph_resume_raw: "由 Agent 预填",
    ph_prefill: "由 Agent 预填",
    f_summary: "简介",
    f_skills: "技能",
    f_keywords: "岗位关键词",
    f_cities: "求职城市",
    f_work_mode: "工作方式",
    f_remote: "远程",
    f_hybrid: "混合",
    f_onsite: "现场",
    f_sectors: "赛道",
    f_sectors_extra: "追加赛道",
    f_blacklist: "黑名单",
    f_min_salary: "最低月薪",
    f_currency: "币种",
    f_comp: "薪资构成",
    f_token: "代币",
    f_token_only: "纯代币",
    f_equity: "股权",
    f_dealbreakers: "绝对不要",
    f_languages: "语言",
    f_years: "年限",
    f_level: "级别",
    f_highlights: "亮点（每行一条）",
    f_company_types: "公司类型",
    f_timezone: "时区",
    f_discrete: "保密观望",
    f_enable: "开启",
    f_alert: "提醒频率",
    event_badge: "亮点 · 第 11 步",
    event_title: "活动城市",
    event_desc:
      "填你能出现的城市。职块会<strong>自动</strong>从 Luma 匹配适合你的线下活动，并写进求职路径——不用你自己搜。",
    f_event_cities: "你能到场的城市",
    rs_education: "教育",
    rs_experience: "工作经历",
    rs_skills: "技能",
    rs_highlights: "亮点",
    rs_name: "姓名",
    rs_location: "地区",
    rs_empty_sec: "—",
    profile_empty: "暂无画像，请先完成设置。",
    profile_title: "你的画像",
    path_waiting: "等待中",
    path_running: "正在生成求职路径",
    path_done: "路径已就绪",
    path_error: "生成失败",
    path_default_headline: "完整求职路径",
    path_idle_msg: "完成设置后自动生成",
    path_lede_default:
      "线上岗位 · 线下活动 · 该联系的人 · 该补的能力——自动拼成一条可执行路径。",
    events_title: "为你筛选的活动",
    events_lede: "根据活动城市与简历自动匹配。路径报告里也会附带同一批推荐。",
    toast_titles: "请填写目标岗位",
    toast_resume: "简历尚未预填。请通过 Agent 提交 PDF 后再打开专属链接。",
    toast_started: "已开始生成路径",
    toast_example: "已填入示例",
    toast_loaded: "已读取",
    toast_copied: "已复制，请自行在新标签页打开",
    toast_copy_fail: "请手动复制链接",
    review_events: "活动城市",
    review_target: "目标",
    review_role: "角色",
    review_none_events: "（未填，将用求职城市）",
    pv_name: "称呼",
    pv_titles: "目标岗位",
    pv_role: "角色",
    pv_level: "级别",
    pv_lang: "语言",
    pv_summary: "简介",
    pv_skills: "技能",
    pv_highlights: "亮点",
    pv_cities: "求职城市",
    pv_event_cities: "活动城市",
    pv_sectors: "赛道",
    pv_blacklist: "黑名单",
    pv_comp: "薪资",
    pv_deal: "否决",
    pv_company: "公司类型",
    pv_tz: "时区",
    pv_discrete: "保密",
    pv_alert: "提醒",
    pv_resume_len: "简历字数",
    pv_updated: "更新",
    yes: "是",
    no: "否",
    sec_actions: "你应该怎么做",
    sec_jobs: "优先投递",
    sec_improve: "建议提升",
    sec_events: "适合你的活动",
    sec_events_sub: "自动推荐 · 无需搜索",
    sec_contacts: "该联系谁",
    sec_apply: "投递入口",
    sec_week: "本周任务",
    btn_rerun: "重新生成",
    btn_rebuild_week: "刷新本周任务",
    btn_refresh: "刷新",
    btn_track: "加入追踪",
    btn_tracked: "已在追踪",
    btn_open: "打开",
    btn_battle: "作战包",
    btn_add_outreach: "加入触达",
    btn_copy_proof: "复制 Proof",
    tab_apps: "申请",
    tab_outreach: "触达",
    f_proof: "Proof 证明（每行一条）",
    ph_proof: "可量化成果 / 可点击证据",
    f_social: "社交账号",
    outreach_empty: "暂无触达。在计划页「该联系谁」点加入触达。",
    st_todo: "未联系",
    st_messaged: "已私信",
    st_replied: "已回复",
    st_referred: "有内推",
    task_contribute: "贡献",
    bp_why: "为什么推你",
    bp_risks: "风险与缺口",
    bp_opening: "Opening",
    bp_bullets: "建议改 bullet",
    bp_contact: "联系谁",
    bp_proof: "Proof",
    tracker_title: "申请追踪",
    tracker_lede:
      "记录已投与跟进日，逾期会标红。可从计划页优先投递一键加入。",
    tracker_empty: "暂无申请。在计划页的「优先投递」里点「加入追踪」。",
    tracker_overdue: "逾期跟进",
    tracker_total: "全部",
    tracker_follow: "跟进日",
    tracker_status: "状态",
    tracker_save: "保存",
    tracker_filter_empty: "当前筛选下没有记录。",
    week_empty: "生成求职路径后自动出现本周任务。",
    toast_tracked: "已加入申请追踪",
    toast_already: "已在追踪列表",
    toast_week: "本周任务已刷新",
    toast_task: "任务已更新",
    improve_how: "具体怎么做",
    improve_legacy:
      "请在设置中更新画像后重新生成计划，以获取分步行动建议。",
    footer_main: "职块 · 完整路径 · 不自动投递",
    st_interested: "感兴趣",
    st_applied: "已投递",
    st_interviewing: "面试中",
    st_offer: "录用",
    st_rejected: "已拒",
    st_ghosted: "无回复",
    st_withdrawn: "已撤回",
    st_new: "新建",
    st_ranked: "已排序",
    st_evaluating: "评估中",
    st_prepared: "已准备",
    task_apply: "投递",
    task_outreach: "触达",
    task_event: "活动",
    task_improve: "提升",
    task_followup: "跟进",
    step_tag: "步骤",
    link_job: "岗位",
    link_open: "打开",
  },
  en: {
    nav_setup: "Setup",
    nav_plan: "Plan",
    nav_tracker: "Apps",
    nav_events: "Events",
    nav_profile: "Profile",
    brand_sub: "Web3 Career Agent",
    brand_sub_auth: "OKX.AI · Portal link sign-in",
    btn_logout: "Log out",
    btn_example: "Example",
    btn_load: "Reload",
    btn_prev: "Back",
    btn_next: "Next",
    btn_save: "Generate Plan",
    btn_edit_setup: "Edit in Setup",
    hero_title:
      'Every opportunity worth your time<br /><span class="grad">is a Job Block.</span>',
    hero_eyebrow_setup: "JOB BLOCK",
    hero_eyebrow_plan: "CAREER PATH",
    hero_eyebrow_tracker: "PIPELINE",
    hero_eyebrow_events: "AUTO · EVENTS",
    hero_eyebrow_profile: "PROFILE",
    auth_sub: "OKX.AI · Portal link sign-in",
    auth_title: "Open your portal link",
    auth_lede:
      "No email signup or in-page wallet login. Finish Agentic Wallet login & purchase in your Agent, then open the link it gives you.",
    auth_step_1: "Copy the Job Block prompt in OKX.AI and open it in your Agent",
    auth_step_2:
      "Agent guides Agentic Wallet login (link only — you click it yourself)",
    auth_step_3: "Pay (or dev unlock) → get portal link /p/…",
    auth_step_4: "Open the portal link yourself → signed in by default",
    auth_dev_title: "Dev: simulate unlock (returns link only, no auto-login)",
    auth_dev_btn: "Generate test portal link",
    auth_copy: "Copy link",
    auth_note: "User prompt: docs/USER-PROMPT.md",
    auth_dev_done: "Copy and open the portal link yourself. No auto-redirect.",
    path_building: "Building your Plan…",
    step_01_t: "Target roles",
    step_01_d: "Titles & role family",
    step_02_t: "Resume",
    step_02_d: "Structured summary · review & tweak",
    step_03_t: "Location",
    step_03_d: "Cities & work mode",
    step_04_t: "Sectors",
    step_04_d: "Whitelist / blacklist",
    step_05_t: "Salary",
    step_05_d: "Pay & token",
    step_06_t: "Deal-breakers",
    step_06_d: "Hard nos",
    step_07_t: "Language & level",
    step_07_d: "Languages · years · seniority",
    step_08_t: "Highlights",
    step_08_d: "Signature wins",
    step_09_t: "Company type",
    step_09_d: "Target orgs",
    step_10_t: "Timezone & privacy",
    step_10_d: "Quiet job search",
    step_11_t: "Event cities",
    step_11_d: "Auto offline path",
    f_name: "Display name",
    ph_name: "Name / handle",
    f_titles: "Target titles",
    f_primary_role: "Primary role",
    f_secondary_role: "Secondary roles",
    resume_hint:
      "Your Agent parses the PDF before opening the portal. Review the structured summary here.",
    resume_empty:
      "No resume summary yet. Submit a PDF via your Agent, then open the portal link.",
    resume_raw_toggle: "Full resume text (used for matching)",
    f_resume_raw: "Resume text",
    ph_resume_raw: "Prefill from Agent",
    ph_prefill: "Prefill from Agent",
    f_summary: "Summary",
    f_skills: "Skills",
    f_keywords: "Keywords",
    f_cities: "Job cities",
    f_work_mode: "Work mode",
    f_remote: "Remote",
    f_hybrid: "Hybrid",
    f_onsite: "Onsite",
    f_sectors: "Sectors",
    f_sectors_extra: "Extra sectors",
    f_blacklist: "Blacklist",
    f_min_salary: "Min monthly pay",
    f_currency: "Currency",
    f_comp: "Compensation",
    f_token: "Token",
    f_token_only: "Token only",
    f_equity: "Equity",
    f_dealbreakers: "Hard nos",
    f_languages: "Languages",
    f_years: "Years",
    f_level: "Level",
    f_highlights: "Highlights (one per line)",
    f_company_types: "Company types",
    f_timezone: "Timezone",
    f_discrete: "Discrete mode",
    f_enable: "On",
    f_alert: "Alert frequency",
    event_badge: "Highlight · Step 11",
    event_title: "Event cities",
    event_desc:
      "Cities you can show up in. Job Block <strong>auto</strong>-matches Luma events into your Plan.",
    f_event_cities: "Cities you can attend",
    rs_education: "Education",
    rs_experience: "Experience",
    rs_skills: "Skills",
    rs_highlights: "Highlights",
    rs_name: "Name",
    rs_location: "Location",
    rs_empty_sec: "—",
    profile_empty: "No profile yet. Complete Setup first.",
    profile_title: "Your profile",
    path_waiting: "Waiting",
    path_running: "Generating Plan",
    path_done: "Plan ready",
    path_error: "Failed",
    path_default_headline: "Career Plan",
    path_idle_msg: "Generate after Setup",
    path_lede_default:
      "Jobs · events · contacts · skills to improve — one executable path.",
    events_title: "Events for you",
    events_lede:
      "Matched from your event cities and resume. Also listed in your Plan.",
    toast_titles: "Add target titles",
    toast_resume: "Resume not prefilled. Submit PDF via Agent first.",
    toast_started: "Plan generation started",
    toast_example: "Example loaded",
    toast_loaded: "Reloaded",
    toast_copied: "Copied — open in a new tab",
    toast_copy_fail: "Copy manually",
    review_events: "Event cities",
    review_target: "Targets",
    review_role: "Role",
    review_none_events: "(empty → use job cities)",
    pv_name: "Name",
    pv_titles: "Titles",
    pv_role: "Role",
    pv_level: "Level",
    pv_lang: "Languages",
    pv_summary: "Summary",
    pv_skills: "Skills",
    pv_highlights: "Highlights",
    pv_cities: "Job cities",
    pv_event_cities: "Event cities",
    pv_sectors: "Sectors",
    pv_blacklist: "Blacklist",
    pv_comp: "Salary",
    pv_deal: "Deal-breakers",
    pv_company: "Company types",
    pv_tz: "Timezone",
    pv_discrete: "Discrete",
    pv_alert: "Alerts",
    pv_resume_len: "Resume chars",
    pv_updated: "Updated",
    yes: "Yes",
    no: "No",
    sec_actions: "What to do",
    sec_jobs: "Priority roles",
    sec_improve: "Improve",
    sec_events: "Events for you",
    sec_events_sub: "Auto · no search",
    sec_contacts: "Who to contact",
    sec_apply: "Apply links",
    sec_week: "This week",
    btn_rerun: "Regenerate",
    btn_rebuild_week: "Refresh week tasks",
    btn_refresh: "Refresh",
    btn_track: "Track",
    btn_tracked: "Tracking",
    btn_open: "Open",
    btn_battle: "Battle pack",
    btn_add_outreach: "Track outreach",
    btn_copy_proof: "Copy Proof",
    tab_apps: "Apps",
    tab_outreach: "Outreach",
    f_proof: "Proof items (one per line)",
    ph_proof: "Metrics / clickable proof",
    f_social: "Social profiles",
    outreach_empty: "No outreach yet. Add from Plan contacts.",
    st_todo: "To contact",
    st_messaged: "Messaged",
    st_replied: "Replied",
    st_referred: "Referral",
    task_contribute: "Contribute",
    bp_why: "Why you",
    bp_risks: "Risks & gaps",
    bp_opening: "Opening",
    bp_bullets: "Bullet fixes",
    bp_contact: "Who to contact",
    bp_proof: "Proof",
    tracker_title: "Applications",
    tracker_lede:
      "Log applies & follow-ups. Overdue items are highlighted. Add from Plan shortlist.",
    tracker_empty: "No applications yet. Use Track on a shortlist job in Plan.",
    tracker_overdue: "Overdue",
    tracker_total: "All",
    tracker_follow: "Follow-up",
    tracker_status: "Status",
    tracker_save: "Save",
    tracker_filter_empty: "No items in this filter.",
    week_empty: "Week tasks appear after you generate a Plan.",
    toast_tracked: "Added to tracker",
    toast_already: "Already tracking",
    toast_week: "Week tasks refreshed",
    toast_task: "Task updated",
    improve_how: "How to do it",
    improve_legacy:
      "Update your profile in Setup and regenerate the Plan for step-by-step tips.",
    footer_main: "Job Block · Full path · No auto-apply",
    st_interested: "Interested",
    st_applied: "Applied",
    st_interviewing: "Interviewing",
    st_offer: "Offer",
    st_rejected: "Rejected",
    st_ghosted: "Ghosted",
    st_withdrawn: "Withdrawn",
    st_new: "New",
    st_ranked: "Ranked",
    st_evaluating: "Evaluating",
    st_prepared: "Prepared",
    task_apply: "Apply",
    task_outreach: "Outreach",
    task_event: "Event",
    task_improve: "Improve",
    task_followup: "Follow-up",
    step_tag: "STEP",
    link_job: "Job",
    link_open: "Open",
  },
};

let lang = localStorage.getItem("jb_lang") || "zh";
if (lang !== "zh" && lang !== "en") lang = "zh";
let lastPath = null;

function t(key) {
  return (I18N[lang] && I18N[lang][key]) || I18N.zh[key] || key;
}

function statusLabel(status) {
  const k = `st_${status}`;
  return t(k) !== k ? t(k) : status;
}

function taskTypeLabel(type) {
  const k = `task_${type}`;
  return t(k) !== k ? t(k) : type;
}

function stepsDef() {
  return [
    { n: "01", title: t("step_01_t"), desc: t("step_01_d") },
    { n: "02", title: t("step_02_t"), desc: t("step_02_d") },
    { n: "03", title: t("step_03_t"), desc: t("step_03_d") },
    { n: "04", title: t("step_04_t"), desc: t("step_04_d") },
    { n: "05", title: t("step_05_t"), desc: t("step_05_d") },
    { n: "06", title: t("step_06_t"), desc: t("step_06_d") },
    { n: "07", title: t("step_07_t"), desc: t("step_07_d") },
    { n: "08", title: t("step_08_t"), desc: t("step_08_d") },
    { n: "09", title: t("step_09_t"), desc: t("step_09_d") },
    { n: "10", title: t("step_10_t"), desc: t("step_10_d") },
    { n: "11", title: t("step_11_t"), desc: t("step_11_d") },
  ];
}

let STEPS = stepsDef();
let meta = null;
let step = 0;
let pollTimer = null;
let cachedProfile = null;
let cachedStructured = null;
const selected = {
  primary_role: "BD",
  secondary_roles: [],
  sectors_whitelist: [],
  company_types: [],
  level: "mid",
  alert_frequency: "weekly",
};

function token() {
  return localStorage.getItem("jb_token") || "";
}
function setToken(v) {
  if (v) localStorage.setItem("jb_token", v);
  else localStorage.removeItem("jb_token");
}

async function api(path, opts = {}) {
  const headers = {
    "Content-Type": "application/json",
    ...(opts.headers || {}),
  };
  if (token()) headers.Authorization = `Bearer ${token()}`;
  const res = await fetch(path, { ...opts, headers });
  const data = await res.json().catch(() => ({}));
  if (res.status === 401) {
    setToken("");
    showAuth(true);
    throw new Error(
      data.message || data.error || (lang === "zh" ? "请先登录" : "Please sign in")
    );
  }
  if (!res.ok) {
    throw new Error(
      data.message ||
        data.error ||
        res.statusText ||
        (lang === "zh" ? `请求失败 ${res.status}` : `Request failed ${res.status}`)
    );
  }
  return data;
}

function $(sel) {
  return document.querySelector(sel);
}
function splitList(s) {
  return String(s || "")
    .split(/[,，|]/)
    .map((x) => x.trim())
    .filter(Boolean);
}
let toastTimer = null;
function toast(msg, err = false) {
  let el = $("#toast");
  if (!el) {
    el = document.createElement("div");
    el.id = "toast";
    el.className = "toast";
    el.setAttribute("role", "status");
    document.body.appendChild(el);
  }
  el.hidden = false;
  el.removeAttribute("hidden");
  el.classList.toggle("err", !!err);
  el.classList.add("show");
  el.textContent = String(msg || (err ? "Error" : "OK"));
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    el.classList.remove("show");
    el.hidden = true;
    el.setAttribute("hidden", "");
  }, 4200);
}
function escapeHtml(s) {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
function escapeAttr(s) {
  return escapeHtml(s).replace(/'/g, "&#39;");
}

function applyI18n() {
  document.documentElement.lang = lang === "zh" ? "zh-CN" : "en";
  document.title = lang === "zh" ? "职块 Job Block" : "Job Block";

  document.querySelectorAll("[data-i18n]").forEach((el) => {
    const k = el.getAttribute("data-i18n");
    if (k) el.textContent = t(k);
  });
  document.querySelectorAll("[data-i18n-html]").forEach((el) => {
    const k = el.getAttribute("data-i18n-html");
    if (k) el.innerHTML = t(k);
  });
  document.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
    const k = el.getAttribute("data-i18n-placeholder");
    if (k) el.setAttribute("placeholder", t(k));
  });
  document.querySelectorAll(".lang-btn").forEach((btn) => {
    btn.classList.toggle("on", btn.dataset.lang === lang);
  });

  STEPS = stepsDef();
  if ($("#stepList")) {
    renderSteps();
    goStep(step);
  }
  if (cachedStructured || cachedProfile) {
    renderStructuredResume(cachedStructured, cachedProfile);
  }
  if (cachedProfile) renderProfileView(cachedProfile);

  const reportSections = document.querySelectorAll(
    "#view-report .path-section .section-title"
  );
  const keys = [
    "sec_week",
    "sec_actions",
    "sec_jobs",
    "sec_improve",
    "sec_events",
    "sec_contacts",
    "sec_apply",
  ];
  reportSections.forEach((el, i) => {
    if (!keys[i]) return;
    if (keys[i] === "sec_events") {
      el.innerHTML = `${t("sec_events")} <span class="muted">${t(
        "sec_events_sub"
      )}</span>`;
    } else if (!el.hasAttribute("data-i18n") || keys[i] === "sec_week") {
      el.textContent = t(keys[i]);
    }
  });

  // 管道空闲文案（无运行中时）
  const pTitle = $("#pipelineTitle");
  const pMsg = $("#pipelineMsg");
  if (pTitle && !pTitle.closest(".running") && !pTitle.closest(".done")) {
    // only if still default-ish — setPipelineUI will overwrite when active
  }
  if (trackerCache) renderTrackerUI(trackerCache);
  if ($("#weekTasks")?.querySelector(".week-task")) loadWeekPlan();
  if (lastPath) renderPath(lastPath);
  else {
    const ph = $("#pathHeadline");
    const ps = $("#pathSummary");
    if (ph) ph.textContent = t("path_default_headline");
    if (ps && !ps.querySelector("ul")) ps.textContent = t("path_lede_default");
  }
  const pt = $("#pipelineTitle");
  const pm = $("#pipelineMsg");
  if (pt && $("#pipelineBanner") && !$("#pipelineBanner").classList.contains("running") && !$("#pipelineBanner").classList.contains("done") && !$("#pipelineBanner").classList.contains("error")) {
    pt.textContent = t("path_waiting");
    if (pm) pm.textContent = t("path_idle_msg");
  }
}

async function setLang(next) {
  if (next !== "zh" && next !== "en") return;
  lang = next;
  localStorage.setItem("jb_lang", lang);
  applyI18n();
  // 路径正文按语言重写（不重新扫岗）
  if (token()) {
    try {
      const r = await api("/api/path/lang", {
        method: "POST",
        body: JSON.stringify({ lang }),
      });
      if (r.path) {
        lastPath = r.path;
        renderPath(r.path);
      }
      if (r.week_plan) renderWeekPlan(r.week_plan, r.progress);
    } catch {
      /* 尚无路径时忽略 */
    }
  }
}

function bindLangSwitch() {
  document.querySelectorAll(".lang-switch").forEach((box) => {
    box.querySelectorAll(".lang-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        setLang(btn.dataset.lang).catch(console.error);
      });
    });
  });
}

function showAuth(show) {
  $("#authGate").classList.toggle("hidden", !show);
  $("#appRoot").classList.toggle("hidden", show);
}

function showAuthError(msg) {
  const err = $("#authError");
  if (!err) return;
  err.hidden = !msg;
  err.textContent = msg || "";
}

/** 仅 /p/{slug} 默登；首页无自助注册/钱包登录 */
async function tryPortalAutoLogin() {
  const m = location.pathname.match(/^\/p\/([a-zA-Z0-9_-]+)/);
  if (!m) return false;
  const slug = m[1];
  try {
    const r = await fetch("/api/auth/portal/" + encodeURIComponent(slug)).then(
      (x) => x.json()
    );
    if (r.error) {
      showAuth(true);
      showAuthError(r.error);
      return true;
    }
    setToken(r.token);
    $("#userPill").textContent = r.user.short || r.user.address;
    showAuth(false);
    await bootApp();
    return true;
  } catch (e) {
    showAuth(true);
    showAuthError(e.message);
    return true;
  }
}

function bindAuth() {
  const healthP = fetch("/api/health")
    .then((r) => r.json())
    .catch(() => ({}));
  healthP.then((h) => {
    if (h.dev_unlock && $("#devBox")) {
      $("#devBox").hidden = false;
    }
  });

  const btnDev = $("#btnDevUnlock");
  if (btnDev) {
    btnDev.onclick = async () => {
      showAuthError("");
      try {
        const addr =
          "0x" +
          Array.from(crypto.getRandomValues(new Uint8Array(20)))
            .map((b) => b.toString(16).padStart(2, "0"))
            .join("");
        const r = await fetch("/api/access/unlock", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ address: addr, dev: true }),
        }).then((x) => x.json());
        if (r.error) throw new Error(r.error);
        const wrap = $("#devLinkWrap");
        const link = $("#devLink");
        wrap.hidden = false;
        link.textContent = r.portalUrl;
        $("#authNote").textContent = t("auth_dev_done");
      } catch (e) {
        showAuthError(e.message || String(e));
      }
    };
  }

  const btnCopy = $("#btnCopyLink");
  if (btnCopy) {
    btnCopy.onclick = async () => {
      const text = $("#devLink")?.textContent || "";
      if (!text) return;
      try {
        await navigator.clipboard.writeText(text);
        toast(t("toast_copied"));
      } catch {
        toast(t("toast_copy_fail"), true);
      }
    };
  }

  $("#btnLogout").onclick = async () => {
    try {
      await api("/api/auth/logout", { method: "POST", body: "{}" });
    } catch {
      /* */
    }
    setToken("");
    stopPoll();
    if (location.pathname.startsWith("/p/")) {
      location.href = "/";
      return;
    }
    showAuth(true);
  };
}

/* Setup */
function renderSteps() {
  const list = $("#stepList");
  if (!list) return;
  list.innerHTML = STEPS.map(
    (s, i) => `
    <button type="button" class="step-item ${i === step ? "active" : ""} ${
      i < step ? "done" : ""
    } ${i === 10 ? "highlight" : ""}" data-i="${i}">
      <span class="step-num">${s.n}</span>
      <span class="label">${s.title}</span>
    </button>`
  ).join("");
  list.querySelectorAll(".step-item").forEach((btn) => {
    btn.addEventListener("click", () => goStep(Number(btn.dataset.i)));
  });
}

function renderChips(el, options, key, multi = true) {
  if (!el) return;
  el.innerHTML = options
    .map((opt) => {
      const on = multi ? selected[key].includes(opt) : selected[key] === opt;
      return `<button type="button" class="chip ${on ? "on" : ""}" data-v="${escapeAttr(
        opt
      )}">${escapeHtml(opt)}</button>`;
    })
    .join("");
  el.querySelectorAll(".chip").forEach((chip) => {
    chip.addEventListener("click", () => {
      const v = chip.dataset.v;
      if (multi) {
        const arr = selected[key];
        const i = arr.indexOf(v);
        if (i >= 0) arr.splice(i, 1);
        else arr.push(v);
      } else selected[key] = v;
      renderChips(el, options, key, multi);
      if (step === 10) updateReview();
    });
  });
}

function goStep(i) {
  step = Math.max(0, Math.min(STEPS.length - 1, i));
  document.querySelectorAll(".step-pane").forEach((p) => {
    p.classList.toggle("active", Number(p.dataset.step) === step);
  });
  const s = STEPS[step];
  $("#stepTag").textContent = `${t("step_tag")} ${s.n}`;
  $("#stepTitle").textContent = s.title;
  $("#stepDesc").textContent = s.desc;
  $("#progressText").textContent = `${step + 1} / ${STEPS.length}`;
  $("#btnPrev").disabled = step === 0;
  const last = step === STEPS.length - 1;
  $("#btnNext").classList.toggle("hidden", last);
  $("#btnSave").classList.toggle("hidden", !last);
  renderSteps();
  if (last) updateReview();
}

function formToProfile() {
  const f = $("#setupForm");
  const fd = new FormData(f);
  const g = (name) => String(fd.get(name) || "").trim();
  const whiteExtra = splitList(g("sectors_white_extra"));
  const sectors = [...new Set([...selected.sectors_whitelist, ...whiteExtra])];
  const highlights = g("highlights")
    .split(/\n|｜|\|/)
    .map((x) => x.trim())
    .filter(Boolean);

  const re = { ...(cachedProfile?.role_extensions || {}) };
  // keep structured JSON if user didn't re-parse
  if (cachedStructured?.experiences) {
    re.experiences_json = JSON.stringify(cachedStructured.experiences);
  }
  if (cachedStructured?.education) {
    re.education_json = JSON.stringify(cachedStructured.education);
  }
  if (cachedStructured?.name) re.resume_name = cachedStructured.name;
  if (cachedStructured?.location) re.resume_location = cachedStructured.location;

  return {
    display_name: g("display_name"),
    target_titles: splitList(g("target_titles")),
    primary_role: selected.primary_role,
    secondary_roles: selected.secondary_roles,
    resume_text: g("resume_text"),
    summary: g("summary"),
    skills: [
      ...new Set([...splitList(g("skills")), ...splitList(g("keywords"))]),
    ],
    location_pref: {
      cities: splitList(g("cities")),
      remote_ok: f.remote_ok.checked,
      hybrid_ok: f.hybrid_ok.checked,
      onsite_ok: f.onsite_ok.checked,
    },
    sectors_whitelist: sectors,
    sectors_blacklist: splitList(g("sectors_blacklist")),
    comp_pref: {
      min_base_fiat: g("min_base_fiat") ? Number(g("min_base_fiat")) : undefined,
      currency: g("currency") || "USD",
      token_ok: f.token_ok.checked,
      token_only_ok: f.token_only_ok.checked,
      equity_ok: f.equity_ok.checked,
    },
    deal_breakers: splitList(g("deal_breakers")),
    languages: splitList(g("languages")),
    experience_years: Number(g("experience_years") || 0),
    level: selected.level,
    highlights,
    company_types: selected.company_types,
    timezone: g("timezone") || "UTC+8",
    discrete_mode: f.discrete_mode.checked,
    alert_frequency: selected.alert_frequency,
    event_cities: splitList(g("event_cities")),
    proof_items: g("proof_items")
      .split(/\n/)
      .map((x) => x.trim())
      .filter(Boolean)
      .slice(0, 8),
    social: {
      x: g("social_x") || undefined,
      linkedin: g("social_linkedin") || undefined,
      github: g("social_github") || undefined,
    },
    role_extensions: {
      ...re,
      job_keywords: splitList(g("keywords")),
    },
    setup_completed: true,
  };
}

function structuredFromProfile(p, apiStructured) {
  if (apiStructured && (apiStructured.experiences?.length || apiStructured.education?.length || apiStructured.name)) {
    return apiStructured;
  }
  const re = p?.role_extensions || {};
  const parseJson = (v) => {
    if (typeof v !== "string" || !v) return [];
    try {
      return JSON.parse(v);
    } catch {
      return [];
    }
  };
  return {
    name: re.resume_name || p?.display_name || "",
    location:
      re.resume_location || (p?.location_pref?.cities || []).join(", ") || "",
    skills: p?.skills || [],
    keywords: Array.isArray(re.job_keywords) ? re.job_keywords : [],
    experiences: parseJson(re.experiences_json),
    education: parseJson(re.education_json),
    highlights: p?.highlights || [],
    summary: p?.summary || "",
  };
}

function renderStructuredResume(sr, profile) {
  const box = $("#resumeStructured");
  if (!box) return;
  const s = sr || structuredFromProfile(profile);
  cachedStructured = s;
  const has =
    s &&
    (s.name ||
      s.location ||
      (s.education && s.education.length) ||
      (s.experiences && s.experiences.length) ||
      (s.skills && s.skills.length) ||
      (s.highlights && s.highlights.length));

  if (!has) {
    box.innerHTML = `<div class="resume-empty muted">${escapeHtml(
      t("resume_empty")
    )}</div>`;
    return;
  }

  const eduHtml = (s.education || []).length
    ? (s.education || [])
        .map(
          (e) => `
      <div class="rs-item">
        <div class="rs-item-title">${escapeHtml(e.school || "—")}</div>
        <div class="rs-item-sub">${escapeHtml(
          [e.degree, e.period].filter(Boolean).join(" · ")
        )}</div>
        ${
          e.details
            ? `<div class="rs-item-body">${escapeHtml(e.details)}</div>`
            : ""
        }
      </div>`
        )
        .join("")
    : `<div class="muted">${escapeHtml(t("rs_empty_sec"))}</div>`;

  const expHtml = (s.experiences || []).length
    ? (s.experiences || [])
        .map(
          (e) => `
      <div class="rs-item">
        <div class="rs-item-title">${escapeHtml(
          e.title || "—"
        )} <span class="muted">@ ${escapeHtml(e.company || "—")}</span></div>
        <div class="rs-item-sub">${escapeHtml(e.period || "")}</div>
        ${
          e.bullets?.length
            ? `<ul class="rs-bullets">${e.bullets
                .map((b) => `<li>${escapeHtml(b)}</li>`)
                .join("")}</ul>`
            : ""
        }
      </div>`
        )
        .join("")
    : `<div class="muted">${escapeHtml(t("rs_empty_sec"))}</div>`;

  const skillTags = (s.skills || [])
    .map((x) => `<span class="tag">${escapeHtml(x)}</span>`)
    .join("");
  const hiTags = (s.highlights || [])
    .map((x) => `<div class="rs-hi">· ${escapeHtml(x)}</div>`)
    .join("");

  box.innerHTML = `
    <div class="rs-meta">
      ${
        s.name
          ? `<div><span class="rs-k">${escapeHtml(t("rs_name"))}</span> ${escapeHtml(
              s.name
            )}</div>`
          : ""
      }
      ${
        s.location
          ? `<div><span class="rs-k">${escapeHtml(
              t("rs_location")
            )}</span> ${escapeHtml(s.location)}</div>`
          : ""
      }
    </div>
    <div class="rs-block">
      <div class="rs-h">${escapeHtml(t("rs_education"))}</div>
      ${eduHtml}
    </div>
    <div class="rs-block">
      <div class="rs-h">${escapeHtml(t("rs_experience"))}</div>
      ${expHtml}
    </div>
    <div class="rs-block">
      <div class="rs-h">${escapeHtml(t("rs_skills"))}</div>
      <div class="chip-list">${skillTags || `<span class="muted">${escapeHtml(
        t("rs_empty_sec")
      )}</span>`}</div>
    </div>
    ${
      hiTags
        ? `<div class="rs-block"><div class="rs-h">${escapeHtml(
            t("rs_highlights")
          )}</div>${hiTags}</div>`
        : ""
    }
  `;
}

function profileToForm(p, structured) {
  if (!p) return;
  cachedProfile = p;
  cachedStructured = structuredFromProfile(p, structured);
  const f = $("#setupForm");
  f.display_name.value = p.display_name || cachedStructured.name || "";
  f.target_titles.value = (p.target_titles || []).join(", ");
  f.resume_text.value = p.resume_text || "";
  f.summary.value = p.summary || "";
  f.skills.value = (p.skills || []).join(", ");
  if (f.keywords) {
    const kw = p.role_extensions?.job_keywords;
    f.keywords.value = Array.isArray(kw) ? kw.join(", ") : "";
  }
  f.cities.value = (p.location_pref?.cities || []).join(", ");
  f.remote_ok.checked = p.location_pref?.remote_ok !== false;
  f.hybrid_ok.checked = p.location_pref?.hybrid_ok !== false;
  f.onsite_ok.checked = !!p.location_pref?.onsite_ok;
  f.sectors_blacklist.value = (p.sectors_blacklist || []).join(", ");
  f.min_base_fiat.value = p.comp_pref?.min_base_fiat ?? "";
  f.currency.value = p.comp_pref?.currency || "USD";
  f.token_ok.checked = p.comp_pref?.token_ok !== false;
  f.token_only_ok.checked = !!p.comp_pref?.token_only_ok;
  f.equity_ok.checked = p.comp_pref?.equity_ok !== false;
  f.deal_breakers.value = (p.deal_breakers || []).join(", ");
  f.languages.value = (p.languages || []).join(", ");
  f.experience_years.value = p.experience_years ?? "";
  f.highlights.value = (p.highlights || []).join("\n");
  if (f.proof_items) {
    f.proof_items.value = (p.proof_items || []).join("\n");
  }
  if (f.social_x) f.social_x.value = p.social?.x || "";
  if (f.social_linkedin) f.social_linkedin.value = p.social?.linkedin || "";
  if (f.social_github) f.social_github.value = p.social?.github || "";
  f.timezone.value = p.timezone || "UTC+8";
  f.discrete_mode.checked = !!p.discrete_mode;
  f.event_cities.value = (p.event_cities || []).join(", ");
  selected.primary_role = p.primary_role || "BD";
  selected.secondary_roles = [...(p.secondary_roles || [])];
  selected.sectors_whitelist = [...(p.sectors_whitelist || [])];
  selected.company_types = [...(p.company_types || [])];
  selected.level = p.level || "mid";
  selected.alert_frequency = p.alert_frequency || "weekly";
  renderAllChips();
  renderStructuredResume(cachedStructured, p);
  updateReview();
  renderProfileView(p);
}

function updateReview() {
  const p = formToProfile();
  $("#reviewBox").textContent = [
    `${t("review_events")} → ${
      p.event_cities.join(", ") || t("review_none_events")
    }`,
    `${t("review_target")} → ${(p.target_titles || []).join(", ")}`,
    `${t("review_role")} → ${p.primary_role}`,
  ].join("\n");
}

function renderAllChips() {
  if (!meta) return;
  renderChips($("#primaryRole"), meta.roles, "primary_role", false);
  renderChips($("#secondaryRoles"), meta.roles, "secondary_roles", true);
  renderChips($("#sectorsWhite"), meta.sectors, "sectors_whitelist", true);
  renderChips($("#companyTypes"), meta.companyTypes, "company_types", true);
  renderChips($("#levelChips"), meta.levels, "level", false);
  renderChips($("#alertFreq"), meta.alertFrequencies, "alert_frequency", false);
}

function switchView(name) {
  document.querySelectorAll(".view").forEach((v) => v.classList.add("hidden"));
  $(`#view-${name}`).classList.remove("hidden");
  document.querySelectorAll(".nav-btn").forEach((b) => {
    b.classList.toggle("active", b.dataset.view === name);
  });
  if (name === "report") {
    refreshPipeline(true);
    loadWeekPlan();
  }
  if (name === "tracker") {
    loadTracker();
    loadOutreach();
  }
  if (name === "events") loadAutoEvents();
  if (name === "profile") {
    if (cachedProfile) renderProfileView(cachedProfile);
    else
      api("/api/profile")
        .then((r) => {
          cachedProfile = r.profile;
          cachedStructured = r.structured_resume || null;
          renderProfileView(r.profile);
        })
        .catch(() => {});
  }
}

function renderProfileView(p) {
  if (!p) {
    $("#profileView").innerHTML = `<div class="card"><div class="body">${escapeHtml(
      t("profile_empty")
    )}</div></div>`;
    return;
  }
  const socialLine = [p.social?.x, p.social?.linkedin, p.social?.github]
    .filter(Boolean)
    .join(" · ");
  const rows = [
    [t("pv_name"), p.display_name],
    [t("pv_titles"), (p.target_titles || []).join(" · ")],
    [t("pv_role"), [p.primary_role, ...(p.secondary_roles || [])].join(" / ")],
    [t("pv_level"), `${p.experience_years || 0} · ${p.level || "—"}`],
    [t("pv_lang"), (p.languages || []).join(", ")],
    [t("pv_summary"), p.summary],
    [t("pv_skills"), (p.skills || []).join(", ")],
    [t("pv_highlights"), (p.highlights || []).join(" · ")],
    [t("f_proof"), (p.proof_items || []).join(" · ")],
    [t("f_social"), socialLine],
    [
      t("pv_cities"),
      (p.location_pref?.cities || []).join(", ") +
        ` · R${p.location_pref?.remote_ok ? "✓" : "×"} H${
          p.location_pref?.hybrid_ok ? "✓" : "×"
        } O${p.location_pref?.onsite_ok ? "✓" : "×"}`,
    ],
    [t("pv_event_cities"), (p.event_cities || []).join(", ") || "—"],
    [t("pv_sectors"), (p.sectors_whitelist || []).join(", ")],
    [t("pv_blacklist"), (p.sectors_blacklist || []).join(", ") || "—"],
    [
      t("pv_comp"),
      `≥${p.comp_pref?.min_base_fiat || "—"} ${p.comp_pref?.currency || ""} · token ${
        p.comp_pref?.token_ok ? "ok" : "no"
      } · only ${p.comp_pref?.token_only_ok ? "ok" : "no"}`,
    ],
    [t("pv_deal"), (p.deal_breakers || []).join(", ") || "—"],
    [t("pv_company"), (p.company_types || []).join(", ")],
    [t("pv_tz"), p.timezone],
    [t("pv_discrete"), p.discrete_mode ? t("yes") : t("no")],
    [t("pv_alert"), p.alert_frequency],
    [t("pv_resume_len"), String((p.resume_text || "").length)],
    [t("pv_updated"), p.updated_at || "—"],
  ];
  $("#profileView").innerHTML = rows
    .map(
      ([k, v]) => `
    <div class="profile-card">
      <div class="profile-k">${escapeHtml(k)}</div>
      <div class="profile-v">${escapeHtml(v || "—")}</div>
    </div>`
    )
    .join("");
}

/* Path report */
function setPipelineUI(st) {
  const running = st.status === "running";
  $("#pipelineBanner").classList.toggle("running", running);
  $("#pipelineBanner").classList.toggle("done", st.status === "done");
  $("#pipelineBanner").classList.toggle("error", st.status === "error");
  $("#pipelineSpinner").classList.toggle("hidden", !running);
  $("#pipelineTitle").textContent =
    st.status === "running"
      ? t("path_running")
      : st.status === "done"
        ? t("path_done")
        : st.status === "error"
          ? t("path_error")
          : t("path_waiting");
  $("#pipelineMsg").textContent = st.message || "—";
  $("#pipelinePct").textContent = `${st.progress || 0}%`;
  $("#progressFill").style.width = `${st.progress || 0}%`;
  if (st.path) renderPath(st.path);
  else if (st.shortlist?.length) renderShortlist(st.shortlist);
  if (st.week_plan) renderWeekPlan(st.week_plan, st.week_progress);
  if (st.tracker) {
    const od = st.tracker.overdue_count || 0;
    $("#topMeta").textContent = od
      ? `plan · overdue ${od}`
      : st.shortlist_count
        ? `plan · ${st.shortlist_count}`
        : $("#topMeta").textContent;
  }
}

function renderPath(path) {
  if (!path) return;
  lastPath = path;
  $("#pathHeadline").textContent = path.headline || t("path_default_headline");
  // summary：优先多行，从上往下
  const sumEl = $("#pathSummary");
  const lines = path.summary_lines?.length
    ? path.summary_lines
    : String(path.summary || "")
        .split(/\n|；|;/)
        .map((s) => s.trim())
        .filter(Boolean);
  if (lines.length > 1) {
    sumEl.innerHTML = `<ul class="path-summary-list">${lines
      .map((l) => `<li>${escapeHtml(l)}</li>`)
      .join("")}</ul>`;
  } else {
    sumEl.textContent = path.summary || "";
  }

  $("#pathActions").innerHTML = (path.actions || [])
    .map((a) => {
      const items = Array.isArray(a.items)
        ? a.items
        : a.detail
          ? String(a.detail)
              .split(/[；;]/)
              .map((s) => s.trim())
              .filter(Boolean)
          : [];
      const listHtml = items.length
        ? `<ul class="path-step-list">${items
            .map((it) => `<li>${escapeHtml(it)}</li>`)
            .join("")}</ul>`
        : a.detail
          ? `<div class="path-step-detail">${escapeHtml(a.detail)}</div>`
          : "";
      return `
    <div class="path-step-card">
      <div class="path-step-num">${a.order}</div>
      <div class="path-step-body">
        <div class="path-step-title">${escapeHtml(a.title)}</div>
        ${
          a.detail && items.length
            ? `<div class="path-step-lead">${escapeHtml(a.detail)}</div>`
            : ""
        }
        ${listHtml}
      </div>
    </div>`;
    })
    .join("");

  renderShortlist(path.shortlist || []);

  $("#pathImprove").innerHTML = renderImprove(path.improve);

  renderEventCards($("#pathEvents"), path.events || [], true);
  renderEventCards($("#eventList"), path.events || [], true);

  $("#pathContacts").innerHTML =
    (path.contacts || [])
      .map(
        (c) => `
    <article class="card">
      <div class="card-top">
        <div>
          <h3>${escapeHtml(c.company)} · ${escapeHtml(c.job_title)}</h3>
          <div class="meta">${escapeHtml(c.who)}</div>
        </div>
      </div>
      <div class="body">
        ${escapeHtml(c.why)}<br/>
        <div class="link-row">
          <a class="btn-link" href="${escapeAttr(
            c.linkedin_url || "#"
          )}" target="_blank" rel="noopener">LinkedIn</a>
          <a class="btn-link" href="${escapeAttr(
            c.linkedin_company_url || "#"
          )}" target="_blank" rel="noopener">LinkedIn Co.</a>
          <a class="btn-link" href="${escapeAttr(
            c.x_url || "#"
          )}" target="_blank" rel="noopener">X</a>
          ${
            c.x_company_url
              ? `<a class="btn-link" href="${escapeAttr(
                  c.x_company_url
                )}" target="_blank" rel="noopener">X Co.</a>`
              : ""
          }
          ${
            c.job_url
              ? `<a class="btn-link" href="${escapeAttr(
                  c.job_url
                )}" target="_blank" rel="noopener">${escapeHtml(
                  t("link_job")
                )}</a>`
              : ""
          }
        </div>
        <br/><strong>DM</strong><br/>
        <span class="mono-inline">${escapeHtml(c.dm_draft)}</span>
        <br/>
        <button type="button" class="btn ghost sm btn-add-or"
          data-company="${escapeAttr(c.company)}"
          data-who="${escapeAttr(c.who)}"
          data-job="${escapeAttr(c.job_title || "")}"
          data-li="${escapeAttr(c.linkedin_url || "")}"
          data-x="${escapeAttr(c.x_url || "")}"
          data-dm="${escapeAttr(c.dm_draft || "")}"
        >${escapeHtml(t("btn_add_outreach"))}</button>
      </div>
    </article>`
      )
      .join("") || emptyCard("—");

  document.querySelectorAll(".btn-add-or").forEach((btn) => {
    btn.addEventListener("click", async () => {
      try {
        const r = await api("/api/outreach", {
          method: "POST",
          body: JSON.stringify({
            company: btn.dataset.company,
            who: btn.dataset.who,
            job_title: btn.dataset.job,
            linkedin_url: btn.dataset.li,
            x_url: btn.dataset.x,
            dm_draft: btn.dataset.dm,
            lang,
          }),
        });
        toast(r.created ? t("toast_tracked") : t("toast_already"));
        btn.disabled = true;
      } catch (e) {
        toast(e.message, true);
      }
    });
  });

  $("#pathApply").innerHTML =
    (path.apply_targets || [])
      .map(
        (x) => `
    <article class="card">
      <div class="card-top">
        <div>
          <h3>${escapeHtml(x.label)}</h3>
          <div class="meta">${escapeHtml(x.note)}</div>
        </div>
        <div class="score ${Number(x.score) >= 70 ? "high" : ""}">${
          x.score ?? "—"
        }</div>
      </div>
      <div class="body">
        <a href="${escapeAttr(x.url)}" target="_blank" rel="noopener">${escapeHtml(
          t("btn_open")
        )}</a>
      </div>
    </article>`
      )
      .join("") || emptyCard("—");
}

function emptyCard(text) {
  return `<div class="card"><div class="body">${escapeHtml(text)}</div></div>`;
}

/** 建议提升：兼容旧 string[] 与新 {title,why,steps}[] */
function renderImprove(improve) {
  if (!improve?.length) {
    return `<div class="muted">—</div>`;
  }
  // legacy: plain strings
  if (typeof improve[0] === "string") {
    return improve
      .map(
        (g, i) => `
      <article class="improve-card">
        <div class="improve-idx">${i + 1}</div>
        <div class="improve-body">
          <h3 class="improve-title">${escapeHtml(g)}</h3>
          <p class="improve-why muted">${escapeHtml(t("improve_legacy"))}</p>
        </div>
      </article>`
      )
      .join("");
  }
  return improve
    .map((it, i) => {
      const steps = Array.isArray(it.steps) ? it.steps : [];
      return `
      <article class="improve-card">
        <div class="improve-idx">${i + 1}</div>
        <div class="improve-body">
          <h3 class="improve-title">${escapeHtml(it.title || "—")}</h3>
          ${
            it.why
              ? `<p class="improve-why">${escapeHtml(it.why)}</p>`
              : ""
          }
          ${
            steps.length
              ? `<div class="improve-how">${escapeHtml(t("improve_how"))}</div>
                 <ol class="improve-steps">${steps
                   .map((s) => `<li>${escapeHtml(s)}</li>`)
                   .join("")}</ol>`
              : ""
          }
        </div>
      </article>`;
    })
    .join("");
}

/** shortlist 岗位快照：用数组下标查找，避免 id 在 HTML 属性中损坏 */
let shortlistJobsCache = [];

function stableJobId(j) {
  if (!j) return "";
  if (j.id != null && String(j.id).trim()) return String(j.id).trim();
  if (j.source_url) return `url:${String(j.source_url).slice(0, 180)}`;
  return `t:${j.company || ""}|${j.title || ""}`;
}

function jobSnapshot(j) {
  if (!j) return null;
  const id = stableJobId(j);
  if (!id) return null;
  return {
    id,
    title: j.title || "",
    company: j.company || "",
    source_url: j.source_url || "",
    source: j.source || "",
    role_family: j.role_family || "",
    remote_type: j.remote_type || "",
    match: j.match
      ? {
          score: j.match.score,
          summary: j.match.summary,
          strengths: j.match.strengths,
          gaps: j.match.gaps,
          action: j.match.action,
        }
      : undefined,
  };
}

function renderShortlist(jobs) {
  const el = $("#shortlist");
  if (!el) return;
  shortlistJobsCache = [];
  if (!jobs?.length) {
    el.innerHTML = emptyCard("—");
    bindShortlistActions();
    return;
  }
  el.innerHTML = jobs
    .map((j, idx) => {
      const snap = jobSnapshot(j);
      if (!snap) return "";
      shortlistJobsCache[idx] = snap;
      const score = j.match?.score ?? "—";
      const high = Number(score) >= 70;
      const src =
        j.source === "x"
          ? "X"
          : j.source === "dejob.ai"
            ? "DeJob"
            : j.source || "";
      const summary = j.match?.summary || "";
      const strengths = j.match?.strengths || [];
      const gaps = j.match?.gaps || [];
      return `
      <article class="card job-card" data-idx="${idx}">
        <div class="card-top">
          <div class="job-card-main">
            <h3 class="job-title">${escapeHtml(j.title || "—")}
              <span class="muted">@ ${escapeHtml(j.company || "—")}</span>
            </h3>
            <div class="meta">${[
              j.role_family,
              j.remote_type,
              src,
            ]
              .filter(Boolean)
              .map((x) => escapeHtml(x))
              .join(" · ")}</div>
          </div>
          <div class="score ${high ? "high" : ""}">${escapeHtml(String(score))}${
            j.match?.action
              ? ` · ${escapeHtml(j.match.action)}`
              : ""
          }</div>
        </div>
        ${
          summary || strengths.length || gaps.length
            ? `<div class="body job-card-body">
          ${summary ? `<p class="job-summary">${escapeHtml(summary)}</p>` : ""}
          ${
            strengths.length
              ? `<p class="job-tags ok">${escapeHtml(strengths.join(lang === "en" ? "; " : "；"))}</p>`
              : ""
          }
          ${
            gaps.length
              ? `<p class="job-tags gap">${escapeHtml(gaps.join(lang === "en" ? "; " : "；"))}</p>`
              : ""
          }
        </div>`
            : ""
        }
        <div class="card-actions">
          <a class="btn ghost sm" href="${escapeAttr(
            j.source_url || "#"
          )}" target="_blank" rel="noopener">${escapeHtml(t("btn_open"))}</a>
          <button type="button" class="btn ghost sm" data-action="track" data-idx="${idx}">${escapeHtml(
            t("btn_track")
          )}</button>
          <button type="button" class="btn primary sm" data-action="battle" data-idx="${idx}">${escapeHtml(
            t("btn_battle")
          )}</button>
        </div>
      </article>`;
    })
    .join("");

  bindShortlistActions();
}

let shortlistActionsBound = false;

function trackPayload(job) {
  return {
    job_id: job.id,
    job,
    title: job.title,
    company: job.company,
    source_url: job.source_url,
    source: job.source,
  };
}

async function handleShortlistAction(action, idx, btn) {
  const job = shortlistJobsCache[Number(idx)];
  if (!job || !job.id) {
    toast(
      lang === "zh" ? "岗位数据已失效，请点「重新生成」刷新计划" : "Job data stale — regenerate Plan",
      true
    );
    return;
  }
  if (action === "track") {
    if (btn) btn.disabled = true;
    try {
      const r = await api("/api/applications", {
        method: "POST",
        body: JSON.stringify(trackPayload(job)),
      });
      toast(
        r.created
          ? lang === "zh"
            ? "已加入申请追踪，可到「申请」页查看"
            : "Added — open Tracker tab"
          : t("toast_already")
      );
      if (btn) {
        btn.textContent = t("btn_tracked");
        btn.disabled = true;
      }
      trackerCache = null;
    } catch (err) {
      if (btn) btn.disabled = false;
      toast(err.message || String(err), true);
    }
    return;
  }
  if (action === "battle") {
    if (btn) btn.disabled = true;
    toast(lang === "zh" ? "正在生成作战包…" : "Generating battle pack…");
    try {
      const r = await api("/api/battle-pack", {
        method: "POST",
        body: JSON.stringify({
          ...trackPayload(job),
          lang,
        }),
      });
      if (!r?.pack) {
        toast(lang === "zh" ? "作战包生成失败" : "Battle pack failed", true);
        return;
      }
      showBattlePack(r.pack);
    } catch (err) {
      toast(err.message || String(err), true);
    } finally {
      if (btn) btn.disabled = false;
    }
  }
}

function bindShortlistActions() {
  if (shortlistActionsBound) return;
  shortlistActionsBound = true;
  document.addEventListener(
    "click",
    (e) => {
      const t = e.target;
      if (!(t instanceof Element)) return;
      const btn = t.closest("#shortlist [data-action]");
      if (!btn) return;
      const action = btn.getAttribute("data-action");
      const idx = btn.getAttribute("data-idx");
      if (!action || idx == null || idx === "") return;
      e.preventDefault();
      e.stopPropagation();
      void handleShortlistAction(action, idx, btn);
    },
    true
  );
}

/* —— Phase 1: week plan + tracker —— */
async function loadWeekPlan() {
  try {
    const r = await api("/api/week-plan");
    renderWeekPlan(r.plan, r.progress);
  } catch {
    renderWeekPlan(null, null);
  }
}

function renderWeekPlan(plan, progress) {
  const box = $("#weekTasks");
  const label = $("#weekProgressLabel");
  const fill = $("#weekProgressFill");
  if (!box) return;
  const tasks = plan?.tasks || [];
  const prog = progress || {
    total: tasks.length,
    done: tasks.filter((x) => x.done).length,
    pct: 0,
  };
  if (label) label.textContent = `${prog.done || 0} / ${prog.total || 0}`;
  if (fill) fill.style.width = `${prog.pct || 0}%`;

  if (!tasks.length) {
    box.innerHTML = `<div class="muted" style="padding:8px 0">${escapeHtml(
      t("week_empty")
    )}</div>`;
    return;
  }

  box.innerHTML = tasks
    .map(
      (task) => `
    <label class="week-task ${task.done ? "done" : ""}" data-id="${escapeAttr(
      task.id
    )}">
      <input type="checkbox" ${task.done ? "checked" : ""} />
      <div class="week-task-body">
        <div class="week-task-title">${escapeHtml(task.title)}</div>
        ${
          task.detail
            ? `<div class="week-task-meta">${escapeHtml(
                String(task.detail).slice(0, 160)
              )}</div>`
            : ""
        }
      </div>
      <span class="week-task-type">${escapeHtml(
        taskTypeLabel(task.type || "")
      )}</span>
    </label>`
    )
    .join("");

  box.querySelectorAll(".week-task").forEach((row) => {
    const input = row.querySelector("input");
    input.addEventListener("change", async () => {
      try {
        const r = await api("/api/week-plan/task", {
          method: "POST",
          body: JSON.stringify({
            task_id: row.dataset.id,
            done: input.checked,
          }),
        });
        renderWeekPlan(r.plan, r.progress);
        toast(t("toast_task"));
      } catch (e) {
        toast(e.message, true);
        input.checked = !input.checked;
      }
    });
  });
}

/** 申请页筛选：all | overdue | status 名 */
let trackerFilter = "all";
let trackerCache = null;

function showBattlePack(pack) {
  const modal = $("#battlePackModal");
  if (!pack) {
    toast(lang === "zh" ? "作战包为空" : "Empty battle pack", true);
    return;
  }
  if (!modal) {
    toast(lang === "zh" ? "作战包弹层未找到" : "Battle pack modal missing", true);
    return;
  }
  modal.hidden = false;
  modal.removeAttribute("hidden");
  modal.classList.remove("hidden");
  document.body.classList.add("bp-open");
  $("#bpTitle").textContent = `${pack.title || ""} @ ${pack.company || ""}`;
  const opening = lang === "en" ? pack.opening_en : pack.opening_zh;
  $("#bpBody").innerHTML = `
    <h4>${escapeHtml(t("bp_why"))}</h4>
    <ul>${(pack.why || []).map((x) => `<li>${escapeHtml(x)}</li>`).join("")}</ul>
    <h4>${escapeHtml(t("bp_risks"))}</h4>
    <ul>${(pack.risks || []).map((x) => `<li>${escapeHtml(x)}</li>`).join("")}</ul>
    <h4>${escapeHtml(t("bp_opening"))}</h4>
    <pre>${escapeHtml(opening)}</pre>
    <h4>${escapeHtml(t("bp_bullets"))}</h4>
    <ul>${(pack.bullet_fixes || []).map((x) => `<li>${escapeHtml(x)}</li>`).join("")}</ul>
    <h4>${escapeHtml(t("bp_contact"))}</h4>
    <p>${escapeHtml(pack.contact?.who || "")}</p>
    <div class="link-row">
      <a class="btn-link" href="${escapeAttr(pack.contact?.linkedin_url || "#")}" target="_blank" rel="noopener">LinkedIn</a>
      <a class="btn-link" href="${escapeAttr(pack.contact?.x_url || "#")}" target="_blank" rel="noopener">X</a>
    </div>
    <pre>${escapeHtml(pack.contact?.dm_draft || "")}</pre>
    <h4>${escapeHtml(t("bp_proof"))}</h4>
    <ul>${(pack.proof_items || []).map((x) => `<li>${escapeHtml(x)}</li>`).join("")}</ul>
    <div class="bp-actions">
      <button type="button" class="btn primary sm" id="bpTrack">${escapeHtml(t("btn_track"))}</button>
      <button type="button" class="btn ghost sm" id="bpOutreach">${escapeHtml(t("btn_add_outreach"))}</button>
    </div>
  `;
  $("#bpTrack").onclick = async () => {
    try {
      await api("/api/applications", {
        method: "POST",
        body: JSON.stringify({
          job: {
            id: pack.job_id,
            title: pack.title,
            company: pack.company,
            source_url: pack.source_url,
            match: { score: pack.score },
          },
        }),
      });
      toast(t("toast_tracked"));
    } catch (e) {
      toast(e.message, true);
    }
  };
  $("#bpOutreach").onclick = async () => {
    try {
      await api("/api/outreach", {
        method: "POST",
        body: JSON.stringify({
          company: pack.company,
          who: pack.contact?.who,
          job_title: pack.title,
          linkedin_url: pack.contact?.linkedin_url,
          x_url: pack.contact?.x_url,
          dm_draft: pack.contact?.dm_draft,
          lang,
        }),
      });
      toast(t("toast_tracked"));
    } catch (e) {
      toast(e.message, true);
    }
  };
}

function hideBattlePack() {
  const modal = $("#battlePackModal");
  if (!modal) return;
  modal.hidden = true;
  modal.setAttribute("hidden", "");
  modal.classList.add("hidden");
  document.body.classList.remove("bp-open");
}

async function loadOutreach() {
  const list = $("#outreachList");
  const stats = $("#outreachStats");
  if (!list) return;
  list.innerHTML = emptyCard("…");
  try {
    const r = await api("/api/outreach");
    const items = r.items || [];
    if (stats) {
      stats.innerHTML = `
        <span class="tracker-stat">${escapeHtml(t("tracker_total"))} ${r.total || 0}</span>
        <span class="tracker-stat danger">${escapeHtml(t("tracker_overdue"))} ${r.overdue_count || 0}</span>
        ${Object.entries(r.by_status || {})
          .map(
            ([k, v]) =>
              `<span class="tracker-stat">${escapeHtml(statusLabel(k))} ${v}</span>`
          )
          .join("")}
      `;
    }
    if (!items.length) {
      list.innerHTML = emptyCard(t("outreach_empty"));
      return;
    }
    const statuses = r.statuses || ["todo", "messaged", "replied", "referred"];
    list.innerHTML = items
      .map((c) => {
        const follow = (c.next_follow_up_at || "").slice(0, 10);
        return `
      <article class="tracker-card ${c.overdue ? "overdue" : ""}" data-id="${escapeAttr(c.id)}">
        <div class="tracker-card-top">
          <div>
            <h3>${escapeHtml(c.company)} · ${escapeHtml(c.who)}</h3>
            <div class="meta">${c.overdue ? "⚠ " : ""}${escapeHtml(statusLabel(c.status))}
              ${c.job_title ? " · " + escapeHtml(c.job_title) : ""}
            </div>
          </div>
        </div>
        ${c.dm_draft ? `<pre style="font-size:12px;white-space:pre-wrap;margin:0 0 10px">${escapeHtml(c.dm_draft)}</pre>` : ""}
        <div class="tracker-fields">
          <label>${escapeHtml(t("tracker_status"))}
            <select class="or-status">
              ${statuses
                .map(
                  (s) =>
                    `<option value="${escapeAttr(s)}" ${s === c.status ? "selected" : ""}>${escapeHtml(statusLabel(s))}</option>`
                )
                .join("")}
            </select>
          </label>
          <label>${escapeHtml(t("tracker_follow"))}
            <input type="date" class="or-follow" value="${escapeAttr(follow)}" />
          </label>
          <button type="button" class="btn primary sm or-save">${escapeHtml(t("tracker_save"))}</button>
        </div>
      </article>`;
      })
      .join("");
    list.querySelectorAll(".tracker-card").forEach((card) => {
      card.querySelector(".or-save").addEventListener("click", async () => {
        try {
          await api("/api/outreach/" + encodeURIComponent(card.dataset.id), {
            method: "PATCH",
            body: JSON.stringify({
              status: card.querySelector(".or-status").value,
              next_follow_up_at: card.querySelector(".or-follow").value || null,
              lang,
            }),
          });
          toast(t("toast_task"));
          loadOutreach();
        } catch (e) {
          toast(e.message, true);
        }
      });
    });
  } catch (e) {
    list.innerHTML = emptyCard(e.message);
  }
}

async function loadTracker(keepFilter = true) {
  const list = $("#trackerList");
  const stats = $("#trackerStats");
  if (!list) return;
  list.innerHTML = emptyCard("…");
  try {
    const r = await api("/api/applications");
    trackerCache = r;
    if (!keepFilter) trackerFilter = "all";
    renderTrackerUI(r);
  } catch (e) {
    list.innerHTML = emptyCard(e.message);
  }
}

function renderTrackerUI(r) {
  const list = $("#trackerList");
  const stats = $("#trackerStats");
  if (!list || !r) return;

  const allItems = r.items || [];
  const statuses = r.statuses || [
    "interested",
    "applied",
    "interviewing",
    "offer",
    "rejected",
    "ghosted",
    "withdrawn",
  ];

  // 顶部筛选芯片（可点击）
  if (stats) {
    const chips = [
      {
        key: "all",
        label: `${t("tracker_total")} ${r.total || 0}`,
        danger: false,
      },
      {
        key: "overdue",
        label: `${t("tracker_overdue")} ${r.overdue_count || 0}`,
        danger: true,
      },
      ...Object.entries(r.by_status || {}).map(([k, v]) => ({
        key: `status:${k}`,
        label: `${statusLabel(k)} ${v}`,
        danger: false,
      })),
    ];
    stats.innerHTML = chips
      .map((c) => {
        const on =
          trackerFilter === c.key ||
          (c.key.startsWith("status:") && trackerFilter === c.key);
        return `<button type="button" class="tracker-stat ${
          c.danger ? "danger" : ""
        } ${on ? "on" : ""}" data-filter="${escapeAttr(c.key)}">${escapeHtml(
          c.label
        )}</button>`;
      })
      .join("");

    stats.querySelectorAll("[data-filter]").forEach((btn) => {
      btn.addEventListener("click", () => {
        trackerFilter = btn.getAttribute("data-filter") || "all";
        renderTrackerUI(trackerCache || r);
      });
    });
  }

  // 按筛选过滤列表
  let items = allItems;
  if (trackerFilter === "overdue") {
    items = allItems.filter((a) => a.overdue);
  } else if (trackerFilter.startsWith("status:")) {
    const st = trackerFilter.slice("status:".length);
    items = allItems.filter((a) => a.status === st);
  }

  if (!allItems.length) {
    list.innerHTML = emptyCard(t("tracker_empty"));
    return;
  }
  if (!items.length) {
    list.innerHTML = emptyCard(t("tracker_filter_empty"));
    return;
  }

  list.innerHTML = items
    .map((a) => {
      const follow = (a.next_follow_up_at || "").slice(0, 10);
      const overdueMark =
        a.overdue
          ? lang === "zh"
            ? "⚠ 逾期 · "
            : "⚠ overdue · "
          : "";
      return `
      <article class="tracker-card ${a.overdue ? "overdue" : ""}" data-id="${escapeAttr(
        a.id
      )}">
        <div class="tracker-card-top">
          <div>
            <h3>${escapeHtml(a.display_title || a.title || "—")}
              <span class="muted">@ ${escapeHtml(
                a.display_company || a.company || "—"
              )}</span>
            </h3>
            <div class="meta">
              ${overdueMark}
              ${escapeHtml(statusLabel(a.status || ""))}
              ${a.score != null ? ` · ${a.score}` : ""}
              ${
                a.display_url
                  ? ` · <a href="${escapeAttr(
                      a.display_url
                    )}" target="_blank" rel="noopener">${escapeHtml(
                      t("btn_open")
                    )}</a>`
                  : ""
              }
            </div>
          </div>
        </div>
        <div class="tracker-fields">
          <label>${escapeHtml(t("tracker_status"))}
            <select class="trk-status">
              ${statuses
                .map(
                  (s) =>
                    `<option value="${escapeAttr(s)}" ${
                      s === a.status ? "selected" : ""
                    }>${escapeHtml(statusLabel(s))}</option>`
                )
                .join("")}
            </select>
          </label>
          <label>${escapeHtml(t("tracker_follow"))}
            <input type="date" class="trk-follow" value="${escapeAttr(follow)}" />
          </label>
          <button type="button" class="btn primary sm trk-save">${escapeHtml(
            t("tracker_save")
          )}</button>
        </div>
      </article>`;
    })
    .join("");

  list.querySelectorAll(".tracker-card").forEach((card) => {
    card.querySelector(".trk-save").addEventListener("click", async () => {
      try {
        const status = card.querySelector(".trk-status").value;
        const next_follow_up_at =
          card.querySelector(".trk-follow").value || null;
        await api("/api/applications/" + encodeURIComponent(card.dataset.id), {
          method: "PATCH",
          body: JSON.stringify({ status, next_follow_up_at }),
        });
        toast(t("toast_task"));
        loadTracker(true);
      } catch (e) {
        toast(e.message, true);
      }
    });
  });
}

function renderEventCards(el, events, recommended) {
  if (!el) return;
  if (!events?.length) {
    el.innerHTML = emptyCard("—");
    return;
  }
  el.innerHTML = events
    .map((e) => {
      const when = e.start_at
        ? new Date(e.start_at).toLocaleString()
        : "—";
      const high = (e.relevance_score || 0) >= 55;
      return `
    <article class="card">
      <div class="card-top">
        <div>
          <h3>${escapeHtml(e.title)}</h3>
          <div class="meta">${escapeHtml(e.city || "?")} · ${escapeHtml(
        e.event_type
      )} · ${escapeHtml(when)}</div>
        </div>
        <div class="score ${high ? "high" : ""}">${e.relevance_score ?? "—"}</div>
      </div>
      <div class="body">
        ${escapeHtml(e.why_attend || "")}<br/>
        ${escapeHtml((e.description || "").slice(0, 160))}<br/>
        <a href="${escapeAttr(
          e.url
        )}" target="_blank" rel="noopener">${escapeHtml(t("btn_open"))}</a>
      </div>
    </article>`;
    })
    .join("");
}

async function loadAutoEvents() {
  $("#eventList").innerHTML = emptyCard("…");
  try {
    const r = await api("/api/path");
    if (r.path?.events?.length) {
      renderEventCards($("#eventList"), r.path.events, true);
      return;
    }
    const st = await api("/api/pipeline/status");
    if (st.path?.events) renderEventCards($("#eventList"), st.path.events, true);
    else if (st.events) renderEventCards($("#eventList"), st.events, true);
    else $("#eventList").innerHTML = emptyCard("—");
  } catch (e) {
    toast(e.message, true);
  }
}

async function refreshPipeline(poll = false) {
  try {
    const st = await api("/api/pipeline/status");
    setPipelineUI(st);
    const od = st.tracker?.overdue_count || 0;
    if (od) {
      $("#topMeta").textContent = `plan · overdue ${od}`;
    } else if (st.shortlist_count) {
      $("#topMeta").textContent = `plan · ${st.shortlist_count}`;
    } else if (st.week_progress?.total) {
      $("#topMeta").textContent = `week · ${st.week_progress.done}/${st.week_progress.total}`;
    }
    if (st.status === "running" && poll) startPoll();
    if (st.status === "done" || st.status === "error") {
      stopPoll();
      if (st.status === "done") loadWeekPlan();
    }
  } catch {
    /* */
  }
}

function startPoll() {
  stopPoll();
  pollTimer = setInterval(() => refreshPipeline(false), 2000);
}
function stopPoll() {
  if (pollTimer) clearInterval(pollTimer);
  pollTimer = null;
}

async function bootApp() {
  meta = await api("/api/meta");
  const tz = $("#timezoneSelect");
  tz.innerHTML = meta.timezones
    .map((x) => `<option value="${x}">${x}</option>`)
    .join("");
  renderAllChips();
  renderSteps();
  goStep(0);
  applyI18n();

  try {
    const me = await api("/api/auth/me");
    if (me.user) {
      $("#userPill").textContent = me.user.short || me.user.address || "";
      if (me.user.portalUrl) {
        const note = document.getElementById("topMeta");
        if (note && !note.dataset.portal) {
          note.dataset.portal = "1";
          note.title = me.user.portalUrl;
        }
      }
    }
  } catch {
    /* */
  }

  try {
    const r = await api("/api/profile");
    const profile = r.profile;
    if (
      profile?.setup_completed ||
      profile?.display_name ||
      profile?.resume_text ||
      r.structured_resume?.name
    ) {
      profileToForm(profile, r.structured_resume);
    }
  } catch {
    /* */
  }

  await refreshPipeline(true);
  await loadWeekPlan();
  const st = await api("/api/pipeline/status").catch(() => ({}));
  if (st.pipeline?.status === "running" || st.status === "running") {
    switchView("report");
    startPoll();
  } else if (st.path) {
    renderPath(st.path);
  }
}

async function init() {
  bindLangSwitch();
  applyI18n();
  bindAuth();

  if (await tryPortalAutoLogin()) {
    // handled
  } else if (!token()) {
    showAuth(true);
  } else {
    try {
      const me = await api("/api/auth/me");
      if (!me.user) {
        setToken("");
        showAuth(true);
      } else {
        $("#userPill").textContent = me.user.short || me.user.address || "";
        showAuth(false);
        await bootApp();
      }
    } catch {
      setToken("");
      showAuth(true);
    }
  }

  $("#btnPrev").onclick = () => goStep(step - 1);
  $("#btnNext").onclick = () => goStep(step + 1);

  $("#btnSave").onclick = async () => {
    try {
      const profile = formToProfile();
      if (!profile.target_titles.length && !profile.primary_role) {
        toast(t("toast_titles"), true);
        return;
      }
      if (!profile.resume_text && !profile.summary && !profile.skills.length) {
        toast(t("toast_resume"), true);
        return;
      }
      if (!profile.event_cities.length && profile.location_pref.cities.length) {
        profile.event_cities = [...profile.location_pref.cities];
      }

      switchView("report");
      setPipelineUI({
        status: "running",
        message: t("path_building"),
        progress: 8,
      });
      startPoll();

      await api("/api/profile", {
        method: "POST",
        body: JSON.stringify({ profile, auto_search: true, lang }),
      });
      cachedProfile = profile;
      toast(t("toast_started"));
      setTimeout(() => refreshPipeline(true), 600);
    } catch (e) {
      toast(e.message, true);
      stopPoll();
    }
  };

  $("#btnExample").onclick = async () => {
    const r = await api("/api/profile/example", {
      method: "POST",
      body: "{}",
    });
    profileToForm(r.profile, r.structured_resume);
    toast(t("toast_example"));
  };

  $("#btnLoad").onclick = async () => {
    const r = await api("/api/profile");
    profileToForm(r.profile, r.structured_resume);
    toast(t("toast_loaded"));
  };

  document.querySelectorAll(".nav-btn").forEach((b) => {
    b.addEventListener("click", () => switchView(b.dataset.view));
  });

  $("#btnEditSetup").onclick = () => switchView("setup");

  $("#btnRerun").onclick = async () => {
    setPipelineUI({
      status: "running",
      message: t("path_building"),
      progress: 5,
    });
    startPoll();
    try {
      const r = await api("/api/pipeline/run", {
        method: "POST",
        body: JSON.stringify({ lang }),
      });
      setPipelineUI({
        ...r.status,
        path: r.path,
        shortlist: r.shortlist,
      });
      if (r.path) renderPath(r.path);
      await loadWeekPlan();
      stopPoll();
    } catch (e) {
      toast(e.message, true);
      stopPoll();
    }
  };

  const btnWeek = $("#btnRebuildWeek");
  if (btnWeek) {
    btnWeek.onclick = async () => {
      try {
        const r = await api("/api/week-plan/rebuild", {
          method: "POST",
          body: JSON.stringify({ lang }),
        });
        renderWeekPlan(r.plan, r.progress);
        toast(t("toast_week"));
      } catch (e) {
        toast(e.message, true);
      }
    };
  }

  const btnTrk = $("#btnRefreshTracker");
  if (btnTrk) {
    btnTrk.onclick = () => loadTracker();
  }
  const btnOr = $("#btnRefreshOutreach");
  if (btnOr) {
    btnOr.onclick = () => loadOutreach();
  }

  document.querySelectorAll(".tracker-tab").forEach((tab) => {
    tab.addEventListener("click", () => {
      document.querySelectorAll(".tracker-tab").forEach((x) => x.classList.remove("on"));
      tab.classList.add("on");
      const which = tab.dataset.tab;
      const apps = $("#appsPane");
      const or = $("#outreachPane");
      if (which === "outreach") {
        if (apps) {
          apps.classList.add("hidden");
          apps.hidden = true;
        }
        if (or) {
          or.classList.remove("hidden");
          or.hidden = false;
        }
        loadOutreach();
      } else {
        if (or) {
          or.classList.add("hidden");
          or.hidden = true;
        }
        if (apps) {
          apps.classList.remove("hidden");
          apps.hidden = false;
        }
        loadTracker();
      }
    });
  });

  const bpClose = $("#bpClose");
  const bpBd = $("#bpBackdrop");
  if (bpClose) bpClose.onclick = hideBattlePack;
  if (bpBd) bpBd.onclick = hideBattlePack;
}

init().catch(console.error);
