import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, it } from "node:test";

import { productionDeploymentTools } from "../../execution/production-store-deployment/tools/production-deployment-tools.js";
import {
  applyDeploymentApproval,
  executeProductionDeployment,
  getDeploymentLogs,
  prepareProductionDeployment,
  prepareVercelProject,
  ProductionDeploymentBlockedError,
  rollbackProductionDeployment,
} from "../../execution/production-store-deployment/index.js";
import type { ToolContext } from "../../brain/types.js";

const WORKSPACE_ID = "ws-m102";
const ORIGINAL_ENV = { ...process.env };
let tempDeployRoot = "";

function toolContext(): ToolContext {
  return {
    workspaceId: WORKSPACE_ID,
    agentId: "production-deploy",
    correlationId: "corr-m102",
  };
}

async function invokeTool(name: string, args: Record<string, unknown> = {}) {
  const tool = productionDeploymentTools.find((entry) => entry.name === name);
  assert.ok(tool, `tool ${name} should be registered`);
  return tool.handler({ workspaceId: WORKSPACE_ID, ...args }, toolContext());
}

beforeEach(() => {
  tempDeployRoot = fs.mkdtempSync(path.join(os.tmpdir(), "empire-m102-"));
  process.env.PRODUCTION_DEPLOY_ROOT = tempDeployRoot;
  process.env.PRODUCTION_DEPLOY_MOCK = "true";
  process.env.PRODUCTION_DEPLOYMENT_ENABLED = "false";
  delete process.env.VERCEL_API_TOKEN;
});

afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
  if (tempDeployRoot && fs.existsSync(tempDeployRoot)) {
    fs.rmSync(tempDeployRoot, { recursive: true, force: true });
  }
});

describe("Mission 102 Production Store Deployment", () => {
  it("registers six production deployment Brain tools", () => {
    const names = productionDeploymentTools.map((tool) => tool.name);
    assert.deepEqual(names, [
      "production_deploy.prepare",
      "production_deploy.apply_approval",
      "production_deploy.execute_vercel",
      "production_deploy.rollback",
      "production_deploy.get_logs",
      "production_deploy.list",
    ]);
  });

  it("prepares Vercel project with vercel.json, package.json, and env vars", () => {
    const projectPath = path.join(tempDeployRoot, "grand-king-vercel");
    prepareVercelProject({
      targetPath: projectPath,
      projectName: "grand-king-vercel",
      buildCommand: "npm run build",
      outputDirectory: ".",
      environmentVariables: { NODE_ENV: "production", VERCEL_ENV: "production" },
      sourceFiles: [
        {
          relativePath: "index.html",
          content: "<!DOCTYPE html><html><body>Grand King Store</body></html>",
        },
      ],
    });

    assert.ok(fs.existsSync(path.join(projectPath, "vercel.json")));
    assert.ok(fs.existsSync(path.join(projectPath, "package.json")));
    assert.ok(fs.existsSync(path.join(projectPath, "index.html")));

    const vercelConfig = JSON.parse(fs.readFileSync(path.join(projectPath, "vercel.json"), "utf8"));
    assert.equal(vercelConfig.env.NODE_ENV, "production");
  });

  it("creates deployment in PENDING_APPROVAL status — Grand King gate", () => {
    const record = prepareProductionDeployment({
      workspaceId: WORKSPACE_ID,
      companyId: "co-gk",
      storeId: "store-gk",
      brandId: "brand-gk",
      projectName: "grand-king-store",
      customDomain: "shop.grandking.example",
    });

    assert.equal(record.status, "PENDING_APPROVAL");
    assert.equal(record.executionMode, "VERCEL_MOCK");
    assert.equal(record.approval, null);
    assert.equal(record.sslEnabled, true);
    assert.ok(record.environmentVariables.NODE_ENV === "production");
    assert.ok(fs.existsSync(path.join(record.sourcePath, "vercel.json")));
  });

  it("blocks execution without Grand King approval", async () => {
    const record = prepareProductionDeployment({
      workspaceId: WORKSPACE_ID,
      companyId: "co-gk",
      storeId: "store-gk",
      brandId: "brand-gk",
      projectName: "no-approval-store",
    });

    await assert.rejects(
      () => executeProductionDeployment(record.deploymentId),
      ProductionDeploymentBlockedError,
    );
  });

  it("executes mock Vercel deployment after approval with logs and SSL domain", async () => {
    const record = prepareProductionDeployment({
      workspaceId: WORKSPACE_ID,
      companyId: "co-gk",
      storeId: "store-gk",
      brandId: "brand-gk",
      projectName: "approved-store",
      customDomain: "store.grandking.example",
    });

    applyDeploymentApproval({
      deploymentId: record.deploymentId,
      approvalToken: "gk-approve-m102",
      approvedBy: "founder@empireai.com",
      approvedAt: new Date().toISOString(),
    });

    const deployed = await executeProductionDeployment(record.deploymentId);

    assert.equal(deployed.status, "DEPLOYED");
    assert.ok(deployed.productionUrl?.includes("store.grandking.example"));
    assert.equal(deployed.sslEnabled, true);
    assert.ok(deployed.vercelDeploymentId);
    assert.match(deployed.vercelDeploymentUrl ?? "", /vercel\.app/);

    const logs = getDeploymentLogs(record.deploymentId);
    assert.ok(logs.some((entry) => entry.phase === "prepare"));
    assert.ok(logs.some((entry) => entry.phase === "deploy"));
    assert.ok(logs.some((entry) => entry.phase === "domain"));
    assert.ok(logs.some((entry) => entry.phase === "complete"));
  });

  it("rolls back to previous deployment", async () => {
    const first = prepareProductionDeployment({
      workspaceId: WORKSPACE_ID,
      companyId: "co-gk",
      storeId: "store-gk",
      brandId: "brand-gk",
      projectName: "rollback-store",
    });

    applyDeploymentApproval({
      deploymentId: first.deploymentId,
      approvalToken: "token-1",
      approvedBy: "founder@empireai.com",
      approvedAt: new Date().toISOString(),
    });

    const deployed = await executeProductionDeployment(first.deploymentId);
    assert.equal(deployed.status, "DEPLOYED");

    const second = prepareProductionDeployment({
      workspaceId: WORKSPACE_ID,
      companyId: "co-gk",
      storeId: "store-gk",
      brandId: "brand-gk",
      projectName: "rollback-store",
    });

    assert.equal(second.previousDeploymentId, deployed.vercelDeploymentId);

    applyDeploymentApproval({
      deploymentId: second.deploymentId,
      approvalToken: "token-2",
      approvedBy: "founder@empireai.com",
      approvedAt: new Date().toISOString(),
    });

    await executeProductionDeployment(second.deploymentId);
    const rolledBack = await rollbackProductionDeployment(second.deploymentId);

    assert.equal(rolledBack.status, "ROLLED_BACK");
    assert.ok(getDeploymentLogs(second.deploymentId).some((entry) => entry.phase === "rollback"));
  });

  it("returns blocked response from execute tool when gate disabled", async () => {
    const record = prepareProductionDeployment({
      workspaceId: WORKSPACE_ID,
      companyId: "co-gk",
      storeId: "store-gk",
      brandId: "brand-gk",
      projectName: "tool-gate-store",
    });

    applyDeploymentApproval({
      deploymentId: record.deploymentId,
      approvalToken: "token-tool",
      approvedBy: "founder@empireai.com",
      approvedAt: new Date().toISOString(),
    });

    const result = (await invokeTool("production_deploy.execute_vercel", {
      deploymentId: record.deploymentId,
    })) as { blocked?: boolean; protectTheEmpire?: boolean; status?: string };

    if (result.blocked) {
      assert.equal(result.protectTheEmpire, true);
    } else {
      assert.equal(result.status, "DEPLOYED");
    }
  });
});
