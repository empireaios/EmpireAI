import type { FailureClassification } from "./types.js";
import type { AutonomousRecoveryAction } from "./types.js";

/** Map failure classification to safe autonomous recovery actions. */
export function selectAutonomousActions(
  classification: FailureClassification,
): AutonomousRecoveryAction[] {
  switch (classification) {
    case "transient":
      return ["retry", "resume", "restart_worker", "continue_mission"];
    case "configuration":
      return ["revalidate_dependencies", "reload_context", "retry"];
    case "infrastructure":
      return ["reconnect_provider", "restart_worker", "retry"];
    case "repository":
      return ["reload_context", "revalidate_dependencies", "resume"];
    case "architecture":
      return ["reload_context", "continue_mission"];
    case "engineering":
      return ["resume", "retry", "revalidate_dependencies", "continue_mission"];
    case "production":
      return ["revalidate_dependencies", "resume_journey"];
    case "dependency":
      return ["revalidate_dependencies", "reload_context"];
    case "external_service":
      return ["reconnect_provider", "retry", "rebuild_cache"];
    case "human_approval_required":
      return [];
    case "unknown":
    default:
      return ["retry", "resume"];
  }
}

export function computeRecoveryConfidence(input: {
  classification: FailureClassification;
  repositoryIntegrityOk: boolean;
  recoveryAttempts: number;
  validationPassed?: boolean;
}): number {
  let score = 0.85;

  if (!input.repositoryIntegrityOk) score -= 0.35;
  if (input.recoveryAttempts >= 2) score -= 0.2;
  if (input.classification === "human_approval_required") score = 0.2;
  if (input.classification === "production") score -= 0.15;
  if (input.classification === "architecture") score -= 0.1;
  if (input.classification === "unknown") score -= 0.15;
  if (input.validationPassed) score += 0.1;

  return Math.max(0, Math.min(1, score));
}
