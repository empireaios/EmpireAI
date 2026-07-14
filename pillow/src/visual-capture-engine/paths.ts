/** PILLOW-VCE-001 — Visual Capture Engine paths (T1-01). */

export const VISUAL_CAPTURE_SYSTEM_PATH =
  "docs/governance/EMPIREAI_VISUAL_CAPTURE_SYSTEM.md";

export const DEFAULT_CAPTURE_URL = "http://localhost:3000/cockpit";

export const DEFAULT_WINDOW_TITLE_PATTERNS = [
  "EmpireAI",
  "localhost:3000",
  "Grand King",
] as const;

export const CAPTURE_SOURCES = [
  "browser_viewport",
  "native_window",
  "display",
] as const;

export const CAPTURE_STATUSES = [
  "idle",
  "capturing",
  "paused",
  "recovering",
  "failed",
  "stopped",
] as const;
