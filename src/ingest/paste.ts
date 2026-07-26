import type { Job } from "../types.js";
import { fingerprint, truncate } from "../util/text.js";
import { inferRemote, inferRoleFamily } from "./role.js";

/** 粘贴 JD / TG 转发文本 → Job */
export function parsePastedJd(
  text: string,
  opts: { source?: Job["source"]; sourceUrl?: string } = {}
): Job {
  const lines = text
    .split(/\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  const first = lines[0] || "Pasted role";
  let title = first.slice(0, 120);
  let company = "Unknown";

  const companyMatch = text.match(
    /(?:公司|Company|协议|Protocol)[:：\s]+([^\n]{2,60})/i
  );
  if (companyMatch) company = companyMatch[1].trim();

  const titleMatch = text.match(
    /(?:岗位|职位|Role|Title|招聘)[:：\s]+([^\n]{2,80})/i
  );
  if (titleMatch) title = titleMatch[1].trim();

  // TG 常见：【公司】岗位
  const bracket = first.match(/【([^】]+)】\s*(.+)/);
  if (bracket) {
    company = bracket[1];
    title = bracket[2];
  }

  const source = opts.source || "paste";
  const sourceUrl = opts.sourceUrl || "";
  const id = fingerprint([source, title, company, text.slice(0, 200)]);

  return {
    id,
    source,
    source_url: sourceUrl || `paste://${id}`,
    scraped_at: new Date().toISOString(),
    company,
    title,
    role_family: inferRoleFamily(title, text),
    description_raw: text,
    description_clean: truncate(text, 6000),
    location: "",
    remote_type: inferRemote("", text),
    comp_hint: "",
    tags: [],
    legitimacy_flags: scamHeuristics(text),
  };
}

export function scamHeuristics(text: string): string[] {
  const flags: string[] = [];
  const t = text.toLowerCase();
  if (/先付|保证金|培训费|gas fee.*refund|投资.*返利/.test(text)) {
    flags.push("pay_to_apply_or_fee_risk");
  }
  if (/whatsapp only|只加微信.*日入|日入过万/.test(t + text)) {
    flags.push("suspicious_income_claim");
  }
  if (/send.*seed phrase|助记词|private key/.test(t)) {
    flags.push("credential_theft_risk");
  }
  return flags;
}
