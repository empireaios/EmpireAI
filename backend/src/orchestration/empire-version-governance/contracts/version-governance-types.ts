/**
 * EmpireAI Version Governance — canonical Version 1.0 lock types (governance only).
 */

export const EMPIRE_VERSION_GOVERNANCE_MODULE_ID = "empire-version-governance" as const;
export const EMPIRE_VERSION_GOVERNANCE_MISSION_ID = "V1-LOCK" as const;

export const EMPIREAI_VERSION_1_0 = "1.0.0" as const;
export const EMPIREAI_VERSION_1_0_DISPLAY = "EmpireAI Version 1.0" as const;
export const EMPIREAI_WORKING_VERSION_LABEL = "Version 1.x Development" as const;

export const EMPIRE_VERSION_STATUSES = ["LOCKED", "RELEASED", "DRAFT", "SUPERSEDED"] as const;
export type EmpireVersionStatus = (typeof EMPIRE_VERSION_STATUSES)[number];

export const EMPIRE_PRODUCTION_STATUSES = ["ACTIVE", "INACTIVE", "PENDING"] as const;
export type EmpireProductionStatus = (typeof EMPIRE_PRODUCTION_STATUSES)[number];

export const EMPIRE_VERSION_READINESS_RATINGS = [
  "PASS",
  "PASS_WITH_CONDITIONS",
  "FAIL",
] as const;
export type EmpireVersionReadinessRating = (typeof EMPIRE_VERSION_READINESS_RATINGS)[number];

export const EMPIRE_V1_CERTIFIED_PROGRAMMES = [
  "G0",
  "G1",
  "G2",
  "G3",
  "G4",
  "G5",
  "G6",
  "G7",
  "G8",
  "V1-ACTIVATION",
  "V1-LOCK",
] as const;
export type EmpireV1CertifiedProgramme = (typeof EMPIRE_V1_CERTIFIED_PROGRAMMES)[number];

export const VERSION_GOVERNANCE_EKLS_KINDS = [
  "version_certification",
  "version_lock",
  "version_history",
  "version_recommendation",
  "version_executive_audit",
  "version_release",
] as const;
export type VersionGovernanceEklsKind = (typeof VERSION_GOVERNANCE_EKLS_KINDS)[number];

export const FUTURE_VERSION_ARTIFACT_REQUIREMENTS = [
  "release_notes",
  "executive_audit",
  "version_report",
  "certification_summary",
  "change_summary",
] as const;
export type FutureVersionArtifactRequirement = (typeof FUTURE_VERSION_ARTIFACT_REQUIREMENTS)[number];

export type VersionSnapshotKind =
  | "repository"
  | "architecture"
  | "registry"
  | "brain"
  | "pillow"
  | "cockpit"
  | "ekls"
  | "production_configuration"
  | "certification";

export type VersionSnapshotRecord = {
  snapshotId: string;
  kind: VersionSnapshotKind;
  version: typeof EMPIREAI_VERSION_1_0;
  summary: string;
  baselineHash: string;
  recordedAt: string;
  logicalOnly: true;
};

export type EmpireVersion1Certification = {
  version: typeof EMPIREAI_VERSION_1_0;
  displayName: typeof EMPIREAI_VERSION_1_0_DISPLAY;
  missionId: typeof EMPIRE_VERSION_GOVERNANCE_MISSION_ID;
  status: "LOCKED" | "NOT_CERTIFIED";
  readinessRating: EmpireVersionReadinessRating;
  productionStatus: EmpireProductionStatus;
  releaseDate: string;
  programmesComplete: readonly EmpireV1CertifiedProgramme[];
  validationSuitePass: boolean;
  backendTypecheckPass: boolean;
  frontendTypecheckPass: boolean;
  repositoryIntegrityPass: boolean;
  architectureIntegrityPass: boolean;
  productionEligible: boolean;
  blockers: string[];
  conditions: string[];
  certifiedAt: string;
  baselineHash: string;
};

export type VersionHistoryEntry = {
  entryNumber: number;
  version: string;
  displayName: string;
  status: EmpireVersionStatus;
  releaseDate: string;
  missionId: string;
  appendOnly: true;
  recordedAt: string;
};

export type VersionLockRecord = {
  version: typeof EMPIREAI_VERSION_1_0;
  locked: true;
  lockedAt: string;
  authorizedBy: "grand-king";
  baselineHash: string;
  futureChangesPolicy: string;
  immutable: true;
};

export type VersionRecommendation = {
  recommendationId: string;
  suggestedVersion: string;
  summary: string;
  recommendedBy: "pillow";
  status: "pending" | "accepted" | "rejected";
  autoCreated: false;
  recommendedAt: string;
};

export type EmpireVersionStatusReport = {
  currentVersion: typeof EMPIREAI_VERSION_1_0_DISPLAY;
  currentVersionSemver: typeof EMPIREAI_VERSION_1_0;
  status: "LOCKED" | "NOT_CERTIFIED";
  productionStatus: EmpireProductionStatus;
  workingVersion: typeof EMPIREAI_WORKING_VERSION_LABEL;
  unreleasedCompletedWork: string[];
  pendingVersionRecommendations: VersionRecommendation[];
  versionHistoryCount: number;
  releaseHistoryCount: number;
  certificationHistoryCount: number;
  executiveAuditHistoryCount: number;
  generatedAt: string;
};

export type EmpireVersion1LockReport = {
  version: typeof EMPIREAI_VERSION_1_0;
  lock: VersionLockRecord;
  certification: EmpireVersion1Certification;
  snapshots: VersionSnapshotRecord[];
  historyEntry: VersionHistoryEntry;
  doctrineEnforced: true;
  generatedAt: string;
  correlationId: string;
};
