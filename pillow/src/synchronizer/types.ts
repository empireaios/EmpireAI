/** PILLOW-010 — Repository Synchronizer types. */

import type { RepositoryInspection } from "../recovery/types.js";

export type SyncArtifactKind =
  | "journey"
  | "journey_audit"
  | "empire_status"
  | "empire_decisions"
  | "empire_soul"
  | "bl_a"
  | "bl_b"
  | "bl_c"
  | "ux_enhancement_register"
  | "architecture_decisions"
  | "doctrine"
  | "pillow_contract"
  | "pillow_enhancement_register"
  | "other";

export type SyncChangeKind =
  | "completed_ux_mission"
  | "completed_pillow_mission"
  | "approved_executive_audit"
  | "architecture_change"
  | "governance_change"
  | "new_doctrine"
  | "new_bl_entry"
  | "new_enhancement_entry"
  | "repository_structure"
  | "ownership_change"
  | "drift_signal"
  | "git_modification";

export type SyncApprovalOutcome =
  | "approved"
  | "rejected"
  | "deferred"
  | "request_revision";

export type SyncRequirement = "required" | "optional" | "not_required";

export interface SyncArtifactTarget {
  kind: SyncArtifactKind;
  relativePath: string;
  owner: string;
  label: string;
}

export interface DetectedChange {
  kind: SyncChangeKind;
  summary: string;
  evidence: string[];
  affectedArtifacts: SyncArtifactKind[];
}

export interface SyncProposal {
  proposalId: string;
  artifact: SyncArtifactTarget;
  reason: string;
  changeType: "append" | "update_marker" | "review_only";
  proposedContent: string;
  impactSummary: string;
  requirement: SyncRequirement;
  requiresApproval: boolean;
}

export interface SyncPreview {
  previewId: string;
  generatedAt: string;
  changes: DetectedChange[];
  proposals: SyncProposal[];
  affectedFiles: string[];
  approvalRequired: boolean;
  impactSummary: string;
  inspection: RepositoryInspection;
}

export interface SyncApproval {
  previewId: string;
  outcome: SyncApprovalOutcome;
  decidedAt: string;
  decidedBy: "grand_king" | "supervisor_deferred";
  notes?: string;
}

export interface SyncVerification {
  passed: boolean;
  journeyConsistent: boolean;
  referencesValid: boolean;
  labelsPreserved: boolean;
  integrityOk: boolean;
  issues: string[];
}

export interface SyncRecord {
  recordId: string;
  previewId: string;
  timestamp: string;
  reason: string;
  affectedArtifacts: string[];
  approval: SyncApproval;
  verification: SyncVerification | null;
  executed: boolean;
  dryRun: boolean;
  proposalsApplied: number;
}

export interface SyncRequest {
  trigger?: SyncChangeKind;
  missionId?: string;
  missionTitle?: string;
  auditApproved?: boolean;
  driftSignals?: string[];
}

export interface SyncPreviewResult {
  preview: SyncPreview;
  recommendation: string;
}

export interface SyncExecutionResult {
  record: SyncRecord;
  synchronized: boolean;
  preview: SyncPreview;
  verification: SyncVerification | null;
  recommendation: string;
}

export interface RepositorySynchronizerState {
  synchronizerVersion: "PILLOW-010";
  status: "ready";
  initializedAt: string;
  doctrinePaths: string[];
  totalSyncs: number;
  lastSync: SyncRecord | null;
}

export interface RepositorySynchronizerOptions {
  /** When true, approved sync does not write files (default in session/tests). */
  dryRunExecution?: boolean;
}
