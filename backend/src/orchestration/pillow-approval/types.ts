/** PILLOW-017 — Approval Gate + Cursor Bridge types. */

export type ApprovalType =
  | "repository_write"
  | "cursor_mission_execution"
  | "file_generation"
  | "executive_audit_generation"
  | "runtime_operation";

export type ApprovalStatus =
  | "Pending"
  | "Approved"
  | "Rejected"
  | "Expired"
  | "Cancelled";

export type ApprovalDecisionOutcome = "Approved" | "Rejected" | "Cancelled";

export type ObjectiveAlignmentStatus =
  | "objective_aligned"
  | "deferred_not_aligned"
  | "requires_grand_king_override"
  | "blocked_by_current_objective";

export interface ApprovalProposalPayload {
  title: string;
  summary: string;
  ownerRoute?: string;
  evidence?: string[];
  missionId?: string;
  targetPaths?: string[];
  metadata?: Record<string, unknown>;
  objectiveAlignment?: ObjectiveAlignmentStatus;
}

export interface ApprovalRequest {
  approvalId: string;
  workspaceId: string;
  type: ApprovalType;
  status: ApprovalStatus;
  proposal: ApprovalProposalPayload;
  requestedBy: string;
  correlationId: string;
  createdAt: string;
  updatedAt: string;
  expiresAt: string;
  decidedAt: string | null;
  decidedBy: string | null;
  decisionNotes: string | null;
  linkedMissionId: string | null;
}

export interface ApprovalHistoryEntry {
  historyId: string;
  approvalId: string;
  workspaceId: string;
  action: "registered" | "decided" | "expired" | "dispatched";
  status: ApprovalStatus;
  actor: string;
  notes: string | null;
  timestamp: string;
  metadata: Record<string, unknown>;
}

export type CursorBridgePhase =
  | "queued"
  | "dispatched"
  | "running"
  | "idle"
  | "completed"
  | "failed"
  | "timeout"
  | "recovery";

export type CursorPresenceState =
  | "CursorOnline"
  | "CursorOffline"
  | "MissionRunning"
  | "MissionIdle"
  | "MissionFailed"
  | "MissionCompleted";

export interface CursorMissionRecord {
  missionId: string;
  workspaceId: string;
  approvalId: string | null;
  phase: CursorBridgePhase;
  presence: CursorPresenceState;
  title: string;
  artifactPath: string | null;
  dryRun: boolean;
  dispatchedAt: string | null;
  completedAt: string | null;
  lastHeartbeatAt: string | null;
  lastError: string | null;
  recoveryAttempts: number;
  createdAt: string;
  updatedAt: string;
}

export interface DispatchHistoryEntry {
  dispatchId: string;
  missionId: string;
  workspaceId: string;
  approvalId: string | null;
  actor: string;
  dryRun: boolean;
  artifactPath: string | null;
  result: "queued" | "dispatched" | "failed";
  timestamp: string;
  metadata: Record<string, unknown>;
}

export interface RecoveryHistoryEntry {
  recoveryId: string;
  missionId: string;
  workspaceId: string;
  trigger: "timeout" | "failure" | "stall" | "manual";
  outcome: "triggered" | "recovered" | "failed";
  timestamp: string;
  metadata: Record<string, unknown>;
}

export interface CursorBridgeStatus {
  presence: CursorPresenceState;
  cursorOnline: boolean;
  activeMissionId: string | null;
  activePhase: CursorBridgePhase | null;
  lastHeartbeatAt: string | null;
  queuedCount: number;
  runningCount: number;
  completedCount: number;
  failedCount: number;
  dryRunLaunch: boolean;
  missionId: "PILLOW-017";
}

export interface RegisterApprovalInput {
  workspaceId: string;
  type: ApprovalType;
  proposal: ApprovalProposalPayload;
  requestedBy: string;
  correlationId: string;
  ttlHours?: number;
}

export interface DecideApprovalInput {
  approvalId: string;
  workspaceId: string;
  outcome: ApprovalDecisionOutcome;
  actor: string;
  notes?: string;
  correlationId: string;
}

export interface DispatchCursorMissionInput {
  workspaceId: string;
  approvalId?: string;
  missionId?: string;
  actor: string;
  correlationId: string;
  dryRun?: boolean;
  grandKingOverride?: boolean;
}
