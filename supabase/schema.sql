-- ═══════════════════════════════════════════════════════════
-- 职块 Job Block · Supabase / Postgres 建库脚本
-- 在 Supabase Dashboard → SQL Editor → New query → 整段运行
-- ═══════════════════════════════════════════════════════════

-- 扩展（一般已有）
create extension if not exists "pgcrypto";

-- ───────────────────────────────────────────────────────────
-- 1. 用户（钱包地址 = 主键）
--    对应：accounts/*/meta.json + entitlements.json
-- ───────────────────────────────────────────────────────────
create table if not exists public.jb_users (
  address         text primary key,                    -- 小写 0x…
  entitled        boolean not null default false,
  portal_slug     text unique,
  paid_at         timestamptz,
  payment_id      text,
  entitlement_reason text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists jb_users_portal_slug_idx
  on public.jb_users (portal_slug);

-- ───────────────────────────────────────────────────────────
-- 2. 专属门户 slug → 地址
--    对应：accounts/portals.json
-- ───────────────────────────────────────────────────────────
create table if not exists public.jb_portals (
  slug            text primary key,
  address         text not null references public.jb_users(address) on delete cascade,
  paid_at         timestamptz,
  created_at      timestamptz not null default now()
);

create index if not exists jb_portals_address_idx
  on public.jb_portals (address);

-- ───────────────────────────────────────────────────────────
-- 3. 网页会话（专属链接打开后的 Bearer token）
--    对应：sessions/sessions.json
-- ───────────────────────────────────────────────────────────
create table if not exists public.jb_sessions (
  token           text primary key,
  address         text not null references public.jb_users(address) on delete cascade,
  via             text not null default 'portal',
  created_at      timestamptz not null default now(),
  expires_at      timestamptz not null
);

create index if not exists jb_sessions_address_idx
  on public.jb_sessions (address);
create index if not exists jb_sessions_expires_idx
  on public.jb_sessions (expires_at);

-- ───────────────────────────────────────────────────────────
-- 4. 用户画像 Profile（整份 JSON，结构与 Profile 类型一致）
--    对应：accounts/*/profile.yml
-- ───────────────────────────────────────────────────────────
create table if not exists public.jb_profiles (
  address         text primary key references public.jb_users(address) on delete cascade,
  data            jsonb not null default '{}'::jsonb,
  setup_completed boolean not null default false,
  updated_at      timestamptz not null default now()
);

-- ───────────────────────────────────────────────────────────
-- 5. 申请追踪
--    对应：accounts/*/applications/*/meta.json
-- ───────────────────────────────────────────────────────────
create table if not exists public.jb_applications (
  id                text primary key,
  address           text not null references public.jb_users(address) on delete cascade,
  job_id            text not null,
  status            text not null default 'interested',
  company           text,
  title             text,
  source_url        text,
  source            text,
  score             numeric,
  notes             text,
  next_follow_up_at date,
  timeline          jsonb not null default '[]'::jsonb,
  materials_paths   jsonb not null default '[]'::jsonb,
  outcome           text,
  outcome_notes     text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index if not exists jb_applications_address_idx
  on public.jb_applications (address);
create index if not exists jb_applications_status_idx
  on public.jb_applications (address, status);
create unique index if not exists jb_applications_address_job_uidx
  on public.jb_applications (address, job_id);

-- ───────────────────────────────────────────────────────────
-- 6. 本周任务
--    对应：accounts/*/week-plan.json
-- ───────────────────────────────────────────────────────────
create table if not exists public.jb_week_plans (
  address         text not null references public.jb_users(address) on delete cascade,
  week_id         text not null,
  week_start      date not null,
  generated_at    timestamptz not null default now(),
  note            text,
  tasks           jsonb not null default '[]'::jsonb,
  primary key (address, week_id)
);

-- ───────────────────────────────────────────────────────────
-- 7. 触达 outreach
--    对应：accounts/*/outreach.json
-- ───────────────────────────────────────────────────────────
create table if not exists public.jb_outreach (
  id                text primary key,
  address           text not null references public.jb_users(address) on delete cascade,
  company           text not null,
  who               text not null,
  job_title         text,
  status            text not null default 'todo',
  next_follow_up_at date,
  linkedin_url      text,
  x_url             text,
  dm_draft          text,
  notes             text,
  timeline          jsonb not null default '[]'::jsonb,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index if not exists jb_outreach_address_idx
  on public.jb_outreach (address);

-- ───────────────────────────────────────────────────────────
-- 8. 求职路径 + shortlist（大体量 JSON，先 jsonb 存）
--    对应：career-path.json / jobs/shortlist.json
-- ───────────────────────────────────────────────────────────
create table if not exists public.jb_career_paths (
  address         text primary key references public.jb_users(address) on delete cascade,
  lang            text not null default 'zh',
  data            jsonb not null default '{}'::jsonb,
  updated_at      timestamptz not null default now()
);

create table if not exists public.jb_shortlists (
  address         text primary key references public.jb_users(address) on delete cascade,
  jobs            jsonb not null default '[]'::jsonb,
  updated_at      timestamptz not null default now()
);

-- ───────────────────────────────────────────────────────────
-- 9. 岗位库缓存（可选，体积大；可后迁）
--    对应：jobs/index.json
-- ───────────────────────────────────────────────────────────
create table if not exists public.jb_jobs_cache (
  address         text primary key references public.jb_users(address) on delete cascade,
  jobs            jsonb not null default '[]'::jsonb,
  updated_at      timestamptz not null default now()
);

-- ───────────────────────────────────────────────────────────
-- 10. 流水线状态
--     对应：pipeline-status.json
-- ───────────────────────────────────────────────────────────
create table if not exists public.jb_pipeline_status (
  address         text primary key references public.jb_users(address) on delete cascade,
  data            jsonb not null default '{}'::jsonb,
  updated_at      timestamptz not null default now()
);

-- ───────────────────────────────────────────────────────────
-- 11. updated_at 自动刷新
-- ───────────────────────────────────────────────────────────
create or replace function public.jb_set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_jb_users_updated on public.jb_users;
create trigger trg_jb_users_updated
  before update on public.jb_users
  for each row execute function public.jb_set_updated_at();

drop trigger if exists trg_jb_profiles_updated on public.jb_profiles;
create trigger trg_jb_profiles_updated
  before update on public.jb_profiles
  for each row execute function public.jb_set_updated_at();

drop trigger if exists trg_jb_applications_updated on public.jb_applications;
create trigger trg_jb_applications_updated
  before update on public.jb_applications
  for each row execute function public.jb_set_updated_at();

drop trigger if exists trg_jb_outreach_updated on public.jb_outreach;
create trigger trg_jb_outreach_updated
  before update on public.jb_outreach
  for each row execute function public.jb_set_updated_at();

-- ───────────────────────────────────────────────────────────
-- 12. RLS（服务端用 service_role key 时会绕过 RLS）
--     仍建议开启，防止 anon key 被误用扫全表
-- ───────────────────────────────────────────────────────────
alter table public.jb_users enable row level security;
alter table public.jb_portals enable row level security;
alter table public.jb_sessions enable row level security;
alter table public.jb_profiles enable row level security;
alter table public.jb_applications enable row level security;
alter table public.jb_week_plans enable row level security;
alter table public.jb_outreach enable row level security;
alter table public.jb_career_paths enable row level security;
alter table public.jb_shortlists enable row level security;
alter table public.jb_jobs_cache enable row level security;
alter table public.jb_pipeline_status enable row level security;

-- 不给 anon/authenticated 默认策略 → 只能用 service_role 访问
-- （职块后端自己管 session，不用 Supabase Auth 登录）

-- 完成提示
do $$
begin
  raise notice 'Job Block schema ready. Tables: jb_users, jb_portals, jb_sessions, jb_profiles, jb_applications, jb_week_plans, jb_outreach, jb_career_paths, jb_shortlists, jb_jobs_cache, jb_pipeline_status';
end $$;
