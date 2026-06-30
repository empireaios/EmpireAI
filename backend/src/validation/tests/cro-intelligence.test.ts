import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { describe, it } from "node:test";

import {
  createCroIntelligenceModule,
  createInMemoryCroIntelligenceRepository,
  CRO_AREA_TYPES,
  generateCroReport,
  validateCroReport,
} from "../../execution/cro-intelligence/index.js";

const WORKSPACE_ID = "ws-m083";

function buildCroInput(storeId = randomUUID()) {
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
      averageOrderValue: 49.99,
    },
    storeId,
    storeSlug: "kitchen-blender-supply-co",
  };
}

describe("Mission 083 CRO Intelligence Engine", () => {
  it("generates CRO report with safety flags", async () => {
    const module = createCroIntelligenceModule();
    const record = await module.persistReport(WORKSPACE_ID, buildCroInput());

    assert.ok(record.reportId);
    assert.match(record.reportName, /Kitchen Blender Supply Co\./);
    assert.equal(record.intelligenceOnly, true);
    assert.equal(record.deploymentEnabled, false);
    assert.equal(record.autoApplyEnabled, false);
    assert.ok(record.confidence >= 60);
    assert.ok(record.overallScore >= 60);
    assert.ok(record.signals.some((signal) => signal.signalType === "cro_composite"));
  });

  it("analyzes all eight CRO dimensions", () => {
    const report = generateCroReport(buildCroInput());

    assert.equal(report.analyses.length, 8);
    assert.deepEqual(
      report.analyses.map((analysis) => analysis.areaType),
      [...CRO_AREA_TYPES],
    );

    for (const analysis of report.analyses) {
      assert.ok(analysis.score >= 0 && analysis.score <= 100);
      assert.ok(analysis.benchmarkScore >= 0);
      assert.ok(["STRONG", "ADEQUATE", "NEEDS_IMPROVEMENT"].includes(analysis.status));
      assert.ok(analysis.findings.length >= 1);
      assert.ok(analysis.weaknesses.length >= 1);
    }
  });

  it("analyzes headlines and buttons with actionable findings", () => {
    const analyses = generateCroReport(buildCroInput()).analyses;

    const headlines = analyses.find((entry) => entry.areaType === "HEADLINES");
    const buttons = analyses.find((entry) => entry.areaType === "BUTTONS");

    assert.ok(headlines);
    assert.ok(buttons);
    assert.ok(headlines!.findings.some((finding) => finding.includes("headline")));
    assert.ok(buttons!.findings.some((finding) => finding.includes("CTA")));
  });

  it("analyzes pricing, trust, and testimonials", () => {
    const analyses = generateCroReport(buildCroInput()).analyses;

    const pricing = analyses.find((entry) => entry.areaType === "PRICING");
    const trust = analyses.find((entry) => entry.areaType === "TRUST");
    const testimonials = analyses.find((entry) => entry.areaType === "TESTIMONIALS");

    assert.ok(pricing);
    assert.ok(trust);
    assert.ok(testimonials);
    assert.ok(pricing!.findings.some((finding) => finding.includes("AOV")));
    assert.ok(trust!.strengths.length >= 1);
    assert.ok(testimonials!.weaknesses.some((weakness) => weakness.includes("testimonial")));
  });

  it("analyzes layout, offer, and urgency", () => {
    const analyses = generateCroReport(buildCroInput()).analyses;

    const layout = analyses.find((entry) => entry.areaType === "LAYOUT");
    const offer = analyses.find((entry) => entry.areaType === "OFFER");
    const urgency = analyses.find((entry) => entry.areaType === "URGENCY");

    assert.ok(layout);
    assert.ok(offer);
    assert.ok(urgency);
    assert.ok(offer!.findings.some((finding) => finding.includes("benefit")));
    assert.ok(urgency!.weaknesses.some((weakness) => weakness.includes("stock")));
  });

  it("returns priority improvements with expected lift and confidence", () => {
    const report = generateCroReport(buildCroInput());

    assert.ok(report.priorityImprovements.length >= 1);

    for (const improvement of report.priorityImprovements) {
      assert.ok(CRO_AREA_TYPES.includes(improvement.areaType));
      assert.ok(["HIGH", "MEDIUM", "LOW"].includes(improvement.priority));
      assert.ok(improvement.expectedLiftMin >= 0);
      assert.ok(improvement.expectedLiftMax >= improvement.expectedLiftMin);
      assert.match(improvement.expectedLiftLabel, /conversion lift/);
      assert.ok(improvement.confidence >= 0 && improvement.confidence <= 100);
      assert.ok(improvement.rationale.length > 0);
    }

    assert.ok(report.aggregateExpectedLiftMin >= 0);
    assert.ok(report.aggregateExpectedLiftMax >= report.aggregateExpectedLiftMin);
  });

  it("sorts priority improvements with HIGH first", () => {
    const improvements = generateCroReport(buildCroInput()).priorityImprovements;
    const highIndex = improvements.findIndex((entry) => entry.priority === "HIGH");

    if (highIndex >= 0 && improvements.length > 1) {
      assert.equal(improvements[0]!.priority, "HIGH");
    }
  });

  it("computes weighted confidence signals", () => {
    const report = generateCroReport(buildCroInput());

    assert.ok(report.signals.length >= 8);
    const composite = report.signals.find((signal) => signal.signalType === "cro_composite");
    assert.ok(composite);
    assert.equal(composite!.score, report.confidence);
  });

  it("validates CRO report schema", () => {
    const report = generateCroReport(buildCroInput());
    const validated = validateCroReport({ reportId: randomUUID(), ...report });

    assert.equal(validated.analyses.length, 8);
    assert.equal(validated.intelligenceOnly, true);
  });

  it("persists CRO intelligence records in the repository", async () => {
    const repository = createInMemoryCroIntelligenceRepository();
    const module = createCroIntelligenceModule(repository);
    const input = buildCroInput();

    const saved = await module.persistReport(WORKSPACE_ID, input);
    const loadedByStore = await module.getReportByStore(WORKSPACE_ID, input.storeId);
    const loadedById = await module.getReportRecord(WORKSPACE_ID, saved.recordId);

    assert.ok(loadedByStore);
    assert.ok(loadedById);
    assert.equal(loadedByStore!.overallScore, saved.overallScore);
    assert.equal(loadedById!.priorityImprovements.length, saved.priorityImprovements.length);

    const listed = await repository.list({
      workspaceId: WORKSPACE_ID,
      storeId: input.storeId,
    });
    assert.equal(listed.length, 1);
  });
});
