import fs from "node:fs";
import path from "node:path";
import YAML from "yaml";
import type { Application, EventItem, Job, Profile } from "../types.js";
import { ensureDataDirs, files } from "../paths.js";

export function loadProfile(): Profile | null {
  const p = files.profile();
  if (!fs.existsSync(p)) return null;
  const raw = YAML.parse(fs.readFileSync(p, "utf8")) as Profile;
  // 延迟 normalize，避免循环依赖：在调用方 normalize 亦可
  return raw;
}

export function saveProfile(profile: Profile): void {
  ensureDataDirs();
  fs.writeFileSync(files.profile(), YAML.stringify(profile), "utf8");
}

export function loadJobs(): Job[] {
  ensureDataDirs();
  const p = files.jobsIndex();
  if (!fs.existsSync(p)) return [];
  return JSON.parse(fs.readFileSync(p, "utf8")) as Job[];
}

export function saveJobs(jobs: Job[]): void {
  ensureDataDirs();
  fs.writeFileSync(files.jobsIndex(), JSON.stringify(jobs, null, 2), "utf8");
}

export function upsertJobs(incoming: Job[]): { added: number; total: number } {
  const existing = loadJobs();
  const byId = new Map(existing.map((j) => [j.id, j]));
  let added = 0;
  for (const j of incoming) {
    if (!byId.has(j.id)) {
      added++;
      byId.set(j.id, j);
    } else {
      const prev = byId.get(j.id)!;
      byId.set(j.id, { ...prev, ...j, match: j.match ?? prev.match });
    }
  }
  const all = [...byId.values()].sort((a, b) =>
    (b.scraped_at || "").localeCompare(a.scraped_at || "")
  );
  saveJobs(all);
  return { added, total: all.length };
}

export function saveShortlist(jobs: Job[]): void {
  ensureDataDirs();
  fs.writeFileSync(files.shortlist(), JSON.stringify(jobs, null, 2), "utf8");
}

export function loadShortlist(): Job[] {
  const p = files.shortlist();
  if (!fs.existsSync(p)) return [];
  return JSON.parse(fs.readFileSync(p, "utf8")) as Job[];
}

export function loadEvents(): EventItem[] {
  ensureDataDirs();
  const p = files.eventsIndex();
  if (!fs.existsSync(p)) return [];
  return JSON.parse(fs.readFileSync(p, "utf8")) as EventItem[];
}

export function saveEvents(events: EventItem[]): void {
  ensureDataDirs();
  fs.writeFileSync(files.eventsIndex(), JSON.stringify(events, null, 2), "utf8");
}

export function appDir(appId: string): string {
  ensureDataDirs();
  const d = path.join(
    path.dirname(files.tracker()),
    "applications",
    appId
  );
  if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });
  return d;
}

export function loadApplications(): Application[] {
  ensureDataDirs();
  const dir = path.join(path.dirname(files.tracker()), "applications");
  if (!fs.existsSync(dir)) return [];
  const apps: Application[] = [];
  for (const name of fs.readdirSync(dir)) {
    const meta = path.join(dir, name, "meta.json");
    if (fs.existsSync(meta)) {
      apps.push(JSON.parse(fs.readFileSync(meta, "utf8")) as Application);
    }
  }
  return apps.sort((a, b) => b.updated_at.localeCompare(a.updated_at));
}

export function saveApplication(app: Application): void {
  const d = appDir(app.id);
  fs.writeFileSync(path.join(d, "meta.json"), JSON.stringify(app, null, 2));
  syncTrackerCsv();
}

function syncTrackerCsv(): void {
  const apps = loadApplications();
  const jobs = loadJobs();
  const jobMap = new Map(jobs.map((j) => [j.id, j]));
  const header =
    "id,job_id,company,title,status,score,updated_at,source_url,outcome\n";
  const rows = apps.map((a) => {
    const j = jobMap.get(a.job_id);
    const cells = [
      a.id,
      a.job_id,
      csv(j?.company || ""),
      csv(j?.title || ""),
      a.status,
      j?.match?.score?.toString() || "",
      a.updated_at,
      csv(j?.source_url || ""),
      csv(a.outcome || ""),
    ];
    return cells.join(",");
  });
  fs.writeFileSync(files.tracker(), header + rows.join("\n") + "\n", "utf8");
}

function csv(s: string): string {
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export function appendTgInbox(text: string): void {
  ensureDataDirs();
  const line = JSON.stringify({ at: new Date().toISOString(), text }) + "\n";
  fs.appendFileSync(files.tgInbox(), line, "utf8");
}
