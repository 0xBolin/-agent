/**
 * Luma 真实接入：api.lu.ma discover
 * 返回具体活动页 https://luma.com/{slug}，并按简历/画像相关度排序
 */
import type { EventItem, Profile } from "../types.js";
import { fingerprint, truncate } from "../util/text.js";
import { fetchJson } from "../util/http.js";
import { saveEvents } from "../store/fs-store.js";
import { hasLlm } from "../config.js";
import { chatText } from "../llm/client.js";

const LUMA_API = "https://api.lu.ma/discover/get-paginated-events";

interface LumaEntry {
  api_id?: string;
  event?: {
    api_id?: string;
    name?: string;
    start_at?: string;
    end_at?: string;
    timezone?: string;
    url?: string;
    location_type?: string;
    geo_address_info?: {
      city?: string;
      country?: string;
      full_address?: string;
      city_state?: string;
    };
  };
  calendar?: { name?: string; description_short?: string | null };
}

interface LumaResp {
  entries?: LumaEntry[];
  has_more?: boolean;
  next_cursor?: string;
}

const CITY_GEO: Record<string, { lat: number; lng: number }> = {
  singapore: { lat: 1.3521, lng: 103.8198 },
  "hong kong": { lat: 22.3193, lng: 114.1694 },
  hk: { lat: 22.3193, lng: 114.1694 },
  dubai: { lat: 25.2048, lng: 55.2708 },
  shanghai: { lat: 31.2304, lng: 121.4737 },
  beijing: { lat: 39.9042, lng: 116.4074 },
  tokyo: { lat: 35.6762, lng: 139.6503 },
  seoul: { lat: 37.5665, lng: 126.978 },
  bangkok: { lat: 13.7563, lng: 100.5018 },
  bali: { lat: -8.4095, lng: 115.1889 },
  cannes: { lat: 43.5528, lng: 7.0174 },
  paris: { lat: 48.8566, lng: 2.3522 },
  london: { lat: 51.5074, lng: -0.1278 },
  "new york": { lat: 40.7128, lng: -74.006 },
  sf: { lat: 37.7749, lng: -122.4194 },
  "san francisco": { lat: 37.7749, lng: -122.4194 },
};

export async function fetchLumaDiscover(opts: {
  query?: string;
  city?: string;
  limit?: number;
}): Promise<EventItem[]> {
  const limit = opts.limit ?? 40;
  const events: EventItem[] = [];
  const queries = buildQueries(opts.city, opts.query);

  for (const q of queries) {
    if (events.length >= limit) break;
    try {
      const batch = await fetchLumaPage(q, opts.city);
      events.push(...batch);
    } catch (e) {
      console.warn("[luma]", q, (e as Error).message);
    }
  }

  // 去重 by url
  const byUrl = new Map<string, EventItem>();
  for (const e of events) {
    if (!byUrl.has(e.url)) byUrl.set(e.url, e);
  }
  return [...byUrl.values()].slice(0, limit);
}

function buildQueries(city?: string, extra?: string): string[] {
  const c = (city || "").trim();
  const base = [
    "web3",
    "crypto",
    "blockchain",
    "ethereum",
    "defi",
    "web3 meetup",
    "crypto hackathon",
  ];
  const qs: string[] = [];
  if (extra) qs.push(extra);
  if (c) {
    for (const b of base.slice(0, 4)) qs.push(`${b} ${c}`);
    qs.push(c);
  } else {
    qs.push(...base);
  }
  return [...new Set(qs)];
}

async function fetchLumaPage(query: string, city?: string): Promise<EventItem[]> {
  const params = new URLSearchParams({
    pagination_limit: "25",
    query,
  });
  const geo = city ? CITY_GEO[city.toLowerCase()] : undefined;
  if (geo) {
    params.set("geo_latitude", String(geo.lat));
    params.set("geo_longitude", String(geo.lng));
  }

  const data = await fetchJson<LumaResp>(`${LUMA_API}?${params}`, {
    headers: {
      Accept: "application/json",
      "User-Agent": "JobBlock/0.1",
    },
  });

  return (data.entries || [])
    .map(mapLumaEntry)
    .filter((e): e is EventItem => Boolean(e));
}

function mapLumaEntry(entry: LumaEntry): EventItem | null {
  const ev = entry.event;
  if (!ev?.name || !ev.url) return null;
  // 具体活动页，不是 discover 大盘
  const slug = ev.url.replace(/^https?:\/\/(www\.)?luma\.com\//, "");
  const url = `https://luma.com/${slug}`;
  const city =
    ev.geo_address_info?.city ||
    ev.geo_address_info?.city_state?.split(",")[0] ||
    "";
  const descParts = [
    entry.calendar?.name,
    entry.calendar?.description_short,
    ev.geo_address_info?.full_address,
    ev.location_type,
  ].filter(Boolean);

  return {
    id: fingerprint(["luma", ev.api_id || slug, ev.name]),
    title: ev.name,
    city,
    country: ev.geo_address_info?.country,
    venue: ev.geo_address_info?.full_address,
    start_at: ev.start_at,
    end_at: ev.end_at,
    timezone: ev.timezone,
    event_type: guessType(ev.name),
    sectors: guessSectors(ev.name + " " + descParts.join(" ")),
    url,
    host: entry.calendar?.name,
    description: truncate(descParts.join(" · ") || ev.name, 500),
    invite_only: /invite\s*only|申请制|闭门/i.test(ev.name),
    source: "luma",
  };
}

function guessType(name: string): string {
  const n = name.toLowerCase();
  if (/hackathon|hacker/.test(n)) return "hackathon";
  if (/conference|summit|ethcc|ethdenver|token/.test(n)) return "conference";
  if (/workshop|builder|villa/.test(n)) return "workshop";
  if (/side\s*event|party|dinner|drinks/.test(n)) return "side_event";
  if (/meetup|hangout|networking/.test(n)) return "meetup";
  return "event";
}

function guessSectors(text: string): string[] {
  const t = text.toLowerCase();
  const tags: string[] = [];
  const map: [RegExp, string][] = [
    [/defi|dex|lending/i, "DeFi"],
    [/nft|game|gaming/i, "NFT/Gaming"],
    [/zk|privacy|fhe/i, "ZK/Privacy"],
    [/ai|agent/i, "AI+Crypto"],
    [/wallet/i, "Wallet"],
    [/security|audit/i, "Security"],
    [/dao|governance/i, "DAO"],
    [/layer\s*2|l2|rollup/i, "Infrastructure"],
    [/web3|crypto|blockchain|eth/i, "Web3"],
  ];
  for (const [re, tag] of map) {
    if (re.test(t)) tags.push(tag);
  }
  return tags.length ? tags : ["Web3"];
}

/** 按简历/画像打相关度 */
export function scoreEventRelevance(
  event: EventItem,
  profile: Profile | null | undefined
): EventItem {
  if (!profile) {
    event.relevance_score = 40;
    event.why_attend = "近期 Web3 相关活动";
    return event;
  }

  const bag = [
    profile.primary_role,
    ...(profile.secondary_roles || []),
    ...(profile.target_titles || []),
    ...(profile.skills || []),
    ...(profile.sectors_whitelist || []),
    ...(profile.company_types || []),
    ...(profile.highlights || []),
    (profile.resume_text || "").slice(0, 800),
    profile.summary || "",
  ]
    .join(" ")
    .toLowerCase();

  const text = `${event.title} ${event.description} ${event.sectors.join(" ")} ${event.host || ""}`.toLowerCase();
  let score = 25;
  const reasons: string[] = [];

  // 城市
  const cities = [
    ...(profile.event_cities || []),
    ...(profile.location_pref?.cities || []),
  ].map((c) => c.toLowerCase());
  if (
    event.city &&
    cities.some(
      (c) =>
        event.city.toLowerCase().includes(c) ||
        c.includes(event.city.toLowerCase())
    )
  ) {
    score += 25;
    reasons.push(`城市匹配 ${event.city}`);
  }

  // 关键词
  const tokens = bag
    .split(/[^a-z0-9\u4e00-\u9fff+]+/)
    .filter((w) => w.length > 2)
    .slice(0, 80);
  let hits = 0;
  const hitWords: string[] = [];
  for (const w of tokens) {
    if (text.includes(w)) {
      hits++;
      if (hitWords.length < 5 && !hitWords.includes(w)) hitWords.push(w);
    }
  }
  score += Math.min(35, hits * 2);
  if (hitWords.length) reasons.push(`简历关键词: ${hitWords.join(", ")}`);

  // 角色线
  const role = profile.primary_role.toLowerCase();
  if (
    (role === "bd" && /bd|growth|partner|business|sales|networking/.test(text)) ||
    (role === "community" && /community|meetup|discord|moderator/.test(text)) ||
    (role === "security" && /security|audit|hack/.test(text)) ||
    (role === "research" && /research|token|governance/.test(text)) ||
    (role === "product" && /product|builder|demo/.test(text)) ||
    (role === "engineering" && /builder|hackathon|dev|engineer|solidity/.test(text))
  ) {
    score += 15;
    reasons.push(`与 ${profile.primary_role} 方向相关`);
  }

  // 目标 title
  for (const t of profile.target_titles || []) {
    if (t && text.includes(t.toLowerCase())) {
      score += 10;
      reasons.push(`贴合目标岗 ${t}`);
      break;
    }
  }

  event.relevance_score = Math.min(100, Math.round(score));
  event.why_attend =
    reasons.length > 0
      ? reasons.join(" · ")
      : `与你的 ${profile.primary_role} 画像弱相关，可作 networking 备选`;
  return event;
}

export async function listEvents(opts: {
  city?: string;
  type?: string;
  profile?: Profile | null;
  lumaUrl?: string;
  query?: string;
}): Promise<EventItem[]> {
  let events = await fetchLumaDiscover({
    city: opts.city,
    query: opts.query,
    limit: 50,
  });

  // 单链解析
  if (opts.lumaUrl) {
    const slug = opts.lumaUrl.replace(/^https?:\/\/(www\.)?luma\.com\//, "").split("?")[0];
    if (slug && !slug.includes("discover")) {
      events.unshift({
        id: fingerprint(["luma-url", slug]),
        title: slug,
        city: opts.city || "",
        event_type: "event",
        sectors: ["Web3"],
        url: `https://luma.com/${slug}`,
        description: "用户指定活动",
        source: "luma",
      });
      // 尝试用 query=slug 再搜一次补全名称
      try {
        const more = await fetchLumaDiscover({ query: slug, limit: 5 });
        events = [...more, ...events];
      } catch {
        /* ignore */
      }
    }
  }

  if (opts.type) {
    const t = opts.type.toLowerCase();
    events = events.filter(
      (e) =>
        e.event_type.toLowerCase().includes(t) ||
        e.title.toLowerCase().includes(t)
    );
  }

  // 城市软过滤：若指定城市，优先保留同城，但相关度高的也可保留
  if (opts.city) {
    const c = opts.city.toLowerCase();
    const same = events.filter((e) => e.city.toLowerCase().includes(c));
    const other = events.filter((e) => !e.city.toLowerCase().includes(c));
    events = [...same, ...other];
  }

  events = events.map((e) => scoreEventRelevance(e, opts.profile));
  // 只保留有一定相关度的（简历强相关）
  const minScore = opts.profile ? 35 : 0;
  events = events
    .filter((e) => (e.relevance_score || 0) >= minScore)
    .sort((a, b) => (b.relevance_score || 0) - (a.relevance_score || 0));

  // 若过滤太狠，放宽
  if (events.length < 3 && opts.profile) {
    const all = (await fetchLumaDiscover({ city: opts.city, limit: 30 })).map(
      (e) => scoreEventRelevance(e, opts.profile)
    );
    events = all.sort(
      (a, b) => (b.relevance_score || 0) - (a.relevance_score || 0)
    );
  }

  saveEvents(events);
  return events;
}

export async function fetchLumaEvent(url: string): Promise<EventItem | null> {
  const slug = url
    .replace(/^https?:\/\/(www\.)?luma\.com\//, "")
    .split("?")[0]
    .replace(/\/$/, "");
  if (!slug) return null;
  try {
    const list = await fetchLumaDiscover({ query: slug, limit: 10 });
    const hit =
      list.find((e) => e.url.includes(slug)) ||
      list[0] ||
      null;
    if (hit) return hit;
  } catch {
    /* fallthrough */
  }
  return {
    id: fingerprint(["luma", slug]),
    title: slug,
    city: "",
    event_type: "event",
    sectors: ["Web3"],
    url: `https://luma.com/${slug}`,
    description: "",
    source: "luma",
  };
}

export async function briefEvent(
  event: EventItem,
  profile?: Profile | null
): Promise<string> {
  if (hasLlm() && profile) {
    try {
      return await chatText([
        {
          role: "system",
          content:
            "为 Web3 networking 写活动 briefing + 30 秒自我介绍。中文。基于简历相关性说明为什么值得去。不要编造嘉宾。",
        },
        {
          role: "user",
          content: JSON.stringify({
            event,
            profile: {
              name: profile.display_name,
              role: profile.primary_role,
              titles: profile.target_titles,
              summary: profile.summary,
              highlights: profile.highlights,
            },
          }),
        },
      ]);
    } catch {
      /* fallthrough */
    }
  }
  return [
    `# ${event.title}`,
    ``,
    `- 城市: ${event.city || "unknown"}`,
    `- 时间: ${event.start_at || "unknown"}`,
    `- 类型: ${event.event_type}`,
    `- 相关度: ${event.relevance_score ?? "—"}`,
    `- 链接: ${event.url}`,
    ``,
    `## 为什么与你相关`,
    event.why_attend || "—",
    ``,
    `## 简介`,
    event.description || "—",
    ``,
    `## 30s 破冰`,
    profile
      ? `你好，我是 ${profile.display_name || ""}，方向 ${profile.primary_role}${profile.target_titles?.[0] ? `（目标 ${profile.target_titles[0]}）` : ""}。${profile.summary || ""} 想认识做相关方向的朋友。`
      : `你好，我是 Web3 从业者，想交流一下。`,
  ].join("\n");
}
