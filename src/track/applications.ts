/**
 * 申请追踪 — shortlist 一键加入、状态、跟进日、逾期
 */
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import type { Application, ApplicationStatus, Job } from "../types.js";
import {
  loadApplications,
  saveApplication,
  loadJobs,
} from "../store/fs-store.js";
import { dataDir } from "../paths.js";

export const TRACKER_STATUSES: ApplicationStatus[] = [
  "interested",
  "applied",
  "interviewing",
  "offer",
  "rejected",
  "ghosted",
  "withdrawn",
];

export function listTrackerApps(): Application[] {
  return loadApplications().sort((a, b) => {
    const af = a.next_follow_up_at || "9999";
    const bf = b.next_follow_up_at || "9999";
    if (af !== bf) return af.localeCompare(bf);
    return (b.updated_at || "").localeCompare(a.updated_at || "");
  });
}

export function getApplication(id: string): Application | null {
  return loadApplications().find((a) => a.id === id) || null;
}

export function isOverdue(app: Application, now = new Date()): boolean {
  if (!app.next_follow_up_at) return false;
  if (
    app.status === "offer" ||
    app.status === "rejected" ||
    app.status === "withdrawn" ||
    app.status === "ghosted"
  ) {
    return false;
  }
  const t = Date.parse(app.next_follow_up_at);
  if (Number.isNaN(t)) return false;
  return t < now.getTime();
}

export function enrichApp(app: Application): Application & {
  overdue: boolean;
  display_title: string;
  display_company: string;
  display_url: string;
} {
  const jobs = loadJobs();
  const j = jobs.find((x) => x.id === app.job_id);
  return {
    ...app,
    overdue: isOverdue(app),
    display_title: app.title || j?.title || app.job_id,
    display_company: app.company || j?.company || "—",
    display_url: app.source_url || j?.source_url || "",
  };
}

/** 从 shortlist / Job 加入追踪 */
export function addFromJob(
  job: Partial<Job> & { id: string; title?: string; company?: string },
  opts?: { status?: ApplicationStatus; follow_up_days?: number; notes?: string }
): { app: Application; created: boolean } {
  const existing = loadApplications().find((a) => a.job_id === job.id);
  if (existing) {
    return { app: existing, created: false };
  }
  const now = new Date();
  const status = opts?.status || "interested";
  const days = opts?.follow_up_days ?? 3;
  const follow = new Date(now.getTime() + days * 86400000);
  const followStr = follow.toISOString().slice(0, 10);

  const app: Application = {
    id: `app_${crypto.randomBytes(6).toString("hex")}`,
    job_id: job.id,
    status,
    created_at: now.toISOString(),
    updated_at: now.toISOString(),
    timeline: [{ at: now.toISOString(), status, note: "加入追踪" }],
    materials_paths: [],
    next_follow_up_at: followStr,
    company: job.company,
    title: job.title,
    source_url: job.source_url,
    score: job.match?.score,
    source: job.source,
    notes: opts?.notes,
  };
  saveApplication(app);
  return { app, created: true };
}

export function addFromShortlistPayload(body: {
  job_id?: string;
  job?: Partial<Job> & { id?: string };
  status?: ApplicationStatus;
  follow_up_days?: number;
  notes?: string;
}): { app: Application; created: boolean } | { error: string } {
  const jobs = loadJobs();
  let job: (Partial<Job> & { id: string }) | undefined;

  if (body.job?.id) {
    job = { ...body.job, id: body.job.id } as Partial<Job> & { id: string };
    const fromStore = jobs.find((j) => j.id === body.job!.id);
    if (fromStore) job = { ...fromStore, ...job };
  } else if (body.job_id) {
    const fromStore = jobs.find((j) => j.id === body.job_id);
    if (fromStore) job = fromStore;
    else if (body.job) {
      job = { ...body.job, id: body.job_id } as Partial<Job> & { id: string };
    } else {
      return { error: "找不到该岗位，请带上 job 快照字段" };
    }
  } else {
    return { error: "需要 job_id 或 job.id" };
  }

  return addFromJob(job, {
    status: body.status,
    follow_up_days: body.follow_up_days,
    notes: body.notes,
  });
}

export function patchApplication(
  id: string,
  patch: {
    status?: ApplicationStatus;
    next_follow_up_at?: string | null;
    notes?: string;
    outcome?: string;
    outcome_notes?: string;
  }
): Application | null {
  const app = getApplication(id);
  if (!app) return null;
  const now = new Date().toISOString();
  if (patch.status && patch.status !== app.status) {
    app.status = patch.status;
    app.timeline = app.timeline || [];
    app.timeline.push({ at: now, status: patch.status, note: "状态更新" });
  }
  if (patch.next_follow_up_at === null) {
    delete app.next_follow_up_at;
  } else if (typeof patch.next_follow_up_at === "string") {
    app.next_follow_up_at = patch.next_follow_up_at;
  }
  if (patch.notes !== undefined) app.notes = patch.notes;
  if (patch.outcome !== undefined) app.outcome = patch.outcome;
  if (patch.outcome_notes !== undefined) app.outcome_notes = patch.outcome_notes;
  app.updated_at = now;
  saveApplication(app);
  return app;
}

export function deleteApplication(id: string): boolean {
  const apps = loadApplications();
  const app = apps.find((a) => a.id === id);
  if (!app) return false;
  // 勿调用 appDir（会 mkdir）
  const d = path.join(dataDir(), "applications", app.id);
  const meta = path.join(d, "meta.json");
  if (!fs.existsSync(meta)) return false;
  fs.rmSync(d, { recursive: true, force: true });
  return true;
}

export function trackerSummary() {
  const apps = listTrackerApps().map(enrichApp);
  const overdue = apps.filter((a) => a.overdue);
  const byStatus: Record<string, number> = {};
  for (const a of apps) {
    byStatus[a.status] = (byStatus[a.status] || 0) + 1;
  }
  return {
    total: apps.length,
    overdue_count: overdue.length,
    by_status: byStatus,
    overdue: overdue.slice(0, 10),
    items: apps,
  };
}
