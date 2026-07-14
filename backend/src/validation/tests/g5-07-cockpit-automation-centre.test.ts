import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  automationCentrePluginRegistry,
  loadAutomationCentreView,
  loadAutomationDetailView,
  loadAutomationTimelineView,
  resetBusinessAutomationHarnessForTests,
  resolveAutomationCentreRegistryHealth,
} from "../../orchestration/business-automation/index.js";
import {
  resetAutomationRegistryBatchForTests,
  resetRegistryLoaderForTests,
} from "../../registry/index.js";
import { configureValidationEnvironment } from "../harness.js";

configureValidationEnvironment();

function resetG507Harness(): void {
  resetRegistryLoaderForTests();
  resetAutomationRegistryBatchForTests();
  resetBusinessAutomationHarnessForTests();
}

describe("G5-07 — Cockpit Automation Centre", () => {
  it("loads automation centre dashboard with executive overview sections", () => {
    resetG507Harness();
    const view = loadAutomationCentreView("ws_g507");

    assert.equal(view.screenId, "SCR-303");
    assert.equal(view.workspaceId, "ws_g507");
    assert.ok(view.overview);
    assert.ok(Array.isArray(view.kpis));
    assert.equal(view.kpis.length, 6);
    assert.ok(Array.isArray(view.attentionItems));
    assert.ok(Array.isArray(view.runningWorkflows));
    assert.ok(Array.isArray(view.approvalQueue));
    assert.ok(Array.isArray(view.recoveryOperations));
    assert.ok(Array.isArray(view.registryHealth));
    assert.ok(Array.isArray(view.recentActivity));
    assert.ok(Array.isArray(view.relationshipLinks));
    assert.ok(view.relationshipLinks.some((link) => link.module === "executive-home"));
  });

  it("resolves registry health from REG-WORKFLOW, MONITOR, REPORT, and NOTIFICATION", () => {
    resetG507Harness();
    const health = resolveAutomationCentreRegistryHealth();

    assert.ok(health.some((row) => row.registryType.includes("WORKFLOW")));
    assert.ok(health.some((row) => row.registryType.includes("MONITOR")));
    assert.ok(health.some((row) => row.registryType.includes("REPORT")));
    assert.ok(health.some((row) => row.registryType.includes("NOTIFICATION")));
    assert.ok(health.every((row) => row.registryId.length > 0));
  });

  it("returns null detail view for unknown automation id", () => {
    resetG507Harness();
    const detail = loadAutomationDetailView("ws_g507", "unknown-automation-id");
    assert.equal(detail, null);
  });

  it("builds workflow timeline phases from trigger through final outcome", () => {
    resetG507Harness();
    const timeline = loadAutomationTimelineView("ws_g507", "unknown-id");
    assert.equal(timeline, null);

    const centre = loadAutomationCentreView("ws_g507");
    assert.ok(centre.computedAt);
    assert.equal(centre.dataMode, "sandbox");
  });

  it("supports plugin widgets without modifying cockpit core", () => {
    resetG507Harness();
    automationCentrePluginRegistry.registerWidget({
      pluginId: "test-monitor-widget",
      title: "Test Monitor",
      buildSummary: () => ({ summary: "Plugin monitor summary" }),
    });

    const view = loadAutomationCentreView("ws_g507_plugin");
    assert.ok(view.pluginWidgets.some((widget) => widget.pluginId === "test-monitor-widget"));
  });

  it("exposes Brain cockpit-automation tools for load, detail, timeline, and actions", async () => {
    resetG507Harness();
    const { cockpitAutomationTools } = await import(
      "../../orchestration/business-automation/tools/cockpit-automation-tools.js"
    );

    assert.ok(cockpitAutomationTools.some((tool) => tool.name === "cockpit_automation.load_view"));
    assert.ok(cockpitAutomationTools.some((tool) => tool.name === "cockpit_automation.load_detail"));
    assert.ok(cockpitAutomationTools.some((tool) => tool.name === "cockpit_automation.load_timeline"));
    assert.ok(cockpitAutomationTools.some((tool) => tool.name === "cockpit_automation.execute_action"));
  });

  it("blocks executive actions when Pillow kill switch is active", async () => {
    resetG507Harness();
    const { cockpitAutomationTools } = await import(
      "../../orchestration/business-automation/tools/cockpit-automation-tools.js"
    );
    const executeTool = cockpitAutomationTools.find((tool) => tool.name === "cockpit_automation.execute_action");
    assert.ok(executeTool);

    const result = (await executeTool!.handler(
      {
        workspaceId: "ws_g507",
        actorId: "actor_g507",
        action: "pause",
        executionId: "exec-test",
        killSwitchActive: true,
      },
      { workspaceId: "ws_g507", agentId: "test", correlationId: "corr" },
    )) as { success: boolean; reason: string };

    assert.equal(result.success, false);
    assert.ok(result.reason.includes("Kill switch"));
  });

  it("provides accessibility-oriented empty states when no automations exist", () => {
    resetG507Harness();
    const view = loadAutomationCentreView("ws_g507_empty");

    assert.equal(view.runningWorkflows.length, 0);
    assert.equal(view.failedWorkflows.length, 0);
    assert.equal(view.approvalQueue.length, 0);
    assert.equal(view.recoveryOperations.length, 0);
  });
});
