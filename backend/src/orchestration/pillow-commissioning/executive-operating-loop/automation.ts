/**
 * Continuous executive loop automation — cloud tick + Brain scheduler.
 * Reuses presale automation pattern. Not a fake heartbeat.
 */

import { randomUUID } from "node:crypto";

import type { ScheduledJobDefinition } from "../../../brain/scheduler.js";
import { logger } from "../../../config/logger.js";
import { GRAND_KING_COMPANY_ID, GRAND_KING_WORKSPACE_ID } from "../../../grand-king/constants.js";
import { admitExpensiveWork } from "../../../runtime/production-admission-control.js";
import { assertPaidAutonomousAllowed } from "../cost-guard.js";
import { runExecutiveOperatingCycle } from "./cycle-runner.js";
import { buildLiveCommercialSituation } from "./live-situation.js";

export const PILLOW_EXECUTIVE_LOOP_JOB_NAME = "pillow-executive-operating-loop";

export function getPillowExecutiveLoopSchedulerDefinitions(): ScheduledJobDefinition[] {
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
  private timers: NodeJS.Timeout[] = [];
  private running = false;

  start(): void {
    if (this.running) return;
    this.running = true;
    logger.info(
      { job: PILLOW_EXECUTIVE_LOOP_JOB_NAME },
      "Pillow executive operating loop started (observe→…→continue; no chat prompt required)",
    );

    this.timers.push(
      setInterval(() => void runPillowExecutiveLoopAutomationTick(), 30 * 60 * 1000),
    );

    // Defer boot tick well past Pillow host warm-up so restart storms do not wedge auth/EH.
    const bootDelayMs = Number(process.env.PILLOW_EXECUTIVE_LOOP_BOOT_DELAY_MS ?? 180_000);
    setTimeout(() => {
      void runPillowExecutiveLoopAutomationTick().then((result) => {
        logger.info({ ...result, correlationId: randomUUID() }, "Pillow executive loop boot tick");
      });
    }, bootDelayMs);
  }

  stop(): void {
    for (const timer of this.timers) clearInterval(timer);
    this.timers = [];
    this.running = false;
  }
}

let serverInstance: PillowExecutiveLoopAutomationServer | null = null;

export function getPillowExecutiveLoopAutomationServer(): PillowExecutiveLoopAutomationServer {
  if (!serverInstance) serverInstance = new PillowExecutiveLoopAutomationServer();
  return serverInstance;
}
