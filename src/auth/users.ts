import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { baseDataDir, ensureDataDirs, files, userDataDir } from "../paths.js";

export interface UserRecord {
  id: string;
  email: string;
  passwordHash: string;
  salt: string;
  created_at: string;
}

export interface SessionRecord {
  token: string;
  userId: string;
  email: string;
  created_at: string;
  expires_at: string;
}

function readJson<T>(fp: string, fallback: T): T {
  if (!fs.existsSync(fp)) return fallback;
  try {
    return JSON.parse(fs.readFileSync(fp, "utf8")) as T;
  } catch {
    return fallback;
  }
}

function writeJson(fp: string, data: unknown): void {
  fs.mkdirSync(path.dirname(fp), { recursive: true });
  fs.writeFileSync(fp, JSON.stringify(data, null, 2), "utf8");
}

function hashPassword(password: string, salt: string): string {
  return crypto.scryptSync(password, salt, 64).toString("hex");
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function registerUser(
  email: string,
  password: string
): { ok: true; user: { id: string; email: string } } | { ok: false; error: string } {
  ensureDataDirs();
  const e = normalizeEmail(email);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) {
    return { ok: false, error: "邮箱格式不正确" };
  }
  if (!password || password.length < 6) {
    return { ok: false, error: "密码至少 6 位" };
  }

  const index = readJson<Record<string, string>>(files.usersIndex(), {});
  if (index[e]) {
    return { ok: false, error: "该邮箱已注册，请直接登录" };
  }

  const id = crypto.randomBytes(8).toString("hex");
  const salt = crypto.randomBytes(16).toString("hex");
  const passwordHash = hashPassword(password, salt);
  const user: UserRecord = {
    id,
    email: e,
    passwordHash,
    salt,
    created_at: new Date().toISOString(),
  };

  const dir = userDataDir(id);
  fs.mkdirSync(dir, { recursive: true });
  writeJson(path.join(dir, "meta.json"), user);
  index[e] = id;
  writeJson(files.usersIndex(), index);

  // 初始化用户数据目录结构
  for (const sub of ["jobs", "applications", "events", ".cache"]) {
    fs.mkdirSync(path.join(dir, sub), { recursive: true });
  }

  return { ok: true, user: { id, email: e } };
}

export function loginUser(
  email: string,
  password: string
): { ok: true; user: { id: string; email: string } } | { ok: false; error: string } {
  ensureDataDirs();
  const e = normalizeEmail(email);
  const index = readJson<Record<string, string>>(files.usersIndex(), {});
  const id = index[e];
  if (!id) return { ok: false, error: "邮箱或密码错误" };

  const metaPath = path.join(userDataDir(id), "meta.json");
  if (!fs.existsSync(metaPath)) return { ok: false, error: "邮箱或密码错误" };
  const user = JSON.parse(fs.readFileSync(metaPath, "utf8")) as UserRecord;
  const hash = hashPassword(password, user.salt);
  if (hash !== user.passwordHash) return { ok: false, error: "邮箱或密码错误" };
  return { ok: true, user: { id: user.id, email: user.email } };
}

export function createSession(userId: string, email: string): string {
  ensureDataDirs();
  const token = crypto.randomBytes(24).toString("hex");
  const sessions = readJson<Record<string, SessionRecord>>(files.sessions(), {});
  const expires = new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString();
  sessions[token] = {
    token,
    userId,
    email,
    created_at: new Date().toISOString(),
    expires_at: expires,
  };
  writeJson(files.sessions(), sessions);
  return token;
}

export function getSession(
  token: string | undefined | null
): SessionRecord | null {
  if (!token) return null;
  const sessions = readJson<Record<string, SessionRecord>>(files.sessions(), {});
  const s = sessions[token];
  if (!s) return null;
  if (new Date(s.expires_at).getTime() < Date.now()) {
    delete sessions[token];
    writeJson(files.sessions(), sessions);
    return null;
  }
  return s;
}

export function destroySession(token: string | undefined | null): void {
  if (!token) return;
  const sessions = readJson<Record<string, SessionRecord>>(files.sessions(), {});
  delete sessions[token];
  writeJson(files.sessions(), sessions);
}

export function parseAuthToken(req: {
  headers: httpHeaders;
}): string | null {
  const h = req.headers["authorization"] || req.headers["Authorization"];
  if (typeof h === "string" && h.startsWith("Bearer ")) {
    return h.slice(7).trim();
  }
  const cookie = req.headers["cookie"];
  if (typeof cookie === "string") {
    const m = cookie.match(/(?:^|;\s*)jb_token=([^;]+)/);
    if (m) return decodeURIComponent(m[1]);
  }
  return null;
}

type httpHeaders = Record<string, string | string[] | undefined>;

export function ensureUserData(userId: string): string {
  const dir = userDataDir(userId);
  fs.mkdirSync(dir, { recursive: true });
  for (const sub of ["jobs", "applications", "events", ".cache"]) {
    fs.mkdirSync(path.join(dir, sub), { recursive: true });
  }
  return dir;
}

export { baseDataDir };
