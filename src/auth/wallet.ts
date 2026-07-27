/**
 * 方案甲：Agentic Wallet 仅在用户自己的 Agent 里登录；
 * 先付费（或 dev 开通）→ 生成 /p/{slug} → 只返回链接由用户点击；
 * 网页端仅专属链接默登，取消邮箱/纯网页钱包自助注册登录。
 *
 * 支付参考：
 * https://web3.okx.com/zh-hans/onchainos/dev-docs/payments/service-seller-sdk
 * A2MCP：
 * https://web3.okx.com/zh-hans/onchainos/dev-docs/okxai/howtomcp
 */
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import {
  baseDataDir,
  ensureDataDirs,
  files,
  userDataDir,
} from "../paths.js";

export interface WalletUser {
  id: string;
  address: string;
  created_at: string;
  entitled: boolean;
  paid_at?: string;
  portal_slug?: string;
  login_method: "agentic_wallet";
}

/** 网页会话：仅允许 portal（含 dev 开通后点开专属链） */
export interface SessionRecord {
  token: string;
  userId: string;
  address: string;
  created_at: string;
  expires_at: string;
  via: "portal";
}

export interface PortalRecord {
  slug: string;
  address: string;
  created_at: string;
  paid_at: string;
}

function readJson<T>(fp: string, fallback: T): T {
  if (!fs.existsSync(fp)) return fallback;
  try {
    return JSON.parse(fs.readFileSync(fp, "utf8")) as T;
  } catch {
    return fallback;
  }
}

function writeJson(fp: string, data: unknown): void {
  fs.mkdirSync(path.dirname(fp), { recursive: true });
  fs.writeFileSync(fp, JSON.stringify(data, null, 2), "utf8");
}

function entitlementsPath(): string {
  return path.join(baseDataDir(), "accounts", "entitlements.json");
}

function portalsPath(): string {
  return path.join(baseDataDir(), "accounts", "portals.json");
}

export function normalizeAddress(addr: string): string | null {
  const a = (addr || "").trim();
  if (!/^0x[a-fA-F0-9]{40}$/.test(a)) return null;
  return a.toLowerCase();
}

export function shortAddress(addr: string): string {
  if (!addr || addr.length < 10) return addr || "";
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

export function ensureUserData(userId: string): string {
  const dir = userDataDir(userId);
  fs.mkdirSync(dir, { recursive: true });
  for (const sub of ["jobs", "applications", "events", ".cache"]) {
    fs.mkdirSync(path.join(dir, sub), { recursive: true });
  }
  return dir;
}

export function publicBaseUrl(host = "127.0.0.1", port = 8787): string {
  const fromEnv =
    process.env.JOB_BLOCK_PUBLIC_URL ||
    process.env.RENDER_EXTERNAL_URL ||
    "";
  if (fromEnv) return fromEnv.replace(/\/$/, "");
  return `http://${host}:${port}`;
}

export function portalUrlFor(
  slug: string,
  host?: string,
  port?: number
): string {
  return `${publicBaseUrl(host, port)}/p/${slug}`;
}

export function getOrCreateWalletUser(address: string): WalletUser {
  ensureDataDirs();
  const id = address.toLowerCase();
  const dir = ensureUserData(id);
  const metaPath = path.join(dir, "meta.json");
  const entitlements = readJson<
    Record<
      string,
      { entitled: boolean; paid_at?: string; portal_slug?: string }
    >
  >(entitlementsPath(), {});
  const ent = entitlements[id];

  if (fs.existsSync(metaPath)) {
    const u = JSON.parse(fs.readFileSync(metaPath, "utf8")) as WalletUser;
    u.entitled = Boolean(ent?.entitled || u.entitled);
    u.paid_at = ent?.paid_at || u.paid_at;
    u.portal_slug = ent?.portal_slug || u.portal_slug;
    u.login_method = "agentic_wallet";
    return u;
  }

  const user: WalletUser = {
    id,
    address: id,
    created_at: new Date().toISOString(),
    entitled: Boolean(ent?.entitled),
    paid_at: ent?.paid_at,
    portal_slug: ent?.portal_slug,
    login_method: "agentic_wallet",
  };
  writeJson(metaPath, user);
  return user;
}

/** 是否允许 dev 开通（非生产默认开；生产需 JOB_BLOCK_DEV_AUTH=1） */
export function allowDevUnlock(): boolean {
  if (process.env.JOB_BLOCK_DEV_AUTH === "0") return false;
  if (process.env.JOB_BLOCK_DEV_AUTH === "1" || process.env.JOB_BLOCK_DEV_AUTH === "true")
    return true;
  return process.env.NODE_ENV !== "production";
}

/**
 * 是否已开通（付费或已 grant）。
 * 网页能力必须 entitled；开发不自动放行未付费用户。
 */
export function isEntitled(addressOrUserId: string): boolean {
  const id = addressOrUserId.toLowerCase();
  const entitlements = readJson<Record<string, { entitled?: boolean }>>(
    entitlementsPath(),
    {}
  );
  return Boolean(entitlements[id]?.entitled);
}

/**
 * 付费（或 dev）成功后开通：生成 /p/{slug}，只返回链接（不替用户打开）。
 */
export function grantEntitlement(
  addressRaw: string,
  opts?: { paymentId?: string; reason?: string }
):
  | {
      ok: true;
      address: string;
      portal_slug: string;
      /** 唯一应展示给用户的入口，由其自行点击 */
      portalUrl: string;
      paid_at: string;
    }
  | { ok: false; error: string } {
  const address = normalizeAddress(addressRaw);
  if (!address) return { ok: false, error: "无效钱包地址" };

  ensureDataDirs();
  const user = getOrCreateWalletUser(address);
  const paid_at = new Date().toISOString();
  const slug =
    user.portal_slug ||
    `jb-${address.slice(2, 8)}-${crypto.randomBytes(4).toString("hex")}`;

  const entitlements = readJson<
    Record<
      string,
      {
        entitled: boolean;
        paid_at?: string;
        portal_slug?: string;
        payment_id?: string;
        reason?: string;
      }
    >
  >(entitlementsPath(), {});
  entitlements[address] = {
    entitled: true,
    paid_at,
    portal_slug: slug,
    payment_id: opts?.paymentId,
    reason: opts?.reason || "okx_ai_purchase",
  };
  writeJson(entitlementsPath(), entitlements);

  const portals = readJson<Record<string, PortalRecord>>(portalsPath(), {});
  portals[slug] = {
    slug,
    address,
    created_at: portals[slug]?.created_at || paid_at,
    paid_at,
  };
  writeJson(portalsPath(), portals);

  const meta: WalletUser = {
    ...user,
    entitled: true,
    paid_at,
    portal_slug: slug,
    login_method: "agentic_wallet",
  };
  writeJson(path.join(ensureUserData(address), "meta.json"), meta);

  return {
    ok: true,
    address,
    portal_slug: slug,
    portalUrl: portalUrlFor(slug),
    paid_at,
  };
}

/**
 * 用户点击专属链接时：换取网页 session（默认登录）。
 * 未付费开通的 slug 无效。
 */
export function openPortal(
  slug: string
):
  | { ok: true; user: WalletUser; token: string; address: string }
  | { ok: false; error: string } {
  const portals = readJson<Record<string, PortalRecord>>(portalsPath(), {});
  const p = portals[slug];
  if (!p) return { ok: false, error: "专属入口无效或已失效" };
  if (!isEntitled(p.address)) {
    return { ok: false, error: "该入口尚未开通（需先完成 OKX.AI 购买）" };
  }
  const user = getOrCreateWalletUser(p.address);
  const token = createPortalSession(user.id, user.address);
  return { ok: true, user, token, address: user.address };
}

function createPortalSession(userId: string, address: string): string {
  ensureDataDirs();
  const token = crypto.randomBytes(24).toString("hex");
  const sessions = readJson<Record<string, SessionRecord>>(
    files.sessions(),
    {}
  );
  const expires = new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString();
  sessions[token] = {
    token,
    userId: userId.toLowerCase(),
    address: address.toLowerCase(),
    created_at: new Date().toISOString(),
    expires_at: expires,
    via: "portal",
  };
  writeJson(files.sessions(), sessions);
  return token;
}

export function getSession(
  token: string | undefined | null
): SessionRecord | null {
  if (!token) return null;
  const sessions = readJson<Record<string, SessionRecord>>(
    files.sessions(),
    {}
  );
  const s = sessions[token];
  if (!s) return null;
  if (new Date(s.expires_at).getTime() < Date.now()) {
    delete sessions[token];
    writeJson(files.sessions(), sessions);
    return null;
  }
  // 仅认 portal 会话
  if (s.via !== "portal") return null;
  if (!isEntitled(s.address)) return null;
  return s;
}

export function destroySession(token: string | undefined | null): void {
  if (!token) return;
  const sessions = readJson<Record<string, SessionRecord>>(
    files.sessions(),
    {}
  );
  delete sessions[token];
  writeJson(files.sessions(), sessions);
}

export function parseAuthToken(req: {
  headers: Record<string, string | string[] | undefined>;
}): string | null {
  const h = req.headers["authorization"] || req.headers["Authorization"];
  if (typeof h === "string" && h.startsWith("Bearer ")) {
    return h.slice(7).trim();
  }
  return null;
}

/** x402 402 挑战（对接 @okxweb3/x402-* 前的合规形态） */
export function buildX402Challenge(resource: string): {
  status: 402;
  headers: Record<string, string>;
  body: Record<string, unknown>;
} {
  const payTo =
    process.env.PAY_TO_ADDRESS ||
    process.env.JOB_BLOCK_PAY_TO ||
    "0x0000000000000000000000000000000000000000";
  const price =
    process.env.JOB_BLOCK_PRICE_USD ||
    process.env.JOB_BLOCK_PRICE_USDC ||
    "19.99";
  const network = process.env.JOB_BLOCK_NETWORK || "eip155:196";
  // X Layer USDT（与上架服务 fee token 对齐）
  const asset =
    process.env.JOB_BLOCK_USDC_ADDRESS ||
    "0x779ded0c9e1022225f8e0630b35a9b54be713736";
  const publicRes =
    process.env.JOB_BLOCK_PUBLIC_URL ||
    process.env.RENDER_EXTERNAL_URL ||
    resource;
  const resourceUrl = publicRes.includes("/api/access/unlock")
    ? publicRes.replace(/\/$/, "")
    : `${publicRes.replace(/\/$/, "")}/api/access/unlock`;
  const challenge = {
    x402Version: 2,
    accepts: [
      {
        scheme: "exact",
        network,
        maxAmountRequired: String(Math.floor(Number(price) * 1e6)),
        resource: resourceUrl,
        description: "职块 Job Block · OKX.AI 专属求职 Agent",
        mimeType: "application/json",
        payTo,
        maxTimeoutSeconds: 600,
        asset,
        extra: {
          name: "职块 Job Block",
          product: "job-block-access",
        },
      },
    ],
  };
  const b64 = Buffer.from(JSON.stringify(challenge)).toString("base64");
  return {
    status: 402,
    headers: {
      "PAYMENT-REQUIRED": b64,
      "Content-Type": "application/json",
    },
    body: {
      error: "payment_required",
      message:
        "请先完成 OKX.AI 购买（x402）。支付成功后仅返回专属链接，请自行点击打开（默认登录）。",
      x402Version: 2,
      accepts: challenge.accepts,
      next:
        "Agent 应：1) 引导用户完成支付 2) 携带支付凭证重试 unlock 3) 只把 portalUrl 发给用户点击",
    },
  };
}

/**
 * 开通入口：必须先付费凭证，或 allowDevUnlock 下的 dev:true。
 * 成功只返回 portalUrl（链接由用户自行点击）。
 */
export function processUnlock(input: {
  address: string;
  paymentHeader?: string;
  paymentProof?: string;
  dev?: boolean;
}):
  | {
      ok: true;
      portalUrl: string;
      portal_slug: string;
      address: string;
      message: string;
    }
  | { ok: false; error: string; payment_required?: boolean } {
  const address = normalizeAddress(input.address);
  if (!address) return { ok: false, error: "无效钱包地址" };

  if (input.dev) {
    if (!allowDevUnlock()) {
      return { ok: false, error: "生产环境禁止 dev 开通" };
    }
    const r = grantEntitlement(address, { reason: "dev_unlock" });
    if (!r.ok) return r;
    return {
      ok: true,
      portalUrl: r.portalUrl,
      portal_slug: r.portal_slug,
      address: r.address,
      message:
        "开发开通成功。请把下列专属链接发给用户，由其自行点击打开（默认登录）。",
    };
  }

  if (input.paymentHeader || input.paymentProof) {
    // 生产应在此接入 @okxweb3/x402-* 验链；现为合规占位：有支付头即开通
    const r = grantEntitlement(address, {
      paymentId: String(input.paymentHeader || input.paymentProof).slice(0, 120),
      reason: "x402_payment",
    });
    if (!r.ok) return r;
    return {
      ok: true,
      portalUrl: r.portalUrl,
      portal_slug: r.portal_slug,
      address: r.address,
      message:
        "购买成功。请把专属链接发给用户自行点击打开，不要代用户打开浏览器。",
    };
  }

  return {
    ok: false,
    error: "payment_required",
    payment_required: true,
  };
}
