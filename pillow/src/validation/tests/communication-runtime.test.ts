import assert from "node:assert/strict";
import path from "node:path";
import { beforeEach, describe, test } from "node:test";
import { runBootstrap } from "../../bootstrap/engine.js";
import {
  CHANNEL_TYPES,
  COMRT_CAPABILITIES,
  COMRT_METADATA_VERSION,
  COMRT_REPORT_VERSION,
  COMRT_RUNTIME_VERSION,
  DELIVERY_STATUSES,
  INTEGRATION_TARGETS,
  MESSAGE_TYPES,
  PRIORITIES,
  buildCommunicationRuntimeConfiguration,
  createCommunicationRuntime,
  resetCommunicationRuntimeForTesting,
  type ComrtInput,
  type CommunicationRuntimeDependencies,
} from "../../communication-runtime/index.js";

const REPO_ROOT = path.resolve(import.meta.dirname, "..", "..", "..", "..");

function sampleInput(overrides: Partial<ComrtInput> = {}): ComrtInput {
  return {
    pillowConfirmed: true,
    grandKingApproved: true,
    validated: true,
    ...overrides,
  };
}

async function build(deps?: CommunicationRuntimeDependencies) {
  const bootstrap = await runBootstrap({ repositoryRoot: REPO_ROOT, skipHeavyScans: true });
  const engine = createCommunicationRuntime(
    bootstrap,
    deps ? { dependencies: deps } : undefined,
  );
  await engine.initialize();
  engine.connect();
  return engine;
}

describe("Q10-08 Communication Runtime", () => {
  beforeEach(resetCommunicationRuntimeForTesting);

  test("1 locks mandatory boundaries", () => {
    const c = buildCommunicationRuntimeConfiguration(REPO_ROOT, {
      neverFabricateMessages: false as never,
      neverLoseAcknowledgedMessages: false as never,
      neverBypassPillowGovernance: false as never,
      neverBypassGrandKingApproval: false as never,
      neverImplementQ1009OrLater: false as never,
      neverExecuteBusinessLogic: false as never,
      neverReplaceWorkerImplementations: false as never,
      neverReplaceOrchestrationLogic: false as never,
      deterministicMessageRouting: false as never,
      structuralSignalOnly: false as never,
      maskSensitiveValues: false as never,
    });
    assert.equal(c.neverFabricateMessages, true);
    assert.equal(c.neverLoseAcknowledgedMessages, true);
    assert.equal(c.neverBypassPillowGovernance, true);
    assert.equal(c.neverBypassGrandKingApproval, true);
    assert.equal(c.neverImplementQ1009OrLater, true);
    assert.equal(c.neverExecuteBusinessLogic, true);
    assert.equal(c.neverReplaceWorkerImplementations, true);
    assert.equal(c.neverReplaceOrchestrationLogic, true);
    assert.equal(c.deterministicMessageRouting, true);
    assert.equal(c.preserveCompleteTraceability, true);
    assert.equal(c.preserveCommunicationHistory, true);
    assert.equal(c.preserveAuditHistory, true);
    assert.equal(c.structuralSignalOnly, true);
    assert.equal(c.maskSensitiveValues, true);
  });

  test("2 initializes PILLOW-COMRT-001 Q10-08", async () => {
    const state = (await build()).getState();
    assert.equal(state.missionId, "Q10-08");
    assert.equal(state.engineVersion, "PILLOW-COMRT-001");
    assert.equal(state.configuration.workerId, "wkr-communication-runtime-01");
    assert.equal(state.configuration.factory, "pillow-communication");
    for (const target of INTEGRATION_TARGETS) {
      assert.ok(state.configuration.integrationTargets.includes(target));
    }
    assert.ok(COMRT_CAPABILITIES.includes("route_messages_deterministically"));
    assert.ok(COMRT_CAPABILITIES.includes("q1009_consumable_contract"));
    assert.equal(MESSAGE_TYPES.length, 10);
    assert.equal(DELIVERY_STATUSES.length, 7);
    assert.equal(CHANNEL_TYPES.length, 4);
    assert.ok(PRIORITIES.includes("critical"));
  });

  test("3 worker-to-worker messaging succeeds", async () => {
    const engine = await build();
    const report = engine.sendMessage(
      sampleInput({
        sender: "wkr-alpha",
        receiver: "wkr-beta",
        messageType: "point_to_point",
        channelType: "worker_to_worker",
        channelId: "chan-wkr-alpha-beta",
        contextReference: "ctx://structural/worker/alpha-to-beta",
        syncMode: "async",
      }),
    );
    assert.equal(report.decision, "pass");
    assert.ok(report.message);
    assert.equal(report.message!.sender, "wkr-alpha");
    assert.equal(report.message!.receiver, "wkr-beta");
    assert.equal(report.message!.channelType, "worker_to_worker");
    assert.equal(report.message!.deliveryStatus, "delivered");
    assert.equal(report.message!.fabricated, false);
    assert.equal(report.message!.structuralSignalOnly, true);
  });

  test("4 factory-to-factory messaging succeeds", async () => {
    const engine = await build();
    const report = engine.sendMessage(
      sampleInput({
        sender: "factory-pillow",
        receiver: "factory-capital",
        messageType: "event",
        channelType: "factory_to_factory",
        channelId: "chan-factory-pillow-capital",
        contextReference: "ctx://structural/factory/pillow-to-capital",
        syncMode: "async",
      }),
    );
    assert.equal(report.decision, "pass");
    assert.ok(report.message);
    assert.equal(report.message!.channelType, "factory_to_factory");
    assert.equal(report.message!.deliveryStatus, "delivered");
  });

  test("5 synchronous messaging succeeds (request+response correlation)", async () => {
    const engine = await build();
    const report = engine.sendMessage(
      sampleInput({
        sender: "wkr-gamma",
        receiver: "wkr-delta",
        messageType: "request",
        channelType: "worker_to_worker",
        channelId: "chan-wkr-gamma-delta",
        contextReference: "ctx://structural/sync/request-01",
        syncMode: "sync",
      }),
    );
    assert.equal(report.decision, "pass");
    assert.ok(report.messages.length >= 2);
    const request = report.messages.find((m) => m.messageType === "request");
    const response = report.messages.find((m) => m.messageType === "response");
    assert.ok(request);
    assert.ok(response);
    assert.equal(request!.correlationId, response!.correlationId);
    assert.equal(request!.syncMode, "sync");
    assert.equal(response!.syncMode, "sync");
    assert.equal(response!.fabricated, false);
  });

  test("6 asynchronous messaging succeeds", async () => {
    const engine = await build();
    const report = engine.sendMessage(
      sampleInput({
        sender: "runtime-comrt",
        receiver: "runtime-orchestration",
        messageType: "event",
        channelType: "runtime_service",
        channelId: "chan-runtime-service-01",
        contextReference: "ctx://structural/async/event-01",
        syncMode: "async",
      }),
    );
    assert.equal(report.decision, "pass");
    assert.ok(report.message);
    assert.equal(report.message!.syncMode, "async");
    assert.equal(report.message!.deliveryStatus, "delivered");
    assert.ok(report.deliveries.some((d) => d.status === "pending"));
    assert.ok(report.deliveries.some((d) => d.status === "routed"));
    assert.ok(report.deliveries.some((d) => d.status === "delivered"));
  });

  test("7 retries function (simulateFailure then retry)", async () => {
    const engine = await build();
    const failed = engine.sendMessage(
      sampleInput({
        sender: "wkr-alpha",
        receiver: "wkr-beta",
        messageType: "point_to_point",
        channelId: "chan-wkr-alpha-beta",
        contextReference: "ctx://structural/retry/fail-01",
        syncMode: "async",
        simulateFailure: true,
        maxRetries: 3,
      }),
    );
    assert.equal(failed.decision, "fail");
    assert.equal(failed.message!.deliveryStatus, "failed");

    const retried = engine.retryFailed(
      sampleInput({
        messageId: failed.message!.messageId,
        channelId: "chan-wkr-alpha-beta",
      }),
    );
    assert.equal(retried.decision, "pass");
    assert.ok(retried.message);
    assert.equal(retried.message!.deliveryStatus, "delivered");
    assert.ok(retried.message!.retryCount >= 1);
  });

  test("8 history preserved including acknowledged messages", async () => {
    const engine = await build();
    const sent = engine.sendMessage(
      sampleInput({
        sender: "wkr-alpha",
        receiver: "wkr-beta",
        messageType: "event",
        channelId: "chan-wkr-alpha-beta",
        contextReference: "ctx://structural/ack/preserve-01",
        syncMode: "async",
      }),
    );
    assert.equal(sent.decision, "pass");
    const ack = engine.acknowledgeMessage(
      sampleInput({
        messageId: sent.message!.messageId,
        channelId: "chan-wkr-alpha-beta",
      }),
    );
    assert.equal(ack.decision, "pass");
    assert.equal(ack.message!.deliveryStatus, "acknowledged");
    assert.ok(ack.message!.acknowledgedAt);

    const history = engine.getHistory();
    const stillPresent = history.messages.find((m) => m.messageId === sent.message!.messageId);
    assert.ok(stillPresent);
    assert.equal(stillPresent!.deliveryStatus, "acknowledged");
    assert.ok(history.messageHistory.some((m) => m.messageId === sent.message!.messageId));
    assert.ok(engine.getAuditTrail().some((e) => e.startsWith("message_saved:")));
  });

  test("9 collaboration session works", async () => {
    const engine = await build();
    const opened = engine.openCollaborationSession(
      sampleInput({
        participants: ["wkr-alpha", "wkr-gamma"],
        contextReference: "ctx://structural/session/collab-live",
      }),
    );
    assert.equal(opened.decision, "pass");
    assert.ok(opened.session);
    assert.equal(opened.session!.status, "open");

    const sent = engine.sendMessage(
      sampleInput({
        sender: "wkr-alpha",
        receiver: "wkr-gamma",
        messageType: "collaboration",
        sessionId: opened.session!.sessionId,
        channelType: "collaboration_session",
        contextReference: "ctx://structural/session/msg-01",
        syncMode: "async",
      }),
    );
    assert.equal(sent.decision, "pass");

    const closed = engine.closeCollaborationSession(
      sampleInput({ sessionId: opened.session!.sessionId }),
    );
    assert.equal(closed.decision, "pass");
    assert.equal(closed.session!.status, "closed");
    assert.ok(closed.session!.endedAt);
  });

  test("10 full Communication Runtime Report + consumableByQ1009", async () => {
    const engine = await build();
    engine.sendMessage(
      sampleInput({
        sender: "wkr-alpha",
        receiver: "wkr-beta",
        messageType: "event",
        channelId: "chan-wkr-alpha-beta",
        contextReference: "ctx://structural/report/evidence-01",
        syncMode: "async",
      }),
    );
    const report = engine.produceReport(sampleInput());
    assert.equal(report.decision, "pass");
    const comrt = report.communicationRuntimeReport;
    assert.ok(comrt);
    assert.ok(comrt!.reportId.startsWith("comrt-rpt"));
    assert.ok(comrt!.timestamp);
    assert.equal(comrt!.runtimeVersion, COMRT_RUNTIME_VERSION);
    assert.ok(Array.isArray(comrt!.activeCommunicationChannels));
    assert.ok(comrt!.messageStatistics);
    assert.ok(comrt!.deliverySummary);
    assert.ok(comrt!.retrySummary);
    assert.ok(Array.isArray(comrt!.failedDeliveries));
    assert.ok(Array.isArray(comrt!.collaborationSessions));
    assert.ok(comrt!.runtimeHealth);
    assert.ok(Array.isArray(comrt!.supportingEvidence));
    assert.ok(comrt!.auditStatus);
    assert.ok(Array.isArray(comrt!.outstandingIssues));
    assert.ok(typeof comrt!.confidenceScore === "number");
    assert.equal(comrt!.metadataVersion, COMRT_METADATA_VERSION);
    assert.equal(comrt!.reportVersion, COMRT_REPORT_VERSION);
    assert.equal(comrt!.consumableByQ1009, true);
    assert.equal(comrt!.neverImplementQ1009OrLater, true);
    assert.equal(comrt!.neverFabricateMessages, true);
    assert.equal(comrt!.neverLoseAcknowledgedMessages, true);
    assert.ok(engine.getHistory().reports.length >= 1);
  });

  test("11 Q1009 contract without implementing Approval Runtime", async () => {
    const engine = await build({
      toolRuntime: {
        getQ1008ConsumableContract: () => ({
          contractId: "toolrt-q1008-contract-v1",
          consumerMissionId: "Q10-08",
        }),
      },
      executiveReportingRuntime: {
        submitWorkerReport: () => ({ records: [{ reportId: "ert-comrt-test" }] }),
      },
    });
    engine.produceReport(sampleInput());
    engine.submitReport(sampleInput());
    const contract = engine.getQ1009ConsumableContract();
    assert.equal(contract.producedBy, "communication-runtime");
    assert.equal(contract.missionId, "Q10-08");
    assert.equal(contract.consumerMissionId, "Q10-09");
    assert.equal(contract.neverImplementQ1009OrLater, true);
    assert.equal(contract.structuralSignalOnly, true);
    assert.ok(contract.exposedFields.includes("activeCommunicationChannels"));
    const cockpit = engine.getCockpitSnapshot();
    assert.equal(cockpit.missionId, "Q10-08");
    assert.equal(cockpit.neverImplementQ1009OrLater, true);
    assert.equal(cockpit.neverFabricateMessages, true);
    assert.ok(cockpit.totalChannels >= 5);
  });

  test("12 rejects fabricate / Q10-09+ / governance bypass", async () => {
    const engine = await build();
    const fabricate = engine.validate(sampleInput({ fabricateMessage: true }));
    assert.equal(fabricate.decision, "fail");
    assert.ok(fabricate.errors.some((e) => e.toLowerCase().includes("fabricat")));

    const scope = engine.validate(
      sampleInput({ implementQ1009OrLater: true, targetMissionId: "Q10-09" }),
    );
    assert.equal(scope.decision, "fail");
    assert.ok(
      scope.errors.some((e) => e.includes("Q10-09") || e.includes("Q10-09 or later")),
    );

    const bypass = engine.validate(sampleInput({ bypassPillowGovernance: true }));
    assert.equal(bypass.decision, "fail");
    assert.ok(bypass.errors.some((e) => e.toLowerCase().includes("pillow")));

    const grandKing = engine.validate(sampleInput({ bypassGrandKingApproval: true }));
    assert.equal(grandKing.decision, "fail");
  });
});
