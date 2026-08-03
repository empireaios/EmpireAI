import assert from "node:assert/strict";
import path from "node:path";
import { beforeEach, describe, test } from "node:test";
import { runBootstrap } from "../../bootstrap/engine.js";
import {
  DELIVERY_STATUSES,
  IWM_CAPABILITIES,
  MESSAGE_TYPES,
  buildInterWorkerMessagingConfiguration,
  createInterWorkerMessaging,
  resetInterWorkerMessagingForTesting,
} from "../../inter-worker-messaging/index.js";

const REPO_ROOT = path.resolve(import.meta.dirname, "..", "..", "..", "..");

async function build(config?: Parameters<typeof createInterWorkerMessaging>[1]) {
  const bootstrap = await runBootstrap({ repositoryRoot: REPO_ROOT, skipHeavyScans: true });
  const engine = createInterWorkerMessaging(bootstrap, config);
  await engine.initialize();
  engine.connectInterWorkerMessaging();
  return engine;
}

describe("Q0-24 Inter-Worker Messaging", () => {
  beforeEach(resetInterWorkerMessagingForTesting);

  test("1 locks mandatory inter-worker-messaging boundaries", () => {
    const c = buildInterWorkerMessagingConfiguration(REPO_ROOT, {
      neverExecuteWorkerLogic: false as never,
      neverModifyWorkerDecisions: false as never,
      neverReplaceWorkforceOrchestrator: false as never,
      neverOverridePillow: false as never,
      neverOverrideGrandKing: false as never,
    });
    assert.equal(c.neverExecuteWorkerLogic, true);
    assert.equal(c.neverModifyWorkerDecisions, true);
    assert.equal(c.neverReplaceWorkforceOrchestrator, true);
    assert.equal(c.neverOverridePillow, true);
    assert.equal(c.neverOverrideGrandKing, true);
  });

  test("2 initializes PILLOW-IWM-001 for Q0-24", async () => {
    const state = (await build()).getState();
    assert.equal(state.missionId, "Q0-24");
    assert.equal(state.engineVersion, "PILLOW-IWM-001");
    for (const type of MESSAGE_TYPES) {
      assert.ok(state.configuration.messageTypes.includes(type));
    }
    for (const status of DELIVERY_STATUSES) {
      assert.ok(
        ["queued", "sent", "delivered", "read", "acknowledged", "failed", "expired"].includes(
          status,
        ),
      );
    }
  });

  test("3 worker A sends a message to worker B", async () => {
    const report = (await build()).sendMessage({
      senderWorker: "wcr-wkr-strategy-01",
      receiverWorker: "wcr-wkr-ops-01",
      businessId: "biz-marketplace",
      missionId: "Q0-24",
      messageType: "task_request",
      priority: "high",
      messageSummary: "Please validate expansion checklist",
      payloadReference: "payload://task/expansion-01",
      validated: true,
    });
    assert.equal(report.records[0]!.senderWorker, "wcr-wkr-strategy-01");
    assert.equal(report.records[0]!.receiverWorker, "wcr-wkr-ops-01");
    assert.equal(report.records[0]!.messageType, "task_request");
    assert.ok(report.records[0]!.messageId.startsWith("iwm-msg-"));
    assert.equal(report.routed, true);
  });

  test("4 worker B replies with preserved mission and business context", async () => {
    const engine = await build();
    const sent = engine.sendMessage({
      senderWorker: "wcr-wkr-strategy-01",
      receiverWorker: "wcr-wkr-ops-01",
      businessId: "biz-marketplace",
      missionId: "Q0-24",
      conversationId: "conv-expansion-01",
      messageType: "task_request",
      messageSummary: "Need ops confirmation",
      validated: true,
    });
    const reply = engine.replyMessage({
      inReplyTo: sent.records[0]!.messageId,
      senderWorker: "wcr-wkr-ops-01",
      messageSummary: "Ops confirmation complete",
      validated: true,
    });
    assert.equal(reply.records[0]!.messageType, "task_response");
    assert.equal(reply.records[0]!.missionId, "Q0-24");
    assert.equal(reply.records[0]!.businessId, "biz-marketplace");
    assert.equal(reply.records[0]!.conversationId, "conv-expansion-01");
    assert.equal(reply.records[0]!.inReplyTo, sent.records[0]!.messageId);
    assert.equal(reply.records[0]!.receiverWorker, "wcr-wkr-strategy-01");
  });

  test("5 delivery tracking advances status", async () => {
    const engine = await build();
    const sent = engine.sendMessage({
      senderWorker: "wcr-wkr-strategy-01",
      receiverWorker: "wcr-wkr-ops-01",
      businessId: "biz-marketplace",
      missionId: "Q0-24",
      messageType: "information",
      messageSummary: "Delivery tracking sample",
      validated: true,
    });
    assert.equal(sent.deliveryStatus, "delivered");
    const tracked = engine.trackDelivery({
      messageId: sent.records[0]!.messageId,
      deliveryStatus: "read",
      validated: true,
    });
    assert.equal(tracked.deliveryStatus, "read");
    assert.ok(tracked.records[0]!.deliveryHistory.includes("queued"));
    assert.ok(tracked.records[0]!.deliveryHistory.includes("sent"));
    assert.ok(tracked.records[0]!.deliveryHistory.includes("delivered"));
    assert.ok(tracked.records[0]!.deliveryHistory.includes("read"));
  });

  test("6 communication history is searchable", async () => {
    const engine = await build();
    engine.sendMessage({
      senderWorker: "wcr-wkr-strategy-01",
      receiverWorker: "wcr-wkr-finance-01",
      businessId: "biz-marketplace",
      missionId: "Q0-24",
      messageType: "approval_request",
      messageSummary: "Budget approval for region A",
      validated: true,
    });
    const found = engine.searchHistory({
      searchQuery: "budget approval",
      searchMissionId: "Q0-24",
      searchBusinessId: "biz-marketplace",
      validated: true,
    });
    assert.ok(found.records.length >= 1);
    assert.ok(found.records.some((r) => r.messageSummary.includes("Budget approval")));
  });

  test("7 supports broadcast and priority messaging", async () => {
    const report = (await build()).broadcastMessage({
      senderWorker: "wcr-wkr-strategy-01",
      businessId: "biz-marketplace",
      missionId: "Q0-24",
      priority: "critical",
      messageSummary: "System-wide ops freeze notice",
      validated: true,
    });
    assert.equal(report.records[0]!.isBroadcast, true);
    assert.equal(report.records[0]!.messageType, "broadcast");
    assert.equal(report.records[0]!.priority, "critical");
    assert.equal(report.records[0]!.receiverWorker, "*broadcast*");
  });

  test("8 rejects execute / modify / orchestrator / Pillow / Grand King boundaries", async () => {
    const engine = await build();
    const base = {
      senderWorker: "wcr-wkr-strategy-01",
      receiverWorker: "wcr-wkr-ops-01",
      businessId: "biz-marketplace",
      missionId: "Q0-24",
      messageSummary: "Boundary test",
      validated: true,
    };
    assert.equal(
      engine.sendMessage({ ...base, executeWorkerLogic: true }).validation.decision,
      "fail",
    );
    assert.equal(
      engine.replyMessage({ ...base, modifyWorkerDecisions: true }).validation.decision,
      "fail",
    );
    assert.equal(
      engine.routeMessage({ ...base, replaceWorkforceOrchestrator: true }).validation.decision,
      "fail",
    );
    assert.equal(
      engine.broadcastMessage({ ...base, overridePillow: true }).validation.decision,
      "fail",
    );
    assert.equal(
      engine.trackDelivery({ ...base, overrideGrandKing: true }).validation.decision,
      "fail",
    );
  });

  test("9 supports extensible message types", async () => {
    const engine = await build({
      configuration: {
        messageTypes: [...MESSAGE_TYPES, "handoff_notice"],
      },
    });
    assert.ok(engine.getState().configuration.messageTypes.includes("handoff_notice"));
    assert.ok(IWM_CAPABILITIES.includes("extensible_message_types"));
  });

  test("10 produces machine-readable message records and validates them", async () => {
    const engine = await build();
    engine.sendMessage({
      senderWorker: "wcr-wkr-strategy-01",
      receiverWorker: "wcr-wkr-ops-01",
      businessId: "biz-marketplace",
      missionId: "Q0-24",
      conversationId: "conv-validate-01",
      messageType: "review_request",
      priority: "medium",
      messageSummary: "Please review launch package",
      payloadReference: "payload://review/launch-01",
      validated: true,
    });
    const validation = engine.validateInterWorkerMessaging({ validated: true });
    assert.ok(
      validation.validation.decision === "pass" || validation.validation.decision === "partial",
    );
    assert.equal(engine.getRecords().length, 1);
    const record = engine.getLatestRecord()!;
    assert.equal(record.workerLogicExecuted, false);
    assert.equal(record.workerDecisionsModified, false);
    assert.equal(record.workforceOrchestratorReplaced, false);
    assert.equal(record.pillowOverridden, false);
    assert.equal(record.grandKingOverridden, false);
    assert.equal(record.metadataVersion, "IWM-001-v1");
    assert.ok(record.messageId);
    assert.ok(record.timestamp);
    assert.ok(record.senderWorker);
    assert.ok(record.receiverWorker);
    assert.ok(record.businessId);
    assert.ok(record.missionId);
    assert.ok(record.conversationId);
    assert.ok(record.messageType);
    assert.ok(record.priority);
    assert.ok(record.messageSummary);
    assert.ok(record.payloadReference);
    assert.ok(record.deliveryStatus);
  });
});
