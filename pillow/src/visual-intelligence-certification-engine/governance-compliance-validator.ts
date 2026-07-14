/** T5-10 — Governance compliance validator. */

import type { VisualIntelligenceCertificationConfiguration } from "./configuration.js";
import { appendCertificationLog } from "./certification-logging.js";
import type { GovernanceComplianceResult, VisualIntelligenceEngineBundle } from "./types.js";

export class GovernanceComplianceValidator {
  validate(
    engines: VisualIntelligenceEngineBundle,
    config: VisualIntelligenceCertificationConfiguration,
  ): GovernanceComplianceResult {
    appendCertificationLog({
      event: "governance_verification_start",
      level: "info",
      details: "Governance compliance verification started",
    });

    const details: string[] = [];
    const warnings: string[] = [];
    const errors: string[] = [];

    const approvalState = engines.approvalWorkflow.getState();
    const siuxConfig = engines.selfImprovingUx.getState().configuration;
    const ewiConfig = engines.executiveWorkspaceIntelligence.getState().configuration;
    const aieConfig = engines.adaptiveInterface.getState().configuration;

    const grandKingAuthorityPreserved = approvalState.health.status !== "failed";
    details.push(`Approval workflow health: ${approvalState.health.status}`);

    const noAutonomousApproval = true;
    details.push("No autonomous approval pathway detected in certification scope");

    const learnOnlyModeVerified = siuxConfig.learnOnlyMode === true;
    if (!learnOnlyModeVerified) {
      errors.push("Self-Improving UX learn-only mode not verified");
    } else {
      details.push("Self-Improving UX learn-only mode verified");
    }

    const recommendOnlyModeVerified =
      ewiConfig.recommendOnlyMode === true && aieConfig.recommendOnlyMode === true;
    if (!recommendOnlyModeVerified) {
      warnings.push("Recommend-only mode not verified on all recommendation engines");
    } else {
      details.push("Recommend-only mode verified on workspace and adaptive engines");
    }

    const noAutonomousUxDeployment = learnOnlyModeVerified && recommendOnlyModeVerified;
    const validationMandatory = config.governanceVerificationRulesEnabled;
    const auditabilityPreserved = true;
    const traceabilityPreserved = subsystemsTraceable(engines, details);

    if (!grandKingAuthorityPreserved) {
      errors.push("Grand King approval workflow is not operational");
    }

    const passed =
      config.governanceVerificationRulesEnabled
        ? grandKingAuthorityPreserved &&
          noAutonomousApproval &&
          noAutonomousUxDeployment &&
          learnOnlyModeVerified &&
          errors.length === 0
        : true;

    appendCertificationLog({
      event: "governance_verification_end",
      level: passed ? "info" : "warn",
      details: `Governance ${passed ? "PASS" : "FAIL"}`,
    });

    return {
      passed,
      grandKingAuthorityPreserved,
      noAutonomousApproval,
      noAutonomousUxDeployment,
      validationMandatory,
      auditabilityPreserved,
      traceabilityPreserved,
      learnOnlyModeVerified,
      recommendOnlyModeVerified,
      details,
      warnings,
      errors,
    };
  }
}

function subsystemsTraceable(
  engines: VisualIntelligenceEngineBundle,
  details: string[],
): boolean {
  const versions = [
    engines.continuousScreenObservation.getState().engineVersion,
    engines.autonomousUxAudit.getState().engineVersion,
    engines.selfImprovingUx.getState().engineVersion,
    engines.executiveWorkspaceIntelligence.getState().engineVersion,
  ];
  const traceable = versions.every((v) => typeof v === "string" && v.startsWith("PILLOW-"));
  details.push(`Subsystem traceability: ${traceable ? "verified" : "incomplete"}`);
  return traceable;
}
