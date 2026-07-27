import fs from "node:fs";
import path from "node:path";
import { AsyncLocalStorage } from "node:async_hooks";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const ROOT = path.resolve(__dirname, "..");

/** 请求级用户数据目录（登录后） */
export const dataContext = new AsyncLocalStorage<{ userDataDir: string }>();

export function baseDataDir(): string {
  const fromEnv = process.env.JOB_BLOCK_DATA_DIR;
  return fromEnv ? path.resolve(fromEnv) : path.join(ROOT, "data");
}

export function dataDir(): string {
  const ctx = dataContext.getStore();
  if (ctx?.userDataDir) return ctx.userDataDir;
  return baseDataDir();
}

export function userDataDir(userId: string): string {
  return path.join(baseDataDir(), "accounts", userId);
}

export function ensureDataDirs(): void {
  const base = dataDir();
  for (const sub of [
    "",
    "jobs",
    "applications",
    "events",
    "vectors",
    ".cache",
  ]) {
    const p = path.join(base, sub);
    if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
  }
  // 全局 accounts / sessions
  const root = baseDataDir();
  for (const sub of ["", "accounts", "sessions"]) {
    const p = path.join(root, sub);
    if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
  }
}

export const files = {
  profile: () => path.join(dataDir(), "profile.yml"),
  profileExample: () => path.join(baseDataDir(), "profile.example.yml"),
  jobsIndex: () => path.join(dataDir(), "jobs", "index.json"),
  tracker: () => path.join(dataDir(), "tracker.csv"),
  eventsIndex: () => path.join(dataDir(), "events", "index.json"),
  shortlist: () => path.join(dataDir(), "jobs", "shortlist.json"),
  tgInbox: () => path.join(dataDir(), "jobs", "tg-inbox.jsonl"),
  pipelineStatus: () => path.join(dataDir(), "pipeline-status.json"),
  careerPath: () => path.join(dataDir(), "career-path.json"),
  weekPlan: () => path.join(dataDir(), "week-plan.json"),
  outreach: () => path.join(dataDir(), "outreach.json"),
  usersIndex: () => path.join(baseDataDir(), "accounts", "index.json"),
  sessions: () => path.join(baseDataDir(), "sessions", "sessions.json"),
};
