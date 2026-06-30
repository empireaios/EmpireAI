import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  createAutonomousCompanyManufacturingLoopModule,
  createInMemoryCompanyManufacturingRepository,
  DEFAULT_M072_IDS,
  MANUFACTURING_LOOP_STAGES,
  runAutonomousCompanyManufacturingLoop,
} from "../../execution/autonomous-company-manufacturing-loop/index.js";

const WORKSPACE_ID = "ws-m072";

describe("Mission 072 Autonomous Company Manufacturing Loop", () => {
  it("runs the full Eye → Deployment manufacturing loop with required outputs", async () => {
    const module = createAutonomousCompanyManufacturingLoopModule();
    const record = await module.persistManufacturingRun({
      workspaceId: WORKSPACE_ID,
      deterministicIds: DEFAULT_M072_IDS,
    });

    assert.ok(record.runId);
    assert.equal(record.productId, DEFAULT_M072_IDS.productId);
    assert.ok(record.opportunityId);
    assert.ok(record.brandId);
    assert.ok(record.storeId);
    assert.ok(record.campaignId);
    assert.ok(record.deploymentRecordId);
    assert.equal(record.runStatus, "COMPLETE");
    assert.ok(record.nextActions.length >= 2);
    assert.ok(record.confidence >= 70);
    assert.ok(record.signals.some((signal) => signal.signalType === "loop_composite"));
  });

  it("executes all seven manufacturing loop stages in order", async () => {
    const run = await runAutonomousCompanyManufacturingLoop({
      workspaceId: WORKSPACE_ID,
      deterministicIds: DEFAULT_M072_IDS,
    });

    assert.equal(run.stages.length, MANUFACTURING_LOOP_STAGES.length);
    assert.deepEqual(
      run.stages.map((stage) => stage.stage),
      [...MANUFACTURING_LOOP_STAGES],
    );
    assert.ok(run.stages.every((stage) => stage.status === "COMPLETE" || stage.status === "PARTIAL"));
    assert.ok(run.stages.every((stage) => stage.progress === 100));
  });

  it("connects Eye intelligence to opportunity portfolio and capital allocation", async () => {
    const run = await runAutonomousCompanyManufacturingLoop({
      workspaceId: WORKSPACE_ID,
      deterministicIds: DEFAULT_M072_IDS,
    });

    const eyeStage = run.stages.find((stage) => stage.stage === "EYE");
    const opportunityStage = run.stages.find((stage) => stage.stage === "OPPORTUNITY");

    assert.ok(eyeStage);
    assert.ok(opportunityStage);
    assert.equal(eyeStage!.moduleId, "revenue-opportunity-synthesis");
    assert.equal(opportunityStage!.moduleId, "opportunity-portfolio");
    assert.match(eyeStage!.detail, /opportunity/i);
    assert.match(opportunityStage!.detail, /allocated/i);
  });

  it("manufactures brand, store, marketing, and deployment artifacts", async () => {
    const run = await runAutonomousCompanyManufacturingLoop({
      workspaceId: WORKSPACE_ID,
      deterministicIds: DEFAULT_M072_IDS,
    });

    const brandStage = run.stages.find((stage) => stage.stage === "BRAND");
    const storeStage = run.stages.find((stage) => stage.stage === "STORE");
    const marketingStage = run.stages.find((stage) => stage.stage === "MARKETING");
    const deploymentStage = run.stages.find((stage) => stage.stage === "DEPLOYMENT");

    assert.ok(brandStage);
    assert.ok(storeStage);
    assert.ok(marketingStage);
    assert.ok(deploymentStage);
    assert.match(brandStage!.detail, /Brand/i);
    assert.match(storeStage!.detail, /pages/i);
    assert.match(marketingStage!.detail, /Campaign/i);
    assert.match(deploymentStage!.detail, /PACKAGE/i);
  });

  it("generates next actions for post-manufacturing operations", async () => {
    const run = await runAutonomousCompanyManufacturingLoop({
      workspaceId: WORKSPACE_ID,
      deterministicIds: DEFAULT_M072_IDS,
    });

    assert.ok(run.nextActions.some((action) => action.stage === "MARKETING"));
    assert.ok(run.nextActions.every((action) => action.title.length > 0));
    assert.ok(run.nextActions.every((action) => ["HIGH", "MEDIUM", "LOW"].includes(action.priority)));
  });

  it("persists manufacturing run records and retrieves by product", async () => {
    const repository = createInMemoryCompanyManufacturingRepository();
    const module = createAutonomousCompanyManufacturingLoopModule(repository);

    const saved = await module.persistManufacturingRun({
      workspaceId: WORKSPACE_ID,
      deterministicIds: DEFAULT_M072_IDS,
    });

    const latest = await module.getLatestManufacturingRun(WORKSPACE_ID);
    const byProduct = await module.getManufacturingRunByProduct(
      WORKSPACE_ID,
      DEFAULT_M072_IDS.productId,
    );
    const loaded = await module.getManufacturingRecord(WORKSPACE_ID, saved.recordId);

    assert.ok(latest);
    assert.ok(byProduct);
    assert.ok(loaded);
    assert.equal(latest!.runId, saved.runId);
    assert.equal(byProduct!.productId, DEFAULT_M072_IDS.productId);
    assert.equal(loaded!.runStatus, saved.runStatus);

    const listed = await repository.list({
      workspaceId: WORKSPACE_ID,
      minConfidence: 60,
    });
    assert.equal(listed.length, 1);
  });
});
