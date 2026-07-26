import fs from "node:fs";
import path from "node:path";
import type { Job, Profile } from "../types.js";
import { hasLlm } from "../config.js";
import { chatText } from "../llm/client.js";
import { truncate } from "../util/text.js";
import {
  appDir,
  loadApplications,
  saveApplication,
} from "../store/fs-store.js";

export async function tailorMaterials(
  profile: Profile,
  job: Job
): Promise<{ resumeMd: string; coverMd: string; dmMd: string; dir: string }> {
  let resumeMd: string;
  let coverMd: string;
  let dmMd: string;

  if (hasLlm()) {
    const bundle = await chatText([
      {
        role: "system",
        content: `你是职块求职文书助手。根据画像与 JD 生成三份中文草稿，用以下分隔符分开，禁止编造经历：

<<<RESUME>>>
（Markdown 简历要点，针对该岗重排）
<<<COVER>>>
（150–250 字 cover / 自荐）
<<<DM>>>
（≤300 字冷启动私信，适配 TG/LinkedIn）
<<<END>>>`,
      },
      {
        role: "user",
        content: `画像:\n${JSON.stringify(
          {
            name: profile.display_name,
            role: profile.primary_role,
            summary: profile.summary,
            highlights: profile.highlights,
            skills: profile.skills,
            years: profile.experience_years,
          },
          null,
          2
        )}\n\n岗位: ${job.title} @ ${job.company}\n${truncate(
          job.description_clean,
          3000
        )}`,
      },
    ]);
    resumeMd = slice(bundle, "RESUME", "COVER") || fallbackResume(profile, job);
    coverMd = slice(bundle, "COVER", "DM") || fallbackCover(profile, job);
    dmMd = slice(bundle, "DM", "END") || fallbackDm(profile, job);
  } else {
    resumeMd = fallbackResume(profile, job);
    coverMd = fallbackCover(profile, job);
    dmMd = fallbackDm(profile, job);
  }

  const appId = `${job.company}_${job.id}`.replace(/[^\w\u4e00-\u9fff-]+/g, "_").slice(0, 80);
  const dir = appDir(appId);
  const paths = {
    resume: path.join(dir, "resume.draft.md"),
    cover: path.join(dir, "cover.draft.md"),
    dm: path.join(dir, "dm.draft.md"),
  };
  fs.writeFileSync(paths.resume, resumeMd);
  fs.writeFileSync(paths.cover, coverMd);
  fs.writeFileSync(paths.dm, dmMd);

  const apps = loadApplications();
  let app = apps.find((a) => a.job_id === job.id);
  const now = new Date().toISOString();
  if (!app) {
    app = {
      id: appId,
      job_id: job.id,
      status: "prepared",
      created_at: now,
      updated_at: now,
      timeline: [{ at: now, status: "prepared" }],
      materials_paths: [paths.resume, paths.cover, paths.dm],
    };
  } else {
    app.status = "prepared";
    app.updated_at = now;
    app.timeline.push({ at: now, status: "prepared" });
    app.materials_paths = [
      ...new Set([...app.materials_paths, paths.resume, paths.cover, paths.dm]),
    ];
  }
  saveApplication(app);

  return { resumeMd, coverMd, dmMd, dir };
}

function slice(text: string, a: string, b: string): string {
  const re = new RegExp(`<<<${a}>>>\\s*([\\s\\S]*?)<<<${b}>>>`);
  const m = text.match(re);
  return m ? m[1].trim() : "";
}

function fallbackResume(profile: Profile, job: Job): string {
  return [
    `# ${profile.display_name || "Candidate"} — ${job.title}`,
    ``,
    `> 草稿 · 请人工核对，禁止含未核实经历`,
    ``,
    `## Summary`,
    profile.summary || "（请补充）",
    ``,
    `## Highlights`,
    ...profile.highlights.map((h) => `- ${h}`),
    ``,
    `## Skills`,
    profile.skills.join(" · "),
    ``,
    `## Target`,
    `${job.title} @ ${job.company}`,
  ].join("\n");
}

function fallbackCover(profile: Profile, job: Job): string {
  return `你好，我是 ${profile.display_name || "一位 Web3 求职者"}，主方向 ${profile.primary_role}。关注到 ${job.company} 的 ${job.title} 机会。${profile.summary} 代表性经历：${profile.highlights[0] || "（请补充）"}。希望有机会进一步交流。`;
}

function fallbackDm(profile: Profile, job: Job): string {
  return `Hi，我是 ${profile.display_name || "Web3 " + profile.primary_role}，看到 ${job.company} 在招 ${job.title}。我有 ${profile.experience_years || "N"} 年相关经验，擅长 ${profile.skills.slice(0, 3).join("/")}。方便聊聊这个角色吗？`;
}
