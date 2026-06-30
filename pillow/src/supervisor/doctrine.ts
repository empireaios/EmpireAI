import type { StallKind } from "./types.js";

/** Auto-trigger states from EMPIREAI_CURSOR_RECOVERY_DOCTRINE.md §4 */
export const DOCTRINE_AUTO_TRIGGER_STATES: Array<{
  kind: StallKind;
  patterns: RegExp[];
  doctrineRef: string;
}> = [
  {
    kind: "waiting_background_process",
    patterns: [/waiting for background/i, /background process/i],
    doctrineRef: "EMPIREAI_CURSOR_RECOVERY_DOCTRINE.md §4",
  },
  {
    kind: "waiting_detached_process",
    patterns: [/waiting for detached/i, /detached process/i, /orphaned process/i],
    doctrineRef: "EMPIREAI_CURSOR_RECOVERY_DOCTRINE.md §4",
  },
  {
    kind: "waiting_npm",
    patterns: [/waiting for npm/i, /npm install/i, /npm run/i],
    doctrineRef: "EMPIREAI_CURSOR_RECOVERY_DOCTRINE.md §4",
  },
  {
    kind: "waiting_build",
    patterns: [/waiting for build/i, /building/i, /npm run build/i],
    doctrineRef: "EMPIREAI_CURSOR_RECOVERY_DOCTRINE.md §4",
  },
  {
    kind: "reconnecting",
    patterns: [/reconnecting/i, /reconnect loop/i],
    doctrineRef: "EMPIREAI_CURSOR_RECOVERY_DOCTRINE.md §4",
  },
  {
    kind: "taking_longer_than_expected",
    patterns: [/taking longer than expected/i, /longer than expected/i],
    doctrineRef: "EMPIREAI_CURSOR_RECOVERY_DOCTRINE.md §4",
  },
];

export const RECOVERY_DOCTRINE_PATH = "EMPIREAI_CURSOR_RECOVERY_DOCTRINE.md";

export const RECOVERY_SEQUENCE: Array<{ step: number; label: string }> = [
  { step: 1, label: "Inspect repository state" },
  { step: 2, label: "Determine validation status" },
  { step: 3, label: "Terminate only the blocked process" },
  { step: 4, label: "One fresh validation cycle only" },
  { step: 5, label: "On success — produce Executive Audit" },
  { step: 6, label: "On failure — repair once and re-validate" },
];

export function matchDoctrineStall(detail: string): StallKind | null {
  for (const rule of DOCTRINE_AUTO_TRIGGER_STATES) {
    if (rule.patterns.some((p) => p.test(detail))) {
      return rule.kind;
    }
  }
  return null;
}

export function doctrineRefForStall(kind: StallKind): string {
  const found = DOCTRINE_AUTO_TRIGGER_STATES.find((r) => r.kind === kind);
  return found?.doctrineRef ?? RECOVERY_DOCTRINE_PATH;
}
