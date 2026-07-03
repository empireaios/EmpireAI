/**
 * G6-02 — Cockpit Security & Governance backend contracts.
 */

import type {
  SecurityGovernanceOverview,
  SecurityGovernanceScanResult,
  SecurityGovernanceViolation,
  SecurityGovernanceResultState,
  SecurityRiskEntry,
} from "./security-governance-types.js";

export const COCKPIT_SECURITY_GOVERNANCE_VIEW_ID = "cockpit-security-governance" as const;

export type CockpitSecurityGovernanceView = {
  viewId: typeof COCKPIT_SECURITY_GOVERNANCE_VIEW_ID;
  computedAt: string;
  dataMode: "live";
  securityOverview: SecurityGovernanceOverview;
  governanceStatus: {
    status: SecurityGovernanceResultState;
    score: number;
    label: string;
  };
  securityFindings: SecurityGovernanceViolation[];
  riskRegister: SecurityRiskEntry[];
  certificationStatus: SecurityGovernanceResultState;
  executiveRecommendations: string[];
  lastScan?: Pick<SecurityGovernanceScanResult, "scanId" | "status" | "score" | "scannedAt" | "scanType">;
  discoverySource: "production-certification:security-governance-cockpit";
};

export function buildCockpitSecurityGovernanceView(input: {
  overview: SecurityGovernanceOverview;
  scan?: SecurityGovernanceScanResult;
}): CockpitSecurityGovernanceView {
  const scan = input.scan;
  const allFindings = [
    ...(scan?.securityFindings ?? []),
    ...(scan?.governanceFindings ?? []),
  ];
  return {
    viewId: COCKPIT_SECURITY_GOVERNANCE_VIEW_ID,
    computedAt: new Date().toISOString(),
    dataMode: "live",
    securityOverview: input.overview,
    governanceStatus: {
      status: scan?.status ?? "warning",
      score: scan?.score ?? 0,
      label: scan ? `Governance status ${scan.status}` : "No scan completed",
    },
    securityFindings: allFindings,
    riskRegister: scan?.riskRegister ?? [],
    certificationStatus: scan?.status ?? "warning",
    executiveRecommendations: scan?.executiveRecommendations ?? [],
    lastScan: scan
      ? { scanId: scan.scanId, status: scan.status, score: scan.score, scannedAt: scan.scannedAt, scanType: scan.scanType }
      : undefined,
    discoverySource: "production-certification:security-governance-cockpit",
  };
}
