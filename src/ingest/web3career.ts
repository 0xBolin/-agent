import { config } from "../config.js";
import type { Job } from "../types.js";
import { fingerprint, stripHtml, truncate } from "../util/text.js";
import { fetchText } from "../util/http.js";
import { inferRemote, inferRoleFamily } from "./role.js";

/** 从 web3.career 首页/分类页解析岗位列表 */
export async function scrapeWeb3Career(limit = 40): Promise<Job[]> {
  const urls = [
    `${config.sources.web3Career}/`,
    `${config.sources.web3Career}/remote-jobs`,
    `${config.sources.web3Career}/community-manager-jobs`,
    `${config.sources.web3Career}/marketing-jobs`,
    `${config.sources.web3Career}/product-manager-jobs`,
  ];

  const seen = new Set<string>();
  const jobs: Job[] = [];
  const now = new Date().toISOString();

  for (const pageUrl of urls) {
    if (jobs.length >= limit) break;
    let html: string;
    try {
      html = await fetchText(pageUrl);
    } catch (e) {
      console.warn(`[web3.career] skip ${pageUrl}:`, (e as Error).message);
      continue;
    }

    // href like /social-media-and-community-manager-koinly/151770
    const re =
      /href="(\/(?:[a-z0-9-]+\/)?[a-z0-9-]+\/\d{4,})"|href="(https:\/\/web3\.career\/[^"]+\/\d{4,})"/gi;
    const paths: string[] = [];
    let m: RegExpExecArray | null;
    while ((m = re.exec(html))) {
      const raw = m[1] || m[2];
      if (!raw) continue;
      const path = raw.startsWith("http")
        ? raw.replace("https://web3.career", "")
        : raw;
      if (!paths.includes(path)) paths.push(path);
    }

    for (const path of paths) {
      if (jobs.length >= limit) break;
      const url = `https://web3.career${path}`;
      if (seen.has(url)) continue;
      seen.add(url);

      const slug = path.replace(/^\//, "");
      // slug 形态: marketing-lead-peaq-labs-ltd/151623
      const slugHead = slug.split("/")[0] || slug;
      const titleGuess = humanizeSlugTitle(slugHead);

      // 尝试从附近 HTML 抽 title（过滤无意义短词）
      const nearby = extractNearbyTitle(html, path);
      const title =
        nearby && !isNoiseTitle(nearby) ? nearby : titleGuess || "Untitled role";
      const company =
        extractCompany(html, path) || guessCompanyFromSlug(slugHead);
      const snippet = extractSnippet(html, path);

      const description = snippet || title;
      const id = fingerprint(["web3.career", url, title, company]);

      jobs.push({
        id,
        source: "web3.career",
        source_url: url,
        scraped_at: now,
        company,
        title,
        role_family: inferRoleFamily(title, description),
        description_raw: description,
        description_clean: truncate(description, 4000),
        location: /remote/i.test(description + path) ? "Remote" : "",
        remote_type: inferRemote("", description + path),
        comp_hint: "",
        tags: [],
        legitimacy_flags: [],
      });
    }
  }

  // 对前 N 条拉详情增强描述
  const detailN = Math.min(12, jobs.length);
  for (let i = 0; i < detailN; i++) {
    try {
      const detail = await fetchText(jobs[i].source_url);
      const text = stripHtml(detail);
      if (text.length > 80) {
        jobs[i].description_raw = text;
        jobs[i].description_clean = truncate(text, 6000);
        jobs[i].role_family = inferRoleFamily(jobs[i].title, text);
        jobs[i].remote_type = inferRemote(jobs[i].location, text);
      }
    } catch {
      /* keep list-level data */
    }
  }

  return jobs;
}

function humanizeSlugTitle(slugHead: string): string {
  // 去掉常见公司后缀词后仍保留可读标题：取前若干段
  const parts = slugHead.split("-").filter(Boolean);
  if (parts.length <= 2) {
    return parts.map(cap).join(" ");
  }
  // 启发式：标题通常在前，公司名在后；保留全部可读化（总比乱码好）
  return parts.map(cap).join(" ");
}

function cap(w: string): string {
  if (w.length <= 2) return w.toUpperCase();
  return w.charAt(0).toUpperCase() + w.slice(1);
}

function isNoiseTitle(t: string): boolean {
  const s = t.trim().toLowerCase();
  return (
    s.length < 4 ||
    /^(learn more|apply|remote|new|featured|view|jobs?|web3)$/i.test(s)
  );
}

function extractNearbyTitle(html: string, path: string): string | null {
  const idx = html.indexOf(path);
  if (idx < 0) return null;
  const window = html.slice(Math.max(0, idx - 400), idx + path.length + 400);
  const matches = [...window.matchAll(/>([^<>]{4,120})</g)].map((m) =>
    m[1].replace(/\s+/g, " ").trim()
  );
  for (const t of matches) {
    if (t && !t.startsWith("http") && !isNoiseTitle(t)) return t;
  }
  return null;
}

function extractCompany(html: string, path: string): string | null {
  const idx = html.indexOf(path);
  if (idx < 0) return null;
  const after = html.slice(idx, idx + 800);
  const m = after.match(/(?:company|h3|h4)[^>]*>\s*([^<]{2,60})\s*</i);
  return m ? m[1].trim() : null;
}

function extractSnippet(html: string, path: string): string {
  const idx = html.indexOf(path);
  if (idx < 0) return "";
  return stripHtml(html.slice(idx, idx + 1500)).slice(0, 500);
}

function guessCompanyFromSlug(slugHead: string): string {
  const parts = slugHead.split("-");
  if (parts.length >= 2) {
    // 取最后 1–2 段当公司名猜测
    return parts.slice(-2).map(cap).join(" ");
  }
  return "Unknown";
}
