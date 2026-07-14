import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  AUTOMATION_REGISTRY_IDS,
  AutomationRegistryValidationError,
  REG_AUTOMATION_TRIGGER,
  REG_AUTOMATION_WORKFLOW,
  REG_AUTOMATION_POLICY,
  RegistryLoader,
  getRegistryLoader,
  resetAutomationRegistryBatchForTests,
  resetRegistryLoaderForTests,
  validateAutomationRegistryBatch,
  validateAutomationRegistryRows,
} from "../../registry/index.js";
import {
  listAutomationRegistryIds,
  resolveAllAutomationRegistries,
  resolveAutomationRegistry,
} from "../../orchestration/business-automation/index.js";
import type { AutomationWorkflowRow, AutomationTriggerRow } from "../../registry/types/automation-registry-types.js";
import type { AutomationRegistryId } from "../../registry/types/registry-ids.js";
import { configureValidationEnvironment } from "../harness.js";

configureValidationEnvironment();

describe("G5-01 — Automation Registry Foundation", () => {
  it("exposes all ten automation registry ids for dynamic discovery", () => {
    assert.equal(AUTOMATION_REGISTRY_IDS.length, 10);
    assert.deepEqual(listAutomationRegistryIds(), AUTOMATION_REGISTRY_IDS);
  });

  it("marks automation registries as wired in foundation status", () => {
    const loader = getRegistryLoader();
    const status = loader.listFoundationStatus();
    for (const registryId of AUTOMATION_REGISTRY_IDS) {
      const entry = status.find((item) => item.registryId === registryId);
      assert.ok(entry, `missing foundation status for ${registryId}`);
      assert.equal(entry.wired, true, `${registryId} should be wired`);
    }
  });

  it("loads foundation workflow rows via RegistryLoader", () => {
    resetRegistryLoaderForTests();
    resetAutomationRegistryBatchForTests();
    const result = getRegistryLoader().resolve({}, REG_AUTOMATION_WORKFLOW);
    assert.equal(result.meta.wired, true);
    assert.equal(result.meta.version, "g5-01-v1");
    assert.equal(result.meta.tier, "policy_topology");
    assert.ok(result.rows.length >= 1);
    const workflow = result.rows[0] as { id: string; steps: unknown[] };
    assert.equal(workflow.id, "wf-foundation-decision-orchestration");
    assert.ok(workflow.steps.length >= 3);
  });

  it("filters automation rows by registryRowId query", () => {
    resetRegistryLoaderForTests();
    resetAutomationRegistryBatchForTests();
    const result = getRegistryLoader().resolve({}, REG_AUTOMATION_TRIGGER, {
      registryRowId: "trg-foundation-decision-gate",
    });
    assert.equal(result.rows.length, 1);
    assert.equal((result.rows[0] as { id: string }).id, "trg-foundation-decision-gate");
  });

  it("resolves all automation registries through business-automation resolver", () => {
    resetRegistryLoaderForTests();
    resetAutomationRegistryBatchForTests();
    const catalog = resolveAllAutomationRegistries({});
    for (const registryId of AUTOMATION_REGISTRY_IDS) {
      assert.ok(catalog[registryId]);
      assert.equal(catalog[registryId].meta.wired, true);
      assert.ok(catalog[registryId].rows.length >= 1);
    }
  });

  it("caches automation registry resolves within policy TTL", () => {
    resetRegistryLoaderForTests();
    resetAutomationRegistryBatchForTests();
    const loader = new RegistryLoader();
    const first = loader.resolve({}, REG_AUTOMATION_POLICY);
    const second = loader.resolve({}, REG_AUTOMATION_POLICY);
    assert.equal(first.meta.contentHash, second.meta.contentHash);
    assert.equal(first.meta.loadedAt, second.meta.loadedAt);
  });

  it("accepts automation plugin manifest registration", () => {
    resetRegistryLoaderForTests();
    const loader = getRegistryLoader();
    const result = loader.registerPlugin({
      pluginId: "g5-test-trigger-plugin",
      kind: "automation_trigger",
      targetRegistryId: REG_AUTOMATION_TRIGGER,
      tier: "policy_topology",
      version: "0.0.1",
      description: "G5-01 plugin registration test",
      extensions: { triggerType: "event" },
    });
    assert.equal(result.accepted, true);
  });

  it("rejects duplicate automation registry row ids", () => {
    assert.throws(
      () =>
        validateAutomationRegistryRows(REG_AUTOMATION_WORKFLOW, [
          {
            id: "dup-id",
            name: "A",
            description: "A",
            status: "DRAFT",
            version: "1.0.0",
            owner: "pillow:governance",
            dependencies: [],
            capabilities: [],
            configuration: {},
            validation: { schemaVersion: "g5-01-v1" },
            pluginSupport: { allowPluginRegistration: true },
            workspaceScope: { scope: "global" },
            futureCompatibility: { minSchemaVersion: "g5-01-v1" },
            steps: [
              {
                stepId: "only",
                executorType: "brain_dispatch",
                executorRef: "module:action",
              },
            ],
          },
          {
            id: "dup-id",
            name: "B",
            description: "B",
            status: "DRAFT",
            version: "1.0.0",
            owner: "pillow:governance",
            dependencies: [],
            capabilities: [],
            configuration: {},
            validation: { schemaVersion: "g5-01-v1" },
            pluginSupport: { allowPluginRegistration: true },
            workspaceScope: { scope: "global" },
            futureCompatibility: { minSchemaVersion: "g5-01-v1" },
            steps: [
              {
                stepId: "only",
                executorType: "brain_dispatch",
                executorRef: "module:action",
              },
            ],
          },
        ]),
      AutomationRegistryValidationError,
    );
  });

  it("rejects malformed automation registry rows", () => {
    assert.throws(
      () => validateAutomationRegistryRows(REG_AUTOMATION_TRIGGER, [{ id: "bad" }]),
      AutomationRegistryValidationError,
    );
  });

  it("rejects invalid workflow dependency chains", () => {
    assert.throws(
      () =>
        validateAutomationRegistryBatch({
          "REG-AUTOMATION-TRIGGER": [],
          "REG-AUTOMATION-WORKFLOW": [
            {
              id: "wf-bad-cycle",
              name: "Bad Cycle",
              description: "cycle",
              status: "DRAFT",
              version: "1.0.0",
              owner: "pillow:governance",
              dependencies: [],
              capabilities: [],
              configuration: {},
              validation: { schemaVersion: "g5-01-v1" },
              pluginSupport: { allowPluginRegistration: true },
              workspaceScope: { scope: "global" },
              futureCompatibility: { minSchemaVersion: "g5-01-v1" },
              steps: [
                {
                  stepId: "a",
                  executorType: "brain_dispatch",
                  executorRef: "module:a",
                  dependsOn: ["b"],
                },
                {
                  stepId: "b",
                  executorType: "brain_dispatch",
                  executorRef: "module:b",
                  dependsOn: ["a"],
                },
              ],
            } satisfies AutomationWorkflowRow,
          ],
          "REG-AUTOMATION-SCHEDULE": [],
          "REG-AUTOMATION-POLICY": [],
          "REG-AUTOMATION-APPROVAL": [],
          "REG-AUTOMATION-EXECUTOR": [],
          "REG-AUTOMATION-RECOVERY": [],
          "REG-AUTOMATION-NOTIFICATION": [],
          "REG-AUTOMATION-REPORT": [],
          "REG-AUTOMATION-MONITOR": [],
        } as unknown as Parameters<typeof validateAutomationRegistryBatch>[0]),
      AutomationRegistryValidationError,
    );
  });

  it("rejects unknown cross-registry dependencies", () => {
    assert.throws(
      () =>
        validateAutomationRegistryBatch({
          "REG-AUTOMATION-TRIGGER": [
            {
              id: "trg-bad-dep",
              name: "Bad Trigger",
              description: "bad dep",
              status: "DRAFT",
              version: "1.0.0",
              owner: "pillow:governance",
              dependencies: ["missing-workflow-ref"],
              capabilities: [],
              configuration: {},
              validation: { schemaVersion: "g5-01-v1" },
              pluginSupport: { allowPluginRegistration: true },
              workspaceScope: { scope: "global" },
              futureCompatibility: { minSchemaVersion: "g5-01-v1" },
              triggerType: "manual",
              workflowRef: { id: "wf-missing", version: "1.0.0" },
            },
          ],
          "REG-AUTOMATION-WORKFLOW": [],
          "REG-AUTOMATION-SCHEDULE": [],
          "REG-AUTOMATION-POLICY": [],
          "REG-AUTOMATION-APPROVAL": [],
          "REG-AUTOMATION-EXECUTOR": [],
          "REG-AUTOMATION-RECOVERY": [],
          "REG-AUTOMATION-NOTIFICATION": [],
          "REG-AUTOMATION-REPORT": [],
          "REG-AUTOMATION-MONITOR": [],
        } as unknown as Parameters<typeof validateAutomationRegistryBatch>[0]),
      AutomationRegistryValidationError,
    );
  });

  it("validates foundation seed batch without hardcoded business entities", () => {
    resetAutomationRegistryBatchForTests();
    const catalog = resolveAllAutomationRegistries({});
    const serialized = JSON.stringify(catalog);
    const forbidden = ["amazon-us", "walmart-us", "SG", "US", "CJ", "supplier-"];
    for (const token of forbidden) {
      assert.equal(
        serialized.includes(token),
        false,
        `foundation seed must not hardcode business entity token: ${token}`,
      );
    }
  });

  it("resolves trigger registry through business-automation resolver", () => {
    resetRegistryLoaderForTests();
    resetAutomationRegistryBatchForTests();
    const result = resolveAutomationRegistry({}, REG_AUTOMATION_TRIGGER);
    assert.ok(result.rows.length >= 1);
    const trigger = result.rows[0] as AutomationTriggerRow;
    assert.equal(trigger.triggerType, "decision");
    assert.equal(trigger.workflowRef.id, "wf-foundation-decision-orchestration");
  });
});
