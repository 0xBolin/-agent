import { config } from "../config.js";
import type { Job } from "../types.js";
import { fingerprint, truncate } from "../util/text.js";
import { fetchJson } from "../util/http.js";
import { inferRemote, inferRoleFamily } from "./role.js";

interface DejobTopic {
  topicId: number;
  content?: string;
  content2?: string;
  content3?: string;
  positionName?: string;
  company?: string;
  url?: string;
  workTypeName?: string;
  officeModeName?: string;
  location?: string;
  base?: string;
  minSalary?: number;
  maxSalary?: number;
  tags?: { tagName?: string }[];
  createTime?: number;
  companyIntroduction?: string;
}

interface DejobResp {
  errorCode: number;
  data?: {
    page?: { total?: number };
    results?: DejobTopic[];
  };
}

export async function scrapeDejob(limit = 40): Promise<Job[]> {
  const jobs: Job[] = [];
  const pageSize = 20;
  let page = 1;
  const now = new Date().toISOString();

  while (jobs.length < limit) {
    const url = `${config.sources.dejobTopics}?page=${page}&limit=${pageSize}`;
    let resp: DejobResp;
    try {
      resp = await fetchJson<DejobResp>(url, {
        headers: { "Accept-Language": "zh-CN,en;q=0.8" },
      });
    } catch (e) {
      console.warn(`[dejob.ai] page ${page}:`, (e as Error).message);
      break;
    }
    if (resp.errorCode !== 0 || !resp.data?.results?.length) break;

    for (const row of resp.data.results) {
      if (jobs.length >= limit) break;
      const title = row.positionName || "Untitled";
      const company = row.company || "Unknown";
      const body = [row.content, row.content2, row.content3, row.companyIntroduction]
        .filter(Boolean)
        .join("\n\n");
      const sourceUrl =
        row.url || `https://www.dejob.ai/jobDetail?id=${row.topicId}`;
      const location = [row.location, row.base, row.officeModeName]
        .filter(Boolean)
        .join(" · ");
      const comp =
        row.minSalary || row.maxSalary
          ? `${row.minSalary ?? "?"}–${row.maxSalary ?? "?"} (posted unit)`
          : row.content3 || "";
      const tags = (row.tags || [])
        .map((t) => t.tagName || "")
        .filter(Boolean);

      const id = fingerprint([
        "dejob.ai",
        String(row.topicId),
        title,
        company,
      ]);

      jobs.push({
        id,
        source: "dejob.ai",
        source_url: sourceUrl,
        scraped_at: now,
        company,
        title,
        role_family: inferRoleFamily(title, body),
        description_raw: body,
        description_clean: truncate(body, 6000),
        location,
        remote_type: inferRemote(location, body + " " + (row.officeModeName || "")),
        comp_hint: comp,
        tags,
        posted_at: row.createTime
          ? new Date(row.createTime).toISOString()
          : undefined,
        legitimacy_flags: [],
      });
    }

    if (resp.data.results.length < pageSize) break;
    page++;
  }

  return jobs;
}
