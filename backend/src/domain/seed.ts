import { logger } from "../config/logger.js";
import { getDatabase } from "../brain/database.js";
import {
  activity,
  ads,
  campaigns,
  companies,
  decisions,
  orders,
  products,
  suppliers,
  tickets,
  workspaces,
} from "./services/module-views.js";

const DEFAULT_WORKSPACE = "ws_empire_1";

function scopedId(workspaceId: string, id: string): string {
  return `${workspaceId}__${id}`;
}

export function seedDomainData(workspaceId = DEFAULT_WORKSPACE): void {
  const db = getDatabase();
  const existing = db
    .prepare(`SELECT COUNT(*) as count FROM companies WHERE workspace_id = @workspaceId`)
    .get({ workspaceId }) as { count: number };

  if (existing.count > 0) {
    logger.info({ workspaceId }, "Domain data already seeded");
    return;
  }

  workspaces.ensure({ id: workspaceId, name: "Empire Holdings", plan: "Sovereign" });

  for (const integration of ["Shopify", "Meta Ads", "Stripe"]) {
    const integrationId = scopedId(workspaceId, integration.toLowerCase().replace(/\s+/g, "-"));
    const existingIntegration = db
      .prepare(
        `SELECT id FROM workspace_integrations
         WHERE workspace_id = @workspaceId AND name = @name LIMIT 1`,
      )
      .get({ workspaceId, name: integration }) as { id: string } | undefined;
    if (!existingIntegration) {
      workspaces.addIntegration({
        id: integrationId,
        workspaceId,
        name: integration,
        status: "Connected",
      });
    }
  }

  const c1 = companies.create({
    workspaceId,
    id: scopedId(workspaceId, "c1"),
    name: "Meridian Commerce",
    category: "Commerce",
    status: "live",
    revenueCents: 428_000_00,
    marginPct: 42,
    agentCount: 18,
  });

  const c2 = companies.create({
    workspaceId,
    id: scopedId(workspaceId, "c2"),
    name: "Vertex SaaS",
    category: "SaaS",
    status: "live",
    revenueCents: 312_000_00,
    marginPct: 71,
    agentCount: 16,
  });

  const c3 = companies.create({
    workspaceId,
    id: scopedId(workspaceId, "c3"),
    name: "Lumen Media",
    category: "Media",
    status: "building",
    revenueCents: 0,
    marginPct: null,
    agentCount: 12,
  });

  const c4 = companies.create({
    workspaceId,
    id: scopedId(workspaceId, "c4"),
    name: "Atlas Fintech",
    category: "Fintech",
    status: "live",
    revenueCents: 891_000_00,
    marginPct: 34,
    agentCount: 18,
  });

  const lumenStages = companies.getBuildStages(c3.id);
  const db2 = getDatabase();
  for (const [index, stage] of lumenStages.entries()) {
    const progress = [100, 100, 78, 45, 20][index] ?? 0;
    const status = progress === 100 ? "complete" : progress > 0 ? "in_progress" : "pending";
    db2.prepare(
      `UPDATE company_build_stages SET progress = @progress, status = @status WHERE id = @id`,
    ).run({ id: stage.id, progress, status });
  }

  for (const event of [
    {
      agentName: "Victoria",
      action: "Initiated manufacturing pipeline for Health vertical",
      module: "ai-ceo",
      outcome: "Pipeline queued",
    },
    {
      agentName: "Morgan",
      action: "Detected demand spike in wireless accessories",
      module: "intelligence",
      outcome: "+34% demand signal",
    },
    {
      agentName: "Alex",
      action: "Auto-swapped supplier for Atlas Fintech SKU-4421",
      module: "suppliers",
      outcome: "Fulfillment restored",
    },
    {
      agentName: "Taylor",
      action: "Paused underperforming Meta ad set",
      module: "ads",
      outcome: "Saved $840/day",
    },
    {
      agentName: "Nova",
      action: "Escalated billing dispute to finance module",
      module: "support",
      outcome: "Refund authorized",
    },
  ]) {
    activity.record({ workspaceId, ...event });
  }

  products.create({
    workspaceId,
    id: scopedId(workspaceId, "p1"),
    name: "ProFlex Wireless Earbuds",
    score: 94,
    demand: "High",
    marginCents: 2840,
    trend: "Meta trending +42%",
  });
  products.create({
    workspaceId,
    id: scopedId(workspaceId, "p2"),
    name: "EcoBlend Protein Kit",
    score: 91,
    demand: "High",
    marginCents: 1980,
    trend: "Seasonal peak in 3 weeks",
  });
  products.create({
    workspaceId,
    id: scopedId(workspaceId, "p3"),
    name: "SmartDesk Organizer Pro",
    score: 87,
    demand: "Medium",
    marginCents: 1420,
    trend: "Stable demand",
  });

  suppliers.create({
    workspaceId,
    id: scopedId(workspaceId, "s1"),
    name: "Nexus Fulfillment",
    region: "US / EU",
    productCount: 142,
    reliability: 98,
    avgShipDays: 4.2,
    status: "healthy",
  });
  suppliers.create({
    workspaceId,
    id: scopedId(workspaceId, "s2"),
    name: "GlobalSource Direct",
    region: "Asia-Pacific",
    productCount: 89,
    reliability: 94,
    avgShipDays: 7.1,
    status: "healthy",
  });
  suppliers.create({
    workspaceId,
    id: scopedId(workspaceId, "s3"),
    name: "PrimeDrop Logistics",
    region: "North America",
    productCount: 56,
    reliability: 87,
    avgShipDays: 5.8,
    status: "degraded",
  });

  campaigns.create({
    workspaceId,
    id: scopedId(workspaceId, "m1"),
    companyId: c1.id,
    name: "Meridian — Summer Scale",
    channel: "Multi-channel",
    status: "Active",
    reach: "2.4M",
    conversion: "3.8%",
  });
  campaigns.create({
    workspaceId,
    id: scopedId(workspaceId, "m2"),
    companyId: c2.id,
    name: "Vertex — Retention Loop",
    channel: "Email + Content",
    status: "Active",
    reach: "890K",
    conversion: "12.1%",
  });

  ads.create({
    workspaceId,
    channel: "Meta",
    spendCents: 1_240_000,
    roas: 4.2,
    status: "Live",
  });
  ads.create({
    workspaceId,
    channel: "Google",
    spendCents: 810_000,
    roas: 3.6,
    status: "Live",
  });
  ads.create({
    workspaceId,
    channel: "TikTok",
    spendCents: 320_000,
    roas: 2.9,
    status: "Paused",
  });

  orders.create({
    workspaceId,
    id: scopedId(workspaceId, "1042"),
    companyId: c1.id,
    companyName: "Meridian Commerce",
    productName: "ProFlex Earbuds",
    totalCents: 8900,
    profitCents: 3420,
    status: "Shipped",
  });
  orders.create({
    workspaceId,
    id: scopedId(workspaceId, "1041"),
    companyId: c4.id,
    companyName: "Atlas Fintech",
    productName: "Budget Tracker Pro",
    totalCents: 14900,
    profitCents: 6240,
    status: "Processing",
  });

  tickets.create({
    workspaceId,
    id: scopedId(workspaceId, "t1"),
    subject: "Where is my order #1042?",
    customerName: "Sarah M.",
    status: "Resolved",
    agentName: "Nova",
    resolutionSeconds: 42,
  });
  tickets.create({
    workspaceId,
    id: scopedId(workspaceId, "t2"),
    subject: "Refund request — damaged item",
    customerName: "James K.",
    status: "In progress",
    agentName: "Nova",
    resolutionSeconds: null,
  });
  tickets.create({
    workspaceId,
    id: scopedId(workspaceId, "t3"),
    subject: "How do I upgrade my plan?",
    customerName: "Priya R.",
    status: "Resolved",
    agentName: "Nova",
    resolutionSeconds: 18,
  });

  decisions.ensureDefaults(workspaceId);

  logger.info({ workspaceId, companies: 4 }, "Domain data seeded");
}
