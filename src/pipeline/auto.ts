/**
 * Setup 完成后自动：扫岗 → 匹配 → 活动 → 完整求职路径
 */
import fs from "node:fs";
import { files, ensureDataDirs } from "../paths.js";
import { getProfile, normalizeProfile } from "../profile/setup.js";
import { loadJobs, loadShortlist } from "../store/fs-store.js";
import { scanAll } from "../ingest/index.js";
import { rankJobs } from "../match/rank.js";
import { listEvents } from "../events/luma.js";
import {
  buildCareerPath,
  saveCareerPath,
  loadCareerPath,
  type CareerPath,
} from "./path.js";
import type { Job, EventItem, Profile } from "../types.js";

export interface PipelineStatus {
  status: "idle" | "running" | "done" | "error";
  phase: string;
  message: string;
  started_at?: string;
  finished_at?: string;
  progress: number;
  scan?: { added: number; total: number; bySource: Record<string, number> };
  shortlist_count?: number;
  events_count?: number;
  error?: string;
}

export function readPipelineStatus(): PipelineStatus {
  ensureDataDirs();
  const p = files.pipelineStatus();
  if (!fs.existsSync(p)) {
    return {
      status: "idle",
      phase: "idle",
      message: "等待开始",
      progress: 0,
    };
  }
  return JSON.parse(fs.readFileSync(p, "utf8")) as PipelineStatus;
}

function writeStatus(s: PipelineStatus): void {
  ensureDataDirs();
  fs.writeFileSync(files.pipelineStatus(), JSON.stringify(s, null, 2));
}

export async function runAutoPipeline(opts?: {
  limitPerSource?: number;
}): Promise<{
  status: PipelineStatus;
  shortlist: Job[];
  events: EventItem[];
  path: CareerPath | null;
  profile: Profile | null;
}> {
  const profileRaw = getProfile();
  if (!profileRaw) {
    const st: PipelineStatus = {
      status: "error",
      phase: "error",
      message: "请先完成 Setup",
      progress: 0,
      error: "no_profile",
    };
    writeStatus(st);
    return { status: st, shortlist: [], events: [], path: null, profile: null };
  }
  const profile = normalizeProfile(profileRaw);

  const started = new Date().toISOString();
  writeStatus({
    status: "running",
    phase: "scan",
    message: "正在为你搜索机会，请稍候…",
    started_at: started,
    progress: 10,
  });

  try {
    writeStatus({
      status: "running",
      phase: "scan",
      message: "聚合线上岗位：web3.career · DeJob · X…",
      started_at: started,
      progress: 25,
    });

    const scan = await scanAll({
      limitPerSource: opts?.limitPerSource ?? 25,
      sources: ["web3.career", "dejob.ai", "x"],
    });

    writeStatus({
      status: "running",
      phase: "rank",
      message: "按简历与目标岗精排 shortlist…",
      started_at: started,
      progress: 50,
      scan: {
        added: scan.added,
        total: scan.total,
        bySource: scan.bySource,
      },
    });

    const jobs = loadJobs();
    const report = await rankJobs(profile, jobs, {
      topRecall: 50,
      topShow: 15,
    });

    writeStatus({
      status: "running",
      phase: "events",
      message: "自动匹配适合你的线下活动（Luma）…",
      started_at: started,
      progress: 72,
      scan: {
        added: scan.added,
        total: scan.total,
        bySource: scan.bySource,
      },
      shortlist_count: report.shortlist.length,
    });

    // 多城市自动拉活动，不靠用户手动搜
    const cities = [
      ...new Set([
        ...(profile.event_cities || []),
        ...(profile.location_pref?.cities || []),
      ]),
    ].filter(Boolean);
    if (!cities.length) cities.push("Singapore");

    const allEvents: EventItem[] = [];
    for (const city of cities.slice(0, 3)) {
      const batch = await listEvents({ city, profile });
      allEvents.push(...batch);
    }
    // 去重按 url
    const byUrl = new Map<string, EventItem>();
    for (const e of allEvents) {
      const prev = byUrl.get(e.url);
      if (!prev || (e.relevance_score || 0) > (prev.relevance_score || 0)) {
        byUrl.set(e.url, e);
      }
    }
    const events = [...byUrl.values()]
      .sort((a, b) => (b.relevance_score || 0) - (a.relevance_score || 0))
      .slice(0, 20);

    writeStatus({
      status: "running",
      phase: "path",
      message: "生成完整求职路径：投什么 · 补什么 · 去哪 · 找谁…",
      started_at: started,
      progress: 90,
      scan: {
        added: scan.added,
        total: scan.total,
        bySource: scan.bySource,
      },
      shortlist_count: report.shortlist.length,
      events_count: events.length,
    });

    const path = buildCareerPath(profile, report.shortlist, events);
    saveCareerPath(path);

    const done: PipelineStatus = {
      status: "done",
      phase: "done",
      message: `路径已生成：${report.shortlist.length} 岗 · ${path.events.length} 场推荐活动 · ${path.contacts.length} 个触达对象`,
      started_at: started,
      finished_at: new Date().toISOString(),
      progress: 100,
      scan: {
        added: scan.added,
        total: scan.total,
        bySource: scan.bySource,
      },
      shortlist_count: report.shortlist.length,
      events_count: path.events.length,
    };
    writeStatus(done);

    return {
      status: done,
      shortlist: report.shortlist,
      events: path.events,
      path,
      profile,
    };
  } catch (e) {
    const err: PipelineStatus = {
      status: "error",
      phase: "error",
      message: "自动搜索失败",
      started_at: started,
      finished_at: new Date().toISOString(),
      progress: 0,
      error: (e as Error).message,
    };
    writeStatus(err);
    return {
      status: err,
      shortlist: loadShortlist(),
      events: [],
      path: loadCareerPath(),
      profile,
    };
  }
}
