/** PILLOW-CB-001 — Autonomous Cursor Bridge types (Phase 5). */

export type BridgeInstructionKind =
  | "ux_change"
  | "deployment"
  | "investigation"
  | "cursor_review"
  | "architecture"
  | "release"
  | "generic_engineering";

export type DispatchMode = "dry_run" | "artifact" | "sdk";

export type LogSource =
  | "build"
  | "typecheck"
  | "test"
  | "railway"
  | "vercel"
  | "github"
  | "browser";

export interface BridgeInstruction {
  rawInstruction: string;
  kind: BridgeInstructionKind;
  summary: string;
  keywords: string[];
}

export interface EngineeringTask {
  order: number;
  action: string;
  files: string[];
}

export interface AutonomousEngineeringMission {
  bridgeMissionId: string;
  title: string;
  objective: string;
  instruction: BridgeInstruction;
  requiredFiles: string[];
  tasks: EngineeringTask[];
  acceptanceCriteria: string[];
  validationSteps: string[];
  deploymentSteps: string[];
  riskSummary: string;
  cursorPrompt: string;
  formattedDocument: string;
  artifactPath: string | null;
}

export interface DispatchResult {
  bridgeMissionId: string;
  mode: DispatchMode;
  dispatched: boolean;
  supervisorMissionId: string | null;
  artifactPath: string | null;
  sdkRunId: string | null;
  message: string;
}

export interface LogInterpretation {
  source: LogSource;
  success: boolean;
  errors: string[];
  warnings: string[];
  summary: string;
  exitCode: number | null;
}

export interface BridgeValidationResult {
  passed: boolean;
  buildOk: boolean;
  deploymentOk: boolean;
  browserOk: boolean;
  cursorReviewOk: boolean;
  businessWorkflowOk: boolean;
  findings: string[];
  blockers: string[];
}

export interface ExecutiveBridgeReport {
  version: "PILLOW-CB-001";
  generatedAt: string;
  instruction: string;
  missionTitle: string;
  dispatchMode: DispatchMode;
  validation: BridgeValidationResult;
  logSummaries: LogInterpretation[];
  certificationDecision: "complete" | "conditional" | "failed";
  executiveSummary: string;
  nextActions: string[];
}

export interface BridgeProcessResult {
  bridgeMissionId: string;
  analyzedAt: string;
  durationMs: number;
  instruction: BridgeInstruction;
  mission: AutonomousEngineeringMission;
  dispatch: DispatchResult;
  validation: BridgeValidationResult | null;
  report: ExecutiveBridgeReport | null;
  executiveBrief: string;
}

export interface CursorBridgeState {
  bridgeVersion: "PILLOW-CB-001";
  status: "ready";
  initializedAt: string;
  totalMissions: number;
  totalDispatches: number;
  sdkAvailable: boolean;
  defaultDispatchMode: DispatchMode;
}
