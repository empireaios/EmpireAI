/**
 * Continuous executive loop automation — cloud tick + Brain scheduler.
 * Reuses presale automation pattern. Not a fake heartbeat.
 */

import { isEngineeringTestMode } from "../../../runtime/engineering-test-mode.js";
import { ManagedBackgroundTask } from "../../../runtime/managed-background-task.js";
import type { ScheduledJobDefinition } from "../../../brain/scheduler.js";
import { logger } from "../../../config/logger.js";
import { GRAND_KING_COMPANY_ID, GRAND_KING_WORKSPACE_ID } from "../../../grand-king/constants.js";
import { admitExpensiveWork } from "../../../runtime/production-admission-control.js";
import { assertPaidAutonomousAllowed } from "../cost-guard.js";
import { runExecutiveOperatingCycle } from "./cycle-runner.js";
import { buildLiveCommercialSituation } from "./live-situation.js";

export const PILLOW_EXECUTIVE_LOOP_JOB_NAME = "pillow-executive-operating-loop";

export function getPillowExecutiveLoopSchedulerDefinitions(): ScheduledJobDefinition[] {
  if (isEngineeringTestMode()) return [];
  return [
    {
      name: PILLOW_EXECUTIVE_LOOP_JOB_NAME,
      cron: "*/30 * * * *",
      payload: {
        type: "tool.execute",
        workspaceId: GRAND_KING_WORKSPACE_ID,
        companyId: GRAND_KING_COMPANY_ID,
        toolName: "pillow_executive.run_operating_cycle",
        input: {
          workspaceId: GRAND_KING_WORKSPACE_ID,
        },
        correlationId: `schedule:${PILLOW_EXECUTIVE_LOOP_JOB_NAME}`,
        priority: "high",
      },
    },
  ];
}

export async function runPillowExecutiveLoopAutomationTick(): Promise<{
  ok: boolean;
  detail: string;
  cycleId?: string;
  disposition?: string;
}> {
  try {
    if (isEngineeringTestMode()) return { ok: false, detail: "Engineering test mode: commerce automation disabled" };
    const admission = admitExpensiveWork("executive-operating-loop");
    if (!admission.admit) {
      return {
        ok: false,
        detail: `Admission deferred executive loop: ${admission.reason}`,
      };
    }
    const gate = assertPaidAutonomousAllowed(GRAND_KING_WORKSPACE_ID, 0.01);
    if (!gate.allowed) {
      return {
        ok: false,
        detail: `Cost Guard blocked executive loop: ${gate.reason}`,
      };
    }
    const situation = buildLiveCommercialSituation(GRAND_KING_WORKSPACE_ID);
    const cycle = runExecutiveOperatingCycle({
      workspaceId: GRAND_KING_WORKSPACE_ID,
      situation,
      mode: "live",
      persist: true,
      recordFlight: true,
    });
    return {
      ok: true,
      detail: `disposition=${cycle.decision.disposition}; hypotheses=${cycle.hypotheses.length}; cheapOps=${cycle.cheapOperationsUsed}; llm=${cycle.llmCallsUsed}`,
      cycleId: cycle.cycleId,
      disposition: cycle.decision.disposition,
    };
  } catch (error) {
    return {
      ok: false,
      detail: error instanceof Error ? error.message : "Executive loop tick failed",
    };
  }
}

export class PillowExecutiveLoopAutomationServer {
  private readonly task: ManagedBackgroundTask;

  constructor(tick: typeof runPillowExecutiveLoopAutomationTick = runPillowExecutiveLoopAutomationTick) {
    this.task = new ManagedBackgroundTask({
      allowed: () => !isEngineeringTestMode(),
      run: async () => {
        const result = await tick();
        logger.info(result, "Pillow executive operating loop tick");
      },
      onError: (error) => logger.error({ error }, "Pillow executive operating loop failed"),
    });
  }

  start(): void {
    this.task.start(Number(process.env.PILLOW_EXECUTIVE_LOOP_BOOT_DELAY_MS ?? 180_000), 30 * 60 * 1000);
  }

  stop(): Promise<void> {
    return this.task.stop();
  }
}

let serverInstance: PillowExecutiveLoopAutomationServer | null = null;

export function getPillowExecutiveLoopAutomationServer(): PillowExecutiveLoopAutomationServer {
  if (!serverInstance) serverInstance = new PillowExecutiveLoopAutomationServer();
  return serverInstance;
}
