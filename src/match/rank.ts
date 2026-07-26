import type { Job, Profile, RankOptions } from "../types.js";
import { config } from "../config.js";
import { hardFilter } from "./rules.js";
import { embedTexts, cosine, jobEmbedText, profileEmbedText } from "./embed.js";
import { llmScore } from "./score-llm.js";
import { saveJobs, saveShortlist } from "../store/fs-store.js";

export interface RankReport {
  total: number;
  afterFilter: number;
  recalled: number;
  shortlist: Job[];
  method: string;
}

export async function rankJobs(
  profile: Profile,
  jobs: Job[],
  opts: RankOptions = {}
): Promise<RankReport> {
  const topRecall = opts.topRecall ?? config.match.topRecall;
  const topShow = opts.topShow ?? config.match.topShow;

  const filtered: Job[] = [];
  for (const j of jobs) {
    const { pass, reasons } = hardFilter(profile, j);
    if (!pass) {
      j.legitimacy_flags = [
        ...new Set([...(j.legitimacy_flags || []), ...reasons]),
      ];
      continue;
    }
    filtered.push(j);
  }

  // ① Embedding 粗筛
  const profileVec = (await embedTexts([profileEmbedText(profile)]))[0];
  const jobTexts = filtered.map(jobEmbedText);
  const jobVecs = await embedTexts(jobTexts);
  const scored = filtered.map((job, i) => ({
    job,
    sim: cosine(profileVec, jobVecs[i]),
  }));
  scored.sort((a, b) => b.sim - a.sim);
  const recalled = scored.slice(0, topRecall).map((s) => s.job);

  console.log(
    `  召回 Top ${recalled.length}（全量 ${jobs.length} → 过滤后 ${filtered.length}）`
  );

  // ② LLM / 规则精排
  const ranked: Job[] = [];
  let i = 0;
  for (const job of recalled) {
    i++;
    process.stdout.write(`  精排 ${i}/${recalled.length}: ${job.title.slice(0, 40)}…\r`);
    const match = await llmScore(profile, job);
    job.match = match;
    ranked.push(job);
  }
  process.stdout.write("\n");

  ranked.sort((a, b) => (b.match?.score || 0) - (a.match?.score || 0));
  const shortlist = ranked.slice(0, topShow);

  // 写回
  const byId = new Map(jobs.map((j) => [j.id, j]));
  for (const j of ranked) byId.set(j.id, j);
  saveJobs([...byId.values()]);
  saveShortlist(shortlist);

  return {
    total: jobs.length,
    afterFilter: filtered.length,
    recalled: recalled.length,
    shortlist,
    method: shortlist[0]?.match?.method || "hybrid",
  };
}

export function formatShortlist(jobs: Job[]): string {
  if (!jobs.length) return "（shortlist 为空）";
  return jobs
    .map((j, idx) => {
      const m = j.match;
      const lines = [
        `${idx + 1}. [${m?.score ?? "?"}] ${j.title} @ ${j.company}`,
        `   角色: ${j.role_family} · ${j.remote_type} · ${j.source}`,
        `   建议: ${m?.action ?? "-"} · ${m?.summary || ""}`,
        m?.strengths?.length
          ? `   优势: ${m.strengths.join("；")}`
          : null,
        m?.gaps?.length ? `   缺口: ${m.gaps.join("；")}` : null,
        m?.concerns?.length
          ? `   风险: ${m.concerns.join("；")}`
          : null,
        `   链接: ${j.source_url}`,
        `   id: ${j.id}`,
      ];
      return lines.filter(Boolean).join("\n");
    })
    .join("\n\n");
}
