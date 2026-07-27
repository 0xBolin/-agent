/**
 * PDF 简历解析 → 文本 + 姓名/地区/教育/经历/技能
 *
 * 抽文本：pdf-parse v2（PDFParse 类 + getText）
 * 结构化：有 OPENAI_API_KEY 时用 LLM；否则启发式
 */
import { createRequire } from "node:module";
import { hasLlm } from "../config.js";
import { chatJson } from "../llm/client.js";
import type { RoleFamily } from "../types.js";

const require = createRequire(import.meta.url);
// pdf-parse@2.x：导出 { PDFParse }，不再是 v1 的 pdf(buffer) 函数
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const pdfMod = require("pdf-parse") as {
  PDFParse: new (opts: { data: Uint8Array | Buffer }) => {
    getText: () => Promise<{ text?: string; pages?: { text?: string }[] }>;
    getInfo?: () => Promise<{ total?: number }>;
    destroy?: () => Promise<void>;
  };
};

export interface ResumeEducation {
  school?: string;
  degree?: string;
  period?: string;
  details?: string;
}

export interface ResumeExperience {
  title?: string;
  company?: string;
  period?: string;
  bullets?: string[];
}

export interface ResumeParseResult {
  resume_text: string;
  /** 解析出的姓名 */
  name?: string;
  /** 解析出的地区/城市 */
  location?: string;
  summary: string;
  skills: string[];
  keywords: string[];
  experiences: ResumeExperience[];
  education: ResumeEducation[];
  highlights: string[];
  suggested_titles: string[];
  suggested_role?: RoleFamily;
  pages?: number;
  method: "llm" | "heuristic";
  extract_engine: string;
}

const SKILL_DICT = [
  "Solidity",
  "Rust",
  "TypeScript",
  "JavaScript",
  "React",
  "Next.js",
  "Node",
  "Python",
  "Go",
  "Java",
  "BD",
  "Business Development",
  "Partnerships",
  "Growth",
  "Community",
  "Discord",
  "Telegram",
  "Research",
  "Tokenomics",
  "Audit",
  "Security",
  "Slither",
  "Foundry",
  "Hardhat",
  "Product",
  "Figma",
  "SQL",
  "DeFi",
  "NFT",
  "ZK",
  "Ethereum",
  "Solana",
  "EVM",
  "English",
  "Mandarin",
  "SEA",
  "Marketing",
  "Content",
  "Operations",
  "Sales",
  "CRM",
  "GTM",
  "KOL",
];

const SECTION_RE =
  /^(education|experience|work experience|web3 experience|professional experience|employment|projects?|activities|skills?|languages?|summary|profile|about|教育|工作经历|实习经历|项目经历|项目经验|技能|语言|个人简介|经历|活动)\b/i;

export async function extractTextFromPdf(
  buffer: Buffer
): Promise<{ text: string; pages?: number; engine: string }> {
  if (!buffer?.length) {
    throw new Error("空文件");
  }
  const head = buffer.subarray(0, 5).toString("utf8");
  if (!head.startsWith("%PDF")) {
    throw new Error("不是有效的 PDF 文件（文件头校验失败）");
  }

  if (!pdfMod?.PDFParse) {
    throw new Error(
      "pdf-parse 模块加载失败。请在项目目录执行：npm install pdf-parse"
    );
  }

  let parser: InstanceType<typeof pdfMod.PDFParse> | null = null;
  try {
    parser = new pdfMod.PDFParse({ data: new Uint8Array(buffer) });
    const result = await parser.getText();
    let text = (result?.text || "").trim();
    if (!text && Array.isArray(result?.pages)) {
      text = result.pages
        .map((p) => p?.text || "")
        .join("\n")
        .trim();
    }
    text = normalizeResumeText(text);

    let pages: number | undefined;
    try {
      const info = await parser.getInfo?.();
      pages = info?.total ?? result?.pages?.length;
    } catch {
      pages = result?.pages?.length;
    }

    if (!text || text.length < 20) {
      throw new Error(
        "未能从 PDF 提取有效文字。常见原因：扫描件/图片型 PDF（无文字层）。请导出为「可选中文字」的 PDF，或把简历另存为文本后再试。"
      );
    }
    return { text, pages, engine: "pdf-parse@2/PDFParse.getText" };
  } catch (e) {
    const msg = (e as Error).message || String(e);
    if (msg.includes("未能从 PDF") || msg.includes("不是有效")) throw e;
    if (/password|encrypted/i.test(msg)) {
      throw new Error("PDF 已加密，请先解除密码保护后再上传");
    }
    throw new Error(`PDF 解析失败：${msg}`);
  } finally {
    try {
      await parser?.destroy?.();
    } catch {
      /* ignore */
    }
  }
}

/** 清理 PDF 提取噪声（tab / 特殊 bullet） */
export function normalizeResumeText(text: string): string {
  return text
    .replace(/\u0000/g, "")
    .replace(/\t+/g, " ")
    .replace(/[ \u00a0]+/g, " ")
    .replace(/[•●▪◦]/g, "·")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export async function parseResumeText(
  text: string,
  opts?: { pages?: number; extract_engine?: string }
): Promise<ResumeParseResult> {
  const resume_text = normalizeResumeText(text).slice(0, 50000);
  if (hasLlm()) {
    try {
      const llm = await chatJson<{
        name?: string;
        location?: string;
        summary?: string;
        skills?: string[];
        keywords?: string[];
        experiences?: ResumeExperience[];
        education?: ResumeEducation[];
        highlights?: string[];
        suggested_titles?: string[];
        suggested_role?: string;
      }>([
        {
          role: "system",
          content: `你是简历解析器。从简历文本提取 JSON，字段：
name(string 姓名),
location(string 城市/地区，如 Hong Kong / Singapore，不含电话邮箱),
summary(string 一句话简介，勿只贴联系方式),
skills(string[] 技能),
keywords(string[] 岗位/行业关键词),
experiences([{title, company, period, bullets[]}] 工作/实习，按时间新→旧),
education([{school, degree, period, details}] 教育经历),
highlights(string[] 3条内可量化亮点),
suggested_titles(string[] 适合投的岗位 title),
suggested_role(BD|Community|Research|Security|Product|Engineering|Other)。
不要编造简历没有的经历。`,
        },
        {
          role: "user",
          content: resume_text.slice(0, 12000),
        },
      ]);
      const heuristic = heuristicAll(resume_text);
      return {
        resume_text,
        name: cleanName(llm.name) || heuristic.name,
        location: cleanLocation(llm.location) || heuristic.location,
        summary:
          cleanSummary(llm.summary) ||
          heuristic.summary ||
          heuristicSummary(resume_text),
        skills: uniq([...(llm.skills || []), ...guessSkills(resume_text)]).slice(
          0,
          24
        ),
        keywords: uniq([
          ...(llm.keywords || []),
          ...guessKeywords(resume_text),
        ]).slice(0, 20),
        experiences:
          llm.experiences?.length && !isNoisyExperiences(llm.experiences)
            ? llm.experiences
            : heuristic.experiences,
        education: llm.education?.length
          ? llm.education
          : heuristic.education,
        highlights: (llm.highlights || heuristic.highlights).slice(0, 5),
        suggested_titles: (llm.suggested_titles || []).slice(0, 5),
        suggested_role: (llm.suggested_role as RoleFamily) || undefined,
        pages: opts?.pages,
        method: "llm",
        extract_engine: opts?.extract_engine || "text",
      };
    } catch (e) {
      console.warn("[resume] LLM parse fallback:", (e as Error).message);
    }
  }
  const h = heuristicAll(resume_text);
  return {
    resume_text,
    name: h.name,
    location: h.location,
    summary: h.summary,
    skills: h.skills,
    keywords: h.keywords,
    experiences: h.experiences,
    education: h.education,
    highlights: h.highlights,
    suggested_titles: h.suggested_titles,
    suggested_role: h.suggested_role,
    pages: opts?.pages,
    method: "heuristic",
    extract_engine: opts?.extract_engine || "text",
  };
}

export async function parseResumePdf(
  buffer: Buffer
): Promise<ResumeParseResult> {
  const { text, pages, engine } = await extractTextFromPdf(buffer);
  return parseResumeText(text, { pages, extract_engine: engine });
}

function heuristicAll(text: string): {
  name?: string;
  location?: string;
  summary: string;
  skills: string[];
  keywords: string[];
  experiences: ResumeExperience[];
  education: ResumeEducation[];
  highlights: string[];
  suggested_titles: string[];
  suggested_role?: RoleFamily;
} {
  const lines = text
    .split(/\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  const name = extractName(lines);
  const location = extractLocation(lines, text);
  const education = extractEducation(lines);
  const experiences = extractExperiences(lines);
  const skills = guessSkills(text);
  const keywords = guessKeywords(text);
  const highlights = extractHighlights(lines, experiences);
  const role = suggestRole(text, experiences, skills);
  const titles = suggestTitles(role, experiences);
  const summary =
    buildSummary(name, location, experiences, education) ||
    heuristicSummary(text);

  return {
    name,
    location,
    summary,
    skills,
    keywords,
    experiences,
    education,
    highlights,
    suggested_titles: titles,
    suggested_role: role,
  };
}

function extractName(lines: string[]): string | undefined {
  for (const l of lines.slice(0, 6)) {
    if (SECTION_RE.test(l)) continue;
    if (/@|http|www\.|\+\d|phone|email|linkedin/i.test(l)) continue;
    // LIU, BOLIN (BOLIN) / Bolin Liu / 刘柏林
    if (
      /^[A-Z][A-Za-z]+(?:[,\s]+[A-Z][A-Za-z]+){0,3}(?:\s*\([^)]+\))?$/.test(
        l
      ) &&
      l.length < 60
    ) {
      return cleanName(l);
    }
    if (/^[\u4e00-\u9fff]{2,8}$/.test(l)) return l;
  }
  return undefined;
}

function cleanName(n?: string): string | undefined {
  if (!n) return undefined;
  let s = n.replace(/\s+/g, " ").trim();
  // LIU, BOLIN (BOLIN) → Bolin Liu
  const m = s.match(/^([A-Z]+),\s*([A-Z][A-Za-z]+)(?:\s*\([^)]+\))?$/i);
  if (m) {
    s = `${capitalize(m[2])} ${capitalize(m[1])}`;
  } else {
    s = s.replace(/\s*\([^)]*\)\s*$/, "").trim();
  }
  if (s.length < 2 || s.length > 48) return undefined;
  if (/education|experience|skills|resume|curriculum/i.test(s)) return undefined;
  return s;
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
}

function extractLocation(lines: string[], text: string): string | undefined {
  const cityDict = [
    "Hong Kong",
    "Singapore",
    "Shanghai",
    "Beijing",
    "Shenzhen",
    "Guangzhou",
    "Hangzhou",
    "Chengdu",
    "Dubai",
    "London",
    "New York",
    "San Francisco",
    "Tokyo",
    "Seoul",
    "Bangkok",
    "Jakarta",
    "Kuala Lumpur",
    "Taipei",
    "Remote",
    "香港",
    "新加坡",
    "上海",
    "北京",
    "深圳",
    "广州",
  ];
  for (const l of lines.slice(0, 8)) {
    // Kowloon Tong, Hong Kong · +852 ...
    const locLine = l.split(/[·|•▪]|(\s{2,})/)[0]?.trim() || l;
    for (const c of cityDict) {
      if (new RegExp(c, "i").test(locLine) && !/@/.test(locLine)) {
        // Prefer "Hong Kong" over full "Kowloon Tong, Hong Kong" if too long with phone
        const cleaned = cleanLocation(
          locLine
            .replace(/\+\d[\d\s\-()]+.*/, "")
            .replace(/[\w.+-]+@[\w.-]+.*/, "")
            .replace(/[·•].*$/, "")
            .trim()
        );
        if (cleaned) return cleaned;
        return c;
      }
    }
  }
  for (const c of cityDict) {
    if (new RegExp(`\\b${c}\\b`, "i").test(text)) return c;
  }
  return undefined;
}

function cleanLocation(loc?: string): string | undefined {
  if (!loc) return undefined;
  let s = loc.replace(/\s+/g, " ").trim();
  s = s.replace(/[·•|,;]+$/, "").trim();
  if (s.length < 2 || s.length > 80) return undefined;
  if (/@|\+\d{6,}/.test(s)) {
    s = s
      .replace(/\+\d[\d\s\-()]+.*/, "")
      .replace(/[\w.+-]+@[\w.-]+.*/, "")
      .trim();
  }
  if (!s || /@|\+\d{6,}/.test(s)) return undefined;
  return s;
}

function extractEducation(lines: string[]): ResumeEducation[] {
  const out: ResumeEducation[] = [];
  let i = 0;
  while (i < lines.length) {
    if (/^education\b|^教育/i.test(lines[i])) {
      i++;
      while (i < lines.length && !SECTION_RE.test(lines[i])) {
        const school = lines[i];
        if (
          /university|college|school|institute|academy|大学|学院/i.test(school)
        ) {
          const degree = lines[i + 1] || "";
          const period =
            (school + " " + degree).match(
              /(?:Expected\s+)?(?:Graduat\w+\s*:?\s*)?(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)?\.?\s*\d{4}(?:\s*[-–—]\s*(?:Present|今|现在|至今|(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)?\.?\s*\d{4}))?/i
            )?.[0] ||
            degree.match(/20\d{2}/)?.[0] ||
            undefined;
          out.push({
            school: school
              .replace(
                /\s*(Expected\s+)?Graduat.*$/i,
                ""
              )
              .replace(/\s*20\d{2}.*$/, "")
              .trim()
              .slice(0, 120),
            degree: degree
              .replace(
                /\s*(Expected\s+)?Graduat.*$/i,
                ""
              )
              .replace(/\s*(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\.?\s*20\d{2}.*$/i, "")
              .replace(/\s*20\d{2}.*$/, "")
              .trim()
              .slice(0, 120) || undefined,
            period: period?.trim(),
            details: lines
              .slice(i + 2, i + 4)
              .filter((l) => /GPA|President|Award|Club|获奖/i.test(l))
              .join(" · ")
              .slice(0, 200) || undefined,
          });
          i += degree && !SECTION_RE.test(degree) ? 2 : 1;
          continue;
        }
        i++;
      }
      break;
    }
    i++;
  }
  return out.slice(0, 4);
}

function extractExperiences(lines: string[]): ResumeExperience[] {
  const out: ResumeExperience[] = [];
  // Find experience section start
  let start = lines.findIndex((l) =>
    /^(web3\s+)?experience\b|^work experience\b|^professional experience\b|^employment\b|^工作经历|^实习|^项目经历/i.test(
      l
    )
  );
  if (start < 0) {
    // fallback: scan whole resume for dated job blocks
    start = 0;
  } else {
    start += 1;
  }

  let end = lines.length;
  for (let j = start; j < lines.length; j++) {
    if (
      j > start &&
      /^(education|skills?|projects?|activities|languages?|教育|技能|项目|活动)\b/i.test(
        lines[j]
      )
    ) {
      end = j;
      break;
    }
  }

  const periodRe =
    /(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s*20\d{2}\s*[-–—]\s*(?:(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s*20\d{2}|Present|今|现在|至今)|20\d{2}\s*[-–—]\s*(?:20\d{2}|Present|今|现在|至今)/i;

  let i = start;
  while (i < end && out.length < 8) {
    const line = lines[i];
    if (SECTION_RE.test(line) && !/experience/i.test(line)) {
      i++;
      continue;
    }
    // Company line often ALL CAPS or ends with REMOTE / city
    const next = lines[i + 1] || "";
    const next2 = lines[i + 2] || "";
    const combined = `${line} ${next}`;

    const hasPeriod =
      periodRe.test(line) || periodRe.test(next) || periodRe.test(combined);

    const looksCompany =
      (line === line.toUpperCase() && line.length > 3 && line.length < 80) ||
      /\b(LIMITED|LTD|INC|LLC|LABS|PROTOCOL|AGENCY|FOUNDATION|DAO)\b/i.test(
        line
      ) ||
      /\bREMOTE\b/i.test(line);

    const looksTitle =
      /manager|director|lead|engineer|developer|analyst|intern|specialist|associate|bd|sales|marketing|research|founder|president|member|coordinator|officer/i.test(
        line
      ) ||
      /经理|专员|工程师|实习生|负责人/.test(line);

    if (looksCompany && (hasPeriod || looksTitle || periodRe.test(next))) {
      let company = line.replace(/\bREMOTE\b/gi, "").trim();
      let title = "";
      let period = "";
      let bulletStart = i + 1;

      // Pattern A: COMPANY \n Title Period
      if (periodRe.test(next) || looksTitleLike(next)) {
        const pm = next.match(periodRe);
        period = pm?.[0] || "";
        title = next.replace(periodRe, "").trim();
        bulletStart = i + 2;
      }
      // Pattern B: COMPANY Title on same-ish block
      if (!title && looksTitleLike(next2)) {
        const pm = next2.match(periodRe);
        period = pm?.[0] || period;
        title = next2.replace(periodRe, "").trim();
        bulletStart = i + 3;
      }

      // Pattern: title line with period embedded
      if (!title && periodRe.test(line) && looksTitle) {
        const pm = line.match(periodRe);
        period = pm?.[0] || "";
        title = line.replace(periodRe, "").trim();
        company = next.length < 80 ? next : company;
        bulletStart = i + 2;
      }

      if (!title) {
        // try "Business Development & Sales Manager Mar 2026 – Jun 2026"
        for (let k = i + 1; k < Math.min(i + 4, end); k++) {
          if (looksTitleLike(lines[k]) || periodRe.test(lines[k])) {
            const pm = lines[k].match(periodRe);
            period = pm?.[0] || period;
            title = lines[k].replace(periodRe, "").trim() || title;
            bulletStart = k + 1;
            break;
          }
        }
      }

      const bullets: string[] = [];
      let j = bulletStart;
      while (j < end && bullets.length < 6) {
        const b = lines[j];
        if (
          looksCompany &&
          b === b.toUpperCase() &&
          b.length > 3 &&
          !/^[-·•]/.test(b)
        ) {
          break;
        }
        if (SECTION_RE.test(b)) break;
        if (
          periodRe.test(b) &&
          looksTitleLike(b) &&
          bullets.length > 0
        ) {
          break;
        }
        if (
          /^[-·•*]/.test(b) ||
          (b.length > 40 &&
            !looksCompanyLine(b) &&
            !SECTION_RE.test(b))
        ) {
          bullets.push(b.replace(/^[-·•*]+\s*/, "").slice(0, 300));
          j++;
          continue;
        }
        // next company-like
        if (looksCompanyLine(b) && j > bulletStart) break;
        j++;
        if (j - bulletStart > 8) break;
      }

      if (title || company) {
        out.push({
          company: cleanCompany(company),
          title: title?.slice(0, 100) || undefined,
          period: period || undefined,
          bullets,
        });
      }
      i = Math.max(j, i + 1);
      continue;
    }

    // Social / creator blocks: "X CONTENT CREATOR" + role + period
    if (
      /content creator|core member|lighthouse|kol|community/i.test(line) &&
      (periodRe.test(next) || periodRe.test(line) || periodRe.test(next2))
    ) {
      const period =
        line.match(periodRe)?.[0] ||
        next.match(periodRe)?.[0] ||
        next2.match(periodRe)?.[0] ||
        "";
      out.push({
        company: cleanCompany(line.replace(periodRe, "").trim()),
        title: next.replace(periodRe, "").trim().slice(0, 100) || undefined,
        period: period || undefined,
        bullets: [],
      });
      i += 2;
      continue;
    }

    i++;
  }

  // Filter noisy first-line name/contact as experience
  return out.filter(
    (e) =>
      !isNoisyExperience(e) &&
      (e.title || e.company) &&
      !/@|\+\d{8,}/.test(`${e.title || ""} ${e.company || ""}`)
  );
}

function looksTitleLike(s: string): boolean {
  return (
    /manager|director|lead|engineer|developer|analyst|intern|specialist|associate|bd|sales|marketing|research|founder|president|member|coordinator|officer|creator/i.test(
      s
    ) || /经理|专员|工程师|实习生|负责人/.test(s)
  );
}

function looksCompanyLine(s: string): boolean {
  return (
    (s === s.toUpperCase() && s.length > 3 && s.length < 80) ||
    /\b(LIMITED|LTD|INC|LLC|LABS|PROTOCOL|AGENCY|FOUNDATION)\b/i.test(s)
  );
}

function cleanCompany(c: string): string {
  return c
    .replace(/\bREMOTE\b/gi, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 100);
}

function isNoisyExperience(e: ResumeExperience): boolean {
  const blob = `${e.title || ""} ${e.company || ""}`;
  if (/@|\+\d{6,}/.test(blob)) return true;
  if (/^(LIU|LIU,)/i.test(blob) && /@|\+/.test(blob)) return true;
  if (!e.bullets?.length && !e.period && (e.title?.length || 0) > 60) return true;
  return false;
}

function isNoisyExperiences(list: ResumeExperience[]): boolean {
  if (!list.length) return true;
  return list.every(isNoisyExperience);
}

function extractHighlights(
  lines: string[],
  experiences: ResumeExperience[]
): string[] {
  const fromBullets = experiences
    .flatMap((e) => e.bullets || [])
    .filter((l) => l.length > 24 && l.length < 200 && /\d|%|\$|x\b/i.test(l))
    .slice(0, 3);
  if (fromBullets.length) return fromBullets;
  return lines
    .map((l) => l.replace(/^[-·•*]\s*/, "").trim())
    .filter(
      (l) =>
        l.length > 20 &&
        l.length < 160 &&
        /\d|%|\$|增长|主导|负责|boost|scaled|drove/i.test(l)
    )
    .slice(0, 3);
}

function suggestRole(
  text: string,
  experiences: ResumeExperience[],
  skills: string[]
): RoleFamily | undefined {
  const blob = (
    text +
    " " +
    experiences.map((e) => `${e.title} ${e.company}`).join(" ") +
    " " +
    skills.join(" ")
  ).toLowerCase();
  const scores: Record<string, number> = {
    BD: 0,
    Community: 0,
    Research: 0,
    Security: 0,
    Product: 0,
    Engineering: 0,
  };
  if (/business development|partnerships|\bbd\b|sales manager|gtm|kol/i.test(blob))
    scores.BD += 3;
  if (/growth|marketing|influencer|referral|conversion/i.test(blob))
    scores.BD += 2;
  if (/community|discord|telegram|moderator/i.test(blob)) scores.Community += 3;
  if (/research|tokenomics|deep-dive|analyst/i.test(blob)) scores.Research += 2;
  if (/security|audit|slither|foundry/i.test(blob)) scores.Security += 3;
  if (/product manager|product owner|\bpm\b/i.test(blob)) scores.Product += 3;
  if (/engineer|developer|solidity|python|golang|\bgo\b|fullstack/i.test(blob))
    scores.Engineering += 2;
  const best = Object.entries(scores).sort((a, b) => b[1] - a[1])[0];
  if (!best || best[1] <= 0) return undefined;
  return best[0] as RoleFamily;
}

function suggestTitles(
  role: RoleFamily | undefined,
  experiences: ResumeExperience[]
): string[] {
  const fromExp = experiences
    .map((e) => e.title)
    .filter((t): t is string => !!t && t.length > 3 && t.length < 60)
    .slice(0, 3);
  if (fromExp.length) return uniq(fromExp).slice(0, 4);
  const map: Record<string, string[]> = {
    BD: [
      "Business Development Manager",
      "Growth Lead",
      "Partnerships Manager",
    ],
    Community: ["Community Manager", "Community Lead"],
    Research: ["Research Analyst", "Crypto Researcher"],
    Security: ["Smart Contract Auditor", "Security Researcher"],
    Product: ["Product Manager", "Product Owner"],
    Engineering: ["Software Engineer", "Blockchain Engineer"],
    Other: [],
  };
  return role ? map[role] || [] : [];
}

function buildSummary(
  name: string | undefined,
  location: string | undefined,
  experiences: ResumeExperience[],
  education: ResumeEducation[]
): string {
  const parts: string[] = [];
  if (name) parts.push(name);
  if (location) parts.push(location);
  const top = experiences[0];
  if (top?.title || top?.company) {
    parts.push(
      [top.title, top.company].filter(Boolean).join(" @ ")
    );
  } else if (education[0]?.degree || education[0]?.school) {
    parts.push(
      [education[0].degree, education[0].school].filter(Boolean).join(" · ")
    );
  }
  return parts.join(" · ").slice(0, 280);
}

function cleanSummary(s?: string): string | undefined {
  if (!s) return undefined;
  const t = s.replace(/\s+/g, " ").trim();
  if (/@|\+\d{8,}/.test(t) && t.length < 80) return undefined;
  return t.slice(0, 280);
}

function uniq(arr: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const a of arr) {
    const t = a.trim();
    if (!t) continue;
    const k = t.toLowerCase();
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(t);
  }
  return out;
}

function guessSkills(text: string): string[] {
  const lower = text.toLowerCase();
  return SKILL_DICT.filter((s) => lower.includes(s.toLowerCase())).slice(0, 16);
}

function guessKeywords(text: string): string[] {
  const dict = [
    "Web3",
    "Crypto",
    "Blockchain",
    "DeFi",
    "NFT",
    "DAO",
    "Layer2",
    "Exchange",
    "Wallet",
    "Remote",
    "Full-time",
    "Internship",
    "Hiring",
    "Growth",
    "Community",
    "Security",
    "Research",
    "Product Manager",
    "Smart Contract",
    "Token",
    "RWA",
    "PerpDEX",
  ];
  const lower = text.toLowerCase();
  return dict.filter((k) => lower.includes(k.toLowerCase())).slice(0, 16);
}

function heuristicSummary(text: string): string {
  const line = text
    .split(/\n/)
    .map((l) => l.trim())
    .find(
      (l) =>
        l.length > 40 &&
        l.length < 220 &&
        !/@|\+\d{6,}/.test(l) &&
        !SECTION_RE.test(l)
    );
  return (line || text.replace(/\s+/g, " ").slice(0, 200)).trim();
}
