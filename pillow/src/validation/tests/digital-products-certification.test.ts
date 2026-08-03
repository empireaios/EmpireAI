import assert from "node:assert/strict";
import path from "node:path";
import { beforeEach, describe, test } from "node:test";
import { runBootstrap } from "../../bootstrap/engine.js";
import {
  CERTIFICATION_STATUSES,
  DPC_CAPABILITIES,
  DPC_METADATA_VERSION,
  DIGITAL_PRODUCTS_FACTORY_COMPONENTS,
  DIGITAL_PRODUCTS_FACTORY_VERSION,
  DIGITAL_PRODUCTS_GOVERNANCE_RULES,
  INTEGRATION_DOMAINS,
  buildDigitalProductsCertificationConfiguration,
  createDigitalProductsCertification,
  resetDigitalProductsCertificationForTesting,
} from "../../digital-products-certification/index.js";

const REPO_ROOT = path.resolve(import.meta.dirname, "..", "..", "..", "..");

async function build(
  config?: Parameters<typeof createDigitalProductsCertification>[1],
) {
  const bootstrap = await runBootstrap({ repositoryRoot: REPO_ROOT, skipHeavyScans: true });
  const engine = createDigitalProductsCertification(bootstrap, config);
  await engine.initialize();
  engine.connectDigitalProductsCertification();
  return engine;
}

const endToEndInput = {
  digitalProductId: "dpf-dpc-product-01",
  businessId: "dbiz-dpc-01",
  factoryMissionId: "dpf-mission-dpc-01",
  researchReportId: "dpr-research-dpc-01",
  productArtifactId: "ebw-ebook-dpc-01",
  designReportId: "dsw-design-dpc-01",
  salesPageId: "spw-sales-dpc-01",
  checkoutId: "ckw-checkout-dpc-01",
  purchaseSimulationId: "ckw-purchase-dpc-01",
  deliveryId: "ddw-delivery-dpc-01",
  analyticsReportId: "dpa-analytics-dpc-01",
  executiveReportIds: ["ert-dpc-001", "ert-dpa-001"],
  validated: true,
};

describe("Q5-12 Digital Products Certification", () => {
  beforeEach(resetDigitalProductsCertificationForTesting);

  test("1 locks mandatory digital-products-certification boundaries", () => {
    const c = buildDigitalProductsCertificationConfiguration(REPO_ROOT, {
      neverAutomaticallyFixFailures: false as never,
      neverAutomaticallyCertifyIncompleteWork: false as never,
      neverOverridePillow: false as never,
      neverOverrideGrandKing: false as never,
      neverBeginQ6Implementation: false as never,
      neverAssumeImplementation: false as never,
    });
    assert.equal(c.neverAutomaticallyFixFailures, true);
    assert.equal(c.neverAutomaticallyCertifyIncompleteWork, true);
    assert.equal(c.neverOverridePillow, true);
    assert.equal(c.neverOverrideGrandKing, true);
    assert.equal(c.neverBeginQ6Implementation, true);
    assert.equal(c.neverAssumeImplementation, true);
  });

  test("2 initializes PILLOW-DPC-001 Q5-12 with all 11 Q5 components + statuses vocabulary", async () => {
    const state = (await build()).getState();
    assert.equal(state.missionId, "Q5-12");
    assert.equal(state.engineVersion, "PILLOW-DPC-001");
    assert.equal(DIGITAL_PRODUCTS_FACTORY_COMPONENTS.length, 11);
    for (const component of DIGITAL_PRODUCTS_FACTORY_COMPONENTS) {
      assert.ok(state.configuration.digitalProductsFactoryComponents.includes(component.id));
    }
    for (const status of CERTIFICATION_STATUSES) {
      assert.ok(state.configuration.certificationStatuses.includes(status));
    }
    for (const domain of INTEGRATION_DOMAINS) {
      assert.ok(state.configuration.integrationDomains.includes(domain));
    }
    for (const rule of DIGITAL_PRODUCTS_GOVERNANCE_RULES) {
      assert.ok(state.configuration.governanceRules.includes(rule));
    }
    assert.ok(DPC_CAPABILITIES.includes("produce_unified_digital_products_certification_report"));
  });

  test("3 certifies full factory when all pass → Certified, q5ProductionReady true, q6 false, 11 missions", async () => {
    const report = (await build()).certifyFactory(endToEndInput);
    assert.equal(report.certificationStatus, "Certified");
    assert.equal(report.q5ProductionReady, true);
    assert.equal(report.q6ReadinessConfirmed, false);
    assert.equal(report.reports[0]!.missionVerificationMatrix.length, 11);
    assert.equal(report.reports[0]!.factoryStatus, "fully_operational");
    assert.ok(report.reports[0]!.certificationId.startsWith("dpc-crt-"));
  });

  test("4 mission + worker verification matrices present; workers registered/invocable", async () => {
    const report = (await build()).verifyWorkerRegistration(endToEndInput);
    const unified = report.reports[0]!;
    assert.equal(unified.missionVerificationMatrix.length, 11);
    assert.equal(unified.workerVerificationMatrix.length, 11);
    assert.ok(unified.workerVerificationMatrix.every((w) => w.registered));
    assert.ok(unified.workerVerificationMatrix.every((w) => w.invocable));
    assert.ok(unified.workerVerificationMatrix.every((w) => w.dependenciesVerified));
  });

  test("5 end-to-end workflow results + integration results", async () => {
    const report = (await build()).verifyEndToEndWorkflow(endToEndInput);
    const unified = report.reports[0]!;
    assert.ok(unified.endToEndWorkflowResults.length >= 10);
    assert.equal(unified.endToEndWorkflowResults[0]!.stage, "research_opportunity");
    assert.ok(unified.endToEndWorkflowResults.every((w) => w.status === "pass"));
    assert.ok(unified.integrationResults.length >= INTEGRATION_DOMAINS.length);
    assert.ok(unified.integrationResults.every((v) => v.result === "pass"));
    assert.equal(unified.traceabilityChain.at(-1)!.stage, "complete_workflow_under_pillow");
  });

  test("6 governance + failure recovery + audit trail completeness", async () => {
    const engine = await build();
    const governance = engine.verifyGovernanceCompliance(endToEndInput);
    assert.equal(governance.reports[0]!.governanceResults.length, DIGITAL_PRODUCTS_GOVERNANCE_RULES.length);
    assert.ok(governance.reports[0]!.governanceResults.every((v) => v.result === "pass"));

    const recovery = engine.verifyFailureHandlingAndRecovery(endToEndInput);
    assert.ok(recovery.reports[0]!.failureRecoveryResults.status.includes("verified"));

    const audit = engine.verifyAuditTrailCompleteness(endToEndInput);
    assert.ok(audit.reports[0]!.traceabilityChain.length >= 10);
    assert.ok(engine.getAuditTrail().length >= 1);
  });

  test("7 produces certification report with all required minimum fields + executive summary", async () => {
    const report = (await build()).produceDigitalProductsCertificationReport(endToEndInput);
    const unified = report.reports[0]!;
    assert.ok(unified.certificationId);
    assert.ok(unified.timestamp);
    assert.ok(unified.factoryStatus);
    assert.ok(unified.missionVerificationMatrix.length);
    assert.ok(unified.workerVerificationMatrix.length);
    assert.ok(unified.integrationResults.length);
    assert.ok(unified.endToEndWorkflowResults.length);
    assert.ok(unified.failureRecoveryResults.status);
    assert.ok(unified.governanceResults.length);
    assert.ok(Array.isArray(unified.outstandingIssues));
    assert.ok(unified.certificationStatus);
    assert.ok(unified.executiveSummary);
    assert.equal(unified.metadataVersion, DPC_METADATA_VERSION);
    assert.equal(unified.factoryVersion, DIGITAL_PRODUCTS_FACTORY_VERSION);
    assert.equal(unified.q6ReadinessConfirmed, false);
  });

  test("8 failure reporting: failedComponents → Failed with remediation; warnings → Conditionally Certified", async () => {
    const engine = await build();
    const failed = engine.certifyFactory({
      ...endToEndInput,
      failedComponents: [
        "digital-product-analytics-worker",
        "checkout-worker",
        "digital-delivery-worker",
      ],
    });
    assert.equal(failed.certificationStatus, "Failed");
    assert.equal(failed.q5ProductionReady, false);
    assert.equal(failed.q6ReadinessConfirmed, false);
    const failedMission = failed.reports[0]!.missionVerificationMatrix.find(
      (m) => m.componentId === "digital-product-analytics-worker",
    );
    assert.equal(failedMission!.status, "Failed");
    assert.ok(failedMission!.rootCause);
    assert.ok(failedMission!.evidence);
    assert.ok(failedMission!.impact);
    assert.ok(failedMission!.recommendedRemediation);

    const warned = engine.certifyFactory({
      ...endToEndInput,
      warningComponents: ["design-worker"],
    });
    assert.equal(warned.certificationStatus, "Conditionally Certified");
    assert.equal(warned.q5ProductionReady, true);
  });

  test("9 rejects forbidden boundary flags", async () => {
    const engine = await build();
    for (const forbidden of [
      { automaticallyFixFailures: true },
      { automaticallyCertifyIncompleteWork: true },
      { overridePillow: true },
      { overrideGrandKing: true },
      { beginQ6Implementation: true },
      { assumeImplementation: true },
      { implementQ601OrLater: true },
    ] as const) {
      const report = engine.certifyFactory({
        ...endToEndInput,
        ...forbidden,
      });
      assert.equal(report.validation.decision, "fail");
      assert.equal(report.certificationStatus, null);
    }
  });

  test("10 list + ERR submit missionId Q5-12 + cockpit + audit", async () => {
    const submittedIds: string[] = [];
    const bootstrap = await runBootstrap({ repositoryRoot: REPO_ROOT, skipHeavyScans: true });
    const engine = createDigitalProductsCertification(bootstrap, {
      dependencies: {
        executiveReportingRuntime: {
          submitWorkerReport: (input) => {
            submittedIds.push(String(input.missionId));
            return { records: [{ reportId: "ert-dpc-001" }] };
          },
        },
      },
    });
    await engine.initialize();
    engine.connect();
    engine.certifyFactory(endToEndInput);
    const listed = engine.listCertificationReports();
    assert.ok(listed.reports.length >= 1);
    const submitted = engine.submitReport({ validated: true });
    assert.equal(submitted.action, "submit_report");
    assert.deepEqual(submittedIds, ["Q5-12"]);
    assert.equal(submitted.reports[0]!.submittedToExecutiveReporting, true);
    assert.equal(submitted.reports[0]!.executiveReportId, "ert-dpc-001");
    assert.ok(engine.getAuditTrail().length >= 1);
    const cockpit = engine.getCockpitSnapshot();
    assert.equal(cockpit.missionId, "Q5-12");
    assert.equal(cockpit.q5ProductionReady, true);
    assert.equal(cockpit.q6ReadinessConfirmed, false);
    assert.equal(cockpit.neverBeginQ6Implementation, true);
    assert.equal(cockpit.neverAutomaticallyFixFailures, true);
  });
});
