# 职块 Job Block

**Web3 专属求职 Agent** — 多源扫岗 · Hybrid 匹配 · 可解释 shortlist · 材料草稿 · 线下 networking  

> 不是又一个 job board，而是帮你把「值得花时间的机会」打成职块，放进 shortlist。  
> **不自动投递。** AI 评估与起草，人最终拍板。

## 功能（MVP）

| 命令 | 说明 |
|------|------|
| `setup` | 建立画像（BD / Community / Research / Security / Product / …） |
| `scan` | 源 A [web3.career](https://web3.career) + 源 B [dejob.ai](https://www.dejob.ai/job) |
| `ingest-tg` | 源 C [DeJob TG](https://t.me/DeJob_official) 帖子文本入库 |
| `rank` | Embedding/规则召回 Top50 → LLM/规则精排 → Top 5–15 |
| `eval` | 单岗 6 块深评 + 风险 |
| `tailor` | 简历 / cover / 冷信**草稿** |
| `track` / `outcome` | 申请管道与结果校准 |
| `events` | 按城市发现活动（Luma）+ 破冰草稿 |
| `alert` | shortlist 推 Telegram（可选） |

产品说明见 [`docs/PRD.md`](docs/PRD.md)。OKX 上架备忘见 [`docs/OKX-ASP.md`](docs/OKX-ASP.md)。

## 快速开始

### 前端 Setup（推荐）

黑灰白 / OKX 风分步向导，覆盖用户输入 **①–⑬**：

```bash
cd 求职agent
npm install
npm run web
# 浏览器打开 http://127.0.0.1:8787
```

流程：Setup 填画像 → Match 扫描/匹配 → Events 查活动。画像写入 `data/profile.yml`。

### CLI

```bash
npm install
cp .env.example .env   # 可选：OPENAI_API_KEY

npm run jb -- doctor
npm run jb -- setup --example    # 或 setup 交互填 1–13
npm run jb -- scan -n 20
npm run jb -- rank --show 10
npm run jb -- events --city Singapore
```

无 API Key 时：本地 TF 向量 + 规则精排，流水线仍可跑通。

## 典型一周用法

```bash
job-block scan
job-block rank --alert          # 或 rank 后 alert
job-block eval <shortlist里的id>
job-block tailor <id>           # 复制草稿，人工投递
job-block track --id <app> --status applied
job-block outcome <app> interview
job-block events --city Singapore
```

TG 招聘帖：

```bash
npm run jb -- ingest-tg --text '【某协议】Community Lead
远程，负责 Discord…'
```

## 项目结构

```
src/
  cli.ts           # CLI 入口
  ingest/          # web3.career / dejob / paste / TG
  match/           # embed + rules + llm 精排
  eval/ tailor/ track/ events/ alert/
  profile/ store/
.agents/skills/job-block/   # Agent Skill
okx/agent-manifest.json     # 上架对照
data/                       # 本地画像与岗位库（gitignore 敏感文件）
docs/PRD.md
```

## 安全与原则

- 不自动投递、不代报名付费  
- JD 文本按不可信输入处理  
- 简历默认存本地 `data/`  
- Scam 启发式 + 评估 Block G  

## License

MIT
