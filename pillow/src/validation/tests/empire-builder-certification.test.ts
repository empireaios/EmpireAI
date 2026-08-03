import assert from "node:assert/strict";
import path from "node:path";
import { beforeEach, describe, test } from "node:test";
import { runBootstrap } from "../../bootstrap/engine.js";
import {
  CERTIFICATION_LEVELS,
  EBC_CAPABILITIES,
  EMPIRE_BUILDER_COMPONENTS,
  EMPIRE_BUILDER_FACTORY_VERSION,
  INTEGRATION_DOMAINS,
  PLANNING_GOVERNANCE_RULES,
  buildEmpireBuilderCertificationConfiguration,
  createEmpireBuilderCertification,
  resetEmpireBuilderCertificationForTesting,
} from "../../empire-builder-certification/index.js";

const REPO_ROOT = path.resolve(import.meta.dirname, "..", "..", "..", "..");

async function build(config?: Parameters<typeof createEmpireBuilderCertification>[1]) {
  const bootstrap = await runBootstrap({ repositoryRoot: REPO_ROOT, skipHeavyScans: true });
  const engine = createEmpireBuilderCertification(bootstrap, config);
  await engine.initialize();
  engine.connectEmpireBuilderCertification();
  return engine;
}

const endToEndInput = {
  originalGrandKingCommand:
    "Build a lean commerce business for local retailers using Shopify",
  businessBuildMissionId: "bbm-commerce-01",
  intentId: "bii-intent-bbm-commerce-01",
  businessModelId: "emg-model-bbm-commerce-01",
  marketResearchReportId: "mrw-report-bbm-commerce-01",
  opportunityEvaluationId: "oew-eval-bbm-commerce-01",
  businessBlueprintId: "bbw-blueprint-bbm-commerce-01",
  launchPlanId: "lpw-plan-bbm-commerce-01",
  businessRiskReportId: "brw-report-bbm-commerce-01",
  approvalPackId: "bap-pack-bbm-commerce-01",
  executiveReportIds: ["ert-bap-001", "ert-brw-001"],
  validated: true,
};

describe("Q2-10 Empire Builder Certification", () => {
  beforeEach(resetEmpireBuilderCertificationForTesting);

  test("1 locks mandatory empire-builder-certification boundaries", () => {
    const c = buildEmpireBuilderCertificationConfiguration(REPO_ROOT, {
      neverExecuteBusinessImplementation: false as never,
      neverModifyFactoryComponents: false as never,
      neverRepairFailuresAutomatically: false as never,
      neverBeginQ3Implementation: false as never,
      neverOverridePillow: false as never,
      neverOverrideGrandKing: false as never,
    });
    assert.equal(c.neverExecuteBusinessImplementation, true);
    assert.equal(c.neverModifyFactoryComponents, true);
    assert.equal(c.neverRepairFailuresAutomatically, true);
    assert.equal(c.neverBeginQ3Implementation, true);
    assert.equal(c.neverOverridePillow, true);
    assert.equal(c.neverOverrideGrandKing, true);
  });

  test("2 initializes PILLOW-EBC-001 for Q2-10 with all Q2 components", async () => {
    const state = (await build()).getState();
    assert.equal(state.missionId, "Q2-10");
    assert.equal(state.engineVersion, "PILLOW-EBC-001");
    assert.equal(EMPIRE_BUILDER_COMPONENTS.length, 9);
    for (const component of EMPIRE_BUILDER_COMPONENTS) {
      assert.ok(state.configuration.empireBuilderComponents.includes(component.id));
    }
    for (const level of CERTIFICATION_LEVELS) {
      assert.ok(state.configuration.certificationLevels.includes(level));
    }
    for (const domain of INTEGRATION_DOMAINS) {
      assert.ok(state.configuration.integrationDomains.includes(domain));
    }
    for (const rule of PLANNING_GOVERNANCE_RULES) {
      assert.ok(state.configuration.governanceRules.includes(rule));
    }
    assert.ok(EBC_CAPABILITIES.includes("produce_unified_empire_builder_certification_report"));
  });

  test("3 certifies full Empire Builder Factory when all components pass", async () => {
    const report = (await build()).certifyFactory(endToEndInput);
    assert.equal(report.finalCertificationResult, "certified");
    assert.equal(report.q2ProductionReady, true);
    assert.equal(report.q3ReadinessConfirmed, true);
    assert.equal(report.reports[0]!.componentsTested.length, 9);
    assert.equal(report.reports[0]!.componentsFailed.length, 0);
    assert.equal(report.reports[0]!.integrationStatus, "fully_integrated");
    assert.equal(report.reports[0]!.governanceCompliance, "fully_compliant");
    assert.ok(report.reports[0]!.certificationId.startsWith("ebc-cr-"));
  });

  test("4 verifies cross-worker integration domains and executive reporting", async () => {
    const report = (await build()).verifyIntegration(endToEndInput);
    assert.equal(report.action, "verify_integration");
    assert.ok(report.reports[0]!.integrationVerifications.length >= INTEGRATION_DOMAINS.length);
    assert.ok(
      report.reports[0]!.integrationVerifications.every((v) => v.result === "pass"),
    );
    assert.ok(report.reports[0]!.executiveReportingStatus.includes("executive_reporting"));
  });

  test("5 verifies planning governance and factory readiness", async () => {
    const engine = await build();
    const governance = engine.verifyGovernance(endToEndInput);
    assert.equal(governance.action, "verify_governance");
    assert.equal(
      governance.reports[0]!.governanceVerifications.length,
      PLANNING_GOVERNANCE_RULES.length,
    );
    assert.ok(
      governance.reports[0]!.governanceVerifications.every((v) => v.result === "pass"),
    );

    const readiness = engine.assessReadiness(endToEndInput);
    assert.equal(readiness.q2ProductionReady, true);
    assert.ok(readiness.reports[0]!.planningCompleteness.includes("complete"));
  });

  test("6 verifies end-to-end traceability from Grand King command", async () => {
    const report = (await build()).verifyTraceability(endToEndInput);
    const chain = report.reports[0]!.traceabilityChain;
    assert.ok(chain.length >= 9);
    assert.equal(chain[0]!.stage, "grand_king_command");
    assert.equal(
      chain[0]!.artifactId,
      "Build a lean commerce business for local retailers using Shopify",
    );
    assert.ok(chain.every((link) => !!link.artifactId));
    assert.equal(chain.at(-1)!.stage, "business_approval_pack");
  });

  test("7 produces unified Empire Builder Certification Report", async () => {
    const report = (await build()).produceReport(endToEndInput);
    const unified = report.reports[0]!;
    assert.ok(unified.certificationId);
    assert.ok(unified.timestamp);
    assert.equal(unified.empireBuilderFactoryVersion, EMPIRE_BUILDER_FACTORY_VERSION);
    assert.ok(unified.originalGrandKingCommand.includes("commerce"));
    assert.ok(Array.isArray(unified.componentsTested));
    assert.ok(Array.isArray(unified.componentsPassed));
    assert.ok(Array.isArray(unified.componentsFailed));
    assert.ok(unified.integrationStatus);
    assert.ok(unified.planningCompleteness);
    assert.ok(unified.governanceCompliance);
    assert.ok(Array.isArray(unified.outstandingRisks));
    assert.ok(Array.isArray(unified.recommendations));
    assert.ok(unified.finalCertificationResult);
    assert.equal(unified.metadataVersion, "EBC-001-v1");
  });

  test("8 returns final Q2 certification decision and detects failures", async () => {
    const engine = await build();
    const failed = engine.certifyFactory({
      ...endToEndInput,
      failedComponents: ["business-approval-pack-worker", "business-risk-worker", "launch-plan-worker"],
    });
    assert.equal(failed.finalCertificationResult, "failed_certification");
    assert.equal(failed.q2ProductionReady, false);
    assert.equal(failed.q3ReadinessConfirmed, false);
    assert.ok(failed.componentsFailed.includes("business-approval-pack-worker"));

    const warned = engine.certifyFactory({
      ...endToEndInput,
      warningComponents: ["market-research-worker"],
    });
    assert.equal(warned.finalCertificationResult, "certified_with_warnings");
    assert.equal(warned.q2ProductionReady, true);
  });

  test("9 rejects execute / modify / repair / Q3 / override boundaries", async () => {
    const engine = await build();
    for (const forbidden of [
      { executeBusinessImplementation: true },
      { modifyFactoryComponents: true },
      { repairFailuresAutomatically: true },
      { beginQ3Implementation: true },
      { overridePillow: true },
      { overrideGrandKing: true },
    ] as const) {
      const report = engine.certifyFactory({
        ...endToEndInput,
        ...forbidden,
      });
      assert.equal(report.validation.decision, "fail");
      assert.equal(report.finalCertificationResult, null);
    }
  });

  test("10 confirms Q2 production readiness and cockpit boundaries", async () => {
    const engine = await build();
    const report = engine.certifyFactory(endToEndInput);
    assert.equal(report.q2ProductionReady, true);
    assert.equal(report.q3ReadinessConfirmed, true);
    assert.ok(report.reports[0]!.neverExecuteBusinessImplementation);
    assert.ok(report.reports[0]!.neverBeginQ3Implementation);
    assert.equal(report.reports[0]!.businessImplementationExecuted, false);
    assert.equal(report.reports[0]!.q3ImplementationBegun, false);
    const cockpit = engine.getCockpitSnapshot();
    assert.equal(cockpit.missionId, "Q2-10");
    assert.equal(cockpit.q2ProductionReady, true);
    assert.equal(cockpit.neverBeginQ3Implementation, true);
  });
});
