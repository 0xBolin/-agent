import type { Job } from "../types.js";
import { upsertJobs } from "../store/fs-store.js";
import { scrapeDejob } from "./dejob.js";
import { scrapeWeb3Career } from "./web3career.js";
import { scrapeTwitterHiring } from "./twitter.js";
import { parsePastedJd } from "./paste.js";

export interface ScanResult {
  bySource: Record<string, number>;
  added: number;
  total: number;
  errors: string[];
}

async function withTimeout<T>(
  p: Promise<T>,
  ms: number,
  label: string
): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      p,
      new Promise<T>((_, rej) => {
        timer = setTimeout(
          () => rej(new Error(`${label} timeout ${ms}ms`)),
          ms
        );
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

export async function scanAll(opts: {
  limitPerSource?: number;
  sources?: Array<"web3.career" | "dejob.ai" | "x">;
}): Promise<ScanResult> {
  const limit = opts.limitPerSource ?? 30;
  const sources = opts.sources ?? ["web3.career", "dejob.ai", "x"];
  const bySource: Record<string, number> = {};
  const errors: string[] = [];
  const collected: Job[] = [];

  const tasks: Promise<void>[] = [];

  if (sources.includes("web3.career")) {
    tasks.push(
      (async () => {
        try {
          const jobs = await withTimeout(
            scrapeWeb3Career(limit),
            45000,
            "web3.career"
          );
          bySource["web3.career"] = jobs.length;
          collected.push(...jobs);
          console.log(`  ✓ web3.career: ${jobs.length} 条`);
        } catch (e) {
          errors.push(`web3.career: ${(e as Error).message}`);
          console.warn(`  ✗ web3.career: ${(e as Error).message}`);
        }
      })()
    );
  }

  if (sources.includes("dejob.ai")) {
    tasks.push(
      (async () => {
        try {
          const jobs = await withTimeout(scrapeDejob(limit), 30000, "dejob.ai");
          bySource["dejob.ai"] = jobs.length;
          collected.push(...jobs);
          console.log(`  ✓ dejob.ai: ${jobs.length} 条`);
        } catch (e) {
          errors.push(`dejob.ai: ${(e as Error).message}`);
          console.warn(`  ✗ dejob.ai: ${(e as Error).message}`);
        }
      })()
    );
  }

  if (sources.includes("x")) {
    tasks.push(
      (async () => {
        try {
          // X 公开抓取易慢，严格超时，不阻塞主报告
          const jobs = await withTimeout(
            scrapeTwitterHiring(Math.min(limit, 15)),
            20000,
            "x"
          );
          bySource["x"] = jobs.length;
          collected.push(...jobs);
          console.log(`  ✓ X/Twitter hiring: ${jobs.length} 条`);
        } catch (e) {
          errors.push(`x: ${(e as Error).message}`);
          console.warn(`  ✗ x: ${(e as Error).message}`);
        }
      })()
    );
  }

  await Promise.all(tasks);
  const { added, total } = upsertJobs(collected);
  return { bySource, added, total, errors };
}

export function ingestPaste(text: string): Job {
  const job = parsePastedJd(text, { source: "paste" });
  upsertJobs([job]);
  return job;
}

export function ingestTelegramText(text: string): Job {
  const job = parsePastedJd(text, {
    source: "telegram",
    sourceUrl: "https://t.me/DeJob_official",
  });
  upsertJobs([job]);
  return job;
}

export { parsePastedJd, scrapeDejob, scrapeWeb3Career, scrapeTwitterHiring };
