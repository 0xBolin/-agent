/** 职块 Job Block — Profile · 路径 · 自动活动 */

const STEPS = [
  { n: "01", title: "目标岗位", desc: "Title 与角色线" },
  { n: "02", title: "简历", desc: "Agent 预填，可在此确认微调" },
  { n: "03", title: "地区", desc: "城市与工作方式" },
  { n: "04", title: "赛道", desc: "白名单 / 黑名单" },
  { n: "05", title: "补偿", desc: "薪资与 Token" },
  { n: "06", title: "否决", desc: "Deal-breakers" },
  { n: "07", title: "语言级别", desc: "语言 · 年限 · 级别" },
  { n: "08", title: "亮点", desc: "代表项目" },
  { n: "09", title: "公司类型", desc: "目标组织" },
  { n: "10", title: "时区保密", desc: "时区与观望" },
  { n: "11", title: "活动城市", desc: "自动联动线下路径" },
];

let meta = null;
let step = 0;
let pollTimer = null;
let cachedProfile = null;
const selected = {
  primary_role: "BD",
  secondary_roles: [],
  sectors_whitelist: [],
  company_types: [],
  level: "mid",
  alert_frequency: "weekly",
};

function token() {
  return localStorage.getItem("jb_token") || "";
}
function setToken(t) {
  if (t) localStorage.setItem("jb_token", t);
  else localStorage.removeItem("jb_token");
}

async function api(path, opts = {}) {
  const headers = {
    "Content-Type": "application/json",
    ...(opts.headers || {}),
  };
  if (token()) headers.Authorization = `Bearer ${token()}`;
  const res = await fetch(path, { ...opts, headers });
  const data = await res.json().catch(() => ({}));
  if (res.status === 401) {
    setToken("");
    showAuth(true);
    throw new Error(data.error || "请先登录");
  }
  if (!res.ok) throw new Error(data.error || res.statusText);
  return data;
}

function $(sel) {
  return document.querySelector(sel);
}
function splitList(s) {
  return String(s || "")
    .split(/[,，|]/)
    .map((x) => x.trim())
    .filter(Boolean);
}
function toast(msg, err = false) {
  const el = $("#toast");
  if (!el) return;
  el.hidden = false;
  el.textContent = msg;
  el.classList.toggle("err", err);
  setTimeout(() => {
    el.hidden = true;
  }, 4000);
}
function escapeHtml(s) {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
function escapeAttr(s) {
  return escapeHtml(s).replace(/'/g, "&#39;");
}

function showAuth(show) {
  $("#authGate").classList.toggle("hidden", !show);
  $("#appRoot").classList.toggle("hidden", show);
}

function showAuthError(msg) {
  const err = $("#authError");
  if (!err) return;
  err.hidden = !msg;
  err.textContent = msg || "";
}

/** 仅 /p/{slug} 默登；首页无自助注册/钱包登录 */
async function tryPortalAutoLogin() {
  const m = location.pathname.match(/^\/p\/([a-zA-Z0-9_-]+)/);
  if (!m) return false;
  const slug = m[1];
  try {
    const r = await fetch("/api/auth/portal/" + encodeURIComponent(slug)).then(
      (x) => x.json()
    );
    if (r.error) {
      showAuth(true);
      showAuthError(r.error);
      return true;
    }
    setToken(r.token);
    $("#userPill").textContent = r.user.short || r.user.address;
    showAuth(false);
    await bootApp();
    return true;
  } catch (e) {
    showAuth(true);
    showAuthError(e.message);
    return true;
  }
}

function bindAuth() {
  // 开发：只生成链接，不代登、不自动跳转
  const healthP = fetch("/api/health")
    .then((r) => r.json())
    .catch(() => ({}));
  healthP.then((h) => {
    if (h.dev_unlock && $("#devBox")) {
      $("#devBox").hidden = false;
    }
  });

  const btnDev = $("#btnDevUnlock");
  if (btnDev) {
    btnDev.onclick = async () => {
      showAuthError("");
      try {
        const addr =
          "0x" +
          Array.from(crypto.getRandomValues(new Uint8Array(20)))
            .map((b) => b.toString(16).padStart(2, "0"))
            .join("");
        const r = await fetch("/api/access/unlock", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ address: addr, dev: true }),
        }).then((x) => x.json());
        if (r.error) throw new Error(r.error);
        const wrap = $("#devLinkWrap");
        const link = $("#devLink");
        wrap.hidden = false;
        link.textContent = r.portalUrl;
        $("#authNote").textContent =
          "请自行复制并打开专属链接（默认登录）。不会自动跳转。";
      } catch (e) {
        showAuthError(e.message || String(e));
      }
    };
  }

  const btnCopy = $("#btnCopyLink");
  if (btnCopy) {
    btnCopy.onclick = async () => {
      const t = $("#devLink")?.textContent || "";
      if (!t) return;
      try {
        await navigator.clipboard.writeText(t);
        toast("已复制，请自行在新标签页打开");
      } catch {
        toast("请手动复制链接", true);
      }
    };
  }

  $("#btnLogout").onclick = async () => {
    try {
      await api("/api/auth/logout", { method: "POST", body: "{}" });
    } catch {
      /* */
    }
    setToken("");
    stopPoll();
    // 退出后回首页门禁，不停留在 /p/
    if (location.pathname.startsWith("/p/")) {
      location.href = "/";
      return;
    }
    showAuth(true);
  };
}

/* Setup */
function renderSteps() {
  const list = $("#stepList");
  list.innerHTML = STEPS.map(
    (s, i) => `
    <button type="button" class="step-item ${i === step ? "active" : ""} ${
      i < step ? "done" : ""
    } ${i === 10 ? "highlight" : ""}" data-i="${i}">
      <span class="step-num">${s.n}</span>
      <span class="label">${s.title}</span>
    </button>`
  ).join("");
  list.querySelectorAll(".step-item").forEach((btn) => {
    btn.addEventListener("click", () => goStep(Number(btn.dataset.i)));
  });
}

function renderChips(el, options, key, multi = true) {
  if (!el) return;
  el.innerHTML = options
    .map((opt) => {
      const on = multi ? selected[key].includes(opt) : selected[key] === opt;
      return `<button type="button" class="chip ${on ? "on" : ""}" data-v="${escapeAttr(
        opt
      )}">${escapeHtml(opt)}</button>`;
    })
    .join("");
  el.querySelectorAll(".chip").forEach((chip) => {
    chip.addEventListener("click", () => {
      const v = chip.dataset.v;
      if (multi) {
        const arr = selected[key];
        const i = arr.indexOf(v);
        if (i >= 0) arr.splice(i, 1);
        else arr.push(v);
      } else selected[key] = v;
      renderChips(el, options, key, multi);
      if (step === 10) updateReview();
    });
  });
}

function goStep(i) {
  step = Math.max(0, Math.min(STEPS.length - 1, i));
  document.querySelectorAll(".step-pane").forEach((p) => {
    p.classList.toggle("active", Number(p.dataset.step) === step);
  });
  const s = STEPS[step];
  $("#stepTag").textContent = `STEP ${s.n}`;
  $("#stepTitle").textContent = s.title;
  $("#stepDesc").textContent = s.desc;
  $("#progressText").textContent = `${step + 1} / ${STEPS.length}`;
  $("#btnPrev").disabled = step === 0;
  const last = step === STEPS.length - 1;
  $("#btnNext").classList.toggle("hidden", last);
  $("#btnSave").classList.toggle("hidden", !last);
  renderSteps();
  if (last) updateReview();
}

function formToProfile() {
  const f = $("#setupForm");
  const fd = new FormData(f);
  const g = (name) => String(fd.get(name) || "").trim();
  const whiteExtra = splitList(g("sectors_white_extra"));
  const sectors = [...new Set([...selected.sectors_whitelist, ...whiteExtra])];
  const highlights = g("highlights")
    .split(/\n|｜|\|/)
    .map((x) => x.trim())
    .filter(Boolean);

  return {
    display_name: g("display_name"),
    target_titles: splitList(g("target_titles")),
    primary_role: selected.primary_role,
    secondary_roles: selected.secondary_roles,
    resume_text: g("resume_text"),
    summary: g("summary"),
    skills: [
      ...new Set([
        ...splitList(g("skills")),
        ...splitList(g("keywords")),
      ]),
    ],
    location_pref: {
      cities: splitList(g("cities")),
      remote_ok: f.remote_ok.checked,
      hybrid_ok: f.hybrid_ok.checked,
      onsite_ok: f.onsite_ok.checked,
    },
    sectors_whitelist: sectors,
    sectors_blacklist: splitList(g("sectors_blacklist")),
    comp_pref: {
      min_base_fiat: g("min_base_fiat") ? Number(g("min_base_fiat")) : undefined,
      currency: g("currency") || "USD",
      token_ok: f.token_ok.checked,
      token_only_ok: f.token_only_ok.checked,
      equity_ok: f.equity_ok.checked,
    },
    deal_breakers: splitList(g("deal_breakers")),
    languages: splitList(g("languages")),
    experience_years: Number(g("experience_years") || 0),
    level: selected.level,
    highlights,
    company_types: selected.company_types,
    timezone: g("timezone") || "UTC+8",
    discrete_mode: f.discrete_mode.checked,
    alert_frequency: selected.alert_frequency,
    event_cities: splitList(g("event_cities")),
    role_extensions: {
      ...(cachedProfile?.role_extensions || {}),
      job_keywords: splitList(g("keywords")),
    },
    setup_completed: true,
  };
}

function profileToForm(p) {
  if (!p) return;
  cachedProfile = p;
  const f = $("#setupForm");
  f.display_name.value = p.display_name || "";
  f.target_titles.value = (p.target_titles || []).join(", ");
  f.resume_text.value = p.resume_text || "";
  f.summary.value = p.summary || "";
  f.skills.value = (p.skills || []).join(", ");
  if (f.keywords) {
    const kw = p.role_extensions?.job_keywords;
    f.keywords.value = Array.isArray(kw)
      ? kw.join(", ")
      : "";
  }
  f.cities.value = (p.location_pref?.cities || []).join(", ");
  f.remote_ok.checked = p.location_pref?.remote_ok !== false;
  f.hybrid_ok.checked = p.location_pref?.hybrid_ok !== false;
  f.onsite_ok.checked = !!p.location_pref?.onsite_ok;
  f.sectors_blacklist.value = (p.sectors_blacklist || []).join(", ");
  f.min_base_fiat.value = p.comp_pref?.min_base_fiat ?? "";
  f.currency.value = p.comp_pref?.currency || "USD";
  f.token_ok.checked = p.comp_pref?.token_ok !== false;
  f.token_only_ok.checked = !!p.comp_pref?.token_only_ok;
  f.equity_ok.checked = p.comp_pref?.equity_ok !== false;
  f.deal_breakers.value = (p.deal_breakers || []).join(", ");
  f.languages.value = (p.languages || []).join(", ");
  f.experience_years.value = p.experience_years ?? "";
  f.highlights.value = (p.highlights || []).join("\n");
  f.timezone.value = p.timezone || "UTC+8";
  f.discrete_mode.checked = !!p.discrete_mode;
  f.event_cities.value = (p.event_cities || []).join(", ");
  selected.primary_role = p.primary_role || "BD";
  selected.secondary_roles = [...(p.secondary_roles || [])];
  selected.sectors_whitelist = [...(p.sectors_whitelist || [])];
  selected.company_types = [...(p.company_types || [])];
  selected.level = p.level || "mid";
  selected.alert_frequency = p.alert_frequency || "weekly";
  renderAllChips();
  updateReview();
  renderProfileView(p);
}

function updateReview() {
  const p = formToProfile();
  $("#reviewBox").textContent = [
    `活动城市 → ${p.event_cities.join(", ") || "（未填，将用求职城市）"}`,
    `目标 → ${(p.target_titles || []).join(", ")}`,
    `角色 → ${p.primary_role}`,
  ].join("\n");
}

function renderAllChips() {
  if (!meta) return;
  renderChips($("#primaryRole"), meta.roles, "primary_role", false);
  renderChips($("#secondaryRoles"), meta.roles, "secondary_roles", true);
  renderChips($("#sectorsWhite"), meta.sectors, "sectors_whitelist", true);
  renderChips($("#companyTypes"), meta.companyTypes, "company_types", true);
  renderChips($("#levelChips"), meta.levels, "level", false);
  renderChips($("#alertFreq"), meta.alertFrequencies, "alert_frequency", false);
}

function switchView(name) {
  document.querySelectorAll(".view").forEach((v) => v.classList.add("hidden"));
  $(`#view-${name}`).classList.remove("hidden");
  document.querySelectorAll(".nav-btn").forEach((b) => {
    b.classList.toggle("active", b.dataset.view === name);
  });
  if (name === "report") refreshPipeline(true);
  if (name === "events") loadAutoEvents();
  if (name === "profile") {
    if (cachedProfile) renderProfileView(cachedProfile);
    else
      api("/api/profile")
        .then((r) => {
          cachedProfile = r.profile;
          renderProfileView(r.profile);
        })
        .catch(() => {});
  }
}

/* Profile view */
function renderProfileView(p) {
  if (!p) {
    $("#profileView").innerHTML =
      '<div class="card"><div class="body">暂无画像，请先 Setup。</div></div>';
    return;
  }
  const rows = [
    ["称呼", p.display_name],
    ["目标岗位", (p.target_titles || []).join(" · ")],
    ["角色", [p.primary_role, ...(p.secondary_roles || [])].join(" / ")],
    ["级别", `${p.experience_years || 0} 年 · ${p.level || "—"}`],
    ["语言", (p.languages || []).join(", ")],
    ["简介", p.summary],
    ["技能", (p.skills || []).join(", ")],
    ["亮点", (p.highlights || []).join(" · ")],
    [
      "求职城市",
      (p.location_pref?.cities || []).join(", ") +
        ` · R${p.location_pref?.remote_ok ? "✓" : "×"} H${
          p.location_pref?.hybrid_ok ? "✓" : "×"
        } O${p.location_pref?.onsite_ok ? "✓" : "×"}`,
    ],
    ["活动城市", (p.event_cities || []).join(", ") || "—"],
    ["赛道", (p.sectors_whitelist || []).join(", ")],
    ["黑名单", (p.sectors_blacklist || []).join(", ") || "—"],
    [
      "补偿",
      `≥${p.comp_pref?.min_base_fiat || "—"} ${p.comp_pref?.currency || ""} · token ${
        p.comp_pref?.token_ok ? "ok" : "no"
      } · only ${p.comp_pref?.token_only_ok ? "ok" : "no"}`,
    ],
    ["否决", (p.deal_breakers || []).join(", ") || "—"],
    ["公司类型", (p.company_types || []).join(", ")],
    ["时区", p.timezone],
    ["保密", p.discrete_mode ? "是" : "否"],
    ["提醒", p.alert_frequency],
    ["简历字数", String((p.resume_text || "").length)],
    ["更新", p.updated_at || "—"],
  ];
  $("#profileView").innerHTML = rows
    .map(
      ([k, v]) => `
    <div class="profile-card">
      <div class="profile-k">${escapeHtml(k)}</div>
      <div class="profile-v">${escapeHtml(v || "—")}</div>
    </div>`
    )
    .join("");
}

/* Path report */
function setPipelineUI(st) {
  const running = st.status === "running";
  $("#pipelineBanner").classList.toggle("running", running);
  $("#pipelineBanner").classList.toggle("done", st.status === "done");
  $("#pipelineBanner").classList.toggle("error", st.status === "error");
  $("#pipelineSpinner").classList.toggle("hidden", !running);
  $("#pipelineTitle").textContent =
    st.status === "running"
      ? "正在生成路径"
      : st.status === "done"
        ? "路径已就绪"
        : st.status === "error"
          ? "生成失败"
          : "等待";
  $("#pipelineMsg").textContent = st.message || "—";
  $("#pipelinePct").textContent = `${st.progress || 0}%`;
  $("#progressFill").style.width = `${st.progress || 0}%`;
  if (st.path) renderPath(st.path);
  else if (st.shortlist?.length) renderShortlist(st.shortlist);
}

function renderPath(path) {
  if (!path) return;
  $("#pathHeadline").textContent = path.headline || "完整求职路径";
  $("#pathSummary").textContent = path.summary || "";

  $("#pathActions").innerHTML = (path.actions || [])
    .map(
      (a) => `
    <div class="path-step-card">
      <div class="path-step-num">${a.order}</div>
      <div>
        <div class="path-step-title">${escapeHtml(a.title)}</div>
        <div class="path-step-detail">${escapeHtml(a.detail)}</div>
      </div>
    </div>`
    )
    .join("");

  renderShortlist(path.shortlist || []);

  $("#pathImprove").innerHTML = (path.improve || [])
    .map((g) => `<span class="tag">${escapeHtml(g)}</span>`)
    .join("") || '<span class="muted">—</span>';

  renderEventCards($("#pathEvents"), path.events || [], true);
  renderEventCards($("#eventList"), path.events || [], true);

  $("#pathContacts").innerHTML = (path.contacts || [])
    .map(
      (c) => `
    <article class="card">
      <div class="card-top">
        <div>
          <h3>${escapeHtml(c.company)} · ${escapeHtml(c.job_title)}</h3>
          <div class="meta">找：${escapeHtml(c.who)}</div>
        </div>
      </div>
      <div class="body">
        ${escapeHtml(c.why)}<br/>
        <div class="link-row">
          <a class="btn-link" href="${escapeAttr(
            c.linkedin_url || "#"
          )}" target="_blank" rel="noopener">LinkedIn 搜人</a>
          <a class="btn-link" href="${escapeAttr(
            c.linkedin_company_url || "#"
          )}" target="_blank" rel="noopener">LinkedIn 公司</a>
          <a class="btn-link" href="${escapeAttr(
            c.x_url || "#"
          )}" target="_blank" rel="noopener">X 搜人</a>
          ${
            c.x_company_url
              ? `<a class="btn-link" href="${escapeAttr(
                  c.x_company_url
                )}" target="_blank" rel="noopener">X 公司/账号</a>`
              : ""
          }
          ${
            c.job_url
              ? `<a class="btn-link" href="${escapeAttr(
                  c.job_url
                )}" target="_blank" rel="noopener">岗位</a>`
              : ""
          }
        </div>
        <br/><strong>私信草稿</strong><br/>
        <span class="mono-inline">${escapeHtml(c.dm_draft)}</span>
      </div>
    </article>`
    )
    .join("") || emptyCard("暂无联系建议");

  $("#pathApply").innerHTML = (path.apply_targets || [])
    .map(
      (t) => `
    <article class="card">
      <div class="card-top">
        <div>
          <h3>${escapeHtml(t.label)}</h3>
          <div class="meta">${escapeHtml(t.note)}</div>
        </div>
        <div class="score ${Number(t.score) >= 70 ? "high" : ""}">${
          t.score ?? "—"
        }</div>
      </div>
      <div class="body">
        <a href="${escapeAttr(t.url)}" target="_blank" rel="noopener">去投递 / 打开</a>
      </div>
    </article>`
    )
    .join("") || emptyCard("暂无投递入口");
}

function emptyCard(t) {
  return `<div class="card"><div class="body">${escapeHtml(t)}</div></div>`;
}

function renderShortlist(jobs) {
  const el = $("#shortlist");
  if (!jobs?.length) {
    el.innerHTML = emptyCard("暂无岗位。完成 Setup 后自动生成。");
    return;
  }
  el.innerHTML = jobs
    .map((j) => {
      const score = j.match?.score ?? "—";
      const high = Number(score) >= 70;
      const src =
        j.source === "x"
          ? "X"
          : j.source === "dejob.ai"
            ? "DeJob"
            : j.source;
      return `
      <article class="card">
        <div class="card-top">
          <div>
            <h3>${escapeHtml(j.title)} <span class="muted">@ ${escapeHtml(
        j.company
      )}</span></h3>
            <div class="meta">${escapeHtml(j.role_family)} · ${escapeHtml(
        j.remote_type
      )} · ${escapeHtml(src)}</div>
          </div>
          <div class="score ${high ? "high" : ""}">${score} · ${escapeHtml(
        j.match?.action || ""
      )}</div>
        </div>
        <div class="body">
          ${escapeHtml(j.match?.summary || "")}<br/>
          ${
            j.match?.strengths?.length
              ? "优势: " + escapeHtml(j.match.strengths.join("；")) + "<br/>"
              : ""
          }
          ${
            j.match?.gaps?.length
              ? "缺口: " + escapeHtml(j.match.gaps.join("；")) + "<br/>"
              : ""
          }
          <a href="${escapeAttr(
            j.source_url
          )}" target="_blank" rel="noopener">打开</a>
        </div>
      </article>`;
    })
    .join("");
}

function renderEventCards(el, events, recommended) {
  if (!el) return;
  if (!events?.length) {
    el.innerHTML = emptyCard(
      recommended
        ? "暂无足够相关活动。填写活动城市并重新生成路径。"
        : "暂无活动"
    );
    return;
  }
  el.innerHTML = events
    .map((e) => {
      const when = e.start_at
        ? new Date(e.start_at).toLocaleString()
        : "时间待定";
      const high = (e.relevance_score || 0) >= 55;
      return `
    <article class="card">
      <div class="card-top">
        <div>
          <h3>${escapeHtml(e.title)}</h3>
          <div class="meta">${escapeHtml(e.city || "?")} · ${escapeHtml(
        e.event_type
      )} · ${escapeHtml(when)}</div>
        </div>
        <div class="score ${high ? "high" : ""}">适合你 ${
          e.relevance_score ?? "—"
        }</div>
      </div>
      <div class="body">
        <strong>为什么建议你去：</strong>${escapeHtml(
          e.why_attend || "与你的画像匹配"
        )}<br/>
        ${escapeHtml((e.description || "").slice(0, 160))}<br/>
        <a href="${escapeAttr(
          e.url
        )}" target="_blank" rel="noopener">打开活动页</a>
      </div>
    </article>`;
    })
    .join("");
}

async function loadAutoEvents() {
  $("#eventList").innerHTML = emptyCard("加载推荐活动…");
  try {
    const r = await api("/api/path");
    if (r.path?.events?.length) {
      renderEventCards($("#eventList"), r.path.events, true);
      return;
    }
    // fallback status
    const st = await api("/api/pipeline/status");
    if (st.path?.events) renderEventCards($("#eventList"), st.path.events, true);
    else if (st.events) renderEventCards($("#eventList"), st.events, true);
    else
      $("#eventList").innerHTML = emptyCard(
        "尚未生成推荐。请在 Setup 填写活动城市并生成路径。"
      );
  } catch (e) {
    toast(e.message, true);
  }
}

async function refreshPipeline(poll = false) {
  try {
    const st = await api("/api/pipeline/status");
    setPipelineUI(st);
    $("#topMeta").textContent = st.shortlist_count
      ? `path · ${st.shortlist_count} 岗`
      : "—";
    if (st.status === "running" && poll) startPoll();
    if (st.status === "done" || st.status === "error") stopPoll();
  } catch {
    /* */
  }
}

function startPoll() {
  stopPoll();
  pollTimer = setInterval(() => refreshPipeline(false), 2000);
}
function stopPoll() {
  if (pollTimer) clearInterval(pollTimer);
  pollTimer = null;
}

async function bootApp() {
  meta = await api("/api/meta");
  const tz = $("#timezoneSelect");
  tz.innerHTML = meta.timezones
    .map((t) => `<option value="${t}">${t}</option>`)
    .join("");
  renderAllChips();
  renderSteps();
  goStep(0);

  try {
    const me = await api("/api/auth/me");
    if (me.user) {
      $("#userPill").textContent = me.user.short || me.user.address || "";
      if (me.user.portalUrl) {
        const note = document.getElementById("topMeta");
        if (note && !note.dataset.portal) {
          note.dataset.portal = "1";
          note.title = me.user.portalUrl;
        }
      }
    }
  } catch {
    /* */
  }

  try {
    const { profile } = await api("/api/profile");
    if (profile?.setup_completed || profile?.display_name) {
      profileToForm(profile);
    }
  } catch {
    /* */
  }

  await refreshPipeline(true);
  const st = await api("/api/pipeline/status").catch(() => ({}));
  if (st.pipeline?.status === "running" || st.status === "running") {
    switchView("report");
    startPoll();
  } else if (st.path) {
    renderPath(st.path);
  }
}

async function init() {
  bindAuth();

  // 1) 专属门户优先自动登录
  if (await tryPortalAutoLogin()) {
    // 已处理
  } else if (!token()) {
    showAuth(true);
  } else {
    try {
      const me = await api("/api/auth/me");
      if (!me.user) {
        setToken("");
        showAuth(true);
      } else {
        $("#userPill").textContent = me.user.short || me.user.address || "";
        showAuth(false);
        await bootApp();
      }
    } catch {
      setToken("");
      showAuth(true);
    }
  }

  $("#btnPrev").onclick = () => goStep(step - 1);
  $("#btnNext").onclick = () => goStep(step + 1);

  $("#btnSave").onclick = async () => {
    try {
      const profile = formToProfile();
      if (!profile.target_titles.length && !profile.primary_role) {
        toast("请填写目标岗位", true);
        return;
      }
      if (!profile.resume_text && !profile.summary && !profile.skills.length) {
        toast("简历尚未预填。请通过 Agent 提交 PDF 后再打开专属链接。", true);
        return;
      }
      // 活动城市未填则用求职城市
      if (!profile.event_cities.length && profile.location_pref.cities.length) {
        profile.event_cities = [...profile.location_pref.cities];
      }

      switchView("report");
      setPipelineUI({
        status: "running",
        message: "正在为你生成完整求职路径…",
        progress: 8,
      });
      startPoll();

      await api("/api/profile", {
        method: "POST",
        body: JSON.stringify({ profile, auto_search: true }),
      });
      cachedProfile = profile;
      toast("已开始生成路径");
      setTimeout(() => refreshPipeline(true), 600);
    } catch (e) {
      toast(e.message, true);
      stopPoll();
    }
  };

  $("#btnExample").onclick = async () => {
    const r = await api("/api/profile/example", {
      method: "POST",
      body: "{}",
    });
    profileToForm(r.profile);
    toast("已填入示例");
  };

  $("#btnLoad").onclick = async () => {
    const r = await api("/api/profile");
    profileToForm(r.profile);
    toast("已读取");
  };

  document.querySelectorAll(".nav-btn").forEach((b) => {
    b.addEventListener("click", () => switchView(b.dataset.view));
  });

  $("#btnEditSetup").onclick = () => switchView("setup");

  $("#btnRerun").onclick = async () => {
    setPipelineUI({
      status: "running",
      message: "正在为你生成完整求职路径…",
      progress: 5,
    });
    startPoll();
    try {
      const r = await api("/api/pipeline/run", {
        method: "POST",
        body: "{}",
      });
      setPipelineUI({ ...r.status, path: r.path, shortlist: r.shortlist });
      if (r.path) renderPath(r.path);
      stopPoll();
    } catch (e) {
      toast(e.message, true);
      stopPoll();
    }
  };
}

init().catch(console.error);
