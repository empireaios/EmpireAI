import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { describe, it } from "node:test";

import {
  createInMemorySeoIntelligenceRepository,
  createSeoIntelligenceModule,
  generateSeoIntelligence,
  SEARCH_INTENTS,
} from "../../execution/seo-intelligence/index.js";

const WORKSPACE_ID = "ws-m079";

function buildSeoInput(storeId = randomUUID()) {
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
    baseUrl: "https://kitchen-blender-supply-co.empireai.store",
  };
}

describe("Mission 079 SEO Intelligence Engine", () => {
  it("generates SEO profile with safety flags and required outputs", async () => {
    const module = createSeoIntelligenceModule();
    const record = await module.persistProfile(WORKSPACE_ID, buildSeoInput());

    assert.ok(record.profileId);
    assert.match(record.profileName, /Kitchen Blender Supply Co\./);
    assert.equal(record.intelligenceOnly, true);
    assert.equal(record.deploymentEnabled, false);
    assert.ok(record.seoConfidence >= 70);
    assert.ok(record.signals.some((signal) => signal.signalType === "profile_composite"));
  });

  it("generates keyword clusters with search intent", () => {
    const profile = generateSeoIntelligence(buildSeoInput());

    assert.ok(profile.keywordClusters.length >= 4);
    assert.ok(profile.keywordClusters.every((cluster) => cluster.keywords.length >= 1));
    assert.ok(
      profile.keywordClusters.every((cluster) =>
        SEARCH_INTENTS.includes(cluster.searchIntent),
      ),
    );
    assert.ok(profile.searchIntentMappings.length >= profile.keywordClusters.length);
  });

  it("generates title tags and meta descriptions for all store pages", () => {
    const profile = generateSeoIntelligence(buildSeoInput());

    assert.ok(profile.titleTags.length >= 6);
    assert.ok(profile.metaDescriptions.length >= 6);
    assert.ok(profile.titleTags.every((entry) => entry.titleTag.length <= 70));
    assert.ok(profile.metaDescriptions.every((entry) => entry.metaDescription.length <= 170));
    assert.ok(profile.titleTags.some((entry) => entry.pagePath === "/"));
  });

  it("generates canonical URLs, Open Graph, and Twitter cards", () => {
    const profile = generateSeoIntelligence(buildSeoInput());
    const baseUrl = profile.baseUrl;

    assert.equal(profile.canonicalUrls.length, profile.titleTags.length);
    assert.ok(profile.canonicalUrls.every((entry) => entry.canonicalUrl.startsWith(baseUrl)));
    assert.equal(profile.openGraph.length, profile.titleTags.length);
    assert.ok(profile.openGraph.every((entry) => entry.ogUrl.startsWith(baseUrl)));
    assert.equal(profile.twitterCards.length, profile.openGraph.length);
    assert.ok(profile.twitterCards.every((entry) => entry.image.startsWith(baseUrl)));
  });

  it("generates JSON-LD structured data blocks", () => {
    const profile = generateSeoIntelligence(buildSeoInput());

    assert.ok(profile.structuredData.length >= 3);
    const schemaTypes = profile.structuredData.map((block) => block.schemaType);
    assert.ok(schemaTypes.includes("WebSite"));
    assert.ok(schemaTypes.includes("Organization"));
    assert.ok(schemaTypes.includes("Product"));
    assert.ok(schemaTypes.includes("BreadcrumbList"));

    for (const block of profile.structuredData) {
      assert.equal(block.jsonLd["@context"], "https://schema.org");
    }
  });

  it("generates internal linking, sitemap, and robots models", () => {
    const profile = generateSeoIntelligence(buildSeoInput());

    assert.ok(profile.internalLinking.length >= 4);
    assert.ok(profile.sitemap.entries.length >= 6);
    assert.equal(profile.sitemap.indexUrl, `${profile.baseUrl}/sitemap.xml`);
    assert.equal(profile.robots.sitemapUrl, profile.sitemap.indexUrl);
    assert.ok(profile.robots.rules.length >= 1);
    assert.ok(profile.robots.rules[0]!.disallow.includes("/checkout"));
  });

  it("generates content recommendations and topical authority map", () => {
    const profile = generateSeoIntelligence(buildSeoInput());

    assert.ok(profile.contentRecommendations.length >= 3);
    assert.ok(profile.topicalAuthorityMap.nodes.length >= 3);
    assert.equal(profile.topicalAuthorityMap.primaryTopic, "Curated ecommerce essentials");
    assert.ok(profile.topicalAuthorityMap.nodes.every((node) => node.authorityScore >= 70));
  });

  it("returns SEO confidence and actionable recommendations", () => {
    const profile = generateSeoIntelligence(buildSeoInput());

    assert.ok(profile.seoConfidence >= 70 && profile.seoConfidence <= 100);
    assert.ok(profile.seoRecommendations.length >= 4);
    assert.ok(profile.seoRecommendations.some((entry) => entry.priority === "HIGH"));
    assert.ok(profile.seoRecommendations.every((entry) => entry.action.length > 0));
  });

  it("persists SEO intelligence records in the repository", async () => {
    const repository = createInMemorySeoIntelligenceRepository();
    const module = createSeoIntelligenceModule(repository);
    const input = buildSeoInput();

    const saved = await module.persistProfile(WORKSPACE_ID, input);
    const loadedByStore = await module.getProfileByStore(WORKSPACE_ID, input.storeId);
    const loadedById = await module.getProfileRecord(WORKSPACE_ID, saved.recordId);

    assert.ok(loadedByStore);
    assert.ok(loadedById);
    assert.equal(loadedByStore!.seoConfidence, saved.seoConfidence);
    assert.equal(loadedById!.keywordClusters.length, saved.keywordClusters.length);

    const listed = await repository.list({
      workspaceId: WORKSPACE_ID,
      storeId: input.storeId,
    });
    assert.equal(listed.length, 1);
  });
});
