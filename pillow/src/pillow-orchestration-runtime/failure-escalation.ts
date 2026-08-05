import { appendPorLog } from "./por-logging.js";
import { nextPorId } from "./orchestration-store.js";
import type { PorIntegrationCoordinator } from "./integrations.js";

export type FailureEscalationRecord = {
  escalationId: string;
  timestamp: string;
  label: string;
  severity: "warning" | "critical";
  handlerInvoked: boolean;
  notes: string[];
};

export class FailureEscalationInterface {
  escalate(
    integrations: PorIntegrationCoordinator,
    label: string,
    severity: "warning" | "critical" = "warning",
  ): FailureEscalationRecord {
    const escalationId = nextPorId("por-escalation");
    const timestamp = new Date().toISOString();
    const deps = integrations.getDependencies();
    const handler = deps.workerRecoverySystem?.escalateFailure ?? deps.workerRecoverySystem?.registerRecoveryTarget;
    let handlerInvoked = false;

    if (handler) {
      handler({ label, severity, escalationId, timestamp });
      handlerInvoked = true;
    }

    appendPorLog({ event: "failure_escalation", details: `${label}:${severity}` });
    return {
      escalationId,
      timestamp,
      label,
      severity,
      handlerInvoked,
      notes: handlerInvoked
        ? [`Failure escalation recorded via recovery system DI`]
        : [`Structural failure escalation record — recovery system unavailable`],
    };
  }
}
