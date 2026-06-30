import assert from "node:assert/strict";
import { afterEach, beforeEach, describe, it } from "node:test";

import { resetDatabaseInstance } from "../../brain/database.js";
import type { ToolContext } from "../../brain/types.js";
import {
  COMMERCE_RUNTIME_EXECUTION_BLOCKED,
  commerceRuntimeTools,
  createCommerceRuntimeModuleContract,
  createExecutionPlan,
  createRuntimeContext,
  dispatchPlanById,
  normalizeExecutionRequest,
  publishRuntimeEvent,
  resolveCapabilities,
  buildCommerceRuntimeDashboard,
  buildRuntimeRegistry,
  resetCommerceRuntimeRepository,
} from "../../runtime/commerce-runtime/index.js";
import { configureValidationEnvironment } from "../harness.js";

const WORKSPACE_ID = "ws-crt001";
const COMPANY_ID = "co-grand-king";

function toolContext(): ToolContext {
  return {
    workspaceId: WORKSPACE_ID,
    agentId: "commerce-runtime",
    correlationId: "corr-crt001",
  };
}

async function invokeTool(name: string, args: Record<string, unknown> = {}) {
  const tool = commerceRuntimeTools.find((entry) => entry.name === name);
  assert.ok(tool, `tool ${name} should be registered`);
  return tool.handler({ workspaceId: WORKSPACE_ID, companyId: COMPANY_ID, ...args }, toolContext());
}

describe("CRT-001 Commerce Runtime", () => {
  beforeEach(() => {
    configureValidationEnvironment();
    resetDatabaseInstance();
    resetCommerceRuntimeRepository();
  });

  afterEach(() => {
    resetCommerceRuntimeRepository();
    resetDatabaseInstance();
  });

  it("exposes CRT-001 module contract with execution blocked", () => {
    const contract = createCommerceRuntimeModuleContract();
    assert.equal(contract.moduleId, "commerce-runtime");
    assert.equal(contract.missionId, "CRT-001");
    assert.equal(contract.protection.noLiveExecution, true);
    assert.equal(COMMERCE_RUNTIME_EXECUTION_BLOCKED, true);
    assert.ok(contract.integratesWith.includes("reality-integration"));
    assert.ok(contract.integratesWith.includes("empire-self-inspection"));
  });

  it("creates runtime context with SIMULATED environment by default", () => {
    const context = createRuntimeContext({
      workspaceId: WORKSPACE_ID,
      companyId: COMPANY_ID,
      businessId: "biz-1",
      marketplaceId: "shopify",
    });
    assert.equal(context.workspaceId, WORKSPACE_ID);
    assert.equal(context.environment, "SIMULATED");
    assert.ok(context.contextId);
    assert.ok(context.correlationId);
  });

  it("normalizes pipeline requests and routes to marketplace kernel for publish_product", () => {
    const result = normalizeExecutionRequest({
      workspaceId: WORKSPACE_ID,
      companyId: COMPANY_ID,
      operation: "publish_product",
      productId: "prod-1",
    });
    assert.equal(result.routedKernel, "marketplace");
    assert.equal(result.executionBlocked, true);
    assert.equal(result.request.operation, "publish_product");
  });

  it("resolves publish_product capabilities with blocked adapters from reality catalog", () => {
    const resolution = resolveCapabilities("publish_product");
    assert.equal(resolution.operation, "publish_product");
    assert.ok(resolution.entries.some((e) => e.adapterId === "shopify"));
    assert.ok(resolution.summary.blocked > 0);
    assert.equal(resolution.entries.find((e) => e.adapterId === "shopify")?.supportLevel, "blocked");
  });

  it("creates deterministic blocked execution plans", () => {
    const planA = createExecutionPlan({
      workspaceId: WORKSPACE_ID,
      companyId: COMPANY_ID,
      operation: "publish_product",
      productId: "prod-1",
      marketplaceId: "shopify",
    });
    const planB = createExecutionPlan({
      workspaceId: WORKSPACE_ID,
      companyId: COMPANY_ID,
      operation: "publish_product",
      productId: "prod-1",
      marketplaceId: "shopify",
    });
    assert.equal(planA.status, "BLOCKED");
    assert.equal(planA.executionBlocked, true);
    assert.equal(planA.deterministicHash, planB.deterministicHash);
    assert.ok(planA.steps.length >= 3);
  });

  it("dispatches plan to adapter interfaces without live execution", async () => {
    const plan = createExecutionPlan({
      workspaceId: WORKSPACE_ID,
      companyId: COMPANY_ID,
      operation: "capture_payment",
    });
    const dispatch = dispatchPlanById(plan.planId, WORKSPACE_ID, COMPANY_ID);
    assert.ok(dispatch);
    assert.equal(dispatch!.status, "BLOCKED");
    assert.equal(dispatch!.executionBlocked, true);
    assert.ok(dispatch!.routedSteps.length > 0);
  });

  it("publishes universal runtime events with lifecycle progression", () => {
    const event = publishRuntimeEvent({
      eventType: "RuntimePlanCreated",
      workspaceId: WORKSPACE_ID,
      companyId: COMPANY_ID,
      adapterId: "commerce-runtime",
      verification: "SIMULATED",
    });
    assert.equal(event.lifecycle, "PROCESSED");
    assert.equal(event.verification, "SIMULATED");
  });

  it("seeds adapter registry from reality-integration catalog", () => {
    const registry = buildRuntimeRegistry();
    assert.ok(registry.totalAdapters > 20);
    assert.ok((registry.byKind.marketplace ?? 0) > 0);
    assert.ok((registry.byKind.supplier ?? 0) > 0);
    assert.ok(registry.adapters.every((a) => a.executionBlocked === true));
  });

  it("builds commerce runtime dashboard for Grand King mission control", () => {
    createExecutionPlan({
      workspaceId: WORKSPACE_ID,
      companyId: COMPANY_ID,
      operation: "publish_product",
    });
    const dashboard = buildCommerceRuntimeDashboard(WORKSPACE_ID, COMPANY_ID);
    assert.equal(dashboard.moduleId, "commerce-runtime");
    assert.equal(dashboard.missionId, "CRT-001");
    assert.equal(dashboard.runtimeHealth.runtime.executionBlocked, true);
    assert.ok(dashboard.registeredAdapters.length > 0);
    assert.ok(dashboard.capabilityCoverage.length > 0);
    assert.ok(dashboard.pendingPlans.length >= 1);
  });

  it("registers commerce runtime brain tools", async () => {
    assert.equal(commerceRuntimeTools.length, 11);
    const dashboard = await invokeTool("commerce_runtime.dashboard");
    assert.equal((dashboard as { moduleId: string }).moduleId, "commerce-runtime");
    const registry = await invokeTool("commerce_runtime.registry");
    assert.ok((registry as { totalAdapters: number }).totalAdapters > 0);
  });
});
