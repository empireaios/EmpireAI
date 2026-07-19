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
import {
  createEmailCommunicationEngine,
  resetEmailCommunicationEngineForTesting,
} from "../../email-communication-engine/index.js";
import {
  createSmsCommunicationEngine,
  resetSmsCommunicationEngineForTesting,
} from "../../sms-communication-engine/index.js";
import {
  createWhatsAppIntegration,
  resetWhatsAppIntegrationForTesting,
} from "../../whatsapp-integration/index.js";
import {
  createLiveChatIntegration,
  resetLiveChatIntegrationForTesting,
} from "../../live-chat-integration/index.js";
import {
  createAiCustomerSupport,
  resetAiCustomerSupportForTesting,
} from "../../ai-customer-support/index.js";
import {
  createTicketManagementEngine,
  resetTicketManagementEngineForTesting,
} from "../../ticket-management-engine/index.js";
import {
  createCustomerSentimentEngine,
  resetCustomerSentimentEngineForTesting,
} from "../../customer-sentiment-engine/index.js";
import {
  createReviewManagementEngine,
  resetReviewManagementEngineForTesting,
  buildReviewManagementEngineConfiguration,
  REVIEW_MANAGEMENT_ENGINE_SYSTEM_PATH,
  RME_METADATA_VERSION,
  RME_CAPABILITIES,
} from "../../review-management-engine/index.js";
import { appendRmeLog, getRmeLogs } from "../../review-management-engine/rme-logging.js";

async function buildReviewStack() {
  const bootstrap = await runBootstrap({ repositoryRoot: REPO_ROOT, skipHeavyScans: true });
  const identity = createCustomerIdentityEngine(bootstrap);
  await identity.initialize();
  identity.connectCustomerIdentityEngine();
  const created = identity.createCustomerIdentity({
    customerName: "Review Test User",
    customerIdentifiers: [
      { identifierType: "email", identifierValue: "reviews@example.com", channel: null },
    ],
  });
  const customerId = created.customerRecords[0].customerId;
  const crm = createCrmFoundationEngine(bootstrap, identity);
  await crm.initialize();
  crm.connectCrmFoundation();
  crm.createCustomerProfile({
    customerId,
    customerOwner: "support-team",
    contactInformation: { email: "reviews@example.com" },
  });
  const timeline = createCustomerTimelineEngine(bootstrap, identity, crm);
  await timeline.initialize();
  timeline.connectCustomerTimelineEngine();
  timeline.recordSupportActivity({
    customerId,
    eventReference: "seed-review",
    eventDescription: "Prior support activity",
  });
  const email = createEmailCommunicationEngine(bootstrap, crm, timeline);
  await email.initialize();
  email.connectEmailCommunicationEngine();
  const sms = createSmsCommunicationEngine(bootstrap, crm, timeline);
  await sms.initialize();
  sms.connectSmsCommunicationEngine();
  const whatsapp = createWhatsAppIntegration(bootstrap, crm, timeline);
  await whatsapp.initialize();
  whatsapp.connectWhatsAppIntegration();
  const liveChat = createLiveChatIntegration(bootstrap, timeline);
  await liveChat.initialize();
  liveChat.connectLiveChatIntegration();
  const aiSupport = createAiCustomerSupport(
    bootstrap,
    identity,
    crm,
    timeline,
    email,
    sms,
    whatsapp,
    liveChat,
  );
  await aiSupport.initialize();
  aiSupport.connectAiCustomerSupport();
  const tickets = createTicketManagementEngine(
    bootstrap,
    identity,
    crm,
    timeline,
    liveChat,
    aiSupport,
  );
  await tickets.initialize();
  tickets.connectTicketManagementEngine();
  const sentiment = createCustomerSentimentEngine(
    bootstrap,
    timeline,
    email,
    sms,
    whatsapp,
    liveChat,
    aiSupport,
    tickets,
  );
  await sentiment.initialize();
  sentiment.connectCustomerSentimentEngine();
  const reviews = createReviewManagementEngine(
    bootstrap,
    identity,
    timeline,
    sentiment,
    aiSupport,
  );
  await reviews.initialize();
  return { bootstrap, reviews, customerId };
}

describe("Review Management Engine (R4-11 / PILLOW-RME-001)", () => {
  beforeEach(() => {
    resetCustomerIdentityEngineForTesting();
    resetCrmFoundationForTesting();
    resetCustomerTimelineEngineForTesting();
    resetEmailCommunicationEngineForTesting();
    resetSmsCommunicationEngineForTesting();
    resetWhatsAppIntegrationForTesting();
    resetLiveChatIntegrationForTesting();
    resetAiCustomerSupportForTesting();
    resetTicketManagementEngineForTesting();
    resetCustomerSentimentEngineForTesting();
    resetReviewManagementEngineForTesting();
  });

  test("configuration defaults are valid", () => {
    const config = buildReviewManagementEngineConfiguration(REPO_ROOT);
    assert.equal(config.enabled, true);
    assert.equal(config.maskSensitiveValues, true);
    assert.ok(config.collectionRules.length >= 1);
    assert.ok(config.marketplaceImportRules.length >= 2);
    assert.ok(config.reputationAlertRules.length >= 2);
  });

  test("initializes with governance doc", async () => {
    const { reviews } = await buildReviewStack();
    const state = reviews.getState();
    assert.equal(state.engineVersion, "PILLOW-RME-001");
    assert.equal(state.missionId, "R4-11");
    assert.equal(state.status, "active");
    assert.ok(REVIEW_MANAGEMENT_ENGINE_SYSTEM_PATH.includes("REVIEW_MANAGEMENT"));
    assert.ok(RME_CAPABILITIES.includes("review_collection"));
  });

  test("connect produces engine record with upstream links", async () => {
    const { reviews } = await buildReviewStack();
    const report = reviews.connectReviewManagementEngine();
    assert.equal(report.action, "connect");
    assert.equal(report.metadataVersion, RME_METADATA_VERSION);
    assert.equal(report.engineRecord!.identityEngineConnected, true);
    assert.equal(report.engineRecord!.timelineEngineConnected, true);
    assert.equal(report.engineRecord!.sentimentEngineConnected, true);
    assert.equal(report.engineRecord!.aiCustomerSupportConnected, true);
  });

  test("collects customer reviews with sentiment classification", async () => {
    const { reviews, customerId } = await buildReviewStack();
    reviews.connectReviewManagementEngine();

    const positive = reviews.collectCustomerReview({
      customerId,
      marketplaceReference: "direct",
      productReference: "SKU-100",
      reviewRating: 5,
      reviewComment: "Excellent product, highly recommend!",
    });
    assert.equal(positive.action, "collect_review");
    assert.equal(positive.reviewRecords[0].reviewSentiment, "positive");
    assert.match(positive.reviewRecords[0].reviewRecordId, /^rme-rec-/);

    const negative = reviews.collectCustomerReview({
      customerId,
      marketplaceReference: "direct",
      productReference: "SKU-200",
      reviewRating: 1,
      reviewComment: "Terrible quality, very disappointed",
    });
    assert.equal(negative.reviewRecords[0].reviewSentiment, "negative");
  });

  test("imports marketplace reviews", async () => {
    const { reviews, customerId } = await buildReviewStack();
    reviews.connectReviewManagementEngine();

    const report = reviews.importMarketplaceReview({
      customerId,
      marketplaceReference: "amazon",
      productReference: "ASIN-123",
      orderReference: "ORD-456",
      externalReviewId: "amz-rev-789",
      reviewRating: 4,
      reviewComment: "Good product, fast shipping",
    });
    assert.equal(report.action, "import_marketplace_review");
    assert.equal(report.reviewRecords[0].reviewStatus, "classified");
    assert.equal(report.reviewRecords[0].marketplaceReference, "amazon");
  });

  test("detects negative and positive reviews", async () => {
    const { reviews, customerId } = await buildReviewStack();
    reviews.connectReviewManagementEngine();
    reviews.collectCustomerReview({
      customerId,
      marketplaceReference: "shopify",
      productReference: "SKU-A",
      reviewRating: 5,
      reviewComment: "Love it",
    });
    reviews.collectCustomerReview({
      customerId,
      marketplaceReference: "shopify",
      productReference: "SKU-B",
      reviewRating: 1,
      reviewComment: "Awful",
    });

    const negatives = reviews.detectNegativeReviews({ customerId });
    assert.equal(negatives.action, "detect_negative");
    assert.ok(negatives.reviewRecords.length >= 1);

    const positives = reviews.detectPositiveReviews({ customerId });
    assert.equal(positives.action, "detect_positive");
    assert.ok(positives.reviewRecords.length >= 1);
  });

  test("tracks review trends and generates reputation alerts", async () => {
    const { reviews, customerId } = await buildReviewStack();
    reviews.connectReviewManagementEngine();
    reviews.collectCustomerReview({
      customerId,
      marketplaceReference: "amazon",
      productReference: "ASIN-TREND",
      reviewRating: 3,
      reviewComment: "Average",
    });
    reviews.collectCustomerReview({
      customerId,
      marketplaceReference: "amazon",
      productReference: "ASIN-TREND",
      reviewRating: 5,
      reviewComment: "Excellent product, love it, highly recommend",
    });

    const trends = reviews.trackReviewTrends({
      marketplaceReference: "amazon",
      productReference: "ASIN-TREND",
    });
    assert.equal(trends.action, "track_trends");
    assert.ok(trends.trends.length >= 1);

    const alerts = reviews.generateReputationAlerts();
    assert.equal(alerts.action, "generate_alerts");
    assert.ok(alerts.alerts.length >= 1);
  });

  test("produces machine-readable review records", async () => {
    const { reviews, customerId } = await buildReviewStack();
    reviews.connectReviewManagementEngine();
    const report = reviews.collectCustomerReview({
      customerId,
      marketplaceReference: "direct",
      productReference: "SKU-MR",
      reviewRating: 4,
      reviewComment: "Solid purchase",
    });
    const recordId = report.reviewRecords[0].reviewRecordId;
    const machine = reviews.getMachineReadableRecord(recordId);
    assert.ok(machine);
    assert.equal(machine!.reviewRecordId, recordId);
    assert.equal(machine!.metadataVersion, RME_METADATA_VERSION);
  });

  test("reports review status and health", async () => {
    const { reviews, customerId } = await buildReviewStack();
    reviews.connectReviewManagementEngine();
    reviews.collectCustomerReview({
      customerId,
      marketplaceReference: "direct",
      productReference: "SKU-H",
      reviewRating: 4,
    });

    const status = reviews.reportReviewStatus();
    assert.equal(status.action, "report_status");
    assert.ok(status.reviewRecords.length >= 1);

    const health = reviews.reportReviewHealth();
    assert.equal(health.action, "report_health");
    assert.equal(health.validation.decision, "pass");
  });

  test("redacts sensitive values in logs", () => {
    appendRmeLog({
      event: "review_collection",
      level: "info",
      details: "token=secret-api-key-value should be redacted",
    });
    const logs = getRmeLogs(5);
    assert.match(logs.at(-1)!.details, /redacted/i);
  });

  test("cockpit snapshot and supervisor sync", async () => {
    const { reviews, customerId } = await buildReviewStack();
    reviews.connectReviewManagementEngine();
    reviews.collectCustomerReview({
      customerId,
      marketplaceReference: "direct",
      productReference: "SKU-C",
      reviewRating: 5,
      reviewComment: "Perfect",
    });

    const cockpit = reviews.getCockpitSnapshot();
    assert.equal(cockpit.engineStatus, "active");
    assert.ok(cockpit.totalReviewRecords >= 1);

    const sync = reviews.validateForSupervisorSync();
    assert.equal(sync.valid, true);
    assert.ok(sync.readinessScore >= 70);
  });
});
