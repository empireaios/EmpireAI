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
import type { CustomerLifetimeValueEngine } from "../../customer-lifetime-value-engine/engine.js";
import {
  createCustomerSegmentationEngine,
  resetCustomerSegmentationEngineForTesting,
} from "../../customer-segmentation-engine/index.js";
import {
  createCustomerJourneyIntelligenceEngine,
  resetCustomerJourneyIntelligenceEngineForTesting,
  buildCustomerJourneyIntelligenceConfiguration,
  CUSTOMER_JOURNEY_INTELLIGENCE_SYSTEM_PATH,
  CJI_METADATA_VERSION,
  CJI_CAPABILITIES,
} from "../../customer-journey-intelligence-engine/index.js";
import { appendCjiLog, getCjiLogs } from "../../customer-journey-intelligence-engine/cji-logging.js";

async function buildJourneyStack() {
  const bootstrap = await runBootstrap({ repositoryRoot: REPO_ROOT, skipHeavyScans: true });
  const identity = createCustomerIdentityEngine(bootstrap);
  await identity.initialize();
  identity.connectCustomerIdentityEngine();
  const created = identity.createCustomerIdentity({
    customerName: "Journey Test User",
    customerIdentifiers: [
      { identifierType: "email", identifierValue: "journey@example.com", channel: null },
    ],
  });
  const customerId = created.customerRecords[0].customerId;
  const crm = createCrmFoundationEngine(bootstrap, identity);
  await crm.initialize();
  crm.connectCrmFoundation();
  crm.createCustomerProfile({
    customerId,
    customerOwner: "engagement-team",
    contactInformation: { email: "journey@example.com" },
  });
  const timeline = createCustomerTimelineEngine(bootstrap, identity, crm);
  await timeline.initialize();
  timeline.connectCustomerTimelineEngine();
  timeline.recordPurchase({
    customerId,
    eventReference: "purchase-1",
    eventDescription: "First purchase",
  });
  timeline.recordSupportActivity({
    customerId,
    eventReference: "support-1",
    eventDescription: "Support inquiry",
  });
  timeline.recordCommunication({
    customerId,
    eventReference: "comm-1",
    eventDescription: "Welcome email",
  });

  const segmentation = createCustomerSegmentationEngine(
    bootstrap,
    identity,
    crm,
    timeline,
    null as unknown as CustomerSentimentEngine,
    null as unknown as import("../../loyalty-programme-engine/engine.js").LoyaltyProgrammeEngine,
    null as unknown as import("../../customer-risk-engine/engine.js").CustomerRiskEngine,
    null as unknown as CustomerLifetimeValueEngine,
  );
  await segmentation.initialize();
  segmentation.connectSegmentationEngine();

  const journey = createCustomerJourneyIntelligenceEngine(
    bootstrap,
    identity,
    crm,
    timeline,
    null as unknown as CustomerSentimentEngine,
    null as unknown as CustomerLifetimeValueEngine,
    segmentation,
    { configuration: { conversionPurchaseThreshold: 1, minJourneyScore: 0 } },
  );
  await journey.initialize();
  return { journey, customerId };
}

describe("Customer Journey Intelligence Engine (R4-17 / PILLOW-CJI-001)", () => {
  beforeEach(() => {
    resetCustomerIdentityEngineForTesting();
    resetCrmFoundationForTesting();
    resetCustomerTimelineEngineForTesting();
    resetCustomerSegmentationEngineForTesting();
    resetCustomerJourneyIntelligenceEngineForTesting();
  });

  test("configuration defaults are valid", () => {
    const config = buildCustomerJourneyIntelligenceConfiguration(REPO_ROOT);
    assert.equal(config.enabled, true);
    assert.equal(config.maskSensitiveValues, true);
    assert.ok(config.journeyMappingRules.length >= 1);
    assert.ok(config.optimizationRules.length >= 1);
    assert.ok(config.predictionRules.length >= 1);
  });

  test("initializes with governance doc", async () => {
    const { journey } = await buildJourneyStack();
    const state = journey.getState();
    assert.equal(state.engineVersion, "PILLOW-CJI-001");
    assert.equal(state.missionId, "R4-17");
    assert.equal(state.status, "active");
    assert.ok(CUSTOMER_JOURNEY_INTELLIGENCE_SYSTEM_PATH.includes("JOURNEY"));
    assert.ok(CJI_CAPABILITIES.includes("journey_mapping"));
  });

  test("connect produces engine record with upstream links", async () => {
    const { journey } = await buildJourneyStack();
    const report = journey.connectJourneyIntelligenceEngine();
    assert.equal(report.action, "connect");
    assert.equal(report.metadataVersion, CJI_METADATA_VERSION);
    assert.equal(report.engineRecord!.identityEngineConnected, true);
    assert.equal(report.engineRecord!.crmFoundationConnected, true);
    assert.equal(report.engineRecord!.timelineEngineConnected, true);
  });

  test("maps customer journey with touchpoints and stage", async () => {
    const { journey, customerId } = await buildJourneyStack();
    journey.connectJourneyIntelligenceEngine();
    const report = journey.mapCustomerJourney({ customerId });
    assert.equal(report.action, "map_journey");
    assert.equal(report.journeyRecords.length, 1);
    assert.match(report.journeyRecords[0].journeyRecordId, /^cji-rec-/);
    assert.ok(report.journeyRecords[0].touchpointReferences.length >= 3);
    assert.ok(report.journeyRecords[0].journeyScore >= 0);
    assert.ok(report.journeyRecords[0].recommendedActions.length >= 1);
  });

  test("tracks touchpoints and identifies stages", async () => {
    const { journey, customerId } = await buildJourneyStack();
    journey.connectJourneyIntelligenceEngine();

    const touchpoints = journey.trackCustomerTouchpoints({ customerId });
    assert.equal(touchpoints.action, "track_touchpoints");
    assert.ok(touchpoints.journeyRecords[0].touchpointReferences.length >= 1);

    const stages = journey.identifyJourneyStages({ customerId });
    assert.equal(stages.action, "identify_stages");
    assert.ok(["awareness", "consideration", "purchase", "retention", "advocacy"].includes(
      stages.journeyRecords[0].journeyStage,
    ));
  });

  test("detects friction and drop-off indicators", async () => {
    const { journey, customerId } = await buildJourneyStack();
    journey.connectJourneyIntelligenceEngine();

    const friction = journey.detectFrictionPoints({ customerId });
    assert.equal(friction.action, "detect_friction");

    const dropOff = journey.detectDropOffPoints({ customerId });
    assert.equal(dropOff.action, "detect_dropoff");
  });

  test("measures performance, conversion, recommendations and predictions", async () => {
    const { journey, customerId } = await buildJourneyStack();
    journey.connectJourneyIntelligenceEngine();

    const performance = journey.measureJourneyPerformance({ customerId });
    assert.equal(performance.action, "measure_performance");
    assert.ok(performance.journeyRecords[0].journeyScore >= 0);

    const conversion = journey.measureConversionRates({ customerId });
    assert.equal(conversion.action, "measure_conversion");
    assert.equal(conversion.journeyRecords[0].conversionStatus, "converted");

    const recommendations = journey.recommendJourneyImprovements({ customerId });
    assert.equal(recommendations.action, "recommend_improvements");
    assert.ok(recommendations.insights.some((i) => i.insightType === "optimization"));

    const prediction = journey.predictCustomerProgression({ customerId });
    assert.equal(prediction.action, "predict_progression");
    assert.ok(prediction.insights.some((i) => i.insightType === "prediction"));
  });

  test("produces machine-readable journey records", async () => {
    const { journey, customerId } = await buildJourneyStack();
    journey.connectJourneyIntelligenceEngine();
    const report = journey.mapCustomerJourney({ customerId });
    const recordId = report.journeyRecords[0].journeyRecordId;
    const machine = journey.getMachineReadableRecord(recordId);
    assert.ok(machine);
    assert.equal(machine!.journeyRecordId, recordId);
    assert.equal(machine!.metadataVersion, CJI_METADATA_VERSION);
    assert.equal(machine!.customerId, customerId);
  });

  test("reports journey status and health", async () => {
    const { journey, customerId } = await buildJourneyStack();
    journey.connectJourneyIntelligenceEngine();
    journey.mapCustomerJourney({ customerId });

    const status = journey.reportJourneyStatus();
    assert.equal(status.action, "report_status");
    assert.ok(status.journeyRecords.length >= 1);

    const health = journey.reportJourneyHealth();
    assert.equal(health.action, "report_health");
    assert.equal(health.validation.decision, "pass");
  });

  test("redacts sensitive log values", () => {
    appendCjiLog({
      event: "journey_mapping",
      level: "info",
      details: "token=secret-api-key-value should be redacted",
    });
    const logs = getCjiLogs(5);
    assert.match(logs.at(-1)!.details, /redacted/i);
  });

  test("cockpit snapshot and supervisor sync", async () => {
    const { journey, customerId } = await buildJourneyStack();
    journey.connectJourneyIntelligenceEngine();
    journey.mapCustomerJourney({ customerId });

    const cockpit = journey.getCockpitSnapshot();
    assert.equal(cockpit.engineStatus, "active");
    assert.ok(cockpit.totalJourneyRecords >= 1);

    const sync = journey.validateForSupervisorSync();
    assert.equal(sync.valid, true);
    assert.ok(sync.readinessScore >= 70);
  });
});
