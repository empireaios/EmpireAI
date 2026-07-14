import assert from "node:assert/strict";
import { describe, test } from "node:test";

import { buildFallbackExecutiveIntelligenceCertification } from "../../executive-intelligence-certification/assembler.js";
import { buildFallbackExecutiveDecisionCertification } from "../../executive-decision-certification/assembler.js";
import { buildFallbackFinancialExecutiveCertification } from "../../financial-executive-certification/assembler.js";
import { buildFallbackExecutivePlanningCertification } from "../../executive-planning-certification/assembler.js";
import {
  assembleEnterpriseGovernanceFramework,
  buildFallbackEnterpriseGovernanceFramework,
  GOVERNANCE_PIPELINE,
  GOVERNANCE_PRINCIPLES,
  GOVERNED_GOVERNANCE_DOMAINS,
  GOVERNANCE_ANALYSIS_DOMAINS,
} from "../../enterprise-governance-framework/index.js";

describe("E5-01 Enterprise Governance Framework", () => {
  test("buildFallbackEnterpriseGovernanceFramework returns constitutional governance model", () => {
    const view = buildFallbackEnterpriseGovernanceFramework();
    assert.equal(view.frameworkVersion, "E5-01");
    assert.equal(view.governancePipeline.length, GOVERNANCE_PIPELINE.length);
    assert.deepEqual(view.governancePrinciples, [...GOVERNANCE_PRINCIPLES]);
    assert.equal(view.governedDomains.length, GOVERNED_GOVERNANCE_DOMAINS.length);
    assert.ok(view.governancePolicies.length >= 10);
    assert.ok(view.governanceHierarchy.length >= 5);
    assert.ok(view.authorityStructure.length >= 5);
    assert.ok(view.policyCompliance.length >= 1);
    assert.ok(view.governanceAnalysis.length >= GOVERNANCE_ANALYSIS_DOMAINS.length);
    assert.ok(view.recommendedActions.length >= 1);
    assert.equal(view.readyForE502, true);
    assert.ok(view.integrations.guardianStatus.startsWith("Guardian ·"));
  });

  test("assembleEnterpriseGovernanceFramework integrates E4 E2 E3 programmes", () => {
    const view = assembleEnterpriseGovernanceFramework({
      executiveIntelligenceCertification: buildFallbackExecutiveIntelligenceCertification(),
      executiveDecisionCertification: buildFallbackExecutiveDecisionCertification(),
      financialExecutiveCertification: buildFallbackFinancialExecutiveCertification(),
      executivePlanningCertification: buildFallbackExecutivePlanningCertification(),
      guardian: { status: "monitoring", health: "95/100" },
      journey: { currentMission: "E5-01" },
      supervisor: { status: "monitoring" },
      ecc: { status: "active" },
      vie: { approvalStatus: "validated" },
    });

    assert.equal(view.frameworkVersion, "E5-01");
    assert.ok(view.integrations.executiveIntelligenceProgramme.includes("E4"));
    assert.ok(view.integrations.executiveDecisionEngine.includes("E2"));
    assert.ok(view.integrations.financialExecutiveProgramme.includes("E3"));
    assert.ok(view.integrations.executivePlanningProgramme.includes("E1"));
    assert.ok(view.governancePolicies.every((p) => p.governanceId && p.governanceName && p.evidence.length >= 1));
    assert.equal(view.readyForE502, true);
  });
});
