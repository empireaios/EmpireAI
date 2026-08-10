/**
 * Proactive Pillow commerce initiation — does not wait for Grand King chat prompts.
 * Reuses Grand King automation pattern (interval + startup tick + Brain scheduler tool.execute).
 */
import { randomUUID } from "node:crypto";

import type { ScheduledJobDefinition } from "../../../brain/scheduler.js";
import { logger } from "../../../config/logger.js";
import { GRAND_KING_COMPANY_ID, GRAND_KING_WORKSPACE_ID } from "../../../grand-king/constants.js";
import { getPresaleApprovalGate } from "../approval-bridge.js";
import { runPillowCommercePresaleCycle } from "../services/presale-cycle-service.js";

export const PILLOW_COMMERCE_PRESALE_JOB_NAME = "pillow-commerce-presale-cycle";

/** Brain scheduler definition — tool.execute path (Pillow/orchestration, not Cursor). */
export function getPillowCommercePresaleSchedulerDefinitions(): ScheduledJobDefinition[] {
  return [
    {
      name: PILLOW_COMMERCE_PRESALE_JOB_NAME,
      cron: "0 */4 * * *",
      payload: {
        type: "tool.execute",
        workspaceId: GRAND_KING_WORKSPACE_ID,
        companyId: GRAND_KING_COMPANY_ID,
        toolName: "pillow_commerce.run_presale_cycle",
        input: {
          workspaceId: GRAND_KING_WORKSPACE_ID,
          companyId: GRAND_KING_COMPANY_ID,
          smartViableBatch: true,
          maxCandidates: 24,
        },
        correlationId: `schedule:${PILLOW_COMMERCE_PRESALE_JOB_NAME}`,
        priority: "high",
      },
    },
  ];
}

export async function runPillowCommercePresaleAutomationTick(): Promise<{
  ok: boolean;
  detail: string;
  cycleId?: string;
  outcome?: string;
}> {
  try {
    const cycle = await runPillowCommercePresaleCycle({
      workspaceId: GRAND_KING_WORKSPACE_ID,
      companyId: GRAND_KING_COMPANY_ID,
      initiatedBy: "pillow-autonomous",
      smartViableBatch: true,
      maxCandidates: 24,
      approvalGate: getPresaleApprovalGate(),
    });
    return {
      ok: true,
      detail: `outcome=${cycle.outcome}; retrieved=${cycle.candidatesRetrieved}; rejected=${cycle.rejections.length}; smartViable=${cycle.smartViableBatchCount ?? 0}`,
      cycleId: cycle.cycleId,
      outcome: cycle.outcome,
    };
  } catch (error) {
    return {
      ok: false,
      detail: error instanceof Error ? error.message : "Presale automation tick failed",
    };
  }
}

export class PillowCommercePresaleAutomationServer {
  private timers: NodeJS.Timeout[] = [];
  private running = false;

  start(): void {
    if (this.running) return;
    this.running = true;
    logger.info(
      { job: PILLOW_COMMERCE_PRESALE_JOB_NAME },
      "Pillow commerce pre-sale automation started (proactive; no chat prompt required)",
    );

    // Every 4 hours
    this.timers.push(
      setInterval(() => void runPillowCommercePresaleAutomationTick(), 4 * 60 * 60 * 1000),
    );

    // Startup tick after Pillow host / approval gate have a chance to wire
    const bootDelayMs = Number(process.env.PILLOW_COMMERCE_PRESALE_BOOT_DELAY_MS ?? 45_000);
    setTimeout(() => {
      void runPillowCommercePresaleAutomationTick().then((result) => {
        logger.info({ ...result, correlationId: randomUUID() }, "Pillow commerce pre-sale boot tick");
      });
    }, bootDelayMs);
  }

  stop(): void {
    for (const timer of this.timers) clearInterval(timer);
    this.timers = [];
    this.running = false;
  }
}

let serverInstance: PillowCommercePresaleAutomationServer | null = null;

export function getPillowCommercePresaleAutomationServer(): PillowCommercePresaleAutomationServer {
  if (!serverInstance) serverInstance = new PillowCommercePresaleAutomationServer();
  return serverInstance;
}
