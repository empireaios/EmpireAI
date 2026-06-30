import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, it } from "node:test";

import { VALIDATION_STAGE_NAMES } from "../../revenue/first-revenue-validation/models/first-revenue-validation-record.js";
import { firstRevenueValidationTools } from "../../revenue/first-revenue-validation/tools/first-revenue-validation-tools.js";
import {
  getProductionReadinessAssessment,
  runFirstRevenueValidation,
} from "../../revenue/first-revenue-validation/index.js";
import type { ToolContext } from "../../brain/types.js";

const WORKSPACE_ID = "ws-m110";
const COMPANY_ID = "co-grand-king";
const ORIGINAL_ENV = { ...process.env };
let tempDeployRoot = "";

function toolContext(): ToolContext {
  return {
    workspaceId: WORKSPACE_ID,
    agentId: "first-revenue-validation",
    correlationId: "corr-m110",
  };
}

async function invokeTool(name: string, args: Record<string, unknown> = {}) {
  const tool = firstRevenueValidationTools.find((entry) => entry.name === name);
  assert.ok(tool, `tool ${name} should be registered`);
  return tool.handler({ workspaceId: WORKSPACE_ID, ...args }, toolContext());
}

beforeEach(() => {
  tempDeployRoot = fs.mkdtempSync(path.join(os.tmpdir(), "empire-m110-"));
  process.env.REVENUE_LOOP_DEPLOY_ROOT = tempDeployRoot;
  process.env.LIVE_PAYMENT_MOCK = "true";
  process.env.META_ADS_MOCK = "true";
  process.env.ANALYTICS_SERVER_SIDE_MOCK = "true";
  process.env.FIRST_REVENUE_VALIDATION_ENABLED = "true";
  process.env.FIRST_REVENUE_VALIDATION_MOCK = "true";
  process.env.LIVE_PAYMENT_ENABLED = "false";
  process.env.META_ADS_LAUNCH_ENABLED = "false";
  process.env.LIVE_CJ_FULFILLMENT_ENABLED = "false";
  delete process.env.STRIPE_SECRET_KEY;
  delete process.env.STRIPE_WEBHOOK_SECRET;
});

afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
  if (tempDeployRoot && fs.existsSync(tempDeployRoot)) {
    fs.rmSync(tempDeployRoot, { recursive: true, force: true });
  }
});

describe("Mission 110 First Revenue Validation", () => {
  it("registers four first revenue validation Brain tools", () => {
    assert.equal(firstRevenueValidationTools.length, 4);
    assert.ok(
      firstRevenueValidationTools.some((tool) => tool.name === "first_revenue_validation.run"),
    );
  });

  it("reports production blockers when live gates are disabled", () => {
    const assessment = getProductionReadinessAssessment();

    assert.equal(assessment.productionReady, false);
    assert.ok(assessment.blockers.length >= 5);
    assert.ok(
      assessment.blockers.some((blocker) => blocker.includes("LIVE_PAYMENT_ENABLED")),
    );
    assert.ok(
      assessment.blockers.some((blocker) => blocker.includes("META_ADS_LAUNCH_ENABLED")),
    );
    assert.ok(
      assessment.blockers.some((blocker) =>
        blocker.includes("CUSTOMER_ORDER_PIPELINE_LIVE_FULFILLMENT_ENABLED"),
      ),
    );
  });

  it("executes all twelve validation stages in sandbox mode", async () => {
    const validation = await runFirstRevenueValidation({
      workspaceId: WORKSPACE_ID,
      companyId: COMPANY_ID,
      correlationId: "m110-full-cycle",
    });

    assert.equal(validation.stages.length, 12);
    assert.deepEqual(
      validation.stages.map((stage) => stage.stage),
      [...VALIDATION_STAGE_NAMES],
    );
    assert.equal(validation.allStagesPassed, true);
    assert.equal(validation.mode, "MOCK");
    assert.ok(validation.revenueCents >= 7200);
    assert.equal(validation.ledgerVerified, true);
    assert.ok(validation.storeId);
    assert.ok(validation.pipelineId);
    assert.ok(validation.paymentId);
    assert.ok(validation.campaignId);
  });

  it("marks productionReady false even when sandbox cycle passes", async () => {
    const validation = await runFirstRevenueValidation({
      workspaceId: WORKSPACE_ID,
      companyId: COMPANY_ID,
    });

    assert.equal(validation.allStagesPassed, true);
    assert.equal(validation.productionReady, false);
    assert.ok(validation.productionBlockers.length > 0);
  });

  it("runs validation via Brain tool", async () => {
    const validation = (await invokeTool("first_revenue_validation.run", {
      companyId: COMPANY_ID,
    })) as { allStagesPassed: boolean; stages: unknown[] };

    assert.equal(validation.allStagesPassed, true);
    assert.equal(validation.stages.length, 12);
  });

  it("assesses production readiness via Brain tool", async () => {
    const assessment = (await invokeTool(
      "first_revenue_validation.assess_production_readiness",
    )) as { productionReady: boolean; blockers: string[] };

    assert.equal(assessment.productionReady, false);
    assert.ok(assessment.blockers.length > 0);
  });
});
