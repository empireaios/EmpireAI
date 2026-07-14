import assert from "node:assert/strict";
import { describe, test } from "node:test";

import { buildFallbackEnterpriseGovernanceFramework } from "../../enterprise-governance-framework/assembler.js";
import { buildFallbackExecutiveConstitutionalMonitor } from "../../executive-constitutional-monitor/assembler.js";
import { buildFallbackEnterpriseAuditEngine } from "../../enterprise-audit-engine/assembler.js";
import { buildFallbackExecutiveComplianceEngine } from "../../executive-compliance-engine/assembler.js";
import { buildFallbackExecutiveEthicsEngine } from "../../executive-ethics-engine/assembler.js";
import { buildFallbackExecutiveAccountabilityEngine } from "../../executive-accountability-engine/assembler.js";
import { buildFallbackExecutiveTransparencyEngine } from "../../executive-transparency-engine/assembler.js";
import { buildFallbackExecutiveExceptionManager } from "../../executive-exception-manager/assembler.js";
import { buildFallbackEnterpriseRiskGovernance } from "../../enterprise-risk-governance/assembler.js";
import { buildFallbackExecutiveReviewBoard } from "../../executive-review-board/assembler.js";
import { buildFallbackExecutivePolicyEvolution } from "../../executive-policy-evolution/assembler.js";
import { buildFallbackExecutiveTrustEngine } from "../../executive-trust-engine/assembler.js";
import { buildFallbackEnterpriseConstitutionalGuardian } from "../../enterprise-constitutional-guardian/assembler.js";
import { buildFallbackExecutiveResilienceEngine } from "../../executive-resilience-engine/assembler.js";
import { buildFallbackGrandKingExecutiveCockpit } from "../../grand-king-executive-cockpit/assembler.js";
import {
  assembleExecutiveGovernanceCertification,
  buildFallbackExecutiveGovernanceCertification,
  EGOC_CERTIFICATION_GATES,
  EGOC_CERTIFICATION_SCOPE,
  EGOC_CERTIFICATION_VALIDATIONS,
} from "../../executive-governance-certification/index.js";

describe("E5-16 Executive Governance Certification", () => {
  test("buildFallbackExecutiveGovernanceCertification certifies E5 programme", () => {
    const view = buildFallbackExecutiveGovernanceCertification();
    assert.equal(view.architectureVersion, "E5-16");
    assert.equal(view.certificationScope.length, EGOC_CERTIFICATION_SCOPE.length);
    assert.equal(view.certificationGates.length, EGOC_CERTIFICATION_GATES.length);
    assert.equal(view.certificationValidations.length, EGOC_CERTIFICATION_VALIDATIONS.length);
    assert.equal(view.programmeCertified, true);
    assert.equal(view.phaseE5Completed, true);
    assert.equal(view.executiveGovernanceCertified, true);
    assert.equal(view.allGatesPassed, true);
    assert.equal(view.gatesPassed, 17);
    assert.equal(view.criticalDefectCount, 0);
    assert.equal(view.readyForE601, true);
    assert.equal(view.nextMission, "E6-01 Enterprise Learning Framework");
  });

  test("assembleExecutiveGovernanceCertification validates full E5 integration", () => {
    const view = assembleExecutiveGovernanceCertification({
      enterpriseGovernanceFramework: buildFallbackEnterpriseGovernanceFramework(),
      executiveConstitutionalMonitor: buildFallbackExecutiveConstitutionalMonitor(),
      enterpriseAuditEngine: buildFallbackEnterpriseAuditEngine(),
      executiveComplianceEngine: buildFallbackExecutiveComplianceEngine(),
      executiveEthicsEngine: buildFallbackExecutiveEthicsEngine(),
      executiveAccountabilityEngine: buildFallbackExecutiveAccountabilityEngine(),
      executiveTransparencyEngine: buildFallbackExecutiveTransparencyEngine(),
      executiveExceptionManager: buildFallbackExecutiveExceptionManager(),
      enterpriseRiskGovernance: buildFallbackEnterpriseRiskGovernance(),
      executiveReviewBoard: buildFallbackExecutiveReviewBoard(),
      executivePolicyEvolution: buildFallbackExecutivePolicyEvolution(),
      executiveTrustEngine: buildFallbackExecutiveTrustEngine(),
      enterpriseConstitutionalGuardian: buildFallbackEnterpriseConstitutionalGuardian(),
      executiveResilienceEngine: buildFallbackExecutiveResilienceEngine(),
      grandKingExecutiveCockpit: buildFallbackGrandKingExecutiveCockpit(),
      journey: { currentMission: "E5 Executive Governance Certified" },
      supervisor: { status: "monitoring" },
      ecc: { status: "active" },
      vie: { approvalStatus: "validated" },
    });

    assert.equal(view.architectureVersion, "E5-16");
    assert.ok(view.certificationScope.every((s) => s.status === "certified"));
    assert.ok(view.certificationGates.every((g) => g.result === "PASS"));
    assert.ok(view.executiveQualityReview.length >= 9);
    assert.ok(view.integrationValidations.every((v) => v.verified));
    assert.equal(view.defects.length, 0);
  });

  test("every certification gate maps to E5 subsystem", () => {
    const view = buildFallbackExecutiveGovernanceCertification();
    assert.equal(view.certificationGates[0]?.label, "Enterprise Governance Framework Complete");
    assert.equal(view.certificationGates[14]?.label, "Grand King Executive Cockpit Complete");
    assert.equal(view.certificationGates[15]?.label, "Repository Integrity Preserved");
    assert.equal(view.certificationGates[16]?.label, "Constitutional Compliance Confirmed");
  });
});
