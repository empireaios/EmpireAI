import assert from "node:assert/strict";
import path from "node:path";
import { describe, test, beforeEach } from "node:test";

const REPO_ROOT = path.resolve(import.meta.dirname, "..", "..", "..", "..");

import { runBootstrap } from "../../bootstrap/engine.js";
import {
  createCustomerIdentityEngine,
  resetCustomerIdentityEngineForTesting,
} from "../../customer-identity-engine/index.js";
import {
  createCrmFoundationEngine,
  resetCrmFoundationForTesting,
} from "../../crm-foundation/index.js";
import {
  createCustomerTimelineEngine,
  resetCustomerTimelineEngineForTesting,
  buildCustomerTimelineEngineConfiguration,
  CUSTOMER_TIMELINE_ENGINE_SYSTEM_PATH,
  CTE_METADATA_VERSION,
  CTE_CAPABILITIES,
} from "../../customer-timeline-engine/index.js";
import { appendCteLog, getCteLogs } from "../../customer-timeline-engine/cte-logging.js";

async function buildTimelineStack() {
  const bootstrap = await runBootstrap({ repositoryRoot: REPO_ROOT, skipHeavyScans: true });
  const identity = createCustomerIdentityEngine(bootstrap);
  await identity.initialize();
  identity.connectCustomerIdentityEngine();
  const created = identity.createCustomerIdentity({
    customerName: "Timeline Test User",
    customerIdentifiers: [
      { identifierType: "email", identifierValue: "timeline@example.com", channel: null },
    ],
  });
  const customerId = created.customerRecords[0].customerId;
  const crm = createCrmFoundationEngine(bootstrap, identity);
  await crm.initialize();
  crm.connectCrmFoundation();
  crm.createCustomerProfile({ customerId, customerOwner: "support-team" });
  const timeline = createCustomerTimelineEngine(bootstrap, identity, crm);
  await timeline.initialize();
  return { bootstrap, identity, crm, timeline, customerId };
}

describe("Customer Timeline Engine (R4-03 / PILLOW-CTE-001)", () => {
  beforeEach(() => {
    resetCustomerIdentityEngineForTesting();
    resetCrmFoundationForTesting();
    resetCustomerTimelineEngineForTesting();
  });

  test("configuration defaults are valid", () => {
    const config = buildCustomerTimelineEngineConfiguration(REPO_ROOT);
    assert.equal(config.enabled, true);
    assert.equal(config.defaultSearchLimit, 100);
    assert.equal(config.maskSensitiveValues, true);
    assert.ok(config.eventClassificationRules.length >= 5);
  });

  test("initializes with governance doc", async () => {
    const { timeline } = await buildTimelineStack();
    const state = timeline.getState();
    assert.equal(state.engineVersion, "PILLOW-CTE-001");
    assert.equal(state.missionId, "R4-03");
    assert.equal(state.status, "active");
  });

  test("connect produces engine record with upstream links", async () => {
    const { timeline } = await buildTimelineStack();
    const report = timeline.connectCustomerTimelineEngine();
    assert.equal(report.action, "connect");
    assert.equal(report.metadataVersion, CTE_METADATA_VERSION);
    assert.ok(report.engineRecord);
    assert.equal(report.engineRecord!.identityEngineConnected, true);
    assert.equal(report.engineRecord!.crmFoundationConnected, true);
  });

  test("records timeline events chronologically", async () => {
    const { timeline, customerId } = await buildTimelineStack();
    timeline.connectCustomerTimelineEngine();
    timeline.recordCustomerInteraction({
      customerId,
      eventReference: "int-001",
      eventDescription: "Visited product page",
    });
    timeline.recordPurchase({
      customerId,
      eventReference: "ord-001",
      eventDescription: "Completed purchase order-001",
    });
    const history = timeline.getCustomerTimeline(customerId);
    assert.ok(history.length >= 2);
    assert.ok(history[0]!.timestamp <= history[1]!.timestamp);
  });

  test("records support, communication, account change and milestone", async () => {
    const { timeline, customerId } = await buildTimelineStack();
    timeline.connectCustomerTimelineEngine();
    timeline.recordSupportActivity({
      customerId,
      eventReference: "tkt-001",
      eventDescription: "Opened support ticket",
    });
    timeline.recordCommunication({
      customerId,
      eventReference: "email-001",
      eventDescription: "Sent welcome email",
    });
    timeline.recordAccountChange({
      customerId,
      eventReference: "acct-upd-001",
      eventDescription: "Updated billing address",
    });
    timeline.recordCustomerMilestone({
      customerId,
      eventReference: "ms-001",
      eventDescription: "First purchase milestone",
    });
    const history = timeline.getCustomerTimeline(customerId);
    assert.equal(history.length, 4);
    const types = new Set(history.map((r) => r.eventType));
    assert.ok(types.has("support"));
    assert.ok(types.has("communication"));
    assert.ok(types.has("account_change"));
    assert.ok(types.has("milestone"));
  });

  test("rejects duplicate events", async () => {
    const { timeline, customerId } = await buildTimelineStack();
    timeline.connectCustomerTimelineEngine();
    timeline.recordPurchase({
      customerId,
      eventReference: "ord-dup",
      eventDescription: "First purchase",
    });
    const dup = timeline.recordPurchase({
      customerId,
      eventReference: "ord-dup",
      eventDescription: "Duplicate purchase",
    });
    assert.equal(dup.validation.decision, "fail");
  });

  test("searches timeline history", async () => {
    const { timeline, customerId } = await buildTimelineStack();
    timeline.connectCustomerTimelineEngine();
    timeline.recordPurchase({
      customerId,
      eventReference: "ord-search",
      eventDescription: "Premium subscription purchase",
    });
    const search = timeline.searchTimelineHistory({
      query: "premium",
      customerId,
    });
    assert.equal(search.action, "search_timeline");
    assert.ok(search.searchResults.length >= 1);
  });

  test("produces machine-readable timeline records", async () => {
    const { timeline, customerId } = await buildTimelineStack();
    timeline.connectCustomerTimelineEngine();
    const recorded = timeline.recordTimelineEvent({
      customerId,
      eventType: "event",
      eventSource: "system",
      eventReference: "evt-001",
      eventDescription: "System event recorded",
    });
    const timelineRecordId = recorded.timelineRecords[0].timelineRecordId;
    const machine = timeline.getMachineReadableRecord(timelineRecordId);
    assert.ok(machine);
    assert.equal(machine!.metadataVersion, CTE_METADATA_VERSION);
    assert.equal(machine!.eventType, "event");
  });

  test("redacts sensitive values in logs", () => {
    appendCteLog({
      event: "test_redaction",
      level: "info",
      details: "token=secret789 password=hidden",
    });
    const logs = getCteLogs(5);
    const entry = logs.find((l) => l.event === "test_redaction");
    assert.ok(entry);
    assert.ok(entry!.details.includes("redacted"));
    assert.ok(!entry!.details.includes("secret789"));
  });

  test("cockpit and supervisor sync", async () => {
    const { timeline, customerId } = await buildTimelineStack();
    timeline.connectCustomerTimelineEngine();
    timeline.recordCustomerInteraction({
      customerId,
      eventReference: "int-sync",
      eventDescription: "Interaction for sync test",
    });
    const cockpit = timeline.getCockpitSnapshot();
    assert.equal(cockpit.engineStatus, "active");
    assert.ok(cockpit.totalTimelineRecords >= 1);
    assert.equal(cockpit.identityEngineConnected, true);
    const sync = timeline.validateForSupervisorSync();
    assert.ok(sync.valid);
    assert.ok(sync.readinessScore >= 50);
  });

  test("exports capabilities and governance path", () => {
    assert.equal(
      CUSTOMER_TIMELINE_ENGINE_SYSTEM_PATH,
      "docs/governance/EMPIREAI_CUSTOMER_TIMELINE_ENGINE_SYSTEM.md",
    );
    assert.ok(CTE_CAPABILITIES.includes("event_recording"));
    assert.ok(CTE_CAPABILITIES.includes("timeline_search"));
  });
});
