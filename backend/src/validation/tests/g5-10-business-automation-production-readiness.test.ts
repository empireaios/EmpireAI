import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { describe, it } from "node:test";

import {
  AUTOMATION_REGISTRY_IDS,
  BUSINESS_AUTOMATION_MISSIONS,
  createBusinessAutomationModuleContract,
  createBusinessAutomationProgrammeCertification,
  listAutomationRegistryIds,
  resetBusinessAutomationHarnessForTests,
} from "../../orchestration/business-automation/index.js";
import { resolveStoreBackend } from "../../orchestration/pillow/ekls/storage/store-registry.js";
import { resetAutomationRegistryBatchForTests, resetRegistryLoaderForTests } from "../../registry/index.js";
import { configureValidationEnvironment } from "../harness.js";

configureValidationEnvironment();

const ARTIFACTS_ROOT = join(process.cwd(), "..", "artifacts");

const MISSION_AUDITS: Array<{ mission: string; artifact: string }> = [
  { mission: "G5-01", artifact: "g5-01-automation-registry-foundation-executive-audit.md" },
  { mission: "G5-02", artifact: "g5-02-automation-trigger-engine-executive-audit.md" },
  { mission: "G5-03", artifact: "g5-03-workflow-scheduler-queue-executive-audit.md" },
  { mission: "G5-04", artifact: "g5-04-workflow-orchestrator-execution-broker-executive-audit.md" },
  { mission: "G5-05", artifact: "g5-05-pillow-approval-router-executive-audit.md" },
  { mission: "G5-06", artifact: "g5-06-recovery-rollback-engine-executive-audit.md" },
  { mission: "G5-07", artifact: "g5-07-cockpit-automation-centre-executive-audit.md" },
  { mission: "G5-08", artifact: "g5-08-ekls-outcome-integration-executive-audit.md" },
  { mission: "G5-09", artifact: "g5-09-automation-plugin-integration-executive-audit.md" },
];

function resetG510Harness(): void {
  resetRegistryLoaderForTests();
  resetAutomationRegistryBatchForTests();
  resetBusinessAutomationHarnessForTests();
}

describe("G5-10 — Business Automation Production Readiness & Executive Audit", () => {
  it("certifies the complete G5 programme with all missions present", () => {
    resetG510Harness();
    assert.equal(BUSINESS_AUTOMATION_MISSIONS.length, 10);
    assert.deepEqual(BUSINESS_AUTOMATION_MISSIONS[0], "G5-01");
    assert.deepEqual(BUSINESS_AUTOMATION_MISSIONS[9], "G5-10");

    const certification = createBusinessAutomationProgrammeCertification({
      validationSuitePass: true,
      typecheckPass: true,
    });

    assert.equal(certification.status, "certified");
    assert.equal(certification.productionEligible, true);
    assert.equal(certification.registryCompliance, true);
    assert.equal(certification.pillowGovernanceConfirmed, true);
    assert.equal(certification.ownershipIntegrityConfirmed, true);
  });

  it("confirms module contract reflects G5-10 certification without new capabilities", () => {
    resetG510Harness();
    const contract = createBusinessAutomationModuleContract();
    assert.equal(contract.missionId, "G5-10");
    assert.equal(contract.programmeStatus, "certified");
    assert.ok(contract.capabilities.includes("business-automation.programme_certification"));
    assert.ok(contract.capabilities.includes("business-automation.receive_trigger"));
    assert.ok(contract.capabilities.includes("business-automation.plugin_capabilities"));
    assert.equal(contract.integratesWith.includes("pillow"), true);
    assert.equal(contract.integratesWith.includes("ekls"), true);
    assert.equal(contract.integratesWith.includes("brain"), true);
    assert.equal(contract.integratesWith.includes("registry"), true);
    assert.equal(contract.integratesWith.includes("guardian"), true);
  });

  it("validates all ten REG-AUTOMATION registries are wired for dynamic resolution", () => {
    resetG510Harness();
    assert.equal(AUTOMATION_REGISTRY_IDS.length, 10);
    const ids = listAutomationRegistryIds();
    assert.equal(ids.length, 10);
    assert.ok(ids.every((id) => id.startsWith("REG-AUTOMATION-")));
  });

  it("confirms architecture ownership — BA orchestrates, EKLS stores outcomes via Pillow", () => {
    resetG510Harness();
    const outcomeBackend = resolveStoreBackend("outcome_history");
    assert.ok(outcomeBackend);
    assert.equal(outcomeBackend.governance, "pillow-only");
    assert.ok(outcomeBackend.integrationPath.includes("automation-outcome-store"));
  });

  it("confirms Brain integration surface spans trigger through plugin lifecycle", async () => {
    resetG510Harness();
    const { businessAutomationTools } = await import(
      "../../orchestration/business-automation/tools/business-automation-tools.js"
    );
    const { eklsOutcomeTools } = await import(
      "../../orchestration/business-automation/tools/ekls-outcome-tools.js"
    );
    const { automationPluginTools } = await import(
      "../../orchestration/business-automation/tools/automation-plugin-tools.js"
    );
    const { cockpitAutomationTools } = await import(
      "../../orchestration/business-automation/tools/cockpit-automation-tools.js"
    );

    const toolNames = [
      ...businessAutomationTools,
      ...eklsOutcomeTools,
      ...automationPluginTools,
      ...cockpitAutomationTools,
    ].map((tool) => tool.name);

    assert.ok(toolNames.includes("business_automation.receive_trigger"));
    assert.ok(toolNames.includes("business_automation.advance_run"));
    assert.ok(toolNames.includes("business_automation.grant_approval"));
    assert.ok(toolNames.includes("business_automation.handle_recovery"));
    assert.ok(toolNames.includes("business_automation.get_learning"));
    assert.ok(toolNames.includes("business_automation.register_plugin"));
    assert.ok(toolNames.includes("cockpit_automation.load_view"));
  });

  it("validates operational subsystems are exported from the canonical module barrel", async () => {
    resetG510Harness();
    const module = await import("../../orchestration/business-automation/index.js");

    assert.equal(typeof module.receiveAutomationTrigger, "function");
    assert.equal(typeof module.dispatchNextQueuedAutomation, "function");
    assert.equal(typeof module.advanceAutomationRun, "function");
    assert.equal(typeof module.grantAutomationApproval, "function");
    assert.equal(typeof module.handleAutomationRecovery, "function");
    assert.equal(typeof module.loadAutomationCentreView, "function");
    assert.equal(typeof module.getEklsOutcomeIntegration, "function");
    assert.equal(typeof module.getAutomationPluginHost, "function");
  });

  it("confirms executive audit artifacts exist for G5-01 through G5-09", () => {
    resetG510Harness();
    for (const row of MISSION_AUDITS) {
      const path = join(ARTIFACTS_ROOT, row.artifact);
      assert.ok(existsSync(path), `Missing executive audit for ${row.mission}: ${row.artifact}`);
    }
  });

  it("rejects certification when validation or typecheck gates fail", () => {
    resetG510Harness();
    const failed = createBusinessAutomationProgrammeCertification({
      validationSuitePass: false,
      typecheckPass: true,
    });
    assert.equal(failed.status, "not_certified");
    assert.equal(failed.productionEligible, false);
  });

  it("validates plugin and domain registries remain isolated extension points", async () => {
    resetG510Harness();
    const {
      triggerPluginRegistry,
      orchestratorPluginRegistry,
      schedulerPluginRegistry,
      approvalPluginRegistry,
      recoveryPluginRegistry,
      outcomePluginRegistry,
      automationCentrePluginRegistry,
    } = await import("../../orchestration/business-automation/index.js");

    assert.equal(typeof triggerPluginRegistry.registerValidator, "function");
    assert.equal(typeof orchestratorPluginRegistry.registerValidator, "function");
    assert.equal(typeof schedulerPluginRegistry.registerScheduler, "function");
    assert.equal(typeof approvalPluginRegistry.registerProvider, "function");
    assert.equal(typeof recoveryPluginRegistry.registerFailureAnalyser, "function");
    assert.equal(typeof outcomePluginRegistry.registerKnowledgeProvider, "function");
    assert.equal(typeof automationCentrePluginRegistry.registerWidget, "function");
  });

  it("confirms G5-10 production readiness and completion summary artifacts are present", () => {
    resetG510Harness();
    assert.ok(
      existsSync(join(ARTIFACTS_ROOT, "g5-10-business-automation-production-readiness-executive-audit.md")),
    );
    assert.ok(existsSync(join(ARTIFACTS_ROOT, "g5-business-automation-completion-summary.md")));
  });
});
