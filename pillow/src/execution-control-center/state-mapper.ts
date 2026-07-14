import type { EccExecutionState } from "./types.js";

/** Map Supervisor mission states to ECC constitutional execution states. */
export function mapSupervisorStateToEcc(
  supervisorState: string,
): EccExecutionState {
  switch (supervisorState) {
    case "queued":
      return "queued";
    case "preparing":
    case "synchronizing":
    case "reviewing":
    case "planning":
    case "repository_inspection":
      return "preparing";
    case "implementing":
    case "implementation":
      return "executing";
    case "testing":
    case "validating":
    case "validation":
    case "production_verification":
    case "executive_audit":
      return "validating";
    case "recovering":
    case "recovery":
      return "recovering";
    case "blocked":
    case "failed":
      return "blocked";
    case "awaiting_grand_king":
      return "waiting";
    case "completed":
      return "completed";
    case "cancelled":
      return "cancelled";
    default:
      return "ready";
  }
}

export function inferPipelineStageFromState(state: EccExecutionState): import("./types.js").EccPipelineStage {
  switch (state) {
    case "queued":
    case "preparing":
      return "execution_planning";
    case "waiting":
    case "ready":
      return "execution_coordination";
    case "executing":
      return "builder_execution";
    case "validating":
      return "supervisor_observation";
    case "recovering":
      return "guardian_monitoring";
    case "blocked":
    case "paused":
      return "dependency_resolution";
    case "completed":
      return "journey_completion";
    case "cancelled":
      return "execution_coordination";
    default:
      return "execution_coordination";
  }
}
