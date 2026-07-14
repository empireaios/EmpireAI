import assert from "node:assert/strict";
import { describe, test } from "node:test";

import { buildFallbackEnterpriseGovernanceFramework } from "../../enterprise-governance-framework/assembler.js";
import { buildFallbackExecutiveConstitutionalMonitor } from "../../executive-constitutional-monitor/assembler.js";
import { buildFallbackEnterpriseAuditEngine } from "../../enterprise-audit-engine/assembler.js";
import { buildFallbackExecutiveComplianceEngine } from "../../executive-compliance-engine/assembler.js";
import { buildFallbackExecutiveEthicsEngine } from "../../executive-ethics-engine/assembler.js";
import { buildFallbackExecutiveAccountabilityEngine } from "../../executive-accountability-engine/assembler.js";
import { buildFallbackExecutiveIntelligenceCertification } from "../../executive-intelligence-certification/assembler.js";
import { buildFallbackExecutiveDecisionCertification } from "../../executive-decision-certification/assembler.js";
import { buildFallbackFinancialExecutiveCertification } from "../../financial-executive-certification/assembler.js";
import {
  assembleExecutiveTransparencyEngine,
  buildFallbackExecutiveTransparencyEngine,
  EXECUTIVE_TRANSPARENCY_PIPELINE,
  TRANSPARENCY_PRINCIPLES,
  GOVERNED_TRANSPARENCY_DOMAINS,
  TRANSPARENCY_ANALYSIS_DOMAINS,
} from "../../executive-transparency-engine/index.js";

describe("E5-07 Executive Transparency Engine", () => {
  test("buildFallbackExecutiveTransparencyEngine returns constitutional transparency model", () => {
    const view = buildFallbackExecutiveTransparencyEngine();
    assert.equal(view.engineVersion, "E5-07");
    assert.equal(view.executiveTransparencyPipeline.length, EXECUTIVE_TRANSPARENCY_PIPELINE.length);
    assert.deepEqual(view.transparencyPrinciples, [...TRANSPARENCY_PRINCIPLES]);
    assert.equal(view.governedDomains.length, GOVERNED_TRANSPARENCY_DOMAINS.length);
    assert.ok(view.transparencyRecords.length >= 10);
    assert.ok(view.executiveActivityFeed.length >= 10);
    assert.ok(view.governanceTimeline.length >= 2);
    assert.ok(view.decisionTimeline.length >= 1);
    assert.ok(view.transparencyAnalysis.length >= TRANSPARENCY_ANALYSIS_DOMAINS.length);
    assert.ok(view.recommendedActions.length >= 1);
    assert.equal(view.readyForE508, true);
    assert.ok(view.integrations.guardianStatus.startsWith("Guardian ·"));
  });

  test("assembleExecutiveTransparencyEngine integrates E5-01 E5-02 E5-03 E5-04 E5-05 E5-06", () => {
    const view = assembleExecutiveTransparencyEngine({
      enterpriseGovernanceFramework: buildFallbackEnterpriseGovernanceFramework(),
      executiveConstitutionalMonitor: buildFallbackExecutiveConstitutionalMonitor(),
      enterpriseAuditEngine: buildFallbackEnterpriseAuditEngine(),
      executiveComplianceEngine: buildFallbackExecutiveComplianceEngine(),
      executiveEthicsEngine: buildFallbackExecutiveEthicsEngine(),
      executiveAccountabilityEngine: buildFallbackExecutiveAccountabilityEngine(),
      executiveIntelligenceCertification: buildFallbackExecutiveIntelligenceCertification(),
      executiveDecisionCertification: buildFallbackExecutiveDecisionCertification(),
      financialExecutiveCertification: buildFallbackFinancialExecutiveCertification(),
      guardian: { status: "monitoring", health: "95/100" },
      journey: { currentMission: "E5-07" },
      supervisor: { status: "monitoring" },
      ecc: { status: "active" },
      vie: { approvalStatus: "validated" },
    });

    assert.equal(view.engineVersion, "E5-07");
    assert.ok(view.integrations.enterpriseGovernanceFramework.includes("E5-01"));
    assert.ok(view.integrations.executiveConstitutionalMonitor.includes("E5-02"));
    assert.ok(view.integrations.enterpriseAuditEngine.includes("E5-03"));
    assert.ok(view.integrations.executiveComplianceEngine.includes("E5-04"));
    assert.ok(view.integrations.executiveEthicsEngine.includes("E5-05"));
    assert.ok(view.integrations.executiveAccountabilityEngine.includes("E5-06"));
    assert.ok(view.transparencyRecords.every((r) => r.transparencyId && r.supportingEvidence.length >= 1));
    assert.equal(view.readyForE508, true);
  });
});
