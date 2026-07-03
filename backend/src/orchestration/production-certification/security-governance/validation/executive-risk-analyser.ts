/**
 * G6-02 — Executive risk analyser.
 */

import type { SecurityGovernanceViolation, SecurityRiskEntry } from "../contracts/security-governance-types.js";

export function analyseExecutiveRisks(input: {
  securityFindings: SecurityGovernanceViolation[];
  governanceFindings: SecurityGovernanceViolation[];
  credentialExposures: SecurityGovernanceViolation[];
  workspaceViolations: SecurityGovernanceViolation[];
  pluginViolations: SecurityGovernanceViolation[];
}): { riskRegister: SecurityRiskEntry[]; executiveRecommendations: string[] } {
  const allFindings = [
    ...input.securityFindings,
    ...input.governanceFindings,
    ...input.credentialExposures,
    ...input.workspaceViolations,
    ...input.pluginViolations,
  ];

  const riskRegister: SecurityRiskEntry[] = allFindings
    .filter((f) => f.severity === "critical" || f.severity === "high" || f.severity === "medium")
    .map((finding) => ({
      riskId: `risk-${finding.violationId}`,
      ruleId: finding.ruleId,
      securityDomain: finding.securityDomain,
      severity: finding.severity,
      summary: finding.message,
      mitigation: finding.recommendation,
    }));

  const recommendations = new Set<string>();
  if (input.credentialExposures.length > 0) {
    recommendations.add("Remediate credential exposure findings before production deployment");
  }
  if (input.workspaceViolations.length > 0) {
    recommendations.add("Enforce workspace isolation across all certification operations");
  }
  if (input.pluginViolations.length > 0) {
    recommendations.add("Review plugin trust manifests and disable untrusted plugins");
  }
  if (input.governanceFindings.some((f) => f.severity === "critical")) {
    recommendations.add("Resolve critical governance violations through Pillow authority");
  }
  if (riskRegister.length === 0) {
    recommendations.add("Platform satisfies constitutional security model — proceed with remaining G6 domains");
  }

  return {
    riskRegister,
    executiveRecommendations: [...recommendations],
  };
}
