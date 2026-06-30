import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { describe, it } from "node:test";

import {
  COMPANY_STATUSES,
  CROSS_LEARNING_CATEGORIES,
  PORTFOLIO_PRIORITIES,
  createInMemoryMultiCompanyIntelligenceRepository,
  createMultiCompanyIntelligenceModule,
  generateMultiCompanyIntelligence,
  validateMultiCompanyReport,
} from "../../execution/multi-company-intelligence/index.js";

const WORKSPACE_ID = "ws-m097";

function buildMultiCompanyInput(empireId = randomUUID()) {
  return {
    empireId,
    empireName: "Empire Holdings Group",
    primaryBrand: {
      brandId: randomUUID(),
      brandName: "Kitchen Blender Supply Co.",
      slogan: "Quality you can ship today",
      niche: "Curated ecommerce essentials",
      targetAudience: "Online shoppers seeking fast, reliable product discovery",
      positioning: "Trusted direct-to-consumer category leader",
      confidence: 88,
    },
    companies: [
      {
        companyName: "Kitchen Blender Supply Co.",
        brandName: "Kitchen Blender Supply Co.",
        niche: "Kitchen appliances",
        monthlyRevenue: 32000,
        healthScore: 86,
        storeCount: 2,
      },
      {
        companyName: "Home Essentials Direct",
        brandName: "Home Essentials Direct",
        niche: "Home organization",
        monthlyRevenue: 18500,
        healthScore: 78,
        storeCount: 1,
      },
      {
        companyName: "FitGear Outlet",
        brandName: "FitGear Outlet",
        niche: "Fitness accessories",
        monthlyRevenue: 12400,
        healthScore: 72,
        storeCount: 1,
      },
    ],
    currency: "USD",
    portfolioIndex: 82,
  };
}

describe("Mission 097 Multi-Company Intelligence Engine", () => {
  it("generates multi-company report with safety flags", async () => {
    const module = createMultiCompanyIntelligenceModule();
    const record = await module.persistIntelligence(WORKSPACE_ID, buildMultiCompanyInput());

    assert.ok(record.reportId);
    assert.match(record.reportName, /Empire Holdings Group/);
    assert.equal(record.unlimitedCompaniesSupported, true);
    assert.equal(record.intelligenceOnly, true);
    assert.equal(record.deploymentEnabled, false);
    assert.equal(record.autoMergeEnabled, false);
    assert.ok(record.confidence >= 55);
    assert.ok(record.signals.some((signal) => signal.signalType === "multi_company_composite"));
  });

  it("supports unlimited companies in portfolio", () => {
    const manyCompanies = Array.from({ length: 8 }, (_, index) => ({
      companyName: `Company ${index + 1}`,
      brandName: `Brand ${index + 1}`,
      niche: `Niche ${index + 1}`,
      monthlyRevenue: 8000 + index * 2000,
      healthScore: 70 + index,
      storeCount: 1,
    }));

    const report = generateMultiCompanyIntelligence({
      ...buildMultiCompanyInput(),
      companies: manyCompanies,
    });

    assert.equal(report.companies.length, 8);
    assert.equal(report.portfolio.totalCompanies, 8);
    assert.equal(report.unlimitedCompaniesSupported, true);
  });

  it("tracks company entries with health scores", () => {
    const companies = generateMultiCompanyIntelligence(buildMultiCompanyInput()).companies;

    assert.equal(companies.length, 3);
    for (const company of companies) {
      assert.ok(COMPANY_STATUSES.includes(company.status));
      assert.ok(company.healthScore >= 0 && company.healthScore <= 100);
      assert.ok(company.monthlyRevenue >= 0);
    }
  });

  it("generates cross-learning insights across companies", () => {
    const crossLearning = generateMultiCompanyIntelligence(buildMultiCompanyInput()).crossLearning;

    assert.ok(crossLearning.length >= 2);
    for (const insight of crossLearning) {
      assert.ok(CROSS_LEARNING_CATEGORIES.includes(insight.category));
      assert.ok(insight.sourceCompany.length > 0);
      assert.ok(insight.targetCompanies.length >= 1);
      assert.ok(insight.replicablePattern.length > 0);
    }
  });

  it("synthesizes cross-brand intelligence", () => {
    const crossBrand = generateMultiCompanyIntelligence(buildMultiCompanyInput()).crossBrand;

    assert.ok(crossBrand.sharedAudienceSegments.length >= 1);
    assert.ok(crossBrand.complementaryBrands.length >= 1);
    assert.ok(crossBrand.crossSellOpportunities.length >= 1);
    assert.ok(crossBrand.portfolioSynergyScore >= 0 && crossBrand.portfolioSynergyScore <= 100);
    assert.ok(crossBrand.summary.length > 0);
  });

  it("manages portfolio with capital allocation", () => {
    const portfolio = generateMultiCompanyIntelligence(buildMultiCompanyInput()).portfolio;

    assert.equal(portfolio.totalCompanies, 3);
    assert.ok(portfolio.activeCompanies >= 1);
    assert.ok(portfolio.totalMonthlyRevenue > 0);
    assert.ok(PORTFOLIO_PRIORITIES.includes(portfolio.recommendedPriority));
    assert.equal(portfolio.topPerformer, "Kitchen Blender Supply Co.");
    assert.ok(Object.keys(portfolio.capitalAllocationPercent).length >= 3);
    const allocationTotal = Object.values(portfolio.capitalAllocationPercent).reduce(
      (total, value) => total + value,
      0,
    );
    assert.ok(Math.abs(allocationTotal - 100) < 1);
  });

  it("computes weighted confidence signals", () => {
    const report = generateMultiCompanyIntelligence(buildMultiCompanyInput());

    assert.ok(report.signals.length >= 5);
    const composite = report.signals.find(
      (signal) => signal.signalType === "multi_company_composite",
    );
    assert.ok(composite);
    assert.equal(composite!.score, report.confidence);
  });

  it("validates multi-company report schema", () => {
    const report = generateMultiCompanyIntelligence(buildMultiCompanyInput());
    const validated = validateMultiCompanyReport({ reportId: randomUUID(), ...report });

    assert.equal(validated.unlimitedCompaniesSupported, true);
    assert.equal(validated.intelligenceOnly, true);
    assert.equal(validated.autoMergeEnabled, false);
    assert.ok(validated.companies.length >= 1);
  });

  it("persists multi-company records in the repository", async () => {
    const repository = createInMemoryMultiCompanyIntelligenceRepository();
    const module = createMultiCompanyIntelligenceModule(repository);
    const input = buildMultiCompanyInput();

    const saved = await module.persistIntelligence(WORKSPACE_ID, input);
    const loadedByEmpire = await module.getIntelligenceByEmpire(WORKSPACE_ID, input.empireId);
    const loadedById = await module.getIntelligenceRecord(WORKSPACE_ID, saved.recordId);

    assert.ok(loadedByEmpire);
    assert.ok(loadedById);
    assert.equal(loadedByEmpire!.portfolio.totalCompanies, saved.portfolio.totalCompanies);
    assert.equal(loadedById!.crossLearning.length, saved.crossLearning.length);

    const listed = await repository.list({
      workspaceId: WORKSPACE_ID,
      empireId: input.empireId,
    });
    assert.equal(listed.length, 1);
  });
});
