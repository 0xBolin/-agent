/**
 * OKX x402 卖家配置（HTTP 付费资源）
 * 文档：@okxweb3/x402-express + Facilitator
 */
import {
  paymentMiddleware,
  x402ResourceServer,
} from "@okxweb3/x402-express";
import { ExactEvmScheme } from "@okxweb3/x402-evm/exact/server";
import { OKXFacilitatorClient } from "@okxweb3/x402-core";

export type X402Network = `${string}:${string}`;

export function x402Network(): X402Network {
  const n =
    process.env.JOB_BLOCK_NETWORK || process.env.X402_NETWORK || "eip155:196";
  return n as X402Network;
}

export function payToAddress(): string {
  return (
    process.env.PAY_TO_ADDRESS ||
    process.env.JOB_BLOCK_PAY_TO ||
    ""
  ).trim();
}

export function x402Price(): `$${string}` {
  const n =
    process.env.JOB_BLOCK_PRICE_USD ||
    process.env.JOB_BLOCK_PRICE_USDC ||
    "19.99";
  const num = Number(n);
  if (!Number.isFinite(num) || num <= 0) return "$19.99";
  return `$${num}` as `$${string}`;
}

/** 是否具备接入 x402 SDK 的最低配置 */
export function isX402SdkConfigured(): boolean {
  const payTo = payToAddress();
  const key = process.env.OKX_API_KEY?.trim();
  const secret = process.env.OKX_SECRET_KEY?.trim();
  const pass = process.env.OKX_PASSPHRASE?.trim();
  return Boolean(
    payTo &&
      payTo.startsWith("0x") &&
      payTo.length === 42 &&
      !/^0x0+$/i.test(payTo) &&
      key &&
      secret &&
      pass &&
      key !== "OKX_API_KEY"
  );
}

export function publicBaseUrl(): string {
  let base = (
    process.env.JOB_BLOCK_PUBLIC_URL ||
    process.env.RENDER_EXTERNAL_URL ||
    "http://127.0.0.1:8787"
  ).replace(/\/$/, "");
  // Render / 公网资源必须 https，避免 PAYMENT-REQUIRED.resource.url 落成 http://
  if (
    /^http:\/\//i.test(base) &&
    !/localhost|127\.0\.0\.1/i.test(base)
  ) {
    base = base.replace(/^http:\/\//i, "https://");
  }
  return base;
}

/**
 * 受保护路由：探活用 GET + 业务 POST
 * 官方会探 /x402 /a2a /task /mcp；/ 保持 SPA 免费
 */
export function x402RouteConfig() {
  const payTo = payToAddress() as `0x${string}`;
  const price = x402Price();
  const network = x402Network();
  const accept = {
    scheme: "exact" as const,
    network,
    payTo,
    price,
    maxTimeoutSeconds: 600,
  };
  const meta = {
    description: "职块 Job Block · 专属求职路径开通",
    mimeType: "application/json",
  };

  return {
    "GET /api/access/unlock": { accepts: [accept], ...meta },
    "POST /api/access/unlock": { accepts: [accept], ...meta },
    "GET /x402": { accepts: [accept], ...meta },
    "POST /x402": { accepts: [accept], ...meta },
    "GET /a2a": { accepts: [accept], ...meta },
    "POST /a2a": { accepts: [accept], ...meta },
    "GET /task": { accepts: [accept], ...meta },
    "POST /task": { accepts: [accept], ...meta },
    "GET /mcp": { accepts: [accept], ...meta },
    "POST /mcp": { accepts: [accept], ...meta },
  };
}

export function createX402PaymentMiddleware() {
  if (!isX402SdkConfigured()) {
    throw new Error(
      "x402 未配置：需要 PAY_TO_ADDRESS + OKX_API_KEY + OKX_SECRET_KEY + OKX_PASSPHRASE"
    );
  }

  const facilitatorClient = new OKXFacilitatorClient({
    apiKey: process.env.OKX_API_KEY!,
    secretKey: process.env.OKX_SECRET_KEY!,
    passphrase: process.env.OKX_PASSPHRASE!,
  });

  const resourceServer = new x402ResourceServer(facilitatorClient);
  resourceServer.register(x402Network(), new ExactEvmScheme());

  const routes = x402RouteConfig();
  const middleware = paymentMiddleware(routes, resourceServer);

  return {
    middleware,
    routes,
    resourceServer,
    payTo: payToAddress(),
    price: x402Price(),
  };
}
