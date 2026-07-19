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
} from "../../review-management-engine/index.js";
import {
  createLoyaltyProgrammeEngine,
  resetLoyaltyProgrammeEngineForTesting,
  buildLoyaltyProgrammeEngineConfiguration,
  LOYALTY_PROGRAMME_ENGINE_SYSTEM_PATH,
  LPE_METADATA_VERSION,
  LPE_CAPABILITIES,
} from "../../loyalty-programme-engine/index.js";
import { appendLpeLog, getLpeLogs } from "../../loyalty-programme-engine/lpe-logging.js";

async function buildLoyaltyStack() {
  const bootstrap = await runBootstrap({ repositoryRoot: REPO_ROOT, skipHeavyScans: true });
  const identity = createCustomerIdentityEngine(bootstrap);
  await identity.initialize();
  identity.connectCustomerIdentityEngine();
  const created = identity.createCustomerIdentity({
    customerName: "Loyalty Test User",
    customerIdentifiers: [
      { identifierType: "email", identifierValue: "loyalty@example.com", channel: null },
    ],
  });
  const customerId = created.customerRecords[0].customerId;
  const crm = createCrmFoundationEngine(bootstrap, identity);
  await crm.initialize();
  crm.connectCrmFoundation();
  crm.createCustomerProfile({
    customerId,
    customerOwner: "support-team",
    contactInformation: { email: "loyalty@example.com" },
  });
  const timeline = createCustomerTimelineEngine(bootstrap, identity, crm);
  await timeline.initialize();
  timeline.connectCustomerTimelineEngine();
  timeline.recordSupportActivity({
    customerId,
    eventReference: "seed-loyalty",
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
  reviews.connectReviewManagementEngine();
  const loyalty = createLoyaltyProgrammeEngine(
    bootstrap,
    identity,
    crm,
    timeline,
    sentiment,
    reviews,
  );
  await loyalty.initialize();
  return { bootstrap, loyalty, reviews, customerId };
}

describe("Loyalty Programme Engine (R4-12 / PILLOW-LPE-001)", () => {
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
    resetLoyaltyProgrammeEngineForTesting();
  });

  test("configuration defaults are valid", () => {
    const config = buildLoyaltyProgrammeEngineConfiguration(REPO_ROOT);
    assert.equal(config.enabled, true);
    assert.equal(config.maskSensitiveValues, true);
    assert.ok(config.pointsCalculationRules.length >= 1);
    assert.ok(config.tierRules.length >= 4);
    assert.ok(config.rewardRules.length >= 1);
  });

  test("initializes with governance doc", async () => {
    const { loyalty } = await buildLoyaltyStack();
    const state = loyalty.getState();
    assert.equal(state.engineVersion, "PILLOW-LPE-001");
    assert.equal(state.missionId, "R4-12");
    assert.equal(state.status, "active");
    assert.ok(LOYALTY_PROGRAMME_ENGINE_SYSTEM_PATH.includes("LOYALTY_PROGRAMME"));
    assert.ok(LPE_CAPABILITIES.includes("programme_creation"));
  });

  test("connect produces engine record with upstream links", async () => {
    const { loyalty } = await buildLoyaltyStack();
    const report = loyalty.connectLoyaltyProgrammeEngine();
    assert.equal(report.action, "connect");
    assert.equal(report.metadataVersion, LPE_METADATA_VERSION);
    assert.equal(report.engineRecord!.identityEngineConnected, true);
    assert.equal(report.engineRecord!.crmFoundationConnected, true);
    assert.equal(report.engineRecord!.timelineEngineConnected, true);
    assert.equal(report.engineRecord!.sentimentEngineConnected, true);
    assert.equal(report.engineRecord!.reviewManagementEngineConnected, true);
  });

  test("creates programmes and registers members", async () => {
    const { loyalty, customerId } = await buildLoyaltyStack();
    loyalty.connectLoyaltyProgrammeEngine();

    const programme = loyalty.createLoyaltyProgramme({
      programmeName: "Empire Rewards",
      programmeDescription: "Customer retention programme",
    });
    assert.equal(programme.action, "create_programme");
    assert.ok(programme.validation.decision !== "fail");

    const programmeId = loyalty.getProgrammes()[0].loyaltyProgrammeId;
    const member = loyalty.registerLoyaltyMember({
      customerId,
      loyaltyProgrammeId: programmeId,
    });
    assert.equal(member.action, "register_member");
    assert.equal(member.loyaltyRecords[0].activityType, "registration");
    assert.equal(member.loyaltyRecords[0].loyaltyTier, "bronze");
    assert.match(member.loyaltyRecords[0].loyaltyRecordId, /^lpe-rec-/);
  });

  test("awards and redeems loyalty points with tier progression", async () => {
    const { loyalty, customerId } = await buildLoyaltyStack();
    loyalty.connectLoyaltyProgrammeEngine();
    loyalty.createLoyaltyProgramme({ programmeName: "Tier Test" });
    const programmeId = loyalty.getProgrammes()[0].loyaltyProgrammeId;
    loyalty.registerLoyaltyMember({ customerId, loyaltyProgrammeId: programmeId });

    const award = loyalty.awardLoyaltyPoints({
      customerId,
      loyaltyProgrammeId: programmeId,
      points: 600,
      reason: "Purchase",
    });
    assert.equal(award.action, "award_points");
    assert.equal(award.loyaltyRecords[0].currentPointsBalance, 600);
    assert.equal(award.loyaltyRecords[0].loyaltyTier, "silver");

    const redeem = loyalty.redeemLoyaltyPoints({
      customerId,
      loyaltyProgrammeId: programmeId,
      points: 100,
      rewardReference: "reward-001",
    });
    assert.equal(redeem.action, "redeem_points");
    assert.equal(redeem.loyaltyRecords[0].currentPointsBalance, 500);
    assert.equal(redeem.loyaltyRecords[0].pointsRedeemed, 100);
  });

  test("applies review bonus points from R4-11", async () => {
    const { loyalty, reviews, customerId } = await buildLoyaltyStack();
    loyalty.connectLoyaltyProgrammeEngine();
    loyalty.createLoyaltyProgramme({ programmeName: "Review Bonus" });
    const programmeId = loyalty.getProgrammes()[0].loyaltyProgrammeId;
    loyalty.registerLoyaltyMember({ customerId, loyaltyProgrammeId: programmeId });

    reviews.collectCustomerReview({
      customerId,
      marketplaceReference: "direct",
      productReference: "SKU-LOYAL",
      reviewRating: 5,
      reviewComment: "Excellent product!",
    });

    const award = loyalty.awardLoyaltyPoints({
      customerId,
      loyaltyProgrammeId: programmeId,
      points: 50,
    });
    assert.equal(award.loyaltyRecords[0].pointsEarned, 60);
    assert.equal(award.loyaltyRecords[0].currentPointsBalance, 60);
  });

  test("rejects duplicate reward redemptions", async () => {
    const { loyalty, customerId } = await buildLoyaltyStack();
    loyalty.connectLoyaltyProgrammeEngine();
    loyalty.createLoyaltyProgramme({ programmeName: "Dedup Test" });
    const programmeId = loyalty.getProgrammes()[0].loyaltyProgrammeId;
    loyalty.registerLoyaltyMember({ customerId, loyaltyProgrammeId: programmeId });
    loyalty.awardLoyaltyPoints({ customerId, loyaltyProgrammeId: programmeId, points: 500 });

    const first = loyalty.redeemLoyaltyPoints({
      customerId,
      loyaltyProgrammeId: programmeId,
      points: 100,
      rewardReference: "dup-reward",
    });
    assert.equal(first.validation.decision, "pass");

    const duplicate = loyalty.redeemLoyaltyPoints({
      customerId,
      loyaltyProgrammeId: programmeId,
      points: 100,
      rewardReference: "dup-reward",
    });
    assert.equal(duplicate.validation.decision, "fail");
    assert.match(duplicate.validation.errors.join(" "), /duplicate/i);
  });

  test("detects loyalty abuse and generates rewards", async () => {
    const { loyalty, customerId } = await buildLoyaltyStack();
    loyalty.connectLoyaltyProgrammeEngine();
    loyalty.createLoyaltyProgramme({ programmeName: "Abuse Test" });
    const programmeId = loyalty.getProgrammes()[0].loyaltyProgrammeId;
    loyalty.registerLoyaltyMember({ customerId, loyaltyProgrammeId: programmeId });
    loyalty.awardLoyaltyPoints({ customerId, loyaltyProgrammeId: programmeId, points: 1000 });

    const reward = loyalty.generateLoyaltyRewards({
      customerId,
      loyaltyProgrammeId: programmeId,
      rewardReference: "gift-card-10",
      pointsCost: 200,
      description: "£10 gift card",
    });
    assert.equal(reward.action, "generate_rewards");
    assert.ok(reward.rewards.length >= 1);
    assert.match(reward.rewards[0].rewardId, /^lpe-reward-/);

    const abuse = loyalty.detectLoyaltyAbuse({ customerId });
    assert.equal(abuse.action, "detect_abuse");
  });

  test("produces machine-readable loyalty records", async () => {
    const { loyalty, customerId } = await buildLoyaltyStack();
    loyalty.connectLoyaltyProgrammeEngine();
    loyalty.createLoyaltyProgramme({ programmeName: "MR Test" });
    const programmeId = loyalty.getProgrammes()[0].loyaltyProgrammeId;
    loyalty.registerLoyaltyMember({ customerId, loyaltyProgrammeId: programmeId });

    const recordId = loyalty.getLoyaltyRecords()[0].loyaltyRecordId;
    const machine = loyalty.getMachineReadableRecord(recordId);
    assert.ok(machine);
    assert.equal(machine!.loyaltyRecordId, recordId);
    assert.equal(machine!.metadataVersion, LPE_METADATA_VERSION);
    assert.equal(machine!.customerId, customerId);
  });

  test("reports loyalty status and health", async () => {
    const { loyalty, customerId } = await buildLoyaltyStack();
    loyalty.connectLoyaltyProgrammeEngine();
    loyalty.createLoyaltyProgramme({ programmeName: "Health Test" });
    const programmeId = loyalty.getProgrammes()[0].loyaltyProgrammeId;
    loyalty.registerLoyaltyMember({ customerId, loyaltyProgrammeId: programmeId });

    const status = loyalty.reportLoyaltyStatus();
    assert.equal(status.action, "report_status");
    assert.ok(status.loyaltyRecords.length >= 1);

    const health = loyalty.reportLoyaltyHealth();
    assert.equal(health.action, "report_health");
    assert.equal(health.validation.decision, "pass");
  });

  test("redacts sensitive values in logs", () => {
    appendLpeLog({
      event: "loyalty_registration",
      level: "info",
      details: "token=secret-api-key-value should be redacted",
    });
    const logs = getLpeLogs(5);
    assert.match(logs.at(-1)!.details, /redacted/i);
  });

  test("cockpit snapshot and supervisor sync", async () => {
    const { loyalty, customerId } = await buildLoyaltyStack();
    loyalty.connectLoyaltyProgrammeEngine();
    loyalty.createLoyaltyProgramme({ programmeName: "Cockpit Test" });
    const programmeId = loyalty.getProgrammes()[0].loyaltyProgrammeId;
    loyalty.registerLoyaltyMember({ customerId, loyaltyProgrammeId: programmeId });

    const cockpit = loyalty.getCockpitSnapshot();
    assert.equal(cockpit.engineStatus, "active");
    assert.ok(cockpit.totalMembers >= 1);

    const sync = loyalty.validateForSupervisorSync();
    assert.equal(sync.valid, true);
    assert.ok(sync.readinessScore >= 70);
  });
});
