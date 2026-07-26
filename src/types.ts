/** 职块 Job Block — 领域类型 */

export type RoleFamily =
  | "BD"
  | "Community"
  | "Research"
  | "Security"
  | "Product"
  | "Engineering"
  | "Other";

export type SeniorityLevel =
  | "junior"
  | "mid"
  | "senior"
  | "lead"
  | "executive"
  | "";

export type AlertFrequency = "daily" | "weekly" | "high_only" | "off";

export type ApplicationStatus =
  | "new"
  | "ranked"
  | "evaluating"
  | "prepared"
  | "applied"
  | "interviewing"
  | "offer"
  | "rejected"
  | "ghosted"
  | "withdrawn";

export type MatchAction = "apply" | "maybe" | "skip";

/**
 * 用户输入源 1–13 结构化画像
 * 1 目标岗位  2 简历  3 地区/远程  4 赛道  5 薪资补偿
 * 6 deal-breaker  7 语言  8 年限级别  9 亮点  10 公司类型
 * 11 时区  12 保密观望  13 活动城市
 */
export interface Profile {
  display_name: string;

  /** ① 真正想找的岗位 title（可多条） */
  target_titles: string[];
  /** ① 角色线 */
  primary_role: RoleFamily;
  secondary_roles: RoleFamily[];

  /** ② 简历原文（匹配与 tailor 主依据） */
  resume_text: string;

  /** ⑧ 年限 + 级别 */
  experience_years: number;
  level: SeniorityLevel;

  /** ⑦ 语言 */
  languages: string[];

  summary: string;
  /** ⑨ 亮点 */
  highlights: string[];
  skills: string[];

  /** ③ 地区 / 工作方式 */
  location_pref: {
    cities: string[];
    remote_ok: boolean;
    hybrid_ok: boolean;
    onsite_ok: boolean;
  };

  /** ⑤ 薪资与补偿 */
  comp_pref: {
    min_base_fiat?: number;
    currency?: string;
    token_ok: boolean;
    token_only_ok: boolean;
    equity_ok: boolean;
  };

  /** ④ 赛道 */
  sectors_whitelist: string[];
  sectors_blacklist: string[];

  /** ⑥ 硬性否决 */
  deal_breakers: string[];

  /** ⑩ 目标公司类型 */
  company_types: string[];

  /** ⑪ 时区 */
  timezone: string;

  /** ⑫ 在职观望 / 保密模式 */
  discrete_mode: boolean;
  /** ⑫ 连带：推送频率 */
  alert_frequency: AlertFrequency;

  /** ⑬ 线下 networking 城市（可与求职城市不同） */
  event_cities: string[];

  /** 角色扩展自由字段 */
  role_extensions: Record<string, string | string[] | number | boolean>;
  writing_style?: string;
  updated_at: string;
  /** setup 完成标记 */
  setup_completed?: boolean;
}

export interface Job {
  id: string;
  source: "web3.career" | "dejob.ai" | "telegram" | "paste" | "x" | "other";
  source_url: string;
  scraped_at: string;
  company: string;
  title: string;
  role_family: RoleFamily;
  description_raw: string;
  description_clean: string;
  location: string;
  remote_type: "remote" | "hybrid" | "onsite" | "unknown";
  comp_hint: string;
  tags: string[];
  posted_at?: string;
  legitimacy_flags: string[];
  match?: MatchResult;
}

export interface MatchResult {
  score: number;
  action: MatchAction;
  dimensions: Record<string, number>;
  strengths: string[];
  gaps: string[];
  concerns: string[];
  summary: string;
  ranked_at: string;
  method: "llm" | "rules" | "hybrid";
}

export interface Application {
  id: string;
  job_id: string;
  status: ApplicationStatus;
  created_at: string;
  updated_at: string;
  timeline: { at: string; status: ApplicationStatus; note?: string }[];
  eval_path?: string;
  materials_paths: string[];
  outcome?: string;
  outcome_notes?: string;
}

export interface EventItem {
  id: string;
  title: string;
  city: string;
  country?: string;
  venue?: string;
  start_at?: string;
  end_at?: string;
  timezone?: string;
  event_type: string;
  sectors: string[];
  url: string;
  host?: string;
  description: string;
  relevance_score?: number;
  why_attend?: string;
  invite_only?: boolean;
  source: "luma" | "paste" | "seed";
}

export interface RankOptions {
  topRecall?: number;
  topShow?: number;
  minScore?: number;
}
