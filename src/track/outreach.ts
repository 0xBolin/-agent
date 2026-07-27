/**
 * Phase 2：触达节奏 — 联系人状态 + 跟进日 + 话术
 */
import crypto from "node:crypto";
import fs from "node:fs";
import type { OutreachContact, OutreachStatus } from "../types.js";
import { ensureDataDirs, files } from "../paths.js";
import { getProfile } from "../profile/setup.js";

export const OUTREACH_STATUSES: OutreachStatus[] = [
  "todo",
  "messaged",
  "replied",
  "referred",
];

function loadAll(): OutreachContact[] {
  ensureDataDirs();
  const p = files.outreach();
  if (!fs.existsSync(p)) return [];
  try {
    const raw = JSON.parse(fs.readFileSync(p, "utf8"));
    return Array.isArray(raw) ? (raw as OutreachContact[]) : [];
  } catch {
    return [];
  }
}

function saveAll(list: OutreachContact[]): void {
  ensureDataDirs();
  fs.writeFileSync(files.outreach(), JSON.stringify(list, null, 2), "utf8");
}

export function isOutreachOverdue(
  c: OutreachContact,
  now = new Date()
): boolean {
  if (!c.next_follow_up_at) return false;
  if (c.status === "replied" || c.status === "referred") return false;
  const t = Date.parse(c.next_follow_up_at);
  if (Number.isNaN(t)) return false;
  return t < now.getTime();
}

export function listOutreach(): (OutreachContact & { overdue: boolean })[] {
  return loadAll()
    .map((c) => ({ ...c, overdue: isOutreachOverdue(c) }))
    .sort((a, b) => {
      const af = a.next_follow_up_at || "9999";
      const bf = b.next_follow_up_at || "9999";
      if (af !== bf) return af.localeCompare(bf);
      return (b.updated_at || "").localeCompare(a.updated_at || "");
    });
}

export function addOutreach(input: {
  company: string;
  who: string;
  job_title?: string;
  linkedin_url?: string;
  x_url?: string;
  dm_draft?: string;
  notes?: string;
  follow_up_days?: number;
}): { contact: OutreachContact; created: boolean } {
  const list = loadAll();
  const existing = list.find(
    (c) =>
      c.company.toLowerCase() === input.company.toLowerCase() &&
      c.who.toLowerCase() === input.who.toLowerCase()
  );
  if (existing) return { contact: existing, created: false };

  const now = new Date();
  const days = input.follow_up_days ?? 3;
  const follow = new Date(now.getTime() + days * 86400000)
    .toISOString()
    .slice(0, 10);
  const contact: OutreachContact = {
    id: `or_${crypto.randomBytes(6).toString("hex")}`,
    company: input.company,
    who: input.who,
    job_title: input.job_title,
    status: "todo",
    next_follow_up_at: follow,
    linkedin_url: input.linkedin_url,
    x_url: input.x_url,
    dm_draft: input.dm_draft || defaultDm(input),
    notes: input.notes,
    created_at: now.toISOString(),
    updated_at: now.toISOString(),
    timeline: [{ at: now.toISOString(), status: "todo", note: "加入触达" }],
  };
  list.unshift(contact);
  saveAll(list);
  return { contact, created: true };
}

function defaultDm(input: {
  company: string;
  who: string;
  job_title?: string;
}): string {
  const p = getProfile();
  const name = p?.display_name || "";
  const proof = (p?.proof_items || p?.highlights || []).slice(0, 1)[0] || "";
  const role = p?.primary_role || "";
  const social = [
    p?.social?.x,
    p?.social?.linkedin,
    p?.social?.github,
  ]
    .filter(Boolean)
    .join(" · ");
  const job = input.job_title ? `的 ${input.job_title}` : "";
  return `Hi，我是${name || "求职者"}，关注到 ${input.company}${job}。主方向 ${role}${proof ? `；代表成果：${proof}` : ""}。想请教作为 ${input.who} 更看重什么，方便 10 分钟聊聊吗？${social ? `\n${social}` : ""}`;
}

/** D+3 / D+7 跟进话术 */
export function followUpDrafts(
  c: OutreachContact,
  lang: "zh" | "en" = "zh"
): { d3: string; d7: string } {
  const p = getProfile();
  const name = p?.display_name || (lang === "en" ? "there" : "你好");
  if (lang === "en") {
    return {
      d3: `Hi, following up on my note about ${c.company}${c.job_title ? ` / ${c.job_title}` : ""}. Happy to share a 1-pager on how I can help — open to a quick chat?`,
      d7: `Hi again — last nudge on ${c.company}. If timing is off, no worries; glad to stay in touch for future roles.`,
    };
  }
  return {
    d3: `Hi ${name === "你好" ? "" : ""}，跟进一下关于 ${c.company}${c.job_title ? ` / ${c.job_title}` : ""} 的消息。方便的话我可以补一页简短说明，或约 10 分钟聊聊。`,
    d7: `再跟一次 ${c.company}：如果现在不招/时机不对也完全理解，欢迎之后有机会再联系。`,
  };
}

export function patchOutreach(
  id: string,
  patch: {
    status?: OutreachStatus;
    next_follow_up_at?: string | null;
    notes?: string;
    dm_draft?: string;
  }
): OutreachContact | null {
  const list = loadAll();
  const i = list.findIndex((c) => c.id === id);
  if (i < 0) return null;
  const c = list[i];
  const now = new Date().toISOString();
  if (patch.status && patch.status !== c.status) {
    c.status = patch.status;
    c.timeline = c.timeline || [];
    c.timeline.push({ at: now, status: patch.status, note: "状态更新" });
    // 已私信默认 +3 天跟进
    if (patch.status === "messaged" && !patch.next_follow_up_at) {
      const d = new Date();
      d.setDate(d.getDate() + 3);
      c.next_follow_up_at = d.toISOString().slice(0, 10);
    }
  }
  if (patch.next_follow_up_at === null) delete c.next_follow_up_at;
  else if (typeof patch.next_follow_up_at === "string")
    c.next_follow_up_at = patch.next_follow_up_at;
  if (patch.notes !== undefined) c.notes = patch.notes;
  if (patch.dm_draft !== undefined) c.dm_draft = patch.dm_draft;
  c.updated_at = now;
  list[i] = c;
  saveAll(list);
  return c;
}

export function deleteOutreach(id: string): boolean {
  const list = loadAll();
  const next = list.filter((c) => c.id !== id);
  if (next.length === list.length) return false;
  saveAll(next);
  return true;
}

export function outreachSummary() {
  const items = listOutreach();
  const overdue = items.filter((c) => c.overdue);
  const by_status: Record<string, number> = {};
  for (const c of items) {
    by_status[c.status] = (by_status[c.status] || 0) + 1;
  }
  return {
    total: items.length,
    overdue_count: overdue.length,
    by_status,
    items,
    overdue: overdue.slice(0, 10),
  };
}
