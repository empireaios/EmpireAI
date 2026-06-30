export {
  RepositorySynchronizerEngine,
  createRepositorySynchronizerEngine,
  SYNC_DOCTRINE_PATHS,
} from "./engine.js";
export { detectChanges } from "./change-detector.js";
export { generateSyncPreview, previewTouchesGovernance } from "./preview.js";
export {
  validateApproval,
  canExecuteSync,
  createApproval,
  approvalRecommendation,
} from "./approval-gate.js";
export { applyApprovedSync } from "./executor.js";
export { verifySynchronization } from "./verifier.js";
export {
  SYNC_ARTIFACT_CATALOG,
  findSyncTarget,
  findSyncTargetByPath,
  allSyncPaths,
} from "./scope.js";
export type {
  SyncArtifactKind,
  SyncChangeKind,
  SyncApprovalOutcome,
  SyncRequirement,
  SyncArtifactTarget,
  DetectedChange,
  SyncProposal,
  SyncPreview,
  SyncApproval,
  SyncVerification,
  SyncRecord,
  SyncRequest,
  SyncPreviewResult,
  SyncExecutionResult,
  RepositorySynchronizerState,
  RepositorySynchronizerOptions,
} from "./types.js";
