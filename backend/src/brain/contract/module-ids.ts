/** Canonical intelligence module identifiers for the Brain Contract layer. */
export const INTELLIGENCE_MODULE_IDS = [
  "product-scout",
  "product-intelligence",
  "market-intelligence",
  "financial-intelligence",
  "quantitative-intelligence",
  "advertising-intelligence",
  "customer-intelligence",
  "risk-intelligence",
  "decision-intelligence",
  "executive-intelligence-orchestrator",
  "supplier-intelligence",
  "marketing-strategist",
  "cfo",
  "customer-support",
  "seo",
  "pricing",
  "inventory",
  "guardian",
] as const;

export type IntelligenceModuleId = (typeof INTELLIGENCE_MODULE_IDS)[number];

export function isIntelligenceModuleId(value: string): value is IntelligenceModuleId {
  return (INTELLIGENCE_MODULE_IDS as readonly string[]).includes(value);
}

/** Static metadata for planned intelligence modules (contract catalog, no runtime engines). */
export type IntelligenceModuleCatalogEntry = {
  moduleId: IntelligenceModuleId;
  moduleName: string;
  moduleVersion: string;
  status: "active" | "prepared" | "planned";
  description: string;
};

export const INTELLIGENCE_MODULE_CATALOG: readonly IntelligenceModuleCatalogEntry[] = [
  {
    moduleId: "product-scout",
    moduleName: "AI Product Scout",
    moduleVersion: "1.0.0",
    status: "active",
    description: "Product opportunity evaluation with Empire scoring and Guardian gates",
  },
  {
    moduleId: "product-intelligence",
    moduleName: "Product Intelligence Engine",
    moduleVersion: "1.0.0",
    status: "active",
    description: "Product scoring, demand analysis, and SELL/DO_NOT_SELL/REVIEW recommendations",
  },
  {
    moduleId: "market-intelligence",
    moduleName: "Market Intelligence Engine",
    moduleVersion: "1.0.0",
    status: "active",
    description: "Market demand, country and channel opportunity analysis with ENTER/WATCH/AVOID/EXPAND recommendations",
  },
  {
    moduleId: "financial-intelligence",
    moduleName: "Financial Intelligence Engine",
    moduleVersion: "1.0.0",
    status: "active",
    description: "Revenue, margin, cash flow, ROI modelling and INVEST/HOLD/REDUCE/REVIEW recommendations (G3-04)",
  },
  {
    moduleId: "quantitative-intelligence",
    moduleName: "Quantitative Intelligence Engine",
    moduleVersion: "1.0.0",
    status: "active",
    description: "Mathematical reasoning — statistics, forecasting, probability, simulation; no executive decisions (G3-05)",
  },
  {
    moduleId: "advertising-intelligence",
    moduleName: "Advertising Intelligence Engine",
    moduleVersion: "1.0.0",
    status: "active",
    description: "Ad campaign optimisation — ROAS, CAC, budget allocation, SCALE/MAINTAIN/PAUSE/TEST (G3-06)",
  },
  {
    moduleId: "customer-intelligence",
    moduleName: "Customer Intelligence Engine",
    moduleVersion: "1.0.0",
    status: "active",
    description: "Customer segmentation, churn, LTV, satisfaction, RETAIN/ENGAGE/WIN_BACK/MONITOR (G3-07)",
  },
  {
    moduleId: "risk-intelligence",
    moduleName: "Risk Intelligence Engine",
    moduleVersion: "1.0.0",
    status: "active",
    description: "Continuous business risk assessment — marketplace, supplier, financial, operational, policy, growth (G3-08)",
  },
  {
    moduleId: "decision-intelligence",
    moduleName: "Decision Intelligence Engine",
    moduleVersion: "1.0.0",
    status: "active",
    description: "Orchestrates G3-01–G3-08 into final executive decision — never calculates raw data (G3-09)",
  },
  {
    moduleId: "executive-intelligence-orchestrator",
    moduleName: "Executive Intelligence Orchestrator",
    moduleVersion: "1.0.0",
    status: "active",
    description: "Coordinates G3 suite into unified service for Cockpit, Pillow, Assistant, Automation, Reports (G3-10)",
  },
  {
    moduleId: "supplier-intelligence",
    moduleName: "Supplier Intelligence Engine",
    moduleVersion: "1.0.0",
    status: "active",
    description: "Registry-discovered supplier scoring, reliability, risk, and SELL/REVIEW/REJECT recommendations (G3-03)",
  },
  {
    moduleId: "marketing-strategist",
    moduleName: "Marketing Strategist",
    moduleVersion: "0.0.1",
    status: "planned",
    description: "Campaign strategy, content planning, and channel optimization",
  },
  {
    moduleId: "cfo",
    moduleName: "AI CFO",
    moduleVersion: "0.0.1",
    status: "planned",
    description: "Financial analysis, margin signals, and treasury-aware recommendations",
  },
  {
    moduleId: "customer-support",
    moduleName: "Customer Support",
    moduleVersion: "0.0.1",
    status: "planned",
    description: "Customer issue triage, retention signals, and support recommendations",
  },
  {
    moduleId: "seo",
    moduleName: "SEO Intelligence",
    moduleVersion: "0.0.1",
    status: "planned",
    description: "Search visibility analysis and organic growth recommendations",
  },
  {
    moduleId: "pricing",
    moduleName: "Pricing Intelligence",
    moduleVersion: "0.0.1",
    status: "planned",
    description: "Dynamic pricing analysis and margin-aware price recommendations",
  },
  {
    moduleId: "inventory",
    moduleName: "Inventory Intelligence",
    moduleVersion: "0.0.1",
    status: "planned",
    description: "Stock level monitoring, reorder signals, and fulfillment risk alerts",
  },
  {
    moduleId: "guardian",
    moduleName: "Guardian",
    moduleVersion: "1.0.0",
    status: "active",
    description: "Risk assessment, architecture validation, and policy enforcement gates",
  },
] as const;
