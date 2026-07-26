/**
 * 职块 Job Block — 可编程 API（供 CLI / 未来 HTTP / OKX ASP 封装）
 */
export { config } from "./config.js";
export * from "./types.js";
export { scanAll, ingestPaste, ingestTelegramText } from "./ingest/index.js";
export { rankJobs, formatShortlist } from "./match/rank.js";
export { evaluateJob, findJob } from "./eval/evaluate.js";
export { tailorMaterials } from "./tailor/draft.js";
export { listEvents, briefEvent } from "./events/luma.js";
export {
  loadProfile,
  saveProfile,
  loadJobs,
  loadShortlist,
} from "./store/fs-store.js";
export {
  listApplications,
  formatTracker,
  recordOutcome,
  updateStatus,
} from "./track/tracker.js";
export {
  interactiveSetup,
  bootstrapProfile,
  getProfile,
  normalizeProfile,
  saveProfileFromInput,
  defaultProfile,
} from "./profile/setup.js";
