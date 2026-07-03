/**
 * G5-06 — Guardian operational observer bridge (failure/recovery/rollback events).
 */

export type GuardianRecoveryEventKind = "failure" | "recovery" | "rollback" | "escalation";

export type GuardianRecoveryEvent = {
  eventKind: GuardianRecoveryEventKind;
  workspaceId: string;
  executionId: string;
  recoveryId: string;
  correlationId: string;
  message: string;
  metadata?: Record<string, unknown>;
  observedAt: string;
};

const guardianEventLog: GuardianRecoveryEvent[] = [];

export function notifyGuardianRecoveryEvent(
  input: Omit<GuardianRecoveryEvent, "observedAt">,
): GuardianRecoveryEvent {
  const event: GuardianRecoveryEvent = {
    ...input,
    observedAt: new Date().toISOString(),
  };
  guardianEventLog.push(event);
  return event;
}

export function listGuardianRecoveryEvents(workspaceId?: string): readonly GuardianRecoveryEvent[] {
  if (!workspaceId) return [...guardianEventLog];
  return guardianEventLog.filter((event) => event.workspaceId === workspaceId);
}

export function resetGuardianRecoveryEventsForTests(): void {
  guardianEventLog.length = 0;
}
