import assert from "node:assert/strict";
import { afterEach, beforeEach, describe, it } from "node:test";

import { resetDatabaseInstance } from "../../brain/database.js";
import {
  buildCommerceEcosystemProfile,
  buildGlobalCommerceIntelligenceDashboard,
  computeExpansionIntelligenceScore,
  getCountryIntelligenceProfile,
  listCountryIntelligenceProfiles,
  listExpansionIntelligenceScores,
  rankGlobalOpportunities,
  resetGlobalCommerceIntelligenceRepository,
} from "../../runtime/global-commerce-intelligence/index.js";
import { buildOrLoadGlobalCommerceIdentity, resetGlobalCommerceRepository } from "../../runtime/global-commerce/index.js";
import { resetRuntimePluginRegistry } from "../../runtime/plugins/index.js";
import { configureValidationEnvironment } from "../harness.js";

const WORKSPACE_ID = "ws-b011";
const COMPANY_ID = "co-grand-king";

describe("Build Wave 3 — Global Commerce Intelligence Engine (B-011–B-015)", () => {
  beforeEach(() => {
    configureValidationEnvironment();
    resetDatabaseInstance();
    resetGlobalCommerceRepository();
    resetGlobalCommerceIntelligenceRepository();
    resetRuntimePluginRegistry();
  });

  afterEach(() => {
    resetGlobalCommerceIntelligenceRepository();
    resetGlobalCommerceRepository();
    resetRuntimePluginRegistry();
    resetDatabaseInstance();
  });

  it("B-011 — country intelligence defines 14 dimensions for seed countries", () => {
    const profiles = listCountryIntelligenceProfiles();
    assert.equal(profiles.length, 19);

    const sg = getCountryIntelligenceProfile("SG");
    assert.ok(sg);
    assert.equal(sg!.dataSource, "SEED");
    assert.ok(sg!.dimensions.marketMaturity >= 0);
    assert.ok(sg!.dimensions.regulatoryDifficulty >= 0);
    assert.ok(sg!.compositeScore >= 0);
    assert.ok(sg!.evidenceSummary.includes("SG"));
  });

  it("B-012 — commerce ecosystem treats domains as a whole", () => {
    const ecosystem = buildCommerceEcosystemProfile("US");
    assert.ok(ecosystem);
    assert.ok(ecosystem!.domains.length >= 9);
    assert.ok(ecosystem!.domains.some((d) => d.domain === "marketplace"));
    assert.ok(ecosystem!.domains.some((d) => d.domain === "payment"));
    assert.ok(ecosystem!.ecosystemHealthScore >= 0);
    assert.ok(["EMERGING", "DEVELOPING", "MATURE", "ADVANCED"].includes(ecosystem!.ecosystemMaturity));
  });

  it("B-013 — expansion intelligence score returns weighted dimensions", () => {
    buildOrLoadGlobalCommerceIdentity({ workspaceId: WORKSPACE_ID, companyId: COMPANY_ID });
    const score = computeExpansionIntelligenceScore(WORKSPACE_ID, COMPANY_ID, "SG");
    assert.ok(score);
    assert.ok(score!.expansionScore >= 0);
    assert.ok(score!.dimensions.length >= 14);
    assert.ok(["A", "B", "C", "D", "F"].includes(score!.grade));

    const all = listExpansionIntelligenceScores(WORKSPACE_ID, COMPANY_ID);
    assert.equal(all.length, 19);
  });

  it("B-014 — opportunity ranking ranks countries and marketplaces with evidence", () => {
    buildOrLoadGlobalCommerceIdentity({ workspaceId: WORKSPACE_ID, companyId: COMPANY_ID });
    const ranking = rankGlobalOpportunities(WORKSPACE_ID, COMPANY_ID, {
      productCategory: "electronics",
      supplierAvailable: true,
      maxCountries: 5,
    });

    assert.ok(ranking.rankingId);
    assert.equal(ranking.rankedCountries.length, 5);
    assert.ok(ranking.rankedCountries[0]!.why.length > 0);
    assert.ok(ranking.rankedCountries[0]!.confidence >= 0);
    assert.ok(ranking.rankedCountries[0]!.priorityMarketplaces.length > 0);
    assert.ok(ranking.launchSequence.length === 5);
  });

  it("B-015 — intelligence dashboard exposes Mission Control payload", () => {
    buildOrLoadGlobalCommerceIdentity({ workspaceId: WORKSPACE_ID, companyId: COMPANY_ID });
    const dashboard = buildGlobalCommerceIntelligenceDashboard(WORKSPACE_ID, COMPANY_ID);

    assert.equal(dashboard.moduleId, "global-commerce-intelligence");
    assert.equal(dashboard.missionId, "B-011-B-015");
    assert.ok(dashboard.topCountries.length > 0);
    assert.ok(dashboard.globalOpportunityHeatmap.length === 19);
    assert.ok(dashboard.expansionReadinessTimeline.length > 0);
    assert.equal(dashboard.intelligenceCoverage.registryCountries, 19);
    assert.equal(dashboard.intelligenceCoverage.seedCountries, 19);
  });
});
