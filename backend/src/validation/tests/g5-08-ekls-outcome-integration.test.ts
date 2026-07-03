import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  createBusinessAutomationModuleContract,
  dispatchNextQueuedAutomation,
  dispatchToWorkflowScheduler,
  getAutomationQueue,
  getEklsOutcomeIntegration,
  loadAutomationDetailView,
  outcomePluginRegistry,
  previewOutcomePolicy,
  resetBusinessAutomationHarnessForTests,
  runAutomationToCompletion,
  setAutomationBrainDispatch,
} from "../../orchestration/business-automation/index.js";
import {
  validateEklsOutcomeGovernance,
  validateLearningRecordQuality,
} from "../../orchestration/business-automation/governance/ekls-outcome-pillow-governance.js";
import { KNOWLEDGE_LIFECYCLE_STATES } from "../../orchestration/business-automation/contracts/ekls-outcome-types.js";
import { resolveStoreBackend } from "../../orchestration/pillow/ekls/storage/store-registry.js";
import {
  resetAutomationRegistryBatchForTests,
  resetRegistryLoaderForTests,
} from "../../registry/index.js";
import { configureValidationEnvironment } from "../harness.js";

configureValidationEnvironment();

function resetG508Harness(): void {
  resetRegistryLoaderForTests();
  resetAutomationRegistryBatchForTests();
  resetBusinessAutomationHarnessForTests();
}

function seedWaitingQueueEntry(workspaceId: string, correlationId: string): string {
  const request = dispatchToWorkflowScheduler(
    {
      triggerContext: {
        triggerId: "trg-foundation-decision-gate",
        source: "manual_executive",
        workspaceId,
        environment: "validation",
        registryReferences: {
          triggerId: "trg-foundation-decision-gate",
          triggerVersion: "1.0.0",
          workflowId: "wf-foundation-decision-orchestration",
          workflowVersion: "1.0.0",
          policyId: "pol-foundation-default",
        },
        timestamp: new Date().toISOString(),
        priority: "normal",
        correlationId,
        approvalState: "not_required",
      },
      workflowRef: { id: "wf-foundation-decision-orchestration", version: "1.0.0" },
      registryRefs: {
        triggerId: "trg-foundation-decision-gate",
        triggerVersion: "1.0.0",
        workflowId: "wf-foundation-decision-orchestration",
        workflowVersion: "1.0.0",
        policyId: "pol-foundation-default",
      },
      approvalRouting: { required: false, approvalState: "not_required", reason: "ok" },
      correlationId,
    },
    { actorId: "actor_g508" },
  );

  return request.queueId!;
}

async function promoteToWaiting(queueId: string): Promise<void> {
  await dispatchNextQueuedAutomation({});
  const entry = getAutomationQueue().getById(queueId);
  assert.ok(entry);
  assert.equal(entry.executionState, "waiting");
}

async function completeFoundationRun(workspaceId: string, correlationId: string): Promise<string> {
  setAutomationBrainDispatch(async (request) => ({
    correlationId: request.correlationId ?? "mock",
    status: "completed",
    result: { acknowledged: true },
  }));

  const queueId = seedWaitingQueueEntry(workspaceId, correlationId);
  await promoteToWaiting(queueId);

  const { pickupWaitingAutomation } = await import(
    "../../orchestration/business-automation/index.js"
  );
  const pickup = await pickupWaitingAutomation({
    actorId: "actor_g508",
    workspaceId,
    queueId,
  });

  const result = await runAutomationToCompletion({
    actorId: "actor_g508",
    workspaceId,
    executionId: pickup.executionId,
  });

  assert.equal(result.lifecycleState, "workflow_completed");
  return pickup.executionId;
}

describe("G5-08 — EKLS Outcome Integration", () => {
  it("registers outcome_history in EKLS store registry with Pillow-only governance", () => {
    resetG508Harness();
    const backend = resolveStoreBackend("outcome_history");
    assert.ok(backend);
    assert.equal(backend.governance, "pillow-only");
    assert.ok(backend.integrationPath.includes("automation-outcome-store"));
  });

  it("resolves outcome learning policy from REG-AUTOMATION-REPORT, POLICY, and MONITOR", () => {
    resetG508Harness();
    const policy = previewOutcomePolicy({
      workflowId: "wf-foundation-decision-orchestration",
      policyRegistryId: "pol-foundation-default",
    });

    assert.ok(policy.reportRegistryIds.includes("rpt-foundation-executive-summary"));
    assert.ok(policy.reportHooks.includes("executive-audit:automation-run-complete"));
    assert.ok(policy.monitorRegistryIds.includes("mon-foundation-run-health"));
    assert.equal(policy.policyRegistryId, "pol-foundation-default");
  });

  it("captures structured learning on workflow completion through Pillow governance", async () => {
    resetG508Harness();
    const executionId = await completeFoundationRun("ws_g508_capture", "corr-g508-capture");

    const record = getEklsOutcomeIntegration().getLearningByExecution(executionId);
    assert.ok(record);
    assert.ok(record!.learningId);
    assert.equal(record!.executionId, executionId);
    assert.equal(record!.workflowId, "wf-foundation-decision-orchestration");
    assert.equal(record!.outcome, "completed");
    assert.equal(record!.workspaceId, "ws_g508_capture");
    assert.equal(record!.correlationId, "corr-g508-capture");
    assert.equal(record!.pillowGovernance, true);
    assert.equal(record!.eklsObjectType, "outcome");
    assert.equal(record!.lifecycleState, "index");
    assert.ok(record!.businessEngines.length >= 4);
    assert.ok(record!.executionTimeline.length >= 1);
    assert.ok(record!.lessonsLearned.length >= 1);
    assert.ok(record!.reportHookIds.includes("executive-audit:automation-run-complete"));
    assert.ok(typeof record!.supportingEvidence.workflowOutcome === "string");
    assert.ok(record!.performanceMetrics.completedStepCount !== undefined);
  });

  it("fulfills the learning contract with required lifecycle states", () => {
    resetG508Harness();
    assert.deepEqual(KNOWLEDGE_LIFECYCLE_STATES, [
      "capture",
      "validate",
      "govern",
      "store",
      "index",
      "version",
      "retrieve",
      "reference",
      "archive",
    ]);

    const contract = createBusinessAutomationModuleContract();
    assert.equal(contract.missionId, "G5-10");
    assert.ok(contract.capabilities.includes("business-automation.get_learning"));
    assert.ok(contract.capabilities.includes("business-automation.search_learning"));
    assert.ok(contract.capabilities.includes("business-automation.related_executions"));
    assert.ok(contract.capabilities.includes("business-automation.outcome_policy_preview"));
  });

  it("validates Pillow governance and learning record quality", () => {
    resetG508Harness();
    const allowed = validateEklsOutcomeGovernance({
      pillowGovernance: true,
      actorId: "actor_g508",
      workspaceId: "ws_g508",
      operation: "store",
    });
    assert.equal(allowed.allowed, true);
    assert.equal(allowed.eklsGoverned, true);

    const quality = validateLearningRecordQuality({
      learningId: "learn-1",
      workflowId: "wf-test",
      executionId: "exec-1",
      workspaceId: "ws_g508",
      businessEngines: [],
      executionTimeline: [],
      outcome: "completed",
      supportingEvidence: {},
      performanceMetrics: {},
      lessonsLearned: [],
      operationalInsights: [],
      confidence: 1.5,
      timestamp: new Date().toISOString(),
      correlationId: "corr-1",
      triggerId: "trg-1",
      queueId: "q-1",
      lifecycleState: "store",
      reportHookIds: [],
      executiveAiRefs: [],
      pillowGovernance: true,
      eklsObjectType: "outcome",
      version: 1,
    });
    assert.equal(quality.allowed, false);
    assert.ok(quality.reason.includes("confidence"));
  });

  it("exposes Brain EKLS outcome tools for retrieve, search, related executions, and policy preview", async () => {
    resetG508Harness();
    const executionId = await completeFoundationRun("ws_g508_brain", "corr-g508-brain");

    const { eklsOutcomeTools } = await import(
      "../../orchestration/business-automation/tools/ekls-outcome-tools.js"
    );

    const getTool = eklsOutcomeTools.find((tool) => tool.name === "business_automation.get_learning");
    const searchTool = eklsOutcomeTools.find((tool) => tool.name === "business_automation.search_learning");
    const relatedTool = eklsOutcomeTools.find(
      (tool) => tool.name === "business_automation.related_executions",
    );
    const policyTool = eklsOutcomeTools.find(
      (tool) => tool.name === "business_automation.outcome_policy_preview",
    );

    assert.ok(getTool && searchTool && relatedTool && policyTool);

    const getResult = (await getTool!.handler({ executionId }, {
      workspaceId: "ws_g508_brain",
      agentId: "actor_g508",
      correlationId: "corr-g508-brain",
    })) as { found: boolean; record?: { learningId: string } };
    assert.equal(getResult.found, true);
    assert.ok(getResult.record?.learningId);

    const searchResult = (await searchTool!.handler(
      { workspaceId: "ws_g508_brain", actorId: "actor_g508" },
      { workspaceId: "ws_g508_brain", agentId: "actor_g508", correlationId: "corr-g508-brain" },
    )) as { totalCount: number };
    assert.ok(searchResult.totalCount >= 1);

    const relatedResult = (await relatedTool!.handler({ executionId }, {
      workspaceId: "ws_g508_brain",
      agentId: "actor_g508",
      correlationId: "corr-g508-brain",
    })) as { relatedCount: number };
    assert.equal(typeof relatedResult.relatedCount, "number");

    const policyResult = (await policyTool!.handler(
      { workflowId: "wf-foundation-decision-orchestration", policyRegistryId: "pol-foundation-default" },
      { workspaceId: "ws_g508_brain", agentId: "actor_g508", correlationId: "corr-g508-brain" },
    )) as { reportHooks: string[] };
    assert.ok(policyResult.reportHooks.length >= 1);
  });

  it("skips duplicate learning capture for the same execution", async () => {
    resetG508Harness();
    const executionId = await completeFoundationRun("ws_g508_dup", "corr-g508-dup");
    const integration = getEklsOutcomeIntegration();
    const runSnapshot = (await import("../../orchestration/business-automation/index.js")).getAutomationRunSnapshot(
      "ws_g508_dup",
    );
    const run = runSnapshot.runs.find((item) => item.executionId === executionId);
    assert.ok(run);

    const duplicate = integration.captureTerminalOutcome({
      run: run!,
      actorId: "actor_g508",
      lifecycleState: "workflow_completed",
    });
    assert.equal("skipped" in duplicate && duplicate.skipped, true);
  });

  it("supports outcome plugins without modifying integration core", async () => {
    resetG508Harness();
    outcomePluginRegistry.registerKnowledgeProvider({
      pluginId: "test-knowledge-provider",
      provide: () => ({
        lessonsLearned: ["Plugin-derived operational insight"],
        confidence: 0.95,
      }),
    });
    outcomePluginRegistry.registerEvidenceEnricher({
      pluginId: "test-evidence-enricher",
      enrich: ({ evidence }) => ({ ...evidence, pluginEnriched: true }),
    });

    const executionId = await completeFoundationRun("ws_g508_plugin", "corr-g508-plugin");
    const record = getEklsOutcomeIntegration().getLearningByExecution(executionId);
    assert.ok(record);
    assert.ok(record!.lessonsLearned.some((lesson) => lesson.includes("Plugin-derived")));
    assert.equal(record!.supportingEvidence.pluginEnriched, true);
    assert.equal(record!.confidence, 0.95);
  });

  it("exposes EKLS learning references in Cockpit automation detail view", async () => {
    resetG508Harness();
    const executionId = await completeFoundationRun("ws_g508_cockpit", "corr-g508-cockpit");

    const detail = loadAutomationDetailView("ws_g508_cockpit", executionId);
    assert.ok(detail);
    assert.ok(detail!.eklsLearning.learningId);
    assert.ok(detail!.eklsLearning.lessonsLearnedHref?.includes(executionId));
    assert.ok(detail!.eklsLearning.historicalOutcomes.some((row) => row.label === "completed"));
    assert.ok(detail!.eklsLearning.lessonsLearned!.length >= 1);
  });
});
