import assert from "node:assert/strict";
import path from "node:path";
import { beforeEach, describe, test } from "node:test";
import { runBootstrap } from "../../bootstrap/engine.js";
import {
  ROUTING_FACTORS,
  STR_CAPABILITIES,
  buildSkillToolRouterConfiguration,
  createSkillToolRouter,
  resetSkillToolRouterForTesting,
} from "../../skill-tool-router/index.js";

const REPO_ROOT = path.resolve(import.meta.dirname, "..", "..", "..", "..");

async function build() {
  const bootstrap = await runBootstrap({ repositoryRoot: REPO_ROOT, skipHeavyScans: true });
  const engine = createSkillToolRouter(bootstrap);
  await engine.initialize();
  engine.connectSkillToolRouter();
  return engine;
}

describe("Q0-12 Skill & Tool Router", () => {
  beforeEach(resetSkillToolRouterForTesting);

  test("1 locks mandatory skill-tool-router boundaries", () => {
    const c = buildSkillToolRouterConfiguration(REPO_ROOT, {
      neverExecuteWork: false as never,
      neverPerformOrchestration: false as never,
      neverReplaceWorkers: false as never,
      neverOverridePillow: false as never,
      neverOverrideGrandKing: false as never,
    });
    assert.equal(c.neverExecuteWork, true);
    assert.equal(c.neverPerformOrchestration, true);
    assert.equal(c.neverReplaceWorkers, true);
    assert.equal(c.neverOverridePillow, true);
    assert.equal(c.neverOverrideGrandKing, true);
  });

  test("2 initializes PILLOW-STR-001 for Q0-12", async () => {
    const state = (await build()).getState();
    assert.equal(state.missionId, "Q0-12");
    assert.equal(state.engineVersion, "PILLOW-STR-001");
    for (const factor of ROUTING_FACTORS) {
      assert.ok(state.configuration.routingFactors.includes(factor));
    }
  });

  test("3 receives executive request and identifies required capabilities", async () => {
    const report = (await build()).analyseCapabilities({
      executiveRequest: "Plan engineering implementation for secure technical delivery",
      validated: true,
    });
    assert.ok(report.requiredCapabilities.length >= 1);
    assert.ok(
      report.requiredCapabilities.some(
        (c) => c.includes("implementation") || c.includes("technical") || c.includes("threat"),
      ),
    );
  });

  test("4 queries registry and selects suitable workers", async () => {
    const report = (await build()).matchWorkers({
      executiveRequest: "Route engineering implementation planning to the best specialist",
      businessContext: "engineering delivery",
      validated: true,
    });
    const record = report.records[0]!;
    assert.ok(record.selectedWorkers.length >= 1);
    assert.ok(record.selectedWorkers.includes("wcr-wkr-engineering-01"));
    assert.equal(record.workExecuted, false);
  });

  test("5 selects approved tools for the route", async () => {
    const record = (await build()).matchTools({
      executiveRequest: "Route security threat review with approved scanning tools",
      riskHint: "high",
      validated: true,
    }).records[0]!;
    assert.ok(record.selectedTools.length >= 1);
    assert.ok(
      record.selectedTools.some((t) => t === "security_scanner" || t === "policy_checker" || t === "repository_reader"),
    );
  });

  test("6 produces routing recommendations with alternatives", async () => {
    const record = (await build()).recommendRoute({
      executiveRequest: "Recommend workers and tools for operations monitoring and process coordination",
      businessContext: "operations runtime",
      validated: true,
    }).records[0]!;
    assert.ok(record.routingReason.length > 0);
    assert.ok(record.confidenceScore >= 0 && record.confidenceScore <= 100);
    assert.ok(Array.isArray(record.alternativeRoutes));
    assert.equal(record.metadataVersion, "STR-001-v1");
  });

  test("7 produces machine-readable routing records with risk and cost", async () => {
    const record = (await build()).routeRequest({
      executiveRequest: "Route finance budget alignment with cost and risk consideration",
      costCeiling: "medium",
      riskHint: "medium",
      validated: true,
    }).records[0]!;
    assert.ok(record.routingId.startsWith("str-rte-"));
    assert.ok(record.requiredCapabilities.length >= 1);
    assert.ok(record.riskAssessment.level);
    assert.ok(record.costAssessment.level);
    assert.equal(record.neverExecuteWork, true);
    assert.equal(record.orchestrationPerformed, false);
  });

  test("8 rejects execute / orchestrate / replace / Pillow / Grand King boundary violations", async () => {
    const engine = await build();
    const base = {
      executiveRequest: "Route engineering implementation for access control validation",
      validated: true as const,
    };
    assert.equal(engine.routeRequest({ ...base, executeWork: true }).validation.decision, "fail");
    assert.equal(engine.routeRequest({ ...base, performOrchestration: true }).validation.decision, "fail");
    assert.equal(engine.routeRequest({ ...base, replaceWorkers: true }).validation.decision, "fail");
    assert.equal(engine.routeRequest({ ...base, overridePillow: true }).validation.decision, "fail");
    assert.equal(engine.routeRequest({ ...base, overrideGrandKing: true }).validation.decision, "fail");
  });

  test("9 supports extensible routing factors and multi-worker escalation paths", async () => {
    const engine = createSkillToolRouter(
      await runBootstrap({ repositoryRoot: REPO_ROOT, skipHeavyScans: true }),
      { configuration: { routingFactors: [...ROUTING_FACTORS, "latency_budget"] } },
    );
    await engine.initialize();
    engine.connectSkillToolRouter();
    assert.ok(engine.getState().configuration.routingFactors.includes("latency_budget"));
    const record = engine.routeRequest({
      executiveRequest: "Coordinate engineering, security, and compliance for a high-risk delivery",
      requireMultipleWorkers: true,
      riskHint: "critical",
      validated: true,
    }).records[0]!;
    assert.equal(record.multipleWorkersRequired, true);
    assert.ok(record.selectedWorkers.length >= 1);
    assert.ok(STR_CAPABILITIES.includes("extensible_routing_factors"));
  });

  test("10 validates stored routing records", async () => {
    const engine = await build();
    engine.routeRequest({
      executiveRequest: "Route data intelligence signal analysis for executive insight packaging",
      validated: true,
    });
    const validation = engine.validateRouting({ executiveRequest: "", validated: true });
    assert.ok(validation.validation.decision === "pass" || validation.validation.decision === "partial");
    assert.equal(engine.getRecords().length, 1);
    assert.equal(engine.getLatestRecord()?.neverOverrideGrandKing, true);
  });
});
