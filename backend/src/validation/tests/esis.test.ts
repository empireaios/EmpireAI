import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { afterEach, beforeEach, describe, it } from "node:test";

import { resetDatabaseInstance } from "../../brain/database.js";
import type { ToolContext } from "../../brain/types.js";
import {
  buildEsisDashboard,
  createEsisModuleContract,
  esisTools,
  generateReviewPackageOnly,
  inspectBackend,
  inspectCommerce,
  inspectConnectors,
  inspectFrontend,
  runEsisInspection,
} from "../../orchestration/empire-self-inspection/index.js";
import { REPO_ROOT, REVIEW_PACKAGE_PATH } from "../../orchestration/empire-self-inspection/services/repo-scanner.js";
import { configureValidationEnvironment } from "../harness.js";

const WORKSPACE_ID = "ws-esis";
const COMPANY_ID = "co-grand-king";

function toolContext(): ToolContext {
  return {
    workspaceId: WORKSPACE_ID,
    agentId: "esis",
    correlationId: "corr-esis",
  };
}

async function invokeTool(name: string, args: Record<string, unknown> = {}) {
  const tool = esisTools.find((entry) => entry.name === name);
  assert.ok(tool, `tool ${name} should be registered`);
  return tool.handler({ workspaceId: WORKSPACE_ID, companyId: COMPANY_ID, ...args }, toolContext());
}

beforeEach(() => {
  configureValidationEnvironment();
  resetDatabaseInstance();
});

afterEach(() => {
  resetDatabaseInstance();
});

describe("Mission S001 Empire Self-Inspection System", () => {
  it("exposes module contract", () => {
    const contract = createEsisModuleContract();
    assert.equal(contract.moduleId, "empire-self-inspection");
    assert.equal(contract.missionId, "S001");
    assert.ok(contract.capabilities.includes("self_inspection"));
  });

  it("registers brain tools", () => {
    assert.equal(esisTools.length, 3);
    assert.ok(esisTools.some((t) => t.name === "empire_inspection.dashboard"));
    assert.ok(esisTools.some((t) => t.name === "empire_inspection.run"));
    assert.ok(esisTools.some((t) => t.name === "empire_inspection.generate_review"));
  });

  it("inspects frontend with deterministic route ordering", () => {
    const result = inspectFrontend();
    assert.ok(result.pages.length >= 10);
    const routes = result.pages.map((p) => p.route);
    assert.deepEqual(routes, [...routes].sort());
    assert.ok(result.pages.some((p) => p.pageComponent === "MissionHomePage"));
  });

  it("inspects backend modules", () => {
    const result = inspectBackend();
    assert.ok(result.modules.length >= 20);
    assert.ok(result.routeCount > 0);
    assert.ok(result.tableCount >= 50);
    const ids = result.modules.map((m) => m.moduleId);
    assert.deepEqual(ids, [...ids].sort());
  });

  it("inspects commerce pipeline stages", () => {
    const result = inspectCommerce(WORKSPACE_ID, COMPANY_ID);
    assert.ok(result.stages.length >= 10);
    assert.ok(result.stages.some((s) => s.stage === "Discovery"));
    assert.ok(result.canonCompliance.length > 0);
  });

  it("inspects connector catalog", () => {
    const result = inspectConnectors(WORKSPACE_ID);
    assert.ok(result.entries.length >= 20);
    assert.ok(result.entries.every((e) => typeof e.blocked === "boolean"));
    const ids = result.entries.map((e) => e.providerId);
    assert.deepEqual(ids, [...ids].sort());
  });

  it("runs full inspection with deterministic hash", () => {
    const a = runEsisInspection({ workspaceId: WORKSPACE_ID, companyId: COMPANY_ID, writePackage: false });
    const b = runEsisInspection({ workspaceId: WORKSPACE_ID, companyId: COMPANY_ID, writePackage: false });
    assert.equal(a.deterministicHash, b.deterministicHash);
    assert.ok(a.executiveSummary.length > 0);
    assert.ok(a.visualMaps.commerceLifecycleGraph.length > 0);
  });

  it("builds ESIS dashboard for Mission Control", () => {
    const dashboard = buildEsisDashboard(WORKSPACE_ID, COMPANY_ID);
    assert.equal(dashboard.workspaceId, WORKSPACE_ID);
    assert.ok(["HEALTHY", "WARNING", "FAILED", "UNKNOWN"].includes(dashboard.systemHealth.state));
    assert.ok(dashboard.systemHealth.score >= 0);
    assert.ok(dashboard.summary.length > 0);
  });

  it("generates review package markdown", () => {
    const testPath = path.join(REPO_ROOT, "EMPIRE_REVIEW_PACKAGE.test.md");
    const { report } = generateReviewPackageOnly({
      workspaceId: WORKSPACE_ID,
      companyId: COMPANY_ID,
      runValidation: false,
      skipSlowTests: true,
    });
    assert.ok(report.reportId);
    assert.ok(fs.existsSync(REVIEW_PACKAGE_PATH));
    const content = fs.readFileSync(REVIEW_PACKAGE_PATH, "utf8");
    assert.ok(content.includes("# EMPIREAI REVIEW PACKAGE"));
    assert.ok(content.includes("Executive Summary"));
    assert.ok(content.includes("Recommended Next Priority"));
    fs.copyFileSync(REVIEW_PACKAGE_PATH, testPath);
    fs.unlinkSync(testPath);
  });

  it("invokes empire_inspection.run tool", async () => {
    const result = await invokeTool("empire_inspection.run");
    assert.ok((result as { deterministicHash: string }).deterministicHash);
  });

  it("invokes empire_inspection.dashboard tool", async () => {
    const result = await invokeTool("empire_inspection.dashboard");
    assert.equal((result as { workspaceId: string }).workspaceId, WORKSPACE_ID);
  });
});
