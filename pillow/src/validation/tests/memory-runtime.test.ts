import assert from "node:assert/strict";
import path from "node:path";
import { beforeEach, describe, test } from "node:test";
import { runBootstrap } from "../../bootstrap/engine.js";
import {
  GOVERNANCE_CLASSES,
  MEMORY_TYPES,
  MEMRT_CAPABILITIES,
  MEMRT_METADATA_VERSION,
  MEMRT_REPORT_VERSION,
  MEMRT_RUNTIME_VERSION,
  INTEGRATION_TARGETS,
  buildMemoryRuntimeConfiguration,
  createMemoryRuntime,
  resetMemoryRuntimeForTesting,
  compareEntries,
  type MemrtInput,
  type MemoryRuntimeDependencies,
} from "../../memory-runtime/index.js";

const REPO_ROOT = path.resolve(import.meta.dirname, "..", "..", "..", "..");

function sampleInput(overrides: Partial<MemrtInput> = {}): MemrtInput {
  return {
    pillowConfirmed: true,
    grandKingApproved: true,
    validated: true,
    ...overrides,
  };
}

async function build(deps?: MemoryRuntimeDependencies) {
  const bootstrap = await runBootstrap({ repositoryRoot: REPO_ROOT, skipHeavyScans: true });
  const engine = createMemoryRuntime(bootstrap, deps ? { dependencies: deps } : undefined);
  await engine.initialize();
  engine.connect();
  return engine;
}

describe("Q10-05 Memory Runtime", () => {
  beforeEach(resetMemoryRuntimeForTesting);

  test("1 locks mandatory boundaries", () => {
    const c = buildMemoryRuntimeConfiguration(REPO_ROOT, {
      neverReplaceEkls: false as never,
      neverReplaceApplicationDatabases: false as never,
      neverModifyHistoricalRecords: false as never,
      neverFabricateMemory: false as never,
      neverSilentlyOverwriteHistoricalDecisions: false as never,
      neverBypassPillowGovernance: false as never,
      neverBypassGrandKingApproval: false as never,
      neverImplementQ1006OrLater: false as never,
      deterministicRetrievalOnly: false as never,
    });
    assert.equal(c.neverReplaceEkls, true);
    assert.equal(c.neverReplaceApplicationDatabases, true);
    assert.equal(c.neverModifyHistoricalRecords, true);
    assert.equal(c.neverFabricateMemory, true);
    assert.equal(c.neverSilentlyOverwriteHistoricalDecisions, true);
    assert.equal(c.neverBypassPillowGovernance, true);
    assert.equal(c.neverBypassGrandKingApproval, true);
    assert.equal(c.neverOverrideApprovedArchitecture, true);
    assert.equal(c.neverOverridePillow, true);
    assert.equal(c.neverOverrideGrandKing, true);
    assert.equal(c.neverImplementQ1006OrLater, true);
    assert.equal(c.preserveCompleteTraceability, true);
    assert.equal(c.preserveHistoricalMemory, true);
    assert.equal(c.preserveAuditHistory, true);
    assert.equal(c.structuralSignalOnly, true);
    assert.equal(c.neverExposeCredentials, true);
    assert.equal(c.maskSensitiveValues, true);
    assert.equal(c.deterministicRetrievalOnly, true);
  });

  test("2 initializes PILLOW-MEMRT-001 Q10-05", async () => {
    const state = (await build()).getState();
    assert.equal(state.missionId, "Q10-05");
    assert.equal(state.engineVersion, "PILLOW-MEMRT-001");
    assert.equal(state.configuration.workerId, "wkr-memory-runtime-01");
    assert.equal(state.configuration.factory, "pillow-memory");
    for (const target of INTEGRATION_TARGETS) {
      assert.ok(state.configuration.integrationTargets.includes(target));
    }
    assert.ok(MEMRT_CAPABILITIES.includes("store_operational_memory"));
    assert.ok(MEMRT_CAPABILITIES.includes("q1006_consumable_contract"));
    assert.equal(MEMORY_TYPES.length, 8);
    assert.equal(GOVERNANCE_CLASSES.length, 4);
    assert.ok(
      compareEntries(
        { createdAt: "2026-01-01T00:00:00.000Z", memoryId: "b" } as never,
        { createdAt: "2026-01-01T00:00:00.000Z", memoryId: "a" } as never,
      ) > 0,
    );
  });

  test("3 operational memory stored successfully", async () => {
    const engine = await build();
    const report = engine.storeMemory(
      sampleInput({
        memoryType: "operational",
        factory: "pillow-factory",
        worker: "wkr-test-01",
        missionId: "M-001",
        contentRef: "content://operational/test-001",
        summary: "Operational test memory",
        tags: ["test", "operational"],
      }),
    );
    assert.equal(report.decision, "pass");
    assert.ok(report.memory);
    assert.equal(report.memory!.memoryType, "operational");
    assert.equal(report.memory!.fabricated, false);
    assert.equal(report.memory!.contentRef, "content://operational/test-001");
    assert.equal(report.memory!.currentVersion, 1);
  });

  test("4 operational memory retrieved successfully", async () => {
    const engine = await build();
    const stored = engine.storeMemory(
      sampleInput({
        memoryType: "operational",
        factory: "pillow-factory",
        worker: "wkr-test-01",
        contentRef: "content://operational/retrieve-test",
        summary: "Retrieve test",
      }),
    );
    const memoryId = stored.memory!.memoryId;
    const report = engine.retrieveMemory(sampleInput({ memoryId }));
    assert.equal(report.decision, "pass");
    assert.ok(report.memory);
    assert.equal(report.memory!.memoryId, memoryId);
    assert.ok(report.memory!.lastAccessAt);
  });

  test("5 decision history retrieved correctly", async () => {
    const engine = await build();
    engine.storeDecision(
      sampleInput({
        missionId: "M-DEC-001",
        worker: "wkr-decision-01",
        contentRef: "content://decision/001",
        summary: "Approved expansion plan",
        tags: ["decision", "approved"],
      }),
    );
    engine.storeDecision(
      sampleInput({
        missionId: "M-DEC-001",
        worker: "wkr-decision-01",
        contentRef: "content://decision/002",
        summary: "Deferred risk mitigation",
        tags: ["decision", "deferred"],
      }),
    );
    const report = engine.retrieveDecisionHistory(
      sampleInput({ missionId: "M-DEC-001", worker: "wkr-decision-01" }),
    );
    assert.equal(report.decision, "pass");
    assert.ok(report.retrievalResult);
    assert.equal(report.retrievalResult!.matchCount, 2);
    assert.ok(report.retrievalResult!.deterministicOrdering);
    assert.equal(report.retrievalResult!.matches[0]!.memoryType, "decision_history");
  });

  test("6 previous mission results retrieved correctly", async () => {
    const engine = await build();
    engine.storeMemory(
      sampleInput({
        memoryType: "previous_result",
        missionId: "M-RES-001",
        worker: "wkr-result-01",
        contentRef: "content://result/001",
        summary: "Mission completed with 3 deliverables",
      }),
    );
    const report = engine.retrievePreviousResults(
      sampleInput({ missionId: "M-RES-001", worker: "wkr-result-01" }),
    );
    assert.equal(report.decision, "pass");
    assert.ok(report.retrievalResult);
    assert.equal(report.retrievalResult!.matchCount, 1);
    assert.equal(report.retrievalResult!.matches[0]!.memoryType, "previous_result");
  });

  test("7 runtime context supplied to workers (ContextBundle)", async () => {
    const engine = await build();
    engine.storeMemory(
      sampleInput({
        memoryType: "operational",
        factory: "ctx-factory",
        worker: "wkr-ctx-01",
        missionId: "M-CTX-001",
        sessionId: "sess-001",
        contentRef: "content://ctx/operational",
        summary: "Context operational",
      }),
    );
    engine.storeDecision(
      sampleInput({
        factory: "ctx-factory",
        worker: "wkr-ctx-01",
        missionId: "M-CTX-001",
        sessionId: "sess-001",
        contentRef: "content://ctx/decision",
        summary: "Context decision",
      }),
    );
    const report = engine.provideRuntimeContext(
      sampleInput({
        factory: "ctx-factory",
        worker: "wkr-ctx-01",
        missionId: "M-CTX-001",
        sessionId: "sess-001",
      }),
    );
    assert.equal(report.decision, "pass");
    assert.ok(report.contextBundle);
    assert.equal(report.contextBundle!.fabricated, false);
    assert.equal(report.contextBundle!.operationalMemories.length, 1);
    assert.equal(report.contextBundle!.decisionHistory.length, 1);
    assert.equal(report.contextBundle!.structuralSignalOnly, true);
  });

  test("8 memory versioning verified (update creates new version; old preserved)", async () => {
    const engine = await build();
    const stored = engine.storeMemory(
      sampleInput({
        memoryId: "memrt-version-test",
        contentRef: "content://v1",
        summary: "Version 1 content",
      }),
    );
    const v1Payload = stored.memory!.versions[0]!.contentRef;
    const updated = engine.storeMemory(
      sampleInput({
        memoryId: "memrt-version-test",
        contentRef: "content://v2",
        summary: "Version 2 content",
      }),
    );
    assert.equal(updated.decision, "pass");
    assert.equal(updated.memory!.currentVersion, 2);
    assert.equal(updated.memory!.versions.length, 2);
    assert.equal(updated.memory!.versions[0]!.contentRef, v1Payload);
    assert.equal(updated.memory!.versions[0]!.contentRef, "content://v1");
    assert.equal(updated.memory!.versions[1]!.contentRef, "content://v2");
    assert.equal(updated.memory!.versions[1]!.supersedesVersion, 1);
  });

  test("9 historical memory preserved + full Memory Runtime Report + consumableByQ1006", async () => {
    const engine = await build();
    engine.storeMemory(
      sampleInput({
        memoryType: "operational",
        contentRef: "content://report-test",
        summary: "Report test memory",
      }),
    );
    engine.storeDecision(
      sampleInput({
        contentRef: "content://report-decision",
        summary: "Report test decision",
      }),
    );
    const report = engine.produceReport(sampleInput());
    assert.equal(report.decision, "pass");
    const memrt = report.memoryRuntimeReport;
    assert.ok(memrt);
    assert.ok(memrt!.reportId.startsWith("memrt-rpt"));
    assert.ok(memrt!.timestamp);
    assert.equal(memrt!.runtimeVersion, MEMRT_RUNTIME_VERSION);
    assert.ok(Array.isArray(memrt!.memoryInventory));
    assert.ok(Array.isArray(memrt!.activeContexts));
    assert.ok(memrt!.decisionHistorySummary);
    assert.ok(memrt!.previousResultSummary);
    assert.ok(memrt!.retrievalStatistics);
    assert.ok(memrt!.versionSummary);
    assert.ok(memrt!.memoryHealth);
    assert.ok(Array.isArray(memrt!.supportingEvidence));
    assert.ok(memrt!.auditStatus);
    assert.ok(Array.isArray(memrt!.outstandingIssues));
    assert.ok(typeof memrt!.confidenceScore === "number");
    assert.equal(memrt!.metadataVersion, MEMRT_METADATA_VERSION);
    assert.equal(memrt!.reportVersion, MEMRT_REPORT_VERSION);
    assert.equal(memrt!.consumableByQ1006, true);
    assert.equal(memrt!.neverImplementQ1006OrLater, true);
    assert.equal(memrt!.neverSilentlyOverwriteHistoricalDecisions, true);
    assert.ok(engine.getHistory().reports.length >= 1);
  });

  test("10 rejects fabrication / grand_king_only without approval", async () => {
    const engine = await build();
    const failReport = engine.validate(sampleInput({ forceFail: true }));
    assert.equal(failReport.decision, "fail");
    const fabReport = engine.validate(sampleInput({ fabricateMemory: true }));
    assert.equal(fabReport.decision, "fail");
    const gkStore = engine.storeMemory(
      sampleInput({
        governanceClassification: "grand_king_only",
        contentRef: "content://restricted",
        summary: "Restricted memory",
        grandKingApproved: false,
      }),
    );
    assert.equal(gkStore.decision, "fail");
    const gkRetrieve = engine.retrieveMemory(
      sampleInput({
        governanceClassification: "grand_king_only",
        memoryId: "nonexistent",
        grandKingApproved: false,
      }),
    );
    assert.equal(gkRetrieve.decision, "fail");
  });

  test("11 rejects Q10-06+", async () => {
    const engine = await build();
    const report = engine.validate(
      sampleInput({ implementQ1006OrLater: true, targetMissionId: "Q10-06" }),
    );
    assert.equal(report.decision, "fail");
    assert.ok(report.errors.some((e) => e.includes("Q10-06") || e.includes("Q10-06 or later")));
  });

  test("12 cockpit + Q1006 contract; never modifies historical record payloads", async () => {
    const engine = await build({
      executiveReportingRuntime: {
        submitWorkerReport: () => ({ records: [{ reportId: "ert-memrt-test" }] }),
      },
    });
    const stored = engine.storeMemory(
      sampleInput({
        memoryId: "memrt-historical-test",
        contentRef: "content://historical-v1",
        summary: "Historical v1",
      }),
    );
    const originalVersionPayload = { ...stored.memory!.versions[0]! };
    engine.storeMemory(
      sampleInput({
        memoryId: "memrt-historical-test",
        contentRef: "content://historical-v2",
        summary: "Historical v2",
      }),
    );
    engine.produceReport(sampleInput());
    const cockpit = engine.getCockpitSnapshot();
    assert.equal(cockpit.missionId, "Q10-05");
    assert.equal(cockpit.neverReplaceEkls, true);
    assert.equal(cockpit.neverFabricateMemory, true);
    assert.equal(cockpit.neverSilentlyOverwriteHistoricalDecisions, true);
    assert.equal(cockpit.neverImplementQ1006OrLater, true);
    assert.ok(cockpit.totalEntries >= 1);
    const contract = engine.getQ1006ConsumableContract();
    assert.equal(contract.consumerMissionId, "Q10-06");
    assert.equal(contract.producedBy, "memory-runtime");
    assert.equal(contract.missionId, "Q10-05");
    assert.equal(contract.neverImplementQ1006OrLater, true);
    assert.ok(contract.exposedFields.includes("memoryInventory"));
    assert.ok(contract.memoryTypeCatalog.length >= MEMORY_TYPES.length);
    const history = engine.getHistory();
    const entry = history.entries.find((e) => e.memoryId === "memrt-historical-test");
    assert.ok(entry);
    const v1 = entry!.versions.find((v) => v.versionNumber === 1);
    assert.equal(v1!.contentRef, originalVersionPayload.contentRef);
    assert.equal(v1!.summary, originalVersionPayload.summary);
    assert.equal(v1!.createdAt, originalVersionPayload.createdAt);
  });
});
