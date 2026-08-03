import assert from "node:assert/strict";
import path from "node:path";
import { beforeEach, describe, test } from "node:test";
import { runBootstrap } from "../../bootstrap/engine.js";
import {
  KNOWLEDGE_CATEGORIES,
  KSB_CAPABILITIES,
  buildKnowledgeSharingBusConfiguration,
  createKnowledgeSharingBus,
  resetKnowledgeSharingBusForTesting,
} from "../../knowledge-sharing-bus/index.js";

const REPO_ROOT = path.resolve(import.meta.dirname, "..", "..", "..", "..");

async function build(config?: Parameters<typeof createKnowledgeSharingBus>[1]) {
  const bootstrap = await runBootstrap({ repositoryRoot: REPO_ROOT, skipHeavyScans: true });
  const engine = createKnowledgeSharingBus(bootstrap, config);
  await engine.initialize();
  engine.connectKnowledgeSharingBus();
  return engine;
}

describe("Q0-23 Knowledge Sharing Bus", () => {
  beforeEach(resetKnowledgeSharingBusForTesting);

  test("1 locks mandatory knowledge-sharing-bus boundaries", () => {
    const c = buildKnowledgeSharingBusConfiguration(REPO_ROOT, {
      neverExecuteWorkerTasks: false as never,
      neverReplaceExecutionMemory: false as never,
      neverReplaceDecisionMemory: false as never,
      neverOverridePillow: false as never,
      neverOverrideGrandKing: false as never,
    });
    assert.equal(c.neverExecuteWorkerTasks, true);
    assert.equal(c.neverReplaceExecutionMemory, true);
    assert.equal(c.neverReplaceDecisionMemory, true);
    assert.equal(c.neverOverridePillow, true);
    assert.equal(c.neverOverrideGrandKing, true);
  });

  test("2 initializes PILLOW-KSB-001 for Q0-23", async () => {
    const state = (await build()).getState();
    assert.equal(state.missionId, "Q0-23");
    assert.equal(state.engineVersion, "PILLOW-KSB-001");
    for (const category of KNOWLEDGE_CATEGORIES) {
      assert.ok(state.configuration.knowledgeCategories.includes(category));
    }
  });

  test("3 worker publishes knowledge", async () => {
    const report = (await build()).publishKnowledge({
      missionId: "Q0-23",
      businessId: "biz-marketplace",
      sourceWorker: "wcr-wkr-strategy-01",
      knowledgeTitle: "Marketplace expansion lesson",
      knowledgeSummary: "Validated lesson learned from regional launch",
      knowledgeCategory: "lessons_learned",
      supportingEvidence: ["postmortem:region-a"],
      relatedPlaybooks: ["playbook-expansion-01"],
      confidenceScore: 88,
      validated: true,
    });
    assert.equal(report.published, true);
    assert.equal(report.records[0]!.publicationStatus, "published");
    assert.equal(report.records[0]!.sourceWorker, "wcr-wkr-strategy-01");
    assert.ok(report.records[0]!.knowledgeId.startsWith("ksb-kn-"));
  });

  test("4 knowledge is classified and categorized", async () => {
    const report = (await build()).classifyKnowledge({
      missionId: "Q0-23",
      businessId: "biz-marketplace",
      sourceWorker: "wcr-wkr-ops-01",
      knowledgeTitle: "SLA recovery playbook",
      knowledgeSummary: "Recovery knowledge after incident rollback",
      supportingEvidence: ["incident:ops-42"],
      confidenceScore: 75,
      validated: true,
    });
    assert.equal(report.records[0]!.knowledgeCategory, "recovery_knowledge");
    assert.ok(report.classificationLabels.some((l) => l.startsWith("category:")));
    assert.ok(report.records[0]!.classificationLabels.includes("medium_confidence"));
  });

  test("5 knowledge is shared via subscription", async () => {
    const engine = await build();
    engine.publishKnowledge({
      missionId: "Q0-23",
      businessId: "biz-marketplace",
      sourceWorker: "wcr-wkr-strategy-01",
      knowledgeTitle: "Best practice pricing",
      knowledgeSummary: "Best practice for pricing experiments",
      knowledgeCategory: "best_practice",
      confidenceScore: 90,
      validated: true,
    });
    const sub = engine.subscribeKnowledge({
      subscriberWorkerId: "wcr-wkr-finance-01",
      subscriptionCategories: ["best_practice"],
      validated: true,
    });
    assert.equal(sub.validation.decision, "pass");
    assert.ok(engine.getSubscriptions().some((s) => s.workerId === "wcr-wkr-finance-01"));
    assert.ok(sub.records.length >= 1);
  });

  test("6 another worker retrieves shared knowledge", async () => {
    const engine = await build();
    const published = engine.publishKnowledge({
      missionId: "Q0-23",
      businessId: "biz-marketplace",
      sourceWorker: "wcr-wkr-strategy-01",
      knowledgeTitle: "Customer retention pattern",
      knowledgeSummary: "Customer intelligence on retention cohorts",
      knowledgeCategory: "customer_intelligence",
      confidenceScore: 82,
      validated: true,
    });
    const knowledgeId = published.records[0]!.knowledgeId;
    const retrieved = engine.retrieveKnowledge({
      knowledgeId,
      retrievingWorkerId: "wcr-wkr-ops-02",
      validated: true,
    });
    assert.equal(retrieved.retrievedBy, "wcr-wkr-ops-02");
    assert.equal(retrieved.records[0]!.knowledgeId, knowledgeId);
    assert.ok((retrieved.records[0]!.usageCount ?? 0) >= 1);
  });

  test("7 knowledge versioning works", async () => {
    const engine = await build();
    const first = engine.submitKnowledge({
      missionId: "Q0-23",
      businessId: "biz-marketplace",
      sourceWorker: "wcr-wkr-tech-01",
      knowledgeTitle: "API latency baseline",
      knowledgeSummary: "Technical knowledge for API latency",
      knowledgeCategory: "technical_knowledge",
      confidenceScore: 70,
      version: "1.0.0",
      validated: true,
    });
    const knowledgeId = first.records[0]!.knowledgeId;
    const versioned = engine.versionKnowledge({
      knowledgeId,
      knowledgeSummary: "Updated technical knowledge for API latency",
      validated: true,
    });
    assert.equal(versioned.records[0]!.version, "1.0.1");
    assert.ok(versioned.records[0]!.versionHistory.includes("1.0.0"));
    assert.ok(versioned.records[0]!.versionHistory.includes("1.0.1"));
  });

  test("8 rejects execute / memory-replace / Pillow / Grand King boundaries", async () => {
    const engine = await build();
    const base = {
      missionId: "Q0-23",
      businessId: "biz-marketplace",
      sourceWorker: "wcr-wkr-strategy-01",
      knowledgeTitle: "Boundary test",
      knowledgeSummary: "Boundary test summary",
      validated: true,
    };
    assert.equal(
      engine.submitKnowledge({ ...base, executeWorkerTasks: true }).validation.decision,
      "fail",
    );
    assert.equal(
      engine.publishKnowledge({ ...base, replaceExecutionMemory: true }).validation.decision,
      "fail",
    );
    assert.equal(
      engine.retrieveKnowledge({ ...base, replaceDecisionMemory: true }).validation.decision,
      "fail",
    );
    assert.equal(
      engine.classifyKnowledge({ ...base, overridePillow: true }).validation.decision,
      "fail",
    );
    assert.equal(
      engine.archiveKnowledge({ ...base, overrideGrandKing: true }).validation.decision,
      "fail",
    );
  });

  test("9 supports extensible knowledge categories", async () => {
    const engine = await build({
      configuration: {
        knowledgeCategories: [...KNOWLEDGE_CATEGORIES, "regulatory_knowledge"],
      },
    });
    assert.ok(engine.getState().configuration.knowledgeCategories.includes("regulatory_knowledge"));
    assert.ok(KSB_CAPABILITIES.includes("extensible_knowledge_categories"));
  });

  test("10 produces machine-readable knowledge records and validates them", async () => {
    const engine = await build();
    engine.publishKnowledge({
      missionId: "Q0-23",
      businessId: "biz-marketplace",
      sourceWorker: "wcr-wkr-strategy-01",
      knowledgeTitle: "Executive briefing pattern",
      knowledgeSummary: "Executive knowledge for briefing cadence",
      knowledgeCategory: "executive_knowledge",
      supportingEvidence: ["briefing:q0"],
      relatedPlaybooks: ["playbook-exec-01"],
      confidenceScore: 91,
      validated: true,
    });
    const validation = engine.validateKnowledgeSharingBus({ validated: true });
    assert.ok(
      validation.validation.decision === "pass" || validation.validation.decision === "partial",
    );
    assert.equal(engine.getRecords().length, 1);
    const record = engine.getLatestRecord()!;
    assert.equal(record.workerTasksExecuted, false);
    assert.equal(record.executionMemoryReplaced, false);
    assert.equal(record.decisionMemoryReplaced, false);
    assert.equal(record.pillowOverridden, false);
    assert.equal(record.grandKingOverridden, false);
    assert.equal(record.metadataVersion, "KSB-001-v1");
    assert.ok(record.knowledgeId);
    assert.ok(record.timestamp);
    assert.ok(record.sourceWorker);
    assert.ok(record.knowledgeCategory);
    assert.ok(record.knowledgeTitle);
    assert.ok(record.knowledgeSummary);
    assert.ok(typeof record.confidenceScore === "number");
    assert.ok(record.version);
    assert.ok(record.publicationStatus);
  });
});
