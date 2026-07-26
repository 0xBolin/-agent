import type { Application, ApplicationStatus } from "../types.js";
import {
  loadApplications,
  saveApplication,
  loadJobs,
} from "../store/fs-store.js";
import { files } from "../paths.js";

export function listApplications(): Application[] {
  return loadApplications();
}

export function formatTracker(): string {
  const apps = loadApplications();
  const jobs = loadJobs();
  const map = new Map(jobs.map((j) => [j.id, j]));
  if (!apps.length) {
    return `暂无申请记录。完成 /eval 或 /tailor 后会自动写入。\nCSV: ${files.tracker()}`;
  }
  const lines = apps.map((a) => {
    const j = map.get(a.job_id);
    return [
      `- [${a.status}] ${j?.title || a.job_id} @ ${j?.company || "?"}`,
      `  score=${j?.match?.score ?? "—"} · updated ${a.updated_at}`,
      `  id=${a.id}`,
      a.outcome ? `  outcome=${a.outcome} ${a.outcome_notes || ""}` : null,
    ]
      .filter(Boolean)
      .join("\n");
  });
  return lines.join("\n\n") + `\n\nCSV → ${files.tracker()}`;
}

export function updateStatus(
  appId: string,
  status: ApplicationStatus,
  note?: string
): Application | null {
  const apps = loadApplications();
  const app = apps.find(
    (a) => a.id === appId || a.id.includes(appId) || a.job_id === appId
  );
  if (!app) return null;
  const now = new Date().toISOString();
  app.status = status;
  app.updated_at = now;
  app.timeline.push({ at: now, status, note });
  saveApplication(app);
  return app;
}

export function recordOutcome(
  appId: string,
  outcome: string,
  notes?: string
): Application | null {
  const apps = loadApplications();
  const app = apps.find(
    (a) => a.id === appId || a.id.includes(appId) || a.job_id === appId
  );
  if (!app) return null;
  const now = new Date().toISOString();
  const statusMap: Record<string, ApplicationStatus> = {
    interview: "interviewing",
    interviewing: "interviewing",
    offer: "offer",
    rejected: "rejected",
    ghosted: "ghosted",
    withdrawn: "withdrawn",
    applied: "applied",
  };
  const st = statusMap[outcome.toLowerCase()] || app.status;
  app.status = st;
  app.outcome = outcome;
  app.outcome_notes = notes;
  app.updated_at = now;
  app.timeline.push({ at: now, status: st, note: `outcome:${outcome}` });
  saveApplication(app);
  return app;
}

export function calibrationHints(): string[] {
  const apps = loadApplications();
  const jobs = loadJobs();
  const map = new Map(jobs.map((j) => [j.id, j]));
  const hints: string[] = [];
  const withOutcome = apps.filter((a) => a.outcome);
  if (withOutcome.length < 3) {
    hints.push("积累至少 3 条 outcome 后再自动校准权重（当前偏少）。");
    return hints;
  }
  for (const a of withOutcome) {
    const score = map.get(a.job_id)?.match?.score ?? 0;
    const o = (a.outcome || "").toLowerCase();
    if (score >= 85 && (o.includes("reject") || o === "rejected")) {
      hints.push(
        `高分却被拒: ${map.get(a.job_id)?.title} — 检查是否高估 skills 或 level。`
      );
    }
    if (score > 0 && score < 70 && (o.includes("interview") || o === "offer")) {
      hints.push(
        `低分却进面/拿 offer: ${map.get(a.job_id)?.title} — 可提高该角色赛道权重。`
      );
    }
  }
  if (!hints.length) hints.push("暂无显著偏差，保持当前权重即可。");
  return hints;
}
