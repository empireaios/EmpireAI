import { formatCurrency, formatMargin, formatRelativeTime } from "../format.js";
import {
  formatDemandLabel,
  formatMarginPct,
  formatRecommendationLabel,
  formatSupplierAvailability,
  formatTrendLabel,
  productIntelligenceService,
} from "../../intelligence/product-intelligence-engine/service.js";
import { ActivityRepository } from "../repositories/activity-repository.js";
import { AdRepository } from "../repositories/ad-repository.js";
import { CampaignRepository } from "../repositories/campaign-repository.js";
import { CompanyRepository } from "../repositories/company-repository.js";
import { OrderRepository } from "../repositories/order-repository.js";
import { ProductRepository } from "../repositories/product-repository.js";
import { SupplierRepository } from "../repositories/supplier-repository.js";
import { TicketRepository } from "../repositories/ticket-repository.js";
import { DecisionRepository } from "../repositories/decision-repository.js";
import { WorkspaceRepository } from "../repositories/workspace-repository.js";

const companies = new CompanyRepository();
const activity = new ActivityRepository();
const decisions = new DecisionRepository();
const orders = new OrderRepository();
const suppliers = new SupplierRepository();
const products = new ProductRepository();
const campaigns = new CampaignRepository();
const ads = new AdRepository();
const tickets = new TicketRepository();
const workspaces = new WorkspaceRepository();

function mapCompanyView(company: ReturnType<CompanyRepository["listByWorkspace"]>[number]) {
  return {
    id: company.id,
    name: company.name,
    category: company.category,
    status: company.status,
    revenue: formatCurrency(company.revenueCents),
    margin: formatMargin(company.marginPct),
    agents: company.agentCount,
  };
}

export function loadDashboardView(workspaceId: string) {
  const portfolio = companies.portfolioTotals(workspaceId);
  const companyRows = companies.listByWorkspace(workspaceId);
  const recent = activity.listRecent(workspaceId, 5);

  return {
    portfolioMetrics: [
      {
        label: "Portfolio Revenue",
        value: formatCurrency(portfolio.revenueCents),
        change: "+18.4%",
        trend: "up" as const,
      },
      {
        label: "Net Margin",
        value: formatMargin(portfolio.avgMarginPct),
        change: "+2.1%",
        trend: "up" as const,
      },
      {
        label: "Active Companies",
        value: String(portfolio.companyCount),
        change: `+${Math.max(0, companyRows.filter((c) => c.status === "building").length)}`,
        trend: "up" as const,
      },
      {
        label: "Agents Online",
        value: String(portfolio.agentCount),
        change: "100%",
        trend: "neutral" as const,
      },
    ],
    companies: companyRows.map(mapCompanyView),
    recentActivity: recent.map((item) => ({
      id: item.id,
      agent: item.agentName,
      action: item.action,
      module: item.module,
      timestamp: formatRelativeTime(item.createdAt),
      outcome: item.outcome ?? undefined,
    })),
    workspaceId,
  };
}

export function loadStoreView(workspaceId: string) {
  const companyRows = companies.listByWorkspace(workspaceId);
  const building = companies.findBuilding(workspaceId);
  const buildStages = building ? companies.getBuildStages(building.id) : [];

  return {
    companies: companyRows.map(mapCompanyView),
    buildStages: buildStages.map((stage) => ({
      stage: stage.stage,
      progress: stage.progress,
      status: stage.status,
    })),
    buildingCompany: building
      ? {
          id: building.id,
          name: building.name,
          progress: Math.round(
            buildStages.reduce((sum, s) => sum + s.progress, 0) /
              Math.max(buildStages.length, 1),
          ),
        }
      : null,
  };
}

export function loadIntelligenceView(workspaceId: string) {
  productIntelligenceService.seedCatalog(workspaceId);
  const pieStats = productIntelligenceService.viewStats(workspaceId);
  const catalogRows = productIntelligenceService.listProducts(workspaceId, 10);

  if (catalogRows.length > 0) {
    return {
      metrics: [
        {
          label: "Products Evaluated",
          value: pieStats.productCount.toLocaleString(),
          change: `${pieStats.activeSignals} connector signals`,
          trend: "up" as const,
        },
        {
          label: "Avg Confidence",
          value: `${pieStats.avgConfidence.toFixed(1)}%`,
          change: "Multi-source aggregation",
          trend: "up" as const,
        },
        {
          label: "Active Signals",
          value: String(pieStats.activeSignals),
          change: "8 mock providers",
          trend: "neutral" as const,
        },
      ],
      products: catalogRows.map((p) => ({
        id: p.id,
        name: p.productName,
        score: p.overallScore,
        demand: formatDemandLabel(p.demandScore),
        demandScore: p.demandScore,
        competitionScore: p.competitionScore,
        margin: formatMarginPct(p.marginScore),
        marginScore: p.marginScore,
        supplierAvailability: formatSupplierAvailability(p.supplierAvailability),
        trend: formatTrendLabel(p.trendDirection),
        trendDirection: p.trendDirection,
        confidence: p.confidence,
        recommendation: formatRecommendationLabel(p.recommendation),
      })),
    };
  }

  const stats = products.statsForWorkspace(workspaceId);
  const rows = products.listTopByWorkspace(workspaceId, 10);

  return {
    metrics: [
      {
        label: "SKUs Analyzed",
        value: stats.skuCount.toLocaleString(),
        change: "+2,400 today",
        trend: "up" as const,
      },
      {
        label: "Avg Confidence",
        value: `${stats.avgScore.toFixed(1)}%`,
        change: "+1.8%",
        trend: "up" as const,
      },
      {
        label: "Active Signals",
        value: String(stats.activeSignals),
        change: "Live sync",
        trend: "neutral" as const,
      },
    ],
    products: rows.map((p) => ({
      id: p.id,
      name: p.name,
      score: p.score,
      demand: p.demand,
      demandScore: p.score,
      competitionScore: 0,
      margin: formatCurrency(p.marginCents),
      marginScore: 0,
      supplierAvailability: "Medium",
      trend: p.trend,
      trendDirection: "stable" as const,
      confidence: p.score,
      recommendation: "Review",
    })),
  };
}

export function loadSuppliersView(workspaceId: string) {
  const stats = suppliers.statsForWorkspace(workspaceId);
  const rows = suppliers.listByWorkspace(workspaceId);

  return {
    metrics: [
      { label: "Connected Suppliers", value: String(stats.count), trend: "neutral" as const },
      {
        label: "Fulfillment Rate",
        value: `${(stats.fulfillmentRate * 100).toFixed(1)}%`,
        change: "+0.3%",
        trend: "up" as const,
      },
      {
        label: "Auto-Recoveries",
        value: "12",
        change: "This month",
        trend: "neutral" as const,
      },
    ],
    suppliers: rows.map((s) => ({
      id: s.id,
      name: s.name,
      region: s.region,
      products: s.productCount,
      reliability: s.reliability,
      avgShip: `${s.avgShipDays.toFixed(1)} days`,
      status: s.status,
    })),
  };
}

export function loadMarketingView(workspaceId: string) {
  const stats = campaigns.statsForWorkspace(workspaceId);
  const rows = campaigns.listByWorkspace(workspaceId);

  return {
    metrics: [
      { label: "Active Campaigns", value: String(stats.activeCount), trend: "neutral" as const },
      {
        label: "Content Pieces",
        value: String(stats.contentPieces),
        change: "+124 this week",
        trend: "up" as const,
      },
      {
        label: "Avg Conversion",
        value: `${stats.avgConversion.toFixed(1)}%`,
        change: "+0.8%",
        trend: "up" as const,
      },
    ],
    campaigns: rows.map((c) => ({
      id: c.id,
      name: c.name,
      channel: c.channel,
      status: c.status,
      reach: c.reach,
      conversion: c.conversion,
    })),
  };
}

export function loadAdsView(workspaceId: string) {
  const stats = ads.statsForWorkspace(workspaceId);
  const rows = ads.listByWorkspace(workspaceId);

  return {
    metrics: [
      {
        label: "Daily Budget",
        value: formatCurrency(stats.dailyBudgetCents),
        trend: "neutral" as const,
      },
      {
        label: "Spend Today",
        value: formatCurrency(stats.spendTodayCents),
        change: "76% paced",
        trend: "neutral" as const,
      },
      {
        label: "Blended ROAS",
        value: `${stats.blendedRoas.toFixed(1)}×`,
        change: "+0.4×",
        trend: "up" as const,
      },
      {
        label: "Conversions",
        value: stats.conversions.toLocaleString(),
        change: "+22%",
        trend: "up" as const,
      },
    ],
    channels: rows.map((c) => ({
      channel: c.channel,
      spend: formatCurrency(c.spendCents),
      roas: `${c.roas.toFixed(1)}×`,
      status: c.status,
    })),
  };
}

export function loadFinanceView(workspaceId: string) {
  const portfolio = companies.portfolioTotals(workspaceId);
  const adStats = ads.statsForWorkspace(workspaceId);
  const orderStats = orders.statsForWorkspace(workspaceId);

  const revenue = portfolio.revenueCents;
  const cogs = Math.round(revenue * 0.39);
  const adSpend = adStats.dailyBudgetCents * 30;
  const platformFees = Math.round(revenue * 0.017);
  const netProfit = revenue - cogs - adSpend - platformFees;
  const margin = revenue > 0 ? (netProfit / revenue) * 100 : 0;

  return {
    metrics: [
      {
        label: "Net Profit (MTD)",
        value: formatCurrency(netProfit),
        change: "+24%",
        trend: "up" as const,
      },
      {
        label: "Net Margin",
        value: `${margin.toFixed(1)}%`,
        change: "+2.1%",
        trend: "up" as const,
      },
      { label: "Cash Runway", value: "18 mo", trend: "neutral" as const },
    ],
    breakdown: {
      revenue: formatCurrency(revenue),
      cogs: formatCurrency(cogs),
      adSpend: formatCurrency(adSpend),
      platformFees: formatCurrency(platformFees),
      netProfit: formatCurrency(netProfit),
      margin: `${margin.toFixed(1)}%`,
    },
    orderProfitToday: formatCurrency(orderStats.profitTodayCents),
  };
}

export function loadOrdersView(workspaceId: string) {
  const stats = orders.statsForWorkspace(workspaceId);
  const rows = orders.listByWorkspace(workspaceId, 20);

  return {
    metrics: [
      {
        label: "Today",
        value: String(stats.todayCount),
        change: "+12 vs yesterday",
        trend: "up" as const,
      },
      { label: "Processing", value: String(stats.processing), trend: "neutral" as const },
      { label: "Shipped", value: String(stats.shipped), trend: "neutral" as const },
      {
        label: "Profit Today",
        value: formatCurrency(stats.profitTodayCents),
        change: "+18%",
        trend: "up" as const,
      },
    ],
    orders: rows.map((o) => ({
      id: o.id,
      company: o.companyName,
      product: o.productName,
      total: formatCurrency(o.totalCents),
      profit: formatCurrency(o.profitCents),
      status: o.status,
      date: formatRelativeTime(o.createdAt),
    })),
  };
}

export function loadSupportView(workspaceId: string) {
  const stats = tickets.statsForWorkspace(workspaceId);
  const rows = tickets.listByWorkspace(workspaceId);

  return {
    metrics: [
      { label: "Tickets Today", value: String(stats.todayCount), trend: "neutral" as const },
      {
        label: "Auto-Resolved",
        value: `${Math.round(stats.autoResolvedPct)}%`,
        change: "+2%",
        trend: "up" as const,
      },
      {
        label: "Avg Resolution",
        value: `${stats.avgResolutionSeconds}s`,
        change: "−4s",
        trend: "up" as const,
      },
      { label: "CSAT Score", value: `${stats.csatScore}%`, trend: "neutral" as const },
    ],
    tickets: rows.map((t) => ({
      id: t.id,
      subject: t.subject,
      customer: t.customerName,
      status: t.status,
      agent: t.agentName,
      resolution: t.resolutionSeconds ? `${t.resolutionSeconds}s` : "—",
    })),
  };
}

export function loadSettingsView(workspaceId: string, userEmail?: string, userName?: string) {
  const workspace = workspaces.getById(workspaceId);
  const companyCount = companies.countByWorkspace(workspaceId);
  const integrations = workspaces.listIntegrations(workspaceId);

  return {
    account: {
      name: userName ?? "Empire Founder",
      email: userEmail ?? "founder@empireai.com",
    },
    workspace: {
      name: workspace?.name ?? "Empire Holdings",
      companies: companyCount,
      plan: workspace?.plan ?? "Sovereign",
    },
    integrations: integrations.map((i) => ({ name: i.name, status: i.status })),
    notifications: [
      "Daily portfolio digest",
      "Agent escalation alerts",
      "Payment failures",
      "New company manufactured",
    ],
    security: {
      lastLogin: formatRelativeTime(new Date().toISOString()),
      activeSessions: 1,
    },
    workspaceId,
  };
}

export function loadAdminView() {
  return {
    metrics: [
      { label: "Active Tenants", value: "2,412" },
      { label: "Agent Fleet", value: "43,416" },
      { label: "API Uptime", value: "99.97%" },
      { label: "Queue Depth", value: "124" },
    ],
    alerts: [
      {
        severity: "warning",
        message: "PrimeDrop API latency elevated — auto-failover active",
      },
      {
        severity: "info",
        message: "PIE batch job completed — 12,400 SKUs scored",
      },
      {
        severity: "success",
        message: "Platform deploy v2.14.0 — all regions healthy",
      },
    ],
    fleet: [
      { region: "US-East", agents: 12400, status: "healthy" },
      { region: "EU-West", agents: 9800, status: "healthy" },
      { region: "AP-South", agents: 11200, status: "healthy" },
    ],
  };
}

export function loadAiCeoView(workspaceId: string) {
  const portfolio = companies.portfolioTotals(workspaceId);
  const building = companies.findBuilding(workspaceId);

  decisions.ensureDefaults(workspaceId);
  const pendingDecisions = decisions.listPending(workspaceId);

  return {
    briefing: {
      headline: "Portfolio velocity is accelerating. Three ventures are ready to scale.",
      summary: `Portfolio revenue at ${formatCurrency(portfolio.revenueCents)} with ${portfolio.companyCount} companies. ${
        building
          ? `${building.name} completes build pipeline soon.`
          : "No companies currently in build pipeline."
      } Recommend reviewing ad allocation and manufacturing priorities.`,
      priorities: [
        { title: "Scale top revenue company", impact: "High", status: "Recommended" },
        {
          title: building ? `Launch ${building.name} ads` : "Launch next venture ads",
          impact: "Medium",
          status: "Queued",
        },
        { title: "Manufacture new vertical", impact: "High", status: "In progress" },
      ],
      decisions: pendingDecisions.map((decision) => ({
        id: decision.id,
        title: decision.title,
      })),
    },
  };
}

export { companies, activity, decisions, orders, suppliers, products, campaigns, ads, tickets, workspaces };
