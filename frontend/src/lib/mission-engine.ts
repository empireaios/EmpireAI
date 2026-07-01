import { paths } from "@/routes/paths";
import { asArray, asNumber, asRecord, asString, healthFromStatus } from "@/lib/empire-data";

export type MissionPriority = "critical" | "high" | "medium" | "low";

export interface MissionAction {
  id: string;
  title: string;
  why: string;
  priority: MissionPriority;
  href?: string;
  category: "launch" | "commerce" | "brand" | "infrastructure" | "intelligence" | "operations";
}

export interface MissionContext {
  dashboard: Record<string, unknown> | null;
  ofd: Record<string, unknown> | null;
  brief: Record<string, unknown> | null;
  eyes: Record<string, unknown> | null;
  executive: Record<string, unknown> | null;
}

function marketplaceStatus(dashboard: Record<string, unknown>, id: string): string {
  const marketplaces = asArray(dashboard.marketplaces);
  const match = marketplaces.find((entry) => asString(asRecord(entry)?.marketplaceId) === id);
  return asString(asRecord(match)?.status, "NOT_CONNECTED");
}

export function buildMissionActions(ctx: MissionContext): MissionAction[] {
  const actions: MissionAction[] = [];
  const dashboard = ctx.dashboard;
  if (!dashboard) return actions;

  const stripeStatus = asString(asRecord(dashboard.stripe)?.status, "NOT_CONNECTED");
  const cjStatus = asString(asRecord(dashboard.cj)?.status, "NOT_CONNECTED");
  const shopifyStatus = marketplaceStatus(dashboard, "shopify");
  const supplierStatus = asString(asRecord(dashboard.supplier)?.status, "NOT_CONNECTED");

  const businessWorkspace = asRecord(dashboard.businessOpportunityWorkspace);
  const approvedCount = asNumber(businessWorkspace?.approvedCount);
  const totalOpportunities = asNumber(businessWorkspace?.totalOpportunities);
  const pendingBusinesses = Math.max(0, totalOpportunities - approvedCount);

  const productDiscovery = asRecord(dashboard.productDiscovery);
  const discovered = asNumber(productDiscovery?.opportunitiesDiscovered);

  const launchReadiness = asRecord(dashboard.launchReadiness);
  const launchScore = asNumber(launchReadiness?.overallReadinessScore ?? launchReadiness?.overallScore);

  if (stripeStatus !== "CONNECTED") {
    actions.push({
      id: "connect-stripe",
      title: "Connect Stripe",
      why: "Checkout cannot capture real revenue until Stripe is live and verified.",
      priority: "critical",
      href: paths.dashboard.infrastructurePayments,
      category: "infrastructure",
    });
  }

  if (cjStatus !== "CONNECTED") {
    actions.push({
      id: "connect-cj",
      title: "Connect CJ Dropshipping",
      why: "Fulfillment and supplier inventory depend on a live CJ connection.",
      priority: "critical",
      href: paths.dashboard.infrastructureSuppliers,
      category: "infrastructure",
    });
  }

  if (shopifyStatus !== "CONNECTED") {
    actions.push({
      id: "connect-shopify",
      title: "Connect Shopify",
      why: "Primary storefront channel is offline — listings cannot reach buyers on Shopify.",
      priority: "high",
      href: paths.dashboard.infrastructureMarketplaces,
      category: "infrastructure",
    });
  }

  if (discovered === 0) {
    actions.push({
      id: "run-discovery",
      title: "Run Product Discovery",
      why: "No product candidates in pipeline — discovery feeds every downstream business decision.",
      priority: "high",
      href: paths.dashboard.intelligence,
      category: "intelligence",
    });
  }

  if (pendingBusinesses > 0) {
    actions.push({
      id: "review-businesses",
      title: `Review ${pendingBusinesses} Business${pendingBusinesses === 1 ? "" : "es"}`,
      why: "Unapproved opportunities block brand build, preview generation, and launch sequencing.",
      priority: "high",
      href: paths.dashboard.brands,
      category: "brand",
    });
  }

  if (approvedCount > 0) {
    actions.push({
      id: "generate-preview",
      title: "Generate Business Preview",
      why: "Approved brands need visual and marketplace previews before launch approval.",
      priority: "medium",
      href: paths.dashboard.brands,
      category: "brand",
    });
  }

  if (launchScore > 0 && launchScore < 80) {
    actions.push({
      id: "improve-launch-readiness",
      title: "Improve Launch Readiness",
      why: `Launch score is ${launchScore}/100 — resolve blockers before going live.`,
      priority: "high",
      href: paths.dashboard.launch,
      category: "launch",
    });
  }

  if (launchScore >= 80) {
    actions.push({
      id: "launch-business",
      title: "Launch Business",
      why: "Readiness threshold met — execute launch mission while momentum is high.",
      priority: "critical",
      href: paths.dashboard.launch,
      category: "launch",
    });
  }

  if (supplierStatus === "PARTIAL" || supplierStatus === "NOT_CONNECTED") {
    actions.push({
      id: "review-supplier",
      title: "Review Supplier Pipeline",
      why: "Supplier health affects margin accuracy, fulfillment SLA, and customer satisfaction.",
      priority: "medium",
      href: paths.dashboard.infrastructureSuppliers,
      category: "operations",
    });
  }

  const ofdPhase = asString(ctx.ofd?.currentPhase, "PRE_LAUNCH");
  if (ofdPhase === "PRE_LAUNCH") {
    actions.push({
      id: "ofd-progress",
      title: "Advance Operation First Dollar",
      why: asString(ctx.ofd?.nextCriticalAction, "Complete pre-launch milestones to unlock first real revenue."),
      priority: "high",
      href: paths.dashboard.command,
      category: "launch",
    });
  }

  for (const item of asArray(ctx.brief?.grandKingActionsToday).slice(0, 2)) {
    const text = asString(item);
    if (!text || text === "—") continue;
    actions.push({
      id: `brief-${text.slice(0, 24)}`,
      title: text.length > 48 ? `${text.slice(0, 48)}…` : text,
      why: "Prioritized in today's executive brief.",
      priority: "high",
      href: paths.dashboard.home,
      category: "operations",
    });
  }

  for (const item of asArray(ctx.eyes?.executiveRecommendations).slice(0, 2)) {
    const text = asString(item);
    if (!text || text === "—") continue;
    actions.push({
      id: `eye-${text.slice(0, 24)}`,
      title: text.length > 48 ? `${text.slice(0, 48)}…` : text,
      why: "Eye Series intelligence flagged this for executive attention.",
      priority: "medium",
      href: paths.dashboard.command,
      category: "intelligence",
    });
  }

  const priorityOrder: Record<MissionPriority, number> = {
    critical: 0,
    high: 1,
    medium: 2,
    low: 3,
  };

  const seen = new Set<string>();
  return actions
    .filter((action) => {
      if (seen.has(action.id)) return false;
      seen.add(action.id);
      return true;
    })
    .sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
}

export function extractBlockers(ctx: MissionContext): string[] {
  const blockers: string[] = [];
  const dashboard = ctx.dashboard;
  if (!dashboard) return blockers;

  if (healthFromStatus(asString(asRecord(dashboard.stripe)?.status, "NOT_CONNECTED")) === "critical") {
    blockers.push("Stripe not connected — no live checkout");
  }
  if (healthFromStatus(asString(asRecord(dashboard.cj)?.status, "NOT_CONNECTED")) === "critical") {
    blockers.push("CJ Dropshipping not connected — fulfillment blocked");
  }
  if (marketplaceStatus(dashboard, "shopify") !== "CONNECTED") {
    blockers.push("Shopify not connected — storefront channel offline");
  }

  for (const item of asArray(ctx.executive?.blockers ?? ctx.executive?.blockingIssues)) {
    const text = asString(item);
    if (text !== "—") blockers.push(text);
  }

  for (const item of asArray(asRecord(dashboard.launchReadiness)?.blockingIssues)) {
    const text = asString(item);
    if (text !== "—") blockers.push(text);
  }

  return [...new Set(blockers)].slice(0, 8);
}
