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
} from "../../customer-timeline-engine/index.js";
import type { CustomerSentimentEngine } from "../../customer-sentiment-engine/engine.js";
import type { LoyaltyProgrammeEngine } from "../../loyalty-programme-engine/engine.js";
import type { CustomerRiskEngine } from "../../customer-risk-engine/engine.js";
import type { CustomerLifetimeValueEngine } from "../../customer-lifetime-value-engine/engine.js";
import {
  createCustomerSegmentationEngine,
  resetCustomerSegmentationEngineForTesting,
  buildCustomerSegmentationEngineConfiguration,
  CUSTOMER_SEGMENTATION_ENGINE_SYSTEM_PATH,
  CSEG_METADATA_VERSION,
  CSEG_CAPABILITIES,
} from "../../customer-segmentation-engine/index.js";
import { appendCsegLog, getCsegLogs } from "../../customer-segmentation-engine/cseg-logging.js";

async function buildSegmentationStack() {
  const bootstrap = await runBootstrap({ repositoryRoot: REPO_ROOT, skipHeavyScans: true });
  const identity = createCustomerIdentityEngine(bootstrap);
  await identity.initialize();
  identity.connectCustomerIdentityEngine();
  const created = identity.createCustomerIdentity({
    customerName: "Segment Test User",
    customerIdentifiers: [
      { identifierType: "email", identifierValue: "segment@example.com", channel: null },
    ],
  });
  const customerId = created.customerRecords[0].customerId;
  const crm = createCrmFoundationEngine(bootstrap, identity);
  await crm.initialize();
  crm.connectCrmFoundation();
  crm.createCustomerProfile({
    customerId,
    customerOwner: "engagement-team",
    contactInformation: { email: "segment@example.com" },
  });
  const timeline = createCustomerTimelineEngine(bootstrap, identity, crm);
  await timeline.initialize();
  timeline.connectCustomerTimelineEngine();
  for (let i = 0; i < 3; i += 1) {
    timeline.recordPurchase({
      customerId,
      eventReference: `purchase-${i}`,
      eventDescription: `Purchase ${i + 1}`,
    });
  }

  const segmentation = createCustomerSegmentationEngine(
    bootstrap,
    identity,
    crm,
    timeline,
    null as unknown as CustomerSentimentEngine,
    null as unknown as LoyaltyProgrammeEngine,
    null as unknown as CustomerRiskEngine,
    null as unknown as CustomerLifetimeValueEngine,
    { configuration: { frequentPurchaseThreshold: 3, minSegmentConfidence: 40 } },
  );
  await segmentation.initialize();
  return { segmentation, customerId };
}

describe("Customer Segmentation Engine (R4-16 / PILLOW-CSEG-001)", () => {
  beforeEach(() => {
    resetCustomerIdentityEngineForTesting();
    resetCrmFoundationForTesting();
    resetCustomerTimelineEngineForTesting();
    resetCustomerSegmentationEngineForTesting();
  });

  test("configuration defaults are valid", () => {
    const config = buildCustomerSegmentationEngineConfiguration(REPO_ROOT);
    assert.equal(config.enabled, true);
    assert.equal(config.maskSensitiveValues, true);
    assert.ok(config.segmentationRules.length >= 1);
    assert.ok(config.classificationRules.length >= 1);
    assert.ok(config.dynamicUpdateRules.length >= 1);
  });

  test("initializes with governance doc", async () => {
    const { segmentation } = await buildSegmentationStack();
    const state = segmentation.getState();
    assert.equal(state.engineVersion, "PILLOW-CSEG-001");
    assert.equal(state.missionId, "R4-16");
    assert.equal(state.status, "active");
    assert.ok(CUSTOMER_SEGMENTATION_ENGINE_SYSTEM_PATH.includes("SEGMENTATION"));
    assert.ok(CSEG_CAPABILITIES.includes("segment_creation"));
  });

  test("connect produces engine record with upstream links", async () => {
    const { segmentation } = await buildSegmentationStack();
    const report = segmentation.connectSegmentationEngine();
    assert.equal(report.action, "connect");
    assert.equal(report.metadataVersion, CSEG_METADATA_VERSION);
    assert.equal(report.engineRecord!.identityEngineConnected, true);
    assert.equal(report.engineRecord!.crmFoundationConnected, true);
    assert.equal(report.engineRecord!.timelineEngineConnected, true);
  });

  test("creates customer segments", async () => {
    const { segmentation } = await buildSegmentationStack();
    segmentation.connectSegmentationEngine();
    const report = segmentation.createCustomerSegment({
      segmentName: "vip_customers",
      segmentType: "value",
      description: "VIP customer segment",
    });
    assert.equal(report.action, "create_segment");
    assert.equal(report.segments.length, 1);
    assert.match(report.segments[0].segmentId, /^cseg-seg-/);
    assert.equal(report.segments[0].segmentName, "vip_customers");
  });

  test("assigns customers to segments automatically", async () => {
    const { segmentation, customerId } = await buildSegmentationStack();
    segmentation.connectSegmentationEngine();
    const report = segmentation.assignCustomerToSegments({ customerId });
    assert.equal(report.action, "assign_segments");
    assert.equal(report.segmentationRecords.length, 1);
    assert.match(report.segmentationRecords[0].segmentationRecordId, /^cseg-rec-/);
    assert.ok(report.segmentationRecords[0].assignedSegments.length >= 1);
    assert.ok(report.segmentationRecords[0].segmentConfidence >= 40);
    assert.ok(report.segmentationRecords[0].behaviourProfile);
  });

  test("segments by demographics, purchasing, value, loyalty, sentiment and risk", async () => {
    const { segmentation, customerId } = await buildSegmentationStack();
    segmentation.connectSegmentationEngine();

    const demographics = segmentation.segmentByDemographics({ customerId });
    assert.equal(demographics.action, "segment_demographics");
    assert.ok(demographics.segmentationRecords[0].assignedSegments.includes("contactable"));

    const purchasing = segmentation.segmentByPurchasingBehaviour({ customerId });
    assert.equal(purchasing.action, "segment_purchasing");
    assert.ok(purchasing.segmentationRecords[0].assignedSegments.includes("frequent_buyer"));

    const value = segmentation.segmentByCustomerValue({ customerId });
    assert.equal(value.action, "segment_value");

    const loyalty = segmentation.segmentByLoyaltyStatus({ customerId });
    assert.equal(loyalty.action, "segment_loyalty");

    const sentiment = segmentation.segmentByCustomerSentiment({ customerId });
    assert.equal(sentiment.action, "segment_sentiment");
    assert.ok(sentiment.segmentationRecords[0].assignedSegments.includes("neutral_sentiment"));

    const risk = segmentation.segmentByCustomerRisk({ customerId });
    assert.equal(risk.action, "segment_risk");
    assert.ok(risk.segmentationRecords[0].assignedSegments.includes("low_risk"));
  });

  test("detects segment changes on reassignment", async () => {
    const { segmentation, customerId } = await buildSegmentationStack();
    segmentation.connectSegmentationEngine();
    segmentation.assignCustomerToSegments({ customerId });

    const timeline = segmentation.getEngineRecord();
    assert.ok(timeline);

    const changes = segmentation.detectSegmentChanges({ customerId });
    assert.equal(changes.action, "detect_changes");
    assert.ok(changes.segmentationRecords.length >= 1);
  });

  test("produces machine-readable segmentation records", async () => {
    const { segmentation, customerId } = await buildSegmentationStack();
    segmentation.connectSegmentationEngine();
    const report = segmentation.assignCustomerToSegments({ customerId });
    const recordId = report.segmentationRecords[0].segmentationRecordId;
    const machine = segmentation.getMachineReadableRecord(recordId);
    assert.ok(machine);
    assert.equal(machine!.segmentationRecordId, recordId);
    assert.equal(machine!.metadataVersion, CSEG_METADATA_VERSION);
    assert.equal(machine!.customerId, customerId);
  });

  test("reports segmentation status and health", async () => {
    const { segmentation, customerId } = await buildSegmentationStack();
    segmentation.connectSegmentationEngine();
    segmentation.assignCustomerToSegments({ customerId });

    const status = segmentation.reportSegmentationStatus();
    assert.equal(status.action, "report_status");
    assert.ok(status.segmentationRecords.length >= 1);

    const health = segmentation.reportSegmentationHealth();
    assert.equal(health.action, "report_health");
    assert.equal(health.validation.decision, "pass");
  });

  test("redacts sensitive log values", () => {
    appendCsegLog({
      event: "segment_assignment",
      level: "info",
      details: "token=secret-api-key-value should be redacted",
    });
    const logs = getCsegLogs(5);
    assert.match(logs.at(-1)!.details, /redacted/i);
  });

  test("cockpit snapshot and supervisor sync", async () => {
    const { segmentation, customerId } = await buildSegmentationStack();
    segmentation.connectSegmentationEngine();
    segmentation.assignCustomerToSegments({ customerId });

    const cockpit = segmentation.getCockpitSnapshot();
    assert.equal(cockpit.engineStatus, "active");
    assert.ok(cockpit.totalSegmentationRecords >= 1);

    const sync = segmentation.validateForSupervisorSync();
    assert.equal(sync.valid, true);
    assert.ok(sync.readinessScore >= 70);
  });
});
