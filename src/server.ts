#!/usr/bin/env node
/**
 * 职块 Web UI — Agentic Wallet 登录 + OKX.AI 付费专属页 + 自动路径
 * npm run web  →  http://127.0.0.1:8787
 *
 * 对齐文档：
 * https://web3.okx.com/zh-hans/onchainos/dev-docs/okxai/howtomcp
 */
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
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
import { loadCareerPath } from "./pipeline/path.js";
import { parseResumePdf } from "./resume/parse.js";
import {
  saveParsedResumeToProfile,
  formatParseSummaryForAgent,
} from "./resume/apply.js";

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

const server = http.createServer(async (req, res) => {
  try {
    ensureDataDirs();
    const url = new URL(req.url || "/", `http://${HOST}:${PORT}`);
    const p = url.pathname;

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
    if (p === "/api/access/unlock" && req.method === "POST") {
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
            `http://${HOST}:${PORT}/api/access/unlock`
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
        send(res, 200, { profile });
        return;
      }

      if (p === "/api/profile" && req.method === "POST") {
        if (!requireEntitled()) return;
        const body = JSON.parse(await readBody(req));
        const { profile, warnings } = saveProfileFromInput(
          body.profile || body
        );
        const auto = body.auto_search !== false;
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
                  runAutoPipeline({ limitPerSource: 20 })
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
        send(res, 200, {
          ...readPipelineStatus(),
          shortlist: loadShortlist().slice(0, 15),
          path: pathReport,
          events: pathReport?.events || [],
        });
        return;
      }

      if (p === "/api/path" && req.method === "GET") {
        if (!requireEntitled()) return;
        send(res, 200, { path: loadCareerPath() });
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
        runningPipelines.add(uid);
        try {
          const result = await runAutoPipeline({ limitPerSource: 20 });
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
});

server.listen(PORT, HOST, () => {
  console.log("");
  console.log(`  🧱 ${config.brand.nameZh} / ${config.brand.nameEn}`);
  console.log(`  UI   →  http://${HOST}:${PORT}`);
  console.log(`  data →  ${dataDir()}`);
  console.log("");
});
