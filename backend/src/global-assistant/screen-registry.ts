import type { AssistantScreenContext } from "./models/global-assistant.js";

type ScreenEntry = Omit<AssistantScreenContext, "screenPath">;

const SCREEN_REGISTRY: Array<ScreenEntry & { pathPrefix: string }> = [
  { pathPrefix: "/dashboard/command", screenId: "empire-command", screenTitle: "Empire Command Center", uxId: "UX-004", purpose: "Executive metrics and health", boundApis: ["/ecommerce-os/dashboard"], journeyMarkers: ["REAL-051"] },
  { pathPrefix: "/dashboard/success-001", screenId: "success-001", screenTitle: "SUCCESS-001 Command Center", uxId: "UX-003", purpose: "USD 100K net profit mission", boundApis: ["/success-001-command-center/dashboard"], journeyMarkers: ["REAL-035", "MS-A"] },
  { pathPrefix: "/dashboard/intelligence", screenId: "product-discovery", screenTitle: "Business Intelligence", uxId: "UX-005", purpose: "Product intelligence queue and discovery", boundApis: ["/product-discovery/sessions", "/commerce-intelligence-core/queue", "/commerce-intelligence-core/pillow-context"], journeyMarkers: ["REAL-066", "PILLOW-020"] },
  { pathPrefix: "/dashboard/suppliers", screenId: "supplier-intelligence", screenTitle: "Supplier Intelligence", uxId: "UX-006", purpose: "Supplier options and risk", boundApis: ["/supplier-intelligence/dashboard"], journeyMarkers: ["SUP"] },
  { pathPrefix: "/dashboard/marketplaces", screenId: "marketplace-intelligence", screenTitle: "Marketplace Intelligence", uxId: "UX-007", purpose: "Country and marketplace comparison", boundApis: ["/global-marketplace-operations/dashboard"], journeyMarkers: ["REAL-072"] },
  { pathPrefix: "/dashboard/advertising", screenId: "advertising", screenTitle: "Advertising", uxId: "UX-008", purpose: "ROAS and spend efficiency", boundApis: ["/global-advertising-intelligence/dashboard"], journeyMarkers: ["REAL-038"] },
  { pathPrefix: "/dashboard/operations", screenId: "commerce-operations", screenTitle: "Commerce Operations", uxId: "UX-009", purpose: "Orders and fulfillment", boundApis: ["/customer-orders/pipelines"], journeyMarkers: ["REAL-037"] },
  { pathPrefix: "/dashboard/debate", screenId: "executive-debate", screenTitle: "Executive Debate", uxId: "UX-012", purpose: "Council debate surface", boundApis: ["/executive-council/dashboard"], journeyMarkers: ["REAL-055"] },
  { pathPrefix: "/dashboard/approvals", screenId: "approvals", screenTitle: "Approvals Center", uxId: "UX-014", purpose: "Grand King decision queue", boundApis: ["/grand-king-revenue-pipeline/dashboard"], journeyMarkers: ["REAL-086"] },
  { pathPrefix: "/dashboard/ai-team", screenId: "ai-team", screenTitle: "AI Team", uxId: "UX-016", purpose: "Executive chief registry", boundApis: ["/ai-chief-of-commerce/dashboard", "/ai-chief-of-growth/dashboard", "/ai-chief-of-customer/dashboard"], journeyMarkers: ["REAL-031", "REAL-032", "REAL-033"] },
  { pathPrefix: "/dashboard/pillow/learning", screenId: "executive-learning", screenTitle: "Executive Learning Review", uxId: "PILLOW-019", purpose: "Executive learning review", boundApis: ["/api/pillow/executive-learning/review"], journeyMarkers: ["PILLOW"] },
  { pathPrefix: "/dashboard/pillow", screenId: "executive-companion", screenTitle: "Executive Companion", uxId: "PILLOW-019", purpose: "Pillow Executive Companion", boundApis: ["/api/pillow/chat"], journeyMarkers: ["PILLOW"] },
  { pathPrefix: "/dashboard/integrations", screenId: "integrations-hub", screenTitle: "Integrations Hub", uxId: "UX-024", purpose: "External platform connectivity", boundApis: ["/integrations-hub/dashboard"], journeyMarkers: ["IH-001", "REAL-051A"] },
  { pathPrefix: "/dashboard/settings", screenId: "settings", screenTitle: "Empire Settings", uxId: "UX-021", purpose: "Account and empire settings", boundApis: ["/reality-integration/dashboard"], journeyMarkers: [] },
  { pathPrefix: "/dashboard/operating-cost", screenId: "treasury", screenTitle: "Profit & Operating Cost", uxId: "UX-010", purpose: "Treasury and operating cost", boundApis: ["/empire-cashflow-engine/dashboard"], journeyMarkers: [] },
  { pathPrefix: "/dashboard/billing", screenId: "billing", screenTitle: "Billing", uxId: "UX-022", purpose: "Plan and payment", boundApis: [], journeyMarkers: [] },
  { pathPrefix: "/dashboard/explorer", screenId: "commercial-explorer", screenTitle: "Commercial Explorer", uxId: "UX-023", purpose: "Commercial entity index", boundApis: ["/commercial-explorer/dashboard"], journeyMarkers: ["REAL-066"] },
  { pathPrefix: "/dashboard/infrastructure/marketplaces", screenId: "extension-marketplace", screenTitle: "Marketplace Connectors", uxId: "UX-020", purpose: "Amazon, Shopify, and marketplace portals", boundApis: ["/marketplace-infrastructure/connections"], journeyMarkers: ["REAL-002"] },
  { pathPrefix: "/dashboard/infrastructure/suppliers", screenId: "extension-supplier", screenTitle: "Supplier Connectors", uxId: "UX-020", purpose: "CJ Dropshipping and supplier portals", boundApis: ["/supplier-intelligence/dashboard"], journeyMarkers: ["SUP"] },
  { pathPrefix: "/dashboard/infrastructure", screenId: "infrastructure", screenTitle: "Infrastructure", uxId: "UX-020", purpose: "Connectors and accounts", boundApis: ["/reality-integration/dashboard"], journeyMarkers: ["REAL-002"] },
  { pathPrefix: "/dashboard/brands", screenId: "brand-workspace", screenTitle: "Brand Workspace", uxId: "UX-017", purpose: "Business portfolio", boundApis: ["/business-workspace/dashboard"], journeyMarkers: [] },
  { pathPrefix: "/dashboard/launch", screenId: "launch-mission", screenTitle: "Launch Mission", uxId: "UX-018", purpose: "Product launch missions and approval-gated automation", boundApis: ["/commerce-intelligence-core/missions", "/commerce-intelligence-core/launch-status", "/commerce-intelligence-core/follow-up-missions", "/commerce-intelligence-core/pillow-context"], journeyMarkers: ["PILLOW-020", "REAL-077"] },
  { pathPrefix: "/dashboard/soul", screenId: "soul-chamber", screenTitle: "Soul Decision Chamber", uxId: "UX-013", purpose: "Soul recommendation", boundApis: ["/soul-decision-chamber/dashboard"], journeyMarkers: ["REAL-056"] },
  { pathPrefix: "/dashboard/king-history", screenId: "king-history", screenTitle: "King Decision History", uxId: "UX-015", purpose: "Logged verdicts", boundApis: ["/king-decision-history/dashboard"], journeyMarkers: ["REAL-086"] },
  { pathPrefix: "/dashboard", screenId: "mission-home", screenTitle: "Mission Home", uxId: "UX-002", purpose: "Daily mission briefing", boundApis: ["/executive-surveillance/dashboard"], journeyMarkers: ["GC-03", "GC-05"] },
];

/** GC-05 — Resolve current screen metadata from route path. */
export function resolveScreenContext(screenPath: string): AssistantScreenContext {
  const normalized = screenPath.split("?")[0] ?? screenPath;
  const sorted = [...SCREEN_REGISTRY].sort((a, b) => b.pathPrefix.length - a.pathPrefix.length);
  const match =
    sorted.find((entry) => normalized === entry.pathPrefix || normalized.startsWith(`${entry.pathPrefix}/`)) ??
    sorted.find((entry) => entry.pathPrefix === "/dashboard" && normalized.startsWith("/dashboard"));

  if (!match) {
    return {
      screenPath: normalized,
      screenId: "unknown",
      screenTitle: "EmpireAI",
      purpose: "General empire operations",
      boundApis: [],
      journeyMarkers: [],
    };
  }

  const { pathPrefix: _pathPrefix, ...context } = match;
  return { ...context, screenPath: normalized };
}
