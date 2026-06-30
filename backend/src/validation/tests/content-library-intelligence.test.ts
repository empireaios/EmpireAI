import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { describe, it } from "node:test";

import {
  createContentLibraryIntelligenceModule,
  createInMemoryContentLibraryRepository,
  generateContentLibrary,
} from "../../execution/content-library-intelligence/index.js";

const WORKSPACE_ID = "ws-m080";

function buildContentLibraryInput(storeId = randomUUID()) {
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
      headline: "Elevate your kitchen blender experience with Kitchen Blender Supply Co.",
      valueProposition:
        "Kitchen Blender delivers premium positioning for curated ecommerce essentials.",
      keyBenefits: [
        "Premium positioning buyers trust immediately",
        "Higher perceived quality and brand credibility",
        "Stronger conversion for high-intent shoppers",
      ],
      callToAction: "Shop the premium offer",
    },
    storeId,
    scheduleWeeks: 8,
  };
}

describe("Mission 080 Content Library Intelligence", () => {
  it("generates content library with safety flags and required outputs", async () => {
    const module = createContentLibraryIntelligenceModule();
    const record = await module.persistLibrary(WORKSPACE_ID, buildContentLibraryInput());

    assert.ok(record.libraryId);
    assert.match(record.libraryName, /Kitchen Blender Supply Co\./);
    assert.equal(record.intelligenceOnly, true);
    assert.equal(record.deploymentEnabled, false);
    assert.equal(record.autoPublishEnabled, false);
    assert.ok(record.confidence >= 70);
    assert.ok(record.signals.some((signal) => signal.signalType === "library_composite"));
  });

  it("generates blog strategy with pillars and goals", () => {
    const library = generateContentLibrary(buildContentLibraryInput());
    const strategy = library.blogStrategy;

    assert.ok(strategy.objective.length > 0);
    assert.ok(strategy.contentPillars.length >= 4);
    assert.ok(strategy.primaryGoals.length >= 3);
    assert.match(strategy.targetAudience, /Online shoppers/);
  });

  it("generates topical clusters mapped to pillar pages", () => {
    const library = generateContentLibrary(buildContentLibraryInput());

    assert.ok(library.topicalClusters.length >= 4);
    assert.equal(library.pillarPages.length, library.topicalClusters.length);
    assert.ok(
      library.pillarPages.every((page) =>
        library.topicalClusters.some((cluster) => cluster.clusterId === page.clusterId),
      ),
    );
  });

  it("generates supporting articles linked to pillar pages", () => {
    const library = generateContentLibrary(buildContentLibraryInput());

    assert.ok(library.supportingArticles.length >= library.pillarPages.length * 2);
    assert.ok(
      library.supportingArticles.every((article) =>
        library.pillarPages.some((pillar) => pillar.pageId === article.pillarPageId),
      ),
    );
  });

  it("generates FAQ expansion, buying guides, and comparison pages", () => {
    const library = generateContentLibrary(buildContentLibraryInput());

    assert.ok(library.faqExpansions.length >= 4);
    assert.ok(library.buyingGuides.length >= 2);
    assert.ok(library.comparisonPages.length >= 2);

    assert.ok(library.faqExpansions.every((faq) => faq.answerOutline.length >= 1));
    assert.ok(library.buyingGuides.every((guide) => guide.sections.length >= 3));
    assert.ok(library.comparisonPages.every((page) => page.comparedItems.length >= 2));
  });

  it("generates evergreen content with refresh cadence", () => {
    const library = generateContentLibrary(buildContentLibraryInput());

    assert.ok(library.evergreenContent.length >= 3);
    assert.ok(library.evergreenContent.every((entry) => entry.refreshCadenceMonths >= 4));
  });

  it("generates publishing schedule with planned status only", () => {
    const library = generateContentLibrary(buildContentLibraryInput());
    const schedule = library.publishingSchedule;

    assert.equal(schedule.totalWeeks, 8);
    assert.ok(schedule.entries.length >= 10);
    assert.ok(schedule.entries.every((entry) => entry.status === "PLANNED"));
    assert.ok(schedule.entries.every((entry) => entry.scheduledWeek >= 1));
  });

  it("returns confidence and SEO coverage metrics", () => {
    const library = generateContentLibrary(buildContentLibraryInput());

    assert.ok(library.confidence >= 70 && library.confidence <= 100);
    assert.ok(library.seoCoverage.overallCoverage >= 50);
    assert.equal(library.seoCoverage.totalClusters, library.topicalClusters.length);
    assert.equal(library.seoCoverage.pillarPagesMapped, library.pillarPages.length);
    assert.ok(library.seoCoverage.summary.length > 0);
  });

  it("persists content library records in the repository", async () => {
    const repository = createInMemoryContentLibraryRepository();
    const module = createContentLibraryIntelligenceModule(repository);
    const input = buildContentLibraryInput();

    const saved = await module.persistLibrary(WORKSPACE_ID, input);
    const loadedByStore = await module.getLibraryByStore(WORKSPACE_ID, input.storeId);
    const loadedById = await module.getLibraryRecord(WORKSPACE_ID, saved.recordId);

    assert.ok(loadedByStore);
    assert.ok(loadedById);
    assert.equal(loadedByStore!.confidence, saved.confidence);
    assert.equal(loadedById!.pillarPages.length, saved.pillarPages.length);

    const listed = await repository.list({
      workspaceId: WORKSPACE_ID,
      storeId: input.storeId,
    });
    assert.equal(listed.length, 1);
  });
});
