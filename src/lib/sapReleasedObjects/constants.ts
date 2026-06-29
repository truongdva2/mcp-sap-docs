import type { CleanCoreLevel, SystemType } from "./types.js";

import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, "..", "..", "..");

export const SOURCES_DIR = path.resolve(PROJECT_ROOT, "sources/abap-atc-cr-cv-s4hc/src");

export const SOURCE_FILES: Record<SystemType, string> = {
  public_cloud:  "objectReleaseInfoLatest.json",
  btp:           "objectReleaseInfo_BTPLatest.json",
  private_cloud: "objectReleaseInfo_PCELatest.json",
  on_premise:    "objectReleaseInfo_PCELatest.json",
};

export const CLASSIC_API_FILE = "objectClassifications_SAP.json";

export const STATE_TO_LEVEL: Record<string, CleanCoreLevel> = {
  released:         "A",
  deprecated:       "A",
  classicAPI:       "B",
  stable:           "C",
  notToBeReleased:  "C",
  noAPI:            "D",
};

export const CLEAN_CORE_LEVEL_LABELS: Record<CleanCoreLevel, string> = {
  A: "Released API",
  B: "Classic API",
  C: "Internal / Stable",
  D: "No API",
};

// Cumulative: level B includes A+B, level C includes A+B+C, D = all
export const CUMULATIVE_LEVELS: Record<CleanCoreLevel, CleanCoreLevel[]> = {
  A: ["A"],
  B: ["A", "B"],
  C: ["A", "B", "C"],
  D: ["A", "B", "C", "D"],
};

export const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
