import { randomUUID } from "node:crypto";

import { logger } from "../../config/logger.js";
import { GRAND_KING_COMPANY_ID, GRAND_KING_WORKSPACE_ID } from "../constants.js";
import { getGrandKingRepository } from "../repositories/sqlite-grand-king-repository.js";
import { seedGrandKingAccount } from "../services/grand-king-seed-service.js";
import { buildGrandKingAccountDashboard } from "../services/grand-king-dashboard-service.js";

export type GrandKingAutomationJob = {
  name: string;
  cron: string;
  description: string;
  run: () => Promise<{ ok: boolean; detail: string }>;
};

/** Scheduled jobs for Grand King account only — no multi-user scaling. */
export const GRAND_KING_AUTOMATION_JOBS: GrandKingAutomationJob[] = [
  {
    name: "grand-king-morning-sync",
    cron: "0 7 * * *",
    description: "Ensure Grand King seed data and refresh dashboard summary",
    run: async () => {
      seedGrandKingAccount(GRAND_KING_WORKSPACE_ID);
      buildGrandKingAccountDashboard(GRAND_KING_WORKSPACE_ID);
      return { ok: true, detail: "Morning sync complete" };
    },
  },
  {
    name: "grand-king-surveillance",
    cron: "0 */6 * * *",
    description: "Run executive surveillance for Grand King",
    run: async () => {
      try {
        const { runExecutiveSurveillance, initializeWatcherRegistry } = await import("../../executive-surveillance/index.js");
        initializeWatcherRegistry(GRAND_KING_WORKSPACE_ID, GRAND_KING_COMPANY_ID);
        const result = runExecutiveSurveillance(GRAND_KING_WORKSPACE_ID, GRAND_KING_COMPANY_ID);
        syncSurveillanceTasks(result.signals.length);
        return { ok: true, detail: `${result.signals.length} signals emitted` };
      } catch (err) {
        return { ok: false, detail: err instanceof Error ? err.message : "Surveillance failed" };
      }
    },
  },
  {
    name: "grand-king-decision-check",
    cron: "0 */2 * * *",
    description: "Ensure pending AI decisions exist for Grand King",
    run: async () => {
      const repo = getGrandKingRepository();
      seedGrandKingAccount(GRAND_KING_WORKSPACE_ID);
      const pending = repo.listAiDecisions(GRAND_KING_WORKSPACE_ID).filter((d) => d.status === "PENDING");
      if (pending.length === 0) {
        repo.saveAiDecision({
          decisionId: randomUUID(),
          workspaceId: GRAND_KING_WORKSPACE_ID,
          title: "Review empire readiness — no pending decisions",
          module: "grand-king-automation",
          status: "PENDING",
          confidence: 60,
          createdAt: new Date().toISOString(),
        });
      }
      return { ok: true, detail: `${pending.length} pending decisions` };
    },
  },
];

function syncSurveillanceTasks(signalCount: number): void {
  if (signalCount === 0) return;
  const repo = getGrandKingRepository();
  const existing = repo.listTasks(GRAND_KING_WORKSPACE_ID);
  const hasSurveillanceTask = existing.some((t) => t.source === "executive-surveillance" && t.status !== "DONE");
  if (!hasSurveillanceTask) {
    repo.createTask({
      workspaceId: GRAND_KING_WORKSPACE_ID,
      title: `Review ${signalCount} surveillance signal(s)`,
      status: "PENDING",
      priority: "HIGH",
      source: "executive-surveillance",
    });
  }
}

export async function runGrandKingAutomationJob(jobName: string): Promise<{ ok: boolean; detail: string }> {
  const job = GRAND_KING_AUTOMATION_JOBS.find((j) => j.name === jobName);
  if (!job) return { ok: false, detail: `Unknown job: ${jobName}` };
  logger.info({ job: jobName }, "Running Grand King automation job");
  return job.run();
}

export async function runAllGrandKingAutomationJobs(): Promise<Array<{ job: string; ok: boolean; detail: string }>> {
  const results = [];
  for (const job of GRAND_KING_AUTOMATION_JOBS) {
    const result = await job.run();
    results.push({ job: job.name, ...result });
  }
  return results;
}
