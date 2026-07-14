import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { resolveCockpitScreenContext } from "../../domain/services/cockpit-interaction-layer.js";
import {
  EXECUTIVE_OPERATIONS_EKLS_KINDS,
  EXECUTIVE_OPERATIONS_CERTIFICATION_VERSION,
  EXECUTIVE_RESULT_STATES,
  buildCockpitExecutiveOperationsView,
  createProductionCertificationModuleContract,
  executiveOperationsTools,
  getExecutiveOperationsOverview,
  listExecutiveOperationsEklsKinds,
  registerExecutiveOperationsPlugin,
  resetProductionCertificationHarnessForTests,
  resolveExecutiveOperationsRules,
  runExecutiveOperationsScan,
  searchExecutiveOperationsEklsObservations,
  validateApprovalFlow,
  validateAutomationCentre,
  validateCockpitOperations,
  validateExecutiveActionSafety,
  validateExecutiveOperationsPillowGovernance,
  validateGlobalAiAssistant,
  validateReadinessVisibility,
} from "../../orchestration/production-certification/index.js";
import { configureValidationEnvironment } from "../harness.js";

configureValidationEnvironment();

const TEST_CONTEXT = { workspaceId: "ws-foundation" } as const;
const TEST_ACTOR = {
  actorId: "grand-king",
  workspaceId: "ws-foundation",
  pillowGovernance: true as const,
};

function configureExecutiveTestEnvironment(): void {
  process.env.EXEC_MISSING_ROUTE = "false";
  process.env.EXEC_BROKEN_PANEL = "false";
  process.env.EXEC_MISSING_BRAIN_MODULE = "false";
  process.env.EXEC_MISSING_APPROVAL_VISIBILITY = "false";
  process.env.EXEC_MISSING_AUTOMATION_VISIBILITY = "false";
  process.env.EXEC_MISSING_READINESS_VISIBILITY = "false";
  process.env.EXEC_MISSING_EXECUTIVE_REPORT = "false";
  process.env.EXEC_MISSING_AI_ASSISTANT_CONTEXT = "false";
  process.env.EXEC_UNSAFE_EXECUTIVE_ACTION = "false";
  process.env.EXEC_UNCLEAR_OWNERSHIP = "false";
  process.env.EXEC_INCOMPLETE_EVIDENCE = "false";
  process.env.EXEC_STALE_STATUS = "false";
}

describe("G6-07 — Executive Operations Certification", () => {
  it("exposes executive operations certification version and result states", () => {
    assert.equal(EXECUTIVE_OPERATIONS_CERTIFICATION_VERSION, "g6-07-v1");
    assert.ok(EXECUTIVE_RESULT_STATES.includes("pass"));
    assert.ok(EXECUTIVE_RESULT_STATES.includes("fail"));
    assert.equal(EXECUTIVE_RESULT_STATES.length, 5);
  });

  it("retains G6-07 executive operations subsystem after G6-10 module advance", () => {
    const contract = createProductionCertificationModuleContract();
    assert.equal(contract.missionId, "G6-10");
    assert.equal(contract.programmeStatus, "production-readiness-certified");
    assert.ok(contract.capabilities.includes("production-certification.executive_operations_scan"));
  });

  it("resolves executive rules from REG-CERTIFICATION-EXECUTIVE", () => {
    resetProductionCertificationHarnessForTests();
    configureExecutiveTestEnvironment();
    const rules = resolveExecutiveOperationsRules(TEST_CONTEXT);
    assert.ok(rules.length >= 15);
    assert.ok(rules.some((rule) => rule.ruleKind === "cockpit_operations"));
    assert.ok(rules.some((rule) => rule.ruleKind === "executive_action_safety"));
    assert.ok(rules.some((rule) => rule.cockpitRouteRef === "/cockpit/command"));
  });

  it("validates Cockpit routes through canonical registry without hardcoded screens", () => {
    resetProductionCertificationHarnessForTests();
    configureExecutiveTestEnvironment();
    const command = resolveCockpitScreenContext("/cockpit/command");
    assert.equal(command.screenId, "SCR-010");
    const automation = resolveCockpitScreenContext("/cockpit/operations/automation");
    assert.equal(automation.screenId, "SCR-303");
    const approvals = resolveCockpitScreenContext("/cockpit/development/approvals");
    assert.equal(approvals.screenId, "SCR-801");
  });

  it("validates cockpit, approval, automation, readiness and assistant domains", () => {
    resetProductionCertificationHarnessForTests();
    configureExecutiveTestEnvironment();
    const rules = resolveExecutiveOperationsRules(TEST_CONTEXT);
    assert.equal(validateCockpitOperations(rules, TEST_CONTEXT).blockers.length, 0);
    assert.equal(validateApprovalFlow(rules, TEST_CONTEXT).blockers.length, 0);
    assert.equal(validateAutomationCentre(rules, TEST_CONTEXT).blockers.length, 0);
    assert.equal(validateReadinessVisibility(rules, TEST_CONTEXT).blockers.length, 0);
    assert.equal(validateGlobalAiAssistant(rules, TEST_CONTEXT).blockers.length, 0);
    assert.equal(validateExecutiveActionSafety(rules, TEST_CONTEXT).blockers.length, 0);
  });

  it("registers all required executive operations Brain tools", () => {
    const names = new Set(executiveOperationsTools.map((tool) => tool.name));
    for (const toolName of [
      "executive_operations_overview",
      "executive_operations_scan",
      "executive_operations_score",
      "executive_operations_blockers",
      "executive_operations_risks",
      "executive_operations_recommendations",
      "executive_operations_status",
    ]) {
      assert.equal(names.has(toolName), true, `Missing Brain tool: ${toolName}`);
    }
  });

  it("passes Pillow governance for executive operations", () => {
    resetProductionCertificationHarnessForTests();
    configureExecutiveTestEnvironment();
    const result = validateExecutiveOperationsPillowGovernance({
      ...TEST_ACTOR,
      operation: "executive_scan",
    });
    assert.equal(result.allowed, true);
    assert.equal(result.executiveActionAuthority, true);
    assert.equal(result.approvalAuthority, true);
    assert.equal(result.visibilityAuthority, true);
    assert.equal(result.certificationAuthority, true);
  });

  it("runs executive operations scan with cockpit health and action safety", () => {
    resetProductionCertificationHarnessForTests();
    configureExecutiveTestEnvironment();
    const scan = runExecutiveOperationsScan(TEST_ACTOR);
    assert.ok(scan.scanId);
    assert.ok(["pass", "pass_with_conditions", "warning"].includes(scan.status));
    assert.equal(scan.actionSafety.actionSafe, true);
    assert.equal(scan.discoverySource, "REG-CERTIFICATION-EXECUTIVE");

    const overview = getExecutiveOperationsOverview(TEST_CONTEXT);
    assert.equal(overview.lastScanId, scan.scanId);
  });

  it("records executive EKLS observations through Pillow", () => {
    resetProductionCertificationHarnessForTests();
    configureExecutiveTestEnvironment();
    assert.deepEqual(listExecutiveOperationsEklsKinds(), [...EXECUTIVE_OPERATIONS_EKLS_KINDS]);
    runExecutiveOperationsScan(TEST_ACTOR);

    const search = searchExecutiveOperationsEklsObservations({
      actorId: TEST_ACTOR.actorId,
      workspaceId: TEST_ACTOR.workspaceId,
      kind: "executive_operations_scan_completed",
      pillowGovernance: true,
    });
    assert.ok(search.length >= 1);
  });

  it("exposes Cockpit executive operations backend contract", () => {
    resetProductionCertificationHarnessForTests();
    configureExecutiveTestEnvironment();
    const scan = runExecutiveOperationsScan(TEST_ACTOR);
    const overview = getExecutiveOperationsOverview(TEST_CONTEXT);
    const view = buildCockpitExecutiveOperationsView({ overview, scan });
    assert.equal(view.viewId, "cockpit-executive-operations");
    assert.equal(view.certificationStatus, scan.status);
    assert.equal(view.approvalVisibility, true);
    assert.equal(view.automationVisibility, true);
    assert.equal(view.readinessVisibility, true);
    assert.ok(view.recommendations.length >= 1);
  });

  it("supports executive validator plugins without modifying certification core", () => {
    resetProductionCertificationHarnessForTests();
    configureExecutiveTestEnvironment();
    const registered = registerExecutiveOperationsPlugin({
      manifest: {
        pluginId: "test-executive-plugin",
        pluginName: "Test Executive Plugin",
        validatorKind: "executive",
        pillowGovernance: true,
      },
      hooks: {
        pluginId: "test-executive-plugin",
        validatorKind: "executive",
        validate: () => [],
      },
      ...TEST_ACTOR,
    });
    assert.equal(registered.accepted, true);
    runExecutiveOperationsScan(TEST_ACTOR);
  });

  it("runs executive scan via Brain tool handler", async () => {
    resetProductionCertificationHarnessForTests();
    configureExecutiveTestEnvironment();
    const tool = executiveOperationsTools.find((entry) => entry.name === "executive_operations_scan");
    assert.ok(tool);
    const result = await tool!.handler(
      { workspaceId: TEST_ACTOR.workspaceId, actorId: TEST_ACTOR.actorId },
      { workspaceId: TEST_ACTOR.workspaceId, agentId: "test-agent", correlationId: "corr-g6-07" },
    );
    assert.ok((result as { scanId: string }).scanId);
  });

  it("runs certification probe for executive operations scan check", async () => {
    resetProductionCertificationHarnessForTests();
    configureExecutiveTestEnvironment();
    const { runCertificationCheck } = await import(
      "../../orchestration/production-certification/services/certification-runner-service.js"
    );
    const result = await runCertificationCheck({
      context: TEST_CONTEXT,
      checkId: "cert-check-executive-operations-scan",
      ...TEST_ACTOR,
    });
    assert.ok(["pass", "pass_with_conditions", "warning"].includes(result.status));
  });

  it("detects executive blockers when approval visibility is missing", () => {
    resetProductionCertificationHarnessForTests();
    configureExecutiveTestEnvironment();
    process.env.EXEC_MISSING_APPROVAL_VISIBILITY = "true";
    const scan = runExecutiveOperationsScan(TEST_ACTOR);
    assert.ok(scan.blockers.length >= 1 || scan.warnings.length >= 1);
    process.env.EXEC_MISSING_APPROVAL_VISIBILITY = "false";
  });

  it("does not expose credentials or private data in scan output", () => {
    resetProductionCertificationHarnessForTests();
    configureExecutiveTestEnvironment();
    const scan = runExecutiveOperationsScan(TEST_ACTOR);
    const serialized = JSON.stringify(scan);
    assert.equal(serialized.includes("sk_live"), false);
    assert.equal(serialized.includes("api_key"), false);
    assert.equal(serialized.includes("password"), false);
    assert.equal(serialized.includes("token"), false);
  });
});
