import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { describe, it } from "node:test";

import {
  createFounderCommandCenterModule,
  createInMemoryFounderCommandCenterRepository,
  generateFounderCommandCenter,
} from "../../revenue/founder-command-center/index.js";
import {
  createCapitalAllocationModule,
} from "../../revenue/capital-allocation-intelligence/index.js";
import {
  createInMemoryPortfolioRepository,
  createOpportunityPortfolioModule,
} from "../../revenue/opportunity-portfolio/index.js";
import {
  createBrandGenesisModule,
} from "../../execution/brand-genesis/index.js";
import {
  createMarketingCampaignGenesisModule,
} from "../../execution/marketing-campaign-genesis/index.js";
import {
  createSupplierConnectorFrameworkModule,
  prepareAllSupplierConnectors,
} from "../../suppliers/supplier-connector-framework/index.js";

const WORKSPACE_ID = "ws-m071";
const TOTAL_CAPITAL = 25_000;

function buildBrandOfferInput(brandId: string = randomUUID()) {
  return {
    brand: {
      brandId,
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
      confidence: 84,
    },
  };
}

async function buildFullDashboardInput() {
  const portfolioModule = createOpportunityPortfolioModule();
  const capitalModule = createCapitalAllocationModule();
  const brandModule = createBrandGenesisModule();
  const campaignModule = createMarketingCampaignGenesisModule();

  const revenueOpportunity = {
    opportunityId: randomUUID(),
    productId: "prod-m071-blender",
    opportunityType: "DROPSHIPPING" as const,
    confidence: 82,
    expectedValue: 88,
    expectedDifficulty: 35,
    reasons: ["Strong demand", "Low fulfillment friction"],
    risks: ["Seasonal spike"],
  };

  const portfolioEntry = await portfolioModule.addPortfolioEntry(
    WORKSPACE_ID,
    revenueOpportunity,
  );

  const allocations = await capitalModule.persistCapitalAllocations(WORKSPACE_ID, {
    totalCapital: TOTAL_CAPITAL,
    entries: [
      {
        portfolioEntry: {
          entryId: portfolioEntry.entryId,
          revenueOpportunityId: revenueOpportunity.opportunityId,
          productId: revenueOpportunity.productId,
          state: portfolioEntry.state,
          portfolioScore: portfolioEntry.portfolioScore,
          capitalPriority: portfolioEntry.capitalPriority,
          riskLevel: portfolioEntry.riskLevel,
        },
        revenueOpportunity: {
          opportunityId: revenueOpportunity.opportunityId,
          productId: revenueOpportunity.productId,
          confidence: revenueOpportunity.confidence,
          expectedValue: revenueOpportunity.expectedValue,
          expectedDifficulty: revenueOpportunity.expectedDifficulty,
        },
      },
    ],
  });

  const allocation = allocations[0]!;
  const brandRecord = await brandModule.persistBrandProfile(WORKSPACE_ID, {
    revenueOpportunity: {
      opportunityId: revenueOpportunity.opportunityId,
      productId: revenueOpportunity.productId,
      opportunityType: revenueOpportunity.opportunityType,
      confidence: revenueOpportunity.confidence,
      expectedValue: revenueOpportunity.expectedValue,
      expectedDifficulty: revenueOpportunity.expectedDifficulty,
      recommendedAction: "Launch a low-budget dropshipping test",
      reasons: revenueOpportunity.reasons,
    },
    portfolioEntry: {
      entryId: portfolioEntry.entryId,
      revenueOpportunityId: revenueOpportunity.opportunityId,
      productId: revenueOpportunity.productId,
      state: portfolioEntry.state,
      portfolioScore: portfolioEntry.portfolioScore,
      capitalPriority: portfolioEntry.capitalPriority,
    },
    capitalAllocation: {
      allocationId: allocation.allocationId,
      opportunityId: revenueOpportunity.opportunityId,
      productId: revenueOpportunity.productId,
      portfolioState: allocation.portfolioState,
      allocationPercentage: allocation.allocationPercentage,
      riskAdjustedAllocation: allocation.riskAdjustedAllocation,
      confidence: allocation.confidence,
    },
  });

  const brandInput = buildBrandOfferInput(brandRecord.brandId);
  const campaignRecord = await campaignModule.persistCampaign(WORKSPACE_ID, {
    ...brandInput,
    storeId: randomUUID(),
  });

  const suppliers = prepareAllSupplierConnectors().map((record) => ({
    ...record,
    recordId: randomUUID(),
  }));

  const storeId = randomUUID();

  return {
    opportunities: [portfolioEntry],
    brands: [
      {
        brandId: brandRecord.brandId,
        brandName: brandRecord.brandName,
        niche: brandRecord.niche,
        confidence: brandRecord.confidence,
        opportunityId: brandRecord.opportunityId,
        productId: brandRecord.productId,
      },
    ],
    stores: [
      {
        storeId,
        brandId: brandRecord.brandId,
        confidence: 78,
        pageCount: 8,
        status: "DEPLOYED" as const,
      },
    ],
    suppliers,
    campaigns: [campaignRecord],
    capitalAllocations: allocations,
    revenue: {
      totalRevenue: 18_500,
      netProfit: 4_200,
      cashAvailable: 2_800,
      pendingAdvertising: 950,
      currency: "USD",
    },
    deployments: [
      {
        recordId: randomUUID(),
        storeId,
        deploymentStatus: "PACKAGE_VALIDATED" as const,
        hostingTarget: "VERCEL",
        confidence: 85,
      },
    ],
  };
}

describe("Mission 071 Founder Command Center", () => {
  it("synthesizes a dashboard with all eight display sections", async () => {
    const module = createFounderCommandCenterModule();
    const input = await buildFullDashboardInput();
    const record = await module.persistDashboard(WORKSPACE_ID, input);

    assert.ok(record.dashboardId);
    assert.ok(record.opportunities.totalCount >= 1);
    assert.ok(record.brands.totalCount >= 1);
    assert.ok(record.stores.totalCount >= 1);
    assert.ok(record.suppliers.totalCount >= 1);
    assert.ok(record.campaigns.totalCount >= 1);
    assert.ok(record.capitalAllocation.allocationCount >= 1);
    assert.ok(record.revenueTracking.totalRevenue > 0);
    assert.ok(record.deploymentStatus.totalCount >= 1);
    assert.ok(record.confidence >= 60);
    assert.ok(record.signals.some((signal) => signal.signalType === "dashboard_composite"));
  });

  it("aggregates opportunities with portfolio state and scoring", async () => {
    const input = await buildFullDashboardInput();
    const dashboard = generateFounderCommandCenter(input);

    assert.equal(dashboard.opportunities.items[0]!.productId, "prod-m071-blender");
    assert.ok(dashboard.opportunities.scalingCount >= 0);
    assert.ok(dashboard.opportunities.healthScore > 0);
    assert.match(dashboard.opportunities.summary, /opportunities/);
  });

  it("tracks capital allocation and revenue metrics", async () => {
    const input = await buildFullDashboardInput();
    const dashboard = generateFounderCommandCenter(input);

    assert.equal(dashboard.capitalAllocation.totalCapital, TOTAL_CAPITAL);
    assert.ok(dashboard.capitalAllocation.allocatedCapital > 0);
    assert.equal(dashboard.revenueTracking.currency, "USD");
    assert.equal(dashboard.revenueTracking.totalRevenue, 18_500);
    assert.equal(dashboard.revenueTracking.netProfit, 4_200);
    assert.ok(dashboard.revenueTracking.healthScore > 0);
  });

  it("chains with upstream portfolio, brand, campaign, and supplier modules", async () => {
    const portfolioModule = createOpportunityPortfolioModule(createInMemoryPortfolioRepository());
    const supplierModule = createSupplierConnectorFrameworkModule();
    const brandModule = createBrandGenesisModule();
    const campaignModule = createMarketingCampaignGenesisModule();

    const revenueOpportunity = {
      opportunityId: randomUUID(),
      productId: "prod-m071-chain",
      opportunityType: "AFFILIATE" as const,
      confidence: 74,
      expectedValue: 76,
      expectedDifficulty: 42,
      reasons: ["Affiliate demand"],
      risks: ["Commission volatility"],
    };

    const entry = await portfolioModule.addPortfolioEntry(WORKSPACE_ID, revenueOpportunity);
    const brand = await brandModule.persistBrandProfile(WORKSPACE_ID, {
      revenueOpportunity: {
        opportunityId: revenueOpportunity.opportunityId,
        productId: revenueOpportunity.productId,
        opportunityType: revenueOpportunity.opportunityType,
        confidence: revenueOpportunity.confidence,
        expectedValue: revenueOpportunity.expectedValue,
        expectedDifficulty: revenueOpportunity.expectedDifficulty,
        recommendedAction: "Launch affiliate content funnel",
        reasons: revenueOpportunity.reasons,
      },
      portfolioEntry: {
        entryId: entry.entryId,
        revenueOpportunityId: revenueOpportunity.opportunityId,
        productId: revenueOpportunity.productId,
        state: entry.state,
        portfolioScore: entry.portfolioScore,
        capitalPriority: entry.capitalPriority,
      },
      capitalAllocation: {
        allocationId: randomUUID(),
        opportunityId: revenueOpportunity.opportunityId,
        productId: revenueOpportunity.productId,
        portfolioState: entry.state,
        allocationPercentage: 25,
        riskAdjustedAllocation: 2500,
        confidence: 70,
      },
    });
    const brandInput = buildBrandOfferInput(brand.brandId);
    const campaign = await campaignModule.persistCampaign(WORKSPACE_ID, {
      ...brandInput,
      storeId: undefined,
    });
    const supplier = await supplierModule.persistConnector(WORKSPACE_ID, {
      platform: "CJ_DROPSHIPPING",
      credentialsConfigured: true,
    });

    const dashboard = generateFounderCommandCenter({
      opportunities: [entry],
      brands: [
        {
          brandId: brand.brandId,
          brandName: brand.brandName,
          niche: brand.niche,
          confidence: brand.confidence,
          opportunityId: brand.opportunityId,
          productId: brand.productId,
        },
      ],
      campaigns: [campaign],
      suppliers: [supplier],
    });

    assert.equal(dashboard.brands.items[0]!.brandId, brand.brandId);
    assert.equal(dashboard.campaigns.items[0]!.campaignId, campaign.campaignId);
    assert.equal(dashboard.suppliers.items[0]!.platform, "CJ_DROPSHIPPING");
    assert.equal(dashboard.suppliers.readyCount, 1);
  });

  it("reports deployment status with validated and failed packages", () => {
    const dashboard = generateFounderCommandCenter({
      deployments: [
        {
          recordId: randomUUID(),
          storeId: randomUUID(),
          deploymentStatus: "PACKAGE_VALIDATED",
          hostingTarget: "VERCEL",
          confidence: 90,
        },
        {
          recordId: randomUUID(),
          storeId: randomUUID(),
          deploymentStatus: "PACKAGE_FAILED",
          hostingTarget: "DOCKER",
          confidence: 40,
        },
      ],
    });

    assert.equal(dashboard.deploymentStatus.totalCount, 2);
    assert.equal(dashboard.deploymentStatus.validatedCount, 1);
    assert.equal(dashboard.deploymentStatus.failedCount, 1);
    assert.ok(dashboard.deploymentStatus.healthScore > 0);
  });

  it("persists dashboard snapshots and retrieves the latest record", async () => {
    const repository = createInMemoryFounderCommandCenterRepository();
    const module = createFounderCommandCenterModule(repository);
    const input = await buildFullDashboardInput();

    const saved = await module.persistDashboard(WORKSPACE_ID, input);
    const latest = await module.getLatestDashboard(WORKSPACE_ID);
    const loaded = await module.getDashboardRecord(WORKSPACE_ID, saved.recordId);

    assert.ok(latest);
    assert.ok(loaded);
    assert.equal(latest!.recordId, saved.recordId);
    assert.equal(loaded!.companyCount, saved.companyCount);
    assert.equal(loaded!.brands.totalCount, saved.brands.totalCount);

    const listed = await repository.list({
      workspaceId: WORKSPACE_ID,
      minConfidence: 50,
    });
    assert.equal(listed.length, 1);
  });
});
