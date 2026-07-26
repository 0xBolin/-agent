# 在 Render 上部署职块

## 1. 前置

- 代码推到 GitHub/GitLab
- Render 账号绑定该仓库

## 2. 用 Blueprint

1. Render Dashboard → **New** → **Blueprint**
2. 选择含 `render.yaml` 的仓库
3. 确认服务 `job-block` 后 Apply

或 **New Web Service** 手动填：

| 项 | 值 |
|----|-----|
| Runtime | Node |
| Build | `npm ci && npm run build` |
| Start | `npm run start:web` |
| Health Check | `/api/health` |

## 3. 环境变量（Dashboard 必填）

| Key | 说明 |
|-----|------|
| `JOB_BLOCK_PUBLIC_URL` | `https://<你的服务名>.onrender.com` |
| `OPENAI_API_KEY` | 可选，简历/精排更好 |
| `JOB_BLOCK_PAY_TO` | 收款地址（上架支付时） |
| `JOB_BLOCK_DEV_AUTH` | 生产保持 `0`；临时演示可 `1` |

未设 `JOB_BLOCK_PUBLIC_URL` 时会尝试 `RENDER_EXTERNAL_URL`。

## 4. 磁盘

`render.yaml` 将数据挂到 `/var/data`（账号、门户、画像）。

> Free 实例若无 Disk，去掉 `disk` 段；数据会在重启后丢失。需要持久化请用带 Disk 的计划。

## 5. 验证

```bash
curl -s https://<your-app>.onrender.com/api/health
```

应返回 `"ok": true`、`"auth": "portal_only"`。

模拟开通（仅 `JOB_BLOCK_DEV_AUTH=1` 时）：

```bash
curl -s -X POST https://<your-app>.onrender.com/api/access/unlock \
  -H 'Content-Type: application/json' \
  -d '{"address":"0x5555555555555555555555555555555555555555","dev":true}'
```

把返回的 `portalUrl` 在浏览器打开。

## 6. 与 Agent Prompt

把 `docs/USER-PROMPT.md` 里的 `{{JOB_BLOCK_PUBLIC_URL}}` 换成 Render 公网地址。
