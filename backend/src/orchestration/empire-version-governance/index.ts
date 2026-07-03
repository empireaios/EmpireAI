/**
 * EmpireAI Version Governance — Version 1.0 lock public surface.
 */

export {
  EMPIRE_VERSION_GOVERNANCE_MODULE_ID,
  EMPIRE_VERSION_GOVERNANCE_MISSION_ID,
  EMPIREAI_VERSION_1_0,
  EMPIREAI_VERSION_1_0_DISPLAY,
  EMPIREAI_WORKING_VERSION_LABEL,
  EMPIRE_VERSION_STATUSES,
  EMPIRE_PRODUCTION_STATUSES,
  EMPIRE_VERSION_READINESS_RATINGS,
  EMPIRE_V1_CERTIFIED_PROGRAMMES,
  VERSION_GOVERNANCE_EKLS_KINDS,
  FUTURE_VERSION_ARTIFACT_REQUIREMENTS,
  type EmpireVersionStatus,
  type EmpireProductionStatus,
  type EmpireVersionReadinessRating,
  type EmpireV1CertifiedProgramme,
  type VersionGovernanceEklsKind,
  type FutureVersionArtifactRequirement,
  type VersionSnapshotKind,
  type VersionSnapshotRecord,
  type EmpireVersion1Certification,
  type VersionHistoryEntry,
  type VersionLockRecord,
  type VersionRecommendation,
  type EmpireVersionStatusReport,
  type EmpireVersion1LockReport,
} from "./contracts/version-governance-types.js";

export {
  VERSION_LOCK_DOCTRINE_ID,
  VERSION_LOCK_DOCTRINE_RULES,
  GRAND_KING_VERSION_LOCK_AUTHORITY,
  VERSION_LOCK_FUTURE_CHANGES_POLICY,
  PILLOW_VERSION_RECOMMENDATION_POLICY,
  FUTURE_VERSION_EXAMPLES,
  evaluateVersionLockAuthorization,
  type VersionLockAuthorizationInput,
  type VersionLockAuthorizationResult,
} from "./doctrine/version-lock-doctrine.js";

export {
  EMPIRE_V1_RELEASE_DATE,
  EMPIRE_V1_LOCK_CONDITIONS,
  createEmpireVersion1Certification,
  assessEmpireVersion1Certification,
} from "./services/version-1-certification-service.js";

export { buildVersion1SnapshotMetadata } from "./services/version-snapshot-service.js";

export {
  getVersionHistory,
  getVersionHistoryEntry,
  getVersion1HistoryEntry,
  appendVersionHistoryEntry,
  resetVersionHistoryForTests,
} from "./services/version-history-service.js";

export {
  authorizeEmpireVersion1Lock,
  buildEmpireVersion1LockReport,
  recommendFutureVersion,
  listPendingVersionRecommendations,
  resetVersionLockHarnessForTests,
  assertLockedVersionImmutable,
} from "./services/version-lock-service.js";

export { buildEmpireVersionStatusReport } from "./services/version-status-service.js";

export {
  validateVersionGovernancePillowGovernance,
  buildVersionGovernancePillowContext,
  type VersionGovernancePillowContext,
  type VersionGovernancePillowResult,
} from "./governance/version-governance-pillow-governance.js";

export {
  recordVersionGovernanceEklsObservation,
  searchVersionGovernanceEklsObservations,
  listVersionGovernanceEklsKinds,
  recordEmpireVersion1EklsBaseline,
  resetVersionGovernanceObservationsForTests,
} from "./ekls/version-governance-ekls-integration.js";

export { versionGovernanceTools } from "./tools/version-governance-tools.js";
