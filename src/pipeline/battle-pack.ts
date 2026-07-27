/**
 * Phase 2：一岗一策作战包 C
 */
import type { Job, Profile } from "../types.js";
import { formatProofCard } from "../profile/proof.js";

function cleanCompany(company: string): string {
  return company
    .replace(/^@/, "")
    .replace(/\s+/g, " ")
    .replace(/\s*(Inc\.?|Ltd\.?|LLC|Limited|协议|公司)\s*$/i, "")
    .trim();
}

export interface BattlePack {
  job_id: string;
  company: string;
  title: string;
  source_url: string;
  score?: number;
  why: string[];
  risks: string[];
  opening_zh: string;
  opening_en: string;
  bullet_fixes: string[];
  contact: {
    who: string;
    linkedin_url: string;
    x_url: string;
    dm_draft: string;
  };
  proof_items: string[];
  social: { x?: string; linkedin?: string; github?: string };
  generated_at: string;
  lang: "zh" | "en";
}

export function buildBattlePack(
  profile: Profile,
  job: Job,
  lang: "zh" | "en" = "zh"
): BattlePack {
  const proof = formatProofCard(profile, lang);
  const score = job.match?.score;
  const strengths = job.match?.strengths || [];
  const gaps = job.match?.gaps || [];
  const name = profile.display_name || (lang === "en" ? "I" : "我");
  const role = profile.primary_role;
  const skills = (profile.skills || []).slice(0, 5).join(lang === "en" ? ", " : "、");

  const why: string[] = [];
  if (strengths.length) {
    why.push(...strengths.slice(0, 3));
  } else {
    if (job.role_family === role) {
      why.push(
        lang === "en"
          ? `Role family matches your primary track (${role})`
          : `岗位角色线与你的主方向（${role}）一致`
      );
    }
    if (skills) {
      why.push(
        lang === "en"
          ? `Skills overlap: ${skills}`
          : `技能相关：${skills}`
      );
    }
    if (proof.items[0]) {
      why.push(
        lang === "en"
          ? `Proof you can cite: ${proof.items[0]}`
          : `可引用证明：${proof.items[0]}`
      );
    }
  }
  if (!why.length) {
    why.push(
      lang === "en"
        ? "Worth a targeted apply — tailor your opening to the JD"
        : "值得定向投递——opening 请按 JD 定制"
    );
  }

  const risks = gaps.slice(0, 3);
  if (!risks.length) {
    risks.push(
      lang === "en"
        ? "No strong gap flagged — still personalize and follow up"
        : "未标明显缺口，仍需个性化 opening 并跟进"
    );
  }

  const proofLine = proof.items[0] || profile.summary || "";
  const opening_zh = `你好，我是${name}，关注到 ${job.company} 的 ${job.title}。我主方向 ${role}${proofLine ? `，代表成果：${proofLine}` : ""}。希望有机会进一步交流该角色更看重什么。`;
  const opening_en = `Hi, I'm ${name}. I saw the ${job.title} role at ${job.company}. My focus is ${role}${proofLine ? `; proof point: ${proofLine}` : ""}. Open to a short chat on what you weight most for this hire.`;

  const bullet_fixes = [
    lang === "en"
      ? `Lead with a metric bullet tied to ${job.title} (%, users, deals, or time)`
      : `用一条带数字的 bullet 对齐 ${job.title}（%、用户、合作数或周期）`,
    lang === "en"
      ? `Mirror 2–3 JD keywords in your top skills line: scan the posting once`
      : `从 JD 摘 2–3 个关键词写进技能行`,
    lang === "en"
      ? `Add one line on remote/async collab if the role is distributed`
      : `若岗位偏远程，补一条异步协作/跨时区交付的经历`,
  ];

  const companyClean = cleanCompany(job.company);
  const whoSearch =
    job.role_family === "BD"
      ? "Head of BD OR Growth Lead"
      : job.role_family === "Community"
        ? "Community Lead"
        : "Hiring Manager";
  // inline links without importing private helpers that may not exist
  const peopleQ = `${whoSearch} ${companyClean}`;
  const linkedin_url = `https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(peopleQ)}`;
  const x_url = `https://x.com/search?q=${encodeURIComponent(`${companyClean} (${whoSearch})`)}&f=user`;
  const who =
    lang === "en"
      ? whoSearch.split(" OR ")[0]
      : job.role_family === "BD"
        ? "BD / Growth 负责人"
        : job.role_family === "Community"
          ? "Community Lead"
          : "Hiring Manager";

  const socialBit = [proof.social.x, proof.social.linkedin, proof.social.github]
    .filter(Boolean)
    .join(" · ");
  const dm_draft =
    lang === "en"
      ? `${opening_en}${socialBit ? `\n${socialBit}` : ""}`
      : `${opening_zh}${socialBit ? `\n${socialBit}` : ""}`;

  return {
    job_id: job.id,
    company: job.company,
    title: job.title,
    source_url: job.source_url,
    score,
    why: why.slice(0, 3),
    risks: risks.slice(0, 3),
    opening_zh,
    opening_en,
    bullet_fixes,
    contact: { who, linkedin_url, x_url, dm_draft },
    proof_items: proof.items,
    social: proof.social,
    generated_at: new Date().toISOString(),
    lang,
  };
}
