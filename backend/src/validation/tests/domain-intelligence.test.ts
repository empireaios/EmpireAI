import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { describe, it } from "node:test";

import {
  AVAILABILITY_STATUSES,
  createDomainIntelligenceModule,
  createInMemoryDomainIntelligenceRepository,
  domainIntelligenceScoring,
  scoreDomainIntelligence,
} from "../../execution/domain-intelligence/index.js";
import type { DomainIntelligenceInput } from "../../execution/domain-intelligence/index.js";

const WORKSPACE_ID = "ws-m064";

function buildDomainIntelligenceInput(
  overrides: {
    brandName?: string;
    niche?: string;
    brandConfidence?: number;
    storeId?: string;
    preferredTlds?: string[];
  } = {},
): DomainIntelligenceInput {
  const brandId = randomUUID();

  return {
    brand: {
      brandId,
      brandName: overrides.brandName ?? "Kitchen Blender Supply Co.",
      slogan: "Quality you can ship today",
      niche: overrides.niche ?? "Curated ecommerce essentials",
      targetAudience: "Online shoppers seeking fast, reliable product discovery",
      positioning: "Trusted direct-to-consumer category leader",
      confidence: overrides.brandConfidence ?? 80,
    },
    ...(overrides.storeId ? { storeId: overrides.storeId } : {}),
    ...(overrides.preferredTlds ? { preferredTlds: overrides.preferredTlds } : {}),
  };
}

describe("Mission 064 Domain Intelligence Engine", () => {
  it("generates a domain recommendation with required output fields", async () => {
    const module = createDomainIntelligenceModule();
    const input = buildDomainIntelligenceInput();
    const recommendation = await module.persistDomainRecommendation(WORKSPACE_ID, input);

    assert.ok(recommendation.recommendationId);
    assert.ok(recommendation.primaryDomain.includes("."));
    assert.ok(recommendation.alternativeDomains.length >= 1);
    assert.ok(recommendation.brandFitScore >= 0 && recommendation.brandFitScore <= 100);
    assert.ok(AVAILABILITY_STATUSES.includes(recommendation.availabilityStatus));
    assert.ok(recommendation.confidence >= 50);
    assert.ok(
      recommendation.signals.some((signal) => signal.signalType === "domain_composite"),
    );
  });

  it("derives the primary domain from brand name tokens", () => {
    const recommendation = scoreDomainIntelligence(
      buildDomainIntelligenceInput({ brandName: "Summit Trail Gear" }),
    );

    assert.match(recommendation.primaryDomain, /summittrailgear|summittrail|trailgear/i);
    assert.ok(recommendation.primaryDomain.endsWith(".com") || recommendation.primaryDomain.includes("."));
  });

  it("generates alternative domains with brand fit and availability estimates", () => {
    const recommendation = scoreDomainIntelligence(buildDomainIntelligenceInput());

    assert.ok(recommendation.alternativeDomains.length >= 3);
    for (const alternative of recommendation.alternativeDomains) {
      assert.ok(alternative.domain.includes("."));
      assert.ok(alternative.brandFitScore >= 0 && alternative.brandFitScore <= 100);
      assert.ok(AVAILABILITY_STATUSES.includes(alternative.availabilityStatus));
    }
    assert.notEqual(
      recommendation.alternativeDomains[0]!.domain,
      recommendation.primaryDomain,
    );
  });

  it("ranks closer brand-name matches with higher brand fit scores", () => {
    const exactMatch = scoreDomainIntelligence(
      buildDomainIntelligenceInput({ brandName: "BlenderVault" }),
    );
    const genericMatch = scoreDomainIntelligence(
      buildDomainIntelligenceInput({ brandName: "Shop" }),
    );

    assert.ok(exactMatch.brandFitScore > genericMatch.brandFitScore);
    assert.ok(exactMatch.confidence >= genericMatch.confidence);
  });

  it("uses heuristic availability estimates without registrar integration", () => {
    const longUnique = scoreDomainIntelligence(
      buildDomainIntelligenceInput({
        brandName: "Artisan Ceramic Kitchenware Collective",
      }),
    );

    assert.equal(domainIntelligenceScoring.estimateDomainAvailability("shop.com"), "LIKELY_TAKEN");
    assert.equal(
      domainIntelligenceScoring.estimateDomainAvailability(
        "artisanceramickitchenwarecollective.com",
      ),
      "LIKELY_AVAILABLE",
    );
    assert.equal(longUnique.availabilityStatus, "LIKELY_AVAILABLE");
    assert.ok(
      longUnique.signals.some(
        (signal) =>
          signal.signalType === "availability_estimate" &&
          signal.detail.includes("heuristic"),
      ),
    );
  });

  it("persists domain recommendations in the repository", async () => {
    const repository = createInMemoryDomainIntelligenceRepository();
    const module = createDomainIntelligenceModule(repository);
    const input = buildDomainIntelligenceInput({ storeId: randomUUID() });

    const saved = await module.persistDomainRecommendation(WORKSPACE_ID, input);
    const loadedByBrand = await module.getDomainRecommendationByBrand(
      WORKSPACE_ID,
      input.brand.brandId,
    );
    const loadedById = await module.getDomainRecommendation(
      WORKSPACE_ID,
      saved.recommendationId,
    );

    assert.ok(loadedByBrand);
    assert.ok(loadedById);
    assert.equal(loadedByBrand!.primaryDomain, saved.primaryDomain);
    assert.equal(loadedById!.alternativeDomains.length, saved.alternativeDomains.length);

    const listed = await repository.list({
      workspaceId: WORKSPACE_ID,
      storeId: input.storeId,
    });
    assert.equal(listed.length, 1);
  });
});
