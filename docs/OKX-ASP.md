# 职块 → OKX AI / Build X 上架备忘

> 当前阶段：**先把 Agent 做出来**。本文仅保证仓库结构便于你之后上传/注册，不强制现在完成链上操作。

## 相关入口

- Build X 系列：https://web3.okx.com/zh-hans/xlayer/build-x-series  
- OKX Agents：https://www.okx.ai/zh-hans/agents  
- OnchainOS 文档：https://web3.okx.com/zh-hans/onchainos/dev-docs/home/what-is-onchainos  
- ASP 教程：https://www.okx.ai/zh-hans/tutorial/asp  

## 仓库里已为你准备的

| 文件 | 用途 |
|------|------|
| `okx/agent-manifest.json` | 名称、能力、服务建议、安全策略一览，填 ASP 表单时可对照 |
| `.agents/skills/job-block/SKILL.md` | 在支持 Agent Skill 的 CLI（含 Grok/Claude）中直接调用 |
| `src/index.ts` | 可编程 API，后续可包一层 HTTP 作为 ASP endpoint |

## 建议的 ASP 服务拆分（上架时）

1. **Web3 Job Shortlist** — 入参：角色/技能/偏好；出参：shortlist JSON  
2. **Job Eval Report** — 入参：JD 文本或 URL；出参：评估 Markdown  
3. **City Networking Events** — 入参：city；出参：活动列表 + 破冰草稿  

费用与链上身份：按 OKX 当前 ASP 流程（XLayer、预检、确认卡）操作；本 Agent 业务本身**不强制**用户链上支付求职。

## 本地验证清单（上传前）

```bash
npm install
cp .env.example .env   # 可选填 LLM Key
npx tsx src/cli.ts doctor
npx tsx src/cli.ts setup --example
npx tsx src/cli.ts scan -n 10
npx tsx src/cli.ts rank --show 5
npx tsx src/cli.ts events --city Singapore
```

## 以后若要 HTTP 化

可在 `src/` 旁增加轻量 `server.ts`（Express/Hono），把 `scanAll` / `rankJobs` / `listEvents` 暴露为 JSON API，再把 URL 填进 ASP service endpoint。  
**尚未实现 HTTP 服务**——避免过早绑定比赛接口；CLI + library 已足够演示与自用。
