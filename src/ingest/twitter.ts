/**
 * X (Twitter) Web3 hiring 采集
 * - 有 TWITTER_BEARER_TOKEN / X_BEARER_TOKEN：用官方 recent search
 * - 否则：公开网页/代理尽力抓取 + 关键词解析
 */
import type { Job } from "../types.js";
import { fingerprint, truncate } from "../util/text.js";
import { fetchText, fetchJson } from "../util/http.js";
import { inferRemote, inferRoleFamily } from "./role.js";
import { scamHeuristics } from "./paste.js";

const QUERIES = [
  '("hiring" OR "we\'re hiring" OR "is hiring" OR "open role" OR "job opening") (web3 OR solidity OR defi OR crypto OR blockchain) -is:retweet lang:en',
  '("招聘" OR "招人" OR hiring) (Web3 OR 区块链 OR DeFi OR Solidity)',
  '("Community Lead" OR "Business Development" OR "Smart Contract" OR Auditor) (hiring OR 招聘) (web3 OR crypto)',
];

interface TweetLike {
  id: string;
  text: string;
  url: string;
  author?: string;
  created_at?: string;
}

export async function scrapeTwitterHiring(limit = 25): Promise<Job[]> {
  const tweets: TweetLike[] = [];

  const bearer =
    process.env.TWITTER_BEARER_TOKEN ||
    process.env.X_BEARER_TOKEN ||
    process.env.TWITTER_API_BEARER ||
    "";

  if (bearer) {
    for (const q of QUERIES) {
      if (tweets.length >= limit) break;
      try {
        const batch = await searchXApi(q, bearer, 15);
        tweets.push(...batch);
      } catch (e) {
        console.warn("[x/api]", (e as Error).message);
      }
    }
  } else {
    // 无 API Key：多路公开抓取
    try {
      const web = await searchViaPublicWeb(limit);
      tweets.push(...web);
    } catch (e) {
      console.warn("[x/public]", (e as Error).message);
    }
  }

  // 去重
  const seen = new Set<string>();
  const unique: TweetLike[] = [];
  for (const t of tweets) {
    if (seen.has(t.id) || seen.has(t.url)) continue;
    if (!isHiringRelevant(t.text)) continue;
    seen.add(t.id);
    seen.add(t.url);
    unique.push(t);
  }

  const now = new Date().toISOString();
  return unique.slice(0, limit).map((t) => tweetToJob(t, now));
}

function isHiringRelevant(text: string): boolean {
  const t = text.toLowerCase();
  const hire =
    /hiring|we're hiring|is hiring|open role|job opening|recruit|招聘|招人|hc\b|looking for|join (our|the) team|职位|岗位/.test(
      t
    );
  const web3 =
    /web3|crypto|blockchain|defi|solidity|ethereum|solana|nft|dao|token|链|区块链|钱包|交易所/.test(
      t
    );
  return hire && (web3 || /remote|bd\b|community|security|product|engineer/.test(t));
}

async function searchXApi(
  query: string,
  bearer: string,
  max = 15
): Promise<TweetLike[]> {
  const params = new URLSearchParams({
    query,
    max_results: String(Math.min(max, 20)),
    "tweet.fields": "created_at,author_id,text",
    expansions: "author_id",
    "user.fields": "username",
  });
  const url = `https://api.twitter.com/2/tweets/search/recent?${params}`;
  const data = await fetchJson<{
    data?: { id: string; text: string; created_at?: string; author_id?: string }[];
    includes?: { users?: { id: string; username: string }[] };
  }>(url, {
    headers: { Authorization: `Bearer ${bearer}` },
  });
  const users = new Map(
    (data.includes?.users || []).map((u) => [u.id, u.username])
  );
  return (data.data || []).map((tw) => {
    const user = tw.author_id ? users.get(tw.author_id) : undefined;
    return {
      id: tw.id,
      text: tw.text,
      url: user
        ? `https://x.com/${user}/status/${tw.id}`
        : `https://x.com/i/web/status/${tw.id}`,
      author: user,
      created_at: tw.created_at,
    };
  });
}

/** 无官方 API 时的尽力公开采集（控制请求数与超时，避免拖垮 pipeline） */
async function searchViaPublicWeb(limit: number): Promise<TweetLike[]> {
  const out: TweetLike[] = [];
  // 少而精：2 个搜索 + 2 个账号
  const queries = ["web3 hiring", "crypto hiring remote"];
  const accounts = ["cryptojobslist", "Web3Career"];

  for (const q of queries) {
    if (out.length >= limit) break;
    try {
      const text = await fetchText(
        `https://r.jina.ai/http://x.com/search?q=${encodeURIComponent(q)}&f=live`,
        {},
        8000
      );
      out.push(...parseSearchDump(text));
    } catch {
      /* skip */
    }
  }

  for (const acc of accounts) {
    if (out.length >= limit) break;
    try {
      const text = await fetchText(
        `https://r.jina.ai/https://x.com/${acc}`,
        {},
        8000
      );
      out.push(...parseSearchDump(text, acc));
    } catch {
      /* skip */
    }
  }

  return out;
}

function parseSearchDump(dump: string, defaultAuthor?: string): TweetLike[] {
  const results: TweetLike[] = [];
  // status links
  const re =
    /https?:\/\/(?:x|twitter)\.com\/([A-Za-z0-9_]+)\/status\/(\d+)/g;
  let m: RegExpExecArray | null;
  const seen = new Set<string>();
  while ((m = re.exec(dump))) {
    const author = m[1];
    const id = m[2];
    if (seen.has(id)) continue;
    seen.add(id);
    // 截取链接附近文本
    const idx = m.index;
    const window = dump.slice(Math.max(0, idx - 280), idx + 80).replace(/\s+/g, " ");
    results.push({
      id,
      author,
      url: `https://x.com/${author}/status/${id}`,
      text: window || `Hiring post by @${author}`,
    });
  }

  // 若几乎没链，按段落当岗位帖
  if (results.length < 2) {
    const paras = dump
      .split(/\n{2,}/)
      .map((p) => p.replace(/\s+/g, " ").trim())
      .filter((p) => p.length > 40 && isHiringRelevant(p));
    paras.slice(0, 8).forEach((text, i) => {
      const id = fingerprint(["x-para", text.slice(0, 80), String(i)]);
      results.push({
        id,
        text,
        url: defaultAuthor
          ? `https://x.com/${defaultAuthor}`
          : `https://x.com/search?q=${encodeURIComponent(text.slice(0, 40))}`,
        author: defaultAuthor,
      });
    });
  }
  return results;
}

function tweetToJob(t: TweetLike, now: string): Job {
  const text = t.text.replace(/https?:\/\/\S+/g, " ").trim();
  const title = guessTitle(text);
  const company = t.author ? `@${t.author}` : guessCompany(text);
  const id = fingerprint(["x", t.id, title]);
  return {
    id,
    source: "x",
    source_url: t.url,
    scraped_at: now,
    company,
    title,
    role_family: inferRoleFamily(title, text),
    description_raw: t.text,
    description_clean: truncate(text, 4000),
    location: /remote|远程/i.test(text) ? "Remote" : "",
    remote_type: inferRemote("", text),
    comp_hint: "",
    tags: ["x", "twitter", "hiring"],
    posted_at: t.created_at,
    legitimacy_flags: scamHeuristics(text),
  };
}

function guessTitle(text: string): string {
  const m =
    text.match(
      /(?:hiring|招聘|looking for|for a?)\s*[:\-]?\s*([A-Za-z0-9 /+&#\u4e00-\u9fff]{4,60})/i
    ) ||
    text.match(
      /\b(Community Lead|Business Development|Product Manager|Security Engineer|Smart Contract|Solidity|Research Analyst|Growth Lead|BD Manager)[A-Za-z ]{0,20}/i
    );
  if (m) return m[1].trim().slice(0, 80);
  return truncate(text, 60) || "Web3 Hiring (X)";
}

function guessCompany(text: string): string {
  const m = text.match(/@([A-Za-z0-9_]{2,30})/);
  if (m) return `@${m[1]}`;
  return "X Hiring";
}
