import { nextMsrId } from "./mission-store.js";
import type { MissionStore } from "./mission-store.js";
import type { MsrIntegrationCoordinator } from "./integrations.js";
import type { MissionInstance, MsrInput } from "./types.js";

export type ExecutionResult = {
  handlerInvoked: boolean;
  orchestrationInvoked: boolean;
  outcome: "completed" | "failed" | "unconfirmed";
  notes: string[];
};

const object = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === "object" && !Array.isArray(value);

const reportedFailure = (value: Record<string, unknown>): boolean =>
  value.decision === "fail" || value.succeeded === false ||
  (Array.isArray(value.errors) && value.errors.length > 0);
const nonOperational = (value: Record<string, unknown>): boolean =>
  value.structuralSignalOnly === true || value.fabricated === true;

/** A generic pass/accepted/structural report is never proof of worker completion. */
function inspectReceipt(value: unknown, mission: MissionInstance): ExecutionResult["outcome"] {
  if (!object(value)) return "unconfirmed";
  if (reportedFailure(value)) return "failed";
  if (nonOperational(value) || value.missionId !== mission.missionId ||
      !Array.isArray(value.workerReceipts) || value.workerReceipts.length !== mission.workers.length) return "unconfirmed";
  const seen = new Set<string>();
  for (const receipt of value.workerReceipts) {
    if (object(receipt) && reportedFailure(receipt)) return "failed";
    if (!object(receipt) || typeof receipt.workerId !== "string" || !mission.workers.includes(receipt.workerId) ||
        nonOperational(receipt) || seen.has(receipt.workerId) || receipt.status !== "completed" ||
        typeof receipt.receiptId !== "string" || receipt.receiptId.trim().length === 0) return "unconfirmed";
    seen.add(receipt.workerId);
  }
  return seen.size > 0 ? "completed" : "unconfirmed";
}

export class ExecutionCoordinator {
  run(store: MissionStore, integrations: MsrIntegrationCoordinator, mission: MissionInstance, input: MsrInput): ExecutionResult {
    const deps = integrations.getDependencies();
    // The orchestrator owns worker dispatch when present. Calling both delegates
    // can duplicate the same real side effect.
    const por = deps.pillowOrchestrationRuntime;
    const registry = deps.workerRegistry;
    const usePor = typeof por?.invokeWorker === "function";
    const invoke = usePor ? por!.invokeWorker!.bind(por) : registry?.invokeWorker?.bind(registry);
    if (!invoke || mission.workers.length === 0 || new Set(mission.workers).size !== mission.workers.length) {
      return { handlerInvoked: false, orchestrationInvoked: false, outcome: "failed",
        notes: ["No unique worker assignment and callable implementation; nothing was dispatched"] };
    }
    const dispatchId = nextMsrId(`${mission.missionId}-dispatch`);
    // Persist intent before handing control to code that may have external effects.
    // A crash leaves Running + this intent; execute/retry must not blindly replay it.
    store.appendTimeline({ entryId: dispatchId, timestamp: new Date().toISOString(),
      label: `dispatch:${mission.missionId}`, state: "Running", notes: ["Dispatch intent recorded before invoking one delegate"] });
    let outcome: ExecutionResult["outcome"] = "unconfirmed";
    const notes: string[] = [];
    try {
      const result = invoke({ missionId: mission.missionId, dispatchId, idempotencyKey: mission.missionId,
        pillowConfirmed: input.pillowConfirmed, grandKingApproved: input.grandKingApproved,
        validated: input.validated ?? true,
        workers: usePor ? mission.workers.map(workerId => ({ workerId, factoryKey: "pillow-mission", action: "execute" })) : [...mission.workers] });
      if (object(result) && typeof result.then === "function") {
        // This synchronous adapter cannot certify an asynchronous result. Consume
        // rejection to prevent an unhandled crash; reconciliation is still required.
        void Promise.resolve(result).catch(() => undefined);
        notes.push("Asynchronous dispatch outcome requires reconciliation; no completion credited");
      } else {
        outcome = inspectReceipt(result, mission);
        notes.push(outcome === "completed" ? "All assigned workers returned mission-bound completion receipts" :
          outcome === "failed" ? "Delegate reported failure; side effects must be reconciled before retry" :
          "Missing or mismatched completion receipts; outcome requires reconciliation");
      }
    } catch {
      // Exceptions may occur after a side effect. Never reinterpret them as safe to retry.
      notes.push("Delegate threw; outcome is unknown and requires reconciliation");
    }
    store.appendTimeline({ entryId: nextMsrId(`${mission.missionId}-outcome`), timestamp: new Date().toISOString(),
      label: `outcome:${mission.missionId}`, state: outcome, notes });
    return { handlerInvoked: !usePor, orchestrationInvoked: usePor, outcome, notes };
  }
}
