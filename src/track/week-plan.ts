/**
 * 本周任务板 — 从 CareerPath / Tracker 生成，可勾选
 */
import crypto from "node:crypto";
import fs from "node:fs";
import type { WeekPlan, WeekTask, WeekTaskType } from "../types.js";
import { ensureDataDirs, files } from "../paths.js";
import { loadCareerPath, type CareerPath } from "../pipeline/path.js";
import { listTrackerApps, isOverdue } from "./applications.js";
import { listOutreach, isOutreachOverdue } from "./outreach.js";

export function weekStartMonday(d = new Date()): string {
  const x = new Date(d);
  const day = x.getDay(); // 0 Sun
  const diff = day === 0 ? -6 : 1 - day;
  x.setDate(x.getDate() + diff);
  x.setHours(0, 0, 0, 0);
  return x.toISOString().slice(0, 10);
}

export function loadWeekPlan(): WeekPlan | null {
  ensureDataDirs();
  const p = files.weekPlan();
  if (!fs.existsSync(p)) return null;
  try {
    return JSON.parse(fs.readFileSync(p, "utf8")) as WeekPlan;
  } catch {
    return null;
  }
}

export function saveWeekPlan(plan: WeekPlan): void {
  ensureDataDirs();
  fs.writeFileSync(files.weekPlan(), JSON.stringify(plan, null, 2), "utf8");
}

function task(
  type: WeekTaskType,
  title: string,
  order: number,
  extra?: Partial<WeekTask>
): WeekTask {
  return {
    id: `t_${crypto.randomBytes(4).toString("hex")}`,
    type,
    title,
    order,
    done: false,
    ...extra,
  };
}

/**
 * 根据当前路径 + 追踪记录生成本周任务。
 * 若同周已有 plan 且 keepDone=true，合并已完成状态（按 title+type 或 ref_id）。
 */
export function buildWeekPlan(opts?: {
  path?: CareerPath | null;
  keepDone?: boolean;
  lang?: "zh" | "en";
}): WeekPlan {
  const path = opts?.path ?? loadCareerPath();
  const lang =
    opts?.lang === "en" || path?.lang === "en" ? "en" : "zh";
  const L = (zh: string, en: string) => (lang === "en" ? en : zh);
  const prev = loadWeekPlan();
  const week_start = weekStartMonday();
  const tasks: WeekTask[] = [];
  let order = 1;

  // 1) 投递：shortlist 前 3
  const jobs = path?.shortlist?.slice(0, 3) || [];
  for (const j of jobs) {
    tasks.push(
      task(
        "apply",
        `${L("投递", "Apply")}: ${j.title} @ ${j.company}`,
        order++,
        {
          detail: j.source_url,
          ref_id: j.id,
        }
      )
    );
  }
  if (!jobs.length) {
    tasks.push(
      task(
        "apply",
        L("生成计划后投递至少 1 个优先岗", "Apply to ≥1 priority role after Plan"),
        order++,
        {
          detail: L("完成设置并重新生成路径", "Finish Setup and regenerate path"),
        }
      )
    );
  }

  // 2) 触达：contacts 前 2
  const contacts = path?.contacts?.slice(0, 2) || [];
  for (const c of contacts) {
    tasks.push(
      task(
        "outreach",
        `${L("联系", "Reach")}: ${c.company} · ${c.who}`,
        order++,
        {
          detail: c.linkedin_url || c.x_url,
          ref_id: `${c.company}|${c.job_title}`,
        }
      )
    );
  }

  // 3) 活动：1 场
  const ev = path?.events?.[0];
  if (ev) {
    tasks.push(
      task(
        "event",
        `${L("处理活动", "Event")}: ${ev.title}`,
        order++,
        {
          detail: `${ev.city || ""} · ${ev.url || ""}`.trim(),
          ref_id: ev.id,
        }
      )
    );
  }

  // 4) 提升：第一条 improve
  const imp = path?.improve?.[0];
  if (imp && typeof imp === "object" && "title" in imp) {
    tasks.push(
      task("improve", `${L("提升", "Improve")}: ${imp.title}`, order++, {
        detail: (imp.steps || []).slice(0, 2).join(" → "),
        ref_id: imp.title,
      })
    );
  } else if (typeof imp === "string") {
    tasks.push(task("improve", `${L("提升", "Improve")}: ${imp}`, order++));
  }

  // 5) 贡献 / 存在感（挂 shortlist 公司或活动）
  const contributeTargets = [
    ...jobs.slice(0, 2).map((j) => ({
      title: L(
        `存在感：在 X/社区互动 ${j.company}`,
        `Visibility: engage ${j.company} on X/community`
      ),
      ref: j.id,
      detail: j.company,
    })),
    ...(path?.events?.[0]
      ? [
          {
            title: L(
              `会前准备：${path.events[0].title}`,
              `Event prep: ${path.events[0].title}`
            ),
            ref: path.events[0].id,
            detail: path.events[0].url,
          },
        ]
      : []),
  ].slice(0, 2);
  for (const c of contributeTargets) {
    tasks.push(
      task("contribute", c.title, order++, {
        detail: c.detail,
        ref_id: c.ref,
      })
    );
  }

  // 6) 跟进逾期（申请 + 触达）
  const overdue = listTrackerApps().filter((a) => isOverdue(a));
  const overdueOr = listOutreach().filter((c) => isOutreachOverdue(c));
  if (overdue.length || overdueOr.length) {
    const n = overdue.length + overdueOr.length;
    tasks.push(
      task(
        "followup",
        L(`清理 ${n} 条逾期跟进`, `Clear ${n} overdue follow-up(s)`),
        order++,
        {
          detail: [
            ...overdue.slice(0, 2).map((a) => a.title || a.job_id),
            ...overdueOr.slice(0, 2).map((c) => `${c.company}·${c.who}`),
          ].join(" · "),
          ref_id: "overdue",
        }
      )
    );
  }

  // 合并同周已完成
  if (
    opts?.keepDone !== false &&
    prev &&
    prev.week_start === week_start &&
    prev.tasks?.length
  ) {
    const doneMap = new Map<string, WeekTask>();
    for (const t of prev.tasks) {
      if (t.done) {
        doneMap.set(`${t.type}|${t.ref_id || t.title}`, t);
      }
    }
    for (const t of tasks) {
      const key = `${t.type}|${t.ref_id || t.title}`;
      const old = doneMap.get(key);
      if (old?.done) {
        t.done = true;
        t.done_at = old.done_at;
      }
    }
  }

  const plan: WeekPlan = {
    week_id: `w_${week_start}`,
    week_start,
    generated_at: new Date().toISOString(),
    tasks,
    note: path
      ? `${L("来自计划", "From Plan")} · ${path.headline || ""}`.slice(0, 120)
      : L("暂无路径，完成设置后生成", "No path yet — finish Setup first"),
  };
  saveWeekPlan(plan);
  return plan;
}

export function toggleWeekTask(
  taskId: string,
  done?: boolean
): WeekPlan | null {
  const plan = loadWeekPlan();
  if (!plan) return null;
  const t = plan.tasks.find((x) => x.id === taskId);
  if (!t) return null;
  const next = done === undefined ? !t.done : Boolean(done);
  t.done = next;
  t.done_at = next ? new Date().toISOString() : undefined;
  plan.generated_at = plan.generated_at; // keep
  saveWeekPlan(plan);
  return plan;
}

export function weekPlanProgress(plan: WeekPlan | null) {
  if (!plan?.tasks?.length) {
    return { total: 0, done: 0, pct: 0 };
  }
  const total = plan.tasks.length;
  const done = plan.tasks.filter((t) => t.done).length;
  return {
    total,
    done,
    pct: Math.round((done / total) * 100),
  };
}

/** Agent / 网页：周状态摘要（P2-7 含触达逾期） */
export function weekStatusPayload() {
  const plan = loadWeekPlan();
  const progress = weekPlanProgress(plan);
  const apps = listTrackerApps();
  const overdue = apps.filter((a) => isOverdue(a));
  const outreach = listOutreach();
  const overdueOutreach = outreach.filter((c) => isOutreachOverdue(c));
  const path = loadCareerPath();
  return {
    week_plan: plan,
    progress,
    applications: {
      total: apps.length,
      overdue_count: overdue.length,
      applied: apps.filter((a) =>
        ["applied", "interviewing", "offer"].includes(a.status)
      ).length,
    },
    outreach: {
      total: outreach.length,
      overdue_count: overdueOutreach.length,
      messaged: outreach.filter((c) => c.status === "messaged").length,
    },
    has_path: Boolean(path),
    path_headline: path?.headline || null,
    open_tasks: (plan?.tasks || []).filter((t) => !t.done).slice(0, 8),
    overdue_apps: overdue.slice(0, 5).map((a) => ({
      id: a.id,
      title: a.title || a.job_id,
      company: a.company,
      next_follow_up_at: a.next_follow_up_at,
      status: a.status,
    })),
    overdue_outreach: overdueOutreach.slice(0, 5).map((c) => ({
      id: c.id,
      company: c.company,
      who: c.who,
      next_follow_up_at: c.next_follow_up_at,
      status: c.status,
    })),
  };
}
