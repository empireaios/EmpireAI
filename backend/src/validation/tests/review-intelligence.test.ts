import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { describe, it } from "node:test";

import {
  createInMemoryReviewIntelligenceRepository,
  createReviewIntelligenceModule,
  generateReviewIntelligenceReport,
  IMPROVEMENT_TARGET_AREAS,
  SENTIMENT_LABELS,
  validateReviewIntelligenceReport,
} from "../../execution/review-intelligence/index.js";

const WORKSPACE_ID = "ws-m088";

function buildReviewInput(storeId = randomUUID()) {
  return {
    brand: {
      brandId: randomUUID(),
      brandName: "Kitchen Blender Supply Co.",
      slogan: "Quality you can ship today",
      niche: "Curated ecommerce essentials",
      targetAudience: "Online shoppers seeking fast, reliable product discovery",
      positioning: "Trusted direct-to-consumer category leader",
      confidence: 82,
    },
    offer: {
      offerTitle: "Premium Kitchen Blender Offer",
      headline: "Elevate your kitchen blender experience",
      valueProposition: "Premium positioning for curated ecommerce essentials.",
      keyBenefits: [
        "Premium positioning buyers trust immediately",
        "Higher perceived quality and brand credibility",
        "Stronger conversion for high-intent shoppers",
      ],
      callToAction: "Shop the premium offer",
    },
    storeId,
    reviewCount: 248,
    averageRating: 4.3,
    competitors: ["BlendMaster Direct", "KitchenPro Store", "ApplianceHub"],
  };
}

describe("Mission 088 Review Intelligence Engine", () => {
  it("generates review intelligence report with safety flags", async () => {
    const module = createReviewIntelligenceModule();
    const record = await module.persistReport(WORKSPACE_ID, buildReviewInput());

    assert.ok(record.reportId);
    assert.match(record.reportName, /Kitchen Blender Supply Co\./);
    assert.equal(record.intelligenceOnly, true);
    assert.equal(record.deploymentEnabled, false);
    assert.equal(record.autoApplyEnabled, false);
    assert.ok(record.confidence >= 60);
    assert.ok(record.overallScore >= 60);
    assert.ok(record.signals.some((signal) => signal.signalType === "review_composite"));
  });

  it("extracts sentiment analysis", () => {
    const sentiment = generateReviewIntelligenceReport(buildReviewInput()).sentiment;

    assert.ok(sentiment.overallScore >= 0 && sentiment.overallScore <= 100);
    assert.ok(SENTIMENT_LABELS.includes(sentiment.dominantSentiment));
    assert.ok(sentiment.positivePercent >= 0);
    assert.ok(sentiment.reviewCount >= 1);
    assert.ok(sentiment.averageRating >= 0 && sentiment.averageRating <= 5);
    assert.equal(
      sentiment.positivePercent + sentiment.negativePercent + sentiment.neutralPercent,
      100,
    );
  });

  it("extracts pain points with severity", () => {
    const painPoints = generateReviewIntelligenceReport(buildReviewInput()).painPoints;

    assert.ok(painPoints.length >= 3);
    for (const point of painPoints) {
      assert.ok(point.theme.length > 0);
      assert.ok(point.mentionCount >= 1);
      assert.ok(["HIGH", "MEDIUM", "LOW"].includes(point.severity));
      assert.ok(point.score >= 0 && point.score <= 100);
    }
    assert.ok(painPoints.some((point) => point.severity === "HIGH"));
  });

  it("extracts positive themes", () => {
    const themes = generateReviewIntelligenceReport(buildReviewInput()).positiveThemes;

    assert.ok(themes.length >= 3);
    for (const theme of themes) {
      assert.ok(theme.theme.length > 0);
      assert.ok(theme.description.length > 0);
      assert.ok(theme.mentionCount >= 1);
    }
    assert.ok(themes.some((theme) => theme.theme.includes("quality") || theme.description.includes("quality")));
  });

  it("extracts feature requests", () => {
    const requests = generateReviewIntelligenceReport(buildReviewInput()).featureRequests;

    assert.ok(requests.length >= 3);
    for (const request of requests) {
      assert.ok(request.feature.length > 0);
      assert.ok(request.demandScore >= 0 && request.demandScore <= 100);
      assert.ok(request.mentionCount >= 1);
    }
  });

  it("extracts competitor weaknesses", () => {
    const weaknesses = generateReviewIntelligenceReport(buildReviewInput()).competitorWeaknesses;

    assert.ok(weaknesses.length >= 3);
    for (const weakness of weaknesses) {
      assert.ok(weakness.competitorName.length > 0);
      assert.ok(weakness.weakness.length > 0);
      assert.ok(weakness.exploitOpportunity.length > 0);
      assert.ok(weakness.score >= 0 && weakness.score <= 100);
    }
  });

  it("generates product improvement recommendations", () => {
    const improvements = generateReviewIntelligenceReport(buildReviewInput()).productImprovements;

    assert.ok(improvements.length >= 4);
    for (const improvement of improvements) {
      assert.ok(["HIGH", "MEDIUM", "LOW"].includes(improvement.priority));
      assert.ok(IMPROVEMENT_TARGET_AREAS.includes(improvement.targetArea));
      assert.ok(improvement.rationale.length > 0);
      assert.ok(improvement.expectedImpact.length > 0);
      assert.ok(improvement.score >= 0 && improvement.score <= 100);
    }
    assert.equal(improvements[0]!.priority, "HIGH");
  });

  it("computes weighted confidence signals", () => {
    const report = generateReviewIntelligenceReport(buildReviewInput());

    assert.ok(report.signals.length >= 6);
    const composite = report.signals.find((signal) => signal.signalType === "review_composite");
    assert.ok(composite);
    assert.equal(composite!.score, report.confidence);
  });

  it("validates review intelligence report schema", () => {
    const report = generateReviewIntelligenceReport(buildReviewInput());
    const validated = validateReviewIntelligenceReport({ reportId: randomUUID(), ...report });

    assert.ok(validated.painPoints.length >= 1);
    assert.equal(validated.intelligenceOnly, true);
    assert.equal(validated.autoApplyEnabled, false);
  });

  it("persists review intelligence records in the repository", async () => {
    const repository = createInMemoryReviewIntelligenceRepository();
    const module = createReviewIntelligenceModule(repository);
    const input = buildReviewInput();

    const saved = await module.persistReport(WORKSPACE_ID, input);
    const loadedByStore = await module.getReportByStore(WORKSPACE_ID, input.storeId);
    const loadedById = await module.getReportRecord(WORKSPACE_ID, saved.recordId);

    assert.ok(loadedByStore);
    assert.ok(loadedById);
    assert.equal(loadedByStore!.sentiment.reviewCount, saved.sentiment.reviewCount);
    assert.equal(loadedById!.productImprovements.length, saved.productImprovements.length);

    const listed = await repository.list({
      workspaceId: WORKSPACE_ID,
      storeId: input.storeId,
    });
    assert.equal(listed.length, 1);
  });
});
