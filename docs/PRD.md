# PRD：职块（Job Block）— Web3 专属求职 Agent

| 字段 | 内容 |
|------|------|
| 产品名称 | **职块（Job Block）** |
| 文档版本 | v1.1 |
| 状态 | 关键决策已锁定 — 可进入技术设计 |
| 日期 | 2026-07-26 |
| 作者 | Product / Agent 协作草案 |
| 关联参考 | [ai-job-search](https://github.com/MadsLorentzen/ai-job-search)、[career-ops](https://github.com/santifer/career-ops)、[LittlePinkPotato](https://littlepinkpotato.com) |

---

## 1. 概述

### 1.1 一句话定位

> **职块（Job Block）** 不是又一个 Web3 job board，而是一个懂角色、懂协议、懂 token 补偿、能从 board + ATS + 社群噪声里筛出「值得花时间」的 shortlist，并附带线下 networking 发现的 **Web3 求职 Agent**。

**命名释义：** 每一条值得关注的机会是一块「职块」——像 block 一样被打包、校验、上链到你的 shortlist；噪音不配上链。

### 1.2 产品形态（已确认）

| 层级 | 选择 |
|------|------|
| 品牌 | **职块 / Job Block** |
| 核心形态 | **本地 Agent Skill 工作流**（Claude Code / Codex / Grok 等 CLI） |
| 触达形态 | **Telegram Bot 日报 / 周报 Alert** |
| 后期可选 | Web 托管、雇主端预筛（不在 MVP） |

### 1.3 核心理念

1. **工作来找你，而不是你去刷板**（雇员叙事，非招聘网站叙事）。
2. **AI 评估与起草，人最终拍板**；默认不自动真正投递申请。
3. **可解释匹配**：每个推荐必须说清「为什么推 / 差在哪里」。
4. **反馈闭环**：申请结果回写，持续校准评分。
5. **Web3 特化**：角色、赛道、补偿结构、scam 风险、协议背景，而非通用关键词。

---

## 2. 问题陈述

### 2.1 求职者侧

| 痛点 | 表现 |
|------|------|
| 信息碎片化 | 岗位散落在 web3.career、公司 ATS、LinkedIn、TG 群、Discord、X 推文；每天刷 5 个群、100 条 JD，仍以大交易所 BD 为主 |
| 匹配低效 | 海投与错投并存；「做过 DeFi 审计」与「Solidity 安全 3 年」本质同类，关键词系统匹配不上 |
| 时效与遗漏 | 今天不上线就错过；真正好机会可能在小项目方朋友圈 / 推荐贴 |
| 角色路径不清 | BD / Community / Research / Security / Product 评估维度差异大，通用工具一刀切 |
| 材料成本高 | 每岗定制简历、cover、冷启动私信耗时；Web3 还需懂协议叙事 |
| 线下 networking 断层 | 大会、meetup、side event 极多，但「人在某城、想蹭对的活动」缺少结构化发现 |

### 2.2 市场侧结构性缺陷

传统招聘平台解决的是「发布与搜索」：你不搜就没有匹配，搜不准全是噪音。  
Web3 还额外放大了：假岗 / ghost job、token-only 补偿陷阱、项目存活风险。

### 2.3 本产品要解决的核心问题

> 把「分散信息 + 错误匹配 + 重复文书 + 线下活动发现」收敛成一条 **可托管的 Agent 流水线**，让用户每周只花约 **10 分钟** review shortlist，并把时间用在面试与 networking 上。

---

## 3. 目标与非目标

### 3.1 产品目标

| ID | 目标 | 衡量（MVP 期） |
|----|------|----------------|
| G1 | 多源聚合 Web3 岗位并去重 | ≥ 2 个稳定公开源 + ATS 模式可扩展 |
| G2 | 按角色画像做可解释匹配 | 高分 shortlist 中用户认可「值得点开」≥ 50% |
| G3 | 降低刷板时间 | 用户主观：从日更刷板 → 周更 10 分钟 review |
| G4 | 覆盖非纯开发职能 | BD / Community / Research / Security / Product 均可建立画像与打分 |
| G5 | 线下 networking 可发现 | 按城市 + 活动类型返回可行动的活动清单 |
| G6 | 材料辅助 | 单岗可生成简历/cover/冷信草稿（不自动发送） |

### 3.2 非目标（MVP 明确不做）

- 又一个公开 job board / 海量 UGC 招聘站
- 默认全自动投递、自动多轮谈薪并代用户承诺
- 完整雇主端发岗与 CRM（可记入远期）
- 全网 Telegram 无差别爬虫（合规与噪声风险高）
- 强制绑定链上地址或完整 on-chain 声誉系统
- 替代用户做最终「是否申请 / 是否去某活动」决策

---

## 4. 目标用户

### 4.1 主用户画像（MVP 全覆盖，开发可后续加强）

| 角色线 | 典型诉求 | 匹配关键信号 |
|--------|----------|--------------|
| **BD / Growth** | 找协议 / 交易所 / 钱包的商务与增长岗 | 资源网络、区域市场（SEA/LATAM 等）、过往 deal、KOL/渠道、英语/本地语言 |
| **Community** | Moderator、Community Lead、Ambassador | 社群规模与活跃、活动组织、内容、危机处理、多语言 |
| **Research** | Research Analyst、Token Research、Governance | 研报样本、赛道深度、链上分析、写作、量化/基本面 |
| **Security** | Auditor、Security Engineer、Bug Bounty | 审计报告、漏洞类型、工具链、语言（Solidity/Rust）、赏金记录 |
| **Product** | PM、Product Lead（协议/钱包/交易所） | 0-1 / 迭代经验、Tokenomics 协作、跨职能、指标意识、Web3 产品案例 |

> **说明：** Engineering（Solidity / Full-stack 等）为自然扩展角色，数据模型预留，但不作为 MVP 唯一焦点；评分框架按角色线可配置权重。

### 4.2 用户情境（Jobs-to-be-Done）

1. **主动求职者**：不想天天刷板，怕错过好机会 → 设 Alert，只看高分岗。  
2. **在职观望者**：不便公开找工作 → 后台静默扫描，有高匹配再通知。  
3. **转行 / 应届**：不确定适合什么 → 上传经历，看匹配分布反推市场定位。  
4. **到城 networking**：出差或驻某城 → 按城市找大会 / meetup / side event，准备破冰话题。

### 4.3 非目标用户（MVP）

- 纯 Web2 求职、无任何 Web3 意向  
- 需要 RPO/猎头全托管服务的企业 HR（远期雇主端再考虑）

---

## 5. 用户故事与主路径

### 5.1 主路径：求职流水线

```
Setup 画像 → Scan 多源 → Rank 打分 → Review shortlist
                ↓
         Eval 单岗深评 → Tailor 材料草稿 → Track 状态
                ↓
         Outcome 结果回写 → 校准评分
```

### 5.2 辅路径：线下 Networking

```
设置城市 / 出行日期 / 兴趣赛道与角色
        ↓
发现活动（大会、meetup、workshop、side event）
        ↓
筛选（时间、类型、相关度）→ 活动 briefing
        ↓
（可选）生成自我介绍 / 破冰话题 / 目标人类型建议
```

### 5.3 核心用户故事

| ID | 作为… | 我想要… | 以便… |
|----|--------|---------|--------|
| US-01 | 任意目标角色用户 | 用简历 + 对话完成 setup | 不用填一堆表单就能建立画像 |
| US-02 | 求职者 | 系统每日/每周扫岗并推高分结果 | 不用自己刷多个平台 |
| US-03 | 求职者 | 看到匹配分 + 优势 + 风险 | 快速决定 skip / apply |
| US-04 | Security / Research 等 | 按我的角色维度加权打分 | 不是用开发岗标准误判我 |
| US-05 | 求职者 | 对单个 JD 深度评估并出材料草稿 | 提高申请质量、降低文书时间 |
| US-06 | 求职者 | 追踪申请状态与跟进提醒 | 不漏跟、可复盘 |
| US-07 | 到访者 / 常驻用户 | 按城市发现 Web3 线下活动 | 有效 networking |
| US-08 | 用户 | 随时删除本地/同步的个人数据 | 控制隐私 |

---

## 6. 功能需求

### 6.1 功能总览与优先级

| 模块 | 优先级 | MVP | 说明 |
|------|--------|-----|------|
| M1 画像 Setup | P0 | ✅ | 多角色画像 |
| M2 岗位 Scan | P0 | ✅ | 2–3 稳定源 + 统一 schema |
| M3 Rank / 匹配 | P0 | ✅ | 硬过滤 + rubric + 可解释 |
| M4 Eval 深评 | P0 | ✅ | 单岗 6 块评估 + scam 检查 |
| M5 Tailor 材料 | P0 | ✅ | 简历/cover/冷信草稿 |
| M6 Tracker | P0 | ✅ | 状态机 + 归档 |
| M7 Alert（TG） | P0 | ✅ | 日/周推送 shortlist |
| M8 Events / Networking | P1 | ✅（小功能，MVP 含基础版） | 城市 + 活动发现 |
| M9 Outcome 校准 | P1 | ✅ 轻量 | 结果回写 |
| M10 Interview Prep | P2 | ⏳ v1.1 | STAR + 协议研究 |
| M11 Upskill 缺口 | P2 | ⏳ | 技能热图 |
| M12 自动投递 | P3 | ❌ | 明确延后 |
| M13 雇主端 | P3 | ❌ | 远期 |

---

### 6.2 M1 — 画像 Setup

**描述：** 从简历 PDF/文本、链接（LinkedIn/个人站/GitHub）、或对话访谈建立结构化画像。

**功能点：**

1. 解析简历，提取经历、技能、成果，映射到角色标签（可多选主角色 + 次角色）。  
2. 收集偏好：remote/hybrid、时区、城市、薪资结构偏好（法币 / 稳定币 / token 比例）、赛道黑白名单、语言。  
3. **按角色线的附加字段**（见 §7.1）。  
4. 硬过滤 deal-breakers（如：不接受 token-only、不碰某赛道、需签证支持等）。  
5. 输出可读 profile（Markdown/YAML），支持增量更新与 re-setup。

**验收标准：**

- 用户 10 分钟内可完成首次 setup。  
- 五个角色线均有可填写/可推断的差异化字段。  
- Profile 变更后，后续 rank 使用最新版本。

---

### 6.3 M2 — 岗位 Scan

**描述：** 从多源拉取 Web3 相关岗位，归一化、去重、入库。

**MVP 数据源（已锁定）：**

| 代号 | 类型 | 地址 | 说明 |
|------|------|------|------|
| **源 A** | 垂直 Board | [web3.career](https://web3.career/) | 英文主流量 Web3 board；HTTP 可达 |
| **源 B** | 垂直 Board（中文/远程向） | [dejob.ai/job](https://www.dejob.ai/job) | DeJob Web3/远程招聘；SPA，ingest 需 API 或渲染策略 |
| **源 C** | Telegram 社群 | [t.me/DeJob_official](https://t.me/DeJob_official) | 社群招聘帖；需 TG 采集/导出/半自动入库，**非网页爬虫** |
| **保底** | 手工入口 | 用户粘贴 JD / URL | 任意来源可进同一 pipeline |

> **实现备注：** 源 C 与网页源工程路径不同（Bot API / 用户转发到 Agent / 定期导出）。MVP 允许「用户转发 TG 帖到机器人即入库」作为源 C 的 v0，再迭代自动监听。

**功能点：**

1. 定时或手动 `/scan`。  
2. 统一 Job schema（§7.2）。  
3. 去重：规范化公司名 + 角色标题 + 链接指纹 / 内容 hash。  
4. 标记过期、重复、低质。  
5. 角色粗分类（BD / Community / Research / Security / Product / Engineering / Other）。

**验收标准：**

- 单次 scan 至少覆盖源 A + 源 B 之一成功拉取（源失败可降级）。  
- 源 C 或粘贴入口可将 TG 风格文本归一为 Job。  
- 粘贴任意 JD 文本可进入同一 pipeline。  
- 失败源不影响其他源（容错）。

---

### 6.4 M3 — Rank / 匹配

**描述：** 对岗位批量打分，生成 shortlist。

**流水线（已锁定：Hybrid 粗筛 + 精排）：**

```
全量扫描岗位（源 A/B/C + 粘贴）
        │
        ▼
① 硬过滤（deal-breaker → veto / 丢弃）
        │
        ▼
② Embedding + 规则 粗筛召回 → Top 50
        │
        ▼
③ LLM 结构化打分（多维度 rubric + 解释）→ 精排
        │
        ▼
④ 人只 review Top 5–15 shortlist（Alert / /rank 默认展示）
```

| 阶段 | 技术 | 职责 |
|------|------|------|
| 硬过滤 | 规则 | 地点、remote、token-only、赛道黑名单等一票否决 |
| 粗筛召回 | Embedding + 轻量规则 | 从大量岗位中召回语义相近的 Top 50；控制 LLM 成本 |
| 精排 | LLM 结构化打分 | 分角色权重、0–100 分、strengths/gaps/risks、apply\|maybe\|skip |
| 展示 | 产品阈值 | 默认只推 Top 5–15；其余可展开 |

**量表：** 对外展示 **0–100**；内部维度 **1–5** 再加权映射。

**阈值建议（产品默认，可配置）：**

| 分数 | 动作 |
|------|------|
| ≥ 85 | 强推，进入 Alert 优先区 |
| 70–84 | 值得看 |
| 60–69 | 可选，默认折叠 |
| < 60 | 默认跳过（精排后通常已不在 shortlist） |

**验收标准：**

- 岗位池 > 50 时，LLM 精排调用次数量级为召回集（约 ≤50），而非全量。  
- 每条 shortlist 含：分数、1–3 条优势、1–3 条缺口/风险、推荐动作（apply / maybe / skip）。  
- 同一用户切换主角色后，排序明显变化（抽检）。  
- 支持 `/rank` 批量与增量（仅新岗）。  
- Embedding 服务不可用时，可降级为「规则召回 + LLM 精排」（降级需文档化）。

---

### 6.5 M4 — Eval 单岗深评

**描述：** 对用户选定的岗位做深度评估（借鉴 career-ops 6-Block + 合法性）。

**评估块：**

| Block | 内容 |
|-------|------|
| A | 角色摘要（职责、汇报线、成功标准） |
| B | 与画像匹配（按角色权重） |
| C | Level 策略（偏 junior/senior？如何包装） |
| D | 补偿研究（法币/token/equity 提示；无数据则标 unknown） |
| E | 个性化申请角度（why this protocol / team） |
| F | 面试准备线索（可能问题、需补的故事） |
| G | **合法性 / 风险**（scam、ghost、异常薪资、匿名方、需先付费等） |

**验收标准：**

- 输出结构化报告（Markdown），可归档到 tracker。  
- Block G 对明显 scam 特征给出明确 flag，不得静默忽略。

---

### 6.6 M5 — Tailor 材料

**描述：** 基于 profile + JD 生成申请材料**草稿**。

**产出：**

1. 定制简历要点（Markdown；可选 PDF 为 v1.1）  
2. Cover letter / 简短自我推荐  
3. 冷启动私信（≤300 字量级，适配 TG/LinkedIn/X）  
4. 关键词镜像提示（便于过人工筛选，而非无脑堆砌）

**约束：**

- 禁止编造经历；缺口需诚实 bridging 话术。  
- **只起草，不发送、不提交表单。**

**验收标准：**

- 草稿中的经历均可追溯到 profile。  
- 用户可一键复制；支持按反馈修订一轮（drafter-reviewer 可选）。

---

### 6.7 M6 — Tracker

**描述：** 申请管道状态管理。

**状态机（最小集）：**

```
new → ranked → evaluating → prepared → applied → 
  interviewing → offer | rejected | ghosted | withdrawn
```

**功能点：**

1. 列表 / 筛选 / 排序  
2. 归档：JD 原文、评估报告、提交材料版本  
3. 跟进提醒（如 applied 后 N 天无更新）  
4. 导出（CSV 或本地 Markdown 目录）

**验收标准：**

- 任一申请可从 ranked 走到终态且历史可查。  
- 本地文件为 system of record（云同步非 MVP）。

---

### 6.8 M7 — Telegram Alert

**描述：** 将 shortlist 推送到用户 Telegram。

**功能点：**

1. 绑定 chat（token + 用户授权）  
2. 频率：daily / weekly  
3. 内容：高分岗标题、公司、分数、一句话理由、深度链接或 ID（回 CLI 用 `/eval`）  
4. 静默规则：无高分岗可不推或推「今日无 ≥85」摘要  

**验收标准：**

- 用户可完成绑定并收到至少一次测试推送。  
- 推送内容不含完整简历等敏感大字段。

---

### 6.9 M8 — Events / Networking（新增小功能）

**描述：** 根据**城市**与**活动类型/兴趣**发现 Web3 线下活动，辅助 networking。

#### 6.9.1 用户价值

- 求职不只是网申：大会、meetup、project dinner 是 BD/Community/Product 的关键渠道。  
- 出差或「人在某城一周」时，快速得到可行动清单 + 破冰素材。

#### 6.9.2 功能范围（MVP 基础版）

| 能力 | MVP | 说明 |
|------|-----|------|
| 按城市查询活动 | ✅ | 如 Singapore、HK、Bali、Shanghai、Dubai… |
| 按时间窗过滤 | ✅ | 本周 / 本月 / 自定义区间 |
| 按类型过滤 | ✅ | Conference / Meetup / Workshop / Side event / Hackathon / Networking party |
| 按赛道/角色相关度排序 | ✅ | 结合用户 profile 的赛道与角色 |
| 活动详情卡 | ✅ | 名称、时间、地点、链接、主办、简介 |
| 一句话「为什么值得去」 | ✅ | 基于 profile 生成 |
| 破冰 / 自我介绍草稿 | ✅ | 可选生成 30s pitch |
| 票务代购 / 自动报名 | ❌ | 不做 |
| 实时人脉匹配（谁去了同一场） | ❌ | 远期 |
| 全量爬取所有闭门局 | ❌ | 不现实；支持用户粘贴活动链接丰富库 |

#### 6.9.3 数据来源策略（MVP，已锁定）

| 代号 | 类型 | 地址 / 形态 | 说明 |
|------|------|-------------|------|
| **活动源 Luma** | 公开活动平台 | [Luma](https://luma.com) | 主数据平台；示例活动：[Zama Builder Villa @ ETHCC9](https://luma.com/the-zama-builder-villa-ethcc9) |
| **用户提交** | 粘贴 URL/文本 | 任意 Luma/官网链接 | 解析为 Event schema，纳入「我的行程」 |
| **种子列表（可选增强）** | 配置 YAML | 头部大会 / 常驻 meetup | 补 Luma 检索盲区 |

> **说明：** 用户给出的 Luma 链接为**单场活动样例**，产品能力是「按城市/时间/类型在 Luma（及粘贴）上发现活动」，而非只索引这一场。Invite-only 活动须标注门槛，不得承诺可报名。  

#### 6.9.4 交互（命令草案）

```
/events                          # 用 profile 默认城市
/events city=Singapore           # 指定城市
/events city=HK from=2026-08-01 to=2026-08-07 type=meetup
/events brief <event_id>         # 活动 briefing + 破冰草稿
```

Telegram：可推送「你所在城市本周 3 场高相关活动」（若用户开启 events alert）。

#### 6.9.5 验收标准

- 指定城市 + 时间窗，返回 ≥0 条结果；无结果时给出「扩大范围 / 换城 / 手动添加」引导。  
- 每条活动含可点击来源链接（若有）。  
- briefing 不编造不存在的嘉宾或主办方信息；未知则标 unknown。  
- 与求职主路径数据隔离清晰，但共享 profile（城市、角色、赛道）。

---

### 6.10 M9 — Outcome 校准（轻量）

**描述：** 记录申请结果，用于改进匹配。

**功能点：**

1. 记录：interview / offer / rejected / ghosted 及简短原因标签。  
2. 提示用户：哪些「高分却被拒」或「低分却进面」→ 建议调整权重。  
3. MVP 可为半自动：Agent 根据 outcome 提议改 profile，用户确认。

**验收标准：**

- 至少支持手动写入 outcome 并体现在 tracker。  
- 有 3 条以上 outcome 后，系统能给出至少 1 条可执行的校准建议。

---

### 6.11 命令表面（CLI Agent 统一入口）

| 命令 | 模块 | MVP |
|------|------|-----|
| `/setup` | M1 | ✅ |
| `/scan` | M2 | ✅ |
| `/rank` | M3 | ✅ |
| `/eval <url\|text\|id>` | M4 | ✅ |
| `/tailor [id]` | M5 | ✅ |
| `/track` | M6 | ✅ |
| `/alert` | M7 配置 | ✅ |
| `/events` | M8 | ✅ |
| `/outcome` | M9 | ✅ |
| `/interview` | M10 | ⏳ |
| `/upskill` | M11 | ⏳ |

所有写操作材料均为 draft；涉及「发送/报名/付费」必须人工。

---

## 7. 领域模型

### 7.1 候选人 Profile（逻辑字段）

**通用：**

- identity：姓名展示名、联系方式（可选）、时区  
- roles：primary + secondary（enum：BD, Community, Research, Security, Product, Engineering）  
- experience_years、languages  
- location_pref：cities[], remote_ok, hybrid_ok  
- comp_pref：min_base_fiat, token_ok, token_only_ok, equity_ok  
- sectors_whitelist / blacklist  
- deal_breakers[]  
- summary、highlights[]  
- writing_style 备注（可选）

**角色扩展（示例）：**

| 角色 | 扩展字段示例 |
|------|----------------|
| BD | regions[], channels[], deal_examples[], quota_or_pipeline 指标 |
| Community | platforms[], community_size_peak, content_samples, languages_moderation |
| Research | report_links[], methods[]（onchain/fundamental/quant）, sectors_depth[] |
| Security | audit_count_or_links[], languages_sc[], tools[], bounty_highlights[] |
| Product | product_areas[], 0to1_vs_scale, metrics_owned[], stakeholder_types[] |

### 7.2 Job（逻辑字段）

- id, source, source_url, scraped_at  
- company / protocol_name  
- title, role_family  
- description_raw, description_clean  
- location, remote_type  
- comp_hint（文本或结构化，可空）  
- chain_or_sector tags[]  
- posted_at, expires_at  
- legitimacy_flags[]  
- match_score, match_rationale（相对某 user）

### 7.3 Event（逻辑字段）

- id, title, city, country, venue  
- start_at, end_at, timezone  
- event_type, sectors[]  
- url, host, description  
- relevance_score（相对 user）, why_attend  

### 7.4 Application（逻辑字段）

- job_id, status, timeline[]  
- eval_report_path, materials_paths[]  
- outcome, outcome_notes  

---

## 8. 匹配与评分设计

### 8.1 原则

1. **角色权重不同**：同一 JD，BD 与 Security 的维度权重表不同。  
2. **硬过滤优先于分数**。  
3. **Hybrid：** Embedding/规则负责规模与召回；LLM 负责精排与可解释。  
4. **可解释 shortlist**：人看到的 5–15 条必须有理由，不能只给向量分。  
5. **Web3 特有维度**：赛道/协议相关度、补偿结构合理性、项目风险与岗位真实性。

### 8.2 维度草案（内部 1–5，再映射总分）

| 维度 | 说明 | BD | Comm | Res | Sec | Prod |
|------|------|----|------|-----|-----|------|
| Skills / 经历匹配 | 职责与过往重合 | 高 | 高 | 高 | 高 | 高 |
| Domain / 赛道 | DeFi/Infra/Game 等 | 中 | 中 | 高 | 高 | 高 |
| Level fit | 级别是否错位 | 中 | 中 | 中 | 高 | 中 |
| Comp fit | 与偏好一致 | 高 | 中 | 中 | 中 | 中 |
| Geo / Remote | 地点与时区 | 高 | 中 | 低 | 低 | 中 |
| Network leverage | 是否吃你的区域/人脉（BD/Comm 更重） | 高 | 高 | 低 | 低 | 中 |
| Risk / Legitimacy | scam、项目存续 | 高 | 高 | 高 | 高 | 高 |

> 具体权重表在实现前锁定一版 v0，并用 outcome 迭代。

### 8.3 语义等价（产品要求）

匹配引擎应理解 Web3 常见等价表述，例如：

- 「协议审计」≈「Smart contract security」  
- 「社区运营」≈「Community / Moderation / Ambassador」  
- 「研报」≈「Research analyst / Token research」  

---

## 9. 交互与体验原则

1. **雇员感**：文案用「已为你筛完 / 建议优先看这 5 个」，而非「搜索结果共 2000」。  
2. **默认少打扰**：Alert 宁缺毋滥。  
3. **信任与安全**：  
   - JD / 活动描述当不可信输入（防 prompt injection）  
   - 不默认外发用户隐私  
   - 支持删除 profile 与归档  
4. **本地优先**：MVP 数据落本地仓库目录；TG 仅推摘要。  
5. **Human-in-the-loop**：apply / 报名 / 付费 / 谈薪承诺必须人确认。

---

## 10. 技术架构（逻辑，非实现绑定）

```
┌─────────────────────────────────────────────────────────┐
│  Interfaces                                              │
│  CLI Skills (setup/scan/rank/eval/tailor/track/events) │
│  Telegram Bot (alert + 轻查询)                           │
└───────────────────────────┬─────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────┐
│  Agent Orchestration（LLM + 工具调用）                    │
│  Profile · Match · Eval · Draft · Briefing               │
└───────┬─────────────────────┬───────────────────────────┘
        │                     │
┌───────▼────────┐   ┌────────▼────────┐
│ Ingestion      │   │ Store (local)   │
│ Boards / ATS   │   │ profile.yml     │
│ Paste JD       │   │ jobs/           │
│ Events sources │   │ applications/   │
└────────────────┘   │ events/         │
                     │ tracker.csv     │
                     └─────────────────┘
```

**实现偏好（建议，可在技术设计再定）：**

- 与 career-ops / ai-job-search 类似的 **Agent Skill 标准目录结构**  
- 配置与数据 Markdown/YAML/CSV，便于 Git 管理与审计  
- LLM：用户 BYOK 或 CLI 自带额度  

---

## 11. 隐私、合规与安全

| 项 | 要求 |
|----|------|
| 简历与联系方式 | 默认本地；不上传第三方（除用户主动使用的 LLM API） |
| Telegram | 仅推送岗位/活动摘要，不含完整简历 |
| 爬虫 / 聚合 | 遵守目标站 ToS；优先官方 RSS/API/公开页；控制频率 |
| Prompt 安全 | 外部 JD/活动文本不可提升权限或外泄 secrets |
| Scam | 评估与 Alert 中显著展示风险 flag |
| 删除权 | `/reset` 或文档说明可删除全部个人数据 |

---

## 12. 成功指标

### 12.1 MVP 北向指标

| 指标 | 目标（内测 4 周） |
|------|-------------------|
| 激活 | ≥ 5 名目标角色用户完成 setup + 至少 1 次 rank |
| 匹配质量 | 抽样 shortlist「值得点开」≥ 50% |
| 参与 | 周活跃用户中 ≥ 60% 打开 Alert 或执行 `/rank` |
| 转化辅助 | ≥ 3 人使用 tailor 产出材料并真实投递 ≥ 1 次 |
| Events | ≥ 3 人使用 `/events` 并反馈「至少 1 场相关」 |
| 安全 | 0 起自动误投递；scam flag 无系统性漏报（抽检） |

### 12.2 护栏指标

- Alert 投诉「太吵」→ 提高默认阈值或降频  
- 高分岗大量过期/重复 → 加强 dedupe 与 freshness  

---

## 13. 里程碑与范围

### Phase 0 — 对齐（已完成讨论）

- 用户、形态、非目标、Events 小功能确认  

### Phase 1 — MVP（建议 2–4 周可自用）

**Must：**

1. 品牌与仓库：职块（Job Block）  
2. 五角色 Profile + `/setup`  
3. Scan：源 A web3.career + 源 B dejob.ai + 源 C DeJob TG（可 v0 转发入库）+ 粘贴 JD  
4. Rank：**Embedding/规则 Top 50 → LLM 精排 → 展示 Top 5–15**  
5. Eval + Tailor 草稿  
6. Tracker  
7. Telegram Alert  
8. Events：Luma + 粘贴链接；城市 + 时间 + 类型 + briefing/破冰草稿  

**Must not：** 自动投递、雇主端  

**架构 Must：** Hybrid 匹配管道（可先本地轻量向量，但不得省略「召回 + 精排」分层）

### Phase 2 — v1.1

- Interview prep、协议 deep research  
- Outcome 驱动的权重校准自动化增强  
- Events 数据源扩展、行程日历导出  
- PDF 简历导出  

### Phase 3 — 产品化（可选）

- 托管云版本、多租户  
- 雇主端预筛  
- 更强社群源（合规前提下）  

---

## 14. 风险与对策

| 风险 | 影响 | 对策 |
|------|------|------|
| 数据源不稳定 / 反爬 | Scan 质量下降 | 多源 + 粘贴入口 + ATS 官方页；可插拔 portal skill |
| 匹配不准导致不信任 | 弃用 | 可解释性、角色权重、outcome 校准、阈值宁缺毋滥 |
| Web3 假岗 | 用户受损 | Block G + 规则库 + 用户举报字段 |
| LLM 幻觉经历 | 诚信风险 | 禁止编造；材料溯源 profile |
| 活动数据稀缺/过期 | Events 价值低 | 种子列表 + 用户提交 + 无结果引导 |
| 范围蔓延 | MVP 延期 | 本 PRD 非目标清单强约束 |
| 隐私与 ToS | 合规 | 本地优先、摘要推送、合规采集 |

---

## 15. 竞品与借鉴摘要

| 参考 | 借鉴 | 本产品差异 |
|------|------|------------|
| ai-job-search | 命令流水线、双 agent 起草、outcome 闭环、portal 可插拔 | Web3 角色与数据源；Events |
| career-ops | 6-Block 评估、scam 检查、pipeline 完整性、contact/冷信 | 非通用科技岗；BD/Comm 等权重；TG Alert |
| LittlePinkPotato | 雇员叙事、Alert、hybrid 匹配心智、免费+BYOK | Web3 更深；本地 CLI 优先；五角色+线下活动 |

---

## 16. 已锁定决策（原开放问题决议）

| # | 议题 | 决议 | 日期 |
|---|------|------|------|
| 1 | 产品名称 | **职块（Job Block）** | 2026-07-26 |
| 2 | 岗位数据源 MVP | **A** [web3.career](https://web3.career/) · **B** [dejob.ai/job](https://www.dejob.ai/job) · **C** [t.me/DeJob_official](https://t.me/DeJob_official) · **保底**粘贴 JD | 2026-07-26 |
| 3 | 活动数据源 MVP | **Luma** 为主（样例：[Zama Builder Villa](https://luma.com/the-zama-builder-villa-ethcc9)）+ 用户粘贴活动链接 | 2026-07-26 |
| 4 | 匹配架构 | **Hybrid**：Embedding/规则召回 Top 50 → LLM 结构化精排 → 人看 Top 5–15 | 2026-07-26 |
| 5 | 对外分数量表 | **0–100**（内部维度 1–5） | 2026-07-26 |

### 16.1 数据源可达性速记（决议日探测）

| 源 | HTTP | 备注 |
|----|------|------|
| web3.career | 200 | 传统 HTML board，ingest 相对直接 |
| dejob.ai/job | 200 | SPA（React），需找 API 或 headless；标题「专注于 Web3、远程招聘」 |
| t.me/DeJob_official | TG 生态 | 需 Bot/转发/导出路径，见 M2 实现备注 |
| luma.com 活动页 | 200 | 单场可解析；城市检索需 Luma 搜索/日历能力 POC |

### 16.2 仍可在技术设计阶段细化（不阻塞品牌与架构）

1. Embedding 模型与本地/云向量存储选型。  
2. Telegram Alert Bot：自建 vs 最小 webhook。  
3. Engineering 角色线完整权重表（模型已预留）。  
4. 各源具体解析器与 ToS 合规细节。  

---

## 17. 附录

### 17.1 词汇表

| 术语 | 含义 |
|------|------|
| 职块 / Job Block | 本产品名称；亦指进入 shortlist 的高质量机会单元 |
| Shortlist | 过硬过滤且精排后默认展示的 Top 5–15 岗位 |
| Deal-breaker | 一票否决条件 |
| BYOK | Bring Your Own Key，用户自备 LLM API Key |
| Role family | BD / Community / Research / Security / Product / Engineering |
| Side event | 大会周边、非主会场的小型活动 |
| 粗筛 / 精排 | Embedding+规则召回 Top 50 / LLM 结构化打分 |

### 17.2 文档修订记录

| 版本 | 日期 | 变更 |
|------|------|------|
| v1.0 | 2026-07-26 | 首版：基于方案讨论；目标角色五类；形态 CLI+TG；纳入 Events networking |
| v1.1 | 2026-07-26 | 锁定：品牌「职块」；岗位源 A/B/C；活动源 Luma；Hybrid 匹配流水线 |

---

## 18. 审批

| 角色 | 姓名 | 意见 | 日期 |
|------|------|------|------|
| 产品负责人 | | 关键决策已确认 | 2026-07-26 |
| 实现负责人 | | | |

---

**下一步建议：** 输出技术设计（仓库目录、Profile/Job/Event schema 样例、三源 ingest POC 计划、Embedding+LLM 管道）→ 再开始编码。
