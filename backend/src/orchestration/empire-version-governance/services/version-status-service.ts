/**
 * EmpireAI version status — Pillow-facing current released vs working version awareness.
 */

import {
  EMPIREAI_VERSION_1_0,
  EMPIREAI_VERSION_1_0_DISPLAY,
  EMPIREAI_WORKING_VERSION_LABEL,
  type EmpireVersionStatusReport,
} from "../contracts/version-governance-types.js";
import { createEmpireVersion1Certification } from "./version-1-certification-service.js";
import { getVersionHistory } from "./version-history-service.js";
import { listPendingVersionRecommendations } from "./version-lock-service.js";
import { searchVersionGovernanceEklsObservations } from "../ekls/version-governance-ekls-integration.js";

export function buildEmpireVersionStatusReport(input: {
  validationSuitePass: boolean;
  backendTypecheckPass: boolean;
  frontendTypecheckPass: boolean;
}): EmpireVersionStatusReport {
  const certification = createEmpireVersion1Certification(input);
  const history = getVersionHistory();
  const recommendations = listPendingVersionRecommendations();

  const eklsCertifications = searchVersionGovernanceEklsObservations({
    kind: "version_certification",
    pillowGovernance: true,
  });
  const eklsAudits = searchVersionGovernanceEklsObservations({
    kind: "version_executive_audit",
    pillowGovernance: true,
  });
  const eklsReleases = searchVersionGovernanceEklsObservations({
    kind: "version_release",
    pillowGovernance: true,
  });

  return {
    currentVersion: EMPIREAI_VERSION_1_0_DISPLAY,
    currentVersionSemver: EMPIREAI_VERSION_1_0,
    status: certification.status === "LOCKED" ? "LOCKED" : "NOT_CERTIFIED",
    productionStatus: certification.productionStatus,
    workingVersion: EMPIREAI_WORKING_VERSION_LABEL,
    unreleasedCompletedWork: [],
    pendingVersionRecommendations: [...recommendations],
    versionHistoryCount: history.length,
    releaseHistoryCount: eklsReleases.length > 0 ? eklsReleases.length : 1,
    certificationHistoryCount: eklsCertifications.length > 0 ? eklsCertifications.length : 1,
    executiveAuditHistoryCount: eklsAudits.length > 0 ? eklsAudits.length : 1,
    generatedAt: new Date().toISOString(),
  };
}
