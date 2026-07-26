# 职块 × OKX.AI（方案甲定稿）

参考：

- [A2MCP 指南](https://web3.okx.com/zh-hans/onchainos/dev-docs/okxai/howtomcp)
- [通过 SDK 接入支付（Seller）](https://web3.okx.com/zh-hans/onchainos/dev-docs/payments/service-seller-sdk)

## 用户操作流（已拍板）

```
OKX.AI 复制职块 Prompt
    → 在自己的 Agent 打开
    → Agentic Wallet 登录（Agent 只返回 loginUrl，用户自己点）
    → 先付费（x402）或 dev 开通
    → Agent 只返回 portalUrl（/p/slug），用户自己点
    → 专属页默认登录 → Setup / 求职路径
```

## 明确不做

| 取消 | 原因 |
|------|------|
| 邮箱密码注册/登录 | 非方案甲 |
| 纯网页「连接钱包注册/登录」 | 登录只在用户自己的 Agent |
| Agent 代开浏览器进专属页 | 只返回链接，用户自点 |

## API

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/access/unlock` | 无支付 → **402** + `PAYMENT-REQUIRED`；成功 → **仅** `portalUrl` |
| GET | `/api/auth/portal/:slug` | 用户点击 `/p/slug` 后前端换 session（默登） |
| GET | `/p/:slug` | 专属 SPA |

Unlock 成功响应**不含**长期代登 token 给 Agent 注入；session 仅在用户打开 `/p/slug` 时由 `openPortal` 签发。

## 支付

生产：在 `processUnlock` 接入 `@okxweb3/x402-express` 等 SDK 验链（见 Seller SDK 文档）。  
当前仓库提供合规 **402 形态** + 支付头占位开通，便于联调。

```bash
JOB_BLOCK_PUBLIC_URL=https://your.domain
JOB_BLOCK_PAY_TO=0x...
JOB_BLOCK_NETWORK=eip155:196
JOB_BLOCK_PRICE_USDC=5
JOB_BLOCK_REQUIRE_PAYMENT=1
JOB_BLOCK_DEV_AUTH=0   # 生产关闭 dev
```

## 用户 Prompt

见 [USER-PROMPT.md](./USER-PROMPT.md)。
