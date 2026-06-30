import { randomUUID } from "node:crypto";

import { logger } from "../../config/logger.js";
import type { ScheduledJobDefinition } from "../../brain/scheduler.js";
import { GRAND_KING_COMPANY_ID, GRAND_KING_WORKSPACE_ID } from "../constants.js";
import { GRAND_KING_AUTOMATION_JOBS, runGrandKingAutomationJob } from "./grand-king-automation-jobs.js";

/** Brain scheduler payloads for Grand King automation (Grand King account only). */
export function getGrandKingSchedulerDefinitions(): ScheduledJobDefinition[] {
  return GRAND_KING_AUTOMATION_JOBS.map((job) => ({
    name: job.name,
    cron: job.cron,
    payload: {
      type: "tool.execute" as const,
      workspaceId: GRAND_KING_WORKSPACE_ID,
      companyId: GRAND_KING_COMPANY_ID,
      toolName: "grand_king.automation.run",
      input: { jobName: job.name },
      correlationId: `schedule:${job.name}`,
      priority: "high" as const,
    },
  }));
}

/** Minimal interval-based automation server when running standalone (no Redis). */
export class GrandKingAutomationServer {
  private timers: NodeJS.Timeout[] = [];
  private running = false;

  start(): void {
    if (this.running) return;
    this.running = true;
    logger.info("Grand King automation server started (Grand King account only)");

    // Morning sync — every 24h
    this.timers.push(setInterval(() => void runGrandKingAutomationJob("grand-king-morning-sync"), 24 * 60 * 60 * 1000));
    // Surveillance — every 6h
    this.timers.push(setInterval(() => void runGrandKingAutomationJob("grand-king-surveillance"), 6 * 60 * 60 * 1000));
    // Decision check — every 2h
    this.timers.push(setInterval(() => void runGrandKingAutomationJob("grand-king-decision-check"), 2 * 60 * 60 * 1000));

    // Run morning sync once on startup
    void runGrandKingAutomationJob("grand-king-morning-sync");
  }

  stop(): void {
    for (const timer of this.timers) clearInterval(timer);
    this.timers = [];
    this.running = false;
    logger.info("Grand King automation server stopped");
  }
}

let serverInstance: GrandKingAutomationServer | null = null;

export function getGrandKingAutomationServer(): GrandKingAutomationServer {
  if (!serverInstance) serverInstance = new GrandKingAutomationServer();
  return serverInstance;
}

/** Tool handler input for brain worker integration. */
export async function handleGrandKingAutomationTool(input: { jobName?: string }): Promise<unknown> {
  const jobName = input.jobName ?? "grand-king-morning-sync";
  return runGrandKingAutomationJob(jobName);
}

export function createGrandKingAutomationCorrelationId(): string {
  return `gk-auto:${randomUUID()}`;
}
