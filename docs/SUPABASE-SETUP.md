# 职块 × Supabase 建库指南

把「重启/Deploy 会丢」的用户数据放到 Supabase Postgres。  
**扫岗原始 HTML、向量缓存** 可仍放本机/临时目录；**开通、会话、画像、追踪、路径** 必须进库。

---

## 一、要持久化什么？

| 优先级 | 数据 | 现在文件 | Supabase 表 |
|--------|------|----------|-------------|
| P0 必须 | 用户开通 / 权益 | `entitlements.json` + `meta.json` | `jb_users` |
| P0 | 专属链接 slug | `portals.json` | `jb_portals` |
| P0 | 网页登录 session | `sessions/sessions.json` | `jb_sessions` |
| P0 | 画像 | `profile.yml` | `jb_profiles` |
| P0 | 申请追踪 | `applications/*/meta.json` | `jb_applications` |
| P1 | 本周任务 | `week-plan.json` | `jb_week_plans` |
| P1 | 触达 | `outreach.json` | `jb_outreach` |
| P1 | 求职路径 | `career-path.json` | `jb_career_paths` |
| P1 | shortlist | `jobs/shortlist.json` | `jb_shortlists` |
| P2 可后做 | 全量岗位库 | `jobs/index.json` | `jb_jobs_cache` |
| P2 | 流水线状态 | `pipeline-status.json` | `jb_pipeline_status` |

复杂结构（画像、路径、任务列表）用 **jsonb**，改字段不用频繁 migration。

---

## 二、创建 Supabase 项目（网页操作）

### 1. 注册 / 登录

1. 打开 [https://supabase.com](https://supabase.com)  
2. 用 GitHub / 邮箱登录  
3. **New project**

### 2. 填项目信息

| 项 | 建议 |
|----|------|
| **Name** | `job-block` 或 `qiu-zhi-agent` |
| **Database Password** | 生成强密码，**存到密码管理器**（以后连库要用） |
| **Region** | 选离你近的，例如 `Southeast Asia (Singapore)` 或 `Northeast Asia (Tokyo)` |
| **Pricing** | Free 即可起步 |

点 **Create new project**，等 1–2 分钟变绿。

### 3. 拿到连接密钥（后端用）

项目建好后：

1. 左下角 **Project Settings**（齿轮）  
2. **API**  
3. 记下：

| 名称 | 用途 |
|------|------|
| **Project URL** | 形如 `https://xxxxx.supabase.co` |
| **service_role` key**（secret） | **只放服务器**，能读写全库、绕过 RLS |
| `anon` `public` key | 浏览器用；**职块后端不要用 anon 当主密钥** |

> ⚠️ `service_role` 绝不能写进前端 / GitHub 公开仓库。只放 Render Environment / 本地 `.env`。

### 4. 执行建表 SQL

1. 左侧 **SQL Editor** → **New query**  
2. 打开仓库文件：  
   `supabase/schema.sql`  
3. **全选复制** → 粘贴到 SQL Editor  
4. 点 **Run**（或 Cmd/Ctrl + Enter）  
5. 下方应出现 success / notice：`Job Block schema ready…`

### 5. 确认表已创建

1. 左侧 **Table Editor**  
2. 应看到：

```
jb_users
jb_portals
jb_sessions
jb_profiles
jb_applications
jb_week_plans
jb_outreach
jb_career_paths
jb_shortlists
jb_jobs_cache
jb_pipeline_status
```

### 6. （可选）用 Table Editor 手插一条测试用户

**Table Editor → jb_users → Insert row：**

| 列 | 值示例 |
|----|--------|
| address | `0xe04d28b2707ca7d65a5ac7092af3b0190d8d0a33` |
| entitled | `true` |
| portal_slug | `jb-test-local` |

再在 **jb_portals** 插：

| slug | address |
|------|---------|
| `jb-test-local` | 同上 |

用于确认库连通；正式逻辑会由后端写入。

---

## 三、环境变量（本地 + Render）

在 `.env` 和 Render **Environment** 增加：

```bash
# Supabase
SUPABASE_URL=https://你的项目.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOi...   # service_role，保密

# 开关：1=读写走 Supabase；0/不设=仍用本地文件
JOB_BLOCK_USE_SUPABASE=1
```

本地 `.env` 已 gitignore，不要 commit key。  
Render：Dashboard → Environment → Add → Save → 等重启。

---

## 四、RLS 说明（你已在 SQL 里开了）

- 所有 `jb_*` 表 **启用了 RLS**  
- **没有** 给 `anon` 开 SELECT 策略  
- 后端用 **service_role** 连接 → 自动绕过 RLS，正常读写  
- 这样即使有人拿到 `anon` key，也扫不了你的用户表  

---

## 五、建库完成后：代码怎么接（下一阶段）

建库只是「房子盖好」。代码侧会做（可另开任务实现）：

1. 安装 `@supabase/supabase-js`  
2. `src/store/supabase.ts`：创建 client  
3. `wallet` / `applications` / `week-plan` / `profile` 读写改为：  
   - 若 `JOB_BLOCK_USE_SUPABASE=1` → Supabase  
   - 否则 → 旧文件（兼容本地开发）  
4. 部署后 **不再依赖 Render Disk**

表与代码字段映射见 `schema.sql` 注释。

---

## 六、常见问题

### Q：Free 额度够吗？

个人 / 竞赛 demo 一般够。注意：  
- 7 天无活动项目可能暂停（登录 Dashboard 唤醒）  
- 数据库约 500MB 级限制，岗位全量 JSON 很大时优先别塞 `jb_jobs_cache`，或定期清理  

### Q：还要不要 Render Disk？

接好 Supabase 后 **可以不要 Disk**。  
Disk 与 DB **二选一即可**；正式产品推荐 **只 DB**。

### Q：密码忘了？

Project Settings → Database → Reset database password。

### Q：SQL 跑到一半报错？

- 看是哪张表：多数可用 `create table if not exists` 重跑整份  
- 若 trigger 函数版本不对，删掉旧 trigger 再跑 `schema.sql`  

### Q：要不要用 Supabase Auth？

职块用 **自己的 portal session**（Agent 付费 → `/p/slug`），**不必**接 Supabase Auth。  
只用它的 **Postgres + API**。

---

## 七、你现在的检查清单

- [ ] 创建 Supabase 项目  
- [ ] 保存 Database Password + service_role key  
- [ ] SQL Editor 运行 `supabase/schema.sql`  
- [ ] Table Editor 能看到 11 张 `jb_*` 表  
- [ ] 本地 / Render 配好 `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY`  
- [ ] 回我「库建好了」，再写代码把读写迁过去  

---

## 八、表关系简图

```
jb_users (address)
   ├── jb_portals (slug)
   ├── jb_sessions (token)
   ├── jb_profiles (data jsonb)
   ├── jb_applications
   ├── jb_week_plans
   ├── jb_outreach
   ├── jb_career_paths
   ├── jb_shortlists
   ├── jb_jobs_cache
   └── jb_pipeline_status
```

全部以 **钱包 address（小写）** 为用户边界，和现在文件目录 `accounts/0x…/` 一致。
