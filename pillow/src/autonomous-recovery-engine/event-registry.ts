/** Autonomous Recovery event registry (P6-06). */
export const RECOVERY_EVENT_REGISTRY = [
  { kind: "failure_detected", description: "Recoverable failure detected from live evidence" },
  { kind: "evidence_collected", description: "Failure evidence gathered from Builder and Supervisor" },
  { kind: "failure_classified", description: "Failure classified per Recovery Doctrine" },
  { kind: "strategy_selected", description: "Recovery strategy selected from registry" },
  { kind: "safety_validated", description: "Autonomous recovery safety validated" },
  { kind: "recovery_started", description: "Recovery execution begun" },
  { kind: "recovery_completed", description: "Recovery completed successfully" },
  { kind: "recovery_failed", description: "Recovery attempt failed" },
  { kind: "escalation_triggered", description: "Escalation to next authority level" },
  { kind: "mission_resumed", description: "Mission execution resumed after recovery" },
  { kind: "journey_recorded", description: "Recovery journey recorded" },
] as const;

export type AutonomousRecoveryEventKind = (typeof RECOVERY_EVENT_REGISTRY)[number]["kind"];
