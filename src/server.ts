#!/usr/bin/env node
/**
 * 职块 Web UI — Agentic Wallet 登录 + OKX.AI 付费专属页 + 自动路径
 * npm run web  →  http://127.0.0.1:8787
 *
 * 支付：@okxweb3/x402-express（配置 OKX_API_* + PAY_TO 后启用）
 * 对齐文档：
 * https://web3.okx.com/zh-hans/onchainos/dev-docs/okxai/howtomcp
 * https://web3.okx.com/zh-hans/onchainos/dev-docs/payments/service-seller-sdk
 */
import "dotenv/config";
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import express from "express";
import {
  createX402PaymentMiddleware,
  isX402SdkConfigured,
  publicBaseUrl,
  payToAddress,
  x402Price,
} from "./x402/seller.js";
import {
  ensureDataDirs,
  dataDir,
  dataContext,
  userDataDir,
  baseDataDir,
} from "./paths.js";
import {
  getProfile,
  saveProfileFromInput,
  defaultProfile,
  exampleProfile,
  normalizeProfile,
  ROLES,
  COMPANY_TYPE_OPTIONS,
  SECTOR_OPTIONS,
} from "./profile/setup.js";
import { loadJobs, loadShortlist, saveProfile } from "./store/fs-store.js";
import { scanAll } from "./ingest/index.js";
import { rankJobs, formatShortlist } from "./match/rank.js";
import { listEvents } from "./events/luma.js";
import { config } from "./config.js";
import {
  parseAuthToken,
  getSession,
  destroySession,
  ensureUserData,
  openPortal,
  processUnlock,
  buildX402Challenge,
  isEntitled,
  getOrCreateWalletUser,
  shortAddress,
  allowDevUnlock,
  portalUrlFor,
} from "./auth/wallet.js";
import {
  runAutoPipeline,
  readPipelineStatus,
} from "./pipeline/auto.js";
import {
  loadCareerPath,
  rebuildCareerPathForLang,
  type PathLang,
} from "./pipeline/path.js";
import { parseResumePdf } from "./resume/parse.js";
import {
  saveParsedResumeToProfile,
  formatParseSummaryForAgent,
  structuredResumeFromProfile,
} from "./resume/apply.js";
import {
  listTrackerApps,
  enrichApp,
  addFromShortlistPayload,
  patchApplication,
  deleteApplication,
  trackerSummary,
  TRACKER_STATUSES,
} from "./track/applications.js";
import {
  loadWeekPlan,
  buildWeekPlan,
  toggleWeekTask,
  weekPlanProgress,
  weekStatusPayload,
} from "./track/week-plan.js";
import {
  listOutreach,
  addOutreach,
  patchOutreach,
  deleteOutreach,
  outreachSummary,
  followUpDrafts,
  OUTREACH_STATUSES,
} from "./track/outreach.js";
import { formatProofCard, normalizeSocialInput } from "./profile/proof.js";
import { buildBattlePack } from "./pipeline/battle-pack.js";
import { normalizeAddress } from "./auth/wallet.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const WEB_ROOT = path.join(__dirname, "..", "web");
const PORT = Number(process.env.PORT || 8787);
// Render / 云部署需监听 0.0.0.0；本地默认 127.0.0.1
const HOST =
  process.env.HOST ||
  (process.env.RENDER || process.env.NODE_ENV === "production"
    ? "0.0.0.0"
    : "127.0.0.1");

const MIME: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".ico": "image/x-icon",
  ".woff2": "font/woff2",
};

// 防止并发多次 auto pipeline
const runningPipelines = new Set<string>();

function normalizeAddr(a?: string): string | null {
  if (!a) return null;
  const s = a.trim().toLowerCase();
  return /^0x[a-f0-9]{40}$/.test(s) ? s : null;
}

function send(
  res: http.ServerResponse,
  code: number,
  body: unknown,
  type?: string,
  extraHeaders?: Record<string, string>
) {
  const isObj = typeof body === "object";
  const data = isObj ? JSON.stringify(body) : String(body);
  res.writeHead(code, {
    "Content-Type":
      type ||
      (isObj ? "application/json; charset=utf-8" : "text/plain; charset=utf-8"),
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    ...(extraHeaders || {}),
  });
  res.end(data);
}

async function readBody(req: http.IncomingMessage): Promise<string> {
  const chunks: Buffer[] = [];
  for await (const c of req) chunks.push(c as Buffer);
  return Buffer.concat(chunks).toString("utf8");
}

function serveStatic(urlPath: string, res: http.ServerResponse) {
  let rel = urlPath === "/" ? "/index.html" : urlPath;
  rel = rel.split("?")[0];
  if (rel.includes("..")) {
    send(res, 403, "Forbidden");
    return;
  }
  const fp = path.join(WEB_ROOT, rel);
  if (
    !fp.startsWith(WEB_ROOT) ||
    !fs.existsSync(fp) ||
    fs.statSync(fp).isDirectory()
  ) {
    const index = path.join(WEB_ROOT, "index.html");
    if (fs.existsSync(index)) {
      res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
      res.end(fs.readFileSync(index));
      return;
    }
    send(res, 404, "Not found");
    return;
  }
  const ext = path.extname(fp);
  res.writeHead(200, {
    "Content-Type": MIME[ext] || "application/octet-stream",
  });
  res.end(fs.readFileSync(fp));
}

function withUserContext<T>(
  userId: string | null,
  fn: () => T | Promise<T>
): Promise<T> {
  if (!userId) {
    return Promise.resolve(fn());
  }
  const dir = ensureUserData(userId);
  return dataContext.run({ userDataDir: dir }, () => Promise.resolve(fn()));
}

const EVM_ADDR_RE = /^0x[a-fA-F0-9]{40}$/;

function decodePaymentHeaderJson(header: string): unknown | null {
  const raw = header.trim();
  if (!raw) return null;
  if (raw.startsWith("{")) {
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }
  for (const normalize of [
    (s: string) => s,
    (s: string) => s.replace(/-/g, "+").replace(/_/g, "/"),
  ]) {
    try {
      const b64 = normalize(raw);
      const pad = b64.length % 4 === 0 ? b64 : b64 + "=".repeat(4 - (b64.length % 4));
      return JSON.parse(Buffer.from(pad, "base64").toString("utf8"));
    } catch {
      /* try next */
    }
  }
  return null;
}

/** 在支付 payload 树中找 EIP-3009 / Permit2 的 from */
function findPayerInTree(node: unknown, depth = 0): string {
  if (depth > 8 || node == null) return "";
  if (typeof node === "string" && EVM_ADDR_RE.test(node)) return "";
  if (typeof node !== "object") return "";
  const obj = node as Record<string, unknown>;
  for (const key of ["from", "payer", "sender", "owner"]) {
    const v = obj[key];
    if (typeof v === "string" && EVM_ADDR_RE.test(v)) return v;
  }
  for (const v of Object.values(obj)) {
    if (v && typeof v === "object") {
      const found = findPayerInTree(v, depth + 1);
      if (found) return found;
    }
  }
  return "";
}

/**
 * 从已验签的 x402 支付头中提取付款人地址。
 * 中间件已通过校验时调用，避免 GET 无 body 时只回 paid、不发 portalUrl。
 */
function payerFromPaymentHeader(header?: string): string {
  if (!header || typeof header !== "string") return "";
  try {
    const payload = decodePaymentHeaderJson(header);
    if (!payload) return "";
    const nested = payload as {
      payload?: {
        authorization?: { from?: string };
        permit2Authorization?: { from?: string };
      };
      authorization?: { from?: string };
    };
    const direct =
      nested?.payload?.authorization?.from ||
      nested?.payload?.permit2Authorization?.from ||
      nested?.authorization?.from ||
      "";
    if (typeof direct === "string" && EVM_ADDR_RE.test(direct)) return direct;
    return findPayerInTree(payload);
  } catch {
    return "";
  }
}

/** 付费通过后的交付：开通专属 portalUrl */
async function deliverPaidUnlock(
  body: Record<string, unknown>,
  queryAddress?: string,
  paymentHeader?: string
): Promise<Record<string, unknown>> {
  const address = String(
    body.address ||
      queryAddress ||
      payerFromPaymentHeader(paymentHeader) ||
      ""
  );
  if (!address) {
    // 已扣款但无法绑定权益：返回明确错误，避免买家以为开通成功
    return {
      ok: false,
      error: "missing_payer_address",
      paid: true,
      message:
        "Payment verified but payer address could not be resolved. Contact seller with txHash, or retry POST with { \"address\": \"0x…\" }.",
      resource: `${publicBaseUrl()}/api/access/unlock`,
      price: x402Price(),
      payTo: payToAddress(),
    };
  }

  // 中间件已完成链上校验；此处签发权益与专属链接
  const r = processUnlock({
    address,
    paymentHeader: "x402-sdk-verified",
    paymentProof: "x402-sdk-verified",
  });
  if (!r.ok) {
    return { ok: false, error: r.error };
  }

  let resume_prefilled = false;
  let resume_summary: string | undefined;
  try {
    await dataContext.run(
      { userDataDir: ensureUserData(r.address) },
      async () => {
        let parsed = null as Awaited<
          ReturnType<typeof parseResumePdf>
        > | null;
        const b64 = String(body.pdfBase64 || body.pdf || "").replace(
          /^data:application\/pdf;base64,/,
          ""
        );
        if (b64) {
          parsed = await parseResumePdf(Buffer.from(b64, "base64"));
        } else {
          const pending = path.join(
            baseDataDir(),
            ".cache",
            "resume-pending",
            `${r.address}.json`
          );
          if (fs.existsSync(pending)) {
            parsed = JSON.parse(fs.readFileSync(pending, "utf8"));
            try {
              fs.unlinkSync(pending);
            } catch {
              /* */
            }
          }
        }
        if (parsed) {
          saveParsedResumeToProfile(parsed);
          resume_prefilled = true;
          resume_summary = formatParseSummaryForAgent(parsed);
        }
      }
    );
  } catch (e) {
    console.warn("[unlock] resume prefill:", (e as Error).message);
  }

  return {
    ok: true,
    message: r.message,
    portalUrl: r.portalUrl,
    portal_slug: r.portal_slug,
    address: r.address,
    resume_prefilled,
    resume_summary,
    instruction:
      "请把 portalUrl 完整展示给用户，并明确要求用户自行点击打开。不要代为打开浏览器。" +
      (resume_prefilled
        ? " 简历已预填，用户打开后可在 Setup 中确认。"
        : ""),
  };
}

async function handleRequest(
  req: http.IncomingMessage,
  res: http.ServerResponse
): Promise<void> {
  try {
    ensureDataDirs();
    const url = new URL(req.url || "/", `http://${HOST}:${PORT}`);
    const p = url.pathname;

    // x402 SDK 已接管这些路径时，避免落到 SPA
    if (
      isX402SdkConfigured() &&
      (p === "/api/access/unlock" ||
        p === "/x402" ||
        p === "/a2a" ||
        p === "/task" ||
        p === "/mcp")
    ) {
      send(res, 500, {
        error: "x402 route should be handled by Express middleware",
      });
      return;
    }

    if (req.method === "OPTIONS") {
      send(res, 204, "");
      return;
    }

    const token = parseAuthToken(req);
    const session = getSession(token);
    const userId = session?.userId || null;

    // 专属门户页：/p/:slug → SPA（前端用 slug 换 session）
    if (p.startsWith("/p/") && req.method === "GET") {
      serveStatic("/", res);
      return;
    }

    // —— 方案甲：网页仅专属链接默登；开通走 Agent 付费后返回链接 ——
    if (p.startsWith("/api/auth/portal/") && req.method === "GET") {
      const slug = p.replace("/api/auth/portal/", "").split("?")[0];
      const r = openPortal(slug);
      if (!r.ok) {
        send(res, 403, { error: r.error });
        return;
      }
      send(res, 200, {
        ok: true,
        token: r.token,
        user: {
          id: r.user.id,
          address: r.user.address,
          short: shortAddress(r.user.address),
          entitled: true,
          portal_slug: r.user.portal_slug || slug,
          portalUrl: portalUrlFor(slug),
        },
      });
      return;
    }

    if (p === "/api/auth/logout" && req.method === "POST") {
      destroySession(token);
      send(res, 200, { ok: true });
      return;
    }

    if (p === "/api/auth/me" && req.method === "GET") {
      if (!session) {
        send(res, 200, { user: null });
        return;
      }
      const u = getOrCreateWalletUser(session.address);
      send(res, 200, {
        user: {
          id: session.userId,
          address: session.address,
          short: shortAddress(session.address),
          entitled: isEntitled(session.address),
          portal_slug: u.portal_slug,
          portalUrl: u.portal_slug ? portalUrlFor(u.portal_slug) : null,
          via: session.via,
        },
      });
      return;
    }

    // Agent：生成链接前先解析 PDF（无需专属页登录）
    if (p === "/api/agent/resume-parse" && req.method === "POST") {
      try {
        const body = JSON.parse(await readBody(req));
        const b64 = String(body.pdfBase64 || body.pdf || "").replace(
          /^data:application\/pdf;base64,/,
          ""
        );
        if (!b64) {
          send(res, 400, { error: "请提供 pdfBase64（PDF 文件的 base64）" });
          return;
        }
        const buf = Buffer.from(b64, "base64");
        if (buf.length > 8 * 1024 * 1024) {
          send(res, 400, { error: "PDF 请小于 8MB" });
          return;
        }
        const parsed = await parseResumePdf(buf);
        const address = normalizeAddr(body.address as string | undefined);
        let saved = false;
        if (address && isEntitled(address)) {
          await dataContext.run(
            { userDataDir: ensureUserData(address) },
            () => {
              saveParsedResumeToProfile(parsed);
              saved = true;
            }
          );
        } else if (address) {
          // 未开通：解析结果暂存，unlock 时写入
          const cacheDir = path.join(
            baseDataDir(),
            ".cache",
            "resume-pending"
          );
          fs.mkdirSync(cacheDir, { recursive: true });
          fs.writeFileSync(
            path.join(cacheDir, `${address}.json`),
            JSON.stringify(parsed),
            "utf8"
          );
        }
        send(res, 200, {
          ok: true,
          parsed,
          summary_text: formatParseSummaryForAgent(parsed),
          saved_to_profile: saved,
          note: saved
            ? "已写入该钱包用户画像，打开专属页即可看到预填"
            : address
              ? "已缓存解析结果；开通专属链接时将自动写入画像"
              : "仅返回解析结果；开通时请在 unlock 中带上同一 pdfBase64 或先带 address 再 parse",
        });
      } catch (e) {
        send(res, 400, { error: (e as Error).message });
      }
      return;
    }

    // 先付费（或 dev）→ 只返回 portalUrl；可选附带 PDF 预填
    // 若已启用 x402 SDK，此路径由 Express + paymentMiddleware 处理
    if (
      p === "/api/access/unlock" &&
      req.method === "POST" &&
      !isX402SdkConfigured()
    ) {
      const body = JSON.parse((await readBody(req)) || "{}");
      const address = body.address || "";
      const paymentHeader =
        (req.headers["x-payment"] as string) ||
        (req.headers["PAYMENT-SIGNATURE"] as string) ||
        body.paymentHeader ||
        body.paymentProof;

      if (!paymentHeader && !body.dev) {
        const ch = buildX402Challenge(
          process.env.JOB_BLOCK_PUBLIC_URL
            ? `${process.env.JOB_BLOCK_PUBLIC_URL}/api/access/unlock`
            : `http://${HOST}:${PORT}/api/access/unlock`
        );
        res.writeHead(ch.status, {
          ...ch.headers,
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Headers":
            "Content-Type, Authorization, X-PAYMENT, PAYMENT-SIGNATURE",
        });
        res.end(JSON.stringify(ch.body));
        return;
      }

      const r = processUnlock({
        address,
        paymentHeader,
        paymentProof: body.paymentProof,
        dev: Boolean(body.dev),
      });
      if (!r.ok) {
        if (r.payment_required) {
          const ch = buildX402Challenge(
            process.env.JOB_BLOCK_PUBLIC_URL
              ? `${process.env.JOB_BLOCK_PUBLIC_URL}/api/access/unlock`
              : `http://${HOST}:${PORT}/api/access/unlock`
          );
          res.writeHead(ch.status, ch.headers);
          res.end(JSON.stringify(ch.body));
          return;
        }
        send(res, 400, { error: r.error });
        return;
      }

      // 开通后：写入 PDF 预填画像（本次 base64 或先前 agent 缓存）
      let resume_prefilled = false;
      let resume_summary: string | undefined;
      try {
        await dataContext.run(
          { userDataDir: ensureUserData(r.address) },
          async () => {
            let parsed = null as Awaited<
              ReturnType<typeof parseResumePdf>
            > | null;
            const b64 = String(body.pdfBase64 || body.pdf || "").replace(
              /^data:application\/pdf;base64,/,
              ""
            );
            if (b64) {
              parsed = await parseResumePdf(Buffer.from(b64, "base64"));
            } else {
              const pending = path.join(
                baseDataDir(),
                ".cache",
                "resume-pending",
                `${r.address}.json`
              );
              if (fs.existsSync(pending)) {
                parsed = JSON.parse(fs.readFileSync(pending, "utf8"));
                try {
                  fs.unlinkSync(pending);
                } catch {
                  /* */
                }
              }
            }
            if (parsed) {
              saveParsedResumeToProfile(parsed);
              resume_prefilled = true;
              resume_summary = formatParseSummaryForAgent(parsed);
            }
          }
        );
      } catch (e) {
        console.warn("[unlock] resume prefill:", (e as Error).message);
      }

      send(res, 200, {
        ok: true,
        message: r.message,
        portalUrl: r.portalUrl,
        portal_slug: r.portal_slug,
        address: r.address,
        resume_prefilled,
        resume_summary,
        instruction:
          "请把 portalUrl 完整展示给用户，并明确要求用户自行点击打开。不要代为打开浏览器。" +
          (resume_prefilled
            ? " 简历已预填，用户打开后可在 Setup 中确认。"
            : ""),
      });
      return;
    }

    if (p === "/api/a2mcp/career-path" && req.method === "POST") {
      const paymentHeader =
        (req.headers["x-payment"] as string) ||
        (req.headers["PAYMENT-SIGNATURE"] as string);
      if (!paymentHeader && !allowDevUnlock()) {
        const ch = buildX402Challenge(
          `http://${HOST}:${PORT}/api/a2mcp/career-path`
        );
        res.writeHead(ch.status, ch.headers);
        res.end(JSON.stringify(ch.body));
        return;
      }
      send(res, 200, {
        ok: true,
        note: "A2MCP 占位：完整体验请 unlock 后把 portalUrl 交给用户点击",
        docs: {
          a2mcp: "https://web3.okx.com/zh-hans/onchainos/dev-docs/okxai/howtomcp",
          seller_sdk:
            "https://web3.okx.com/zh-hans/onchainos/dev-docs/payments/service-seller-sdk",
        },
      });
      return;
    }

    const requireAuth = () => {
      if (!session) {
        send(res, 401, {
          error: "请通过 OKX.AI Agent 获取专属链接并自行打开（/p/slug）",
        });
        return false;
      }
      return true;
    };

    const requireEntitled = () => {
      if (!requireAuth()) return false;
      if (!isEntitled(session!.address)) {
        send(res, 402, {
          error: "payment_required",
          message: "请先在 OKX.AI 购买职块，由 Agent 返回专属链接后打开",
        });
        return false;
      }
      return true;
    };


    // 以下 API 在用户上下文中执行
    await withUserContext(userId, async () => {
      // 网页端不再解析 PDF；仅 Agent：/api/agent/resume-parse + unlock 预填

      if (p === "/api/health") {
        send(res, 200, {
          ok: true,
          brand: config.brand,
          dataDir: dataDir(),
          auth: "portal_only",
          entry: "OKX.AI Agent → Agentic Wallet 登录 → 付费/dev 开通 → 用户点击 /p/{slug}",
          user: session
            ? {
                address: session.address,
                short: shortAddress(session.address),
              }
            : null,
          dev_unlock: allowDevUnlock(),
        });
        return;
      }

      if (p === "/api/meta" && req.method === "GET") {
        send(res, 200, {
          roles: ROLES,
          sectors: SECTOR_OPTIONS,
          companyTypes: COMPANY_TYPE_OPTIONS,
          levels: ["junior", "mid", "senior", "lead", "executive"],
          alertFrequencies: ["daily", "weekly", "high_only", "off"],
          timezones: [
            "UTC+8",
            "UTC+7",
            "UTC+9",
            "UTC+0",
            "UTC-5",
            "UTC-8",
            "UTC+1",
            "UTC+5:30",
          ],
          sources: ["web3.career", "dejob.ai", "x", "telegram"],
          inputs: [
            { id: 1, key: "target", label: "目标岗位" },
            { id: 2, key: "resume", label: "简历" },
            { id: 3, key: "location", label: "地区 / Remote" },
            { id: 4, key: "sectors", label: "赛道偏好" },
            { id: 5, key: "comp", label: "薪资与补偿" },
            { id: 6, key: "dealbreakers", label: "硬性否决" },
            { id: 7, key: "languages", label: "语言" },
            { id: 8, key: "level", label: "年限 / 级别" },
            { id: 9, key: "highlights", label: "亮点" },
            { id: 10, key: "company_types", label: "公司类型" },
            { id: 11, key: "timezone", label: "时区" },
            { id: 12, key: "discrete", label: "保密观望" },
            { id: 13, key: "events", label: "活动城市" },
          ],
        });
        return;
      }

      if (p === "/api/profile" && req.method === "GET") {
        if (!requireEntitled()) return;
        const profile = getProfile() || defaultProfile();
        send(res, 200, {
          profile,
          structured_resume: structuredResumeFromProfile(profile),
        });
        return;
      }

      if (p === "/api/profile" && req.method === "POST") {
        if (!requireEntitled()) return;
        const body = JSON.parse(await readBody(req));
        const { profile, warnings } = saveProfileFromInput(
          body.profile || body
        );
        const auto = body.auto_search !== false;
        const pathLang =
          body.lang === "en" || body.lang === "zh" ? body.lang : "zh";
        send(res, 200, {
          ok: true,
          profile,
          warnings,
          auto_search: auto,
          message: auto
            ? "目前已经开始自动搜索，请耐心等待报告结果"
            : "画像已保存",
        });

        // 后台自动跑 pipeline（不阻塞响应已发出——但我们已 send，注意不能再写 res）
        // 实际上上面已经 send 了，后续异步任务用 fire-and-forget
        if (auto && session) {
          const uid = session.userId;
          if (!runningPipelines.has(uid)) {
            runningPipelines.add(uid);
            // 重新进入用户上下文异步执行
            setImmediate(() => {
              dataContext
                .run({ userDataDir: userDataDir(uid) }, () =>
                  runAutoPipeline({ limitPerSource: 20, lang: pathLang })
                )
                .catch((e) => console.error("[auto pipeline]", e))
                .finally(() => runningPipelines.delete(uid));
            });
          }
        }
        return;
      }

      if (p === "/api/profile/example" && req.method === "POST") {
        if (!requireEntitled()) return;
        const profile = exampleProfile();
        saveProfile(profile);
        send(res, 200, { ok: true, profile });
        return;
      }

      if (p === "/api/pipeline/status" && req.method === "GET") {
        if (!requireEntitled()) return;
        const pathReport = loadCareerPath();
        const week = loadWeekPlan();
        send(res, 200, {
          ...readPipelineStatus(),
          shortlist: loadShortlist().slice(0, 15),
          path: pathReport,
          events: pathReport?.events || [],
          week_plan: week,
          week_progress: weekPlanProgress(week),
          tracker: {
            total: listTrackerApps().length,
            overdue_count: listTrackerApps().filter((a) =>
              enrichApp(a).overdue
            ).length,
          },
        });
        return;
      }

      if (p === "/api/path" && req.method === "GET") {
        if (!requireEntitled()) return;
        const want = (url.searchParams.get("lang") || "").toLowerCase();
        let pathReport = loadCareerPath();
        if (
          (want === "zh" || want === "en") &&
          pathReport &&
          pathReport.lang !== want
        ) {
          pathReport =
            rebuildCareerPathForLang(want as PathLang) || pathReport;
          try {
            buildWeekPlan({
              path: pathReport,
              keepDone: true,
              lang: want as PathLang,
            });
          } catch {
            /* */
          }
        }
        send(res, 200, { path: pathReport });
        return;
      }

      /** 仅切换路径正文语言（不重新扫岗） */
      if (p === "/api/path/lang" && req.method === "POST") {
        if (!requireEntitled()) return;
        const body = JSON.parse((await readBody(req)) || "{}");
        const want = String(body.lang || "").toLowerCase();
        if (want !== "zh" && want !== "en") {
          send(res, 400, { error: "lang must be zh or en" });
          return;
        }
        const pathReport = rebuildCareerPathForLang(want as PathLang);
        if (!pathReport) {
          send(res, 400, {
            error:
              want === "en"
                ? "No path yet. Generate Plan first."
                : "尚无路径，请先生成求职路径",
          });
          return;
        }
        const plan = buildWeekPlan({
          path: pathReport,
          keepDone: true,
          lang: want as PathLang,
        });
        send(res, 200, {
          ok: true,
          path: pathReport,
          week_plan: plan,
          progress: weekPlanProgress(plan),
        });
        return;
      }

      if (p === "/api/pipeline/run" && req.method === "POST") {
        if (!requireEntitled()) return;
        const uid = session!.userId;
        if (runningPipelines.has(uid)) {
          send(res, 200, {
            ok: true,
            running: true,
            message: "目前已经开始自动搜索，请耐心等待报告结果",
            status: readPipelineStatus(),
          });
          return;
        }
        const body = JSON.parse((await readBody(req)) || "{}");
        const pathLang =
          body.lang === "en" || body.lang === "zh" ? body.lang : "zh";
        runningPipelines.add(uid);
        try {
          const result = await runAutoPipeline({
            limitPerSource: 20,
            lang: pathLang,
          });
          send(res, 200, {
            ok: true,
            ...result,
            path: result.path,
            text: formatShortlist(result.shortlist),
          });
        } finally {
          runningPipelines.delete(uid);
        }
        return;
      }

      if (p === "/api/status" && req.method === "GET") {
        send(res, 200, {
          profile: getProfile(),
          jobs: loadJobs().length,
          shortlist: loadShortlist().length,
          shortlistPreview: loadShortlist().slice(0, 8),
          pipeline: readPipelineStatus(),
          user: session
            ? {
                address: session.address,
                short: shortAddress(session.address),
              }
            : null,
        });
        return;
      }

      if (p === "/api/scan" && req.method === "POST") {
        if (!requireEntitled()) return;
        const body = JSON.parse((await readBody(req)) || "{}");
        const limit = Number(body.limit) || 20;
        const result = await scanAll({
          limitPerSource: limit,
          sources: ["web3.career", "dejob.ai", "x"],
        });
        send(res, 200, result);
        return;
      }

      if (p === "/api/rank" && req.method === "POST") {
        if (!requireEntitled()) return;
        const profile = getProfile();
        if (!profile) {
          send(res, 400, { error: "请先完成 Setup" });
          return;
        }
        const body = JSON.parse((await readBody(req)) || "{}");
        const jobs = loadJobs();
        if (!jobs.length) {
          send(res, 400, { error: "岗位库为空，请先扫描" });
          return;
        }
        const report = await rankJobs(normalizeProfile(profile), jobs, {
          topShow: Number(body.show) || 12,
          topRecall: Number(body.recall) || 40,
        });
        send(res, 200, {
          ...report,
          text: formatShortlist(report.shortlist),
        });
        return;
      }

      if (p === "/api/events" && req.method === "GET") {
        if (!requireEntitled()) return;
        const profile = getProfile();
        const city =
          url.searchParams.get("city") ||
          profile?.event_cities?.[0] ||
          profile?.location_pref?.cities?.[0] ||
          "Singapore";
        const list = await listEvents({
          city,
          profile: profile ? normalizeProfile(profile) : null,
          query: url.searchParams.get("q") || undefined,
        });
        // 只返回具体活动链接
        const concrete = list.filter(
          (e) =>
            e.url.includes("luma.com/") &&
            !e.url.includes("discover") &&
            !e.event_type.includes("search")
        );
        send(res, 200, {
          city,
          events: concrete.slice(0, 20),
        });
        return;
      }

      // —— Phase 1：本周任务 + 申请追踪 ——
      if (p === "/api/week-plan" && req.method === "GET") {
        if (!requireEntitled()) return;
        let plan = loadWeekPlan();
        if (!plan || url.searchParams.get("rebuild") === "1") {
          plan = buildWeekPlan({ keepDone: true });
        }
        send(res, 200, {
          plan,
          progress: weekPlanProgress(plan),
        });
        return;
      }

      if (p === "/api/week-plan/rebuild" && req.method === "POST") {
        if (!requireEntitled()) return;
        const body = JSON.parse((await readBody(req)) || "{}");
        const lang =
          body.lang === "en" || body.lang === "zh"
            ? body.lang
            : loadCareerPath()?.lang || "zh";
        const plan = buildWeekPlan({ keepDone: true, lang });
        send(res, 200, { ok: true, plan, progress: weekPlanProgress(plan) });
        return;
      }

      if (p === "/api/week-plan/task" && req.method === "POST") {
        if (!requireEntitled()) return;
        const body = JSON.parse((await readBody(req)) || "{}");
        const taskId = body.task_id || body.id;
        if (!taskId) {
          send(res, 400, { error: "需要 task_id" });
          return;
        }
        const plan = toggleWeekTask(taskId, body.done);
        if (!plan) {
          send(res, 404, { error: "任务不存在，请先生成 Plan" });
          return;
        }
        send(res, 200, {
          ok: true,
          plan,
          progress: weekPlanProgress(plan),
        });
        return;
      }

      if (p === "/api/applications" && req.method === "GET") {
        if (!requireEntitled()) return;
        send(res, 200, {
          ...trackerSummary(),
          statuses: TRACKER_STATUSES,
        });
        return;
      }

      if (p === "/api/applications" && req.method === "POST") {
        if (!requireEntitled()) return;
        const body = JSON.parse((await readBody(req)) || "{}");
        // shortlist 一键加入：{ job_id } 或 { job: {...} }
        const r = addFromShortlistPayload(body);
        if ("error" in r) {
          send(res, 400, { error: r.error });
          return;
        }
        send(res, 200, {
          ok: true,
          created: r.created,
          application: enrichApp(r.app),
          message: r.created ? "已加入申请追踪" : "已在追踪列表中",
        });
        return;
      }

      if (p.startsWith("/api/applications/") && req.method === "PATCH") {
        if (!requireEntitled()) return;
        const id = decodeURIComponent(
          p.replace("/api/applications/", "").split("/")[0]
        );
        const body = JSON.parse((await readBody(req)) || "{}");
        const app = patchApplication(id, body);
        if (!app) {
          send(res, 404, { error: "申请记录不存在" });
          return;
        }
        send(res, 200, { ok: true, application: enrichApp(app) });
        return;
      }

      if (p.startsWith("/api/applications/") && req.method === "DELETE") {
        if (!requireEntitled()) return;
        const id = decodeURIComponent(
          p.replace("/api/applications/", "").split("/")[0]
        );
        const ok = deleteApplication(id);
        if (!ok) {
          send(res, 404, { error: "申请记录不存在" });
          return;
        }
        send(res, 200, { ok: true });
        return;
      }

      // —— Phase 2：Proof / 社交 ——
      if (p === "/api/proof" && req.method === "GET") {
        if (!requireEntitled()) return;
        const profile = getProfile() || defaultProfile();
        const lang =
          url.searchParams.get("lang") === "en" ? "en" : "zh";
        send(res, 200, {
          ok: true,
          ...formatProofCard(profile, lang),
          profile_social: profile.social || {},
          proof_items: profile.proof_items || [],
        });
        return;
      }

      // —— Phase 2：触达 ——
      if (p === "/api/outreach" && req.method === "GET") {
        if (!requireEntitled()) return;
        send(res, 200, {
          ...outreachSummary(),
          statuses: OUTREACH_STATUSES,
        });
        return;
      }

      if (p === "/api/outreach" && req.method === "POST") {
        if (!requireEntitled()) return;
        const body = JSON.parse((await readBody(req)) || "{}");
        if (!body.company || !body.who) {
          send(res, 400, { error: "需要 company 与 who" });
          return;
        }
        const r = addOutreach(body);
        send(res, 200, {
          ok: true,
          created: r.created,
          contact: { ...r.contact, overdue: false },
          follow_ups: followUpDrafts(
            r.contact,
            body.lang === "en" ? "en" : "zh"
          ),
        });
        return;
      }

      if (p.startsWith("/api/outreach/") && req.method === "PATCH") {
        if (!requireEntitled()) return;
        const id = decodeURIComponent(
          p.replace("/api/outreach/", "").split("/")[0]
        );
        const body = JSON.parse((await readBody(req)) || "{}");
        const c = patchOutreach(id, body);
        if (!c) {
          send(res, 404, { error: "触达记录不存在" });
          return;
        }
        send(res, 200, {
          ok: true,
          contact: c,
          follow_ups: followUpDrafts(c, body.lang === "en" ? "en" : "zh"),
        });
        return;
      }

      if (p.startsWith("/api/outreach/") && req.method === "DELETE") {
        if (!requireEntitled()) return;
        const id = decodeURIComponent(
          p.replace("/api/outreach/", "").split("/")[0]
        );
        if (!deleteOutreach(id)) {
          send(res, 404, { error: "触达记录不存在" });
          return;
        }
        send(res, 200, { ok: true });
        return;
      }

      // —— Phase 2：一岗一策 ——
      if (p === "/api/battle-pack" && req.method === "POST") {
        if (!requireEntitled()) return;
        const body = JSON.parse((await readBody(req)) || "{}");
        const profile = getProfile();
        if (!profile) {
          send(res, 400, { error: "请先完成 Setup" });
          return;
        }
        const jobs = loadJobs();
        let job = body.job_id
          ? jobs.find((j) => j.id === body.job_id)
          : null;
        if (!job && body.job?.id) {
          job = { ...(body.job as import("./types.js").Job) };
        }
        if (!job) {
          // shortlist 里找
          const sl = loadShortlist();
          job = sl.find((j) => j.id === body.job_id) || null;
        }
        if (!job) {
          send(res, 404, { error: "找不到岗位" });
          return;
        }
        const pack = buildBattlePack(
          normalizeProfile(profile),
          job,
          body.lang === "en" ? "en" : "zh"
        );
        send(res, 200, { ok: true, pack });
        return;
      }

      // Agent 陪跑：只读周状态（需 address 且已开通）
      if (p === "/api/agent/progress" && req.method === "GET") {
        const addr =
          normalizeAddr(url.searchParams.get("address") || undefined) ||
          (session?.address ? normalizeAddress(session.address) : null);
        if (!addr) {
          send(res, 400, { error: "需要 address 参数" });
          return;
        }
        if (!isEntitled(addr)) {
          send(res, 403, { error: "该地址尚未开通职块" });
          return;
        }
        await withUserContext(addr, async () => {
          const lang =
            url.searchParams.get("lang") === "en" ? "en" : "zh";
          const profile = getProfile();
          send(res, 200, {
            ok: true,
            address: addr,
            ...weekStatusPayload(),
            proof: profile
              ? formatProofCard(normalizeProfile(profile), lang)
              : null,
            companion_hint:
              lang === "en"
                ? "Give 1–3 concrete next actions only; never open links or invent apply results. Prioritize overdue applications and overdue outreach."
                : "每次只给用户 1–3 条具体下一步；不代开链接、不编造投递结果。优先催：逾期申请 + 逾期触达。",
          });
        });
        return;
      }

      // static
      if (p.startsWith("/api/")) {
        send(res, 404, { error: "not found" });
        return;
      }
      serveStatic(p, res);
    });
  } catch (e) {
    console.error(e);
    send(res, 500, { error: (e as Error).message });
  }
}

// —— Express 外壳：x402 付费路径 + 其余走原 handleRequest ——
const app = express();
// Render / Cloudflare 反代后正确识别 https，避免 x402 resource.url 落成 http://
app.set("trust proxy", 1);
app.use(express.json({ limit: "12mb" }));
app.use(
  (
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader(
      "Access-Control-Allow-Headers",
      "Content-Type, Authorization, X-PAYMENT, PAYMENT-SIGNATURE, PAYMENT-REQUIRED"
    );
    res.setHeader(
      "Access-Control-Allow-Methods",
      "GET,POST,PATCH,DELETE,OPTIONS"
    );
    if (req.method === "OPTIONS") {
      res.status(204).end();
      return;
    }
    next();
  }
);

if (isX402SdkConfigured()) {
  try {
    const { middleware, payTo, price } = createX402PaymentMiddleware();
    app.use(middleware);

    const paidDeliver = async (
      req: express.Request,
      res: express.Response
    ) => {
      try {
        const body = (req.body || {}) as Record<string, unknown>;
        // dev 旁路：仅非生产且显式 dev:true（本地联调）
        if (body.dev === true && allowDevUnlock()) {
          const r = processUnlock({
            address: String(body.address || ""),
            dev: true,
          });
          if (!r.ok) {
            res.status(400).json({ error: r.error });
            return;
          }
          res.status(200).json({
            ok: true,
            message: r.message,
            portalUrl: r.portalUrl,
            portal_slug: r.portal_slug,
            address: r.address,
            instruction:
              "请把 portalUrl 完整展示给用户，并明确要求用户自行点击打开。",
          });
          return;
        }

        const payHdr =
          (req.headers["payment-signature"] as string) ||
          (req.headers["x-payment"] as string) ||
          "";
        const out = await deliverPaidUnlock(
          body,
          typeof req.query.address === "string" ? req.query.address : undefined,
          payHdr
        );
        if (out.ok === false) {
          res.status(400).json(out);
          return;
        }
        res.status(200).json(out);
      } catch (e) {
        console.error("[x402 deliver]", e);
        res.status(500).json({ error: (e as Error).message });
      }
    };

    for (const method of ["get", "post"] as const) {
      app[method]("/api/access/unlock", paidDeliver);
      app[method]("/x402", paidDeliver);
      app[method]("/a2a", paidDeliver);
      app[method]("/task", paidDeliver);
      app[method]("/mcp", paidDeliver);
    }

    console.log(
      `  💳 x402 SDK 已启用  payTo=${payTo}  price=${price}  network=eip155:196`
    );
    console.log(
      `  💳 付费资源 → ${publicBaseUrl()}/api/access/unlock  （及 /x402 /a2a /task /mcp）`
    );
  } catch (e) {
    console.error("[x402] 初始化失败，回退旧版 402 占位:", (e as Error).message);
  }
} else {
  console.log(
    "  💳 x402 SDK 未配置（需 PAY_TO_ADDRESS + OKX_API_KEY/SECRET/PASSPHRASE），使用占位 402"
  );
}

// 其余 API / 静态资源
app.use((req, res) => {
  void handleRequest(req, res);
});

app.listen(PORT, HOST, () => {
  console.log("");
  console.log(`  🧱 ${config.brand.nameZh} / ${config.brand.nameEn}`);
  console.log(`  UI   →  http://${HOST}:${PORT}`);
  console.log(`  data →  ${dataDir()}`);
  console.log(`  public → ${publicBaseUrl()}`);
  console.log("");
});
