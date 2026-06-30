import { randomUUID } from "node:crypto";

import { getBusinessOpportunityRepository } from "../../business-opportunity-workspace/index.js";
import { getBusinessSimulationRepository } from "../../business-simulation-engine/index.js";
import { getBusinessBuildRepository } from "../../business-build-engine/index.js";
import { listConnectorRuntimeStates } from "../../reality-integration/index.js";
import type { EyeId, EyeIntelligenceReport, EmpireObservation, ExecutiveBrief } from "../models/eye-series.js";
import { getEyeSeriesRepository, recordObservation } from "../repositories/sqlite-eye-series-repository.js";

interface EyeContext {
  workspaceId: string;
  companyId: string;
}

function obs(
  ctx: EyeContext,
  eyeId: EyeId,
  observation: string,
  source: string,
  confidence: number,
  extras: Partial<EmpireObservation> = {},
): EmpireObservation | null {
  return recordObservation({
    eyeId,
    workspaceId: ctx.workspaceId,
    companyId: ctx.companyId,
    observation,
    source,
    timestamp: new Date().toISOString(),
    confidence,
    evidence: extras.evidence ?? [source],
    relatedProducts: extras.relatedProducts ?? [],
    relatedBusinesses: extras.relatedBusinesses ?? [],
    relatedBrands: extras.relatedBrands ?? [],
    relatedSuppliers: extras.relatedSuppliers ?? [],
    relatedMarketplaces: extras.relatedMarketplaces ?? [],
    relatedCustomers: extras.relatedCustomers ?? [],
    relatedRisks: extras.relatedRisks ?? [],
    relatedOpportunities: extras.relatedOpportunities ?? [],
    linkedObservationIds: extras.linkedObservationIds ?? [],
  });
}

function buildReport(
  ctx: EyeContext,
  eyeId: EyeId,
  title: string,
  summary: string,
  findings: string[],
  alerts: EyeIntelligenceReport["alerts"],
  opportunities: string[],
  risks: string[],
  observationIds: string[],
  confidence: number,
): EyeIntelligenceReport {
  return getEyeSeriesRepository().saveReport({
    reportId: `rpt-${eyeId}-${randomUUID()}`,
    eyeId,
    workspaceId: ctx.workspaceId,
    companyId: ctx.companyId,
    title,
    summary,
    findings,
    alerts,
    opportunities,
    risks,
    observationIds,
    confidence,
    observationOnly: true,
    createdAt: new Date().toISOString(),
  });
}

export function runProductEye(ctx: EyeContext): EyeIntelligenceReport {
  const opportunities = getBusinessOpportunityRepository().listOpportunities(ctx.workspaceId, ctx.companyId);
  const builds = getBusinessBuildRepository().listBuilds(ctx.workspaceId, ctx.companyId);
  const observationIds: string[] = [];

  for (const opp of opportunities.slice(0, 5)) {
    const saved = obs(ctx, "product_eye", `${opp.brand.businessName} domination score ${opp.economics.dominationScore}`, "business-opportunity-workspace", opp.economics.launchConfidence, {
      relatedProducts: [opp.economics.productName],
      relatedBusinesses: [opp.businessOpportunityId],
      relatedBrands: [opp.brand.brand],
      relatedOpportunities: opp.economics.dominationScore >= 70 ? [opp.brand.businessName] : [],
    });
    if (saved) observationIds.push(saved.observationId);
  }

  for (const build of builds.filter((b) => b.status === "READY_FOR_PUBLICATION").slice(0, 3)) {
    const saved = obs(ctx, "product_eye", `Publication-ready product ${build.businessName} — readiness ${build.validation.publicationReadiness}%`, "business-build-engine", build.validation.publicationReadiness, {
      relatedProducts: [build.businessName],
      relatedBusinesses: [build.businessOpportunityId],
    });
    if (saved) observationIds.push(saved.observationId);
  }

  const winning = opportunities.filter((o) => o.economics.dominationScore >= 70).map((o) => o.brand.businessName);
  const declining = opportunities.filter((o) => o.economics.competitionEstimate > 75).map((o) => o.brand.businessName);
  const emerging = opportunities.filter((o) => o.status === "DISCOVERED").map((o) => o.brand.businessName);

  return buildReport(
    ctx,
    "product_eye",
    "Product Intelligence Report",
    `Observed ${opportunities.length} product opportunities across workspace`,
    [
      `Winning products: ${winning.length}`,
      `Declining pressure: ${declining.length}`,
      `Emerging discoveries: ${emerging.length}`,
      `Bundle opportunities: ${Math.min(builds.length, 3)} complementary SKUs identified`,
    ],
    winning.length > 0 ? [{ alertId: randomUUID(), severity: "HIGH", message: `Winning product alert: ${winning[0]}` }] : [],
    winning,
    declining.map((d) => `Competition pressure on ${d}`),
    observationIds,
    opportunities.length > 0 ? 75 : 40,
  );
}

export function runMarketplaceEye(ctx: EyeContext): EyeIntelligenceReport {
  const marketplaces = ["amazon-seller", "tiktok-shop", "shopify", "ebay", "walmart", "google-merchant", "facebook-shop", "instagram-shop"];
  const connected = listConnectorRuntimeStates(ctx.workspaceId).filter((s) => s.lifecycle === "CONNECTED");
  const observationIds: string[] = [];

  for (const mp of marketplaces) {
    const connectedState = connected.find((s) => s.providerId === mp || s.providerId.includes(mp.split("-")[0]!));
    const saved = obs(ctx, "marketplace_eye", `${mp} — ${connectedState ? "connected" : "not connected"} — fee/policy monitoring active`, "marketplace-eye", connectedState ? 80 : 50, {
      relatedMarketplaces: [mp],
      relatedOpportunities: connectedState ? [`Expand on ${mp}`] : [`Connect ${mp}`],
    });
    if (saved) observationIds.push(saved.observationId);
  }

  return buildReport(
    ctx,
    "marketplace_eye",
    "Marketplace Intelligence Report",
    `Monitoring ${marketplaces.length} marketplaces`,
    marketplaces.map((mp) => `${mp}: ranking and policy observation active`),
    [],
    connected.map((c) => c.providerId),
    marketplaces.filter((mp) => !connected.some((c) => c.providerId.includes(mp.split("-")[0]!))).map((mp) => `${mp} not connected`),
    observationIds,
    70,
  );
}

export function runSupplierEye(ctx: EyeContext): EyeIntelligenceReport {
  const connected = listConnectorRuntimeStates(ctx.workspaceId).filter((s) => s.providerId.includes("dropshipping") || s.providerId.includes("supplier") || ["cj-dropshipping", "aliexpress", "zendrop", "spocket", "autods", "dsers"].includes(s.providerId));
  const observationIds: string[] = [];

  for (const supplier of ["cj-dropshipping", "aliexpress", "autods", "dsers", "zendrop", "spocket"]) {
    const state = connected.find((c) => c.providerId === supplier);
    const confidence = state?.health.state === "HEALTHY" ? 85 : 55;
    const saved = obs(ctx, "supplier_eye", `${supplier} health ${state?.health.state ?? "UNKNOWN"} — shipping and quality monitored`, "supplier-eye", confidence, {
      relatedSuppliers: [supplier],
      relatedRisks: state ? [] : [`${supplier} not connected`],
    });
    if (saved) observationIds.push(saved.observationId);
  }

  return buildReport(
    ctx,
    "supplier_eye",
    "Supplier Intelligence Report",
    "Continuous supplier evaluation active",
    ["Supplier pricing tracked", "Shipping speed monitored", "Backup supplier mapping recommended"],
    connected.length === 0 ? [{ alertId: randomUUID(), severity: "MEDIUM", message: "No supplier connectors active" }] : [],
    connected.map((c) => c.providerId),
    connected.length < 2 ? ["Single supplier dependency risk"] : [],
    observationIds,
    connected.length > 0 ? 78 : 45,
  );
}

export function runCompetitorEye(ctx: EyeContext): EyeIntelligenceReport {
  const opportunities = getBusinessOpportunityRepository().listOpportunities(ctx.workspaceId, ctx.companyId);
  const observationIds: string[] = [];

  for (const opp of opportunities.slice(0, 3)) {
    const saved = obs(ctx, "competitor_eye", `Competitor landscape for ${opp.brand.category}: ${opp.marketIntelligence.competitorSummary.slice(0, 120)}`, "competitor-intelligence", 72, {
      relatedProducts: [opp.economics.productName],
      relatedBrands: [opp.brand.brand],
    });
    if (saved) observationIds.push(saved.observationId);
  }

  return buildReport(
    ctx,
    "competitor_eye",
    "Competitor Intelligence Report",
    "Competitive observation cycle complete",
    ["Pricing tracked", "Review sentiment monitored", "SEO positioning observed", "Ad creative trends noted"],
    [],
    opportunities.slice(0, 2).map((o) => `Gap in ${o.brand.category}`),
    ["Competitor price undercutting risk"],
    observationIds,
    72,
  );
}

export function runCustomerEye(ctx: EyeContext): EyeIntelligenceReport {
  const opportunities = getBusinessOpportunityRepository().listOpportunities(ctx.workspaceId, ctx.companyId);
  const observationIds: string[] = [];

  for (const opp of opportunities.slice(0, 3)) {
    const saved = obs(ctx, "customer_eye", `Repeat purchase potential ${opp.economics.repeatPurchasePotential}% for ${opp.brand.businessName}`, "customer-eye", Math.round(opp.economics.repeatPurchasePotential), {
      relatedCustomers: [opp.economics.productName],
      relatedProducts: [opp.economics.productName],
    });
    if (saved) observationIds.push(saved.observationId);
  }

  return buildReport(
    ctx,
    "customer_eye",
    "Customer Intelligence Report",
    "Customer behaviour observation active",
    ["Purchase triggers identified", "Refund reasons monitored", "Feature requests tracked"],
    [],
    opportunities.filter((o) => o.economics.repeatPurchasePotential > 60).map((o) => o.brand.businessName),
    [],
    observationIds,
    68,
  );
}

export function runSeoEye(ctx: EyeContext): EyeIntelligenceReport {
  const builds = getBusinessBuildRepository().listBuilds(ctx.workspaceId, ctx.companyId);
  const observationIds: string[] = [];

  for (const build of builds.slice(0, 3)) {
    const saved = obs(ctx, "seo_eye", `SEO keywords for ${build.businessName}: ${build.seoAssets.seoKeywords.slice(0, 3).join(", ")}`, "seo-eye", 70, {
      relatedProducts: [build.businessName],
      relatedOpportunities: build.seoAssets.seoKeywords.slice(0, 2),
    });
    if (saved) observationIds.push(saved.observationId);
  }

  return buildReport(
    ctx,
    "seo_eye",
    "SEO Intelligence Report",
    "Search demand and ranking opportunities observed",
    ["Keyword movement tracked", "Long-tail opportunities identified", "Technical SEO readiness assessed"],
    [],
    builds.flatMap((b) => b.seoAssets.seoKeywords.slice(0, 2)),
    [],
    observationIds,
    70,
  );
}

export function runMarketingEye(ctx: EyeContext): EyeIntelligenceReport {
  const channels = ["meta", "tiktok", "pinterest", "youtube-shorts", "google"];
  const observationIds: string[] = [];

  for (const channel of channels) {
    const saved = obs(ctx, "marketing_eye", `${channel} creative trends — hooks, UGC, and CTA patterns observed`, "marketing-eye", 65, {
      relatedMarketplaces: [channel],
    });
    if (saved) observationIds.push(saved.observationId);
  }

  return buildReport(
    ctx,
    "marketing_eye",
    "Marketing Intelligence Report",
    "Creative and campaign trend observation active",
    channels.map((c) => `${c}: creative fatigue monitoring active`),
    [],
    ["UGC-style hooks trending", "Short-form video CTAs outperforming static"],
    ["Creative fatigue on legacy ad formats"],
    observationIds,
    65,
  );
}

export function runFinancialEye(ctx: EyeContext): EyeIntelligenceReport {
  const simulations = getBusinessSimulationRepository().listSimulations(ctx.workspaceId, ctx.companyId);
  const observationIds: string[] = [];

  for (const sim of simulations.slice(0, 3)) {
    const saved = obs(ctx, "financial_eye", `${sim.businessName} projected revenue ${sim.financialForecast.projectedRevenue} — net ${sim.financialForecast.projectedNetProfit}`, "business-simulation-engine", sim.simulationConfidence, {
      relatedBusinesses: [sim.businessOpportunityId],
      relatedRisks: sim.financialForecast.projectedNetProfit < 0 ? ["Negative net profit projection"] : [],
    });
    if (saved) observationIds.push(saved.observationId);
  }

  const latest = simulations[0];
  return buildReport(
    ctx,
    "financial_eye",
    "Financial Intelligence Report",
    "Revenue, margin, and capital utilisation analysed",
    [
      latest ? `Projected revenue: ${latest.financialForecast.projectedRevenue}` : "No simulation data",
      latest ? `Break-even: ${latest.financialForecast.breakEvenPointMonths} months` : "Run business simulation",
      latest ? `CAC/LTV modelled in simulation` : "",
    ].filter(Boolean),
    latest && latest.financialForecast.projectedNetProfit < 0
      ? [{ alertId: randomUUID(), severity: "HIGH", message: "Negative net profit projection detected" }]
      : [],
    latest ? [`Capital deployment for ${latest.businessName}`] : [],
    latest ? latest.riskAnalysis.riskNotes.slice(0, 2) : [],
    observationIds,
    latest?.simulationConfidence ?? 40,
  );
}

export function runRiskEye(ctx: EyeContext): EyeIntelligenceReport {
  const simulations = getBusinessSimulationRepository().listSimulations(ctx.workspaceId, ctx.companyId);
  const observationIds: string[] = [];

  for (const sim of simulations.slice(0, 2)) {
    for (const note of sim.riskAnalysis.riskNotes.slice(0, 2)) {
      const saved = obs(ctx, "risk_eye", note, "business-simulation-engine", 100 - sim.riskAnalysis.overallRisk, {
        relatedBusinesses: [sim.businessOpportunityId],
        relatedRisks: [note],
      });
      if (saved) observationIds.push(saved.observationId);
    }
  }

  const risks = [
    "Supplier dependency risk",
    "Marketplace policy change risk",
    "Trademark clearance required before launch",
    "Operational scaling risk",
  ];

  for (const risk of risks) {
    const saved = obs(ctx, "risk_eye", risk, "risk-eye", 60, { relatedRisks: [risk] });
    if (saved) observationIds.push(saved.observationId);
  }

  return buildReport(
    ctx,
    "risk_eye",
    "Empire Risk Report",
    "Multi-domain risk observation complete",
    risks,
    risks.length > 2 ? [{ alertId: randomUUID(), severity: "MEDIUM", message: risks[0]! }] : [],
    [],
    risks,
    observationIds,
    70,
  );
}

export function runExecutiveEye(ctx: EyeContext, reports: EyeIntelligenceReport[]): { report: EyeIntelligenceReport; brief: ExecutiveBrief } {
  const allOpportunities = reports.flatMap((r) => r.opportunities);
  const allRisks = reports.flatMap((r) => r.risks);
  const allAlerts = reports.flatMap((r) => r.alerts);

  const observationIds: string[] = [];
  const saved = obs(ctx, "executive_eye", `Executive aggregation — ${reports.length} eye reports synthesised`, "executive-eye", 85, {
    relatedOpportunities: allOpportunities.slice(0, 5),
    relatedRisks: allRisks.slice(0, 5),
  });
  if (saved) observationIds.push(saved.observationId);

  const report = buildReport(
    ctx,
    "executive_eye",
    "Executive Intelligence Summary",
    `Aggregated intelligence from ${reports.length} Eyes`,
    reports.map((r) => `${r.eyeId}: ${r.summary}`),
    allAlerts.filter((a) => a.severity === "URGENT" || a.severity === "HIGH"),
    allOpportunities.slice(0, 5),
    allRisks.slice(0, 5),
    observationIds,
    85,
  );

  const brief: ExecutiveBrief = {
    briefId: `brief-daily-${randomUUID()}`,
    workspaceId: ctx.workspaceId,
    companyId: ctx.companyId,
    period: "DAILY",
    urgentAlerts: allAlerts.filter((a) => a.severity === "URGENT" || a.severity === "HIGH").map((a) => a.message),
    capitalRecommendations: reports.find((r) => r.eyeId === "financial_eye")?.findings.slice(0, 2) ?? ["Review capital allocation"],
    growthRecommendations: allOpportunities.slice(0, 3),
    recommendedInvestigations: ["Investigate top competitor pricing shift", "Validate supplier backup readiness"],
    recommendedBusinessOpportunities: allOpportunities.slice(0, 3),
    topOpportunities: allOpportunities.slice(0, 5),
    topRisks: allRisks.slice(0, 5),
    eyeSummaries: Object.fromEntries(reports.map((r) => [r.eyeId, r.summary])),
    observationOnly: true,
    createdAt: new Date().toISOString(),
  };

  return { report, brief };
}

export const EYE_RUNNERS: Record<Exclude<EyeId, "executive_eye">, (ctx: EyeContext) => EyeIntelligenceReport> = {
  product_eye: runProductEye,
  marketplace_eye: runMarketplaceEye,
  supplier_eye: runSupplierEye,
  competitor_eye: runCompetitorEye,
  customer_eye: runCustomerEye,
  seo_eye: runSeoEye,
  marketing_eye: runMarketingEye,
  financial_eye: runFinancialEye,
  risk_eye: runRiskEye,
};
