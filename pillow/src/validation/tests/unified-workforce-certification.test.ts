import assert from "node:assert/strict";
import path from "node:path";
import { beforeEach, describe, test } from "node:test";
import { runBootstrap } from "../../bootstrap/engine.js";
import {
  CERTIFICATION_LEVELS,
  EXECUTIVE_COMPONENTS,
  INTEGRATION_DOMAINS,
  UWC_CAPABILITIES,
  buildUnifiedWorkforceCertificationConfiguration,
  createUnifiedWorkforceCertification,
  resetUnifiedWorkforceCertificationForTesting,
} from "../../unified-workforce-certification/index.js";

const REPO_ROOT = path.resolve(import.meta.dirname, "..", "..", "..", "..");

async function build(config?: Parameters<typeof createUnifiedWorkforceCertification>[1]) {
  const bootstrap = await runBootstrap({ repositoryRoot: REPO_ROOT, skipHeavyScans: true });
  const engine = createUnifiedWorkforceCertification(bootstrap, config);
  await engine.initialize();
  engine.connectUnifiedWorkforceCertification();
  return engine;
}

describe("Q0-30 Unified Workforce Certification", () => {
  beforeEach(resetUnifiedWorkforceCertificationForTesting);

  test("1 locks mandatory unified-workforce-certification boundaries", () => {
    const c = buildUnifiedWorkforceCertificationConfiguration(REPO_ROOT, {
      neverExecuteWorkerTasks: false as never,
      neverModifyExecutiveComponents: false as never,
      neverRepairFailuresAutomatically: false as never,
      neverBeginQ1Implementation: false as never,
      neverOverridePillow: false as never,
      neverOverrideGrandKing: false as never,
    });
    assert.equal(c.neverExecuteWorkerTasks, true);
    assert.equal(c.neverModifyExecutiveComponents, true);
    assert.equal(c.neverRepairFailuresAutomatically, true);
    assert.equal(c.neverBeginQ1Implementation, true);
    assert.equal(c.neverOverridePillow, true);
    assert.equal(c.neverOverrideGrandKing, true);
  });

  test("2 initializes PILLOW-UWC-001 for Q0-30 with all Q0 components", async () => {
    const state = (await build()).getState();
    assert.equal(state.missionId, "Q0-30");
    assert.equal(state.engineVersion, "PILLOW-UWC-001");
    assert.equal(EXECUTIVE_COMPONENTS.length, 29);
    for (const component of EXECUTIVE_COMPONENTS) {
      assert.ok(state.configuration.executiveComponents.includes(component.id));
    }
    for (const level of CERTIFICATION_LEVELS) {
      assert.ok(state.configuration.certificationLevels.includes(level));
    }
    for (const domain of INTEGRATION_DOMAINS) {
      assert.ok(state.configuration.integrationDomains.includes(domain));
    }
  });

  test("3 certifies full Executive Intelligence Factory when all components pass", async () => {
    const report = (await build()).certifyFactory({ validated: true });
    assert.equal(report.finalCertificationResult, "certified");
    assert.equal(report.q0ProductionReady, true);
    assert.equal(report.reports[0]!.executiveComponentsTested.length, 29);
    assert.equal(report.reports[0]!.componentsFailed.length, 0);
    assert.equal(report.reports[0]!.integrationStatus, "fully_integrated");
    assert.equal(report.reports[0]!.executiveHealth, "healthy");
    assert.ok(report.reports[0]!.certificationId.startsWith("uwc-cr-"));
  });

  test("4 verifies cross-component integration domains", async () => {
    const report = (await build()).verifyIntegration({ validated: true });
    assert.equal(report.action, "verify_integration");
    assert.ok(report.reports[0]!.integrationVerifications.length >= INTEGRATION_DOMAINS.length);
    assert.ok(
      report.reports[0]!.integrationVerifications.every((v) => v.result === "pass"),
    );
  });

  test("5 assesses executive readiness for production", async () => {
    const report = (await build()).assessReadiness({ validated: true });
    assert.equal(report.q0ProductionReady, true);
    assert.ok(report.reports[0]!.readinessAssessment.includes("production-ready"));
  });

  test("6 produces unified certification report with required fields", async () => {
    const report = (await build()).produceReport({ validated: true });
    const unified = report.reports[0]!;
    assert.ok(unified.certificationId);
    assert.ok(unified.timestamp);
    assert.ok(unified.executiveFactoryVersion);
    assert.ok(Array.isArray(unified.executiveComponentsTested));
    assert.ok(Array.isArray(unified.componentsPassed));
    assert.ok(Array.isArray(unified.componentsFailed));
    assert.ok(unified.integrationStatus);
    assert.ok(unified.readinessAssessment);
    assert.ok(unified.executiveHealth);
    assert.ok(Array.isArray(unified.remainingRisks));
    assert.ok(Array.isArray(unified.recommendations));
    assert.ok(unified.finalCertificationResult);
    assert.equal(unified.metadataVersion, "UWC-001-v1");
  });

  test("7 returns final Q0 certification decision and detects failures", async () => {
    const engine = await build();
    const failed = engine.certifyFactory({
      validated: true,
      failedComponents: [
        "executive-planner",
        "decision-engine",
        "workforce-orchestrator",
        "peer-review-runtime",
        "worker-quality-standard",
      ],
      failedDomains: [
        "executive_orchestration",
        "executive_reasoning",
        "executive_quality_controls",
      ],
    });
    assert.equal(failed.finalCertificationResult, "failed_certification");
    assert.equal(failed.q0ProductionReady, false);
    assert.ok(failed.componentsFailed.length >= 5);

    const warned = engine.certifyFactory({
      validated: true,
      warningComponents: ["opportunity-scanner"],
    });
    assert.equal(warned.finalCertificationResult, "certified_with_warnings");
    assert.equal(warned.q0ProductionReady, true);
  });

  test("8 rejects execute / modify / repair / Q1 / Pillow / Grand King boundaries", async () => {
    const engine = await build();
    assert.equal(
      engine.certifyFactory({ validated: true, executeWorkerTasks: true }).validation.decision,
      "fail",
    );
    assert.equal(
      engine.verifyIntegration({
        validated: true,
        modifyExecutiveComponents: true,
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
      engine.produceReport({ validated: true, beginQ1Implementation: true }).validation.decision,
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
    assert.ok(UWC_CAPABILITIES.includes("determine_q0_production_readiness"));
  });

  test("9 supports extensible certification levels and domains", async () => {
    const engine = await build({
      configuration: {
        certificationLevels: [...CERTIFICATION_LEVELS, "conditional_hold"],
        integrationDomains: [...INTEGRATION_DOMAINS, "executive_security"],
      },
    });
    const state = engine.getState();
    assert.ok(state.configuration.certificationLevels.includes("conditional_hold"));
    assert.ok(state.configuration.integrationDomains.includes("executive_security"));
  });

  test("10 validates machine-readable reports and Q0 production-ready gate", async () => {
    const engine = await build();
    engine.certifyFactory({ validated: true });
    const validation = engine.validateUnifiedWorkforceCertification({ validated: true });
    assert.ok(
      validation.validation.decision === "pass" || validation.validation.decision === "partial",
    );
    const report = engine.getLatestCertificationReport()!;
    assert.equal(report.q0ProductionReady, true);
    assert.equal(report.finalCertificationResult, "certified");
    assert.equal(report.workerTasksExecuted, false);
    assert.equal(report.executiveComponentsModified, false);
    assert.equal(report.failuresRepairedAutomatically, false);
    assert.equal(report.q1ImplementationBegun, false);
    assert.equal(report.pillowOverridden, false);
    assert.equal(report.grandKingOverridden, false);
    assert.equal(report.componentVerifications.length, 29);
  });
});
