import type { FailureCoordinationResult, FailureEvent } from "./types.js";

export function coordinateFailure(event: FailureEvent): FailureCoordinationResult {
  const actions: FailureCoordinationResult["actions"] = [];

  if (event.recoverable !== false) {
    actions.push("recovery_required");
    actions.push("retry_appropriate");
  } else {
    actions.push("mission_postponement");
  }

  if (/critical|audit|governance|integrity/i.test(event.message)) {
    actions.push("escalation_required");
    actions.push("grand_king_notification");
  }

  if (event.missionId) {
    actions.push("grand_king_notification");
  }

  const unique = [...new Set(actions)];

  let recommendation: string;
  if (unique.includes("recovery_required")) {
    recommendation =
      "Coordinate Recovery Manager via Cursor Supervisor — preserve repository integrity";
  } else if (unique.includes("escalation_required")) {
    recommendation = "Escalate to Grand King — do not bypass Executive Audit";
  } else {
    recommendation = "Postpone mission — re-evaluate via Mission Planner when ready";
  }

  return {
    event,
    actions: unique,
    recommendation,
    preserveRepositoryIntegrity: true,
  };
}
