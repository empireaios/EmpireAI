export {
  ApprovalGateEngine,
  ApprovalGateError,
  ApprovalNotFoundError,
} from "./approval-gate-engine.js";
export { ApprovalQueue } from "./approval-queue.js";
export { ApprovalHistory } from "./approval-history.js";
export {
  canDecide,
  isDryRunOnly,
  requiresCursorBridge,
  validateRegistration,
} from "./approval-policy.js";
export {
  CursorBridgeAdapter,
  CursorBridgeError,
} from "./cursor-bridge-adapter.js";
export {
  CursorHeartbeatService,
  newMissionRecord,
} from "./cursor-heartbeat-service.js";
export { registerPillowApprovalRoutes } from "./routes/pillow-approval-routes.js";
export {
  ensurePillowApprovalTables,
  SqlitePillowApprovalRepository,
} from "./repository/sqlite-pillow-approval-repository.js";
export type {
  ApprovalDecisionOutcome,
  ApprovalHistoryEntry,
  ApprovalProposalPayload,
  ApprovalRequest,
  ApprovalStatus,
  ApprovalType,
  CursorBridgePhase,
  CursorBridgeStatus,
  CursorMissionRecord,
  CursorPresenceState,
  DecideApprovalInput,
  DispatchCursorMissionInput,
  DispatchHistoryEntry,
  RecoveryHistoryEntry,
  RegisterApprovalInput,
} from "./types.js";
