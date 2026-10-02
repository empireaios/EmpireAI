/**
 * Proactive Pillow commerce initiation — does not wait for Grand King chat prompts.
 * Reuses Grand King automation pattern (interval + startup tick + Brain scheduler tool.execute).
 */

import { isEngineeringTestMode } from "../../../runtime/engineering-test-mode.js";
import { ManagedBackgroundTask } from "../../../runtime/managed-background-task.js";
import type { ScheduledJobDefinition } from "../../../brain/scheduler.js";
import { logger } from "../../../config/logger.js";
import { GRAND_KING_COMPANY_ID, GRAND_KING_WORKSPACE_ID } from "../../../grand-king/constants.js";
import { admitExpensiveWork } from "../../../runtime/production-admission-control.js";
import { assertPaidAutonomousAllowed } from "../../pillow-commissioning/cost-guard.js";
import { recordFlightEvent } from "../../pillow-commissioning/flight-recorder.js";
import { getPresaleApprovalGate } from "../approval-bridge.js";
import { runPillowCommercePresaleCycle } from "../services/presale-cycle-service.js";

export const PILLOW_COMMERCE_PRESALE_JOB_NAME = "pillow-commerce-presale-cycle";

/** Brain scheduler definition — tool.execute path (Pillow/orchestration, not Cursor). */
export function getPillowCommercePresaleSchedulerDefinitions(): ScheduledJobDefinition[] {
  if (isEngineeringTestMode()) return [];
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
    if (isEngineeringTestMode()) return { ok: false, detail: "Engineering test mode: commerce automation disabled" };
    const admission = admitExpensiveWork("pillow-commerce-presale");
    if (!admission.admit) {
      return {
        ok: false,
        detail: `Admission deferred presale: ${admission.reason}`,
      };
    }
    const gate = assertPaidAutonomousAllowed(GRAND_KING_WORKSPACE_ID, 0.05);
    if (!gate.allowed) {
      return {
        ok: false,
        detail: `Cost Guard blocked autonomous presale: ${gate.reason}`,
      };
    }
    const cycle = await runPillowCommercePresaleCycle({
      workspaceId: GRAND_KING_WORKSPACE_ID,
      companyId: GRAND_KING_COMPANY_ID,
      initiatedBy: "pillow-autonomous",
      smartViableBatch: true,
      maxCandidates: 24,
      approvalGate: getPresaleApprovalGate(),
    });
    try {
      recordFlightEvent({
        workspaceId: GRAND_KING_WORKSPACE_ID,
        eventType: "COMMERCE_CYCLE",
        businessArea: "commerce",
        subsystem: "pillow-commerce-presale-automation",
        objective: "Autonomous SMART viable discovery cycle",
        analysisSummary: `retrieved=${cycle.candidatesRetrieved}; rejected=${cycle.rejections.length}; smartViable=${cycle.smartViableBatchCount ?? 0}`,
        decision: cycle.outcome,
        authority: "pillow",
        result: cycle.outcome,
        nextScheduledAt: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(),
        evidenceConsidered: ["presale-automation-tick"],
        entityRefs: { cycleId: cycle.cycleId },
      });
    } catch {
      /* ledger must not break automation */
    }
    return {
      ok: true,
      detail: `outcome=${cycle.outcome}; retrieved=${cycle.candidatesRetrieved}; rejected=${cycle.rejections.length}; smartViable=${cycle.smartViableBatchCount ?? 0}`,
      cycleId: cycle.cycleId,
      outcome: cycle.outcome,
    };
  } catch (error) {
    try {
      recordFlightEvent({
        workspaceId: GRAND_KING_WORKSPACE_ID,
        eventType: "FAIL",
        businessArea: "commerce",
        subsystem: "pillow-commerce-presale-automation",
        objective: "Autonomous SMART viable discovery cycle",
        authority: "pillow",
        actionFailed: error instanceof Error ? error.message : "Presale automation tick failed",
        result: "FAIL",
        evidenceConsidered: ["presale-automation-tick"],
      });
    } catch {
      /* ignore */
    }
    return {
      ok: false,
      detail: error instanceof Error ? error.message : "Presale automation tick failed",
    };
  }
}

export class PillowCommercePresaleAutomationServer {
  private readonly task: ManagedBackgroundTask;

  constructor(tick: typeof runPillowCommercePresaleAutomationTick = runPillowCommercePresaleAutomationTick) {
    this.task = new ManagedBackgroundTask({
      allowed: () => !isEngineeringTestMode(),
      run: async () => {
        const result = await tick();
        logger.info(result, "Pillow commerce pre-sale tick");
      },
      onError: (error) => logger.error({ error }, "Pillow commerce pre-sale failed"),
    });
  }

  start(): void {
    this.task.start(Number(process.env.PILLOW_COMMERCE_PRESALE_BOOT_DELAY_MS ?? 240_000), 4 * 60 * 60 * 1000);
  }

  stop(): Promise<void> {
    return this.task.stop();
  }
}

let serverInstance: PillowCommercePresaleAutomationServer | null = null;

export function getPillowCommercePresaleAutomationServer(): PillowCommercePresaleAutomationServer {
  if (!serverInstance) serverInstance = new PillowCommercePresaleAutomationServer();
  return serverInstance;
}
