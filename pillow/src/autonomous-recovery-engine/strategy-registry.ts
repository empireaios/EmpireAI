import type { RecoveryStrategyDefinition } from "./types.js";
import { AUTONOMOUS_RECOVERY_LIMITS } from "./paths.js";

/** Recovery strategy registry (P6-06). */
export const RECOVERY_STRATEGY_REGISTRY: RecoveryStrategyDefinition[] = [
  {
    id: "retry",
    purpose: "Retry failed operation with same context",
    safetyConditions: ["No repository conflicts", "Retry count below limit"],
    maximumAttempts: AUTONOMOUS_RECOVERY_LIMITS.maxRetryAttempts,
    failureConditions: ["Repeated failure", "Timeout exceeded"],
    escalationRules: ["Escalate to Supervisor after max attempts"],
  },
  {
    id: "resume",
    purpose: "Resume mission from last safe checkpoint",
    safetyConditions: ["Mission state preserved", "Repository integrity ok"],
    maximumAttempts: 2,
    failureConditions: ["Lost mission state", "Corrupted checkpoint"],
    escalationRules: ["Escalate to Pillow if resume fails"],
  },
  {
    id: "restart_worker",
    purpose: "Restart Builder worker process",
    safetyConditions: ["No active writes", "Worker heartbeat lost"],
    maximumAttempts: 2,
    failureConditions: ["Worker restart fails twice"],
    escalationRules: ["Escalate to ECC for resource allocation"],
  },
  {
    id: "restart_queue",
    purpose: "Restart mission execution queue",
    safetyConditions: ["Queue deadlock detected", "No active mission writes"],
    maximumAttempts: 1,
    failureConditions: ["Queue corruption"],
    escalationRules: ["Escalate to Pillow"],
  },
  {
    id: "reload_context",
    purpose: "Reload mission context from repository memory",
    safetyConditions: ["Context sync available", "No irreversible changes"],
    maximumAttempts: 2,
    failureConditions: ["Context corruption"],
    escalationRules: ["Escalate to Supervisor"],
  },
  {
    id: "rebuild_execution_state",
    purpose: "Rebuild execution state from evidence",
    safetyConditions: ["Repository evidence available", "Mission not complete"],
    maximumAttempts: 1,
    failureConditions: ["Insufficient evidence"],
    escalationRules: ["Escalate to Pillow"],
  },
  {
    id: "restore_session",
    purpose: "Restore durable session from checkpoint",
    safetyConditions: ["Durable session available", "Session integrity verified"],
    maximumAttempts: 1,
    failureConditions: ["Session corrupted"],
    escalationRules: ["Escalate to Grand King if session lost"],
  },
  {
    id: "rollback_safe_changes",
    purpose: "Rollback safe uncommitted changes",
    safetyConditions: ["Changes are safe to rollback", "Grand King not required"],
    maximumAttempts: 1,
    failureConditions: ["Irreversible changes detected"],
    escalationRules: ["Escalate to Grand King — rollback requires approval"],
  },
  {
    id: "continue_mission",
    purpose: "Continue mission after transient failure cleared",
    safetyConditions: ["Failure classified transient", "Confidence above threshold"],
    maximumAttempts: AUTONOMOUS_RECOVERY_LIMITS.maxRetryAttempts,
    failureConditions: ["Failure recurs"],
    escalationRules: ["Escalate after repeated transient failures"],
  },
  {
    id: "pause_mission",
    purpose: "Pause mission until dependency or resource available",
    safetyConditions: ["Non-critical pause", "Mission state preserved"],
    maximumAttempts: 1,
    failureConditions: ["Pause exceeds timeout"],
    escalationRules: ["Escalate to ECC for scheduling"],
  },
  {
    id: "escalate",
    purpose: "Escalate to next authority level",
    safetyConditions: ["Autonomous recovery unsafe or exhausted"],
    maximumAttempts: 1,
    failureConditions: ["Grand King unavailable for irreversible action"],
    escalationRules: ["Supervisor → Pillow → ECC → Grand King"],
  },
];

export function getRecoveryStrategy(id: string): RecoveryStrategyDefinition | undefined {
  return RECOVERY_STRATEGY_REGISTRY.find((s) => s.id === id);
}
