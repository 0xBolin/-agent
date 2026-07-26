#!/usr/bin/env node
import { Command } from "commander";
import fs from "node:fs";
import { config, hasLlm, hasRemoteEmbedding } from "./config.js";
import { ensureDataDirs, files, dataDir } from "./paths.js";
import { loadJobs, loadShortlist } from "./store/fs-store.js";
import {
  interactiveSetup,
  bootstrapProfile,
  ensureExample,
  getProfile,
  normalizeProfile,
} from "./profile/setup.js";
import { scanAll, ingestPaste, ingestTelegramText } from "./ingest/index.js";
import { rankJobs, formatShortlist } from "./match/rank.js";
import { evaluateJob, findJob } from "./eval/evaluate.js";
import { tailorMaterials } from "./tailor/draft.js";
import {
  formatTracker,
  updateStatus,
  recordOutcome,
  calibrationHints,
} from "./track/tracker.js";
import { listEvents, briefEvent, fetchLumaEvent } from "./events/luma.js";
import { sendTelegram, formatAlert } from "./alert/telegram.js";
import { saveEvents } from "./store/fs-store.js";
import { loadEvents } from "./store/fs-store.js";
import type { ApplicationStatus } from "./types.js";

const program = new Command();

program
  .name("job-block")
  .description(`${config.brand.nameZh}（${config.brand.nameEn}）— Web3 求职 Agent`)
  .version("0.1.0");

program
  .command("doctor")
  .description("检查环境与配置")
  .action(async () => {
    ensureDataDirs();
    await ensureExample();
    console.log(`🧱 ${config.brand.nameZh} / ${config.brand.nameEn}`);
    console.log(`  data:     ${dataDir()}`);
    console.log(
      `  profile:  ${fs.existsSync(files.profile()) ? "✓" : "✗ 请运行 setup 或 npm run web"}`
    );
    console.log(`  web UI:   npm run web  →  http://127.0.0.1:8787`);
    console.log(`  LLM:      ${hasLlm() ? "✓ " + config.llm.model : "✗ 无 Key（将用规则打分）"}`);
    console.log(
      `  Embed:    ${hasRemoteEmbedding() ? "✓ remote" : "○ 本地 TF 向量"}`
    );
    console.log(
      `  Telegram: ${config.telegram.botToken && config.telegram.chatId ? "✓" : "○ 未配置"}`
    );
    console.log(`  jobs:     ${loadJobs().length} 条`);
    console.log(`  shortlist:${loadShortlist().length} 条`);
  });

program
  .command("setup")
  .description("建立 / 更新求职画像")
  .option("--example", "从示例画像复制（非交互）")
  .option("--force", "覆盖已有画像")
  .action(async (opts) => {
    ensureDataDirs();
    if (opts.example) {
      const p = await bootstrapProfile(Boolean(opts.force));
      console.log("✓ 已写入示例画像:", p.display_name, p.primary_role);
      console.log("  路径:", files.profile());
      console.log("  请编辑 data/profile.yml 或再跑 interactive setup");
      return;
    }
    if (!process.stdin.isTTY) {
      console.log("非 TTY，改用 --example");
      await bootstrapProfile(Boolean(opts.force));
      return;
    }
    await interactiveSetup();
  });

program
  .command("scan")
  .description("扫描岗位源（web3.career + dejob.ai）")
  .option("-n, --limit <n>", "每源条数", "30")
  .option("--only <source>", "仅 web3.career 或 dejob.ai")
  .action(async (opts) => {
    ensureDataDirs();
    console.log("📡 扫描中…");
    const sources =
      opts.only === "web3.career"
        ? (["web3.career"] as const)
        : opts.only === "dejob.ai"
          ? (["dejob.ai"] as const)
          : undefined;
    const r = await scanAll({
      limitPerSource: Number(opts.limit) || 30,
      sources: sources as ("web3.career" | "dejob.ai")[] | undefined,
    });
    console.log(
      `\n✓ 新增 ${r.added} · 库内总计 ${r.total}`,
      r.errors.length ? `\n警告: ${r.errors.join("; ")}` : ""
    );
    console.log("提示: 源 C（TG）请用: job-block ingest-tg --text \"...\" 或 --file msg.txt");
  });

program
  .command("ingest-tg")
  .description("从 DeJob TG / 任意招聘帖文本入库（源 C）")
  .option("--text <text>", "帖子全文")
  .option("--file <path>", "从文件读")
  .action(async (opts) => {
    let text = opts.text as string | undefined;
    if (opts.file) text = fs.readFileSync(opts.file, "utf8");
    if (!text) {
      console.error("请提供 --text 或 --file");
      process.exit(1);
    }
    const job = ingestTelegramText(text);
    console.log(`✓ TG 岗位入库: ${job.title} @ ${job.company}`);
    console.log(`  id: ${job.id}`);
    if (job.legitimacy_flags.length)
      console.log(`  ⚠ flags: ${job.legitimacy_flags.join(", ")}`);
  });

program
  .command("paste")
  .description("粘贴任意 JD 入库")
  .option("--text <text>", "JD 文本")
  .option("--file <path>", "文件路径")
  .action(async (opts) => {
    let text = opts.text as string | undefined;
    if (opts.file) text = fs.readFileSync(opts.file, "utf8");
    if (!text) {
      console.error("请提供 --text 或 --file");
      process.exit(1);
    }
    const job = ingestPaste(text);
    console.log(`✓ 已入库: ${job.title} @ ${job.company} (${job.id})`);
  });

program
  .command("rank")
  .description("Hybrid 匹配：Embedding 召回 Top50 → 精排 → shortlist")
  .option("--show <n>", "展示条数", "15")
  .option("--recall <n>", "召回条数", "50")
  .option("--alert", "推送到 Telegram")
  .action(async (opts) => {
    const profile = getProfile();
    if (!profile) {
      console.error("请先 job-block setup 或打开 npm run web 完成 Setup");
      process.exit(1);
    }
    const jobs = loadJobs();
    if (!jobs.length) {
      console.error("岗位库为空，请先 job-block scan");
      process.exit(1);
    }
    console.log(
      `🎯 匹配中（${profile.target_titles?.slice(0, 2).join("/") || profile.primary_role}，${jobs.length} 岗）…`
    );
    const report = await rankJobs(normalizeProfile(profile), jobs, {
      topShow: Number(opts.show) || 15,
      topRecall: Number(opts.recall) || 50,
    });
    console.log(
      `\nShortlist ${report.shortlist.length}（method≈${report.method}）\n`
    );
    console.log(formatShortlist(report.shortlist));
    if (opts.alert) {
      await sendTelegram(formatAlert(report.shortlist));
    }
  });

program
  .command("eval")
  .description("单岗深度评估")
  .argument("<idOrUrlOrTitle>", "job id / url / 标题关键词")
  .action(async (q: string) => {
    const profile = getProfile();
    if (!profile) {
      console.error("请先 setup");
      process.exit(1);
    }
    const job = findJob(q);
    if (!job) {
      console.error("未找到岗位:", q);
      process.exit(1);
    }
    console.log(`📝 评估: ${job.title} @ ${job.company}`);
    const { report, app } = await evaluateJob(normalizeProfile(profile), job);
    console.log("\n" + report);
    console.log(`\n✓ 已归档 application: ${app.id}`);
  });

program
  .command("tailor")
  .description("生成简历/cover/冷信草稿（不发送）")
  .argument("<idOrUrlOrTitle>", "job id / url / 标题关键词")
  .action(async (q: string) => {
    const profile = getProfile();
    if (!profile) {
      console.error("请先 setup");
      process.exit(1);
    }
    const job = findJob(q);
    if (!job) {
      console.error("未找到岗位:", q);
      process.exit(1);
    }
    console.log(`✍️  生成材料草稿: ${job.title}`);
    const r = await tailorMaterials(normalizeProfile(profile), job);
    console.log("\n--- DM ---\n" + r.dmMd);
    console.log("\n✓ 文件目录:", r.dir);
  });

program
  .command("track")
  .description("查看申请管道")
  .option("--status <status>", "更新状态 applied|interviewing|…")
  .option("--id <id>", "application id")
  .action((opts) => {
    if (opts.status && opts.id) {
      const app = updateStatus(opts.id, opts.status as ApplicationStatus);
      if (!app) {
        console.error("未找到 application");
        process.exit(1);
      }
      console.log(`✓ ${app.id} → ${app.status}`);
      return;
    }
    console.log(formatTracker());
  });

program
  .command("outcome")
  .description("记录结果并给出校准提示")
  .argument("<appId>", "application id 片段")
  .argument("<outcome>", "interview|offer|rejected|ghosted|…")
  .option("--notes <n>", "备注")
  .action((appId: string, outcome: string, opts) => {
    const app = recordOutcome(appId, outcome, opts.notes);
    if (!app) {
      console.error("未找到 application");
      process.exit(1);
    }
    console.log(`✓ outcome 已记: ${app.id} → ${outcome}`);
    console.log("\n校准建议:");
    for (const h of calibrationHints()) console.log(" -", h);
  });

program
  .command("events")
  .description("按城市发现 Web3 线下活动（Luma）")
  .option("--city <city>", "城市", "")
  .option("--type <type>", "meetup|conference|side_event|…")
  .option("--url <lumaUrl>", "解析单个 Luma 活动链接")
  .option("--brief <id>", "活动 briefing")
  .action(async (opts) => {
    const profile = getProfile();
    if (opts.brief) {
      const all = loadEvents();
      const ev =
        all.find((e) => e.id === opts.brief || e.id.startsWith(opts.brief)) ||
        (opts.url ? await fetchLumaEvent(opts.url) : null);
      if (!ev) {
        console.error("未找到活动，先 events --city … 或 --url");
        process.exit(1);
      }
      console.log(await briefEvent(ev, profile));
      return;
    }
    if (opts.url && !opts.city) {
      const one = await fetchLumaEvent(opts.url);
      if (!one) {
        console.error("解析失败");
        process.exit(1);
      }
      const prev = loadEvents();
      saveEvents([...prev.filter((e) => e.id !== one.id), one]);
      console.log(JSON.stringify(one, null, 2));
      console.log("\n" + (await briefEvent(one, profile)));
      return;
    }
    const city = opts.city || profile?.location_pref.cities[0] || "Singapore";
    console.log(`📍 活动 · ${city}`);
    const list = await listEvents({
      city,
      type: opts.type,
      profile,
      lumaUrl: opts.url,
    });
    if (!list.length) {
      console.log("无结果。可换城市，或 --url 粘贴 Luma 链接。");
      return;
    }
    for (const [i, e] of list.slice(0, 15).entries()) {
      console.log(
        `${i + 1}. [${e.relevance_score ?? "-"}] ${e.title}`,
        `\n   ${e.city || "?"} · ${e.event_type}${e.invite_only ? " · invite-only" : ""}`,
        `\n   ${e.url}`,
        e.why_attend ? `\n   ${e.why_attend}` : "",
        `\n   id: ${e.id}\n`
      );
    }
  });

program
  .command("alert")
  .description("把当前 shortlist 推到 Telegram")
  .action(async () => {
    const list = loadShortlist();
    if (!list.length) {
      console.error("shortlist 空，先 rank");
      process.exit(1);
    }
    const ok = await sendTelegram(formatAlert(list));
    console.log(ok ? "✓ 已推送" : "○ 未推送（已打印预览）");
  });

program.parseAsync(process.argv).catch((e) => {
  console.error(e);
  process.exit(1);
});
