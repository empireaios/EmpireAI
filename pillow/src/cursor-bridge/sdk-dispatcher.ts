import type { CursorSupervisorEngine } from "../supervisor/engine.js";
import type { CursorMissionDocument } from "../planner/types.js";
import type { AutonomousEngineeringMission, DispatchMode, DispatchResult } from "./types.js";

export function resolveDispatchMode(apiKey?: string | null): DispatchMode {
  if (apiKey?.trim()) return "sdk";
  return "artifact";
}

export function isSdkAvailable(): boolean {
  return Boolean(process.env.CURSOR_API_KEY?.trim());
}

export function dispatchToCursor(input: {
  mission: AutonomousEngineeringMission;
  supervisor: CursorSupervisorEngine;
  mode?: DispatchMode;
}): DispatchResult {
  const mode = input.mode ?? (isSdkAvailable() ? "sdk" : "artifact");

  const document: CursorMissionDocument = {
    missionId: `BRIDGE-${input.mission.bridgeMissionId.slice(0, 8)}`,
    title: input.mission.title,
    missionType: "Autonomous Cursor Bridge (PILLOW-CB-001)",
    authority: "PILLOW_ARCHITECTURE_CONTRACT.md",
    objective: input.mission.objective,
    dependencies: [],
    implementationRules: [
      "Follow King's business instruction — no technical questions",
      "Use repository intelligence for file paths",
      "Run validation before reporting complete",
      "Produce executive summary at closeout",
    ],
    acceptanceCriteria: input.mission.acceptanceCriteria,
    validation: input.mission.validationSteps,
    executiveAudit: [
      "Pre-implementation review",
      "Validation results",
      "Deployment verification",
      "Executive recommendation",
    ],
    stopRule: "Stop after validation passes and executive report delivered.",
    evidence: [],
    formatted: input.mission.formattedDocument,
  };

  const launch = input.supervisor.launchMission({ document, initialState: "preparing" });

  input.supervisor.recordMissionHeartbeat(
    launch.mission.id,
    "repository_inspection",
    `Cursor bridge mission dispatched (${mode})`,
  );

  if (mode === "sdk") {
    return {
      bridgeMissionId: input.mission.bridgeMissionId,
      mode: "sdk",
      dispatched: true,
      supervisorMissionId: launch.mission.id,
      artifactPath: input.mission.artifactPath,
      sdkRunId: `sdk-pending-${launch.mission.id}`,
      message: "Mission dispatched to Cursor Supervisor — SDK handoff when CURSOR_API_KEY configured",
    };
  }

  return {
    bridgeMissionId: input.mission.bridgeMissionId,
    mode: mode === "artifact" ? "artifact" : "dry_run",
    dispatched: launch.launched,
    supervisorMissionId: launch.mission.id,
    artifactPath: input.mission.artifactPath,
    sdkRunId: null,
    message: `Mission artifact written — Cursor handoff at ${input.mission.artifactPath ?? "pending"}`,
  };
}
