import type { SubsystemVerification } from "./subsystem-checklist.js";

export type ValidationReport = {
  phase: "2.5";
  startedAt: string;
  finishedAt: string;
  typecheck: {
    exitCode: number | null;
    passed: boolean;
    output: string;
  };
  tests: {
    exitCode: number | null;
    passed: boolean;
    output: string;
  };
  guardianHealth: Record<string, unknown> | { skipped: string };
  dispatchProbe: Record<string, unknown> | { skipped: string; error?: string };
  databaseIntegrity: { ok: boolean; integrityCheck?: string; missingTables?: string[] };
  redisAvailable: boolean;
  subsystemChecklist: SubsystemVerification[];
  overall: "pass" | "fail" | "degraded";
  notes: string[];
};
