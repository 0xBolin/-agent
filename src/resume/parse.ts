/**
 * PDF 简历解析 → 文本 + 经历/技能/岗位关键词
 *
 * 抽文本：pdf-parse v2（PDFParse 类 + getText）
 * 结构化：有 OPENAI_API_KEY 时用 LLM；否则启发式词典
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

export interface ResumeParseResult {
  resume_text: string;
  summary: string;
  skills: string[];
  keywords: string[];
  experiences: {
    title?: string;
    company?: string;
    period?: string;
    bullets?: string[];
  }[];
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
];

export async function extractTextFromPdf(
  buffer: Buffer
): Promise<{ text: string; pages?: number; engine: string }> {
  if (!buffer?.length) {
    throw new Error("空文件");
  }
  // PDF 文件头
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
    text = text
      .replace(/\u0000/g, "")
      .replace(/[ \t]+\n/g, "\n")
      .replace(/\n{3,}/g, "\n\n")
      .trim();

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

export async function parseResumeText(
  text: string,
  opts?: { pages?: number; extract_engine?: string }
): Promise<ResumeParseResult> {
  const resume_text = text.slice(0, 50000);
  if (hasLlm()) {
    try {
      const llm = await chatJson<{
        summary?: string;
        skills?: string[];
        keywords?: string[];
        experiences?: ResumeParseResult["experiences"];
        highlights?: string[];
        suggested_titles?: string[];
        suggested_role?: string;
      }>([
        {
          role: "system",
          content: `你是简历解析器。从简历文本提取 JSON，字段：
summary(string 一句话),
skills(string[] 技能),
keywords(string[] 岗位/行业关键词如 DeFi, BD, Remote),
experiences([{title, company, period, bullets[]}]),
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
      return {
        resume_text,
        summary: llm.summary || heuristicSummary(resume_text),
        skills: uniq([...(llm.skills || []), ...guessSkills(resume_text)]).slice(
          0,
          24
        ),
        keywords: uniq([
          ...(llm.keywords || []),
          ...guessKeywords(resume_text),
        ]).slice(0, 20),
        experiences: llm.experiences || heuristicExperiences(resume_text),
        highlights: (llm.highlights || []).slice(0, 5),
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
  return {
    resume_text,
    summary: heuristicSummary(resume_text),
    skills: guessSkills(resume_text),
    keywords: guessKeywords(resume_text),
    experiences: heuristicExperiences(resume_text),
    highlights: heuristicHighlights(resume_text),
    suggested_titles: [],
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
  ];
  const lower = text.toLowerCase();
  return dict.filter((k) => lower.includes(k.toLowerCase())).slice(0, 16);
}

function heuristicSummary(text: string): string {
  const line = text
    .split(/\n/)
    .map((l) => l.trim())
    .find((l) => l.length > 40 && l.length < 220);
  return (line || text.replace(/\s+/g, " ").slice(0, 200)).trim();
}

function heuristicExperiences(
  text: string
): ResumeParseResult["experiences"] {
  const blocks = text.split(/\n{2,}/).slice(0, 12);
  const exps: ResumeParseResult["experiences"] = [];
  for (const b of blocks) {
    const lines = b
      .split(/\n/)
      .map((l) => l.trim())
      .filter(Boolean);
    if (lines.length < 2) continue;
    if (/experience|经历|工作|employment/i.test(lines[0]) && lines.length > 2) {
      exps.push({
        title: lines[1]?.slice(0, 80),
        company: lines[2]?.slice(0, 60),
        bullets: lines.slice(3, 6),
      });
    } else if (
      /\b(20\d{2}|19\d{2})\b/.test(b) &&
      (lines[0].length < 80 ||
        /engineer|manager|lead|bd|director|专员|经理/i.test(lines[0]))
    ) {
      exps.push({
        title: lines[0].slice(0, 80),
        company: lines[1]?.slice(0, 60),
        period: (
          b.match(
            /20\d{2}[\s\-–—到至]+20\d{2}|20\d{2}\s*[-–—]\s*(Present|今|现在|至今)/i
          ) || []
        )[0],
        bullets: lines.filter((l) => /^[-•·*]/.test(l)).slice(0, 4),
      });
    }
    if (exps.length >= 5) break;
  }
  return exps;
}

function heuristicHighlights(text: string): string[] {
  return text
    .split(/\n/)
    .map((l) => l.replace(/^[-•·*]\s*/, "").trim())
    .filter(
      (l) =>
        l.length > 20 &&
        l.length < 160 &&
        /\d|%|\$|增长|主导|负责/.test(l)
    )
    .slice(0, 3);
}
