import assert from "node:assert/strict";
import path from "node:path";
import { beforeEach, describe, test } from "node:test";
import { runBootstrap } from "../../bootstrap/engine.js";
import {
  CERTIFICATION_LEVELS,
  INTEGRATION_DOMAINS,
  WFC_CAPABILITIES,
  WORKFORCE_FACTORY_COMPONENTS,
  WORKFORCE_GOVERNANCE_RULES,
  buildWorkforceFactoryCertificationConfiguration,
  createWorkforceFactoryCertification,
  resetWorkforceFactoryCertificationForTesting,
} from "../../workforce-factory-certification/index.js";

const REPO_ROOT = path.resolve(import.meta.dirname, "..", "..", "..", "..");

async function build(config?: Parameters<typeof createWorkforceFactoryCertification>[1]) {
  const bootstrap = await runBootstrap({ repositoryRoot: REPO_ROOT, skipHeavyScans: true });
  const engine = createWorkforceFactoryCertification(bootstrap, config);
  await engine.initialize();
  engine.connectWorkforceFactoryCertification();
  return engine;
}

describe("Q1-13 Workforce Factory Certification", () => {
  beforeEach(resetWorkforceFactoryCertificationForTesting);

  test("1 locks mandatory workforce-factory-certification boundaries", () => {
    const c = buildWorkforceFactoryCertificationConfiguration(REPO_ROOT, {
      neverExecuteWorkerTasks: false as never,
      neverModifyWorkforceComponents: false as never,
      neverRepairFailuresAutomatically: false as never,
      neverBeginQ2Implementation: false as never,
      neverOverridePillow: false as never,
      neverOverrideGrandKing: false as never,
    });
    assert.equal(c.neverExecuteWorkerTasks, true);
    assert.equal(c.neverModifyWorkforceComponents, true);
    assert.equal(c.neverRepairFailuresAutomatically, true);
    assert.equal(c.neverBeginQ2Implementation, true);
    assert.equal(c.neverOverridePillow, true);
    assert.equal(c.neverOverrideGrandKing, true);
  });

  test("2 initializes PILLOW-WFC-001 for Q1-13 with all Q1 components", async () => {
    const state = (await build()).getState();
    assert.equal(state.missionId, "Q1-13");
    assert.equal(state.engineVersion, "PILLOW-WFC-001");
    assert.equal(WORKFORCE_FACTORY_COMPONENTS.length, 12);
    for (const component of WORKFORCE_FACTORY_COMPONENTS) {
      assert.ok(state.configuration.workforceFactoryComponents.includes(component.id));
    }
    for (const level of CERTIFICATION_LEVELS) {
      assert.ok(state.configuration.certificationLevels.includes(level));
    }
    for (const domain of INTEGRATION_DOMAINS) {
      assert.ok(state.configuration.integrationDomains.includes(domain));
    }
    for (const rule of WORKFORCE_GOVERNANCE_RULES) {
      assert.ok(state.configuration.governanceRules.includes(rule));
    }
  });

  test("3 certifies full Workforce Factory when all components pass", async () => {
    const report = (await build()).certifyFactory({ validated: true });
    assert.equal(report.finalCertificationResult, "certified");
    assert.equal(report.q1ProductionReady, true);
    assert.equal(report.q2ReadinessConfirmed, true);
    assert.equal(report.reports[0]!.componentsTested.length, 12);
    assert.equal(report.reports[0]!.componentsFailed.length, 0);
    assert.equal(report.reports[0]!.integrationStatus, "fully_integrated");
    assert.equal(report.reports[0]!.governanceCompliance, "fully_compliant");
    assert.ok(report.reports[0]!.certificationId.startsWith("wfc-cr-"));
  });

  test("4 verifies cross-component integration domains", async () => {
    const report = (await build()).verifyIntegration({ validated: true });
    assert.equal(report.action, "verify_integration");
    assert.ok(report.reports[0]!.integrationVerifications.length >= INTEGRATION_DOMAINS.length);
    assert.ok(
      report.reports[0]!.integrationVerifications.every((v) => v.result === "pass"),
    );
  });

  test("5 verifies worker governance and workforce readiness", async () => {
    const engine = await build();
    const governance = engine.verifyGovernance({ validated: true });
    assert.equal(governance.action, "verify_governance");
    assert.equal(governance.reports[0]!.governanceVerifications.length, WORKFORCE_GOVERNANCE_RULES.length);
    assert.ok(
      governance.reports[0]!.governanceVerifications.every((v) => v.result === "pass"),
    );

    const readiness = engine.assessReadiness({ validated: true });
    assert.equal(readiness.q1ProductionReady, true);
    assert.ok(readiness.reports[0]!.workforceReadiness.includes("production-ready"));
  });

  test("6 produces unified Workforce Factory Certification Report", async () => {
    const report = (await build()).produceReport({ validated: true });
    const unified = report.reports[0]!;
    assert.ok(unified.certificationId);
    assert.ok(unified.timestamp);
    assert.ok(unified.workforceFactoryVersion);
    assert.ok(Array.isArray(unified.componentsTested));
    assert.ok(Array.isArray(unified.componentsPassed));
    assert.ok(Array.isArray(unified.componentsFailed));
    assert.ok(unified.integrationStatus);
    assert.ok(unified.workforceReadiness);
    assert.ok(unified.governanceCompliance);
    assert.ok(Array.isArray(unified.remainingRisks));
    assert.ok(Array.isArray(unified.recommendations));
    assert.ok(unified.finalCertificationResult);
    assert.equal(unified.metadataVersion, "WFC-001-v1");
  });

  test("7 returns final Q1 certification decision and detects failures", async () => {
    const engine = await build();
    const failed = engine.certifyFactory({
      validated: true,
      failedComponents: [
        "worker-constitution",
        "worker-registry",
        "worker-assignment-engine",
        "worker-monitoring",
        "worker-recovery-system",
      ],
      failedDomains: [
        "cross_component_integration",
        "pillow_governance",
        "workforce_readiness",
      ],
    });
    assert.equal(failed.finalCertificationResult, "failed_certification");
    assert.equal(failed.q1ProductionReady, false);
    assert.equal(failed.q2ReadinessConfirmed, false);
    assert.ok(failed.componentsFailed.length >= 5);

    const warned = engine.certifyFactory({
      validated: true,
      warningComponents: ["worker-performance-review"],
    });
    assert.equal(warned.finalCertificationResult, "certified_with_warnings");
    assert.equal(warned.q1ProductionReady, true);
  });

  test("8 rejects execute / modify / repair / Q2 / Pillow / Grand King boundaries", async () => {
    const engine = await build();
    assert.equal(
      engine.certifyFactory({ validated: true, executeWorkerTasks: true }).validation.decision,
      "fail",
    );
    assert.equal(
      engine.verifyIntegration({
        validated: true,
        modifyWorkforceComponents: true,
      }).validation.decision,
      "fail",
    );
    assert.equal(
      engine.assessReadiness({
        validated: true,
        repairFailuresAutomatically: true,
      }).validation.decision,
      "fail",
    );
    assert.equal(
      engine.produceReport({ validated: true, beginQ2Implementation: true }).validation.decision,
      "fail",
    );
    assert.equal(
      engine.verifyComponent({ validated: true, overridePillow: true }).validation.decision,
      "fail",
    );
    assert.equal(
      engine.certifyFactory({ validated: true, overrideGrandKing: true }).validation.decision,
      "fail",
    );
    assert.ok(WFC_CAPABILITIES.includes("determine_q1_production_readiness"));
    assert.ok(WFC_CAPABILITIES.includes("confirm_readiness_for_q2"));
  });

  test("9 supports extensible certification levels and domains", async () => {
    const engine = await build({
      configuration: {
        certificationLevels: [...CERTIFICATION_LEVELS, "conditional_hold"],
        integrationDomains: [...INTEGRATION_DOMAINS, "workforce_security"],
      },
    });
    const state = engine.getState();
    assert.ok(state.configuration.certificationLevels.includes("conditional_hold"));
    assert.ok(state.configuration.integrationDomains.includes("workforce_security"));
  });

  test("10 validates machine-readable reports and Q1 production-ready gate", async () => {
    const engine = await build();
    engine.certifyFactory({ validated: true });
    const validation = engine.validateWorkforceFactoryCertification({ validated: true });
    assert.ok(
      validation.validation.decision === "pass" || validation.validation.decision === "partial",
    );
    const report = engine.getLatestCertificationReport()!;
    assert.equal(report.q1ProductionReady, true);
    assert.equal(report.q2ReadinessConfirmed, true);
    assert.equal(report.finalCertificationResult, "certified");
    assert.equal(report.workerTasksExecuted, false);
    assert.equal(report.workforceComponentsModified, false);
    assert.equal(report.failuresRepairedAutomatically, false);
    assert.equal(report.q2ImplementationBegun, false);
    assert.equal(report.pillowOverridden, false);
    assert.equal(report.grandKingOverridden, false);
    assert.equal(report.componentVerifications.length, 12);
    assert.equal(report.governanceVerifications.length, WORKFORCE_GOVERNANCE_RULES.length);
  });
});
